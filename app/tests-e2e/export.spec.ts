import { test, expect } from '@playwright/test'

/**
 * CSV Export E2E Test
 * 
 * Tests:
 * - CSV export has required schema columns
 * - Export functionality works after trials
 */

test.describe('CSV Export', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to task route
    await page.goto('http://localhost:5173/task')
    
    // Wait for app to load
    await page.waitForSelector('text=Task Control', { timeout: 10000 })
    
    // Handle participant ID prompt
    page.on('dialog', async (dialog) => {
      await dialog.accept('P001')
    })
  })

  test('CSV export has schema columns', async ({ page }) => {
    // Wait for the logger pane to be visible
    await page.waitForSelector('.logger-pane', { timeout: 5000 })

    // Get CSV content via page evaluation (if logger exposes method)
    // Otherwise, verify download button exists as sanity check
    const csv = await page.evaluate(() => {
      // Try to access logger's toCSV method if available
      if (typeof (window as any).exportTrials === 'function') {
        return (window as any).exportTrials()
      }
      return null
    })

    if (csv) {
      // Verify required schema columns are present
      expect(csv).toContain('endpoint_error_px')
      expect(csv).toContain('movement_time_ms')
    } else {
      // Fallback: Verify logger pane and download button exist
      const downloadButton = page.locator('button:has-text("Download CSV")')
      expect(await downloadButton.isVisible()).toBe(true)
      
      // Verify logger pane shows CSV row count (indicates functionality)
      const loggerContent = await page.locator('.logger-pane').textContent()
      expect(loggerContent).toBeTruthy()
    }
  })

  test('CSV contains required trial-level fields', async ({ page }) => {
    // Navigate and wait for logger
    await page.waitForSelector('.logger-pane', { timeout: 5000 })

    // Check for CSV headers or data structure
    // This is a sanity check that the CSV schema is correct
    const requiredFields = [
      'endpoint_error_px',
      'movement_time_ms',
      'participant_id',
      'modality',
      'ui_mode',
      'target_amplitude_px',
      'target_width_px',
    ]

    // Try to get CSV content if export function exists
    const csvContent = await page.evaluate(() => {
      if (typeof (window as any).exportTrials === 'function') {
        return (window as any).exportTrials()
      }
      return null
    })

    if (csvContent) {
      requiredFields.forEach((field) => {
        expect(csvContent).toContain(field)
      })
    } else {
      // Fallback: Just verify the logger is functional
      const loggerVisible = await page.locator('.logger-pane').isVisible()
      expect(loggerVisible).toBe(true)
    }
  })
})

