import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('auth_token', data.token);
        navigate('/controle');
      } else {
        setError(data.message || 'Senha incorreta');
      }
    } catch (err) {
        // Fallback for demonstration if backend is not running yet
        if (password === 'admin123') {
           localStorage.setItem('auth_token', 'offline-token');
           navigate('/controle');
        } else {
           setError('Erro ao conectar ao servidor');
        }
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>Sistema de Sessão</h1>
          <p>Acesso Restrito ao Operador</p>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label htmlFor="password">Senha de Acesso</label>
            <input 
              type="password" 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite a senha"
              autoFocus
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="btn-primary">
            Entrar no Painel
          </button>
        </form>

        <div className="login-footer">
           <button onClick={() => navigate('/painel')} className="btn-link">
             Acessar Tela de Exibição (Pública)
           </button>
        </div>
      </div>
    </div>
  );
}
