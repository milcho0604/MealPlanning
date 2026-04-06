/**
 * 쇼핑 리스트 테스트
 * 항목 추가, 체크/해제, 자동생성 버튼 검증
 */
const { test, expect } = require('@playwright/test');
const { login } = require('./helpers');

const TEST_ITEM = `테스트재료_${Date.now()}`;

test.describe('쇼핑 리스트', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.click('a[href="/shopping"]');
    await page.waitForTimeout(1500);
  });

  test('쇼핑 리스트 헤더 표시', async ({ page }) => {
    await expect(page.getByText('쇼핑 리스트')).toBeVisible();
  });

  test('식단 기반 자동 생성 버튼 표시', async ({ page }) => {
    await expect(page.getByText('이번 주 식단으로 쇼핑 목록 자동 생성')).toBeVisible();
  });

  test('항목 추가 입력창 표시', async ({ page }) => {
    await expect(page.locator('input[placeholder="항목 추가..."]')).toBeVisible();
  });

  test('새 항목 추가', async ({ page }) => {
    const input = page.locator('input[placeholder="항목 추가..."]');
    await input.fill(TEST_ITEM);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // 추가된 항목 확인
    await expect(page.getByText(TEST_ITEM)).toBeVisible();
  });

  test('항목 체크/해제', async ({ page }) => {
    // 첫 번째 항목의 체크박스 클릭
    const firstCheckbox = page.locator('input[type="checkbox"]').first()
      .or(page.locator('[role="checkbox"]').first());

    if (await firstCheckbox.isVisible()) {
      await firstCheckbox.click();
      await page.waitForTimeout(500);

      // 완료됨 섹션 표시 확인
      await expect(page.getByText('완료됨')).toBeVisible();

      // 다시 해제
      await firstCheckbox.click();
      await page.waitForTimeout(500);
    }
  });

  test('선택 모드 진입', async ({ page }) => {
    await page.getByText('선택').click();
    await page.waitForTimeout(500);
    await expect(page.getByText('취소')).toBeVisible();

    await page.getByText('취소').click();
  });

});
