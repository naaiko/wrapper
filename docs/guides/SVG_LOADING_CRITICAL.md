# SVG LOADING - CRITICAL IMPLEMENTATION GUIDE

## 🚨 WAAROM DIT DOCUMENT BESTAAT

We hebben **3 keer** dezelfde SVG rendering bug gehad. Dit document voorkomt dat we dit nogmaals moeten fixen.

## ❌ WAT NIET WERKT

### 1. innerHTML op SVG elementen
```javascript
// ❌ WERKT NIET - Breekt SVG namespace
const g = document.createElement('g');
g.innerHTML = '<path d="M186.3..."/>';
svgContainer.appendChild(g);
// Resultaat: BoundingClientRect { width: 0, height: 0 } - Onzichtbaar!
```

### 2. document.createElement voor SVG
```javascript
// ❌ WERKT NIET - Verkeerde namespace
const g = document.createElement('g');  // HTML namespace, niet SVG!
```

### 3. CSS inheritance voor fill/stroke
```css
/* ❌ WERKT NIET - SVG erft fill/stroke NIET van parent naar children */
.layer-bodyshots {
    stroke: red;  /* Wordt NIET geërfd door <rect> children! */
}
```

## ✅ WAT WEL WERKT

### 1. createElementNS met cloneNode
```javascript
// ✅ CORRECT - Behoudt SVG namespace
const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
const clonedChild = sourceElement.cloneNode(true);
g.appendChild(clonedChild);
```

### 2. Target child elementen direct in CSS
```css
/* ✅ CORRECT - Target child elementen */
.layer-bodyshots rect {
    stroke: red;  /* Werkt op <rect> elements */
}
```

## 📋 IMPLEMENTATIE CHECKLIST

Voor het laden van SVG assets:

1. **Parse met DOMParser**
   ```javascript
   const parser = new DOMParser();
   const doc = parser.parseFromString(svgText, 'image/svg+xml');
   const sourceSVG = doc.querySelector('svg');
   ```

2. **Maak elementen met createElementNS**
   ```javascript
   const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
   ```

3. **Clone bestaande SVG elementen**
   ```javascript
   const clonedChild = child.cloneNode(true);  // Deep clone
   ```

4. **Verwijder inline styles**
   ```javascript
   clonedChild.removeAttribute('fill');
   clonedChild.removeAttribute('stroke');
   clonedChild.removeAttribute('class');
   ```

5. **Append met namespace intacte elementen**
   ```javascript
   g.appendChild(clonedChild);
   svgContainer.appendChild(g);
   ```

## 🎯 HUIDIGE IMPLEMENTATIE

Zie `frontend/js/Cast.js` → `loadSilhouetteSVG()` voor de werkende implementatie.

### Proces:
1. Fetch `images/silhouette.svg`
2. Parse met DOMParser
3. Voor elke layer group (Silhouet, Bodyshots, Accesories, Outfit):
   - Maak `<g>` met createElementNS
   - Clone children met cloneNode(true)
   - Verwijder inline style attributen
   - Append naar container

### CSS:
- Layers verborgen met `visibility: hidden`
- Mode classes tonen lagen: `.Cast Member-silhouette.mode-bodyshots .layer-bodyshots { visibility: visible; }`
- Child elementen direct stylen: `.layer-bodyshots rect { stroke: red; }`

## 🔧 DEBUG TIPS

Als SVG niet zichtbaar is:

1. **Check BoundingClientRect**
   ```javascript
   const path = document.querySelector('.layer-silhouet path');
   console.log(path.getBoundingClientRect());
   // width: 0, height: 0 = NAMESPACE PROBLEEM
   ```

2. **Check computed styles**
   ```javascript
   const style = getComputedStyle(path);
   console.log('Fill:', style.fill);
   console.log('Visibility:', style.visibility);
   ```

3. **Check namespace**
   ```javascript
   console.log(path.namespaceURI);
   // Moet zijn: "http://www.w3.org/2000/svg"
   ```

## 📚 REFERENTIES

- SVG namespace: `http://www.w3.org/2000/svg`
- MDN createElementNS: https://developer.mozilla.org/en-US/docs/Web/API/Document/createElementNS
- SVG inheritance: https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Fills_and_Strokes

## ⚠️ ONTHOUD

**NOOIT innerHTML gebruiken voor SVG elementen. ALTIJD createElementNS + cloneNode.**

Deze regel heeft ons 3 keer gefrustreerd. Laat het geen 4e keer worden.
