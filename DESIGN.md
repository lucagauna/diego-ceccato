# DESIGN.md — Diego Ceccato

Design rules for diegoceccato.com.ar: a painter's site that looks like a paint
catalogue. Read this before touching any page, component or token. Every value
below already exists in `src/styles/global.css`; this file explains why and how
to use it.

## 1. Concept

**A paint chip card.** Diego paints houses and does small home repairs. The site
is his colour chart: one paint chip per page, and the colour is the paint.

| Chip | Page | Colour | Tone name |
|---|---|---|---|
| 01 | `/pintura/` | `--azul`, latex blue | Látex azul |
| 02 | `/arreglos-del-hogar/` | `--laton`, brass | Latón |

The home is the catalogue page: the name on the left, the chips on the right, and
hovering a chip paints the whole page in that colour, so the visitor tries the
colour on the wall before clicking. The header is a chip painted near-black; the
footer is a cream chip with the colour squares.

Three rules, borrowed from Refero style sheets and kept:

1. **Contrast, not ornament.** Cream wall, near-black header, flat colour. No
   gradients for decoration, no shadows, no illustration.
2. **Colour has a job.** Blue means painting, brass means repairs, green means
   WhatsApp. A colour never appears without meaning what it means.
3. **Type does the work.** Condensed display type at large sizes carries the
   identity. Body text stays quiet.

Each service page follows the same order: the WhatsApp conversation that is
about to happen, framed as a phone screen, with the trust facts beside it; the
trade as numbered cards in the page colour; the proof (before/after on painting,
the painting bridge on repairs); the questions as an accordion; and a closing
band in the page colour that repeats the chat's last line.

## 2. Colour

Tokens are named after the painter's trade. Never write a hex value in a page or
component; use the token. The one literal allowed is `#fff` for text on a filled
button or the before/after handle, and `#1a1405` for text on brass.

| Token | Value | Use |
|---|---|---|
| `--pared` | `#ffffff` | Page background |
| `--imprimacion` | `#efeee9` | Quiet surfaces: cards, chat panel, footer, pending blocks |
| `--imprimacion-2` | `#e9e7e0` | The same surface on hover |
| `--linea` | `#d6d4ce` | Rules, borders, dividers |
| `--tinta` | `#23282d` | Body text, headings |
| `--tinta-suave` | `#5a6168` | Secondary text, captions |
| `--azul` | `#1b4b86` | Painting: chip 01, eyebrows and links on the painting page, focus ring |
| `--laton` | `#d4a03a` | Repairs: chip 02, its underline in the header. Dark text on it |
| `--escenario` | `#101010` | The header chip. Chalk text on it |
| `--escenario-2`, `--escenario-linea` | `#1c1c1c`, `#303030` | Surfaces and rules on the header |
| `--tiza`, `--tiza-suave` | `#e8e6df`, `#aeb4bf` | Text on the header |
| `--wa`, `--wa-hover` | `#0e7c3f`, `#0a6332` | WhatsApp button fill. White text on it |
| `--wa-tiza` | `#4cc77a` | WhatsApp text link on the dark header |

Rules:

- On the repairs page, eyebrows use a darker brass (`#9a7222`) because brass on
  cream does not pass contrast for small text.
- Filled surfaces are chips: the home chips, the header, the WhatsApp button.
  Everything else sits on the wall.
- Contrast: every text and surface pair passes AA (checked 2026-11-04).

## 3. Typography

One superfamily: **Barlow** for text and **Barlow Condensed** for display, both
self-hosted through `@fontsource` (Barlow 400 and 600, Barlow Condensed 700).
No other typeface, no serif. Chosen among three candidates on the real pages:
industrial and tight in display, honest and clear in text.

| Role | Family | Weight | Case | Line height |
|---|---|---|---|---|
| Display (h1, chip names, the home name) | `--fuente-titulo` = Barlow Condensed | 700 | Sentence case; UPPERCASE for chip names and the home name | 0.9–1.1 |
| h2, h3, facts (`.hechos dt`), brand | Barlow Condensed | 700 | Sentence case | 1.02–1.1 |
| Body | `--fuente` = Barlow | 400 | Sentence case | 1.55 |
| Labels, eyebrows, nav, buttons | Barlow | 600 | Eyebrows UPPERCASE, +0.06em tracking | 1.4 |

Scale (base 18px, ratio ~1.25):

```
--t-0 1rem      body, captions, chat bubbles
--t-1 1.1875rem lead on phones, nav, kicker
--t-2 1.4375rem h3, facts, lead on desktop
--t-3 1.8125rem chip names on the home
--t-4 2.3125rem h2
--t-5 clamp(2.5rem, 6vw, 3.5rem)   service page h1, closing h2
--t-6 clamp(3rem, 8vw, 4.75rem)    reserved for display
```

The home name is the one size beyond the scale: `clamp(3.5rem, 10vw, 7rem)`,
uppercase, line-height 0.9.

Rules:

- Every display element sets `font-family: var(--fuente-titulo)`; never fake a
  condensed cut with `font-stretch`, and never use Barlow Condensed below
  `--t-1`, where Barlow 600 does the job.
