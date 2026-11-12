import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG, msToMph, kmhToMph, msToKmh, round1, normaliseForecastData } from '../../metOfficeProxy.js';
import { calculateClaySoilSaturation, SOIL_RAINFALL_SCHEMA_SQL } from '../db/soilLogsDb';
import {
  ADVISOR_CONFIG,
  UK_GARDEN_LOCATION_DIRECTORY,
  getGardenLocationSuggestions,
  convertGeocodeResultToSuggestion,
  buildRuleBasedHorticulturalAdvice,
  resolveGardenLocationProfile,
  saveGardenProfileToStorage,
  loadSavedGardenProfileFromStorage,
  clearSavedGardenProfileFromStorage,
  GARDEN_PROFILE_STORAGE_KEY,
  formatUkDateTime
} from '../gardenAdvisorService.js';
import {
  MONTHLY_CLAY_PROFILES,
  getCurrentUkMonthIndex,
  getMonthlyClayChecklist,
  filterMonthlyTasks,
  calculateChecklistProgress
} from './monthlyClayChecklist';
import {
  prepare30DaySoilSeries,
  compute30DayTrendMetrics
} from './soilChartUtils';
import { getAllSoilRainfallLogs } from '../db/soilLogsDb';
import {
  searchRhsPlantCatalog,
  RHS_PLANT_CATALOG,
  HADSTON_GARDEN_COLLECTION_32,
  getHadston32InventoryRecords,
  getAllRhsCatalogInventoryRecords,
  PLANT_CATEGORY_DEFINITIONS,
  resolvePlantGroupCategory,
  groupPlantInventoryByCategory,
  doesTextMentionUkMonth,
  getPlantMonthlyCareStatus
} from './rhsPlantCatalog';
import {
  HADSTON_MONTH_BY_MONTH_WEEKLY_CALENDAR,
  HADSTON_LOCAL_RISK_MITIGATION,
  generateHadstonMasterGuideMarkdown,
  getDynamicFortnightlyCareSchedule
} from './hadstonMasterGuide';

test('No default location is pre-set on initial load and RHS Zone H4 thresholds are preserved', () => {
  assert.equal(CONFIG.DEFAULT_LAT, null);
  assert.equal(CONFIG.DEFAULT_LON, null);
  assert.equal(CONFIG.DEFAULT_REGION_CODE, 'uk');
  assert.equal(CONFIG.THRESHOLDS.GROUND_FROST_TEMP_C, 2.0);
  assert.equal(CONFIG.THRESHOLDS.AIR_FROST_TEMP_C, 0.0);
  assert.equal(CONFIG.THRESHOLDS.WIND_ROCK_GUST_MPH, 25.0);
  assert.equal(CONFIG.THRESHOLDS.WIND_ROCK_GUST_KMH, 40.0);
  assert.equal(CONFIG.THRESHOLDS.WATERLOGGING_72H_MM, 30.0);
  assert.equal(ADVISOR_CONFIG.DEFAULT_GARDEN_PROFILE.locationName, '');
  assert.equal(ADVISOR_CONFIG.DEFAULT_GARDEN_PROFILE.latitude, null);
  assert.equal(ADVISOR_CONFIG.DEFAULT_GARDEN_PROFILE.longitude, null);
  assert.equal(ADVISOR_CONFIG.DEFAULT_GARDEN_PROFILE.rhsHardinessZone, 'H4');
  assert.deepEqual(ADVISOR_CONFIG.DEFAULT_PLANT_INVENTORY, []);
});

test('msToMph, kmhToMph, msToKmh and round1 convert meteorological values accurately', () => {
  assert.equal(msToMph(10), 22.4);
  assert.equal(kmhToMph(46.8), 29.1);
  assert.equal(msToKmh(10), 36.0);
  assert.equal(msToKmh(12.5), 45.0);
  assert.equal(msToKmh(NaN), null);
  assert.equal(round1(4.567), 4.6);
});

test('normaliseForecastData flags frost, wind-rock, and waterlogging hazards', () => {
  const sampleHourly = {
    features: [
      {
        geometry: { coordinates: [-1.0803, 53.9591, 35] },
        properties: {
          location: { name: 'York' },
          modelRunDate: '2026-10-24T06:00:00Z',
          timeSeries: [
            {
              time: '2026-10-24T03:00:00Z',
              screenTemperature: -0.4,
              minScreenAirTemp: -0.8,
              maxScreenAirTemp: 1.2,
              screenRelativeHumidity: 94,
              totalPrecipAmount: 18.5,
              windSpeed10m: 8.0,
              windGustSpeed10m: 12.5, // 45 km/h >= 40 km/h
              significantWeatherCode: 15
            },
            {
              time: '2026-10-24T06:00:00Z',
              screenTemperature: 1.5,
              minScreenAirTemp: 1.2,
              maxScreenAirTemp: 2.0,
              screenRelativeHumidity: 92,
              totalPrecipAmount: 14.0, // cumulative 32.5 mm >= 30 mm
              windSpeed10m: 6.0,
              windGustSpeed10m: 9.0,
              significantWeatherCode: 12
            }
          ]
        }
      }
    ]
  };

  const sampleDaily = {
    features: [
      {
        properties: {
          timeSeries: [
            {
              time: '2026-10-24T00:00:00Z',
              dayMaxScreenTemperature: 9.4,
              nightMinScreenTemperature: -0.8,
              midday10MWindGust: 12.5,
              daySignificantWeatherCode: 15,
              nightSignificantWeatherCode: 0
            }
          ]
        }
      }
    ]
  };

  const result = normaliseForecastData(sampleHourly, sampleDaily);
  assert.equal(result.location.name, 'York');
  assert.equal(result.hazardSummary.frostRiskDetected, true);
  assert.equal(result.hazardSummary.windRockRiskDetected, true);
  assert.equal(result.hazardSummary.waterloggingRiskDetected, true);
  assert.equal(result.hazardSummary.cumulativePrecip48hMm, 32.5);
});

test('calculateClaySoilSaturation models heavy clay waterlogging and SQL schema accommodates rainfall & saturation', () => {
  assert.ok(SOIL_RAINFALL_SCHEMA_SQL.includes('historical_rainfall_soil_logs'));
  assert.ok(SOIL_RAINFALL_SCHEMA_SQL.includes('rainfall_48h_mm'));
  assert.ok(SOIL_RAINFALL_SCHEMA_SQL.includes('soil_saturation_pct'));

  const wetResult = calculateClaySoilSaturation({ rainfall24hMm: 16.0, rainfall48hMm: 32.0 });
  assert.equal(wetResult.waterloggingHazard, true);
  assert.equal(wetResult.drainageState, 'WATERLOGGED_CLAY');
  assert.ok(wetResult.soilSaturationPct >= 85);

  const moderateResult = calculateClaySoilSaturation({ rainfall24hMm: 2.0, rainfall48hMm: 5.0 });
  assert.equal(moderateResult.waterloggingHazard, false);
  assert.equal(moderateResult.drainageState, 'FIELD_CAPACITY');
});

