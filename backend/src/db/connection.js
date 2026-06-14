
const { Pool } = require('pg');

// Usa la URL interna de Railway si existe (evita el proxy y ECONNRESET).
// Si no, cae al DATABASE_URL externo con SSL.
const connectionString = process.env.DATABASE_PRIVATE_URL || process.env.DATABASE_URL;
const isInternal = !!(process.env.DATABASE_PRIVATE_URL);

const pool = new Pool({
  connectionString,
  ssl: isInternal ? false : { rejectUnauthorized: false },
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10,
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message);
});

async function connectWithRetry(retries = 5, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      client.release();
      console.log('✅ PostgreSQL conectado');
      return;
    } catch (err) {
      console.error(`❌ Intento ${i + 1}/${retries}: ${err.message}`);
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, delay * (i + 1)));
      }
    }
  }
  console.error('❌ No se pudo conectar a PostgreSQL — el servidor seguirá corriendo');
}

connectWithRetry();

module.exports = pool;
