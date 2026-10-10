import React, { useState, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { BreedType, Flock } from '../../types';
import {
  Bird,
  Plus,
  HeartHandshake,
  Grid2X2,
  Trash2,
  ShieldCheck,
  Edit3,
  Sparkles,
  Download,
  Search,
  Users,
} from 'lucide-react';
import { calculateFlockAgeFromLoadingDate } from '../../utils/dateCalculations';
import { DataExportModal } from '../common/DataExportModal';
import {
  Button,
  IconButton,
  Modal,
  Input,
  Select,
  Textarea,
  PageHeader,
  StatCard,
  SegmentedControl,
  EmptyState,
} from '../ui';

type BreedFilter = 'all' | 'Cobb 500' | 'Ross 308';

export const FlockListView: React.FC = () => {
  const { flocks, addFlock, updateFlock, deleteFlock, getFlockStats, permissions } = useFarm();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [editingFlock, setEditingFlock] = useState<Flock | null>(null);

  // Live Client-Side Filtering & Search State
  const [breedFilter, setBreedFilter] = useState<BreedFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // New Flock Form State
  const [houseNumber, setHouseNumber] = useState('House 7');
  const [breed, setBreed] = useState<BreedType>('Cobb 500');
  const [initialMales, setInitialMales] = useState<number>(1000);
  const [loadingDateMale, setLoadingDateMale] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [initialFemales, setInitialFemales] = useState<number>(9500);
  const [loadingDateFemale, setLoadingDateFemale] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [hatchDate, setHatchDate] = useState<string>('2026-01-01');
  const [notes, setNotes] = useState<string>('Newly placed parent stock breeder flock');

  // Edit Loading Date Form State
  const [editLoadingDateFemale, setEditLoadingDateFemale] = useState<string>('');
  const [editLoadingDateMale, setEditLoadingDateMale] = useState<string>('');
  const [editBreed, setEditBreed] = useState<BreedType>('Cobb 500');
  const [editNotes, setEditNotes] = useState<string>('');

  const handleOpenEdit = (flock: Flock) => {
    setEditingFlock(flock);
    setEditLoadingDateFemale(flock.loadingDateFemale || flock.loadingDateMale || '');
    setEditLoadingDateMale(flock.loadingDateMale || flock.loadingDateFemale || '');
    setEditBreed(flock.breed);
    setEditNotes(flock.notes || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFlock) return;

    updateFlock(editingFlock.id, {
      loadingDateFemale: editLoadingDateFemale,
      loadingDateMale: editLoadingDateMale,
      breed: editBreed,
      notes: editNotes.trim(),
    });

    setEditingFlock(null);
  };

  const handleAddFlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (initialMales < 0 || initialFemales < 0) return;

    addFlock({
      houseNumber,
      breed,
      initialMales: Number(initialMales) || 0,
      initialFemales: Number(initialFemales) || 0,
      loadingDateMale,
      loadingDateFemale,
      hatchDate,
      status: 'active',
      notes: notes.trim(),
    });

    setShowAddModal(false);
  };

  // Aggregate KPI metrics across all active flocks
  const summaryStats = useMemo(() => {
    let totalMales = 0;
    let totalFemales = 0;
    let totalDepleted = 0;

    flocks.forEach((f) => {
      const st = getFlockStats(f.houseNumber);
      if (st) {
        totalMales += st.currentMales;
        totalFemales += st.currentFemales;
        totalDepleted += st.totalDepleted;
      }
    });

    const totalBirds = totalMales + totalFemales;
    const livability =
      totalBirds + totalDepleted > 0
        ? ((totalBirds / (totalBirds + totalDepleted)) * 100).toFixed(1)
        : '100.0';

    return {
      totalHouses: flocks.length,
      totalBirds,
      totalMales,
      totalFemales,
      livability,
    };
  }, [flocks, getFlockStats]);

  // Filtered flocks based on breed segment and search query
  const filteredFlocks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return flocks.filter((f) => {
      const matchesBreed =
        breedFilter === 'all' ||
        f.breed.toLowerCase().includes(breedFilter.toLowerCase());
      const matchesQuery =
        !q ||
        f.houseNumber.toLowerCase().includes(q) ||
        f.breed.toLowerCase().includes(q) ||
        (f.notes || '').toLowerCase().includes(q);
      return matchesBreed && matchesQuery;
    });
  }, [flocks, breedFilter, searchQuery]);

  const breedCounts = useMemo(() => {
    const cobb = flocks.filter((f) => f.breed.toLowerCase().includes('cobb')).length;
    const ross = flocks.filter((f) => f.breed.toLowerCase().includes('ross')).length;
    return { all: flocks.length, cobb, ross };
  }, [flocks]);

  // Real-time calculation preview for Add & Edit Modals
  const addModalAgePreview = calculateFlockAgeFromLoadingDate(
    loadingDateFemale || loadingDateMale
  );
  const editModalAgePreview = calculateFlockAgeFromLoadingDate(
    editLoadingDateFemale || editLoadingDateMale
  );

  return (
    <div className="space-y-6">
      {/* Standardized UX PageHeader */}
      <PageHeader
        kicker="Parent Stock Population Control"
        kickerIcon={<Bird className="w-4 h-4" />}
        title="Flock Management & Housing"
        description="Real-time tracking of age in weeks, livability %, male-to-female mating ratios & depletions."
        metadata={[
          `${summaryStats.totalHouses} Active Houses`,
          `${summaryStats.totalBirds.toLocaleString()} Total Breeder Birds`,
          `${summaryStats.livability}% Farm Livability`,
        ]}
        actions={
          <>
            <Button
              id="export-flock-report-btn"
              variant="dark"
              size="md"
              onClick={() => setShowExportModal(true)}
              leftIcon={<Download className="w-4 h-4 text-teal-400" />}
              title="Export Flock Data to CSV, PDF or Excel"
            >
              Export Flock Data
            </Button>

            {permissions.canAddFlock && (
              <Button
                id="add-new-flock-btn"
                variant="primary"
                size="md"
                onClick={() => setShowAddModal(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add New Flock
              </Button>
            )}
          </>
        }
      />

      {/* Aggregate KPI Summary Row using StatCard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Breeder Houses"
          value={summaryStats.totalHouses}
          unit="houses"
          subtitle="Parent stock placement"
          tone="teal"
          icon={<Bird className="w-4 h-4" />}
        />
        <StatCard
          label="Current Female Hens"
          value={summaryStats.totalFemales.toLocaleString()}
          unit="hens"
          subtitle="Active laying & rearing stock"
          tone="rose"
          icon={<Users className="w-4 h-4" />}
        />
        <StatCard
          label="Current Male Roosters"
          value={summaryStats.totalMales.toLocaleString()}
          unit="males"
          subtitle="Active breeding males"
          tone="teal"
          icon={<HeartHandshake className="w-4 h-4" />}
        />
        <StatCard
          label="Overall Farm Livability"
          value={`${summaryStats.livability}%`}
          subtitle={`${summaryStats.totalBirds.toLocaleString()} total live birds`}
          statusLabel="Nominal"
          trendDirection="up"
          tone="emerald"
          icon={<ShieldCheck className="w-4 h-4" />}
        />
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SegmentedControl<BreedFilter>
          ariaLabel="Filter flocks by genetic breed"
          value={breedFilter}
          onChange={setBreedFilter}
          options={[
            { value: 'all', label: 'All Houses', count: breedCounts.all },
            { value: 'Cobb 500', label: 'Cobb 500', count: breedCounts.cobb },
            { value: 'Ross 308', label: 'Ross 308', count: breedCounts.ross },
          ]}
        />

        <div className="w-full sm:w-64">
          <Input
            inputSize="sm"
            placeholder="Search house, breed, notes..."
            aria-label="Search flocks by house number, breed, or notes"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftAddon={<Search className="w-3.5 h-3.5" />}
          />
        </div>
      </div>

      {/* Flock Cards Grid or Accessible EmptyState */}
      {filteredFlocks.length === 0 ? (
        <EmptyState
          icon={<Bird className="w-6 h-6" />}
          title={
            flocks.length === 0
              ? 'No Breeder Flocks Registered'
              : 'No Houses Match Your Filter'
          }
          description={
            flocks.length === 0
              ? 'Register your first parent-stock breeder house to begin tracking bird age, livability, egg production, and daily feed intake.'
              : `No breeder houses matched "${searchQuery || breedFilter}". Try clearing your search query or switching the breed filter.`
          }
          secondaryActionLabel={
            flocks.length > 0 && (breedFilter !== 'all' || searchQuery)
              ? 'Reset Filters'
              : undefined
          }
          onSecondaryAction={() => {
            setBreedFilter('all');
            setSearchQuery('');
          }}
          actionLabel={permissions.canAddFlock ? 'Add New Flock' : undefined}
          actionIcon={<Plus className="w-4 h-4" />}
          onAction={permissions.canAddFlock ? () => setShowAddModal(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredFlocks.map((flock) => {
            const stats = getFlockStats(flock.houseNumber);
            if (!stats) return null;

            return (
              <article
                key={flock.id}
                aria-label={`${flock.houseNumber} - ${flock.breed}`}
                className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-xs overflow-hidden transition flex flex-col justify-between"
              >
                {/* Top Card Header */}
                <div className="p-5 bg-teal-950 text-white flex items-center justify-between border-b border-teal-900/50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-teal-300">
                        {flock.houseNumber}
                      </span>
                      <span className="text-teal-500" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-xs font-semibold text-teal-100">
                        {flock.breed}
                      </span>
                    </div>
                    <p className="text-[11px] text-teal-300/75 mt-1 tabular-nums">
                      Loading Date: {flock.loadingDateFemale || flock.loadingDateMale}
                    </p>
                  </div>

                  <div className="text-right tabular-nums">
                    <span className="text-[11px] text-teal-300/80 font-medium">
                      Age from Loading
                    </span>
                    <p className="text-lg font-black text-teal-300 leading-none mt-0.5">
                      Wk {stats.ageWeeks}{' '}
                      <span className="text-xs font-bold text-teal-200/80">
                        (Day {stats.ageDays || 1})
                      </span>
                    </p>
                    <p className="text-[10px] text-teal-300/60 mt-0.5">
                      {stats.totalDaysFromLoading || 0} total days
                    </p>
                  </div>
                </div>

                {/* Middle Metrics */}
                <div className="p-5 space-y-4">
                  {/* Population Row */}
                  <div className="grid grid-cols-3 gap-2 text-center tabular-nums">
                    <div className="p-2.5 bg-teal-50/70 rounded-xl border border-teal-100">
                      <p className="text-[10px] font-bold text-teal-700">Males</p>
                      <p className="text-base font-extrabold text-teal-950 mt-0.5">
                        {stats.currentMales.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-teal-600 font-medium">
                        Init: {flock.initialMales.toLocaleString()}
                      </p>
                    </div>

                    <div className="p-2.5 bg-rose-50/70 rounded-xl border border-rose-100">
                      <p className="text-[10px] font-bold text-rose-700">Females</p>
                      <p className="text-base font-extrabold text-rose-950 mt-0.5">
                        {stats.currentFemales.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-rose-600 font-medium">
                        Init: {flock.initialFemales.toLocaleString()}
                      </p>
                    </div>

                    <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-700">Livability</p>
                      <p className="text-base font-extrabold text-emerald-950 mt-0.5">
                        {typeof stats.livabilityPct === 'number' && !isNaN(stats.livabilityPct)
                          ? stats.livabilityPct.toFixed(1)
                          : '100.0'}
                        %
                      </p>
                      <p className="text-[10px] text-emerald-600 font-medium">
                        Total: {stats.totalCurrent.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Ratio & Depletion metrics */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs tabular-nums">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium flex items-center gap-1">
                        <HeartHandshake className="w-3.5 h-3.5 text-rose-500" aria-hidden="true" />
                        <span>Male to Female Ratio:</span>
                      </span>
                      <span className="font-bold text-slate-900">
                        {stats.maleToFemaleRatioStr} ({stats.maleRatioPct}% M)
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Total Depletions (M/F):</span>
                      <span className="font-semibold text-rose-700">
                        -{stats.totalDepleted} birds ({stats.totalMaleDepleted}M,{' '}
                        {stats.totalFemaleDepleted}F)
                      </span>
                    </div>
                  </div>

                  {/* Pens preview */}
                  {flock.pens && flock.pens.length > 0 && (
                    <div className="pt-2">
                      <p className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                        <Grid2X2 className="w-3 h-3 text-slate-400" aria-hidden="true" />
                        <span>Pens Configuration ({flock.pens.length} pens)</span>
                      </p>
                      <div className="grid grid-cols-2 gap-1.5 tabular-nums">
                        {flock.pens.map((pen) => (
                          <div
                            key={pen.id}
                            className="p-1.5 bg-slate-100/70 rounded-lg text-[11px] flex justify-between"
                          >
                            <span className="font-semibold text-slate-700">
                              {pen.name} ({pen.side}):
                            </span>
                            <span className="text-slate-600 font-medium">
                              {pen.males}M / {pen.females}F
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 truncate max-w-48 italic" title={flock.notes}>
                    {flock.notes || 'Normal flock status'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleOpenEdit(flock)}
                      leftIcon={<Edit3 className="w-3.5 h-3.5 text-teal-700" />}
                      className="text-teal-700 hover:bg-teal-100/80"
                      title="Edit flock loading dates and breed info"
                    >
                      Edit Date
                    </Button>

                    {permissions.canDeleteRecord && (
                      <IconButton
                        aria-label={`Delete ${flock.houseNumber} flock record`}
                        variant="ghost"
                        size="xs"
                        onClick={() => deleteFlock(flock.id)}
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete flock record"
                      />
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Accessible Modal: Edit Flock Loading Dates */}
      <Modal
        isOpen={Boolean(editingFlock)}
        onClose={() => setEditingFlock(null)}
        title="Adjust Flock Loading Dates"
        subtitle={
          editingFlock
            ? `${editingFlock.houseNumber} · Dynamic Age Recalculation`
            : undefined
        }
        size="md"
        tone="teal"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          {/* Dynamic Age Preview Card */}
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl space-y-1 tabular-nums">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-teal-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
                <span>Calculated Age from Placement:</span>
              </span>
              <span className="text-xs font-black text-teal-900">
                Week {editModalAgePreview.ageWeeks} · Day {editModalAgePreview.ageDays}
              </span>
            </div>
            <p className="text-[11px] text-teal-700">
              Total days housed: <strong>{editModalAgePreview.totalDaysFromLoading} days</strong> as
              of today.
            </p>
          </div>

          <Input
            label="Female Placement / Loading Date"
            type="date"
            required
            value={editLoadingDateFemale}
            onChange={(e) => setEditLoadingDateFemale(e.target.value)}
          />

          <Input
            label="Male Placement / Loading Date"
            type="date"
            required
            value={editLoadingDateMale}
            onChange={(e) => setEditLoadingDateMale(e.target.value)}
          />

          <Select
            label="Breed Type"
            value={editBreed}
            onChange={(e) => setEditBreed(e.target.value as BreedType)}
          >
            <option value="Cobb 500">Cobb 500</option>
            <option value="Ross 308">Ross 308</option>
            <option value="Cobb">Cobb</option>
            <option value="Ross">Ross</option>
          </Select>

          <Textarea
            label="Notes"
            rows={2}
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setEditingFlock(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Accessible Modal: Add New Flock */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Register New Breeder Flock"
        subtitle="Set loading numbers and breed genetics parameters"
        size="lg"
        tone="teal"
      >
        <form onSubmit={handleAddFlock} className="space-y-4">
          {/* Dynamic Age Preview Card */}
          <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-2xl space-y-1 tabular-nums">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-teal-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
                <span>Dynamic Placement Age:</span>
              </span>
              <span className="text-xs font-black text-teal-900">
                Week {addModalAgePreview.ageWeeks} · Day {addModalAgePreview.ageDays}
              </span>
            </div>
            <p className="text-[10px] text-teal-700">
              Calculated automatically from {loadingDateFemale || loadingDateMale} to today.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="House #"
              required
              value={houseNumber}
              onChange={(e) => setHouseNumber(e.target.value)}
              placeholder="e.g. House 7"
            />
            <Select
              label="Breed Type"
              required
              value={breed}
              onChange={(e) => setBreed(e.target.value as BreedType)}
            >
              <option value="Cobb 500">Cobb 500</option>
              <option value="Ross 308">Ross 308</option>
              <option value="Cobb">Cobb</option>
              <option value="Ross">Ross</option>
            </Select>
          </div>

          {/* Male Population */}
          <div className="p-3.5 bg-teal-50/70 border border-teal-200/80 rounded-2xl space-y-3">
            <p className="text-xs font-bold text-teal-950">Male Population Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Initial Males (0 or more)"
                type="number"
                required
                min="0"
                inputSize="sm"
                tabularNums
                value={initialMales}
                onChange={(e) => setInitialMales(Number(e.target.value))}
                className="font-bold text-teal-950"
              />
              <Input
                label="Male Loading Date"
                type="date"
                required
                inputSize="sm"
                value={loadingDateMale}
                onChange={(e) => setLoadingDateMale(e.target.value)}
              />
            </div>
          </div>

          {/* Female Population */}
          <div className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-2xl space-y-3">
            <p className="text-xs font-bold text-rose-950">Female Population Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Initial Females (0 or more)"
                type="number"
                required
                min="0"
                inputSize="sm"
                tabularNums
                value={initialFemales}
                onChange={(e) => setInitialFemales(Number(e.target.value))}
                className="font-bold text-rose-950"
              />
              <Input
                label="Female Loading Date"
                type="date"
                required
                inputSize="sm"
                value={loadingDateFemale}
                onChange={(e) => setLoadingDateFemale(e.target.value)}
              />
            </div>
          </div>

          <Input
            label="Hatch Date (Optional)"
            type="date"
            value={hatchDate}
            onChange={(e) => setHatchDate(e.target.value)}
          />

          <Textarea
            label="Notes / Placement Details"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Flock
            </Button>
          </div>
        </form>
      </Modal>

      {/* Flock Data Export Modal */}
      <DataExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        defaultCategory="flock_population"
        defaultHouse="All"
      />
    </div>
  );
};
