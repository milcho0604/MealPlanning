# MealPlan 배포 로드맵

## 전체 순서

```
1단계  소셜 로그인 키 발급 (Google, 카카오)
   ↓
2단계  환경 변수 정리 (.env)
   ↓
3단계  Render.com 백엔드 배포
   ↓
4단계  Expo EAS 빌드 설정
   ↓
5단계  App Store 심사 제출 (iOS)
   ↓
6단계  Google Play 심사 제출 (Android)
```

---

## 1단계 - 소셜 로그인 키 발급

### Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성 (또는 기존 프로젝트 선택)
3. **API 및 서비스 → 사용자 인증 정보 → OAuth 2.0 클라이언트 ID** 생성
   - **웹 애플리케이션** 유형 → `webClientId` (백엔드 검증용)
   - **iOS** 유형 → Bundle ID: `com.mealplan.app` → 다운로드 후 `ios/GoogleService-Info.plist` 배치
   - **Android** 유형 → 패키지명: `com.mealplan.app` → `google-services.json` 배치
4. iOS 클라이언트의 **리버스 클라이언트 ID** 확인 (`com.googleusercontent.apps.XXXX` 형식)

**설정 파일 업데이트:**
```json
// app.json
"iosUrlScheme": "com.googleusercontent.apps.XXXX"  // ← 리버스 클라이언트 ID
```

```env
# .env (앱)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=XXXX.apps.googleusercontent.com

# .env (백엔드)
GOOGLE_CLIENT_ID=XXXX.apps.googleusercontent.com
```

---

### 카카오 로그인

