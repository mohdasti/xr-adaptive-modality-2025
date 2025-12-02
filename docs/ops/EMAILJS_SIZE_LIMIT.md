# EmailJS Size Limit Handling

## Problem

EmailJS free tier has a **50KB limit** on the total size of all template variables. After completing a full session (8 blocks × ~50-100 trials each), the CSV data can easily exceed this limit.

### What Happens When Size Exceeds 50KB?

- EmailJS returns a **413 error** (Payload Too Large)
- The email submission fails
- **Data is NOT lost** - it's still in the browser

## Solution: Automatic CSV Download

When data size exceeds 50KB or email submission fails with a 413 error, the application **automatically downloads** the CSV files to the user's computer.

### How It Works

1. **Pre-flight Check**: Before attempting to send email, we check if total data size exceeds 50KB
2. **Auto-Download**: If too large, CSV files are automatically downloaded instead of email
3. **User Notification**: Clear message explains what happened:
   - `ℹ️ Data size exceeds email limit (50KB). Automatically downloading files...`
   - `✅ Files downloaded automatically! Note: EmailJS free tier doesn't support attachments for large files. Your CSV files have been saved to your Downloads folder.`

### Which Files Are Downloaded?

When auto-download is triggered, the following files are saved:

1. **Trial Data CSV**: `experiment_{participantId}_session{sessionNum}_{timestamp}.csv`
   - Contains all trial-level data (RT, accuracy, endpoint error, etc.)

2. **Block Data CSV** (if available): `tlx_{participantId}_session{sessionNum}_{timestamp}.csv`
   - Contains NASA-TLX questionnaire responses (one row per block)

3. **Debrief Responses** (if submitted): Included in the email template (if email succeeds) or saved separately

## EmailJS Limitations

### Free Tier
- ✅ Email body with text content
- ❌ File attachments (not supported)
- ❌ Total variables size > 50KB

### Paid Tier Options
- EmailJS Pro ($15/month): Supports attachments up to 10MB
- EmailJS Premium ($35/month): Supports attachments up to 50MB

### Alternative: Server API
If you need reliable email delivery for large datasets, consider:
- Setting up a server endpoint (`VITE_API_URL`)
- Using a service like AWS SES, SendGrid, or Mailgun
- Storing data in cloud storage (S3, Firebase) and sending download links

## User Experience Flow

### Small Data (< 50KB)
1. User completes experiment
2. Data is automatically sent via email ✅
3. Backup CSV files are also downloaded (as precaution)

### Large Data (> 50KB)
1. User completes experiment
2. System detects data size exceeds limit
3. CSV files are **automatically downloaded** 📥
4. User sees clear message explaining why email wasn't sent
5. User can manually email files if needed (via their email client)

## For Principal Investigators

### When You Receive Data

**If email succeeds:**
- Copy CSV data from email body
- Paste into text editor
- Save as `.csv` file
- Open in Excel/R/Python for analysis

**If email fails (auto-download triggered):**
- Participant has CSV files in their Downloads folder
- They may need to manually email you the files
- Or they can use the download buttons on the Debrief page

### Recommended Data Collection Strategy

1. **For Small Sessions** (< 50KB): Rely on automatic email
2. **For Large Sessions** (> 50KB): 
   - Automatic download ensures data is never lost
   - Consider asking participants to email you the downloaded CSV files
   - Or set up a server endpoint for direct upload

## Technical Implementation

### Size Check
```typescript
const totalSize = JSON.stringify(templateParams).length
if (totalSize > 50 * 1024) {
  // Trigger auto-download instead of email
}
```

### Auto-Download Logic
- Located in: `app/src/components/LoggerPane.tsx` and `app/src/routes/Debrief.tsx`
- Uses `logger.downloadCSV()` and `logger.downloadBlockCSV()` methods
- Files are saved with descriptive names including participant ID and timestamp

### Error Handling
- 413 errors (size limit) → Auto-download
- Network errors → Auto-download (backup)
- Configuration errors → Show helpful message

## FAQ

**Q: Can I increase the EmailJS limit?**  
A: Not on the free tier. Consider upgrading to Pro/Premium or using a server endpoint.

**Q: Will data be lost if email fails?**  
A: No! Auto-download ensures data is saved locally. Users can always manually download using the buttons on the Debrief page.

**Q: Can participants still email me the data?**  
A: Yes! They can attach the downloaded CSV files to an email from their email client.

**Q: Is there a way to send large files automatically?**  
A: Yes, but it requires a server endpoint (`VITE_API_URL`). See the "Alternative: Server API" section above.

## References

- [EmailJS Pricing](https://www.emailjs.com/pricing/)
- [EmailJS API Documentation](https://www.emailjs.com/docs/)
- EmailJS Free Tier Limits: 50KB total variables size


