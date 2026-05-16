import type { Chapter } from '../types/content';

export interface UHRChapterPageRange {
  chapterId: Chapter['id'];
  chapterNameSv: string;
  startPage: number;
  endPage: number;
  sections: UHRSectionReference[];
}

export interface UHRSectionReference {
  title: string;
  startPage: number;
  endPage: number;
}

export const uhrChapterPageRanges: UHRChapterPageRange[] = [
  {
    chapterId: 'ch01',
    chapterNameSv: 'Landet Sverige',
    startPage: 5,
    endPage: 9,
    sections: [
      { title: 'Geografi, klimat och natur', startPage: 5, endPage: 5 },
      { title: 'Fjäll', startPage: 6, endPage: 6 },
      { title: 'Skogar, sjöar och öar', startPage: 6, endPage: 6 },
      { title: 'Befolkning', startPage: 7, endPage: 7 },
    ],
  },
  {
    chapterId: 'ch02',
    chapterNameSv: 'Sveriges demokratiska system',
    startPage: 10,
    endPage: 11,
    sections: [
      { title: 'Demokrati betyder folkstyre', startPage: 10, endPage: 10 },
      { title: 'En stark demokrati', startPage: 10, endPage: 10 },
      { title: 'Hot mot demokratin', startPage: 11, endPage: 11 },
    ],
  },
  {
    chapterId: 'ch03',
    chapterNameSv: 'Så här styrs Sverige',
    startPage: 12,
    endPage: 13,
    sections: [
      { title: 'Landet styrs på olika nivåer', startPage: 12, endPage: 12 },
      { title: 'Staten', startPage: 12, endPage: 12 },
      { title: 'Myndigheter', startPage: 13, endPage: 13 },
      { title: 'Regioner och kommuner', startPage: 13, endPage: 13 },
      { title: 'Kommunernas ansvar', startPage: 13, endPage: 13 },
      { title: 'Sveriges statsskick', startPage: 13, endPage: 13 },
    ],
  },
  {
    chapterId: 'ch04',
    chapterNameSv: 'Politiska val och partier',
    startPage: 14,
    endPage: 15,
    sections: [
      { title: 'Val och röstning', startPage: 14, endPage: 14 },
      { title: 'Folkomröstningar', startPage: 14, endPage: 14 },
      { title: 'Så här går det till att rösta', startPage: 14, endPage: 15 },
      { title: 'Politiska partier', startPage: 15, endPage: 15 },
      { title: 'Proportionella val', startPage: 15, endPage: 15 },
    ],
  },
  {
    chapterId: 'ch05',
    chapterNameSv: 'Lag och rätt',
    startPage: 16,
    endPage: 19,
    sections: [
      { title: 'Grundlagarna', startPage: 16, endPage: 16 },
      { title: 'Regeringsformen', startPage: 16, endPage: 16 },
      { title: 'Successionsordningen', startPage: 16, endPage: 16 },
      { title: 'Allemansrätten', startPage: 17, endPage: 17 },
      { title: 'Rättsväsendet', startPage: 17, endPage: 17 },
      { title: 'Rättssäkerhet', startPage: 17, endPage: 17 },
      { title: 'Domstolar', startPage: 18, endPage: 18 },
      { title: 'Polisen', startPage: 18, endPage: 18 },
      { title: 'Straffmyndighet och belastningsregister', startPage: 19, endPage: 19 },
    ],
  },
  {
    chapterId: 'ch06',
    chapterNameSv: 'Mediernas roll',
    startPage: 20,
    endPage: 21,
    sections: [
      { title: 'Fria medier', startPage: 20, endPage: 20 },
      { title: 'Public service', startPage: 21, endPage: 21 },
      { title: 'Källkritik', startPage: 21, endPage: 21 },
    ],
  },
  {
    chapterId: 'ch07',
    chapterNameSv: 'Mänskliga rättigheter',
    startPage: 22,
    endPage: 26,
    sections: [
      { title: 'Mänskliga rättigheter gäller alla', startPage: 22, endPage: 22 },
      {
        title: 'FN:s förklaring om de mänskliga rättigheterna',
        startPage: 22,
        endPage: 22,
      },
      { title: 'Jämställdhet mellan könen', startPage: 23, endPage: 23 },
      { title: 'Könsrelaterat våld och förtryck', startPage: 23, endPage: 24 },
      { title: 'Sexköpslagen', startPage: 24, endPage: 24 },
      { title: 'Barns rättigheter', startPage: 24, endPage: 25 },
      { title: 'Nationella minoriteter och urfolk', startPage: 25, endPage: 25 },
      { title: 'Hbtqi-personer', startPage: 26, endPage: 26 },
      { title: 'Arbetet mot diskriminering', startPage: 26, endPage: 26 },
    ],
  },
  {
    chapterId: 'ch08',
    chapterNameSv: 'Arbetsmarknad och privatekonomi',
    startPage: 27,
    endPage: 29,
    sections: [
      { title: 'Så fungerar arbetsmarknaden', startPage: 27, endPage: 27 },
      { title: 'Arbetsmarknadens parter', startPage: 28, endPage: 28 },
      { title: 'Lagar och regler på arbetsmarknaden', startPage: 29, endPage: 29 },
      { title: 'A-kassan', startPage: 29, endPage: 29 },
      { title: 'Privatekonomi i Sverige', startPage: 29, endPage: 29 },
    ],
  },
  {
    chapterId: 'ch09',
    chapterNameSv: 'Välfärdssamhället',
    startPage: 30,
    endPage: 31,
    sections: [
      { title: 'Skatter för Sveriges välfärd', startPage: 30, endPage: 30 },
      { title: 'Statligt finansierad välfärd', startPage: 30, endPage: 30 },
      { title: 'Regionerna ansvarar för sjukvården', startPage: 30, endPage: 31 },
      { title: 'Kommunerna har ett stort ansvar', startPage: 31, endPage: 31 },
    ],
  },
  {
    chapterId: 'ch10',
    chapterNameSv: 'Sveriges moderna historia',
    startPage: 32,
    endPage: 38,
    sections: [
      { title: 'Från jordbrukssamhälle till industrisamhälle', startPage: 32, endPage: 32 },
      { title: 'Befolkningsökning', startPage: 32, endPage: 32 },
      { title: 'Sveriges väg till demokrati', startPage: 33, endPage: 33 },
      { title: 'Folkrörelserna', startPage: 33, endPage: 33 },
      { title: 'Demokratins genombrott', startPage: 33, endPage: 34 },
      { title: 'Den svenska modellen', startPage: 35, endPage: 35 },
      { title: 'Rekordåren', startPage: 36, endPage: 36 },
      { title: 'Sverige blir ett invandrarland', startPage: 36, endPage: 36 },
      { title: 'Digital revolution och globalisering', startPage: 38, endPage: 38 },
    ],
  },
  {
    chapterId: 'ch11',
    chapterNameSv: 'Sverige och omvärlden',
    startPage: 39,
    endPage: 41,
    sections: [
      { title: 'Nordiskt samarbete', startPage: 39, endPage: 39 },
      { title: 'EU och Europarådet', startPage: 39, endPage: 39 },
      { title: 'Globalt samarbete', startPage: 39, endPage: 39 },
      { title: 'Förenta nationerna (FN)', startPage: 39, endPage: 39 },
      { title: 'Försvars- och säkerhetspolitik', startPage: 40, endPage: 40 },
      { title: 'Den långa fredens historia', startPage: 40, endPage: 40 },
      { title: 'Sveriges försvar', startPage: 40, endPage: 41 },
      { title: 'Det civila försvaret', startPage: 41, endPage: 41 },
    ],
  },
  {
    chapterId: 'ch12',
    chapterNameSv: 'En sekulär stat och ett mångreligiöst land',
    startPage: 42,
    endPage: 44,
    sections: [
      { title: 'Religionsfrihet', startPage: 42, endPage: 42 },
      { title: 'Kristendom', startPage: 43, endPage: 43 },
      { title: 'Judendom', startPage: 43, endPage: 43 },
      { title: 'Hinduism och buddhism', startPage: 43, endPage: 43 },
      { title: 'Islam', startPage: 44, endPage: 44 },
    ],
  },
  {
    chapterId: 'ch13',
    chapterNameSv: 'Traditioner och högtider',
    startPage: 45,
    endPage: 47,
    sections: [
      { title: 'Några traditionella högtider under året', startPage: 45, endPage: 45 },
      { title: 'Påsk', startPage: 45, endPage: 45 },
      { title: 'Valborgsmässoafton', startPage: 46, endPage: 46 },
      { title: 'Första maj', startPage: 46, endPage: 46 },
      { title: 'Sveriges nationaldag', startPage: 46, endPage: 46 },
      { title: 'Midsommar', startPage: 46, endPage: 46 },
      { title: 'Alla helgons dag', startPage: 46, endPage: 46 },
      { title: 'Advent', startPage: 47, endPage: 47 },
      { title: 'Lucia', startPage: 47, endPage: 47 },
      { title: 'Jul', startPage: 47, endPage: 47 },
      { title: 'Nya traditioner', startPage: 47, endPage: 47 },
    ],
  },
];

export function findUhrChapterPageRange(chapterId: Chapter['id']): UHRChapterPageRange | undefined {
  return uhrChapterPageRanges.find((pageRange) => pageRange.chapterId === chapterId);
}

export function findUhrSectionReference(
  chapterId: Chapter['id'],
  sectionTitle: string,
): UHRSectionReference | undefined {
  return findUhrChapterPageRange(chapterId)?.sections.find(
    (section) => section.title === sectionTitle,
  );
}

export function isPageInsideUhrRange(
  pageApprox: number | undefined,
  pageRange: Pick<UHRChapterPageRange | UHRSectionReference, 'startPage' | 'endPage'> | undefined,
): boolean {
  if (typeof pageApprox !== 'number' || !Number.isInteger(pageApprox) || !pageRange) return false;
  return pageApprox >= pageRange.startPage && pageApprox <= pageRange.endPage;
}
