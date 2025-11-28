# Data Collection Strategies for Web-Based Experiment

## Overview
This document outlines multiple strategies for collecting experiment data from participants, each with different trade-offs in terms of setup complexity, reliability, and participant experience.

## Current Implementation
- Data is stored in-memory (CSVLogger class)
- Participants can manually download CSV/JSON files
- Participant ID is prompted on page load

## Strategy Comparison

| Strategy | Setup Complexity | Reliability | Participant Effort | Best For |
|----------|-----------------|-------------|-------------------|----------|
| **1. Server API** | Medium | ⭐⭐⭐⭐⭐ | None (automatic) | Production studies |
| **2. Email (EmailJS)** | Low | ⭐⭐⭐⭐ | None (automatic) | Quick studies, no backend |
| **3. Cloud Storage** | Medium | ⭐⭐⭐⭐ | None (automatic) | Studies with cloud access |
| **4. Hybrid (Download + Send)** | Low | ⭐⭐⭐⭐⭐ | Minimal (backup) | All studies (recommended) |

---

## Strategy 1: Server-Side API Collection (Recommended for Production)

### Overview
Set up a backend API endpoint that receives CSV data and stores it server-side. Most reliable and secure.

### Implementation

#### Backend API Endpoint (Example: Node.js/Express)
```javascript
// server/api/submit-data.js
const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

router.post('/submit-data', async (req, res) => {
  try {
    const { participantId, csvData, blockData, metadata } = req.body;
    
    // Validate
    if (!participantId || !csvData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create participant directory
    const dataDir = path.join(__dirname, '../data', participantId);
    await fs.mkdir(dataDir, { recursive: true });
    
    // Save trial data
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const csvPath = path.join(dataDir, `trials_${timestamp}.csv`);
    await fs.writeFile(csvPath, csvData, 'utf-8');
    
    // Save block data if provided
    if (blockData) {
      const blockPath = path.join(dataDir, `blocks_${timestamp}.csv`);
      await fs.writeFile(blockPath, blockData, 'utf-8');
    }
    
    // Save metadata
    const metaPath = path.join(dataDir, `metadata_${timestamp}.json`);
    await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2), 'utf-8');
    
    res.json({ success: true, message: 'Data received successfully' });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

module.exports = router;
```

#### Frontend Integration
Add to `app/src/lib/dataSubmission.ts`:

```typescript
interface SubmissionResult {
  success: boolean
  message?: string
  error?: string
}

export async function submitDataToServer(
  csvData: string,
  blockData: string | null,
  participantId: string
): Promise<SubmissionResult> {
  const API_URL = import.meta.env.VITE_API_URL || 'https://your-api.com/api'
  
  try {
    const response = await fetch(`${API_URL}/submit-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        participantId,
        csvData,
        blockData,
        metadata: {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        },
      }),
    })
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`)
    }
    
    const result = await response.json()
    return { success: true, message: result.message }
  } catch (error) {
    console.error('Failed to submit data:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
```

### Pros
- ✅ Most reliable (server-side storage)
- ✅ Automatic (no participant action needed)
- ✅ Secure (data never leaves your server)
- ✅ Can add validation/processing
- ✅ Easy to organize by participant

### Cons
- ❌ Requires backend server setup
- ❌ Need to handle server maintenance/backups

---

## Strategy 2: Email Submission (EmailJS) - Easiest Setup

### Overview
Use EmailJS (or similar service) to send CSV files as email attachments. No backend required.

### Setup Steps

1. **Sign up for EmailJS** (free tier: 200 emails/month)
   - Go to https://www.emailjs.com/
   - Create account and verify email

2. **Configure Email Service**
   - Add your email service (Gmail, Outlook, etc.)
   - Create email template with attachment support

3. **Get API Keys**
   - Service ID, Template ID, Public Key

### Implementation

#### Install EmailJS
```bash
npm install @emailjs/browser
```

#### Add to `app/src/lib/dataSubmission.ts`:
```typescript
import emailjs from '@emailjs/browser'

interface EmailSubmissionResult {
  success: boolean
  message?: string
  error?: string
}

export async function submitDataViaEmail(
  csvData: string,
  blockData: string | null,
  participantId: string
): Promise<EmailSubmissionResult> {
  const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || ''
  const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || ''
  const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || ''
  
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    return {
      success: false,
      error: 'Email service not configured'
    }
  }
  
  try {
    // Convert CSV to base64 for attachment
    const csvBlob = new Blob([csvData], { type: 'text/csv' })
    const csvBase64 = await blobToBase64(csvBlob)
    
    const templateParams = {
      participant_id: participantId,
      timestamp: new Date().toISOString(),
      csv_data: csvBase64,
      csv_filename: `experiment_${participantId}_${Date.now()}.csv`,
      block_data: blockData ? await blobToBase64(new Blob([blockData], { type: 'text/csv' })) : null,
      block_filename: blockData ? `blocks_${participantId}_${Date.now()}.csv` : null,
    }
    
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
    
    return {
      success: true,
      message: 'Data sent successfully via email'
    }
  } catch (error) {
    console.error('Email submission failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Email send failed'
    }
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
```

