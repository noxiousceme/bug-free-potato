# Premier · Core — design system (redesign steps 1–5 of 8)

This document describes the foundation that every later redesign step builds on.
It is written for someone who has only this file and the files it names.

- Showcase (every token and component, live): `/core/showcase.html`
- The chat screen (`public/chat.html` and its English mirror) is the first product page on the system. Every other page still has the old look and loads none of these files. Since step 5 the offline page `public/offline.html` has the Core look too; it is self-contained and loads none of these files either (15.13).
- Step 1 built the foundation (sections 1–11). Step 2 built the Core, the 3D scene behind the interface (section 12). Step 3 moved the chat screen to the system (section 13) and added two small things to the foundation: `Core.stage()` (12.5) and `CoreUI.light.scope()` (section 5). Step 4 moved everything the AI makes and does: the result window, the work log, code blocks, result cards and media, the cloud computer, folder and helper (section 14), and added two palettes to the tokens: syntax (14.4) and terminal (14.5). Step 5 moved every window and small element of the chat: the shared window with account settings, plans and payment, limits, team, project and sharing, the model menu, notifications, tooltips, the capsules that replace the browser's own boxes, the image viewer, the offline page (section 15), and added one command to the scene, `Core.lit()` (15.5). Since step 5 the chat page loads no old stylesheet. Step 5 was stopped early twice; its open checks are in 15.16.
- The guarantees below are checked by `tests/core-foundation.test.js`, `tests/core-scene.test.js`, `tests/core-chat.test.js`, `tests/core-work.test.js` and `tests/core-dialogs.test.js` (`npm test`).

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
| `public/css/chat-legacy.css`, `scripts/build-chat-legacy.py` | Generated bridge of steps 3 and 4: the old look of chat parts that were not migrated yet (13.2). Since step 5 no page loads it. Both files are still on disk and `tests/core-chat.test.js` still checks them (15.1). |
| `tests/core-chat.test.js` | Automated checks of section 13. |
| `public/core/core-work.css` | What the AI makes and does: result window, work log, code blocks, result cards and media, cloud computer, folder, helper (section 14). |
| `public/js/24-core-work.js` | Glue for section 14: divider, birth of the result window, phone switch, keyboard, terminal theme. No chat logic, no texts. |
| `tests/core-work.test.js` | Automated checks of section 14. |
| `public/core/core-dialogs.css` | Windows and small elements of the chat: the window shell and its shared parts, account settings, plans and payment, limits, Ultra credits, team, the model menu, the install card, the announcement, the image viewer (section 15). Also holds the page base (global reset, `button`, `svg`) that used to come from the bridge (15.2). Loaded last. |
| `public/js/25-core-dialogs.js` | Glue for section 15: turns the class `on` of `#modal` into a Core dialog, turns between sections, picks the plan plate and calls `Core.lit`, keyboard of the model menu, the image viewer, the keyboard inset on a phone. No chat logic, no texts. |
| `public/offline.html` | The offline page shown by the service worker. Core look, self-contained: token values are written in the file (15.13). |
| `tests/core-dialogs.test.js` | Automated checks of section 15. |

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
- Tooltips appear on hover after 400 ms and at once on keyboard focus, never on touch. Inside `.core`, an ordinary `title` attribute is converted to a Core tooltip the first time the pointer reaches it (the text is kept as `aria-label` when the element has no text). `data-core-native` on the element or an ancestor turns that off. Since step 5 the chat page and its scripts write `data-core-tip` themselves, and a test forbids `title` there (15.10); the conversion remains for other pages.

### Notification toast

```js
CoreUI.toast('Text');
CoreUI.toast({ text: 'Saved', tone: 'ok' });                       // tone: 'ok' | 'warn' | 'bad'
const t = CoreUI.toast({ text: 'Chat deleted', action: { label: 'Undo', onClick() {} }, duration: 8000 });
t.dismiss();
```

The capsule flies out of the Core's position (`--core-x/y`), rests at the top centre, and flies back. Hover or focus pauses the timer; a click dismisses. `duration: 0` keeps it until dismissed. At most three are visible. Errors are announced as alerts to screen readers. Since step 5: a message that is already visible (same tone, text and action label) is not shown a second time, its timer restarts; the chat's own `toast(text, tone)` calls this function (15.9).

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

Two things to know when replacing native calls (step 5 replaced all of them in the scripts the chat page loads, 15.11; other pages still have theirs):

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
| `Core.lit(k)` | Step 5. How bright the Core stays under an open dialog, from 0 (as usual) to 1 (15.5). Without arguments: returns the current value. |
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

The scene keeps three attributes on `<html>` up to date, for CSS: `data-core-scene` = `boot` (not started), `live` (3D) or `glow` (fallback); `data-core-is` = the state shown now; `data-core-place` = the place shown now (`custom` for a point). Since step 5 there is a fourth, `data-core-lit` = `1`, `2` or `3`, present only while `Core.lit()` is above zero (15.5).

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

- If you raise `A_DARK`, `A_PAPER`, `FLASH`, a state's `bright`, or the aura constants, run the measuring test (below). Do not judge by eye. Since step 5 `Core.lit()` raises the brightness of the receded state towards the constant `LIT` (0.9 of rest); this was not measured (15.16), so run the test before relying on it and before raising `LIT`.
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

> Since step 5 the list below is history: the two old stylesheets at its top are gone from the page, `core-dialogs.css` and `25-core-dialogs.js` were added at the end, and several `?v=` numbers were raised. The current tags are in 15.1.

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

