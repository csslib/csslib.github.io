// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { html } from 'lit';
import { LightDomLitElement } from './light-dom-lit-element.js';
import { ALL_CATEGORIES_FILTER } from '../config/constants.js';
import { CSS_PROPERTY_ENGINES } from '../data/property-engines.js';
import { filterAliases, filterEngines } from '../engines/engine-state.js';

const DEFAULT_SIDEBAR_ENGINE_ID = 'border-radius';

class PropertySidebar extends LightDomLitElement {
  static properties = {
    activeEngineId: { type: String },
    searchQuery: { type: String },
    selectedCategory: { type: String },
    completedChallenges: { type: Object }
  };

  constructor() {
    super();
    this.activeEngineId = DEFAULT_SIDEBAR_ENGINE_ID;
    this.searchQuery = '';
    this.selectedCategory = ALL_CATEGORIES_FILTER;
    this.completedChallenges = {};
  }

  selectEngine(engineId) {
    this.dispatchEvent(new CustomEvent('select-property', {
      detail: { id: engineId },
      bubbles: true,
      composed: true
    }));
  }

  render() {
    const normalizedQuery = (this.searchQuery || '').toLowerCase().trim();
    const matchingEngines = filterEngines(normalizedQuery, this.selectedCategory);
    const matchingAliases = filterAliases(normalizedQuery);
    const hasNoMatches = matchingEngines.length === 0 && matchingAliases.length === 0;

    return html`
      <aside class="w-full lg:w-64 xl:w-72 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col h-full select-none shrink-0">
        <div class="p-3 border-b border-slate-100">
          ${this.renderSearchBox()}
          ${this.renderCategoryTabs()}
        </div>

        <div class="flex-1 overflow-y-auto p-2 space-y-0.5 max-h-60 lg:max-h-none">
          ${matchingEngines.map(engine => this.renderEngineButton(engine))}
          ${this.renderAliasMatches(matchingAliases)}
          ${hasNoMatches ? html`
            <div class="py-10 text-center text-slate-400 text-xs">
              No matching CSS properties found. Try searching "shadow", "grid", or "rotate".
            </div>
          ` : ''}
        </div>

        ${this.renderProgressFooter()}
      </aside>
    `;
  }

  renderSearchBox() {
    return html`
      <div class="relative">
        <i class="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base"></i>
        <input
          type="text"
          .value=${this.searchQuery}
          @input=${(event) => { this.searchQuery = event.target.value; }}
          placeholder="Search CSS property (e.g. bezier, gap, blur)..."
          class="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition font-medium text-slate-800 placeholder:text-slate-400"
        />
        ${this.searchQuery ? html`
          <button
            @click=${() => { this.searchQuery = ''; }}
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            title="Clear search"
          >
            <i class="ph ph-x-circle"></i>
          </button>
        ` : ''}
      </div>
    `;
  }

  renderCategoryTabs() {
    const categories = [ALL_CATEGORIES_FILTER, ...new Set(CSS_PROPERTY_ENGINES.map(engine => engine.category))];
    return html`
      <div class="flex items-center gap-1 overflow-x-auto pt-2.5 pb-0.5 no-scrollbar">
        ${categories.map(category => {
          const isActive = this.selectedCategory === category;
          return html`
            <button
              @click=${() => { this.selectedCategory = category; }}
              class="px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }"
            >
              ${category}
            </button>
          `;
        })}
      </div>
    `;
  }

  renderEngineButton(engine) {
    const isSelected = engine.id === this.activeEngineId;
    const isChallengeDone = !!this.completedChallenges?.[engine.id];
    return html`
      <button
        @click=${() => this.selectEngine(engine.id)}
        class="w-full text-left px-2.5 py-2 rounded-lg transition flex items-start justify-between gap-2 group border ${
          isSelected
            ? 'bg-brand-50/90 border-brand-200 text-brand-900'
            : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200/70 text-slate-700'
        }"
      >
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5">
            <span class="font-mono text-xs font-semibold truncate ${isSelected ? 'text-brand-700' : 'text-slate-800 group-hover:text-brand-600'}">
              ${engine.name}
            </span>
            ${isChallengeDone ? html`
              <span class="inline-flex items-center text-emerald-600" title="Challenge Completed!">
                <i class="ph-fill ph-check-circle text-sm"></i>
              </span>
            ` : ''}
          </div>
          <p class="text-[11px] text-slate-500 line-clamp-1 mt-0.5">${engine.summary}</p>
        </div>
        <span class="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${
          isSelected
            ? 'bg-brand-600 text-white'
            : 'bg-slate-100 text-slate-600'
        }">
          ${engine.badge}
        </span>
      </button>
    `;
  }

  renderAliasMatches(matchingAliases) {
    if (matchingAliases.length === 0) return '';
    return html`
      <div class="pt-3 pb-1 px-2">
        <div class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
          Related Sub-Properties
        </div>
        <div class="space-y-1">
          ${matchingAliases.map(alias => html`
            <button
              @click=${() => this.selectEngine(alias.targetId)}
              class="w-full text-left px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 hover:bg-brand-50 border border-slate-200/70 flex items-center justify-between"
            >
              <span class="font-mono text-[11px] font-medium text-brand-700">${alias.propertyLabel}</span>
              <span class="text-[10px] text-slate-400">${alias.note}</span>
            </button>
          `)}
        </div>
      </div>
    `;
  }

  renderProgressFooter() {
    return html`
      <div class="px-3 py-2 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs">
        <div class="flex items-center gap-1.5 text-slate-600 font-medium">
          <i class="ph-fill ph-graduation-cap text-brand-600 text-base"></i>
          <span>Challenges Solved</span>
        </div>
        <span class="font-mono font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-brand-700">
          ${Object.keys(this.completedChallenges || {}).length} / ${CSS_PROPERTY_ENGINES.length}
        </span>
      </div>
    `;
  }
}
customElements.define('property-sidebar', PropertySidebar);
