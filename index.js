require('dotenv').config();
const fs = require('fs');
const { sendEmail } = require('./mailer');
const { inicializarDB, buscarProximosLeads, marcarEnviado, marcarErro, atualizarProgresso, verStatus } = require('./db');
const { adicionarLeadNoCRM } = require('./crm');

const LOTE_DIARIO = 300;

function isErroTemporario(err) {
  const msg = String(err && err.message ? err.message : err).toLowerCase();
  return msg.includes('timeout') || msg.includes('etimedout') || msg.includes('econnreset') || msg.includes('fetch failed') || msg.includes('network');
}

async function runDisparo() {
  await inicializarDB();

  const leads = await buscarProximosLeads(LOTE_DIARIO);

  if (leads.length === 0) {
    console.log('Nenhum lead pendente. Importe uma nova base.');
    return;
  }

  const template = fs.readFileSync('./templates/email.html', 'utf-8');
  const trackingBaseUrl = (process.env.CRM_API_URL || 'https://crm-api-production-21c7.up.railway.app').replace(/\/$/, '');

  if (!fs.existsSync('./logs')) fs.mkdirSync('./logs');

  let enviados = 0;
  let erros = 0;

  console.log(`\nIniciando disparo para ${leads.length} leads...\n`);

  for (const lead of leads) {
    const html = template
      .replace(/{{nome}}/g, lead.nome || lead.empresa)
      .replace(/{{email}}/g, lead.email)
      .replace(/{{empresa}}/g, lead.empresa || '')
      .replace(/{{tracking_open_url}}/g, trackingBaseUrl + '/track/open.gif?id=' + lead.id)
      .replace(/{{tracking_click_url}}/g, trackingBaseUrl + '/track/click?id=' + lead.id);

    try {
      await sendEmail({
        to: lead.email,
        subject: `O Google da ${lead.empresa} esta com problemas serios`,
        html,
      });
      await marcarEnviado(lead.id);
      enviados++;
      console.log(`Enviado -> ${lead.empresa} <${lead.email}>`);

      await adicionarLeadNoCRM({ nome: lead.nome, empresa: lead.empresa, email: lead.email, segmento: lead.segmento });
    } catch (err) {
      if (isErroTemporario(err)) {
        console.error(`Erro temporario de envio. Parando lote para nao queimar leads: ${lead.email}: ${err.message}`);
        break;
      }

      await marcarErro(lead.id, err.message);
      erros++;
      console.error(`Erro -> ${lead.email}: ${err.message}`);
    }

    await new Promise(r => setTimeout(r, 6000));
  }

  await atualizarProgresso(enviados, erros);

  const data = new Date().toISOString().split('T')[0];
  const stats = await verStatus();
  fs.writeFileSync(`./logs/${data}.json`, JSON.stringify({
    enviados,
    erros,
    total_enviados: stats.enviados,
    pendentes: stats.pendentes,
  }, null, 2));

  console.log(`\nDisparo concluido! Enviados: ${enviados} | Erros: ${erros}`);
  console.log(`Total acumulado: ${stats.enviados} enviados | ${stats.pendentes} pendentes\n`);
}

module.exports = { runDisparo };

if (require.main === module) {
  runDisparo().catch(console.error);
}


