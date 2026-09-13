// 항목 상세 펼침 — 강의 · 콘텐츠 · 연구과제 · 논문 · 자격 공통

// 제목에서 공백을 제거해 비교 (마크다운 키와 HTML 제목의 공백 차이 흡수)
const norm = s => s.replace(/\s+/g, '');

function findDetail(title) {
  const t = norm(title);
  // 긴 키부터 검사해야 "(AI CCTV)" 같은 변형이 먼저 잡힙니다
  const keys = DETAIL_KEYS.slice().sort((a, b) => norm(b).length - norm(a).length);
  for (const k of keys) if (t.includes(norm(k))) return LECTURE_DETAILS[k];
  return null;
}

// 문자열 또는 { src, caption } 둘 다 허용
// { src, thumb, caption } 또는 문자열.  thumb 는 목록에 쓰는 작은 이미지입니다.
function normPhoto(p) { return typeof p === 'string' ? { src: p, caption: '' } : p; }
function normVideo(v) { return typeof v === 'string' ? { id: v, caption: '' } : v; }

function buildGallery(list, label, cls) {
  const items = list.map(normPhoto);
  const block = document.createElement('div');
  block.className = 'detail-block';

  const lbl = document.createElement('div');
  lbl.className = 'detail-label';
  lbl.textContent = label;
  block.appendChild(lbl);

  const row = document.createElement('div');
  row.className = 'detail-gallery ' + cls;

  items.forEach((p, i) => {
    const fig = document.createElement('div');
    fig.className = 'gal-item';

    const img = document.createElement('img');
    // 목록에는 썸네일을, 크게 볼 때만 원본을 씁니다
    img.src = p.thumb || p.src;
    img.alt = p.caption || label;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('click', () => openLightbox(items, i));
    fig.appendChild(img);

    if (p.caption) {
      const cap = document.createElement('div');
      cap.className = 'gal-caption';
      cap.textContent = p.caption;
      fig.appendChild(cap);
    }
    row.appendChild(fig);
  });

  block.appendChild(row);
  return block;
}

function buildVideos(list) {
  const block = document.createElement('div');
  block.className = 'detail-block';
  block.innerHTML = '<div class="detail-label">영상</div>';

  const row = document.createElement('div');
  row.className = 'detail-videos';

  list.map(normVideo).forEach(v => {
    const wrap = document.createElement('div');

    const box = document.createElement('div');
    box.className = 'detail-video';
    box.innerHTML =
      '<img src="https://img.youtube.com/vi/' + v.id + '/hqdefault.jpg" alt="' +
      (v.caption || '영상 미리보기') + '"><div class="play">\u25B6</div>';
    // 클릭 시점에 iframe 생성 — 미리 심어두면 페이지가 느려집니다
    box.addEventListener('click', () => {
      box.innerHTML = '<iframe src="https://www.youtube.com/embed/' + v.id +
        '?autoplay=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
      box.style.cursor = 'default';
    });
    wrap.appendChild(box);

    if (v.caption) {
      const cap = document.createElement('div');
      cap.className = 'gal-caption';
      cap.textContent = v.caption;
      wrap.appendChild(cap);
    }
    row.appendChild(wrap);
  });

  block.appendChild(row);
  return block;
}

function buildPapers(list) {
  const block = document.createElement('div');
  block.className = 'detail-block';
  block.innerHTML = '<div class="detail-label">이 과제에서 나온 논문 ' + list.length + '편</div>';

  const wrap = document.createElement('div');
  wrap.className = 'detail-papers';

  list.forEach(p => {
    const row = document.createElement('div');
    row.className = 'dpaper';

    const date = document.createElement('div');
    date.className = 'dpaper-date';
    date.textContent = p.date || '';

    const body = document.createElement('div');

    const title = document.createElement('div');
    title.className = 'dpaper-title';
    title.textContent = p.title;
    body.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'dpaper-meta';
    meta.textContent = [p.role, p.venue].filter(Boolean).join('  ·  ');
    body.appendChild(meta);

    if (p.tags && p.tags.length) {
      const tags = document.createElement('div');
      tags.className = 'dpaper-tags';
      p.tags.forEach(x => {
        const t = document.createElement('span');
        t.className = 'tag';
        t.textContent = x;
        tags.appendChild(t);
      });
      body.appendChild(tags);
    }

    row.appendChild(date);
    row.appendChild(body);
    wrap.appendChild(row);
  });

  block.appendChild(wrap);
  return block;
}

function buildLinks(list) {
  const block = document.createElement('div');
  block.className = 'detail-block detail-links';
  list.forEach(l => {
    const a = document.createElement('a');
    a.href = l.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.className = 'detail-link';
    a.textContent = l.label + ' \u2197';
    block.appendChild(a);
  });
  return block;
}

