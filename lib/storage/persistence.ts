export type StoragePersistenceWarning = {
  key: string;
  message: string;
  occurredAt: string;
  operation: 'write';
  storageId: string;
};

export function createStoragePersistenceWarning(
  storageId: string,
  key: string,
  error: unknown,
): StoragePersistenceWarning {
  const message = error instanceof Error ? error.message : 'Unknown persistence failure';

  return {
    key,
    message,
    occurredAt: new Date().toISOString(),
    operation: 'write',
    storageId,
  };
}
