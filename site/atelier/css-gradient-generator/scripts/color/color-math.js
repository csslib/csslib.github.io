// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { DEFAULT_COLOR_SPACE, DEFAULT_HUE_MODE, FALLBACK_HEX, FULL_TURN_DEG, HALF_TURN_DEG, PERCENT } from '../config/constants.js';
import { degreesToRadians, roundTo, wrapDegrees } from '../utils/angle-math.js';

const HEX_RADIX = 16;
const BYTE_MAX = 255;
const SHORT_HEX_LENGTH = 3;
const FULL_HEX_LENGTH = 6;
const DEGREES_PER_RADIAN = 180 / Math.PI;
const OPAQUE_ALPHA_THRESHOLD = 0.999;
const ACHROMATIC_CHROMA_LIMIT = 0.0001;
const GREY_HUE_CHROMA_LIMIT = 0.002;
const WCAG_FLARE = 0.05;
const GRADING_LIMITS = { minLightness: 0.04, maxLightness: 0.97, maxChroma: 0.35 };
const GRADING_NEUTRAL_TOLERANCE = { hueShiftDeg: 0.1, lightnessOffset: 0.002, chromaMultiplier: 0.01 };

export class ColorMath {
  static clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  static lerp(from, to, t) {
    return from + (to - from) * t;
  }

  static hexToRgb(hex) {
    const packedRgb = parseInt(this.normalizeHexDigits(hex), HEX_RADIX);
    return {
      r: ((packedRgb >> 16) & BYTE_MAX) / BYTE_MAX,
      g: ((packedRgb >> 8) & BYTE_MAX) / BYTE_MAX,
      b: (packedRgb & BYTE_MAX) / BYTE_MAX
    };
  }

  static normalizeHexDigits(hex) {
    let digits = (hex || FALLBACK_HEX).replace('#', '').trim();
    if (digits.length === SHORT_HEX_LENGTH) {
      digits = digits.split('').map(digit => digit + digit).join('');
    }
    return digits.length === FULL_HEX_LENGTH ? digits : FALLBACK_HEX.slice(1);
  }

  static channelToByte(channel) {
    return Math.round(this.clamp(channel, 0, 1) * BYTE_MAX);
  }

