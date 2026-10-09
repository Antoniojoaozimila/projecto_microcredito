import { useState, useEffect } from "react";
import { FaUserFriends, FaUsers, FaUser, FaShieldAlt, FaCheckCircle, FaCar } from "react-icons/fa";
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import "./Cards.css";

Chart.register(...registerables);

const Cards = () => {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Atualiza a data e hora em tempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const cardData = [
    { 
      title: "Total Agentes", 
      value: 15, 
      icon: <FaUserFriends className="card-icon" />,
      gradient: "linear-gradient(135deg, #1c1b1b 0%, #106a37 100%)"
    },
    { 
      title: "Agentes Activos", 
      value: 14, 
      icon: <FaUsers className="card-icon" />,
      gradient: "linear-gradient(135deg, #1c1b1b  0%, #106a37 100%)"
    },
    { 
      title: "Total Clientes", 
      value: 54, 
      icon: <FaUser className="card-icon" />,
      gradient: "linear-gradient(135deg, #1c1b1b 0%, #106a37 100%)"
    },
    { 
      title: "Total Seguros", 
      value: 53, 
      icon: <FaShieldAlt className="card-icon" />,
      gradient: "linear-gradient(135deg, #1c1b1b 0%, #106a37 100%)"
    },
    { 
      title: "Seguros Aprovados", 
      value: 40, 
      icon: <FaCheckCircle className="card-icon" />,
      gradient: "linear-gradient(135deg, #1c1b1b 0%, #106a37 100%)"
    },
    { 
      title: "Veículos", 
      value: 40, 
      icon: <FaCar className="card-icon" />,
      gradient: "linear-gradient(135deg, #1c1b1b 0%, #106a37 100%)"
    },
  ];

  // Dados para os gráficos (baseados nos cards)
  const agentsData = {
    labels: ['Agentes Totais', 'Agentes Ativos'],
    datasets: [
      {
        label: 'Agentes',
        data: [15, 14],
        backgroundColor: ['#1c1b1b', '#106a37'],
        borderColor: ['#fff', '#fff'],
        borderWidth: 1,
      },
    ],
  };

  const clientsData = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    datasets: [
      {
        label: 'Novos Clientes',
        data: [5, 8, 10, 7, 12, 12],
        backgroundColor: '#1c1b1b',
        borderColor: '#106a37',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const insuranceData = {
    labels: ['Seguros Totais', 'Aprovados', 'Em Análise'],
    datasets: [
      {
        data: [53, 40, 13],
        backgroundColor: ['#1c1b1b', '#106a37', '#2c3e50'],
        hoverOffset: 4,
      },
    ],
  };

  return (
    <div className="dashboard-container">
      {/* Cabeçalho */}
      <div className="welcome-header">
        <h2>Bem-vindo ao Dashboard do Administrador</h2>
        <div className="header-divider"></div>
      </div>
      
      {/* Cards */}
      <div className="compact-cards-grid">
        {cardData.map((card, index) => (
          <div
            className={`compact-card ${hoveredCard === index ? 'hovered' : ''}`}
            key={index}
            style={{ background: card.gradient }}
            onMouseEnter={() => setHoveredCard(index)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="compact-card-content">
              <div className="compact-card-text">
                <p className="card-title">{card.title}</p>
                <h3 className="card-value">{card.value}</h3>
              </div>
              <div className="compact-card-icon">
                {card.icon}
              </div>
            </div>
            <div className="card-wave"></div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="charts-container">
        <div className="chart-wrapper">
          <h3>Estatísticas de Agentes</h3>
          <Bar 
            data={agentsData} 
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
                  labels: {
                    color: '#fff'
                  }
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    color: '#fff'
                  },
                  grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                  }
                },
                x: {
                  ticks: {
                    color: '#fff'
                  },
                  grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                  }
                }
              }
            }}
          />
        </div>
        
        <div className="chart-wrapper">
          <h3>Crescimento de Clientes</h3>
          <Line 
            data={clientsData} 
            options={{
              responsive: true,
              plugins: {
                legend: {
                  labels: {
                    color: '#fff'
                  }
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    color: '#fff'
                  },
                  grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                  }
                },
                x: {
                  ticks: {
                    color: '#fff'
                  },
                  grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                  }
                }
              }
            }}
          />
        </div>
        
        <div className="chart-wrapper">
          <h3>Distribuição de Seguros</h3>
          <Pie 
            data={insuranceData} 
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'right',
                  labels: {
                    color: '#fff'
                  }
                },
              },
            }}
          />
        </div>
      </div>

      {/* Rodapé */}
      <footer className="dashboard-footer">
        <div className="footer-content">
          <p>Imperial Insurance © {currentDateTime.getFullYear()} - Todos os direitos reservados_IMP-PLATAFORM | {currentDateTime.toLocaleDateString()} {currentDateTime.toLocaleTimeString()}</p>
        </div>
      </footer>
    </div>
  );
};

export default Cards;