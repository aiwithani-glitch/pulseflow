/**
 * PulseFlow AI - Habit & Productivity Intelligence Engine
 * Features:
 * 1. Initial 0 Habits with "Load 9 Starter Habit Templates" Button (Disappears when habits > 0)
 * 2. Clickable User Profile Modal in Sidebar (Displays Pro Level & PulseFlow AI v1.0)
 * 3. Settings Tab Theme Switcher (☀️ Fresh Light vs 🌙 Midnight Dark)
 * 4. Dropdown Arrow Alignment Fix & Clean Header
 * 5. Touch & Mouse Drag & Drop Reordering (⋮⋮)
 */

// Global State
const state = {
    user: null,
    habits: [],
    logs: {},
    activeView: 'dashboard',
    draggedIndex: null,
    touchStartY: 0,
    theme: 'dark',
    notificationsEnabled: false,
    lastNotified: {},
    timer: {
        secondsRemaining: 1500,
        totalSeconds: 1500,
        isRunning: false,
        intervalId: null
    },
    charts: {}
};

// 9 Curated Starter Default Habits
function getStarterHabits() {
    return [
        { id: 'h_default_1', title: 'Morning Hydration & Electrolytes', domain: 'health', type: 'numeric', target: 3000, unit: 'ml', frequency: 'Daily (7x/wk)', reminderEnabled: true, reminderTime: '08:00', completed: false, streak: 5, resiliency: 96 },
        { id: 'h_default_2', title: 'No Negative Thoughts Today', domain: 'mindfulness', type: 'boolean', target: 1, unit: 'check', frequency: 'Daily (7x/wk)', reminderEnabled: false, reminderTime: '08:30', completed: false, streak: 4, resiliency: 94 },
        { id: 'h_default_3', title: 'Daily Manifestation & Visualization', domain: 'mindfulness', type: 'boolean', target: 1, unit: 'check', frequency: 'Daily (7x/wk)', reminderEnabled: true, reminderTime: '09:00', completed: false, streak: 7, resiliency: 98 },
        { id: 'h_default_4', title: 'Mindfulness & Meditation', domain: 'mindfulness', type: 'timer', target: 10, unit: 'mins', frequency: 'Daily (7x/wk)', reminderEnabled: false, reminderTime: '09:30', completed: false, streak: 3, resiliency: 88 },
        { id: 'h_default_5', title: 'Screen Time Less Than 3 Hours', domain: 'mindfulness', type: 'timer', target: 180, unit: 'mins', frequency: 'Daily (7x/wk)', reminderEnabled: true, reminderTime: '21:00', completed: false, streak: 4, resiliency: 89 },
        { id: 'h_default_6', title: 'Zero Processed Sugar Intake', domain: 'health', type: 'boolean', target: 1, unit: 'check', frequency: '6x / week', reminderEnabled: false, reminderTime: '20:00', completed: false, streak: 6, resiliency: 91 },
        { id: 'h_default_7', title: 'Tech & Architecture Reading / Learning', domain: 'learning', type: 'numeric', target: 30, unit: 'pages', frequency: '6x / week', reminderEnabled: true, reminderTime: '21:30', completed: false, streak: 5, resiliency: 90 },
        { id: 'h_default_8', title: 'Deep Work Focus Block (4 Hours)', domain: 'career', type: 'timer', target: 240, unit: 'mins', frequency: '5x / week', reminderEnabled: true, reminderTime: '10:00', completed: false, streak: 8, resiliency: 92 },
        { id: 'h_default_9', title: 'Core Fitness & Cardio Workout', domain: 'health', type: 'boolean', target: 1, unit: 'check', frequency: '5x / week', reminderEnabled: true, reminderTime: '17:00', completed: false, streak: 4, resiliency: 86 }
    ];
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initAuthListeners();
    checkExistingSession();
    initNavigation();
    initHabitForms();
    initEditModal();
    initUserProfileModal();
    initTimerControls();
    initBackupButtons();
    initNotificationEngine();
});

