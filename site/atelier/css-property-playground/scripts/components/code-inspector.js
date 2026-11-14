// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { html } from 'lit';
import { LightDomLitElement } from './light-dom-lit-element.js';
import { wrapInElementRule } from '../engines/css-layers.js';
import { copyTextWithHiddenTextArea } from '../utils/browser-actions.js';

const COPY_FEEDBACK_DURATION_MS = 1800;
const COPY_TARGETS = { declaration: 'decl', rule: 'rule' };

class CodeInspector extends LightDomLitElement {
  static properties = {
    engine: { type: Object },
    values: { type: Object },
    copiedTarget: { type: String }
  };

  constructor() {
    super();
    this.copiedTarget = '';
  }

  render() {
    const cssDeclaration = this.engine.buildCss(this.values || {});
    const fullRule = wrapInElementRule(cssDeclaration);
    const isDeclarationCopied = this.copiedTarget === COPY_TARGETS.declaration;

    return html`
      <div class="bg-white border-b border-slate-200">
        <div class="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-1.5">
            <i class="ph-bold ph-code text-brand-600"></i>
            <span class="text-xs font-bold text-slate-800">Generated Production CSS</span>
          </div>

          <div class="flex items-center gap-1.5">
            <button
              @click=${() => this.copyText(cssDeclaration, COPY_TARGETS.declaration)}
              class="px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                isDeclarationCopied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm'
              }"
            >
              <i class="ph-bold ${isDeclarationCopied ? 'ph-check' : 'ph-copy'}"></i>
              <span>${isDeclarationCopied ? 'Copied CSS!' : 'Copy Declaration'}</span>
            </button>

            <button
              @click=${() => this.copyText(fullRule, COPY_TARGETS.rule)}
              class="px-2.5 py-1 rounded-lg text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
            >
              ${this.copiedTarget === COPY_TARGETS.rule ? 'Copied Rule!' : 'Copy .class {}'}
            </button>
          </div>
        </div>

        <div class="p-3.5 bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed overflow-x-auto">
          <pre class="select-all whitespace-pre-wrap break-words"><code>${cssDeclaration}</code></pre>
        </div>

        <div class="px-3.5 py-2.5 bg-indigo-50/60 border-t border-indigo-100 flex items-start gap-2">
          <span class="text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 shrink-0 mt-0.5">
            Syntax
          </span>
          <code class="text-[11px] font-mono text-indigo-950 break-all">${this.engine.syntaxAnatomy}</code>
        </div>
      </div>
    `;
  }

  copyText(text, copyTarget) {
    if (!copyTextWithHiddenTextArea(text)) return;
    this.copiedTarget = copyTarget;
    setTimeout(() => { this.copiedTarget = ''; }, COPY_FEEDBACK_DURATION_MS);
  }
}
customElements.define('code-inspector', CodeInspector);
