# Manuscript Compilation Checklist

## Quick Start

```bash
# Compile the manuscript
quarto render Manuscript.qmd

# Preview with live reload
quarto preview Manuscript.qmd
```

---

## Pre-Compilation Checklist

### Files Present
- [ ] `Manuscript.qmd` - Main manuscript file
- [ ] `references.bib` - Bibliography file
- [ ] `apa-7th-edition.csl` - Citation style file

### Software Installed
- [ ] Quarto (check: `quarto --version`)
- [ ] LaTeX distribution (check: `pdflatex --version`)
- [ ] R (optional, for analysis: `R --version`)

---

## Post-Compilation Verification

### PDF Rendering Checks

#### Title Page
- [ ] Title displays correctly
- [ ] Author name: "Mohammad Dastgheib"
- [ ] ORCID link/indicator present next to name
- [ ] Affiliation: "University of California, Riverside"
- [ ] Email is visible and clickable: mohammad.dastgheib@email.ucr.edu
- [ ] Correspondence note: "Correspondence should be addressed to..."
- [ ] Abstract is formatted correctly
- [ ] Keywords are listed

#### Document Structure
- [ ] All sections are numbered (1, 2, 3, etc.)
- [ ] Section hierarchy is correct (1.1, 1.2, etc.)
- [ ] Table of contents (if enabled) is accurate
- [ ] Page numbers appear on all pages

#### Content Sections
- [ ] **Section 1: Introduction** - renders correctly
- [ ] **Section 2: Background and Related Work** - renders correctly
  - [ ] Subsection 2.1: The Sensorimotor Implications of Spatial Input
  - [ ] Subsection 2.2: Cognitive Load Theory in Immersive Environments
- [ ] **Section 3: Research Objectives** - renders correctly
- [ ] **Section 4: Theoretical Framework** - renders correctly
  - [ ] Subsection 4.1: Fitts's Law
  - [ ] Subsection 4.2: Speed-Accuracy Tradeoff
  - [ ] Subsection 4.3: Drift Diffusion Model
- [ ] **Section 5: Methods** - renders correctly
  - [ ] All subsections present
- [ ] **Section 6: Results** - placeholder visible
- [ ] **Section 7: Discussion** - placeholder visible
- [ ] **Section 8: Conclusion** - placeholder visible
- [ ] **Section 9: Acknowledgments** - renders correctly
- [ ] **References** - section present

#### Mathematical Equations
- [ ] All equations render properly
- [ ] Inline math ($MT$, $D$, $W$) displays correctly
- [ ] Display equations are centered
- [ ] Fitts's Law equations: $ID = \log_2 \left( \frac{2D}{W} \right)$
- [ ] Shannon formulation: $ID = \log_2 \left( \frac{D}{W} + 1 \right)$
- [ ] Effective Width: $W_e = 4.133 \times SD_x$
- [ ] Throughput: $TP = \frac{ID_e}{MT}$

#### Tables
- [ ] Table 1 (Williams Design) renders correctly
- [ ] Table caption appears above table
- [ ] Table has proper borders and alignment
- [ ] All columns are readable

#### Code Blocks
- [ ] TypeScript code block (Adaptive Logic) is formatted
- [ ] Syntax highlighting is applied
- [ ] Code is readable

#### Citations
- [ ] All citations appear as links (blue text)
- [ ] Citations format correctly: (Author, Year)
- [ ] References section is populated
- [ ] All cited works appear in References
- [ ] No "?" marks for missing citations

**Test these specific citations:**
- [ ] [@jacob1990eye] → (Jacob, 1990)
- [ ] [@soukoreff2004towards] → (Soukoreff & MacKenzie, 2004)
- [ ] [@mackenzie1992fitts] → (MacKenzie, 1992)
- [ ] [@pfeuffer2017gaze+] → (Pfeuffer et al., 2017)
- [ ] [@hart2006nasa] → (Hart, 2006)
- [ ] [@williams1949experimental] → (Williams, 1949)

