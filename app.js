/**
 * PulseFlow AI - Main Application Logic
 * Comprehensive Habit Tracker & Focus Timer with Auth, Real CRUD, Heatmaps & CSV Export.
 */

// Global State
const state = {
    user: null, // { email, name, isGuest }
    habits: [],
    logs: {}, // { 'YYYY-MM-DD': { habitId: completedBoolean } }
    activeFilter: 'all',
    activeView: 'dashboard',
    timer: {
        secondsRemaining: 1500,
        totalSeconds: 1500,
        isRunning: false,
        intervalId: null
    },
    charts: {}
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initAuthListeners();
    checkExistingSession();
    initNavigation();
    initHabitForms();
    initTimerControls();
    initBackupButtons();
});

function initLucideIcons() {
    if (window.lucide) window.lucide.createIcons();
}

/* ==========================================================================
   User Session & Authentication
   ========================================================================== */
function initAuthListeners() {
    const tabLogin = document.getElementById('tab-login-btn');
    const tabSignup = document.getElementById('tab-signup-btn');
    const formAuth = document.getElementById('form-auth');
    const btnSubmit = document.getElementById('btn-auth-submit');
    const btnGuest = document.getElementById('btn-guest-login');
    const btnLogout = document.getElementById('btn-logout');

    let isLoginMode = true;

    if (tabLogin && tabSignup) {
        tabLogin.addEventListener('click', () => {
            isLoginMode = true;
            tabLogin.classList.add('active');
            tabSignup.classList.remove('active');
            if (btnSubmit) btnSubmit.textContent = 'Log In & Start Tracking';
        });

        tabSignup.addEventListener('click', () => {
            isLoginMode = false;
            tabSignup.classList.add('active');
            tabLogin.classList.remove('active');
            if (btnSubmit) btnSubmit.textContent = 'Create New Account';
        });
    }

    if (formAuth) {
        formAuth.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email').value || 'user@pulseflow.ai';
            const userObj = { email, name: email.split('@')[0], isGuest: false };
            loginUser(userObj);
        });
    }

    if (btnGuest) {
        btnGuest.addEventListener('click', () => {
            const guestObj = { email: 'guest@pulseflow.local', name: 'Guest User', isGuest: true };
            loginUser(guestObj);
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', logoutUser);
    }
}

function checkExistingSession() {
    const savedUser = localStorage.getItem('pulseflow_user');
    if (savedUser) {
        try {
            state.user = JSON.parse(savedUser);
            showMainApp();
        } catch (e) {
            showAuthScreen();
        }
    } else {
        showAuthScreen();
    }
}

function loginUser(userObj) {
    state.user = userObj;
    localStorage.setItem('pulseflow_user', JSON.stringify(userObj));
    loadUserData();
    showMainApp();
}

function logoutUser() {
    state.user = null;
    localStorage.removeItem('pulseflow_user');
    showAuthScreen();
}

function showAuthScreen() {
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('main-app-layout').style.display = 'none';
    document.getElementById('mobile-bottom-bar').style.display = 'none';
}

function showMainApp() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-app-layout').style.display = 'flex';
    if (window.innerWidth <= 768) {
        document.getElementById('mobile-bottom-bar').style.display = 'flex';
    }

    const nameEl = document.getElementById('user-display-name');
    const avatarEl = document.getElementById('user-avatar-initials');
    if (nameEl && state.user) nameEl.textContent = state.user.name;
    if (avatarEl && state.user) avatarEl.textContent = state.user.name.charAt(0).toUpperCase();

    loadUserData();
    renderHabitsList();
    renderMetrics();
    updateTimerHabitSelect();
    initHeatmapGrid();
    initCharts();
    renderAIInsights();
    initLucideIcons();
}

function loadUserData() {
    if (!state.user) return;
    const userKey = `pulseflow_data_${state.user.email}`;
    const saved = localStorage.getItem(userKey);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            state.habits = parsed.habits || [];
            state.logs = parsed.logs || {};
        } catch (e) {
            state.habits = [];
            state.logs = {};
        }
    } else {
        state.habits = [];
        state.logs = {};
    }
}

