import {
  FIREBASE_CONFIG, ROOM, START_DATE, SONGS, PHOTOS, LETTERS, REASONS, TIMELINE, SECRET_TITLE, SECRET_TEXT,
  LOCK_ENABLED, LOCK_HINT, LOCK_ANSWERS, COUPONS, SCRATCH_DAILY
} from './config.js';

const $ = id => document.getElementById(id);
const el = (tag, props = {}, ...kids) => {
  const e = Object.assign(document.createElement(tag), props);
  kids.flat().forEach(k => e.append(k));
  return e;
};
const when = ts => new Date(ts).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const root = document.documentElement;

/* ---------- State (declared first: subscriptions may fire immediately) ---------- */
let me = localStorage.getItem('me') || '';
const other = () => me === 'Shivi' ? 'Rajendra' : 'Shivi';
const audio = $('audio');
let idx = 0, currentKey = '', cloudSongs = [], localSongs = [], order = [], shuffle = false, reorder = false;
let settings = {}, cloudPhotos = [], voices = [], currentLetter = null, rec = null;
let notes = [], moods = {}, dedications = [], scratches = [];

/* ---------- Theme ---------- */
function applyTheme(d) {
  root.classList.toggle('dark', d);
  $('themeBtn').textContent = d ? '☀️' : '🌙';
  document.querySelector('meta[name=theme-color]').content = d ? '#1b1530' : '#f6d5d0';
}
$('themeBtn').onclick = () => { const d = !root.classList.contains('dark'); localStorage.setItem('theme', d ? 'dark' : 'light'); applyTheme(d); };
applyTheme(root.classList.contains('dark'));

/* ---------- Lock ---------- */
const norm = s => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
if (!LOCK_ENABLED) root.classList.add('unlocked');
$('lockHint').textContent = LOCK_HINT;
function tryUnlock() {
  const v = norm($('lockInput').value);
  if (v && LOCK_ANSWERS.map(norm).includes(v)) {
    localStorage.setItem('unlocked', '1'); root.classList.add('unlocked'); burst(innerWidth / 2, innerHeight / 2, 14);
  } else {
    $('lockMsg').textContent = 'Hmm, not quite 🥺 try again';
    $('lockInput').classList.remove('shake'); void $('lockInput').offsetWidth; $('lockInput').classList.add('shake');
  }
}
$('lockBtn').onclick = tryUnlock;
$('lockInput').addEventListener('keydown', e => e.key === 'Enter' && tryUnlock());