function initLucideIcons() {
    if (window.lucide) window.lucide.createIcons();
}

/* ==========================================================================
   User Account Profile Modal (Bottom-Left Sidebar Click)
   ========================================================================== */
function initUserProfileModal() {
    const profileBox = document.getElementById('sidebar-user-profile');
    const modalUser = document.getElementById('modal-user-info');
    const btnCloseX = document.getElementById('btn-close-user-info');
    const btnCloseOk = document.getElementById('btn-close-user-info-ok');

    if (profileBox && modalUser) {
        profileBox.addEventListener('click', (e) => {
            // Prevent triggering if user clicked logout button
            if (e.target.closest('#btn-logout')) return;

            if (state.user) {
                const nameEl = document.getElementById('modal-user-name');
                const emailEl = document.getElementById('modal-user-email');
                const avatarEl = document.getElementById('modal-user-avatar');

                if (nameEl) nameEl.textContent = state.user.name;
                if (emailEl) emailEl.textContent = state.user.email;
                if (avatarEl) avatarEl.textContent = state.user.name.charAt(0).toUpperCase();
            }
            modalUser.classList.add('active');
        });
    }

    if (btnCloseX && modalUser) btnCloseX.addEventListener('click', () => modalUser.classList.remove('active'));
    if (btnCloseOk && modalUser) btnCloseOk.addEventListener('click', () => modalUser.classList.remove('active'));
}

/* ==========================================================================
   Theme Switcher Engine (Light vs Dark Mode in Settings)
   ========================================================================== */
function initTheme() {
    const savedTheme = localStorage.getItem('pulseflow_theme') || 'dark';
    setTheme(savedTheme);

    const btnToggle = document.getElementById('btn-toggle-theme');
    if (btnToggle) {
        btnToggle.addEventListener('click', () => {
            const newTheme = state.theme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
        });
    }
}

function setTheme(theme) {
    state.theme = theme;
    localStorage.setItem('pulseflow_theme', theme);
    document.body.className = `theme-${theme}`;

    const sunIcon = document.getElementById('theme-icon-sun');
    const moonIcon = document.getElementById('theme-icon-moon');
    const labelText = document.getElementById('theme-text-label');

    if (theme === 'light') {
        if (sunIcon) sunIcon.style.display = 'none';
        if (moonIcon) moonIcon.style.display = 'inline-block';
        if (labelText) labelText.textContent = 'Switch to Dark Mode';
    } else {
        if (sunIcon) sunIcon.style.display = 'inline-block';
        if (moonIcon) moonIcon.style.display = 'none';
        if (labelText) labelText.textContent = 'Switch to Light Mode';
    }

    if (state.charts.radar) renderRadarChart();
}

/* ==========================================================================
   Navigation Engine
   ========================================================================== */
function initNavigation() {
    const allNavButtons = document.querySelectorAll('.nav-item, .mobile-nav-item');
    allNavButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetBtn = e.currentTarget;
            const tab = targetBtn.getAttribute('data-tab');
            if (tab) switchTab(tab);
        });
    });
}

function switchTab(tabId) {
    state.activeView = tabId;
    const titleEl = document.getElementById('header-page-title');
    const subEl = document.getElementById('header-page-sub');
    const btnHeaderAdd = document.getElementById('btn-header-add-habit');

    // Show + New Habit button ONLY on Dashboard tab
    if (btnHeaderAdd) {
        btnHeaderAdd.style.display = (tabId === 'dashboard') ? 'inline-flex' : 'none';
    }

    const headers = {
        dashboard: { title: 'Dashboard & Habits', sub: 'Track your daily habits & productivity progress' },
        timer: { title: 'Focus Stopwatch', sub: 'Deep work timer attached to habits' },
        analytics: { title: 'Analytics & Heatmaps', sub: '365-day execution intensity & balance' },
        'ai-insights': { title: 'AI Insights', sub: 'Behavioral correlations & energy triggers' },
        settings: { title: 'Backup & Settings', sub: 'Export habit data, theme & account settings' }
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
   User Session & Data Loading (Starts with 0 habits for new users)
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

    if (btnLogout) btnLogout.addEventListener('click', logoutUser);
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
        saveUserData();
    }
}

