// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { html } from 'lit';
import { KinetixLightDomElement } from './kinetix-light-dom-element.js';
import { PRESET_TEMPLATES } from '../data/animation-presets.js';
import { renderIcon } from '../ui/icons.js';

class KinetixHeader extends KinetixLightDomElement {
  static properties = {
    activePresetId: { type: String },
    simulatedWidth: { type: Number },
    prefersReducedMotion: { type: Boolean }
  };

  render() {
    return html`
      <header class="suite-header h-12 bg-white border-b border-slate-200 px-3 sm:px-4 flex items-center justify-between gap-3 shrink-0 z-30">
        <div class="flex items-center gap-2.5 min-w-0">
          ${this.renderBrand()}

          <div class="h-5 w-px bg-slate-200 hidden lg:block"></div>

          <div class="hidden lg:flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
            ${Object.values(PRESET_TEMPLATES).map((preset) => this.renderPresetButton(preset))}
          </div>
        </div>

        ${this.renderActions()}
      </header>
    `;
  }

  renderBrand() {
    return html`<suite-nav></suite-nav>`;
  }

  renderPresetButton(preset) {
    return html`
      <button
        type="button"
        @click="${() => this.emit('select-preset', { presetId: preset.id })}"
        class="px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${this.activePresetId === preset.id
          ? 'bg-white text-indigo-700 shadow-sm font-semibold'
          : 'text-slate-600 hover:text-slate-900'}"
      >
        ${preset.shortName}
      </button>
    `;
  }

  renderActions() {
    return html`
      <div class="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0">
        <button
          type="button"
          @click="${() => this.emit('toggle-reduced-motion')}"
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-all cursor-pointer ${this.prefersReducedMotion
            ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-2xs'
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}"
          title="Simulate @media (prefers-reduced-motion: reduce)"
        >
          <span class="${this.prefersReducedMotion ? 'text-amber-600' : 'text-slate-400'}">
            ${renderIcon('shield', 'w-3.5 h-3.5')}
          </span>
          <span class="hidden xl:inline">Reduced Motion:</span>
          <span class="font-mono font-semibold">${this.prefersReducedMotion ? 'ON' : 'OFF'}</span>
        </button>

        <button
          type="button"
          @click="${() => this.emit('trigger-playback')}"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold whitespace-nowrap shadow-sm transition-all cursor-pointer"
        >
          ${renderIcon('play', 'w-3.5 h-3.5')}
          <span>Run Flow</span>
        </button>

        <button
          type="button"
          @click="${() => this.emit('copy-css')}"
          class="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer"
        >
          <span class="text-indigo-600">${renderIcon('copy', 'w-3.5 h-3.5')}</span>
          <span class="hidden sm:inline">Copy CSS</span>
        </button>

        <button
          type="button"
          @click="${() => this.emit('open-export-modal')}"
          class="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer"
        >
          ${renderIcon('code', 'w-3.5 h-3.5')}
          <span class="hidden md:inline">Export CSS</span>
        </button>
      </div>
    `;
  }
}
customElements.define('kinetix-header', KinetixHeader);
