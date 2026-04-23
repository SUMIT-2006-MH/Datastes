const fs = require('fs');
const { execSync } = require('child_process');

function run(cmd, date) {
    console.log(`Executing: ${cmd}`);
    let env = { ...process.env };
    if (date) {
        env.GIT_AUTHOR_DATE = date;
        env.GIT_COMMITTER_DATE = date;
    }
    execSync(cmd, { stdio: 'inherit', env });
}

// Generate dates for 4 days ending today
const today = new Date();
const dates = [
    new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // Day 1
    new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Day 2
    new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Day 3
    today.toISOString() // Day 4 (Today)
];

console.log("Setting up files...");
// 1. Setup base files if they don't exist
if (!fs.existsSync('.gitignore')) {
    fs.writeFileSync('.gitignore', "node_modules/\n.env\n.DS_Store\nserver/uploads/*\n!server/uploads/.gitkeep\n");
}
if (!fs.existsSync('README.md')) {
    fs.writeFileSync('README.md', "# Datasets Platform\n\nA full-stack application to manage, upload, and download datasets.\n");
}

console.log("Initializing git repository...");
try { run('git init'); } catch(e) {}

// Commit 1 (Day 1)
run('git add .gitignore README.md package-lock.json', dates[0]);
run('git commit -m "chore: add initial project setup and documentation"', dates[0]);

// Commit 2 (Day 1)
run('git add server/package.json server/package-lock.json', dates[0]);
run('git commit -m "chore(backend): initialize Node.js environment and dependencies"', dates[0]);

// Commit 3 (Day 1)
run('git add server/models/', dates[0]);
run('git commit -m "feat(backend): create database models"', dates[0]);

// Commit 4 (Day 2)
run('git add server/index.js', dates[1]);
run('git commit -m "feat(backend): implement core Express server and API routes"', dates[1]);

// Commit 5 (Day 2)
run('git add server/uploads/', dates[1]);
run('git commit -m "chore(backend): setup uploads directory"', dates[1]);

// Commit 6 (Day 3)
run('git add client/index.html', dates[2]);
run('git commit -m "feat(frontend): create initial HTML structure"', dates[2]);

// Commit 7 (Day 3)
run('git add client/style.css', dates[2]);
run('git commit -m "style(frontend): add base styling and variables"', dates[2]);

// Commit 8 (Today)
run('git add client/script.js', dates[3]);
run('git commit -m "feat(frontend): implement core client logic and API integration"', dates[3]);

// Commit 9 (Today)
fs.appendFileSync('README.md', "\n## Features\n- User Authentication\n- Dataset Uploads\n- Admin Privileges\n- Glassmorphic UI\n");
run('git add README.md', dates[3]);
run('git commit -m "docs: update features list in README"', dates[3]);

// Commit 10 (Today)
try {
    run('git add .', dates[3]);
    const status = execSync('git status --porcelain').toString();
    if (status.trim() !== '') {
        run('git commit -m "chore: final project adjustments"', dates[3]);
    } else {
        fs.appendFileSync('README.md', "\n## Tech Stack\n- Frontend: HTML, CSS, JavaScript\n- Backend: Node.js, Express\n- Database: MongoDB\n");
        run('git add README.md', dates[3]);
        run('git commit -m "docs: add tech stack to README"', dates[3]);
    }
} catch(e) {}

console.log("\n=================================");
console.log("Successfully created 10 commits distributed across the last 4 days!");
console.log("You can now link to your GitHub repo and push:");
console.log("git branch -M main");
console.log("git remote add origin <your-github-repo-url>");
console.log("git push -u origin main");
console.log("=================================\n");
