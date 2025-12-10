#!/bin/bash
# Quality Gate Hook - Runs when Claude attempts to finish
# Purpose: Ensure all quality checks pass before Claude completes
# Exit codes: 0 = approve (Claude finishes), 2 = block (Claude continues)
set -o pipefail

# Constants
readonly TS_JS_FILE_PATTERN='\.(ts|tsx|js|jsx)$'
readonly OUTPUT_TAIL_LINES=20

# Helper: Change directory with error handling
# Args: $1 = target directory, $2 = error context (optional)
# Returns: 0 on success, 1 on failure (prints error to stderr)
change_dir() {
    local target="$1"
    local context="${2:-directory}"
    if ! cd "$target"; then
        echo "ERROR: Failed to change to $context: $target" >&2
        return 1
    fi
}

# Helper: Run a check and capture output
# Args: $1 = check name, $2+ = command to run
# Sets: CHECK_OUTPUT, CHECK_EXIT
run_check() {
    local name="$1"
    shift
    CHECK_OUTPUT=$("$@" 2>&1)
    CHECK_EXIT=$?
}

# Helper: Append failure output
# Args: $1 = check name, $2 = output content
append_failure() {
    local name="$1"
    local content="$2"
    OUTPUT+="❌ $name: FAIL\n"
    OUTPUT+="$(echo "$content" | tail -"$OUTPUT_TAIL_LINES")\n\n"
    FAILED=1
}

# Initialize
change_dir "$CLAUDE_PROJECT_DIR" "project directory" || exit 1

# Check if there are any unstaged, staged, or untracked TS/JS files
UNSTAGED_FILES=$(git diff --name-only 2>/dev/null | grep -E "$TS_JS_FILE_PATTERN" || true)
STAGED_FILES=$(git diff --cached --name-only 2>/dev/null | grep -E "$TS_JS_FILE_PATTERN" || true)
UNTRACKED_FILES=$(git ls-files --others --exclude-standard 2>/dev/null | grep -E "$TS_JS_FILE_PATTERN" || true)

# Silent exit if no code changes
if [[ -z "$UNSTAGED_FILES" && -z "$STAGED_FILES" && -z "$UNTRACKED_FILES" ]]; then
    exit 0
fi

# Track overall status
FAILED=0
OUTPUT=""

# Run TypeScript check
run_check "TypeScript" npm run typecheck
if [ $CHECK_EXIT -ne 0 ]; then
    append_failure "TypeScript" "$CHECK_OUTPUT"
fi

# Run ESLint check (uses lint:check - no fixes, strict on warnings)
run_check "ESLint" npm run lint:check
if [ $CHECK_EXIT -ne 0 ]; then
    append_failure "ESLint" "$CHECK_OUTPUT"
fi

# Run Prettier check
run_check "Prettier" npm run prettier:check
if [ $CHECK_EXIT -ne 0 ]; then
    append_failure "Prettier" "$CHECK_OUTPUT"
fi

# Only produce output on failure (to stderr to ensure Claude sees it)
if [ $FAILED -eq 1 ]; then
    echo "" >&2
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
    echo "❌ QUALITY GATE FAILED" >&2
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
    echo -e "$OUTPUT" >&2
    echo "Fix the issues above before completing." >&2
    echo "Tip: Run 'npm run cq:local' to auto-fix what can be fixed." >&2
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
    exit 2  # Block - Claude will continue and see this output
fi

# Silent success - no output, just exit 0
exit 0
