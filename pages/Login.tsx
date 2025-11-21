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
    <div className="min-h-screen flex flex-col items-center justify-center bg-navy-900 p-4 font-body text-cream">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-gold-500 tracking-wider drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]">
          ELEVATE CAPITAL
        </h1>
        <p className="text-subtext tracking-[0.3em] mt-2 text-sm">COLLECTIVE</p>
      </div>

      <div className="w-full max-w-md bg-navy-800 p-8 rounded-2xl border border-gold-600/30 shadow-luxury relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent opacity-50"></div>
        
        <h2 className="font-heading text-2xl font-bold text-gold-500 mb-6 text-center">
          {isLogin ? 'MEMBER ACCESS' : 'REQUEST MEMBERSHIP'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
             <>
              <div>
                <label className="block text-xs text-gold-400 mb-1 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-navy-900/50 border-b border-gold-600/50 text-cream p-3 focus:outline-none focus:border-gold-400 focus:bg-navy-900 transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-gold-400 mb-1 uppercase tracking-wider">Mobile</label>
                <input
                  type="tel"
                  required
                  className="w-full bg-navy-900/50 border-b border-gold-600/50 text-cream p-3 focus:outline-none focus:border-gold-400 focus:bg-navy-900 transition-all"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                />
              </div>
             </>
          )}

          <div>
            <label className="block text-xs text-gold-400 mb-1 uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              required
              className="w-full bg-navy-900/50 border-b border-gold-600/50 text-cream p-3 focus:outline-none focus:border-gold-400 focus:bg-navy-900 transition-all"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs text-gold-400 mb-1 uppercase tracking-wider">Password</label>
            <input
              type="password"
              required
              className="w-full bg-navy-900/50 border-b border-gold-600/50 text-cream p-3 focus:outline-none focus:border-gold-400 focus:bg-navy-900 transition-all"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {!isLogin && (
            <div className="flex items-center pt-2">
              <input 
                type="checkbox" 
                id="terms" 
                className="accent-gold-500 w-4 h-4" 
                checked={formData.terms}
                onChange={(e) => setFormData({...formData, terms: e.target.checked})}
              />
              <label htmlFor="terms" className="ml-2 text-xs text-subtext">I agree to the Terms & Conditions</label>
            </div>
          )}

          {error && <div className="text-error text-sm text-center py-2 bg-error/10 rounded">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3 text-navy-900 font-bold uppercase tracking-widest bg-gold-500 rounded-sm hover:bg-gold-400 hover:shadow-gold-glow transition-all duration-300 disabled:opacity-50"
          >
            {loading ? <Loader /> : (isLogin ? 'Enter' : 'Submit Request')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-xs text-gold-600 hover:text-gold-400 underline underline-offset-4 transition-colors"
          >
            {isLogin ? 'Request Access / Create Account' : 'Already a member? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};
