// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { html, nothing } from 'lit';
import { KinetixLightDomElement } from './kinetix-light-dom-element.js';
import { DEFAULT_CSS_MODE } from '../config/constants.js';
import { EASING_PRESETS, QUICK_ANIMATION_RECIPES } from '../data/animation-presets.js';
import { getOutputTargetIds, toggleOutputTarget } from '../graph/graph-connections.js';
import { cloneData, createExtraWideRange, createReducedMotionConditionPatch, createTimestampSuffix, createViewportRangesConditionPatch } from '../graph/node-factory.js';
import { collectMockSelectorOptions } from '../mock/mock-markup.js';
import { renderIcon } from '../ui/icons.js';

const RANGE_ID_SUFFIX_DIGITS = 3;
const MAX_KEYFRAME_STOPS = 4;
const DEFAULT_BORDER_RADIUS_PX = 12;

const KEYFRAME_SLIDERS = [
  { field: 'translateX', label: 'Translate X', unit: 'px', min: '-120', max: '120' },
  { field: 'translateY', label: 'Translate Y', unit: 'px', min: '-120', max: '120' },
  { field: 'scale', label: 'Scale', unit: '', min: '0.3', max: '1.35', step: '0.05' },
  { field: 'rotate', label: 'Rotate', unit: '°', min: '-45', max: '45' },
  { field: 'opacity', label: 'Opacity', unit: '', min: '0', max: '1', step: '0.05' },
  { field: 'blur', label: 'Blur Filter', unit: 'px', min: '0', max: '16', step: '1' }
];

const ANIMATION_TIMING_FIELDS = [
  { field: 'duration', label: 'Duration (ms)', step: '50', min: '100', max: '4000' },
  { field: 'delay', label: 'Offset Delay', step: '20', min: '0', max: '3000' },
  { field: 'stagger', label: 'Stagger (--i)', step: '20', min: '0', max: '600' }
];

class KinetixInspector extends KinetixLightDomElement {
  static properties = {
    nodes: { type: Array },
    selectedNode: { type: Object },
    mockItems: { type: Array }
  };

  render() {
    const node = this.selectedNode;
    if (!node) return html``;

    return html`
      <div class="p-3.5 space-y-4 bg-white">
        ${this.renderTitleBar(node)}

        ${node.type === 'trigger' ? this.renderTriggerSettings(node) : ''}

        ${node.type === 'condition' ? this.renderConditionSettings(node) : ''}

        ${node.type === 'animation' ? this.renderAnimationSettings(node) : ''}
      </div>
    `;
  }

  renderTitleBar(node) {
    return html`
      <div class="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
        <div class="flex-1 min-w-0">
          <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
            ${node.type} Node Inspector
          </span>
          <input
            type="text"
            .value="${node.title || ''}"
            @input="${(event) => this.updateNode({ title: event.target.value }, false)}"
            class="mt-1.5 block w-full font-bold text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          />
        </div>
        ${node.type !== 'trigger'
          ? html`
              <button
                type="button"
                @click="${() => this.emit('delete-node', { nodeId: node.id })}"
                class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Delete Node"
              >
                ${renderIcon('trash', 'w-4 h-4')}
              </button>
            `
          : ''}
      </div>
    `;
  }

  renderTriggerSettings(node) {
    return html`
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">
            DOM / Lifecycle Trigger Event
          </label>
          <select
            .value="${node.triggerType}"
            @change="${(event) => this.updateNode({ triggerType: event.target.value }, true)}"
            class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800"
          >
            <option value="load">On Page Mount / Load</option>
            <option value="click">On Click / Tap Interaction</option>
            <option value="scroll">On Scroll Intersection (&gt;25%)</option>
            <option value="hover">On Pointer Hover</option>
          </select>
        </div>

        <div class="space-y-2 pt-2 border-t border-slate-200">
          <div class="text-xs font-bold text-slate-700">
            Parallel Start Targets (Check multiple to run in parallel)
          </div>
          ${(node.outputs || []).map((output) => this.renderParallelTargetPicker(output))}
        </div>
      </div>
    `;
  }

