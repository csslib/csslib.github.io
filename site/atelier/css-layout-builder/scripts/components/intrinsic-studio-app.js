// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { html, nothing } from 'lit';
import { OpenShadowElement } from './open-shadow-element.js';
import { DEFAULT_VIEWPORT_WIDTH_PX, FALLBACK_LEAF_TAG } from '../config/constants.js';
import { ARCHITECTURE_PRESETS } from '../data/architecture-presets.js';
import { createLeafNode, createStructureNode, createUniqueId, findNodeWithParent, isConcreteLeaf } from '../tree/layout-tree.js';

const QUICK_ADD_STRUCTURE_TAG = 'section';
const TOAST_DURATION_MS = 2500;
const DEFAULT_PRESET_KEY = 'saas-shell';
const INITIAL_SELECTED_NODE_ID = 'workspace-body';

class IntrinsicStudioApp extends OpenShadowElement {
  static properties = {
    activePresetKey: { type: String },
    tree: { type: Object },
    selectedNodeId: { type: String },
    viewportWidth: { type: Number },
    isExportOpen: { type: Boolean },
    isStructurePanelVisible: { type: Boolean },
    isInspectorPanelVisible: { type: Boolean },
    toastMessage: { type: String }
  };

  constructor() {
    super();
    this.activePresetKey = DEFAULT_PRESET_KEY;
    this.tree = structuredClone(ARCHITECTURE_PRESETS[DEFAULT_PRESET_KEY].tree);
    this.selectedNodeId = INITIAL_SELECTED_NODE_ID;
    this.viewportWidth = DEFAULT_VIEWPORT_WIDTH_PX;
    this.isExportOpen = false;
    this.isStructurePanelVisible = true;
    this.isInspectorPanelVisible = true;
    this.toastMessage = '';
  }

  render() {
    const selection = findNodeWithParent(this.tree, this.selectedNodeId);

    return html`
      <div
        @select-node=${this.handleSelectNode}
        @update-node=${this.handleUpdateNode}
        @add-child-node=${this.handleAddChildNode}
        @add-specific-child=${this.handleAddSpecificChild}
        @delete-node=${this.handleDeleteNode}
        @viewport-width-change=${(event) => { this.viewportWidth = event.detail.width; }}
        @close-export=${() => { this.isExportOpen = false; }}
        class="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 text-slate-900"
      >
        ${this.renderTopBar()}
        ${this.renderWorkspace(selection)}

        <code-export-modal
          .isOpen=${this.isExportOpen}
          .tree=${this.tree}
        ></code-export-modal>
      </div>
    `;
  }

  showToast(message) {
    this.toastMessage = message;
    setTimeout(() => {
      if (this.toastMessage === message) this.toastMessage = '';
    }, TOAST_DURATION_MS);
  }

  loadPreset(presetKey) {
    const preset = ARCHITECTURE_PRESETS[presetKey];
    if (!preset) return;
    this.activePresetKey = presetKey;
    this.tree = structuredClone(preset.tree);
    this.selectedNodeId = this.tree.id;
    this.showToast(`Loaded ${preset.name}`);
  }

  handleSelectNode(event) {
    this.selectedNodeId = event.detail.id;
    this.isInspectorPanelVisible = true;
  }

  handleUpdateNode(event) {
    const { id, patch } = event.detail;
    const nextTree = structuredClone(this.tree);
    const { node } = findNodeWithParent(nextTree, id);
    if (!node) return;
    Object.assign(node, patch);
    this.tree = nextTree;
  }

  handleAddChildNode(event) {
    const { parentId, isLeafType } = event.detail;
    this.addChildNode(parentId, isLeafType ? FALLBACK_LEAF_TAG : QUICK_ADD_STRUCTURE_TAG);
  }

  handleAddSpecificChild(event) {
    const { parentId, tag } = event.detail;
    this.addChildNode(parentId, tag);
  }

