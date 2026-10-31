/**
 * Met Office Weather DataHub & NSWWS Warnings Proxy
 * Target Runtime: Node.js 18+ (Express / Google AI Studio Backend / Cloud Functions)
 * Dependencies: npm install express fast-xml-parser
 */

import express from 'express';
import { XMLParser } from 'fast-xml-parser';

// ============================================================================
// 1. EDITABLE CONFIGURATION BLOCK
// ============================================================================
const CONFIG = {
  PORT: process.env.PORT || 3001,

  // Default Coordinates: Morpeth, Northumberland (4 decimal places max for DataHub)
  DEFAULT_LAT: 55.1688,
  DEFAULT_LON: -1.6911,
  DEFAULT_REGION_CODE: 'ne', // 'ne' = North East England

  // Met Office Weather DataHub Site-Specific v0 Endpoints
  DATAHUB_BASE_URL: 'https://data.hub.api.metoffice.gov.uk/sitespecific/v0/point',
  DATAHUB_API_KEY: process.env.MET_OFFICE_DATAHUB_API_KEY || '',

  // NSWWS Warnings Endpoints (Supports both DataHub Atom/GeoJSON and Public RSS XML)
  NSWWS_ATOM_URL: process.env.MET_OFFICE_NSWWS_BASE_URL
    ? `${process.env.MET_OFFICE_NSWWS_BASE_URL.replace(/\/$/, '')}/v1.0/objects/feed`
    : '',
  NSWWS_API_KEY: process.env.MET_OFFICE_NSWWS_API_KEY || '',
  PUBLIC_WARNINGS_RSS_BASE: 'https://www.metoffice.gov.uk/public/data/PWSCache/WarningsRSS/Region',

  // Cache TTL (30 minutes protects the 360 calls/day free DataHub quota)
  CACHE_TTL_MS: 30 * 60 * 1000,

  // Horticultural Hazard Thresholds (North East England / Heavy Clay Profile)
  THRESHOLDS: {
    GROUND_FROST_TEMP_C: 2.0,       // Screen temp <= 2.0°C risks ground/grass frost in pockets
    AIR_FROST_TEMP_C: 0.0,          // Screen temp <= 0.0°C risks air frost & pot freezing
    WIND_ROCK_GUST_KMH: 40.0,       // Gusts >= 40 km/h (25 mph) risk wind-rock on wet clay
    WATERLOGGING_72H_MM: 30.0,      // >= 30 mm rain over 72h risks waterlogging in heavy clay
    BLIGHT_MIN_TEMP_C: 10.0,        // Min temp for fungal/blight spore germination
    BLIGHT_MIN_RH_PERCENT: 90.0,    // Relative humidity threshold for blight/fungal risk
    BLIGHT_CONSECUTIVE_HOURS: 6     // Consecutive humid hours to flag fungal pressure
  }
};

// ============================================================================
// 2. INITIALISATION & HELPERS
// ============================================================================
const app = express.Router();
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_'
});

// Simple in-memory cache keyed by coordinates and region
const responseCache = new Map();

/**
 * Structured logger outputting ISO timestamp, level, event, and metadata
 */
function logEvent(level, event, details = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...details
  };
  console.log(JSON.stringify(entry));
}

/**
 * Converts Met Office wind speed in metres per second (m/s) to km/h
 */
function msToKmh(ms) {
  if (typeof ms !== 'number' || Number.isNaN(ms)) return null;
  return Number((ms * 3.6).toFixed(1));
}

/**
 * Safely rounds numeric values to 1 decimal place
 */
function round1(val) {
  if (typeof val !== 'number' || Number.isNaN(val)) return null;
  return Number(val.toFixed(1));
}

/**
 * Maps Met Office Significant Weather Codes (0-30) to readable UK descriptions
 */
const WEATHER_CODES = {
  0: 'Clear night',
  1: 'Sunny day',
  2: 'Partly cloudy (night)',
  3: 'Partly cloudy (day)',
  5: 'Mist',
  6: 'Fog',
  7: 'Cloudy',
  8: 'Overcast',
  9: 'Light rain shower (night)',
  10: 'Light rain shower (day)',
  11: 'Drizzle',
  12: 'Light rain',
  13: 'Heavy rain shower (night)',
  14: 'Heavy rain shower (day)',
  15: 'Heavy rain',
  16: 'Sleet shower (night)',
  17: 'Sleet shower (day)',
  18: 'Sleet',
  19: 'Hail shower (night)',
  20: 'Hail shower (day)',
  21: 'Hail',
  22: 'Light snow shower (night)',
  23: 'Light snow shower (day)',
  24: 'Light snow',
  25: 'Heavy snow shower (night)',
  26: 'Heavy snow shower (day)',
  27: 'Heavy snow',
  28: 'Thunder shower (night)',
  29: 'Thunder shower (day)',
  30: 'Thunder'
};