function buildDetail(d, media) {
  const wrap = document.createElement('div');
  wrap.className = 'lecture-detail';

  // 항목별 개요가 있으면 그것을, 없으면 제목 기준 공용 개요를 씁니다
  if (media && media.summary) d = media;

  if (d && d.summary) {
    const sum = document.createElement('div');
    sum.className = 'detail-summary';
    d.summary.forEach(line => {
      const p = document.createElement('p');
      p.textContent = line;
      sum.appendChild(p);
    });
    wrap.appendChild(sum);
  }

  // 사진·영상은 회차별 데이터에서 가져옵니다. 없는 그룹은 그리지 않습니다.
  const m = media || {};
  if (m.papers && m.papers.length) wrap.appendChild(buildPapers(m.papers));
  if (m.videos && m.videos.length) wrap.appendChild(buildVideos(m.videos));
  if (m.images && m.images.length) wrap.appendChild(buildGallery(m.images, '증빙 자료', 'works'));
  if (m.works && m.works.length) wrap.appendChild(buildGallery(m.works, '결과물', 'works'));
  if (m.onsite && m.onsite.length) wrap.appendChild(buildGallery(m.onsite, '수업 현장', 'onsite'));
  if (m.links && m.links.length) wrap.appendChild(buildLinks(m.links));

  return wrap;
}

function toggleDetail(item) {
  const open = item.classList.contains('open');

  // 하나만 열리도록 나머지는 닫습니다
  document.querySelectorAll('.has-detail.open').forEach(other => {
    other.classList.remove('open');
    const d = other.querySelector('.lecture-detail');
    if (d) d.remove();
    if (other._btn) {
      other._btn.querySelector('.detail-btn-label').textContent = '자세히';
      other._btn.setAttribute('aria-expanded', 'false');
    }
  });

  if (open) return;

  const detail = buildDetail(item._detail, item._media);
  item.appendChild(detail);
  item.classList.add('open');
  item._btn.querySelector('.detail-btn-label').textContent = '접기';
  item._btn.setAttribute('aria-expanded', 'true');
}

// 항목 하나의 상세 데이터를 모읍니다.
//   data.js  (ITEM_DETAILS)    — 손으로 쓴 설명 · 논문 · 링크 · 자격 증빙
//   media.js (GENERATED_MEDIA) — build_media.py 가 폴더를 훑어 만든 사진 · 영상
// 같은 항목이 양쪽에 있으면 손으로 쓴 쪽을 우선합니다.
function mediaFor(lid) {
  const hand = (typeof ITEM_DETAILS !== 'undefined' && ITEM_DETAILS[lid]) || null;
  const auto = (typeof GENERATED_MEDIA !== 'undefined' && GENERATED_MEDIA[lid]) || null;
  if (!hand && !auto) return null;
  return Object.assign({}, auto, hand);
}

// data-lid 가 있는 모든 항목에 펼침 기능을 연결합니다.
// 강의·콘텐츠·연구과제·논문·자격 어느 섹션이든 동일하게 동작합니다.
function initItemDetails() {
  document.querySelectorAll('[data-lid]').forEach(item => {
    // 자격 섹션은 별도의 "레퍼런스" 버튼으로 바로 띄우므로 제외합니다
    if (item.closest('#credentials')) return;

    const titleEl = item.querySelector('.lecture-title, .timeline-role, .paper-title');
    const detail = titleEl ? findDetail(titleEl.textContent) : null;  // 제목 기준 공용 개요
    const media = mediaFor(item.dataset.lid);                         // 항목 고유 데이터
    if (!detail && !media) return;                                    // 보여줄 게 없으면 버튼도 없음

    item._detail = detail;
    item._media = media;
    item.classList.add('has-detail');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'detail-btn';
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span class="detail-btn-label">자세히</span>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<polyline points="6 9 12 15 18 9"></polyline></svg>';
    item.appendChild(btn);
    item._btn = btn;

    item.addEventListener('click', e => {
      if (e.target.closest('.lecture-detail')) return;
      toggleDetail(item);
    });
    btn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDetail(item); }
    });
  });
}

// 자주 눌리는 이미지를 화면이 한가할 때 미리 받아 둡니다.
// 한꺼번에 요청하지 않고 한 장씩 순서대로 받습니다.
// PRELOAD_IMAGES 는 data.js 에서 관리합니다. 여기에 많이 넣지 마십시오.
function preloadDetailImages() {
  const run = () => warmSequential(PRELOAD_IMAGES);
  if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 3000 });
  else setTimeout(run, 1200);
}
