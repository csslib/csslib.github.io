// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { FALLBACK_FLEX_ITEM, FALLBACK_GRID_CELL, FALLBACK_GRID_COLUMNS } from '../../config/constants.js';

export const FLEXBOX_AND_GRID_ENGINES = [
  {
    id: 'flex-grow-shrink',
    name: 'Flexbox Layout & Item Sizing Builder',
    category: 'Flexbox & Grid',
    badge: 'Add/Edit Any Item',
    difficulty: 'Intermediate',
    summary: 'Add or remove flex items, click any item on the stage to customize its individual flex-grow, flex-shrink, and flex-basis, and test container wrapping & alignment.',
    gizmoType: 'flex-simulator',
    syntaxAnatomy: '.flex-container {\n  display: flex;\n  flex-wrap: [wrap];\n  justify-content: [justify];\n  align-items: [align];\n  gap: [gap]px;\n}\n.flex-item-selected {\n  flex: [grow] [shrink] [basis]px;\n}',
    mentalModel: 'Click any Flex Item on the stage to select it and edit its individual flex-grow, flex-shrink, and flex-basis! Add or remove items and scrub the Container Width slider to see how free space is distributed.',
    gotchas: [
      'flex: 1 is shorthand for flex: 1 1 0%, whereas flex: auto is shorthand for flex: 1 1 auto.',
      'Setting flex-shrink: 0 prevents an icon, avatar, or button from squishing when space gets tight.'
    ],
    challenge: {
      title: 'Multi-Item Flex Playground (4+ Items)',
      description: 'Add at least 4 flex items to the container and give the selected item flex-grow >= 2.',
      check: (values) => Array.isArray(values.items) && values.items.length >= 4 && (values.items[values.selectedIdx]?.grow >= 2)
    },
    defaultState: {
      containerW: 410,
      gap: 10,
      justify: 'flex-start',
      align: 'stretch',
      wrap: 'nowrap',
      selectedIdx: 1,
      items: [
        { label: 'Nav', grow: 0, shrink: 0, basis: 70 },
        { label: 'Main Hero', grow: 2, shrink: 1, basis: 110 },
        { label: 'Sidebar', grow: 1, shrink: 1, basis: 80 }
      ]
    },
    controls: [],
    presets: [
      {
        name: 'App Shell (Fixed Nav + Fluid Main)',
        values: {
          containerW: 420, gap: 10, justify: 'flex-start', align: 'stretch', wrap: 'nowrap', selectedIdx: 1,
          items: [
            { label: 'Nav', grow: 0, shrink: 0, basis: 75 },
            { label: 'Fluid Content', grow: 3, shrink: 1, basis: 120 },
            { label: 'Aside', grow: 1, shrink: 1, basis: 75 }
          ]
        }
      },
      {
        name: 'Responsive Wrapping Pills (5 Items)',
        values: {
          containerW: 360, gap: 8, justify: 'center', align: 'center', wrap: 'wrap', selectedIdx: 0,
          items: [
            { label: 'Design', grow: 1, shrink: 1, basis: 95 },
            { label: 'Frontend', grow: 2, shrink: 1, basis: 110 },
            { label: 'CSS Grid', grow: 1, shrink: 1, basis: 95 },
            { label: 'Lit HTML', grow: 1, shrink: 1, basis: 100 },
            { label: 'Animation', grow: 2, shrink: 1, basis: 110 }
          ]
        }
      },
      {
        name: 'Space-Between Toolbar',
        values: {
          containerW: 420, gap: 12, justify: 'space-between', align: 'center', wrap: 'nowrap', selectedIdx: 1,
          items: [
            { label: 'Logo', grow: 0, shrink: 0, basis: 70 },
            { label: 'Search', grow: 0, shrink: 1, basis: 140 },
            { label: 'Profile', grow: 0, shrink: 0, basis: 70 }
          ]
        }
      }
    ],
    buildCss: (values) => {
      const selectedItem = (values.items || [])[values.selectedIdx] || FALLBACK_FLEX_ITEM;
      return `.flex-container {\n  display: flex;\n  flex-wrap: ${values.wrap};\n  justify-content: ${values.justify};\n  align-items: ${values.align};\n  gap: ${values.gap}px;\n}\n/* Selected Item #${(values.selectedIdx || 0) + 1} (${selectedItem.label}) */\n.flex-item-${(values.selectedIdx || 0) + 1} {\n  flex: ${selectedItem.grow} ${selectedItem.shrink} ${selectedItem.basis}px;\n}`;
    }
  },

  {
    id: 'grid-template-layout',
    name: 'CSS Grid Track & Bento Span Builder',
    category: 'Flexbox & Grid',
    badge: 'Dynamic Tracks & Spans',
    difficulty: 'Intermediate',
    summary: 'Add or remove any number of grid columns, customize each column\'s fr/px sizing, add grid cells, and click any cell to change its column and row span!',
    gizmoType: 'grid-simulator',
    syntaxAnatomy: '.grid-container {\n  display: grid;\n  grid-template-columns: [track1] [track2] ...;\n  gap: [rowGap]px [colGap]px;\n}\n.cell-selected {\n  grid-column: span [colSpan];\n  grid-row: span [rowSpan];\n}',
    mentalModel: 'Add or remove columns and adjust each track\'s fractional weight (fr). Click any cell on the stage to make it span multiple columns or rows to build modern Bento grids!',
    gotchas: [
      'Use grid-auto-flow: dense when you want smaller grid items to automatically backfill empty gaps left by large spanning items!'
    ],
    challenge: {
      title: 'Bento Dashboard Grid (4+ Columns)',
      description: 'Add a 4th column track (or select the Bento preset) and make a cell span at least 2 columns.',
      check: (values) => Array.isArray(values.cols) && values.cols.length >= 4 && (values.cells || []).some(cell => cell.colSpan >= 2)
    },
    defaultState: {
      cols: [1, 2, 1],
      rowGap: 10,
      colGap: 12,
      dense: true,
      selectedCellIdx: 0,
      cells: [
        { name: 'Hero Metric', colSpan: 2, rowSpan: 1 },
        { name: 'Status', colSpan: 1, rowSpan: 2 },
        { name: 'Traffic', colSpan: 1, rowSpan: 1 },
        { name: 'Conversion', colSpan: 1, rowSpan: 1 },
        { name: 'Footer Bar', colSpan: 3, rowSpan: 1 }
      ]
    },
    controls: [],
    presets: [
      {
        name: 'Bento Box 4-Column',
        values: {
          cols: [1, 1, 1, 1], rowGap: 10, colGap: 10, dense: true, selectedCellIdx: 0,
          cells: [
            { name: 'Feature A', colSpan: 2, rowSpan: 2 },
            { name: 'Stat B', colSpan: 2, rowSpan: 1 },
            { name: 'Mini C', colSpan: 1, rowSpan: 1 },
            { name: 'Mini D', colSpan: 1, rowSpan: 1 },
            { name: 'Wide Banner', colSpan: 4, rowSpan: 1 }
          ]
        }
      },
      {
        name: 'Holy Grail (1fr 2.5fr 1fr)',
        values: {
          cols: [1, 2.5, 1], rowGap: 12, colGap: 12, dense: false, selectedCellIdx: 0,
          cells: [
            { name: 'Header', colSpan: 3, rowSpan: 1 },
            { name: 'Nav', colSpan: 1, rowSpan: 1 },
            { name: 'Main Article', colSpan: 1, rowSpan: 1 },
            { name: 'Ads', colSpan: 1, rowSpan: 1 },
            { name: 'Footer', colSpan: 3, rowSpan: 1 }
          ]
        }
      }
    ],
    buildCss: (values) => {
      const columnTracks = (values.cols || FALLBACK_GRID_COLUMNS).map(fraction => `${fraction}fr`).join(' ');
      const selectedCell = (values.cells || [])[values.selectedCellIdx] || FALLBACK_GRID_CELL;
      return `.grid-container {\n  display: grid;\n  grid-template-columns: ${columnTracks};\n  grid-auto-flow: ${values.dense ? ' row dense' : 'row'};\n  gap: ${values.rowGap}px ${values.colGap}px;\n}\n/* Selected Cell: ${selectedCell.name} */\n.grid-cell-${(values.selectedCellIdx || 0) + 1} {\n  grid-column: span ${selectedCell.colSpan};\n  grid-row: span ${selectedCell.rowSpan};\n}`;
    }
  }
];
