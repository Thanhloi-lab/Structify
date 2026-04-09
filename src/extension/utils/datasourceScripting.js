import { compareString, convertStringToBool, formatString, removeSpace, removeTags, removeTagsWithDefaultValue } from './stringHelper';
import { COUNTRY_MAP, extractCountries } from "./countryMap.js";

export function getDataSourceInformation() {
  try {
    let blocks = Object.keys(document.querySelectorAll('.columnLayout.two-equal>.cell'))
      .map((key) => document.querySelectorAll('.columnLayout.two-equal>.cell')[key]);
    let generalBlock = blocks.filter(x => x.innerHTML?.toLowerCase().includes('general'));
    let integrationDetailsBlock = blocks.filter(x => x.innerHTML?.toLowerCase().includes('integration details'))[0];
    if (!integrationDetailsBlock || generalBlock.length === 0) return null;

    let rightBlocks = integrationDetailsBlock.querySelectorAll('.panelContent');
    let integrationBlock = rightBlocks?.[0];
    let configBlocks = rightBlocks?.[1]?.querySelectorAll('.table-wrap');

    if (!integrationBlock) {
      return null;
    }

    let dataSourceInformation = {
      general: [],
      integration: [],
      configParameters: [],
      credentials: []
    };

    //general
    let generalTable = generalBlock[0].querySelectorAll('tr');
    for (let i = 0; i < generalTable.length; i++) {
      let rawKey = removeTagsWithDefaultValue(generalTable[i].querySelector('th')?.innerHTML);
      let key = removeSpace(rawKey?.toLowerCase()) || '';
      let value = generalTable[i].querySelector('td')?.innerHTML;
      if (key.includes('countries')) {
        let countries = extractCountries(generalTable[i].querySelector('td'));
        dataSourceInformation.general.push({ key: key, value: countries });
      }
      else {
        dataSourceInformation.general.push({ key: key, value: removeTagsWithDefaultValue(value) });
      }
    }

    let integrationTable = integrationBlock.querySelectorAll('tr');
    for (let i = 0; i < integrationTable.length; i++) {
      let key = integrationTable[i].querySelector('th')?.innerHTML;
      let value = integrationTable[i].querySelector('td')?.innerHTML;
      dataSourceInformation.integration.push({ key: removeSpace(removeTagsWithDefaultValue(key)?.toLowerCase()), value: removeTagsWithDefaultValue(value) });
    }

    configBlocks?.forEach(x => {
      try {
        let arrayKey = '';
        let configArray = Object.keys(x.querySelectorAll('tr'))?.map((key) => x.querySelectorAll('tr')?.[key]);

        if (configArray?.find(y => y.innerText?.toLowerCase().includes('credential') || y.innerText?.toLowerCase().includes('account credential'))) {
          arrayKey = 'credentials';
        }
        else if (configArray?.find(y => y.innerText?.toLowerCase().includes('configuration parameter'))) {
          arrayKey = 'configParameters';
        }

        let keyIndex = 0;
        let valueIndex = 1;
        let notesIndex = 2;
        let defaultValueIndex = 3;
        let encryptedIndex = 4;

        if (configArray?.[0]) {
          [...configArray?.[0]?.querySelectorAll('th')]?.forEach((x, index) => {
            if (x.innerText?.toLowerCase().includes('notes')) {
              notesIndex = index
            }
            else if (x.innerText?.toLowerCase().includes('parameter')) {
              keyIndex = index
            }
            else if (x.innerText?.toLowerCase().includes('default')) {
              defaultValueIndex = index
            }
            else if (x.innerText?.toLowerCase().includes('value')) {
              valueIndex = index
            }
            else if (x.innerText?.toLowerCase().includes('encrypt')) {
              encryptedIndex = index
            }
          })

          if (configArray.length > 0) {
            for (let i = 1; i < configArray.length; i++) {
              let valueCols = configArray[i].querySelectorAll('td');
              let rawKey = valueCols?.[keyIndex]?.innerText?.trim() || '';
              let rawValue = valueCols?.[valueIndex]?.innerText?.trim() || '';
              let key = removeSpace(rawKey);
              let infoValue = formatString(rawValue);

              if (key && key !== '') {
                dataSourceInformation?.[arrayKey].push({
                  key: key === "IsRealTimeSource" ? 'GapiServiceUtil.IsRealTimeDsConfigName' : key,
                  value: infoValue,
                  note: formatString(removeTagsWithDefaultValue(valueCols?.[notesIndex]?.innerText?.trim())),
                  defaultValue: formatString(removeTagsWithDefaultValue(valueCols?.[defaultValueIndex]?.innerText?.trim())),
                  encrypted: removeSpace(infoValue)?.toLowerCase().includes("encryptedvalue") ? true : convertStringToBool(valueCols?.[encryptedIndex]?.innerText),
                });
              }
            }
          }
        }
      }
      catch (e) {
        console.log(e);
      }
    })

    return dataSourceInformation;
  } catch (e) {
    console.log(e);
    return null;
  }
}

