import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import {
  PLANT_CATEGORY_DEFINITIONS,
  PlantGroupCategoryId,
  RhsCatalogPlant,
  fetchLiveRhsCatalogPlants,
  registerLiveRhsPlant,
  resolvePlantGroupCategory
} from '../utils/rhsPlantCatalog';
import { registerLivePlantImage } from '../utils/plantImages';
import { PlantRecord, UI_CONFIG } from '../constants/gardenConfig';

interface PlantFormModalProps {
  isOpen: boolean;
  editingPlant: PlantRecord | null;
  isSouthFacing: boolean;
  onClose: () => void;
  onSavePlant: (plant: PlantRecord, isEdit: boolean, chosenCategory: string) => void;
}

function buildInitialFormState(editingPlant: PlantRecord | null, isSouthFacing: boolean) {
  if (editingPlant) {
    return {
      name: editingPlant.name,
      category: resolvePlantGroupCategory(editingPlant),
      rhsRating: editingPlant.rhsRating || 'H4',
      location: editingPlant.location || UI_CONFIG.LOCATION_PRESETS[0],
      growthStage: editingPlant.growthStage || UI_CONFIG.GROWTH_STAGE_PRESETS[2],
      vulnerabilitiesText: Array.isArray(editingPlant.vulnerabilities)
        ? editingPlant.vulnerabilities.join(', ')
        : '',
      photoUrl: editingPlant.photoUrl || '',
      rhsUrl: editingPlant.rhsUrl || '',
      botanicalName: editingPlant.botanicalName || '',
      commonName: editingPlant.commonName || '',
      soilAndSun: editingPlant.soilAndSun || '',
      feedWindowUk: editingPlant.feedWindowUk || '',
      feedTypeNpk: editingPlant.feedTypeNpk || '',
      feedFrequencyDosage: editingPlant.feedFrequencyDosage || '',
      pruneMonthsUk: editingPlant.pruneMonthsUk || '',
      pruneType: editingPlant.pruneType || '',
      pruneTechnique: editingPlant.pruneTechnique || '',
      pruneAvoid: editingPlant.pruneAvoid || '',
      overwinteringProtocol: editingPlant.overwinteringProtocol || '',
      idDisambiguationNote: editingPlant.idDisambiguationNote || ''
    };
  }

  return {
    name: '',
    category: 'SHRUBS' as PlantGroupCategoryId,
    rhsRating: 'H4',
    location: isSouthFacing ? UI_CONFIG.LOCATION_PRESETS[0] : UI_CONFIG.LOCATION_PRESETS[1],
    growthStage: UI_CONFIG.GROWTH_STAGE_PRESETS[2],
    vulnerabilitiesText: '',
    photoUrl: '',
    rhsUrl: '',
    botanicalName: '',
    commonName: '',
    soilAndSun: '',
    feedWindowUk: '',
    feedTypeNpk: '',
    feedFrequencyDosage: '',
    pruneMonthsUk: '',
    pruneType: '',
    pruneTechnique: '',
    pruneAvoid: '',
    overwinteringProtocol: '',
    idDisambiguationNote: ''
  };
}

