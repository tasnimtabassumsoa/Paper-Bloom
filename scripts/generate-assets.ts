import fs from 'node:fs';
import path from 'node:path';
import { SEED_PRODUCTS } from '../shared/catalog-seed';

const outProductsDir = path.resolve(process.cwd(), 'public/images/products');
const outImagesDir = path.resolve(process.cwd(), 'public/images');
fs.mkdirSync(outProductsDir, { recursive: true });
fs.mkdirSync(outImagesDir, { recursive: true });

// Hero editorial stationery flat-lay SVG
const heroSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 720" fill="none">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="960" y2="720" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#faf6f0"/>
      <stop offset="100%" stop-color="#eef4ed"/>
    </linearGradient>
    <filter id="softShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#181d1a" flood-opacity="0.10"/>
    </filter>
  </defs>
  <rect width="960" height="720" fill="url(#bg)"/>
  <!-- Subtle paper texture lines -->
  <circle cx="820" cy="120" r="180" fill="#c7e8d1" opacity="0.35"/>
  <circle cx="140" cy="610" r="210" fill="#dec0b7" opacity="0.25"/>

  <!-- Open cream sketchbook -->
  <g filter="url(#softShadow)" transform="translate(110 130) rotate(-5)">
    <rect width="420" height="300" rx="14" fill="#ffffff" stroke="#dec0b7" stroke-width="2"/>
    <line x1="210" y1="12" x2="210" y2="288" stroke="#dec0b7" stroke-width="2"/>
    <line x1="36" y1="68" x2="174" y2="68" stroke="#e9e2dc" stroke-width="2"/>
    <line x1="36" y1="98" x2="174" y2="98" stroke="#e9e2dc" stroke-width="2"/>
    <line x1="36" y1="128" x2="174" y2="128" stroke="#e9e2dc" stroke-width="2"/>
    <line x1="36" y1="158" x2="152" y2="158" stroke="#e9e2dc" stroke-width="2"/>
    <!-- Botanical sketch on right page -->
    <path d="M312 225 C310 175 314 125 322 86" stroke="#476553" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M314 176 C290 165 276 148 282 134 C298 140 310 156 314 176 Z" fill="#c7e8d1" stroke="#476553" stroke-width="1.8"/>
    <path d="M317 142 C340 130 356 112 348 98 C332 104 322 122 317 142 Z" fill="#c7e8d1" stroke="#476553" stroke-width="1.8"/>
    <circle cx="322" cy="78" r="14" fill="#bf542c" opacity="0.85"/>
    <circle cx="322" cy="78" r="5" fill="#faf6f0"/>
  </g>

  <!-- Terracotta personalized journal -->
  <g filter="url(#softShadow)" transform="translate(495 160) rotate(6)">
    <rect width="260" height="356" rx="18" fill="#9f3c16"/>
    <rect x="20" y="0" width="8" height="356" fill="#7d2c0e" opacity="0.45"/>
    <rect x="228" y="0" width="8" height="356" fill="#181d1a" opacity="0.35"/>
    <rect x="54" y="108" width="160" height="58" rx="6" fill="none" stroke="#f3d6b0" stroke-width="1.5" opacity="0.8"/>
    <text x="134" y="144" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="22" fill="#f8e3c4">Paper Bloom</text>
    <text x="134" y="192" text-anchor="middle" font-family="sans-serif" font-size="11" letter-spacing="3" fill="#dec0b7">CUSTOM FOIL</text>
  </g>

  <!-- Sage washi tape rolls -->
  <g filter="url(#softShadow)" transform="translate(185 470)">
    <circle cx="52" cy="52" r="46" fill="#476553"/>
    <circle cx="52" cy="52" r="22" fill="#faf6f0"/>
    <circle cx="154" cy="64" r="40" fill="#dec0b7"/>
    <circle cx="154" cy="64" r="19" fill="#faf6f0"/>
  </g>

  <!-- Brass pen -->
  <g filter="url(#softShadow)" transform="translate(390 480) rotate(-18)">
    <rect width="230" height="18" rx="9" fill="#bf542c"/>
    <rect x="165" y="0" width="46" height="18" rx="4" fill="#d9b26f"/>
    <polygon points="0,9 -18,4 -18,14" fill="#181d1a"/>
  </g>

  <!-- Wax seal -->
  <g filter="url(#softShadow)" transform="translate(760 490)">
    <circle cx="38" cy="38" r="34" fill="#9f3c16"/>
    <circle cx="38" cy="38" r="24" fill="none" stroke="#f3d6b0" stroke-width="1.5"/>
    <text x="38" y="45" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="20" fill="#f8e3c4">PB</text>
  </g>