- The chat page no longer loads `css/chat-main.css`, `language.css`, `theme/*.css`, `growth.css`, `limits.css`, `chat-ui.css`, `ultra.css`, `anim.css`, `chat-visual.css` or an inline `<style>`. The files stay on disk until step 8; other pages still use some of them. Since step 5 the page also loads neither `tokens.css` nor `css/chat-legacy.css` (15.1).
- The Core files have `?v=` on this page (the showcase loads them without a version). Raise the number in `chat.html` **and** `en/chat.html` whenever one of them changes. Step 4 raised `core-tokens.css`, `core-components.css` and `chat-legacy.css` to 2. After step 5 the page has `core-scene.css`, `core-chat.css`, `core-ui.js`, `core-scene.js` and `24-core-work.js` at 2 and the new `core-dialogs.css` and `25-core-dialogs.js` at 1 (15.1).
- **English mirror.** The brief for the redesign says `public/en` is generated by `scripts/build-i18n.py`. In the archive this is not true any more: running the generator rewrites 19 English files and replaces finished translations with half-translated text, because `locales/en.json` is far behind the hand-finished English files (and `en/chat.html` used an older stylesheet, `css/chat-main-en.css`). Step 3 therefore did **not** run the generator. `en/chat.html` received exactly the same structural edits as `chat.html`, applied by one script to both files. The new script `23-core-chat.js` and the two changed scripts (`15-growth.js`, `19-limits.js`) have no English copies: the English page loads them from `/js/`, like `15`…`22` before. Until the catalogue is repaired, mirror every edit of a Russian page or of `js/00…14` in `public/en` by hand, and do not run the generator. One line of the generator was fixed in step 3 so that it is safe to run once repaired: it switched the page language by replacing the exact string `<html lang="ru">`, which a Core page no longer has (its `<html>` carries `class="core"` and `data-core-*`); it now replaces the start of the tag, as `server.js` does. Tests that look for the tag must allow attributes too (`/<html lang="en"[ >]/`).

### 13.2 The bridge: `chat-legacy.css`

> Since step 5 the chat page does not load the bridge: every part it styled is in `core-dialogs.css` (section 15), and its global rules moved to the top of that file (15.2). The text below describes steps 3 and 4. The file and its script are still on disk, and `tests/core-chat.test.js` still checks the file against its sources (15.1): delete them only together with that check.

Old rules for migrated and not-yet-migrated parts were mixed in nine files. `scripts/build-chat-legacy.py` reads those files in their old order and keeps only the rules of parts that still have the old look: dialogs, the model menu, tooltips, toasts (step 5). The parts of step 4 left the bridge (14.7).

- `DROP` in the script is the list of selector heads that `core-chat.css` now owns. A step that migrates a part adds its selectors to `DROP`, runs the script, and raises `?v=` of `chat-legacy.css` in both pages. When nothing is left, delete the file and the script (step 8).
- `KEEP` protects rules that start with a migrated name but style an old part (`.brow .menu`). `CLAIM` (step 4) is the opposite list: a selector that mentions one of its classes anywhere is dropped. `REWRITE` is empty since step 4 (it narrowed one rule that styled both inline code and code blocks).
- `SCOPE`: old parts used to inherit font and colour from `<body>`. `<body>` now belongs to Core, so the roots of old parts get those two properties explicitly. Add a root here if an old part looks wrong after a change of `<body>` styles.
- `cursor:pointer` becomes `cursor:var(--core-cursor-action)` in the output, so the spark cursor covers the whole page.
- `python3 scripts/build-chat-legacy.py --check` fails when the file is out of date; `npm test` runs it.
- Verified by comparing computed styles of every element of the old parts between the step 2 build and this build (code block, thinking row, work log, result card and window, model menu, account, plans, project and limits dialogs, toast, computer popover; both themes; 1440 and 390): no differences except the shared icon button `.ib`, which is new everywhere, and the focus ring.

Old parts (since step 4: only dialogs, the model menu and the toast; since step 5: none on the chat page) sit on the new scene and stay readable because they bring their own opaque backgrounds. Since step 5 the model menu is styled in `core-dialogs.css` (15.6), so of the three seams below only `[hidden]` is still in `core-chat.css`. Three seams are handled in `core-chat.css`: the model menu opens from the right edge of its button; a closed model menu is `visibility:hidden` (its items used to stay in the Tab order); `[hidden]` is enforced for the page.

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
- **Light scope.** `CoreUI.light.scope('.side, .box-glass, #sugg, .pane-in')` (step 4 added the result window). Since step 5 `25-core-dialogs.js` appends `#menu, .pwa-card, .ann` to this list. The windows themselves (`#modal`, `#ulWin`, `#zoomWin`) were not added (15.3, 15.16).
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

The window "Облачный компьютер" (`.clw`, inside the shared window `#modal`; since step 5 that shell is a Core dialog, 15.3):

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
- **Buttons inside these parts** (`.btn`, `.btn.pri`): the class is shared with step 5 dialogs and its old rule stayed in the bridge (since step 5 the shared rule is in `core-dialogs.css`, written with `:where()` so that it never out-ranks these parts, 15.4), so `core-work.css` sets it completely inside `.msg`, `.pane`, `.clw`, `.agset`. `.btn.pri` is filled with `--core-on`, not amber.
- **Changes in the folder and on the computer** `details.fsop` / `.agop`: summary with the action (human), the path or command (machine), `+N −N`, and the state on the right (`.fss`). `.ask` is a permission prompt: `--core-warn-soft` plate, open, buttons right-aligned, "allow" bright; a deletion (`.agdanger`) asks in `--core-bad-soft`. `.run` shows a breathing particle, `.ok` / `.err` status colours, `.no` / `.undone` strike the path through. Diffs (`.fsdiff .dl.add/.del`) use status colours.
- **Generated media** `.gens` › `.gen`: image or video on a dense tile, the download button appears on hover or focus (always on touch). Being made (`.gen.draw`): `core-gather` in the shape of the picture, a caption with a breathing particle, the time in the machine voice, and for video a 2 px progress line.
- **Sources and tables** were done in step 3 (`.srcs`, `.tbl`) and are unchanged.
- **Disclosure rows.** Every `details` of this step (`.wl`, `.think`, `.run`, `.fsop`, `.fileb`, `.validation-box`, version diffs) has the same chevron from `--core-glyph-chevron`, turning on open.

### 14.7 For step 5

> Since step 5 every point below is closed in the code: the chat page no longer loads the bridge (15.1); the shell of the two windows is a Core dialog (15.3); the shared rules stand at the top of `core-dialogs.css` (15.2); the closed window is `hidden`, so `#dclose` is out of the Tab order; `confirm()` is the capsule (15.11); the toast is the Core capsule (15.9). The list is kept as the record of what step 4 handed over. What was not verified is in 15.16.

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

---

## 15. Windows and small elements of the chat (step 5)

