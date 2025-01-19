const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Icon sizes needed for Chrome extension
const ICON_SIZES = [16, 19, 32, 38, 48, 128];

// Color palette
const COLORS = {
    primary: '#3498db',    // Blue
    secondary: '#2c3e50',  // Dark Blue
    accent: '#e74c3c',     // Red
    highlight: '#f1c40f',  // Yellow
    white: '#ffffff'
};

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, '../src/assets/icons');
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

// Function to draw the base icon
function drawIcon(ctx, size) {
    const center = size / 2;
    const radius = size * 0.4;
    
    // Background shield shape
    ctx.beginPath();
    ctx.moveTo(center, size * 0.1);
    ctx.lineTo(size * 0.8, size * 0.3);
    ctx.lineTo(size * 0.8, size * 0.7);
    ctx.lineTo(center, size * 0.9);
    ctx.lineTo(size * 0.2, size * 0.7);
    ctx.lineTo(size * 0.2, size * 0.3);
    ctx.closePath();
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, COLORS.primary);
    gradient.addColorStop(1, COLORS.secondary);
    
    // Fill shield
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Add shine effect
    ctx.beginPath();
    ctx.moveTo(size * 0.2, size * 0.3);
    ctx.lineTo(size * 0.8, size * 0.3);
    ctx.lineTo(size * 0.65, size * 0.45);
    ctx.lineTo(size * 0.35, size * 0.45);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();
    
    // Draw magnifying glass
    ctx.beginPath();
    ctx.arc(center - radius * 0.2, center - radius * 0.2, radius * 0.4, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.white;
    ctx.lineWidth = size * 0.06;
    ctx.stroke();
    
    // Draw handle
    ctx.beginPath();
    ctx.moveTo(center + radius * 0.1, center + radius * 0.1);
    ctx.lineTo(center + radius * 0.5, center + radius * 0.5);
    ctx.strokeStyle = COLORS.white;
    ctx.lineWidth = size * 0.06;
    ctx.stroke();
    
    // Add "SEO" text for larger icons
    if (size >= 48) {
        ctx.font = `bold ${size * 0.2}px Arial`;
        ctx.fillStyle = COLORS.white;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SEO', center, center + radius * 0.4);
    }
    
    // Add outer glow effect
    ctx.shadowColor = COLORS.primary;
    ctx.shadowBlur = size * 0.1;
    ctx.strokeStyle = COLORS.primary;
    ctx.lineWidth = size * 0.02;
    ctx.stroke();
}

// Generate icons for each size
ICON_SIZES.forEach(size => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Enable anti-aliasing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw icon
    drawIcon(ctx, size);
    
    // Save as PNG
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(assetsDir, `icon${size}.png`), buffer);
    
    console.log(`Generated icon${size}.png`);
});

// Generate favicon.ico (16x16)
const faviconCanvas = createCanvas(16, 16);
const faviconCtx = faviconCanvas.getContext('2d');
drawIcon(faviconCtx, 16);
const faviconBuffer = faviconCanvas.toBuffer('image/png');
fs.writeFileSync(path.join(assetsDir, 'favicon.ico'), faviconBuffer);
console.log('Generated favicon.ico');

// Generate manifest icons object
const manifestIcons = ICON_SIZES.reduce((acc, size) => {
    acc[size] = `assets/icons/icon${size}.png`;
    return acc;
}, {});

// Save manifest icons configuration
const manifestIconsConfig = {
    icons: manifestIcons,
    // Add icon definitions for different contexts
    browser_action: {
        default_icon: {
            16: 'assets/icons/icon16.png',
            32: 'assets/icons/icon32.png',
            48: 'assets/icons/icon48.png',
            128: 'assets/icons/icon128.png'
        }
    },
    page_action: {
        default_icon: {
            19: 'assets/icons/icon19.png',
            38: 'assets/icons/icon38.png'
        }
    }
};

