import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') {
      localStorage.setItem('auth_token', 'true');
      navigate('/controle');
    } else {
      setError('Senha incorreta!');
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
        <h1 style={{ fontSize: '1.9rem', fontWeight: 'bold', margin: '0 0 0.5rem 0', color: 'white', letterSpacing: '-0.02em' }}>Sistema de painel</h1>
        <p style={{ fontSize: '0.95rem', color: '#94a3b8', margin: '0 0 2rem 0' }}>Acesso Restrito ao Operador</p>
        
        {error && <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Senha de Acesso</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Digite a senha"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
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
          </div>
          <button type="submit" style={{
             backgroundColor: '#3b82f6',
             color: 'white',
             border: 'none',
             borderRadius: '8px',
             padding: '0.65rem 1.8rem',
             fontWeight: '600',
             cursor: 'pointer',
             alignSelf: 'flex-start',
             width: 'auto',
             fontSize: '0.95rem',
             transition: 'background-color 0.2s',
             boxShadow: '0 0 10px rgba(59, 130, 246, 0.4)'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
          >Entrar</button>
        </form>
      </div>
    </div>
  );
}
