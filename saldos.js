import fetch from 'node-fetch';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// =======================
// Configurações
// =======================
// const url = SNK_URL;
const headers = {
  password: process.env.PASSWORD,
  username: process.env.USERNAME,
  appkey: process.env.APPKEY,
  token: process.env.TOKEN,
};

const SNK_URL = 'https://api.sankhya.com.br/login'
const SNK_ENDPOINT_QUERY = 'https://api.sankhya.com.br/gateway/v1/mge/service.sbr?serviceName=DbExplorerSP.executeQuery&outputType=json'
const SNK_QUERY_CADASTRO = 'SELECT sankhya.CC_CS_JSON_PRODUTO(${codprod}) AS ProdutoJSON'
const SNK_QUERY_ESTOQUE = 'SELECT sankhya.CC_CS_JSON_ESTOQUE(${codprod}) AS ProdutoJSON'
const SNK_QUERY_PROD_RECENTES = "SELECT sankhya.CC_CS_PRODUTOS_RECENTES(${tempo}) AS ProdutosRecentes"
const CS_ENDPOINT_CADASTRO = 'https://cc01.csicorpnet.com.br/CS50Integracao_API/rest/CS_IntegracaoV1/ProdutoUpdate?In_Tenant_ID=288'
const CS_ENDPOINT_KARDEX = 'https://cc01.csicorpnet.com.br/CS50Integracao_API/rest/CS_IntegracaoV1/Saldos_Atualiza?In_Tenant_ID=288'

// =======================
// Funções Utilitárias
// =======================
async function token() {
  try {
    const response = await axios.post(SNK_URL, {}, { headers });
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
async function salvaCadastroCs(codprod) {
  const authorization = await token();
  const base_query = SNK_QUERY_CADASTRO;
  const query = base_query.replace('${codprod}', codprod);

  console.log(`📝 Enviando dados do cadastro do produto ${codprod}`);
  try {
    const response = await fetch(SNK_ENDPOINT_QUERY, options(authorization, query));
    const data = await response.json();
    const { responseBody: { rows } } = data;

    rows.forEach(row => {
      const json = JSON.parse(row);
      postToCs(json, CS_ENDPOINT_CADASTRO, 'Cadastro', codprod);
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

async function salvaKardexCs(codprod) {
  const authorization = await token();
  const base_query = SNK_QUERY_ESTOQUE;
  const query = base_query.replace('${codprod}', codprod);

  console.log(`📦 Enviando dados do kardex do produto ${codprod}`);
  try {
    const response = await fetch(SNK_ENDPOINT_QUERY, options(authorization, query));
    const data = await response.json();
    const { responseBody: { rows } } = data;

    rows.forEach(row => {
      const json = JSON.parse(row);
      postToCs(json, CS_ENDPOINT_KARDEX, 'Kardex', codprod);
    });
  } catch (error) {
    console.error(`Erro no produto ${codprod}:`, error.message);
  }
}

async function enviaKardexCs(produtos) {
  try {
    await salvaKardexCs(produtos);
  } catch (error) {
    console.error('Erro ao executar salvaKardexCs:', error);
  }
}

// =======================
// Funções de Processamento
// =======================
async function processaCadastrosEEstoques(produtos) {
  await enviaCadastrosCS(produtos);
  await enviaKardexCs(produtos);
}

// =======================
// Função Principal
// =======================
async function postProdutosRecentes(tempo) {
  const authorization = await token();
  // const query = SNK_QUERY_PROD_RECENTES;

  const base_query = SNK_QUERY_PROD_RECENTES;
  const query = base_query.replace('${tempo}', tempo);

  try {
    const response = await fetch(SNK_ENDPOINT_QUERY, options(authorization, query));
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
postProdutosRecentes(540);
