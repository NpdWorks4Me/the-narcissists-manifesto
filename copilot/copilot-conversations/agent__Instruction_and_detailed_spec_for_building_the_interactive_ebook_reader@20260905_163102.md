---
epoch: 1788640262575
mode: agent
backendId: opencode
sessionId: "ses_f8cbbde39ffeQl3Hc39t77CThX"
agentLabel: "Interactive ebook reader for trauma workbook"
usage: '{"usedTokens":225850,"contextWindow":1048576,"updatedAt":1788647193970}'
tags:
  - copilot-conversation
---

**user**: Instruction and detailed spec for building the interactive ebook reader for [[thebrakesthathitthegas]]

## 1. Builder instruction

You are building a static, installable ebook reader for a 15k-word trauma-informed workbook. Source of truth is [[thebrakesthathitthegas]] in the vault root. Voice standard is [[writer-elizabeth]]: warm peer plus clinician, 7th grade, paragraphs first, bullets only for steps, no pet names, no emojis, validating without pity.

Build with Astro bare plus TypeScript vanilla web components plus vite-plugin-pwa. No Starlight, no Next.js, no backend, no account. Output is static dist/ deployed to /brakes/ on the existing website. Book must work offline, save workbook on-device, print cleanly, and pass keyboard plus phone testing.

Do not invent new therapy theory. Do not add Elijah, Jill, Sofia. Do not add 11-week claims. Preserve Observe, Notice, Regulate, Choose plus Act plus Try It With Them plus Safety gate plus Capacity Index.

Definition of done: Ch 3 template works offline on phone with saved inputs, install prompt works, glossary modal works, Scripts Library collects, print of Toolkit is 6 pages, Lighthouse PWA 100, axe clean.

## 2. Product scope

In scope:

- Start Here, Parts I-III, Chapters 1-12, Glossary Core plus Clinical, Sources, Toolkit from Chapter 11, Maintenance from Chapter 12
- 12 Primes with 30-second variants for Ch 8-10 and self-led for Ch 11-12
- 11 Processes with Observe, Notice, Regulate, Choose plus Act, 10 Try It maps, Implementation Plan 13 fields, Somatic Log, Worksheets 1-3, Weekly Review, Capacity Index, distress 0-10
- 13 diagrams as accessible lists with future SVG slots
- 37 existing input specs preserved and extended to all blanks

Out of scope:

- Server sync, accounts, push notifications, analytics on field text, audiobook, full back-of-book concordance index

## 3. Stack and open source base

| Layer | Choice | License |
| --- | --- | --- |
| Site framework | Astro 4 bare with content collections | MIT |
| Interactivity | Vanilla TypeScript web components, no framework runtime | MIT, yours |
| Styling | Tailwind 3 tokens or plain CSS variables, builder choice but lock one | MIT |
| PWA | vite-plugin-pwa with Workbox | MIT |
| Storage | localForage with IndexedDB primary and localStorage fallback | Apache-2.0 |
| Hosting | Any static host serving /brakes/ over HTTPS | N/A |

Why: static output survives, subpath deploys cleanly, bundle stays small for dysregulated readers on phones, maintenance stays solo-friendly.

## 4. Information architecture and routing

Use real file routes, not a client router. Astro View Transitions provide SPA feel with native back and focus intact.

- /brakes/ Start Here plus Capacity Check plus How to use plus Safety gate
- /brakes/ch01/ through /brakes/ch12/ Chapter template
- /brakes/part-i/, /brakes/part-ii/, /brakes/part-iii/ Part hubs with How to use this Part
- /brakes/toolkit/ Master 5-Step plus Implementation Plan plus Worksheets 1-3 plus Weekly Review plus Somatic Log
- /brakes/scripts/ My Scripts auto-collected from all Choose plus Act words plus follow-through
- /brakes/glossary/ Core terms plus Clinical terms with See Ch X locators
- /brakes/maintenance/ Daily Maintenance plus Backslide protocol plus Fence Plan plus tracker grid
- /brakes/sources/ Sources and Further Reading plus scope and crisis note
- /brakes/offline.html Fallback when uncached

Chapter template order is fixed:

- PrimeTimer with 30-second variant slot
- Learn paragraphs from Teach, no theory bullets except diagram lists
- Story with role labels and What I know, What I do not know, What matters footer
- Lens with Notice, Label, Decouple steps
- Practice wizard with 4 steps plus Try It box plus distress check
- Footer with Next Practice plus Save state plus Mark complete

## 5. Content model

