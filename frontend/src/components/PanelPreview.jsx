import React, { useEffect, useState, useRef } from 'react';
import { Tv } from 'lucide-react';

export default function PanelPreview({ sessionState }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [displayAparteSeconds, setDisplayAparteSeconds] = useState(0);
  const [silenceRemaining, setSilenceRemaining] = useState(61);
  const [silenceFadeOpacity, setSilenceFadeOpacity] = useState(1);
  const [isSilenceZero, setIsSilenceZero] = useState(false);
  const [timeZeroAt, setTimeZeroAt] = useState(null);

  const screenWrapperRef = useRef(null);
  const [scale, setScale] = useState(0.35);
  const requestRef = useRef();

  const previousSecondsRef = useRef(0);
  const prevIsRunningRef = useRef(false);

  // Relógio do sistema
  useEffect(() => {
    const int = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(int);
  }, []);

  // Responsividade: cálculo dinâmico da escala 1920x1080 proporcional à largura e altura disponíveis
  useEffect(() => {
    if (!screenWrapperRef.current) return;
    const updateScale = () => {
      if (screenWrapperRef.current) {
        const w = screenWrapperRef.current.clientWidth;
        const h = screenWrapperRef.current.clientHeight;
        if (w > 0 && h > 0) {
          setScale(Math.min(w / 1920, h / 1080));
        } else if (w > 0) {
          setScale(w / 1920);
        }
      }
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(screenWrapperRef.current);
    return () => ro.disconnect();
  }, []);

  // Sincronização direta de mudanças quando o contador não estiver rodando
  useEffect(() => {
    if (!sessionState?.timer?.isRunning) {
      setDisplaySeconds(sessionState?.timer?.remaining || 0);
    }
    if (sessionState?.timer?.remaining > 0) {
      setTimeZeroAt(null);
    }
  }, [sessionState?.timer?.isRunning, sessionState?.timer?.remaining]);

  // Loop de animação contínuo a 60fps para sincronia perfeita
  useEffect(() => {
    if (!sessionState) return;

    const updateTime = () => {
      // 1. Cronômetro principal
      if (sessionState.timer?.isRunning) {
        const elapsed = (Date.now() - sessionState.timer.updatedAt) / 1000;
        let remaining = Math.max(0, sessionState.timer.remaining - elapsed);
        setDisplaySeconds(remaining);
      } else {
        setDisplaySeconds(sessionState.timer?.remaining || 0);
      }

      // 2. Aparte
      if (sessionState.aparte?.isActive) {
        let elapsedAparte = sessionState.aparte.elapsed || 0;
        if (sessionState.timer?.isRunning && sessionState.aparte.updatedAt) {
          elapsedAparte += (Date.now() - sessionState.aparte.updatedAt) / 1000;
        } else if (sessionState.timer?.isRunning && sessionState.aparte.startedAt) {
          elapsedAparte += (Date.now() - sessionState.aparte.startedAt) / 1000;
        }
        setDisplayAparteSeconds(elapsedAparte);
      } else {
        setDisplayAparteSeconds(0);
      }

      // 3. Minuto de silêncio
      if (sessionState.displayMode === 'silence' && sessionState.silence?.startedAt) {
        const elapsed = (Date.now() - sessionState.silence.startedAt) / 1000;
        const duration = sessionState.silence.duration || 61;
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

  // Alerta visual de 5 segundos piscando quando o tempo zera naturalmente
  useEffect(() => {
    if (sessionState && sessionState.displayMode === 'timer') {
      const wasRunning = prevIsRunningRef.current;
      if (wasRunning && previousSecondsRef.current > 0 && displaySeconds <= 0) {
        if (!sessionState.timer?.manualReset) {
          setTimeZeroAt(Date.now());
        }
      }
    }
    previousSecondsRef.current = displaySeconds;
    if (sessionState?.timer) {
      prevIsRunningRef.current = sessionState.timer.isRunning;
    }
  }, [displaySeconds, sessionState]);

  if (!sessionState) return null;

  const {
    bgColor = '#000000',
    textColor = '#ffffff',
    logoUrl,
    clockFontSize = 20,
    timerFontSize = 18,
    speakerFontSize = 4,
    titleFontSize = 2.5,
    aparteTimerFontSize = 8,
    aparteNameFontSize = 3.5,
    sessionInfo = 'Xª ordinária, dd/mm/aaaa',
    institutionName = 'Câmara Municipal de Carneirinho - MG'
  } = sessionState;

  const formatTime = (totalSeconds) => {
    const min = Math.floor(Math.max(0, totalSeconds) / 60);
    const sec = Math.floor(Math.max(0, totalSeconds) % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const isWarning = displaySeconds > 0 && displaySeconds <= 60;
  const isTimeUpFlashing = timeZeroAt && (Date.now() - timeZeroAt < 5000) && displaySeconds <= 0;

  return (
    <section className="card" style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', padding: '0.85rem 1rem', overflow: 'hidden', boxSizing: 'border-box' }}>
      {/* Header do Monitor de Retorno */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Tv size={17} style={{ color: '#38bdf8' }} />
          <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Retorno do Painel
          </h3>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#ef4444',
            padding: '0.12rem 0.45rem',
            borderRadius: '999px',
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.05em'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', animation: 'livePulse 1.5s infinite' }} />
            AO VIVO
          </span>
        </div>

        <span style={{
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border-color)',
          padding: '0.18rem 0.45rem',
          borderRadius: '6px'
        }}>
          Modo: <strong style={{ color: 'var(--text-main)' }}>
            {sessionState.displayMode === 'clock' ? 'Relógio' : sessionState.displayMode === 'silence' ? 'Minuto de Silêncio' : 'Contador'}
          </strong>
        </span>
      </div>

      {/* Área Flexível para acomodar o monitor 16:9 sem estourar altura */}
      <div
        ref={screenWrapperRef}
        style={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: `${Math.round(1920 * scale)}px`,
            height: `${Math.round(1080 * scale)}px`,
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '8px',
            backgroundColor: bgColor,
            border: '2px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), inset 0 0 15px rgba(0, 0, 0, 0.6)',
            flexShrink: 0
          }}
        >
          <div
            style={{
              width: '1920px',
              height: '1080px',
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              pointerEvents: 'none',
              userSelect: 'none',
              backgroundColor: bgColor,
              color: textColor,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Cabeçalho do Painel */}
            <div className="display-header" style={{ borderBottom: `1px solid ${textColor}33`, background: `linear-gradient(to bottom, ${textColor}1A, transparent)` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div className="brazao-placeholder">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Brasão" style={{ width: '90px', height: '90px', objectFit: 'contain', filter: 'drop-shadow(0px 0px 10px rgba(0,0,0,0.5))' }} />
                  ) : (
                    <div className="logo-circle" style={{ background: textColor, opacity: 0.2 }}></div>
                  )}
                </div>
                <div className="system-title" style={{ textAlign: 'left' }}>
                  <h1 style={{ color: textColor, margin: 0, fontSize: `${titleFontSize}rem` }}>{institutionName}</h1>
                  <h2 style={{ color: textColor, fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>{sessionInfo}</h2>
                </div>
              </div>

              {sessionState.displayMode === 'timer' && (
                <div className="clock-widget" style={{ color: textColor, opacity: 0.6 }}>
                  {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>

            {/* Conteúdo Principal do Painel */}
            <div className="display-main" style={{ flex: 1 }}>
              {sessionState.displayMode === 'clock' ? (
                <div
                  className="huge-clock"
                  style={{
                    color: textColor,
                    fontSize: `${clockFontSize}rem`,
                    fontWeight: 800,
                    fontFamily: 'Outfit',
                    textShadow: `0 10px 40px ${textColor}33`,
                    fontVariantNumeric: 'tabular-nums'
                  }}
                >
                  {currentTime.toLocaleTimeString('pt-BR')}
                </div>
              ) : sessionState.displayMode === 'silence' ? (
                !isSilenceZero ? (
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
                  <div className="speaker-info" style={{ marginBottom: '2.5rem' }}>
                    <h3 style={{ color: textColor, opacity: 0.5 }}>Orador Atual</h3>
                    <div className="speaker-name" style={{ color: textColor, fontSize: `${speakerFontSize}rem` }}>
                      {sessionState.activeSpeaker || "Nenhum orador ativo"}
                    </div>
                    <div 
                      className="session-phase-badge"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: '1.25rem',
                        padding: '0.35rem 1.6rem',
                        borderRadius: '999px',
                        background: `${textColor}0D`,
                        border: `1px solid ${textColor}26`,
                        backdropFilter: 'blur(8px)',
                        color: textColor,
                        opacity: 0.85,
                        fontSize: `${Math.max(1.4, speakerFontSize * 0.5)}rem`,
                        fontWeight: 600,
                        fontFamily: 'Outfit',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        boxShadow: `0 4px 20px ${textColor}0A`
                      }}
                    >
                      {sessionState.phase || "Sessão Plenária"}
                    </div>
                  </div>

                  <div className="timers-wrapper" style={{ display: 'flex', gap: '4rem', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '0 2rem' }}>
                    <div
                      className={`huge-timer ${isTimeUpFlashing ? 'time-up' : ''} ${isWarning ? 'time-warning' : ''}`}
                      style={{
                        color: (isTimeUpFlashing || isWarning) ? '' : textColor,
                        fontSize: `${timerFontSize}rem`,
                        textShadow: `0 10px 40px ${textColor}33`,
                        flex: sessionState.aparte?.isActive ? 1 : 'unset',
                        textAlign: sessionState.aparte?.isActive ? 'right' : 'center'
                      }}
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

            {/* Rodapé do Painel */}
            <div className="display-footer" style={{ borderTop: `1px solid ${textColor}33`, background: `${textColor}0D` }}>
              <div className="status-bar" style={{ color: textColor, opacity: 0.7 }}>
                {sessionState.displayMode === 'clock'
                  ? "Exibindo Hora Local"
                  : sessionState.displayMode === 'silence'
                  ? (isSilenceZero ? "Homenagem Póstuma • Concluindo" : "Minuto de Silêncio em Andamento")
                  : (sessionState.timer?.isRunning ? "Tempo em andamento" : "Temporizador Pausado")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Status Compacta no Rodapé da Coluna Esquerda */}
      <div style={{
        marginTop: '0.5rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.4rem',
        fontSize: '0.78rem',
        flexShrink: 0
      }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem', textTransform: 'uppercase' }}>Modo Ativo</span>
          <strong style={{ color: 'var(--text-main)', fontSize: '0.8rem' }}>
            {sessionState.displayMode === 'clock' ? 'Relógio' : sessionState.displayMode === 'silence' ? 'Silêncio' : 'Contador'}
          </strong>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem', textTransform: 'uppercase' }}>Orador no Painel</span>
          <strong style={{ color: 'var(--text-main)', fontSize: '0.8rem' }} title={sessionState.activeSpeaker || 'Nenhum'}>
            {sessionState.activeSpeaker || 'Nenhum'}
          </strong>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem', textTransform: 'uppercase' }}>Janela Painel</span>
          <strong style={{ color: sessionState.isPanelOpen ? '#10b981' : '#f59e0b', fontSize: '0.8rem' }}>
            {sessionState.isPanelOpen ? '● Aberta' : '○ Fechada'}
          </strong>
        </div>
      </div>
    </section>
  );
}
