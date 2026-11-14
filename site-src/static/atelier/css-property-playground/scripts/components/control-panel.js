// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { html } from 'lit';
import { LightDomLitElement } from './light-dom-lit-element.js';
import { BOX_SHADOW_FALLBACK_COLOR, DEFAULT_PREVIEW_TEXT, FALLBACK_FLEX_ITEM, FALLBACK_GRID_CELL, FALLBACK_GRID_COLUMNS, PERCENT_RANGE } from '../config/constants.js';
import { createBoxShadowLayer, createTextShadowLayer } from '../engines/css-layers.js';
import { getActiveLayerIndex } from '../engines/engine-state.js';
import { dispatchValueChanges } from '../utils/browser-actions.js';
import { clampToRange, cloneDeep, removeAt } from '../utils/value-math.js';

const CLIP_PATH_MODES = ['polygon', 'circle', 'ellipse', 'inset'];
const GRADIENT_TYPES = ['linear', 'radial', 'conic'];
const FLEX_JUSTIFY_OPTIONS = ['flex-start', 'center', 'space-between', 'space-around'];
const MIN_POLYGON_VERTICES = 3;
const MIN_SHADOW_LAYERS = 1;
const MIN_GRADIENT_STOPS = 2;
const MIN_FLEX_ITEMS = 1;
const MIN_GRID_COLUMNS = 1;
const MAX_GRID_COLUMNS = 6;
const MIN_GRID_CELLS = 1;
const MAX_GRID_ROW_SPAN = 3;
const NEW_GRADIENT_STOP = { color: '#10b981', pos: 100 };
const NEW_POLYGON_VERTEX_FALLBACKS = { last: { x: 20, y: 80 }, first: { x: 50, y: 10 } };
const CLIP_CIRCLE_RADIUS_SLIDER = { key: 'circleR', label: 'Circle Radius', min: 5, max: 70, step: 1, unit: '%' };

const CLIP_ELLIPSE_RADIUS_SLIDERS = [
  { key: 'ellipseRX', label: 'Radius X', min: 5, max: 70, step: 1, unit: '%' },
  { key: 'ellipseRY', label: 'Radius Y', min: 5, max: 70, step: 1, unit: '%' }
];

const CLIP_CENTER_SLIDERS = [
  { key: 'circleX', label: 'Center X', min: 0, max: 100, step: 1, unit: '%' },
  { key: 'circleY', label: 'Center Y', min: 0, max: 100, step: 1, unit: '%' }
];

const CLIP_INSET_SLIDERS = [
  { key: 'insetT', label: 'Inset Top', min: 0, max: 45, step: 1, unit: '%' },
  { key: 'insetR', label: 'Inset Right', min: 0, max: 45, step: 1, unit: '%' },
  { key: 'insetB', label: 'Inset Bottom', min: 0, max: 45, step: 1, unit: '%' },
  { key: 'insetL', label: 'Inset Left', min: 0, max: 45, step: 1, unit: '%' },
  { key: 'insetRound', label: 'Corner Roundness', min: 0, max: 60, step: 1, unit: 'px' }
];

const GRADIENT_ANGLE_SLIDER = { key: 'angle', label: 'Angle', min: 0, max: 360, step: 1, unit: 'deg' };

const GRADIENT_CENTER_SLIDERS = [
  { key: 'centerX', label: 'Center X', min: 0, max: 100, step: 1, unit: '%' },
  { key: 'centerY', label: 'Center Y', min: 0, max: 100, step: 1, unit: '%' }
];

const FLEX_CONTAINER_SLIDERS = [
  { key: 'containerW', label: 'Simulate Container Width', min: 200, max: 480, step: 4, unit: 'px' },
  { key: 'gap', label: 'Container gap', min: 0, max: 32, step: 2, unit: 'px' }
];

const GRID_GAP_SLIDERS = [
  { key: 'rowGap', label: 'row-gap', min: 0, max: 32, step: 2, unit: 'px' },
  { key: 'colGap', label: 'column-gap', min: 0, max: 32, step: 2, unit: 'px' }
];

