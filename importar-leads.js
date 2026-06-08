// Importa o CSV de leads para o banco de dados PostgreSQL
// Uso: node importar-leads.js caminho/do/arquivo.csv
require('dotenv').config();
const fs   = require('fs');
const csv  = require('csv-parser');
const { pool, inicializarDB } = require('./db');

const arquivo = process.argv[2] || '../bot-leads/output/leads.csv';

async function importar() {
  if (!fs.existsSync(arquivo)) {
    console.error(`❌ Arquivo não encontrado: ${arquivo}`);
    process.exit(1);
  }

  await inicializarDB();

  const leads = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(arquivo)
      .pipe(csv())
      .on('data', row => leads.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📥 Importando ${leads.length.toLocaleString()} leads...`);

  let importados = 0;
  let duplicados = 0;

  // Insere em lotes de 100 para não sobrecarregar
  for (let i = 0; i < leads.length; i += 100) {
    const lote = leads.slice(i, i + 100);

    for (const lead of lote) {
      try {
        await pool.query(
          `INSERT INTO leads (nome, email, empresa, segmento, porte)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (email) DO NOTHING`,
          [lead.nome, lead.email, lead.empresa, lead.segmento || '', lead.porte || '']
        );
        importados++;
      } catch (err) {
        duplicados++;
      }
    }

    const pct = Math.round(((i + 100) / leads.length) * 100);
    process.stdout.write(`\r   ⬇  ${Math.min(pct, 100)}% (${importados.toLocaleString()} importados)`);
  }

  // Atualiza total no progresso
  await pool.query('UPDATE progresso SET total_leads = $1 WHERE id = 1', [importados]);

  console.log(`\n\n✅ Importação concluída!`);
  console.log(`   Importados : ${importados.toLocaleString()}`);
  console.log(`   Duplicados : ${duplicados.toLocaleString()}`);
  console.log(`\n🚀 Pronto para disparar! Rode: node index.js\n`);

  await pool.end();
}

importar().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
