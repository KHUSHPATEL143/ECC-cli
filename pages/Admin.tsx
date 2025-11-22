
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { PendingUser, Notification, Member, PortfolioItem, PortfolioHistoryPoint } from '../types';
import { Loader } from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { Check, X, Bell, Trash2, UserCheck, TrendingUp, DollarSign, Plus, Briefcase, Edit2, Save } from 'lucide-react';

type Tab = 'overview' | 'users' | 'notifications' | 'portfolio' | 'contributions';

// Inline Spinner for Buttons
const ButtonSpinner = () => (
    <svg className="animate-spin h-5 w-5 text-navy-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const Admin: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [loading, setLoading] = useState(true);
    const [opLoading, setOpLoading] = useState(false);

    // Data States
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
    const [activeNotifications, setActiveNotifications] = useState<Notification[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [holdings, setHoldings] = useState<PortfolioItem[]>([]);
    const [historyPoints, setHistoryPoints] = useState<PortfolioHistoryPoint[]>([]);

    // Form States
    const [notifMsg, setNotifMsg] = useState('');
    const [notifTarget, setNotifTarget] = useState('ALL');
    
    const [contribForm, setContribForm] = useState({ 
        email: '', amount: '', date: new Date().toISOString().split('T')[0], notes: '', isMonthly: false 
    });
    
    // Portfolio Form State
    const [holdingForm, setHoldingForm] = useState({ 
        stockName: '', 
        ticker: '', 
        type: 'Stock',
        shares: '', 
        purchasePrice: '', 
        currentPrice: '', 
        useGoogleFinance: false 
    });
    const [editingHoldingIndex, setEditingHoldingIndex] = useState<number | null>(null);

    const [historyForm, setHistoryForm] = useState({ date: new Date().toISOString().split('T')[0], value: '' });
    const [editingHistoryIndex, setEditingHistoryIndex] = useState<number | null>(null);

    const loadData = async () => {
        if (!user?.email) return;
        try {
            const [pending, notifs, mems, ports, hist] = await Promise.all([
                api.getPendingUsers(user.email),
                api.getNotificationsAdmin(user.email),
                api.getMembers(),
                api.getPortfolio(),
                api.getPortfolioHistory()
            ]);
            
            if (pending.status === 'success') setPendingUsers(pending.data);
            if (notifs.status === 'success') {
                const active = notifs.data.filter((n: any) => n.IsActive === true);
                setActiveNotifications(active.map((n: any) => ({
                    id: n.ID,
                    message: n.Message,
                    targetEmail: n.TargetEmail,
                    isActive: n.IsActive
                })));
            }
            if (mems.status === 'success') setMembers(mems.data);
            if (ports.status === 'success') setHoldings(ports.data);
            if (hist.status === 'success') {
                if (hist.data.points) {
                    setHistoryPoints(hist.data.points);
                } else {
                    const constructed = hist.data.labels.map((l, i) => ({ date: l, value: hist.data.data[i], rowIndex: i }));
                    setHistoryPoints(constructed);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        loadData().finally(() => setLoading(false));
    }, [user]);

    // --- ACTIONS ---

    const handleAction = async (action: 'approve' | 'reject', targetEmail: string) => {
        if (!user?.email) return;
        setOpLoading(true);
        try {
            if (action === 'approve') await api.approveUser(targetEmail, user.email);
            else await api.rejectUser(targetEmail, user.email);
            loadData();
        } finally { setOpLoading(false); }
    };

    const sendNotif = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.email || !notifMsg) return;
        setOpLoading(true);
        try {
            await api.sendNotification(notifMsg, notifTarget, user.email);
            setNotifMsg('');
            setNotifTarget('ALL');
            loadData();
        } finally { setOpLoading(false); }
    };

    const deleteNotif = async (id: string) => {
        if (!user?.email || !confirm('Delete this notification?')) return;
        setOpLoading(true);
        try {
            await api.deleteNotification(id, user.email);
            loadData();
        } finally { setOpLoading(false); }
    };

    const addContribution = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.email) return;
        setOpLoading(true);
        try {
            await api.addContribution(
                contribForm.email, 
                parseFloat(contribForm.amount), 
                contribForm.date, 
                contribForm.notes, 
                contribForm.isMonthly, 
                user.email
            );
            setContribForm({ ...contribForm, amount: '', notes: '', isMonthly: false });
            alert('Contribution logged');
        } finally { setOpLoading(false); }
    };

    // --- HOLDING MANAGEMENT ---

    const saveHolding = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.email) return;
        setOpLoading(true);
        try {
            const holdingData: Partial<PortfolioItem> = {
                "Stock Name": holdingForm.stockName,
                "Ticker": holdingForm.ticker,
                "Type": holdingForm.type,
                "Shares": parseFloat(holdingForm.shares),
                "Purchase Price": parseFloat(holdingForm.purchasePrice),
                "Current Price": holdingForm.useGoogleFinance ? 0 : parseFloat(holdingForm.currentPrice) // Ignored if dynamic
            };

            if (editingHoldingIndex !== null) {
                await api.updateHolding(editingHoldingIndex, holdingData, holdingForm.useGoogleFinance, user.email);
            } else {
                await api.addHolding(holdingData, holdingForm.useGoogleFinance, user.email);
            }
            setHoldingForm({ stockName: '', ticker: '', type: 'Stock', shares: '', purchasePrice: '', currentPrice: '', useGoogleFinance: false });
            setEditingHoldingIndex(null);
            loadData();
        } finally { setOpLoading(false); }
    };

    const editHolding = (index: number, h: PortfolioItem) => {
        setEditingHoldingIndex(index);
        setHoldingForm({
            stockName: h["Stock Name"],
            ticker: h.Ticker || '',
            type: h.Type || 'Stock',
            shares: h.Shares.toString(),
            purchasePrice: h["Purchase Price"].toString(),
            currentPrice: h["Current Price"].toString(),
            useGoogleFinance: false // Default to false when editing, user can opt-in
        });
    };

    const cancelEditHolding = () => {
        setEditingHoldingIndex(null);
        setHoldingForm({ stockName: '', ticker: '', type: 'Stock', shares: '', purchasePrice: '', currentPrice: '', useGoogleFinance: false });
    };

    const deleteHolding = async (stockName: string) => {
        if (!user?.email || !confirm(`Delete holding: ${stockName}?`)) return;
        setOpLoading(true);
        try {
            await api.deleteHolding(stockName, user.email);
            loadData();
        } finally { setOpLoading(false); }
    };

    // --- HISTORY MANAGEMENT ---

    const saveHistory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.email) return;
        setOpLoading(true);
        try {
            if (editingHistoryIndex !== null) {
                await api.updateHistoryPoint(editingHistoryIndex, { date: historyForm.date, value: parseFloat(historyForm.value) }, user.email);
            } else {
                await api.addHistoryPoint(historyForm.date, parseFloat(historyForm.value), user.email);
            }
            setHistoryForm({ ...historyForm, value: '' });
            setEditingHistoryIndex(null);
            loadData();
        } finally { setOpLoading(false); }
    };

    const editHistory = (index: number, point: PortfolioHistoryPoint) => {
        setEditingHistoryIndex(index);
        const d = new Date(point.date);
        const dateStr = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : point.date;
        setHistoryForm({
            date: dateStr,
            value: point.value.toString()
        });
    };

    const cancelEditHistory = () => {
        setEditingHistoryIndex(null);
        setHistoryForm({ ...historyForm, value: '' });
    };

    const deleteHistory = async (index: number) => {
        if (!user?.email || !confirm('Delete this data point?')) return;
        setOpLoading(true);
        try {
            await api.deleteHistoryPoint(index, user.email);
            loadData();
        } finally { setOpLoading(false); }
    };


    if (loading) return <Loader text="Loading Admin Panel..." />;

    const TabButton = ({ id, label, icon: Icon }: { id: Tab, label: string, icon: any }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wide transition-all ${
                activeTab === id 
                ? 'bg-gold-600 text-navy-900 shadow-gold-glow' 
                : 'bg-navy-800 text-subtext hover:text-cream hover:bg-navy-700'
            }`}
        >
            <Icon size={16} /> {label}
        </button>
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap gap-3 pb-4 border-b border-gold-600/10">
                <TabButton id="overview" label="Overview" icon={UserCheck} />
                <TabButton id="notifications" label="Broadcast" icon={Bell} />
                <TabButton id="contributions" label="Contributions" icon={DollarSign} />
                <TabButton id="portfolio" label="Portfolio" icon={Briefcase} />
                <TabButton id="users" label="Chart Data" icon={TrendingUp} />
            </div>

            <div className="min-h-[400px]">
                
                {activeTab === 'overview' && (
                    <div className="bg-navy-800 p-6 rounded-2xl border border-gold-600/20 shadow-luxury">
                        <h2 className="font-heading text-xl font-bold text-gold-500 mb-4">Pending Approvals</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-subtext text-xs uppercase border-b border-gold-600/20">
                                        <th className="py-3">Name</th>
                                        <th className="py-3">Email</th>
                                        <th className="py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gold-600/10">
                                    {pendingUsers.length === 0 ? (
                                        <tr><td colSpan={3} className="py-8 text-center text-subtext italic">No pending approvals</td></tr>
                                    ) : (
                                        pendingUsers.map((u) => (
                                            <tr key={u.Email}>
                                                <td className="py-3 text-cream">{u.Name}</td>
                                                <td className="py-3 text-subtext">{u.Email}</td>
                                                <td className="py-3 flex justify-end gap-2">
                                                    <button disabled={opLoading} onClick={() => handleAction('approve', u.Email)} className="p-2 bg-success/10 text-success rounded hover:bg-success/20 disabled:opacity-50">
                                                        <Check size={16} />
                                                    </button>
                                                    <button disabled={opLoading} onClick={() => handleAction('reject', u.Email)} className="p-2 bg-error/10 text-error rounded hover:bg-error/20 disabled:opacity-50">
                                                        <X size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-navy-800 p-6 rounded-2xl border border-gold-600/20 shadow-luxury">
                            <h2 className="font-heading text-xl font-bold text-gold-500 mb-4">Send Broadcast</h2>
                            <form onSubmit={sendNotif} className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-xs text-gold-400 mb-2 uppercase">Target Audience</label>
                                    <select 
                                        value={notifTarget}
                                        onChange={e => setNotifTarget(e.target.value)}
                                        className="w-full bg-navy-900 border border-gold-600/30 text-cream p-3 rounded focus:border-gold-400"
                                    >
                                        <option value="ALL">All Users</option>
                                        {members.map(m => (
                                            <option key={m.Email} value={m.Email}>{m.Name}</option>
                                        ))}
                                    </select>
                                </div>
                                <textarea 
                                    value={notifMsg}
                                    onChange={e => setNotifMsg(e.target.value)}
                                    placeholder="Message..."
                                    className="bg-navy-900 border border-gold-600/30 rounded p-3 text-cream focus:border-gold-500 focus:outline-none h-32 resize-none"
                                />
                                <button type="submit" disabled={opLoading || !notifMsg} className="btn-gold py-3 font-bold uppercase rounded flex justify-center items-center">
                                    {opLoading ? <ButtonSpinner /> : 'Send Notification'}
                                </button>
                            </form>
                        </div>
                        <div className="bg-navy-800 p-6 rounded-2xl border border-gold-600/20 shadow-luxury">
                            <h2 className="font-heading text-xl font-bold text-gold-500 mb-4">Active Messages</h2>
                            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                                {activeNotifications.length === 0 ? (
                                    <p className="text-subtext text-center py-8 italic">No active notifications</p>
                                ) : (
                                    activeNotifications.map(n => (
                                        <div key={n.id} className="bg-navy-900 p-3 rounded border-l-2 border-gold-500 flex justify-between items-center group">
                                            <div>
                                                <p className="text-cream text-sm">{n.message}</p>
                                                <p className="text-xs text-subtext mt-1">To: {n.targetEmail === 'ALL' ? 'Everyone' : n.targetEmail}</p>
                                            </div>
                                            <button onClick={() => deleteNotif(n.id)} disabled={opLoading} className="text-subtext hover:text-error p-2 disabled:opacity-50">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'contributions' && (
                    <div className="bg-navy-800 p-6 rounded-2xl border border-gold-600/20 shadow-luxury max-w-2xl mx-auto">
                        <h2 className="font-heading text-xl font-bold text-gold-500 mb-6">Log User Contribution</h2>
                        <form onSubmit={addContribution} className="space-y-4">
                            <div>
                                <label className="block text-xs text-gold-400 mb-2 uppercase">Member</label>
                                <select 
                                    value={contribForm.email}
                                    onChange={e => setContribForm({...contribForm, email: e.target.value})}
                                    className="w-full bg-navy-900 border border-gold-600/30 text-cream p-3 rounded focus:border-gold-400"
                                    required
                                >
                                    <option value="">Select Member</option>
                                    {members.map(m => (
                                        <option key={m.Email} value={m.Email}>{m.Name} ({m.Email})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gold-400 mb-2 uppercase">Amount (₹)</label>
                                    <input 
                                        type="number" 
                                        value={contribForm.amount}
                                        onChange={e => setContribForm({...contribForm, amount: e.target.value})}
                                        className="w-full bg-navy-900 border border-gold-600/30 text-cream p-3 rounded focus:border-gold-400"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gold-400 mb-2 uppercase">Date</label>
                                    <input 
                                        type="date" 
                                        value={contribForm.date}
                                        onChange={e => setContribForm({...contribForm, date: e.target.value})}
                                        className="w-full bg-navy-900 border border-gold-600/30 text-cream p-3 rounded focus:border-gold-400 [color-scheme:dark]"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-gold-400 mb-2 uppercase">Notes (Optional)</label>
                                <input 
                                    type="text" 
                                    value={contribForm.notes}
                                    onChange={e => setContribForm({...contribForm, notes: e.target.value})}
                                    placeholder="e.g., November Installment"
                                    className="w-full bg-navy-900 border border-gold-600/30 text-cream p-3 rounded focus:border-gold-400"
                                />
                            </div>
                            <div className="flex items-center">
                                <input 
                                    type="checkbox" 
                                    id="monthly" 
                                    checked={contribForm.isMonthly}
                                    onChange={e => setContribForm({...contribForm, isMonthly: e.target.checked})}
                                    className="w-4 h-4 accent-gold-500"
                                />
                                <label htmlFor="monthly" className="ml-2 text-sm text-cream">Is Monthly Payment?</label>
                            </div>
                            <button type="submit" disabled={opLoading} className="btn-gold w-full py-3 font-bold uppercase rounded mt-4 flex justify-center items-center">
                                {opLoading ? <ButtonSpinner /> : 'Add Contribution'}
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === 'portfolio' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 bg-navy-800 p-6 rounded-2xl border border-gold-600/20 shadow-luxury h-fit sticky top-24">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="font-heading text-xl font-bold text-gold-500">
                                    {editingHoldingIndex !== null ? 'Edit Holding' : 'Add Holding'}
                                </h2>
                                {editingHoldingIndex !== null && (
                                    <button onClick={cancelEditHolding} className="text-xs text-error hover:underline">Cancel</button>
                                )}
                            </div>
                            <form onSubmit={saveHolding} className="space-y-4">
                                <div>
                                    <label className="block text-xs text-gold-400 mb-1 uppercase">Asset Type</label>
                                    <select 
                                        value={holdingForm.type}
                                        onChange={e => setHoldingForm({...holdingForm, type: e.target.value})}
                                        className="w-full bg-navy-900 border border-gold-600/30 p-3 rounded text-cream focus:border-gold-400"
                                    >
                                        <option value="Stock">Stock</option>
                                        <option value="Mutual Fund">Mutual Fund</option>
                                        <option value="Crypto">Crypto</option>
                                        <option value="Gold">Gold</option>
                                        <option value="ETF">ETF</option>
                                    </select>
                                </div>
                                
                                <input type="text" placeholder="Asset Name (e.g. Reliance)" required value={holdingForm.stockName} onChange={e => setHoldingForm({...holdingForm, stockName: e.target.value})} className="w-full bg-navy-900 border border-gold-600/30 p-3 rounded text-cream" />
                                <input type="text" placeholder="Ticker (e.g. NSE:RELIANCE)" value={holdingForm.ticker} onChange={e => setHoldingForm({...holdingForm, ticker: e.target.value})} className="w-full bg-navy-900 border border-gold-600/30 p-3 rounded text-cream" />
                                <input type="number" placeholder="Shares / Units" required value={holdingForm.shares} onChange={e => setHoldingForm({...holdingForm, shares: e.target.value})} className="w-full bg-navy-900 border border-gold-600/30 p-3 rounded text-cream" />
                                <input type="number" placeholder="Avg Purchase Price" required value={holdingForm.purchasePrice} onChange={e => setHoldingForm({...holdingForm, purchasePrice: e.target.value})} className="w-full bg-navy-900 border border-gold-600/30 p-3 rounded text-cream" />
                                
                                {!holdingForm.useGoogleFinance && (
                                    <input type="number" placeholder="Current Price" required={!holdingForm.useGoogleFinance} value={holdingForm.currentPrice} onChange={e => setHoldingForm({...holdingForm, currentPrice: e.target.value})} className="w-full bg-navy-900 border border-gold-600/30 p-3 rounded text-cream" />
                                )}

                                <div className="flex items-center gap-2 p-2 border border-gold-600/10 rounded bg-navy-900/50">
                                    <input 
                                        type="checkbox" 
                                        id="gfCheck" 
                                        checked={holdingForm.useGoogleFinance} 
                                        onChange={e => setHoldingForm({...holdingForm, useGoogleFinance: e.target.checked})}
                                        className="accent-gold-500 w-4 h-4"
                                    />
                                    <label htmlFor="gfCheck" className="text-xs text-subtext cursor-pointer select-none">Use Live Price (GoogleFinance)</label>
                                </div>

                                <button type="submit" disabled={opLoading} className="btn-gold w-full py-3 font-bold uppercase rounded mt-2 flex justify-center items-center gap-2">
                                    {opLoading ? <ButtonSpinner /> : (editingHoldingIndex !== null ? <><Save size={16}/> Update</> : <><Plus size={16}/> Add Asset</>)}
                                </button>
                            </form>
                        </div>
                        <div className="lg:col-span-2 bg-navy-800 p-6 rounded-2xl border border-gold-600/20 shadow-luxury">
                            <h2 className="font-heading text-xl font-bold text-gold-500 mb-6">Active Holdings</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-subtext text-xs uppercase border-b border-gold-600/20">
                                            <th className="py-3">Asset</th>
                                            <th className="py-3 text-right">Units</th>
                                            <th className="py-3 text-right">Avg</th>
                                            <th className="py-3 text-right">Current</th>
                                            <th className="py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gold-600/10">
                                        {holdings.map((h, idx) => (
                                            <tr key={idx} className={editingHoldingIndex === idx ? "bg-gold-600/10" : ""}>
                                                <td className="py-3 text-cream">
                                                    <div className="font-bold">{h['Stock Name']}</div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-gold-600/70 uppercase bg-gold-600/5 px-1 rounded">{h.Type || 'Stock'}</span>
                                                        {h.Ticker && <span className="text-[10px] text-subtext">{h.Ticker}</span>}
                                                    </div>
                                                </td>
                                                <td className="py-3 text-right text-subtext">{h.Shares}</td>
                                                <td className="py-3 text-right text-subtext">₹{h['Purchase Price']}</td>
                                                <td className="py-3 text-right text-cream">₹{parseFloat(String(h['Current Price'])).toLocaleString() || 'Live'}</td>
                                                <td className="py-3 text-right flex justify-end gap-2">
                                                    <button onClick={() => editHolding(idx, h)} disabled={opLoading} className="text-gold-400 hover:text-gold-200 p-1 disabled:opacity-50">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => deleteHolding(h['Stock Name'])} disabled={opLoading} className="text-error hover:text-red-400 p-1 disabled:opacity-50">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 bg-navy-800 p-6 rounded-2xl border border-gold-600/20 shadow-luxury h-fit sticky top-24">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="font-heading text-xl font-bold text-gold-500">
                                    {editingHistoryIndex !== null ? 'Edit Point' : 'Add Point'}
                                </h2>
                                {editingHistoryIndex !== null && (
                                    <button onClick={cancelEditHistory} className="text-xs text-error hover:underline">Cancel</button>
                                )}
                            </div>
                            
                            <form onSubmit={saveHistory} className="text-left space-y-4">
                                <div>
                                    <label className="block text-xs text-gold-400 mb-2 uppercase">Date</label>
                                    <input 
                                        type="date" 
                                        value={historyForm.date}
                                        onChange={e => setHistoryForm({...historyForm, date: e.target.value})}
                                        className="w-full bg-navy-900 border border-gold-600/30 text-cream p-3 rounded focus:border-gold-400 [color-scheme:dark]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gold-400 mb-2 uppercase">Total Value (₹)</label>
                                    <input 
                                        type="number" 
                                        value={historyForm.value}
                                        onChange={e => setHistoryForm({...historyForm, value: e.target.value})}
                                        className="w-full bg-navy-900 border border-gold-600/30 text-cream p-3 rounded focus:border-gold-400"
                                        required
                                    />
                                </div>
                                <button type="submit" disabled={opLoading} className="btn-gold w-full py-3 font-bold uppercase rounded mt-4 flex justify-center items-center gap-2">
                                    {opLoading ? <ButtonSpinner /> : (editingHistoryIndex !== null ? <><Save size={16}/> Update Point</> : <><Plus size={16}/> Add Point</>)}
                                </button>
                            </form>
                        </div>

                        <div className="lg:col-span-2 bg-navy-800 p-6 rounded-2xl border border-gold-600/20 shadow-luxury">
                            <h2 className="font-heading text-xl font-bold text-gold-500 mb-6">History Data</h2>
                            <div className="overflow-x-auto max-h-96 custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-subtext text-xs uppercase border-b border-gold-600/20">
                                            <th className="py-3">Date</th>
                                            <th className="py-3 text-right">Value</th>
                                            <th className="py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gold-600/10">
                                        {historyPoints.map((p, idx) => (
                                            <tr key={idx} className={editingHistoryIndex === idx ? "bg-gold-600/10" : ""}>
                                                <td className="py-3 text-cream">{new Date(p.date).toLocaleDateString()}</td>
                                                <td className="py-3 text-right text-cream">₹{p.value.toLocaleString()}</td>
                                                <td className="py-3 text-right flex justify-end gap-2">
                                                    <button onClick={() => editHistory(idx, p)} disabled={opLoading} className="text-gold-400 hover:text-gold-200 p-1 disabled:opacity-50">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => deleteHistory(idx)} disabled={opLoading} className="text-error hover:text-red-400 p-1 disabled:opacity-50">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {historyPoints.length === 0 && <tr><td colSpan={3} className="py-8 text-center text-subtext">No history data</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