test('buildRuleBasedHorticulturalAdvice returns empty alerts when no plants are selected and produces valid schema output for selected garden plants', () => {
  const weatherFixture = {
    hazardSummary: {
      frostRiskDetected: true,
      lowestForecastTempC: -0.5,
      windRockRiskDetected: true,
      maxForecastGustKmh: 45.0,
      waterloggingRiskDetected: true,
      cumulativePrecip48hMm: 34.0
    },
    dailyForecast: [{ date: '2026-10-25', minTempC: -0.5, peakWindGustKmh: 45.0 }]
  };

  // 1. No selected plants -> empty weatherAlerts and seasonalTasks
  const emptyAdvice = buildRuleBasedHorticulturalAdvice(weatherFixture, []);
  assert.deepEqual(emptyAdvice.weatherAlerts, []);
  assert.deepEqual(emptyAdvice.seasonalTasks, []);

  // 2. Selected plants -> alerts and tasks strictly for the selected plants
  const selectedPlants = [
    {
      id: 'rhs-lavender',
      name: 'English Lavender (Lavandula angustifolia)',
      rhsRating: 'H5',
      location: 'Sunny South-Facing Border',
      growthStage: 'Established Shrub',
      vulnerabilities: ['Winter waterlogging in heavy clay']
    },
    {
      id: 'rhs-salvia',
      name: 'Mealycup Sage (Salvia farinacea)',
      rhsRating: 'H3',
      location: 'Terracotta Patio Pots',
      growthStage: 'Late Flowering / Pre-Dormancy',
      vulnerabilities: ['Frost below -2°C']
    }
  ];

  const advice = buildRuleBasedHorticulturalAdvice(weatherFixture, selectedPlants);
  assert.ok(Array.isArray(advice.weatherAlerts));
  assert.ok(advice.weatherAlerts.length >= 2);
  assert.ok(Array.isArray(advice.seasonalTasks));
  assert.ok(advice.seasonalTasks.length >= 2);
  assert.ok(typeof advice.soilAndMicroclimateNote === 'string');
});

test('monthlyClayChecklist returns empty tasks when no plants are selected and builds tasks strictly from selected garden plants', () => {
  assert.equal(MONTHLY_CLAY_PROFILES.length, 12);

  // Verify October (month index 9) detection for 2026-10-24
  const octDate = new Date('2026-10-24T12:00:00Z');
  assert.equal(getCurrentUkMonthIndex(octDate), 9);

  // Empty inventory returns 0 tasks (no default plants)
  const emptyOctProfile = getMonthlyClayChecklist(9, []);
  assert.equal(emptyOctProfile.monthName, 'October');
  assert.equal(emptyOctProfile.tasks.length, 0);

  // Selected plants generate tasks strictly for those plants
  const selectedPlants = [
    {
      id: 'rhs-lavender',
      name: 'English Lavender (Lavandula angustifolia)',
      rhsRating: 'H5',
      location: 'Sunny South-Facing Border',
      growthStage: 'Established Shrub',
      vulnerabilities: ['Winter waterlogging in heavy clay']
    },
    {
      id: 'rhs-rose',
      name: "Shrub Rose 'Gertrude Jekyll'",
      rhsRating: 'H6',
      location: 'Main Clay Border',
      growthStage: 'Autumn Dormancy Prep',
      vulnerabilities: ['Wind-rock in wet clay']
    }
  ];

  const octProfile = getMonthlyClayChecklist(9, selectedPlants);
  assert.equal(octProfile.monthName, 'October');
  assert.equal(octProfile.tasks.length, 4);
  assert.ok(octProfile.tasks.some((t) => t.title.includes('English Lavender')));

  const soilOnly = filterMonthlyTasks(octProfile.tasks, 'SOIL_CARE');
  assert.equal(soilOnly.length, 1);
  assert.ok(soilOnly.every((t) => t.category === 'SOIL_CARE'));

  const progress = calculateChecklistProgress(octProfile.tasks, {
    [octProfile.tasks[0].id]: true,
    [octProfile.tasks[1].id]: true
  });
  assert.equal(progress.completedCount, 2);
  assert.equal(progress.totalCount, octProfile.tasks.length);
  assert.equal(progress.percentComplete, Math.round((2 / octProfile.tasks.length) * 100));
});

test('prepare30DaySoilSeries and compute30DayTrendMetrics order 30-day logs chronologically for D3 line chart', () => {
  const { logs } = getAllSoilRainfallLogs();
  assert.ok(logs.length >= 10);

  const series = prepare30DaySoilSeries(logs, 30);
  assert.ok(series.length >= 10);
  // Verify ascending chronological order (oldest first -> newest last)
  for (let i = 1; i < series.length; i++) {
    assert.ok(series[i].date.getTime() >= series[i - 1].date.getTime());
  }

  const metrics = compute30DayTrendMetrics(series);
  assert.equal(metrics.pointCount, series.length);
  assert.ok(metrics.maxSaturationPct >= 90);
  assert.ok(metrics.minSaturationPct <= 50);
  assert.ok(metrics.daysAboveWaterloggingThreshold >= 2);
});

test('searchRhsPlantCatalog searches plants to add by cultivar, common name, and category', () => {
  assert.ok(RHS_PLANT_CATALOG.length >= 46);

  const roseResults = searchRhsPlantCatalog('Gertrude', 'ALL');
  assert.equal(roseResults.length, 1);
  assert.ok(roseResults[0].name.includes('Gertrude Jekyll'));

  const edibleResults = searchRhsPlantCatalog('', 'EDIBLE_ALLOTMENT');
  assert.ok(edibleResults.length >= 3);
  assert.ok(edibleResults.every((p) => p.category === 'EDIBLE_ALLOTMENT'));

  const garlicResults = searchRhsPlantCatalog('garlic', 'EDIBLE_ALLOTMENT');
  assert.equal(garlicResults.length, 1);
  assert.ok(garlicResults[0].name.includes('Solent Wight'));

  // Verify all 32 Hadston garden plants (#1 to #32) are present and searchable
  assert.equal(HADSTON_GARDEN_COLLECTION_32.length, 32);
  const hadstonFilterResults = searchRhsPlantCatalog('', 'HADSTON_32');
  assert.equal(hadstonFilterResults.length, 32);
  assert.equal(hadstonFilterResults[0].photoRef, 1);
  assert.ok(hadstonFilterResults[0].name.includes('Mealycup Sage'));
  assert.equal(hadstonFilterResults[31].photoRef, 32);
  assert.ok(hadstonFilterResults[31].name.includes('California Lilac'));

  const inventoryRecords = getHadston32InventoryRecords();
  assert.equal(inventoryRecords.length, 32);
});

