// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { html, nothing } from 'lit';
import { OpenStudioElement } from './open-studio-element.js';
import { DEFAULT_BOUNDARY_SHAPE } from '../config/constants.js';
import { ARRANGE_PATTERNS, BOUNDARY_SHAPES, CONTROL_DEFAULTS, INTERACTION_MODES, NODE_COORDINATE_FIELDS } from '../data/field-options.js';
import { findBoundaryShape, findInteractionMode, resolveRimHex } from '../geometry/boundary-geometry.js';
import { renderPanelSection } from '../ui/panel-parts.js';

class ControlNodesPanel extends OpenStudioElement {
  static properties = {
    controls: { type: Array },
    selectedControlId: { type: String },
    presets: { type: Array }
  };

  _selectControl(id) {
    this._emit('control-select', { id });
  }

  _updateControl(id, patch, event) {
    if (event) event.stopPropagation();
    this._emit('control-update', { id, patch });
  }

  _addControl(boundaryShape = DEFAULT_BOUNDARY_SHAPE) {
    this._emit('control-add', { boundaryShape });
  }

  _duplicateControl(id, event) {
    event.stopPropagation();
    this._emit('control-duplicate', { id });
  }

  _deleteControl(id, event) {
    event.stopPropagation();
    this._emit('control-delete', { id });
  }

  _moveControl(index, direction, event) {
    event.stopPropagation();
    this._emit('control-reorder', { index, direction });
  }

  _arrangeControls(pattern) {
    this._emit('controls-arrange', { pattern });
  }

  _loadPreset(presetId) {
    this._emit('preset-select', { presetId });
  }

  render() {
    return html`
      ${this._renderPresetGrid()}
      ${this._renderControlPointsCard()}
    `;
  }

  _renderPresetGrid() {
    return html`
        ${renderPanelSection({
          icon: 'ph-sparkle',
          title: 'Studio Field Presets',
          body: this._renderPresetButtons()
        })}
    `;
  }

  _renderPresetButtons() {
    return html`
          <div class="grid grid-cols-2 gap-1.5">
            ${(this.presets || []).map(preset => html`
              <button
                type="button"
                @click=${() => this._loadPreset(preset.id)}
                title=${preset.name}
                class="min-w-0 px-2 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/40 text-left transition-all group"
              >
                <div class="text-xs font-semibold text-slate-800 group-hover:text-indigo-700 truncate">${preset.name}</div>
                <div class="text-[10px] font-mono text-slate-500 truncate">${preset.tag}</div>
              </button>
            `)}
          </div>
    `;
  }

  _renderControlPointsCard() {
    const controls = this.controls || [];
    return html`
        ${renderPanelSection({
          icon: 'ph-map-pin-line',
          title: `Canvas Control Points (${controls.length})`,
          hint: 'All controls interact on the single canvas',
          trailing: this._renderAddPointButton(),
          body: html`
            ${this._renderArrangeBar()}
            <div class="space-y-2">
              ${controls.map((control, index) => this._renderControlCard(control, index))}
            </div>
          `
        })}
    `;
  }

  _renderAddPointButton() {
    return html`
            <button
              type="button"
              @click=${() => this._addControl(DEFAULT_BOUNDARY_SHAPE)}
              class="shrink-0 whitespace-nowrap px-2 py-1 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 transition-colors"
            >
              <i class="ph-bold ph-plus"></i> Add Point
            </button>
    `;
  }

  _renderArrangeBar() {
    return html`
          <div class="flex items-start gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
            <span class="shrink-0 py-1 text-[10px] font-medium text-slate-500 pl-1">Arrange:</span>
            <div class="flex flex-1 min-w-0 flex-wrap items-center gap-1">
              ${ARRANGE_PATTERNS.map(pattern => html`
                <button
                  type="button"
                  @click=${() => this._arrangeControls(pattern.id)}
                  class="px-1.5 py-1 rounded-lg text-[10px] font-medium bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200/80 transition-colors flex items-center gap-0.5"
                  title="Distribute all control points in a ${pattern.label} pattern"
                >
                  <i class="ph-bold ${pattern.icon}"></i>
                  <span>${pattern.label}</span>
                </button>
              `)}
            </div>
          </div>
    `;
  }

