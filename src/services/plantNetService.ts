import {
  RhsCatalogPlant,
  PlantGroupCategoryId,
  searchRhsPlantCatalog,
  resolvePlantGroupCategory
} from '../utils/rhsPlantCatalog.ts';
import { searchLiveRhsWebsite } from './rhsLiveService.ts';

export const PLANTNET_API_BASE = 'https://my-api.plantnet.org/v2';

// Server-side Pl@ntNet API key (reads env var first, with configured key fallback)
function getPlantNetApiKey(): string {
  return (process.env.PLANTNET_API_KEY || '2b10d0G8owpWT1BXqrHPZbKbk').trim();
}

export interface PlantNetRawSpecies {
  id: string | number;
  commonNames?: string[];
  genus?: string | null;
  scientificNameWithoutAuthor: string;
  scientificNameAuthorship?: string | null;
  gbifId?: number | string | null;
  powoId?: string | null;
  iucnCategory?: string | null;
}

/**
 * Maps common UK English plant names to their botanical genus so Pl@ntNet /v2/species?prefix=...
 * works seamlessly whether the user types a common name ("Lavender", "Rose", "Maple") or a
 * scientific name ("Lavandula", "Rosa", "Acer").
 */
export const COMMON_NAME_TO_GENUS_MAP: Record<string, string> = {
  lavender: 'Lavandula',
  'english lavender': 'Lavandula angustifolia',
  'french lavender': 'Lavandula stoechas',
  rose: 'Rosa',
  roses: 'Rosa',
  maple: 'Acer',
  'japanese maple': 'Acer palmatum',
  fuchsia: 'Fuchsia',
  hydrangea: 'Hydrangea',
  peony: 'Paeonia',
  hosta: 'Hosta',
  plantain: 'Hosta',
  coneflower: 'Echinacea',
  echinacea: 'Echinacea',
  foxglove: 'Digitalis',
  daffodil: 'Narcissus',
  tulip: 'Tulipa',
  crocus: 'Crocus',
  snowdrop: 'Galanthus',
  bluebell: 'Hyacinthoides',
  allium: 'Allium',
  agapanthus: 'Agapanthus',
  'african lily': 'Agapanthus',
  dahlia: 'Dahlia',
  clematis: 'Clematis',
  wisteria: 'Wisteria',
  camellia: 'Camellia',
  rhododendron: 'Rhododendron',
  azalea: 'Rhododendron',
  box: 'Buxus',
  boxwood: 'Buxus',
  holly: 'Ilex',
  yew: 'Taxus',
  ivy: 'Hedera',
  honeysuckle: 'Lonicera',
  jasmine: 'Jasminum',
  magnolia: 'Magnolia',
  lilac: 'Syringa',
  viburnum: 'Viburnum',
  buddleja: 'Buddleja',
  'butterfly bush': 'Buddleja',
  geranium: 'Geranium',
  cranesbill: 'Geranium',
  pelargonium: 'Pelargonium',
  begonia: 'Begonia',
  petunia: 'Petunia',
  marigold: 'Tagetes',
  'sweet pea': 'Lathyrus',
  poppy: 'Papaver',
  iris: 'Iris',
  lily: 'Lilium',
  sunflower: 'Helianthus',
  rudbeckia: 'Rudbeckia',
  lupin: 'Lupinus',
  delphinium: 'Delphinium',
  salvia: 'Salvia',
  sage: 'Salvia',
  rosemary: 'Salvia rosmarinus',
  thyme: 'Thymus',
  mint: 'Mentha',
  basil: 'Ocimum',
  parsley: 'Petroselinum',
  chives: 'Allium schoenoprasum',
  oregano: 'Origanum',
  verbena: 'Verbena',
  heuchera: 'Heuchera',
  'coral bells': 'Heuchera',
  hellebore: 'Helleborus',
  astilbe: 'Astilbe',
  sedum: 'Hylotelephium',
  stonecrop: 'Sedum',
  bamboo: 'Fargesia',
  cordyline: 'Cordyline',
  'cabbage palm': 'Cordyline australis',
  'tree fern': 'Dicksonia',
  fern: 'Dryopteris',
  olive: 'Olea',
  fig: 'Ficus',
  lemon: 'Citrus',
  citrus: 'Citrus',
  apple: 'Malus',
  pear: 'Pyrus',
  plum: 'Prunus',
  cherry: 'Prunus',
  strawberry: 'Fragaria',
  raspberry: 'Rubus',
  blueberry: 'Vaccinium',
  tomato: 'Solanum lycopersicum',
  potato: 'Solanum tuberosum',
  courgette: 'Cucurbita',
  carrot: 'Daucus',
  lettuce: 'Lactuca',
  kale: 'Brassica',
  cabbage: 'Brassica',
  oak: 'Quercus',
  birch: 'Betula',
  rowan: 'Sorbus',
  hawthorn: 'Crataegus',
  heather: 'Calluna',
  pieris: 'Pieris',
  skimmia: 'Skimmia',
  fatsia: 'Fatsia',
  phormium: 'Phormium',
  carex: 'Carex',
  miscanthus: 'Miscanthus',
  stipa: 'Stipa'
};