test('Hadston Master Horticulturist Guide contains all 5 sections, 12 monthly calendars, and Markdown export tailored strictly to selected garden plants', () => {
  assert.equal(HADSTON_MONTH_BY_MONTH_WEEKLY_CALENDAR.length, 12);
  for (const m of HADSTON_MONTH_BY_MONTH_WEEKLY_CALENDAR) {
    assert.ok(m.week1To2.wateringAndSoilCare.length > 10);
    assert.ok(m.week1To2.feedingAndMulching.length > 10);
    assert.ok(m.week1To2.pruningAndDeadheading.length > 10);
    assert.ok(m.week1To2.pestDiseaseAndFrost.length > 10);
    assert.ok(m.week3To4.wateringAndSoilCare.length > 10);
    assert.ok(m.week3To4.feedingAndMulching.length > 10);
    assert.ok(m.week3To4.pruningAndDeadheading.length > 10);
    assert.ok(m.week3To4.pestDiseaseAndFrost.length > 10);
  }

  assert.ok(HADSTON_LOCAL_RISK_MITIGATION.length >= 4);

  // Empty inventory Markdown does not include unselected default plants
  const emptyMd = generateHadstonMasterGuideMarkdown('York', []);
  assert.ok(emptyMd.includes('No plants selected in My Garden Plants yet'));
  assert.ok(!emptyMd.includes('Salvia farinacea'));

  // Selected plants Markdown includes only selected plants
  const selectedMd = generateHadstonMasterGuideMarkdown('York', [
    {
      id: 'rhs-lavender',
      name: 'English Lavender (Lavandula angustifolia)',
      rhsRating: 'H5',
      location: 'Sunny South-Facing Border',
      growthStage: 'Established Shrub',
      vulnerabilities: ['Winter waterlogging in heavy clay']
    }
  ]);
  assert.ok(selectedMd.includes('Section 1: Plant Inventory & Identification Summary'));
  assert.ok(selectedMd.includes('Section 2: Month-by-Month & Weekly Task Calendar'));
  assert.ok(selectedMd.includes('Section 3: Specialized Feed & Nutrition Strategy'));
  assert.ok(selectedMd.includes('Section 4: Precision Pruning & Shaping Guide'));
  assert.ok(selectedMd.includes('Section 5: Climate & Seasonal Risk Management'));
  assert.ok(selectedMd.includes('English Lavender (Lavandula angustifolia)'));
  assert.ok(!selectedMd.includes('Salvia farinacea'));
});

test('buildRuleBasedHorticulturalAdvice adapts advice for garden location and south-facing aspect for selected plants', () => {
  assert.ok(Array.isArray(ADVISOR_CONFIG.GARDEN_LOCATION_PRESETS));
  assert.ok(ADVISOR_CONFIG.GARDEN_LOCATION_PRESETS.length >= 6);
  assert.ok(
    ADVISOR_CONFIG.GARDEN_LOCATION_PRESETS.some((p: any) =>
      p.locationName.includes('York')
    )
  );
  assert.ok(Array.isArray(ADVISOR_CONFIG.GARDEN_ASPECT_OPTIONS));
  assert.equal(ADVISOR_CONFIG.GARDEN_ASPECT_OPTIONS.length, 4);
  assert.deepEqual(
    ADVISOR_CONFIG.GARDEN_ASPECT_OPTIONS.map((opt: any) => opt.label),
    ['South-Facing', 'West-Facing', 'East-Facing', 'North-Facing']
  );

  const resolvedYork = resolveGardenLocationProfile('York');
  assert.ok(resolvedYork);
  assert.ok(resolvedYork.locationName.includes('York'));
  assert.ok(typeof resolvedYork.latitude === 'number');

  const resolvedCustom = resolveGardenLocationProfile('Harrogate, North Yorkshire');
  assert.ok(resolvedCustom);
  assert.equal(resolvedCustom.locationName, 'Harrogate, North Yorkshire');
  assert.ok(typeof resolvedCustom.latitude === 'number');

  const sampleWeather = {
    hazardSummary: {
      frostRiskDetected: true,
      lowestForecastTempC: -0.5,
      windRockRiskDetected: true,
      maxForecastGustMph: 29.1,
      maxForecastGustKmh: 46.8,
      waterloggingRiskDetected: false,
      cumulativePrecip48hMm: 19.0
    },
    dailyForecast: [{ date: '2026-10-25', minTempC: -0.5, peakWindGustMph: 29.1, peakWindGustKmh: 46.8 }]
  };

  const selectedGardenPlants = [
    {
      id: 'rhs-acer',
      name: 'Japanese Maple (Acer palmatum)',
      rhsRating: 'H4',
      location: 'Sheltered Courtyard Pot',
      growthStage: 'Autumn Leaf Drop',
      vulnerabilities: ['Morning frost thaw scorch']
    }
  ];

  const southFacingAdvice = buildRuleBasedHorticulturalAdvice(
    sampleWeather,
    selectedGardenPlants,
    {
      ...ADVISOR_CONFIG.DEFAULT_GARDEN_PROFILE,
      locationName: 'York, North Yorkshire, UK',
      rhsHardinessZone: 'H4',
      isSouthFacing: true,
      gardenAspect: 'SOUTH'
    }
  );

  const northFacingAdvice = buildRuleBasedHorticulturalAdvice(
    sampleWeather,
    selectedGardenPlants,
    {
      ...ADVISOR_CONFIG.DEFAULT_GARDEN_PROFILE,
      locationName: 'Edinburgh, Scotland, UK',
      rhsHardinessZone: 'H4',
      isSouthFacing: false,
      gardenAspect: 'NORTH'
    }
  );

  assert.ok(southFacingAdvice.soilAndMicroclimateNote.includes('York, North Yorkshire, UK'));
  assert.ok(southFacingAdvice.soilAndMicroclimateNote.includes('South-facing aspect'));
  assert.ok(northFacingAdvice.soilAndMicroclimateNote.includes('Edinburgh, Scotland, UK'));
  assert.ok(northFacingAdvice.soilAndMicroclimateNote.includes('NORTH-facing aspect'));
  assert.notEqual(
    southFacingAdvice.weatherAlerts[0].actionRequired,
    northFacingAdvice.weatherAlerts[0].actionRequired
  );
});

