'use strict';

const GENERATED_TRUE_FALSE_NATURALNESS_PATTERNS = [
  /\bDet stämmer i sak att\b/i,
  /\bIt is factually true that\b/i,
  /\bDet stämmer att\s+(?:Ungefär|Havet)\b/i,
  /\bIt is true that\s+(?:The|In|Approximately)\b/i,
  /\bbetyder att politikerna måste (?:inte|alltid) följa resultatet\b/i,
  /\bbelongs to\s+[a-zåäö][^.,"]*/i,
  /\bhör till\s+[a-zåäö][^.,"]*/i,
  /\b(?:Det är korrekt att\s+)?(?:Det att|Svaret är)\b/i,
  /\b(?:It is correct that\s+)?(?:the answer is)\b/i,
  /\bdescribes that\b/i,
  /\btillåtet att gifta sig\b/i,
  /\bwhen false information affects democracy\b/i,
  /\bnär falsk information påverkar demokratin\b/i,
  /\bis\s+(?:be|judge)\b/i,
  /\bis an example of municipal responsibilities\b/i,
  /\b(?:has one vote each|may stand for election)\s+is part of\b/i,
  /\b(?:har en röst var|får ställa upp)\s+ingår i\b/i,
  /\bis a way to\b/i,
  /\bär ett sätt att\b/i,
  /\bapplies to\b/i,
  /\bgäller för\b/i,
  /\bare The\b/,
  /^That hitting children is prohibited\b/i,
  /\bdescribes\s+(?:government agencies|legal certainty|the role|an important role|Sweden two hundred years ago)\b/i,
  /\bbeskriver\s+(?:statliga myndigheter|rättssäkerhet|polisens uppgift|en viktig uppgift|Sverige för tvåhundra år sedan)\b/i,
  /\bis the list that contains\b/i,
  /\bär listan som innehåller\b/i,
  /\babout public power in Sweden\b/i,
  /\bom offentlig makt i Sverige\b/i,
  /\bmeans it gives\b/i,
  /\b(?:Att folkomröstningar i Sverige är rådgivande betyder att|That referendums in Sweden are advisory means)\b/i,
  /\b(?:Att mänskliga rättigheter gäller alla betyder att|That human rights apply to everyone means)\b/i,
  /^Att vara källkritisk betyder\b/i,
  /^To be source-critical means\b/i,
  /\b(?:The goal of .+?\bpolicy means(?: that)?|Målet med .+?politik(?:en)? betyder att)\b/i,
  /\bThe public sector in Sweden means\b/i,
  /\b(?:har uppgiften att|has the task to|One task of .+? is to)\b/i,
  /\binnebär att den ger\b/i,
  /^Viktiga verksamheter som skola, arbete och hälso- och sjukvård kan fortsätta fungera\.?$/i,
  /^Important activities such as school, work, and health care can continue to function\.?$/i,
  /^Politiska val ersätts med militära beslut\.?$/i,
  /^Political elections are replaced with military decisions\.?$/i,
  /\bfrom (?:13|15) years\b/i,
  /^En anledning är\b/i,
  /^One reason is\b/i,
  /^One reason is to (?:prevent war|decide Swedish municipal taxes)\b/i,
  /^En anledning är att (?:förhindra krig|bestämma svenska kommunalskatter)\b/i,
  /^En anledning är(?: att)? (?:skydda anställdas rättigheter|bestämma vem som blir statschef|bättre jordbruksmetoder|EU-medlemskapet)\b/i,
  /^It was presented in (?:1918|1948)\b/i,
  /^Den presenterades (?:1918|1948)\b/i,
  /^One reason is (?:to (?:protect employees|decide who becomes head of state)|better farming methods|EU membership|eU membership)\b/i,
  /^En anledning är att (?:valet är hemligt|rösterna ska räknas snabbare)\b/i,
  /^One reason is (?:the vote is secret|votes are counted faster)\b/i,
  /^En myndighet som\b/i,
  /^An authority that\b/i,
  /\beU membership\b/,
  /\bOne reason is that so\b/i,
  /^En anledning är att Sverige (?:hade|saknade)\b/,
  /^One reason is that Sweden had\b/,
  /^En anledning är att Det\b/,
  /^One reason is that It\b/,
  /\bhave\s+[^.?!]*\bin common\b/i,
  /\bhar\s+[^.?!]*\bgemensamt\b/i,
  /\bhave they\b/i,
  /\bhar de\b/i,
  /\bcommon to\s+(?:eating|lighting|opening|holding)\b/i,
  /\bcelebrates The\b/,
  /\bfirar traditionellt (?!Jesu födelse\b)[A-ZÅÄÖ]/,
  /\bfirar traditionellt jesu födelse\b/,
  /\bcelebrates jesus' birth\b/,
  /^(?:By|Apply|Leave|Live)\b/i,
  /^(?:Genom att|Representera\b|Arbeta\s|Bo i landet|Lämna Svenska|Samarbetet mellan|Nordiska rådet|Riksdagen och|Islam\.|Jul\.|Påsk\.|Julotta\.|Bön,|[0-9]{4}\.)/i,
  /\bPåståendet är sant:/i,
  /\bThe statement is true:/i,
  /\b(?:Det är inte sant att|Det stämmer inte att|Det stämmer att)\b/i,
  /\b(?:It is not true that|It is true that)\b/i,
  /^Det är (?:brottsligt enligt svensk lag|alltid en privat familjefråga)/i,
  /^Sverige beslutade att barnkonventionen blev svensk lag\b/i,
  /\bär (?:Judar|Danskar),/,
  /^(?:De|They) (?:företräder|bestämmer|represent|decide)\b/i,
  /\batt Kungens makt\b/,
  /\bför Samarbetet mellan\b/,
  /\bfor Cooperation between\b/,
  /\bhar förändrat bara hur\b/i,
  /\bhas changed only how\b/i,
  /\barbetar för endast\b/i,
  /\bworks for only\b/i,
  /\b(?:den näst största i Sverige|the second largest in Sweden)\b/i,
  /,\s*,/,
  /\bit is common to large bonfires\b/i,
  /\bbrukar\s+\S+\s+arrangerar\b/i,
  /\bbrukar\s+[^.?!]*\s+arrangerar\b/i,
  /\b(?:spreadinging|welcominging)\b/i,
  /\bAdvent occurs (?:the four Sundays|a Saturday)\b/i,
  /\bTravel to Asia and increased interest[^.?!]*\bis mentioned\b/i,
  /^That Sweden's first mosques were built\b/i,
  /\bthere are buddhist and Hindu\b/,
  /\bcalled Lucia procession\b/i,
  /^En (?:ljuskrona|blomsterkrans) på huvudet\.?$/i,
  /\b(?:fram till julafton|på kvällen)\s+med en adventskalender hemma\b/i,
  /\b(?:until Christmas Eve|in the evening)\s+with an Advent calendar at home\b/i,
  /\bMany people voting, getting involved, and learning about social issues\b/i,
  /\bFewer people taking part in elections\b/i,
  /\bPeople with different backgrounds and economic situations living closer\b/i,
  /\bPeople living completely separated by income or ethnic background\b/i,
  /^Försöka övertyga andra om sina politiska idéer\.?$/i,
  /^Hindra andra från att rösta\.?$/i,
  /^Try to persuade others of their political ideas\.?$/i,
  /^Stop others from voting\.?$/i,
  /^Light candles on graves to remember and honour people who have died\.?$/i,
  /^Open an Advent calendar every day until Christmas Eve\.?$/i,
  /^Vårdcentraler, barnavårdscentraler och mödravårdscentraler\.?$/i,
  /^Domstolar, åklagare och kriminalvård\.?$/i,
  /^Health centres, child health centres, and maternity clinics\.?$/i,
  /^Courts, prosecutors, and prison and probation services\.?$/i,
  /^Ordna förskolor, fritidshem, grundskolor och gymnasieskolor\.?$/i,
  /^Betala sjukförsäkring och statliga pensioner\.?$/i,
  /^Arrange preschools, after-school centres, compulsory schools, and upper-secondary schools\.?$/i,
  /^Pay sickness insurance and state pensions\.?$/i,
  /^Vård och service hemma eller boende som är anpassat för äldre personer\.?$/i,
  /^Automatiskt studiestöd och plats på universitet\.?$/i,
  /^Care and services at home or housing adapted for older people\.?$/i,
  /^Automatic study support and a university place\.?$/i,
  /\bskyddar rätten [^.?!]* och skydd mot\b/i,
  /\bprotects the right [^.?!]* and protection from\b/i,
  /\bskyddar att staten väljer\b/i,
  /\bprotects that the state chooses\b/i,
  /\bMånga svenskar firar id al-fitr och Newroz även om\b/i,
  /\bMany Swedes celebrate Eid al-Fitr and Newroz even if\b/i,
  /\bfick rätt att bo i landet och utöva\b/i,
  /\bgained the right to live in the country and practice\b/i,
  /\bnär ett lågt valdeltagande påverkar demokratin\b/i,
  /\bwhen a low voter turnout affects democracy\b/i,
  /\bnär\s+[^.?!]+?\spåverkar\s+[^.?!]+/i,
  /\bwhen\s+[^.?!]+?\saffects\s+[^.?!]+/i,
  /^De säljer reklamplats eller tar betalt för en särskild kanal\.?$/i,
  /^They sell advertising space or charge for a specific channel\.?$/i,
  /^Genom domstolsavgifter från rättegångar\.?$/i,
  /^Through court fees from trials\.?$/i,
  /^De drivs ofta av privata företag och får inkomster genom reklam\.?$/i,
  /^They are often run by private companies and earn income from advertising\.?$/i,
  /^De får aldrig sälja reklamplats\.?$/i,
  /^They may never sell advertising space\.?$/i,
  /^Society should be accessible so people can participate on equal terms\.?$/i,
  /^People with disabilities should not be able to study or work\.?$/i,
  /^De finns också på internet och uppdateras med nyheter flera gånger per dag\.?$/i,
  /^They are also available online and updated with news several times per day\.?$/i,
  /^De får bara säljas som ett exemplar per år\.?$/i,
  /^They may be sold only as one copy per year\.?$/i,
  /^Vem som helst kan skapa innehåll där, och det kontrolleras inte alltid som i andra medier\.?$/i,
  /^Anyone can create content there, and it is not always checked the same way as in other media\.?$/i,
  /^Bara ansvariga utgivare får skriva inlägg där\.?$/i,
  /^Only responsible publishers may write posts there\.?$/i,
  /\b(?:Att Sverige är en sekulär stat betyder att|That Sweden is a secular state means)\b/i,
  /\b(?:Att val i en demokrati är hemliga betyder att|That elections in a democracy are secret means)\b/i,
  /^Förändringen genom den nya grundlagen år 1809 var att\b/i,
  /^The change through the new constitution in 1809 was that\b/i,
  /^Water and sewage\b/i,
  /^Vatten och avlopp\b/i,
  /^Sending ambassadors\b/i,
  /^Skicka ambassadörer\b/i,
  /^Incomplete answer fragment for naturalness guard\b/i,
  /^Ofullständig svarsfras för naturlighetskontroll\b/i,
  /\bI ett proportionellt val får partiet\b.*\bom ett parti får\b/i,
  /\bIn a proportional election, the party receives\b.*\bif a party receives\b/i,
  /\b(?:bli Sveriges största religiösa grupp|become Sweden’s largest religious group)\b/i,
  /^De kan ha politik bara för den egna kommunen eller regionen\.?$/i,
  /^They can have policies only for their own municipality or region\.?$/i,
  /^De måste alltid vara partier i riksdagen\.?$/i,
  /^They must always be parties in the Riksdag\.?$/i,
  /\bpublic sector(?: in Sweden)? means (?:activities for which|all privately owned companies)\b/i,
];

function generatedTrueFalseNaturalnessCategory(pattern) {
  const source = pattern.source;
  if (/policy|folkhälsopolitik|jämställdhetspolitik|The goal|Målet/i.test(source)) {
    return 'policy-goal';
  }
  if (
    /describes|beskriver|means|betyder|innebär|applies|gäller|belongs|hör till|definition|rättigheter gäller/i.test(
      source,
    )
  ) {
    return 'definition-cleft';
  }
  if (
    /One reason|En anledning|An authority|En myndighet|By\|Apply\|Leave\|Live|Genom|Through|De\|They|Påståendet|statement is true|Det stämmer|It is true/i.test(
      source,
    )
  ) {
    return 'answer-scaffold';
  }
  if (
    /^\^|Vårdcentraler|Domstolar|Health centres|Courts|Ordna|Betala|Arrange|Pay|Care and services|Automatic study|Försöka|Hindra|Try to persuade|Stop others|Political elections|Important activities/i.test(
      source,
    )
  ) {
    return 'answer-fragment';
  }
  return 'grammar-splice';
}

function stablePatternRuleId(pattern, category) {
  const source = `${pattern.source}/${pattern.flags}`;
  let hash = 0x811c9dc5;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `${category}-${hash.toString(36).padStart(7, '0')}`;
}

const GENERATED_TRUE_FALSE_NATURALNESS_PATTERN_RULES = Object.freeze(
  GENERATED_TRUE_FALSE_NATURALNESS_PATTERNS.map((pattern) => {
    const category = generatedTrueFalseNaturalnessCategory(pattern);
    return Object.freeze({
      id: stablePatternRuleId(pattern, category),
      category,
      pattern,
    });
  }),
);

function findGeneratedTrueFalseNaturalnessPatternMatch(text) {
  return GENERATED_TRUE_FALSE_NATURALNESS_PATTERN_RULES.find(({ pattern }) => pattern.test(text));
}

function findGeneratedTrueFalseNaturalnessPattern(text) {
  return findGeneratedTrueFalseNaturalnessPatternMatch(text)?.pattern;
}

function formatGeneratedTrueFalseNaturalnessPatternMatch(match) {
  if (!match) return 'unknown generated true/false naturalness pattern';
  return `${match.id} (${match.category}): ${match.pattern}`;
}

module.exports = {
  GENERATED_TRUE_FALSE_NATURALNESS_PATTERNS,
  GENERATED_TRUE_FALSE_NATURALNESS_PATTERN_RULES,
  findGeneratedTrueFalseNaturalnessPattern,
  findGeneratedTrueFalseNaturalnessPatternMatch,
  formatGeneratedTrueFalseNaturalnessPatternMatch,
  stablePatternRuleId,
};
