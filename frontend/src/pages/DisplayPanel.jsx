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
  
  // Estado para capturar o exato momento em que o timer bateu 00:00
  const [timeZeroAt, setTimeZeroAt] = useState(null);

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

    newSocket.on('enter_fullscreen', () => {
      try {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch((err) => {
            console.log(`Erro ao tentar fullscreen: ${err.message}`);
          });
        }
      } catch (err) {
        console.error(err);
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
        }
        setDisplaySeconds(remaining);
      }
      requestRef.current = requestAnimationFrame(updateTimerDisplay);
    };

    requestRef.current = requestAnimationFrame(updateTimerDisplay);
    return () => cancelAnimationFrame(requestRef.current);
  }, [sessionState]);

  // Lógica de áudio e controle de timeZeroAt
  useEffect(() => {
      // Reproduzir áudio apenas na hora em que o cronômetro acabar e for de fato um timer ativo zerando
      if (sessionState?.timer?.hasStarted && displaySeconds === 0 && !hasPlayedAudio.current) {
         hasPlayedAudio.current = true;
         if (audioRef.current) {
            audioRef.current.play().catch(e => console.log('Erro ao tocar audio:', e));
         }
      }
      
      // Controla a flag para registrar o exato inicio do vermelho piscante
      if (sessionState?.displayMode === 'timer' && sessionState?.timer?.hasStarted && displaySeconds === 0) {
         if (!timeZeroAt) {
            setTimeZeroAt(Date.now());
         }
      } else {
         if (timeZeroAt) setTimeZeroAt(null); // Reseta a flag se sair do zero ou for pro relógio
      }
  }, [displaySeconds, sessionState, timeZeroAt]);

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
    const min = Math.floor(Math.max(0, totalSeconds) / 60);
    const sec = Math.floor(Math.max(0, totalSeconds) % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Warning = 60 Segundos ou Menos E Maior que Zero
  const isWarning = displaySeconds > 0 && displaySeconds <= 60;
  
  // Condição para TimeUp/Piscar: Ter acabado E estar dentro dos primeiros 5 segundos (+/- delay) após o término
  const isTimeUpFlashing = sessionState?.timer?.hasStarted && displaySeconds === 0 && timeZeroAt && (Date.now() - timeZeroAt < 5000);

  return (
    <div className="display-container" style={{ backgroundColor: bgColor, color: textColor }}>
      
      {/* Player de áudio invisível */}
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="auto" />}

      <div className="display-header" style={{ borderBottom: `1px solid ${textColor}33`, background: `linear-gradient(to bottom, ${textColor}1A, transparent)` }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
           <div className="brazao-placeholder">
             {logoUrl ? (
                <img src={logoUrl} alt="Brasão" style={{width: '90px', height: '90px', objectFit: 'contain', filter: 'drop-shadow(0px 0px 10px rgba(0,0,0,0.5))'}} />
             ) : (
                <div className="logo-circle" style={{ background: textColor, opacity: 0.2 }}></div>
             )}
           </div>
           <div className="system-title" style={{ textAlign: 'left' }}>
             <h1 style={{color: textColor, margin: 0}}>{institutionName}</h1>
             {sessionState.displayMode !== 'clock' && (
                 <h2 style={{color: textColor, opacity: 0.8, marginTop: '0.5rem'}}>{sessionState.phase || "Sessão Plenária"}</h2>
             )}
           </div>
         </div>
         
         {sessionState.displayMode !== 'clock' && (
             <div className="clock-widget" style={{color: textColor, opacity: 0.6}}>
               {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
             </div>
         )}
      </div>

      <div className="display-main">
         {sessionState.displayMode === 'clock' ? (
             <div className="huge-clock" style={{ color: textColor, fontSize: '20rem', fontWeight: 800, fontFamily: 'Outfit', textShadow: `0 10px 40px ${textColor}33`, fontVariantNumeric: 'tabular-nums' }}>
               {currentTime.toLocaleTimeString('pt-BR')}
             </div>
         ) : (
             <>
               <div className="speaker-info">
                  <h3 style={{color: textColor, opacity: 0.5}}>Orador Atual</h3>
                  <div className="speaker-name" style={{color: textColor}}>
                    {sessionState.activeSpeaker || "Nenhum orador ativo"}
                  </div>
               </div>
      
               <div 
                 className={`huge-timer ${isTimeUpFlashing ? 'time-up' : ''} ${isWarning ? 'time-warning' : ''}`}
                 style={{ color: (isTimeUpFlashing || isWarning) ? '' : textColor, textShadow: `0 10px 40px ${textColor}33` }}
               >
                 {formatTime(displaySeconds)}
               </div>
             </>
         )}
      </div>
      
      <div className="display-footer" style={{ borderTop: `1px solid ${textColor}33`, background: `${textColor}0D` }}>
         <div className="status-bar" style={{color: textColor, opacity: 0.7}}>
            {sessionState.displayMode === 'clock' 
                ? "Exibindo Hora Local" 
                : (sessionState.timer.isRunning ? "Tempo em andamento" : "Temporizador Pausado")}
         </div>
      </div>
    </div>
  );
}