export function getNewUIDataSourceInformation() {
  let dataSourceInformation = {
    general: [],
    integration: [],
    configParameters: [],
    credentials: []
  };

  let mainBlock = [...document.querySelectorAll('.layout-section-container')]
    .find(el => el.querySelector('*')?.innerText.includes("Datasource Group Name"));

  // Extract general table
  mainBlock?.querySelectorAll('tr').forEach(row => {
    let cols = row.querySelectorAll('td, th');
    if (cols.length >= 2) {
      let key = removeSpace(removeTagsWithDefaultValue(cols[0].innerText)?.toLowerCase());
      let value = cols[1].innerText.trim();

      if (key.includes('countries')) {
        let countries = extractCountries(value);
        dataSourceInformation.general.push({ key: key, value: countries });
      }
      else {
        dataSourceInformation.general.push({ key: removeSpace(removeTagsWithDefaultValue(key)?.toLowerCase()), value: removeTagsWithDefaultValue(value) });
      }
    }
  });

  // Extract integration table
  mainBlock?.querySelectorAll('tr').forEach(row => {
    let cols = row.querySelectorAll('td, th');
    if (cols.length >= 2) {
      let key = removeSpace(removeTagsWithDefaultValue(cols[0].innerText)?.toLowerCase());
      let value = cols[1].innerText.trim();
      dataSourceInformation.integration.push({ key: key, value: value });
    }
  });

  let tablesToParse = Array.from(document.querySelectorAll('.layout-section-container'))
    .flatMap(section => Array.from(section.querySelectorAll('table')))
    .filter(tbl => {
      let text = tbl.innerText?.toLowerCase() || '';
      return (text.includes('configuration parameter') || text.includes('account credential') || text.includes('credential')) && text.includes('value') && text.includes('notes');
    });

  tablesToParse.forEach(x => {
    try {
      let arrayKey = '';
      let configArray = Array.from(x.querySelectorAll('tr'));

      let headerText = configArray[0]?.innerText?.toLowerCase() || '';

      if (headerText.includes('configuration parameter')) {
        arrayKey = 'configParameters';
      }
      else if (headerText.includes('credential') || headerText.includes('account credential')) {
        arrayKey = 'credentials';
      }

      if (!arrayKey) return;

      let keyIndex = 0;
      let valueIndex = 1;
      let notesIndex = 2;
      let defaultValueIndex = 3;
      let encryptedIndex = 4;

      if (configArray.length > 0) {
        let headers = Array.from(configArray[0].querySelectorAll('th'));

        headers.forEach((thElement, index) => {
          let headerText = thElement.innerText?.toLowerCase();
          if (headerText.includes('notes')) {
            notesIndex = index
          }
          else if (headerText.includes('parameter')) {
            keyIndex = index
          }
          else if (headerText.includes('default')) {
            defaultValueIndex = index
          }
          else if (headerText.includes('value')) {
            valueIndex = index
          }
          else if (headerText.includes('encrypt')) {
            encryptedIndex = index
          }
        });

        if (configArray.length > 1) {
          for (let i = 1; i < configArray.length; i++) {
            let valueCols = configArray[i].querySelectorAll('td');
            let rawKey = valueCols?.[keyIndex]?.innerText?.trim() || '';
            let rawValue = valueCols?.[valueIndex]?.innerText?.trim() || '';
            let key = removeSpace(rawKey);
            let infoValue = formatString(rawValue);

            if (key && key !== '') {
              dataSourceInformation[arrayKey].push({
                key: key === "IsRealTimeSource" ? 'GapiServiceUtil.IsRealTimeDsConfigName' : key,
                value: infoValue,
                note: formatString(removeTagsWithDefaultValue(valueCols?.[notesIndex]?.innerText?.trim())),
                defaultValue: formatString(removeTagsWithDefaultValue(valueCols?.[defaultValueIndex]?.innerText?.trim())),
                encrypted: removeSpace(infoValue)?.toLowerCase().includes("encryptedvalue") ? true : convertStringToBool(valueCols?.[encryptedIndex]?.innerText),
              });
            }
          }
        }
      }
    }
    catch (e) {
      console.log('[DS] Error in table parse:', e);
    }
  });

  return dataSourceInformation;
}

