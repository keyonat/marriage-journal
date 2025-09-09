/* Marriage Journal — smarter guidance + multi-entry storage
   If your HTML uses different IDs/classes, update the selectors in SELECTORS.
*/
const SELECTORS = {
  chips: '.chip',                 // mood chips with aria-pressed="true"
  gratitude: '#gratitudeInput',   // "one thing I'm grateful for"
  smallStep: '#smallStepInput',   // "one small step for tomorrow"
  journal:   '#journalInput',     // "today's entry / what's on your heart"
  saveBtn:   '#saveBtn',          // "Save entry & get guidance"
  history:   '#historyList',      // container for recent entries
  guidance:  '#guidanceBox',      // container for generated guidance
  toast:     '#toast'             // optional little status alert
};

// -------------- Utilities --------------
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

function nowIso() { return new Date().toISOString(); }
function formatDate(dt) {
  const d = new Date(dt);
  return d.toLocaleString(undefined, { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
}
function saveLocal(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function loadLocal(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

// -------------- Theme detection --------------
// Lightweight checks (transparent & adjustable)
const lexicons = {
  avoidance: [/stay apart/i, /separate/i, /no\s*contact/i, /ignore/i, /avoid/i, /sleep (?:separately|apart)/i],
  anger: [/angry/i, /yell/i, /shout/i, /fight/i, /argu(?:e|ing)/i, /resent/i],
  hopeless: [/hopeless/i, /give up/i, /done/i, /never change/i, /hate/i, /no point/i],
  trust: [/don'?t trust/i, /can'?t trust/i, /betray/i, /lie/i, /dishonest/i, /hide money/i, /secret/i],
  infidelity: [/cheat(?:ed|ing)?/i, /affair/i, /unfaithful/i, /porn/i],
  money: [/money/i, /bills/i, /debt/i, /broke/i, /barely making ends/i, /budget/i, /finance/i],
  safety: [/unsafe/i, /abuse/i, /violence/i, /hurt (?:me|them)/i, /threat/i],
};

function detectThemes(entry) {
  const text = [entry.journal, entry.smallStep, entry.gratitude].join(' ').toLowerCase();
  const flags = {};
  for (const [k, patterns] of Object.entries(lexicons)) {
    flags[k] = patterns.some(rx => rx.test(text));
  }
  // extra: explicit “time apart” gratitude
  flags.apartGratitude = /time apart/i.test(entry.gratitude || '');
  return flags;
}

// -------------- Scripture library --------------
const scriptures = {
  deescalate: {
    ref: 'Proverbs 15:1',
    text: '“A gentle answer turns away wrath, but a harsh word stirs up anger.”'
  },
  kindness: {
    ref: 'Ephesians 4:32',
    text: '“Be kind to one another, tenderhearted, forgiving one another, as God in Christ forgave you.”'
  },
  trust: {
    ref: 'Proverbs 3:3–4',
    text: '“Let love and faithfulness never leave you… then you will win favor and a good name.”'
  },
  hope: {
    ref: 'Romans 12:12',
    text: '“Be joyful in hope, patient in affliction, faithful in prayer.”'
  },
  healing: {
    ref: 'Psalm 34:18',
    text: '“The LORD is close to the brokenhearted and saves those who are crushed in spirit.”'
  },
  finances: {
    ref: 'Philippians 4:19',
    text: '“My God will supply every need of yours according to his riches in glory in Christ Jesus.”'
  },
  faithfulness: {
    ref: 'Hebrews 13:4',
    text: '“Let marriage be held in honor among all…”'
  },
  unity: {
    ref: 'Ecclesiastes 4:12',
    text: '“A cord of three strands is not quickly broken.”'
  }
};

// -------------- Guidance composer --------------
function buildGuidance(entry) {
  const flags = detectThemes(entry);
  const blocks = [];

  // Safety first
  if (flags.safety) {
    blocks.push(
      emph('If you feel unsafe, your safety comes first.'),
      bullet([
        'Move to a safe place and seek help from a trusted person or pastor.',
        'Consider speaking to a licensed counselor or local support line.',
        'Pray and ask God for protection and wisdom right now.'
      ]),
      verse(scriptures.healing)
    );
    return blocks.join('\n');
  }

  // If tomorrow’s “small step” is avoidance/separation
  if (flags.avoidance || flags.apartGratitude) {
    blocks.push(
      para('I hear a desire to reduce harm by creating space. When distance is your best available step, let’s make it **purposeful** and **time-boxed**, not a pattern of disconnection.'),
      sub('Try this instead (choose one tiny action):'),
      bullet([
        'Agree on a **30–60 minute cooling-off window** and schedule a **10-minute gentle check-in** after.',
        'Write one sentence beginning with “I appreciate…” and share it when you reconvene.',
        'Pray separately, then together, asking God for soft hearts (Proverbs 15:1).'
      ]),
      verse(scriptures.deescalate)
    );
  }

  // Thematic support
  if (flags.anger) {
    blocks.push(
      sub('When anger rises:'),
      bullet([
        'Use a calm signal (e.g., “pause”) and take 5 slow breaths each.',
        'Reflect back what you heard before responding (“What I hear you saying is…”).'
      ]),
      verse(scriptures.kindness)
    );
  }
  if (flags.trust || flags.infidelity) {
    blocks.push(
      sub('Rebuilding trust (micro-steps):'),
      bullet([
        'Share one concrete truth daily (finances, location, feelings) with no defensiveness.',
        'Create a simple transparency habit: shared calendar or shared expense note.'
      ]),
      verse(flags.infidelity ? scriptures.faithfulness : scriptures.trust)
    );
  }
  if (flags.money) {
    blocks.push(
      sub('Facing finances together:'),
      bullet([
        'Do a **15-minute budget huddle**: list fixed bills, variable spend, next paycheck.',
        'Pray over needs; pick one expense to reduce together this week.'
      ]),
      verse(scriptures.finances)
    );
  }
  if (flags.hopeless) {
    blocks.push(
      para('Hopelessness is heavy. You are not alone, and this moment is not the whole story.'),
      bullet([
        'Name one grace from today (even tiny).',
        'Ask one trusted couple or mentor to pray for you both this week.'
      ]),
      verse(scriptures.hope)
    );
  }

  // Default encouragement if nothing else triggered
  if (blocks.length === 0) {
    blocks.push(
      para('Thank you for sharing honestly. Choose **one** tiny step you can take in love today.'),
      verse(scriptures.unity)
    );
  }

  // Mirror their inputs with care (non-affirming if negative)
  blocks.push(sub('What you wrote today (mirrored):'));
  blocks.push(mirror(entry));

  return blocks.join('\n');
}

// -------------- Small render helpers --------------
function para(t){ return `<p>${t}</p>`; }
function sub(t){ return `<h3>${t}</h3>`; }
function emph(t){ return `<div class="alert"><strong>${t}</strong></div>`; }
function bullet(items){ return `<ul>${items.map(i=>`<li>${i}</li>`).join('')}</ul>`; }
function verse(v){ return `<div class="scripture"><em>${v.text}</em><small>— ${v.ref}</small></div>`; }
function mirror(entry){
  const tone = (entry.tones && entry.tones.length) ? entry.tones.join(', ') : '—';
  const g = entry.gratitude?.trim() ? entry.gratitude.trim() : '—';
  const s = entry.smallStep?.trim() ? entry.smallStep.trim() : '—';
  return `
    <div class="item">
      <div class="meta">Saved ${formatDate(entry.createdAt)}</div>
      <div><strong>Mood:</strong> ${tone}</div>
      <div><strong>Gratitude:</strong> ${escapeHtml(g)}</div>
      <div><strong>Small step:</strong> ${escapeHtml(s)}</div>
      <div class="excerpt"><strong>Entry:</strong> ${escapeHtml(entry.journal || '')}</div>
    </div>`;
}
function escapeHtml(s){ return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// -------------- Storage & UI --------------
function selectedTones(){
  return $$(SELECTORS.chips)
    .filter(el => el.getAttribute('aria-pressed') === 'true')
    .map(el => el.textContent.trim());
}

function readEntryFromForm(){
  return {
    createdAt: nowIso(),
    tones: selectedTones(),
    gratitude: $(SELECTORS.gratitude)?.value || '',
    smallStep: $(SELECTORS.smallStep)?.value || '',
    journal:   $(SELECTORS.journal)?.value || ''
  };
}

function clearForm(){
  if ($(SELECTORS.gratitude)) $(SELECTORS.gratitude).value = '';
  if ($(SELECTORS.smallStep)) $(SELECTORS.smallStep).value = '';
  if ($(SELECTORS.journal)) $(SELECTORS.journal).value = '';
  $$(SELECTORS.chips).forEach(ch => ch.setAttribute('aria-pressed','false'));
}

function renderHistory(){
  const list = $(SELECTORS.history);
  if (!list) return;
  const entries = loadLocal('entries', []).slice().reverse().slice(0, 20);
  if (entries.length === 0){
    list.innerHTML = `<div class="muted">No entries yet.</div>`;
    return;
  }
  list.innerHTML = entries.map(e => `
    <div class="item">
      <div class="meta">${formatDate(e.createdAt)}</div>
      <div class="tone">${(e.tones||[]).join(', ') || '—'}</div>
      <div class="excerpt">${escapeHtml((e.journal||'').slice(0,160))}${(e.journal||'').length>160?'…':''}</div>
    </div>
  `).join('');
}

function renderGuidance(entry){
  const box = $(SELECTORS.guidance);
  if (!box) return;
  box.innerHTML = buildGuidance(entry);
}

function toast(msg){
  const el = $(SELECTORS.toast);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(()=> el.style.display='none', 1800);
}

// -------------- Event wiring --------------
function onSave(){
  const entry = readEntryFromForm();

  // Save (append, not overwrite)
  const entries = loadLocal('entries', []);
  entries.push(entry);
  saveLocal('entries', entries);

  renderHistory();
  renderGuidance(entry);
  clearForm();
  toast('Saved ✓');
}

// Toggle chips
function wireChips(){
  $$(SELECTORS.chips).forEach(ch => {
    ch.addEventListener('click', () => {
      const pressed = ch.getAttribute('aria-pressed') === 'true';
      ch.setAttribute('aria-pressed', String(!pressed));
    });
  });
}

// Init
function init(){
  wireChips();
  renderHistory();
  const btn = $(SELECTORS.saveBtn);
  if (btn) btn.addEventListener('click', onSave);
}

document.addEventListener('DOMContentLoaded', init);
