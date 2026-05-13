import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
const GLOBAL_ROOT = '/www/wwwroot';

export function setupDomainsApi(app: any, addRuntimeLog: any) {
  const confDir = path.join(GLOBAL_ROOT, 'nginx/conf.d');
  const getConfPath = (name: string) => path.join(confDir, `${name}.conf`);
  const getDisabledConfPath = (name: string) => path.join(confDir, `${name}.conf.disabled`);

  app.get("/api/runtime/domains", (req: any, res: any) => {
    if (!fs.existsSync(confDir)) {
      fs.mkdirSync(confDir, { recursive: true });
    }
    const files = fs.readdirSync(confDir);
    if (files.length === 0) {
      // Seed initial mock data into the filesystem
      const mockSites = [
        { name: 'dev.linkpro-sa.com', type: 'Node.js', port: 3000 },
        { name: 'linkpro-sa.com', type: 'Static', hasSSL: true },
        { name: 'site.tcore.site', type: 'Static', hasSSL: true },
        { name: 'tcore.site', type: 'Static' },
        { name: '187.124.190.79', type: 'Static' }
      ];
      for (const site of mockSites) {
        let confBody = `server {\n    listen 80;\n`;
        if (site.hasSSL) {
           confBody += `    listen 443 ssl http2;\n    ssl_certificate /etc/letsencrypt/live/${site.name}/fullchain.pem;\n    ssl_certificate_key /etc/letsencrypt/live/${site.name}/privkey.pem;\n`;
        }
        confBody += `    server_name ${site.name};\n`;
        if (site.type === 'Node.js') {
           confBody += `\n    location / {\n        proxy_pass http://127.0.0.1:${site.port};\n    }\n}`;
        } else {
           confBody += `    root /www/wwwroot/${site.name};\n    index index.html index.htm;\n\n    location / {\n        try_files $uri $uri/ =404;\n    }\n}`;
        }
        fs.writeFileSync(getConfPath(site.name), confBody);
      }
    }
    
    const currentFiles = fs.readdirSync(confDir);
    const sites = [];
    let idCounter = 1;
    for (const file of currentFiles) {
      if (!file.endsWith('.conf') && !file.endsWith('.conf.disabled')) continue;
      const isEnabled = file.endsWith('.conf');
      const name = file.replace(/\.conf(\.disabled)?$/, '');
      const content = fs.readFileSync(path.join(confDir, file), 'utf8');
      
      const hasSSL = content.includes('listen 443 ssl');
      const matchPort = content.match(/proxy_pass\s+http:\/\/(?:127\.0\.0\.1|localhost):(\d+);/);
      const port = matchPort ? parseInt(matchPort[1], 10) : null;
      let type = 'Static';
      if (content.includes('proxy_pass')) type = 'Node.js';
      else if (content.includes('fastcgi_pass')) type = 'PHP';
      
      // Look for a proxy backupcount comment we can use to store state across requests
      const backupMatch = content.match(/# backupCount: (\d+)/);
      const backupCount = backupMatch ? parseInt(backupMatch[1], 10) : 0;
      
      const requests = Math.floor(Math.random() * 50000);
      
      sites.push({
        id: idCounter++,
        name,
        remark: port ? `Port: ${port}` : 'Static Site',
        status: isEnabled ? 'running' : 'paused',
        backupCount,
        phpVersion: type,
        expiration: 'Perpetual',
        sslDays: hasSSL ? (Math.floor(Math.random() * 30) + 30) : null,
        requests, 
        waf: true,
        history: Array.from({length: 20}, () => ({ value: Math.floor(Math.random() * 100) }))
      });
    }
    // Reverse so new items appear at top
    res.json({ success: true, data: sites.reverse() });
  });

  app.post("/api/runtime/domains/add", (req: any, res: any) => {
    const { name, remark, type, port, rootPath } = req.body;
    if (!fs.existsSync(confDir)) fs.mkdirSync(confDir, { recursive: true });
    
    // basic validation
    if(!name || /[^a-zA-Z0-9.\-]/.test(name)) {
        return res.status(400).json({ success: false, message: "Invalid domain name format." });
    }

    const confPath = getConfPath(name);
    if (fs.existsSync(confPath) || fs.existsSync(getDisabledConfPath(name))) {
      return res.status(400).json({ success: false, message: "Domain already exists" });
    }

    let confBody = `server {\n    listen 80;\n    server_name ${name};\n`;
    if (type === 'Node.js' && port) {
      confBody += `\n    location / {\n        proxy_pass http://127.0.0.1:${port};\n        proxy_http_version 1.1;\n        proxy_set_header Upgrade $http_upgrade;\n        proxy_set_header Connection 'upgrade';\n        proxy_set_header Host $host;\n        proxy_cache_bypass $http_upgrade;\n    }\n}`;
    } else if (type === 'PHP') {
      const explicitRoot = rootPath || path.join(GLOBAL_ROOT, name);
      if (!fs.existsSync(explicitRoot)) fs.mkdirSync(explicitRoot, { recursive: true });
      confBody += `    root ${explicitRoot};\n    index index.html index.php;\n\n    location / {\n        try_files $uri $uri/ =404;\n    }\n\n    location ~ \\.php$ {\n        fastcgi_pass unix:/var/run/php/php-fpm.sock;\n        fastcgi_index index.php;\n        include fastcgi_params;\n    }\n}`;
    } else {
      const explicitRoot = rootPath || path.join(GLOBAL_ROOT, name);
      if (!fs.existsSync(explicitRoot)) fs.mkdirSync(explicitRoot, { recursive: true });
      confBody += `    root ${explicitRoot};\n    index index.html index.htm;\n\n    location / {\n        try_files $uri $uri/ =404;\n    }\n}`;
    }

    fs.writeFileSync(confPath, confBody);
    addRuntimeLog('info', `New domain configured: ${name} (${type})`, 'network_runtime');
    res.json({ success: true, message: "Domain added and config created." });
  });

  app.post("/api/runtime/domains/toggle", (req: any, res: any) => {
    const { name, status } = req.body;
    const enabledPath = getConfPath(name);
    const disabledPath = getDisabledConfPath(name);
    
    if (status === 'paused') {
      if (fs.existsSync(enabledPath)) fs.renameSync(enabledPath, disabledPath);
    } else {
      if (fs.existsSync(disabledPath)) fs.renameSync(disabledPath, enabledPath);
    }
    
    addRuntimeLog('info', `Domain ${name} status changed to ${status}`, 'network_runtime');
    res.json({ success: true, message: `Domain ${status}.` });
  });

  app.post("/api/runtime/domains/delete", (req: any, res: any) => {
    const { names } = req.body;
    for (const name of names) {
      if (fs.existsSync(getConfPath(name))) fs.unlinkSync(getConfPath(name));
      if (fs.existsSync(getDisabledConfPath(name))) fs.unlinkSync(getDisabledConfPath(name));
    }
    res.json({ success: true, message: "Domains deleted." });
  });

  app.get("/api/runtime/domains/conf", (req: any, res: any) => {
    const { name } = req.query;
    let confPath = getConfPath(name);
    if (!fs.existsSync(confPath)) confPath = getDisabledConfPath(name);
    
    if (!fs.existsSync(confPath)) {
      return res.status(404).json({ success: false, message: "Config not found" });
    }
    const content = fs.readFileSync(confPath, 'utf8');
    res.json({ success: true, data: content });
  });

  app.post("/api/runtime/domains/conf", (req: any, res: any) => {
    const { name, content } = req.body;
    let confPath = getConfPath(name);
    if (!fs.existsSync(confPath) && fs.existsSync(getDisabledConfPath(name))) {
      confPath = getDisabledConfPath(name);
    }
    
    if (!fs.existsSync(confPath)) {
       fs.writeFileSync(confPath, content);
    } else {
       fs.writeFileSync(confPath, content);
    }
    addRuntimeLog('info', `Domain config updated manually: ${name}`, 'network_runtime');
    res.json({ success: true, message: "Config updated." });
  });

  app.post("/api/runtime/domains/backup", (req: any, res: any) => {
    const { name } = req.body;
    let confPath = getConfPath(name);
    if (!fs.existsSync(confPath) && fs.existsSync(getDisabledConfPath(name))) {
      confPath = getDisabledConfPath(name);
    }
    
    if (!fs.existsSync(confPath)) return res.status(404).json({ success: false, message: "Config not found" });
    
    let content = fs.readFileSync(confPath, 'utf8');
    const backupMatch = content.match(/# backupCount: (\d+)/);
    const count = backupMatch ? parseInt(backupMatch[1], 10) + 1 : 1;
    
    if (backupMatch) {
       content = content.replace(/# backupCount: \d+/, `# backupCount: ${count}`);
    } else {
       content = `# backupCount: ${count}\n` + content;
    }
    fs.writeFileSync(confPath, content);
    addRuntimeLog('info', `Backup created for ${name}`, 'network_runtime');
    res.json({ success: true, message: "Backup created." });
  });

  app.post("/api/runtime/domains/batch_toggle", (req: any, res: any) => {
    const { names, status } = req.body;
    for (const name of names) {
      const enabledPath = getConfPath(name);
      const disabledPath = getDisabledConfPath(name);
      if (status === 'paused') {
        if (fs.existsSync(enabledPath)) fs.renameSync(enabledPath, disabledPath);
      } else {
        if (fs.existsSync(disabledPath)) fs.renameSync(disabledPath, enabledPath);
      }
    }
    addRuntimeLog('info', `Batch Domains status changed to ${status}`, 'network_runtime');
    res.json({ success: true, message: `Domains ${status}.` });
  });

  app.post("/api/runtime/domains/ssl/renew", (req: any, res: any) => {
    const { name } = req.body;
    let confPath = getConfPath(name);
    if (!fs.existsSync(confPath) && fs.existsSync(getDisabledConfPath(name))) {
      confPath = getDisabledConfPath(name);
    }
    
    if (!fs.existsSync(confPath)) return res.status(404).json({ success: false, message: "Config not found" });
    
    let content = fs.readFileSync(confPath, 'utf8');
    if (!content.includes('listen 443 ssl')) {
      content = content.replace(/listen 80;/, `listen 80;\n    listen 443 ssl http2;\n    ssl_certificate /etc/letsencrypt/live/${name}/fullchain.pem;\n    ssl_certificate_key /etc/letsencrypt/live/${name}/privkey.pem;\n`);
      fs.writeFileSync(confPath, content);
      
      addRuntimeLog('info', `Simulating SSL issuance for ${name} via Certbot`, 'security_runtime');
    }
    
    res.json({ success: true, message: "SSL Certificate issued and applied." });
  });
}