function saveUserData() {
    if (!state.user) return;
    const userKey = `pulseflow_data_${state.user.email}`;
    localStorage.setItem(userKey, JSON.stringify({ habits: state.habits, logs: state.logs }));
}

/* ==========================================================================
   Navigation
   ========================================================================== */
function initNavigation() {
    const allNavButtons = document.querySelectorAll('.nav-item, .mobile-nav-item');
    allNavButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            if (tab) switchTab(tab);
        });
    });

    const filterPills = document.querySelectorAll('#habit-filter-pills .pill');
    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            state.activeFilter = pill.getAttribute('data-filter');
            renderHabitsList();
        });
    });
}

function switchTab(tabId) {
    state.activeView = tabId;
    
    // Update headers
    const titleEl = document.getElementById('header-page-title');
    const subEl = document.getElementById('header-page-sub');
    const headers = {
        dashboard: { title: 'Dashboard & Habits', sub: 'Track your daily rituals & habit progress' },
        timer: { title: 'Focus Stopwatch', sub: 'Deep work timer attached to habits' },
        analytics: { title: 'Analytics & Heatmaps', sub: '365-day execution intensity & balance' },
        'ai-insights': { title: 'AI Insights', sub: 'Behavioral correlations & energy triggers' },
        settings: { title: 'Backup & Settings', sub: 'Export habit data & account management' }
    };
    if (headers[tabId]) {
        if (titleEl) titleEl.textContent = headers[tabId].title;
        if (subEl) subEl.textContent = headers[tabId].sub;
    }

    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(b => {
        if (b.getAttribute('data-tab') === tabId) b.classList.add('active');
        else b.classList.remove('active');
    });

    document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
    const activePanel = document.getElementById(`view-${tabId}`);
    if (activePanel) activePanel.classList.add('active');

    if (tabId === 'analytics') {
        setTimeout(() => {
            initHeatmapGrid();
            if (state.charts.radar) renderRadarChart();
        }, 100);
    }
}

/* ==========================================================================
   Habits CRUD & Form Handling
   ========================================================================== */
function initHabitForms() {
    // 1. Quick Inline Add Form
    const quickForm = document.getElementById('form-quick-add-habit');
    if (quickForm) {
        quickForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const titleInput = document.getElementById('quick-habit-input');
            const ritualInput = document.getElementById('quick-habit-ritual');
            const domainInput = document.getElementById('quick-habit-domain');

            if (!titleInput || !titleInput.value.trim()) return;

            addNewHabit(titleInput.value.trim(), domainInput.value, ritualInput.value, 'boolean', 1, 'check');
            titleInput.value = '';
        });
    }

    // 2. Header & Modal Add Form
    const btnHeaderAdd = document.getElementById('btn-header-add-habit');
    const modalAdd = document.getElementById('modal-add-habit');
    const btnCloseModal = document.getElementById('btn-close-add-habit');
    const btnCancelModal = document.getElementById('btn-cancel-modal');
    const modalForm = document.getElementById('form-modal-new-habit');

    if (btnHeaderAdd && modalAdd) {
        btnHeaderAdd.addEventListener('click', () => {
            modalAdd.classList.add('active');
        });
    }

    if (btnCloseModal && modalAdd) btnCloseModal.addEventListener('click', () => modalAdd.classList.remove('active'));
    if (btnCancelModal && modalAdd) btnCancelModal.addEventListener('click', () => modalAdd.classList.remove('active'));

    if (modalForm) {
        modalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('modal-habit-name').value;
            const domain = document.getElementById('modal-habit-domain').value;
            const ritual = document.getElementById('modal-habit-ritual').value;
            const type = document.getElementById('modal-habit-type').value;
            const target = parseInt(document.getElementById('modal-habit-target').value, 10) || 1;

            addNewHabit(name, domain, ritual, type, target, type === 'timer' ? 'mins' : 'units');
            modalAdd.classList.remove('active');
            modalForm.reset();
        });
    }
}

