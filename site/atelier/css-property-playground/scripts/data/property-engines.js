// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { CLIP_MASK_AND_SHAPES_ENGINES } from './property-engines/clip-mask-and-shapes-engines.js';
import { BOX_AND_BORDERS_ENGINES } from './property-engines/box-and-borders-engines.js';
import { SHADOWS_AND_DEPTH_ENGINES } from './property-engines/shadows-and-depth-engines.js';
import { BACKGROUNDS_AND_GRADIENTS_ENGINES } from './property-engines/backgrounds-and-gradients-engines.js';
import { TRANSFORMS_2D_AND_3D_ENGINES } from './property-engines/2d-and-3d-transforms-engines.js';
import { FILTERS_AND_OPTICAL_ENGINES } from './property-engines/filters-and-optical-engines.js';
import { TYPOGRAPHY_AND_TEXT_ENGINES } from './property-engines/typography-and-text-engines.js';
import { FLEXBOX_AND_GRID_ENGINES } from './property-engines/flexbox-and-grid-engines.js';
import { MOTION_AND_TIMING_ENGINES } from './property-engines/motion-and-timing-engines.js';
import { SCROLL_AND_STACKING_ENGINES } from './property-engines/scroll-and-stacking-engines.js';

export const CSS_PROPERTY_ENGINES = [
  ...CLIP_MASK_AND_SHAPES_ENGINES,
  ...BOX_AND_BORDERS_ENGINES,
  ...SHADOWS_AND_DEPTH_ENGINES,
  ...BACKGROUNDS_AND_GRADIENTS_ENGINES,
  ...TRANSFORMS_2D_AND_3D_ENGINES,
  ...FILTERS_AND_OPTICAL_ENGINES,
  ...TYPOGRAPHY_AND_TEXT_ENGINES,
  ...FLEXBOX_AND_GRID_ENGINES,
  ...MOTION_AND_TIMING_ENGINES,
  ...SCROLL_AND_STACKING_ENGINES
];
