# EmailJS Template - Clean Version

Copy this template directly into your EmailJS template editor.

## Subject Line
```
Experiment Data - {{participant_id}}
```

## Email Body (Copy Everything Below)

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

Save as: {{csv_filename}}

{{csv_data}}

{% if block_data %}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BLOCK DATA - NASA-TLX (CSV)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Save as: {{block_filename}}

{{block_data}}

{% endif %}

{% if debrief_responses %}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DEBRIEF RESPONSES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{debrief_responses}}

{% endif %}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Copy the TRIAL DATA section above
2. Paste into a text editor (Notepad, TextEdit, VS Code, etc.)
3. Save as: {{csv_filename}} (make sure to include .csv extension)

{% if block_data %}

4. Copy the BLOCK DATA section above
5. Paste into a text editor
6. Save as: {{block_filename}} (make sure to include .csv extension)

{% endif %}

7. Open both CSV files in Excel, R, Python, or your data analysis tool

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DATA INCLUDED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ All trial-level data (RT, accuracy, endpoint error)
✅ Fitts' Law parameters (ID, A, W)
✅ Display metadata (screen size, zoom, fullscreen)
✅ Modality settings (hand/gaze, UI mode, pressure, aging)
✅ All spatial coordinates and error measurements
{% if block_data %}✅ NASA-TLX questionnaire responses{% endif %}
{% if debrief_responses %}✅ Strategy question responses{% endif %}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Automated submission from XR Adaptive Modality Study experiment platform.
```

## Important Notes

1. **Remove the old `{{message}}` field** - The template above includes all instructions
2. **Conditional sections** - The `{% if %}` tags ensure sections only show when data is available
3. **Clean formatting** - Uses visual separators for easy reading
4. **All variables included** - Template handles trial data, block data, and debrief responses

## To Update Your EmailJS Template

1. Go to https://dashboard.emailjs.com/
2. Navigate to Email Templates
3. Open your template
4. Replace the entire body with the template above
5. Set the Subject to: `Experiment Data - {{participant_id}}`
6. Save

