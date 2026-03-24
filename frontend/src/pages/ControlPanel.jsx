import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Play, Pause, RotateCcw, Monitor, Maximize } from 'lucide-react';

export default function ControlPanel() {
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [sessionState, setSessionState] = useState(null);
  
  // Local form state
  const [speakerName, setSpeakerName] = useState('');
  const [phase, setPhase] = useState('Pequeno Expediente');
  
  const [institutionName, setInstitutionName] = useState('Câmara Municipal de Carneirinho - MG');
  const [bgColor, setBgColor] = useState('#000000');
  const [textColor, setTextColor] = useState('#ffffff');
  const [logoUrl, setLogoUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');

  useEffect(() => {
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
      
      setInstitutionName(state.institutionName || 'Câmara Municipal de Carneirinho - MG');
      setBgColor(state.bgColor || '#000000');
      setTextColor(state.textColor || '#ffffff');
      setLogoUrl(state.logoUrl || '');
      setAudioUrl(state.audioUrl || '');
    });

    return () => newSocket.close();
  }, [navigate]);

  if (!sessionState) {
    return <div className="loading">Conectando ao servidor...</div>;
  }

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
         if(type === 'logo') setLogoUrl(data.url);
         if(type === 'audio') setAudioUrl(data.url);
         
         // Salva automaticamente o novo arquivo no websocket local, pra não precisar clicar em ATUALIZAR
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
       activeSpeaker: speakerName, 
       phase,
       institutionName,
       bgColor,
       textColor,
       logoUrl,
       audioUrl
    });
  };

  const startTimer = () => socket.emit('start_timer');

  const pauseTimer = () => {
    const elapsed = Math.floor((Date.now() - sessionState.timer.updatedAt) / 1000);
    const remaining = Math.max(0, sessionState.timer.remaining - elapsed);
    socket.emit('pause_timer', remaining);
  };

  const resetTimerSeconds = (seconds) => {
    socket.emit('reset_timer', seconds);
  };
  
  const openDisplay = () => window.open('/painel', '_blank');
  
  const requestFullscreen = () => {
    socket.emit('request_fullscreen');
  };

  return (
    <div className="control-container">
      <header className="control-header">
        <h2>Painel de Operador</h2>
        <div className="header-actions">
           <button onClick={openDisplay} className="btn-secondary">
             <Monitor size={16} /> Abrir painel
           </button>
           <button onClick={requestFullscreen} className="btn-secondary">
             <Maximize size={16} /> Colocar painel em tela cheia
           </button>
           <button onClick={() => { localStorage.removeItem('auth_token'); navigate('/login'); }} className="btn-ghost">
             Sair
           </button>
        </div>
      </header>

      <main className="control-content">
        <section className="card">
          <h3>Sessão e Identidade</h3>
          <form onSubmit={handleUpdateSettings} className="config-form">
            
            <div className="input-group">
              <label>Nome da Instituição</label>
              <input 
                type="text" 
                value={institutionName} 
                onChange={(e) => setInstitutionName(e.target.value)} 
                placeholder="Câmara Municipal de Carneirinho - MG"
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

            <div className="input-group" style={{borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem'}}>
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
            
            <button type="submit" className="btn-primary">Atualizar Informações no Telão</button>
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
            
            <button className="btn-danger" onClick={() => resetTimerSeconds(sessionState.timer.duration)}>
              <RotateCcw size={20} /> Reiniciar Original
            </button>
          </div>
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%'}}>
             <label style={{textAlign: 'left', fontSize: '0.85rem', color: '#94a3b8', marginTop: '1rem'}}>Atalhos de Tempos Curtos:</label>
             <div className="quick-times">
                 <button onClick={() => resetTimerSeconds(5)} className="btn-outline">5 Seg</button>
                 <button onClick={() => resetTimerSeconds(30)} className="btn-outline">30 Seg</button>
                 <button onClick={() => resetTimerSeconds(60)} className="btn-outline">1 Min</button>
                 <button onClick={() => resetTimerSeconds(120)} className="btn-outline">2 Min</button>
             </div>

             <label style={{textAlign: 'left', fontSize: '0.85rem', color: '#94a3b8', marginTop: '1rem'}}>Atalhos de Tempos Longos:</label>
             <div className="quick-times">
                 <button onClick={() => resetTimerSeconds(180)} className="btn-outline">3 Min</button>
                 <button onClick={() => resetTimerSeconds(300)} className="btn-outline">5 Min</button>
                 <button onClick={() => resetTimerSeconds(600)} className="btn-outline">10 Min</button>
                 <button onClick={() => resetTimerSeconds(900)} className="btn-outline">15 Min</button>
             </div>
          </div>
        </section>
      </main>
    </div>
  );
}
