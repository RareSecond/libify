---
title: "Prepare Commit Message"
description: "Prepare commit message covering all changes"
---

# 💾 COMMIT PREPARATION: Prepare Commit Message

**Current Phase**: Commit Preparation
**Previous Phase**: Documentation
**Next Phase**: Commit Status

## Instructions

I'm preparing the commit message. I must:

1. **Review ALL uncommitted changes** - Use git status and git diff
2. **Understand full scope** - All changes since last commit, not just current task
3. **Write from developer perspective** - Never mention AI assistance
4. **Use proper format** - Present tense, imperative mood, under 80 chars
5. **Cover complete scope** - Message reflects all changes made

## Commit Message Requirements

- **Format**: Present tense, imperative mood ("Add" not "Added")
- **Length**: Under 80 characters
- **Scope**: Cover ALL uncommitted changes
- **Perspective**: Written as if by the human developer
- **Intent**: Show true purpose, not just file changes

## Commit Analysis Process

1. **Check git status** - See all modified, added, deleted files
2. **Review git diff** - Understand what actually changed
3. **Identify scope** - All changes since last commit
4. **Determine intent** - What was the overall purpose
5. **Write message** - Concise, accurate, complete

## Commit Message Format

```
Task X completed! Code quality verified. All modified files identified. 
Documentation updated. Proposed commit message: 
'[commit message covering ALL uncommitted changes]' 
- Ready for you to commit when convenient.
```

## Git Commands to Run

```bash
git status --porcelain    # All modified files
git diff --name-only      # Files with changes
git diff --staged         # Staged changes
git log --oneline -5      # Recent commits for context
```

## What I Will Do

1. Run git status and diff to understand all changes
2. Identify the complete scope of modifications
3. Write commit message covering all changes
4. Format message properly (under 80 chars, imperative)
5. Present message for user to commit

## What I Won't Do

- Write commit message for only current task
- Mention AI assistance or Claude
- Exceed 80 character limit
- Use past tense or continuous tense
- Skip reviewing full scope of changes
- Actually commit the changes (user's responsibility)

## Next Steps

After commit message is prepared, use `/commit-status` for final verification.

!echo "📋 Workflow State: COMMIT PREPARATION - Preparing commit message"