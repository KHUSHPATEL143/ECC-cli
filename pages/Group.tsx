
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Member } from '../types';
import { Loader } from '../components/Loader';
import { Users, Banknote, TrendingUp } from 'lucide-react';

const safeFloat = (val: any): number => {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
};

export const Group: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [portfolioPL, setPortfolioPL] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [mems, port] = await Promise.all([
                api.getMembers(),
                api.getPortfolio()
            ]);
            if (mems.status === 'success') setMembers(mems.data);
            if (port.status === 'success') {
                const totalInvested = port.data.reduce((acc, item) => acc + (item['Purchase Price'] * item.Shares), 0);
                const currentValue = port.data.reduce((acc, item) => acc + (safeFloat(item['Current Price']) * item.Shares), 0);
                setPortfolioPL(currentValue - totalInvested);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  if (loading) return <Loader text="Gathering Members..." />;

  const totalContrib = members.reduce((acc, m) => acc + (m.Contribution || 0), 0);
  const totalFundValue = totalContrib + portfolioPL;

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-navy-800 p-6 rounded-2xl border border-gold-600/20 shadow-luxury flex items-center justify-between">
                <div>
                    <p className="text-subtext text-xs uppercase tracking-wider">Total Members</p>
                    <p className="font-heading text-3xl font-bold text-cream">{members.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-gold-600/10 flex items-center justify-center">
                    <Users className="text-gold-500" size={24} />
                </div>
            </div>
            <div className="bg-navy-800 p-6 rounded-2xl border border-gold-600/20 shadow-luxury flex items-center justify-between">
                 <div>
                    <p className="text-subtext text-xs uppercase tracking-wider">Total Contributions</p>
                    <p className="font-heading text-3xl font-bold text-cream">₹{totalContrib.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-gold-600/10 flex items-center justify-center">
                    <Banknote className="text-gold-500" size={24} />
                </div>
            </div>
            <div className="bg-navy-800 p-6 rounded-2xl border border-gold-600/20 shadow-luxury flex items-center justify-between">
                 <div>
                    <p className="text-subtext text-xs uppercase tracking-wider">Current Fund Value</p>
                    <p className="font-heading text-3xl font-bold text-gold-400">₹{totalFundValue.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-gold-600/10 flex items-center justify-center">
                    <TrendingUp className="text-gold-500" size={24} />
                </div>
            </div>
        </div>

        <div className="bg-navy-800 p-6 rounded-2xl border border-gold-600/20 shadow-luxury">
            <h3 className="font-heading text-xl font-bold text-gold-500 mb-6">Group Members</h3>
            <div className="grid grid-cols-1 gap-4">
                {members.map((member, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-navy-900 rounded-lg border border-transparent hover:border-gold-600/30 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gold-600 to-gold-400 flex items-center justify-center text-navy-900 font-bold">
                                {member.Name.charAt(0)}
                            </div>
                            <div>
                                <p className="font-semibold text-cream group-hover:text-gold-400 transition-colors">{member.Name}</p>
                                <p className="text-xs text-subtext">Joined {new Date(member['Join Date']).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-gold-500 font-bold">₹{(member.Contribution || 0).toLocaleString()}</p>
                            <p className="text-[10px] text-subtext uppercase tracking-wide">Contributed</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};