// ============================================================================
// 3. MET OFFICE DATAHUB GEOJSON FETCHER & NORMALISER
// ============================================================================

/**
 * Calls a Met Office DataHub Site-Specific endpoint (/hourly or /daily)
 */
async function fetchDataHubEndpoint(timestep, lat, lon) {
  if (!CONFIG.DATAHUB_API_KEY) {
    throw new Error('Missing MET_OFFICE_DATAHUB_API_KEY environment variable.');
  }

  // Round coordinates to 4 decimal places to avoid DataHub 400 precision errors
  const cleanLat = Number(lat).toFixed(4);
  const cleanLon = Number(lon).toFixed(4);

  const url = new URL(`${CONFIG.DATAHUB_BASE_URL}/${timestep}`);
  url.searchParams.set('dataSource', 'BD1');
  url.searchParams.set('latitude', cleanLat);
  url.searchParams.set('longitude', cleanLon);
  url.searchParams.set('includeLocationName', 'true');
  url.searchParams.set('excludeParameterMetadata', 'true');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'apikey': CONFIG.DATAHUB_API_KEY
    },
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`DataHub ${timestep} HTTP ${response.status}: ${errorBody}`);
  }

  return response.json();
}

/**
 * Normalises the Hourly and Daily GeoJSON FeatureCollections into clean arrays
 * and computes horticultural hazard flags.
 */
