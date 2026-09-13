# 이동욱 포트폴리오

AI·SW 교육 강사 포트폴리오 사이트. 정적 파일만으로 동작하며 빌드 도구나 서버가 필요 없습니다.

- 공개 주소: https://raynorstudio.github.io/
- 구성: HTML 1개 + CSS 5개 + JS 6개 + 파이썬 도구 2개
- 대상: 부트캠프·KDT 기관 담당자, 대학 사업단, 기업 교육 매니저

내용은 크게 둘로 나뉩니다. **손으로 쓰는 글은 `src/js/data.js`**, **사진과 영상은 폴더에 넣고 `build_media.py` 실행**입니다. `index.html` 을 직접 열 일은 거의 없습니다.

---

## 폴더 구조

```
portfolio/
├── index.html                  마크업. 섹션과 항목 목록
├── README.md                   이 문서
├── build_media.py              사진 변환 · 폴더 관리 · 자격증 썸네일
├── image_tool.py               OG 이미지 제작 · 개인정보 가리기 (GUI)
└── src/
    ├── css/                    스타일 5개
    ├── js/                     동작 6개
    ├── img/
    │   ├── profile.jpg         프로필 사진
    │   ├── og_profile.jpg      링크 미리보기용 (1200×630)
    │   └── lectures/           항목별 사진 폴더 43개
    │       └── _작업목록.md     어느 항목이 비었는지 자동 정리
    └── qualifications/         자격증 이미지
        └── thumb/              자동 생성 썸네일
```

---

## 페이지 구성

| 섹션 | id | 내용 |
|---|---|---|
| 소개 | `about` | 재직 이력 4건 |
| 강의경력 | `lectures` | 38건. 성인·재직자 8건(펼침) / 공교육 30건(접힘) |
| 교육 콘텐츠 개발 · 운영 | `edu-content` | 5건. 플립러닝 콘텐츠, 모빌리티 캠프 |
| 자격 · 직업훈련 | `credentials` | NCS 확인강사 2직종, 정보처리기사, ISTQB |
| 참여 사업 · 연구 과제 | `research` | 과제 4건 + 그 안에 논문 14편 |
| 연락처 | `contact` | 전화 · 이메일 · GitHub |

### 설계 원칙

- **대상으로 먼저 나눕니다.** 성인·재직자를 위에 펼치고 공교육은 접습니다. 나란히 펼치면 8 대 30이 직접 비교되어 의도와 반대로 읽힙니다
- **구분 필터는 보조 수단입니다.** 기본값은 `전체`이며, 어떤 항목도 첫 화면에서 숨기지 않습니다
- **논문은 과제 안에 넣습니다.** 같은 프로젝트의 산출물이므로 따로 두면 연결이 끊깁니다
- **사진은 클릭하기 전까지 내려받지 않습니다.** 스크롤만 하는 방문자는 이미지 트래픽이 0입니다

---

## JavaScript 모듈

로드 순서가 정해져 있습니다. `main.js` 는 반드시 마지막입니다.

```html
<script src="src/js/data.js"></script>
<script src="src/js/media.js"></script>
<script src="src/js/lightbox.js"></script>
<script src="src/js/lectures.js"></script>
<script src="src/js/ui.js"></script>
<script src="src/js/main.js"></script>
```

### `data.js` — 손으로 쓰는 내용

| 상수 | 용도 |
|---|---|
| `LECTURE_DETAILS` | **강의명 기준** 공용 개요. 같은 특강이 여러 회차면 한 번만 쓰면 됩니다 |
| `DETAIL_KEYS` | 위의 키 목록. 자동 계산 |
| `ITEM_DETAILS` | **항목 번호(`data-lid`) 기준** 개별 데이터. 자격 증빙, 과제별 논문, 링크 |
| `PRELOAD_IMAGES` | 페이지가 한가할 때 미리 받을 이미지. 자격증만 넣습니다 |
| `openRefs(lid)` | 자격 섹션의 "레퍼런스" 버튼이 호출 |

`ITEM_DETAILS` 한 항목에 쓸 수 있는 것:

```js
'res-drone': {
  summary: ['문단 1', '문단 2'],
  papers:  [{ date, title, role, venue, tags: [] }],
  works:   [{ src, thumb, caption }],   // 결과물 사진
  onsite:  [ ... ],                     // 현장 사진
  images:  [ ... ],                     // 분류 없는 사진(증빙 등)
  videos:  [{ id, caption }],           // 유튜브
  links:   [{ label, url }],
}
```

> JSON 이 아니라 JS 인 이유: `fetch` 없이 즉시 로드되고, 로컬에서 파일을 직접 열어도 동작하며, **주석을 쓸 수 있기 때문**입니다. 손으로 고치는 파일이므로 주석이 중요합니다.
> 대신 쉼표 하나만 빠져도 파일 전체가 조용히 죽습니다. 고친 뒤 개발자 도구 콘솔에 빨간 오류가 없는지 확인하십시오.

