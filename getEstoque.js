import fetch from 'node-fetch';
import { token } from './getToken.js';
import { options, postToCs } from './functions.js'
import dotenv from 'dotenv';
dotenv.config();

export async function salvaEstoqueCs(codprod) {
  const authorization = await token();
  const base_query = process.env.SNK_QUERY_ESTOQUE
  const query = base_query.replace('${codprod}', codprod)

  console.log(`📦 Enviando dados do estoque do produto ${codprod}`);
  try {
    const response = await fetch(process.env.SNK_ENDPOINT_QUERY, options(authorization, query));
    const data = await response.json();

    // if (data.error) {
    //   throw new Error(`Erro no produto ${codprod}: ${data.error.descricao}`);
    // }

    const { responseBody: { rows } } = data;
    rows.forEach(row => {
      const json = JSON.parse(row)
      postToCs(json, process.env.CS_ENDPOINT_ESTOQUE, 'Estoque', codprod)
    });

  } catch (error) {
    console.error(`Erro no produto ${codprod}:`, error.message);
  }
}