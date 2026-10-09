/* ============================================================
   ✏️  EDIT THIS PART — your personal content
   ============================================================ */

// 1) Firebase (for the shared note wall, photos, voice notes & link-songs).
//    Leave apiKey empty to run in "this device only" mode. See SETUP.md (5 minutes).
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBjbPR7y1dzLKMOOaraTFh7JzEKQrL0Cn4",
  authDomain: "music-5a507.firebaseapp.com",
  projectId: "music-5a507",
  appId: "1:640448968735:web:1a1a1a1a1a1a1a1a1a1a1a"
};
const ROOM = "shivi-raj-loveforever8966873580-123";   // 👈 any secret word; must match your Firestore rules (SETUP.md)

// 2) Default dates (either of you can change them inside the app too)
const START_DATE = "2024-07-10T00:00:00";

// 3) Songs that live in your repo. Drop the mp3 in this folder and add a line here.
const SONGS = [
  { title: "Izahaar", src: "Izahaar.mp3", note: "सोना बाली 💕" },
  { title: "Zubaida", src: "Zubaida.mp3", note: "महारानी 💕" },
  { title: "Raju",    src: "RAJU.mp3",    note: "प्रियतम 💕" }
  // { title: "New song", src: "songs/new.mp3", note: "why it's ours" },
];

// 4) Photos that live in your repo (put files in /photos). Photos added inside the app show up too.
const PHOTOS = [
  { src: "image.jpg", caption: "Us 💫♾️", date: "" }
  // { src: "photos/1.jpg", caption: "Our first date", date: "Feb 2024" },
];

// 5) "Open when" letters. Optional: audio: "voice/miss.mp3" to attach a voice file from the repo.
const LETTERS = [
  { icon: "🥺", title: "Open when you miss me",
    text: "Close your eyes for a second.\nI'm right there with you, in every song, in every little smile you hide.\n\nDistance is just a number. You're always my home." },
  { icon: "😔", title: "Open when you're sad",
    text: "Hey you. It's okay to have a heavy day.\nBreathe. Drink some water. Call me.\n\nYou are stronger than you feel and softer than you think, and I'm proud of you." },
  { icon: "🌙", title: "Open when you can't sleep",
    text: "Put on our songs, hug your pillow like it's me.\n\nGoodnight, my Shivi. Dream of us.\nI'll meet you there." },
  { icon: "😊", title: "Open when you need a smile",
    text: "Remember the first time we laughed till our stomachs hurt?\n\nThat laugh is my favourite sound in the whole world." },
  { icon: "🎂", title: "Open on your birthday",
    text: "Happy birthday, my love 🎉\nAnother year of you, and the world is better for it.\n\nI promise a lifetime of cake, chaos and cuddles." },
  { icon: "💍", title: "Open when you doubt us",
    text: "Not perfect, but real.\nI choose you today, tomorrow, and on every ordinary day after.\n\nAlways. ♾️" }
];

const REASONS = [
  "Your smile fixes my worst days.", "You make ordinary moments feel special.",
  "The way you laugh at my silly jokes.", "You feel like home.",
  "You believe in me, even when I don't.", "Your kindness. It's the real you.",
  "You're my best friend and my love in one person.", "I'm a better person with you.",
  "Because it's you. Just you. ♾️"
];

const TIMELINE = [
  { when: "The beginning", text: "फूल तस्वीर 💫" },
  { when: "First date", text: "मासी का घर,गुलाबजामुन, तस्वीर" },
  { when: "A favourite memory", text: "भईया की शादी और मिलना" },
  { when: "Today", text: "आज भी आपको माँगा था" },
  { when: "Tomorrow & after", text: "जीवन भर पदोरी से लड़ना है ♾️" }
];

const SECRET_TITLE = "Kuch nhi…";
const SECRET_TEXT = "Bas itna kehna tha —\n\nI love you, Shivi.\nJust like that, for no reason at all. 💕";

/* ============================================================
   App code
   ============================================================ */
