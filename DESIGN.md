# DESIGN.md — Diego Ceccato

Design rules for diegoceccato.com.ar. One person, two trades, two worlds on one site.
Read this before touching any page, component or token. Every value below already
exists in `src/styles/global.css`; this file explains why and how to use it.

## 1. Concept

**One man, two doors.** Diego paints houses and plays drums. The site never blends
the two: each has its own world, and the home is the fork between them.

| World | Pages | Mood | Metaphor |
|---|---|---|---|
| **Pared** (wall) | `/`, `/pintura/`, `/arreglos-del-hogar/` | Daylight, clean, honest trade | A freshly painted room |
| **Escenario** (stage) | `/clases-de-bateria/` | Night, loud type, one spotlight | A stage with the lights off |

The home shows both worlds side by side as two full-screen doors: cream on the
left, near-black on the right. The contrast between them is the brand; nothing
else decorates the page.

Three borrowed rules (from Refero style sheets, rules not colours):

1. **Contrast, not ornament.** Warm canvas against cinematic dark. No gradients
   for decoration, no shadows, no illustration.
2. **One accent, rationed.** Each world has exactly one accent colour, used only
   for actions and the active state. Never as a background fill.
3. **Type does the work.** Condensed display type at large sizes carries the
   identity. Body text stays quiet.

## 2. Colour

Tokens are named after the painter's trade. Never write a hex value in a page or
component; use the token. The one literal allowed is `#fff` for text on a filled
button or the before/after handle.

### Pared (light world)

| Token | Value | Use |
|---|---|---|
| `--pared` | `#ffffff` | Page background |
| `--imprimacion` | `#efeee9` | Quiet surfaces: cards, the light door, pending blocks |
| `--imprimacion-2` | `#e9e7e0` | The same surface on hover |
| `--linea` | `#d6d4ce` | Rules, borders, dividers |
| `--tinta` | `#23282d` | Body text, headings |
| `--tinta-suave` | `#5a6168` | Secondary text, captions |
| `--azul` | `#1b4b86` | **The accent.** Links, focus ring, the door button |

### Escenario (dark world)

| Token | Value | Use |
|---|---|---|
| `--escenario` | `#101010` | Page background, bar background |
| `--escenario-2` | `#1c1c1c` | Cards, tiles, pending blocks |
| `--escenario-linea` | `#303030` | Rules and borders |
| `--tiza` | `#e8e6df` | Headings and body text (chalk, not pure white) |
| `--tiza-suave` | `#aeb4bf` | Secondary text |
| `--laton` | `#d4a03a` | **The accent.** Links, focus ring, the door button, hover on tiles |

### Shared

| Token | Value | Use |
|---|---|---|
| `--wa` | `#0e7c3f` | WhatsApp button fill, both worlds. White text on it |
| `--wa-hover` | `#0a6332` | Hover and active |
| `--wa-tiza` | `#4cc77a` | WhatsApp text link on the dark stage |

Rules:

- The dark world is switched on by `body.tema-oscuro` (set by `seccion="bateria"`
  in `Base.astro`). Components override their colours under `.tema-oscuro`; pages
  never pick colours per world by hand.
- Accents are never backgrounds for large areas. The only filled buttons are
  WhatsApp (green) and the two door buttons on the home.
- Photos carry the colour. Chrome stays monochrome around them.

## 3. Typography

One family: **Archivo Variable** (self-hosted via `@fontsource-variable/archivo`,
width axis). No second typeface, no serif.

| Role | Width | Weight | Case | Line height |
|---|---|---|---|---|
| Display (h1, h2, door titles, the hero name) | `--ancho-titulo` = 75% (condensed) | 700 | Sentence case in Pared, **UPPERCASE** in Escenario | 0.88–1.02 |
| h3, facts (`.hechos dt`), tile titles | 75% | 700 | As above | 1.1 |
| Body | `--ancho-texto` = 100% | 400 | Sentence case | 1.55 |
| Labels, eyebrows (`.puerta__rotulo`) | 100% | 600 | UPPERCASE, +0.06em tracking | 1.4 |

Scale (base 18px, ratio ~1.25):

```
--t-0 1rem      body, captions
--t-1 1.1875rem lead on phones, nav, kicker
--t-2 1.4375rem h3, facts, lead on desktop
--t-3 1.8125rem drum page h1
--t-4 2.3125rem h2 in Pared
--t-5 clamp(2.5rem, 6vw, 3.5rem)   h2 in Escenario, door titles, closing h2
--t-6 clamp(3rem, 8vw, 4.75rem)    h1 in Pared
```

Beyond the scale, two display sizes exist on purpose:

- The hero name on the drum page: `clamp(4rem, 14vw, 9rem)`, line-height 0.88.
- The same on phones: `clamp(3.5rem, 19vw, 5rem)`.

Rules:

