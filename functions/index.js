const functions = require('firebase-functions');
const logger = require("firebase-functions/logger");
const { processJsonAndUpload } = require('./utils/jsonToXlsx');
const { xlsxToJson } = require('./utils/xlsxToJson');
const XLSX = require('xlsx');

// Função convertJsonToXlsx usando onCall
exports.convertJsonToXlsx = functions.https.onCall(async (data, context) => {
  try {
    if (context.auth === undefined || context.auth === null) {
      return { "success": false, "error": "Precisa estar logado" };
    }

    const jsonData = data.jsonData;
    const outputPath = data.outputPath;

    if (!jsonData || !Array.isArray(jsonData)) {
      return { "success": false, "error": 'JSON inválido. Deve ser uma lista de objetos.' };
    }

    if (!outputPath || typeof outputPath !== 'string') {
      return { "success": false, "error": 'Caminho inválido. Deve ser uma string representando o local onde o arquivo será salvo.' };
    }

    const downloadLink = await processJsonAndUpload(jsonData, outputPath);
    return { "success": true, "link": downloadLink };
  } catch (error) {
    console.log(`Erro ao converter JSON para XLSX: ${error.message}`);
    return { "success": false, "error": error.message || "Erro ao processar o arquivo" };
  }
});

// Função convertXlsxToJson usando onCall
exports.convertXlsxToJson = functions.https.onCall(async (data, context) => {
  try {
    if (context.auth === undefined || context.auth === null) {
      return { "success": false, "error": "Precisa estar logado" };
    }

    const base64Xlsx = data.fileBase64;

    if (!base64Xlsx) {
      return { "success": false, "error": "Nenhum arquivo foi enviado. Envie um arquivo XLSX em base64." };
    }

    // Converter o arquivo base64 para um buffer
    const fileBuffer = Buffer.from(base64Xlsx, 'base64');

    // Ler o arquivo XLSX e converter para JSON
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const json = xlsxToJson(workbook);

    return { "success": true, "json": json };
  } catch (error) {
    logger.error('Erro ao converter XLSX para JSON:', error);
    return { "success": false, "error": error.message || "Erro ao processar o arquivo." };
  }
});
