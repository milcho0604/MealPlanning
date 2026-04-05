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
| Mobile | Expo SDK 55 (React Native), Expo Router |
| Backend | NestJS v11 (TypeScript) |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma v5 |
| 상태관리 | Zustand + React Query v5 |
| 모노레포 | Turborepo + npm workspaces |
| 이메일 | SendGrid HTTP API (우선) / Resend (2순위) / Gmail SMTP (폴백) |
| 빌드 | Expo EAS |
| 배포 | Render.com (백엔드) |

---

## 프로젝트 구조

```
MealPlanning/
├── apps/
│   └── mobile/          # Expo React Native 앱
│       ├── app/         # Expo Router 화면 (파일 기반 라우팅)
│       │   ├── (auth)/  # 인증 화면 (sign-in, sign-up, verify-email, reactivate)
│       │   └── (tabs)/  # 메인 탭 (home, calendar, fridge, shopping, settings)
│       ├── src/
│       │   ├── components/  # 공통/도메인별 컴포넌트
│       │   ├── hooks/       # React Query 훅, 커스텀 훅
│       │   ├── services/    # API 서비스 레이어
│       │   ├── stores/      # Zustand 스토어 (auth, group)
│       │   ├── utils/       # 유틸리티
│       │   └── constants/   # 색상, 스토리지 키 등
│       └── assets/
├── packages/
│   ├── api/             # NestJS 백엔드
│   │   ├── src/
│   │   │   ├── modules/ # auth, meal-plans, ingredients, groups, shopping, notifications, mail
│   │   │   ├── common/  # guards, decorators, filters, interceptors
│   │   │   └── prisma/
│   │   └── prisma/
│   └── shared/          # 공유 타입/상수 (모바일 + API 공통)
└── .github/
    └── workflows/
        └── keep-alive.yml  # Render.com 슬립 방지 핑 (4분마다)
```

---

## 주요 기능

### 인증
- 이메일/비밀번호 회원가입 + 이메일 인증 (SendGrid)
- 소셜 로그인: Google, 카카오, Apple
- 비밀번호 변경 (로그인 상태) / 비밀번호 찾기 (이메일 재설정 링크)
- 회원 탈퇴 (Soft Delete, 90일 이내 복구 가능)

### 식단 관리
- 식단 CRUD (아침/점심/저녁/간식)
- 월간 캘린더 뷰 + 좌우 스와이프 월 이동
- 주간 홈 뷰 + 메뉴명 검색
- 반복 등록 (매주/매월/특정 날짜 선택)
- 식단 템플릿 저장/불러오기
- 식단 사진 첨부 (백엔드 준비 완료, 이미지 호스팅 연결 필요)
- 식단 통계 API (자주 먹는 메뉴 TOP 5, 월별 식사 분포)

### 냉장고 (재료 관리)
- 재료 CRUD + 카테고리 필터
- 유통기한 관리 (달력 선택 + 직접 입력)
- 유통기한 임박 경고 (3일 이내)
- 단위: g, kg, ml, L, 개, 인분, 봉, 팩, 캔

### 쇼핑 리스트
- 항목 추가/체크/삭제
- 완료 섹션 분리 (체크 해제로 복귀 가능)
- 이번 주 식단 기반 자동 생성
- 카카오톡/문자 등으로 공유

### 그룹
- 그룹 생성 + 6자리 초대 코드
- 초대 코드 공유 (모든 멤버 가능) + 딥링크
- 멤버 관리 UI (역할 변경, 강퇴)
- 역할: owner / editor / viewer

### 설정
- 프로필 수정 (이름 변경)
- 알림 ON/OFF 토글
- 테마 설정 (라이트/다크/시스템 - UI만, 전체 적용 미완)

### 알림 (Cron)
- 매일 7:30 KST: 오늘 식단 알림
- 매일 9:00 KST: 유통기한 임박 알림

---

## API 엔드포인트

### Auth (`/v1/auth`)
| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | /signup | 회원가입 | - |
| POST | /login | 로그인 | - |
| POST | /logout | 로그아웃 | JWT |
| POST | /refresh | 토큰 갱신 | - |
| GET | /me | 내 프로필 | JWT |
| PATCH | /profile | 프로필 수정 | JWT |
| PATCH | /push-token | 푸시 토큰 등록 | JWT |
| POST | /change-password | 비밀번호 변경 | JWT |
| POST | /forgot-password | 비밀번호 재설정 링크 발송 | - |
| POST | /reset-password | 비밀번호 재설정 | - |
| POST | /social/:provider | 소셜 로그인 | - |
| POST | /reactivate | 탈퇴 계정 복구 | - |
| GET | /verify-email | 이메일 인증 (HTML) | - |
| POST | /resend-verification | 인증 메일 재발송 | - |
| DELETE | /account | 회원 탈퇴 | JWT |

