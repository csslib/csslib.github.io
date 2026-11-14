// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { html, svg } from 'lit';
import { KinetixLightDomElement } from './kinetix-light-dom-element.js';
import { countIncomingConnections, getOutputTargetIds } from '../graph/graph-connections.js';
import { renderIcon } from '../ui/icons.js';

const NODE_CARD_WIDTH_PX = 228;
const FIRST_OUTPUT_PORT_OFFSET_Y_PX = 56;
const OUTPUT_PORT_SPACING_PX = 28;
const INPUT_PORT_OFFSET_Y_PX = 44;
const MIN_WIRE_CURVE_PX = 60;
const WIRE_CURVE_RATIO = 0.5;
const MIN_NODE_POSITION_PX = 12;

const WIRE_COLORS = {
  activeCondition: '#F59E0B',
  activeFlow: '#e63e14',
  inactive: '#CBD5E1',
  conditionPulse: '#F59E0B',
  flowPulse: '#10B981'
};

class KinetixNodeGraph extends KinetixLightDomElement {
  static properties = {
    nodes: { type: Array },
    selectedNodeId: { type: String },
    connectionSource: { type: Object },
    primarySchedule: { type: Object },
    isPlaying: { type: Boolean },
    currentTimeMs: { type: Number },
    simulatedWidth: { type: Number },
    draggingNodeId: { type: String, state: true }
  };

  constructor() {
    super();
    this.draggingNodeId = null;
    this.dragOffset = { x: 0, y: 0 };
  }

  render() {
    const nodes = this.nodes || [];
    const graphContext = {
      activeNodeIds: this.primarySchedule?.activePathNodeIds || [],
      incomingCountByNodeId: countIncomingConnections(nodes)
    };

    return html`
      <div class="flex flex-col h-full min-h-[340px] bg-slate-50/70 relative overflow-hidden">
        ${this.renderToolbar()}

        <div
          class="kx-canvas-scroll kx-dot-canvas relative flex-1 overflow-auto cursor-grab active:cursor-grabbing"
          @mousemove="${(event) => this.moveNodeDrag(event.clientX, event.clientY)}"
          @mouseup="${() => this.endNodeDrag()}"
          @mouseleave="${() => this.endNodeDrag()}"
          @touchmove="${(event) => this.handleCanvasTouchMove(event)}"
          @touchend="${() => this.endNodeDrag()}"
          @click="${() => {
            if (this.connectionSource) this.emit('cancel-connect');
          }}"
        >
          <div class="relative min-w-[1260px] min-h-[540px] h-full">
            ${this.renderWires()}

            ${nodes.map((node) => this.renderNodeCard(node, graphContext))}
          </div>
        </div>
      </div>
    `;
  }

  renderToolbar() {
    return html`
      <div class="h-11 px-3 bg-white border-b border-slate-200 flex items-center justify-between gap-2 z-10 shrink-0">
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-xs font-bold text-slate-800 flex items-center gap-1.5 min-w-0">
            <span class="text-indigo-600 shrink-0">${renderIcon('activity', 'w-3.5 h-3.5')}</span>
            <span class="truncate">Visual Orchestrator (Width @ ${this.simulatedWidth}px)</span>
          </span>
          ${this.connectionSource
            ? html`
                <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300 animate-pulse truncate min-w-0">
                  Click any node to toggle parallel wire connection (click canvas to finish)
                </span>
              `
            : html`
                <span class="hidden 2xl:inline text-[11px] text-slate-400 truncate min-w-0">
                  Connect one port to multiple nodes for parallel execution • Multiple inputs wait for all to finish
                </span>
              `}
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            @click="${() => this.emit('add-node', { nodeType: 'condition' })}"
            title="Width Range Router"
            class="inline-flex items-center gap-1 px-2 py-1 rounded-lg whitespace-nowrap bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-semibold transition-colors cursor-pointer"
          >
            ${renderIcon('plus', 'w-3 h-3')}
            <span class="hidden xl:inline">Width Range Router</span>
          </button>
          <button
            type="button"
            @click="${() => this.emit('add-node', { nodeType: 'animation' })}"
            title="Animation / Transition"
            class="inline-flex items-center gap-1 px-2 py-1 rounded-lg whitespace-nowrap bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-semibold transition-colors cursor-pointer"
          >
            ${renderIcon('plus', 'w-3 h-3')}
            <span class="hidden xl:inline">Animation / Transition</span>
          </button>
        </div>
      </div>
    `;
  }

