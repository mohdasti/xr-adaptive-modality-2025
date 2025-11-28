/**
 * Data submission utilities for experiment data collection
 * Supports multiple submission methods: EmailJS, Server API, Cloud Storage
 */

interface SubmissionResult {
  success: boolean
  message?: string
  error?: string
}

/**
 * Submit data via EmailJS (easiest, no backend required)
 */
export async function submitDataViaEmail(
  csvData: string,
  blockData: string | null,
  participantId: string
): Promise<SubmissionResult> {
  const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || ''
  const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || ''
  const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || ''
  
  // Debug: log environment variables (without exposing full values)
  console.log('EmailJS Config Check:', {
    hasServiceId: !!SERVICE_ID,
    serviceIdPrefix: SERVICE_ID ? SERVICE_ID.substring(0, 10) + '...' : 'missing',
    hasTemplateId: !!TEMPLATE_ID,
    templateIdPrefix: TEMPLATE_ID ? TEMPLATE_ID.substring(0, 10) + '...' : 'missing',
    hasPublicKey: !!PUBLIC_KEY,
    publicKeyPrefix: PUBLIC_KEY ? PUBLIC_KEY.substring(0, 5) + '...' : 'missing',
  })
  
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    return {
      success: false,
      error: 'Email service not configured. Please set VITE_EMAILJS_* environment variables and restart the dev server.'
    }
  }
  
  try {
    // Dynamically import EmailJS (only load if configured)
    const emailjs = await import('@emailjs/browser')
    
    // Send CSV data in email body (simpler than attachments for free tier)
    // EmailJS free tier may not support attachments, so we send as text
    // Format CSV data with code block markers for better readability
    const formattedCsvData = `\`\`\`csv\n${csvData}\n\`\`\``
    
    const templateParams: Record<string, string> = {
      participant_id: participantId,
      timestamp: new Date().toISOString(),
      csv_data: formattedCsvData, // Send as formatted text in email body
      csv_filename: `experiment_${participantId}_${Date.now()}.csv`,
      message: `Experiment data for participant ${participantId}.\n\n📋 INSTRUCTIONS:\n1. Copy the CSV data from the "TRIAL DATA (CSV)" section below\n2. Paste it into a text editor (Notepad, TextEdit, etc.)\n3. Save the file with the name: ${`experiment_${participantId}_${Date.now()}.csv`}\n4. Make sure to save with .csv extension\n\n✅ DATA COMPLETENESS:\nThe CSV file contains ALL experiment data including:\n- Trial metrics (RT, accuracy, endpoint error, etc.)\n- Fitts' Law parameters (ID, A, W)\n- Display metadata (screen size, zoom, fullscreen status)\n- Modality settings (hand/gaze, UI mode, pressure, aging)\n- Participant and block information\n- All spatial coordinates and error measurements\n\nThe CSV contains the same complete data as the JSON export - just in a tabular format that's easier to analyze in Excel/R/Python.`,
    }
    
    // Add block data if available
    if (blockData) {
      const formattedBlockData = `\`\`\`csv\n${blockData}\n\`\`\``
      templateParams.block_data = formattedBlockData // Send as formatted text
      templateParams.block_filename = `blocks_${participantId}_${Date.now()}.csv`
    }
    
    console.log('Sending email via EmailJS:', {
      serviceId: SERVICE_ID,
      templateId: TEMPLATE_ID,
      participantId,
      csvDataLength: csvData.length,
      hasBlockData: !!blockData,
      templateParams: Object.keys(templateParams)
    })
    
    const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
    
    console.log('EmailJS response:', response)
    
    return {
      success: true,
      message: 'Data sent successfully via email'
    }
  } catch (error: any) {
    console.error('Email submission failed:', error)
    console.error('Error details:', {
      status: error?.status,
      text: error?.text,
      message: error?.message,
      serviceId: SERVICE_ID,
      templateId: TEMPLATE_ID
    })
    
    // Provide more helpful error messages
    let errorMessage = 'Email send failed'
    if (error?.status) {
      errorMessage = `EmailJS error ${error.status}: ${error.text || error.message || 'Unknown error'}`
    } else if (error?.message) {
      errorMessage = error.message
    }
    
    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * Submit data to server API endpoint
 */
export async function submitDataToServer(
  csvData: string,
  blockData: string | null,
  participantId: string
): Promise<SubmissionResult> {
  const API_URL = import.meta.env.VITE_API_URL || ''
  
  if (!API_URL) {
    return {
      success: false,
      error: 'API URL not configured. Please set VITE_API_URL environment variable.'
    }
  }
  
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
      const errorText = await response.text()
      throw new Error(`Server error: ${response.status} - ${errorText}`)
    }
    
    const result = await response.json()
    return { success: true, message: result.message || 'Data submitted successfully' }
  } catch (error) {
    console.error('Server submission failed:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}


/**
 * Get submission method based on environment variables
 */
export function getAvailableSubmissionMethod(): 'email' | 'server' | 'none' {
  const hasEmail = !!(import.meta.env.VITE_EMAILJS_SERVICE_ID && 
                     import.meta.env.VITE_EMAILJS_TEMPLATE_ID && 
                     import.meta.env.VITE_EMAILJS_PUBLIC_KEY)
  const hasServer = !!import.meta.env.VITE_API_URL
  
  if (hasEmail) return 'email'
  if (hasServer) return 'server'
  return 'none'
}

