// Marriage Journal: multiple entries per day + improved on-device "AI" reflection
(function () {
  const $ = (id) => document.getElementById(id);

  const form = $('entryForm');
  const date = $('date');
  const gratitude = $('gratitude');
  const win = $('win');
  const act = $('act');
  const entriesList = $('entriesList');
  const emptyState = $('emptyState');

  // Track which entry is being edited (by ID); null = creating new
  let editingId = null;

  // Default date = today
  date.value = new Date().toISOString().slice(0, 10);

  // ---------- Storage ----------
  function load() {
    const raw = localStorage.getItem('marriageJournalEntries');
    return raw ? JSON.parse(raw) : [];
  }
  function save(entries) {
    localStorage.setItem('marriageJournalEntries', JSON.stringify(entries));
  }

  // ---------- Render ----------
  function render() {
    const entries = load().slice().sort((a, b) => {
      const aKey = a.createdAt || `${a.date}T00:00:00.000Z`;
      const bKey = b.createdAt || `${b.date}T00:00:00.000Z`;
      return bKey.localeCompare(aKey);
    });

    entriesList.innerHTML = '';
    emptyState.style.display = entries.length ? 'none' : 'block';

    entries.forEach((e) => {
      const li = document.createElement('li');
      li.className = 'entry';

      // Header
      const header = document.createElement('header');
      const title = document.createElement('h3');
      const when = formatDateTime(e.date, e.createdAt);
      title.textContent = `${when} ${e.mood || ''}`.trim();

      // Tone chip
      const tone = analyzeTone([e.gratitude, e.win, e.act].filter(Boolean).join(' '), e.mood);
      const chip = document.createElement('span');
      chip.className = `chip ${tone}`;
      chip.textContent = tone.charAt(0).toUpperCase() + tone.slice(1);

      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = [e.gratitude && 'Gratitude', e.win && 'Win', e.act && 'Act']
        .filter(Boolean).join(' · ');

      // attach header parts
      header.append(title, chip, meta);

      // Body
      const body = document.createElement('div');
      body.className = 'text';
      body.innerHTML =
        (e.gratitude ? `🙏 <strong>Gratitude:</strong> ${escapeHTML(e.gratitude)}\n` : '') +
        (e.win ? `🏆 <strong>Win:</strong> ${escapeHTML(e.win)}\n` : '') +
        (e.act ? `💡 <strong>Act:</strong> ${escapeHTML(e.act)}` : '');

      // Reflection box
      const reflectionBox = document.createElement('div');
      reflectionBox.className = 'text muted';
      reflectionBox.style.marginTop = '6px';

      // Actions
      const actions = document.createElement('div');
      actions.className = 'actions';
      const reflectBtn = button('Reflect with AI (local)', () => {
        const textBlob = [e.gratitude, e.win, e.act].filter(Boolean).join(' ');
        const reflection = generateReflection(textBlob, e.mood);
        reflectionBox.textContent = reflection;
      });
      const editBtn = button('Edit', () => editEntry(e.id));
      const delBtn = button('Delete', () => deleteEntry(e.id));
      actions.append(reflectBtn, editBtn, delBtn);

      li.append(header, body, actions, reflectionBox);
      entriesList.appendChild(li);
    });
  }

  // ---------- Utilities ----------
  function button(label, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'secondary';
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  }

  function escapeHTML(str) {
    return (str || '').replace(/[&<>"']/g, (ch) =>
      ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[ch]));
  }

  function currentMood() {
    const selected = document.querySelector('input[name="mood"]:checked');
    return selected ? selected.value : '';
  }

  function formatDateTime(dateStr, createdAt) {
    const d = dateStr || new Date().toISOString().slice(0, 10);
    if (!createdAt) return d;
    try {
      const t = new Date(createdAt);
      const hh = String(t.getHours()).padStart(2, '0');
      const mm = String(t.getMinutes()).padStart(2, '0');
      return `${d} • ${hh}:${mm}`;
    } catch {
      return d;
    }
  }

  function cryptoRandom() {
    try {
      return [...crypto.getRandomValues(new Uint8Array(8))]
        .map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch { return String(Math.random()).slice(2); }
  }

  // ---------- Form submit (create OR update) ----------
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const entryBase = {
      date: date.value,
      mood: currentMood(),
      gratitude: gratitude.value.trim(),
      win: win.value.trim(),
      act: act.value.trim(),
    };

    const entries = load();

    if (editingId) {
      const i = entries.findIndex((x) => x.id === editingId);
      if (i >= 0) {
        entries[i] = {
          ...entries[i],
          ...entryBase,
          id: editingId,
          createdAt: entries[i].createdAt || new Date().toISOString(),
        };
      }
      editingId = null;
    } else {
      entries.push({
        ...entryBase,
        id: cryptoRandom(),
        createdAt: new Date().toISOString(),
      });
    }

    save(entries);
    form.reset();
    date.value = new Date().toISOString().slice(0, 10);
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ---------- Edit / Delete by ID ----------
  function editEntry(id) {
    const e = load().find((x) => x.id === id);
    if (!e) return;
    editingId = id;
    date.value = e.date;
    gratitude.value = e.gratitude || '';
    win.value = e.win || '';
    act.value = e.act || '';
    document.querySelectorAll('input[name="mood"]').forEach((i) => (i.checked = i.value === e.mood));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function deleteEntry(id) {
    const entries = load().filter((x) => x.id !== id);
    save(entries);
    render();
  }

  // ---------- On-device “AI” (improved sentiment + reflection) ----------
  const STRONG_NEGATIVE = [
    'divorce','separate','break up','break-up','breakup','hate you',"can't stand",
    'cheated','infidelity','affair','abuse','toxic','done with this','leave you','leaving'
  ];

  function generateReflection(text, mood) {
    const tone = analyzeTone(text, mood);
    const moodNote = mood ? ` Your recorded mood was ${mood}.` : '';

    if (tone === 'positive') {
      return `It sounds like there were some bright spots today.${moodNote} Keep reinforcing what went well—repeat one small win tomorrow.`;
    }
    if (tone === 'challenging') {
      return `This sounds like a hard moment.${moodNote} Consider a tiny repair: pause and breathe, share one specific appreciation, or plan a short check-in. If big topics are on the table, schedule a calmer time to discuss with ground rules (one person speaks at a time, reflect back what you heard).`;
    }
    return `Overall, this reads as mixed.${moodNote} Name one thing that went okay today, and choose one tiny action for tomorrow to nudge things a bit better.`;
  }

  function analyzeTone(rawText, mood) {
    const text = (rawText || '').toLowerCase();

    // 1) Strong phrase override
    for (const p of STRONG_NEGATIVE) {
      if (text.includes(p)) return 'challenging';
    }
    if (text.includes('no win') || text.includes('nothing good') || text.includes('not grateful')) {
      return 'challenging';
    }

    // 2) Lexicon score
    const score = sentimentScore(text);

    // 3) Mood weight
    let moodAdj = 0;
    if (mood && (mood.includes('😞') || /sad|upset|angry|bad/i.test(mood))) moodAdj -= 3;
    if (mood && (mood.includes('😊') || /happy|good|calm|proud/i.test(mood))) moodAdj += 2;

    const total = score + moodAdj;

    // 4) Thresholds
    if (total <= -2) return 'challenging';
    if (total >= 3)  return 'positive';
    return 'balanced';
  }

  function sentimentScore(text) {
    const words = text.match(/[a-z']+/g) || [];
    let score = 0;
    for (const w of words) {
      if (AFINN[w] !== undefined) score += AFINN[w];
    }
    return score;
  }

  // Expanded, lightweight lexicon
  const AFINN = {
    // positive
    love:3, loving:3, happy:3, joyful:3, grateful:3, appreciate:2, appreciated:2, teamwork:2,
    kind:2, patience:2, calm:2, proud:2, win:2, good:2, support:2, helped:2, listened:2,
    forgive:2, progress:2, improved:2, celebrate:2, gentle:2, respect:2, peace:2, connect:2,
    // negative (slightly stronger)
    argue:-3, argument:-3, fight:-3, fighting:-3, angry:-3, mad:-2, sad:-3, hurt:-3, tired:-2,
    stressed:-3, stress:-3, ignore:-3, ignored:-3, upset:-3, disappointed:-3, bad:-3,
    annoyed:-2, distant:-2, cold:-2, frustrated:-3, resentment:-3, resent:-3, blame:-2,
    jealous:-2, insecure:-2, lonely:-2
  };

  // Initial render
  render();
})();
