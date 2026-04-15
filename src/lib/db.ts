import sql from 'mssql';

const config: sql.config = {
  server: process.env.DB_HOST || '54.247.133.88',
  database: process.env.DB_NAME || 'ShowUnited',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || '*suSU@1231234',
  port: 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
  pool: {
    max: 5,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: sql.ConnectionPool | null = null;

export async function getDb(): Promise<sql.ConnectionPool> {
  if (pool?.connected) return pool;
  pool = await sql.connect(config);
  return pool;
}

export { sql };
