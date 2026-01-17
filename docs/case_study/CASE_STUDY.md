# Case Study: Adaptive Modality Systems in Extended Reality
## A UX Research Approach to Context-Aware Assistance in Gaze-Hand Interaction

**Author:** Mohammad Dastgheib  
**Project Type:** UX Research | Human-Computer Interaction | AR/XR  
**Timeline:** 2024-2025  
**Status:** Pre-registered, Data Collection Phase (current report: **N = 80**)

---

## Executive Summary

XR interfaces today force users to choose between mid-air hand gestures (causing arm fatigue) and eye-gaze controls (causing accidental selections). To tackle this, I developed an **Adaptive Assistance System** that provides real-time UI interventions within each input modality—decluttering for gaze blocks and target expansion for hand blocks—aiming to improve speed and reduce user effort.

**What I Built:** I designed and shipped an end-to-end XR interaction research platform—a web-based application with comprehensive telemetry, workload measurement, and automated reporting. The platform enabled remote data collection from 80 participants using a physiologically-informed gaze simulation (mouse-driven proxy with Gaussian jitter and saccadic suppression). **[Artifacts: [GitHub Repo](https://github.com/mohdasti/xr-adaptive-modality-2025) | Telemetry Schema: `app/src/lib/telemetry/` | Policy Config: `app/src/lib/policy.ts`]**

**Key Finding:** The research validated a critical UX failure mode—gaze interaction errors are predominantly "slips" (Midas Touch problem), not simple misses. This pattern shows up consistently: when users look around, their gaze accidentally triggers selections, creating frustration. The data also shows that hand interaction remains the reliability baseline, while the adaptive system's "declutter" intervention shows promising direction but needs refinement before deployment.

**Limitations:** This study used a mouse-based gaze simulator (not hardware eye-tracker), which may limit ecological validity. Hand width inflation did not activate in this dataset (width_scale_factor always 1.0); the feature was instrumented and validated through logging, but not exercised. Conclusions therefore focus on gaze declutter, which was evaluated.

**Impact:** This project demonstrates a feasible approach to implementing adaptive interactions in XR and provides new insights into when such adaptations help users. The complete platform and findings can inform next-gen AR/VR interfaces—for instance, an AR headset could use eye-tracking to declutter a user's view when it senses cognitive overload, improving comfort during long uses.

---

## Results at a Glance

**Modality Comparison (Hand vs Gaze):**
- **Error Rate:** 1.7% (hand) vs 18.8% (gaze), Δ = 17.1%
- **Movement Time (RT):** 1043 ms (hand) vs 1113 ms (gaze), Δ = 70 ms
- **Throughput:** 3.51 bits/s (hand, 95% CI: 3.36–3.66) vs 3.18 bits/s (gaze, 95% CI: 3.03–3.33), Δ = 0.32 bits/s

**Adaptive vs Static:**
- **Error Rate:** Very similar (no significant reduction)
- **Movement Time (RT):** Very similar (no significant reduction)
- **Throughput:** 3.32 bits/s (adaptive) vs 3.37 bits/s (static), Δ = -0.05 bits/s (no significant difference)

**Workload (NASA-TLX, 0–100 scale):**
- **Hand vs Gaze:** 41.1 (hand, avg) vs 46.5 (gaze, avg), Δ = 5.4
- **Adaptive vs Static:** Very similar (no significant reduction in current dataset)

---

## 1. The Problem: Why This Research Matters

### The Challenge in XR Interaction Design

Unlike using a mouse on a desk, interacting in XR means using your arms and eyes in 3D space. This is physically tiring and error-prone over time. Extended Reality (XR) systems—Virtual Reality, Augmented Reality, and Mixed Reality—require whole-body interaction, creating two critical user experience problems:

**The "Gorilla Arm" Problem:**
Mid-air hand gestures lead to rapid fatigue. As the user's arm gets tired, their hand starts to shake, making it harder to hit targets quickly. Users experience pain and reduced precision within minutes, leading many to abandon XR applications due to physical strain.

**The "Midas Touch" Problem:**
Gaze-based controls suffer from accidental activations. Even when trying to stare at a target, our eyes jitter slightly, so a gaze cursor wobbles—making tiny targets hard to select. The ambiguity between "looking to see" vs. "looking to select" creates unintended triggers when users are simply exploring the interface.

**The Gap:**
Today's XR interfaces don't adjust to user fatigue or context—it's a one-size-fits-all approach. Most systems force a binary choice: users must commit to either controller-based interaction (accepting fatigue) or gaze-based interaction (accepting imprecision). This rigid approach ignores that user needs change based on task difficulty, fatigue level, and attention state.

**So how can we give users the benefits of both modalities without the downsides?** Our approach: make the interface adapt to the user in real-time.

### The Research Question

**How can we design an adaptive assistance system that provides context-aware UI interventions based on real-time user performance and cognitive state, ultimately improving user experience and reducing workload in XR interfaces?**

This question addresses a fundamental gap in XR interaction design: the lack of context-aware systems that adapt to user state and task demands, putting the user's needs first. Note: This study evaluated adaptive assistance *within* each modality (declutter for gaze; width inflation was instrumented for hand but not exercised in this dataset), not automatic modality switching—switching evaluation is future work.

---

## 2. Solution Approach: Designing Adaptive Interventions

I grounded this research in established HCI theory, but approached it from a user experience perspective. The core insight: rather than forcing users to adapt to difficult interfaces, we can adapt the interface to the user's current state.

### Study Design

**User-Centered Approach:**
Rather than testing whether a system works, I designed the research to understand *how* users experience different interaction modalities and *when* they need support. The research focuses on user experience outcomes: performance, workload, and satisfaction.

**Experimental Design:** 2×2×2 within-subjects factorial study
- **Modality:** Hand vs. Gaze-confirm (comparing user experience across input methods)
- **UI Mode:** Static vs. Adaptive (testing whether adaptation improves experience)
- **Pressure:** High vs. Low cognitive load (time pressure with countdown vs. relaxed conditions)

**Sample Size:** **N = 80** participants (collected remotely via web-based platform)

**What We Measured:**
- **Performance:** Error rates, completion times, movement efficiency
- **Workload:** NASA-TLX (6 dimensions: Mental, Physical, Temporal, Performance, Effort, Frustration)
- **Adaptation Awareness:** Qualitative feedback on whether users noticed adaptations and how they felt about them

**Research Goals:**
- Reduce error patterns that create frustration (especially in gaze)
- Avoid "fixing errors by slowing people down"
- Reduce perceived workload where possible, especially physical demand and frustration

### Adaptive Interventions: Design Thinking

I designed two modality-specific adaptive mechanisms based on understanding user needs:

**1. Declutter (Gaze Mode):**
When the system detects performance degradation in gaze blocks, it hides non-critical UI elements. This aligns with how human vision works—we focus on what we're looking at. By reducing peripheral clutter, we help users maintain focus on their target.

**2. Width Inflation (Hand Mode):**
When the system detects performance issues in hand blocks, it dynamically expands target size by 25%. This compensates for motor tremor and fatigue, acting as a "safety net" when users need it most.

**Design Principle: Stability**
Both interventions use a "hysteresis" mechanism—we added a slight delay before activating adaptations to avoid flicker (only triggering after several poor trials in a row). This ensures the system feels stable and predictable to users, rather than rapidly switching between states.

---

## 3. How We Built and Tested It

### Platform Architecture

I developed a complete web-based research platform that enables rigorous user research while maintaining accessibility. This allows participants to complete the study from their own devices, dramatically increasing recruitment and sample size.

**Tech Stack:**
- **Frontend:** React 18 + TypeScript
- **Deployment:** Vercel (enables remote data collection)
- **Analysis:** R and Python for comprehensive data analysis

### Key Implementation Decisions

**1. Gaze Simulation (Not Hardware Eye Tracker):**
Eye-tracking hardware is expensive and limits participant accessibility. Instead, I built a mouse-driven gaze simulation that models key physiological constraints:
- **Saccadic suppression:** Cursor frozen during high-velocity movements (simulating the brain's suppression during rapid eye movements)
- **Fixation jitter:** Gaussian noise when cursor is slow (simulating natural eye tremor)
- **Sensor lag:** 30–70ms processing delay (simulating real eye-tracker latency)

**Why this approach:**
- Enables remote data collection at scale without specialized hardware
- Reproducible, controlled noise characteristics across participants
- Low-cost way to study interaction design failure modes (e.g., Midas Touch) before committing to expensive lab setups

**Limitations:**
- Not externally valid to real eye-tracker hardware (calibration drift, headset fit, etc. not represented)
- Some real-world eye-tracker issues not modeled

**Validation Plan:**
- Calibration study with a real eye tracker to tune simulation parameters
- Outcome-level validation to check if the same UX signatures appear (e.g., slip-dominated gaze errors, workload patterns)
- Sensitivity analysis under multiple jitter/lag settings to test robustness

**2. User Experience Metrics:**
- Performance metrics: Error rates, completion times, movement efficiency
- Workload assessment: NASA-TLX (Mental, Physical, Temporal, Performance, Effort, Frustration)
- Adaptation awareness: Qualitative feedback on whether users noticed adaptations

**3. Policy-Based Adaptation Engine:**
The system monitors user performance and adapts when users struggle. Adaptation activates based on clear criteria (error bursts or slow response times) with a stability mechanism to prevent flickering.

**4. Data Collection & Quality Control:**
- Display calibration for consistent experience across devices
- Automatic detection of invalid trials (display issues, interruptions)
- Comprehensive participant flow with comprehension checks and debrief opportunities

---

## 4. User Study: Testing the Adaptive System

We put this system to the test with real users. Participants completed a standard target-selection task across all conditions, allowing us to measure both performance and subjective workload.

**Study Flow:**
1. Introduction and comprehension check
2. Demographics and system check
3. Display calibration (using a credit card for accurate gaze simulation)
4. Practice block to familiarize with both modalities
5. Main experiment: ~192 trials per participant across all conditions (counterbalanced to control for learning effects)
6. Workload assessment (NASA-TLX) after each block
7. Debrief: Qualitative feedback on experience and adaptation awareness

**Data Collection:**
- Performance metrics: Error rates, completion times, movement efficiency
- Workload assessment: NASA-TLX after each experimental block
- Qualitative feedback: User strategies, adaptation awareness, and experience perceptions

**User Privacy & Ethics:**
- No personally identifiable information collected
- Minimal data collection (only what's necessary)
- Participants could withdraw at any time
- Data anonymization and secure storage

---

## 5. Findings: What the Data Revealed

### Key Insights from 80 Participants

**1. The "Midas Touch" Problem is Real and Measurable**
Gaze interaction shows significantly higher error rates than hand interaction. Critically, gaze errors are **predominantly "slips"** (accidental activations) rather than simple misses. This validates a core UX failure mode: when users look around, their gaze accidentally triggers selections, creating frustration. This is exactly the kind of interaction pain point XR teams need to design around—the gap between intent and attention.

**2. Hand Remains the Reliability Baseline**
Hand interaction shows low error rates and higher efficiency (faster movement times, higher throughput). This reinforces why XR products often rely on hand/controller input for precision work, validating current industry practice.

**3. Adaptive Interventions Show Promise But Need Refinement**
The "declutter" intervention is present and evaluable, but **adaptive vs. static differences are small** in the current dataset. In practical terms: the system as implemented isn't yet reducing frustration/workload in a way that would justify shipping as-is. This is an important finding—it suggests that while the concept is sound, the adaptation triggers and mechanisms need tuning.

**4. Workload Reflects Error Patterns**
Workload (NASA-TLX) is **higher in gaze than hand**, matching the observed error pattern. Gaze interaction places a higher "intent verification" burden on users—they must constantly monitor whether their gaze will trigger an unintended action. However, **adaptive vs. static TLX is very similar** in this build, clarifying that "declutter alone" is likely insufficient. The biggest opportunity is reducing slips/verification burden, not just reducing UI chrome.

**5. User Strategies and Adaptation Awareness**
Qualitative feedback revealed that users developed different strategies for different modalities. For gaze, users learned to maintain steady gaze and wait for confirmation. For hand, users learned to balance speed and precision. Some users noticed adaptations (particularly visual changes like declutter), while others experienced benefits without explicit awareness—suggesting adaptations can work both consciously and subconsciously.

**Design Implication:** Adaptive systems should reduce *the need for vigilance* (e.g., "don't accidentally trigger") rather than adding new rules users must learn. For gaze, that means designing around intent—confirmation mechanisms, stabilization, snapping, dwell tuning, and clear state feedback.

---

## 6. Product Decisions Enabled by This Research

### For Gaze Interaction: Slip-Prevention Beats Declutter
The dominant gaze failure mode is slips (Midas Touch), not simple misses. Decluttering UI helps, but the bigger opportunity is **intent disambiguation**—confirmation mechanisms, stabilization, snapping, dwell tuning, and clear state feedback. Prioritize reducing the verification burden rather than just reducing visual chrome.

### For Hand Interaction: Instrumentation Caught Non-Activation
Hand width inflation did not activate in this dataset (width_scale_factor always 1.0); instrumentation and validated logging caught this early. The feature was instrumented but not exercised, so its benefit is unconfirmed.

### For Adaptation Policy: Thresholds Must Be Validated
The concept is sound, but adaptation effects were small because triggers and mechanisms need tuning. **Key insight:** Not all "adaptive" changes are meaningful—decluttering UI can be helpful, but targeting the dominant failure mode (slips) is more impactful. Policy thresholds must be calibrated through iterative testing, not assumed.

### Implementation Implications
- **Stability is critical:** Hysteresis mechanisms prevent rapid oscillation, ensuring adaptations feel predictable
- **Instrumentation is essential:** Log adaptation state (`width_scale_factor`, `declutter_active`) to validate activation
- **Performance-based triggers work:** Adapt based on user performance (error bursts, RT thresholds), not arbitrary rules

---

## 7. What I Built: Artifacts & Deliverables

**Research Platform:**
- **Web Application:** [GitHub Repository](https://github.com/mohdasti/xr-adaptive-modality-2025) (React 18 + TypeScript, deployed on Vercel)
- **Telemetry Schema:** `app/src/lib/telemetry/` — Event types: trial start/end, policy changes, display violations, movement samples
- **Adaptation Policy Config:** `app/src/lib/policy.ts` — Thresholds, triggers, hysteresis logic
- **Automated Report:** `Report.qmd` → `Report.html` (Quarto-based, reproducible analysis pipeline)

**Key Features:**
- Remote data collection (N=80 participants)
- ISO 9241-9 compliant Fitts' Law task
- Real-time adaptation engine with hysteresis
- Comprehensive telemetry (movement kinematics, display metadata, policy state)
- Automated quality control (invalid trial detection, exclusion criteria)

---

## 8. Lessons Learned & Future Directions

### Key Learnings

1. **Not all "adaptive" changes are meaningful:** Decluttering UI can be helpful, but the larger pain point is **intent errors in gaze** (slips). Adaptation should target the dominant failure mode, not just reduce UI chrome.

2. **Policy thresholds must be validated:** Our first attempt used conservative thresholds (`pressure_only: true` + strict error/RT). Next iteration: Remove pressure-only gating, use longer tasks to induce fatigue, A/B test multiple policy variants.

3. **Modality-specific design matters:** Different input modalities have different failure modes (slips for gaze, fatigue for hand). Adaptations must address specific modality challenges.

**Instrumentation & Limitation Note:**
Hand width inflation did not activate in this dataset (width_scale_factor always 1.0) due to policy thresholds not being met; the system instrumented and validated logging caught this non-activation early. Conclusions therefore focus on gaze declutter, which was exercised and evaluable.

### Future Research Directions

1. **Real modality switching:** Evaluate automatic switching between hand and gaze (not just assistance within modalities).

2. **Policy threshold calibration:** A/B test multiple policy variants to identify optimal triggers for width inflation and declutter.

3. **Longer tasks:** Use extended sessions to induce fatigue and validate adaptive interventions under real-world conditions.

4. **Real eye-tracker validation:** Calibration study with hardware eye-tracker to tune simulation parameters and confirm same UX signatures.

---

## Conclusion

This research demonstrated a feasible way to implement adaptive assistance in XR and provided new insights into when such adaptations help users. We showed it's possible to provide real-time UI interventions based on performance, though the current implementation needs refinement before deployment—an encouraging foundation for future adaptive XR interfaces.

### What I Learned

I learned that designing adaptive systems requires careful tuning. Instrumentation caught that hand width inflation did not activate (width_scale_factor always 1.0), demonstrating the value of validated telemetry. We also found that users need clear feedback for adaptations; otherwise, assistance might go unnoticed. Critically, the data showed that not all "adaptive" changes are meaningful—decluttering UI can be helpful, but the larger pain point is **intent errors in gaze** (slips). Adaptation should target the dominant failure mode.

### Real-World Impact

The project's findings can inform next-gen AR/VR interfaces. For instance, an AR headset could use eye-tracking to declutter a user's view when it senses cognitive overload, improving comfort during long uses. The research also provides actionable design guidelines: modality-specific adaptations, stable adaptation mechanisms, and intent-first gaze design.

### Role & Skills Demonstrated

**Role:** I led this project end-to-end—from identifying the research question, to building the prototype (React + TypeScript), designing and running the experiment (N=80 participants), through to analyzing data (R/Python) and drawing insights.

**Skills Exercised:**
- UX research: User-centered design, mixed methods, workload assessment
- Technical: Full-stack development, data analysis, deployment
- Domain expertise: Spatial interaction design, adaptive systems, XR interaction challenges
- Communication: Translating research into actionable design guidelines

This project showcases how I combine technical prototyping, experimental research, and UX insight to tackle complex HCI challenges—an approach I'm excited to bring to product design and research roles in the XR industry.

### Limitations & Future Work

**Limitations:** This study used a mouse-based gaze simulator instead of an actual eye-tracking headset, which may limit ecological validity (real headsets have different ergonomics and noise). Additionally, the adaptive target expansion feature did not activate under our test conditions, so its benefit is unconfirmed—highlighting the need for further testing with revised parameters and perhaps longer tasks to induce fatigue.

**Next Steps:** Calibration study with real eye-tracker hardware, validation of adaptive mechanisms with refined thresholds, and real-world testing in authentic XR applications.

---

## Contact & Links

**GitHub Repository:** [xr-adaptive-modality-2025](https://github.com/mohdasti/xr-adaptive-modality-2025)  
**Author:** Mohammad Dastgheib  
**Email:** mohammad.dastgheib@email.ucr.edu  
**ORCID:** 0000-0001-7684-3731

---

*This case study is based on the `xr-adaptive-modality-2025` research project. All methodologies, findings, and technical implementations are documented in the project repository and associated research materials.*
