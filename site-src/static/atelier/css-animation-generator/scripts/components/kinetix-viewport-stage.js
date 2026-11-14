// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { html } from 'lit';
import { KinetixLightDomElement } from './kinetix-light-dom-element.js';
import { DEFAULT_VIEWPORT_WIDTH_PX } from '../config/constants.js';
import { buildScopedPreviewCss } from '../css/preview-css.js';
import { LAYOUT_SLOTS } from '../data/mock-page.js';
import { createRandomElementId, createTimestampSuffix } from '../graph/node-factory.js';
import { renderIcon } from '../ui/icons.js';

const STAGE_MIN_WIDTH_PX = 320;
const STAGE_MAX_WIDTH_PX = 1440;
const STAGE_RESIZE_FALLBACK_WIDTH_PX = 960;
const STAGE_RESIZE_DRAG_MULTIPLIER = 1.5;
const WIDTH_PRESET_MATCH_TOLERANCE_PX = 25;
const ITEM_ID_SUFFIX_DIGITS = 4;

const SCREEN_WIDTH_PRESETS = [
  { label: 'Mobile S', widthPx: 360 },
  { label: 'Mobile L', widthPx: 480 },
  { label: 'Tablet', widthPx: 768 },
  { label: 'Laptop', widthPx: 1024 },
  { label: 'Desktop', widthPx: 1280 }
];

class KinetixViewportStage extends KinetixLightDomElement {
  static properties = {
    widthPx: { type: Number },
    schedule: { type: Object },
    playbackCount: { type: Number },
    isPlaying: { type: Boolean },
    currentTimeMs: { type: Number },
    mockItems: { type: Array },
    mockHtml: { type: String },
    mockCss: { type: String },
    activeStageTab: { type: String },
    draftSlot: { type: String, state: true },
    draftTag: { type: String, state: true },
    draftId: { type: String, state: true },
    draftClassName: { type: String, state: true },
    draftText: { type: String, state: true }
  };

  constructor() {
    super();
    this.activeStageTab = 'preview';
    this.draftSlot = 'grid';
    this.draftTag = 'div';
    this.draftId = 'custom-card-4';
    this.draftClassName = 'scene-card';
    this.draftText = '04 • Custom Site Element';
  }

  render() {
    const schedule = this.schedule || { steps: [] };
    const scopeId = `kx-stage-${this.playbackCount || 1}`;
    const scopedCss = buildScopedPreviewCss({ schedule, mockCss: this.mockCss, scopeId });

    return html`
      <div class="flex flex-col h-full bg-white overflow-hidden">
        <style>${scopedCss}</style>

        <div class="px-3 py-2 bg-white border-b border-slate-200 flex flex-col gap-2 shrink-0">
          <div class="flex items-center justify-between gap-2 min-w-0">
            <div class="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
              ${this.renderStageTabButton('preview', 'eye', 'Live Screen')}
              ${this.renderStageTabButton('slots', 'layout', `Layout Slots & IDs (${(this.mockItems || []).length})`)}
              ${this.renderStageTabButton('code', 'code', 'Mock HTML & CSS')}
            </div>

            ${this.renderPlaybackBadges(schedule)}
          </div>

          ${this.renderWidthControls()}
        </div>

        ${this.activeStageTab === 'preview' ? this.renderPreviewTab(scopeId) : ''}

        ${this.activeStageTab === 'slots' ? this.renderSlotsTab() : ''}

        ${this.activeStageTab === 'code' ? this.renderCodeTab() : ''}
      </div>
    `;
  }

  renderStageTabButton(tabId, iconName, label) {
    const isActiveTab = this.activeStageTab === tabId;

    return html`
      <button
        type="button"
        title="${label}"
        @click="${() => { this.activeStageTab = tabId; }}"
        class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${isActiveTab
          ? 'bg-white text-indigo-700 shadow-sm'
          : 'text-slate-600 hover:text-slate-900'}"
      >
        ${renderIcon(iconName, 'w-3.5 h-3.5')}
        <span class="${isActiveTab ? 'inline' : 'hidden 2xl:inline'}">${label}</span>
      </button>
    `;
  }

