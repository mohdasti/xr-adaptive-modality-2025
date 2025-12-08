# Manuscript Compilation Guide

## Overview

This manuscript (`Manuscript.qmd`) is formatted for ArXiv submission in the CS/HCI category. It follows standard academic preprint formatting with proper author metadata, ORCID integration, and correspondence information.

## Requirements

### Software
- **Quarto** (latest version): https://quarto.org/docs/get-started/
- **LaTeX distribution**: 
  - MacOS: MacTeX (https://www.tug.org/mactex/)
  - Windows: MiKTeX (https://miktex.org/)
  - Linux: TeX Live

### LaTeX Packages
The following packages will be automatically installed by your LaTeX distribution when compiling:
- `hyperref` - for clickable links
- `amsmath`, `amssymb` - for mathematical notation
- `graphicx` - for figures
- `booktabs` - for professional tables

## Compiling the Manuscript

### Basic Compilation

```bash
quarto render Manuscript.qmd
```

This will generate:
- `Manuscript.pdf` - The rendered PDF
- `Manuscript.tex` - The intermediate LaTeX file (if `keep-tex: true`)

### Preview While Editing

```bash
quarto preview Manuscript.qmd
```

This opens a live preview that updates as you edit.

## Document Structure

The manuscript follows standard ArXiv/academic paper structure:

1. **Title and Author Metadata**
   - Title
   - Author name with ORCID link
   - Affiliation
   - Email (clickable)
   - Correspondence note

2. **Abstract**
   - Concise summary of the work

3. **Keywords**
   - 6-8 relevant terms for indexing

4. **Main Sections**
   - Introduction
   - Background and Related Work
   - Research Objectives
   - Theoretical Framework
   - Methods
   - Results (placeholder)
   - Discussion (placeholder)
   - Conclusion (placeholder)
   - Acknowledgments
   - References

## Author Metadata Features

The document includes:

✅ **ORCID Integration**: Your ORCID (0000-0001-7684-3731) is displayed with a visual indicator
✅ **Email**: Clickable mailto link (mohammad.dastgheib@email.ucr.edu)
✅ **Correspondence Note**: Clearly indicates you as the corresponding author
✅ **Affiliation**: University of California, Riverside

## Citations

All citations use the APA 7th edition style (`apa-7th-edition.csl`). 

### Adding New References

1. Add the BibTeX entry to `references.bib`
2. Cite in text using `[@citationkey]` for parenthetical citations
3. Use `@citationkey` for narrative citations

### Current References
- `jacob1990eye` - Jacob (1990) - Eye movement interaction
- `soukoreff2004towards` - Soukoreff & MacKenzie (2004) - Fitts's Law standard
- `mackenzie1992fitts` - MacKenzie (1992) - Fitts's Law in HCI
- `pfeuffer2017gaze+` - Pfeuffer et al. (2017) - Gaze+Pinch interaction
- `hart2006nasa` - Hart (2006) - NASA-TLX
- `williams1949experimental` - Williams (1949) - Experimental design

## Preparing for ArXiv Submission

### Step 1: Compile to PDF
```bash
quarto render Manuscript.qmd
```

### Step 2: Generate Standalone LaTeX (Optional)
If ArXiv requires LaTeX source:

1. Set `keep-tex: true` in the YAML header (already set)
2. Compile the document
3. Check the generated `Manuscript.tex` file
4. Include `references.bib` and `apa-7th-edition.csl` in your submission

### Step 3: Verify PDF
Check that the PDF includes:
- [ ] ORCID displayed correctly next to your name
- [ ] Email is clickable
- [ ] Correspondence note appears
- [ ] All citations render properly
- [ ] All equations display correctly
- [ ] Tables are properly formatted
- [ ] Section numbering is correct

### Step 4: ArXiv Submission Categories
Recommended primary category: **cs.HC** (Human-Computer Interaction)

Secondary categories:
- **cs.GR** (Graphics)
- **cs.AI** (Artificial Intelligence) - if emphasizing adaptive algorithms

## Troubleshooting

### ORCID Icon Not Displaying
The current implementation uses a text-based indicator. For a graphical ORCID icon, you would need to:
1. Download the ORCID icon SVG/PNG
2. Include it in your project
3. Modify the LaTeX header to use `\includegraphics`

### Citation Not Found
- Ensure the citation key in your text matches the key in `references.bib`
- Check for typos in citation keys
- Verify the `.bib` file is properly formatted

### Compilation Errors
- Check that all required LaTeX packages are installed
- Verify that `references.bib` has no syntax errors
- Ensure `apa-7th-edition.csl` is in the same directory

### PDF Links Not Working
- Ensure `colorlinks: true` is set in the YAML header
- Check that `hyperref` package is loaded (it's in the header)

## Document Statistics

- **Current word count**: ~4,500 words (Introduction through Methods)
- **Target length**: 8,000-10,000 words (typical for ArXiv preprints)
- **Sections complete**: 1-6 (Introduction through Methods)
- **Sections pending**: Results, Discussion, Conclusion

## Next Steps

1. **Complete data collection** (N=24 participants)
2. **Run statistical analyses** (mixed-effects models in R)
3. **Generate figures** (throughput plots, NASA-TLX comparisons)
4. **Write Results section** (descriptive stats + inferential tests)
5. **Write Discussion section** (interpret findings, limitations)
6. **Write Conclusion section** (summarize contributions)
7. **Final review and proofreading**
8. **Submit to ArXiv**

## Contact

For questions about this manuscript, contact:
- **Mohammad Dastgheib**
- Email: mohammad.dastgheib@email.ucr.edu
- ORCID: https://orcid.org/0000-0001-7684-3731

## License

This manuscript and associated code are part of the xr-adaptive-modality-2025 project.