export function getUpdateScript(dataSourceName, updateOptions, dataSourceInformation) {
  let variants = getAllVariantsTable();
  return scriptUpdateCode(dataSourceName, updateOptions, dataSourceInformation, variants)
}

export function getMigrationScript(datasourceName, dataSourceInformation) {
  let variants = getAllVariantsTable();
  return scriptDataSourceInformation(dataSourceInformation, variants, datasourceName)
}

function getAllVariantsTable() {
  let variantsBlock = getDataBlock('Variant');
  if (!variantsBlock || variantsBlock.length === 0) {
    variantsBlock = getNewUIVariantBlock();
  }

  if (!variantsBlock || variantsBlock.length === 0) {
    return null;
  }

  let parentNode = variantsBlock[0]?.parentNode;
  if (!parentNode) return null;

  let variantTables = parentNode.querySelectorAll('table');
  let variantsInformation = []

  for (let i = 0; i < variantTables.length; i = i + 2) {
    if (variantTables[i]?.querySelector('th')) {
      let rows = variantTables[i].querySelectorAll('td');
      let informations = [];
      let fields = [];

      for (let j = 0; j + 1 < rows.length; j = j + 2) {
        informations.push({
          informationType: removeTags(rows[j]?.innerHTML) || '',
          informationValue: removeTags(rows[j + 1]?.innerHTML) || ''
        })
      }

      if (variantTables[i + 1]?.querySelector('th')) {
        rows = variantTables[i + 1].querySelectorAll('tr');

        for (let j = 1; j < rows.length; j++) {
          let row = rows[j]?.querySelectorAll('.confluenceTd');
          if (!row || row.length === 0) continue;
          let offset = 1;

          if (!Number(removeTags(row[0]?.innerHTML)))
            offset = 0;

          fields.push({
            field: row.length >= offset + 1 ? removeTags(row[offset]?.innerHTML) || '' : '',
            required: row.length >= offset + 2 ? convertStringToBool(row[offset + 1]?.innerHTML) : '',
            optional: row.length >= offset + 3 ? convertStringToBool(row[offset + 2]?.innerHTML) : '',
            output: row.length >= offset + 4 ? convertStringToBool(row[offset + 3]?.innerHTML) : '',
            appended: row.length >= offset + 5 ? convertStringToBool(row[offset + 4]?.innerHTML) : ''
          })
        }
      }

      variantsInformation.push({
        informations,
        fields
      })
    }
  }

  return variantsInformation;
}

