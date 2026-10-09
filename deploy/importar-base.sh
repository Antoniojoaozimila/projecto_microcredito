#!/bin/sh
# Importa um dump .sql (exportado no Workbench) para o MySQL do Docker.
# Uso, na VPS, na pasta do projecto:
#   sh deploy/importar-base.sh /caminho/para/microcredito.sql
set -eu

DUMP="${1:-}"
if [ ! -f "$DUMP" ]; then
  echo "Indique o ficheiro .sql exportado no Workbench."
  echo "Exemplo: sh deploy/importar-base.sh /root/microcredito.sql"
  exit 1
fi

if [ -z "${DB_SENHA:-}" ]; then
  echo "Defina DB_SENHA (a mesma do Docker Manager) antes de correr este script."
  echo "Exemplo: DB_SENHA='a-sua-senha' sh deploy/importar-base.sh /root/microcredito.sql"
  exit 1
fi

DB_NOME="${DB_NOME:-microcredito}"

echo "A importar $DUMP para a base $DB_NOME..."
docker compose exec -T mysql mysql -uroot -p"$DB_SENHA" "$DB_NOME" < "$DUMP"
echo "Importação concluída."
