// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { html } from 'lit';
import { KinetixLightDomElement } from './kinetix-light-dom-element.js';
import { generateProductionCSS } from '../css/production-css.js';
import { PRESET_TEMPLATES } from '../data/animation-presets.js';
import { DEFAULT_MOCK_CSS, DEFAULT_MOCK_ITEMS } from '../data/mock-page.js';
import { computeExecutionSchedule } from '../graph/execution-schedule.js';
import { getOutputTargetIds, pickInitialSelectedNode, toggleOutputTarget } from '../graph/graph-connections.js';
import { cloneData, createAnimationNode, createMidpointKeyframe, createTimestampSuffix, createWidthRouterNode } from '../graph/node-factory.js';
import { buildHtmlFromMockItems } from '../mock/mock-markup.js';
import { renderIcon } from '../ui/icons.js';
import { copyTextWithHiddenTextarea, downloadTextFile } from '../utils/browser-actions.js';

const NODE_ID_SUFFIX_DIGITS = 4;
const MIDPOINT_OFFSET_PERCENT = 50;
const LATE_MIDPOINT_OFFSET_PERCENT = 75;
const INITIAL_PRESET_ID = 'responsiveHero';
const INITIAL_SELECTED_NODE_ID = 'cond-width-router';
const INITIAL_SIMULATED_WIDTH_PX = 1120;
const INITIAL_PLAYBACK_DELAY_MS = 80;
const PRESET_PLAYBACK_DELAY_MS = 50;
const MIN_PLAYBACK_DURATION_MS = 800;
const PLAYBACK_SETTLE_MS = 150;
const TOAST_DURATION_MS = 2800;

const MOBILE_WORKSPACE_TABS = [
  { id: 'all', label: 'Stacked View' },
  { id: 'stage', label: 'Resizable Mock Screen' },
  { id: 'graph', label: 'Node Graph' },
  { id: 'inspector', label: 'Inspector' },
  { id: 'timeline', label: 'Timeline & CSS' }
];

class KinetixStudio extends KinetixLightDomElement {
  static properties = {
    activePresetId: { type: String },
    nodes: { type: Array },
    selectedNodeId: { type: String },
    simulatedWidth: { type: Number },
    prefersReducedMotion: { type: Boolean },
    playbackCount: { type: Number },
    isPlaying: { type: Boolean },
    currentTimeMs: { type: Number },
    connectionSource: { type: Object },
    isExportModalOpen: { type: Boolean },
    toastMessage: { type: String },
    activeBottomTab: { type: String },
    mobileWorkspaceView: { type: String },
    mockItems: { type: Array },
    mockHtml: { type: String },
    mockCss: { type: String }
  };

  constructor() {
    super();
    this.activePresetId = INITIAL_PRESET_ID;
    this.nodes = cloneData(PRESET_TEMPLATES[INITIAL_PRESET_ID].nodes);
    this.selectedNodeId = INITIAL_SELECTED_NODE_ID;
    this.simulatedWidth = INITIAL_SIMULATED_WIDTH_PX;
    this.prefersReducedMotion = false;
    this.playbackCount = 1;
    this.isPlaying = false;
    this.currentTimeMs = 0;
    this.connectionSource = null;
    this.isExportModalOpen = false;
    this.toastMessage = null;
    this.activeBottomTab = 'timeline';
    this.mobileWorkspaceView = 'all';
    this.mockItems = cloneData(DEFAULT_MOCK_ITEMS);
    this.mockHtml = buildHtmlFromMockItems(this.mockItems);
    this.mockCss = DEFAULT_MOCK_CSS;
    this._animationFrameId = null;
  }

