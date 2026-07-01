import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import PRFormModal from '@/features/purchase-requests/components/PRFormModal';
import * as budgetService from '@/services/budget.service';

vi.mock('@/services/budget.service', () => ({
  getCategories: vi.fn(),
}));

describe('PRFormModal component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (budgetService.getCategories as any).mockResolvedValue([
      { id: 1, name: 'IT Supplies', code: 'IT' },
    ]);
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <PRFormModal
        isOpen={false}
        isEditMode={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders title depending on isEditMode', async () => {
    const { rerender } = render(
      <PRFormModal
        isOpen={true}
        isEditMode={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );
    expect(await screen.findByText('Create New Purchase Request')).toBeDefined();

    rerender(
      <PRFormModal
        isOpen={true}
        isEditMode={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );
    expect(await screen.findByText('Edit Purchase Request')).toBeDefined();
  });

  it('displays validation errors when submitting empty required fields', async () => {
    const onSubmitMock = vi.fn();
    render(
      <PRFormModal
        isOpen={true}
        isEditMode={false}
        onClose={vi.fn()}
        onSubmit={onSubmitMock}
      />
    );
    await waitFor(() => expect(budgetService.getCategories).toHaveBeenCalled());

    const submitBtn = screen.getByRole('button', { name: 'Create PR' });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Amount must be greater than 0')).toBeDefined();
    expect(screen.getByText('Description is required')).toBeDefined();
    expect(screen.getByText('Due date is required')).toBeDefined();
    expect(screen.getByText('Requested by is required')).toBeDefined();
    expect(onSubmitMock).not.toHaveBeenCalled();
  });

  it('calls onSubmit with form data when all required fields are filled', async () => {
    const onSubmitMock = vi.fn();
    render(
      <PRFormModal
        isOpen={true}
        isEditMode={false}
        onClose={vi.fn()}
        onSubmit={onSubmitMock}
      />
    );
    await waitFor(() => expect(budgetService.getCategories).toHaveBeenCalled());

    // Fill amount
    const amountInput = screen.getByPlaceholderText('0');
    fireEvent.change(amountInput, { target: { name: 'amount', value: '1500' } });

    // Fill description
    const descInput = screen.getByPlaceholderText('Enter purchase request description');
    fireEvent.change(descInput, { target: { name: 'description', value: 'Office Chairs' } });

    // Fill requestedBy
    const reqByInput = screen.getByPlaceholderText('Enter name');
    fireEvent.change(reqByInput, { target: { name: 'requestedBy', value: 'Alice Smith' } });

    // Fill dueDate (input[type="date"])
    const dateInputs = containerOrInputs();
    fireEvent.change(dateInputs, { target: { name: 'dueDate', value: '2026-07-15' } });

    const submitBtn = screen.getByRole('button', { name: 'Create PR' });
    fireEvent.click(submitBtn);

    expect(onSubmitMock).toHaveBeenCalledTimes(1);
    expect(onSubmitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 1500,
        description: 'Office Chairs',
        requestedBy: 'Alice Smith',
        dueDate: '2026-07-15',
      })
    );
  });
});

function containerOrInputs() {
  const inputs = document.querySelectorAll('input[type="date"]');
  return inputs[0] as HTMLInputElement;
}