/* ---------- Data layer ---------- */
function localStore() {
  const subs = {};
  const read = n => { try { return JSON.parse(localStorage.getItem('lw_' + n) || '[]'); } catch { return []; } };
  const write = (n, a) => { try { localStorage.setItem('lw_' + n, JSON.stringify(a)); } catch { alert('Device storage is full 😕'); } (subs[n] || []).forEach(f => f(read(n))); };
  return {
    mode: 'local',
    async add(n, o) { const a = read(n); a.push({ ...o, id: crypto.randomUUID(), ts: Date.now() }); write(n, a); },
    async remove(n, id) { write(n, read(n).filter(x => x.id !== id)); },
    async set(n, id, o) { const a = read(n); const i = a.findIndex(x => x.id === id); const v = { ...(a[i] || {}), ...o, id, ts: Date.now() }; i < 0 ? a.push(v) : a[i] = v; write(n, a); },
    sub(n, cb) { (subs[n] = subs[n] || []).push(cb); cb(read(n)); }
  };
}
const cfgOk = k => k && !/^PASTE/i.test(k);
async function makeStore() {
  if (!cfgOk(FIREBASE_CONFIG.apiKey) || !cfgOk(FIREBASE_CONFIG.appId)) return localStore();
  try {
    const V = '10.12.2';
    const [{ initializeApp }, fs] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`)
    ]);
    const db = fs.getFirestore(initializeApp(FIREBASE_CONFIG));
    const col = n => fs.collection(db, 'rooms', ROOM, n);
    return {
      mode: 'cloud',
      add: (n, o) => fs.addDoc(col(n), { ...o, ts: Date.now() }),
      remove: (n, id) => fs.deleteDoc(fs.doc(db, 'rooms', ROOM, n, id)),
      set: (n, id, o) => fs.setDoc(fs.doc(db, 'rooms', ROOM, n, id), { ...o, ts: Date.now() }, { merge: true }),
      sub: (n, cb) => fs.onSnapshot(fs.query(col(n), fs.orderBy('ts', 'asc')),
        s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))), err => console.error(n, err))
    };
  } catch (e) { console.error(e); return localStore(); }
}
const store = await makeStore();
$('syncState').textContent = store.mode === 'cloud' ? '☁️ synced between you two'
  : (cfgOk(FIREBASE_CONFIG.apiKey) ? '📴 this device only' : '⚠️ add your Firebase apiKey/appId in config.js');

/* ---------- Modal ---------- */
function openModal(title, text = '', extra = null, sign = false) {
  $('modalTitle').textContent = title;
  $('modalText').textContent = text; $('modalText').style.display = text ? '' : 'none';
  $('modalSign').style.display = sign ? '' : 'none';
  $('modalExtra').replaceChildren(...(extra ? [extra] : []));
  $('modal').hidden = false;
}
function closeModal() { $('modal').hidden = true; currentLetter = null; stopRec(true); }
$('modalClose').onclick = closeModal;
$('modal').addEventListener('click', e => { if (e.target === $('modal')) closeModal(); });
const form = (...k) => el('div', { style: 'display:flex;flex-direction:column;gap:10px' }, ...k);

/* ---------- Intro (NO autoplay: music starts only with the play button) ---------- */
function enter(name) {
  me = name; localStorage.setItem('me', me);
  $('intro').classList.add('gone'); $('app').classList.add('show');
  burst(innerWidth / 2, innerHeight / 2, 12);
  rerenderAll();
}
document.querySelectorAll('.enter').forEach(b => b.onclick = () => enter(b.dataset.me));
$('switchMe').onclick = () => { localStorage.removeItem('me'); location.reload(); };

/* ---------- Settings & counters ---------- */
store.sub('settings', list => {
  settings = Object.fromEntries(list.map(x => [x.id, x]));
  order = settings.main?.order || [];
  buildList(); tick();
});
const startDate = () => new Date(settings.main?.start || START_DATE);
const meetDate = () => settings.main?.meet ? new Date(settings.main.meet) : null;
function tick() {
  const s = startDate();
  if (!isNaN(s)) {
    const d = Math.max(0, Date.now() - s);
    $('cDays').textContent = Math.floor(d / 864e5); $('cHours').textContent = Math.floor(d / 36e5) % 24;
    $('cMins').textContent = Math.floor(d / 6e4) % 60; $('cSecs').textContent = Math.floor(d / 1e3) % 60;
  }
  const m = meetDate();
  const set = (a, b, c) => { $('mDays').textContent = a; $('mHours').textContent = b; $('mMins').textContent = c; };
  if (!m || isNaN(m)) { set('–', '–', '–'); $('meetNote').textContent = 'Set the day we see each other next 🗓️'; }
  else {
    const d = m - Date.now();
    if (d <= 0) { set(0, 0, 0); $('meetNote').textContent = "We're together right now 🥰"; }
    else { set(Math.floor(d / 864e5), Math.floor(d / 36e5) % 24, Math.floor(d / 6e4) % 60); $('meetNote').textContent = 'Every second brings me closer to you 💞'; }
  }
}
setInterval(tick, 1000); tick();
$('counterNote').textContent = "…and I'd happily do it all again 💞";
document.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => {
  const kind = b.dataset.edit, cur = kind === 'start' ? startDate() : meetDate();
  const p = n => String(n).padStart(2, '0');
  const val = cur && !isNaN(cur) ? `${cur.getFullYear()}-${p(cur.getMonth() + 1)}-${p(cur.getDate())}` + (kind === 'start' ? '' : `T${p(cur.getHours())}:${p(cur.getMinutes())}`) : '';
  const inp = el('input', { type: kind === 'start' ? 'date' : 'datetime-local', value: val });
  const save = el('button', { className: 'btn', textContent: 'Save 💕' });
  save.onclick = async () => {
    if (!inp.value) return;
    await store.set('settings', 'main', { [kind]: kind === 'start' ? inp.value + 'T00:00:00' : inp.value });
    closeModal(); tick();
  };
  openModal(kind === 'start' ? 'The day we became us' : 'The day I get to hug you', '', form(inp, save));
});

/* ---------- Mood check-in ---------- */
const MOODS = [['😍', 'Happy'], ['🥰', 'Loved'], ['😌', 'Calm'], ['😴', 'Sleepy'], ['🥺', 'Missing you'], ['😔', 'Sad'], ['😤', 'Grumpy'], ['😰', 'Stressed']];
store.sub('moods', l => { moods = Object.fromEntries(l.map(x => [x.id, x])); renderMoods(); });
function renderMoods() {
  const pick = $('moodPick'); pick.replaceChildren();
  MOODS.forEach(([e, label]) => {
    const b = el('button', { className: moods[me]?.label === label ? 'sel' : '' }, e, el('small', { textContent: label }));
    b.onclick = ev => { if (!me) return; store.set('moods', me, { emoji: e, label, by: me }); burst(ev.clientX, ev.clientY, 4); };
    pick.append(b);
  });
  const show = $('moodShow'); show.replaceChildren();
  ['Shivi', 'Rajendra'].forEach(n => {
    const m = moods[n];
    show.append(el('div', { className: 'mood' }, el('b', { textContent: n === me ? n + ' (you)' : n }),
      el('div', { className: 'e', textContent: m ? m.emoji : '·' }),
      el('small', { textContent: m ? `${m.label} · ${when(m.ts)}` : 'not shared yet' })));
  });
  const o = moods[other()];
  $('cheerBtn').hidden = !(me && o && ['Missing you', 'Sad', 'Stressed'].includes(o.label));
  $('cheerBtn').textContent = `${other()} feels ${o?.label?.toLowerCase() || ''} — send a hug 🤗`;
}
$('cheerBtn').onclick = () => {
  $('noteText').value = 'Sending you the biggest hug 🤗 I am right here.';
  $('noteCard').scrollIntoView({ behavior: 'smooth' }); $('noteText').focus();
};

/* ---------- Music ---------- */
const fmt = t => isFinite(t) ? Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0') : '0:00';
const keyOf = s => s.cloudId ? 'c:' + s.cloudId : s.localId ? 'l:' + s.localId : s.yt ? 'y:' + s.yt : 's:' + s.src;
const rawList = () => [
  ...SONGS,
  ...cloudSongs.map(s => ({ title: s.title, src: s.url, yt: s.yt || '', note: `Added by ${s.by || 'us'} 💕`, cloudId: s.id })),
  ...localSongs
];
function playlist() {
  const r = rawList(); if (!order.length) return r;
  const pos = k => { const i = order.indexOf(k); return i < 0 ? 1e6 : i; };
  return r.map((s, i) => [s, i]).sort((a, b) => pos(keyOf(a[0])) - pos(keyOf(b[0])) || a[1] - b[1]).map(x => x[0]);
}
function buildList() {
  const list = $('songList'); list.replaceChildren();
  const pl = playlist();
  const ci = pl.findIndex(s => keyOf(s) === currentKey); if (ci >= 0) idx = ci;
  pl.forEach((s, i) => {
    const li = el('li', { textContent: '♪  ' + s.title, className: i === idx ? 'active' : '' });
    li.onclick = () => loadSong(i, isPlaying());
    if (reorder) {
      const mv = d => async e => {
        e.stopPropagation();
        const keys = pl.map(keyOf), j = i + d; if (j < 0 || j >= keys.length) return;
        [keys[i], keys[j]] = [keys[j], keys[i]];
        await store.set('settings', 'main', { order: keys });
      };
      li.append(el('button', { className: 'mv', textContent: '▲', onclick: mv(-1) }), el('button', { className: 'mv', textContent: '▼', onclick: mv(1) }));
    } else if (s.cloudId || s.localId) {
      const d = el('button', { className: 'del', textContent: '✕', title: 'Remove' });
      d.onclick = async e => {
        e.stopPropagation(); if (!confirm(`Remove "${s.title}"?`)) return;
        if (s.cloudId) await store.remove('songs', s.cloudId); else await idbDel(s.localId);
      };
      li.append(d);
    }
    list.append(li);
  });
}
const parseYT = u => {
  const m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
  return m ? m[1] : '';
};
const curSong = () => playlist().find(s => keyOf(s) === currentKey);
const isYT = () => !!curSong()?.yt;
let yt = null, ytPromise = null, ytState = -1, ytWant = false, ytTimer = null, ytId = '';
const isPlaying = () => isYT() ? (ytState === 1 || ytState === 3) : !audio.paused;

function ytApi() {
  return ytPromise ||= new Promise(res => {
    if (window.YT?.Player) return res();
    window.onYouTubeIframeAPIReady = res;
    document.head.append(el('script', { src: 'https://www.youtube.com/iframe_api' }));
  });
}
async function ytLoad(id, autoplay) {
  ytId = id; ytState = -1; setPlaying(false); clearInterval(ytTimer);
  await ytApi();
  if (ytId !== id) return;
  if (yt?.loadVideoById) { autoplay ? yt.loadVideoById(id) : yt.cueVideoById(id); return; }
  if (yt) return; // still being created: onReady will pick up ytId
  yt = new YT.Player('ytPlayer', {
    videoId: id,
    playerVars: { playsinline: 1, controls: 0, rel: 0, modestbranding: 1, origin: location.origin },
    events: {
      onReady: () => { ytWant ? yt.loadVideoById(ytId) : yt.cueVideoById(ytId); },
      onStateChange: ytOnState, onError: ytOnError
    }
  });
}
function ytProgress() {
  const d = yt.getDuration();
  if (d) $('seek').value = yt.getCurrentTime() / d * 100;
  $('tNow').textContent = fmt(yt.getCurrentTime());
}
function ytOnState(e) {
  if (!isYT()) return;
  ytState = e.data; setPlaying(ytState === 1 || ytState === 3);
  clearInterval(ytTimer);
  if (ytState === 1) { $('tTotal').textContent = fmt(yt.getDuration()); ytTimer = setInterval(ytProgress, 500); ytProgress(); }
  if (ytState === 0) loadSong(nextIndex(), true);
}
function ytOnError() {
  setPlaying(false);
  $('songNote').replaceChildren('This video blocks embedding 😕 ',
    el('a', { href: 'https://youtu.be/' + ytId, target: '_blank', rel: 'noopener', textContent: 'Open on YouTube' }));
}

function loadSong(i, autoplay = false) {
  const pl = playlist(); if (!pl.length) return;
  idx = (i + pl.length) % pl.length;
  const s = pl[idx]; currentKey = keyOf(s);
  $('songTitle').textContent = s.title; $('songNote').textContent = s.note || '';
  $('seek').value = 0; $('tNow').textContent = '0:00'; $('tTotal').textContent = '0:00';
  $('ytWrap').hidden = !s.yt; $('vinylWrap').hidden = !!s.yt;
  if (s.yt) {
    audio.pause(); ytWant = autoplay; ytLoad(s.yt, autoplay);
  } else {
    ytWant = false; clearInterval(ytTimer);
    try { yt?.pauseVideo?.(); } catch { }
    audio.src = s.src;
    if (autoplay) play();
  }
  buildList();
}
function play() { if (isYT()) { ytWant = true; yt?.playVideo?.(); } else audio.play().catch(() => { }); }
function pause() { if (isYT()) { ytWant = false; yt?.pauseVideo?.(); } else audio.pause(); }
const nextIndex = () => {
  const n = playlist().length;
  return shuffle && n > 1 ? (idx + 1 + Math.floor(Math.random() * (n - 1))) % n : idx + 1;
};
function setPlaying(p) { $('playPause').textContent = p ? '⏸' : '▶'; $('vinyl').classList.toggle('playing', p); }
audio.addEventListener('play', () => !isYT() && setPlaying(true));
audio.addEventListener('pause', () => !isYT() && setPlaying(false));
audio.addEventListener('ended', () => !isYT() && loadSong(nextIndex(), true));
audio.addEventListener('error', () => { if (!isYT() && audio.getAttribute('src')) $('songNote').textContent = "Couldn't play this one 😕 (is the link a direct .mp3?)"; });
audio.addEventListener('loadedmetadata', () => { if (!isYT()) $('tTotal').textContent = fmt(audio.duration); });
audio.addEventListener('timeupdate', () => {
  if (isYT()) return;
  if (audio.duration) $('seek').value = audio.currentTime / audio.duration * 100;
  $('tNow').textContent = fmt(audio.currentTime);
});
$('seek').addEventListener('input', e => {
  const v = e.target.value / 100;
  if (isYT()) { const d = yt?.getDuration?.(); if (d) yt.seekTo(v * d, true); }
  else if (audio.duration) audio.currentTime = v * audio.duration;
});
$('playPause').onclick = () => { if (!currentKey) loadSong(0); isPlaying() ? pause() : play(); };
$('nextSong').onclick = () => loadSong(nextIndex(), isPlaying());
$('prevSong').onclick = () => loadSong(idx - 1, isPlaying());
$('shuffleBtn').onclick = () => { shuffle = !shuffle; $('shuffleBtn').textContent = '🔀 Shuffle: ' + (shuffle ? 'on' : 'off'); };
$('reorderBtn').onclick = () => { reorder = !reorder; $('reorderBtn').textContent = reorder ? '✅ Done' : '↕ Reorder'; buildList(); };

store.sub('songs', list => { cloudSongs = list; if (!currentKey) loadSong(0); else buildList(); });

$('addLink').onclick = () => {
  const u = el('input', { type: 'url', placeholder: 'YouTube link or direct .mp3 link' });
  const t = el('input', { type: 'text', placeholder: 'Song name' });
  const b = el('button', { className: 'btn', textContent: 'Add song 🎶' });
  u.onchange = async () => {
    const id = parseYT(u.value);
    if (id && !t.value) {
      try { const r = await fetch(`https://www.youtube.com/oembed?url=https://youtu.be/${id}&format=json`); t.value = (await r.json()).title || ''; } catch { }
    }
  };
  b.onclick = async () => {
    const url = u.value.trim(); if (!url) return;
    const id = parseYT(url);
    if (!id && !/^https?:\/\//i.test(url)) return alert('Please paste a valid link');
    await store.add('songs', { title: t.value.trim() || (id ? 'YouTube song' : 'New song'), url, ...(id ? { yt: id } : {}), by: me });
    closeModal();
  };
  openModal('Add a song', 'Paste a YouTube link (it plays inside the app) or a direct .mp3 link. Both of you will see it.', form(u, t, b));
};
const idb = new Promise(res => {
  const r = indexedDB.open('love', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('songs', { keyPath: 'id', autoIncrement: true });
  r.onsuccess = () => res(r.result); r.onerror = () => res(null);
});
const idbTx = async (mode, fn) => { const db = await idb; if (!db) return; return new Promise(res => { const t = db.transaction('songs', mode); const q = fn(t.objectStore('songs')); t.oncomplete = () => res(q?.result); }); };
const idbDel = async id => { await idbTx('readwrite', s => s.delete(id)); loadLocalSongs(); };
async function loadLocalSongs() {
  const all = (await idbTx('readonly', s => s.getAll())) || [];
  localSongs.forEach(s => URL.revokeObjectURL(s.src));
  localSongs = all.map(r => ({ title: r.title, src: URL.createObjectURL(r.blob), note: 'From this phone 📱', localId: r.id }));
  buildList();
}
$('addFile').onclick = () => $('songFile').click();
$('songFile').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  const title = prompt('Song name?', f.name.replace(/\.[^.]+$/, '')) || f.name;
  await idbTx('readwrite', s => s.add({ title, blob: f }));
  e.target.value = ''; loadLocalSongs();
};
loadLocalSongs();

