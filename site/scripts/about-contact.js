// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

const VISIBLE_EMAIL_CHARACTERS = 2;
const EMAIL_MASK = '•••';

bindAuthorEmailButtons();

function bindAuthorEmailButtons() {
  for (const emailButton of document.querySelectorAll('.author-email')) {
    const { emailUser, emailDomain } = emailButton.dataset;
    const emailText = emailButton.querySelector('.author-email-text');
    if (emailText) emailText.textContent = maskEmail(emailUser, emailDomain);
    emailButton.addEventListener('click', () => {
      window.location.href = `mailto:${emailUser}@${emailDomain}`;
    });
  }
}

function maskEmail(user, domain) {
  const topLevelStart = domain.lastIndexOf('.');
  const domainName = topLevelStart > 0 ? domain.slice(0, topLevelStart) : domain;
  const topLevel = topLevelStart > 0 ? domain.slice(topLevelStart) : '';
  return `${user.slice(0, VISIBLE_EMAIL_CHARACTERS)}${EMAIL_MASK}@${domainName.slice(0, VISIBLE_EMAIL_CHARACTERS)}${EMAIL_MASK}${topLevel}`;
}
