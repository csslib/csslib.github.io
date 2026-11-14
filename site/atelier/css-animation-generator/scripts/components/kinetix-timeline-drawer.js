// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { html } from 'lit';
import { KinetixLightDomElement } from './kinetix-light-dom-element.js';
import { MIN_SEQUENCE_DURATION_MS } from '../config/constants.js';
import { renderIcon } from '../ui/icons.js';

const MIN_TIMELINE_SPAN_MS = 1000;
const MAX_TIMELINE_BAR_LEFT_PERCENT = 84;
const MIN_TIMELINE_BAR_WIDTH_PERCENT = 12;

class KinetixTimelineDrawer extends KinetixLightDomElement {
  static properties = {
    activeBottomTab: { type: String },
    currentTimeMs: { type: Number },
    primarySchedule: { type: Object },
    simulatedWidth: { type: Number },
    selectedNodeId: { type: String },
    generatedCSS: { type: String }
  };

  render() {
    const steps = this.primarySchedule?.steps || [];
    const totalDurationMs = this.primarySchedule?.totalDurationMs || MIN_SEQUENCE_DURATION_MS;
    const rangeLabel = this.primarySchedule?.matchedRangeLabel || `${this.simulatedWidth}px`;

    return html`
      <div class="bg-white flex flex-col border-t border-slate-200">
        <div class="h-10 px-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <div class="flex items-center gap-1 min-w-0">
            ${this.renderBottomTabButton('timeline', 'clock', `Parallel & Chained Timeline (${rangeLabel})`)}
            ${this.renderBottomTabButton('css', 'code', 'Generated Production CSS (@keyframes & Multi-@media)')}
          </div>

          <div class="hidden xl:flex items-center gap-2 text-[11px] text-slate-500 font-mono whitespace-nowrap shrink-0">
            <span>Playhead: ${this.currentTimeMs || 0}ms</span>
            <span>•</span>
            <span>Total Sequence: ${totalDurationMs}ms</span>
          </div>
        </div>

        ${this.activeBottomTab === 'timeline'
          ? this.renderTimeline(steps, totalDurationMs)
          : this.renderCssPanel()}
      </div>
    `;
  }

  renderBottomTabButton(tabId, iconName, label) {
    return html`
      <button
        type="button"
        @click="${() => this.emit('change-bottom-tab', { tab: tabId })}"
        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer min-w-0 ${this.activeBottomTab === tabId
          ? 'bg-indigo-600 text-white shadow-2xs'
          : 'text-slate-600 hover:bg-slate-200/60'}"
      >
        <span class="shrink-0">${renderIcon(iconName, 'w-3.5 h-3.5')}</span>
        <span class="truncate">${label}</span>
      </button>
    `;
  }

  renderTimeline(steps, totalDurationMs) {
    const timelineSpanMs = Math.max(totalDurationMs, MIN_TIMELINE_SPAN_MS);

    return html`
      <div class="p-3 overflow-y-auto max-h-44">
        <div class="bg-slate-50 rounded-lg border border-slate-200 p-2 space-y-1">
          ${steps.map((step) => this.renderTimelineRow(step, timelineSpanMs))}
        </div>
      </div>
    `;
  }

  renderTimelineRow(step, timelineSpanMs) {
    const leftPercent = Math.min(MAX_TIMELINE_BAR_LEFT_PERCENT, (step.startMs / timelineSpanMs) * 100);
    const widthPercent = Math.max(MIN_TIMELINE_BAR_WIDTH_PERCENT, ((step.endMs - step.startMs) / timelineSpanMs) * 100);
    const isWaitAll = step.parentCount > 1;

    return html`
      <div
        @click="${() => this.emit('select-node', { nodeId: step.nodeId })}"
        class="flex items-center gap-2 p-1 rounded-lg cursor-pointer transition-colors ${this.selectedNodeId === step.nodeId
          ? 'bg-indigo-50/90'
          : 'hover:bg-white'}"
      >
        <div class="w-44 sm:w-56 min-w-0 shrink-0 truncate text-[11px] font-medium text-slate-700 flex items-center gap-1.5">
          ${isWaitAll
            ? html`<span class="px-1.5 py-0.2 rounded bg-violet-100 text-violet-800 text-[9px] font-bold">Wait-All</span>`
            : ''}
          <span class="truncate">${step.title}</span>
          <span class="text-[10px] font-mono text-slate-400">(${step.target})</span>
        </div>
        <div class="flex-1 h-5 bg-slate-200/70 rounded-md relative overflow-hidden">
          <div
            style="left: ${leftPercent}%; width: ${widthPercent}%;"
            class="absolute top-0.5 bottom-0.5 rounded ${isWaitAll
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600'
              : 'bg-gradient-to-r from-indigo-500 to-emerald-500'} text-white text-[9px] font-mono flex items-center px-2 truncate shadow-2xs"
          >
            ${step.startMs}ms → ${step.endMs}ms
          </div>
        </div>
      </div>
    `;
  }

  renderCssPanel() {
    return html`
      <div class="flex items-start justify-between p-3 bg-slate-900 text-slate-100 font-mono text-xs overflow-auto max-h-44">
        <pre class="leading-relaxed select-text">${this.generatedCSS}</pre>
        <button
          type="button"
          @click="${() => this.emit('copy-css')}"
          class="sticky top-1 right-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-sans font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
        >
          ${renderIcon('copy', 'w-3.5 h-3.5')}
          <span>Copy CSS</span>
        </button>
      </div>
    `;
  }
}
customElements.define('kinetix-timeline-drawer', KinetixTimelineDrawer);