function addNewHabit(title, domain, ritual, type, target, unit) {
    const newHabit = {
        id: 'h_' + Date.now(),
        title,
        domain,
        ritual,
        type,
        target,
        unit,
        completed: false,
        streak: 0,
        resiliency: 100
    };

    state.habits.push(newHabit);
    saveUserData();
    renderHabitsList();
    renderMetrics();
    updateTimerHabitSelect();
    initHeatmapGrid();
    initLucideIcons();

    if (window.confetti) window.confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
}

function renderHabitsList() {
    const container = document.getElementById('habits-list-container');
    if (!container) return;

    if (state.habits.length === 0) {
        container.innerHTML = `
            <div class="text-center" style="color: #94A3B8; border: 2px dashed rgba(255,255,255,0.1); border-radius: 14px; padding: 32px 16px;">
                <i data-lucide="plus-circle" style="width: 40px; height: 40px; color: #6366F1; margin-bottom: 8px;"></i>
                <h4 style="font-size: 1.1rem; color: #F8FAFC;">No Habits Added Yet</h4>
                <p style="font-size: 0.88rem; margin-top: 4px; margin-bottom: 16px;">Type a habit name above or click <strong>"+ New Habit"</strong> to start your first ritual.</p>
            </div>
        `;
        initLucideIcons();
        return;
    }

    let filtered = state.habits;
    if (state.activeFilter !== 'all') {
        filtered = state.habits.filter(h => h.ritual === state.activeFilter);
    }

    container.innerHTML = filtered.map(habit => `
        <div class="habit-item ${habit.completed ? 'completed' : ''}">
            <div style="display: flex; align-items: center; gap: 14px;">
                <button class="habit-check-btn" onclick="toggleHabit('${habit.id}')">
                    <i data-lucide="check"></i>
                </button>
                <div>
                    <span style="font-weight: 600; font-size: 0.95rem; color: #F8FAFC;">${escapeHtml(habit.title)}</span>
                    <div style="font-size: 0.78rem; color: #94A3B8; margin-top: 2px;">
                        <span style="text-transform: capitalize;">${habit.ritual}</span> • ${habit.domain} • ${habit.target} ${habit.unit}
                    </div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 14px;">
                <div style="text-align: right;">
                    <span style="font-size: 0.8rem; font-weight: 700; color: #6366F1;">${habit.resiliency}% Strength</span>
                    <div style="font-size: 0.75rem; color: #94A3B8;">🔥 ${habit.streak}d streak</div>
                </div>
                <button class="btn-delete-habit" onclick="deleteHabit('${habit.id}')" title="Delete Habit">
                    <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
                </button>
            </div>
        </div>
    `).join('');

    initLucideIcons();
}

function toggleHabit(habitId) {
    const habit = state.habits.find(h => h.id === habitId);
    if (!habit) return;

    habit.completed = !habit.completed;
    const todayStr = new Date().toISOString().split('T')[0];
    if (!state.logs[todayStr]) state.logs[todayStr] = {};

    if (habit.completed) {
        habit.streak += 1;
        habit.resiliency = Math.min(100, habit.resiliency + 2);
        state.logs[todayStr][habit.id] = true;
        playChimeSound();
        if (window.confetti) window.confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    } else {
        habit.streak = Math.max(0, habit.streak - 1);
        habit.resiliency = Math.max(50, habit.resiliency - 3);
        state.logs[todayStr][habit.id] = false;
    }

    saveUserData();
    renderHabitsList();
    renderMetrics();
    initHeatmapGrid();
}

function deleteHabit(habitId) {
    if (confirm('Delete this habit routine?')) {
        state.habits = state.habits.filter(h => h.id !== habitId);
        saveUserData();
        renderHabitsList();
        renderMetrics();
        updateTimerHabitSelect();
    }
}

