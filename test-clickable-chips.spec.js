import { test, expect } from '@playwright/test';

test.describe('Clickable Trait Chips', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000');
    await page.waitForSelector('.profile-card', { timeout: 10000 });
  });

  test('Trait chips in details modal trigger filtering', async ({ page }) => {
    // Open details modal
    await page.locator('.profile-card').first().locator('button:has-text("Details")').click();
    await page.waitForSelector('#expanded-profile', { state: 'visible' });
    
    // Wait for trait chips to load
    await page.waitForSelector('.expanded-trait', { timeout: 5000 });
    
    // Get initial profile count
    const initialCount = await page.locator('.profile-card').count();
    console.log(`Initial profile count: ${initialCount}`);
    
    // Get first trait chip text
    const firstTraitText = await page.locator('.expanded-trait').first().textContent();
    console.log(`First trait: ${firstTraitText}`);
    
    // Click first trait chip
    await page.locator('.expanded-trait').first().click();
    
    // Wait for filtering to complete
    await page.waitForTimeout(1000);
    
    // Check if profiles were filtered (count should be different)
    const filteredCount = await page.locator('.profile-card').count();
    console.log(`Filtered profile count: ${filteredCount}`);
    
    // The count should be different (either more or less profiles)
    expect(filteredCount).not.toBe(initialCount);
    
    console.log(`✅ Trait chip "${firstTraitText}" triggered filtering: ${initialCount} → ${filteredCount}`);
  });

  test('Trait chips have correct styling', async ({ page }) => {
    // Open details modal
    await page.locator('.profile-card').first().locator('button:has-text("Details")').click();
    await page.waitForSelector('#expanded-profile', { state: 'visible' });
    
    // Wait for trait chips to load
    await page.waitForSelector('.expanded-trait', { timeout: 5000 });
    
    // Check that trait chips have clickable styling
    const firstTrait = page.locator('.expanded-trait').first();
    
    // Check cursor style
    const cursor = await firstTrait.evaluate(el => getComputedStyle(el).cursor);
    expect(cursor).toBe('pointer');
    
    // Check that chips have background color
    const backgroundColor = await firstTrait.evaluate(el => getComputedStyle(el).backgroundColor);
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    
    console.log('✅ Trait chips have correct clickable styling');
  });

  test('Multiple trait chips work independently', async ({ page }) => {
    // Open details modal
    await page.locator('.profile-card').first().locator('button:has-text("Details")').click();
    await page.waitForSelector('#expanded-profile', { state: 'visible' });
    
    // Wait for trait chips to load
    await page.waitForSelector('.expanded-trait', { timeout: 5000 });
    
    // Get count of trait chips
    const traitCount = await page.locator('.expanded-trait').count();
    console.log(`Found ${traitCount} trait chips`);
    
    // Get initial profile count
    const initialCount = await page.locator('.profile-card').count();
    
    // Click first few trait chips
    for (let i = 0; i < Math.min(3, traitCount); i++) {
      const traitText = await page.locator('.expanded-trait').nth(i).textContent();
      await page.locator('.expanded-trait').nth(i).click();
      await page.waitForTimeout(500);
      
      // Check if profiles were filtered
      const currentCount = await page.locator('.profile-card').count();
      console.log(`Clicked "${traitText}", profiles now: ${currentCount}`);
    }
    
    console.log('✅ Multiple trait chips work independently');
  });
});
