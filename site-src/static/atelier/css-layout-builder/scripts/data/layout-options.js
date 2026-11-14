// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

export const STRUCTURAL_TAGS = [
  { tag: 'div', label: 'div' },
  { tag: 'header', label: 'header' },
  { tag: 'nav', label: 'nav' },
  { tag: 'main', label: 'main' },
  { tag: 'section', label: 'section' },
  { tag: 'article', label: 'article' },
  { tag: 'aside', label: 'aside' },
  { tag: 'ul', label: 'ul' },
  { tag: 'footer', label: 'footer' }
];

export const CONCRETE_LEAF_TAGS = [
  { tag: 'h1', label: 'h1', defaultText: 'Intrinsic Layouts Without Media Queries' },
  { tag: 'h2', label: 'h2', defaultText: 'Adaptive Section Heading' },
  { tag: 'h3', label: 'h3', defaultText: 'Feature Title' },
  { tag: 'p', label: 'p', defaultText: 'Content reflows naturally using mathematical CSS constraints like minmax(), clamp(), and flex-wrap.' },
  { tag: 'a', label: 'a', defaultText: 'Learn more →' },
  { tag: 'li', label: 'li', defaultText: 'Navigation link item' },
  { tag: 'button', label: 'button', defaultText: 'Get Started' },
  { tag: 'span', label: 'span', defaultText: 'Badge' }
];

export const LAYOUT_BEHAVIORS = [
  {
    id: 'ram-grid',
    name: 'Auto-Fit Grid',
    subtitle: 'Cards wrap automatically below min-width',
    cssTechnique: 'repeat(auto-fit, minmax(min(100%, X), 1fr))'
  },
  {
    id: 'sidebar-switcher',
    name: 'Sidebar Switcher',
    subtitle: 'Side-by-side wide, stacks vertically narrow',
    cssTechnique: 'flex-wrap + basis threshold'
  },
  {
    id: 'cluster-flow',
    name: 'Row Cluster',
    subtitle: 'Horizontal bar that wraps when tight',
    cssTechnique: 'flex-wrap + alignment'
  },
  {
    id: 'pancake-stack',
    name: 'Vertical Stack',
    subtitle: 'Clean vertical flow with fluid gap',
    cssTechnique: 'flex-direction: column'
  },
  {
    id: 'bento-12',
    name: '12-Col Bento',
    subtitle: 'Proportional spans that stack on compact widths',
    cssTechnique: '12-col grid + @container'
  },
  {
    id: 'holy-grail-split',
    name: 'Multi-Column Split',
    subtitle: 'Equal responsive columns',
    cssTechnique: 'auto-fit 260px tracks'
  }
];

export const FLUID_SPACE_PRESETS = {
  none: { label: '0',  clamp: '0px',                            description: '0px' },
  xs:   { label: 'XS', clamp: 'clamp(0.4rem, 0.8vw, 0.65rem)',  description: '6–10px' },
  sm:   { label: 'SM', clamp: 'clamp(0.75rem, 1.5vw, 1.15rem)', description: '12–18px' },
  md:   { label: 'MD', clamp: 'clamp(1rem, 2.2vw, 1.75rem)',    description: '16–28px' },
  lg:   { label: 'LG', clamp: 'clamp(1.5rem, 3.2vw, 2.5rem)',   description: '24–40px' },
  xl:   { label: 'XL', clamp: 'clamp(2rem, 4.5vw, 3.75rem)',    description: '32–60px' }
};

export const FLUID_TYPE_PRESETS = {
  caption: { label: 'Small',   clamp: 'clamp(0.78rem, 0.85vw, 0.86rem)', weight: '500', lineHeight: '1.4' },
  body:    { label: 'Body',    clamp: 'clamp(0.92rem, 1vw, 1.02rem)',    weight: '400', lineHeight: '1.6' },
  lead:    { label: 'Lead',    clamp: 'clamp(1.05rem, 1.4vw, 1.25rem)',  weight: '400', lineHeight: '1.55' },
  h3:      { label: 'Title S', clamp: 'clamp(1.1rem, 1.6vw, 1.35rem)',   weight: '600', lineHeight: '1.3' },
  h2:      { label: 'Title M', clamp: 'clamp(1.35rem, 2.3vw, 1.85rem)',  weight: '700', lineHeight: '1.2' },
  hero:    { label: 'Hero XL', clamp: 'clamp(1.75rem, 3.5vw, 2.65rem)',  weight: '800', lineHeight: '1.12' }
};

export const LEAF_VARIANT_OPTIONS = [
  { id: 'plain', label: 'Heading / Dark' },
  { id: 'prose', label: 'Body Prose' },
  { id: 'btn-primary', label: 'Button CTA' },
  { id: 'badge-indigo', label: 'Indigo Badge' },
  { id: 'badge-emerald', label: 'Green Badge' },
  { id: 'badge-amber', label: 'Amber Badge' },
  { id: 'link-block', label: 'Menu Link' },
  { id: 'muted-box', label: 'Soft Callout' }
];

export const SURFACE_COLOR_OPTIONS = [
  { value: 'transparent', label: 'Transparent' },
  { value: '#ffffff', label: 'Crisp White' },
  { value: '#f8fafc', label: 'Soft Slate' },
  { value: '#eef2ff', label: 'Indigo Tint' },
  { value: 'rgba(255, 255, 255, 0.9)', label: 'Frosted Glass' }
];
