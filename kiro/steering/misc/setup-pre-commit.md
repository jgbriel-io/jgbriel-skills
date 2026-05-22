---
inclusion: manual
description: Set up Husky pre-commit hooks with lint-staged (Prettier), type checking, and tests
---

# Setup Pre-Commit Hooks

Sets up: **Husky** pre-commit hook + **lint-staged** (Prettier) + optional typecheck + test.

## Steps

### 1. Detect package manager
`package-lock.json` → npm | `pnpm-lock.yaml` → pnpm | `yarn.lock` → yarn | `bun.lockb` → bun. Default: npm.

### 2. Install devDependencies
```
husky lint-staged prettier
```

### 3. Initialize Husky
```bash
npx husky init
```
Creates `.husky/` and adds `"prepare": "husky"` to package.json.

### 4. Create `.husky/pre-commit`
```
npx lint-staged
npm run typecheck
npm run test
```
Replace `npm` with detected package manager. Omit `typecheck`/`test` if scripts missing in package.json.

### 5. Create `.lintstagedrc`
```json
{ "*": "prettier --ignore-unknown --write" }
```

### 6. Create `.prettierrc` (if missing)
```json
{
  "useTabs": false,
  "tabWidth": 2,
  "printWidth": 80,
  "singleQuote": false,
  "trailingComma": "es5",
  "semi": true,
  "arrowParens": "always"
}
```

### 7. Verify
- [ ] `.husky/pre-commit` exists and is executable
- [ ] `.lintstagedrc` exists
- [ ] `prepare` script in package.json is `"husky"`
- [ ] Run `npx lint-staged` to verify

### 8. Commit
Stage all changed files and commit: `Add pre-commit hooks (husky + lint-staged + prettier)`
