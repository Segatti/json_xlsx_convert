const XLSX = require('xlsx');

// Função auxiliar para converter JSON achatado em aninhado
function unflattenJson(flatJson) {
  if (Array.isArray(flatJson)) {
    let list = [];
    for (let i = 0; i < flatJson.length; i++) {
      if (typeof flatJson[i] === 'object') {
        list.push(unflattenJson(flatJson[i]));
      } else {
        list.push(flatJson[i]);
      }
    }
    return list;
  } else {
    const result = {};

    for (const flatKey in flatJson) {
      const keys = flatKey.split('.');
      let current = result;

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (i === keys.length - 1) {
          if (Array.isArray(flatJson[flatKey])) {
            current[key] = unflattenJson(flatJson[flatKey]);
          } else {
            current[key] = flatJson[flatKey];
          }
        } else {
          if (!current[key]) {
            current[key] = {};
          }
          current = current[key];
        }
      }
    }
    return result;
  }
}

// Função auxiliar para converter uma planilha em JSON
function parseSheetToJson(sheet) {
  return XLSX.utils.sheet_to_json(sheet);
}

// Função que constrói JSON a partir de uma linha da planilha
function buildJsonFromSheet(row, index, workbook, prevTab) {
  let json = {};

  for (let key in row) {
    if (row[key] === "array_tab") {
      const subSheet = workbook.Sheets[prevTab + "." + key];
      if (subSheet) {
        let subSheetData = parseSheetToJson(subSheet);

        const filteredData = subSheetData;

        if (filteredData.length > 0) {
          json[key] = filteredData.map(item => {
            let subJson = {};
            let keys = Object.keys(item);

            if (keys.length === 1 && keys[0] === 'value') {
              return item['value'];
            } else {
              keys.forEach(subKey => {
                subJson[subKey] = item[subKey];
              });

              let indexAux = filteredData.indexOf(item);
              for (let subKey in subJson) {
                if (subJson[subKey] === "array_tab") {
                  subJson[subKey] = buildJsonFromSheet(subJson, indexAux, workbook, prevTab + "." + key);
                }
              }
              return subJson;
            }
          }).filter(item => item.originIndex === index).map(({ originIndex, destinyIndex, ...rest }) => {
            let keys = Object.keys(rest);
            if (keys.length === 1 && keys[0] === 'value') {
              return rest['value'];
            } else {
              return rest;
            }
          });
        } else {
          json[key] = [];
        }
      }
    } else {
      if (key === "originIndex" || key === "destinyIndex") continue;
      json[key] = row[key];
    }
  }

  return json;
}

// Função principal que será exportada
function xlsxToJson(filePath, numSpaces = 2) {
  const workbook = XLSX.readFile(filePath);
  const mainSheet = workbook.Sheets['Data'];
  const mainData = parseSheetToJson(mainSheet);

  let resultJson = [];
  mainData.forEach((item, index) => {
    resultJson.push(buildJsonFromSheet(item, index, workbook, "Data"));
  });
  return JSON.stringify(unflattenJson(resultJson), null, numSpaces);
}

// Exportar apenas a função xlsxToJson
module.exports = { xlsxToJson };
