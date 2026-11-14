// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { isSidebarChild } from './layout-compiler.js';
import { BENTO_COLUMN_COUNT, COMPILER_FALLBACKS } from '../config/constants.js';
import { FLUID_SPACE_PRESETS, FLUID_TYPE_PRESETS } from '../data/layout-options.js';

const ZERO_SPACE_CSS = '0px';
const MAIN_COLUMN_FLEX_GROW = 999;
const MAIN_COLUMN_MIN_INLINE_SIZE_PX = 280;
const MULTI_COLUMN_TRACK_MIN_PX = 240;
const CHROME_BLUR_RADIUS_PX = 12;
const PLAIN_LEAF_DECLARATIONS = ['color: #0f172a;'];

const LEAF_VARIANT_DECLARATIONS = {
  'prose': ['color: #475569;', 'max-inline-size: 65ch;'],
  'badge-indigo': pillBadgeDeclarations({ background: '#e0e7ff', color: '#4338ca' }),
  'badge-emerald': pillBadgeDeclarations({ background: '#d1fae5', color: '#047857' }),
  'badge-amber': pillBadgeDeclarations({ background: '#fef3c7', color: '#b45309' }),
  'badge-slate': [
    'display: inline-flex;',
    'width: fit-content;',
    'letter-spacing: 0.06em;',
    'color: #64748b;',
    'font-weight: 600;'
  ],
  'btn-primary': [
    'display: inline-flex;',
    'align-items: center;',
    'justify-content: center;',
    'padding: 0.45rem 0.9rem;',
    'border-radius: 8px;',
    'background: #4f46e5;',
    'color: #ffffff;',
    'font-weight: 500;',
    'border: none;',
    'cursor: pointer;'
  ],
  'nav-item': [
    'padding: 0.3rem 0.65rem;',
    'border-radius: 6px;',
    'color: #334155;',
    'font-weight: 500;'
  ],
  'link-block': [
    'display: block;',
    'padding: 0.4rem 0.6rem;',
    'border-radius: 6px;',
    'color: #334155;',
    'text-decoration: none;',
    'background: #f8fafc;'
  ],
  'muted-box': [
    'padding: 0.6rem 0.75rem;',
    'border-radius: 8px;',
    'background: #f1f5f9;',
    'color: #475569;'
  ]
};

export function declarationsForItemInParent(node, parentNode, childIndex) {
  if (!parentNode) return [];
  switch (parentNode.behavior) {
    case 'sidebar-switcher':
      return declarationsForSidebarSwitcherChild(parentNode, childIndex);
    case 'bento-12': {
      const spanCols = node.itemProps?.spanCols || COMPILER_FALLBACKS.spanCols;
      return [`grid-column: span ${spanCols} / span ${spanCols};`];
    }
    case 'cluster-flow':
    case 'pancake-stack':
      return declarationsForFlexChild(node, parentNode.behavior);
    default:
      return [];
  }
}

function declarationsForSidebarSwitcherChild(parentNode, childIndex) {
  if (isSidebarChild(parentNode, childIndex)) {
    const sidebarWidthPx = parentNode.sidebarWidth || COMPILER_FALLBACKS.sidebarWidthPx;
    return [`flex: 1 1 ${sidebarWidthPx}px;`];
  }
  const mainMinPercent = parentNode.mainMinPercent || COMPILER_FALLBACKS.mainMinPercent;
  return [
    `flex: ${MAIN_COLUMN_FLEX_GROW} 1 ${mainMinPercent}%;`,
    `min-inline-size: min(100%, ${MAIN_COLUMN_MIN_INLINE_SIZE_PX}px);`
  ];
}

function declarationsForFlexChild(node, parentBehavior) {
  const declarations = [];
  const grow = node.itemProps?.grow;
  if (grow && grow > 0) {
    declarations.push(`flex: ${grow} 1 auto;`);
  }
  if (node.itemProps?.pushBottom && parentBehavior === 'pancake-stack') {
    declarations.push('margin-block-start: auto;');
  }
  return declarations;
}

export function declarationsForContainer(node) {
  const gapCss = FLUID_SPACE_PRESETS[node.gap || 'sm']?.clamp || COMPILER_FALLBACKS.gapCss;
  const paddingCss = FLUID_SPACE_PRESETS[node.padding || 'none']?.clamp || ZERO_SPACE_CSS;
  return [
    ...(node.containerQuery ? ['container-type: inline-size;'] : []),
    ...declarationsForMaxWidth(node.maxWidth),
    ...(paddingCss !== ZERO_SPACE_CSS ? [`padding: ${paddingCss};`] : []),
    ...declarationsForBehavior(node, gapCss),
    ...(node.chrome ? declarationsForChrome(node.chrome) : []),
    ...(node.tag === 'ul' ? ['list-style: none;', 'margin-block: 0;'] : [])
  ];
}

