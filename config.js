/* ============================================================
   ✏️  ALL YOUR PERSONAL CONTENT LIVES HERE
   ============================================================ */

// 1) Firebase. Copy apiKey and appId from your OLD script.js (or Firebase → Project settings).
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBjbPR7y1dzLKMOOaraTFh7JzEKQrL0Cn4",
  authDomain: "music-5a507.firebaseapp.com",
  projectId: "music-5a507",
  appId: "1:640448968735:web:1a1a1a1a1a1a1a1a1a1a1a"
};
export const ROOM = "shivi-raj-loveforever8966873580-123";   // must match your Firestore rules

// 2) Dates (you can also change them inside the app)
export const START_DATE = "2024-07-10T00:00:00";

// 3) Lock screen. A soft gate: answers are matched ignoring spaces, case and punctuation.
export const LOCK_ENABLED = true;
export const LOCK_HINT = "The day we became us 💫 (DD/MM/YYYY)";
export const LOCK_ANSWERS = ["10/07/2024", "10 july 2024", "10 jul 2024", "10/7/2024"];

// 4) Songs in your repo (drop mp3 in the folder, add a line)
export const SONGS = [
  { title: "Izahaar", src: "Izahaar.mp3", note: "सोना बाली 💕" },
  { title: "Zubaida", src: "Zubaida.mp3", note: "महारानी 💕" },
  { title: "Raju",    src: "RAJU.mp3",    note: "सेबडी 💕" }
];

// 5) Photos in your repo (files in /photos). Photos added inside the app show up too.
export const PHOTOS = [
  { src: "image.jpg", caption: "Us 💫♾️", date: "" }
];

// 6) Scratch-card coupons (she gets one random card per day)
export const SCRATCH_DAILY = true;     // false = unlimited cards (good for testing)
export const COUPONS = [
  "One big warm hug 🤗", "Your choice of movie tonight 🎬","अली बाबा का फोटो", "A long phone call, no rushing 📞",
  "One free kiss, redeemable anytime 😘", "I'll listen to your favourite song with you 🎧",
  "लोरी सुनाओ मुझे","होठ पे पप्पी दो ",
  "Dinner treat: you pick the place 🍽️", "One 'I was wrong' pass 😅", "A handwritten love letter ✍️",
  "I'll say yes to anything small today 😇", "A surprise gift is coming 🎁"
];

// 7) Open-when letters (optional: audio: "voice/miss.mp3")
export const LETTERS = [
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

export const REASONS = [
  "Your smile fixes my worst days.", "You make ordinary moments feel special.",
  "The way you laugh at my silly jokes.", "You feel like home.",
  "You believe in me, even when I don't.", "Your kindness. It's the real you.",
  "You're my best friend and my love in one person.", "I'm a better person with you.",
  "Because it's you. Just you. ♾️","I love you more than words can say.","Every day with you is my favourite day.",
   "You are my heart, my soul, my everything.","पदोरी","सेब्डी", "बसुन्दी",
];

export const TIMELINE = [
  { when: "The beginning", text: "फूल, मिठाई, तस्वीर 💫" },
  { when: "First date", text: "मौसी का घर और गुलाबजामुन " },
  { when: "A favourite memory", text: "भईया की शादी और चुपके चुपके मिलना" },
  { when: "Today", text: "आज भी आपको माँगा है " },
  { when: "Tomorrow & after", text: "पदोरी से लड़ना है  ♾️" }
];

export const SECRET_TITLE = "Kuch nhi…";
export const SECRET_TEXT = "Bas itna kehna tha —\n\nI love you, Shivi.\nJust like that, for no reason at all. 💕";