### Meal Plans (`/v1/meal-plans`)
| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | / | 기간별 식단 조회 | JWT |
| GET | /stats | 식단 통계 | JWT |
| GET | /search | 메뉴명 검색 | JWT |
| GET | /:id | 단건 조회 | JWT |
| POST | / | 식단 생성 (배치 지원) | JWT |
| PUT | /:id | 식단 수정 | JWT |
| DELETE | /:id | 식단 삭제 | JWT |

### Groups (`/v1/groups`)
| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | /my | 내 그룹 목록 | JWT |
| POST | / | 그룹 생성 | JWT |
| POST | /join | 초대 코드로 참여 | JWT |
| GET | /:id/members | 멤버 목록 | JWT |
| PATCH | /:id/members/:userId/role | 멤버 역할 변경 | JWT |
| DELETE | /:id/members/:userId | 멤버 내보내기 | JWT |
| DELETE | /:id/leave | 그룹 탈퇴 | JWT |

### Ingredients (`/v1/ingredients`)
| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | / | 재료 목록 | JWT |
| GET | /expiring | 유통기한 임박 목록 | JWT |
| POST | / | 재료 추가 | JWT |
| PUT | /:id | 재료 수정 | JWT |
| DELETE | /:id | 재료 삭제 | JWT |
| PATCH | /:id/consume | 소진 처리 | JWT |

### Shopping (`/v1/shopping`)
| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | / | 쇼핑 목록 | JWT |
| POST | / | 항목 추가 | JWT |
| POST | /generate | 식단 기반 자동 생성 | JWT |
| PATCH | /:id/toggle | 체크 토글 | JWT |
| DELETE | /:id | 항목 삭제 | JWT |
| DELETE | /clear-checked | 완료 항목 일괄 삭제 | JWT |

---

## 코드 스타일 규칙

- **파일명:** 역할이 명확히 드러나도록 (`auth.service.ts`, `use-sign-in.hook.ts` 등)
- **파일 분리:** 관심사 분리 원칙 철저히 적용 (controller / service / dto / guard / hook 등)
- **주석:** 코드의 "왜"와 "무엇을" 설명하는 수준으로 충분히 작성
- **모든 함수/클래스/모듈**에 역할 설명 주석 포함
- **색상:** `colors` 상수 사용 (하드코딩 금지), `primaryLight`, `errorLight` 등 연한 배경용 색상 포함
- **border-radius:** 8(칩) / 12(카드/입력/버튼) / 20(뱃지/태그) / 50(원형)
- **padding:** 16(본문) / 20(헤더/화면)
- 질문 없이 자율적으로 진행해도 됨 (전권 위임)

---

## 커밋 메시지 규칙

- **반드시 한국어로 작성**
- type prefix는 영어 유지 (`feat`, `fix`, `chore`, `docs`, `refactor` 등)
- 예시: `feat: 이메일 인증 기능 추가`, `fix: 카카오 SDK Maven 저장소 추가`
- **Author:** milcho0604 <milcho0604@gmail.com>
- **Co-authored-by:** claude <noreply@anthropic.com>

---

## 환경변수

### 루트 `.env` (API 서버용)
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL            # Supabase Connection Pooler URL (포트 6543)
DIRECT_URL              # Supabase 직접 연결 URL (포트 5432, 마이그레이션용)
JWT_SECRET
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=30d
API_PORT=3300
GOOGLE_CLIENT_ID        # Google 웹 클라이언트 ID
GOOGLE_IOS_CLIENT_ID    # Google iOS 클라이언트 ID (⏳ Render에 추가 필요)
GOOGLE_ANDROID_CLIENT_ID # Google Android 클라이언트 ID (⏳ Render에 추가 필요)
SENDGRID_API_KEY        # SendGrid API 키 (이메일 발송 최우선)
RESEND_API_KEY          # Resend API 키 (2순위)
MAIL_USER=hello.mealplan@gmail.com
MAIL_PASS               # Gmail 앱 비밀번호 (폴백용)
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
| Google Android | `88190697802-un49mjuvlq36mmkfjcksqfj3q25kieti.apps.googleusercontent.com` |
| 카카오 네이티브 앱 키 | `e853e6f283f75a8256546445c2add6d1` |
| 카카오 키 해시 | `Wx6ekWlyRWSf002iPzCBx+zPBTA=` |
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
| SendGrid 발신자 | `hello.mealplan@gmail.com` (Single Sender Verified) |

### Render.com 빌드 설정
- **Build Command:** `npm install --include=dev && npm run build -w packages/shared && cd packages/api && npx prisma migrate deploy && cd ../.. && npm run build -w packages/api`
- **Start Command:** `node packages/api/dist/main.js`
- **Root Directory:** (비워둠)

