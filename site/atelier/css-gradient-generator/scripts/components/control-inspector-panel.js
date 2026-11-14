// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { html, nothing } from 'lit';
import { ColorMath } from '../color/color-math.js';
import { OpenStudioElement } from './open-studio-element.js';
import { DEFAULT_BOUNDARY_SHAPE, PERCENT, POLYGON_SIDES } from '../config/constants.js';
import { BOUNDARY_SHAPES, CONTROL_DEFAULTS, INTERACTION_MODES } from '../data/field-options.js';
import { findInteractionMode, resolveInteractionModeId } from '../geometry/boundary-geometry.js';
import { renderPanelSection } from '../ui/panel-parts.js';
import { wrapDegrees } from '../utils/angle-math.js';

const QUICK_SNAP_POSITIONS = [
  { label: 'TL', x: 20, y: 22 },
  { label: 'TR', x: 80, y: 22 },
  { label: 'Center', x: 50, y: 50 },
  { label: 'BL', x: 20, y: 78 },
  { label: 'BR', x: 80, y: 78 }
];

const ANGLE_SHORTCUTS_DEG = [0, 45, 90, 135, 225];

const POLYGON_SIDE_OPTIONS = [
  { sides: 3, label: '3 Tri' },
  { sides: 4, label: '4 Dia' },
  { sides: 5, label: '5 Pent' },
  { sides: 6, label: '6 Hex' },
  { sides: 8, label: '8 Oct' }
];

class ControlInspectorPanel extends OpenStudioElement {
  static properties = {
    control: { type: Object },
    activeColorTarget: { type: String, state: true }
  };

  constructor() {
    super();
    this.activeColorTarget = 'core';
  }

  _isEditingRim() {
    return this.activeColorTarget === 'rim' && this.control.useSecondaryColor;
  }

  _updateControl(patch) {
    if (!this.control) return;
    this._emit('control-update', { id: this.control.id, patch });
  }

  _updateEditedColor(hex) {
    this._updateControl(this._isEditingRim() ? { secondaryColor: hex } : { color: hex });
  }

  _updateEditedAlpha(alpha) {
    this._updateControl(this._isEditingRim() ? { secondaryAlpha: alpha } : { alpha });
  }

  _updateOklchChannel(channel, value) {
    if (!this.control) return;
    const currentOklch = ColorMath.hexToOklch(this._editedHex());
    this._updateEditedColor(ColorMath.oklchToHex({ ...currentOklch, [channel]: Number(value) }));
  }

  _editedHex() {
    return this._isEditingRim() ? (this.control.secondaryColor || this.control.color) : this.control.color;
  }

  _toggleSecondaryColor(event) {
    this._updateControl({ useSecondaryColor: event.target.checked });
    if (!event.target.checked) this.activeColorTarget = 'core';
  }

  render() {
    const control = this.control;
    if (!control) return nothing;

    return html`
      ${this._renderPositionCard(control)}
      ${this._renderBoundaryCard(control)}
      ${this._renderColorCard(control)}
      ${this._renderEasingCard(control)}
    `;
  }

  _renderPositionCard(control) {
    return html`
        ${renderPanelSection({
          icon: 'ph-crosshair',
          title: 'Spatial Position & Angle',
          trailing: html`
            <span class="text-[11px] font-mono font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md truncate max-w-[120px]">
              ${control.name}
            </span>
          `,
          body: this._renderPositionBody(control)
        })}
    `;
  }

  _renderPositionBody(control) {
    return html`
          <div class="grid grid-cols-2 gap-2">
            ${this._renderPositionAxis(control, 'x', 'Position X (%)')}
            ${this._renderPositionAxis(control, 'y', 'Position Y (%)')}
          </div>

          <div class="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <span class="text-[11px] font-medium text-slate-500">Quick Snap:</span>
            <div class="flex flex-wrap items-center gap-1">
              ${QUICK_SNAP_POSITIONS.map(snap => html`
                <button
                  type="button"
                  @click=${() => this._updateControl({ x: snap.x, y: snap.y })}
                  class="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200/80"
                >
                  ${snap.label}
                </button>
              `)}
            </div>
          </div>

          ${this._renderAngleControls(control)}
    `;
  }