Step 5 moved everything that opens over the chat or sits in its corners: the shared window with all its contents (account settings, plans and payment, limits, team, project, sharing), the Ultra credits window, the model menu, notifications, tooltips, the browser's own `confirm` / `alert` / `prompt`, the image viewer, the install card, the announcement, and the offline page. Since this step the chat page loads no old stylesheet. Checked by `tests/core-dialogs.test.js`.

The step was stopped early twice at the owner's request. The handover note says the archive runs and the chat page works; this section was written afterwards, during step 6, from the code and the handover notes. What nobody looked at is listed in 15.16 and is long: read it before relying on a surface.

### 15.1 Files and loading

| File | What it holds |
| --- | --- |
| `public/core/core-dialogs.css` | All windows and small elements of the chat, and the page base that used to come from the bridge (15.2). Loaded last, after `core-work.css`. Tokens only, no own blur, hooks untouched. Private values are `--dlg-*`. |
| `public/js/25-core-dialogs.js` | Glue without chat logic and without texts, one file for RU and EN: the bridge "class `on` ⇄ Core dialog", the turn between sections, the choice of a plan plate and `Core.lit`, the keyboard of the model menu, the image viewer, the light scope, the keyboard inset for phone sheets. Deferred, loaded last. Does nothing when `window.CoreUI` is absent. |
| `public/core/core-scene.js`, `core-scene.css` | New command `Core.lit(k)` and its fallback rules (15.5). |
| `public/core/core-ui.js` | Three fixes: a closed capsule no longer swallows the next click (its layer gets `pointer-events:none` at once); Enter works after a click on the capsule's text; a tooltip shown on keyboard focus is re-placed, not hidden, by the scroll that the focus caused. The toast no longer stacks a message that is already visible (15.9). |
| `public/offline.html` | The offline page in the Core look, self-contained (15.13). |
| `tests/core-dialogs.test.js` | 11 checks of this section (15.15). |

What `public/chat.html` loads now (the English page is the same with `/en/` script copies):

```html
<html lang="ru" class="core" data-core-place="center" data-core-is="rest">
<link rel="stylesheet" href="/core/core-tokens.css?v=2"><link rel="stylesheet" href="/core/core-base.css?v=1"><link rel="stylesheet" href="/core/core-components.css?v=2"><link rel="stylesheet" href="/core/core-scene.css?v=2">
<link rel="stylesheet" href="/core/core-chat.css?v=2">
<link rel="stylesheet" href="/core/core-work.css?v=1">
<link rel="stylesheet" href="/core/core-dialogs.css?v=1">        <!-- step 5: the last stylesheet -->
<script defer src="/core/core-ui.js?v=2"></script><script defer src="/core/core-scene.js?v=2"></script>
<script src="/language.js?v=2"></script>
<script src="/announce.js?v=2" defer></script>
…
<body><div class="core-scene" aria-hidden="true"></div>
…folder.js?v=5, agent.js?v=12, cloud.js?v=7, then chat scripts js/00…22 as before (not deferred)…
<script defer src="/js/23-core-chat.js?v=2"></script>
<script defer src="/js/24-core-work.js?v=2"></script>
<script defer src="/js/25-core-dialogs.js?v=1"></script>         <!-- step 5 glue: the last script -->
```

- **Gone from the page:** `/tokens.css` (the old `--p-*` tokens) and the bridge `/css/chat-legacy.css` (13.2). The page has no inline `<style>` and no `var(--p-…)` in its markup. A test allows only `/core/core-*.css?v=N` stylesheets on the two chat pages, with `core-dialogs.css` last.
- **Still on disk:** `public/tokens.css` and the old source stylesheets (`growth.css`, `limits.css`, `ultra.css`, `chat-ui.css` and the rest of 13.1): other pages use them, they go in step 8, and a test requires them to exist. `public/css/chat-legacy.css` and `scripts/build-chat-legacy.py` are also still there although no page loads the bridge any more. Whether to delete them now or in step 8 was left open. They cannot simply be deleted: `tests/core-chat.test.js` still reads the bridge, expects the step 5 selectors in it (`.modal{`, `.dlg{`, `.menu{`, `.toast{`, …) and runs `build-chat-legacy.py --check`, and `tests/chat-ui.test.js` expects `'chat-ui.css'` among the script's sources. Deleting the bridge means rewriting those two checks in the same change.
- **Versions.** `?v=` was raised for every static file the step changed, in every page that loads it (the handover note counts 45 files). When you change one of the Core files, raise it in `chat.html` **and** `en/chat.html`; tests compare the two pages.
- **English mirror.** As in steps 3 and 4, `scripts/build-i18n.py` was not run (13.1): every edit was made by hand in the Russian file and in its English copy. `core-dialogs.css` and `25-core-dialogs.js` have no English copies.
- **Service worker.** `public/sw.js` names no stylesheet, only folders (`core` is among them), so nothing in it refers to the removed files.

### 15.2 The page base moved out of the bridge

The bridge used to supply a few global rules that steps 3 and 4 relied on (14.7). They now stand at the top of `core-dialogs.css`, **not** scoped by `.core`:

```css
*{box-sizing:border-box;margin:0;padding:0}
button,input,textarea,select{font:inherit;color:inherit}
button{background:none;border:0;cursor:var(--core-cursor-action)}
svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;flex:none}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
@media (max-width:860px){textarea,input,select{font-size:16px}}   /* below 16 px iOS zooms the page on focus */
```

- Any page that loads `core-dialogs.css` gets this reset and the rule that every `svg` is an 18 px stroke icon. A filled drawing must undo it (the QR code does: `.tfa-qr svg{stroke:none}`).
- A page that does **not** load `core-dialogs.css` gets none of it. The parts of steps 3 and 4 rely on these rules (14.7), so `core-chat.css` and `core-work.css` should not be loaded without it.
- Two leftovers of the same kind live next to them: `.core #ptag` (padding of the project tag in the input row) and `.core .p-sr` (visually hidden text).

### 15.3 The window shell

The chat has one shared window, `#modal`, filled by many scripts, and one window of its own, `#ulWin` (Ultra credits). Both are Core dialogs now (section 6): born from the click point, the Core recedes, focus goes inside and stays there, Esc and a click outside close, focus returns to the opener, the page behind does not scroll, a sheet from the bottom up to 600 px.

