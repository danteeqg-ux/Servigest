const fs   = require('fs');
const path = require('path');
const { Pool } = require('pg');

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

async function runMigrations() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('✅ Migraciones aplicadas');
  } catch (err) {
    console.error('⚠️ Error en migraciones:', err.message);
  }
}

async function connectWithRetry(retries = 5, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      client.release();
      console.log('✅ PostgreSQL conectado');
      await runMigrations();
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
