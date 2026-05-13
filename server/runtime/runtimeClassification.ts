import fs from 'fs';
import path from 'path';

export interface RuntimeOperationalAwareness {
    runtime_classification: string;
    runtime_domain: string;
    runtime_pm2: boolean;
    runtime_health: string;
    runtime_database: string;
    runtime_deploy_state: string;
}

export async function classifyRuntime(targetPath: string): Promise<RuntimeOperationalAwareness> {
    const name = path.basename(targetPath).toLowerCase();
    let classification = "UNVERIFIED RUNTIME";
    let domain = "";
    let pm2Active = false;
    let health = "Unknown";
    let database = "None";
    let deployState = "Unverified";

    // DB Discovery Layer
    const envPath = path.join(targetPath, '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const hasDbHost = envContent.includes('DB_HOST');
        const DB_DRIVER = envContent.match(/DB_CONNECTION=(.*)/)?.[1] || "";
        if (hasDbHost) database = DB_DRIVER || "Configured";
    }

    // PM2 Intelligence & Nginx Intelligence
    if (fs.existsSync(path.join(targetPath, 'ecosystem.config.js')) || fs.existsSync(path.join(targetPath, 'ecosystem.config.cjs')) || fs.existsSync(path.join(targetPath, 'package.json'))) {
        pm2Active = true; 
    }

    // Domain Intelligence
    const nginxPath = '/www/server/panel/vhost/nginx';
    const altNginxPath = '/etc/nginx/conf.d';
    // We simulate domain mapping, if we find a conf file that uses this targetPath.
    const checkDomain = (confDir: string) => {
        if (!fs.existsSync(confDir)) return false;
        const files = fs.readdirSync(confDir);
        for (const file of files) {
            if (file.endsWith('.conf')) {
                const confContent = fs.readFileSync(path.join(confDir, file), 'utf8');
                if (confContent.includes(targetPath)) {
                    const match = confContent.match(/server_name\s+([^;\s]+)/);
                    if (match && match[1]) {
                        domain = match[1];
                        return true;
                    }
                }
            }
        }
        return false;
    };

    const hasDomain = checkDomain(nginxPath) || checkDomain(altNginxPath) || checkDomain(path.join(process.cwd(), 'nginx/conf.d'));

    // Stage 3 Classification Rules:
    if (name.includes('backup-')) {
        classification = "Backup Runtime";
    } else if (name === 'safe-before-ui' || name.includes('snapshot-')) {
        classification = "Snapshot Runtime";
    } else if (name.includes('rollback-')) {
        classification = "Recovery Runtime";
    } else if (name.includes('archive-')) {
        classification = "Archived Runtime";
    } else if (name.includes('temp-')) {
        classification = "Temporary Runtime";
    } else if (name.includes('old-')) {
        classification = "Legacy Runtime";
    } else if (name.includes('staging')) {
        classification = "Staging Runtime";
    } else if (name.includes('dev')) {
        classification = "Development Runtime";
    } else if (pm2Active && hasDomain) {
        classification = "Production Runtime";
        health = "Healthy";
        deployState = "Active";
    } else {
        classification = "UNVERIFIED RUNTIME";
    }

    return {
        runtime_classification: classification,
        runtime_domain: domain,
        runtime_pm2: pm2Active,
        runtime_health: health,
        runtime_database: database,
        runtime_deploy_state: deployState
    };
}
