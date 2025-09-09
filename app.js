/* Marriage Journal – wired to index.html v2
   - Multiple entries per day (timestamp key)
   - Mood chips, gratitude, action
   - LocalStorage persistence
   - Basic Scripture suggestion + coach text
*/

const els = {
  entryText: document.getElementById('entryText'),
  gratitude: document.getElementById('gratitude'),
  action: document.getElementById('action'),
  chipsWrap: document.getElementById('moodChips'),
  submitBtn: document.getElementById('submitBtn'),
  saveNote: document.getElementById('saveNote'),
  verseText: document.getElementById('verseText'),
  coachText: document.getElementById('coachText'),
  entriesList: document.getElementById('entriesList'),
};

// ---- Mood chip selection ----
let selectedMood = null;
els.chipsWrap?.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;

  // toggle active state (single-select)
  els.chipsWrap.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  selectedMood = chip.dataset.value || chip.textContent.trim().toLowerCase();
});

// ---- LocalStorage helpers ----
const STORAGE_KEY = 'mj.entries.v1';

function loadEntries() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function saveEntry(entry) {
  const all = loadEntries();
  all.unshift(entry); // newest first
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return all;
}

// ---- Simple Scripture suggestions ----
const scriptures = [
  { k: ['anger','angry','frustrated','conflict','argue','fight'], v: '“Be kind to one another, tenderhearted, forgiving one another, as God in Christ forgave you.” — Ephesians 4:32' },
  { k: ['sad','hurt','hopeless','anxious','fear'], v: '“Cast all your anxiety on him because he cares for you.” — 1 Peter 5:7' },
  { k: ['joy','grateful','gratitude','thankful'], v: '“Give thanks to the Lord, for he is good; his steadfast love endures forever.” — Psalm 107:1' },
  { k: ['trust','faith','uncertain','don’t know',"don't know"], v: '“Trust in the Lord with all your heart and lean not on your own understanding.” — Proverbs 3:5' },
  { k: ['marriage','love','spouse','husband','wife'], v: '“Above all, keep loving one another earnestly, since love covers a multitude of sins.” — 1 Peter 4:8' },
];

function pickScripture(text, mood, gratitude, action) {
  const hay = [text, mood, gratitude, action].join(' ').toLowerCase();
  for (const s of scriptures) {
    if (s.k.some(w => hay.includes(w))) return s.v;
  }
  // default
  return '“Love is patient and kind; love does not envy or boast; it is not arrogant or rude.” — 1 Corinthians 13:4–5';
}

function coachMessage(mood, action) {
  const m = (mood || 'your current mood').toLowerCase();
  const step = action?.trim() ? `Tomorrow, protect **one tiny step**: “${action.trim()}”.` : 'Choose one tiny, doable step for tomorrow.';
  return `I hear ${m}. Breathe, pray together, and invite the Spirit to soften hearts. ${step} Small faithfulness opens big doors.`;
}

// ---- Render list ----
function renderEntries() {
  const all = loadEntries();
  els.entriesList.innerHTML = '';

  if (!all.length) {
    const li = document.createElement('li');
    li.className = 'entry';
    li.textContent = 'No entries yet.';
    els.entriesList.appendChild(li);
    return;
  }

  all.slice(0, 20).forEach(e => {
    const li = document.createElement('li');
    li.className = 'entry';

    const head = document.createElement('div');
    head.className = 'entry-head';

    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.innerHTML = `<span class="dot"></span>${e.mood || 'not set'}`;

    const date = document.createElement('span');
    date.className = 'entry-date';
    date.textContent = new Date(e.ts).toLocaleString();

    head.append(tag, date);

    const body = document.createElement('div');
    body.innerHTML = `
      <p><strong>Note:</strong> ${e.text || '—'}</p>
      <p><strong>Grateful:</strong> ${e.gratitude || '—'}</p>
      <p><strong>Step:</strong> ${e.action || '—'}</p>
    `;

    li.append(head, body);
    els.entriesList.appendChild(li);
  });
}

// ---- Save handler ----
els.submitBtn?.addEventListener('click', () => {
  const text = els.entryText.value.trim();
  const gratitude = els.gratitude.value.trim();
  const action = els.action.value.trim();
  const mood = selectedMood;

  // store as separate, timestamped entries (multiple per day supported)
  const entry = { ts: Date.now(), text, gratitude, action, mood };
  saveEntry(entry);
  renderEntries();

  // guidance
  els.verseText.textContent = pickScripture(text, mood, gratitude, action);
  els.coachText.textContent = coachMessage(mood, action).replace(/\*\*/g, '');

  // UX feedback
  els.saveNote.textContent = 'Saved locally on this device.';
  setTimeout(() => (els.saveNote.textContent = ''), 2000);

  // keep inputs but clear chip highlight (optional)
  els.chipsWrap.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  selectedMood = null;
});

// First paint
renderEntries();
