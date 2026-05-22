import { additionalQuestions } from './additionalQuestions';
import { applyQuestionLocalizationPilot } from './questionLocalizations';
import { VALMYNDIGHETEN_VOTING_RIGHTS_SOURCE } from './sourceReferences';
import { derivePublishedQuestions, publishQuestions } from '../lib/content/derivedQuestions';
import type { PracticeQuestion } from '../types/content';

const rawBaseQuestions: PracticeQuestion[] = [
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
      'Sverige ligger i Norden i norra Europa. Norden består av Danmark, Finland, Island, Norge och Sverige och är en del av norra Europa.',
    explanationEn:
      'Sweden is in the Nordic region in northern Europe. The Nordic region includes Denmark, Finland, Iceland, Norway, and Sweden and is part of northern Europe.',
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
    questionSv: 'Sveriges nordligaste del ligger norr om polcirkeln.',
    questionEn: "Sweden's northernmost part lies north of the Arctic Circle.",
    options: [
      { id: 'true', textSv: 'Sant', textEn: 'True' },
      { id: 'false', textSv: 'Falskt', textEn: 'False' },
    ],
    correctOptionId: 'true',
    explanationSv:
      'Sveriges nordligaste del ligger norr om polcirkeln, i det arktiska området. Den norra delen av landet sträcker sig alltså in i området norr om polcirkeln.',
    explanationEn:
      "Sweden's northernmost part lies north of the Arctic Circle, in the Arctic area. The northern part of the country therefore extends into the area north of the Arctic Circle.",
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
      'Sverige är ett avlångt land som sträcker sig cirka 1 600 kilometer från Treriksröset i norr till Smygehuk i söder. Avstånden 160 och 60 kilometer är för korta, och 16 000 kilometer är för långt.',
    explanationEn:
      'Sweden is an elongated country that stretches about 1,600 kilometres from Treriksröset in the north to Smygehuk in the south. The distances 160 and 60 kilometres are too short, and 16,000 kilometres is too long.',
    uhrReference: {
      chapter: 'Landet Sverige',
      section: 'Geografi, klimat och natur',
      pageApprox: 5,
    },
    difficulty: 'medium',
    reviewStatus: 'reviewed',
    tags: ['geography', 'distance', 'treriksroset', 'smygehuk'],
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
      'Havet vid Sveriges östra kust heter Östersjön. Nordsjön, Medelhavet och Atlanten är inte namnet på havet vid Sveriges östra kust.',
    explanationEn:
      "The sea along Sweden's eastern coast is the Baltic Sea. The North Sea, the Mediterranean Sea, and the Atlantic Ocean are not the sea along Sweden's eastern coast.",
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
    questionSv: 'Vilka öar är Sveriges två största?',
    questionEn: "Which islands are Sweden's two largest?",
    options: [
      { id: 'a', textSv: 'Gotland och Öland', textEn: 'Gotland and Öland' },
      { id: 'b', textSv: 'Hisingen och Orust', textEn: 'Hisingen and Orust' },
      { id: 'c', textSv: 'Värmdö och Tjörn', textEn: 'Värmdö and Tjörn' },
      { id: 'd', textSv: 'Malmö och Göteborg', textEn: 'Malmö and Gothenburg' },
    ],
    correctOptionId: 'a',
    explanationSv:
      'Sveriges två största öar är Gotland och Öland. Hisingen, Orust, Värmdö och Tjörn är också svenska öar men är inte de två största, och Malmö och Göteborg är städer.',
    explanationEn:
      "Sweden's two largest islands are Gotland and Öland. Hisingen, Orust, Värmdö, and Tjörn are also Swedish islands but are not the two largest, and Malmö and Gothenburg are cities.",
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
    questionSv: 'Golfströmmen och den Nordatlantiska strömmen bidrar till Sveriges milda klimat.',
    questionEn: "The Gulf Stream and the North Atlantic Current help make Sweden's climate mild.",
    options: [
      { id: 'true', textSv: 'Sant', textEn: 'True' },
      { id: 'false', textSv: 'Falskt', textEn: 'False' },
    ],
    correctOptionId: 'true',
    explanationSv:
      'Sverige har ett milt klimat jämfört med många andra områden på samma breddgrad. Golfströmmen och den Nordatlantiska strömmen transporterar varmt vatten mot Europa, vilket värmer luften som vindarna för in över Sverige.',
    explanationEn:
      'Sweden has a mild climate compared with many other areas at the same latitude. The Gulf Stream and the North Atlantic Current carry warm water toward Europe, warming the air that winds bring over Sweden.',
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
      'Sveriges högsta berg heter Kebnekaise och är cirka 2 000 meter högt. Det ligger i fjällen, den del av bergskedjan Skanderna som går längs gränsen mot Norge.',
    explanationEn:
      "Sweden's highest mountain is Kebnekaise, at about 2,000 metres. It is in the mountain region called fjällen, part of the Scandinavian Mountains along the border with Norway.",
    uhrReference: { chapter: 'Landet Sverige', section: 'Fjäll', pageApprox: 6 },
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['geography', 'mountains', 'kebnekaise'],
  },
  {
    id: 'q008',
    chapterId: 'ch01',
    type: 'single_choice',
    questionSv: 'Vilka är Sveriges tre största sjöar?',
    questionEn: "Which are Sweden's three largest lakes?",
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
      'Sverige har många sjöar spridda över hela landet, och de tre största är Vänern, Vättern och Mälaren. De andra alternativen räknar upp havsområden, öar eller städer i stället för sjöar.',
    explanationEn:
      'Sweden has many lakes throughout the country, and the three largest are Vänern, Vättern, and Mälaren. The other choices list sea areas, islands, or cities instead of lakes.',
    uhrReference: { chapter: 'Landet Sverige', section: 'Skogar, sjöar och öar', pageApprox: 6 },
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['geography', 'lakes', 'vanern', 'vattern', 'malaren'],
  },
  {
    id: 'q009',
    chapterId: 'ch01',
    type: 'single_choice',
    questionSv: 'Ungefär hur många människor bor i Sverige?',
    questionEn: 'Approximately how many people live in Sweden?',
    options: [
      { id: 'a', textSv: 'Nästan 11 miljoner', textEn: 'Almost 11 million' },
      { id: 'b', textSv: 'Nästan 1 miljon', textEn: 'Almost 1 million' },
      { id: 'c', textSv: 'Cirka 50 miljoner', textEn: 'About 50 million' },
      { id: 'd', textSv: 'Cirka 100 miljoner', textEn: 'About 100 million' },
    ],
    correctOptionId: 'a',
    explanationSv:
      'Det bor nästan 11 miljoner människor i Sverige. Befolkningen är inte jämnt fördelad: de flesta bor i den södra delen av landet och längs kusterna.',
    explanationEn:
      'Almost 11 million people live in Sweden. The population is not evenly distributed: most people live in the southern part of the country and along the coasts.',
    uhrReference: { chapter: 'Landet Sverige', section: 'Befolkning', pageApprox: 7 },
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['population', 'demography', 'sweden'],
  },
  {
    id: 'q010',
    chapterId: 'ch01',
    type: 'single_choice',
    questionSv: 'Vilka naturresurser är viktiga i Sverige?',
    questionEn: 'Which natural resources are important in Sweden?',
    options: [
      {
        id: 'a',
        textSv: 'Järnmalm och andra mineraler, skog, jordbruksmark och vatten',
        textEn: 'Iron ore and other minerals, forest, agricultural land, and water',
      },
      {
        id: 'b',
        textSv: 'Olja, naturgas, ökenmark och tropiskt regn',
        textEn: 'Oil, natural gas, desert land, and tropical rain',
      },
      {
        id: 'c',
        textSv: 'Kol, diamantgruvor, vulkanjord och palmer',
        textEn: 'Coal, diamond mines, volcanic soil, and palm trees',
      },
      {
        id: 'd',
        textSv: 'Risfält, bomullsplantager, korallrev och tidvatten',
        textEn: 'Rice fields, cotton plantations, coral reefs, and tides',
      },
    ],
    correctOptionId: 'a',
    explanationSv:
      'Sverige är rikt på flera viktiga naturresurser: järnmalm och andra mineraler, skog, jordbruksmark och vatten. Olja, naturgas, ökenmark, tropiskt regn och liknande beskriver inte Sveriges viktiga naturresurser.',
    explanationEn:
      "Sweden is rich in several important natural resources: iron ore and other minerals, forests, agricultural land, and water. Oil, natural gas, desert land, tropical rain, and similar items do not describe Sweden's important natural resources.",
    uhrReference: {
      chapter: 'Landet Sverige',
      section: 'Naturresurser',
      pageApprox: 7,
    },
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['natural-resources', 'minerals', 'forest', 'water'],
  },
  {
    id: 'q011',
    chapterId: 'ch02',
    type: 'single_choice',
    questionSv: 'Vad betyder demokrati?',
    questionEn: 'What does democracy mean?',
    options: [
      { id: 'a', textSv: 'Folkstyre', textEn: 'Rule by the people' },
      { id: 'b', textSv: 'Militärstyre', textEn: 'Military rule' },
      { id: 'c', textSv: 'Envälde', textEn: 'Autocracy' },
      { id: 'd', textSv: 'Företagsstyre', textEn: 'Rule by companies' },
    ],
    correctOptionId: 'a',
    explanationSv:
      'Demokrati betyder folkstyre: makten utgår från folket och medborgarna kan påverka beslut. Människor ska kunna välja mellan flera politiska alternativ, och de som får makten ska kunna bytas ut. Militärstyre, envälde och företagsstyre lägger makten någon annanstans.',
    explanationEn:
      'Democracy means rule by the people: power comes from the people, and citizens can influence decisions. People should be able to choose between several political alternatives, and those who gain power can be replaced. Military rule, autocracy, and rule by companies place power somewhere else.',
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
    questionSv: 'Vilket av följande ingår i fria val i en demokrati?',
    questionEn: 'Which of the following is part of free elections in a democracy?',
    options: [
      {
        id: 'a',
        textSv: 'Alla som har rätt att rösta har en röst var',
        textEn: 'Everyone who is eligible to vote has one vote',
      },
      {
        id: 'b',
        textSv: 'Bara ett parti får ställa upp',
        textEn: 'Only one party may stand for election',
      },
      {
        id: 'c',
        textSv: 'Väljare måste visa offentligt hur de röstar',
        textEn: 'Voters must publicly show how they vote',
      },
      {
        id: 'd',
        textSv: 'Regeringen bestämmer hur alla röster ska användas',
        textEn: 'The government decides how all votes must be used',
      },
    ],
    correctOptionId: 'a',
    explanationSv:
      'Fria val innebär att alla som har rätt att rösta har en röst var. Väljare ska kunna uttrycka sina åsikter utan hot eller tvång, det ska finnas flera partier och valet ska vara hemligt.',
    explanationEn:
      'Free elections mean that everyone who is eligible to vote has one vote. Voters should be able to express their views without threats or coercion, there should be several parties, and the vote should be secret.',
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
    questionSv: 'Hur kan människor påverka samhället och delta i demokratin?',
    questionEn: 'How can people influence society and participate in democracy?',
    options: [
      {
        id: 'a',
        textSv: 'Kontakta politiker, demonstrera eller skriva på en namninsamling',
        textEn: 'Contact politicians, join a demonstration, or sign a petition',
      },
      {
        id: 'b',
        textSv: 'Förbjuda andra från att rösta i politiska val',
        textEn: 'Ban others from voting in political elections',
      },
      {
        id: 'c',
        textSv: 'Tvinga journalister att skriva vissa åsikter',
        textEn: 'Force journalists to write certain opinions',
      },
      {
        id: 'd',
        textSv: 'Stoppa människor från att prata om politik',
        textEn: 'Stop people from talking about politics',
      },
    ],
    correctOptionId: 'a',
    explanationSv:
      'Det finns flera demokratiska sätt att påverka och delta i samhället, till exempel att kontakta politiker, demonstrera och starta eller skriva på en namninsamling. De andra alternativen skulle hindra människor från att rösta, uttrycka åsikter eller delta i demokratin.',
    explanationEn:
      'People can influence and participate in society in several democratic ways, including contacting politicians, joining a demonstration, and starting or signing a petition. The other options would stop people from voting, expressing opinions, or taking part in democracy.',
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
    questionSv:
      'Vad kallas det när lagarna gäller lika för alla och ingen får dömas utan en rättvis rättegång?',
    questionEn:
      'What is it called when laws apply equally to everyone and no one can be convicted without a fair trial?',
    options: [
      {
        id: 'a',
        textSv: 'Rättssäkerhet',
        textEn: 'The rule of law',
      },
      {
        id: 'b',
        textSv: 'Censur',
        textEn: 'Censorship',
      },
      {
        id: 'c',
        textSv: 'Segregation',
        textEn: 'Segregation',
      },
      {
        id: 'd',
        textSv: 'Monarki',
        textEn: 'Monarchy',
      },
    ],
    correctOptionId: 'a',
    explanationSv:
      'Rättssäkerhet betyder att lagarna gäller för alla och att ingen får dömas utan en rättvis rättegång. Censur, segregation och monarki betyder andra saker.',
    explanationEn:
      'The rule of law means that laws apply to everyone and that no one can be convicted without a fair trial. Censorship, segregation, and monarchy mean other things.',
    uhrReference: {
      chapter: 'Sveriges demokratiska system',
      section: 'Demokrati betyder folkstyre',
      pageApprox: 10,
    },
    difficulty: 'medium',
    reviewStatus: 'reviewed',
    tags: ['legal-certainty', 'democracy', 'fair-trial'],
  },
  {
    id: 'q015',
    chapterId: 'ch02',
    type: 'single_choice',
    questionSv: 'Hur kan ett lågt valdeltagande påverka demokratin?',
    questionEn: 'How can a low voter turnout affect democracy?',
    options: [
      {
        id: 'a',
        textSv: 'Människor kan få mindre möjlighet att påverka politiska beslut',
        textEn: 'People may have fewer opportunities to influence political decisions',
      },
      {
        id: 'b',
        textSv: 'Alla väljare får två röster var i nästa val',
        textEn: 'All voters get two votes each in the next election',
      },
      {
        id: 'c',
        textSv: 'Domstolarna tar över riksdagens uppgifter',
        textEn: "The courts take over the Riksdag's tasks",
      },
      {
        id: 'd',
        textSv: 'Samhället blir automatiskt mer integrerat',
        textEn: 'Society automatically becomes more integrated',
      },
    ],
    correctOptionId: 'a',
    explanationSv:
      'Ett lågt valdeltagande kan göra det svårare för människor att påverka politiska beslut i sin vardag. Det kan också öka skillnaderna mellan grupper i samhället; de andra alternativen beskriver följder som inte följer av lågt valdeltagande.',
    explanationEn:
      'Low voter turnout can leave people with fewer opportunities to influence political decisions in everyday life. It can also widen differences between groups in society; the other options describe effects that do not follow from low voter turnout.',
    uhrReference: {
      chapter: 'Sveriges demokratiska system',
      section: 'Hot mot demokratin',
      pageApprox: 11,
    },
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['democracy', 'voter-turnout', 'threats-to-democracy'],
  },
  {
    id: 'q016',
    chapterId: 'ch03',
    type: 'single_choice',
    questionSv:
      'Hur väljer medborgarna ledamöter till riksdagen i Sveriges parlamentariska representativa demokrati?',
    questionEn:
      "How do citizens choose members of the Riksdag in Sweden's parliamentary representative democracy?",
    options: [
      {
        id: 'a',
        textSv: 'Genom att rösta i allmänna val',
        textEn: 'By voting in general elections',
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
      'Sverige är en parlamentarisk representativ demokrati: medborgarna väljer riksdagsledamöter genom att rösta i allmänna val. Riksdagen fattar sedan beslut om lagar och statens budget, så varken domstolarna, kungen eller myndigheter väljer ledamöterna.',
    explanationEn:
      'Sweden is a parliamentary representative democracy: citizens elect members of the Riksdag by voting in general elections. The Riksdag then decides on laws and the state budget, so the courts, the king, and government agencies do not choose its members.',
    uhrReference: { chapter: 'Så här styrs Sverige', section: 'Staten', pageApprox: 12 },
    difficulty: 'medium',
    reviewStatus: 'reviewed',
    tags: ['riksdag', 'representative-democracy', 'parliament'],
  },
  {
    id: 'q017',
    chapterId: 'ch03',
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
      'Riksdagen har 349 ledamöter, och de väljs vart fjärde år. Talen 21, 290 och 1 600 anger inte antalet ledamöter i riksdagen.',
    explanationEn:
      'The Riksdag has 349 members, and they are elected every four years. The numbers 21, 290, and 1,600 do not give the number of Riksdag members.',
    uhrReference: { chapter: 'Så här styrs Sverige', section: 'Staten', pageApprox: 12 },
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['riksdag', 'parliament', 'members'],
  },
  {
    id: 'q018',
    chapterId: 'ch03',
    type: 'single_choice',
    questionSv: 'Vem väljer statsministern?',
    questionEn: 'Who chooses the prime minister?',
    options: [
      { id: 'a', textSv: 'Riksdagen', textEn: 'The Riksdag' },
      { id: 'b', textSv: 'Kungen ensam', textEn: 'The king alone' },
      { id: 'c', textSv: 'Polismyndigheten', textEn: 'The Swedish Police Authority' },
      { id: 'd', textSv: 'Regionfullmäktige', textEn: 'The regional council' },
    ],
    correctOptionId: 'a',
    explanationSv:
      'Riksdagen väljer statsministern, som får i uppdrag att bilda regering. Statsministern väljer därefter ministrarna; varken kungen, Polismyndigheten eller regionfullmäktige väljer statsminister.',
    explanationEn:
      'The Riksdag chooses the prime minister, who is then tasked with forming a government. The prime minister chooses the ministers; neither the king, the Swedish Police Authority, nor regional councils choose the prime minister.',
    uhrReference: { chapter: 'Så här styrs Sverige', section: 'Staten', pageApprox: 12 },
    difficulty: 'medium',
    reviewStatus: 'reviewed',
    tags: ['government', 'prime-minister', 'riksdag'],
  },
  {
    id: 'q019',
    chapterId: 'ch04',
    type: 'single_choice',
    questionSv: 'Hur gammal måste man ha fyllt för att ha rösträtt?',
    questionEn: 'How old must a person be to have the right to vote?',
    options: [
      { id: 'a', textSv: '16 år', textEn: '16 years old' },
      { id: 'b', textSv: '18 år', textEn: '18 years old' },
      { id: 'c', textSv: '20 år', textEn: '20 years old' },
      { id: 'd', textSv: '25 år', textEn: '25 years old' },
    ],
    correctOptionId: 'b',
    explanationSv:
      'Man måste ha fyllt 18 år för att ha rösträtt. Därför är 16, 20 och 25 år fel här; i riksdagsval krävs också svenskt medborgarskap.',
    explanationEn:
      'A person must have turned 18 to have the right to vote. That is why 16, 20, and 25 are wrong here; voting in a Riksdag election also requires Swedish citizenship.',
    uhrReference: {
      chapter: 'Politiska val och partier',
      section: 'Val och röstning',
      pageApprox: 14,
    },
    supplementalSources: [VALMYNDIGHETEN_VOTING_RIGHTS_SOURCE],
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['voting-age', 'elections', 'riksdag'],
  },
  {
    id: 'q020',
    chapterId: 'ch04',
    type: 'single_choice',
    questionSv: 'Vad betyder det att folkomröstningar i Sverige är rådgivande?',
    questionEn: 'What does it mean that referendums in Sweden are advisory?',
    options: [
      {
        id: 'a',
        textSv: 'Politikerna behöver inte följa resultatet',
        textEn: 'Politicians do not have to follow the result',
      },
      {
        id: 'b',
        textSv: 'Politikerna måste alltid följa resultatet',
        textEn: 'Politicians must always follow the result',
      },
      {
        id: 'c',
        textSv: 'Folkomröstningar får bara hållas på nationell nivå',
        textEn: 'Referendums may only be held nationally',
      },
      {
        id: 'd',
        textSv: 'De ersätter ordinarie val till riksdagen',
        textEn: 'They replace regular Riksdag elections',
      },
    ],
    correctOptionId: 'a',
    explanationSv:
      'Folkomröstningar kan hållas om en särskild fråga nationellt, i en region eller i en kommun. De är rådgivande, så politikerna behöver inte följa resultatet.',
    explanationEn:
      'Referendums can be held on a specific issue nationally, in a region, or in a municipality. They are advisory, so politicians do not have to follow the result.',
    uhrReference: {
      chapter: 'Politiska val och partier',
      section: 'Folkomröstningar',
      pageApprox: 14,
    },
    difficulty: 'medium',
    reviewStatus: 'reviewed',
    tags: ['referendum', 'advisory', 'elections'],
  },
];

export const baseQuestions: PracticeQuestion[] = rawBaseQuestions.map(
  applyQuestionLocalizationPilot,
);

const localizedAdditionalQuestions: PracticeQuestion[] = additionalQuestions.map(
  applyQuestionLocalizationPilot,
);

export const sourceQuestions: PracticeQuestion[] = publishQuestions([
  ...baseQuestions,
  ...localizedAdditionalQuestions,
]);

export const generatedPublishedQuestions: PracticeQuestion[] = derivePublishedQuestions(
  sourceQuestions,
  sourceQuestions.length + 1,
).map(applyQuestionLocalizationPilot);

export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];
