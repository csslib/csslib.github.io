// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { html, nothing } from 'lit';
import { PANEL_HEADER_CLASS } from '../config/constants.js';

const WCAG_AA_MIN_CONTRAST = 4.5;
const PANEL_TITLE_CLASS = 'min-w-0 text-[11px] leading-snug font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5';

export function renderPanelSection({ icon, title, hint = '', trailing = nothing, body }) {
  return html`
    <section class="border-b border-slate-200">
      <div class=${PANEL_HEADER_CLASS}>
        <h2 class=${PANEL_TITLE_CLASS} title=${hint || title}>
          <i class="ph-duotone ${icon} text-indigo-600 text-sm shrink-0"></i>
          <span>${title}</span>
        </h2>
        ${trailing}
      </div>
      <div class="p-3.5 space-y-3">${body}</div>
    </section>
  `;
}

export function renderContrastRow(label, ratio) {
  const meetsAA = ratio >= WCAG_AA_MIN_CONTRAST;
  return html`
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-slate-600">${label}</span>
                    <span class="font-mono font-semibold ${meetsAA ? 'text-emerald-600' : 'text-amber-600'}">
                      ${ratio.toFixed(1)}:1 ${meetsAA ? 'AA' : ''}
                    </span>
                  </div>
  `;
}
