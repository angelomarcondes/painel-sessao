import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ControlPanel from './pages/ControlPanel';
import DisplayPanel from './pages/DisplayPanel';
import Ajustes from './pages/Ajustes';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/controle" element={<ControlPanel />} />
        <Route path="/ajustes" element={<Ajustes />} />
        <Route path="/painel" element={<DisplayPanel />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