const SHADOW_LAYER_SLIDERS = [
  { field: 'x', label: 'Offset X', min: -60, max: 60, step: 1, unit: 'px', isBoxShadowOnly: false },
  { field: 'y', label: 'Offset Y', min: -60, max: 60, step: 1, unit: 'px', isBoxShadowOnly: false },
  { field: 'blur', label: 'Blur Radius', min: 0, max: 80, step: 1, unit: 'px', isBoxShadowOnly: false },
  { field: 'spread', label: 'Spread Radius', min: -30, max: 30, step: 1, unit: 'px', isBoxShadowOnly: true },
  { field: 'alpha', label: 'Layer Opacity', min: 0.05, max: 1, step: 0.05, unit: '', isBoxShadowOnly: false }
];

class ControlPanel extends LightDomLitElement {
  static properties = {
    engine: { type: Object },
    values: { type: Object }
  };

  render() {
    const engine = this.engine;
    const values = this.values || {};
    const specializedControls = this.renderSpecializedControls(engine, values);

    return html`
      <div class="bg-white p-3.5 flex flex-col gap-3.5">
        ${this.renderPresets(engine.presets || [])}

        <hr class="border-slate-100" />

        <div>
          <div class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
            <i class="ph-fill ph-sliders-horizontal text-brand-600"></i>
            <span>Interactive Parameter Controls</span>
          </div>

          ${specializedControls ? specializedControls : this.renderGenericControls(engine.controls || [], values)}
        </div>
      </div>
    `;
  }

  emitValueChanges(valueChanges) {
    dispatchValueChanges(this, valueChanges);
  }

  emitNumericValue(key, rawValue) {
    this.emitValueChanges({ [key]: Number(rawValue) });
  }

  applyPreset(presetValues) {
    this.emitValueChanges(cloneDeep(presetValues));
  }

  renderPresets(presets) {
    return html`
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <i class="ph-fill ph-magic-wand text-brand-600"></i>
            <span>One-Click Visual Presets</span>
          </span>
        </div>
        <div class="flex flex-wrap gap-1.5">
          ${presets.map(preset => html`
            <button
              @click=${() => this.applyPreset(preset.values)}
              class="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 hover:bg-brand-50 text-slate-700 hover:text-brand-700 border border-slate-200 hover:border-brand-200 transition"
            >
              ${preset.name}
            </button>
          `)}
        </div>
      </div>
    `;
  }

  renderSpecializedControls(engine, values) {
    if (engine.id === 'clip-path-polygon') return this.renderClipPathControls(values);
    if (engine.id === 'box-shadow') return this.renderMultiShadowControls(values, false);
    if (engine.id === 'text-shadow') return this.renderMultiShadowControls(values, true);
    if (engine.id === 'linear-gradient') return this.renderMultiGradientControls(values);
    if (engine.id === 'flex-grow-shrink') return this.renderFlexBuilderControls(values);
    if (engine.id === 'grid-template-layout') return this.renderGridBuilderControls(values);
    return null;
  }

  renderGenericControls(controls, values) {
    return html`
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3.5">
        ${controls.map(control => {
          const value = values[control.key] ?? control.defaultValue;
          if (control.unit === 'toggle') return this.renderToggleControl(control, value);
          return this.renderControlSlider({ ...control, unit: control.unit !== 'enum' ? control.unit : '' }, value);
        })}
      </div>
    `;
  }

  renderToggleControl(control, value) {
    return html`
      <div class="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/80">
        <span class="text-xs font-medium text-slate-700">${control.label}</span>
        <button
          @click=${() => this.emitNumericValue(control.key, value ? 0 : 1)}
          class="w-11 h-6 rounded-full transition relative ${value ? 'bg-brand-600' : 'bg-slate-300'}"
        >
          <span
            class="w-4 h-4 rounded-full bg-white shadow absolute top-1 transition-all ${value ? 'left-6' : 'left-1'}"
          ></span>
        </button>
      </div>
    `;
  }

  renderControlSlider(control, value) {
    const { label, min, max, step, unit } = control;
    return this.renderSlider({ label, min, max, step, value, unit, onInput: (rawValue) => this.emitNumericValue(control.key, rawValue) });
  }

