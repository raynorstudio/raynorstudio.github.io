// 페이지 로드 시 초기화. 반드시 다른 스크립트 뒤에 로드하십시오.

// 페이지 로드 시 '전체' 기준으로 건수만 계산합니다. 숨기는 항목은 없습니다.
document.addEventListener('DOMContentLoaded', () => {
  const defaultBtn = document.querySelector('#lectures .filter-btn[data-filter="전체"]');
  if (defaultBtn) filterLectures('전체', defaultBtn);
  initLectureDetails();
  initToTop();
});
