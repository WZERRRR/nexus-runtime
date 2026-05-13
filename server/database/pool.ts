import { getConnection, isMySQL } from './connection.js';

export async function queryDB(sql: string, params: any[] = []): Promise<any[]> {
  const conn = await getConnection();
  if (isMySQL) {
    try {
      const sqliteToMysql = sql.replace(/\\?/g, () => '?');
      const [rows] = await (conn as any).execute(sqliteToMysql, params);
      return rows as any[];
    } catch (e) {
      console.error('[Runtime DB MySQL Error]', e);
      throw e;
    }
  } else {
    try {
      const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
      if (isSelect) {
        return await (conn as any).all(sql, params);
      } else {
        await (conn as any).run(sql, params);
        return [];
      }
    } catch (e) {
      console.error('[Runtime DB SQLite Error]', e, sql);
      throw e;
    }
  }
}

