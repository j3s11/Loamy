import {
  getPlantMonthlyCareStatus,
  matchRhsCatalogPlant
} from './rhsPlantCatalog';

/**
 * Monthly RHS-Appropriate Gardening Checklist for Heavy Clay Soils in the UK
 * Calibrated for RHS Zone H4–H5 (pH 6.0-6.8 heavy clay to alluvial loam).
 * All plant tasks are generated strictly from the user's selected plants in My Garden Plants.
 */

export interface MonthlyClayTask {
  id: string;
  monthIndex: number; // 0 = January ... 9 = October ... 11 = December
  title: string;
  category: 'SOIL_CARE' | 'PROTECTION' | 'SOWING_PLANTING' | 'PRUNING' | 'PEST_DISEASE';
  priority: 'ESSENTIAL' | 'RECOMMENDED' | 'TIMELY';
  rhsGuidance: string;
  claySoilTip: string;
  targetWindowUk: string;
}

export interface MonthClayProfile {
  monthIndex: number;
  monthName: string;
  shortName: string;
  seasonLabel: string;
  typicalSoilTemp6cmC: string;
  clayWorkabilityStatus: string;
  northEastAdjustmentNote: string;
  tasks: MonthlyClayTask[];
}

export const MONTHLY_CLAY_PROFILES: MonthClayProfile[] = [
  {
    monthIndex: 0,
    monthName: 'January',
    shortName: 'Jan',
    seasonLabel: 'Deep Winter Dormancy',
    typicalSoilTemp6cmC: '2.0°C – 3.5°C',
    clayWorkabilityStatus: 'Saturated / Frozen — Keep Off Borders',
    northEastAdjustmentNote:
      'Ground remains frozen or waterlogged in low-lying frost pockets; restrict foot traffic to timber staging boards.',
    tasks: []
  },
  {
    monthIndex: 1,
    monthName: 'February',
    shortName: 'Feb',
    seasonLabel: 'Late Winter Preparation',
    typicalSoilTemp6cmC: '2.5°C – 4.5°C',
    clayWorkabilityStatus: 'Cold & Sticky — Pre-Warm Under Cloches',
    northEastAdjustmentNote:
      'Heavy clay holds winter moisture in micropores and warms slowly; avoid working wet soil directly.',
    tasks: []
  },
  {
    monthIndex: 2,
    monthName: 'March',
    shortName: 'Mar',
    seasonLabel: 'Early Spring Awakening',
    typicalSoilTemp6cmC: '4.5°C – 6.8°C',
    clayWorkabilityStatus: 'Drying Surface / Wet Subsoil — Fork Lightly',
    northEastAdjustmentNote:
      'Surface clay begins drying on breezy spring days while subsoil remains cool and moisture-retentive.',
    tasks: []
  },
  {
    monthIndex: 3,
    monthName: 'April',
    shortName: 'Apr',
    seasonLabel: 'Spring Growth & Mulching Window',
    typicalSoilTemp6cmC: '7.0°C – 9.5°C',
    clayWorkabilityStatus: 'Friable Tilth on Dry Days — Avoid Working After Rain',
    northEastAdjustmentNote:
      'Soil temperature at 6cm passes 7°C in April, activating beneficial soil microbes and root uptake.',
    tasks: []
  },
  {
    monthIndex: 4,
    monthName: 'May',
    shortName: 'May',
    seasonLabel: 'Last Spring Frost Transition',
    typicalSoilTemp6cmC: '10.0°C – 13.0°C',
    clayWorkabilityStatus: 'Optimal Spring Tilth — Prime Planting Month',
    northEastAdjustmentNote:
      'Average last spring radiation frost occurs in mid-to-late May in RHS H4 zones; monitor clear overnight skies.',
    tasks: []
  },
  {
    monthIndex: 5,
    monthName: 'June',
    shortName: 'Jun',
    seasonLabel: 'Midsummer Growth & Moisture Retention',
    typicalSoilTemp6cmC: '13.5°C – 16.0°C',
    clayWorkabilityStatus: 'Firm — Mulch Against Surface Fissures',
    northEastAdjustmentNote:
      'Long daylight hours drive rapid vegetative growth once heavy clay warms; maintain organic surface mulch.',
    tasks: []
  },
  {
    monthIndex: 6,
    monthName: 'July',
    shortName: 'Jul',
    seasonLabel: 'Peak Summer Canopy & Crack Prevention',
    typicalSoilTemp6cmC: '15.5°C – 18.0°C',
    clayWorkabilityStatus: 'Hard Baked Crust if Unmulched — Deep Soak Only',
    northEastAdjustmentNote:
      'Deliver deep weekly root-zone soaks rather than light daily sprinkling to prevent surface crusting.',
    tasks: []
  },
  {
    monthIndex: 7,
    monthName: 'August',
    shortName: 'Aug',
    seasonLabel: 'Late Summer Ripening & Potash Transition',
    typicalSoilTemp6cmC: '15.0°C – 17.0°C',
    clayWorkabilityStatus: 'Warm & Moisture-Retentive in Subsoil',
    northEastAdjustmentNote:
      'Cease high-nitrogen feeds on permanent border plants so new stems harden before autumn frosts.',
    tasks: []
  },
  {
    monthIndex: 8,
    monthName: 'September',
    shortName: 'Sep',
    seasonLabel: 'Early Autumn Preparation',
    typicalSoilTemp6cmC: '11.5°C – 14.0°C',
    clayWorkabilityStatus: 'Moist & Warm — Cultivate Before Autumn Rains Set In',
    northEastAdjustmentNote:
      'Complete border cultivation in September while soil remains warm and friable ahead of autumn rainfall.',
    tasks: []
  },
  {
    monthIndex: 9,
    monthName: 'October',
    shortName: 'Oct',
    seasonLabel: 'Autumn Frost Sentinel & Clay Drainage Protection',
    typicalSoilTemp6cmC: '7.0°C – 10.0°C',
    clayWorkabilityStatus: 'Near Field Capacity — Avoid Compaction After 30mm+ Rain',
    northEastAdjustmentNote:
      'First air frost typically arrives in October as heavy clay approaches field capacity; prioritize free drainage.',
    tasks: []
  },
  {
    monthIndex: 10,
    monthName: 'November',
    shortName: 'Nov',
    seasonLabel: 'Late Autumn Overwintering & Winter Insulation',
    typicalSoilTemp6cmC: '4.5°C – 7.0°C',
    clayWorkabilityStatus: 'Wet & Heavy — Use Grit & Compost in Planting Pits',
    northEastAdjustmentNote:
      'Cold wet clay slows root respiration; ensure all containers sit on pot feet and crowns are mulched.',
    tasks: []
  },
  {
    monthIndex: 11,
    monthName: 'December',
    shortName: 'Dec',
    seasonLabel: 'Winter Solstice & Dormant Protection',
    typicalSoilTemp6cmC: '2.5°C – 4.5°C',
    clayWorkabilityStatus: 'Waterlogged — Strict No-Tread Policy on Clay',
    northEastAdjustmentNote:
      'Enforce a strict no-tread policy on saturated clay borders to preserve soil pore structure over winter.',
    tasks: []
  }
];