function scriptUpdateCode(dataSourceName, updateOptions, dataSourceInformation, variants) {
  let countries = dataSourceInformation?.general?.find(x => x.key?.includes('countries'))?.value;
  if (!Array.isArray(countries) || countries.length === 0) {
    countries = ['Global'];
  }
  let countriesEnum = countries.map(x => `(int)CountryEnum.${x}`).join(', ');
  let productType = variants?.[0]?.informations?.find(y => compareString(y.informationType, 'ProductType'))?.informationValue;
  productType = productType?.toLowerCase() === 'kyc' ? 'IdentityVerification' : (productType ? 'KYB' : 'IdentityVerification');

  let datasourceProperties = ''
  let credential = ''
  let variantStr = ''
  let dataSourceConfigParameters = ''
  let datasourceGroupVariants = ''
  let globalVariable = `\t\tprivate const int _datasourceId = DatasourceIds.${dataSourceName};`;

  let I = '\t\t'; // 2 tabs = 8 spaces

  updateOptions?.forEach(option => {
    switch (option) {
      case 'Update variant': {
        let groupName = dataSourceInformation?.general?.find(x => x.key?.includes('datasourcegroupname'))?.value || '';
        let sourceTypeVal = formatString(dataSourceInformation?.general?.find(x => x.key?.includes('sourcetype'))?.value);
        globalVariable += `\n${I}private const string _datasourceGroupName = "${groupName}";`;
        globalVariable += `\n${I}private readonly int[] _countryIds = new[] { ${countriesEnum} };`;
        globalVariable += `\n${I}private const int _productEnum = (int)ProductEnum.${productType};`;
        globalVariable += `\n${I}private const string _sourceType = ${sourceTypeVal};`;

        variantStr = scriptVariant(variants, '\t\t');
        let groupVariantContent = scriptDatasourceGroupVariant(variants, '\t\t\t\t\t');
        datasourceGroupVariants = [
          `\t\t\t\tDatasourceGroupVariants =`,
          `\t\t\t\t[`,
          groupVariantContent,
          `\t\t\t\t]`,
        ].join('\n');
        break;
      }
      case 'Update credential':
        credential = [
          `\t\t\t\t\tCredential = new UpdateDatasourceRequest.CredentialData`,
          `\t\t\t\t\t{`,
          `\t\t\t\t\t\tCredentialFormat = "${dataSourceInformation?.credentials?.map(x => x.key).join(', ') || ''}"`,
          `\t\t\t\t\t},`,
        ].join('\n');
        break;
      case 'Update DSConfig Parameter': {
        if (dataSourceConfigParameters !== '') dataSourceConfigParameters += '\n';

        const configParams = dataSourceInformation?.configParameters || [];
        countries.forEach((x, index) => {
          for (let i = 0; i < configParams.length; i++) {
            let comma = index === countries.length - 1 && configParams.length - 1 === i ? '' : ',';
            let encrypted = configParams[i]?.encrypted ? `,\n                        IsEncrypted = ${configParams[i].encrypted}` : '';
            dataSourceConfigParameters += [
              `\t\t\t\t\tnew DatasourceConfigurationParameterData`,
              `\t\t\t\t\t{`,
              `\t\t\t\t\t\tDatasourceId = _datasourceId,`,
              `\t\t\t\t\t\tName = "${configParams[i]?.key || ''}",`,
              `\t\t\t\t\t\tCountryId = (int)CountryEnum.${x},`,
              `\t\t\t\t\t\tValue = ${configParams[i]?.value || '""'},`,
              `\t\t\t\t\t\tNote = ${configParams[i]?.note || '""'}${encrypted}`,
              `\t\t\t\t\t}${comma}`,
            ].join('\n') + '\n';
          }
        });
        break;
      }
      case 'Update country':
        if (!globalVariable.includes('private readonly int[] _countryIds')) {
          globalVariable += `\n${I}private readonly int[] _countryIds = new[] { ${countriesEnum} };`;
        }

        globalVariable += `\n${I}private const int _commandId = CommandTypeIds.${dataSourceName};`;
        datasourceProperties = [
          `\t\t\t\t\tCountryFields = _countryIds.ToDictionary(key => key, val => new int[0]),`,
          `\t\t\t\t\tCountryIdToCommandId = _countryIds.Select(c => (c, _commandId)).ToArray(),`,
        ].join('\n');
        break;
      default:
        break;
    }
  });

  let datasource = '';
  if (datasourceProperties !== '') {
    datasource = [
      `\t\t\t\t\tDatasource = new UpdateDatasourceRequest.DatasourceIdentificationData(_datasourceId)`,
      `\t\t\t\t\t{`,
      datasourceProperties,
      credential ? `\t\t\t\t\t\t${credential.trimStart()}` : '',
      `\t\t\t\t\t},`,
    ].filter(Boolean).join('\n') + '\n';
  }

  if (dataSourceConfigParameters !== '') {
    dataSourceConfigParameters = [
      `\t\t\t\t\tDatasourceConfigurationParameters =`,
      `\t\t\t\t\t[`,
      dataSourceConfigParameters.trimEnd(),
      `\t\t\t\t\t],`,
    ].join('\n') + '\n';
  }

  return [
    globalVariable,
    variantStr,
    ``,
    `${I}public override async Task UpAsync(IGapiService gapiService)`,
    `${I}{`,
    `${I}\tbool isExist = await gapiService.DatasourceExists(_datasourceId);`,
    `${I}\tif (isExist)`,
    `${I}\t{`,
    `${I}\t\tawait gapiService.UpdateDatasource(new UpdateDatasourceRequest`,
    `${I}\t\t{`,
    datasource + dataSourceConfigParameters + datasourceGroupVariants,
    `${I}\t\t});`,
    `${I}\t}`,
    `${I}}`,
  ].filter(s => s !== undefined).join('\n');
}

