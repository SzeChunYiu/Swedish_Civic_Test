export type CitizenshipRequirementLanguage = 'sv' | 'en';

export type CitizenshipRequirementAreaId =
  | 'identity'
  | 'residenceStatus'
  | 'habitualResidence'
  | 'conduct'
  | 'selfSupport'
  | 'civicKnowledge'
  | 'swedishLanguage';

export type CitizenshipRequirementSourceId =
  | 'migrationsverketAdultApplication'
  | 'migrationsverketRules2026'
  | 'uhrCivicTestOverview'
  | 'uhrCivicTestRegistration'
  | 'uhrCivicStudyMaterial'
  | 'governmentCivicTestSchedule'
  | 'governmentIncomeBaseAmount2026';

export type CitizenshipRequirementText = Record<CitizenshipRequirementLanguage, string>;

export type CitizenshipRequirementSource = {
  readonly id: CitizenshipRequirementSourceId;
  readonly publisher: string;
  readonly title: CitizenshipRequirementText;
  readonly url: string;
  readonly sourceDate?: string;
  readonly retrievedDate: string;
};

export type CitizenshipRequirementArea = {
  readonly id: CitizenshipRequirementAreaId;
  readonly order: number;
  readonly badge: CitizenshipRequirementText;
  readonly title: CitizenshipRequirementText;
  readonly summary: CitizenshipRequirementText;
  readonly detail: CitizenshipRequirementText;
  readonly checklistPrompt: CitizenshipRequirementText;
  readonly sourceIds: readonly CitizenshipRequirementSourceId[];
};

export const CITIZENSHIP_REQUIREMENTS_RETRIEVED_DATE = '2026-05-19';
export const CITIZENSHIP_REQUIREMENTS_EFFECTIVE_DATE = '2026-06-06';
export const CITIZENSHIP_CIVIC_TEST_FIRST_DATE = '2026-08-15';
export const CITIZENSHIP_CIVIC_KNOWLEDGE_TEST_DEADLINE_DATE = '2026-08-17';
export const CITIZENSHIP_SWEDISH_READING_LISTENING_DEADLINE_DATE = '2027-10-01';
export const CITIZENSHIP_REQUIREMENTS_INCOME_BASE_AMOUNT_2026_SEK = 83400;
export const CITIZENSHIP_REQUIREMENTS_SELF_SUPPORT_YEARLY_SEK_2026 =
  CITIZENSHIP_REQUIREMENTS_INCOME_BASE_AMOUNT_2026_SEK * 3;

export const citizenshipRequirementSources = [
  {
    id: 'migrationsverketAdultApplication',
    publisher: 'Migrationsverket',
    title: {
      sv: 'Ansök om svenskt medborgarskap',
      en: 'Apply for Swedish citizenship',
    },
    url: 'https://www.migrationsverket.se/du-vill-ansoka/svenskt-medborgarskap/medborgarskap-for-vuxna/medborgarskap-for-vuxna.html',
    retrievedDate: CITIZENSHIP_REQUIREMENTS_RETRIEVED_DATE,
  },
  {
    id: 'migrationsverketRules2026',
    publisher: 'Migrationsverket',
    title: {
      sv: 'Nya regler för svenskt medborgarskap från 6 juni 2026',
      en: 'New rules for Swedish citizenship from 6 June 2026',
    },
    url: 'https://www.migrationsverket.se/nyheter/nyhetsarkiv/2026-05-06-nya-regler-for-svenskt-medborgarskap-fran-6-juni-2026.html',
    sourceDate: '2026-05-06',
    retrievedDate: CITIZENSHIP_REQUIREMENTS_RETRIEVED_DATE,
  },
  {
    id: 'uhrCivicTestOverview',
    publisher: 'Universitets- och högskolerådet',
    title: {
      sv: 'Om medborgarskapsprovet',
      en: 'About the citizenship test',
    },
    url: 'https://www.uhr.se/medborgarskapsprovet/om-medborgarskapsprovet/',
    sourceDate: '2026-05-06',
    retrievedDate: CITIZENSHIP_REQUIREMENTS_RETRIEVED_DATE,
  },
  {
    id: 'uhrCivicTestRegistration',
    publisher: 'Universitets- och högskolerådet',
    title: {
      sv: 'Anmälan till medborgarskapsprovet',
      en: 'Registration for the citizenship test',
    },
    url: 'https://www.uhr.se/medborgarskapsprovet/anmalan/',
    sourceDate: '2026-05-06',
    retrievedDate: CITIZENSHIP_REQUIREMENTS_RETRIEVED_DATE,
  },
  {
    id: 'uhrCivicStudyMaterial',
    publisher: 'Universitets- och högskolerådet',
    title: {
      sv: 'Utbildningsmaterial om det svenska samhället',
      en: 'Study material about Swedish society',
    },
    url: 'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/',
    sourceDate: '2026-05-19',
    retrievedDate: CITIZENSHIP_REQUIREMENTS_RETRIEVED_DATE,
  },
  {
    id: 'governmentCivicTestSchedule',
    publisher: 'Regeringen',
    title: {
      sv: 'Ändrat uppdrag för medborgarskapsprovet',
      en: 'Updated assignment for the citizenship test',
    },
    url: 'https://www.regeringen.se/regeringsuppdrag/2026/02/andring-av-uppdraget-till-goteborgs-universitet-och-stockholms-universitet-att-bista-universitets--och-hogskoleradet-med-utvecklingen-av-ett-medborgarskapsprov/',
    sourceDate: '2026-02-06',
    retrievedDate: CITIZENSHIP_REQUIREMENTS_RETRIEVED_DATE,
  },
  {
    id: 'governmentIncomeBaseAmount2026',
    publisher: 'Regeringen',
    title: {
      sv: 'Inkomstbasbelopp och inkomstindex för år 2026 fastställt',
      en: 'Income base amount and income index for 2026 set',
    },
    url: 'https://www.regeringen.se/artiklar/2025/11/inkomstbasbelopp-och-inkomstindex-for-ar-2026-faststallt/',
    sourceDate: '2025-11-06',
    retrievedDate: CITIZENSHIP_REQUIREMENTS_RETRIEVED_DATE,
  },
] as const satisfies readonly CitizenshipRequirementSource[];

