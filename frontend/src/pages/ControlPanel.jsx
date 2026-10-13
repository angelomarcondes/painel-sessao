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
  
  const handlePanelToggle = () => {
    if (sessionState.isPanelOpen) {
      if (sessionState.timer.remaining > 0) {
        alert("Não é possível fechar o painel enquanto o contador não estiver zerado.");
        return;
      }
      socket.emit('close_panel');
    } else {
      window.open('/painel', '_blank');
      socket.emit('open_panel');
    }
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
    <div className="control-container" style={{ padding: '1rem 2rem' }}>
      <header className="control-header" style={{ marginBottom: '1rem', borderBottom: 'none' }}>
        <h2 style={{ fontSize: '1.25rem' }}>Painel de Operador</h2>
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
           <button 
             onClick={() => navigate('/ajustes')} 
             className="btn-ghost" 
             style={{ padding: '0.4rem 0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
             title="Ajustes e configurações"
             aria-label="Ajustes e configurações"
           >
             <Settings size={20} />
           </button>
           <button onClick={() => { localStorage.removeItem('auth_token'); navigate('/login'); }} className="btn-ghost" style={{ padding: '0.4rem 1rem' }}>
             Sair
           </button>
        </div>
      </header>

      <main className="control-content" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '800px', margin: '0 auto' }}>
        
        {/* === RETORNO / MINIATURA EM TEMPO REAL DO PAINEL === */}
        <PanelPreview sessionState={sessionState} />

        {/* === CONTROLES DO PAINEL === */}
        <section className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-start' }}>
            <Sliders size={18} /> Controles do Painel
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
             <button 
                onClick={handlePanelToggle} 
                className={sessionState.isPanelOpen ? "btn-danger" : "btn-primary"} 
                style={{ 
                  flex: 1, 
                  padding: '0.6rem', 
                  fontSize: '0.9rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem', 
                  opacity: (sessionState.isPanelOpen && sessionState.timer.remaining > 0) ? 0.5 : 1 
                }}
                disabled={sessionState.isPanelOpen && sessionState.timer.remaining > 0}
             >
               <Monitor size={16} /> {sessionState.isPanelOpen ? 'Fechar painel' : 'Abrir painel'}
             </button>
             <button onClick={requestFullscreen} style={{ flex: 1, padding: '0.6rem', fontSize: '0.9rem', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
               <Maximize size={16} /> Tela cheia
             </button>
             <button 
                onClick={handleSilenceToggle} 
                style={{ 
                  flex: 1, 
                  padding: '0.6rem', 
                  fontSize: '0.9rem', 
                  backgroundColor: sessionState.displayMode === 'silence' ? '#0284c7' : '#334155', 
                  color: 'white', 
                  border: sessionState.displayMode === 'silence' ? '1px solid #38bdf8' : 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem',
                  fontWeight: '500',
                  boxShadow: sessionState.displayMode === 'silence' ? '0 0 12px rgba(2, 132, 199, 0.5)' : 'none'
                }}
                title={sessionState.displayMode === 'silence' ? 'Cancelar minuto de silêncio' : 'Iniciar 1 minuto de silêncio com transição de 30s'}
             >
               <Ribbon size={16} /> {sessionState.displayMode === 'silence' ? 'Cancelar silêncio' : 'Minuto de silêncio'}
             </button>
             <button onClick={toggleDisplayMode} className="btn-success" style={{ flex: 1, padding: '0.6rem', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
               {sessionState.displayMode === 'timer' ? 'Relógio' : 'Contador'}
             </button>
          </div>
        </section>

        {/* === CONTROLES DO CONTADOR === */}
        <section className="card timer-controls" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-start' }}>
            <Timer size={18} /> Controles do Contador
          </h3>

          <div className="control-buttons" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
            {!sessionState.timer.isRunning ? (
              <button 
                className={sessionState.timer.hasStarted ? "" : "btn-success"} 
                style={{ 
                  flex: 1, 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center', 
                  gap: '0.5rem',
                  backgroundColor: sessionState.timer.hasStarted ? '#eab308' : '', 
                  color: sessionState.timer.hasStarted ? 'black' : '',
                  border: 'none',
                  borderRadius: '8px',
                   padding: '0.75rem',
                   fontSize: '1rem',
                   fontWeight: 'bold',
                   cursor: (isTimerMode && sessionState.timer.remaining > 0 && phase && speakerName) ? 'pointer' : 'not-allowed',
                   opacity: (isTimerMode && sessionState.timer.remaining > 0 && phase && speakerName) ? 1 : 0.5
                }} 
                onClick={startTimer}
                disabled={!isTimerMode || sessionState.timer.remaining <= 0 || !phase || !speakerName}
              >
                <Play size={18} /> {sessionState.timer.hasStarted ? 'Continuar' : 'Iniciar'}
              </button>
            ) : (
              <button 
                 className="btn-warning" 
                 style={{ 
                    flex: 1, 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center', 
                    gap: '0.5rem',
                    backgroundColor: '#f97316', 
                    color: 'white',
                    border: 'none',
                    cursor: isTimerMode ? 'pointer' : 'not-allowed',
                    opacity: isTimerMode ? 1 : 0.5
                 }} 
                 onClick={() => pauseTimer()}
                 disabled={!isTimerMode}
              >
                <Pause size={18} /> Pausar
              </button>
            )}
            
            <button className="btn-danger" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: isTimerMode ? 'pointer' : 'not-allowed', opacity: isTimerMode ? 1 : 0.5 }} onClick={resetCounter} disabled={!isTimerMode}>
              <RotateCcw size={18} /> Zerar Contador
            </button>

            {!sessionState.aparte?.isActive ? (
              <button 
                className={(!sessionState.timer.isRunning || sessionState.timer.remaining <= 0) ? "btn-secondary" : "btn-primary"} 
                style={{ flex: 1, justifyContent: 'center', opacity: (!isTimerMode || !sessionState.timer.isRunning || sessionState.timer.remaining <= 0) ? 0.5 : 1, cursor: (!isTimerMode || !sessionState.timer.isRunning || sessionState.timer.remaining <= 0) ? 'not-allowed' : 'pointer' }} 
                onClick={startAparte}
                disabled={!isTimerMode || !sessionState.timer.isRunning || sessionState.timer.remaining <= 0}
              >
                Aparte
              </button>
            ) : (
              <button className="btn-danger" style={{ flex: 1, justifyContent: 'center', cursor: isTimerMode ? 'pointer' : 'not-allowed', opacity: isTimerMode ? 1 : 0.5 }} onClick={stopAparte} disabled={!isTimerMode}>
                Parar Aparte
              </button>
            )}
          </div>
          
          {sessionState.aparte?.isActive && (
            <div className="input-group" style={{ marginBottom: '1.5rem', textAlign: 'left', width: '100%', border: '1px solid var(--primary)', padding: '1rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', opacity: isTimerMode ? 1 : 0.5 }}>
              <label style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Selecione o aparteante</label>
              <select disabled={!isTimerMode} value={sessionState.aparte.aparteante || ''} onChange={(e) => handleAparteanteUpdate(e.target.value)} style={{ cursor: isTimerMode ? 'pointer' : 'not-allowed' }}>
                <option value="">Aguardando seleção...</option>
                {speakerOptions.map((opt, i) => (
                  <option key={i} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}
          
          <div style={{ width: '100%', textAlign: 'left', opacity: isTimerMode ? 1 : 0.5 }}>
             <div className="input-group" style={{ marginBottom: '1rem' }}>
               <label>Fase da Sessão</label>
               <select disabled={!isTimerMode} value={phase} onChange={(e) => handleDropdownUpdate('phase', e.target.value)} style={{ cursor: isTimerMode ? 'pointer' : 'not-allowed' }}>
                 <option value="">Selecione a Fase...</option>
                 {phaseOptions.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                 ))}
               </select>
             </div>
             
             <div className="input-group" style={{ marginBottom: 0 }}>
               <label>Nome do Orador</label>
               <select disabled={!isTimerMode} value={speakerName} onChange={(e) => handleDropdownUpdate('speaker', e.target.value)} style={{ cursor: isTimerMode ? 'pointer' : 'not-allowed' }}>
                 <option value="">Selecione o Orador...</option>
                 {speakerOptions.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                 ))}
               </select>
             </div>
          </div>
          
          <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', width: '100%', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', opacity: isTimerMode ? 1 : 0.5 }}>
             <label style={{ textAlign: 'left', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>+ Adicionar Tempos:</label>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                 <button disabled={!isTimerMode} onClick={() => addTimeSeconds(5)} className="btn-outline" style={{ padding: '0.5rem', fontSize: '0.85rem', cursor: isTimerMode ? 'pointer' : 'not-allowed' }}>+ 5s</button>
                 <button disabled={!isTimerMode} onClick={() => addTimeSeconds(30)} className="btn-outline" style={{ padding: '0.5rem', fontSize: '0.85rem', cursor: isTimerMode ? 'pointer' : 'not-allowed' }}>+ 30s</button>
                 <button disabled={!isTimerMode} onClick={() => addTimeSeconds(60)} className="btn-outline" style={{ padding: '0.5rem', fontSize: '0.85rem', cursor: isTimerMode ? 'pointer' : 'not-allowed' }}>+ 1m</button>
                 <button disabled={!isTimerMode} onClick={() => addTimeSeconds(120)} className="btn-outline" style={{ padding: '0.5rem', fontSize: '0.85rem', cursor: isTimerMode ? 'pointer' : 'not-allowed' }}>+ 2m</button>
                 <button disabled={!isTimerMode} onClick={() => addTimeSeconds(180)} className="btn-outline" style={{ padding: '0.5rem', fontSize: '0.85rem', cursor: isTimerMode ? 'pointer' : 'not-allowed' }}>+ 3m</button>
                 <button disabled={!isTimerMode} onClick={() => addTimeSeconds(300)} className="btn-outline" style={{ padding: '0.5rem', fontSize: '0.85rem', cursor: isTimerMode ? 'pointer' : 'not-allowed' }}>+ 5m</button>
                 <button disabled={!isTimerMode} onClick={() => addTimeSeconds(600)} className="btn-outline" style={{ padding: '0.5rem', fontSize: '0.85rem', cursor: isTimerMode ? 'pointer' : 'not-allowed' }}>+ 10m</button>
                 <button disabled={!isTimerMode} onClick={() => addTimeSeconds(900)} className="btn-outline" style={{ padding: '0.5rem', fontSize: '0.85rem', cursor: isTimerMode ? 'pointer' : 'not-allowed' }}>+ 15m</button>
             </div>
          </div>
        </section>

      </main>
    </div>
  );
}
