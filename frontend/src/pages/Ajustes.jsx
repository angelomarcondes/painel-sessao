import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Settings, ArrowLeft, Lock, Eye, EyeOff, Save, CheckCircle, Clock } from 'lucide-react';

export default function Ajustes() {
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [sessionState, setSessionState] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Estados dos formulários de ajustes
  const [institutionName, setInstitutionName] = useState('Câmara Municipal de Carneirinho - MG');
  const [sessionInfo, setSessionInfo] = useState('Xª ordinária, dd/mm/aaaa');
  const [inactivityTimeout, setInactivityTimeout] = useState(0);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [bgColor, setBgColor] = useState('#000000');
  const [textColor, setTextColor] = useState('#ffffff');
  const [logoUrl, setLogoUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [silenceAudioUrl, setSilenceAudioUrl] = useState('');
  const [speakerList, setSpeakerList] = useState('');
  const [phaseList, setPhaseList] = useState('Expediente\nOrdem do dia');

  // Tamanhos de fonte
  const [clockFontSize, setClockFontSize] = useState(20);
  const [timerFontSize, setTimerFontSize] = useState(18);
  const [speakerFontSize, setSpeakerFontSize] = useState(4);
  const [titleFontSize, setTitleFontSize] = useState(2.5);
  const [aparteTimerFontSize, setAparteTimerFontSize] = useState(8);
  const [aparteNameFontSize, setAparteNameFontSize] = useState(3.5);

  useEffect(() => {
    const isAuth = localStorage.getItem('auth_token');
    if (!isAuth) {
      navigate('/login');
      return;
    }

    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('state_update', (state) => {
      setSessionState(state);
      setInstitutionName(state.institutionName || '');
      setSessionInfo(state.sessionInfo || 'Xª ordinária, dd/mm/aaaa');
      setInactivityTimeout(state.inactivityTimeout !== undefined ? state.inactivityTimeout : 0);
      setBgColor(state.bgColor || '#000000');
      setTextColor(state.textColor || '#ffffff');
      setLogoUrl(state.logoUrl || '');
      setAudioUrl(state.audioUrl || '');
      setSilenceAudioUrl(state.silenceAudioUrl || '');
      setSpeakerList(state.speakerList || '');
      setPhaseList(state.phaseList || 'Expediente\nOrdem do dia');
      setClockFontSize(state.clockFontSize || 20);
      setTimerFontSize(state.timerFontSize || 18);
      setSpeakerFontSize(state.speakerFontSize || 4);
      setTitleFontSize(state.titleFontSize || 2.5);
      setAparteTimerFontSize(state.aparteTimerFontSize || 8);
      setAparteNameFontSize(state.aparteNameFontSize || 3.5);

      if (state.logoUrl) {
        let icon = document.getElementById("favicon");
        if (icon) icon.href = state.logoUrl;
      }
      if (state.institutionName) {
        document.title = `Ajustes - ${state.institutionName}`;
      }
    });

    return () => newSocket.close();
  }, [navigate]);

  if (!sessionState) {
    return (
      <div className="loading" style={{ color: 'white', background: '#0f172a', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Conectando ao servidor...
      </div>
    );
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
        if (type === 'logo') setLogoUrl(data.url);
        if (type === 'audio') setAudioUrl(data.url);
        if (type === 'silenceAudio') setSilenceAudioUrl(data.url);

        const key = type === 'logo' ? 'logoUrl' : (type === 'silenceAudio' ? 'silenceAudioUrl' : 'audioUrl');
        socket.emit('control_update', {
          [key]: data.url
        });
      }
    } catch (err) {
      console.error("Erro no upload", err);
      alert("Erro ao enviar arquivo para o servidor.");
    }
  };

  const handleUpdateSettings = (e) => {
    e.preventDefault();
    const updatePayload = {
      institutionName,
      sessionInfo,
      inactivityTimeout: Math.max(0, parseInt(inactivityTimeout, 10) || 0),
      bgColor,
      textColor,
      logoUrl,
      audioUrl,
      silenceAudioUrl,
      speakerList,
      phaseList,
      clockFontSize,
      timerFontSize,
      speakerFontSize,
      titleFontSize,
      aparteTimerFontSize,
      aparteNameFontSize
    };

    const hasNewPassword = Boolean(newPassword && newPassword.trim().length > 0);
    if (hasNewPassword) {
      updatePayload.newPassword = newPassword.trim();
    }

    socket.emit('control_update', updatePayload);

    setSaveSuccess(true);
    if (hasNewPassword) {
      setNewPassword('');
    }
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  return (
    <div className="ajustes-container">
      <header className="control-header" style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => navigate('/controle')}
            className="btn-secondary"
            style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}
            title="Voltar para a tela de controle"
          >
            <ArrowLeft size={18} /> Voltar ao Controle
          </button>
          <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={20} /> Ajustes e Configurações
          </h2>
        </div>

        <button
          onClick={() => { localStorage.removeItem('auth_token'); navigate('/login'); }}
          className="btn-ghost"
          style={{ padding: '0.4rem 1rem' }}
        >
          Sair
        </button>
      </header>

      <main style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
        {saveSuccess && (
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#10b981',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 500
          }}>
            <CheckCircle size={18} /> Configurações salvas com sucesso!
          </div>
        )}

        <section className="card" style={{ padding: '1.5rem' }}>
          <form onSubmit={handleUpdateSettings} className="config-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

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
              <label>Dados da Sessão</label>
              <input
                type="text"
                value={sessionInfo}
                onChange={(e) => setSessionInfo(e.target.value)}
                placeholder="Xª ordinária, dd/mm/aaaa"
              />
            </div>

            <div className="input-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} /> Tempo de Inatividade do Contador (em minutos)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={inactivityTimeout}
                onChange={(e) => {
                  const val = e.target.value;
                  setInactivityTimeout(val === '' ? '' : Math.max(0, parseInt(val, 10) || 0));
                }}
                placeholder="0 para desativar"
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                Tempo sem atividade no contador para retornar automaticamente ao relógio (defina em minutos inteiros; 0 desativa o retorno automático).
              </small>
            </div>

            <div className="input-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={16} /> Senha de Acesso do Operador
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Deixe em branco para manter a senha atual"
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    padding: '0.4rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={showPassword ? "Ocultar senha" : "Ver senha"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                Para alterar a senha de login do operador, digite a nova senha acima e clique em "Salvar Configurações".
              </small>
            </div>

            <div className="input-group">
              <label>Lista de Oradores (Um nome por linha)</label>
              <textarea
                rows="4"
                value={speakerList}
                onChange={(e) => setSpeakerList(e.target.value)}
                placeholder="Ver. João&#10;Ver. Maria"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.6)', color: 'white', border: '1px solid var(--border-color)' }}
              />
            </div>

            <div className="input-group">
              <label>Lista de Fases da Sessão (Uma fase por linha)</label>
              <textarea
                rows="3"
                value={phaseList}
                onChange={(e) => setPhaseList(e.target.value)}
                placeholder="Expediente&#10;Ordem do dia"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.6)', color: 'white', border: '1px solid var(--border-color)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Cor de Fundo (Painel)</label>
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{ padding: '0 0.5rem', height: '40px' }} />
              </div>

              <div className="input-group" style={{ flex: 1 }}>
                <label>Cor do Texto</label>
                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} style={{ padding: '0 0.5rem', height: '40px' }} />
              </div>
            </div>

            <h4 style={{ marginTop: '0.5rem', marginBottom: '0.25rem', fontSize: '1.1rem', color: 'var(--text-main)', textAlign: 'left' }}>Tamanho dos Textos</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ color: 'var(--text-main)' }}>Relógio ({clockFontSize}rem)</label>
                <input type="range" min="10" max="40" step="1" value={clockFontSize} onChange={(e) => setClockFontSize(Number(e.target.value))} style={{ padding: 0, height: 'auto', background: 'transparent' }} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ color: 'var(--text-main)' }}>Contador ({timerFontSize}rem)</label>
                <input type="range" min="8" max="30" step="1" value={timerFontSize} onChange={(e) => setTimerFontSize(Number(e.target.value))} style={{ padding: 0, height: 'auto', background: 'transparent' }} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ color: 'var(--text-main)' }}>Orador Atual ({speakerFontSize}rem)</label>
                <input type="range" min="2" max="10" step="0.5" value={speakerFontSize} onChange={(e) => setSpeakerFontSize(Number(e.target.value))} style={{ padding: 0, height: 'auto', background: 'transparent' }} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ color: 'var(--text-main)' }}>Nome da Câmara ({titleFontSize}rem)</label>
                <input type="range" min="1" max="8" step="0.5" value={titleFontSize} onChange={(e) => setTitleFontSize(Number(e.target.value))} style={{ padding: 0, height: 'auto', background: 'transparent' }} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ color: 'var(--text-main)' }}>Tempo Aparteante ({aparteTimerFontSize}rem)</label>
                <input type="range" min="2" max="15" step="0.5" value={aparteTimerFontSize} onChange={(e) => setAparteTimerFontSize(Number(e.target.value))} style={{ padding: 0, height: 'auto', background: 'transparent' }} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ color: 'var(--text-main)' }}>Nome Aparteante ({aparteNameFontSize}rem)</label>
                <input type="range" min="1" max="8" step="0.5" value={aparteNameFontSize} onChange={(e) => setAparteNameFontSize(Number(e.target.value))} style={{ padding: 0, height: 'auto', background: 'transparent' }} />
              </div>
            </div>

            <div className="input-group">
              <label>Logo / Brasão (Imagem)</label>
              <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
              {logoUrl && <small style={{ color: '#10b981' }}>✔ Imagem carregada com sucesso!</small>}
            </div>

            <div className="input-group">
              <label>Alarme de Fim de Tempo do Cronômetro (Áudio)</label>
              <input type="file" accept="audio/*" onChange={(e) => handleFileUpload(e, 'audio')} />
              {audioUrl && <small style={{ color: '#10b981' }}>✔ Áudio do alarme do cronômetro carregado com sucesso!</small>}
            </div>

            <div className="input-group">
              <label>Aviso Sonoro do Minuto de Silêncio (Áudio)</label>
              <input type="file" accept="audio/*" onChange={(e) => handleFileUpload(e, 'silenceAudio')} />
              {silenceAudioUrl && <small style={{ color: '#10b981' }}>✔ Áudio do minuto de silêncio carregado com sucesso!</small>}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.85rem' }}>
                <Save size={18} /> Salvar Configurações
              </button>
              <button type="button" onClick={() => navigate('/controle')} className="btn-secondary" style={{ padding: '0.85rem 1.5rem' }}>
                Voltar
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
