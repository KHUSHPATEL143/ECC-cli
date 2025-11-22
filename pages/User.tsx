
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { UserDetails } from '../types';
import { Loader } from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { Edit2, Save, X } from 'lucide-react';

const safeFloat = (val: any): number => {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
};

const InfoBlock = ({ label, value, subValue, subColor }: { label: string, value: string, subValue?: string, subColor?: string }) => (
    <div className="bg-navy-900 p-4 rounded-lg border border-gold-600/10">
        <p className="text-xs text-subtext uppercase tracking-wide mb-1">{label}</p>
        <p className="font-bold text-cream text-lg">{value}</p>
        {subValue && <p className={`text-xs mt-1 font-bold ${subColor}`}>{subValue}</p>}
    </div>
);

export const User: React.FC = () => {
  const { user } = useAuth();
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', mobile: '' });
  const [saveLoading, setSaveLoading] = useState(false);

  // Global Data for Calculation
  const [globalInvested, setGlobalInvested] = useState(0);
  const [globalPL, setGlobalPL] = useState(0);
  const [groupTotalContrib, setGroupTotalContrib] = useState(0);

  const fetchDetails = async () => {
    if (user?.email) {
        try {
            const [userRes, portfolioRes, membersRes] = await Promise.all([
                api.getUserDetails(user.email),
                api.getPortfolio(),
                api.getMembers()
            ]);

            if (userRes.status === 'success') {
                setDetails(userRes.data);
                setEditForm({ name: userRes.data.name, mobile: userRes.data.mobile || '' });
            }

            if (portfolioRes.status === 'success') {
                const port = portfolioRes.data;
                const invested = port.reduce((acc, item) => acc + (item['Purchase Price'] * item.Shares), 0);
                const current = port.reduce((acc, item) => acc + (safeFloat(item['Current Price']) * item.Shares), 0);
                setGlobalInvested(invested);
                setGlobalPL(current - invested);
            }

            if (membersRes.status === 'success') {
                const total = membersRes.data.reduce((acc, m) => acc + (m.Contribution || 0), 0);
                setGroupTotalContrib(total);
            }

        } catch (error) {
            console.error("Failed to fetch user data", error);
        } finally {
            setLoading(false);
        }
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [user]);

  const handleSave = async () => {
      if (!user?.email) return;
      setSaveLoading(true);
      try {
          const res = await api.updateUserProfile(user.email, editForm.name, editForm.mobile);
          if (res.status === 'success') {
              setIsEditing(false);
              fetchDetails();
          } else {
              alert('Failed to update profile');
          }
      } catch (e) {
          alert('Error updating profile');
      } finally {
          setSaveLoading(false);
      }
  };

  if (loading) return <Loader text="Loading Profile..." />;
  if (!details) return <div>Error loading profile</div>;

  // --- CLIENT-SIDE CALCULATION LOGIC ---
  const userContribution = details.totalContribution;
  const ownershipRatio = groupTotalContrib > 0 ? userContribution / groupTotalContrib : 0;
  const userInvestedInStocks = globalInvested * ownershipRatio;
  const globalReturnRatio = globalInvested > 0 ? (globalPL / globalInvested) : 0;
  const globalReturnPercentage = globalReturnRatio * 100;
  const netReturn = userInvestedInStocks * globalReturnRatio;
  const currentValue = userContribution + netReturn;

  // Formatting
  const isPositive = netReturn >= 0;
  const netReturnFormatted = `₹${Math.abs(netReturn).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  const sign = isPositive ? '+' : '-';
  const colorClass = isPositive ? 'text-success' : 'text-error';

  return (
    <div className="space-y-6">
        <div className="bg-navy-800 p-6 rounded-2xl border border-gold-600/20 shadow-luxury relative">
            <div className="flex justify-between items-center mb-6">
                <h2 className="font-heading text-2xl font-bold text-gold-500">My Profile</h2>
                {!isEditing ? (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 text-xs text-gold-400 hover:text-gold-300 uppercase tracking-wider bg-gold-600/10 px-3 py-1.5 rounded-full hover:bg-gold-600/20 transition-colors"
                    >
                        <Edit2 size={14} /> Edit
                    </button>
                ) : (
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsEditing(false)}
                            className="p-2 text-subtext hover:text-error bg-navy-900 rounded-full"
                        >
                            <X size={18} />
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={saveLoading}
                            className="flex items-center gap-2 text-xs text-navy-900 font-bold uppercase tracking-wider bg-gold-500 px-4 py-1.5 rounded-full hover:bg-gold-400 transition-colors disabled:opacity-50"
                        >
                            {saveLoading ? 'Saving...' : <><Save size={14} /> Save</>}
                        </button>
                    </div>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                 <div className={`p-4 rounded border transition-all ${isEditing ? 'bg-navy-900 border-gold-600/50' : 'bg-navy-900/50 border-gold-600/20'}`}>
                    <label className="text-subtext text-xs block mb-1">Name</label>
                    {isEditing ? (
                        <input 
                            type="text" 
                            value={editForm.name}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                            className="w-full bg-transparent text-cream font-semibold text-lg focus:outline-none"
                        />
                    ) : (
                        <p className="text-cream font-semibold text-lg">{details.name}</p>
                    )}
                 </div>
                 
                 <div className="bg-navy-900/50 p-4 rounded border border-gold-600/20 opacity-50 cursor-not-allowed">
                    <label className="text-subtext text-xs block mb-1">Email (Cannot be changed)</label>
                    <p className="text-cream font-semibold text-lg">{details.email}</p>
                 </div>

                 {isEditing && (
                     <div className={`p-4 rounded border bg-navy-900 border-gold-600/50 md:col-span-2`}>
                        <label className="text-subtext text-xs block mb-1">Mobile Number</label>
                        <input 
                            type="tel" 
                            value={editForm.mobile}
                            onChange={(e) => setEditForm({...editForm, mobile: e.target.value})}
                            className="w-full bg-transparent text-cream font-semibold text-lg focus:outline-none"
                            placeholder="Add mobile number"
                        />
                     </div>
                 )}
            </div>

            <div className="border-t border-gold-600/10 pt-6">
                <h3 className="text-gold-400 text-sm uppercase tracking-widest mb-4">Performance Overview</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <InfoBlock 
                        label="Total Contributed" 
                        value={`₹${userContribution.toLocaleString()}`} 
                    />
                    <InfoBlock 
                        label="Current Value" 
                        value={`₹${currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} 
                    />
                    <InfoBlock 
                        label="Invested (Fund %)" 
                        value={`₹${userInvestedInStocks.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} 
                    />
                    <InfoBlock 
                        label="Net Return" 
                        value={`${sign}${netReturnFormatted}`} 
                        subValue={`${sign}${Math.abs(globalReturnPercentage).toFixed(2)}%`}
                        subColor={colorClass}
                    />
                </div>
            </div>

             <div className="border-t border-gold-600/10 pt-6 mt-6">
                <h3 className="text-gold-400 text-sm uppercase tracking-widest mb-4">Contribution History</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {details.contributionHistory.length > 0 ? (
                        details.contributionHistory.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-navy-900 rounded border-l-2 border-gold-500">
                                <div>
                                    <p className="text-cream text-sm">{item.notes || 'Regular Contribution'}</p>
                                    <p className="text-subtext text-xs">{new Date(item.date).toLocaleDateString()} • <span className="text-success">{item.status}</span></p>
                                </div>
                                <p className="text-gold-500 font-bold">₹{item.amount.toLocaleString()}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-subtext italic">No history available.</p>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};