  static rgbToHex({ r, g, b }) {
    const channelToHex = (channel) => this.channelToByte(channel).toString(HEX_RADIX).padStart(2, '0');
    return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}`.toUpperCase();
  }

  static rgbToCss({ r, g, b }, alpha = 1) {
    const red = this.channelToByte(r);
    const green = this.channelToByte(g);
    const blue = this.channelToByte(b);
    const opacity = roundTo(this.clamp(alpha, 0, 1), 3);
    return opacity >= OPAQUE_ALPHA_THRESHOLD ? `rgb(${red}, ${green}, ${blue})` : `rgba(${red}, ${green}, ${blue}, ${opacity})`;
  }

  static srgbToLinear(channel) {
    return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  }

  static linearToSrgb(channel) {
    return channel <= 0.0031308 ? 12.92 * channel : 1.055 * Math.pow(Math.max(channel, 0), 1 / 2.4) - 0.055;
  }

  static rgbToOklab({ r, g, b }) {
    const linearRed = this.srgbToLinear(r);
    const linearGreen = this.srgbToLinear(g);
    const linearBlue = this.srgbToLinear(b);

    const l = Math.cbrt(0.4122214708 * linearRed + 0.5363325363 * linearGreen + 0.0514459929 * linearBlue);
    const m = Math.cbrt(0.2119034982 * linearRed + 0.6806995451 * linearGreen + 0.1073969566 * linearBlue);
    const s = Math.cbrt(0.0883024619 * linearRed + 0.2817188376 * linearGreen + 0.6299787005 * linearBlue);

    return {
      L: 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
      a: 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
      b: 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
    };
  }

  static oklabToRgb({ L, a, b }) {
    const lRoot = L + 0.3963377774 * a + 0.2158037573 * b;
    const mRoot = L - 0.1055613458 * a - 0.0638541728 * b;
    const sRoot = L - 0.0894841775 * a - 1.2914855480 * b;

    const l = lRoot * lRoot * lRoot;
    const m = mRoot * mRoot * mRoot;
    const s = sRoot * sRoot * sRoot;

    const linearRed = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    const linearGreen = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    const linearBlue = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

    return {
      r: this.clamp(this.linearToSrgb(linearRed), 0, 1),
      g: this.clamp(this.linearToSrgb(linearGreen), 0, 1),
      b: this.clamp(this.linearToSrgb(linearBlue), 0, 1)
    };
  }

  static rgbToOklch(rgb) {
    const oklab = this.rgbToOklab(rgb);
    const C = Math.sqrt(oklab.a * oklab.a + oklab.b * oklab.b);
    let h = Math.atan2(oklab.b, oklab.a) * DEGREES_PER_RADIAN;
    if (h < 0) h += FULL_TURN_DEG;
    const isAchromatic = C < ACHROMATIC_CHROMA_LIMIT;
    return { L: this.clamp(oklab.L, 0, 1), C: isAchromatic ? 0 : C, h: isAchromatic ? 0 : h };
  }

  static oklchToRgb({ L, C, h }) {
    const hueRad = degreesToRadians(h);
    return this.oklabToRgb({
      L,
      a: C * Math.cos(hueRad),
      b: C * Math.sin(hueRad)
    });
  }

  static hexToOklch(hex) {
    return this.rgbToOklch(this.hexToRgb(hex));
  }

  static oklchToHex(oklch) {
    return this.rgbToHex(this.oklchToRgb(oklch));
  }

  static rgbToHsl({ r, g, b }) {
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max === min) return { h, s, l };
    const range = max - min;
    s = l > 0.5 ? range / (2 - max - min) : range / (max + min);
    switch (max) {
      case r: h = (g - b) / range + (g < b ? 6 : 0); break;
      case g: h = (b - r) / range + 2; break;
      case b: h = (r - g) / range + 4; break;
    }
    h *= 60;
    return { h, s, l };
  }

  static hslToRgb({ h, s, l }) {
    const hue = wrapDegrees(h);
    const chroma = (1 - Math.abs(2 * l - 1)) * s;
    const secondary = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
    const lightnessMatch = l - chroma / 2;
    const { r, g, b } = this.hueSextantToRgb(hue, chroma, secondary);
    return { r: r + lightnessMatch, g: g + lightnessMatch, b: b + lightnessMatch };
  }

  static hueSextantToRgb(hue, chroma, secondary) {
    if (hue < 60) return { r: chroma, g: secondary, b: 0 };
    if (hue < 120) return { r: secondary, g: chroma, b: 0 };
    if (hue < 180) return { r: 0, g: chroma, b: secondary };
    if (hue < 240) return { r: 0, g: secondary, b: chroma };
    if (hue < 300) return { r: secondary, g: 0, b: chroma };
    return { r: chroma, g: 0, b: secondary };
  }

  static interpolateHue(fromHue, toHue, t, hueMode = DEFAULT_HUE_MODE) {
    const delta = this.adjustHueDelta(toHue - fromHue, hueMode);
    return wrapDegrees(fromHue + delta * t);
  }

  static adjustHueDelta(delta, hueMode) {
    if (hueMode === 'shorter') {
      if (delta > HALF_TURN_DEG) return delta - FULL_TURN_DEG;
      if (delta < -HALF_TURN_DEG) return delta + FULL_TURN_DEG;
      return delta;
    }
    if (hueMode === 'longer') {
      if (delta > 0 && delta < HALF_TURN_DEG) return delta - FULL_TURN_DEG;
      if (delta <= 0 && delta > -HALF_TURN_DEG) return delta + FULL_TURN_DEG;
      return delta;
    }
    if (hueMode === 'increasing') return delta < 0 ? delta + FULL_TURN_DEG : delta;
    if (hueMode === 'decreasing') return delta > 0 ? delta - FULL_TURN_DEG : delta;
    return delta;
  }

  static mixColors(fromHex, toHex, t, { colorSpace = DEFAULT_COLOR_SPACE, hueMode = DEFAULT_HUE_MODE } = {}) {
    const progress = this.clamp(t, 0, 1);
    const mixedRgb = this.mixRgb(this.hexToRgb(fromHex), this.hexToRgb(toHex), progress, { colorSpace, hueMode });
    return {
      rgb: mixedRgb,
      hex: this.rgbToHex(mixedRgb),
      oklch: this.rgbToOklch(mixedRgb)
    };
  }

  static mixRgb(fromRgb, toRgb, t, { colorSpace, hueMode }) {
    if (colorSpace === 'srgb') return this.mixInSrgb(fromRgb, toRgb, t);
    if (colorSpace === 'linear-rgb') return this.mixInLinearRgb(fromRgb, toRgb, t);
    if (colorSpace === 'oklab') return this.mixInOklab(fromRgb, toRgb, t);
    if (colorSpace === 'hsl') return this.mixInHsl(fromRgb, toRgb, t, hueMode);
    return this.mixInOklch(fromRgb, toRgb, t, hueMode);
  }

  static mixInSrgb(fromRgb, toRgb, t) {
    return {
      r: this.lerp(fromRgb.r, toRgb.r, t),
      g: this.lerp(fromRgb.g, toRgb.g, t),
      b: this.lerp(fromRgb.b, toRgb.b, t)
    };
  }

  static mixInLinearRgb(fromRgb, toRgb, t) {
    const mixChannel = (fromChannel, toChannel) => this.clamp(
      this.linearToSrgb(this.lerp(this.srgbToLinear(fromChannel), this.srgbToLinear(toChannel), t)),
      0,
      1
    );
    return {
      r: mixChannel(fromRgb.r, toRgb.r),
      g: mixChannel(fromRgb.g, toRgb.g),
      b: mixChannel(fromRgb.b, toRgb.b)
    };
  }

  static mixInOklab(fromRgb, toRgb, t) {
    const fromLab = this.rgbToOklab(fromRgb);
    const toLab = this.rgbToOklab(toRgb);
    return this.oklabToRgb({
      L: this.lerp(fromLab.L, toLab.L, t),
      a: this.lerp(fromLab.a, toLab.a, t),
      b: this.lerp(fromLab.b, toLab.b, t)
    });
  }

  static mixInHsl(fromRgb, toRgb, t, hueMode) {
    const fromHsl = this.rgbToHsl(fromRgb);
    const toHsl = this.rgbToHsl(toRgb);
    return this.hslToRgb({
      h: this.interpolateHue(fromHsl.h, toHsl.h, t, hueMode),
      s: this.lerp(fromHsl.s, toHsl.s, t),
      l: this.lerp(fromHsl.l, toHsl.l, t)
    });
  }

  static mixInOklch(fromRgb, toRgb, t, hueMode) {
    const fromLch = this.rgbToOklch(fromRgb);
    const toLch = this.rgbToOklch(toRgb);
    const fromHue = fromLch.C < GREY_HUE_CHROMA_LIMIT ? toLch.h : fromLch.h;
    const toHue = toLch.C < GREY_HUE_CHROMA_LIMIT ? fromLch.h : toLch.h;
    return this.oklchToRgb({
      L: this.lerp(fromLch.L, toLch.L, t),
      C: this.lerp(fromLch.C, toLch.C, t),
      h: this.interpolateHue(fromHue, toHue, t, hueMode)
    });
  }

  static relativeLuminance({ r, g, b }) {
    return 0.2126 * this.srgbToLinear(r) + 0.7152 * this.srgbToLinear(g) + 0.0722 * this.srgbToLinear(b);
  }

  static contrastRatio(firstRgb, secondRgb) {
    const firstLuminance = this.relativeLuminance(firstRgb);
    const secondLuminance = this.relativeLuminance(secondRgb);
    const brightest = Math.max(firstLuminance, secondLuminance);
    const darkest = Math.min(firstLuminance, secondLuminance);
    return (brightest + WCAG_FLARE) / (darkest + WCAG_FLARE);
  }

  static applyGlobalGrading(hex, globals) {
    if (!globals) return hex;
    const grading = {
      hueShiftDeg: Number(globals.hueShift || 0),
      lightnessOffset: Number(globals.lightnessOffset || 0) / PERCENT,
      chromaMultiplier: Number(globals.chromaBoost ?? 1)
    };
    if (this.isGradingNeutral(grading)) return hex;
    const oklch = this.hexToOklch(hex);
    return this.oklchToHex({
      L: this.clamp(oklch.L + grading.lightnessOffset, GRADING_LIMITS.minLightness, GRADING_LIMITS.maxLightness),
      C: this.clamp(oklch.C * grading.chromaMultiplier, 0, GRADING_LIMITS.maxChroma),
      h: wrapDegrees(oklch.h + grading.hueShiftDeg)
    });
  }

  static isGradingNeutral({ hueShiftDeg, lightnessOffset, chromaMultiplier }) {
    return Math.abs(hueShiftDeg) < GRADING_NEUTRAL_TOLERANCE.hueShiftDeg
      && Math.abs(lightnessOffset) < GRADING_NEUTRAL_TOLERANCE.lightnessOffset
      && Math.abs(chromaMultiplier - 1) < GRADING_NEUTRAL_TOLERANCE.chromaMultiplier;
  }
}
