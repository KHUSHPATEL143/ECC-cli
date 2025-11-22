
import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Loader } from '../components/Loader';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    mobile: '',
    terms: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.signIn(formData.email, formData.password);
        if (res.status === 'success' && res.data.isAuthenticated) {
          login({
            email: res.data.email,
            isAuthenticated: true,
            isAdmin: res.data.isAdmin,
          });
        } else {
          setError(res.message || 'Invalid credentials');
        }
      } else {
        // Sign Up
        if (!formData.terms) {
          setError('You must agree to the terms.');
          setLoading(false);
          return;
        }
        const res = await api.signUp({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          mobile: formData.mobile
        });
        
        if (res.status === 'success') {
          alert('Request submitted! You will be notified upon approval.');
          setIsLogin(true);
        } else {
          setError(res.message || 'Sign up failed');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-navy-800 via-navy-900 to-black p-4 font-body text-cream relative overflow-hidden">
      
      {/* Ambient Background Glow */}
      <div className="absolute top-[-20%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] bg-gold-600/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="mb-10 text-center z-10">
        <h1 className="font-heading text-5xl md:text-6xl font-bold text-gold-500 tracking-widest drop-shadow-[0_2px_10px_rgba(212,175,55,0.3)]">
          ELEVATE
        </h1>
        <p className="text-gold-400/70 tracking-[0.4em] mt-2 text-xs uppercase font-semibold">Capital Collective</p>
      </div>

      <div className="w-full max-w-md bg-navy-800/60 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-gold-500/20 shadow-2xl relative z-10">
        
        <h2 className="font-heading text-2xl font-bold text-cream mb-8 text-center tracking-wide">
          {isLogin ? 'MEMBER ACCESS' : 'JOIN THE CLUB'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
             <div className="space-y-5 animate-in slide-in-from-top-4 fade-in duration-500">
              <div>
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  className="w-full bg-navy-900/80 border border-gold-600/20 text-cream px-5 py-3.5 rounded-xl focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all placeholder:text-subtext/50"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <input
                  type="tel"
                  required
                  placeholder="Mobile Number"
                  className="w-full bg-navy-900/80 border border-gold-600/20 text-cream px-5 py-3.5 rounded-xl focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all placeholder:text-subtext/50"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                />
              </div>
             </div>
          )}

          <div>
            <input
              type="email"
              required
              placeholder="Email Address"
              className="w-full bg-navy-900/80 border border-gold-600/20 text-cream px-5 py-3.5 rounded-xl focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all placeholder:text-subtext/50"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <input
              type="password"
              required
              placeholder="Password"
              className="w-full bg-navy-900/80 border border-gold-600/20 text-cream px-5 py-3.5 rounded-xl focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all placeholder:text-subtext/50"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {!isLogin && (
            <div className="flex items-center pt-2 px-2">
              <input 
                type="checkbox" 
                id="terms" 
                className="accent-gold-500 w-4 h-4 rounded cursor-pointer" 
                checked={formData.terms}
                onChange={(e) => setFormData({...formData, terms: e.target.checked})}
              />
              <label htmlFor="terms" className="ml-3 text-xs text-subtext cursor-pointer select-none">
                I agree to the <span className="text-gold-400 hover:underline">Terms & Conditions</span>
              </label>
            </div>
          )}

          {error && (
            <div className="text-error text-xs text-center py-2 bg-error/5 border border-error/20 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 py-4 text-navy-900 font-bold uppercase tracking-widest text-sm bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 rounded-full hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            {loading ? <Loader /> : (isLogin ? 'Sign In' : 'Request Access')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-xs font-medium text-subtext hover:text-gold-400 transition-colors"
          >
            {isLogin ? (
              <>New here? <span className="text-gold-500 underline underline-offset-4 decoration-gold-500/30">Request Membership</span></>
            ) : (
              <>Already a member? <span className="text-gold-500 underline underline-offset-4 decoration-gold-500/30">Sign In</span></>
            )}
          </button>
        </div>
      </div>
      
      <div className="mt-8 text-[10px] text-gold-600/30 tracking-widest uppercase">
        Exclusive Investment Group
      </div>
    </div>
  );
};
