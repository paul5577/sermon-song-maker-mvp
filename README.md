# Sermon Song Maker — 설교찬양 영상 생성기 MVP

`설교가 찬양이 되다` 시리즈를 위한 모바일 우선 MP3 → YouTube MP4 자동 생성 웹앱입니다.

## 구현된 사용자 흐름

1. 휴대폰/PC에서 MP3 선택
2. 찬양 제목·성경 본문·예배 구분·날짜·설교자·강해명 입력
3. `영상 만들기` 클릭
4. 프로젝트가 `queued` 상태로 저장됨
5. 별도 Render Worker가 FFmpeg로 렌더링
6. 브라우저를 닫아도 Worker는 계속 실행
7. 완료 후 MP4 저장/미리보기 + YouTube 제목·설명·태그 복사

## 영상 규격

- 1920×1080
- 16:9
- H.264 + AAC
- 30fps
- Intro 6초 + Main(MP3 전체) + Outro 8초
- 기본 디자인: Deep Navy / Gold / White

## 구조

```text
Next.js App Router
  ├─ 모바일 입력 UI
  ├─ /api/projects        프로젝트 생성/목록
  ├─ /api/projects/:id    상태 조회
  └─ /api/projects/:id/retry
          ↓
.data/projects/*.json     MVP 영속 Job Queue
.data/uploads/*.mp3
          ↓
별도 node Worker
          ↓
FFmpeg
          ↓
public/generated/*.mp4
```

현재 버전은 외부 계정 없이 핵심 렌더 파이프라인을 즉시 검증하기 위해 **로컬 파일 기반 Queue/Storage**를 기본으로 합니다. `supabase/schema.sql`은 배포형으로 전환할 때 사용할 데이터 구조 초안입니다.

## 요구사항

- Node.js 22+
- npm
- FFmpeg / ffprobe
- 한국어를 지원하는 시스템 폰트
  - Linux 예: NanumGothic, Noto Sans CJK

## 설치

```bash
npm install
cp .env.example .env.local
```

> 이 전달 환경의 npm 프록시에서는 Next.js 패키지가 제공되지 않아 여기서는 `npm install`/`next build` 검증이 불가능했습니다. 일반 PC/VPS의 표준 npm 환경에서는 위 명령으로 설치하면 됩니다.

## 실행

터미널 1 — 웹앱:

```bash
npm run dev
```

터미널 2 — 렌더 Worker:

```bash
npm run worker
```

브라우저에서 `http://localhost:3000` 접속.

## FFmpeg 렌더 엔진만 테스트

Next.js 설치 전에도 Node.js와 FFmpeg가 있으면 다음으로 렌더 엔진을 검증할 수 있습니다.

```bash
npm run test:render
```

테스트는 짧은 임시 MP3를 만들고 실제 1920×1080 MP4를 생성합니다.

## 폰트 지정

자동 탐색되는 Linux 폰트가 없다면 `.env.local` 또는 Worker 환경변수로 지정합니다.

```bash
RENDER_FONT=/absolute/path/to/korean-font.ttf
```

폰트 파일 자체는 프로젝트에 포함하지 않습니다.

## 개인용 MVP 데이터 위치

- 프로젝트 상태: `.data/projects/`
- 원본 MP3: `.data/uploads/`
- 렌더 임시파일: `.data/work/`
- 완성 MP4: `public/generated/`

## 운영 배포 시 중요한 변경점

Vercel 같은 서버리스 프론트에서 큰 MP3를 API Route로 직접 받거나 FFmpeg를 돌리지 않습니다. 운영형은 다음 구조로 교체합니다.

```text
모바일 브라우저
  → Supabase/R2로 MP3 직접 업로드
  → projects 행 생성(status=queued)
  → 별도 Worker(VPS/Render/Fly.io 등)가 DB polling/queue consume
  → MP4를 Storage로 업로드
  → status=completed 업데이트
  → Next.js는 상태와 결과 URL만 표시
```

이렇게 하면 브라우저를 닫아도 렌더링이 유지되고 Vercel 실행시간/업로드 크기 제한을 피할 수 있습니다.

## 다음 버전(v1.5) 권장 순서

1. 파일명 자동 분석
2. 썸네일 1280×720 자동 생성
3. 템플릿 A/B/C/D 선택
4. 예배별 Accent Color
5. 기존 20~30곡 CSV + MP3 일괄 등록
6. Supabase Storage/DB 어댑터
