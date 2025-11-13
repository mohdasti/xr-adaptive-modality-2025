# Privacy & Data Governance

This document describes data collection practices, privacy protections, and participant rights in the XR Adaptive Modality study.

---

## 1. Data Minimization

### No Personally Identifiable Information (PII)

**What We Do NOT Collect:**
- Names, email addresses, or contact information
- IP addresses (stripped if present)
- User agent strings (stripped from data)
- Video frames or images (even if camera is enabled)
- Location data or device identifiers
- Any information that could identify an individual

**What We DO Collect:**
- Anonymous participant ID (auto-generated or user-provided, not linked to identity)
- Trial-level performance data:
  - Reaction times, movement trajectories, endpoint coordinates
  - Task parameters (amplitude, width, difficulty)
  - Display metadata (zoom, fullscreen, DPR)
  - Telemetry metrics (path length, curvature, submovements)
- Block-level workload ratings (NASA-TLX)
- Session metadata (session ID, condition assignments)

**Anonymization:**
- Participant IDs are hashed using SHA-256 before any storage
- All data is de-identified at collection time
- No linkage between participant ID and personal information

---

## 2. Webcam and Gaze Data (Opt-In Only)

### Camera Access is Optional

**Policy:**
- Camera access is **never required** to participate in the study
- Participants can complete all tasks without camera
- Study proceeds normally even if camera is unavailable or denied

**Opt-In Process:**
- Participants are offered an optional "Camera Check" route (`/camera-check`)
- Camera permission is requested only if participant explicitly chooses to test it
- Permission can be revoked at any time without affecting study participation

**What Camera Data is Used For:**
- **Exploratory only:** Pupil diameter estimation via luminance sampling
- **No video storage:** No video frames are stored or transmitted
- **Local processing only:** All processing occurs in the browser
- **Scalar output only:** Only a z-score value (cognitive load proxy) is logged
- **Optional field:** `pupil_z_med` is logged only if camera is available and enabled

**Camera Quality Flags:**
- `camera_enabled` (boolean): Whether camera was successfully accessed
- `camera_quality` (0–1): Quality score if camera check was performed
- Stored in `sessionStorage` (not persisted)

**Privacy Protection:**
- Camera stream never leaves the browser
- No video recording or transmission
- Participant can disable camera at any time
- Study continues normally without camera

---

## 3. Data Storage and Export

### Local Storage Only

**During Study:**
- All data is stored **locally** in the participant's browser
- Data is held in memory and browser storage (sessionStorage/localStorage)
- No data is transmitted to external servers during data collection

**Export:**
- Participants can download their data at any time via CSV export
- Files are generated locally and downloaded to participant's device
- Export includes:
  - `trials_<sessionId>.csv` (always exported)
  - `streams_pointer_<sessionId>.jsonl.gz` (if raw telemetry enabled)
  - `streams_raf_<sessionId>.jsonl.gz` (if raw telemetry enabled)
  - `streams_state_<sessionId>.jsonl.gz` (if raw telemetry enabled)

**Data Format:**
- CSV files contain trial-level aggregated data
- Raw streams (if enabled) contain high-frequency pointer and RAF data
- All files are anonymized (no PII)

---

## 4. Participant Rights

### Right to Withdraw

**At Any Time:**
- Participants can withdraw from the study at any point
- No penalty or consequence for withdrawal

**Data Deletion:**
- Upon withdrawal, participant can delete local data:
  - Clear browser storage (localStorage/sessionStorage)
  - Delete downloaded CSV files
  - Close browser to clear in-memory data
- **Note:** If data has already been submitted to researchers, deletion request should be made directly to research team

**No Data Retention:**
- Local browser data is cleared when browser is closed (sessionStorage)
- Downloaded files remain on participant's device until manually deleted
- Researchers do not retain data without explicit participant consent

---

## 5. Data Sharing and Publication

### Aggregated Data Only

**What Will Be Shared:**
- **Aggregated statistics only:** Mean RT, error rates, throughput by condition
- **De-identified individual data:** Participant-level means (not trial-level)
- **No raw trajectories:** Individual pointer paths are not shared
- **No PII:** All data is fully anonymized

**Data Availability:**
- Analysis scripts and synthetic datasets available in repository
- De-identified aggregate results shared via OSF/Zenodo at `v1.0.0-data`
- Individual participant data available only with explicit consent