  connectedCallback() {
    super.connectedCallback();
    setTimeout(() => this.triggerPlayback(), INITIAL_PLAYBACK_DELAY_MS);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._animationFrameId) cancelAnimationFrame(this._animationFrameId);
  }

  render() {
    const primarySchedule = this.getPrimarySchedule();
    const selectedNode = this.nodes.find((node) => node.id === this.selectedNodeId) || this.nodes[0];
    const generatedCSS = generateProductionCSS(this.nodes);
    const workspace = { primarySchedule, selectedNode, generatedCSS };

    return html`
      <div
        class="min-h-screen lg:h-screen flex flex-col bg-slate-50 text-slate-800 lg:overflow-hidden"
        @select-preset="${(event) => this.handleSelectPreset(event.detail.presetId)}"
        @change-simulated-width="${(event) => this.handleChangeSimulatedWidth(event.detail.width)}"
        @toggle-reduced-motion="${() => this.toggleReducedMotion()}"
        @trigger-playback="${() => this.triggerPlayback()}"
        @stage-trigger="${() => this.triggerPlayback()}"
        @copy-css="${() => this.copyToClipboard(generatedCSS, 'Production CSS')}"
        @open-export-modal="${() => { this.isExportModalOpen = true; }}"
        @close-export-modal="${() => { this.isExportModalOpen = false; }}"
        @download-css="${() => this.downloadCSSFile(generatedCSS)}"
        @select-node="${(event) => { this.selectedNodeId = event.detail.nodeId; }}"
        @move-node="${(event) => this.handleMoveNode(event.detail.nodeId, event.detail.x, event.detail.y)}"
        @start-connect="${(event) => {
          this.connectionSource = { nodeId: event.detail.nodeId, portId: event.detail.portId };
        }}"
        @complete-connect="${(event) => this.handleCompleteConnect(event.detail.targetNodeId)}"
        @cancel-connect="${() => { this.connectionSource = null; }}"
        @add-node="${(event) => this.handleAddNode(event.detail.nodeType)}"
        @delete-node="${(event) => this.handleDeleteNode(event.detail.nodeId)}"
        @update-selected-node="${(event) => this.handleUpdateSelectedNode(event.detail.patch, event.detail.replay)}"
        @add-keyframe-stop="${() => this.handleAddKeyframeStop()}"
        @change-bottom-tab="${(event) => { this.activeBottomTab = event.detail.tab; }}"
        @add-mock-item="${(event) => this.handleAddMockItem(event.detail.item)}"
        @update-mock-item="${(event) => this.handleUpdateMockItem(event.detail.uid, event.detail.patch)}"
        @delete-mock-item="${(event) => this.handleDeleteMockItem(event.detail.uid)}"
        @update-mock-html="${(event) => { this.mockHtml = event.detail.html; }}"
        @update-mock-css="${(event) => { this.mockCss = event.detail.css; }}"
        @sync-html-from-slots="${() => { this.mockHtml = buildHtmlFromMockItems(this.mockItems); }}"
      >
        <kinetix-header
          .activePresetId="${this.activePresetId}"
          .simulatedWidth="${this.simulatedWidth}"
          ?prefersReducedMotion="${this.prefersReducedMotion}"
        ></kinetix-header>

        ${this.renderMobileWorkspaceTabs()}

        ${this.renderToast()}

        <div class="flex-1 flex flex-col lg:flex-row min-h-0 lg:overflow-hidden">
          <div class="flex-1 flex flex-col min-w-0 lg:overflow-hidden">
            <div class="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
              ${this.renderGraphPanel(workspace)}

              ${this.renderStagePanel(workspace)}
            </div>

            ${this.renderTimelinePanel(workspace)}
          </div>

          ${this.renderInspectorPanel(workspace)}
        </div>

        <kinetix-export-modal
          ?isOpen="${this.isExportModalOpen}"
          .generatedCSS="${generatedCSS}"
          .mockHtml="${this.mockHtml}"
        ></kinetix-export-modal>
      </div>
    `;
  }

  renderMobileWorkspaceTabs() {
    return html`
      <div class="lg:hidden bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto">
        ${MOBILE_WORKSPACE_TABS.map((tab) => html`
          <button
            type="button"
            @click="${() => { this.mobileWorkspaceView = tab.id; }}"
            class="px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${this.mobileWorkspaceView === tab.id
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
          >
            ${tab.label}
          </button>
        `)}
      </div>
    `;
  }

  renderToast() {
    if (!this.toastMessage) return '';

    return html`
      <div class="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 text-xs font-medium animate-bounce">
        <span class="text-emerald-400">${renderIcon('checkCircle', 'w-4 h-4')}</span>
        <span>${this.toastMessage}</span>
      </div>
    `;
  }

  renderGraphPanel({ primarySchedule }) {
    return html`
      <div class="${this.isVisibleOnMobile('graph') ? 'block' : 'hidden'} lg:block lg:col-span-6 flex flex-col min-w-0 min-h-[360px] lg:min-h-0 border-b lg:border-b-0 lg:border-r border-slate-200 overflow-hidden">
        <kinetix-node-graph
          class="h-full"
          .nodes="${this.nodes}"
          .selectedNodeId="${this.selectedNodeId}"
          .connectionSource="${this.connectionSource}"
          .primarySchedule="${primarySchedule}"
          .simulatedWidth="${this.simulatedWidth}"
          ?isPlaying="${this.isPlaying}"
          .currentTimeMs="${this.currentTimeMs}"
        ></kinetix-node-graph>
      </div>
    `;
  }

  renderStagePanel({ primarySchedule }) {
    return html`
      <div class="${this.isVisibleOnMobile('stage') ? 'flex' : 'hidden'} lg:flex lg:col-span-6 flex-col min-h-[380px] lg:min-h-0 bg-white overflow-hidden">
        <kinetix-viewport-stage
          class="h-full"
          .widthPx="${this.simulatedWidth}"
          .schedule="${primarySchedule}"
          .playbackCount="${this.playbackCount}"
          ?isPlaying="${this.isPlaying}"
          .currentTimeMs="${this.currentTimeMs}"
          .mockItems="${this.mockItems}"
          .mockHtml="${this.mockHtml}"
          .mockCss="${this.mockCss}"
        ></kinetix-viewport-stage>
      </div>
    `;
  }

  renderTimelinePanel({ primarySchedule, generatedCSS }) {
    return html`
      <div class="${this.isVisibleOnMobile('timeline') ? 'block' : 'hidden'} lg:block shrink-0">
        <kinetix-timeline-drawer
          .activeBottomTab="${this.activeBottomTab}"
          .currentTimeMs="${this.currentTimeMs}"
          .primarySchedule="${primarySchedule}"
          .simulatedWidth="${this.simulatedWidth}"
          .selectedNodeId="${this.selectedNodeId}"
          .generatedCSS="${generatedCSS}"
        ></kinetix-timeline-drawer>
      </div>
    `;
  }

  renderInspectorPanel({ selectedNode }) {
    return html`
      <aside class="${this.isVisibleOnMobile('inspector') ? 'block' : 'hidden'} lg:block w-full lg:w-72 xl:w-80 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 shrink-0 lg:overflow-y-auto">
        <kinetix-inspector
          .nodes="${this.nodes}"
          .selectedNode="${selectedNode}"
          .mockItems="${this.mockItems}"
        ></kinetix-inspector>
      </aside>
    `;
  }

  isVisibleOnMobile(panelId) {
    return this.mobileWorkspaceView === 'all' || this.mobileWorkspaceView === panelId;
  }

  getPrimarySchedule() {
    return computeExecutionSchedule(this.nodes, {
      viewportWidth: this.simulatedWidth,
      prefersReducedMotion: this.prefersReducedMotion
    });
  }

  triggerPlayback() {
    if (this._animationFrameId) cancelAnimationFrame(this._animationFrameId);
    this.playbackCount += 1;
    this.currentTimeMs = 0;
    this.isPlaying = true;

    const playbackDurationMs = Math.max(this.getPrimarySchedule().totalDurationMs, MIN_PLAYBACK_DURATION_MS);
    const playbackStartMs = performance.now();

    const advancePlayhead = (frameTimeMs) => {
      const elapsedMs = frameTimeMs - playbackStartMs;
      if (elapsedMs >= playbackDurationMs + PLAYBACK_SETTLE_MS) {
        this.currentTimeMs = playbackDurationMs;
        this.isPlaying = false;
        return;
      }
      this.currentTimeMs = Math.round(elapsedMs);
      this._animationFrameId = requestAnimationFrame(advancePlayhead);
    };

    this._animationFrameId = requestAnimationFrame(advancePlayhead);
  }

  handleChangeSimulatedWidth(widthPx) {
    const previousRangeLabel = this.getPrimarySchedule().matchedRangeLabel;
    this.simulatedWidth = widthPx;
    const nextRangeLabel = this.getPrimarySchedule().matchedRangeLabel;
    if (previousRangeLabel !== nextRangeLabel) {
      this.triggerPlayback();
    }
  }

  toggleReducedMotion() {
    this.prefersReducedMotion = !this.prefersReducedMotion;
    this.triggerPlayback();
  }

  handleSelectPreset(presetId) {
    const preset = PRESET_TEMPLATES[presetId];
    if (!preset) return;
    this.activePresetId = presetId;
    this.nodes = cloneData(preset.nodes);
    this.selectedNodeId = pickInitialSelectedNode(this.nodes).id;
    setTimeout(() => this.triggerPlayback(), PRESET_PLAYBACK_DELAY_MS);
  }

  handleMoveNode(nodeId, x, y) {
    this.nodes = this.nodes.map((node) => (node.id === nodeId ? { ...node, x, y } : node));
  }

  handleCompleteConnect(targetNodeId) {
    if (!this.connectionSource || this.connectionSource.nodeId === targetNodeId) {
      this.connectionSource = null;
      return;
    }
    const { nodeId, portId } = this.connectionSource;
    this.nodes = this.nodes.map((node) => {
      if (node.id !== nodeId) return node;
      return {
        ...node,
        outputs: (node.outputs || []).map((output) =>
          output.id === portId ? toggleOutputTarget(output, targetNodeId) : output
        )
      };
    });
    this.triggerPlayback();
  }

  handleAddNode(nodeType) {
    const newNodeId = `${nodeType}-${createTimestampSuffix(NODE_ID_SUFFIX_DIGITS)}`;
    const newNode = nodeType === 'animation' ? createAnimationNode(newNodeId) : createWidthRouterNode(newNodeId);
    this.nodes = [...this.nodes, newNode];
    this.selectedNodeId = newNodeId;
  }

  handleDeleteNode(nodeId) {
    const nodeToDelete = this.nodes.find((node) => node.id === nodeId);
    if (!nodeToDelete || nodeToDelete.type === 'trigger') return;
    this.nodes = this.nodes
      .filter((node) => node.id !== nodeId)
      .map((node) => ({
        ...node,
        outputs: (node.outputs || []).map((output) => ({
          ...output,
          targetIds: getOutputTargetIds(output).filter((id) => id !== nodeId),
          targetId: undefined
        }))
      }));
    this.selectedNodeId = this.nodes[0]?.id || '';
    this.triggerPlayback();
  }

  handleUpdateSelectedNode(patch, shouldReplay = false) {
    this.nodes = this.nodes.map((node) => (node.id === this.selectedNodeId ? { ...node, ...patch } : node));
    if (shouldReplay) this.triggerPlayback();
  }

  handleAddKeyframeStop() {
    const selectedNode = this.nodes.find((node) => node.id === this.selectedNodeId);
    if (!selectedNode || selectedNode.type !== 'animation') return;
    const hasMidpoint = selectedNode.keyframes.some((keyframe) => keyframe.offset === MIDPOINT_OFFSET_PERCENT);
    const newOffsetPercent = hasMidpoint ? LATE_MIDPOINT_OFFSET_PERCENT : MIDPOINT_OFFSET_PERCENT;
    const nextKeyframes = [...selectedNode.keyframes, createMidpointKeyframe(newOffsetPercent)].sort(
      (first, second) => first.offset - second.offset
    );
    this.handleUpdateSelectedNode({ keyframes: nextKeyframes }, true);
  }

  handleAddMockItem(item) {
    this.mockItems = [...this.mockItems, item];
    this.mockHtml = buildHtmlFromMockItems(this.mockItems);
    this.triggerPlayback();
  }

  handleUpdateMockItem(uid, patch) {
    this.mockItems = this.mockItems.map((item) => (item.uid === uid ? { ...item, ...patch } : item));
    this.mockHtml = buildHtmlFromMockItems(this.mockItems);
  }

  handleDeleteMockItem(uid) {
    this.mockItems = this.mockItems.filter((item) => item.uid !== uid);
    this.mockHtml = buildHtmlFromMockItems(this.mockItems);
  }

  copyToClipboard(text, label = 'Production CSS') {
    try {
      copyTextWithHiddenTextarea(text);
      this.showToast(`Copied ${label} to clipboard!`);
    } catch {
      this.showToast('Ready to copy in Export Modal');
    }
  }

  showToast(message) {
    this.toastMessage = message;
    setTimeout(() => {
      this.toastMessage = null;
    }, TOAST_DURATION_MS);
  }

  downloadCSSFile(cssText) {
    downloadTextFile({ text: cssText, fileName: `kinetix-${this.activePresetId}.css`, mimeType: 'text/css' });
  }
}
customElements.define('kinetix-studio', KinetixStudio);
