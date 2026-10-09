import bcrypt from "bcryptjs";
import { DataTypes, Op } from "sequelize";
import { sequelize } from "../config/baseDados.js";

export const Utilizador = sequelize.define("utilizadores", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nome_utilizador: { type: DataTypes.STRING(80), allowNull: false, unique: true },
  nome: { type: DataTypes.STRING(200), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false },
  senha_hash: { type: DataTypes.STRING(255), allowNull: false },
  tipo: { type: DataTypes.STRING(40), allowNull: false, defaultValue: "admin" },
  perfil: { type: DataTypes.STRING(40), allowNull: true },
  telefone: { type: DataTypes.STRING(30), allowNull: true },
  zona_id: { type: DataTypes.STRING(64), allowNull: true },
  estado: { type: DataTypes.STRING(40), allowNull: false, defaultValue: "Ativo" },
  observacoes: { type: DataTypes.TEXT, allowNull: true },
  foto_perfil: { type: DataTypes.TEXT, allowNull: true },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: "utilizadores",
  freezeTableName: true,
  timestamps: true,
  createdAt: "criado_em",
  updatedAt: "atualizado_em",
});

export const semearAdmin = async () => {
  await Utilizador.sync({ alter: true });
  const existe = await Utilizador.findOne({
    where: { [Op.or]: [{ nome_utilizador: "Admin" }, { email: "admin@microcredito.local" }] },
  });
  if (existe) {
    if (!existe.perfil) {
      existe.perfil = "Administrador";
      existe.estado = existe.activo ? "Ativo" : "Inativo";
      await existe.save();
    }
    return existe;
  }
  return Utilizador.create({
    nome_utilizador: "Admin",
    nome: "Admin",
    email: "admin@microcredito.local",
    // Em produção defina ADMIN_SENHA_INICIAL; a senha deve ser trocada no primeiro acesso.
    senha_hash: await bcrypt.hash(process.env.ADMIN_SENHA_INICIAL || "Senha@123", 10),
    tipo: "admin",
    perfil: "Administrador",
    estado: "Ativo",
    activo: true,
  });
};

export const semearAdminTeste = async () => {
  const existe = await Utilizador.findOne({
    where: { [Op.or]: [{ nome_utilizador: "admin.teste" }, { email: "admin.teste@microcredito.local" }] },
  });
  if (existe) return existe;
  return Utilizador.create({
    nome_utilizador: "admin.teste",
    nome: "Admin Teste",
    email: "admin.teste@microcredito.local",
    senha_hash: await bcrypt.hash("Teste@123", 10),
    tipo: "admin",
    perfil: "Administrador",
    estado: "Ativo",
    activo: true,
    observacoes: "Conta fictícia apenas para testes de entrada.",
  });
};
