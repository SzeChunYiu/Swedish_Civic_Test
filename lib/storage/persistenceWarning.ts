export type PersistenceOperation = 'read' | 'write';

export type RecoverablePersistenceWarning = {
  type: 'recoverable-persistence-warning';
  recoverable: true;
  storageId: string;
  key: string;
  operation: PersistenceOperation;
  message: string;
  errorMessage?: string;
};

type WritableStorage = {
  set: (key: string, value: boolean | number | string) => void;
};

export type RecoverableReadResult<T> = {
  value: T | undefined;
  warning: RecoverablePersistenceWarning | null;
};

function describeError(error: unknown): string | undefined {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.length > 0) return error;
  return undefined;
}

export function createRecoverablePersistenceWarning({
  error,
  key,
  operation,
  storageId,
}: {
  error: unknown;
  key: string;
  operation: PersistenceOperation;
  storageId: string;
}): RecoverablePersistenceWarning {
  const errorMessage = describeError(error);
  return {
    type: 'recoverable-persistence-warning',
    recoverable: true,
    storageId,
    key,
    operation,
    message: `${storageId} ${operation} failed; using in-memory state for this session.`,
    ...(errorMessage ? { errorMessage } : {}),
  };
}

export function writeRecoverably(
  storage: WritableStorage | null,
  storageId: string,
  key: string,
  value: boolean | number | string,
): RecoverablePersistenceWarning | null {
  if (!storage) return null;

  try {
    storage.set(key, value);
    return null;
  } catch (error) {
    return createRecoverablePersistenceWarning({
      error,
      key,
      operation: 'write',
      storageId,
    });
  }
}

export function readRecoverably<T>(
  storage: object | null,
  storageId: string,
  key: string,
  read: () => T | undefined,
): RecoverableReadResult<T> {
  if (!storage) return { value: undefined, warning: null };

  try {
    return { value: read(), warning: null };
  } catch (error) {
    return {
      value: undefined,
      warning: createRecoverablePersistenceWarning({
        error,
        key,
        operation: 'read',
        storageId,
      }),
    };
  }
}
