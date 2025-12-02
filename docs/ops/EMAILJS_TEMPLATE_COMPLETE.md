# Complete EmailJS Template for XR Adaptive Modality Study

This template includes all data: trial data, block data (TLX), and debrief responses.

## Template Subject
```
Experiment Data - Participant {{participant_id}}
```

## Template Body

```
Experiment Data Submission - XR Adaptive Modality Study

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PARTICIPANT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Participant ID: {{participant_id}}
Submission Timestamp: {{timestamp}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TRIAL DATA (CSV)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Filename: {{csv_filename}}

Copy the CSV data below and save it as a .csv file:

{{csv_data}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{% if block_data %}

BLOCK DATA - NASA-TLX QUESTIONNAIRE (CSV)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Filename: {{block_filename}}

Copy the CSV data below and save it as a separate .csv file:

{{block_data}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{% endif %}

{% if debrief_responses %}

DEBRIEF RESPONSES - STRATEGY QUESTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{debrief_responses}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{% endif %}

INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Copy the TRIAL DATA CSV section above
2. Paste into a text editor (Notepad, TextEdit, VS Code, etc.)
3. Save as: {{csv_filename}}

{% if block_data %}

4. Copy the BLOCK DATA CSV section above
5. Paste into a text editor
6. Save as: {{block_filename}}

{% endif %}

7. Both CSV files can be opened in Excel, R, Python, or any data analysis tool

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DATA COMPLETENESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This submission includes:
✅ All trial-level data (reaction time, accuracy, endpoint error, etc.)
✅ Fitts' Law parameters (ID, A, W)
✅ Display metadata (screen size, zoom, fullscreen status)
✅ Modality settings (hand/gaze, UI mode, pressure, aging)
✅ Participant and block information
✅ All spatial coordinates and error measurements
{% if block_data %}
✅ NASA-TLX questionnaire responses (one row per block)
{% endif %}
{% if debrief_responses %}
✅ Strategy question responses (qualitative feedback)
{% endif %}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Note: This is an automated submission from the XR Adaptive Modality Study experiment platform.

```

## Template Notes

- **Conditional Fields**: The template uses `{% if block_data %}` and `{% if debrief_responses %}` to only show sections when data is available
- **Formatting**: Uses Unicode box-drawing characters (━━) for clear visual separation
- **Clear Instructions**: Step-by-step instructions for saving CSV files
- **Data Completeness Checklist**: Shows exactly what's included in the submission

## How to Update Your EmailJS Template

1. Log into EmailJS dashboard
2. Go to Email Templates
3. Select your template
4. Update the Subject and Body with the template above
5. Save the template

## Template Variables Used

The code sends these variables to EmailJS:
- `participant_id` - Participant ID (e.g., "P001_session1")
- `timestamp` - ISO timestamp
- `csv_data` - Trial data CSV (formatted as code block)
- `csv_filename` - Suggested filename for trial data
- `block_data` - Block/TLX data CSV (optional, formatted as code block)
- `block_filename` - Suggested filename for block data (optional)
- `debrief_responses` - JSON string with strategy question responses (optional)
- `message` - Detailed instructions (can be removed if using template above)