function capitalizeFirstWord(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Resolves one or more botanical prefixes to query against Pl@ntNet's /v2/species endpoint
 * from a user's search string and optional RHS reference matches.
 */
export function resolvePlantNetPrefixes(
  rawQuery: string,
  rhsMatches: RhsCatalogPlant[] = []
): string[] {
  const clean = rawQuery.trim().replace(/\s+/g, ' ');
  if (!clean) return [];

  const lower = clean.toLowerCase();
  const prefixes = new Set<string>();

  // 1. Exact or partial match in common-name-to-genus dictionary
  if (COMMON_NAME_TO_GENUS_MAP[lower]) {
    prefixes.add(COMMON_NAME_TO_GENUS_MAP[lower]);
    prefixes.add(COMMON_NAME_TO_GENUS_MAP[lower].split(' ')[0]);
  } else {
    for (const [commonKey, genusVal] of Object.entries(COMMON_NAME_TO_GENUS_MAP)) {
      if (commonKey.includes(lower) || lower.includes(commonKey)) {
        prefixes.add(genusVal.split(' ')[0]);
        break;
      }
    }
  }

  // 2. Botanical genus extracted from matching RHS plants (if user searched a common name)
  for (const rhsPlant of rhsMatches.slice(0, 4)) {
    if (rhsPlant.botanicalName) {
      const firstWord = rhsPlant.botanicalName
        .replace(/^×\s*/, '')
        .split(/\s+/)[0]
        ?.replace(/[^A-Za-z]/g, '');
      if (firstWord && firstWord.length >= 3) {
        prefixes.add(capitalizeFirstWord(firstWord));
      }
    }
  }

  // 3. Always include the user's raw query capitalized as a direct scientific prefix
  prefixes.add(capitalizeFirstWord(clean));
  const firstToken = clean.split(' ')[0];
  if (firstToken && firstToken.length >= 3) {
    prefixes.add(capitalizeFirstWord(firstToken));
  }

  return Array.from(prefixes).slice(0, 3);
}

// ============================================================================
// SERVER-SIDE CACHE FOR PL@NTNET SPECIES QUERIES
// ============================================================================
const plantNetSpeciesCache = new Map<string, { timestamp: number; data: PlantNetRawSpecies[] }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

/**
 * Queries Pl@ntNet's official /v2/species endpoint by prefix.
 */
export async function fetchPlantNetSpeciesByPrefix(
  prefix: string,
  pageSize: number = 35
): Promise<PlantNetRawSpecies[]> {
  const cleanPrefix = prefix.trim();
  if (!cleanPrefix) return [];

  const cacheKey = `${cleanPrefix.toLowerCase()}::${pageSize}`;
  const cached = plantNetSpeciesCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const apiKey = getPlantNetApiKey();
  const url = `${PLANTNET_API_BASE}/species?lang=en&type=kt&pageSize=${pageSize}&page=1&prefix=${encodeURIComponent(
    cleanPrefix
  )}&api-key=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6500)
    });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    plantNetSpeciesCache.set(cacheKey, { timestamp: Date.now(), data });
    return data;
  } catch {
    return [];
  }
}

/**
 * Ranks Pl@ntNet species results so species with English common names and non-obscure
 * binomials appear first, especially those matching the user's query string.
 */
export function rankPlantNetSpecies(
  speciesList: PlantNetRawSpecies[],
  rawQuery: string
): PlantNetRawSpecies[] {
  const qLower = rawQuery.trim().toLowerCase();

  return [...speciesList].sort((a, b) => {
    const aCommon = Array.isArray(a.commonNames) ? a.commonNames : [];
    const bCommon = Array.isArray(b.commonNames) ? b.commonNames : [];

    const aHasCommon = aCommon.length > 0 ? 1 : 0;
    const bHasCommon = bCommon.length > 0 ? 1 : 0;
    if (aHasCommon !== bHasCommon) return bHasCommon - aHasCommon;

    if (qLower) {
      const aExactMatch =
        a.scientificNameWithoutAuthor.toLowerCase().includes(qLower) ||
        aCommon.some((cn) => cn.toLowerCase().includes(qLower))
          ? 1
          : 0;
      const bExactMatch =
        b.scientificNameWithoutAuthor.toLowerCase().includes(qLower) ||
        bCommon.some((cn) => cn.toLowerCase().includes(qLower))
          ? 1
          : 0;
      if (aExactMatch !== bExactMatch) return bExactMatch - aExactMatch;
    }

    // Prefer pure species binomials over obscure hybrids when both have common names
    const aIsHybrid = a.scientificNameWithoutAuthor.includes('×') ? 1 : 0;
    const bIsHybrid = b.scientificNameWithoutAuthor.includes('×') ? 1 : 0;
    if (aIsHybrid !== bIsHybrid) return aIsHybrid - bIsHybrid;

    if (aCommon.length !== bCommon.length) return bCommon.length - aCommon.length;

    return a.scientificNameWithoutAuthor.localeCompare(b.scientificNameWithoutAuthor);
  });
}

/**
 * Merges a Pl@ntNet species record with the closest matching RHS horticultural profile
 * (either exact species match or same-genus match from RHS) so Pl@ntNet provides the
 * authoritative plant name / taxonomy and RHS provides UK hardiness, pruning, feeding,
 * overwintering, and botanical photo.
 */
export function convertPlantNetSpeciesToCatalogPlant(
  species: PlantNetRawSpecies,
  rhsMatchesInput?: RhsCatalogPlant[] | RhsCatalogPlant | null,
  extraOptions?: {
    plantNetScore?: number;
    plantNetPhotoUrl?: string;
    familyName?: string;
    family?: string;
  }
): RhsCatalogPlant {
  const rhsMatches: RhsCatalogPlant[] = Array.isArray(rhsMatchesInput)
    ? rhsMatchesInput
    : rhsMatchesInput
      ? [rhsMatchesInput]
      : [];
  const sciName = (species.scientificNameWithoutAuthor || '').trim();
  const authorship = (species.scientificNameAuthorship || '').trim();
  const genus =
    (species.genus || sciName.replace(/^×\s*/, '').split(/\s+/)[0] || '').trim();
  const commonNames = Array.isArray(species.commonNames) ? species.commonNames.filter(Boolean) : [];
  const primaryCommonName = commonNames[0] || sciName;

  const displayName =
    primaryCommonName && primaryCommonName.toLowerCase() !== sciName.toLowerCase()
      ? `${primaryCommonName} (${sciName})`
      : sciName;

  // Find closest RHS record: 1) exact scientific name match, 2) same genus match
  const sciLower = sciName.toLowerCase();
  const genusLower = genus.toLowerCase();

  const exactRhsMatch = rhsMatches.find((r) => {
    const rBot = (r.botanicalName || '').toLowerCase();
    const rName = (r.name || r.commonName || '').toLowerCase();
    return rBot === sciLower || rBot.startsWith(sciLower + ' ') || rName.includes(sciLower);
  });

  const genusRhsMatch =
    exactRhsMatch ||
    rhsMatches.find((r) => {
      const rBot = (r.botanicalName || '').toLowerCase();
      return genusLower.length >= 3 && (rBot.startsWith(genusLower + ' ') || rBot === genusLower);
    });

  // Also check local RHS catalogue for genus/species horticultural defaults
  const localCatalogMatches = searchRhsPlantCatalog(sciName, 'ALL');
  const localGenusMatches =
    localCatalogMatches.length > 0 ? localCatalogMatches : searchRhsPlantCatalog(genus, 'ALL');
  const fallbackRhs = genusRhsMatch || localGenusMatches[0];

  const groupCategory = (
    fallbackRhs?.groupCategory ||
    fallbackRhs?.category ||
    resolvePlantGroupCategory({
      name: `${primaryCommonName} ${sciName}`,
      commonName: primaryCommonName
    })
  ) as PlantGroupCategoryId;

  const rhsRating = fallbackRhs?.rhsRating || 'H4';
  const recommendedLocation =
    fallbackRhs?.recommendedLocation || 'South-Facing Mixed Border (Heavy Clay)';
  const defaultOctGrowthStage =
    fallbackRhs?.defaultOctGrowthStage || 'Leaf Drop / Autumn Dormancy';

  const photoUrl =
    extraOptions?.plantNetPhotoUrl ||
    exactRhsMatch?.photoUrl ||
    genusRhsMatch?.photoUrl ||
    fallbackRhs?.photoUrl;

  const resolvedFamily = extraOptions?.familyName || extraOptions?.family;
  const synList = commonNames.slice(1, 5).join(', ');
  const taxonomyNoteParts: string[] = [
    `Pl@ntNet Species: ${sciName}${authorship ? ` ${authorship}` : ''}`
  ];
  if (resolvedFamily) {
    taxonomyNoteParts.push(`Family: ${resolvedFamily}`);
  }
  if (synList) {
    taxonomyNoteParts.push(`Common names: ${synList}`);
  }
  if (species.powoId) {
    taxonomyNoteParts.push(`Kew POWO: ${species.powoId}`);
  }
  if (fallbackRhs?.idDisambiguationNote) {
    taxonomyNoteParts.push(fallbackRhs.idDisambiguationNote);
  }

  const powoUrl = species.powoId
    ? `https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:${species.powoId}`
    : undefined;

  return {
    catalogId: `plantnet-${species.id || sciLower.replace(/[^a-z0-9]+/g, '-')}`,
    plantNetId: String(species.id || ''),
    rhsPlantId: exactRhsMatch?.rhsPlantId || genusRhsMatch?.rhsPlantId,
    photoRef: fallbackRhs?.photoRef,
    name: displayName,
    commonName: primaryCommonName,
    botanicalName: sciName,
    scientificNameAuthorship: authorship || undefined,
    gbifId: species.gbifId || undefined,
    powoId: species.powoId || undefined,
    family: resolvedFamily || undefined,
    plantNetScore: extraOptions?.plantNetScore,
    dataSource: fallbackRhs ? 'PLANTNET_RHS_MERGED' : 'PLANTNET_SPECIES',
    category: groupCategory,
    groupCategory,
    rhsRating,
    recommendedLocation,
    defaultOctGrowthStage,
    vulnerabilities:
      fallbackRhs?.vulnerabilities && fallbackRhs.vulnerabilities.length > 0
        ? fallbackRhs.vulnerabilities
        : ['Monitor for winter waterlogging in heavy clay and seasonal pests'],
    soilAndSun:
      fallbackRhs?.soilAndSun ||
      'Grow in fertile, moist but well-drained soil in full sun to partial shade; incorporate organic compost in heavy clay.',
    feedWindowUk: fallbackRhs?.feedWindowUk || 'March to July (active growing season)',
    feedTypeNpk:
      fallbackRhs?.feedTypeNpk ||
      'Balanced Slow-Release Organic Fertiliser + Spring Compost Mulch',
    feedFrequencyDosage:
      fallbackRhs?.feedFrequencyDosage ||
      'Top-dress in March/April and apply liquid seaweed or potash feed monthly during flowering/foliage flush.',
    pruneMonthsUk:
      fallbackRhs?.pruneMonthsUk || 'Late winter to early spring (February to March) or after flowering',
    pruneType: fallbackRhs?.pruneType || 'RHS Seasonal Maintenance & Formative Prune',
    pruneTechnique:
      fallbackRhs?.pruneTechnique ||
      'Remove dead, diseased, or crossing stems cleanly above an outward-facing bud and deadhead spent blooms.',
    pruneAvoid:
      fallbackRhs?.pruneAvoid ||
      'Avoid pruning during hard frost or late autumn when cuts are susceptible to winter dieback.',
    overwinteringProtocol:
      fallbackRhs?.overwinteringProtocol ||
      `RHS ${rhsRating}: Mulch crown zone with 5–8cm of organic bark or compost in autumn and prevent winter waterlogging.`,
    idDisambiguationNote: taxonomyNoteParts.join(' · '),
    photoUrl,
    rhsUrl: exactRhsMatch?.rhsUrl || genusRhsMatch?.rhsUrl || powoUrl,
    isAgm: Boolean(exactRhsMatch?.isAgm),
    isPollinatorFriendly: Boolean(
      exactRhsMatch?.isPollinatorFriendly ?? genusRhsMatch?.isPollinatorFriendly
    ),
    height: exactRhsMatch?.height || genusRhsMatch?.height,
    spread: exactRhsMatch?.spread || genusRhsMatch?.spread
  };
}

/**
 * Unified Plant Name Search:
 * Uses Pl@ntNet v2 (/v2/species) for plant name search and merges RHS horticultural profiles
 * so both Pl@ntNet and RHS work together seamlessly.
 */
export async function searchPlantNamesWithPlantNetAndRhs(
  query: string = '',
  category: string = 'ALL',
  limit: number = 14
): Promise<{
  source: 'PLANTNET_RHS_MERGED' | 'RHS_LIVE_API' | 'RHS_LOCAL_FALLBACK';
  totalHits: number;
  plants: RhsCatalogPlant[];
}> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return {
      source: 'PLANTNET_RHS_MERGED',
      totalHits: 0,
      plants: []
    };
  }
  const safeLimit = Math.min(Math.max(Number(limit) || 14, 1), 30);

  // 1. Fetch RHS horticultural matches in parallel so we have RHS hardiness/photos/care ready to merge
  const rhsPromise = searchLiveRhsWebsite(cleanQuery, category, Math.max(safeLimit, 12), 0);

  // 2. Determine Pl@ntNet species prefixes to query
  const prefixes = resolvePlantNetPrefixes(cleanQuery, []);

  const [rhsResult, ...plantNetBatches] = await Promise.all([
    rhsPromise,
    ...prefixes.map((prefix) => fetchPlantNetSpeciesByPrefix(prefix, 35))
  ]);

  let rawPlantNetSpecies = plantNetBatches.flat();

  // If the user searched a common name that wasn't in our static map, use the botanical genus
  // discovered by the live RHS search to query Pl@ntNet /v2/species!
  if (cleanQuery && rawPlantNetSpecies.length === 0 && rhsResult.plants.length > 0) {
    const discoveredPrefixes = resolvePlantNetPrefixes(cleanQuery, rhsResult.plants).filter(
      (p) => !prefixes.includes(p)
    );
    if (discoveredPrefixes.length > 0) {
      const extraBatches = await Promise.all(
        discoveredPrefixes.map((p) => fetchPlantNetSpeciesByPrefix(p, 30))
      );
      rawPlantNetSpecies = extraBatches.flat();
    }
  }

  // Deduplicate Pl@ntNet species by scientificNameWithoutAuthor
  const uniqueSpeciesMap = new Map<string, PlantNetRawSpecies>();
  for (const sp of rawPlantNetSpecies) {
    if (!sp || !sp.scientificNameWithoutAuthor) continue;
    const key = sp.scientificNameWithoutAuthor.toLowerCase();
    if (!uniqueSpeciesMap.has(key)) {
      uniqueSpeciesMap.set(key, sp);
    }
  }

  const rankedPlantNet = rankPlantNetSpecies(Array.from(uniqueSpeciesMap.values()), cleanQuery);

  // Convert Pl@ntNet species and enrich with RHS horticultural profiles
  const mergedPlants: RhsCatalogPlant[] = [];
  const seenBotanical = new Set<string>();

  for (const sp of rankedPlantNet) {
    const converted = convertPlantNetSpeciesToCatalogPlant(sp, rhsResult.plants);
    if (category !== 'ALL' && converted.groupCategory !== category && cleanQuery === '') {
      continue;
    }
    mergedPlants.push(converted);
    if (converted.botanicalName) {
      seenBotanical.add(converted.botanicalName.toLowerCase());
    }
    if (mergedPlants.length >= safeLimit) break;
  }

  // Also append top RHS cultivar matches that weren't already covered so both datasets work together
  if (mergedPlants.length < safeLimit && rhsResult.plants.length > 0) {
    for (const rhsPlant of rhsResult.plants) {
      const botKey = (rhsPlant.botanicalName || rhsPlant.name).toLowerCase();
      if (!seenBotanical.has(botKey)) {
        seenBotanical.add(botKey);
        mergedPlants.push({
          ...rhsPlant,
          dataSource: 'RHS_LIVE_API'
        });
      }
      if (mergedPlants.length >= safeLimit) break;
    }
  }

  const normalizedRhsSource: 'RHS_LIVE_API' | 'RHS_LOCAL_FALLBACK' =
    rhsResult.source === 'RHS_LIVE_API' ? 'RHS_LIVE_API' : 'RHS_LOCAL_FALLBACK';

  if (mergedPlants.length > 0) {
    return {
      source: rankedPlantNet.length > 0 ? 'PLANTNET_RHS_MERGED' : normalizedRhsSource,
      totalHits: rankedPlantNet.length + (rhsResult.totalHits || 0),
      plants: mergedPlants.slice(0, safeLimit)
    };
  }

  return {
    source: normalizedRhsSource,
    totalHits: rhsResult.totalHits || rhsResult.plants.length,
    plants: rhsResult.plants
  };
}

/**
 * Identifies a plant from a photo using Pl@ntNet's POST /v2/identify/{project} endpoint
 * and enriches each identified species with RHS horticultural care data.
 */
export async function identifyPlantPhotoWithPlantNet(options: {
  imageBase64: string;
  mimeType?: string;
  organ?: 'auto' | 'flower' | 'leaf' | 'fruit' | 'bark';
  project?: string;
}): Promise<{
  bestMatch: string;
  predictedOrgan?: string;
  results: RhsCatalogPlant[];
}> {
  const { imageBase64, mimeType = 'image/jpeg', organ = 'auto', project = 'all' } = options;
  const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '').trim();
  if (!cleanBase64) {
    throw new Error('Image data is required for Pl@ntNet identification.');
  }

  const buffer = Buffer.from(cleanBase64, 'base64');
  const blob = new Blob([buffer], { type: mimeType });
  const formData = new FormData();
  formData.append('images', blob, 'plant-photo.jpg');
  formData.append('organs', organ);

  const apiKey = getPlantNetApiKey();
  const url = `${PLANTNET_API_BASE}/identify/${encodeURIComponent(
    project
  )}?include-related-images=true&no-reject=false&lang=en&api-key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(12000)
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(
      `Pl@ntNet photo identification returned HTTP ${res.status}${errText ? `: ${errText.slice(0, 120)}` : ''}`
    );
  }

  const payload = await res.json();
  const rawResults: any[] = Array.isArray(payload?.results) ? payload.results.slice(0, 5) : [];
  const predictedOrgan = payload?.predictedOrgans?.[0]?.organ || organ;

  // Enrich top matches with RHS horticultural data in parallel
  const enrichedResults = await Promise.all(
    rawResults.map(async (item: any) => {
      const sp = item?.species || {};
      const sciName = sp.scientificNameWithoutAuthor || '';
      const genusName = sp.genus?.scientificNameWithoutAuthor || sciName.split(' ')[0] || '';
      const familyName = sp.family?.scientificNameWithoutAuthor || '';
      const firstImageUrl =
        item?.images?.[0]?.url?.m ||
        item?.images?.[0]?.url?.o ||
        item?.images?.[0]?.url?.s ||
        undefined;

      let rhsMatches: RhsCatalogPlant[] = [];
      if (sciName) {
        try {
          const rhsRes = await searchLiveRhsWebsite(sciName, 'ALL', 3, 0);
          rhsMatches = rhsRes.plants;
        } catch {
          rhsMatches = [];
        }
      }

      const rawSpeciesObj: PlantNetRawSpecies = {
        id: String(item?.gbif?.id || item?.powo?.id || sciName),
        commonNames: Array.isArray(sp.commonNames) ? sp.commonNames : [],
        genus: genusName || null,
        scientificNameWithoutAuthor: sciName,
        scientificNameAuthorship: sp.scientificNameAuthorship || null,
        gbifId: item?.gbif?.id || null,
        powoId: item?.powo?.id || null,
        iucnCategory: null
      };

      return convertPlantNetSpeciesToCatalogPlant(rawSpeciesObj, rhsMatches, {
        plantNetScore: typeof item?.score === 'number' ? Number((item.score * 100).toFixed(1)) : undefined,
        plantNetPhotoUrl: firstImageUrl,
        familyName
      });
    })
  );

  return {
    bestMatch: payload?.bestMatch || enrichedResults[0]?.botanicalName || 'Identified Plant',
    predictedOrgan,
    results: enrichedResults
  };
}