```html
<div class="core-dialog modal" id="modal" hidden>                       <!-- direct child of <body>; a test checks it -->
  <div class="core-dialog__pane dlg" role="dialog" aria-modal="true" aria-labelledby="dtitle">
    <div class="core-dialog__head dhead"><h2 class="core-dialog__title" id="dtitle"></h2>
      <button type="button" class="core-btn core-btn--icon core-btn--quiet" id="dclose" aria-label="Закрыть" data-core-tip="Закрыть" data-core-tip-key="Esc">…</button></div>
    <div class="core-dialog__body dbody" id="dbody"></div>
  </div>
</div>
```

**The contract with chat scripts did not change.** A script opens the window exactly as before, and closes it with `closePanel()`:

```js
dlgW(true);                                   // true = wide (880 px), false = 520 px; js/06-pane.js. Account adds .accdlg (760 × 640)
$('dtitle').textContent = 'Тарифы Premier';
$('dbody').innerHTML = …;
$('modal').classList.add('on');               // 25-core-dialogs.js turns this into CoreUI.dialog.open(modal, { origin })
```

How the bridge in `25-core-dialogs.js` works:

- A `MutationObserver` on the class of `#modal`: `on` added → `CoreUI.dialog.open`; `on` removed → `CoreUI.dialog.close`. The class `on` stays the single source of truth: scripts test `$('modal').classList.contains('on')`, and `language.js` refuses to switch language while `#modal.on` exists.
- Esc, a click outside and `closePanel()` all end in `core:beforeclose`, where the bridge removes `on`. If a script adds `on` again while the window is still collapsing, the window reopens when the collapse ends.
- **Birth point.** The bridge remembers the last `pointerdown` (or the focused control on Enter / Space) for 6 seconds and passes it as `origin`, because many windows open only after a request to the server, later than `core-ui.js` itself remembers a click.
- **Titles are load-bearing.** Scripts recognise the open window by the text of `#dtitle` (`13-billing.js` closes the plans window after a payment by its title; `19-limits.js` re-renders itself by its title). Do not change a title without those comparisons.
- **Turn between sections.** When `#dbody` or `#dtitle` changes while the window is open (plans → reset payment, limit → plans), `.dlg` gets `data-face="next"`: the body turns in (`@keyframes dlg-face`, `--core-dur-3`) and the pane glides from the old height to the new one. In account settings a click in `.acc-nav` sets `data-face="next"` or `"prev"` on `#accBody` by direction; the account pane has a fixed size, so it does not jump. Both are skipped under reduced motion.
- **Phone keyboard.** `--dlg-kb` is the height of the on-screen keyboard where the browser does not shrink the page itself (iOS). The script measures it from `visualViewport` (more than 80 px counts) and writes it on every `.core-dialog`. Up to 600 px `core-dialogs.css` lifts the sheet by it, for `.modal` and `.ulw` only. A new window with a field must add its class to those two rules.
- **Ultra credits** (`js/21-ultra.js`): `#ulWin.core-dialog.ulw` › `.core-dialog__pane.ulw-dlg` › `.core-dialog__head.ulw-head`, `.core-dialog__body.ulw-body#ulwBody`, `.core-dialog__foot.ulw-foot#ulwFoot`. It calls `CoreUI.dialog.open(root)` / `.close(root)` itself and has no bridge.
- **Light.** The script appends `#menu, .pwa-card, .ann` to the light scope of 13.4. The windows themselves are not in the scope list: they take the Core's position from the place styles.

To add a window: fill the shared window as above (preferred, nothing else to do), or build a `core-dialog` as in section 6 and open it with `CoreUI.dialog.open`; in the second case `#modal.on` does not know about it.

### 15.4 Shared parts of windows

They are written with `:where()`, so their specificity is that of `.core` alone: the family rules below them and the parts of step 4 (`.msg`, `.pane`, `.clw`, `.agset` set their own `.btn`, 14.6) win without `!important`.

| Private value | Is |
| --- | --- |
| `--dlg-gap` | `--core-s-4`, the step between blocks of a window. |
| `--dlg-plate` | `--core-fill-1`, the fill of a plate inside a window (card, row, summary). No blur. |
| `--dlg-edge` | `inset 0 0 0 1px var(--core-line)`, the edge of a plate. |
| `--dlg-edge-2` | `inset 0 0 0 1px var(--core-line-2)`, the edge of a plate that can be pressed or is selected. |
| `--dlg-kb` | Keyboard height, written by the script (15.3). |

| Part | Hooks | Look |
| --- | --- | --- |
| Button | `.btn`, `.tm-btn`; small `.sm`, `.mini` | Same as `core-btn`: glass fill, hairline. |
| Main action | `.btn.pri` | Inside `.modal` / `.ulw`: amber, one per window (15.14). Outside windows: filled with `--core-on`, as in step 4. |
| Destructive | `.btn.danger`, `.dangerb`, `.bad`; `.dangerb.solid` | Error colour on text and edge over `--core-bad-soft`, never a solid red fill. |
| Quiet text button | `.gw-tr`, `.tm-link`, `.tm-rm`, `.api-ccopy`, `.ulw-back`, `.kn-del` | Secondary actions inside plates. |
| Field | `.field` › `span` (label), `small` (hint), `input` / `textarea` / `select`; also `.promo input`, `.gw-sh input`, `.tm-inp`, `.tfa-form input` | Well, hairline, focus = `--core-focus` border and a soft ring. |
| Switch | `label.check`, `.lm-sw` with a native checkbox | The handle is the spark glyph; "on" is light (`--core-on`), not colour. |
| Choice of one | `.seg`, `.pm-per`, `.vrate`, `.ulw-seg`, `.tm-seg` › `button` | Segmented control in a well; selected = `[aria-checked=true]` or `.on`; `small` inside is the machine voice (discount). |
| Tag | `.pc-badge`, `.lockt`, `.cu-tag`, `.ul-tag`, `.tm-st`, `.lm-st`, `.plan .tag`, `.gw-trial .tag`, `.ulw-pack .tag` | Machine voice, 20 px. Status: `.lm-st.ok` / `.tm-st.on`, `.lm-st.wait`, `.lm-st.bad`. |
| Text lines | `.dsec` (caption of a group), `.msgline` (+ `.err`, `.ok`; hidden when empty), `.pnote` and its kin (notes), `.hr` | Human voice, three text levels. |
| Reason, warning | `.reason`, `.ulw-alert` (+ `.err`) | Status plate (`--core-warn-soft` / `--core-bad-soft`), text in the main colour. |
| Plate | `.acc-hero`, `.acc-plan`, `.lm-sec`, `.tm-box`, `.tfa-box`, `.refcard`, `.gw-trial`, … | `--dlg-plate` + `--dlg-edge`, radius `md`. |
| Row | `.acc-row` | Name and note on the left, action on the right. |
| Loading | `.p-skel` › three `i` | Rows of points gather (`core-gather`) and breathe, instead of grey bars. |

