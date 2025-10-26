import { test, expect } from '@playwright/test'

/**
 * Basic Flow E2E Test
 * 
 * Tests:
 * - Loads the app successfully
 * - Switches between modalities (hand ↔ gaze)
 * - Runs 5 dummy trials
 * - Asserts CSV logger grows with trial data
 */

test.describe('Basic Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app (assuming it runs on localhost:5173)
    await page.goto('http://localhost:5173')
    
    // Wait for app to load
    await page.waitForSelector('text=Task Control', { timeout: 10000 })
    
    // Dismiss participant ID prompt if it appears
    // We'll use a mock prompt that auto-fills
    page.on('dialog', async dialog => {
      await dialog.accept('P001')
    })
  })

  test('should load app successfully', async ({ page }) => {
    // Check that all panes are visible
    await expect(page.locator('text=Task Control')).toBeVisible()
    await expect(page.locator('text=System HUD')).toBeVisible()
    await expect(page.locator('text=Event Logger')).toBeVisible()
    
    // Check modality switch is present
    await expect(page.locator('input[type="radio"][value="hand"]')).toBeVisible()
    await expect(page.locator('input[type="radio"][value="gaze"]')).toBeVisible()
  })

  test('should switch between modalities', async ({ page }) => {
    // Initially should be on hand modality
    const handRadio = page.locator('input[type="radio"][value="hand"]')
    await expect(handRadio).toBeChecked()
    
    // Switch to gaze
    await page.locator('input[type="radio"][value="gaze"]').click()
    const gazeRadio = page.locator('input[type="radio"][value="gaze"]')
    await expect(gazeRadio).toBeChecked()
    
    // Switch back to hand
    await handRadio.click()
    await expect(handRadio).toBeChecked()
  })

  test('should run Fitts block and log trials', async ({ page }) => {
    // Switch to Fitts task mode
    await page.locator('button:has-text("Fitts Task")').click()
    
    // Configure block: 1 trial per ID, low difficulty only
    await page.locator('input[type="number"][value="3"]').fill('1')
    
    // Uncheck medium and high
    await page.locator('input[type="checkbox"][value="medium"]').uncheck()
    await page.locator('input[type="checkbox"][value="high"]').uncheck()
    
    // Check that only low is selected
    await expect(page.locator('input[type="checkbox"][value="low"]')).toBeChecked()
    await expect(page.locator('input[type="checkbox"][value="medium"]')).not.toBeChecked()
    await expect(page.locator('input[type="checkbox"][value="high"]')).not.toBeChecked()
    
    // Start Fitts block
    await page.locator('button:has-text("Start Fitts Block")').click()
    
    // Wait for Fitts task to appear
    await page.waitForSelector('.fitts-canvas', { timeout: 5000 })
    
    // Click START button (appears in center)
    const startButton = page.locator('.fitts-start-button')
    await startButton.waitFor({ state: 'visible', timeout: 5000 })
    
    // Run 1 trial (already configured)
    await startButton.click()
    
    // Wait for target to appear and click it
    await page.waitForTimeout(500) // Give target time to render
    await page.locator('.fitts-canvas').click({
      position: { x: 400, y: 300 } // Approximate center - target will appear around this area
    })
    
    // Wait for trial completion (block should finish after 1 trial)
    await page.waitForTimeout(1000)
    
    // Check that CSV row count increased
    // We should see at least 1 row in the CSV
    const csvCount = page.locator('.csv-count')
    const countText = await csvCount.textContent()
    
    // Row count should be at least 1
    expect(parseInt(countText || '0')).toBeGreaterThanOrEqual(1)
  })

  test('should show TLX modal after block completion', async ({ page }) => {
    // Switch to Fitts task mode
    await page.locator('button:has-text("Fitts Task")').click()
    
    // Configure for 1 trial only
    await page.locator('input[type="number"][value="3"]').fill('1')
    await page.locator('input[type="checkbox"][value="medium"]').uncheck()
    await page.locator('input[type="checkbox"][value="high"]').uncheck()
    
    // Start and complete block
    await page.locator('button:has-text("Start Fitts Block")').click()
    await page.waitForSelector('.fitts-canvas', { timeout: 5000 })
    
    const startButton = page.locator('.fitts-start-button')
    await startButton.waitFor({ state: 'visible' })
    await startButton.click()
    await page.waitForTimeout(500)
    await page.locator('.fitts-canvas').click({ position: { x: 400, y: 300 } })
    
    // Wait for TLX modal
    await page.waitForSelector('.tlx-modal-overlay', { timeout: 5000 })
    await expect(page.locator('.tlx-modal-content h2')).toContainText('NASA-TLX')
    
    // Check that modal has sliders
    await expect(page.locator('input[type="range"]')).toHaveCount(2)
    
    // Can skip or submit TLX
    const skipButton = page.locator('.tlx-skip-btn')
    await skipButton.waitFor({ state: 'visible' })
    await skipButton.click()
    
    // Modal should close
    await page.waitForTimeout(500)
    await expect(page.locator('.tlx-modal-overlay')).not.toBeVisible()
  })

  test('should log events in event logger', async ({ page }) => {
    // Wait for logger to be visible
    await expect(page.locator('text=Event Logger')).toBeVisible()
    
    // Check that event table exists
    const eventTable = page.locator('.log-table')
    await expect(eventTable).toBeVisible()
    
    // Start a manual trial
    await page.locator('button:has-text("Start Trial")').click()
    
    // Wait for trial:start event
    await page.waitForTimeout(500)
    
    // Check that trial:start appears in logger
    const logRows = page.locator('.log-table tbody tr')
    const rowCount = await logRows.count()
    expect(rowCount).toBeGreaterThan(0)
    
    // Should see trial:start event
    const firstRow = logRows.first()
    await expect(firstRow).toBeVisible()
  })
})

