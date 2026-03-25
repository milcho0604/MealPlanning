/**
 * expo/src/winter mock
 *
 * Jest 테스트 환경에서 Expo 런타임 초기화로 인한 scope 오류를 방지합니다.
 * expo/src/winter는 네이티브 런타임 폴리필을 설치하는데,
 * 테스트 환경에서는 불필요합니다.
 */
module.exports = {};