export const citizenshipRequirementAreas = [
  {
    id: 'identity',
    order: 1,
    badge: { sv: 'Identitet', en: 'Identity' },
    title: { sv: 'Styrkt identitet', en: 'Proven identity' },
    summary: {
      sv: 'Du behöver kunna styrka vem du är innan Migrationsverket kan pröva ansökan.',
      en: 'You need to prove who you are before Migrationsverket can assess the application.',
    },
    detail: {
      sv: 'Huvudregeln är att identiteten styrks med identitetshandling och personligt besök. Om identiteten inte kan styrkas kan medborgarskap normalt bli aktuellt tidigast efter 10 år i Sverige.',
      en: 'The main route is to prove identity with an identity document and an in-person visit. If identity cannot be proven, citizenship can normally become possible no earlier than after 10 years in Sweden.',
    },
    checklistPrompt: {
      sv: 'Jag kan styrka min identitet eller har kontrollerat vilken undantagsväg som gäller.',
      en: 'I can prove my identity or have checked which exception route applies.',
    },
    sourceIds: ['migrationsverketAdultApplication', 'migrationsverketRules2026'],
  },
  {
    id: 'residenceStatus',
    order: 2,
    badge: { sv: 'Status', en: 'Status' },
    title: { sv: 'Permanent grund för vistelse', en: 'Permanent basis for residence' },
    summary: {
      sv: 'Vuxna sökande behöver normalt permanent uppehållstillstånd, uppehållsstatus, uppehållsrätt eller nordiskt medborgarskap.',
      en: 'Adult applicants normally need a permanent residence permit, residence status, right of residence, or Nordic citizenship.',
    },
    detail: {
      sv: 'Checklistan skiljer på ansökningsplanering och myndighetsbeslut: markera bara punkten om du har sett vilken kategori du tillhör på Migrationsverkets aktuella sida.',
      en: "This checklist separates planning from the authority's decision: only mark this if you have checked which category applies to you on Migrationsverket's current page.",
    },
    checklistPrompt: {
      sv: 'Jag har kontrollerat att min vistelsestatus uppfyller rätt kategori.',
      en: 'I have checked that my residence status fits the right category.',
    },
    sourceIds: ['migrationsverketAdultApplication'],
  },
  {
    id: 'habitualResidence',
    order: 3,
    badge: { sv: 'Hemvist', en: 'Residence' },
    title: { sv: 'Hemvisttid i Sverige', en: 'Habitual residence in Sweden' },
    summary: {
      sv: 'Från 6 juni 2026 är huvudregeln minst 8 års hemvist för vuxna sökande.',
      en: 'From 6 June 2026, the main rule is at least 8 years of habitual residence for adult applicants.',
    },
    detail: {
      sv: 'Vissa grupper har andra tidsgränser, till exempel nordiska medborgare, statslösa personer, flyktingar och personer med svensk partner. Migrationsverket avgör vilken tidsgräns som gäller i ditt ärende.',
      en: 'Some groups have different time limits, including Nordic citizens, stateless people, refugees, and people with a Swedish partner. Migrationsverket decides which time limit applies in your case.',
    },
    checklistPrompt: {
      sv: 'Jag har räknat min hemvisttid enligt den grupp som gäller för mig.',
      en: 'I have counted my residence time using the group that applies to me.',
    },
    sourceIds: ['migrationsverketRules2026'],
  },
  {
    id: 'conduct',
    order: 4,
    badge: { sv: 'Skötsamhet', en: 'Conduct' },
    title: { sv: 'Skötsamt och hederligt levnadssätt', en: 'Orderly and honest conduct' },
    summary: {
      sv: 'Kravet på skötsamhet skärps, och brott kan innebära längre karenstid innan medborgarskap kan beviljas.',
      en: 'The conduct requirement becomes stricter, and offences can mean a longer waiting period before citizenship can be granted.',
    },
    detail: {
      sv: 'Det här är inte en ja-eller-nej-fråga som appen kan avgöra. Använd punkten som en påminnelse om att kontrollera karenstid och övriga omständigheter hos Migrationsverket.',
      en: 'This is not a yes-or-no question the app can decide. Use this item as a reminder to check waiting periods and other circumstances with Migrationsverket.',
    },
    checklistPrompt: {
      sv: 'Jag har kontrollerat om skötsamhetskravet påverkar min tidsplan.',
      en: 'I have checked whether the conduct requirement affects my timeline.',
    },
    sourceIds: ['migrationsverketRules2026', 'migrationsverketAdultApplication'],
  },
  {
    id: 'selfSupport',
    order: 5,
    badge: { sv: 'Försörjning', en: 'Support' },
    title: { sv: 'Egen försörjning', en: 'Self-support' },
    summary: {
      sv: 'Från 6 juni 2026 behöver vuxna sökande normalt egen varaktig inkomst på minst 250 200 kronor per år enligt 2026 års inkomstbasbelopp.',
      en: 'From 6 June 2026, adult applicants normally need their own long-term income of at least SEK 250,200 per year using the 2026 income base amount.',
    },
    detail: {
      sv: 'Beloppet motsvarar tre inkomstbasbelopp. Kraven gäller också varaktig inkomst från arbete eller näringsverksamhet, stabilitet över tid och högst sex månaders försörjningsstöd under de senaste tre åren. Inkomster från partner, tillgångar som sparande eller fastigheter och tillfälliga anställningar utan varaktighet kan inte räknas.',
      en: 'The amount equals three income base amounts. The requirements also cover long-term income from work or self-employment, stability over time, and no more than six months of income support during the past three years. Partner income, assets such as savings or property, and temporary jobs without long-term duration cannot be counted.',
    },
    checklistPrompt: {
      sv: 'Jag har kontrollerat egen inkomst, varaktighet och försörjningsstöd mot de nya reglerna.',
      en: 'I have checked my own income, its duration, and income support against the new rules.',
    },
    sourceIds: ['migrationsverketRules2026', 'governmentIncomeBaseAmount2026'],
  },
  {
    id: 'civicKnowledge',
    order: 6,
    badge: { sv: 'Samhällskunskap', en: 'Civic knowledge' },
    title: {
      sv: 'Medborgarskapsprov i samhällskunskap',
      en: 'Citizenship test in civic knowledge',
    },
    summary: {
      sv: 'Den första provdelen gäller grundläggande kunskaper om det svenska samhället och genomförs första gången den 15 augusti 2026 i Stockholm.',
      en: 'The first test part covers basic knowledge of Swedish society and is held for the first time on 15 August 2026 in Stockholm.',
    },
    detail: {
      sv: 'UHR ansvarar för provet och utbildningsmaterialet. Du kan bara anmäla dig när Migrationsverket har skickat brev. Antalet platser är begränsat, och när platserna är fyllda går det inte längre att anmäla sig. Anmälan öppnar i början av juni 2026.',
      en: 'UHR is responsible for the test and study material. You can only register after Migrationsverket has sent you a letter. Seats are limited, and when the seats are filled, registration closes. Registration opens in early June 2026.',
    },
    checklistPrompt: {
      sv: 'Jag vet om jag behöver samhällskunskapsprovet och har hittat UHR:s material.',
      en: "I know whether I need the civic knowledge test and have found UHR's material.",
    },
    sourceIds: [
      'uhrCivicTestOverview',
      'uhrCivicTestRegistration',
      'uhrCivicStudyMaterial',
      'governmentCivicTestSchedule',
    ],
  },
  {
    id: 'swedishLanguage',
    order: 7,
    badge: { sv: 'Svenska', en: 'Swedish' },
    title: { sv: 'Kunskaper i svenska', en: 'Knowledge of Swedish' },
    summary: {
      sv: 'Kunskapskravet gäller 16-66 år från 6 juni 2026, men proven i svenska införs senare än samhällskunskapsprovet.',
      en: 'The knowledge requirement applies ages 16-66 from 6 June 2026, but Swedish-language tests are introduced later than the civic knowledge test.',
    },
    detail: {
      sv: 'Kunskaper kan visas med exempelvis betyg, komvux, folkhögskola eller SFI kurs D. Regeringens uppdrag anger prov i läs- och hörförståelse senast 1 oktober 2027 och skriftlig samt muntlig färdighet därefter.',
      en: 'Knowledge can be shown through grades, adult education, folk high school, or SFI course D. The Government assignment sets reading and listening tests by 1 October 2027, with written and oral proficiency after that.',
    },
    checklistPrompt: {
      sv: 'Jag har kontrollerat hur jag kan visa svenska eller när språkprov kan bli aktuellt.',
      en: 'I have checked how I can prove Swedish skills or when language tests may become relevant.',
    },
    sourceIds: ['migrationsverketRules2026', 'uhrCivicTestOverview', 'governmentCivicTestSchedule'],
  },
] as const satisfies readonly CitizenshipRequirementArea[];
