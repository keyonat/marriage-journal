// Marriage Journal with localStorage + on-device "AI" reflection (lexicon sentiment)
(function () {
  const $ = (id) => document.getElementById(id);

  const form = $('entryForm');
  const date = $('date');
  const gratitude = $('gratitude');
  const win = $('win');
  const act = $('act');
  const entriesList = $('entriesList');
  const emptyState = $('emptyState');

  // Default date = today
  date.value = new Date().toISOString().slice(0, 10);

  // Storage helpers
  function load() {
    const raw = localStorage.getItem('marriageJournalEntries');
    return raw ? JSON.parse(raw) : [];
  }
  function save(entries) {
    localStorage.setItem('marriageJournalEntries', JSON.stringify(entries));
  }

  // Render entries
  function render() {
    const entries = load().sort((a, b) => b.date.localeCompare(a.date));
    entriesList.innerHTML = '';
    emptyState.style.display = entries.length ? 'none' : 'block';

    entries.forEach((e, idx) => {
      const li = document.createElement('li');
      li.className = 'entry';

      // Header
      const header = document.createElement('header');
      const title = document.createElement('h3');
      title.textContent = `${e.date} ${e.mood || ''}`;
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = [e.gratitude && 'Gratitude', e.win && 'Win', e.act && 'Act']
        .filter(Boolean).join(' · ');
      header.append(title, meta);

      // Body
      const body = document.createElement('div');
      body.className = 'text';
      body.innerHTML =
        (e.gratitude ? `🙏 <strong>Gratitude:</strong> ${escapeHTML(e.gratitude)}\n` : '') +
        (e.win ? `🏆 <strong>Win:</strong> ${escapeHTML(e.win)}\n` : '') +
        (e.act ? `💡 <strong>Act:</strong> ${escapeHTML(e.act)}` : '');

      // Reflection box (AI result appears here)
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
      const editBtn = button('Edit', () => editEntry(idx));
      const delBtn = button('Delete', () => deleteEntry(idx));
      actions.append(reflectBtn, editBtn, delBtn);

      li.append(header, body, actions, reflectionBox);
      entriesList.appendChild(li);
    });
  }

  // Utilities
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

  // Form submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const entry = {
      date: date.value,
      mood: currentMood(),
      gratitude: gratitude.value.trim(),
      win: win.value.trim(),
      act: act.value.trim(),
      id: cryptoRandom(),
    };
    const entries = load();
    const existingIdx = entries.findIndex((x) => x.date === entry.date);
    if (existingIdx >= 0) entries[existingIdx] = entry; else entries.push(entry);
    save(entries);
    form.reset();
    date.value = new Date().toISOString().slice(0, 10);
    render();
  });

  // Edit / Delete
  function editEntry(idx) {
    const e = load()[idx];
    if (!e) return;
    date.value = e.date;
    gratitude.value = e.gratitude || '';
    win.value = e.win || '';
    act.value = e.act || '';
    document.querySelectorAll('input[name="mood"]').forEach((i) => (i.checked = i.value === e.mood));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function deleteEntry(idx) {
    const entries = load();
    entries.splice(idx, 1);
    save(entries);
    render();
  }

  function cryptoRandom() {
    try {
      return [...crypto.getRandomValues(new Uint8Array(8))]
        .map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch { return String(Math.random()).slice(2); }
  }

  // --- On-device “AI” (lexicon sentiment) ---
  function generateReflection(text, mood) {
    const score = sentimentScore(text);
    const tone = score > 2 ? 'positive' : score < -2 ? 'challenging' : 'balanced';
    const moodNote = mood ? ` Your recorded mood was ${mood}.` : '';

    if (tone === 'positive') {
      return `It sounds like a good day together.${moodNote} Keep reinforcing the habits you appreciated—consider repeating one small win tomorrow.`;
    }
    if (tone === 'challenging') {
      return `There were some tough moments.${moodNote} Try a tiny repair gesture: a kind check-in, a specific “thank you,” or planning a short shared moment tomorrow.`;
    }
    return `Overall, it feels balanced.${moodNote} Celebrate one small win and choose one tiny action for tomorrow to nudge things a bit brighter.`;
  }

  function sentimentScore(text) {
    const words = (text || '').toLowerCase().match(/[a-z]+/g) || [];
    let score = 0;
    for (const w of words) if (AFINN[w]) score += AFINN[w];
    return score;
  }

  // Tiny AFINN-like lexicon
  const AFINN = {
    love: 3, loving: 3, happy: 3, joyful: 3, grateful: 3, appreciate: 2, appreciated: 2, teamwork: 2, kind: 2, patience: 2, calm: 2, proud: 2, win: 2, good: 2, support: 2, helped: 2, listened: 2, forgive: 2, progress: 2, improved: 2, celebrate: 2, gentle: 2,
    argue: -2, argument: -2, fight: -3, fighting: -3, angry: -3, mad: -2, sad: -2, hurt: -2, tired: -1, stressed: -2, ignore: -2, ignored: -2, upset: -2, disappointed: -2, bad: -2
  };

  // Initial render
  render();
})();

