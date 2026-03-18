# arXiv Submission Package

This folder contains everything needed to submit the manuscript to arXiv. **Do not upload the PDF**—arXiv requires the LaTeX source and will compile it themselves.

## What to Upload

Upload **all files** in this directory to arXiv's "Add Files" step:

1. **Manuscript.tex** – Main LaTeX source (arXiv will auto-detect this)
2. **All 10 figure files** (.png):
   - psychophysics.png
   - Task_layout.png
   - performance_combined.png
   - error_type_composition.png
   - tlx_overall.png
   - tlx_subscales.png
   - lba_t0_forest.png
   - verification_rt_empirical.png
   - fitts_validation.png
   - lba_trace_plot.png

## How to Submit

1. Go to [arXiv Submit](https://arxiv.org/submit) and log in
2. **Remove** any previously uploaded PDF
3. In "Add Files", upload all files from this folder (or upload a `.tar.gz` or `.zip` of the folder)
4. Select **"LaTeX"** as the submission type when prompted
5. Choose **PDFLaTeX** as the processor (arXiv will typically auto-select this)
6. Click **Process** – arXiv will compile the source and show you the generated PDF
7. Review the PDF, then complete the submission

## Pre-built Archive

A ready-to-upload archive is included: **arxiv-submission.tar.gz**

Upload this single file to arXiv, or extract it and upload the contents individually.

## What Was Fixed for arXiv

- **Figure paths**: Changed from `../assets/case_study/` and `../../outputs/LBA/` to flat paths (figures in same directory)
- **Unicode minus sign**: Added `\DeclareUnicodeCharacter{2212}{-}` so the Unicode minus (U+2212) compiles with PDFLaTeX
- **Bibliography**: Already inlined in the .tex (no .bib or .bbl needed)
- **Figure format**: All figures are .png (compatible with PDFLaTeX)

## If Processing Fails

If arXiv reports errors, check the TeX log they provide. Common issues:

1. **"Option clash for package hyperref"** – Scroll past this; it's usually harmless. Look for the actual error below.
2. **Missing figures** – Ensure all 10 .png files are uploaded and filenames match exactly (arXiv is case-sensitive: `Task_layout.png` not `task_layout.png`).
3. **Custom packages** – All packages used (orcidlink, needspace, etc.) are in TeX Live and should work on arXiv.

## Regenerating This Package

If you update the manuscript, regenerate the submission package:

```bash
# From project root
quarto render docs/manuscript/Manuscript.qmd --to pdf  # Regenerates Manuscript.tex
# Then re-run the copy and path-fix steps, or use the script if one exists
```