test('saveGardenProfileToStorage and loadSavedGardenProfileFromStorage persist selected location and direction across visits', () => {
  const storeMap = new Map<string, string>();
  const mockStorage = {
    getItem: (key: string) => (storeMap.has(key) ? storeMap.get(key)! : null),
    setItem: (key: string, val: string) => {
      storeMap.set(key, val);
    },
    removeItem: (key: string) => {
      storeMap.delete(key);
    }
  };

  // 1. Empty storage on first use returns unconfigured locationName
  const firstVisitProfile = loadSavedGardenProfileFromStorage(mockStorage as any);
  assert.equal(firstVisitProfile.locationName, '');
  assert.equal(firstVisitProfile.gardenAspect, 'SOUTH');

  // 2. Selecting a preset location + West-Facing direction saves immediately and restores on next load
  const selectedPreset = resolveGardenLocationProfile('edinburgh', {
    gardenAspect: 'WEST',
    isSouthFacing: false
  });
  const savedOk = saveGardenProfileToStorage(selectedPreset, mockStorage as any);
  assert.equal(savedOk, true);
  assert.ok(mockStorage.getItem(GARDEN_PROFILE_STORAGE_KEY));

  const nextVisitProfile = loadSavedGardenProfileFromStorage(mockStorage as any);
  assert.equal(nextVisitProfile.locationId, 'edinburgh');
  assert.equal(nextVisitProfile.locationName, 'Edinburgh, Scotland, UK');
  assert.equal(nextVisitProfile.gardenAspect, 'WEST');
  assert.equal(nextVisitProfile.isSouthFacing, false);
  assert.equal(nextVisitProfile.rhsHardinessZone, 'H4');
  assert.ok(typeof nextVisitProfile.latitude === 'number');

  // 3. Updating to a custom location + East-Facing direction overwrites and remembers new selection
  const customLocation = resolveGardenLocationProfile('Hexham, UK', nextVisitProfile);
  saveGardenProfileToStorage(
    { ...customLocation, gardenAspect: 'EAST', isSouthFacing: false },
    mockStorage as any
  );

  const reloadedCustom = loadSavedGardenProfileFromStorage(mockStorage as any);
  assert.equal(reloadedCustom.locationName, 'Hexham, UK');
  assert.equal(reloadedCustom.gardenAspect, 'EAST');
  assert.equal(reloadedCustom.isSouthFacing, false);

  // 4. Clearing saved location resets to unconfigured state
  clearSavedGardenProfileFromStorage(mockStorage as any);
  const afterClear = loadSavedGardenProfileFromStorage(mockStorage as any);
  assert.equal(afterClear.locationName, '');
});

test('Clay Soil Saturation & 30-Day Trend dynamically changes depending on location and garden direction set', () => {
  const yorkData = getAllSoilRainfallLogs({
    locationId: 'york',
    locationName: 'York, North Yorkshire, UK',
    gardenAspect: 'SOUTH'
  });
  const manchesterData = getAllSoilRainfallLogs({
    locationId: 'manchester',
    locationName: 'Manchester, North West, UK',
    gardenAspect: 'SOUTH'
  });
  const cambridgeData = getAllSoilRainfallLogs({
    locationId: 'cambridge',
    locationName: 'Cambridge, East Anglia, UK',
    gardenAspect: 'SOUTH'
  });
  const yorkNorthFacing = getAllSoilRainfallLogs({
    locationId: 'york',
    locationName: 'York, North Yorkshire, UK',
    gardenAspect: 'NORTH'
  });

  const yorkMetrics = compute30DayTrendMetrics(prepare30DaySoilSeries(yorkData.logs, 30));
  const manchesterMetrics = compute30DayTrendMetrics(prepare30DaySoilSeries(manchesterData.logs, 30));
  const cambridgeMetrics = compute30DayTrendMetrics(prepare30DaySoilSeries(cambridgeData.logs, 30));
  const yorkNorthMetrics = compute30DayTrendMetrics(prepare30DaySoilSeries(yorkNorthFacing.logs, 30));

  // Manchester (wet North West) has higher average clay saturation and more waterlogged days than York and Cambridge
  assert.ok(manchesterMetrics.avgSaturationPct > yorkMetrics.avgSaturationPct);
  assert.ok(yorkMetrics.avgSaturationPct > cambridgeMetrics.avgSaturationPct);
  assert.ok(manchesterMetrics.daysAboveWaterloggingThreshold > cambridgeMetrics.daysAboveWaterloggingThreshold);

  // North-facing aspect retains more moisture than South-facing in the same location
  assert.ok(yorkNorthMetrics.avgSaturationPct > yorkMetrics.avgSaturationPct);

  // Log entries carry the active location name and localized border zones
  assert.ok(yorkData.logs[0].locationZone.includes('York'));
  assert.ok(manchesterData.logs[0].locationZone.includes('Manchester'));
  assert.ok(cambridgeData.logs[0].locationZone.includes('Cambridge'));

  // Custom town/postcode also produces distinct calibrated 30-day soil logs
  const customHexham = getAllSoilRainfallLogs({
    locationId: 'custom',
    locationName: 'Hexham, UK',
    latitude: 54.97,
    longitude: -2.1,
    gardenAspect: 'WEST'
  });
  assert.equal(customHexham.locationCalibration.locationName, 'Hexham, UK');
  assert.ok(customHexham.logs[0].locationZone.includes('Hexham'));
});

test('getGardenLocationSuggestions provides ranked location suggestions for partial entered town, county, or postcode', () => {
  assert.ok(Array.isArray(UK_GARDEN_LOCATION_DIRECTORY));
  assert.ok(UK_GARDEN_LOCATION_DIRECTORY.length >= 30);

  // 1. Partial town prefix ("Had" -> Hadston, Morpeth, Northumberland)
  const hadSuggestions = getGardenLocationSuggestions('Had', 5);
  assert.ok(hadSuggestions.length >= 1);
  assert.equal(hadSuggestions[0].id, 'hadston');
  assert.ok(hadSuggestions[0].locationName.includes('Hadston'));

  // 2. Partial town prefix ("Morp" -> Morpeth, Northumberland, UK)
  const morpSuggestions = getGardenLocationSuggestions('Morp', 5);
  assert.ok(morpSuggestions.length >= 1);
  assert.equal(morpSuggestions[0].id, 'morpeth');

  // 3. Partial postcode prefix ("NE65" -> Hadston & Amble)
  const ne65Suggestions = getGardenLocationSuggestions('NE65', 5);
  assert.ok(ne65Suggestions.length >= 2);
  assert.ok(ne65Suggestions.some((s: any) => s.id === 'hadston'));
  assert.ok(ne65Suggestions.some((s: any) => s.id === 'amble'));

  // 4. Partial county/region ("Corn" -> Truro, Cornwall)
  const cornwallSuggestions = getGardenLocationSuggestions('Corn', 5);
  assert.ok(cornwallSuggestions.length >= 1);
  assert.ok(cornwallSuggestions[0].locationName.includes('Cornwall'));

  // 5. Selecting a suggestion object resolves full GardenProfile with exact coordinates and RHS zone
  const selectedProfile = resolveGardenLocationSuggestionsProfileHelper(hadSuggestions[0]);
  assert.equal(selectedProfile.locationId, 'hadston');
  assert.equal(selectedProfile.locationName, 'Hadston, Morpeth, Northumberland');
  assert.equal(selectedProfile.rhsHardinessZone, 'H4');
  assert.equal(selectedProfile.latitude, 55.3005);

  // 6. Geocoding helper converts live Open-Meteo geocoding item into suggestion format
  const geoSuggestion = convertGeocodeResultToSuggestion({
    id: 2644668,
    name: 'Knaresborough',
    admin1: 'England',
    admin2: 'North Yorkshire',
    latitude: 54.0091,
    longitude: -1.467,
    postcodes: ['HG5 8AA']
  });
  assert.ok(geoSuggestion);
  assert.equal(geoSuggestion.locationName, 'Knaresborough, North Yorkshire, UK');
  assert.equal(geoSuggestion.postcodePrefix, 'HG5');
  assert.equal(geoSuggestion.rhsHardinessZone, 'H4');
});

