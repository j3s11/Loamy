/**
 * Northumberland Garden & Weather Sentinel - Frontend Orchestration Service
 * Target Environment: React 18+ / Google AI Studio Build Mode / Vite
 * Dependencies: npm install @google/genai
 */

import { useState, useCallback } from 'react';
import { GoogleGenAI, Type } from '@google/genai';

// ============================================================================
// 1. EDITABLE CONFIGURATION BLOCK
// ============================================================================
export const ADVISOR_CONFIG = {
  // API Key resolved from Google AI Studio environment or local Vite .env
  GEMINI_API_KEY:
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
    '',

  // Gemini Model (gemini-2.5-flash is optimal for structured JSON reasoning)
  GEMINI_MODEL: 'gemini-2.5-flash',

  // Backend Proxy URL & Browser Fallback Toggle
  MET_OFFICE_PROXY_URL: '/api/weather/metoffice',
  ENABLE_OPEN_METEO_UKMO_FALLBACK: true,
  OPEN_METEO_UKMO_URL: 'https://api.open-meteo.com/v1/ukmo',

  // Default Garden Microclimate Profile (Morpeth, Northumberland)
  DEFAULT_GARDEN_PROFILE: {
    locationName: 'Morpeth, Northumberland, UK',
    latitude: 55.1688,
    longitude: -1.6911,
    regionCode: 'ne',
    rhsHardinessZone: 'H4',
    usdaEquivalent: '8b',
    soilProfile: 'Heavy clay to alluvial loam, pH 6.0-6.8, prone to winter waterlogging and slow spring warming',
    microclimateNotes:
      'North East England maritime/inland transition; River Wansbeck basin frost pocket; high wind exposure; 2-3 weeks behind Southern England; average last spring frost 15-25 May; average first autumn frost early October.'
  },

  // Default Starter Plant Inventory (used if localStorage/Firestore is empty)
  DEFAULT_PLANT_INVENTORY: [
    {
      id: 'plt-01',
      name: "Dahlia 'Bishop of Llandaff'",
      rhsRating: 'H3',
      location: 'South-Facing Mixed Border (Heavy Clay)',
      growthStage: 'Late Flowering / Pre-Dormancy',
      vulnerabilities: ['Air frost blackens foliage', 'Tuber rot in waterlogged winter clay']
    },
    {
      id: 'plt-02',
      name: "Purple Sprouting Broccoli 'Rudolph'",
      rhsRating: 'H5',
      location: 'Open Allotment Bed (Exposed)',
      growthStage: 'Overwintering Vegetative Growth',
      vulnerabilities: ['Wind-rock in wet clay creating water pockets around stem', 'Pigeon damage', 'Clubroot']
    },
    {
      id: 'plt-03',
      name: "Citrus × meyeri 'Meyer Lemon'",
      rhsRating: 'H2',
      location: 'Terracotta Patio Pot',
      growthStage: 'Fruiting / Ripening',
      vulnerabilities: ['Root-ball freezing below 0°C', 'Cold drying winds', 'Winter waterlogging in saucers']
    },
    {
      id: 'plt-04',
      name: "Acer palmatum 'Bloodgood' (Japanese Maple)",
      rhsRating: 'H5',
      location: 'Sheltered Lawn Corner',
      growthStage: 'Leaf Drop / Autumn Dormancy',
      vulnerabilities: ['Cold gale-force wind scorch', 'Late spring frost on emerging buds']
    }
  ]
};

// ============================================================================
// 2. SYSTEM INSTRUCTIONS & STRUCTURED OUTPUT SCHEMA
// ============================================================================

