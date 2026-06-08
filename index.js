require('dotenv').config();
const fs = require('fs');
const { sendEmail } = require('./mailer');
const { inicializarDB, buscarProximosLeads, marcarEnviado, marcarErro, atualizarProgresso, verStatus } = require('./db');
const { adicionarLeadNoCRM } = require('./crm');

const LOTE_DIARIO = 300;

async function runDisparo() {
  await inicializarDB();

  const leads = await buscarProximosLeads(LOTE_DIARIO);

  if (leads.length === 0) {
    console.log('📭 Nenhum lead pendente. Importe uma nova base.');
    return;
  }

  const template = fs.readFileSync('./templates/email.html', 'utf-8');

  // Cria pasta de logs se não existir
  if (!fs.existsSync('./logs')) fs.mkdirSync('./logs');

  let enviados = 0;
  let erros    = 0;

  console.log(`\n🚀 Iniciando disparo para ${leads.length} leads...\n`);

  for (const lead of leads) {
    const html = template
      .replace(/{{nome}}/g,    lead.nome    || lead.empresa)
      .replace(/{{email}}/g,   lead.email)
      .replace(/{{empresa}}/g, lead.empresa || '');

    try {
      await sendEmail({
        to:      lead.email,
        subject: `O Google da ${lead.empresa} está com problemas sérios`,
        html,
      });
      await marcarEnviado(lead.id);
      enviados++;
      console.log(`✓ Enviado → ${lead.empresa} <${lead.email}>`);

      // Adiciona automaticamente no CRM da Elevia
      await adicionarLeadNoCRM({ nome: lead.nome, empresa: lead.empresa, email: lead.email, segmento: lead.segmento });
    } catch (err) {
      await marcarErro(lead.id, err.message);
      erros++;
      console.error(`✗ Erro   → ${lead.email}: ${err.message}`);
    }

    // 6s entre envios — seguro para SMTP
    await new Promise(r => setTimeout(r, 6000));
  }

  await atualizarProgresso(enviados, erros);

  // Log do dia
  const data  = new Date().toISOString().split('T')[0];
  const stats = await verStatus();
  fs.writeFileSync(`./logs/${data}.json`, JSON.stringify({
    enviados, erros,
    total_enviados: stats.enviados,
    pendentes:      stats.pendentes,
  }, null, 2));

  console.log(`\n✅ Disparo concluído! Enviados: ${enviados} | Erros: ${erros}`);
  console.log(`📊 Total acumulado: ${stats.enviados} enviados | ${stats.pendentes} pendentes\n`);
}

module.exports = { runDisparo };

// Executa direto se chamado via node index.js
if (require.main === module) {
  runDisparo().catch(console.error);
}