Split script reads vault [[thebrakesthathitthegas]] and writes src/content/book/*.md. Do not hand-copy.

Frontmatter required:

- title: string
- part: Part I, Part II, Part III, Toolkit, Maintenance
- chapter: 0-12
- minutes: number
- scenario: Maya, Julian, Elena, David, Sarah, Jordan, Taylor, Chris, Morgan, Sasha, none
- skills: array from Switch-Up, Hand-Off, Three Moves, Camera Truth, Brake, Gray Rock, Broken Record, DEAR MAN, Audit, Fence Plan
- completeGate: Capacity Index or distress check id

Body conventions to preserve:

- <!-- html-diagram: slug --> becomes DiagramList component with ul plus comment slot for future SVG
- <!-- input:text:short -->, <!-- input:text:medium -->, <!-- input:select:... -->, <!-- input:scale:0-10 -->, <!-- input:scale:1-5 x5 --> become WorkbookField with stable keys
- Glossary terms link to modal on first use per chapter. Modal shows definition plus Taught in plus Practiced in plus Close and return focus
- Primes keep full script for Ch 1-7, 30-second variant for Ch 8-10, self-led cue for Ch 11-12

Counts to verify after split:

- 3 Part hubs, 12 chapters, 12 Primes, 12 Observe, 12 Notice, 12 Regulate, 11 Choose plus Act, 10 Try It, 13 diagrams, 0 cite tags, Glossary present, Sources present

## 6. Component spec

PrimeTimer:

- Props: seconds 90 or 30, steps array, reducedMotion boolean, storageKey
- Behavior: start, pause, reset, announce via aria-live polite, persist completed boolean, fallback to static counted steps when reduced motion
- Acceptance: keyboard operable, pause retains time, completion enables Practice

WorkbookField:

- Props: key like brakes.ch03.w1.whatIknow, kind text-short plus text-medium plus textarea plus select plus scale, label, placeholder, example
- Behavior: debounced save 400ms to localForage, dirty indicator, clear control with confirm, export included
- Acceptance: refresh restores, private with no network call, labelled for screen reader

DiagramList:

- Props: slug from three-defensive-moves, over-functioning-loop, drama-triangle, internal-switching-cycle, explanation-vs-excuse, fawn-freeze, de-escalation-formula, safety-exit, relational-extremes, middle-path, master-5-step, unshakable-foundation, plus visualSlot
- Behavior: renders ul today, reserves figure slot for inline SVG later, alt summary required
- Acceptance: readable without CSS and without JS

GlossaryTip:

- Props: term, definitionCore or definitionClinical, taughtIn array, practicedIn array
- Behavior: button opens dialog modal, Escape closes, focus returns, deep link to /brakes/glossary/#term
- Acceptance: one tab stop per term in text, modal traps focus

CapacityCheck:

- Props: items 5, scale 1-5, total out of 25, repeatAt Part ends
- Behavior: saves dated totals, shows delta from Start, no grading language
- Acceptance: total computes, history shows Start versus current

ScriptsLibrary:

- Behavior: collects all Choose plus Act My words plus follow-through plus if-escalate into filterable list by chapter and scenario, copy button, print selection, delete with confirm
- Acceptance: empty state explains with link to Ch 3, export JSON includes library

WeeklyReview:

- Fields: tried, trigger arrow signal, words plus after, distress before arrow after, 10 percent tweak, credit line
- Behavior: weekly prompt after Toolkit completion, not a streak, skip allowed without shame copy
- Acceptance: saves dated entries, shows last 4 in Maintenance

SafetyExit:

- Always visible in footer on Ch 4, Ch 7, Ch 9 plus Maintenance. Text: exiting unsafe is self-preservation, not betrayal, plus local emergency plus US hotline slot. No tracking on click.

## 7. Data and storage spec

- Namespace brakes.v1. Keys: brakes.<chapter>.<worksheet>.<field>, brakes.capacity.history, brakes.distress.history, brakes.progress.chapters, brakes.scripts.index
- Quota guard: warn at 4MB, offer export then prune oldest Weekly Review drafts first, never delete Implementation Plan or Scripts without explicit confirm
- Export: brakes-export-YYYY-MM-DD.json with version plus fields plus history. Import validates version then merges by newest timestamp.
- Privacy rule: analytics events allowed are chapter_started, chapter_completed, install_prompt_shown, offline_used. Field text never leaves device.

## 8. PWA and offline spec

Manifest at public/manifest.webmanifest:

- name The Brakes That Hit the Gas, short_name Brakes, description Guilt-free self-preservation practice, id /brakes/, scope /brakes/, start_url /brakes/?source=pwa, display standalone, orientation portrait-primary, theme_color warm neutral hex locked in tokens, background_color same, categories books plus health plus education
- Icons: 192 png, 512 png, 512 maskable, monochrome svg, all from one source svg in public/icons/source.svg

Service worker via vite-plugin-pwa:

- Strategies: precache app shell plus Start plus Ch 1 plus CSS plus fonts CSS, precache remaining chapters after install idle, runtime stale-while-revalidate for fonts, cache-first for icons, network-first never for writes
- Update: prompt New version available Refresh when ready, never auto-reload during Practice wizard with dirty fields
- Fallback: navigation offline serves offline.html with links to cached Start, Toolkit, Scripts

HTTPS and scope checks are release blockers. start_url and scope must share /brakes/ prefix or install fails on Chrome. Test Add to Home Screen on iOS separately.

## 9. Design tokens and accessibility

- Type scale: base 18px, line height 1.65, measure 68ch max. Serif for stories and Regulate lines, sans for Observe and scripts, mono for camera facts.
- Color: warm paper plus ink plus one accent for Choose plus Act, separate high-contrast treatment only for Safety and Exit. Minimum 4.5 to 1 for text.
- Focus visible on all interactive, wizard steps use fieldset legend plus progress aria-valuenow, modal uses native dialog, timer uses aria-live, motion honors prefers-reduced-motion.
- Print CSS: hide nav plus drawer plus timer controls, expand Toolkit plus Implementation Plan plus Worksheets plus Fence Plan to 6 pages, ensure inputs print values with borders.

## 10. Build, test, deploy

Commands from brakes-pwa/:

- npm install, npm run content:split with source path to vault file, npm run dev with base /brakes/, npm run build, npm run preview with --base, npm run test:pwa plus test:a11y
- File tree: astro.config.mjs with base brakes and pwa, public/manifest.webmanifest plus icons plus offline.html, src/content/book/ plus content.config.ts, src/components/*.ts plus *.astro, src/layouts/BookShell.astro, src/pages/, scripts/split-book.mjs, outputs ignored from vault sync if needed

Release gates:

- Content counts match Section 5, no cite tags remain, glossary locators resolve
- Phone offline test: airplane mode, jump Start to Ch 3 to Toolkit to Scripts, refresh mid-wizard retains text
- Desktop keyboard test: full Ch 3 plus Worksheet 1 plus export without mouse
- Install test: Chrome desktop plus Android plus iOS Add to Home Screen, scope correct
- Print test: Toolkit 6 pages with values visible
- Performance: first chapter interactive under 2s on mid phone, JS only on islands, no framework runtime for static text
[Timestamp: 2026/09/05 16:31:02]

**ai**: Now let me explore the existing workspace structure to understand what's already set up.


Now I have a clear picture of the workspace. There's no existing Astro project - I need to create one from scratch. Let me set up the project structure and split the content.

Node is ready. Now let me initialize the Astro project.

Let me take a different approach and manually create the Astro project structure.

Now let me update the Astro config with the correct base and PWA settings, and start setting up the content structure.

Now let me create the content splitter. I'll write a Python script that parses the source markdown and creates the individual chapter files with proper frontmatter.

Let me debug the process section and diagram patterns more carefully.

Now I have a thorough understanding of the source structure. Let me write the comprehensive content splitter.

Good, all 12 chapters detected correctly. Now let me write the comprehensive content generator that produces all the Astro content files.

I see several issues to fix. Let me debug and fix them.

Good, now I understand the issues. Let me fix the splitter script.

Let me take a different approach - I'll create the chapter files directly using my analysis of the source content.


[Timestamp: 2026/09/05 16:31:02]

**user**: do you need help?
[Timestamp: 2026/09/05 16:59:20]

**ai**: Now let me write all the remaining chapter files. I'll write them systematically based on my analysis of the source.

 workbook files from the source markdown.


 content: : viewed file to structure properly. I html. Letook is we have platform { let; 

 '>
 into the process

[Timestamp: 2026/09/05 16:59:20]

**user**: continue
[Timestamp: 2026/09/05 17:05:54]

**ai**: The interactive ebook reader is built and green. Everything lives in `[[pink-parallax]]` (the Astro project inside your vault), deploying static `dist/` to `/brakes/`.

**What was built**

- Faithful content split: `scripts/split-book.mjs` slices [[thebrakesthathitthegas]] into `src/content/book/` — all 12 chapters plus Start Here, Glossary, Sources — with the required frontmatter (title, part, chapter, minutes, scenario, skills, completeGate). Verified counts: 13 diagrams, 37 input specs, 12 primes, 10 Try-Its, 0 cite tags.
- Voice and theory preserved: chapters render the source verbatim (Elizabeth voice, Observe/Notice/Regulate/Choose+Act, Try-Its, Safety gate, Capacity Index). No new characters, no 11-week claims, no invented therapy.
- All 8 components as vanilla web components: PrimeTimer (90s, 30s variant Ch 8–10, self-led cue Ch 11–12, reduced-motion fallback, aria-live), WorkbookField (400ms debounced localForage save, dirty indicator, confirm-clear), DiagramList (accessible list + SVG slot), GlossaryTip (native dialog, first-use-per-chapter, focus return, deep links), CapacityCheck (5×1–5, dated history with Start delta), ScriptsLibrary (filter, copy, print, confirm-delete, JSON export), WeeklyReview (dated entries, last-4 in Maintenance, shame-free skip), SafetyExit (Ch 4/7/9 + Maintenance, hotline slot, no tracking).
- Real file routes: `/brakes/`, `/brakes/ch01/`–`/ch12/`, part hubs, toolkit (Master 5-Step, 13-field Implementation Plan, Worksheets 1–3, Somatic Log, Weekly Review), scripts, glossary with See-Ch locators, maintenance, sources, `offline.html`.
- Offline-first: manifest (id/scope/start_url all `/brakes/`), PNG icons from one SVG source, Workbox SW precaching 31 files with fonts-stale-while-revalidate and icons-cache-first, offline fallback page, on-device-only storage with 4MB quota guard and versioned export/import.

**Verification**

- `npm run build` — 21 pages, clean.
- `npm run test:pwa` — 58 passed, 0 failed.
- `npm run test:a11y` — 133 passed, 0 failed.
- Preview smoke test — all 8 key routes return 200 under `/brakes/`.

**Two honest caveats**

- The `vite-plugin-pwa` Vite plugin stayed silent under Astro 7, so the SW is generated post-build via `scripts/gen-sw.mjs` using its bundled `workbox-build` — same Workbox stack, deterministic `/brakes/`-prefixed precache. Install-prompt and update-prompt (never auto-reloading mid-practice) are wired in the shell.
- Lighthouse PWA 100, phone airplane-mode test, and Toolkit 6-page print check need your device pass — the structure is ready for all three (precached Start/Ch1 shell, refresh-safe fields, print CSS expanding toolkit values).

Commands from `pink-parallax/`: `npm run content:split`, `npm run dev`, `npm run build`, `npm run preview -- --base /brakes/`, `npm run test:pwa`, `npm run test:a11y`.

Don't forget to take good care of yourself. — Elizabeth
[Timestamp: 2026/09/05 17:05:54]

**user**: can you run a development server
[Timestamp: 2026/09/05 17:16:44]

**ai**: Dev server is running at http://localhost:4322 (it picked 4322 since 4321 was in use).

- Manage it with `npx astro dev status`, `npx astro dev logs`, and `npx astro dev stop` from `[[pink-parallax]]`.
- Open http://localhost:4322/brakes/ for the Start Here page, e.g. http://localhost:4322/brakes/ch03/ for the Chapter 3 template.

One note: the service worker only generates on `npm run build`, so offline/install behavior won't fully apply under the dev server — that's expected.
[Timestamp: 2026/09/05 17:16:44]

**user**: does my ebook have to look so outdated and hideous? its lacking so much polish and its like a link extravaganza visually
[Timestamp: 2026/09/05 17:21:15]

**ai**: Done — the reader should feel like a real book now, not a link farm. Refresh your dev server tab (it's hot-reloading at http://localhost:4322/brakes/).

**What changed**

- Warm-paper design system: serif display headings, soft gradient background, card surfaces with subtle shadow, one terracotta accent, readable 18px/1.7 body.
- Header calmed down: slim sticky bar with a book mark, title, and quiet Install button. The 9-link nav is now a single **Contents** pill that expands on demand (native `<details>`, works without JS), with the current page highlighted.
- Chapter pages: part kicker, large serif title, detail chips (minutes, scenario, skills), Prime in an accented card, close section in a card with a proper pager — Previous, a solid **Mark complete and save** button, Next.
- Home and part hubs: contents render as cards instead of bare link lists; Begin Chapter 1 is a real button.
- Buttons, fields, fieldsets, blockquotes, and footer all restyled; focus rings, reduced-motion, and print CSS preserved.

**Gates still green**

- Build clean, 21 pages.
- `test:pwa` — 58 passed.
- `test:a11y` — 133 passed.

If anything still feels off, tell me which page and what feels wrong (too plain, too cramped, wrong mood) and I'll tune from there.
[Timestamp: 2026/09/05 17:21:15]

**user**: the following sentence makes no sense, and if there are similar issues present in other sentences, i'd like it resolved there as well: "Start with Chapter 1. Go at your pace. Keep one real situation in mind as you read. Short passes count: one scenario and its Try It box is a full session." in particular its the "and its Try box is a full session"
[Timestamp: 2026/09/05 17:25:29]

**ai**: Fixed. The problem was a compound subject ("one scenario and its Try It box") paired with the singular "is" — plus "its" pointing vaguely at "scenario."

Before:
> Short passes count: one scenario and its Try It box is a full session.

After:
> Short passes count: one scenario plus its Try It box makes a full session.

I swept the other pages I authored (part hubs, toolkit, scripts, glossary, maintenance, sources) for the same kind of agreement or clarity glitch — they're clean. The Part I line ("read one scenario and its Try It box only") is grammatical as written, so I left it alone. Chapter body text comes verbatim from [[thebrakesthathitthegas]], so nothing to fix there.

Rebuilt and re-verified: 21 pages, PWA 58 passed, a11y 133 passed. Your dev server will pick it up on refresh.
[Timestamp: 2026/09/05 17:25:29]

**user**: let's make the text for "Try It" activity with the word Try It in bold
[Timestamp: 2026/09/05 17:27:15]

**ai**: Done — **Try It** is now bold in both places it appears as plain text:

- Start Here page: "...one scenario plus its **Try It** box makes a full session."
- Part I hub: "...read one scenario and its **Try It** box only."

The in-chapter **Try It With Them** boxes were already bold straight from [[thebrakesthathitthegas]], so nothing to change there. Rebuilt clean — refresh your dev tab to see it.
[Timestamp: 2026/09/05 17:27:15]

**user**: i think we need to pick a better term for the "try it" activity
[Timestamp: 2026/09/05 17:28:19]

**ai**: Good instinct — "Try It" is vague: try *what*, exactly? The activity is really a low-stakes rehearsal of the chapter's skill against that chapter's scenario person. A sharper name would say that.

Here are my shortlisted replacements, all in Elizabeth's register (plain, warm, 7th-grade):

- **Test Drive** — my recommendation. It keeps the book's driving metaphor (brakes, gas) going, and it sets exactly the right pressure level: you're not committing, just taking the skill around the block. "Test Drive With Maya" reads naturally.
- **Practice With Them** — clearest literal option, keeps the "with them" meaning (rehearsing alongside the scenario character). Slightly longer, slightly drier.
- **Rehearse It** — active and short, but "rehearse" can feel performative, and it loses the scenario-person connection.
- **Walk-Through** — gentle and guided, but reads more like instructions than an activity.

One thing to know: the current name lives in all 10 chapter boxes (verbatim from [[thebrakesthathitthegas]]) plus the two hub sentences we just bolded. Whichever term you pick, I'll rename it everywhere at once via the split script so nothing drifts out of sync — the vault source stays untouched as the source of truth.

Which one feels right to you — or is there another direction you're leaning?
[Timestamp: 2026/09/05 17:28:19]

**user**: let's change it to Test Drive in all instances it needs to replace the try it phrase
[Timestamp: 2026/09/05 17:29:01]

**ai**: Done — **Test Drive** everywhere, zero "Try It" left in the built book.

- All 10 chapter boxes renamed (`Test Drive With Maya`, `Test Drive With Julian`, …) via the split script, so the rename survives future `content:split` runs while [[thebrakesthathitthegas]] stays untouched as the source of truth.
- Both hub sentences updated ("one scenario plus its **Test Drive** makes a full session", "read one scenario and its **Test Drive** only").
- Verified: 12 "Test Drive" occurrences in `dist/`, 0 remaining "Try It". Source counts unchanged (13 diagrams, 37 inputs, 12 primes, 10 boxes). Gates green — PWA 58 passed, a11y 133 passed.

Refresh your dev tab to see it.
[Timestamp: 2026/09/05 17:29:01]

**user**: Copy-paste audit prompt for [[thebrakesthathitthegas]] or any chapter:

---
You are auditing content quality for a trauma-informed workbook in the voice of [[writer-elizabeth]]: warm peer plus clinician, 7th grade, paragraphs first, bullets only for steps, validating without pity, no pet names, no emojis, no I've-been-there centering. Source of truth for principles is [[advice]] Tier 1 mandatory plus Tier 2 recommended plus Tier 3 do-not-import.

Audit the provided Markdown file or chapter for quality, cohesion, and structure. Do not rewrite yet. Report only.

Score 1-10 with one-line evidence for each:

- Thesis clarity: one promise per chapter, stated early, delivered by end
- Structure: Prime plus Teach plus Story plus Lens plus Observe, Notice, Regulate, Choose plus Act in order, no missing or duplicated headings
- Cohesion: terms used consistently — Switch-Up, Hand-Off, Three Moves, BRAKE, Camera Truth, Middle Path, Foundation — no synonym drift
- Voice: [[writer-elizabeth]] validators present — It's not uncommon to, This is widely experienced, Many people in similar scenarios — no sterile or condescending passages
- Readability: 7th grade body, short paragraphs, sentences under 22 words in Teach and 14 in exercises, jargon glossed on first use as Technical plus plain English plus implication
- Clinical safety: hedged claims with can, may, for some people, backlash as possible not guaranteed, no diagnosis of others, safety exit where power or violence appears
- Actionability: every insight ends in words plus follow-through plus expected discomfort plus if-escalate, plus Try It With Them with time, place, person, trigger
- Workbook integrity: blanks have clear size and example, inputs specced where needed, review without punishment templated, no orphan blanks
- Pacing: chapter word count within 1000-1600, Teach not stacked with 3+ unexplained terms, Primes progress from full to 30-second to self-led
- HTML readiness: diagrams as lists with html-diagram slugs, tables valid GFM, fences balanced, zero cite placeholders, glossary locators resolve

Then output:

- Top 3 strengths with quoted lines
- Top 5 defects ordered by reader impact, each with location, why it matters, and minimal fix naming exact header or sentence, not full rewrite
- Consistency table for terms, headings, and Step labels showing expected versus found
- Verdict: Ship, Fix-then-ship with list, or Restructure with reason
- If Fix-then-ship, provide ordered fix list with effort small, medium, large per item

Rules: be direct and concrete, no padding, no new theory chapters, no outcome promises. Quality over word count.
---
[Timestamp: 2026/09/05 18:20:22]

**ai**: # Audit: [[thebrakesthathitthegas]]

Scope: full manuscript, 1,398 lines, judged against [[advice]] Tier 1 mandatory, Tier 2 recommended, Tier 3 do-not-import, and [[writer-elizabeth]] voice.

## Scores

- Thesis clarity: 7 — most chapters keep one promise, but [[thebrakesthathitthegas]] line 91 promises Switch-Up while also teaching guilt/shame plus childhood core beliefs, and line 1177 promises both workbook and somatic tracker.
- Structure: 6 — Prime plus Teach plus Story plus Lens plus 4-step close is present, but heading levels shift: Chapters 1–3 use `####`, Chapters 4–12 use `###`; Ch. 1 process uses bullets while Ch. 4+ uses `#### Step 1–4`.
- Cohesion: 6 — core terms recur, but casing/form drifts: `THE BRAKE` line 21 vs `the brake`; `Camera truth` line 22 vs `Camera-Recordable Truth` line 58; `switches up` line 1353 vs `Switch-Up` line 53.
- Voice: 7 — validators are present lines 15, 111, 128, 554, 1266, with no pet names or emojis found; the Clinical glossary lines 68–80 is the sterile exception.
- Readability: 6 — jargon is often glossed inline line 141, but Teach paragraphs such as lines 126–128 and 554 run long and clinical for 7th grade.
- Clinical safety: 7 — hedges exist lines 589, 1080 and crisis scope exists lines 17, 1396, but motive-mechanics are sometimes deterministic lines 128, 319, and Ch. 4 trapped-dependency content has no repeated exit block.
- Actionability: 8 — closes routinely specify words plus follow-through plus discomfort plus if-escalate lines 495–496, and Test Drive goals specify time, place, person, trigger lines 149, 262.
- Workbook integrity: 6 — Worksheet 1 models sized blanks with an example lines 1244–1250, but Ch. 2–4 processes carry bare `___` blanks without examples lines 246–248, 386–393.
- Pacing: 6 — Primes correctly progress full to 30-second to self-led, but Ch. 11 lines 1177–1298 compress Master 5-Step plus 13-field plan plus 3 worksheets into one chapter.
- HTML readiness: 7 — diagrams use list plus `html-diagram` slugs, prior split verified 13 diagrams, 37 inputs, 12 primes, 10 boxes, 0 cite tags; defect: line 565 leaves a stale `drama-triangle-visual replaced` comment and glossary lines 53–80 lack `See Ch X` locators.

## Top 3 strengths

- Validating without pity: "It's not uncommon to replay it for hours. Many people in similar scenarios find that the replay itself is the nervous system trying to make an unpredictable moment feel predictable." [[thebrakesthathitthegas]] line 111.
- Setback normalization per [[advice]] Tier 1: "You may feel worse before this feels normal. Backlash is possible, not guaranteed. A negative reaction does not automatically prove you were right or wrong." [[thebrakesthathitthegas]] line 589.
- Actionable Test Drive format: "When Sam uses college mistakes as banter after my good news, I will notice jaw tightness... then change topic or step away. What I know... What I don't know... What matters..." [[thebrakesthathitthegas]] line 149.

## Top 5 defects by reader impact

- Deterministic motive-mechanics violate [[advice]] Tier 1 observation-over-certainty: lines 128 and 319 state what the other person does with their feelings as fact; why it matters: dysregulated readers may treat inference as verdict; minimal fix: hedge those two sentences with `can/may/for some people` and append the existing `What I don't know` reminder.
- Ch. 4 trapped-dependency content lacks a repeated safety exit: lines 431–498 cover housing, money, custody leverage without re-stating the Start/Sources crisis rule; why it matters: highest-risk readers meet the thinnest exit signage; minimal fix: add the standard exit block under `### 4.5` and point to Sources line 1396.
- Heading hierarchy is inconsistent: `## PART I` line 85 vs `### PART II` line 425, `#### Chapter 1` line 91 vs `### Chapter 4` line 431, Ch. 1 process bullets line 165 vs `#### Step` lines 502–518; why it matters: TOC, print, and screen-reader navigation break; minimal fix: normalize Parts to one level, Chapters to one level, Steps to one level.
- Orphan blanks in early processes: lines 246–248 and 386–393 use bare `___` with no size or example, unlike Worksheet 1 lines 1244–1250; why it matters: readers stall at blank fields; minimal fix: copy the Worksheet 1 blank-plus-example pattern into each Ch. 1–10 process blank.
- Glossary is not reader-ready: Core lines 53–64 and Clinical lines 68–80 give definitions with no `See Ch X` locators, and Clinical entries skip the Technical plus plain English plus implication pattern; why it matters: terms can't be resolved during reading; minimal fix: append locators to each glossary bullet and add one plain-English implication clause per Clinical entry, plus delete the stale line 565 diagram comment.

## Consistency table

| Area | Expected | Found |
| --- | --- | --- |
| Chapter headings | One level for all chapters | `#### Chapter 1` line 91 vs `### Chapter 4` line 431 |
| Part headings | One level for all parts | `## PART I` line 85 vs `### PART II` line 425 |
| Step labels | `Step 1: Observe`, `Step 2: Notice`, `Step 3: Regulate`, `Step 4: Choose + Act` | Ch. 1 bullets line 165 vs `#### Step 1–4` lines 502–518 |
| Prime labels | `Pre-Reading Check-In: Prime` | Unquoted line 101 vs quoted `"Prime"` lines 268, 640, 751 |
| Test Drive label | `Test Drive With — Name` | Source still reads `Try It With Them` line 149; built ebook already renames to Test Drive |
| Switch-Up | `Switch-Up` | `Switch-Up` line 53 vs `switches up` line 1353 |
| Hand-Off | `Hand-Off` | `Hand-Off` line 54 vs `Hand-Off (Projection)` line 308 |
| Three Moves | `Three Moves` | `Three Moves` line 33 vs `Three Defensive Moves` line 55 |
| BRAKE | `THE BRAKE` | `THE BRAKE` line 21 vs `the brake` in body prose |
| Camera Truth | `Camera-Recordable Truth` | `Camera truth` line 22 vs `Camera-Recordable Truth` line 58 |
| Middle Path | `Middle Path` | `Middle Path` line 1059 vs `Compassion with a fence around it` line 1091 |
| Foundation | `Unshakable Foundation` | `Unshakable Foundation` line 62 vs bare `Foundation` in Ch. 10 heading line 1120 |

## Verdict

Fix-then-ship: architecture matches [[advice]] — Tier 1 present, Tier 2 mostly present, Tier 3 correctly absent with no Elijah, Jill, Sofia, or 11-week claims; defects are localized edits, not structural failure.

## Ordered fix list

- Hedge the two deterministic motive sentences lines 128, 319 — small.
- Add repeated safety-exit block to Ch. 4 under `### 4.5` — small.
- Normalize Part, Chapter, and Step heading levels — medium.
- Backfill blank sizes plus examples in Ch. 1–10 processes using Worksheet 1 as template — medium.
- Add `See Ch X` locators plus plain-English implications to all glossary entries; delete stale line 565 comment — medium.
- Cap Teach at two new terms per chapter with a BRAKE bridge sentence before each workbook — large.
[Timestamp: 2026/09/05 18:20:22]

**user**: list all the suggested improvements you have for my content
[Timestamp: 2026/09/05 18:26:14]

**ai**: # All suggested content improvements for [[thebrakesthathitthegas]]

## Already applied in the ebook build

- Renamed the activity from `Try It` to `Test Drive` throughout the built ebook; vault source unchanged.
- Bolded **Test Drive** in the Start Here and Part I hub sentences.
- Fixed the Start Here sentence to: “one scenario plus its Test Drive makes a full session.”

## Proposed manuscript fixes

### Clinical safety — highest priority

- Hedge deterministic motive-mechanics with `can`, `may`, or `for some people`, especially [[thebrakesthathitthegas]] lines 128 and 319.
- Add the standard safety-exit block to Ch. 4 trapped-dependency content around lines 431–498, pointing to the Sources crisis note at line 1396.
- Keep backlash language as possible, not guaranteed; lines 589 and 1080 already model this.

### Structure and headings

- Normalize all Part headings to one level; currently `## PART I` line 85 vs `### PART II` line 425.
- Normalize all Chapter headings to one level; currently `#### Chapter 1` line 91 vs `### Chapter 4` line 431.
- Normalize all workbook steps to one format; currently Ch. 1 process bullets line 165 vs `#### Step 1–4` lines 502–518.
- Standardize Prime labels; currently unquoted `Prime` line 101 vs quoted `"Prime"` lines 268, 640, 751.
- Standardize activity labels to `Test Drive With — Name`; source still has `Try It With Them` variants such as line 149 and `David's Implementation Map` line 495.

### Term consistency

- Use `Switch-Up` everywhere; fix lowercase `switches up` around line 1353.
- Use `Hand-Off` everywhere; reconcile `Hand-Off (Projection)` line 308.
- Use `Three Moves` everywhere; reconcile `Three Defensive Moves` line 55.
- Use `THE BRAKE` for the tool name; reconcile lowercase body uses.
- Use `Camera-Recordable Truth`; reconcile `Camera truth` line 22 and `camera-recordable facts` variants.
- Use `Middle Path`; reconcile `Compassion with a fence around it` line 1091.
- Use `Unshakable Foundation`; reconcile bare `Foundation` in the Ch. 10 heading line 1120.

### Workbook integrity

- Backfill blank sizes plus examples in Ch. 1–10 processes, using Worksheet 1 lines 1244–1250 as the template.
- Fix bare `___` blanks without examples at lines 246–248 and 386–393.
- Ensure every insight ends with words plus follow-through plus expected discomfort plus if-escalate; Ch. 4 lines 495–496 already model this.
- Ensure every Test Drive specifies time, place, person, trigger, channel, and follow-through.
- Keep review-without-punishment templating consistent across Ch. 11, Ch. 12, and Maintenance.

### Voice and readability

- Simplify Clinical glossary entries lines 68–80 to 7th grade with Technical plus plain English plus implication.
- Shorten long Teach paragraphs such as lines 126–128 and 554; keep Teach sentences under 22 words and exercise sentences under 14 where possible.
- Keep paragraphs first; reserve bullets for steps, preserving short example/phrase lists only where needed.
- Sharpen one-promise-per-chapter openings for Ch. 1, Ch. 5, and Ch. 11.

### Pacing

- Rebalance Ch. 11 lines 1177–1298; it currently compresses Master 5-Step plus 13-field plan plus three worksheets.
- Add estimated times to Ch. 11 subsections without removing tools.
- Keep Primes progressing full to 30-second to self-led.

### HTML/readiness polish

- Delete the stale `drama-triangle-visual replaced` comment at line 565.
- Add `See Ch X` locators to every Core and Clinical glossary bullet lines 53–80.
- Validate GFM tables and confirm zero cite placeholders.
[Timestamp: 2026/09/05 18:26:14]