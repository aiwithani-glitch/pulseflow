# ⚡ PulseFlow AI: Habit & Productivity Intelligence Platform

PulseFlow AI is a high-performance, progressive habit tracker and productivity intelligence platform engineered for daily ritual tracking, focus timer blocks, life domain balance, and behavioral analytics.

![PulseFlow Preview](file:///C:/Users/patil/.gemini/antigravity/brain/e63d389e-94e1-4e9d-9584-d11bde94b086/pulseflow_ui_preview_1785358986344.jpg)

---

## 🌟 Core App Features

### 🎯 1. Habit & Ritual Tracking
* **9 Pre-Configured Starter Habits:** Pre-loaded with daily (Hydration 3L, Meditation 10m, No Negative Thoughts, Manifestation, Screen Time <3h), 6x/week (Zero Sugar, Reading), and 5x/week (Deep Work 4h, Workout) routines.
* **Fluid Touch & Mouse Drag-and-Drop Reordering (`⋮⋮`):** Hold down on the `⋮⋮` handle on your phone or computer to slide habits up and down into your preferred sequence.
* **Habit CRUD Engine:** Create, Edit (`✏️`), Delete (`🗑️`), and Check-Off (`✓`) habits with particle confetti celebrations.
* **Frequency Badging:** Clear visual indicators for Daily (7x/wk), 6x/week, and 5x/week targets.
* **Habit Resiliency & Strength Score:** Dynamic resiliency algorithm that decays on missed days and builds strength on consistent streaks.

### ⏱️ 2. Productivity Features
* **Focus Stopwatch & Pomodoro Timer:** 25-minute Pomodoro timer attached directly to habits (e.g. 4-Hour Deep Work Block). Features a Web Audio chime alert and auto-completes habit logs upon session completion.
* **365-Day Execution Intensity Heatmap Grid:** 364-cell annual heatmap (inspired by GitHub) visualizing daily completion intensity across the entire year.
* **Wheel of Life Domain Balance Chart:** Interactive 5-axis Chart.js radar chart assessing life domain balance across Health, Career, Mindfulness, Learning, and Finance.
* **1-Click Data Backup & Analytics Export:** Instant CSV spreadsheet export and JSON backup downloads for external productivity auditing.
* **Quick Inline & Modal Natural Language Capture:** Instant top input bar for adding habits on the fly.

### 🔔 3. Habit Reminders & Push Notifications
* **Native Web Notification Engine:** Schedule daily reminder notifications for any habit routine.
* **Custom Reminder Times:** Set precise notification times per habit (e.g. 8:00 AM Hydration, 9:00 PM Screen Time check).
* **In-App Toast Alerts & Browser Push:** Triggers browser notifications even when using the app as a saved mobile PWA on iPhone or Android!

### 🎨 4. Dual Light & Dark Fresh Color Themes
* **☀️ Fresh Light Mode:** Bright Emerald Teal (`#0D9488`), Vibrant Electric Blue (`#2563EB`), Coral Sunrise (`#F97316`), Crisp Porcelain background (`#F8FAFC`), and dark slate typography (`#0F172A`).
* **🌙 Obsidian Dark Mode:** Deep Midnight Obsidian (`#0B0F19`), Neon Cyan (`#06B6D4`), Glowing Violet (`#8B5CF6`), and glassmorphic translucent cards.
* **Instant Theme Toggle:** 1-tap theme switcher button in header, sidebar, and mobile menu.

---

## 🚀 How AI Insights Work on Vercel

When deploying to **Vercel** (or Netlify / Cloudflare Pages):

1. **Client-Side Intelligence (Default Zero-Cost Mode):** Analyzes `localStorage` logs in JS to calculate habit decay, domain balance scores, streak correlations, and energy triggers—**100% free with zero API key or server costs**.
2. **Serverless LLM AI API Integration:** You can add a Vercel Serverless Function (`/api/insights.js`) using the `ai` or `@google/generative-ai` SDK with your `GEMINI_API_KEY` stored securely in Vercel Environment Variables.

---

## 📱 Mobile PWA Installation

Open the live URL on your iPhone (Safari) or Android (Chrome), tap **Share / Menu**, and select **"Add to Home Screen"** to run PulseFlow AI as a native full-screen app!