### `media.js` — 자동 생성

`build_media.py` 가 폴더를 훑어 만듭니다. **직접 고치지 마십시오. 다음 실행에서 덮어씁니다.**
`GENERATED_MEDIA` 하나만 정의합니다.

### `lectures.js` — 상세 펼침

`data-lid` 가 붙은 모든 항목에 "자세히" 버튼을 달고, 누르면 상세 블록을 조립합니다. 강의·콘텐츠·연구과제가 같은 코드로 동작합니다.

| 함수 | 역할 |
|---|---|
| `mediaFor(lid)` | `ITEM_DETAILS` + `GENERATED_MEDIA` 병합. **손으로 쓴 쪽이 우선** |
| `findDetail(title)` | 강의명으로 공용 개요 찾기. 긴 키부터 검사 |
| `buildGallery` / `buildVideos` / `buildPapers` / `buildLinks` | 각 블록 생성 |
| `buildDetail` | 위를 순서대로 조립 |
| `toggleDetail` | 하나만 열리도록 나머지를 닫음 |
| `initItemDetails` | 페이지 로드 시 버튼 연결. 자격 섹션은 제외 |
| `preloadDetailImages` | 자격증 이미지를 유휴 시간에 순차 수신 |

### `lightbox.js` — 이미지 확대

느려 보이지 않게 하는 장치가 세 개 들어 있습니다.

1. 받은 이미지를 `IMG_CACHE` 에 담아 **참조를 유지**합니다. 참조가 없으면 브라우저가 다운로드를 취소합니다
2. `thumb` 이 있으면 **먼저 띄우고** 원본이 준비되면 바꿔치기합니다. 체감 대기 0
3. 보고 있는 것의 **앞뒤 한 장씩만** 미리 받습니다

원본을 받는 동안 약한 블러와 스피너가 표시됩니다. 닫아도 `src` 를 비우지 않으므로 다시 열 때는 즉시 뜹니다.

### `ui.js` — 접기 · 필터 · 이동

`toggleSection` / `toggleYear` / `toggleAudience` / `filterLectures` / `scrollToTop` / `initToTop`.
`filterLectures` 는 표시 개수를 다시 세어 연도·대상 그룹의 건수 표기를 갱신하고, 결과가 0인 그룹은 감춥니다.

### `main.js` — 초기화

`DOMContentLoaded` 에서 `filterLectures('전체')` → `initItemDetails()` → `initToTop()` → `preloadDetailImages()` 순으로 호출합니다.

---

## CSS 모듈

| 파일 | 내용 |
|---|---|
| `base.css` | 색상 변수(`--ink`, `--accent` 등), 리셋, 기본 타이포 |
| `layout.css` | 네비게이션, 히어로, 섹션 골격, 접기 공통 |
| `components.css` | 강의 항목, 대상 그룹, 뱃지, 상세 패널, 라이트박스, 논문 목록, 맨 위로 |
| `print.css` | 인쇄·PDF 저장 시 접힌 내용을 모두 펼침 |
| `responsive.css` | 680px 이하 |

`print.css` 와 `responsive.css` 는 다른 파일을 덮어쓰는 성격이라 분리했습니다. 섞여 있으면 어디서 값이 바뀌는지 추적이 안 됩니다.

---

## 파이썬 도구

둘 다 `pip install` 한 번 후 VSCode 에서 실행(F5) 만 하면 됩니다. 터미널 인자는 없습니다.

### `build_media.py`

```
pip install pillow
```

1. `index.html` 을 읽어 항목 43건을 확인하고, 없는 폴더를 만듭니다
2. 각 폴더의 원본 사진을 변환합니다
   - `_web/01.webp` — 긴 변 1400px, 품질 80 (확대용)
   - `_web/t_01.webp` — 긴 변 480px, 품질 72 (썸네일)
3. `src/qualifications/` 의 자격증 이미지로 `thumb/` 썸네일을 만듭니다
4. `src/js/media.js` 를 다시 씁니다
5. `src/img/lectures/_작업목록.md` 에 진행 상황을 정리합니다

**폴더 규칙은 하나뿐입니다. 맨 앞 `_` 앞이 항목 번호(`data-lid`)여야 합니다.** 그 뒤 설명은 마음대로 줄이거나 영문으로 바꿔도 됩니다.

```
src/img/lectures/2026-05080528_한국승강기대학교_재직자대상AI에이전트실무자동화/
    summary.txt     (선택) 한 줄 = 한 문단
    videos.txt      (선택) 한 줄 = 유튜브ID | 설명
    works/          결과물 사진 원본. 크기·형식 무관
    onsite/         현장 사진
    _web/           자동 생성. 건드리지 마십시오
```

