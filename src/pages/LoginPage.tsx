import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useShortlist } from '../context/ShortlistContext';
import { UserRole } from '../types';
import { DEMO_USERS } from '../data/mockData';
import { 
  ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowRight, 
  Sparkles, CheckCircle2, AlertCircle, Building2, Palette, Shield,
  Award, FileCode, Check, HelpCircle, KeyRound, Zap, Send,
  UserPlus, X
} from 'lucide-react';

interface LoginPageProps {
  navigate: (path: string, creatorId?: string, prefill?: { email?: string; role?: 'brand' | 'creator' }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ navigate }) => {
  const { login, isAuthenticated, currentUser, logout } = useAuth();
  const { showToast } = useShortlist();

  // Active portal tab: 'brand' vs 'creator'
  const [selectedRole, setSelectedRole] = useState<'brand' | 'creator' | 'admin'>('brand');

  const [email, setEmail] = useState('david.vance@auramotors.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Popup Modal state for Unregistered Email
  const [showRegisterPromptModal, setShowRegisterPromptModal] = useState(false);
  const [unregisteredEmailAttempted, setUnregisteredEmailAttempted] = useState('');

  const handleRoleChange = (role: 'brand' | 'creator' | 'admin') => {
    setSelectedRole(role);
    setError(null);
    if (role === 'brand') {
      setEmail('david.vance@auramotors.com');
      setPassword('password123');
    } else if (role === 'creator') {
      setEmail('alex.morgan@runwaycinema.com');
      setPassword('password123');
    } else {
      setEmail('sarah.jenkins@creatorbridge.ai');
      setPassword('password123');
    }
  };

  // Standard Email + Password Login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please provide a valid work email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(cleanEmail, password, selectedRole);
      setLoading(false);

      if (res.success) {
        showToast(`Welcome back to CreatorBridge! Signed in as ${cleanEmail}`, 'success');
        if (selectedRole === 'brand') {
          navigate('home');
        } else if (selectedRole === 'creator') {
          navigate('creator-profile');
        } else {
          navigate('home');
        }
      } else if (res.notRegistered || res.error === 'NOT_REGISTERED') {
        setUnregisteredEmailAttempted(cleanEmail);
        setShowRegisterPromptModal(true);
      } else {
        setError(res.error || 'Invalid credentials. Please verify your email and password.');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Login failed. Please try again.');
    }
  };

  const navigateToRegisterWithEmail = (role: 'brand' | 'creator') => {
    setShowRegisterPromptModal(false);
    localStorage.setItem('cb_register_prefill', JSON.stringify({
      email: unregisteredEmailAttempted,
      role,
    }));
    navigate('register', undefined, { email: unregisteredEmailAttempted, role });
  };

  return (
    <div className="min-h-[85vh] bg-[#F8F9FF] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-[#000E23] flex items-center justify-center text-white font-bold text-lg shadow-md mb-3">
            <span className="text-[#6AA0FD]">CB</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#001B3F]">
            Sign in to CreatorBridge<span className="text-[#175CB5]">.AI</span>
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
            Enterprise Generative AI Talent Marketplace & Dual-Sign Escrow
          </p>
        </div>

        {/* Currently Logged In Notice */}
        {isAuthenticated && currentUser && (
          <div className="mt-4 mx-4 sm:mx-0 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Signed in as <strong>{currentUser.name}</strong> ({currentUser.title})</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('home')}
                className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700 cursor-pointer"
              >
                Enter Marketplace →
              </button>
              <button
                onClick={() => {
                  logout();
                  showToast('Signed out successfully', 'info');
                }}
                className="text-emerald-700 underline font-semibold hover:text-emerald-900 cursor-pointer"
              >
                Sign out
              </button>
            </div>
          </div>
        )}

      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-200">
          
          {/* DUAL PORTAL SWITCHER TABS */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2.5">
              Select Your Access Portal:
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Brand Portal Tab */}
              <button
                type="button"
                onClick={() => handleRoleChange('brand')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedRole === 'brand'
                    ? 'border-[#175CB5] bg-[#F0F4FF] ring-2 ring-[#175CB5]/30 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Building2 className={`w-5 h-5 ${selectedRole === 'brand' ? 'text-[#175CB5]' : 'text-slate-500'}`} />
                    <span className="text-xs font-bold text-slate-900">Brand / Agency</span>
                  </div>
                  {selectedRole === 'brand' && (
                    <span className="w-2 h-2 rounded-full bg-[#175CB5]" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Post project briefs, hire creators & manage milestone escrow
                </p>
              </button>

              {/* Creator Portal Tab */}
              <button
                type="button"
                onClick={() => handleRoleChange('creator')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedRole === 'creator'
                    ? 'border-[#6D28D9] bg-[#FAF5FF] ring-2 ring-[#6D28D9]/30 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Palette className={`w-5 h-5 ${selectedRole === 'creator' ? 'text-[#6D28D9]' : 'text-slate-500'}`} />
                    <span className="text-xs font-bold text-slate-900">AI Creator</span>
                  </div>
                  {selectedRole === 'creator' && (
                    <span className="w-2 h-2 rounded-full bg-[#6D28D9]" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Deliver milestone assets, upload depth passes & receive disbursements
                </p>
              </button>
            </div>
          </div>

          {/* ERROR ALERT */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ============================================================== */}
          {/* EMAIL & PASSWORD AUTHENTICATION FORM                           */}
          {/* ============================================================== */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">
                {selectedRole === 'brand' ? 'Corporate Work Email' : 'Creator Studio Email'}
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={selectedRole === 'brand' ? 'name@brand.com' : 'artist@studio.com'}
                  className="block w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#175CB5] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="block w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#175CB5] focus:border-transparent font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Demo Pre-fill Links for convenience */}
            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-slate-400">Demo Account:</span>
              <button
                type="button"
                onClick={() => {
                  if (selectedRole === 'brand') {
                    setEmail('david.vance@auramotors.com');
                    setPassword('password123');
                  } else {
                    setEmail('alex.morgan@runwaycinema.com');
                    setPassword('password123');
                  }
                  showToast('Loaded demo credentials', 'info');
                }}
                className="text-[#175CB5] font-semibold hover:underline cursor-pointer"
              >
                {selectedRole === 'brand' ? 'Fill David Vance (Brand)' : 'Fill Alex Morgan (Creator)'}
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 ${
                selectedRole === 'brand'
                  ? 'bg-[#175CB5] hover:bg-[#124b96]'
                  : 'bg-[#6D28D9] hover:bg-[#5b21b6]'
              }`}
            >
              <span>{loading ? 'Authenticating...' : `Sign In to ${selectedRole === 'brand' ? 'Brand' : 'Creator'} Portal`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Registration Redirect Cards */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            {selectedRole === 'brand' ? (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-bold text-slate-900">New Brand Client?</p>
                  <p className="text-slate-500 text-[11px]">Fill brand details, scope briefs & escrow budgets</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('register', undefined, { role: 'brand', email })}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-[#175CB5] hover:bg-[#124b96] text-white font-semibold transition-colors cursor-pointer"
                >
                  Complete Brand Form & Register
                </button>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-bold text-purple-950">New AI Creator? Verification Required</p>
                  <p className="text-slate-600 text-[11px]">Verify portfolio with AI before creating account</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('register', undefined, { role: 'creator', email })}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-[#6D28D9] hover:bg-[#5b21b6] text-white font-semibold transition-colors cursor-pointer"
                >
                  AI Verification & Registration
                </button>
              </div>
            )}
          </div>

          {/* Security certifications footer badge */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[10px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Dual-Signature Escrow • $250k IP Indemnity • Secure Authentication</span>
          </div>

        </div>
      </div>

      {/* ============================================================== */}
      {/* POPUP MODAL: ACCOUNT NOT REGISTERED PROMPT                     */}
      {/* ============================================================== */}
      {showRegisterPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
            {/* Modal Header Banner */}
            <div className="bg-gradient-to-r from-[#000E23] to-[#14243A] p-5 text-white relative">
              <button
                type="button"
                onClick={() => setShowRegisterPromptModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Account Not Found</h3>
                  <p className="text-xs text-slate-300">Registration is required to access the marketplace</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <p className="font-semibold mb-1">
                  We could not find an existing account for:
                </p>
                <div className="font-mono bg-white/80 px-2.5 py-1.5 rounded-lg border border-amber-300 font-bold text-slate-800 break-all">
                  {unregisteredEmailAttempted}
                </div>
                <p className="mt-2 text-[11px] text-amber-800 leading-relaxed">
                  To protect our $250k IP indemnity and dual-signature escrow contracts, all users must register and complete the verification onboarding flow.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  How would you like to join?
                </p>

                {/* Register as Brand */}
                <button
                  type="button"
                  onClick={() => navigateToRegisterWithEmail('brand')}
                  className="w-full p-3 rounded-xl border border-[#175CB5]/30 bg-[#F0F4FF] hover:bg-[#E5EEFF] transition-all text-left flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#175CB5] text-white flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#175CB5]">
                        Register as Brand / Agency Client
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Commission generative AI talent & manage project escrow
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#175CB5] group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Register as Creator */}
                <button
                  type="button"
                  onClick={() => navigateToRegisterWithEmail('creator')}
                  className="w-full p-3 rounded-xl border border-[#6D28D9]/30 bg-[#FAF5FF] hover:bg-[#F3E8FF] transition-all text-left flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#6D28D9] text-white flex items-center justify-center">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#6D28D9]">
                        Register as AI Creator (AI Verification)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Verify toolchain & qualify for Tier 1 accreditation
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#6D28D9] group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* Alternative */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowRegisterPromptModal(false);
                    setEmail('david.vance@auramotors.com');
                    setPassword('password123');
                    setSelectedRole('brand');
                  }}
                  className="text-slate-600 hover:text-[#175CB5] font-semibold transition-colors cursor-pointer"
                >
                  Or use Demo Account →
                </button>
                <button
                  type="button"
                  onClick={() => setShowRegisterPromptModal(false)}
                  className="text-slate-500 hover:text-slate-800 text-xs cursor-pointer"
                >
                  Try Another Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
