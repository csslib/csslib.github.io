// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { formatAnimationShorthand, formatKeyframeDeclarations, groupStepsByTarget, sortKeyframesByOffset } from './production-css.js';

export function buildScopedPreviewCss({ schedule, mockCss, scopeId }) {
  const steps = (schedule || { steps: [] }).steps;
  return (
    `/* User Mock Base CSS (Scoped to #${scopeId}) */\n` +
    scopeMockCss(mockCss, scopeId) +
    '\n' +
    buildPreviewKeyframes(steps, scopeId) +
    buildPreviewAnimationRules(steps, scopeId)
  );
}

function scopeSelectorList(selectorList, scopeId) {
  return selectorList
    .split(',')
    .map((selector) => `#${scopeId} ${selector.trim()}`)
    .join(', ');
}

function scopeMockCss(mockCss, scopeId) {
  return (mockCss || '').replace(
    /(^|\})\s*([.#a-zA-Z0-9_-][^{]*)\{/g,
    (match, closingBrace, selectorList) => {
      if (selectorList.trim().startsWith('@')) return match;
      return `${closingBrace}\n${scopeSelectorList(selectorList, scopeId)} {`;
    }
  );
}

function toPreviewKeyframesName(scopeId, nodeId) {
  return `${scopeId}-kf-${nodeId.replace(/[^a-zA-Z0-9]/g, '')}`;
}

function buildPreviewKeyframes(steps, scopeId) {
  return steps
    .map((step) => {
      const stops = sortKeyframesByOffset(step.keyframes)
        .map((keyframe) => `${keyframe.offset}% { ${formatKeyframeDeclarations(keyframe).join(' ')} }`)
        .join('\n');
      return `@keyframes ${toPreviewKeyframesName(scopeId, step.nodeId)} {\n${stops}\n}\n`;
    })
    .join('');
}

function buildPreviewAnimationRules(steps, scopeId) {
  return Object.entries(groupStepsByTarget(steps))
    .map(([selector, targetSteps]) => {
      const animations = targetSteps.map((step) =>
        formatAnimationShorthand(toPreviewKeyframesName(scopeId, step.nodeId), step)
      );
      return `${scopeSelectorList(selector, scopeId)} { will-change: transform, opacity, filter; animation: ${animations.join(', ')}; }\n`;
    })
    .join('');
}
