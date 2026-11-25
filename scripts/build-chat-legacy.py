#!/usr/bin/env python3
"""Собирает public/css/chat-legacy.css — временный мост для экрана чата на время редизайна (шаги 3–5).

Экран чата переведён на систему Core (public/core/core-chat.css, шаг 3), окно результата, блоки кода, карточки
результатов, журнал работы, облачный компьютер и папка — тоже (public/core/core-work.css, шаг 4). В старом оформлении
ещё живут окна, меню моделей, подсказки и уведомления (шаг 5). Их правила разбросаны по старым файлам вперемешку с
правилами того, что уже переделано. Скрипт берёт старые файлы в прежнем порядке подключения и оставляет только правила ещё не переделанных
частей. Страница чата подключает один этот файл вместо девяти старых.

Что считать «уже переделанным» — списки DROP и CLAIM ниже. Шаг 5 дописывает в них свои селекторы и запускает скрипт
снова; когда список покроет всё, файл и скрипт удаляются (шаг 8).

Запуск: python3 scripts/build-chat-legacy.py   (после этого поднять ?v= у chat-legacy.css в chat.html и en/chat.html)
Проверка без записи: python3 scripts/build-chat-legacy.py --check
"""
import re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public'
OUT = PUBLIC / 'css' / 'chat-legacy.css'
# порядок — как эти файлы были подключены в chat.html до шага 3: каскад между оставшимися правилами не меняется
SOURCES = ['css/chat-main.css', 'theme/chat.gen.css', 'theme/app.css', 'growth.css', 'limits.css', 'chat-ui.css',
           'ultra.css', 'anim.css', 'chat-visual.css']

# Селектор выбрасывается, если он начинается с одного из этих имён: это части экрана, которые теперь рисует core-chat.css.
DROP = r'''
html body ::selection :focus-visible main p
.item .side .overlay .ib .shead .brand .brand-mark .brand-tag .mark .new .search .sec .scroll .empty-s .me .mebtn #meName .av
.tgcard .tgin .tgic .tgsub .tgx .plancard .pc-top .pc-name .pc-bts .pc-up .pc-rst .pc-bar
.main .top .crumb .sp .gw-share .language-switch
.chat .col .msg .u .a .md .tbl .cursor .acts .errbox .cu-acts .srcs .src .uatt .upick .cv-meta .cv-mathb .cv-math-src
.hello .pinfo .chips #sugg .sugg .sgpro .cu-cats
.dock .box #mirror .brow .model .mbtn .webbtn #fsName #micBtn #ptag .send #send .note .atts .att .pickchip .cv-down
.gw-bar .gw-left .gw-warn .gw-out .gw-x .ul-chip .ul-hint
.clist .hl #chats
.wrap2 .pitch .gbtn .ghbtn .nav .login .lcard #vtitle #view
'''.split()
# …кроме случаев, когда правило на самом деле про ещё не переделанную часть (меню моделей открывается вверх и т. п.)
KEEP = re.compile(r'\.(menu|opt|modal|dlg|toast)(?![\w-])')

# Шаг 4. Части, которые рисует core-work.css: окно результата, код, журнал работы, карточки и медиа, облачный компьютер,
# папка, помощник. Селектор выбрасывается, если одно из этих имён встречается в нём ГДЕ УГОДНО: такие правила
# начинаются с чего попало (.msg .pre, :root[data-theme=light] .pane, .dlg .clw …), но всегда про переделанную часть.
# Общие классы (.btn, .dim, .danger, .sp, .tag, .ib) сюда не входят — они нужны окнам шага 5; core-work.css задаёт их
# заново внутри своих частей.
CLAIM = '''
pane pane-in phead ptitle tabs pbody pwait pubbar pub-upgrade animbar anim-info anim-err anim-prog version-panel version-row
diff-code diff-add diff-remove
pre outp cv-code cv-l cv-ln cu-n cu-long cu-open cu-more fileb fp
think think-b steps step runs run validation-box
art art-ic art-t art-go art-mp4 pack pack-h pack-b outs ofile imgw cfs cfs-more outs-keep gens gen gen-dl draw dblobs dgrain dpen dbar
fsops fsop fsdiff dl fsc fss fsnote fsbtns agop agdanger agpre agout
fsmenu fsm-h fsm-ck agpick agm-sub
clw clbar clst cldot agtabs clin clout clcmd clerr clxt clsec cllist clrow clnm clacts clgo clhint clempty clinl clpath clcrumbs
cltr clup clnote clsite clzip cldl clwarn
agset agl agwarn agol agdl agcode agcmd agwait agspin agsm
'''.split()
CLAIM_IDS = 'pPick pReload pOpen pPub pDl pCopy pClose pFrame pCode pVersions pWait pMp4 clPubList clSiteList clList clTerm clFiles clSites clOut clCmd clPs clSt agMenu fsMenu versionCompare'.split()
CLAIMED = re.compile(r'(?:\.(?:' + '|'.join(re.escape(x) for x in sorted(CLAIM, key=len, reverse=True)) + r')|#(?:' + '|'.join(CLAIM_IDS) + r'))(?![\w-])')
# анимации переделанных частей: больше ни одно правило моста на них не ссылается
DEAD_KEYFRAMES = {'dblob', 'ddots', 'dpen', 'dsweep', 'genIn', 'genShim', 'fsmIn', 'agsp'}

