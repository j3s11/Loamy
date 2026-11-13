import React, { useState, useRef, useEffect } from 'react';
import { X, Download, Copy, Upload, AlertTriangle } from 'lucide-react';
import {
  serializeGardenPlantsBackup,
  parseAndValidatePlantsBackup,
  applyPlantsBackupImport
} from '../utils/plantBackupUtils';
import { PlantRecord } from '../constants/gardenConfig';

interface PlantsBackupModalProps {
  isOpen: boolean;
  plantInventory: PlantRecord[];
  locationName?: string;
  onClose: () => void;
  onExportBackup: () => void;
  onImportConfirmed: (outcome: {
    nextPlants: PlantRecord[];
    importedCategories: string[];
    statusMessage: string;
  }) => void;
}

const PlantsBackupModal = React.memo(function PlantsBackupModal({
  isOpen,
  plantInventory,
  locationName,
  onClose,
  onExportBackup,
  onImportConfirmed
}: PlantsBackupModalProps) {
  const [backupImportMode, setBackupImportMode] = useState<'MERGE' | 'REPLACE'>('MERGE');
  const [backupJsonInput, setBackupJsonInput] = useState('');
  const [backupUploadedFileName, setBackupUploadedFileName] = useState('');
  const [backupErrorNotice, setBackupErrorNotice] = useState('');
  const [backupCopiedNotice, setBackupCopiedNotice] = useState(false);
  const backupFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setBackupErrorNotice('');
    setBackupCopiedNotice(false);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyJson = async () => {
    try {
      const jsonContent = serializeGardenPlantsBackup(plantInventory, {
        locationName: locationName || undefined
      });
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(jsonContent);
      }
      setBackupCopiedNotice(true);
      window.setTimeout(() => setBackupCopiedNotice(false), 2500);
    } catch (err) {
      console.warn('[PlantsBackupModal] Failed to copy backup JSON:', err);
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackupUploadedFileName(file.name);
    setBackupErrorNotice('');

    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      setBackupJsonInput(content);
    };
    reader.onerror = () => {
      setBackupErrorNotice('Could not read the selected file. Please try again.');
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseAndValidatePlantsBackup(backupJsonInput);
    if (!parsed.ok) {
      setBackupErrorNotice((parsed as { ok: false; error: string }).error);
      return;
    }

    const outcome = applyPlantsBackupImport(plantInventory, parsed.plants, backupImportMode);
    const importedCategories = Array.from(
      new Set(parsed.plants.map((p) => p.category).filter(Boolean) as string[])
    );
    const statusMessage =
      backupImportMode === 'REPLACE'
        ? `Backup restored: replaced inventory with ${outcome.totalCount} ${
            outcome.totalCount === 1 ? 'plant' : 'plants'
          }.`
        : `Backup restored: ${outcome.addedCount} added, ${outcome.updatedCount} updated (${outcome.totalCount} total plants in plot).`;

    setBackupErrorNotice('');
    setBackupJsonInput('');
    setBackupUploadedFileName('');
    onImportConfirmed({
      nextPlants: outcome.nextPlants as PlantRecord[],
      importedCategories,
      statusMessage
    });
  };

  return (
    <div
      data-testid="plants-backup-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plants-backup-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3.5 sm:p-6 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white border border-stone-200 shadow-2xl p-5 sm:p-6 space-y-5 my-auto"
      >
        <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3.5">
          <div>
            <h3
              id="plants-backup-modal-title"
              className="text-base sm:text-lg font-bold text-slate-900"
            >
              Backup &amp; Restore Garden Plants
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Export your {plantInventory.length} garden plants as a JSON backup or restore from a saved file.
            </p>
          </div>
          <button
            type="button"
            data-testid="close-plants-backup-modal"
            onClick={onClose}
            aria-label="Close backup modal"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-stone-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Export Current Inventory */}
        <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Export Current Plants ({plantInventory.length})
            </span>
            <span className="text-[11px] text-slate-500">JSON format v1</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="modal-download-backup-btn"
              onClick={onExportBackup}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Download Backup (.json)</span>
            </button>
            <button
              type="button"
              data-testid="copy-plants-backup-btn"
              onClick={handleCopyJson}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-stone-100 text-slate-800 border border-stone-300 transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span>{backupCopiedNotice ? 'Copied to Clipboard!' : 'Copy Backup JSON'}</span>
            </button>
          </div>
        </div>

        {/* Section 2: Import / Restore Plants */}
        <form onSubmit={handleConfirmImport} className="space-y-4">
          <div className="space-y-2">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              2. Import / Restore from Backup
            </span>

            <div
              role="radiogroup"
              aria-label="Import mode"
              className="grid grid-cols-1 sm:grid-cols-2 gap-2"
            >
              <button
                type="button"
                role="radio"
                aria-checked={backupImportMode === 'MERGE'}
                data-testid="import-mode-merge"
                onClick={() => setBackupImportMode('MERGE')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  backupImportMode === 'MERGE'
                    ? 'bg-emerald-50/90 border-emerald-700 text-emerald-950'
                    : 'bg-white border-stone-200 text-slate-700 hover:bg-stone-50'
                }`}
              >
                <div className="text-xs font-bold">Merge with existing plants</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Adds new plants and updates matching plants without deleting current ones.
                </div>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={backupImportMode === 'REPLACE'}
                data-testid="import-mode-replace"
                onClick={() => setBackupImportMode('REPLACE')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  backupImportMode === 'REPLACE'
                    ? 'bg-emerald-50/90 border-emerald-700 text-emerald-950'
                    : 'bg-white border-stone-200 text-slate-700 hover:bg-stone-50'
                }`}
              >
                <div className="text-xs font-bold">Replace entire plant list</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Replaces your current inventory with the plants in the backup file.
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="import-plants-json-textarea"
                className="text-xs font-semibold text-slate-700"
              >
                Select Backup File (.json) or Paste JSON
              </label>
              <div>
                <input
                  ref={backupFileInputRef}
                  type="file"
                  accept=".json,application/json"
                  data-testid="import-plants-file-input"
                  onChange={handleFileSelected}
                  className="sr-only"
                />
                <button
                  type="button"
                  data-testid="trigger-backup-file-btn"
                  onClick={() => backupFileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-slate-800 border border-stone-300 transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Choose .json File</span>
                </button>
              </div>
            </div>

            {backupUploadedFileName && (
              <p className="text-[11px] font-medium text-emerald-800">
                Loaded file: <strong>{backupUploadedFileName}</strong>
              </p>
            )}

            <textarea
              id="import-plants-json-textarea"
              data-testid="import-plants-json-textarea"
              rows={5}
              value={backupJsonInput}
              onChange={(e) => {
                setBackupJsonInput(e.target.value);
                if (backupErrorNotice) setBackupErrorNotice('');
              }}
              placeholder='Paste your Loamy backup JSON here or click "Choose .json File" above...'
              className="w-full px-3 py-2 text-base sm:text-xs font-mono rounded-xl bg-stone-50 border border-stone-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-700"
            />
          </div>

          {backupErrorNotice && (
            <div
              data-testid="import-plants-error"
              role="alert"
              className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-900 flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{backupErrorNotice}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="confirm-import-plants-btn"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 shrink-0" />
              <span>Restore Plants</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default PlantsBackupModal;
