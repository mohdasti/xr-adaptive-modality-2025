# EmailJS Setup Guide for Data Collection

## Quick Start (5 minutes)

### Step 1: Create EmailJS Account
1. Go to https://www.emailjs.com/
2. Sign up for a free account (200 emails/month)
3. Verify your email address

### Step 2: Add Email Service

**⚠️ Gmail API Issues?** If you get "insufficient authentication scopes" error with Gmail, use **Gmail SMTP** instead (see below).

#### Option A: Gmail SMTP (Recommended - More Reliable)

1. In EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose **Gmail** → Select **Gmail SMTP** (NOT Gmail API)
4. You'll need to:
   - Enable "Less secure app access" OR
   - Use an **App Password** (recommended):
     - Go to your Google Account → Security
     - Enable 2-Step Verification (if not already)
     - Go to App Passwords
     - Generate a new app password for "Mail"
     - Use this password in EmailJS (NOT your regular Gmail password)
5. Enter your Gmail address: `xr2025mohdast@gmail.com`
6. Enter the App Password (16-character code)
7. **Copy the Service ID** (e.g., `service_di80rn4`)

#### Option B: Outlook/Hotmail (Alternative)

1. Choose **Outlook** or **Hotmail** as service
2. Enter your email and password
3. Usually works without additional setup

#### Option C: Custom SMTP (Most Flexible)

1. Choose **Custom SMTP**
2. Use Gmail SMTP settings:
   - **SMTP Server:** `smtp.gmail.com`
   - **SMTP Port:** `587` (TLS) or `465` (SSL)
   - **SMTP Username:** `xr2025mohdast@gmail.com`
   - **SMTP Password:** Your App Password (see Option A)
   - **Secure Connection:** TLS or SSL

### Step 3: Create Email Template
1. Go to **Email Templates**
2. Click **Create New Template**
3. Use this template:

**Template Name:** Experiment Data Submission

**Subject:** Experiment Data - Participant {{participant_id}}

**Content:**
```
Experiment data submission

Participant ID: {{participant_id}}
Timestamp: {{timestamp}}

CSV data is attached.

{{message}}
```

4. **Important:** For attachments, you'll need to use EmailJS's attachment feature or send data in email body
5. **Copy the Template ID** (e.g., `template_xyz789`)

### Step 4: Get Public Key
1. Go to **Account** → **General**
2. Find **Public Key**
3. **Copy the Public Key** (e.g., `abcdefghijklmnop`)

### Step 5: Configure Environment Variables

Create a `.env` file in the `app/` directory:

```env
VITE_EMAILJS_SERVICE_ID=service_abc123
VITE_EMAILJS_TEMPLATE_ID=template_xyz789
VITE_EMAILJS_PUBLIC_KEY=abcdefghijklmnop
```

**Note:** For production, you'll need to set these as environment variables in your hosting platform (Vercel, Netlify, etc.)

### Step 6: Install EmailJS Package

```bash
cd app
npm install @emailjs/browser
```

### Step 7: Test

1. Start the dev server: `npm run dev`
2. Complete a few trials
3. Click **📤 Auto-Submit** button in LoggerPane
4. Check your email inbox

## Alternative: Send Data in Email Body (No Attachments)

If EmailJS free tier doesn't support attachments, you can send CSV data in the email body:

**Template Content:**
```
Experiment data submission

Participant ID: {{participant_id}}
Timestamp: {{timestamp}}

Trial Data (CSV):
{{csv_data}}

Block Data (CSV):
{{block_data}}

{{message}}
```

**Note:** You'll need to modify `dataSubmission.ts` to send data as text instead of base64 if using this approach.

## Troubleshooting

### "Email service not configured"
- Check that all three environment variables are set
- Restart dev server after adding `.env` file
- Check variable names match exactly (case-sensitive)

### "Email send failed"
- Verify EmailJS service is connected
- Check template ID is correct
- Ensure public key is valid
- Check EmailJS dashboard for error logs

### Data not received
- Check spam folder
- Verify email service connection in EmailJS dashboard
- Check EmailJS usage limits (free tier: 200/month)

## Production Deployment

### Vercel
1. Go to Project Settings → Environment Variables
2. Add all three `VITE_EMAILJS_*` variables
3. Redeploy

### Netlify
1. Go to Site Settings → Environment Variables
2. Add all three `VITE_EMAILJS_*` variables
3. Redeploy

### Other Platforms
Set environment variables according to your platform's documentation.

## Security Notes

- Public Key is safe to expose in frontend code (it's public)
- Service ID and Template ID are also safe (they're in your frontend code)
- EmailJS handles rate limiting automatically
- Consider upgrading to paid plan for production (higher limits)

## Next Steps

1. Test with a few participants
2. Monitor EmailJS dashboard for usage
3. Consider upgrading to server-side collection for production
4. Set up automatic email forwarding/filtering for organization

