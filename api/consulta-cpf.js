const https = require('https');

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const cpf = req.query.cpf || '';

  if (!cpf) {
    return res.status(400).json({ status: 400, mensagem: 'CPF não fornecido' });
  }

  const apiUrl = `https://searchapi.dnnl.live/consulta?token_api=5717&cpf=${encodeURIComponent(cpf)}`;

  return new Promise((resolve) => {
    const request = https.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    }, (response) => {
      let body = '';

      response.on('data', (chunk) => {
        body += chunk;
      });

      response.on('end', () => {
        try {
          const data = JSON.parse(body);

          if (data && data.status === 200 && data.dados && data.dados.length > 0) {
            const usuario = data.dados[0];

            let mae = '';
            if (data.parentes && data.parentes.length > 0) {
              for (const parente of data.parentes) {
                if (parente.VINCULO === 'MAE') {
                  mae = parente.NOME_VINCULO || '';
                  break;
                }
              }
            }

            res.status(200).json({
              status: 200,
              nome: usuario.NOME || '',
              cpf: usuario.CPF || '',
              nascimento: usuario.NASC || '',
              sexo: usuario.SEXO || '',
              mae: mae,
              renda: usuario.RENDA || '',
              rg: usuario.RG || ''
            });
          } else {
            res.status(200).json(data);
          }
        } catch (e) {
          res.status(500).json({ status: 500, mensagem: 'Erro ao processar resposta: ' + e.message });
        }
        resolve();
      });
    });

    request.on('error', (err) => {
      res.status(500).json({ status: 500, mensagem: 'Erro ao consultar: ' + err.message });
      resolve();
    });

    request.setTimeout(10000, () => {
      request.destroy();
      res.status(500).json({ status: 500, mensagem: 'Timeout na consulta' });
      resolve();
    });
  });
};