const PlantFormModal = React.memo(function PlantFormModal({
  isOpen,
  editingPlant,
  isSouthFacing,
  onClose,
  onSavePlant
}: PlantFormModalProps) {
  const [plantForm, setPlantForm] = useState(() =>
    buildInitialFormState(editingPlant, isSouthFacing)
  );
  const [formLiveSuggestions, setFormLiveSuggestions] = useState<RhsCatalogPlant[]>([]);
  const [isFormLookupLoading, setIsFormLookupLoading] = useState(false);

  // Sync form state whenever opened or target plant switches
  useEffect(() => {
    if (!isOpen) return;
    setPlantForm(buildInitialFormState(editingPlant, isSouthFacing));
    setFormLiveSuggestions([]);
  }, [isOpen, editingPlant, isSouthFacing]);

  // Live Pl@ntNet + RHS lookup when typing a plant name
  useEffect(() => {
    const q = plantForm.name.trim();
    if (!isOpen || q.length < 2) {
      setFormLiveSuggestions([]);
      setIsFormLookupLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsFormLookupLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetchLiveRhsCatalogPlants(q, 'ALL', 5, controller.signal);
        for (const plant of res.plants) {
          registerLivePlantImage(plant);
        }
        setFormLiveSuggestions(res.plants);
      } catch {
        if (!controller.signal.aborted) {
          setFormLiveSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsFormLookupLoading(false);
        }
      }
    }, 260);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [plantForm.name, isOpen]);

  if (!isOpen) return null;

  const handleApplySuggestion = (rhsPlant: RhsCatalogPlant) => {
    registerLivePlantImage(rhsPlant);
    registerLiveRhsPlant(rhsPlant);
    setPlantForm({
      name: rhsPlant.commonName || rhsPlant.name,
      category: resolvePlantGroupCategory(rhsPlant),
      rhsRating: rhsPlant.rhsRating || 'H4',
      location: rhsPlant.recommendedLocation || UI_CONFIG.LOCATION_PRESETS[0],
      growthStage: rhsPlant.defaultOctGrowthStage || UI_CONFIG.GROWTH_STAGE_PRESETS[2],
      vulnerabilitiesText: (rhsPlant.vulnerabilities || []).join(', '),
      photoUrl: rhsPlant.photoUrl || '',
      rhsUrl: rhsPlant.rhsUrl || '',
      botanicalName: rhsPlant.botanicalName || '',
      commonName: rhsPlant.commonName || rhsPlant.name,
      soilAndSun: rhsPlant.soilAndSun || '',
      feedWindowUk: rhsPlant.feedWindowUk || '',
      feedTypeNpk: rhsPlant.feedTypeNpk || '',
      feedFrequencyDosage: rhsPlant.feedFrequencyDosage || '',
      pruneMonthsUk: rhsPlant.pruneMonthsUk || '',
      pruneType: rhsPlant.pruneType || '',
      pruneTechnique: rhsPlant.pruneTechnique || '',
      pruneAvoid: rhsPlant.pruneAvoid || '',
      overwinteringProtocol: rhsPlant.overwinteringProtocol || '',
      idDisambiguationNote: rhsPlant.idDisambiguationNote || ''
    });
    setFormLiveSuggestions([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = plantForm.name.trim();
    if (!trimmedName) return;

    const vulnerabilities = plantForm.vulnerabilitiesText
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    const chosenCategory = plantForm.category || resolvePlantGroupCategory({ name: trimmedName });
    const savedRecord: PlantRecord = {
      ...(editingPlant || { id: `plt-${Date.now()}` }),
      name: trimmedName,
      category: chosenCategory,
      rhsRating: plantForm.rhsRating,
      location: plantForm.location,
      growthStage: plantForm.growthStage,
      vulnerabilities,
      commonName: plantForm.commonName || trimmedName,
      botanicalName: plantForm.botanicalName || undefined,
      photoUrl: plantForm.photoUrl || undefined,
      rhsUrl: plantForm.rhsUrl || undefined,
      soilAndSun: plantForm.soilAndSun || undefined,
      feedWindowUk: plantForm.feedWindowUk || undefined,
      feedTypeNpk: plantForm.feedTypeNpk || undefined,
      feedFrequencyDosage: plantForm.feedFrequencyDosage || undefined,
      pruneMonthsUk: plantForm.pruneMonthsUk || undefined,
      pruneType: plantForm.pruneType || undefined,
      pruneTechnique: plantForm.pruneTechnique || undefined,
      pruneAvoid: plantForm.pruneAvoid || undefined,
      overwinteringProtocol: plantForm.overwinteringProtocol || undefined,
      idDisambiguationNote: plantForm.idDisambiguationNote || undefined
    };

    if (savedRecord.photoUrl) {
      registerLivePlantImage(savedRecord);
    }

    onSavePlant(savedRecord, Boolean(editingPlant), chosenCategory);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 rounded-2xl bg-stone-50 border border-emerald-300 space-y-3"
    >
      <div className="flex items-center justify-between border-b border-stone-200 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
          {editingPlant ? 'Edit Plant' : 'Add Plant (with Pl@ntNet + RHS Lookup)'}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close plant form"
          className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="relative">
          <label htmlFor="plant-name-input" className="block text-xs font-semibold text-slate-700 mb-1">
            Plant Name *{' '}
            {isFormLookupLoading && (
              <span className="text-[11px] font-normal text-emerald-700">
                (Searching Pl@ntNet + RHS...)
              </span>
            )}
          </label>
          <input
            id="plant-name-input"
            type="text"
            required
            placeholder="Type a plant name to search Pl@ntNet + RHS..."
            value={plantForm.name}
            onChange={(e) => setPlantForm({ ...plantForm, name: e.target.value })}
            className="w-full min-h-[38px] px-3 py-1.5 text-base sm:text-sm rounded-xl bg-white border border-stone-300 text-slate-900"
          />
          {formLiveSuggestions.length > 0 && (
            <div className="mt-1.5 p-2 rounded-xl bg-white border border-emerald-200 shadow-sm space-y-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800 px-1">
                Tap a Pl@ntNet + RHS match to auto-fill:
              </span>
              {formLiveSuggestions.map((sug) => (
                <button
                  key={sug.catalogId}
                  type="button"
                  onClick={() => handleApplySuggestion(sug)}
                  className="w-full px-2 py-1.5 rounded-lg hover:bg-emerald-50 text-left flex items-center justify-between gap-2 transition cursor-pointer"
                >
                  <span className="text-xs font-semibold text-slate-900 truncate">
                    {sug.commonName || sug.name}{' '}
                    {sug.botanicalName && (
                      <span className="italic font-normal text-slate-500">
                        ({sug.botanicalName})
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 shrink-0">
                    {sug.rhsRating}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="plant-category-select" className="block text-xs font-semibold text-slate-700 mb-1">
            Category
          </label>
          <select
            id="plant-category-select"
            data-testid="plant-category-select"
            value={plantForm.category}
            onChange={(e) =>
              setPlantForm({
                ...plantForm,
                category: e.target.value as PlantGroupCategoryId
              })
            }
            className="w-full min-h-[38px] px-2.5 py-1.5 text-base sm:text-xs rounded-xl bg-white border border-stone-300 text-slate-900"
          >
            {PLANT_CATEGORY_DEFINITIONS.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label htmlFor="plant-rhs-select" className="block text-xs font-semibold text-slate-700 mb-1">
            RHS Hardiness
          </label>
          <select
            id="plant-rhs-select"
            value={plantForm.rhsRating}
            onChange={(e) => setPlantForm({ ...plantForm, rhsRating: e.target.value })}
            className="w-full min-h-[38px] px-2.5 py-1.5 text-base sm:text-xs rounded-xl bg-white border border-stone-300 text-slate-900"
          >
            {UI_CONFIG.RHS_RATINGS.map((r) => (
              <option key={r.code} value={r.code}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="plant-location-select" className="block text-xs font-semibold text-slate-700 mb-1">
            Border Position
          </label>
          <select
            id="plant-location-select"
            value={plantForm.location}
            onChange={(e) => setPlantForm({ ...plantForm, location: e.target.value })}
            className="w-full min-h-[38px] px-2.5 py-1.5 text-base sm:text-xs rounded-xl bg-white border border-stone-300 text-slate-900"
          >
            {UI_CONFIG.LOCATION_PRESETS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="plant-growth-stage-select" className="block text-xs font-semibold text-slate-700 mb-1">
          Current Growth Stage
        </label>
        <select
          id="plant-growth-stage-select"
          data-testid="plant-growth-stage-select"
          value={plantForm.growthStage}
          onChange={(e) => setPlantForm({ ...plantForm, growthStage: e.target.value })}
          className="w-full min-h-[38px] px-2.5 py-1.5 text-base sm:text-xs rounded-xl bg-white border border-stone-300 text-slate-900"
        >
          {UI_CONFIG.GROWTH_STAGE_PRESETS.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-200 text-slate-700 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-emerald-800 text-white cursor-pointer"
        >
          {editingPlant ? 'Save Changes' : 'Add Plant'}
        </button>
      </div>
    </form>
  );
});

export default PlantFormModal;
