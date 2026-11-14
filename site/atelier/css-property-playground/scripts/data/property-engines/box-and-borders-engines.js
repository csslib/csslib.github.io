// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

const OUTLINE_STYLES = ['solid', 'dashed', 'dotted', 'double'];
const OBJECT_FIT_MODES = ['cover', 'contain', 'none'];

export const BOX_AND_BORDERS_ENGINES = [
  {
    id: 'border-radius',
    name: 'border-radius (8-Value Elliptical)',
    category: 'Box & Borders',
    badge: '8-Axis Curve',
    difficulty: 'Intermediate',
    summary: 'Defines the radius of an element\'s corners, supporting both symmetrical corners and 8-value elliptical curves using the slash (/) syntax.',
    gizmoType: 'corner-radius',
    syntaxAnatomy: 'border-radius: [tl-x] [tr-x] [br-x] [bl-x] / [tl-y] [tr-y] [br-y] [bl-y];',
    mentalModel: 'Each corner is a quarter-ellipse with a horizontal radius (before "/") and vertical radius (after "/"). Drag the 4 corner handles on the canvas to sculpt organic blobs or asymmetric cards!',
    gotchas: [
      'Percentage values on horizontal radii refer to the element\'s width, while vertical radii refer to the element\'s height.',
      'Setting border-radius: 50% on a non-square rectangle creates an oval; use 9999px for a pill shape.'
    ],
    challenge: {
      title: 'Organic Blob Shape',
      description: 'Enable Asymmetric Elliptical Mode (useSlash = 1) and set Top-Left X >= 60% and Bottom-Right Y >= 65%.',
      check: (values) => values.useSlash === 1 && values.tlX >= 60 && values.brY >= 65
    },
    controls: [
      { key: 'tlX', label: 'Top-Left X', min: 0, max: 100, step: 1, defaultValue: 28, unit: '%' },
      { key: 'trX', label: 'Top-Right X', min: 0, max: 100, step: 1, defaultValue: 72, unit: '%' },
      { key: 'brX', label: 'Bottom-Right X', min: 0, max: 100, step: 1, defaultValue: 35, unit: '%' },
      { key: 'blX', label: 'Bottom-Left X', min: 0, max: 100, step: 1, defaultValue: 65, unit: '%' },
      { key: 'useSlash', label: 'Elliptical (8-Value / Mode)', min: 0, max: 1, step: 1, defaultValue: 1, unit: 'toggle' },
      { key: 'tlY', label: 'Top-Left Y', min: 0, max: 100, step: 1, defaultValue: 60, unit: '%' },
      { key: 'trY', label: 'Top-Right Y', min: 0, max: 100, step: 1, defaultValue: 40, unit: '%' },
      { key: 'brY', label: 'Bottom-Right Y', min: 0, max: 100, step: 1, defaultValue: 60, unit: '%' },
      { key: 'blY', label: 'Bottom-Left Y', min: 0, max: 100, step: 1, defaultValue: 40, unit: '%' }
    ],
    presets: [
      { name: 'Liquid Blob', values: { tlX: 30, trX: 70, brX: 70, blX: 30, useSlash: 1, tlY: 30, trY: 30, brY: 70, blY: 70 } },
      { name: 'Soft Card (16%)', values: { tlX: 16, trX: 16, brX: 16, blX: 16, useSlash: 0, tlY: 16, trY: 16, brY: 16, blY: 16 } },
      { name: 'Leaf Cut', values: { tlX: 0, trX: 65, brX: 0, blX: 65, useSlash: 0, tlY: 0, trY: 65, brY: 0, blY: 65 } },
      { name: 'Squircle Morph', values: { tlX: 42, trX: 58, brX: 45, blX: 55, useSlash: 1, tlY: 55, trY: 45, brY: 55, blY: 45 } }
    ],
    buildCss: (values) => {
      if (values.useSlash) {
        return `border-radius: ${values.tlX}% ${values.trX}% ${values.brX}% ${values.blX}% / ${values.tlY}% ${values.trY}% ${values.brY}% ${values.blY}%;`;
      }
      return `border-radius: ${values.tlX}% ${values.trX}% ${values.brX}% ${values.blX}%;`;
    }
  },

  {
    id: 'border-image-slice',
    name: 'border-image & border-image-slice',
    category: 'Box & Borders',
    badge: '9-Slice Visualizer',
    difficulty: 'Advanced',
    summary: 'Slices a source gradient or SVG into 9 regions (4 corners, 4 edges, 1 center) to paint ornate or gradient borders with exact slice offsets.',
    gizmoType: 'border-image-stage',
    syntaxAnatomy: 'border: [width]px solid transparent;\nborder-image-source: [gradient/url];\nborder-image-slice: [top] [right] [bottom] [left];\nborder-image-outset: [outset]px;',
    mentalModel: 'border-image-slice divides your source graphic with 4 inward cut lines (Top, Right, Bottom, Left). The 4 corners stay unstretched while the 4 edges stretch or repeat! Inspect the 9-slice cut lines live on the stage.',
    gotchas: [
      'border-image-slice takes unitless numbers (representing pixels on raster images or percentages) and does NOT accept "px" units!',
      'You must set a non-zero border-width and border-style: solid for border-image to render.'
    ],
    challenge: {
      title: 'Thick Outset Gradient Frame',
      description: 'Set border-width >= 16px and border-image-outset >= 6px.',
      check: (values) => values.borderW >= 16 && values.outset >= 6
    },
    controls: [
      { key: 'sliceTop', label: 'slice-top (unitless %)', min: 5, max: 48, step: 1, defaultValue: 25, unit: '%' },
      { key: 'sliceRight', label: 'slice-right (unitless %)', min: 5, max: 48, step: 1, defaultValue: 25, unit: '%' },
      { key: 'sliceBottom', label: 'slice-bottom (unitless %)', min: 5, max: 48, step: 1, defaultValue: 25, unit: '%' },
      { key: 'sliceLeft', label: 'slice-left (unitless %)', min: 5, max: 48, step: 1, defaultValue: 25, unit: '%' },
      { key: 'borderW', label: 'border-width', min: 4, max: 32, step: 2, defaultValue: 14, unit: 'px' },
      { key: 'outset', label: 'border-image-outset', min: 0, max: 20, step: 1, defaultValue: 0, unit: 'px' },
      { key: 'angle', label: 'Gradient Source Angle', min: 0, max: 360, step: 5, defaultValue: 135, unit: 'deg' }
    ],
    presets: [
      { name: 'Neon Gradient Frame', values: { sliceTop: 20, sliceRight: 20, sliceBottom: 20, sliceLeft: 20, borderW: 12, outset: 0, angle: 135 } },
      { name: 'Expanded Outset Halo', values: { sliceTop: 30, sliceRight: 30, sliceBottom: 30, sliceLeft: 30, borderW: 18, outset: 8, angle: 45 } },
      { name: 'Asymmetric Slice', values: { sliceTop: 12, sliceRight: 38, sliceBottom: 12, sliceLeft: 38, borderW: 14, outset: 2, angle: 90 } }
    ],
    buildCss: (values) => `border: ${values.borderW}px solid transparent;\nborder-image-source: linear-gradient(${values.angle}deg, #4f46e5, #ec4899, #f59e0b);\nborder-image-slice: ${values.sliceTop}% ${values.sliceRight}% ${values.sliceBottom}% ${values.sliceLeft}%;\nborder-image-outset: ${values.outset}px;`
  },

  {
    id: 'padding-margin-box',
    name: 'padding & margin (Box Model)',
    category: 'Box & Borders',
    badge: '4-Side Spacing',
    difficulty: 'Beginner',
    summary: 'Controls inner breathing room (padding) and outer separation (margin) across all 4 directional edges: top, right, bottom, left.',
    gizmoType: 'box-model',
    syntaxAnatomy: 'padding: [top] [right] [bottom] [left];\nmargin: [top] [right] [bottom] [left];\nbox-sizing: border-box;',
    mentalModel: 'Padding expands the clickable/background area inside the border; Margin pushes neighboring elements away outside the border. Drag the green (padding) guides on the canvas!',
    gotchas: [
      'Vertical margins between adjacent block elements collapse into the larger of the two values (unless inside Flex or Grid containers).',
      'Always use box-sizing: border-box so padding does not unexpectedly increase your element\'s declared width.'
    ],
    challenge: {
      title: 'Asymmetric Hero Card Spacing',
      description: 'Set Top Padding >= 40px and Horizontal Padding (Left & Right) >= 32px.',
      check: (values) => values.padTop >= 40 && values.padLeft >= 32 && values.padRight >= 32
    },
    controls: [
      { key: 'padTop', label: 'padding-top', min: 0, max: 80, step: 2, defaultValue: 28, unit: 'px' },
      { key: 'padRight', label: 'padding-right', min: 0, max: 80, step: 2, defaultValue: 32, unit: 'px' },
      { key: 'padBottom', label: 'padding-bottom', min: 0, max: 80, step: 2, defaultValue: 28, unit: 'px' },
      { key: 'padLeft', label: 'padding-left', min: 0, max: 80, step: 2, defaultValue: 32, unit: 'px' },
      { key: 'marTop', label: 'margin-top', min: -30, max: 60, step: 2, defaultValue: 16, unit: 'px' },
      { key: 'marRight', label: 'margin-right', min: -30, max: 60, step: 2, defaultValue: 20, unit: 'px' },
      { key: 'marBottom', label: 'margin-bottom', min: -30, max: 60, step: 2, defaultValue: 16, unit: 'px' },
      { key: 'marLeft', label: 'margin-left', min: -30, max: 60, step: 2, defaultValue: 20, unit: 'px' }
    ],
    presets: [
      { name: 'Balanced Card', values: { padTop: 24, padRight: 24, padBottom: 24, padLeft: 24, marTop: 16, marRight: 16, marBottom: 16, marLeft: 16 } },
      { name: 'Wide Pill Button', values: { padTop: 12, padRight: 48, padBottom: 12, padLeft: 48, marTop: 8, marRight: 8, marBottom: 8, marLeft: 8 } },
      { name: 'Negative Overlap', values: { padTop: 28, padRight: 28, padBottom: 28, padLeft: 28, marTop: -20, marRight: 12, marBottom: 12, marLeft: -20 } }
    ],
    buildCss: (values) => `padding: ${values.padTop}px ${values.padRight}px ${values.padBottom}px ${values.padLeft}px;\nmargin: ${values.marTop}px ${values.marRight}px ${values.marBottom}px ${values.marLeft}px;\nbox-sizing: border-box;`
  },

  {
    id: 'outline-offset',
    name: 'outline & outline-offset',
    category: 'Box & Borders',
    badge: 'Focus Ring',
    difficulty: 'Beginner',
    summary: 'Draws a line outside (or inside via negative offset) the border edge without taking up layout space or shifting neighboring elements.',
    gizmoType: 'outline-ring',
    syntaxAnatomy: 'outline: [outline-width] [outline-style] [outline-color];\noutline-offset: [length];',
    mentalModel: 'Unlike border, outline never triggers layout reflow! With outline-offset, you can float the ring outward for accessible keyboard focus rings, or pull it inward with negative values for stitched inner borders.',
    gotchas: [
      'Outlines follow border-radius in all modern browsers.',
      'Never set outline: none without providing a high-contrast :focus-visible alternative.'
    ],
    challenge: {
      title: 'Inner Stitched Frame',
      description: 'Use a negative outline-offset (<= -10px) and dashed style (styleIdx = 1) to create an inset stitched border effect.',
      check: (values) => values.offset <= -10 && values.styleIdx === 1
    },
    controls: [
      { key: 'width', label: 'outline-width', min: 1, max: 16, step: 1, defaultValue: 3, unit: 'px' },
      { key: 'offset', label: 'outline-offset', min: -28, max: 32, step: 1, defaultValue: 8, unit: 'px' },
      { key: 'styleIdx', label: 'Style (0:solid, 1:dashed, 2:dotted, 3:double)', min: 0, max: 3, step: 1, defaultValue: 0, unit: 'enum' },
      { key: 'radius', label: 'border-radius', min: 0, max: 48, step: 2, defaultValue: 18, unit: 'px' }
    ],
    presets: [
      { name: 'Accessible Focus Ring', values: { width: 3, offset: 6, styleIdx: 0, radius: 16 } },
      { name: 'Inset Stitched Seam', values: { width: 2, offset: -12, styleIdx: 1, radius: 18 } },
      { name: 'Double Halo', values: { width: 6, offset: 12, styleIdx: 3, radius: 24 } }
    ],
    buildCss: (values) => {
      return `outline: ${values.width}px ${OUTLINE_STYLES[values.styleIdx] || 'solid'} #4f46e5;\noutline-offset: ${values.offset}px;\nborder-radius: ${values.radius}px;`;
    }
  },

  {
    id: 'clamp-fluid-calc',
    name: 'clamp() Fluid Sizing Calculator',
    category: 'Box & Borders',
    badge: 'Viewport Curve',
    difficulty: 'Intermediate',
    summary: 'Calculates responsive fluid typography or container widths that scale smoothly between a minimum and maximum pixel size across viewport widths.',
    gizmoType: 'clamp-graph',
    syntaxAnatomy: 'font-size: clamp([min]px, [base]px + [vwSlope]vw, [max]px);',
    mentalModel: 'clamp(MIN, PREFERRED, MAX) locks a value to MIN on small phones, scales linearly along the PREFERRED slope across tablets/laptops, and caps at MAX on ultrawide monitors. Scrub the Simulated Viewport slider to test!',
    gotchas: [
      'Always combine rem/px with vw in the middle argument (e.g., 1rem + 2vw) so browser zoom (accessibility) still scales the text!'
    ],
    challenge: {
      title: 'Responsive Display Heading',
      description: 'Configure Min Size <= 20px, Max Size >= 42px, and scrub Simulated Viewport >= 900px.',
      check: (values) => values.minPx <= 20 && values.maxPx >= 42 && values.simViewport >= 900
    },
    controls: [
      { key: 'minPx', label: 'Minimum Value (px)', min: 12, max: 32, step: 1, defaultValue: 18, unit: 'px' },
      { key: 'maxPx', label: 'Maximum Cap (px)', min: 24, max: 64, step: 1, defaultValue: 40, unit: 'px' },
      { key: 'vwSlope', label: 'Fluid Rate (vw)', min: 0.5, max: 6, step: 0.25, defaultValue: 2.5, unit: 'vw' },
      { key: 'basePx', label: 'Base Offset (px)', min: 4, max: 24, step: 1, defaultValue: 10, unit: 'px' },
      { key: 'simViewport', label: 'Simulate Viewport Width', min: 320, max: 1440, step: 10, defaultValue: 860, unit: 'px' }
    ],
    presets: [
      { name: 'Fluid H1 Heading', values: { minPx: 22, maxPx: 48, vwSlope: 3, basePx: 10, simViewport: 960 } },
      { name: 'Fluid Body Copy', values: { minPx: 15, maxPx: 20, vwSlope: 0.8, basePx: 12, simViewport: 768 } },
      { name: 'Mobile Viewport Test (375px)', values: { minPx: 20, maxPx: 44, vwSlope: 2.5, basePx: 10, simViewport: 375 } }
    ],
    buildCss: (values) => `font-size: clamp(${values.minPx}px, ${values.basePx}px + ${values.vwSlope}vw, ${values.maxPx}px);`
  },

  {
    id: 'aspect-ratio',
    name: 'aspect-ratio & Intrinsic Sizing',
    category: 'Box & Borders',
    badge: 'Intrinsic Ratio',
    difficulty: 'Beginner',
    summary: 'Maintains a proportional width-to-height ratio automatically as an element scales across viewports.',
    gizmoType: 'aspect-box',
    syntaxAnatomy: 'aspect-ratio: [width-ratio] / [height-ratio];\nwidth: [px];',
    mentalModel: 'So long as at least one dimension (width or height) is auto, the browser automatically computes the other dimension from the ratio.',
    gotchas: [
      'If both width and height are explicitly fixed, aspect-ratio has no effect.',
      'Content overflowing the calculated height will expand the box unless overflow: hidden or min-height: 0 is set.'
    ],
    challenge: {
      title: 'Cinematic Widescreen',
      description: 'Configure a 16 / 9 widescreen ratio (ratioW = 16, ratioH = 9).',
      check: (values) => values.ratioW === 16 && values.ratioH === 9
    },
    controls: [
      { key: 'ratioW', label: 'Ratio Width', min: 1, max: 21, step: 0.5, defaultValue: 16, unit: '' },
      { key: 'ratioH', label: 'Ratio Height', min: 1, max: 21, step: 0.5, defaultValue: 9, unit: '' },
      { key: 'width', label: 'Container Width', min: 140, max: 360, step: 4, defaultValue: 280, unit: 'px' }
    ],
    presets: [
      { name: 'HD Video (16 / 9)', values: { ratioW: 16, ratioH: 9, width: 300 } },
      { name: 'Square (1 / 1)', values: { ratioW: 1, ratioH: 1, width: 220 } },
      { name: 'Classic Photo (4 / 3)', values: { ratioW: 4, ratioH: 3, width: 260 } },
      { name: 'Vertical Reel (9 / 16)', values: { ratioW: 9, ratioH: 16, width: 165 } }
    ],
    buildCss: (values) => `aspect-ratio: ${values.ratioW} / ${values.ratioH};\nwidth: ${values.width}px;`
  },

  {
    id: 'object-position',
    name: 'object-fit & object-position',
    category: 'Box & Borders',
    badge: 'Focal Point 2D',
    difficulty: 'Intermediate',
    summary: 'Controls how replaced media (images/videos) resize inside their frame and anchors the exact 2D focal point percentage.',
    gizmoType: 'xy-pad',
    gizmoKeys: { x: 'posX', y: 'posY', xMin: 0, xMax: 100, yMin: 0, yMax: 100 },
    syntaxAnatomy: 'object-fit: cover | contain | fill | none;\nobject-position: [x-percent]% [y-percent]%;',
    mentalModel: 'When object-fit: cover crops an image to fill a box, object-position: X% Y% lets you pan the cropped viewport so the subject stays visible. Drag the crosshair on the stage!',
    gotchas: [
      'object-position only has a visible panning effect when the image aspect ratio differs from its container box.',
      'Default value is 50% 50% (dead center).'
    ],
    challenge: {
      title: 'Top-Right Focal Anchor',
      description: 'Drag the 2D focal crosshair to the upper-right quadrant (posX >= 75%, posY <= 25%).',
      check: (values) => values.posX >= 75 && values.posY <= 25
    },
    controls: [
      { key: 'posX', label: 'Focal X (object-position-x)', min: 0, max: 100, step: 1, defaultValue: 50, unit: '%' },
      { key: 'posY', label: 'Focal Y (object-position-y)', min: 0, max: 100, step: 1, defaultValue: 35, unit: '%' },
      { key: 'fitIdx', label: 'Fit (0:cover, 1:contain, 2:none)', min: 0, max: 2, step: 1, defaultValue: 0, unit: 'enum' }
    ],
    presets: [
      { name: 'Center Crop (50% 50%)', values: { posX: 50, posY: 50, fitIdx: 0 } },
      { name: 'Top Subject Focus', values: { posX: 50, posY: 15, fitIdx: 0 } },
      { name: 'Zoomed Detail (none)', values: { posX: 80, posY: 20, fitIdx: 2 } }
    ],
    buildCss: (values) => {
      return `object-fit: ${OBJECT_FIT_MODES[values.fitIdx] || 'cover'};\nobject-position: ${values.posX}% ${values.posY}%;`;
    }
  }
];
