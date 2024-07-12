import fetch from 'node-fetch';
import { token } from './getToken.js';
import { options } from './functions.js'
import { processaCadastrosEEstoques } from './processaCadastrosEEstoques.js'

import dotenv from 'dotenv';
dotenv.config();

export async function postProdutosRecentes() {
  const authorization = await token();
  const query = process.env.SNK_QUERY_PROD_RECENTES;

  try {
    const response = await fetch(process.env.SNK_ENDPOINT_QUERY, options(authorization, query));
    const data = await response.json();

    const { responseBody: { rows } } = data;
    rows.forEach(async row => {
      const base_array = [row[0].split(',')]
      const array = base_array[0]
      for (let index = 0; index < array.length; index++) {
        const element = array[index];
        processaCadastrosEEstoques(element)
      }
    });

  } catch (error) {
    console.error(`Erro:`, error.message);
  }
}

postProdutosRecentes()