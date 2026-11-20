import firebaseConfig from '../../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code || '')
      : '';
  const detail = error instanceof Error ? error.message : String(error);
  const location = path || 'the selected collection';

  // Log useful diagnostics without putting the owner's UID, email or
  // authentication token in the user-facing error message.
  console.error('Firestore request failed:', {
    operationType,
    path: location,
    code,
    message: detail,
  });

  if (code === 'permission-denied' || /Missing or insufficient permissions/i.test(detail)) {
    throw new Error(
      `Firestore permission denied while trying to ${operationType} ${location}. ` +
      'Confirm that the current firestore.rules are published to the exact named ' +
      `Firestore database configured for the website (${firebaseConfig.firestoreDatabaseId}), ` +
      'then sign out/in and retry. Do not enable public writes.'
    );
  }

  throw new Error(`Firestore ${operationType} failed at ${location}: ${detail}`);
}
