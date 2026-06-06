# 클라우드 배포 메모

현재 앱은 로컬에서는 `data/dividends.json`에 저장하고, 배포 환경에서는 아래 환경변수가 있으면 Supabase를 데이터베이스로 사용합니다.

## 필요한 서비스

- Supabase: 계좌와 배당 내역 저장
- Render/Railway/Fly.io 같은 Node 서버 호스팅: `node server.js` 실행

## Supabase 설정

1. Supabase 프로젝트를 만듭니다.
2. SQL Editor에서 `supabase-schema.sql` 내용을 실행합니다.
3. `accounts` 테이블에 기본 계좌를 넣습니다.

```sql
insert into public.accounts (id, label) values
  ('my-us', '내 미국주식'),
  ('my-isa', '내 ISA'),
  ('wife-us', '와이프 미국주식')
on conflict (id) do update set label = excluded.label;
```

## 서버 환경변수

호스팅 서비스 설정 화면에 아래 값을 넣습니다.

- `DIVIDEND_NOTE_PASSWORD`: 로그인 암호
- `SUPABASE_URL`: Supabase Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `PORT`: 호스팅 서비스가 자동 지정하면 생략 가능

## 실행 명령

```bash
npm start
```

## 주의

`SUPABASE_SERVICE_ROLE_KEY`는 브라우저에 노출되면 안 됩니다. 이 앱은 서버에서만 이 키를 사용합니다.