  _renderControlCard(control, index) {
    const isSelected = control.id === this.selectedControlId;
    const shapeMeta = findBoundaryShape(control.boundaryShape) || BOUNDARY_SHAPES[0];
    const interactionMeta = findInteractionMode(control.interactionMode) || INTERACTION_MODES[0];

    return html`
                <div
                  @click=${() => this._selectControl(control.id)}
                  class="p-2.5 rounded-lg border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-indigo-50/55 border-indigo-500 ring-1 ring-indigo-500/30'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }"
                >
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex flex-1 items-center gap-2 min-w-0">
                      <span class="w-5 h-5 rounded-full text-[10px] font-mono font-bold flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                      }">
                        P${index + 1}
                      </span>

                      <div
                        class="w-6 h-6 rounded-lg border border-black/15 shrink-0 shadow-inner"
                        style="background: linear-gradient(135deg, ${control.color} 40%, ${resolveRimHex(control)} 100%)"
                      ></div>

                      <div class="flex-1 min-w-0">
                        <input
                          type="text"
                          .value=${control.name}
                          @click=${(event) => event.stopPropagation()}
                          @input=${(event) => this._updateControl(control.id, { name: event.target.value })}
                          class="text-xs font-semibold text-slate-800 bg-transparent border-b border-transparent focus:border-indigo-400 focus:outline-none w-full truncate"
                        />
                        <div class="flex items-center gap-1.5 min-w-0 whitespace-nowrap text-[10px] font-mono text-slate-500">
                          <span class="truncate text-indigo-600 font-medium" title="${shapeMeta.label}">${shapeMeta.label}</span>
                          <span class="shrink-0">•</span>
                          <span class="truncate" title="${interactionMeta.badge}">${interactionMeta.badge}</span>
                        </div>
                      </div>
                    </div>

                    ${this._renderControlCardActions(control, index)}
                  </div>

                  <div class="grid grid-cols-4 gap-1.5 pt-1.5 border-t border-slate-200/70" @click=${(event) => event.stopPropagation()}>
                    ${NODE_COORDINATE_FIELDS.map(coordinate => this._renderCoordinateField(control, coordinate))}
                  </div>
                </div>
    `;
  }

  _renderControlCardActions(control, index) {
    const isVisible = control.visible !== false;
    return html`
                    <div class="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        @click=${(event) => this._updateControl(control.id, { visible: control.visible === false }, event)}
                        class="p-1 text-slate-400 hover:text-slate-700"
                        title="Toggle Point Visibility"
                      >
                        <i class="ph-bold ${isVisible ? 'ph-eye text-indigo-600' : 'ph-eye-slash text-slate-400'} text-xs"></i>
                      </button>
                      <button
                        type="button"
                        ?disabled=${index === 0}
                        @click=${(event) => this._moveControl(index, -1, event)}
                        class="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        title="Move Priority Up"
                      >
                        <i class="ph-bold ph-caret-up text-xs"></i>
                      </button>
                      <button
                        type="button"
                        ?disabled=${index === this.controls.length - 1}
                        @click=${(event) => this._moveControl(index, 1, event)}
                        class="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        title="Move Priority Down"
                      >
                        <i class="ph-bold ph-caret-down text-xs"></i>
                      </button>
                      <button
                        type="button"
                        @click=${(event) => this._duplicateControl(control.id, event)}
                        class="p-1 text-slate-400 hover:text-indigo-600"
                        title="Clone Control Point"
                      >
                        <i class="ph-bold ph-copy text-xs"></i>
                      </button>
                      ${this.controls.length > 1 ? html`
                        <button
                          type="button"
                          @click=${(event) => this._deleteControl(control.id, event)}
                          class="p-1 text-slate-400 hover:text-rose-600"
                          title="Remove Control Point"
                        >
                          <i class="ph-bold ph-trash text-xs"></i>
                        </button>
                      ` : nothing}
                    </div>
    `;
  }

  _renderCoordinateField(control, { label, field, title, min, max, valueClass, toValue }) {
    return html`
                    <label class="min-w-0 flex items-center justify-between gap-0.5 bg-white border border-slate-200 rounded-md px-1.5 py-0.5 text-[10px] font-mono" title=${title ?? nothing}>
                      <span class="shrink-0 text-slate-400">${label}</span>
                      <input
                        type="number"
                        min=${min}
                        max=${max}
                        .value=${String(control[field] ?? CONTROL_DEFAULTS[field])}
                        @input=${(event) => this._updateControl(control.id, { [field]: toValue(Number(event.target.value)) })}
                        class="w-full min-w-0 max-w-[2.25rem] text-right font-semibold ${valueClass} focus:outline-none bg-transparent"
                      />
                    </label>
    `;
  }
}
customElements.define('control-nodes-panel', ControlNodesPanel);
