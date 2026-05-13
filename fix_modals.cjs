const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            // Target modals that look like: `className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl ...`
            // Let's replace the common background fragments inside these modal classes with a clean glass-panel
            
            // `bg-[#0d121f]` -> `glass-panel bg-transparent`
            content = content.replace(/className="((?:[^"]*)relative w-full max-w-[a-z0-9]+(?:[^"]*))bg-\[#[0-9a-fA-F]+\]((?:[^"]*))"/g, 
                'className="$1 glass-panel $2"');

            content = content.replace(/className="((?:[^"]*)relative w-full max-w-[a-z0-9]+(?:[^"]*))bg-slate-900((?:[^"]*))"/g, 
                'className="$1 glass-panel $2"');
                
            content = content.replace(/className="((?:[^"]*)relative w-full max-w-[a-z0-9]+(?:[^"]*))bg-slate-950((?:[^"]*))"/g, 
                'className="$1 glass-panel $2"');

            // Remove duplicated border border-white/x that glass panel already provides
            content = content.replace(/glass-panel ([^"]*)border border-white\/(?:5|10)([^"]*)/g, 'glass-panel $1$2');


            // Some custom cleanup
            content = content.replace(/  +/g, ' ');

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated Modals in ${fullPath}`);
            }
        }
    }
}

processDir('./src/pages');
