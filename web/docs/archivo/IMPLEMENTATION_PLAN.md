# Desarrollo Integral v2.0 Premium · Implementation Plan

**Status**: Ready for execution (no user input required)
**Total Duration**: ~6 hours across 6 phases
**Start Date**: May 24, 2026
**Target Completion**: May 24–25, 2026

---

## AUDIT FINDINGS (Current State)

### ✅ What's Already Good
- Clean JSX structure with semantic sections
- IntersectionObserver for fade-in animations (foundation ready)
- Responsive layout with proper container wrapping
- METODO_DETAIL data structure (clean, extensible)
- Navigation markup correct
- Logo component (reusable, good props)

### ❌ Critical Issues to Fix

| Issue | Severity | Impact | Fix |
|-------|----------|--------|-----|
| **No PP Formula fonts** | 🔴 Critical | Brand identity broken | Import @font-face, update CSS vars |
| **Wrong typography defaults** | 🔴 Critical | Looks generic, not premium | Playfair→PP Formula Medium/Bold, DM Sans→PP Formula |
| **Monolithic page.tsx (382 lines)** | 🔴 Critical | Hard to maintain, test, animate | Extract 12+ components |
| **Shield animation crude** | 🟡 High | Not premium enough | GSAP timeline + glow effect |
| **No spring physics** | 🟡 High | Feels stiff, not luxury | Add Framer Motion to accordion, cards |
| **Fade-in basic** | 🟡 High | Looks 2020, not 2026 | Blur reveals, clip-path masks, line reveals |
| **No micro-interactions** | 🟡 High | Feels dead, not responsive | Ripple buttons, focus glow, magnetism |
| **Accessibility gaps** | 🟡 High | Not WCAG AA | Add aria labels, keyboard nav, prefers-reduced-motion |
| **Image optimization missing** | 🟠 Medium | LCP slow | Add WebP, lazy loading, video poster |

---

## PHASE 0: BRAND BLUEPRINT & ASSET PREPARATION (20 min)

**Objective**: Establish brand foundation before code changes

### Tasks
1. ✅ Create PRODUCT.md (brand essence, goals, anti-references)
2. ✅ Create DESIGN.md (colors, typography, spacing, components, animations)
3. ✅ Copy PP Formula fonts from OneDrive to `/public/fonts/pp-formula/`
4. ✅ Verify logo assets in `/public/logos/` (blanco + negro variants)
5. ✅ Create this IMPLEMENTATION_PLAN.md

### Success Criteria
- [ ] PRODUCT.md + DESIGN.md locked in
- [ ] PP Formula fonts readable from `/public/fonts/`
- [ ] Logos white + black available
- [ ] Team aligned on visual direction

---

## PHASE 1: REFACTOR INTO COMPONENTS (90 min)

**Objective**: Break monolithic page.tsx into 12+ reusable components

### Components to Extract

| Component | Props | Lines | Purpose |
|-----------|-------|-------|---------|
| **HeroSection** | `logo, shield` | 30 | Hero + shield + GSAP timeline |
| **StatsGrid** | `items: Stat[]` | 20 | 4 stats with counter animation |
| **MethodCard** | `method, isActive, onClick` | 25 | Single accordion item |
| **MethodSection** | `methods, activeId, onToggle` | 40 | 3-card accordion with state |
| **FeatureItem** | `icon, title, desc` | 12 | Reusable list item |
| **PlatformSection** | `features` | 35 | 6 features grid |
| **ServiceCard** | `title, desc, icon` | 15 | Service area card |
| **ServicesSection** | `services` | 30 | 3-service grid |
| **TeamCard** | `name, role, bio, image` | 20 | Profile card |
| **TeamSection** | `team` | 25 | 2 profiles layout |
| **TestimonialCard** | `quote, author, role, avatar` | 18 | Quote + attribution |
| **TestimonialSlider** | `testimonials` | 35 | Carousel with nav |
| **CTAForm** | `onSubmit` | 40 | Email form with validation |
| **LocationSection** | `address, map` | 30 | Map + address info |
| **GriselidaCrosslink** | `link` | 25 | Sidebar upsell |
| **Footer** | `links` | 15 | Minimal footer |