  renderPlaybackBadges(schedule) {
    const runningStepTitles = schedule.steps
      .filter((step) => this.isPlaying && this.currentTimeMs >= step.startMs && this.currentTimeMs <= step.endMs)
      .map((step) => step.title);

    return html`
      <div class="flex items-center justify-end gap-1.5 min-w-0">
        ${schedule.matchedRangeLabel
          ? html`
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 min-w-0 shrink" title="Active Branch: ${schedule.matchedRangeLabel}">
                <span class="shrink-0">${renderIcon('gitBranch', 'w-3 h-3')}</span>
                <span class="truncate">Active Branch: ${schedule.matchedRangeLabel}</span>
              </span>
            `
          : ''}
        ${runningStepTitles.length > 0
          ? html`
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 min-w-0 shrink">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0"></span>
                <span class="truncate">${runningStepTitles.join(' + ')}</span>
              </span>
            `
          : ''}
      </div>
    `;
  }

  renderWidthControls() {
    const widthPx = this.widthPx || DEFAULT_VIEWPORT_WIDTH_PX;

    return html`
      <div class="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
        <div class="flex items-center gap-2 flex-1 min-w-[240px]">
          <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-500 shrink-0">Screen Width</span>
          <input
            type="range"
            min="320"
            max="1440"
            step="4"
            .value="${String(widthPx)}"
            @input="${(event) => this.emitSimulatedWidth(Number(event.target.value))}"
            class="flex-1 min-w-0 w-full accent-indigo-600 cursor-pointer"
          />
          <div class="flex items-center bg-white border border-slate-200 rounded-lg px-2 py-0.5 shrink-0">
            <input
              type="number"
              min="320"
              max="1920"
              .value="${String(widthPx)}"
              @change="${(event) => this.emitSimulatedWidth(Number(event.target.value))}"
              class="w-14 font-mono text-xs font-bold text-indigo-700 focus:outline-none text-right"
            />
            <span class="text-[10px] font-mono text-slate-400 ml-0.5">px</span>
          </div>
        </div>

        <div class="flex items-center gap-1 flex-wrap shrink-0">
          ${SCREEN_WIDTH_PRESETS.map((preset) => this.renderWidthPresetButton(preset, widthPx))}
        </div>
      </div>
    `;
  }

  renderWidthPresetButton(preset, currentWidthPx) {
    const isCurrentWidth = Math.abs(currentWidthPx - preset.widthPx) < WIDTH_PRESET_MATCH_TOLERANCE_PX;

    return html`
      <button
        type="button"
        @click="${() => this.emitSimulatedWidth(preset.widthPx)}"
        class="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border transition-colors cursor-pointer ${isCurrentWidth
          ? 'bg-indigo-600 text-white border-indigo-600'
          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}"
      >
        ${preset.widthPx}px
      </button>
    `;
  }

  renderPreviewTab(scopeId) {
    return html`
      <div class="flex-1 min-h-0 bg-slate-100 p-3 overflow-auto flex justify-center items-start kx-stage-grid">
        <div
          style="width: ${this.widthPx}px; min-width: 320px; max-width: 100%;"
          class="relative bg-white rounded-lg border border-slate-300 shadow-sm transition-all duration-75 flex flex-col overflow-hidden"
        >
          <div class="px-3 py-1.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-2 text-[11px] text-slate-500 min-w-0">
            <div class="flex items-center gap-1.5 shrink-0">
              <span class="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
              <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span class="ml-2 font-mono text-[10px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                viewport: ${this.widthPx}px
              </span>
            </div>
            <span class="text-[10px] text-slate-400 truncate min-w-0">
              Click any element to replay • Drag right edge to resize
            </span>
          </div>

          <div
            id="${scopeId}"
            @click="${() => this.emit('stage-trigger')}"
            class="flex-1 min-h-[280px] overflow-x-hidden"
            .innerHTML="${this.mockHtml || ''}"
          ></div>

          <div
            @mousedown="${(event) => this.startResizeDrag(event)}"
            title="Drag horizontally to test any screen width"
            class="kx-resize-handle absolute top-0 right-0 bottom-0 w-3 bg-transparent hover:bg-indigo-500/20 flex items-center justify-center group"
          >
            <div class="w-1 h-10 rounded-full bg-slate-300 group-hover:bg-indigo-600"></div>
          </div>
        </div>
      </div>
    `;
  }