  renderWires() {
    const nodes = this.nodes || [];
    const wires = [];

    nodes.forEach((node) => {
      (node.outputs || []).forEach((output, outputIndex) => {
        getOutputTargetIds(output).forEach((targetId) => {
          const targetNode = nodes.find((candidate) => candidate.id === targetId);
          if (!targetNode) return;
          wires.push(this.renderWire({ node, output, outputIndex, targetNode }));
        });
      });
    });

    return svg`
      <svg class="absolute inset-0 w-full h-full pointer-events-none z-0">
        ${wires}
      </svg>
    `;
  }

  renderWire({ node, output, outputIndex, targetNode }) {
    const pathData = buildWirePath(
      { x: node.x + NODE_CARD_WIDTH_PX, y: node.y + FIRST_OUTPUT_PORT_OFFSET_Y_PX + outputIndex * OUTPUT_PORT_SPACING_PX },
      { x: targetNode.x, y: targetNode.y + INPUT_PORT_OFFSET_Y_PX }
    );
    const primaryEdges = this.primarySchedule?.activeEdges || [];
    const isActiveEdge = primaryEdges.some(
      (edge) => edge.from === node.id && edge.to === targetNode.id && edge.port === output.id
    );
    const isCondition = node.type === 'condition';
    const strokeColor = isActiveEdge
      ? isCondition
        ? WIRE_COLORS.activeCondition
        : WIRE_COLORS.activeFlow
      : WIRE_COLORS.inactive;

    return svg`
      <g>
        <path
          d="${pathData}"
          fill="none"
          stroke="${strokeColor}"
          stroke-width="${isActiveEdge ? '3' : '2'}"
          stroke-dasharray="${isActiveEdge ? 'none' : '5 5'}"
          opacity="${isActiveEdge ? '0.95' : '0.6'}"
        />
        ${this.isPlaying && isActiveEdge
          ? svg`
              <circle r="5" fill="${isCondition ? WIRE_COLORS.conditionPulse : WIRE_COLORS.flowPulse}">
                <animateMotion dur="0.65s" repeatCount="indefinite" path="${pathData}" />
              </circle>
            `
          : ''}
      </g>
    `;
  }

  renderNodeCard(node, { activeNodeIds, incomingCountByNodeId }) {
    const isSelected = this.selectedNodeId === node.id;
    const isActiveBranch = activeNodeIds.includes(node.id);
    const incomingCount = incomingCountByNodeId[node.id] || 0;
    const step = this.primarySchedule?.steps?.find((candidate) => candidate.nodeId === node.id);
    const isExecutingNow =
      this.isPlaying && step && this.currentTimeMs >= step.startMs && this.currentTimeMs <= step.endMs;

    return html`
      <div
        style="left: ${node.x}px; top: ${node.y}px; width: ${NODE_CARD_WIDTH_PX}px;"
        @mousedown="${(event) => {
          event.stopPropagation();
          this.startNodeDrag(event.clientX, event.clientY, node, event.target);
        }}"
        @touchstart="${(event) => {
          if (event.touches[0]) {
            this.startNodeDrag(event.touches[0].clientX, event.touches[0].clientY, node, event.target);
          }
        }}"
        @click="${(event) => this.handleNodeClick(event, node)}"
        class="absolute z-10 rounded-xl bg-white transition-all select-none ${isSelected
          ? 'ring-2 ring-indigo-600 border border-indigo-500 shadow-lg shadow-indigo-500/10'
          : 'border border-slate-200/95 shadow-sm hover:border-slate-300'} ${isExecutingNow
          ? 'ring-2 ring-emerald-500 shadow-emerald-500/20'
          : ''} ${!isActiveBranch ? 'opacity-60' : ''}"
      >
        ${node.type !== 'trigger' ? this.renderInputPort(node, incomingCount) : ''}

        ${this.renderNodeHeader(node, isActiveBranch)}

        <div class="p-2.5 space-y-2 text-xs">
          ${incomingCount > 1
            ? html`
                <div class="flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-50 border border-violet-200 text-violet-800 text-[10px] font-semibold">
                  ${renderIcon('merge', 'w-3 h-3')}
                  <span>Wait-All Sync (${incomingCount} parallel inputs)</span>
                </div>
              `
            : ''}

          ${node.type === 'trigger' ? this.renderTriggerSummary(node) : ''}

          ${node.type === 'condition' ? this.renderConditionSummary(node) : ''}

          ${node.type === 'animation' ? this.renderAnimationSummary(node, step) : ''}

          <div class="pt-1 space-y-1.5 border-t border-slate-100">
            ${(node.outputs || []).map((output) => this.renderOutputPort(node, output))}
          </div>
        </div>
      </div>
    `;
  }

