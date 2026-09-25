---
epoch: 1788644499105
mode: agent
backendId: opencode
sessionId: "ses_f8c7b11a0ffew5YkqF4NVatqRb"
agentLabel: "Markdown to EPUB/PDF ebook conversion prompt"
usage: '{"usedTokens":91286,"contextWindow":200000,"updatedAt":1788645673128}'
tags:
  - copilot-conversation
---

**user**: Here is a **ready-to-copy prompt** that you can paste directly to your agent (Claude, ChatGPT with Code Interpreter, or similar). It contains all the design decisions, CSS, and step‑by‑step conversion instructions—so your agent can produce the final ebook without changing a single word of your original content.

---

```
# Ebook Production Prompt – "The Brakes That Hit the Gas"

You are tasked with converting the Markdown file `thebrakesthathitthegas.md` into a clean, modern ebook in **EPUB** (reflowable) and **PDF** (print/tablet) formats. 

## Absolute Rule
**Do not change, rephrase, or remove any of the original content.** The text must remain identical to the source. You may only adjust presentation where absolutely necessary (e.g., converting interactive placeholders to static blanks) – and even then, only in a way that preserves the original wording and meaning.

## Output Requirements
- Produce a **high‑quality EPUB** (`output.epub`) suitable for e‑readers.
- Produce a **PDF** (`output.pdf`) with a fixed, elegant layout for desktop/printing.
- Include a **table of contents** (navigable in both formats).
- The design must feel **calm, modern, and spacious** – matching the tone of the book.

## Step‑by‑Step Instructions

### 1. Prepare the Markdown Source
Before conversion, make these **non‑content‑changing** adjustments to the file:
- Replace every occurrence of `<!-- input:... -->` (e.g., `<!-- input:scale:0-10 distress -->`, `<!-- input:text:short -->`) with a simple blank underline. For example, `Distress 0-10: ______` or just leave `_____` as a placeholder for hand‑writing.
  - *Do not remove the surrounding label – keep the question/label exactly as written.*
  - This is a visual change, not a textual rewrite.

### 2. Create the CSS Stylesheet
Save the following CSS as `style.css` in the same directory as the Markdown file. This is the exact styling the book requires.

```css
/* Reset & base */
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 1.1rem;
  line-height: 1.7;
  color: #1e1e1e;
  background: #fcfcfc;
  padding: 2rem 5%;
  max-width: 720px;
  margin: 0 auto;
}

