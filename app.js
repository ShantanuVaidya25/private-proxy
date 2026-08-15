/**
 * ATTENDFLOW - University Attendance & Timetable ERP Portal
 * Comprehensive University Grade Formula & Management
 */

(function () {
  'use strict';

  // --- Constants & Storage Keys ---
  const STORAGE_KEY = 'attendflow_university_v2';
  const OLD_STORAGE_KEY = 'attendflow_data_v1';
  const THEME_KEY = 'attendflow_theme_v1';
  const DEFAULT_TARGET = 75;

  const DAYS = [
    { key: 'mon', label: 'Monday' },
    { key: 'tue', label: 'Tuesday' },
    { key: 'wed', label: 'Wednesday' },
    { key: 'thu', label: 'Thursday' },
    { key: 'fri', label: 'Friday' },
    { key: 'sat', label: 'Saturday' }
  ];

  // --- Default University Sample Courses ---
  const DEFAULT_COURSES = [
    {
      id: 'sub_1',
      name: 'Data Structures & Algorithms',
      code: 'CS201',
      type: 'theory',
      faculty: 'Dr. A. Sharma',
      targetPercentage: 75,
      color: '#6366f1',
      baseAttended: 14,
      baseTotal: 16,
      timetable: [
        { day: 'mon', time: '09:00 AM - 10:00 AM' },
        { day: 'wed', time: '10:00 AM - 11:00 AM' },
        { day: 'fri', time: '11:00 AM - 12:00 PM' }
      ],
      logs: [
        { id: 'log_1_1', date: getRecentDateStr(2), status: 'present', timestamp: Date.now() - 172800000 },
        { id: 'log_1_2', date: getRecentDateStr(1), status: 'present', timestamp: Date.now() - 86400000 },
        { id: 'log_1_3', date: getRecentDateStr(0), status: 'present', timestamp: Date.now() }
      ],
      createdAt: Date.now() - 1000000
    },
    {
      id: 'sub_2',
      name: 'Computer Networks Lab',
      code: 'CS302L',
      type: 'lab',
      faculty: 'Prof. R. Mehta',
      targetPercentage: 80,
      color: '#a855f7',
      baseAttended: 8,
      baseTotal: 10,
      timetable: [
        { day: 'tue', time: '02:00 PM - 04:00 PM' },
        { day: 'thu', time: '02:00 PM - 04:00 PM' }
      ],
      logs: [
        { id: 'log_2_1', date: getRecentDateStr(3), status: 'present', timestamp: Date.now() - 259200000 },
        { id: 'log_2_2', date: getRecentDateStr(1), status: 'absent', timestamp: Date.now() - 86400000 }
      ],
      createdAt: Date.now() - 900000
    },
    {
      id: 'sub_3',
      name: 'Database Management Systems',
      code: 'CS204',
      type: 'theory',
      faculty: 'Dr. V. Rao',
      targetPercentage: 75,
      color: '#ec4899',
      baseAttended: 12,
      baseTotal: 15,
      timetable: [
        { day: 'mon', time: '11:00 AM - 12:00 PM' },
        { day: 'tue', time: '10:00 AM - 11:00 AM' },
        { day: 'thu', time: '09:00 AM - 10:00 AM' }
      ],
      logs: [
        { id: 'log_3_1', date: getRecentDateStr(2), status: 'od', timestamp: Date.now() - 172800000 },
        { id: 'log_3_2', date: getRecentDateStr(0), status: 'present', timestamp: Date.now() }
      ],
      createdAt: Date.now() - 800000
    }
  ];

  function getRecentDateStr(daysAgo) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  }

  // --- State ---
  let courses = loadCourses();
  let selectedColor = '#6366f1';
  let activeHistoryCourseId = null;

  // --- DOM Elements ---
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeSunIcon = document.getElementById('themeSunIcon');
  const themeMoonIcon = document.getElementById('themeMoonIcon');
  
  // Tabs
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabViews = {
    'dashboard': document.getElementById('view-dashboard'),
    'schedule': document.getElementById('view-schedule'),
    'subjects': document.getElementById('view-subjects'),
    'simulator': document.getElementById('view-simulator'),
    'timetable-builder': document.getElementById('view-timetable-builder')
  };

  // Dashboard Overview Elements
  const totalAttendedVal = document.getElementById('totalAttendedVal');
  const totalClassesVal = document.getElementById('totalClassesVal');
  const totalPercentageVal = document.getElementById('totalPercentageVal');
  const examEligibilityBadge = document.getElementById('examEligibilityBadge');
  const overallForecastBox = document.getElementById('overallForecastBox');
  const forecastIcon = document.getElementById('forecastIcon');
  const overallForecastText = document.getElementById('overallForecastText');
  const overallRadialBar = document.getElementById('overallRadialBar');
  const radialPercentageText = document.getElementById('radialPercentageText');
  const radialStatusLabel = document.getElementById('radialStatusLabel');
  
  const statTotalSubjects = document.getElementById('statTotalSubjects');
  const statTotalAttended = document.getElementById('statTotalAttended');
  const statTotalMissed = document.getElementById('statTotalMissed');
  const statTotalOD = document.getElementById('statTotalOD');

  // Schedule Views
  const dashboardTodayDateStr = document.getElementById('dashboardTodayDateStr');
  const dashboardSchedulePreview = document.getElementById('dashboardSchedulePreview');
  const scheduleViewDate = document.getElementById('scheduleViewDate');
  const fullScheduleGrid = document.getElementById('fullScheduleGrid');
  const markScheduleAllPresentBtn = document.getElementById('markScheduleAllPresentBtn');

  // Courses View
  const subjectsGrid = document.getElementById('subjectsGrid');
  const subjectSearchInput = document.getElementById('subjectSearchInput');
  const addSubjectBtn = document.getElementById('addSubjectBtn');
  const addSubjectNavBtn = document.getElementById('addSubjectNavBtn');

  // What-If Simulator
  const simSubjectSelect = document.getElementById('simSubjectSelect');
  const simBunkSlider = document.getElementById('simBunkSlider');
  const simBunkVal = document.getElementById('simBunkVal');
  const simAttendSlider = document.getElementById('simAttendSlider');
  const simAttendVal = document.getElementById('simAttendVal');
  const simPercentDisplay = document.getElementById('simPercentDisplay');
  const simStatusPill = document.getElementById('simStatusPill');
  const simExplanationText = document.getElementById('simExplanationText');
  const resetSimBtn = document.getElementById('resetSimBtn');

  // Timetable Setup
  const timetableSetupGrid = document.getElementById('timetableSetupGrid');
  const openAddSlotModalBtn = document.getElementById('openAddSlotModalBtn');
  const slotModalOverlay = document.getElementById('slotModalOverlay');
  const slotForm = document.getElementById('slotForm');
  const slotSubjectSelect = document.getElementById('slotSubjectSelect');
  const slotDaySelect = document.getElementById('slotDaySelect');
  const slotTimeInput = document.getElementById('slotTimeInput');
  const closeSlotModalBtn = document.getElementById('closeSlotModalBtn');
  const cancelSlotModalBtn = document.getElementById('cancelSlotModalBtn');

  // Course Modal
  const subjectModalOverlay = document.getElementById('subjectModalOverlay');
  const subjectModalTitle = document.getElementById('subjectModalTitle');
  const subjectForm = document.getElementById('subjectForm');
  const editSubjectId = document.getElementById('editSubjectId');
  const subjectNameInput = document.getElementById('subjectNameInput');
  const subjectCodeInput = document.getElementById('subjectCodeInput');
  const subjectTypeInput = document.getElementById('subjectTypeInput');
  const subjectFacultyInput = document.getElementById('subjectFacultyInput');
  const subjectTargetInput = document.getElementById('subjectTargetInput');
  const initialAttendedInput = document.getElementById('initialAttendedInput');
  const initialTotalInput = document.getElementById('initialTotalInput');
  const colorPickerGroup = document.getElementById('colorPickerGroup');
  const closeSubjectModalBtn = document.getElementById('closeSubjectModalBtn');
  const cancelSubjectModalBtn = document.getElementById('cancelSubjectModalBtn');

  // History Modal
  const historyModalOverlay = document.getElementById('historyModalOverlay');
  const historyModalSubjectTitle = document.getElementById('historyModalSubjectTitle');
  const historyModalSubjectCode = document.getElementById('historyModalSubjectCode');
  const historyFormulaDisplay = document.getElementById('historyFormulaDisplay');
  const historyTargetStatusBadge = document.getElementById('historyTargetStatusBadge');
  const historySubjectId = document.getElementById('historySubjectId');
  const addHistoryEntryForm = document.getElementById('addHistoryEntryForm');
  const historyEntryDate = document.getElementById('historyEntryDate');
  const historyEntryStatus = document.getElementById('historyEntryStatus');
  const historyEntriesList = document.getElementById('historyEntriesList');
  const historyLogCount = document.getElementById('historyLogCount');
  const clearAllLogsBtn = document.getElementById('clearAllLogsBtn');
  const closeHistoryModalBtn = document.getElementById('closeHistoryModalBtn');
  const closeHistoryBottomBtn = document.getElementById('closeHistoryBottomBtn');

  // Export / Import
  const exportDataBtn = document.getElementById('exportDataBtn');
  const importDataBtn = document.getElementById('importDataBtn');
  const importFileInput = document.getElementById('importFileInput');
  const toastContainer = document.getElementById('toastContainer');

  // --- Initialization ---
  function init() {
    initTheme();
    initDates();
    attachEventListeners();
    renderAll();
  }

  // --- Theme Management ---
  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcons(savedTheme);
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    updateThemeIcons(newTheme);
    showToast(`Switched to ${newTheme} mode`, 'info');
  }

  function updateThemeIcons(theme) {
    if (theme === 'dark') {
      themeSunIcon.style.display = 'block';
      themeMoonIcon.style.display = 'none';
    } else {
      themeSunIcon.style.display = 'none';
      themeMoonIcon.style.display = 'block';
    }
  }

  // --- Dates Setup ---
  function initDates() {
    const today = new Date().toISOString().split('T')[0];
    scheduleViewDate.value = today;
    historyEntryDate.value = today;
    
    const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    dashboardTodayDateStr.textContent = dayName;
  }

  // --- Storage Management ---
  function loadCourses() {
    try {
      const v2Data = localStorage.getItem(STORAGE_KEY);
      if (v2Data) return JSON.parse(v2Data);

      // Check migration from v1
      const v1Data = localStorage.getItem(OLD_STORAGE_KEY);
      if (v1Data) {
        const parsedV1 = JSON.parse(v1Data);
        return parsedV1.map(sub => ({
          ...sub,
          type: sub.type || 'theory',
          faculty: sub.faculty || 'Professor',
          timetable: sub.timetable || []
        }));
      }
    } catch (e) {
      console.error('Failed to load courses from storage:', e);
    }
    return DEFAULT_COURSES;
  }

  function saveCourses() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
      showToast('Error saving data', 'danger');
    }
  }

  // --- Tab Navigation ---
  window.switchTab = function(tabName) {
    tabButtons.forEach(btn => {
      if (btn.getAttribute('data-tab') === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    Object.keys(tabViews).forEach(key => {
      if (key === tabName && tabViews[key]) {
        tabViews[key].classList.add('active');
      } else if (tabViews[key]) {
        tabViews[key].classList.remove('active');
      }
    });

    if (tabName === 'simulator') {
      populateSimulatorSelect();
      updateSimulatorResults();
    } else if (tabName === 'timetable-builder') {
      renderTimetableBuilder();
    } else if (tabName === 'schedule') {
      renderFullSchedule();
    }
  };

  // --- University Attendance Math Engine ---
  /**
   * Calculates subject stats taking into account:
   * - Course weight (e.g. Theory = 1, Lab = 2)
   * - University statuses: present (+weight, +weight), od (+weight, +weight), absent (0, +weight), cancelled (0, 0)
   */
  function calculateCourseStats(course) {
    const weight = course.type === 'lab' ? 2 : 1;
    const logs = course.logs || [];

    let logAttended = 0;
    let logTotal = 0;
    let logOD = 0;
    let logMissed = 0;
    let logCancelled = 0;

    logs.forEach(log => {
      if (log.status === 'present') {
        logAttended += weight;
        logTotal += weight;
      } else if (log.status === 'od') {
        logAttended += weight;
        logTotal += weight;
        logOD += weight;
      } else if (log.status === 'absent') {
        logTotal += weight;
        logMissed += weight;
      } else if (log.status === 'cancelled') {
        logCancelled += weight;
      }
    });

    const attended = (Number(course.baseAttended) || 0) + logAttended;
    const total = (Number(course.baseTotal) || 0) + logTotal;
    const target = Number(course.targetPercentage) || DEFAULT_TARGET;

    const percentage = total > 0 ? (attended / total) * 100 : 0;
    const formattedPercentage = total > 0 ? percentage.toFixed(1) : '0.0';

    // Exam Eligibility / Safety Status
    let status = 'safe';
    let examStatus = 'Eligible for Exams';

    if (total === 0) {
      status = 'safe';
      examStatus = 'No Records Yet';
    } else if (percentage >= target) {
      status = 'safe';
      examStatus = 'Exam Eligible';
    } else if (percentage >= 65) {
      status = 'warning';
      examStatus = 'Condonation Zone (65-74%)';
    } else {
      status = 'danger';
      examStatus = 'Debarred / Defaulter (<65%)';
    }

    // Forecast Calculation
    let forecast = '';
    let bunkCount = 0;
    let attendNeeded = 0;

    if (total === 0) {
      forecast = 'No classes conducted yet.';
    } else if (percentage >= target) {
      const tRatio = target / 100;
      bunkCount = Math.floor((attended / tRatio) - total);
      if (bunkCount <= 0) {
        forecast = `On track at ${formattedPercentage}%! Don't miss next class.`;
      } else {
        forecast = `Safe to bunk ${bunkCount} class${bunkCount > 1 ? 'es' : ''} without falling below ${target}%.`;
      }
    } else {
      const tRatio = target / 100;
      attendNeeded = Math.ceil(((tRatio * total) - attended) / (1 - tRatio));
      if (attendNeeded <= 0) attendNeeded = 1;
      forecast = `Must attend next ${attendNeeded} consecutive class${attendNeeded > 1 ? 'es' : ''} to reach ${target}%.`;
    }

    return {
      attended,
      total,
      missed: total - attended,
      od: logOD,
      cancelled: logCancelled,
      target,
      percentage,
      formattedPercentage,
      status,
      examStatus,
      forecast,
      bunkCount,
      attendNeeded,
      weight
    };
  }

  /**
   * Overall University Attendance Aggregate
   */
  function calculateOverallStats() {
    let totalAttended = 0;
    let totalClasses = 0;
    let totalOD = 0;

    courses.forEach(course => {
      const stats = calculateCourseStats(course);
      totalAttended += stats.attended;
      totalClasses += stats.total;
      totalOD += stats.od;
    });

    const totalMissed = totalClasses - totalAttended;
    const percentage = totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 0;
    const formattedPercentage = totalClasses > 0 ? percentage.toFixed(1) : '0.0';

    let status = 'safe';
    let examStatus = 'Eligible for Exams';
    let icon = '🎯';
    let forecast = '';

    if (courses.length === 0) {
      examStatus = 'No Courses';
      forecast = 'Click "+ Add Course" to configure your semester subjects.';
    } else if (totalClasses === 0) {
      examStatus = 'Semester Start';
      forecast = 'Mark attendance from today\'s timetable to monitor progress.';
    } else if (percentage >= DEFAULT_TARGET) {
      status = 'safe';
      examStatus = 'Exam Eligible (Safe)';
      icon = '🎓';
      const tRatio = DEFAULT_TARGET / 100;
      const bunks = Math.floor((totalAttended / tRatio) - totalClasses);
      if (bunks <= 0) {
        forecast = `Good standing (${formattedPercentage}%)! Attend upcoming classes to stay above ${DEFAULT_TARGET}%.`;
      } else {
        forecast = `Excellent! You can safely miss up to ${bunks} lecture${bunks > 1 ? 's' : ''} across courses.`;
      }
    } else if (percentage >= 65) {
      status = 'warning';
      examStatus = 'Condonation Fine Zone';
      icon = '⚠️';
      const tRatio = DEFAULT_TARGET / 100;
      const needed = Math.ceil(((tRatio * totalClasses) - totalAttended) / (1 - tRatio));
      forecast = `Warning: ${formattedPercentage}% is below 75%. Attend next ${needed} classes to clear fine list.`;
    } else {
      status = 'danger';
      examStatus = 'Debarred / Defaulter';
      icon = '🚨';
      const tRatio = DEFAULT_TARGET / 100;
      const needed = Math.ceil(((tRatio * totalClasses) - totalAttended) / (1 - tRatio));
      forecast = `Critical Defaulter! You must attend ${needed} more classes to be permitted for semester exams.`;
    }

    return {
      totalAttended,
      totalClasses,
      totalMissed,
      totalOD,
      percentage,
      formattedPercentage,
      status,
      examStatus,
      forecast,
      icon,
      courseCount: courses.length
    };
  }

  // --- Rendering UI ---
  function renderAll() {
    renderOverallDashboard();
    renderDashboardSchedulePreview();
    renderFullSchedule();
    renderSubjectsGrid();
    renderTimetableBuilder();
    populateSimulatorSelect();
    updateSimulatorResults();
  }

  function renderOverallDashboard() {
    const stats = calculateOverallStats();

    totalAttendedVal.textContent = stats.totalAttended;
    totalClassesVal.textContent = stats.totalClasses;
    totalPercentageVal.textContent = `${stats.formattedPercentage}%`;

    // Exam Badge
    examEligibilityBadge.className = `exam-status-badge ${stats.status}`;
    examEligibilityBadge.textContent = stats.examStatus;

    // Forecast Box
    overallForecastBox.className = `forecast-box ${stats.status}`;
    forecastIcon.textContent = stats.icon;
    overallForecastText.textContent = stats.forecast;

    // Radial Progress
    const radius = 55;
    const circumference = 2 * Math.PI * radius; // ~345.57
    overallRadialBar.style.strokeDasharray = `${circumference}`;
    const offset = stats.totalClasses > 0 
      ? circumference - (circumference * (stats.percentage / 100))
      : circumference;
    overallRadialBar.style.strokeDashoffset = offset;
    overallRadialBar.className = `radial-bar ${stats.status}`;
    radialPercentageText.textContent = `${Math.round(stats.percentage)}%`;

    if (stats.totalClasses === 0) radialStatusLabel.textContent = 'No Data';
    else if (stats.status === 'safe') radialStatusLabel.textContent = 'Eligible';
    else if (stats.status === 'warning') radialStatusLabel.textContent = 'Warning';
    else radialStatusLabel.textContent = 'Debarred';

    statTotalSubjects.textContent = stats.courseCount;
    statTotalAttended.textContent = stats.totalAttended;
    statTotalMissed.textContent = stats.totalMissed;
    statTotalOD.textContent = stats.totalOD;
  }

  /**
   * Returns list of scheduled slots for a given date.
   */
  function getScheduledSlotsForDate(dateStr) {
    const dateObj = new Date(dateStr + 'T00:00:00');
    const dayIndex = dateObj.getDay(); // 0 = Sun, 1 = Mon ...
    const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const currentDayKey = dayKeys[dayIndex];

    const slots = [];
    courses.forEach(course => {
      (course.timetable || []).forEach(slot => {
        if (slot.day === currentDayKey) {
          slots.push({
            course: course,
            time: slot.time || 'General Slot'
          });
        }
      });
    });

    // If no timetable slots configured for today, return all courses as daily roster
    if (slots.length === 0) {
      courses.forEach(course => {
        slots.push({
          course: course,
          time: course.type === 'lab' ? 'Practical Session' : 'Theory Lecture'
        });
      });
    }

    return slots;
  }

  function renderDashboardSchedulePreview() {
    const today = new Date().toISOString().split('T')[0];
    const slots = getScheduledSlotsForDate(today);
    dashboardSchedulePreview.innerHTML = '';

    if (slots.length === 0) {
      dashboardSchedulePreview.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted);">
          No lectures scheduled for today. Enjoy your day or add slots in the Timetable Setup tab!
        </div>
      `;
      return;
    }

    slots.forEach(item => {
      const card = createScheduleSlotCard(item.course, item.time, today);
      dashboardSchedulePreview.appendChild(card);
    });
  }

  function renderFullSchedule() {
    const selectedDate = scheduleViewDate.value || new Date().toISOString().split('T')[0];
    const slots = getScheduledSlotsForDate(selectedDate);
    fullScheduleGrid.innerHTML = '';

    if (slots.length === 0) {
      fullScheduleGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted);">
          No classes found for this date.
        </div>
      `;
      return;
    }

    slots.forEach(item => {
      const card = createScheduleSlotCard(item.course, item.time, selectedDate);
      fullScheduleGrid.appendChild(card);
    });
  }

  function createScheduleSlotCard(course, timeStr, dateStr) {
    const stats = calculateCourseStats(course);
    const existingLog = (course.logs || []).find(l => l.date === dateStr);
    const status = existingLog ? existingLog.status : null;

    const card = document.createElement('div');
    card.className = 'schedule-card';

    card.innerHTML = `
      <div class="schedule-card-top">
        <span class="schedule-time-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          ${escapeHtml(timeStr)}
        </span>
        <span class="course-type-pill ${course.type || 'theory'}">${course.type === 'lab' ? 'Lab (2 Cr)' : 'Theory'}</span>
      </div>

      <div>
        <div class="schedule-subject-name" style="color: ${course.color || 'var(--text-primary)'}">
          ${course.code ? `[${escapeHtml(course.code)}] ` : ''}${escapeHtml(course.name)}
        </div>
        <div class="schedule-faculty-name">${escapeHtml(course.faculty || 'Faculty')} &bull; Status: ${stats.attended}/${stats.total} (${stats.formattedPercentage}%)</div>
      </div>

      <div class="schedule-actions-row">
        <button class="status-btn present ${status === 'present' ? 'active' : ''}" data-action="status" data-status="present" data-id="${course.id}" data-date="${dateStr}">
          ✓ Present
        </button>
        <button class="status-btn absent ${status === 'absent' ? 'active' : ''}" data-action="status" data-status="absent" data-id="${course.id}" data-date="${dateStr}">
          ✕ Absent
        </button>
        <button class="status-btn od ${status === 'od' ? 'active' : ''}" data-action="status" data-status="od" data-id="${course.id}" data-date="${dateStr}" title="On Duty / Medical Leave">
          ★ OD / Med
        </button>
        <button class="status-btn cancelled ${status === 'cancelled' ? 'active' : ''}" data-action="status" data-status="cancelled" data-id="${course.id}" data-date="${dateStr}" title="Class Cancelled (No Penalty)">
          ⊘ Cancelled
        </button>
      </div>
    `;

    return card;
  }

  function renderSubjectsGrid() {
    const query = (subjectSearchInput.value || '').trim().toLowerCase();
    subjectsGrid.innerHTML = '';

    const filtered = courses.filter(c => {
      return c.name.toLowerCase().includes(query) || (c.code && c.code.toLowerCase().includes(query));
    });

    if (filtered.length === 0) {
      subjectsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 2px dashed var(--border-color);">
          <h3>No courses found</h3>
          <p style="color: var(--text-secondary); margin-top: 0.5rem;">Click "+ Add Course" to register courses in your semester.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(course => {
      const stats = calculateCourseStats(course);
      const progressWidth = Math.min(100, Math.max(0, stats.percentage));
      const targetPercent = course.targetPercentage || DEFAULT_TARGET;

      const card = document.createElement('div');
      card.className = 'subject-card';
      card.style.setProperty('--subject-accent', course.color || 'var(--primary)');

      card.innerHTML = `
        <div class="subject-card-accent-bar"></div>

        <div class="subject-card-top">
          <div class="subject-meta">
            <div class="subject-badge-line">
              ${course.code ? `<span style="font-size:0.7rem; font-weight:800; color:var(--subject-accent);">${escapeHtml(course.code)}</span>` : ''}
              <span class="course-type-pill ${course.type || 'theory'}">${course.type === 'lab' ? 'Lab / Practical' : 'Theory'}</span>
            </div>
            <h4 class="subject-title">${escapeHtml(course.name)}</h4>
            <span style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(course.faculty || 'Faculty')}</span>
          </div>

          <div style="display:flex; gap:0.25rem;">
            <button class="card-action-btn" data-action="edit" data-id="${course.id}" title="Edit Course">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="card-action-btn delete-btn" data-action="delete" data-id="${course.id}" title="Delete Course">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>

        <div class="subject-formula-display">
          <div class="subject-fraction">
            <span class="subject-fraction-attended">${stats.attended}</span>
            <span style="opacity:0.6;">/</span>
            <span>${stats.total}</span>
            <span style="font-size:0.75rem; color:var(--text-muted);">classes</span>
          </div>
          <div class="subject-percent-badge ${stats.status}">
            <span>${stats.formattedPercentage}%</span>
          </div>
        </div>

        <div class="progress-track">
          <div class="progress-fill ${stats.status}" style="width: ${progressWidth}%;"></div>
          <div class="target-indicator" style="left: ${targetPercent}%;" data-target-text="${targetPercent}%"></div>
        </div>

        <div class="subject-advice ${stats.status}">
          <span>${stats.status === 'safe' ? '✓' : '⚠️'}</span>
          <span>${stats.forecast}</span>
        </div>

        <div class="subject-card-actions">
          <button class="status-btn present" data-action="quick-status" data-status="present" data-id="${course.id}">+ Present</button>
          <button class="status-btn absent" data-action="quick-status" data-status="absent" data-id="${course.id}">+ Absent</button>
          <button class="status-btn od" data-action="quick-status" data-status="od" data-id="${course.id}">+ OD</button>
          <button class="status-btn" data-action="open-history" data-id="${course.id}" style="background:var(--bg-input);">Logs</button>
        </div>
      `;

      subjectsGrid.appendChild(card);
    });
  }

  // --- What-If Bunk Simulator Engine ---
  function populateSimulatorSelect() {
    simSubjectSelect.innerHTML = '';
    courses.forEach(course => {
      const opt = document.createElement('option');
      opt.value = course.id;
      opt.textContent = `${course.name} (${course.code || 'Course'})`;
      simSubjectSelect.appendChild(opt);
    });
  }

  function updateSimulatorResults() {
    const subjectId = simSubjectSelect.value;
    const course = courses.find(c => c.id === subjectId);
    if (!course) return;

    const stats = calculateCourseStats(course);
    const bunksToSimulate = parseInt(simBunkSlider.value) || 0;
    const attendToSimulate = parseInt(simAttendSlider.value) || 0;

    simBunkVal.textContent = `${bunksToSimulate} class${bunksToSimulate !== 1 ? 'es' : ''}`;
    simAttendVal.textContent = `${attendToSimulate} class${attendToSimulate !== 1 ? 'es' : ''}`;

    const simAttended = stats.attended + attendToSimulate;
    const simTotal = stats.total + bunksToSimulate + attendToSimulate;
    const simPercent = simTotal > 0 ? (simAttended / simTotal) * 100 : 0;
    const formattedSim = simTotal > 0 ? simPercent.toFixed(1) : '0.0';

    simPercentDisplay.textContent = `${formattedSim}%`;

    const target = course.targetPercentage || DEFAULT_TARGET;
    if (simPercent >= target) {
      simPercentDisplay.style.color = 'var(--success)';
      simStatusPill.className = 'sim-status-pill';
      simStatusPill.style.background = 'var(--success-bg)';
      simStatusPill.style.color = 'var(--success)';
      simStatusPill.textContent = 'Exam Eligible (Safe)';
      simExplanationText.textContent = `If you miss ${bunksToSimulate} and attend ${attendToSimulate} classes, your attendance remains at ${formattedSim}%, above ${target}%.`;
    } else if (simPercent >= 65) {
      simPercentDisplay.style.color = 'var(--warning)';
      simStatusPill.className = 'sim-status-pill';
      simStatusPill.style.background = 'var(--warning-bg)';
      simStatusPill.style.color = 'var(--warning)';
      simStatusPill.textContent = 'Condonation Zone (Fine Required)';
      simExplanationText.textContent = `Warning: Missing ${bunksToSimulate} classes drops you to ${formattedSim}%. You would need special dean approval or medical cert.`;
    } else {
      simPercentDisplay.style.color = 'var(--danger)';
      simStatusPill.className = 'sim-status-pill';
      simStatusPill.style.background = 'var(--danger-bg)';
      simStatusPill.style.color = 'var(--danger)';
      simStatusPill.textContent = 'Debarred from Exam!';
      simExplanationText.textContent = `Critical: Attendance drops to ${formattedSim}%. You will be debarred from semester exams!`;
    }
  }

  // --- Weekly Timetable Builder ---
  function renderTimetableBuilder() {
    timetableSetupGrid.innerHTML = '';

    DAYS.forEach(day => {
      const col = document.createElement('div');
      col.className = 'day-column';

      col.innerHTML = `
        <div class="day-column-header">
          <span>${day.label}</span>
          <span style="font-size:0.75rem; color:var(--text-muted);">${day.key.toUpperCase()}</span>
        </div>
        <div class="day-slots-list" id="day-list-${day.key}"></div>
      `;

      timetableSetupGrid.appendChild(col);
      const listContainer = col.querySelector('.day-slots-list');

      let hasSlots = false;
      courses.forEach(course => {
        (course.timetable || []).forEach((slot, slotIndex) => {
          if (slot.day === day.key) {
            hasSlots = true;
            const slotItem = document.createElement('div');
            slotItem.className = 'slot-item';
            slotItem.innerHTML = `
              <div style="font-weight:700; color:${course.color || 'var(--text-primary)'}; padding-right: 18px;">
                ${escapeHtml(course.name)}
              </div>
              <div style="font-size:0.72rem; color:var(--text-secondary);">${escapeHtml(slot.time)}</div>
              <button class="slot-delete-btn" data-action="delete-slot" data-course-id="${course.id}" data-slot-index="${slotIndex}" title="Remove Slot">&times;</button>
            `;
            listContainer.appendChild(slotItem);
          }
        });
      });

      if (!hasSlots) {
        listContainer.innerHTML = `<div style="font-size:0.75rem; color:var(--text-muted); text-align:center; padding:1rem;">No classes</div>`;
      }
    });
  }

  // --- Attendance Record Action ---
  function recordAttendance(courseId, dateStr, status) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    if (!course.logs) course.logs = [];

    const existingIndex = course.logs.findIndex(l => l.date === dateStr);

    if (existingIndex >= 0) {
      if (course.logs[existingIndex].status === status) {
        course.logs.splice(existingIndex, 1);
        showToast(`Cleared record for ${course.name} on ${formatDate(dateStr)}`, 'info');
      } else {
        course.logs[existingIndex].status = status;
        course.logs[existingIndex].timestamp = Date.now();
        showToast(`Marked ${status.toUpperCase()} for ${course.name}`, 'success');
      }
    } else {
      course.logs.unshift({
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        date: dateStr,
        status: status,
        timestamp: Date.now()
      });
      showToast(`Marked ${status.toUpperCase()} for ${course.name} on ${formatDate(dateStr)}`, 'success');
    }

    saveCourses();
    renderAll();
    if (activeHistoryCourseId === courseId) {
      renderHistoryModal(courseId);
    }
  }

  function markAllSchedulePresent() {
    const selectedDate = scheduleViewDate.value || new Date().toISOString().split('T')[0];
    const slots = getScheduledSlotsForDate(selectedDate);
    
    slots.forEach(slot => {
      const course = slot.course;
      if (!course.logs) course.logs = [];
      const existing = course.logs.find(l => l.date === selectedDate);
      if (existing) existing.status = 'present';
      else {
        course.logs.unshift({
          id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          date: selectedDate,
          status: 'present',
          timestamp: Date.now()
        });
      }
    });

    saveCourses();
    renderAll();
    showToast(`Marked all scheduled classes present for ${formatDate(selectedDate)}!`, 'success');
  }

  // --- Modals Logic ---
  function openAddCourseModal() {
    subjectModalTitle.textContent = 'Add Course / Practical';
    editSubjectId.value = '';
    subjectForm.reset();
    subjectTargetInput.value = '75';
    selectedColor = '#6366f1';
    updateColorSelection('#6366f1');
    subjectModalOverlay.classList.add('active');
    subjectNameInput.focus();
  }

  function openEditCourseModal(courseId) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    subjectModalTitle.textContent = 'Edit Course';
    editSubjectId.value = course.id;
    subjectNameInput.value = course.name;
    subjectCodeInput.value = course.code || '';
    subjectTypeInput.value = course.type || 'theory';
    subjectFacultyInput.value = course.faculty || '';
    subjectTargetInput.value = course.targetPercentage || 75;
    initialAttendedInput.value = course.baseAttended || 0;
    initialTotalInput.value = course.baseTotal || 0;

    selectedColor = course.color || '#6366f1';
    updateColorSelection(selectedColor);
    subjectModalOverlay.classList.add('active');
  }

  function closeCourseModal() {
    subjectModalOverlay.classList.remove('active');
    subjectForm.reset();
  }

  function updateColorSelection(hex) {
    colorPickerGroup.querySelectorAll('.color-option').forEach(opt => {
      if (opt.getAttribute('data-color') === hex) opt.classList.add('selected');
      else opt.classList.remove('selected');
    });
  }

  function handleCourseFormSubmit(e) {
    e.preventDefault();
    const name = subjectNameInput.value.trim();
    const code = subjectCodeInput.value.trim();
    const type = subjectTypeInput.value;
    const faculty = subjectFacultyInput.value.trim();
    const target = Math.max(1, Math.min(100, parseInt(subjectTargetInput.value) || 75));
    const baseAttended = Math.max(0, parseInt(initialAttendedInput.value) || 0);
    const baseTotal = Math.max(baseAttended, parseInt(initialTotalInput.value) || 0);
    const id = editSubjectId.value;

    if (!name) return;

    if (id) {
      const idx = courses.findIndex(c => c.id === id);
      if (idx >= 0) {
        courses[idx].name = name;
        courses[idx].code = code;
        courses[idx].type = type;
        courses[idx].faculty = faculty;
        courses[idx].targetPercentage = target;
        courses[idx].baseAttended = baseAttended;
        courses[idx].baseTotal = baseTotal;
        courses[idx].color = selectedColor;
        showToast(`Updated "${name}"`, 'success');
      }
    } else {
      courses.push({
        id: 'sub_' + Date.now(),
        name,
        code,
        type,
        faculty,
        targetPercentage: target,
        color: selectedColor,
        baseAttended,
        baseTotal,
        timetable: [],
        logs: [],
        createdAt: Date.now()
      });
      showToast(`Added "${name}"`, 'success');
    }

    saveCourses();
    closeCourseModal();
    renderAll();
  }

  function deleteCourse(courseId) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    if (confirm(`Delete course "${course.name}" and all records?`)) {
      courses = courses.filter(c => c.id !== courseId);
      saveCourses();
      renderAll();
      showToast(`Deleted "${course.name}"`, 'info');
    }
  }

  // --- Slot Modal Logic ---
  function openAddSlotModal() {
    slotSubjectSelect.innerHTML = '';
    courses.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.name} (${c.code || 'Course'})`;
      slotSubjectSelect.appendChild(opt);
    });
    slotModalOverlay.classList.add('active');
  }

  function closeSlotModal() {
    slotModalOverlay.classList.remove('active');
  }

  function handleSlotFormSubmit(e) {
    e.preventDefault();
    const courseId = slotSubjectSelect.value;
    const day = slotDaySelect.value;
    const time = slotTimeInput.value.trim();

    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    if (!course.timetable) course.timetable = [];
    course.timetable.push({ day, time });

    saveCourses();
    closeSlotModal();
    renderAll();
    showToast(`Added timetable slot for ${course.name}`, 'success');
  }

  function deleteSlot(courseId, slotIndex) {
    const course = courses.find(c => c.id === courseId);
    if (!course || !course.timetable) return;

    course.timetable.splice(slotIndex, 1);
    saveCourses();
    renderAll();
    showToast('Removed timetable slot', 'info');
  }

  // --- History Modal Logic ---
  function openHistoryModal(courseId) {
    activeHistoryCourseId = courseId;
    renderHistoryModal(courseId);
    historyModalOverlay.classList.add('active');
  }

  function closeHistoryModal() {
    historyModalOverlay.classList.remove('active');
    activeHistoryCourseId = null;
  }

  function renderHistoryModal(courseId) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const stats = calculateCourseStats(course);
    historySubjectId.value = course.id;
    historyModalSubjectTitle.textContent = course.name;
    historyModalSubjectCode.textContent = `${course.code || ''} &bull; ${course.faculty || 'Faculty'}`;
    historyFormulaDisplay.textContent = `${stats.attended} / ${stats.total} = ${stats.formattedPercentage}%`;

    historyTargetStatusBadge.className = `subject-percent-badge ${stats.status}`;
    historyTargetStatusBadge.textContent = `${stats.formattedPercentage}% (${stats.examStatus})`;

    const logs = [...(course.logs || [])].sort((a, b) => b.date.localeCompare(a.date));
    historyLogCount.textContent = logs.length;
    historyEntriesList.innerHTML = '';

    if (logs.length === 0) {
      historyEntriesList.innerHTML = `<div style="text-align:center; padding:1.5rem; color:var(--text-muted); font-size:0.85rem;">No lecture dates recorded yet.</div>`;
      return;
    }

    logs.forEach(log => {
      const item = document.createElement('div');
      item.className = 'history-entry-item';

      let statusLabel = log.status.toUpperCase();
      if (log.status === 'od') statusLabel = 'ON DUTY';
      if (log.status === 'cancelled') statusLabel = 'CANCELLED';

      item.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.65rem;">
          <span class="entry-badge ${log.status}">${statusLabel}</span>
          <span style="font-weight:700;">${formatDate(log.date)}</span>
          <span style="font-size:0.75rem; color:var(--text-muted);">${log.date}</span>
        </div>
        <button class="entry-delete-btn" data-action="delete-log" data-log-id="${log.id}" title="Delete Record">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      `;

      historyEntriesList.appendChild(item);
    });
  }

  function handleAddHistoryEntry(e) {
    e.preventDefault();
    const courseId = historySubjectId.value;
    const dateStr = historyEntryDate.value;
    const status = historyEntryStatus.value;
    if (!courseId || !dateStr) return;
    recordAttendance(courseId, dateStr, status);
  }

  function deleteHistoryLogEntry(logId) {
    const course = courses.find(c => c.id === activeHistoryCourseId);
    if (!course || !course.logs) return;
    course.logs = course.logs.filter(l => l.id !== logId);
    saveCourses();
    renderAll();
    renderHistoryModal(course.id);
    showToast('Deleted log entry', 'info');
  }

  function clearAllLogs() {
    const course = courses.find(c => c.id === activeHistoryCourseId);
    if (!course) return;
    if (confirm(`Clear all lecture records for "${course.name}"?`)) {
      course.logs = [];
      saveCourses();
      renderAll();
      renderHistoryModal(course.id);
      showToast('Cleared logs', 'info');
    }
  }

  // --- Export / Import ---
  function exportBackupData() {
    const exportPayload = {
      app: 'AttendFlow-University',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      courses: courses
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `attendflow_uni_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('University backup JSON exported!', 'success');
  }

  function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const imported = JSON.parse(event.target.result);
        const dataList = imported.courses || imported.subjects || (Array.isArray(imported) ? imported : null);
        if (dataList) {
          courses = dataList.map(c => ({
            ...c,
            type: c.type || 'theory',
            faculty: c.faculty || 'Professor',
            timetable: c.timetable || []
          }));
          saveCourses();
          renderAll();
          showToast(`Restored ${courses.length} courses!`, 'success');
        }
      } catch (err) {
        showToast('Failed to import JSON backup.', 'danger');
      }
      importFileInput.value = '';
    };
    reader.readAsText(file);
  }

  // --- Event Listeners ---
  function attachEventListeners() {
    themeToggleBtn.addEventListener('click', toggleTheme);

    // Tab buttons
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        switchTab(tab);
      });
    });

    // Modals
    addSubjectBtn.addEventListener('click', openAddCourseModal);
    addSubjectNavBtn.addEventListener('click', openAddCourseModal);
    closeSubjectModalBtn.addEventListener('click', closeCourseModal);
    cancelSubjectModalBtn.addEventListener('click', closeCourseModal);
    subjectForm.addEventListener('submit', handleCourseFormSubmit);

    openAddSlotModalBtn.addEventListener('click', openAddSlotModal);
    closeSlotModalBtn.addEventListener('click', closeSlotModal);
    cancelSlotModalBtn.addEventListener('click', closeSlotModal);
    slotForm.addEventListener('submit', handleSlotFormSubmit);

    // Color picker
    colorPickerGroup.addEventListener('click', e => {
      const opt = e.target.closest('.color-option');
      if (!opt) return;
      selectedColor = opt.getAttribute('data-color');
      updateColorSelection(selectedColor);
    });

    // Schedule actions
    scheduleViewDate.addEventListener('change', renderFullSchedule);
    markScheduleAllPresentBtn.addEventListener('click', markAllSchedulePresent);

    // Search
    subjectSearchInput.addEventListener('input', renderSubjectsGrid);

    // Simulator
    simSubjectSelect.addEventListener('change', updateSimulatorResults);
    simBunkSlider.addEventListener('input', updateSimulatorResults);
    simAttendSlider.addEventListener('input', updateSimulatorResults);
    resetSimBtn.addEventListener('click', () => {
      simBunkSlider.value = 0;
      simAttendSlider.value = 0;
      updateSimulatorResults();
    });

    // Delegate status buttons on schedule
    document.addEventListener('click', e => {
      const statusBtn = e.target.closest('button[data-action="status"]');
      const quickStatusBtn = e.target.closest('button[data-action="quick-status"]');
      const openHistoryBtn = e.target.closest('button[data-action="open-history"]');
      const editBtn = e.target.closest('button[data-action="edit"]');
      const deleteBtn = e.target.closest('button[data-action="delete"]');
      const deleteSlotBtn = e.target.closest('button[data-action="delete-slot"]');

      if (statusBtn) {
        const courseId = statusBtn.getAttribute('data-id');
        const status = statusBtn.getAttribute('data-status');
        const dateStr = statusBtn.getAttribute('data-date');
        recordAttendance(courseId, dateStr, status);
      } else if (quickStatusBtn) {
        const courseId = quickStatusBtn.getAttribute('data-id');
        const status = quickStatusBtn.getAttribute('data-status');
        const today = new Date().toISOString().split('T')[0];
        recordAttendance(courseId, today, status);
      } else if (openHistoryBtn) {
        const courseId = openHistoryBtn.getAttribute('data-id');
        openHistoryModal(courseId);
      } else if (editBtn) {
        const courseId = editBtn.getAttribute('data-id');
        openEditCourseModal(courseId);
      } else if (deleteBtn) {
        const courseId = deleteBtn.getAttribute('data-id');
        deleteCourse(courseId);
      } else if (deleteSlotBtn) {
        const courseId = deleteSlotBtn.getAttribute('data-course-id');
        const slotIdx = parseInt(deleteSlotBtn.getAttribute('data-slot-index'));
        deleteSlot(courseId, slotIdx);
      }
    });

    // History Modal events
    closeHistoryModalBtn.addEventListener('click', closeHistoryModal);
    closeHistoryBottomBtn.addEventListener('click', closeHistoryModal);
    addHistoryEntryForm.addEventListener('submit', handleAddHistoryEntry);
    clearAllLogsBtn.addEventListener('click', clearAllLogs);

    historyEntriesList.addEventListener('click', e => {
      const delBtn = e.target.closest('button[data-action="delete-log"]');
      if (delBtn) {
        const logId = delBtn.getAttribute('data-log-id');
        deleteHistoryLogEntry(logId);
      }
    });

    // Backdrop clicks
    subjectModalOverlay.addEventListener('click', e => { if (e.target === subjectModalOverlay) closeCourseModal(); });
    slotModalOverlay.addEventListener('click', e => { if (e.target === slotModalOverlay) closeSlotModal(); });
    historyModalOverlay.addEventListener('click', e => { if (e.target === historyModalOverlay) closeHistoryModal(); });

    // Export / Import
    exportDataBtn.addEventListener('click', exportBackupData);
    importDataBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', handleImportFile);

    // Escape Key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeCourseModal();
        closeSlotModal();
        closeHistoryModal();
      }
    });
  }

  // --- Utilities ---
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const date = new Date(parts[0], parts[1] - 1, parts[2]);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch (e) {}
    return dateStr;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Start ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
