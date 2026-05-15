import { additionalQuestions } from './additionalQuestions';
import { derivePublishedQuestions, publishQuestions } from '../lib/content/derivedQuestions';
import type { PracticeQuestion } from '../types/content';

export const baseQuestions: PracticeQuestion[] = [
  {
    id: 'q001',
    chapterId: 'ch01',
    type: 'single_choice',
    questionSv: 'Var ligger Sverige?',
    questionEn: 'Where is Sweden located?',
    options: [
      {
        id: 'a',
        textSv: 'I Norden i norra Europa',
        textEn: 'In the Nordic region in northern Europe',
      },
      { id: 'b', textSv: 'I södra Europa', textEn: 'In southern Europe' },
      { id: 'c', textSv: 'I västra Asien', textEn: 'In western Asia' },
      { id: 'd', textSv: 'I Nordamerika', textEn: 'In North America' },
    ],
    correctOptionId: 'a',
    explanationSv:
      'Sverige ligger i Norden, som är en del av norra Europa. Därför är alternativen om södra Europa, Asien och Nordamerika fel.',
    explanationEn:
      'Sweden is located in the Nordic region, which is part of northern Europe. That makes the alternatives about southern Europe, Asia, and North America incorrect.',
    uhrReference: {
      chapter: 'Landet Sverige',
      section: 'Geografi, klimat och natur',
      pageApprox: 5,
    },
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['geography', 'norden', 'location'],
  },
  {
    id: 'q002',
    chapterId: 'ch01',
    type: 'true_false',
    questionSv: 'Sant eller falskt: Den nordligaste delen av Sverige ligger norr om polcirkeln.',
    questionEn: 'True or false: The northernmost part of Sweden lies north of the Arctic Circle.',
    options: [
      { id: 'true', textSv: 'Sant', textEn: 'True' },
      { id: 'false', textSv: 'Falskt', textEn: 'False' },
    ],
    correctOptionId: 'true',
    explanationSv:
      'Den nordligaste delen av Sverige ligger norr om polcirkeln i det arktiska området. Påståendet är därför sant.',
    explanationEn:
      'The northernmost part of Sweden is north of the Arctic Circle in the Arctic area. The statement is therefore true.',
    uhrReference: {
      chapter: 'Landet Sverige',
      section: 'Geografi, klimat och natur',
      pageApprox: 5,
    },
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['geography', 'arctic-circle', 'true-false'],
  },
  {
    id: 'q003',
    chapterId: 'ch01',
    type: 'single_choice',
    questionSv: 'Ungefär hur långt sträcker sig Sverige från Treriksröset till Smygehuk?',
    questionEn: 'Approximately how far does Sweden stretch from Treriksröset to Smygehuk?',
    options: [
      { id: 'a', textSv: 'Cirka 160 kilometer', textEn: 'About 160 kilometres' },
      { id: 'b', textSv: 'Cirka 1 600 kilometer', textEn: 'About 1,600 kilometres' },
      { id: 'c', textSv: 'Cirka 16 000 kilometer', textEn: 'About 16,000 kilometres' },
      { id: 'd', textSv: 'Cirka 60 kilometer', textEn: 'About 60 kilometres' },
    ],
    correctOptionId: 'b',
    explanationSv:
      'Sverige beskrivs som ett avlångt land som sträcker sig cirka 1 600 kilometer från norr till söder. De andra avstånden är antingen för korta eller orimligt långa.',
    explanationEn:
      'Sweden is described as an elongated country stretching about 1,600 kilometres from north to south. The other distances are either too short or unrealistically long.',
    uhrReference: {
      chapter: 'Landet Sverige',
      section: 'Geografi, klimat och natur',
      pageApprox: 5,
    },
    difficulty: 'medium',
    reviewStatus: 'reviewed',
    tags: ['geography', 'distance', 'trr-smg'],
  },
  {
    id: 'q004',
    chapterId: 'ch01',
    type: 'single_choice',
    questionSv: 'Vad heter havet vid Sveriges östra kust?',
    questionEn: "What is the sea along Sweden's eastern coast called?",
    options: [
      { id: 'a', textSv: 'Nordsjön', textEn: 'The North Sea' },
      { id: 'b', textSv: 'Medelhavet', textEn: 'The Mediterranean Sea' },
      { id: 'c', textSv: 'Östersjön', textEn: 'The Baltic Sea' },
      { id: 'd', textSv: 'Atlanten', textEn: 'The Atlantic Ocean' },
    ],
    correctOptionId: 'c',
    explanationSv:
      'Havet vid Sveriges östra kust heter Östersjön. Skagerrak och Kattegatt ligger däremot vid västkusten.',
    explanationEn:
      "The sea along Sweden's eastern coast is the Baltic Sea. Skagerrak and Kattegat are instead on the west coast.",
    uhrReference: {
      chapter: 'Landet Sverige',
      section: 'Geografi, klimat och natur',
      pageApprox: 5,
    },
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['geography', 'coast', 'baltic-sea'],
  },
  {
    id: 'q005',
    chapterId: 'ch01',
    type: 'single_choice',
    questionSv: 'Vilka är Sveriges två största öar?',
    questionEn: "Which are Sweden's two largest islands?",
    options: [
      { id: 'a', textSv: 'Gotland och Öland', textEn: 'Gotland and Öland' },
      { id: 'b', textSv: 'Hisingen och Orust', textEn: 'Hisingen and Orust' },
      { id: 'c', textSv: 'Värmdö och Tjörn', textEn: 'Värmdö and Tjörn' },
      { id: 'd', textSv: 'Malmö och Göteborg', textEn: 'Malmö and Gothenburg' },
    ],
    correctOptionId: 'a',
    explanationSv:
      'Gotland och Öland är Sveriges två största öar. Malmö och Göteborg är städer, inte öar.',
    explanationEn:
      "Gotland and Öland are Sweden's two largest islands. Malmö and Gothenburg are cities, not islands.",
    uhrReference: {
      chapter: 'Landet Sverige',
      section: 'Geografi, klimat och natur',
      pageApprox: 5,
    },
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['geography', 'islands', 'gotland', 'oland'],
  },
  {
    id: 'q006',
    chapterId: 'ch01',
    type: 'true_false',
    questionSv:
      'Sant eller falskt: Golfströmmen och den Nordatlantiska strömmen bidrar till Sveriges milda klimat.',
    questionEn:
      "True or false: The Gulf Stream and the North Atlantic Current help make Sweden's climate mild.",
    options: [
      { id: 'true', textSv: 'Sant', textEn: 'True' },
      { id: 'false', textSv: 'Falskt', textEn: 'False' },
    ],
    correctOptionId: 'true',
    explanationSv:
      'Sverige har ett mildare klimat än många andra områden på samma breddgrad. En förklaring är att varmare havsvatten och vindar påverkar luften över Sverige.',
    explanationEn:
      'Sweden has a milder climate than many other areas at the same latitude. One explanation is that warmer ocean water and winds affect the air over Sweden.',
    uhrReference: {
      chapter: 'Landet Sverige',
      section: 'Geografi, klimat och natur',
      pageApprox: 5,
    },
    difficulty: 'medium',
    reviewStatus: 'reviewed',
    tags: ['climate', 'gulf-stream', 'true-false'],
  },
  {
    id: 'q007',
    chapterId: 'ch01',
    type: 'single_choice',
    questionSv: 'Vad heter Sveriges högsta berg?',
    questionEn: "What is the name of Sweden's highest mountain?",
    options: [
      { id: 'a', textSv: 'Kebnekaise', textEn: 'Kebnekaise' },
      { id: 'b', textSv: 'Smygehuk', textEn: 'Smygehuk' },
      { id: 'c', textSv: 'Treriksröset', textEn: 'Treriksröset' },
      { id: 'd', textSv: 'Mälaren', textEn: 'Mälaren' },
    ],
    correctOptionId: 'a',
    explanationSv:
      'Kebnekaise anges som Sveriges högsta berg, cirka 2 000 meter högt. Smygehuk, Treriksröset och Mälaren är andra geografiska namn men inte Sveriges högsta berg.',
    explanationEn:
      "Kebnekaise is given as Sweden's highest mountain, about 2,000 metres high. Smygehuk, Treriksröset, and Mälaren are other geographical names but not Sweden's highest mountain.",
    uhrReference: { chapter: 'Landet Sverige', section: 'Fjäll', pageApprox: 6 },
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['geography', 'mountains', 'kebnekaise'],
  },
  {
    id: 'q008',
    chapterId: 'ch01',
    type: 'single_choice',
    questionSv: 'Vilka är Sveriges tre största sjöar enligt materialet?',
    questionEn: "Which are Sweden's three largest lakes according to the material?",
    options: [
      { id: 'a', textSv: 'Vänern, Vättern och Mälaren', textEn: 'Vänern, Vättern, and Mälaren' },
      {
        id: 'b',
        textSv: 'Östersjön, Kattegatt och Skagerrak',
        textEn: 'The Baltic Sea, Kattegat, and Skagerrak',
      },
      { id: 'c', textSv: 'Gotland, Öland och Orust', textEn: 'Gotland, Öland, and Orust' },
      {
        id: 'd',
        textSv: 'Stockholm, Göteborg och Malmö',
        textEn: 'Stockholm, Gothenburg, and Malmö',
      },
    ],
    correctOptionId: 'a',
    explanationSv:
      'De tre största sjöarna är Vänern, Vättern och Mälaren. De andra alternativen blandar ihop hav, öar eller städer med sjöar.',
    explanationEn:
      'The three largest lakes are Vänern, Vättern, and Mälaren. The other alternatives confuse seas, islands, or cities with lakes.',
    uhrReference: { chapter: 'Landet Sverige', section: 'Skogar, sjöar och öar', pageApprox: 6 },
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['geography', 'lakes', 'vanern', 'vattern', 'malaren'],
  },
  {
    id: 'q009',
    chapterId: 'ch01',
    type: 'single_choice',
    questionSv: 'Ungefär hur många människor bor i Sverige enligt materialet?',
    questionEn: 'Approximately how many people live in Sweden according to the material?',
    options: [
      { id: 'a', textSv: 'Nästan 11 miljoner', textEn: 'Almost 11 million' },
      { id: 'b', textSv: 'Nästan 1 miljon', textEn: 'Almost 1 million' },
      { id: 'c', textSv: 'Cirka 50 miljoner', textEn: 'About 50 million' },
      { id: 'd', textSv: 'Cirka 100 miljoner', textEn: 'About 100 million' },
    ],
    correctOptionId: 'a',
    explanationSv:
      'Materialet anger att nästan 11 miljoner människor bor i Sverige. De andra alternativen ligger långt från den uppgiften.',
    explanationEn:
      'The material states that almost 11 million people live in Sweden. The other alternatives are far from that figure.',
    uhrReference: { chapter: 'Landet Sverige', section: 'Befolkning', pageApprox: 7 },
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['population', 'demography', 'sweden'],
  },
  {
    id: 'q010',
    chapterId: 'ch01',
    type: 'single_choice',
    questionSv: 'Vilken stad är Sveriges huvudstad?',
    questionEn: "Which city is Sweden's capital?",
    options: [
      { id: 'a', textSv: 'Stockholm', textEn: 'Stockholm' },
      { id: 'b', textSv: 'Göteborg', textEn: 'Gothenburg' },
      { id: 'c', textSv: 'Malmö', textEn: 'Malmö' },
      { id: 'd', textSv: 'Uppsala', textEn: 'Uppsala' },
    ],
    correctOptionId: 'a',
    explanationSv:
      'Stockholm beskrivs som Sveriges huvudstad. Göteborg och Malmö är stora städer, men de är inte huvudstaden.',
    explanationEn:
      "Stockholm is described as Sweden's capital. Gothenburg and Malmö are large cities, but they are not the capital.",
    uhrReference: {
      chapter: 'Så här styrs Sverige',
      section: 'Kommunernas ansvar',
      pageApprox: 13,
    },
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['capital', 'stockholm', 'cities'],
  },
  {
    id: 'q011',
    chapterId: 'ch02',
    type: 'single_choice',
    questionSv: 'Vad betyder ordet demokrati?',
    questionEn: 'What does the word democracy mean?',
    options: [
      { id: 'a', textSv: 'Folkstyre', textEn: 'Rule by the people' },
      { id: 'b', textSv: 'Militärstyre', textEn: 'Military rule' },
      { id: 'c', textSv: 'Envälde', textEn: 'Autocracy' },
      { id: 'd', textSv: 'Företagsstyre', textEn: 'Rule by companies' },
    ],
    correctOptionId: 'a',
    explanationSv:
      'Demokrati betyder folkstyre. Det handlar om att makten utgår från folket och att medborgare kan påverka beslut.',
    explanationEn:
      'Democracy means rule by the people. It means that power comes from the people and that citizens can influence decisions.',
    uhrReference: {
      chapter: 'Sveriges demokratiska system',
      section: 'Demokrati betyder folkstyre',
      pageApprox: 10,
    },
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['democracy', 'definition', 'folkstyre'],
  },
  {
    id: 'q012',
    chapterId: 'ch02',
    type: 'single_choice',
    questionSv: 'Vad är ett kännetecken på fria val i en demokrati?',
    questionEn: 'What is a feature of free elections in a democracy?',
    options: [
      {
        id: 'a',
        textSv: 'Alla med rösträtt har en röst var',
        textEn: 'Everyone with the right to vote has one vote each',
      },
      {
        id: 'b',
        textSv: 'Bara ett parti får ställa upp',
        textEn: 'Only one party may stand for election',
      },
      {
        id: 'c',
        textSv: 'Man måste visa offentligt hur man röstar',
        textEn: 'You must publicly show how you vote',
      },
      {
        id: 'd',
        textSv: 'Man måste rösta på regeringen',
        textEn: 'You must vote for the government',
      },
    ],
    correctOptionId: 'a',
    explanationSv:
      'I fria val har alla med rösträtt en röst var och valet ska vara hemligt. Det ska också finnas flera partier att rösta på.',
    explanationEn:
      'In free elections, everyone with the right to vote has one vote each and the vote should be secret. There should also be several parties to choose from.',
    uhrReference: {
      chapter: 'Sveriges demokratiska system',
      section: 'Demokrati betyder folkstyre',
      pageApprox: 10,
    },
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['democracy', 'elections', 'voting'],
  },
  {
    id: 'q013',
    chapterId: 'ch02',
    type: 'single_choice',
    questionSv: 'Vilket alternativ är ett exempel på hur man kan påverka och delta i samhället?',
    questionEn:
      'Which option is an example of how a person can influence and participate in society?',
    options: [
      {
        id: 'a',
        textSv: 'Kontakta politiker eller demonstrera',
        textEn: 'Contact politicians or demonstrate',
      },
      { id: 'b', textSv: 'Förbjuda andra från att rösta', textEn: 'Ban others from voting' },
      {
        id: 'c',
        textSv: 'Tvinga journalister att skriva en viss sak',
        textEn: 'Force journalists to write a certain thing',
      },
      {
        id: 'd',
        textSv: 'Stoppa fria diskussioner om politik',
        textEn: 'Stop free discussions about politics',
      },
    ],
    correctOptionId: 'a',
    explanationSv:
      'Materialet ger flera exempel på deltagande, till exempel att kontakta politiker, demonstrera och skriva på namninsamlingar. De andra alternativen skulle begränsa demokratiska friheter.',
    explanationEn:
      'The material gives several examples of participation, such as contacting politicians, demonstrating, and signing petitions. The other alternatives would restrict democratic freedoms.',
    uhrReference: {
      chapter: 'Sveriges demokratiska system',
      section: 'En stark demokrati',
      pageApprox: 10,
    },
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['participation', 'democracy', 'influence'],
  },
  {
    id: 'q014',
    chapterId: 'ch02',
    type: 'single_choice',
    questionSv: 'Vad betyder rättssäkerhet i materialets beskrivning?',
    questionEn: "What does rule of law mean in the material's description?",
    options: [
      {
        id: 'a',
        textSv: 'Att lagarna gäller för alla och att ingen döms utan en rättvis rättegång',
        textEn: 'That laws apply to everyone and no one is sentenced without a fair trial',
      },
      {
        id: 'b',
        textSv: 'Att myndigheter får döma utan lagar',
        textEn: 'That authorities may sentence people without laws',
      },
      {
        id: 'c',
        textSv: 'Att bara vissa grupper skyddas av lagen',
        textEn: 'That only some groups are protected by law',
      },
      {
        id: 'd',
        textSv: 'Att politiker kan ändra domar själva',
        textEn: 'That politicians can change court judgments themselves',
      },
    ],
    correctOptionId: 'a',
    explanationSv:
      'Rättssäkerhet innebär att lagarna gäller för alla och att människor har rätt till en rättvis rättegång. Det stärker demokratin eftersom makt inte ska användas godtyckligt.',
    explanationEn:
      'Rule of law means that laws apply to everyone and that people have the right to a fair trial. It strengthens democracy because power should not be used arbitrarily.',
    uhrReference: {
      chapter: 'Sveriges demokratiska system',
      section: 'Demokrati betyder folkstyre',
      pageApprox: 10,
    },
    difficulty: 'medium',
    reviewStatus: 'reviewed',
    tags: ['rule-of-law', 'democracy', 'fair-trial'],
  },
  {
    id: 'q015',
    chapterId: 'ch02',
    type: 'true_false',
    questionSv: 'Sant eller falskt: Ett lågt valdeltagande kan vara ett problem för demokratin.',
    questionEn: 'True or false: Low voter turnout can be a problem for democracy.',
    options: [
      { id: 'true', textSv: 'Sant', textEn: 'True' },
      { id: 'false', textSv: 'Falskt', textEn: 'False' },
    ],
    correctOptionId: 'true',
    explanationSv:
      'Materialet nämner lågt valdeltagande som ett problem som kan påverka demokratin. Det kan göra att människor får mindre möjlighet att påverka beslut i sin vardag.',
    explanationEn:
      'The material mentions low voter turnout as a problem that can affect democracy. It can give people fewer opportunities to influence decisions in their everyday lives.',
    uhrReference: {
      chapter: 'Sveriges demokratiska system',
      section: 'Hot mot demokratin',
      pageApprox: 11,
    },
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['democracy', 'voter-turnout', 'true-false'],
  },
  {
    id: 'q016',
    chapterId: 'ch02',
    type: 'single_choice',
    questionSv: 'Vad betyder det att Sverige är en parlamentarisk representativ demokrati?',
    questionEn: 'What does it mean that Sweden is a parliamentary representative democracy?',
    options: [
      {
        id: 'a',
        textSv: 'Medborgarna röstar i allmänna val och väljer ledamöter till riksdagen',
        textEn: 'Citizens vote in general elections and elect members of the Riksdag',
      },
      {
        id: 'b',
        textSv: 'Domstolarna väljer alla riksdagsledamöter',
        textEn: 'The courts elect all members of the Riksdag',
      },
      {
        id: 'c',
        textSv: 'Kungen bestämmer ensam över riksdagen',
        textEn: 'The king alone decides over the Riksdag',
      },
      {
        id: 'd',
        textSv: 'Myndigheter röstar fram regeringen',
        textEn: 'Government agencies vote the government into office',
      },
    ],
    correctOptionId: 'a',
    explanationSv:
      'I en parlamentarisk representativ demokrati väljer medborgarna representanter i allmänna val. I Sverige väljs ledamöter till riksdagen, som beslutar om lagar och budget.',
    explanationEn:
      'In a parliamentary representative democracy, citizens elect representatives in general elections. In Sweden, members of the Riksdag are elected, and they decide on laws and the budget.',
    uhrReference: { chapter: 'Så här styrs Sverige', section: 'Staten', pageApprox: 12 },
    difficulty: 'medium',
    reviewStatus: 'reviewed',
    tags: ['riksdag', 'representative-democracy', 'parliament'],
  },
  {
    id: 'q017',
    chapterId: 'ch02',
    type: 'single_choice',
    questionSv: 'Hur många ledamöter har riksdagen?',
    questionEn: 'How many members does the Riksdag have?',
    options: [
      { id: 'a', textSv: '21', textEn: '21' },
      { id: 'b', textSv: '290', textEn: '290' },
      { id: 'c', textSv: '349', textEn: '349' },
      { id: 'd', textSv: '1 600', textEn: '1,600' },
    ],
    correctOptionId: 'c',
    explanationSv:
      'Riksdagen har 349 ledamöter som väljs vart fjärde år. Siffrorna 21 och 290 hör i materialet ihop med regioner och kommuner, inte riksdagens ledamöter.',
    explanationEn:
      'The Riksdag has 349 members who are elected every four years. The numbers 21 and 290 are connected in the material to regions and municipalities, not members of the Riksdag.',
    uhrReference: { chapter: 'Så här styrs Sverige', section: 'Staten', pageApprox: 12 },
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['riksdag', 'parliament', 'members'],
  },
  {
    id: 'q018',
    chapterId: 'ch02',
    type: 'single_choice',
    questionSv: 'Vem väljer statsministern enligt materialet?',
    questionEn: 'Who chooses the prime minister according to the material?',
    options: [
      { id: 'a', textSv: 'Riksdagen', textEn: 'The Riksdag' },
      { id: 'b', textSv: 'Kungen ensam', textEn: 'The king alone' },
      { id: 'c', textSv: 'Polismyndigheten', textEn: 'The Swedish Police Authority' },
      { id: 'd', textSv: 'Regionfullmäktige', textEn: 'The regional council' },
    ],
    correctOptionId: 'a',
    explanationSv:
      'Riksdagen väljer statsminister, och statsministern får uppdraget att bilda regering. Statsministern väljer därefter ministrarna i regeringen.',
    explanationEn:
      'The Riksdag chooses the prime minister, who is given the task of forming a government. The prime minister then chooses the government ministers.',
    uhrReference: { chapter: 'Så här styrs Sverige', section: 'Staten', pageApprox: 12 },
    difficulty: 'medium',
    reviewStatus: 'reviewed',
    tags: ['government', 'prime-minister', 'riksdag'],
  },
  {
    id: 'q019',
    chapterId: 'ch02',
    type: 'single_choice',
    questionSv: 'Hur gammal måste man ha fyllt för att ha rätt att rösta?',
    questionEn: 'How old must a person be to have the right to vote?',
    options: [
      { id: 'a', textSv: '16 år', textEn: '16 years old' },
      { id: 'b', textSv: '18 år', textEn: '18 years old' },
      { id: 'c', textSv: '20 år', textEn: '20 years old' },
      { id: 'd', textSv: '25 år', textEn: '25 years old' },
    ],
    correctOptionId: 'b',
    explanationSv:
      'För att ha rätt att rösta ska man ha fyllt 18 år. För riksdagsval gäller dessutom kravet att man måste vara svensk medborgare.',
    explanationEn:
      'To have the right to vote, a person must have turned 18. For elections to the Riksdag, there is also a requirement to be a Swedish citizen.',
    uhrReference: {
      chapter: 'Politiska val och partier',
      section: 'Val och röstning',
      pageApprox: 14,
    },
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['voting-age', 'elections', 'riksdag'],
  },
  {
    id: 'q020',
    chapterId: 'ch02',
    type: 'true_false',
    questionSv: 'Sant eller falskt: Folkomröstningar i Sverige är rådgivande enligt materialet.',
    questionEn: 'True or false: Referendums in Sweden are advisory according to the material.',
    options: [
      { id: 'true', textSv: 'Sant', textEn: 'True' },
      { id: 'false', textSv: 'Falskt', textEn: 'False' },
    ],
    correctOptionId: 'true',
    explanationSv:
      'Materialet beskriver folkomröstningar som rådgivande. Det betyder att politikerna inte måste följa resultatet, även om resultatet kan få politisk betydelse.',
    explanationEn:
      'The material describes referendums as advisory. This means politicians do not have to follow the result, even though the result may have political importance.',
    uhrReference: {
      chapter: 'Politiska val och partier',
      section: 'Folkomröstningar',
      pageApprox: 14,
    },
    difficulty: 'medium',
    reviewStatus: 'reviewed',
    tags: ['referendum', 'elections', 'true-false'],
  },
];

export const sourceQuestions: PracticeQuestion[] = publishQuestions([
  ...baseQuestions,
  ...additionalQuestions,
]);

export const generatedPublishedQuestions: PracticeQuestion[] = derivePublishedQuestions(
  sourceQuestions,
  101,
);

export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];