test('getPlantImageInfo resolves curated botanical photos for all 32 plants and staples', async () => {
  const { getPlantImageInfo, PLANT_BOTANICAL_IMAGE_MAP } = await import('./plantImages');
  
  // 1. Photo Ref #1 (Salvia farinacea / Mealycup Sage)
  const p1 = getPlantImageInfo('hadston-01', 1);
  assert.ok(p1.photoUrl.startsWith('https://') || p1.photoUrl.startsWith('/assets/plants/'));
  assert.equal(p1.name, 'Mealycup Sage');
  assert.ok(p1.description.includes('violet-blue'));

  // 2. Photo Ref #16 (Peony)
  const p16 = getPlantImageInfo('Peony', 16);
  assert.ok(p16.photoUrl.startsWith('https://') || p16.photoUrl.startsWith('/assets/plants/'));
  assert.ok(p16.name.includes('Peony'));

  // 3. Name search resolution (e.g. "English Lavender")
  const pLav = getPlantImageInfo('English Lavender');
  assert.ok(pLav.photoUrl.startsWith('https://') || pLav.photoUrl.startsWith('/assets/plants/'));
  assert.ok(pLav.description.includes('Lavender') || pLav.description.includes('violet'));

  // 4. Default graceful fallback for unknown plant
  const pUnknown = getPlantImageInfo('Exotic Mysterious Orchid XYZ');
  assert.ok(pUnknown.photoUrl.startsWith('https://') || pUnknown.photoUrl.startsWith('/assets/plants/'));
  assert.equal(pUnknown.name, 'Exotic Mysterious Orchid XYZ');
});

test('getAllSoilRainfallLogs dynamically rolls 30-day timestamps up to Today instead of static 23rd Oct', () => {
  const now = new Date();
  const todayIsoDate = now.toISOString().split('T')[0];

  const { logs } = getAllSoilRainfallLogs({
    locationId: 'york',
    locationName: 'York, North Yorkshire, UK',
    gardenAspect: 'SOUTH'
  }, now);

  assert.ok(logs.length >= 10);
  // The newest reading in the 30-day trend must be anchored to Today
  assert.equal(logs[0].recordedAt.split('T')[0], todayIsoDate);

  // Oldest reading in the 10-point rolling window is 28 days prior to Today
  const oldestDate = new Date(logs[logs.length - 1].recordedAt);
  const diffDays = Math.round((now.getTime() - oldestDate.getTime()) / (24 * 60 * 60 * 1000));
  assert.ok(diffDays >= 27 && diffDays <= 29);
});

function resolveGardenLocationSuggestionsProfileHelper(suggestion: any) {
  return resolveGardenLocationProfile(suggestion);
}

test('formatUkDateTime formats ISO timestamps into UK date and 24-hour time and advice includes evaluatedAt', () => {
  const formatted = formatUkDateTime('2026-11-02T15:09:00.000Z');
  assert.ok(formatted.includes('02 Nov 2026'));
  assert.ok(formatted.includes('15:09'));

  // Graceful fallback when null or undefined is passed
  const fallbackFormatted = formatUkDateTime(null);
  assert.ok(fallbackFormatted.includes(','));
  assert.ok(/\d{2}:\d{2}$/.test(fallbackFormatted));

  const advice = buildRuleBasedHorticulturalAdvice(
    {
      fetchedAt: '2026-11-02T15:09:00.000Z',
      hazardSummary: { frostRiskDetected: true, lowestForecastTempC: -0.5 },
      dailyForecast: []
    },
    ADVISOR_CONFIG.DEFAULT_PLANT_INVENTORY,
    ADVISOR_CONFIG.DEFAULT_GARDEN_PROFILE
  );
  assert.equal(advice.evaluatedAt, '2026-11-02T15:09:00.000Z');
});

test('groupPlantInventoryByCategory organizes garden plants into Shrubs, Flowers, Vegetables, and Foliage groups', () => {
  assert.equal(PLANT_CATEGORY_DEFINITIONS.length, 4);

  const records = getHadston32InventoryRecords();
  const grouped = groupPlantInventoryByCategory(records);

  // All 4 categories are represented in the 32-plant collection
  assert.equal(grouped.length, 4);
  const totalGroupedPlants = grouped.reduce((sum, g) => sum + g.plants.length, 0);
  assert.equal(totalGroupedPlants, 32);

  const shrubsGroup = grouped.find((g) => g.id === 'SHRUBS');
  const flowersGroup = grouped.find((g) => g.id === 'FLOWERS');
  const vegetablesGroup = grouped.find((g) => g.id === 'VEGETABLES');
  const foliageGroup = grouped.find((g) => g.id === 'FOLIAGE');

  assert.ok(shrubsGroup && shrubsGroup.plants.length >= 14);
  assert.ok(shrubsGroup.label.includes('Shrubs'));
  assert.ok(flowersGroup && flowersGroup.plants.length >= 6);
  assert.ok(flowersGroup.label.includes('Flowers'));
  assert.ok(vegetablesGroup && vegetablesGroup.plants.length >= 1);
  assert.ok(vegetablesGroup.label.includes('Vegetables'));
  assert.ok(foliageGroup && foliageGroup.plants.length >= 4);

  // Verify custom and starter plants resolve accurately
  assert.equal(resolvePlantGroupCategory({ name: "Purple Sprouting Broccoli 'Rudolph'" }), 'VEGETABLES');
  assert.equal(resolvePlantGroupCategory({ name: "Dahlia 'Bishop of Llandaff'" }), 'FLOWERS');
  assert.equal(resolvePlantGroupCategory({ name: "Rosa 'Gertrude Jekyll'" }), 'SHRUBS');
  assert.equal(resolvePlantGroupCategory({ name: 'Scaly Male Fern (Dryopteris affinis)' }), 'FOLIAGE');
});

test('doesTextMentionUkMonth and getPlantMonthlyCareStatus identify plants due for feeding, pruning, or winter protection', () => {
  // 1. Month range and seasonal keyword matching
  assert.equal(doesTextMentionUkMonth('March to August', 3), true); // April (3)
  assert.equal(doesTextMentionUkMonth('March to August', 10), false); // November (10)
  assert.equal(doesTextMentionUkMonth('November to February (dormant)', 10), true); // November (10)
  assert.equal(doesTextMentionUkMonth('November to February (dormant)', 0), true); // January (0)

  // 2. Plant #1 (Salvia farinacea, H3) in November (month 10) -> Winter Protection due
  const salvia = HADSTON_GARDEN_COLLECTION_32[0];
  const novSalviaStatus = getPlantMonthlyCareStatus(salvia, 10);
  assert.equal(novSalviaStatus.winterProtectDue, true);
  assert.equal(novSalviaStatus.isDueThisMonth, true);
  assert.ok(novSalviaStatus.badgeLabel && novSalviaStatus.badgeLabel.length > 0);

  // 3. Plant #1 (Salvia farinacea) in May (month 4) -> Feed due (May to August)
  const maySalviaStatus = getPlantMonthlyCareStatus(salvia, 4);
  assert.equal(maySalviaStatus.feedDue, true);
  assert.equal(maySalviaStatus.isDueThisMonth, true);
});

