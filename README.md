# 🥗 MealPlan

개인/가족 식단을 미리 계획하고 공유하는 모바일 앱

---

## 🏗 시스템 아키텍처

```mermaid
graph TB
    subgraph Client["📱 Client (Mobile App)"]
        EXPO["Expo SDK 55 + React Native"]
        ROUTER["Expo Router (File-based)"]
        AUTH_SCREEN["Auth Screens"]
        TAB_SCREEN["Tab Screens"]
        ZUSTAND["Zustand Store"]
        RQ["React Query v5"]
        AXIOS["Axios HTTP Client (JWT)"]
        GOOGLE_SDK["Google SDK"]
        KAKAO_SDK["Kakao SDK"]
        SECURE["SecureStore (Token)"]

        EXPO --> ROUTER
        ROUTER --> AUTH_SCREEN
        ROUTER --> TAB_SCREEN
        TAB_SCREEN --> ZUSTAND
        TAB_SCREEN --> RQ
        ZUSTAND --> AXIOS
        RQ --> AXIOS
        AUTH_SCREEN --> GOOGLE_SDK
        AUTH_SCREEN --> KAKAO_SDK
        AXIOS --> SECURE
    end

    subgraph Server["⚙️ Backend (Render.com)"]
        NEST["NestJS v11 (TypeScript)"]
        JWT["JWT Guard"]
        MOD_AUTH["Auth Module"]
        MOD_MEAL["MealPlan Module"]
        MOD_GROUP["Group Module"]
        MOD_INGR["Ingredient Module"]
        MOD_SHOP["Shopping Module"]
        MOD_NOTIF["Notification Module"]
        MOD_MAIL["Mail Module"]
        MOD_UPLOAD["Upload Module"]
        PRISMA["Prisma ORM v5"]
        CRON["Cron (7:30/9:00 KST)"]

        NEST --> JWT
        JWT --> MOD_AUTH
        JWT --> MOD_MEAL
        JWT --> MOD_GROUP
        JWT --> MOD_INGR
        JWT --> MOD_SHOP
        NEST --> MOD_NOTIF
        NEST --> MOD_MAIL
        MOD_AUTH --> PRISMA
        MOD_MEAL --> PRISMA
        MOD_GROUP --> PRISMA
        MOD_INGR --> PRISMA
        MOD_SHOP --> PRISMA
        CRON --> MOD_NOTIF
    end

    subgraph Data["🗄 Data & Services"]
        SUPABASE[("Supabase PostgreSQL")]
        S3["AWS S3 (Images)"]
        SENDGRID["SendGrid (Email)"]
        EXPO_PUSH["Expo Push Service"]
        GOOGLE_OAUTH["Google OAuth"]
        KAKAO_API["Kakao API"]
    end

    subgraph Infra["🔧 Infrastructure"]
        TURBO["Turborepo (Monorepo)"]
        SHARED["@mealplan/shared"]
        GITHUB["GitHub"]
        EAS["EAS Build"]
        PLAY["Google Play Console"]
    end

    AXIOS -- "REST API" --> NEST
    PRISMA --> SUPABASE
    MOD_UPLOAD -- "Presigned URL" --> S3
    MOD_MAIL -- "HTTP API" --> SENDGRID
    MOD_NOTIF --> EXPO_PUSH
    MOD_AUTH --> GOOGLE_OAUTH
    MOD_AUTH --> KAKAO_API
    SHARED -.-> Client
    SHARED -.-> Server
    TURBO --> GITHUB
    GITHUB --> EAS
    EAS --> PLAY

    style Client fill:#dbe4ff,stroke:#4a9eed
    style Server fill:#e5dbff,stroke:#8b5cf6
    style Data fill:#d3f9d8,stroke:#22c55e
    style Infra fill:#fff3bf,stroke:#f59e0b
```

---

## ✨ 주요 기능

### 🍽 식단 관리
- 아침/점심/저녁/간식 식단 등록 및 관리 (식사 유형 수정 가능)
- 월간 캘린더 뷰 + 리스트 뷰 전환 (선택 상태 기억)
- 리스트 뷰: 전체 식단 날짜순 가상 스크롤 + 검색 + 기간 필터 + 사용자 필터
- 주간 홈 뷰 + 좌우 스와이프 주간 이동 (드래그 애니메이션) + 화살표 버튼
- 식단 복사 (다른 날짜에 동일 식단 등록)
- 여러 날짜에 동일 식단 일괄 등록
- 식단 템플릿 저장 및 불러오기 (iOS/Android 모두 지원)
- 식단 사진 첨부 (S3 업로드, 자동 리사이즈 1080px + JPEG 압축)
- 칼로리 수기 입력 + 일간/주간 요약
- 식단 통계 (TOP 5 메뉴 + 칼로리 요약, 홈 화면 토글)
- 전체 그룹 통계 합산 지원
- 레시피 URL → "레시피 보기" 버튼 (외부 브라우저)
- 스와이프 삭제

