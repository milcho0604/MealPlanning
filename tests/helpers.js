/**
 * 공통 헬퍼 함수 모음
 * 모든 테스트에서 공유하는 유틸리티
 */

const TEST_EMAIL = 'golf06040606@gmail.com';
const TEST_PASSWORD = 'qwer1234!';
const BASE_URL = 'http://localhost:8082';

/**
 * 로그인 처리 (온보딩 포함)
 * 모든 테스트의 beforeEach에서 호출
 */
async function login(page) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // 온보딩 화면이 있으면 건너뛰기
  const skip = page.getByText('건너뛰기');
  if (await skip.isVisible()) {
    await skip.click();
    await page.waitForTimeout(1500);
  }

  // 로그인
  await page.fill('input[placeholder="이메일"]', TEST_EMAIL);
  await page.fill('input[placeholder="비밀번호"]', TEST_PASSWORD);
  await page.getByText('로그인').click();

  // 홈 화면 진입 대기
  await page.waitForSelector('text=오늘의 식단', { timeout: 10000 });
}

/**
 * 특정 탭으로 이동 (직접 URL 이동으로 안정적 처리)
 */
async function goToTab(page, tabName) {
  await page.goto(`http://localhost:8082/${tabName}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
}

module.exports = { login, goToTab, TEST_EMAIL, TEST_PASSWORD, BASE_URL };