function declarationsForMaxWidth(maxWidth) {
  if (maxWidth && maxWidth !== '100%') {
    return [`width: min(100%, ${maxWidth});`, 'margin-inline: auto;'];
  }
  return ['width: 100%;'];
}

function declarationsForBehavior(node, gapCss) {
  const gapDeclarations = gapCss !== ZERO_SPACE_CSS ? [`gap: ${gapCss};`] : [];
  switch (node.behavior) {
    case 'ram-grid': {
      const minColWidthPx = node.minColWidth || COMPILER_FALLBACKS.minColWidthPx;
      const stretchMode = node.gridStretch || 'auto-fit';
      return [
        'display: grid;',
        `grid-template-columns: repeat(${stretchMode}, minmax(min(100%, ${minColWidthPx}px), 1fr));`,
        ...gapDeclarations
      ];
    }
    case 'sidebar-switcher':
      return ['display: flex;', 'flex-wrap: wrap;', 'align-items: flex-start;', ...gapDeclarations];
    case 'cluster-flow':
      return [
        'display: flex;',
        `flex-wrap: ${node.clusterWrap || 'wrap'};`,
        `justify-content: ${node.clusterJustify || 'space-between'};`,
        'align-items: center;',
        ...gapDeclarations,
        ...(node.clusterWrap === 'nowrap' ? ['overflow-x: auto;'] : [])
      ];
    case 'bento-12':
      return [
        'display: grid;',
        `grid-template-columns: repeat(${BENTO_COLUMN_COUNT}, minmax(0, 1fr));`,
        ...gapDeclarations
      ];
    case 'holy-grail-split':
      return [
        'display: grid;',
        `grid-template-columns: repeat(auto-fit, minmax(min(100%, ${MULTI_COLUMN_TRACK_MIN_PX}px), 1fr));`,
        ...gapDeclarations
      ];
    case 'pancake-stack':
    default:
      return ['display: flex;', 'flex-direction: column;', ...gapDeclarations];
  }
}

function declarationsForChrome(chrome) {
  const { surface, blur, border } = chrome;
  return [
    ...declarationsForChromePosition(chrome),
    ...(surface && surface !== 'transparent' ? [`background: ${surface};`] : []),
    ...(blur ? [`backdrop-filter: blur(${CHROME_BLUR_RADIUS_PX}px);`, `-webkit-backdrop-filter: blur(${CHROME_BLUR_RADIUS_PX}px);`] : []),
    ...(border ? ['border: 1px solid #e2e8f0;', 'border-radius: 10px;'] : [])
  ];
}

function declarationsForChromePosition({ mode, edge, offset, zIndex }) {
  const edgeOffsetDeclaration = `${edge || 'top'}: ${offset || 0}px;`;
  if (mode === 'sticky') {
    return ['position: sticky;', edgeOffsetDeclaration, `z-index: ${zIndex || COMPILER_FALLBACKS.stickyZIndex};`];
  }
  if (mode === 'fixed') {
    return ['position: fixed;', edgeOffsetDeclaration, 'inset-inline: 0;', `z-index: ${zIndex || COMPILER_FALLBACKS.fixedZIndex};`];
  }
  return [];
}

export function declarationsForLeaf(node) {
  const typePreset = FLUID_TYPE_PRESETS[node.typeScale || 'body'] || FLUID_TYPE_PRESETS.body;
  const variantDeclarations = Object.hasOwn(LEAF_VARIANT_DECLARATIONS, node.leafVariant)
    ? LEAF_VARIANT_DECLARATIONS[node.leafVariant]
    : PLAIN_LEAF_DECLARATIONS;
  return [
    `font-size: ${typePreset.clamp};`,
    `font-weight: ${typePreset.weight};`,
    `line-height: ${typePreset.lineHeight};`,
    'margin: 0;',
    ...variantDeclarations
  ];
}

function pillBadgeDeclarations({ background, color }) {
  return [
    'display: inline-flex;',
    'align-items: center;',
    'width: fit-content;',
    'padding: 0.2rem 0.6rem;',
    'border-radius: 999px;',
    `background: ${background};`,
    `color: ${color};`,
    'font-weight: 600;'
  ];
}