/* ---------- Song dedications ---------- */
$('dedicateBtn').onclick = () => {
  if (!me) return;
  const s = playlist()[idx]; if (!s) return;
  const msg = el('textarea', { rows: 3, maxLength: 200, placeholder: `Why this song, ${other()}?…` });
  const b = el('button', { className: 'btn', textContent: 'Send dedication 💝' });
  b.onclick = async () => { await store.add('dedications', { title: s.title, message: msg.value.trim(), by: me, to: other() }); closeModal(); burst(innerWidth / 2, innerHeight / 2, 16); };
  openModal(`Dedicate “${s.title}” to ${other()}`, '', form(msg, b));
};
store.sub('dedications', l => { dedications = l; renderDed(); });
function playByTitle(title) {
  const i = playlist().findIndex(s => s.title === title);
  if (i >= 0) { loadSong(i, true); $('player').scrollIntoView({ behavior: 'smooth' }); }
}
function renderDed() {
  const box = $('dedList'); box.replaceChildren();
  const recent = [...dedications].reverse().slice(0, 5);
  if (!recent.length) box.append(el('p', { className: 'note', textContent: 'Nothing yet. Pick a song and tap 💝 Dedicate.' }));
  recent.forEach(d => {
    const b = el('button', { className: 'btn sm', textContent: '▶ Play' });
    b.onclick = () => playByTitle(d.title);
    box.append(el('div', { className: 'ded' }, el('b', { textContent: `${d.by} → ${d.to}` }),
      el('div', { className: 'dt', textContent: '🎧 ' + d.title }), d.message ? el('p', { textContent: d.message }) : '', b));
  });
  const seen = +localStorage.getItem('dedSeen') || 0;
  const fresh = me && [...dedications].reverse().find(d => d.by !== me && d.ts > seen);
  const ban = $('dedBanner');
  if (!fresh) { ban.hidden = true; return; }
  const mark = () => { localStorage.setItem('dedSeen', fresh.ts); ban.hidden = true; };
  const pb = el('button', { className: 'btn sm', textContent: '▶ Play' }); pb.onclick = () => { mark(); playByTitle(fresh.title); };
  const x = el('button', { className: 'link', textContent: '✕', onclick: mark });
  ban.replaceChildren(el('span', { textContent: `💝 ${fresh.by} dedicated “${fresh.title}” to you` }), el('span', {}, pb, x));
  ban.hidden = false;
}

