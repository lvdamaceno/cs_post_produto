import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

// URL para a requisição de login
const url = process.env.SNK_URL;

// Headers da requisição
const headers = {
  'password': process.env.PASSWORD,
  'username': process.env.USERNAME,
  'appkey': process.env.APPKEY,
  'token': process.env.TOKEN
};

// Função para realizar o login
export async function token() {
  try {
    const response = await axios.post(url, {}, { headers });
    const token = response.data.bearerToken;
    // console.log('Conexão com Sankhya: Autorizada');
    return token;
  } catch (error) {
    if (error.response) {
      console.error('Erro na resposta do servidor:', error.response.data);
      console.error('Status do erro:', error.response.status);
    } else if (error.request) {
      console.error('Nenhuma resposta recebida:', error.request);
    } else {
      console.error('Erro ao configurar a requisição:', error.message);
    }
  }
}