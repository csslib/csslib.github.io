// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { html } from 'lit';
import { LightDomLitElement } from './light-dom-lit-element.js';
import { QUICK_ENCYCLOPEDIA_ALIASES } from '../data/encyclopedia-aliases.js';
import { CSS_PROPERTY_ENGINES } from '../data/property-engines.js';
import { createInitialValues, createInitialValuesByEngineId, isChallengeSolved } from '../engines/engine-state.js';

const DEFAULT_ACTIVE_ENGINE_ID = 'clip-path-polygon';

class CssStudioApp extends LightDomLitElement {
  static properties = {
    activeEngineId: { type: String },
    valuesByEngineId: { type: Object },
    completedChallenges: { type: Object },
    isEncyclopediaOpen: { type: Boolean }
  };

  constructor() {
    super();
    this.activeEngineId = DEFAULT_ACTIVE_ENGINE_ID;
    this.valuesByEngineId = createInitialValuesByEngineId(CSS_PROPERTY_ENGINES);
    this.completedChallenges = {};
    this.isEncyclopediaOpen = false;
  }

  get activeEngine() {
    return CSS_PROPERTY_ENGINES.find(engine => engine.id === this.activeEngineId) || CSS_PROPERTY_ENGINES[0];
  }

  get activeValues() {
    return this.valuesByEngineId[this.activeEngineId] || {};
  }

  render() {
    const engine = this.activeEngine;
    const values = this.activeValues;
    const isChallengeDone = !!this.completedChallenges[this.activeEngineId];

    return html`
      <div
        @select-property=${this.handleEngineSelected}
        @param-change=${this.handleValueChanges}
        @reset-params=${this.handleResetValues}
        class="flex-1 flex flex-col min-h-0"
      >
        ${this.renderHeader()}

        <div class="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          <property-sidebar
            class="flex lg:h-full shrink-0"
            .activeEngineId=${this.activeEngineId}
            .completedChallenges=${this.completedChallenges}
          ></property-sidebar>

          <div class="flex-1 min-w-0 min-h-0 flex flex-col xl:flex-row overflow-y-auto xl:overflow-hidden bg-white">
            <main class="flex-1 min-w-0 xl:overflow-y-auto">
              <visual-stage
                class="block border-b border-slate-200"
                .engine=${engine}
                .values=${values}
              ></visual-stage>

              <control-panel
                class="block"
                .engine=${engine}
                .values=${values}
              ></control-panel>
            </main>

            <aside class="w-full xl:w-80 2xl:w-96 shrink-0 border-t xl:border-t-0 xl:border-l border-slate-200 xl:overflow-y-auto">
              <code-inspector
                class="block"
                .engine=${engine}
                .values=${values}
              ></code-inspector>

              <learning-guide
                class="block"
                .engine=${engine}
                .values=${values}
                .isChallengeDone=${isChallengeDone}
              ></learning-guide>
            </aside>
          </div>
        </div>

        ${this.renderEncyclopediaModal()}
      </div>
    `;
  }

  handleEngineSelected(event) {
    this.activeEngineId = event.detail.id;
  }

  handleValueChanges(event) {
    const currentValues = this.valuesByEngineId[this.activeEngineId] || {};
    const updatedValues = { ...currentValues, ...event.detail.updates };
    this.valuesByEngineId = {
      ...this.valuesByEngineId,
      [this.activeEngineId]: updatedValues
    };
    if (isChallengeSolved(this.activeEngine, updatedValues)) {
      this.completedChallenges = {
        ...this.completedChallenges,
        [this.activeEngineId]: true
      };
    }
  }

  handleResetValues() {
    this.valuesByEngineId = {
      ...this.valuesByEngineId,
      [this.activeEngineId]: createInitialValues(this.activeEngine)
    };
  }

  openEngineFromDirectory(engineId) {
    this.activeEngineId = engineId;
    this.isEncyclopediaOpen = false;
  }

  renderHeader() {
    return html`
      <header class="suite-header h-12 bg-white border-b border-slate-200 px-3 sm:px-4 flex items-center justify-between gap-3 shrink-0">
        <div class="flex items-center gap-2 min-w-0">
          <suite-nav></suite-nav>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button
            @click=${() => { this.isEncyclopediaOpen = true; }}
            class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-700 border border-slate-200/80 transition flex items-center gap-1.5"
          >
            <i class="ph-bold ph-compass"></i>
            <span>All CSS Properties Directory</span>
          </button>
        </div>
      </header>
    `;
  }

  renderEncyclopediaModal() {
    if (!this.isEncyclopediaOpen) return '';
    return html`
      <div class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[82vh] flex flex-col overflow-hidden">
          <div class="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div class="flex items-center gap-2">
              <i class="ph-fill ph-books text-brand-600 text-lg"></i>
              <h3 class="text-sm font-bold text-slate-900">Complete Complex & Numeric CSS Properties Index</h3>
            </div>
            <button
              @click=${() => { this.isEncyclopediaOpen = false; }}
              class="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800"
            >
              <i class="ph-bold ph-x"></i>
            </button>
          </div>
          <div class="p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            ${QUICK_ENCYCLOPEDIA_ALIASES.map(alias => html`
              <button
                @click=${() => this.openEngineFromDirectory(alias.targetId)}
                class="p-3 rounded-xl border border-slate-200 hover:border-brand-400 hover:bg-brand-50/40 text-left transition flex items-center justify-between gap-2 group"
              >
                <div>
                  <div class="font-mono text-xs font-bold text-slate-800 group-hover:text-brand-700">${alias.propertyLabel}</div>
                  <div class="text-[11px] text-slate-500 mt-0.5">${alias.note}</div>
                </div>
                <i class="ph-bold ph-arrow-right text-slate-400 group-hover:text-brand-600"></i>
              </button>
            `)}
          </div>
        </div>
      </div>
    `;
  }
}
customElements.define('css-studio-app', CssStudioApp);