/* ---------- Photos ---------- */
function renderPhotos() {
  const box = $('polaroids'); box.replaceChildren();
  [...PHOTOS, ...cloudPhotos].forEach(p => {
    const sub = p.date || (p.ts ? new Date(p.ts).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) + (p.by ? ' · ' + p.by : '') : '');
    const f = el('figure', { className: 'polaroid' },
      el('img', { src: p.src || p.data, alt: p.caption || '', loading: 'lazy' }),
      el('figcaption', { textContent: p.caption || '' }, sub ? el('small', { textContent: sub }) : ''));
    if (p.id && p.by === me) {
      const d = el('button', { className: 'del', textContent: '✕' });
      d.onclick = () => confirm('Remove this photo?') && store.remove('photos', p.id);
      f.append(d);
    }
    box.append(f);
  });
}
store.sub('photos', l => { cloudPhotos = l; renderPhotos(); });
function resizeImage(file, max = 900, q = 0.72) {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = el('canvas', { width: Math.round(img.width * k), height: Math.round(img.height * k) });
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', q));
    };
    img.onerror = rej; img.src = url;
  });
}
$('addPhoto').onclick = () => $('photoFile').click();
$('photoFile').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  let data; try { data = await resizeImage(f); } catch { return alert('Could not read that photo'); }
  const cap = el('input', { type: 'text', placeholder: 'Write a caption…', maxLength: 80 });
  const b = el('button', { className: 'btn', textContent: 'Save to our memories 📸' });
  b.onclick = async () => { b.disabled = true; await store.add('photos', { data, caption: cap.value.trim(), by: me }); closeModal(); };
  openModal('New memory', '', form(el('img', { src: data, className: 'preview' }), cap, b));
};

