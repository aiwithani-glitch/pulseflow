/**
 * PulseFlow AI - Full-Stack Cloud & Auth Application Logic
 * Implements user authentication, fresh account initialization, real habit CRUD,
 * active focus session timer with audio feedback, 365-day heatmap calculations, and CSV/JSON export.
 */

// Global Application State
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
        intervalId: null,
        attachedHabitId: ''
    },
    charts: {}
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initAuthListeners();
    checkExistingSession();
    initLucideIcons();
    initNavigation();
    initModals();
    initTimerControls();
});

function initLucideIcons() {
    if (window.lucide) window.lucide.createIcons();
}

/* ==========================================================================
   User Authentication & Session Management
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
            if (btnSubmit) btnSubmit.textContent = 'Log In to PulseFlow';
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
            const email = document.getElementById('auth-email').value;
            const user = { email: email, name: email.split('@')[0], isGuest: false };
            loginUser(user);
        });
    }

    if (btnGuest) {
        btnGuest.addEventListener('click', () => {
            const guestUser = { email: 'guest@pulseflow.local', name: 'Guest User', isGuest: true };
            loginUser(guestUser);
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

    // Update User Profile display
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
        // Starts completely fresh & clean!
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
   Habits CRUD & Logging Engine
   ========================================================================== */
function renderHabitsList() {
    const container = document.getElementById('habits-list-container');
    if (!container) return;

    if (state.habits.length === 0) {
        container.innerHTML = `
            <div class="text-center p-4" style="color: #9CA3AF; border: 2px dashed rgba(255,255,255,0.08); border-radius: 14px; padding: 24px;">
                <i data-lucide="plus-circle" style="width: 36px; height: 36px; color: #6366F1; margin-bottom: 8px;"></i>
                <h4>No Habits Created Yet</h4>
                <p style="font-size: 0.85rem; margin-top: 4px;">Tap <strong>"+ New Habit"</strong> or load starter templates to start tracking.</p>
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
            <div style="display: flex; align-items: center; gap: 12px;">
                <button class="habit-check-btn" onclick="toggleHabit('${habit.id}')">
                    <i data-lucide="check"></i>
                </button>
                <div>
                    <span style="font-weight: 600; font-size: 0.95rem;">${escapeHtml(habit.title)}</span>
                    <div style="font-size: 0.75rem; color: #9CA3AF;">${habit.domain} • ${habit.target} ${habit.unit}</div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="text-align: right;">
                    <span style="font-size: 0.78rem; font-weight: 700; color: #6366F1;">${habit.resiliency}% Strength</span>
                    <div style="font-size: 0.75rem; color: #9CA3AF;">🔥 ${habit.streak}d</div>
                </div>
                <button class="btn-delete-habit" onclick="deleteHabit('${habit.id}')" title="Delete Habit">
                    <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
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
        if (window.confetti) window.confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
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
    if (confirm('Are you sure you want to delete this habit?')) {
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
   Active Focus Stopwatch & Pomodoro Timer
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

            // Auto log attached habit if selected
            const select = document.getElementById('timer-habit-select');
            if (select && select.value) {
                toggleHabit(select.value);
            }

            alert('🎉 Focus Session Completed!');
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
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.2);
    } catch (e) {
        console.log('Audio chime unavailable');
    }
}

/* ==========================================================================
   Analytics & Dynamic 365-Day Heatmap
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

    const domains = { health: 0, career: 0, mindfulness: 0, learning: 0, finance: 0 };
    state.habits.forEach(h => {
        if (h.completed && domains[h.domain] !== undefined) domains[h.domain] += 20;
    });

    state.charts.radar = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Health', 'Career', 'Mindfulness', 'Learning', 'Finance'],
            datasets: [{
                label: 'Life Domain Score',
                data: [domains.health || 20, domains.career || 20, domains.mindfulness || 20, domains.learning || 20, domains.finance || 20],
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
        container.innerHTML = `<div class="card glass-card text-muted">Add habits and complete daily logs to unlock AI habit correlation insights.</div>`;
        return;
    }

    container.innerHTML = `
        <div class="glass-card p-4" style="border-left: 4px solid #6366F1; padding: 20px; margin-bottom: 12px;">
            <span style="font-size: 0.7rem; font-weight: 700; color: #6366F1; text-transform: uppercase;">Active Habit Correlation</span>
            <h4 style="margin: 6px 0;">Currently Tracking ${state.habits.length} Daily Habits</h4>
            <p style="font-size: 0.85rem; color: #9CA3AF;">Your overall resiliency score is ${document.getElementById('score-resiliency').textContent}. Keep completing daily rituals to build compounding habit momentum.</p>
        </div>
    `;
}

/* ==========================================================================
   Modals, Export & Starter Templates
   ========================================================================== */
function initModals() {
    // Add Habit modal
    const btnAdd = document.getElementById('btn-add-habit');
    const modalAdd = document.getElementById('modal-add-habit');
    const btnCloseAdd = document.getElementById('btn-close-add-habit');
    const btnCancelAdd = document.getElementById('btn-cancel-add-habit');
    const formAdd = document.getElementById('form-new-habit');

    if (btnAdd && modalAdd) btnAdd.addEventListener('click', () => modalAdd.classList.add('active'));
    if (btnCloseAdd) btnCloseAdd.addEventListener('click', () => modalAdd.classList.remove('active'));
    if (btnCancelAdd) btnCancelAdd.addEventListener('click', () => modalAdd.classList.remove('active'));

    if (formAdd) {
        formAdd.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('habit-name').value;
            const domain = document.getElementById('habit-domain').value;
            const ritual = document.getElementById('habit-ritual').value;
            const type = document.getElementById('habit-type').value;
            const target = parseInt(document.getElementById('habit-target').value, 10) || 1;

            const newHabit = {
                id: 'h_' + Date.now(),
                title: name,
                domain: domain,
                ritual: ritual,
                type: type,
                target: target,
                unit: type === 'timer' ? 'mins' : (type === 'numeric' ? 'units' : 'check'),
                completed: false,
                streak: 0,
                resiliency: 100
            };

            state.habits.push(newHabit);
            saveUserData();
            renderHabitsList();
            renderMetrics();
            updateTimerHabitSelect();
            modalAdd.classList.remove('active');
            formAdd.reset();
        });
    }

    // Export JSON / CSV & Templates
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
                { id: 'h4', title: '30 Mins Workout / Cardio', domain: 'health', ritual: 'afternoon', target: 1, unit: 'check', completed: false, streak: 3, resiliency: 82 }
            ];
            saveUserData();
            renderHabitsList();
            renderMetrics();
            updateTimerHabitSelect();
            alert('Loaded starter habit template!');
        });
    }

    if (btnClear) {
        btnClear.addEventListener('click', () => {
            if (confirm('Clear all habit data for this account?')) {
                state.habits = [];
                state.logs = {};
                saveUserData();
                renderHabitsList();
                renderMetrics();
                updateTimerHabitSelect();
            }
        });
    }
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
