import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { printPurchaseRequest, printBudgetAllocation } from '@/lib/print';

describe('print.ts', () => {
  let appendChildSpy: any;
  let removeChildSpy: any;
  let mockDoc: any;

  beforeEach(() => {
    vi.useFakeTimers();
    mockDoc = {
      open: vi.fn(),
      write: vi.fn(),
      close: vi.fn(),
    };

    const mockIframe = {
      style: {},
      contentWindow: {
        document: mockDoc,
        focus: vi.fn(),
        print: vi.fn(),
      },
    };

    vi.spyOn(document, 'createElement').mockReturnValue(mockIframe as any);
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockIframe as any);
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockIframe as any);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('printPurchaseRequest builds voucher HTML and triggers print in hidden iframe', () => {
    printPurchaseRequest({
      prNumber: 'PR-100',
      requestedBy: 'Test User',
      department: 'Finance',
      amount: 1500,
      status: 'Approved',
      description: 'Test Purpose',
      lineItems: [{ item_name: 'Paper', quantity: 10, unit_price: 150, total_price: 1500 }]
    });

    expect(appendChildSpy).toHaveBeenCalled();
    expect(mockDoc.write).toHaveBeenCalledWith(expect.stringContaining('Purchase Request Voucher'));
    expect(mockDoc.write).toHaveBeenCalledWith(expect.stringContaining('PR-100'));

    vi.advanceTimersByTime(600);
    vi.advanceTimersByTime(1100);
    expect(removeChildSpy).toHaveBeenCalled();
  });

  it('printBudgetAllocation builds budget summary HTML and triggers print', () => {
    printBudgetAllocation({
      fiscal_year: 2026,
      total_allocated: 100000,
      total_reserved: 10000,
      total_spent: 20000,
      total_available: 70000,
      department_summaries: [{ department: 'Engineering', code: 'ENG', allocated: 100000, reserved: 10000, available: 70000, percentage: 100 }]
    });

    expect(mockDoc.write).toHaveBeenCalledWith(expect.stringContaining('Budget Allocation Report'));
    expect(mockDoc.write).toHaveBeenCalledWith(expect.stringContaining('Fiscal Year 2026'));
  });

  it('does nothing if pr or summary is null', () => {
    printPurchaseRequest(null);
    printBudgetAllocation(null);
    expect(appendChildSpy).not.toHaveBeenCalled();
  });
});
