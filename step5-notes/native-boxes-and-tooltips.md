# Step 5 · script behaviour: native boxes, script-built tooltips, toast tones

Root: `/tmp/hoplite/workspace/premier`. Untouched: CSS, `public/chat.html`, `public/en/chat.html`, `public/core/*`, `desktop/`, `public/theme/`, server files, `?v=` numbers.

## 1. Native boxes replaced

All RU sites are mirrored in the EN copy unless marked n-a (shared file, own RU/EN dictionary, or the EN copy has no such code). Browser = real Chromium, `agent-browser --session a1`, 1440 px; chat delete also at 390 px.

| # | File · where | Kind → variant, `ok` label | Reshaping | EN | Browser: yes / no / Esc / Enter |
|---|---|---|---|---|---|
| 1 | `language.js` · language link, window open, no `toast` | alert → `CoreUI.alert`, native only if no CoreUI | handler already async | n-a | not reachable on chat (toast always exists) — not run |
| 2 | `js/02a-rich.js` · download error `say` | alert fallback → `CoreUI.alert` | none | n-a | not reachable (toast exists) — not run |
| 3 | `agent.js` · menu «Отключить компьютер» | confirm → danger, label = text of the pressed button | already async | yes | ok (click) / ok / ok / Enter on focused Cancel = no |
| 4 | `agent.js` · `#agAuto` change | confirm → plain | handler async; box unchecked on "no" as before | yes | ok / ok / ok / Enter = yes; click outside = no; menu stays open |
| 5 | `agent.js` · `#agFull` change | confirm → plain | same | yes | ok / – / ok / – |
| 6 | `agent.js` · `[data-agall]` in an answer | confirm → plain | already async; `preventDefault` stays before the await | yes | ok / ok / ok / Enter = yes |
| 7 | `cloud.js` · `clPublish` | confirm → plain, two lines | already async | yes | ok / ok / ok / Enter = yes |
| 8 | `cloud.js` · `[data-clunpub]` | confirm → danger «Снять с публикации» / Unpublish | already async | yes | ok / ok / ok / Cancel focused |
| 9 | `cloud.js` · `[data-cltdel]` (one / all) | confirm → danger «Удалить навсегда» / «Очистить» (Delete permanently / Empty) | already async | yes | ok / ok / ok / Tab+Enter = yes |
| 10 | `cloud.js` · `[data-cldel]` | confirm → danger «Удалить» / Delete | already async | yes | ok / – / ok / Tab+Enter = yes |
| 11 | `js/06-pane.js` · `activateVersion` | confirm → plain | function async; both callers ignore the result; "generation running" re-checked after the await | yes | ok / ok / ok / Enter = yes |
| 12 | `js/08-projects.js` · `#projDel` | confirm → danger «Удалить проект» / Delete project | handler async; project removed by id, not by object identity (a sync may replace the objects while the capsule waits) | yes | ok / ok / ok / Tab+Enter = yes (RU and EN) |
| 13 | `js/08-projects.js` · `unpublishArt` | confirm → danger «Снять с публикации» / Unpublish | already async | yes | ok / ok / ok / Enter on Cancel = no |
| 14 | `js/09-events.js` · `[data-del]` chat | confirm → danger «Удалить» / Delete | `.then`; `stopPropagation` stays synchronous; chat id captured before waiting | yes | ok / ok / ok / Tab+Enter = yes; click outside = no (RU, EN, 390 px) |
| 15 | `js/09-events.js` · `#memClear` | confirm → danger «Стереть всё» / Clear all | `.then` | yes | ok / ok / ok / Tab+Enter = yes (also over the real bridged dialog and with reduced motion) |
| 16–17 | `js/10-account.js` · `#refCopy` (2 calls) | prompt → field with the link | none (result unused) | n-a | field holds the link, selected; Enter / Cancel / Esc close |
| 18 | `js/15-growth.js` · `gwCopy` | prompt → field | none | n-a | same |
| 19 | `js/15-growth.js` · `#gwShOff` | confirm → danger, label `GWS.shOff` | already async | n-a | ok / ok / ok / Tab+Enter = yes |
| 20–21 | `js/17-team.js` · `#tmCopy` (2 calls) | prompt → field | none | n-a | same as 16 |
| 22 | `js/17-team.js` · `#tmRelink` | confirm → danger, default labels (dictionary has no short word) | handler async | n-a | ok / ok / ok / Tab+Enter = yes |
| 23 | `js/17-team.js` · `#tmLeave` | confirm → danger, label `L.leave` | handler async | n-a | ok / ok / ok / Tab+Enter = yes |
| 24 | `js/17-team.js` · `[data-tmrm]` | confirm → danger, label `L.remove` | handler async | n-a | ok / – / ok / Enter on Cancel = no |

Set-up: no Docker here, so cloud rows (7–10) were injected into the real cloud window with the real `data-cl*` hooks and a fetch mock answered POST/DELETE; team (20–24) ran against a mocked `/api/team`; the agent was faked as connected; the clipboard was forced to fail to reach the prompts. In every "no"/Esc case no request was sent and state stayed unchanged.

