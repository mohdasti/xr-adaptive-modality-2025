import { test, expect } from '@playwright/test'

test('has title', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/XR Adaptive Modality/)
})

test('renders three pane layout', async ({ page }) => {
  await page.goto('/')
  
  await expect(page.getByText('Task Control')).toBeVisible()
  await expect(page.getByText('System HUD')).toBeVisible()
  await expect(page.getByText('Event Logger')).toBeVisible()
})

test('trial workflow', async ({ page }) => {
  await page.goto('/')
  
  // Start a trial
  const startButton = page.getByRole('button', { name: 'Start Trial' })
  await startButton.click()
  
  // Verify trial started
  await expect(page.getByText(/Active Trial:/)).toBeVisible()
  await expect(startButton).toBeDisabled()
  
  // Check HUD updated
  await expect(page.getByText('Total Trials')).toBeVisible()
  
  // Check logger received event
  await expect(page.getByText('trial:start')).toBeVisible()
  
  // End the trial
  const endButton = page.getByRole('button', { name: 'End Trial' })
  await endButton.click()
  
  // Verify trial ended
  await expect(page.getByText('trial:end')).toBeVisible()
})

test('policy change workflow', async ({ page }) => {
  await page.goto('/')
  
  // Change policy
  const policySelect = page.locator('select')
  await policySelect.selectOption('adaptive')
  
  // Verify policy changed in UI
  await expect(page.getByText('Current Policy:')).toBeVisible()
  await expect(page.getByText('adaptive')).toBeVisible()
  
  // Check logger received event
  await expect(page.getByText('policy:change')).toBeVisible()
})

test('error event workflow', async ({ page }) => {
  await page.goto('/')
  
  // Start a trial first
  await page.getByRole('button', { name: 'Start Trial' }).click()
  
  // Trigger error
  await page.getByRole('button', { name: 'Trigger Error' }).click()
  
  // Check logger received error event
  await expect(page.getByText('trial:error')).toBeVisible()
  
  // Check error count in HUD
  await expect(page.getByText('Errors')).toBeVisible()
})

test('clear logs functionality', async ({ page }) => {
  await page.goto('/')
  
  // Generate some events
  await page.getByRole('button', { name: 'Start Trial' }).click()
  await page.getByRole('button', { name: 'End Trial' }).click()
  
  // Verify events are logged
  await expect(page.getByText('trial:start')).toBeVisible()
  
  // Clear logs
  await page.getByRole('button', { name: 'Clear Logs' }).click()
  
  // Verify logs are cleared
  await expect(page.getByText('No events logged yet')).toBeVisible()
})
