import React from 'react';
import { useFarm } from '../../context/FarmContext';
import { Building2, Calendar, User, MapPin, Phone, Mail, FileText } from 'lucide-react';

interface CompanyReportHeaderProps {
  title: string;
  subtitle?: string;
  dateRangeText: string;
  houseFilterText?: string;
  categoryFilterText?: string;
}

export const CompanyReportHeader: React.FC<CompanyReportHeaderProps> = ({
  title,
  subtitle,
  dateRangeText,
  houseFilterText = 'All Houses (Farm-wide)',
  categoryFilterText
}) => {
  const { farmProfile, currentUser } = useFarm();

  const generatedDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs print:border-none print:shadow-none print:p-0 print:m-0 mb-6">
      {/* Top Company Branding Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-200 print:border-b-2 print:border-slate-800">
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Logo */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-forest-950 flex items-center justify-center shrink-0 border border-slate-200 shadow-xs print:border-slate-800">
            {farmProfile.logoUrl ? (
              <img
                src={farmProfile.logoUrl}
                alt={farmProfile.name}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-mint-400" />
            )}
          </div>

          {/* Farm Information */}
          <div>
            <span className="text-[10px] font-bold text-forest-700 uppercase tracking-widest bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200 print:border-none print:p-0">
              Official Farm Operational Document
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1 print:text-2xl">
              {farmProfile.name || 'L.P. LIM CITY FAMILY FARM INC'}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1 print:text-slate-700">
              {farmProfile.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 print:hidden" />
                  {farmProfile.address}
                </span>
              )}
              {farmProfile.contactNumber && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0 print:hidden" />
                  {farmProfile.contactNumber}
                </span>
              )}
              {farmProfile.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0 print:hidden" />
                  {farmProfile.email}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Report Metadata Block */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4 text-xs space-y-1.5 min-w-[240px] w-full sm:w-auto print:bg-transparent print:border-slate-800">
          <div className="flex items-center justify-between gap-3 text-slate-500 font-semibold text-[11px]">
            <span>Report Code:</span>
            <span className="font-mono text-slate-900 font-bold">RPT-{Date.now().toString().slice(-6)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">Date Generated:</span>
            <span className="font-bold text-slate-900">{generatedDateStr}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">Prepared By:</span>
            <span className="font-bold text-slate-900">{currentUser?.fullName || 'Authorized Staff'} ({currentUser?.role || 'User'})</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">System Engine:</span>
            <span className="font-semibold text-forest-800">FarmFlow Pro Broiler-Breeder OS</span>
          </div>
        </div>
      </div>

      {/* Report Title & Active Parameters Banner */}
      <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-forest-700 print:hidden" />
            {title}
          </h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3 py-1.5 bg-forest-50 border border-forest-200 rounded-xl text-forest-900 font-semibold flex items-center gap-1.5 print:border-slate-400">
            <Calendar className="w-3.5 h-3.5 text-forest-700" />
            <span>Period: <strong>{dateRangeText}</strong></span>
          </div>
          <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-800 font-semibold print:border-slate-400">
            <span>House: <strong>{houseFilterText}</strong></span>
          </div>
          {categoryFilterText && (
            <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-800 font-semibold print:border-slate-400">
              <span>Filter: <strong>{categoryFilterText}</strong></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const CompanyReportSignatures: React.FC = () => {
  const { currentUser } = useFarm();

  return (
    <div className="mt-8 pt-8 border-t border-slate-200 print:border-t-2 print:border-slate-800 print:mt-10">
      <div className="grid grid-cols-3 gap-6 sm:gap-8 text-center text-xs">
        <div className="space-y-8">
          <div className="h-10 flex items-end justify-center">
            <span className="font-bold text-slate-900">{currentUser?.fullName || 'Field Technician'}</span>
          </div>
          <div className="border-t border-slate-400 pt-1.5">
            <p className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Prepared By</p>
            <p className="text-[10px] text-slate-500">{currentUser?.role || 'Leadman / Flockman'}</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="h-10 flex items-end justify-center">
            <span className="text-slate-400 italic text-[11px] print:text-slate-700">________________________</span>
          </div>
          <div className="border-t border-slate-400 pt-1.5">
            <p className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Verified & Audited By</p>
            <p className="text-[10px] text-slate-500">Farm Veterinarian / Technical Lead</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="h-10 flex items-end justify-center">
            <span className="text-slate-400 italic text-[11px] print:text-slate-700">________________________</span>
          </div>
          <div className="border-t border-slate-400 pt-1.5">
            <p className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Approved By</p>
            <p className="text-[10px] text-slate-500">Farm Operations Manager / Director</p>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-[10px] text-slate-400 print:text-slate-600">
        Confidential Document &bull; Generated via FarmFlow Pro &bull; Official Breeder Farm Record
      </div>
    </div>
  );
};
