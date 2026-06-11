require('dotenv').config();
const nodemailer = require('nodemailer');

const brevoApiKey = process.env.BREVO_API_KEY;
const usarBrevoApi = Boolean(brevoApiKey && brevoApiKey.startsWith('xkeysib-'));
const usarBrevoSmtp = !usarBrevoApi && process.env.BREVO_PASS && process.env.BREVO_PASS !== 'SUA_CHAVE_SMTP_BREVO_AQUI';

function parseFrom(from) {
  const match = String(from || '').match(/^(.*)<(.+)>$/);
  if (!match) return { email: from, name: 'Elevia Growth Marketing' };
  return { name: match[1].trim(), email: match[2].trim() };
}

const smtpTransporter = nodemailer.createTransport(
  usarBrevoSmtp
    ? {
        host: process.env.BREVO_HOST,
        port: Number(process.env.BREVO_PORT),
        secure: Number(process.env.BREVO_PORT) === 465,
        connectionTimeout: 20000,
        greetingTimeout: 20000,
        socketTimeout: 30000,
        auth: {
          user: process.env.BREVO_USER,
          pass: process.env.BREVO_PASS,
        },
      }
    : {
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: true,
        connectionTimeout: 20000,
        greetingTimeout: 20000,
        socketTimeout: 30000,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      }
);

console.log(`Envio: ${usarBrevoApi ? 'Brevo API HTTP' : usarBrevoSmtp ? 'Brevo SMTP' : 'Hostinger SMTP'}`);

async function sendViaBrevoApi({ to, subject, html }) {
  const sender = parseFrom(process.env.EMAIL_FROM);
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': brevoApiKey,
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Brevo API ${response.status}: ${text.slice(0, 500)}`);
  }

  return response.json();
}

async function sendViaSmtp({ to, subject, html }) {
  return smtpTransporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
    encoding: 'utf-8',
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

async function sendEmail(payload) {
  if (usarBrevoApi) return sendViaBrevoApi(payload);
  return sendViaSmtp(payload);
}

async function verificarConexao() {
  try {
    if (usarBrevoApi) {
      const response = await fetch('https://api.brevo.com/v3/account', {
        headers: { accept: 'application/json', 'api-key': brevoApiKey },
      });
      if (!response.ok) throw new Error(`Brevo API ${response.status}`);
      console.log('Conexao Brevo API OK!');
      return;
    }

    await smtpTransporter.verify();
    console.log(`Conexao SMTP OK! (${usarBrevoSmtp ? 'Brevo' : 'Hostinger'})`);
  } catch (err) {
    console.error('Erro na conexao de envio:', err.message);
    throw err;
  }
}

module.exports = { sendEmail, verificarConexao };