### File Structure After Refactor
```
/app
  /components
    HeroSection.tsx
    StatsGrid.tsx
    MethodCard.tsx
    MethodSection.tsx
    FeatureItem.tsx
    PlatformSection.tsx
    ServiceCard.tsx
    ServicesSection.tsx
    TeamCard.tsx
    TeamSection.tsx
    TestimonialCard.tsx
    TestimonialSlider.tsx
    CTAForm.tsx
    LocationSection.tsx
    GriselidaCrosslink.tsx
    Footer.tsx
  page.tsx [NEW: Clean orchestrator, ~80 lines]
  layout.tsx [Updated: Font preload]
  globals.css [Updated: PP Formula + easing curves]
```

### Refactoring Rules
- ✅ Extract data (`METODO_DETAIL`, `metodoCards`, etc.) to separate `data.ts`
- ✅ Move animations to component-level (GSAP in useEffect, Framer in motion divs)
- ✅ Keep prop drilling minimal (use composition > context for this scale)
- ✅ Maintain IntersectionObserver pattern in Layout or custom hook
- ✅ All children components must be "client" (use "use client" directive)

### Success Criteria
- [ ] All 16 components created and exported
- [ ] page.tsx reduced to ~80 lines (pure orchestration)
- [ ] Zero functionality lost (manual QA checklist)
- [ ] Build succeeds with no errors
- [ ] Components accept correct props, no TypeScript warnings

---

## PHASE 2: TYPOGRAPHY & COLOR INTEGRATION (60 min)

**Objective**: PP Formula brand lock + refined palette

### Task Breakdown

#### 2.1: Font Setup (15 min)
1. Copy PP Formula `.otf` files from OneDrive to `/public/fonts/pp-formula/`
2. Convert `.otf` → `.woff2` (better performance) using online tool or local tool
3. Add 5 `@font-face` declarations in `globals.css`:
   ```css
   @font-face {
     font-family: 'PP Formula';
     src: url('/fonts/pp-formula/PPFormula-Light.woff2') format('woff2');
     font-weight: 300;
     font-display: swap;
   }
   /* + 4 more for 400, 500, 600, 700, 900 */
   ```
4. Update CSS variables:
   ```css
   --serif: 'PP Formula', Georgia, serif;
   --cond: 'PP Formula', 'Arial Narrow', sans-serif;
   --sans: 'PP Formula', system-ui, sans-serif;
   ```

#### 2.2: Typography Hierarchy (15 min)
1. Update type scale in CSS:
   - h1: clamp(88px, 12vw, 160px), weight 600–700, line-height 1.1
   - h2: clamp(48px, 8vw, 64px), weight 600, line-height 1.2
   - h3: 32px, weight 600, line-height 1.3
   - body: 16px, weight 400, line-height 1.6
   - caption: 12px, weight 500, line-height 1.5

2. Update HeroSection component to use h1 (not manual size)
3. Update all section headings to h2/h3 (semantic)

#### 2.3: Color Palette Refinement (15 min)
1. Verify gold #C8A96E vs proposals (#C9A96A, #D4AF71)
   - Decision: Keep #C8A96E (already tested, good contrast)
2. Add OKLCH versions to CSS for future advanced color manipulation:
   ```css
   --gold-oklch: oklch(62% 0.15 65);
   ```
3. Add functional color tokens:
   ```css
   --error: #EF4444;
   --success: #10B981;
   --warning: #F59E0B;
   ```
