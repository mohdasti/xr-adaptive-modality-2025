# UX Research Case Study: Detailed Outline
## XR Adaptive Modality — User-Centered Research Approach

**Purpose:** A UX-Research focused portfolio case study (less technical than the current case_study_web.html)  
**Target audience:** Recruiters, UX Research managers, AR/XR product teams, design leadership  
**Tone:** User-centered, narrative-driven, outcome-focused — showcase *how you think* and *what you learned* about users

---

## Suggested Section Order (with rationale)

The order below follows your proposed flow while incorporating UX case study best practices (hook early, show impact, guide the reader). Alternative placements are noted where the narrative could flex.

| Section | Your Suggested | Recommended | Rationale |
|---------|----------------|-------------|-----------|
| 1 | Problem | **Problem** | Readers need to care before they invest. Start with user pain. |
| 2 | Solution | **Solution** (high-level) | What you built / proposed, before diving into "how" |
| 3 | Background | **Context & Background** | Necessary context so methods make sense |
| 4 | Key Learnings | **Key Learnings** | Core value — insights and recommendations |
| 5 | Future Directions | **Future Directions** | Where the work leads |
| 6 | Reflections | **Reflections** | Personal growth, lessons, professional takeaways |

---

## Section 1: The Problem

**Goal:** Make the reader feel the user pain. No jargon—explain why this matters for real people in XR.

### 1.1 Opening Hook (2–3 sentences)

- **Option A:** Lead with a vivid scenario: *"Imagine wearing an AR headset for 30 minutes. Your arm aches from pointing. You switch to gaze — and accidentally tap three things you didn't mean to. You're stuck between fatigue and frustration."*
- **Option B:** Lead with a stark contrast: *"XR users today face a binary choice: precise but fatiguing hand input, or fast but error-prone gaze. There's no middle ground."*

### 1.2 The Two Core UX Failures

**1.2.1 Gorilla Arm**
- Mid-air hand gestures cause rapid arm fatigue
- Shaking, reduced precision, pain within minutes
- Users abandon XR due to physical strain
- *Source:* docs, CASE_STUDY.md §1

**1.2.2 Midas Touch**
- Gaze-based controls suffer from accidental activations
- "Looking to see" vs. "looking to select" — intent ambiguity
- Natural eye jitter makes small targets hard to hit
- Users experience unintended triggers when exploring

### 1.3 The Gap

- Current XR interfaces are **static** — one-size-fits-all
- No adaptation to user state, fatigue, or task difficulty
- Users must commit to one modality and accept its downsides
- *Research question:* How can we give users the benefits of both modalities without the downsides?

### 1.4 Why This Matters for UX Research

- XR is growing; these failure modes affect real products (Meta Quest, Apple Vision Pro, etc.)
- Design teams need evidence-based guidance, not assumptions
- Adaptive systems are promising but under-evaluated from a *user experience* lens

---

## Section 2: The Solution

**Goal:** Summarize what you built and the core approach. Keep it high-level; details come in Background.

### 2.1 The Core Idea

