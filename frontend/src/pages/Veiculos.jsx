import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiTruck, FiClock, FiTool, FiPlus, FiRefreshCw } from 'react-icons/fi';
import './Veiculos.css';

// Dados mockados para simulação
const veiculosExemplo = [
  { id: 1, placa: 'ABC-1234', modelo: 'Toyota Hilux', status: 'Ativo' },
  { id: 2, placa: 'DEF-5678', modelo: 'Volkswagen Polo', status: 'Manutenção' },
  { id: 3, placa: 'GHI-9012', modelo: 'Ford Ranger', status: 'Ativo' }
];

const Veiculos = () => {
  const [carregando, setCarregando] = useState(true);
  const [veiculos, setVeiculos] = useState([]);

  // Efeito para carregar dados iniciais
  useEffect(() => {
    setCarregando(true);
    setTimeout(() => {
      setVeiculos(veiculosExemplo);
      setCarregando(false);
    }, 1200);
  }, []);

  if (carregando) {
    return (
      <div className="carregando">
        <FiRefreshCw className="icon-spin" />
        <p>Carregando dados dos veículos...</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="coming-soon-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="coming-soon-content">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
          className="gear-icon large"
        >
          <FiTool />
        </motion.div>
        
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="title-container"
        >
          <FiTruck className="section-icon" />
          <h1>Gestão de Veículos</h1>
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="description"
        >
          Esta seção está em desenvolvimento e estará disponível em breve.
        </motion.p>
        
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="features-grid"
        >
          <div className="feature-card">
            <div className="feature-icon">
              <FiPlus />
            </div>
            <h3>Cadastro Completo</h3>
            <p>Registro detalhado de todos os veículos da frota</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <FiClock />
            </div>
            <h3>Histórico de Manutenção</h3>
            <p>Acompanhamento de serviços e reparos</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Veiculos;