---
name: "Commit Message"
description: "Analyze changes and generate an appropriate commit message"
---

# 💬 COMMIT MESSAGE: Smart Commit Generation

**Purpose**: Analyze all changes and generate a concise, accurate commit message
**Previous**: Any implementation or fix command
**When to use**: After making changes that need to be committed

## Instructions

I'll analyze your changes and suggest an appropriate commit message by:

1. **Reviewing all modifications** - Understanding what changed
2. **Identifying the type** - feat, fix, chore, refactor, etc.
3. **Crafting the message** - Clear, concise, and conventional
4. **Including context** - Reference issues if applicable

## Process

### 1. Analyze Changes
```bash
# See all modified files
git status

# Review unstaged changes
git diff

# Review staged changes
git diff --cached

# Check recent commits for context
git log -3 --oneline
```

### 2. Determine Change Type
- **feat**: New feature or functionality
- **fix**: Bug fix
- **chore**: Maintenance, dependencies, config
- **refactor**: Code improvement without changing behavior
- **style**: Formatting, missing semicolons, etc.
- **docs**: Documentation only changes
- **test**: Adding or fixing tests
- **perf**: Performance improvements

### 3. Message Structure

#### Simple Format
```
type: brief description

- Detail 1
- Detail 2
```

#### With Issue Reference
```
type: brief description

- Detail 1
- Detail 2

Closes #123
```

#### Breaking Change
```
type!: brief description

BREAKING CHANGE: explanation

- Detail 1
- Detail 2
```

## Commit Message Guidelines

### DO:
- Use imperative mood ("add" not "added")
- Keep first line under 50 characters
- Capitalize first word after type
- Reference issues when applicable
- Be specific about what changed
- Include "why" if not obvious

### DON'T:
- End subject line with period
- Use past tense
- Be vague ("fix stuff")
- Include code details
- Make multiple unrelated changes

## Examples

### Feature Addition
```
feat: add bulk import for products

- Add CSV upload endpoint
- Process files up to 10MB
- Validate data before import

Closes #45
```

### Bug Fix
```
fix: resolve login redirect loop

- Check auth state before redirect
- Clear stale tokens on error
- Add retry logic

Fixes #89
```

### Code Quality
```
chore: fix linting and formatting issues

- Apply Prettier formatting
- Fix ESLint violations
- Resolve TS type errors
```

### Refactoring
```
refactor: extract validation logic to utils

- Move DTO validation to shared utils
- Reduce code duplication
- Improve testability
```

## Output Format

```
💬 COMMIT MESSAGE SUGGESTION

Changes detected:
- [Type of change 1]
- [Type of change 2]

Suggested commit:
----------------------------------------
[commit message here]
----------------------------------------

To commit:
git add .
git commit -m "[message]"

Or stage specific files:
git add [file1] [file2]
git commit -m "[message]"
```

## What I Will Do

1. Analyze all current changes
2. Identify the primary change type
3. Write clear, conventional message
4. Include relevant issue references
5. Provide commit command

## What I Won't Do

- Actually run the commit
- Include sensitive information
- Mix unrelated changes
- Write novels in commit messages
- Ignore conventional format

## Success Criteria

- Message clearly describes changes ✅
- Follows conventional format ✅
- References issues if applicable ✅
- Under 50 chars for subject ✅
- Ready to copy and commit ✅

## Quick Usage

After any changes:
1. Run this command
2. Review suggested message
3. Copy and run the commit command
4. Push when ready

## Special Cases

### Multiple Related Changes
Group by primary purpose:
```
feat: implement user dashboard

- Add dashboard component
- Create stats API endpoint
- Update navigation menu
```

### Emergency Fixes
```
fix: emergency patch for production crash

- Add null check in payment processor
- Prevent undefined access

Hotfix for #101
```

### Work in Progress
```
wip: partial implementation of search

- Add search UI component
- TODO: Connect to backend
- TODO: Add filters
```

Note: Squash WIP commits before merging