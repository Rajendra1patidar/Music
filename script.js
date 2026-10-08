/* ============================================================
   ✏️  EDIT THIS PART — it's all your personal content
   ============================================================ */
const START_DATE = "2024-09-08T00:00:00";   // 👈 CHANGE: the day you two became "us"

const SONGS = [
  { title: "Izahaar", src: "Izahaar.mp3", note: "Replace this line with why this song is ours 💕" },
  { title: "Zubaida", src: "Zubaida.mp3", note: "Replace this line with why this song is ours 💕" },
  { title: "Raju",    src: "RAJU.mp3",    note: "Replace this line with why this song is ours 💕" }
];

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
  "Your smile fixes my worst days.",
  "You make ordinary moments feel special.",
  "The way you laugh at my silly jokes.",
  "You feel like home.",
  "You believe in me, even when I don't.",
  "Your kindness. It's the real you.",
  "You're my best friend and my love in one person.",
  "I'm a better person with you.",
  "Because it's you. Just you. ♾️"
];

const TIMELINE = [
  { when: "The beginning",  text: "फूल और तस्वीर दी थी 💫" },
  { when: "First date",     text: "मासी का घर, गुलाबजामुन, तस्वीरे " },
  { when: "A favourite memory", text: "भईयाजी की शादीमैं ऊपर मिलना" },
  { when: "Today",          text: "आज भी आपको माँगा था, हमेशा आपका साथ माँगा है." },
  { when: "Tomorrow & after", text: "जीवन भर पदोरी सजनी से लड़ना है♾️" }
];

const SECRET_TITLE = "Kuch nhi…";
const SECRET_TEXT  = "Bas itna kehna tha —\n\nI love you, Shivi.\nJust like that, for no reason at all. 💕";

/* ============================================================
   App code
   ============================================================ */
const $ = id => document.getElementById(id);
const audio = $('audio');
let idx = 0;

/* Intro */
$('enterBtn').addEventListener('click', () => {
  $('intro').classList.add('gone');
  $('app').classList.add('show');
  loadSong(0); play();
  burst(window.innerWidth/2, window.innerHeight/2, 12);
});

/* Counter */
function tick(){
  const s = new Date(START_DATE);
  if (isNaN(s)) return;
  let d = Math.max(0, Date.now() - s.getTime());
  $('cDays').textContent  = Math.floor(d/864e5);
  $('cHours').textContent = Math.floor(d/36e5)%24;
  $('cMins').textContent  = Math.floor(d/6e4)%60;
  $('cSecs').textContent  = Math.floor(d/1e3)%60;
}
tick(); setInterval(tick, 1000);
$('counterNote').textContent = "…and I'd happily do it all again 💞";

/* Music */
const fmt = t => isFinite(t) ? Math.floor(t/60)+":"+String(Math.floor(t%60)).padStart(2,'0') : "0:00";
const list = $('songList');
SONGS.forEach((s,i) => {
  const li = document.createElement('li');
  li.textContent = "♪  " + s.title;
  li.onclick = () => { loadSong(i); play(); };
  list.appendChild(li);
});
function loadSong(i){
  idx = (i + SONGS.length) % SONGS.length;
  audio.src = SONGS[idx].src;
  $('songTitle').textContent = SONGS[idx].title;
  $('songNote').textContent  = SONGS[idx].note;
  [...list.children].forEach((li,k)=>li.classList.toggle('active',k===idx));
  $('seek').value = 0; $('tNow').textContent = "0:00";
}
function play(){ audio.play().catch(()=>{}); }
function setPlaying(p){
  $('playPause').textContent = p ? "⏸" : "▶";
  $('vinyl').classList.toggle('playing', p);
}
audio.addEventListener('play',  () => setPlaying(true));
audio.addEventListener('pause', () => setPlaying(false));
audio.addEventListener('ended', () => { loadSong(idx+1); play(); });
audio.addEventListener('loadedmetadata', () => $('tTotal').textContent = fmt(audio.duration));
audio.addEventListener('timeupdate', () => {
  if (audio.duration) $('seek').value = audio.currentTime / audio.duration * 100;
  $('tNow').textContent = fmt(audio.currentTime);
});
$('seek').addEventListener('input', e => { if (audio.duration) audio.currentTime = e.target.value/100*audio.duration; });
$('playPause').onclick = () => audio.paused ? play() : audio.pause();
$('nextSong').onclick  = () => { loadSong(idx+1); play(); };
$('prevSong').onclick  = () => { loadSong(idx-1); play(); };
loadSong(0);