### 🥕 냉장고 (재료 관리)
- 재료 추가/수정/삭제/소진 처리
- 카테고리별 필터 (육류, 채소, 유제품 등)
- 유통기한 관리 (달력 선택 + 직접 입력)
- 유통기한 임박 경고 (3일 이내) + 매일 9:00 KST 푸시 알림
- 전체 선택 + 일괄 삭제 / 스와이프 삭제
- **그룹 드롭다운**: 특정 그룹 또는 전체 그룹 보기 (항목별 그룹 색상 도트 표시)

### 🛒 쇼핑 리스트
- 항목 추가/체크/삭제 + 수량/단위 입력
- 완료 섹션 분리 (체크 해제로 복귀)
- 전체 선택 + 일괄 삭제
- **이번 주 식단 기반 자동 생성**: 식단 소스 그룹 + 쇼핑 타겟 그룹 각각 선택 가능
- 카카오톡/문자 등으로 공유
- **그룹 드롭다운**: 특정 그룹 또는 전체 그룹 보기 (항목별 그룹 색상 도트 표시)

### 👥 그룹
- 그룹 생성 + 6자리 초대 코드 + 그룹 색상 선택 (10색 팔레트)
- 그룹 이름/색상 수정 + 그룹 삭제 (관리자 전용)
- 초대 코드 복사/공유 (모든 멤버 가능) + 딥링크
- 멤버 관리 (역할 변경, 강퇴) + 프로필 사진 표시
- 역할: 관리자 / 편집자 / 뷰어
- 그룹별 식단 필터 (드롭다운) + 전체 그룹 보기
- 기본 그룹 설정 (앱 시작 시 자동 선택, 최상단 정렬)
- 캘린더 dot / 식단 카드에 그룹 색상 바 표시 (전체 그룹 뷰)

### 🔐 인증
- 이메일/비밀번호 회원가입 + 이메일 인증 (SendGrid)
- 소셜 로그인 (Google, 카카오, Apple)
- 비밀번호 변경 / 비밀번호 찾기 (iOS/Android 모두 지원)
- 회원 탈퇴 (Soft Delete, 90일 이내 복구 가능)
- Play Store 앱 서명 키 기반 SHA-1 등록 (Google/카카오 로그인)

### ⚙️ 설정
- 프로필 수정 (이름 변경 커스텀 모달 + 사진 변경)
- 알림 ON/OFF 토글 (SecureStore 영속화)
- 기본 그룹 설정 (별 아이콘)
- 앱 소개 다시 보기 (온보딩 리셋, 항상 표시)

### 🔔 알림 (Cron)
- 매일 7:30 KST: 오늘 식단 알림
- 매일 9:00 KST: 유통기한 임박 알림

---

## 🛠 기술 스택

| 영역 | 기술 |
|------|------|
| **Mobile** | Expo SDK 55, React Native, Expo Router |
| **Backend** | NestJS v11 (TypeScript) |
| **Database** | PostgreSQL (Supabase) |
| **ORM** | Prisma v5 |
| **상태관리** | Zustand + TanStack Query v5 |
| **모노레포** | Turborepo + npm workspaces |
| **이미지 저장소** | AWS S3 (Presigned URL) |
| **이메일** | SendGrid (우선) / Resend / Gmail SMTP (폴백) |
| **빌드** | Expo EAS Build |
| **배포** | Render.com (백엔드), Google Play Console (Android) |

---

## 📁 프로젝트 구조

```
MealPlanning/
├── apps/
│   └── mobile/              # Expo React Native 앱
│       ├── app/             # Expo Router (파일 기반 라우팅)
│       │   ├── (auth)/      # 인증 화면 (sign-in, sign-up, verify-email, reactivate)
│       │   ├── (tabs)/      # 메인 탭 (home, calendar, fridge, shopping, settings)
│       │   └── onboarding.tsx
│       ├── src/
│       │   ├── components/  # 공통/도메인별 컴포넌트
│       │   ├── hooks/       # React Query 훅, 커스텀 훅
│       │   ├── services/    # API 서비스 레이어
│       │   ├── stores/      # Zustand 스토어 (auth, group, view-mode)
│       │   ├── utils/       # 유틸리티
│       │   └── constants/   # 색상, 스토리지 키 등
│       └── assets/          # 앱 아이콘, 스플래시, 로고
├── packages/
│   ├── api/                 # NestJS 백엔드
│   │   ├── src/modules/     # auth, meal-plans, groups, ingredients, shopping, notifications, mail, upload
│   │   └── prisma/          # 스키마 + 마이그레이션
│   └── shared/              # 공유 타입/상수 (모바일 + API 공통)
├── docs/                    # 문서 및 스크린샷
│   └── account-deletion.html  # Google Play 계정 삭제 안내 페이지
└── .github/
    └── workflows/
        └── keep-alive.yml   # Render.com 슬립 방지 핑 (4분마다)
```

