// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

export function buildHtmlFromMockItems(items) {
  const itemsBySlot = groupMockItemsBySlot(items);

  return `<!-- Editable Mock DOM: Match your real website IDs & classes here -->
<div id="mock-page-shell" class="mock-shell">
  <header id="slot-header" class="mock-slot-header">
${renderSlotItemsMarkup(itemsBySlot.header)}
  </header>

  <section id="slot-hero" class="mock-slot-hero">
${renderSlotItemsMarkup(itemsBySlot.hero)}
  </section>

  <section id="slot-grid" class="mock-slot-grid">
${renderSlotItemsMarkup(itemsBySlot.grid)}
  </section>

  <footer id="slot-cta" class="mock-slot-cta">
${renderSlotItemsMarkup(itemsBySlot.cta)}
  </footer>
</div>`;
}

function groupMockItemsBySlot(items) {
  const itemsBySlot = { header: [], hero: [], grid: [], cta: [] };
  (items || []).forEach((item) => {
    if (!itemsBySlot[item.slot]) itemsBySlot[item.slot] = [];
    itemsBySlot[item.slot].push(item);
  });
  return itemsBySlot;
}

function renderSlotItemsMarkup(slotItems) {
  return slotItems.map((item, staggerIndex) => renderMockItemMarkup(item, staggerIndex)).join('\n');
}

function renderMockItemMarkup(item, staggerIndex) {
  const tag = item.tag || 'div';
  const idAttribute = item.id ? ` id="${item.id}"` : '';
  const classAttribute = item.className ? ` class="${item.className}"` : '';
  const staggerAttribute = ` style="--stagger-index: ${staggerIndex};"`;
  return `    <${tag}${idAttribute}${classAttribute}${staggerAttribute}>${item.text || ''}</${tag}>`;
}

export function collectMockSelectorOptions(mockItems) {
  const options = [];
  const seenSelectors = new Set();
  const addOption = (selector, label) => {
    if (seenSelectors.has(selector)) return;
    seenSelectors.add(selector);
    options.push({ selector, label });
  };
  (mockItems || []).forEach((item) => {
    if (item.id) addOption(`#${item.id}`, `#${item.id} (${item.slot})`);
    if (item.className) addOption(`.${item.className}`, `.${item.className} (Class)`);
  });
  return options;
}
