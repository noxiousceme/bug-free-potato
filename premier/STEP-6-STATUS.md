# Redesign step 6 — status at handover

**This is a working snapshot, not a finished step.** Work was stopped part-way at the owner's request (2026-11-25). The archive runs and the three pages are on the Core system in both languages, but most of the checks the brief asks for are not done, the step 6 section of the design description is not in the document, and the Russian change note for step 6 is not written. Do not attach it to step 7 as a finished step.

Nothing was changed in `desktop/` or in `public/theme/`. No file was deleted. Nothing was pushed; no pull request was opened.

The sandbox restarted while the work was being stopped. The project in this archive was restored from the automatic checkpoint taken at 14:29:54 UTC, a minute before the stop; it holds every code edit of the session. What was lost is listed under "Not done", item 1.

## Done

**Landing** (`public/index.html`, `public/en/index.html`)

- Loads only Core stylesheets plus two new ones, `core/core-site.css` and `core/core-landing.css`. No `<style>` block, no old stylesheet, no Unbounded.
- First screen rearranged to one focus: kicker, headline, one line, one amber button (plus a quiet text button), then the demonstration at once. The three facts and the model list moved to a glass shelf under the demonstration; the example tabs moved into the demonstration frame. All content and every id kept.
- Scroll flight: new scene command `Core.flight(pose)` in `core/core-scene.js`; seven stations (`data-flight="x y size yaw pitch"` on the first screen, the demonstration and each section, with `data-flight-phone` variants). The pose is a function of `scrollY` only; no snapping, no `preventDefault`, passive listener. On the way to the features section the camera passes through the Core (desktop only).
- Demonstration plays request → Core thinking → answer streaming into the frame → result born, driven by `data-demo` on `#preview`.
- Sections restyled: features, pricing (period switch, trial offer strip, plan plates, team strip), reviews and the review window, questions and answers, last screen, header, footer.
- Plan plates use the same rules as the plans window of step 5; a test compares four of them with `core-dialogs.css`.
- The light-theme defect (dark question plates with dark text, and the period switch) is gone: the old `landing.css` is no longer loaded and every colour in the new rules is a token.

**Login** (`public/login.html`, `public/en/login.html`)

- Core fills the screen (`data-core-place="full"`), one glass plate holds the form and the former side column.
- States styled: choose a way in, waiting (`aria-busy`), sign-in not configured, registration closed, error after returning, second step (enter code, checking, wrong code, time is up, signed in with a backup code).
- After a successful second step `CoreGate.enter()` flies the camera into the Core (420 ms; the chat is requested after 300 ms); instant under reduced motion.
- The code field is unchanged (`name`, `inputmode`, `autocomplete="one-time-code"`).

**Trial page** (`public/protrial.html`, `public/en/protrial.html`): one plate, one price, one action on the first screen; sections below as plates; six flight stations.

**Shared**

