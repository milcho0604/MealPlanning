/**
 * MealPlan 앱 기능 테스트 (Playwright)
 * 실행: node test-app.js
 */
const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:8082';
const TEST_EMAIL = 'golf06040606@gmail.com';
const TEST_PASSWORD = 'qwer1234!';

const results = [];

function log(status, feature, detail = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${status}] ${feature}${detail ? ` — ${detail}` : ''}`);
  results.push({ status, feature, detail });
}

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function ss(page, name) {
  await page.screenshot({ path: `docs/screenshot-${name}.png`, fullPage: false });
}

async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  try {
    // ────────────────────────────────
    // 1. 앱 로딩
    // ────────────────────────────────
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await wait(2000);
    log('PASS', '앱 로딩');

    // ────────────────────────────────
    // 2. 온보딩 건너뛰기 (있는 경우)
    // ────────────────────────────────
    const skip = await page.$('text=건너뛰기');
    if (skip) {
      await skip.click();
      await wait(2000);
      log('PASS', '온보딩 건너뛰기');
    }

    // ────────────────────────────────
    // 3. 로그인
    // ────────────────────────────────
    try {
      await page.fill('input[placeholder="이메일"]', TEST_EMAIL);
      await wait(300);
      await page.fill('input[placeholder="비밀번호"]', TEST_PASSWORD);
      await wait(300);
      await ss(page, '01-login-filled');
      await page.click('text=로그인');
      await wait(5000);
      log('PASS', '로그인');
    } catch (e) {
      log('FAIL', '로그인', e.message);
    }

    await ss(page, '02-after-login');

    // 홈 탭바 대기
    await wait(2000);
    const content = await page.content();
    const isMain = content.includes('오늘') || content.includes('주간') || content.includes('식단 없음');
    if (isMain) {
      log('PASS', '메인 화면 진입');
    } else {
      log('WARN', '메인 화면 미확인 (이메일 인증 필요할 수 있음)');
    }
    await ss(page, '03-main');

    // ────────────────────────────────
    // 4. 탭 네비게이션 (탭바 구조 파악)
    // ────────────────────────────────
    const tabBarInfo = await page.evaluate(() => {
      const allText = document.body.innerText;
      return allText.slice(0, 1000);
    });
    console.log('\n--- 현재 화면 텍스트 ---');
    console.log(tabBarInfo.slice(0, 300));
    console.log('---\n');

    // 탭 링크 구조 파악
    const tabLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href]')).map(a => ({
        href: a.getAttribute('href'),
        text: a.innerText.trim().slice(0, 30)
      }));
    });
    console.log('탭 링크:', JSON.stringify(tabLinks.slice(0, 10)));

    // ────────────────────────────────
    // 5. 각 탭 이동
    // ────────────────────────────────
    const tabRoutes = [
      { name: '캘린더', href: '/calendar', screenshot: '04-calendar' },
      { name: '냉장고', href: '/fridge', screenshot: '05-fridge' },
      { name: '쇼핑', href: '/shopping', screenshot: '06-shopping' },
      { name: '설정', href: '/settings', screenshot: '07-settings' },
    ];

    for (const tab of tabRoutes) {
      try {
        // href로 직접 이동 시도
        let clicked = false;

        // 1) a[href] 로 찾기
        const linkEl = await page.$(`a[href="${tab.href}"], a[href*="${tab.href}"]`);
        if (linkEl) { await linkEl.click(); clicked = true; }

        // 2) 텍스트로 찾기
        if (!clicked) {
          const textEl = await page.$(`text="${tab.name}"`);
          if (textEl) { await textEl.click(); clicked = true; }
        }

        // 3) 직접 URL 이동
        if (!clicked) {
          await page.goto(`${BASE_URL}${tab.href}`, { waitUntil: 'networkidle', timeout: 15000 });
          clicked = true;
        }

        await wait(2500);
        await ss(page, tab.screenshot);
        log('PASS', `${tab.name} 탭`);
      } catch (e) {
        log('FAIL', `${tab.name} 탭`, e.message);
      }
    }

    // ────────────────────────────────
    // 6. 홈 탭 복귀
    // ────────────────────────────────
    try {
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 15000 });
      await wait(2000);
      await ss(page, '08-home-return');
      log('PASS', '홈 탭 복귀');
    } catch (e) {
      log('FAIL', '홈 탭 복귀', e.message);
    }

    // ────────────────────────────────
    // 7. 설정 > 로그아웃 확인
    // ────────────────────────────────
    try {
      await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle', timeout: 15000 });
      await wait(2000);
      await ss(page, '09-settings-detail');
      const logoutBtn = await page.$('text=로그아웃');
      if (logoutBtn) {
        log('PASS', '설정 화면 로그아웃 버튼 확인');
      } else {
        log('WARN', '로그아웃 버튼 미발견');
      }
    } catch (e) {
      log('WARN', '설정/로그아웃', e.message);
    }

  } catch (e) {
    log('FAIL', '전체 테스트 오류', e.message);
  } finally {
    console.log('\n══════════════════════════════');
    console.log('       테스트 결과 요약');
    console.log('══════════════════════════════');
    const pass = results.filter(r => r.status === 'PASS').length;
    const fail = results.filter(r => r.status === 'FAIL').length;
    const warn = results.filter(r => r.status === 'WARN').length;
    console.log(`✅ PASS: ${pass}  ❌ FAIL: ${fail}  ⚠️  WARN: ${warn}`);
    console.log('\n상세:');
    results.forEach(r => {
      const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`  ${icon} ${r.feature}${r.detail ? ` — ${r.detail}` : ''}`);
    });
    if (consoleErrors.length > 0) {
      console.log('\n🔴 콘솔 에러:');
      [...new Set(consoleErrors)].slice(0, 5).forEach(e => console.log(' -', e));
    }
    await browser.close();
  }
}

run().catch(console.error);