function renderMetrics() {
    const total = state.habits.length;
    const completed = state.habits.filter(h => h.completed).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const avgRes = total > 0 ? (state.habits.reduce((acc, h) => acc + h.resiliency, 0) / total).toFixed(1) : 100;

    const resEl = document.getElementById('score-resiliency');
    if (resEl) resEl.innerHTML = `${avgRes}<span class="unit">%</span>`;

    const compEl = document.getElementById('score-today-completion');
    if (compEl) compEl.textContent = `${completed} / ${total}`;

    const fillEl = document.getElementById('today-progress-fill');
    if (fillEl) fillEl.style.width = `${pct}%`;
}

/* ==========================================================================
   Active Focus Session Timer & Audio
   ========================================================================== */
function initTimerControls() {
    const btnStart = document.getElementById('btn-timer-start');
    const btnReset = document.getElementById('btn-timer-reset');

    if (btnStart) {
        btnStart.addEventListener('click', () => {
            if (state.timer.isRunning) pauseTimer();
            else startTimer();
        });
    }

    if (btnReset) btnReset.addEventListener('click', resetTimer);
    updateTimerDisplay();
}

function updateTimerHabitSelect() {
    const select = document.getElementById('timer-habit-select');
    if (!select) return;
    select.innerHTML = '<option value="">-- General Deep Work Session --</option>' +
        state.habits.map(h => `<option value="${h.id}">${escapeHtml(h.title)}</option>`).join('');
}

function startTimer() {
    state.timer.isRunning = true;
    const btnStart = document.getElementById('btn-timer-start');
    if (btnStart) btnStart.innerHTML = '<i data-lucide="pause"></i> Pause Session';

    state.timer.intervalId = setInterval(() => {
        if (state.timer.secondsRemaining > 0) {
            state.timer.secondsRemaining--;
            updateTimerDisplay();
        } else {
            pauseTimer();
            playChimeSound();
            if (window.confetti) window.confetti({ particleCount: 80, spread: 90 });

            const select = document.getElementById('timer-habit-select');
            if (select && select.value) {
                toggleHabit(select.value);
            }
            alert('🎉 Focus Session Finished!');
        }
    }, 1000);

    initLucideIcons();
}

function pauseTimer() {
    state.timer.isRunning = false;
    clearInterval(state.timer.intervalId);
    const btnStart = document.getElementById('btn-timer-start');
    if (btnStart) btnStart.innerHTML = '<i data-lucide="play"></i> Resume Session';
    initLucideIcons();
}

function resetTimer() {
    pauseTimer();
    state.timer.secondsRemaining = 1500;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const display = document.getElementById('timer-clock');
    if (!display) return;
    const mins = Math.floor(state.timer.secondsRemaining / 60);
    const secs = state.timer.secondsRemaining % 60;
    display.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function playChimeSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.0);
    } catch (e) {
        console.log('Audio disabled');
    }
}

/* ==========================================================================
   Analytics, Dynamic 365-Day Heatmap & Radar
   ========================================================================== */
function initHeatmapGrid() {
    const grid = document.getElementById('heatmap-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const today = new Date();

    for (let i = 363; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        let level = 0;
        if (state.logs[dateStr]) {
            const count = Object.values(state.logs[dateStr]).filter(v => v).length;
            level = Math.min(4, count);
        }

        const cell = document.createElement('div');
        cell.className = `heatmap-cell cell-level-${level}`;
        cell.title = `${dateStr}: ${level} Habits Completed`;
        grid.appendChild(cell);
    }
}

function initCharts() {
    renderRadarChart();
}

function renderRadarChart() {
    const ctx = document.getElementById('radarDomainChart');
    if (!ctx) return;
    if (state.charts.radar) state.charts.radar.destroy();

    const domains = { health: 20, career: 20, mindfulness: 20, learning: 20, finance: 20 };
    state.habits.forEach(h => {
        if (h.completed && domains[h.domain] !== undefined) domains[h.domain] += 25;
    });

    state.charts.radar = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Health', 'Career', 'Mindfulness', 'Learning', 'Finance'],
            datasets: [{
                label: 'Domain Balance',
                data: [domains.health, domains.career, domains.mindfulness, domains.learning, domains.finance],
                backgroundColor: 'rgba(99, 102, 241, 0.25)',
                borderColor: '#6366F1',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { r: { angleLines: { color: 'rgba(255,255,255,0.1)' }, grid: { color: 'rgba(255,255,255,0.08)' }, ticks: { display: false } } },
            plugins: { legend: { display: false } }
        }
    });
}