const SYSTEM_INSTRUCTION = `You are a UK Chartered Horticultural Advisor integrated into a garden management app for a plot in Morpeth, Northumberland, North East England (55.16°N, RHS Hardiness Zone H4, heavy clay to alluvial loam soil, pH 6.0-6.8, River Wansbeck basin frost pocket, high wind exposure).

Strict Operational Rules:
1. Use UK English, metric units (°C, cm, m, mm, km/h, litres), and RHS terminology (RHS H1a-H7, RHS AGM, compost, horticultural fleece, cloche, earthing up, chitting, mulching, wind-rock).
2. Adjust all sowing, planting, pruning, and harvesting schedules for North East England (2 to 3 weeks behind Southern England; average last spring frost 15-25 May; average first autumn frost early October).
3. Cross-reference the provided 7-day Met Office forecast and Severe Weather Warnings against the user's active Plant Inventory.
4. Only generate weatherAlerts for plants genuinely threatened by the incoming conditions based on their RHS hardiness rating, planting container/location (terracotta pots freeze faster than open ground; raised beds drain faster than flat clay borders), and current growth stage.
5. Explicitly address regional hazards when triggered by the forecast: winter waterlogging in heavy clay, wind-rock on tall brassicas/shrubs in wet soil, slug/snail pressure after rain, late/early frost pockets, and damp fungal diseases (e.g., potato/tomato blight, botrytis).`;

const GARDEN_ADVICE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    weatherAlerts: {
      type: Type.ARRAY,
      description: 'Immediate protective actions triggered by the 7-day Met Office forecast and active warnings.',
      items: {
        type: Type.OBJECT,
        properties: {
          severity: {
            type: Type.STRING,
            enum: ['INFO', 'WARNING', 'CRITICAL'],
            description: 'CRITICAL for imminent frost on tender plants or Amber/Red warnings; WARNING for wind-rock/heavy rain.'
          },
          hazardType: {
            type: Type.STRING,
            enum: ['FROST', 'HIGH_WIND', 'WATERLOGGING', 'HEAT_DROUGHT', 'BLIGHT_HUMIDITY', 'PEST_PRESSURE']
          },
          forecastWindow: {
            type: Type.STRING,
            description: 'UK formatted date/time window when the hazard occurs (e.g., "Sunday 25 Oct, 02:00 - 07:00").'
          },
          affectedPlants: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Exact names of vulnerable plants from the user inventory.'
          },
          actionRequired: {
            type: Type.STRING,
            description: 'Direct, practical horticultural action (e.g., double-layer 30gsm fleece, stake and firm soil collar, move pot under glass).'
          }
        },
        required: ['severity', 'hazardType', 'forecastWindow', 'affectedPlants', 'actionRequired']
      }
    },
    seasonalTasks: {
      type: Type.ARRAY,
      description: 'Time-of-year gardening tasks tailored to the current date in North East England.',
      items: {
        type: Type.OBJECT,
        properties: {
          taskTitle: { type: Type.STRING },
          category: {
            type: Type.STRING,
            enum: ['PRUNING', 'SOWING_PLANTING', 'SOIL_CARE', 'PEST_DISEASE', 'PROTECTION']
          },
          targetPlants: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          instructions: {
            type: Type.STRING,
            description: 'Concise UK RHS-standard instructions adjusted for heavy clay and cool northern conditions.'
          }
        },
        required: ['taskTitle', 'category', 'targetPlants', 'instructions']
      }
    },
    soilAndMicroclimateNote: {
      type: Type.STRING,
      description: 'Assessment of current soil workability, drainage, and frost-pocket status based on incoming rain and temperatures.'
    }
  },
  required: ['weatherAlerts', 'seasonalTasks', 'soilAndMicroclimateNote']
};

// ============================================================================
// 3. TELEMETRY & LOGGING HELPER
// ============================================================================

function logClientEvent(level, action, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    action,
    ...meta
  };
  console.info('[GardenAdvisorService]', JSON.stringify(entry));
  return entry;
}

// ============================================================================
// 4. WEATHER FETCHER (MET OFFICE PROXY + OPEN-METEO UKMO FALLBACK)
// ============================================================================

