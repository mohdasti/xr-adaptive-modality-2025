# EmailJS Template Setup - Quick Guide

## Current Status ✅
- ✅ Outlook service configured
- ✅ Service ID: `service_di80rn4`
- ⚠️ Template needs to be updated to match code

## What to Update in Your Template

### 1. Update Email Content

**Current content says:** "CSV data is attached" ❌

**Should be:** CSV data in email body ✅

**Replace the Content section with:**

```
Experiment Data Submission

Participant ID: {{participant_id}}
Timestamp: {{timestamp}}

{{message}}

═══════════════════════════════════════════════════════════
📊 TRIAL DATA (CSV)
═══════════════════════════════════════════════════════════
Filename: {{csv_filename}}

{{csv_data}}

{% if block_data %}
═══════════════════════════════════════════════════════════
📊 BLOCK DATA (CSV)
═══════════════════════════════════════════════════════════
Filename: {{block_filename}}

{{block_data}}
{% endif %}

═══════════════════════════════════════════════════════════
✅ End of Data
═══════════════════════════════════════════════════════════
```

**Note:** The `{% if block_data %}` syntax is EmailJS template syntax - it will only show block data if it exists.

### 2. Update "To Email" Field

Currently set to: `xr2025mohdasti@outlook.com`

**Make sure this is correct** - this is where you'll receive all experiment data emails.

### 3. Get Your Template ID

After saving the template:
1. Look at the URL in your browser - it should be something like:
   `https://dashboard.emailjs.com/admin/template/xxxxxxx`
2. The `xxxxxxx` part is your **Template ID** (e.g., `template_abc123`)
3. Or look for "Template ID" in the template settings

### 4. Get Your Public Key

1. Go to **Account** → **General** (in EmailJS dashboard)
2. Find **Public Key**
3. Copy it (e.g., `abcdefghijklmnop`)

### 5. Configure Environment Variables

Create or update `app/.env` file:

```env
VITE_EMAILJS_SERVICE_ID=service_di80rn4
VITE_EMAILJS_TEMPLATE_ID=your_template_id_here
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
```

### 6. Test It!

1. Click **"Test It"** button in EmailJS to send a test email
2. Check `xr2025mohdasti@outlook.com` inbox
3. You should see the template with sample data

### 7. Test in Your App

1. Restart dev server: `npm run dev`
2. Complete a few trials in your experiment
3. Click **📤 Auto-Submit** button in LoggerPane
4. Check your Outlook inbox for the CSV data

## Quick Checklist

- [ ] Update email content (remove "attached", add CSV placeholders)
- [ ] Verify "To Email" is correct (`xr2025mohdasti@outlook.com`)
- [ ] Save template
- [ ] Get Template ID
- [ ] Get Public Key
- [ ] Add to `.env` file
- [ ] Test in EmailJS dashboard
- [ ] Test in your app

## Troubleshooting

**Email not received?**
- Check spam folder
- Verify "To Email" field is correct
- Check EmailJS dashboard → Email History for errors

**Template variables not showing?**
- Make sure you're using double curly braces: `{{variable_name}}`
- Check spelling matches exactly (case-sensitive)

**"Email service not configured" error?**
- Restart dev server after adding `.env` file
- Check variable names match exactly
- Verify all three variables are set

