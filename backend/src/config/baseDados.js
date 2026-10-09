import mysql from "mysql2/promise";
import { Sequelize } from "sequelize";

const host = process.env.DB_HOST || "127.0.0.1";
const port = Number(process.env.DB_PORTA || 3306);
const user = process.env.DB_UTILIZADOR || "root";
const password = process.env.DB_SENHA ?? "";
const database = process.env.DB_NOME || "microcredito";

export const criarBase = async () => {
  const ligacao = await mysql.createConnection({ host, port, user, password });
  await ligacao.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await ligacao.end();
};

export const sequelize = new Sequelize(database, user, password, {
  host,
  port,
  dialect: "mysql",
  logging: false,
  define: { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
});
