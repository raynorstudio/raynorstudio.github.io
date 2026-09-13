// 이미지 확대 보기. 자격 증빙과 강의 사진이 함께 사용합니다.
//
// 느려 보이지 않게 하는 세 가지 장치
//   1) 받아 둔 이미지를 Map 에 담아 둡니다. 참조를 붙들고 있어야 브라우저가 버리지 않습니다.
//   2) 썸네일이 있으면 그것부터 즉시 띄우고, 원본이 준비되면 소리 없이 바꿉니다.
//   3) 지금 보는 것의 앞뒤 한 장씩을 미리 받아 둡니다.

let lbList = [], lbIndex = 0, lbToken = 0;

// src -> Image.  참조를 유지해야 미리받기가 중간에 취소되지 않습니다.
const IMG_CACHE = new Map();

function warmImage(src) {
  if (!src) return null;
  let im = IMG_CACHE.get(src);
  if (im) return im;
  im = new Image();
  im.decoding = 'async';
  im.src = src;
  IMG_CACHE.set(src, im);
  return im;
}

function isReady(src) {
  const im = IMG_CACHE.get(src);
  return !!(im && im.complete && im.naturalWidth);
}

// 여러 장을 순서대로, 앞의 것이 끝난 뒤 다음 것을 받습니다.
// 한꺼번에 요청하면 지금 필요한 이미지와 대역폭을 다투게 됩니다.
function warmSequential(list) {
  const queue = list.filter(Boolean).filter(s => !IMG_CACHE.has(s));
  const next = () => {
    const src = queue.shift();
    if (!src) return;
    const im = warmImage(src);
    if (im.complete) return next();
    im.addEventListener('load', next, { once: true });
    im.addEventListener('error', next, { once: true });
  };
  next();
}

function openLightbox(list, index) {
  lbList = list; lbIndex = index;
  document.getElementById('lightbox').hidden = false;
  renderLightbox();
}

function renderLightbox() {
  const box = document.getElementById('lightbox');
  const img = box.querySelector('img');
  const p = lbList[lbIndex];
  const token = ++lbToken;                    // 빠르게 넘길 때 이전 요청이 덮어쓰지 않도록

  const setSrc = s => { if (img.getAttribute('src') !== s) img.src = s; };

  if (isReady(p.src)) {
    setSrc(p.src);
    box.classList.remove('is-loading');
  } else {
    // 아직 없으면 썸네일이라도 먼저 채웁니다. 없으면 빈 화면 대신 스피너만 돕니다.
    if (p.thumb) setSrc(p.thumb);
    box.classList.add('is-loading');

    const im = warmImage(p.src);
    const done = () => {
      if (token !== lbToken) return;          // 그새 다른 사진으로 넘어갔으면 무시
      setSrc(p.src);
      box.classList.remove('is-loading');
    };
    if (im.complete && im.naturalWidth) done();
    else {
      im.addEventListener('load', done, { once: true });
      im.addEventListener('error', () => {
        if (token === lbToken) box.classList.remove('is-loading');
      }, { once: true });
    }
  }

  const cap = box.querySelector('.lightbox-caption');
  cap.textContent = p.caption || '';
  cap.style.display = p.caption ? '' : 'none';

  const multi = lbList.length > 1;
  box.querySelector('.lb-prev').style.display = multi ? '' : 'none';
  box.querySelector('.lb-next').style.display = multi ? '' : 'none';

  // 앞뒤 한 장씩 미리 받아 둡니다
  if (multi) {
    const n = lbList.length;
    warmSequential([
      lbList[(lbIndex + 1) % n].src,
      lbList[(lbIndex - 1 + n) % n].src,
    ]);
  }
}

function moveLightbox(step) {
  if (!lbList.length) return;
  lbIndex = (lbIndex + step + lbList.length) % lbList.length;
  renderLightbox();
}

function closeLightbox() {
  // src 를 비우지 않습니다. 비우면 다시 열 때 내려받기부터 다시 합니다.
  document.getElementById('lightbox').hidden = true;
  lbList = [];
}

document.addEventListener('keydown', e => {
  if (document.getElementById('lightbox').hidden) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') moveLightbox(-1);
  if (e.key === 'ArrowRight') moveLightbox(1);
});
