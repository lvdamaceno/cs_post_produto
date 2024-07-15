import fetch from 'node-fetch';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// =======================
// Configurações
// =======================
const url = process.env.SNK_URL;
const headers = {
  password: process.env.PASSWORD,
  username: process.env.USERNAME,
  appkey: process.env.APPKEY,
  token: process.env.TOKEN,
};

// =======================
// Funções Utilitárias
// =======================
async function token() {
  try {
    const response = await axios.post(url, {}, { headers });
    const token = response.data.bearerToken;
    return token;
  } catch (error) {
    handleRequestError(error);
  }
}

function options(authorization, query) {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authorization}`
    },
    body: JSON.stringify(executeQuery(query))
  };
}

function executeQuery(query) {
  return {
    serviceName: "DbExplorerSP.executeQuery",
    requestBody: {
      sql: query
    }
  };
}

function postToCs(jsonString, url, tipo, codprod) {
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(jsonString)
  })
    .then(response => response.json())
    .then(result => {
      console.log(`✅ ${tipo} do produto ${codprod} salvo no CS ${result}`);
    })
    .catch(error => {
      console.error(`Erro no envio do produto ${codprod}:`, error);
    });
}

function handleRequestError(error) {
  if (error.response) {
    console.error('Erro na resposta do servidor:', error.response.data);
    console.error('Status do erro:', error.response.status);
  } else if (error.request) {
    console.error('Nenhuma resposta recebida:', error.request);
  } else {
    console.error('Erro ao configurar a requisição:', error.message);
  }
}

// =======================
// Funções de Envio
// =======================
export async function salvaCadastroCs(codprod) {
  const authorization = await token();
  const base_query = process.env.SNK_QUERY_CADASTRO;
  const query = base_query.replace('${codprod}', codprod);

  console.log(`📝 Enviando dados do cadastro do produto ${codprod}`);
  try {
    const response = await fetch(process.env.SNK_ENDPOINT_QUERY, options(authorization, query));
    const data = await response.json();
    const { responseBody: { rows } } = data;

    rows.forEach(row => {
      const json = JSON.parse(row);
      postToCs(json, process.env.CS_ENDPOINT_CADASTRO, 'Cadastro', codprod);
    });
  } catch (error) {
    console.error(`Erro no produto ${codprod}:`, error.message);
  }
}

async function enviaCadastrosCS(produtos) {
  try {
    await salvaCadastroCs(produtos);
  } catch (error) {
    console.error('Erro ao executar salvaCadastroCs:', error);
  }
}

export async function salvaEstoqueCs(codprod) {
  const authorization = await token();
  const base_query = process.env.SNK_QUERY_ESTOQUE;
  const query = base_query.replace('${codprod}', codprod);

  console.log(`📦 Enviando dados do estoque do produto ${codprod}`);
  try {
    const response = await fetch(process.env.SNK_ENDPOINT_QUERY, options(authorization, query));
    const data = await response.json();
    const { responseBody: { rows } } = data;

    rows.forEach(row => {
      const json = JSON.parse(row);
      postToCs(json, process.env.CS_ENDPOINT_ESTOQUE, 'Estoque', codprod);
    });
  } catch (error) {
    console.error(`Erro no produto ${codprod}:`, error.message);
  }
}

async function enviaEstoqueCs(produtos) {
  try {
    await salvaEstoqueCs(produtos);
  } catch (error) {
    console.error('Erro ao executar salvaEstoqueCs:', error);
  }
}

// =======================
// Funções de Processamento
// =======================
export async function processaCadastrosEEstoques(produtos) {
  await enviaCadastrosCS(produtos);
  await enviaEstoqueCs(produtos);
}

// =======================
// Função Principal
// =======================
async function postProdutosRecentes() {
  const authorization = await token();
  const query = process.env.SNK_QUERY_PROD_RECENTES;

  try {
    const response = await fetch(process.env.SNK_ENDPOINT_QUERY, options(authorization, query));
    const data = await response.json();
    const { responseBody: { rows } } = data;

    rows.forEach(async row => {
      const base_array = row[0].split(',');
      for (let element of base_array) {
        await processaCadastrosEEstoques(element);
      }
    });
  } catch (error) {
    console.error(`Erro:`, error.message);
  }
}

// =======================
// Execução da Função Principal
// =======================
postProdutosRecentes();