# Старые части раньше наследовали шрифт и цвет от <body>. Теперь <body> принадлежит Core, поэтому корням старых
# частей эти два свойства заданы явно — ровно те, что были у body (chat-main.css + theme/app.css).
SCOPE = ['.modal', '.menu', '.toast', '.ulw']
SCOPE_RULE = ','.join(SCOPE) + '{font:15.5px/1.65 var(--p-font);color:var(--p-text);letter-spacing:normal;overflow-wrap:normal}'
# На шаге 3 здесь сужалось правило «.md code» (код в строке ушёл в Core, блоки кода оставались старыми).
# С шага 4 блоки кода тоже рисует Core — переписывать больше нечего.
REWRITE = {}

LEAD = re.compile(r'^(?:' + '|'.join(re.escape(x) for x in sorted(DROP, key=len, reverse=True)) + r')(?![\w-])')


def strip_comments(t):
    return re.sub(r'/\*.*?\*/', '', t, flags=re.S)


def blocks(t):
    """Блоки верхнего уровня: (заголовок, тело | None)."""
    i, n = 0, len(t)
    while i < n:
        while i < n and t[i].isspace(): i += 1
        if i >= n: return
        j, q = i, None
        while j < n:
            c = t[j]
            if q:
                if c == '\\': j += 2; continue
                if c == q: q = None
            elif c in '"\'': q = c
            elif c in '{;': break
            j += 1
        if j >= n: return
        if t[j] == ';':
            yield t[i:j].strip(), None; i = j + 1; continue
        k, depth, q = j + 1, 1, None
        while k < n and depth:
            c = t[k]
            if q:
                if c == '\\': k += 2; continue
                if c == q: q = None
            elif c in '"\'': q = c
            elif c == '{': depth += 1
            elif c == '}': depth -= 1
            k += 1
        yield t[i:j].strip(), t[j + 1:k - 1]; i = k


def selectors(prelude):
    out, cur, depth = [], '', 0
    for c in prelude:
        if c in '([': depth += 1
        elif c in ')]': depth -= 1
        if c == ',' and depth == 0: out.append(cur.strip()); cur = ''
        else: cur += c
    if cur.strip(): out.append(cur.strip())
    return out


def dropped(sel):
    return bool(CLAIMED.search(sel)) or (bool(LEAD.match(sel)) and not KEEP.search(sel))


def squeeze(s):
    return re.sub(r'\s+', ' ', s).strip()


def filter_css(t, stats):
    out = []
    for head, body in blocks(t):
        if body is None:
            out.append(squeeze(head) + ';'); continue
        if re.match(r'@(media|supports|container|layer)\b', head):
            inner = filter_css(body, stats)
            if inner: out.append(squeeze(head) + '{' + inner + '}')
            continue
        if head.startswith('@'):  # @keyframes, @font-face — как есть (кроме анимаций переделанных частей)
            if head.split()[0] == '@keyframes' and head.split()[-1] in DEAD_KEYFRAMES: continue
            out.append(squeeze(head) + '{' + squeeze(body) + '}'); continue
        sels = [REWRITE.get(squeeze(s), s) for s in selectors(head)]; keep = [s for s in sels if s in REWRITE.values() or not dropped(s)]
        stats['all'] += len(sels); stats['kept'] += len(keep)
        if keep: out.append(','.join(squeeze(s) for s in keep) + '{' + squeeze(body).rstrip(';') + '}')
    return ''.join(out)


def build():
    stats = {'all': 0, 'kept': 0}
    parts = ['/* СГЕНЕРИРОВАНО scripts/build-chat-legacy.py — руками не править. Старое оформление тех частей чата,\n'
             '   которые ещё не переведены на Core (шаг 5 редизайна). Удаляется на шаге 8. */\n', SCOPE_RULE + '\n']
    for name in SOURCES:
        css = filter_css(strip_comments((PUBLIC / name).read_text(encoding='utf-8')), stats)
        # курсор-искра на всей странице: старые части тоже получают форму «действие» вместо системной руки
        css = re.sub(r'cursor:\s*pointer', 'cursor:var(--core-cursor-action)', css)
        parts.append('/* ' + name + ' */\n' + css.replace('}', '}\n'))
    return ''.join(parts), stats


if __name__ == '__main__':
    text, stats = build()
    if '--check' in sys.argv:
        same = OUT.exists() and OUT.read_text(encoding='utf-8') == text
        print('chat-legacy.css', 'актуален' if same else 'УСТАРЕЛ — запустите scripts/build-chat-legacy.py')
        sys.exit(0 if same else 1)
    OUT.write_text(text, encoding='utf-8')
    print(f"chat-legacy.css: оставлено {stats['kept']} селекторов из {stats['all']}, {len(text.encode('utf-8'))} байт")