function saveUserData() {
    if (!state.user) return;
    const userKey = `pulseflow_data_${state.user.email}`;
    localStorage.setItem(userKey, JSON.stringify({ habits: state.habits, logs: state.logs }));
}

window.loadStarterTemplates = function() {
    state.habits = getStarterHabits();
    saveUserData();
    renderHabitsList();
    renderMetrics();
    updateTimerHabitSelect();
    initHeatmapGrid();
    initLucideIcons();
    if (window.confetti) window.confetti({ particleCount: 50, spread: 70, origin: { y: 0.8 } });
};

/* ==========================================================================
   Habits CRUD & Touch Drag & Drop
   ========================================================================== */
function initHabitForms() {
    const quickForm = document.getElementById('form-quick-add-habit');
    if (quickForm) {
        quickForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const titleInput = document.getElementById('quick-habit-input');
            const domainInput = document.getElementById('quick-habit-domain');

            if (!titleInput || !titleInput.value.trim()) return;
            addNewHabit(titleInput.value.trim(), domainInput.value, 'boolean', 1, 'check', 'Daily (7x/wk)');
            titleInput.value = '';
        });
    }

    const btnHeaderAdd = document.getElementById('btn-header-add-habit');
    const modalAdd = document.getElementById('modal-add-habit');
    const btnCloseModal = document.getElementById('btn-close-add-habit');
    const btnCancelModal = document.getElementById('btn-cancel-modal');
    const modalForm = document.getElementById('form-modal-new-habit');

    if (btnHeaderAdd && modalAdd) {
        btnHeaderAdd.addEventListener('click', () => modalAdd.classList.add('active'));
    }

    if (btnCloseModal && modalAdd) btnCloseModal.addEventListener('click', () => modalAdd.classList.remove('active'));
    if (btnCancelModal && modalAdd) btnCancelModal.addEventListener('click', () => modalAdd.classList.remove('active'));

    if (modalForm) {
        modalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('modal-habit-name').value;
            const domain = document.getElementById('modal-habit-domain').value;
            const type = document.getElementById('modal-habit-type').value;
            const target = parseInt(document.getElementById('modal-habit-target').value, 10) || 1;
            const reminderEnable = document.getElementById('modal-habit-reminder-enable').value === 'yes';
            const reminderTime = document.getElementById('modal-habit-reminder-time').value || '08:00';

            addNewHabit(name, domain, type, target, type === 'timer' ? 'mins' : 'units', 'Daily (7x/wk)', reminderEnable, reminderTime);
            modalAdd.classList.remove('active');
            modalForm.reset();
        });
    }
}

function addNewHabit(title, domain, type, target, unit, frequency, reminderEnable = false, reminderTime = '08:00') {
    const newHabit = {
        id: 'h_' + Date.now(),
        title,
        domain,
        type,
        target,
        unit,
        frequency: frequency || 'Daily (7x/wk)',
        reminderEnabled: reminderEnable,
        reminderTime: reminderTime,
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

function initEditModal() {
    const modalEdit = document.getElementById('modal-edit-habit');
    const btnCloseEdit = document.getElementById('btn-close-edit-habit');
    const btnCancelEdit = document.getElementById('btn-cancel-edit-modal');
    const formEdit = document.getElementById('form-modal-edit-habit');

    if (btnCloseEdit && modalEdit) btnCloseEdit.addEventListener('click', () => modalEdit.classList.remove('active'));
    if (btnCancelEdit && modalEdit) btnCancelEdit.addEventListener('click', () => modalEdit.classList.remove('active'));

    if (formEdit) {
        formEdit.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-habit-id').value;
            const habit = state.habits.find(h => h.id === id);
            if (!habit) return;

            habit.title = document.getElementById('edit-habit-name').value;
            habit.domain = document.getElementById('edit-habit-domain').value;
            habit.type = document.getElementById('edit-habit-type').value;
            habit.target = parseInt(document.getElementById('edit-habit-target').value, 10) || 1;
            habit.unit = habit.type === 'timer' ? 'mins' : 'units';
            habit.reminderEnabled = document.getElementById('edit-habit-reminder-enable').value === 'yes';
            habit.reminderTime = document.getElementById('edit-habit-reminder-time').value || '08:00';

            saveUserData();
            renderHabitsList();
            renderMetrics();
            updateTimerHabitSelect();
            modalEdit.classList.remove('active');
        });
    }
}

