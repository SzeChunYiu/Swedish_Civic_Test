export const PRACTICE_INTERSTITIAL_LOAD_TIMEOUT_MS = 10_000;
export const PRACTICE_INTERSTITIAL_SHOW_TIMEOUT_MS = 8_000;

export type PracticeInterstitialAttemptPhase = 'loading' | 'showing' | 'settled';

export type PracticeInterstitialAttemptOutcome =
  | 'cleanup'
  | 'error'
  | 'load_timeout'
  | 'show_rejected'
  | 'show_resolved'
  | 'show_timeout'
  | 'opened'
  | 'closed';

export type PracticeInterstitialAttemptEvent =
  | 'cleanup'
  | 'error'
  | 'load_timeout'
  | 'loaded'
  | 'show_rejected'
  | 'show_resolved'
  | 'show_timeout'
  | 'opened'
  | 'closed';

export type PracticeInterstitialAttemptState = {
  inFlight: boolean;
  outcome?: PracticeInterstitialAttemptOutcome;
  phase: PracticeInterstitialAttemptPhase;
  settled: boolean;
  showKeyConsumed: boolean;
};

export function createPracticeInterstitialAttemptState(): PracticeInterstitialAttemptState {
  return {
    inFlight: true,
    phase: 'loading',
    settled: false,
    showKeyConsumed: false,
  };
}

function settleAttempt(
  state: PracticeInterstitialAttemptState,
  outcome: PracticeInterstitialAttemptOutcome,
  showKeyConsumed = false,
): PracticeInterstitialAttemptState {
  if (state.settled) return state;

  return {
    inFlight: false,
    outcome,
    phase: 'settled',
    settled: true,
    showKeyConsumed: state.showKeyConsumed || showKeyConsumed,
  };
}

export function reducePracticeInterstitialAttemptState(
  state: PracticeInterstitialAttemptState,
  event: PracticeInterstitialAttemptEvent,
): PracticeInterstitialAttemptState {
  if (state.settled) return state;

  switch (event) {
    case 'loaded':
      if (state.phase !== 'loading') return state;
      return { ...state, phase: 'showing' };
    case 'load_timeout':
      return state.phase === 'loading' ? settleAttempt(state, 'load_timeout') : state;
    case 'show_timeout':
      return state.phase === 'showing' ? settleAttempt(state, 'show_timeout') : state;
    case 'show_resolved':
      return state.phase === 'showing' ? settleAttempt(state, 'show_resolved', true) : state;
    case 'opened':
      return state.phase === 'showing' ? settleAttempt(state, 'opened', true) : state;
    case 'closed':
      return state.phase === 'showing' ? settleAttempt(state, 'closed', true) : state;
    case 'show_rejected':
      return state.phase === 'showing' ? settleAttempt(state, 'show_rejected') : state;
    case 'error':
      return settleAttempt(state, 'error');
    case 'cleanup':
      return settleAttempt(state, 'cleanup');
    default:
      return state;
  }
}