  renderInputPort(node, incomingCount) {
    const hasMultipleInputs = incomingCount > 1;

    return html`
      <div
        @click="${(event) => {
          event.stopPropagation();
          this.emit('complete-connect', { targetNodeId: node.id });
        }}"
        title="Click to connect or disconnect wire here"
        class="absolute -left-2.5 top-9 w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-transform hover:scale-125 ${this.connectionSource
          ? 'bg-indigo-600 border-white animate-bounce'
          : hasMultipleInputs
          ? 'bg-violet-600 border-white'
          : 'bg-white border-slate-400'}"
      >
        <div class="w-1.5 h-1.5 rounded-full ${hasMultipleInputs ? 'bg-white' : 'bg-slate-500'}"></div>
      </div>
    `;
  }

  renderNodeHeader(node, isActiveBranch) {
    return html`
      <div class="px-3 py-2 rounded-t-2xl border-b flex items-center justify-between ${getNodeHeaderClasses(node.type)}">
        <div class="flex items-center gap-1.5 min-w-0">
          ${node.type === 'trigger' ? renderIcon('zap', 'w-3.5 h-3.5') : ''}
          ${node.type === 'condition' ? renderIcon('gitBranch', 'w-3.5 h-3.5') : ''}
          ${node.type === 'animation' ? renderIcon('sparkles', 'w-3.5 h-3.5') : ''}
          <span class="text-[11px] font-bold truncate">${node.title}</span>
        </div>
        <span
          class="px-1.5 py-0.2 rounded text-[9px] font-bold ${isActiveBranch
            ? 'bg-emerald-600 text-white'
            : 'bg-slate-200 text-slate-500'}"
        >
          ${isActiveBranch ? 'ACTIVE' : 'IDLE'}
        </span>
      </div>
    `;
  }

  renderTriggerSummary(node) {
    return html`
      <div class="text-[11px] text-slate-600 flex items-center justify-between bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/70">
        <span>Event:</span>
        <span class="font-mono font-semibold text-indigo-700 uppercase">${node.triggerType}</span>
      </div>
    `;
  }

  renderConditionSummary(node) {
    return html`
      <div class="text-[10px] text-slate-600 bg-amber-50/60 px-2 py-1 rounded-lg border border-amber-200/70 font-mono">
        ${node.conditionType === 'viewportRanges'
          ? `${(node.ranges || []).length} Custom Width Ranges`
          : `prefers-reduced-motion`}
      </div>
    `;
  }

  renderAnimationSummary(node, step) {
    const hasColorStop = (node.keyframes || []).some((keyframe) => keyframe.useColors);

    return html`
      <div class="space-y-1">
        <div class="flex items-center justify-between gap-1 text-[11px]">
          <span class="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 truncate">
            ${node.target}
          </span>
          <span class="font-mono text-[10px] text-slate-500 shrink-0">
            ${node.duration}ms
          </span>
        </div>
        <div class="flex items-center justify-between text-[10px] text-slate-400">
          <span>${step ? `${step.startMs}→${step.endMs}ms` : `${node.keyframes?.length || 0} stops`}</span>
          ${hasColorStop
            ? html`<span class="text-pink-600 font-semibold flex items-center gap-0.5">${renderIcon('palette', 'w-3 h-3')} Colors</span>`
            : ''}
        </div>
      </div>
    `;
  }

