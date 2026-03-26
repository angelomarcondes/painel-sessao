import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

export default function DisplayPanel() {
  const [sessionState, setSessionState] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Timer visual sync local state
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [displayAparteSeconds, setDisplayAparteSeconds] = useState(0);
  
  const requestRef = useRef();
  const audioRef = useRef(null);
  
  const previousSecondsRef = useRef(0);
  const [timeZeroAt, setTimeZeroAt] = useState(null);

  // Relógio do sistema global
  useEffect(() => {
    const int = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(int);
  }, []);

  // Web Socket Connection
  useEffect(() => {
    const newSocket = io();

    newSocket.on('state_update', (state) => {
      setSessionState(state);
      
      if (!state.timer.isRunning) {
         setDisplaySeconds(state.timer.remaining);
      }
      
      // Armamos o alarme apenas se recebermos um tempo real que vai começar a rodar
      if(state.timer.remaining > 0) {
         setTimeZeroAt(null);
      }
    });

    // Modificação dinâmica da metadata da aba do navegador para Orador/Painel
    newSocket.on('state_update', (state) => {
       if (state.logoUrl) {
          let icon = document.getElementById("favicon");
          if (icon) icon.href = state.logoUrl;
       }
       if (state.institutionName) {
          document.title = `Painel - ${state.institutionName}`;
       }
    });

    newSocket.on('enter_fullscreen', () => {
      try {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch((err) => {
             console.log(`Erro ao tentar fullscreen: ${err.message}`);
          });
        }
      } catch(err) { console.error(err); }
    });

    return () => newSocket.close();
  }, []);

  // O Relógio em queda livre
  useEffect(() => {
    if (!sessionState) return;

    const updateTime = () => {
      if (sessionState.timer.isRunning) {
        const elapsed = (Date.now() - sessionState.timer.updatedAt) / 1000;
        let remaining = Math.max(0, sessionState.timer.remaining - elapsed);
        setDisplaySeconds(remaining);
      }
      
      if (sessionState.aparte?.isActive) {
        const elapsedAparte = (Date.now() - sessionState.aparte.startedAt) / 1000;
        setDisplayAparteSeconds(elapsedAparte);
      } else {
        setDisplayAparteSeconds(0);
      }
      
      requestRef.current = requestAnimationFrame(updateTime);
    };

    requestRef.current = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(requestRef.current);
  }, [sessionState]);

  // DISPARO SEGURO DO AUDIO E DO EFEITO PISCANTE
  useEffect(() => {
    if (sessionState && sessionState.displayMode === 'timer') {
       // Apenas dispara matematicamente se:
       // 1. Está atualmente ativo correndo
       // 2. O tempo visualizou um frame anterior MAIOR que zero (se abriu zerado ou de pause, ele começa de 0, então ignorado)
       // 3. O frame atual bateu ZERO.
       if (sessionState.timer.isRunning && previousSecondsRef.current > 0 && displaySeconds <= 0) {
          setTimeZeroAt(Date.now()); // Acende o cromômetro visual de 5 segundos do Vermelho
          
          if (audioRef.current && sessionState.audioUrl) {
             audioRef.current.play().catch(e => console.log('Bloqueado pelo chrome', e));
          }
       }
    }
    
    // Rastreador matemático guardando o frame para a próxima rodada do Effect
    previousSecondsRef.current = displaySeconds;
  }, [displaySeconds, sessionState]);

  if (!sessionState) {
    return <div className="display-loading" style={{color: 'white', background: 'black', height: '100vh', display: 'flex', alignItems:'center', justifyContent: 'center'}}>Aguardando conexão com a mesa operadora...</div>;
  }

  const { bgColor, textColor, logoUrl, audioUrl, clockFontSize = 20, timerFontSize = 18, speakerFontSize = 4, titleFontSize = 2.5 } = sessionState;
  const institutionName = sessionState.institutionName || 'Câmara Municipal de Carneirinho - MG';

  const formatTime = (totalSeconds) => {
    const min = Math.floor(Math.max(0, totalSeconds) / 60);
    const sec = Math.floor(Math.max(0, totalSeconds) % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const isWarning = displaySeconds > 0 && displaySeconds <= 60;
  
  // Piscar apenas quando atingir 0 de forma natural (tendo tempoZero capturado) e durante os 5s seguintes
  const isTimeUpFlashing = timeZeroAt && (Date.now() - timeZeroAt < 5000) && displaySeconds <= 0;

  return (
    <div className="display-container" style={{ backgroundColor: bgColor, color: textColor }}>
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
             <h1 style={{color: textColor, margin: 0, fontSize: `${titleFontSize}rem`}}>{institutionName}</h1>
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
             <div className="huge-clock" style={{ color: textColor, fontSize: `${clockFontSize}rem`, fontWeight: 800, fontFamily: 'Outfit', textShadow: `0 10px 40px ${textColor}33`, fontVariantNumeric: 'tabular-nums' }}>
               {currentTime.toLocaleTimeString('pt-BR')}
             </div>
         ) : (
             <>
               <div className="speaker-info">
                  <h3 style={{color: textColor, opacity: 0.5}}>Orador Atual</h3>
                  <div className="speaker-name" style={{color: textColor, fontSize: `${speakerFontSize}rem`}}>
                    {sessionState.activeSpeaker || "Nenhum orador ativo"}
                  </div>
               </div>
      
               <div className="timers-wrapper" style={{ display: 'flex', gap: '4rem', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '0 2rem' }}>
                 <div 
                   className={`huge-timer ${isTimeUpFlashing ? 'time-up' : ''} ${isWarning ? 'time-warning' : ''}`}
                   style={{ color: (isTimeUpFlashing || isWarning) ? '' : textColor, fontSize: `${timerFontSize}rem`, textShadow: `0 10px 40px ${textColor}33`, flex: sessionState.aparte?.isActive ? 1 : 'unset', textAlign: sessionState.aparte?.isActive ? 'right' : 'center' }}
                 >
                   {formatTime(displaySeconds)}
                 </div>

                 {sessionState.aparte?.isActive && (
                    <div className="aparte-box" style={{ 
                        flex: 1,
                        background: `${textColor}1A`, 
                        border: `2px solid ${textColor}4D`,
                        borderRadius: '32px',
                        padding: '3rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(16px)',
                        boxShadow: `0 20px 50px ${textColor}1A`,
                        animation: 'slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                      <div style={{ color: textColor, opacity: 0.7, fontSize: '1.8rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>Aparteador</div>
                      <div style={{ color: textColor, fontSize: '3.5rem', fontWeight: '800', marginBottom: '1rem', textAlign: 'center', lineHeight: '1.2' }}>
                        {sessionState.aparte.aparteador || 'Aguardando seleção...'}
                      </div>
                      <div style={{ color: textColor, fontSize: '8rem', fontWeight: '800', fontVariantNumeric: 'tabular-nums', fontFamily: 'Outfit', lineHeight: '1' }}>
                        {formatTime(displayAparteSeconds)}
                      </div>
                    </div>
                 )}
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
