# Project Structure

## Current Organization

```
.
├── .git/              # Git version control
├── .kiro/             # Kiro AI assistant configuration
│   └── steering/      # AI steering rules and guidelines
├── .vscode/           # VSCode editor settings
├── kiro-logo.png      # Project asset
└── package-lock.json  # npm dependency lock file
```

## Conventions

### File Organization
- Configuration files at root level
- Kiro-specific files in `.kiro/` directory
- Editor settings in `.vscode/` directory

### Version Control
- Git repository initialized
- Standard git hooks available in `.git/hooks/`

## Notes
This is a minimal project structure. As the project grows, consider organizing code into standard directories such as:
- `src/` for source code
- `test/` or `__tests__/` for test files
- `dist/` or `build/` for compiled output
- `docs/` for documentation
