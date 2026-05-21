const firstRunDeferralKey = 'sct_launch_popup_first_run_deferred';

type SessionStorageLike = {
  getItem: (key: string) => string | null;
  removeItem?: (key: string) => void;
  setItem: (key: string, value: string) => void;
};

type LaunchPopupGlobal = typeof globalThis & {
  __sctLaunchPopupFirstRunDeferred?: boolean;
  sessionStorage?: SessionStorageLike;
};

function getLaunchPopupGlobal(): LaunchPopupGlobal | null {
  if (typeof globalThis === 'undefined') return null;
  return globalThis as LaunchPopupGlobal;
}

function getSessionStorage(): SessionStorageLike | null {
  try {
    return getLaunchPopupGlobal()?.sessionStorage ?? null;
  } catch {
    return null;
  }
}

const firstRunDeferralListeners = new Set<() => void>();

function notifyFirstRunDeferralListeners() {
  firstRunDeferralListeners.forEach((listener) => listener());
}

export function deferFirstRunAboutModalForLaunchSession() {
  const runtime = getLaunchPopupGlobal();
  if (runtime) runtime.__sctLaunchPopupFirstRunDeferred = true;

  try {
    getSessionStorage()?.setItem(firstRunDeferralKey, '1');
  } catch {
    // Session storage is optional on native and restricted browser contexts.
  }

  notifyFirstRunDeferralListeners();
}

export function clearFirstRunAboutModalDeferralForLaunchSession() {
  const runtime = getLaunchPopupGlobal();
  if (runtime) runtime.__sctLaunchPopupFirstRunDeferred = false;

  try {
    const storage = getSessionStorage();
    if (storage?.removeItem) {
      storage.removeItem(firstRunDeferralKey);
    } else {
      storage?.setItem(firstRunDeferralKey, '0');
    }
  } catch {
    // Session storage is optional on native and restricted browser contexts.
  }

  notifyFirstRunDeferralListeners();
}

export function shouldDeferFirstRunAboutModalForLaunchSession(): boolean {
  const runtime = getLaunchPopupGlobal();
  if (runtime?.__sctLaunchPopupFirstRunDeferred) return true;

  try {
    return getSessionStorage()?.getItem(firstRunDeferralKey) === '1';
  } catch {
    return false;
  }
}

export function subscribeToFirstRunAboutModalDeferralForLaunchSession(listener: () => void) {
  firstRunDeferralListeners.add(listener);
  return () => {
    firstRunDeferralListeners.delete(listener);
  };
}
