# 배당노트

부부 전용 배당캘린더 MVP입니다.

## 실행

```powershell
C:\Users\zona0\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe server.js
```

브라우저에서 `http://localhost:4180`을 엽니다.

## 로그인

기본 암호는 `1234`입니다.

배포 전에는 환경변수 `DIVIDEND_NOTE_PASSWORD`로 바꾸는 것을 권장합니다.

## 데이터

배당 내역은 `data/dividends.json`에 저장됩니다.

클라우드 배포 시에는 `SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY` 환경변수를 설정하면 Supabase 데이터베이스를 사용합니다. 자세한 내용은 `DEPLOY.md`를 참고하세요.

지원 기능:

- 계좌별 필터
- 종목명/계좌명 검색
- 월별 배당 합계
- 날짜별 배당 총액과 건수
- 배당 추가, 수정, 삭제
- 다크모드
