export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'BulkSend API',
    version: '1.0.0',
    description: 'Bulk email marketing API — campaigns, contacts, segments, analytics.',
  },
  servers: [
    { url: '/api/v1', description: 'Current version' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'NOT_FOUND' },
              message: { type: 'string', example: 'Campaign not found' },
            },
          },
        },
      },
      Campaign: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          workspaceId: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'June Newsletter' },
          subject: { type: 'string', example: 'What\'s new this month' },
          previewText: { type: 'string', nullable: true },
          fromName: { type: 'string', example: 'Acme Team' },
          fromEmail: { type: 'string', format: 'email', example: 'hello@acme.com' },
          bodyHtml: { type: 'string' },
          bodyText: { type: 'string' },
          segmentId: { type: 'string', format: 'uuid', nullable: true },
          status: { type: 'string', enum: ['draft', 'scheduled', 'sending', 'sent', 'paused', 'failed'] },
          scheduledAt: { type: 'string', format: 'date-time', nullable: true },
          sentAt: { type: 'string', format: 'date-time', nullable: true },
          totalRecipients: { type: 'integer', example: 1240 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Contact: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          workspaceId: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string', nullable: true },
          lastName: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['subscribed', 'unsubscribed', 'bounced'] },
          attributes: { type: 'object', additionalProperties: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Segment: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          workspaceId: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Active UK subscribers' },
          filters: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'status' },
                operator: { type: 'string', enum: ['eq', 'neq', 'contains', 'gt', 'lt', 'in', 'exists'] },
                value: { },
              },
            },
          },
          contactCount: { type: 'integer', example: 832 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Workspace: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Acme Corp' },
          slug: { type: 'string', example: 'acme-corp' },
          plan: { type: 'string', enum: ['free', 'pro', 'enterprise'] },
          sendRatePerHour: { type: 'integer', example: 500 },
          senderEmail: { type: 'string', format: 'email', nullable: true },
          senderName: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      PaginatedCampaigns: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              items: { type: 'array', items: { '$ref': '#/components/schemas/Campaign' } },
              total: { type: 'integer' },
            },
          },
        },
      },
      PaginatedContacts: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              items: { type: 'array', items: { '$ref': '#/components/schemas/Contact' } },
              total: { type: 'integer' },
            },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Create account',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name', 'workspaceName'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  name: { type: 'string' },
                  workspaceName: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Account created — returns access + refresh tokens' },
          409: { description: 'Email already registered', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Returns accessToken, refreshToken, workspaces[]' },
          401: { description: 'Invalid credentials' },
          429: { description: 'Too many login attempts' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Rotate refresh token',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } },
            },
          },
        },
        responses: {
          200: { description: 'New access + refresh token pair' },
          401: { description: 'Invalid or reused refresh token (token rotation invalidates family)' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout — blocklists the refresh token',
        responses: { 204: { description: 'Logged out' } },
      },
    },
    '/campaigns': {
      get: {
        tags: ['Campaigns'],
        summary: 'List campaigns',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Paginated campaigns', content: { 'application/json': { schema: { '$ref': '#/components/schemas/PaginatedCampaigns' } } } } },
      },
      post: {
        tags: ['Campaigns'],
        summary: 'Create draft campaign',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'subject', 'fromName', 'fromEmail', 'bodyHtml', 'bodyText'],
                properties: {
                  name: { type: 'string' },
                  subject: { type: 'string' },
                  fromName: { type: 'string' },
                  fromEmail: { type: 'string', format: 'email' },
                  bodyHtml: { type: 'string' },
                  bodyText: { type: 'string' },
                  previewText: { type: 'string' },
                  segmentId: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Draft campaign created' } },
      },
    },
    '/campaigns/{id}': {
      get: {
        tags: ['Campaigns'],
        summary: 'Get campaign',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Campaign' }, 404: { description: 'Not found' } },
      },
      patch: {
        tags: ['Campaigns'],
        summary: 'Update draft campaign',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Updated campaign' }, 422: { description: 'Campaign is not a draft' } },
      },
      delete: {
        tags: ['Campaigns'],
        summary: 'Delete campaign (drafts and paused only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 204: { description: 'Deleted' }, 422: { description: 'Cannot delete a sent/sending campaign' } },
      },
    },
    '/campaigns/{id}/send': {
      post: {
        tags: ['Campaigns'],
        summary: 'Send campaign immediately',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Campaign status set to sending; dispatch queued in Kafka' } },
      },
    },
    '/campaigns/{id}/schedule': {
      post: {
        tags: ['Campaigns'],
        summary: 'Schedule campaign for future delivery',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['scheduledAt'], properties: { scheduledAt: { type: 'string', format: 'date-time' } } },
            },
          },
        },
        responses: { 200: { description: 'Campaign scheduled' } },
      },
    },
    '/campaigns/{id}/pause': {
      post: {
        tags: ['Campaigns'],
        summary: 'Pause a sending campaign',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Campaign paused' } },
      },
    },
    '/campaigns/{id}/resume': {
      post: {
        tags: ['Campaigns'],
        summary: 'Resume a paused campaign',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Campaign resumed' } },
      },
    },
    '/campaigns/{id}/stats': {
      get: {
        tags: ['Campaigns'],
        summary: 'Get campaign delivery stats',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: {
            description: 'Stats',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    sent: { type: 'integer' }, delivered: { type: 'integer' },
                    opened: { type: 'integer' }, clicked: { type: 'integer' },
                    bounced: { type: 'integer' }, unsubscribed: { type: 'integer' },
                    openRate: { type: 'number' }, clickRate: { type: 'number' }, bounceRate: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/contacts': {
      get: {
        tags: ['Contacts'],
        summary: 'List contacts',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 50 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['subscribed', 'unsubscribed', 'bounced'] } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Paginated contacts', content: { 'application/json': { schema: { '$ref': '#/components/schemas/PaginatedContacts' } } } } },
      },
      post: {
        tags: ['Contacts'],
        summary: 'Create contact',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  attributes: { type: 'object', additionalProperties: true },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Contact created' }, 409: { description: 'Email already exists' } },
      },
    },
    '/contacts/{id}': {
      get: {
        tags: ['Contacts'],
        summary: 'Get contact',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Contact' }, 404: { description: 'Not found' } },
      },
      patch: {
        tags: ['Contacts'],
        summary: 'Update contact',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Updated contact' } },
      },
      delete: {
        tags: ['Contacts'],
        summary: 'Soft-delete contact',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 204: { description: 'Deleted' } },
      },
    },
    '/contacts/import': {
      post: {
        tags: ['Contacts'],
        summary: 'Import contacts from CSV',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file', 'mapping'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  mapping: { type: 'string', description: 'JSON map of CSV column → contact field' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Import result',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { imported: { type: 'integer' }, skipped: { type: 'integer' } } },
              },
            },
          },
        },
      },
    },
    '/segments': {
      get: {
        tags: ['Segments'],
        summary: 'List segments',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 50 } },
        ],
        responses: { 200: { description: 'Paginated segments' } },
      },
      post: {
        tags: ['Segments'],
        summary: 'Create segment',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'filters'],
                properties: {
                  name: { type: 'string' },
                  filters: { type: 'array', items: { type: 'object' } },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Segment created' } },
      },
    },
    '/segments/{id}': {
      get: {
        tags: ['Segments'],
        summary: 'Get segment',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Segment' }, 404: { description: 'Not found' } },
      },
      patch: {
        tags: ['Segments'],
        summary: 'Update segment',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Updated segment' } },
      },
      delete: {
        tags: ['Segments'],
        summary: 'Delete segment',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 204: { description: 'Deleted' }, 409: { description: 'Segment is in use by a campaign' } },
      },
    },
    '/segments/{id}/contacts': {
      get: {
        tags: ['Segments'],
        summary: 'List contacts matched by segment filters',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 50 } },
        ],
        responses: { 200: { description: 'Paginated matching contacts' } },
      },
    },
    '/workspaces/me': {
      get: {
        tags: ['Workspaces'],
        summary: 'Get current workspace',
        responses: { 200: { description: 'Workspace', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Workspace' } } } } },
      },
      patch: {
        tags: ['Workspaces'],
        summary: 'Update workspace settings',
        responses: { 200: { description: 'Updated workspace' } },
      },
    },
    '/workspaces/members': {
      get: {
        tags: ['Workspaces'],
        summary: 'List workspace members',
        responses: { 200: { description: 'Member list' } },
      },
      post: {
        tags: ['Workspaces'],
        summary: 'Invite/add member',
        responses: { 201: { description: 'Member added' }, 409: { description: 'Already a member' } },
      },
    },
    '/workspaces/members/{id}': {
      delete: {
        tags: ['Workspaces'],
        summary: 'Remove member',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 204: { description: 'Removed' } },
      },
    },
    '/analytics/overview': {
      get: {
        tags: ['Analytics'],
        summary: 'Workspace-level KPIs (sent, delivery rate, open rate, active contacts)',
        responses: { 200: { description: 'Overview metrics' } },
      },
    },
    '/analytics/volume': {
      get: {
        tags: ['Analytics'],
        summary: 'Daily send / open volume for the last 30 days',
        responses: { 200: { description: 'Time-series data' } },
      },
    },
    '/analytics/campaigns': {
      get: {
        tags: ['Analytics'],
        summary: 'Per-campaign performance table',
        responses: { 200: { description: 'Campaign performance rows' } },
      },
    },
  },
} as const;