  renderConditionSettings(node) {
    return html`
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">
            Condition Mode
          </label>
          <select
            .value="${node.conditionType}"
            @change="${(event) => this.changeConditionMode(event.target.value)}"
            class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800"
          >
            <option value="viewportRanges">Multi-Range Viewport Router (Any Number of Width Ranges)</option>
            <option value="reducedMotion">Prefers Reduced Motion (A11y Guard)</option>
          </select>
        </div>

        ${node.conditionType === 'viewportRanges' ? this.renderWidthRanges(node) : ''}

        <div class="space-y-2 pt-2 border-t border-slate-200">
          <div class="text-xs font-bold text-slate-700">
            Branch Parallel Routing (Check 1 or multiple per branch)
          </div>
          ${(node.outputs || []).map((output) => this.renderParallelTargetPicker(output))}
        </div>
      </div>
    `;
  }

  renderWidthRanges(node) {
    const ranges = node.ranges || [];
    const canRemoveRange = ranges.length > 1;

    return html`
      <div class="space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-800">Defined Width Ranges (px)</span>
          <button
            type="button"
            @click="${() => this.addWidthRange()}"
            class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-semibold cursor-pointer"
          >
            ${renderIcon('plus', 'w-3 h-3')}
            <span>Add Range</span>
          </button>
        </div>

        ${ranges.map((range, rangeIndex) => this.renderWidthRangeCard(range, rangeIndex, canRemoveRange))}
      </div>
    `;
  }

  renderWidthRangeCard(range, rangeIndex, canRemoveRange) {
    return html`
      <div class="p-2.5 rounded-lg bg-amber-50/50 border border-amber-200/80 space-y-2">
        <div class="flex items-center justify-between gap-2">
          <input
            type="text"
            .value="${range.label}"
            @input="${(event) => this.updateWidthRange(rangeIndex, { label: event.target.value })}"
            class="flex-1 font-semibold text-xs text-slate-800 bg-white border border-slate-200 rounded px-2 py-1"
          />
          ${canRemoveRange
            ? html`
                <button
                  type="button"
                  @click="${() => this.removeWidthRange(range.id)}"
                  class="text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  ${renderIcon('trash', 'w-3.5 h-3.5')}
                </button>
              `
            : ''}
        </div>
        <div class="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span class="text-slate-500">Min Width (px)</span>
            <input
              type="number"
              min="0"
              max="3840"
              .value="${String(range.min)}"
              @change="${(event) => this.updateWidthRange(rangeIndex, { min: Number(event.target.value) })}"
              class="mt-0.5 w-full rounded border border-slate-200 bg-white px-2 py-1 font-mono font-bold text-slate-800"
            />
          </div>
          <div>
            <span class="text-slate-500">Max Width (px)</span>
            <input
              type="number"
              min="320"
              max="9999"
              .value="${String(range.max)}"
              @change="${(event) => this.updateWidthRange(rangeIndex, { max: Number(event.target.value) })}"
              class="mt-0.5 w-full rounded border border-slate-200 bg-white px-2 py-1 font-mono font-bold text-slate-800"
            />
          </div>
        </div>
      </div>
    `;
  }

  renderParallelTargetPicker(output) {
    const node = this.selectedNode;
    const candidateNodes = (this.nodes || []).filter((candidate) => candidate.id !== node.id && candidate.type !== 'trigger');
    const currentTargetIds = getOutputTargetIds(output);

    return html`
      <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
        <div class="flex items-center justify-between gap-2">
          <span class="text-[11px] font-bold text-slate-700 truncate min-w-0">${output.label} →</span>
          <span class="text-[10px] font-mono text-indigo-600 whitespace-nowrap shrink-0">
            ${currentTargetIds.length} parallel ${currentTargetIds.length === 1 ? 'target' : 'targets'}
          </span>
        </div>
        <div class="max-h-32 overflow-y-auto space-y-1 pr-1">
          ${candidateNodes.map((candidate) => html`
            <label class="flex items-center gap-2 px-2 py-1 rounded-lg bg-white border border-slate-200/80 hover:border-indigo-300 cursor-pointer text-xs">
              <input
                type="checkbox"
                .checked="${currentTargetIds.includes(candidate.id)}"
                @change="${() => this.togglePortTarget(output.id, candidate.id)}"
                class="accent-indigo-600 rounded"
              />
              <span class="truncate font-medium text-slate-700">${candidate.title}</span>
            </label>
          `)}
        </div>
      </div>
    `;
  }