  _renderPositionAxis(control, axis, label) {
    const value = String(control[axis] ?? CONTROL_DEFAULTS[axis]);
    return html`
            <div class="min-w-0 p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <div class="flex items-center justify-between gap-1.5">
                <span class="min-w-0 text-[11px] font-semibold text-slate-600 leading-tight">${label}</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  .value=${value}
                  @input=${(event) => this._updateControl({ [axis]: ColorMath.clamp(Number(event.target.value), 0, 100) })}
                  class="w-12 shrink-0 text-xs font-mono font-bold text-right bg-white border border-slate-200 rounded-md px-1.5 py-0.5 text-slate-900"
                />
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                .value=${value}
                @input=${(event) => this._updateControl({ [axis]: Number(event.target.value) })}
                class="studio-slider w-full"
              />
            </div>
    `;
  }

  _renderAngleControls(control) {
    const angleValue = String(control.angle ?? CONTROL_DEFAULTS.angle);
    return html`
          <div class="space-y-1.5 pt-2 border-t border-slate-100">
            <div class="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 text-xs">
              <span class="whitespace-nowrap font-medium text-slate-600">Emitter Axis Angle</span>
              <div class="flex flex-wrap items-center gap-1">
                ${ANGLE_SHORTCUTS_DEG.map(angleDeg => html`
                  <button
                    type="button"
                    @click=${() => this._updateControl({ angle: angleDeg })}
                    class="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700"
                  >${angleDeg}°</button>
                `)}
                <input
                  type="number"
                  min="0"
                  max="360"
                  .value=${angleValue}
                  @input=${(event) => this._updateControl({ angle: wrapDegrees(Number(event.target.value)) })}
                  class="w-14 text-xs font-mono font-bold text-right bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-indigo-700 ml-1"
                />
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              .value=${angleValue}
              @input=${(event) => this._updateControl({ angle: Number(event.target.value) })}
              class="studio-slider w-full"
            />
          </div>
    `;
  }

  _renderBoundaryCard(control) {
    return html`
        ${renderPanelSection({
          icon: 'ph-bounding-box',
          title: 'Influence Region & Boundary Interaction',
          body: this._renderBoundaryBody(control)
        })}
    `;
  }

  _renderBoundaryBody(control) {
    return html`
          ${this._renderShapePicker(control)}

          <div class="space-y-2.5 pt-2 border-t border-slate-100">
            <div class="grid grid-cols-2 gap-2.5">
              <div class="space-y-1">
                <div class="flex justify-between text-[11px]">
                  <span class="text-slate-600 font-medium">Boundary Reach</span>
                  <span class="font-mono font-semibold text-slate-800">${control.radius ?? CONTROL_DEFAULTS.radius}%</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="130"
                  step="1"
                  .value=${String(control.radius ?? CONTROL_DEFAULTS.radius)}
                  @input=${(event) => this._updateControl({ radius: Number(event.target.value) })}
                  class="studio-slider w-full"
                />
              </div>

              <div class="space-y-1">
                <div class="flex justify-between text-[11px]">
                  <span class="text-slate-600 font-medium">Core Plateau</span>
                  <span class="font-mono font-semibold text-slate-800">${control.hardness ?? CONTROL_DEFAULTS.hardness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="75"
                  step="1"
                  .value=${String(control.hardness ?? CONTROL_DEFAULTS.hardness)}
                  @input=${(event) => this._updateControl({ hardness: Number(event.target.value) })}
                  class="studio-slider w-full"
                />
              </div>
            </div>

            ${this._renderShapeSpecificControls(control)}
          </div>

          ${this._renderInteractionModePicker(control)}
    `;
  }

