# Fixing Gmail API Authentication Error in EmailJS

## Problem
Error: `412 Gmail_API: Request had insufficient authentication scopes`

This happens when EmailJS tries to use Gmail API but doesn't have the right permissions.

## Solution: Use Gmail SMTP Instead

Gmail SMTP is more reliable and doesn't require complex OAuth setup.

### Step 1: Enable App Password in Gmail

1. **Go to your Google Account**
   - Visit: https://myaccount.google.com/
   - Sign in with `xr2025mohdast@gmail.com`

2. **Enable 2-Step Verification** (Required for App Passwords)
   - Go to **Security** → **2-Step Verification**
   - Follow the setup process if not already enabled

3. **Generate App Password**
   - Go to **Security** → **App Passwords**
   - Or visit directly: https://myaccount.google.com/apppasswords
   - Select app: **Mail**
   - Select device: **Other (Custom name)**
   - Enter name: "EmailJS"
   - Click **Generate**
   - **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)
   - **Important:** Remove spaces when using it (use: `abcdefghijklmnop`)

### Step 2: Add Service in EmailJS

1. **Go to EmailJS Dashboard**
   - Visit: https://dashboard.emailjs.com/admin
   - Go to **Email Services**

2. **Add New Service**
   - Click **Add New Service**
   - Choose **Gmail**
   - **IMPORTANT:** Look for **"Gmail SMTP"** option (NOT "Gmail API")
   - If you only see "Gmail API", try:
     - Scroll down to see other options
     - Or use **"Custom SMTP"** instead (see below)

3. **Enter Credentials**
   - **Email:** `xr2025mohdast@gmail.com`
   - **Password:** The 16-character App Password (no spaces)
   - Click **Create Service**

### Alternative: Use Custom SMTP

If "Gmail SMTP" option isn't available:

1. **Choose "Custom SMTP"** in EmailJS
2. **Enter these settings:**
   ```
   SMTP Server: smtp.gmail.com
   SMTP Port: 587
   SMTP Username: xr2025mohdast@gmail.com
   SMTP Password: [Your 16-character App Password]
   Secure Connection: TLS
   ```
3. Click **Create Service**

### Step 3: Verify Service

1. After creating, you should see your service listed
2. **Service ID:** `service_di80rn4` (you already have this!)
3. Test by sending a test email from EmailJS dashboard

## Troubleshooting

### "Invalid credentials" error
- Make sure you're using the **App Password**, not your regular Gmail password
- Remove spaces from the App Password
- Verify 2-Step Verification is enabled

### "Less secure app access" error
- Google deprecated this feature
- **Must use App Password** instead (see Step 1 above)

### Still getting API errors
- Try using **Outlook** or **Hotmail** instead (easier setup)
- Or use a different email service provider

## Quick Test

Once configured:

1. Go to EmailJS → **Email Templates**
2. Create a simple test template
3. Send a test email
4. Check `xr2025mohdast@gmail.com` inbox

## Next Steps

After service is working:

1. Create email template (see `EMAILJS_SETUP.md`)
2. Get Template ID
3. Get Public Key
4. Add to `.env` file:
   ```env
   VITE_EMAILJS_SERVICE_ID=service_di80rn4
   VITE_EMAILJS_TEMPLATE_ID=your_template_id
   VITE_EMAILJS_PUBLIC_KEY=your_public_key
   ```

## Alternative: Use Different Email Provider

If Gmail continues to cause issues:

### Outlook/Hotmail (Easier)
- Usually works without App Passwords
- Just use email and password
- More reliable for automated emails

### SendGrid/Mailgun (Professional)
- Free tiers available
- Better for production
- More reliable delivery

