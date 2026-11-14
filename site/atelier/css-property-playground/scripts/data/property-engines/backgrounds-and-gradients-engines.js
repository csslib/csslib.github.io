// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { BLEND_MODES } from '../../config/constants.js';

const BACKGROUND_REPEAT_MODES = ['repeat', 'round', 'space', 'no-repeat'];

export const BACKGROUNDS_AND_GRADIENTS_ENGINES = [
  {
    id: 'linear-gradient',
    name: 'Gradients (Linear, Radial, Conic + N-Stops)',
    category: 'Backgrounds & Gradients',
    badge: 'Multi-Stop Builder',
    difficulty: 'Intermediate',
    summary: 'Build linear, radial, or conic gradients with unlimited color stops, custom hex colors, stop positions, focal coordinates, and repeating modes.',
    gizmoType: 'multi-gradient',
    syntaxAnatomy: 'background-image: linear-gradient([angle]deg, [color1] [pos1]%, [color2] [pos2]%, ...);',
    mentalModel: 'Add as many color stops as you need! Set two adjacent stops to the exact same percentage to create crisp geometric stripes, or switch to radial/conic and drag the center focal point on the canvas.',
    gotchas: [
      'conic-gradientrotates color stops around a 360-degree center point—ideal for pie charts and color wheels!',
      'Enable repeating- mode when your last color stop is less than 100% to tile stripes automatically.'
    ],
    challenge: {
      title: 'Multi-Stop Aurora (4+ Color Stops)',
      description: 'Add at least 4 color stops to your gradient or try Conic/Radial mode.',
      check: (values) => Array.isArray(values.stops) && values.stops.length >= 4
    },
    defaultState: {
      type: 'linear',
      repeating: false,
      angle: 135,
      centerX: 50,
      centerY: 50,
      stops: [
        { color: '#4f46e5', pos: 0 },
        { color: '#ec4899', pos: 52 },
        { color: '#f59e0b', pos: 100 }
      ]
    },
    controls: [],
    presets: [
      {
        name: '4-Stop Mesh Aurora',
        values: {
          type: 'linear',
          repeating: false,
          angle: 135,
          centerX: 50,
          centerY: 50,
          stops: [
            { color: '#312e81', pos: 0 },
            { color: '#4f46e5', pos: 35 },
            { color: '#ec4899', pos: 72 },
            { color: '#fbbf24', pos: 100 }
          ]
        }
      },
      {
        name: 'Radial Spotlight Glow',
        values: {
          type: 'radial',
          repeating: false,
          angle: 135,
          centerX: 35,
          centerY: 30,
          stops: [
            { color: '#fde047', pos: 0 },
            { color: '#f43f5e', pos: 45 },
            { color: '#312e81', pos: 100 }
          ]
        }
      },
      {
        name: 'Conic Color Wheel',
        values: {
          type: 'conic',
          repeating: false,
          angle: 45,
          centerX: 50,
          centerY: 50,
          stops: [
            { color: '#6366f1', pos: 0 },
            { color: '#ec4899', pos: 33 },
            { color: '#10b981', pos: 66 },
            { color: '#6366f1', pos: 100 }
          ]
        }
      },
      {
        name: 'Repeating Hazard Stripes',
        values: {
          type: 'linear',
          repeating: true,
          angle: 45,
          centerX: 50,
          centerY: 50,
          stops: [
            { color: '#4f46e5', pos: 0 },
            { color: '#4f46e5', pos: 10 },
            { color: '#e0e7ff', pos: 10 },
            { color: '#e0e7ff', pos: 20 }
          ]
        }
      }
    ],
    buildCss: (values) => {
      const prefix = values.repeating ? 'repeating-' : '';
      const stopList = (values.stops || []).map(stop => `${stop.color} ${stop.pos}%`).join(', ');
      if (values.type === 'radial') {
        return `background-image: ${prefix}radial-gradient(circle at ${values.centerX}% ${values.centerY}%, ${stopList});`;
      }
      if (values.type === 'conic') {
        return `background-image: ${prefix}conic-gradient(from ${values.angle}deg at ${values.centerX}% ${values.centerY}%, ${stopList});`;
      }
      return `background-image: ${prefix}linear-gradient(${values.angle}deg, ${stopList});`;
    }
  },

  {
    id: 'background-size-pos',
    name: 'background-size & background-position',
    category: 'Backgrounds & Gradients',
    badge: 'Pattern Tiling',
    difficulty: 'Beginner',
    summary: 'Controls the tiling dimensions, XY anchor offset, and repeat behavior of background patterns and textures.',
    gizmoType: 'bg-pattern-stage',
    gizmoKeys: { x: 'posX', y: 'posY', xMin: 0, xMax: 100, yMin: 0, yMax: 100 },
    syntaxAnatomy: 'background-size: [sizeW]px [sizeH]px;\nbackground-position: [posX]px [posY]px;\nbackground-repeat: repeat | space | round | no-repeat;',
    mentalModel: 'Combine CSS radial/linear gradients with explicit background-size to generate ultra-lightweight dot matrices and blueprint grids without external SVG files!',
    gotchas: [
      'background-repeat: round automatically rescales the tile so a whole number of tiles fit cleanly without clipping at the edges!'
    ],
    challenge: {
      title: 'Dense Isometric Dot Grid',
      description: 'Set Tile Width & Height <= 24px and pan the position offset.',
      check: (values) => values.sizeW <= 24 && values.sizeH <= 24
    },
    controls: [
      { key: 'sizeW', label: 'background-size Width', min: 12, max: 80, step: 2, defaultValue: 32, unit: 'px' },
      { key: 'sizeH', label: 'background-size Height', min: 12, max: 80, step: 2, defaultValue: 32, unit: 'px' },
      { key: 'posX', label: 'background-position-x', min: 0, max: 100, step: 2, defaultValue: 0, unit: 'px' },
      { key: 'posY', label: 'background-position-y', min: 0, max: 100, step: 2, defaultValue: 0, unit: 'px' },
      { key: 'repeatIdx', label: 'Repeat (0:repeat, 1:round, 2:space, 3:no-repeat)', min: 0, max: 3, step: 1, defaultValue: 0, unit: 'enum' }
    ],
    presets: [
      { name: '32px Dot Matrix', values: { sizeW: 32, sizeH: 32, posX: 0, posY: 0, repeatIdx: 0 } },
      { name: 'Dense 18px Micro Grid', values: { sizeW: 18, sizeH: 18, posX: 6, posY: 6, repeatIdx: 0 } },
      { name: 'Auto-Scaled Round Tiles', values: { sizeW: 48, sizeH: 48, posX: 0, posY: 0, repeatIdx: 1 } }
    ],
    buildCss: (values) => {
      return `background-image: radial-gradient(#4f46e5 2.5px, transparent 2.5px);\nbackground-size: ${values.sizeW}px ${values.sizeH}px;\nbackground-position: ${values.posX}px ${values.posY}px;\nbackground-repeat: ${BACKGROUND_REPEAT_MODES[values.repeatIdx] || 'repeat'};`;
    }
  },

  {
    id: 'mix-blend-mode',
    name: 'mix-blend-mode & isolation',
    category: 'Backgrounds & Gradients',
    badge: 'Optical Blending',
    difficulty: 'Intermediate',
    summary: 'Defines how an element\'s pixels mathematically blend with the overlapping layers beneath it (multiply, screen, overlay, difference, exclusion).',
    gizmoType: 'blend-mode-stage',
    gizmoKeys: { x: 'offsetX', y: 'offsetY', xMin: -60, xMax: 60, yMin: -60, yMax: 60 },
    syntaxAnatomy: 'mix-blend-mode: multiply | screen | overlay | difference | color-dodge;\nisolation: isolate;',
    mentalModel: 'multiply acts like overlapping physical ink transparencies (darkens); screen acts like overlapping stage spotlights (lightens); difference inverts overlapping colors for high-contrast text over any photo!',
    gotchas: [
      'Put isolation: isolate on a parent wrapper to prevent mix-blend-mode from bleeding all the way through to the page body background.'
    ],
    challenge: {
      title: 'Difference Inversion Mode',
      description: 'Select difference mode (modeIdx = 3) and drag the top layer across the overlapping circles.',
      check: (values) => values.modeIdx === 3
    },
    controls: [
      { key: 'modeIdx', label: 'Mode (0:multiply, 1:screen, 2:overlay, 3:difference, 4:hard-light)', min: 0, max: 4, step: 1, defaultValue: 0, unit: 'enum' },
      { key: 'offsetX', label: 'Top Layer Offset X', min: -60, max: 60, step: 2, defaultValue: 16, unit: 'px' },
      { key: 'offsetY', label: 'Top Layer Offset Y', min: -60, max: 60, step: 2, defaultValue: -10, unit: 'px' },
      { key: 'opacity', label: 'Layer Opacity', min: 0.2, max: 1, step: 0.05, defaultValue: 0.95, unit: '' }
    ],
    presets: [
      { name: 'CMYK Print Multiply', values: { modeIdx: 0, offsetX: 16, offsetY: -10, opacity: 0.95 } },
      { name: 'Additive RGB Screen', values: { modeIdx: 1, offsetX: 10, offsetY: 10, opacity: 0.95 } },
      { name: 'High-Contrast Difference', values: { modeIdx: 3, offsetX: 0, offsetY: 0, opacity: 1 } }
    ],
    buildCss: (values) => {
      return `.blend-parent {\n  isolation: isolate;\n}\n.blend-layer {\n  mix-blend-mode: ${BLEND_MODES[values.modeIdx] || 'multiply'};\n  opacity: ${values.opacity};\n}`;
    }
  }
];
