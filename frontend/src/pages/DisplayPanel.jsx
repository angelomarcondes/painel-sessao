import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

export default function DisplayPanel() {
  const [socket, setSocket] = useState(null);
  const [sessionState, setSessionState] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Estado local para o display framerate suave
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const requestRef = useRef();

  // Relógio do sistema (hora atual)
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Conexão Socket.io
  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('state_update', (state) => {
      setSessionState(state);
      if (!state.timer.isRunning) {
         setDisplaySeconds(state.timer.remaining);
      }
    });

    return () => newSocket.close();
  }, []);

  // Loop de animação para garantir que o temporizador diminua de forma fluida sem depender 100% da rede
  useEffect(() => {
    const updateTimerDisplay = () => {
      if (sessionState && sessionState.timer.isRunning) {
        const elapsed = (Date.now() - sessionState.timer.updatedAt) / 1000;
        let remaining = sessionState.timer.remaining - elapsed;
        
        if (remaining <= 0) {
          remaining = 0;
          // Em casos ideais o servidor envia um update pausando, aqui é apenas display visual
        }
        setDisplaySeconds(remaining);
      }
      requestRef.current = requestAnimationFrame(updateTimerDisplay);
    };

    requestRef.current = requestAnimationFrame(updateTimerDisplay);
    return () => cancelAnimationFrame(requestRef.current);
  }, [sessionState]);

  if (!sessionState) {
    return <div className="display-loading">Aguardando conexão com a mesa operadora...</div>;
  }

  // Formatar tempo (MM:SS)
  const formatTime = (totalSeconds) => {
    const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const sec = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  const isTimeUp = displaySeconds <= 0;
  const isWarning = displaySeconds > 0 && displaySeconds <= 60; // Fica amarelo quando falta 1 minuto

  return (
    <div className="display-container">
      <div className="display-header">
         <div className="brazao-placeholder">
           {/* Aqui iria a logo/brazão da câmara */}
           <div className="logo-circle"></div>
         </div>
         <div className="system-title">
           <h1>Câmara Municipal</h1>
           <h2>{sessionState.phase || "Sessão Plenária"}</h2>
         </div>
         <div className="clock-widget">
           {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
         </div>
      </div>

      <div className="display-main">
         <div className="speaker-info">
            <h3>Orador Atual</h3>
            <div className="speaker-name">
              {sessionState.activeSpeaker || "Nenhum orador ativo"}
            </div>
         </div>

         <div className={`huge-timer ${isTimeUp ? 'time-up' : ''} ${isWarning ? 'time-warning' : ''}`}>
           {formatTime(displaySeconds)}
         </div>
      </div>
      
      <div className="display-footer">
         <div className="status-bar">
            {sessionState.timer.isRunning ? "Tempo correndo" : "Temporizador Pausado"}
         </div>
      </div>
    </div>
  );
}
