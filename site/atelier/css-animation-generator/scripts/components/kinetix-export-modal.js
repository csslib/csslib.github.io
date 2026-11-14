// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { html } from 'lit';
import { KinetixLightDomElement } from './kinetix-light-dom-element.js';
import { renderIcon } from '../ui/icons.js';

class KinetixExportModal extends KinetixLightDomElement {
  static properties = {
    isOpen: { type: Boolean },
    generatedCSS: { type: String },
    mockHtml: { type: String }
  };

  render() {
    if (!this.isOpen) return html``;

    return html`
      <div class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
          <div class="px-4 sm:px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="text-indigo-600">${renderIcon('code', 'w-4 h-4')}</span>
              <h3 class="font-bold text-xs sm:text-sm text-slate-900">
                Export Production CSS (Multi-Range @media, Parallel Delays & Custom IDs)
              </h3>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="${() => this.emit('download-css')}"
                class="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold cursor-pointer"
              >
                ${renderIcon('download', 'w-3.5 h-3.5')}
                <span>Download .css</span>
              </button>
              <button
                type="button"
                @click="${() => this.emit('copy-css')}"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
              >
                ${renderIcon('copy', 'w-3.5 h-3.5')}
                <span>Copy CSS</span>
              </button>
              <button
                type="button"
                @click="${() => this.emit('close-export-modal')}"
                class="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-200/60 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>

          <div class="p-4 bg-slate-900 text-slate-100 font-mono text-xs overflow-y-auto flex-1 select-text">
            <pre class="leading-relaxed">${this.generatedCSS}</pre>
          </div>
        </div>
      </div>
    `;
  }
}
customElements.define('kinetix-export-modal', KinetixExportModal);
