/**
 * CSV writer for telemetry trial data
 */

import type { TrialRow } from './collector'

/**
 * Convert trial rows to CSV format
 * @param trialRows - Array of trial rows to convert
 * @returns CSV string with headers
 */
export function toCSV(trialRows: TrialRow[]): string {
  if (trialRows.length === 0) {
    return ''
  }

  // Collect all unique keys from all rows
  const allKeys = new Set<string>()
  trialRows.forEach((row) => {
    Object.keys(row).forEach((key) => allKeys.add(key))
  })

  // Sort keys for consistent column order
  const headers = Array.from(allKeys).sort()

  // Build CSV rows
  const csvRows: string[] = []

  // Header row
  csvRows.push(headers.map(escapeCSV).join(','))

  // Data rows
  trialRows.forEach((row) => {
    const values = headers.map((key) => {
      const value = row[key]
      if (value === undefined || value === null) {
        return ''
      }
      return escapeCSV(String(value))
    })
    csvRows.push(values.join(','))
  })

  return csvRows.join('\n')
}

/**
 * Escape CSV field value
 * @param value - Value to escape
 * @returns Escaped value
 */
function escapeCSV(value: string): string {
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Download CSV file
 * @param filename - Filename for download
 * @param csv - CSV content string
 */
export function downloadCSV(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

