import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const readmePath = path.join(process.cwd(), 'README.md');

try {
    // Get current git branch
    const branch = execSync('git branch --show-current').toString().trim();

    if (!branch) {
        console.error('Could not detect current branch.');
        process.exit(1);
    }

    const readmeContent = fs.readFileSync(readmePath, 'utf8');

    // Regex to replace tree/<branch> with tree/<current-branch>
    // Looks for: budget-it/tree/<something>
    const updatedContent = readmeContent.replace(
        /(budget-it\/tree\/)([^"'\s.?]+)/g,
        `$1${branch}`
    );

    if (readmeContent !== updatedContent) {
        fs.writeFileSync(readmePath, updatedContent);
        console.log(`Updated README.md badge to track branch: ${branch}`);
    }

} catch (error) {
    console.error('Error updating badge:', error);
    process.exit(1);
}
