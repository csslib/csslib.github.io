// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { html, nothing } from 'lit';
import { OpenShadowElement } from './open-shadow-element.js';
import { isConcreteLeaf, isPinnedChrome } from '../tree/layout-tree.js';

const TREE_BASE_INDENT_PX = 8;
const TREE_INDENT_PER_DEPTH_PX = 12;

class StructureTreePanel extends OpenShadowElement {
  static properties = {
    tree: { type: Object },
    selectedNodeId: { type: String },
    collapsedIds: { type: Object }
  };

  constructor() {
    super();
    this.collapsedIds = new Set();
  }

  render() {
    if (!this.tree) return nothing;
    return html`
      <aside class="w-64 bg-white border-r border-slate-200 flex flex-col h-full select-none shrink-0">
        <div class="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <i class="ph ph-tree-structure text-indigo-600"></i>
            Page Structure
          </span>
          <div class="flex items-center gap-2 text-[10px] text-slate-500">
            <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-sky-500"></span>Box</span>
            <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Leaf</span>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-2">
          ${this.renderTreeNode(this.tree, 0, true)}
        </div>
      </aside>
    `;
  }

  toggleCollapsed(nodeId, event) {
    event.stopPropagation();
    const nextCollapsedIds = new Set(this.collapsedIds);
    if (nextCollapsedIds.has(nodeId)) nextCollapsedIds.delete(nodeId);
    else nextCollapsedIds.add(nodeId);
    this.collapsedIds = nextCollapsedIds;
  }

  requestSelect(nodeId, event) {
    event.stopPropagation();
    this.emitComposedEvent('select-node', { id: nodeId });
  }

  requestAddChild(parentId, event) {
    event.stopPropagation();
    this.emitComposedEvent('add-child-node', { parentId, isLeafType: false });
  }

  requestDelete(nodeId, event) {
    event.stopPropagation();
    this.emitComposedEvent('delete-node', { id: nodeId });
  }

  renderTreeNode(node, depth = 0, isRoot = false) {
    const isLeaf = isConcreteLeaf(node.tag);
    const hasChildren = !isLeaf && node.children && node.children.length > 0;
    const isExpanded = !this.collapsedIds.has(node.id);

    return html`
      <div>
        ${this.renderTreeRow(node, { depth, isRoot, isLeaf, isExpanded })}

        ${hasChildren && isExpanded
          ? html`
              <div>
                ${node.children.map(child => this.renderTreeNode(child, depth + 1, false))}
              </div>
            `
          : nothing
        }
      </div>
    `;
  }

  renderTreeRow(node, { depth, isRoot, isLeaf, isExpanded }) {
    const isSelected = this.selectedNodeId === node.id;
    const indentPx = depth * TREE_INDENT_PER_DEPTH_PX + TREE_BASE_INDENT_PX;

    return html`
        <div
          @click=${(event) => this.requestSelect(node.id, event)}
          style="padding-left: ${indentPx}px"
          class="group flex items-center justify-between py-1.5 pr-2 rounded-lg cursor-pointer transition-colors text-xs mb-0.5 ${
            isSelected
              ? 'bg-indigo-50 text-indigo-950 font-semibold ring-1 ring-indigo-200'
              : 'hover:bg-slate-100 text-slate-700'
          }"
        >
          <div class="flex items-center gap-1.5 min-w-0 flex-1">
            ${isLeaf ? this.renderLeafBullet() : this.renderExpandToggle(node.id, isExpanded)}

            <span class="font-mono text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
              isLeaf
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-sky-50 text-sky-700 border border-sky-200'
            }">
              ${node.tag}
            </span>

            <span class="truncate">${node.name}</span>
          </div>

          <div class="flex items-center gap-1 shrink-0 ml-1">
            ${isPinnedChrome(node.chrome) ? this.renderPinBadge(node.chrome) : nothing}
            ${!isLeaf ? this.renderAddChildButton(node) : nothing}
            ${!isRoot ? this.renderDeleteButton(node.id) : nothing}
          </div>
        </div>
    `;
  }

  renderExpandToggle(nodeId, isExpanded) {
    return html`
                  <button
                    @click=${(event) => this.toggleCollapsed(nodeId, event)}
                    class="w-4 h-4 flex items-center justify-center rounded hover:bg-slate-200/70 text-slate-400"
                  >
                    <i class="ph ${isExpanded ? 'ph-caret-down' : 'ph-caret-right'} text-[10px]"></i>
                  </button>
    `;
  }

  renderLeafBullet() {
    return html`<span class="w-4 h-4 flex items-center justify-center text-emerald-500"><i class="ph-fill ph-circle text-[5px]"></i></span>`;
  }

  renderPinBadge(chrome) {
    return html`
                  <span
                    title="${chrome.mode} (${chrome.edge})"
                    class="px-1.5 py-0.5 text-[9px] font-mono rounded bg-amber-100 text-amber-800"
                  >
                    📌
                  </span>
    `;
  }

  renderAddChildButton(node) {
    return html`
                  <button
                    @click=${(event) => this.requestAddChild(node.id, event)}
                    title="Add sub-structure inside <${node.tag}>"
                    class="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-indigo-100 text-slate-500 hover:text-indigo-700 transition"
                  >
                    <i class="ph-bold ph-plus text-[10px]"></i>
                  </button>
    `;
  }

  renderDeleteButton(nodeId) {
    return html`
                  <button
                    @click=${(event) => this.requestDelete(nodeId, event)}
                    title="Remove"
                    class="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition"
                  >
                    <i class="ph ph-trash text-[11px]"></i>
                  </button>
    `;
  }
}
customElements.define('structure-tree-panel', StructureTreePanel);