**Order of buttons** in `.btns` (right-aligned): destructive first, on the left, split off by `<div class="sp">`; then Cancel; the main action last. Up to 600 px the buttons share the row width.

Families restyled on these parts, all in `core-dialogs.css` under numbered comments: account settings (`.acc*`; profile, plan with the referral card `.refcard`, memory, voice, watermark, API, model status `.mst*`, security with two-factor protection `.tfa*`, account deletion), project and sharing (`#projF`, `.kn*`, `.gw-sh`), plans (15.5), limits (15.7), Ultra credits (`.ulw*`), team (`.tm*`), the model menu (15.6), cards over the page (15.12). The QR code `.tfa-qr` is black on white in both themes on purpose: the file's only literal colour.

### 15.5 Plans and payment, `Core.lit`

The plans window is built by `openPlans()` in `js/13-billing.js`. Step 6 builds the landing prices to match these plates.

```html
<div class="pm-per" role="radiogroup">                              <!-- period switch, centred -->
  <button type="button" role="radio" aria-checked="true" class="on" data-per="3">…<small>−10%</small></button>…
</div>
<div class="gw-trial"><span class="tag">…</span><div><b>…</b><small>…</small></div><button class="btn pri" data-buy="trial">…</button></div>
<div class="plans">                                                  <!-- .plans.n4 with four or more plans: two columns -->
  <div class="plan hot cur">                                         <!-- .hot recommended, .cur the user's plan; .fwd is set by the script -->
    <span class="tag">Популярный</span>
    <div><h3>Pro <span class="pc-badge">сейчас</span></h3><p>…</p></div>
    <div class="price"><s>990</s>790 ₽ <small>/ 30 дн.</small></div>
    <div class="pm-month">≈ … в месяц · −10%</div>                   <!-- only for a longer period -->
    <div class="gw-first">…</div>                                    <!-- first-purchase offer, when it wins -->
    <ul><li><svg>…</svg><span>…</span></li>…</ul>
    <button class="btn pri" data-buy="pro">Оплатить 790 ₽</button>
    <button type="button" class="gw-tr" data-buy="trial:pro" data-core-tip="…">…</button>   <!-- trial link, when offered -->
  </div>…
</div>
```

- **Depth.** `.plans` is a grid of three columns (`gap: --core-s-3`). Every `.plan` rests at `scale(.97)` on `--core-fill-1`; the edge gets lighter by order: first `--dlg-edge`, second `--dlg-edge-2`, third 70 % `--core-text-3`. The plate in front (`.plan.fwd`) is `transform:none`, `--core-fill-2`, a 1 px `--core-text-2` edge and `--core-shadow-near`; the move takes `--core-dur-3`.
- **Which plate is in front.** `plans()` in `25-core-dialogs.js`: the plate under the pointer (not touch), with focus inside, or clicked; before any of that the `.hot` plate, else `.cur`, else the first. It sets `.fwd` on one plate and `data-sel="<index>"` on `.plans`. Until the script has run, CSS puts `.plans:not([data-sel]) .plan.hot` in front. The choice survives a re-render of the window (changing the period or the payment method rebuilds `#dbody`).
- **One amber button.** `.plan .btn.pri` is glass. Amber is only `.plan.fwd .btn[data-buy]:not(:disabled)` (and the `.hot` fallback above). A disabled button (free plan, "payment soon") is never amber, so with the free plate in front the window has no amber at all. The trial card's button `.gw-trial .btn.pri` is glass too.
- **One dominant price.** `.plan .price` is `--core-machine-5`, weight `--core-w-2`, tabular figures, `--core-text`. The old price `s` is a separate small line **above** it (`flex:0 0 100%`, `--core-human-2`, `--core-text-3`, 1 px strike), in the human voice because the dotted zero of JetBrains Mono reads as an eight under a strike. A plate without an old price gets an empty line of the same height (`.price:not(:has(s))::before`), so prices of all plates stand on one line. The period `small` is `--core-machine-1`, `--core-text-3`. `.pm-month` and `.gw-first` are `--core-machine-1`, `--core-text-2`.
- **The rest of a plate.** Name `h3` in `--core-machine-3`; `.tag` at the top right; features `ul` in `--core-human-1` under a hairline, 14 px check marks in `--core-text-3`; the button is full width, `--core-h-lg`. The trial link `.gw-tr` is a centred underlined quiet button under it; plates without the link get a spacer (`.plans:has(.gw-tr) .plan:not(:has(.gw-tr))::after`), so buttons align.
- **Period switch** `.pm-per`: the shared segmented control, `width:max-content`, centred; buttons are `role="radio"` with `aria-checked` and `.on`, the discount in `small`. **Payment method** `.paym` › `.seg` with `aria-checked`.
- **Up to 760 px:** one column, no scale, no spacers, `.pm-per` full width, the trial card stacks.
- **Payment states.** The product has no separate waiting, success or failure windows. Waiting is the button's text plus `#payMsg` (a plate when not empty; `.err` is a `--core-bad-soft` plate with a cross, `.ok` a `--core-ok-soft` plate). A confirmed payment gives one `Core.pulse('flash')` (`13-billing.js`) and a notification.

**`Core.lit(k)`** (`core-scene.js`): how bright the Core stays under an open window. `k` is clamped to 0…1; without an argument it returns the current value; it returns `Core`.

