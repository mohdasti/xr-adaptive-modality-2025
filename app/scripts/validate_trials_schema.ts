#!/usr/bin/env node
/**
 * Validate trial CSV schema
 * 
 * Usage: tsx scripts/validate_trials_schema.ts <csv_file1> [csv_file2] ...
 */

import * as fs from 'fs'
import * as path from 'path'

interface ValidationError {
  file: string
  row: number
  column: string
  message: string
}

const errors: ValidationError[] = []

/**
 * Parse CSV file
 */
function parseCSV(filePath: string): { headers: string[]; rows: Record<string, string>[] } {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n').filter((line) => line.trim())
  
  if (lines.length === 0) {
    throw new Error(`Empty CSV file: ${filePath}`)
  }

  // Parse headers
  const headers = parseCSVLine(lines[0])
  
  // Parse rows
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row: Record<string, string> = {}
    headers.forEach((header, idx) => {
      row[header] = values[idx] || ''
    })
    rows.push(row)
  }

  return { headers, rows }
}

/**
 * Parse a single CSV line (handles quoted fields)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  // Add last field
  result.push(current)
  
  return result
}

/**
 * Validate required columns
 */
function validateRequiredColumns(headers: string[], file: string): void {
  const required = [
    'trial_id',
    'session_id',
    'participant_id',
    'timestamp_start',
    'timestamp_end',
    'rt_ms',
    'correct',
    'endpoint_x',
    'endpoint_y',
    'target_center_x',
    'target_center_y',
    'endpoint_error_px',
  ]

  for (const col of required) {
    if (!headers.includes(col)) {
      errors.push({
        file,
        row: 0,
        column: col,
        message: `Missing required column: ${col}`,
      })
    }
  }
}

/**
 * Validate system fields
 */
function validateSystemFields(row: Record<string, string>, rowNum: number, file: string): void {
  // zoom_pct must be 100
  if (row.zoom_pct !== undefined && row.zoom_pct !== '') {
    const zoom = parseFloat(row.zoom_pct)
    if (isNaN(zoom) || zoom !== 100) {
      errors.push({
        file,
        row: rowNum,
        column: 'zoom_pct',
        message: `zoom_pct must be 100, got ${row.zoom_pct}`,
      })
    }
  }

  // fullscreen must be true
  if (row.fullscreen !== undefined && row.fullscreen !== '') {
    const fullscreen = row.fullscreen.toLowerCase()
    if (fullscreen !== 'true' && fullscreen !== '1') {
      errors.push({
        file,
        row: rowNum,
        column: 'fullscreen',
        message: `fullscreen must be true, got ${row.fullscreen}`,
      })
    }
  }

  // dpr must be > 0
  if (row.dpr !== undefined && row.dpr !== '') {
    const dpr = parseFloat(row.dpr)
    if (isNaN(dpr) || dpr <= 0) {
      errors.push({
        file,
        row: rowNum,
        column: 'dpr',
        message: `dpr must be > 0, got ${row.dpr}`,
      })
    }
  }
}

/**
 * Validate timing fields are monotonic
 */
function validateTimingMonotonic(row: Record<string, string>, rowNum: number, file: string): void {
  const timestamps: { name: string; value: number }[] = []

  if (row.stim_onset_ts && row.stim_onset_ts !== '') {
    const ts = parseFloat(row.stim_onset_ts)
    if (!isNaN(ts)) timestamps.push({ name: 'stim_onset_ts', value: ts })
  }

  if (row.move_onset_ts && row.move_onset_ts !== '') {
    const ts = parseFloat(row.move_onset_ts)
    if (!isNaN(ts)) timestamps.push({ name: 'move_onset_ts', value: ts })
  }

  if (row.target_entry_ts && row.target_entry_ts !== '') {
    const ts = parseFloat(row.target_entry_ts)
    if (!isNaN(ts)) timestamps.push({ name: 'target_entry_ts', value: ts })
  }

  if (row.select_ts && row.select_ts !== '') {
    const ts = parseFloat(row.select_ts)
    if (!isNaN(ts)) timestamps.push({ name: 'select_ts', value: ts })
  }

  // Check monotonicity: stim <= move_onset <= target_entry <= select
  for (let i = 1; i < timestamps.length; i++) {
    if (timestamps[i].value < timestamps[i - 1].value) {
      errors.push({
        file,
        row: rowNum,
        column: timestamps[i].name,
        message: `Timing not monotonic: ${timestamps[i - 1].name} (${timestamps[i - 1].value}) > ${timestamps[i].name} (${timestamps[i].value})`,
      })
    }
  }
}

/**
 * Validate numeric types
 */
function validateNumericType(value: string, column: string, rowNum: number, file: string): boolean {
  if (value === '' || value === undefined) return true // Allow empty

  const num = parseFloat(value)
  if (isNaN(num)) {
    errors.push({
      file,
      row: rowNum,
      column,
      message: `Expected numeric value, got: ${value}`,
    })
    return false
  }
  return true
}

