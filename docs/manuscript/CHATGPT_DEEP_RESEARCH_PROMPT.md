# ChatGPT Deep Research Prompt: Manuscript & Repo Assessment for arXiv Preprint

**Instructions:**
1. Copy the entire prompt below into ChatGPT's **Deep Research** feature.
2. Attach or link:
   - The manuscript PDF: `docs/manuscript/Manuscript.pdf` (or render it first with `quarto render docs/manuscript/Manuscript.qmd`)
   - The GitHub repository URL (ChatGPT Deep Research can browse repos)
3. The AI will conduct a thorough assessment and produce an actionable checklist.

---

## PROMPT (copy everything below this line)

---

You are conducting a comprehensive pre-submission audit of an HCI research manuscript and its associated open-source repository, with the goal of producing a **flawless arXiv preprint** ready for submission. Your task is to assess both the manuscript content and the GitHub repository, then produce a detailed, prioritized, actionable report.

### CONTEXT

**Manuscript:** "Adaptive Modality Systems in Extended Reality: Optimizing Input-Output Bandwidth Through Context-Aware Gaze-Hand Switching"

**Domain:** Human-Computer Interaction (HCI), Extended Reality (XR), Adaptive Interfaces, Gaze Interaction, Fitts's Law, Multimodal Interaction

**Target venue:** arXiv (primary category: cs.HC)

**Repository:** https://github.com/mohdasti/xr-adaptive-modality-2025

**Manuscript location in repo:** `docs/manuscript/Manuscript.qmd` (Quarto source), `docs/manuscript/Manuscript.pdf` (rendered output)

**Key artifacts to examine:**
- `docs/manuscript/` — Manuscript source, references, preamble, figures
- `docs/preregistration.md`, `docs/hypotheses.md`, `docs/methods_detail.md` — Study design
- `analysis/` — R and Python analysis scripts (primary models, LBA, visualizations)
- `app/` — React/TypeScript web application (experiment platform)
- `data/` — Data dictionaries, clean data structure
- `README.md` — Project overview, reproducibility instructions

---

### PART 1: MANUSCRIPT ASSESSMENT

Evaluate the manuscript against the following dimensions. For each dimension, provide: (a) specific findings, (b) severity (Critical / Major / Minor), (c) exact location (section, page, line if possible), (d) actionable fix.

#### 1.1 Structure and Completeness

- [ ] **Abstract:** Does it clearly state problem, approach, method, findings, and implications? Is it within 150–250 words for arXiv?
- [ ] **Introduction:** Does it establish motivation, gap, contribution, and roadmap? Is there a clear thesis statement?
- [ ] **Background/Related Work:** Is prior work adequately cited? Are there gaps or outdated references? Are competing approaches fairly represented?
- [ ] **Methods:** Are apparatus, participants, design, procedure, and measures fully described? Is the design reproducible from the text alone?
- [ ] **Results:** Are all research questions (RQ1–RQ3) addressed with appropriate statistics? Are tables and figures referenced correctly?
- [ ] **Discussion:** Are findings interpreted, limitations acknowledged, and implications discussed?
- [ ] **Conclusion:** Does it summarize contributions and future work without introducing new claims?
- [ ] **Placeholders:** Are there any placeholder text (e.g., "[to be completed]") or empty sections?

#### 1.2 Statistical and Methodological Rigor