- It acts only while the Core is `receded` (a dialog is open): the target brightness becomes `0.42 + (0.9 − 0.42) · k`, where 0.42 is the receded brightness and 0.9 the ceiling `LIT`. Heat, size and form of the receded Core do not change.
- It writes `data-core-lit` on `<html>`: `"1"` up to 0.4, `"2"` up to 0.75, `"3"` above; the attribute is removed at 0. The fallback glow follows in steps: `:root[data-core-is=receded][data-core-lit="1|2|3"] .core-scene{--core-glow: .56 | .68 | .8}` (receded without it: .45).
- The plans window calls `Core.lit(i / (n − 1))` for the plate in front (three plates: 0, 0.5, 1), and `Core.lit(0)` when the plans leave the window and after it closes. Nothing else uses it.
- **Readability (12.10).** The reasoning in the code: only brightness is raised, and never above 90 % of the resting brightness, while 12.10 holds for the brightest moment of the brightest state, so the limit should hold. This was **not measured** (15.16).

### 15.6 The model menu

`#menu.menu.core-glass.core-glass--near[role=menu]` next to `#mbtn`; chat scripts still open it by toggling the class `open`. Built by `js/04-render.js`, decorated by `js/20-chat-ui.js` and `js/21-ultra.js`:

`.core-menu__scroll` › `button.opt[data-m][role=menuitemradio][aria-checked]` › `span.core-mini[data-core-model]` + `div` (`b` name in the machine voice, `small` note) + `svg.ck`.

| State | Hook | Look |
| --- | --- | --- |
| Selected | `.opt.on` | Lit row, the check mark `.ck` shows. |
| Locked on the current plan | `.opt.locked`, `.lockt` | The name dims, the mini core is at 40 %, a tag names the plan that opens it. The click still leads to the plans window. |
| Having issues | `i.cu-dot.bad`, `.core-mini[data-core-cond=flicker]` or `=dark` | The mini core flickers, or is dark when the model is down; the words («Есть сбои») stand next to the name as a `--core-bad-soft` tag. For a healthy model the words of `.cu-dot` are visually hidden and only read aloud. |
| No models | `div.opt.opt-none` | Two lines of text, not a button. |

- Closed: `opacity:0; visibility:hidden; pointer-events:none`, so its items are out of the Tab order. Open: grows from the bottom right corner over `--core-dur-2`.
- Keyboard (`25-core-dialogs.js`): Arrow Down / Up on `#mbtn` opens the menu; opened from the keyboard, focus goes to the selected row. Inside: arrows cycle, Home, End; Esc and Tab close and return focus to `#mbtn`; choosing with the keyboard returns focus too. `aria-expanded` on `#mbtn` follows the class.
- Up to 860 px the menu is a sheet from the bottom (72dvh at most, safe area, rows of 52 px). The dimming `.cu-scrim.on` and the swipe down are in `20-chat-ui.js`.
- The same mini core with `data-core-cond` marks each row of the "Models" section of account settings (`.mst-row`).

### 15.7 Limits

The ring of section 6 replaces the bars. One helper builds it: `gwRing(left, L, label, size)` in `js/15-growth.js` (`size`: default `'sm'`, `'md'` = 28 px without a modifier, `'lg'`).

- Account, plan section: `.acc-use` › ring `sm` + label + figures. Limits window (`js/19-limits.js`): `.lm-use` › ring `md`. "Daily limit reached" (`.gw-end`): a spent `lg` ring (ash), the time to reset `.gw-clock` in `--core-machine-5`, buttons stacked full width, the first one («continue», to the plans) amber.
- A used-up line is `.acc-use.out` / `.lm-use.out`: the figures turn `--core-bad`.
- Thin 2 px lines remain where a ring has no room: referral progress `.rc-prog .pc-bar` and the Ultra balance `.ulw-bar`. `core-dialogs.css` also still has rules for `.lm-meter`; no script of the chat page builds it any more.

### 15.8 The image viewer

A click on `img[data-zoom]` used to open a blank browser tab. `js/09-events.js` now calls `premierZoom(img)` when it exists; `25-core-dialogs.js` defines it and builds the window on first use:

`#zoomWin.core-dialog.zoom` › `.core-dialog__pane.zoom-pane[role=dialog][aria-labelledby=zoomName]` › `.zoom-head` (`#zoomName`, `#zoomOpen`, `#zoomClose[data-core-close]`) + `.zoom-stage` › `img#zoomImg`.

- It is born from the picture itself (`origin: img`), sized by the picture (320 to 1200 px wide). The picture lies on dense glass with nothing drawn over it. Esc, the close button, a click outside or a click on the picture close it.
- The name is the picture's `alt`. `#zoomOpen` opens the old blank tab (a `data:` address cannot be opened directly). The two buttons take their labels from buttons the page already has (`#pOpen`, `#dclose`), so the script holds no texts.

### 15.9 Notifications

`toast(text, tone)` in `js/07-attachments.js` (and its English copy) is the one function every chat script calls. It now shows the Core capsule:

```js
function toast(t, tone) {                       // tone: 'ok' | 'bad' | 'warn' | none
  if (t == null || t === '') return;
  if (window.CoreUI) return CoreUI.toast(tone ? { text: t, tone } : { text: t });
  (toast.q = toast.q || []).push([t, tone]);    // core-ui.js is deferred: earlier calls wait for DOMContentLoaded
  …
}
```

- The element `#toast` is gone from both pages. `window.toast` still serves `language.js`; the pass-through helpers `say` in `16-pwa.js` and `18-2fa.js` forward the tone.
- Tones were given where the meaning was clear: `'ok'` for a completed action, `'bad'` for a failure, `'warn'` only for limits (browser storage, project files); mode switches stay neutral. The handover note counts 95 Russian / shared call sites: 29 ok, 35 bad, 5 warn, 24 neutral.
- The tone is readable without colour: in `core-dialogs.css` the mark of `bad` is a cross and of `ok` a check (`.core-toast[data-tone] .core-toast__mark`). `bad` is announced as `role="alert"`, the rest as `status`.
- The same message (tone, text and action label) arriving while it is still visible does not stack: the visible capsule restarts its timer.
- With an announcement on screen the notifications stand under it (`.core:has(body>.ann) .core-toasts`).

