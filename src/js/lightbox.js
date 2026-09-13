// 이미지 확대 보기. 자격 증빙과 강의 사진이 함께 사용합니다.

let lbList = [], lbIndex = 0;

function openLightbox(list, index) {
  lbList = list; lbIndex = index;
  renderLightbox();
  document.getElementById('lightbox').hidden = false;
}

function renderLightbox() {
  const box = document.getElementById('lightbox');
  const p = lbList[lbIndex];
  box.querySelector('img').src = p.src;
  const cap = box.querySelector('.lightbox-caption');
  cap.textContent = p.caption || '';
  cap.style.display = p.caption ? '' : 'none';
  // 사진이 한 장뿐이면 좌우 버튼을 숨깁니다
  const multi = lbList.length > 1;
  box.querySelector('.lb-prev').style.display = multi ? '' : 'none';
  box.querySelector('.lb-next').style.display = multi ? '' : 'none';
}

function moveLightbox(step) {
  if (!lbList.length) return;
  lbIndex = (lbIndex + step + lbList.length) % lbList.length;
  renderLightbox();
}

function closeLightbox() {
  const box = document.getElementById('lightbox');
  box.hidden = true;
  box.querySelector('img').src = '';
  lbList = [];
}

document.addEventListener('keydown', e => {
  if (document.getElementById('lightbox').hidden) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') moveLightbox(-1);
  if (e.key === 'ArrowRight') moveLightbox(1);
});
