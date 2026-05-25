# Desarrollo Integral · Design System

## Color Palette

### Primary Brand
- **Gold Accent**: `#C8A96E` (OKLCH: 62% L, 0.15 C, 65 H)
- **Gold Pale**: `rgba(200, 169, 110, 0.08)` (backgrounds)
- **Gold Semi**: `rgba(200, 169, 110, 0.12)` (borders, hovers)
- **Gold Border**: `rgba(200, 169, 110, 0.28)` (focus rings, dividers)

### Secondary Brand (Griselda Page)
- **Sage**: `#4D7A52` (OKLCH: 50% L, 0.12 C, 142 H)

### Neutrals (Dark Theme)
- **Background Primary**: `#0A0A0A` (off-black, OKLCH: 4% L)
- **Background Secondary**: `#111111` (slightly lighter)
- **Background Tertiary**: `#0F0F0F` (alt sections)
- **Background Alt**: `#1A1A1A` (cards, hover states)
- **Border**: `rgba(255, 255, 255, 0.06)` (subtle dividers)
- **Border Light**: `rgba(255, 255, 255, 0.03)` (secondary dividers)

### Text (Light Theme on Dark)
- **Text Primary**: `rgba(255, 255, 255, 0.95)` (headings, body)
- **Text Secondary**: `rgba(255, 255, 255, 0.60)` (labels, captions)
- **Text Tertiary**: `rgba(255, 255, 255, 0.28)` (disabled, hints)

### Functional
- **Error**: `#EF4444` (red-500, WCAG AA contrast verified)
- **Success**: `#10B981` (emerald-500)
- **Warning**: `#F59E0B` (amber-500)

## Typography

### Font Family
**Primary**: PP Formula (Pangram Pangram)
- Light: 300
- Regular: 400
- Medium: 500
- SemiBold Extended: 600
- Bold Condensed: 700
- Black: 900

**Fallback**: system-ui, -apple-system, sans-serif
**Mono** (data, code): 'IBM Plex Mono', monospace

### Type Scale

| Use | Size | Weight | Line Height | Letter Spacing |
|-----|------|--------|-------------|----------------|
| **h1 (hero)** | clamp(88px, 12vw, 160px) | 600–700 | 1.1 | -0.02em |
| **h2 (section)** | clamp(48px, 8vw, 64px) | 600 | 1.2 | -0.015em |
| **h3 (subsection)** | 32px | 600 | 1.3 | 0 |
| **h4 (card title)** | 24px | 600 | 1.4 | 0 |
| **Body** | 16px | 400 | 1.6 | 0.3px |
| **Body small** | 14px | 400 | 1.6 | 0.2px |
| **Caption** | 12px | 500 | 1.5 | 0.5px |
| **Eyebrow** | 10px | 500 | 1.2 | 0.5em |

### Rules
- Max line length body: 65–75 characters
- h1 only once per page (hero)
- Weight hierarchy: h1/h2 use 600–700, body 400, labels 500–600
- No underline as emphasis (use weight or color)
- No gradient text or shadow text

## Spacing & Layout

### Spacing Scale
- **xs**: 4px
- **sm**: 8px
- **md**: 16px (1rem)
- **lg**: 24px (1.5rem)
- **xl**: 32px
- **2xl**: 48px
- **3xl**: 64px
- **4xl**: 80px

### Container
- **Max-width**: 1280px (desktop), no constraint mobile
- **Padding**: 24px (mobile), 48px (desktop)
- **Breakpoints**: 375px (mobile), 768px (tablet), 1024px (desktop), 1440px (wide)

### Rhythm
- Use asymmetric spacing for visual interest (not same padding everywhere)
- Section vertical rhythm: 48px–80px gaps
- Internal card padding: 24px–32px

## Components & Patterns

### Navigation
- **Fixed top**, height 72px, semi-transparent backdrop blur
- Logo left (60px width), nav links center, CTA button right
- z-index: 100
- Border bottom: 1px rgba(255,255,255,0.06)

### Hero Section
- **Min-height**: 100vh
- **Background**: Radial gradient + dark overlay + video parallax (optional)
- **Content**: Logo (120px) + eyebrow + h1 + description + CTA button
- **Shield**: 200px SVG, `transform: rotateY(0deg to 360deg)`, 6s loop
- **Scroll parallax**: Hero container moves slower than scroll (0.3x velocity)

