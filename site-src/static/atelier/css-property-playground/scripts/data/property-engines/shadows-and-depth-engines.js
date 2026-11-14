// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { BOX_SHADOW_FALLBACK_COLOR } from '../../config/constants.js';
import { convertHexToRgba } from '../../utils/value-math.js';

const TEXT_SHADOW_FALLBACK_COLOR = { hex: '#6366f1', red: 99, green: 102, blue: 241 };

export const SHADOWS_AND_DEPTH_ENGINES = [
  {
    id: 'box-shadow',
    name: 'box-shadow (Multi-Layer Stack)',
    category: 'Shadows & Depth',
    badge: 'Unlimited Layers',
    difficulty: 'Intermediate',
    summary: 'Compose ultra-realistic elevation by stacking multiple outer and inset shadow layers with independent offsets, blur, spread, color, and alpha.',
    gizmoType: 'multi-box-shadow',
    syntaxAnatomy: 'box-shadow:\n  [inset?] [x1]px [y1]px [blur1]px [spread1]px [color1],\n  [inset?] [x2]px [y2]px [blur2]px [spread2]px [color2];',
    mentalModel: 'Real-world light casts both a tight, sharp contact shadow and a wide, diffused ambient shadow. Add as many shadow layers as you want below, select any layer, and drag its light vector directly on the stage!',
    gotchas: [
      'Shadows are painted front-to-back in comma-separated order.',
      'Combining an outer drop shadow with an inset top white highlight creates tactile 3D buttons.'
    ],
    challenge: {
      title: '3+ Layer Tactile Elevation',
      description: 'Build a multi-layered shadow stack with at least 3 active shadow layers.',
      check: (values) => Array.isArray(values.layers) && values.layers.length >= 3
    },
    defaultState: {
      activeLayerIdx: 0,
      layers: [
        { x: 0, y: 4, blur: 6, spread: -1, color: '#4f46e5', alpha: 0.14, inset: false },
        { x: 0, y: 20, blur: 32, spread: -6, color: '#1e1b4b', alpha: 0.22, inset: false }
      ]
    },
    controls: [],
    presets: [
      {
        name: 'Tailwind Soft 2-Layer',
        values: {
          activeLayerIdx: 1,
          layers: [
            { x: 0, y: 4, blur: 6, spread: -1, color: '#4f46e5', alpha: 0.14, inset: false },
            { x: 0, y: 20, blur: 32, spread: -6, color: '#1e1b4b', alpha: 0.22, inset: false }
          ]
        }
      },
      {
        name: '3-Layer Luxury Elevation',
        values: {
          activeLayerIdx: 2,
          layers: [
            { x: 0, y: 2, blur: 4, spread: 0, color: '#0f172a', alpha: 0.06, inset: false },
            { x: 0, y: 12, blur: 20, spread: -4, color: '#4f46e5', alpha: 0.16, inset: false },
            { x: 0, y: 32, blur: 50, spread: -12, color: '#312e81', alpha: 0.28, inset: false }
          ]
        }
      },
      {
        name: 'Neumorphic Tactile Button',
        values: {
          activeLayerIdx: 0,
          layers: [
            { x: 10, y: 10, blur: 20, spread: 0, color: '#94a3b8', alpha: 0.45, inset: false },
            { x: -8, y: -8, blur: 18, spread: 0, color: '#ffffff', alpha: 0.95, inset: false },
            { x: 0, y: 2, blur: 3, spread: 0, color: '#ffffff', alpha: 0.8, inset: true }
          ]
        }
      },
      {
        name: 'Neo-Brutalist Double Stack',
        values: {
          activeLayerIdx: 0,
          layers: [
            { x: 6, y: 6, blur: 0, spread: 0, color: '#0f172a', alpha: 1, inset: false },
            { x: 12, y: 12, blur: 0, spread: 0, color: '#6366f1', alpha: 1, inset: false }
          ]
        }
      }
    ],
    buildCss: (values) => {
      const layerDeclarations = (values.layers || []).map(
        layer => `${layer.inset ? 'inset ' : ''}${layer.x}px ${layer.y}px ${layer.blur}px ${layer.spread}px ${convertHexToRgba(layer.color, layer.alpha, BOX_SHADOW_FALLBACK_COLOR)}`
      );
      return `box-shadow:\n  ${layerDeclarations.join(',\n  ')};`;
    }
  },

  {
    id: 'text-shadow',
    name: 'text-shadow (Multi-Layer 3D & Neon)',
    category: 'Shadows & Depth',
    badge: 'Multi-Layer Text',
    difficulty: 'Beginner',
    summary: 'Stack unlimited text-shadow layers to craft 3D extruded typography, multi-ring neon signs, or crisp editorial drop shadows.',
    gizmoType: 'multi-text-shadow',
    syntaxAnatomy: 'text-shadow:\n  [x1]px [y1]px [blur1]px [color1],\n  [x2]px [y2]px [blur2]px [color2];',
    mentalModel: 'By stacking multiple 0px-blur shadows at 1px, 2px, 3px, 4px offsets, you create true 3D block extrusion! By stacking increasing blur radii (4px, 14px, 32px), you create realistic neon tube glow.',
    gotchas: [
      'Unlike box-shadow, text-shadow does not have spread-radius or inset.',
      'Type your own custom preview text in the control panel below!'
    ],
    challenge: {
      title: '3D Extruded or Neon Stack (3+ Layers)',
      description: 'Create or select a text-shadow stack with at least 3 layers.',
      check: (values) => Array.isArray(values.layers) && values.layers.length >= 3
    },
    defaultState: {
      previewText: 'CSS STUDIO',
      activeLayerIdx: 0,
      layers: [
        { x: 2, y: 2, blur: 0, color: '#6366f1', alpha: 1 },
        { x: 4, y: 4, blur: 0, color: '#4338ca', alpha: 1 },
        { x: 6, y: 6, blur: 12, color: '#1e1b4b', alpha: 0.35 }
      ]
    },
    controls: [],
    presets: [
      {
        name: '3D Block Extrusion (4 Layers)',
        values: {
          previewText: '3D TYPE',
          activeLayerIdx: 0,
          layers: [
            { x: 2, y: 2, blur: 0, color: '#818cf8', alpha: 1 },
            { x: 4, y: 4, blur: 0, color: '#6366f1', alpha: 1 },
            { x: 6, y: 6, blur: 0, color: '#4f46e5', alpha: 1 },
            { x: 8, y: 10, blur: 14, color: '#1e1b4b', alpha: 0.45 }
          ]
        }
      },
      {
        name: 'Cyber Neon Glow (3 Layers)',
        values: {
          previewText: 'NEON GLOW',
          activeLayerIdx: 0,
          layers: [
            { x: 0, y: 0, blur: 4, color: '#f43f5e', alpha: 0.9 },
            { x: 0, y: 0, blur: 14, color: '#ec4899', alpha: 0.85 },
            { x: 0, y: 0, blur: 32, color: '#6366f1', alpha: 0.8 }
          ]
        }
      },
      {
        name: 'Retro Offset Print',
        values: {
          previewText: 'RETRO INK',
          activeLayerIdx: 0,
          layers: [
            { x: 4, y: 4, blur: 0, color: '#f43f5e', alpha: 0.95 },
            { x: -3, y: -3, blur: 0, color: '#06b6d4', alpha: 0.85 }
          ]
        }
      }
    ],
    buildCss: (values) => {
      const layerDeclarations = (values.layers || []).map(
        layer => `${layer.x}px ${layer.y}px ${layer.blur}px ${convertHexToRgba(layer.color, layer.alpha, TEXT_SHADOW_FALLBACK_COLOR)}`
      );
      return `text-shadow:\n  ${layerDeclarations.join(',\n  ')};`;
    }
  }
];
