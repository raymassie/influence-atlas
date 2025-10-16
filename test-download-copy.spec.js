import { test, expect } from '@playwright/test';

test.describe('Download and Copy Functions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000');
    await page.waitForSelector('.profile-card', { timeout: 10000 });
  });

  test('Download profile as JSON from details modal', async ({ page }) => {
    // Click Details button on first profile
    await page.locator('.profile-card').first().locator('button:has-text("Details")').click();
    await page.waitForSelector('#expanded-profile', { state: 'visible' });
    
    // Set up download promise
    const downloadPromise = page.waitForEvent('download');
    
    // Click Download button
    await page.locator('#expanded-download-btn').click();
    
    // Wait for download
    const download = await downloadPromise;
    
    // Check download properties
    expect(download.suggestedFilename()).toMatch(/\.json$/);
    
    console.log('✅ Download profile as JSON works');
  });

  test('Download profile card as JSON', async ({ page }) => {
    // Set up download promise
    const downloadPromise = page.waitForEvent('download');
    
    // Click download link on first profile card
    await page.locator('.profile-card').first().locator('a:has-text("Download")').click();
    
    // Wait for download
    const download = await downloadPromise;
    
    // Check download properties
    expect(download.suggestedFilename()).toMatch(/\.json$/);
    
    console.log('✅ Download profile card as JSON works');
  });
});