#### Environment Variables (`.env`)
```env
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

### Pros
- ✅ No backend required
- ✅ Easy setup (5 minutes)
- ✅ Automatic submission
- ✅ Free tier available

### Cons
- ❌ Email size limits (~25MB)
- ❌ Free tier has monthly limits
- ❌ Less secure (data in email)
- ❌ Requires manual email processing

---

## Strategy 3: Cloud Storage Upload (Google Drive/Dropbox/AWS S3)

### Overview
Upload CSV files directly to cloud storage using APIs. Good middle ground.

### Implementation Example (Google Drive)

#### Setup
1. Create Google Cloud Project
2. Enable Google Drive API
3. Create Service Account
4. Share Drive folder with service account email

#### Add to `app/src/lib/dataSubmission.ts`:
```typescript
export async function submitDataToGoogleDrive(
  csvData: string,
  blockData: string | null,
  participantId: string
): Promise<SubmissionResult> {
  // Use Google Drive API via your backend proxy
  // (Direct client-side upload requires OAuth, which is complex)
  const API_URL = import.meta.env.VITE_API_URL || 'https://your-api.com/api'
  
  try {
    const formData = new FormData()
    const csvBlob = new Blob([csvData], { type: 'text/csv' })
    formData.append('file', csvBlob, `experiment_${participantId}_${Date.now()}.csv`)
    
    if (blockData) {
      const blockBlob = new Blob([blockData], { type: 'text/csv' })
      formData.append('blockFile', blockBlob, `blocks_${participantId}_${Date.now()}.csv`)
    }
    
    formData.append('participantId', participantId)
    
    const response = await fetch(`${API_URL}/upload-to-drive`, {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`)
    }
    
    return { success: true, message: 'Data uploaded successfully' }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}
```

### Pros
- ✅ Automatic upload
- ✅ Organized in cloud storage
- ✅ Easy access for analysis
- ✅ Scalable

### Cons
- ❌ Requires API setup
- ❌ May need backend proxy for security
- ❌ API rate limits

---

## Strategy 4: Hybrid Approach (Recommended)

### Overview
Combine automatic submission with manual download as backup. Best of both worlds.

### Implementation

Add to `app/src/components/LoggerPane.tsx`:

```typescript
import { submitDataToServer } from '../lib/dataSubmission' // or email/cloud
import { getLogger } from '../lib/csv'

const handleAutoSubmit = async () => {
  const logger = getLogger()
  const csvData = logger.toCSV()
  const blockData = logger.getBlockRowCount() > 0 ? logger.toBlockCSV() : null
  const participantId = logger.getParticipantId() // Add this method to CSVLogger
  
  setSubmitting(true)
  setSubmitStatus('Submitting data...')
  
  try {
    // Try server submission first
    const result = await submitDataToServer(csvData, blockData, participantId)
    
    if (result.success) {
      setSubmitStatus('✅ Data submitted successfully!')
      // Still offer download as backup
      setTimeout(() => {
        logger.downloadCSV(`backup_${participantId}_${Date.now()}.csv`)
      }, 2000)
    } else {
      throw new Error(result.error || 'Submission failed')
    }
  } catch (error) {
    setSubmitStatus('⚠️ Auto-submit failed. Please download manually.')
    console.error('Submission error:', error)
  } finally {
    setSubmitting(false)
  }
}
```

### UI Addition
```tsx
<button 
  onClick={handleAutoSubmit} 
  disabled={submitting || csvRowCount === 0}
  className="submit-btn"
>
  {submitting ? 'Submitting...' : '📤 Auto-Submit Data'}
</button>
{submitStatus && <div className="submit-status">{submitStatus}</div>}
```

### Pros
- ✅ Automatic submission
- ✅ Manual download as backup
- ✅ Participant sees confirmation
- ✅ Works even if auto-submit fails

### Cons
- ❌ Slightly more complex UI

---

## Participant-Specific Links

### Implementation

#### Option A: URL Parameters
```
https://your-experiment.com/?pid=P001&sequence=3
```

#### Option B: Custom Routes
```
https://your-experiment.com/participant/P001/sequence/3
```

#### Code to Extract Participant Info
```typescript
// app/src/utils/participantConfig.ts
export function getParticipantConfig(): {
  participantId: string | null
  sequenceIndex: number | null
} {
  const params = new URLSearchParams(window.location.search)
  const participantId = params.get('pid') || params.get('participant')
  const sequenceIndex = params.get('sequence') 
    ? parseInt(params.get('sequence')!, 10) 
    : null
  
  return { participantId, sequenceIndex }
}

// In TaskPane.tsx or App.tsx
useEffect(() => {
  const { participantId, sequenceIndex } = getParticipantConfig()
  
  if (participantId) {
    // Use provided participant ID
    initLogger(participantId)
  }
  
  if (sequenceIndex !== null) {
    // Use specific sequence instead of prompting
    const sequence = sequenceForParticipant(sequenceIndex)
    setBlockSequence(sequence)
  }
}, [])
```

---

## Recommended Implementation Plan

### Phase 1: Quick Start (EmailJS)
1. Set up EmailJS account
2. Implement email submission
3. Test with a few participants
4. **Time: 1-2 hours**

### Phase 2: Production (Server API)
1. Set up backend server (Node.js/Express or Python/Flask)
2. Implement API endpoint
3. Add automatic submission on experiment completion
4. Keep email as fallback
5. **Time: 4-6 hours**

### Phase 3: Participant Links
1. Add URL parameter parsing
2. Generate participant-specific links
3. Pre-configure sequences
4. **Time: 1-2 hours**

---

## Security Considerations

1. **Rate Limiting**: Prevent spam submissions
2. **Validation**: Verify participant IDs and data format
3. **Sanitization**: Clean file names and data
4. **HTTPS**: Always use encrypted connections
5. **Access Control**: Restrict API access if using server

---

## Next Steps

1. Choose a strategy based on your needs
2. Implement the submission function
3. Add UI button for auto-submit
4. Test with a few participants
5. Monitor and iterate

Would you like me to implement any of these strategies in your codebase?

