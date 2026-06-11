require('dotenv').config();

console.log('Scheduler desativado - disparos automaticos bloqueados.');
console.log('Para reativar, restaure o agendamento em scheduler.js e faca novo deploy.');

module.exports = {
  executarDisparoAgendado: async () => {
    console.log('Disparo automatico bloqueado: scheduler desativado.');
  },
};
