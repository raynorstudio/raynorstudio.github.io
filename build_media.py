#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
포트폴리오 미디어 빌더

VSCode 에서 이 파일을 열고 실행(F5) 만 하면 됩니다. 터미널 입력은 없습니다.
    준비 (한 번만):  pip install pillow

--------------------------------------------------------------------
하는 일
--------------------------------------------------------------------
1. index.html 을 읽어 항목 목록을 뽑고, 없는 폴더를 만들어 줍니다.
2. 각 폴더의 원본 사진을 웹용으로 변환합니다.
      원본  ->  _web/(이름).webp        긴 변 1400, 크게 볼 때
            ->  _web/t_(이름).webp      긴 변 480,  목록 썸네일
3. src/qualifications/ 의 자격증 이미지로 thumb/ 썸네일을 만듭니다.
4. 결과를 src/js/media.js 로 저장합니다. 이 파일은 자동 생성이므로 손대지 마십시오.
5. src/img/lectures/_작업목록.md 에 어느 폴더가 비어 있는지 정리해 줍니다.

--------------------------------------------------------------------
폴더 구조
--------------------------------------------------------------------
src/img/lectures/
    2026-05080528_한국승강기대학교_재직자AI에이전트/
        summary.txt        (선택) 한 줄 = 한 문단. 이 회차만의 설명
        videos.txt         (선택) 한 줄 = 유튜브ID | 설명
        works/             결과물 사진 원본을 그대로 넣으십시오
        onsite/            수업 현장 사진
        _web/              자동 생성. 지워도 다시 만들어집니다

폴더 이름의 규칙은 하나뿐입니다.
    맨 앞 _ 앞부분이 항목 번호(data-lid)여야 합니다.
    그 뒤 설명은 마음대로 바꿔도 됩니다. 한글도 됩니다.
    예)  2026-05080528_승강기대_에이전트   <- 이렇게 줄여도 그대로 동작합니다

파일 이름이 곧 설명이 됩니다.
    01.jpg               -> 설명 없음
    01_학생 결과물.jpg    -> 설명 "학생 결과물"
    번호 순으로 정렬되므로 01, 02, 03 … 으로 두십시오.