/**
 * Returns the 0-indexed month (0 = Jan ... 9 = Oct ... 11 = Dec) in UK time ('Europe/London').
 */
export function getCurrentUkMonthIndex(referenceDate: Date = new Date()): number {
  try {
    const monthStr = new Intl.DateTimeFormat('en-GB', {
      month: 'numeric',
      timeZone: 'Europe/London'
    }).format(referenceDate);
    const parsed = parseInt(monthStr, 10) - 1;
    if (parsed >= 0 && parsed <= 11) return parsed;
  } catch {
    // Fallback to UTC/local month
  }
  return referenceDate.getMonth();
}

/**
 * Retrieves the monthly heavy clay checklist profile for a given month index (0-11),
 * generating tasks strictly from the selected plants in `plantInventory`.
 * When `plantInventory` is empty, `tasks` is `[]`.
 */
export function getMonthlyClayChecklist(
  monthIndex: number,
  plantInventory: Array<any> = []
): MonthClayProfile {
  const safeIndex = ((Math.floor(monthIndex) % 12) + 12) % 12;
  const baseProfile = MONTHLY_CLAY_PROFILES[safeIndex];
  const safeInventory = Array.isArray(plantInventory) ? plantInventory : [];

  if (safeInventory.length === 0) {
    return {
      ...baseProfile,
      tasks: []
    };
  }

  const resolvedPlants = safeInventory.map((gp) => {
    const cat = matchRhsCatalogPlant(gp);
    const displayName =
      gp.commonName ||
      cat?.commonName ||
      String(gp.name || 'Garden Plant').replace(/^#\d+\s+/, '').trim();
    const rhsRating = gp.rhsRating || cat?.rhsRating || 'H4';
    const soilAndSun =
      gp.soilAndSun ||
      cat?.soilAndSun ||
      'Moist, well-drained soil; avoid winter waterlogging.';
    const feedWindowUk = gp.feedWindowUk || cat?.feedWindowUk || 'March to July';
    const feedTypeNpk =
      gp.feedTypeNpk || cat?.feedTypeNpk || 'Balanced seasonal organic fertiliser';
    const feedFrequencyDosage =
      gp.feedFrequencyDosage ||
      cat?.feedFrequencyDosage ||
      'Apply during active growing season';
    const pruneMonthsUk =
      gp.pruneMonthsUk || cat?.pruneMonthsUk || 'Late winter or after flowering';
    const pruneTechnique =
      gp.pruneTechnique ||
      cat?.pruneTechnique ||
      'Remove dead, damaged, or crossing stems cleanly.';
    const pruneAvoid = gp.pruneAvoid || cat?.pruneAvoid || 'Avoid pruning during frost.';
    const overwinteringProtocol =
      gp.overwinteringProtocol ||
      cat?.overwinteringProtocol ||
      `RHS ${rhsRating}: Mulch crown zone and ensure free winter drainage.`;
    const vulnerabilities =
      Array.isArray(gp.vulnerabilities) && gp.vulnerabilities.length > 0
        ? gp.vulnerabilities
        : cat?.vulnerabilities || [];

    const monthlyCare = getPlantMonthlyCareStatus(
      {
        id: cat?.catalogId || gp.id,
        catalogId: cat?.catalogId,
        name: gp.name || displayName,
        commonName: displayName,
        rhsRating,
        feedWindowUk,
        pruneMonthsUk
      },
      safeIndex
    );

    return {
      id: gp.id || displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      displayName,
      rhsRating,
      location: gp.location || 'Main Border',
      soilAndSun,
      feedWindowUk,
      feedTypeNpk,
      feedFrequencyDosage,
      pruneMonthsUk,
      pruneTechnique,
      pruneAvoid,
      overwinteringProtocol,
      vulnerabilities,
      monthlyCare
    };
  });

  const plantNames = resolvedPlants.map((p) => p.displayName);
  const feedDuePlants = resolvedPlants.filter((p) => p.monthlyCare.feedDue);
  const pruneDuePlants = resolvedPlants.filter((p) => p.monthlyCare.pruneDue);
  const protectDuePlants = resolvedPlants.filter(
    (p) =>
      p.monthlyCare.winterProtectDue ||
      ['H1a', 'H1b', 'H1c', 'H2', 'H3'].includes(p.rhsRating)
  );
  const shortMonth = baseProfile.shortName.toLowerCase();
  const tasks: MonthlyClayTask[] = [];

  // 1. Soil, Drainage & Feeding task for selected plants
  if (feedDuePlants.length > 0) {
    tasks.push({
      id: `${shortMonth}-soil-feed`,
      monthIndex: safeIndex,
      title: `Feed & Mulch Selected Plants (${feedDuePlants
        .slice(0, 3)
        .map((p) => p.displayName)
        .join(', ')})`,
      category: 'SOIL_CARE',
      priority: 'ESSENTIAL',
      rhsGuidance: feedDuePlants
        .slice(0, 3)
        .map((p) => `${p.displayName}: ${p.feedTypeNpk} (${p.feedFrequencyDosage}).`)
        .join(' '),
      claySoilTip: `Maintain soil requirements for ${feedDuePlants
        .slice(0, 2)
        .map((p) => `${p.displayName} (${p.soilAndSun})`)
        .join('; ')}.`,
      targetWindowUk: `Early to Mid ${baseProfile.monthName}`
    });
  } else {
    tasks.push({
      id: `${shortMonth}-soil-drainage`,
      monthIndex: safeIndex,
      title: `Check Soil Moisture & Drainage for ${plantNames.slice(0, 3).join(', ')}`,
      category: 'SOIL_CARE',
      priority: 'ESSENTIAL',
      rhsGuidance: resolvedPlants
        .slice(0, 3)
        .map(
          (p) =>
            `${p.displayName} (${p.location}): ${p.soilAndSun}. Active feed window: ${p.feedWindowUk}.`
        )
        .join(' '),
      claySoilTip:
        'Avoid compacting wet heavy clay around root zones; ensure container drainage holes and border mulch are clear.',
      targetWindowUk: `Throughout ${baseProfile.monthName}`
    });
  }

  // 2. Frost, Wind & Overwintering Protection task for selected plants
  const targetProtectPlants = protectDuePlants.length > 0 ? protectDuePlants : resolvedPlants;
  tasks.push({
    id: `${shortMonth}-protection`,
    monthIndex: safeIndex,
    title: `Weather & Seasonal Protection for ${targetProtectPlants
      .slice(0, 3)
      .map((p) => p.displayName)
      .join(', ')}`,
    category: 'PROTECTION',
    priority: protectDuePlants.length > 0 ? 'ESSENTIAL' : 'RECOMMENDED',
    rhsGuidance: targetProtectPlants
      .slice(0, 3)
      .map((p) => `${p.displayName} (RHS ${p.rhsRating}): ${p.overwinteringProtocol}`)
      .join(' '),
    claySoilTip:
      'Heavy clay retains winter moisture around crowns; elevate containers on pot feet and mulch border root zones.',
    targetWindowUk: `${baseProfile.monthName}`
  });

  // 3. Pruning & Deadheading task for selected plants
  if (pruneDuePlants.length > 0) {
    tasks.push({
      id: `${shortMonth}-pruning`,
      monthIndex: safeIndex,
      title: `Prune Selected Plants Due in ${baseProfile.monthName} (${pruneDuePlants
        .slice(0, 3)
        .map((p) => p.displayName)
        .join(', ')})`,
      category: 'PRUNING',
      priority: 'ESSENTIAL',
      rhsGuidance: pruneDuePlants
        .slice(0, 3)
        .map((p) => `${p.displayName} (${p.pruneMonthsUk}): ${p.pruneTechnique}`)
        .join(' '),
      claySoilTip: pruneDuePlants
        .slice(0, 2)
        .map((p) => `${p.displayName}: ${p.pruneAvoid}`)
        .join(' '),
      targetWindowUk: `Mid to Late ${baseProfile.monthName}`
    });
  } else {
    tasks.push({
      id: `${shortMonth}-pruning-check`,
      monthIndex: safeIndex,
      title: `Inspect Stems & Pruning Schedule for ${plantNames.slice(0, 3).join(', ')}`,
      category: 'PRUNING',
      priority: 'TIMELY',
      rhsGuidance: resolvedPlants
        .slice(0, 3)
        .map(
          (p) =>
            `${p.displayName}: Scheduled pruning window is ${p.pruneMonthsUk}. ${p.pruneAvoid}`
        )
        .join(' '),
      claySoilTip:
        'Use timber staging boards when inspecting borders so damp clay is not compacted.',
      targetWindowUk: `Late ${baseProfile.monthName}`
    });
  }

  // 4. Pest & Disease Watch task for selected plants
  tasks.push({
    id: `${shortMonth}-pest-disease`,
    monthIndex: safeIndex,
    title: `Monitor Pests & Vulnerabilities on ${plantNames.slice(0, 3).join(', ')}`,
    category: 'PEST_DISEASE',
    priority: 'RECOMMENDED',
    rhsGuidance: resolvedPlants
      .slice(0, 3)
      .map(
        (p) =>
          `${p.displayName}: ${
            p.vulnerabilities.length > 0
              ? `Watch for ${p.vulnerabilities.join(', ')}`
              : 'Inspect foliage and crown for seasonal pests or fungal spotting'
          }.`
      )
      .join(' '),
    claySoilTip:
      'Clear decaying leaves from around crowns on heavy clay to deter slugs and botrytis.',
    targetWindowUk: `Throughout ${baseProfile.monthName}`
  });

  return {
    ...baseProfile,
    tasks
  };
}

/**
 * Filters monthly tasks by category ('ALL' returns all tasks).
 */
export function filterMonthlyTasks(
  tasks: MonthlyClayTask[],
  categoryFilter: string = 'ALL'
): MonthlyClayTask[] {
  if (!categoryFilter || categoryFilter === 'ALL') return tasks;
  return tasks.filter((t) => t.category === categoryFilter);
}

/**
 * Computes completion counts and percentage for a month's tasks.
 */
export function calculateChecklistProgress(
  tasks: MonthlyClayTask[],
  completedMap: Record<string, boolean> = {}
): {
  completedCount: number;
  totalCount: number;
  percentComplete: number;
} {
  const totalCount = tasks.length;
  if (totalCount === 0) {
    return { completedCount: 0, totalCount: 0, percentComplete: 0 };
  }
  const completedCount = tasks.filter((t) => Boolean(completedMap[t.id])).length;
  const percentComplete = Math.round((completedCount / totalCount) * 100);
  return { completedCount, totalCount, percentComplete };
}
