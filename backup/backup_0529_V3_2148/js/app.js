// ══════════════ 데이터 ══════════════
let db = { baby: {}, logs: {}, stocks: [] };

const PRESETS = [
    { name: '쌀',       emoji: '🌾', color: '#8D6E63', bg: '#FFF8E1' },
    { name: '애호박',   emoji: '🥒', color: '#43A047', bg: '#E8F5E9' },
    { name: '당근',     emoji: '🥕', color: '#EF6C00', bg: '#FFF3E0' },
    { name: '청경채',   emoji: '🥬', color: '#2E7D32', bg: '#F1F8E9' },
    { name: '감자',     emoji: '🥔', color: '#A1887F', bg: '#EFEBE9' },
    { name: '소고기',   emoji: '🥩', color: '#E53935', bg: '#FCE4EC' },
    { name: '양배추',   emoji: '🥦', color: '#558B2F', bg: '#F9FBE7' },
    { name: '브로콜리', emoji: '🥦', color: '#1B5E20', bg: '#E8F5E9' },
    { name: '닭고기',   emoji: '🍗', color: '#F57F17', bg: '#FFFDE7' },
    { name: '두부',     emoji: '⬜', color: '#78909C', bg: '#ECEFF1' },
    { name: '시금치',   emoji: '🌿', color: '#388E3C', bg: '#E8F5E9' },
    { name: '고구마',   emoji: '🍠', color: '#BF360C', bg: '#FBE9E7' },
    { name: '단호박',   emoji: '🎃', color: '#E65100', bg: '#FFF3E0' },
    { name: '사과',     emoji: '🍎', color: '#C62828', bg: '#FFEBEE' },
    { name: '배',       emoji: '🍐', color: '#558B2F', bg: '#F9FBE7' },
];

let calYM    = new Date();
let selDate  = toStr(new Date());
let editDate = null;
let editBuf  = [];
let editStockId = null;
let stockIngrBuf = [];

// ══════════════ 스토리지 ══════════════
function load() {
    try {
        const s = localStorage.getItem('iyushik_v3');
        if (s) {
            db = JSON.parse(s);
            if (!db.logs)   db.logs   = {};
            if (!db.stocks) db.stocks = [];
            if (!db.baby)   db.baby   = {};
        }
    } catch(e) { /* 파싱 오류 시 빈 db 유지 */ }
}
function save() { localStorage.setItem('iyushik_v3', JSON.stringify(db)); }