### Cards
- **Padding**: 24px–32px
- **Border**: 1px rgba(200,169,110,0.28) on hover only (no default borders)
- **Background**: rgba(255,255,255,0.02) or transparent
- **Hover**: Slight lift (`transform: translateY(-4px)`), shadow, no scale

### Buttons
- **Padding**: 12px 24px (small), 16px 32px (large)
- **Min height**: 44px (touch target)
- **Primary CTA**: `background: #C8A96E; color: #0A0A0A`
- **Secondary**: `border: 1px #C8A96E; color: #C8A96E; background: transparent`
- **Hover**: Scale 1.02, shadow, ripple effect
- **Active**: Scale 0.97 (press feedback)
- **Focus**: 2px gold outline, 4px offset
- **Disabled**: Opacity 0.5, cursor not-allowed

### Form Inputs
- **Padding**: 12px 16px
- **Border**: 1px rgba(255,255,255,0.06), rounded 4px
- **Focus**: Box-shadow glow, `0 0 20px rgba(200,169,110,0.3)`
- **Error state**: Border + text #EF4444, message below
- **Label**: Always visible, not placeholder-only
- **Helper text**: 12px, #t3 color, below input

### Modals & Drawers
- **Backdrop**: `rgba(0,0,0,0.7)`, click to close
- **Panel**: Dark background, gold accent border (1px top)
- **Animation**: Slide up + fade, spring physics
- **Escape key**: Closes modal
- **Focus trap**: First focusable element on open, last on Shift+Tab

## Motion & Animation

### Timing
- **Instant feedback**: 100–160ms (button press, ripple)
- **UI transitions**: 150–250ms (hover effects, dropdowns, focus)
- **Modals/drawers**: 200–500ms (enter/exit)
- **No animation** > 300ms for UI elements
- **Marketing/hero**: 600ms–1.2s allowed (cinematic, one-time)

### Easing Curves
```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);        /* UI entrances */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);    /* On-screen movement */
--ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* Playful bounces */
--ease-linear: linear;                              /* Spinners only */
```

**Rules**:
- ✅ Exit faster than enter (60–70% of duration)
- ✅ Use ease-out for entrances (responsive feel)
- ❌ Never ease-in for UI (feels sluggish)
- ❌ No bounce in serious contexts

### Specific Animations

#### Hero Section (GSAP Timeline)
- Eyebrow: fade-in + translateY(-20px), 600ms, stagger 0ms
- H1: clip-path reveal + fadeIn, 1.2s per word, stagger 100ms
- Description: blur reveal (10px→0), 800ms, start -0.6s
- CTA: scale entrance (0.95→1) + fade, 600ms, start -0.4s
- Shield: rotateY infinite 6s linear, glow drop-shadow pulsing 4s infinite

#### Method Accordion (Framer Motion Spring)
- Expand: `type: "spring", damping: 25, stiffness: 100, mass: 1`
- Height: 0 → auto
- Opacity: 0.7 → 1
- Interior padding: animate on expand
- Interruptible mid-gesture

#### Stats Grid (GSAP Counters)
- Numbers: animate 0 → final value, 2s, ease-out-quart
- Parallax: `translateY(scrollY * -0.15)` slower than scroll
- Stagger: each stat +0.1s

#### Cards on Scroll (Blur Reveal)
- Start: `filter: blur(10px), opacity: 0`
- End: `filter: blur(0), opacity: 1`
- Trigger: IntersectionObserver (margin: -100px)
- Duration: 800ms ease-out

#### Button Ripple (on click)
- Multiple small circles `rgba(200, 169, 110, 0.5)`
- Scale: 0 → 4
- Opacity: 1 → 0
- Duration: 600ms each
- Stagger: +50ms per ripple

#### Focus Ring Animation
- Default: 2px solid gold, no shadow
- On focus: box-shadow adds glow, `0 0 20px rgba(200,169,110,0.3)`
- Duration: 200ms ease-out
- Respect `prefers-reduced-motion` (remove animation)

