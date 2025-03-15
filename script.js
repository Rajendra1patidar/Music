const musicBtn = document.getElementById('musicBtn');
const alibabaBtn = document.getElementById('alibabaBtn');
const musicPlayer = document.getElementById('musicPlayer');
const alibabaEffect = document.getElementById('alibabaEffect');
const heartsContainer = document.querySelector('.hearts-container');
const emojisContainer = document.querySelector('.emojis-container');
const prevSongBtn = document.getElementById('prevSong');
const playPauseBtn = document.getElementById('playPause');
const nextSongBtn = document.getElementById('nextSong');
const songTitle = document.getElementById('songTitle');

const songs = [
  { title: "Song 1", src: "Izahaar.mp3" },
  { title: "Song 2", src: "RAJU.mp3" },
  { title: "Song 3", src: "Zubaida.mp3" }
];

let currentSongIndex = 0;
let audio = new Audio(songs[currentSongIndex].src);
let isPlaying = false;

// Music Button
musicBtn.addEventListener('click', () => {
  musicPlayer.classList.remove('hidden');
  alibabaEffect.classList.add('hidden');
  startHearts();
  playSong();
});

// ALIBABA Button
alibabaBtn.addEventListener('click', () => {
  musicPlayer.classList.add('hidden');
  alibabaEffect.classList.remove('hidden');
  startEmojis();
  stopSong();
});

// Play/Pause Song
playPauseBtn.addEventListener('click', () => {
  if (isPlaying) {
    audio.pause();
    playPauseBtn.textContent = '▶️';
  } else {
    audio.play();
    playPauseBtn.textContent = '⏸️';
  }
  isPlaying = !isPlaying;
});

// Next Song
nextSongBtn.addEventListener('click', () => {
  currentSongIndex = (currentSongIndex + 1) % songs.length;
  loadSong();
});

// Previous Song
prevSongBtn.addEventListener('click', () => {
  currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
  loadSong();
});

function loadSong() {
  audio.src = songs[currentSongIndex].src;
  songTitle.textContent = songs[currentSongIndex].title;
  if (isPlaying) {
    audio.play();
  }
}

function playSong() {
  audio.play();
  isPlaying = true;
  playPauseBtn.textContent = '⏸️';
}

function stopSong() {
  audio.pause();
  isPlaying = false;
  playPauseBtn.textContent = '▶️';
}

function startHearts() {
  heartsContainer.innerHTML = '';
  for (let i = 0; i < 20; i++) {
    const heart = document.createElement('span');
    heart.textContent = '💕';
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.animationDuration = `${Math.random() * 3 + 2}s`;
    heartsContainer.appendChild(heart);
  }
}

function startEmojis() {
  emojisContainer.innerHTML = '';
  for (let i = 0; i < 20; i++) {
    const emoji = document.createElement('span');
    emoji.textContent = Math.random() > 0.5 ? '🍼' : '🐥';
    emoji.style.left = `${Math.random() * 100}%`;
    emoji.style.animationDuration = `${Math.random() * 3 + 2}s`;
    emojisContainer.appendChild(emoji);
  }
                                         }
