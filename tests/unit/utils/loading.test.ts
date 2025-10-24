import { withLoading } from '../../../src/utils/loading';

// Mock ora
jest.mock('ora', () => {
  return jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn(),
    fail: jest.fn(),
  }));
});

describe('withLoading', () => {
  it('returns result on success', async () => {
    const result = await withLoading('test message', async () => 42);
    expect(result).toBe(42);
  });

  it('propagates errors', async () => {
    await expect(
      withLoading('test message', async () => {
        throw new Error('test error');
      })
    ).rejects.toThrow('test error');
  });
});