**Publication:**
- Results reported in aggregate form only
- No individual participant data in publications
- Participant IDs are anonymized in all reporting

---

## 6. Telemetry Data Governance

### Telemetry Levels

**P0 (Minimal):**
- Always collected: Basic trial metrics (RT, endpoint, error)
- No high-frequency data
- Standard for all participants

**P0+ (Full):**
- Includes: Path length, velocity, curvature, submovements
- Computed from pointer trajectory
- No raw event streams

**P1 (Raw):**
- Includes: High-frequency pointer samples, RAF deltas
- Compressed (gzip) and base64-encoded
- **Opt-in only:** Requires explicit consent
- Large file sizes (may be excluded from standard analysis)

### Data Quality and Health

**Event Health Tracking:**
- `pointer_coalesced_ratio`: Ratio of coalesced to total events
- `event_drop_estimate`: Estimated dropped events (gaps > 2× median dt)
- Used for data quality assessment, not shared individually

**Display Stability:**
- `zoom_pct`, `fullscreen`, `dpr` logged per trial
- `focus_blur_count`, `tab_hidden_ms` tracked for quality control
- Violations trigger exclusions (pre-declared)

---

## 7. Security Measures

### Browser-Based Security

**No Server Transmission:**
- All data processing occurs locally in the browser
- No data sent to external servers during collection
- Export files generated client-side

**Encryption:**
- Participant IDs hashed with SHA-256
- Raw streams compressed with gzip (if enabled)
- No encryption keys stored or transmitted

**Access Control:**
- Data accessible only to participant during collection
- Researchers access data only after participant consent and export
- No remote access to participant devices

---

## 8. Compliance and Ethics

### Ethical Standards

**IRB Approval:**
- Study protocol reviewed and approved by Institutional Review Board
- Informed consent obtained before participation
- Participant rights clearly communicated

**Data Protection:**
- Follows GDPR principles (data minimization, purpose limitation)
- Follows COPPA guidelines (if applicable)
- Complies with institutional data protection policies

**Transparency:**
- Privacy notice available before participation
- Data collection practices documented
- Participant can review data before export

---

## 9. Data Retention

### Retention Period

**Local Data:**
- Browser storage cleared when browser is closed (sessionStorage)
- Downloaded files remain on participant's device until manually deleted
- No automatic retention by researchers

**Submitted Data (if applicable):**
- Retained for analysis period (typically 90 days)
- Deleted after analysis completion
- Only aggregated results retained for publication

**Publication Data:**
- Aggregated, de-identified results retained indefinitely
- Individual participant data not retained without explicit consent
- Data availability statement in publications

---

## 10. Participant Consent and Withdrawal

### Informed Consent

**Before Participation:**
- Privacy notice presented and explained
- Participant acknowledges understanding
- Consent recorded (anonymously)

**During Participation:**
- Participant can pause or stop at any time
- No penalty for incomplete participation
- Data can be deleted locally

**After Participation:**
- Participant receives copy of their data (if exported)
- Can request deletion of submitted data (if applicable)
- Can withdraw consent for future use

---

## 11. Contact and Questions

### Data Protection Officer

**For Questions About:**
- Data collection practices
- Privacy concerns
- Data deletion requests
- Participant rights

**Contact:**
- Research team contact information (provided in consent form)
- IRB contact information (if applicable)

---

## 12. Changes to Privacy Policy

### Policy Updates

**Notification:**
- Participants notified of any material changes to privacy policy
- Updated policy available in repository
- Version history maintained

**Consent:**
- Continued participation implies consent to updated policy
- Participants can withdraw if they do not agree to changes

---

## Summary

| Aspect | Policy |
|--------|--------|
| **PII Collection** | None — fully anonymized |
| **Camera Access** | Opt-in only, never required |
| **Data Storage** | Local browser only during collection |
| **Data Export** | Participant-controlled CSV download |
| **Data Sharing** | Aggregated statistics only |
| **Withdrawal** | Anytime, with local data deletion |
| **Retention** | 90 days (if submitted), then deletion |
| **Security** | Browser-based, no server transmission |

---

## References

- GDPR: General Data Protection Regulation (EU 2016/679)
- COPPA: Children's Online Privacy Protection Act (US)
- ISO/IEC 29100:2011 - Information technology — Security techniques — Privacy framework
- WMA Declaration of Helsinki - Ethical principles for medical research

