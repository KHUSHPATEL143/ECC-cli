
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { PortfolioItem } from '../types';
import { Loader } from '../components/Loader';
import { GrowthChart } from '../components/GrowthChart';
import { Download } from 'lucide-react';

export const Portfolio: React.FC = () => {
  const [holdings, setHoldings] = useState<PortfolioItem[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [portRes, chartRes] = await Promise.all([
                api.getPortfolio(),
                api.getPortfolioHistory()
            ]);

            if (portRes.status === 'success') setHoldings(portRes.data);
            if (chartRes.status === 'success' && chartRes.data) {
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
  }, []);

  const handleExportPDF = () => {
      window.print();
  };

  if (loading) return <Loader text="Loading Assets..." />;

  const totalInvested = holdings.reduce((acc, item) => acc + (item['Purchase Price'] * item.Shares), 0);
  const currentValue = holdings.reduce((acc, item) => acc + (item['Current Price'] * item.Shares), 0);
  const overallPL = currentValue - totalInvested;

  return (
    <div className="space-y-6">
       {/* Growth Graph */}
       <div className="bg-navy-800 p-6 rounded-2xl border border-gold-600/20 shadow-luxury print:break-inside-avoid">
            <h3 className="font-heading text-xl font-bold text-gold-500 mb-6">Portfolio Growth</h3>
            <div className="h-64 w-full">
                <GrowthChart data={chartData} />
            </div>
       </div>

       <div className="bg-navy-800 p-6 rounded-2xl border border-gold-600/20 shadow-luxury print:border-none print:shadow-none">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gold-600/10 pb-6">
                <h2 className="font-heading text-2xl font-bold text-gold-500">Current Holdings</h2>
                
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex flex-wrap gap-4 text-sm print:hidden">
                        <div className="bg-navy-900 px-4 py-2 rounded border border-gold-600/20">
                            <span className="text-subtext block text-xs">Total Invested</span>
                            <span className="font-bold text-cream">₹{totalInvested.toLocaleString()}</span>
                        </div>
                        <div className="bg-navy-900 px-4 py-2 rounded border border-gold-600/20">
                            <span className="text-subtext block text-xs">Current Value</span>
                            <span className="font-bold text-cream">₹{currentValue.toLocaleString()}</span>
                        </div>
                        <div className="bg-navy-900 px-4 py-2 rounded border border-gold-600/20">
                            <span className="text-subtext block text-xs">Overall P/L</span>
                            <span className={`font-bold ${overallPL >= 0 ? 'text-success' : 'text-error'}`}>
                            {overallPL >= 0 ? '+' : ''}₹{overallPL.toLocaleString()}
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-gold-600 text-navy-900 font-bold text-xs uppercase tracking-wider rounded hover:bg-gold-500 transition-colors print:hidden"
                    >
                        <Download size={16} /> Export PDF
                    </button>
                </div>
            </div>

            {/* Print Only Summary */}
            <div className="hidden print:block mb-6">
                <p className="text-lg font-bold">Summary</p>
                <p>Total Invested: ₹{totalInvested.toLocaleString()}</p>
                <p>Current Value: ₹{currentValue.toLocaleString()}</p>
                <p>Overall P/L: ₹{overallPL.toLocaleString()}</p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-gold-600 border-b border-gold-600/30 text-sm uppercase tracking-wider">
                            <th className="py-4 px-4 font-semibold">Stock</th>
                            <th className="py-4 px-4 font-semibold text-right">Shares</th>
                            <th className="py-4 px-4 font-semibold text-right">Avg Price</th>
                            <th className="py-4 px-4 font-semibold text-right">Current</th>
                            <th className="py-4 px-4 font-semibold text-right">P/L</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gold-600/10">
                        {holdings.length === 0 ? (
                             <tr><td colSpan={5} className="py-8 text-center text-subtext">No active holdings.</td></tr>
                        ) : (
                            holdings.map((item, idx) => {
                                const pl = (item['Current Price'] - item['Purchase Price']) * item.Shares;
                                return (
                                    <tr key={idx} className="hover:bg-gold-600/5 transition-colors print:text-black">
                                        <td className="py-4 px-4">
                                            <div className="font-semibold text-cream print:text-black">{item['Stock Name']}</div>
                                            <div className="text-xs text-subtext print:text-gray-600">{item['Company Name']}</div>
                                        </td>
                                        <td className="py-4 px-4 text-right text-cream print:text-black">{item.Shares}</td>
                                        <td className="py-4 px-4 text-right text-subtext print:text-black">₹{item['Purchase Price'].toLocaleString()}</td>
                                        <td className="py-4 px-4 text-right text-cream print:text-black">₹{item['Current Price'].toLocaleString()}</td>
                                        <td className={`py-4 px-4 text-right font-bold ${pl >= 0 ? 'text-success' : 'text-error'}`}>
                                            {pl >= 0 ? '+' : ''}₹{pl.toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
       </div>
    </div>
  );
};
