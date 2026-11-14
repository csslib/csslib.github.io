// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

export const LAYOUT_SLOTS = [
  { id: 'header', label: 'Header / Navbar Slot', description: 'Top navigation bar, brand logo, announcement pill' },
  { id: 'hero', label: 'Hero Banner Slot', description: 'Primary headline, subcopy, hero media or callout' },
  { id: 'grid', label: 'Content / Feature Grid Slot', description: 'Cards, product tiles, pricing tiers, or list items' },
  { id: 'cta', label: 'Footer / Action Bar Slot', description: 'Primary & secondary buttons, floating bar, form controls' }
];

export const DEFAULT_MOCK_ITEMS = [
  {
    uid: 'item-nav',
    slot: 'header',
    tag: 'div',
    id: 'site-navbar',
    className: 'mock-nav',
    text: 'AcmeCloud • Product Launch v4.2'
  },
  {
    uid: 'item-badge',
    slot: 'header',
    tag: 'span',
    id: 'promo-badge',
    className: 'scene-badge',
    text: 'NEW RELEASE'
  },
  {
    uid: 'item-hero-title',
    slot: 'hero',
    tag: 'h2',
    id: 'hero-heading',
    className: 'mock-heading',
    text: 'Design Responsive Motion Visually.'
  },
  {
    uid: 'item-hero-sub',
    slot: 'hero',
    tag: 'p',
    id: 'hero-subtitle',
    className: 'mock-subtitle',
    text: 'Match your production IDs (#hero-heading, #cta-primary) and export clean @keyframes + @media CSS.'
  },
  {
    uid: 'item-card-1',
    slot: 'grid',
    tag: 'div',
    id: 'feature-card-1',
    className: 'scene-card',
    text: '01 • Multi-Width Ranges'
  },
  {
    uid: 'item-card-2',
    slot: 'grid',
    tag: 'div',
    id: 'feature-card-2',
    className: 'scene-card',
    text: '02 • Parallel + Wait-All Sync'
  },
  {
    uid: 'item-card-3',
    slot: 'grid',
    tag: 'div',
    id: 'feature-card-3',
    className: 'scene-card',
    text: '03 • Color & Style Transitions'
  },
  {
    uid: 'item-cta-primary',
    slot: 'cta',
    tag: 'button',
    id: 'cta-primary',
    className: 'scene-cta',
    text: 'Start Free Trial →'
  },
  {
    uid: 'item-cta-secondary',
    slot: 'cta',
    tag: 'button',
    id: 'cta-secondary',
    className: 'mock-btn-secondary',
    text: 'View Documentation'
  }
];

export const DEFAULT_MOCK_CSS = `/* Editable Base Layout CSS for Mock Screen */
.mock-shell {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  min-height: 100%;
  box-sizing: border-box;
}
.mock-slot-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  padding-bottom: 10px;
  border-bottom: 1px solid #E2E8F0;
}
.mock-nav {
  font-size: 12px;
  font-weight: 700;
  color: #334155;
}
.scene-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 9999px;
  background: #ECFDF5;
  color: #047857;
  border: 1px solid #A7F3D0;
  font-size: 11px;
  font-weight: 700;
}
.mock-slot-hero {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px 0;
}
.mock-heading {
  font-size: 20px;
  font-weight: 800;
  color: #0F172A;
  letter-spacing: -0.02em;
  margin: 0;
}
.mock-subtitle {
  font-size: 12px;
  color: #64748B;
  line-height: 1.45;
  margin: 0;
}
.mock-slot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}
.scene-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 12px;
  font-size: 12px;
  font-weight: 600;
  color: #1E293B;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
}
.mock-slot-cta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid #F1F5F9;
}
.scene-cta {
  background: #4F46E5;
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 600;
  padding: 9px 16px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
}
.mock-btn-secondary {
  background: #F1F5F9;
  color: #334155;
  font-size: 12px;
  font-weight: 600;
  padding: 9px 14px;
  border-radius: 10px;
  border: 1px solid #CBD5E1;
  cursor: pointer;
}`;
