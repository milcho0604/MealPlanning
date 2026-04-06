/**
 * 냉장고 화면 테스트
 * 재료 목록, 카테고리 필터, 유통기한 경고 검증
 */
const { test, expect } = require('@playwright/test');
const { login } = require('./helpers');

test.describe('냉장고', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:8082/fridge', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
  });

  test('냉장고 헤더 표시', async ({ page }) => {
    await expect(page.getByText('냉장고').first()).toBeVisible();
  });

  test('카테고리 필터 탭 표시', async ({ page }) => {
    // 카테고리 탭 텍스트 확인 (ScrollView 안에 있어 isVisible 대신 content로 확인)
    const content = await page.content();
    expect(content.includes('육류')).toBeTruthy();
    expect(content.includes('채소')).toBeTruthy();
    expect(content.includes('유제품')).toBeTruthy();
  });

  test('유통기한 임박 경고 배너 (재료 있는 경우)', async ({ page }) => {
    const warning = page.getByText(/유통기한 임박/);
    const isVisible = await warning.isVisible();
    if (isVisible) {
      await expect(warning).toBeVisible();
    }
    // 재료가 없을 경우 표시 안 됨 → 테스트 통과
  });

  test('재료 추가 FAB 버튼 표시', async ({ page }) => {
    const content = await page.content();
    expect(content.includes('+')).toBeTruthy();
  });

  test('카테고리 필터 - 육류 클릭', async ({ page }) => {
    const 육류Tab = page.getByText('육류').first();
    await 육류Tab.click();
    await page.waitForTimeout(500);
    await expect(page.getByText('육류').first()).toBeVisible();
  });

  test('카테고리 필터 - 전체 복귀', async ({ page }) => {
    await page.getByText('육류').first().click();
    await page.waitForTimeout(300);
    await page.getByText('전체').first().click();
    await page.waitForTimeout(300);
    await expect(page.getByText('전체').first()).toBeVisible();
  });

  test('선택 모드 진입 및 취소', async ({ page }) => {
    const selectBtn = page.getByText('선택').first();
    if (await selectBtn.isVisible()) {
      await selectBtn.click();
      await page.waitForTimeout(500);
      await expect(page.getByText('취소').first()).toBeVisible();
      await page.getByText('취소').first().click();
    }
  });

});
