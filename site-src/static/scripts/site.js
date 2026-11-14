// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

const POPOVER_GAP_PX = 10;
const VIEWPORT_MARGIN_PX = 12;
const SCROLLED_THRESHOLD_PX = 8;

const siteHeader = document.querySelector('.site-header');

bindHeaderElevation(siteHeader);
document.querySelectorAll('[popovertarget]').forEach(bindPopoverTrigger);

function bindHeaderElevation(header) {
  if (!header) return;
  const updateElevation = () => header.classList.toggle('is-scrolled', window.scrollY > SCROLLED_THRESHOLD_PX);
  updateElevation();
  window.addEventListener('scroll', updateElevation, { passive: true });
}

function bindPopoverTrigger(trigger) {
  const popover = document.getElementById(trigger.getAttribute('popovertarget'));
  if (!popover || !popover.showPopover) return;
  popover.addEventListener('beforetoggle', (event) => {
    const isOpening = event.newState === 'open';
    trigger.setAttribute('aria-expanded', String(isOpening));
    if (isOpening) placePopover(trigger, popover);
  });
  window.addEventListener('resize', () => {
    if (popover.matches(':popover-open')) popover.hidePopover();
  });
}

function placePopover(trigger, popover) {
  const anchor = popover.dataset.anchor === 'header' ? siteHeader.querySelector('.site-header-bar') : trigger;
  const anchorRect = anchor.getBoundingClientRect();
  const declaredWidth = parseFloat(getComputedStyle(popover).width) || anchorRect.width;
  const popoverWidth = Math.min(declaredWidth, window.innerWidth - VIEWPORT_MARGIN_PX * 2);
  const preferredLeft = popover.dataset.anchor === 'header' ? anchorRect.left : anchorRect.left + anchorRect.width / 2 - popoverWidth / 2;
  const left = Math.min(Math.max(VIEWPORT_MARGIN_PX, preferredLeft), window.innerWidth - popoverWidth - VIEWPORT_MARGIN_PX);
  popover.style.top = `${anchorRect.bottom + POPOVER_GAP_PX}px`;
  popover.style.left = `${left}px`;
  if (popover.dataset.anchor === 'header') popover.style.width = `${anchorRect.width}px`;
}
