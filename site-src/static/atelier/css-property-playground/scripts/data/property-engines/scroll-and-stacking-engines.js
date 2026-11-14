// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

export const SCROLL_AND_STACKING_ENGINES = [
  {
    id: 'scroll-padding-margin',
    name: 'scroll-snap-type & scroll-padding-top',
    category: 'Scroll & Stacking',
    badge: 'Snap Breathing Room',
    difficulty: 'Intermediate',
    summary: 'Defines a buffer offset zone inside a scroll container so sticky headers never cover snapped or anchor-linked target sections.',
    gizmoType: 'scroll-offset-sim',
    syntaxAnatomy: '.scroll-container {\n  scroll-snap-type: y mandatory;\n  scroll-padding-top: [padTop]px;\n}\n.target-section {\n  scroll-snap-align: start;\n  scroll-margin-top: [marTop]px;\n}',
    mentalModel: 'Have you ever clicked an #anchor link and had your fixed navbar cover the heading? Setting scroll-padding-top equal to your navbar height fixes it in 1 line of CSS without JavaScript!',
    gotchas: [
      'Apply scroll-padding-top to the scrolling container (like html or a scroll-snap wrapper), or scroll-margin-top directly to the target heading.'
    ],
    challenge: {
      title: 'Clear the Sticky Header',
      description: 'Set scroll-padding-top >= 56px so the snapped target clears the 52px sticky navigation bar.',
      check: (values) => (values.scrollPadTop + values.scrollMarTop) >= 56
    },
    controls: [
      { key: 'scrollPadTop', label: 'scroll-padding-top', min: 0, max: 100, step: 4, defaultValue: 60, unit: 'px' },
      { key: 'scrollMarTop', label: 'scroll-margin-top', min: 0, max: 60, step: 4, defaultValue: 8, unit: 'px' },
      { key: 'headerH', label: 'Sticky Navbar Height', min: 36, max: 72, step: 4, defaultValue: 52, unit: 'px' }
    ],
    presets: [
      { name: 'Clears 52px Sticky Header', values: { scrollPadTop: 60, scrollMarTop: 8, headerH: 52 } },
      { name: 'Buggy Zero Offset (Covered!)', values: { scrollPadTop: 0, scrollMarTop: 0, headerH: 52 } },
      { name: 'Generous Reading Buffer', values: { scrollPadTop: 84, scrollMarTop: 12, headerH: 52 } }
    ],
    buildCss: (values) => `html {\n  scroll-behavior: smooth;\n  scroll-snap-type: y mandatory;\n  scroll-padding-top: ${values.scrollPadTop}px;\n}\n.anchor-target {\n  scroll-snap-align: start;\n  scroll-margin-top: ${values.scrollMarTop}px;\n}`
  },

  {
    id: 'z-index-stacking',
    name: 'z-index & 3D Stacking Context',
    category: 'Scroll & Stacking',
    badge: '3D Layer Exploded View',
    difficulty: 'Intermediate',
    summary: 'Controls the vertical paint order of positioned or flex/grid elements along the Z-axis toward the viewer.',
    gizmoType: 'z-index-layers',
    syntaxAnatomy: 'position: relative;\nz-index: [integer];\nisolation: isolate;',
    mentalModel: 'Higher z-index numbers paint in front of lower numbers within the same stacking context. Toggle the 3D Exploded View slider on the stage to see how the 3 cards stack in space!',
    gotchas: [
      'z-index has ZERO effect on statically positioned elements (unless they are direct children of a Flex or Grid container!).',
      'Properties like opacity < 1, transform, or filter automatically trap children inside a new local stacking context.'
    ],
    challenge: {
      title: 'Bring Card A to the Very Front',
      description: 'Set Card A (Indigo) z-index higher than both Card B and Card C.',
      check: (values) => values.zA > values.zB && values.zA > values.zC
    },
    controls: [
      { key: 'zA', label: 'Card A (Indigo) z-index', min: -5, max: 20, step: 1, defaultValue: 1, unit: '' },
      { key: 'zB', label: 'Card B (Emerald) z-index', min: -5, max: 20, step: 1, defaultValue: 5, unit: '' },
      { key: 'zC', label: 'Card C (Rose) z-index', min: -5, max: 20, step: 1, defaultValue: 10, unit: '' },
      { key: 'explode', label: '3D Isometric Inspection Angle', min: 0, max: 1, step: 1, defaultValue: 1, unit: 'toggle' }
    ],
    presets: [
      { name: 'Ascending (1, 5, 10)', values: { zA: 1, zB: 5, zC: 10, explode: 1 } },
      { name: 'Indigo on Top (15, 5, 2)', values: { zA: 15, zB: 5, zC: 2, explode: 1 } },
      { name: 'Negative Behind (-2, 1, 2)', values: { zA: -2, zB: 1, zC: 2, explode: 0 } }
    ],
    buildCss: (values) => `.card-indigo  { position: relative; z-index: ${values.zA}; }\n.card-emerald { position: relative; z-index: ${values.zB}; }\n.card-rose    { position: relative; z-index: ${values.zC}; }`
  }
];
