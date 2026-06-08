// Rode este arquivo para testar se o SMTP está funcionando
// Comando: node testar-conexao.js
require('dotenv').config();
const { verificarConexao } = require('./mailer');

console.log('🔍 Testando conexão com SMTP da Hostinger...');
verificarConexao();