- **Adaptive assistance within each modality** — not modality switching (that's future work)
- The interface adapts to the user in real-time based on performance and context
- User-centered principle: *adapt the interface to the user, not the user to the interface*

### 2.2 Two Modality-Specific Interventions

**2.2.1 Declutter (Gaze Mode)**
- When users struggle in gaze blocks, hide non-critical UI elements
- Aligns with foveal focus — reduce peripheral distraction
- Helps users maintain focus on target

**2.2.2 Width Inflation (Hand Mode)**
- When users show performance issues in hand blocks, expand target size by 25%
- Compensates for motor tremor and fatigue
- Acts as a "safety net" when users need it most
- *Important note:* In this dataset, width inflation did not activate (instrumentation caught this); conclusions focus on gaze declutter

### 2.3 Design Principle: Stability

- Hysteresis mechanism: adaptation triggers only after several poor trials in a row
- Prevents rapid flickering between states
- Ensures the system feels predictable and stable

### 2.4 What You Shipped (Optional — can move to Background)

- Web-based research platform (React + TypeScript, Vercel)
- Remote data collection, no hardware required
- Comprehensive telemetry, workload measurement (NASA-TLX), qualitative debrief

---

## Section 3: Context & Background

**Goal:** Provide enough context so a non-technical reader understands your methods and scope. Light on formulas; heavy on *why* and *how* from a UX perspective.

### 3.1 Research Design

**3.1.1 Study Type**
- 2×2×2 within-subjects factorial design
- Modality (Hand vs. Gaze) × UI Mode (Static vs. Adaptive) × Pressure (Low vs. High cognitive load)

**3.1.2 Participants**
- N = 80 (or current N) collected remotely
- Demographics collected: age, gender, gaming hours, input device, vision correction, handedness, fatigue level, motor impairment
- *UX angle:* Remote collection enabled diverse participation; device standardization (mouse vs. trackpad) required exclusion for hand modality

**3.1.3 Task**
- Fitts' Law pointing task (ISO 9241-9 compliant)
- Standard HCI benchmark: isolates "move → acquire → confirm"
- Why Fitts? Speed–accuracy tradeoff, systematic difficulty control

### 3.2 Participant Journey (Visual + Text)

**Flow:** Consent → Demographics → System Check → Calibration → Practice → Main Task (~192 trials) → NASA-TLX (after each block) → Debrief

**Key UX elements:**
- Display calibration (credit card method for px/mm, PPD)
- Comprehension checks
- Block-level workload assessment
- Debrief questions: *"Did you notice the interface changing?"* and *"Did you change your strategy?"*

*Artifact:* Participant journey diagram (participant_journey_final.png, Task_layout.png)

### 3.3 Gaze Simulation (Keep Light)

- **Why:** No hardware eye tracker — enables remote, scalable research
- **What:** Psychophysics-informed mouse proxy: Gaussian jitter, saccadic suppression, lag
- **Limitation:** Not a substitute for real eye tracking; validation plan for future work
- *UX angle:* Controlled, reproducible way to study gaze failure modes before expensive lab setups

### 3.4 Metrics (User-Focused Framing)

| Metric | What It Tells Us (UX Lens) |
|-------|----------------------------|
| **Throughput (TP)** | Speed–accuracy efficiency — higher = better |
| **Error Rate** | Failed selections — lower = more reliable |
| **Movement Time (MT)** | Time to complete selection — lower = faster |
| **NASA-TLX** | Perceived workload (6 dimensions) — lower = easier |
| **Error Types** | Slip vs. Miss vs. Timeout — reveals *how* users fail |

---

## Section 4: Key Learnings (Insights & Recommendations)

**Goal:** This is the heart of the case study. Lead with the strongest, most product-relevant insights. Show *how you think* and *what you'd recommend*.

### 4.1 Insight 1: The Midas Touch Problem is Real and Measurable

**Finding:** Gaze errors are **99.2% slips** (accidental activations), 0.8% timeouts. Hand errors are 95.7% misses, 4.3% timeouts.

**UX implication:** The dominant gaze failure mode is intent ambiguity — "looking to see" vs. "looking to select." This validates a core UX challenge that XR teams must design around.

**Recommendation:** Prioritize **intent disambiguation** for gaze: confirmation mechanisms, stabilization, snapping, dwell tuning, clear state feedback. Reducing the verification burden is higher leverage than reducing UI chrome.

### 4.2 Insight 2: Hand Remains the Reliability Baseline

**Finding:** Hand: lower error (1.7% vs 18.6%), higher throughput (5.15 vs 4.70 bits/s), lower NASA-TLX (40.4 vs 47.0).

**UX implication:** Reinforces why XR products rely on hand/controller for precision. Hand is the performance baseline; gaze must close the gap through better design.

### 4.3 Insight 3: Adaptive Interventions Need Refinement

**Finding:** Declutter showed modest error reduction (18.2% vs 19.1%) but no significant throughput or workload benefit. Width inflation did not activate.

**UX implication:** The *concept* is sound, but triggers and mechanisms need tuning. Not all "adaptive" changes are meaningful — targeting the dominant failure mode (slips) is more impactful than general UI simplification.

**Recommendation:** Policy thresholds must be calibrated through iterative testing, not assumed. A/B test multiple policy variants.

### 4.4 Insight 4: Workload Reflects Error Patterns

**Finding:** NASA-TLX higher in gaze than hand. Adaptive vs. Static TLX similar in this build.

**UX implication:** Gaze places a higher "intent verification" burden — users must constantly monitor whether their gaze will trigger an unintended action. Declutter alone doesn't reduce that burden.

### 4.5 Insight 5: User Strategies and Adaptation Awareness

**Finding:** Qualitative debrief revealed:
- Users developed different strategies for different modalities
- Some noticed adaptations (declutter); others benefited without explicit awareness
- For gaze: maintain steady gaze, wait for confirmation
- For hand: balance speed and precision

**UX implication:** Adaptive systems should reduce *the need for vigilance* rather than adding new rules. Design for subconscious benefit where possible.

### 4.6 Design Recommendations (Summary Box)

| For... | Recommendation |
|--------|----------------|
| **Gaze interaction** | Slip prevention > declutter. Intent disambiguation, confirmation, stabilization. |
| **Hand interaction** | Width inflation unconfirmed (didn't activate). Instrumentation caught non-activation — important for future iterations. |
| **Adaptation policy** | Calibrate thresholds; validate with real users; target dominant failure mode. |
| **Implementation** | Hysteresis for stability; log adaptation state for validation. |

---

## Section 5: Future Directions & Industry Applications

**Goal:** Show the work has legs. Connect to real products and next steps.

### 5.1 Future Research Directions

1. **Real modality switching** — Evaluate automatic hand ↔ gaze switching (not just assistance within modalities)
2. **Policy threshold calibration** — A/B test policy variants to find optimal triggers
3. **Longer tasks** — Extended sessions to induce fatigue and validate adaptations under real-world conditions
4. **Real eye-tracker validation** — Calibration study to tune simulation and confirm UX signatures

### 5.2 Industry Applications

**5.2.1 AR/VR Headsets**
- Use eye-tracking to declutter view when cognitive overload is sensed
- Improve comfort during long sessions
- Intent-first gaze design for menus and selection

**5.2.2 XR Product Teams**
- Design guidelines: modality-specific adaptations, stable mechanisms, intent-first gaze
- Evidence base for when to invest in gaze vs. hand optimization
- Quality control: instrument and validate adaptive mechanisms before claiming benefit

**5.2.3 Accessibility**
- Gaze interaction can benefit users with limited hand mobility — but must solve Midas Touch
- Motor impairment data collected (separate analysis possible)

---

## Section 6: Reflections

**Goal:** Go beyond surface-level reflection. Show professional growth, humility, and critical thinking. This is what hiring managers look for.

### 6.1 What I Learned (Professional)

- **Not all adaptive changes are meaningful** — Declutter helped modestly, but targeting slips would be more impactful. Learned to prioritize the dominant failure mode.
- **Instrumentation is essential** — Width inflation didn't activate; validated logging caught it. Would have drawn wrong conclusions without it.
- **Device standardization matters** — Trackpad vs. mouse required exclusion from hand modality. Affects recruitment and analysis planning.
- **Policy integration is critical** — PolicyEngine logic worked, but UI integration failed to apply width scaling. Cross-team coordination and validation matter.

### 6.2 What I Would Do Differently

- Remove pressure-only gating; use longer tasks to induce fatigue so width inflation can activate
- Add more qualitative probes (e.g., think-aloud during gaze blocks)
- Consider giving users control over adaptation preferences
- Test in a real XR application context, not just a pointing task

### 6.3 Limitations (Honest Accounting)

- Gaze simulation, not hardware — ecological validity limits
- Hand width inflation not exercised — benefit unconfirmed
- Unbalanced design (hand N=75 mouse-only, gaze N=81) — Type III ANOVA handles this

### 6.4 Role & Skills Demonstrated

**Role:** End-to-end ownership — research question, hypothesis, platform, experiment design, data collection, analysis, design guidelines.

**Skills:**
- UX Research: User-centered design, mixed methods, workload assessment, qualitative debrief
- AR/XR: Spatial interaction, adaptive systems, modality design
- Technical: Full-stack (React, TypeScript), deployment, data analysis
- Communication: Translating research into actionable design guidelines

---

## Appendix: Optional Deeper Dives (Collapsible or Separate Page)

- **Statistical models** — LMEM, GLMM, TOST (for readers who want rigor)
- **LBA cognitive modeling** — Drift rate, threshold, non-decision time (optional)
- **Error type breakdown table** — Full numbers
- **Spatial error patterns** — Heatmaps, endpoint density
- **Quality control exclusions** — What was removed and why
- **File structure** — Links to repo, telemetry schema, policy config

---

## Content Mapping: Where to Pull From

| Outline Section | Primary Sources |
|----------------|-----------------|
| Problem | CASE_STUDY.md §1, CASE_STUDY_TALKING_POINTS.md |
| Solution | CASE_STUDY.md §2, policy/README.md |
| Context | analysis_plan.md, preregistration.md, DemographicsForm.tsx, Debrief.tsx |
| Key Learnings | CASE_STUDY.md §5–6, case_study_web.html (Key Results, Failure Modes, Implications) |
| Future Directions | CASE_STUDY.md §8, NEXT_STEPS.md |
| Reflections | CASE_STUDY.md §8, CASE_STUDY_TALKING_POINTS.md (Interview Q&A) |

---

## Writing Tips

1. **Lead with impact** — Each section should answer "So what?" for a UX recruiter.
2. **Show your thinking** — Not just "we found X" but "we found X, which suggests Y, so we recommend Z."
3. **Use visuals** — Participant journey, task layout, error type breakdown, metrics dashboard.
4. **Keep metrics accessible** — Explain throughput, NASA-TLX, error types in plain language with a "metric cheat sheet" if needed.
5. **Be honest about limitations** — Demonstrates maturity and scientific rigor.
6. **Vary length** — Problem and Key Learnings can be longest; Background can be more scannable (bullets, tables).

---

## Checklist Before Publishing

- [ ] TL;DR or executive summary at top (1–2 sentences)
- [ ] Clear "Problem → Solution → Learnings" arc
- [ ] At least one compelling visual (participant journey, results dashboard)
- [ ] Honest treatment of what didn't work (width inflation, modest declutter effect)
- [ ] Contact / links to repo, full report
- [ ] Proofread for UX audience (minimize jargon; explain when necessary)

---

*This outline is a living document. Adjust section order and depth based on feedback and portfolio space constraints.*
