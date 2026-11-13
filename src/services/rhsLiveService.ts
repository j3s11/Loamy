import {
  RhsCatalogPlant,
  PlantGroupCategoryId,
  searchRhsPlantCatalog,
  resolvePlantGroupCategory
} from '../utils/rhsPlantCatalog.ts';
import { TtlCache, mapWithConcurrency } from '../utils/ttlCache.ts';

export const RHS_LIVE_API_BASE = 'https://lwapp-uks-prod-psearch-01.azurewebsites.net';
export const RHS_IMAGE_CDN_BASE = 'https://apps.rhs.org.uk/plantselectorimages/detail/';

export const RHS_HARDINESS_LEVEL_MAP: Record<number, string> = {
  1: 'H1a',
  2: 'H1b',
  3: 'H1c',
  4: 'H2',
  5: 'H3',
  6: 'H4',
  7: 'H5',
  8: 'H6',
  9: 'H7'
};

export const RHS_PLANT_TYPE_LABELS: Record<number, string> = {
  1: 'Herbaceous Perennial',
  2: 'Climber / Wall Shrub',
  3: 'Bedding',
  4: 'Bulbs',
  5: 'Ferns',
  6: 'Shrubs',
  7: 'Annual / Biennial',
  8: 'Alpine / Rockery',
  9: 'Roses',
  10: 'Ornamental Grass',
  11: 'Conservatory / Greenhouse',
  12: 'Fruit & Edible',
  13: 'Trees',
  14: 'Houseplants',
  15: 'Cactus & Succulent',
  16: 'Aquatic',
  17: 'Bamboos',
  18: 'Bog Plant',
  19: 'Conifers',
  20: 'Culinary Herbs',
  21: 'Palms'
};

export const RHS_SUNLIGHT_LABELS: Record<number, string> = {
  1: 'Full sun',
  2: 'Partial shade',
  3: 'Full shade'
};

export const RHS_SOIL_TYPE_LABELS: Record<number, string> = {
  1: 'Loam',
  2: 'Chalk',
  3: 'Sand',
  4: 'Clay'
};

export const RHS_MOISTURE_LABELS: Record<number, string> = {
  1: 'Well-drained',
  2: 'Poorly-drained / Moist',
  3: 'Moist but well-drained'
};

export const RHS_PH_LABELS: Record<number, string> = {
  1: 'Acid (Ericaceous)',
  2: 'Alkaline',
  3: 'Neutral'
};

export const RHS_ASPECT_LABELS: Record<number, string> = {
  1: 'East-facing',
  2: 'North-facing',
  3: 'South-facing',
  4: 'West-facing'
};

export const RHS_EXPOSURE_LABELS: Record<number, string> = {
  1: 'Sheltered',
  2: 'Exposed'
};

export const RHS_FOLIAGE_LABELS: Record<number, string> = {
  1: 'Deciduous',
  2: 'Evergreen',
  3: 'Semi-evergreen'
};

export const CATEGORY_TO_RHS_PLANT_TYPES: Record<string, number[]> = {
  SHRUBS: [6, 9, 2, 13],
  FLOWERS: [1, 3, 4, 7, 8],
  VEGETABLES: [12, 20],
  FOLIAGE: [5, 10, 17, 19, 21]
};

/**
 * Strips HTML tags and normalizes whitespace from live RHS HTML snippets.
 */
