---
name: Cognitive Cockpit
colors:
  surface: '#0f131c'
  surface-dim: '#0f131c'
  surface-bright: '#353942'
  surface-container-lowest: '#0a0e16'
  surface-container-low: '#181c24'
  surface-container: '#1c2028'
  surface-container-high: '#262a33'
  surface-container-highest: '#31353e'
  on-surface: '#dfe2ee'
  on-surface-variant: '#bdc8d1'
  inverse-surface: '#dfe2ee'
  inverse-on-surface: '#2c3039'
  outline: '#87929a'
  outline-variant: '#3e484f'
  surface-tint: '#7bd0ff'
  primary: '#8ed5ff'
  on-primary: '#00354a'
  primary-container: '#38bdf8'
  on-primary-container: '#004965'
  inverse-primary: '#00668a'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#56e5a9'
  on-tertiary: '#003824'
  tertiary-container: '#30c88f'
  on-tertiary-container: '#004e34'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c4e7ff'
  primary-fixed-dim: '#7bd0ff'
  on-primary-fixed: '#001e2c'
  on-primary-fixed-variant: '#004c69'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#0f131c'
  on-background: '#dfe2ee'
  surface-variant: '#31353e'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-telemetry:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.04em
  label-micro:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.75rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style
This design system defines an advanced, minimalist executive HUD and cognitive cockpit for high-functioning decision intelligence. It avoids the visual noise and gimmicks of legacy sci-fi interfaces, favoring instead deliberate restraint, deep negative space, optical precision, and ambient spatial depth. 

The aesthetic is anchored in a futuristic "Clean Tech HUD":
- **Deep Immersion:** Ultra-low base luminance evokes an expansive digital void where key data emerges with luminous clarity.
- **Micro-Precision & Telemetry:** Clean geometry, fine hairline borders, structural micro-grids, and monospaced diagnostic markers project operational readiness.
- **Glassmorphism & Depth:** Soft glass surfaces (`backdrop-blur-md`), tinted ambient glows, and dark radial gradients build an intuitive cognitive stack.
- **Mobile/PWA Ergonomics:** Built touch-first with distinct thumb zones, generous target padding, and tactile haptic-inspired feedback states.

## Colors
The palette balances an ultra-dark canvas with electric cyan guidance cues, structural slate dividers, and telemetry signals.

### Color Tokens & Assignments
- **Canvas / Background:** Deep Space Black (`#080C14`). Used strictly for root frames and full-canvas backdrops.
- **Primary Surfaces & Containers:** Graphite Core (`#0D131F`) to Dark Lead (`#111827`).
- **Interactive Accents:**
  - **Electric Cyan (Primary):** `#38BDF8` (Luminous Cyan) and `#06B6D4` (Active Glow). Used for active states, directional wayfinding, progress meters, and dominant interactive elements.
  - **Telemetry Operational (Tertiary):** `#10B981` (Emerald Core) for synced telemetry, healthy cognitive nodes, and verified computations.
  - **Telemetry Alert:** `#F59E0B` (Amber Vector) for warnings, resource bottlenecks, and system state disruptions.
- **Structural Lines & Dividers:** Subtle Deep Slate (`#1E293B`) combined with calibrated cyan hairbars (`rgba(56, 189, 248, 0.15)`).

Contrast ratios strictly prioritize illegibility prevention on mobile OLED screens, reserving saturated neon emission strictly for focal points, indicators, and active touch states.

## Typography
The typographic architecture relies on three distinct functional layers:
1. **Space Grotesk (Headlines & Architecture):** Delivers geometric authority and a restrained futuristic voice for titles, section anchors, and modal viewports.
2. **Geist (Body & Synthesis):** Provides neutral, hyper-legible text rendering for AI responses, summaries, and complex system readouts.
3. **JetBrains Mono (Telemetry & Metrics):** Reserved for technical instrumentation, timestamps, sensor feeds, coordinates, and diagnostic flags. 

All monospaced labels use explicit uppercase and slight tracking adjustments (`0.04em` to `0.08em`) to enforce rapid scanning on handheld screens.

