// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { html, nothing } from 'lit';
import { buildSingleFileDocument, compileLayout } from '../compiler/layout-compiler.js';
import { OpenShadowElement } from './open-shadow-element.js';
import { createOffscreenTextarea } from '../utils/text-helpers.js';

const EXPORT_SCOPE_SELECTOR = '';
const COPY_STATUS_DURATION_MS = 2400;

class CodeExportModal extends OpenShadowElement {
  static properties = {
    isOpen: { type: Boolean },
    tree: { type: Object },
    activeView: { type: String },
    copyStatus: { type: String }
  };

  constructor() {
    super();
    this.isOpen = false;
    this.activeView = 'split';
    this.copyStatus = '';
  }

  render() {
    if (!this.isOpen || !this.tree) return nothing;
    const compiled = compileLayout(this.tree, EXPORT_SCOPE_SELECTOR);

    return html`
      <div class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
        <div class="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl h-[82vh] flex flex-col shadow-2xl overflow-hidden">
          ${this.renderHeader()}

          ${this.activeView === 'split'
            ? this.renderSplitView(compiled)
            : this.renderSingleFileView(buildSingleFileDocument(compiled))}
        </div>
      </div>
    `;
  }

  requestClose() {
    this.emitComposedEvent('close-export');
  }

  copyToClipboard(text, label) {
    const textarea = createOffscreenTextarea(text);
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      this.copyStatus = `Copied ${label}!`;
      setTimeout(() => { this.copyStatus = ''; }, COPY_STATUS_DURATION_MS);
    } catch {
      this.copyStatus = 'Copy failed';
    }
    document.body.removeChild(textarea);
  }

  renderHeader() {
    return html`
          <div class="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <h2 class="text-sm font-bold text-slate-900">Export Clean HTML &amp; Intrinsic CSS</h2>
              <p class="text-xs text-slate-500">Semantic structure with zero media query bloat.</p>
            </div>

            <div class="flex items-center gap-2">
              ${this.copyStatus ? html`
                <span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">
                  ✓ ${this.copyStatus}
                </span>
              ` : nothing}

              ${this.renderViewButton('split', 'HTML + CSS')}
              ${this.renderViewButton('single', 'Single File')}
              <button
                @click=${() => this.requestClose()}
                class="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 ml-1"
              >
                <i class="ph ph-x text-base"></i>
              </button>
            </div>
          </div>
    `;
  }

  renderViewButton(view, label) {
    return html`
              <button
                @click=${() => { this.activeView = view; }}
                class="px-3 py-1.5 rounded-lg text-xs font-medium border ${
                  this.activeView === view
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-200'
                }"
              >
                ${label}
              </button>
    `;
  }

  renderSplitView(compiled) {
    return html`
            <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 overflow-hidden">
              <div class="flex flex-col h-full overflow-hidden">
                ${this.renderCodePaneHeader({ fileLabel: 'index.html', buttonText: 'Copy HTML', buttonColors: 'bg-indigo-600 hover:bg-indigo-500', onCopy: () => this.copyToClipboard(compiled.html, 'HTML') })}
                ${this.renderCodeBlock(compiled.html)}
              </div>

              <div class="flex flex-col h-full overflow-hidden">
                ${this.renderCodePaneHeader({ fileLabel: 'layout.css', buttonText: 'Copy CSS', buttonColors: 'bg-emerald-600 hover:bg-emerald-500', onCopy: () => this.copyToClipboard(compiled.css, 'CSS') })}
                ${this.renderCodeBlock(compiled.css)}
              </div>
            </div>
    `;
  }

  renderSingleFileView(singleFileDocument) {
    return html`
            <div class="flex-1 flex flex-col overflow-hidden">
              ${this.renderCodePaneHeader({ fileLabel: 'Complete HTML File', buttonText: 'Copy File', buttonColors: 'bg-indigo-600 hover:bg-indigo-500', onCopy: () => this.copyToClipboard(singleFileDocument, 'Full File') })}
              ${this.renderCodeBlock(singleFileDocument)}
            </div>
    `;
  }

  renderCodePaneHeader({ fileLabel, buttonText, buttonColors, onCopy }) {
    return html`
                <div class="px-4 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
                  <span class="font-mono text-xs text-slate-700 font-semibold">${fileLabel}</span>
                  <button
                    @click=${onCopy}
                    class="px-2.5 py-1 rounded ${buttonColors} text-white text-xs font-medium flex items-center gap-1"
                  >
                    <i class="ph ph-copy"></i> ${buttonText}
                  </button>
                </div>
    `;
  }

  renderCodeBlock(code) {
    return html`<pre class="flex-1 overflow-auto p-4 font-mono text-xs text-slate-800 bg-slate-50 leading-relaxed select-text">${code}</pre>`;
  }
}
customElements.define('code-export-modal', CodeExportModal);
