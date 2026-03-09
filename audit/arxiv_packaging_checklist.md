# arXiv Packaging Checklist

**Date:** 2025-03-07  
**Target:** Single-file PDF upload (recommended) or source+PDF

---

## Required for Upload

| File | Purpose |
|------|---------|
| **Manuscript.pdf** | Primary submission; arXiv accepts PDF directly |
| (Optional) Manuscript.tex | If submitting source; Quarto produces this |
| (Optional) references.bib | If submitting source |
| (Optional) apa-7th-edition.csl | If submitting source |

---

## Figure/Asset Paths

Manuscript.qmd references:
- `../assets/case_study/*.png` — relative to docs/manuscript; resolves to docs/assets/case_study
- `../../outputs/LBA/lba_trace_plot.png` — relative to docs/manuscript; resolves to outputs/LBA

**For PDF-only upload:** All figures are embedded in the PDF. No path issues.

**For source upload:** Must ensure figure paths resolve from the upload directory. Quarto/LaTeX embeds figures at render time; the generated .tex references the correct paths. If uploading a tarball with `docs/manuscript/` as root, paths would need adjustment. **Recommendation:** Upload PDF only to avoid path complexity.

---

## Files to NOT Upload

| File | Reason |
|------|--------|
| audit/*.md | Internal audit; not part of manuscript |
| CHATGPT_*.md, DISCUSSION_*.md | Internal prompts |
| Manuscript_files/ | Quarto HTML output; not needed for PDF |
| Manuscript.html | HTML version; not needed |
| data/ | Raw data; not typically in arXiv |
| .git/ | Version control |

---

## Dependencies

- **PDF render:** Quarto, pandoc, xelatex, bibtex
- **Bibliography:** references.bib, apa-7th-edition.csl
- **Figures:** Must exist at render time; all in docs/assets/case_study and outputs/LBA

---

## Final Packaging Recommendation

**For arXiv:** Upload **Manuscript.pdf** only.

1. Render: `quarto render docs/manuscript/Manuscript.qmd --to pdf`
2. Upload: `docs/manuscript/Manuscript.pdf`
3. arXiv will accept the PDF; figures are embedded; no path issues.

**Alternative (source):** If the venue requires source, create a tarball with:
- Manuscript.tex (from keep-tex: true)
- preamble.tex
- references.bib
- apa-7th-edition.csl
- All figure files (copy to a flat directory or adjust paths)
- main .bib if needed

The PDF-only approach is simpler and avoids path/compile issues on arXiv's side.
