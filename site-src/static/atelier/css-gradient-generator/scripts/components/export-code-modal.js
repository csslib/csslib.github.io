// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { html, nothing } from 'lit';
import { GradientFieldCompiler } from '../compiler/gradient-field-compiler.js';
import { OpenStudioElement } from './open-studio-element.js';
import { copyTextToClipboard, formatCustomPropertiesCss, formatDesignTokens, formatProductionCss, formatTailwindSnippet } from '../export/css-formatters.js';

const EXPORT_COPY_FEEDBACK_MS = 2000;

const EXPORT_TABS = [
  { id: 'css-compiled', label: 'Production CSS' },
  { id: 'css-vars', label: 'CSS Custom Properties' },
  { id: 'tailwind', label: 'Tailwind CSS' },
  { id: 'tokens', label: 'JSON State / Tokens' }
];

class ExportCodeModal extends OpenStudioElement {
  static properties = {
    isOpen: { type: Boolean },
    controls: { type: Array },
    globals: { type: Object },
    noise: { type: Object },
    activeTab: { type: String, state: true },
    isCopied: { type: Boolean, state: true }
  };

  constructor() {
    super();
    this.isOpen = false;
    this.activeTab = 'css-compiled';
    this.isCopied = false;
  }

  _close() {
    this._emit('modal-close');
  }

  _buildExportText() {
    const compiledScene = GradientFieldCompiler.compileScene(this.controls || [], this.globals || {}, { isNaiveSrgb: false });
    switch (this.activeTab) {
      case 'css-compiled': return formatProductionCss(compiledScene);
      case 'css-vars': return formatCustomPropertiesCss(compiledScene, this.controls || []);
      case 'tailwind': return formatTailwindSnippet(compiledScene);
      default: return formatDesignTokens({ globals: this.globals, noise: this.noise, controls: this.controls });
    }
  }

  _copyCode() {
    copyTextToClipboard(this._buildExportText());
    this.isCopied = true;
    setTimeout(() => { this.isCopied = false; }, EXPORT_COPY_FEEDBACK_MS);
  }

  render() {
    if (!this.isOpen) return nothing;

    return html`
      <div
        class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
        @click=${this._close}
      >
        <div
          class="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden"
          @click=${(event) => event.stopPropagation()}
        >
          ${this._renderHeader()}
          ${this._renderTabs()}
          ${this._renderCodePanel()}
        </div>
      </div>
    `;
  }

  _renderHeader() {
    return html`
          <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div class="flex items-center gap-2">
              <i class="ph-duotone ph-code-block text-indigo-600 text-xl"></i>
              <div>
                <h3 class="text-sm font-bold text-slate-900">Export Combined Gradient Code</h3>
                <p class="text-xs text-slate-500">Single-layer multi-control CSS & design tokens</p>
              </div>
            </div>
            <button
              type="button"
              @click=${this._close}
              class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <i class="ph-bold ph-x text-base"></i>
            </button>
          </div>
    `;
  }

  _renderTabs() {
    return html`
          <div class="px-5 pt-3 border-b border-slate-200 flex flex-wrap gap-2 bg-white">
            ${EXPORT_TABS.map(tab => html`
              <button
                type="button"
                @click=${() => { this.activeTab = tab.id; }}
                class="px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  this.activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }"
              >
                ${tab.label}
              </button>
            `)}
          </div>
    `;
  }

  _renderCodePanel() {
    return html`
          <div class="p-5 space-y-4">
            <pre class="bg-slate-900 text-slate-100 font-mono text-xs p-4 rounded-xl overflow-x-auto max-h-80 leading-relaxed select-all">${this._buildExportText()}</pre>
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-500">
                Ready to paste into any stylesheet or web component.
              </span>
              <button
                type="button"
                @click=${this._copyCode}
                class="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5 transition-all"
              >
                <i class="ph-bold ${this.isCopied ? 'ph-check' : 'ph-copy'}"></i>
                ${this.isCopied ? 'Copied to Clipboard!' : 'Copy Code'}
              </button>
            </div>
          </div>
    `;
  }
}
customElements.define('export-code-modal', ExportCodeModal);
