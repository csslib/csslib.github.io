// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { html, nothing } from 'lit';
import { OpenShadowElement } from './open-shadow-element.js';
import { BENTO_COLUMN_COUNT } from '../config/constants.js';
import { CONCRETE_LEAF_TAGS, FLUID_SPACE_PRESETS, FLUID_TYPE_PRESETS, LAYOUT_BEHAVIORS, LEAF_VARIANT_OPTIONS, STRUCTURAL_TAGS, SURFACE_COLOR_OPTIONS } from '../data/layout-options.js';
import { isConcreteLeaf, isPinnedChrome } from '../tree/layout-tree.js';

const INSERTABLE_STRUCTURE_TAGS = ['section', 'div', 'article', 'header', 'aside', 'ul'];
const INSERTABLE_LEAF_TAGS = ['h2', 'h3', 'p', 'a', 'li', 'button', 'span'];

const CLUSTER_ALIGNMENT_OPTIONS = [
  { id: 'flex-start', label: 'Start' },
  { id: 'space-between', label: 'Spread' },
  { id: 'center', label: 'Center' },
  { id: 'flex-end', label: 'End' }
];

const MAX_WIDTH_OPTIONS = [
  { value: '100%', label: '100%' },
  { value: '1280px', label: '1280px' },
  { value: '1040px', label: '1040px' },
  { value: '65ch', label: '65ch' }
];

const CHROME_MODE_OPTIONS = [
  { id: 'static', label: 'Normal' },
  { id: 'sticky', label: '📌 Sticky' },
  { id: 'fixed', label: 'Fixed' }
];

const PIN_EDGES = ['top', 'bottom'];

const GROW_OPTIONS = [
  { grow: 0, label: 'Auto' },
  { grow: 1, label: 'Fill' }
];

const INSPECTOR_TABS = [
  { id: 'layout', structureLabel: 'Layout', leafLabel: 'Content' },
  { id: 'chrome', structureLabel: 'Chrome', leafLabel: 'Chrome' },
  { id: 'insert', structureLabel: '+ Add / Tag', leafLabel: 'Tag' }
];

const DEFAULT_CHROME_SETTINGS = { mode: 'static', edge: 'top', offset: 0, zIndex: 20, blur: false, surface: 'transparent', border: false };

const INSPECTOR_DISPLAY_FALLBACKS = {
  minColWidthPx: 200,
  sidebarWidthPx: 220,
  mainMinPercent: 62,
  spanCols: 12
};

const INVALID_CLASS_NAME_CHARACTERS = /[^a-zA-Z0-9-_]/g;

class VisualInspectorPanel extends OpenShadowElement {
  static properties = {
    node: { type: Object },
    parentLayoutNode: { type: Object },
    activeTab: { type: String }
  };

  constructor() {
    super();
    this.activeTab = 'layout';
  }

  render() {
    if (!this.node) return this.renderEmptyState();

    const isLeaf = isConcreteLeaf(this.node.tag);

    return html`
      <aside class="w-72 lg:w-80 bg-white border-l border-slate-200 flex flex-col h-full shrink-0 select-none">
        ${this.renderHeader(isLeaf)}
        ${this.renderTabBar(isLeaf)}

        <div class="flex-1 overflow-y-auto p-3.5">
          ${this.activeTab === 'layout' ? this.renderLayoutTab(isLeaf) : nothing}
          ${this.activeTab === 'chrome' ? this.renderChromeControls() : nothing}
          ${this.activeTab === 'insert' ? this.renderInsertAndTagControls() : nothing}
        </div>
      </aside>
    `;
  }

  requestNodeUpdate(patch) {
    if (!this.node) return;
    this.emitComposedEvent('update-node', { id: this.node.id, patch });
  }

  requestChromeUpdate(chromePatch) {
    if (!this.node) return;
    const nextChrome = { ...(this.node.chrome || {}), ...chromePatch };
    this.requestNodeUpdate({ chrome: nextChrome });
  }

  requestItemPropsUpdate(itemPropsPatch) {
    if (!this.node) return;
    const nextItemProps = { ...(this.node.itemProps || {}), ...itemPropsPatch };
    this.requestNodeUpdate({ itemProps: nextItemProps });
  }

  requestAddChild(tag) {
    if (!this.node || isConcreteLeaf(this.node.tag)) return;
    this.emitComposedEvent('add-specific-child', { parentId: this.node.id, tag });
  }

