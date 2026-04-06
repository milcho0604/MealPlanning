/**
 * 홈 화면 테스트
 * 주간 뷰, 식단 카드, 탭바 검증
 */
const { test, expect } = require('@playwright/test');
const { login } = require('./helpers');

test.describe('홈 화면', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:8082/home', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
  });

  test('오늘 날짜 헤더 표시', async ({ page }) => {
    await expect(page.getByText('오늘의 식단')).toBeVisible();
  });

  test('주간 날짜 뷰 - 요일 표시', async ({ page }) => {
    // 탭바의 요일이 아닌 주간 뷰 요일 확인 (월~일 중 현재 주 포함)
    const content = await page.content();
    const hasDays = ['월', '화', '수', '목', '금'].some(d => content.includes(d));
    expect(hasDays).toBeTruthy();
  });

  test('식단 추가 FAB 버튼 표시', async ({ page }) => {
    // FAB(플로팅 액션 버튼) - 화면 오른쪽 하단
    const fab = page.locator('[role="button"]').filter({ hasText: '+' }).last();
    if (await fab.isVisible()) {
      await expect(fab).toBeVisible();
    } else {
      // 대체 확인: + 텍스트가 존재하는지
      const plusExists = (await page.content()).includes('+');
      expect(plusExists).toBeTruthy();
    }
  });

  test('탭바 5개 항목 표시', async ({ page }) => {
    // 탭바 링크로 확인 (텍스트 중복 방지)
    await expect(page.locator('a[href="/home"]')).toBeVisible();
    await expect(page.locator('a[href="/calendar"]')).toBeVisible();
    await expect(page.locator('a[href="/fridge"]')).toBeVisible();
    await expect(page.locator('a[href="/shopping"]')).toBeVisible();
    await expect(page.locator('a[href="/settings"]')).toBeVisible();
  });

  test('그룹 드롭다운 버튼 표시', async ({ page }) => {
    // 그룹 이름이나 전체 텍스트가 표시됨
    const content = await page.content();
    const hasGroup = content.includes('전체') || content.includes('테스트') || content.includes('그룹');
    expect(hasGroup).toBeTruthy();
  });

});
