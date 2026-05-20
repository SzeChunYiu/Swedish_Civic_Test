// Swedish mascot catalog (blueprint 23).
//
// Pure data — bilingual labels + cultural anchor + recommended chapter
// affinities. Consumed by:
//   - components/mascot/CompanionPicker.tsx (settings grid)
//   - components/mascot/Mascot.tsx (a11y label + path lookup)
//   - lib/storage/companionStore.ts (id validation + fallback)
//
// File-size budget for the SVG assets they reference: blueprint 23 § File structure.

export type MascotId =
  | 'dala-horse'
  | 'kanelbulle'
  | 'skoglimpa'
  | 'moose'
  | 'tomte'
  | 'salmon'
  | 'fika-cup'
  | 'vasa-ship'
  | 'midsummer-pole'
  | 'lucia'
  | 'snowman';

export type MascotExpression = 'idle' | 'happy' | 'oops' | 'think' | 'celebrate';

export const MASCOT_EXPRESSIONS: readonly MascotExpression[] = [
  'idle',
  'happy',
  'oops',
  'think',
  'celebrate',
];

export interface MascotDescriptor {
  id: MascotId;
  /** User-facing label, Swedish. */
  labelSv: string;
  /** User-facing label, English. */
  labelEn: string;
  /** One-line cultural anchor in Swedish for the picker description + a11y. */
  anchorSv: string;
  /** One-line cultural anchor in English. */
  anchorEn: string;
  /** Loose chapter affinity — used for "this chapter resonates with X" hints, never as a hard map. */
  affinity?: string[];
}

export const FAVORITE_COMPANION_IDS = [
  'kanelbulle',
  'skoglimpa',
] as const satisfies readonly MascotId[];

export const MASCOT_CATALOG: readonly MascotDescriptor[] = [
  {
    id: 'dala-horse',
    labelSv: 'Dalahäst',
    labelEn: 'Dala horse',
    anchorSv: 'Folksymbol från Dalarna.',
    anchorEn: 'Folk symbol from Dalarna.',
    affinity: ['regional-culture', 'folklore'],
  },
  {
    id: 'kanelbulle',
    labelSv: 'Kanelbulle',
    labelEn: 'Cinnamon bun',
    anchorSv: 'Fika och vardagskultur.',
    anchorEn: 'Fika and everyday culture.',
    affinity: ['everyday-culture'],
  },
  {
    id: 'skoglimpa',
    labelSv: 'Skoglimpa',
    labelEn: 'Swedish rye loaf',
    anchorSv: 'Mörkt rågbröd och svensk vardagsmat.',
    anchorEn: 'Dark rye bread and everyday Swedish food.',
    affinity: ['everyday-culture', 'food'],
  },
  {
    id: 'moose',
    labelSv: 'Älg',
    labelEn: 'Moose',
    anchorSv: 'Vilda djur och allemansrätten.',
    anchorEn: 'Wildlife and the right to roam.',
    affinity: ['nature', 'environment'],
  },
  {
    id: 'tomte',
    labelSv: 'Tomte',
    labelEn: 'Tomte (Christmas gnome)',
    anchorSv: 'Folktro och vinterhögtider.',
    anchorEn: 'Folklore and winter holidays.',
    affinity: ['traditions', 'holidays'],
  },
  {
    id: 'salmon',
    labelSv: 'Lax',
    labelEn: 'Salmon',
    anchorSv: 'Sjöar, fiske och natur.',
    anchorEn: 'Lakes, fishing, and nature.',
    affinity: ['geography', 'nature', 'food'],
  },
  {
    id: 'fika-cup',
    labelSv: 'Kaffekopp',
    labelEn: 'Coffee cup',
    anchorSv: 'Fika och socialt liv.',
    anchorEn: 'Coffee culture and social life.',
    affinity: ['everyday-culture'],
  },
  {
    id: 'vasa-ship',
    labelSv: 'Vasaskeppet',
    labelEn: 'Vasa ship',
    anchorSv: 'Stockholms historia, 1628.',
    anchorEn: 'Stockholm history, 1628.',
    affinity: ['history', 'stockholm'],
  },
  {
    id: 'midsummer-pole',
    labelSv: 'Midsommarstång',
    labelEn: 'Midsummer pole',
    anchorSv: 'Midsommarfirande.',
    anchorEn: 'Midsummer celebration.',
    affinity: ['traditions', 'holidays'],
  },
  {
    id: 'lucia',
    labelSv: 'Lucia',
    labelEn: 'Lucia',
    anchorSv: 'Ljusbärartradition 13 december.',
    anchorEn: 'December 13 candle procession.',
    affinity: ['traditions', 'christian-holidays'],
  },
  {
    id: 'snowman',
    labelSv: 'Snögubbe',
    labelEn: 'Snowman',
    anchorSv: 'Vinter och klimat.',
    anchorEn: 'Winter and climate.',
    affinity: ['climate', 'seasons'],
  },
];

/** Default companion if the user has not yet picked one. */
export const DEFAULT_COMPANION_ID: MascotId = 'kanelbulle';

export function getMascot(id: string): MascotDescriptor | null {
  return MASCOT_CATALOG.find((m) => m.id === id) ?? null;
}

export function isMascotId(value: unknown): value is MascotId {
  return typeof value === 'string' && MASCOT_CATALOG.some((m) => m.id === value);
}

export function getCompanionPickerMascots(): readonly MascotDescriptor[] {
  const favoriteMascots = FAVORITE_COMPANION_IDS.map((id) => getMascot(id)).filter(
    (mascot): mascot is MascotDescriptor => mascot !== null,
  );
  const favorites = new Set<MascotId>(FAVORITE_COMPANION_IDS);
  const remainingMascots = MASCOT_CATALOG.filter((mascot) => !favorites.has(mascot.id));

  return [...favoriteMascots, ...remainingMascots];
}

/** Asset path for a given mascot + expression. Caller passes to <SvgUri>. */
export function mascotAssetPath(id: MascotId, expression: MascotExpression): string {
  return `assets/mascot/${id}/${expression}.svg`;
}