  renderSlotsTab() {
    return html`
      <div class="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 bg-slate-50">
        ${this.renderAddItemForm()}

        <div class="space-y-3">
          ${LAYOUT_SLOTS.map((slot) => this.renderSlotSection(slot))}
        </div>
      </div>
    `;
  }

  renderAddItemForm() {
    return html`
      <div class="bg-white p-3 rounded-lg border border-slate-200 space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <span class="text-indigo-600">${renderIcon('plus', 'w-3.5 h-3.5')}</span>
            <span>Add Element to Defined Mock Layout Slot</span>
          </span>
          <span class="text-[11px] text-slate-400">
            Replicate your site's core <code class="font-mono text-indigo-600">#ids</code> & <code class="font-mono text-indigo-600">.classes</code>
          </span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <div>
            <label class="block text-[10px] font-semibold text-slate-500 mb-1">Layout Slot</label>
            <select
              .value="${this.draftSlot}"
              @change="${(event) => { this.draftSlot = event.target.value; }}"
              class="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-medium"
            >
              ${LAYOUT_SLOTS.map((slot) => html`<option value="${slot.id}">${slot.label.split(' ')[0]} Slot</option>`)}
            </select>
          </div>
          <div>
            <label class="block text-[10px] font-semibold text-slate-500 mb-1">HTML Tag</label>
            <select
              .value="${this.draftTag}"
              @change="${(event) => { this.draftTag = event.target.value; }}"
              class="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-mono"
            >
              <option value="div">&lt;div&gt;</option>
              <option value="button">&lt;button&gt;</option>
              <option value="h2">&lt;h2&gt;</option>
              <option value="p">&lt;p&gt;</option>
              <option value="span">&lt;span&gt;</option>
              <option value="article">&lt;article&gt;</option>
            </select>
          </div>
          <div>
            <label class="block text-[10px] font-semibold text-slate-500 mb-1">Element ID (#)</label>
            <input
              type="text"
              placeholder="e.g. hero-cta"
              .value="${this.draftId}"
              @input="${(event) => { this.draftId = event.target.value; }}"
              class="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono text-indigo-700"
            />
          </div>
          <div>
            <label class="block text-[10px] font-semibold text-slate-500 mb-1">CSS Class (.)</label>
            <input
              type="text"
              placeholder="e.g. scene-card"
              .value="${this.draftClassName}"
              @input="${(event) => { this.draftClassName = event.target.value; }}"
              class="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono text-emerald-700"
            />
          </div>
          <div>
            <label class="block text-[10px] font-semibold text-slate-500 mb-1">Label / Text</label>
            <div class="flex gap-1">
              <input
                type="text"
                .value="${this.draftText}"
                @input="${(event) => { this.draftText = event.target.value; }}"
                class="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
              />
              <button
                type="button"
                @click="${() => this.addDraftItem()}"
                class="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shrink-0 cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderSlotSection(slot) {
    const slotItems = (this.mockItems || []).filter((item) => item.slot === slot.id);

    return html`
      <div class="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div class="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
          <div class="min-w-0 truncate">
            <span class="text-xs font-bold text-slate-800">${slot.label}</span>
            <span class="text-[11px] text-slate-500 ml-2">${slot.description}</span>
          </div>
          <span class="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600 shrink-0">
            #slot-${slot.id}
          </span>
        </div>
        <div class="divide-y divide-slate-100">
          ${slotItems.map((item) => this.renderSlotItemRow(item))}
        </div>
      </div>
    `;
  }

  renderSlotItemRow(item) {
    return html`
      <div class="p-2.5 flex flex-wrap items-center gap-2 text-xs">
        <span class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
          &lt;${item.tag}&gt;
        </span>
        <div class="flex items-center gap-1">
          <span class="text-slate-400 font-mono">#</span>
          <input
            type="text"
            .value="${item.id || ''}"
            @input="${(event) => this.emitMockItemPatch(item, { id: event.target.value.replace(/^#/, '').trim() })}"
            title="Edit element ID so exported CSS matches your website"
            class="w-28 rounded border border-slate-200 bg-indigo-50/40 px-1.5 py-1 font-mono text-[11px] font-semibold text-indigo-700"
          />
        </div>
        <div class="flex items-center gap-1">
          <span class="text-slate-400 font-mono">.</span>
          <input
            type="text"
            .value="${item.className || ''}"
            @input="${(event) => this.emitMockItemPatch(item, { className: event.target.value.replace(/^\./, '').trim() })}"
            class="w-24 rounded border border-slate-200 bg-emerald-50/40 px-1.5 py-1 font-mono text-[11px] text-emerald-700"
          />
        </div>
        <input
          type="text"
          .value="${item.text || ''}"
          @input="${(event) => this.emitMockItemPatch(item, { text: event.target.value })}"
          class="flex-1 min-w-[120px] rounded border border-slate-200 px-2 py-1 text-xs text-slate-700"
        />
        <button
          type="button"
          @click="${() => this.emit('delete-mock-item', { uid: item.uid })}"
          class="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
          title="Remove item from slot"
        >
          ${renderIcon('trash', 'w-3.5 h-3.5')}
        </button>
      </div>
    `;
  }

  renderCodeTab() {
    return html`
      <div class="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 overflow-hidden">
        <div class="flex flex-col h-full">
          <div class="px-3 py-1.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
            <span class="text-[11px] font-bold text-slate-700">Editable Mock HTML (With Your Site IDs)</span>
            <button
              type="button"
              @click="${() => this.emit('sync-html-from-slots')}"
              class="text-[10px] font-semibold text-indigo-600 hover:underline cursor-pointer"
            >
              Reset from Slots
            </button>
          </div>
          <textarea
            .value="${this.mockHtml || ''}"
            @input="${(event) => this.emit('update-mock-html', { html: event.target.value })}"
            spellcheck="false"
            class="flex-1 w-full p-3 font-mono text-xs bg-slate-900 text-emerald-300 focus:outline-none resize-none leading-relaxed"
          ></textarea>
        </div>
        <div class="flex flex-col h-full">
          <div class="px-3 py-1.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
            <span class="text-[11px] font-bold text-slate-700">Editable Mock Base CSS</span>
            <span class="text-[10px] text-slate-400">Scoped automatically to preview</span>
          </div>
          <textarea
            .value="${this.mockCss || ''}"
            @input="${(event) => this.emit('update-mock-css', { css: event.target.value })}"
            spellcheck="false"
            class="flex-1 w-full p-3 font-mono text-xs bg-slate-900 text-sky-300 focus:outline-none resize-none leading-relaxed"
          ></textarea>
        </div>
      </div>
    `;
  }

  emitSimulatedWidth(widthPx) {
    this.emit('change-simulated-width', { width: widthPx });
  }

  emitMockItemPatch(item, patch) {
    this.emit('update-mock-item', { uid: item.uid, patch });
  }

  startResizeDrag(mouseDownEvent) {
    mouseDownEvent.preventDefault();
    const dragStartX = mouseDownEvent.clientX;
    const dragStartWidthPx = this.widthPx || STAGE_RESIZE_FALLBACK_WIDTH_PX;
    let isResizing = true;

    const handleMouseMove = (moveEvent) => {
      if (!isResizing) return;
      const deltaPx = (moveEvent.clientX - dragStartX) * STAGE_RESIZE_DRAG_MULTIPLIER;
      const nextWidthPx = Math.min(
        STAGE_MAX_WIDTH_PX,
        Math.max(STAGE_MIN_WIDTH_PX, Math.round(dragStartWidthPx + deltaPx))
      );
      this.emitSimulatedWidth(nextWidthPx);
    };

    const handleMouseUp = () => {
      isResizing = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  addDraftItem() {
    if (!this.draftId && !this.draftClassName) return;
    this.emit('add-mock-item', {
      item: {
        uid: `item-${createTimestampSuffix(ITEM_ID_SUFFIX_DIGITS)}`,
        slot: this.draftSlot,
        tag: this.draftTag,
        id: this.draftId.replace(/^#/, '').trim(),
        className: this.draftClassName.replace(/^\./, '').trim(),
        text: this.draftText || 'New Element'
      }
    });
    this.draftId = createRandomElementId();
  }
}
customElements.define('kinetix-viewport-stage', KinetixViewportStage);
