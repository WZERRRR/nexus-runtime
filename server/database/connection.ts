import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let mysqlPool: mysql.Pool | null = null;
let betterDb: any = null;
export let isMySQL = false;

let connectionPromise: Promise<any> | null = null;

export async function getConnection() {
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    if (process.env.DB_HOST) {
      if (!mysqlPool) {
        console.log('[Runtime DB] Initializing MySQL connection pool...');
        isMySQL = true;
        mysqlPool = mysql.createPool({
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME || 'nexus_runtime',
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        });
      }
      return mysqlPool;
    } else {
      if (!betterDb) {
        console.warn('[Runtime DB] MySQL credentials not found. Falling back to better-sqlite3 (compatible binary)...');
        isMySQL = false;
        
        const dbDir = path.join(process.cwd(), 'runtime', 'data');
        if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

        const dbPath = path.join(dbDir, 'nexus_runtime_v2.db');
        const db = new Database(dbPath);
        db.pragma('journal_mode = WAL');

        // Async Wrapper to maintain compatibility with existing code
        betterDb = {
          exec: async (sql: string) => db.exec(sql),
          get: async (sql: string, params: any[] = []) => db.prepare(sql).get(...params),
          all: async (sql: string, params: any[] = []) => db.prepare(sql).all(...params),
          run: async (sql: string, params: any[] = []) => db.prepare(sql).run(...params),
          prepare: (sql: string) => db.prepare(sql),
          close: async () => {
            db.close();
            betterDb = null;
            connectionPromise = null;
          },
          native: db
        };
      }
      return betterDb;
    }
  })();

  return connectionPromise;
}