test('Full RHS Plant Catalogue contains 100+ UK plants with complete care schedules and supports category & keyword search', () => {
  assert.ok(RHS_PLANT_CATALOG.length >= 100);

  // Every single plant in the RHS Catalogue has full Care Card fields
  for (const plant of RHS_PLANT_CATALOG) {
    assert.ok(plant.catalogId, `Missing catalogId for ${plant.name}`);
    assert.ok(plant.soilAndSun, `Missing soilAndSun for ${plant.name}`);
    assert.ok(plant.feedWindowUk, `Missing feedWindowUk for ${plant.name}`);
    assert.ok(plant.pruneMonthsUk, `Missing pruneMonthsUk for ${plant.name}`);
    assert.ok(plant.overwinteringProtocol, `Missing overwinteringProtocol for ${plant.name}`);
  }

  // Verify searching across extended RHS categories
  assert.ok(searchRhsPlantCatalog('Tomato', 'ALL').length >= 1);
  assert.ok(searchRhsPlantCatalog('Blueberry', 'VEGETABLES').length >= 1);
  assert.ok(searchRhsPlantCatalog('Acer', 'SHRUBS').length >= 1);
  assert.ok(searchRhsPlantCatalog('Dahlia', 'FLOWERS').length >= 1);
  assert.ok(searchRhsPlantCatalog('Tree Fern', 'FOLIAGE').length >= 1);

  // Verify getAllRhsCatalogInventoryRecords converts all catalogue plants
  const allRecords = getAllRhsCatalogInventoryRecords();
  assert.equal(allRecords.length, RHS_PLANT_CATALOG.length);
  const groupedAll = groupPlantInventoryByCategory(allRecords);
  assert.equal(groupedAll.length, 4);
});

test('calculatePlantHealthScore computes plant health score from growth stage and recent weather alerts', async () => {
  const { calculatePlantHealthScore } = await import('./rhsPlantCatalog');

  // 1. Hardy dormant plant with no alerts -> Healthy (100%)
  const hardyDormant = calculatePlantHealthScore(
    {
      id: 'hadston-16',
      name: '#16 Peony (Paeonia species)',
      rhsRating: 'H6',
      growthStage: 'Leaf Drop / Autumn Dormancy',
      vulnerabilities: ['Peony wilt']
    },
    {
      weatherAlerts: [],
      hazardSummary: {
        frostRiskDetected: false,
        windRockRiskDetected: false,
        waterloggingRiskDetected: false
      }
    }
  );
  assert.equal(hardyDormant.score, 100);
  assert.equal(hardyDormant.status, 'THRIVING');
  assert.equal(hardyDormant.label, 'Healthy');
  assert.equal(hardyDormant.stageSensitivity, 'RESILIENT');

  // 2. Tender H3 plant in Late Flowering under CRITICAL frost alert + wet clay -> At Risk (< 65)
  const tenderAlerted = calculatePlantHealthScore(
    {
      id: 'hadston-01',
      name: '#1 Mealycup Sage (Salvia farinacea)',
      rhsRating: 'H3',
      growthStage: 'Late Flowering / Pre-Dormancy',
      vulnerabilities: ['Killed by sub-zero wet clay', 'Air frost blackens stems below -2°C']
    },
    {
      weatherAlerts: [
        {
          hazardType: 'AIR_FROST',
          severity: 'CRITICAL',
          affectedPlants: ['Mealycup Sage (Salvia farinacea)']
        }
      ],
      hazardSummary: {
        frostRiskDetected: true,
        lowestForecastTempC: -1.5,
        windRockRiskDetected: false,
        waterloggingRiskDetected: true
      }
    }
  );
  assert.ok(tenderAlerted.score < 65, `Expected score < 65, got ${tenderAlerted.score}`);
  assert.equal(tenderAlerted.status, 'AT_RISK');
  assert.equal(tenderAlerted.label, 'At Risk');
  assert.ok(tenderAlerted.activeAlertCount >= 2);

  // 3. Growth stage sensitivity impact under identical weather alert:
  // Seedling / Young Plug vs Winter Dormant
  const alertContext = {
    weatherAlerts: [
      {
        hazardType: 'FROST',
        severity: 'WARNING',
        affectedPlants: ['Rose (Shrub Specimen #5)']
      }
    ],
    hazardSummary: {
      frostRiskDetected: true,
      windRockRiskDetected: true
    }
  };

  const seedlingStage = calculatePlantHealthScore(
    {
      id: 'hadston-05',
      name: '#5 Rose #1 — Shrub / Bush Rose (Rosa species)',
      rhsRating: 'H6',
      growthStage: 'Seedling / Young Plug',
      vulnerabilities: ['Autumn/winter wind-rock in wet clay']
    },
    alertContext
  );

  const dormantStage = calculatePlantHealthScore(
    {
      id: 'hadston-05',
      name: '#5 Rose #1 — Shrub / Bush Rose (Rosa species)',
      rhsRating: 'H6',
      growthStage: 'Winter Dormant',
      vulnerabilities: ['Autumn/winter wind-rock in wet clay']
    },
    alertContext
  );

  assert.ok(
    seedlingStage.score < dormantStage.score,
    `Expected seedling stage score (${seedlingStage.score}) < dormant stage score (${dormantStage.score})`
  );

  // 4. Logging protection / care boosts health score of an alerted plant
  const protectedTender = calculatePlantHealthScore(
    {
      id: 'hadston-01',
      name: '#1 Mealycup Sage (Salvia farinacea)',
      rhsRating: 'H3',
      growthStage: 'Late Flowering / Pre-Dormancy',
      vulnerabilities: ['Killed by sub-zero wet clay']
    },
    {
      weatherAlerts: [
        {
          hazardType: 'AIR_FROST',
          severity: 'CRITICAL',
          affectedPlants: ['Mealycup Sage (Salvia farinacea)']
        }
      ],
      hazardSummary: { frostRiskDetected: true, waterloggingRiskDetected: true },
      careLog: { lastProtected: '08 Nov 2026, 12:00', lastFed: '01 Sep 2026, 10:00' }
    }
  );
  assert.ok(protectedTender.score > tenderAlerted.score);
  assert.ok(Array.isArray(protectedTender.factorItems));
  assert.ok(protectedTender.factorItems.length >= 4);
  assert.ok(
    protectedTender.factorItems.some((item) => item.label.includes('Base Plant Health'))
  );
  assert.ok(
    protectedTender.factorItems.some((item) => item.label.includes('Winter protection'))
  );
});

