// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { html } from 'lit';
import { LightDomLitElement } from './light-dom-lit-element.js';

class LearningGuide extends LightDomLitElement {
  static properties = {
    engine: { type: Object },
    values: { type: Object },
    isChallengeDone: { type: Boolean }
  };

  render() {
    return html`
      <div class="flex flex-col">
        ${this.engine.challenge ? this.renderChallengeCard(this.engine.challenge) : ''}
        ${this.renderMentalModel(this.engine)}
      </div>
    `;
  }

  renderChallengeCard(challenge) {
    const isDone = this.isChallengeDone;
    return html`
      <div class="border-b p-3.5 transition-all ${
        isDone
          ? 'bg-emerald-50/70 border-emerald-200'
          : 'bg-gradient-to-br from-brand-50/80 via-white to-indigo-50/50 border-slate-200'
      }">
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              isDone ? 'bg-emerald-600 text-white' : 'bg-brand-600 text-white'
            }">
              <i class="ph-fill ${isDone ? 'ph-trophy' : 'ph-flag-banner'} text-sm"></i>
            </div>
            <div>
              <div class="text-[10px] font-bold uppercase tracking-wider ${
                isDone ? 'text-emerald-700' : 'text-brand-600'
              }">
                ${isDone ? 'Challenge Mastered!' : 'Interactive Learning Challenge'}
              </div>
              <h4 class="text-xs font-bold text-slate-900">${challenge.title}</h4>
            </div>
          </div>
          <span class="shrink-0 whitespace-nowrap text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            isDone
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          }">
            ${isDone ? 'Completed ✓' : 'Try It Live'}
          </span>
        </div>
        <p class="text-xs text-slate-600 mt-2 leading-relaxed">
          ${challenge.description}
        </p>
      </div>
    `;
  }

  renderMentalModel(engine) {
    return html`
      <div class="bg-white p-3.5">
        <div class="flex items-center gap-2 mb-2">
          <i class="ph-fill ph-lightbulb-filament text-amber-500 text-lg"></i>
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700">
            Visual Mental Model
          </h3>
        </div>
        <p class="text-xs text-slate-600 leading-relaxed">
          ${engine.mentalModel}
        </p>

        <div class="mt-3 pt-3 border-t border-slate-100">
          <div class="text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-1.5">
            <i class="ph-fill ph-shield-warning text-brand-600"></i>
            <span>Developer Gotchas & Pro Tips</span>
          </div>
          <ul class="space-y-2">
            ${(engine.gotchas || []).map(tip => html`
              <li class="text-xs text-slate-600 flex items-start gap-2 leading-relaxed">
                <span class="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0"></span>
                <span>${tip}</span>
              </li>
            `)}
          </ul>
        </div>
      </div>
    `;
  }
}
customElements.define('learning-guide', LearningGuide);
