// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { html, svg, nothing } from 'lit';
import { ColorMath } from '../color/color-math.js';
import { GradientFieldCompiler } from '../compiler/gradient-field-compiler.js';
import { WindowPointerDragElement } from './window-pointer-drag-element.js';
import { DEFAULT_BOUNDARY_SHAPE, DEFAULT_GRAIN_OPACITY, OVERLAY_REACH_RATIO, PANEL_HEADER_CLASS, PERCENT } from '../config/constants.js';
import { layoutGrid, layoutRing, layoutScatter, layoutSpiral, layoutWave } from '../controls/arrange-layouts.js';
import { buildHarmonyColors, computeHarmonyOffset, createControl, createControlId, offsetDuplicateCoordinate } from '../controls/control-factory.js';
import { CONTROL_DEFAULTS, HARMONY } from '../data/field-options.js';
import { STUDIO_PRESETS } from '../data/studio-presets.js';
import { copyTextToClipboard, formatQuickCopyCss } from '../export/css-formatters.js';
import { renderShapeOutline } from '../stage/shape-outlines.js';
import { computeCanvasDragPatch, computeHandlePositions, toStagePercent } from '../stage/stage-interaction.js';
import { renderContrastRow } from '../ui/panel-parts.js';

const TOAST_DURATION_MS = 2400;

const STAGE_MODES = [
  { id: 'studio', label: 'Interactive Field Stage', icon: 'ph-bounding-box' },
  { id: 'ui-card', label: 'UI Glass Card', icon: 'ph-cards' },
  { id: 'contrast', label: 'WCAG Legibility', icon: 'ph-text-aa' }
];

const RANDOM_PLACEMENT = { minPercent: 22, rangePercent: 56 };
const STAGE_CLICK_LIMITS = { min: 2, max: 98 };
const STAGE_DRAG_LIMITS = { min: 1, max: 99 };
const MIN_VISIBLE_CORE_REACH = 1.5;

const OUTLINE_STROKE = {
  selectedColor: 'rgba(255, 255, 255, 0.94)',
  idleColor: 'rgba(255, 255, 255, 0.36)',
  selectedWidth: '0.45',
  idleWidth: '0.28'
};

const GRAIN_DEFAULTS = { frequency: 0.75, octaves: 3, blendMode: 'overlay' };
const CONTRAST_SAMPLE_LIMIT = 3;
const WHITE_RGB = { r: 1, g: 1, b: 1 };
const DARK_INK_RGB = { r: 0.06, g: 0.09, b: 0.16 };

const ARRANGEMENT_LAYOUTS = {
  ring: layoutRing,
  grid: layoutGrid,
  wave: layoutWave,
  spiral: layoutSpiral,
  scatter: layoutScatter
};

class GradientOrchestrator extends WindowPointerDragElement {
  static properties = {
    controls: { type: Array, state: true },
    selectedControlId: { type: String, state: true },
    globals: { type: Object, state: true },
    noise: { type: Object, state: true },
    canvasMode: { type: String, state: true },
    areGizmosVisible: { type: Boolean, state: true },
    areAllBoundariesVisible: { type: Boolean, state: true },
    isClickToAddEnabled: { type: Boolean, state: true },
    isComparingNaiveSrgb: { type: Boolean, state: true },
    isExportModalOpen: { type: Boolean, state: true },
    toastMessage: { type: String, state: true },
    activeCanvasDrag: { type: Object, state: true }
  };

  constructor() {
    super();
    const initialPreset = structuredClone(STUDIO_PRESETS[0]);
    this.controls = initialPreset.controls;
    this.selectedControlId = initialPreset.controls[0].id;
    this.globals = initialPreset.globals;
    this.noise = initialPreset.noise;
    this.canvasMode = 'studio';
    this.areGizmosVisible = true;
    this.areAllBoundariesVisible = true;
    this.isClickToAddEnabled = false;
    this.isComparingNaiveSrgb = false;
    this.isExportModalOpen = false;
    this.toastMessage = '';
    this.activeCanvasDrag = null;
  }

  get selectedControl() {
    return this.controls.find(control => control.id === this.selectedControlId) || this.controls[0];
  }

