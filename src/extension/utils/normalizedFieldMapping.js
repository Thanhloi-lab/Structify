export const RAW_MAPPING = {
  FirstGivenName: "FirstGivenName,FirstInitial,FirstName,GivenNames,viGivenNames,ppGivenNames,MothersFirstNames,FathersFirstNames",
  MiddleName: "MiddleName,MiddleInitial",
  FirstSurName: "FirstSurName,FirstSurname,LastName,Surname,viFamilyName,ppFamilyName,FamilyNameAtBirth,FamilyNameAtCitizenship,MothersLastName,FathersLastName",
  SecondSurname: "SecondSurname",
  FullName: "FullName,mdFullName,ISOLatin1Name,PassportFullName,OtherNames",

  Address1: "Address1,Address1Standard,SecondAddress1",
  Address2: "Address2,Address2Standard,SecondAddress2",
  AddressCountryCode: "AddressCountryCode",
  AddressCountryName: "AddressCountryName",
  City: "City,CityStandard,Municipality,SecondCity,CityOfIssue",
  Suburb: "Suburb,Aza,SecondSuburb",
  StateProvinceCode: "StateProvinceCode,Prefecture,Province,ProvinceCode,State,StateProvince,StateProvinceStandard,SecondState,RegistrationState,StateOfBirth,ProvinceOfBirth,ProvinceOfIssue,ItIdDocumentProvinceOfIssue",
  PostalCode: "PostalCode,SecondPostalCode",
  BuildingNumber: "BuildingNumber,AreaNumbers,CivicNumber,HouseNumber,StreetNumber,SecondBuildingNumber",
  BuildingName: "BuildingName,SecondBuildingName",
  StreetName: "StreetName,SecondStreetName,DependentStreetName",
  StreetType: "StreetType,SecondStreetType,DependentStreetType",
  UnitNumber: "UnitNumber,SecondUnitNumber",
  FloorNumber: "FloorNumber",
  BlockNumber: "BlockNumber",
  PropertyName: "PropertyName,PropertyName2,SecondPropertyName,SecondPropertyName2",
  POBox: "POBox",

  DayOfBirth: "DayOfBirth,DayOfIssue,DayOfPrint,DayOfIncorporation,DayStarted,CitizenshipAcquisitionDay,DriverLicenceDayOfExpiry,MedicareDayOfExpiry,ItIdDocumentDayOfIssue,LastUpdateDay,PassportDayOfExpiry",
  MonthOfBirth: "MonthOfBirth,MonthOfIssue,MonthOfPrint,MonthOfIncorporation,MonthStarted,CitizenshipAcquisitionMonth,DriverLicenceMonthOfExpiry,MedicareMonthOfExpiry,ItIdDocumentMonthOfIssue,LastUpdateMonth,PassportMonthOfExpiry,Month",
  YearOfBirth: "YearOfBirth,YearOfIssue,YearOfPrint,YearOfIncorporation,YearStarted,YearOfDeath,CitizenshipAcquisitionYear,DriverLicenceYearOfExpiry,MedicareYearOfExpiry,ItIdDocumentYearOfIssue,LastUpdateYear,PassportYearOfExpiry,RegistrationYear",

  Telephone: "Telephone,HomeTelephoneNumber,WorkTelephone,WorkTelephoneNumber,FacsimileNumber,Phone,Telephone2,MobileNumber,CellNumber",

  EmailAddress: "EmailAddress,Email,ValidEmail",
  EmailDiagnostics: "EmailDiagnostics",
  EmailDomainCreationDays: "EmailDomainCreationDays",

  PassportNumber: "PassportNumber,PassportSerie,InternalPassportNumber,ItIdDocumentNumber,DocumentNumber,CertificateNumber,RTACardNumber,DriverLicenceNumber,DriverLicenceCardNumber,AccountNumber,BankAccountNumber,AuImmiCardNumber,health,MedicareNumber,NHSNumber,NationalIDNumber,NRICNumber,NricNumber,PinNumber,CURPIDNumber,FinlandPersonalIdentityCode,HongKongIDNumber,InseeNumber,SocialInsuranceNumber,SocialSecurityNumber,TaxFileNumber,TaxIDNumber,TaxIDNumbers,TaxIDNumberName,DUNSNumber,RegistrationNumber,StockNumber,SerialNumber,SortCode,VoterId",

  IP: "IP,IPAddress,ValidIPAddress",

  BusinessName: "BusinessName,TradestyleName",
  BusinessIDNumber: "BusinessIDNumber,BusinessRegistrationNumber",
  BusinessIDType: "BusinessIDType",
  BusinessActivities: "BusinessActivities",
  JurisdictionOfIncorporation: "JurisdictionOfIncorporation,HomeJurisdiction",
  LocalActivityType: "LocalActivityType,PrimaryLocalActivityCode,SecondaryLocalActivityCode",
  LegalStatus: "LegalStatus",

  Latitude: "Latitude",
  Longitude: "Longitude",

  Gender: "Gender",
  NameOnCard: "NameOnCard",
  LivePhoto: "LivePhoto",
  DocumentType: "DocumentType,ItIdDocumentType",
  DocumentSeries: "DocumentSeries",
  FraudMessage: "FraudMessage",
  CallbackUrl: "CallbackUrl",
  Prefix: "Prefix",
  MinimumAge: "MinimumAge",
  ScheduleFrequency: "ScheduleFrequency",
  Region: "Region,SubRegion",
  County: "County,District,SecondCounty,CountyOfIssue,DistrictOfIssue",
  Country: "Country,CountryOfBirth,ItIdDocumentCountryOfIssue,PassportCountry",
  
  PassportMRZLine1:"PassportMRZLine1",
  PassportMRZLine2:"PassportMRZLine2"
};

const uniq = (arr) => Array.from(new Set(arr.filter(Boolean)));
const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const getMappingTable = (() => {
  // {fieldAlias: [{normalizedKey:"FirstSurName", "aliases":"FirstName", "GivenName" }]}
  const fieldAlias = []

  for (const [normalizedKey, names] of Object.entries(RAW_MAPPING)) {
    const arr = Array.isArray(names)
      ? names
      : String(names).split(",").map(s => norm(s)).filter(Boolean);

    const aliases = uniq([normalizedKey, ...arr]);

    fieldAlias.push({ normalizedKey: normalizedKey, aliases: aliases })
  }

  return fieldAlias;
})

export const getNormalizedKeyByFieldName = (fieldName) => {
  const mappingTable = getMappingTable();
  return mappingTable.find(x => x.aliases?.includes(norm(fieldName)))?.normalizedKey ?? null;
}