  handleDeleteNode(event) {
    const { id } = event.detail;
    if (id === this.tree.id) {
      this.showToast('Cannot delete the root layout shell.');
      return;
    }
    const nextTree = structuredClone(this.tree);
    const { parent } = findNodeWithParent(nextTree, id);
    if (!parent || !Array.isArray(parent.children)) return;
    parent.children = parent.children.filter(child => child.id !== id);
    this.tree = nextTree;
    if (this.selectedNodeId === id) {
      this.selectedNodeId = parent.id;
    }
    this.showToast('Removed element');
  }

  addChildNode(parentId, tag) {
    const nextTree = structuredClone(this.tree);
    const { node: parent } = findNodeWithParent(nextTree, parentId);
    if (!parent || isConcreteLeaf(parent.tag)) {
      this.showToast('Leaf elements cannot nest child structures.');
      return;
    }

    parent.children = parent.children || [];
    const newNodeId = createUniqueId(tag);
    const newNode = isConcreteLeaf(tag)
      ? createLeafNode(tag, newNodeId)
      : createStructureNode(tag, newNodeId);
    parent.children.push(newNode);

    this.tree = nextTree;
    this.selectedNodeId = newNodeId;
    this.showToast(`Added <${tag}>`);
  }

  renderTopBar() {
    return html`
        <header class="suite-header h-12 bg-white border-b border-slate-200 px-3 sm:px-4 flex items-center justify-between gap-3 shrink-0 z-30">
          <div class="flex items-center gap-2.5">
            <suite-nav></suite-nav>
          </div>

          ${this.renderPresetSwitcher()}

          <div class="flex items-center gap-2">
            ${this.toastMessage ? html`
              <span class="hidden lg:inline-flex items-center px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
                ${this.toastMessage}
              </span>
            ` : nothing}

            <button
              @click=${() => { this.isExportOpen = true; }}
              class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <i class="ph-bold ph-code"></i>
              <span>Export Code</span>
            </button>

            ${this.renderPanelToggle({
              isActive: this.isStructurePanelVisible,
              title: 'Toggle Structure Tree',
              icon: 'ph-sidebar-simple',
              onToggle: () => { this.isStructurePanelVisible = !this.isStructurePanelVisible; }
            })}

            ${this.renderPanelToggle({
              isActive: this.isInspectorPanelVisible,
              title: 'Toggle Inspector Panel',
              icon: 'ph-sliders-horizontal',
              onToggle: () => { this.isInspectorPanelVisible = !this.isInspectorPanelVisible; }
            })}
          </div>
        </header>
    `;
  }

  renderPanelToggle({ isActive, title, icon, onToggle }) {
    return html`
            <button
              @click=${onToggle}
              class="p-1.5 rounded-lg border text-xs flex items-center gap-1 transition ${
                isActive
                  ? 'bg-slate-100 border-slate-300 text-slate-800'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }"
              title=${title}
            >
              <i class="ph ${icon} text-sm"></i>
            </button>
    `;
  }

  renderPresetSwitcher() {
    return html`
          <div class="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 gap-0.5">
            ${Object.entries(ARCHITECTURE_PRESETS).map(([presetKey, preset]) => html`
              <button
                @click=${() => this.loadPreset(presetKey)}
                class="px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  this.activePresetKey === presetKey
                    ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }"
              >
                ${preset.name}
              </button>
            `)}
          </div>
    `;
  }

  renderWorkspace(selection) {
    return html`
        <div class="flex-1 flex overflow-hidden min-h-0 relative">
          ${this.isStructurePanelVisible ? html`
            <structure-tree-panel
              class="flex h-full shrink-0"
              .tree=${this.tree}
              .selectedNodeId=${this.selectedNodeId}
            ></structure-tree-panel>
          ` : nothing}

          <viewport-stage
            class="flex flex-1 min-w-0 h-full"
            .tree=${this.tree}
            .selectedNodeId=${this.selectedNodeId}
            .viewportWidth=${this.viewportWidth}
          ></viewport-stage>

          ${this.isInspectorPanelVisible ? html`
            <visual-inspector-panel
              class="flex h-full shrink-0"
              .node=${selection.node}
              .parentLayoutNode=${selection.parent}
            ></visual-inspector-panel>
          ` : nothing}
        </div>
    `;
  }
}
customElements.define('intrinsic-studio-app', IntrinsicStudioApp);