  renderControlSliders(controls, values) {
    return controls.map(control => this.renderControlSlider(control, values[control.key]));
  }

  renderSlider({ label, min, max, step, value, unit, onInput }) {
    return html`
      <div class="flex flex-col gap-1">
        <div class="flex items-center justify-between">
          <label class="text-xs font-medium text-slate-700 truncate">${label}</label>
          <div class="flex items-center gap-1">
            <input
              type="number"
              .value=${String(value)}
              min=${min}
              max=${max}
              step=${step}
              @input=${(event) => onInput(event.target.value)}
              class="w-16 px-1.5 py-0.5 text-right font-mono text-xs font-semibold bg-white border border-slate-200 rounded text-brand-700"
            />
            ${unit ? html`<span class="font-mono text-[11px] text-slate-400 w-5">${unit}</span>` : ''}
          </div>
        </div>
        <input
          type="range"
          class="studio-slider w-full"
          min=${min}
          max=${max}
          step=${step}
          .value=${String(value)}
          @input=${(event) => onInput(event.target.value)}
        />
      </div>
    `;
  }

  renderModeButton({ label, isActive, onSelect }) {
    return html`
      <button
        @click=${onSelect}
        class="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
          isActive ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }"
      >
        ${label}
      </button>
    `;
  }

  addPolygonVertex(points) {
    const nextPoints = cloneDeep(points);
    const lastVertex = nextPoints[nextPoints.length - 1] || NEW_POLYGON_VERTEX_FALLBACKS.last;
    const firstVertex = nextPoints[0] || NEW_POLYGON_VERTEX_FALLBACKS.first;
    nextPoints.push({
      x: Math.round((lastVertex.x + firstVertex.x) / 2),
      y: Math.round((lastVertex.y + firstVertex.y) / 2)
    });
    this.emitValueChanges({ points: nextPoints });
  }

  removePolygonVertex(points, index) {
    if (points.length <= MIN_POLYGON_VERTICES) return;
    this.emitValueChanges({ points: removeAt(points, index) });
  }

  updatePolygonVertex(points, index, axis, rawValue) {
    const nextPoints = cloneDeep(points);
    nextPoints[index][axis] = clampToRange(Number(rawValue), PERCENT_RANGE.min, PERCENT_RANGE.max);
    this.emitValueChanges({ points: nextPoints });
  }

  renderClipPathControls(values) {
    const points = values.points || [];
    const isPolygonMode = values.mode === 'polygon';

    return html`
      <div class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-1.5">
            ${CLIP_PATH_MODES.map(mode => this.renderModeButton({
              label: `${mode}()`,
              isActive: values.mode === mode,
              onSelect: () => this.emitValueChanges({ mode })
            }))}
          </div>

          ${isPolygonMode ? html`
            <button
              @click=${() => this.addPolygonVertex(points)}
              class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1 transition"
            >
              <i class="ph-bold ph-plus"></i>
              <span>Add Vertex (${points.length} pts)</span>
            </button>
          ` : ''}
        </div>

        ${isPolygonMode ? this.renderVertexList(points) : ''}
        ${this.renderClipShapeSliders(values)}
      </div>
    `;
  }

  renderVertexList(points) {
    const canRemoveVertex = points.length > MIN_POLYGON_VERTICES;
    return html`
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
        ${points.map((point, index) => html`
          <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
            <span class="w-6 h-6 rounded-full bg-brand-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
              ${index + 1}
            </span>
            <div class="flex items-center gap-2 flex-1">
              <label class="text-[10px] font-mono text-slate-500">X</label>
              <input
                type="number" min="0" max="100" .value=${String(point.x)}
                @input=${(event) => this.updatePolygonVertex(points, index, 'x', event.target.value)}
                class="w-14 px-1.5 py-1 text-xs font-mono font-semibold bg-white border border-slate-200 rounded text-center"
              />
              <label class="text-[10px] font-mono text-slate-500">Y</label>
              <input
                type="number" min="0" max="100" .value=${String(point.y)}
                @input=${(event) => this.updatePolygonVertex(points, index, 'y', event.target.value)}
                class="w-14 px-1.5 py-1 text-xs font-mono font-semibold bg-white border border-slate-200 rounded text-center"
              />
            </div>
            <button
              @click=${() => this.removePolygonVertex(points, index)}
              ?disabled=${!canRemoveVertex}
              class="text-slate-400 hover:text-rose-600 disabled:opacity-30 p-1"
              title="Remove Vertex"
            >
              <i class="ph-bold ph-trash"></i>
            </button>
          </div>
        `)}
      </div>
    `;
  }

