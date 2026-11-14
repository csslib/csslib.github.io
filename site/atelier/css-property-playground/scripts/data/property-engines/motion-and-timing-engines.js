// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

export const MOTION_AND_TIMING_ENGINES = [
  {
    id: 'cubic-bezier-timing',
    name: 'transition-timing-function (cubic-bezier)',
    category: 'Motion & Timing',
    badge: 'Interactive Curve',
    difficulty: 'Advanced',
    summary: 'Defines custom acceleration and deceleration curves using two control points P1(x1, y1) and P2(x2, y2), including springy overshoot when Y exceeds 1.0.',
    gizmoType: 'bezier-editor',
    syntaxAnatomy: 'transition-timing-function: cubic-bezier([x1], [y1], [x2], [y2]);\ntransition-duration: [duration]ms;',
    mentalModel: 'The X-axis is Time (0 to 1) and the Y-axis is Progress (0 to 1). A steep slope means fast velocity; a flat slope means slow velocity. Pulling y2 above 1.0 makes the animation overshoot its target and snap back like a spring!',
    gotchas: [
      'x1 and x2 must stay within [0, 1] so time never flows backward, but y1 and y2 can be negative or > 1.0 for elastic anticipation and overshoot!'
    ],
    challenge: {
      title: 'Elastic Spring Overshoot',
      description: 'Drag the P2 handle above the top of the graph (y2 >= 1.25) to create an elastic overshoot bounce.',
      check: (values) => values.y2 >= 1.25
    },
    controls: [
      { key: 'x1', label: 'Control Point 1 X (x1)', min: 0, max: 1, step: 0.02, defaultValue: 0.34, unit: '' },
      { key: 'y1', label: 'Control Point 1 Y (y1)', min: -0.4, max: 1.5, step: 0.02, defaultValue: 1.42, unit: '' },
      { key: 'x2', label: 'Control Point 2 X (x2)', min: 0, max: 1, step: 0.02, defaultValue: 0.64, unit: '' },
      { key: 'y2', label: 'Control Point 2 Y (y2)', min: -0.4, max: 1.5, step: 0.02, defaultValue: 1, unit: '' },
      { key: 'duration', label: 'transition-duration', min: 200, max: 2000, step: 50, defaultValue: 850, unit: 'ms' }
    ],
    presets: [
      { name: 'Springy Overshoot', values: { x1: 0.34, y1: 1.45, x2: 0.64, y2: 1, duration: 850 } },
      { name: 'iOS Snappy Out', values: { x1: 0.16, y1: 1, x2: 0.3, y2: 1, duration: 650 } },
      { name: 'Anticipation Pullback', values: { x1: 0.68, y1: -0.4, x2: 0.32, y2: 1.4, duration: 950 } },
      { name: 'Ease-In-Out Classic', values: { x1: 0.42, y1: 0, x2: 0.58, y2: 1, duration: 700 } }
    ],
    buildCss: (values) => `transition-timing-function: cubic-bezier(${values.x1}, ${values.y1}, ${values.x2}, ${values.y2});\ntransition-duration: ${values.duration}ms;`
  },

  {
    id: 'keyframes-animation',
    name: '@keyframes & animation Choreography',
    category: 'Motion & Timing',
    badge: 'Timeline Editor',
    difficulty: 'Intermediate',
    summary: 'Configure multi-step @keyframes animations with custom duration, delay, direction (alternate), iteration count, and easing.',
    gizmoType: 'keyframes-stage',
    syntaxAnatomy: 'animation: pulseMorph [duration]ms [easing] [delay]ms infinite [direction];',
    mentalModel: 'While transitions require a state change (like :hover), @keyframes animations can loop autonomously and orchestrate multi-stage transformations (0% -> 50% -> 100%).',
    gotchas: [
      'Use animation-direction: alternate so looping animations smoothly reverse back to 0% instead of snapping abruptly.',
      'Use animation-fill-mode: both on one-shot entrance animations so the element holds its 100% end state.'
    ],
    challenge: {
      title: 'Energetic Floating Bounce',
      description: 'Set Midpoint Y Lift <= -24px and Midpoint Scale >= 1.12.',
      check: (values) => values.midY <= -24 && values.midScale >= 1.12
    },
    controls: [
      { key: 'duration', label: 'animation-duration', min: 400, max: 3000, step: 100, defaultValue: 1400, unit: 'ms' },
      { key: 'midY', label: '50% Keyframe translateY', min: -50, max: 50, step: 2, defaultValue: -20, unit: 'px' },
      { key: 'midScale', label: '50% Keyframe scale', min: 0.7, max: 1.4, step: 0.02, defaultValue: 1.08, unit: '' },
      { key: 'midRotate', label: '50% Keyframe rotate', min: -45, max: 45, step: 1, defaultValue: 8, unit: 'deg' },
      { key: 'paused', label: 'Pause Animation (animation-play-state)', min: 0, max: 1, step: 1, defaultValue: 0, unit: 'toggle' }
    ],
    presets: [
      { name: 'Floating Levitation', values: { duration: 1600, midY: -22, midScale: 1.05, midRotate: 3, paused: 0 } },
      { name: 'Heartbeat Pulse', values: { duration: 800, midY: 0, midScale: 1.22, midRotate: 0, paused: 0 } },
      { name: 'Playful Wiggle', values: { duration: 900, midY: -10, midScale: 1.08, midRotate: -16, paused: 0 } }
    ],
    buildCss: (values) => `@keyframes studioKeyframes {\n  0%, 100% {\n    transform: translateY(0px) scale(1) rotate(0deg);\n  }\n  50% {\n    transform: translateY(${values.midY}px) scale(${values.midScale}) rotate(${values.midRotate}deg);\n  }\n}\n.animated-element {\n  animation: studioKeyframes ${values.duration}ms ease-in-out infinite;\n  animation-play-state: ${values.paused ? 'paused' : 'running'};\n}`
  },

  {
    id: 'offset-path-motion',
    name: 'offset-path & offset-distance',
    category: 'Motion & Timing',
    badge: 'SVG Motion Track',
    difficulty: 'Advanced',
    summary: 'Moves an element along any custom SVG vector path according to a percentage distance (0% to 100%) and auto-steers its rotation.',
    gizmoType: 'motion-path',
    syntaxAnatomy: 'offset-path: path("M 20 130 Q [cx] [cy] 300 130");\noffset-distance: [percent]%;\noffset-rotate: auto [angle]deg;',
    mentalModel: 'Instead of animating top/left, you define a vector curve with offset-path and scrub offset-distance from 0% to 100%! Drag the curve control point on the stage to reshape the trajectory live.',
    gotchas: [
      'offset-rotate: auto automatically points the element along the tangent of the curve; add a degree offset if your icon faces upward instead of right.'
    ],
    challenge: {
      title: 'Destination Reached',
      description: 'Scrub offset-distance to >= 85% along the curved flight trajectory.',
      check: (values) => values.distance >= 85
    },
    controls: [
      { key: 'distance', label: 'offset-distance', min: 0, max: 100, step: 1, defaultValue: 50, unit: '%' },
      { key: 'rotateOffset', label: 'offset-rotate angle', min: -180, max: 180, step: 5, defaultValue: 0, unit: 'deg' },
      { key: 'curveX', label: 'Control Point X', min: 40, max: 280, step: 5, defaultValue: 160, unit: 'px' },
      { key: 'curvePeak', label: 'Control Point Y (Arc Peak)', min: -40, max: 170, step: 5, defaultValue: 15, unit: 'px' }
    ],
    presets: [
      { name: 'Mid-Flight Apex (50%)', values: { distance: 50, rotateOffset: 0, curveX: 160, curvePeak: 10 } },
      { name: 'Deep Valley Swoop', values: { distance: 65, rotateOffset: 0, curveX: 160, curvePeak: 165 } },
      { name: 'Touchdown (95%)', values: { distance: 95, rotateOffset: 0, curveX: 210, curvePeak: 15 } }
    ],
    buildCss: (values) => `offset-path: path("M 20 130 Q ${values.curveX} ${values.curvePeak} 300 130");\noffset-distance: ${values.distance}%;\noffset-rotate: auto ${values.rotateOffset}deg;`
  }
];
