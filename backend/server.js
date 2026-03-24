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

// Estado em memória
let sessionState = {
  institutionName: 'Câmara Municipal de Carneirinho - MG', // Default solicitado
  logoUrl: '',
  bgColor: '#000000',
  textColor: '#ffffff',
  audioUrl: '',
  activeSpeaker: null, // nome do orador
  timer: {
    duration: 300, // em segundos (ex: 5 minutos)
    remaining: 300,
    isRunning: false,
    updatedAt: Date.now()
  },
  phase: 'Pequeno Expediente', // Fase da sessão
};

io.on('connection', (socket) => {
  console.log('🔗 Cliente conectado:', socket.id);

  // Envia o estado atual assim que conecta
  socket.emit('state_update', sessionState);

  // Recebe atualizações do Painel de Controle
  socket.on('control_update', (newState) => {
    sessionState = { ...sessionState, ...newState };
    // Repassa para todos os clientes (incluindo a Tela de Exibição)
    io.emit('state_update', sessionState);
  });

  // Operações específicas do cronômetro para garantir precisão
  socket.on('start_timer', () => {
    sessionState.timer.isRunning = true;
    sessionState.timer.updatedAt = Date.now();
    io.emit('state_update', sessionState);
  });

  socket.on('pause_timer', (remaining) => {
    sessionState.timer.isRunning = false;
    sessionState.timer.remaining = remaining;
    io.emit('state_update', sessionState);
  });

  socket.on('reset_timer', (duration) => {
    sessionState.timer.isRunning = false;
    sessionState.timer.duration = duration;
    sessionState.timer.remaining = duration;
    io.emit('state_update', sessionState);
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