const $ = id => document.getElementById(id);
const el = (tag, props = {}, ...kids) => {
  const e = Object.assign(document.createElement(tag), props);
  kids.flat().forEach(k => e.append(k));
  return e;
};
const when = ts => new Date(ts).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
let me = localStorage.getItem('me') || '';

/* ---------- Data layer: Firebase if configured, otherwise this device ---------- */
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
async function makeStore() {
  if (!FIREBASE_CONFIG.apiKey) return localStore();
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
        s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))),
        err => console.error(n, err))
    };
  } catch (e) { console.error(e); return localStore(); }
}
const store = await makeStore();
$('syncState').textContent = store.mode === 'cloud' ? '☁️ synced between you two' : '📴 this device only (see SETUP.md)';

/* ---------- Modal ---------- */
function openModal(title, text = '', extra = null, sign = false) {
  $('modalTitle').textContent = title;
  $('modalText').textContent = text;
  $('modalText').style.display = text ? '' : 'none';
  $('modalSign').style.display = sign ? '' : 'none';
  $('modalExtra').replaceChildren(...(extra ? [extra] : []));
  $('modal').hidden = false;
}
function closeModal() { $('modal').hidden = true; currentLetter = null; stopRec(true); }
$('modalClose').onclick = closeModal;
$('modal').addEventListener('click', e => { if (e.target === $('modal')) closeModal(); });

/* ---------- Intro / who am I ---------- */
function enter(name) {
  me = name; localStorage.setItem('me', me);
  $('intro').classList.add('gone'); $('app').classList.add('show');
  loadSong(0); play();
  burst(innerWidth / 2, innerHeight / 2, 12);
  rerenderAll();
}
document.querySelectorAll('.enter').forEach(b => b.onclick = () => enter(b.dataset.me));
$('switchMe').onclick = () => { localStorage.removeItem('me'); location.reload(); };

/* ---------- Settings (dates) ---------- */
let settings = {};
store.sub('settings', list => { settings = Object.fromEntries(list.map(x => [x.id, x])); });
const startDate = () => new Date(settings.main?.start || START_DATE);
const meetDate = () => settings.main?.meet ? new Date(settings.main.meet) : null;

function tick() {
  const s = startDate();
  if (!isNaN(s)) {
    const d = Math.max(0, Date.now() - s);
    $('cDays').textContent = Math.floor(d / 864e5);
    $('cHours').textContent = Math.floor(d / 36e5) % 24;
    $('cMins').textContent = Math.floor(d / 6e4) % 60;
    $('cSecs').textContent = Math.floor(d / 1e3) % 60;
  }
  const m = meetDate();
  if (!m || isNaN(m)) {
    ['mDays', 'mHours', 'mMins'].forEach(i => $(i).textContent = '–');
    $('meetNote').textContent = 'Set the day we see each other next 🗓️';
  } else {
    const d = m - Date.now();
    if (d <= 0) {
      ['mDays', 'mHours', 'mMins'].forEach(i => $(i).textContent = '0');
      $('meetNote').textContent = "We're together right now 🥰";
    } else {
      $('mDays').textContent = Math.floor(d / 864e5);
      $('mHours').textContent = Math.floor(d / 36e5) % 24;
      $('mMins').textContent = Math.floor(d / 6e4) % 60;
      $('meetNote').textContent = 'Every second brings me closer to you 💞';
    }
  }
}
setInterval(tick, 1000); tick();
$('counterNote').textContent = "…and I'd happily do it all again 💞";

document.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => {
  const kind = b.dataset.edit;
  const cur = kind === 'start' ? startDate() : meetDate();
  const pad = n => String(n).padStart(2, '0');
  const val = cur && !isNaN(cur)
    ? (kind === 'start' ? `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}`
      : `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}T${pad(cur.getHours())}:${pad(cur.getMinutes())}`) : '';
  const inp = el('input', { type: kind === 'start' ? 'date' : 'datetime-local', value: val });
  const save = el('button', { className: 'btn', textContent: 'Save 💕' });
  save.onclick = async () => {
    if (!inp.value) return;
    await store.set('settings', 'main', { [kind]: kind === 'start' ? inp.value + 'T00:00:00' : inp.value });
    closeModal(); tick();
  };
  openModal(kind === 'start' ? 'The day we became us' : 'The day I get to hug you', '', el('div', { style: 'display:flex;flex-direction:column;gap:12px' }, inp, save));
});

