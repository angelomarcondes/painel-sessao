const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Servindo arquivos estáticos de upload
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', express.static(uploadsDir));

// Configuração do Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Em produção, configure para o domínio de origem
    methods: ["GET", "POST"]
  }
});

// Pasta de dados persistentes
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
const settingsFile = path.join(dataDir, 'settings.json');

// Estado em memória
let sessionState = {
  institutionName: 'Câmara Municipal de Carneirinho - MG', // Default solicitado
  logoUrl: '/uploads/brasao.png',
  bgColor: '#000000',
  textColor: '#ffffff',
  audioUrl: '/uploads/alarme.mp3',
  speakerList: '', // lista separada por linha
  phaseList: 'Expediente\nOrdem do dia', // Default solicitado
  displayMode: 'clock', // Abrir primeiro com relógio, como solicitado
  activeSpeaker: '', // nome do orador
  timer: {
    duration: 300, 
    remaining: 300,
    isRunning: false,
    hasStarted: false,
    updatedAt: Date.now()
  },
  aparte: {
    isActive: false,
    aparteador: '',
    startedAt: null
  },
  phase: 'Pequeno Expediente', // Fase da sessão
};

// Tenta carregar configurações persistidas no disco
if (fs.existsSync(settingsFile)) {
  try {
    const savedSettings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    const keysToPersist = ['institutionName', 'logoUrl', 'bgColor', 'textColor', 'audioUrl', 'speakerList', 'phaseList'];
    keysToPersist.forEach(key => {
      if (savedSettings[key] !== undefined) {
        sessionState[key] = savedSettings[key];
      }
    });
  } catch (err) {
    console.error('Erro ao ler settings.json:', err);
  }
}

// Salva as configurações atuais no disco
function saveSettings() {
  const keysToPersist = ['institutionName', 'logoUrl', 'bgColor', 'textColor', 'audioUrl', 'speakerList', 'phaseList'];
  const settingsToSave = {};
  keysToPersist.forEach(key => {
    settingsToSave[key] = sessionState[key];
  });
  
  try {
    fs.writeFileSync(settingsFile, JSON.stringify(settingsToSave, null, 2), 'utf8');
  } catch (err) {
    console.error('Erro ao salvar settings.json:', err);
  }
}

io.on('connection', (socket) => {
  console.log('🔗 Cliente conectado:', socket.id);

  // Envia o estado atual assim que conecta
  socket.emit('state_update', sessionState);

  // Recebe atualizações do Painel de Controle
  socket.on('control_update', (newState) => {
    sessionState = { ...sessionState, ...newState };
    // Salva no disco as novas configurações
    saveSettings();
    // Repassa para todos os clientes (incluindo a Tela de Exibição)
    io.emit('state_update', sessionState);
  });

  // Operações específicas do cronômetro para garantir precisão
  socket.on('start_timer', () => {
    if (sessionState.timer.remaining > 0) {
      sessionState.timer.isRunning = true;
      sessionState.timer.hasStarted = true;
      sessionState.timer.updatedAt = Date.now();
      io.emit('state_update', sessionState);
    }
  });

  socket.on('pause_timer', (remaining) => {
    sessionState.timer.isRunning = false;
    sessionState.timer.remaining = remaining;
    if (remaining <= 0) {
      sessionState.timer.hasStarted = false;
    }
    io.emit('state_update', sessionState);
  });

  socket.on('add_time', (duration) => {
    if (sessionState.timer.isRunning) {
      const elapsed = (Date.now() - sessionState.timer.updatedAt) / 1000;
      sessionState.timer.remaining = Math.max(0, sessionState.timer.remaining - elapsed) + duration;
      sessionState.timer.updatedAt = Date.now();
    } else {
      sessionState.timer.remaining += duration;
    }
    sessionState.timer.duration = sessionState.timer.remaining;
    io.emit('state_update', sessionState);
  });
  
  socket.on('start_aparte', () => {
    if (sessionState.timer.remaining > 0 && sessionState.timer.isRunning) {
      const elapsed = (Date.now() - sessionState.timer.updatedAt) / 1000;
      sessionState.timer.remaining = Math.max(0, sessionState.timer.remaining - elapsed);
      sessionState.timer.isRunning = false;
      
      sessionState.aparte.isActive = true;
      sessionState.aparte.startedAt = Date.now();
      sessionState.aparte.aparteador = '';
      
      io.emit('state_update', sessionState);
    }
  });

  socket.on('stop_aparte', () => {
    if (sessionState.aparte.isActive) {
      sessionState.aparte.isActive = false;
      sessionState.timer.isRunning = true;
      sessionState.timer.updatedAt = Date.now();
      
      io.emit('state_update', sessionState);
    }
  });

  socket.on('update_aparteador', (name) => {
    sessionState.aparte.aparteador = name;
    io.emit('state_update', sessionState);
  });

  // Substitui a troca no front por troca no backend, assim garantimos o zeramento global
  socket.on('toggle_mode', () => {
    sessionState.displayMode = sessionState.displayMode === 'timer' ? 'clock' : 'timer';
    
    // Zera o cronometro ao entrar no modo timer, como solicitado
    if (sessionState.displayMode === 'timer') {
      sessionState.timer.remaining = 0;
      sessionState.timer.duration = 0;
      sessionState.timer.isRunning = false;
      sessionState.timer.hasStarted = false;
    }
    
    io.emit('state_update', sessionState);
  });

  socket.on('request_fullscreen', () => {
    io.emit('enter_fullscreen');
  });

  socket.on('disconnect', () => {
    console.log('❌ Cliente desconectado:', socket.id);
  });
});

// Autenticação básica (simulada)
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  // Senha mockada para MVP
  if (password === 'admin123') {
    res.json({ success: true, token: 'fake-jwt-token-123' });
  } else {
    res.status(401).json({ success: false, message: 'Senha incorreta' });
  }
});

// Endpoint de Upload para logo e áudio
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado.' });
  }
  // Retorna a URL pública relativa, que será usada no socket
  res.json({ success: true, url: `/uploads/${req.file.filename}` });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
