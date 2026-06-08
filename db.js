require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function inicializarDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(255),
      email VARCHAR(255) UNIQUE,
      empresa VARCHAR(255),
      segmento VARCHAR(100),
      porte VARCHAR(20),
      status VARCHAR(20) DEFAULT 'pendente',
      enviado_em TIMESTAMP,
      erro_msg TEXT,
      open_count INT DEFAULT 0,
      first_open_at TIMESTAMP,
      last_open_at TIMESTAMP,
      click_count INT DEFAULT 0,
      first_click_at TIMESTAMP,
      last_click_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE leads
      ADD COLUMN IF NOT EXISTS open_count INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS first_open_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS last_open_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS click_count INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS first_click_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS last_click_at TIMESTAMP;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS progresso (
      id SERIAL PRIMARY KEY,
      total_leads INT DEFAULT 0,
      enviados INT DEFAULT 0,
      erros INT DEFAULT 0,
      ultimo_disparo TIMESTAMP,
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    INSERT INTO progresso (id, total_leads)
    VALUES (1, 0)
    ON CONFLICT (id) DO NOTHING;
  `);

  console.log('Banco de dados inicializado!');
}

async function buscarProximosLeads(limite = 300) {
  const result = await pool.query(
    `SELECT * FROM leads
     WHERE status = 'pendente'
     ORDER BY id ASC
     LIMIT $1`,
    [limite]
  );
  return result.rows;
}

async function marcarEnviado(id) {
  await pool.query(
    `UPDATE leads SET status = 'enviado', enviado_em = NOW() WHERE id = $1`,
    [id]
  );
}

async function marcarErro(id, msg) {
  await pool.query(
    `UPDATE leads SET status = 'erro', erro_msg = $1 WHERE id = $2`,
    [msg, id]
  );
}

async function atualizarProgresso(enviados, erros) {
  await pool.query(
    `UPDATE progresso
     SET enviados = enviados + $1,
         erros = erros + $2,
         ultimo_disparo = NOW(),
         updated_at = NOW()
     WHERE id = 1`,
    [enviados, erros]
  );
}

async function verStatus() {
  const r = await pool.query('SELECT * FROM progresso WHERE id = 1');
  const p = r.rows[0];
  const pendentes = await pool.query(`SELECT COUNT(*) FROM leads WHERE status = 'pendente'`);
  return {
    ...p,
    pendentes: parseInt(pendentes.rows[0].count, 10),
  };
}

module.exports = { pool, inicializarDB, buscarProximosLeads, marcarEnviado, marcarErro, atualizarProgresso, verStatus };
