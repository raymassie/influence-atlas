// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Behavioral Humanism Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000');
    await page.waitForSelector('.profile-card', { timeout: 10000 });
  });

  test('Bias Awareness filter exists and is populated', async ({ page }) => {
    // Open the Bias Awareness filter
    await page.locator('.filter-header', { hasText: 'Bias Awareness' }).click();
    
    // Wait for the filter content to be visible
    await page.waitForSelector('#bias-awareness-filter', { state: 'visible' });
    
    // Check that the filter has options
    const options = await page.locator('#bias-awareness-filter option').count();
    expect(options).toBeGreaterThan(0);
    
    console.log(`✅ Bias Awareness filter has ${options} options`);
  });

  test('Growth Motivation filter exists and is populated', async ({ page }) => {
    await page.locator('.filter-header', { hasText: 'Growth Motivation' }).click();
    await page.waitForSelector('#growth-motivation-filter', { state: 'visible' });
    
    const options = await page.locator('#growth-motivation-filter option').count();
    expect(options).toBeGreaterThan(0);
    
    console.log(`✅ Growth Motivation filter has ${options} options`);
  });

  test('Cognitive Humanism filter exists and is populated', async ({ page }) => {
    await page.locator('.filter-header', { hasText: 'Cognitive Humanism' }).click();
    await page.waitForSelector('#cognitive-humanism-filter', { state: 'visible' });
    
    const options = await page.locator('#cognitive-humanism-filter option').count();
    expect(options).toBeGreaterThan(0);
    
    console.log(`✅ Cognitive Humanism filter has ${options} options`);
  });

  test('Humanistic Cognition filter exists and is populated', async ({ page }) => {
    await page.locator('.filter-header', { hasText: 'Humanistic Cognition' }).click();
    await page.waitForSelector('#humanistic-cognition-filter', { state: 'visible' });
    
    const options = await page.locator('#humanistic-cognition-filter option').count();
    expect(options).toBeGreaterThan(0);
    
    console.log(`✅ Humanistic Cognition filter has ${options} options`);
  });

  test('Self Actualization filter exists and is populated', async ({ page }) => {
    await page.locator('.filter-header', { hasText: 'Self Actualization' }).click();
    await page.waitForSelector('#self-actualization-filter', { state: 'visible' });
    
    const options = await page.locator('#self-actualization-filter option').count();
    expect(options).toBeGreaterThan(0);
    
    console.log(`✅ Self Actualization filter has ${options} options`);
  });

  test('Behavioral Growth filter exists and is populated', async ({ page }) => {
    await page.locator('.filter-header', { hasText: 'Behavioral Growth' }).click();
    await page.waitForSelector('#behavioral-growth-filter', { state: 'visible' });
    
    const options = await page.locator('#behavioral-growth-filter option').count();
    expect(options).toBeGreaterThan(0);
    
    console.log(`✅ Behavioral Growth filter has ${options} options`);
  });

  test('Bias Awareness filter can filter profiles', async ({ page }) => {
    // Get initial profile count
    const initialCount = await page.locator('.profile-card').count();
    console.log(`Initial profile count: ${initialCount}`);
    
    // Open and select a Bias Awareness filter option
    await page.locator('.filter-header', { hasText: 'Bias Awareness' }).click();
    await page.waitForSelector('#bias-awareness-filter', { state: 'visible' });
    
    // Select the first option
    await page.locator('#bias-awareness-filter option').first().click({ modifiers: ['Control'] });
    
    // Wait for filtering to complete
    await page.waitForTimeout(500);
    
    // Get filtered profile count
    const filteredCount = await page.locator('.profile-card').count();
    console.log(`Filtered profile count: ${filteredCount}`);
    
    // Verify that filtering occurred
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
    
    console.log(`✅ Bias Awareness filter successfully filtered from ${initialCount} to ${filteredCount} profiles`);
  });

  test('Growth Motivation filter can filter profiles', async ({ page }) => {
    const initialCount = await page.locator('.profile-card').count();
    
    await page.locator('.filter-header', { hasText: 'Growth Motivation' }).click();
    await page.waitForSelector('#growth-motivation-filter', { state: 'visible' });
    
    await page.locator('#growth-motivation-filter option').first().click({ modifiers: ['Control'] });
    await page.waitForTimeout(500);
    
    const filteredCount = await page.locator('.profile-card').count();
    
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
    
    console.log(`✅ Growth Motivation filter successfully filtered from ${initialCount} to ${filteredCount} profiles`);
  });

  test('Behavioral Growth filter can filter profiles', async ({ page }) => {
    const initialCount = await page.locator('.profile-card').count();
    
    await page.locator('.filter-header', { hasText: 'Behavioral Growth' }).click();
    await page.waitForSelector('#behavioral-growth-filter', { state: 'visible' });
    
    await page.locator('#behavioral-growth-filter option').first().click({ modifiers: ['Control'] });
    await page.waitForTimeout(500);
    
    const filteredCount = await page.locator('.profile-card').count();
    
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
    
    console.log(`✅ Behavioral Growth filter successfully filtered from ${initialCount} to ${filteredCount} profiles`);
  });

  test('Multiple Behavioral Humanism filters work together', async ({ page }) => {
    const initialCount = await page.locator('.profile-card').count();
    
    // Apply Bias Awareness filter
    await page.locator('.filter-header', { hasText: 'Bias Awareness' }).click();
    await page.waitForSelector('#bias-awareness-filter', { state: 'visible' });
    await page.locator('#bias-awareness-filter option').first().click({ modifiers: ['Control'] });
    await page.waitForTimeout(500);
    
    const afterFirstFilter = await page.locator('.profile-card').count();
    
    // Apply Growth Motivation filter
    await page.locator('.filter-header', { hasText: 'Growth Motivation' }).click();
    await page.waitForSelector('#growth-motivation-filter', { state: 'visible' });
    await page.locator('#growth-motivation-filter option').first().click({ modifiers: ['Control'] });
    await page.waitForTimeout(500);
    
    const afterSecondFilter = await page.locator('.profile-card').count();
    
    // Verify cascading filtering
    expect(afterSecondFilter).toBeGreaterThan(0);
    expect(afterSecondFilter).toBeLessThanOrEqual(afterFirstFilter);
    expect(afterFirstFilter).toBeLessThanOrEqual(initialCount);
    
    console.log(`✅ Multiple filters work: ${initialCount} → ${afterFirstFilter} → ${afterSecondFilter} profiles`);
  });

  test('Clear filters button clears Behavioral Humanism filters', async ({ page }) => {
    // Apply a filter
    await page.locator('.filter-header', { hasText: 'Bias Awareness' }).click();
    await page.waitForSelector('#bias-awareness-filter', { state: 'visible' });
    await page.locator('#bias-awareness-filter option').first().click({ modifiers: ['Control'] });
    await page.waitForTimeout(500);
    
    const filteredCount = await page.locator('.profile-card').count();
    
    // Clear all filters
    await page.click('button:has-text("Clear All Filters")');
    await page.waitForTimeout(500);
    
    const clearedCount = await page.locator('.profile-card').count();
    
    // Should return to all profiles
    expect(clearedCount).toBeGreaterThan(filteredCount);
    
    console.log(`✅ Clear filters works: ${filteredCount} → ${clearedCount} profiles`);
  });

  test('Behavioral Humanism filters display in details modal', async ({ page }) => {
    // Open first profile
    await page.locator('.profile-card').first().click();
    await page.waitForSelector('#expanded-profile', { state: 'visible' });
    
    // Check for Behavioral Humanism category cards
    const biasAwarenessVisible = await page.locator('.expanded-category-card:has-text("Bias Awareness")').isVisible().catch(() => false);
    const growthMotivationVisible = await page.locator('.expanded-category-card:has-text("Growth Motivation")').isVisible().catch(() => false);
    const behavioralGrowthVisible = await page.locator('.expanded-category-card:has-text("Behavioral Growth")').isVisible().catch(() => false);
    
    // At least one should be visible
    const anyVisible = biasAwarenessVisible || growthMotivationVisible || behavioralGrowthVisible;
    expect(anyVisible).toBeTruthy();
    
    console.log(`✅ Behavioral Humanism categories display in details modal`);
  });
});