- [ ] **Sample size:** Is N reported consistently? Is power analysis justified? Are exclusions justified and transparent?
- [ ] **Design:** Is the 2×2×2 factorial design (Modality × UI Mode × Pressure) clearly described? Is counterbalancing (Williams design) explained?
- [ ] **Analysis plan:** Are mixed-effects models, contrasts, and TOST equivalence tests described? Are assumptions stated?
- [ ] **Effect sizes:** Are effect sizes (e.g., Cohen's d, CIs) reported alongside p-values?
- [ ] **Multiple comparisons:** Is correction for multiple comparisons (e.g., Bonferroni) mentioned where applicable?
- [ ] **Pre-registration:** Is preregistration clearly stated and linked?

#### 1.3 Writing Quality

- [ ] **Clarity:** Is jargon defined? Are sentences concise? Are there run-on or ambiguous sentences?
- [ ] **Consistency:** Are terms used consistently (e.g., "gaze" vs "eye-based")? Are abbreviations defined on first use?
- [ ] **Flow:** Do transitions between sections and paragraphs work smoothly?
- [ ] **Tone:** Is the tone appropriate for an academic preprint (neutral, precise)?

#### 1.4 Formatting and Compliance

- [ ] **arXiv requirements:** Single-column, reasonable margins, font size, line spacing? (arXiv typically accepts standard article format.)
- [ ] **Figures:** Are all figures present, legible, and properly captioned? Are axes labeled? Are color choices accessible?
- [ ] **Tables:** Are tables formatted with proper headers (e.g., booktabs)? Are units and CIs clearly indicated?
- [ ] **Equations:** Are equations numbered and referenced correctly? Are variables defined?
- [ ] **Citations:** Are all in-text citations in the bibliography? Are there any missing or broken references?
- [ ] **Keywords:** Are 6–8 relevant keywords provided?

#### 1.5 Reproducibility (Within Manuscript)

- [ ] **Data availability:** Is data availability stated (e.g., Zenodo DOI)?
- [ ] **Code availability:** Is the code repository linked and described?
- [ ] **Materials:** Are materials (e.g., task instructions, stimuli) described or linked?

---

### PART 2: REPOSITORY ASSESSMENT

Evaluate the GitHub repository for reproducibility, documentation, and alignment with the manuscript.

#### 2.1 Reproducibility

- [ ] **README:** Does it clearly explain how to run the experiment, merge data, and run the analysis pipeline?
- [ ] **Dependencies:** Are all dependencies (R, Python, Node, packages) clearly specified with versions?
- [ ] **One-command run:** Is there a single command to run the full analysis (e.g., `Rscript analysis/run_all.R`)?
- [ ] **Data pipeline:** Is the process from raw data → clean data → analysis outputs documented?
- [ ] **Output paths:** Are output paths consistent with what the manuscript references?

#### 2.2 Code Quality

- [ ] **Structure:** Is the project structure logical and documented?
- [ ] **Scripts:** Are analysis scripts well-commented and modular?
- [ ] **LBA/DDM:** Is the LBA model (or other decision models) documented and reproducible?
- [ ] **Figures:** Can manuscript figures be regenerated from the repo scripts?

#### 2.3 Documentation

- [ ] **Preregistration:** Is the preregistration document complete and linked?
- [ ] **Hypotheses:** Are H1–H5 clearly stated with quantified expectations?
- [ ] **Data dictionary:** Is there a complete data dictionary for all logged variables?
- [ ] **Deployment:** Is deployment (e.g., Vercel) documented for remote data collection?

#### 2.4 Consistency with Manuscript

- [ ] **Sample size:** Does the repo README or data match the sample size reported in the manuscript?
- [ ] **Exclusions:** Are exclusion rules documented and consistent with the manuscript?
- [ ] **Output paths:** Do manuscript figure paths (e.g., `../../outputs/LBA/lba_trace_plot.png`) match actual repo structure?

---

### PART 3: ARXIV-SPECIFIC CHECKLIST

- [ ] **Category:** Is cs.HC (Human-Computer Interaction) the primary category? Are secondary categories appropriate?
- [ ] **License:** Is the license (e.g., GPL-3.0) clearly stated for code and data?
- [ ] **Author info:** Are ORCIDs, affiliations, and correspondence clearly stated?
- [ ] **Abstract length:** Does the abstract fit arXiv requirements?
- [ ] **File size:** Are PDF and supplementary files within size limits?

---

### PART 4: OUTPUT FORMAT

Produce a **prioritized action report** with the following structure:

1. **Executive Summary** (1 paragraph): Overall assessment and top 3–5 critical fixes.

2. **Critical Issues** (must fix before submission):

   | # | Issue | Location | Fix |
   |---|-------|----------|-----|
   | 1 | ... | ... | ... |

3. **Major Issues** (should fix for a strong preprint):

   | # | Issue | Location | Fix |
   |---|-------|----------|-----|

4. **Minor Issues** (nice to have):

   | # | Issue | Location | Fix |
   |---|-------|----------|-----|

5. **Repository-Specific Recommendations**:

   | # | Recommendation | Priority |
   |---|----------------|----------|

6. **Manuscript-Specific Recommendations**:

   | # | Recommendation | Priority |
   |---|----------------|----------|

7. **Pre-Submission Checklist** (copy-paste ready):

   ```
   [ ] [Critical] ...
   [ ] [Critical] ...
   [ ] [Major] ...
   [ ] [Major] ...
   [ ] [Minor] ...
   ```

8. **Suggested Timeline** (if applicable): Estimated effort for each category of fixes.

---

### PART 5: ADDITIONAL CONTEXT

- **Data collection status:** Completed (N=70 participants, 3,985 trials). Data logging bug affected 7 participants; N=23 used for primary factorial analysis.
- **Target sample:** N=48 for full confirmatory analysis; interim results reported.
- **Key analysis outputs:** LBA parameters, throughput, error rate, NASA-TLX, Fitts’ Law slopes.
- **Figures:** Task layout, throughput, error rate, error type composition, NASA-TLX, LBA trace, Fitts validation.

---

**End of prompt.** Conduct your assessment and produce the report as specified in Part 4.
