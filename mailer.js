require('dotenv').config();
const nodemailer = require('nodemailer');

// Usa Brevo para cold email (marketing em massa)
// e Hostinger como fallback para e-mails transacionais
const usarBrevo = process.env.BREVO_PASS && process.env.BREVO_PASS !== 'SUA_CHAVE_SMTP_BREVO_AQUI';

const transporter = nodemailer.createTransport(
  usarBrevo
    ? {
        host:   process.env.BREVO_HOST,
        port:   Number(process.env.BREVO_PORT),
        secure: false,
        auth: {
          user: process.env.BREVO_USER,
          pass: process.env.BREVO_PASS,
        },
      }
    : {
        host:   process.env.EMAIL_HOST,
        port:   Number(process.env.EMAIL_PORT),
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      }
);

console.log(`📡 SMTP: ${usarBrevo ? 'Brevo (marketing)' : 'Hostinger (transacional)'}`);

async function sendEmail({ to, subject, html }) {
  return transporter.sendMail({
    from:     process.env.EMAIL_FROM,
    to,
    subject,
    html,
    encoding: 'utf-8',
    headers:  { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

async function verificarConexao() {
  try {
    await transporter.verify();
    console.log(`✅ Conexão SMTP OK! (${usarBrevo ? 'Brevo' : 'Hostinger'})`);
  } catch (err) {
    console.error('❌ Erro na conexão SMTP:', err.message);
  }
}

module.exports = { sendEmail, verificarConexao };
