# Premier · Core — design system (redesign steps 1–6 of 8, and the status page from step 7)

This document describes the foundation that every later redesign step builds on.
It is written for someone who has only this file and the files it names.

- Showcase (every token and component, live): `/core/showcase.html`
- The chat screen (`public/chat.html` and its English mirror) is the first product page on the system. Every other page still has the old look and loads none of these files.
- Step 1 built the foundation (sections 1–11). Step 2 built the Core, the 3D scene behind the interface (section 12). Step 3 moved the chat screen to the system (section 13) and added two small things to the foundation: `Core.stage()` (12.5) and `CoreUI.light.scope()` (section 5). Step 4 moved everything the AI makes and does: the result window, the work log, code blocks, result cards and media, the cloud computer, folder and helper (section 14), and added two palettes to the tokens: syntax (14.4) and terminal (14.5).
- The guarantees below are checked by `tests/core-foundation.test.js`, `tests/core-scene.test.js`, `tests/core-chat.test.js` and `tests/core-work.test.js` (`npm test`).

---

## 1. Files

| File | What it holds |
| --- | --- |
| `public/core/core-tokens.css` | Every design decision as a named value, both themes, fonts. |
| `public/core/core-base.css` | Page canvas, the glass material, small details (selection, focus, scrollbars, links, caret), cursor rules. |
| `public/core/core-components.css` | All base components and their states. |
| `public/core/core-ui.js` | Behaviour: dialog, menu, tooltip, toast, confirmation capsule, tabs, select list, Core light. One global: `CoreUI`. |
| `public/core/cursor/*.svg` | The six cursor drawings (reference copies; the tokens embed the same drawings). |
| `public/core/core-scene.css` | The scene layer: the canvas, the quiet fallback glow, mini cores. Replaces the step 1 stand-in. |
| `public/core/core-scene.js` | The Core: 3D scene, mini cores, commands. One global: `Core`. No library, raw WebGL 1. |
| `public/core/showcase.html`, `showcase.css`, `showcase.js` | The showcase page. Classes `sc-*` are for that page only. |
| `tests/core-foundation.test.js` | Automated checks of the rules in sections 1–11. |
| `tests/core-scene.test.js`, `tests/core-scene-util.js` | Automated checks of section 12. |
| `public/core/core-chat.css` | The chat screen: layout, sidebar, top bar, messages and prose, input field, limit line, empty state, phone (section 13). |
| `public/js/23-core-chat.js` | Chat glue: drives the Core from what happens in the chat, builds the "+" menu, watches the field width. No chat logic, no texts. |
| `public/css/chat-legacy.css`, `scripts/build-chat-legacy.py` | Generated bridge, kept until step 8. No page loads it since step 5 (`tests/core-chat.test.js` checks that). Section 13.2. |
| `tests/core-chat.test.js` | Automated checks of section 13. |
| `public/core/core-work.css` | What the AI makes and does: result window, work log, code blocks, result cards and media, cloud computer, folder, helper (section 14). |
| `public/core/core-dialogs.css` | Windows, menus, tooltips, notifications, confirmation capsules and the account, billing and team contents on the chat page (section 15). |
| `public/core/core-landing.css`, `core-landing.js`, `core-login.css`, `core-login.js`, `core-trial.css`, `core-trial.js` | Landing, login and trial pages (step 6, section 16): panes and plates on real glass, the scroll flight through `Core.pose`, the login flight. |
| `public/js/25-core-dialogs.js` | Glue: turns the shared window's `on` class into a Core window; plan cards, account sections, the model menu keys. No chat logic, no texts. |
| `tests/core-dialogs.test.js` | Automated checks of section 15. |
| `public/js/24-core-work.js` | Glue for section 14: divider, birth of the result window, phone switch, keyboard, terminal theme. No chat logic, no texts. |
| `tests/core-work.test.js` | Automated checks of section 14. |

Load order on a page that uses the system (after any old stylesheets that are still needed):

```html
<html lang="ru" class="core">
...
<link rel="stylesheet" href="/core/core-tokens.css?v=1">
<link rel="stylesheet" href="/core/core-base.css?v=1">
<link rel="stylesheet" href="/core/core-components.css?v=1">
<link rel="stylesheet" href="/core/core-scene.css?v=1">
<script defer src="/core/core-ui.js?v=1"></script>
<script defer src="/core/core-scene.js?v=1"></script>
<script defer src="/js/your-page.js?v=1"></script>   <!-- after the two above: it may call CoreUI and Core at once -->
...
<body>
<div class="core-scene" aria-hidden="true"></div>   <!-- first child of body; the script fills it -->
```

`?v=N` makes the server cache the file for a year (existing product convention). Raise the number in every page whenever the file changes.

Naming: tokens are `--core-*`, classes `.core-*`, attributes `data-core-*`, events `core:*`, the script global `CoreUI`. Names starting with `--_` are private to one rule. The old system uses `--p-*` and unprefixed classes, so the two never collide. Do not edit `public/tokens.css`; tests read it.

The stylesheets do nothing until an element has the class `core`. `<html class="core">` switches the whole page (dark scene, type, cursor, scrollbars). `class="core"` on a block switches only that block (type, cursor, details; no page background).

---

## 2. The idea in one page

One 3D object, the **Core**, lives behind the whole interface: a glowing cloud of points that shows what the AI is doing (section 12). Everything else is **dark glass floating above the Core**.

- **Material.** Surfaces are translucent blurred glass. The Core stays visible through them. Opaque fills are not used; code and long reading text sit on the densest glass.
- **Light.** The Core is the only light source. Every surface has a one-pixel edge that is brightest on the side facing the Core.
- **Three depths.** Far (panels), mid (windows), near (menus, tooltips, notifications). They differ in blur, brightness and shadow and in nothing else.
- **Birth.** A window grows out of the point that was clicked, with a slight 3D turn, and collapses back into a spark.
- **Focus.** While a window is open the Core recedes and dims and everything under the window is blurred.
- **Colour.** The scene is a very dark, slightly warm black. The Core is incandescent: amber, white-hot when the model thinks. Amber is light, not paint. Everything else is glass and neutral text.
- **Two voices.** Onest for people, JetBrains Mono for the machine.
- **Cursor.** A four-pointed spark, drawn by the browser's native cursor.
- **Light theme.** The same system drawn as ink on paper: warm paper scene, the Core in dark ink, glass as frosted white, edges as ink hairlines.

---

## 3. Rules

These are the rules later steps must keep. Each has a reason.

1. **One amber action per screen.** `core-btn--main` appears once per screen or window. Amber also marks "the AI is working right now" (`core-tag--heat`, loading points, a busy main button). Sanctioned amber besides those two: the text caret, the notification mark, and the limit ring, because they are literally pieces of the Core. Nothing else is amber: no amber links, selection, icons, borders or "on" states.
2. **"On" is light, not colour.** A checked checkbox, an enabled switch, a selected segment, tab, chip or row get brighter (`--core-on`, `--core-fill-*`). This keeps a settings window with ten switches from becoming ten amber dots.
3. **Status colours only for status.** `--core-ok`, `--core-warn`, `--core-bad` mean success, warning, error. A destructive button uses `--core-bad` on its text and edge, never a solid red fill.
4. **Voices.** Human voice (Onest): all interface text and prose. Machine voice (JetBrains Mono): terminal, file names, code, limits and counters, statuses, model names, keys, keyboard shortcuts, timestamps in lists. Unbounded is not used anywhere. Machine text has ligatures off so `=>` and `!=` stay literal.
5. **Text levels and contrast.** `--core-text` and `--core-text-2` keep at least 4.5:1 on every glass depth even with the brightest possible background directly behind the glass (tested against pure white in the dark theme and pure black in the light theme). `--core-text-3` keeps 4.5:1 at rest only, so use it for hints, placeholders and metadata, never for something the user must read to continue. Never put body text straight on the scene where the Core can pass behind it; give it a far panel.
6. **Depth by role, not by taste.** See the table in section 5. Do not invent a fourth depth.
7. **Blur is never nested.** A glass surface inside another glass surface gets no `backdrop-filter` (the stylesheet enforces this). An open dialog blurs the page once through its backdrop; the dialog pane itself does not blur.
8. **Motion is fast and calm.** Only the four duration tokens and three easing tokens. Nothing bounces, nothing is longer than 320 ms. Looping motion is reserved for "working" states. All of it stops under reduced motion.
9. **Three radii, nested.** `lg` for windows and capsules, `md` for cards and menus, `sm` for controls and menu items. `lg − 8 = md`, `md − 6 = sm`, so an inner corner is concentric with its outer one when the padding is 8 or 6. Pills use `--core-r-full`.
10. **Spacing on the 4 px grid.** Use `--core-s-*`. The two half-steps (`s-05` = 2 px, `s-15` = 6 px) exist for optical corrections and concentric insets only.
11. **Keyboard focus is always visible.** A 2 px ring in `--core-focus` (warm white on dark, ink on light) with a 2 px offset. Text fields show the same colour on their border plus a soft halo.
12. **Touch targets are at least 44 px.** At `(pointer: coarse)` or widths up to 600 px, controls grow to 44 px and small ones get an invisible 44 px hit area. Fields use 16 px text there so iOS does not zoom.
13. **Never write `cursor: pointer`.** Use `cursor: var(--core-cursor-action)`. See section 8.

---

## 4. Tokens

All values live in `core-tokens.css`. The showcase prints the live values. The light theme redefines colours, glass and cursor; type, radii, spacing and motion are shared.

**Editing note.** The light block appears twice in the file (system setting and `data-theme="light"`), and the no-blur block three times. Keep the copies identical; the test fails if they differ.

### 4.1 Themes

The mechanism is the product's existing one: the system setting decides, and `data-theme="dark"` or `data-theme="light"` on `<html>` forces a theme. Dark is the primary theme and the fallback.

### 4.2 Light source

| Token | Meaning |
| --- | --- |
| `--core-x`, `--core-y` | Centre of the Core in percent of the viewport (0–100). Set on `<html>` only. |
| `--core-light` | Strength of the Core's light on the interface. 1 at rest. |
| `--core-at-x`, `--core-at-y` | Where a surface sits in the viewport, in percent. Defaults to the centre (50, 50). Set on the surface or a container. |

### 4.3 Colour roles

| Token | Dark | Light | Use |
| --- | --- | --- | --- |
| `--core-scene` | `#0B0A08` | `#F1ECE3` | Page background under everything. |
| `--core-glass-far` / `-mid` / `-near` | dark tints, 58 / 60 / 72 % | white tints, 56 / 66 / 82 % | Fill of each depth. |
| `--core-glass-dense` | `rgb(9 8 7 / .9)` | `rgb(250 247 241 / .92)` | Dense glass for code and long reading. |
| `--core-solid-far` … `-dense` | opaque | opaque | Same surfaces without blur (fallback). |
| `--core-edge` | `#FFE9CF` | `#1B1714` | Colour of the lit edge (light on dark, ink on paper). |
| `--core-fill-1` / `-2` / `-3` | warm white 5 / 9 / 14 % | ink 4.5 / 8 / 12 % | Layers on top of glass: hover / pressed, selected / thumb, strong. |
| `--core-well` | black 26 % | ink 3.5 % | Recess of a text field or segmented control. |
| `--core-line`, `--core-line-2` | warm white 8 / 17 % | ink 9 / 20 % | Hairline divider / control border. |
| `--core-scrim`, `--core-scrim-blur` | | | Dimming and blur under a dialog. |
| `--core-text`, `--core-text-2`, `--core-text-3` | `#F4EEE5`, `#C6BDB1`, `#9C9388` | `#1B1714`, `#4F4840`, `#6B635A` | Primary, secondary, hint. |
| `--core-text-on-heat` | `#1C1308` | `#1B1206` | Text on the main button. |
| `--core-on`, `--core-on-ink` | | | Fill and mark of a checked / enabled control. |
| `--core-heat-1` … `--core-heat-5` | ember `#A63A12`, flame `#E8590C`, amber `#FF8B2C`, glow `#FFB65C`, white-hot `#FFF0D6` | deeper values for paper | The heat scale. `heat-2` is the old brand orange. |
| `--core-point`, `--core-point-hot` | `heat-3`, `heat-5` | ink | Colour of a Core particle in the interface (loading points, notification mark). |
| `--core-ok`, `--core-warn`, `--core-bad` (+ `-soft`) | green, yellow, rose | deeper | Status text and its tinted background. |
| `--core-focus`, `--core-select`, `--core-caret` | | | Focus ring, text selection, caret. |
| `--core-scroll`, `--core-scroll-hover` | | | Scrollbar thumb. |
| `--core-syn-*` | | | Code colours: comment, punct, meta, string, number, keyword, tag, func, type, attr. The heat scale plus neutrals; table in 14.4. |
| `--core-term-*` | | | Terminal palette: bg, fg, dim, cursor, select, the eight ANSI colours and three bright ones; table in 14.5. |

### 4.4 Depth

| Token | Far | Mid | Near | Dense |
| --- | --- | --- | --- | --- |
| `--core-blur-*` | 36 px | 24 px | 14 px | 24 px |
| `--core-bright-*` (dark) | .5 | .52 | .52 | .5 |
| `--core-backdrop-*` | full `backdrop-filter` value built from the two above | | | |
| `--core-shadow-*` | barely there | soft and deep | tight and dark | uses its depth's |
| `--core-edge-*` (peak edge brightness) | .26 | .42 | .6 | uses its depth's |

`--core-edge-shade` is the share of that brightness on the side turned away from the Core, `--core-edge-even` the share when the Core is directly behind the surface, `--core-sheen` the faint glow inside the glass on the Core's side.

The brightness and contrast numbers inside `--core-backdrop-*` are what make text readable when the Core is white-hot behind a pane. If you change a glass fill or a backdrop value, run the test: it recomputes the worst case.

### 4.5 Type

Six sizes per voice. Sizes are in `rem`, so the user's browser font size is respected; do not set `font-size` on `<html>`.

