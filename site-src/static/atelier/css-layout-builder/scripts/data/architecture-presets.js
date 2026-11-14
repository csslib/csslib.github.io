// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

export const ARCHITECTURE_PRESETS = {
  'saas-shell': {
    name: 'SaaS App Shell',
    description: 'Sticky topbar, responsive sidebar switcher, auto-fitting cards, and bottom bar.',
    tree: {
      id: 'root-shell',
      name: 'Website Shell',
      tag: 'div',
      className: 'app-shell',
      behavior: 'pancake-stack',
      gap: 'none',
      padding: 'none',
      maxWidth: '100%',
      containerQuery: true,
      chrome: { mode: 'static', edge: 'top', offset: 0, zIndex: 1, blur: false, surface: '#f8fafc', border: false },
      itemProps: { spanCols: 12, grow: 1, pushBottom: false },
      children: [
        {
          id: 'global-header',
          name: 'Sticky Top Header',
          tag: 'header',
          className: 'site-header',
          behavior: 'cluster-flow',
          clusterJustify: 'space-between',
          clusterWrap: 'wrap',
          gap: 'sm',
          padding: 'sm',
          maxWidth: '100%',
          containerQuery: false,
          chrome: { mode: 'sticky', edge: 'top', offset: 0, zIndex: 30, blur: true, surface: 'rgba(255, 255, 255, 0.9)', border: true },
          itemProps: { spanCols: 12, grow: 0, pushBottom: false },
          children: [
            {
              id: 'brand-cluster',
              name: 'Brand Group',
              tag: 'div',
              className: 'brand-group',
              behavior: 'cluster-flow',
              clusterJustify: 'flex-start',
              clusterWrap: 'nowrap',
              gap: 'xs',
              padding: 'none',
              maxWidth: '100%',
              chrome: { mode: 'static', edge: 'top', offset: 0, zIndex: 1, blur: false, surface: 'transparent', border: false },
              itemProps: { spanCols: 4, grow: 0, pushBottom: false },
              children: [
                { id: 'brand-badge', name: 'Logo Badge', tag: 'span', className: 'logo-badge', text: '✦ FlowUI', typeScale: 'caption', leafVariant: 'badge-indigo', itemProps: { grow: 0 } },
                { id: 'brand-title', name: 'Site Title', tag: 'h3', className: 'workspace-name', text: 'Cloud Console', typeScale: 'body', leafVariant: 'plain', itemProps: { grow: 0 } }
              ]
            },
            {
              id: 'header-nav',
              name: 'Navigation Bar',
              tag: 'ul',
              className: 'top-nav-list',
              behavior: 'cluster-flow',
              clusterJustify: 'flex-end',
              clusterWrap: 'wrap',
              gap: 'xs',
              padding: 'none',
              maxWidth: '100%',
              chrome: { mode: 'static', edge: 'top', offset: 0, zIndex: 1, blur: false, surface: 'transparent', border: false },
              itemProps: { spanCols: 8, grow: 0, pushBottom: false },
              children: [
                { id: 'nav-li-1', name: 'Overview Item', tag: 'li', className: 'nav-pill', text: 'Overview', typeScale: 'caption', leafVariant: 'nav-item', itemProps: { grow: 0 } },
                { id: 'nav-li-2', name: 'Analytics Item', tag: 'li', className: 'nav-pill', text: 'Analytics', typeScale: 'caption', leafVariant: 'nav-item', itemProps: { grow: 0 } },
                { id: 'nav-li-3', name: 'Primary CTA', tag: 'button', className: 'cta-btn', text: 'New Project', typeScale: 'caption', leafVariant: 'btn-primary', itemProps: { grow: 0 } }
              ]
            }
          ]
        },
        {
          id: 'workspace-body',
          name: 'Sidebar + Main Layout',
          tag: 'div',
          className: 'workspace-split',
          behavior: 'sidebar-switcher',
          sidebarWidth: 220,
          mainMinPercent: 62,
          sidebarSide: 'left',
          gap: 'md',
          padding: 'md',
          maxWidth: '1280px',
          containerQuery: true,
          chrome: { mode: 'static', edge: 'top', offset: 0, zIndex: 1, blur: false, surface: 'transparent', border: false },
          itemProps: { spanCols: 12, grow: 1, pushBottom: false },
          children: [
            {
              id: 'sidebar-rail',
              name: 'Sticky Sidebar',
              tag: 'aside',
              className: 'sidebar-rail',
              behavior: 'pancake-stack',
              gap: 'xs',
              padding: 'sm',
              maxWidth: '100%',
              containerQuery: false,
              chrome: { mode: 'sticky', edge: 'top', offset: 68, zIndex: 10, blur: false, surface: '#ffffff', border: true },
              itemProps: { spanCols: 3, grow: 0, pushBottom: false },
              children: [
                { id: 'side-heading', name: 'Menu Label', tag: 'span', className: 'rail-label', text: 'WORKSPACE', typeScale: 'caption', leafVariant: 'badge-slate', itemProps: { grow: 0 } },
                { id: 'side-link-1', name: 'Nav: Deployments', tag: 'a', className: 'rail-link', text: 'Deployments', typeScale: 'body', leafVariant: 'link-block', itemProps: { grow: 0 } },
                { id: 'side-link-2', name: 'Nav: Storage', tag: 'a', className: 'rail-link', text: 'Storage Mesh', typeScale: 'body', leafVariant: 'link-block', itemProps: { grow: 0 } },
                { id: 'side-link-3', name: 'Nav: Activity', tag: 'a', className: 'rail-link', text: 'Activity Stream', typeScale: 'body', leafVariant: 'link-block', itemProps: { grow: 0 } }
              ]
            },
            {
              id: 'main-content-zone',
              name: 'Main Content Area',
              tag: 'main',
              className: 'main-zone',
              behavior: 'pancake-stack',
              gap: 'md',
              padding: 'none',
              maxWidth: '100%',
              containerQuery: true,
              chrome: { mode: 'static', edge: 'top', offset: 0, zIndex: 1, blur: false, surface: 'transparent', border: false },
              itemProps: { spanCols: 9, grow: 1, pushBottom: false },
              children: [
                {
                  id: 'hero-banner',
                  name: 'Hero Welcome Card',
                  tag: 'section',
                  className: 'hero-banner',
                  behavior: 'pancake-stack',
                  gap: 'xs',
                  padding: 'md',
                  maxWidth: '100%',
                  chrome: { mode: 'static', edge: 'top', offset: 0, zIndex: 1, blur: false, surface: '#eef2ff', border: true },
                  itemProps: { spanCols: 12, grow: 0, pushBottom: false },
                  children: [
                    { id: 'hero-pill', name: 'Status Badge', tag: 'span', className: 'status-tag', text: 'INTRINSIC CSS', typeScale: 'caption', leafVariant: 'badge-indigo', itemProps: { grow: 0 } },
                    { id: 'hero-h1', name: 'Headline', tag: 'h1', className: 'hero-title', text: 'Resize the Viewport Width to Test Reflow', typeScale: 'h2', leafVariant: 'plain', itemProps: { grow: 0 } },
                    { id: 'hero-desc', name: 'Description', tag: 'p', className: 'hero-copy', text: 'Click any section on this page to adjust how it wraps, stacks, or pins when screen space changes.', typeScale: 'body', leafVariant: 'prose', itemProps: { grow: 0 } }
                  ]
                },
                {
                  id: 'metrics-grid',
                  name: 'Auto-Wrapping Card Grid',
                  tag: 'section',
                  className: 'metrics-grid',
                  behavior: 'ram-grid',
                  minColWidth: 200,
                  gridStretch: 'auto-fit',
                  gap: 'sm',
                  padding: 'none',
                  maxWidth: '100%',
                  containerQuery: false,
                  chrome: { mode: 'static', edge: 'top', offset: 0, zIndex: 1, blur: false, surface: 'transparent', border: false },
                  itemProps: { spanCols: 12, grow: 0, pushBottom: false },
                  children: [
                    {
                      id: 'card-1',
                      name: 'Feature Card 1',
                      tag: 'article',
                      className: 'metric-card',
                      behavior: 'pancake-stack',
                      gap: 'xs',
                      padding: 'sm',
                      maxWidth: '100%',
                      chrome: { mode: 'static', edge: 'top', offset: 0, zIndex: 1, blur: false, surface: '#ffffff', border: true },
                      itemProps: { spanCols: 4, grow: 1, pushBottom: false },
                      children: [
                        { id: 'c1-tag', name: 'Tag', tag: 'span', className: 'card-kicker', text: 'AUTO-FIT GRID', typeScale: 'caption', leafVariant: 'badge-emerald', itemProps: { grow: 0 } },
                        { id: 'c1-h3', name: 'Title', tag: 'h3', className: 'card-val', text: 'Smart Columns', typeScale: 'h3', leafVariant: 'plain', itemProps: { grow: 0 } },
                        { id: 'c1-p', name: 'Copy', tag: 'p', className: 'card-desc', text: 'Drops from 3 to 2 to 1 column automatically below 200px.', typeScale: 'caption', leafVariant: 'prose', itemProps: { grow: 0 } }
                      ]
                    },
                    {
                      id: 'card-2',
                      name: 'Feature Card 2',
                      tag: 'article',
                      className: 'metric-card',
                      behavior: 'pancake-stack',
                      gap: 'xs',
                      padding: 'sm',
                      maxWidth: '100%',
                      chrome: { mode: 'static', edge: 'top', offset: 0, zIndex: 1, blur: false, surface: '#ffffff', border: true },
                      itemProps: { spanCols: 4, grow: 1, pushBottom: false },
                      children: [
                        { id: 'c2-tag', name: 'Tag', tag: 'span', className: 'card-kicker', text: 'SWITCHER', typeScale: 'caption', leafVariant: 'badge-indigo', itemProps: { grow: 0 } },
                        { id: 'c2-h3', name: 'Title', tag: 'h3', className: 'card-val', text: 'Adaptive Sidebar', typeScale: 'h3', leafVariant: 'plain', itemProps: { grow: 0 } },
                        { id: 'c2-p', name: 'Copy', tag: 'p', className: 'card-desc', text: 'Sidebar stays on the left when wide and stacks on top when narrow.', typeScale: 'caption', leafVariant: 'prose', itemProps: { grow: 0 } }
                      ]
                    },
                    {
                      id: 'card-3',
                      name: 'Feature Card 3',
                      tag: 'article',
                      className: 'metric-card',
                      behavior: 'pancake-stack',
                      gap: 'xs',
                      padding: 'sm',
                      maxWidth: '100%',
                      chrome: { mode: 'static', edge: 'top', offset: 0, zIndex: 1, blur: false, surface: '#ffffff', border: true },
                      itemProps: { spanCols: 4, grow: 1, pushBottom: false },
                      children: [
                        { id: 'c3-tag', name: 'Tag', tag: 'span', className: 'card-kicker', text: 'CHROME', typeScale: 'caption', leafVariant: 'badge-amber', itemProps: { grow: 0 } },
                        { id: 'c3-h3', name: 'Title', tag: 'h3', className: 'card-val', text: 'Sticky Regions', typeScale: 'h3', leafVariant: 'plain', itemProps: { grow: 0 } },
                        { id: 'c3-p', name: 'Copy', tag: 'p', className: 'card-desc', text: 'Pin global headers, footers, or nested section bars cleanly.', typeScale: 'caption', leafVariant: 'prose', itemProps: { grow: 0 } }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 'global-footer',
          name: 'Sticky Bottom Footer',
          tag: 'footer',
          className: 'site-footer-chrome',
          behavior: 'cluster-flow',
          clusterJustify: 'space-between',
          clusterWrap: 'wrap',
          gap: 'sm',
          padding: 'xs',
          maxWidth: '100%',
          chrome: { mode: 'sticky', edge: 'bottom', offset: 0, zIndex: 25, blur: true, surface: 'rgba(255, 255, 255, 0.92)', border: true },
          itemProps: { spanCols: 12, grow: 0, pushBottom: true },
          children: [
            { id: 'foot-status', name: 'Status', tag: 'span', className: 'footer-status', text: '● Zero Media Queries Used', typeScale: 'caption', leafVariant: 'badge-emerald', itemProps: { grow: 0 } },
            { id: 'foot-copy', name: 'Export Link', tag: 'a', className: 'footer-link', text: 'Ready to copy HTML & CSS →', typeScale: 'caption', leafVariant: 'prose', itemProps: { grow: 0 } }
          ]
        }
      ]
    }
  },

  'editorial-magazine': {
    name: 'Editorial Article',
    description: 'Sticky masthead, fluid hero header, and sticky table-of-contents alongside a 65ch article column.',
    tree: {
      id: 'ed-root',
      name: 'Article Page Root',
      tag: 'div',
      className: 'editorial-root',
      behavior: 'pancake-stack',
      gap: 'md',
      padding: 'none',
      maxWidth: '100%',
      containerQuery: true,
      chrome: { mode: 'static', edge: 'top', offset: 0, zIndex: 1, blur: false, surface: '#f8fafc', border: false },
      itemProps: { spanCols: 12, grow: 1, pushBottom: false },
      children: [
        {
          id: 'ed-topbar',
          name: 'Sticky Masthead',
          tag: 'header',
          className: 'masthead-chrome',
          behavior: 'cluster-flow',
          clusterJustify: 'space-between',
          clusterWrap: 'wrap',
          gap: 'sm',
          padding: 'sm',
          maxWidth: '100%',
          chrome: { mode: 'sticky', edge: 'top', offset: 0, zIndex: 30, blur: true, surface: 'rgba(255, 255, 255, 0.9)', border: true },
          itemProps: { spanCols: 12, grow: 0, pushBottom: false },
          children: [
            { id: 'ed-logo', name: 'Publication Title', tag: 'h3', className: 'pub-logo', text: 'THE INTRINSIC JOURNAL', typeScale: 'body', leafVariant: 'plain', itemProps: { grow: 0 } },
            { id: 'ed-sub-btn', name: 'Subscribe Button', tag: 'button', className: 'sub-btn', text: 'Subscribe', typeScale: 'caption', leafVariant: 'btn-primary', itemProps: { grow: 0 } }
          ]
        },
        {
          id: 'ed-hero',
          name: 'Article Header',
          tag: 'section',
          className: 'article-hero',
          behavior: 'pancake-stack',
          gap: 'xs',
          padding: 'lg',
          maxWidth: '1040px',
          chrome: { mode: 'static', edge: 'top', offset: 0, zIndex: 1, blur: false, surface: '#ffffff', border: true },
          itemProps: { spanCols: 12, grow: 0, pushBottom: false },
          children: [
            { id: 'ed-kicker', name: 'Topic Badge', tag: 'span', className: 'ed-kicker', text: 'WEB ARCHITECTURE', typeScale: 'caption', leafVariant: 'badge-amber', itemProps: { grow: 0 } },
            { id: 'ed-h1', name: 'Headline', tag: 'h1', className: 'ed-headline', text: 'Designing Layouts That Adapt By Math, Not Breakpoints', typeScale: 'hero', leafVariant: 'plain', itemProps: { grow: 0 } },
            { id: 'ed-lead', name: 'Lead Paragraph', tag: 'p', className: 'ed-standfirst', text: 'How modern CSS functions let components negotiate space naturally across any screen size.', typeScale: 'lead', leafVariant: 'prose', itemProps: { grow: 0 } }
          ]
        },
        {
          id: 'ed-body-split',
          name: 'TOC + Article Switcher',
          tag: 'main',
          className: 'essay-layout',
          behavior: 'sidebar-switcher',
          sidebarWidth: 210,
          mainMinPercent: 65,
          sidebarSide: 'left',
          gap: 'lg',
          padding: 'md',
          maxWidth: '1040px',
          containerQuery: true,
          chrome: { mode: 'static', edge: 'top', offset: 0, zIndex: 1, blur: false, surface: 'transparent', border: false },
          itemProps: { spanCols: 12, grow: 1, pushBottom: false },
          children: [
            {
              id: 'ed-toc',
              name: 'Sticky Contents Rail',
              tag: 'nav',
              className: 'sticky-toc',
              behavior: 'pancake-stack',
              gap: 'xs',
              padding: 'sm',
              maxWidth: '100%',
              chrome: { mode: 'sticky', edge: 'top', offset: 72, zIndex: 10, blur: false, surface: '#ffffff', border: true },
              itemProps: { spanCols: 3, grow: 0, pushBottom: false },
              children: [
                { id: 'toc-h', name: 'TOC Title', tag: 'span', className: 'toc-title', text: 'CONTENTS', typeScale: 'caption', leafVariant: 'badge-slate', itemProps: { grow: 0 } },
                { id: 'toc-1', name: 'Chapter 1', tag: 'a', className: 'toc-link', text: '1. Fluid Space', typeScale: 'caption', leafVariant: 'link-block', itemProps: { grow: 0 } },
                { id: 'toc-2', name: 'Chapter 2', tag: 'a', className: 'toc-link', text: '2. Intrinsic Grids', typeScale: 'caption', leafVariant: 'link-block', itemProps: { grow: 0 } }
              ]
            },
            {
              id: 'ed-prose',
              name: 'Readable Prose Column',
              tag: 'article',
              className: 'essay-prose',
              behavior: 'pancake-stack',
              gap: 'sm',
              padding: 'md',
              maxWidth: '65ch',
              chrome: { mode: 'static', edge: 'top', offset: 0, zIndex: 1, blur: false, surface: '#ffffff', border: true },
              itemProps: { spanCols: 9, grow: 1, pushBottom: false },
              children: [
                { id: 'ed-h2-1', name: 'Section Heading', tag: 'h2', className: 'prose-h2', text: '1. The End of Arbitrary Breakpoints', typeScale: 'h2', leafVariant: 'plain', itemProps: { grow: 0 } },
                { id: 'ed-p-1', name: 'Body Paragraph 1', tag: 'p', className: 'prose-p', text: 'When we group elements that move together into logical structures, sibling tracks can wrap as soon as their content reaches its minimum comfortable reading measure.', typeScale: 'body', leafVariant: 'prose', itemProps: { grow: 0 } },
                { id: 'ed-p-2', name: 'Body Paragraph 2', tag: 'p', className: 'prose-p', text: 'Try dragging the viewport handle inward: the table of contents smoothly moves above this article without a single @media rule.', typeScale: 'body', leafVariant: 'prose', itemProps: { grow: 0 } }
              ]
            }
          ]
        }
      ]
    }
  },

  'bento-showcase': {
    name: '12-Col Bento Grid',
    description: 'Proportional 8-col, 4-col, and 6-col Bento cards that collapse into a single stack on narrow containers.',
    tree: {
      id: 'bento-root',
      name: 'Bento Page Root',
      tag: 'div',
      className: 'bento-page',
      behavior: 'pancake-stack',
      gap: 'md',
      padding: 'md',
      maxWidth: '1200px',
      containerQuery: true,
      chrome: { mode: 'static', edge: 'top', offset: 0, zIndex: 1, blur: false, surface: '#f8fafc', border: false },
      itemProps: { spanCols: 12, grow: 1, pushBottom: false },
      children: [
        {
          id: 'bento-nav',
          name: 'Sticky Pill Navbar',
          tag: 'header',
          className: 'floating-pill-nav',
          behavior: 'cluster-flow',
          clusterJustify: 'space-between',
          clusterWrap: 'wrap',
          gap: 'sm',
          padding: 'sm',
          maxWidth: '100%',
          chrome: { mode: 'sticky', edge: 'top', offset: 8, zIndex: 30, blur: true, surface: 'rgba(255, 255, 255, 0.9)', border: true },
          itemProps: { spanCols: 12, grow: 0, pushBottom: false },
          children: [
            { id: 'bn-brand', name: 'Brand Badge', tag: 'span', className: 'studio-pill', text: '✦ KINETIC BENTO', typeScale: 'caption', leafVariant: 'badge-indigo', itemProps: { grow: 0 } },
            { id: 'bn-cta', name: 'CTA Button', tag: 'button', className: 'contact-btn', text: 'Get Template', typeScale: 'caption', leafVariant: 'btn-primary', itemProps: { grow: 0 } }
          ]
        },
        {
          id: 'bento-matrix',
          name: '12-Col Bento Matrix',
          tag: 'main',
          className: 'bento-grid-container',
          behavior: 'bento-12',
          bentoCollapseWidth: 260,
          gap: 'sm',
          padding: 'none',
          maxWidth: '100%',
          containerQuery: true,
          chrome: { mode: 'static', edge: 'top', offset: 0, zIndex: 1, blur: false, surface: 'transparent', border: false },
          itemProps: { spanCols: 12, grow: 1, pushBottom: false },
          children: [
            {
              id: 'bento-cell-hero',
              name: 'Feature Spotlight (8 Cols)',
              tag: 'article',
              className: 'bento-card-hero',
              behavior: 'pancake-stack',
              gap: 'xs',
              padding: 'md',
              maxWidth: '100%',
              chrome: { mode: 'static', edge: 'top', offset: 0, zIndex: 1, blur: false, surface: '#eef2ff', border: true },
              itemProps: { spanCols: 8, grow: 1, pushBottom: false },
              children: [
                { id: 'bc1-tag', name: 'Span Badge', tag: 'span', className: 'b-tag', text: '8 COLUMNS WIDE', typeScale: 'caption', leafVariant: 'badge-indigo', itemProps: { grow: 0 } },
                { id: 'bc1-h2', name: 'Headline', tag: 'h2', className: 'b-title', text: 'Visual Container Queries', typeScale: 'h2', leafVariant: 'plain', itemProps: { grow: 0 } },
                { id: 'bc1-p', name: 'Description', tag: 'p', className: 'b-copy', text: 'Select any Bento card to change its column span out of 12. When the container narrows, all cards stack cleanly.', typeScale: 'body', leafVariant: 'prose', itemProps: { grow: 0 } }
              ]
            },
            {
              id: 'bento-cell-side',
              name: 'Side Card (4 Cols)',
              tag: 'aside',
              className: 'bento-card-side',
              behavior: 'pancake-stack',
              gap: 'xs',
              padding: 'md',
              maxWidth: '100%',
              chrome: { mode: 'static', edge: 'top', offset: 0, zIndex: 1, blur: false, surface: '#ffffff', border: true },
              itemProps: { spanCols: 4, grow: 1, pushBottom: false },
              children: [
                { id: 'bc2-tag', name: 'Span Badge', tag: 'span', className: 'b-tag', text: '4 COLUMNS', typeScale: 'caption', leafVariant: 'badge-emerald', itemProps: { grow: 0 } },
                { id: 'bc2-h3', name: 'Title', tag: 'h3', className: 'b-title', text: 'Fluid Rhythm', typeScale: 'h3', leafVariant: 'plain', itemProps: { grow: 0 } },
                { id: 'bc2-p', name: 'Copy', tag: 'p', className: 'b-copy', text: 'Spacing scales smoothly with clamp().', typeScale: 'caption', leafVariant: 'prose', itemProps: { grow: 0 } }
              ]
            },
            {
              id: 'bento-cell-3',
              name: 'Half Tile Left (6 Cols)',
              tag: 'article',
              className: 'bento-tile-a',
              behavior: 'pancake-stack',
              gap: 'xs',
              padding: 'md',
              maxWidth: '100%',
              chrome: { mode: 'static', edge: 'top', offset: 0, zIndex: 1, blur: false, surface: '#ffffff', border: true },
              itemProps: { spanCols: 6, grow: 1, pushBottom: false },
              children: [
                { id: 'bc3-h3', name: 'Title', tag: 'h3', className: 'b-title', text: '6-Column Split A', typeScale: 'h3', leafVariant: 'plain', itemProps: { grow: 0 } },
                { id: 'bc3-p', name: 'Copy', tag: 'p', className: 'b-copy', text: 'Balanced 50/50 split on desktop viewports.', typeScale: 'body', leafVariant: 'prose', itemProps: { grow: 0 } }
              ]
            },
            {
              id: 'bento-cell-4',
              name: 'Half Tile Right (6 Cols)',
              tag: 'article',
              className: 'bento-tile-b',
              behavior: 'pancake-stack',
              gap: 'xs',
              padding: 'md',
              maxWidth: '100%',
              chrome: { mode: 'static', edge: 'top', offset: 0, zIndex: 1, blur: false, surface: '#ffffff', border: true },
              itemProps: { spanCols: 6, grow: 1, pushBottom: false },
              children: [
                { id: 'bc4-h3', name: 'Title', tag: 'h3', className: 'b-title', text: '6-Column Split B', typeScale: 'h3', leafVariant: 'plain', itemProps: { grow: 0 } },
                { id: 'bc4-p', name: 'Copy', tag: 'p', className: 'b-copy', text: 'Exports clean semantic HTML and modern CSS.', typeScale: 'body', leafVariant: 'prose', itemProps: { grow: 0 } }
              ]
            }
          ]
        }
      ]
    }
  }
};