export async function fetchGardenWeather(gardenProfile = ADVISOR_CONFIG.DEFAULT_GARDEN_PROFILE, forceRefresh = false) {
  const { latitude, longitude, regionCode } = gardenProfile;

  // 1. Attempt primary Node.js Met Office DataHub Proxy
  try {
    const proxyUrl = `${ADVISOR_CONFIG.MET_OFFICE_PROXY_URL}?lat=${latitude}&lon=${longitude}&region=${regionCode}&refresh=${forceRefresh}`;
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000)
    });

    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      const data = await response.json();
      logClientEvent('INFO', 'WEATHER_FETCH_PROXY_SUCCESS', {
        source: 'MET_OFFICE_DATAHUB_PROXY',
        cached: data.cached
      });
      return { ...data, dataSourceMode: 'MET_OFFICE_DATAHUB_PROXY' };
    }
    throw new Error(`Proxy returned status ${response.status}`);
  } catch (proxyError) {
    if (!ADVISOR_CONFIG.ENABLE_OPEN_METEO_UKMO_FALLBACK) {
      throw new Error(`Met Office Proxy unreachable and fallback disabled: ${proxyError.message}`);
    }
    logClientEvent('WARN', 'WEATHER_PROXY_FALLBACK_TRIGGERED', {
      reason: proxyError.message,
      fallback: 'OPEN_METEO_UKMO_2KM'
    });
  }

  // 2. Fallback: Direct Browser Fetch from Open-Meteo UK Met Office (UKV 2km) API
  const ukmoUrl = new URL(ADVISOR_CONFIG.OPEN_METEO_UKMO_URL);
  ukmoUrl.searchParams.set('latitude', latitude);
  ukmoUrl.searchParams.set('longitude', longitude);
  ukmoUrl.searchParams.set(
    'hourly',
    'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_gusts_10m,soil_temperature_6cm,soil_moisture_3_to_9cm'
  );
  ukmoUrl.searchParams.set(
    'daily',
    'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_gusts_10m_max'
  );
  ukmoUrl.searchParams.set('timezone', 'Europe/London');

  const ukmoRes = await fetch(ukmoUrl.toString(), { signal: AbortSignal.timeout(8000) });
  if (!ukmoRes.ok) {
    throw new Error(`Fallback UKMO weather fetch failed with HTTP ${ukmoRes.status}`);
  }

  const rawUkmo = await ukmoRes.json();

  const dailyForecast = (rawUkmo.daily?.time || []).map((dateStr, idx) => ({
    date: dateStr,
    maxTempC: rawUkmo.daily.temperature_2m_max?.[idx] ?? null,
    minTempC: rawUkmo.daily.temperature_2m_min?.[idx] ?? null,
    precipSumMm: rawUkmo.daily.precipitation_sum?.[idx] ?? 0,
    peakWindGustKmh: rawUkmo.daily.wind_gusts_10m_max?.[idx] ?? null
  }));

  const hourlyForecast = (rawUkmo.hourly?.time || []).slice(0, 48).map((timeStr, idx) => ({
    time: timeStr,
    tempC: rawUkmo.hourly.temperature_2m?.[idx] ?? null,
    humidityPercent: rawUkmo.hourly.relative_humidity_2m?.[idx] ?? null,
    precipMm: rawUkmo.hourly.precipitation?.[idx] ?? 0,
    windSpeedKmh: rawUkmo.hourly.wind_speed_10m?.[idx] ?? null,
    windGustKmh: rawUkmo.hourly.wind_gusts_10m?.[idx] ?? null,
    soilTemp6cmC: rawUkmo.hourly.soil_temperature_6cm?.[idx] ?? null,
    soilMoisture: rawUkmo.hourly.soil_moisture_3_to_9cm?.[idx] ?? null
  }));

  const lowestTempC = Math.min(...dailyForecast.map((d) => d.minTempC ?? 99));
  const maxGustKmh = Math.max(...dailyForecast.map((d) => d.peakWindGustKmh ?? 0));
  const precip48hMm = hourlyForecast.reduce((sum, h) => sum + (h.precipMm || 0), 0);

  return {
    fetchedAt: new Date().toISOString(),
    dataSourceMode: 'OPEN_METEO_UKMO_2KM_FALLBACK',
    location: {
      name: gardenProfile.locationName,
      latitude,
      longitude
    },
    severeWarnings: {
      source: 'LOCAL_THRESHOLD_DERIVED',
      activeWarnings: []
    },
    hazardSummary: {
      frostRiskDetected: lowestTempC <= 2.0,
      lowestForecastTempC: lowestTempC,
      windRockRiskDetected: maxGustKmh >= 40.0,
      maxForecastGustKmh: maxGustKmh,
      waterloggingRiskDetected: precip48hMm >= 30.0,
      cumulativePrecip48hMm: Number(precip48hMm.toFixed(1))
    },
    dailyForecast,
    hourlyForecast
  };
}

// ============================================================================
// 5. GEMINI HORTICULTURAL ADVISOR CALLER
// ============================================================================

