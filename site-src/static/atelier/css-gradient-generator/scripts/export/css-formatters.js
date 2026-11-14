// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

function usesCustomBlendModes(compiledScene) {
  return compiledScene.blendModes.some(blendMode => blendMode !== 'normal');
}

export function formatCopyableDeclarations(compiledScene) {
  const lines = [
    `background-color: ${compiledScene.fallbackColor};`,
    `background-image:\n  ${compiledScene.backgroundImages.join(',\n  ')};`
  ];
  if (usesCustomBlendModes(compiledScene)) {
    lines.push(`background-blend-mode: ${compiledScene.blendModes.join(', ')};`);
  }
  return lines.join('\n');
}

export function formatPreviewRuleset(compiledScene) {
  return [
    `.orchestrated-gradient {`,
    `  background-color: ${compiledScene.fallbackColor};`,
    `  background-image:`,
    `    ${compiledScene.backgroundImages.join(',\n    ')};`,
    usesCustomBlendModes(compiledScene)
      ? `  background-blend-mode: ${compiledScene.blendModes.join(', ')};`
      : null,
    `}`
  ].filter(Boolean).join('\n');
}

export function formatQuickCopyCss(compiledScene) {
  return [
    `background-color: ${compiledScene.fallbackColor};`,
    `background-image: ${compiledScene.backgroundImages.join(', ')};`,
    usesCustomBlendModes(compiledScene)
      ? `background-blend-mode: ${compiledScene.blendModes.join(', ')};`
      : ''
  ].filter(Boolean).join('\n');
}

export function formatProductionCss(compiledScene) {
  const lines = [
    `/* ChromaFlow Single-Layer Multi-Control Gradient */`,
    `.chromaflow-canvas {`,
    `  background-color: ${compiledScene.fallbackColor};`,
    `  background-image:`,
    `    ${compiledScene.backgroundImages.join(',\n    ')};`
  ];
  if (usesCustomBlendModes(compiledScene)) {
    lines.push(`  background-blend-mode: ${compiledScene.blendModes.join(', ')};`);
  }
  lines.push(`}`);
  return lines.join('\n');
}

export function formatCustomPropertiesCss(compiledScene, controls) {
  const controlVariables = controls.map((control, index) =>
    `  --ctrl-${index + 1}-pos: ${control.x}% ${control.y}%;\n  --ctrl-${index + 1}-core: ${control.color};\n  --ctrl-${index + 1}-reach: ${control.radius}%;`
  ).join('\n');
  return [
    `:root {`,
    `  --canvas-base: ${compiledScene.fallbackColor};`,
    controlVariables,
    `}`,
    ``,
    `.chromaflow-surface {`,
    `  background-color: var(--canvas-base);`,
    `  background-image:`,
    `    ${compiledScene.backgroundImages.join(',\n    ')};`,
    `}`
  ].join('\n');
}

export function formatTailwindSnippet(compiledScene) {
  const singleLineBackground = compiledScene.backgroundImages.join(',').replace(/\s+/g, '_');
  return [
    `<!-- Tailwind Arbitrary Background Value -->`,
    `<div class="bg-[${compiledScene.fallbackColor}] bg-[${singleLineBackground}]"></div>`,
    ``,
    `// Or inside tailwind.config.js -> theme.extend.backgroundImage:`,
    `backgroundImage: {`,
    `  'chromaflow-field': \`${compiledScene.backgroundImages.join(', ')}\`,`,
    `}`
  ].join('\n');
}

export function formatDesignTokens({ globals, noise, controls }) {
  const designTokens = {
    "$schema": "https://tr.designtokens.org/format/",
    "chromaflowField": {
      "$type": "gradient-field",
      "globals": globals,
      "noise": noise,
      "controls": controls
    }
  };
  return JSON.stringify(designTokens, null, 2);
}

export function copyTextToClipboard(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}