// ══════════════ 유틸 ══════════════
function pad(n) { return String(n).padStart(2,'0'); }
function toStr(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function fmtDate(s) {
    if (!s) return '';
    const [y, m, d] = s.split('-');
    return `${y}.${m}.${d}`;
}
function calcDPlus(birthStr, dateStr) {
    if (!birthStr || !dateStr) return null;
    const diff = Math.floor((new Date(dateStr+'T00:00:00') - new Date(birthStr+'T00:00:00')) / 86400000);
    return diff >= 0 ? diff : null;
}
function calcMonths(birthStr) {
    if (!birthStr) return '';
    const birth = new Date(birthStr+'T00:00:00'), now = new Date();
    let m = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (now.getDate() < birth.getDate()) m--;
    if (m < 0) m = 0;
    const days = Math.floor((now - birth) / 86400000);
    return m < 1 ? `${days}일` : `${m}개월`;
}
function expireInfo(s) {
    const exp = new Date(s.madeDate+'T00:00:00');
    exp.setDate(exp.getDate() + parseInt(s.expireDays || 14));
    const now = new Date(); now.setHours(0,0,0,0);
    return { diff: Math.floor((exp - now) / 86400000), expStr: fmtDate(toStr(exp)) };
}
function getPreset(name) {
    return PRESETS.find(p => p.name === name) || { emoji: '🍴', color: '#AAAAAA', bg: '#F5F5F5' };
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function getFirstMap() {
    const map = {};
    for (const ds of Object.keys(db.logs).sort())
        for (const it of db.logs[ds])
            if (!(it.name in map)) map[it.name] = ds;
    return map;
}

// ══════════════ 탭 ══════════════
function switchTab(tab) {
    document.querySelectorAll('.tab').forEach((t, i) =>
        t.classList.toggle('active', ['calendar','stock','baby'][i] === tab)
    );
    document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    if (tab === 'calendar') renderCalendar();
    if (tab === 'stock')    renderStockList();
    if (tab === 'baby')     loadBabyForm();
}

// ══════════════ 아기 정보 ══════════════
function saveBaby() {
    db.baby = {
        name:    document.getElementById('b-name').value.trim(),
        birth:   document.getElementById('b-birth').value,
        allergy: document.getElementById('b-allergy').value.trim(),
        note:    document.getElementById('b-note').value.trim()
    };
    save(); updateHeader(); renderBabyDisplay();
    alert('저장되었습니다.');
}
function loadBabyForm() {
    document.getElementById('b-name').value    = db.baby.name    || '';
    document.getElementById('b-birth').value   = db.baby.birth   || '';
    document.getElementById('b-allergy').value = db.baby.allergy || '';
    document.getElementById('b-note').value    = db.baby.note    || '';
    updateAgeField(); renderBabyDisplay();
}
function updateAgeField() {
    const b = document.getElementById('b-birth').value;
    document.getElementById('b-age-display').value = b ? calcMonths(b) : '';
}
function updateHeader() {
    const n = db.baby.name || '', a = db.baby.birth ? calcMonths(db.baby.birth) : '';
    let s = n; if (a) s += (s ? ' · ' : '') + a;
    document.getElementById('header-sub').textContent = s || '아기 정보를 입력해주세요';
}
function renderBabyDisplay() {
    const b = db.baby, el = document.getElementById('baby-display-card');
    if (!b.name && !b.birth) { el.style.display = 'none'; return; }
    el.style.display = 'block';
    document.getElementById('baby-info-grid').innerHTML = `
        <div class="info-cell"><div class="lbl">이름</div><div class="val">${b.name||'-'}</div></div>
        <div class="info-cell"><div class="lbl">생년월일</div><div class="val">${fmtDate(b.birth)||'-'}</div></div>
        <div class="info-cell"><div class="lbl">개월 수</div><div class="val">${calcMonths(b.birth)||'-'}</div></div>
        <div class="info-cell"><div class="lbl">알레르기</div><div class="val">${b.allergy||'없음'}</div></div>
        ${b.note?`<div class="info-cell full"><div class="lbl">메모</div><div class="val" style="font-size:13px;font-weight:500">${b.note}</div></div>`:''}
    `;
}

// ══════════════ 달력 ══════════════
function changeMonth(d) {
    calYM = new Date(calYM.getFullYear(), calYM.getMonth() + d, 1);
    renderCalendar();
}
function selectDate(dateStr) { selDate = dateStr; renderCalendar(); }

function renderCalendar() {
    const y = calYM.getFullYear(), m = calYM.getMonth();
    document.getElementById('cal-title').textContent = `${y}년 ${m+1}월`;

    const todayStr = toStr(new Date());
    const firstDow = new Date(y, m, 1).getDay();
    const lastDate = new Date(y, m+1, 0).getDate();
    const prevLast = new Date(y, m, 0).getDate();
    const firstMap = getFirstMap();
    const total    = Math.ceil((firstDow + lastDate) / 7) * 7;

    let day = 1, nextDay = 1, html = '';

    for (let i = 0; i < total; i++) {
        let cls = 'cal-cell', dateStr = null, num = '';

        if (i < firstDow) {
            num = prevLast - firstDow + i + 1; cls += ' other-month';
        } else if (day <= lastDate) {
            num = day;
            dateStr = `${y}-${pad(m+1)}-${pad(day)}`;
            if (dateStr === todayStr) cls += ' today';
            if (dateStr === selDate)  cls += ' selected';
            day++;
        } else {
            num = nextDay++; cls += ' other-month';
        }

        if (!dateStr) {
            html += `<div class="${cls}"><div class="cell-num">${num}</div></div>`;
            continue;
        }

        const dp    = calcDPlus(db.baby.birth, dateStr);
        const items = db.logs[dateStr] || [];
        const gtot  = items.reduce((s, it) => s + (parseFloat(it.amount)||0), 0);

        const dots = items.slice(0, 6).map(it => {
            const p = getPreset(it.name);
            const isFirst = firstMap[it.name] === dateStr;
            return `<span class="food-dot" style="background:${p.color};${isFirst?'box-shadow:0 0 0 2px white,0 0 0 3px '+p.color:''}" title="${it.name} ${it.amount}g"></span>`;
        }).join('');

        html += `
        <div class="${cls}" onclick="selectDate('${dateStr}')">
            <div class="cell-num">${num}</div>
            ${dp !== null ? `<div class="cell-dp">D+${dp}</div>` : ''}
            <div class="cell-dots">${dots}</div>
            ${gtot > 0 ? `<div class="cell-gtotal">${gtot}g</div>` : ''}
        </div>`;
    }

    document.getElementById('cal-grid').innerHTML = html;
    renderStats();
    renderDayPanel(selDate);
    renderLegend(firstMap, y, m);
}

function renderStats() {
    const todayStr = toStr(new Date());
    const items    = db.logs[todayStr] || [];
    const gtot     = items.reduce((s, it) => s + (parseFloat(it.amount)||0), 0);
    const dp       = calcDPlus(db.baby.birth, todayStr);
    const mStr     = `${calYM.getFullYear()}-${pad(calYM.getMonth()+1)}`;
    const mCnt     = Object.keys(db.logs).filter(d => d.startsWith(mStr)).length;
    const warn     = db.stocks.filter(s => { const e = expireInfo(s); return e.diff >= 0 && e.diff <= 3; }).length;

    document.getElementById('stats-bar').innerHTML = `
        ${dp !== null ? `<div class="stat-chip yellow"><div class="sv">D+${dp}</div><div class="sl">생후 일수</div></div>` : ''}
        <div class="stat-chip pink"><div class="sv">${items.length}</div><div class="sl">오늘 재료 수</div></div>
        <div class="stat-chip yellow"><div class="sv">${gtot}g</div><div class="sl">오늘 총량</div></div>
        <div class="stat-chip pink"><div class="sv">${mCnt}</div><div class="sl">이달 기록일</div></div>
        ${warn > 0 ? `<div class="stat-chip yellow"><div class="sv" style="color:#E05252">${warn}</div><div class="sl">만료임박</div></div>` : ''}
    `;
}

function renderDayPanel(dateStr) {
    const items    = db.logs[dateStr] || [];
    const dp       = calcDPlus(db.baby.birth, dateStr);
    const firstMap = getFirstMap();
    const gtot     = items.reduce((s, it) => s + (parseFloat(it.amount)||0), 0);

    const dpBadge = dp !== null ? `<span class="dp-badge-dp">D+${dp}</span>` : '';

    let body = items.length === 0
        ? `<div class="dp-empty">이 날의 기록이 없습니다.<br>+ 편집 버튼을 눌러 추가하세요.</div>`
        : items.map((it, idx) => {
            const isFirst = firstMap[it.name] === dateStr;
            return `
            <div class="dp-food-row">
                <span class="dp-emoji">${it.emoji}</span>
                <span class="dp-name">${it.name}</span>
                ${isFirst ? '<span class="dp-new-tag">첫 시작!</span>' : ''}
                <span class="dp-amt">${it.amount}g</span>
                <button class="dp-del" onclick="deleteDayItem('${dateStr}',${idx})">&#215;</button>
            </div>`;
        }).join('') + `
        <div class="dp-total-row">
            <span class="dp-total-label">총 섭취량</span>
            <span class="dp-total-val">${gtot}g</span>
        </div>`;

    document.getElementById('day-panel').innerHTML = `
        <div class="dp-head">
            <span class="dp-date">${fmtDate(dateStr)}</span>
            <div class="dp-badges">
                ${dpBadge}
                <button class="dp-badge-add" onclick="openDayModal('${dateStr}')">+ 편집</button>
            </div>
        </div>
        ${body}`;
}

function deleteDayItem(dateStr, idx) {
    if (!db.logs[dateStr]) return;
    db.logs[dateStr].splice(idx, 1);
    if (db.logs[dateStr].length === 0) delete db.logs[dateStr];
    save(); renderCalendar();
}

function renderLegend(firstMap, y, m) {
    const mStr = `${y}-${pad(m+1)}`;
    const newOnes = Object.entries(firstMap).filter(([, ds]) => ds.startsWith(mStr));
    const el = document.getElementById('legend-wrap');
    if (newOnes.length === 0) { el.innerHTML = ''; return; }

    const chips = newOnes.map(([name, ds]) => {
        const p = getPreset(name);
        return `<span class="legend-chip" style="background:${p.bg};color:${p.color}">
            ${p.emoji} <strong>${name}</strong>
            <span style="opacity:0.7;font-size:10px;margin-left:2px">${fmtDate(ds)} 시작</span>
        </span>`;
    }).join('');

    el.innerHTML = `<div class="legend-outer"><div class="legend-title">이번 달 첫 시작 재료</div><div class="legend-chips">${chips}</div></div>`;
}

// ══════════════ 날짜 편집 모달 ══════════════
function openDayModal(dateStr) {
    editDate = dateStr;
    const dp = calcDPlus(db.baby.birth, dateStr);
    document.getElementById('day-modal-title').textContent =
        fmtDate(dateStr) + (dp !== null ? `  D+${dp}` : '');
    editBuf = JSON.parse(JSON.stringify(db.logs[dateStr] || []));
    renderEditItems(); renderIngChips();
    document.getElementById('day-modal').classList.add('open');
}
function closeDayModal() {
    document.getElementById('day-modal').classList.remove('open');
    editDate = null;
}
function renderEditItems() {
    const el = document.getElementById('edit-items-list');
    if (editBuf.length === 0) {
        el.innerHTML = `<div style="color:var(--text-light);font-size:13px;margin-bottom:4px">재료를 선택하거나 직접 입력하세요.</div>`;
        return;
    }
    el.innerHTML = editBuf.map((it, i) => `
        <div class="edit-item-row">
            <span class="edit-item-emoji">${it.emoji}</span>
            <span class="edit-item-name">${it.name}</span>
            <input class="edit-item-amt" type="number" value="${it.amount}" min="0"
                onchange="editBuf[${i}].amount = parseFloat(this.value)||0">
            <span class="edit-item-unit">g</span>
            <button class="new-btn ${it.isNew ? 'new-on' : 'new-off'}" onclick="toggleNew(${i})">
                ${it.isNew ? '신규' : '기존'}
            </button>
            <button class="edit-del-btn" onclick="removeEditItem(${i})">&#215;</button>
        </div>`).join('');
}
function toggleNew(i) { editBuf[i].isNew = !editBuf[i].isNew; renderEditItems(); }
function removeEditItem(i) { editBuf.splice(i, 1); renderEditItems(); renderIngChips(); }

function renderIngChips() {
    const usedNames = new Set(Object.values(db.logs).flatMap(items => items.map(it => it.name)));
    const allChips  = [...usedNames].map(name => ({ name, ...getPreset(name) }));
    PRESETS.forEach(p => { if (!usedNames.has(p.name)) allChips.push(p); });

    document.getElementById('ing-chips').innerHTML = allChips.slice(0, 18).map(c => {
        const sel = editBuf.some(it => it.name === c.name);
        return `<div class="ing-chip ${sel ? 'sel' : ''}"
            style="${sel ? `background:${c.bg};border-color:${c.color};color:${c.color}` : ''}"
            onclick="toggleChip('${c.name}','${c.emoji}','${c.color}','${c.bg}')">
            ${c.emoji} ${c.name}
        </div>`;
    }).join('');
}
function toggleChip(name, emoji, color, bg) {
    const idx = editBuf.findIndex(it => it.name === name);
    if (idx >= 0) editBuf.splice(idx, 1);
    else editBuf.push({ name, emoji, color, bg, amount: 0, isNew: false });
    renderEditItems(); renderIngChips();
}
function addDirectIngredient() {
    const emoji = document.getElementById('ni-emoji').value.trim() || '🍴';
    const name  = document.getElementById('ni-name').value.trim();
    const amt   = parseFloat(document.getElementById('ni-amt').value) || 0;
    if (!name) { alert('재료 이름을 입력해주세요.'); return; }
    const p = getPreset(name);
    editBuf.push({ name, emoji: emoji !== '🍴' ? emoji : p.emoji, color: p.color, bg: p.bg, amount: amt, isNew: false });
    document.getElementById('ni-emoji').value = '';
    document.getElementById('ni-name').value  = '';
    document.getElementById('ni-amt').value   = '';
    renderEditItems(); renderIngChips();
}
function saveDayLog() {
    if (!editDate) return;
    const filtered = editBuf.filter(it => it.amount > 0);
    if (filtered.length === 0) delete db.logs[editDate];
    else db.logs[editDate] = filtered;
    save(); closeDayModal(); renderCalendar();
}

// ══════════════ 이유식 재고 재료 칩 ══════════════
function parseIngrStr(str) {
    if (!str) return [];
    return str.split(',').map(part => {
        part = part.trim();
        const m = part.match(/^(.+?)\s+(\d+(?:\.\d+)?)g?$/);
        if (m) {
            const name = m[1].trim();
            const p = getPreset(name);
            return { name, emoji: p.emoji, color: p.color, bg: p.bg, amount: parseFloat(m[2]) };
        }
        if (part) {
            const p = getPreset(part);
            return { name: part, emoji: p.emoji, color: p.color, bg: p.bg, amount: 0 };
        }
        return null;
    }).filter(Boolean);
}
function formatIngr(ingr) {
    if (!ingr || ingr.length === 0) return '';
    if (Array.isArray(ingr)) return ingr.map(it => `${it.emoji} ${it.name} ${it.amount}g`).join(' · ');
    return ingr;
}
function renderStockIngrItems() {
    const el = document.getElementById('s-ingr-list');
    if (stockIngrBuf.length === 0) {
        el.innerHTML = `<div style="color:var(--text-light);font-size:13px;margin-bottom:4px">재료를 선택하거나 직접 입력하세요.</div>`;
        return;
    }
    el.innerHTML = stockIngrBuf.map((it, i) => `
        <div class="edit-item-row">
            <span class="edit-item-emoji">${it.emoji}</span>
            <span class="edit-item-name">${it.name}</span>
            <input class="edit-item-amt" type="number" value="${it.amount}" min="0"
                onchange="stockIngrBuf[${i}].amount = parseFloat(this.value)||0">
            <span class="edit-item-unit">g</span>
            <button class="edit-del-btn" onclick="removeStockIngr(${i})">&#215;</button>
        </div>`).join('');
}
function renderStockIngChips() {
    const usedNames = new Set(Object.values(db.logs).flatMap(items => items.map(it => it.name)));
    const allChips  = [...usedNames].map(name => ({ name, ...getPreset(name) }));
    PRESETS.forEach(p => { if (!usedNames.has(p.name)) allChips.push(p); });
    document.getElementById('s-ing-chips').innerHTML = allChips.slice(0, 18).map(c => {
        const sel = stockIngrBuf.some(it => it.name === c.name);
        return `<div class="ing-chip ${sel ? 'sel' : ''}"
            style="${sel ? `background:${c.bg};border-color:${c.color};color:${c.color}` : ''}"
            onclick="toggleStockChip('${c.name}','${c.emoji}','${c.color}','${c.bg}')">
            ${c.emoji} ${c.name}
        </div>`;
    }).join('');
}
function toggleStockChip(name, emoji, color, bg) {
    const idx = stockIngrBuf.findIndex(it => it.name === name);
    if (idx >= 0) stockIngrBuf.splice(idx, 1);
    else stockIngrBuf.push({ name, emoji, color, bg, amount: 0 });
    renderStockIngrItems(); renderStockIngChips();
}
function removeStockIngr(i) { stockIngrBuf.splice(i, 1); renderStockIngrItems(); renderStockIngChips(); }
function addStockIngredient() {
    const emoji = document.getElementById('s-ni-emoji').value.trim() || '🍴';
    const name  = document.getElementById('s-ni-name').value.trim();
    const amt   = parseFloat(document.getElementById('s-ni-amt').value) || 0;
    if (!name) { alert('재료 이름을 입력해주세요.'); return; }
    const p = getPreset(name);
    stockIngrBuf.push({ name, emoji: emoji !== '🍴' ? emoji : p.emoji, color: p.color, bg: p.bg, amount: amt });
    document.getElementById('s-ni-emoji').value = '';
    document.getElementById('s-ni-name').value  = '';
    document.getElementById('s-ni-amt').value   = '';
    renderStockIngrItems(); renderStockIngChips();
}

// ══════════════ 이유식 재고 ══════════════
function openStockModal(id = null) {
    editStockId = id;
    document.getElementById('stock-modal-title').textContent = id ? '이유식 수정' : '이유식 추가';
    if (id) {
        const s = db.stocks.find(x => x.id === id);
        document.getElementById('s-name').value   = s.name;
        document.getElementById('s-made').value   = s.madeDate;
        document.getElementById('s-expire').value = s.expireDays;
        document.getElementById('s-total').value  = s.total;
        document.getElementById('s-remain').value = s.remain;
        document.getElementById('s-note').value   = s.note   || '';
        stockIngrBuf = Array.isArray(s.ingr) ? JSON.parse(JSON.stringify(s.ingr)) : parseIngrStr(s.ingr);
    } else {
        ['s-name','s-note'].forEach(i => document.getElementById(i).value = '');
        document.getElementById('s-made').value   = toStr(new Date());
        document.getElementById('s-expire').value = '14';
        document.getElementById('s-total').value  = '';
        document.getElementById('s-remain').value = '';
        stockIngrBuf = [];
    }
    renderStockIngrItems();
    renderStockIngChips();
    document.getElementById('stock-modal').classList.add('open');
}
function closeStockModal() { document.getElementById('stock-modal').classList.remove('open'); }
function saveStock() {
    const name = document.getElementById('s-name').value.trim();
    if (!name) { alert('이유식 이름을 입력해주세요.'); return; }
    const madeDate = document.getElementById('s-made').value;
    if (!madeDate) { alert('제작 날짜를 입력해주세요.'); return; }
    const total  = parseInt(document.getElementById('s-total').value)  || 0;
    const remain = parseInt(document.getElementById('s-remain').value);
    const obj = {
        name, madeDate,
        ingr:       stockIngrBuf.slice(),
        expireDays: parseInt(document.getElementById('s-expire').value) || 14,
        total, remain: isNaN(remain) ? total : remain,
        note:       document.getElementById('s-note').value.trim()
    };
    if (editStockId) {
        const i = db.stocks.findIndex(x => x.id === editStockId);
        db.stocks[i] = { ...db.stocks[i], ...obj };
    } else {
        obj.id = uid(); db.stocks.push(obj);
    }
    save(); closeStockModal(); renderStockList();
}
function deleteStock(id) {
    if (!confirm('삭제하시겠습니까?')) return;
    db.stocks = db.stocks.filter(x => x.id !== id);
    save(); renderStockList();
}
function adjustStock(id, delta) {
    const s = db.stocks.find(x => x.id === id);
    if (!s) return;
    const next = s.remain + delta;
    if (next < 0) { alert('재고가 없습니다.'); return; }
    s.remain = next; save(); renderStockList();
}
function renderStockList() {
    const el = document.getElementById('stock-list');
    if (db.stocks.length === 0) { el.innerHTML = '<div class="empty">이유식 재고를 추가해보세요.</div>'; return; }

    const sorted = [...db.stocks].sort((a, b) => expireInfo(a).diff - expireInfo(b).diff);
    el.innerHTML = sorted.map(s => {
        const ei = expireInfo(s);
        let tCls = 'good', tTxt = `${ei.diff}일 남음`;
        if (ei.diff < 0)       { tCls = 'danger';  tTxt = '만료됨'; }
        else if (ei.diff <= 2) { tCls = 'danger';  tTxt = `D-${ei.diff}`; }
        else if (ei.diff <= 5) { tCls = 'warning'; tTxt = `D-${ei.diff}`; }
        let cCls = 'stock-card';
        if (ei.diff < 0 || ei.diff <= 2) cCls += ' s-danger';
        else if (ei.diff <= 5)           cCls += ' s-warn';
        const pct = s.total > 0 ? Math.round((s.remain / s.total) * 100) : 0;
        return `
        <div class="${cCls}">
            <div class="stock-top">
                <div class="stock-name">${s.name}</div>
                <span class="expire-tag ${tCls}">${tTxt}</span>
            </div>
            <div class="stock-meta">
                ${formatIngr(s.ingr) ? `<span>${formatIngr(s.ingr)}</span>` : ''}
                <span>제작 ${fmtDate(s.madeDate)}</span>
                <span>기한 ${s.expireDays}일 (${ei.expStr}까지)</span>
                ${s.note ? `<span>${s.note}</span>` : ''}
            </div>
            <div class="count-row">
                <div><div class="count-big">${s.remain}</div><div class="count-of">/ ${s.total}개</div></div>
                <div class="prog-wrap">
                    <div class="prog-track"><div class="prog-fill" style="width:${Math.max(0,Math.min(100,pct))}%"></div></div>
                    <div class="prog-pct">${pct}% 남음</div>
                </div>
                <div class="count-btns">
                    <button class="circle-btn" onclick="adjustStock('${s.id}',1)" title="+1개">+</button>
                    <button class="use-btn" onclick="adjustStock('${s.id}',-1)">1개 사용</button>
                </div>
            </div>
            <div class="stock-actions">
                <button class="act-btn act-edit" onclick="openStockModal('${s.id}')">수정</button>
                <button class="act-btn act-del"  onclick="deleteStock('${s.id}')">삭제</button>
            </div>
        </div>`;
    }).join('');
}

// ══════════════ 공통 ══════════════
function bgClose(e, id) {
    if (e.target === document.getElementById(id))
        document.getElementById(id).classList.remove('open');
}

// ══════════════ 튜토리얼 ══════════════
const TUT_STEPS = [
    {
        tab: 'calendar',
        target: '#tab-calendar',
        label: '1 / 3',
        title: '📅 달력 기록',
        items: [
            { icon: '👆', text: '날짜를 탭하면 그날 먹은 이유식 기록이 나타나요' },
            { icon: '➕', text: '패널 하단 + 버튼으로 재료를 추가해요' },
            { icon: '✏️', text: '재료 옆 숫자를 탭하면 양(g)을 수정할 수 있어요' },
            { icon: '🗑️', text: '휴지통 버튼으로 재료를 삭제해요' },
        ]
    },
    {
        tab: 'stock',
        target: '#tab-stock',
        label: '2 / 3',
        title: '📦 이유식 재고',
        items: [
            { icon: '➕', text: '우측 하단 + 버튼으로 만들어 둔 이유식을 등록해요' },
            { icon: '▼', text: '먹일 때마다 ▼ 버튼으로 남은 개수를 차감해요' },
            { icon: '⚠️', text: '유통기한이 임박하면 카드 색이 바뀌어 알려줘요' },
            { icon: '✏️', text: '카드를 탭하면 수정·삭제할 수 있어요' },
        ]
    },
    {
        tab: 'baby',
        target: '#tab-baby',
        label: '3 / 3',
        title: '👶 아기 정보',
        items: [
            { icon: '🎂', text: '아기 이름과 생년월일을 입력해요' },
            { icon: '📅', text: '생년월일을 입력하면 달력에 D+ 카운터가 표시돼요' },
            { icon: '🤱', text: '상단 헤더에 개월수가 나타나요' },
            { icon: '📝', text: '알레르기·메모도 함께 기록해 두세요' },
        ]
    }
];

let tutStep = 0;

function startTutorial() {
    tutStep = 0;
    document.getElementById('tut-overlay').classList.add('show');
    showTutStep();
}

function showTutStep() {
    const s = TUT_STEPS[tutStep];
    switchTab(s.tab);

    document.getElementById('tut-step-label').textContent = s.label;
    document.getElementById('tut-title').textContent = s.title;
    document.getElementById('tut-items').innerHTML = s.items
        .map(it => `<div class="tut-item"><span class="tut-item-icon">${it.icon}</span><span>${it.text}</span></div>`)
        .join('');

    const btnNext = document.getElementById('tut-btn-next');
    btnNext.textContent = tutStep === TUT_STEPS.length - 1 ? '완료 ✓' : '다음 →';

    document.getElementById('tut-dots').innerHTML = TUT_STEPS
        .map((_, i) => `<div class="tut-dot${i === tutStep ? ' active' : ''}"></div>`)
        .join('');

    requestAnimationFrame(() => {
        const el = document.querySelector(s.target);
        if (!el) return;
        const r = el.getBoundingClientRect();
        const pad = 6;
        const hole = document.getElementById('tut-hole');
        hole.setAttribute('x',      Math.max(0, r.left - pad));
        hole.setAttribute('y',      Math.max(0, r.top  - pad));
        hole.setAttribute('width',  r.width  + pad * 2);
        hole.setAttribute('height', r.height + pad * 2);

        const bubble  = document.getElementById('tut-bubble');
        const winH    = window.innerHeight;
        const spBottom = r.bottom + pad;
        const spTop    = r.top   - pad;
        const bubbleH  = bubble.offsetHeight || 220;
        const margin   = 14;

        if (spBottom + bubbleH + margin < winH) {
            bubble.style.top    = (spBottom + margin) + 'px';
            bubble.style.bottom = 'auto';
            bubble.className    = 'tut-bubble arrow-up';
        } else {
            bubble.style.top    = Math.max(8, spTop - bubbleH - margin) + 'px';
            bubble.style.bottom = 'auto';
            bubble.className    = 'tut-bubble arrow-down';
        }
    });
}

function nextTutStep() {
    if (tutStep >= TUT_STEPS.length - 1) { endTutorial(); return; }
    tutStep++;
    showTutStep();
}

function endTutorial() {
    document.getElementById('tut-overlay').classList.remove('show');
    localStorage.setItem('iyushik_tut_done', '1');
    switchTab('calendar');
}

// ══════════════ 초기화 ══════════════
document.getElementById('b-birth').addEventListener('change', updateAgeField);

load();
updateHeader();
renderCalendar();
if (!localStorage.getItem('iyushik_tut_done')) {
    setTimeout(startTutorial, 600);
}
