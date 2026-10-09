// src/components/CotacoesLayout.jsx
import React from 'react';

function CotacoesLayout({ children, title, subtitle }) {
  return (
    <div className="page-container crm-cotacoes-page bg-white p-1 sm:p-2 md:p-3">
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-700 text-sm sm:text-base md:text-lg">{subtitle}</p>
        </div>
        <div className="relative z-10 bg-white rounded-lg pointer-events-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export default CotacoesLayout;