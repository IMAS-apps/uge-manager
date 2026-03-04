import React, { useState } from 'react';
import { User } from '../types';
import { LogIn, UserPlus } from 'lucide-react';
import { ImasLogo } from '../App';

interface AuthViewProps {
  onLogin: (user: User, token: string) => void;
}

export function AuthView({ onLogin }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin ? { email, password } : { email, password, full_name: fullName };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "S'ha produït un error");
      }

      if (isLogin) {
        onLogin(data.user, data.token);
      } else {
        setSuccessMsg('Usuari registrat correctament. Ara pots iniciar sessió.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-light px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-border">
        <div className="flex flex-col items-center text-center mb-8">
          <ImasLogo className="w-20 h-20 mb-4" />
          <h1 className="text-3xl font-bold text-primary tracking-widest mb-1">IMAS</h1>
          <p className="text-sm text-text-secondary font-medium uppercase tracking-wider">Institut Mallorquí d'Afers Socials</p>
          <div className="h-px w-16 bg-border my-4"></div>
          <p className="text-text-secondary">Gestió de Peticions de Despesa</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-danger/10 text-danger rounded-md text-sm border border-danger/20">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-success/10 text-success rounded-md text-sm border border-success/20">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Nom complet</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Correu electrònic</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Contrasenya</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
            />
            {!isLogin && <p className="text-xs text-text-secondary mt-1">Mínim 8 caràcters</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-white py-2 px-4 rounded-md hover:bg-accent-dark transition-colors flex justify-center items-center gap-2 disabled:opacity-70 font-medium shadow-sm"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : isLogin ? (
              <><LogIn size={18} /> Iniciar sessió</>
            ) : (
              <><UserPlus size={18} /> Registrar-se</>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccessMsg('');
            }}
            className="text-sm text-primary hover:text-primary-dark font-medium transition-colors"
          >
            {isLogin ? "No tens compte? Registra't" : "Ja tens compte? Inicia sessió"}
          </button>
        </div>
      </div>
    </div>
  );
}
