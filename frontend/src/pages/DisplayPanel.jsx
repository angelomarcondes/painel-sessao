import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { Maximize, Minimize } from 'lucide-react';

export default function DisplayPanel() {
  const [sessionState, setSessionState] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  
  // Timer visual sync local state
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [displayAparteSeconds, setDisplayAparteSeconds] = useState(0);
  const [silenceRemaining, setSilenceRemaining] = useState(60);
  const [silenceFadeOpacity, setSilenceFadeOpacity] = useState(1);
  const [isSilenceZero, setIsSilenceZero] = useState(false);
  
  const requestRef = useRef();
  const audioRef = useRef(null);
  
  const previousSecondsRef = useRef(0);
  const prevIsRunningRef = useRef(false);
  const [timeZeroAt, setTimeZeroAt] = useState(null);

  // Relógio do sistema global
  useEffect(() => {
    const int = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(int);
  }, []);

  // Sincronização do estado de Tela Cheia com eventos do navegador
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.log(`Erro ao entrar em fullscreen: ${err.message}`);
        });
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.log(`Erro ao sair de fullscreen: ${err.message}`);
        });
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

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

    newSocket.on('close_panel', () => {
      window.close();
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
        let elapsedAparte = sessionState.aparte.elapsed || 0;
        if (sessionState.timer.isRunning && sessionState.aparte.updatedAt) {
          elapsedAparte += (Date.now() - sessionState.aparte.updatedAt) / 1000;
        } else if (sessionState.timer.isRunning && sessionState.aparte.startedAt) {
          elapsedAparte += (Date.now() - sessionState.aparte.startedAt) / 1000;
        }
        setDisplayAparteSeconds(elapsedAparte);
      } else {
        setDisplayAparteSeconds(0);
      }

      if (sessionState.displayMode === 'silence' && sessionState.silence?.startedAt) {
        const elapsed = (Date.now() - sessionState.silence.startedAt) / 1000;
        const duration = sessionState.silence.duration || 60;
        const fadeDuration = sessionState.silence.fadeDuration || 30;

        if (elapsed < duration) {
          setSilenceRemaining(Math.max(0, duration - elapsed));
          setIsSilenceZero(false);
          setSilenceFadeOpacity(1);
        } else if (elapsed < duration + fadeDuration) {
          setSilenceRemaining(0);
          setIsSilenceZero(true);
          const fadeElapsed = elapsed - duration;
          const opacity = Math.max(0, 1 - (fadeElapsed / fadeDuration));
          setSilenceFadeOpacity(opacity);
        } else {
          setSilenceRemaining(0);
          setIsSilenceZero(true);
          setSilenceFadeOpacity(0);
        }
      }
      
      requestRef.current = requestAnimationFrame(updateTime);
    };

    requestRef.current = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(requestRef.current);
  }, [sessionState]);

  // DISPARO SEGURO DO AUDIO E DO EFEITO PISCANTE
  useEffect(() => {
    if (sessionState && sessionState.displayMode === 'timer') {
       const wasRunning = prevIsRunningRef.current;
       if (wasRunning && previousSecondsRef.current > 0 && displaySeconds <= 0) {
          if (!sessionState.timer.manualReset) {
            setTimeZeroAt(Date.now()); // Acende o cromômetro visual de 5 segundos do Vermelho
            
            if (audioRef.current && sessionState.audioUrl) {
               audioRef.current.play().catch(e => console.log('Bloqueado pelo chrome', e));
            }
          }
       }
    }
    
    // Rastreador matemático guardando o frame para a próxima rodada do Effect
    previousSecondsRef.current = displaySeconds;
    if (sessionState?.timer) {
       prevIsRunningRef.current = sessionState.timer.isRunning;
    }
  }, [displaySeconds, sessionState]);

  if (!sessionState) {
    return <div className="display-loading" style={{color: 'white', background: 'black', height: '100vh', display: 'flex', alignItems:'center', justifyContent: 'center'}}>Aguardando conexão com a mesa operadora...</div>;
  }

  const { bgColor, textColor, logoUrl, audioUrl, clockFontSize = 20, timerFontSize = 18, speakerFontSize = 4, titleFontSize = 2.5, aparteTimerFontSize = 8, aparteNameFontSize = 3.5 } = sessionState;
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

      <button
        type="button"
        className="fullscreen-toggle-btn"
        onClick={toggleFullscreen}
        title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
        aria-label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
        style={{ color: textColor, borderColor: `${textColor}33` }}
      >
        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
      </button>

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
             <h2 style={{color: textColor, fontWeight: 'bold', margin: '0.5rem 0 0 0'}}>{sessionState.sessionInfo || "Xª ordinária, dd/mm/aaaa"}</h2>
             {sessionState.displayMode !== 'clock' && sessionState.displayMode !== 'silence' && (
                 <h2 style={{color: textColor, opacity: 0.8, marginTop: '0.5rem'}}>{sessionState.phase || "Sessão Plenária"}</h2>
             )}
             {sessionState.displayMode === 'silence' && (
                 <h2 style={{color: textColor, opacity: 0.8, marginTop: '0.5rem'}}>Solenidade Plenária</h2>
             )}
           </div>
         </div>
         
         {sessionState.displayMode === 'timer' && (
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
         ) : sessionState.displayMode === 'silence' ? (
             !isSilenceZero ? (
                /* Durante o 1 minuto: contagem regressiva com MINUTO DE SILÊNCIO na parte superior */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', animation: 'fadeIn 0.5s ease' }}>
                  <div style={{
                    color: textColor,
                    fontSize: `${Math.max(2.5, Math.min(titleFontSize * 1.5, 4.5))}rem`,
                    fontWeight: 800,
                    fontFamily: 'Outfit',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    marginBottom: '2rem',
                    textAlign: 'center',
                    textShadow: `0 4px 30px ${textColor}33`,
                    opacity: 0.95
                  }}>
                    MINUTO DE SILÊNCIO
                  </div>
                  <div 
                    className="huge-timer" 
                    style={{ 
                      color: textColor, 
                      fontSize: `${timerFontSize}rem`, 
                      textShadow: `0 10px 40px ${textColor}33`,
                      animation: 'none'
                    }}
                  >
                    {formatTime(silenceRemaining)}
                  </div>
                </div>
             ) : (
                /* Quando o tempo zerar: MINUTO DE SILÊNCIO ocupa o lugar do relógio e vai esmaecendo ao longo dos 30s */
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', animation: 'fadeIn 0.4s ease' }}>
                  <div style={{
                    color: textColor,
                    fontSize: `${Math.min(clockFontSize, 8.5)}rem`,
                    fontWeight: 800,
                    fontFamily: 'Outfit',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    lineHeight: 1.1,
                    padding: '0 2rem',
                    textShadow: `0 10px 50px ${textColor}4D`,
                    opacity: silenceFadeOpacity,
                    transition: 'opacity 0.25s linear'
                  }}>
                    MINUTO DE SILÊNCIO
                  </div>
                </div>
             )
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
                      <div style={{ color: textColor, opacity: 0.7, fontSize: '1.8rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>Aparteante</div>
                      <div style={{ color: textColor, fontSize: `${aparteNameFontSize}rem`, fontWeight: '800', marginBottom: '1rem', textAlign: 'center', lineHeight: '1.2' }}>
                        {sessionState.aparte.aparteante || 'Aguardando seleção...'}
                      </div>
                      <div style={{ color: textColor, fontSize: `${aparteTimerFontSize}rem`, fontWeight: '800', fontVariantNumeric: 'tabular-nums', fontFamily: 'Outfit', lineHeight: '1' }}>
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
                : sessionState.displayMode === 'silence'
                ? (isSilenceZero ? "Homenagem Póstuma • Concluindo" : "Minuto de Silêncio em Andamento")
                : (sessionState.timer.isRunning ? "Tempo em andamento" : "Temporizador Pausado")}
         </div>
      </div>
    </div>
  );
}
