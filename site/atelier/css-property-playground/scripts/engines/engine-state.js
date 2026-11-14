// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { ALL_CATEGORIES_FILTER } from '../config/constants.js';
import { QUICK_ENCYCLOPEDIA_ALIASES } from '../data/encyclopedia-aliases.js';
import { CSS_PROPERTY_ENGINES } from '../data/property-engines.js';
import { clampToRange, cloneDeep } from '../utils/value-math.js';

export function createInitialValues(engine) {
  const initialValues = engine.defaultState ? cloneDeep(engine.defaultState) : {};
  (engine.controls || []).forEach(control => {
    initialValues[control.key] = control.defaultValue;
  });
  return initialValues;
}

export function createInitialValuesByEngineId(engines) {
  const valuesByEngineId = {};
  engines.forEach(engine => {
    valuesByEngineId[engine.id] = createInitialValues(engine);
  });
  return valuesByEngineId;
}

export function isChallengeSolved(engine, values) {
  if (!engine.challenge || typeof engine.challenge.check !== 'function') return false;
  return Boolean(engine.challenge.check(values));
}

export function filterEngines(normalizedQuery, selectedCategory) {
  return CSS_PROPERTY_ENGINES.filter(engine => {
    const isInCategory = selectedCategory === ALL_CATEGORIES_FILTER || engine.category === selectedCategory;
    return isInCategory && engineMatchesQuery(engine, normalizedQuery);
  });
}

function engineMatchesQuery(engine, normalizedQuery) {
  if (!normalizedQuery) return true;
  return engine.name.toLowerCase().includes(normalizedQuery) ||
    engine.category.toLowerCase().includes(normalizedQuery) ||
    engine.summary.toLowerCase().includes(normalizedQuery) ||
    engine.controls.some(control => control.label.toLowerCase().includes(normalizedQuery));
}

export function filterAliases(normalizedQuery) {
  if (!normalizedQuery) return [];
  return QUICK_ENCYCLOPEDIA_ALIASES.filter(alias =>
    alias.propertyLabel.toLowerCase().includes(normalizedQuery) || alias.note.toLowerCase().includes(normalizedQuery)
  );
}

export function describeClampState(preferredPx, values) {
  if (preferredPx <= values.minPx) return 'Clamped at MIN';
  if (preferredPx >= values.maxPx) return 'Capped at MAX';
  return 'Scaling Fluidly (vw)';
}

export function getActiveLayerIndex(layers, activeLayerIdx) {
  return clampToRange(activeLayerIdx || 0, 0, layers.length - 1);
}
