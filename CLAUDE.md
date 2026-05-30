# CLAUDE.md

This file documents conventions, workflows, and key information for AI assistants (and humans) working in this repository.

---

## Repository Overview

**Repository:** `tzigerlig/wm-b-rse`

**WM-Börse** is a World Cup 2026 prediction market platform where users can trade positions on match outcomes, group standings, and tournament progression.

---

## Project Structure

```
/
├── wm2026-boerse/     # Full-stack Next.js 16 app (primary project)
│   ├── src/app/       # App Router pages, layouts, API routes
│   ├── public/        # Static assets
│   └── CLAUDE.md      # Subproject-specific docs (read this too)
└── CLAUDE.md          # This file (repo-level conventions)
```

**Each subdirectory has its own CLAUDE.md.** Read the subproject CLAUDE.md before working in that directory.

---

## Development Branch

All AI-assisted changes must be developed on feature branches. The convention used by Claude Code sessions is:

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
- Read the subproject CLAUDE.md for framework-specific rules (e.g., Next.js 16 breaking changes).
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

All commands must be run from within the subproject directory.

| Command | Directory | Description |
|---------|-----------|-------------|
| `npm run dev` | `wm2026-boerse/` | Start dev server on port 3000 |
| `npm run build` | `wm2026-boerse/` | Production build |
| `npm run lint` | `wm2026-boerse/` | Run ESLint |

---

## Updating This File

- Add new subprojects to the **Project Structure** diagram when they are created.
- Document new top-level commands in the **Commands** table.
- Each subproject maintains its own CLAUDE.md for framework/language-specific detail.