test('serializeGardenPlantsBackup, parseAndValidatePlantsBackup, and applyPlantsBackupImport export and restore garden plants accurately', async () => {
  const {
    serializeGardenPlantsBackup,
    parseAndValidatePlantsBackup,
    applyPlantsBackupImport,
  } = await import('./plantBackupUtils');

  const starterPlants = getHadston32InventoryRecords();
  const backupJson = serializeGardenPlantsBackup(starterPlants, {
    locationName: 'York, North Yorkshire, UK',
    exportedAt: '2026-11-09T09:00:00.000Z',
  });

  const parsed = parseAndValidatePlantsBackup(backupJson);
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.plants.length, 32);
    assert.equal(parsed.locationName, 'York, North Yorkshire, UK');
    assert.equal(parsed.exportedAt, '2026-11-09T09:00:00.000Z');
  }

  // Validation error cases
  const emptyCheck = parseAndValidatePlantsBackup('   ');
  assert.equal(emptyCheck.ok, false);

  const invalidJsonCheck = parseAndValidatePlantsBackup('{broken json');
  assert.equal(invalidJsonCheck.ok, false);

  const missingPlantsCheck = parseAndValidatePlantsBackup(JSON.stringify({ foo: 'bar' }));
  assert.equal(missingPlantsCheck.ok, false);

  // Merge mode: adds new plant and updates existing plant without duplicates
  const customBackupJson = JSON.stringify({
    format: 'LOAMY_GARDEN_PLANTS_BACKUP',
    version: 1,
    plants: [
      {
        id: 'plt-custom-fig',
        name: "Fig 'Brown Turkey' (Ficus carica)",
        rhsRating: 'H4',
        location: 'South Brick Wall',
        growthStage: 'Fruiting / Dormancy Prep',
        vulnerabilities: ['Hard frost on young figs'],
      },
      {
        id: starterPlants[0].id,
        name: starterPlants[0].name,
        rhsRating: 'H3',
        location: 'Updated Heated Greenhouse Shelf',
        growthStage: 'Overwintering Under Glass',
        vulnerabilities: ['Frost below -2C'],
      },
    ],
  });

  const customParsed = parseAndValidatePlantsBackup(customBackupJson);
  assert.equal(customParsed.ok, true);
  if (customParsed.ok) {
    const merged = applyPlantsBackupImport(starterPlants, customParsed.plants, 'MERGE');
    assert.equal(merged.addedCount, 1);
    assert.equal(merged.updatedCount, 1);
    assert.equal(merged.totalCount, 33);
    assert.equal(merged.nextPlants[0].name, "Fig 'Brown Turkey' (Ficus carica)");

    const replaced = applyPlantsBackupImport(starterPlants, customParsed.plants, 'REPLACE');
    assert.equal(replaced.totalCount, 2);
    assert.equal(replaced.nextPlants.length, 2);
  }
});

test('getDynamicFortnightlyCareSchedule omits unselected plants when inventory is empty and tailors schedule to selected plants', () => {
  // 1. Empty inventory in November (monthIndex 10) must NOT mention Hosta (#19) or Lemon Cypress (#2)
  const emptyNovSchedule = getDynamicFortnightlyCareSchedule(10, []);
  assert.equal(emptyNovSchedule.monthName, 'November');
  assert.ok(!emptyNovSchedule.week1To2.pruningAndDeadheading.includes('Hosta (#19)'));
  assert.ok(!emptyNovSchedule.week1To2.wateringAndSoilCare.includes('Lemon Cypress (#2)'));

  // 2. Populated inventory with only Fuchsia Hybrid includes Fuchsia Hybrid and not Hosta (#19)
  const fuchsiaOnlySchedule = getDynamicFortnightlyCareSchedule(10, [
    {
      id: 'hadston-03-fuchsia-hybrid',
      name: '#3 Fuchsia Hybrid (Fuchsia × hybrida)',
      rhsRating: 'H3',
      location: 'Sheltered Courtyard Pot'
    }
  ]);
  assert.ok(fuchsiaOnlySchedule.week1To2.wateringAndSoilCare.includes('Fuchsia Hybrid'));
  assert.ok(fuchsiaOnlySchedule.week1To2.pestDiseaseAndFrost.includes('Fuchsia Hybrid'));
  assert.ok(!fuchsiaOnlySchedule.week1To2.pruningAndDeadheading.includes('Hosta (#19)'));
});

test('buildRuleBasedHorticulturalAdvice omits unselected plants when inventory is empty and strips # photoRef prefixes', () => {
  const sampleWeather = {
    hazardSummary: {
      frostRiskDetected: true,
      lowestForecastTempC: -0.5,
      windRockRiskDetected: true,
      maxForecastGustMph: 29.1,
      maxForecastGustKmh: 46.8,
      waterloggingRiskDetected: false,
      cumulativePrecip48hMm: 19.0
    },
    dailyForecast: [{ date: '2026-11-09', minTempC: -0.5, peakWindGustMph: 29.1, peakWindGustKmh: 46.8 }]
  };

  const emptyAdvice = buildRuleBasedHorticulturalAdvice(sampleWeather, [], {
    ...ADVISOR_CONFIG.DEFAULT_GARDEN_PROFILE,
    locationName: 'Hadston, Morpeth, Northumberland',
    rhsHardinessZone: 'H4',
    isSouthFacing: true,
    gardenAspect: 'SOUTH'
  });

  // When no plants are selected in My Garden Plants, zero weatherAlerts or seasonalTasks are generated
  assert.deepEqual(emptyAdvice.weatherAlerts, []);
  assert.deepEqual(emptyAdvice.seasonalTasks, []);

  const singlePlantAdvice = buildRuleBasedHorticulturalAdvice(
    sampleWeather,
    [
      {
        id: 'hadston-03',
        name: '#3 Fuchsia (Fuchsia hybrid)',
        rhsRating: 'H3',
        location: 'Sheltered Courtyard Pot',
        growthStage: 'Late Flowering / Pre-Dormancy',
        vulnerabilities: ['Frost below -2C']
      }
    ],
    {
      ...ADVISOR_CONFIG.DEFAULT_GARDEN_PROFILE,
      locationName: 'Hadston, Morpeth, Northumberland',
      rhsHardinessZone: 'H4',
      isSouthFacing: true,
      gardenAspect: 'SOUTH'
    }
  );

  const frostAlert = singlePlantAdvice.weatherAlerts.find((a: any) => a.hazardType === 'FROST');
  assert.ok(frostAlert);
  assert.deepEqual(frostAlert.affectedPlants, ['Fuchsia (Fuchsia hybrid)']);
  assert.ok(frostAlert.actionRequired.includes('Fuchsia (Fuchsia hybrid)'));
  assert.ok(!frostAlert.actionRequired.includes('Citrus'));
  assert.ok(!frostAlert.actionRequired.includes('#3'));
});

