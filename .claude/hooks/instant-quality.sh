#!/bin/bash
# Instant Quality Hook - Runs after every Edit/Write operation
# Purpose: Immediate formatting and linting feedback on changed files
set -o pipefail

# Parse the file path from hook input (JSON via stdin)
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Exit early if no file path
[[ -z "$FILE_PATH" ]] && exit 0

# Make path absolute if relative
if [[ ! "$FILE_PATH" = /* ]]; then
    FILE_PATH="$CLAUDE_PROJECT_DIR/$FILE_PATH"
fi

# Exit if file doesn't exist (might have been deleted)
[[ ! -f "$FILE_PATH" ]] && exit 0

# Only process TypeScript/JavaScript files
[[ ! "$FILE_PATH" =~ \.(ts|tsx|js|jsx)$ ]] && exit 0

# Skip generated files
[[ "$FILE_PATH" =~ \.gen\. ]] && exit 0
[[ "$FILE_PATH" =~ \.generated\. ]] && exit 0
[[ "$FILE_PATH" =~ routeTree\.gen ]] && exit 0

# Skip node_modules and dist
[[ "$FILE_PATH" =~ node_modules ]] && exit 0
[[ "$FILE_PATH" =~ /dist/ ]] && exit 0

cd "$CLAUDE_PROJECT_DIR" || exit 0

echo "🔧 Auto-formatting: $(basename "$FILE_PATH")"

# Run Prettier (fast, ~100ms)
if npx prettier --write "$FILE_PATH" 2>/dev/null; then
    echo "   ✓ Prettier"
else
    echo "   ⚠ Prettier skipped"
fi

# Run ESLint with auto-fix on single file (fast, ~500ms)
ESLINT_OUTPUT=$(npx eslint "$FILE_PATH" --fix 2>&1)
ESLINT_EXIT=$?

if [ $ESLINT_EXIT -eq 0 ]; then
    echo "   ✓ ESLint"
else
    echo "   ⚠ ESLint issues:"
    echo "$ESLINT_OUTPUT" | head -20
fi

# Always exit 0 - we don't want to block Claude, just provide feedback
exit 0
