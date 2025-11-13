/**
 * Export telemetry data at end of session
 */

import { toCSV, downloadCSV } from './csv'
import { getTrialRows, getRawStreams, getHealth } from './collector'

/**
 * Export session data (CSV + optional raw streams)
 * @param sessionId - Session identifier
 */
export async function exportSessionData(sessionId: string): Promise<void> {
  const trialRows = getTrialRows()
  const health = getHealth()

  // Always export CSV
  const csv = toCSV(trialRows)
  downloadCSV(`trials_${sessionId}.csv`, csv)

  // Export raw streams if enabled
  if (health.rawStreamsEnabled) {
    const streams = getRawStreams()

    // Export pointer stream
    if (streams.pointer && streams.pointer.length > 0) {
      await exportRawStream(
        `streams_pointer_${sessionId}.jsonl.gz`,
        streams.pointer.join('\n')
      )
    }

    // Export RAF stream
    if (streams.raf && streams.raf.length > 0) {
      await exportRawStream(
        `streams_raf_${sessionId}.jsonl.gz`,
        streams.raf.join('\n')
      )
    }

    // Export state stream (if implemented)
    if (streams.state && streams.state.length > 0) {
      const stateJsonl = streams.state.map((s: { t: number; snapshot: unknown }) => JSON.stringify(s)).join('\n')
      await exportRawStream(
        `streams_state_${sessionId}.jsonl.gz`,
        stateJsonl
      )
    }
  }
}

/**
 * Export raw stream as gzipped JSONL
 * @param filename - Filename for download
 * @param content - JSONL content string
 */
async function exportRawStream(filename: string, content: string): Promise<void> {
  // Use pako for gzip compression (already a dependency)
  let compressed: Blob
  let finalFilename = filename

  try {
    // Import pako (it's already in dependencies)
    const pako = await import('pako')
    const compressedData = pako.gzip(content, { level: 6 })
    compressed = new Blob([compressedData], { type: 'application/gzip' })
  } catch (error) {
    // Fallback: export as uncompressed JSONL
    console.warn('pako not available, exporting uncompressed JSONL:', error)
    compressed = new Blob([content], { type: 'application/jsonl' })
    finalFilename = filename.replace('.gz', '')
  }

  const url = URL.createObjectURL(compressed)
  const link = document.createElement('a')
  link.href = url
  link.download = finalFilename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

