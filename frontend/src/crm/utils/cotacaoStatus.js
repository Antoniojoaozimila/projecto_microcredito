export const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'finalizada', label: 'Finalizadas' },
  { value: 'ativa', label: 'Ativas' },
  { value: 'aprovada', label: 'Aprovadas' },
  { value: 'expirada', label: 'Expiradas' },
  { value: 'cancelada', label: 'Canceladas' },
];

export const getCotacaoStatusLabel = (status) => {
  const map = {
    pendente: 'Pendente',
    finalizada: 'Finalizada',
    ativa: 'Ativa',
    aprovada: 'Aprovada',
    expirada: 'Expirada',
    cancelada: 'Cancelada',
  };
  return map[status] || status || '—';
};

export const getCotacaoStatusClasses = (status) => {
  switch (status) {
    case 'finalizada':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300 ring-1 ring-emerald-200';
    case 'pendente':
      return 'bg-amber-100 text-amber-800 border-amber-300 ring-1 ring-amber-200';
    case 'ativa':
      return 'bg-green-100 text-green-800 border-green-300 ring-1 ring-green-200';
    case 'aprovada':
      return 'bg-teal-100 text-teal-800 border-teal-300 ring-1 ring-teal-200';
    case 'expirada':
      return 'bg-orange-100 text-orange-800 border-orange-300 ring-1 ring-orange-200';
    case 'cancelada':
      return 'bg-red-100 text-red-800 border-red-300 ring-1 ring-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300 ring-1 ring-gray-200';
  }
};
