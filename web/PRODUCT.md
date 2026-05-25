# Desarrollo Integral · Product Context

## Register
**brand** — Landing page is the product. Design drives customer perception and conversion.

## What It Is

**Desarrollo Integral** is a premium movement and physical therapy practice founded by Ariel Rebisberger. The landing page communicates expertise, trust, and motion-focused methodology to potential clients seeking professional training, rehabilitation, and sports performance optimization.

**Dual-founder model**: Main brand (Ariel, movement/training) with sidebar product (Griselda, osteopathy). Cross-promotion between pages.

## Users & Context

**Primary**: Athletes, fitness enthusiasts, injury recovery patients
**Secondary**: Referral partners (therapists, coaches), corporate wellness seekers
**Context**: Desktop (70%), mobile (30%). Decision-making context: afternoon research, evening consideration
**Scene**: "Potential client browsing on desktop at 3pm, reading testimonials and deciding if this is the right trainer. Mobile: quick browse while commuting to consider booking."

## Brand Essence

- **Tone**: Authoritative, warm, movement-forward. Not marketing-speak; clinical precision + human trust.
- **Aesthetic**: Premium + understated. Luxury hotel (Aman, Equinox level) not startup SaaS.
- **Color**: Gold accent (#C8A96E) on dark backgrounds. Sage secondary (Griselda, #4d7a52).
- **Typography**: PP Formula family — geometric, professional, brand-forward.
- **Motion**: Cinematic, purposeful. Every animation expresses physical competence.

## Strategic Goals

1. **Credibility first** — Showcase methodology, team credentials, client results
2. **Conversion** — Newsletter signup + contact form with zero friction
3. **Segment awareness** — Make clear which service (Ariel vs Griselda) fits the visitor
4. **SEO/share** — Deep links to each section, OpenGraph optimization

## Sections (Information Architecture)

1. **Navigation** — Fixed, minimal (logo, links, CTA)
2. **Hero** — Logo, tagline, shield animation, CTA
3. **Stats** — "30+ years", "100% custom", "Data-driven", "Measured process"
4. **Space** — Video + photos of facility
5. **Identity** — Core statement + 5-pillar philosophy
6. **Method** — Accordion: 3-part methodology
7. **Platform** — 6 features of proprietary app
8. **Services** — 3 service areas: training, combat sports, health
9. **Team** — 2 profiles (Ariel + Griselda bio)
10. **Testimonials** — 3 client quotes with photos
11. **Location** — Map + address
12. **Griselda Crosslink** — Sidebar upsell to osteopathy page
13. **CTA Finale** — Last push to contact
14. **Footer** — Minimal branding + copyright

## Visual Principles

- **One accent color** (gold ≤15%) carrying premium tone
- **Restrained palette**: Dark backgrounds (99% of page), cream text, accent gold
- **Typography hierarchy**: PP Formula weights 300–900, scale 12–160px
- **Spacing**: Asymmetric rhythm (8px/24px/48px grid)
- **Elevation**: Subtle shadows, no glass or blur (too trendy)
- **No emoji, no gradient text**, no skeuomorphic affordances
- **Premium defaults**: webP images, system-font fallbacks, blur posterization on reveals

## Performance Targets

- **LCP** < 2.5s (hero video lazy, poster preload)
- **CLS** < 0.1 (reserve space, no jumps)
- **Lighthouse** 90+ (all categories)
- **Core Web Vitals**: All green at 75th percentile

## Current State (v1.0)

- ✅ Functional: All sections present, nav works, CTA form submits
- ❌ **Brand debt**: Using Playfair Display + DM Sans, not PP Formula
- ❌ **Logo**: Placeholder, not official DI-LOGO-SOLO variants
- ❌ **Animations**: Basic fade-ins only (no GSAP, no spring physics)
- ❌ **A11y**: No prefers-reduced-motion, keyboard nav gaps
- ❌ **Architecture**: Monolithic page.tsx, hard to maintain

## Target State (v2.0)

- ✅ **Brand lock**: PP Formula + official logos + refined gold palette
- ✅ **Premium motion**: GSAP hero timeline, Framer Motion spring accordion, Emil easing curves
- ✅ **Modular code**: 12+ reusable components, clean page.tsx
- ✅ **A11y**: WCAG 2.1 AA certified, full keyboard navigation
- ✅ **Performance**: Lighthouse 90+, <2.5s LCP
- **Result**: 8.5–9/10 (Equinox/Aman-level premium)

## Anti-References

❌ Generic SaaS (Stripe, Vercel color schemes)
❌ Startup VC energy (gradients, emoji, "scale" language)
❌ Stock photo fitness (generic models, staged perfection)
❌ Oversaturated motion (too many simultaneous animations)
❌ Icon overload (every bullet gets an icon)

## Success Metrics

- **Conversion**: 3%+ email signups from visitors
- **Engagement**: 40%+ scroll depth (read past testimonials)
- **Share**: 10+ monthly referrals from social links
- **Accessibility**: 100% WCAG 2.1 AA on WebAIM audit
- **Performance**: Lighthouse 90+ sustained (monthly CI check)
