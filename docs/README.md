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
│   └── REGENERATE_LINKS.md
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
├── [Study documentation files]  # Preregistration, hypotheses, methods, etc.
│   ├── preregistration.md
│   ├── hypotheses.md
│   ├── methods_detail.md
│   └── ...
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

## Categories

### guides/
User-facing documentation and how-to guides for common tasks:
- Setting up the development environment
- Deploying to production
- Managing participants and sessions
- Data collection workflows

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
4. **Study/research docs** → `docs/` (root of docs directory)

## See Also

- Main README: [../README.md](../README.md)
- App Documentation: [../app/](../app/) directory (ARCHITECTURE.md, etc.)
- Data Dictionary: [../data/dict/](../data/dict/)