- Headings use `text-wrap: balance`. Body paragraphs stop at `--medida` (64ch).
- Letter spacing stays near 0 on display type (−0.01 to −0.02em). Tight feel
  comes from line height and condensed width, not from tracking.
- Copy is Argentine Spanish, voseo, short sentences. Nothing on the site says
  something Diego did not confirm; missing content is marked with `<Pendiente>`.

## 4. Spacing and shape

| Token | Value | Use |
|---|---|---|
| `--contenedor` | 1080px | Max content width |
| `--gutter` | 16px | Side padding on phones; `.contenedor` is `min(100% − 2·gutter, 1080px)` |
| `--seccion` | `clamp(36px, 6vw, 72px)` | Vertical padding of every `.seccion` |
| `--medida` | 64ch | Max line length for text |
| `--radio` | 6px | The only corner radius: buttons, cards, images, tiles |

Rules:

- Sections stack with a 1px `--linea` rule between them (`.seccion + .seccion`).
- Grids: `.dos` (two columns from 820px), `.galeria` (auto-fill 260px),
  `.hechos` (2 columns, 4 in the drum hero on desktop), tiles 2 → 4 columns at 720px.
- Full-bleed surfaces (home doors, drum hero) escape the container; their text
  still sits inside the container width.
- No shadows anywhere. Depth comes from surface colour and 1px rules.
- Pill shapes, 999px radii and oversized rounded corners are out.

## 5. Components

| Component | Role | Rules |
|---|---|---|
| `BotonWhatsApp` | The only contact control. `lleno` (green fill) for the main action, `texto` (inline link with icon) elsewhere | `origen` picks the pre-filled message so Diego knows which page the chat came from |
| `BarraWhatsApp` | Fixed bottom bar on phones (<720px) | Carries the hero action; the hero's own button hides on phones to avoid showing it twice |
| `Cierre` | Closing call to action on service pages | WhatsApp first, phone call as the alternative, hours below |
| `Pendiente` | Visible marker for content Diego still owes | Dashed border, ships in the HTML on purpose; counted by tests via `data-pendiente` |
| `AntesDespues` | Before/after slider for finished jobs | Both photos in the HTML; the only inline script besides JSON-LD |
| Header (`Base.astro`) | Brand, two section links, WhatsApp link on desktop | Same on every page; active section underlined with `currentColor` |
| Footer (`Base.astro`) | Three columns: who and where, site pages, contact | Takes the page's world; repeats phone and hours |

Page patterns (`global.css`): `.hero` + `.hero__grilla`, `.hechos` (trust facts,
always before the photo block), `.lista`, `.faq`, `.galeria`.

## 6. Motion

Motion is reserved for actions. Nothing moves on its own.

- Hover and active on links and buttons: 150ms ease on colour, background,
  border. Buttons sink 1px on `:active`.
- Tiles lift 3px on hover; the dark door's photo scales 1.08 → 1.12 over 400ms.
- Page changes cross-fade in 180ms through the CSS View Transitions API
  (`@view-transition { navigation: auto }`). No JavaScript involved.
- `prefers-reduced-motion: reduce` turns every transition and animation off.
- No scroll-triggered animation, no parallax, no auto-playing carousels.

## 7. Responsive

Desktop is designed first, then each pattern is re-decided for phones.

| Breakpoint | What changes |
|---|---|
| ≥820px | `.hero__grilla` 3:2, `.dos` two columns |
| ≥720px | Doors side by side, tiles 4 columns, footer 3 columns, header WhatsApp link visible, phone bar hidden |
| <720px | Phone bar fixed at the bottom (`body.con-barra` pads 84px), hero WhatsApp button hidden, tiles 2 columns with smaller titles |
| ≤600px | `h1` drops to `--t-5`, lead to `--t-1`, header wraps to two rows, drum hero loses its min-height |

Rules:

- 16px side gutter on phones, never horizontal scroll.
- The first screen on a phone must show the headline, the lead and the trust
  facts; the action is the fixed bar.
- Anchor targets keep `scroll-margin-top` so in-page links do not land glued to
  the top edge.

## 8. Accessibility and performance

- `:focus-visible` ring: 3px, `--azul` in Pared, `--laton` in Escenario, 3px offset.
- Every page has exactly one `h1`. Section links use `aria-current="page"`.
- Contrast: body text and accents pass AA on their surfaces; WhatsApp green is
  dark enough for white text.
- No client-side JavaScript except JSON-LD and the before/after script. All
  content is in the HTML.
- Fonts are self-hosted; no third-party requests.
- Images declare `width` and `height` and load lazily below the fold. Hero photos
  are CSS backgrounds behind a dark gradient.

## 9. Open items

- Real photos: hero original, one per tile, one per home door, finished jobs.
  Until then the 160px live photo is blurred behind the dark surfaces.
- The drum page is close to its reference (matiassabagh.com.ar). Next step:
  ask for layout variants against this document and pick one, do not keep the copy.
