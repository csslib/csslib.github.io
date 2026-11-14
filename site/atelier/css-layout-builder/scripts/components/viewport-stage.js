// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { html, nothing } from 'lit';
import { compileLayout } from '../compiler/layout-compiler.js';
import { OpenShadowElement } from './open-shadow-element.js';
import { DEFAULT_VIEWPORT_WIDTH_PX } from '../config/constants.js';
import { isConcreteLeaf, isPinnedChrome } from '../tree/layout-tree.js';
import { clampViewportWidth } from '../utils/text-helpers.js';

const DEVICE_WIDTH_PRESETS = [
  { widthPx: 375, icon: 'ph-device-mobile', label: 'Mobile' },
  { widthPx: 768, icon: 'ph-device-tablet-speaker', label: 'Tablet' },
  { widthPx: 1080, icon: 'ph-desktop', label: 'Desktop' }
];

const LIVE_PREVIEW_SCOPE_SELECTOR = '.if-live-scope';
const RESIZE_HANDLE_WIDTH_PX = 14;
const FULL_SCALE = 1;
const PERCENT_PER_UNIT = 100;
const WIDTH_SLIDER_MIN_PX = 320;
const WIDTH_SLIDER_MAX_PX = 1280;
const DEVICE_PRESET_MATCH_TOLERANCE_PX = 40;
const BOTH_SIDES_GROW_FACTOR = 2;
const RESIZE_DIRECTION_BY_SIDE = { left: -1, right: 1 };
const SWEEP_STEP_PX = 4;
const SWEEP_MIN_WIDTH_PX = 340;
const SWEEP_MAX_WIDTH_PX = 1200;
const SWEEP_DIRECTION = { shrinking: -1, growing: 1 };

class ViewportStage extends OpenShadowElement {
  static properties = {
    tree: { type: Object },
    selectedNodeId: { type: String },
    viewportWidth: { type: Number },
    areGuidesVisible: { type: Boolean },
    isSweeping: { type: Boolean },
    isDragging: { type: Boolean },
    canvasSize: { state: true }
  };

  #sweepFrameRequestId = null;
  #sweepDirection = SWEEP_DIRECTION.shrinking;
  #canvasResizeObserver = null;

  constructor() {
    super();
    this.viewportWidth = DEFAULT_VIEWPORT_WIDTH_PX;
    this.areGuidesVisible = false;
    this.isSweeping = false;
    this.isDragging = false;
    this.canvasSize = null;
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    this.observeCanvasSize();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#canvasResizeObserver?.disconnect();
    this.#canvasResizeObserver = null;
  }

  render() {
    if (!this.tree) return nothing;
    const compiled = compileLayout(this.tree, LIVE_PREVIEW_SCOPE_SELECTOR);
    const scale = this.computeFitScale();
    const widestActualSizeWidth = this.computeWidestActualSizeWidth();
    const scaleSummary = {
      isScaledDown: scale < FULL_SCALE,
      scalePercent: Math.round(scale * PERCENT_PER_UNIT),
      widestActualSizeWidth,
      isAtWidestActualSize: widestActualSizeWidth === this.viewportWidth
    };

    return html`
      <main class="flex-1 flex flex-col h-full stage-dot-bg overflow-hidden min-w-0">
        <div class="h-11 bg-white border-b border-slate-200 px-3 flex items-center justify-between gap-2 shrink-0">
          ${this.renderDevicePresetButtons()}
          ${this.renderWidthControls(scaleSummary)}
          ${this.renderToolbarToggles(scaleSummary)}
        </div>

        ${this.renderCanvas(compiled.css, this.computeFrameStyles(scale))}
      </main>
    `;
  }

