# Demographics and Experience Descriptives

**Source:** `data/clean/trial_data.csv`  
**Sample:** Primary analysis sample (N=69) — 8-block complete, QC filters applied, input device = mouse only (trackpad hand trials excluded per manuscript policy)

**Purpose:** Provide descriptive statistics for all collected demographics and experience variables. Use this to decide whether any should be added to the manuscript Participants section.

---

## Summary Table (N=69)

| Variable | Type | N | Descriptive |
|----------|------|---|------------|
| **age** | numeric | 69 | Mean 30.0 (SD 7.5), Median 30, Range 18–62 |
| **gender** | categorical | 69 | Male 56.5% (39), Female 43.5% (30) |
| **gaming_hours_per_week** | numeric | 69 | Mean 1.6 (SD 4.6), Median 0, Range 0–32 |
| **input_device** | categorical | 69 | Mouse 100% (trackpad excluded from hand blocks) |
| **vision_correction** | categorical | 69 | None 58.0%, Glasses 36.2%, Contacts 4.3%, Other 1.4% |
| **wearing_correction_now** | binary | 69 | Yes 29.0% (20), No 71.0% (49) |
| **dominant_hand** | categorical | 69 | Right 91.3%, Left 8.7% |
| **operating_hand** | categorical | 69 | Right 100% |
| **using_dominant_hand** | binary | 69 | Yes 91.3%, No 8.7% |
| **motor_impairment** | binary | 69 | No 100% |
| **fatigue_level** | numeric (1–7) | 69 | Mean 4.2 (SD 1.3), Median 4, Range 1–7 |

---

## Detailed Breakdowns

### Age
- Mean: 30.04 years  
- SD: 7.51  
- Median: 30  
- Range: 18–62  
- Missing: 0  

### Gender
- Male: 39 (56.5%)  
- Female: 30 (43.5%)  
- Missing: 0  

### Gaming Experience (hours per week)
- Mean: 1.59  
- SD: 4.56  
- Median: 0  
- Range: 0–32  
- % with 0 hrs: 63.8% (44)  
- % with ≥5 hrs/week: 5.8% (4)  
- Missing: 0  

### Input Device
- Mouse: 69 (100%) — trackpad users excluded from hand blocks; all remaining participants used mouse  
- Missing: 0  

### Vision Correction
- None: 40 (58.0%)  
- Glasses: 25 (36.2%)  
- Contacts: 3 (4.3%)  
- Other: 1 (1.4%)  
- Missing: 0  

### Wearing Correction During Task
- Yes: 20 (29.0%)  
- No: 49 (71.0%)  
- *Note: Only relevant when vision_correction = glasses or contacts. 20/28 with glasses or contacts reported wearing them.*  
- Missing: 0  

### Dominant Hand
- Right: 63 (91.3%)  
- Left: 6 (8.7%)  
- Missing: 0  

### Operating Hand (hand used for mouse)
- Right: 69 (100%)  
- Missing: 0  

### Using Dominant Hand
- Yes: 63 (91.3%)  
- No: 6 (8.7%) — left-handers using right hand for mouse  
- Missing: 0  

### Motor Impairment
- No: 69 (100%)  
- Yes: 0  
- Missing: 0  

### Fatigue Level (1 = very alert, 7 = very tired)
- Mean: 4.23  
- SD: 1.26  
- Median: 4  
- Range: 1–7  
- Missing: 0  

---

## Eyeglasses / Vision Summary (for manuscript consideration)

- **Any vision correction:** 29 (42.0%) — glasses, contacts, or other  
- **Glasses specifically:** 25 (36.2%)  
- **Wearing glasses/contacts during task:** 20 (29.0%)  
- **No correction:** 40 (58.0%)  

---

## Current Manuscript Participants Section

The manuscript currently states:
> "Participants were recruited from the university community (target: balanced gender distribution, age range 18–35). All had normal or corrected-to-normal vision and no known motor impairments."

**Gaps relative to collected data:**
- No reported age mean/SD/range  
- No reported gender distribution  
- No gaming experience  
- No vision correction / eyeglasses breakdown  
- No dominant hand or operating hand  
- No fatigue level  

---

## Column Definitions (from app schema)

| Column | Description |
|--------|-------------|
| age | Self-reported age (years) |
| gender | Self-reported (male/female) |
| gaming_hours_per_week | Hours per week spent gaming |
| input_device | mouse or trackpad (from Pointer Events) |
| vision_correction | none, glasses, contacts, other |
| wearing_correction_now | Whether wearing glasses/contacts during task |
| dominant_hand | left, right, ambidextrous |
| operating_hand | Hand used for mouse (left/right) |
| using_dominant_hand | True if operating_hand == dominant_hand |
| motor_impairment | Self-reported (yes/no) |
| fatigue_level | 1–7 Likert (1=very alert, 7=very tired) |
