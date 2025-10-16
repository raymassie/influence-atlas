import { test, expect } from '@playwright/test';

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000');
    await page.waitForSelector('.profile-card', { timeout: 10000 });
  });

  test('Search input filters profiles', async ({ page }) => {
    // Get initial profile count
    const initialCount = await page.locator('.profile-card').count();
    console.log(`Initial profile count: ${initialCount}`);
    
    // Type in search input
    await page.locator('#search-filter').fill('steve');
    await page.waitForTimeout(1000);
    
    // Check if profiles were filtered
    const filteredCount = await page.locator('.profile-card').count();
    console.log(`Filtered profile count: ${filteredCount}`);
    
    // Should have fewer profiles
    expect(filteredCount).toBeLessThan(initialCount);
    expect(filteredCount).toBeGreaterThan(0);
    
    console.log(`✅ Search "steve" filtered profiles: ${initialCount} → ${filteredCount}`);
  });

  test('Search is case insensitive', async ({ page }) => {
    // Get initial profile count
    const initialCount = await page.locator('.profile-card').count();
    
    // Search with lowercase
    await page.locator('#search-filter').fill('steve');
    await page.waitForTimeout(1000);
    const lowercaseCount = await page.locator('.profile-card').count();
    
    // Clear and search with uppercase
    await page.locator('#search-filter').fill('');
    await page.waitForTimeout(500);
    await page.locator('#search-filter').fill('STEVE');
    await page.waitForTimeout(1000);
    const uppercaseCount = await page.locator('.profile-card').count();
    
    // Should get same results
    expect(lowercaseCount).toBe(uppercaseCount);
    
    console.log(`✅ Case insensitive search works: ${lowercaseCount} profiles for both "steve" and "STEVE"`);
  });

  test('Empty search shows all profiles', async ({ page }) => {
    // Search for something first
    await page.locator('#search-filter').fill('steve');
    await page.waitForTimeout(1000);
    const filteredCount = await page.locator('.profile-card').count();
    
    // Clear search
    await page.locator('#search-filter').fill('');
    await page.waitForTimeout(1000);
    const clearedCount = await page.locator('.profile-card').count();
    
    // Should show all profiles again (265 total)
    expect(clearedCount).toBe(265);
    
    console.log(`✅ Empty search shows all profiles: ${filteredCount} → ${clearedCount}`);
  });

  test('Search works with partial matches', async ({ page }) => {
    // Search for partial name
    await page.locator('#search-filter').fill('jobs');
    await page.waitForTimeout(1000);
    const jobsCount = await page.locator('.profile-card').count();
    
    // Search for more specific
    await page.locator('#search-filter').fill('steve jobs');
    await page.waitForTimeout(1000);
    const steveJobsCount = await page.locator('.profile-card').count();
    
    // More specific search should have fewer or equal results
    expect(steveJobsCount).toBeLessThanOrEqual(jobsCount);
    
    console.log(`✅ Partial search works: "jobs" (${jobsCount}) vs "steve jobs" (${steveJobsCount})`);
  });

  test('Search placeholder text is correct', async ({ page }) => {
    const placeholder = await page.locator('#search-filter').getAttribute('placeholder');
    expect(placeholder).toContain('Search profiles');
    
    console.log(`✅ Search placeholder text: "${placeholder}"`);
  });
});
