require('dotenv').config();

const CRM_API_URL = process.env.CRM_API_URL;
const CRM_API_KEY = process.env.CRM_API_KEY;

async function adicionarLeadNoCRM({ nome, empresa, email, segmento }) {
  if (!CRM_API_URL || !CRM_API_KEY) {
    console.error('CRM nao configurado: defina CRM_API_URL e CRM_API_KEY.');
    return;
  }

  try {
    const response = await fetch(`${CRM_API_URL.replace(/\/$/, '')}/api/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CRM_API_KEY,
      },
      body: JSON.stringify({
        name: nome || empresa,
        company: empresa || nome,
        email,
        source: 'other',
        status: 'qualified',
        score: 20,
        assigned_to: 'Carlos',
        notes: `Lead captado via e-mail - Google Meu Negocio | Segmento: ${segmento || 'N/I'} | Data: ${new Date().toLocaleDateString('pt-BR')}`,
      }),
    });

    if (response.status === 409) return;

    if (!response.ok) {
      const body = await response.text();
      console.error(`CRM erro para ${email}: ${response.status} ${body}`);
      return;
    }

    console.log(`CRM lead criado -> ${empresa || nome} <${email}>`);
  } catch (err) {
    console.error(`CRM falhou para ${email}: ${err.message}`);
  }
}

module.exports = { adicionarLeadNoCRM };