  renderAnimationSettings(node) {
    return html`
      <div class="space-y-4">
        ${this.renderRecipePicker()}

        ${this.renderTargetSelectorField(node)}

        ${this.renderCssModeToggle(node)}

        <div class="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          ${ANIMATION_TIMING_FIELDS.map((timingField) => this.renderTimingField(node, timingField))}
        </div>

        ${this.renderEasingField(node)}

        <div class="pt-2 border-t border-slate-200 space-y-1.5">
          <div class="text-xs font-bold text-slate-700">
            Chain Next Nodes onComplete (Check multiple for parallel)
          </div>
          ${(node.outputs || []).map((output) => this.renderParallelTargetPicker(output))}
        </div>

        ${this.renderKeyframeStops(node)}
      </div>
    `;
  }

  renderRecipePicker() {
    return html`
      <div>
        <label class="block text-[11px] font-bold text-slate-700 mb-1">
          Quick Web Animation / Transition Recipe
        </label>
        <div class="flex flex-wrap gap-1">
          ${QUICK_ANIMATION_RECIPES.map((recipe) => html`
            <button
              type="button"
              @click="${() => this.applyRecipe(recipe.id)}"
              class="px-2 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 text-[10px] font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              ${recipe.label}
            </button>
          `)}
        </div>
      </div>
    `;
  }

  renderTargetSelectorField(node) {
    const selectorOptions = collectMockSelectorOptions(this.mockItems);

    return html`
      <div class="space-y-1.5">
        <label class="block text-xs font-semibold text-slate-700">
          Target CSS Selector (Match your Mock #id or .class)
        </label>
        <div class="flex gap-1.5">
          <input
            type="text"
            .value="${node.target || ''}"
            @change="${(event) => this.updateNode({ target: event.target.value }, true)}"
            placeholder="#hero-heading, .scene-card"
            class="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-mono font-semibold text-indigo-700"
          />
          <select
            @change="${(event) => this.applyPickedSelector(event.target)}"
            class="w-32 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-700"
          >
            <option value="">Pick Mock ID...</option>
            ${selectorOptions.map((option) => html`<option value="${option.selector}">${option.label}</option>`)}
          </select>
        </div>
      </div>
    `;
  }

  renderCssModeToggle(node) {
    const cssMode = node.cssMode || DEFAULT_CSS_MODE;

    return html`
      <div class="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
        <button
          type="button"
          @click="${() => this.updateNode({ cssMode: 'keyframes' }, true)}"
          class="py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${cssMode === 'keyframes'
            ? 'bg-white text-indigo-700 shadow-2xs'
            : 'text-slate-600'}"
        >
          @keyframes Animation
        </button>
        <button
          type="button"
          @click="${() => this.updateNode({ cssMode: 'transition' }, true)}"
          class="py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${node.cssMode === 'transition'
            ? 'bg-white text-indigo-700 shadow-2xs'
            : 'text-slate-600'}"
        >
          + CSS Transition Rule
        </button>
      </div>
    `;
  }

  renderTimingField(node, { field, label, step, min, max }) {
    return html`
      <div>
        <label class="block text-[10px] font-semibold text-slate-500">${label}</label>
        <input
          type="number"
          step="${step}"
          min="${min}"
          max="${max}"
          .value="${String(node[field])}"
          @change="${(event) => this.updateNode({ [field]: Number(event.target.value) }, true)}"
          class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono font-semibold text-slate-800"
        />
      </div>
    `;
  }