window.openEditHabitModal = function(habitId) {
    const habit = state.habits.find(h => h.id === habitId);
    if (!habit) return;

    document.getElementById('edit-habit-id').value = habit.id;
    document.getElementById('edit-habit-name').value = habit.title;
    document.getElementById('edit-habit-domain').value = habit.domain;
    document.getElementById('edit-habit-type').value = habit.type || 'boolean';
    document.getElementById('edit-habit-target').value = habit.target || 1;
    document.getElementById('edit-habit-reminder-enable').value = habit.reminderEnabled ? 'yes' : 'no';
    document.getElementById('edit-habit-reminder-time').value = habit.reminderTime || '08:00';

    document.getElementById('modal-edit-habit').classList.add('active');
};

function renderHabitsList() {
    const container = document.getElementById('habits-list-container');
    if (!container) return;

    // Initial 0 Habits State: Display "Load 9 Starter Habit Templates" Banner
    if (state.habits.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; border: 2px dashed var(--border-color); border-radius: 16px; padding: 36px 20px;">
                <i data-lucide="sparkles" style="width: 48px; height: 48px; color: var(--primary-indigo); margin-bottom: 12px;"></i>
                <h4 style="font-size: 1.2rem; color: var(--text-main); margin-bottom: 6px;">No Active Habits Yet</h4>
                <p style="font-size: 0.88rem; color: var(--text-muted); max-width: 420px; margin: 0 auto 20px auto;">Start by typing a habit above, or load 9 curated habit templates across health, focus, and mindfulness.</p>
                <button type="button" class="btn btn-primary" onclick="loadStarterTemplates()">
                    <i data-lucide="rocket"></i> Load 9 Starter Habit Templates
                </button>
            </div>
        `;
        initLucideIcons();
        return;
    }

    container.innerHTML = state.habits.map((habit, idx) => {
        const domainClass = `domain-${habit.domain || 'health'}`;

        return `
        <div class="habit-item ${habit.completed ? 'completed' : ''}" 
             draggable="true" 
             data-index="${idx}" 
             ondragstart="handleDragStart(event, ${idx})" 
             ondragover="handleDragOver(event)" 
             ondrop="handleDrop(event, ${idx})"
             ontouchstart="handleTouchStart(event, ${idx})"
             ontouchmove="handleTouchMove(event)"
             ontouchend="handleTouchEnd(event, ${idx})">
            
            <div style="display: flex; align-items: center; gap: 12px;">
                <!-- Drag Grip Icon Handle ⋮⋮ -->
                <div class="drag-handle-grip" title="Hold & drag to reorder">
                    <i data-lucide="grip-vertical" style="width: 18px; height: 18px; color: var(--text-subtle);"></i>
                </div>

                <button class="habit-check-btn" onclick="toggleHabit('${habit.id}')">
                    <i data-lucide="check"></i>
                </button>
                <div>
                    <span style="font-weight: 600; font-size: 0.98rem; color: var(--text-main);">${escapeHtml(habit.title)}</span>
                    <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <span class="domain-badge ${domainClass}">${habit.domain || 'health'}</span>
                        <span>• ${habit.target} ${habit.unit}</span>
                        ${habit.frequency ? `<span class="frequency-chip">📅 ${habit.frequency}</span>` : ''}
                        ${habit.reminderEnabled ? `<span style="color: var(--accent-amber); font-weight: 600;">🔔 ${habit.reminderTime}</span>` : ''}
                    </div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="text-align: right; margin-right: 4px;">
                    <span style="font-size: 0.8rem; font-weight: 700; color: var(--primary-indigo);">${habit.resiliency}% Strength</span>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">🔥 ${habit.streak}d streak</div>
                </div>
                <div class="habit-actions-box">
                    <button class="btn-edit-habit" onclick="openEditHabitModal('${habit.id}')" title="Edit Habit">
                        <i data-lucide="edit-3" style="width: 16px; height: 16px;"></i>
                    </button>
                    <button class="btn-delete-habit" onclick="deleteHabit('${habit.id}')" title="Delete Habit">
                        <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');

    initLucideIcons();
}

/* Mouse & Touch Drag and Drop */
window.handleDragStart = function(e, index) {
    state.draggedIndex = index;
    e.dataTransfer.effectAllowed = 'move';
    if (e.target.classList) e.target.classList.add('dragging');
};

window.handleDragOver = function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
};