---

## 📡 API 엔드포인트

### Auth (`/v1/auth`)
| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | /signup | 회원가입 | - |
| POST | /login | 로그인 | - |
| POST | /logout | 로그아웃 | JWT |
| POST | /refresh | 토큰 갱신 | - |
| GET | /me | 프로필 조회 | JWT |
| PATCH | /profile | 프로필 수정 | JWT |
| PATCH | /push-token | 푸시 토큰 등록 | JWT |
| POST | /change-password | 비밀번호 변경 | JWT |
| POST | /forgot-password | 비밀번호 재설정 링크 | - |
| POST | /reset-password | 비밀번호 재설정 | - |
| POST | /social/:provider | 소셜 로그인 (google/kakao/apple) | - |
| POST | /reactivate | 탈퇴 계정 복구 | - |
| GET | /verify-email | 이메일 인증 | - |
| DELETE | /account | 회원 탈퇴 | JWT |

### Meal Plans (`/v1/meal-plans`)
| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | / | 기간별 조회 | JWT |
| GET | /stats | 통계 (groupId 없으면 전체 합산) | JWT |
| GET | /search | 메뉴명 검색 | JWT |
| GET | /:id | 단건 조회 | JWT |
| POST | / | 생성 (배치 지원) | JWT |
| PUT | /:id | 수정 | JWT |
| DELETE | /:id | 삭제 | JWT |

### Groups (`/v1/groups`)
| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | /my | 내 그룹 목록 | JWT |
| POST | / | 그룹 생성 | JWT |
| POST | /join | 초대 코드 참여 | JWT |
| PATCH | /:id | 그룹 이름/색상 수정 | JWT |
| GET | /:id/members | 멤버 목록 | JWT |
| PATCH | /:id/members/:userId/role | 역할 변경 | JWT |
| DELETE | /:id/members/:userId | 멤버 내보내기 | JWT |
| DELETE | /:id/leave | 그룹 탈퇴 | JWT |

### Ingredients (`/v1/ingredients`)
| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | / | 목록 | JWT |
| GET | /expiring | 유통기한 임박 목록 | JWT |
| POST | / | 추가 | JWT |
| PUT | /:id | 수정 | JWT |
| DELETE | /:id | 삭제 | JWT |
| PATCH | /:id/consume | 소진 처리 | JWT |

### Upload (`/v1/upload`)
| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | /presigned-url | S3 업로드용 Presigned URL 발급 | JWT |

### Shopping (`/v1/shopping`)
| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | / | 목록 | JWT |
| POST | / | 추가 | JWT |
| POST | /generate | 식단 기반 자동 생성 | JWT |
| PATCH | /:id/toggle | 체크 토글 | JWT |
| DELETE | /:id | 삭제 | JWT |
| DELETE | /clear-checked | 완료 항목 일괄 삭제 | JWT |

---

## 🗄 데이터베이스 스키마