### 15.10 Tooltips

No `title` is written on the chat page any more. Markup and scripts write `data-core-tip` (and `data-core-tip-key` for a key), and keep or add `aria-label`:

```html
<button class="ib" id="pReload" data-core-tip="Перезапустить" aria-label="Перезапустить">…</button>
<button … id="dclose" aria-label="Закрыть" data-core-tip="Закрыть" data-core-tip-key="Esc">…</button>
```
```js
b.dataset.coreTip = on ? 'Остановить запись' : 'Голосовой ввод'; b.setAttribute('aria-label', b.dataset.coreTip);
```

- Each chat page has 19 `data-core-tip` attributes; scripts had 78 `title` writes (47 Russian / shared, 31 English), now none. The one `title` left is on `<iframe id="pFrame">`, where it is the frame's accessible name.
- A test forbids `title="…"` in strings, `.title =` and `setAttribute('title'` in every script the chat page loads (`document.title` is allowed), and requires `aria-label` on every icon button that has a tooltip.
- Elements that had only a `title` got a name: `.busydot` has `role="img"` and `aria-label`; `<video>` / `<audio>` have `aria-label`.
- The automatic conversion of `title` in `core-ui.js` (section 6) still exists for other pages.

### 15.11 Confirmation capsules instead of the browser's boxes

All 24 call sites of `confirm`, `prompt` and `alert` in the scripts the chat page loads (37 with the English copies) use the capsule of section 6: 17 confirmations, 5 prompts, 2 alerts. Deleting, unpublishing, leaving a team and disconnecting are the destructive variant, with the product's own word on the confirm button where the dictionary has one.

```js
if (!(await CoreUI.confirm({ text: `Удалить проект «${p.name}»? …`, ok: 'Удалить проект', danger: true }))) return;   // async handler
CoreUI.confirm({ text: 'Удалить этот чат?', ok: 'Удалить', danger: true }).then((ok) => { if (!ok) return; … });     // sync listener
CoreUI.prompt({ text: 'Скопируйте ссылку:', value: link });   // the clipboard refused: a field with the link, selected
```

- **One native call is left on purpose:** `language.js` shows its message with `window.toast`, else `CoreUI.alert`, else the browser's `alert`. The last branch is for pages that have neither (login, landing, developers at the time of step 5); on the chat page it cannot run. The test allows exactly this one.
- What changed around the calls, because the native boxes blocked and these do not: `stopPropagation` / `preventDefault` stay before the wait; ids are read before the wait and the object is found again by id after it (a sync may replace objects meanwhile, `08-projects.js`); state is checked again after the wait (`activateVersion` in `06-pane.js`).
- **Esc under a capsule closes only the capsule.** `09-events.js` sets a flag `capsuleEsc` in the capture phase and its global Esc handler skips; `24-core-work.js` returns when the event is already handled or a capsule is open; the outside-click closer of the computer menu in `agent.js` ignores clicks inside `.core-capsule-layer`. A new global Esc or outside-click handler must do the same.
- The full table (file, variant, label, what was tried in the browser) is in `step5-notes/native-boxes-and-tooltips.md`.

### 15.12 Cards over the page

Both are near glass, are in the light scope (15.3) and appear with `core-pop` when motion is allowed.

- **Install card** (`js/16-pwa.js`): `.pwa-card.core-glass.core-glass--near[role=dialog][data-core-at="bottom right"]` › `img`, `.pwa-txt` (`b`, `span`), `.pwa-act` (`.btn.pwa-go`, `.pwa-x`). Fixed at the bottom right; up to 600 px it spans the bottom edge above the safe area.
- **Announcement and maintenance banner** (`announce.js`; only the two chat pages load it today): when `<html>` has the class `core` it builds `.ann.core-glass.core-glass--near[role=status][data-kind][data-core-at="top"]` › `i.ann-mark`, `.ann-tx` (text and link), optional close button `.ann-x`; otherwise it keeps its old inline look. `data-kind` is `info`, `warn`, `success`, `promo` or `maint`; the mark is `--core-warn`, `--core-ok` or `--core-bad` for `warn`, `success`, `maint` and neutral for the rest. **The `.ann` rules are in `core-dialogs.css`:** if a later step adds `announce.js` to another Core page, that page needs these rules, or the banner is unstyled.

### 15.13 The offline page

`public/offline.html` is what the service worker shows when a navigation fails. It is drawn in the Core system but is **self-contained on purpose**: no stylesheet, no script file, because the Core files may not be in the cache when there is no network. The token values are written in the file as its own short names (`--scene:#0B0A08`, `--text:#F4EEE5`, `--heat-3:#FF8B2C`; light theme `--scene:#F1ECE3`, `--text:#1B1714`, `--heat-3:#EE6A12`); a test checks that these values exist in `core-tokens.css`. If a token changes, change it here by hand.

- Scene colour with a faint glow, a cooled Core drawn as an inline SVG of ash points, Onest, one amber action, both themes by the system setting, safe areas, a focus ring, no transition under reduced motion. Texts and behaviour are unchanged (Russian, English by the browser language, reload when the network returns).
- `sw.js` puts `/offline.html` in its cache at install time and the cache name is still `premier-v1`, so an installed app gets the new page only when the service worker reinstalls (15.16).

### 15.14 Amber on these surfaces

The rule of section 3 holds: amber is the one main action of a window, and the place where the AI works. In `core-dialogs.css` the heat tokens appear in two families only:

- `.core :where(.modal,.ulw) :where(.btn,.tm-btn):where(.pri)` — the main action of a window (rest, hover, active).
- `.core .plan.fwd .btn[data-buy]:not(:disabled)` and `.core .plans:not([data-sel]) .plan.hot .btn[data-buy]:not(:disabled)` — the buy button of the plate in front.