| Step | Human (Onest) | Machine (JetBrains Mono) | Line | Default weight | Use |
| --- | --- | --- | --- | --- | --- |
| 1 | 12 | 11 | 16 | 400 / 500 | Captions, hints, counters, tags. |
| 2 | 14 | 13 | 20 | 400 | Interface default: buttons, fields, menus, rows; code. |
| 3 | 16 | 15 | 24 | 400 | Prose, chat answers, large fields. |
| 4 | 20 | 18 | 28 | 600 / 500 | Window and section titles. |
| 5 | 28 | 26 | 36 | 600 / 500 | Page titles, large numbers. |
| 6 | 40 | 36 | 44 | 600 / 500 | Hero text. |

Machine sizes are one notch smaller so lowercase letters of the two fonts match in height on one line.

- Shorthands: `font: var(--core-human-3)`, `font: var(--core-machine-2)`. Classes: `.core-human-1…6`, `.core-machine-1…6`.
- Pieces: `--core-fs-N`, `--core-fsm-N`, `--core-lh-N`, weights `--core-w-1` (400), `--core-w-2` (500), `--core-w-3` (600), tracking `--core-track-4/5/6` for the three large steps.
- The `font` shorthand resets ligature settings. If you set a machine font with `font:` in new CSS, add `font-variant-ligatures: none` after it.

### 4.6 Radii, spacing, sizes

- Radii: `--core-r-sm` 8, `--core-r-md` 14, `--core-r-lg` 22, `--core-r-full` for pills.
- Spacing: `--core-s-1` 4, `-2` 8, `-3` 12, `-4` 16, `-5` 20, `-6` 24, `-8` 32, `-10` 40, `-12` 48, `-16` 64, `-24` 96; half-steps `-05` 2 and `-15` 6.
- Control heights: `--core-h-sm` 28, `--core-h-md` 36, `--core-h-lg` 44 (they become 36 / 44 / 48 on touch and phone widths). `--core-hit` 44 is the minimum touch target. Icons: `--core-icon` 16, `--core-icon-lg` 20.

### 4.7 Motion

| Token | Value | Use |
| --- | --- | --- |
| `--core-dur-1` | 80 ms | Hover, press. |
| `--core-dur-2` | 140 ms | Switches, menus, tooltips, closing. |
| `--core-dur-3` | 220 ms | Birth of a window. |
| `--core-dur-4` | 320 ms | Notification flight, moving the Core's light. |
| `--core-ease-out` | `cubic-bezier(.16,1,.3,1)` | Appearing: leaves fast, settles softly. |
| `--core-ease-in` | `cubic-bezier(.5,0,.85,.25)` | Disappearing: collapses into a spark. |
| `--core-ease-move` | `cubic-bezier(.4,0,.2,1)` | Moving in place (thumb, ring). |
| `--core-ambient` | 2400 ms | Period of slow "breathing" loops. Not a transition. |

Reduced motion: when the system asks for it, or when `<html data-core-motion="reduce">` is set, the four durations become 0.01 ms and looping animations are removed. `core-ui.js` reads the same tokens, so scripted flights also become instant. Always take durations from tokens so this keeps working.

### 4.8 Layers, glyphs, cursor

- `--core-z-scene` −1, `--core-z-dialog` 2000, `--core-z-float` 2100 (menus, capsule), toasts and tooltips above that.
- `--core-glyph-spark`, `-check`, `-dash`, `-chevron`, `-close`: mask images. Paint them with `background: currentColor; mask: var(--core-glyph-spark) center/contain no-repeat`.
- Cursor tokens: section 8.

---

## 5. Glass

```html
<aside class="core-glass core-glass--far" data-core-at="left">…</aside>
<div class="core-glass">…</div>                       <!-- mid is the default -->
<div class="core-glass core-glass--near">…</div>
<div class="core-glass core-glass--dense">…</div>     <!-- combine with a depth if needed -->
```

| Depth | Class | Use it for |
| --- | --- | --- |
| Far | `core-glass--far` | Page chrome: sidebar, header, footer, section headers, any panel that carries text over the scene. |
| Mid | `core-glass` / `core-glass--mid`, `core-card`, `core-dialog__pane` | Windows: dialogs, cards, the chat input field, result window. |
| Near | `core-glass--near`, `core-menu`, `core-tip`, `core-toast`, `core-capsule` | Menus, tooltips, notifications, the confirmation capsule, popovers. |
| Dense | `core-glass--dense`, `core-code` | Readability, not depth: code blocks and long reading text. |

Components that are glass by definition (`core-card`, `core-menu`, `core-tip`, `core-toast`, `core-capsule`, `core-dialog__pane`, `core-code`) get the material without the `core-glass` class.

What the material consists of: the fill (`background`), the blur and dimming of whatever is behind (`backdrop-filter`), the shadow, and the edge drawn by `::after`. Because `::after` is taken, use `::before` for your own decoration on a glass element. Scrolling content must live in an inner element (`core-dialog__body`, `core-menu__scroll`, `pre`), otherwise the edge scrolls away with it. Set `border-radius` freely; the edge follows it.

### How the edge knows where the Core is

One place: `--core-x` and `--core-y` on `<html>`. The scene writes them whenever the Core changes place or state, so a page that runs the scene does not call this itself:

```js
CoreUI.light.set({ x: 50, y: 92 }, true);   // Core moved to the horizon; true = glide over 320 ms
CoreUI.light.set({ light: 1.2 });           // brighter edges; values above 1 are allowed
```

Every glass surface computes, in CSS, the direction from itself to that point and how far away it is, and lights its edge accordingly: far from the Core the edge is clearly directional; with the Core directly behind, the whole rim glows evenly.

A surface needs to know roughly where it is on screen (`--core-at-x`, `--core-at-y`):

- Default is the centre, which is right for the main column of content.
- Fixed chrome says where it lives: `data-core-at="left"`, `right`, `top`, `bottom` (combinable), or `data-core-at="core"` for "the Core is right behind me".
- Menus, tooltips, toasts and the capsule are positioned by `core-ui.js`, which sets their exact position.
- A dialog pane is treated as having the Core directly behind it, dimmed (`--core-light: .7`).

Limits to know:

- Change `--core-x/y/light` only when the screen changes state (empty chat, conversation, thinking), never every frame. They are inherited by the whole page, so each change restyles everything once; with the glide, once per frame for 320 ms.
- Browsers without CSS `atan2()` or `color-mix()` get an even hairline edge instead.
- **Large pages: `CoreUI.light.scope(selector)`.** Because the three variables are inherited, writing them on `<html>` makes the browser recompute the style of every element on the page. On the chat page with 300 messages one such change cost about 68 ms in the test environment, and a 320 ms glide repeats it every frame; it happened on the first keystroke (rest → listening). `CoreUI.light.scope('.side, .box-glass, #sugg')` makes `light.set` write the values only to the named surfaces, to `.core-scene` and to `.core-layers` (menus, tooltips, toasts), and glide them by script. The same change then costs under 5 ms. `<html>` keeps only the place-level values from `core-scene.css` (`[data-core-place]`), so glass that is not in the list still knows where the Core is but not how bright it is. Call `scope` before the scene starts, list every glass surface the page has, and extend the list when a step adds a new one. `scope(null)` returns to `<html>`; `scope()` returns the current selector; `light.get()` works in both modes.

### Fallbacks

- No `backdrop-filter` support, or the system asks to reduce transparency, or `<html data-core-transparency="reduce">`: glass becomes the opaque `--core-solid-*` colours with the same edges and shadows, and the dialog backdrop stops blurring.
- Forced-colours (high contrast) mode: every glass surface shows a system-coloured outline.

### Contract with the scene

The scene (section 12) keeps this contract; a page only adds the container.

- The scene lives in `<div class="core-scene" aria-hidden="true">`, the first child of `<body>`. It is fixed, full-viewport, behind the content, and ignores the pointer. `html.core` paints the scene colour and makes `body` transparent, so nothing else is needed for the scene to show through. If the container is missing, the script creates it.
- The scene writes the Core's position with `CoreUI.light.set`.
- While a dialog is open, `<html>` has the attribute `data-core-focus` and receives the event `core:focus` with `detail.on`. The scene recedes, dims and renders about 12 times a second: the dialog backdrop is a full-viewport blur that is recomputed for every frame the scene paints.
- Step 1's `data-core-heat="think"` is replaced by `data-core-is="thinking"` (the scene sets it).
- The scene takes every colour from tokens: `--core-scene`, `--core-heat-1…5`, `--core-point`, `--core-text-3`.

---

## 6. Components

Every component is shown in every state on the showcase; its source is the reference markup. States use native pseudo-classes and ARIA attributes, so setting the attribute is setting the look:

| State | How |
| --- | --- |
| Hover, pressed, keyboard focus | Automatic. |
| Disabled | `disabled`, or `aria-disabled="true"` on non-form elements. |
| Loading | `aria-busy="true"`. |
| Error | `aria-invalid="true"` on the field. |
| Selected / on | `checked`, `aria-pressed`, `aria-selected`, `aria-checked`, `aria-current`. |

### Buttons

```html
<button class="core-btn core-btn--main">Main action</button>   <!-- one per screen -->
<button class="core-btn">Glass (default)</button>
<button class="core-btn core-btn--quiet">Quiet</button>
<button class="core-btn core-btn--danger">Destructive</button>
<button class="core-btn core-btn--icon core-btn--quiet" aria-label="Copy"><svg>…</svg></button>
```

Sizes: `core-btn--sm` (28), default (36), `core-btn--lg` (44); `core-btn--block` for full width. Works on `<a>` too. Icons are inline `<svg>` 16 px using `currentColor`. A busy button keeps its width, hides its label and shows three points with a running pulse. A disabled main button goes cold: no amber. A glass button placed straight on the scene blurs what is behind it; inside glass it does not.

### Fields

```html
<label class="core-field">
  <span class="core-field__label">Label</span>
  <input class="core-input" type="text" aria-invalid="true" aria-describedby="e1">
  <span class="core-field__error" id="e1">What is wrong</span>   <!-- or core-field__hint -->
</label>

<textarea class="core-input" rows="3"></textarea>
<select class="core-input">…</select>

<div class="core-inputbox" aria-busy="true"><svg>…</svg><input type="search"></div>   <!-- icon, prefix or button inside -->
```

On a desktop pointer `select.core-input` opens a glass list instead of the system one (keyboard: arrows, Home, End, first letter, Enter, Esc). The real `<select>` stays in the page and fires `input` and `change`, so existing code keeps working. Add `data-core-native` to keep the system list. Phones always get the system picker.

### Checkbox, radio, switch

```html
<label class="core-check"><input type="checkbox"><span>Text</span></label>
<label class="core-radio"><input type="radio" name="n"><span>Text</span></label>
<label class="core-switch"><input type="checkbox" role="switch"><span>Text</span></label>
```

The input itself is the drawn control, so `checked`, `indeterminate`, `disabled`, `aria-invalid` just work. The switch knob is a spark: small and dim when off, bright when on, with a quarter turn on the way. A switch without visible text needs `aria-label` on the input.

### Segmented control and tabs

```html
<div class="core-seg" role="radiogroup" aria-label="Period">
  <label class="core-seg__item"><input type="radio" name="p" checked><span>Month</span></label>
  <label class="core-seg__item"><input type="radio" name="p"><span>Year</span></label>
</div>

<div class="core-tabs" role="tablist" aria-label="Account">
  <button class="core-tab" role="tab" id="t1" aria-controls="p1" aria-selected="true">Profile</button>
  <button class="core-tab" role="tab" id="t2" aria-controls="p2" aria-selected="false" tabindex="-1">Plan</button>
</div>
<div class="core-tabpanel" role="tabpanel" id="p1" aria-labelledby="t1">…</div>
<div class="core-tabpanel" role="tabpanel" id="p2" aria-labelledby="t2" hidden>…</div>
```

Segments switch a mode of one screen and are real radio buttons (listen for `change`). Up to six items; the thumb slides. `button.core-seg__item` with `aria-pressed` is also supported. Tabs switch sections; `core-ui.js` handles clicks, arrow keys, Home and End, toggles the panels and fires `core:tab` on the tab.

### Chip, tag, badge

```html
<button class="core-chip" aria-pressed="true">Chip</button>
<span class="core-tag">gpt</span> <span class="core-tag core-tag--ok">ok</span> <span class="core-tag core-tag--heat">thinking</span>
<span class="core-badge">3</span> <span class="core-badge core-badge--dot"></span>
<kbd class="core-kbd">Ctrl K</kbd>
```

A chip is clickable and selectable. A tag only informs, in the machine voice; tones `--ok`, `--warn`, `--bad`; `--heat` is the "AI is working" tag. A badge counts; variants `--quiet`, `--ok`, `--warn`, `--bad`, `--dot`.

### Card and list row

```html
<div class="core-card"><h3 class="core-card__title">…</h3><p class="core-card__text">…</p><span class="core-card__meta">…</span></div>
<button class="core-card core-card--action" aria-pressed="true">…</button>

<ul class="core-list">
  <li><a class="core-row core-row--action" href="…" aria-current="page">
    <svg>…</svg>
    <span class="core-row__body"><span class="core-row__title">Title</span><span class="core-row__sub">Sub</span></span>
    <span class="core-row__trail">14:02</span>
  </a></li>
</ul>
```

### Menu and tooltip

```html
<button class="core-btn" data-core-menu="#m1" aria-haspopup="menu" aria-expanded="false">Actions</button>
<div class="core-menu" id="m1" role="menu" hidden>
  <div class="core-menu__label">Group</div>
  <button class="core-menu__item" role="menuitem" data-value="rename"><svg>…</svg><span>Rename</span><span class="core-menu__hint">F2</span></button>
  <button class="core-menu__item" role="menuitemcheckbox" aria-checked="false"><span>Pin</span></button>
  <hr class="core-menu__sep">
  <button class="core-menu__item core-menu__item--danger" role="menuitem"><span>Delete</span></button>
</div>

<button data-core-tip="Tooltip text" data-core-tip-key="Ctrl K">…</button>
```