### ERD

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           MealPlan ERD                                  │
└─────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐        ┌──────────────────┐        ┌──────────────┐
  │    users     │        │  group_members   │        │    groups    │
  ├──────────────┤        ├──────────────────┤        ├──────────────┤
  │ id (PK)      │──┐  ┌──│ group_id (FK)    │──┐  ┌──│ id (PK)      │
  │ email        │  └──┘  │ user_id  (FK)    │  └──┘  │ name         │
  │ name         │  1:N   │ role             │  N:1   │ color        │
  │ avatar_url   │        │ joined_at        │        │ owner_id(FK) │──┐
  │ push_token   │        └──────────────────┘        │ invite_code  │  │
  │ password_hash│                                    │ created_at   │  │
  │ provider     │        ┌──────────────────┐        └──────────────┘  │
  │ provider_id  │        │   meal_plans     │               │           │
  │ status_yn    │        ├──────────────────┤               │  owner    │
  │ deleted_at   │──┐  ┌──│ group_id (FK)    │               └───────────┘
  │ is_verified  │  └──┘  │ created_by (FK)  │
  │ verify_token │  1:N   │ date             │        ┌──────────────────┐
  │ created_at   │        │ meal_type        │        │  meal_templates  │
  └──────────────┘        │ menu_name        │        ├──────────────────┤
                          │ memo             │     ┌──│ group_id (FK)    │
                          │ recipe_url       │     │  │ id (PK)          │
                          │ calories         │     │  │ name             │
                          │ photo_url        │     │  │ meal_type        │
                          │ is_recurring     │     │  │ menu_name        │
                          │ recur_rule       │     │  │ memo             │
                          │ created_at       │     │  │ recipe_url       │
                          └──────────────────┘     │  │ created_at       │
                                                   │  └──────────────────┘
  ┌──────────────────┐     ┌──────────────────┐    │
  │   ingredients    │     │  shopping_items  │    │  groups ──┤
  ├──────────────────┤     ├──────────────────┤    │  (1:N 공통)│
  │ id (PK)          │  ┌──│ group_id (FK)    │    └───────────┘
  │ group_id (FK)    │──┘  │ id (PK)          │
  │ added_by (FK)    │     │ name             │
  │ name             │     │ quantity         │
  │ quantity         │     │ unit             │
  │ unit             │     │ is_checked       │
  │ category         │     │ created_at       │
  │ expiry_date      │     └──────────────────┘
  │ is_consumed      │
  │ created_at       │
  └──────────────────┘
```

> 모든 외래키는 `ON DELETE CASCADE` (부모 삭제 시 연관 데이터 자동 삭제)

---

### 테이블 명세

#### users

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | 사용자 고유 ID |
| email | VARCHAR | UNIQUE, NOT NULL | 이메일 (소문자 정규화) |
| name | VARCHAR | NOT NULL | 표시 이름 |
| avatar_url | VARCHAR | NULL | 프로필 사진 S3 URL |
| push_token | VARCHAR | NULL | Expo 푸시 알림 토큰 |
| password_hash | VARCHAR | NULL | bcrypt 해시 (소셜 로그인은 null) |
| provider | VARCHAR | NULL | 소셜 제공자: `google` \| `kakao` \| `apple` |
| provider_id | VARCHAR | NULL | 소셜 제공자의 사용자 ID |
| status_yn | CHAR(1) | DEFAULT 'Y' | 계정 상태: `Y`=정상, `N`=탈퇴 |
| deleted_at | TIMESTAMP | NULL | 탈퇴 처리 시각 (90일 후 하드삭제) |
| is_verified | BOOLEAN | DEFAULT false | 이메일 인증 여부 |
| verify_token | VARCHAR | NULL | 이메일 인증 토큰 |
| verify_token_expiry | TIMESTAMP | NULL | 인증 토큰 만료 시각 |
| created_at | TIMESTAMP | DEFAULT now() | 가입 일시 |

#### groups

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | 그룹 고유 ID |
| name | VARCHAR | NOT NULL | 그룹 이름 |
| color | VARCHAR | DEFAULT '#4CAF50' | 그룹 색상 (HEX) |
| owner_id | UUID | FK → users.id | 그룹 생성자 |
| invite_code | VARCHAR | UNIQUE, NOT NULL | 6자리 초대 코드 |
| created_at | TIMESTAMP | DEFAULT now() | 생성 일시 |

#### group_members

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| group_id | UUID | PK, FK → groups.id | 그룹 ID |
| user_id | UUID | PK, FK → users.id | 사용자 ID |
| role | VARCHAR | DEFAULT 'editor' | 역할: `owner` \| `editor` \| `viewer` |
| joined_at | TIMESTAMP | DEFAULT now() | 참여 일시 |

> 복합 PK `(group_id, user_id)` — 한 사용자는 같은 그룹에 한 번만 소속 가능

#### meal_plans

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | 식단 고유 ID |
| group_id | UUID | FK → groups.id | 소속 그룹 |
| created_by | UUID | FK → users.id | 등록한 사용자 |
| date | DATE | NOT NULL | 식단 날짜 |
| meal_type | VARCHAR | NOT NULL | `breakfast` \| `lunch` \| `dinner` \| `snack` |
| menu_name | VARCHAR | NOT NULL | 메뉴 이름 |
| memo | TEXT | NULL | 메모 |
| recipe_url | VARCHAR | NULL | 레시피 URL |
| calories | INT | NULL | 칼로리 (kcal) |
| photo_url | VARCHAR | NULL | 식단 사진 S3 URL |
| is_recurring | BOOLEAN | DEFAULT false | 반복 식단 여부 |
| recur_rule | VARCHAR | NULL | 반복 규칙: `weekly` \| `monthly` |
| created_at | TIMESTAMP | DEFAULT now() | 등록 일시 |
| updated_at | TIMESTAMP | AUTO | 수정 일시 |

> 인덱스: `(group_id, date)` — 월간 캘린더 조회 최적화

#### ingredients

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | 재료 고유 ID |
| group_id | UUID | FK → groups.id | 소속 그룹 |
| added_by | UUID | FK → users.id | 추가한 사용자 |
| name | VARCHAR | NOT NULL | 재료 이름 |
| quantity | DECIMAL(10,2) | NULL | 수량 |
| unit | VARCHAR | NULL | 단위: `g` \| `kg` \| `ml` \| `L` \| `개` \| `봉` 등 |
| category | VARCHAR | NULL | `meat` \| `vegetable` \| `dairy` \| `seafood` \| `grain` \| `sauce` \| `frozen` \| `other` |
| expiry_date | DATE | NULL | 유통기한 |
| is_consumed | BOOLEAN | DEFAULT false | 소진 여부 |
| created_at | TIMESTAMP | DEFAULT now() | 등록 일시 |

> 인덱스: `(group_id, expiry_date)` — 유통기한 임박 알림 최적화

#### meal_templates

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | 템플릿 고유 ID |
| group_id | UUID | FK → groups.id | 소속 그룹 |
| name | VARCHAR | NOT NULL | 템플릿 이름 (사용자 지정) |
| meal_type | VARCHAR | NOT NULL | `breakfast` \| `lunch` \| `dinner` \| `snack` |
| menu_name | VARCHAR | NOT NULL | 메뉴 이름 |
| memo | TEXT | NULL | 메모 |
| recipe_url | VARCHAR | NULL | 레시피 URL |
| created_at | TIMESTAMP | DEFAULT now() | 생성 일시 |

#### shopping_items

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | 항목 고유 ID |
| group_id | UUID | FK → groups.id | 소속 그룹 |
| name | VARCHAR | NOT NULL | 항목 이름 |
| quantity | DECIMAL(10,2) | NULL | 수량 |
| unit | VARCHAR | NULL | 단위 |
| is_checked | BOOLEAN | DEFAULT false | 체크(구매 완료) 여부 |
| created_at | TIMESTAMP | DEFAULT now() | 등록 일시 |

---

## 🚀 개발 서버 실행

```bash
# API 서버 (로컬)
cd packages/api && npm run dev

