const crypto = require('crypto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { amount } = req.body || {};
  const valor = Number(amount);

  if (!valor || valor <= 0) {
    return res.status(400).json({ error: 'Valor inválido' });
  }

  const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!ACCESS_TOKEN) {
    return res.status(500).json({ error: 'MP_ACCESS_TOKEN não configurado no servidor' });
  }

  try {
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'X-Idempotency-Key': crypto.randomUUID()
      },
      body: JSON.stringify({
        transaction_amount: valor,
        description: 'Presente de casamento - Ketlym e Cleberson',
        payment_method_id: 'pix',
        payer: {
          email: 'presente@casamento.com',
          first_name: 'Convidado',
          last_name: 'Casamento'
        }
      })
    });

    const data = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('Erro Mercado Pago:', data);
      return res.status(mpResponse.status).json({ error: data.message || 'Erro ao criar cobrança Pix' });
    }

    const txData = data.point_of_interaction && data.point_of_interaction.transaction_data;

    if (!txData) {
      return res.status(500).json({ error: 'Resposta inesperada do Mercado Pago' });
    }

    return res.status(200).json({
      id: data.id,
      status: data.status,
      qr_code: txData.qr_code,
      qr_code_base64: txData.qr_code_base64
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno ao criar pagamento' });
  }
};
