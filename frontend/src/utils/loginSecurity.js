import { lerConfig } from "../services/configuracoesMicrocredito";

const GUARD_KEY = "microcredito-login-guard";
const EMAIL_MAX = 254;
const NAME_MAX = 120;
const PASSWORD_MAX = 128;
const MAX_ATTEMPTS = 5;
const BASE_LOCK_MS = 2 * 60 * 1000;
const MAX_LOCK_MS = 15 * 60 * 1000;
const MIN_FORM_MS = 2800;

const EMAIL_PATTERN = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/i;

const stripControls = (value) =>
  String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[\u202A-\u202E\u2066-\u2069]/g, "");

export const sanitizeEmail = (value) =>
  stripControls(value).trim().toLowerCase().slice(0, EMAIL_MAX);

export const sanitizePassword = (value) =>
  stripControls(value).slice(0, PASSWORD_MAX);

export const sanitizeFullNameInput = (value) =>
  stripControls(value).replace(/ {2,}/g, " ").slice(0, NAME_MAX);

export const sanitizeFullName = (value) => sanitizeFullNameInput(value).trim();

const NAME_PART = /^[\p{L}][\p{L}'’.-]{1,}$/u;

export const isValidFullName = (value) => {
  const name = sanitizeFullName(value);
  if (!name || name.includes("@")) return false;
  if (/^[\p{L}][\p{L}'’.-]{2,}$/u.test(name)) return true;
  const parts = name.split(" ").filter(Boolean);
  return parts.length >= 2 && parts.every((part) => NAME_PART.test(part));
};

export const isValidEmail = (value) => EMAIL_PATTERN.test(sanitizeEmail(value));

export const isValidPassword = (value) => {
  const password = sanitizePassword(value);
  return password.length >= 1 && password.length <= PASSWORD_MAX;
};

const emptyGuard = () => ({
  fails: 0,
  lockUntil: 0,
  lockLevel: 0,
});

const readGuard = () => {
  try {
    const raw = sessionStorage.getItem(GUARD_KEY);
    if (!raw) return emptyGuard();
    const parsed = JSON.parse(raw);
    return {
      fails: Number(parsed.fails) || 0,
      lockUntil: Number(parsed.lockUntil) || 0,
      lockLevel: Number(parsed.lockLevel) || 0,
    };
  } catch {
    return emptyGuard();
  }
};

const writeGuard = (guard) => {
  try {
    sessionStorage.setItem(GUARD_KEY, JSON.stringify(guard));
  } catch {
    /* ignore quota / private mode */
  }
};

export const getLockRemainingMs = () => {
  const { lockUntil } = readGuard();
  return Math.max(0, lockUntil - Date.now());
};

export const isLoginLocked = () => getLockRemainingMs() > 0;

export const registerLoginFailure = () => {
  const guard = readGuard();
  const fails = guard.fails + 1;
  let lockLevel = guard.lockLevel;
  let lockUntil = 0;

  const limite = Number(lerConfig().max_tentativas_login) || MAX_ATTEMPTS;
  const duration = (Number(lerConfig().bloqueio_minutos) || 30) * 60 * 1000;
  if (fails >= limite) {
    lockLevel += 1;
    lockUntil = Date.now() + duration;
    writeGuard({ fails: 0, lockUntil, lockLevel });
    return { locked: true, remainingMs: duration };
  }

  writeGuard({ fails, lockUntil: 0, lockLevel });
  return { locked: false, remainingMs: 0, failsLeft: limite - fails };
};

export const registerLoginSuccess = () => {
  writeGuard(emptyGuard());
};

export const formatLockTime = (ms) => {
  const total = Math.max(1, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
};

export const wasSubmittedTooFast = (startedAt) =>
  !startedAt || Date.now() - startedAt < MIN_FORM_MS;

export const isHoneypotTriggered = (value) => Boolean(stripControls(value).trim());

export const GENERIC_LOGIN_ERROR =
  "Não foi possível iniciar sessão. Verifique os dados e tente novamente.";

export const LOGIN_LIMITS = { EMAIL_MAX, NAME_MAX, PASSWORD_MAX, MAX_ATTEMPTS, MIN_FORM_MS };
