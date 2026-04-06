// Playwright 설정 파일
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  // 테스트 파일 위치
  testDir: './tests',

  // 각 테스트 타임아웃
  timeout: 30000,

  // 실패 시 재시도 횟수
  retries: 1,

  // 브라우저 설정
  use: {
    baseURL: 'http://localhost:8082',
    viewport: { width: 390, height: 844 }, // iPhone 14 Pro 사이즈
    headless: false,                        // true로 바꾸면 백그라운드 실행
    slowMo: 200,                            // 동작 간 딜레이 (디버깅용)
    screenshot: 'only-on-failure',          // 실패 시 스크린샷 자동 저장
    video: 'retain-on-failure',             // 실패 시 영상 저장
  },

  // 테스트 결과 리포트
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
});