</svg>`;

fs.writeFileSync(path.join(outImagesDir, 'hero-flatlay.svg'), heroSvg, 'utf8');

// Custom journal spotlight SVG
const customJournalSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 900" fill="none">
  <rect width="720" height="900" fill="#faf6f0"/>
  <circle cx="560" cy="190" r="190" fill="#c7e8d1" opacity="0.45"/>
  <circle cx="170" cy="720" r="200" fill="#dec0b7" opacity="0.35"/>
  <g transform="translate(150 110)">
    <rect x="18" y="24" width="400" height="630" rx="22" fill="#181d1a" opacity="0.09"/>
    <rect width="400" height="630" rx="22" fill="#9f3c16"/>
    <rect x="30" y="0" width="10" height="630" fill="#7d2c0e" opacity="0.5"/>
    <rect x="352" y="0" width="14" height="630" fill="#181d1a" opacity="0.32"/>
    <rect x="68" y="180" width="264" height="110" rx="8" stroke="#f2d5a9" stroke-width="1.5" opacity="0.8"/>
    <text x="200" y="232" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="32" fill="#fae7ca">Tasnim</text>
    <text x="200" y="268" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#dec0b7" letter-spacing="2">তাসনিম · 2026</text>
    <path d="M200 410 C200 385 215 370 226 365 C224 385 212 400 200 410 Z" fill="#f2d5a9" opacity="0.75"/>
    <path d="M200 410 C200 385 185 370 174 365 C176 385 188 400 200 410 Z" fill="#f2d5a9" opacity="0.75"/>
    <rect x="172" y="630" width="22" height="44" fill="#476553"/>
  </g>
</svg>`;

fs.writeFileSync(path.join(outImagesDir, 'custom-journal.svg'), customJournalSvg, 'utf8');

type Palette = {
  bg: string;
  accent: string;
  secondary: string;
  ink: string;
  sand: string;
};

const PALETTES: Record<string, Palette> = {
  'everyday-stationery': { bg: '#f6fbf5', accent: '#476553', secondary: '#c7e8d1', ink: '#181d1a', sand: '#dec0b7' },
  'custom-studio': { bg: '#faf4ee', accent: '#9f3c16', secondary: '#f3d6b0', ink: '#181d1a', sand: '#dec0b7' },
  'aesthetic-stationery': { bg: '#f7f8f3', accent: '#bf542c', secondary: '#c7e8d1', ink: '#181d1a', sand: '#dec0b7' },
  'art-supplies': { bg: '#f9f5ef', accent: '#476553', secondary: '#bf542c', ink: '#181d1a', sand: '#dec0b7' },
  'books-learning': { bg: '#f4f8f4', accent: '#9f3c16', secondary: '#476553', ink: '#181d1a', sand: '#dec0b7' },
  'gift-bundles': { bg: '#fbf5ef', accent: '#9f3c16', secondary: '#476553', ink: '#181d1a', sand: '#dec0b7' },
};