function normaliseForecastData(hourlyGeoJson, dailyGeoJson) {
  const hourlyFeature = hourlyGeoJson?.features?.[0];
  const dailyFeature = dailyGeoJson?.features?.[0];

  if (!hourlyFeature || !dailyFeature) {
    throw new Error('Invalid GeoJSON structure returned from Met Office DataHub.');
  }

  const locationName =
    hourlyFeature.properties?.location?.name ||
    dailyFeature.properties?.location?.name ||
    'Selected Location';

  const coordinates = hourlyFeature.geometry?.coordinates || []; // [lon, lat, elevation]
  const modelRunDate = hourlyFeature.properties?.modelRunDate || null;

  const rawHourly = hourlyFeature.properties?.timeSeries || [];
  const rawDaily = dailyFeature.properties?.timeSeries || [];

  // 1. Normalise Hourly TimeSeries (next 48 hours for granular trigger checks)
  const hourly = rawHourly.slice(0, 48).map((entry) => ({
    time: entry.time,
    tempC: round1(entry.screenTemperature),
    minTempC: round1(entry.minScreenAirTemp),
    maxTempC: round1(entry.maxScreenAirTemp),
    feelsLikeC: round1(entry.feelsLikeTemperature),
    dewPointC: round1(entry.screenDewPointTemperature),
    humidityPercent: round1(entry.screenRelativeHumidity),
    precipMm: round1(entry.totalPrecipAmount ?? 0),
    snowMm: round1(entry.totalSnowAmount ?? 0),
    precipProbPercent: entry.probOfPrecipitation ?? null,
    windSpeedKmh: msToKmh(entry.windSpeed10m),
    windGustKmh: msToKmh(entry.windGustSpeed10m),
    maxWindGustKmh: msToKmh(entry.max10mWindGust),
    windDirectionDeg: entry.windDirectionFrom10m ?? null,
    uvIndex: entry.uvIndex ?? null,
    weatherCode: entry.significantWeatherCode ?? null,
    weatherDescription: WEATHER_CODES[entry.significantWeatherCode] || 'Unknown'
  }));

  // 2. Normalise Daily TimeSeries (7-day outlook)
  const daily = rawDaily
    .filter((entry) => entry.dayMaxScreenTemperature !== undefined || entry.nightMinScreenTemperature !== undefined)
    .map((entry) => {
      const middayGustKmh = msToKmh(entry.midday10MWindGust);
      const midnightGustKmh = msToKmh(entry.midnight10MWindGust);
      const peakGustKmh = Math.max(middayGustKmh || 0, midnightGustKmh || 0);

      return {
        date: entry.time ? entry.time.split('T')[0] : null,
        maxTempC: round1(entry.dayMaxScreenTemperature),
        minTempC: round1(entry.nightMinScreenTemperature),
        dayUpperBoundMaxTempC: round1(entry.dayUpperBoundMaxTemp),
        nightLowerBoundMinTempC: round1(entry.nightLowerBoundMinTemp),
        dayPrecipProbPercent: entry.dayProbabilityOfPrecipitation ?? null,
        nightPrecipProbPercent: entry.nightProbabilityOfPrecipitation ?? null,
        dayRainProbPercent: entry.dayProbabilityOfRain ?? null,
        nightSnowProbPercent: entry.nightProbabilityOfSnow ?? null,
        middayWindSpeedKmh: msToKmh(entry.midday10MWindSpeed),
        midnightWindSpeedKmh: msToKmh(entry.midnight10MWindSpeed),
        peakWindGustKmh: peakGustKmh > 0 ? peakGustKmh : null,
        middayHumidityPercent: round1(entry.middayRelativeHumidity),
        midnightHumidityPercent: round1(entry.midnightRelativeHumidity),
        maxUvIndex: entry.maxUvIndex ?? null,
        dayWeatherCode: entry.daySignificantWeatherCode ?? null,
        dayWeatherDescription: WEATHER_CODES[entry.daySignificantWeatherCode] || 'N/A',
        nightWeatherCode: entry.nightSignificantWeatherCode ?? null,
        nightWeatherDescription: WEATHER_CODES[entry.nightSignificantWeatherCode] || 'N/A'
      };
    });

  // 3. Evaluate Horticultural Rule Engine Flags across Hourly + Daily windows
  const frostWindows = [];
  const highWindWindows = [];
  let precipNext48hMm = 0;
  let maxConsecutiveBlightHours = 0;
  let currentBlightStreak = 0;

  for (const h of hourly) {
    const checkTemp = h.minTempC ?? h.tempC;
    if (checkTemp !== null && checkTemp <= CONFIG.THRESHOLDS.GROUND_FROST_TEMP_C) {
      frostWindows.push({
        time: h.time,
        tempC: checkTemp,
        type: checkTemp <= CONFIG.THRESHOLDS.AIR_FROST_TEMP_C ? 'AIR_FROST' : 'GROUND_FROST'
      });
    }

    const checkGust = h.maxWindGustKmh ?? h.windGustKmh;
    if (checkGust !== null && checkGust >= CONFIG.THRESHOLDS.WIND_ROCK_GUST_KMH) {
      highWindWindows.push({
        time: h.time,
        gustKmh: checkGust
      });
    }

    precipNext48hMm += h.precipMm || 0;

    if (
      h.tempC !== null &&
      h.tempC >= CONFIG.THRESHOLDS.BLIGHT_MIN_TEMP_C &&
      h.humidityPercent !== null &&
      h.humidityPercent >= CONFIG.THRESHOLDS.BLIGHT_MIN_RH_PERCENT
    ) {
      currentBlightStreak += 1;
      if (currentBlightStreak > maxConsecutiveBlightHours) {
        maxConsecutiveBlightHours = currentBlightStreak;
      }
    } else {
      currentBlightStreak = 0;
    }
  }

  for (const d of daily.slice(2)) {
    const lowTemp = d.nightLowerBoundMinTempC ?? d.minTempC;
    if (lowTemp !== null && lowTemp <= CONFIG.THRESHOLDS.GROUND_FROST_TEMP_C) {
      frostWindows.push({
        time: d.date,
        tempC: lowTemp,
        type: lowTemp <= CONFIG.THRESHOLDS.AIR_FROST_TEMP_C ? 'AIR_FROST' : 'GROUND_FROST'
      });
    }
    if (d.peakWindGustKmh !== null && d.peakWindGustKmh >= CONFIG.THRESHOLDS.WIND_ROCK_GUST_KMH) {
      highWindWindows.push({
        time: d.date,
        gustKmh: d.peakWindGustKmh
      });
    }
  }

  const hazardSummary = {
    frostRiskDetected: frostWindows.length > 0,
    lowestForecastTempC: Math.min(
      ...hourly.map((h) => h.minTempC ?? h.tempC ?? 99),
      ...daily.map((d) => d.minTempC ?? 99)
    ),
    frostEventsCount: frostWindows.length,
    firstFrostWindow: frostWindows[0] || null,

    windRockRiskDetected: highWindWindows.length > 0,
    maxForecastGustKmh: Math.max(
      0,
      ...hourly.map((h) => h.maxWindGustKmh ?? h.windGustKmh ?? 0),
      ...daily.map((d) => d.peakWindGustKmh ?? 0)
    ),
    highWindEventsCount: highWindWindows.length,

    waterloggingRiskDetected: precipNext48hMm >= CONFIG.THRESHOLDS.WATERLOGGING_72H_MM,
    cumulativePrecip48hMm: round1(precipNext48hMm),

    fungalBlightRiskDetected: maxConsecutiveBlightHours >= CONFIG.THRESHOLDS.BLIGHT_CONSECUTIVE_HOURS,
    maxConsecutiveHumidHours: maxConsecutiveBlightHours
  };

  return {
    location: {
      name: locationName,
      longitude: coordinates[0] ?? null,
      latitude: coordinates[1] ?? null,
      elevationM: coordinates[2] ?? null,
      modelRunDate
    },
    hazardSummary,
    daily,
    hourly
  };
}

