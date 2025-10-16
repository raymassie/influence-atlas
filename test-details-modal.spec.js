import { test, expect } from '@playwright/test';

test.describe('Profile Details Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000');
    await page.waitForSelector('.profile-card', { timeout: 10000 });
  });

  test('Details modal opens and displays profile information', async ({ page }) => {
    // Click Details button on first profile
    await page.locator('.profile-card').first().locator('button:has-text("Details")').click();
    
    // Wait for modal to open
    await page.waitForSelector('#expanded-profile', { state: 'visible' });
    
    // Check modal header
    const title = await page.locator('#expanded-profile .expanded-profile-title').textContent();
    const subtitle = await page.locator('#expanded-profile .expanded-profile-subtitle').textContent();
    
    expect(title).toBeTruthy();
    expect(subtitle).toBeTruthy();
    
    console.log(`✅ Details modal opened: "${title}" - "${subtitle}"`);
  });

  test('Details modal displays category cards', async ({ page }) => {
    // Open details modal
    await page.locator('.profile-card').first().locator('button:has-text("Details")').click();
    await page.waitForSelector('#expanded-profile', { state: 'visible' });
    
    // Wait for category cards to load
    await page.waitForSelector('.expanded-category-card', { timeout: 5000 });
    
    // Check that category cards are present
    const categoryCards = await page.locator('.expanded-category-card').count();
    expect(categoryCards).toBeGreaterThan(0);
    
    console.log(`✅ Details modal displays ${categoryCards} category cards`);
  });

  test('Details modal has working close button', async ({ page }) => {
    // Open details modal
    await page.locator('.profile-card').first().locator('button:has-text("Details")').click();
    await page.waitForSelector('#expanded-profile', { state: 'visible' });
    
    // Click close button
    await page.locator('#expanded-profile .close-expanded').click();
    
    // Wait for modal to close
    await page.waitForSelector('#expanded-profile', { state: 'hidden' });
    
    console.log('✅ Details modal close button works');
  });

  test('Details modal displays trait chips', async ({ page }) => {
    // Open details modal
    await page.locator('.profile-card').first().locator('button:has-text("Details")').click();
    await page.waitForSelector('#expanded-profile', { state: 'visible' });
    
    // Wait for trait chips to load
    await page.waitForSelector('.expanded-trait', { timeout: 5000 });
    
    // Check that trait chips are present
    const traitChips = await page.locator('.expanded-trait').count();
    expect(traitChips).toBeGreaterThan(0);
    
    console.log(`✅ Details modal displays ${traitChips} trait chips`);
  });

  test('Details modal has download and copy buttons', async ({ page }) => {
    // Open details modal
    await page.locator('.profile-card').first().locator('button:has-text("Details")').click();
    await page.waitForSelector('#expanded-profile', { state: 'visible' });
    
    // Check for download button
    const downloadBtn = page.locator('#expanded-download-btn');
    await expect(downloadBtn).toBeVisible();
    
    // Check for copy button
    const copyBtn = page.locator('#expanded-copy-btn');
    await expect(copyBtn).toBeVisible();
    
    console.log('✅ Details modal has download and copy buttons');
  });

  test('Details modal is full screen', async ({ page }) => {
    // Open details modal
    await page.locator('.profile-card').first().locator('button:has-text("Details")').click();
    await page.waitForSelector('#expanded-profile', { state: 'visible' });
    
    // Check modal dimensions
    const modalBox = await page.locator('#expanded-profile').boundingBox();
    const viewportSize = page.viewportSize();
    
    // Modal should cover most of the viewport
    expect(modalBox.width).toBeGreaterThan(viewportSize.width * 0.9);
    expect(modalBox.height).toBeGreaterThan(viewportSize.height * 0.9);
    
    console.log(`✅ Details modal is full screen: ${modalBox.width}x${modalBox.height} (viewport: ${viewportSize.width}x${viewportSize.height})`);
  });
});
