export type ErrorKind =
  | 'transient'     // retry with backoff
  | 'throttled'     // SendGrid 429 — requeue without burning an attempt
  | 'permanent'     // hard bounce / suppression — settle now, never DLQ
  | 'exhausted';    // max retries hit → DLQ

export class WorkerError extends Error {
  constructor(
    public readonly kind: ErrorKind,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'WorkerError';
  }
}

export function classifyError(err: unknown): ErrorKind {
  if (err instanceof WorkerError) return err.kind;

  const status = (err as Record<string, unknown>)?.['code'] as number | undefined;
  if (status === 429) return 'throttled';
  if (status && status >= 500) return 'transient';
  if (status === 400 || status === 422) return 'permanent'; // bad email / invalid recipient
  return 'transient';
}
