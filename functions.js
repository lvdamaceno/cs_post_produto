export function options(authorization, query) {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authorization}`
    },
    body: JSON.stringify(executeQuery(query))
  };
  return options
}

function executeQuery(query) {
  const requestBody = {
    "serviceName": "DbExplorerSP.executeQuery",
    "requestBody": {
      "sql": query
    }
  };
  return requestBody
}

export function postToCs(jsonString, url, tipo, codprod) {
  // console.log(`Tentativa de envio do ${tipo} do produto para o CS`)
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(jsonString)
  })
    .then(response => response.json())
    .then(result => {
      // console.log(result, `-- ${tipo} do produto ${codprod} salvo no CS`);
    })
    .catch(error => {
      console.error(`Erro no envido do produto ${codprod}:`, error);
    });
}