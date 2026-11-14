// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

export const TRANSFORMS_2D_AND_3D_ENGINES = [
  {
    id: 'transform-2d',
    name: 'transform (2D Matrix)',
    category: '2D & 3D Transforms',
    badge: 'Interactive Dial',
    difficulty: 'Intermediate',
    summary: 'Applies 2D geometric transformations: translation, rotation, non-uniform X/Y scaling, and skewing without disturbing surrounding document flow.',
    gizmoType: 'angle-dial',
    gizmoKeys: { angle: 'rotate', x: 'tx', y: 'ty' },
    syntaxAnatomy: 'transform: translate([tx]px, [ty]px) rotate([deg]deg) scale([sx], [sy]) skew([skewX]deg, [skewY]deg);',
    mentalModel: 'Transform functions are multiplied from left to right! Spin the circular angle dial on the stage or drag the element to adjust rotation and translation.',
    gotchas: [
      'Transforms create a new stacking context and containing block for position: fixed descendants.',
      'Animating transform is GPU-accelerated and runs on the compositor thread at 60/120fps.'
    ],
    challenge: {
      title: 'Dynamic Isometric Skew',
      description: 'Rotate the element to at least 15deg and apply a horizontal skew (skewX) of at least 10deg.',
      check: (values) => Math.abs(values.rotate) >= 15 && Math.abs(values.skewX) >= 10
    },
    controls: [
      { key: 'tx', label: 'translateX', min: -100, max: 100, step: 1, defaultValue: 0, unit: 'px' },
      { key: 'ty', label: 'translateY', min: -100, max: 100, step: 1, defaultValue: 0, unit: 'px' },
      { key: 'rotate', label: 'rotate', min: -180, max: 180, step: 1, defaultValue: -8, unit: 'deg' },
      { key: 'scale', label: 'scale', min: 0.4, max: 1.6, step: 0.05, defaultValue: 1.05, unit: '' },
      { key: 'skewX', label: 'skewX', min: -45, max: 45, step: 1, defaultValue: 0, unit: 'deg' },
      { key: 'skewY', label: 'skewY', min: -45, max: 45, step: 1, defaultValue: 0, unit: 'deg' }
    ],
    presets: [
      { name: 'Playful Sticker Tilt', values: { tx: 0, ty: -6, rotate: -8, scale: 1.05, skewX: 0, skewY: 0 } },
      { name: 'Isometric Card Plane', values: { tx: 0, ty: 0, rotate: -25, scale: 0.9, skewX: 20, skewY: 0 } },
      { name: 'Identity (Reset)', values: { tx: 0, ty: 0, rotate: 0, scale: 1, skewX: 0, skewY: 0 } }
    ],
    buildCss: (values) => `transform: translate(${values.tx}px, ${values.ty}px) rotate(${values.rotate}deg) scale(${values.scale}) skew(${values.skewX}deg, ${values.skewY}deg);`
  },

  {
    id: 'transform-origin',
    name: 'transform-origin',
    category: '2D & 3D Transforms',
    badge: 'Pivot Crosshair',
    difficulty: 'Intermediate',
    summary: 'Sets the exact X% and Y% anchor point (pivot pin) around which a rotation, scale, or skew transformation occurs.',
    gizmoType: 'xy-pad',
    gizmoKeys: { x: 'originX', y: 'originY', xMin: 0, xMax: 100, yMin: 0, yMax: 100 },
    syntaxAnatomy: 'transform-origin: [x-offset]% [y-offset]%;\ntransform: rotate([angle]deg) scale([scale]);',
    mentalModel: 'Imagine sticking a physical thumbtack into a postcard at (X%, Y%) and spinning the card around that pin! Drag the red pivot pin on the stage and scrub the rotation slider to feel the difference.',
    gotchas: [
      'Default transform-origin in CSS is 50% 50% (center), whereas in raw SVG attributes it defaults to 0 0.',
      'You can even place the pivot outside the element using values < 0% or > 100% for orbital motion!'
    ],
    challenge: {
      title: 'Bottom-Right Hinge Swing',
      description: 'Pin the pivot to the bottom-right corner (originX = 100%, originY = 100%) and rotate by at least 20 degrees.',
      check: (values) => values.originX === 100 && values.originY === 100 && Math.abs(values.rotate) >= 20
    },
    controls: [
      { key: 'originX', label: 'Origin X', min: 0, max: 100, step: 1, defaultValue: 0, unit: '%' },
      { key: 'originY', label: 'Origin Y', min: 0, max: 100, step: 1, defaultValue: 0, unit: '%' },
      { key: 'rotate', label: 'Test Rotation', min: -90, max: 90, step: 1, defaultValue: 18, unit: 'deg' },
      { key: 'scale', label: 'Test Scale', min: 0.5, max: 1.4, step: 0.05, defaultValue: 1, unit: '' }
    ],
    presets: [
      { name: 'Top-Left Hinge (0% 0%)', values: { originX: 0, originY: 0, rotate: 18, scale: 1 } },
      { name: 'Center Spin (50% 50%)', values: { originX: 50, originY: 50, rotate: 25, scale: 1 } },
      { name: 'Bottom-Right Corner', values: { originX: 100, originY: 100, rotate: -22, scale: 1 } }
    ],
    buildCss: (values) => `transform-origin: ${values.originX}% ${values.originY}%;\ntransform: rotate(${values.rotate}deg) scale(${values.scale});`
  },

  {
    id: 'perspective-3d',
    name: 'perspective & rotate3d()',
    category: '2D & 3D Transforms',
    badge: '3D Camera Frustum',
    difficulty: 'Advanced',
    summary: 'Defines the distance between the Z=0 plane and the viewer to give 3D-transformed elements realistic foreshortening.',
    gizmoType: 'xy-pad',
    gizmoKeys: { x: 'rotY', y: 'rotX', xMin: -70, xMax: 70, yMin: -70, yMax: 70 },
    syntaxAnatomy: 'transform: perspective([distance]px) rotateX([rx]deg) rotateY([ry]deg) translateZ([tz]px);',
    mentalModel: 'A small perspective value (e.g., 250px) acts like an extreme wide-angle lens right up close to the object (dramatic distortion). A large value (e.g., 1400px) acts like a telephoto lens from far away.',
    gotchas: [
      'Dragging horizontally rotates around the vertical Y-axis (rotateY); dragging vertically tilts around the horizontal X-axis (rotateX).',
      'Use transform-style: preserve-3d on parent containers when nesting multiple 3D faces.'
    ],
    challenge: {
      title: 'Extreme Wide-Angle 3D Tilt',
      description: 'Set perspective distance <= 400px and tilt rotateY >= 30deg for dramatic 3D depth.',
      check: (values) => values.persp <= 400 && Math.abs(values.rotY) >= 30
    },
    controls: [
      { key: 'persp', label: 'perspective', min: 200, max: 1600, step: 20, defaultValue: 550, unit: 'px' },
      { key: 'rotX', label: 'rotateX (Tilt Up/Down)', min: -70, max: 70, step: 1, defaultValue: 22, unit: 'deg' },
      { key: 'rotY', label: 'rotateY (Turn Left/Right)', min: -70, max: 70, step: 1, defaultValue: -28, unit: 'deg' },
      { key: 'tz', label: 'translateZ (Depth)', min: -100, max: 100, step: 5, defaultValue: 20, unit: 'px' }
    ],
    presets: [
      { name: 'Dramatic Hero Card', values: { persp: 500, rotX: 20, rotY: -28, tz: 20 } },
      { name: 'Extreme Fish-Eye 3D', values: { persp: 240, rotX: 35, rotY: 35, tz: 10 } },
      { name: 'Subtle Isometric', values: { persp: 1400, rotX: 30, rotY: -30, tz: 0 } }
    ],
    buildCss: (values) => `transform: perspective(${values.persp}px) rotateX(${values.rotX}deg) rotateY(${values.rotY}deg) translateZ(${values.tz}px);`
  }
];
