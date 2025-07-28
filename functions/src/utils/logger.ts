import { logger as functionsLogger } from "firebase-functions";
import chalk from "chalk";

// 実行環境の判定
const isProd = process.env.NODE_ENV === "production";

// 色付きログ（開発用）
const devLogger = {
  info: (...args: unknown[]) => console.log(chalk.blue("[INFO]"), ...args),
  success: (...args: unknown[]) =>
    console.log(chalk.green("[SUCCESS]"), ...args),
  warn: (...args: unknown[]) => console.warn(chalk.yellow("[WARN]"), ...args),
  error: (...args: unknown[]) => console.error(chalk.red("[ERROR]"), ...args),
  debug: (...args: unknown[]) => console.log(chalk.gray("[DEBUG]"), ...args),
};

// Firebase ログ（本番用）
const prodLogger = {
  info: (...args: unknown[]) => functionsLogger.info(...args),
  success: (...args: unknown[]) => functionsLogger.info(...args),
  warn: (...args: unknown[]) => functionsLogger.warn(...args),
  error: (...args: unknown[]) => functionsLogger.error(...args),
  debug: (...args: unknown[]) => functionsLogger.debug(...args),
};

// 自動で切り替え
export const logger = isProd ? prodLogger : devLogger;
