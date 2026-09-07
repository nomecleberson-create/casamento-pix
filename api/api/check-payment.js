module.exports = async (req, res) => {
  const { id } = req.query || {};

  if (!id) {
    return res.status(400).json({ error: 'ID do pagamento é obrigatório' });
  }

  const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!ACCESS_TOKEN) {
    return res.status(500).json({ error: 'MP_ACCESS_TOKEN não configurado no servidor' });
  }

  try {
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      }
    });

    const data = await mpResponse.json();

    if (!mpResponse.ok) {
      return res.status(mpResponse.status).json({ error: data.message || 'Erro ao consultar pagamento' });
    }

    // status possíveis: pending, approved, rejected, cancelled, refunded, in_process
    return res.status(200).json({ status: data.status });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno ao consultar pagamento' });
  }
};