Three extra edits were needed so that "no" and Esc really do nothing:

- `js/09-events.js` (+EN): the global Esc handler closed the window, the phone drawer or the result pane under the capsule. A capture-phase flag `capsuleEsc` now skips it when a capsule is open. Checked with normal and reduced motion.
- `js/24-core-work.js`: its Esc handler removed the agent/folder menu under the capsule. It now returns when Esc was already consumed (`e.defaultPrevented`) or a capsule is open.
- `agent.js` (+EN): the menu's outside-click closer ignores clicks inside `.core-capsule-layer`, so Cancel leaves the menu open as the native box did.

Multi-line text renders correctly (`white-space:pre-line`), seen in the publish capsule.

## 2. Counts

- Native boxes in chat-loaded scripts: **37 before** (24 RU/shared + 13 EN copies) → **1 after**: the last-resort `alert` in `language.js` for pages that have neither `toast` nor CoreUI (login, landing, developers). On the chat page it cannot run.
- Script-built native tooltips: **78 before** (RU/shared 40 `title="` + 7 `.title =`; EN 27 + 4) → **0 after**. These scripts build no `<iframe title>` or SVG `<title>`, so nothing was exempted; `document.title` is untouched.
- Screen-reader names: icon buttons already had `aria-label` (kept). Added `role="img"` + `aria-label` to two status dots that had only a title (`.busydot` in `04-render.js`, `.cu-dot` in `20-chat-ui.js`) and `aria-label` to `<video>`/`<audio>` (`04-render.js`, `02a-rich.js`).
- Read-back: `micUI` in `11-voice.js` (+EN) read `b.title` to fill `aria-label`; write and read now use `dataset.coreTip`.
- No CSS under `public/` selects `[title]` or uses `attr(title)`.

## 3. Toast tones

| | ok | bad | warn | neutral |
|---|---|---|---|---|
| RU/shared, 95 call sites | 29 | 35 | 5 | 24 |
| EN copies, 76 call sites | 20 | 31 | 5 | 20 |

Plus two pass-through helpers (`say` in `16-pwa.js` and `18-2fa.js` now forward a tone): their 8 calls are ok 2, bad 4, ok-or-bad by result 1, neutral 1.

Choices where the rule left room: mode switches (internet, picture mode, badge, auto-reset, full access) and "2FA is off" stay neutral; "payment cancelled or invoice expired" and "this model does not understand images" are bad; "connection restored" and completed disconnect/stop actions are ok; warn only for limits (browser storage, project files).

## 4. Tests

Rewritten:

- `tests/chat-visual.test.js`, «время ответа: сегодня — только время и длительность…»: expected `<span class="cv-meta" title="…">`, now expects `data-core-tip="…"` with the same text.
- `test/versions-ui-smoke.js` (Playwright, not part of `npm test`): after clicking rollback / activate it now clicks the capsule's confirm button; before it relied on auto-accepting the native dialog. Not run: Playwright is not installed here.

Results of the requested files:

- On a clean copy of the baseline commit plus only my files, the result equals the baseline: everything passes except failures that also occur on the untouched commit — `projects-in-chat` (архив папки), `chat-resume` (облачный компьютер: файл из ответа), `test/i18n` (3 subtests), `test/growth` (2 tests).
- Full `npm test` on the same two copies: untouched commit 470 tests, 13 fail; with my files the same 13 plus `CLD-09` in `stage3-agent-server` (real helper process, timing), which passes when that file is re-run alone.
- In the shared tree these additionally fail now, all on `chat.html` details owned by the other engineer: `core-chat` (2: styles with `?v=`, `id="toast"`), `core-work` (2: script order, `title=` on pane buttons), `chat-ui` (1), `ultra` (2: chat-legacy.css), `test/team` (1: old-style bridge).

## 5. Open points

1. `?v=` must be raised for every changed script. RU/shared: `language.js`, `folder.js`, `agent.js`, `cloud.js`, `js/` 01, 02a, 03–11, 13–21, 24. EN copies: `en/folder.js`, `en/agent.js`, `en/cloud.js`, `en/js/` 01, 03–11, 13, 14.
2. Core findings, not fixed (core files are not mine):
   - a closed capsule's full-page layer stays 100–300 ms and still takes pointer events, so a quick next click is swallowed;
   - a tooltip shown on keyboard focus is hidden at once when that focus scrolls the container (message action buttons in the chat); it works outside scrolling areas;
   - pressing on the capsule's text moves focus to the capsule itself, after which Enter does nothing.
3. `24-core-work.js` uses `e.defaultPrevented`, so the agent/folder menu also stays when Esc was consumed by a Core menu or dialog above it. `09-events.js` is limited to the capsule on purpose, because the new dialog bridge relies on that handler.
4. The service worker (`16-pwa.js`) served stale scripts during testing; unregister it and clear caches before checking.
5. EN text «Delete project “name»?» has mismatched quotes; it was there before and texts were not touched.
6. Not checked: dark theme and the look of capsules and toasts; real cloud, team and agent back ends (mocked).
7. No test yet guards "no native box, no `title=` in chat-loaded scripts".
