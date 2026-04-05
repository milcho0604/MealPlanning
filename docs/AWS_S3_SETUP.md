# AWS S3 설정 가이드 (복붙용)

MealPlan 앱의 식단 사진 업로드를 위한 AWS S3 설정 가이드입니다.
모든 값을 복사-붙여넣기만 하면 됩니다.

---

## 1단계: AWS 계정 생성

https://aws.amazon.com 에서 계정 생성 (이미 있으면 건너뛰기)

---

## 2단계: S3 버킷 만들기

1. AWS 콘솔 로그인 → 상단 검색창에 `S3` 입력 → S3 서비스 클릭
2. **"버킷 만들기"** 클릭
3. 아래 값 입력:

| 항목 | 값 |
|------|-----|
| 버킷 이름 | `mealplan-photos` (이미 사용 중이면 `mealplan-photos-0604` 등으로 변경) |
| AWS 리전 | **아시아 태평양(서울) ap-northeast-2** |

4. **"이 버킷의 퍼블릭 액세스 차단 설정"** 섹션에서:
   - ☐ **"모든 퍼블릭 액세스 차단" 체크 해제**
   - 경고 확인 체크박스에 **체크**

5. 나머지는 기본값 → **"버킷 만들기"** 클릭

---

## 3단계: 버킷 정책 설정 (공개 읽기)

1. 생성된 버킷 클릭 → **"권한"** 탭
2. **"버킷 정책"** 섹션 → **"편집"** 클릭
3. 아래 JSON을 **그대로 복사 붙여넣기** (버킷 이름이 다르면 `mealplan-photos` 부분만 변경):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::mealplan-photos/*"
    }
  ]
}
```

4. **"변경 사항 저장"** 클릭

---

## 4단계: CORS 설정 (모바일 업로드 허용)

1. 같은 **"권한"** 탭에서 스크롤 내려서 **"CORS(Cross-origin 리소스 공유)"** 섹션 → **"편집"**
2. 아래 JSON을 **그대로 복사 붙여넣기**:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

3. **"변경 사항 저장"** 클릭

---

## 5단계: IAM 사용자 만들기 (API 키 발급)

1. AWS 콘솔 상단 검색창에 `IAM` 입력 → IAM 서비스 클릭
2. 왼쪽 메뉴에서 **"사용자"** 클릭 → **"사용자 생성"**
3. 사용자 이름: `mealplan-api` → **"다음"**
4. **"직접 정책 연결"** 선택 → 검색창에 `AmazonS3FullAccess` 입력 → **체크** → **"다음"**
5. **"사용자 생성"** 클릭
6. 생성된 사용자 클릭 → **"보안 자격 증명"** 탭 → **"액세스 키 만들기"**
7. **"AWS 외부에서 실행되는 애플리케이션"** 선택 → **"다음"** → **"액세스 키 만들기"**
8. ⚠️ **Access Key ID** 와 **Secret Access Key** 를 복사해서 저장 (이 화면 벗어나면 다시 볼 수 없음!)

---

## 6단계: Render 환경변수 추가

1. https://dashboard.render.com → mealplan-api 서비스 클릭
2. **"Environment"** 탭 → **"Add Environment Variable"**
3. 아래 4개를 하나씩 추가:

| Key | Value |
|-----|-------|
| `AWS_ACCESS_KEY_ID` | (5단계에서 복사한 Access Key ID) |
| `AWS_SECRET_ACCESS_KEY` | (5단계에서 복사한 Secret Access Key) |
| `AWS_REGION` | `ap-northeast-2` |
| `AWS_S3_BUCKET` | `mealplan-photos` (2단계에서 만든 버킷 이름) |

4. **"Save Changes"** 클릭 → 서비스가 자동 재배포됩니다

---

## 완료!

설정이 끝나면 앱에서 식단 추가/수정 시 **갤러리/카메라** 버튼이 동작합니다.
사진은 자동으로 1080px 리사이즈 + JPEG 압축 후 S3에 업로드됩니다.

### 비용 참고
- 12개월 무료: 5GB 저장 + 20,000 GET/월 + 2,000 PUT/월
- 이후: 월 100~300원 수준 (식단 앱 규모 기준)
