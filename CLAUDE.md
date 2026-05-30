# CLAUDE.md

This file documents conventions, workflows, and key information for AI assistants (and humans) working in this repository.

---

## Repository Overview

**Repository:** `tzigerlig/wm-b-rse`

> This repository was initialized empty. Update this section once the project purpose, tech stack, and structure are established.

---

## Project Structure

> Populate this section as the codebase grows. Example structure to follow:

```
/
├── src/           # Application source code
├── tests/         # Test suites
├── docs/          # Documentation
├── scripts/       # Build and utility scripts
└── CLAUDE.md      # This file
```

---

## Development Branch

All AI-assisted changes should be developed on feature branches. The convention used by Claude Code sessions is:

- Branch pattern: `claude/<description>-<id>`
- Example: `claude/claude-md-docs-qkikr`

Always commit and push to the designated branch; never push directly to `main` without explicit permission.

---

## Git Workflow

```bash
# Create and switch to a feature branch
git checkout -b <branch-name>

# Stage specific files (never use git add -A blindly)
git add <file1> <file2>

# Commit with a descriptive message
git commit -m "short summary of change"

# Push and set upstream
git push -u origin <branch-name>
```

**Rules:**
- Never force-push to `main` or `master`.
- Never skip pre-commit hooks (`--no-verify`).
- Prefer new commits over amending published commits.
- Do not commit secrets, `.env` files, or credentials.

---

## Code Conventions

> Update these when a language/framework is chosen.

### General
- Keep functions small and focused on a single responsibility.
- Write self-documenting code with clear naming; avoid comments that restate what the code does.
- Add a comment only when the **why** is non-obvious (hidden constraints, workarounds, subtle invariants).
- Do not add error handling for scenarios that cannot happen.
- Do not introduce abstractions for hypothetical future needs.

### Testing
- Write tests alongside feature code, not after.
- Tests should cover the golden path and key edge cases.
- Do not ship features without at least one test validating the core behavior.

---

## AI Assistant Guidelines

### What to do
- Read existing code before editing to understand patterns already in use.
- Match the style and idioms of the surrounding code.
- Make the smallest change that correctly solves the task.
- Commit with a clear message explaining the **why**, not the what.
- Push to the correct feature branch when work is complete.

### What to avoid
- Do not refactor code beyond the scope of the task.
- Do not add features, flags, or configuration not requested.
- Do not create documentation files (`.md`) unless explicitly asked.
- Do not leave half-finished implementations or TODO stubs.
- Do not guess at URLs or external endpoints.

### Security
- Never introduce command injection, SQL injection, XSS, or other OWASP Top 10 vulnerabilities.
- Validate input at system boundaries (user input, external APIs) only.
- Do not store or log secrets.

---

## Commands

> Add project-specific commands here as the project grows.

| Command | Description |
|---------|-------------|
| _(none yet)_ | _(populate when build/test/lint scripts are added)_ |

---

## Updating This File

Keep CLAUDE.md current as the project evolves:
- Add the tech stack and project purpose once decided.
- Document commands as scripts are added (`npm test`, `make build`, etc.).
- Update the project structure diagram when major directories are added.
- Add language/framework-specific conventions when the stack is chosen.
