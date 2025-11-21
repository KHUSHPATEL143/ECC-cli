
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Loader } from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, DollarSign, PieChart, Activity, User, ShieldCheck, IndianRupee } from 'lucide-react';
import { GrowthChart } from '../components/GrowthChart';

const StatCard = ({ title, value, icon: Icon, sub, subColor }: { title: string, value: string, icon: any, sub?: string, subColor?: string }) => (
  <div className="bg-navy-800 p-6 rounded-2xl border border-gold-600/20 shadow-luxury hover:border-gold-600/50 transition-all duration-300 group">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-subtext text-xs uppercase tracking-wider mb-2">{title}</p>
        <p className="font-heading text-2xl md:text-3xl font-bold text-cream group-hover:text-gold-400 transition-colors">
          {value}
        </p>
        {sub && <p className={`text-xs mt-2 font-bold ${subColor || 'text-subtext'}`}>{sub}</p>}
      </div>
      <div className="p-3 bg-navy-900 rounded-xl border border-gold-600/10 group-hover:border-gold-600/30">
        <Icon className="text-gold-600/70 group-hover:text-gold-400" size={24} />
      </div>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalFundValue: 0,
    totalReturn: 0,
    returnPercentage: 0,
    investedInStocks: 0,
    myContribution: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [aiInsight, setAiInsight] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, userRes, chartRes, membersRes, portfolioRes] = await Promise.all([
          api.getDashboard(),
          api.getUserDetails(user?.email || ''),
          api.getPortfolioHistory(),
          api.getMembers(),
          api.getPortfolio()
        ]);

        // Calculate Metrics for Consistency
        let totalInvested = 0;
        let currentValue = 0;
        let totalContributions = 0;

        if (portfolioRes.status === 'success') {
            totalInvested = portfolioRes.data.reduce((acc, item) => acc + (item['Purchase Price'] * item.Shares), 0);
            currentValue = portfolioRes.data.reduce((acc, item) => acc + (item['Current Price'] * item.Shares), 0);
        }

        if (membersRes.status === 'success') {
            totalContributions = membersRes.data.reduce((acc, m) => acc + (m.Contribution || 0), 0);
        }

        const totalReturn = currentValue - totalInvested;
        const totalFundValue = totalContributions + totalReturn;
        const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

        setStats({
            totalFundValue,
            totalReturn,
            returnPercentage,
            investedInStocks: totalInvested,
            myContribution: userRes.status === 'success' ? userRes.data.totalContribution : 0
        });

        if (dashRes.status === 'success') {
            setAiInsight(dashRes.data.aiInsight || "Consistency compounds trust. Your group grew +7.8% this cycle.");
        }
        
        if (chartRes.status === 'success' && chartRes.data) {
          // Transform chart data for Recharts
          const formatted = chartRes.data.labels.map((label, idx) => ({
            name: label,
            value: chartRes.data.data[idx]
          }));
          setChartData(formatted);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) return <Loader text="Loading Intelligence..." />;

  const returnColor = stats.totalReturn >= 0 ? 'text-success' : 'text-error';
  const returnSign = stats.totalReturn >= 0 ? '+' : '';

  return (
    <div className="space-y-6">
      {/* Header Badge */}
      <div className="flex items-center space-x-3">
        <span className="px-3 py-1 bg-gold-600/10 border border-gold-600/30 text-gold-500 rounded-full text-xs font-bold uppercase tracking-wider">
          Cycle Active
        </span>
        {user?.isAdmin && (
          <span className="px-3 py-1 bg-success/10 border border-success/30 text-success rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck size={12} /> Admin Verified
          </span>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Fund Value" 
          value={`₹${stats.totalFundValue.toLocaleString()}`} 
          icon={IndianRupee} 
        />
        <StatCard 
          title="My Contribution" 
          value={`₹${stats.myContribution.toLocaleString()}`} 
          icon={User} 
        />
        <StatCard 
          title="Invested Assets" 
          value={`₹${stats.investedInStocks.toLocaleString()}`} 
          icon={PieChart} 
        />
        <StatCard 
          title="Total Return" 
          value={`${returnSign}₹${Math.abs(stats.totalReturn).toLocaleString()}`} 
          sub={`${returnSign}${Math.abs(stats.returnPercentage).toFixed(2)}% Returns`}
          subColor={returnColor}
          icon={TrendingUp} 
        />
      </div>

      {/* Chart Section */}
      <div className="bg-navy-800 p-6 rounded-2xl border border-gold-600/20 shadow-luxury">
        <h3 className="font-heading text-xl font-bold text-gold-500 mb-6">Portfolio Growth</h3>
        <div className="h-80 w-full">
          <GrowthChart data={chartData} />
        </div>
      </div>

      {/* AI Insight */}
      <div className="bg-gradient-to-r from-navy-800 to-navy-900 p-6 rounded-2xl border border-gold-600/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
            <h4 className="font-heading text-lg text-gold-500 mb-2 flex items-center gap-2">
                <Activity size={18} /> AI Market Insight
            </h4>
            <p className="text-subtext text-sm italic">
                "{aiInsight}"
            </p>
        </div>
        <button className="px-6 py-2 border border-gold-600 text-gold-500 rounded-full text-sm hover:bg-gold-600/10 transition-colors whitespace-nowrap">
            View Analysis
        </button>
      </div>
    </div>
  );
};
