/**
 * Jest 설정 파일 (모바일)
 *
 * jest-expo 프리셋을 기반으로 모노레포 환경에서 테스트를 실행하기 위한
 * 추가 설정을 포함합니다.
 * - react/react-test-renderer: apps/mobile/node_modules에서 resolve
 * - Expo 런타임 모듈 scope 오류 방지
 */

const path = require('path');

const mobileNodeModules = path.resolve(__dirname, 'node_modules');
const rootNodeModules = path.resolve(__dirname, '../../node_modules');

module.exports = {
  preset: 'jest-expo',

  // 테스트 실행 전 셋업 파일
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],

  // 모노레포: react는 apps/mobile/node_modules에서, 나머지는 루트에서
  moduleNameMapper: {
    // react와 react-test-renderer는 react 버전이 일치해야 하므로 로컬 버전 사용
    '^react$': path.join(mobileNodeModules, 'react', 'index.js'),
    '^react/jsx-runtime$': path.join(mobileNodeModules, 'react', 'jsx-runtime.js'),
    '^react/jsx-dev-runtime$': path.join(mobileNodeModules, 'react', 'jsx-dev-runtime.js'),
    '^react-test-renderer$': path.join(mobileNodeModules, 'react-test-renderer', 'index.js'),
    '^react-test-renderer/(.*)$': path.join(mobileNodeModules, 'react-test-renderer', '$1'),
    // expo-router와 벡터 아이콘 mock
    '^react-native-vector-icons$': '@expo/vector-icons',
    '^react-native-vector-icons/(.*)': '@expo/vector-icons/$1',
    // Expo winter 런타임 mock (getBundleUrl 등 scope 오류 방지)
    '^expo/src/winter$': path.join(__dirname, 'src/__mocks__/expo-winter.js'),
    '^expo/src/winter/(.*)$': path.join(__dirname, 'src/__mocks__/expo-winter.js'),
  },

  // Expo 모노레포에서 haste module system이 scope 오류를 발생시키는 것을 방지
  // apps/mobile/node_modules를 haste roots에 추가
  haste: {
    defaultPlatform: 'ios',
    platforms: ['android', 'ios', 'native'],
  },

  // 변환이 필요한 모듈 설정 (RN 관련 모듈들은 babel 변환 필요)
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],

  // 테스트 파일 경로
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
};
