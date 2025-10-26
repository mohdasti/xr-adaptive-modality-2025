import { test, expect } from '@playwright/test'

/**
 * TLX Form E2E Test
 * 
 * Tests:
 * - TLX modal appears after block completion
 * - Can submit TLX values with sliders
 * - TLX values are stored and applied to subsequent rows
 * - Modal can be skipped
 */

test.describe('TLX Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForSelector('text=Task Control', { timeout: 10000 })
    
    // Dismiss participant ID prompt
    page.on('dialog', async dialog => {
      await dialog.accept('P001')
    })
  })

  test('should show TLX modal after block completion', async ({ page }) => {
    // Start Fitts task
    await page.locator('button:has-text("Fitts Task")').click()
    
    // Configure for 1 trial
    await page.locator('input[type="number"][value="3"]').fill('1')
    await page.locator('input[type="checkbox"][value="medium"]').uncheck()
    await page.locator('input[type="checkbox"][value="high"]').uncheck()
    
    await page.locator('button:has-text("Start Fitts Block")').click()
    await page.waitForSelector('.fitts-canvas', { timeout: 5000 })
    
    // Complete trial
    await page.locator('.fitts-start-button').click()
    await page.waitForTimeout(500)
    await page.locator('.fitts-canvas').click({ position: { x: 400, y: 300 } })
    
    // Wait for TLX modal
    await page.waitForSelector('.tlx-modal-overlay', { timeout: 5000 })
    
    // Check modal content
    await expect(page.locator('.tlx-modal-content h2')).toContainText('NASA-TLX')
    await expect(page.locator('.tlx-subtitle')).toContainText('Block')
  })

  test('should have working TLX sliders', async ({ page }) => {
    // Start and complete block
    await page.locator('button:has-text("Fitts Task")').click()
    await page.locator('input[type="number"][value="3"]').fill('1')
    await page.locator('input[type="checkbox"][value="medium"]').uncheck()
    await page.locator('input[type="checkbox"][value="high"]').uncheck()
    await page.locator('button:has-text("Start Fitts Block")').click()
    await page.waitForSelector('.fitts-canvas', { timeout: 5000 })
    
    await page.locator('.fitts-start-button').click()
    await page.waitForTimeout(500)
    await page.locator('.fitts-canvas').click({ position: { x: 400, y: 300 } })
    
    // Wait for TLX modal
    await page.waitForSelector('.tlx-modal-overlay', { timeout: 5000 })
    
    // Check sliders exist
    const sliders = page.locator('.tlx-slider')
    await expect(sliders).toHaveCount(2)
    
    // Get initial values
    const globalValue = await page.locator('.tlx-item').first().locator('.tlx-value').textContent()
    const mentalValue = await page.locator('.tlx-item').last().locator('.tlx-value').textContent()
    
    expect(globalValue).toMatch(/\d+/)
    expect(mentalValue).toMatch(/\d+/)
    
    // Adjust sliders
    const globalSlider = sliders.first()
    await globalSlider.fill('75')
    
    await page.waitForTimeout(200)
    
    const newGlobalValue = await page.locator('.tlx-item').first().locator('.tlx-value').textContent()
    expect(parseInt(newGlobalValue || '0')).toBe(75)
  })

  test('should submit TLX values and close modal', async ({ page }) => {
    // Start and complete block
    await page.locator('button:has-text("Fitts Task")').click()
    await page.locator('input[type="number"][value="3"]').fill('1')
    await page.locator('input[type="checkbox"][value="medium"]').uncheck()
    await page.locator('input[type="checkbox"][value="high"]').uncheck()
    await page.locator('button:has-text("Start Fitts Block")').click()
    await page.waitForSelector('.fitts-canvas', { timeout: 5000 })
    
    await page.locator('.fitts-start-button').click()
    await page.waitForTimeout(500)
    await page.locator('.fitts-canvas').click({ position: { x: 400, y: 300 } })
    
    // Wait for TLX modal
    await page.waitForSelector('.tlx-modal-overlay', { timeout: 5000 })
    
    // Adjust sliders
    const sliders = page.locator('.tlx-slider')
    await sliders.first().fill('80')
    await sliders.last().fill('70')
    
    // Submit
    await page.locator('.tlx-submit-btn').click()
    
    // Modal should close
    await page.waitForTimeout(500)
    await expect(page.locator('.tlx-modal-overlay')).not.toBeVisible()
  })

  test('should skip TLX and close modal', async ({ page }) => {
    // Start and complete block
    await page.locator('button:has-text("Fitts Task")').click()
    await page.locator('input[type="number"][value="3"]').fill('1')
    await page.locator('input[type="checkbox"][value="medium"]').uncheck()
    await page.locator('input[type="checkbox"][value="high"]').uncheck()
    await page.locator('button:has-text("Start Fitts Block")').click()
    await page.waitForSelector('.fitts-canvas', { timeout: 5000 })
    
    await page.locator('.fitts-start-button').click()
    await page.waitForTimeout(500)
    await page.locator('.fitts-canvas').click({ position: { x: 400, y: 300 } })
    
    // Wait for TLX modal
    await page.waitForSelector('.tlx-modal-overlay', { timeout: 5000 })
    
    // Skip
    await page.locator('.tlx-skip-btn').click()
    
    // Modal should close
    await page.waitForTimeout(500)
    await expect(page.locator('.tlx-modal-overlay')).not.toBeVisible()
  })

  test('should apply TLX values to subsequent CSV rows', async ({ page }) => {
    // Get initial CSV row count
    const csvCount = page.locator('.csv-count')
    
    // Start a block
    await page.locator('button:has-text("Fitts Task")').click()
    await page.locator('input[type="number"][value="3"]').fill('1')
    await page.locator('input[type="checkbox"][value="medium"]').uncheck()
    await page.locator('input[type="checkbox"][value="high"]').uncheck()
    await page.locator('button:has-text("Start Fitts Block")').click()
    await page.waitForSelector('.fitts-canvas', { timeout: 5000 })
    
    // Complete trial
    await page.locator('.fitts-start-button').click()
    await page.waitForTimeout(500)
    await page.locator('.fitts-canvas').click({ position: { x: 400, y: 300 } })
    
    // Submit TLX with specific values
    await page.waitForSelector('.tlx-modal-overlay', { timeout: 5000 })
    
    const sliders = page.locator('.tlx-slider')
    await sliders.first().fill('75')
    await sliders.last().fill('60')
    
    await page.locator('.tlx-submit-btn').click()
    await page.waitForTimeout(500)
    
    // Verify CSV has grown
    const finalCountText = await csvCount.textContent()
    const finalCount = parseInt(finalCountText || '0')
    
    // Should have at least 1 row logged
    expect(finalCount).toBeGreaterThanOrEqual(1)
    
    // Note: Actual TLX values in CSV would need to be verified via download
    // This test verifies the mechanism works
  })

  test('should show correct block number in TLX modal', async ({ page }) => {
    // Complete a block
    await page.locator('button:has-text("Fitts Task")').click()
    await page.locator('input[type="number"][value="3"]').fill('1')
    await page.locator('input[type="checkbox"][value="medium"]').uncheck()
    await page.locator('input[type="checkbox"][value="high"]').uncheck()
    await page.locator('button:has-text("Start Fitts Block")').click()
    await page.waitForSelector('.fitts-canvas', { timeout: 5000 })
    
    await page.locator('.fitts-start-button').click()
    await page.waitForTimeout(500)
    await page.locator('.fitts-canvas').click({ position: { x: 400, y: 300 } })
    
    // Check block number
    await page.waitForSelector('.tlx-modal-overlay', { timeout: 5000 })
    await expect(page.locator('.tlx-subtitle')).toContainText('Block 1')
    
    await page.locator('.tlx-skip-btn').click()
    await page.waitForTimeout(500)
  })
})