---

## 인증 구조

- 자체 bcrypt + JWT 인증
- Access Token: 1시간, Refresh Token: 30일 (로테이션)
- 이메일 인증: 회원가입 시 SendGrid로 인증 메일 발송 (백그라운드, fire-and-forget)
- 미인증 사용자 재가입 허용 (비밀번호/토큰 갱신)
- 소셜 로그인 시 `isVerified: true` 자동 설정
- 이메일 소문자 정규화 (대소문자 중복 방지)
- 회원 탈퇴: Soft Delete (`status_yn=N`, `deleted_at`) → 90일 후 하드 삭제 (Cron)
- 탈퇴 후 90일 이내 휴면 해제(reactivate) 가능, 90일 경과 시 차단
- 토큰 갱신 race condition 방지 (refreshPromise 공유)

---

## 개발 서버 실행

```bash
# API 서버 (로컬)
cd packages/api && npm run dev

# 모바일 앱 (네이티브)
cd apps/mobile && npx expo start

# 웹 브라우저에서 테스트 (소셜 로그인 제외)
cd apps/mobile && npx expo start --web
```

> ⚠️ Expo Go는 네이티브 모듈(카카오/구글 SDK) 때문에 호환 안 됨. EAS 개발 빌드 필요.

---

## 알려진 이슈 / TODO

### 빌드 후 테스트 필요 (4월 1일 EAS 무료 리셋)
- [x] 앱 크래시 해결 확인 (metro.config.js + App.js 제거 완료)
- [x] 카카오 로그인 네이티브 크래시 → `initializeKakaoSDK()` 미호출이 원인, `_layout.tsx`에서 앱 시작 시 초기화 추가로 수정
- [ ] 전체 기능 QA

### Render 환경변수
- [x] `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` / `AWS_S3_BUCKET` (S3 사진 업로드용)
- [x] `GOOGLE_IOS_CLIENT_ID` = `88190697802-1ukeekh66h57e8e62q79lec1no9oscjp.apps.googleusercontent.com`
- [x] `GOOGLE_ANDROID_CLIENT_ID` = `88190697802-un49mjuvlq36mmkfjcksqfj3q25kieti.apps.googleusercontent.com`

### 완료된 기능
- [x] 식단 사진 업로드 (S3 Presigned URL + 모바일 리사이즈/압축 + 카드 미리보기)
- [x] 키보드가 입력창 가리는 이슈 수정 (reactivate, sign-in, sign-up)
- [x] SafeAreaView 적용 (상단 노치/상태바 겹침 수정)
- [x] 캘린더 헤더 레이아웃 수정 (`< 2026년 4월 >` 한 줄)

### 성능 최적화 (완료)
- [x] React Query 캐시 최적화: `gcTime` 30분, `refetchOnMount: false` → 탭 전환 시 캐시된 데이터 즉시 표시
- [x] API 토큰 메모리 캐싱: 매 요청마다 SecureStore I/O 제거 → 요청 지연 감소
- [x] FlatList 최적화: `removeClippedSubviews`, `maxToRenderPerBatch`, `windowSize` 추가 → 리스트 스크롤 버벅임 개선
- [x] 캘린더 `useMemo` 적용: 그리드 셀/식단맵 메모이제이션 → 월 이동 시 불필요한 재계산 방지
- [x] API 타임아웃 60초→90초 (Render 무료 플랜 콜드 스타트 대응)

#### 속도 관련 참고 (Render 무료 플랜 한계)
> Render 무료 플랜은 15분 비활성 시 서버가 슬립 모드로 전환되며,
> 다음 요청 시 콜드 스타트에 **20~40초**가 소요됩니다.
> 이는 코드 최적화로 해결 불가하며, 다음 방법으로만 개선 가능:
> - **keep-alive 핑**: `.github/workflows/keep-alive.yml`로 4분마다 핑 전송 중 (슬립 방지)
> - **Render 유료 플랜** ($7/월): 서버 항상 활성 상태 유지
> - 첫 요청 후에는 정상 속도 (50~200ms)

### 미완료 기능
- [ ] 다크 모드 전체 적용 (`useColors()` 훅으로 각 화면 전환)
- [ ] 햅틱 피드백 (삭제/체크/저장 시 진동)
- [ ] 프로필 사진 변경 (PATCH /auth/profile API 준비 완료)

### 배포
- [ ] APK 설치 후 실제 기기 테스트
- [ ] Google Play Console 등록 ($25 일회성)
- [ ] Apple Developer Program 가입 ($99/년)
- [ ] iOS EAS 빌드
- [ ] TestFlight 베타 테스트
- [ ] App Store / Google Play 심사 제출
