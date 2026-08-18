import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { UserRole, User } from '../../types';
import { 
  Users, 
  ShieldCheck, 
  Check, 
  X, 
  Edit2, 
  Trash2, 
  Clock, 
  Activity, 
  FileText, 
  AlertTriangle,
  Download,
  Upload,
  RefreshCw,
  Home,
  CheckCircle2,
  Database,
  CloudUpload
} from 'lucide-react';
import { RoleBadge } from '../common/RoleBadge';

export const SettingsView: React.FC = () => {
  const { 
    users, 
    approveUser, 
    updateUserRole, 
    updateUserStatus, 
    assignUserHouses, 
    auditLogs, 
    currentUser, 
    flocks,
    permissions,
    dbStatus,
    checkDBStatus,
    syncAllToMongoDB
  } = useFarm();

  const [activeTab, setActiveTab] = useState<'users' | 'approvals' | 'audit' | 'backup'>('users');
  const [selectedUserForHouses, setSelectedUserForHouses] = useState<User | null>(null);
  const [selectedHouses, setSelectedHouses] = useState<string[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleSyncToMongo = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await syncAllToMongoDB();
      setSyncFeedback(res.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const pendingUsers = users.filter(u => u.status === 'pending');
  const activeUsers = users.filter(u => u.status !== 'pending');

  const handleOpenAssignHouses = (user: User) => {
    setSelectedUserForHouses(user);
    setSelectedHouses(user.designatedHouses || []);
  };

  const handleSaveAssignedHouses = () => {
    if (selectedUserForHouses) {
      assignUserHouses(selectedUserForHouses.id, selectedHouses);
      setSelectedUserForHouses(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const toggleHouseSelection = (houseNum: string) => {
    if (selectedHouses.includes(houseNum)) {
      setSelectedHouses(selectedHouses.filter(h => h !== houseNum));
    } else {
      setSelectedHouses([...selectedHouses, houseNum]);
    }
  };

  const handleExportData = () => {
    const backup = {
      timestamp: new Date().toISOString(),
      app: 'Broiler-Breeder Farm Management System',
      version: '1.0.0',
      flocks: localStorage.getItem('bbfms_flocks'),
      eggProduction: localStorage.getItem('bbfms_egg_production'),
      feedStock: localStorage.getItem('bbfms_feed_stock'),
      feedConsumption: localStorage.getItem('bbfms_feed_consumption'),
      depletions: localStorage.getItem('bbfms_depletions'),
      medProducts: localStorage.getItem('bbfms_med_products')
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BBFMS_Farm_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 text-slate-700 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Administration & System Controls</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">User Access & Security Management</h2>
          <p className="text-xs text-slate-500 mt-1">
            Role assignments, house-level permissions, new user authorizations, and system audit trail.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80 self-start">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'users' ? 'bg-teal-950 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Staff Roster ({activeUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'approvals' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Pending Approvals</span>
            {pendingUsers.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-teal-100 text-teal-950 text-[10px] font-extrabold">
                {pendingUsers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'audit' ? 'bg-teal-950 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Audit Logs</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'backup' ? 'bg-teal-950 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Data Backup</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Staff Roster */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Registered Farm Staff Accounts</h3>
              <p className="text-xs text-slate-500">Manage account access, designations, and roles</p>
            </div>
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> House Assignment Updated
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
                  <th className="py-3 px-3">User & Contact</th>
                  <th className="py-3 px-3">System Role</th>
                  <th className="py-3 px-3">Designated House Access</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Registered Date</th>
                  {permissions.canManageUsers && <th className="py-3 px-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{user.fullName}</p>
                      <p className="text-[11px] text-slate-500">@{user.username} • {user.email}</p>
                    </td>
                    <td className="py-3 px-3">
                      {permissions.canManageUsers && user.id !== currentUser?.id ? (
                        <select
                          value={user.role}
                          onChange={e => updateUserRole(user.id, e.target.value as UserRole)}
                          className="px-2.5 py-1.5 text-xs font-bold border border-slate-200 rounded-xl bg-white focus:outline-teal-500 outline-hidden"
                        >
                          <option value="System Administrator">System Administrator</option>
                          <option value="Farm Manager">Farm Manager</option>
                          <option value="Leadman">Leadman</option>
                          <option value="Flockman">Flockman</option>
                          <option value="Egg Collector">Egg Collector</option>
                        </select>
                      ) : (
                        <RoleBadge role={user.role} />
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {['Flockman', 'Leadman', 'Egg Collector'].includes(user.role) ? (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">
                            {user.designatedHouses && user.designatedHouses.length > 0
                              ? user.designatedHouses.join(', ')
                              : 'All Houses'}
                          </span>
                          {permissions.canManageUsers && (
                            <button
                              onClick={() => handleOpenAssignHouses(user)}
                              className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                            >
                              Assign
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Universal Access</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        user.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {user.status === 'approved' ? 'Active' : user.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{user.registeredAt}</td>
                    {permissions.canManageUsers && (
                      <td className="py-3 px-3 text-right">
                        {user.id !== currentUser?.id && (
                          <button
                            onClick={() => updateUserStatus(user.id, user.status === 'approved' ? 'disabled' : 'approved')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                              user.status === 'approved'
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {user.status === 'approved' ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Pending Approvals */}
      {activeTab === 'approvals' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">New Account Approval Queue</h3>
            <p className="text-xs text-slate-500">
              Per system policy: Newly registered users must be approved by the System Administrator before accessing the app.
            </p>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-sm text-slate-800">All Registrations Approved</p>
              <p className="text-xs text-slate-500 mt-1">No pending user account requests at this time.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map(user => (
                <div
                  key={user.id}
                  className="p-4 bg-teal-50/50 border border-teal-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{user.fullName}</h4>
                      <RoleBadge role={user.role} />
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Username: <strong>{user.username}</strong> • Email: {user.email} • Registered: {user.registeredAt}
                    </p>
                  </div>

                  {permissions.canApproveUsers ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => approveUser(user.id)}
                        className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve Access</span>
                      </button>
                      <button
                        onClick={() => updateUserStatus(user.id, 'disabled')}
                        className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-teal-800 italic">Pending Admin Review</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: System Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">System Activity & Audit Trail</h3>
              <p className="text-xs text-slate-500">Immutable trace of user actions, additions, and updates</p>
            </div>
            <span className="text-xs text-slate-500 font-medium">{auditLogs.length} events logged</span>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80 sticky top-0">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Action Type</th>
                  <th className="py-2.5 px-3">Module</th>
                  <th className="py-2.5 px-3">Actor / Username</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 text-slate-500 font-medium whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">{log.module}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{log.performedBy}</td>
                    <td className="py-2.5 px-3 text-slate-600">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Data Backup & Recovery */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Data Persistence & Farm Export</h3>
            <p className="text-xs text-slate-500">
              Download complete farm state, records, and vaccination schedules as JSON archive.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* MongoDB Cloud Storage */}
            <div className={`p-5 rounded-2xl border space-y-3 md:col-span-2 ${
              dbStatus.connected ? 'bg-mint-50/70 border-mint-200' : 'bg-graphite-50 border-graphite-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${dbStatus.connected ? 'bg-mint-500 text-forest-950' : 'bg-graphite-200 text-graphite-700'}`}>
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-graphite-900 flex items-center gap-2">
                      <span>MongoDB Cloud Persistence</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        dbStatus.connected ? 'bg-mint-200 text-forest-900' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {dbStatus.connected ? 'Connected' : 'Local Mode'}
                      </span>
                    </h4>
                    <p className="text-xs text-graphite-600">
                      {dbStatus.connected 
                        ? `Connected to database "${dbStatus.dbName}". All egg collections, flocks, and feed entries are synced to the cloud.`
                        : 'Connect MongoDB to automatically back up all production metrics and collaborate across devices in real-time.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={checkDBStatus}
                    className="p-2 bg-white rounded-xl border border-graphite-200 hover:bg-graphite-50 text-graphite-700 text-xs font-bold transition shadow-2xs"
                    title="Check MongoDB status"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleSyncToMongo}
                    disabled={isSyncing || !dbStatus.connected}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs ${
                      dbStatus.connected
                        ? 'bg-forest-900 hover:bg-forest-850 text-white'
                        : 'bg-graphite-200 text-graphite-400 cursor-not-allowed'
                    }`}
                  >
                    <CloudUpload className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync All Data to MongoDB'}</span>
                  </button>
                </div>
              </div>

              {dbStatus.connected && dbStatus.stats && (
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-mint-200/60 text-center">
                  <div className="bg-white/80 p-2.5 rounded-xl border border-mint-100">
                    <span className="block text-[10px] text-graphite-500 font-bold uppercase">Egg Logs in DB</span>
                    <span className="text-base font-extrabold text-forest-950">{dbStatus.stats.eggRecordsCount}</span>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-xl border border-mint-100">
                    <span className="block text-[10px] text-graphite-500 font-bold uppercase">Flocks in DB</span>
                    <span className="text-base font-extrabold text-forest-950">{dbStatus.stats.flocksCount}</span>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-xl border border-mint-100">
                    <span className="block text-[10px] text-graphite-500 font-bold uppercase">Feed Logs in DB</span>
                    <span className="text-base font-extrabold text-forest-950">{dbStatus.stats.feedRecordsCount}</span>
                  </div>
                </div>
              )}

              {syncFeedback && (
                <div className="p-3 bg-white rounded-xl border border-graphite-200 text-xs font-medium text-forest-900">
                  {syncFeedback}
                </div>
              )}
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Download className="w-4 h-4 text-teal-600" />
                <span>Export Local Farm Archive</span>
              </h4>
              <p className="text-xs text-slate-600">
                Downloads all flocks, daily egg collections, feed inventory, and biological logs to your computer.
              </p>
              <button
                onClick={handleExportData}
                className="px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Download Backup File (.JSON)</span>
              </button>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-teal-600" />
                <span>Storage & Offline Resilience</span>
              </h4>
              <p className="text-xs text-slate-600">
                All records are automatically saved in local persistent memory. You can access all farm functions offline without interruption.
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-teal-700">
                <CheckCircle2 className="w-4 h-4" />
                <span>Local Storage Status: Active & Synchronized</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Assign Houses to Staff */}
      {selectedUserForHouses && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-md overflow-hidden">
            <div className="bg-teal-950 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Assign House Access</h3>
                <p className="text-xs text-slate-300">Staff: {selectedUserForHouses.fullName} ({selectedUserForHouses.role})</p>
              </div>
              <button onClick={() => setSelectedUserForHouses(null)} className="text-slate-400 hover:text-white text-lg">
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Select which poultry houses this user is authorized to manage and log data for:
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                {flocks.map(f => {
                  const isChecked = selectedHouses.includes(f.houseNumber);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggleHouseSelection(f.houseNumber)}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition ${
                        isChecked
                          ? 'bg-teal-50 border-teal-400 text-teal-950'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{f.houseNumber}</span>
                      {isChecked && <Check className="w-4 h-4 text-teal-600" />}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedUserForHouses(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAssignedHouses}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Save House Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
