import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import metOfficeProxy from './metOfficeProxy.js';
import {
  getAllSoilRainfallLogs,
  insertSoilRainfallLog,
  deleteSoilRainfallLog
} from './src/db/soilLogsDb.ts';
import {
  searchLiveRhsWebsite,
  fetchRawRhsPlantDetail,
  normalizeLiveRhsPlant
} from './src/services/rhsLiveService.ts';
import {
  searchPlantNamesWithPlantNetAndRhs,
  identifyPlantPhotoWithPlantNet
} from './src/services/plantNetService.ts';

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // ==========================================================================
  // 1. MOUNT MET OFFICE PROXY & STATIC ASSETS BEFORE CATCH-ALL ROUTES
  // ==========================================================================
  app.use(
    express.static(path.resolve(process.cwd(), 'public'), {
      maxAge: '7d',
      etag: true
    })
  );
  app.use(metOfficeProxy);

  // ==========================================================================
  // 1B. PL@NTNET + RHS PLANT NAME SEARCH & PHOTO IDENTIFICATION ROUTES
  // ==========================================================================
  app.get('/api/plantnet/search', async (req, res) => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : '';
      const category = typeof req.query.category === 'string' ? req.query.category : 'ALL';
      const limit = req.query.limit !== undefined ? Number(req.query.limit) : 14;

      const result = await searchPlantNamesWithPlantNetAndRhs(q, category, limit);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({
        error: err?.message || 'Failed to query Pl@ntNet + RHS plant database.'
      });
    }
  });

  app.post('/api/plantnet/identify', async (req, res) => {
    try {
      const { imageBase64, mimeType, organ, project } = req.body || {};
      if (!imageBase64 || typeof imageBase64 !== 'string') {
        return res.status(400).json({ error: 'imageBase64 is required for Pl@ntNet identification.' });
      }
      const result = await identifyPlantPhotoWithPlantNet({
        imageBase64,
        mimeType,
        organ,
        project
      });
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({
        error: err?.message || 'Failed to identify plant photo via Pl@ntNet.'
      });
    }
  });

  app.get('/api/rhs/plants/search', async (req, res) => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : '';
      const category = typeof req.query.category === 'string' ? req.query.category : 'ALL';
      const limit = req.query.limit !== undefined ? Number(req.query.limit) : 14;
      const offset = req.query.offset !== undefined ? Number(req.query.offset) : 0;

      const result = await searchLiveRhsWebsite(q, category, limit, offset);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({
        error: err?.message || 'Failed to query live RHS plant database.'
      });
    }
  });

  app.get('/api/rhs/plants/details/:id', async (req, res) => {
    try {
      const rhsId = Number(req.params.id);
      if (!rhsId || Number.isNaN(rhsId)) {
        return res.status(400).json({ error: 'Valid numeric RHS plant ID is required.' });
      }
      const detail = await fetchRawRhsPlantDetail(rhsId);
      if (!detail) {
        return res.status(404).json({ error: 'RHS plant profile not found.' });
      }
      const plant = normalizeLiveRhsPlant(detail, detail);
      return res.json({ source: 'RHS_LIVE_API', plant });
    } catch (err: any) {
      return res.status(500).json({
        error: err?.message || 'Failed to fetch live RHS plant details.'
      });
    }
  });

  // ==========================================================================
  // 2. HISTORICAL RAINFALL & SOIL SATURATION DATABASE ROUTES
  // ==========================================================================
  app.get('/api/soil-logs', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const locationQuery = {
      locationId: typeof req.query.locationId === 'string' ? req.query.locationId : undefined,
      locationName: typeof req.query.locationName === 'string' ? req.query.locationName : undefined,
      latitude: req.query.lat !== undefined && req.query.lat !== '' ? Number(req.query.lat) : undefined,
      longitude: req.query.lon !== undefined && req.query.lon !== '' ? Number(req.query.lon) : undefined,
      soilProfile: typeof req.query.soilProfile === 'string' ? req.query.soilProfile : undefined,
      gardenAspect: typeof req.query.gardenAspect === 'string' ? req.query.gardenAspect : undefined,
      rhsHardinessZone: typeof req.query.rhsZone === 'string' ? req.query.rhsZone : undefined
    };
    const data = getAllSoilRainfallLogs(locationQuery);
    res.json(data);
  });

  app.post('/api/soil-logs', (req, res) => {
    try {
      const {
        locationZone,
        locationId,
        locationName,
        latitude,
        longitude,
        soilProfile,
        gardenAspect,
        rhsHardinessZone,
        rainfall24hMm,
        rainfall48hMm,
        soilSaturationPct,
        soilTemp6cmC,
        frostPocketActive,
        notes,
        source
      } = req.body || {};

      if (rainfall24hMm === undefined || rainfall48hMm === undefined) {
        return res.status(400).json({ error: 'rainfall24hMm and rainfall48hMm are required numeric fields.' });
      }

      const locationQuery = {
        locationId,
        locationName,
        latitude: latitude !== undefined && latitude !== null && latitude !== '' ? Number(latitude) : undefined,
        longitude: longitude !== undefined && longitude !== null && longitude !== '' ? Number(longitude) : undefined,
        soilProfile,
        gardenAspect,
        rhsHardinessZone
      };

      const created = insertSoilRainfallLog({
        ...locationQuery,
        locationZone,
        rainfall24hMm: Number(rainfall24hMm),
        rainfall48hMm: Number(rainfall48hMm),
        soilSaturationPct: soilSaturationPct !== undefined && soilSaturationPct !== '' ? Number(soilSaturationPct) : undefined,
        soilTemp6cmC: soilTemp6cmC !== undefined && soilTemp6cmC !== '' ? Number(soilTemp6cmC) : undefined,
        frostPocketActive: Boolean(frostPocketActive),
        notes,
        source
      });

      return res.status(201).json({ entry: created, ...getAllSoilRainfallLogs(locationQuery) });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to record soil saturation log.' });
    }
  });

  app.delete('/api/soil-logs/:id', (req, res) => {
    const removed = deleteSoilRainfallLog(req.params.id);
    if (!removed) {
      return res.status(404).json({ error: 'Soil log entry not found.' });
    }
    const locationQuery = {
      locationId: typeof req.query.locationId === 'string' ? req.query.locationId : undefined,
      locationName: typeof req.query.locationName === 'string' ? req.query.locationName : undefined,
      latitude: req.query.lat !== undefined && req.query.lat !== '' ? Number(req.query.lat) : undefined,
      longitude: req.query.lon !== undefined && req.query.lon !== '' ? Number(req.query.lon) : undefined,
      soilProfile: typeof req.query.soilProfile === 'string' ? req.query.soilProfile : undefined,
      gardenAspect: typeof req.query.gardenAspect === 'string' ? req.query.gardenAspect : undefined,
      rhsHardinessZone: typeof req.query.rhsZone === 'string' ? req.query.rhsZone : undefined
    };
    return res.json(getAllSoilRainfallLogs(locationQuery));
  });

  // ==========================================================================
  // 3. VITE DEV MIDDLEWARE / STATIC PRODUCTION ASSETS
  // ==========================================================================
  if (process.env.NODE_ENV !== 'production') {
    let viteMiddleware: any = null;
    const viteReadyPromise = createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null
      },
      appType: 'spa'
    }).then((vite) => {
      viteMiddleware = vite.middlewares;
    });

    app.use(async (req, res, next) => {
      try {
        if (!viteMiddleware) {
          await viteReadyPromise;
        }
        return viteMiddleware(req, res, next);
      } catch (err) {
        return next(err);
      }
    });
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Garden & Weather Sentinel running on http://localhost:${PORT}`);
  });
}

startServer();

