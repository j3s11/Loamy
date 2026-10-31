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
  Compass
} from 'lucide-react';
import {
  MONTHLY_CLAY_PROFILES,
  getCurrentUkMonthIndex,
  getMonthlyClayChecklist,
  filterMonthlyTasks,
  calculateChecklistProgress
} from '../utils/monthlyClayChecklist';

const STORAGE_KEY_MONTHLY_CHECKS = 'ngws_monthly_clay_checklist_v1';
const STORAGE_KEY_CUSTOM_MONTHLY_TASKS = 'ngws_custom_monthly_clay_tasks_v1';

const CATEGORY_LABELS = {
  ALL: 'All Tasks',
  SOIL_CARE: 'Clay Soil Care',
  PROTECTION: 'Frost & Wind Protection',
  SOWING_PLANTING: 'Sowing & Planting',
  PRUNING: 'Pruning & Training',
  PEST_DISEASE: 'Pest & Disease'
};

const PRIORITY_STYLES = {
  ESSENTIAL: 'text-amber-900 bg-amber-50 border-amber-200',
  RECOMMENDED: 'text-emerald-900 bg-emerald-50 border-emerald-200',
  TIMELY: 'text-sky-900 bg-sky-50 border-sky-200'
};

export default function MonthlyClayChecklistPanel() {
  const currentUkMonthIdx = useMemo(() => getCurrentUkMonthIndex(new Date()), []);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(currentUkMonthIdx);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isAddingCustom, setIsAddingCustom] = useState(false);

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

  const combinedMonthTasks = useMemo(() => {
    const customList = customTasksByMonth[selectedMonthIdx] || [];
    return [...monthProfile.tasks, ...customList];
  }, [monthProfile, customTasksByMonth, selectedMonthIdx]);

  const visibleTasks = useMemo(
    () => filterMonthlyTasks(combinedMonthTasks, categoryFilter),
    [combinedMonthTasks, categoryFilter]
  );

  const progress = useMemo(
    () => calculateChecklistProgress(combinedMonthTasks, completedMap),
    [combinedMonthTasks, completedMap]
  );

  const toggleTask = (taskId) => {
    setCompletedMap((prev) => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const resetMonthProgress = () => {
    const nextMap = { ...completedMap };
    combinedMonthTasks.forEach((t) => {
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

  const isCurrentMonthSelected = selectedMonthIdx === currentUkMonthIdx;

  return (
    <section
      aria-label="Monthly RHS Heavy Clay Gardening Checklist"
      className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6"
    >
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-700 shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {monthProfile.monthName} Heavy Clay Checklist
            </h2>
            {isCurrentMonthSelected && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Current Month
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Calibrated for heavy clay-loam (pH 6.0–6.8, RHS H4–H5). Click any task to check it off.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isCurrentMonthSelected && (
            <button
              type="button"
              onClick={() => setSelectedMonthIdx(currentUkMonthIdx)}
              className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              Jump to {MONTHLY_CLAY_PROFILES[currentUkMonthIdx].shortName}
            </button>
          )}

          <button
            type="button"
            onClick={resetMonthProgress}
            className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-stone-100 hover:bg-stone-200 text-slate-700 border border-stone-300 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>

          <button
            type="button"
            onClick={() => setIsAddingCustom(!isAddingCustom)}
            className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-800 hover:bg-emerald-700 text-white transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* 12-Month Selector Ribbon */}
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
        {MONTHLY_CLAY_PROFILES.map((m) => {
          const isSelected = m.monthIndex === selectedMonthIdx;
          const isCurrent = m.monthIndex === currentUkMonthIdx;
          return (
            <button
              key={m.monthIndex}
              type="button"
              onClick={() => setSelectedMonthIdx(m.monthIndex)}
              className={`min-h-[40px] px-2.5 py-2 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                isSelected
                  ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                  : isCurrent
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-stone-50 text-slate-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              {m.shortName}
              {isCurrent ? ' •' : ''}
            </button>
          );
        })}
      </div>

      {/* Monthly Soil & Microclimate Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/90">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Typical 6cm Soil Temp</span>
            <ThermometerSnowflake className="w-4 h-4 text-sky-700 shrink-0" />
          </div>
          <p className="text-lg font-bold text-slate-900 tabular-nums mt-1">
            {monthProfile.typicalSoilTemp6cmC}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/90">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Clay Workability</span>
            <Layers className="w-4 h-4 text-amber-700 shrink-0" />
          </div>
          <p className="text-base font-bold text-slate-900 mt-1">
            {monthProfile.clayWorkabilityStatus}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/90 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>{monthProfile.monthName} Progress</span>
            <span className="font-mono font-bold text-emerald-800 tabular-nums">
              {progress.completedCount} / {progress.totalCount} ({progress.percentComplete}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-emerald-700 transition-all duration-150"
              style={{ width: `${progress.percentComplete}%` }}
            />
          </div>
        </div>
      </div>

      {isAddingCustom && (
        <form
          onSubmit={handleAddCustomTask}
          className="p-5 rounded-2xl bg-stone-50 border border-emerald-300 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <h3 className="text-sm font-bold text-emerald-950">
              Add Custom {monthProfile.monthName} Task
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingCustom(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <label htmlFor="custom-monthly-title" className="block text-xs font-semibold text-slate-700 mb-1">
                Task Title *
              </label>
              <input
                id="custom-monthly-title"
                type="text"
                required
                placeholder="e.g., Mulch Hydrangeas #24 & #28 with pine bark"
                value={customForm.title}
                onChange={(e) => setCustomForm({ ...customForm, title: e.target.value })}
                className="w-full min-h-[40px] px-3 py-1.5 text-sm rounded-xl bg-white border border-stone-300 text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="custom-monthly-cat" className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                id="custom-monthly-cat"
                value={customForm.category}
                onChange={(e) => setCustomForm({ ...customForm, category: e.target.value })}
                className="w-full min-h-[40px] px-2.5 py-1.5 text-sm rounded-xl bg-white border border-stone-300 text-slate-900"
              >
                {Object.entries(CATEGORY_LABELS)
                  .filter(([k]) => k !== 'ALL')
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
              className="min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-800 hover:bg-emerald-700 text-white transition cursor-pointer"
            >
              Save Task
            </button>
          </div>
        </form>
      )}

      {/* Category Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategoryFilter(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition whitespace-nowrap cursor-pointer ${
                categoryFilter === key
                  ? 'bg-emerald-800 text-white border-emerald-800'
                  : 'bg-stone-50 text-slate-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500">
          {visibleTasks.length} tasks
        </span>
      </div>

      {/* Spacious, Readable Checklist Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {visibleTasks.map((task) => {
          const isCompleted = Boolean(completedMap[task.id]);
          const priorityStyle = PRIORITY_STYLES[task.priority] || 'text-slate-700 bg-stone-100 border-stone-200';

          return (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`p-5 rounded-2xl border transition cursor-pointer flex items-start gap-3.5 ${
                isCompleted
                  ? 'bg-stone-50 border-stone-200 opacity-65'
                  : 'bg-white border-stone-200/90 hover:border-emerald-600/60 shadow-2xs'
              }`}
            >
              <button
                type="button"
                aria-label={`Mark "${task.title}" as ${isCompleted ? 'incomplete' : 'complete'}`}
                className="mt-0.5 text-emerald-700 shrink-0 focus:outline-none"
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                ) : (
                  <Circle className="w-5 h-5 text-stone-400 hover:text-emerald-700" />
                )}
              </button>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded-md font-semibold border ${priorityStyle}`}>
                    {task.priority}
                  </span>
                  <span className="text-emerald-800 font-semibold">
                    {CATEGORY_LABELS[task.category] || task.category}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500">{task.targetWindowUk}</span>
                </div>

                <h3
                  className={`text-base font-bold leading-snug ${
                    isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                  }`}
                >
                  {task.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{task.rhsGuidance}</p>

                <div className="pt-2 border-t border-stone-100 flex items-start gap-2 text-xs text-slate-600">
                  <Sprout className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    <strong className="font-semibold text-slate-800">Clay Tip: </strong>
                    {task.claySoilTip}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