export function stripRhsHtml(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function capitalizeTitle(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Maps RHS numeric plantType IDs + plant names to our 4 top-level categories.
 */
export function mapRhsPlantTypesToCategory(
  plantTypes?: number[] | null,
  botanicalName: string = '',
  commonName: string = ''
): PlantGroupCategoryId {
  const types = Array.isArray(plantTypes) ? plantTypes : [];
  if (types.some((t) => [12, 20].includes(t))) return 'VEGETABLES';
  if (types.some((t) => [5, 10, 17, 19, 21].includes(t))) return 'FOLIAGE';
  if (types.some((t) => [6, 9, 2, 13].includes(t))) return 'SHRUBS';
  if (types.some((t) => [1, 3, 4, 7, 8].includes(t))) return 'FLOWERS';

  return resolvePlantGroupCategory({
    name: `${commonName} ${botanicalName}`.trim(),
    commonName
  });
}

/**
 * Extracts RHS Hardiness code (H1a - H7) from numeric hardinessLevel or semanticSearchField text.
 */
export function resolveRhsHardinessCode(hit?: any, detail?: any): string {
  const rawCandidate =
    detail?.hardinessLevel ??
    hit?.hardinessLevel ??
    hit?.hardiness ??
    (typeof hit === 'number' || Array.isArray(hit) ? hit : 0);
  const numLevel = Number(Array.isArray(rawCandidate) ? rawCandidate[0] : rawCandidate);
  if (numLevel >= 1 && numLevel <= 9 && RHS_HARDINESS_LEVEL_MAP[numLevel]) {
    return RHS_HARDINESS_LEVEL_MAP[numLevel];
  }

  const semantic = String(detail?.semanticSearchField || hit?.semanticSearchField || '');
  const match = semantic.match(/hardiness:\s*(H[1-7][a-c]?)/i);
  if (match && match[1]) {
    const code = match[1].toUpperCase();
    return code.startsWith('H1') ? `H1${code.slice(2).toLowerCase()}` : code;
  }

  return 'H4';
}

/**
 * Parses RHS pestResistance and diseaseResistance HTML strings into concise vulnerability items.
 */
export function extractRhsVulnerabilities(
  pestResistance?: string | null,
  diseaseResistance?: string | null,
  rhsRating: string = 'H4',
  moistureIds?: number[] | null
): string[] {
  const items: string[] = [];
  const cleanPest = stripRhsHtml(pestResistance);
  const cleanDisease = stripRhsHtml(diseaseResistance);

  if (cleanPest && !/generally pest free/i.test(cleanPest)) {
    const stripped = cleanPest.replace(/^May be susceptible to\s+/i, '').replace(/\.$/, '');
    if (stripped) items.push(`Pests: ${capitalizeTitle(stripped)}`);
  }

  if (cleanDisease && !/generally disease free/i.test(cleanDisease)) {
    const stripped = cleanDisease.replace(/^May be susceptible to\s+/i, '').replace(/\.$/, '');
    if (stripped) items.push(`Diseases: ${capitalizeTitle(stripped)}`);
  }

  if (['H1a', 'H1b', 'H1c', 'H2', 'H3'].includes(rhsRating)) {
    items.push(`Frost damage below 0°C (RHS ${rhsRating})`);
  }

  if (Array.isArray(moistureIds) && moistureIds.includes(1) && !moistureIds.includes(2)) {
    items.push('Root rot in waterlogged winter clay if drainage is impeded');
  }

  if (items.length === 0) {
    items.push('Monitor for seasonal slugs, aphids, and winter clay waterlogging');
  }

  return items.slice(0, 4);
}

/**
 * Transforms a raw hit and optional detail payload from the live RHS Plant Finder API
 * into Loamy's unified RhsCatalogPlant structure.
 */
export function normalizeLiveRhsPlant(hit: any, detail?: any): RhsCatalogPlant {
  const source = detail && typeof detail === 'object' ? { ...hit, ...detail } : hit || {};
  const rhsId = Number(source.id || hit?.id || 0);

  const rawBotanical = stripRhsHtml(
    source.botanicalNameUnFormatted || source.botanicalName || hit?.botanicalName || 'Botanical Specimen'
  );
  const rawCommon = capitalizeTitle(
    stripRhsHtml(source.commonName || hit?.commonName || '')
  );

  const commonName = rawCommon || rawBotanical;
  const botanicalName = rawBotanical;
  const displayName =
    rawCommon && rawBotanical && rawCommon.toLowerCase() !== rawBotanical.toLowerCase()
      ? `${rawCommon} (${rawBotanical})`
      : rawCommon || rawBotanical;

  const rhsRating = resolveRhsHardinessCode(hit, detail);
  const groupCategory = mapRhsPlantTypesToCategory(source.plantType, botanicalName, commonName);

  // Resolve official RHS image URL from apps.rhs.org.uk
  const rawImageName =
    (Array.isArray(source.images) && source.images[0]?.image) ||
    source.image ||
    hit?.image ||
    '';
  const cleanImageFile = String(rawImageName).trim();
  const photoUrl = cleanImageFile
    ? `${RHS_IMAGE_CDN_BASE}${encodeURIComponent(cleanImageFile)}`
    : undefined;

  // Map RHS numeric characteristic arrays to readable labels
  const sunLabels = (Array.isArray(source.sunlight) ? source.sunlight : [])
    .map((id: number) => RHS_SUNLIGHT_LABELS[id])
    .filter(Boolean);
  const soilLabels = (Array.isArray(source.soilType) ? source.soilType : [])
    .map((id: number) => RHS_SOIL_TYPE_LABELS[id])
    .filter(Boolean);
  const moistureLabels = (Array.isArray(source.moisture) ? source.moisture : [])
    .map((id: number) => RHS_MOISTURE_LABELS[id])
    .filter(Boolean);
  const phLabels = (Array.isArray(source.ph) ? source.ph : [])
    .map((id: number) => RHS_PH_LABELS[id])
    .filter(Boolean);
  const aspectLabels = (Array.isArray(source.aspect) ? source.aspect : [])
    .map((id: number) => RHS_ASPECT_LABELS[id])
    .filter(Boolean);
  const exposureLabels = (Array.isArray(source.exposure) ? source.exposure : [])
    .map((id: number) => RHS_EXPOSURE_LABELS[id])
    .filter(Boolean);
  const foliageLabels = (Array.isArray(source.foliage) ? source.foliage : [])
    .map((id: number) => RHS_FOLIAGE_LABELS[id])
    .filter(Boolean);
  const plantTypeLabels = (Array.isArray(source.plantType) ? source.plantType : [])
    .map((id: number) => RHS_PLANT_TYPE_LABELS[id])
    .filter(Boolean);

  // Recommended location in garden plot
  const isAcidOnly = Array.isArray(source.ph) && source.ph.length === 1 && source.ph[0] === 1;
  const isTender = ['H1a', 'H1b', 'H1c', 'H2', 'H3'].includes(rhsRating);
  const prefersShade =
    Array.isArray(source.sunlight) &&
    !source.sunlight.includes(1) &&
    (source.sunlight.includes(2) || source.sunlight.includes(3));

  const recommendedLocation = isTender
    ? 'Terracotta Patio Pot / Frost-Free Shelter'
    : isAcidOnly
    ? 'Sheltered West-Facing Acidic Bed / Ericaceous Pot'
    : groupCategory === 'VEGETABLES'
    ? 'Raised Bed (Compost / Loam Mix)'
    : prefersShade
    ? 'North-Facing Shaded Border (Heavy Clay)'
    : 'South-Facing Mixed Border (Heavy Clay)';

  // Default growth stage
  const isEvergreen = Array.isArray(source.foliage) && source.foliage.includes(2);
  const defaultOctGrowthStage = isEvergreen
    ? 'Overwintering Vegetative Growth'
    : isTender
    ? 'Late Flowering / Pre-Dormancy'
    : 'Leaf Drop / Autumn Dormancy';

  // Soil & Sun string from live RHS cultivation + characteristics
  const cultivationText = stripRhsHtml(source.cultivation);
  const charParts: string[] = [];
  if (sunLabels.length > 0) charParts.push(`Sun: ${sunLabels.join(', ')}`);
  if (soilLabels.length > 0) charParts.push(`Soil: ${soilLabels.join(', ')}`);
  if (moistureLabels.length > 0) charParts.push(`Moisture: ${moistureLabels.join(', ')}`);
  if (phLabels.length > 0) charParts.push(`pH: ${phLabels.join(', ')}`);
  if (aspectLabels.length > 0) charParts.push(`Aspect: ${aspectLabels.join(', ')}`);
  const soilAndSun = [charParts.join(' · '), cultivationText].filter(Boolean).join('. ') ||
    'Grow in fertile, moist but well-drained soil in sun or partial shade.';

  // Pruning fields from live RHS pruning text
  const rawPruning = stripRhsHtml(source.pruning);
  const pruneGroupMatch = rawPruning.match(/Pruning group\s+\d+/i);
  const pruneType = pruneGroupMatch
    ? `RHS ${pruneGroupMatch[0]}`
    : plantTypeLabels[0]
    ? `${plantTypeLabels[0]} Formative & Seasonal Trim`
    : 'RHS Seasonal Maintenance Pruning';

  const pruneMonthsMatch = rawPruning.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December|spring|summer|autumn|winter|after flowering)[^.]*/i
  );
  const pruneMonthsUk = pruneMonthsMatch
    ? capitalizeTitle(pruneMonthsMatch[0].trim())
    : isEvergreen
    ? 'Mid- to late spring (April to May)'
    : 'Late winter to early spring (February to March)';

  const pruneTechnique =
    rawPruning ||
    'Remove dead, diseased, or crossing stems cleanly above an outward-facing bud and deadhead spent blooms.';

  const pruneAvoidMatch = rawPruning.match(/Avoid[^.]+\./i);
  const pruneAvoid = pruneAvoidMatch
    ? pruneAvoidMatch[0].trim()
    : 'Avoid pruning during hard frost or late autumn when new cuts are vulnerable to winter dieback.';

  // Feeding schedule tailored to RHS category & pH
  const feedWindowUk =
    groupCategory === 'VEGETABLES'
      ? 'March to September (active cropping season)'
      : 'March to July (spring growth & bud formation)';
  const feedTypeNpk = isAcidOnly
    ? 'Ericaceous Liquid Iron & Sequestered Feed + Pine Bark Mulch'
    : groupCategory === 'FLOWERS' || groupCategory === 'VEGETABLES'
    ? 'High-Potash Liquid Feed (NPK 4-5-8) + Spring Pelleted Fertiliser'
    : 'Slow-Release Balanced Granular Feed (NPK 7-7-7) + Organic Mulch';
  const feedFrequencyDosage =
    groupCategory === 'FLOWERS' || groupCategory === 'VEGETABLES'
      ? 'Apply granular feed in March (50g/sq m) and liquid potash feed fortnightly during flowering/fruiting.'
      : 'Apply a single spring top-dressing in March/April followed by a 5–8cm organic bark or compost mulch.';

  // Overwintering protocol tailored to RHS hardiness & moisture
  const overwinteringProtocol =
    rhsRating === 'H1a' || rhsRating === 'H1b' || rhsRating === 'H1c' || rhsRating === 'H2'
      ? `RHS ${rhsRating} Tender Specimen: Move containers into a frost-free greenhouse, conservatory, or bright porch before night temperatures drop below 5°C. Keep compost barely moist over winter.`
      : rhsRating === 'H3'
      ? `RHS H3 Half-Hardy Specimen: Needs winter protection in heavy clay. Raise pots onto feet in a sheltered south-facing courtyard, wrap with 30gsm horticultural fleece during sub-zero spells, and mulch crowns deeply with dry bark.`
      : `RHS ${rhsRating} Hardy Specimen: Hardy across most of the UK${
          exposureLabels.includes('Sheltered') ? ' in a sheltered position' : ''
        }. Mulch root zone with 5–8cm of organic matter in autumn and prevent winter waterlogging in heavy clay.`;

  // Description / Disambiguation summary from live RHS entityDescription
  const descText = stripRhsHtml(source.entityDescription || hit?.entityDescription || source.genusDescription || '');
  const sizeParts: string[] = [];
  if (source.height) sizeParts.push(`Height: ${source.height}`);
  if (source.spread) sizeParts.push(`Spread: ${source.spread}`);
  if (foliageLabels.length > 0) sizeParts.push(foliageLabels.join('/'));
  if (plantTypeLabels.length > 0) sizeParts.push(plantTypeLabels.join(', '));

  const idDisambiguationNote = [sizeParts.join(' · '), descText].filter(Boolean).join(' — ') || undefined;

  const vulnerabilities = extractRhsVulnerabilities(
    source.pestResistance,
    source.diseaseResistance,
    rhsRating,
    source.moisture
  );

  const rhsUrl = rhsId > 0 ? `https://www.rhs.org.uk/plants/${rhsId}/-/details` : undefined;

  return {
    catalogId: rhsId > 0 ? `rhs-${rhsId}` : `rhs-live-${botanicalName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    rhsPlantId: rhsId > 0 ? rhsId : undefined,
    name: displayName,
    commonName,
    botanicalName,
    category: groupCategory,
    groupCategory,
    rhsRating,
    recommendedLocation,
    defaultOctGrowthStage,
    vulnerabilities,
    soilAndSun,
    feedWindowUk,
    feedTypeNpk,
    feedFrequencyDosage,
    pruneMonthsUk,
    pruneType,
    pruneTechnique,
    pruneAvoid,
    overwinteringProtocol,
    idDisambiguationNote,
    photoUrl,
    rhsUrl,
    isAgm: Boolean(source.isAgm ?? hit?.isAgm),
    isPollinatorFriendly: Boolean(source.isPlantsForPollinators ?? hit?.isPlantsForPollinators),
    height: source.height || undefined,
    spread: source.spread || undefined
  };
}

// ============================================================================
// SERVER-SIDE BOUNDED CACHES FOR LIVE RHS API RESPONSES
// ============================================================================
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const RHS_DETAIL_CONCURRENCY = 6;

const rhsDetailCache = new TtlCache<number, any | null>({
  ttlMs: CACHE_TTL_MS,
  maxEntries: 300
});
const rhsSearchCache = new TtlCache<
  string,
  {
    source: 'RHS_LIVE_API' | 'LOCAL_FALLBACK';
    totalHits: number;
    count: number;
    plants: RhsCatalogPlant[];
  }
>({
  ttlMs: CACHE_TTL_MS,
  maxEntries: 120
});

export async function fetchRawRhsPlantDetail(rhsId: number): Promise<any | null> {
  if (!Number.isFinite(rhsId) || rhsId <= 0) return null;

  return rhsDetailCache.getOrFetch(
    rhsId,
    async () => {
      try {
        const res = await fetch(`${RHS_LIVE_API_BASE}/api/v1/plants/details/${rhsId}`, {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; LoamyGardenCompanion/1.0)'
          },
          signal: AbortSignal.timeout(6000)
        });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    },
    (data) => data !== null
  );
}

export async function searchLiveRhsWebsite(
  query: string = '',
  categoryFilter: string = 'ALL',
  limit: number = 14,
  offset: number = 0
): Promise<{
  source: 'RHS_LIVE_API' | 'LOCAL_FALLBACK';
  totalHits: number;
  count: number;
  plants: RhsCatalogPlant[];
}> {
  const cleanQuery = query.trim();
  const safeLimit = Math.min(Math.max(1, Number(limit) || 14), 24);
  const safeOffset = Math.max(0, Number(offset) || 0);
  const cacheKey = `${cleanQuery.toLowerCase()}|${categoryFilter}|${safeLimit}|${safeOffset}`;

  return rhsSearchCache.getOrFetch(
    cacheKey,
    async () => {
      try {
        const plantTypes = CATEGORY_TO_RHS_PLANT_TYPES[categoryFilter] || undefined;
        const requestBody: Record<string, any> = {
          startFrom: safeOffset,
          pageSize: safeLimit,
          keywords: cleanQuery
        };

        if (plantTypes && plantTypes.length > 0) {
          requestBody.plantTypes = plantTypes;
        }

        // When browsing with an empty search query, show RHS Award of Garden Merit (AGM) plants
        if (!cleanQuery) {
          requestBody.isAgm = true;
        }

        const searchRes = await fetch(`${RHS_LIVE_API_BASE}/api/v1/plants/search/advanced`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; LoamyGardenCompanion/1.0)'
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(7000)
        });

        if (!searchRes.ok) {
          throw new Error(`RHS live search returned HTTP ${searchRes.status}`);
        }

        const searchData = await searchRes.json();
        const rawHits: any[] = Array.isArray(searchData?.hits) ? searchData.hits : [];
        const totalHits = Number(searchData?.totalHit ?? rawHits.length);

        // Enrich top hits with bounded concurrency (avoids opening 24 simultaneous HTTPS sockets)
        const enrichedPlants = await mapWithConcurrency(
          rawHits.slice(0, safeLimit),
          RHS_DETAIL_CONCURRENCY,
          async (hit) => {
            const detail = hit?.id ? await fetchRawRhsPlantDetail(Number(hit.id)) : null;
            return normalizeLiveRhsPlant(hit, detail);
          }
        );

        return {
          source: 'RHS_LIVE_API' as const,
          totalHits,
          count: enrichedPlants.length,
          plants: enrichedPlants
        };
      } catch {
        // Graceful offline fallback to local RHS reference catalogue if network is unavailable
        const fallbackPlants = searchRhsPlantCatalog(cleanQuery, categoryFilter).slice(
          safeOffset,
          safeOffset + safeLimit
        );
        return {
          source: 'LOCAL_FALLBACK' as const,
          totalHits: fallbackPlants.length,
          count: fallbackPlants.length,
          plants: fallbackPlants
        };
      }
    },
    (payload) => payload.source === 'RHS_LIVE_API'
  );
}