/* Headings */
h1, h2, h3, h4 {
  font-weight: 600;
  line-height: 1.3;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  color: #1e3a5f;
}
h1 { font-size: 2.4rem; border-bottom: 2px solid #d4a373; padding-bottom: 0.3rem; }
h2 { font-size: 1.8rem; border-bottom: 1px solid #e0d6c8; padding-bottom: 0.2rem; }
h3 { font-size: 1.4rem; }
h4 { font-size: 1.2rem; font-weight: 500; }

p { margin-bottom: 1.2rem; }

/* Blockquotes (Cold opens) */
blockquote {
  margin: 1.5rem 0;
  padding: 1rem 1.5rem;
  background: #f8f5f0;
  border-left: 6px solid #c98b5c;
  font-style: italic;
  color: #2c2c2c;
}

/* Tables */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  font-size: 0.95rem;
}
th {
  background: #f0ede8;
  font-weight: 600;
  text-align: left;
  padding: 0.6rem 0.8rem;
}
td {
  padding: 0.6rem 0.8rem;
  border-bottom: 1px solid #e0d6c8;
}

/* Code / Diagram blocks */
pre, code {
  font-family: "SF Mono", Menlo, Consolas, monospace;
  font-size: 0.9rem;
  background: #f4f3f0;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
}
pre {
  padding: 1rem;
  border: 1px solid #e0d6c8;
  overflow-x: auto;
  margin: 1.5rem 0;
  border-radius: 6px;
}

/* Custom box styles for scenarios, Try It, worksheets */
.scenario, .try-it, .worksheet {
  background: #f8f6f2;
  padding: 1.2rem 1.5rem;
  margin: 1.8rem 0;
  border-radius: 8px;
  border-left: 6px solid #d4a373;
}
.try-it { border-left-color: #5b8c7a; }
.worksheet { border-left-color: #6b7b8d; background: #f5f7fa; }

/* Glossary (definition lists) */
dl {
  margin: 1rem 0;
}
dt {
  font-weight: 600;
  color: #1e3a5f;
  margin-top: 0.8rem;
}
dd {
  margin-left: 1.2rem;
  margin-bottom: 0.4rem;
}

/* Placeholder for fill‑in fields */
.underline-placeholder {
  display: inline-block;
  min-width: 100px;
  border-bottom: 1px dashed #b0a8a0;
  margin: 0 0.3rem;
}
```

### 3. Run the Conversion
Use **Pandoc** to generate both formats. If Pandoc is not installed, install it first (e.g., `sudo apt install pandoc` or `brew install pandoc`). For PDF, use `weasyprint` as the engine (install with `pip install weasyprint`).

- **EPUB**:
  ```
  pandoc thebrakesthathitthegas.md -o thebrakes.epub --css=style.css --toc --toc-depth=2 --metadata title="The Brakes That Hit the Gas" --metadata author="Elizabeth Ross"
  ```

- **PDF**:
  ```
  pandoc thebrakesthathitthegas.md -o thebrakes.pdf --css=style.css --toc --toc-depth=2 --pdf-engine=weasyprint --metadata title="The Brakes That Hit the Gas" --metadata author="Elizabeth Ross"
  ```

If `weasyprint` is unavailable, fallback to `--pdf-engine=wkhtmltopdf` or `--pdf-engine=xelatex` (but the CSS may need minor TeX adjustments – we prefer WeasyPrint for best CSS support).

### 4. Quality Check
After conversion, briefly verify:
- The **table of contents** appears correctly.
- **Tables** and **diagrams** (rendered as `<pre>` blocks) are readable.
- The **colour accents** (soft gold/ochre) appear as intended.
- No content has been accidentally altered.

### 5. Deliverables
Provide the user with:
1. `thebrakes.epub`
2. `thebrakes.pdf`
3. (Optional) The `style.css` file for reference.

## Important Notes for the Agent
- If you encounter any Markdown parsing quirks (e.g., nested lists or tables), use Pandoc’s `--strict` or adjust the input only to fix syntax – but **never change the actual prose**.
- For the interactive placeholders (`<!-- input:... -->`), use a simple search‑and‑replace to turn them into underscores or dashed lines. This is the only allowed modification.
- The cover is not specified – if you can generate a minimal cover (title + author on a clean background), do so; otherwise skip it.

Begin by reading the file, confirming its location, and then execute the steps above. Provide the final files to the user.
```

---

**How to use this prompt:**  
Copy the entire block above and paste it into your agent’s chat window. The agent will then follow the plan, applying the exact CSS and conversion commands to produce your clean, modern ebook—all while leaving your carefully written content untouched.
[Timestamp: 2026/09/05 17:41:39]

**ai**: I'll execute this ebook production prompt step by step. Let me first check the file's location and verify the environment.The source file is at `thebrakesthathitthegas.md`, but Pandoc and WeasyPrint aren't installed. Let me set up the plan, read the source, and install the tools.The source file is confirmed — a substantial manuscript. `brew` isn't on the default PATH; let me check for it and other install options.Let me continue reading the manuscript and start installing Pandoc.

Pandoc 3.11 is installed. Now let me get WeasyPrint — first checking which Python environments are available.WeasyPrint installed. Let me verify the CLI path and then set up the working files.WeasyPrint needs system libraries (pango/gobject) that aren't installed. Let me install them via brew — and check fallbacks in parallel.WeasyPrint seems to load now. Let me verify it actually renders a PDF with a quick smoke test.Pango installed but the system Python can't find Homebrew's libs. Let me point WeasyPrint at them via `DYLD_LIBRARY_PATH` — or better, install WeasyPrint into the Homebrew Python which knows its own paths.WeasyPrint works with the Homebrew lib path. Now let me survey the placeholder patterns and headings in the source so I can prepare a conversion copy correctly.WeasyPrint works with the Homebrew libs. Now I have the full picture: 37 `<!-- input:... -->` placeholders and a notable heading-level inconsistency (Part I is `##` with `####` chapters; Parts II/III are `###` with `###` chapters and `###` subsections). I'll normalize heading levels **in a conversion copy only** — presentation, not prose — so the TOC is navigable, and leave the user's original file untouched.Now writing the stylesheets and cover template:

Now the conversion-copy preparation script — it strips interactive placeholders (keeping the surrounding labels and existing underscores) and normalizes heading levels, then verifies nothing else changed:Conversion copy is clean: 37 placeholders removed, 103 heading levels normalized, **zero unexpected changes**. The original file is untouched.

Now let me render the cover and build both formats:This WeasyPrint version infers format from the output extension — retrying without `-f`:WeasyPrint 66 doesn't write PNG directly — it produced a PDF. I'll render the cover as PDF and rasterize it with pypdfium2 (already installed). First checking if Pillow is available:

Both libraries are available. Rasterizing the cover to PNG:The cover div overflowed the default A4 page. Let me set the page size to match the cover exactly:Cover is 1600×2560. Quick visual check:The model can't preview images, so I'll verify the cover dimensions programmatically (done: 1600×2560) and continue. Now the conversions — EPUB first, then PDF:Both files generated. (The `overflow-x` warning is harmless — WeasyPrint just ignores it.) Now the quality check — first the EPUB internals:The package structure looks right. Let me inspect the nav/TOC and verify content integrity:TOC is fully navigable — all 12 chapters under their three parts. Now content integrity spot-checks and CSS embedding:Mostly good — the "0" hits need verification (they're likely split by HTML tags: `**THE BRAKE:**` → `<strong>`, and entities). Let me verify with tag-aware checks:EPUB content is fully intact. Now the PDF quality check — page count, page size, text integrity, and color-ink verification:Numpy isn't available — I'll sample pixels with pure PIL instead:Let me dig deeper — first see what's actually on the first pages via text extraction, then a finer color scan:Text flow looks correct. The color scan needs refinement — let me analyze actual rendered colors at full resolution:Colors confirmed rendering correctly on body pages (deep-blue headings, burnt-ochre blockquote borders). Two refinements needed:

1. The TOC page shows default link-blue — I'll pin link color to the palette in the PDF-only stylesheet for a cohesive print look
2. Verify PDF bookmarks/outlines and table rendering

Bookmarks may be compressed inside object streams (invisible to grep). Let me check the actual PDF structure with pdfminer — both outline tree and internal TOC link annotations:Excellent — **148 outline bookmarks** in the PDF (full heading tree), and the EPUB nav was verified earlier. Final content checks on the PDF (tables, diagrams, worksheets) plus EPUB XML well-formedness:One MISSING hit is likely a table-header wrap issue in extraction. Verifying with flexible matching:The 11.2 table seems absent from PDF text extraction — let me investigate whether it dropped out entirely:The 11.2 table is fully present — the earlier "missing" was just pdfminer's column-splitting during text extraction; the rendered table contains every cell. All checks pass. Now delivering the final files to the vault root (same directory as the markdown, per the prompt):Done. The ebook is produced and verified. Here's the full rundown:

## Deliverables
- **`thebrakes.epub`** — EPUB3, reflowable, with cover, navigable TOC, embedded stylesheet (102 KB)
- **`thebrakes.pdf`** — US Letter, 80 pages, WeasyPrint-rendered (293 KB), with a 148-entry bookmark tree
- **`style.css`** — the exact CSS from your prompt

All three sit in the vault root next to the source file. Your original `thebrakesthathitthegas.md` is **untouched** — all changes were made to a working copy, so no prose was altered at any point.

## What was applied (and verified)
- **37 interactive placeholders** (`<!-- input:... -->`) converted to static blanks — labels like `Distress 0-10: ______` and `Total ___/25.` kept exactly as written. Zero `input:` markers remain in either output.
- **Heading levels normalized** in the working copy (presentation only): your source mixes `##`/`###`/`####` for Parts and Chapters (Part I is `##` with `####` chapters; Parts II–III are `###` with `###` chapters **and** `###` subsections). I leveled this to Parts → h2, Chapters → h3, numbered sections → h4, Steps/Moves/Worksheets → h5. This was necessary because with the prompt's `--toc-depth=2`, Chapters 1–3 would not have appeared in the TOC at all.
- **TOC depth 3** (the prompt said 2) for the same reason — depth 2 yields only the title, front matter, and parts; depth 3 delivers all 12 chapters under their three parts. TOC verified in the EPUB nav, the NCX, and the PDF outline.
- **Minimal cover** generated: *The Brakes That Hit the Gas / The Art of Guilt-Free Self-Preservation / ELIZABETH ROSS* on a warm cream background with the ochre rule in the book's palette. Embedded in the EPUB (the PDF intentionally starts with its title page instead).
- **PDF-only extras** (`style-pdf.css`, not in the final style.css): Letter page margins and TOC link colors pinned to the palette instead of browser-blue.

## Quality checks passed
- All 80 PDF pages sized Letter; tables (Guilt vs. Shame, Polyvagal zones, Master Somatic Log) and diagram lists render with every cell intact; worksheet blanks (`______ → ______`) present.
- Colors verified by pixel-sampling the rendered pages: headings in `#1e3a5f`, blockquote borders `#c98b5c`, ochre `#d4a373` accents, cream box backgrounds — all present.
- Prose spot-checks across the book (cold opens, Try It boxes, Sources, the safety disclaimer, the closing line) all matched exactly, including curly apostrophes.
- All EPUB XHTML/OPF/NCX files are XML well-formed.

## Environment notes
- Installed via Homebrew: pandoc 3.11, pango/glib (WeasyPrint's system deps); WeasyPrint 66 installed into the system Python and needs `DYLD_LIBRARY_PATH=/opt/homebrew/lib` to load pango.
- One caveat: this model can't view images, so the cover was verified by dimensions and pixel-sampling rather than eyeball — worth a quick look yourself.

**Regenerate anytime** with: `pandoc thebrakesthathitthegas.md -o thebrakes.epub --css=style.css --toc --toc-depth=3 --epub-cover-image=cover.png --metadata title="The Brakes That Hit the Gas" --metadata author="Elizabeth Ross"` (substitute the PDF command with `--pdf-engine=weasyprint` and both `--css` files for the print version).
[Timestamp: 2026/09/05 17:41:39]