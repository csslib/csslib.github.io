<div align="center">

# &#123;csslib&#125;

### Modern CSS, made visible.

A growing collection of free, open-source CSS projects: visual studios for designing with CSS<br>
and libraries that do more with less. Everything runs in the browser and hands you plain, framework-free code.

[![Website](https://img.shields.io/badge/website-csslib.github.io-0d9488)](https://csslib.github.io/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Vektor.css](https://img.shields.io/badge/Vektor.css-v1.0.0-6366f1)](https://csslib.github.io/site/vektor/)
[![Built with](https://img.shields.io/badge/built%20with-HTML%20%7C%20CSS-e34f26)](https://developer.mozilla.org/en-US/docs/Web/CSS)
![Dependencies](https://img.shields.io/badge/dependencies-none-brightgreen)
![Build step](https://img.shields.io/badge/build%20step-none-lightgrey)

**🌐 Website: [csslib.github.io](https://csslib.github.io/)** · [Atelier](https://csslib.github.io/site/atelier/) · [Vektor.css](https://csslib.github.io/site/vektor/) · [Modern CSS](https://csslib.github.io/site/modern-css/) · [CSS resources](https://csslib.github.io/site/resources/) · [About](https://csslib.github.io/site/about/)

Free · Open source (MIT) · No sign-up · No build step

</div>

---

## Projects

| Project | What it is | |
|---|---|---|
| **[Atelier](#atelier--four-visual-css-studios)** | Four visual CSS studios for animation, gradients, properties and layout | [Open →](https://csslib.github.io/site/atelier/) |
| **[Vektor.css](#vektorcss--charts-in-pure-css)** | A charting library written in pure, native CSS | [Docs →](https://csslib.github.io/site/vektor/) |

More projects are on the way. To learn CSS itself, see [Learn modern CSS](#learn-modern-css) below.

---

## Atelier — four visual CSS studios

Drag, tune and play until it feels right, then take home clean, framework-free code. Nothing to install and nothing uploaded.

**[Open Atelier →](https://csslib.github.io/site/atelier/)**

### 🟠 Kinetix Studio — CSS animation generator

Choreograph CSS keyframe animations on a visual node graph. Run sequences in parallel, wait for them to sync, and tailor timing for every breakpoint.

`Node-graph sequencing` `Bézier easing editor` `Reduced-motion preview`

**[Open Kinetix Studio →](https://csslib.github.io/site/atelier/css-animation-generator/)** · [How it works](https://csslib.github.io/site/atelier/studios/css-animation-generator/)

### 🟣 ChromaFlow — CSS gradient generator

Paint mesh-like gradients by placing colour emitters on a canvas. Shape how far each one reaches and export perceptually smooth OKLCH CSS.

`Spatial colour emitters` `OKLCH interpolation` `Grain & noise`

**[Open ChromaFlow →](https://csslib.github.io/site/atelier/css-gradient-generator/)** · [How it works](https://csslib.github.io/site/atelier/studios/css-gradient-generator/)

### 🟩 Specimen Lab — CSS property playground

Put any visual CSS property under the microscope. Shadows, filters, clip-paths, transforms and type, each with live controls, guides and copy-ready code.

`box-shadow` `clip-path` `filter` `transform`

**[Open Specimen Lab →](https://csslib.github.io/site/atelier/css-property-playground/)** · [How it works](https://csslib.github.io/site/atelier/studios/css-property-playground/)

### 🔵 IntrinsicFlow — CSS Grid & Flexbox layout builder

Build responsive page structures visually with CSS Grid and Flexbox. Add sticky headers and sidebars, resize the viewport live, and export semantic HTML and CSS.

`Grid & Flexbox` `Sticky chrome` `Live viewport resize`

**[Open IntrinsicFlow →](https://csslib.github.io/site/atelier/css-layout-builder/)** · [How it works](https://csslib.github.io/site/atelier/studios/css-layout-builder/)

### From blank page to finished feel

| | Step | Studio |
|:-:|---|---|
| **01** | **Structure**: lay out regions and responsive behaviour | IntrinsicFlow |
| **02** | **Form**: refine shadows, radii and filters | Specimen Lab |
| **03** | **Colour**: paint rich, smooth backgrounds | ChromaFlow |
| **04** | **Motion**: bring it all to life | Kinetix Studio |

---

## Vektor.css — charts in pure CSS

Bar, radar, heatmap, donut, gauge, funnel and box-plot charts written as plain HTML lists and tables. One stylesheet, zero JavaScript, accessible by default, built on `@property`, `sin()`/`cos()`, `color-mix(in oklch)`, `:has()`, container queries and cascade layers.

```html
<link rel="stylesheet" href="https://csslib.github.io/vektor-1.0.0.css">

<div class="vk-scope" data-theme="light">
  <ul class="vk-chart vk-bar vk-grid-y" style="--target: 80" data-target-label="Goal: 80%">
    <li style="--val: 65" data-label="Q1" data-value="65%"></li>
    <li style="--val: 88" data-label="Q2" data-value="88%"></li>
  </ul>
</div>
```

**[Vektor.css docs & live gallery →](https://csslib.github.io/site/vektor/)** · [Download v1.0.0](vektor-1.0.0.css)

Releases keep their version in the file name (`vektor-1.0.0.css`), so a link never changes under you. The source file lives at [`vektor-1.0.0.css`](vektor-1.0.0.css) at the repository root, so its address stays short and stable. A CDN option is a work in progress; for now, link the hosted file or self-host it.

---

## Learn modern CSS

Two reference pages to help you keep up with CSS itself:

- **[Modern CSS](https://csslib.github.io/site/modern-css/)**: more than 30 recent and upcoming features, including container queries, `:has()`, nesting, cascade layers, `@scope`, `oklch()`, `color-mix()`, `light-dark()`, popover, `@starting-style`, view transitions, scroll-driven animations, `@property`, `sibling-index()`, anchor positioning, `if()` and `@function`. Each comes with a plain explanation, a code example, a live demo where it helps, its Baseline browser support, and links to MDN, the specification and [webstatus.dev](https://webstatus.dev/).
- **[CSS resources](https://csslib.github.io/site/resources/)**: a curated list of official sources, covering W3C and CSS Working Group specifications, MDN's reference and courses, Baseline, Can I use and Interop, release notes from Chrome, Firefox and Safari, validators, DevTools and accessibility guidelines.

---

## Questions, answered

**Is everything free?**<br>
Yes. Every csslib project is free to use under the MIT License, with no sign-up and no paid tier.

**Do I need to install anything?**<br>
No. The Atelier studios open straight in your browser, and Vektor.css is a single stylesheet you link or download.

**What do the projects produce?**<br>
Plain, framework-free CSS (and HTML for layouts and charts) that you can paste into any project.

**Is my work uploaded anywhere?**<br>
No. Everything happens on your own device.

---

## About

Made by **Abhishek Sengar**, who builds Android apps, WebGPU experiences and developer tools, and writes tutorials.

[About csslib](https://csslib.github.io/site/about/) · [GitHub](https://github.com/monad-one) · [LinkedIn](https://www.linkedin.com/in/abhishek-sengar)

Questions, bug reports and ideas for new projects are all welcome.

---

## License

Copyright (c) 2026 Abhishek Sengar

csslib and every project in it, including Atelier and Vektor.css, are released under the **MIT License**: use, copy, modify, merge, publish, distribute, sublicense and sell them freely, as long as the copyright notice and permission notice are kept. They are provided "as is", without warranty of any kind. See the [`LICENSE`](LICENSE) file for the full text.

csslib bundles [Lit](https://lit.dev), which is distributed under its own BSD-3-Clause license.

<div align="center">

<sub>css library · modern css · new css features · css baseline browser support · css resources · css specifications · css animation generator · keyframes generator · css gradient generator · mesh gradient · oklch gradient · css playground · clip-path generator · box-shadow generator · css grid generator · flexbox layout builder · visual css editor · css charts · pure css chart library</sub>

</div>
