/** Wrapper de tabela sem card — usa o fundo da página; scroll horizontal só quando necessário */
const DataTableWrapper = ({ children, className = '' }) => (
  <div className={`w-full overflow-x-auto ${className}`}>
    {children}
  </div>
);

export default DataTableWrapper;
