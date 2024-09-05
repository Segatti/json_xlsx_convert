// utils/jsonToXlsx.js

const XLSX = require("xlsx");
const bucket = require('../firebaseConfig');

// Função para fazer o flatten do JSON
function flattenJson(nestedJson, parentKey = '', result = {}) {
    if (Array.isArray(nestedJson)) {
        let list = [];
        for (let i = 0; i < nestedJson.length; i++) {
            if (typeof nestedJson[i] === 'object') {
                list.push(flattenJson(nestedJson[i]));
            } else {
                list.push(nestedJson[i]);
            }
        }
        return list;
    } else {
        for (let key in nestedJson) {
            if (nestedJson.hasOwnProperty(key)) {
                const newKey = parentKey ? `${parentKey}.${key}` : key;
                if (typeof nestedJson[key] === 'object' && !Array.isArray(nestedJson[key])) {
                    flattenJson(nestedJson[key], newKey, result);
                } else {
                    if (Array.isArray(nestedJson[key])) {
                        result[newKey] = flattenJson(nestedJson[key]);
                    } else {
                        result[newKey] = nestedJson[key];
                    }
                }
            }
        }
        return result;
    }
}

// Funções utilitárias para o processamento de JSON
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => deepClone(item));
    const copy = {};
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            copy[key] = deepClone(obj[key]);
        }
    }
    return copy;
}

function replaceArraysWithLabel(obj, label = "array_tab") {
    const copy = deepCopy(obj);
    function recursiveReplace(o) {
        if (typeof o === 'object' && o !== null) {
            for (let key in o) {
                if (o.hasOwnProperty(key)) {
                    if (Array.isArray(o[key])) {
                        o[key] = label;
                    } else if (typeof o[key] === 'object' && o[key] !== null) {
                        recursiveReplace(o[key]);
                    }
                }
            }
        }
    }
    recursiveReplace(copy);
    return copy;
}

function createSubtables(workbook, data, nameTable) {
    let jsonAux = [];
    for (let i = 0; i < data.length; i++) {
        let hasArray = checkHasArray(data[i]);
        for (let key in data[i]) {
            if (typeof data[i][key] == "object") {
                if (hasArray.isEmpty) {
                    jsonAux.push({ "originIndex": i, ...data[i][key] });
                } else {
                    jsonAux.push({ "originIndex": i, "destinyIndex": jsonAux.length, ...data[i][key] });
                }
            } else {
                jsonAux.push({ "originIndex": i, "value": data[i][key] });
            }
        }
    }
    const worksheet = XLSX.utils.json_to_sheet(replaceArraysWithLabel(jsonAux));
    XLSX.utils.book_append_sheet(workbook, worksheet, nameTable);
    let keys = checkHasArray(jsonAux);
    if (keys.length !== 0) {
        for (let key in keys) {
            createSubtables(workbook, jsonAux.map(el => el[keys[key]]), nameTable + "." + keys[key]);
        }
    }
}

// Função principal para converter JSON para XLSX e fazer upload para Firebase Storage
async function jsonToXlsx(jsonData, outputFile) {
    let aux = deepClone(jsonData);
    for (let i = 0; i < aux.length; i++) {
        aux[i] = { "destinyIndex": i, ...aux[i] };
    }
    const worksheet = XLSX.utils.json_to_sheet(replaceArraysWithLabel(aux));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    let copyJson = deepClone(aux);
    let arrayKeys = checkHasArray(copyJson);
    if (arrayKeys.length !== 0) {
        for (let key in arrayKeys) {
            createSubtables(workbook, copyJson.map(el => el[arrayKeys[key]]), "Data." + arrayKeys[key]);
        }
    }

    // Gerar o arquivo XLSX como Buffer
    const xlsxBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    const file = bucket.file(outputFile);

    // Fazer upload do arquivo para Firebase Storage
    await new Promise((resolve, reject) => {
        const writeStream = file.createWriteStream({
            metadata: {
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }
        });
        writeStream.end(xlsxBuffer);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
    });

    // Tornar o arquivo público
    await file.makePublic();
    return `https://storage.googleapis.com/${bucket.name}/${outputFile}`;
}

// Função exportada para ser usada nas Cloud Functions
async function processJsonAndUpload(json, path) {
    const flattenedJson = flattenJson(json);
    try {
        const link = await jsonToXlsx(flattenedJson, path);
        console.log("Link de download público:", link);
        return link;
    } catch (error) {
        console.error("Erro ao criar o arquivo XLSX e obter o link:", error);
        throw error;
    }
}

module.exports = { processJsonAndUpload };
