import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Play, Pause, RotateCcw, Monitor } from 'lucide-react';

export default function ControlPanel() {
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [sessionState, setSessionState] = useState(null);
  
  // Local form state
  const [speakerName, setSpeakerName] = useState('');
  const [phase, setPhase] = useState('Pequeno Expediente');

  useEffect(() => {
    // Check auth
    if (!localStorage.getItem('auth_token')) {
      navigate('/login');
      return;
    }

    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('state_update', (state) => {
      setSessionState(state);
      setSpeakerName(state.activeSpeaker || '');
      setPhase(state.phase || 'Pequeno Expediente');
    });

    return () => newSocket.close();
  }, [navigate]);

  if (!sessionState) {
    return <div className="loading">Conectando ao servidor...</div>;
  }

  const handleUpdateSpeaker = (e) => {
    e.preventDefault();
    socket.emit('control_update', { activeSpeaker: speakerName, phase });
  };

  const startTimer = () => {
    socket.emit('start_timer');
  };

  const pauseTimer = () => {
    // Calcular o remaining exato antes de pausar
    const elapsed = Math.floor((Date.now() - sessionState.timer.updatedAt) / 1000);
    const remaining = Math.max(0, sessionState.timer.remaining - elapsed);
    socket.emit('pause_timer', remaining);
  };

  const resetTimer = (minutes) => {
    socket.emit('reset_timer', minutes * 60);
  };
  
  const openDisplay = () => {
     window.open('/painel', '_blank');
  };

  return (
    <div className="control-container">
      <header className="control-header">
        <h2>Painel de Operador</h2>
        <div className="header-actions">
           <button onClick={openDisplay} className="btn-secondary">
             <Monitor size={16} /> Abrir Tela
           </button>
           <button onClick={() => { localStorage.removeItem('auth_token'); navigate('/login'); }} className="btn-ghost">
             Sair
           </button>
        </div>
      </header>

      <main className="control-content">
        <section className="card">
          <h3>Configuração da Sessão</h3>
          <form onSubmit={handleUpdateSpeaker} className="config-form">
            <div className="input-group">
              <label>Fase da Sessão</label>
              <select value={phase} onChange={(e) => setPhase(e.target.value)}>
                <option value="Pequeno Expediente">Pequeno Expediente</option>
                <option value="Grande Expediente">Grande Expediente</option>
                <option value="Ordem do Dia">Ordem do Dia</option>
                <option value="Explicação Pessoal">Explicação Pessoal</option>
              </select>
            </div>
            
            <div className="input-group">
              <label>Nome do Orador</label>
              <input 
                type="text" 
                value={speakerName} 
                onChange={(e) => setSpeakerName(e.target.value)} 
                placeholder="Ex: Ver. João Silva"
              />
            </div>
            
            <button type="submit" className="btn-primary">Atualizar Telão</button>
          </form>
        </section>

        <section className="card timer-controls">
          <h3>Controles do Relógio</h3>
          
          <div className="timer-status">
            <span className={`status-badge ${sessionState.timer.isRunning ? 'running' : 'paused'}`}>
              {sessionState.timer.isRunning ? 'Em Andamento' : 'Pausado'}
            </span>
          </div>

          <div className="control-buttons">
            {!sessionState.timer.isRunning ? (
              <button className="btn-success" onClick={startTimer}>
                <Play size={20} /> Iniciar
              </button>
            ) : (
              <button className="btn-warning" onClick={pauseTimer}>
                <Pause size={20} /> Pausar
              </button>
            )}
            
            <button className="btn-danger" onClick={() => resetTimer(5)}>
              <RotateCcw size={20} /> Reset (5m)
            </button>
          </div>
          
          <div className="quick-times">
             <button onClick={() => resetTimer(3)} className="btn-outline">3 Min</button>
             <button onClick={() => resetTimer(10)} className="btn-outline">10 Min</button>
             <button onClick={() => resetTimer(15)} className="btn-outline">15 Min</button>
          </div>
        </section>
      </main>
    </div>
  );
}
