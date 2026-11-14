// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { html } from 'lit';
import { KinetixLightDomElement } from './kinetix-light-dom-element.js';
import { EASING_PRESETS } from '../data/animation-presets.js';

const CURVE_PLOT_AREA = { leftPx: 16, widthPx: 108, bottomPx: 94, heightPx: 68 };

class KinetixBezierCurve extends KinetixLightDomElement {
  static properties = {
    easing: { type: String }
  };

  render() {
    const preset = EASING_PRESETS.find((easingPreset) => easingPreset.value === this.easing) || EASING_PRESETS[0];
    const [x1, y1, x2, y2] = preset.points;

    const start = toCurvePlotPoint(0, 0);
    const end = toCurvePlotPoint(1, 1);
    const firstControl = toCurvePlotPoint(x1, y1);
    const secondControl = toCurvePlotPoint(x2, y2);

    return html`
      <div class="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center gap-3">
        <svg viewBox="0 0 140 110" class="w-24 sm:w-28 h-20 shrink-0 bg-white rounded-lg border border-slate-200/80 shadow-inner">
          <line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="#E2E8F0" stroke-width="1.5" stroke-dasharray="3 3" />
          <line x1="${start.x}" y1="${start.y}" x2="${firstControl.x}" y2="${firstControl.y}" stroke="#94A3B8" stroke-width="1.2" />
          <line x1="${end.x}" y1="${end.y}" x2="${secondControl.x}" y2="${secondControl.y}" stroke="#94A3B8" stroke-width="1.2" />
          <path
            d="M ${start.x} ${start.y} C ${firstControl.x} ${firstControl.y}, ${secondControl.x} ${secondControl.y}, ${end.x} ${end.y}"
            fill="none"
            stroke="#e63e14"
            stroke-width="2.5"
            stroke-linecap="round"
          />
          <circle cx="${firstControl.x}" cy="${firstControl.y}" r="3.5" fill="#EC4899" />
          <circle cx="${secondControl.x}" cy="${secondControl.y}" r="3.5" fill="#10B981" />
        </svg>
        <div class="text-xs space-y-1 min-w-0 flex-1">
          <div class="font-semibold text-slate-700 truncate">${preset.label}</div>
          <div class="font-mono text-[10px] text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 truncate">
            ${this.easing}
          </div>
          <div class="text-[11px] text-slate-400">
            P1(${x1}, ${y1}) • P2(${x2}, ${y2})
          </div>
        </div>
      </div>
    `;
  }
}
customElements.define('kinetix-bezier-curve', KinetixBezierCurve);

function toCurvePlotPoint(x, y) {
  return {
    x: CURVE_PLOT_AREA.leftPx + x * CURVE_PLOT_AREA.widthPx,
    y: CURVE_PLOT_AREA.bottomPx - y * CURVE_PLOT_AREA.heightPx
  };
}
