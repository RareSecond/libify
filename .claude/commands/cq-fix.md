---
name: "Code Quality Fix"
description: "Run code quality checks and automatically fix all issues"
---

# 🔧 CODE QUALITY FIX: Automated Quality Checks & Fixes

**Purpose**: Run all code quality checks and automatically fix issues
**Location**: Must be run from `.`
**Next**: Use `commit-message.md` to generate an appropriate commit message

## Instructions

I'm running comprehensive code quality checks and fixing all issues. This command:

1. **Runs `npm run cq:local` from root** - Executes all code quality checks with auto-fixing enabled
2. **Handles remaining issues** - Fix any issues that couldn't be auto-fixed
3. **Resolves ESLint/TS conflicts in DTOs** - Extract types when ordering conflicts occur
4. **Verifies all checks pass** - Ensure clean codebase

## Process

### 1. Run Code Quality Check with Auto-Fix
- Change to `.` if not already there
- Run `npm run cq:local` which includes:
  - ESLint with auto-fix
  - Prettier formatting
  - TypeScript compilation check
- Capture and analyze output for any remaining issues

### 2. Fix Remaining Issues
- **TypeScript errors**: Manually fix type errors that can't be auto-fixed
- **ESLint/TS conflicts**: Handle ordering conflicts by extraction
- **Other issues**: Address any other quality problems

### 3. Handle ESLint/TS Conflicts in DTOs
When ESLint alphabetical ordering conflicts with TypeScript definition order (common in DTO files):
- Identify the DTO file with ordering conflicts
- Extract the conflicting types/interfaces to a separate file
- Import them in the DTO to satisfy TypeScript requirements
- Re-run checks to ensure resolution

### 4. Verify All Checks Pass
- Re-run `npm run cq:local` after fixes
- Ensure all checks pass without errors
- If new issues arise, repeat fixing process

### 5. Report Status
- Confirm all checks are passing
- List types of fixes applied
- Indicate readiness for commit

## Commands to Execute

```bash
# Run from root directory
cd .

# Run code quality with auto-fix
npm run cq:local        # Runs all checks with auto-fixing enabled

# Or run for specific workspaces
npm run cq:local -w backend
npm run cq:local -w frontend

# If issues remain after auto-fix, run again
npm run cq:local        # Verify all pass

# Verify all checks pass
git status              # See what was fixed
```

## Conflict Resolution Strategy

For ESLint/TypeScript ordering conflicts in DTOs:
1. Identify the DTO file with conflict (e.g., `create-product.dto.ts`)
2. Extract conflicting types/interfaces to new file
3. Name pattern: `[dto-name].types.ts` (e.g., `create-product.types.ts`)
4. Import in DTO file to maintain TypeScript requirements
5. Re-run checks to verify resolution

Example: If `create-product.dto.ts` has ordering conflicts, extract types to `create-product.types.ts`

## Output Format

```
🔧 CODE QUALITY COMPLETE

All checks passing:
✅ ESLint: No errors
✅ Prettier: Formatted
✅ TypeScript: Compiles successfully

Fixes applied:
- [Summary of auto-fixes]
- [Manual fixes if any]
- [Conflict resolutions if any]

Files modified: [N] files

Ready for commit. Use commit-message.md to generate message.
```

## What I Will Do

1. Run `npm run cq:local` to identify all issues
2. Apply automatic fixes where possible
3. Manually fix TypeScript errors
4. Extract types/interfaces to resolve ordering conflicts
5. Re-run checks until all pass
6. Report completion status

## What I Won't Do

- Generate commit messages (use commit-message.md)
- Commit changes automatically
- Skip fixing any issues
- Ignore ESLint/TS conflicts
- Make unnecessary changes
- Modify functionality (only fix quality issues)

## Success Criteria

- All code quality checks pass
- No ESLint errors or warnings
- No Prettier formatting issues
- TypeScript compiles without errors
- All conflicts resolved appropriately
- Ready for commit

## Next Step

After all quality checks pass, use `commit-message.md` to:
- Analyze all changes
- Generate appropriate commit message
- Prepare for commit