/**
 * Validate boolean type
 */
function validateBooleanType(value: string, column: string, rowNum: number, file: string): boolean {
  if (value === '' || value === undefined) return true // Allow empty

  const lower = value.toLowerCase()
  if (lower !== 'true' && lower !== 'false' && lower !== '1' && lower !== '0') {
    errors.push({
      file,
      row: rowNum,
      column,
      message: `Expected boolean value, got: ${value}`,
    })
    return false
  }
  return true
}

/**
 * Validate path efficiency (if present)
 * Path efficiency = straight-line distance / path length, should be in (0, 1]
 */
function validatePathEfficiency(row: Record<string, string>, rowNum: number, file: string): void {
  // Check if we have both path_length_px and enough info to compute straight-line
  if (row.path_length_px && row.path_length_px !== '' && row.A && row.A !== '') {
    const pathLen = parseFloat(row.path_length_px)
    const targetA = parseFloat(row.A)

    if (!isNaN(pathLen) && !isNaN(targetA) && pathLen > 0 && targetA > 0) {
      // Path efficiency: straight-line distance / path length
      // Straight-line distance is approximately the amplitude A
      // (assuming minimal endpoint error relative to A)
      const straightLine = targetA
      const efficiency = straightLine / pathLen

      if (efficiency <= 0 || efficiency > 1) {
        errors.push({
          file,
          row: rowNum,
          column: 'path_length_px',
          message: `Path efficiency out of range (0,1]: ${efficiency.toFixed(3)} (straight=${straightLine.toFixed(1)}, path=${pathLen.toFixed(1)})`,
        })
      }
    }
  }
}

/**
 * Validate throughput is finite (if present)
 */
function validateThroughput(row: Record<string, string>, rowNum: number, file: string): void {
  // Check for throughput-related fields
  const tpFields = ['power_8_12_hz', 'power_12_20_hz']
  
  for (const field of tpFields) {
    if (row[field] && row[field] !== '') {
      const value = parseFloat(row[field])
      if (!isNaN(value) && !isFinite(value)) {
        errors.push({
          file,
          row: rowNum,
          column: field,
          message: `Throughput field must be finite, got: ${row[field]}`,
        })
      }
    }
  }
}

/**
 * Validate a single CSV file
 */
function validateFile(filePath: string): void {
  console.log(`Validating: ${filePath}`)
  
  try {
    const { headers, rows } = parseCSV(filePath)
    
    // Validate required columns
    validateRequiredColumns(headers, filePath)
    
    // Validate each row
    rows.forEach((row, idx) => {
      const rowNum = idx + 2 // +2 because row 1 is header, rows are 1-indexed
      
      // Validate system fields
      validateSystemFields(row, rowNum, filePath)
      
      // Validate timing monotonicity
      validateTimingMonotonic(row, rowNum, filePath)
      
      // Validate numeric types for key fields
      if (row.rt_ms) validateNumericType(row.rt_ms, 'rt_ms', rowNum, filePath)
      if (row.endpoint_x) validateNumericType(row.endpoint_x, 'endpoint_x', rowNum, filePath)
      if (row.endpoint_y) validateNumericType(row.endpoint_y, 'endpoint_y', rowNum, filePath)
      if (row.endpoint_error_px) validateNumericType(row.endpoint_error_px, 'endpoint_error_px', rowNum, filePath)
      
      // Validate boolean type
      if (row.correct !== undefined) validateBooleanType(row.correct, 'correct', rowNum, filePath)
      
      // Validate path efficiency
      validatePathEfficiency(row, rowNum, filePath)
      
      // Validate throughput
      validateThroughput(row, rowNum, filePath)
    })
    
    console.log(`  ✓ ${rows.length} rows validated`)
  } catch (error) {
    errors.push({
      file: filePath,
      row: 0,
      column: '',
      message: `Error reading file: ${error instanceof Error ? error.message : String(error)}`,
    })
  }
}

/**
 * Main
 */
function main(): void {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.error('Usage: tsx scripts/validate_trials_schema.ts <csv_file1> [csv_file2] ...')
    process.exit(1)
  }

  // Validate each file
  args.forEach((filePath) => {
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`)
      errors.push({
        file: filePath,
        row: 0,
        column: '',
        message: 'File not found',
      })
      return
    }
    
    validateFile(filePath)
  })

  // Report results
  console.log('\n=== Validation Results ===')
  
  if (errors.length === 0) {
    console.log('✓ All validations passed!')
    process.exit(0)
  } else {
    console.error(`✗ Found ${errors.length} error(s):\n`)
    
    errors.forEach((error) => {
      console.error(`  ${error.file}:${error.row} [${error.column}] ${error.message}`)
    })
    
    process.exit(1)
  }
}

main()