// ============================================================================
// 4. NSWWS WEATHER WARNINGS FETCHER & XML/GEOJSON NORMALISER
// ============================================================================

async function fetchAndNormaliseWarnings(regionCode = CONFIG.DEFAULT_REGION_CODE) {
  const cleanRegion = String(regionCode).toLowerCase();

  // PATH A: Authenticated DataHub NSWWS Atom XML -> GeoJSON Issued Endpoint
  if (CONFIG.NSWWS_ATOM_URL && CONFIG.NSWWS_API_KEY) {
    try {
      const atomRes = await fetch(CONFIG.NSWWS_ATOM_URL, {
        headers: { 'x-api-key': CONFIG.NSWWS_API_KEY, 'Accept': 'application/atom+xml' },
        signal: AbortSignal.timeout(8000)
      });

      if (!atomRes.ok) {
        throw new Error(`NSWWS Atom Feed returned HTTP ${atomRes.status}`);
      }

      const atomXml = await atomRes.text();
      const parsedAtom = xmlParser.parse(atomXml);
      const links = parsedAtom?.feed?.link
        ? Array.isArray(parsedAtom.feed.link)
          ? parsedAtom.feed.link
          : [parsedAtom.feed.link]
        : [];

      const issuedLinkObj = links.find((l) => l['@_rel'] === 'related');
      const issuedGeoJsonUrl = issuedLinkObj?.['@_href'];

      if (!issuedGeoJsonUrl) {
        return { source: 'NSWWS_DATAHUB_ATOM', activeWarnings: [] };
      }

      const issuedRes = await fetch(issuedGeoJsonUrl, {
        headers: { 'x-api-key': CONFIG.NSWWS_API_KEY, 'Accept': 'application/vnd.geo+json' },
        signal: AbortSignal.timeout(8000)
      });

      if (!issuedRes.ok) {
        throw new Error(`NSWWS Issued GeoJSON returned HTTP ${issuedRes.status}`);
      }

      const issuedGeoJson = await issuedRes.json();
      const features = issuedGeoJson?.features || [];

      const activeWarnings = features
        .filter((f) => {
          const areas = f.properties?.affectedAreas || [];
          return areas.some(
            (a) => String(a.regionCode).toLowerCase() === cleanRegion || cleanRegion === 'uk'
          );
        })
        .map((f) => {
          const p = f.properties || {};
          return {
            id: p.warningId || p.issuedDate,
            level: p.warningLevel || 'UNKNOWN',
            weatherTypes: p.weatherType || [],
            headline: p.warningHeadline || '',
            validFrom: p.validFromDate || null,
            validTo: p.validToDate || null,
            likelihood: p.warningLikelihood ?? null,
            impact: p.warningImpact ?? null,
            affectedSubRegions: (p.affectedAreas || [])
              .filter((a) => String(a.regionCode).toLowerCase() === cleanRegion)
              .flatMap((a) => a.subRegions || [])
          };
        });

      return { source: 'NSWWS_DATAHUB_ATOM', activeWarnings };
    } catch (err) {
      logEvent('WARN', 'NSWWS_ATOM_FALLBACK', {
        reason: err.message,
        fallback: 'Public Regional RSS XML'
      });
    }
  }

  // PATH B: Public Met Office Regional Warnings XML Feed (No API Key Required)
  const rssUrl = `${CONFIG.PUBLIC_WARNINGS_RSS_BASE}/${cleanRegion}`;
  const rssRes = await fetch(rssUrl, {
    headers: { 'Accept': 'application/rss+xml, application/xml, text/xml' },
    signal: AbortSignal.timeout(8000)
  });

  if (!rssRes.ok) {
    throw new Error(`Met Office Warnings XML feed HTTP ${rssRes.status}`);
  }

  const rssXml = await rssRes.text();
  const parsedRss = xmlParser.parse(rssXml);
  const rawItems = parsedRss?.rss?.channel?.item;

  if (!rawItems) {
    return { source: 'MET_OFFICE_REGIONAL_XML', region: cleanRegion.toUpperCase(), activeWarnings: [] };
  }

  const itemsArray = Array.isArray(rawItems) ? rawItems : [rawItems];

  const activeWarnings = itemsArray.map((item) => {
    const title = item.title || '';
    const levelMatch = title.match(/^(Yellow|Amber|Red)\s+warning\s+of\s+([^\s]+(?:\s*,\s*[^\s]+)*)/i);
    const level = levelMatch ? levelMatch[1].toUpperCase() : 'YELLOW';
    const weatherTypes = levelMatch
      ? levelMatch[2].split(',').map((t) => t.trim().toUpperCase())
      : [];

    return {
      id: item.guid?.['#text'] || item.guid || item.link || title,
      level,
      weatherTypes,
      headline: title,
      description: item.description || '',
      publishedAt: item.pubDate || null,
      link: item.link || null
    };
  });

  return {
    source: 'MET_OFFICE_REGIONAL_XML',
    region: cleanRegion.toUpperCase(),
    activeWarnings
  };
}