1. [Kakao Developers](https://developers.kakao.com) 접속 → 내 애플리케이션 추가
2. 앱 이름: `MealPlan` 설정
3. **앱 키** 탭에서 **네이티브 앱 키** 확인
4. **플랫폼** 탭 → iOS/Android 플랫폼 추가
   - iOS: Bundle ID `com.mealplan.app`
   - Android: 패키지명 `com.mealplan.app` + 키 해시 등록
5. **카카오 로그인** 활성화
6. **동의항목** 설정 (닉네임, 프로필 사진, 이메일)

**설정 파일 업데이트:**
```json
// app.json
"nativeAppKey": "XXXX"  // ← 네이티브 앱 키
```

---

### Apple Sign In

- `app.json`에 `"usesAppleSignIn": true` 이미 설정됨
- Apple Developer Program 등록 후 자동 활성화 (5단계에서 처리)
- 별도 키 발급 불필요

---

## 2단계 - 환경 변수 정리

### 백엔드 (.env)

```env
# DB
DATABASE_URL=postgresql://...  # Supabase > Settings > Database > Connection String

# Supabase
SUPABASE_URL=https://XXXX.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# JWT
JWT_SECRET=랜덤_긴_문자열_32자_이상
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=30d

# 소셜 로그인
GOOGLE_CLIENT_ID=XXXX.apps.googleusercontent.com

# 서버 설정
PORT=3300
NODE_ENV=production
```

### 앱 (.env or app.json extra)

```env
EXPO_PUBLIC_API_URL=https://your-app.onrender.com  # Render 배포 후 URL
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=XXXX.apps.googleusercontent.com
```

---

## 3단계 - Render.com 백엔드 배포

### 초기 설정

1. [Render.com](https://render.com) 가입 후 **New Web Service** 생성
2. GitHub 연결 → `MealPlanning` 리포 선택
3. 설정:
   ```
   Name:         mealplan-api
   Region:       Singapore (가장 가까움)
   Branch:       main
   Root Directory: packages/api
   Build Command:  npm install && npx prisma generate && npm run build
   Start Command:  node dist/main.js
   ```
4. **Environment Variables** 탭에서 위 2단계 백엔드 환경변수 전부 입력
5. **Deploy** 클릭

### 배포 후 확인

```bash
# 헬스체크
curl https://your-app.onrender.com/health

# 회원가입 테스트
curl -X POST https://your-app.onrender.com/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test1234","name":"테스트"}'
```

### 주의사항

- 무료 플랜은 **15분 미사용 시 슬립** → 첫 요청 30초 지연
- 유료 플랜($7/월)으로 업그레이드하면 해결
- `packages/api/package.json`의 `build` 스크립트 확인 필요:
  ```json
  "build": "nest build"
  ```

---

## 4단계 - Expo EAS 빌드 설정

### EAS CLI 설치 및 로그인

```bash
npm install -g eas-cli
eas login
eas init  # 프로젝트 연결
```

### eas.json 생성

`apps/mobile/eas.json`:
```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": false },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-app.onrender.com"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-app.onrender.com"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@apple.com",
        "ascAppId": "앱스토어_앱_ID",
        "appleTeamId": "팀_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-key.json",
        "track": "internal"
      }
    }
  }
}
```

### 빌드 실행

```bash
cd apps/mobile

# iOS 빌드 (App Store용)
eas build --platform ios --profile production

# Android 빌드 (Play Store용)
eas build --platform android --profile production

# 둘 다 동시에
eas build --platform all --profile production
```

> 무료 플랜: 월 30회 빌드 제한 / iOS 빌드 약 15~30분 소요

---

## 5단계 - App Store 심사 제출 (iOS)

### 사전 준비

- [ ] Apple Developer Program 가입 ($99/년): [developer.apple.com](https://developer.apple.com)
- [ ] App Store Connect에서 앱 생성
- [ ] 앱 아이콘 1024×1024px 준비
- [ ] 스크린샷 준비 (iPhone 6.5인치, 5.5인치)
- [ ] 앱 설명, 키워드, 카테고리 작성

### App Store Connect 설정

1. [appstoreconnect.apple.com](https://appstoreconnect.apple.com) 접속
2. **나의 앱 → +** → 새 앱 생성
   - 번들 ID: `com.mealplan.app`
   - SKU: `mealplan-001`
3. 앱 정보 입력 (이름, 설명, 스크린샷)
4. 가격: 무료

### 제출

```bash
# EAS로 자동 제출
eas submit --platform ios --profile production

# 또는 수동: App Store Connect에서 TestFlight 빌드 선택 후 심사 제출
```

### 심사 소요 시간

- 평균 **1~3일** (주말 제외)
- Apple Sign In 필수 포함 여부 검토됨 (이미 구현됨)

---

## 6단계 - Google Play 심사 제출 (Android)

### 사전 준비

- [ ] Google Play Console 가입 ($25 1회): [play.google.com/console](https://play.google.com/console)
- [ ] 앱 아이콘, 스크린샷 준비
- [ ] 개인정보처리방침 URL 준비 (필수)

### Play Console 설정

1. **앱 만들기** → 앱 이름: `MealPlan`
2. 앱 콘텐츠 설정 (대상 연령, 광고 여부 등)
3. 스토어 등록정보 입력

### 제출

```bash
# EAS로 자동 제출
eas submit --platform android --profile production
```

### 심사 소요 시간

- 내부 테스트: 즉시
- 프로덕션 출시: 평균 **3~7일**

---

## 비용 요약

| 항목 | 비용 | 주기 |
|------|------|------|
| Apple Developer Program | $99 | 연간 |
| Google Play Console | $25 | 1회 |
| Render.com (무료 플랜) | $0 | - |
| Supabase (무료 플랜) | $0 | - |
| Expo EAS (무료 플랜) | $0 | 월 30빌드 |
| **합계 (1년차)** | **$124** | |

---

## 체크리스트

### 배포 전 필수 확인

- [ ] `app.json` Google iosUrlScheme 교체
- [ ] `app.json` Kakao nativeAppKey 교체
- [ ] `.env` 환경변수 전부 설정
- [ ] Render.com 배포 완료 및 API 정상 동작 확인
- [ ] `EXPO_PUBLIC_API_URL` Render URL로 업데이트
- [ ] 실제 기기에서 소셜 로그인 동작 확인 (EAS development 빌드)
- [ ] 앱 아이콘, 스플래시 화면 최종 확인
- [ ] 개인정보처리방침 페이지 준비

### 앱스토어 제출 전

- [ ] iOS: App Store Connect 앱 생성 완료
- [ ] iOS: 스크린샷 업로드 완료
- [ ] Android: Play Console 앱 생성 완료
- [ ] Android: 개인정보처리방침 URL 등록
- [ ] EAS production 빌드 성공