function scriptVariant(variantsInformation, indent = '\t\t') {
  let initialVariants = '';

  variantsInformation?.forEach((x, i) => {
    let fieldsStr = '';
    if (!x?.fields || x.fields.length === 0) return;
    let maxFieldLength = x.fields.reduce((max, curr) => {
      return (curr?.field?.length || 0) > (max?.field?.length || 0) ? curr : max;
    })?.field?.length || 0;
    let padLen = maxFieldLength + '(int)FieldEnum.'.length;

    x.fields.forEach((field, j) => {
      let fieldStr = `(int)FieldEnum.${field.field},`;
      let padded = fieldStr.padEnd(padLen + 1);
      fieldsStr += `${indent}    (${padded} ${String(field.required).padEnd(5)}, ${String(field.optional).padEnd(5)}, ${String(field.output).padEnd(5)}, ${field.appended}), // ${j + 1}\n`;
    });

    initialVariants += `\n${indent}// Variant ${i + 1}\n`;
    initialVariants += `${indent}private readonly List<(int fieldId, bool isRequired, bool isOptional, bool isOutput, bool isAppended)> _variant${i + 1} =\n`;
    initialVariants += `${indent}[\n${fieldsStr}${indent}];\n`;
  });

  return initialVariants;
}

function scriptDataSourceInformation(dataSourceInformation, variants, inputDsName) {
  let dataSourceName = inputDsName || removeSpace(dataSourceInformation.general.find(x => x.key.includes('datasourcename'))?.value);
  let countries = dataSourceInformation.general.find(x => x.key.includes('countries'))?.value;
  if (!Array.isArray(countries) || countries.length === 0) {
    countries = ['Global'];
  }
  let countriesEnum = countries.map(x => `(int)CountryEnum.${x}`).join(', ');
  let productType = variants?.[0]?.informations?.find(y => compareString(y.informationType, 'ProductType'))?.informationValue;
  productType = productType?.toLowerCase() === 'kyc' ? 'IdentityVerification' : (productType ? 'KYB' : 'IdentityVerification');

  let groupName = dataSourceInformation.general.find(x => x.key.includes('datasourcegroupname'))?.value || '';
  let sourceType = formatString(dataSourceInformation.general.find(x => x.key.includes('sourcetype'))?.value);

  let I = '\t\t'; // 2 tabs = 8 spaces = class body indent
  let str = [
    `${I}private const int _datasourceId = DatasourceIds.${dataSourceName};`,
    `${I}private const int _commandId = CommandTypeIds.${dataSourceName};`,
    `${I}private const int _productEnum = (int)ProductEnum.${productType};`,
    `${I}private const string _datasourceGroupName = "${groupName}";`,
    `${I}private const string _datasourceName = "${dataSourceName}";`,
    `${I}private const string _commandName = "${dataSourceName}";`,
    `${I}private const string _sourceType = ${sourceType};`,
    `${I}private readonly int[] _countryIds = new[] { ${countriesEnum} };`,
  ].join('\n');

  let credentialFormat = dataSourceInformation.credentials.map(x => x.key).join(', ');
  let dataSourceGroupVariant = scriptDatasourceGroupVariant(variants);
  let dataSourceConfigParametersMethod = '';
  let configAssignment = '';

  let configParams = dataSourceInformation?.configParameters || [];

  if (configParams.length > 0 && countries.length > 1) {
    // --- Multi-country: generate a method with foreach ---
    let configItems = configParams.map(param => {
      let encrypted = param.encrypted ? `,\n\t\t\t\t\t\tIsEncrypted = ${param.encrypted}` : '';
      return `\t\t\t\t\tnew DatasourceConfigurationParameterData\n\t\t\t\t\t{\n\t\t\t\t\t\tDatasourceId = _datasourceId,\n\t\t\t\t\t\tName = "${param.key}",\n\t\t\t\t\t\tCountryId = countryId,\n\t\t\t\t\t\tValue = ${param.value},\n\t\t\t\t\t\tNote = ${param.note}${encrypted}\n\t\t\t\t\t}`;
    }).join(',\n');

    dataSourceConfigParametersMethod = `\t\tpublic List<DatasourceConfigurationParameterData> getDatasourceConfigurationParameters()\n\t\t{\n\t\t\tList<DatasourceConfigurationParameterData> configurationParameters = new();\n\n\t\t\tforeach (int countryId in _countryIds)\n\t\t\t{\n\t\t\t\tconfigurationParameters.AddRange(\n\t\t\t\t[\n${configItems}\n\t\t\t\t]);\n\t\t\t}\n\n\t\t\treturn configurationParameters;\n\t\t}\n`;

    configAssignment = `\t\t\tDatasourceConfigurationParameters = getDatasourceConfigurationParameters().ToArray();`;
  } else if (configParams.length > 0) {
    // --- Single country: inline array ---
    let singleCountry = countries[0];
    let configItems = configParams.map((param, i) => {
      let encrypted = param.encrypted ? `,\n\t\t\t\t\tIsEncrypted = ${param.encrypted}` : '';
      let comma = i === configParams.length - 1 ? '' : ',';
      return `\t\t\t\tnew DatasourceConfigurationParameterData\n\t\t\t\t{\n\t\t\t\t\tDatasourceId = _datasourceId,\n\t\t\t\t\tName = "${param.key}",\n\t\t\t\t\tCountryId = (int)CountryEnum.${singleCountry},\n\t\t\t\t\tValue = ${param.value},\n\t\t\t\t\tNote = ${param.note}${encrypted}\n\t\t\t\t}${comma}`;
    }).join('\n');

    configAssignment = `\t\t\tDatasourceConfigurationParameters =\n\t\t\t[\n${configItems}\n\t\t\t];`;
  }

  let constructor = [
    `\t\tpublic ${dataSourceName}()`,
    `\t\t{`,
    `\t\t\tIAppSettingsHelper appSettingsHelper = Gateway.Common.ObjectFactory.GetInstance<IAppSettingsHelper>();`,
    ``,
    `\t\t\tDatasource = new DatasourceIdentificationData`,
    `\t\t\t{`,
    `\t\t\t\tDatasourceId = _datasourceId,`,
    `\t\t\t\tDatasourceName = _datasourceName,`,
    `\t\t\t\tCommandId = _commandId,`,
    `\t\t\t\tCommandName = _commandName,`,
    `\t\t\t\tIndustries = Enum.GetValues(typeof(IndustryEnum)).Cast<IndustryEnum>().Select(x => (int)x).ToArray(),`,
    `\t\t\t\tIsTestable = true,`,
    `\t\t\t\tAllowAppendData = true,`,
    `\t\t\t\tCountryFields = _countryIds.ToDictionary(countryId => countryId, countryId => Array.Empty<int>()),`,
    `\t\t\t\tProductList = [_productEnum],`,
    `\t\t\t\tCredential = new CredentialData`,
    `\t\t\t\t{`,
    `\t\t\t\t\tUserName = appSettingsHelper.GetString("${dataSourceName}.Username"),`,
    `\t\t\t\t\tPassword = appSettingsHelper.GetString("${dataSourceName}.Password"),`,
    `\t\t\t\t\tEndpointUrl = appSettingsHelper.GetString("${dataSourceName}.EndpointUrl"),`,
    `\t\t\t\t\tTestUserName = appSettingsHelper.GetString("${dataSourceName}.TestUsername"),`,
    `\t\t\t\t\tTestPassword = appSettingsHelper.GetString("${dataSourceName}.TestPassword"),`,
    `\t\t\t\t\tTestEndpointUrl = appSettingsHelper.GetString("${dataSourceName}.TestEndpointUrl"),`,
    `\t\t\t\t\tCredentialFormat = "${credentialFormat}"`,
    `\t\t\t\t}`,
    `\t\t\t};`,
    ``,
    configAssignment,
    ``,
    `\t\t\tDatasourceGroupVariants =`,
    `\t\t\t[`,
    dataSourceGroupVariant,
    `\t\t\t];`,
    `\t\t}`,
  ].join('\n');

  let variantScript = scriptVariant(variants);

  let namespaceName = countries.length > 1 ? 'Global' : (COUNTRY_MAP[countries[0]] || 'Global');

  return [
    `using CommandProxy.Shared.External;`,
    `using CommandProxy.Shared.Lookups;`,
    `using CommonUpdates.Entities;`,
    `using Gateway.Common.Interfaces;`,
    `using System;`,
    `using System.Collections.Generic;`,
    `using System.Linq;`,
    `using Trulioo.GlobalGateway.Core.Enums;\n`,
    `namespace CommonUpdates.Datasources.${namespaceName}`,
    `{`,
    `\tpublic class ${dataSourceName} : CreateDatasourceRequest`,
    `\t{`,
    str,
    variantScript,
    dataSourceConfigParametersMethod,
    constructor,
    `\t}`,
    `}`,
  ].filter(s => s !== '').join('\n');
}

