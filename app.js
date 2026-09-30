// ===== GYM TRACKER - APP.JS (Firebase Firestore sync) =====

// ===== ESTADO GLOBAL =====
let state = {
  profiles: [],        // carregado do Firestore
  exercises: [],       // carregado do Firestore
  currentProfile: null,
  editingWorkoutId: null,
  editingExerciseId: null,
  viewingSessionId: null,
  tempWorkoutExercises: [],
  unsubProfiles: null, // listener em tempo real
  unsubExercises: null
};

// ===== FIRESTORE HELPERS =====
// As funções do Firebase são expostas pelo index.html via window._*
// Usamos wrappers para deixar o código mais limpo.

function db()       { return window._db; }
function fsDoc(...args)    { return window._fsDoc(db(), ...args); }
function fsGetDoc(ref)     { return window._fsGetDoc(ref); }
function fsSetDoc(ref, data, opts) { return window._fsSetDoc(ref, data, opts || {}); }
function fsOnSnap(ref, cb) { return window._fsOnSnap(ref, cb); }

// ===== PATHS NO FIRESTORE =====
// Estrutura:  gymtracker/profiles  -> documento com array de perfis
//             gymtracker/exercises -> documento com array de exercícios

const PROFILES_REF  = () => fsDoc('gymtracker', 'profiles');
const EXERCISES_REF = () => fsDoc('gymtracker', 'exercises');

// ===== LOADING INDICATOR =====
function setLoading(on) {
  let el = document.getElementById('loading-overlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'loading-overlay';
    el.style.cssText = `
      position:fixed;inset:0;background:rgba(15,15,19,0.85);
      display:flex;align-items:center;justify-content:center;
      z-index:9999;font-size:1.1rem;color:#a5b4fc;gap:12px;
      backdrop-filter:blur(4px);
    `;
    el.innerHTML = '<span style="font-size:2rem;animation:spin 1s linear infinite">⚙️</span> Sincronizando...';
    const style = document.createElement('style');
    style.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(style);
    document.body.appendChild(el);
  }
  el.style.display = on ? 'flex' : 'none';
}

// ===== SAVE TO FIRESTORE =====
async function saveProfiles() {
  try {
    await fsSetDoc(PROFILES_REF(), { data: JSON.stringify(state.profiles) });
  } catch (e) {
    showToast('Erro ao salvar no servidor', 'error');
    console.error(e);
  }
}

async function saveExercises() {
  try {
    await fsSetDoc(EXERCISES_REF(), { data: JSON.stringify(state.exercises) });
  } catch (e) {
    showToast('Erro ao salvar exercícios', 'error');
    console.error(e);
  }
}

// Salva tudo (perfis + exercícios)
async function save() {
  await Promise.all([saveProfiles(), saveExercises()]);
}

// ===== LOAD & REALTIME LISTENERS =====
async function load() {
  setLoading(true);
  try {
    // Carrega exercícios
    const exSnap = await fsGetDoc(EXERCISES_REF());
    if (exSnap.exists() && exSnap.data().data) {
      state.exercises = JSON.parse(exSnap.data().data);
    } else {
      state.exercises = [...DEFAULT_EXERCISES];
      await saveExercises();
    }

    // Carrega perfis
    const prSnap = await fsGetDoc(PROFILES_REF());
    if (prSnap.exists() && prSnap.data().data) {
      state.profiles = JSON.parse(prSnap.data().data);
    } else {
      state.profiles = [];
    }

    // Ativa listeners em tempo real
    startRealtimeListeners();

  } catch (e) {
    showToast('Erro ao conectar com o servidor', 'error');
    console.error(e);
  } finally {
    setLoading(false);
  }
}

function startRealtimeListeners() {
  // Cancela listeners anteriores se existirem
  if (state.unsubProfiles)  state.unsubProfiles();
  if (state.unsubExercises) state.unsubExercises();

  state.unsubProfiles = fsOnSnap(PROFILES_REF(), (snap) => {
    if (!snap.exists() || !snap.data().data) return;
    const newProfiles = JSON.parse(snap.data().data);
    // Só atualiza se mudou algo externo (evita loop)
    if (JSON.stringify(newProfiles) === JSON.stringify(state.profiles)) return;
    state.profiles = newProfiles;
    // Atualiza UI se estiver na tela de login ou histórico
    if (document.getElementById('screen-login').classList.contains('active')) {
      renderLoginProfiles();
    }
    if (state.currentProfile) {
      // Atualiza o perfil atual se estiver logado
      const activeTab = document.querySelector('.nav-btn.active');
      if (activeTab) {
        const tab = activeTab.dataset.tab;
        if (tab === 'treinos')   renderWorkouts();
        if (tab === 'historico') renderHistory();
      }
    }
  });

  state.unsubExercises = fsOnSnap(EXERCISES_REF(), (snap) => {
    if (!snap.exists() || !snap.data().data) return;
    const newExercises = JSON.parse(snap.data().data);
    if (JSON.stringify(newExercises) === JSON.stringify(state.exercises)) return;
    state.exercises = newExercises;
    const activeTab = document.querySelector('.nav-btn.active');
    if (activeTab && activeTab.dataset.tab === 'exercicios') renderExerciseLibrary();
  });
}

