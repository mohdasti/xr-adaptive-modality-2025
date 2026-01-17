# Documentation Index

This directory contains all project documentation organized by category.

## Directory Structure

```
docs/
├── README.md                    # This file - documentation index
├── guides/                      # User guides and how-to documentation
│   ├── DEPLOYMENT_GUIDE.md     # How to deploy the app to Vercel/Netlify
│   ├── SETUP.md                # Setup instructions for developers
│   ├── DATA_COLLECTION_STRATEGIES.md
│   ├── DATA_COLLECTION_STRATEGY.md
│   ├── PARTICIPANT_LINKS_GUIDE.md
│   ├── PARTICIPANT_TRACKING.md
│   ├── SESSION_TRACKING_GUIDE.md
│   ├── SESSION_TRACKING_IMPLEMENTATION.md
│   ├── QUICK_START_SESSIONS.md
│   ├── REGENERATE_LINKS.md
│   └── mcmc_progress_monitoring.md  # Progress indicators for MCMC analyses
├── ops/                         # Operations and troubleshooting
│   ├── VERCEL_BUILD_FIX.md     # Troubleshooting Vercel build issues
│   ├── VERCEL_DEPLOYMENT_CHECK.md
│   ├── DEBUG_BLACK_SCREEN.md   # Debugging guide for black screen issue
│   ├── EMAILJS_SETUP.md        # EmailJS configuration
│   ├── EMAILJS_TEMPLATE_SETUP.md
│   ├── GITHUB_SETTINGS.md
│   └── GMAIL_SETUP_FIX.md
├── dev/                         # Development and internal notes
│   ├── COMMIT_SUMMARY.md
│   ├── COMPREHENSION_CHECK_STATUS.md
│   └── PRE_AUDIT_CHECKLIST.md
├── case_study/                  # Case study documentation
│   ├── CASE_STUDY.md
│   ├── CASE_STUDY_EXECUTIVE_SUMMARY.md
│   ├── CASE_STUDY_REVIEW_PROMPT.md
│   ├── CASE_STUDY_TALKING_POINTS.md
│   ├── CHANGELOG_CASE_STUDY.md
│   └── case_study_web.qmd
├── analysis/                    # Analysis and report documentation
│   ├── AUDIT_REPORT.md
│   ├── REPORT_GAPS_ANALYSIS.md
│   ├── REPORT_IMPROVEMENTS_SUMMARY.md
│   ├── REPORT_INPUT_DEVICE_EXCLUSION.md
│   ├── REPORT_REORGANIZATION_PLAN.md
│   ├── REPORT_SECTION_AUDIT.md
│   └── power/                   # Power analysis documentation
│       ├── DYNAMIC_SAMPLE_SIZE_SUMMARY.md
│       ├── POWER_ANALYSIS_EXPERT_RESPONSE.md
│       ├── POWER_ANALYSIS_PROMPT.md
│       ├── POWER_ANALYSIS_QUICK_REFERENCE.md
│       └── SAMPLE_SIZE_POWER_STATUS.md
├── manuscript/                  # Manuscript and publication files
│   ├── MANUSCRIPT_CHANGES.md
│   ├── MANUSCRIPT_README.md
│   ├── Manuscript.qmd
│   ├── Manuscript.tex
│   ├── preamble.tex
│   ├── references.bib
│   └── apa-7th-edition.csl
├── checklists/                  # Project checklists
│   ├── COMPILE_CHECKLIST.md
│   ├── MINIMAL_PILOT_CHECKLIST.md
│   └── PRE_COLLECTION_CHECKLIST.md
├── data/                        # Data verification and status
│   ├── CSV_DATA_SUFFICIENCY_PROMPT.md
│   ├── CSV_SINGLE_FILE_VERIFICATION.md
│   ├── CSV_VERIFICATION_REPORT.md
│   └── DATA_AVAILABILITY_STATUS.md
├── visualization/               # Visualization documentation
│   ├── DRAG_DISTANCE_VISUALIZATION_PROMPT.md
│   ├── INTERACTIVE_PLOTS_SUMMARY.md
│   └── VISUALIZATION_BRAINSTORM.md
├── [Study documentation files]  # Preregistration, hypotheses, methods, etc.
│   ├── preregistration.md
│   ├── hypotheses.md
│   ├── methods_detail.md
│   ├── EXCLUSION_CRITERIA.md
│   ├── INPUT_DEVICE_EXCLUSION_STRATEGY.md
│   ├── DECLUTTER_ANALYSIS.md
│   ├── TESTING_WITH_P040.md
│   ├── CRITICAL_FIXES_APPLIED.md
│   ├── NEXT_STEPS.md
│   └── REPO_CLEANUP_PLAN.md
```

