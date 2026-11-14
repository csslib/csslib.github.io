// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { FALLBACK_LEAF_TAG } from '../config/constants.js';
import { CONCRETE_LEAF_TAGS } from '../data/layout-options.js';

const LEAF_TAG_SET = new Set(CONCRETE_LEAF_TAGS.map(leafTag => leafTag.tag));
const NEW_LEAF_TYPE_SCALE_BY_TAG = { h1: 'hero', h2: 'h2', h3: 'h3' };
const NEW_LEAF_DEFAULT_TYPE_SCALE = 'body';
const NEW_LEAF_VARIANT_BY_TAG = { button: 'btn-primary', span: 'badge-indigo' };
const NEW_LEAF_DEFAULT_VARIANT = 'prose';
let nodeIdCounter = 100;

export function isConcreteLeaf(tag) {
  return LEAF_TAG_SET.has(tag);
}

export function isPinnedChrome(chrome) {
  return Boolean(chrome) && (chrome.mode === 'sticky' || chrome.mode === 'fixed');
}

export function findNodeWithParent(tree, nodeId, parent = null) {
  if (!tree) return { node: null, parent: null };
  if (tree.id === nodeId) return { node: tree, parent };
  const children = Array.isArray(tree.children) ? tree.children : [];
  for (const child of children) {
    const found = findNodeWithParent(child, nodeId, tree);
    if (found.node) return found;
  }
  return { node: null, parent: null };
}

export function createUniqueId(prefix = 'node') {
  nodeIdCounter += 1;
  return `${prefix}-${nodeIdCounter}`;
}

export function createLeafNode(tag, nodeId) {
  const leafTag = CONCRETE_LEAF_TAGS.find(candidate => candidate.tag === tag)
    || CONCRETE_LEAF_TAGS.find(candidate => candidate.tag === FALLBACK_LEAF_TAG);
  return {
    id: nodeId,
    name: `${tag.toUpperCase()} Item`,
    tag,
    className: nodeId,
    text: leafTag.defaultText,
    typeScale: NEW_LEAF_TYPE_SCALE_BY_TAG[tag] || NEW_LEAF_DEFAULT_TYPE_SCALE,
    leafVariant: NEW_LEAF_VARIANT_BY_TAG[tag] || NEW_LEAF_DEFAULT_VARIANT,
    itemProps: { spanCols: 12, grow: 0, pushBottom: false }
  };
}

export function createStructureNode(tag, nodeId) {
  return {
    id: nodeId,
    name: `New ${tag}`,
    tag,
    className: nodeId,
    behavior: 'ram-grid',
    minColWidth: 200,
    gap: 'sm',
    padding: 'sm',
    maxWidth: '100%',
    containerQuery: false,
    chrome: { mode: 'static', edge: 'top', offset: 0, zIndex: 10, blur: false, surface: '#ffffff', border: true },
    itemProps: { spanCols: 6, grow: 1, pushBottom: false },
    children: [
      {
        id: createUniqueId('h3'),
        name: 'Heading',
        tag: 'h3',
        className: createUniqueId('title'),
        text: `New <${tag}> Block`,
        typeScale: 'h3',
        leafVariant: 'plain',
        itemProps: { grow: 0 }
      },
      {
        id: createUniqueId('p'),
        name: 'Paragraph',
        tag: 'p',
        className: createUniqueId('copy'),
        text: 'Click to customize layout behavior or add elements inside.',
        typeScale: 'caption',
        leafVariant: 'prose',
        itemProps: { grow: 0 }
      }
    ]
  };
}
