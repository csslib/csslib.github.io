// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { DEFAULT_CSS_MODE, DEFAULT_VIEWPORT_WIDTH_PX, MIN_SEQUENCE_DURATION_MS } from '../config/constants.js';
import { getOutputTargetIds } from './graph-connections.js';

const DEFAULT_CONDITION_THRESHOLD_PX = 768;
const DEFAULT_ANIMATION_DURATION_MS = 600;
const MAX_SCHEDULING_PASSES = 50;
const ESTIMATED_MULTI_ELEMENT_COUNT = 3;
const SINGLE_ELEMENT_COUNT = 1;
const DEFAULT_TARGET_SELECTOR = '.scene-card';
const REPEATED_CARD_SELECTOR = '.scene-card';
const DEFAULT_EASING = 'ease-out';

export function computeExecutionSchedule(nodes, environment) {
  const nodeList = nodes || [];
  const triggerNode = nodeList.find((node) => node.type === 'trigger') || nodeList[0];
  if (!triggerNode) {
    return { steps: [], activePathNodeIds: [], activeEdges: [], totalDurationMs: 0, matchedRangeLabel: null };
  }

  const activePath = discoverActivePath(nodeList, triggerNode.id, environment);
  const { completionMsByNodeId, steps } = scheduleActiveNodes(activePath, triggerNode.id);
  const activeEdges = activePath.edges.map((edge) => ({
    ...edge,
    startMs: completionMsByNodeId.get(edge.from) || 0
  }));

  steps.sort((first, second) => first.startMs - second.startMs);
  const totalDurationMs = steps.reduce((longestMs, step) => Math.max(longestMs, step.endMs), MIN_SEQUENCE_DURATION_MS);

  return {
    steps,
    activePathNodeIds: Array.from(activePath.activeNodeIds),
    activeEdges,
    totalDurationMs,
    matchedRangeLabel: activePath.matchedRangeLabel
  };
}

function discoverActivePath(nodes, triggerNodeId, environment) {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const activeNodeIds = new Set();
  const edges = [];
  let matchedRangeLabel = null;

  const visit = (nodeId, ancestorIds) => {
    if (ancestorIds.has(nodeId)) return;
    const node = nodesById.get(nodeId);
    if (!node) return;

    activeNodeIds.add(nodeId);
    const pathIds = new Set(ancestorIds).add(nodeId);
    const branch = selectActiveOutputs(node, environment);
    if (branch.matchedRangeLabel !== null) matchedRangeLabel = branch.matchedRangeLabel;

    branch.outputs.forEach((output) => {
      getOutputTargetIds(output).forEach((targetId) => {
        edges.push({ from: node.id, to: targetId, port: output.id });
        visit(targetId, pathIds);
      });
    });
  };

  visit(triggerNodeId, new Set());
  return { nodesById, activeNodeIds, edges: deduplicateEdges(edges), matchedRangeLabel };
}

function selectActiveOutputs(node, environment) {
  if (node.type === 'trigger' || node.type === 'animation') {
    return { outputs: node.outputs || [], matchedRangeLabel: null };
  }
  if (node.type !== 'condition') {
    return { outputs: [], matchedRangeLabel: null };
  }
  const branch = selectConditionBranch(node, environment);
  return { outputs: branch.output ? [branch.output] : [], matchedRangeLabel: branch.matchedRangeLabel };
}

function selectConditionBranch(node, environment) {
  if (node.conditionType === 'viewportRanges') {
    return selectWidthRangeBranch(node, environment);
  }
  if (node.conditionType === 'viewport') {
    const thresholdPx = Number(node.value) || DEFAULT_CONDITION_THRESHOLD_PX;
    const isConditionMet =
      node.operator === '<' ? environment.viewportWidth < thresholdPx : environment.viewportWidth >= thresholdPx;
    return { output: findOutputById(node, isConditionMet ? 'true' : 'false'), matchedRangeLabel: null };
  }
  if (node.conditionType === 'reducedMotion') {
    return { output: findOutputById(node, environment.prefersReducedMotion ? 'true' : 'false'), matchedRangeLabel: null };
  }
  return { output: null, matchedRangeLabel: null };
}

function selectWidthRangeBranch(node, environment) {
  const viewportWidthPx = Number(environment.viewportWidth) || DEFAULT_VIEWPORT_WIDTH_PX;
  const ranges = node.ranges || [];
  const matchedRange =
    ranges.find((range) => viewportWidthPx >= Number(range.min) && viewportWidthPx <= Number(range.max)) ||
    ranges[ranges.length - 1];
  if (!matchedRange) return { output: null, matchedRangeLabel: null };
  return { output: findOutputById(node, matchedRange.id), matchedRangeLabel: `${matchedRange.label}` };
}

function findOutputById(node, outputId) {
  return (node.outputs || []).find((output) => output.id === outputId);
}

function deduplicateEdges(edges) {
  const edgesByKey = new Map();
  edges.forEach((edge) => {
    edgesByKey.set(`${edge.from}->${edge.to}:${edge.port}`, edge);
  });
  return Array.from(edgesByKey.values());
}

function scheduleActiveNodes({ nodesById, activeNodeIds, edges }, triggerNodeId) {
  const completionMsByNodeId = new Map([[triggerNodeId, 0]]);
  const steps = [];

  let hasProgress = true;
  let passCount = 0;
  while (hasProgress && passCount < MAX_SCHEDULING_PASSES) {
    hasProgress = false;
    passCount++;

    for (const nodeId of activeNodeIds) {
      if (completionMsByNodeId.has(nodeId)) continue;

      const incomingEdges = edges.filter((edge) => edge.to === nodeId);
      const areAllParentsComplete = incomingEdges.every((edge) => completionMsByNodeId.has(edge.from));
      if (!areAllParentsComplete) continue;

      hasProgress = true;
      const readyAtMs =
        incomingEdges.length > 0
          ? Math.max(...incomingEdges.map((edge) => completionMsByNodeId.get(edge.from) || 0))
          : 0;

      const node = nodesById.get(nodeId);
      if (!node || node.type !== 'animation') {
        completionMsByNodeId.set(nodeId, readyAtMs);
        continue;
      }

      const step = createAnimationStep(node, readyAtMs, incomingEdges.length);
      completionMsByNodeId.set(nodeId, step.endMs);
      steps.push(step);
    }
  }

  return { completionMsByNodeId, steps };
}

function createAnimationStep(node, readyAtMs, parentCount) {
  const startMs = readyAtMs + (Number(node.delay) || 0);
  const durationMs = Number(node.duration) || DEFAULT_ANIMATION_DURATION_MS;
  const staggerMs = Number(node.stagger) || 0;
  const staggeredElementCount = Math.max(0, estimateTargetElementCount(node.target) - 1);
  const endMs = startMs + durationMs + staggerMs * staggeredElementCount;

  return {
    nodeId: node.id,
    title: node.title,
    target: node.target || DEFAULT_TARGET_SELECTOR,
    cssMode: node.cssMode || DEFAULT_CSS_MODE,
    startMs,
    durationMs,
    staggerMs,
    endMs,
    parentCount,
    waitedForMs: readyAtMs,
    easing: node.easing || DEFAULT_EASING,
    keyframes: node.keyframes || []
  };
}

function estimateTargetElementCount(targetSelector) {
  const isMultiElementTarget =
    targetSelector && (targetSelector.includes(REPEATED_CARD_SELECTOR) || targetSelector.includes(','));
  return isMultiElementTarget ? ESTIMATED_MULTI_ELEMENT_COUNT : SINGLE_ELEMENT_COUNT;
}
