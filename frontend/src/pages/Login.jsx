import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock } from 'lucide-react';

export default function Login() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Por favor, digite a senha.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('auth_token', data.token || 'true');
        navigate('/controle');
      } else {
        setError(data.message || 'Senha incorreta!');
      }
    } catch (err) {
      console.error('Erro na autenticação:', err);
      setError('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 20% 30%, #1e293b 0%, #0f172a 40%, #020617 100%)',
      fontFamily: "'Outfit', sans-serif"
    }}>
      <style>
        {`
           input::placeholder { color: #475569; }
        `}
      </style>
      
      <div style={{
        background: '#1e293b', 
        borderRadius: '12px',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '430px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
        border: '1px solid #334155',
        textAlign: 'left'
      }}>
        <h1 style={{ fontSize: '1.9rem', fontWeight: 'bold', margin: '0 0 0.5rem 0', color: 'white', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Lock size={26} color="#3b82f6" /> Sistema de painel
        </h1>
        <p style={{ fontSize: '0.95rem', color: '#94a3b8', margin: '0 0 2rem 0' }}>Acesso Restrito ao Operador</p>
        
        {error && (
          <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Senha de Acesso</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Digite a senha"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem 2.5rem 0.75rem 1rem',
                  borderRadius: '8px',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  color: 'white',
                  outline: 'none',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                  fontSize: '0.95rem',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.border = '1px solid #3b82f6'}
                onBlur={(e) => e.target.style.border = '1px solid #334155'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  padding: '0.4rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.65rem 1.8rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              alignSelf: 'flex-start',
              width: 'auto',
              fontSize: '0.95rem',
              transition: 'background-color 0.2s',
              boxShadow: '0 0 10px rgba(59, 130, 246, 0.4)'
            }}
            onMouseOver={(e) => { if (!loading) e.target.style.backgroundColor = '#2563eb'; }}
            onMouseOut={(e) => { if (!loading) e.target.style.backgroundColor = '#3b82f6'; }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