function renderIllustration(slug: string, catFamily: string, title: string): string {
  const p = PALETTES[catFamily] ?? PALETTES['everyday-stationery']!;
  let shape = '';

  if (slug.includes('pen') || slug.includes('highlighter') || slug.includes('fineliner')) {
    shape = `
      <g transform="translate(120 130) rotate(-18)">
        <rect x="0" y="70" width="24" height="260" rx="12" fill="${p.accent}"/>
        <rect x="0" y="70" width="24" height="54" rx="8" fill="${p.secondary}"/>
        <polygon points="12,354 3,330 21,330" fill="${p.ink}"/>
      </g>
      <g transform="translate(215 115) rotate(-8)">
        <rect x="0" y="70" width="24" height="260" rx="12" fill="${p.secondary}"/>
        <rect x="0" y="70" width="24" height="54" rx="8" fill="${p.accent}"/>
        <polygon points="12,354 3,330 21,330" fill="${p.ink}"/>
      </g>
      <g transform="translate(305 140) rotate(5)">
        <rect x="0" y="70" width="24" height="260" rx="12" fill="${p.sand}"/>
        <rect x="0" y="70" width="24" height="54" rx="8" fill="${p.ink}"/>
        <polygon points="12,354 3,330 21,330" fill="${p.ink}"/>
      </g>`;
  } else if (slug.includes('pencil')) {
    shape = `
      <rect x="130" y="160" width="220" height="290" rx="14" fill="#ffffff" stroke="${p.sand}" stroke-width="2"/>
      <rect x="155" y="105" width="24" height="190" rx="4" fill="#c7e8d1"/>
      <rect x="195" y="90" width="24" height="205" rx="4" fill="${p.accent}"/>
      <rect x="235" y="100" width="24" height="195" rx="4" fill="#dec0b7"/>
      <rect x="275" y="110" width="24" height="185" rx="4" fill="#476553"/>
      <rect x="150" y="270" width="180" height="140" rx="8" fill="${p.bg}" stroke="${p.sand}"/>`;
  } else if (slug.includes('washi') || slug.includes('wax')) {
    shape = `
      <circle cx="195" cy="240" r="78" fill="${p.accent}"/>
      <circle cx="195" cy="240" r="34" fill="${p.bg}"/>
      <circle cx="305" cy="310" r="68" fill="${p.secondary}"/>
      <circle cx="305" cy="310" r="28" fill="${p.bg}"/>
      <circle cx="215" cy="370" r="56" fill="${p.sand}"/>
      <circle cx="215" cy="370" r="22" fill="${p.bg}"/>`;
  } else if (slug.includes('paint') || slug.includes('gouache') || slug.includes('acrylic') || slug.includes('brush')) {
    shape = `
      <rect x="115" y="165" width="250" height="210" rx="16" fill="#ffffff" stroke="${p.sand}" stroke-width="2"/>
      <circle cx="165" cy="215" r="22" fill="#9f3c16"/>
      <circle cx="220" cy="215" r="22" fill="#d9a05b"/>
      <circle cx="275" cy="215" r="22" fill="#476553"/>
      <circle cx="325" cy="215" r="22" fill="#dec0b7"/>
      <circle cx="165" cy="275" r="22" fill="#bf542c"/>
      <circle cx="220" cy="275" r="22" fill="#c7e8d1"/>
      <circle cx="275" cy="275" r="22" fill="#5b6f82"/>
      <circle cx="325" cy="275" r="22" fill="#181d1a"/>
      <rect x="125" y="395" width="240" height="14" rx="7" fill="${p.accent}" transform="rotate(-8 245 402)"/>`;
  } else if (slug.includes('gift') || slug.includes('kit') || slug.includes('bundle') || slug.includes('box')) {
    shape = `
      <rect x="110" y="170" width="260" height="230" rx="16" fill="#ffffff" stroke="${p.accent}" stroke-width="2.5"/>
      <rect x="98" y="150" width="284" height="44" rx="10" fill="${p.accent}"/>
      <rect x="226" y="150" width="28" height="250" fill="${p.secondary}"/>
      <path d="M240 150 C205 110 175 135 210 150 Z" fill="${p.secondary}"/>
      <path d="M240 150 C275 110 305 135 270 150 Z" fill="${p.secondary}"/>`;
  } else if (slug.includes('book') || slug.includes('flashcard') || slug.includes('workbook')) {
    shape = `
      <rect x="135" y="130" width="215" height="295" rx="12" fill="${p.accent}"/>
      <rect x="135" y="130" width="22" height="295" rx="4" fill="#181d1a" opacity="0.22"/>
      <rect x="180" y="178" width="140" height="86" rx="8" fill="#faf6f0"/>
      <circle cx="250" cy="315" r="28" fill="${p.secondary}"/>
      <line x1="200" y1="210" x2="300" y2="210" stroke="${p.ink}" stroke-width="3" stroke-linecap="round"/>
      <line x1="215" y1="232" x2="285" y2="232" stroke="${p.sand}" stroke-width="3" stroke-linecap="round"/>`;
  } else if (slug.includes('bookmark') || slug.includes('sticker') || slug.includes('nameplate') || slug.includes('clip')) {
    shape = `
      <rect x="175" y="110" width="130" height="310" rx="16" fill="#ffffff" stroke="${p.sand}" stroke-width="2.5"/>
      <circle cx="240" cy="148" r="10" fill="${p.bg}" stroke="${p.accent}" stroke-width="2"/>
      <rect x="200" y="195" width="80" height="150" rx="8" fill="${p.secondary}" opacity="0.45"/>
      <path d="M240 240 C252 255 252 275 240 290 C228 275 228 255 240 240 Z" fill="${p.accent}"/>`;
  } else {
    // Notebooks, journals, planners, canvas, sketchbooks
    shape = `
      <rect x="135" y="120" width="220" height="310" rx="16" fill="${p.accent}"/>
      <rect x="150" y="120" width="8" height="310" fill="#181d1a" opacity="0.18"/>
      <rect x="330" y="120" width="8" height="310" fill="#181d1a" opacity="0.25"/>
      <rect x="182" y="195" width="136" height="62" rx="6" fill="none" stroke="${p.secondary}" stroke-width="1.8"/>
      <line x1="205" y1="220" x2="295" y2="220" stroke="#faf6f0" stroke-width="3" stroke-linecap="round"/>
      <line x1="220" y1="238" x2="280" y2="238" stroke="${p.secondary}" stroke-width="2" stroke-linecap="round"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 600" fill="none">
  <rect width="480" height="600" fill="${p.bg}"/>
  <circle cx="385" cy="105" r="90" fill="${p.secondary}" opacity="0.25"/>
  <circle cx="95" cy="495" r="105" fill="${p.sand}" opacity="0.25"/>
  ${shape}
  <text x="240" y="540" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="${p.ink}" opacity="0.65">${title.slice(0, 34).replace(/&/g, '&amp;')}</text>
</svg>`;
}

const generated = new Set<string>();
for (const prod of SEED_PRODUCTS) {
  const imgUrl = prod.images[0]?.url;
  if (!imgUrl) continue;
  const filename = path.basename(imgUrl);
  if (generated.has(filename)) continue;
  generated.add(filename);
  const svg = renderIllustration(prod.slug, prod.parentCategorySlug ?? 'everyday-stationery', prod.name);
  fs.writeFileSync(path.join(outProductsDir, filename), svg, 'utf8');
}

console.log(`Generated ${generated.size} product SVG illustrations + 2 editorial hero/feature SVGs.`);