window.handleDrop = function(e, dropIndex) {
    e.preventDefault();
    const dragIndex = state.draggedIndex;
    if (dragIndex === null || dragIndex === dropIndex) return;

    const draggedItem = state.habits.splice(dragIndex, 1)[0];
    state.habits.splice(dropIndex, 0, draggedItem);
    state.draggedIndex = null;

    saveUserData();
    renderHabitsList();
};

window.handleTouchStart = function(e, index) {
    if (e.target.closest('.drag-handle-grip')) {
        state.draggedIndex = index;
        state.touchStartY = e.touches[0].clientY;
        const card = e.currentTarget;
        card.classList.add('dragging');
    }
};

window.handleTouchMove = function(e) {
    if (state.draggedIndex !== null) {
        e.preventDefault();
        const currentY = e.touches[0].clientY;
        const element = document.elementFromPoint(e.touches[0].clientX, currentY);
        if (element) {
            const targetCard = element.closest('.habit-item');
            if (targetCard && targetCard.dataset.index !== undefined) {
                const dropIndex = parseInt(targetCard.dataset.index, 10);
                if (dropIndex !== state.draggedIndex) {
                    const draggedItem = state.habits.splice(state.draggedIndex, 1)[0];
                    state.habits.splice(dropIndex, 0, draggedItem);
                    state.draggedIndex = dropIndex;
                    saveUserData();
                    renderHabitsList();
                }
            }
        }
    }
};

window.handleTouchEnd = function(e, index) {
    state.draggedIndex = null;
    const card = e.currentTarget;
    if (card && card.classList) card.classList.remove('dragging');
};

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
   Focus Stopwatch Custom Timer Duration Controls
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

window.setTimerDuration = function(seconds, btnElement) {
    pauseTimer();
    state.timer.totalSeconds = seconds;
    state.timer.secondsRemaining = seconds;
    updateTimerDisplay();

    if (btnElement) {
        document.querySelectorAll('.timer-preset-btn').forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');
    }
};

window.applyCustomTimerMins = function() {
    const input = document.getElementById('custom-timer-mins');
    if (!input || !input.value) return;
    const mins = parseInt(input.value, 10);
    if (mins > 0 && mins <= 480) {
        setTimerDuration(mins * 60, null);
        document.querySelectorAll('.timer-preset-btn').forEach(b => b.classList.remove('active'));
        alert(`⏱️ Timer set to ${mins} minutes!`);
    } else {
        alert('Please enter a valid duration between 1 and 480 minutes.');
    }
};