function scriptDatasourceGroupVariant(variants, indent = '\t\t\t\t') {
  if (!variants?.length) return '';

  return variants.map((v, i) => {
    let infos = v?.informations || [];
    let addressFormat = infos.find(y => compareString(removeSpace(y?.informationType), 'AddressFormat'))?.informationValue || 'Null';
    let nameFormat = infos.find(y => compareString(removeSpace(y?.informationType), 'NameFormat'))?.informationValue || 'Null';
    let priority = convertStringToBool(infos.find(y => compareString(y?.informationType, 'Priority'))?.informationValue);
    let notes = infos.find(y => compareString(y?.informationType, 'Note'))?.informationValue || '';

    return `${indent}new DynamicDatasourceGroupVariantData
${indent}{
${indent}\tDatasourceGroupName = _datasourceGroupName,
${indent}\tDatasourceId = _datasourceId,
${indent}\tProductId = _productEnum,
${indent}\tFields = _variant${i + 1}.Select(x => x.fieldId).ToArray(),
${indent}\tCountryIds = _countryIds,
${indent}\tRequiredFields = [.._variant${i + 1}.Where(f => f.isRequired).Select(x => x.fieldId)],
${indent}\tOptionalFields = [.._variant${i + 1}.Where(f => f.isOptional).Select(x => x.fieldId)],
${indent}\tOutputFields = [.._variant${i + 1}.Where(f => f.isOutput).Select(x => x.fieldId)],
${indent}\tAppendedFields = [.._variant${i + 1}.Where(f => f.isAppended).Select(x => x.fieldId)],
${indent}\tSourceType = _sourceType,
${indent}\tPriority = ${priority},
${indent}\tAddressFormat = (int)AddressFormatEnum.${addressFormat},
${indent}\tNameFormat = (int)NameFormatEnum.${nameFormat},
${indent}\tNotes = "${notes}"
${indent}}`;
  }).join(',\n');
}

function getDataBlock(keyword) {
  let columnLayouts = document.querySelectorAll('.columnLayout h2');
  return Object.keys(columnLayouts)
    ?.map((key) => columnLayouts[key])
    ?.filter(x => x.innerHTML.toLowerCase().includes(keyword.toLowerCase()));
}

function getNewUIVariantBlock() {
  return [...document.querySelectorAll('.panelContent')]
    .filter(el => {
      const text = el.innerText;
      return text.includes('Name Format') && text.includes('Address Format');
    });
}