  _renderShapePicker(control) {
    const selectedShape = control.boundaryShape || DEFAULT_BOUNDARY_SHAPE;
    return html`
          <div>
            <label class="block text-[11px] font-medium text-slate-600 mb-1.5">Influence Boundary Shape</label>
            <div class="grid grid-cols-2 gap-1.5">
              ${BOUNDARY_SHAPES.map(shape => {
                const isActive = selectedShape === shape.id;
                return html`
                  <button
                    type="button"
                    @click=${() => this._updateControl({ boundaryShape: shape.id })}
                    class="p-2 rounded-lg border text-left transition-all flex items-center gap-2 ${
                      isActive
                        ? 'bg-indigo-50/80 border-indigo-500 text-indigo-800'
                        : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }"
                    title=${shape.description}
                  >
                    <i class="ph-duotone ${shape.icon} text-base ${isActive ? 'text-indigo-600' : 'text-slate-500'}"></i>
                    <div class="min-w-0">
                      <div class="text-[11px] font-semibold truncate">${shape.label}</div>
                    </div>
                  </button>
                `;
              })}
            </div>
          </div>
    `;
  }

  _renderShapeSpecificControls(control) {
    switch (control.boundaryShape) {
      case 'ellipse-beam': return this._renderBeamControls(control);
      case 'rect-box': return this._renderBoxControls(control);
      case 'polygon': return this._renderPolygonControls(control);
      case 'ring-torus': return this._renderRingControls(control);
      case 'conic-wedge': return this._renderConicControls(control);
      default: return nothing;
    }
  }

  _renderBeamControls(control) {
    const aspectRatio = control.aspectRatio ?? CONTROL_DEFAULTS.aspectRatio;
    return html`
              <div class="space-y-1">
                <div class="flex justify-between text-xs">
                  <span class="text-slate-600">Beam Anisotropy (Aspect Stretch)</span>
                  <span class="font-mono text-slate-800">${Number(aspectRatio).toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.2"
                  step="0.1"
                  .value=${String(aspectRatio)}
                  @input=${(event) => this._updateControl({ aspectRatio: Number(event.target.value) })}
                  class="studio-slider w-full"
                />
              </div>
    `;
  }

  _renderBoxControls(control) {
    const aspectRatio = control.aspectRatio ?? CONTROL_DEFAULTS.aspectRatio;
    const boxCrispness = control.boxCrispness ?? CONTROL_DEFAULTS.boxCrispness;
    return html`
              <div class="space-y-2.5 pt-1">
                <div class="space-y-1">
                  <div class="flex justify-between text-xs">
                    <span class="text-slate-600 font-medium">Rectangle Aspect (Width : Height)</span>
                    <span class="font-mono font-semibold text-indigo-700">${Number(aspectRatio).toFixed(1)} : 1</span>
                  </div>
                  <input
                    type="range"
                    min="0.4"
                    max="3.4"
                    step="0.1"
                    .value=${String(aspectRatio)}
                    @input=${(event) => this._updateControl({ aspectRatio: Number(event.target.value) })}
                    class="studio-slider w-full"
                  />
                </div>

                <div class="space-y-1">
                  <div class="flex justify-between text-xs">
                    <span class="text-slate-600 font-medium">Box Corner Definition</span>
                    <span class="font-mono font-semibold text-slate-800">${boxCrispness}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="2"
                    .value=${String(boxCrispness)}
                    @input=${(event) => this._updateControl({ boxCrispness: Number(event.target.value) })}
                    class="studio-slider w-full"
                  />
                </div>
              </div>
    `;
  }

  _renderPolygonControls(control) {
    const selectedSides = control.polygonSides || POLYGON_SIDES.default;
    const polygonSharpness = control.polygonSharpness ?? CONTROL_DEFAULTS.polygonSharpness;
    return html`
              <div class="space-y-2.5 pt-1">
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-slate-600 font-medium">Polygon Geometry (Sides)</span>
                    <span class="font-mono font-semibold text-indigo-700">${selectedSides}-gon</span>
                  </div>
                  <div class="grid grid-cols-5 gap-1">
                    ${POLYGON_SIDE_OPTIONS.map(option => html`
                      <button
                        type="button"
                        @click=${() => this._updateControl({ polygonSides: option.sides })}
                        class="py-1 px-1 rounded-lg text-[10px] font-mono font-semibold border transition-all ${
                          selectedSides === option.sides
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }"
                      >
                        ${option.label}
                      </button>
                    `)}
                  </div>
                </div>

                <div class="space-y-1">
                  <div class="flex justify-between text-xs">
                    <span class="text-slate-600 font-medium">Vertex Corner Definition</span>
                    <span class="font-mono font-semibold text-slate-800">${polygonSharpness}%</span>
                  </div>
                  <input
                    type="range"
                    min="25"
                    max="100"
                    step="2"
                    .value=${String(polygonSharpness)}
                    @input=${(event) => this._updateControl({ polygonSharpness: Number(event.target.value) })}
                    class="studio-slider w-full"
                  />
                </div>
              </div>
    `;
  }

  _renderRingControls(control) {
    const innerRadius = control.innerRadius ?? CONTROL_DEFAULTS.innerRadius;
    return html`
              <div class="space-y-1">
                <div class="flex justify-between text-xs">
                  <span class="text-slate-600">Ring Peak Diameter Ratio</span>
                  <span class="font-mono text-slate-800">${innerRadius}%</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="75"
                  step="1"
                  .value=${String(innerRadius)}
                  @input=${(event) => this._updateControl({ innerRadius: Number(event.target.value) })}
                  class="studio-slider w-full"
                />
              </div>
    `;
  }

  _renderConicControls(control) {
    const sectorSpread = control.sectorSpread ?? CONTROL_DEFAULTS.sectorSpread;
    return html`
              <div class="space-y-1">
                <div class="flex justify-between text-xs">
                  <span class="text-slate-600">Angular Sector Spread</span>
                  <span class="font-mono text-slate-800">${sectorSpread}°</span>
                </div>
                <input
                  type="range"
                  min="35"
                  max="360"
                  step="5"
                  .value=${String(sectorSpread)}
                  @input=${(event) => this._updateControl({ sectorSpread: Number(event.target.value) })}
                  class="studio-slider w-full"
                />
              </div>
    `;
  }

  _renderInteractionModePicker(control) {
    const selectedModeId = resolveInteractionModeId(control);
    return html`
          <div class="space-y-1.5 pt-2 border-t border-slate-100">
            <label class="block text-[11px] font-semibold text-slate-700">
              Neighbor Boundary Interaction Mode
            </label>
            <select
              .value=${selectedModeId}
              @change=${(event) => this._updateControl({ interactionMode: event.target.value })}
              class="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              ${INTERACTION_MODES.map(mode => html`
                <option value=${mode.id} ?selected=${selectedModeId === mode.id}>
                  ${mode.label} — [${mode.badge}]
                </option>
              `)}
            </select>
            <p class="text-[10px] text-slate-500 leading-relaxed">
              ${(findInteractionMode(selectedModeId) || {}).description}
            </p>
          </div>
    `;
  }

  _renderColorCard(control) {
    return html`
        ${renderPanelSection({
          icon: 'ph-palette',
          title: 'Control Gradient Colors',
          trailing: this._renderSecondaryColorToggle(control),
          body: html`
            ${control.useSecondaryColor ? this._renderColorTargetSwitch(control) : nothing}
            ${this._renderHexInputs(control)}
            ${this._renderOklchSliders()}
          `
        })}
    `;
  }

  _renderSecondaryColorToggle(control) {
    return html`
            <label class="shrink-0 whitespace-nowrap flex items-center gap-1.5 text-[11px] font-medium text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                .checked=${Boolean(control.useSecondaryColor)}
                @change=${(event) => this._toggleSecondaryColor(event)}
                class="rounded text-indigo-600"
              />
              <span>Dual Core→Rim</span>
            </label>
    `;
  }

  _renderColorTargetSwitch(control) {
    return html`
            <div class="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
              ${this._renderColorTargetButton('core', control.color, 'Core Center')}
              ${this._renderColorTargetButton('rim', control.secondaryColor || control.color, 'Boundary Rim')}
            </div>
    `;
  }

  _renderColorTargetButton(target, swatchHex, label) {
    return html`
              <button
                type="button"
                @click=${() => { this.activeColorTarget = target; }}
                class="py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  this.activeColorTarget === target
                    ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                    : 'text-slate-600'
                }"
              >
                <span class="w-3 h-3 rounded-full border border-black/15" style="background:${swatchHex}"></span>
                <span>${label}</span>
              </button>
    `;
  }

  _renderHexInputs(control) {
    const editedHex = this._editedHex();
    return html`
          <div class="grid grid-cols-12 gap-2 items-center">
            <div class="col-span-7 flex items-center gap-2">
              <input
                type="color"
                .value=${editedHex}
                @input=${(event) => this._updateEditedColor(event.target.value.toUpperCase())}
                class="w-9 h-9 rounded-lg cursor-pointer border border-slate-200 shrink-0 shadow-sm"
              />
              <input
                type="text"
                .value=${editedHex}
                @change=${(event) => this._updateEditedColor(event.target.value.toUpperCase())}
                class="w-full text-xs font-mono font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
              />
            </div>

            <div class="col-span-5">
              <label class="block text-[10px] text-slate-500">Midpoint Speed</label>
              <input
                type="number"
                min="10"
                max="90"
                .value=${String(Math.round((control.midpoint ?? CONTROL_DEFAULTS.midpoint) * PERCENT))}
                @input=${(event) => this._updateControl({ midpoint: ColorMath.clamp(Number(event.target.value) / PERCENT, 0.1, 0.9) })}
                class="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800"
              />
            </div>
          </div>
    `;
  }

  _renderOklchSliders() {
    const isRim = this._isEditingRim();
    const oklch = ColorMath.hexToOklch(this._editedHex());
    const editedAlpha = isRim
      ? (this.control.secondaryAlpha ?? CONTROL_DEFAULTS.secondaryAlpha)
      : (this.control.alpha ?? CONTROL_DEFAULTS.alpha);

    return html`
          <div class="space-y-2.5 pt-2 border-t border-slate-100">
            <div class="space-y-1">
              <div class="flex justify-between text-xs">
                <span class="text-slate-600 font-medium">Perceptual Lightness (L)</span>
                <span class="font-mono text-slate-800">${Math.round(oklch.L * PERCENT)}%</span>
              </div>
              <input
                type="range"
                min="0.04"
                max="0.97"
                step="0.01"
                .value=${String(oklch.L.toFixed(2))}
                @input=${(event) => this._updateOklchChannel('L', event.target.value)}
                class="studio-slider w-full"
              />
            </div>

            <div class="space-y-1">
              <div class="flex justify-between text-xs">
                <span class="text-slate-600 font-medium">Chroma Saturation (C)</span>
                <span class="font-mono text-slate-800">${oklch.C.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.32"
                step="0.005"
                .value=${String(oklch.C.toFixed(3))}
                @input=${(event) => this._updateOklchChannel('C', event.target.value)}
                class="studio-slider w-full"
              />
            </div>

            <div class="space-y-1">
              <div class="flex justify-between text-xs">
                <span class="text-slate-600 font-medium">Hue Angle (H)</span>
                <span class="font-mono text-slate-800">${Math.round(oklch.h)}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                .value=${String(Math.round(oklch.h))}
                @input=${(event) => this._updateOklchChannel('h', event.target.value)}
                class="studio-slider w-full"
                style="background: linear-gradient(90deg, #ef4444, #eab308, #22c55e, #06b6d4, #6366f1, #ec4899, #ef4444)"
              />
            </div>

            <div class="space-y-1">
              <div class="flex justify-between text-xs">
                <span class="text-slate-600 font-medium">${isRim ? 'Boundary Rim Opacity' : 'Core Peak Opacity'}</span>
                <span class="font-mono text-slate-800">${Math.round(editedAlpha * PERCENT)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.02"
                .value=${String(editedAlpha)}
                @input=${(event) => this._updateEditedAlpha(Number(event.target.value))}
                class="studio-slider w-full"
              />
            </div>
          </div>
    `;
  }

  _renderEasingCard(control) {
    return html`
        ${renderPanelSection({
          icon: 'ph-bezier-curve',
          title: 'Boundary Falloff Easing Curve',
          body: html`
            <bezier-curve-editor
              class="block"
              .easing=${control.easing}
              @easing-change=${(event) => this._updateControl({ easing: event.detail.easing })}
            ></bezier-curve-editor>
          `
        })}
    `;
  }
}
customElements.define('control-inspector-panel', ControlInspectorPanel);
