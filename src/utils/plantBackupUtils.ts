import { resolvePlantGroupCategory } from './rhsPlantCatalog';

export interface PlantBackupRecord {
  id: string;
  name: string;
  category?: string;
  rhsRating: string;
  location: string;
  growthStage: string;
  vulnerabilities: string[];
}

export interface GardenPlantsBackupPayload {
  format: 'LOAMY_GARDEN_PLANTS_BACKUP';
  version: 1;
  exportedAt: string;
  locationName?: string;
  plantCount: number;
  plants: PlantBackupRecord[];
}

export type ParsePlantsBackupResult =
  | {
      ok: true;
      plants: PlantBackupRecord[];
      exportedAt?: string;
      locationName?: string;
    }
  | {
      ok: false;
      error: string;
    };

export function normalizeBackupPlantRecord(
  raw: unknown,
  fallbackIndex = 0
): PlantBackupRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;

  const rawName = typeof item.name === 'string' ? item.name.trim() : '';
  if (!rawName) return null;

  const rawId =
    typeof item.id === 'string' && item.id.trim()
      ? item.id.trim()
      : `plt-import-${fallbackIndex + 1}-${rawName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')}`;

  const rawCategory =
    typeof item.category === 'string' && item.category.trim()
      ? item.category.trim().toUpperCase()
      : '';
  const validCategories = new Set(['SHRUBS', 'FLOWERS', 'VEGETABLES', 'FOLIAGE']);
  const category = validCategories.has(rawCategory)
    ? rawCategory
    : resolvePlantGroupCategory({ name: rawName, category: rawCategory });

  const rhsRating =
    typeof item.rhsRating === 'string' && /^H[1-7][a-c]?$/i.test(item.rhsRating.trim())
      ? item.rhsRating.trim().toUpperCase()
      : 'H4';

  const location =
    typeof item.location === 'string' && item.location.trim()
      ? item.location.trim()
      : 'Main Garden Border';

  const growthStage =
    typeof item.growthStage === 'string' && item.growthStage.trim()
      ? item.growthStage.trim()
      : 'Established';

  let vulnerabilities: string[] = [];
  if (Array.isArray(item.vulnerabilities)) {
    vulnerabilities = item.vulnerabilities
      .map((v) => (typeof v === 'string' ? v.trim() : ''))
      .filter(Boolean);
  } else if (typeof item.vulnerabilities === 'string' && item.vulnerabilities.trim()) {
    vulnerabilities = item.vulnerabilities
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }

  return {
    id: rawId,
    name: rawName,
    category,
    rhsRating,
    location,
    growthStage,
    vulnerabilities,
  };
}

export function createGardenPlantsBackupPayload(
  plants: PlantBackupRecord[],
  options?: { locationName?: string; exportedAt?: string }
): GardenPlantsBackupPayload {
  const normalizedPlants: PlantBackupRecord[] = [];
  for (let i = 0; i < (plants || []).length; i++) {
    const normalized = normalizeBackupPlantRecord(plants[i], i);
    if (normalized) {
      normalizedPlants.push(normalized);
    }
  }

  return {
    format: 'LOAMY_GARDEN_PLANTS_BACKUP',
    version: 1,
    exportedAt: options?.exportedAt || new Date().toISOString(),
    ...(options?.locationName ? { locationName: options.locationName } : {}),
    plantCount: normalizedPlants.length,
    plants: normalizedPlants,
  };
}

export function serializeGardenPlantsBackup(
  plants: PlantBackupRecord[],
  options?: { locationName?: string; exportedAt?: string }
): string {
  const payload = createGardenPlantsBackupPayload(plants, options);
  return JSON.stringify(payload, null, 2);
}

export function parseAndValidatePlantsBackup(rawJson: string): ParsePlantsBackupResult {
  const trimmed = (rawJson || '').trim();
  if (!trimmed) {
    return {
      ok: false,
      error: 'Please select a backup JSON file or paste backup JSON content first.',
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return {
      ok: false,
      error: 'Invalid JSON format. Please upload or paste a valid Loamy garden plants backup (.json).',
    };
  }

  let rawPlantList: unknown[] | null = null;
  let exportedAt: string | undefined;
  let locationName: string | undefined;

  if (Array.isArray(parsed)) {
    rawPlantList = parsed;
  } else if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.plants)) {
      rawPlantList = obj.plants;
    } else if (Array.isArray(obj.plantInventory)) {
      rawPlantList = obj.plantInventory;
    }
    if (typeof obj.exportedAt === 'string') {
      exportedAt = obj.exportedAt;
    }
    if (typeof obj.locationName === 'string') {
      locationName = obj.locationName;
    }
  }

  if (!rawPlantList) {
    return {
      ok: false,
      error: 'Backup file does not contain a "plants" array.',
    };
  }

  const validPlants: PlantBackupRecord[] = [];
  const seenKeys = new Set<string>();

  for (let i = 0; i < rawPlantList.length; i++) {
    const normalized = normalizeBackupPlantRecord(rawPlantList[i], i);
    if (!normalized) continue;
    const dedupeKey = `${normalized.id.toLowerCase()}::${normalized.name.toLowerCase()}`;
    if (seenKeys.has(dedupeKey)) continue;
    seenKeys.add(dedupeKey);
    validPlants.push(normalized);
  }

  if (validPlants.length === 0) {
    return {
      ok: false,
      error: 'No valid plant records were found in the backup file.',
    };
  }

  return {
    ok: true,
    plants: validPlants,
    exportedAt,
    locationName,
  };
}

export function applyPlantsBackupImport(
  currentPlants: PlantBackupRecord[],
  importedPlants: PlantBackupRecord[],
  mode: 'MERGE' | 'REPLACE'
): {
  nextPlants: PlantBackupRecord[];
  addedCount: number;
  updatedCount: number;
  totalCount: number;
} {
  if (mode === 'REPLACE') {
    const uniqueReplaced: PlantBackupRecord[] = [];
    const seenNames = new Set<string>();
    for (const plant of importedPlants) {
      const key = plant.name.trim().toLowerCase();
      if (seenNames.has(key)) continue;
      seenNames.add(key);
      uniqueReplaced.push(plant);
    }
    return {
      nextPlants: uniqueReplaced,
      addedCount: uniqueReplaced.length,
      updatedCount: 0,
      totalCount: uniqueReplaced.length,
    };
  }

  // MERGE mode: update existing plants by id or case-insensitive name, and add new ones
  const result = [...currentPlants];
  const indexById = new Map<string, number>();
  const indexByName = new Map<string, number>();

  for (let i = 0; i < result.length; i++) {
    indexById.set(result[i].id.toLowerCase(), i);
    indexByName.set(result[i].name.trim().toLowerCase(), i);
  }

  let addedCount = 0;
  let updatedCount = 0;
  const newlyAdded: PlantBackupRecord[] = [];

  for (const incoming of importedPlants) {
    const idKey = incoming.id.toLowerCase();
    const nameKey = incoming.name.trim().toLowerCase();
    const existingIdx = indexById.get(idKey) ?? indexByName.get(nameKey);

    if (existingIdx !== undefined) {
      result[existingIdx] = {
        ...result[existingIdx],
        ...incoming,
        id: result[existingIdx].id,
      };
      updatedCount++;
    } else {
      newlyAdded.push(incoming);
      indexById.set(idKey, -1);
      indexByName.set(nameKey, -1);
      addedCount++;
    }
  }

  const nextPlants = [...newlyAdded, ...result];
  return {
    nextPlants,
    addedCount,
    updatedCount,
    totalCount: nextPlants.length,
  };
}
