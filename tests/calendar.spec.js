/**
 * 캘린더 화면 테스트
 * 월간 캘린더, 리스트 뷰 전환, 월 이동 검증
 */
const { test, expect } = require('@playwright/test');
const { login } = require('./helpers');

test.describe('캘린더', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:8082/calendar', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
  });

  test('캘린더/리스트 전환 탭 표시', async ({ page }) => {
    // 캘린더 화면 상단의 뷰 전환 버튼
    const content = await page.content();
    expect(content.includes('리스트')).toBeTruthy();
  });

  test('월간 캘린더 헤더 (연도/월) 표시', async ({ page }) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    await expect(page.getByText(`${year}년 ${month}월`)).toBeVisible({ timeout: 5000 });
  });

  test('달력 날짜 숫자 표시', async ({ page }) => {
    const today = new Date().getDate();
    // 오늘 날짜가 달력에 표시되는지 확인
    const todayEl = page.getByText(String(today)).first();
    await expect(todayEl).toBeVisible();
  });

  test('이전 달 이동', async ({ page }) => {
    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    // 월 헤더 내 첫 번째 tabindex 버튼 = 이전 달 (Ionicons chevron-back)
    await page.evaluate(() => {
      const monthEl = [...document.querySelectorAll('div')].find(el =>
        el.innerText && el.innerText.trim().match(/^\d{4}년 \d+월$/)
      );
      const parent = monthEl?.parentElement;
      const btns = parent?.querySelectorAll('[tabindex="0"]');
      if (btns?.[0]) btns[0].click();
    });
    await page.waitForTimeout(800);

    await expect(page.getByText(`${prevYear}년 ${prevMonth}월`)).toBeVisible({ timeout: 5000 });
  });

  test('다음 달 이동', async ({ page }) => {
    const now = new Date();
    const nextMonth = now.getMonth() === 11 ? 1 : now.getMonth() + 2;
    const nextYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();

    // 월 헤더 내 마지막 tabindex 버튼 = 다음 달 (Ionicons chevron-forward)
    await page.evaluate(() => {
      const monthEl = [...document.querySelectorAll('div')].find(el =>
        el.innerText && el.innerText.trim().match(/^\d{4}년 \d+월$/)
      );
      const parent = monthEl?.parentElement;
      const btns = parent?.querySelectorAll('[tabindex="0"]');
      if (btns?.length) btns[btns.length - 1].click();
    });
    await page.waitForTimeout(800);

    await expect(page.getByText(`${nextYear}년 ${nextMonth}월`)).toBeVisible({ timeout: 5000 });
  });

  test('리스트 뷰 전환', async ({ page }) => {
    await page.getByText('리스트').first().click();
    await page.waitForTimeout(1500);

    // 리스트 뷰 전환 후 월간 캘린더 그리드 없어짐
    const year = new Date().getFullYear();
    const isCalendarVisible = await page.getByText(`${year}년`).isVisible().catch(() => false);
    expect(isCalendarVisible).toBeFalsy();
  });

  test('날짜 클릭 시 하단 식단 섹션 표시', async ({ page }) => {
    const today = new Date().getDate();

    await page.getByText(String(today)).first().click();
    await page.waitForTimeout(800);

    // "N월 N일 식단" 형태의 텍스트 확인
    const content = await page.content();
    const hasDateSection = content.match(/\d+월 \d+일 식단/);
    expect(hasDateSection).toBeTruthy();
  });

});
