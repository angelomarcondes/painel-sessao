import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Play, Pause, RotateCcw, Monitor, Maximize, Settings, Sliders, Timer, Ribbon } from 'lucide-react';
import PanelPreview from '../components/PanelPreview';

export default function ControlPanel() {
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [sessionState, setSessionState] = useState(null);

  // Local form state
  const [speakerName, setSpeakerName] = useState('');
  const [phase, setPhase] = useState('');
  const [speakerList, setSpeakerList] = useState('');
  const [phaseList, setPhaseList] = useState('Expediente\nOrdem do dia');

  useEffect(() => {
    if (!localStorage.getItem('auth_token')) {
      navigate('/login');
      return;
    }

    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('state_update', (state) => {
      setSessionState(state);
      setSpeakerName(state.activeSpeaker || '');
      setPhase(state.phase || '');
      setSpeakerList(state.speakerList || '');
      setPhaseList(state.phaseList || 'Expediente\nOrdem do dia');
      
      // Ajusta dinamicamente a Aba do Chrome quando carregar o state
      if (state.logoUrl) {
         let icon = document.getElementById("favicon");
         if (icon) icon.href = state.logoUrl;
      }
      if (state.institutionName) {
         document.title = `Controle - ${state.institutionName}`;
      }
    });

    return () => newSocket.close();
  }, [navigate]);

  if (!sessionState) {
    return <div className="loading" style={{color: 'white', background: '#0f172a', height: '100vh', display: 'flex', alignItems:'center', justifyContent: 'center'}}>Conectando ao servidor...</div>;
  }

  const handleDropdownUpdate = (field, value) => {
    if (field === 'speaker') {
      setSpeakerName(value);
      socket.emit('control_update', { activeSpeaker: value });
    } else {
      setPhase(value);
      socket.emit('control_update', { phase: value });
    }
  };

  const startTimer = () => socket.emit('start_timer');

  const pauseTimer = () => {
    const elapsed = Math.floor((Date.now() - sessionState.timer.updatedAt) / 1000);
    const remaining = Math.max(0, sessionState.timer.remaining - elapsed);
    socket.emit('pause_timer', remaining);
  };

  const resetCounter = () => {
    socket.emit('reset_counter');
  };

  const addTimeSeconds = (seconds) => {
    socket.emit('add_time', seconds);
  };
  
  const startAparte = () => socket.emit('start_aparte');
  const stopAparte = () => socket.emit('stop_aparte');
  const handleAparteanteUpdate = (value) => socket.emit('update_aparteante', value);
  
  const handleOpenPanel = () => {
    window.open('/painel', '_blank');
    socket.emit('open_panel');
  };
  
  const requestFullscreen = () => {
    socket.emit('request_fullscreen');
  };

  const toggleDisplayMode = () => {
    socket.emit('toggle_mode'); 
  };

  const handleSilenceToggle = () => {
    if (sessionState.displayMode === 'silence') {
      socket.emit('stop_silence');
    } else {
      socket.emit('start_silence');
    }
  };

  const speakerOptions = speakerList.split('\n').filter(s => s.trim() !== '');
  const phaseOptions = phaseList.split('\n').filter(s => s.trim() !== '');

  const isTimerMode = sessionState.displayMode === 'timer';

  return (
    <div className="control-container">
      <header className="control-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700 }}>Painel de Operador</h2>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            {sessionState.institutionName || 'Câmara Municipal'}
          </span>
        </div>
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
           <button 
             onClick={() => navigate('/ajustes')} 
             className="btn-ghost" 
             style={{ padding: '0.35rem 0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
             title="Ajustes e configurações"
             aria-label="Ajustes e configurações"
           >
             <Settings size={18} />
           </button>
           <button onClick={() => { localStorage.removeItem('auth_token'); navigate('/login'); }} className="btn-ghost" style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}>
             Sair
           </button>
        </div>
      </header>

      <main className="control-content">
        
        {/* === LADO ESQUERDO: RETORNO EM TEMPO REAL DO PAINEL === */}
        <PanelPreview sessionState={sessionState} />

        {/* === LADO DIREITO: CONTROLES DO PAINEL E CRONÔMETRO === */}
        <section className="card" style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem', padding: '0.9rem 1.15rem', overflowY: 'auto', overflowX: 'hidden', boxSizing: 'border-box' }}>
          
          {/* Seção 1: Controles da Janela do Painel */}
          <div>
            <h3 style={{ fontSize: '0.88rem', margin: '0 0 0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)', fontWeight: 600 }}>
              <Sliders size={16} /> Controles do Painel
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.45rem' }}>
               <button 
                  onClick={handleOpenPanel} 
                  className="btn-primary" 
                  style={{ 
                    padding: '0.5rem 0.35rem', 
                    fontSize: '0.82rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '0.35rem', 
                    whiteSpace: 'nowrap'
                  }}
                  title="Abrir o painel em nova aba"
               >
                 <Monitor size={15} /> Abrir o painel
               </button>
               <button 
                  onClick={requestFullscreen} 
                  style={{ 
                    padding: '0.5rem 0.35rem', 
                    fontSize: '0.82rem', 
                    backgroundColor: '#8b5cf6', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '0.35rem',
                    whiteSpace: 'nowrap'
                  }}
               >
                 <Maximize size={15} /> Tela cheia
               </button>
               <button 
                  onClick={handleSilenceToggle} 
                  style={{ 
                    padding: '0.5rem 0.35rem', 
                    fontSize: '0.82rem', 
                    backgroundColor: sessionState.displayMode === 'silence' ? '#0284c7' : '#334155', 
                    color: 'white', 
                    border: sessionState.displayMode === 'silence' ? '1px solid #38bdf8' : 'none', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '0.35rem',
                    fontWeight: '500',
                    boxShadow: sessionState.displayMode === 'silence' ? '0 0 12px rgba(2, 132, 199, 0.5)' : 'none',
                    whiteSpace: 'nowrap'
                  }}
                  title={sessionState.displayMode === 'silence' ? 'Cancelar minuto de silêncio' : 'Iniciar 1 minuto de silêncio com transição de 30s'}
               >
                 <Ribbon size={15} /> {sessionState.displayMode === 'silence' ? 'Cancelar' : 'Silêncio'}
               </button>
               <button 
                  onClick={toggleDisplayMode} 
                  className="btn-success" 
                  style={{ 
                    padding: '0.5rem 0.35rem', 
                    fontSize: '0.82rem', 
                    fontWeight: 'bold', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '0.35rem',
                    whiteSpace: 'nowrap'
                  }}
               >
                 {sessionState.displayMode === 'timer' ? 'Relógio' : 'Contador'}
               </button>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', margin: '0.1rem 0' }} />

          {/* Seção 2: Controles do Contador */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <h3 style={{ fontSize: '0.88rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)', fontWeight: 600 }}>
                <Timer size={16} /> Controles do Contador
              </h3>
              {sessionState.displayMode === 'timer' && (
                <span style={{ 
                  fontSize: '0.72rem', 
                  padding: '0.15rem 0.5rem', 
                  borderRadius: '999px',
                  background: sessionState.timer.isRunning ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: sessionState.timer.isRunning ? 'var(--success)' : 'var(--warning)',
                  fontWeight: 600
                }}>
                  {sessionState.timer.isRunning ? 'Em Andamento' : 'Pausado'}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.45rem', width: '100%', boxSizing: 'border-box' }}>
              {!sessionState.timer.isRunning ? (
                <button 
                  className={sessionState.timer.hasStarted ? "" : "btn-success"} 
                  style={{ 
                    flex: '1.2 1 0',
                    minWidth: 0, 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center', 
                    gap: '0.4rem',
                    backgroundColor: sessionState.timer.hasStarted ? '#eab308' : '', 
                    color: sessionState.timer.hasStarted ? 'black' : '',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.52rem 0.5rem',
                    fontSize: '0.88rem',
                    fontWeight: 'bold',
                    cursor: (isTimerMode && sessionState.timer.remaining > 0 && phase && speakerName) ? 'pointer' : 'not-allowed',
                    opacity: (isTimerMode && sessionState.timer.remaining > 0 && phase && speakerName) ? 1 : 0.5
                  }} 
                  onClick={startTimer}
                  disabled={!isTimerMode || sessionState.timer.remaining <= 0 || !phase || !speakerName}
                >
                  <Play size={16} /> {sessionState.timer.hasStarted ? 'Continuar' : 'Iniciar'}
                </button>
              ) : (
                <button 
                   className="btn-warning" 
                   style={{ 
                      flex: '1.2 1 0',
                      minWidth: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center', 
                      gap: '0.4rem',
                      backgroundColor: '#f97316', 
                      color: 'white',
                      border: 'none',
                      padding: '0.52rem 0.5rem',
                      fontSize: '0.88rem',
                      cursor: isTimerMode ? 'pointer' : 'not-allowed',
                      opacity: isTimerMode ? 1 : 0.5
                   }} 
                   onClick={() => pauseTimer()}
                   disabled={!isTimerMode}
                >
                  <Pause size={16} /> Pausar
                </button>
              )}
              
              <button 
                className="btn-danger" 
                style={{ 
                  flex: '1 1 0',
                  minWidth: 0,
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.4rem', 
                  padding: '0.52rem 0.5rem',
                  fontSize: '0.88rem',
                  cursor: isTimerMode ? 'pointer' : 'not-allowed', 
                  opacity: isTimerMode ? 1 : 0.5 
                }} 
                onClick={resetCounter} 
                disabled={!isTimerMode}
              >
                <RotateCcw size={16} /> Zerar
              </button>

              {!sessionState.aparte?.isActive ? (
                <button 
                  className={(!sessionState.timer.isRunning || sessionState.timer.remaining <= 0) ? "btn-secondary" : "btn-primary"} 
                  style={{ 
                    flex: '1 1 0',
                    minWidth: 0,
                    justifyContent: 'center', 
                    padding: '0.52rem 0.5rem',
                    fontSize: '0.88rem',
                    opacity: (!isTimerMode || !sessionState.timer.isRunning || sessionState.timer.remaining <= 0) ? 0.5 : 1, 
                    cursor: (!isTimerMode || !sessionState.timer.isRunning || sessionState.timer.remaining <= 0) ? 'not-allowed' : 'pointer' 
                  }} 
                  onClick={startAparte}
                  disabled={!isTimerMode || !sessionState.timer.isRunning || sessionState.timer.remaining <= 0}
                >
                  Aparte
                </button>
              ) : (
                <button 
                  className="btn-danger" 
                  style={{ 
                    flex: '1 1 0',
                    minWidth: 0,
                    justifyContent: 'center', 
                    padding: '0.52rem 0.5rem',
                    fontSize: '0.88rem',
                    cursor: isTimerMode ? 'pointer' : 'not-allowed', 
                    opacity: isTimerMode ? 1 : 0.5,
                    whiteSpace: 'nowrap'
                  }} 
                  onClick={stopAparte} 
                  disabled={!isTimerMode}
                >
                  Parar Aparte
                </button>
              )}
            </div>
          </div>

          {/* Caixa de Aparteante (quando aparte estiver ativo) */}
          {sessionState.aparte?.isActive && (
            <div style={{
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              textAlign: 'left',
              border: '1px solid var(--primary)',
              padding: '0.45rem 0.65rem',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.12)',
              opacity: isTimerMode ? 1 : 0.5
            }}>
              <label style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.78rem', display: 'block', marginBottom: '0.2rem' }}>
                Selecione o Aparteante:
              </label>
              <select 
                disabled={!isTimerMode} 
                value={sessionState.aparte.aparteante || ''} 
                onChange={(e) => handleAparteanteUpdate(e.target.value)} 
                style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '0.4rem', fontSize: '0.84rem', cursor: isTimerMode ? 'pointer' : 'not-allowed' }}
              >
                <option value="">Aguardando seleção...</option>
                {speakerOptions.map((opt, i) => (
                  <option key={i} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}

          {/* Seção 3: Seleção de Fase e Orador lado a lado */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', width: '100%', textAlign: 'left', opacity: isTimerMode ? 1 : 0.5 }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.78rem', marginBottom: '0.2rem' }}>Fase da Sessão</label>
              <select 
                disabled={!isTimerMode} 
                value={phase} 
                onChange={(e) => handleDropdownUpdate('phase', e.target.value)} 
                style={{ padding: '0.42rem 0.5rem', fontSize: '0.84rem', cursor: isTimerMode ? 'pointer' : 'not-allowed' }}
              >
                <option value="">Selecione a Fase...</option>
                {phaseOptions.map((opt, i) => (
                  <option key={i} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.78rem', marginBottom: '0.2rem' }}>Nome do Orador</label>
              <select 
                disabled={!isTimerMode} 
                value={speakerName} 
                onChange={(e) => handleDropdownUpdate('speaker', e.target.value)} 
                style={{ padding: '0.42rem 0.5rem', fontSize: '0.84rem', cursor: isTimerMode ? 'pointer' : 'not-allowed' }}
              >
                <option value="">Selecione o Orador...</option>
                {speakerOptions.map((opt, i) => (
                  <option key={i} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Seção 4: Adicionar Tempos */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            width: '100%', 
            borderTop: '1px solid rgba(255,255,255,0.07)', 
            paddingTop: '0.45rem', 
            opacity: isTimerMode ? 1 : 0.5 
          }}>
            <label style={{ textAlign: 'left', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
              + Adicionar Tempos ao Contador:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.38rem' }}>
              <button disabled={!isTimerMode} onClick={() => addTimeSeconds(5)} className="btn-outline" style={{ padding: '0.38rem 0.2rem', fontSize: '0.8rem', cursor: isTimerMode ? 'pointer' : 'not-allowed' }}>+ 5s</button>
              <button disabled={!isTimerMode} onClick={() => addTimeSeconds(30)} className="btn-outline" style={{ padding: '0.38rem 0.2rem', fontSize: '0.8rem', cursor: isTimerMode ? 'pointer' : 'not-allowed' }}>+ 30s</button>
              <button disabled={!isTimerMode} onClick={() => addTimeSeconds(60)} className="btn-outline" style={{ padding: '0.38rem 0.2rem', fontSize: '0.8rem', cursor: isTimerMode ? 'pointer' : 'not-allowed' }}>+ 1m</button>
              <button disabled={!isTimerMode} onClick={() => addTimeSeconds(120)} className="btn-outline" style={{ padding: '0.38rem 0.2rem', fontSize: '0.8rem', cursor: isTimerMode ? 'pointer' : 'not-allowed' }}>+ 2m</button>
              <button disabled={!isTimerMode} onClick={() => addTimeSeconds(180)} className="btn-outline" style={{ padding: '0.38rem 0.2rem', fontSize: '0.8rem', cursor: isTimerMode ? 'pointer' : 'not-allowed' }}>+ 3m</button>
              <button disabled={!isTimerMode} onClick={() => addTimeSeconds(300)} className="btn-outline" style={{ padding: '0.38rem 0.2rem', fontSize: '0.8rem', cursor: isTimerMode ? 'pointer' : 'not-allowed' }}>+ 5m</button>
              <button disabled={!isTimerMode} onClick={() => addTimeSeconds(600)} className="btn-outline" style={{ padding: '0.38rem 0.2rem', fontSize: '0.8rem', cursor: isTimerMode ? 'pointer' : 'not-allowed' }}>+ 10m</button>
              <button disabled={!isTimerMode} onClick={() => addTimeSeconds(900)} className="btn-outline" style={{ padding: '0.38rem 0.2rem', fontSize: '0.8rem', cursor: isTimerMode ? 'pointer' : 'not-allowed' }}>+ 15m</button>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
