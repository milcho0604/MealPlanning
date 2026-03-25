/**
 * expo/src/winter/ImportMetaRegistry mock
 *
 * Jest 테스트 환경에서 getBundleUrl()이 scope 오류를 발생시키는 것을 방지합니다.
 * Expo 런타임의 __ExpoImportMetaRegistry 글로벌 설치 과정에서 호출됩니다.
 */

const ImportMetaRegistry = {
  get url() {
    return 'http://localhost:8081/';
  },
};

module.exports = { ImportMetaRegistry };