// ============================================================================
// 5. EXPRESS PROXY ROUTE HANDLER
// ============================================================================

app.get('/api/weather/metoffice', async (req, res) => {
  const lat = req.query.lat ? Number(req.query.lat) : CONFIG.DEFAULT_LAT;
  const lon = req.query.lon ? Number(req.query.lon) : CONFIG.DEFAULT_LON;
  const region = req.query.region || CONFIG.DEFAULT_REGION_CODE;
  const forceRefresh = req.query.refresh === 'true';

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return res.status(400).json({ error: 'Invalid latitude or longitude parameters.' });
  }

  const cacheKey = `${lat.toFixed(4)}_${lon.toFixed(4)}_${String(region).toLowerCase()}`;
  const cached = responseCache.get(cacheKey);

  if (!forceRefresh && cached && Date.now() - cached.timestamp < CONFIG.CACHE_TTL_MS) {
    logEvent('INFO', 'CACHE_HIT', { cacheKey });
    return res.json({ ...cached.payload, cached: true });
  }

  try {
    logEvent('INFO', 'FETCHING_MET_OFFICE_DATA', { lat, lon, region });

    const [hourlyGeoJson, dailyGeoJson, warningsData] = await Promise.all([
      fetchDataHubEndpoint('hourly', lat, lon),
      fetchDataHubEndpoint('daily', lat, lon),
      fetchAndNormaliseWarnings(region)
    ]);

    const normalisedForecast = normaliseForecastData(hourlyGeoJson, dailyGeoJson);

    const payload = {
      fetchedAt: new Date().toISOString(),
      attribution: 'Contains public sector information licensed under the Open Government Licence v3.0. Met Office Weather DataHub & NSWWS.',
      location: normalisedForecast.location,
      severeWarnings: warningsData,
      hazardSummary: normalisedForecast.hazardSummary,
      dailyForecast: normalisedForecast.daily,
      hourlyForecast: normalisedForecast.hourly
    };

    responseCache.set(cacheKey, {
      timestamp: Date.now(),
      payload
    });

    logEvent('INFO', 'MET_OFFICE_SYNC_SUCCESS', {
      location: payload.location.name,
      activeWarningsCount: warningsData.activeWarnings.length,
      frostRisk: payload.hazardSummary.frostRiskDetected,
      windRisk: payload.hazardSummary.windRockRiskDetected
    });

    return res.json({ ...payload, cached: false });
  } catch (error) {
    logEvent('ERROR', 'MET_OFFICE_SYNC_FAILED', {
      error: error.message,
      lat,
      lon
    });

    if (cached) {
      return res.status(200).json({
        ...cached.payload,
        cached: true,
        staleWarning: `Live fetch failed (${error.message}); serving last known forecast.`
      });
    }

    return res.status(502).json({
      error: 'Failed to retrieve data from Met Office APIs.',
      details: error.message
    });
  }
});

export default app;