  renderClipShapeSliders(values) {
    if (values.mode === 'circle' || values.mode === 'ellipse') {
      const radiusSliders = values.mode === 'circle' ? [CLIP_CIRCLE_RADIUS_SLIDER] : CLIP_ELLIPSE_RADIUS_SLIDERS;
      return html`
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          ${this.renderControlSliders([...radiusSliders, ...CLIP_CENTER_SLIDERS], values)}
        </div>
      `;
    }
    if (values.mode === 'inset') {
      return html`
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          ${this.renderControlSliders(CLIP_INSET_SLIDERS, values)}
        </div>
      `;
    }
    return '';
  }

  addShadowLayer(layers, isTextShadow) {
    const nextLayers = cloneDeep(layers);
    nextLayers.push(isTextShadow ? createTextShadowLayer(nextLayers.length) : createBoxShadowLayer(nextLayers.length));
    this.emitValueChanges({ layers: nextLayers, activeLayerIdx: nextLayers.length - 1 });
  }

  removeShadowLayer(layers, index, activeLayerIndex) {
    if (layers.length <= MIN_SHADOW_LAYERS) return;
    this.emitValueChanges({ layers: removeAt(layers, index), activeLayerIdx: Math.max(0, activeLayerIndex - 1) });
  }

  updateShadowLayer(layers, layerIndex, field, value) {
    const nextLayers = cloneDeep(layers);
    if (!nextLayers[layerIndex]) return;
    nextLayers[layerIndex][field] = value;
    this.emitValueChanges({ layers: nextLayers });
  }

  renderMultiShadowControls(values, isTextShadow = false) {
    const layers = values.layers || [];
    const activeLayerIndex = getActiveLayerIndex(layers, values.activeLayerIdx);
    const activeLayer = layers[activeLayerIndex] || layers[0];

    return html`
      <div class="space-y-4">
        ${isTextShadow ? this.renderPreviewTextInput(values.previewText) : ''}

        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-wrap items-center gap-1.5">
            ${layers.map((layer, index) => this.renderShadowLayerTab({ layers, layer, index, activeLayerIndex }))}
          </div>

          <button
            @click=${() => this.addShadowLayer(layers, isTextShadow)}
            class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1"
          >
            <i class="ph-bold ph-plus"></i>
            <span>Add Shadow Layer</span>
          </button>
        </div>

        ${activeLayer ? this.renderShadowLayerEditor({ layers, activeLayer, activeLayerIndex, isTextShadow }) : ''}
      </div>
    `;
  }

  renderPreviewTextInput(previewText) {
    return html`
      <div class="flex items-center gap-2">
        <label class="text-xs font-semibold text-slate-600 shrink-0">Preview Text:</label>
        <input
          type="text"
          .value=${previewText || DEFAULT_PREVIEW_TEXT}
          @input=${(event) => this.emitValueChanges({ previewText: event.target.value })}
          class="flex-1 px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
        />
      </div>
    `;
  }

  renderShadowLayerTab({ layers, layer, index, activeLayerIndex }) {
    return html`
      <div class="inline-flex items-center rounded-lg border ${
        index === activeLayerIndex ? 'bg-brand-600 text-white border-brand-600 shadow-sm' : 'bg-slate-100 text-slate-700 border-slate-200'
      }">
        <button
          @click=${() => this.emitValueChanges({ activeLayerIdx: index })}
          class="px-2.5 py-1 text-xs font-mono font-semibold flex items-center gap-1.5"
        >
          <span class="w-2.5 h-2.5 rounded-full border border-white/60" style="background:${layer.color}"></span>
          <span>Layer #${index + 1}</span>
        </button>
        ${layers.length > MIN_SHADOW_LAYERS ? html`
          <button
            @click=${() => this.removeShadowLayer(layers, index, activeLayerIndex)}
            class="pr-2 pl-1 text-[10px] opacity-75 hover:opacity-100"
            title="Remove Layer"
          >
            <i class="ph-bold ph-x"></i>
          </button>
        ` : ''}
      </div>
    `;
  }

