#!/bin/bash

# Automated rebranding script: ConstructAid → ConstructHub
# This script updates all references in the codebase

echo "🔄 Starting ConstructHub rebranding process..."
echo ""

# Files to update (case-sensitive replacements)
declare -a files=(
  "src/components/Navbar.tsx"
  "src/components/Hero.tsx"
  "src/pages/index.astro"
  "src/components/chatbot/ChatWidget.tsx"
  "package.json"
  "README.md"
)

# Perform replacements
find . -type f \( -name "*.astro" -o -name "*.tsx" -o -name "*.ts" -o -name "*.md" -o -name "*.json" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -path "*/dist/*" \
  ! -name "rebrand-to-constructhub.sh" \
  -exec sed -i 's/ConstructAid LLC/ConstructHub/g' {} +

find . -type f \( -name "*.astro" -o -name "*.tsx" -o -name "*.ts" -o -name "*.md" -o -name "*.json" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -path "*/dist/*" \
  ! -name "rebrand-to-constructhub.sh" \
  -exec sed -i 's/ConstructAid/ConstructHub/g' {} +

find . -type f \( -name "*.astro" -o -name "*.tsx" -o -name "*.ts" -o -name "*.md" -o -name "*.json" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -path "*/dist/*" \
  ! -name "rebrand-to-constructhub.sh" \
  -exec sed -i 's/constructaid/constructhub/g' {} +

# Update image references
find . -type f \( -name "*.astro" -o -name "*.tsx" -o -name "*.ts" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -path "*/dist/*" \
  -exec sed -i 's|/constructaid-logo|/constructhub-logo|g' {} +

echo "✅ Text replacements complete"
echo ""
echo "📝 Manual steps required:"
echo "  1. Rename logo files in /public:"
echo "     - constructaid-logo.png → constructhub-logo.png"
echo "     - constructaid-logo.pdf → constructhub-logo.pdf"
echo "  2. Update package.json name field"
echo "  3. Review and update README.md"
echo "  4. Update any deployment configurations"
echo ""
echo "✨ Rebranding complete!"
