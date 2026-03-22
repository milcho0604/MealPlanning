# MealPlan - 제품 요구사항 문서 (PRD)

**버전:** 1.0.0
**작성일:** 2026-03-22
**상태:** 초안

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [목표 및 배경](#2-목표-및-배경)
3. [사용자 정의](#3-사용자-정의)
4. [기능 요구사항](#4-기능-요구사항)
5. [비기능 요구사항](#5-비기능-요구사항)
6. [기술 스택](#6-기술-스택)
7. [시스템 아키텍처](#7-시스템-아키텍처)
8. [데이터베이스 설계](#8-데이터베이스-설계)
9. [API 설계](#9-api-설계)
10. [화면 구성 (IA)](#10-화면-구성-ia)
11. [개발 단계 및 일정](#11-개발-단계-및-일정)
12. [비용 계획](#12-비용-계획)
13. [배포 전략](#13-배포-전략)

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **프로젝트명** | MealPlan |
| **플랫폼** | iOS, Android |
| **목적** | 개인 또는 가족 단위로 주간/월간/연간 식단을 미리 계획하고 관리하는 앱 |
| **핵심 가치** | 단순함 · 편리함 · 공유 |

---

## 2. 목표 및 배경

### 배경

매일 반복되는 "오늘 뭐 먹지?"라는 고민을 줄이고, 식단을 미리 계획해두면:
- 장보기가 효율적으로 변함
- 냉장고 재료를 낭비 없이 활용 가능
- 가족 간 식단 소통이 간편해짐

### 목표

- 주간/월간/연간 식단을 아침·점심·저녁 단위로 미리 기록
- 냉장고 재료를 관리하고 유통기한을 추적
- 가족 또는 지인과 식단 플랜 공유
- 심플하고 직관적인 UI로 누구나 쉽게 사용

### 성공 지표 (KPI)

- MAU 1,000명 달성 (6개월 내)
- 주간 식단 등록률 60% 이상
- 공유 기능 사용률 30% 이상
- 앱 평점 4.0 이상

---

## 3. 사용자 정의

### 주요 사용자

| 유형 | 설명 |
|------|------|
| **개인 사용자** | 혼자 식단을 계획하고 싶은 직장인, 자취생 |
| **가족 사용자** | 가족 식단을 함께 관리하는 주부, 부모 |
| **공유 사용자** | 친구, 룸메이트와 식단을 함께 구성하는 사용자 |

### 사용자 시나리오

**시나리오 1 - 개인 계획**
> 직장인 A씨는 매주 일요일 저녁, 앱을 열어 다음 주 7일치 아침/점심/저녁을 미리 입력한다.
> 월요일 아침에 알림을 받아 오늘 식단을 확인하고, 장보기 목록을 자동 생성해 마트에서 활용한다.

**시나리오 2 - 가족 공유**
> 주부 B씨는 가족 그룹을 만들어 남편과 아이에게 초대 링크를 보낸다.
> 가족 모두가 이번 주 식단을 확인하고, 남편이 저녁 메뉴를 수정하면 B씨에게 실시간으로 반영된다.

**시나리오 3 - 냉장고 관리**
> C씨는 장을 본 후 구입한 재료를 냉장고 탭에 입력한다.
> 유통기한이 이틀 남은 재료가 있으면 앱이 알림을 보내고, 해당 재료를 활용한 식단을 제안한다.

---

## 4. 기능 요구사항

### 4.1 인증

| ID | 기능 | 우선순위 |
|----|------|----------|
| AUTH-01 | 이메일/비밀번호 회원가입 및 로그인 | P0 |
| AUTH-02 | 소셜 로그인 (Google, Apple) | P1 |
| AUTH-03 | 자동 로그인 (토큰 갱신) | P0 |
| AUTH-04 | 로그아웃 / 회원 탈퇴 | P0 |

### 4.2 식단 계획

| ID | 기능 | 우선순위 |
|----|------|----------|
| MEAL-01 | 날짜별 아침/점심/저녁/간식 메뉴 입력 | P0 |
| MEAL-02 | 캘린더 뷰 (월간) | P0 |
| MEAL-03 | 리스트 뷰 (주간) | P0 |
| MEAL-04 | 연간 뷰 | P2 |
| MEAL-05 | 식단 수정 / 삭제 | P0 |
| MEAL-06 | 반복 식단 설정 (매주/매월) | P1 |
| MEAL-07 | 식단 템플릿 저장 및 재사용 | P1 |
| MEAL-08 | 메뉴에 메모 및 레시피 URL 첨부 | P1 |
| MEAL-09 | 오늘의 식단 홈 위젯 | P2 |

### 4.3 냉장고 관리

| ID | 기능 | 우선순위 |
|----|------|----------|
| FRIDGE-01 | 재료 추가 (이름, 수량, 단위) | P0 |
| FRIDGE-02 | 유통기한 입력 및 관리 | P1 |
| FRIDGE-03 | 유통기한 임박 푸시 알림 (D-3, D-1) | P1 |
| FRIDGE-04 | 재료 소진 처리 | P0 |
| FRIDGE-05 | 카테고리별 정렬 (육류, 채소, 유제품 등) | P2 |

### 4.4 쇼핑 리스트

| ID | 기능 | 우선순위 |
|----|------|----------|
| SHOP-01 | 수동 쇼핑 리스트 작성 | P1 |
| SHOP-02 | 주간 식단 기반 재료 자동 생성 | P1 |
| SHOP-03 | 항목 체크/완료 처리 | P1 |
| SHOP-04 | 구매 완료 항목 냉장고에 자동 추가 | P2 |

### 4.5 공유 기능

| ID | 기능 | 우선순위 |
|----|------|----------|
| SHARE-01 | 그룹 생성 (가족/친구 단위) | P1 |
| SHARE-02 | 초대 코드 / 링크 생성 | P1 |
| SHARE-03 | 그룹 내 공동 식단 편집 | P1 |
| SHARE-04 | 읽기 전용 공유 링크 | P2 |
| SHARE-05 | 멤버 권한 설정 (편집자/뷰어) | P2 |

### 4.6 알림

| ID | 기능 | 우선순위 |
|----|------|----------|
| NOTI-01 | 오늘 식단 아침 알림 | P1 |
| NOTI-02 | 식단 미입력 시 주간 리마인더 | P2 |
| NOTI-03 | 냉장고 유통기한 임박 알림 | P1 |
| NOTI-04 | 그룹 식단 변경 시 알림 | P2 |

> **우선순위 정의**
> - P0: MVP 필수 (Phase 1)
> - P1: 핵심 기능 (Phase 2)
> - P2: 추가 기능 (Phase 3)

---

## 5. 비기능 요구사항

| 항목 | 요구사항 |
|------|----------|
| **성능** | 화면 로딩 2초 이내, API 응답 500ms 이내 |
| **가용성** | 99% 업타임 목표 |
| **보안** | JWT 인증, HTTPS 필수, 비밀번호 bcrypt 암호화 |
| **확장성** | 사용자 10,000명까지 현 인프라로 대응 가능 |
| **오프라인** | 마지막 로드 데이터 로컬 캐시 (AsyncStorage) |
| **접근성** | 폰트 크기 조절, 다크 모드 지원 |
| **다국어** | 한국어 기본, 영어 추가 예정 |

---

## 6. 기술 스택

```
┌─────────────────────────────────────────────────┐
│                   TECH STACK                    │
├─────────────────┬───────────────────────────────┤
│ Mobile App      │ Expo (React Native)            │
│ Backend API     │ NestJS (Node.js + TypeScript)  │
│ Database        │ PostgreSQL (Supabase)          │
│ Authentication  │ Supabase Auth                  │
│ File Storage    │ Supabase Storage               │
│ Push Notification│ Expo Push Notifications       │
│ 상태관리        │ Zustand + React Query           │
│ ORM             │ Prisma                         │
│ API 문서화      │ Swagger (NestJS 내장)           │
└─────────────────┴───────────────────────────────┘

배포 인프라 (전체 무료)
┌─────────────────┬───────────────────────────────┐
│ Mobile 빌드     │ Expo EAS (무료 플랜)            │
│ Backend 배포    │ Render.com (무료)               │
│ Database 호스팅 │ Supabase (무료, 500MB)          │
└─────────────────┴───────────────────────────────┘
```

> **Note:** Web(Next.js) 제거 - 모바일 앱에 집중. 필요 시 추후 추가 예정.

### 선택 이유

| 기술 | 선택 이유 |
|------|-----------|
| **Expo** | iOS/Android 단일 코드베이스, OTA 업데이트, 빠른 개발 |
| **NestJS** | TypeScript 기반, 모듈화 구조, Swagger 자동화, 확장성 |
| **Supabase** | PostgreSQL 호스팅 + Auth + Storage 무료 제공 |
| **Prisma** | 타입 안전한 ORM, 마이그레이션 관리 용이 |

---

## 7. 시스템 아키텍처

### 7.1 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                 │
│                                                                 │
│           ┌──────────────────────────┐                          │
│           │        Mobile App        │                          │
│           │  (Expo / React Native)   │                          │
│           │     iOS & Android        │                          │
│           └────────────┬─────────────┘                          │
└────────────────────────┼─────────────────────────────────────┘
                         │
                         │    HTTPS / REST API
                         │
┌────────────────────────────▼────────────────────────────────────┐
│                      BACKEND LAYER                              │
│                                                                 │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │                  NestJS API Server                       │  │
│   │                  (Render.com 배포)                        │  │
│   │                                                          │  │
│   │  ┌────────────┐  ┌─────────────┐  ┌──────────────────┐  │  │
│   │  │Auth Module │  │ Meal Module │  │ Fridge Module    │  │  │
│   │  └────────────┘  └─────────────┘  └──────────────────┘  │  │
│   │  ┌────────────┐  ┌─────────────┐  ┌──────────────────┐  │  │
│   │  │Group Module│  │ Shop Module │  │ Notification     │  │  │
│   │  └────────────┘  └─────────────┘  │ Module           │  │  │
│   │                                   └──────────────────┘  │  │
│   │              Prisma ORM                                  │  │
│   └──────────────────────────┬───────────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                      DATA LAYER (Supabase)                      │
│                                                                 │
│   ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐  │
│   │   PostgreSQL DB   │  │  Supabase Auth   │  │  Storage    │  │
│   │                  │  │  (JWT 발급)       │  │  (이미지)    │  │
│   │  - users         │  │  - 이메일 로그인  │  │             │  │
│   │  - groups        │  │  - Google OAuth   │  └─────────────┘  │
│   │  - meal_plans    │  │  - Apple OAuth    │                   │
│   │  - ingredients   │  └──────────────────┘                   │
│   │  - shopping_items│                                          │
│   └──────────────────┘                                          │
└─────────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                   EXTERNAL SERVICES                             │
│                                                                 │
│   ┌──────────────────────────┐                                  │
│   │  Expo Push Notification  │  ← 식단 알림, 유통기한 알림       │
│   │  Service (APNS / FCM)    │                                  │
│   └──────────────────────────┘                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 인증 플로우

```
[사용자]
   │
   │ 1. 로그인 요청 (email + password)
   ▼
[NestJS API]
   │
   │ 2. Supabase Auth 검증 요청
   ▼
[Supabase Auth]
   │
   │ 3. JWT Access Token + Refresh Token 발급
   ▼
[NestJS API]
   │
   │ 4. 토큰 클라이언트 전달
   ▼
[Mobile / Web]
   │
   │ 5. 이후 요청마다 Authorization: Bearer {token}
   ▼
[NestJS API] → JWT Guard → 요청 처리
```

### 7.3 공유 기능 플로우

```
[사용자 A - 그룹 생성]
   │
   │ POST /groups → 그룹 생성 + 초대 코드 발급
   ▼
[NestJS API] → DB: groups 테이블 생성
   │
   │ 초대 코드 or 링크 → 사용자 B에게 공유
   ▼
[사용자 B - 그룹 참가]
   │
   │ POST /groups/join/{code}
   ▼
[NestJS API] → DB: group_members 추가
   │
   │ 이후 A, B 모두 같은 group_id로 식단 조회/수정
   ▼
[실시간 반영] → 수정 시 상대방 화면 갱신 (React Query refetch)
```

### 7.4 배포 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                   개발 환경                          │
│                                                     │
│  Local Machine                                      │
│  ├── Expo Dev Server (Mobile 개발)                   │
│  ├── NestJS Dev Server (:3000)                       │
│  └── Supabase Local (supabase start)                │
└─────────────────────────────────────────────────────┘
                        │ git push
                        ▼
┌─────────────────────────────────────────────────────┐
│                   프로덕션 환경                       │
│                                                     │
│  GitHub Repository                                  │
│  │                                                  │
│  ├──→ Render.com ──→ NestJS API 서버                 │
│  │     (자동 배포, main 브랜치)                       │
│  │                                                  │
│  └──→ Expo EAS ────→ iOS / Android 앱 빌드           │
│        (수동 트리거 or CI)                            │
│                                                     │
│  Supabase Cloud ──→ PostgreSQL + Auth + Storage     │
│  (항상 연결 상태)                                    │
└─────────────────────────────────────────────────────┘
```

---

## 8. 데이터베이스 설계

### 8.1 ERD

```
users
  ├─< group_members >─ groups
  │
  ├─< meal_plans (group_id)
  │
  ├─< ingredients (group_id)
  │
  └─< shopping_items (group_id)
```

### 8.2 테이블 정의

```sql
-- 사용자
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 그룹 (공유 단위)
CREATE TABLE groups (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  owner_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  invite_code  TEXT UNIQUE NOT NULL,  -- 6자리 랜덤 코드
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 그룹 멤버
CREATE TABLE group_members (
  group_id  UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  role      TEXT NOT NULL DEFAULT 'editor',  -- owner | editor | viewer
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- 식단 계획
CREATE TABLE meal_plans (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     UUID REFERENCES groups(id) ON DELETE CASCADE,
  created_by   UUID REFERENCES users(id),
  date         DATE NOT NULL,
  meal_type    TEXT NOT NULL,  -- breakfast | lunch | dinner | snack
  menu_name    TEXT NOT NULL,
  memo         TEXT,
  recipe_url   TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recur_rule   TEXT,           -- 'weekly' | 'monthly'
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 냉장고 재료
CREATE TABLE ingredients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID REFERENCES groups(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  quantity    DECIMAL,
  unit        TEXT,            -- g | kg | 개 | 봉 | 팩
  category    TEXT,            -- 육류 | 채소 | 유제품 | 기타
  expiry_date DATE,
  is_consumed BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 쇼핑 리스트
CREATE TABLE shopping_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID REFERENCES groups(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  quantity    DECIMAL,
  unit        TEXT,
  is_checked  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 9. API 설계

### 기본 규칙

```
Base URL:  https://api.mealplan.app/v1
Auth:      Authorization: Bearer {jwt_token}
Format:    JSON
```

### 9.1 인증 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/auth/signup` | 회원가입 |
| POST | `/auth/login` | 로그인 |
| POST | `/auth/logout` | 로그아웃 |
| POST | `/auth/refresh` | 토큰 갱신 |
| DELETE | `/auth/account` | 회원 탈퇴 |

### 9.2 식단 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/meal-plans?groupId=&from=&to=` | 기간별 식단 조회 |
| GET | `/meal-plans/:id` | 식단 단건 조회 |
| POST | `/meal-plans` | 식단 생성 |
| PUT | `/meal-plans/:id` | 식단 수정 |
| DELETE | `/meal-plans/:id` | 식단 삭제 |
| POST | `/meal-plans/templates` | 템플릿 저장 |
| GET | `/meal-plans/templates?groupId=` | 템플릿 목록 |

**식단 생성 요청 예시:**
```json
POST /meal-plans
{
  "groupId": "uuid",
  "date": "2026-03-25",
  "mealType": "dinner",
  "menuName": "된장찌개",
  "memo": "두부 많이 넣기",
  "recipeUrl": "https://...",
  "isRecurring": true,
  "recurRule": "weekly"
}
```

### 9.3 그룹 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/groups` | 내 그룹 목록 |
| POST | `/groups` | 그룹 생성 |
| GET | `/groups/:id` | 그룹 정보 조회 |
| PUT | `/groups/:id` | 그룹 정보 수정 |
| DELETE | `/groups/:id` | 그룹 삭제 |
| POST | `/groups/join/:code` | 초대 코드로 참가 |
| DELETE | `/groups/:id/leave` | 그룹 탈퇴 |
| GET | `/groups/:id/members` | 멤버 목록 |
| PUT | `/groups/:id/members/:userId` | 멤버 권한 수정 |

### 9.4 냉장고 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/ingredients?groupId=` | 재료 목록 |
| POST | `/ingredients` | 재료 추가 |
| PUT | `/ingredients/:id` | 재료 수정 |
| DELETE | `/ingredients/:id` | 재료 삭제 |
| PATCH | `/ingredients/:id/consume` | 소진 처리 |
| GET | `/ingredients/expiring?groupId=&days=3` | 유통기한 임박 재료 |

### 9.5 쇼핑 리스트 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/shopping?groupId=` | 쇼핑 리스트 조회 |
| POST | `/shopping` | 항목 추가 |
| POST | `/shopping/generate` | 식단 기반 자동 생성 |
| PATCH | `/shopping/:id/check` | 체크 토글 |
| DELETE | `/shopping/:id` | 항목 삭제 |
| DELETE | `/shopping/checked?groupId=` | 완료 항목 전체 삭제 |

---

## 10. 화면 구성 (IA)

```
MealPlan App
│
├── 온보딩
│   ├── 스플래시
│   ├── 로그인
│   ├── 회원가입
│   └── 소셜 로그인
│
├── 홈 (Today)
│   ├── 오늘의 아침/점심/저녁 카드
│   ├── 빠른 식단 추가
│   └── 냉장고 임박 재료 배너
│
├── 캘린더
│   ├── 월간 캘린더 뷰
│   │   └── 날짜 탭 → 식단 상세
│   └── 식단 추가/수정 모달
│
├── 주간 리스트
│   ├── 주 단위 슬라이드 뷰
│   ├── 아침/점심/저녁 행 구성
│   └── 빠른 편집
│
├── 냉장고
│   ├── 재료 목록 (카테고리 탭)
│   ├── 재료 추가
│   └── 유통기한 임박 목록
│
├── 쇼핑
│   ├── 쇼핑 리스트
│   ├── 자동 생성 버튼
│   └── 항목 체크
│
└── 설정
    ├── 프로필
    ├── 그룹 관리
    │   ├── 그룹 생성
    │   ├── 초대 코드 공유
    │   └── 멤버 관리
    ├── 알림 설정
    ├── 다크 모드
    └── 로그아웃
```

---

## 11. 개발 단계 및 일정

### Phase 1 - MVP (4~5주)

| 주차 | 작업 내용 |
|------|-----------|
| 1주 | 프로젝트 세팅 (Expo, NestJS, Supabase 연동), 인증 구현 |
| 2주 | 식단 CRUD, 캘린더 뷰 구현 |
| 3주 | 주간 리스트 뷰, 냉장고 재료 관리 |
| 4주 | 홈 화면, 내부 테스트, 버그 수정 |
| 5주 | 디자인 다듬기, TestFlight / 내부 테스트 배포 |

**Phase 1 결과물:** 식단 입력·조회(캘린더/리스트), 냉장고 관리, 기본 회원가입

### Phase 2 - 핵심 기능 (3~4주)

| 주차 | 작업 내용 |
|------|-----------|
| 6주 | 그룹 생성 / 초대 / 공유 기능 |
| 7주 | 쇼핑 리스트 (수동 + 자동 생성) |
| 8주 | 푸시 알림 (식단 알림, 유통기한 알림) |
| 9주 | 반복 식단, 템플릿 기능 |

### Phase 3 - 배포 및 추가 기능 (2~3주)

| 주차 | 작업 내용 |
|------|-----------|
| 10주 | App Store / Play Store 심사 제출 |
| 11주 | 심사 대응, 수정, 재제출 |
| 12주 | 연간 뷰, 다크 모드, 다국어 (선택) |

---

## 12. 비용 계획

### 무료 구간 인프라

| 서비스 | 무료 한도 | 초과 비용 |
|--------|-----------|-----------|
| **Supabase** | DB 500MB, MAU 50,000 | $25/월~ |
| **Render.com** | 750시간/월, RAM 512MB | $7/월~ |
| **Expo EAS** | 월 30 빌드 | $99/월~ |

### 필수 비용 (앱스토어)

| 항목 | 비용 | 주기 |
|------|------|------|
| Apple Developer Program | $99 | 연간 |
| Google Play Console | $25 | 1회 |

### 단계별 예상 비용

```
Phase 1~2 (개발 중)
  └── $0 (모두 무료 플랜)

Phase 3 (앱스토어 배포)
  └── $124 (Apple $99 + Google $25)

사용자 증가 후 (MAU 1,000+)
  └── 예상 $30~50/월 (Supabase Pro + Render 유료)
```

---

## 13. 배포 전략

### 모바일 앱 배포

```
1. Expo EAS Build
   $ eas build --platform all

2. 심사 제출
   - iOS: App Store Connect → TestFlight → 심사
   - Android: Play Console → 내부 테스트 → 심사

3. OTA 업데이트 (앱스토어 심사 없이 JS 코드 업데이트)
   $ eas update --branch production
```

### 백엔드 배포 (Render.com)

```
1. GitHub 연결
   - main 브랜치 push → 자동 배포

2. 환경변수 설정
   DATABASE_URL=postgresql://...
   SUPABASE_URL=https://...
   SUPABASE_ANON_KEY=...
   JWT_SECRET=...

3. 주의: 무료 플랜은 15분 미사용 시 슬립
   → 첫 요청 30초 지연 발생 (유료 업그레이드로 해결)
```

### 환경 구성

```
개발 (dev)     → 로컬 NestJS + Supabase Local
스테이징 (stg) → Render.com + Supabase (별도 프로젝트)
프로덕션 (prod)→ Render.com + Supabase (메인 프로젝트)
```

---

## 부록 A. 프로젝트 폴더 구조

```
mealplan/
├── apps/
│   └── mobile/          # Expo (React Native)
│       ├── app/         # Expo Router 화면
│       ├── components/
│       ├── hooks/
│       ├── store/       # Zustand
│       └── utils/
│
├── packages/
│   ├── api/             # NestJS 백엔드
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── meal-plans/
│   │   │   ├── groups/
│   │   │   ├── ingredients/
│   │   │   └── shopping/
│   │   └── prisma/
│   │       └── schema.prisma
│   │
│   └── shared/          # 공통 타입, 유틸
│       └── types/
│
└── package.json         # Turborepo 모노레포
```

---

*문서 버전: 1.0.0 | 최종 수정: 2026-03-22*