/* ---------- Scratch card ---------- */
store.sub('scratches', l => { scratches = l; renderScratchLog(); });
function renderScratchLog() {
  const box = $('scratchLog'); box.replaceChildren();
  [...scratches].reverse().slice(0, 4).forEach(s => box.append(el('div', { textContent: `🎟️ ${s.by} won “${s.text}” · ${when(s.ts)}` })));
}
function setupScratch() {
  if (!me) return;
  const key = `scratch_${me}_${new Date().toLocaleDateString('en-CA')}`;
  let st = null; if (SCRATCH_DAILY) { try { st = JSON.parse(localStorage.getItem(key)); } catch { } }
  if (!st) { st = { i: Math.floor(Math.random() * COUPONS.length), done: false }; if (SCRATCH_DAILY) localStorage.setItem(key, JSON.stringify(st)); }
  $('coupon').textContent = COUPONS[st.i % COUPONS.length];
  $('scratchNew').hidden = SCRATCH_DAILY;
  $('scratchNote').textContent = SCRATCH_DAILY ? 'A new card every day 💞' : '';
  const c = $('scratchCanvas'), wrap = $('scratchWrap');
  c.width = wrap.clientWidth || 300; c.height = wrap.clientHeight || 120;
  const ctx = c.getContext('2d');
  ctx.globalCompositeOperation = 'source-over';
  if (st.done && SCRATCH_DAILY) { c.style.display = 'none'; $('scratchNote').textContent = 'Already scratched today. Come back tomorrow 💞'; return; }
  c.style.display = '';
  const g = ctx.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, '#e5c07b'); g.addColorStop(.5, '#f6e3b0'); g.addColorStop(1, '#c99a4b');
  ctx.fillStyle = g; ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = 'rgba(74,47,51,.6)'; ctx.font = '600 20px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('Scratch here 💖', c.width / 2, c.height / 2);
  ctx.globalCompositeOperation = 'destination-out';
  let down = false, last = null, done = false;
  const pos = e => { const r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) * c.width / r.width, y: (e.clientY - r.top) * c.height / r.height }; };
  const draw = e => {
    const p = pos(e); ctx.lineWidth = 38; ctx.lineCap = 'round'; ctx.beginPath();
    ctx.moveTo(last ? last.x : p.x, last ? last.y : p.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p;
  };
  const check = () => {
    if (done) return;
    const d = ctx.getImageData(0, 0, c.width, c.height).data; let clear = 0, n = 0;
    for (let i = 3; i < d.length; i += 64) { n++; if (d[i] === 0) clear++; }
    if (clear / n > 0.5) reveal();
  };
  const reveal = () => {
    done = true; c.style.display = 'none';
    if (SCRATCH_DAILY) { st.done = true; localStorage.setItem(key, JSON.stringify(st)); $('scratchNote').textContent = 'Come back tomorrow for a new one 💞'; }
    store.add('scratches', { text: COUPONS[st.i % COUPONS.length], by: me });
    burst(innerWidth / 2, innerHeight / 2, 28);
  };
  c.onpointerdown = e => { down = true; c.setPointerCapture(e.pointerId); draw(e); };
  c.onpointermove = e => { if (down) draw(e); };
  c.onpointerup = c.onpointercancel = () => { down = false; last = null; check(); };
}
$('scratchNew').onclick = setupScratch;