  renderEasingField(node) {
    return html`
      <div class="space-y-2">
        <label class="block text-xs font-semibold text-slate-700">
          Easing Physics & Curve
        </label>
        <select
          .value="${node.easing}"
          @change="${(event) => this.updateNode({ easing: event.target.value }, true)}"
          class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800"
        >
          ${EASING_PRESETS.map((preset) => html`
            <option value="${preset.value}" ?selected="${node.easing === preset.value}">
              ${preset.label}
            </option>
          `)}
        </select>
        <kinetix-bezier-curve .easing="${node.easing}"></kinetix-bezier-curve>
      </div>
    `;
  }

  renderKeyframeStops(node) {
    const keyframeCount = node.keyframes?.length || 0;

    return html`
      <div class="pt-3 border-t border-slate-200 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <span class="text-indigo-600">${renderIcon('sliders', 'w-3.5 h-3.5')}</span>
            <span>Keyframe & Style Stops (${keyframeCount})</span>
          </span>
          ${keyframeCount < MAX_KEYFRAME_STOPS
            ? html`
                <button
                  type="button"
                  @click="${() => this.emit('add-keyframe-stop')}"
                  class="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  ${renderIcon('plus', 'w-3 h-3')}
                  <span>Add Midpoint Stop</span>
                </button>
              `
            : ''}
        </div>

        <div class="space-y-3">
          ${(node.keyframes || []).map((keyframe, keyframeIndex) => this.renderKeyframeStop(keyframe, keyframeIndex))}
        </div>
      </div>
    `;
  }

  renderKeyframeStop(keyframe, keyframeIndex) {
    return html`
      <div class="p-3 rounded-lg bg-slate-50 border border-slate-200/90 space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="px-2 py-0.5 rounded bg-indigo-600 text-white font-mono text-[11px] font-bold">
            ${keyframe.offset}% Stop
          </span>
          <label class="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              .checked="${Boolean(keyframe.useColors)}"
              @change="${(event) => this.updateKeyframe(keyframeIndex, 'useColors', event.target.checked)}"
              class="accent-pink-600 rounded"
            />
            <span>Animate Colors & Radius</span>
          </label>
        </div>

        <div class="grid grid-cols-2 gap-2.5 text-[11px]">
          ${KEYFRAME_SLIDERS.map((slider) => this.renderKeyframeSlider(keyframe, keyframeIndex, slider))}
        </div>

        ${keyframe.useColors ? this.renderKeyframeColors(keyframe, keyframeIndex) : ''}
      </div>
    `;
  }

  renderKeyframeSlider(keyframe, keyframeIndex, { field, label, unit, min, max, step }) {
    return html`
      <div>
        <div class="flex justify-between text-slate-600">
          <span>${label}</span>
          <span class="font-mono">${keyframe[field]}${unit}</span>
        </div>
        <input
          type="range"
          min="${min}"
          max="${max}"
          step="${step ?? nothing}"
          .value="${String(keyframe[field])}"
          @input="${(event) => this.updateKeyframe(keyframeIndex, field, Number(event.target.value))}"
          class="w-full accent-indigo-600 cursor-pointer"
        />
      </div>
    `;
  }

  renderKeyframeColors(keyframe, keyframeIndex) {
    const borderRadiusPx = keyframe.borderRadius ?? DEFAULT_BORDER_RADIUS_PX;

    return html`
      <div class="pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-[11px]">
        ${this.renderColorField(keyframeIndex, {
          label: 'Background Color',
          field: 'bgColor',
          pickerValue: keyframe.bgColor && keyframe.bgColor !== 'transparent' ? keyframe.bgColor : '#4F46E5',
          textValue: keyframe.bgColor || '#ffffff'
        })}
        ${this.renderColorField(keyframeIndex, {
          label: 'Text Color',
          field: 'textColor',
          pickerValue: keyframe.textColor || '#0F172A',
          textValue: keyframe.textColor || '#0F172A'
        })}
        ${this.renderColorField(keyframeIndex, {
          label: 'Border Color',
          field: 'borderColor',
          pickerValue: keyframe.borderColor && keyframe.borderColor !== 'transparent' ? keyframe.borderColor : '#E2E8F0',
          textValue: keyframe.borderColor || '#E2E8F0'
        })}
        <div>
          <div class="flex justify-between text-slate-600 mb-0.5">
            <span>Border Radius</span>
            <span class="font-mono">${borderRadiusPx}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="40"
            .value="${String(borderRadiusPx)}"
            @input="${(event) => this.updateKeyframe(keyframeIndex, 'borderRadius', Number(event.target.value))}"
            class="w-full accent-pink-600 cursor-pointer"
          />
        </div>
      </div>
    `;
  }