/* ---------- Music ---------- */
const audio = $('audio');
let idx = 0, cloudSongs = [], localSongs = [];
const fmt = t => isFinite(t) ? Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0') : '0:00';
const playlist = () => [
  ...SONGS,
  ...cloudSongs.map(s => ({ title: s.title, src: s.url, note: `Added by ${s.by || 'us'} 💕`, cloudId: s.id, by: s.by })),
  ...localSongs
];
function buildList() {
  const list = $('songList'); list.replaceChildren();
  playlist().forEach((s, i) => {
    const li = el('li', { textContent: '♪  ' + s.title, className: i === idx ? 'active' : '' });
    li.onclick = () => { loadSong(i); play(); };
    if (s.cloudId || s.localId) {
      const d = el('button', { className: 'del', textContent: '✕', title: 'Remove' });
      d.onclick = async e => {
        e.stopPropagation();
        if (!confirm(`Remove "${s.title}"?`)) return;
        if (s.cloudId) await store.remove('songs', s.cloudId); else await idbDel(s.localId);
      };
      li.append(d);
    }
    list.append(li);
  });
}
function loadSong(i) {
  const pl = playlist(); idx = (i + pl.length) % pl.length;
  const s = pl[idx];
  audio.src = s.src;
  $('songTitle').textContent = s.title;
  $('songNote').textContent = s.note || '';
  $('seek').value = 0; $('tNow').textContent = '0:00';
  buildList();
}
const play = () => audio.play().catch(() => {});
function setPlaying(p) { $('playPause').textContent = p ? '⏸' : '▶'; $('vinyl').classList.toggle('playing', p); }
audio.addEventListener('play', () => setPlaying(true));
audio.addEventListener('pause', () => setPlaying(false));
audio.addEventListener('ended', () => { loadSong(idx + 1); play(); });
audio.addEventListener('error', () => { if (audio.src) $('songNote').textContent = "Couldn't play this one 😕 (is the link a direct .mp3?)"; });
audio.addEventListener('loadedmetadata', () => $('tTotal').textContent = fmt(audio.duration));
audio.addEventListener('timeupdate', () => {
  if (audio.duration) $('seek').value = audio.currentTime / audio.duration * 100;
  $('tNow').textContent = fmt(audio.currentTime);
});
$('seek').addEventListener('input', e => { if (audio.duration) audio.currentTime = e.target.value / 100 * audio.duration; });
$('playPause').onclick = () => audio.paused ? play() : audio.pause();
$('nextSong').onclick = () => { loadSong(idx + 1); play(); };
$('prevSong').onclick = () => { loadSong(idx - 1); play(); };

store.sub('songs', list => {
  cloudSongs = list;
  const cur = audio.src; buildList();
  if (!cur) loadSong(0);
});

// Add song by link (shared)
$('addLink').onclick = () => {
  const t = el('input', { type: 'text', placeholder: 'Song name' });
  const u = el('input', { type: 'url', placeholder: 'https://…/song.mp3 (direct audio link)' });
  const b = el('button', { className: 'btn', textContent: 'Add song 🎶' });
  b.onclick = async () => {
    if (!t.value.trim() || !u.value.trim()) return;
    await store.add('songs', { title: t.value.trim(), url: u.value.trim(), by: me });
    closeModal();
  };
  openModal('Add a song', 'Needs a direct link to an .mp3 file (YouTube/Spotify links won\'t play here). Both of you will see it.',
    el('div', { style: 'display:flex;flex-direction:column;gap:10px' }, t, u, b));
};

// Add song from phone (this device only, stored in IndexedDB)
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

