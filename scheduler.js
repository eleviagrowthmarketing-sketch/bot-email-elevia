require('dotenv').config();
const cron = require('node-cron');
const { execSync } = require('child_process');
const { runDisparo } = require('./index');

console.log('⏰ Scheduler ativo — aguardando horário de disparo...');

// Todo dia útil às 9h (horário de Brasília)
cron.schedule('0 9 * * 1-5', async () => {

  console.log('\n⏰ Horário atingido! Preparando lote do dia...');

  // 1. Carrega o próximo lote de 500 leads
  try {
    execSync('node C:\\Users\\Suporte\\bot-leads\\gerenciar-lotes.js proximo', {
      stdio: 'inherit',
    });
  } catch (err) {
    console.error('❌ Erro ao carregar lote:', err.message);
    return;
  }

  // 2. Dispara os emails do lote
  console.log('\n🚀 Iniciando disparo do lote...');
  await runDisparo();
  console.log('✅ Lote do dia concluído!\n');

}, {
  timezone: 'America/Sao_Paulo',
});
