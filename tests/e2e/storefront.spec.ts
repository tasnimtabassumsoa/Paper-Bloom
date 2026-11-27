import { expect, test } from '@playwright/test';

test('browse, personalize in Bangla, cart persistence, coupon BLOOM10, and demo checkout', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByText('DEMO PREVIEW')).toBeVisible();

  // Navigate to Custom Studio
  await page.getByRole('link', { name: 'Custom Studio' }).first().click();
  await expect(page).toHaveURL(/\/shop\/custom-studio/);

  // Open personalized journal
  await page.getByRole('link', { name: /Personalized Linen-Grain Keepsake Journal/i }).first().click();
  await expect(page).toHaveURL(/\/product\/personalized-vegan-leather-journal/);

  // Personalize with Bangla + English text
  await page.getByLabel(/Name or Initials on Cover/i).fill('তাসনিম · Tasnim');
  await page.getByRole('button', { name: /Add to Bag/i }).first().click();

  // Go to bag and refresh to verify persistence
  await page.getByRole('link', { name: /Shopping bag/i }).click();
  await expect(page).toHaveURL(/\/cart/);
  await page.reload();
  await expect(page.getByText('তাসনিম · Tasnim')).toBeVisible();

  // Apply BLOOM10 coupon
  await page.getByLabel(/Coupon Code/i).fill('BLOOM10');
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByText('Discount (BLOOM10)')).toBeVisible();

  // Checkout
  await page.getByRole('link', { name: /Proceed to Checkout/i }).click();
  await expect(page).toHaveURL(/\/checkout/);
  await page.getByLabel(/Full Name/i).fill('Tasnim Ahmed');
  await page.getByLabel(/Bangladesh Mobile Number/i).fill('01712345678');
  await page.getByLabel(/Area \/ Thana/i).fill('Dhanmondi');
  await page.getByLabel(/Full Street \/ House \/ Flat Address/i).fill('House 14, Road 6');
  await page.getByRole('button', { name: /Place Demo Order/i }).click();

  await expect(page).toHaveURL(/\/order-confirmation\/PB-/);
  await expect(page.getByText(/Thank you, Tasnim Ahmed/i)).toBeVisible();
});
