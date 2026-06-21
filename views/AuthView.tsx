import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { Auth } from '../services/db';

type Mode = 'login' | 'register';

interface Props {
  onSuccess: () => void;
}

const AuthView: React.FC<Props> = ({ onSuccess }) => {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'register') {
        await Auth.signUp(email, password, name);
        setSuccess('Conta criada! Verifique seu e-mail para confirmar o cadastro, depois faça login.');
        setMode('login');
      } else {
        await Auth.signIn(email, password);
        onSuccess();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Invalid login')) setError('E-mail ou senha inválidos.');
      else if (msg.includes('already registered')) setError('Este e-mail já está cadastrado. Faça login.');
      else if (msg.includes('Email not confirmed')) setError('Confirme seu e-mail antes de entrar.');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-blue-600/30">
            <span className="text-white font-black text-3xl italic">V</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">VÉRTICE</h1>
          <p className="text-emerald-400 text-xs font-black uppercase tracking-[0.3em] mt-1">
            Agente WhatsApp com IA
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-slate-100 mb-1">
            {mode === 'login' ? 'Entrar na sua conta' : 'Criar conta grátis'}
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            {mode === 'login'
              ? 'Acesse seu painel de agente WhatsApp'
              : 'Configure seu agente de IA em minutos'}
          </p>

          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-5">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-5">
              <p className="text-emerald-400 text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <Field
                label="Seu nome"
                icon={<User className="w-4 h-4" />}
                value={name}
                onChange={setName}
                type="text"
                placeholder="João Silva"
                required
              />
            )}
            <Field
              label="E-mail"
              icon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="seuemail@empresa.com"
              required
            />
            <div className="relative">
              <Field
                label="Senha"
                icon={<Lock className="w-4 h-4" />}
                value={password}
                onChange={setPassword}
                type={showPass ? 'text' : 'password'}
                placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                className="absolute right-4 top-[34px] text-slate-500 hover:text-slate-300"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 mt-2"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Aguarde...</>
                : mode === 'login' ? 'Entrar' : 'Criar minha conta'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-500 text-sm">
              {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
              <button
                onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); }}
                className="text-blue-400 font-semibold hover:text-blue-300 transition-colors"
              >
                {mode === 'login' ? 'Criar conta grátis' : 'Fazer login'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-700 text-xs mt-6">
          Powered by Gemini AI + Supabase
        </p>
      </div>
    </div>
  );
};

const Field: React.FC<{
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}> = ({ label, icon, value, onChange, type = 'text', placeholder, required }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-400 mb-1.5">{label}</label>
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full bg-[#1e293b] text-slate-200 text-sm pl-11 pr-4 py-3.5 rounded-xl border border-slate-700 focus:border-blue-500 outline-none placeholder:text-slate-600 transition-colors"
      />
    </div>
  </div>
);

export default AuthView;