  observeCanvasSize() {
    if (this.#canvasResizeObserver) return;
    const canvas = this.shadowRoot?.querySelector('.stage-canvas');
    if (!canvas) return;
    this.#canvasResizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      this.canvasSize = {
        width: Math.max(0, width - 2 * RESIZE_HANDLE_WIDTH_PX),
        height: Math.max(0, height)
      };
    });
    this.#canvasResizeObserver.observe(canvas);
  }

  computeFitScale() {
    if (!this.canvasSize || this.canvasSize.width === 0) return FULL_SCALE;
    return Math.min(FULL_SCALE, this.canvasSize.width / this.viewportWidth);
  }

  computeWidestActualSizeWidth() {
    if (!this.canvasSize) return null;
    return clampViewportWidth(Math.floor(this.canvasSize.width));
  }

  computeFrameStyles(scale) {
    if (!this.canvasSize) {
      const unscaledStyle = `width: ${this.viewportWidth}px; height: 100%;`;
      return { frameBoxStyle: unscaledStyle, frameStyle: unscaledStyle };
    }
    const canvasHeight = this.canvasSize.height ?? 0;
    return {
      frameBoxStyle: `width: ${this.viewportWidth * scale}px; height: ${canvasHeight}px;`,
      frameStyle: `width: ${this.viewportWidth}px; height: ${canvasHeight / scale}px; transform: scale(${scale}); transform-origin: top left;`
    };
  }

  fitToActualSize() {
    const width = this.computeWidestActualSizeWidth();
    if (width === null) return;
    this.stopSweep();
    this.requestViewportWidth(width);
  }

  jumpToWidth(width) {
    this.stopSweep();
    this.requestViewportWidth(width);
  }

  startResize(side, pointerDownEvent) {
    pointerDownEvent.preventDefault();
    this.stopSweep();
    this.isDragging = true;
    const startX = pointerDownEvent.clientX;
    const startWidth = this.viewportWidth;
    const direction = RESIZE_DIRECTION_BY_SIDE[side];
    const screenToViewportRatio = BOTH_SIDES_GROW_FACTOR / this.computeFitScale();

    const resizeToPointer = (moveEvent) => {
      const viewportDeltaPx = (moveEvent.clientX - startX) * direction * screenToViewportRatio;
      this.requestViewportWidth(clampViewportWidth(startWidth + viewportDeltaPx));
    };

    const finishResize = () => {
      this.isDragging = false;
      window.removeEventListener('pointermove', resizeToPointer);
      window.removeEventListener('pointerup', finishResize);
    };

    window.addEventListener('pointermove', resizeToPointer);
    window.addEventListener('pointerup', finishResize);
  }

  requestViewportWidth(width) {
    this.viewportWidth = width;
    this.emitComposedEvent('viewport-width-change', { width });
  }

  toggleSweep() {
    if (this.isSweeping) {
      this.stopSweep();
      return;
    }
    this.isSweeping = true;
    this.#sweepFrameRequestId = requestAnimationFrame(() => this.advanceSweep());
  }

  advanceSweep() {
    if (!this.isSweeping) return;
    this.requestViewportWidth(this.computeNextSweepWidth());
    this.#sweepFrameRequestId = requestAnimationFrame(() => this.advanceSweep());
  }

  computeNextSweepWidth() {
    const nextWidth = this.viewportWidth + this.#sweepDirection * SWEEP_STEP_PX;
    if (nextWidth <= SWEEP_MIN_WIDTH_PX) {
      this.#sweepDirection = SWEEP_DIRECTION.growing;
      return SWEEP_MIN_WIDTH_PX;
    }
    if (nextWidth >= SWEEP_MAX_WIDTH_PX) {
      this.#sweepDirection = SWEEP_DIRECTION.shrinking;
      return SWEEP_MAX_WIDTH_PX;
    }
    return nextWidth;
  }

  stopSweep() {
    this.isSweeping = false;
    if (!this.#sweepFrameRequestId) return;
    cancelAnimationFrame(this.#sweepFrameRequestId);
    this.#sweepFrameRequestId = null;
  }

  requestSelect(nodeId, event) {
    event.stopPropagation();
    this.emitComposedEvent('select-node', { id: nodeId });
  }

  renderDevicePresetButtons() {
    return html`
          <div class="flex items-center gap-1">
            ${DEVICE_WIDTH_PRESETS.map(device => html`
              <button
                title=${`${device.label} (${device.widthPx}px)`}
                @click=${() => this.jumpToWidth(device.widthPx)}
                class="px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
                  Math.abs(this.viewportWidth - device.widthPx) < DEVICE_PRESET_MATCH_TOLERANCE_PX
                    ? 'bg-indigo-50 text-indigo-700 font-semibold ring-1 ring-indigo-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }"
              >
                <i class="ph ${device.icon}"></i>
                <span class="hidden 2xl:inline">${device.label}</span>
              </button>
            `)}
          </div>
    `;
  }

  renderWidthControls({ isScaledDown, scalePercent }) {
    return html`
          <div class="flex items-center gap-2 flex-1 min-w-[10rem] max-w-xs">
            <input
              type="range"
              min=${WIDTH_SLIDER_MIN_PX}
              max=${WIDTH_SLIDER_MAX_PX}
              .value=${String(this.viewportWidth)}
              @input=${(event) => this.jumpToWidth(Number(event.target.value))}
              class="w-full"
            />
            <span class="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shrink-0">
              ${this.viewportWidth}px
            </span>
            <span
              class="font-mono text-xs font-semibold px-2 py-0.5 rounded border shrink-0 ${
                isScaledDown
                  ? 'text-amber-700 bg-amber-50 border-amber-200'
                  : 'text-slate-500 bg-slate-50 border-slate-200'
              }"
              title=${isScaledDown ? `Preview scaled to ${scalePercent}% to fit the available space` : 'Preview shown at actual size'}
            >
              ${scalePercent}%
            </span>
          </div>
    `;
  }

  renderToolbarToggles({ widestActualSizeWidth, isAtWidestActualSize }) {
    return html`
          <div class="flex items-center gap-1.5">
            <button
              @click=${() => this.toggleSweep()}
              class="px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition border ${
                this.isSweeping
                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }"
              title="Auto-resize width to preview responsive behavior"
            >
              <i class="ph ${this.isSweeping ? 'ph-pause' : 'ph-play'}"></i>
              <span class="hidden 2xl:inline">${this.isSweeping ? 'Pause' : 'Test Resize'}</span>
            </button>

            <button
              @click=${() => { this.areGuidesVisible = !this.areGuidesVisible; }}
              class="px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition border ${
                this.areGuidesVisible
                  ? 'bg-sky-50 text-sky-700 border-sky-300'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
              }"
              title="Show dashed outlines around all containers"
            >
              <i class="ph ph-bounding-box"></i>
              <span class="hidden 2xl:inline">Guides</span>
            </button>

            <button
              @click=${() => this.fitToActualSize()}
              class="px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition border ${
                isAtWidestActualSize
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
              }"
              title=${widestActualSizeWidth === null
                ? 'Fit preview at 100% scale'
                : `Fit preview at 100% scale (${widestActualSizeWidth}px)`}
            >
              <i class="ph ph-arrows-out-line-horizontal"></i>
              <span class="hidden 2xl:inline">Fit 100%</span>
            </button>
          </div>
    `;
  }

  renderCanvas(compiledCss, { frameBoxStyle, frameStyle }) {
    return html`
        <div class="stage-canvas flex-1 min-h-0 overflow-hidden p-3 sm:p-5 flex justify-center items-start">
          <div class="flex items-stretch h-full max-h-full">
            ${this.renderResizeHandle('left')}

            <div class="relative shrink-0" style=${frameBoxStyle}>
            <div
              style=${frameStyle}
              class="absolute top-0 left-0 bg-white rounded-xl border border-slate-200/90 shadow-lg flex flex-col h-full overflow-hidden transition-[border-color] ${
                this.isDragging ? 'border-indigo-500 ring-2 ring-indigo-500/20' : ''
              }"
            >
              <div class="h-7 bg-slate-50 border-b border-slate-200 px-3 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
                <div class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-slate-300"></span>
                  <span class="w-2 h-2 rounded-full bg-slate-300"></span>
                  <span class="w-2 h-2 rounded-full bg-slate-300"></span>
                </div>
                <span class="font-mono text-[10px] text-slate-400">
                  Click any element to customize · Scroll to test sticky chrome
                </span>
                <span class="font-mono text-[10px] text-emerald-600 font-medium">0 @media</span>
              </div>

              <style data-stage-compiled-css>${compiledCss}</style>

              <div class="if-live-scope ${this.areGuidesVisible ? 'if-guides-active' : ''} flex-1 overflow-y-auto overflow-x-hidden relative bg-slate-50/50">
                ${this.renderLiveNode(this.tree)}
              </div>
            </div>
            </div>

            ${this.renderResizeHandle('right')}
          </div>
        </div>
    `;
  }

  renderResizeHandle(side) {
    return html`
            <div
              @pointerdown=${(event) => this.startResize(side, event)}
              class="resizer-bar ${this.isDragging ? 'dragging' : ''} w-3.5 flex items-center justify-center cursor-ew-resize select-none shrink-0"
              title="Drag to resize width"
            >
              <div class="resizer-pill w-1 h-10 rounded-full bg-slate-300 transition-all"></div>
            </div>
    `;
  }

  renderLiveNode(node) {
    const isLeaf = isConcreteLeaf(node.tag);
    const isSelected = this.selectedNodeId === node.id;
    const preview = {
      hudBadge: this.renderNodeHud(node, isLeaf),
      previewClasses: `if-preview-node ${isSelected ? 'if-selected' : ''}`,
      nodeKind: isLeaf ? 'leaf' : 'structure',
      selectThisNode: (event) => this.requestSelect(node.id, event)
    };

    if (isLeaf) return this.renderLeafPreview(node, preview);
    const childPreviews = (node.children || []).map(child => this.renderLiveNode(child));
    return this.renderStructurePreview(node, preview, childPreviews);
  }

  renderNodeHud(node, isLeaf) {
    return html`
      <span class="if-node-hud ${
        isLeaf
          ? 'bg-emerald-600 text-white'
          : 'bg-indigo-600 text-white'
      }">
        <span>&lt;${node.tag}&gt; ${node.name}</span>
        ${isPinnedChrome(node.chrome) ? html`<span>· 📌 ${node.chrome.mode}</span>` : nothing}
      </span>
    `;
  }

  renderLeafPreview(node, { hudBadge, previewClasses, nodeKind, selectThisNode }) {
    switch (node.tag) {
      case 'h1':
        return html`<h1 data-node-id=${node.id} data-node-kind=${nodeKind} class=${previewClasses} @click=${selectThisNode}>${hudBadge}${node.text}</h1>`;
      case 'h2':
        return html`<h2 data-node-id=${node.id} data-node-kind=${nodeKind} class=${previewClasses} @click=${selectThisNode}>${hudBadge}${node.text}</h2>`;
      case 'h3':
        return html`<h3 data-node-id=${node.id} data-node-kind=${nodeKind} class=${previewClasses} @click=${selectThisNode}>${hudBadge}${node.text}</h3>`;
      case 'a':
        return html`<a href="javascript:void(0)" data-node-id=${node.id} data-node-kind=${nodeKind} class=${previewClasses} @click=${selectThisNode}>${hudBadge}${node.text}</a>`;
      case 'button':
        return html`<button type="button" data-node-id=${node.id} data-node-kind=${nodeKind} class=${previewClasses} @click=${selectThisNode}>${hudBadge}${node.text}</button>`;
      case 'li':
        return html`<li data-node-id=${node.id} data-node-kind=${nodeKind} class=${previewClasses} @click=${selectThisNode}>${hudBadge}${node.text}</li>`;
      case 'span':
        return html`<span data-node-id=${node.id} data-node-kind=${nodeKind} class=${previewClasses} @click=${selectThisNode}>${hudBadge}${node.text}</span>`;
      case 'p':
      default:
        return html`<p data-node-id=${node.id} data-node-kind=${nodeKind} class=${previewClasses} @click=${selectThisNode}>${hudBadge}${node.text}</p>`;
    }
  }

  renderStructurePreview(node, { hudBadge, previewClasses, nodeKind, selectThisNode }, childPreviews) {
    switch (node.tag) {
      case 'header':
        return html`<header data-node-id=${node.id} data-node-kind=${nodeKind} class=${previewClasses} @click=${selectThisNode}>${hudBadge}${childPreviews}</header>`;
      case 'nav':
        return html`<nav data-node-id=${node.id} data-node-kind=${nodeKind} class=${previewClasses} @click=${selectThisNode}>${hudBadge}${childPreviews}</nav>`;
      case 'main':
        return html`<main data-node-id=${node.id} data-node-kind=${nodeKind} class=${previewClasses} @click=${selectThisNode}>${hudBadge}${childPreviews}</main>`;
      case 'section':
        return html`<section data-node-id=${node.id} data-node-kind=${nodeKind} class=${previewClasses} @click=${selectThisNode}>${hudBadge}${childPreviews}</section>`;
      case 'article':
        return html`<article data-node-id=${node.id} data-node-kind=${nodeKind} class=${previewClasses} @click=${selectThisNode}>${hudBadge}${childPreviews}</article>`;
      case 'aside':
        return html`<aside data-node-id=${node.id} data-node-kind=${nodeKind} class=${previewClasses} @click=${selectThisNode}>${hudBadge}${childPreviews}</aside>`;
      case 'ul':
        return html`<ul data-node-id=${node.id} data-node-kind=${nodeKind} class=${previewClasses} @click=${selectThisNode}>${hudBadge}${childPreviews}</ul>`;
      case 'footer':
        return html`<footer data-node-id=${node.id} data-node-kind=${nodeKind} class=${previewClasses} @click=${selectThisNode}>${hudBadge}${childPreviews}</footer>`;
      case 'div':
      default:
        return html`<div data-node-id=${node.id} data-node-kind=${nodeKind} class=${previewClasses} @click=${selectThisNode}>${hudBadge}${childPreviews}</div>`;
    }
  }
}
customElements.define('viewport-stage', ViewportStage);
