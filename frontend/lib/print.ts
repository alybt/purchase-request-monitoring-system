/**
 * Utility functions for printing purchase request vouchers and budget allocation reports.
 */

export function printPurchaseRequest(pr: any): void {
  if (!pr) return;

  const prNumber = pr.prNumber || pr.pr_number || "N/A";
  const dateRequested = pr.dateRequested || (pr.created_at ? new Date(pr.created_at).toLocaleDateString() : "N/A");
  const dueDate = pr.dueDate || (pr.due_date ? new Date(pr.due_date).toLocaleDateString() : "N/A");
  const requestedBy = pr.requestedBy || (pr.user ? `${pr.user.first_name} ${pr.user.last_name}` : "N/A");
  const department = pr.department || (pr.user?.department?.name || "N/A");
  const amount = pr.amount !== undefined ? pr.amount : (pr.total_estimated_cost || 0);
  const status = pr.status || "N/A";
  const description = pr.description || pr.purpose_of_requests || "";
  const lineItems = pr.lineItems || pr.line_items || [];

  const html = `
    <html>
      <head>
        <title>Purchase Request ${prNumber}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #334155; margin: 40px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #0f172a; padding-bottom: 15px; }
          .header h1 { margin: 0; font-size: 26px; text-transform: uppercase; color: #0f172a; font-weight: 800; letter-spacing: 0.5px; }
          .header p { margin: 6px 0 0 0; font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 600; }
          .meta-table { width: 100%; margin-bottom: 35px; border-collapse: collapse; }
          .meta-table td { padding: 10px 8px; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
          .meta-table td.label { font-weight: 700; width: 18%; color: #475569; }
          .meta-table td.val { width: 32%; color: #0f172a; }
          .meta-table td.val-highlight { font-weight: 700; color: #2563eb; }
          .section-title { font-size: 15px; font-weight: 700; margin: 30px 0 12px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; text-transform: uppercase; color: #1e293b; letter-spacing: 0.5px; }
          .description-box { border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; background-color: #f8fafc; margin-bottom: 30px; font-size: 14px; color: #334155; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          .items-table th, .items-table td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; font-size: 13px; }
          .items-table th { background-color: #f1f5f9; font-weight: 700; color: #334155; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
          .items-table td.num { text-align: right; }
          .total-row { font-weight: 700; background-color: #f8fafc; }
          .total-row td { border-top: 2px solid #94a3b8; font-size: 14px; }
          .signatures { display: flex; justify-content: space-between; margin-top: 70px; page-break-inside: avoid; }
          .sig-col { width: 45%; text-align: center; }
          .sig-line { border-top: 1.5px solid #0f172a; margin-top: 60px; padding-top: 8px; font-size: 13px; font-weight: 700; color: #0f172a; }
          .sig-sub { font-size: 11px; color: #64748b; margin-top: 3px; font-weight: 500; }
          @media print {
            body { margin: 20px; }
            .header { margin-bottom: 30px; }
            .signatures { margin-top: 50px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Purchase Request Voucher</h1>
          <p>Purchase Request Monitoring & Tracking System</p>
        </div>
        <table class="meta-table">
          <tr>
            <td class="label">PR Number:</td>
            <td class="val val-highlight">${prNumber}</td>
            <td class="label">Date Requested:</td>
            <td class="val">${dateRequested}</td>
          </tr>
          <tr>
            <td class="label">Department:</td>
            <td class="val">${department}</td>
            <td class="label">Due Date:</td>
            <td class="val">${dueDate}</td>
          </tr>
          <tr>
            <td class="label">Requested By:</td>
            <td class="val">${requestedBy}</td>
            <td class="label">PR Status:</td>
            <td class="val" style="font-weight: 700; text-transform: uppercase;">${status}</td>
          </tr>
        </table>

        ${description ? `
        <div class="section-title">Purpose of Request</div>
        <div class="description-box">${description}</div>
        ` : ""}

        <div class="section-title">Requested Line Items</div>
        <table class="items-table">
          <thead>
            <tr>
              <th>Item Name & Description</th>
              <th style="width: 10%; text-align: center;">Qty</th>
              <th style="width: 20%; text-align: right;">Unit Price</th>
              <th style="width: 25%; text-align: right;">Total Price</th>
            </tr>
          </thead>
          <tbody>
            ${lineItems.length > 0 ? lineItems.map((item: any) => `
              <tr>
                <td>
                  <div style="font-weight: 600; color: #0f172a;">${item.item_name || "N/A"}</div>
                  ${item.description ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">${item.description}</div>` : ""}
                  ${item.vendor ? `<div style="font-size: 11px; color: #0284c7; margin-top: 2px; font-weight: 500;">Vendor: ${item.vendor}</div>` : ""}
                </td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">₱${parseFloat(item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="text-align: right; font-weight: 600; color: #0f172a;">₱${parseFloat(item.total_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            `).join("") : `
              <tr>
                <td colspan="4" style="text-align: center; color: #64748b;">No line items specified.</td>
              </tr>
            `}
            <tr class="total-row">
              <td colspan="3" style="text-align: right; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px;">Estimated Total Cost:</td>
              <td style="text-align: right; font-size: 15px; color: #0f172a;">₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        <div class="signatures">
          <div class="sig-col">
            <div class="sig-line">${requestedBy}</div>
            <div class="sig-sub">Requested By (Signature over Printed Name / Date)</div>
          </div>
          <div class="sig-col">
            <div class="sig-line">Department Head / Approver</div>
            <div class="sig-sub">Approved By (Signature over Printed Name / Date)</div>
          </div>
        </div>
      </body>
    </html>
  `;

  triggerPrint(html);
}

export function printBudgetAllocation(summary: any): void {
  if (!summary) return;

  const fiscalYear = summary.fiscal_year || new Date().getFullYear();
  const totalAllocated = summary.total_allocated || 0;
  const totalReserved = summary.total_reserved || 0;
  const totalSpent = summary.total_spent || 0;
  const totalAvailable = summary.total_available || (totalAllocated - totalReserved - totalSpent);
  const departmentSummaries = summary.department_summaries || [];

  const html = `
    <html>
      <head>
        <title>Budget Allocation Report FY ${fiscalYear}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #334155; margin: 40px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #0f172a; padding-bottom: 15px; }
          .header h1 { margin: 0; font-size: 26px; text-transform: uppercase; color: #0f172a; font-weight: 800; letter-spacing: 0.5px; }
          .header p { margin: 6px 0 0 0; font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 600; }
          .summary-grid { display: flex; justify-content: space-between; margin-bottom: 35px; gap: 20px; }
          .summary-card { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; background-color: #f8fafc; text-align: center; }
          .summary-card h3 { margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px; }
          .summary-card p { margin: 0; font-size: 20px; font-weight: 800; color: #0f172a; }
          .summary-card.available p { color: #059669; }
          .summary-card.reserved p { color: #d97706; }
          .report-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          .report-table th, .report-table td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; font-size: 13px; }
          .report-table th { background-color: #f1f5f9; font-weight: 700; color: #334155; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
          .report-table td.num { text-align: right; }
          .total-row { font-weight: 700; background-color: #f8fafc; }
          .total-row td { border-top: 2px solid #94a3b8; font-size: 14px; }
          .signatures { display: flex; justify-content: space-between; margin-top: 70px; page-break-inside: avoid; }
          .sig-col { width: 45%; text-align: center; }
          .sig-line { border-top: 1.5px solid #0f172a; margin-top: 60px; padding-top: 8px; font-size: 13px; font-weight: 700; color: #0f172a; }
          .sig-sub { font-size: 11px; color: #64748b; margin-top: 3px; font-weight: 500; }
          @media print {
            body { margin: 20px; }
            .header { margin-bottom: 30px; }
            .signatures { margin-top: 50px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Budget Allocation Report</h1>
          <p>Fiscal Year ${fiscalYear} · Purchase Request Monitoring System</p>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <h3>Total Allocated</h3>
            <p>₱${totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div class="summary-card reserved">
            <h3>Total Reserved</h3>
            <p>₱${totalReserved.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div class="summary-card available">
            <h3>Total Available</h3>
            <p>₱${totalAvailable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        <table class="report-table">
          <thead>
            <tr>
              <th>Department</th>
              <th style="text-align: right; width: 22%;">Allocated</th>
              <th style="text-align: right; width: 22%;">Reserved</th>
              <th style="text-align: right; width: 22%;">Available</th>
              <th style="text-align: center; width: 14%;">Share (%)</th>
            </tr>
          </thead>
          <tbody>
            ${departmentSummaries.length > 0 ? departmentSummaries.map((dept: any) => `
              <tr>
                <td style="font-weight: 600; color: #0f172a;">${dept.department || "Unknown"} <span style="font-weight: normal; color: #64748b; font-size: 11px; margin-left: 4px;">${dept.code || ""}</span></td>
                <td style="text-align: right;">₱${parseFloat(dept.allocated).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="text-align: right; color: #d97706;">₱${parseFloat(dept.reserved).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="text-align: right; color: #059669; font-weight: 600;">₱${parseFloat(dept.available).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="text-align: center; font-weight: 600; color: #0f172a;">${dept.percentage}%</td>
              </tr>
            `).join("") : `
              <tr>
                <td colspan="5" style="text-align: center; color: #64748b;">No department budgets set.</td>
              </tr>
            `}
            <tr class="total-row">
              <td>Total Summary</td>
              <td style="text-align: right;">₱${totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td style="text-align: right; color: #d97706;">₱${totalReserved.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td style="text-align: right; color: #059669;">₱${totalAvailable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td style="text-align: center;">100%</td>
            </tr>
          </tbody>
        </table>

        <div class="signatures">
          <div class="sig-col">
            <div class="sig-line">Prepared By: Finance Officer</div>
            <div class="sig-sub">(Signature over Printed Name / Date)</div>
          </div>
          <div class="sig-col">
            <div class="sig-line">Approved By: Executive Approver</div>
            <div class="sig-sub">(Signature over Printed Name / Date)</div>
          </div>
        </div>
      </body>
    </html>
  `;

  triggerPrint(html);
}

function triggerPrint(htmlContent: string): void {
  if (typeof window === "undefined") return;

  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.width = "0px";
  iframe.style.height = "0px";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (doc) {
    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Give images or fonts a split second to load before printing
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      // Remove the iframe after a short delay so print doesn't get cancelled
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  }
}
