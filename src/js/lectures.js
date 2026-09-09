// 강의 항목 상세 펼침 — 개요·사진·영상 조립

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
    img.src = p.src;
    img.alt = p.caption || label;
    img.loading = 'lazy';
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

function buildDetail(d, media) {
  const wrap = document.createElement('div');
  wrap.className = 'lecture-detail';

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
  if (m.videos && m.videos.length) wrap.appendChild(buildVideos(m.videos));
  if (m.works && m.works.length) wrap.appendChild(buildGallery(m.works, '결과물', 'works'));
  if (m.onsite && m.onsite.length) wrap.appendChild(buildGallery(m.onsite, '수업 현장', 'onsite'));

  return wrap;
}

function toggleDetail(item) {
  const open = item.classList.contains('open');

  // 하나만 열리도록 나머지는 닫습니다
  document.querySelectorAll('#lectures .lecture-item.open').forEach(other => {
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

// 상세 정보가 있는 특강 항목에 펼침 기능 연결
function initLectureDetails() {
  // 구분과 무관하게, 개요 데이터가 있는 항목이면 버튼을 붙입니다
  document.querySelectorAll('#lectures .lecture-item').forEach(item => {
    const titleEl = item.querySelector('.lecture-title');
    if (!titleEl) return;

    const d = findDetail(titleEl.textContent);          // 개요 (특강명 기준, 공유)
    const media = LECTURE_MEDIA[item.dataset.lid];      // 사진·영상 (회차별)
    if (!d && !media) return;                           // 보여줄 게 없으면 버튼도 없음

    item._detail = d;
    item._media = media;
    item.classList.add('has-detail');

    // 눈에 보이는 버튼 — 클릭 가능하다는 신호
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

    // 행 어디를 눌러도 열리되, 사진·영상 클릭은 방해하지 않도록 제한
    item.addEventListener('click', e => {
      if (e.target.closest('.lecture-detail')) return;
      toggleDetail(item);
    });
    btn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDetail(item); }
    });
  });
}
