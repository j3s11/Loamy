import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Sprout,
  Plus,
  RotateCcw,
  Layers,
  ThermometerSnowflake,
  Compass,
  Clock
} from 'lucide-react';
import {
  MONTHLY_CLAY_PROFILES,
  getCurrentUkMonthIndex,
  getMonthlyClayChecklist,
  calculateChecklistProgress
} from '../utils/monthlyClayChecklist';
import { getDynamicFortnightlyCareSchedule } from '../utils/hadstonMasterGuide';

const STORAGE_KEY_MONTHLY_CHECKS = 'ngws_monthly_clay_checklist_v1';
const STORAGE_KEY_CUSTOM_MONTHLY_TASKS = 'ngws_custom_monthly_clay_tasks_v1';

const CATEGORY_LABELS = {
  ALL: 'All Tasks',
  PRIORITY_SEASONAL: 'Priority Seasonal',
  SOIL_CARE: 'Clay & Drainage',
  PROTECTION: 'Frost & Wind',
  SOWING_PLANTING: 'Sowing & Planting',
  PRUNING: 'Pruning',
  PEST_DISEASE: 'Pest & Disease'
};

const PRIORITY_DOT_COLORS = {
  PRIORITY: 'bg-emerald-700',
  ESSENTIAL: 'bg-amber-600',
  RECOMMENDED: 'bg-emerald-600',
  TIMELY: 'bg-sky-600'
};

const PRIORITY_TEXT_COLORS = {
  PRIORITY: 'text-emerald-800 font-bold',
  ESSENTIAL: 'text-amber-800 font-bold',
  RECOMMENDED: 'text-emerald-800 font-semibold',
  TIMELY: 'text-sky-800 font-semibold'
};

function stripMarkdownFormatting(text) {
  if (!text) return '';
  return String(text).replace(/\*/g, '');
}

/**
 * @param {{
 *   plantInventory?: Array<any>;
 *   seasonalTasks?: Array<{ taskTitle: string; category: string; targetPlants?: string[]; instructions: string }>;
 *   completedSeasonalTasks?: Record<string, boolean>;
 *   onToggleSeasonalTask?: (taskTitle: string) => void;
 *   alertsLastUpdatedLabel?: string;
 * }} props
 */
