import React, { useContext, useEffect } from 'react';
import Sidebar from '../layout/Sidebar/Sidebar';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { Outlet } from 'react-router-dom';
import { SidebarContext } from '../context/sidebarContext';
import '../App.css';
import './Dashboard.css';

function Dashboard() {
  const { isSidebarCollapsed } = useContext(SidebarContext);

  useEffect(() => {
    document.body.classList.add('dashboard-active');
    return () => document.body.classList.remove('dashboard-active');
  }, []);

  return (
    <div className={`app dashboard-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Header />
      <Sidebar />
      <main className="dashboard-main">
        <div className="dashboard-content">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Dashboard;
