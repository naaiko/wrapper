# Spacing System Design

## Tailwind Spacing Scale
We gebruiken uitsluitend Tailwind's standaard spacing scale voor consistentie:

| Class | Rem | Pixels | Gebruik |
|-------|-----|--------|---------|
| `space-1` / `gap-1` | 0.25rem | 4px | Micro spacing |
| `space-2` / `gap-2` | 0.5rem | 8px | Tight spacing |
| `space-3` / `gap-3` | 0.75rem | 12px | Compact spacing |
| `space-4` / `gap-4` | 1rem | 16px | **Standard gap** (meest gebruikt) |
| `space-6` / `gap-6` | 1.5rem | 24px | Medium spacing |
| `space-8` / `gap-8` | 2rem | 32px | Large spacing |
| `space-12` / `gap-12` | 3rem | 48px | Section spacing |
| `space-16` / `gap-16` | 4rem | 64px | Major section spacing |

## Component Heights (Standard)
| Element | Height Class | Rem | Pixels |
|---------|--------------|-----|--------|
| Button (sm) | `h-8` | 2rem | 32px |
| Button (default) | `h-10` | 2.5rem | 40px |
| Dock (with padding) | `h-12` + `py-2` | ~3rem | ~48px |
| Toggle tabs | `h-12` | 3rem | 48px |
| Navigation | `h-16` | 4rem | 64px |

## Cast Page Layout

### Vertical Spacing Breakdown
```
┌─────────────────────────────────────┐
│  Navigation (fixed)                 │ top-4 = 1rem
│  + clearance                        │ top-16 total = 4rem
├─────────────────────────────────────┤
│                                     │
│  Main Content Area                  │ 
│  (fixed inset-0 top-16 bottom-40)   │
│                                     │
├─────────────────────────────────────┤
│  Breathing room                     │ space-8 = 2rem
├─────────────────────────────────────┤
│  Mode Toggle                        │ h-12 = 3rem
│  (fixed bottom-20)                  │
├─────────────────────────────────────┤
│  Gap (toggle ↔ dock)                │ space-4 = 1rem ⭐
├─────────────────────────────────────┤
│  Dock                               │ h-12 = 3rem
│  (fixed bottom-4)                   │
├─────────────────────────────────────┤
│  Bottom margin                      │ space-4 = 1rem
└─────────────────────────────────────┘
```

### Fixed Element Positions
- **Navigation**: `top-4` (1rem from top)
- **Mode Toggle**: `bottom-20` (5rem from bottom)
  - Formula: `bottom-4` + `h-12` (dock) + `space-4` (gap) = 1rem + 3rem + 1rem = 5rem
- **Dock**: `bottom-4` (1rem from bottom)

### Main Content Area
- Top offset: `top-16` (4rem)
- Bottom offset: `bottom-40` (10rem)
  - Breakdown:
    - `space-4` = 1rem (dock bottom margin)
    - `h-12` = 3rem (dock height)
    - `space-4` = 1rem (gap toggle ↔ dock) ⭐
    - `h-12` = 3rem (toggle height)
    - `space-8` = 2rem (breathing room)
    - **Total** = 10rem

## Grid Spacing
- Column gap: `gap-6` (1.5rem / 24px)
- Horizontal padding: `px-4` (1rem / 16px)

## Principles
1. **Use only Tailwind spacing scale** - Geen custom values zoals `pb-36` zonder reden
2. **Document calculations** - Altijd uitleggen hoe de spacing is opgebouwd
3. **Consistent gaps** - `space-4` (1rem) is de standaard gap tussen componenten
4. **Breathing room** - `space-8` (2rem) voor major sections
5. **Relative positioning** - Altijd vanaf bottom/top edge, nooit absolute pixels

## Common Patterns
```html
<!-- Standard gap tussen componenten -->
<div class="flex flex-col gap-4">
  <Component1 />
  <Component2 />
</div>

<!-- Card met consistente padding -->
<div class="rounded-lg p-6 gap-4">
  <Header />
  <Content />
</div>

<!-- Fixed elements met gedocumenteerde spacing -->
<!-- bottom-X waarde = sum van alle elementen eronder + gaps -->
<div class="fixed bottom-20">Toggle</div>
<div class="fixed bottom-4">Dock</div>
```

## Notes
- De `space-4` (1rem) gap tussen toggle en dock is bewust gekozen als standaard component gap
- Alle spacing is gebaseerd op Tailwind's 0.25rem incrementen
- Bij viewport changes schaalt alles proportioneel mee