- Headings use `text-wrap: balance`. Body paragraphs stop at `--medida` (64ch).
- Copy is Argentine Spanish, voseo, short sentences. Nothing on the site says
  something Diego did not confirm; missing content is marked with `<Pendiente>`.
- The chat bubbles quote the real pre-filled WhatsApp message (`MENSAJES` in
  `src/data/contacto.ts`) and Diego's own instruction. They are an example and
  are labelled as one.

## 4. Spacing and shape

| Token | Value | Use |
|---|---|---|
| `--contenedor` | 1080px | Max content width |
| `--gutter` | 16px | Side padding on phones; `.contenedor` is `min(100% − 2·gutter, 1080px)` |
| `--seccion` | `clamp(36px, 6vw, 72px)` | Vertical padding of every `.seccion` |
| `--medida` | 64ch | Max line length for text |
| `--radio` | 6px | Corner radius of buttons, cards, chips, images |

Rules:

- Sections stack with a 1px `--linea` rule between them (`.seccion + .seccion`).
- Chat panels use a 12px radius and bubbles 14px with one 4px corner, the only
  place where the radius grows: they must read as messages, not cards.
- Grids: `.dos` (two columns from 820px), `.galeria` (auto-fill 260px),
  `.hechos` (2 columns), the home catalogue 1.1fr/1fr from 820px.
- No shadows anywhere. Depth comes from surface colour and 1px rules.
- Pill shapes and oversized rounded corners are out.

## 5. Components

| Component | Role | Rules |
|---|---|---|
| `muestrario/CabeceraPintada` | The header: near-black chip, brand, one link per page underlined in its colour, WhatsApp link on desktop | `seccion` marks the active page; the bar replaces the WhatsApp link on phones |
| `muestrario/PieMuestra` | The footer: cream chip, colour squares with page links, WhatsApp, phone, hours, legal line | Takes the page's `contacto` origin |
| `Muestras.ts` | The chip data: href, colour class, code, name, text, tone | The single source for header, footer and home. Adding a page means adding a chip |
| `BotonWhatsApp` | The only contact control. `lleno` for the main action, `texto` elsewhere | `origen` picks the pre-filled message |
| `BarraWhatsApp` | Fixed bottom bar on phones (<720px) | Carries the hero action; the hero's own button hides on phones |
| `Chat` | The WhatsApp conversation as bubbles; `marco="telefono"` draws it as a phone screen | Messages come from `Conversaciones.ts`; never invent Diego's lines |
| `data/servicios.ts` | The four painting lines and the six repair trades | The single source for the service cards |
| `Pendiente` | Visible marker for content Diego still owes | Dashed border; counted by tests via `data-pendiente` |
| `AntesDespues` | Before/after slider for finished jobs | Both photos in the HTML; the only inline script besides JSON-LD |

## 6. Motion

Motion is reserved for actions and for the one reveal on each page.

- Chat bubbles arrive one after the other on load: 350ms fade and 8px rise,
  600ms apart. This is the page's only entrance animation.
- The home paints itself on hover: 450ms ease on background and colour; the
  hovered chip slides 6px and its swatch scales 1.08.
- Hover and active on links and buttons: 150ms ease on colour, background,
  border. Buttons sink 1px on `:active`.
- Page changes cross-fade in 180ms through the CSS View Transitions API.
- `prefers-reduced-motion: reduce` turns every transition and animation off;
  bubbles then render in place.
- No JavaScript for motion, no scroll-triggered animation, no carousels.

## 7. Responsive

Desktop is designed first, then each pattern is re-decided for phones.

| Breakpoint | What changes |
|---|---|
| ≥820px | Home catalogue and service heroes in two columns, `.dos` two columns |
| ≥720px | Footer in one row, header WhatsApp link visible, phone bar hidden |
| <720px | Phone bar fixed at the bottom (`body.con-barra` pads 84px), hero WhatsApp button hidden, header wraps to two rows |
| ≤600px | `h1` drops to `--t-5`, lead to `--t-1` |

Rules:

- 16px side gutter on phones, never horizontal scroll.
- The first screen on a phone must show the headline, the lead and the trust
  facts; the action is the fixed bar. The chat follows under them.
- The home's hover painting needs a pointer; on phones the chips are plain links.

## 8. Accessibility and performance

- `:focus-visible` ring: 3px `--azul`, 3px offset.
- Every page has exactly one `h1`. Header links use `aria-current="page"`.
- Chat panels carry an `aria-label` naming them as an example conversation.
- No client-side JavaScript except JSON-LD and the before/after script. All
  content is in the HTML.
- Fonts are self-hosted (three woff2 files); no third-party requests.
- Images declare `width` and `height` and load lazily below the fold.

## 9. Open items

- Real photos: finished jobs for the before/after and the gallery, a photo of
  Diego for the painting hero.
- Diego's answers to the open questions marked with `<Pendiente>` on both
  service pages.
- Drum lessons left the site on 2026-11-04. The layouts explored for it live in
  git history (commit `65734d0` and before) if they are ever needed again.
