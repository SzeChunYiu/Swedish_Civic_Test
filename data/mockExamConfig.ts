export interface MockExamConfig {
  questionCount: number;
  durationMinutes: number;
  sourceScope: 'uhr_based';
  showExplanationsDuringExam: boolean;
  adsAllowedDuringExam: boolean;
}

export const defaultMockExamConfig: MockExamConfig = {
  questionCount: 20,
  durationMinutes: 30,
  sourceScope: 'uhr_based',
  showExplanationsDuringExam: false,
  adsAllowedDuringExam: false,
};