test('normalizeLiveRhsPlant converts official live RHS Plant Finder responses into RhsCatalogPlant records', async () => {
  const {
    stripRhsHtml,
    resolveRhsHardinessCode,
    mapRhsPlantTypesToCategory,
    normalizeLiveRhsPlant,
  } = await import('../services/rhsLiveService');

  assert.equal(stripRhsHtml('<em>Lavandula</em> <em>angustifolia</em> &amp; &#39;Hidcote&#39;'), "Lavandula angustifolia & 'Hidcote'");
  assert.equal(resolveRhsHardinessCode([7]), 'H5');
  assert.equal(resolveRhsHardinessCode([9]), 'H7');
  assert.equal(resolveRhsHardinessCode([5]), 'H3');

  assert.equal(mapRhsPlantTypesToCategory([6]), 'SHRUBS');
  assert.equal(mapRhsPlantTypesToCategory([12]), 'VEGETABLES');
  assert.equal(mapRhsPlantTypesToCategory([5]), 'FOLIAGE');
  assert.equal(mapRhsPlantTypesToCategory([1]), 'FLOWERS');

  const normalized = normalizeLiveRhsPlant(
    {
      id: 9916,
      commonName: 'English lavender',
      botanicalName: '<em>Lavandula</em> <em>angustifolia</em>',
      entityDescription: '<strong><em>L. angustifolia</em></strong> is a compact aromatic shrub with narrow grey-green leaves and violet flowers.',
      image: 'WSY0034978_4302.jpg',
      isAgm: true,
      isPlantsForPollinators: true,
    },
    {
      hardinessLevel: 7,
      plantType: [6],
      sunlight: [1],
      soilType: [1, 3, 4],
      moisture: [1],
      ph: [1, 2, 3],
      aspect: [1, 4],
      height: '1m',
      spread: '1m',
      cultivation: 'Grow in poor to moderately fertile, well-drained soil in full sun.',
      pruning: 'Pruning group 10; trim back after flowering in late summer.',
      pestResistance: 'Generally pest-free, though rosemary beetle may occur.',
      diseaseResistance: 'Root rot in winter-wet clay.',
      images: [{ image: 'WSY0034978_4302.jpg', copyRight: 'RHS' }],
    }
  );

  assert.equal(normalized.catalogId, 'rhs-9916');
  assert.equal(normalized.rhsPlantId, 9916);
  assert.equal(normalized.commonName, 'English lavender');
  assert.equal(normalized.botanicalName, 'Lavandula angustifolia');
  assert.equal(normalized.rhsRating, 'H5');
  assert.equal(normalized.category, 'SHRUBS');
  assert.equal(normalized.groupCategory, 'SHRUBS');
  assert.equal(normalized.photoUrl, 'https://apps.rhs.org.uk/plantselectorimages/detail/WSY0034978_4302.jpg');
  assert.ok(normalized.rhsUrl?.includes('https://www.rhs.org.uk/plants/9916/'));
  assert.equal(normalized.isAgm, true);
  assert.equal(normalized.isPollinatorFriendly, true);
  assert.ok(normalized.soilAndSun?.includes('Full sun'));
  assert.ok(normalized.pruneTechnique?.includes('Pruning group 10'));
  assert.ok(normalized.vulnerabilities.length >= 1);
});

test('Pl@ntNet resolvePlantNetPrefixes, rankPlantNetSpecies, and convertPlantNetSpeciesToCatalogPlant merge Pl@ntNet taxonomy with RHS care data', async () => {
  const {
    resolvePlantNetPrefixes,
    rankPlantNetSpecies,
    convertPlantNetSpeciesToCatalogPlant,
  } = await import('../services/plantNetService');

  // 1. Common name and botanical prefix resolution
  const lavenderPrefixes = resolvePlantNetPrefixes('Lavender');
  assert.ok(lavenderPrefixes.includes('Lavandula'), `Expected Lavandula in ${JSON.stringify(lavenderPrefixes)}`);

  const maplePrefixes = resolvePlantNetPrefixes('Japanese Maple');
  assert.ok(maplePrefixes.includes('Acer palmatum'));

  // 2. Ranking Pl@ntNet species by common name and scientific name match
  const sampleSpecies = [
    {
      id: 1411430,
      scientificNameWithoutAuthor: 'Lavandula stoechas',
      scientificNameAuthorship: 'L.',
      commonNames: ['French Lavender', 'Spanish Lavender'],
      gbifId: 2927305,
      powoId: '549116-1',
    },
    {
      id: 1358506,
      scientificNameWithoutAuthor: 'Lavandula angustifolia',
      scientificNameAuthorship: 'Mill.',
      commonNames: ['English Lavender', 'True Lavender'],
      gbifId: 2927303,
      powoId: '30037158-2',
    },
  ];

  const rankedEnglish = rankPlantNetSpecies(sampleSpecies, 'English Lavender');
  assert.equal(rankedEnglish[0].scientificNameWithoutAuthor, 'Lavandula angustifolia');

  // 3. Merging Pl@ntNet species record with live RHS plant record
  const mockRhsMatch = {
    catalogId: 'rhs-9916',
    rhsPlantId: 9916,
    name: 'English lavender (Lavandula angustifolia)',
    commonName: 'English lavender',
    botanicalName: 'Lavandula angustifolia',
    rhsRating: 'H5' as const,
    category: 'SHRUBS' as const,
    groupCategory: 'SHRUBS' as const,
    recommendedLocation: 'Sunny South-Facing Border',
    defaultOctGrowthStage: 'Established Shrub',
    vulnerabilities: ['Root rot in winter-wet clay'],
    soilAndSun: 'Full sun · Chalk, Loam, Sand · Well-drained',
    feedWindowUk: 'April to July',
    feedTypeNpk: 'Low-nitrogen potash feed',
    feedFrequencyDosage: 'Once in spring',
    pruneMonthsUk: 'August to September',
    pruneType: 'RHS Pruning Group 10',
    pruneTechnique: 'Pruning group 10; trim back after flowering in late summer.',
    pruneAvoid: 'Avoid cutting into old wood',
    overwinteringProtocol: 'Ensure sharp grit drainage in heavy clay.',
    idDisambiguationNote: 'RHS AGM shrub',
    photoUrl: 'https://apps.rhs.org.uk/plantselectorimages/detail/WSY0034978_4302.jpg',
    rhsUrl: 'https://www.rhs.org.uk/plants/9916/lavandula-angustifolia/details',
    isAgm: true,
    isPollinatorFriendly: true,
  };

  const mergedPlant = convertPlantNetSpeciesToCatalogPlant(sampleSpecies[1], [mockRhsMatch], {
    family: 'Lamiaceae',
    plantNetScore: 0.94,
  });

  assert.equal(mergedPlant.catalogId, 'plantnet-1358506');
  assert.equal(mergedPlant.plantNetId, '1358506');
  assert.equal(mergedPlant.rhsPlantId, 9916);
  assert.equal(mergedPlant.commonName, 'English Lavender');
  assert.equal(mergedPlant.botanicalName, 'Lavandula angustifolia');
  assert.equal(mergedPlant.scientificNameAuthorship, 'Mill.');
  assert.equal(mergedPlant.gbifId, 2927303);
  assert.equal(mergedPlant.powoId, '549116-1'.length > 0 ? '30037158-2' : '');
  assert.equal(mergedPlant.family, 'Lamiaceae');
  assert.equal(mergedPlant.plantNetScore, 0.94);
  assert.equal(mergedPlant.rhsRating, 'H5');
  assert.equal(mergedPlant.isAgm, true);
  assert.equal(mergedPlant.dataSource, 'PLANTNET_RHS_MERGED');
  assert.equal(mergedPlant.photoUrl, 'https://apps.rhs.org.uk/plantselectorimages/detail/WSY0034978_4302.jpg');
});





