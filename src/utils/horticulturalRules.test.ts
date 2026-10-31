import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG, msToMph, kmhToMph, msToKmh, round1, normaliseForecastData } from '../../metOfficeProxy.js';
import { calculateClaySoilSaturation, SOIL_RAINFALL_SCHEMA_SQL } from '../db/soilLogsDb';
import {
  ADVISOR_CONFIG,
  buildRuleBasedHorticulturalAdvice,
  resolveGardenLocationProfile,
  saveGardenProfileToStorage,
  loadSavedGardenProfileFromStorage,
  clearSavedGardenProfileFromStorage,
  GARDEN_PROFILE_STORAGE_KEY
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
  getHadston32InventoryRecords
} from './rhsPlantCatalog';
import {
  HADSTON_MONTH_BY_MONTH_WEEKLY_CALENDAR,
  HADSTON_LOCAL_RISK_MITIGATION,
  generateHadstonMasterGuideMarkdown
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

test('buildRuleBasedHorticulturalAdvice produces valid schema output for garden inventory', () => {
  const advice = buildRuleBasedHorticulturalAdvice({
    hazardSummary: {
      frostRiskDetected: true,
      lowestForecastTempC: -0.5,
      windRockRiskDetected: true,
      maxForecastGustKmh: 45.0,
      waterloggingRiskDetected: true,
      cumulativePrecip48hMm: 34.0
    },
    dailyForecast: [{ date: '2026-10-25', minTempC: -0.5, peakWindGustKmh: 45.0 }]
  });

  assert.ok(Array.isArray(advice.weatherAlerts));
  assert.ok(advice.weatherAlerts.length >= 2);
  assert.ok(Array.isArray(advice.seasonalTasks));
  assert.ok(advice.seasonalTasks.length >= 3);
  assert.ok(typeof advice.soilAndMicroclimateNote === 'string');
});

test('monthlyClayChecklist provides 12 months of North East heavy clay tasks and accurate progress calculation', () => {
  assert.equal(MONTHLY_CLAY_PROFILES.length, 12);

  // Verify October (month index 9) detection for 2026-10-24
  const octDate = new Date('2026-10-24T12:00:00Z');
  assert.equal(getCurrentUkMonthIndex(octDate), 9);

  const octProfile = getMonthlyClayChecklist(9);
  assert.equal(octProfile.monthName, 'October');
  assert.ok(octProfile.tasks.length >= 4);

  const soilOnly = filterMonthlyTasks(octProfile.tasks, 'SOIL_CARE');
  assert.ok(soilOnly.length >= 1);
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

test('Hadston Master Horticulturist Guide contains all 5 sections, 12 monthly calendars with Week 1-2 & Week 3-4 tasks, and Markdown export', () => {
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
  const md = generateHadstonMasterGuideMarkdown();
  assert.ok(md.includes('Section 1: Plant Inventory & Identification Summary'));
  assert.ok(md.includes('Section 2: Month-by-Month & Weekly Task Calendar'));
  assert.ok(md.includes('Section 3: Specialized Feed & Nutrition Strategy'));
  assert.ok(md.includes('Section 4: Precision Pruning & Shaping Guide'));
  assert.ok(md.includes('Section 5: Climate & Seasonal Risk Management'));
  assert.ok(md.includes('Salvia farinacea'));
  assert.ok(md.includes('Ceanothus'));
});

test('buildRuleBasedHorticulturalAdvice adapts advice for garden location and south-facing aspect', () => {
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

  const southFacingAdvice = buildRuleBasedHorticulturalAdvice(
    sampleWeather,
    ADVISOR_CONFIG.DEFAULT_PLANT_INVENTORY,
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
    ADVISOR_CONFIG.DEFAULT_PLANT_INVENTORY,
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
