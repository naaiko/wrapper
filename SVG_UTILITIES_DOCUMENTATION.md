# SVG Utilities & Pattern System

## Overzicht

Een schaalbaar systeem voor het werken met vectoriële graphics, patronen en complete styling controle zonder complexe DOM structuren.

## Componenten

### 1. SVG Pattern Library (`svgPatterns.js`)

Centraal beheer van herbruikbare SVG patronen.

#### Features
- Automatische injectie van patronen in de DOM
- Voorgedefinieerde patronen (hatched, crosshatch, dots)
- Eenvoudig custom patronen toevoegen
- Geen duplicate pattern definitions

#### Gebruik

```javascript
import { SVGPatternLibrary } from './utils/svgPatterns.js';

// Initialiseer (1x per app)
SVGPatternLibrary.init();

// Gebruik pattern
element.setAttribute('fill', SVGPatternLibrary.getPatternURL('hatched'));

// Voeg custom pattern toe
SVGPatternLibrary.registerPattern('myPattern', {
    type: 'diagonal-lines',
    spacing: 15,
    strokeWidth: 2,
    angle: 45,
    backgroundColor: '#ffffff',
    strokeColor: 'rgba(0, 0, 0, 0.1)'
});
```

#### Beschikbare Patronen

**hatched** - Diagonale lijnen (45°)
- Spacing: 12px
- Achtergrond: base-100
- Lijnkleur: rgba(0, 0, 0, 0.08)

**hatched-reverse** - Diagonale lijnen (-45°)
- Spacing: 12px
- Achtergrond: base-100
- Lijnkleur: rgba(0, 0, 0, 0.08)

**crosshatch** - Kruis patroon
- Spacing: 12px
- Achtergrond: base-100
- Lijnkleur: rgba(0, 0, 0, 0.05)

**dots** - Stippen patroon
- Spacing: 10px
- Dot size: 1.5px
- Achtergrond: base-100
- Dot kleur: rgba(0, 0, 0, 0.1)

### 2. SVG Utilities (`svgUtils.js`)

Helper functies voor SVG manipulatie en styling.

#### Functies

**applyStyle(svg, style)** - Pas styling toe
```javascript
import { SVGUtils } from './utils/svgUtils.js';

SVGUtils.applyStyle(svg, {
    fill: '#ff0000',
    stroke: '#000000',
    strokeWidth: 2,
    strokeDasharray: '5,5',
    opacity: 0.5,
    applyToPaths: true  // Pas toe op alle child paths
});
```

**getColorFromClass(className)** - Haal kleur op uit Tailwind/DaisyUI class
```javascript
const bgColor = SVGUtils.getColorFromClass('bg-primary');
const textColor = SVGUtils.getColorFromClass('text-base-content');
```

**getHSLColor(variable)** - Haal HSL kleur op uit CSS variable
```javascript
const primaryColor = SVGUtils.getHSLColor('--p');
```

**loadSVG(url)** - Laad externe SVG
```javascript
const svg = await SVGUtils.loadSVG('./images/icon.svg');
container.appendChild(svg);
```

**createElement(tag, attributes)** - Maak SVG element
```javascript
const circle = SVGUtils.createElement('circle', {
    cx: 50,
    cy: 50,
    r: 40,
    fill: 'red'
});
```

**addBackground(svg, fill)** - Voeg achtergrond toe
```javascript
SVGUtils.addBackground(
    svg, 
    SVGPatternLibrary.getPatternURL('hatched')
);
```

## Voorbeelden

### Vector Shape met Hatched Pattern

```javascript
import { SVGUtils } from './utils/svgUtils.js';
import { SVGPatternLibrary } from './utils/svgPatterns.js';

// Initialiseer patterns
SVGPatternLibrary.init();

// Laad SVG
const svg = await SVGUtils.loadSVG('./images/shape.svg');

// Voeg hatched background toe
SVGUtils.addBackground(
    svg, 
    SVGPatternLibrary.getPatternURL('hatched')
);

// Style de shape
SVGUtils.applyStyle(svg, {
    fill: SVGUtils.getColorFromClass('bg-primary'),
    stroke: SVGUtils.getColorFromClass('border-primary'),
    strokeWidth: 2,
    opacity: 0.8,
    applyToPaths: true
});

// Voeg toe aan DOM
container.appendChild(svg);
```

### Custom Pattern Toevoegen

```javascript
// Multicolor striped pattern
SVGPatternLibrary.registerPattern('rainbow-stripes', {
    type: 'diagonal-lines',
    spacing: 20,
    strokeWidth: 3,
    angle: 45,
    backgroundColor: 'white',
    strokeColor: 'linear-gradient(...)' // Kan later uitgebreid worden
});

// Gebruik
element.setAttribute('fill', SVGPatternLibrary.getPatternURL('rainbow-stripes'));
```

### Dynamische Styling

```javascript
// Verander fill op hover
svg.addEventListener('mouseenter', () => {
    SVGUtils.applyStyle(svg, {
        fill: SVGUtils.getColorFromClass('bg-primary'),
        opacity: 1,
        applyToPaths: true
    });
});

svg.addEventListener('mouseleave', () => {
    SVGUtils.applyStyle(svg, {
        fill: SVGPatternLibrary.getPatternURL('hatched'),
        opacity: 0.5,
        applyToPaths: true
    });
});
```

## Voordelen

1. **Geen complexe containers** - Direct styling van SVG elementen
2. **Herbruikbare patronen** - Eén keer definieren, overal gebruiken
3. **DaisyUI integratie** - Automatisch kleuren uit theme halen
4. **Schaalbaar** - Makkelijk nieuwe patronen toevoegen
5. **Type-safe** - Duidelijke API met configuratie objecten
6. **Performance** - Patronen worden 1x in DOM geïnjecteerd

## Toekomstige Uitbreidingen

- Gradient patterns
- Image-based patterns
- Animated patterns
- Pattern transformaties (scale, rotate)
- Multi-layer patronen
- Export naar SVG/PNG
