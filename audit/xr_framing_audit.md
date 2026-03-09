# XR Framing Audit

**Date:** 2025-03-07  
**Purpose:** Determine whether the manuscript overclaims direct XR hardware testing.

---

## 1. Files Inspected

| File | Purpose |
|------|---------|
| `docs/manuscript/Manuscript.qmd` | Apparatus, intro, discussion |
| `README.md` | Platform description |
| `app/` | Participant hardware, input devices |

---

## 2. Evidence

### 2.1 Apparatus (Manuscript)

**Source:** Manuscript.qmd lines 149–150

> "We developed a custom pointing testbed as a web-based application (React 18, TypeScript), allowing broad hardware compatibility for remote participants. The study was conducted on participants' own computers using a standard mouse or trackpad."

### 2.2 What Was Actually Tested

- **Web application** on participants' own computers
- **Mouse or trackpad** for input
- **Gaze simulation** — mouse/trackpad input transformed into gaze-like coordinates (jitter, lag, saccadic suppression)
- **No headset** — no VR/AR hardware
- **No optical hand tracking** — mouse/trackpad for hand modality
- **No hardware eye-tracking** — simulated gaze only

### 2.3 Intro/Discussion Claims

- "XR requires the user to engage their entire body; the primary pointing devices are the user's own hands and eyes"
- "Gorilla Arm" syndrome, "gestural interfaces"
- "Manual input in XR, whether through held controllers or optical hand tracking"
- "In a 1:1 mapped XR environment, reaching a virtual object requires a corresponding physical motion"

These describe **general XR** and **prior work**, not the present study's apparatus.

---

## 3. What Was Actually Tested

- A **desktop web-based proxy** for XR-relevant selection dynamics
- Hand modality: standard mouse/trackpad pointing
- Gaze modality: simulated gaze (mouse/trackpad → gaze-like signal with psychophysical constraints)
- ISO 9241-9 pointing task, modality-specific failure modes

---

## 4. What Should Be Toned Down

| Avoid | Use Instead |
|-------|-------------|
| Direct validation of embodied XR hand/gaze interaction | Controlled web-based proxy for XR-relevant control problems |
| Implication that participants used headsets or controllers | Explicit: "Participants used standard computers with mouse or trackpad" |
| "XR study" without qualification | "Web-based study of XR-relevant selection dynamics" |

---

## 5. What XR Relevance Remains Legitimate

- The **platform** is designed for future XR studies
- The **control problems** (Midas Touch, gaze jitter, hand precision) are XR-relevant
- The **conceptual framework** (modality-specific failure modes) applies to XR
- The **gaze simulation** models oculomotor constraints relevant to XR gaze interaction
- **Limitations** should explicitly state: desktop proxy; generalization to headset-based XR requires validation

---

## 6. Manuscript Sections Affected

| Section | Recommendation |
|---------|----------------|
| Apparatus | Add explicit: "participants used standard computers with mouse or trackpad; no headset or VR hardware" |
| Intro (general XR) | Keep as context; ensure it's clear it's general XR, not this study |
| Limitations | Add: "The study used a desktop web proxy; generalization to headset-based XR requires validation" |
| Conclusion | Clarify platform scope: "designed for XR-relevant selection dynamics" |
