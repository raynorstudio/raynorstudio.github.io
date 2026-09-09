// 섹션 / 연도 / 대상 그룹 접기, 구분 필터, 맨 위로

// 섹션 접기 / 펼치기
function toggleSection(head) {
  const body = head.nextElementSibling;
  const collapsed = head.classList.toggle('collapsed');
  body.hidden = collapsed;
  head.setAttribute('aria-expanded', String(!collapsed));
  head.querySelector('.toggle-label').textContent = collapsed ? '자세히 보기' : '접기';
}

// 연도 그룹 접기 / 펼치기
function toggleYear(head) {
  const body = head.nextElementSibling;
  const collapsed = head.classList.toggle('collapsed');
  body.hidden = collapsed;
  head.setAttribute('aria-expanded', String(!collapsed));
  head.querySelector('.year-toggle-label').textContent = collapsed ? '자세히 보기' : '접기';
}

// 대상 그룹(성인 / 공교육) 접기 · 펼치기
function toggleAudience(head) {
  const body = head.parentElement.querySelector('.audience-body');
  const collapsed = head.classList.toggle('collapsed');
  body.hidden = collapsed;
  head.setAttribute('aria-expanded', String(!collapsed));
  head.querySelector('.aud-toggle-label').textContent = collapsed ? '자세히 보기' : '접기';
}

// 구분 필터. '전체'가 기본값이며, 어떤 항목도 기본 화면에서 숨기지 않습니다.
function filterLectures(type, btn) {
  document.querySelectorAll('#lectures .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  document.querySelectorAll('#lectures .audience-group').forEach(aud => {
    let audShown = 0;
    let firstVisible = true;

    aud.querySelectorAll('.year-group').forEach(group => {
      let shown = 0;

      group.querySelectorAll('.lecture-item').forEach(item => {
        const show = (type === '전체') || item.dataset.type === type;
        item.style.display = show ? '' : 'none';
        item.classList.remove('is-first');
        if (show) {
          if (shown === 0) item.classList.add('is-first');
          shown++;
        }
      });

      group.hidden = shown === 0;
      const yc = group.querySelector('.year-count');
      if (yc) yc.textContent = shown + '건';

      group.classList.remove('is-first-group');
      if (shown > 0 && firstVisible) {
        group.classList.add('is-first-group');
        firstVisible = false;
      }
      audShown += shown;
    });

    aud.hidden = audShown === 0;
    const ac = aud.querySelector('.aud-count');
    if (ac) ac.textContent = audShown + '건';
  });
}

// 맨 위로 — 히어로를 벗어나면 나타납니다.
function scrollToTop() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
}

function initToTop() {
  const btn = document.getElementById('toTop');
  const hero = document.querySelector('.hero');
  if (!btn || !hero) return;

  const update = () => {
    const past = window.scrollY > (hero.offsetTop + hero.offsetHeight - 120);
    btn.classList.toggle('is-visible', past);
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
}