/* ---------- Letters + voice notes ---------- */
store.sub('voices', l => { voices = l; if (currentLetter !== null) renderVoices(); });
LETTERS.forEach((l, i) => {
  const d = el('div', { className: 'letter' });
  d.innerHTML = `<i>${l.icon}</i>${l.title.replace('Open ', 'Open<br>')}`;
  d.onclick = e => { currentLetter = i; openModal(l.title, l.text, el('div', { id: 'voiceBox' }), true); renderVoices(); burst(e.clientX, e.clientY, 6); };
  $('letters').append(d);
});
function renderVoices() {
  const box = $('voiceBox'); if (!box) return;
  const l = LETTERS[currentLetter]; box.replaceChildren();
  if (l.audio) box.append(el('div', { className: 'voice' }, el('small', { textContent: '🎙 Rajendra' }), el('audio', { controls: true, src: l.audio })));
  voices.filter(v => v.letter === currentLetter).forEach(v => {
    const row = el('div', { className: 'voice' }, el('small', { textContent: `🎙 ${v.by || ''} · ${when(v.ts)}` }), el('audio', { controls: true, src: v.data }));
    if (v.by === me) { const x = el('button', { className: 'link', textContent: 'delete' }); x.onclick = () => store.remove('voices', v.id); row.append(x); }
    box.append(row);
  });
  const btn = el('button', { className: 'btn rec sm', id: 'recBtn', textContent: '🎙 Record a voice note' }); btn.onclick = toggleRec;
  box.append(btn, el('small', { id: 'recStatus', className: 'note' }));
}
async function toggleRec() {
  if (rec) return stopRec(false);
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return alert('Recording is not supported in this browser');
  let stream; try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { return alert('Please allow microphone access'); }
  const mime = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find(t => MediaRecorder.isTypeSupported(t));
  const mr = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), audioBitsPerSecond: 32000 });
  const chunks = [], letter = currentLetter; let secs = 0;
  mr.ondataavailable = e => e.data.size && chunks.push(e.data);
  mr.onstop = async () => {
    stream.getTracks().forEach(t => t.stop()); clearInterval(rec?.timer);
    const cancelled = rec?.cancel; rec = null;
    if ($('recBtn')) { $('recBtn').classList.remove('on'); $('recBtn').textContent = '🎙 Record a voice note'; }
    if (cancelled || !chunks.length) return;
    const blob = new Blob(chunks, { type: mr.mimeType });
    const data = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
    if (data.length > 900000) return alert('That one is too long 😅 keep it under ~45 seconds');
    await store.add('voices', { letter, data, by: me });
  };
  mr.start();
  const timer = setInterval(() => {
    secs++; if ($('recStatus')) $('recStatus').textContent = `Recording… ${secs}s (tap to stop)`;
    if (secs >= 45) stopRec(false);
  }, 1000);
  rec = { mr, timer, cancel: false };
  $('recBtn').classList.add('on'); $('recBtn').textContent = '⏹ Stop & save';
}
function stopRec(cancel) { if (!rec) return; rec.cancel = cancel; rec.mr.state !== 'inactive' && rec.mr.stop(); }