"""

from pathlib import Path
import html
import re
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit('Pillow 가 필요합니다.  터미널에 다음을 입력하십시오:\n\n    pip install pillow\n')


# =====================================================================
#  설정
# =====================================================================

FULL_LONG_EDGE = 1200      # 크게 볼 때 쓰는 이미지의 긴 변
FULL_QUALITY = 75

THUMB_LONG_EDGE = 480      # 목록에 깔리는 썸네일의 긴 변
THUMB_QUALITY = 72

MAX_PER_GROUP = 6          # 한 항목에 넣을 사진 수 상한. 넘으면 경고만 합니다

# 폴더를 만들 대상. 강의 38건 + 교육 콘텐츠 5건.
SECTIONS = ['lectures', 'edu-content']


# =====================================================================
ROOT = Path(__file__).resolve().parent
HTML = ROOT / 'index.html'
BASE = ROOT / 'src' / 'img' / 'lectures'
OUT_JS = ROOT / 'src' / 'js' / 'media.js'
TODO_MD = BASE / '_작업목록.md'

IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tif', '.tiff'}
BAD = r'[\\/:*?"<>|]'


# ---------------------------------------------------------------------
def parse_index():
    """index.html 에서 항목 목록을 뽑습니다. (lid, 구분, 기간, 기관, 주제)"""
    src = HTML.read_text(encoding='utf-8')
    items = []

    # 강의 38건
    i = src.index('<section id="lectures">')
    j = src.index('<section id="edu-content">')
    for m in re.finditer(
            r'data-type="([^"]+)" data-lid="([^"]+)">\s*'
            r'<div class="lecture-period">([^<]+)</div>.*?'
            r'<div class="lecture-title">(.*?)</div>',
            src[i:j], re.S):
        kind, lid, period, title = m.groups()
        items.append((lid, kind, period.strip(), *split_title(title)))

    # 교육 콘텐츠 5건
    i = src.index('<section id="edu-content">')
    j = src.index('<section id="credentials">')
    for m in re.finditer(
            r'<div class="timeline-item" data-lid="([^"]+)">\s*'
            r'<div class="timeline-period">([^<]+)</div>.*?'
            r'<div class="timeline-role">(.*?)</div>',
            src[i:j], re.S):
        lid, period, title = m.groups()
        items.append((lid, '콘텐츠', period.strip(), *split_title(title)))

    return items


def split_title(raw):
    """'[기관]  주제' 를 기관과 주제로 나눕니다."""
    t = html.unescape(raw).replace('\u00a0', ' ')
    t = re.sub(r'<[^>]+>', '', t).strip()
    m = re.match(r'\[(.+?)\]\s*(.*)', t)
    if m:
        return m.group(1).strip(), m.group(2).strip()
    return '', t


def slug(s, limit=22):
    s = re.sub(BAD, '', s)
    s = re.sub(r'[\s·,()]+', '', s)
    return s[:limit]


def folder_name(lid, org, topic):
    parts = [lid]
    if org:
        parts.append(slug(org, 18))
    if topic:
        parts.append(slug(topic, 24))
    return '_'.join(parts)


def lid_of(folder: Path) -> str:
    return folder.name.split('_', 1)[0]


# ---------------------------------------------------------------------
def ensure_folders(items):
    """없는 폴더만 만듭니다. 이미 있으면 이름이 달라도 그대로 둡니다."""
    BASE.mkdir(parents=True, exist_ok=True)
    existing = {lid_of(p) for p in BASE.iterdir() if p.is_dir() and not p.name.startswith('_')}
    made = 0
    for lid, kind, period, org, topic in items:
        if lid in existing:
            continue
        d = BASE / folder_name(lid, org, topic)
        (d / 'works').mkdir(parents=True, exist_ok=True)
        (d / 'onsite').mkdir(parents=True, exist_ok=True)
        made += 1
    if made:
        print('  · 새 폴더 %d개 생성' % made)
    return made


# ---------------------------------------------------------------------
def caption_of(path: Path) -> str:
    stem = path.stem
    m = re.match(r'^\s*\d+\s*[_\-. ]\s*(.+)$', stem)
    return m.group(1).strip() if m else ''


def convert(src: Path, dst: Path, long_edge: int, quality: int) -> bool:
    """원본이 더 최신일 때만 다시 만듭니다."""
    if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
        return False
    im = Image.open(src)
    im = im.convert('RGBA' if im.mode in ('RGBA', 'LA', 'P') else 'RGB')
    if im.mode == 'RGBA':
        bg = Image.new('RGB', im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[-1])
        im = bg
    w, h = im.size
    scale = min(1.0, long_edge / max(w, h))
    if scale < 1.0:
        im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    dst.parent.mkdir(parents=True, exist_ok=True)
    im.save(dst, 'WEBP', quality=quality, method=5)
    return True


def build_group(folder: Path, group: str):
    """works / onsite 한 묶음을 처리해 항목 목록을 돌려줍니다."""
    src_dir = folder / group
    if not src_dir.is_dir():
        return [], 0

    files = sorted(p for p in src_dir.iterdir()
                   if p.is_file() and p.suffix.lower() in IMAGE_EXTS)
    if not files:
        return [], 0

    if len(files) > MAX_PER_GROUP:
        print('    ! %s/%s : 사진이 %d장입니다. %d장 이하를 권합니다'
              % (folder.name, group, len(files), MAX_PER_GROUP))

    rel = folder.relative_to(ROOT).as_posix()
    out, n = [], 0
    for i, f in enumerate(files, 1):
        # 만들어지는 파일 이름은 01.webp 처럼 숫자만 씁니다.
        # 공백이나 한글이 주소에 섞이면 서버에 따라 말썽이 납니다.
        base = '%02d' % i
        full = folder / '_web' / group / (base + '.webp')
        thumb = folder / '_web' / group / ('t_' + base + '.webp')
        n += convert(f, full, FULL_LONG_EDGE, FULL_QUALITY)
        n += convert(f, thumb, THUMB_LONG_EDGE, THUMB_QUALITY)
        out.append({
            'src': '%s/_web/%s/%s.webp' % (rel, group, base),
            'thumb': '%s/_web/%s/t_%s.webp' % (rel, group, base),
            'caption': caption_of(f),
        })
    return out, n


def read_lines(path: Path):
    if not path.is_file():
        return []
    return [l.strip() for l in path.read_text(encoding='utf-8').splitlines() if l.strip()]


def js(s):
    return "'" + str(s).replace('\\', '\\\\').replace("'", "\\'") + "'"


def emit(entries):
    lines = [
        '// 이 파일은 build_media.py 가 자동으로 만듭니다. 직접 고치지 마십시오.',
        '// 사진과 영상은 src/img/lectures/ 아래 폴더에 넣으면 여기에 반영됩니다.',
        '// 손으로 쓰는 설명·논문·링크는 data.js 에 있습니다.',
        '',
        'const GENERATED_MEDIA = {',
    ]
    for lid in sorted(entries, reverse=True):
        e = entries[lid]
        lines.append('  %s: {' % js(lid))
        if e.get('summary'):
            lines.append('    summary: [')
            for p in e['summary']:
                lines.append('      %s,' % js(p))
            lines.append('    ],')
        for group, label in (('works', 'works'), ('onsite', 'onsite')):
            if e.get(group):
                lines.append('    %s: [' % label)
                for p in e[group]:
                    cap = (', caption: %s' % js(p['caption'])) if p['caption'] else ''
                    lines.append('      { src: %s, thumb: %s%s },'
                                 % (js(p['src']), js(p['thumb']), cap))
                lines.append('    ],')
        if e.get('videos'):
            lines.append('    videos: [')
            for v in e['videos']:
                cap = (', caption: %s' % js(v['caption'])) if v['caption'] else ''
                lines.append('      { id: %s%s },' % (js(v['id']), cap))
            lines.append('    ],')
        lines.append('  },')
    lines.append('};')
    lines.append('')
    OUT_JS.write_text('\n'.join(lines), encoding='utf-8')


def write_todo(items, entries):
    by_lid = {lid: (kind, period, org, topic) for lid, kind, period, org, topic in items}
    folders = {lid_of(p): p for p in BASE.iterdir() if p.is_dir() and not p.name.startswith('_')}

    rows = []
    for lid in sorted(by_lid, reverse=True):
        kind, period, org, topic = by_lid[lid]
        e = entries.get(lid, {})
        n = len(e.get('works', [])) + len(e.get('onsite', []))
        mark = 'O' if n else ' '
        d = folders.get(lid)
        rows.append('| %s | %s | %s | %s | %s | %d장 | %s |'
                    % (mark, period, kind, org, topic, n,
                       d.name if d else '(폴더 없음)'))

    done = sum(1 for r in rows if r.startswith('| O'))
    txt = [
        '# 미디어 작업 목록',
        '',
        '`build_media.py` 가 자동으로 갱신합니다. 직접 고칠 필요 없습니다.',
        '',
        '채워진 항목 **%d / %d**' % (done, len(rows)),
        '',
        '사진을 넣을 폴더를 찾은 뒤 `works/` 또는 `onsite/` 에 넣고 스크립트를 다시 실행하십시오.',
        '',
        '| 완료 | 기간 | 구분 | 기관 | 주제 | 사진 | 폴더 |',
        '|---|---|---|---|---|---|---|',
    ] + rows
    TODO_MD.write_text('\n'.join(txt) + '\n', encoding='utf-8')


# ---------------------------------------------------------------------
QUAL_DIR = ROOT / 'src' / 'qualifications'


def build_qualifications():
    """자격증 이미지의 썸네일을 만듭니다. data.js 가 thumb/ 경로를 가리킵니다."""
    if not QUAL_DIR.is_dir():
        return 0
    files = sorted(p for p in QUAL_DIR.iterdir()
                   if p.is_file() and p.suffix.lower() in IMAGE_EXTS)
    n = 0
    for f in files:
        dst = QUAL_DIR / 'thumb' / (f.stem + '.webp')
        if convert(f, dst, THUMB_LONG_EDGE, THUMB_QUALITY):
            n += 1
            print('  · %s  ->  thumb/%s' % (f.name, dst.name))
    if files and not n:
        print('  - 이미 최신입니다 (%d개)' % len(files))
    if not files:
        print('  - src/qualifications/ 에 이미지가 없습니다')
    return n


def main():
    print('작업 폴더: %s' % ROOT)
    if not HTML.exists():
        print('! index.html 이 없습니다. 이 파일은 index.html 과 같은 위치에 두십시오.')
        return

    items = parse_index()
    print('\n[1] 항목 %d건 확인' % len(items))
    ensure_folders(items)

    print('\n[2] 사진 변환')
    entries, converted = {}, 0
    for folder in sorted(BASE.iterdir()):
        if not folder.is_dir() or folder.name.startswith('_'):
            continue
        lid = lid_of(folder)
        e = {}

        for group in ('works', 'onsite'):
            got, n = build_group(folder, group)
            converted += n
            if got:
                e[group] = got

        summary = read_lines(folder / 'summary.txt')
        if summary:
            e['summary'] = summary

        videos = []
        for line in read_lines(folder / 'videos.txt'):
            vid, _, cap = line.partition('|')
            videos.append({'id': vid.strip(), 'caption': cap.strip()})
        if videos:
            e['videos'] = videos

        if e:
            entries[lid] = e
            print('  · %-46s %s' % (
                folder.name[:46],
                ' '.join(filter(None, [
                    '결과물 %d' % len(e['works']) if e.get('works') else '',
                    '현장 %d' % len(e['onsite']) if e.get('onsite') else '',
                    '영상 %d' % len(e['videos']) if e.get('videos') else '',
                    '설명 %d문단' % len(e['summary']) if e.get('summary') else '',
                ]))))

    print('  = 새로 변환한 파일 %d개' % converted)

    print('\n[3] 자격증 썸네일')
    build_qualifications()

    print('\n[4] 결과 저장')
    emit(entries)
    write_todo(items, entries)
    print('  · %s' % OUT_JS.relative_to(ROOT))
    print('  · %s' % TODO_MD.relative_to(ROOT))
    print('  = 내용이 있는 항목 %d건' % len(entries))

    print('\n끝났습니다. 브라우저에서 Ctrl+Shift+R 로 캐시를 비우고 확인하십시오.')


if __name__ == '__main__':
    main()
