// Request/response envelope shapes used by both the API and the web client

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface IdempotentRequest {
  idempotencyKey?: string;
}

// Auth
export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  workspaceName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Campaigns
export interface CreateCampaignRequest {
  name: string;
  subject: string;
  previewText?: string;
  fromName: string;
  fromEmail: string;
  bodyHtml: string;
  bodyText: string;
  segmentId?: string;
}

export interface UpdateCampaignRequest extends Partial<CreateCampaignRequest> {
  status?: 'draft';
}

export interface ScheduleCampaignRequest extends IdempotentRequest {
  scheduledAt: string;
}

export interface SendCampaignRequest extends IdempotentRequest {}

// Contacts
export interface CreateContactRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  attributes?: Record<string, unknown>;
}

export interface UpdateContactRequest extends Partial<CreateContactRequest> {}

export interface ImportContactsRequest {
  csv: string;
  mapping: Record<string, string>;
}

// Segments
export interface CreateSegmentRequest {
  name: string;
  filters: Array<{
    field: string;
    operator: string;
    value: unknown;
  }>;
}
