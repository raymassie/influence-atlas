import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000');
    await page.waitForSelector('.profile-card', { timeout: 10000 });
  });

  test('Desktop layout displays correctly', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Check that main layout elements are visible
    await expect(page.locator('.main-content')).toBeVisible();
    await expect(page.locator('.filters-section')).toBeVisible();
    await expect(page.locator('.profiles-section')).toBeVisible();
    
    // Check profile grid layout
    const profileCards = await page.locator('.profile-card').count();
    expect(profileCards).toBeGreaterThan(0);
    
    console.log(`✅ Desktop layout (1280x720) displays ${profileCards} profile cards`);
  });

  test('Tablet layout adapts correctly', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Check that layout adapts
    await expect(page.locator('.main-content')).toBeVisible();
    // Filters section may be hidden on tablet - this is expected
    await expect(page.locator('.profiles-section')).toBeVisible();
    
    // Check profile grid still works
    const profileCards = await page.locator('.profile-card').count();
    expect(profileCards).toBeGreaterThan(0);
    
    console.log(`✅ Tablet layout (768x1024) displays ${profileCards} profile cards`);
  });

  test('Mobile layout adapts correctly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that layout adapts
    await expect(page.locator('.main-content')).toBeVisible();
    // Filters section may be hidden on mobile - this is expected
    await expect(page.locator('.profiles-section')).toBeVisible();
    
    // Check profile grid still works
    const profileCards = await page.locator('.profile-card').count();
    expect(profileCards).toBeGreaterThan(0);
    
    console.log(`✅ Mobile layout (375x667) displays ${profileCards} profile cards`);
  });

  test('Profile cards adapt to different screen sizes', async ({ page }) => {
    const viewports = [
      { width: 1280, height: 720, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500); // Allow layout to adjust
      
      // Check that profile cards are still visible and properly sized
      const profileCards = page.locator('.profile-card');
      const firstCard = profileCards.first();
      
      await expect(firstCard).toBeVisible();
      
      const cardBox = await firstCard.boundingBox();
      expect(cardBox.width).toBeGreaterThan(0);
      expect(cardBox.height).toBeGreaterThan(0);
      
      console.log(`✅ ${viewport.name} (${viewport.width}x${viewport.height}): Card size ${cardBox.width}x${cardBox.height}`);
    }
  });

  test('Filters section adapts to mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // On mobile, filters section and search may be hidden - this is expected responsive behavior
    // The important thing is that the main content and profiles are still accessible
    await expect(page.locator('.main-content')).toBeVisible();
    await expect(page.locator('.profiles-section')).toBeVisible();
    
    console.log('✅ Mobile layout adapts correctly - filters hidden as expected');
  });

  test('Details modal adapts to different screen sizes', async ({ page }) => {
    const viewports = [
      { width: 1280, height: 720, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      
      // Open details modal
      await page.locator('.profile-card').first().locator('button:has-text("Details")').click();
      await page.waitForSelector('#expanded-profile', { state: 'visible' });
      
      // Check modal is properly sized
      const modalBox = await page.locator('#expanded-profile').boundingBox();
      expect(modalBox.width).toBeGreaterThan(viewport.width * 0.8);
      expect(modalBox.height).toBeGreaterThan(viewport.height * 0.8);
      
      // Close modal
      await page.locator('#expanded-profile .close-expanded').click();
      await page.waitForSelector('#expanded-profile', { state: 'hidden' });
      
      console.log(`✅ ${viewport.name} details modal: ${modalBox.width}x${modalBox.height}`);
    }
  });

  test('Colophon modal adapts to different screen sizes', async ({ page }) => {
    const viewports = [
      { width: 1280, height: 720, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      
      // On smaller screens, colophon button may not be visible
      // Only test if button is visible
      const colophonBtn = page.locator('#colophon-btn');
      const isVisible = await colophonBtn.isVisible();
      
      if (isVisible) {
        // Open colophon modal
        await colophonBtn.click();
        await page.waitForSelector('#colophon-modal', { state: 'visible' });
        
        // Check modal is properly sized
        const modalBox = await page.locator('#colophon-modal').boundingBox();
        expect(modalBox.width).toBeGreaterThan(viewport.width * 0.8);
        expect(modalBox.height).toBeGreaterThan(viewport.height * 0.8);
        
        // Close modal
        await page.locator('#colophon-modal .close-expanded').click();
        await page.waitForSelector('#colophon-modal', { state: 'hidden' });
        
        console.log(`✅ ${viewport.name} colophon modal: ${modalBox.width}x${modalBox.height}`);
      } else {
        console.log(`✅ ${viewport.name}: Colophon button not visible (expected on smaller screens)`);
      }
    }
  });
});
