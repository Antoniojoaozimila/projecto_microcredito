import React from 'react';
import { CheckCircle, Clock, XCircle, AlertCircle, FileCheck } from 'lucide-react';
import { getCotacaoStatusLabel, getCotacaoStatusClasses } from '../../utils/cotacaoStatus';

const STATUS_ICONS = {
  finalizada: CheckCircle,
  pendente: Clock,
  cancelada: XCircle,
  expirada: AlertCircle,
  ativa: FileCheck,
  aprovada: CheckCircle,
};

const CotacaoStatusBadge = ({ status, className = '' }) => {
  const Icon = STATUS_ICONS[status] || Clock;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${getCotacaoStatusClasses(status)} ${className}`}
    >
      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      {getCotacaoStatusLabel(status)}
    </span>
  );
};

export default CotacaoStatusBadge;