fs.writeFileSync(
    path.join(__dirname, '../src/assets/icons/manifest-icons.json'),
    JSON.stringify(manifestIconsConfig, null, 2)
);
console.log('Generated manifest-icons.json');

// Create brand colors CSS file
const brandColors = `
/* SEO Sentinel Brand Colors */
:root {
    /* Primary Colors */
    --seo-primary: ${COLORS.primary};
    --seo-secondary: ${COLORS.secondary};
    --seo-accent: ${COLORS.accent};
    --seo-highlight: ${COLORS.highlight};
    
    /* Gradient Definitions */
    --seo-gradient-primary: linear-gradient(135deg, var(--seo-primary), var(--seo-secondary));
    --seo-gradient-accent: linear-gradient(135deg, var(--seo-accent), var(--seo-highlight));
    
    /* Text Colors */
    --seo-text-primary: #2c3e50;
    --seo-text-secondary: #7f8c8d;
    --seo-text-light: #ecf0f1;
    
    /* Status Colors */
    --seo-success: #27ae60;
    --seo-warning: #f1c40f;
    --seo-error: #e74c3c;
    --seo-info: #3498db;
    
    /* Background Colors */
    --seo-bg-primary: #ffffff;
    --seo-bg-secondary: #f5f7fa;
    --seo-bg-dark: #2c3e50;
    
    /* Border Colors */
    --seo-border-light: #ecf0f1;
    --seo-border-dark: #bdc3c7;
    
    /* Shadow Definitions */
    --seo-shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
    --seo-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
    --seo-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
    
    /* Spacing Variables */
    --seo-spacing-xs: 0.25rem;
    --seo-spacing-sm: 0.5rem;
    --seo-spacing-md: 1rem;
    --seo-spacing-lg: 1.5rem;
    --seo-spacing-xl: 2rem;
    
    /* Border Radius */
    --seo-radius-sm: 0.25rem;
    --seo-radius-md: 0.5rem;
    --seo-radius-lg: 1rem;
    --seo-radius-full: 9999px;
    
    /* Transitions */
    --seo-transition-fast: 150ms ease-in-out;
    --seo-transition-normal: 300ms ease-in-out;
    --seo-transition-slow: 500ms ease-in-out;
}

/* Dark Theme Variables */
[data-theme="dark"] {
    --seo-text-primary: #ecf0f1;
    --seo-text-secondary: #bdc3c7;
    --seo-bg-primary: #2c3e50;
    --seo-bg-secondary: #34495e;
    --seo-border-light: #465669;
    --seo-border-dark: #576a7d;
}
`;

fs.writeFileSync(
    path.join(__dirname, '../src/assets/styles/brand.css'),
    brandColors
);
console.log('Generated brand.css');

// Create README for assets directory
const assetsReadme = `# SEO Sentinel Assets

This directory contains all the assets used in the SEO Sentinel extension.

## Icons
Generated icons in the following sizes:
${ICON_SIZES.map(size => `- ${size}x${size}px (icon${size}.png)`).join('\n')}
- favicon.ico (16x16)

## Manifest Icons
The \`manifest-icons.json\` file contains the icon configurations for the extension manifest.

## Brand Colors
The \`brand.css\` file contains all brand colors and design tokens used throughout the extension.

## Generation
All assets are generated using the \`generate-icons.js\` script. To regenerate assets:

\`\`\`bash
npm run generate-assets
\`\`\`

## Usage
Import the brand styles in your CSS files:

\`\`\`css
@import '../assets/styles/brand.css';
\`\`\`

Use CSS variables in your styles:

\`\`\`css
.my-element {
    color: var(--seo-primary);
    background: var(--seo-bg-secondary);
    box-shadow: var(--seo-shadow-md);
    border-radius: var(--seo-radius-md);
    transition: all var(--seo-transition-normal);
}
\`\`\`
`;

fs.writeFileSync(
    path.join(assetsDir, '../README.md'),
    assetsReadme
);
console.log('Generated assets README.md');

console.log('\nAsset generation complete! ✨');