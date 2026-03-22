"use strict";
/**
 * @mealplan/shared 패키지 루트 진입점
 *
 * 공통 타입, 상수, 유틸 함수를 모두 이곳에서 내보냅니다.
 * 모바일 앱(apps/mobile)과 API 서버(packages/api) 양쪽에서 사용합니다.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MEMBER_ROLE_LABELS = exports.INGREDIENT_CATEGORY_LABELS = exports.MEAL_TYPE_LABELS = exports.EXPIRY_WARNING_DAYS = exports.DEFAULT_PAGE_SIZE = exports.API_VERSION = void 0;
// 타입 정의 - 각 파일을 직접 임포트 (Node.js ESM 디렉토리 임포트 미지원 대응)
__exportStar(require("./types/api.types"), exports);
__exportStar(require("./types/auth.types"), exports);
__exportStar(require("./types/group.types"), exports);
__exportStar(require("./types/ingredient.types"), exports);
__exportStar(require("./types/meal-plan.types"), exports);
__exportStar(require("./types/shopping.types"), exports);
__exportStar(require("./types/user.types"), exports);
// ─── 공통 상수 ────────────────────────────────────────────────────────────────
/** API 버전 prefix */
exports.API_VERSION = 'v1';
/** 기본 페이지 크기 */
exports.DEFAULT_PAGE_SIZE = 20;
/** 유통기한 임박 기준 (일수) */
exports.EXPIRY_WARNING_DAYS = 3;
/** 식사 타입 목록 (한국어 레이블 포함) */
exports.MEAL_TYPE_LABELS = {
    breakfast: '아침',
    lunch: '점심',
    dinner: '저녁',
    snack: '간식',
};
/** 재료 카테고리 목록 (한국어 레이블 포함) */
exports.INGREDIENT_CATEGORY_LABELS = {
    meat: '육류',
    vegetable: '채소',
    dairy: '유제품',
    seafood: '해산물',
    grain: '곡물',
    sauce: '소스/양념',
    frozen: '냉동식품',
    other: '기타',
};
/** 멤버 역할 목록 (한국어 레이블 포함) */
exports.MEMBER_ROLE_LABELS = {
    owner: '관리자',
    editor: '편집자',
    viewer: '뷰어',
};
//# sourceMappingURL=index.js.map