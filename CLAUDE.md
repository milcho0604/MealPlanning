# CLAUDE.md — MealPlan 프로젝트 가이드

Claude Code가 이 프로젝트를 작업할 때 참고하는 설정 및 규칙 파일입니다.

---

## 프로젝트 개요

개인/가족 식단을 미리 계획하고 공유하는 모바일 앱.

- **앱 이름:** MealPlan
- **번들 ID / 패키지명:** `com.mealplan.app`
- **Expo 프로젝트:** `@milcho0604/mealplan` (ID: `48cd9f38-3e0e-46ea-a8fa-57e36ff5abed`)

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Mobile | Expo (React Native), Expo Router |
| Backend | NestJS v11 (TypeScript) |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma v5 |
| 상태관리 | Zustand + React Query v5 |
| 모노레포 | Turborepo + npm workspaces |
| 이메일 | Nodemailer + Gmail SMTP |
| 빌드 | Expo EAS |
| 배포 | Render.com (백엔드) |

---

## 프로젝트 구조

```
MealPlanning/
├── apps/
│   └── mobile/          # Expo React Native 앱
│       ├── app/         # Expo Router 화면 (파일 기반 라우팅)
│       ├── src/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── services/
│       │   ├── stores/
│       │   ├── utils/
│       │   └── constants/
│       └── assets/
├── packages/
│   ├── api/             # NestJS 백엔드
│   │   ├── src/
│   │   │   ├── modules/ # auth, meal-plans, ingredients, groups, shopping 등
│   │   │   ├── common/  # guards, decorators, filters
│   │   │   └── prisma/
│   │   └── prisma/
│   └── shared/          # 공유 타입/상수 (모바일 + API 공통)
└── .github/
    └── workflows/
        └── keep-alive.yml  # Render.com 슬립 방지 핑 (4분마다)
```

---

## 코드 스타일 규칙

- **파일명:** 역할이 명확히 드러나도록 (`auth.service.ts`, `use-sign-in.hook.ts` 등)
- **파일 분리:** 관심사 분리 원칙 철저히 적용 (controller / service / dto / guard / hook 등)
- **주석:** 코드의 "왜"와 "무엇을" 설명하는 수준으로 충분히 작성
- **모든 함수/클래스/모듈**에 역할 설명 주석 포함
- 질문 없이 자율적으로 진행해도 됨 (전권 위임)

---

## 커밋 메시지 규칙

- **반드시 한국어로 작성**
- type prefix는 영어 유지 (`feat`, `fix`, `chore`, `docs`, `refactor` 등)
- 예시: `feat: 이메일 인증 기능 추가`, `fix: 카카오 SDK Maven 저장소 추가`

---

## 환경변수

### 루트 `.env` (API 서버용)
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL            # Supabase Connection Pooler URL (포트 6543)
JWT_SECRET
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=30d
API_PORT=3300
GOOGLE_CLIENT_ID
MAIL_USER=hello.mealplan@gmail.com
MAIL_PASS               # Gmail 앱 비밀번호
APP_URL                 # 배포 URL
```

### `apps/mobile/.env` (Expo 앱용)
```
EXPO_PUBLIC_API_URL=https://mealplan-api-dtx0.onrender.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
```

---

## 소셜 로그인 설정

| 제공자 | 클라이언트 ID / 키 |
|--------|-------------------|
| Google 웹 | `88190697802-1c32584i9f2g7v8d5j4nimk8sorsd8qg.apps.googleusercontent.com` |
| Google iOS | `88190697802-1ukeekh66h57e8e62q79lec1no9oscjp.apps.googleusercontent.com` |
| Google Android | `88190697802-un49mjuvlq36mmkfjcksqfj3q25kieti.apps.googleusercontent.com` (SHA-1 임시값, EAS 빌드 후 교체 필요) |
| 카카오 네이티브 앱 키 | `e853e6f283f75a8256546445c2add6d1` |
| Apple Sign In | `usesAppleSignIn: true` (app.json) |

---

## 배포 정보

| 항목 | 값 |
|------|-----|
| 백엔드 URL | `https://mealplan-api-dtx0.onrender.com` |
| Render Service ID | `srv-d718ilv5gffc73fka79g` |
| GitHub 레포 | `https://github.com/milcho0604/MealPlanning` |
| Expo 프로젝트 | `https://expo.dev/accounts/milcho0604/projects/mealplan` |
| 이메일 발신 계정 | `hello.mealplan@gmail.com` |

### Render.com 빌드 설정
- **Build Command:** `npm install --include=dev && npm run build -w packages/shared && npm run build -w packages/api`
- **Start Command:** `node packages/api/dist/main.js`
- **Root Directory:** (비워둠)

---

## 인증 구조

- Supabase Auth 제거 → 자체 bcrypt + JWT 인증으로 전환
- Access Token: 1시간, Refresh Token: 30일
- 이메일 인증: 회원가입 시 인증 메일 발송 (Nodemailer + Gmail SMTP)
- 회원 탈퇴: Soft Delete (`status_yn=N`, `deleted_at`) → 90일 후 하드 삭제 (Cron)
- 탈퇴 후 90일 이내 휴면 해제(reactivate) 가능

---

## 개발 서버 실행

```bash
# API 서버 (로컬)
cd packages/api && npm run dev

# 모바일 앱
cd apps/mobile && npx expo start

# 웹 브라우저에서 테스트
cd apps/mobile && npx expo start --web
```

---

## 남은 배포 작업

- [ ] APK 설치 후 실제 기기 테스트
- [ ] Google Play Console 등록 ($25 일회성)
- [ ] Apple Developer Program 가입 ($99/년)
- [ ] iOS EAS 빌드
- [ ] TestFlight 베타 테스트
- [ ] App Store / Google Play 심사 제출