/* Modal / letters */
function openModal(title, text){
  $('modalTitle').textContent = title; $('modalText').textContent = text;
  $('modal').hidden = false;
}
$('modalClose').onclick = () => $('modal').hidden = true;
$('modal').addEventListener('click', e => { if (e.target === $('modal')) $('modal').hidden = true; });
LETTERS.forEach(l => {
  const d = document.createElement('div');
  d.className = 'letter';
  d.innerHTML = `<i>${l.icon}</i>${l.title.replace('Open ','Open<br>')}`;
  d.onclick = e => { openModal(l.title, l.text); burst(e.clientX, e.clientY, 6); };
  $('letters').appendChild(d);
});

/* Reasons (shuffled, no repeats until all seen) */
let bag = [];
$('reasonBtn').onclick = e => {
  if (!bag.length) bag = [...REASONS].sort(() => Math.random()-.5);
  const r = $('reason');
  r.textContent = bag.pop();
  r.classList.remove('pop'); void r.offsetWidth; r.classList.add('pop');
  burst(e.clientX, e.clientY, 8);
};

/* Timeline */
TIMELINE.forEach(t => {
  const li = document.createElement('li');
  li.innerHTML = `<b>${t.when}</b><p>${t.text}</p>`;
  $('timeline').appendChild(li);
});

/* Secret */
$('kuchBtn').onclick = e => {
  openModal(SECRET_TITLE, SECRET_TEXT);
  burst(window.innerWidth/2, window.innerHeight/2, 30);
};

/* Tap hearts */
function burst(x, y, n = 1){
  const em = ['💕','💖','💗','❤️','🌸','✨'];
  for (let i=0;i<n;i++){
    const h = document.createElement('div');
    h.className = 'fh';
    h.textContent = em[Math.floor(Math.random()*em.length)];
    h.style.left = x + 'px'; h.style.top = y + 'px';
    h.style.fontSize = (16 + Math.random()*18) + 'px';
    h.style.setProperty('--dx', (Math.random()*160-80) + 'px');
    h.style.animationDelay = (Math.random()*0.25) + 's';
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 2000);
  }
}
document.addEventListener('pointerdown', e => {
  if (e.target.closest('button,a,input,li,.letter,.modal-box')) return;
  burst(e.clientX, e.clientY, 3);
});

/* Falling petals */
(() => {
  const c = $('petals'), ctx = c.getContext('2d');
  let W, H, ps = [];
  const resize = () => { W = c.width = innerWidth; H = c.height = innerHeight; };
  resize(); addEventListener('resize', resize);
  const N = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 28;
  for (let i=0;i<N;i++) ps.push({
    x:Math.random()*innerWidth, y:Math.random()*innerHeight,
    s:6+Math.random()*9, v:.4+Math.random()*.9, a:Math.random()*6.28, r:Math.random()*.03+.01,
    col:['#f4a5b5','#f8c6cf','#e98aa0','#ffd9c9'][i%4]
  });
  (function frame(){
    ctx.clearRect(0,0,W,H);
    ps.forEach(p => {
      p.y += p.v; p.a += p.r; p.x += Math.sin(p.a)*.6;
      if (p.y > H+20){ p.y = -20; p.x = Math.random()*W; }
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.a);
      ctx.fillStyle = p.col; ctx.globalAlpha = .75;
      ctx.beginPath(); ctx.ellipse(0,0,p.s,p.s*.55,0,0,6.28); ctx.fill();
      ctx.restore();
    });
    requestAnimationFrame(frame);
  })();
})();