  renderColorField(keyframeIndex, { label, field, pickerValue, textValue }) {
    return html`
      <div>
        <span class="block text-slate-600 mb-0.5">${label}</span>
        <div class="flex items-center gap-1">
          <input
            type="color"
            .value="${pickerValue}"
            @input="${(event) => this.updateKeyframe(keyframeIndex, field, event.target.value)}"
            class="w-6 h-6 rounded border border-slate-200 cursor-pointer"
          />
          <input
            type="text"
            .value="${textValue}"
            @change="${(event) => this.updateKeyframe(keyframeIndex, field, event.target.value)}"
            class="w-full rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px]"
          />
        </div>
      </div>
    `;
  }

  updateNode(patch, shouldReplay = false) {
    this.emit('update-selected-node', { patch, replay: shouldReplay });
  }

  updateKeyframe(keyframeIndex, field, value) {
    if (!this.selectedNode || this.selectedNode.type !== 'animation') return;
    const nextKeyframes = this.selectedNode.keyframes.map((keyframe, index) =>
      index === keyframeIndex ? { ...keyframe, [field]: value } : keyframe
    );
    this.updateNode({ keyframes: nextKeyframes }, true);
  }

  applyRecipe(recipeId) {
    const recipe = QUICK_ANIMATION_RECIPES.find((candidate) => candidate.id === recipeId);
    if (!recipe) return;
    this.updateNode(
      {
        duration: recipe.duration,
        easing: recipe.easing,
        keyframes: cloneData(recipe.keyframes)
      },
      true
    );
  }

  applyPickedSelector(selectElement) {
    if (!selectElement.value) return;
    this.updateNode({ target: selectElement.value }, true);
    selectElement.value = '';
  }

  changeConditionMode(conditionMode) {
    const patch =
      conditionMode === 'viewportRanges' ? createViewportRangesConditionPatch() : createReducedMotionConditionPatch();
    this.updateNode(patch, true);
  }

  togglePortTarget(portId, targetNodeId) {
    const node = this.selectedNode;
    if (!node) return;
    const nextOutputs = (node.outputs || []).map((output) =>
      output.id === portId ? toggleOutputTarget(output, targetNodeId) : output
    );
    this.updateNode({ outputs: nextOutputs }, true);
  }

  addWidthRange() {
    const node = this.selectedNode;
    if (!node || node.type !== 'condition') return;
    const { range, output } = createExtraWideRange(`r-${createTimestampSuffix(RANGE_ID_SUFFIX_DIGITS)}`);
    this.updateNode(
      {
        ranges: [...(node.ranges || []), range],
        outputs: [...(node.outputs || []), output]
      },
      true
    );
  }

  updateWidthRange(rangeIndex, patch) {
    const node = this.selectedNode;
    if (!node) return;
    const nextRanges = (node.ranges || []).map((range, index) => (index === rangeIndex ? { ...range, ...patch } : range));
    const editedRange = nextRanges[rangeIndex];
    const nextOutputs = (node.outputs || []).map((output) =>
      output.id === editedRange.id ? { ...output, label: `${editedRange.min}–${editedRange.max}px` } : output
    );
    this.updateNode({ ranges: nextRanges, outputs: nextOutputs }, true);
  }

  removeWidthRange(rangeId) {
    const node = this.selectedNode;
    if (!node || (node.ranges || []).length <= 1) return;
    this.updateNode(
      {
        ranges: node.ranges.filter((range) => range.id !== rangeId),
        outputs: (node.outputs || []).filter((output) => output.id !== rangeId)
      },
      true
    );
  }
}
customElements.define('kinetix-inspector', KinetixInspector);
