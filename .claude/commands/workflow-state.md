---
title: "Workflow State Management"
description: "Internal workflow state tracking system"
---

# Workflow State Tracking System

This file tracks the current workflow state and is used by all workflow commands.

## Current State

**Phase**: analysis
**Current Task**: none
**Tasks Completed**: []
**Approval Status**: pending

## Workflow Phases

1. **analysis** - Understanding requirements and codebase
2. **implementation** - Executing approved tasks
3. **quality** - Quality assurance and testing
4. **documentation** - Documentation and commit preparation

## State Commands

- Use `/current-phase` to check current workflow phase
- Use `/reset-workflow` to reset to analysis phase
- Phase transitions are controlled by specific commands

## Notes

This state file is automatically updated by workflow commands and should not be manually edited.