- `public/js/26-core-site.js`: flight, demonstration, glass decision (opaque glass on phones, without a GPU, or when the scene's quality level is below `high`), scene under a native `<dialog>`, sign-in transition. Its header comment describes the station format.
- `core-scene.js` raised to `?v=3` on all pages that load it, including both chat pages.
- `scripts/build-theme.py` now skips a page that has no inline styles left; otherwise a run would have emptied `theme/login.gen.css` and `theme/chat.gen.css`.

**Step 5 gaps closed (documents only)**

- `CORE-DESIGN-SYSTEM.md`: new section 15 (windows and small elements of the chat) and 21 small corrections elsewhere, written from the code.
- `ИЗМЕНЕНИЯ-РЕДИЗАЙН-ШАГ-5-ОКНА.txt`: the missing Russian change note for step 5.
- Both were written by a helper agent from the code and the handover notes. I applied them mechanically and did not proofread them line by line.

## Tests

- New: `tests/core-landing.test.js`, 10 checks. All 10 pass on this archive.
- Full `npm test` was run once, **before the last four small edits** (below): 491 tests, 468 pass, 14 fail, 9 skipped. Before any change of mine the same run gave 481 tests, 459 pass, 13 fail, 9 skipped. The 13 are the same in both runs (cloud symlink and file checks, desktop helper signing, folder archive, `readSse`). The 14th, "CLD-09: «Стоп» в чате", failed in the full run and once when its file was run alone, then passed in four further runs of that file (two in my tree, two in an untouched copy). I believe it depends on machine load; that is not proven.
- **`npm test` therefore does not pass, and did not pass on the archive as received.**
- Edits made after that full run and not covered by another full run: the "loading" veil of the demonstration made script-only, the phone text button, the plate arrival without opacity, one allow-list entry in the new test.

Rewritten checks (none deleted):

| File | Was | Now |
| --- | --- | --- |
| `tests/static-assets.test.js` | Every `/css/…` file linked by the landing and chat exists. | Every linked stylesheet exists, and there are at least four. |
| `tests/reset-and-trials.test.js` | `.tier .tier-trial` in `landing.css`, `.plan .gw-tr` in `growth.css`. | The same selectors in `core/core-site.css` and `core/core-dialogs.css`; the landing links `core-site.css`. |
| `test/team.test.js` | The landing links `landing.css?v=`. | The landing links `core/core-landing.css?v=` and that file styles `.team-strip`. |
| `test/i18n.test.js` | Exact `<html lang="ru">` / `<html lang="en">`. | The tag may carry attributes. |

The two files in `test/` are outside `npm test`; **I edited them and did not run them.**

## Measurements

First screen of the landing, archive as received, local server, Chrome, cold cache, median of 5:

| Profile | First paint | Largest paint | Layout shift | Blocking | Total |
| --- | --- | --- | --- | --- | --- |
| Phone 390 px, CPU ×4, 1.6 Mbit/s | 1340 ms | 1340 ms | 0.012 | 6 files, 69 KB | 387 KB, 21 requests |
| Desktop 1440 px, 10 Mbit/s | 560 ms | 560 ms | 0.007 | same | same |
| Phone, English | 1716 ms | 1716 ms | 0.119 | same | 367 KB, 20 requests |

**The "after" measurement was not taken.** Whether the first screen is now faster or slower is unknown.

## Not done

1. **The step 6 section of `CORE-DESIGN-SYSTEM.md` is missing.** A full draft (section 16: files, patterns for long public pages, `Core.flight` and stations, glass over a moving Core, landing, login transition, trial page) was written outside the project folder and was lost when the sandbox restarted. The document ends at section 15 and its title still says "steps 1–5". Until it is rewritten, the header comments of `core-site.css`, `core-landing.css`, `core-login.css`, `core-trial.css`, `26-core-site.js` and the `Core.flight` comments in `core-scene.js` are the only description.
2. **The Russian change note for step 6 is not written.**
3. **Load time after the change was not measured.**
4. **Contrast of text over the moving Core was not measured.** A measuring run was started and interrupted without a result. The first-screen text lies on the scene on soft slabs, not on glass; whether it keeps 4.5:1 at every scroll position and while the Core "thinks" is unverified.
5. **Scroll smoothness was not measured**, neither at phone size with a slowed processor nor on desktop. The sandbox renders WebGL in software at a few frames a second, so smoothness cannot be judged here. The effect is reduced for phones by design (opaque glass, no pass through the Core, smaller Core); that this is enough is an assumption.
6. **The visual pass is partial.** Looked at: landing dark 1440 (all sections), landing light 1440 (first screen, pricing, questions), landing dark 390 (first screen, demonstration, features, bottom), English landing first screen, login dark 1440, login second step light 1440 and with a wrong code (English), login error at 390, trial dark 1440 (first screen, comparison), trial light 390 English, landing without scripts, landing without a GPU (first screen). Captured but not looked at: landing light 390, light features, reduced-motion frames, trial light 1440. Not captured: most login states (not configured, registration closed, checking, time is up, backup code), login light at 390, the review window, the offer and team strips with real data, the four-plan layout. Nothing was re-checked by eye after the last CSS edits.
7. **Nothing was seen in motion**: the flight between stations, the pass through the Core, the demonstration steps, the plate arrival and the sign-in flight. Only still frames at a few scroll positions.
8. **Keyboard-only pass: not done** on any of the three pages.
9. **Reduced motion**: one automatic read-out (no flight, still frame, demonstration finished) and tests; not reviewed by eye.
10. **`Core.flight` and the brightness limit.** Kept by construction (per-frame estimate for the pose's size; enlarged points keep their light). Not measured: the measuring test in `tests/core-scene.test.js` needs the `gl` package, which does not build here, and is skipped.
11. **Password managers and autofill** were not tried in a browser. The page has no password field; the code field's attributes are unchanged and a test pins them.
12. **The showcase page** was not updated with the new patterns or `Core.flight`.
13. `STEP-5-STATUS.md` and `step5-notes/` are still in the root; the step 5 documents refer to them.
14. Safari, Firefox, a real phone, a real graphics card, screen readers: not checked.

## Decisions where the brief left a choice

- **Text of the first screen sits on the scene, not on glass**, each line on its own soft slab of the scene colour, so the Core stays whole beside it. This is the riskiest choice for contrast (item 4).
- **The headline is 36 to 56 px**, above the six-step type scale (`--site-fs-display`), for the `h1` of a public page only.
- **Amber**: one button per screen through one selector list in `core-site.css`. The header button, offer strip, team strip and "leave a review" are glass. On login the provider buttons are light, not amber; amber appears only on the second step.
- **Real blur only on machines that keep the scene at quality `high`**; everyone else gets the system's opaque glass.
- **The review window stays a native `<dialog>`** drawn as a Core window, because the page script opens it with `showModal()`.

## Differences from the brief

- The brief says to edit Russian sources and run `scripts/build-i18n.py`. The design description says the generator must not be run (its catalogue is behind the hand-finished English files). I followed the description: each edit was applied to the Russian and the English file by one script that fails unless it matches once per file. `public/en/protrial.html` is not covered by the generator at all; it is a hand-made page.
- The brief lists login states "signing in, registration, recovery". The page signs in through Google or GitHub only; there is no password, registration form or recovery.
- **The flight into the Core happens only after the second step.** Without a second step the server redirects from the provider straight to `/chat` and the login page is not shown again. Adding the flight there needs a change to the server's redirects, which this step does not touch.
- Steps 1 to 5 were described as finished; step 5 was a stopped snapshot. Its documents were completed here at the owner's request; its unfinished checks remain unfinished (section 15.16 of the description).

## Files

New: `public/core/core-site.css`, `public/core/core-landing.css`, `public/core/core-login.css`, `public/core/core-trial.css`, `public/js/26-core-site.js`, `tests/core-landing.test.js`, `ИЗМЕНЕНИЯ-РЕДИЗАЙН-ШАГ-5-ОКНА.txt`, `STEP-6-STATUS.md`.

Changed: `public/index.html`, `public/login.html`, `public/protrial.html`, `public/chat.html` and the four English copies in `public/en/`; `public/core/core-scene.js`; `scripts/build-theme.py`; `CORE-DESIGN-SYSTEM.md`; `tests/static-assets.test.js`, `tests/reset-and-trials.test.js`, `test/team.test.js`, `test/i18n.test.js`.

Deleted: none. Old stylesheets stay on disk for step 8.
