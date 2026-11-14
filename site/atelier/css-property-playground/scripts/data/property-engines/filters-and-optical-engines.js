// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

export const FILTERS_AND_OPTICAL_ENGINES = [
  {
    id: 'backdrop-filter',
    name: 'backdrop-filter (Glassmorphism)',
    category: 'Filters & Optical',
    badge: 'Draggable Lens',
    difficulty: 'Intermediate',
    summary: 'Applies graphical effects such as Gaussian blur, saturation boost, and contrast shifts to the area behind an element.',
    gizmoType: 'draggable-lens',
    gizmoKeys: { x: 'lensX', y: 'lensY', xMin: -80, xMax: 80, yMin: -60, yMax: 60 },
    syntaxAnatomy: 'backdrop-filter: blur([px]px) saturate([%]%) contrast([%]%) brightness([%]%);\nbackground-color: rgba(255, 255, 255, [alpha]);',
    mentalModel: 'For backdrop-filter to be visible, the element\'s own background must be semi-transparent! Drag the frosted glass card over the colorful shapes on the stage to inspect the live refraction.',
    gotchas: [
      'Combining blur(16px) with saturate(180%) prevents colors behind the glass from looking muddy or gray.',
      'Always include a subtle 1px semi-transparent white border to simulate light catching the glass edge.'
    ],
    challenge: {
      title: 'Apple Vision Glass Spec',
      description: 'Set Blur >= 16px, Saturate >= 160%, and Surface Alpha <= 0.45 for a vibrant frosted glass lens.',
      check: (values) => values.blur >= 16 && values.saturate >= 160 && values.alpha <= 0.45
    },
    controls: [
      { key: 'blur', label: 'blur()', min: 0, max: 32, step: 1, defaultValue: 14, unit: 'px' },
      { key: 'saturate', label: 'saturate()', min: 50, max: 250, step: 5, defaultValue: 180, unit: '%' },
      { key: 'contrast', label: 'contrast()', min: 70, max: 150, step: 5, defaultValue: 105, unit: '%' },
      { key: 'brightness', label: 'brightness()', min: 70, max: 140, step: 5, defaultValue: 105, unit: '%' },
      { key: 'alpha', label: 'Surface White Alpha', min: 0.05, max: 0.9, step: 0.05, defaultValue: 0.45, unit: '' },
      { key: 'lensX', label: 'Lens Position X', min: -80, max: 80, step: 2, defaultValue: 0, unit: 'px' },
      { key: 'lensY', label: 'Lens Position Y', min: -60, max: 60, step: 2, defaultValue: 0, unit: 'px' }
    ],
    presets: [
      { name: 'macOS Vibrant Glass', values: { blur: 16, saturate: 180, contrast: 105, brightness: 105, alpha: 0.45, lensX: 0, lensY: 0 } },
      { name: 'Crystal Clear Frost', values: { blur: 8, saturate: 140, contrast: 110, brightness: 108, alpha: 0.25, lensX: 15, lensY: -10 } },
      { name: 'Deep Matte Acrylic', values: { blur: 28, saturate: 200, contrast: 95, brightness: 98, alpha: 0.65, lensX: -15, lensY: 10 } }
    ],
    buildCss: (values) => `backdrop-filter: blur(${values.blur}px) saturate(${values.saturate}%) contrast(${values.contrast}%) brightness(${values.brightness}%);\n-webkit-backdrop-filter: blur(${values.blur}px) saturate(${values.saturate}%) contrast(${values.contrast}%) brightness(${values.brightness}%);\nbackground-color: rgba(255, 255, 255, ${values.alpha});`
  },

  {
    id: 'filter-pipeline',
    name: 'filter (Multi-Stage Shader Pipeline)',
    category: 'Filters & Optical',
    badge: 'Color & Drop-Shadow',
    difficulty: 'Beginner',
    summary: 'Applies real-time pixel shaders (blur, hue-rotate, brightness, contrast, saturate, sepia, invert, drop-shadow) directly to an element.',
    gizmoType: 'filter-split',
    syntaxAnatomy: 'filter: brightness([%]%) contrast([%]%) saturate([%]%) hue-rotate([deg]deg) drop-shadow([x]px [y]px [b]px rgba(...));',
    mentalModel: 'Filter functions execute sequentially. Only non-default filters are emitted into your CSS output below so your production code stays clean!',
    gotchas: [
      'filter: drop-shadow() follows the exact alpha contour of transparent PNGs, SVGs, and clip-paths, unlike box-shadow!',
      'hue-rotate(180deg) shifts every color to its opposite on the color wheel.'
    ],
    challenge: {
      title: 'Cyberpunk Neon Shift',
      description: 'Shift hue-rotate >= 90deg and boost saturate >= 160%.',
      check: (values) => values.hue >= 90 && values.saturate >= 160
    },
    controls: [
      { key: 'blur', label: 'blur()', min: 0, max: 12, step: 0.5, defaultValue: 0, unit: 'px' },
      { key: 'brightness', label: 'brightness()', min: 50, max: 160, step: 5, defaultValue: 105, unit: '%' },
      { key: 'contrast', label: 'contrast()', min: 50, max: 200, step: 5, defaultValue: 115, unit: '%' },
      { key: 'hue', label: 'hue-rotate()', min: 0, max: 360, step: 5, defaultValue: 45, unit: 'deg' },
      { key: 'saturate', label: 'saturate()', min: 0, max: 250, step: 5, defaultValue: 140, unit: '%' },
      { key: 'sepia', label: 'sepia()', min: 0, max: 100, step: 5, defaultValue: 0, unit: '%' },
      { key: 'invert', label: 'invert()', min: 0, max: 100, step: 5, defaultValue: 0, unit: '%' },
      { key: 'dropBlur', label: 'drop-shadow() blur', min: 0, max: 28, step: 1, defaultValue: 10, unit: 'px' }
    ],
    presets: [
      { name: 'Vibrant Pop', values: { blur: 0, brightness: 105, contrast: 120, hue: 0, saturate: 165, sepia: 0, invert: 0, dropBlur: 12 } },
      { name: 'Cyberpunk Hue Shift', values: { blur: 0, brightness: 110, contrast: 130, hue: 135, saturate: 190, sepia: 0, invert: 0, dropBlur: 16 } },
      { name: 'Vintage Film', values: { blur: 0, brightness: 95, contrast: 110, hue: 0, saturate: 85, sepia: 45, invert: 0, dropBlur: 6 } }
    ],
    buildCss: (values) => {
      const filterFunctions = [];
      if (values.blur > 0) filterFunctions.push(`blur(${values.blur}px)`);
      if (values.brightness !== 100) filterFunctions.push(`brightness(${values.brightness}%)`);
      if (values.contrast !== 100) filterFunctions.push(`contrast(${values.contrast}%)`);
      if (values.hue !== 0) filterFunctions.push(`hue-rotate(${values.hue}deg)`);
      if (values.saturate !== 100) filterFunctions.push(`saturate(${values.saturate}%)`);
      if (values.sepia > 0) filterFunctions.push(`sepia(${values.sepia}%)`);
      if (values.invert > 0) filterFunctions.push(`invert(${values.invert}%)`);
      if (values.dropBlur > 0) filterFunctions.push(`drop-shadow(0px 8px ${values.dropBlur}px rgba(79, 70, 229, 0.35))`);
      return `filter: ${filterFunctions.length ? filterFunctions.join(' ') : 'none'};`;
    }
  }
];