파일 이름이 캡션이 됩니다. `01_학생 결과물.jpg` → 캡션 `학생 결과물`. 번호 순으로 정렬되므로 `01`, `02` 로 두십시오.

한 항목에 **3~5장**을 권합니다. 6장을 넘으면 경고가 표시됩니다.
이미 변환한 파일은 원본이 바뀌지 않는 한 건너뛰므로, 몇 번을 실행해도 안전합니다.

> 카테고리(정규수업·멘토링·특강, 성인·공교육)를 폴더 경로에 넣지 않았습니다. 분류는 바뀌는 값이고, 실제로 이 프로젝트에서 두 번 바뀌었습니다. 경로에 넣으면 분류를 바꿀 때마다 파일을 옮기고 모든 주소가 깨집니다. 날짜 기반 `data-lid` 는 바뀌지 않습니다.

### `image_tool.py`

```
pip install PySide6
```

**탭 1 — OG 이미지 만들기**
프로필 사진과 문구를 합쳐 링크 미리보기 이미지를 만듭니다. 크기·문구·형식(JPG/PNG/WEBP/BMP/TIFF)·품질을 지정할 수 있고, 글자 크기가 출력 크기에 비례합니다. `문구 없이 크기·형식만 변환` 버튼으로 일반 변환도 됩니다.

**탭 2 — 개인정보 가리기**
폴더의 이미지를 목록으로 보고, 가운데 뷰에서 직접 영역을 지정해 검은 사각형으로 덮습니다.

- `Ctrl + 휠` 확대·축소 / 휠 스크롤 / 빈 곳 드래그로 이동
- 아래 오른쪽의 `−` `+` 슬라이더 `창에 맞춤`
- 이미지 위를 **두 번 클릭** (왼쪽 위 → 오른쪽 아래)
- `Ctrl+Z` 되돌리기, `Esc` 취소
- 기본은 `_masked` 새 파일 저장. 원본 덮어쓰기는 확인 후

---

## 자주 하는 작업

### 강의 항목 추가

1. `index.html` 의 해당 대상 그룹에 `lecture-item` 한 줄 추가. `data-type` 과 `data-lid` 필수
2. 섹션 머리 건수, 필터 버튼 숫자, 지표 4칸 갱신
3. 필요하면 `data.js` 의 `LECTURE_DETAILS` 에 개요 추가
4. `build_media.py` 실행 → 폴더 자동 생성 → 사진 투입 → 다시 실행

### 사진만 추가

폴더의 `works/` 또는 `onsite/` 에 넣고 `build_media.py` 실행. 그게 전부입니다.

### 자격증 교체

`src/qualifications/` 에 `.webp` 로 넣고 `build_media.py` 실행. `data.js` 의 `ITEM_DETAILS['cert-*']` 경로가 파일명과 맞는지만 확인하십시오.

### OG 이미지 교체

`image_tool.py` 탭 1 → `src/img/` 에 저장 → `index.html` 의 `og:image` 경로 확인.

카카오톡·페이스북은 미리보기를 서버에 캐시합니다. 바꿔도 반영되지 않으면 **파일명을 바꾸는 편이 가장 확실합니다** (`og_profile.jpg` → `og_v2.jpg`). 캐시 초기화는 카카오 디벨로퍼스의 공유 디버거에서도 할 수 있습니다.

---

## 배포

GitHub Pages. 폴더 전체를 푸시하면 1~2분 후 반영됩니다.

- `index.html` 만 덮어쓰지 마십시오. CSS·JS 가 없으면 스타일이 통째로 사라집니다
- 확장자 대소문자를 파일과 정확히 맞추십시오. `ISTQB1.webp` 와 `ISTQB1.WEBP` 는 다른 파일로 취급됩니다
- `og:url` 과 `og:image` 는 **절대경로**여야 합니다. 상대경로면 크롤러가 이미지를 가져오지 못합니다
- 확인할 때는 `Ctrl+Shift+R` (Mac `Cmd+Shift+R`) 로 캐시를 비우십시오

로컬 확인은 파일 더블클릭(`file://`)으로도 되지만, 아래처럼 띄우는 편이 안전합니다.

```
python3 -m http.server 8000
```

---

## 남은 일

- [ ] `src/img/lectures/` 사진 채우기 — 승강기대, 캡스톤 멘토링, 대도중 바이브코딩 우선
- [ ] 2026.07 캠프 명칭 확인 (7월인데 "윈터캠프". 계약서 원문 대조 필요)
- [ ] 공저 논문 저자 순위를 논문 원문과 대조
- [ ] 개인 프로젝트 섹션 신설 — 강의경력 다음 자리. 배포 URL 과 정량 결과가 나온 뒤에
- [ ] 참여 사업·연구 과제 4건 → 11건 확장
- [ ] 강의 태그를 도구 나열에서 결과 중심으로 전환