  _showToast(message) {
    this.toastMessage = message;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this.toastMessage = '';
    }, TOAST_DURATION_MS);
  }

  _applyControlPatch(id, patch) {
    this.controls = this.controls.map(control => control.id === id ? { ...control, ...patch } : control);
  }

  _addControlAt(x, y, boundaryShape = DEFAULT_BOUNDARY_SHAPE) {
    const newControl = createControl({ index: this.controls.length, x, y, boundaryShape });
    this.controls = [...this.controls, newControl];
    this.selectedControlId = newControl.id;
    this._showToast(`Added ${newControl.name} at (${newControl.x}%, ${newControl.y}%)`);
  }

  _handleControlSelect(event) {
    this.selectedControlId = event.detail.id;
  }

  _handleControlUpdate(event) {
    const { id, patch } = event.detail;
    this._applyControlPatch(id, patch);
  }

  _handleControlAdd(event) {
    const x = Math.round(RANDOM_PLACEMENT.minPercent + Math.random() * RANDOM_PLACEMENT.rangePercent);
    const y = Math.round(RANDOM_PLACEMENT.minPercent + Math.random() * RANDOM_PLACEMENT.rangePercent);
    this._addControlAt(x, y, event.detail?.boundaryShape || DEFAULT_BOUNDARY_SHAPE);
  }

  _handleControlDuplicate(event) {
    const original = this.controls.find(control => control.id === event.detail.id);
    if (!original) return;
    const duplicate = structuredClone(original);
    duplicate.id = createControlId();
    duplicate.name = original.name + ' Copy';
    duplicate.x = offsetDuplicateCoordinate(original.x ?? CONTROL_DEFAULTS.x);
    duplicate.y = offsetDuplicateCoordinate(original.y ?? CONTROL_DEFAULTS.y);
    this.controls = [...this.controls, duplicate];
    this.selectedControlId = duplicate.id;
  }

  _handleControlDelete(event) {
    if (this.controls.length <= 1) return;
    const remainingControls = this.controls.filter(control => control.id !== event.detail.id);
    this.controls = remainingControls;
    if (this.selectedControlId === event.detail.id) {
      this.selectedControlId = remainingControls[0].id;
    }
  }

  _handleControlReorder(event) {
    const { index, direction } = event.detail;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= this.controls.length) return;
    const reorderedControls = [...this.controls];
    const [movedControl] = reorderedControls.splice(index, 1);
    reorderedControls.splice(targetIndex, 0, movedControl);
    this.controls = reorderedControls;
  }

  _handleControlsArrange(event) {
    const pattern = event.detail.pattern;
    const count = this.controls.length;
    if (count === 0) return;

    const layout = ARRANGEMENT_LAYOUTS[pattern] || layoutScatter;
    this.controls = this.controls.map((control, index) => ({ ...control, ...layout(index, count, control) }));
    this._showToast(`Arranged ${count} controls into ${pattern.toUpperCase()} formation`);
  }

  _handleApplyHarmony(event) {
    const harmonyType = event.detail.harmonyType;
    const anchor = this.selectedControl || this.controls[0];
    if (!anchor) return;

    const anchorOklch = ColorMath.hexToOklch(anchor.color);
    const harmonyBase = {
      hue: anchorOklch.h,
      C: ColorMath.clamp(anchorOklch.C, HARMONY.minChroma, HARMONY.maxChroma),
      L: ColorMath.clamp(anchorOklch.L, HARMONY.minLightness, HARMONY.maxLightness)
    };
    this.controls = this.controls.map((control, index) => ({
      ...control,
      ...buildHarmonyColors(harmonyBase, computeHarmonyOffset(harmonyType, index))
    }));

    this._showToast(`Harmonized all ${this.controls.length} controls using ${harmonyType.toUpperCase()} OKLCH math`);
  }

  _handlePresetSelect(event) {
    const preset = STUDIO_PRESETS.find(candidate => candidate.id === event.detail.presetId);
    if (!preset) return;
    const presetCopy = structuredClone(preset);
    this.controls = presetCopy.controls;
    this.selectedControlId = presetCopy.controls[0].id;
    this.globals = presetCopy.globals;
    this.noise = presetCopy.noise;
    this._showToast(`Loaded "${presetCopy.name}" preset`);
  }

  _handleGlobalsUpdate(event) {
    this.globals = { ...this.globals, ...event.detail.patch };
  }

  _handleNoiseUpdate(event) {
    this.noise = { ...this.noise, ...event.detail.patch };
  }

  _startCanvasDrag(type, controlId, event) {
    event.preventDefault();
    event.stopPropagation();
    this.selectedControlId = controlId;
    this.activeCanvasDrag = { type, controlId };
  }

  _handleStageClick(event) {
    if (this.activeCanvasDrag) return;
    if (!this.isClickToAddEnabled) return;
    const pointer = toStagePercent(event, event.currentTarget.getBoundingClientRect(), STAGE_CLICK_LIMITS);
    this._addControlAt(pointer.x, pointer.y, DEFAULT_BOUNDARY_SHAPE);
  }

  _handleWindowPointerMove(event) {
    if (!this.activeCanvasDrag) return;
    const stage = this.querySelector('.main-gradient-stage');
    if (!stage) return;
    const pointer = toStagePercent(event, stage.getBoundingClientRect(), STAGE_DRAG_LIMITS);

    const control = this.controls.find(candidate => candidate.id === this.activeCanvasDrag.controlId);
    if (!control) return;

    const patch = computeCanvasDragPatch(this.activeCanvasDrag.type, control, pointer, this.globals);
    if (patch) this._applyControlPatch(control.id, patch);
  }

  _handleWindowPointerUp() {
    this.activeCanvasDrag = null;
  }

  _quickCopyCss() {
    const compiledScene = GradientFieldCompiler.compileScene(this.controls, this.globals, { isNaiveSrgb: false });
    copyTextToClipboard(formatQuickCopyCss(compiledScene));
    this._showToast('Copied combined CSS gradient to clipboard!');
  }

  _setNaiveComparison(isComparing) {
    this.isComparingNaiveSrgb = isComparing;
  }

  render() {
    const compiledScene = GradientFieldCompiler.compileScene(
      this.controls,
      this.globals,
      { isNaiveSrgb: this.isComparingNaiveSrgb }
    );
    const compositeStyle = compiledScene.inlineStyle;

    return html`
      <div class="h-screen w-full flex flex-col overflow-hidden">
        ${this._renderHeader(compositeStyle)}

        ${this.toastMessage ? this._renderToast() : nothing}

        <main class="flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
          ${this._renderControlsColumn()}
          ${this._renderStageColumn(compositeStyle)}
          ${this._renderInspectorColumn()}
        </main>

        <export-code-modal
          .isOpen=${this.isExportModalOpen}
          .controls=${this.controls}
          .globals=${this.globals}
          .noise=${this.noise}
          @modal-close=${() => { this.isExportModalOpen = false; }}
        ></export-code-modal>
      </div>
    `;
  }

  _renderHeader(compositeStyle) {
    return html`
        <header class="suite-header h-12 shrink-0 z-30 bg-white border-b border-slate-200 px-3 sm:px-4 flex items-center justify-between gap-3">
            <div class="flex items-center gap-2 min-w-0">
              <suite-nav></suite-nav>
              <div class="w-6 h-6 shrink-0 rounded-md hidden xl:block" style="${compositeStyle}" title="Live composite preview"></div>
            </div>

            ${this._renderModeSwitcher()}
            ${this._renderHeaderActions()}
        </header>
    `;
  }

  _renderModeSwitcher() {
    return html`
            <div class="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
              ${STAGE_MODES.map(mode => html`
                <button
                  type="button"
                  @click=${() => { this.canvasMode = mode.id; }}
                  title=${mode.label}
                  class="px-2.5 py-1 rounded-md whitespace-nowrap text-xs font-medium flex items-center gap-1.5 transition-all ${
                    this.canvasMode === mode.id
                      ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }"
                >
                  <i class="ph-duotone ${mode.icon}"></i>
                  <span class="hidden lg:inline">${mode.label}</span>
                </button>
              `)}
            </div>
    `;
  }

  _renderHeaderActions() {
    return html`
            <div class="flex items-center gap-2 shrink-0 whitespace-nowrap">
              <button
                type="button"
                @pointerdown=${() => this._setNaiveComparison(true)}
                @pointerup=${() => this._setNaiveComparison(false)}
                @pointerleave=${() => this._setNaiveComparison(false)}
                class="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                  this.isComparingNaiveSrgb
                    ? 'bg-amber-50 border-amber-400 text-amber-800 shadow-inner'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }"
                title="Hold down to compare with naive un-eased sRGB CSS interpolation"
              >
                <i class="ph-duotone ph-scales"></i>
                <span class="hidden md:inline">${this.isComparingNaiveSrgb ? 'Naive sRGB Active' : 'Hold: Compare sRGB'}</span>
              </button>

              <button
                type="button"
                @click=${this._quickCopyCss}
                class="px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <i class="ph-bold ph-copy"></i>
                <span class="hidden sm:inline">Copy CSS</span>
              </button>

              <button
                type="button"
                @click=${() => { this.isExportModalOpen = true; }}
                class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <i class="ph-bold ph-export"></i>
                <span>Export Code</span>
              </button>
            </div>
    `;
  }

  _renderToast() {
    return html`
          <div class="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700">
            <i class="ph-fill ph-check-circle text-emerald-400 text-base"></i>
            <span>${this.toastMessage}</span>
          </div>
    `;
  }

  _renderControlsColumn() {
    return html`
          <aside class="w-full lg:w-72 xl:w-80 shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 lg:h-full lg:overflow-y-auto">
            <control-nodes-panel
              class="block"
              .controls=${this.controls}
              .selectedControlId=${this.selectedControlId}
              .presets=${STUDIO_PRESETS}
              @control-select=${this._handleControlSelect}
              @control-update=${this._handleControlUpdate}
              @control-add=${this._handleControlAdd}
              @control-duplicate=${this._handleControlDuplicate}
              @control-delete=${this._handleControlDelete}
              @control-reorder=${this._handleControlReorder}
              @controls-arrange=${this._handleControlsArrange}
              @preset-select=${this._handlePresetSelect}
            ></control-nodes-panel>

            <global-aesthetics-panel
              class="block"
              .globals=${this.globals}
              .noise=${this.noise}
              @globals-update=${this._handleGlobalsUpdate}
              @noise-update=${this._handleNoiseUpdate}
            ></global-aesthetics-panel>
          </aside>
    `;
  }

  _renderStageColumn(compositeStyle) {
    return html`
          <div class="flex-1 min-w-0 bg-white lg:h-full lg:overflow-y-auto">
            <section class="border-b border-slate-200">
              ${this._renderStageToolbar()}
              <div class="p-3 space-y-2.5">
                ${this._renderStage(compositeStyle)}
                ${this._renderStageLegend()}
              </div>
            </section>

            <control-gradient-track
              class="block"
              .control=${this.selectedControl}
              .allControls=${this.controls}
              .globals=${this.globals}
              @control-update=${this._handleControlUpdate}
              @apply-harmony=${this._handleApplyHarmony}
            ></control-gradient-track>

            <live-css-preview-bar
              class="block"
              .controls=${this.controls}
              .selectedControl=${this.selectedControl}
              .globals=${this.globals}
              @css-copied=${() => this._showToast('Copied combined CSS ruleset to clipboard!')}
            ></live-css-preview-bar>
          </div>
    `;
  }

  _renderInspectorColumn() {
    return html`
          <aside class="w-full lg:w-72 xl:w-80 shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 lg:h-full lg:overflow-y-auto">
            <control-inspector-panel
              class="block"
              .control=${this.selectedControl}
              @control-update=${this._handleControlUpdate}
            ></control-inspector-panel>
          </aside>
    `;
  }

  _renderStageToolbar() {
    return html`
              <div class="${PANEL_HEADER_CLASS} flex-wrap py-2">
                <div class="flex items-center gap-2 text-xs min-w-0">
                  <span class="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                  <span class="font-semibold text-slate-800 truncate">${this.selectedControl?.name}</span>
                  <span class="font-mono text-[11px] text-slate-500">
                    (${this.selectedControl?.x}%, ${this.selectedControl?.y}%)
                  </span>
                  <span class="font-mono text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    Reach ${this.selectedControl?.radius}%
                  </span>
                </div>

                <div class="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    @click=${() => { this.isClickToAddEnabled = !this.isClickToAddEnabled; }}
                    class="px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1 ${
                      this.isClickToAddEnabled
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }"
                    title="When enabled, click anywhere on the canvas to place a new gradient control point"
                  >
                    <i class="ph-bold ph-plus-circle"></i>
                    <span>${this.isClickToAddEnabled ? 'Click Canvas to Place Point: ON' : '+ Click Canvas to Add'}</span>
                  </button>

                  <button
                    type="button"
                    @click=${() => { this.areAllBoundariesVisible = !this.areAllBoundariesVisible; }}
                    class="px-2 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      this.areAllBoundariesVisible
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }"
                    title="Show or hide dashed influence boundary contours for unselected points"
                  >
                    <span>All Rings</span>
                  </button>

                  <button
                    type="button"
                    @click=${() => { this.areGizmosVisible = !this.areGizmosVisible; }}
                    class="px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 ${
                      this.areGizmosVisible
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }"
                  >
                    <i class="ph-bold ph-crosshair"></i>
                    <span>Gizmos: ${this.areGizmosVisible ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>
    `;
  }

  _renderStage(compositeStyle) {
    return html`
              <div
                @click=${this._handleStageClick}
                class="main-gradient-stage relative w-full h-[350px] sm:h-[390px] rounded-lg overflow-hidden alpha-checkerboard border border-slate-200 shadow-inner select-none ${
                  this.isClickToAddEnabled ? 'cursor-crosshair ring-2 ring-emerald-500/50' : ''
                }"
              >
                <div class="absolute inset-0 transition-none" style="${compositeStyle}"></div>

                ${this.noise?.enabled ? this._renderGrainOverlay() : nothing}

                ${this._renderStageMockupContent(compositeStyle)}

                ${this._renderStageVectorOverlay()}
              </div>
    `;
  }

  _renderGrainOverlay() {
    const baseFrequency = this.noise?.frequency || GRAIN_DEFAULTS.frequency;
    const octaveCount = this.noise?.octaves || GRAIN_DEFAULTS.octaves;
    return html`
                  <svg class="absolute inset-0 w-full h-full pointer-events-none" style="opacity: ${this.noise.opacity || DEFAULT_GRAIN_OPACITY}; mix-blend-mode: ${this.noise.blendMode || GRAIN_DEFAULTS.blendMode}">
                    <filter id="chromaflow-svg-grain">
                      <feTurbulence
                        type="fractalNoise"
                        baseFrequency="${baseFrequency}"
                        numOctaves="${octaveCount}"
                        stitchTiles="stitch"
                      />
                      <feColorMatrix type="saturate" values="0" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#chromaflow-svg-grain)" />
                  </svg>
    `;
  }

  _renderStageLegend() {
    return html`
              <div class="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-slate-500">
                <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span class="flex items-center gap-1 whitespace-nowrap">
                    <span class="w-2.5 h-2.5 rounded-full bg-white border-2 border-indigo-600 inline-block"></span>
                    Drag <strong>P1..Pn</strong> to position
                  </span>
                  <span class="flex items-center gap-1 whitespace-nowrap">
                    <span class="w-2.5 h-2.5 rounded-full bg-slate-900 inline-block"></span>
                    Drag <strong>⟳</strong> to rotate angle
                  </span>
                  <span class="flex items-center gap-1 whitespace-nowrap">
                    <span class="w-2.5 h-2.5 rotate-45 bg-indigo-600 inline-block"></span>
                    Drag <strong>◆</strong> on ring to resize boundary reach
                  </span>
                </div>
                <span class="font-mono text-slate-400">
                  ${this.controls.filter(control => control.visible !== false).length} active emitters
                </span>
              </div>
    `;
  }

  _renderStageMockupContent(compositeStyle) {
    if (this.canvasMode === 'ui-card') return this._renderGlassCardMockup(compositeStyle);
    if (this.canvasMode === 'contrast') return this._renderContrastMockup();
    return nothing;
  }

  _renderGlassCardMockup(compositeStyle) {
    return html`
        <div class="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
          <div class="max-w-md w-full rounded-2xl bg-white/75 backdrop-blur-xl border border-white/60 shadow-2xl p-6 space-y-4 text-slate-900">
            <div class="flex items-center justify-between">
              <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-600/10 text-indigo-800 border border-indigo-500/20">
                Multi-Control Field Surface
              </span>
              <span class="text-xs font-mono text-slate-500">${this.controls.length} Emitters • OKLCH</span>
            </div>
            <div class="space-y-1.5">
              <h4 class="text-lg font-bold tracking-tight text-slate-900">
                Atmospheric Single-Layer Mesh
              </h4>
              <p class="text-xs text-slate-600 leading-relaxed">
                Every control point's influence region and boundary interaction compiles directly into a single standard CSS <code class="font-mono text-indigo-700">background</code> property.
              </p>
            </div>
            <div class="pt-2 flex items-center gap-2">
              <div
                class="px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm"
                style="${compositeStyle}"
              >
                Primary Surface Action
              </div>
              <div class="px-3 py-2 rounded-xl text-xs font-medium bg-slate-900/5 text-slate-700">
                Documentation
              </div>
            </div>
          </div>
        </div>
    `;
  }

  _renderContrastMockup() {
    const sampledControls = this.controls.slice(0, CONTRAST_SAMPLE_LIMIT);
    return html`
        <div class="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
          <div class="space-y-1">
            <span class="px-2 py-0.5 rounded bg-black/40 text-white text-[10px] font-mono uppercase">
              White Typography Contrast Check
            </span>
            <h4 class="text-2xl sm:text-3xl font-bold text-white drop-shadow-sm">
              Organic fields with zero muddy transitions.
            </h4>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            ${sampledControls.map(control => this._renderContrastCard(control))}
          </div>

          <div class="space-y-1">
            <span class="px-2 py-0.5 rounded bg-white/75 text-slate-900 text-[10px] font-mono uppercase">
              Dark Ink Typography Check
            </span>
            <h4 class="text-2xl sm:text-3xl font-bold text-slate-900">
              Precision spatial orchestration in pure CSS.
            </h4>
          </div>
        </div>
    `;
  }

  _renderContrastCard(control) {
    const gradedRgb = ColorMath.hexToRgb(ColorMath.applyGlobalGrading(control.color, this.globals));
    return html`
                <div class="rounded-xl bg-white/90 backdrop-blur-md border border-slate-200 p-2.5 shadow-lg space-y-1">
                  <div class="flex items-center justify-between text-[11px] font-mono">
                    <span class="font-semibold text-slate-800 truncate">${control.name}</span>
                    <span class="text-slate-500">(${control.x}%, ${control.y}%)</span>
                  </div>
                  ${renderContrastRow('White Text:', ColorMath.contrastRatio(gradedRgb, WHITE_RGB))}
                  ${renderContrastRow('Dark Text:', ColorMath.contrastRatio(gradedRgb, DARK_INK_RGB))}
                </div>
    `;
  }

  _renderStageVectorOverlay() {
    if (!this.areGizmosVisible || this.canvasMode !== 'studio') return nothing;
    const visibleControls = (this.controls || []).filter(control => control.visible !== false);
    const reachScale = Number(this.globals?.reachScale ?? 1);

    return html`
      <div class="absolute inset-0 pointer-events-none">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="w-full h-full overflow-visible">
          ${visibleControls.map(control => this._renderBoundaryOutline(control, reachScale))}
        </svg>

        ${visibleControls.map((control, index) => this._renderControlHandles(control, index, reachScale))}
      </div>
    `;
  }

  _renderBoundaryOutline(control, reachScale) {
    const isSelected = control.id === this.selectedControlId;
    if (!isSelected && !this.areAllBoundariesVisible) return nothing;

    const scaledRadius = (control.radius ?? CONTROL_DEFAULTS.radius) * reachScale;
    const outline = {
      isSelected,
      scaledRadius,
      centerX: control.x ?? CONTROL_DEFAULTS.x,
      centerY: control.y ?? CONTROL_DEFAULTS.y,
      reach: scaledRadius * OVERLAY_REACH_RATIO,
      angle: control.angle ?? CONTROL_DEFAULTS.angle,
      aspect: control.aspectRatio ?? CONTROL_DEFAULTS.aspectRatio,
      stroke: isSelected ? OUTLINE_STROKE.selectedColor : OUTLINE_STROKE.idleColor,
      strokeWidth: isSelected ? OUTLINE_STROKE.selectedWidth : OUTLINE_STROKE.idleWidth
    };
    const coreReach = outline.reach * ((control.hardness ?? CONTROL_DEFAULTS.hardness) / PERCENT);

    return svg`
              <g>
                ${renderShapeOutline(control, outline)}

                ${isSelected && coreReach > MIN_VISIBLE_CORE_REACH ? svg`
                  <circle
                    cx=${outline.centerX} cy=${outline.centerY} r=${coreReach}
                    fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="0.25"
                  />
                ` : nothing}
              </g>
            `;
  }

  _renderControlHandles(control, index, reachScale) {
    const isSelected = control.id === this.selectedControlId;
    const centerX = control.x ?? CONTROL_DEFAULTS.x;
    const centerY = control.y ?? CONTROL_DEFAULTS.y;

    return html`
            <div
              @pointerdown=${(event) => this._startCanvasDrag('position', control.id, event)}
              style="left: ${centerX}%; top: ${centerY}%"
              class="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing group z-20"
            >
              <div class="w-7 h-7 rounded-full bg-white shadow-lg flex items-center justify-center transition-transform ${
                isSelected
                  ? 'ring-2 ring-indigo-600 scale-110'
                  : 'ring-1 ring-slate-900/25 opacity-90 hover:opacity-100 hover:scale-105'
              }">
                <div
                  class="w-4 h-4 rounded-full border border-black/15 flex items-center justify-center text-[8px] font-mono font-bold text-white shadow-inner"
                  style="background: ${control.color}"
                >
                  ${index + 1}
                </div>
              </div>
              <span class="absolute top-8 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-900/85 text-white text-[10px] font-mono whitespace-nowrap shadow ${
                isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              } transition-opacity">
                P${index + 1} (${centerX}%, ${centerY}%)
              </span>
            </div>

            ${isSelected ? this._renderSelectedControlHandles(control, computeHandlePositions(control, reachScale)) : nothing}
          `;
  }

  _renderSelectedControlHandles(control, { angleHandle, reachHandle, aspectHandle }) {
    const angle = control.angle ?? CONTROL_DEFAULTS.angle;
    const shape = control.boundaryShape || DEFAULT_BOUNDARY_SHAPE;
    const hasAspectHandle = shape === 'rect-box' || shape === 'ellipse-beam';
    const aspectLabel = Number(control.aspectRatio ?? CONTROL_DEFAULTS.aspectRatio).toFixed(1);

    return html`
              <div
                @pointerdown=${(event) => this._startCanvasDrag('angle', control.id, event)}
                style="left: ${angleHandle.x}%; top: ${angleHandle.y}%"
                title="Drag to rotate Emitter / Polygon / Box Angle (${angle}°)"
                class="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-20 group"
              >
                <div class="w-6 h-6 rounded-full bg-slate-900 text-white border-2 border-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
                  <i class="ph-bold ph-arrows-clockwise text-[11px]"></i>
                </div>
                <span class="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-900/90 text-white text-[9px] font-mono whitespace-nowrap">
                  ${angle}°
                </span>
              </div>

              <div
                @pointerdown=${(event) => this._startCanvasDrag('radius', control.id, event)}
                style="left: ${reachHandle.x}%; top: ${reachHandle.y}%"
                title="Drag outward/inward to resize Boundary Reach (${control.radius}%)"
                class="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize z-20 group"
              >
                <div class="w-5 h-5 rounded-md rotate-45 bg-indigo-600 text-white border-2 border-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
                  <i class="ph-bold ph-arrows-out-simple text-[9px] -rotate-45"></i>
                </div>
                <span class="absolute top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-indigo-950/90 text-indigo-100 text-[9px] font-mono whitespace-nowrap">
                  Reach ${control.radius}%
                </span>
              </div>

              ${hasAspectHandle ? html`
                <div
                  @pointerdown=${(event) => this._startCanvasDrag('aspect', control.id, event)}
                  style="left: ${aspectHandle.x}%; top: ${aspectHandle.y}%"
                  title="Drag to adjust Rectangle / Beam Height Aspect (${aspectLabel}:1)"
                  class="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 cursor-ns-resize z-20 group"
                >
                  <div class="w-5 h-5 rounded-md bg-pink-600 text-white border-2 border-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
                    <i class="ph-bold ph-arrows-out-line-vertical text-[10px]"></i>
                  </div>
                  <span class="absolute top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-pink-950/90 text-pink-100 text-[9px] font-mono whitespace-nowrap">
                    ${aspectLabel}:1
                  </span>
                </div>
              ` : nothing}
    `;
  }
}
customElements.define('gradient-orchestrator', GradientOrchestrator);
