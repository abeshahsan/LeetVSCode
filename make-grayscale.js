const fs = require('fs');
const path = require('path');

// Read the colored SVG
const colorSvgPath = path.join(__dirname, 'resources', 'vs-leet-logo-color.svg');
const monoSvgPath = path.join(__dirname, 'resources', 'vs-leet-logo.svg');

let svgContent = fs.readFileSync(colorSvgPath, 'utf-8');

// Remove background rectangle
svgContent = svgContent.replace(
  /<rect width="128" height="128"[^>]*\/>/g,
  '<!-- Background removed for transparent activity bar icon -->'
);

// Convert specific colors to currentColor (auto-themed)
const colorMap = {
  '#007ACC': 'currentColor',
  '#10B981': 'currentColor',
  '#FFA116': 'currentColor',
  '#6B7280': 'currentColor',
  '#FFFFFF': 'currentColor'
};

// Replace all color instances
Object.entries(colorMap).forEach(([color, replacement]) => {
  const regex = new RegExp(color, 'gi');
  svgContent = svgContent.replace(regex, replacement);
});

// Add opacity adjustments for better visibility
svgContent = svgContent.replace(
  /stroke="currentColor"\s+stroke-width="6"/g,
  'stroke="currentColor" stroke-width="6" opacity="0.9"'
);

// Adjust fill opacities
svgContent = svgContent.replace(
  /fill="currentColor"(?!\s+opacity)/g,
  'fill="currentColor" opacity="0.9"'
);

// Write the grayscale version
fs.writeFileSync(monoSvgPath, svgContent);

console.log('✓ Grayscale version created successfully at:', monoSvgPath);
console.log('✓ Background removed');
console.log('✓ Colors converted to currentColor for auto-theming');