// ===== UTILS =====
function uid() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

function formatDate(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit' });
}

function formatDateShort(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function getYoutubeEmbedUrl(url) {
  if (!url) return null;
  let id = null;
  const watchMatch = url.match(/[?&]v=([^&#]+)/);
  const shortMatch  = url.match(/youtu\.be\/([^?&#]+)/);
  const embedMatch  = url.match(/embed\/([^?&#]+)/);
  if (watchMatch)      id = watchMatch[1];
  else if (shortMatch) id = shortMatch[1];
  else if (embedMatch) id = embedMatch[1];
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (type ? ' toast-' + type : '');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ===== MODALS =====
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.getElementById('overlay').classList.add('open');
}

function stopModalVideos(modalEl) {
  modalEl.querySelectorAll('iframe').forEach(iframe => {
    iframe.src = iframe.src; // força reload/stop no YouTube
    iframe.src = '';
  });
}

function closeModal(id) {
  const modal = document.getElementById(id);
  stopModalVideos(modal);
  modal.classList.remove('open');
  if (!document.querySelector('.modal.open')) {
    document.getElementById('overlay').classList.remove('open');
  }
}

function closeAllModals() {
  document.querySelectorAll('.modal.open').forEach(m => {
    stopModalVideos(m);
    m.classList.remove('open');
  });
  document.getElementById('overlay').classList.remove('open');
}

// ===== SCREENS =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ===== TABS =====
function showTab(name) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  document.querySelector(`[data-tab="${name}"]`).classList.add('active');
  if (name === 'historico') renderHistory();
  if (name === 'exercicios') renderExerciseLibrary();
}

// ===== PROFILES =====
function getProfile(id) {
  return state.profiles.find(p => p.id === id);
}

function renderLoginProfiles() {
  const container = document.getElementById('profile-cards');
  if (state.profiles.length === 0) {
    container.innerHTML = `<div class="empty-state">
      <div class="empty-icon">👤</div>
      <h3>Nenhum perfil criado</h3>
      <p>Clique em "Gerenciar Perfis" para criar o seu</p>
    </div>`;
    return;
  }
  container.innerHTML = state.profiles.map(p => {
    const sessions = (p.sessions || []).length;
    const avatarHtml = isAvatarPhoto(p.avatar)
      ? `<img src="${p.avatar}" class="avatar-img" />`
      : `<span class="avatar">${p.avatar}</span>`;
    return `<div class="profile-card" data-id="${p.id}">
      ${avatarHtml}
      <div class="name">${p.name}</div>
      <div class="stats">${sessions} treino${sessions !== 1 ? 's' : ''} registrado${sessions !== 1 ? 's' : ''}</div>
    </div>`;
  }).join('');
  container.querySelectorAll('.profile-card').forEach(card => {
    card.addEventListener('click', () => selectProfile(card.dataset.id));
  });
}

function selectProfile(id) {
  state.currentProfile = id;
  const p = getProfile(id);
  if (isAvatarPhoto(p.avatar)) {
    document.getElementById('header-avatar').innerHTML = `<img src="${p.avatar}" class="header-avatar-img" />`;
  } else {
    document.getElementById('header-avatar').textContent = p.avatar;
  }
  document.getElementById('header-name').textContent = p.name;
  showScreen('screen-main');
  showTab('treinos');
  renderWorkouts();
}

function renderProfilesModal() {
  const list = document.getElementById('profiles-list');
  if (state.profiles.length === 0) {
    list.innerHTML = '<p style="color:var(--text3);font-size:0.88rem;margin-bottom:8px">Nenhum perfil ainda.</p>';
    return;
  }
  list.innerHTML = state.profiles.map(p => {
    const sessions = (p.sessions || []).length;
    const avatarHtml = isAvatarPhoto(p.avatar)
      ? `<img src="${p.avatar}" class="profile-list-avatar-img" />`
      : `<span class="profile-list-avatar">${p.avatar}</span>`;
    return `<div class="profile-list-item">
      ${avatarHtml}
      <div class="profile-list-info">
        <div class="profile-list-name">${p.name}</div>
        <div class="profile-list-stats">${sessions} sessão(ões) registrada(s)</div>
      </div>
      <button class="btn-icon-sm" onclick="openEditProfileModal('${p.id}')" title="Editar">✏️</button>
      <button class="btn-icon-sm" onclick="deleteProfile('${p.id}')" title="Remover">🗑️</button>
    </div>`;
  }).join('');
}

async function deleteProfile(id) {
  if (!confirm('Remover este perfil? Todos os dados serão perdidos.')) return;
  state.profiles = state.profiles.filter(p => p.id !== id);
  await saveProfiles();
  renderProfilesModal();
  renderLoginProfiles();
  showToast('Perfil removido');
}

async function addProfile() {
  const name = document.getElementById('new-profile-name').value.trim();
  const avatar = document.getElementById('new-profile-avatar').value;
  if (!name) { showToast('Digite um nome para o perfil', 'error'); return; }
  const profile = {
    id: uid(),
    name,
    avatar,
    workouts: DEFAULT_WORKOUT_TEMPLATES.map(t => ({
      id: uid(),
      name: t.name,
      description: t.description,
      color: t.color,
      exercises: t.exercises.map(e => ({ exerciseId: e.exerciseId, sets: e.sets }))
    })),
    sessions: [],
    createdAt: new Date().toISOString()
  };
  state.profiles.push(profile);
  setLoading(true);
  await saveProfiles();
  setLoading(false);
  document.getElementById('new-profile-name').value = '';
  renderProfilesModal();
  renderLoginProfiles();
  showToast('Perfil criado!', 'success');
}


// ===== EDIT PROFILE =====
let editingProfileId = null;

function openEditProfileModal(id) {
  const p = getProfile(id);
  if (!p) return;
  editingProfileId = id;
  document.getElementById('edit-profile-name').value = p.name;
  document.getElementById('edit-profile-avatar').value = p.avatar;
  // Atualiza preview
  const preview = document.getElementById('edit-avatar-preview');
  if (isAvatarPhoto(p.avatar)) {
    preview.innerHTML = `<img src="${p.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />`;
  } else {
    preview.innerHTML = p.avatar;
  }
  // Limpa input de arquivo
  document.getElementById('edit-avatar-file').value = '';
  renderEditAvatarPicker(isAvatarPhoto(p.avatar) ? '' : p.avatar);
  openModal('modal-edit-profile');
}

function renderEditAvatarPicker(selected) {
  const container = document.getElementById('edit-avatar-picker');
  container.innerHTML = AVATARS.map(a =>
    `<span class="emoji-opt ${a === selected ? 'selected' : ''}" data-avatar="${a}">${a}</span>`
  ).join('');
  container.querySelectorAll('.emoji-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      container.querySelectorAll('.emoji-opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      document.getElementById('edit-profile-avatar').value = opt.dataset.avatar;
      document.getElementById('edit-avatar-preview').innerHTML = opt.dataset.avatar;
    });
  });
}

async function saveEditProfile() {
  const name = document.getElementById('edit-profile-name').value.trim();
  if (!name) { showToast('Digite um nome para o perfil', 'error'); return; }
  const avatar = document.getElementById('edit-profile-avatar').value;
  const p = getProfile(editingProfileId);
  if (!p) return;
  p.name = name;
  p.avatar = avatar;
  // Atualiza header se o perfil editado estiver logado
  if (state.currentProfile === editingProfileId) {
    if (isAvatarPhoto(avatar)) {
      document.getElementById('header-avatar').innerHTML = `<img src="${avatar}" class="header-avatar-img" />`;
    } else {
      document.getElementById('header-avatar').textContent = avatar;
    }
    document.getElementById('header-name').textContent = name;
  }
  setLoading(true);
  await saveProfiles();
  setLoading(false);
  closeModal('modal-edit-profile');
  renderProfilesModal();
  renderLoginProfiles();
  showToast('Perfil atualizado!', 'success');
}

// ===== WORKOUTS =====
function getCurrentProfile() {
  return state.profiles.find(p => p.id === state.currentProfile);
}

function renderWorkouts() {
  const profile = getCurrentProfile();
  const container = document.getElementById('workout-plans');
  if (!profile || !profile.workouts || profile.workouts.length === 0) {
    container.innerHTML = `<div class="empty-state">
      <div class="empty-icon">🏋️</div>
      <h3>Nenhum treino criado</h3>
      <p>Clique em "+ Novo Treino" para começar</p>
    </div>`;
    return;
  }
  container.innerHTML = profile.workouts.map(w => {
    const exerciseNames = (w.exercises || []).map(e => {
      const ex = state.exercises.find(x => x.id === e.exerciseId);
      return ex ? ex.name : '?';
    }).slice(0, 4).join(', ') + (w.exercises.length > 4 ? '...' : '');
    const sessionCount = (profile.sessions || []).filter(s => s.workoutId === w.id).length;
    return `<div class="workout-card" style="--card-color:${w.color}">
      <div class="workout-card-header">
        <div class="workout-card-title">${w.name}</div>
        <div class="workout-card-menu">
          <button class="btn-icon-sm" onclick="editWorkout('${w.id}')" title="Editar">✏️</button>
          <button class="btn-icon-sm" onclick="deleteWorkout('${w.id}')" title="Excluir">🗑️</button>
        </div>
      </div>
      <div class="workout-card-desc">${w.description || ''}</div>
      <div class="workout-card-exercises">${w.exercises.length} exercício(s): ${exerciseNames || 'Nenhum'}</div>
      <div class="workout-card-exercises" style="color:var(--text2)">${sessionCount} sessão(ões) realizada(s)</div>
      <div class="workout-card-actions">
        <button class="btn btn-primary btn-sm" onclick="openSessionModal('${w.id}')">▶ Iniciar Treino</button>
      </div>
    </div>`;
  }).join('');
}

function openNewWorkoutModal() {
  state.editingWorkoutId = null;
  state.tempWorkoutExercises = [];
  document.getElementById('modal-workout-title').textContent = 'Novo Treino';
  document.getElementById('workout-name').value = '';
  document.getElementById('workout-description').value = '';
  document.getElementById('workout-color').value = '#6366f1';
  renderColorPicker('color-picker', 'workout-color', '#6366f1');
  renderWorkoutExerciseList();
  populateExerciseSelect();
  openModal('modal-workout');
}

function editWorkout(id) {
  const profile = getCurrentProfile();
  const w = profile.workouts.find(x => x.id === id);
  if (!w) return;
  state.editingWorkoutId = id;
  state.tempWorkoutExercises = w.exercises.map(e => ({ ...e }));
  document.getElementById('modal-workout-title').textContent = 'Editar Treino';
  document.getElementById('workout-name').value = w.name;
  document.getElementById('workout-description').value = w.description || '';
  document.getElementById('workout-color').value = w.color;
  renderColorPicker('color-picker', 'workout-color', w.color);
  renderWorkoutExerciseList();
  populateExerciseSelect();
  openModal('modal-workout');
}

async function saveWorkout() {
  const name = document.getElementById('workout-name').value.trim();
  if (!name) { showToast('Digite o nome do treino', 'error'); return; }
  const color = document.getElementById('workout-color').value;
  const description = document.getElementById('workout-description').value.trim();
  const profile = getCurrentProfile();
  if (state.editingWorkoutId) {
    const idx = profile.workouts.findIndex(w => w.id === state.editingWorkoutId);
    profile.workouts[idx] = { ...profile.workouts[idx], name, color, description, exercises: state.tempWorkoutExercises };
  } else {
    profile.workouts.push({ id: uid(), name, color, description, exercises: state.tempWorkoutExercises });
  }
  setLoading(true);
  await saveProfiles();
  setLoading(false);
  closeModal('modal-workout');
  renderWorkouts();
  showToast('Treino salvo!', 'success');
}

async function deleteWorkout(id) {
  if (!confirm('Excluir este treino? As sessões registradas serão mantidas no histórico.')) return;
  const profile = getCurrentProfile();
  profile.workouts = profile.workouts.filter(w => w.id !== id);
  setLoading(true);
  await saveProfiles();
  setLoading(false);
  renderWorkouts();
  showToast('Treino excluído');
}

function renderWorkoutExerciseList() {
  const container = document.getElementById('workout-exercise-list');
  if (state.tempWorkoutExercises.length === 0) {
    container.innerHTML = '<p style="color:var(--text3);font-size:0.88rem;margin-bottom:8px">Nenhum exercício adicionado ainda.</p>';
    return;
  }
  container.innerHTML = state.tempWorkoutExercises.map((e, i) => {
    const ex = state.exercises.find(x => x.id === e.exerciseId);
    return `<div class="workout-exercise-item">
      <div>
        <div class="workout-exercise-info">${ex ? ex.name : 'Exercício removido'}</div>
        <div class="workout-exercise-sets">
          <input type="number" value="${e.sets}" min="1" max="20"
            style="width:50px;padding:3px 6px;border-radius:6px;border:1px solid var(--border);background:var(--bg4);color:var(--text);font-size:0.85rem"
            onchange="updateTempSets(${i}, this.value)" /> série(s)
        </div>
      </div>
      <div class="set-actions">
        <button class="btn-icon-sm" onclick="moveTempExercise(${i}, -1)" ${i === 0 ? 'disabled' : ''}>↑</button>
        <button class="btn-icon-sm" onclick="moveTempExercise(${i}, 1)" ${i === state.tempWorkoutExercises.length - 1 ? 'disabled' : ''}>↓</button>
        <button class="btn-icon-sm" onclick="removeTempExercise(${i})">✕</button>
      </div>
    </div>`;
  }).join('');
}

function updateTempSets(i, val) {
  state.tempWorkoutExercises[i].sets = parseInt(val) || 1;
}

function moveTempExercise(i, dir) {
  const arr = state.tempWorkoutExercises;
  const j = i + dir;
  if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  renderWorkoutExerciseList();
}

function removeTempExercise(i) {
  state.tempWorkoutExercises.splice(i, 1);
  renderWorkoutExerciseList();
}

function populateExerciseSelect() {
  const sel = document.getElementById('select-exercise-to-add');
  sel.innerHTML = '<option value="">Selecionar exercício...</option>' +
    state.exercises.map(e => `<option value="${e.id}">${e.name} (${e.group})</option>`).join('');
}

function addExerciseToWorkout() {
  const sel = document.getElementById('select-exercise-to-add');
  const id = sel.value;
  if (!id) return;
  const ex = state.exercises.find(x => x.id === id);
  if (!ex) return;
  state.tempWorkoutExercises.push({ exerciseId: id, sets: ex.defaultSets || 3 });
  sel.value = '';
  renderWorkoutExerciseList();
}

// ===== SESSION =====
function openSessionModal(workoutId) {
  const profile = getCurrentProfile();
  const w = profile.workouts.find(x => x.id === workoutId);
  if (!w) return;
  document.getElementById('session-workout-name').textContent = w.name;
  document.getElementById('session-date').textContent = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
  });
  document.getElementById('session-notes').value = '';
  const container = document.getElementById('session-exercises');
  container.innerHTML = w.exercises.map((e, ei) => {
    const ex = state.exercises.find(x => x.id === e.exerciseId);
    if (!ex) return '';
    const lastSession = getLastSessionData(workoutId, e.exerciseId);
    let setsHtml = '';
    for (let s = 0; s < e.sets; s++) {
      const lastSet = lastSession ? (lastSession[s] || null) : null;
      setsHtml += `<tr>
        <td style="color:var(--text3);font-size:0.85rem">${s + 1}</td>
        <td><input type="number" class="set-weight" data-ex="${ei}" data-set="${s}"
          value="${lastSet ? lastSet.weight : ''}"
          placeholder="${lastSet ? lastSet.weight : '0'}" min="0" step="0.5" /></td>
        <td><input type="number" class="set-reps" data-ex="${ei}" data-set="${s}"
          value="${lastSet ? lastSet.reps : ''}"
          placeholder="${lastSet ? lastSet.reps : '0'}" min="0" /></td>
      </tr>`;
    }
    const lastText = lastSession
      ? `Último: ${lastSession.map(s => s.weight + 'kg x ' + s.reps).join(', ')}`
      : 'Primeira vez';
    return `<div class="session-exercise-item">
      <div class="session-exercise-header">
        <div>
          <div class="session-exercise-name">${ex.name}</div>
          <div style="font-size:0.78rem;color:var(--text3);margin-top:2px">${lastText}</div>
        </div>
        <button class="btn-icon-sm" onclick="openExerciseDetail('${ex.id}')" title="Ver exercício">ℹ️</button>
      </div>
      <table class="sets-table">
        <thead><tr><th>Série</th><th>Peso (kg)</th><th>Reps</th></tr></thead>
        <tbody>${setsHtml}</tbody>
      </table>
    </div>`;
  }).join('');
  document.getElementById('btn-save-session').dataset.workoutId = workoutId;
  openModal('modal-session');
}

function getLastSessionData(workoutId, exerciseId) {
  const profile = getCurrentProfile();
  const sessions = (profile.sessions || [])
    .filter(s => s.workoutId === workoutId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  if (!sessions.length) return null;
  const exData = (sessions[0].exercises || []).find(e => e.exerciseId === exerciseId);
  return exData ? exData.sets : null;
}

async function saveSession() {
  const workoutId = document.getElementById('btn-save-session').dataset.workoutId;
  const profile = getCurrentProfile();
  const w = profile.workouts.find(x => x.id === workoutId);
  const notes = document.getElementById('session-notes').value.trim();
  const exercisesData = w.exercises.map((e, ei) => {
    const weights = document.querySelectorAll(`.set-weight[data-ex="${ei}"]`);
    const repss   = document.querySelectorAll(`.set-reps[data-ex="${ei}"]`);
    const sets = [];
    for (let s = 0; s < weights.length; s++) {
      sets.push({ weight: parseFloat(weights[s].value) || 0, reps: parseInt(repss[s].value) || 0 });
    }
    return { exerciseId: e.exerciseId, sets };
  });
  const session = {
    id: uid(),
    workoutId,
    workoutName: w.name,
    workoutColor: w.color,
    date: new Date().toISOString(),
    exercises: exercisesData,
    notes
  };
  if (!profile.sessions) profile.sessions = [];
  profile.sessions.push(session);
  setLoading(true);
  await saveProfiles();
  setLoading(false);
  closeModal('modal-session');
  renderWorkouts();
  showToast('Treino registrado!', 'success');
}

// ===== HISTORY =====
function renderHistory() {
  const profile = getCurrentProfile();
  const sessions = (profile.sessions || []).sort((a, b) => new Date(b.date) - new Date(a.date));

  const filterSel = document.getElementById('filter-workout');
  const currentFilter = filterSel.value;
  filterSel.innerHTML = '<option value="">Todos os treinos</option>';
  [...new Set(sessions.map(s => s.workoutName))].forEach(n => {
    const opt = document.createElement('option');
    opt.value = n; opt.textContent = n;
    if (n === currentFilter) opt.selected = true;
    filterSel.appendChild(opt);
  });

  const filterMonth   = document.getElementById('filter-month').value;
  const filterWorkout = filterSel.value;
  let filtered = sessions.filter(s => {
    const d = new Date(s.date);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (filterMonth   && monthStr !== filterMonth)     return false;
    if (filterWorkout && s.workoutName !== filterWorkout) return false;
    return true;
  });

  const container = document.getElementById('history-list');
  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📋</div>
      <h3>Nenhuma sessão encontrada</h3>
      <p>Registre seu primeiro treino!</p>
    </div>`;
    return;
  }
  container.innerHTML = `<div class="history-list">` + filtered.map(s => {
    const totalSets = s.exercises.reduce((a, e) => a + e.sets.length, 0);
    return `<div class="history-item" onclick="viewSession('${s.id}')">
      <div class="history-item-dot" style="background:${s.workoutColor || 'var(--primary)'}"></div>
      <div class="history-item-info">
        <div class="history-item-name">${s.workoutName}</div>
        <div class="history-item-meta">${s.exercises.length} exercício(s) · ${totalSets} série(s) ${s.notes ? '· 📝' : ''}</div>
      </div>
      <div class="history-item-date">${formatDate(s.date)}</div>
    </div>`;
  }).join('') + '</div>';
}

function viewSession(sessionId) {
  const profile = getCurrentProfile();
  const s = profile.sessions.find(x => x.id === sessionId);
  if (!s) return;
  state.viewingSessionId = sessionId;
  document.getElementById('sd-workout-name').textContent = s.workoutName;
  document.getElementById('sd-date').textContent = formatDate(s.date);
  document.getElementById('sd-exercises').innerHTML = s.exercises.map(e => {
    const ex = state.exercises.find(x => x.id === e.exerciseId);
    const chips = e.sets.map((st, i) =>
      `<div class="set-chip">Série ${i + 1}: ${st.weight}kg × ${st.reps} rep</div>`
    ).join('');
    return `<div class="session-detail-exercise">
      <div class="session-detail-name">${ex ? ex.name : 'Exercício'}</div>
      <div class="sets-display">${chips}</div>
    </div>`;
  }).join('');
  const notesContainer = document.getElementById('sd-notes-container');
  if (s.notes) {
    notesContainer.style.display = '';
    document.getElementById('sd-notes').textContent = s.notes;
  } else {
    notesContainer.style.display = 'none';
  }
  openModal('modal-session-detail');
}

async function deleteCurrentSession() {
  if (!confirm('Excluir esta sessão permanentemente?')) return;
  const profile = getCurrentProfile();
  profile.sessions = profile.sessions.filter(s => s.id !== state.viewingSessionId);
  setLoading(true);
  await saveProfiles();
  setLoading(false);
  closeModal('modal-session-detail');
  renderHistory();
  showToast('Sessão excluída');
}

function exportCSV() {
  const profile = getCurrentProfile();
  const sessions = (profile.sessions || []).sort((a, b) => new Date(a.date) - new Date(b.date));
  const rows = [['Data', 'Treino', 'Exercício', 'Série', 'Peso (kg)', 'Repetições', 'Observações']];
  sessions.forEach(s => {
    s.exercises.forEach(e => {
      const ex = state.exercises.find(x => x.id === e.exerciseId);
      e.sets.forEach((st, i) => {
        rows.push([
          formatDateShort(s.date), s.workoutName,
          ex ? ex.name : e.exerciseId,
          i + 1, st.weight, st.reps,
          i === 0 ? (s.notes || '') : ''
        ]);
      });
    });
  });
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `treinos_${profile.name}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV exportado!', 'success');
}

// ===== EXERCISE LIBRARY =====
function renderExerciseLibrary() {
  const search = document.getElementById('exercise-search').value.toLowerCase();
  const group  = document.getElementById('exercise-filter-group').value;

  const groups  = [...new Set(state.exercises.map(e => e.group))].sort();
  const sel     = document.getElementById('exercise-filter-group');
  const current = sel.value;
  sel.innerHTML = '<option value="">Todos os grupos</option>' +
    groups.map(g => `<option value="${g}" ${g === current ? 'selected' : ''}>${g}</option>`).join('');

  const filtered = state.exercises.filter(e => {
    if (search && !e.name.toLowerCase().includes(search) && !e.group.toLowerCase().includes(search)) return false;
    if (group && e.group !== group) return false;
    return true;
  });

  const container = document.getElementById('exercise-library');
  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><h3>Nenhum exercício encontrado</h3></div>`;
    return;
  }
  container.innerHTML = `<div class="exercise-grid">` + filtered.map(e =>
    `<div class="exercise-card" onclick="openExerciseDetail('${e.id}')">
      <div class="exercise-card-header">
        <div class="exercise-card-name">${e.name}</div>
        <span class="badge badge-group">${e.group}</span>
      </div>
      <div class="exercise-card-desc">${e.description || ''}</div>
      ${e.videoUrl ? '<div style="font-size:0.78rem;color:var(--primary);margin-top:4px">▶ Vídeo disponível</div>' : ''}
      <div class="exercise-card-actions">
        <button class="btn-icon-sm" onclick="event.stopPropagation();editExercise('${e.id}')" title="Editar">✏️</button>
        <button class="btn-icon-sm" onclick="event.stopPropagation();deleteExercise('${e.id}')" title="Excluir">🗑️</button>
      </div>
    </div>`
  ).join('') + '</div>';
}

function openExerciseDetail(id) {
  const ex = state.exercises.find(x => x.id === id);
  if (!ex) return;
  document.getElementById('detail-exercise-name').textContent  = ex.name;
  document.getElementById('detail-exercise-group').textContent = ex.group;

  const embedUrl = getYoutubeEmbedUrl(ex.videoUrl);
  document.getElementById('detail-video-container').innerHTML = embedUrl
    ? `<div class="video-container"><iframe src="${embedUrl}" allowfullscreen loading="lazy"></iframe></div>`
    : '';

  const descContainer = document.getElementById('detail-desc-container');
  if (ex.description) {
    descContainer.style.display = '';
    document.getElementById('detail-exercise-description').textContent = ex.description;
  } else {
    descContainer.style.display = 'none';
  }

  const profile    = getCurrentProfile();
  const allEntries = [];
  (profile.sessions || []).forEach(s => {
    const entry = s.exercises.find(e => e.exerciseId === id);
    if (entry) allEntries.push({ date: s.date, sets: entry.sets, workoutName: s.workoutName });
  });
  allEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
  const recent = allEntries.slice(0, 5);
  document.getElementById('detail-exercise-history').innerHTML = recent.length === 0
    ? '<p style="color:var(--text3);font-size:0.85rem">Nenhuma sessão registrada com este exercício.</p>'
    : recent.map(entry => {
        const chips = entry.sets.map((st, i) =>
          `<div class="set-chip">${st.weight}kg × ${st.reps}</div>`).join('');
        return `<div class="session-detail-exercise">
          <div class="session-detail-name" style="font-size:0.85rem">${formatDate(entry.date)} · ${entry.workoutName}</div>
          <div class="sets-display">${chips}</div>
        </div>`;
      }).join('');

  openModal('modal-exercise-detail');
}

function openNewExerciseModal() {
  state.editingExerciseId = null;
  document.getElementById('modal-exercise-title').textContent = 'Novo Exercício';
  document.getElementById('exercise-name').value        = '';
  document.getElementById('exercise-group').value       = 'Peito';
  document.getElementById('exercise-description').value = '';
  document.getElementById('exercise-video').value       = '';
  document.getElementById('exercise-sets').value        = '3';
  openModal('modal-exercise');
}

function editExercise(id) {
  const ex = state.exercises.find(x => x.id === id);
  if (!ex) return;
  state.editingExerciseId = id;
  document.getElementById('modal-exercise-title').textContent = 'Editar Exercício';
  document.getElementById('exercise-name').value        = ex.name;
  document.getElementById('exercise-group').value       = ex.group;
  document.getElementById('exercise-description').value = ex.description || '';
  document.getElementById('exercise-video').value       = ex.videoUrl || '';
  document.getElementById('exercise-sets').value        = ex.defaultSets || 3;
  openModal('modal-exercise');
}

async function saveExercise() {
  const name = document.getElementById('exercise-name').value.trim();
  if (!name) { showToast('Digite o nome do exercício', 'error'); return; }
  const data = {
    name,
    group:       document.getElementById('exercise-group').value,
    description: document.getElementById('exercise-description').value.trim(),
    videoUrl:    document.getElementById('exercise-video').value.trim(),
    defaultSets: parseInt(document.getElementById('exercise-sets').value) || 3
  };
  if (state.editingExerciseId) {
    const idx = state.exercises.findIndex(e => e.id === state.editingExerciseId);
    state.exercises[idx] = { ...state.exercises[idx], ...data };
  } else {
    state.exercises.push({ id: uid(), ...data });
  }
  setLoading(true);
  await saveExercises();
  setLoading(false);
  closeModal('modal-exercise');
  renderExerciseLibrary();
  showToast('Exercício salvo!', 'success');
}

async function deleteExercise(id) {
  if (!confirm('Excluir este exercício? Ele será removido de todos os treinos.')) return;
  state.exercises = state.exercises.filter(e => e.id !== id);
  state.profiles.forEach(p => {
    (p.workouts || []).forEach(w => {
      w.exercises = (w.exercises || []).filter(e => e.exerciseId !== id);
    });
  });
  setLoading(true);
  await save();
  setLoading(false);
  renderExerciseLibrary();
  showToast('Exercício excluído');
}

// ===== COLOR PICKER =====
function renderColorPicker(containerId, inputId, selected) {
  const container = document.getElementById(containerId);
  container.innerHTML = COLORS.map(c =>
    `<div class="color-swatch ${c === selected ? 'selected' : ''}" style="background:${c}" data-color="${c}"></div>`
  ).join('');
  container.querySelectorAll('.color-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      container.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
      sw.classList.add('selected');
      document.getElementById(inputId).value = sw.dataset.color;
    });
  });
}

// ===== AVATAR HELPERS =====
// Retorna true se o valor é uma imagem base64
function isAvatarPhoto(val) {
  return val && val.startsWith('data:image');
}

// Renderiza avatar como emoji ou img dependendo do valor
function renderAvatarHtml(avatar, cls = '') {
  if (isAvatarPhoto(avatar)) {
    return `<img src="${avatar}" class="${cls}" style="border-radius:50%;object-fit:cover" />`;
  }
  return avatar || '🧑';
}

// Comprime e converte imagem para base64
function handleAvatarUpload(input, prefix) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const size = 200;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      // Crop centralizado
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      const base64 = canvas.toDataURL('image/jpeg', 0.7);
      document.getElementById(prefix + '-profile-avatar').value = base64;
      // Atualiza preview
      const preview = document.getElementById(prefix + '-avatar-preview');
      preview.innerHTML = `<img src="${base64}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />`;
      // Desmarca emojis selecionados
      document.querySelectorAll(`#${prefix === 'new' ? 'avatar-picker' : 'edit-avatar-picker'} .emoji-opt`).forEach(o => o.classList.remove('selected'));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}



function renderAvatarPicker() {
  const container = document.getElementById('avatar-picker');
  const selected  = document.getElementById('new-profile-avatar').value;
  container.innerHTML = AVATARS.map(a =>
    `<span class="emoji-opt ${a === selected ? 'selected' : ''}" data-avatar="${a}">${a}</span>`
  ).join('');
  container.querySelectorAll('.emoji-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      container.querySelectorAll('.emoji-opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      document.getElementById('new-profile-avatar').value = opt.dataset.avatar;
      document.getElementById('new-avatar-preview').innerHTML = opt.dataset.avatar;
    });
  });
  // Preview inicial
  const preview = document.getElementById('new-avatar-preview');
  if (preview) {
    const val = document.getElementById('new-profile-avatar').value;
    preview.innerHTML = isAvatarPhoto(val)
      ? `<img src="${val}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />`
      : (val || '🧑');
  }
}

// ===== INIT =====
function initApp() {
  renderLoginProfiles();

  // Nav tabs
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => showTab(btn.dataset.tab));
  });

  // Logout
  document.getElementById('btn-logout').addEventListener('click', () => {
    state.currentProfile = null;
    showScreen('screen-login');
    renderLoginProfiles();
  });

  // Profiles
  document.getElementById('btn-manage-profiles').addEventListener('click', () => {
    renderProfilesModal();
    renderAvatarPicker();
    openModal('modal-profiles');
  });
  document.getElementById('btn-add-profile').addEventListener('click', addProfile);
  document.getElementById('btn-save-edit-profile').addEventListener('click', saveEditProfile);

  // Workouts
  document.getElementById('btn-new-workout').addEventListener('click', openNewWorkoutModal);
  document.getElementById('btn-save-workout').addEventListener('click', saveWorkout);
  document.getElementById('btn-add-exercise-to-workout').addEventListener('click', addExerciseToWorkout);

  // Session
  document.getElementById('btn-save-session').addEventListener('click', saveSession);
  document.getElementById('btn-delete-session').addEventListener('click', deleteCurrentSession);

  // Exercises
  document.getElementById('btn-new-exercise').addEventListener('click', openNewExerciseModal);
  document.getElementById('btn-save-exercise').addEventListener('click', saveExercise);
  document.getElementById('exercise-search').addEventListener('input', renderExerciseLibrary);
  document.getElementById('exercise-filter-group').addEventListener('change', renderExerciseLibrary);

  // History
  document.getElementById('filter-workout').addEventListener('change', renderHistory);
  document.getElementById('filter-month').addEventListener('change', renderHistory);
  document.getElementById('btn-export-csv').addEventListener('click', exportCSV);

  // Close buttons
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });

  // Overlay
  document.getElementById('overlay').addEventListener('click', closeAllModals);
}

// ===== BOOTSTRAP =====
// Aguarda o Firebase estar pronto antes de iniciar
document.addEventListener('DOMContentLoaded', () => {
  if (window._firebaseReady) {
    load().then(initApp);
  } else {
    document.addEventListener('firebase-ready', () => {
      load().then(initApp);
    });
  }
});
