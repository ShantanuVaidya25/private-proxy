/**
 * ATTENDFLOW - Smart Manual Attendance Tracking Engine
 * Formula: no. of classes attended / total classes = attendance %
 */

(function () {
  'use strict';

  // --- Constants & Storage Keys ---
  const STORAGE_KEY = 'attendflow_data_v1';
  const THEME_KEY = 'attendflow_theme_v1';
  const DEFAULT_TARGET = 75;

  // --- Default Sample Subjects for First Load ---
  const DEFAULT_SUBJECTS = [
    {
      id: 'sub_1',
      name: 'Data Structures & Algorithms',
      code: 'CS201',
      targetPercentage: 75,
      color: '#6366f1',
      baseAttended: 12,
      baseTotal: 15,
      logs: [
        { id: 'log_1_1', date: getRecentDateStr(2), status: 'present', timestamp: Date.now() - 172800000 },
        { id: 'log_1_2', date: getRecentDateStr(1), status: 'present', timestamp: Date.now() - 86400000 },
        { id: 'log_1_3', date: getRecentDateStr(0), status: 'present', timestamp: Date.now() }
      ],
      createdAt: Date.now() - 1000000
    },
    {
      id: 'sub_2',
      name: 'Computer Networks',
      code: 'CS302',
      targetPercentage: 75,
      color: '#06b6d4',
      baseAttended: 8,
      baseTotal: 12,
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
      targetPercentage: 80,
      color: '#ec4899',
      baseAttended: 14,
      baseTotal: 16,
      logs: [
        { id: 'log_3_1', date: getRecentDateStr(2), status: 'present', timestamp: Date.now() - 172800000 },
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
  let subjects = loadSubjects();
  let selectedSubjectColor = '#6366f1';
  let activeHistorySubjectId = null;

  // --- DOM Elements ---
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeSunIcon = document.getElementById('themeSunIcon');
  const themeMoonIcon = document.getElementById('themeMoonIcon');
  
  const totalAttendedVal = document.getElementById('totalAttendedVal');
  const totalClassesVal = document.getElementById('totalClassesVal');
  const totalPercentageVal = document.getElementById('totalPercentageVal');
  const targetThresholdBadge = document.getElementById('targetThresholdBadge');
  const overallForecastBox = document.getElementById('overallForecastBox');
  const forecastIcon = document.getElementById('forecastIcon');
  const overallForecastText = document.getElementById('overallForecastText');
  
  const overallRadialBar = document.getElementById('overallRadialBar');
  const radialPercentageText = document.getElementById('radialPercentageText');
  const radialStatusLabel = document.getElementById('radialStatusLabel');
  
  const statTotalSubjects = document.getElementById('statTotalSubjects');
  const statTotalAttended = document.getElementById('statTotalAttended');
  const statTotalMissed = document.getElementById('statTotalMissed');

  const dailyAttendanceDate = document.getElementById('dailyAttendanceDate');
  const dailyChecklistContainer = document.getElementById('dailyChecklistContainer');
  const markAllPresentBtn = document.getElementById('markAllPresentBtn');

  const subjectsGrid = document.getElementById('subjectsGrid');
  const subjectSearchInput = document.getElementById('subjectSearchInput');
  const addSubjectBtn = document.getElementById('addSubjectBtn');
  const addSubjectNavBtn = document.getElementById('addSubjectNavBtn');

  // Subject Modal
  const subjectModalOverlay = document.getElementById('subjectModalOverlay');
  const subjectModalTitle = document.getElementById('subjectModalTitle');
  const subjectForm = document.getElementById('subjectForm');
  const editSubjectId = document.getElementById('editSubjectId');
  const subjectNameInput = document.getElementById('subjectNameInput');
  const subjectCodeInput = document.getElementById('subjectCodeInput');
  const subjectTargetInput = document.getElementById('subjectTargetInput');
  const initialCountsRow = document.getElementById('initialCountsRow');
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

  // Backup & Restore
  const exportDataBtn = document.getElementById('exportDataBtn');
  const importDataBtn = document.getElementById('importDataBtn');
  const importFileInput = document.getElementById('importFileInput');
  const toastContainer = document.getElementById('toastContainer');

  // --- Initialization ---
  function init() {
    initTheme();
    initDatePicker();
    attachEventListeners();
    renderAll();
  }

  // --- Theme Handling ---
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

  // --- Date Picker Defaults ---
  function initDatePicker() {
    const today = new Date().toISOString().split('T')[0];
    dailyAttendanceDate.value = today;
    historyEntryDate.value = today;
  }

  // --- Storage Functions ---
  function loadSubjects() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to parse stored subjects:', e);
    }
    return DEFAULT_SUBJECTS;
  }

  function saveSubjects() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
    } catch (e) {
      console.error('Failed to save subjects to localStorage:', e);
      showToast('Error saving data to local storage', 'danger');
    }
  }

  // --- Attendance Calculation Engine ---
  /**
   * Calculates attended count, total count, percentage, and forecast for a subject.
   */
  function calculateSubjectStats(subject) {
    const logs = subject.logs || [];
    const logAttended = logs.filter(l => l.status === 'present').length;
    const logAbsent = logs.filter(l => l.status === 'absent').length;

    const attended = (Number(subject.baseAttended) || 0) + logAttended;
    const total = (Number(subject.baseTotal) || 0) + logAttended + logAbsent;
    const target = Number(subject.targetPercentage) || DEFAULT_TARGET;

    let percentage = 0;
    if (total > 0) {
      percentage = (attended / total) * 100;
    }

    const formattedPercentage = total > 0 ? percentage.toFixed(1) : '0.0';

    // Status: safe, warning, danger
    let status = 'safe';
    if (total === 0) {
      status = 'safe';
    } else if (percentage >= target) {
      status = 'safe';
    } else if (percentage >= target - 10) {
      status = 'warning';
    } else {
      status = 'danger';
    }

    // Forecast Calculation
    let forecast = '';
    let bunkCount = 0;
    let attendNeeded = 0;

    if (total === 0) {
      forecast = 'No classes recorded yet. Start tracking today!';
    } else if (percentage >= target) {
      // Formula: attended / (total + x) >= target/100
      // x = floor(attended / (target/100) - total)
      const tRatio = target / 100;
      bunkCount = Math.floor((attended / tRatio) - total);
      if (bunkCount <= 0) {
        forecast = `On track at ${formattedPercentage}%! Attend next class to maintain target.`;
      } else {
        forecast = `You can safely miss ${bunkCount} class${bunkCount > 1 ? 'es' : ''} and maintain ≥ ${target}%.`;
      }
    } else {
      // Formula: (attended + y) / (total + y) >= target/100
      // y = ceil((target/100 * total - attended) / (1 - target/100))
      const tRatio = target / 100;
      attendNeeded = Math.ceil(((tRatio * total) - attended) / (1 - tRatio));
      if (attendNeeded <= 0) attendNeeded = 1;
      forecast = `Must attend next ${attendNeeded} consecutive class${attendNeeded > 1 ? 'es' : ''} to reach ${target}%.`;
    }

    return {
      attended,
      total,
      missed: total - attended,
      target,
      percentage,
      formattedPercentage,
      status,
      forecast,
      bunkCount,
      attendNeeded
    };
  }

  /**
   * Calculates overall attendance metrics across all subjects.
   */
  function calculateOverallStats() {
    let totalAttended = 0;
    let totalClasses = 0;

    subjects.forEach(subject => {
      const stats = calculateSubjectStats(subject);
      totalAttended += stats.attended;
      totalClasses += stats.total;
    });

    const totalMissed = totalClasses - totalAttended;
    const percentage = totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 0;
    const formattedPercentage = totalClasses > 0 ? percentage.toFixed(1) : '0.0';

    let status = 'safe';
    if (totalClasses === 0) {
      status = 'safe';
    } else if (percentage >= DEFAULT_TARGET) {
      status = 'safe';
    } else if (percentage >= DEFAULT_TARGET - 10) {
      status = 'warning';
    } else {
      status = 'danger';
    }

    // Overall recommendation
    let forecast = '';
    let icon = '🎯';

    if (subjects.length === 0) {
      forecast = 'Click "+ Add Subject" to start tracking your attendance.';
      icon = '📋';
    } else if (totalClasses === 0) {
      forecast = 'Mark your first lecture attendance below to view live predictions.';
      icon = '💡';
    } else if (percentage >= DEFAULT_TARGET) {
      const tRatio = DEFAULT_TARGET / 100;
      const bunks = Math.floor((totalAttended / tRatio) - totalClasses);
      icon = '🎉';
      if (bunks <= 0) {
        forecast = `Great job! Your attendance is ${formattedPercentage}%. Attend upcoming lectures to stay above ${DEFAULT_TARGET}%.`;
      } else {
        forecast = `Excellent! You are safely above target. You can bunk ${bunks} total lecture${bunks > 1 ? 's' : ''} across subjects.`;
      }
    } else {
      const tRatio = DEFAULT_TARGET / 100;
      const needed = Math.ceil(((tRatio * totalClasses) - totalAttended) / (1 - tRatio));
      icon = '⚠️';
      forecast = `Below target! You need to attend ${needed} more class${needed > 1 ? 'es' : ''} consecutively to reach ${DEFAULT_TARGET}%.`;
    }

    return {
      totalAttended,
      totalClasses,
      totalMissed,
      percentage,
      formattedPercentage,
      status,
      forecast,
      icon,
      subjectCount: subjects.length
    };
  }

  // --- Rendering UI ---
  function renderAll() {
    renderOverallDashboard();
    renderDailyChecklist();
    renderSubjectsGrid();
  }

  function renderOverallDashboard() {
    const stats = calculateOverallStats();

    // Equation Formula Box
    totalAttendedVal.textContent = stats.totalAttended;
    totalClassesVal.textContent = stats.totalClasses;
    totalPercentageVal.textContent = `${stats.formattedPercentage}%`;

    // Forecast Box
    overallForecastBox.className = `forecast-box ${stats.status}`;
    forecastIcon.textContent = stats.icon;
    overallForecastText.textContent = stats.forecast;

    // Radial Progress Indicator
    // Circumference of r=55 is 2 * PI * 55 ≈ 345.57 -> svg viewBox 140x140 with r=55 circumference = 345.57
    const radius = 55;
    const circumference = 2 * Math.PI * radius; // ~345.57
    overallRadialBar.style.strokeDasharray = `${circumference}`;
    
    const offset = stats.totalClasses > 0 
      ? circumference - (circumference * (stats.percentage / 100))
      : circumference;
    
    overallRadialBar.style.strokeDashoffset = offset;
    overallRadialBar.className = `radial-bar ${stats.status}`;
    radialPercentageText.textContent = `${Math.round(stats.percentage)}%`;

    if (stats.totalClasses === 0) {
      radialStatusLabel.textContent = 'No Data';
    } else if (stats.status === 'safe') {
      radialStatusLabel.textContent = 'Safe Zone';
    } else if (stats.status === 'warning') {
      radialStatusLabel.textContent = 'Warning';
    } else {
      radialStatusLabel.textContent = 'Critical';
    }

    // Quick Stats Row
    statTotalSubjects.textContent = stats.subjectCount;
    statTotalAttended.textContent = stats.totalAttended;
    statTotalMissed.textContent = stats.totalMissed;
  }

  /**
   * Renders the quick daily check-in panel for the selected date.
   */
  function renderDailyChecklist() {
    const selectedDate = dailyAttendanceDate.value || new Date().toISOString().split('T')[0];
    dailyChecklistContainer.innerHTML = '';

    if (subjects.length === 0) {
      dailyChecklistContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 1.5rem; color: var(--text-muted); font-size: 0.9rem;">
          No subjects added yet. Add a subject below to mark daily attendance.
        </div>
      `;
      return;
    }

    subjects.forEach(subject => {
      const stats = calculateSubjectStats(subject);
      const existingLog = (subject.logs || []).find(l => l.date === selectedDate);

      const isPresent = existingLog && existingLog.status === 'present';
      const isAbsent = existingLog && existingLog.status === 'absent';

      const card = document.createElement('div');
      card.className = 'daily-item-card';

      card.innerHTML = `
        <div class="daily-subject-info">
          <div class="daily-subject-name" title="${escapeHtml(subject.name)}" style="color: ${subject.color || 'var(--text-primary)'}">
            ${subject.code ? `<span style="font-size:0.75rem; opacity:0.85;">[${escapeHtml(subject.code)}]</span> ` : ''}${escapeHtml(subject.name)}
          </div>
          <div class="daily-subject-stats">
            Current: <strong>${stats.attended}/${stats.total}</strong> (${stats.formattedPercentage}%)
          </div>
        </div>

        <div class="daily-checkbox-group">
          <label class="attend-check-btn ${isPresent ? 'checked' : ''}" title="Mark Attended (Present)">
            <input type="checkbox" data-subject-id="${subject.id}" data-action="toggle-present" ${isPresent ? 'checked' : ''}>
            <span class="checkbox-indicator">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </span>
            <span>Attended</span>
          </label>

          <button type="button" class="quick-absent-btn ${isAbsent ? 'active' : ''}" data-subject-id="${subject.id}" data-action="toggle-absent" title="Mark Missed (Absent)">
            ${isAbsent ? '✕ Absent' : 'Absent'}
          </button>
        </div>
      `;

      dailyChecklistContainer.appendChild(card);
    });
  }

  /**
   * Renders the main subject cards grid.
   */
  function renderSubjectsGrid() {
    const searchQuery = (subjectSearchInput.value || '').trim().toLowerCase();
    subjectsGrid.innerHTML = '';

    const filteredSubjects = subjects.filter(sub => {
      const nameMatch = sub.name.toLowerCase().includes(searchQuery);
      const codeMatch = sub.code ? sub.code.toLowerCase().includes(searchQuery) : false;
      return nameMatch || codeMatch;
    });

    if (filteredSubjects.length === 0) {
      subjectsGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h3>${searchQuery ? 'No matching subjects found' : 'No subjects tracked yet'}</h3>
          <p style="color: var(--text-secondary); max-width: 400px; font-size: 0.9rem;">
            ${searchQuery ? 'Try searching with a different subject name or code.' : 'Add your subjects (like Math, Physics, CS) to track lectures, set attendance goals, and prevent low attendance.'}
          </p>
          <button id="emptyAddBtn" class="btn btn-primary" style="margin-top: 0.5rem;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Add Your First Subject</span>
          </button>
        </div>
      `;

      const emptyAddBtn = document.getElementById('emptyAddBtn');
      if (emptyAddBtn) {
        emptyAddBtn.addEventListener('click', openAddSubjectModal);
      }
      return;
    }

    filteredSubjects.forEach(subject => {
      const stats = calculateSubjectStats(subject);
      const progressWidth = Math.min(100, Math.max(0, stats.percentage));
      const targetPercent = subject.targetPercentage || DEFAULT_TARGET;

      const card = document.createElement('div');
      card.className = 'subject-card';
      card.style.setProperty('--subject-accent', subject.color || 'var(--primary)');

      card.innerHTML = `
        <div class="subject-card-accent-bar"></div>

        <div class="subject-card-top">
          <div class="subject-meta">
            ${subject.code ? `<span class="subject-code-badge">${escapeHtml(subject.code)}</span>` : ''}
            <h4 class="subject-title" title="${escapeHtml(subject.name)}">${escapeHtml(subject.name)}</h4>
          </div>
          <div class="subject-menu">
            <button class="card-action-btn" data-action="edit" data-id="${subject.id}" title="Edit Subject" aria-label="Edit Subject">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="card-action-btn delete-btn" data-action="delete" data-id="${subject.id}" title="Delete Subject" aria-label="Delete Subject">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Formula display fraction & percent -->
        <div class="subject-formula-display">
          <div class="subject-fraction">
            <span class="subject-fraction-attended">${stats.attended}</span>
            <span style="opacity: 0.6;">/</span>
            <span class="subject-fraction-total">${stats.total}</span>
            <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 0.25rem;">classes</span>
          </div>
          <div class="subject-percent-badge ${stats.status}">
            <span>${stats.formattedPercentage}%</span>
          </div>
        </div>

        <!-- Progress Bar with Target Marker Line -->
        <div class="progress-container">
          <div class="progress-track">
            <div class="progress-fill ${stats.status}" style="width: ${progressWidth}%;"></div>
            <div class="target-indicator" style="left: ${targetPercent}%;" data-target-text="${targetPercent}%"></div>
          </div>
        </div>

        <!-- Status Advice / Bunk Forecast -->
        <div class="subject-advice ${stats.status}">
          <span>${stats.status === 'safe' ? '✓' : stats.status === 'warning' ? '⚠️' : '✕'}</span>
          <span>${stats.forecast}</span>
        </div>

        <!-- Quick 1-Tap Attendance Actions -->
        <div class="subject-card-actions">
          <button class="btn-action-present" data-action="quick-present" data-id="${subject.id}" title="Attended lecture today (+1 Attended, +1 Total)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>+ Present</span>
          </button>
          
          <button class="btn-action-absent" data-action="quick-absent" data-id="${subject.id}" title="Missed lecture today (+1 Total)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            <span>+ Absent</span>
          </button>

          <button class="btn-action-history" data-action="open-history" data-id="${subject.id}" title="View Date Logs & History">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Logs</span>
          </button>
        </div>
      `;

      subjectsGrid.appendChild(card);
    });
  }

  // --- Attendance Logging Operations ---

  /**
   * Records or toggles attendance for a subject on a specified date.
   */
  function recordAttendanceForDate(subjectId, dateStr, status) {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    if (!subject.logs) subject.logs = [];

    const existingIndex = subject.logs.findIndex(l => l.date === dateStr);

    if (existingIndex >= 0) {
      if (subject.logs[existingIndex].status === status) {
        // If same status clicked again, remove it (toggle off)
        subject.logs.splice(existingIndex, 1);
        showToast(`Removed log for ${subject.name} on ${formatDate(dateStr)}`, 'info');
      } else {
        // Change status
        subject.logs[existingIndex].status = status;
        subject.logs[existingIndex].timestamp = Date.now();
        showToast(`Updated to ${status.toUpperCase()} for ${subject.name}`, 'success');
      }
    } else {
      // Add new log entry
      subject.logs.unshift({
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        date: dateStr,
        status: status,
        timestamp: Date.now()
      });
      showToast(`Marked ${status.toUpperCase()} for ${subject.name} on ${formatDate(dateStr)}`, 'success');
    }

    saveSubjects();
    renderAll();
    if (activeHistorySubjectId === subjectId) {
      renderHistoryModal(subjectId);
    }
  }

  /**
   * Mark all subjects present for the selected date.
   */
  function markAllPresentForSelectedDate() {
    const selectedDate = dailyAttendanceDate.value || new Date().toISOString().split('T')[0];
    if (subjects.length === 0) {
      showToast('No subjects to mark.', 'warning');
      return;
    }

    subjects.forEach(subject => {
      if (!subject.logs) subject.logs = [];
      const existingIndex = subject.logs.findIndex(l => l.date === selectedDate);
      if (existingIndex >= 0) {
        subject.logs[existingIndex].status = 'present';
      } else {
        subject.logs.unshift({
          id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          date: selectedDate,
          status: 'present',
          timestamp: Date.now()
        });
      }
    });

    saveSubjects();
    renderAll();
    showToast(`Marked all present for ${formatDate(selectedDate)}!`, 'success');
  }

  // --- Modals Logic ---

  function openAddSubjectModal() {
    subjectModalTitle.textContent = 'Add New Subject';
    editSubjectId.value = '';
    subjectForm.reset();
    subjectTargetInput.value = '75';
    initialCountsRow.style.display = 'grid';
    selectedSubjectColor = '#6366f1';
    updateColorPickerSelection('#6366f1');
    subjectModalOverlay.classList.add('active');
    subjectNameInput.focus();
  }

  function openEditSubjectModal(subjectId) {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    subjectModalTitle.textContent = 'Edit Subject';
    editSubjectId.value = subject.id;
    subjectNameInput.value = subject.name;
    subjectCodeInput.value = subject.code || '';
    subjectTargetInput.value = subject.targetPercentage || 75;
    
    // In edit mode, allow adjusting base counts
    initialCountsRow.style.display = 'grid';
    initialAttendedInput.value = subject.baseAttended || 0;
    initialTotalInput.value = subject.baseTotal || 0;
    
    selectedSubjectColor = subject.color || '#6366f1';
    updateColorPickerSelection(selectedSubjectColor);

    subjectModalOverlay.classList.add('active');
  }

  function closeSubjectModal() {
    subjectModalOverlay.classList.remove('active');
    subjectForm.reset();
  }

  function updateColorPickerSelection(colorHex) {
    const options = colorPickerGroup.querySelectorAll('.color-option');
    options.forEach(opt => {
      if (opt.getAttribute('data-color') === colorHex) {
        opt.classList.add('selected');
      } else {
        opt.classList.remove('selected');
      }
    });
  }

  function handleSubjectFormSubmit(e) {
    e.preventDefault();
    const name = subjectNameInput.value.trim();
    const code = subjectCodeInput.value.trim();
    const target = Math.max(1, Math.min(100, parseInt(subjectTargetInput.value) || 75));
    const baseAttended = Math.max(0, parseInt(initialAttendedInput.value) || 0);
    const baseTotal = Math.max(baseAttended, parseInt(initialTotalInput.value) || 0);
    const id = editSubjectId.value;

    if (!name) {
      showToast('Please enter a subject name', 'danger');
      return;
    }

    if (id) {
      // Edit existing
      const index = subjects.findIndex(s => s.id === id);
      if (index >= 0) {
        subjects[index].name = name;
        subjects[index].code = code;
        subjects[index].targetPercentage = target;
        subjects[index].baseAttended = baseAttended;
        subjects[index].baseTotal = baseTotal;
        subjects[index].color = selectedSubjectColor;
        showToast(`Updated "${name}"`, 'success');
      }
    } else {
      // Add new
      const newSubject = {
        id: 'sub_' + Date.now(),
        name,
        code,
        targetPercentage: target,
        color: selectedSubjectColor,
        baseAttended,
        baseTotal,
        logs: [],
        createdAt: Date.now()
      };
      subjects.push(newSubject);
      showToast(`Added "${name}"`, 'success');
    }

    saveSubjects();
    closeSubjectModal();
    renderAll();
  }

  function deleteSubject(subjectId) {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    if (confirm(`Are you sure you want to delete "${subject.name}" and all its lecture records?`)) {
      subjects = subjects.filter(s => s.id !== subjectId);
      saveSubjects();
      renderAll();
      showToast(`Deleted "${subject.name}"`, 'info');
    }
  }

  // --- History & Date Log Modal Logic ---

  function openHistoryModal(subjectId) {
    activeHistorySubjectId = subjectId;
    renderHistoryModal(subjectId);
    historyModalOverlay.classList.add('active');
  }

  function closeHistoryModal() {
    historyModalOverlay.classList.remove('active');
    activeHistorySubjectId = null;
  }

  function renderHistoryModal(subjectId) {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const stats = calculateSubjectStats(subject);
    historySubjectId.value = subject.id;
    historyModalSubjectTitle.textContent = subject.name;
    historyModalSubjectCode.textContent = subject.code ? `Code: ${subject.code}` : '';
    historyFormulaDisplay.textContent = `${stats.attended} / ${stats.total} = ${stats.formattedPercentage}%`;

    historyTargetStatusBadge.className = `subject-percent-badge ${stats.status}`;
    historyTargetStatusBadge.textContent = `${stats.formattedPercentage}% (Target: ${stats.target}%)`;

    const logs = [...(subject.logs || [])].sort((a, b) => b.date.localeCompare(a.date));
    historyLogCount.textContent = logs.length;
    historyEntriesList.innerHTML = '';

    if (logs.length === 0) {
      historyEntriesList.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.85rem;">
          No date logs recorded yet for this subject. Use the form above to add a lecture date!
        </div>
      `;
      return;
    }

    logs.forEach(log => {
      const item = document.createElement('div');
      item.className = 'history-entry-item';

      item.innerHTML = `
        <div class="entry-date-wrap">
          <span class="entry-badge ${log.status}">${log.status}</span>
          <span style="font-weight: 700;">${formatDate(log.date)}</span>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${log.date}</span>
        </div>
        <div>
          <button class="entry-delete-btn" data-action="delete-log" data-log-id="${log.id}" title="Delete this date entry" aria-label="Delete log">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;

      historyEntriesList.appendChild(item);
    });
  }

  function handleAddHistoryEntry(e) {
    e.preventDefault();
    const subjectId = historySubjectId.value;
    const dateStr = historyEntryDate.value;
    const status = historyEntryStatus.value;

    if (!subjectId || !dateStr) return;

    recordAttendanceForDate(subjectId, dateStr, status);
  }

  function deleteHistoryLogEntry(logId) {
    const subject = subjects.find(s => s.id === activeHistorySubjectId);
    if (!subject || !subject.logs) return;

    subject.logs = subject.logs.filter(l => l.id !== logId);
    saveSubjects();
    renderAll();
    renderHistoryModal(subject.id);
    showToast('Deleted log entry', 'info');
  }

  function clearAllLogsForSubject() {
    const subject = subjects.find(s => s.id === activeHistorySubjectId);
    if (!subject) return;

    if (confirm(`Clear all lecture date logs for "${subject.name}"? (Base counts will be preserved)`)) {
      subject.logs = [];
      saveSubjects();
      renderAll();
      renderHistoryModal(subject.id);
      showToast('Cleared all date logs for ' + subject.name, 'info');
    }
  }

  // --- Export & Import Backup ---

  function exportBackupData() {
    const exportPayload = {
      app: 'AttendFlow',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      subjects: subjects
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `attendflow_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('Backup JSON downloaded successfully!', 'success');
  }

  function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported && Array.isArray(imported.subjects)) {
          subjects = imported.subjects;
          saveSubjects();
          renderAll();
          showToast(`Successfully restored ${subjects.length} subjects!`, 'success');
        } else if (Array.isArray(imported)) {
          subjects = imported;
          saveSubjects();
          renderAll();
          showToast(`Successfully restored ${subjects.length} subjects!`, 'success');
        } else {
          showToast('Invalid backup file format.', 'danger');
        }
      } catch (err) {
        console.error('Error parsing import JSON:', err);
        showToast('Failed to import JSON file.', 'danger');
      }
      importFileInput.value = '';
    };
    reader.readAsText(file);
  }

  // --- Event Listeners Attachment ---

  function attachEventListeners() {
    // Theme toggle
    themeToggleBtn.addEventListener('click', toggleTheme);

    // Add subject modals
    addSubjectBtn.addEventListener('click', openAddSubjectModal);
    addSubjectNavBtn.addEventListener('click', openAddSubjectModal);
    closeSubjectModalBtn.addEventListener('click', closeSubjectModal);
    cancelSubjectModalBtn.addEventListener('click', closeSubjectModal);
    subjectForm.addEventListener('submit', handleSubjectFormSubmit);

    // Color picker
    colorPickerGroup.addEventListener('click', (e) => {
      const target = e.target.closest('.color-option');
      if (!target) return;
      selectedSubjectColor = target.getAttribute('data-color');
      updateColorPickerSelection(selectedSubjectColor);
    });

    // Subject search
    subjectSearchInput.addEventListener('input', renderSubjectsGrid);

    // Daily checklist date change
    dailyAttendanceDate.addEventListener('change', renderDailyChecklist);
    markAllPresentBtn.addEventListener('click', markAllPresentForSelectedDate);

    // Daily checklist interactions (delegation)
    dailyChecklistContainer.addEventListener('click', (e) => {
      const togglePresentLabel = e.target.closest('label.attend-check-btn');
      const absentBtn = e.target.closest('button[data-action="toggle-absent"]');

      const selectedDate = dailyAttendanceDate.value || new Date().toISOString().split('T')[0];

      if (togglePresentLabel) {
        const checkbox = togglePresentLabel.querySelector('input[type="checkbox"]');
        const subjectId = checkbox.getAttribute('data-subject-id');
        recordAttendanceForDate(subjectId, selectedDate, 'present');
      } else if (absentBtn) {
        const subjectId = absentBtn.getAttribute('data-subject-id');
        recordAttendanceForDate(subjectId, selectedDate, 'absent');
      }
    });

    // Subjects Grid Card Interactions (delegation)
    subjectsGrid.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      const action = target.getAttribute('data-action');
      const subjectId = target.getAttribute('data-id');
      const today = new Date().toISOString().split('T')[0];

      if (action === 'quick-present') {
        recordAttendanceForDate(subjectId, today, 'present');
      } else if (action === 'quick-absent') {
        recordAttendanceForDate(subjectId, today, 'absent');
      } else if (action === 'open-history') {
        openHistoryModal(subjectId);
      } else if (action === 'edit') {
        openEditSubjectModal(subjectId);
      } else if (action === 'delete') {
        deleteSubject(subjectId);
      }
    });

    // History Modal Interactions
    closeHistoryModalBtn.addEventListener('click', closeHistoryModal);
    closeHistoryBottomBtn.addEventListener('click', closeHistoryModal);
    addHistoryEntryForm.addEventListener('submit', handleAddHistoryEntry);
    clearAllLogsBtn.addEventListener('click', clearAllLogsForSubject);

    historyEntriesList.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('[data-action="delete-log"]');
      if (deleteBtn) {
        const logId = deleteBtn.getAttribute('data-log-id');
        deleteHistoryLogEntry(logId);
      }
    });

    // Overlay backdrop clicks
    subjectModalOverlay.addEventListener('click', (e) => {
      if (e.target === subjectModalOverlay) closeSubjectModal();
    });
    historyModalOverlay.addEventListener('click', (e) => {
      if (e.target === historyModalOverlay) closeHistoryModal();
    });

    // Export & Import
    exportDataBtn.addEventListener('click', exportBackupData);
    importDataBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', handleImportFile);

    // Keyboard Escape to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeSubjectModal();
        closeHistoryModal();
      }
    });
  }

  // --- Helper Utilities ---

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--success);"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'danger') {
      iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--danger);"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    } else {
      iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--primary);"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }

    toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
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

  // --- Start App on DOM Ready ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