function renderAIInsights() {
    const container = document.getElementById('insights-container');
    if (!container) return;

    if (state.habits.length === 0) {
        container.innerHTML = `<div class="card glass-card text-muted">Create habits and complete daily logs to unlock AI habit correlation insights.</div>`;
        return;
    }

    container.innerHTML = `
        <div class="glass-card" style="border-left: 4px solid #6366F1; padding: 20px; margin-bottom: 12px;">
            <span style="font-size: 0.72rem; font-weight: 700; color: #6366F1; text-transform: uppercase;">Active Habit Synergy</span>
            <h4 style="margin: 6px 0;">Tracking ${state.habits.length} Active Daily Rituals</h4>
            <p style="font-size: 0.88rem; color: #94A3B8;">Current habit resiliency score is ${document.getElementById('score-resiliency').textContent}. Keep check-ins consistent to maintain peak momentum.</p>
        </div>
    `;
}

/* ==========================================================================
   Backup, Export & Sample Data Controls
   ========================================================================== */
function initBackupButtons() {
    const btnExportJSON = document.getElementById('btn-export-json');
    const btnExportCSV = document.getElementById('btn-export-csv');
    const btnSample = document.getElementById('btn-load-sample-habits');
    const btnClear = document.getElementById('btn-clear-data');

    if (btnExportJSON) {
        btnExportJSON.addEventListener('click', () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
            const dlAnchor = document.createElement('a');
            dlAnchor.setAttribute("href", dataStr);
            dlAnchor.setAttribute("download", `pulseflow_backup_${state.user?.name || 'user'}.json`);
            dlAnchor.click();
        });
    }

    if (btnExportCSV) {
        btnExportCSV.addEventListener('click', () => {
            let csv = "Habit Title,Domain,Ritual,Streak,Resiliency,Completed Today\n";
            state.habits.forEach(h => {
                csv += `"${h.title}","${h.domain}","${h.ritual}",${h.streak},${h.resiliency},${h.completed}\n`;
            });
            const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
            const dlAnchor = document.createElement('a');
            dlAnchor.setAttribute("href", dataStr);
            dlAnchor.setAttribute("download", `pulseflow_report_${state.user?.name || 'user'}.csv`);
            dlAnchor.click();
        });
    }

    if (btnSample) {
        btnSample.addEventListener('click', () => {
            state.habits = [
                { id: 'h1', title: 'Morning Hydration & Electrolytes', domain: 'health', ritual: 'morning', target: 2500, unit: 'ml', completed: true, streak: 14, resiliency: 96 },
                { id: 'h2', title: 'Deep Work Focus Block', domain: 'career', ritual: 'morning', target: 240, unit: 'mins', completed: true, streak: 8, resiliency: 92 },
                { id: 'h3', title: 'Mindfulness & Meditation', domain: 'mindfulness', ritual: 'morning', target: 15, unit: 'mins', completed: false, streak: 5, resiliency: 88 },
                { id: 'h4', title: '30 Mins Cardio Workout', domain: 'health', ritual: 'afternoon', target: 1, unit: 'check', completed: false, streak: 3, resiliency: 82 }
            ];
            saveUserData();
            renderHabitsList();
            renderMetrics();
            updateTimerHabitSelect();
            initHeatmapGrid();
            alert('Starter habit template loaded!');
        });
    }

    if (btnClear) {
        btnClear.addEventListener('click', () => {
            if (confirm('Reset all habit data for this account?')) {
                state.habits = [];
                state.logs = {};
                saveUserData();
                renderHabitsList();
                renderMetrics();
                updateTimerHabitSelect();
                initHeatmapGrid();
            }
        });
    }
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
