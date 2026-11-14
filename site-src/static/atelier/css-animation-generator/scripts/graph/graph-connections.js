// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

export function getOutputTargetIds(output) {
  if (!output) return [];
  if (Array.isArray(output.targetIds)) return output.targetIds.filter(Boolean);
  if (output.targetId) return [output.targetId];
  return [];
}

export function toggleOutputTarget(output, targetNodeId) {
  const currentTargetIds = getOutputTargetIds(output);
  const isAlreadyTargeted = currentTargetIds.includes(targetNodeId);
  const nextTargetIds = isAlreadyTargeted
    ? currentTargetIds.filter((id) => id !== targetNodeId)
    : [...currentTargetIds, targetNodeId];
  return { ...output, targetIds: nextTargetIds, targetId: undefined };
}

export function countIncomingConnections(nodes) {
  const incomingCountByNodeId = {};
  nodes.forEach((node) => {
    (node.outputs || []).forEach((output) => {
      getOutputTargetIds(output).forEach((targetId) => {
        incomingCountByNodeId[targetId] = (incomingCountByNodeId[targetId] || 0) + 1;
      });
    });
  });
  return incomingCountByNodeId;
}

export function pickInitialSelectedNode(nodes) {
  const nodeAfterTrigger = nodes[1];
  const firstNode = nodes[0];
  return nodes.find((node) => node.type === 'condition') || nodeAfterTrigger || firstNode;
}
