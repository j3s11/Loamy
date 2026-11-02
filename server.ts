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
  // 2. HISTORICAL RAINFALL & SOIL SATURATION DATABASE ROUTES
  // ==========================================================================
  app.get('/api/soil-logs', (req, res) => {
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
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
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