/* ---------- Photos ---------- */
let cloudPhotos = [];
function renderPhotos() {
  const box = $('polaroids'); box.replaceChildren();
  [...PHOTOS, ...cloudPhotos].forEach(p => {
    const f = el('figure', { className: 'polaroid' },
      el('img', { src: p.src || p.data, alt: p.caption || '', loading: 'lazy' }),
      el('figcaption', { textContent: p.caption || '' }, p.date || p.ts ? el('small', { textContent: p.date || new Date(p.ts).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) + (p.by ? ' · ' + p.by : '') }) : ''));
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
  openModal('New memory', '', el('div', { style: 'display:flex;flex-direction:column;gap:10px' }, el('img', { src: data, className: 'preview' }), cap, b));
};

/* ---------- Letters + voice notes ---------- */
let voices = [], currentLetter = null, rec = null;
store.sub('voices', l => { voices = l; if (currentLetter !== null) renderVoices(); });

LETTERS.forEach((l, i) => {
  const d = el('div', { className: 'letter' });
  d.innerHTML = `<i>${l.icon}</i>${l.title.replace('Open ', 'Open<br>')}`;
  d.onclick = e => { currentLetter = i; openModal(l.title, l.text, el('div', { id: 'voiceBox' }), true); renderVoices(); burst(e.clientX, e.clientY, 6); };
  $('letters').append(d);
});

function renderVoices() {
  const box = $('voiceBox'); if (!box) return;
  const l = LETTERS[currentLetter];
  box.replaceChildren();
  if (l.audio) box.append(el('div', { className: 'voice' }, el('small', { textContent: '🎙 Rajendra' }), el('audio', { controls: true, src: l.audio })));
  voices.filter(v => v.letter === currentLetter).forEach(v => {
    const row = el('div', { className: 'voice' }, el('small', { textContent: `🎙 ${v.by || ''} · ${when(v.ts)}` }), el('audio', { controls: true, src: v.data }));
    if (v.by === me) { const x = el('button', { className: 'link', textContent: 'delete' }); x.onclick = () => store.remove('voices', v.id); row.append(x); }
    box.append(row);
  });
  const status = el('small', { id: 'recStatus', className: 'note' });
  const btn = el('button', { className: 'btn rec sm', id: 'recBtn', textContent: '🎙 Record a voice note' });
  btn.onclick = toggleRec;
  box.append(btn, status);
}
async function toggleRec() {
  if (rec) return stopRec(false);
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return alert('Recording is not supported in this browser');
  let stream; try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { return alert('Please allow microphone access'); }
  const mime = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find(t => MediaRecorder.isTypeSupported(t));
  const mr = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), audioBitsPerSecond: 32000 });
  const chunks = []; const letter = currentLetter; let secs = 0;
  mr.ondataavailable = e => e.data.size && chunks.push(e.data);
  mr.onstop = async () => {
    stream.getTracks().forEach(t => t.stop()); clearInterval(rec?.timer);
    const cancelled = rec?.cancel; rec = null;
    $('recBtn') && ($('recBtn').classList.remove('on'), $('recBtn').textContent = '🎙 Record a voice note');
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
let notes = [];
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
  $('noteText').value = '';
  await store.add('notes', { text: t, by: me });
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

function rerenderAll() { renderPhotos(); renderNotes(); buildList(); }

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
  if (e.target.closest('button,a,input,textarea,li,.letter,.modal,.polaroid,.notes')) return;
  burst(e.clientX, e.clientY, 3);
});

/* ---------- Falling petals ---------- */
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
    ps.forEach(p => {
      p.y += p.v; p.a += p.r; p.x += Math.sin(p.a) * .6;
      if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; }
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.col; ctx.globalAlpha = .75;
      ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * .55, 0, 0, 6.28); ctx.fill(); ctx.restore();
    });
    requestAnimationFrame(frame);
  })();
})();

/* Returning visitor: skip the question, keep the music tap */
if (me) { const b = document.querySelector(`.enter[data-me="${me}"]`); if (b) b.textContent = `Continue as ${me} 💕`; document.querySelectorAll('.enter').forEach(x => { if (x.dataset.me !== me) x.style.opacity = .6; }); }