export default function MonthlyClayChecklistPanel({
  plantInventory = [],
  seasonalTasks = [],
  completedSeasonalTasks = {},
  onToggleSeasonalTask,
  alertsLastUpdatedLabel = ''
} = {}) {
  const currentUkMonthIdx = useMemo(() => getCurrentUkMonthIndex(new Date()), []);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(currentUkMonthIdx);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const isSecondHalfOfMonth = useMemo(() => new Date().getDate() >= 15, []);
  const [fortnightView, setFortnightView] = useState(() =>
    isSecondHalfOfMonth ? 'WEEKS_3_4' : 'WEEKS_1_2'
  );
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  const isCurrentMonthSelected = selectedMonthIdx === currentUkMonthIdx;

  // When switching months, default to showing active fortnight on current month or both on other months
  const handleSelectMonth = (monthIdx) => {
    setSelectedMonthIdx(monthIdx);
    if (monthIdx === currentUkMonthIdx) {
      setFortnightView(isSecondHalfOfMonth ? 'WEEKS_3_4' : 'WEEKS_1_2');
    } else {
      setFortnightView('BOTH');
    }
  };

  const [completedMap, setCompletedMap] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MONTHLY_CHECKS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [customTasksByMonth, setCustomTasksByMonth] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_MONTHLY_TASKS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [customForm, setCustomForm] = useState({
    title: '',
    category: 'SOIL_CARE',
    priority: 'RECOMMENDED',
    rhsGuidance: '',
    claySoilTip: '',
    targetWindowUk: 'This Month'
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MONTHLY_CHECKS, JSON.stringify(completedMap));
    } catch (err) {
      console.warn('[MonthlyClayChecklist] Failed to persist checklist state:', err);
    }
  }, [completedMap]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_MONTHLY_TASKS, JSON.stringify(customTasksByMonth));
    } catch (err) {
      console.warn('[MonthlyClayChecklist] Failed to persist custom tasks:', err);
    }
  }, [customTasksByMonth]);

  const monthProfile = useMemo(
    () => getMonthlyClayChecklist(selectedMonthIdx),
    [selectedMonthIdx]
  );

  const monthFortnightSchedule = useMemo(
    () => getDynamicFortnightlyCareSchedule(selectedMonthIdx, plantInventory),
    [selectedMonthIdx, plantInventory]
  );

  // Build unified task list merging Priority Seasonal Tasks + Monthly Clay Soil & Drainage Tasks
  const unifiedTasks = useMemo(() => {
    const items = [];

    // 1. Include Priority Seasonal Tasks
    seasonalTasks.forEach((sTask, idx) => {
      const rawCat = String(sTask.category || 'SEASONAL').toUpperCase();
      let mappedCategory = 'PRIORITY_SEASONAL';
      if (rawCat.includes('SOIL') || rawCat.includes('DRAIN') || rawCat.includes('MULCH')) {
        mappedCategory = 'SOIL_CARE';
      } else if (rawCat.includes('FROST') || rawCat.includes('PROTECT') || rawCat.includes('WIND')) {
        mappedCategory = 'PROTECTION';
      } else if (rawCat.includes('PRUN')) {
        mappedCategory = 'PRUNING';
      } else if (rawCat.includes('SOW') || rawCat.includes('PLANT')) {
        mappedCategory = 'SOWING_PLANTING';
      } else if (rawCat.includes('PEST') || rawCat.includes('DISEASE')) {
        mappedCategory = 'PEST_DISEASE';
      }

      items.push({
        id: `seasonal-${idx}-${sTask.taskTitle}`,
        taskType: 'SEASONAL_PRIORITY',
        seasonalKey: sTask.taskTitle,
        title: sTask.taskTitle,
        category: mappedCategory,
        categoryLabel:
          CATEGORY_LABELS[mappedCategory] !== 'Priority Seasonal'
            ? CATEGORY_LABELS[mappedCategory]
            : 'Seasonal Care',
        priority: 'PRIORITY',
        priorityLabel: 'Priority Seasonal',
        rhsGuidance: sTask.instructions,
        claySoilTip: null,
        targetWindowUk: isCurrentMonthSelected
          ? `Active in ${monthProfile.shortName}`
          : 'Active Seasonal Task'
      });
    });

    // 2. Include Monthly Clay Soil & Drainage Tasks (+ custom tasks for this month)
    const customList = customTasksByMonth[selectedMonthIdx] || [];
    const clayTasks = [...monthProfile.tasks, ...customList];

    clayTasks.forEach((cTask) => {
      const friendlyPriority =
        cTask.priority === 'ESSENTIAL'
          ? 'Essential'
          : cTask.priority === 'RECOMMENDED'
          ? 'Recommended'
          : 'Timely';

      items.push({
        id: cTask.id,
        taskType: 'CLAY_MONTHLY',
        title: cTask.title,
        category: cTask.category,
        categoryLabel: CATEGORY_LABELS[cTask.category] || cTask.category,
        priority: cTask.priority,
        priorityLabel: friendlyPriority,
        rhsGuidance: cTask.rhsGuidance,
        claySoilTip: cTask.claySoilTip,
        targetWindowUk: cTask.targetWindowUk
      });
    });

    return items;
  }, [seasonalTasks, customTasksByMonth, selectedMonthIdx, monthProfile, isCurrentMonthSelected]);

  const visibleTasks = useMemo(() => {
    if (!categoryFilter || categoryFilter === 'ALL') return unifiedTasks;
    if (categoryFilter === 'PRIORITY_SEASONAL') {
      return unifiedTasks.filter((t) => t.taskType === 'SEASONAL_PRIORITY');
    }
    return unifiedTasks.filter((t) => t.category === categoryFilter);
  }, [unifiedTasks, categoryFilter]);

  const isTaskDone = (task) => {
    if (task.taskType === 'SEASONAL_PRIORITY') {
      return Boolean(completedSeasonalTasks[task.seasonalKey]);
    }
    return Boolean(completedMap[task.id]);
  };

  const handleToggleUnifiedTask = (task) => {
    if (task.taskType === 'SEASONAL_PRIORITY') {
      if (onToggleSeasonalTask) {
        onToggleSeasonalTask(task.seasonalKey);
      }
      return;
    }
    setCompletedMap((prev) => ({
      ...prev,
      [task.id]: !prev[task.id]
    }));
  };

  const progress = useMemo(() => {
    const totalCount = unifiedTasks.length;
    if (totalCount === 0) {
      return calculateChecklistProgress([], {});
    }
    const completedCount = unifiedTasks.filter((t) =>
      t.taskType === 'SEASONAL_PRIORITY'
        ? Boolean(completedSeasonalTasks[t.seasonalKey])
        : Boolean(completedMap[t.id])
    ).length;
    const percentComplete = Math.round((completedCount / totalCount) * 100);
    return { completedCount, totalCount, percentComplete };
  }, [unifiedTasks, completedSeasonalTasks, completedMap]);

  const resetMonthProgress = () => {
    const nextMap = { ...completedMap };
    const customList = customTasksByMonth[selectedMonthIdx] || [];
    [...monthProfile.tasks, ...customList].forEach((t) => {
      delete nextMap[t.id];
    });
    setCompletedMap(nextMap);
  };

  const handleAddCustomTask = (e) => {
    e.preventDefault();
    const cleanTitle = customForm.title.trim();
    if (!cleanTitle) return;

    const newTask = {
      id: `custom-${selectedMonthIdx}-${Date.now()}`,
      monthIndex: selectedMonthIdx,
      title: cleanTitle,
      category: customForm.category,
      priority: customForm.priority,
      rhsGuidance:
        customForm.rhsGuidance.trim() ||
        'Custom RHS-aligned task tailored for your garden plot.',
      claySoilTip:
        customForm.claySoilTip.trim() ||
        'Use timber staging boards when working on damp heavy clay borders.',
      targetWindowUk: customForm.targetWindowUk.trim() || monthProfile.monthName
    };

    setCustomTasksByMonth((prev) => ({
      ...prev,
      [selectedMonthIdx]: [...(prev[selectedMonthIdx] || []), newTask]
    }));

    setCustomForm({
      title: '',
      category: 'SOIL_CARE',
      priority: 'RECOMMENDED',
      rhsGuidance: '',
      claySoilTip: '',
      targetWindowUk: `Mid ${monthProfile.monthName}`
    });
    setIsAddingCustom(false);
  };

  const showWeeks1To2 = fortnightView === 'WEEKS_1_2' || fortnightView === 'BOTH';
  const showWeeks3To4 = fortnightView === 'WEEKS_3_4' || fortnightView === 'BOTH';

  const renderFortnightBlock = (periodTitle, periodData, isCurrentlyActiveFortnight) => {
    const pillars = [
      {
        label: 'Watering & Soil',
        accent: 'text-sky-900',
        content: periodData.wateringAndSoilCare
      },
      {
        label: 'Feeding & Mulch',
        accent: 'text-emerald-900',
        content: periodData.feedingAndMulching
      },
      {
        label: 'Pruning',
        accent: 'text-amber-900',
        content: periodData.pruningAndDeadheading
      },
      {
        label: 'Frost & Pests',
        accent: 'text-rose-900',
        content: periodData.pestDiseaseAndFrost
      }
    ];

    return (
      <div className="bg-white rounded-xl border border-stone-200/90 overflow-hidden">
        <div className="px-4 py-2.5 bg-stone-50/80 border-b border-stone-200/80 flex items-center justify-between gap-2">
          <span className="text-xs sm:text-sm font-bold text-slate-900">{periodTitle}</span>
          {isCurrentlyActiveFortnight && (
            <span className="text-[11px] font-semibold text-emerald-800">
              Active Fortnight
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-stone-200/70">
          <div className="divide-y divide-stone-200/70">
            {pillars.slice(0, 2).map((pillar) => (
              <div key={pillar.label} className="p-3.5 space-y-1">
                <span className={`block text-xs font-bold ${pillar.accent}`}>
                  {pillar.label}
                </span>
                <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed">
                  {pillar.content}
                </p>
              </div>
            ))}
          </div>

          <div className="divide-y divide-stone-200/70">
            {pillars.slice(2, 4).map((pillar) => (
              <div key={pillar.label} className="p-3.5 space-y-1">
                <span className={`block text-xs font-bold ${pillar.accent}`}>
                  {pillar.label}
                </span>
                <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed">
                  {pillar.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section
      data-testid="unified-calendar-checklist-panel"
      aria-label="Unified Fortnightly Care Schedule, Priority Seasonal Tasks & Monthly Clay Soil Checklist"
      className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-6 shadow-xs space-y-6"
    >
      <span data-testid="tasks-last-updated" className="sr-only">
        Last updated: {alertsLastUpdatedLabel}
      </span>

      {/* 1. Clean Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-stone-200/80 pb-4">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
            <span className="font-semibold text-emerald-800">{monthProfile.monthName}</span>
            <span aria-hidden="true">·</span>
            <span>{monthProfile.seasonLabel}</span>
            {isCurrentMonthSelected && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-slate-700 font-medium">
                  Active Focus: {isSecondHalfOfMonth ? 'Weeks 3–4' : 'Weeks 1–2'}
                </span>
              </>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            {monthProfile.monthName} Garden Calendar &amp; Care Checklist
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isCurrentMonthSelected && (
            <button
              type="button"
              onClick={() => handleSelectMonth(currentUkMonthIdx)}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Current Month ({MONTHLY_CLAY_PROFILES[currentUkMonthIdx].shortName})</span>
            </button>
          )}

          <button
            type="button"
            onClick={resetMonthProgress}
            className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-stone-100 hover:bg-stone-200 text-slate-700 border border-stone-200/90 transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Checks</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddingCustom(!isAddingCustom)}
            className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* 2. Segmented 12-Month Selector Bar */}
      <div className="p-1 rounded-xl bg-stone-100/90 border border-stone-200/80 grid grid-cols-6 sm:grid-cols-12 gap-1">
        {MONTHLY_CLAY_PROFILES.map((m) => {
          const isSelected = m.monthIndex === selectedMonthIdx;
          const isCurrent = m.monthIndex === currentUkMonthIdx;
          return (
            <button
              key={m.monthIndex}
              type="button"
              data-testid={`calendar-month-pill-${m.shortName.toLowerCase()}`}
              onClick={() => handleSelectMonth(m.monthIndex)}
              className={`min-h-[34px] px-2 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : isCurrent
                  ? 'bg-white text-emerald-900 border border-emerald-300/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              {m.shortName}
            </button>
          );
        })}
      </div>

      {/* 3. Unified Clay Soil, Drainage & Progress Strip (Hairline-Divided) */}
      <div className="rounded-xl border border-stone-200/90 bg-stone-50/60 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-stone-200/80">
        <div className="p-3.5 sm:p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Typical 6cm Soil Temp</span>
            <ThermometerSnowflake className="w-3.5 h-3.5 text-sky-700 shrink-0" />
          </div>
          <p className="text-base font-bold text-slate-900 tabular-nums">
            {monthProfile.typicalSoilTemp6cmC}
          </p>
          <p className="text-xs text-slate-600 leading-snug">
            {stripMarkdownFormatting(monthProfile.northEastAdjustmentNote)}
          </p>
        </div>

        <div className="p-3.5 sm:p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Clay Soil &amp; Drainage</span>
            <Layers className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          </div>
          <p className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
            {monthProfile.clayWorkabilityStatus}
          </p>
          <p className="text-xs text-slate-600 leading-snug">
            Heavy clay-loam (pH 6.0–6.8) · Use timber staging boards when wet.
          </p>
        </div>

        <div className="p-3.5 sm:p-4 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-500">{monthProfile.monthName} Progress</span>
            <span className="font-mono font-bold text-emerald-800 tabular-nums">
              {progress.completedCount} / {progress.totalCount} ({progress.percentComplete}%)
            </span>
          </div>
          <div className="w-full h-2 bg-stone-200/90 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-700 transition-opacity duration-150"
              style={{ width: `${progress.percentComplete}%` }}
            />
          </div>
          <p className="text-xs text-slate-600 tabular-nums">
            {seasonalTasks.length} priority seasonal · {monthProfile.tasks.length} clay &amp; drainage tasks
          </p>
        </div>
      </div>

      {/* 4. Fortnightly Care Schedule (Clean Segmented Switcher + Hairline Grid) */}
      <div data-testid="merged-fortnightly-schedule" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {monthFortnightSchedule.monthName} Fortnightly Care Schedule
              </h3>
            </div>
            <p className="text-xs text-slate-500 pl-6">
              {plantInventory.length > 0
                ? `Tailored for your ${plantInventory.length} selected ${
                    plantInventory.length === 1 ? 'plant' : 'plants'
                  } in My Plants`
                : 'General seasonal clay & border care · Add plants in My Plants to personalise'}
            </p>
          </div>

          <div
            role="group"
            aria-label="Fortnight schedule view"
            className="inline-flex items-center p-1 rounded-xl bg-stone-100 border border-stone-200/80 self-start sm:self-auto"
          >
            <button
              type="button"
              onClick={() => setFortnightView('WEEKS_1_2')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
                fortnightView === 'WEEKS_1_2'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Weeks 1–2{isCurrentMonthSelected && !isSecondHalfOfMonth ? ' •' : ''}
            </button>
            <button
              type="button"
              onClick={() => setFortnightView('WEEKS_3_4')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
                fortnightView === 'WEEKS_3_4'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Weeks 3–4{isCurrentMonthSelected && isSecondHalfOfMonth ? ' •' : ''}
            </button>
            <button
              type="button"
              onClick={() => setFortnightView('BOTH')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
                fortnightView === 'BOTH'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Both (Weeks 1–4)
            </button>
          </div>
        </div>

        <div
          className={`grid grid-cols-1 ${
            showWeeks1To2 && showWeeks3To4 ? 'lg:grid-cols-2' : ''
          } gap-3.5`}
        >
          {showWeeks1To2 &&
            renderFortnightBlock(
              `${monthFortnightSchedule.monthName} — Weeks 1–2`,
              monthFortnightSchedule.week1To2,
              isCurrentMonthSelected && !isSecondHalfOfMonth
            )}
          {showWeeks3To4 &&
            renderFortnightBlock(
              `${monthFortnightSchedule.monthName} — Weeks 3–4`,
              monthFortnightSchedule.week3To4,
              isCurrentMonthSelected && isSecondHalfOfMonth
            )}
        </div>
      </div>

      {/* Add Custom Task Form (Progressive Disclosure) */}
      {isAddingCustom && (
        <form
          onSubmit={handleAddCustomTask}
          className="p-4 sm:p-5 rounded-xl bg-stone-50 border border-stone-300 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <h3 className="text-sm font-bold text-slate-900">
              Add Custom {monthProfile.monthName} Task
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingCustom(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <label
                htmlFor="custom-monthly-title"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Task Title *
              </label>
              <input
                id="custom-monthly-title"
                type="text"
                required
                placeholder="e.g., Mulch Hydrangeas with pine bark"
                value={customForm.title}
                onChange={(e) => setCustomForm({ ...customForm, title: e.target.value })}
                className="w-full min-h-[40px] px-3 py-1.5 text-sm rounded-xl bg-white border border-stone-300 text-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="custom-monthly-cat"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Category
              </label>
              <select
                id="custom-monthly-cat"
                value={customForm.category}
                onChange={(e) => setCustomForm({ ...customForm, category: e.target.value })}
                className="w-full min-h-[40px] px-2.5 py-1.5 text-sm rounded-xl bg-white border border-stone-300 text-slate-900"
              >
                {Object.entries(CATEGORY_LABELS)
                  .filter(([k]) => k !== 'ALL' && k !== 'PRIORITY_SEASONAL')
                  .map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="min-h-[38px] px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-800 hover:bg-emerald-700 text-white transition cursor-pointer"
            >
              Save Task
            </button>
          </div>
        </form>
      )}

      {/* 5. Unified Actionable Task Checklist */}
      <div className="space-y-3.5 pt-2 border-t border-stone-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-100 border border-stone-200/80 overflow-x-auto">
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategoryFilter(key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
                  categoryFilter === key
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500 tabular-nums whitespace-nowrap shrink-0">
            Showing {visibleTasks.length} of {unifiedTasks.length} tasks
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {visibleTasks.map((task) => {
            const isCompleted = isTaskDone(task);
            const priorityTextClass =
              PRIORITY_TEXT_COLORS[task.priority] || 'text-slate-700 font-semibold';

            return (
              <div
                key={task.id}
                onClick={() => handleToggleUnifiedTask(task)}
                className={`p-4 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                  isCompleted
                    ? 'bg-stone-50/70 border-stone-200 opacity-60'
                    : 'bg-white border-stone-200/90 hover:border-emerald-600/60'
                }`}
              >
                <button
                  type="button"
                  aria-label={`Mark "${task.title}" as ${isCompleted ? 'incomplete' : 'complete'}`}
                  className="mt-0.5 text-emerald-700 shrink-0 focus:outline-none cursor-pointer"
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  ) : (
                    <Circle className="w-5 h-5 text-stone-400 hover:text-emerald-700" />
                  )}
                </button>

                <div className="flex-1 min-w-0 space-y-1.5">
                  {/* Lead directly with Title, followed by quiet unboxed metadata */}
                  <h4
                    className={`text-sm sm:text-[15px] font-bold leading-snug ${
                      isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                    }`}
                  >
                    {task.title}
                  </h4>

                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <span className={priorityTextClass}>{task.priorityLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-slate-700">{task.categoryLabel}</span>
                    {task.targetWindowUk && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{task.targetWindowUk}</span>
                      </>
                    )}
                  </div>

                  <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                    {stripMarkdownFormatting(task.rhsGuidance)}
                  </p>

                  {task.claySoilTip && (
                    <div className="pt-2 border-t border-stone-100 flex items-start gap-1.5 text-xs text-slate-600">
                      <Sprout className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                      <span>
                        <strong className="font-semibold text-slate-800">Clay &amp; Drainage: </strong>
                        {stripMarkdownFormatting(task.claySoilTip)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
