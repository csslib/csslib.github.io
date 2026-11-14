// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

const RADIAL_MASK_MODE = 1;

export const CLIP_MASK_AND_SHAPES_ENGINES = [
  {
    id: 'clip-path-polygon',
    name: 'clip-path (N-Point Polygon & Shapes)',
    category: 'Clip, Mask & Shapes',
    badge: 'Unlimited Vertices',
    difficulty: 'Intermediate',
    summary: 'Sculpt custom vector clipping paths with any number of polygon vertices (click canvas edges to add points, drag to move, or switch to circle/ellipse/inset).',
    gizmoType: 'clip-polygon',
    syntaxAnatomy: 'clip-path: polygon(x1% y1%, x2% y2%, ... xN% yN%) | circle(r% at cx% cy%) | inset(t% r% b% l% round radpx);',
    mentalModel: 'In polygon() mode, the browser connects your N coordinate pairs in order and clips everything outside. Click "+ Add Vertex" or click directly on the stage to add unlimited points, drag any handle on canvas, or remove vertices.',
    gotchas: [
      'CSS transitions between two clip-path polygons require both states to have the exact same number of vertices.',
      'clip-path clips box-shadow on the same element—apply filter: drop-shadow() on a parent wrapper to cast a shadow that follows the clipped shape!'
    ],
    challenge: {
      title: 'Multi-Vertex Custom Polygon (6+ Points)',
      description: 'In polygon mode, add vertices or choose a multi-point preset so your shape has at least 6 vertices.',
      check: (values) => values.mode === 'polygon' && Array.isArray(values.points) && values.points.length >= 6
    },
    defaultState: {
      mode: 'polygon',
      points: [
        { x: 50, y: 5 },
        { x: 95, y: 38 },
        { x: 78, y: 92 },
        { x: 22, y: 92 },
        { x: 5, y: 38 }
      ],
      circleR: 45,
      circleX: 50,
      circleY: 50,
      ellipseRX: 46,
      ellipseRY: 34,
      insetT: 10,
      insetR: 12,
      insetB: 10,
      insetL: 12,
      insetRound: 20
    },
    controls: [],
    presets: [
      {
        name: 'Pentagon (5 pts)',
        values: {
          mode: 'polygon',
          points: [{ x: 50, y: 5 }, { x: 95, y: 38 }, { x: 78, y: 92 }, { x: 22, y: 92 }, { x: 5, y: 38 }]
        }
      },
      {
        name: 'Hexagon (6 pts)',
        values: {
          mode: 'polygon',
          points: [{ x: 25, y: 6 }, { x: 75, y: 6 }, { x: 98, y: 50 }, { x: 75, y: 94 }, { x: 25, y: 94 }, { x: 2, y: 50 }]
        }
      },
      {
        name: 'Octagon Badge (8 pts)',
        values: {
          mode: 'polygon',
          points: [
            { x: 30, y: 4 }, { x: 70, y: 4 }, { x: 96, y: 30 }, { x: 96, y: 70 },
            { x: 70, y: 96 }, { x: 30, y: 96 }, { x: 4, y: 70 }, { x: 4, y: 30 }
          ]
        }
      },
      {
        name: '5-Point Star (10 pts)',
        values: {
          mode: 'polygon',
          points: [
            { x: 50, y: 2 }, { x: 63, y: 35 }, { x: 98, y: 35 }, { x: 70, y: 57 }, { x: 81, y: 92 },
            { x: 50, y: 72 }, { x: 19, y: 92 }, { x: 30, y: 57 }, { x: 2, y: 35 }, { x: 37, y: 35 }
          ]
        }
      },
      {
        name: 'Right Chevron Arrow (6 pts)',
        values: {
          mode: 'polygon',
          points: [
            { x: 8, y: 15 }, { x: 68, y: 15 }, { x: 95, y: 50 },
            { x: 68, y: 85 }, { x: 8, y: 85 }, { x: 32, y: 50 }
          ]
        }
      },
      {
        name: 'Speech Callout (7 pts)',
        values: {
          mode: 'polygon',
          points: [
            { x: 6, y: 8 }, { x: 94, y: 8 }, { x: 94, y: 72 }, { x: 55, y: 72 },
            { x: 32, y: 96 }, { x: 34, y: 72 }, { x: 6, y: 72 }
          ]
        }
      },
      { name: 'Circle Spotlight', values: { mode: 'circle', circleR: 42, circleX: 50, circleY: 50 } },
      { name: 'Rounded Inset Frame', values: { mode: 'inset', insetT: 12, insetR: 12, insetB: 12, insetL: 12, insetRound: 24 } }
    ],
    buildCss: (values) => {
      if (values.mode === 'circle') {
        return `clip-path: circle(${values.circleR}% at ${values.circleX}% ${values.circleY}%);`;
      }
      if (values.mode === 'ellipse') {
        return `clip-path: ellipse(${values.ellipseRX}% ${values.ellipseRY}% at ${values.circleX}% ${values.circleY}%);`;
      }
      if (values.mode === 'inset') {
        return `clip-path: inset(${values.insetT}% ${values.insetR}% ${values.insetB}% ${values.insetL}% round ${values.insetRound}px);`;
      }
      const vertexList = (values.points || []).map(point => `${point.x}% ${point.y}%`).join(', ');
      return `clip-path: polygon(${vertexList});`;
    }
  },

  {
    id: 'shape-outside',
    name: 'shape-outside & shape-margin',
    category: 'Clip, Mask & Shapes',
    badge: 'Editorial Text Wrap',
    difficulty: 'Advanced',
    summary: 'Flows inline paragraph text around non-rectangular floated geometry (circle, ellipse, or polygon) with adjustable breathing room (shape-margin).',
    gizmoType: 'shape-outside-sim',
    syntaxAnatomy: 'float: left;\nshape-outside: circle([r]% at [cx]% [cy]%);\nshape-margin: [px]px;\nclip-path: circle([r]% at [cx]% [cy]%);',
    mentalModel: 'Normally floated elements wrap text around a rigid rectangular bounding box. shape-outside lets text hug circular, elliptical, or polygonal contours! Drag the center point on the stage to watch the live editorial text reflow.',
    gotchas: [
      'shape-outside ONLY works on floated elements (float: left or float: right) that have explicit width and height.',
      'shape-margin pushes the wrapped text outward from the shape contour (clipped to the element\'s margin box).'
    ],
    challenge: {
      title: 'Generous Editorial Wrap',
      description: 'Set shape-margin >= 16px and move the circle center X >= 35% to create a curved magazine pull-quote wrap.',
      check: (values) => values.shapeMargin >= 16 && values.cx >= 35
    },
    controls: [
      { key: 'radius', label: 'Shape Radius', min: 25, max: 65, step: 1, defaultValue: 48, unit: '%' },
      { key: 'cx', label: 'Circle Center X', min: 0, max: 75, step: 1, defaultValue: 30, unit: '%' },
      { key: 'cy', label: 'Circle Center Y', min: 15, max: 85, step: 1, defaultValue: 50, unit: '%' },
      { key: 'shapeMargin', label: 'shape-margin', min: 0, max: 32, step: 1, defaultValue: 14, unit: 'px' },
      { key: 'floatBoxSize', label: 'Float Element Size', min: 110, max: 180, step: 5, defaultValue: 145, unit: 'px' }
    ],
    presets: [
      { name: 'Magazine Drop Orb', values: { radius: 48, cx: 30, cy: 50, shapeMargin: 14, floatBoxSize: 145 } },
      { name: 'Quarter Corner Arc', values: { radius: 62, cx: 5, cy: 20, shapeMargin: 18, floatBoxSize: 160 } },
      { name: 'Tight Avatar Wrap', values: { radius: 45, cx: 50, cy: 50, shapeMargin: 8, floatBoxSize: 125 } }
    ],
    buildCss: (values) => `.floated-shape {\n  float: left;\n  width: ${values.floatBoxSize}px;\n  height: ${values.floatBoxSize}px;\n  shape-outside: circle(${values.radius}% at ${values.cx}% ${values.cy}%);\n  shape-margin: ${values.shapeMargin}px;\n  clip-path: circle(${values.radius}% at ${values.cx}% ${values.cy}%);\n}`
  },

  {
    id: 'mask-image-gradient',
    name: 'mask-image & mask-size',
    category: 'Clip, Mask & Shapes',
    badge: 'Alpha Fade Mask',
    difficulty: 'Intermediate',
    summary: 'Uses alpha/luminance gradients to smoothly fade out edges of images, cards, or scrolling lists into any background.',
    gizmoType: 'mask-stage',
    syntaxAnatomy: 'mask-image: linear-gradient([angle]deg, rgba(0,0,0,1) [start]%, rgba(0,0,0,0) [end]%);',
    mentalModel: 'Unlike clip-path which has a razor-sharp vector edge, mask-image uses the alpha channel of a gradient or SVG to create feathered, semi-transparent fades over any background texture.',
    gotchas: [
      'Include -webkit-mask-image for maximum cross-browser compatibility.',
      'Opaque black in the mask reveals the element (100% alpha); transparent hides it (0% alpha).'
    ],
    challenge: {
      title: 'Smooth Bottom Fade-Out',
      description: 'Set Mask Angle to 180deg and Fade End <= 90% so the bottom edge dissolves smoothly.',
      check: (values) => values.angle === 180 && values.endStop <= 90
    },
    controls: [
      { key: 'modeIdx', label: 'Mask Type (0:linear, 1:radial)', min: 0, max: 1, step: 1, defaultValue: 0, unit: 'enum' },
      { key: 'angle', label: 'Linear Angle', min: 0, max: 360, step: 5, defaultValue: 180, unit: 'deg' },
      { key: 'startStop', label: 'Opaque Solid Stop', min: 0, max: 85, step: 1, defaultValue: 35, unit: '%' },
      { key: 'endStop', label: 'Transparent Fade Stop', min: 20, max: 100, step: 1, defaultValue: 92, unit: '%' }
    ],
    presets: [
      { name: 'Bottom Scroll Fade (180deg)', values: { modeIdx: 0, angle: 180, startStop: 40, endStop: 95 } },
      { name: 'Radial Vignette Spotlight', values: { modeIdx: 1, angle: 180, startStop: 30, endStop: 85 } },
      { name: 'Right Edge Dissolve (90deg)', values: { modeIdx: 0, angle: 90, startStop: 45, endStop: 95 } }
    ],
    buildCss: (values) => {
      const maskGradient = values.modeIdx === RADIAL_MASK_MODE
        ? `radial-gradient(circle at 50% 50%, black ${values.startStop}%, transparent ${values.endStop}%)`
        : `linear-gradient(${values.angle}deg, black ${values.startStop}%, transparent ${values.endStop}%)`;
      return `-webkit-mask-image: ${maskGradient};\nmask-image: ${maskGradient};`;
    }
  }
];
