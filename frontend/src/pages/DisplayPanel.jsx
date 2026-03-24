import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

export default function DisplayPanel() {
  const [socket, setSocket] = useState(null);
  const [sessionState, setSessionState] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const requestRef = useRef();
  const audioRef = useRef(null);
  const hasPlayedAudio = useRef(false);

  // Relógio do sistema
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Socket
  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('state_update', (state) => {
      setSessionState(state);
      if (!state.timer.isRunning) {
         setDisplaySeconds(state.timer.remaining);
      }
      
      // Se foi recarregado/resetado e ficou maior que zero, reseta a flag de áudio
      if(state.timer.remaining > 0) {
         hasPlayedAudio.current = false;
      }
    });

    return () => newSocket.close();
  }, []);

  // Timer fluído
  useEffect(() => {
    const updateTimerDisplay = () => {
      if (sessionState && sessionState.timer.isRunning) {
        const elapsed = (Date.now() - sessionState.timer.updatedAt) / 1000;
        let remaining = sessionState.timer.remaining - elapsed;
        
        if (remaining <= 0) {
          remaining = 0;
          // Tocar o som quando zera, apenas se não tiver tocado ainda!
          if (!hasPlayedAudio.current && sessionState.audioUrl && audioRef.current) {
             hasPlayedAudio.current = true;
             audioRef.current.play().catch(e => console.log('Bloqueado pelo chrome, precisa interagir primeiro', e));
          }
        }
        setDisplaySeconds(remaining);
      }
      requestRef.current = requestAnimationFrame(updateTimerDisplay);
    };

    requestRef.current = requestAnimationFrame(updateTimerDisplay);
    return () => cancelAnimationFrame(requestRef.current);
  }, [sessionState]);

  if (!sessionState) {
    return <div className="display-loading" style={{color: 'white', background: 'black', height: '100vh', display: 'flex', alignItems:'center', justifyContent: 'center'}}>Aguardando conexão com a mesa operadora...</div>;
  }

  // Prepara variaveis visuais
  const bgColor = sessionState.bgColor || '#000000';
  const textColor = sessionState.textColor || '#ffffff';
  const logoUrl = sessionState.logoUrl ? `http://localhost:3000${sessionState.logoUrl}` : null;
  const audioUrl = sessionState.audioUrl ? `http://localhost:3000${sessionState.audioUrl}` : null;
  const institutionName = sessionState.institutionName || 'Câmara Municipal de Carneirinho - MG';

  const formatTime = (totalSeconds) => {
    const min = Math.floor(Math.max(0, totalSeconds) / 60).toString().padStart(2, '0');
    const sec = Math.floor(Math.max(0, totalSeconds) % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  const isTimeUp = displaySeconds <= 0;
  const isWarning = displaySeconds > 0 && displaySeconds <= 15; // Amarelo quando falta 15 segs

  return (
    <div className="display-container" style={{ backgroundColor: bgColor, color: textColor }}>
      
      {/* Player de áudio invisível */}
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="auto" />}

      <div className="display-header" style={{ borderBottom: `1px solid ${textColor}33`, background: `linear-gradient(to bottom, ${textColor}1A, transparent)` }}>
         <div className="brazao-placeholder">
           {logoUrl ? (
              <img src={logoUrl} alt="Brasão" style={{width: '90px', height: '90px', objectFit: 'contain', filter: 'drop-shadow(0px 0px 10px rgba(0,0,0,0.5))'}} />
           ) : (
              <div className="logo-circle" style={{ background: textColor, opacity: 0.2 }}></div>
           )}
         </div>
         <div className="system-title">
           <h1 style={{color: textColor}}>{institutionName}</h1>
           <h2 style={{color: textColor, opacity: 0.8}}>{sessionState.phase || "Sessão Plenária"}</h2>
         </div>
         <div className="clock-widget" style={{color: textColor, opacity: 0.6}}>
           {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
         </div>
      </div>

      <div className="display-main">
         <div className="speaker-info">
            <h3 style={{color: textColor, opacity: 0.5}}>Orador Atual</h3>
            <div className="speaker-name" style={{color: textColor}}>
              {sessionState.activeSpeaker || "Nenhum orador ativo"}
            </div>
         </div>

         <div 
           className={`huge-timer ${isTimeUp ? 'time-up' : ''} ${isWarning ? 'time-warning' : ''}`}
           style={{ color: (isTimeUp || isWarning) ? '' : textColor, textShadow: `0 10px 40px ${textColor}33` }}
         >
           {formatTime(displaySeconds)}
         </div>
      </div>
      
      <div className="display-footer" style={{ borderTop: `1px solid ${textColor}33`, background: `${textColor}0D` }}>
         <div className="status-bar" style={{color: textColor, opacity: 0.7}}>
            {sessionState.timer.isRunning ? "Tempo em andamento" : "Temporizador Pausado"}
         </div>
      </div>
    </div>
  );
}
