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
      'UHR-avsnittet Geografi, klimat och natur säger att Sverige ligger i Norden i norra Europa. Det beskriver också Norden som en del av norra Europa, vilket gör alternativen om södra Europa, västra Asien och Nordamerika fel.',
    explanationEn:
      'The UHR section Geography, climate, and nature says that Sweden is in the Nordic region in northern Europe. It also describes the Nordic region as part of northern Europe, which makes the alternatives about southern Europe, western Asia, and North America incorrect.',
    uhrReference: {
      chapter: 'Landet Sverige',
      section: 'Geografi, klimat och natur',
      pageApprox: 5,
    },
    provenance: 'uhr',
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['geography', 'norden', 'location'],
  },
  {
    id: 'q002',
    chapterId: 'ch01',
    type: 'true_false',
    questionSv: 'Sant eller falskt: Sveriges nordligaste del ligger norr om polcirkeln.',
    questionEn: "True or false: Sweden's northernmost part lies north of the Arctic Circle.",
    options: [
      { id: 'true', textSv: 'Sant', textEn: 'True' },
      { id: 'false', textSv: 'Falskt', textEn: 'False' },
    ],
    correctOptionId: 'true',
    explanationSv:
      'UHR-avsnittet Geografi, klimat och natur beskriver att den nordligaste delen av landet ligger norr om polcirkeln, i det arktiska området. Därför är påståendet sant; alternativet Falskt motsäger källan.',
    explanationEn:
      'The UHR section Geography, climate, and nature says the northernmost part of the country lies north of the Arctic Circle, in the Arctic area. Therefore the statement is true; the False option contradicts the source.',
    uhrReference: {
      chapter: 'Landet Sverige',
      section: 'Geografi, klimat och natur',
      pageApprox: 5,
    },
    provenance: 'uhr',
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
      'UHR-avsnittet Geografi, klimat och natur säger att Sverige är ett avlångt land som sträcker sig cirka 1 600 kilometer från den nordligaste punkten, Treriksröset, till den sydligaste punkten, Smygehuk. Därför är 1 600 kilometer rätt; 160 och 60 kilometer är för korta och 16 000 kilometer är för långt.',
    explanationEn:
      'The UHR section Geography, climate, and nature says that Sweden is an elongated country stretching about 1,600 kilometres from the northernmost point, Treriksröset, to the southernmost point, Smygehuk. Therefore 1,600 kilometres is correct; 160 and 60 kilometres are too short, and 16,000 kilometres is too long.',
    uhrReference: {
      chapter: 'Landet Sverige',
      section: 'Geografi, klimat och natur',
      pageApprox: 5,
    },
    provenance: 'uhr',
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
      'UHR-avsnittet Geografi, klimat och natur säger att havet vid Sveriges östra kust heter Östersjön. Samma avsnitt säger att Skagerrak och Kattegatt ligger vid västkusten, vilket gör de andra alternativen fel.',
    explanationEn:
      'The UHR section Geography, climate, and nature says that the sea along Sweden’s eastern coast is the Baltic Sea. The same section says Skagerrak and Kattegat are on the west coast, which makes the other options incorrect.',
    uhrReference: {
      chapter: 'Landet Sverige',
      section: 'Geografi, klimat och natur',
      pageApprox: 5,
    },
    provenance: 'uhr',
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
      'UHR-avsnittet Geografi, klimat och natur säger att Sveriges två största öar är Gotland och Öland. Hisingen, Orust, Värmdö och Tjörn nämns inte som de två största där, och Malmö och Göteborg är städer.',
    explanationEn:
      'The UHR section Geography, climate, and nature says that Sweden’s two largest islands are Gotland and Öland. Hisingen, Orust, Värmdö, and Tjörn are not named there as the two largest, and Malmö and Gothenburg are cities.',
    uhrReference: {
      chapter: 'Landet Sverige',
      section: 'Geografi, klimat och natur',
      pageApprox: 5,
    },
    provenance: 'uhr',
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
      'UHR-avsnittet Geografi, klimat och natur säger att Sverige har ett milt klimat jämfört med många områden på samma breddgrad. Det förklaras med att Golfströmmen och den Nordatlantiska strömmen för varmt vatten mot Europa, vilket värmer luften som vindarna för in över Sverige.',
    explanationEn:
      'The UHR section Geography, climate, and nature says Sweden has a mild climate compared with many areas at the same latitude. It explains this with the Gulf Stream and the North Atlantic Current carrying warm water toward Europe, warming the air that winds bring over Sweden.',
    uhrReference: {
      chapter: 'Landet Sverige',
      section: 'Geografi, klimat och natur',
      pageApprox: 5,
    },
    provenance: 'uhr',
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
      'UHR-avsnittet Fjäll säger att bergskedjan Skanderna ligger längs gränsen mot Norge och kallas fjällen. Där finns Sveriges högsta berg Kebnekaise, som är cirka 2 000 meter högt.',
    explanationEn:
      "The UHR section Mountains says the Scandinavian Mountains lie along the border with Norway and are called fjällen. Sweden's highest mountain, Kebnekaise, is there and is about 2,000 metres high.",
    uhrReference: { chapter: 'Landet Sverige', section: 'Fjäll', pageApprox: 6 },
    provenance: 'uhr',
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
      'UHR-avsnittet Skogar, sjöar och öar säger att Sverige har många sjöar spridda över hela landet och att de tre största är Vänern, Vättern och Mälaren. Alternativen med hav, öar eller städer blandar ihop andra geografiska begrepp med sjöar.',
    explanationEn:
      'The UHR section Forests, lakes, and islands says Sweden has many lakes spread throughout the country and that the three largest are Vänern, Vättern, and Mälaren. The alternatives with seas, islands, or cities confuse other geographical concepts with lakes.',
    uhrReference: { chapter: 'Landet Sverige', section: 'Skogar, sjöar och öar', pageApprox: 6 },
    provenance: 'uhr',
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
      'UHR-avsnittet Befolkning säger att det bor nästan 11 miljoner människor i Sverige. Det beskriver också att befolkningen inte är jämnt fördelad och att de flesta bor i södra Sverige och längs kusterna.',
    explanationEn:
      'The UHR section Population says almost 11 million people live in Sweden. It also describes the population as unevenly distributed, with most people living in southern Sweden and along the coasts.',
    uhrReference: { chapter: 'Landet Sverige', section: 'Befolkning', pageApprox: 7 },
    provenance: 'uhr',
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['population', 'demography', 'sweden'],
  },
  {
    id: 'q010',
    chapterId: 'ch01',
    type: 'single_choice',
    questionSv: 'Vilka naturresurser nämner UHR-materialet som viktiga i Sverige?',
    questionEn: 'Which natural resources does the UHR material mention as important in Sweden?',
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
      'UHR-avsnittet Naturresurser säger att Sverige är rikt på flera viktiga naturresurser: järnmalm och andra mineraler, skog, jordbruksmark och vatten. Därför är alternativet med dessa resurser rätt, medan alternativen med olja, naturgas, ökenmark, tropiskt regn och liknande inte stöds av avsnittet.',
    explanationEn:
      'The UHR section Natural resources says Sweden is rich in several important natural resources: iron ore and other minerals, forest, agricultural land, and water. That makes the option with those resources correct, while the alternatives about oil, natural gas, desert land, tropical rain, and similar items are not supported by the section.',
    uhrReference: {
      chapter: 'Landet Sverige',
      section: 'Naturresurser',
      pageApprox: 7,
    },
    provenance: 'uhr',
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
      'UHR-avsnittet Demokrati betyder folkstyre säger att demokrati är ett politiskt system där makten utgår från folket. Det betyder att medborgarna kan påverka beslut, välja mellan flera politiska alternativ och byta ut dem som får makten.',
    explanationEn:
      'The UHR section Democracy means rule by the people says democracy is a political system where power comes from the people. This means citizens can influence decisions, choose between several political alternatives, and replace those who are given power.',
    uhrReference: {
      chapter: 'Sveriges demokratiska system',
      section: 'Demokrati betyder folkstyre',
      pageApprox: 10,
    },
    provenance: 'uhr',
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['democracy', 'definition', 'folkstyre'],
  },
  {
    id: 'q012',
    chapterId: 'ch02',
    type: 'single_choice',
    questionSv: 'Vad beskriver UHR-materialet som en del av fria val i en demokrati?',
    questionEn: 'What does the UHR material describe as part of free elections in a democracy?',
    options: [
      {
        id: 'a',
        textSv: 'Alla som har rätt att rösta har en röst var',
        textEn: 'Everyone who has the right to vote has one vote each',
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
      'UHR-avsnittet Demokrati betyder folkstyre säger att fria val innebär att alla som har rätt att rösta har en röst var. Avsnittet säger också att väljare ska kunna uttrycka åsikter utan hot eller tvång, att det ska finnas flera partier och att valet ska vara hemligt.',
    explanationEn:
      'The UHR section Democracy means rule by the people says that free elections mean everyone who has the right to vote has one vote each. It also says voters should be able to express opinions without threats or coercion, that there should be several parties, and that the vote should be secret.',
    uhrReference: {
      chapter: 'Sveriges demokratiska system',
      section: 'Demokrati betyder folkstyre',
      pageApprox: 10,
    },
    provenance: 'uhr',
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['democracy', 'elections', 'voting'],
  },
  {
    id: 'q013',
    chapterId: 'ch02',
    type: 'single_choice',
    questionSv: 'Vad nämner UHR-materialet som ett sätt att påverka och delta i samhället?',
    questionEn:
      'What does the UHR material mention as a way to influence and participate in society?',
    options: [
      {
        id: 'a',
        textSv: 'Kontakta politiker, demonstrera eller skriva på en namninsamling',
        textEn: 'Contact politicians, demonstrate, or sign a petition',
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
      'UHR-avsnittet En stark demokrati listar flera sätt att påverka och delta i samhället, bland annat att kontakta politiker, demonstrera och starta eller skriva på en namninsamling. Därför är alternativet med politiker, demonstrationer och namninsamlingar rätt; de andra alternativen skulle begränsa demokratiskt deltagande.',
    explanationEn:
      'The UHR section A strong democracy lists several ways to influence and participate in society, including contacting politicians, demonstrating, and starting or signing a petition. Therefore the option about politicians, demonstrations, and petitions is correct; the other options would restrict democratic participation.',
    uhrReference: {
      chapter: 'Sveriges demokratiska system',
      section: 'En stark demokrati',
      pageApprox: 10,
    },
    provenance: 'uhr',
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['participation', 'democracy', 'influence'],
  },
  {
    id: 'q014',
    chapterId: 'ch02',
    type: 'single_choice',
    questionSv:
      'Vad kallar UHR-materialet att lagarna gäller för alla och att ingen får dömas utan en rättvis rättegång?',
    questionEn:
      'What does the UHR material call it when laws apply to everyone and no one may be sentenced without a fair trial?',
    options: [
      {
        id: 'a',
        textSv: 'Rättssäkerhet',
        textEn: 'Legal certainty',
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
      'UHR-avsnittet Demokrati betyder folkstyre säger att en viktig förutsättning för demokrati är att lagarna gäller för alla i Sverige och att ingen får dömas utan en rättvis rättegång. Materialet kallar detta rättssäkerhet; de andra alternativen beskriver andra begrepp.',
    explanationEn:
      'The UHR section Democracy means rule by the people says an important condition for democracy is that laws apply to everyone in Sweden and that no one may be sentenced without a fair trial. The material calls this legal certainty; the other alternatives describe different concepts.',
    uhrReference: {
      chapter: 'Sveriges demokratiska system',
      section: 'Demokrati betyder folkstyre',
      pageApprox: 10,
    },
    provenance: 'uhr',
    difficulty: 'medium',
    reviewStatus: 'reviewed',
    tags: ['legal-certainty', 'democracy', 'fair-trial'],
  },
  {
    id: 'q015',
    chapterId: 'ch02',
    type: 'true_false',
    questionSv: 'Sant eller falskt: Ett lågt valdeltagande kan påverka demokratin.',
    questionEn: 'True or false: A low voter turnout can affect democracy.',
    options: [
      { id: 'true', textSv: 'Sant', textEn: 'True' },
      { id: 'false', textSv: 'Falskt', textEn: 'False' },
    ],
    correctOptionId: 'true',
    explanationSv:
      'UHR-avsnittet Hot mot demokratin säger att lågt valdeltagande är ett problem som kan påverka demokratin. Det kan leda till att människor får mindre möjlighet att påverka politiska beslut i sin vardag och kan öka skillnaderna mellan grupper i samhället.',
    explanationEn:
      'The UHR section Threats to democracy says a low voter turnout is a problem that can affect democracy. It can give people fewer opportunities to influence political decisions in everyday life and can increase differences between groups in society.',
    uhrReference: {
      chapter: 'Sveriges demokratiska system',
      section: 'Hot mot demokratin',
      pageApprox: 11,
    },
    provenance: 'uhr',
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['democracy', 'voter-turnout', 'threats-to-democracy', 'true-false'],
  },
  {
    id: 'q016',
    chapterId: 'ch03',
    type: 'single_choice',
    questionSv: 'Vad innebär det att Sverige är en parlamentarisk representativ demokrati?',
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
      'UHR-avsnittet Staten säger att Sverige är en parlamentarisk representativ demokrati. Det innebär att medborgarna röstar i allmänna val och väljer ledamöter till riksdagen, som sedan fattar beslut om lagar och statens budget.',
    explanationEn:
      'The UHR section The state says Sweden is a parliamentary representative democracy. This means citizens vote in general elections and elect members of the Riksdag, which then makes decisions on laws and the state budget.',
    uhrReference: { chapter: 'Så här styrs Sverige', section: 'Staten', pageApprox: 12 },
    provenance: 'uhr',
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
      'UHR-avsnittet Staten säger att riksdagen har 349 ledamöter som väljs vart fjärde år. Siffrorna 21 och 290 hör i materialet ihop med regioner och kommuner, inte med riksdagens ledamöter.',
    explanationEn:
      'The UHR section The state says the Riksdag has 349 members who are elected every four years. The numbers 21 and 290 are connected in the material to regions and municipalities, not to members of the Riksdag.',
    uhrReference: { chapter: 'Så här styrs Sverige', section: 'Staten', pageApprox: 12 },
    provenance: 'uhr',
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
      'UHR-avsnittet Staten säger att riksdagen väljer statsminister, som får i uppdrag att bilda regering. Statsministern väljer därefter ministrarna i regeringen.',
    explanationEn:
      'The UHR section The state says the Riksdag chooses the prime minister, who is given the task of forming a government. The prime minister then chooses the government ministers.',
    uhrReference: { chapter: 'Så här styrs Sverige', section: 'Staten', pageApprox: 12 },
    provenance: 'uhr',
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
      'UHR-avsnittet Val och röstning säger att man ska ha fyllt 18 år för att ha rösträtt. För att rösta i riksdagsvalet måste man dessutom vara svensk medborgare.',
    explanationEn:
      'The UHR section Elections and voting says a person must have turned 18 to have the right to vote. To vote in a Riksdag election, a person must also be a Swedish citizen.',
    uhrReference: {
      chapter: 'Politiska val och partier',
      section: 'Val och röstning',
      pageApprox: 14,
    },
    provenance: 'uhr',
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['voting-age', 'elections', 'riksdag'],
  },
  {
    id: 'q020',
    chapterId: 'ch04',
    type: 'true_false',
    questionSv: 'Sant eller falskt: Folkomröstningar i Sverige är rådgivande.',
    questionEn: 'True or false: Referendums in Sweden are advisory.',
    options: [
      { id: 'true', textSv: 'Sant', textEn: 'True' },
      { id: 'false', textSv: 'Falskt', textEn: 'False' },
    ],
    correctOptionId: 'true',
    explanationSv:
      'UHR-avsnittet Folkomröstningar säger att folkomröstningar kan hållas nationellt, i en region eller i en kommun. Avsnittet säger också att de är rådgivande, vilket betyder att politikerna inte måste följa resultatet.',
    explanationEn:
      'The UHR section Referendums says referendums can be held nationally, in a region, or in a municipality. It also says they are advisory, which means politicians do not have to follow the result.',
    uhrReference: {
      chapter: 'Politiska val och partier',
      section: 'Folkomröstningar',
      pageApprox: 14,
    },
    provenance: 'uhr',
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
  sourceQuestions.length + 1,
);

export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];
