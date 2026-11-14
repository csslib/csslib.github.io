// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

const ALERT_THRESHOLD = 85;
const COPIED_FEEDBACK_MS = 1600;
const SERIES_FOR_ALERT = '3';

const gallery = document.getElementById('chart-gallery');

bindThemeChoice();
bindSeedColour();
bindToggle('toggle-values', () => document.getElementById('main-bar').classList.toggle('vk-values-visible'));
bindToggle('toggle-grouped', () => document.getElementById('multi-bar').classList.toggle('vk-grouped'));
document.getElementById('shuffle-data').addEventListener('click', shuffleGalleryData);
document.querySelectorAll('.demo-code').forEach(bindSourceView);
document.querySelectorAll('.copy-button[data-copy-text], .copy-button[data-copy-from]').forEach(bindCopyButton);

function bindThemeChoice() {
  const choices = document.querySelectorAll('[data-theme-choice]');
  choices.forEach((choice) => choice.addEventListener('click', () => {
    gallery.dataset.theme = choice.dataset.themeChoice;
    choices.forEach((other) => other.setAttribute('aria-checked', String(other === choice)));
  }));
}

function bindSeedColour() {
  document.getElementById('seed-color').addEventListener('input', (event) => {
    document.documentElement.style.setProperty('--vk-seed', event.target.value);
  });
}

function bindToggle(buttonId, applyToggle) {
  const button = document.getElementById(buttonId);
  button.addEventListener('click', () => {
    applyToggle();
    button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'));
  });
}

function randomBetween(minimum, maximum) {
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

function shuffleGalleryData() {
  document.querySelectorAll('#main-bar tbody tr').forEach(updateBarRow);
  document.querySelectorAll('#demo-radar li').forEach((item) => item.style.setProperty('--val', randomBetween(45, 96)));
  document.querySelectorAll('#multi-bar .vk-seg').forEach((segment) => segment.style.setProperty('--val', randomBetween(15, 42)));
  document.querySelectorAll('#heatmap .vk-heatmap-cell').forEach(updateHeatmapCell);
  document.querySelectorAll('#funnel li').forEach(updateFunnelStep);
  updateGauge(randomBetween(52, 98));
  document.querySelectorAll('.demo-code[open]').forEach(renderSource);
}

function updateBarRow(row) {
  const value = randomBetween(28, 96);
  const isAlert = value >= ALERT_THRESHOLD;
  row.style.setProperty('--val', value);
  row.dataset.value = `${value}%`;
  row.lastElementChild.textContent = `${value}%`;
  if (isAlert) {
    row.dataset.alert = 'high';
    row.dataset.series = SERIES_FOR_ALERT;
    return;
  }
  delete row.dataset.alert;
  row.dataset.series = value % 2 === 0 ? '1' : '2';
}

function updateHeatmapCell(cell) {
  const value = randomBetween(10, 99);
  cell.style.setProperty('--val', value);
  cell.textContent = value;
}

function updateFunnelStep(step, index) {
  const value = index === 0 ? 100 : randomBetween(20, 90 - index * 10);
  step.style.setProperty('--val', value);
  step.querySelector('.vk-hbar-val').textContent = `${value}%`;
}

function updateGauge(value) {
  document.getElementById('gauge').style.setProperty('--val', value);
  document.getElementById('gauge-value').textContent = value;
}

function bindSourceView(details) {
  details.addEventListener('toggle', () => {
    if (details.open) renderSource(details);
  });
}

function renderSource(details) {
  const code = details.querySelector('[data-source-of]');
  code.textContent = readChartSource(code.dataset.sourceOf);
}

function readChartSource(chartId) {
  return document.getElementById(chartId).innerHTML.trim();
}

function bindCopyButton(button) {
  button.addEventListener('click', async () => {
    const text = button.dataset.copyText ?? readChartSource(button.dataset.copyFrom);
    const originalLabel = button.textContent;
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = 'Copied!';
    } catch {
      button.textContent = 'Press ⌘C';
    }
    setTimeout(() => { button.textContent = originalLabel; }, COPIED_FEEDBACK_MS);
  });
}