Where a window has several `.pri` buttons, the family rules cool the extra ones to glass: `.plan .btn.pri`, `.gw-trial .btn.pri`, and a guard for a second `.pri` in the "limit reached" window, `.gw-end .gw-acts .btn.pri~.btn.pri` (today's markup has one). The loading rows `.p-skel` use `--core-point`. The test fails when a rule that mentions `--core-heat-1…5` has a selector outside this list: `.btn.pri`, `.pri`, `core-ring`, `.lm-ring`, `.ul-`, `.plan`, `.mcore`, `core-mini`, `.gw-`, `.tm-`, `.ann`, `.pay`. The list is wider than today's use; keep new amber inside the two families unless there is a reason.

### 15.15 Tests

`tests/core-dialogs.test.js`, 11 checks, no browser: (1) the chat pages load only Core stylesheets, `core-dialogs.css` and `25-core-dialogs.js` last, same versions in RU and EN, old files still on disk; (2) the window markup and the bridge; (3) no browser boxes in chat scripts except the one in `language.js`, confirmations are awaited, deletions are destructive, the Esc flag; (4) no `title` in pages (except the frame) or scripts; (5) notifications through the capsule with three tones and the queue; (6) `core-dialogs.css`: no literal colours except the QR code, no old tokens, no `cursor:pointer`, durations and fonts from tokens only, no own blur, loops only when motion is allowed, the phone sheet; (7) amber (15.14) and no solid red on destructive buttons; (8) plan plates, `Core.lit` and its ceiling, the payment flash; (9) the model menu and the rings; (10) the viewer; (11) the offline page and `sw.js`.

Older checks rewritten in this step, same intent, asserted in the new system; none deleted:

| File | What changed |
| --- | --- |
| `tests/core-chat.test.js` | The page loads only Core files in order and no old stylesheet; no `#toast`; `gwRing` has a size parameter. Its bridge check still reads `chat-legacy.css` (15.1). |
| `tests/core-work.test.js` | `24-core-work.js` is followed by `25-core-dialogs.js`; the buttons of the result window are expected with `data-core-tip` and `aria-label` instead of `title`. |
| `tests/chat-ui.test.js`, `tests/ultra.test.js`, `test/team.test.js` | The model menu, Ultra and team styles are looked for in `core-dialogs.css`; the pages must not load the bridge. |
| `tests/chat-visual.test.js` | The time of an answer is expected in `data-core-tip`, not `title`. |
| `test/versions-ui-smoke.js` | Clicks the capsule's confirm button instead of auto-accepting a native dialog. Playwright; not part of `npm test`; not run. |
| `tests/dev-cabinet-ultra.test.js`, `test/twofa.test.js` | Pinned `21-ultra.js?v=6` and `18-2fa.js?v=1`; now "not lower than 7, same in both languages" and "any number". The first was a real `npm test` failure caused by this step. |

### 15.16 Not verified in step 5

Checked, as the handover note records it: the chat screen outside the windows against the step 4 build by computed styles (light theme, 1440, no differences; the phone comparison was not repeated after its last fix); keyboard in Chrome, dark theme, 1440 (a window opened with Enter takes focus, Tab stays inside, Esc closes and focus returns; with a capsule over a window the first Esc closes only the capsule; the model menu from the keyboard; a tooltip on keyboard focus); each replaced browser box for yes, no, Esc and Enter, with the cloud, team and helper back ends mocked. Everything below is open.

- **The visual review is incomplete.** Screenshots exist for most surfaces at 1440 in both themes and at 390 in the dark theme; about half were looked at. Nothing was captured in the light theme at 390. Most surfaces at 390 and most surfaces in the light theme were not reviewed. Ultra history, the computer-access window, the payment waiting state and the project with files were captured but not reviewed. The voice list was never seen with real voices. Nothing was looked at again after the last CSS fixes. The second session opened two screenshots (plans and account settings, dark, 1440) without a careful review and without fixes. No per-surface status exists; `step5-notes/inventory-before.md` is the list of surfaces before the step.
- **Reduced motion** was not checked for windows.
- **Keyboard** was not checked in plans, limits, Ultra credits, team, project, sharing, the viewer, the install card and the banner.
- **Motion was not seen in motion.** The birth of a window, the turn between sections and the height glide were not recorded or measured; smoothness of opening and closing was not measured.
- **`Core.lit` was not measured against the readability limit of 12.10.** The measuring test needs the `gl` package, which was not installed. Until it is run, the claim in 15.5 is reasoning, not a result.
- **Voice.** The recording state and reading aloud keep their step 3 look; nothing was designed for them.
- **The offline page** was captured once in the dark theme at 1440 and in the light theme at 390 and looked at once. Not checked: keyboard, reduced motion, the English wording. The product has no "update available" state.
- **The service worker cache name** `premier-v1` was not changed, so returning users of the installed app keep the old offline page until the worker reinstalls. Whether to rename the cache is undecided.
- **The bridge files** `public/css/chat-legacy.css` and `scripts/build-chat-legacy.py` are still on disk and still tested (15.1). Delete now or in step 8: undecided.
- **`test/versions-ui-smoke.js`** was changed and never run.
- **The folder `test/`** (outside `npm test`) was being run file by file and was interrupted. `admin-model-ids` fails 5 of 7; `artifact-server` and `assets` ran into the 240 s limit. None of the three was investigated, so it is not known whether step 5 caused them. Passed: `admin-panel`, `agent`, `artifact-edit`, `blog`, `browser-adapters`, `browser-proxy`, `browser`, `chat-policy`, `twofa`, `push`, `team`. The rest was not run.
- **The full `npm test`** was last run before the final three test edits of the step (470 tests, 448 pass, 13 fail, 9 skipped; 12 of the failures are the cloud symlink checks, the helper signing checks and two checks that depend on them, the same groups that failed before any change of the step; the 13th was the version check since rewritten). It was not run again in step 5; "the same 12 and nothing else" after the edits is a prediction.
- The real cloud, team and helper back ends behind the capsules (mocked), real payment providers, the keyboard inset `--dlg-kb` on a real iPhone: the handover note records no check.
- Still open from earlier steps: a real graphics card, Safari, Firefox, a real phone, a screen reader (13.10, 14.8).

Two things seen in the code while writing this section, not tested:

- The model menu becomes a sheet up to **860 px** (`core-dialogs.css`), but `20-chat-ui.js` switches the dimming `.cu-scrim` with its own limit of **700 px**. Between the two the sheet opens without dimming.
- 13.4 expected step 5 to add the windows to the light scope. The code adds `#menu, .pwa-card, .ann` only.
