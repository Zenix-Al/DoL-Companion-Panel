# Contributor setup

Requirements: current Node.js LTS, npm, and Git.

```text
git clone https://github.com/Zenix-Al/DoL-CheatPlus.git
cd DoL-CheatPlus
npm install
npm test
npm run audit:imports
npm run check:docs
```

Source starts at `src/main.js`. Do not hand-edit distributions or the generated cheat catalog. Read [Runtime architecture](../architecture/OVERVIEW.md) before moving modules.
