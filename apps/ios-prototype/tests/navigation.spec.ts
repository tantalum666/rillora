import { expect, test } from "@playwright/test";

test("mobile information architecture keeps only three primary destinations", async ({ page }) => {
  await page.goto("/");

  const navigation = page.getByRole("navigation", { name: "Main navigation" });
  await expect(navigation.getByRole("button")).toHaveCount(3);
  await expect(navigation.getByRole("button", { name: "Overview" })).toBeVisible();
  await expect(navigation.getByRole("button", { name: "Matters" })).toBeVisible();
  await expect(navigation.getByRole("button", { name: "More" })).toBeVisible();

  await navigation.getByRole("button", { name: "More" }).click();
  await expect(page.getByRole("heading", { name: "More" })).toBeVisible();
  await expect(page.getByRole("button", { name: /My plan/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Trusted contact/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Official guides/ })).toBeVisible();
});
