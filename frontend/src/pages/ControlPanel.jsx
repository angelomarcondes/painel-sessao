import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Play, Pause, RotateCcw, Monitor, Maximize, Settings, ChevronDown, ChevronUp } from 'lucide-react';

export default function ControlPanel() {
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [sessionState, setSessionState] = useState(null);
  
  // UI State
  const [showSettings, setShowSettings] = useState(false);

  // Local form state
  const [speakerName, setSpeakerName] = useState('');
  const [phase, setPhase] = useState('Pequeno Expediente');
  
  const [institutionName, setInstitutionName] = useState('Câmara Municipal de Carneirinho - MG');
  const [bgColor, setBgColor] = useState('#000000');
  const [textColor, setTextColor] = useState('#ffffff');
  const [logoUrl, setLogoUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  
  const [speakerList, setSpeakerList] = useState('');
  const [phaseList, setPhaseList] = useState('Expediente\nOrdem do dia');

  const [clockFontSize, setClockFontSize] = useState(20);
  const [timerFontSize, setTimerFontSize] = useState(18);
  const [speakerFontSize, setSpeakerFontSize] = useState(4);
  const [titleFontSize, setTitleFontSize] = useState(2.5);

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
      setPhase(state.phase || 'Pequeno Expediente');
      
      setInstitutionName(state.institutionName || 'Câmara Municipal de Carneirinho - MG');
      setBgColor(state.bgColor || '#000000');
      setTextColor(state.textColor || '#ffffff');
      setLogoUrl(state.logoUrl || '');
      setAudioUrl(state.audioUrl || '');
      
      setSpeakerList(state.speakerList || '');
      setPhaseList(state.phaseList || 'Expediente\nOrdem do dia');
      
      setClockFontSize(state.clockFontSize || 20);
      setTimerFontSize(state.timerFontSize || 18);
      setSpeakerFontSize(state.speakerFontSize || 4);
      setTitleFontSize(state.titleFontSize || 2.5);
      
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

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
         if(type === 'logo') setLogoUrl(data.url);
         if(type === 'audio') setAudioUrl(data.url);
         
         socket.emit('control_update', { 
           [type === 'logo' ? 'logoUrl' : 'audioUrl']: data.url 
         });
      }
    } catch (err) {
      console.error("Erro no upload", err);
      alert("Erro ao enviar arquivo para o servidor.");
    }
  };

  const handleUpdateSettings = (e) => {
    e.preventDefault();
    socket.emit('control_update', { 
       institutionName,
       bgColor,
       textColor,
       logoUrl,
       audioUrl,
       speakerList,
       phaseList,
       clockFontSize,
       timerFontSize,
       speakerFontSize,
       titleFontSize
    });
    alert("Configurações salvas com sucesso!");
    setShowSettings(false); // Recolhe as configurações ao salvar
  };

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

  const pauseTimer = (forceZero = false) => {
    if (forceZero) {
       socket.emit('pause_timer', 0);
    } else {
       const elapsed = Math.floor((Date.now() - sessionState.timer.updatedAt) / 1000);
       const remaining = Math.max(0, sessionState.timer.remaining - elapsed);
       socket.emit('pause_timer', remaining);
    }
  };

  const addTimeSeconds = (seconds) => {
    socket.emit('add_time', seconds);
  };
  
  const startAparte = () => socket.emit('start_aparte');
  const stopAparte = () => socket.emit('stop_aparte');
  const handleAparteadorUpdate = (value) => socket.emit('update_aparteador', value);
  
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

  const speakerOptions = speakerList.split('\n').filter(s => s.trim() !== '');
  const phaseOptions = phaseList.split('\n').filter(s => s.trim() !== '');

  return (
    <div className="control-container" style={{ padding: '1rem 2rem' }}>
      <header className="control-header" style={{ marginBottom: '1rem', borderBottom: 'none' }}>
        <h2 style={{ fontSize: '1.25rem' }}>Painel de Operador</h2>
        <div className="header-actions">
           <button onClick={() => { localStorage.removeItem('auth_token'); navigate('/login'); }} className="btn-ghost" style={{ padding: '0.4rem 1rem' }}>
             Sair
           </button>
        </div>
      </header>

      <main className="control-content" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '800px', margin: '0 auto' }}>
        
        {/* === CONTROLES DO PAINEL === */}
        <section className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', textAlign: 'left' }}>Controles do Painel</h3>
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
             <button onClick={toggleDisplayMode} className="btn-success" style={{ flex: 1, padding: '0.6rem', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
               {sessionState.displayMode === 'timer' ? 'Relógio' : 'Contador'}
             </button>
          </div>
        </section>

        {/* === CONTROLES DO CONTADOR === */}
        <section className="card timer-controls" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>Controles do Contador</h3>

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
                   cursor: 'pointer'
                }} 
                onClick={startTimer}
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
                    border: 'none'
                 }} 
                 onClick={() => pauseTimer(false)}
              >
                <Pause size={18} /> Pausar
              </button>
            )}
            
            <button className="btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={() => pauseTimer(true)}>
              <RotateCcw size={18} /> Zerar Cronômetro
            </button>

            {!sessionState.aparte?.isActive ? (
              <button 
                className={(!sessionState.timer.isRunning || sessionState.timer.remaining <= 0) ? "btn-secondary" : "btn-primary"} 
                style={{ flex: 1, justifyContent: 'center', opacity: (!sessionState.timer.isRunning || sessionState.timer.remaining <= 0) ? 0.5 : 1 }} 
                onClick={startAparte}
                disabled={!sessionState.timer.isRunning || sessionState.timer.remaining <= 0}
              >
                Aparte
              </button>
            ) : (
              <button className="btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={stopAparte}>
                Parar Aparte
              </button>
            )}
          </div>
          
          {sessionState.aparte?.isActive && (
            <div className="input-group" style={{ marginBottom: '1.5rem', textAlign: 'left', width: '100%', border: '1px solid var(--primary)', padding: '1rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)' }}>
              <label style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Selecione o aparteador</label>
              <select value={sessionState.aparte.aparteador || ''} onChange={(e) => handleAparteadorUpdate(e.target.value)}>
                <option value="">Aguardando seleção...</option>
                {speakerOptions.map((opt, i) => (
                  <option key={i} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
             <label style={{ textAlign: 'left', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>+ Adicionar Tempos:</label>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                 <button onClick={() => addTimeSeconds(5)} className="btn-outline" style={{ padding: '0.5rem', fontSize: '0.85rem' }}>+ 5s</button>
                 <button onClick={() => addTimeSeconds(30)} className="btn-outline" style={{ padding: '0.5rem', fontSize: '0.85rem' }}>+ 30s</button>
                 <button onClick={() => addTimeSeconds(60)} className="btn-outline" style={{ padding: '0.5rem', fontSize: '0.85rem' }}>+ 1m</button>
                 <button onClick={() => addTimeSeconds(120)} className="btn-outline" style={{ padding: '0.5rem', fontSize: '0.85rem' }}>+ 2m</button>
                 <button onClick={() => addTimeSeconds(180)} className="btn-outline" style={{ padding: '0.5rem', fontSize: '0.85rem' }}>+ 3m</button>
                 <button onClick={() => addTimeSeconds(300)} className="btn-outline" style={{ padding: '0.5rem', fontSize: '0.85rem' }}>+ 5m</button>
                 <button onClick={() => addTimeSeconds(600)} className="btn-outline" style={{ padding: '0.5rem', fontSize: '0.85rem' }}>+ 10m</button>
                 <button onClick={() => addTimeSeconds(900)} className="btn-outline" style={{ padding: '0.5rem', fontSize: '0.85rem' }}>+ 15m</button>
             </div>
          </div>
          
          <div style={{ marginTop: '2rem', width: '100%', textAlign: 'left', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
             <div className="input-group" style={{ marginBottom: '1rem' }}>
               <label>Fase da Sessão</label>
               <select value={phase} onChange={(e) => handleDropdownUpdate('phase', e.target.value)}>
                 <option value="">Selecione a Fase...</option>
                 {phaseOptions.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                 ))}
               </select>
             </div>
             
             <div className="input-group" style={{ marginBottom: 0 }}>
               <label>Nome do Orador</label>
               <select value={speakerName} onChange={(e) => handleDropdownUpdate('speaker', e.target.value)}>
                 <option value="">Selecione o Orador...</option>
                 {speakerOptions.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                 ))}
               </select>
             </div>
          </div>
        </section>

        {/* === AJUSTES E CONFIGURAÇÕES === */}
        <section className="card" style={{ padding: '1.25rem' }}>
          <div 
             style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
             onClick={() => setShowSettings(!showSettings)}
          >
            <h3 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={18} /> Ajustes e configurações
            </h3>
            {showSettings ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          {showSettings && (
            <form onSubmit={handleUpdateSettings} className="config-form" style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
              
              <div className="input-group">
                <label>Nome da Instituição</label>
                <input 
                  type="text" 
                  value={institutionName} 
                  onChange={(e) => setInstitutionName(e.target.value)} 
                  placeholder="Câmara Municipal de Carneirinho - MG"
                />
              </div>
              
              <div className="input-group">
                <label>Lista de Oradores (Um nome por linha)</label>
                <textarea 
                  rows="4"
                  value={speakerList} 
                  onChange={(e) => setSpeakerList(e.target.value)} 
                  placeholder="Ver. João&#10;Ver. Maria"
                  style={{width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.6)', color: 'white', border: '1px solid var(--border-color)'}}
                />
              </div>

              <div className="input-group">
                <label>Lista de Fases da Sessão (Uma fase por linha)</label>
                <textarea 
                  rows="3"
                  value={phaseList} 
                  onChange={(e) => setPhaseList(e.target.value)} 
                  placeholder="Expediente&#10;Ordem do dia"
                  style={{width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.6)', color: 'white', border: '1px solid var(--border-color)'}}
                />
              </div>

              <div style={{display: 'flex', gap: '1rem'}}>
                 <div className="input-group" style={{flex: 1}}>
                   <label>Cor de Fundo (Painel)</label>
                   <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{padding: '0 0.5rem', height: '40px'}} />
                 </div>
                 
                 <div className="input-group" style={{flex: 1}}>
                   <label>Cor do Texto</label>
                   <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} style={{padding: '0 0.5rem', height: '40px'}} />
                 </div>
              </div>

              <h4 style={{marginTop: '1rem', marginBottom: '0.5rem', fontSize: '1.1rem', color: 'var(--text-main)', textAlign: 'left'}}>Tamanho dos Textos</h4>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
                <div className="input-group" style={{marginBottom: 0}}>
                  <label style={{color: 'var(--text-main)'}}>Relógio ({clockFontSize}rem)</label>
                  <input type="range" min="10" max="40" step="1" value={clockFontSize} onChange={(e) => setClockFontSize(Number(e.target.value))} style={{padding: 0, height: 'auto', background: 'transparent'}} />
                </div>
                <div className="input-group" style={{marginBottom: 0}}>
                  <label style={{color: 'var(--text-main)'}}>Contador ({timerFontSize}rem)</label>
                  <input type="range" min="8" max="30" step="1" value={timerFontSize} onChange={(e) => setTimerFontSize(Number(e.target.value))} style={{padding: 0, height: 'auto', background: 'transparent'}} />
                </div>
                <div className="input-group" style={{marginBottom: 0}}>
                  <label style={{color: 'var(--text-main)'}}>Orador Atual ({speakerFontSize}rem)</label>
                  <input type="range" min="2" max="10" step="0.5" value={speakerFontSize} onChange={(e) => setSpeakerFontSize(Number(e.target.value))} style={{padding: 0, height: 'auto', background: 'transparent'}} />
                </div>
                <div className="input-group" style={{marginBottom: 0}}>
                  <label style={{color: 'var(--text-main)'}}>Nome da Câmara ({titleFontSize}rem)</label>
                  <input type="range" min="1" max="8" step="0.5" value={titleFontSize} onChange={(e) => setTitleFontSize(Number(e.target.value))} style={{padding: 0, height: 'auto', background: 'transparent'}} />
                </div>
              </div>

              <div className="input-group">
                <label>Logo / Brasão (Imagem)</label>
                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                {logoUrl && <small style={{color: '#10b981'}}>✔ Imagem carregada com sucesso!</small>}
              </div>

              <div className="input-group">
                <label>Alarme de Fim de Tempo (Áudio)</label>
                <input type="file" accept="audio/*" onChange={(e) => handleFileUpload(e, 'audio')} />
                {audioUrl && <small style={{color: '#10b981'}}>✔ Áudio carregado com sucesso!</small>}
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }}>Atualizar Configurações</button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
