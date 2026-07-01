import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ViewPRModal from '@/features/purchase-requests/components/ViewPRModal';
import * as printLib from '@/lib/print';
import * as prService from '@/services/purchase-requests.service';

vi.mock('@/lib/print', () => ({
  printPurchaseRequest: vi.fn(),
}));

vi.mock('@/services/purchase-requests.service', () => ({
  downloadPRAttachment: vi.fn(),
  uploadPRAttachments: vi.fn(),
  deletePRAttachment: vi.fn(),
}));

describe('ViewPRModal component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const samplePR: any = {
    id: '10',
    prNumber: 'PR-2026-999',
    department: 'Engineering',
    category: 'Hardware',
    amount: 12500,
    status: 'Submitted',
    requestedBy: 'Bob Smith',
    dateRequested: '2026-07-01',
    dueDate: '2026-07-15',
    description: 'High end servers',
    lineItems: [
      { id: 1, item_name: 'Server Unit', quantity: 1, unit_price: 12500, total_price: 12500 },
    ],
    statusHistory: [
      { id: 1, to_status: 'Submitted', created_at: '2026-07-01T10:00:00Z', remarks: 'Submitted for review' },
    ],
    attachments: [
      { id: 1, file_name: 'quote.pdf', file_size: 2048 },
    ],
  };

  it('does not render if isOpen is false or pr is null', () => {
    const { container: c1 } = render(
      <ViewPRModal isOpen={false} pr={samplePR} onClose={vi.fn()} />
    );
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(
      <ViewPRModal isOpen={true} pr={null} onClose={vi.fn()} />
    );
    expect(c2.firstChild).toBeNull();
  });

  it('renders all PR details, line items, attachments, and status audit trail', () => {
    render(<ViewPRModal isOpen={true} pr={samplePR} onClose={vi.fn()} />);

    expect(screen.getByText('PR-2026-999')).toBeDefined();
    expect(screen.getByText('Engineering')).toBeDefined();
    expect(screen.getByText('Hardware')).toBeDefined();
    expect(screen.getByText('High end servers')).toBeDefined();
    expect(screen.getByText('Server Unit')).toBeDefined();
    expect(screen.getByText('quote.pdf')).toBeDefined();
    expect(screen.getAllByText('"Submitted for review"').length).toBeGreaterThan(0);
  });


  it('triggers print function when Print / Sign Voucher button is clicked', () => {
    render(<ViewPRModal isOpen={true} pr={samplePR} onClose={vi.fn()} />);

    const printBtn = screen.getByRole('button', { name: /Print \/ Sign Voucher/i });
    fireEvent.click(printBtn);

    expect(printLib.printPurchaseRequest).toHaveBeenCalledTimes(1);
    expect(printLib.printPurchaseRequest).toHaveBeenCalledWith(samplePR);
  });
});