  renderShadowLayerEditor({ layers, activeLayer, activeLayerIndex, isTextShadow }) {
    const updateActiveLayer = (field, value) => this.updateShadowLayer(layers, activeLayerIndex, field, value);
    const sliders = SHADOW_LAYER_SLIDERS.filter(slider => !isTextShadow || !slider.isBoxShadowOnly);

    return html`
      <div class="p-3 rounded-lg bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
        ${sliders.map(({ field, label, min, max, step, unit }) => this.renderSlider({
          label, min, max, step, unit,
          value: activeLayer[field],
          onInput: (rawValue) => updateActiveLayer(field, Number(rawValue))
        }))}

        <div class="flex items-center justify-between gap-2">
          <span class="text-xs font-medium text-slate-700">Layer Color</span>
          <div class="flex items-center gap-2">
            <input
              type="color"
              .value=${activeLayer.color || BOX_SHADOW_FALLBACK_COLOR.hex}
              @input=${(event) => updateActiveLayer('color', event.target.value)}
              class="w-8 h-7 rounded cursor-pointer border border-slate-300 bg-white"
            />
            <span class="font-mono text-xs text-slate-600">${activeLayer.color}</span>
          </div>
        </div>

        ${!isTextShadow ? html`
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-700">Inset (Inner Shadow)</span>
            <button
              @click=${() => updateActiveLayer('inset', !activeLayer.inset)}
              class="w-11 h-6 rounded-full transition relative ${activeLayer.inset ? 'bg-brand-600' : 'bg-slate-300'}"
            >
              <span class="w-4 h-4 rounded-full bg-white shadow absolute top-1 transition-all ${activeLayer.inset ? 'left-6' : 'left-1'}"></span>
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  addGradientStop(stops) {
    this.emitValueChanges({ stops: [...cloneDeep(stops), { ...NEW_GRADIENT_STOP }] });
  }

  removeGradientStop(stops, index) {
    if (stops.length <= MIN_GRADIENT_STOPS) return;
    this.emitValueChanges({ stops: removeAt(stops, index) });
  }

  updateGradientStop(stops, index, field, rawValue) {
    const nextStops = cloneDeep(stops);
    nextStops[index][field] = field === 'pos' ? Number(rawValue) : rawValue;
    this.emitValueChanges({ stops: nextStops });
  }

  renderMultiGradientControls(values) {
    const stops = values.stops || [];
    const gradientSliders = [
      ...(values.type !== 'radial' ? [GRADIENT_ANGLE_SLIDER] : []),
      ...(values.type !== 'linear' ? GRADIENT_CENTER_SLIDERS : [])
    ];

    return html`
      <div class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-1.5">
            ${GRADIENT_TYPES.map(type => this.renderModeButton({
              label: `${type}-gradient`,
              isActive: values.type === type,
              onSelect: () => this.emitValueChanges({ type })
            }))}
          </div>

          <div class="flex items-center gap-2">
            <button
              @click=${() => this.emitValueChanges({ repeating: !values.repeating })}
              class="px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium border transition ${
                values.repeating ? 'bg-indigo-50 border-brand-400 text-brand-700' : 'bg-white border-slate-200 text-slate-600'
              }"
            >
              repeating: ${values.repeating ? 'ON' : 'OFF'}
            </button>
            <button
              @click=${() => this.addGradientStop(stops)}
              class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1"
            >
              <i class="ph-bold ph-plus"></i>
              <span>Add Stop (${stops.length})</span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          ${this.renderControlSliders(gradientSliders, values)}
        </div>

        <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
          ${stops.map((stop, index) => this.renderGradientStopRow(stops, stop, index))}
        </div>
      </div>
    `;
  }

  renderGradientStopRow(stops, stop, index) {
    return html`
      <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-3">
        <span class="font-mono text-[11px] font-bold text-slate-500 w-6">#${index + 1}</span>
        <input
          type="color"
          .value=${stop.color}
          @input=${(event) => this.updateGradientStop(stops, index, 'color', event.target.value)}
          class="w-8 h-7 rounded cursor-pointer border border-slate-300 bg-white shrink-0"
        />
        <input
          type="range" min="0" max="100" step="1"
          .value=${String(stop.pos)}
          @input=${(event) => this.updateGradientStop(stops, index, 'pos', event.target.value)}
          class="studio-slider flex-1"
        />
        <span class="font-mono text-xs font-semibold text-brand-700 w-10 text-right">${stop.pos}%</span>
        <button
          @click=${() => this.removeGradientStop(stops, index)}
          ?disabled=${stops.length <= MIN_GRADIENT_STOPS}
          class="text-slate-400 hover:text-rose-600 disabled:opacity-30 p-1"
        >
          <i class="ph-bold ph-trash"></i>
        </button>
      </div>
    `;
  }

  addFlexItem(items) {
    const nextItems = cloneDeep(items);
    nextItems.push({ ...FALLBACK_FLEX_ITEM, label: `Item ${nextItems.length + 1}` });
    this.emitValueChanges({ items: nextItems, selectedIdx: nextItems.length - 1 });
  }

  removeFlexItem(items, selectedIndex) {
    if (items.length <= MIN_FLEX_ITEMS) return;
    this.emitValueChanges({ items: removeAt(items, selectedIndex), selectedIdx: Math.max(0, selectedIndex - 1) });
  }

  updateFlexItem(items, selectedIndex, field, rawValue) {
    const nextItems = cloneDeep(items);
    if (!nextItems[selectedIndex]) return;
    nextItems[selectedIndex][field] = field === 'label' ? rawValue : Number(rawValue);
    this.emitValueChanges({ items: nextItems });
  }

  renderFlexBuilderControls(values) {
    const items = values.items || [];
    const selectedIndex = clampToRange(values.selectedIdx || 0, 0, items.length - 1);
    const selectedItem = items[selectedIndex] || FALLBACK_FLEX_ITEM;
    const itemNumber = selectedIndex + 1;
    const updateSelectedItem = (field) => (rawValue) => this.updateFlexItem(items, selectedIndex, field, rawValue);

    return html`
      <div class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <button @click=${() => this.addFlexItem(items)} class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1">
              <i class="ph-bold ph-plus"></i><span>Add Flex Item (${items.length})</span>
            </button>
            <button @click=${() => this.removeFlexItem(items, selectedIndex)} ?disabled=${items.length <= MIN_FLEX_ITEMS} class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 disabled:opacity-40">
              Remove Selected #${itemNumber}
            </button>
          </div>

          ${this.renderFlexContainerOptions(values)}
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          ${this.renderControlSliders(FLEX_CONTAINER_SLIDERS, values)}
        </div>

        <div class="p-3 rounded-lg bg-brand-50/50 border border-brand-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
          ${this.renderSlider({ label: `#${itemNumber} flex-grow`, min: 0, max: 6, step: 1, value: selectedItem.grow, unit: '', onInput: updateSelectedItem('grow') })}
          ${this.renderSlider({ label: `#${itemNumber} flex-shrink`, min: 0, max: 5, step: 1, value: selectedItem.shrink, unit: '', onInput: updateSelectedItem('shrink') })}
          ${this.renderSlider({ label: `#${itemNumber} flex-basis`, min: 40, max: 220, step: 5, value: selectedItem.basis, unit: 'px', onInput: updateSelectedItem('basis') })}
        </div>
      </div>
    `;
  }

  renderFlexContainerOptions(values) {
    return html`
      <div class="flex items-center gap-1.5">
        ${FLEX_JUSTIFY_OPTIONS.map(justify => html`
          <button
            @click=${() => this.emitValueChanges({ justify })}
            class="px-2 py-1 rounded text-[10px] font-mono font-semibold ${values.justify === justify ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}"
          >${justify}</button>
        `)}
        <button
          @click=${() => this.emitValueChanges({ wrap: values.wrap === 'wrap' ? 'nowrap' : 'wrap' })}
          class="px-2 py-1 rounded text-[10px] font-mono font-semibold ${values.wrap === 'wrap' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}"
        >${values.wrap}</button>
      </div>
    `;
  }

  addGridColumn(columns) {
    if (columns.length >= MAX_GRID_COLUMNS) return;
    this.emitValueChanges({ cols: [...columns, 1] });
  }

  removeGridColumn(columns) {
    if (columns.length <= MIN_GRID_COLUMNS) return;
    this.emitValueChanges({ cols: columns.slice(0, -1) });
  }

  updateGridColumn(columns, index, rawValue) {
    const nextColumns = [...columns];
    nextColumns[index] = Number(rawValue);
    this.emitValueChanges({ cols: nextColumns });
  }

  addGridCell(cells) {
    const nextCells = cloneDeep(cells);
    nextCells.push({ name: `Cell #${nextCells.length + 1}`, colSpan: 1, rowSpan: 1 });
    this.emitValueChanges({ cells: nextCells, selectedCellIdx: nextCells.length - 1 });
  }

  removeGridCell(cells, selectedIndex) {
    if (cells.length <= MIN_GRID_CELLS) return;
    this.emitValueChanges({ cells: removeAt(cells, selectedIndex), selectedCellIdx: Math.max(0, selectedIndex - 1) });
  }

  updateGridCellSpan(cells, selectedIndex, field, rawValue) {
    const nextCells = cloneDeep(cells);
    if (!nextCells[selectedIndex]) return;
    nextCells[selectedIndex][field] = Number(rawValue);
    this.emitValueChanges({ cells: nextCells });
  }

  renderGridBuilderControls(values) {
    const columns = values.cols || FALLBACK_GRID_COLUMNS;
    const cells = values.cells || [];
    const selectedIndex = clampToRange(values.selectedCellIdx || 0, 0, cells.length - 1);
    const selectedCell = cells[selectedIndex] || FALLBACK_GRID_CELL;
    const updateSelectedSpan = (field) => (rawValue) => this.updateGridCellSpan(cells, selectedIndex, field, rawValue);

    return html`
      <div class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-1.5">
            <button @click=${() => this.addGridColumn(columns)} class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 text-white">+ Column (${columns.length})</button>
            <button @click=${() => this.removeGridColumn(columns)} ?disabled=${columns.length <= MIN_GRID_COLUMNS} class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 disabled:opacity-40">- Column</button>
            <button @click=${() => this.addGridCell(cells)} class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white">+ Cell (${cells.length})</button>
            <button @click=${() => this.removeGridCell(cells, selectedIndex)} ?disabled=${cells.length <= MIN_GRID_CELLS} class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 disabled:opacity-40">- Cell</button>
          </div>
          <button
            @click=${() => this.emitValueChanges({ dense: !values.dense })}
            class="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border ${values.dense ? 'bg-indigo-50 border-brand-400 text-brand-700' : 'bg-white border-slate-200 text-slate-600'}"
          >
            dense: ${values.dense ? 'ON' : 'OFF'}
          </button>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          ${columns.map((fraction, index) => this.renderSlider({
            label: `Col #${index + 1} (fr)`, min: 0.5, max: 4, step: 0.5, value: fraction, unit: 'fr',
            onInput: (rawValue) => this.updateGridColumn(columns, index, rawValue)
          }))}
        </div>

        <div class="p-3 rounded-lg bg-brand-50/50 border border-brand-200 grid grid-cols-1 sm:grid-cols-4 gap-3">
          ${this.renderSlider({ label: `${selectedCell.name} col-span`, min: 1, max: columns.length, step: 1, value: selectedCell.colSpan, unit: '', onInput: updateSelectedSpan('colSpan') })}
          ${this.renderSlider({ label: `${selectedCell.name} row-span`, min: 1, max: MAX_GRID_ROW_SPAN, step: 1, value: selectedCell.rowSpan, unit: '', onInput: updateSelectedSpan('rowSpan') })}
          ${this.renderControlSliders(GRID_GAP_SLIDERS, values)}
        </div>
      </div>
    `;
  }
}
customElements.define('control-panel', ControlPanel);
