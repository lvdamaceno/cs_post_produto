import { salvaCadastroCs } from './getCadastro.js';
import { salvaEstoqueCs } from './getEstoque.js';

async function enviaCadastrosCS(produtos) {
  try {
    await salvaCadastroCs(produtos);
  } catch (error) {
    console.error('Erro ao executar salvaCadastroCs:', error);
  }
}

async function enviaEstoqueCs(produtos) {
  try {
    await salvaEstoqueCs(produtos);
  } catch (error) {
    console.error('Erro ao executar salvaEstoqueCs:', error);
  }
}

export async function processaCadastrosEEstoques(produtos) {
  await enviaCadastrosCS(produtos);
  await enviaEstoqueCs(produtos);
}