  renderOutputPort(node, output) {
    const targetIds = getOutputTargetIds(output);
    const isConnectionSource =
      this.connectionSource?.nodeId === node.id && this.connectionSource?.portId === output.id;

    return html`
      <div class="flex items-center justify-end gap-1.5 relative">
        <span class="text-[10px] font-medium text-slate-600 truncate">
          ${output.label} ${targetIds.length > 1 ? `(${targetIds.length}∥)` : ''}
        </span>
        <button
          type="button"
          @click="${(event) => {
            event.stopPropagation();
            this.emit('start-connect', { nodeId: node.id, portId: output.id });
          }}"
          title="Click to wire this output to one or multiple parallel nodes"
          class="-mr-4 w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-transform hover:scale-125 ${isConnectionSource
            ? 'bg-indigo-600 border-indigo-200 scale-125'
            : node.type === 'condition'
            ? 'bg-amber-500 border-white'
            : 'bg-indigo-600 border-white'}"
        >
          <span class="text-white">${renderIcon('arrowRight', 'w-2.5 h-2.5')}</span>
        </button>
      </div>
    `;
  }

  handleNodeClick(event, node) {
    event.stopPropagation();
    if (this.connectionSource) {
      this.emit('complete-connect', { targetNodeId: node.id });
      return;
    }
    this.emit('select-node', { nodeId: node.id });
  }

  handleCanvasTouchMove(event) {
    if (!this.draggingNodeId || !event.touches[0]) return;
    event.preventDefault();
    this.moveNodeDrag(event.touches[0].clientX, event.touches[0].clientY);
  }

  getCanvasElement() {
    return this.querySelector('.kx-canvas-scroll');
  }

  startNodeDrag(clientX, clientY, node, eventTarget) {
    if (eventTarget.closest('button') || eventTarget.closest('input') || eventTarget.closest('select')) return;
    this.emit('select-node', { nodeId: node.id });
    const canvas = this.getCanvasElement();
    if (!canvas) return;
    const canvasBounds = canvas.getBoundingClientRect();
    this.draggingNodeId = node.id;
    this.dragOffset = {
      x: clientX - canvasBounds.left + canvas.scrollLeft - node.x,
      y: clientY - canvasBounds.top + canvas.scrollTop - node.y
    };
  }

  moveNodeDrag(clientX, clientY) {
    if (!this.draggingNodeId) return;
    const canvas = this.getCanvasElement();
    if (!canvas) return;
    const canvasBounds = canvas.getBoundingClientRect();
    const nextX = Math.max(MIN_NODE_POSITION_PX, Math.round(clientX - canvasBounds.left + canvas.scrollLeft - this.dragOffset.x));
    const nextY = Math.max(MIN_NODE_POSITION_PX, Math.round(clientY - canvasBounds.top + canvas.scrollTop - this.dragOffset.y));
    this.emit('move-node', { nodeId: this.draggingNodeId, x: nextX, y: nextY });
  }

  endNodeDrag() {
    this.draggingNodeId = null;
  }
}
customElements.define('kinetix-node-graph', KinetixNodeGraph);

function buildWirePath(start, end) {
  const curvePx = Math.max(MIN_WIRE_CURVE_PX, Math.abs(end.x - start.x) * WIRE_CURVE_RATIO);
  return `M ${start.x} ${start.y} C ${start.x + curvePx} ${start.y}, ${end.x - curvePx} ${end.y}, ${end.x} ${end.y}`;
}

function getNodeHeaderClasses(nodeType) {
  if (nodeType === 'trigger') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  if (nodeType === 'condition') return 'bg-amber-50 text-amber-800 border-amber-200';
  return 'bg-emerald-50 text-emerald-800 border-emerald-200';
}