# 모바일 앱 (네이티브 빌드 필요)
cd apps/mobile && npx expo start
```

> ⚠️ Expo Go는 네이티브 모듈(카카오/구글 SDK) 때문에 호환되지 않습니다. EAS 개발 빌드 또는 실제 APK 사용 필요.

---

## 🏗 배포

### 백엔드 (Render.com)

| 항목 | 값 |
|------|-----|
| URL | `https://mealplan-api-dtx0.onrender.com` |
| Build Command | `npm install --include=dev && npm run build -w packages/shared && cd packages/api && npx prisma migrate deploy && cd ../.. && npm run build -w packages/api` |
| Start Command | `node packages/api/dist/main.js` |

> Render 무료 플랜 슬립 방지: `.github/workflows/keep-alive.yml`로 4분마다 핑 전송 중

### 모바일 (EAS Build)

```bash
cd apps/mobile

# Android (AAB)
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production
```

### Google Play
- 내부 테스트 트랙 배포 완료
- 계정 삭제 안내 페이지: `https://milcho0604.github.io/MealPlanning/account-deletion.html`

---

## 🔑 소셜 로그인 설정 (운영)

| 제공자 | 비고 |
|--------|------|
| Google | Play 앱 서명 키 SHA-1 등록 필요 (업로드 키 ≠ 서명 키) |
| 카카오 | Play 앱 서명 키 기반 키 해시 등록 필요 |
| Apple | `usesAppleSignIn: true` (app.json) |

> Play Console → 출시 → 앱 무결성 → "앱 서명 키 인증서"의 SHA-1을 각 제공자 콘솔에 등록

---

## 📄 라이선스

All Rights Reserved. Copyright (c) 2026 milcho0604

이 소프트웨어의 소스 코드 및 관련 자료에 대한 모든 권리는 저작권자에게 있습니다.
저작권자의 사전 서면 동의 없이 본 소프트웨어의 전부 또는 일부를
복제, 수정, 배포, 게시, 전송하거나 상업적 목적으로 이용할 수 없습니다.

---

## 👤 개발자

**milcho0604**
- GitHub: [@milcho0604](https://github.com/milcho0604)
- Email: milcho0604@gmail.com
