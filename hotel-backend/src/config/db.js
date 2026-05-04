const sql = require('mssql');
require('dotenv').config();

const useWindowsAuth = process.env.DB_WINDOWS_AUTH === 'true';

const config = useWindowsAuth
  ? {
      server:   process.env.DB_HOST || 'localhost',
      port:     parseInt(process.env.DB_PORT || '1433'),
      database: process.env.DB_NAME || 'HOTEL_EVENTOS',
      domain:   process.env.DB_DOMAIN || '',
      authentication: {
        type: 'ntlm',
        options: {
          userName: process.env.DB_USER || '',
          password: process.env.DB_PASSWORD || '',
          domain:   process.env.DB_DOMAIN || '',
        },
      },
      options: {
        encrypt:                false,
        trustServerCertificate: true,
      },
    }
  : {
      server:   process.env.DB_HOST || 'localhost',
      port:     parseInt(process.env.DB_PORT || '1433'),
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'HOTEL_EVENTOS',
      options: {
        encrypt:                false,
        trustServerCertificate: true,
      },
    };

config.pool = { max: 10, min: 0, idleTimeoutMillis: 30000 };

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

pool.on('error', err => console.error('SQL Pool error:', err));

// Wrapper que imita la API de mysql2: pool.query(sql, params)
// Devuelve [rows] para mantener compatibilidad con las rutas existentes
pool.query = async (queryStr, params = []) => {
  await poolConnect;
  const request = pool.request();
  let i = 0;
  const tsql = queryStr.replace(/\?/g, () => `@p${i++}`);
  params.forEach((val, idx) => request.input(`p${idx}`, val));
  const result = await request.query(tsql);
  return [result.recordset];
};

module.exports = pool;