## Layout & Spacing
The layout model employs a fluid, adaptive grid calibrated for PWA mobile screens and expanding into a cockpit multi-panel view on desktop displays:
- **Mobile (< 768px):** Single-column stacked stream with 16px (`1rem`) outer canvas margins and 12px to 16px component gutters. All primary action clusters are pinned or grouped in the bottom 40% thumb zone.
- **Tablet (768px – 1024px):** 6-column fluid grid, 20px margins, introducing persistent telemetry side-docks and dual-split cockpit dashboards.
- **Desktop (> 1024px):** 12-column grid anchored at a max width of 1440px, utilizing multi-pane spatial columns (System Health, Primary Neural Stream, Auxiliary Inspector).

Vertical cadence follows a rigorous 4px/8px modular rhythm, ensuring metrics and sensor readouts line up seamlessly across adjacent panels.

## Elevation & Depth
Depth is created through luminous optical stacking rather than drop shadows:
- **Level 0 (Canvas Base):** Solid `#080C14`.
- **Level 1 (Docked Containers & Stream Cards):** Dark Lead (`#0D131F`) with a subtle radial gradient centered at top-center (`radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.05) 0%, transparent 70%)`), framed with a 1px border of `#1E293B`.
- **Level 2 (Active Modules & Modals):** Backdrop-filter `blur(16px)` with surface `#111827` at 85% opacity, bordered by `rgba(56, 189, 248, 0.25)`.
- **Level 3 (Overlays & HUD Tooltips):** Surface `#080C14` at 92% opacity, illuminated by a faint external halo: `0 0 24px -4px rgba(6, 182, 212, 0.2)`.

## Shapes
Geometry balances ergonomic fluid curvatures with clean, faceted cockpit detailing:
- Standard containers, interactive cards, and module panels use balanced rounded corners (`0.5rem` to `1rem`).
- Primary hero status pods and bottom action sheets leverage `rounded-xl` (`1.5rem`) to ensure comfortable touch-navigation.
- Visual micro-indicators, telemetry badges, and hardware tags integrate subtle chamfered corners or pill shapes (`9999px`) for contrast.

## Components

### Buttons & Interactive Triggers
- **Primary Cyber Action:** Background in solid Electric Cyan (`#06B6D4` / `#38BDF8`), high-contrast dark text (`#080C14`), medium weight Space Grotesk. Features a soft, contained glow (`box-shadow: 0 0 16px rgba(56, 189, 248, 0.35)`).
- **Secondary Ghost Action:** Semi-transparent surface (`rgba(17, 24, 39, 0.6)`) with a 1px hairline border (`#1E293B`), transitioning to `border-cyan-500/40` on touch or hover.
- **Telemetry Action (Pill/Badge):** Compact height (32px), JetBrains Mono, border `rgba(56, 189, 248, 0.2)`, accompanied by a pulsing status dot.

### Telemetry Cards & Cockpit Pods
- Multi-layer visual containers featuring radial gradient fills, hairline borders, and top-right HUD coordinates or timestamps (`[SYS_OK // 99.8%]`).
- Integrated micro-dividers with subtle opacity tapers (`linear-gradient(90deg, rgba(56,189,248,0.2), transparent)`).

### Input Fields & Neural Prompts
- Elevated dark channel (`#0D131F`), 1px structural border (`#1E293B`), inset typography.
- On focus: Active neon highlight on the bottom border (`#38BDF8`), accompanied by an ambient internal cyan gradient flare.

### Checkboxes, Switches & Radio Nodes
- Unchecked: Inset slate frame (`#1E293B`) against core background.
- Checked/Active: Solid `#38BDF8` indicator with a 2px inner core and an outer micro-glow (`box-shadow: 0 0 8px rgba(56, 189, 248, 0.5)`).

### Micro-Indicators & Telemetry Chips
- Pill format with live status pings:
  - **Online/Optimal:** `#10B981` dot with an animated breathing ping.
  - **Processing/Cognitive Load:** `#38BDF8` dot with rotation indicator.
  - **Intervention Needed:** `#F59E0B` dot with static crisp border.