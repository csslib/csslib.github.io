// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

export function dispatchValueChanges(element, valueChanges) {
  element.dispatchEvent(new CustomEvent('param-change', {
    detail: { updates: valueChanges },
    bubbles: true,
    composed: true
  }));
}

export function copyTextWithHiddenTextArea(text) {
  const hiddenTextArea = document.createElement('textarea');
  hiddenTextArea.value = text;
  hiddenTextArea.style.position = 'fixed';
  hiddenTextArea.style.opacity = '0';
  document.body.appendChild(hiddenTextArea);
  hiddenTextArea.select();
  try {
    document.execCommand('copy');
    return true;
  } catch (error) {
    console.error('Copy failed', error);
    return false;
  } finally {
    document.body.removeChild(hiddenTextArea);
  }
}
