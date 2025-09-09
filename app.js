/* Marriage Journal · Bible-Anchored Coaching (client-only MVP)
   - Multiple entries per day (localStorage)
   - Scripture/Coaching/Action generated from local keyword map
*/

const STORAGE_KEY = 'mj_entries_v1';

const MOODS = [
  'joy','grateful','hopeful','sad','angry','anxious','tired','hurt','confused'
];

function $(sel){ return document.querySelector(sel); }
function formatDateTime(iso){
  const d = new Date(iso);
  return d.toLocaleString();
}

// ----- Mood chips -----
function renderMoodChips(){
  const box = $('#moodChips');
  box.innerHTML = '';
  MOODS.forEach(m => {
    const span = document.createElement('span');
    span.className = 'chip';
    span.textContent = m;
    span.dataset.value = m;
    span.addEventListener('click', ()=> {
      box.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      span.classList.add('active');
    });
    box.appendChild(span);
  });
}
function getSelectedMood(){
  const active = $('#moodChips .chip.active');
  return active ? active.dataset.value : undefined;
}

// ----- Storage -----
function loadEntries(){
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}
function saveEntries(arr){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}
function addEntry(entry){
  const all = loadEntries();
  all.unshift(entry); // newest on top
  saveEntries(all);
}

// ----- Scripture guidance (local heuristic) -----
async function loadScriptureMap(){
  const res = await fetch('data/scripture_map.json');
  if (!res.ok) throw new Error('Could not load scripture_map.json');
  return res.json();
}
function pickOne(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function extractKeywords(text){
  const t = (text || '').toLowerCase();
  const signals = [
    'anger','unforgiveness','distance','disconnected','drift',
    'fear','anxious','worry','hopeless','giving up','divorce',
    'communication','listen','listening','love','kindness','compassion',
    'trust','betrayal','hurt','gratitude','thankful'
  ];
  return signals.filter(s => t.includes(s));
}

function tinyActionFor(theme){
  const actions = {
    anger: "Pause 90 seconds before responding. Reflect, then mirror what you heard.",
    unforgiveness: "Pray together; offer one specific apology or request forgiveness.",
    communication: "Schedule a 10-minute listening block tonight (one speaks, one reflects).",
    fear: "Pray Philippians 4:6-7 aloud together this evening.",
    love: "Do one unexpected kindness for your spouse today.",
    trust: "Share one need and one appreciation tonight.",
    gratitude: "Each share 3 things you’re thankful for about each other."
  };
  return actions[theme] || "Pray together and choose one kind action you can do today.";
}

async function getBiblicalCounsel(text){
  const map = await loadScriptureMap();
  const found = extractKeywords(text);
  let verses = [];

  // try exact keys first, then regex bundle keys (those containing |)
  for (const key of Object.keys(map)) {
    const isBundle = key.includes('|');
    if (!isBundle && found.includes(key)) { verses = map[key]; break; }
    if (isBundle) {
      const re = new RegExp(key);
      if (re.test(text.toLowerCase())) { verses = map[key]; break; }
    }
  }
  if (verses.length === 0) { verses = map['love|kindness|compassion']; }

  const verse = pickOne(verses);
  const theme = found[0] || 'love';
  const coaching = `Consider this through Scripture. Reflect on ${verse.book} ${verse.chapter}:${verse.verses}: “${verse.text}”. Ask: “What would love require here?”`;
  const action = tinyActionFor(theme);
  return { verse, coaching, action };
}

// ----- UI render -----
function renderEntries(){
  const list = $('#entriesList');
  const entries = loadEntries();
  list.innerHTML = '';
  if (entries.length === 0){
    list.innerHTML = `<li class="muted tiny">No entries yet.</li>`;
    return;
  }
  entries.forEach(e => {
    const li = document.createElement('li');
    li.className = 'entry';
    li.innerHTML = `
      <div class="tiny muted">${formatDateTime(e.id)}${e.mood ? ' · '+e.mood : ''}</div>
      <div>${escapeHtml(e.text)}</div>
      ${e.verse ? `<div class="tiny verse">${e.verse.book} ${e.verse.chapter}:${e.verse.verses} — ${e.verse.text}</div>` : ''}
    `;
    list.appendChild(li);
  });
}

function showGuidance(g){
  $('#guidance').style.display = 'block';
  $('#scriptureBox').textContent =
    `${g.verse.book} ${g.verse.chapter}:${g.verse.verses} — ${g.verse.text}`;
  $('#coachingBox').textContent = g.coaching;
  $('#actionBox').textContent = g.action;
}

function escapeHtml(s=''){
  return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// ----- Events -----
async function onSave(){
  const text = $('#entryText').value.trim();
  if (!text){ alert('Please write something first.'); return; }
  const mood = getSelectedMood();
  const id = new Date().toISOString();

  // get guidance
  const guidance = await getBiblicalCounsel(text);

  // save entry
  addEntry({
    id, text, mood,
    verse: guidance.verse,
    note: guidance.coaching
  });

  // update UI
  showGuidance(guidance);
  renderEntries();
  $('#entryText').value = '';
  $('#moodChips .chip.active')?.classList.remove('active');
}

function onClear(){ $('#entryText').value = ''; }

// ----- Init -----
document.addEventListener('DOMContentLoaded', () => {
  renderMoodChips();
  renderEntries();
  $('#saveBtn').addEventListener('click', onSave);
  $('#clearBtn').addEventListener('click', onClear);
});
