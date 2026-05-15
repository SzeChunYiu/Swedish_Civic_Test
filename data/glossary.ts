export interface GlossaryTerm {
  id: string;
  termSv: string;
  termEn: string;
  explanationSv: string;
  explanationEn: string;
  chapterId?: string;
}

export const glossaryTerms: GlossaryTerm[] = [];