### Parallax
- Hero background: `translateY(scrollY * 0.3)` — slower = calmer effect
- Stats section: `translateY(scrollY * -0.15)` — moves opposite direction
- Never parallax > 0.5x velocity (prevents disorientation)
- Disable on mobile (prefer simple fade/reveal)

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## Accessibility

### Contrast (WCAG 2.1 AA)
- Body text: 4.5:1 minimum (verified: white on #0A0A0A = 16:1 ✅)
- Large text (18px+ bold): 3:1 minimum
- UI components (borders): 3:1 for meaningful elements
- No color-only meaning (pair with icon/text)

### Keyboard Navigation
- Tab order: top-left → bottom-right, logical flow
- Focus ring: Always visible, 2px gold, 4px offset
- Enter/Space: Activate buttons/links
- Escape: Close modals/dropdowns
- Arrow keys: Navigate carousel items

### Semantic HTML
- Page heading: `<h1>` (unique, once per page)
- Sections: `<nav>`, `<main>`, `<section role="region">`
- Headings: Sequential h2 → h3 → h4 (no skips)
- Lists: `<ul>` + `<li>` (never div-fake lists)
- Forms: `<label for="id">` paired with input `id="id"`
- Images: Alt text describes content (not "image of...", not empty)
- Icon buttons: `aria-label="action name"`

### Labels & Instructions
- All inputs have visible labels (not placeholder-only)
- Error messages: Appear below field, linked via `aria-describedby`
- Helper text: 12px, secondary color, below input
- Required fields: `aria-required="true"` + visual indicator (asterisk)

### Live Regions
- Form errors: `role="alert"` or `aria-live="polite"`
- Toasts/notifications: `aria-live="polite"`, auto-dismiss in 5s
- Loading states: Show spinner + text "Loading..."

## Assets

### Images
- **Format**: WebP primary, JPEG fallback (no PNG for photos)
- **Optimization**: max 80% quality, responsive srcset
- **Lazy loading**: `loading="lazy"` for below-fold images
- **Aspect ratio**: Declare via CSS to prevent layout shift
- **Video poster**: Static frame, same dimensions as video

### Fonts
- **Location**: `/public/fonts/pp-formula/`
- **Files**: Light, Regular, Medium, SemiBoldExtended, CondensedBlack, Extrabold
- **Loading**: `font-display: swap` (show system font immediately, replace when loaded)
- **Preload**: Only critical display font (PP Formula Medium)
- **Fallback**: system-ui for instant rendering

### Icons
- **Set**: Heroicons (if needed) or custom SVG inline
- **Style**: 24px base, stroke-based, consistent weight
- **Color**: Inherit text color or explicit gold
- **No emoji** as functional icons

### Logos
- **Variants**: White (hero), Black (footer/light backgrounds)
- **Files**: SVG inline for styling control
- **Scale**: 120px width typical, scale responsively
- **Animation**: Subtle fade-in on load, no rotation (unless CTA call-to-action)

## Responsive Breakpoints

| Breakpoint | Name | Container | Padding | Use |
|------------|------|-----------|---------|-----|
| 320–767px | **mobile** | 100% | 16px–24px | Phone, small tablet |
| 768–1023px | **tablet** | 90%–100% | 24px–32px | iPad, Android tablet |
| 1024–1439px | **desktop** | 90%–95% | 32px–48px | Laptop, small monitor |
| 1440px+ | **wide** | 1280px (max) | 48px | Large desktop |

**Mobile-first approach**: Start mobile styles at 320px, add breakpoints up.

**No horizontal scroll at any width.**

**Zoom to 200%**: Page must remain readable, no layout breaks.

## Performance Checklist

- ✅ Images WebP/AVIF with fallback JPEG
- ✅ Lazy load media (loading="lazy", dynamic import)
- ✅ Font preload (only critical weight/variant)
- ✅ CSS critical inline, rest async
- ✅ Avoid layout thrashing (batch DOM reads/writes)
- ✅ Reserve space for dynamic content (CLS < 0.1)
- ✅ No `position: fixed` beyond nav (poor performance)
- ✅ Use `transform` + `opacity` for animations (GPU-accelerated)
- ✅ Debounce/throttle scroll events
- ✅ Progressive loading (skeleton > long spinner for >1s waits)

---

**Last Updated**: May 24, 2026 | **Version**: 2.0 (Premium Refactor)
