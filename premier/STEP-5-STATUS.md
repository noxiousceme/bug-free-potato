# Redesign step 5 — status at handover

**This is a working snapshot, not a finished step.** Work was stopped part-way at the owner's request. The archive runs and the chat page works, but the documents are not written and the final checks are not done, so it is not ready to be attached to step 6 as it is. Delete this file and the folder `step5-notes/` when the step is finished.

Nothing was changed in `desktop/` or in `public/theme/`. No old stylesheet was deleted.

## Second session (also stopped early at the owner's request)

A second conversation picked this snapshot up and was stopped after about twenty minutes. It changed four files besides this note (`tests/core-dialogs.test.js`, `public/offline.html`, `tests/dev-cabinet-ultra.test.js`, `test/twofa.test.js`) and nothing else; everything below this section is the first session's note and is still accurate except where this section says otherwise.

**Done in the second session**

- `tests/core-dialogs.test.js` is new: 11 checks for this step (no old stylesheet on the chat page; the window shell and the bridge in `25-core-dialogs.js`; no built-in browser boxes in the scripts the chat page loads, except the one fallback in `language.js`; no `title` written by chat scripts and only the preview frame's `title` in the pages; notifications through the Core capsule with tones; token-only rules in `core-dialogs.css`; amber only on the main action; plan plates and `Core.lit`; the model menu and limit rings; the image viewer; the offline page). All 11 pass. This closes item 4 of "Not done".
- `public/offline.html` is redrawn in the Core system: scene colour, a cooled Core drawn as points, Onest, one amber action, both themes by the system setting, safe areas, focus ring. Texts and behaviour are unchanged. It is self-contained on purpose (token values are written in the file, because the stylesheets may not be in the cache when there is no network). This closes the first half of item 11.
- Two checks that pinned a cache number were rewritten, because step 5 raised those numbers: `tests/dev-cabinet-ultra.test.js` (expected `21-ultra.js?v=6`; now: not lower than 7 and the same in both languages) and `test/twofa.test.js` (expected `18-2fa.js?v=1`; now: any number). The first of these was a real failure of `npm test` caused by step 5.
- Full `npm test` was run on the snapshot **as received** (before the three test edits above): 470 tests, 448 pass, 13 fail, 9 skipped. One failure was the `21-ultra.js?v=6` check, now fixed. The other 12 are the cloud symlink checks (CLD-01, CLD-11/16), the desktop helper signing checks (CLD-07, agent-sign ×3, the repository helper), the folder archive check in `projects-in-chat` and the cloud file check in `chat-resume`: the same groups the first session saw before any change. `public/sw.js` was read: it names no stylesheet, only folders, so nothing in it refers to the removed files (item 13).
- Run after the edits, each file alone, all passing: `tests/core-dialogs` 11, `tests/dev-cabinet-ultra` 5, `tests/core-chat` 8, `tests/core-work` 10, `tests/static-assets` 4, `tests/chat-ui` 3, `tests/ultra` 10, `test/twofa` 8, `test/push` 3, `test/team` 3.

**Not done in the second session** (so still open)

- Full `npm test` was **not** re-run after the test edits. Expected result is the 12 environment failures above and nothing else; that is a prediction, not a run.
- `CORE-DESIGN-SYSTEM.md` is still not updated (item 1). The Russian change note is still not written (item 2). The final report with the inventory is still not assembled (item 3).
- The visual check did not advance. A local server with seeded accounts and a screenshot script were being prepared outside the project and were not finished; no surface was reviewed in the light theme at 390, and reduced motion, the keyboard pass over the remaining windows and motion smoothness are still unchecked (items 6 to 9). Two first screenshots (plans and account settings, dark, 1440) were opened; they were not reviewed carefully and no fixes came out of them.
- The new offline page was captured once in the dark theme at 1440 and in the light theme at 390 and looked at once. It was not checked with the keyboard, with reduced motion or in the English wording.
- The offline page reaches returning users of the installed app only when the service worker reinstalls: `sw.js` puts `/offline.html` in its cache at install time and the cache name (`premier-v1`) was not changed. Whether to rename the cache is undecided.
- Voice recording and reading aloud still have their step 3 look (item 10). The bridge files are still on disk (item 12). `test/versions-ui-smoke.js` is still not run (item 14).
- The older folder `test/` was being run file by file and was interrupted. Finished before the stop: `admin-panel`, `agent`, `artifact-edit`, `blog`, `browser-adapters`, `browser-proxy`, `browser`, `chat-policy` pass; `admin-model-ids` fails 5 of 7, `artifact-server` and `assets` ran into the 240 s time limit. These three were not investigated, so it is not known whether step 5 caused them. The rest of the folder was not run, apart from `twofa`, `push` and `team` above.

## Done

**The chat page loads no old stylesheet.** `chat.html` and `en/chat.html` no longer load `tokens.css` or `css/chat-legacy.css`. They load two new files: `core/core-dialogs.css` and `js/25-core-dialogs.js`.

**One window shell.** The shared window (`#modal`) and the Ultra credits window (`#ulWin`) are Core dialogs: born from the click point, the Core recedes, focus stays inside, Esc closes, focus returns, the page behind does not scroll, a sheet from the bottom on a phone. Existing scripts still open a window by adding the class `on`; `25-core-dialogs.js` turns that into a Core dialog. Sections change with a turn, and the plate glides to its new height.

**Windows restyled** (all in `core-dialogs.css`): account settings with every section (profile, plan, memory, voice, watermark, API, models, security with two-factor protection, notifications row, account deletion), plans, the payment message states, limits, "daily limit reached", Ultra credits and its history, team plan, project with instructions and files, sharing a chat, the model menu, the install-app card, the announcement and maintenance banner.

**Plans.** Three plates at different depths; the one under the pointer or focus comes forward and only its button is amber. The Core behind the window is brighter for a higher plan (new command `Core.lit(k)` in `core-scene.js`, with a CSS fallback). A confirmed payment gives one flash.

**Model menu.** Near glass, a mini core per model in the model's own form, names in the machine voice, states for selected, locked on the current plan and "having issues" (flickering or dark mini core plus the words). Arrow keys, Home, End, Esc; a bottom sheet on a phone.

**Limits.** The ring around a small core replaces the bars in the account plan section, the limits window and the "limit reached" window.

**Image viewer.** A picture now opens full size in a Core dialog instead of a blank browser tab.

**Built-in browser boxes.** 24 call sites in the scripts the chat page loads (37 counting the English copies) became the confirmation capsule; deletions use the destructive variant. 1 is left on purpose: a last-resort `alert` in `language.js` for pages that have neither notifications nor Core, which cannot run on the chat page. Each replaced call was tried in Chrome for yes, no, Esc and Enter; the cloud, team and desktop-helper back ends were mocked. The table is in `step5-notes/native-boxes-and-tooltips.md`.

**Native tooltips.** 18 in `chat.html` (and 18 in the English page) and 78 built by scripts became Core tooltips. The one `title` left is on the preview `<iframe>`, where it is the frame's accessible name. Accessible names were kept or added.

**Notifications.** `toast(text, tone)` now shows the Core capsule; every call got a tone where the meaning was clear. The old `#toast` element is gone. The same message arriving twice no longer stacks.

**Fixes in `core-ui.js`.** A closed capsule no longer swallows the next click; Enter works after clicking the capsule's text; a tooltip shown on keyboard focus survives the scroll that the focus caused.

**Cache numbers.** `?v=` was raised for all 45 changed static files in every page that loads them.

**Tests rewritten** (the same intent, asserted in the new system): `tests/core-chat.test.js`, `tests/core-work.test.js`, `tests/chat-ui.test.js`, `tests/ultra.test.js`, `tests/chat-visual.test.js`, `test/team.test.js`, `test/versions-ui-smoke.js`. No test was deleted.

## Checked so far

- The chat screen outside the windows was compared with the step 4 build by computed styles of every element. Light theme at 1440 with a conversation and the result window: no differences. Two differences found on the way (padding of the project tag, input font size on a phone) were fixed; the phone comparison was not repeated after its fix.
- Keyboard, in Chrome, dark theme, 1440: a window opened with Enter takes focus, Tab stays inside, Esc closes it and focus returns to the opener; with a capsule over a window the first Esc closes only the capsule; the model menu opens, moves and selects from the keyboard; a tooltip appears on keyboard focus and the button keeps its accessible name.
- Screenshots were taken of most surfaces at 1440 in both themes and at 390 in the dark theme. I looked at roughly half of them.

## Not done

1. **`CORE-DESIGN-SYSTEM.md` is not updated.** It still says the chat page loads the bridge stylesheet, and it has no section for this step (how to open a window, a capsule, a tooltip and a notification from a script as the chat now does it, `Core.lit`, the plan plates, the viewer).
2. **The Russian change note is not written.**
3. **The final report is not assembled**: the inventory with a status for each surface, the decisions, the list of rewritten tests. The raw inventory is in `step5-notes/inventory-before.md`.
4. **No test file for this step.** `tests/core-dialogs.test.js` does not exist, although a comment in `tests/core-chat.test.js` points to it. Nothing yet guards "no built-in boxes and no `title` in chat scripts" or the window bridge.
5. **The full `npm test` was not run after the changes.** Only the frontend test files were run (results at the end of this file). Before any change the full run gave 470 tests, 14 failing, all in cloud, desktop-helper signing and one API test.
6. **The visual check is incomplete.** Not looked at, or not captured at all: the light theme at 390 (nothing captured); most surfaces at 390; most surfaces in the light theme; the voice list with real voices (the test server has none, and my stand-in failed); Ultra history, the computer-access window, the payment waiting state and the project with files were captured but not reviewed. Nothing was re-checked by eye after the last CSS fixes.
7. **Reduced motion was not checked for windows.** The keyboard pass did not cover plans, limits, Ultra credits, team, project, sharing, the viewer, the install card or the banner.
8. **Motion was not seen in motion.** The birth of a window, the section turn and the height glide were not recorded or measured; smoothness of opening and closing was not measured.
9. **`Core.lit` was not measured against the readability limit.** It raises only the brightness of the receded Core, to at most 90 % of the resting brightness, so it should stay under the limit, but the measuring test needs a WebGL package that is not installed here.
10. **Voice.** The recording state and reading aloud keep their step 3 look; nothing new was designed for them.
11. **The offline page** (`public/offline.html`) is a separate page with its old inline look and was not touched. The product has no "update available" state.
12. **The bridge files remain on disk**, unused by the chat page: `public/css/chat-legacy.css` and `scripts/build-chat-legacy.py`. Whether to delete them now or in step 8 is open.
13. **`public/sw.js`** was not reviewed for references to the removed stylesheets.
14. `test/versions-ui-smoke.js` was changed but not run (Playwright is not installed here).

## Differences from the brief

- The brief says to regenerate `public/en` with `scripts/build-i18n.py`. The design description says the generator must not be run because its catalogue is behind the hand-finished English files. I followed the description: every edit was mirrored in the English copies directly.
- Some surfaces named in the brief do not exist in the product: menus on a chat row and on a project row, a rename prompt, a search window (search is a filter field in the sidebar), a pop-up asking to allow notifications (it is a row in the Security section), and separate payment success and failure windows (the product shows button text, a message line and a notification).

## Local state

Two local git commits on the working branch: the archive as received, and this snapshot. Nothing was pushed and no pull request was opened.

## Checks run when this snapshot was packed (raw output)

```
tests/core-foundation.test.js: ℹ pass 10 ℹ fail 0 ℹ skipped 0 
tests/core-scene.test.js: ℹ pass 9 ℹ fail 0 ℹ skipped 2 
tests/core-chat.test.js: ℹ pass 8 ℹ fail 0 ℹ skipped 0 
tests/core-work.test.js: ℹ pass 10 ℹ fail 0 ℹ skipped 0 
tests/chat-ui.test.js: ℹ pass 3 ℹ fail 0 ℹ skipped 0 
tests/chat-visual.test.js: ℹ pass 7 ℹ fail 0 ℹ skipped 0 
tests/ultra.test.js: ℹ pass 10 ℹ fail 0 ℹ skipped 0 
tests/static-assets.test.js: ℹ pass 4 ℹ fail 0 ℹ skipped 0 
tests/animation.test.js: ℹ pass 19 ℹ fail 0 ℹ skipped 6 
test/team.test.js: ℹ pass 3 ℹ fail 0 
built-in boxes left in chat scripts (file:count): public/language.js:1 
title= left in chat.html / en/chat.html: 1 / 1 (the preview iframe)
title written by chat scripts: 0
old stylesheets linked by chat.html: 0 ; by en/chat.html: 0
```
