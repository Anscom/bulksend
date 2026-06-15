import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = {
  campaign: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
};

const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
};

const mockSend = vi.fn();
const mockGetProducer = vi.fn(() => ({ send: mockSend }));

vi.mock('../db/client.js', () => ({ prisma: mockPrisma }));
vi.mock('../redis/client.js', () => ({ redis: mockRedis }));
vi.mock('../kafka/producer.js', () => ({ getProducer: mockGetProducer }));
vi.mock('../lib/errors.js', () => ({
  Errors: {
    notFound: (msg: string) => Object.assign(new Error(msg), { status: 404 }),
    unprocessable: (msg: string) => Object.assign(new Error(msg), { status: 422 }),
  },
}));

const { sendCampaign, resumeCampaign } = await import('../services/campaigns.service.js');

const CAMPAIGN = { id: 'camp-1', workspaceId: 'ws-1', status: 'draft', name: 'Test' };

beforeEach(() => {
  vi.clearAllMocks();
  mockRedis.get.mockResolvedValue(null);
  mockRedis.set.mockResolvedValue('OK');
  mockSend.mockResolvedValue(undefined);
  mockPrisma.campaign.update.mockResolvedValue({ ...CAMPAIGN, status: 'sending' });
});

describe('sendCampaign', () => {
  it('returns early on idempotency key hit', async () => {
    mockRedis.get.mockResolvedValue('camp-1');
    mockPrisma.campaign.findFirst.mockResolvedValue(CAMPAIGN);

    const result = await sendCampaign('camp-1', 'ws-1', 'ik-abc');

    expect(mockRedis.get).toHaveBeenCalledWith('ik:send:ws-1:ik-abc');
    expect(mockSend).not.toHaveBeenCalled();
    expect(result).toMatchObject({ id: 'camp-1' });
  });

  it('publishes to Kafka and sets idempotency key on success', async () => {
    mockPrisma.campaign.findFirst.mockResolvedValue(CAMPAIGN);

    await sendCampaign('camp-1', 'ws-1', 'ik-abc');

    expect(mockSend).toHaveBeenCalledOnce();
    const call = mockSend.mock.calls[0]!;
    expect(call[0].topic).toBe('campaign.dispatch');
    expect(mockRedis.set).toHaveBeenCalledWith('ik:send:ws-1:ik-abc', 'camp-1', { ex: 86400 });
  });

  it('rolls back campaign status and does not set Redis key when Kafka fails', async () => {
    mockPrisma.campaign.findFirst.mockResolvedValue(CAMPAIGN);
    mockSend.mockRejectedValue(new Error('Kafka timeout'));

    await expect(sendCampaign('camp-1', 'ws-1', 'ik-abc')).rejects.toThrow('Kafka timeout');

    expect(mockPrisma.campaign.update).toHaveBeenLastCalledWith({
      where: { id: 'camp-1' },
      data: { status: 'draft' },
    });
    expect(mockRedis.set).not.toHaveBeenCalled();
  });

  it('throws 404 when campaign not found', async () => {
    mockPrisma.campaign.findFirst.mockResolvedValue(null);

    await expect(sendCampaign('camp-1', 'ws-1', 'ik-abc')).rejects.toMatchObject({ status: 404 });
  });

  it('throws 422 when campaign is in wrong state', async () => {
    mockPrisma.campaign.findFirst.mockResolvedValue({ ...CAMPAIGN, status: 'sent' });

    await expect(sendCampaign('camp-1', 'ws-1', 'ik-abc')).rejects.toMatchObject({ status: 422 });
  });
});

describe('resumeCampaign', () => {
  it('returns early on idempotency key hit', async () => {
    mockRedis.get.mockResolvedValue('camp-1');
    mockPrisma.campaign.findFirst.mockResolvedValue({ ...CAMPAIGN, status: 'paused' });

    await resumeCampaign('camp-1', 'ws-1', 'ik-xyz');

    expect(mockSend).not.toHaveBeenCalled();
  });

  it('uses separate key namespace from sendCampaign', async () => {
    mockPrisma.campaign.findFirst.mockResolvedValue({ ...CAMPAIGN, status: 'paused' });
    mockPrisma.campaign.update.mockResolvedValue({ ...CAMPAIGN, status: 'sending' });

    await resumeCampaign('camp-1', 'ws-1', 'ik-xyz');

    expect(mockRedis.get).toHaveBeenCalledWith('ik:resume:ws-1:ik-xyz');
    expect(mockRedis.set).toHaveBeenCalledWith('ik:resume:ws-1:ik-xyz', 'camp-1', { ex: 86400 });
  });

  it('rolls back to paused when Kafka fails', async () => {
    mockPrisma.campaign.findFirst.mockResolvedValue({ ...CAMPAIGN, status: 'paused' });
    mockPrisma.campaign.update.mockResolvedValue({ ...CAMPAIGN, status: 'sending' });
    mockSend.mockRejectedValue(new Error('broker unavailable'));

    await expect(resumeCampaign('camp-1', 'ws-1', 'ik-xyz')).rejects.toThrow();

    expect(mockPrisma.campaign.update).toHaveBeenLastCalledWith({
      where: { id: 'camp-1' },
      data: { status: 'paused' },
    });
  });
});
