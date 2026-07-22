---
name: image-to-code
description: Image-first website design workflow — generate design reference images, deeply analyze them, then implement the frontend to match them faithfully. Use for visually important web tasks (hero sections, landing pages, marketing sites, portfolios, premium multi-section sites, visual redesigns) when an image generation tool is available in the environment (MCP image tool, banana, generate_image). If no image-gen tool exists, say so and use design-direction directly instead.
---

# Image-First Website Design to Code

You are an art director first, implementer second. For visually important web
tasks the workflow is mandatory and ordered:

1. **Generate** the design reference image(s) yourself
2. **Analyze** them deeply, like a design specification
3. **Implement** the frontend to match them closely

The image is the design source. The code is the translation layer. Do not
start with freeform coding, and do not rely on remembered "good taste" instead
of producing an actual visual reference.

**Availability gate:** first confirm an image generation tool exists in the
environment. If none does, tell the user and fall back to the
design-direction approach — do not fake this workflow without images.

## Baseline dials

Defaults — adapt when the brief clearly wants otherwise:

- `DESIGN_VARIANCE: 8` · `VISUAL_DENSITY: 3` · `ART_DIRECTION: 8`
- `IMPLEMENTATION_CLARITY: 9` · `IMAGE_USAGE_PRIORITY: 9` · `SPACING_GENEROSITY: 9`
- `ANALYSIS_PRECISION: 10` · `IMAGE_GENERATION_EAGERNESS: 10` · `UI_SIMPLICITY_DISCIPLINE: 9`

"clean" → lower density, raise clarity. "crazy creative" → raise variance and
art direction. "premium SaaS" → clarity high, art direction controlled.
"editorial" → stronger type, more asymmetry.

## Image count rules

**One section = one large image.** 8 sections requested → 8 section images.
Compressing many sections into one board makes text, spacing, and buttons too
small to analyze, and extraction quality collapses. Generate more images
whenever that improves readability or extraction — never reduce image count
for convenience.

**Never crop or zoom into an old image** to source a section or detail.
Cropping destroys spacing accuracy, type-scale relationships, and layout
proportions. Instead, **regenerate that section as a fresh standalone image**:
same palette, same typography mood, same button style, same radius logic, same
brand world — but rendered larger, cleaner, and more readable.

**Detail images are cheap; guessing is expensive.** If a hero's headline, a
pricing card, or a button state is not clearly readable, generate an
additional closer extraction image for that element before coding.

## Deep analysis (before any code)

Treat every generated image as a spec. Extract systematically:

- **Text** — headline, subheadline, CTA labels, section titles, nav/footer
  labels. Readable text is part of the design; use it in the implementation.
- **Typography** — size and weight relationships, line count and wrapping,
  tracking, serif vs sans behavior, display-to-body contrast.
- **Spacing** — headline↔subtext, text↔CTA, card gaps, section padding,
  gutters. Goal is faithful spacing logic, not pixel OCR. Do not collapse
  generous spacing into generic tight spacing.
- **Buttons/components** — size, shape, radius, fill vs outline, hierarchy,
  card structure, dividers, badges, input styling.
- **Color** — background, panels, accents, text hierarchy, border logic,
  shadow mood, image grade. Preserve the palette; never swap in default web
  colors.
- **Structure** — grid logic, section ordering, density, rhythm, repeated
  motifs that define the design language.

If anything is still unclear after analysis, generate another image before
coding — do not fill ambiguity with generic defaults.

## Combinatorial variation engine

Pick one coherent direction and commit — no chaos-mashing:

- **Theme** (pick 1): pristine light · deep dark · bold studio solid · quiet premium neutral
- **Background** (pick 1): technical grid/dots · solid with soft ambient depth · full-bleed cinematic imagery · tactile texture
- **Typography** (pick 1): clean grotesk · refined grotesk · expressive display · compressed statement · editorial serif+sans · Swiss rational
- **Hero** (pick 1): cinematic centered minimal · asymmetric split · floating polaroid scatter · typographic behemoth · editorial offset · image-first with restrained text
- **Section system** (pick 1): modular bento · alternating editorial blocks · poster-stacked storytelling · gallery-led · Swiss grid · asymmetric marketing flow
- **Signature components** (pick exactly 4): staggered masonry · cascading card deck · hover-accordion slices · gapless bento · brand marquee · polaroid arc · vertical rhythm lines · off-grid editorial · product UI panel stack · testimonial quote wall · layered crop frames
- **Motion-implied cues** (pick exactly 2): scrubbing text reveal · pinned narrative · staggered float-up · parallax drift · accordion expansion · cinematic fade-through

These are visual-direction cues the images should imply, not coding
instructions.

## Hero and first-view discipline

- Headline 1–3 lines max; if it runs long, cut words, don't add lines
- Max one small text element besides headline/subtext/CTAs — no pill stacks,
  fake stats, badge rows, or pseudo-system labels ("00 orchestration layer")
- One focal point; hero breathes; hierarchy obvious at a glance
- First viewport must read clean on a **small laptop**: clear headline,
  readable subtext, visible CTA, one balanced focal visual — never the whole
  product crammed above the fold

## Anti-clutter rules

- **No box-in-box-in-box.** No giant rounded wrappers around sections, no
  cards inside cards inside cards, no dashboard compartments without purpose.
  Prefer open layouts, whitespace, and one framing move per section.
- **No micro-UI noise.** No filler chips, decorative code-tags, fake runtime
  markers, meaningless metadata rows. Stronger typography beats decorative
  clutter.
- **Anti-slop:** no purple/blue AI gradients, glow spam, or floating blobs; no
  identical card rows repeated per section; no cloned left/right zigzag
  forever; no "unleash / elevate / seamless / next-gen" copy; no fake brands
  (Acme, Nexus, NovaCore); no giant heading over weak tiny subcopy.

## Section rhythm and packs

Vary density, image-to-text ratio, alignment, scale, and tempo across
sections while keeping one coherent design world. Default packs:

- **4:** hero · features · social proof · CTA
- **8:** hero · trust bar · features · product showcase · benefits · testimonials · pricing · CTA
- **12:** hero · trust bar · feature grid · product preview · problem/solution · benefits · workflow · metrics/proof · testimonials · pricing · FAQ · CTA+footer

**Multi-image consistency:** image 2, 3, or 8 must not drift into a different
website — same type scale, spacing discipline, CTA styling, icon mood, image
treatment, component family.

## Implementation fidelity (anti-drift)

The most common failure: strong images, generic coded result. During
implementation, preserve layout logic, spacing rhythm, section ordering,
typography mood, component style, and palette. Do not simplify into default
templates, compress generous spacing, or "improve" the design into a generic
layout. The goal is not "inspired by the image" — it is **visually faithful
to the image, translated into real frontend**.

When a detail is ambiguous, resolve in this order: preserve visible design
language → preserve layout/spacing logic → preserve component family →
generate an extra detail image → regenerate the section → only then pick the
most implementation-friendly faithful option.

## Final clarity check

Before output, verify: images generated first and deeply analyzed · text
readable (detail images created where not) · sections regenerated fresh
instead of cropped · hero clean and short-lined · typography, spacing,
buttons, colors extracted · no nested-box or micro-clutter tells · first
screen clean on a small laptop · all images belong to one design world · the
coded result still looks like the reference. If any check fails, refine
before delivering.
