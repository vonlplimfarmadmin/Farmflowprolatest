import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { 
  Building2, 
  Syringe, 
  Wheat, 
  TrendingUp, 
  Scale, 
  Egg, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Check, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldAlert,
  Camera,
  Upload,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { CompanyLogoUploadModal } from './CompanyLogoUploadModal';
import { 
  StandardMedProgramItem, 
  StandardFeedGuideItem, 
  StandardHendayItem, 
  StandardBodyWeightItem, 
  StandardEggWeightItem,
  FeedType
} from '../../types';

export const FarmProfileView: React.FC = () => {
  const { 
    farmProfile, 
    updateFarmProfile, 
    updateStandardVaccination, 
    updateStandardFeedGuide, 
    updateStandardHenday, 
    updateStandardBodyWeights, 
    updateStandardEggWeights,
    permissions 
  } = useFarm();

  const [activeTab, setActiveTab] = useState<'info' | 'vaccine' | 'feed' | 'henday' | 'bodyweight' | 'eggweight'>('info');
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [name, setName] = useState(farmProfile.name);
  const [address, setAddress] = useState(farmProfile.address);
  const [contactNumber, setContactNumber] = useState(farmProfile.contactNumber);
  const [email, setEmail] = useState(farmProfile.email);
  const [establishedYear, setEstablishedYear] = useState(farmProfile.establishedYear);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Vaccine Modal
  const [showAddVaccine, setShowAddVaccine] = useState(false);
  const [newVacWeek, setNewVacWeek] = useState(1);
  const [newVacProduct, setNewVacProduct] = useState('');
  const [newVacDisease, setNewVacDisease] = useState('');
  const [newVacMethod, setNewVacMethod] = useState('Drinking Water');
  const [newVacType, setNewVacType] = useState<StandardMedProgramItem['productType']>('Vaccine');

  // Feed Guide Modal
  const [showAddFeedGuide, setShowAddFeedGuide] = useState(false);
  const [newFgWeek, setNewFgWeek] = useState(1);
  const [newFgPhase, setNewFgPhase] = useState('Brooding');
  const [newFgMale, setNewFgMale] = useState(30);
  const [newFgFemale, setNewFgFemale] = useState(25);
  const [newFgType, setNewFgType] = useState<FeedType>('CSC 1');

  // Body weight modal
  const [showAddBw, setShowAddBw] = useState(false);
  const [newBwWeek, setNewBwWeek] = useState(1);
  const [newBwMale, setNewBwMale] = useState(150);
  const [newBwFemale, setNewBwFemale] = useState(140);

  // Henday Modal
  const [showAddHd, setShowAddHd] = useState(false);
  const [newHdWeek, setNewHdWeek] = useState(24);
  const [newHdProdWeek, setNewHdProdWeek] = useState(1);
  const [newHdPct, setNewHdPct] = useState(5.0);
  const [newHdHePct, setNewHdHePct] = useState(60.0);

  // Egg weight modal
  const [showAddEw, setShowAddEw] = useState(false);
  const [newEwWeek, setNewEwWeek] = useState(24);
  const [newEwProdWeek, setNewEwProdWeek] = useState(1);
  const [newEwGrams, setNewEwGrams] = useState(52.0);

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateFarmProfile({
      name,
      address,
      contactNumber,
      email,
      establishedYear
    });
    setIsEditingInfo(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleSaveLogo = (newLogoUrl: string) => {
    updateFarmProfile({ logoUrl: newLogoUrl });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleRemoveLogo = () => {
    updateFarmProfile({ logoUrl: '' });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleAddVaccine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVacProduct) return;
    const newItem: StandardMedProgramItem = {
      id: 'vac_' + Date.now(),
      ageWeek: Number(newVacWeek),
      productName: newVacProduct,
      productType: newVacType,
      diseaseTarget: newVacDisease || 'General Immunity',
      method: newVacMethod,
      mandatory: true
    };
    const updated = [...farmProfile.standardVaccinationProgram, newItem].sort((a, b) => a.ageWeek - b.ageWeek);
    updateStandardVaccination(updated);
    setShowAddVaccine(false);
    setNewVacProduct('');
    setNewVacDisease('');
  };

  const handleDeleteVaccine = (id: string) => {
    const updated = farmProfile.standardVaccinationProgram.filter(item => item.id !== id);
    updateStandardVaccination(updated);
  };

  const handleAddFeedGuide = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: StandardFeedGuideItem = {
      id: 'fg_' + Date.now(),
      ageWeek: Number(newFgWeek),
      productionPhase: newFgPhase,
      maleGramsPerBird: Number(newFgMale),
      femaleGramsPerBird: Number(newFgFemale),
      recommendedFeedType: newFgType
    };
    const updated = [...farmProfile.standardFeedGuide, newItem].sort((a, b) => a.ageWeek - b.ageWeek);
    updateStandardFeedGuide(updated);
    setShowAddFeedGuide(false);
  };

  const handleDeleteFeedGuide = (id: string) => {
    const updated = farmProfile.standardFeedGuide.filter(item => item.id !== id);
    updateStandardFeedGuide(updated);
  };

  const handleAddBodyWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: StandardBodyWeightItem = {
      id: 'bw_' + Date.now(),
      ageWeek: Number(newBwWeek),
      maleStandardGrams: Number(newBwMale),
      femaleStandardGrams: Number(newBwFemale)
    };
    const updated = [...farmProfile.standardBodyWeights, newItem].sort((a, b) => a.ageWeek - b.ageWeek);
    updateStandardBodyWeights(updated);
    setShowAddBw(false);
  };

  const handleDeleteBodyWeight = (id: string) => {
    const updated = farmProfile.standardBodyWeights.filter(item => item.id !== id);
    updateStandardBodyWeights(updated);
  };

  const handleAddHenday = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: StandardHendayItem = {
      id: 'hd_' + Date.now(),
      ageWeek: Number(newHdWeek),
      ageInProduction: Number(newHdProdWeek),
      standardHendayPct: Number(newHdPct),
      standardHatchingPct: Number(newHdHePct)
    };
    const updated = [...farmProfile.standardHenday, newItem].sort((a, b) => a.ageWeek - b.ageWeek);
    updateStandardHenday(updated);
    setShowAddHd(false);
  };

  const handleDeleteHenday = (id: string) => {
    const updated = farmProfile.standardHenday.filter(item => item.id !== id);
    updateStandardHenday(updated);
  };

  const handleAddEggWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: StandardEggWeightItem = {
      id: 'ew_' + Date.now(),
      ageWeek: Number(newEwWeek),
      ageInProduction: Number(newEwProdWeek),
      standardWeightGrams: Number(newEwGrams)
    };
    const updated = [...farmProfile.standardEggWeights, newItem].sort((a, b) => a.ageWeek - b.ageWeek);
    updateStandardEggWeights(updated);
    setShowAddEw(false);
  };

  const handleDeleteEggWeight = (id: string) => {
    const updated = farmProfile.standardEggWeights.filter(item => item.id !== id);
    updateStandardEggWeights(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-16 h-16 rounded-2xl bg-forest-950 text-mint-400 flex items-center justify-center font-black text-2xl shadow-xs ring-4 ring-forest-50 overflow-hidden border border-forest-900">
              {farmProfile.logoUrl ? (
                <img
                  src={farmProfile.logoUrl}
                  alt={farmProfile.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain bg-white p-1"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <span>LP</span>
              )}
            </div>
            {permissions.canManageFarmProfile && (
              <button
                type="button"
                onClick={() => setShowLogoModal(true)}
                title="Change company logo"
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-mint-400 text-forest-950 flex items-center justify-center shadow-md hover:bg-mint-300 transition"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">{farmProfile.name}</h2>
              {saveSuccess && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" /> Saved
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{farmProfile.address}</span>
            </p>
          </div>
        </div>

        {permissions.canManageFarmProfile && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="upload-farm-logo-btn"
              onClick={() => setShowLogoModal(true)}
              className="px-4 py-2.5 bg-forest-950 hover:bg-forest-900 text-mint-400 rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-xs border border-forest-800"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{farmProfile.logoUrl ? 'Change Company Logo' : 'Upload Company Logo'}</span>
            </button>

            {!isEditingInfo ? (
              <button
                id="edit-farm-profile-btn"
                onClick={() => setIsEditingInfo(true)}
                className="px-4 py-2.5 bg-mint-400 hover:bg-mint-300 text-forest-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile Info</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditingInfo(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>

      {/* Profile Edit Form if active */}
      {isEditingInfo && (
        <form onSubmit={handleSaveInfo} className="bg-white rounded-2xl border border-forest-200/80 p-6 shadow-xs space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-forest-800" />
              <span>Update Farm Identity & Contact Details</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">Official Registry Information</span>
          </div>

          {/* Logo preview and trigger in form */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden p-0.5 shrink-0">
                {farmProfile.logoUrl ? (
                  <img
                    src={farmProfile.logoUrl}
                    alt="Logo"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="font-black text-forest-950 text-sm">LP</span>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Official Company Logo</p>
                <p className="text-[11px] text-slate-500">
                  {farmProfile.logoUrl ? 'Custom logo uploaded & active' : 'Default emblem currently displayed'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowLogoModal(true)}
              className="px-3 py-1.5 bg-forest-950 hover:bg-forest-900 text-mint-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{farmProfile.logoUrl ? 'Change Logo' : 'Upload Logo'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Farm Enterprise Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-mint-500 focus:border-mint-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Address / Complex</label>
              <input
                type="text"
                required
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-mint-500 focus:border-mint-500 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={contactNumber}
                onChange={e => setContactNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-mint-500 focus:border-mint-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-mint-500 focus:border-mint-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Est. Year</label>
              <input
                type="text"
                value={establishedYear}
                onChange={e => setEstablishedYear(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-mint-500 focus:border-mint-500 outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-mint-400 hover:bg-mint-300 text-forest-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* Tabs for standard programs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200/80 pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition shrink-0 ${
            activeTab === 'info'
              ? 'bg-teal-950 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Farm Info</span>
        </button>

        <button
          onClick={() => setActiveTab('vaccine')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition shrink-0 ${
            activeTab === 'vaccine'
              ? 'bg-teal-950 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Syringe className="w-4 h-4" />
          <span>Standard Vaccination ({farmProfile.standardVaccinationProgram.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('feed')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition shrink-0 ${
            activeTab === 'feed'
              ? 'bg-teal-950 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Wheat className="w-4 h-4" />
          <span>Standard Feed Guide ({farmProfile.standardFeedGuide.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('henday')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition shrink-0 ${
            activeTab === 'henday'
              ? 'bg-teal-950 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Standard Henday %</span>
        </button>

        <button
          onClick={() => setActiveTab('bodyweight')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition shrink-0 ${
            activeTab === 'bodyweight'
              ? 'bg-teal-950 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Standard Body Weight</span>
        </button>

        <button
          onClick={() => setActiveTab('eggweight')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition shrink-0 ${
            activeTab === 'eggweight'
              ? 'bg-teal-950 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Egg className="w-4 h-4" />
          <span>Standard Egg Weight</span>
        </button>
      </div>

      {/* Tab 1: General Info */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Company Logo & Identity */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Company Logo</h4>
                {farmProfile.logoUrl ? (
                  <span className="text-[10px] bg-mint-50 text-forest-900 border border-mint-200 font-bold px-2 py-0.5 rounded-full">
                    Active Logo
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full">
                    Default Emblem
                  </span>
                )}
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden p-1 shrink-0">
                  {farmProfile.logoUrl ? (
                    <img
                      src={farmProfile.logoUrl}
                      alt="Farm Logo"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="font-black text-forest-950 text-lg">LP</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">Official Brand Crest</p>
                  <p className="text-[10px] text-slate-500">
                    {farmProfile.logoUrl ? 'Custom PNG/SVG Logo' : 'Default text monogram'}
                  </p>
                </div>
              </div>
            </div>

            {permissions.canManageFarmProfile && (
              <div className="pt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogoModal(true)}
                  className="flex-1 px-3 py-2 bg-forest-950 hover:bg-forest-900 text-mint-400 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{farmProfile.logoUrl ? 'Update Logo' : 'Upload Logo'}</span>
                </button>
                {farmProfile.logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    title="Remove logo"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition border border-slate-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Farm Overview</h4>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-slate-500">Enterprise</p>
                <p className="font-semibold text-slate-900">{farmProfile.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Industry Sector</p>
                <p className="font-semibold text-slate-900">Commercial Broiler-Breeder Parent Stock (PS)</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Established</p>
                <p className="font-semibold text-slate-900">{farmProfile.establishedYear} (14 Years of Operation)</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Primary Breeds</p>
                <p className="font-semibold text-slate-900">Cobb 500 & Ross 308 Parent Stock</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Contact & Logistics</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-slate-800 font-medium">{farmProfile.contactNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-slate-800 font-medium">{farmProfile.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-slate-800 font-medium">{farmProfile.address}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Facility Capacity</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Active Houses:</span>
                <span className="font-bold text-slate-900">6 Environmentally Controlled (EC)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Total Bird Capacity:</span>
                <span className="font-bold text-slate-900">~60,000 Breeders</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Daily Egg Capacity:</span>
                <span className="font-bold text-slate-900">~50,000 Eggs/day</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Standard Vaccination Program */}
      {activeTab === 'vaccine' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Standard Vaccination & Medication Program</h3>
              <p className="text-xs text-slate-500">Benchmark immunization schedule per age in weeks</p>
            </div>
            {permissions.canManageFarmProfile && (
              <button
                onClick={() => setShowAddVaccine(true)}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition self-start shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Standard Vaccine</span>
              </button>
            )}
          </div>

          {showAddVaccine && (
            <form onSubmit={handleAddVaccine} className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-2xl space-y-3 animate-fadeIn">
              <p className="text-xs font-bold text-teal-950">Add Vaccination Standard Rule</p>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Age in Weeks *</label>
                  <input
                    type="number"
                    min="1"
                    max="70"
                    required
                    value={newVacWeek}
                    onChange={e => setNewVacWeek(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Product / Vaccine *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Newcastle Clone 30"
                    value={newVacProduct}
                    onChange={e => setNewVacProduct(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Target Disease *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ND + IB"
                    value={newVacDisease}
                    onChange={e => setNewVacDisease(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Method *</label>
                  <select
                    value={newVacMethod}
                    onChange={e => setNewVacMethod(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  >
                    <option value="Drinking Water">Drinking Water</option>
                    <option value="Eye Drop">Eye Drop</option>
                    <option value="Wing Web">Wing Web</option>
                    <option value="Spray">Spray</option>
                    <option value="Subcutaneous Injection">Subcutaneous Injection</option>
                    <option value="Intramuscular Injection">Intramuscular Injection</option>
                    <option value="Feed Mix">Feed Mix</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddVaccine(false)}
                  className="px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-teal-600 text-white text-xs rounded-lg font-semibold hover:bg-teal-700 shadow-xs"
                >
                  Add Rule
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
                  <th className="py-2.5 px-3">Age (Wks)</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Target Disease</th>
                  <th className="py-2.5 px-3">Administration Method</th>
                  <th className="py-2.5 px-3">Notes</th>
                  {permissions.canDeleteRecord && <th className="py-2.5 px-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {farmProfile.standardVaccinationProgram.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-bold text-slate-800">Week {item.ageWeek}</td>
                    <td className="py-2.5 px-3 font-semibold text-teal-950">{item.productName}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-medium">
                        {item.productType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{item.diseaseTarget}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{item.method}</td>
                    <td className="py-2.5 px-3 text-slate-500">{item.notes || '—'}</td>
                    {permissions.canDeleteRecord && (
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteVaccine(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                          title="Delete rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Standard Feed Guide */}
      {activeTab === 'feed' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Standard Feed Guide per Age</h3>
              <p className="text-xs text-slate-500">Grams per bird per day (g/bird/day) recommendation</p>
            </div>
            {permissions.canManageFarmProfile && (
              <button
                onClick={() => setShowAddFeedGuide(true)}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition self-start shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Feed Guideline</span>
              </button>
            )}
          </div>

          {showAddFeedGuide && (
            <form onSubmit={handleAddFeedGuide} className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-2xl space-y-3 animate-fadeIn">
              <p className="text-xs font-bold text-teal-950">Add Standard Feed Guide Entry</p>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Age (Wks) *</label>
                  <input
                    type="number"
                    min="1"
                    max="70"
                    required
                    value={newFgWeek}
                    onChange={e => setNewFgWeek(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Phase</label>
                  <input
                    type="text"
                    required
                    value={newFgPhase}
                    onChange={e => setNewFgPhase(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Male (g/bird/day) *</label>
                  <input
                    type="number"
                    required
                    value={newFgMale}
                    onChange={e => setNewFgMale(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Female (g/bird/day) *</label>
                  <input
                    type="number"
                    required
                    value={newFgFemale}
                    onChange={e => setNewFgFemale(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Feed Type *</label>
                  <select
                    value={newFgType}
                    onChange={e => setNewFgType(e.target.value as FeedType)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  >
                    {['CSC 1', 'CSC 2', 'CGC', 'PDC', 'BLC 1', 'BLC 2', 'BLC 3', 'BMCC', 'BMCR'].map(ft => (
                      <option key={ft} value={ft}>{ft}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddFeedGuide(false)}
                  className="px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-teal-600 text-white text-xs rounded-lg font-semibold hover:bg-teal-700 shadow-xs"
                >
                  Add Guideline
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
                  <th className="py-2.5 px-3">Age (Wks)</th>
                  <th className="py-2.5 px-3">Phase</th>
                  <th className="py-2.5 px-3">Feed Type</th>
                  <th className="py-2.5 px-3">Male Intake (g/bird)</th>
                  <th className="py-2.5 px-3">Female Intake (g/bird)</th>
                  {permissions.canDeleteRecord && <th className="py-2.5 px-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {farmProfile.standardFeedGuide.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-bold text-slate-800">Week {item.ageWeek}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">{item.productionPhase}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold">
                        {item.recommendedFeedType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{item.maleGramsPerBird} g</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{item.femaleGramsPerBird} g</td>
                    {permissions.canDeleteRecord && (
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteFeedGuide(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Standard Henday % */}
      {activeTab === 'henday' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Standard Henday % Production Curve</h3>
              <p className="text-xs text-slate-500">Expected lay curve and hatching egg % per production age</p>
            </div>
            {permissions.canManageFarmProfile && (
              <button
                onClick={() => setShowAddHd(true)}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition self-start shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Henday Target</span>
              </button>
            )}
          </div>

          {showAddHd && (
            <form onSubmit={handleAddHenday} className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-2xl space-y-3 animate-fadeIn">
              <p className="text-xs font-bold text-teal-950">Add Standard Henday Target</p>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Age (Wks)</label>
                  <input
                    type="number"
                    value={newHdWeek}
                    onChange={e => setNewHdWeek(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Prod Week</label>
                  <input
                    type="number"
                    value={newHdProdWeek}
                    onChange={e => setNewHdProdWeek(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Standard Henday % *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newHdPct}
                    onChange={e => setNewHdPct(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Standard HE % *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newHdHePct}
                    onChange={e => setNewHdHePct(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddHd(false)}
                  className="px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-teal-600 text-white text-xs rounded-lg font-semibold hover:bg-teal-700 shadow-xs"
                >
                  Add Target
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
                  <th className="py-2.5 px-3">Flock Age (Wks)</th>
                  <th className="py-2.5 px-3">Prod Week</th>
                  <th className="py-2.5 px-3">Standard Henday %</th>
                  <th className="py-2.5 px-3">Standard HE % (Hatchable)</th>
                  {permissions.canDeleteRecord && <th className="py-2.5 px-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {farmProfile.standardHenday.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-bold text-slate-800">Week {item.ageWeek}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-600">Week {item.ageInProduction} in Lay</td>
                    <td className="py-2.5 px-3 font-bold text-teal-700">{item.standardHendayPct.toFixed(1)}%</td>
                    <td className="py-2.5 px-3 font-bold text-teal-900">{item.standardHatchingPct.toFixed(1)}%</td>
                    {permissions.canDeleteRecord && (
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteHenday(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Standard Body Weights */}
      {activeTab === 'bodyweight' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Standard Body Weight Curves</h3>
              <p className="text-xs text-slate-500">Benchmark weights in grams for Males and Females</p>
            </div>
            {permissions.canManageFarmProfile && (
              <button
                onClick={() => setShowAddBw(true)}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition self-start shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Body Weight Standard</span>
              </button>
            )}
          </div>

          {showAddBw && (
            <form onSubmit={handleAddBodyWeight} className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-2xl space-y-3 animate-fadeIn">
              <p className="text-xs font-bold text-teal-950">Add Standard Body Weight Target</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Age (Wks)</label>
                  <input
                    type="number"
                    value={newBwWeek}
                    onChange={e => setNewBwWeek(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Male Target (g) *</label>
                  <input
                    type="number"
                    value={newBwMale}
                    onChange={e => setNewBwMale(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Female Target (g) *</label>
                  <input
                    type="number"
                    value={newBwFemale}
                    onChange={e => setNewBwFemale(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBw(false)}
                  className="px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-teal-600 text-white text-xs rounded-lg font-semibold hover:bg-teal-700 shadow-xs"
                >
                  Save Standard
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
                  <th className="py-2.5 px-3">Age (Wks)</th>
                  <th className="py-2.5 px-3">Male Standard (g)</th>
                  <th className="py-2.5 px-3">Female Standard (g)</th>
                  <th className="py-2.5 px-3">Male / Female Ratio (g)</th>
                  {permissions.canDeleteRecord && <th className="py-2.5 px-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {farmProfile.standardBodyWeights.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-bold text-slate-800">Week {item.ageWeek}</td>
                    <td className="py-2.5 px-3 font-semibold text-teal-950">{item.maleStandardGrams.toLocaleString()} g</td>
                    <td className="py-2.5 px-3 font-semibold text-teal-700">{item.femaleStandardGrams.toLocaleString()} g</td>
                    <td className="py-2.5 px-3 text-slate-500 font-medium">
                      +{(item.maleStandardGrams - item.femaleStandardGrams)} g ({(item.maleStandardGrams / item.femaleStandardGrams).toFixed(2)}x)
                    </td>
                    {permissions.canDeleteRecord && (
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteBodyWeight(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: Standard Egg Weights */}
      {activeTab === 'eggweight' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Standard Egg Weight Progression</h3>
              <p className="text-xs text-slate-500">Benchmark hatching egg weight in grams per production age</p>
            </div>
            {permissions.canManageFarmProfile && (
              <button
                onClick={() => setShowAddEw(true)}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition self-start shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Egg Weight Target</span>
              </button>
            )}
          </div>

          {showAddEw && (
            <form onSubmit={handleAddEggWeight} className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-2xl space-y-3 animate-fadeIn">
              <p className="text-xs font-bold text-teal-950">Add Standard Egg Weight Target</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Flock Age (Wks)</label>
                  <input
                    type="number"
                    value={newEwWeek}
                    onChange={e => setNewEwWeek(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Production Week</label>
                  <input
                    type="number"
                    value={newEwProdWeek}
                    onChange={e => setNewEwProdWeek(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Standard Weight (g) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newEwGrams}
                    onChange={e => setNewEwGrams(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-teal-500 outline-hidden"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddEw(false)}
                  className="px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-teal-600 text-white text-xs rounded-lg font-semibold hover:bg-teal-700 shadow-xs"
                >
                  Save Standard
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
                  <th className="py-2.5 px-3">Flock Age (Wks)</th>
                  <th className="py-2.5 px-3">Production Week</th>
                  <th className="py-2.5 px-3">Standard Egg Weight (g)</th>
                  {permissions.canDeleteRecord && <th className="py-2.5 px-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {farmProfile.standardEggWeights.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-bold text-slate-800">Week {item.ageWeek}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-600">Week {item.ageInProduction} of Lay</td>
                    <td className="py-2.5 px-3 font-bold text-teal-700">{item.standardWeightGrams.toFixed(1)} g</td>
                    {permissions.canDeleteRecord && (
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteEggWeight(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Company Logo Upload Modal */}
      <CompanyLogoUploadModal
        isOpen={showLogoModal}
        onClose={() => setShowLogoModal(false)}
        currentLogoUrl={farmProfile.logoUrl}
        farmName={farmProfile.name}
        onSaveLogo={handleSaveLogo}
      />
    </div>
  );
};