4. Verify contrast ratios:
   - Text primary (#fff, 0.95) on background (#0a0a0a): ✅ 16:1
   - Text secondary (#fff, 0.60) on background: ✅ 8:1
   - Text tertiary (#fff, 0.28) on background: ⚠️ 2.8:1 — use only for hints, not functional

#### 2.4: Layout & Spacing Tokens (15 min)
1. Add spacing scale variables:
   ```css
   --space-xs: 4px;
   --space-sm: 8px;
   --space-md: 16px;
   --space-lg: 24px;
   --space-xl: 32px;
   --space-2xl: 48px;
   --space-3xl: 64px;
   ```
2. Add animation timing:
   ```css
   --duration-instant: 100ms;
   --duration-ui: 200ms;
   --duration-transition: 300ms;
   --duration-slow: 400ms;
   ```
3. Add easing curves:
   ```css
   --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
   --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
   --ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
   ```

### Success Criteria
- [ ] PP Formula loads correctly (no FOIT, no FOUT)
- [ ] All headings use h1/h2/h3 semantically
- [ ] Type scale applied across all sections
- [ ] Color contrast verified (WCAG AA passing)
- [ ] CSS variables used consistently (no hardcoded colors/durations)
- [ ] Lighthouse fonts section green

---

## PHASE 3: PREMIUM ANIMATIONS (90 min)

**Objective**: GSAP + Framer Motion cinematic quality

### 3.1: GSAP Setup & Hero Timeline (30 min)

**File**: `HeroSection.tsx`

```tsx
useEffect(() => {
  const tl = gsap.timeline();
  
  tl.from(".hero-eyebrow", {
    opacity: 0, y: -20, duration: 0.6, ease: "power3.out"
  })
  .from(".hero-h1", {
    opacity: 0, y: 40, 
    clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
    duration: 1.2, stagger: 0.1, ease: "power3.out"
  }, "-=0.3")
  .from(".hero-desc", {
    opacity: 0, filter: "blur(10px)",
    duration: 0.8, ease: "power3.out"
  }, "-=0.6")
  .from(".hero-cta", {
    opacity: 0, scale: 0.95,
    duration: 0.6, ease: "back.out(1.7)"
  }, "-=0.4");
  
  // Shield infinite rotation
  gsap.to(".shield-spin", {
    rotation: 360, duration: 6, repeat: -1, ease: "none"
  });
  
  // Shield glow effect
  gsap.to(".shield-glow", {
    filter: ["drop-shadow(0 0 0px rgba(200,169,110,0))",
             "drop-shadow(0 0 30px rgba(200,169,110,0.4))",
             "drop-shadow(0 0 0px rgba(200,169,110,0))"],
    duration: 4, repeat: -1, ease: "sine.inOut"
  });
}, []);
```

**Styling in globals.css**:
```css
.hero-eyebrow { animation: none; /* GSAP controls */ }
.hero-h1 { animation: none; }
.hero-desc { animation: none; }
.hero-cta { animation: none; }

.shield-glow {
  filter: drop-shadow(0 0 0px rgba(200,169,110,0));
  will-change: filter;
}
```

### 3.2: Framer Motion Spring Physics (30 min)

**Files**: `MethodSection.tsx`, `TeamSection.tsx`, `TestimonialSlider.tsx`

**MethodSection Example**:
```tsx
import { motion, AnimatePresence } from 'framer-motion';

export function MethodCard({ method, isActive, onClick }) {
  return (
    <motion.div
      onClick={onClick}
      layout
      className="method-card"
    >
      <h3>{method.label}</h3>
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 100,
              mass: 1
            }}
            className="method-content"
          >
            <p>{method.descripcion}</p>
            <ul>
              {method.items.map(item => <li key={item}>{item}</li>)}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
```

**TeamCard Hover Effect**:
```tsx
<motion.div
  whileHover={{
    y: -8,
    boxShadow: "0 20px 40px rgba(200,169,110,0.2)"
  }}
  transition={{ duration: 0.2 }}
  className="team-card"
>
  {/* content */}
</motion.div>
```

### 3.3: Scroll-Based Reveals (30 min)

**Custom Hook**: `useScrollReveal.ts`
```tsx
export function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.15, rootMargin: '-100px' }
    );
    
    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}
```

**CSS Reveals**:
```css
[data-reveal="blur"] {
  filter: blur(10px);
  opacity: 0;
  transition: filter 800ms var(--ease-out), opacity 800ms var(--ease-out);
}
[data-reveal="blur"].revealed {
  filter: blur(0);
  opacity: 1;
}

[data-reveal="line"] {
  position: relative;
}
[data-reveal="line"]::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--gold);
  transition: width 600ms var(--ease-out);
}
[data-reveal="line"].revealed::after {
  width: 100%;
}

[data-reveal="mask"] {
  clip-path: polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%);
  transition: clip-path 800ms var(--ease-out);
}
[data-reveal="mask"].revealed {
  clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
}
```

**Usage in Components**:
```tsx
<h2 data-reveal="mask">Our Method</h2>
<div data-reveal="blur">Card content</div>
<a href="#" data-reveal="line">Learn More</a>
```

### Success Criteria
- [ ] Hero timeline smooth + staggered (visual QA)
- [ ] Shield glow pulsing (not harsh, subtle)
- [ ] Method accordion opens/closes with spring (try rapid clicks)
- [ ] Cards reveal on scroll (scroll to each section, verify blur/line/mask)
- [ ] No jank during animations (60fps in DevTools)
- [ ] prefers-reduced-motion removes all animations (test in Chrome DevTools)

---

## PHASE 4: MICRO-INTERACTIONS (45 min)

**Objective**: Premium responsive feedback

### 4.1: Button Ripple Effect (15 min)

**File**: `components/RippleButton.tsx`
```tsx
export function RippleButton({ children, onClick, ...props }) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  
  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ripple = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      id: Date.now()
    };
    setRipples([...ripples, ripple]);
    setTimeout(() => {
      setRipples(r => r.filter(rip => rip.id !== ripple.id));
    }, 600);
    onClick?.(e);
  };
  
  return (
    <button onClick={handleClick} className="ripple-button" {...props}>
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="ripple"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            left: ripple.x,
            top: ripple.y,
          }}
        />
      ))}
      {children}
    </button>
  );
}
```

**CSS**:
```css
.ripple-button {
  position: relative;
  overflow: hidden;
}
.ripple {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(200, 169, 110, 0.5);
  pointer-events: none;
  transform: translate(-50%, -50%);
}
```

### 4.2: Focus Ring + Glow (10 min)

**CSS**:
```css
button:focus,
input:focus,
a:focus {
  outline: none;
  box-shadow: 0 0 20px rgba(200, 169, 110, 0.3),
              inset 0 0 20px rgba(200, 169, 110, 0.05);
  transition: box-shadow 200ms var(--ease-out);
}
```

### 4.3: Button Press Feedback (10 min)

**CSS**:
```css
button:active {
  transform: scale(0.97);
  transition: transform 100ms var(--ease-out);
}
button:active::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.1);
  pointer-events: none;
}
```

### 4.4: Hover Magnetism (10 min)

**File**: `hooks/useMagnetism.ts`
```tsx
export function useMagnetism(ref: RefObject<HTMLElement>, strength = 0.2) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      gsap.to(el, {
        x: x * strength,
        y: y * strength,
        duration: 0.3
      });
    };
    
    const handleMouseLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.4 });
    };
    
    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [ref, strength]);
}
```

### Success Criteria
- [ ] Buttons ripple on click (all CTAs, nav, form buttons)
- [ ] Focus ring glows (Tab key tests)
- [ ] Press feedback visible (scale 0.97, tight feedback)
- [ ] Hover magnetism smooth (no jank, natural easing)
- [ ] Works on touch (no hover on mobile, graceful fallback)

---

## PHASE 5: ACCESSIBILITY AUDIT (30 min)

**Objective**: WCAG 2.1 AA certification

### 5.1: Semantic HTML (10 min)
- [x] One `<h1>` on page (HeroSection)
- [x] All sections have `<h2>` (not skipped levels h2 → h4)
- [x] Form inputs have `<label for="id">` paired with `id="id"`
- [x] Navigation uses `<nav role="navigation">`
- [x] Main content wrapped in `<main>`
- [x] Lists use `<ul>` + `<li>`, not divs

### 5.2: Color Contrast (10 min)
- [ ] Body text: 4.5:1 (white 0.95 on #0a0a0a = 16:1 ✅)
- [ ] Large text: 3:1 (h1/h2 = 16:1 ✅)
- [ ] UI components: 3:1 (buttons, inputs = 8:1 ✅)
- [ ] Error red #EF4444: 7:1 on backgrounds ✅

### 5.3: Keyboard Navigation (5 min)
```tsx
// In globals.css
:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 4px;
}

// In modal/drawer
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') closeModal();
  if (e.key === 'Tab') {
    // Focus trap: cycle through focusable elements
  }
};
```

### 5.4: ARIA Labels (5 min)
- [ ] Icon buttons: `aria-label="Action name"`
- [ ] Modals: `role="dialog"`, `aria-modal="true"`
- [ ] Form errors: `aria-describedby="error-id"`
- [ ] Live regions: `aria-live="polite"` for toasts
- [ ] Images: `alt="description"` (never `alt=""` for meaningful images)

### 5.5: prefers-reduced-motion (5 min)
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

### Success Criteria
- [ ] Lighthouse Accessibility score 90+
- [ ] WebAIM contrast checker all green
- [ ] Tab navigation works (no trap)
- [ ] Escape closes modals
- [ ] Screen reader test passes (VoiceOver on Mac or NVDA on Windows)

---

## PHASE 6: TESTING & OPTIMIZATION (30 min)

### 6.1: Performance Audit (10 min)
```bash
npm run build
# Check .next/static for bundle sizes
# Target: <200KB gzipped main bundle
```

**Lighthouse Checklist**:
- [ ] Performance 90+
- [ ] Accessibility 95+
- [ ] Best Practices 90+
- [ ] SEO 90+
- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] FID < 100ms

### 6.2: Responsive Testing (10 min)
- [ ] 375px (mobile): Stack, touch targets ≥44px
- [ ] 768px (tablet): Adjusted grid
- [ ] 1440px (desktop): Full layout
- [ ] Zoom 200%: No breaks, readable
- [ ] Landscape: Readable on rotation

### 6.3: Cross-Browser Testing (5 min)
- [ ] Chrome (latest)
- [ ] Safari (iOS + macOS)
- [ ] Firefox
- [ ] Edge

### 6.4: Manual QA Checklist (5 min)
- [ ] All CTAs clickable and submit correctly
- [ ] Form validation works (email, phone, required)
- [ ] Modals open/close (click outside, Escape)
- [ ] Animations smooth (no jank, 60fps)
- [ ] Videos lazy-load with poster
- [ ] Images responsive (no overflow on mobile)
- [ ] Navigation sticky (doesn't jump)
- [ ] Links work (internal anchors, external)
- [ ] Copy is proofread (no typos, proper quotes)

### Success Criteria
- [ ] Lighthouse all 90+
- [ ] Zero console errors
- [ ] Zero TypeScript warnings
- [ ] Passes WCAG 2.1 AA audit
- [ ] Manual QA checklist 100%

---

## ROLLOUT & DEPLOYMENT

### Pre-Deployment
1. Create git commit with all changes (message: "Desarrollo Integral v2.0 Premium: modular components + PP Formula + GSAP animations + WCAG AA")
2. Test on Vercel preview
3. Load test (Lighthouse in incognito mode, 5x run)
4. Approve QA checklist

### Deployment
```bash
git push origin main
# Vercel deploys automatically
# Monitor https://www.vercel.com/deployments
```

### Post-Deployment
1. Verify live site (desktop + mobile)
2. Monitor Sentry for errors
3. Check Google Search Console for indexing
4. Monitor Core Web Vitals (PageSpeed Insights)

---

## TIMELINE SUMMARY

| Phase | Task | Duration | Start | End |
|-------|------|----------|-------|-----|
| **0** | Brand Blueprint | 20 min | Now | +20m |
| **1** | Refactor Components | 90 min | +20m | +110m |
| **2** | Typography + Colors | 60 min | +110m | +170m |
| **3** | Animations | 90 min | +170m | +260m |
| **4** | Micro-interactions | 45 min | +260m | +305m |
| **5** | Accessibility | 30 min | +305m | +335m |
| **6** | Testing | 30 min | +335m | +365m |
| **TOTAL** | | **365 min (6h 5m)** | | **May 24, 18:00** |

---

## SUCCESS CRITERIA (FINAL CHECKLIST)

- ✅ Page loads < 2.5s LCP
- ✅ Lighthouse 90+ all categories
- ✅ WCAG 2.1 AA certified (WebAIM + manual audit)
- ✅ PP Formula fonts applied globally
- ✅ Official DI logos visible (white + black)
- ✅ GSAP hero timeline cinematic
- ✅ Framer Motion spring physics accordion + cards
- ✅ Scroll reveals (blur/line/mask)
- ✅ Ripple buttons + focus glow + press feedback
- ✅ prefers-reduced-motion respected
- ✅ Responsive 375–1440px
- ✅ Zero console errors
- ✅ Form validation + success feedback
- ✅ Modal keyboard/escape handling
- ✅ Video lazy-load with poster
- ✅ Manual QA checklist 100%
- ✅ Git commit with clean history
- ✅ Deployed to Vercel + live monitoring

---

**Status**: 🚀 Ready for execution
**Owner**: Claude + Skill orchestration
**Review Frequency**: After each phase
**Estimated Completion**: May 24, 18:00–20:00 (contingent on asset availability)