#### Hyperlinks
- [ ] ORCID link is clickable (should open https://orcid.org/0000-0001-7684-3731)
- [ ] Email link is clickable (should open email client)
- [ ] All citations are clickable (link to References)
- [ ] All cross-references work (if any)
- [ ] Links are colored blue

#### Typography
- [ ] Font size is 11pt
- [ ] Line spacing is 1.5
- [ ] Margins are 1 inch (all sides)
- [ ] Text is justified
- [ ] No orphaned headings (heading at bottom of page)
- [ ] No widows (single line at top of page)

---

## Common Issues and Fixes

### Issue: ORCID icon not showing
**Solution:** The current implementation uses text-based ORCID reference. For a graphical icon:
1. Download ORCID icon from https://orcid.org/trademark-and-id-display-guidelines
2. Place in project directory
3. Update LaTeX header to use `\includegraphics`

### Issue: Citation shows as "?"
**Solutions:**
1. Check citation key matches `references.bib`
2. Verify `.bib` file has no syntax errors
3. Recompile (sometimes needs 2 passes)

### Issue: Email not clickable
**Solution:** Ensure `hyperref` package is loaded and `urlcolor: blue` is set in YAML

### Issue: Equations not rendering
**Solutions:**
1. Check for unescaped special characters
2. Verify `amsmath` package is available
3. Check LaTeX log for errors

### Issue: Table formatting broken
**Solutions:**
1. Verify table syntax (pipes and alignment)
2. Check for missing or extra columns
3. Ensure caption syntax is correct: `: Caption {#tbl-label}`

### Issue: PDF not generating
**Solutions:**
1. Check terminal output for errors
2. Verify all required LaTeX packages are installed
3. Try: `quarto render Manuscript.qmd --verbose`
4. Check `Manuscript.log` for detailed errors

---

## File Size Check

Expected PDF size: **200-500 KB** (without figures)

If larger:
- Check for embedded fonts
- Verify no high-res images are accidentally included

---

## ArXiv Submission Final Checks

### Before Upload
- [ ] PDF compiles without errors
- [ ] PDF is under 10 MB (ArXiv limit)
- [ ] All fonts are embedded
- [ ] No compilation warnings (or all are resolved)
- [ ] Manuscript has been proofread
- [ ] All co-authors have approved (if applicable)

### Files to Submit
- [ ] `Manuscript.pdf` (required)
- [ ] `Manuscript.tex` (optional, for source)
- [ ] `references.bib` (if submitting source)
- [ ] `apa-7th-edition.csl` (if submitting source)
- [ ] Any figure files (if applicable)

### ArXiv Metadata
- [ ] Title matches manuscript
- [ ] Author name: Mohammad Dastgheib
- [ ] Affiliation: University of California, Riverside
- [ ] Primary category: **cs.HC** (Human-Computer Interaction)
- [ ] Secondary categories: cs.GR (Graphics), cs.AI (if applicable)
- [ ] Abstract matches manuscript
- [ ] Keywords/tags added

### License
- [ ] Choose appropriate license (typically: arXiv non-exclusive license)
- [ ] Verify no copyright conflicts

---

## Quality Assurance

### Readability
- [ ] Abstract is clear and concise (200-300 words)
- [ ] Introduction motivates the problem
- [ ] Methods are detailed enough to replicate
- [ ] Figures/tables have descriptive captions
- [ ] Conclusion summarizes contributions

### Consistency
- [ ] Terminology is consistent throughout
- [ ] Abbreviations defined on first use
- [ ] Citation style is uniform
- [ ] Section numbering is sequential
- [ ] Equation numbering is correct

### Professional Polish
- [ ] No spelling errors
- [ ] No grammatical errors
- [ ] No placeholder text (except in Results/Discussion/Conclusion if pre-data)
- [ ] All references are complete
- [ ] Author information is accurate

---

## Compilation Commands Reference

```bash
# Basic compilation
quarto render Manuscript.qmd

# Verbose output (for debugging)
quarto render Manuscript.qmd --verbose

# Preview with live reload
quarto preview Manuscript.qmd

# Compile to specific format
quarto render Manuscript.qmd --to pdf

# Check Quarto version
quarto --version

# Check LaTeX installation
pdflatex --version

# Validate BibTeX file
biber --validate-datamodel references.bib
```

---

## Contact

If you encounter issues not covered here:

**Mohammad Dastgheib**
- Email: mohammad.dastgheib@email.ucr.edu
- ORCID: https://orcid.org/0000-0001-7684-3731

**Resources:**
- Quarto Documentation: https://quarto.org/docs/guide/
- ArXiv Help: https://arxiv.org/help/
- LaTeX Stack Exchange: https://tex.stackexchange.com/

---

## Version

**Checklist Version:** 1.0  
**Date:** December 6, 2025  
**For Manuscript:** Manuscript.qmd v2.0








