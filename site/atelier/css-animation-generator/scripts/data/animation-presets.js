// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

export const QUICK_ANIMATION_RECIPES = [
  {
    id: 'fadeUpSpring',
    label: 'Spring Fade-Up Reveal',
    duration: 650,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    keyframes: [
      { offset: 0, translateX: 0, translateY: 36, scale: 0.94, rotate: 0, opacity: 0, blur: 4, useColors: false, bgColor: '#ffffff', textColor: '#0f172a', borderColor: '#e2e8f0', borderRadius: 12 },
      { offset: 100, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 1, blur: 0, useColors: false, bgColor: '#ffffff', textColor: '#0f172a', borderColor: '#e2e8f0', borderRadius: 12 }
    ]
  },
  {
    id: 'colorGlowPulse',
    label: 'CTA Color Morph & Pill Glow',
    duration: 720,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    keyframes: [
      { offset: 0, translateX: 0, translateY: 16, scale: 0.88, rotate: 0, opacity: 0, blur: 0, useColors: true, bgColor: '#06B6D4', textColor: '#ffffff', borderColor: '#67E8F9', borderRadius: 6 },
      { offset: 55, translateX: 0, translateY: -4, scale: 1.06, rotate: -1, opacity: 1, blur: 0, useColors: true, bgColor: '#7C3AED', textColor: '#ffffff', borderColor: '#C4B5FD', borderRadius: 22 },
      { offset: 100, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 1, blur: 0, useColors: true, bgColor: '#4F46E5', textColor: '#ffffff', borderColor: '#818CF8', borderRadius: 10 }
    ]
  },
  {
    id: 'cardHighlightBorder',
    label: 'Card Surface & Border Highlight',
    duration: 680,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    keyframes: [
      { offset: 0, translateX: -24, translateY: 20, scale: 0.9, rotate: -2, opacity: 0, blur: 6, useColors: true, bgColor: '#EEF2FF', textColor: '#312E81', borderColor: '#818CF8', borderRadius: 20 },
      { offset: 100, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 1, blur: 0, useColors: true, bgColor: '#FFFFFF', textColor: '#1E293B', borderColor: '#E2E8F0', borderRadius: 12 }
    ]
  },
  {
    id: 'navbarDrop',
    label: 'Navbar Slide-Down & Unblur',
    duration: 520,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    keyframes: [
      { offset: 0, translateX: 0, translateY: -32, scale: 0.98, rotate: 0, opacity: 0, blur: 8, useColors: false, bgColor: '#ffffff', textColor: '#0f172a', borderColor: '#e2e8f0', borderRadius: 0 },
      { offset: 100, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 1, blur: 0, useColors: false, bgColor: '#ffffff', textColor: '#0f172a', borderColor: '#e2e8f0', borderRadius: 0 }
    ]
  },
  {
    id: 'mobileDrawerUp',
    label: 'Mobile Bottom Sheet Drawer',
    duration: 580,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    keyframes: [
      { offset: 0, translateX: 0, translateY: 85, scale: 0.95, rotate: 0, opacity: 0, blur: 2, useColors: false, bgColor: '#ffffff', textColor: '#0f172a', borderColor: '#e2e8f0', borderRadius: 16 },
      { offset: 100, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 1, blur: 0, useColors: false, bgColor: '#ffffff', textColor: '#0f172a', borderColor: '#e2e8f0', borderRadius: 12 }
    ]
  }
];