- The menu element can sit anywhere; on first open it is moved into a top layer so nothing clips it. Listen on the menu: `menu.addEventListener('core:select', e => e.detail.item / e.detail.value)`, or put ordinary `click` handlers on items.
- `menuitemradio` items inside `role="group"` behave as one choice; `menuitemcheckbox` toggles. `data-core-keep` keeps the menu open after a choice. `data-core-align="end"` and `data-core-side="top"` on the trigger change placement. A long menu wraps its items in `core-menu__scroll`.
- Keyboard: arrows, Home, End, first letter, Enter or Space, Esc (returns focus to the trigger), Tab closes.
- Tooltips appear on hover after 400 ms and at once on keyboard focus, never on touch. Inside `.core`, an ordinary `title` attribute is converted to a Core tooltip the first time the pointer reaches it (the text is kept as `aria-label` when the element has no text). `data-core-native` on the element or an ancestor turns that off.

### Notification toast

```js
CoreUI.toast('Text');
CoreUI.toast({ text: 'Saved', tone: 'ok' });                       // tone: 'ok' | 'warn' | 'bad'
const t = CoreUI.toast({ text: 'Chat deleted', action: { label: 'Undo', onClick() {} }, duration: 8000 });
t.dismiss();
```

The capsule flies out of the Core's position (`--core-x/y`), rests at the top centre, and flies back. Hover or focus pauses the timer; a click dismisses. `duration: 0` keeps it until dismissed. At most three are visible. Errors are announced as alerts to screen readers.

### Dialog

```html
<button class="core-btn" data-core-open="#d1">Open</button>

<div class="core-dialog" id="d1" hidden>
  <div class="core-dialog__pane" role="dialog" aria-modal="true" aria-labelledby="d1t">
    <div class="core-dialog__head">
      <h2 class="core-dialog__title" id="d1t">Title</h2>
      <button class="core-btn core-btn--icon core-btn--quiet" data-core-close aria-label="…"><svg>…</svg></button>
    </div>
    <div class="core-dialog__body">…</div>
    <div class="core-dialog__foot">
      <button class="core-btn core-btn--quiet" data-core-close>Cancel</button>
      <button class="core-btn core-btn--main" data-core-close="saved">Save</button>
    </div>
  </div>
</div>
```

```js
CoreUI.dialog.open('#d1', { origin: event });   // origin: an event, an element or {x, y}; optional
CoreUI.dialog.close('#d1', 'value');            // returns a promise
el.addEventListener('core:close', e => e.detail.value);
el.addEventListener('core:beforeclose', e => e.preventDefault());   // veto
```

- The pane is born from the click point (keyboard: from the focused control) and collapses back to it; a spark flashes there.
- Esc and a click on the backdrop close it; `data-core-static` on the shell disables both. Focus moves into the window, stays inside (the rest of the page is made `inert`), and returns to the opener. The page behind does not scroll. Dialogs can stack.
- Widths: `core-dialog--sm` 400, default 520, `core-dialog--lg` 720. Up to 600 px wide the dialog becomes a sheet from the bottom with stacked full-width buttons.
- Place the shell as a direct child of `<body>`. Use `autofocus` to choose the first focused control.

### Confirmation capsule (replaces `confirm`, `alert`, `prompt`)

```js
if (!(await CoreUI.confirm('Delete this chat?'))) return;
if (!(await CoreUI.confirm({ text: 'Delete this chat?', ok: 'Delete', danger: true }))) return;
const name = await CoreUI.prompt({ text: 'New name', value: current });   // string, or null if cancelled
await CoreUI.alert('The file is too large.');
```

A small near-glass capsule appears next to the pointer (or the focused control), modal, without dimming the page. Enter confirms, Esc and a click elsewhere cancel. With `danger: true` the confirm button is destructive and Cancel has focus. Options: `text`, `ok`, `cancel`, `danger`, `main`, `value`, `placeholder`, `type`, `at`.

Two things to know when replacing the ~35 native calls:

- The native functions block; these return promises. The calling function becomes `async` and the call gets `await`. Check each call site for code that relied on blocking.
- Default button labels are «ОК» / «Отмена» when `<html lang>` starts with `ru`, otherwise "OK" / "Cancel": the labels the browser shows in its own boxes today. Pass `ok` / `cancel` to use product wording.

### Limit ring

```html
<span class="core-ring" role="meter" aria-label="…" aria-valuemin="0" aria-valuemax="100" aria-valuenow="62" style="--core-ring-v:.62"></span>
<span class="core-limit"><span class="core-ring core-ring--sm" …></span><span><b>62</b>/100</span></span>
```

`--core-ring-v` is the remaining share, 0 to 1. The ring shortens and the small core cools from glow to ember as the limit is spent; at `aria-valuenow="0"` it is ash. Sizes: `--sm` 20, default 28, `--lg` 48. Changing the value animates.

### Loading

```html
<div class="core-gather" role="status" aria-busy="true" aria-label="…">
  <span class="core-gather__line"></span>
  <span class="core-gather__line" style="--w:70%"></span>
  <span class="core-gather__block" style="--h:120px"></span>
  <span class="core-gather__dot" style="--w:36px"></span>
</div>
```

Points gather into the shape of the content that is coming, then breathe slowly. Build the shape from lines (text), blocks (images, cards) and dots (avatars) with `--w` and `--h`. Use this instead of spinners and grey bars. Buttons, input boxes and switches have their own busy state.

### Table, divider, avatar

```html
<div class="core-table-wrap"><table class="core-table">
  <thead><tr><th>Key</th><th class="core-num">Requests</th></tr></thead>
  <tbody><tr aria-selected="true"><td>…</td><td class="core-num">12 480</td></tr></tbody>
</table></div>

<hr class="core-divider">  <span class="core-divider core-divider--v"></span>  <div class="core-divider core-divider--label">or</div>
<span class="core-avatar">AK</span>  <span class="core-avatar core-avatar--lg"><img src="…" alt="…"></span>
```

`core-num` cells are machine voice, right-aligned, tabular.

### Code block

```html
<div class="core-code">
  <div class="core-code__head"><span class="core-code__name">server.js</span><span>javascript</span><button class="core-btn core-btn--icon core-btn--quiet core-btn--sm" aria-label="…">…</button></div>
  <pre><code>…</code></pre>
</div>
```

Dense glass, machine voice, no ligatures. The header is optional. highlight.js classes (`hljs-keyword`, `hljs-string`, …) are already mapped to `--core-syn-*`; `core-syn-*` classes do the same by hand. The palette and the mapping are described in 14.4; the chat's own code blocks (`.pre`, built by scripts) are styled in `core-work.css` with the same tokens. In the light theme the block is the densest paper, not a dark slab: the light theme is ink on paper throughout.

### Text helpers

`.core-prose` styles long reading text (paragraphs, headings, lists, quotes, inline code, links). `.core-link` is a link outside prose. `.core-text-2`, `.core-text-3` set text levels. `.core-sr` hides text visually but keeps it for screen readers.

---

## 7. Small details

All apply inside `.core`.

- **Selection:** neutral light (`--core-select`), not amber.
- **Focus ring:** 2 px `--core-focus`, offset 2 px. One rule deliberately out-ranks the old `!important` rule in `public/tokens.css`, so pages in transition already show the new ring.
- **Placeholder:** `--core-text-3`.
- **Caret:** amber (`--core-caret`). One token to change if this exception is not wanted.
- **Links:** text colour with a thin underline that brightens on hover. No amber, no visited colour.
- **Scrollbars:** a thin light thread with no track, brighter on hover. Desktop pointers only; phones keep system scrollbars.

---

## 8. Cursor

Three forms, drawn by the browser's own `cursor` property, so there is no script, no lag and no trail:

| Form | Token | Where | System fallback |
| --- | --- | --- | --- |
| Spark | `--core-cursor` | Default. | `default` |
| The same spark turned 45° | `--core-cursor-action` | Anything clickable. | `pointer` |
| Thin vertical bar | `--core-cursor-text` | Text that can be selected or edited. | `text` |

- 32 × 32 px image, figure about 16 px, hotspot exactly at the centre (16, 16).
- One solid colour that follows the surface, like text does: warm white on dark glass, ink on paper. On the incandescent main button the spark is ink (`--core-cursor-action-on-heat`), because white on amber would vanish.
- System cursors stay for everything without a branded form: `not-allowed` on disabled controls, `progress` on busy ones, and whatever a page sets for resizing, dragging and waiting.
- The rules exist only under `@media (any-pointer: fine)`. Touch devices get no cursor rules at all.
- Inside an `<iframe>` (the live preview) the embedded document controls the cursor.

How elements get a form:

- `core-base.css` assigns the forms to standard elements: links, buttons, form controls and ARIA roles get the action form; paragraphs, headings, list items, table cells, code and fields get the bar. These rules have zero specificity, so any explicit `cursor` in a page's own CSS wins.
- For a custom clickable element add the class `core-click`; for custom selectable text, `core-selectable`.
- Old CSS full of `cursor: pointer` keeps showing the system hand until it is migrated. When restyling a component, replace `cursor: pointer` with `cursor: var(--core-cursor-action)`. Step 8 should search for leftovers.

---

## 9. `CoreUI` reference

| Call | Does |
| --- | --- |
| `CoreUI.dialog.open(target, { origin })`, `.close(target, value)`, `.top()` | Dialogs. |
| `CoreUI.menu.open(target, anchor, { side, align })`, `.close(refocus)` | Menus. `anchor` is an element or `{x, y}`. |
| `CoreUI.tip.show(element, text, key)`, `.hide()` | Tooltip by hand. |
| `CoreUI.toast(textOrOptions)` → `{ el, dismiss }` | Notification. |
| `CoreUI.confirm(o)`, `.alert(o)`, `.prompt(o)` → promise | Confirmation capsule. |
| `CoreUI.tabs.select(tab)` | Select a tab from code. |
| `CoreUI.light.set({ x, y, light }, smooth)`, `.get()`, `.scope(selector)` | The Core's light; `scope` limits where it is written (section 5). |
| `CoreUI.origin(eventOrElement)` | Point a surface is born from. |
| `Core.*` | The scene: section 12. |

Attributes: `data-core-open`, `data-core-close`, `data-core-static`, `data-core-menu`, `data-core-align`, `data-core-side`, `data-core-keep`, `data-core-tip`, `data-core-tip-key`, `data-core-tip-side`, `data-core-native`, `data-core-at`.
On `<html>`: `data-theme`, `data-core-motion="reduce"`, `data-core-transparency="reduce"`, `data-core-focus` (set by the script); scene: `data-core-scene`, `data-core-is`, `data-core-place`, `data-core-model`, `data-core-form`, `data-core-quality` (section 12).
Events: `core:open`, `core:beforeclose`, `core:close`, `core:select`, `core:tab`, `core:focus`, `core:scene`.

Everything is event delegation on `document`. Markup added later, including HTML built from strings, works without any init call. The script creates one element, `div.core-layers`, at the end of `<body>` for floating surfaces.

---

## 10. Applying the system to an existing page

Work on one screen at a time. The product must keep working after each step.

1. **Link the files** after the page's old stylesheets, with `?v=`, and add `class="core"` to `<html>`. In the RU page and its `public/en` mirror alike.
2. **Check what changed by itself:** page background and text colour, font, scrollbars, selection, focus ring, the default cursor. Old components keep their old look, because old rules are more specific than Core's element defaults.
3. **Add the scene**: the container (`core-scene`) as the first child of `<body>`, `core-scene.css`, `core-scene.js`, and the screen's place and state on `<html>` (section 12.9).
4. **Replace surfaces by role** using the depth table. Remove old backgrounds, borders, shadows and radii from the element and give it the glass class. Tell fixed chrome where it is (`data-core-at`).
5. **Replace components** with the Core markup above. Keep existing `id`s, `name`s, texts and handlers. Most product code toggles classes on existing elements, so often only class names and wrapper markup change.
6. **Replace values** in whatever CSS remains: colours, sizes, radii, spacing, durations become tokens. A leftover hex colour, pixel font size or `ms` duration in migrated CSS is a defect.
7. **Dialogs:** wrap the content in `core-dialog` / `core-dialog__pane` and open it with `CoreUI.dialog.open(el, { origin: event })` where the old code added an "open" class.
8. **Native boxes:** replace `confirm` / `alert` / `prompt` (section 6). Replace `title` tooltips only where the automatic conversion is not enough.
9. **Remove** the page's use of old tokens (`--p-*`) and old stylesheets once nothing on it needs them. Do not delete shared old files before step 8.
10. **Verify** at 1440 and 390 px, both themes, keyboard only, reduced motion, and with the Core at its brightest behind text. Run `npm test`.

Things that bite:

- Old stylesheets set `cursor: pointer`, `outline`, `z-index` up to four digits and `transition` on many elements. Floating Core surfaces sit at z-index 2000+.
- `backdrop-filter`, `transform`, `filter` and `contain` on an ancestor change how `position: fixed` children are placed. Keep dialogs as direct children of `<body>`.
- Do not add `backdrop-filter` in page CSS. Use the glass classes so the "never nested" rule holds.
- Do not write new interface texts. Components never contain text of their own, except the two default capsule labels described above.
- Existing tests read some pages and `public/tokens.css` as text. Run `npm test` after every page.
- `npm test` runs only `tests/*.test.js`. The older folder `test/` holds more checks that read pages as text (stylesheet links, the exact `<html lang>` tag) and nothing runs them automatically. After moving a page, run the files there that mention it, one by one (`node --test test/team.test.js`); the whole folder at once may hang. Step 3 found and rewrote two such checks this way.
- The service worker (`public/sw.js`) caches only the folders listed in its `STATIC` pattern. Step 3 added `core` and `css` to it, so the installed app caches the Core files and the bridge stylesheet. The cache is keyed by the full address, so `?v=` still decides when a file is refetched.
- `public/en` is **not** reproducible by `scripts/build-i18n.py` at the moment (13.1). Do not run the generator until its catalogue is repaired.

