# Executive Summary: XR Adaptive Modality Research
## One-Page Overview for Recruiters

---

## 🎯 The Project in One Sentence

I designed and shipped a complete UX research platform investigating adaptive input modality systems in Extended Reality, then used findings from **N = 80** participants to surface concrete XR interaction pain points (especially gaze “Midas Touch” failures) and drive an iteration roadmap.

---

## 📊 Key User Experience Outcomes

| Outcome | Achievement |
|--------|------------|
| **Primary pain point surfaced** | Gaze interaction errors are far higher than hand, dominated by **slip** errors (intent vs attention) |
| **Workload insight (NASA‑TLX)** | Workload is higher in gaze than hand; Adaptive vs Static TLX is similar in this build |
| **Adaptive feature reality check** | **Width inflation did not activate** (`width_scale_factor = 1.0`), shaping next iteration |
| **Sample Size** | **N = 80** participants |
| **Design** | 2×2×2 within-subjects factorial (user-centered) |

---

## 🔬 Research Approach

✅ **User-Centered Design:** Focus on user experience outcomes, not just performance metrics  
✅ **Mixed Methods:** Quantitative performance + qualitative user feedback  
✅ **Workload Assessment:** NASA-TLX to measure user experience  
✅ **Pre-registered:** Study design documented before data collection  
✅ **Accessible:** Web-based platform for remote data collection  
✅ **Ethical:** Minimal data collection, strong privacy protections  

---

## 💻 Technical Implementation

**Platform:** Web-based research application (React 18 + TypeScript)  
**Deployment:** Vercel (remote data collection)  
**Key Features:**
- **Gaze was simulated (no hardware eye tracker):** a psychophysics-informed proxy with Gaussian jitter + lag/saccade constraints, enabling remote scale and reproducible conditions
- Policy-based adaptation engine (responds to user performance)
- Comprehensive user experience data collection
- Display calibration for consistent experience
- Automatic quality control

**Code Quality:** Full documentation, Git history, reproducible analysis

---

## 🎨 Adaptive Interventions

**1. Declutter (Gaze Mode):**
- Reduces visual distraction when users struggle
- Aligns with how human vision works (foveal focus)
- User Experience: Less distraction, easier target tracking

**2. Width Inflation (Hand Mode):**
- Expands target size when users show performance issues
- Compensates for motor tremor and fatigue
- User Experience: Easier selection, reduced frustration

**Important:** In the current dataset, **width inflation did not activate**, so performance benefits from this mechanism are not claimed yet.

---

## 📈 User Experience Findings

**Performance pain point (highest signal):**
- Gaze interaction shows substantially higher error rates than hand, and gaze errors are overwhelmingly **slips** (a “Midas Touch” intent problem).

**Workload (NASA-TLX):**
- Gaze workload > hand workload (consistent with higher error/verification burden)
- Adaptive vs Static workload is similar in this build (no clear reduction yet)

**User Insights:**
- Users develop different strategies for different modalities
- Adaptive system supports user strategies
- Some users benefit without explicit awareness of adaptations

---

## 🎓 Skills Demonstrated

### UX Research
- User-centered research design
- Mixed methods (quantitative + qualitative)
- Workload assessment (NASA-TLX)
- User experience metrics
- Ethical research practices

### AR/XR Expertise
- Spatial interaction design
- Modality design (hand vs. gaze)
- Adaptive systems
- User experience in XR
- Design guidelines

### Technical Skills
- Full-stack development (React + TypeScript)
- Research tooling and deployment
- Data analysis (quantitative + qualitative)
- Accessible platform design

---

## 🌟 Why This Work is Exciting

1. **User-Centered Approach:** Focus on user experience outcomes, not just technical metrics
2. **Practical Relevance:** Addresses real XR challenges (Gorilla Arm, Midas Touch) with actionable insights
3. **Accessible Research:** Platform enables rigorous research while remaining accessible
4. **Actionable Insights:** Provides design guidelines and practical recommendations
5. **End-to-End Ownership:** From hypothesis to platform to user research to design guidelines

---

## 📚 Project Artifacts

- **GitHub Repository:** Complete source code with documentation
- **Pre-registration:** Study design and user experience focus
- **Research Platform:** Deployed web application for data collection
- **Design Guidelines:** Actionable recommendations based on findings
- **User Experience Analysis:** Performance, workload, and qualitative insights

---

## 🎯 Perfect For Roles In

- **UX Research:** User-centered design, mixed methods, workload assessment
- **AR/XR Design:** Spatial interaction, adaptive systems, user experience
- **Product Design:** User-centered design, design guidelines, practical insights
- **Research Engineering:** Full-stack development, research tooling, accessible platforms

---

## 📞 Quick Contact

**Author:** Mohammad Dastgheib  
**Email:** mohammad.dastgheib@email.ucr.edu  
**ORCID:** 0000-0001-7684-3731  
**GitHub:** [Repository Link]

---

## 💬 The Elevator Pitch

"I designed and ran a UX research study on adaptive input modalities in Extended Reality. I built the full research platform, collected data from 80 participants, and used NASA‑TLX plus performance telemetry to identify the biggest UX breakdowns—especially the gaze ‘Midas Touch’ slip pattern. The project outputs actionable design directions for XR teams (intent disambiguation, confirmation, stabilization, and validated adaptation mechanisms), not just charts."

---

*For full details, see `CASE_STUDY.md`. For talking points, see `CASE_STUDY_TALKING_POINTS.md`.*
