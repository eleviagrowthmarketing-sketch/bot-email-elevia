require('dotenv').config();
const cron = require('node-cron');
const { runDisparo } = require('./index');

console.log('Scheduler ativo - aguardando disparo automatico as 09:00 America/Sao_Paulo.');

let running = false;

async function executarDisparoAgendado() {
  if (running) {
    console.log('Disparo ignorado: ja existe uma execucao em andamento.');
    return;
  }

  running = true;
  const startedAt = new Date().toISOString();
  console.log(`\nHorario atingido. Iniciando disparo automatico: ${startedAt}`);

  try {
    await runDisparo();
    console.log('Disparo automatico concluido.\n');
  } catch (err) {
    console.error(`Erro no disparo automatico: ${err.message}`);
    console.error(err.stack);
  } finally {
    running = false;
  }
}

cron.schedule('0 9 * * 1-5', executarDisparoAgendado, {
  timezone: 'America/Sao_Paulo',
});

module.exports = { executarDisparoAgendado };