  requestConversionToLeaf(leafTag) {
    const node = this.node;
    this.requestNodeUpdate({
      tag: leafTag.tag,
      text: node.text || leafTag.defaultText,
      typeScale: node.typeScale || 'body',
      leafVariant: node.leafVariant || 'plain',
      children: undefined
    });
  }

  renderEmptyState() {
    return html`
        <aside class="w-72 lg:w-80 h-full shrink-0 bg-white border-l border-slate-200 p-6 flex items-center justify-center text-xs text-slate-400">
          Select an element on the page to configure its layout.
        </aside>
    `;
  }

  renderHeader(isLeaf) {
    return html`
        <div class="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="px-1.5 py-0.5 rounded font-mono text-xs font-semibold ${
              isLeaf
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-sky-50 text-sky-700 border border-sky-200'
            }">
              &lt;${this.node.tag}&gt;
            </span>
            <span class="text-xs font-semibold text-slate-800 truncate">${this.node.name}</span>
          </div>
        </div>
    `;
  }

  renderTabBar(isLeaf) {
    return html`
        <div class="grid grid-cols-3 border-b border-slate-200 bg-slate-50 p-1 gap-1">
          ${INSPECTOR_TABS.map(tab => html`
            <button
              @click=${() => { this.activeTab = tab.id; }}
              class="py-1 rounded text-xs font-medium transition ${
                this.activeTab === tab.id
                  ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }"
            >
              ${isLeaf ? tab.leafLabel : tab.structureLabel}
            </button>
          `)}
        </div>
    `;
  }

  renderLayoutTab(isLeaf) {
    return html`
                ${isLeaf ? this.renderLeafControls() : this.renderStructuralControls()}
                ${this.renderSizingInParentControls()}
    `;
  }

  renderBehaviorIcon(behaviorId, isActive) {
    const stroke = isActive ? '#255deb' : '#64748b';
    const fill = isActive ? '#e0e7ff' : '#f1f5f9';
    switch (behaviorId) {
      case 'ram-grid':
        return html`
          <svg viewBox="0 0 48 24" class="w-10 h-5 shrink-0">
            <rect x="2" y="2" width="12" height="9" rx="1.5" fill=${fill} stroke=${stroke} stroke-width="1.5"/>
            <rect x="18" y="2" width="12" height="9" rx="1.5" fill=${fill} stroke=${stroke} stroke-width="1.5"/>
            <rect x="34" y="2" width="12" height="9" rx="1.5" fill=${fill} stroke=${stroke} stroke-width="1.5"/>
            <rect x="2" y="14" width="20" height="8" rx="1.5" fill=${fill} stroke=${stroke} stroke-width="1.5"/>
            <rect x="26" y="14" width="20" height="8" rx="1.5" fill=${fill} stroke=${stroke} stroke-width="1.5"/>
          </svg>
        `;
      case 'sidebar-switcher':
        return html`
          <svg viewBox="0 0 48 24" class="w-10 h-5 shrink-0">
            <rect x="2" y="2" width="13" height="20" rx="1.5" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
            <rect x="18" y="2" width="28" height="20" rx="1.5" fill=${fill} stroke=${stroke} stroke-width="1.5"/>
          </svg>
        `;
      case 'cluster-flow':
        return html`
          <svg viewBox="0 0 48 24" class="w-10 h-5 shrink-0">
            <rect x="2" y="7" width="12" height="10" rx="5" fill=${fill} stroke=${stroke} stroke-width="1.5"/>
            <rect x="17" y="7" width="14" height="10" rx="5" fill=${fill} stroke=${stroke} stroke-width="1.5"/>
            <rect x="34" y="7" width="12" height="10" rx="5" fill=${fill} stroke=${stroke} stroke-width="1.5"/>
          </svg>
        `;
      case 'bento-12':
        return html`
          <svg viewBox="0 0 48 24" class="w-10 h-5 shrink-0">
            <rect x="2" y="2" width="28" height="9" rx="1.5" fill=${fill} stroke=${stroke} stroke-width="1.5"/>
            <rect x="33" y="2" width="13" height="9" rx="1.5" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5"/>
            <rect x="2" y="14" width="21" height="8" rx="1.5" fill=${fill} stroke=${stroke} stroke-width="1.5"/>
            <rect x="25" y="14" width="21" height="8" rx="1.5" fill=${fill} stroke=${stroke} stroke-width="1.5"/>
          </svg>
        `;
      case 'holy-grail-split':
        return html`
          <svg viewBox="0 0 48 24" class="w-10 h-5 shrink-0">
            <rect x="2" y="2" width="12" height="20" rx="1.5" fill=${fill} stroke=${stroke} stroke-width="1.5"/>
            <rect x="17" y="2" width="14" height="20" rx="1.5" fill=${fill} stroke=${stroke} stroke-width="1.5"/>
            <rect x="34" y="2" width="12" height="20" rx="1.5" fill=${fill} stroke=${stroke} stroke-width="1.5"/>
          </svg>
        `;
      case 'pancake-stack':
      default:
        return html`
          <svg viewBox="0 0 48 24" class="w-10 h-5 shrink-0">
            <rect x="3" y="2" width="42" height="5" rx="1.5" fill=${fill} stroke=${stroke} stroke-width="1.5"/>
            <rect x="3" y="9.5" width="42" height="5" rx="1.5" fill=${fill} stroke=${stroke} stroke-width="1.5"/>
            <rect x="3" y="17" width="42" height="5" rx="1.5" fill=${fill} stroke=${stroke} stroke-width="1.5"/>
          </svg>
        `;
    }
  }

  renderStructuralControls() {
    const node = this.node;
    return html`
      <div class="space-y-4">
        ${this.renderBehaviorPicker(node)}

        ${node.behavior === 'ram-grid' ? this.renderAutoFitGridSettings(node) : nothing}

        ${node.behavior === 'sidebar-switcher' ? this.renderSidebarSwitcherSettings(node) : nothing}

        ${node.behavior === 'cluster-flow' ? this.renderClusterAlignmentSettings(node) : nothing}

        <div class="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
          ${this.renderSpacePresetPicker({ label: 'Fluid Gap', propertyName: 'gap', selectedKey: node.gap || 'sm' })}

          ${this.renderSpacePresetPicker({ label: 'Inner Padding', propertyName: 'padding', selectedKey: node.padding || 'none' })}

          ${this.renderMaxWidthPicker(node)}
        </div>
      </div>
    `;
  }

  renderBehaviorPicker(node) {
    return html`
        <div>
          <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Responsive Behavior
          </label>
          <div class="grid grid-cols-2 gap-1.5">
            ${LAYOUT_BEHAVIORS.map(behavior => {
              const isActive = node.behavior === behavior.id;
              return html`
                <button
                  @click=${() => this.requestNodeUpdate({ behavior: behavior.id })}
                  class="p-2 rounded-lg border text-left transition flex flex-col gap-1.5 ${
                    isActive
                      ? 'bg-indigo-50/70 border-indigo-500 ring-1 ring-indigo-500/30'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }"
                >
                  <div class="flex items-center justify-between w-full">
                    ${this.renderBehaviorIcon(behavior.id, isActive)}
                    ${isActive ? html`<i class="ph-fill ph-check-circle text-indigo-600 text-xs"></i>` : nothing}
                  </div>
                  <div>
                    <div class="text-xs font-semibold ${isActive ? 'text-indigo-950' : 'text-slate-800'}">${behavior.name}</div>
                    <div class="text-[10px] text-slate-500 leading-tight mt-0.5 line-clamp-2">${behavior.subtitle}</div>
                  </div>
                </button>
              `;
            })}
          </div>
        </div>
    `;
  }

  renderAutoFitGridSettings(node) {
    const minColWidthPx = node.minColWidth || INSPECTOR_DISPLAY_FALLBACKS.minColWidthPx;
    return html`
          <div class="p-3 rounded-lg bg-indigo-50/60 border border-indigo-100 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-slate-700">Wrap Card Below Width</span>
              <span class="font-mono text-xs font-semibold text-indigo-700">${minColWidthPx}px</span>
            </div>
            <input
              type="range"
              min="120"
              max="420"
              step="10"
              .value=${String(minColWidthPx)}
              @input=${(event) => this.requestNodeUpdate({ minColWidth: Number(event.target.value) })}
              class="w-full"
            />
          </div>
    `;
  }

  renderSidebarSwitcherSettings(node) {
    const sidebarWidthPx = node.sidebarWidth || INSPECTOR_DISPLAY_FALLBACKS.sidebarWidthPx;
    const mainMinPercent = node.mainMinPercent || INSPECTOR_DISPLAY_FALLBACKS.mainMinPercent;
    return html`
          <div class="p-3 rounded-lg bg-indigo-50/60 border border-indigo-100 space-y-3">
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-medium text-slate-700">Sidebar Width</span>
                <span class="font-mono text-xs font-semibold text-indigo-700">${sidebarWidthPx}px</span>
              </div>
              <input
                type="range"
                min="150"
                max="360"
                step="10"
                .value=${String(sidebarWidthPx)}
                @input=${(event) => this.requestNodeUpdate({ sidebarWidth: Number(event.target.value) })}
                class="w-full"
              />
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-medium text-slate-700">Stack When Main &lt;</span>
                <span class="font-mono text-xs font-semibold text-indigo-700">${mainMinPercent}%</span>
              </div>
              <input
                type="range"
                min="45"
                max="80"
                step="1"
                .value=${String(mainMinPercent)}
                @input=${(event) => this.requestNodeUpdate({ mainMinPercent: Number(event.target.value) })}
                class="w-full"
              />
            </div>
          </div>
    `;
  }

  renderClusterAlignmentSettings(node) {
    const selectedAlignment = node.clusterJustify || 'space-between';
    return html`
          <div class="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
            <label class="block text-[11px] font-semibold text-slate-600">Alignment</label>
            <div class="grid grid-cols-2 gap-1">
              ${CLUSTER_ALIGNMENT_OPTIONS.map(option => html`
                <button
                  @click=${() => this.requestNodeUpdate({ clusterJustify: option.id })}
                  class="py-1 px-2 rounded text-xs font-medium border ${
                    selectedAlignment === option.id
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }"
                >
                  ${option.label}
                </button>
              `)}
            </div>
          </div>
    `;
  }

  renderSpacePresetPicker({ label, propertyName, selectedKey }) {
    return html`
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-medium text-slate-700">${label}</span>
              <span class="text-[10px] font-mono text-slate-500">${FLUID_SPACE_PRESETS[selectedKey]?.description}</span>
            </div>
            <div class="grid grid-cols-6 gap-1">
              ${Object.entries(FLUID_SPACE_PRESETS).map(([presetKey, spacePreset]) => html`
                <button
                  @click=${() => this.requestNodeUpdate({ [propertyName]: presetKey })}
                  class="py-1 rounded text-xs font-mono border transition ${
                    selectedKey === presetKey
                      ? 'bg-indigo-600 border-indigo-600 text-white font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }"
                >
                  ${spacePreset.label}
                </button>
              `)}
            </div>
          </div>
    `;
  }

  renderMaxWidthPicker(node) {
    const selectedMaxWidth = node.maxWidth || '100%';
    return html`
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">Max Width</label>
            <div class="grid grid-cols-4 gap-1">
              ${MAX_WIDTH_OPTIONS.map(option => html`
                <button
                  @click=${() => this.requestNodeUpdate({ maxWidth: option.value })}
                  class="py-1 px-1 rounded text-[11px] font-mono border ${
                    selectedMaxWidth === option.value
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }"
                >
                  ${option.label}
                </button>
              `)}
            </div>
          </div>
    `;
  }

  renderLeafControls() {
    const node = this.node;
    return html`
      <div class="space-y-3.5">
        <div class="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
          <i class="ph-fill ph-check-circle text-emerald-600"></i>
          <span><strong>&lt;${node.tag}&gt;</strong> is a leaf element (no child nesting).</span>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1">Text Content</label>
          <textarea
            rows="2"
            .value=${node.text || ''}
            @input=${(event) => this.requestNodeUpdate({ text: event.target.value })}
            class="w-full rounded-lg bg-white border border-slate-300 p-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
          ></textarea>
        </div>

        ${this.renderTypeScalePicker(node.typeScale || 'body')}

        ${this.renderLeafVariantPicker(node.leafVariant || 'plain')}
      </div>
    `;
  }

  renderTypeScalePicker(selectedTypeScale) {
    return html`
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1">Fluid Text Size (clamp)</label>
          <div class="grid grid-cols-3 gap-1">
            ${Object.entries(FLUID_TYPE_PRESETS).map(([typeScaleKey, typePreset]) => html`
              <button
                @click=${() => this.requestNodeUpdate({ typeScale: typeScaleKey })}
                class="py-1.5 px-2 rounded border text-xs font-medium transition ${
                  selectedTypeScale === typeScaleKey
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }"
              >
                ${typePreset.label}
              </button>
            `)}
          </div>
        </div>
    `;
  }

  renderLeafVariantPicker(selectedVariant) {
    return html`
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1">Visual Style</label>
          <div class="grid grid-cols-2 gap-1">
            ${LEAF_VARIANT_OPTIONS.map(variant => html`
              <button
                @click=${() => this.requestNodeUpdate({ leafVariant: variant.id })}
                class="py-1.5 px-2 rounded text-xs border text-left truncate ${
                  selectedVariant === variant.id
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-medium'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }"
              >
                ${variant.label}
              </button>
            `)}
          </div>
        </div>
    `;
  }

  renderSizingInParentControls() {
    if (!this.parentLayoutNode) return nothing;
    const node = this.node;
    const parent = this.parentLayoutNode;
    const spanCols = node.itemProps?.spanCols || INSPECTOR_DISPLAY_FALLBACKS.spanCols;
    const selectedGrow = node.itemProps?.grow || 0;

    return html`
      <div class="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5 mt-3">
        <div class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Sizing Inside &lt;${parent.tag}&gt;
        </div>

        ${parent.behavior === 'bento-12' ? html`
          <div>
            <div class="flex items-center justify-between text-xs mb-1">
              <span class="text-slate-700">Bento Column Span</span>
              <span class="font-mono font-semibold text-indigo-600">${spanCols} / ${BENTO_COLUMN_COUNT}</span>
            </div>
            <input
              type="range"
              min="3"
              max="12"
              step="1"
              .value=${String(spanCols)}
              @input=${(event) => this.requestItemPropsUpdate({ spanCols: Number(event.target.value) })}
              class="w-full"
            />
          </div>
        ` : nothing}

        <div class="flex items-center justify-between">
          <span class="text-xs text-slate-700">Stretch to Fill Space</span>
          <div class="flex gap-1">
            ${GROW_OPTIONS.map(option => html`
              <button
                @click=${() => this.requestItemPropsUpdate({ grow: option.grow })}
                class="px-2.5 py-0.5 rounded text-xs font-medium border ${
                  selectedGrow === option.grow
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white border-slate-200 text-slate-600'
                }"
              >
                ${option.label}
              </button>
            `)}
          </div>
        </div>
      </div>
    `;
  }

  renderChromeControls() {
    const node = this.node;
    if (isConcreteLeaf(node.tag)) {
      return html`
        <div class="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
          Select a structural container (like <code class="font-mono">header</code>, <code class="font-mono">aside</code>, or <code class="font-mono">footer</code>) to configure sticky or fixed website chrome.
        </div>
      `;
    }

    const chrome = node.chrome || DEFAULT_CHROME_SETTINGS;

    return html`
      <div class="space-y-4">
        ${this.renderChromeModePicker(chrome)}

        ${isPinnedChrome(chrome) ? this.renderPinSettings(chrome) : nothing}

        ${this.renderSurfaceSettings(chrome)}
      </div>
    `;
  }

  renderChromeModePicker(chrome) {
    return html`
        <div>
          <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Positioning Mode
          </label>
          <div class="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
            ${CHROME_MODE_OPTIONS.map(modeOption => html`
              <button
                @click=${() => this.requestChromeUpdate({ mode: modeOption.id })}
                class="py-1.5 rounded-md text-xs font-medium transition ${
                  chrome.mode === modeOption.id
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }"
              >
                ${modeOption.label}
              </button>
            `)}
          </div>
        </div>
    `;
  }

  renderPinSettings(chrome) {
    const selectedEdge = chrome.edge || 'top';
    const offsetPx = chrome.offset || 0;
    return html`
          <div class="p-3 rounded-lg bg-amber-50/70 border border-amber-200 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-slate-700">Pin Edge</span>
              <div class="flex gap-1">
                ${PIN_EDGES.map(edge => html`
                  <button
                    @click=${() => this.requestChromeUpdate({ edge })}
                    class="px-2.5 py-1 rounded text-xs font-medium capitalize border ${
                      selectedEdge === edge
                        ? 'bg-amber-600 border-amber-600 text-white'
                        : 'bg-white border-amber-200 text-slate-700'
                    }"
                  >
                    ${edge}
                  </button>
                `)}
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="text-slate-700">Offset Distance</span>
                <span class="font-mono font-semibold text-amber-800">${offsetPx}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="4"
                .value=${String(offsetPx)}
                @input=${(event) => this.requestChromeUpdate({ offset: Number(event.target.value) })}
                class="w-full"
              />
            </div>
          </div>
    `;
  }

  renderSurfaceSettings(chrome) {
    const selectedSurface = chrome.surface || 'transparent';
    return html`
        <div class="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5">
          <label class="block text-xs font-medium text-slate-700">Surface Color</label>
          <div class="grid grid-cols-2 gap-1.5">
            ${SURFACE_COLOR_OPTIONS.map(surfaceOption => html`
              <button
                @click=${() => this.requestChromeUpdate({ surface: surfaceOption.value })}
                class="py-1.5 px-2 rounded text-xs border text-left truncate ${
                  selectedSurface === surfaceOption.value
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-medium'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }"
              >
                ${surfaceOption.label}
              </button>
            `)}
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-slate-200">
            <span class="text-xs text-slate-700">Card Border</span>
            <input
              type="checkbox"
              .checked=${Boolean(chrome.border)}
              @change=${(event) => this.requestChromeUpdate({ border: event.target.checked })}
              class="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-700">Backdrop Blur</span>
            <input
              type="checkbox"
              .checked=${Boolean(chrome.blur)}
              @change=${(event) => this.requestChromeUpdate({ blur: event.target.checked })}
              class="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </div>
        </div>
    `;
  }

  renderInsertAndTagControls() {
    const node = this.node;
    const isLeaf = isConcreteLeaf(node.tag);
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;

    return html`
      <div class="space-y-4">
        ${!isLeaf ? this.renderAddChildButtons(node) : nothing}

        ${this.renderNameFields(node)}

        ${this.renderTagSwitcher(node, hasChildren)}
      </div>
    `;
  }

  renderAddChildButtons(node) {
    return html`
          <div class="p-3 rounded-lg bg-indigo-50/50 border border-indigo-100 space-y-2.5">
            <label class="block text-xs font-semibold text-indigo-950">
              Add Inside &lt;${node.tag}&gt;
            </label>
            <div class="text-[11px] text-slate-600">Add Sub-Structure (Can Nest):</div>
            <div class="grid grid-cols-3 gap-1">
              ${INSERTABLE_STRUCTURE_TAGS.map(tag => html`
                <button
                  @click=${() => this.requestAddChild(tag)}
                  class="py-1.5 rounded bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200 text-indigo-700 font-mono text-xs transition"
                >
                  + ${tag}
                </button>
              `)}
            </div>

            <div class="text-[11px] text-slate-600 pt-1">Add Content Element (Leaf):</div>
            <div class="grid grid-cols-4 gap-1">
              ${INSERTABLE_LEAF_TAGS.map(tag => html`
                <button
                  @click=${() => this.requestAddChild(tag)}
                  class="py-1.5 rounded bg-white hover:bg-emerald-600 hover:text-white border border-emerald-200 text-emerald-700 font-mono text-xs transition"
                >
                  + ${tag}
                </button>
              `)}
            </div>
          </div>
    `;
  }

  renderNameFields(node) {
    return html`
        <div class="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5">
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">Label</label>
            <input
              type="text"
              .value=${node.name || ''}
              @input=${(event) => this.requestNodeUpdate({ name: event.target.value })}
              class="w-full px-2.5 py-1.5 rounded bg-white border border-slate-300 text-xs text-slate-900"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">CSS Class</label>
            <input
              type="text"
              .value=${node.className || ''}
              @input=${(event) => this.requestNodeUpdate({ className: event.target.value.replace(INVALID_CLASS_NAME_CHARACTERS, '-') })}
              class="w-full px-2.5 py-1.5 rounded bg-white border border-slate-300 font-mono text-xs text-indigo-700"
            />
          </div>
        </div>
    `;
  }

  renderTagSwitcher(node, hasChildren) {
    return html`
        <div class="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
          <label class="block text-xs font-medium text-slate-700">HTML Tag</label>
          <div class="grid grid-cols-3 gap-1">
            ${STRUCTURAL_TAGS.map(structuralTag => html`
              <button
                @click=${() => this.requestNodeUpdate({ tag: structuralTag.tag, children: node.children || [] })}
                class="py-1 rounded font-mono text-xs border ${
                  node.tag === structuralTag.tag
                    ? 'bg-sky-600 border-sky-600 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }"
              >
                &lt;${structuralTag.tag}&gt;
              </button>
            `)}
          </div>

          ${!hasChildren ? html`
            <div class="grid grid-cols-4 gap-1 pt-1">
              ${CONCRETE_LEAF_TAGS.map(leafTag => html`
                <button
                  @click=${() => this.requestConversionToLeaf(leafTag)}
                  class="py-1 rounded font-mono text-xs border ${
                    node.tag === leafTag.tag
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }"
                >
                  &lt;${leafTag.tag}&gt;
                </button>
              `)}
            </div>
          ` : nothing}
        </div>
    `;
  }
}
customElements.define('visual-inspector-panel', VisualInspectorPanel);
