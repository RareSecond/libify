---
title: "Code Quality Fix"
description: "Run code quality checks, fix all issues, and prepare commit message"
---

# 🔧 CODE QUALITY FIX: Automated Quality Checks & Fixes

**Purpose**: Run all code quality checks, automatically fix issues, and prepare a commit message
**Location**: Must be run from the root directory of the monorepo

## Instructions

I'm running comprehensive code quality checks and fixing all issues. This command:

1. **Runs `npm run cq:local` from root** - Executes all code quality checks with auto-fixing enabled
2. **Handles remaining issues** - Fix any issues that couldn't be auto-fixed
3. **Resolves ESLint/TS conflicts in DTOs** - Extract types when ordering conflicts occur
4. **Prepares commit message** - Analyze all changes and suggest appropriate commit

## Process

### 1. Run Code Quality Check with Auto-Fix
- Change to root directory if not already there
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

### 5. Prepare Commit Message
- Run `git status` to see all modified files
- Run `git diff` to understand all changes
- Analyze the complete scope of modifications
- Generate concise, accurate commit message

## Commands to Execute

```bash
# Run from root directory
cd [project-root]

# Run code quality with auto-fix
npm run cq:local        # Runs all checks with auto-fixing enabled

# If issues remain after auto-fix, run again
npm run cq:local        # Verify all pass

# Analyze changes
git status              # All modified files
git diff --name-only    # Files changed
git log -1 --pretty=format:"%s"    # Last commit for context
```

## Conflict Resolution Strategy

For ESLint/TypeScript ordering conflicts in DTOs:
1. Identify the DTO file with conflict (e.g., `create-product.dto.ts`)
2. Extract conflicting types/interfaces to new file
3. Name pattern: `[dto-name].types.ts` (e.g., `create-product.types.ts`)
4. Import in DTO file to maintain TypeScript requirements
5. Re-run checks to verify resolution

Example: If `create-product.dto.ts` has ordering conflicts, extract types to `create-product.types.ts`

## Commit Message Format

```
🔧 CODE QUALITY COMPLETE

All checks passing:
✅ ESLint: No errors
✅ Prettier: Formatted
✅ TypeScript: Compiles successfully

Changes made:
- [Summary of fixes applied]
- [Files modified]
- [Any extractions for conflicts]

Proposed commit message:
'[concise message covering all changes]'

Ready for you to commit when convenient.
```

## What I Will Do

1. Run `npm run cq:local` to identify all issues
2. Apply automatic fixes where possible
3. Manually fix TypeScript errors
4. Extract types/interfaces to resolve ordering conflicts
5. Re-run checks until all pass
6. Analyze all changes made
7. Generate appropriate commit message
8. Present results without committing

## What I Won't Do

- Commit changes automatically
- Skip fixing any issues
- Ignore ESLint/TS conflicts
- Make unnecessary changes
- Modify functionality (only fix quality issues)
- Create commits without user approval

## Success Criteria

- All code quality checks pass
- No ESLint errors or warnings
- No Prettier formatting issues
- TypeScript compiles without errors
- All conflicts resolved appropriately
- Commit message accurately reflects all changes

!echo "📋 Running code quality fixes and preparing commit"