---

## 11. Browser support and what has not been verified

Written for current Chrome, Edge, Yandex Browser, Safari and Firefox.

| Feature | Without it |
| --- | --- |
| `backdrop-filter` | Opaque glass. |
| `color-mix()`, CSS `atan2()` (2023) | Even hairline edge; fills still work. |
| `:has()` | Segmented thumb does not slide; the selected item is highlighted in place. |
| `@property` | The Core's light and the ring change without gliding. |
| `inert` | A scripted focus trap takes over. |
| `@container` (2023) | The result window's header always takes two rows (14.2). |
| SVG cursors | System cursors. |

Checked in Chrome only, without a GPU (see the change note for the list). Not checked on real hardware or in other browsers:

- The cursor on high-density screens and outside Chrome. In a real Chrome window at normal density the three forms, both colours and the hotspot were captured and measured (the figure's centre lands within half a pixel of the pointer position). A Safari-only block serves a double-size drawing to older Safari on Retina; it is untested.
- Scrolling smoothness. Software rendering says nothing about a real GPU. The design limits the cost (no nested blur, one blur layer per dialog, few glass surfaces on screen at once) but it needs a look on an ordinary laptop and a phone, especially with the real 3D scene behind.
- Safari and Firefox rendering in general, the glass select list outside Chrome, and screen-reader behaviour.

---

## 12. The Core (step 2)

The Core is one 3D object behind the whole interface: a cloud of several thousand points with real depth. It turns slowly, breathes, and shows what the AI does. In the dark theme the points are light: ember at the edges, hotter toward the centre, white-hot when the model thinks. In the light theme they are ink on paper: black stipple of different dot sizes, and the only colour, a burnt vermilion, appears when the AI works. The two themes use different drawing rules (light adds up; ink multiplies), not an inverted picture.

Live demo with every control: `/core/showcase.html`, section "Ядро". The showcase drives the Core only through the commands below.

### 12.1 Put it on a page

```html
<html lang="ru" class="core" data-core-place="horizon" data-core-is="rest" data-core-model="GPT-5">
...
<link rel="stylesheet" href="/core/core-scene.css?v=1">
<script defer src="/core/core-ui.js?v=1"></script>
<script defer src="/core/core-scene.js?v=1"></script>
...
<body><div class="core-scene" aria-hidden="true"></div>
```

- The three `data-core-*` attributes are optional. They set the first picture without script, and they place the light on glass edges correctly from the first paint. Defaults: `center`, `rest`, form `sphere`.
- The file only declares the commands when it loads. The scene itself starts after the page `load` event, in idle time, and only when the tab is visible. Commands sent earlier are not lost: they decide how the scene first appears. The canvas then fades in over 0.9 s.
- Nothing else is needed. The script creates the canvas, follows the theme, reduced motion, tab visibility and dialogs by itself.

### 12.2 Commands

One global object, `Core`. Every command returns `Core`, so calls can be chained. Unknown names are ignored.

| Command | Does |
| --- | --- |
| `Core.state(name, { target, ax, ay, hold })` | Sets the state (12.3). `hold` (ms): return to the previous state after that time. Without arguments: returns the current state. |
| `Core.pulse(kind)` | One-shot event: `'flash'`, `'error'`, `'key'` (12.3). |
| `Core.model(name)` | Takes the form of that AI model (12.4). Call it when the user picks a model. |
| `Core.form(id)` | Takes a form by its id, for screens without a model. |
| `Core.place(name)` or `Core.place({ x, y, size })` | Moves the Core (12.5). |
| `Core.target(elementOrPoint, { ax, ay })` | Where points lean and flow (12.6). `null` clears it. |
| `Core.stage({ left, right, top, bottom })` | The part of the window that is the page's stage, as insets in px (12.5). Without arguments: returns the current insets. |
| `Core.set({ state, hold, target, ax, ay, model, form, place })` | Several of the above in one call. |
| `Core.quality(level)` | `'auto'` (default), `'high'`, `'mid'`, `'low'`, `'min'` (12.10). For the showcase and for a user setting, not for pages. |
| `Core.info()` | `{ mode, reason, state, shown, place, form, model, quality, auto, points, width, height, fps, ms, still, slow }`. |
| `Core.formOf(name)` | `{ form, variant }` that a model name gives, without changing anything. |
| `Core.mini.scan(root)`, `Core.mini.refresh()` | Mini cores (12.7). Normally not needed. |
| `Core.states`, `Core.pulses`, `Core.forms`, `Core.places`, `Core.qualities` | Lists of valid names. |
| `Core.test.lose()`, `.restore()`, `.glow(on)` | For the showcase and checks: lose and restore the graphics context, force the fallback glow. |

Event: `core:scene` on `<html>`, `detail.type` is `ready`, `mode`, `state` or `quality`; the rest of `detail` is `Core.info()`.

The scene keeps three attributes on `<html>` up to date, for CSS: `data-core-scene` = `boot` (not started), `live` (3D) or `glow` (fallback); `data-core-is` = the state shown now; `data-core-place` = the place shown now (`custom` for a point).

### 12.3 States

A state is a set of targets for a dozen smooth values (size, heat, rotation speed and so on). Every value moves on its own spring, so a change from any state to any other, also in the middle of another change, has no jump. A change takes about 1 to 1.5 s.

| State | What the user sees | Use it when | Frames per second |
| --- | --- | --- | --- |
| `rest` | Slow rotation (one turn in 90 s), breathing, a slow inner flow. | Nothing happens. | 30 |
| `listening` | The side of the cloud that faces the target reaches toward it; each `Core.pulse('key')` adds a small throb. | The user types. | 60 |
| `thinking` | The form contracts into a dense ball, turns five times faster, narrow bright bands run across it, colour heats toward white. | The request is sent, no text yet. | 60 |
| `answering` | About one point in seven leaves the cloud, flies along an arc to the target and fades there. | Text streams in. | 60 |
| `receded` | Smaller, dim, slow. | Set automatically while a dialog is open (with place `far`). Rarely set by hand. | 12 |
| `still` | Dim and motionless. After it settles, the loop stops: zero work. | Work-heavy screens: admin panel, tables. | 0 |

One-shot events do not change the state:

| Pulse | What the user sees | Length |
| --- | --- | --- |
| `flash` | One short hot pulse; glass edges brighten with it. | 0.7 s |
| `error` | The cloud scatters, cools, and gathers again. | 1.3 s |
| `key` | "The user typed": switches `rest` to `listening` and returns to `rest` 1.5 s after the last key. It does not interrupt `thinking` or `answering`. | — |

`Core.state('error')` and `Core.state('flash')` do the same as the pulses.

A chat page needs four lines:

```js
input.addEventListener('input', () => Core.target(input).pulse('key'));
onSend(() => Core.state('thinking'));
onFirstToken((messageEl) => Core.set({ state: 'answering', target: messageEl, ax: 0.1, ay: 1 }));
onDone(() => Core.state('rest'));          // onFail: Core.state('rest').pulse('error')
```

### 12.4 Forms and models

Eleven forms: `sphere`, `torus`, `spiral`, `lattice`, `helix`, `knot`, `bloom`, `orbits`, `ribbon`, `vortex`, `crystal`. A change of form flows for 1.9 s: each point has its place in both forms and its own delay, so the cloud pours from one into the other.

`Core.model(name)` derives the form from the model's display name. No list of models exists in the code:

- The **family** (which of the eleven) comes from the first word of the name: `gpt`, `claude`, `gemini`. Models of one lineage look related.
- The **variant** (four numbers: proportions, number of arms, petals, rings, turns, tilt) comes from the whole name. `Claude Opus 4.5` and `Claude Sonnet 4.5` are both knots, but different knots.
- Case, spaces and punctuation do not matter: `GPT-5`, `gpt 5` and `gpt-5` are one model. Any alphabet works.
- The same name gives the same cloud on every device, always. Renaming a model changes its form.

Do not reorder `FORM_IDS` in `core-scene.js` and do not change the hash: both would give every existing model another form. A test pins eleven known names. To add a twelfth form later, append it and reach it by `Core.form(id)` only.

### 12.5 Places

The Core travels between places in one continuous motion of about 1.2 s (position and size together, soft start and soft stop).

| Place | Geometry | Screen |
| --- | --- | --- |
| `center` | Centre at 50 % / 46 %, radius 30 % of the smaller side (110 to 330 px). | Empty chat. |
| `horizon` | Centre below the bottom edge; only a cap 120 to 230 px high (24 % of the height) rises above it. The reading area stays empty. When the Core contracts (`thinking`), it keeps its top edge, so the hot ball stays in view. | Conversation, behind the input field. |
| `full` | Radius 56 % of the screen diagonal: the cloud covers the corners. Calmer: 55 % brightness. | Login. |
| `far` | Centre of the screen, radius 19 % of the smaller side. | Set automatically under a dialog. |
| `{ x, y, size }` | `x`, `y` in percent of the viewport; `size` is the radius as a share of the smaller side (default 0.3). | Anything else. |

**Stage (step 3).** `center` and `horizon` are computed inside the stage: `Core.stage({ left: 272 })` tells the scene that the left 272 px belong to a sidebar, and the Core centres itself on the rest. The horizon's radius follows the stage width too. `full` and `far` always use the whole window (a dialog is centred in the window). A stage change is a normal move: the Core glides there and the light follows. The chat page sets the stage from the bounding box of `.main`, so the sidebar, its collapsed state and the result window are all followed without further code (13.4). The default target of `listening` and `answering` is the stage's centre line.

### 12.6 Targets

`listening` leans toward the target; `answering` sends the stream to it. A target is an element or a point in viewport pixels. For an element the scene reads its position at most five times a second and glides between readings, so a growing message is followed without work on the page side. `ax`, `ay` choose the point inside the element (0 to 1, default 0.5 / 0.5; values outside are allowed). Without a target: `listening` aims at the bottom centre of the screen, `answering` at 60 % of the height.

Give the stream a short way. In a conversation the Core is at the horizon and the newest text is just above the input field. Do not aim the stream at the top of a long text: it would cross the reading area.

### 12.7 Mini cores

Small cores for lists: the model menu, the status page, the limit ring. They are drawn on ordinary 2D canvases, not by the graphics card, so a page can hold any number of them (browsers allow only a few WebGL contexts per page). They use the same form generator as the big Core, with 60 to 170 points.

```html
<span class="core-mini" data-core-model="Claude Opus 4.5"></span>
<span class="core-mini core-mini--lg" data-core-model="GPT-5" data-core-cond="flicker"></span>
<span class="core-mini" data-core-form="torus" data-core-cond="dark"></span>
```

- Sizes: `core-mini--sm` 16, default 20, `core-mini--lg` 28, `core-mini--xl` 48 px.
- `data-core-cond`: `steady` (default: lit, turns slowly), `flicker` (dimmer, cooler, flickers; for a model with failures), `dark` (ash, motionless; for a model that is down). The three differ in brightness and density, not only in motion, so they stay distinct under reduced motion. Always put the status in words next to it.
- Change the attributes at any time; the mini core follows.
- They are found automatically, also in markup added later or built from strings. `Core.mini.scan(root)` exists for the rare case of a user stylesheet that disables animations (discovery uses an empty CSS animation as a marker).
- A mini core is decoration: it gets `aria-hidden="true"` unless you give it an `aria-label`.
- Only visible mini cores are drawn, 15 times a second; none when the tab is hidden.
- **Limit ring.** Every `.core-ring` gets a mini core inside automatically, in place of the drawn dot. It cools from glow to ember with `aria-valuenow`, and is ash at 0. Add `data-core-model` to the ring to give it the model's form.

### 12.8 Light on glass

The scene drives step 1's mechanism (`--core-x`, `--core-y`, `--core-light`) from the Core's real position, so the lit edges of all glass follow it:

- On a change of place the light glides (320 ms) in the middle of the Core's travel. Values are clamped to −10…110 (x) and −10…112 (y): at the horizon the light comes from below the screen edge.
- Light strength by state: `rest` 1, `listening` 1.05, `thinking` 1.2, `answering` 1.1, `still` 0.85. A `flash` adds 0.25 for a third of a second.
- The light changes only with place and state, never per frame (the rule of section 5).
- While a dialog is open the page light is left alone. Step 1 already treats the dialog pane as having the Core right behind it.
- Do not call `CoreUI.light.set` on a page that runs the scene.
- A page with a large DOM limits where the light is written with `CoreUI.light.scope(...)` (section 5). The scene needs no change for that: it keeps calling `CoreUI.light.set`.

### 12.9 Motion timing

The Core is the scene, not a control. Rule 8 (nothing longer than 320 ms) is for interface components and does not apply to it: a large object that crossed the screen in a third of a second would be violent. The Core's times are 0.7 to 1.9 s and are set in `core-scene.js`. The CSS side (canvas fade-in, fallback glow) uses two tokens of its own, `--core-scene-in` and `--core-scene-move`. Reduced motion switches all of it off.

Pointer: points near the cursor lean toward it by at most 6 px, and a click sends one ripple through the cloud. Mouse and pen only. It is meant to be noticed on the second day; do not strengthen it.

### 12.10 Readability: the brightness limit

Text never sits on the bare scene where the Core can pass (rule 5); it sits on glass. The Core is limited so that **every text level, including `--core-text-3`, keeps at least 4.5:1 on every glass depth at the brightest moment of the brightest state, in both themes**. This is stricter than section 3 rule 5, which promised `text-3` at rest only.

How it holds for any form, model, place, screen size and quality level: before a state begins, the scene estimates the densest spot of the cloud as it will look on screen (form, contraction, heat, depth, eight view angles, four sizes of the glass blur spot) and divides the brightness of every point by that estimate. Light per unit of area is therefore the same everywhere, and the constants `A_DARK`, `A_PAPER`, `FLASH` in `core-scene.js` set it once.

The strictest case is `text-3` on near glass (menus, tooltips) in the dark theme: it has 4.95:1 with nothing behind it, so the blurred Core behind a menu may add only a little light. This is why the Core is fine luminous dust and not a bright blob, and why white-hot is a colour here, not a floodlight. Consequences to know:

- If you raise `A_DARK`, `A_PAPER`, `FLASH`, a state's `bright`, or the aura constants, run the measuring test (below). Do not judge by eye.
- If the glass tokens change (fill, blur, `--core-bright-*`), run it too: the limit is computed against them.
- Measured lowest contrast over all forms, states and places: 4.56:1 in the dark theme, 4.95:1 in the light theme (details in the step 2 change note).

`tests/core-scene.test.js` contains this measurement: it renders real frames and applies the glass model of step 1 (blur, `saturate`, `contrast`, `brightness`, fill, sheen). It needs a WebGL implementation for Node and is skipped without it: `npm i --no-save gl`, then `node --test tests/core-scene.test.js`.

### 12.11 Performance and resilience

| Level | Points | Pixel density, up to | Canvas, up to | Frames per second: active / rest |
| --- | --- | --- | --- | --- |
| `high` | 14 000 | 2 | 4.4 MP | 60 / 30 |
| `mid` | 8 000 | 1.5 | 2.4 MP | 60 / 30 |
| `low` | 4 200 | 1 | 1.3 MP | 60 / 30 |
| `min` | 2 200 | 0.75 | 0.6 MP | 30 / 15, no aura |

- **Start level** from the device: desktop `high`; touch or small screens `mid`; 4 GB of memory or 4 processor cores or fewer, one level lower; 2 GB or "save data", `low`.
- **Self-measurement.** The scene times its own frames. When 20 of 50 frames are late it steps one level down. If `min` is still too slow it keeps a single still frame (`info().slow`). The result is remembered for a day (`localStorage`, key `core-q`), then one level higher is tried again. Fewer points look the same in brightness: points get larger and brighter to compensate.
- **Cost per frame.** One draw call for the points and one for the aura. All motion is computed in the vertex shader; the script sends about twenty numbers per frame. No per-frame layout reads, no per-frame style changes.
- **Draws as little as possible.** 30 frames a second at rest, 60 only while something changes; 12 under a dialog; none in `still`, with reduced motion, or in a hidden tab. Screens of 90 to 240 Hz are not followed above about 90.
- **Context loss.** The scene shows the fallback glow, rebuilds everything when the browser returns the context, and comes back.
- **No 3D.** No WebGL, a software-only WebGL (`failIfMajorPerformanceCaveat`), or a shader failure: `data-core-scene="glow"`, the quiet glow from step 1 drawn by CSS, at the same brightness limit. All commands keep working: the glow follows place and state, the light follows too. If the script never runs, CSS shows the glow by itself after four seconds.
- **Reduced motion** (system setting or `data-core-motion="reduce"`): one still frame per state. State and place changes apply at once; pulses are skipped.
- **Weight.** `core-scene.js` is 75 KB (26 KB gzipped), `core-scene.css` 8 KB. No library. A test fails above 90 KB.

### 12.12 Limits and what has not been verified

- Checked by rendering the real engine through a WebGL context in Node (ANGLE): every state, form, place, both themes, 1440 and 390 px wide, the brightness limit. Checked in Chrome without WebGL: the fallback, the control panel, mini cores, light on edges, reduced motion, a slowed processor.
- **Not checked: a real browser with a real graphics card.** Frame rates on real hardware, real context loss, the look of the Core through `backdrop-filter` glass, Safari, Firefox, a real phone. Look at the showcase on an ordinary laptop and a cheap phone before step 3.
- The stream of `answering` is thin by design; with a far target it is faint.
- Points are square sprites of 1.5 to about 12 px; on `min` the canvas is stretched and the dust is softer.
- Mini cores below 16 px lose their form; do not go smaller.
- The form of a model follows its name, not its id: a renamed model changes form.

Showcase address parameters, for checks: `theme=dark|light`, `motion=reduce`, `transparency=reduce`, `state=`, `place=`, `form=`, `model=`, `quality=`.

---

## 13. The chat screen (step 3)

`public/chat.html` is the reference for every later product page: how a page loads the system, keeps its script hooks, drives the Core and stays fast. Checked by `tests/core-chat.test.js`.

### 13.1 What the page loads

```html
<html lang="ru" class="core" data-core-place="center" data-core-is="rest">
<link rel="stylesheet" href="/tokens.css?v=3">                 <!-- old tokens: the bridge below still uses --p-* -->
<link rel="stylesheet" href="/css/chat-legacy.css?v=2">        <!-- old look of parts not migrated yet (13.2) -->
<link rel="stylesheet" href="/core/core-tokens.css?v=2"> … core-base, core-components (v=2), core-scene …
<link rel="stylesheet" href="/core/core-chat.css?v=1">
<link rel="stylesheet" href="/core/core-work.css?v=1">        <!-- step 4, section 14 -->
<script defer src="/core/core-ui.js?v=1"></script><script defer src="/core/core-scene.js?v=1"></script>
…
<body><div class="core-scene" aria-hidden="true"></div>
…chat scripts 00…22 as before (not deferred)…
<script defer src="/js/23-core-chat.js?v=2"></script>          <!-- deferred, so it runs after the two Core scripts -->
<script defer src="/js/24-core-work.js?v=1"></script>          <!-- step 4 glue, last -->
```

- The chat page no longer loads `css/chat-main.css`, `language.css`, `theme/*.css`, `growth.css`, `limits.css`, `chat-ui.css`, `ultra.css`, `anim.css`, `chat-visual.css` or an inline `<style>`. The files stay on disk until step 8; other pages still use some of them.
- The Core files have `?v=` on this page (the showcase loads them without a version). Raise the number in `chat.html` **and** `en/chat.html` whenever one of them changes. Step 4 raised `core-tokens.css`, `core-components.css` and `chat-legacy.css` to 2.
- **English mirror.** The brief for the redesign says `public/en` is generated by `scripts/build-i18n.py`. In the archive this is not true any more: running the generator rewrites 19 English files and replaces finished translations with half-translated text, because `locales/en.json` is far behind the hand-finished English files (and `en/chat.html` used an older stylesheet, `css/chat-main-en.css`). Step 3 therefore did **not** run the generator. `en/chat.html` received exactly the same structural edits as `chat.html`, applied by one script to both files. The new script `23-core-chat.js` and the two changed scripts (`15-growth.js`, `19-limits.js`) have no English copies: the English page loads them from `/js/`, like `15`…`22` before. Until the catalogue is repaired, mirror every edit of a Russian page or of `js/00…14` in `public/en` by hand, and do not run the generator. One line of the generator was fixed in step 3 so that it is safe to run once repaired: it switched the page language by replacing the exact string `<html lang="ru">`, which a Core page no longer has (its `<html>` carries `class="core"` and `data-core-*`); it now replaces the start of the tag, as `server.js` does. Tests that look for the tag must allow attributes too (`/<html lang="en"[ >]/`).

### 13.2 The bridge: `chat-legacy.css`

Old rules for migrated and not-yet-migrated parts were mixed in nine files. `scripts/build-chat-legacy.py` reads those files in their old order and keeps only the rules of parts that still have the old look: dialogs, the model menu, tooltips, toasts (step 5). The parts of step 4 left the bridge (14.7).

- `DROP` in the script is the list of selector heads that `core-chat.css` now owns. A step that migrates a part adds its selectors to `DROP`, runs the script, and raises `?v=` of `chat-legacy.css` in both pages. When nothing is left, delete the file and the script (step 8).
- `KEEP` protects rules that start with a migrated name but style an old part (`.brow .menu`). `CLAIM` (step 4) is the opposite list: a selector that mentions one of its classes anywhere is dropped. `REWRITE` is empty since step 4 (it narrowed one rule that styled both inline code and code blocks).
- `SCOPE`: old parts used to inherit font and colour from `<body>`. `<body>` now belongs to Core, so the roots of old parts get those two properties explicitly. Add a root here if an old part looks wrong after a change of `<body>` styles.
- `cursor:pointer` becomes `cursor:var(--core-cursor-action)` in the output, so the spark cursor covers the whole page.
- `python3 scripts/build-chat-legacy.py --check` fails when the file is out of date; `npm test` runs it.
- Verified by comparing computed styles of every element of the old parts between the step 2 build and this build (code block, thinking row, work log, result card and window, model menu, account, plans, project and limits dialogs, toast, computer popover; both themes; 1440 and 390): no differences except the shared icon button `.ib`, which is new everywhere, and the focus ring.

Old parts (since step 4: only dialogs, the model menu and the toast) sit on the new scene and stay readable because they bring their own opaque backgrounds. Three seams are handled in `core-chat.css`: the model menu opens from the right edge of its button; a closed model menu is `visibility:hidden` (its items used to stay in the Tab order); `[hidden]` is enforced for the page.

### 13.3 Surfaces of the screen

| Region | Hook | Surface | Blur |
| --- | --- | --- | --- |
| Sidebar | `.side.core-glass.core-glass--far`, `data-core-at="left"` | Far glass, floating 8 px from the window edge, radius `md`, rows radius `sm`. | Only as the phone drawer. On desktop the Core never passes behind it, so `backdrop-filter` is off: the fill, edge and shadow are the material. |
| Top bar | `.top` | None: title and share button lie on the reading surface. | No |
| Reading area | `.chat` › `.col` | In a conversation it is painted with `--core-scene`: an opaque veil. The Core is at the horizon and shows only behind and below the input field. | No |
| Captions | `.dock-meta` (`#gwBar`, `#ulHint`, `.note`) | One quiet line above the field: limit ring and sentence on the left, disclaimer on the right. | No |
| Input field | `form.box` + `.box-glass.core-glass` | Mid glass, radius `lg`, 8 px padding, controls radius `md`. | Yes: the one blurred layer of a conversation. |
| Suggestions | `#sugg.core-glass.core-glass--far` | One far-glass shelf under the field holding the category chips and the four suggestion cells. | Yes, empty chat only. |
| Question | `.bub` | A plate: `--chat-plate` fill, hairline, edge lit from below. | No (it lies on the veil). |
| Answer | `.md` | Plain text on the reading surface. | No |
| "+" menu | `#toolsMenu.core-menu` | Near glass, a normal Core menu. | Yes, while open. |

Blurred layers on screen: one in a conversation, two in an empty chat, plus one while a menu is open.

**Text on the scene.** Rule 5 says text needs glass wherever the Core can pass. The chat keeps the rule in another way: the Core is kept away from the text.

- Conversation: `.top` and `.chat` have the scene colour as background. `.dock::after` continues it down to the top edge of the field and fades out inside the field's height, so the light begins exactly where the glass begins. `.top::after` and `.dock::before` are 20 px gradients that let text slide under the bar and the field without a hard line. `--dock-meta` (set by the script) is the height of the caption line.
- Empty chat: there is no veil, the Core is large behind the greeting. `.hello::before` is a blurred slab of the scene colour behind the greeting and `.main.empty .dock-meta::before` a second one behind the caption line. They have no edge and are not glass; they only keep points from showing through small text.
- The veil fades in and out with `--core-scene-move` while the Core travels, so the Core does not vanish abruptly when the first message is sent.
- Measured on real frames (Chrome, the real WebGL scene, quality `high`; states rest, listening, thinking, answering, flash; both themes; 1440 and 390): the lowest contrast of any text against the **worst single pixel** behind it is 5.76:1 in the dark theme (the placeholder on the field's glass while the model thinks) and 4.89:1 in the light theme (`--core-text-3` captions on paper in the empty chat; the same text has 5.01:1 with nothing behind it). Answer text has 17.2:1 and 15.1:1. Old parts (code, result cards, dialogs) were not measured: they bring their own opaque backgrounds.

Never put a new text element in `.dock` below the top edge of the field, or in the empty chat outside the two slabs, without glass.

### 13.4 How the page drives the Core

All of it is in `public/js/23-core-chat.js`. The script changes no chat logic: it watches the rendered page (`MutationObserver` on `#col`, on the classes of `.main` and `#send`, on `#mname`) and reads the shared state (`cur()`, `liveMap`, `curModel()`).

| What happens | How it is detected | Command |
| --- | --- | --- |
| Empty chat / conversation | `.main` has / lacks class `empty` | centre place / `Core.place('horizon')` |
| The user types | `input` on `#q` | `Core.target(q)` (only at rest) and `Core.pulse('key')` |
| Voice input is recording | `#micBtn.on` | `Core.state('listening')` until it stops |
| Request sent, no text yet (also reasoning and tool steps) | live message of the current chat with empty text | `Core.state('thinking')` |
| Text streams | live message has text | `Core.set({ state: 'answering', target: that message's .md, ax: 0.06, ay: 1 })`, re-aimed after every re-render |
| Answer ends, or the user presses stop | no live message any more | `Core.target(q).state('rest')` |
| An error arrives | the message that was live has `err` and is not cancelled | the same, then `Core.pulse('error')` |
| Another model is picked | text of `#mname` changes | `Core.model(name)`, and `data-core-model` on the mini core `#mcore` in the model button |
| Another chat is opened | re-render | the state of that chat (a chat generating in the background is thinking or answering again when reopened) |

- **Centre place.** The named `center` has a radius of 30 % of the smaller side, which is narrower than the 736 px column of greeting, field and suggestions: the Core would hide behind them. In an empty chat the script therefore asks for `Core.place({ x, y: 46, size })` with a radius of half the field width plus 120 px (limited by the stage width and by 56 % of the height), centred on the stage; where that is not at least 15 % larger than the named place it uses `Core.place('center')`. It is recomputed with the stage.
- The last model name is kept in `localStorage['premier:core-model']`, so the Core appears in that model's form at once instead of flowing from the sphere after the model list loads.
- **Stage.** `Core.stage({ left, right })` from the bounding box of `.main`, on every size change of `.main` (debounced 90 ms). A later step that opens a panel beside the chat needs no extra call.
- **Light scope.** `CoreUI.light.scope('.side, .box-glass, #sugg, .pane-in')` (step 4 added the result window). Step 5: when a dialog becomes Core glass, add its selector here.
- **No graphics card.** When the scene reports `glow` with reason `no-webgl` or `shader`, the script sets `data-core-transparency="reduce"` on `<html>` (and removes it if the scene goes live). Without a GPU the browser blurs on the CPU on every change under the glass; the page then uses the system's opaque glass, and `core-chat.css` stops the two ambient animations of the fallback glow. Typing and streaming then cost the same as on the old page (13.8). The mark `data-chat-soft` tells that the script, not the user, set the attribute.
- **Edge of the field.** `html[data-core-is]` drives it in CSS: `listening` warms the edge of `.box-glass` from below (`::before`, heat gradient), `thinking` and `answering` warm it fully. No script.
- **The field glides.** When the chat stops being empty the field would jump from the middle to the bottom; the script animates the difference over `--core-dur-4` (skipped under reduced motion).

### 13.5 The input field

Markup order in `.brow`: `#toolsBtn` · `#attachBtn` (hidden) · `#webBtn` `#imgBtn` `#fsBtn` `#agBtn` · `#ptag` · spacer · `.model` (`#mbtn`, `#menu`) · `#micBtn` · `#send`. The mode buttons must stay direct children of `.brow`: the folder and computer popovers append themselves to the parent of their button. `#menu` must stay inside `.model`.

- **Why the glass is a child.** `form.box` has no `backdrop-filter`; the glass is `.box-glass`, absolutely placed under the content. A `backdrop-filter` (or `contain`, `transform`) on the form would make it the containing block of `position: fixed` descendants, and the model list is a fixed bottom sheet on phones. For the same reason the field width is watched by a `ResizeObserver` that sets class `is-narrow` (below 520 px) instead of a container query.
- **"+" menu.** Mode buttons that are off are hidden in the row. `#toolsMenu` lists attach and every available mode; the script builds the items from the buttons themselves (icon, label, `hidden`, `aria-pressed`), so labels and languages need no second source. Choosing an item clicks the real button. Every function is at most two clicks away; an active mode is one click away.
- **Active modes.** A mode that is on shows as a bright chip in the row ("on" is light, not amber). In a narrow field the chips are replaced by small lit icons inside the "+" button (`.tools.has-on`, `#toolsOn`), so the model name is never cut: one 44 px target instead of several small ones.
- The "+" button is the only new control. Its accessible name is «Добавить» / "Add", an existing interface word; no other text was added.

| State | Hook | Look |
| --- | --- | --- |
| Empty | `#send:disabled` | Send is cold (no amber). |
| Typing | `html[data-core-is=listening]` | Edge warms from below; send is amber. |
| Attachments | `#atts .att`, `.att.img`, `.att.loading` | Chips above the text; a loading one is dimmed and breathes. |
| Picked element | `#pickChip` | One line above the attachments, element name in the machine voice. |
| Files dragged over the window | `html.is-dragging` (script), `.box.drag` (existing) | The field gets an outer ring; over the field itself the ring is the focus colour. Only the field accepts the drop, as before. |
| Voice recording | `#micBtn.on` | Bright button with a breathing Core particle; the Core listens. |
| Model working | `#send.stop` | The amber button shows the stop square; the edge of the field is fully warm. |
| Limit spent | `#gwBar .gw-out` | A plate with a red edge above the field; "continue" is the amber action, send and the field's edge go cold. Sending still opens the limit window (logic unchanged). |

### 13.6 The limit

`gwRing(left, L, label)` in `15-growth.js` returns the Core ring; `19-limits.js` uses it for paid plans. The orange bar (`.gw-meter`) is gone.

- Plenty left: the ring is neutral (`--core-text-3`) and the sentence is `--core-text-3`. Nothing on the line is amber.
- `.gw-left.low`: the ring takes the heat scale and cools with the remaining share; the sentence becomes `--core-text-2`; the existing warning plate appears above.
- `.gw-left.out`: ring and sentence in `--core-bad`.
- The sentence is one line with an ellipsis (its full text is the `title`); the button after it («Тарифы», «Лимиты») is an underlined text button.
- The plan card in the sidebar keeps its bar as a 2 px neutral line (`.pc-bar`), `--core-warn` when low, `--core-bad` when out.

### 13.7 Patterns to reuse

- `.ib`: the quiet icon button of the whole page (36 px, 44 px on touch), also inside old parts.
- Plate without blur: `background: var(--chat-plate)` plus a hairline, for surfaces that lie on the veil (`.bub`, `.gw-warn`, `.cv-down`). Do not use `core-glass` there: it would blur a flat colour for nothing.
- "The AI is working here": a 6 px dot in `--core-point` breathing at `--chat-breathe` (`.who .mark.breathe`, `.busydot`, `.cursor`, the mic). No logo next to answers; the answer header is `Premier` plus the model name in the machine voice.
- Message actions (`.acts`) always keep their height; only opacity changes. They are always visible on touch and on the last message.
- Prose: `.md` maps to the type scale (`--core-human-3` body; the renderer emits only `h3`, so one heading level; tables on a hairline frame with a quiet header; links neutral; inline code on `--core-fill-2`).
- Errors: `.errbox` on `--core-bad-soft` with a `--core-bad` edge; its buttons (`.cu-acts`) are small outlined buttons, the first one filled.
- Machine voice in the chat: model names, file names and sizes, timestamps, the plan name, the language switch, the picked element.
- Amber on this screen: the send button; "continue" when the limit is spent; working dots; the warm edge of the field; the ring when the limit is low. A test lists the allowed selectors.
- The brand mark in the sidebar is the spark glyph in text colour, not the amber logo tile.

### 13.8 Performance rules found in this step

Measured in Chrome against the step 2 build on the same machine (software rendering, so only the comparison is meaningful):

| | Old chat | New chat |
| --- | --- | --- |
| Typing, key to frame, p95 | 16.1 ms | 16.0 ms |
| Streaming a long answer, frame interval p95 | 16.8 ms | 16.8 ms |
| Scrolling 300 messages, frame interval p95 / frames over 33 ms | 16.7 ms / 0 | 16.8 ms / 0 |
| Whole-page restyle on a Core state change, 300 messages | — | 4.6 ms (68 ms before `light.scope`) |

- Use `CoreUI.light.scope` on any page with a long list (section 5). Without it the first keystroke in a long chat cost twenty slow frames.
- Count blurred layers; a surface the Core never passes behind does not need `backdrop-filter`.
- Without a GPU, stop anything that moves under glass and switch to opaque glass (13.4).
- Do not put `content-visibility` on messages: the chat re-renders the list during a stream, and estimated heights would make the view jump for a user who scrolled up.
- A `mask` on the scroller was avoided for the same reason (it forces the whole scroller through an extra layer); the fade is two small gradients instead.

### 13.9 Phone

Up to 860 px (the product's existing breakpoint): the sidebar is a floating drawer with a scrim (`.side.mopen`, `.overlay.on`), Esc and the scrim close it; the top bar, the field and the drawer respect the safe areas; `interactive-widget=resizes-content` keeps the field above the keyboard where the browser supports it (elsewhere the browser pans the page, as before); the disclaimer hides while the field has focus; controls are 44 px (`--core-hit`); the field uses 16 px text. The Core picks its reduced quality by itself.

### 13.10 Not verified

- A real graphics card. The real scene was run in Chrome through software WebGL (the scene's refusal of software WebGL was bypassed for screenshots and contrast measurement), so the look through glass and the contrast are verified, the frame rate is not.
- Safari, Firefox, a real phone, the on-screen keyboard on iOS, screen readers.
- The cursor on high-density screens (as in step 1).

---

## 14. Everything the AI makes and does (step 4)

Step 3 moved the human side of the chat. Step 4 moved the machine side: the result window, the work log, code blocks, result cards and media, the cloud computer, the local folder and the desktop helper. Checked by `tests/core-work.test.js`.

### 14.1 Files and loading

| File | What it holds |
| --- | --- |
| `public/core/core-work.css` | All of the above. Loaded after `core-chat.css`. Same rules as `core-chat.css`: tokens only, no own blur, hooks untouched. Private values are `--work-*`. |
| `public/js/24-core-work.js` | Glue without chat logic and without texts, one file for RU and EN: the divider, the birth of the result window, tab arrows, the "copied" mark, keyboard for the folder / computer popovers, the phone switch, the terminal theme on a theme change. Deferred, loaded last. |
| `public/core/core-tokens.css` | New tokens: the syntax palette (`--core-syn-*`, 14.4) and the terminal palette (`--core-term-*`, 14.5). |
| `tests/core-work.test.js` | 10 checks of this section. |

```html
<link rel="stylesheet" href="/core/core-chat.css?v=1">
<link rel="stylesheet" href="/core/core-work.css?v=1">
…
<script defer src="/js/23-core-chat.js?v=2"></script>
<script defer src="/js/24-core-work.js?v=1"></script>
```

Most of this markup is built by scripts from strings (`js/02-markdown.js`, `js/04-render.js`, `js/06-pane.js`, `js/08-projects.js`, `js/20-chat-ui.js`, `js/22-anim.js`, `cloud.js`, `folder.js`, `agent.js`). The rule of step 3 holds: restyle around the hooks. Where the new look needed a hook that did not exist, a class or a `data-` attribute was added to the template, identically in the Russian file and in its hand-finished English copy (one script, every edit must match exactly once per file; `public/en` is still not regenerated, see 13.1). Texts were never retyped.

### 14.2 The result window

`aside.pane#pane` › `div.pane-grip#paneGrip` + `div.pane-in.core-glass[data-core-at=right]` › `.phead`, `#pubbar`, `#animbar`, `.pbody`.

- **Material.** The frame is mid glass, radius `lg`, 8 px padding; the stage `.pbody` inside is radius `md` (concentric). The user's result is the only bright, fully opaque object on the screen.
- **The result is never touched.** `#pFrame` has `background: Canvas; color-scheme: light` (a page without its own background is white, as in a browser tab), no filter, no opacity, no overlay; the stage's hairline is an outer `box-shadow`, nothing is drawn above the frame. A test forbids `filter`, `opacity`, `mask` and pseudo-elements there.
- **No blur on desktop.** The Core stands in the middle of the chat and never passes behind the window, so `backdrop-filter` is off above 860 px (the same decision as the sidebar in 13.3). Fill, lit edge and shadow remain. On a phone the frame is the opaque `--core-solid-mid`.
- **Birth.** `.pane.on` changes the layout width at once (one layout, no per-frame reflow of the chat) and `.pane-in` grows over `--core-dur-3` from `perspective(1400px) rotateY(-7deg) scale(.94)`; its `transform-origin` is the Core's position (`CoreUI.light.get()`, written to `--work-ox/oy` by the script). Closing collapses it over `--core-dur-2`, the layout width is released after that delay (`transition: width 0s var(--core-dur-2)`), and a standard `core-glint` spark flashes at the Core's point. Reduced motion: no transform, no spark.
- **Light.** `.pane-in` is in the light scope: `CoreUI.light.scope('.side, .box-glass, #sugg, .pane-in')`.

**Header hierarchy.** Title (with a kind glyph) · views (`.tabs`, a segmented control) · a quiet group of five icon buttons `.ph-tools` (pick, reload, open in a new tab, download, copy) · **publish** · close. Publish (`#pPub.core-btn.ph-pub`) is the only header button with a visible label and the only filled one. It is filled with `--core-on` ("on is light"), **not amber**: the send button stays the one amber action of the screen. Its label is the first word of its own accessible name, so no interface text was added. Below 760 px of window width (a container query on `.pane-in`) the header takes two rows: title, publish and close above; views and tools below. Arrow keys, Home and End move between the views.

| State | Hook | Look |
| --- | --- | --- |
| Being built | `#pWait` shown, `#pPub[hidden]` | `core-gather` in the shape of a page (banner, two lines, three cards) above the existing sentence. |
| Preview | `#pFrame` | The result on the stage. |
| Code | `#pCode` | Plain text on dense glass, machine voice. Not highlighted: it is rewritten on every streamed chunk. |
| Versions | `#pVersions.version-panel` | Rows `.version-row` (`.act` = active base, dot; `.cur` = the one shown, lit row), status in the machine voice coloured by `small[data-vs]`, changes as `details` with `.diff-add` / `.diff-remove` in status colours. |
| Not published | `#pPub` | Bright labelled button. |
| Publishing | `#pPub[aria-busy=true]` | The button's standard busy state (three running points). |
| Published | `#pPub.on`, `#pubbar` | The button dims to an icon with an `--core-ok` dot; the address line appears: status dot, address in the machine voice, copy, unpublish; `.pub-upgrade` is a second quiet line. |
| Removed | `#pubbar[hidden]` | The address line goes, the button is the bright one again (the existing toast says it in words). |
| Animation | `#animbar.animbar` | Machine-voice facts about the clip, a glass "MP4" button; while the server records, a 2 px progress line in `--core-point` runs along the bar's bottom edge; `.anim-err` in `--core-bad`. |
| Picking an element | `#pPick.on` | The stage gets a 2 px `--core-focus` ring, the button is lit. Inside the user's page the frame and the name tag are drawn by `12-picker.js` with literal values of the system (no tokens exist in that document): warm-white hairline with a dark outline, name in a monospace tag. |
| Check failed / unverified | `details.validation-box[data-vs]` in the answer | Plate in `--core-bad-soft` / `--core-warn-soft` with the list of checks in the machine voice; passed is a quiet row with an `--core-ok` dot. |

**Divider.** `#paneGrip` is `role="separator"` with `aria-valuenow/min/max`, named by the window title. Drag with mouse or finger (pointer capture; the width is applied at most once per frame; while dragging, the result page ignores the pointer and all transitions are off), arrows move it by 24 px (Shift: 96), Home / End go to the limits, Enter or a double click returns the default. The width is kept in `localStorage['premier:pane-w']` and written to `--work-pane` on `#pane`.

**Widths.** Default: `clamp(380px, 100vw − sidebar − 560px, 820px)`, so the chat keeps 560 px and the input field stays out of its narrow mode at 1440 px (the old fixed 52 vw left the chat 419 px). The chat never gets less than 360 px however the divider is dragged. `Core.stage()` follows by itself (13.4).

**Phone (up to 860 px).** The window is fixed and covers the screen. Row 1: the switch `.view-sw` (chat / result). Row 2: views. Then the address line, the stage, and at the bottom, under the thumb: the five tools on the left and publish on the right. All five tools are reachable (the old phone layout hid two of them). The switch is built by the script and appears in two places: in the chat's top bar when the chat has a result, and in the window. Its two labels are the chat's title and the result's title, so it needs no new text; "chat" clicks the existing close button, "result" clicks the last result card. Without the script the close button is shown instead (`.pane.has-sw` hides it).

### 14.3 The work log

One `details.wl` per answer, built by `logHtml(m)` in `04-render.js`; it replaces the separate "thinking" block and the always-open list of steps.

```html
<details class="wl on|bad" data-log="MESSAGE_ID" open>
  <summary><span class="wl-st"></span><span class="wl-ic">…step icons…</span><span class="wl-t">label</span><span class="wl-ms">41 с</span></summary>
  <div class="wl-b"><details class="think">…reasoning…</details><div class="steps"><div class="step on|bad"><svg/><span>label</span></div>…</div></div>
</details>
```

- **Summary line**, machine voice: state mark, what the machine did, how long it took, and on the right a quiet trace of the step icons in order (at most six, then `+N`). While a step runs the label is that step's own running label; after that it is the label of the last step. All labels are the existing strings of the steps; the log has no text of its own (a test compares the log's code in RU and EN byte for byte).
- **States.** `.wl.on`: the machine works. The mark is a breathing Core particle and the time ticks (`[data-wl-from]`, once a second, no re-render). Done: a check mark in `--core-text-3`. `.wl.bad`: at least one step failed, the mark is a cross in `--core-bad`. Steps: `.step.on` (icon in `--core-point`, breathing), done (neutral), `.step.bad` (`--core-bad`).
- **This is where amber is allowed.** `--core-point` appears only on things that mean "the machine is working": the log's mark, the running step, live reasoning, a running computer action, a card being built, an image or video being made, the recording progress line, the "waiting for connection" dot. A test lists these selectors. While the log works and the answer has no text yet, the answer's own breathing dot is hidden, so there is one particle, not two.
- **Reasoning** opens from the same place: `details.think` is the first row of the log. The log opens by itself only while reasoning streams (the old block behaved the same) and collapses into one line when the answer starts; what the user opened or closed by hand wins and survives re-renders (`LOG_OPEN`).
- **Time.** `m.logMs` is the total working time of the answer (from sending to the first text, plus later tool spans). It is measured in the renderer the same way `drawAt` already was, and saved with the message. Old messages show reasoning plus waiting time, or nothing.
- Read-only folder and computer steps (`.fsops > .step`) use the same row. Changes are cards (`details.fsop`, 14.6).

### 14.4 Code blocks and the syntax palette

`.pre` (built by `md()`, decorated by `20-chat-ui.js`): dense glass `--core-glass-dense`, radius `md`, hairline, a brighter bottom hairline (light from the horizon). Header `.bar`, machine voice: language, `.cu-n` line count, "download" and "copy" as quiet text buttons; "copied" swaps the word (existing behaviour) and gets `[data-done]` in `--core-ok` for 1.4 s. Line numbers are CSS counters on `.cv-l`. More than 40 lines: collapsed to 520 px with a fade and a full-width `.cu-more` row. Long lines scroll inside the block. `details.fileb` (a project file) and `details.run` (an executed program: status in `--core-ok` / `--core-bad`, code, `.outp` output, `.outp.err`) hold the same block flat inside a plate.

Performance rules that came out of measuring a 480-line block while it streams:

- No `backdrop-filter` on code blocks: they lie on the opaque veil, there is nothing to blur.
- No full-size pseudo-element with a mask on `.pre`. The lit edge of small cards is a masked gradient layer; on a block several thousand pixels tall that layer is repainted on every streamed frame. The block's edge is two inset shadows instead. A test forbids the layer.
- Still no `content-visibility` on messages (13.8).

**Syntax palette**: the heat scale plus neutrals, no cool hues. The hotter a word, the more it matters for the structure of the code.

| Token | Dark | Light | Used for (highlight.js classes) |
| --- | --- | --- | --- |
| `--core-syn-func` | `#FFF0D6` white-hot, weight 500 | `#1B1714` ink, weight 500 | `title`, `section` |
| `--core-syn-keyword` | `#FFB65C` glow | `#A33A08` burnt vermilion | `keyword`, `selector-pseudo`, `selector-attr` |
| `--core-syn-tag` | `#FFB65C` | `#A33A08` | `name`, `selector-tag`, `selector-id`, `selector-class` |
| `--core-syn-number` | `#FF8B2C` amber | `#B3480A` | `number`, `literal`, `symbol`, `bullet`, `link` |
| `--core-syn-string` | `#E6A98C` ember, lifted | `#7D5320` ochre | `string`, `regexp`, `char` |
| `--core-syn-type` | `#D9C4A1` sand | `#5F4F38` umber | `type`, `built_in`, class titles |
| `--core-syn-attr` | `#C9B8A0` | `#6A5942` | `attr`, `attribute`, `property`, `variable` |
| `--core-syn-punct` | `--core-text-2` | `--core-text-2` | `punctuation`, `operator`, `tag` |
| `--core-syn-comment` | `--core-text-3`, italic | `--core-text-3`, italic | `comment`, `quote` |
| `--core-syn-meta` | `--core-text-3` | `--core-text-3` | `meta`, `doctag` |

Added and removed lines (`hljs-addition`, `hljs-deletion`, diffs) use `--core-ok` / `--core-bad` on their soft backgrounds: that is status, not syntax. Every colour keeps at least 4.5:1 on dense glass and on the bare scene in both themes (tested). The same mapping is in `core-components.css` for `.core-code` and as `.core-syn-*` helper classes; `core-work.css` maps the chat's `.cv-code`. Step 1's stand-in palette (with a green and a blue) is gone.

### 14.5 The terminal and the cloud computer

The terminal is the purest machine voice: JetBrains Mono 13 px, dense glass, light rising from the bottom edge (an inset shadow in `--core-edge`), a block caret that is a Core particle.

| Token | Dark | Light |
| --- | --- | --- |
| `--core-term-bg`, `-fg`, `-dim` | `--core-solid-dense`, `--core-text`, `--core-text-3` | the same roles (paper, ink) |
| `--core-term-cursor` | `--core-heat-3` | ink |
| `--core-term-select` | `#FFECD63D` | `#1B171429` |
| `-red`, `-green`, `-yellow` | `--core-bad`, `--core-ok`, `--core-warn` values | the same roles (`green` is `#18764E` to keep 4.5:1) |
| `-blue`, `-magenta`, `-cyan` | `#9DB7CF`, `#D3A6C0`, `#8CC9C0` | `#2F5F7A`, `#8A3F6B`, `#1F6F6A` |
| `-black`, `-white`, `-bright-black`, `-bright-white` | `#1C1916`, text-2, text-3, text | ink, text-2, text-3, ink |
| `-bright-yellow` | `--core-heat-4` | `--core-heat-1` value |

The three cool tones exist only for program output (`ls`, `git`, test runners) and are used nowhere else. Values are plain hex because xterm parses them itself: `clTheme()` in `cloud.js` reads the tokens with `getComputedStyle`, `clFont()` reads `--core-font-machine`, the font is loaded before xterm measures a cell, and `24-core-work.js` reapplies the theme when the page theme changes. The line-by-line fallback terminal (`.clout`, `.clin`) uses the same tokens.

The window "Облачный компьютер" (`.clw`, inside the old dialog shell, which is step 5):

| Machine state | Hook | Look |
| --- | --- | --- |
| Running | `.cldot.on` | `--core-ok` dot with a soft glow, state in the machine voice. |
| Asleep | `.cldot` | Hollow neutral ring. |
| Unavailable / no connection | `#clSt.bad` (added by `clPaintBar`) | Text in `--core-bad`. |
| Command running (line mode) | `.clout .dim` | Dim line. |
| Waiting for the helper to connect | `.agwait .agspin` | Breathing Core particle. |

Tabs `.agtabs` are the same segmented control as the window's views. File and site lists (`.cllist` › `.clrow`) are machine-voice rows on dense glass with hairlines; names, sizes and crumbs are machine voice, section titles and hints are human voice.

The two popovers at the input field (`#fsMenu`, `#agMenu`, class `fsmenu`) are near glass: `folder.js` and `agent.js` give them `core-glass core-glass--near`. The chosen place of work (`.agpick.on`) is lit and has a check mark. Opened from the keyboard, focus moves inside; Esc closes and returns focus.

### 14.6 Result cards, permission prompts, media

- **Plate.** Things the machine hands over lie on the veil as plates: `--work-plate` (= `--chat-plate`), a hairline, and for the cards a lit-from-below edge (the masked-gradient `::after` of 13.3). No blur. Code and program output are wells (`--work-well` = dense glass), darker than plates.
- **Result card** `.art`: icon tile, title (human), type line in the machine voice («Сайт · HTML»), state pill `.art-go`. `.art.cur` (shown in the window) is lit and its pill has an `--core-on` dot. `.building` puts a breathing particle on the tile. `.pack` is the same plate with a button row; `.ofile` is the compact file card; `.imgw` an image with a machine-voice caption.
- **Buttons inside these parts** (`.btn`, `.btn.pri`): the class is shared with step 5 dialogs and its old rule stays in the bridge, so `core-work.css` sets it completely inside `.msg`, `.pane`, `.clw`, `.agset`. `.btn.pri` is filled with `--core-on`, not amber.
- **Changes in the folder and on the computer** `details.fsop` / `.agop`: summary with the action (human), the path or command (machine), `+N −N`, and the state on the right (`.fss`). `.ask` is a permission prompt: `--core-warn-soft` plate, open, buttons right-aligned, "allow" bright; a deletion (`.agdanger`) asks in `--core-bad-soft`. `.run` shows a breathing particle, `.ok` / `.err` status colours, `.no` / `.undone` strike the path through. Diffs (`.fsdiff .dl.add/.del`) use status colours.
- **Generated media** `.gens` › `.gen`: image or video on a dense tile, the download button appears on hover or focus (always on touch). Being made (`.gen.draw`): `core-gather` in the shape of the picture, a caption with a breathing particle, the time in the machine voice, and for video a 2 px progress line.
- **Sources and tables** were done in step 3 (`.srcs`, `.tbl`) and are unchanged.
- **Disclosure rows.** Every `details` of this step (`.wl`, `.think`, `.run`, `.fsop`, `.fileb`, `.validation-box`, version diffs) has the same chevron from `--core-glyph-chevron`, turning on open.

### 14.7 For step 5

- The bridge `chat-legacy.css` now holds only step 5 parts: 58 KB instead of 89. `scripts/build-chat-legacy.py` got a second list, `CLAIM`: a selector is dropped when it mentions a step 4 class **anywhere**, because those rules started with anything (`.msg .pre`, `.dlg .clw`). `KEEP` shrank to `menu|opt|modal|dlg|toast`. Add your classes to `DROP` or `CLAIM`, run the script, raise `?v=`.
- The cloud computer window and the "access to computer" window are content inside the old dialog shell (`#modal .dlg`, `#dtitle`, `#dclose`). Their content is done; the shell is yours.
- Shared rules still coming from the bridge and used by step 4 parts: the global `svg{…stroke…}` rule, the `*{box-sizing;margin;padding}` reset, `button{background:none;border:0}`. Keep them or move them into Core when the bridge goes.
- The hidden old dialog keeps `#dclose` in the Tab order (it is hidden by opacity, not `display`); found while checking the keyboard path through the result window.
- `confirm()` is still native in these parts (unpublish, version activation, cloud actions, "allow in this answer"): replacing the native boxes is step 5 (section 6).
- The toast is still the old one; the result window relies on it for "published", "unpublished" and the picking hint.

### 14.8 Not verified in step 4

- **A real graphics card and real frame rates.** The sandbox renders in software and gives about 8 frames a second for any page, so smoothness of the divider with a live preview, of the birth animation and of streaming could only be compared with the step 3 build on the same machine (streaming a 480-line block: the same frame intervals as before). Try the divider on an ordinary laptop first.
- Safari, Firefox, a real phone, a screen reader.
- The real interactive terminal session: the test server has no cloud computer, so xterm was opened with the palette and fed sample output; the WebSocket session itself was not exercised.
- Video recording of an animation against a real server (the bar's states were set by hand), real publishing (the request was answered by a stub), the folder mode (the test browser cannot pick a folder; the cards were rendered from sample data).

## 15. Dialogs and small elements on the chat page (step 5)

The chat page no longer loads `tokens.css` or `chat-legacy.css`. It loads `core/core-dialogs.css` and `js/25-core-dialogs.js` last, after the step 4 files. Covered: the shared window (account, billing and limits, plans, share, projects, team, computer access, cloud computer, Ultra credits), the model menu, the image viewer, notifications, tooltips, confirmations and the offline page (`public/offline.html`, self-contained, both themes).

### 15.1 How the shared window works

- Scripts still open the window the old way: they add the class `on` to `#modal`. `25-core-dialogs.js` turns that class into a Core window (`CoreUI.dialog`) and back. Keep the element ids `#modal`, `.dlg`, `#dtitle`, `#dclose` and `#dbody`: payment and limit flows read `#dtitle`, and the language switch refuses to run while a window is open.
- The window is born from the last pointer or Enter position (remembered for 6 s, so a window that opens after a server reply still grows from the button). Switching to another face of the same plate turns it; the plate animates its height.
- Plans: the chosen plan comes forward, and the Core behind the plans window brightens as the plan gets more expensive (`Core.lit`).

### 15.2 Rules for the chat page

1. Confirmations, prompts and alerts are `CoreUI.confirm`, `CoreUI.prompt` and `CoreUI.alert` (the capsule). Chat-loaded scripts must not call the browser's `confirm`, `prompt` or `alert`; `tests/core-dialogs.test.js` checks this. The one native call left is the last-resort fallback in `public/language.js`, for pages without toasts or Core (login, landing). The chat page cannot reach it.
2. Destructive capsules use `danger: true`: the red action is not filled, and focus starts on Cancel. Enter on a capsule runs the focused button; Escape cancels and closes only the capsule.
3. Tooltips use `data-core-tip`. Chat-loaded scripts must not write `title`. The only `title` left is the accessible name of the preview frame (`tests/core-dialogs.test.js`).
4. One amber primary action per window. Status colours appear only for success, warning and error. Toast tones: `ok` for saves, `warn` for limits, `bad` for failures; mode switches and "2FA is off" stay neutral.
5. Status dots and media elements have accessible names. The microphone button reports its state through `aria-pressed` and `data-core-tip`.

### 15.3 Surface status

- Core: account (all sections), plans, payment waiting and failure states, limits and purchases, free-limit end screen, share, project create and settings, team plan, computer access, cloud computer, Ultra credits, model menu, image viewer, notifications, tooltips, capsules, toasts, offline page.
- Not on the chat page: a chat or project row menu, rename dialog, search dialog, notification-permission popup, offline or update banner. None of these exist in the chat today.
- Kept on disk until step 8: `tokens.css`, the old chat stylesheets, and `chat-legacy.css` with its build script. Nothing in the chat loads them.

### 15.4 Not verified in step 5

- Safari and Firefox, a real phone, a screen reader, a real graphics card.
- Real speech recognition and read-aloud, the real payment providers, real publishing and sign-in back ends.
- Scrolling with a keyboard-focused tooltip on a page long enough to scroll (the empty chat cannot scroll).
- Escape in the work menu when an upper Core menu or window consumed the key.

## 16. Pages before the product: landing, login, trial (step 6)

Three pages a visitor sees before the product: the landing (`public/index.html`, `public/en/index.html`), the login page (`public/login.html`, `public/en/login.html`) and the trial page (`public/protrial.html`, `public/en/protrial.html`). Stylesheets: `core/core-landing.css`, `core/core-login.css`, `core/core-trial.css`. Scripts: `core/core-landing.js`, `core/core-login.js`, `core/core-trial.js`.

### 16.1 Material: real glass, panes and plates

- Every surface carries the system's glass classes in the markup (`core-glass core-glass--far|mid|near`), so it gets the lit edge that faces the Core, the fallbacks and the no-nested-blur rule from `core-base.css`. Page stylesheets do not paint their own glass.
- Depth by role. Header: near glass (`data-core-at="top"`). Section panes, the hero copy panel, the hero facts panel and the footer: far glass. The demo frame, the closing card, the login plate and the trial plate: mid glass.
- A long page is built from **panes and plates**. Each section's `.wrap` is one far-glass pane (`.pane`). Cards inside it (`.feat`, `.tier`, `.faq-item`, `.rv-card`, `.offer-strip`, `.team-strip`) are plates: `--core-fill-1` with a 1 px inset line, no blur. This is the step 5 plans-window pattern, and it means one blurred surface per section instead of one per card.
- **All text sits on glass.** No text is placed straight on the scene (rule 5). The headline has its own far panel (`.hero-copy`); section headings sit inside their pane.
- On phones (up to 720 px) the far panes, the header and the footer are opaque (`--_backdrop: none; --_fill: var(--core-solid-far)`), and the demo frame and closing card use `--core-solid-mid`. A large blurred surface over a moving Core is too expensive there. The Core shows above the first screen and in the gaps between sections.

### 16.2 Loading and first paint

- Blocking: `core-tokens.css`, `core-base.css` and the page stylesheet. `core-components.css` and `core-scene.css` load without blocking (`media="print"` switched to `all` on load), with a `<noscript>` copy so they still apply with scripts off. The foundation test requires the three base files to be linked together.
- The scene is not in the first paint. Each page script appends `core-scene.js` after the window `load` event, in idle time (1.5 s limit). Text, buttons and the demo are visible first.
- Blur starts with the scene. Until the scene script has loaded, glass has only a flat background behind it, so `html:not(.core-live) .core-glass` has no `backdrop-filter`; the page script adds `core-live` to `<html>` when the scene is in. The first paint does not pay for blur, and the look is the same.
- Nothing shifts when the Core or late data arrive. Late content has its space reserved: the hero offer line keeps its height while hidden (`.hero-offer[hidden]`). The only shifts measured come from the web font swapping in during the first 0.4 s.
- Font preloads match the language: Russian pages preload the Cyrillic Onest subset, English pages the Latin one. The trial page also preloads Latin Onest and Latin JetBrains Mono (the headline starts with "Pro", the timer is digits).
- `theme-color` is the scene colour, as in the chat (`#0B0A08` dark, `#F1ECE3` light).
- Without scripts the landing shows the headline, lead, buttons, feature cards, FAQ (`<details>`) and footer. Pricing plates are built by script from `/api/plans`, so that area is empty with scripts off; this predates step 6 and needs server rendering.
- Without WebGL the scene falls back to its CSS glow; the pages are otherwise unchanged.

### 16.3 The scroll flight (landing)

`core-landing.js` holds keyframes per section: x and y as fractions of the window, radius as a fraction of the shorter side, brightness, and two angles (`turn`, `tilt`, radians). Each section meets the Core from its own side, distance and angle.

| Section | Wide (≥ 960 px): x, y, r, gain, turn, tilt | Narrow: x, y, r, gain (angles as wide) |
| --- | --- | --- |
| hero | 0.77, 0.36, 0.30, 1, 0, 0 | 0.80, 0.09, 0.26, 1 |
| features | 0.04, 0.52, 0.36, 0.8, 1.1, 0.30 | 0.08, 0.50, 0.50, 0.7 |
| pricing | 0.97, 0.44, 0.40, 0.75, 2.3, −0.24 | 0.92, 0.50, 0.50, 0.65 |
| reviews | 0.50, 1.04, 0.56, 0.7, 3.3, 0.50 | 0.50, 0.96, 0.60, 0.6 |
| FAQ | 0.03, 0.34, 0.32, 0.7, 4.3, −0.16 | 0.08, 0.40, 0.50, 0.6 |
| closing card | 0.50, 0.50, 0.46, 1, 5.4, 0 | 0.50, 0.50, 0.60, 0.9 |

- On each scroll frame the script interpolates between the two nearest section midpoints with `smoothstep` and calls `Core.pose(...)` (16.6). There is no spring, so the Core follows the scroll position exactly. The hero keyframe is pinned to the top of the page.
- The page never takes over scrolling: no snapping, nothing waits for an animation, the listener is passive.
- Narrow screens and coarse pointers use the calmer path and update the pose at most 30 times a second, so the scene does not redraw on every scroll frame.
- **Lit edges follow the Core.** The script writes `--core-x` and `--core-y` on the glass surfaces and on `.core-scene` only (never on `<html>`), at most 8 times a second and only when the value changed by 2 or more. This keeps the rule from section 5 (do not restyle the whole page every frame).
- Reduced motion (`prefers-reduced-motion` or `data-core-motion="reduce"`): no flight. The Core is posed once at the hero keyframe and stays there; reveal transitions are off.
- Keyframes are measured again on resize and when the document height changes.

### 16.4 The demonstration

The demo frame shows the product working. Switching the example: the frame returns to its waiting state and the Core goes to `thinking`; when the example has loaded the frame shows it, the Core goes to `answering`, then `rest` after 0.9 s. If the example does not load within 6 s the frame stops waiting. While the visitor types in the demo field the Core is `listening`. None of this runs under reduced motion. The example pages in `public/demo` are content; only the frame is styled, and the result area is opaque (`--core-solid-dense`), never tinted or blurred.

### 16.5 Pricing

The landing's `.tier` plates follow the step 5 `.plan` rules: plan name in the machine voice, one dominant price (`--core-machine-5`), the old price as a small row above it, the term small after it, features under a hairline, edges brighter for higher plans, the recommended plate in front (`--core-fill-2`, a `--core-text-2` edge, near shadow). The period switch `.lp-per` is the same segmented control as `.pm-per`. One amber button in the section: the recommended plan's. The trial offer button and "leave a review" are glass buttons.

### 16.6 Shared file change: `Core.pose`

`core/core-scene.js` has one additive mode. `Core.pose({ x, y, r, gain, aura, lift, turn, tilt })` sets the Core's centre and radius in pixels, its brightness, and adds `turn` to the spin angle and `tilt` to the view angle. It bypasses the spring between `Core.place` presets. `Core.pose(null)` returns to the presets. With no pose set the scene behaves as before. Pages load the scene as `?v=4`.

### 16.7 Login

- The Core fills the screen, centred. The form is one mid-glass plate (`.box`): language switch, content, legal line and the "back" link are all on it. The product pitch is on a far panel on the left and is hidden up to 860 px.
- Sign-in buttons are glass; the default screen has no amber. Amber appears on the code step's submit and on the "continue" link after a backup code.
- States, all kept: sign in or register through Google or GitHub; a provider being opened (button dims, label changes); providers not configured (buttons disabled, neutral message); registration closed (note); `?err=…` from the server (error line in the status colour); the second factor (`?step=2fa`): waiting for the code, checking, wrong code, expired session, backup code used. There is no password form and no recovery screen on this page.
- Field attributes are untouched (`autocomplete="one-time-code"`, `inputmode="numeric"`), so autofill and password managers behave as before.
- **Success flight.** `premierFly(done)` moves the Core toward the viewer for about 420 ms while the plates fade, then calls `done`, which opens the chat. A 900 ms timer calls `done` regardless. With reduced motion, or without the scene, `done` runs at once. The page calls it after a correct second-factor code. Sign-in through Google or GitHub ends in a server redirect to the chat, which this page cannot animate without a server change.

### 16.8 Trial

A close-up of the pricing section: one mid-glass plate with the headline, the 24-hour countdown (the one number, machine voice, tabular digits; brighter while it runs) and the one amber action. The Core stands directly behind the plate and does not move. Features, comparison, steps and FAQ follow as far panes with plates. States kept: eligible, active (countdown, "open chat"), used (paid trial offer, glass button), already on a plan, not eligible, offer ended, and the status message (`.pt-status.ok` / `.err`).

### 16.9 Server contract (do not break)

- `seo.js` fills `<!--SEO-->`, rewrites `<title>` and `<meta name="description">`, and builds FAQ structured data from `<details class="faq-item"><summary>…</summary><div class="faq-a">…</div></details>`. Keep that markup exactly.
- The login page keeps `<!--REG-->`; the server writes `window.GOOGLE`, `window.GITHUB` and `window.REG` there.
- Element ids and classes used by the inline scripts and `team-offer.js` are unchanged. New wrappers added in step 6: `.hero-copy`, `.hero-meta`, `.pane`, `.plate`.

### 16.10 English pages

`scripts/build-i18n.py` cannot be used: its catalogue is incomplete, and the generated English landing contains Russian text (for example the `<title>`). It also does not cover `protrial.html`. The English pages are edited by hand with the same structure as the Russian ones. Repairing the catalogue is separate work.

### 16.11 Checking a page like these

`npm test` covers structure. For the look, measure rather than judge by eye:
- Contrast: hide the text, screenshot, and compare each text block's colour with the pixels behind it at every scroll position, both themes, 1440 and 390 px.
- Layout shift: record `layout-shift` entries and their sources until 3 s after load.
- Scroll smoothness: 390 px with the CPU slowed 4×; compare frame intervals with the scene blocked, with the scene but no flight, and with the flight.

## 17. Status page and the rest of step 7

Step 7 is the developer cabinet, the admin panel and the status page. This section records what is done and what is not.

### 17.1 Status page (done)

`public/status.html` (served at `/status`, which redirects here). It is Russian only; there is no English page for it.

- Loads only Core files: `core-tokens.css`, `core-base.css`, `core-components.css`, `core-scene.css`, `core-status.css`, and `core-ui.js` for tooltips. The Onest font is served from `/fonts`. Nothing is loaded from another domain (the earlier Google Fonts link was removed).
- The Core sits in the upper right, quiet (gain below the trial page's), placed by `core-status.js` after the window `load` event in idle time. It does not move.
- Outage segments in the 24-hour bars are keyboard-focusable (`tabindex="0"`) and show their reason as a Core tooltip (`data-core-tip`) on hover and focus. Native `title` tooltips are gone.
- On coarse pointers each outage segment gets an invisible 44 px hit area, so the bars keep their size.
- Status colour (`--core-ok`, `--core-bad`) appears only where it means status. A model without data uses the neutral dot.
- Every class and id the script uses is kept: `upd`, `sum`, `list`, `chip`, `dot`, `m`, `m-top`, `st`, `sp2`, `up`, `tl`, `tl-l`, `note`. The script's texts and logic are unchanged.

### 17.2 Developer cabinet (not started)

`public/developers.html` is a 1.2 KB shell. Everything is drawn by `public/developers.js` (153 KB) using `public/developers.css` (58 KB, old tokens). The English page has its own `en/developers.html` and `en/developers.js`. It is `noindex`. Restyling it means rewriting most of the stylesheet around the classes the script builds, and the English page must be edited by hand, since the generator is broken.

### 17.3 Admin panel (not started)

`public/panel.html` (served at `/panelp`) loads `admin/admin.css` (37 KB) and 23 modules under `public/admin/` (`v-legacy.js` alone is 74 KB). It is internal and `noindex`. The panel shares tokens with the public pages, so its restyle depends on the Core tokens only.

### 17.4 Order for the rest of step 7

1. Developer cabinet: shell and stylesheet first, then the script-built sections (keys, models, usage, docs), in both languages.
2. Admin panel: shell and stylesheet, then the view modules one by one. Keep every id, data attribute and handler, and check each view in both themes at 1440 and 390 px.
3. Both: `npm test`, then a note in `ИЗМЕНЕНИЯ-РЕДИЗАЙН-ШАГ-7-…`.