## Quick Links

### For New Users
- **Setup**: [guides/SETUP.md](guides/SETUP.md) - Get started with local development
- **Deployment**: [guides/DEPLOYMENT_GUIDE.md](guides/DEPLOYMENT_GUIDE.md) - Deploy to production

### For Researchers
- **Study Design**: [preregistration.md](preregistration.md) - Complete study design
- **Hypotheses**: [hypotheses.md](hypotheses.md) - H1-H5 hypotheses
- **Methods**: [methods_detail.md](methods_detail.md) - Detailed protocol
- **Data Collection**: [guides/DATA_COLLECTION_STRATEGIES.md](guides/DATA_COLLECTION_STRATEGIES.md)

### For Troubleshooting
- **Vercel Issues**: [ops/VERCEL_BUILD_FIX.md](ops/VERCEL_BUILD_FIX.md)
- **Deployment Check**: [ops/VERCEL_DEPLOYMENT_CHECK.md](ops/VERCEL_DEPLOYMENT_CHECK.md)
- **Black Screen**: [ops/DEBUG_BLACK_SCREEN.md](ops/DEBUG_BLACK_SCREEN.md)
- **EmailJS Setup**: [ops/EMAILJS_SETUP.md](ops/EMAILJS_SETUP.md)

### For Developers
- **Architecture**: See [app/ARCHITECTURE.md](../app/ARCHITECTURE.md) in the app directory
- **Internal Notes**: See [dev/](dev/) directory for development-specific documentation
- **MCMC Analysis**: [guides/mcmc_progress_monitoring.md](guides/mcmc_progress_monitoring.md) - Progress monitoring for long-running Bayesian analyses

## Categories

### guides/
User-facing documentation and how-to guides for common tasks:
- Setting up the development environment
- Deploying to production
- Managing participants and sessions
- Data collection workflows
- **MCMC Progress Monitoring**: [guides/mcmc_progress_monitoring.md](guides/mcmc_progress_monitoring.md) - Best practices for adding progress bars, ETA, and diagnostics to Bayesian MCMC analyses

### ops/
Operational documentation for troubleshooting and maintenance:
- Deployment issues and fixes
- Service configuration (EmailJS, GitHub, etc.)
- Debugging guides
- Platform-specific setup

### dev/
Internal development notes and checklists:
- Commit summaries
- Status tracking
- Pre-audit checklists

### Study Documentation
Core research documentation:
- Preregistration documents
- Hypotheses and research questions
- Detailed methods
- Privacy notices
- Consent forms

## Moving Files

If you need to add new documentation:
1. **User guides** → `docs/guides/`
2. **Troubleshooting/ops** → `docs/ops/`
3. **Development notes** → `docs/dev/`
4. **Case study docs** → `docs/case_study/`
5. **Analysis/report docs** → `docs/analysis/`
6. **Power analysis** → `docs/analysis/power/`
7. **Manuscript files** → `docs/manuscript/`
8. **Checklists** → `docs/checklists/`
9. **Data verification** → `docs/data/`
10. **Visualization docs** → `docs/visualization/`
11. **Study/research docs** → `docs/` (root of docs directory)

## See Also

- Main README: [../README.md](../README.md)
- App Documentation: [../app/](../app/) directory (ARCHITECTURE.md, etc.)
- Data Dictionary: [../data/dict/](../data/dict/)


