// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

const UNDERLINE_STYLES = ['solid', 'wavy', 'dashed'];

export const TYPOGRAPHY_AND_TEXT_ENGINES = [
  {
    id: 'typography-metrics',
    name: 'line-height, letter-spacing & word-spacing',
    category: 'Typography & Text',
    badge: 'Baseline Ruler',
    difficulty: 'Beginner',
    summary: 'Fine-tunes vertical rhythm (leading), horizontal character tracking (letter-spacing), and inter-word gaps.',
    gizmoType: 'type-ruler',
    syntaxAnatomy: 'font-size: [px]px;\nline-height: [unitless-multiplier];\nletter-spacing: [em]em;\nword-spacing: [px]px;',
    mentalModel: 'Large display headings look best with tighter line-height (1.05–1.2) and slightly negative letter-spacing (-0.03em), whereas body copy needs generous line-height (1.5–1.7) for effortless eye tracking.',
    gotchas: [
      'Always prefer unitless line-height (e.g., 1.5 instead of 24px) so child elements inherit the proportional multiplier rather than a fixed pixel height.',
      'Uppercase badges benefit from positive letter-spacing (0.06em to 0.12em).'
    ],
    challenge: {
      title: 'Tight Editorial Display Headline',
      description: 'Set font-size >= 28px, tight line-height <= 1.15, and negative letter-spacing <= -0.02em.',
      check: (values) => values.fontSize >= 28 && values.lineHeight <= 1.15 && values.letterSpacing <= -0.02
    },
    controls: [
      { key: 'fontSize', label: 'font-size', min: 14, max: 40, step: 1, defaultValue: 24, unit: 'px' },
      { key: 'lineHeight', label: 'line-height (unitless)', min: 0.9, max: 2.2, step: 0.05, defaultValue: 1.35, unit: '' },
      { key: 'letterSpacing', label: 'letter-spacing', min: -0.08, max: 0.25, step: 0.01, defaultValue: -0.02, unit: 'em' },
      { key: 'wordSpacing', label: 'word-spacing', min: -4, max: 20, step: 1, defaultValue: 0, unit: 'px' },
      { key: 'textIndent', label: 'text-indent', min: 0, max: 60, step: 2, defaultValue: 0, unit: 'px' }
    ],
    presets: [
      { name: 'Editorial Display Hero', values: { fontSize: 32, lineHeight: 1.1, letterSpacing: -0.04, wordSpacing: 0, textIndent: 0 } },
      { name: 'Airy Longform Reading', values: { fontSize: 18, lineHeight: 1.7, letterSpacing: 0, wordSpacing: 2, textIndent: 28 } },
      { name: 'Tracked Tracking Spec', values: { fontSize: 16, lineHeight: 1.4, letterSpacing: 0.14, wordSpacing: 4, textIndent: 0 } }
    ],
    buildCss: (values) => `font-size: ${values.fontSize}px;\nline-height: ${values.lineHeight};\nletter-spacing: ${values.letterSpacing}em;\nword-spacing: ${values.wordSpacing}px;\ntext-indent: ${values.textIndent}px;`
  },

  {
    id: 'font-variation-settings',
    name: 'font-variation-settings (Variable Fonts)',
    category: 'Typography & Text',
    badge: 'Weight & Slant Axes',
    difficulty: 'Intermediate',
    summary: 'Continuously interpolates OpenType Variable Font axes such as weight (wght), slant (slnt), optical size (opsz), and grade.',
    gizmoType: 'variable-font-stage',
    gizmoKeys: { x: 'wght', y: 'slnt', xMin: 100, xMax: 900, yMin: -12, yMax: 0 },
    syntaxAnatomy: 'font-weight: [wght];\nfont-variation-settings: "wght" [wght], "slnt" [slnt];',
    mentalModel: 'Instead of loading 6 separate font files (Regular, Medium, Bold, Italic...), a single Variable Font file lets you dial any fractional weight (e.g., 542) or slant angle smoothly! Drag the 2D axis pad on stage.',
    gotchas: [
      'Standard axes use lowercase 4-letter tags ("wght", "wdth", "slnt", "opsz"), while custom foundry axes use UPPERCASE tags.'
    ],
    challenge: {
      title: 'Heavy Oblique Display (wght >= 750)',
      description: 'Drag or scrub weight (wght) >= 750 and slant <= -6deg.',
      check: (values) => values.wght >= 750 && values.slnt <= -6
    },
    controls: [
      { key: 'wght', label: '"wght" (Weight Axis)', min: 100, max: 900, step: 5, defaultValue: 650, unit: '' },
      { key: 'slnt', label: '"slnt" (Slant Angle)', min: -12, max: 0, step: 1, defaultValue: -4, unit: 'deg' },
      { key: 'fontSize', label: 'Display Size', min: 20, max: 52, step: 2, defaultValue: 36, unit: 'px' },
      { key: 'tracking', label: 'letter-spacing', min: -0.06, max: 0.15, step: 0.01, defaultValue: -0.02, unit: 'em' }
    ],
    presets: [
      { name: 'Ultra-Black Condensed', values: { wght: 880, slnt: 0, fontSize: 40, tracking: -0.04 } },
      { name: 'Hairline Editorial', values: { wght: 200, slnt: -8, fontSize: 38, tracking: 0.04 } },
      { name: 'Semi-Bold UI Label', values: { wght: 580, slnt: 0, fontSize: 28, tracking: -0.01 } }
    ],
    buildCss: (values) => `font-weight: ${values.wght};\nfont-style: oblique ${Math.abs(values.slnt)}deg;\nfont-variation-settings: "wght" ${values.wght}, "slnt" ${values.slnt};\nfont-size: ${values.fontSize}px;\nletter-spacing: ${values.tracking}em;`
  },

  {
    id: 'text-underline-offset',
    name: 'text-underline-offset & thickness',
    category: 'Typography & Text',
    badge: 'Link Anatomy',
    difficulty: 'Beginner',
    summary: 'Precisely controls the vertical distance of an underline from the text baseline and its stroke thickness.',
    gizmoType: 'underline-anatomy',
    syntaxAnatomy: 'text-decoration-line: underline;\ntext-decoration-thickness: [px]px;\ntext-underline-offset: [px]px;',
    mentalModel: 'Before text-underline-offset, designers had to fake underlines with border-bottom. Now you can control native underlines that automatically skip descenders (like g, j, p, y)!',
    gotchas: [
      'Combining a thick underline (6px+) with a negative offset (-4px) creates a stylish highlighter marker effect behind the text!'
    ],
    challenge: {
      title: 'Marker Highlighter Effect',
      description: 'Set text-decoration-thickness >= 8px and a negative text-underline-offset <= -3px.',
      check: (values) => values.thickness >= 8 && values.offset <= -3
    },
    controls: [
      { key: 'offset', label: 'text-underline-offset', min: -10, max: 18, step: 1, defaultValue: 6, unit: 'px' },
      { key: 'thickness', label: 'text-decoration-thickness', min: 1, max: 14, step: 1, defaultValue: 3, unit: 'px' },
      { key: 'styleIdx', label: 'Style (0:solid, 1:wavy, 2:dashed)', min: 0, max: 2, step: 1, defaultValue: 0, unit: 'enum' }
    ],
    presets: [
      { name: 'Clean Editorial Link', values: { offset: 6, thickness: 2, styleIdx: 0 } },
      { name: 'Marker Highlighter', values: { offset: -5, thickness: 10, styleIdx: 0 } },
      { name: 'Spellcheck Wavy', values: { offset: 5, thickness: 2, styleIdx: 1 } }
    ],
    buildCss: (values) => {
      return `text-decoration: underline ${UNDERLINE_STYLES[values.styleIdx] || 'solid'} #6366f1;\ntext-decoration-thickness: ${values.thickness}px;\ntext-underline-offset: ${values.offset}px;`;
    }
  },

  {
    id: 'line-clamp-ellipsis',
    name: '-webkit-line-clamp & Multi-Line Ellipsis',
    category: 'Typography & Text',
    badge: 'Line Truncation',
    difficulty: 'Beginner',
    summary: 'Truncates multi-line paragraphs cleanly with an ellipsis (…) after an exact number of visible lines.',
    gizmoType: 'line-clamp-stage',
    syntaxAnatomy: 'display: -webkit-box;\n-webkit-box-orient: vertical;\n-webkit-line-clamp: [lines];\noverflow: hidden;',
    mentalModel: 'Scrub the Container Width and Max Lines sliders to see how card descriptions stay uniform in height across responsive grids without cutting words mid-character.',
    gotchas: [
      'Do not put bottom padding on the same element that has overflow: hidden and -webkit-line-clamp, or the descenders of the next hidden line will peek through!'
    ],
    challenge: {
      title: 'Compact 2-Line Card Excerpt',
      description: 'Set -webkit-line-clamp to 2 lines and container width <= 300px.',
      check: (values) => values.lines === 2 && values.boxWidth <= 300
    },
    controls: [
      { key: 'lines', label: '-webkit-line-clamp (Max Lines)', min: 1, max: 5, step: 1, defaultValue: 3, unit: '' },
      { key: 'boxWidth', label: 'Card Container Width', min: 180, max: 420, step: 10, defaultValue: 310, unit: 'px' },
      { key: 'fontSize', label: 'font-size', min: 12, max: 20, step: 1, defaultValue: 14, unit: 'px' }
    ],
    presets: [
      { name: '2-Line Blog Card', values: { lines: 2, boxWidth: 280, fontSize: 14 } },
      { name: '3-Line Product Summary', values: { lines: 3, boxWidth: 320, fontSize: 14 } },
      { name: 'Single-Line Truncate', values: { lines: 1, boxWidth: 260, fontSize: 15 } }
    ],
    buildCss: (values) => `display: -webkit-box;\n-webkit-box-orient: vertical;\n-webkit-line-clamp: ${values.lines};\noverflow: hidden;\nmax-width: ${values.boxWidth}px;`
  },

  {
    id: 'multi-column',
    name: 'column-count, column-gap & column-rule',
    category: 'Typography & Text',
    badge: 'Newspaper Flow',
    difficulty: 'Intermediate',
    summary: 'Flows a single block of text automatically into multiple magazine-style vertical columns with customizable gutters and rules.',
    gizmoType: 'columns-preview',
    syntaxAnatomy: 'column-count: [int];\ncolumn-gap: [px]px;\ncolumn-rule: [width]px solid #cbd5e1;',
    mentalModel: 'The browser automatically balances the height of text across columns. Use column-rule to draw a vertical divider line right down the center of each column-gap!',
    gotchas: [
      'Use break-inside: avoid on cards or headings inside multi-column layouts so they don\'t split awkwardly across two columns.'
    ],
    challenge: {
      title: '3-Column Broadsheet',
      description: 'Set column-count to 3 and column-gap >= 24px.',
      check: (values) => values.count === 3 && values.gap >= 24
    },
    controls: [
      { key: 'count', label: 'column-count', min: 1, max: 4, step: 1, defaultValue: 2, unit: '' },
      { key: 'gap', label: 'column-gap', min: 8, max: 48, step: 2, defaultValue: 24, unit: 'px' },
      { key: 'ruleWidth', label: 'column-rule-width', min: 0, max: 6, step: 1, defaultValue: 1, unit: 'px' }
    ],
    presets: [
      { name: '2-Column Magazine', values: { count: 2, gap: 28, ruleWidth: 1 } },
      { name: '3-Column Newspaper', values: { count: 3, gap: 24, ruleWidth: 2 } },
      { name: '4-Column Compact', values: { count: 4, gap: 16, ruleWidth: 0 } }
    ],
    buildCss: (values) => `column-count: ${values.count};\ncolumn-gap: ${values.gap}px;\ncolumn-rule: ${values.ruleWidth}px solid #cbd5e1;`
  }
];