export const PRESET_TEMPLATES = {
  responsiveHero: {
    id: 'responsiveHero',
    name: 'Multi-Width Range + Parallel Sync Flow',
    shortName: 'Multi-Width + Parallel',
    description:
      'Routes across 3 custom width ranges (<640px Mobile, 640–1023px Tablet, ≥1024px Desktop), runs parallel Hero + Card animations, and waits for all parallel tracks before firing the CTA color morph.',
    nodes: [
      {
        id: 'trig-1',
        type: 'trigger',
        title: 'Page Load / Play',
        triggerType: 'load',
        x: 28,
        y: 155,
        outputs: [
          { id: 'out', label: 'Start Flow', targetIds: ['anim-nav-drop', 'cond-width-router'] }
        ]
      },
      {
        id: 'anim-nav-drop',
        type: 'animation',
        title: 'Parallel: Navbar Drop',
        target: '#site-navbar, #promo-badge',
        cssMode: 'keyframes',
        duration: 500,
        delay: 0,
        stagger: 60,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        x: 280,
        y: 25,
        keyframes: [
          { offset: 0, translateX: 0, translateY: -28, scale: 0.96, rotate: 0, opacity: 0, blur: 6, useColors: false, bgColor: '#ffffff', textColor: '#0f172a', borderColor: '#e2e8f0', borderRadius: 8 },
          { offset: 100, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 1, blur: 0, useColors: false, bgColor: '#ffffff', textColor: '#0f172a', borderColor: '#e2e8f0', borderRadius: 8 }
        ],
        outputs: [{ id: 'done', label: 'onComplete', targetIds: [] }]
      },
      {
        id: 'cond-width-router',
        type: 'condition',
        title: 'Multi-Width Range Router',
        conditionType: 'viewportRanges',
        x: 280,
        y: 195,
        ranges: [
          { id: 'r-mob', label: 'Mobile (0–639px)', min: 0, max: 639 },
          { id: 'r-tab', label: 'Tablet (640–1023px)', min: 640, max: 1023 },
          { id: 'r-desk', label: 'Desktop (1024–9999px)', min: 1024, max: 9999 }
        ],
        outputs: [
          { id: 'r-mob', label: '0–639px (Mobile)', targetIds: ['anim-mobile-sheet', 'anim-hero-copy'] },
          { id: 'r-tab', label: '640–1023px (Tablet)', targetIds: ['anim-tablet-grid', 'anim-hero-copy'] },
          { id: 'r-desk', label: '≥1024px (Desktop)', targetIds: ['anim-desktop-cards', 'anim-hero-copy'] }
        ]
      },
      {
        id: 'anim-hero-copy',
        type: 'animation',
        title: 'Parallel: Hero Headline',
        target: '#hero-heading, #hero-subtitle',
        cssMode: 'keyframes',
        duration: 550,
        delay: 40,
        stagger: 90,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        x: 590,
        y: 20,
        keyframes: [
          { offset: 0, translateX: -30, translateY: 14, scale: 0.96, rotate: 0, opacity: 0, blur: 6, useColors: true, bgColor: 'transparent', textColor: '#4F46E5', borderColor: 'transparent', borderRadius: 0 },
          { offset: 100, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 1, blur: 0, useColors: true, bgColor: 'transparent', textColor: '#0F172A', borderColor: 'transparent', borderRadius: 0 }
        ],
        outputs: [{ id: 'done', label: 'onComplete', targetIds: ['anim-cta-color'] }]
      },
      {
        id: 'anim-desktop-cards',
        type: 'animation',
        title: 'Desktop 3D Fan & Highlight',
        target: '.scene-card',
        cssMode: 'keyframes',
        duration: 760,
        delay: 80,
        stagger: 120,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        x: 590,
        y: 165,
        keyframes: [
          { offset: 0, translateX: -45, translateY: 36, scale: 0.86, rotate: -5, opacity: 0, blur: 8, useColors: true, bgColor: '#EEF2FF', textColor: '#4338CA', borderColor: '#818CF8', borderRadius: 18 },
          { offset: 100, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 1, blur: 0, useColors: true, bgColor: '#FFFFFF', textColor: '#1E293B', borderColor: '#E2E8F0', borderRadius: 12 }
        ],
        outputs: [{ id: 'done', label: 'onComplete', targetIds: ['anim-cta-color'] }]
      },
      {
        id: 'anim-tablet-grid',
        type: 'animation',
        title: 'Tablet Elastic Scale-In',
        target: '.scene-card',
        cssMode: 'keyframes',
        duration: 640,
        delay: 60,
        stagger: 90,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        x: 590,
        y: 310,
        keyframes: [
          { offset: 0, translateX: 0, translateY: 28, scale: 0.82, rotate: 2, opacity: 0, blur: 4, useColors: true, bgColor: '#F0FDF4', textColor: '#166534', borderColor: '#86EFAC', borderRadius: 16 },
          { offset: 100, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 1, blur: 0, useColors: true, bgColor: '#FFFFFF', textColor: '#1E293B', borderColor: '#E2E8F0', borderRadius: 12 }
        ],
        outputs: [{ id: 'done', label: 'onComplete', targetIds: ['anim-cta-color'] }]
      },
      {
        id: 'anim-mobile-sheet',
        type: 'animation',
        title: 'Mobile Compact Sheet Up',
        target: '.scene-card',
        cssMode: 'keyframes',
        duration: 540,
        delay: 40,
        stagger: 70,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        x: 590,
        y: 450,
        keyframes: [
          { offset: 0, translateX: 0, translateY: 75, scale: 0.94, rotate: 0, opacity: 0, blur: 2, useColors: true, bgColor: '#FFFBEB', textColor: '#92400E', borderColor: '#FCD34D', borderRadius: 14 },
          { offset: 100, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 1, blur: 0, useColors: true, bgColor: '#FFFFFF', textColor: '#1E293B', borderColor: '#E2E8F0', borderRadius: 12 }
        ],
        outputs: [{ id: 'done', label: 'onComplete', targetIds: ['anim-cta-color'] }]
      },
      {
        id: 'anim-cta-color',
        type: 'animation',
        title: 'Wait-All Sync → CTA Color Morph',
        target: '#cta-primary, #cta-secondary',
        cssMode: 'keyframes',
        duration: 620,
        delay: 40,
        stagger: 80,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        x: 920,
        y: 195,
        keyframes: [
          { offset: 0, translateX: 0, translateY: 22, scale: 0.88, rotate: 0, opacity: 0, blur: 0, useColors: true, bgColor: '#06B6D4', textColor: '#FFFFFF', borderColor: '#22D3EE', borderRadius: 20 },
          { offset: 60, translateX: 0, translateY: -4, scale: 1.05, rotate: 0, opacity: 1, blur: 0, useColors: true, bgColor: '#7C3AED', textColor: '#FFFFFF', borderColor: '#A78BFA', borderRadius: 14 },
          { offset: 100, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 1, blur: 0, useColors: true, bgColor: '#4F46E5', textColor: '#FFFFFF', borderColor: '#6366F1', borderRadius: 10 }
        ],
        outputs: [{ id: 'done', label: 'onComplete', targetIds: [] }]
      }
    ]
  },
  parallelLaunch: {
    id: 'parallelLaunch',
    name: 'Parallel Choreography & Barrier Join',
    shortName: 'Parallel Barrier',
    description:
      'Demonstrates 3 simultaneous animations running in parallel (Header, Hero, Feature Cards) that synchronize at a Wait-All Barrier before triggering the final CTA pulse.',
    nodes: [
      {
        id: 'trig-par',
        type: 'trigger',
        title: 'Interactive Click / Load',
        triggerType: 'click',
        x: 32,
        y: 175,
        outputs: [
          {
            id: 'out',
            label: 'Fork 3 Parallel Tracks',
            targetIds: ['anim-par-header', 'anim-par-hero', 'anim-par-cards']
          }
        ]
      },
      {
        id: 'anim-par-header',
        type: 'animation',
        title: 'Track A: Header Slide (450ms)',
        target: '#site-navbar, #promo-badge',
        cssMode: 'keyframes',
        duration: 450,
        delay: 0,
        stagger: 50,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        x: 340,
        y: 30,
        keyframes: [
          { offset: 0, translateX: 0, translateY: -25, scale: 0.95, rotate: 0, opacity: 0, blur: 4, useColors: false, bgColor: '#ffffff', textColor: '#0f172a', borderColor: '#e2e8f0', borderRadius: 8 },
          { offset: 100, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 1, blur: 0, useColors: false, bgColor: '#ffffff', textColor: '#0f172a', borderColor: '#e2e8f0', borderRadius: 8 }
        ],
        outputs: [{ id: 'done', label: 'onComplete', targetIds: ['anim-join-cta'] }]
      },
      {
        id: 'anim-par-hero',
        type: 'animation',
        title: 'Track B: Hero Color Reveal (700ms)',
        target: '#hero-heading, #hero-subtitle',
        cssMode: 'keyframes',
        duration: 700,
        delay: 0,
        stagger: 80,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        x: 340,
        y: 175,
        keyframes: [
          { offset: 0, translateX: -40, translateY: 0, scale: 0.94, rotate: 0, opacity: 0, blur: 6, useColors: true, bgColor: 'transparent', textColor: '#6366F1', borderColor: 'transparent', borderRadius: 0 },
          { offset: 100, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 1, blur: 0, useColors: true, bgColor: 'transparent', textColor: '#0F172A', borderColor: 'transparent', borderRadius: 0 }
        ],
        outputs: [{ id: 'done', label: 'onComplete', targetIds: ['anim-join-cta'] }]
      },
      {
        id: 'anim-par-cards',
        type: 'animation',
        title: 'Track C: Cards Cascade (950ms)',
        target: '.scene-card',
        cssMode: 'keyframes',
        duration: 650,
        delay: 50,
        stagger: 125,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        x: 340,
        y: 325,
        keyframes: [
          { offset: 0, translateX: 0, translateY: 50, scale: 0.88, rotate: -3, opacity: 0, blur: 4, useColors: true, bgColor: '#ECFDF5', textColor: '#065F46', borderColor: '#6EE7B7', borderRadius: 18 },
          { offset: 100, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 1, blur: 0, useColors: true, bgColor: '#FFFFFF', textColor: '#1E293B', borderColor: '#E2E8F0', borderRadius: 12 }
        ],
        outputs: [{ id: 'done', label: 'onComplete', targetIds: ['anim-join-cta'] }]
      },
      {
        id: 'anim-join-cta',
        type: 'animation',
        title: 'After All 3 Complete → CTA Glow',
        target: '#cta-primary, #cta-secondary',
        cssMode: 'keyframes',
        duration: 580,
        delay: 30,
        stagger: 70,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        x: 720,
        y: 175,
        keyframes: [
          { offset: 0, translateX: 0, translateY: 18, scale: 0.85, rotate: 0, opacity: 0, blur: 0, useColors: true, bgColor: '#F59E0B', textColor: '#FFFFFF', borderColor: '#FBBF24', borderRadius: 20 },
          { offset: 100, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 1, blur: 0, useColors: true, bgColor: '#4F46E5', textColor: '#FFFFFF', borderColor: '#6366F1', borderRadius: 10 }
        ],
        outputs: [{ id: 'done', label: 'onComplete', targetIds: [] }]
      }
    ]
  },
  accessibleMotion: {
    id: 'accessibleMotion',
    name: 'A11y Reduced-Motion Smart Guard',
    shortName: 'A11y Motion Guard',
    description:
      'Evaluates prefers-reduced-motion first: runs expressive 3D spring & color transitions by default or gentle opacity fade when Reduced Motion is ON.',
    nodes: [
      {
        id: 'trig-a11y',
        type: 'trigger',
        title: 'Scroll / In-View Trigger',
        triggerType: 'scroll',
        x: 40,
        y: 155,
        outputs: [{ id: 'out', label: 'In View', targetIds: ['cond-motion'] }]
      },
      {
        id: 'cond-motion',
        type: 'condition',
        title: 'Reduced Motion Guard',
        conditionType: 'reducedMotion',
        operator: '==',
        value: 'true',
        x: 285,
        y: 140,
        outputs: [
          { id: 'true', label: 'Reduced Motion ON', targetIds: ['anim-gentle-fade'] },
          { id: 'false', label: 'Full Motion OK', targetIds: ['anim-expressive-spring'] }
        ]
      },
      {
        id: 'anim-gentle-fade',
        type: 'animation',
        title: 'Accessible Soft Fade',
        target: '.scene-card, #hero-heading',
        cssMode: 'keyframes',
        duration: 450,
        delay: 0,
        stagger: 50,
        easing: 'ease-out',
        x: 580,
        y: 45,
        keyframes: [
          { offset: 0, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 0, blur: 0, useColors: false, bgColor: '#ffffff', textColor: '#0f172a', borderColor: '#e2e8f0', borderRadius: 12 },
          { offset: 100, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 1, blur: 0, useColors: false, bgColor: '#ffffff', textColor: '#0f172a', borderColor: '#e2e8f0', borderRadius: 12 }
        ],
        outputs: [{ id: 'done', label: 'onComplete', targetIds: ['anim-a11y-cta'] }]
      },
      {
        id: 'anim-expressive-spring',
        type: 'animation',
        title: 'Expressive Kinetic Spring',
        target: '.scene-card',
        cssMode: 'keyframes',
        duration: 780,
        delay: 0,
        stagger: 120,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        x: 580,
        y: 230,
        keyframes: [
          { offset: 0, translateX: 0, translateY: 65, scale: 0.8, rotate: -6, opacity: 0, blur: 8, useColors: true, bgColor: '#EEF2FF', textColor: '#3730A3', borderColor: '#818CF8', borderRadius: 18 },
          { offset: 65, translateX: 0, translateY: -8, scale: 1.04, rotate: 1, opacity: 1, blur: 0, useColors: true, bgColor: '#F5F3FF', textColor: '#1E1B4B', borderColor: '#A78BFA', borderRadius: 14 },
          { offset: 100, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 1, blur: 0, useColors: true, bgColor: '#FFFFFF', textColor: '#1E293B', borderColor: '#E2E8F0', borderRadius: 12 }
        ],
        outputs: [{ id: 'done', label: 'onComplete', targetIds: ['anim-a11y-cta'] }]
      },
      {
        id: 'anim-a11y-cta',
        type: 'animation',
        title: 'Chained CTA Sync',
        target: '#cta-primary',
        cssMode: 'keyframes',
        duration: 480,
        delay: 0,
        stagger: 0,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        x: 900,
        y: 150,
        keyframes: [
          { offset: 0, translateX: 0, translateY: 16, scale: 0.95, rotate: 0, opacity: 0, blur: 0, useColors: false, bgColor: '#4F46E5', textColor: '#ffffff', borderColor: '#4F46E5', borderRadius: 10 },
          { offset: 100, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 1, blur: 0, useColors: false, bgColor: '#4F46E5', textColor: '#ffffff', borderColor: '#4F46E5', borderRadius: 10 }
        ],
        outputs: [{ id: 'done', label: 'onComplete', targetIds: [] }]
      }
    ]
  }
};

export const EASING_PRESETS = [
  { label: 'Out Expo (Snappy)', value: 'cubic-bezier(0.16, 1, 0.3, 1)', points: [0.16, 1, 0.3, 1] },
  { label: 'Spring Overshoot', value: 'cubic-bezier(0.34, 1.56, 0.64, 1)', points: [0.34, 1.56, 0.64, 1] },
  { label: 'Quintic Smooth', value: 'cubic-bezier(0.22, 1, 0.36, 1)', points: [0.22, 1, 0.36, 1] },
  { label: 'Ease In Out', value: 'cubic-bezier(0.65, 0, 0.35, 1)', points: [0.65, 0, 0.35, 1] },
  { label: 'Linear', value: 'linear', points: [0.25, 0.25, 0.75, 0.75] },
  { label: 'Ease Out', value: 'ease-out', points: [0, 0, 0.58, 1] }
];
