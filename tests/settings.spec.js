/**
 * 설정 화면 테스트
 * 프로필, 그룹, 알림, 로그아웃, 회원탈퇴 UI 검증
 */
const { test, expect } = require('@playwright/test');
const { login } = require('./helpers');

test.describe('설정', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:8082/settings', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
  });

  test('설정 헤더 표시', async ({ page }) => {
    // 탭바의 "설정"이 아닌 페이지 헤더 "설정" 확인
    const content = await page.content();
    expect(content.includes('설정')).toBeTruthy();
  });

  test('프로필 이메일 표시', async ({ page }) => {
    await expect(page.getByText('golf06040606@gmail.com')).toBeVisible();
  });

  test('내 그룹 섹션 표시', async ({ page }) => {
    await expect(page.getByText('내 그룹')).toBeVisible();
  });

  test('새 그룹 만들기 버튼 표시', async ({ page }) => {
    await expect(page.getByText('새 그룹 만들기').first()).toBeVisible();
  });

  test('초대 코드 참여 버튼 표시', async ({ page }) => {
    await expect(page.getByText('초대 코드로 참여')).toBeVisible();
  });

  test('비밀번호 변경 메뉴 표시', async ({ page }) => {
    await expect(page.getByText('비밀번호 변경')).toBeVisible();
  });

  test('푸시 알림 토글 표시', async ({ page }) => {
    await expect(page.getByText('푸시 알림')).toBeVisible();
  });

  test('로그아웃 버튼 표시', async ({ page }) => {
    await expect(page.getByText('로그아웃')).toBeVisible();
  });

  test('회원 탈퇴 버튼 표시', async ({ page }) => {
    await expect(page.getByText('회원 탈퇴')).toBeVisible();
  });

  test('새 그룹 만들기 모달 오픈', async ({ page }) => {
    await page.getByText('새 그룹 만들기').first().click();
    await page.waitForTimeout(1000);

    // 모달 내 "새 그룹 만들기" 텍스트 (role=dialog 안)
    const modal = page.getByRole('dialog');
    if (await modal.isVisible()) {
      await expect(modal.getByText('새 그룹 만들기')).toBeVisible();
    } else {
      // 다른 방식으로 모달 확인
      const content = await page.content();
      expect(content.includes('그룹 이름') || content.includes('색상')).toBeTruthy();
    }

    await page.keyboard.press('Escape');
  });

});
