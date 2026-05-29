import { test, expect } from '@playwright/test'

test('loads app and shows drawing toolbar', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('toolbar', { name: 'Drawing tools' })).toBeVisible()
  await expect(page.getByLabel('Drawing canvas')).toBeVisible()
})

test('stylus-only checkbox is present', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Stylus only')).toBeVisible()
})