function updateTimerHabitSelect() {
    const select = document.getElementById('timer-habit-select');
    if (!select) return;
    select.innerHTML = '<option value="">-- General Deep Work Session (No Auto-Log) --</option>' +
        state.habits.map(h => `<option value="${h.id}">${escapeHtml(h.title)} (${h.domain})</option>`).join('');
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
    state.timer.secondsRemaining = state.timer.totalSeconds;
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

    const isLight = state.theme === 'light';
    const primaryColor = isLight ? '#0D9488' : '#00F5D4';
    const bgFill = isLight ? 'rgba(13, 148, 136, 0.25)' : 'rgba(0, 245, 212, 0.25)';
    const gridColor = isLight ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255, 255, 255, 0.08)';

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
                backgroundColor: bgFill,
                borderColor: primaryColor,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { r: { angleLines: { color: gridColor }, grid: { color: gridColor }, ticks: { display: false } } },
            plugins: { legend: { display: false } }
        }
    });
}

function renderAIInsights() {
    const container = document.getElementById('insights-container');
    if (!container) return;

    if (state.habits.length === 0) {
        container.innerHTML = `<div class="card glass-card text-muted">Create habits or load templates to unlock AI habit correlation insights.</div>`;
        return;
    }

    container.innerHTML = `
        <div class="glass-card" style="border-left: 4px solid var(--primary-indigo); padding: 20px; margin-bottom: 12px;">
            <span style="font-size: 0.72rem; font-weight: 700; color: var(--primary-indigo); text-transform: uppercase;">Active Habit Intelligence</span>
            <h4 style="margin: 6px 0;">Tracking ${state.habits.length} Custom Habits & Rituals</h4>
            <p style="font-size: 0.88rem; color: var(--text-muted);">PulseFlow AI v1.0 active. Your habits are synchronized and ready for daily tracking!</p>
        </div>
    `;
}

/* ==========================================================================
   Backup, Export & Reset
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
            let csv = "Habit Title,Domain,Frequency,Streak,Resiliency,Reminder,Completed Today\n";
            state.habits.forEach(h => {
                csv += `"${h.title}","${h.domain}","${h.frequency || ''}",${h.streak},${h.resiliency},"${h.reminderEnabled ? h.reminderTime : 'None'}",${h.completed}\n`;
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
            loadStarterTemplates();
        });
    }

    if (btnClear) {
        btnClear.addEventListener('click', () => {
            if (confirm('Reset all habit data for this account to 0?')) {
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

/* ==========================================================================
   Web Push Notifications Engine
   ========================================================================== */
function initNotificationEngine() {
    const btnRequest = document.getElementById('btn-request-notifications');
    if (btnRequest) {
        btnRequest.addEventListener('click', requestNotificationPermission);
    }

    if ('Notification' in window && Notification.permission === 'granted') {
        state.notificationsEnabled = true;
    }

    setInterval(checkScheduledReminders, 30000);
}

function requestNotificationPermission() {
    if (!('Notification' in window)) {
        alert('Browser notifications are not supported on this device.');
        return;
    }

    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            state.notificationsEnabled = true;
            alert('🔔 Reminders Enabled! You will receive daily habit notifications.');
            sendNotification('PulseFlow AI', 'Habit notifications enabled successfully!');
        } else {
            alert('Notification permission denied.');
        }
    });
}

function checkScheduledReminders() {
    if (!state.notificationsEnabled) return;

    const now = new Date();
    const currentHours = now.getHours().toString().padStart(2, '0');
    const currentMins = now.getMinutes().toString().padStart(2, '0');
    const timeStr = `${currentHours}:${currentMins}`;
    const todayStr = now.toISOString().split('T')[0];

    state.habits.forEach(habit => {
        if (habit.reminderEnabled && habit.reminderTime === timeStr && !habit.completed) {
            const key = `${todayStr}_${habit.id}_${timeStr}`;
            if (!state.lastNotified[key]) {
                state.lastNotified[key] = true;
                sendNotification(`🔔 Reminder: ${habit.title}`, `Target: ${habit.target} ${habit.unit}. Stay consistent!`);
            }
        }
    });
}

function sendNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body,
            icon: '../../brain/e63d389e-94e1-4e9d-9584-d11bde94b086/pulseflow_ios_icon_178535507958.jpg'
        });
    }
    playChimeSound();
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