/* ---------- Note wall ---------- */
function renderNotes() {
  const box = $('notes'); box.replaceChildren();
  if (!notes.length) box.append(el('p', { className: 'note', textContent: 'No notes yet. Be the first 💕' }));
  [...notes].reverse().forEach(n => {
    const s = el('div', { className: 'stick ' + (n.by === 'Shivi' ? 's' : 'r') },
      el('b', { textContent: n.by || '?' }), el('p', { textContent: n.text }), el('small', { textContent: when(n.ts) }));
    if (n.by === me) { const x = el('button', { className: 'del', textContent: '✕' }); x.onclick = () => confirm('Delete this note?') && store.remove('notes', n.id); s.append(x); }
    box.append(s);
  });
}
store.sub('notes', l => { notes = l; renderNotes(); });
$('noteSend').onclick = async () => {
  const t = $('noteText').value.trim(); if (!t) return;
  $('noteText').value = ''; await store.add('notes', { text: t, by: me });
  burst(innerWidth / 2, innerHeight * .7, 8);
};

/* ---------- Reasons, timeline, secret ---------- */
let bag = [];
$('reasonBtn').onclick = e => {
  if (!bag.length) bag = [...REASONS].sort(() => Math.random() - .5);
  const r = $('reason'); r.textContent = bag.pop();
  r.classList.remove('pop'); void r.offsetWidth; r.classList.add('pop');
  burst(e.clientX, e.clientY, 8);
};
TIMELINE.forEach(t => { const li = el('li'); li.innerHTML = `<b>${t.when}</b><p>${t.text}</p>`; $('timeline').append(li); });
$('kuchBtn').onclick = () => { openModal(SECRET_TITLE, SECRET_TEXT); burst(innerWidth / 2, innerHeight / 2, 30); };