export async function generateHorticulturalAdvice({
  weatherData,
  plantInventory = ADVISOR_CONFIG.DEFAULT_PLANT_INVENTORY,
  gardenProfile = ADVISOR_CONFIG.DEFAULT_GARDEN_PROFILE
}) {
  if (!ADVISOR_CONFIG.GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY. Set process.env.GEMINI_API_KEY or VITE_GEMINI_API_KEY.');
  }

  if (!weatherData) {
    throw new Error('weatherData payload is required before calling generateHorticulturalAdvice.');
  }

  const ai = new GoogleGenAI({ apiKey: ADVISOR_CONFIG.GEMINI_API_KEY });

  const currentUkDate = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Europe/London'
  }).format(new Date());

  const promptContext = {
    currentDateUK: currentUkDate,
    gardenMicroclimate: gardenProfile,
    activePlantInventory: plantInventory,
    metOfficeWeatherSummary: {
      dataSource: weatherData.dataSourceMode,
      severeWeatherWarnings: weatherData.severeWarnings?.activeWarnings || [],
      hazardRuleEngineFlags: weatherData.hazardSummary,
      sevenDayDailyOutlook: weatherData.dailyForecast,
      next24HoursHourlySample: (weatherData.hourlyForecast || []).slice(0, 24)
    }
  };

  logClientEvent('INFO', 'GEMINI_EVALUATION_START', {
    model: ADVISOR_CONFIG.GEMINI_MODEL,
    plantCount: plantInventory.length,
    frostRisk: weatherData.hazardSummary?.frostRiskDetected,
    windRisk: weatherData.hazardSummary?.windRockRiskDetected
  });

  try {
    const response = await ai.models.generateContent({
      model: ADVISOR_CONFIG.GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Evaluate the following garden inventory and 7-day Met Office forecast for ${currentUkDate}. Identify all plants at risk from incoming weather and provide seasonal tasks for North East England.\n\nContext JSON:\n${JSON.stringify(
                promptContext,
                null,
                2
              )}`
            }
          ]
        }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: GARDEN_ADVICE_SCHEMA,
        temperature: 0.2
      }
    });

    const rawText = response.text;
    if (!rawText) {
      throw new Error('Gemini returned an empty response payload.');
    }

    const parsedAdvice = JSON.parse(rawText);

    logClientEvent('INFO', 'GEMINI_EVALUATION_SUCCESS', {
      alertsGenerated: parsedAdvice.weatherAlerts?.length || 0,
      tasksGenerated: parsedAdvice.seasonalTasks?.length || 0
    });

    return parsedAdvice;
  } catch (error) {
    logClientEvent('ERROR', 'GEMINI_EVALUATION_FAILED', {
      error: error.message
    });
    throw new Error(`Horticultural Advisor evaluation failed: ${error.message}`);
  }
}

// ============================================================================
// 6. REACT HOOK FOR COMPONENT INTEGRATION
// ============================================================================

export function useGardenAdvisor(
  initialInventory = ADVISOR_CONFIG.DEFAULT_PLANT_INVENTORY,
  initialProfile = ADVISOR_CONFIG.DEFAULT_GARDEN_PROFILE
) {
  const [plantInventory, setPlantInventory] = useState(initialInventory);
  const [gardenProfile, setGardenProfile] = useState(initialProfile);
  const [weatherData, setWeatherData] = useState(null);
  const [advice, setAdvice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const runGardenAnalysis = useCallback(
    async (forceWeatherRefresh = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const latestWeather = await fetchGardenWeather(gardenProfile, forceWeatherRefresh);
        setWeatherData(latestWeather);

        const generatedAdvice = await generateHorticulturalAdvice({
          weatherData: latestWeather,
          plantInventory,
          gardenProfile
        });

        setAdvice(generatedAdvice);
        return { weather: latestWeather, advice: generatedAdvice };
      } catch (err) {
        setError(err.message || 'An unexpected error occurred during garden analysis.');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [gardenProfile, plantInventory]
  );

  return {
    plantInventory,
    setPlantInventory,
    gardenProfile,
    setGardenProfile,
    weatherData,
    advice,
    isLoading,
    error,
    runGardenAnalysis
  };
}
