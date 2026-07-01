import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  mapBackendPRToFrontend,
  getPurchaseRequests,
  getPurchaseRequestDetails,
  createPurchaseRequest,
  updatePurchaseRequest,
  deletePurchaseRequest,
  bulkDeletePurchaseRequests,
} from "@/services/purchase-requests.service";

describe("purchase-requests.service", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("mapBackendPRToFrontend correctly maps backend fields including new schema names", () => {
    const rawPR = {
      id: 10,
      pr_number: "PR-2026-001",
      purpose: "New Office Equipment",
      total_estimated_cost: "2500.50",
      status: "Submitted",
      created_at: "2026-06-15T10:00:00.000000Z",
      requester: {
        first_name: "Jane",
        last_name: "Doe",
        department: { name: "Engineering" },
      },
      category: { id: 2, name: "IT Hardware" },
      items: [
        {
          id: 1,
          item_name: "Monitor",
          quantity: 2,
          unit_price: 1250.25,
          total_price: 2500.5,
        },
      ],
      attachments: [],
    };

    const mapped = mapBackendPRToFrontend(rawPR);
    expect(mapped.id).toBe("10");
    expect(mapped.prNumber).toBe("PR-2026-001");
    expect(mapped.description).toBe("New Office Equipment");
    expect(mapped.amount).toBe(2500.5);
    expect(mapped.requestedBy).toBe("Jane Doe");
    expect(mapped.department).toBe("Engineering");
    expect(mapped.category).toBe("IT Hardware");
    expect(mapped.lineItems).toHaveLength(1);
    expect(mapped.lineItems![0].item_name).toBe("Monitor");
  });

  it("mapBackendPRToFrontend maps raw category_name string to category", () => {
    const rawPR = {
      id: 11,
      pr_number: "PR-2026-002",
      purpose: "Office paper",
      total_estimated_cost: "150",
      status: "Draft",
      created_at: "2026-06-16T10:00:00.000000Z",
      requester: {
        first_name: "John",
        last_name: "Smith",
        department: { name: "Operations" },
      },
      category_name: "Office Supplies",
      items: [],
      attachments: [],
    };

    const mapped = mapBackendPRToFrontend(rawPR);
    expect(mapped.category).toBe("Office Supplies");
    expect(mapped.categoryId).toBeUndefined();
  });

  it("mapBackendPRToFrontend maps nested category object with category_name to category", () => {
    const rawPR = {
      id: 12,
      pr_number: "PR-2026-003",
      purpose: "Cleaning supplies",
      total_estimated_cost: "300",
      status: "Draft",
      created_at: "2026-06-17T10:00:00.000000Z",
      requester: {
        first_name: "Alex",
        last_name: "Jones",
        department: { name: "Facilities" },
      },
      category: { category_id: 4, category_name: "Maintenance" },
      items: [],
      attachments: [],
    };

    const mapped = mapBackendPRToFrontend(rawPR);
    expect(mapped.category).toBe("Maintenance");
    expect(mapped.categoryId).toBe(4);
  });

  it("getPurchaseRequests fetches and maps list of PRs", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        purchase_requests: [
          {
            id: 1,
            pr_number: "PR-1",
            total_estimated_cost: "100",
            purpose: "Test",
          },
        ],
      }),
    });

    const prs = await getPurchaseRequests("Test", "Eng", "Submitted");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("search=Test"),
      expect.any(Object),
    );
    expect(prs).toHaveLength(1);
    expect(prs[0].prNumber).toBe("PR-1");
  });

  it("createPurchaseRequest sends POST request and formats default line item if empty", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        purchase_request: {
          id: 2,
          pr_number: "PR-2",
          total_estimated_cost: "500",
          purpose: "Office supplies",
        },
      }),
    });

    const created = await createPurchaseRequest({
      description: "Office supplies",
      amount: 500,
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/purchase-requests",
      {
        method: "POST",
        headers: expect.any(Object),
        body: expect.stringContaining("Office supplies"),
      },
    );
    expect(created.prNumber).toBe("PR-2");
  });

  it("updatePurchaseRequest and deletePurchaseRequest perform API calls correctly", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        purchase_request: { id: 2, pr_number: "PR-2", purpose: "Updated" },
      }),
    });

    const updated = await updatePurchaseRequest("2", {
      description: "Updated",
      amount: 500,
    });
    expect(updated.description).toBe("Updated");

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Deleted" }),
    });
    await deletePurchaseRequest("2");
    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/purchase-requests/2",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("bulkDeletePurchaseRequests posts IDs array", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Bulk deleted" }),
    });

    await bulkDeletePurchaseRequests(["1", "2", "3"]);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/purchase-requests/bulk-delete",
      {
        method: "POST",
        headers: expect.any(Object),
        body: JSON.stringify({ ids: [1, 2, 3] }),
      },
    );
  });
});
