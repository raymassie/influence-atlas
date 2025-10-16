import { test, expect } from '@playwright/test';

test.describe('Colophon Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000');
    await page.waitForSelector('.profile-card', { timeout: 10000 });
  });

  test('Colophon button exists and is clickable', async ({ page }) => {
    // Check that colophon button exists
    const colophonBtn = page.locator('#colophon-btn');
    await expect(colophonBtn).toBeVisible();
    
    // Check button text
    const buttonText = await colophonBtn.textContent();
    expect(buttonText).toContain('About This Project');
    
    console.log('✅ Colophon button exists and is visible');
  });

  test('Colophon modal opens when button is clicked', async ({ page }) => {
    // Click colophon button
    await page.locator('#colophon-btn').click();
    
    // Wait for modal to open
    await page.waitForSelector('#colophon-modal', { state: 'visible' });
    
    // Check modal is visible
    const modal = page.locator('#colophon-modal');
    await expect(modal).toBeVisible();
    
    console.log('✅ Colophon modal opens when button is clicked');
  });

  test('Colophon modal displays project information', async ({ page }) => {
    // Open colophon modal
    await page.locator('#colophon-btn').click();
    await page.waitForSelector('#colophon-modal', { state: 'visible' });
    
    // Check modal header
    const title = await page.locator('#colophon-modal .expanded-profile-title').textContent();
    const subtitle = await page.locator('#colophon-modal .expanded-profile-subtitle').textContent();
    
    expect(title).toBe('Colophon');
    expect(subtitle).toBe('About This Project');
    
    console.log(`✅ Colophon modal displays: "${title}" - "${subtitle}"`);
  });

  test('Colophon modal displays detailed content', async ({ page }) => {
    // Open colophon modal
    await page.locator('#colophon-btn').click();
    await page.waitForSelector('#colophon-modal', { state: 'visible' });
    
    // Wait for content to load
    await page.waitForSelector('#colophon-content', { timeout: 5000 });
    
    // Check that content is present
    const content = page.locator('#colophon-content');
    await expect(content).toBeVisible();
    
    // Check for key content elements
    const hasProjectInfo = await content.locator('text=JSON Context Profiles').isVisible();
    const hasFrameworkInfo = await content.locator('text=Behavioral Humanism').isVisible();
    const hasDataInfo = await content.locator('text=Data Integrity Process').isVisible();
    
    expect(hasProjectInfo).toBeTruthy();
    expect(hasFrameworkInfo).toBeTruthy();
    expect(hasDataInfo).toBeTruthy();
    
    console.log('✅ Colophon modal displays detailed project information');
  });

  test('Colophon modal has working close button', async ({ page }) => {
    // Open colophon modal
    await page.locator('#colophon-btn').click();
    await page.waitForSelector('#colophon-modal', { state: 'visible' });
    
    // Click close button
    await page.locator('#colophon-modal .close-expanded').click();
    
    // Wait for modal to close
    await page.waitForSelector('#colophon-modal', { state: 'hidden' });
    
    console.log('✅ Colophon modal close button works');
  });

  test('Colophon modal is centered and properly sized', async ({ page }) => {
    // Open colophon modal
    await page.locator('#colophon-btn').click();
    await page.waitForSelector('#colophon-modal', { state: 'visible' });
    
    // Check modal dimensions
    const modalBox = await page.locator('#colophon-modal').boundingBox();
    const viewportSize = page.viewportSize();
    
    // Modal should cover most of the viewport
    expect(modalBox.width).toBeGreaterThan(viewportSize.width * 0.9);
    expect(modalBox.height).toBeGreaterThan(viewportSize.height * 0.9);
    
    console.log(`✅ Colophon modal is properly sized: ${modalBox.width}x${modalBox.height} (viewport: ${viewportSize.width}x${viewportSize.height})`);
  });

  test('Colophon modal content is centered', async ({ page }) => {
    // Open colophon modal
    await page.locator('#colophon-btn').click();
    await page.waitForSelector('#colophon-modal', { state: 'visible' });
    
    // Wait for content to load
    await page.waitForSelector('#colophon-content', { timeout: 5000 });
    
    // Check that content card is centered
    const contentCard = page.locator('#colophon-modal .expanded-category-card');
    await expect(contentCard).toBeVisible();
    
    const cardBox = await contentCard.boundingBox();
    const viewportSize = page.viewportSize();
    
    // Card should be roughly centered (within 20% of center)
    const centerX = viewportSize.width / 2;
    const cardCenterX = cardBox.x + cardBox.width / 2;
    const xOffset = Math.abs(cardCenterX - centerX);
    
    expect(xOffset).toBeLessThan(viewportSize.width * 0.2);
    
    console.log(`✅ Colophon content is centered (offset: ${xOffset}px from center)`);
  });
});
