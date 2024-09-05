// index.js

const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { processJsonAndUpload } = require('./utils/jsonToXlsx');
const { xlsxToJson } = require('./utils/xlsxToJson');
const multer = require('multer');

// Definir uma Cloud Function HTTP que processa o JSON e converte em XLSX
exports.convertJsonToXlsx = functions.https.onRequest(async (request, response) => {
  try {
    // Obter os parâmetros do body: jsonData e outputPath
    const { jsonData, outputPath } = request.body;

    // Verificar se o JSON foi enviado e se é uma lista de objetos
    if (!jsonData || !Array.isArray(jsonData)) {
      return response.status(400).send('JSON inválido. Deve ser uma lista de objetos.');
    }

    // Verificar se o outputPath foi enviado e é uma string
    if (!outputPath || typeof outputPath !== 'string') {
      return response.status(400).send('Caminho inválido. Deve ser uma string representando o local onde o arquivo será salvo.');
    }

    // Chamar a função de processamento e upload
    const downloadLink = await processJsonAndUpload(jsonData, outputPath);

    // Retornar o link público do arquivo na resposta
    return response.status(200).send({ link: downloadLink });
  } catch (error) {
    logger.error('Erro ao converter JSON para XLSX:', error);
    return response.status(500).send('Erro ao processar o arquivo.');
  }
});

// Configurar o multer para aceitar upload de arquivos .xlsx
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // Limitar a 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      return cb(new Error('Apenas arquivos XLSX são permitidos'));
    }
    cb(null, true);
  }
});

exports.convertXlsxToJson = functions.https.onRequest((request, response) => {
  // Usar multer para processar o arquivo enviado na requisição
  upload.single('file')(request, response, async (err) => {
    if (err) {
      logger.error('Erro ao fazer upload do arquivo:', err);
      return response.status(400).send({ error: err.message });
    }

    try {
      // Verificar se o arquivo foi enviado corretamente
      if (!request.file) {
        return response.status(400).send({ error: 'Nenhum arquivo foi enviado. Envie um arquivo XLSX.' });
      }

      // Obter o arquivo enviado
      const fileBuffer = request.file.buffer;

      // Ler o arquivo XLSX e converter para JSON
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const json = xlsxToJson(workbook);

      // Retornar o JSON resultante
      return response.status(200).send({ json });
    } catch (error) {
      logger.error('Erro ao converter XLSX para JSON:', error);
      return response.status(500).send({ error: 'Erro ao processar o arquivo.' });
    }
  });
});