function rerenderAll() { renderPhotos(); renderNotes(); renderMoods(); renderDed(); buildList(); setupScratch(); }

/* ---------- Install (PWA) ---------- */
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
let deferred = null;
if (standalone) $('installBtn').hidden = true;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; });
addEventListener('appinstalled', () => $('installBtn').hidden = true);
$('installBtn').onclick = async () => {
  if (deferred) { deferred.prompt(); await deferred.userChoice; deferred = null; return; }
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  openModal('Add to home screen', ios
    ? 'Tap the Share button in Safari, then “Add to Home Screen”. It will open like a real app 💕'
    : 'Tap the ⋮ menu in Chrome, then “Add to Home screen” (or “Install app”). It will open like a real app 💕');
};
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));

/* ---------- Tap hearts ---------- */
function burst(x, y, n = 1) {
  const em = ['💕', '💖', '💗', '❤️', '🌸', '✨'];
  for (let i = 0; i < n; i++) {
    const h = el('div', { className: 'fh', textContent: em[Math.floor(Math.random() * em.length)] });
    h.style.cssText = `left:${x}px;top:${y}px;font-size:${16 + Math.random() * 18}px;animation-delay:${Math.random() * .25}s`;
    h.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
    document.body.append(h); setTimeout(() => h.remove(), 2000);
  }
}
document.addEventListener('pointerdown', e => {
  if (e.target.closest('button,a,input,textarea,li,canvas,.letter,.modal,.polaroid,.notes,.intro')) return;
  burst(e.clientX, e.clientY, 3);
});

/* ---------- Petals (light) / fireflies (dark) ---------- */
(() => {
  const c = $('petals'), ctx = c.getContext('2d'); let W, H;
  const resize = () => { W = c.width = innerWidth; H = c.height = innerHeight; };
  resize(); addEventListener('resize', resize);
  const N = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 28;
  const ps = Array.from({ length: N }, (_, i) => ({
    x: Math.random() * innerWidth, y: Math.random() * innerHeight, s: 6 + Math.random() * 9, v: .4 + Math.random() * .9,
    a: Math.random() * 6.28, r: Math.random() * .03 + .01, col: ['#f4a5b5', '#f8c6cf', '#e98aa0', '#ffd9c9'][i % 4]
  }));
  (function frame() {
    ctx.clearRect(0, 0, W, H);
    const dark = root.classList.contains('dark');
    ps.forEach(p => {
      p.a += p.r;
      if (dark) {
        p.y -= p.v * .35; p.x += Math.sin(p.a) * .5;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        ctx.globalAlpha = .35 + .6 * Math.abs(Math.sin(p.a * 1.7));
        ctx.fillStyle = '#ffe9a8'; ctx.shadowColor = '#ffd36b'; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s * .22, 0, 6.28); ctx.fill(); ctx.shadowBlur = 0;
      } else {
        p.y += p.v; p.x += Math.sin(p.a) * .6;
        if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.col; ctx.globalAlpha = .75;
        ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * .55, 0, 0, 6.28); ctx.fill(); ctx.restore();
      }
    });
    requestAnimationFrame(frame);
  })();
})();

if (me) {
  const b = document.querySelector(`.enter[data-me="${me}"]`); if (b) b.textContent = `Continue as ${me} 💕`;
  document.querySelectorAll('.enter').forEach(x => { if (x.dataset.me !== me) x.style.opacity = .6; });
}
