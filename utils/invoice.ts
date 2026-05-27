import { Order, User } from "@/context/AppContext";

export function buildInvoiceHtml(order: Order, user: User | null): string {
  const date = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const itemsHtml = order.items
    .map(
      (item) => `
    <div class="item">
      <div class="item-left">
        <div class="item-name">${item.product.name}</div>
        <div class="item-meta">${item.product.brand} &middot; EU ${item.size} &middot; Qty ${item.quantity}</div>
        ${item.product.eco_friendly ? '<span class="eco-badge">&#127807; Eco Certified</span>' : ""}
      </div>
      <div class="item-price">$${(item.product.price * item.quantity).toFixed(2)}</div>
    </div>`
    )
    .join("");

  const subtotal = order.total - order.shippingFee + order.discount;
  const hasEco = order.items.some((i) => i.product.eco_friendly);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Invoice ${order.invoiceId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif; background: #0A0A0F; color: #ffffff; padding: 36px 28px; min-height: 100vh; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; }
    .brand { font-size: 26px; font-weight: 800; color: #00B4FF; letter-spacing: -0.5px; }
    .brand-sub { font-size: 10px; color: rgba(255,255,255,0.35); letter-spacing: 2.5px; margin-top: 4px; text-transform: uppercase; }
    .invoice-meta { text-align: right; }
    .invoice-tag { font-size: 10px; color: rgba(255,255,255,0.35); letter-spacing: 2px; text-transform: uppercase; }
    .invoice-id { font-size: 18px; font-weight: 700; color: #00B4FF; margin-top: 4px; }
    .invoice-date { font-size: 12px; color: rgba(255,255,255,0.45); margin-top: 3px; }
    .divider { height: 1px; background: rgba(255,255,255,0.08); margin: 24px 0; }
    .section-label { font-size: 10px; color: rgba(255,255,255,0.35); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; }
    .customer-name { font-size: 20px; font-weight: 700; }
    .customer-email { font-size: 13px; color: rgba(255,255,255,0.45); margin-top: 5px; }
    .item { display: flex; justify-content: space-between; align-items: flex-start; padding: 14px 16px; background: rgba(255,255,255,0.04); border-radius: 12px; border: 1px solid rgba(255,255,255,0.07); margin-bottom: 10px; }
    .item-left { flex: 1; }
    .item-name { font-size: 15px; font-weight: 600; }
    .item-meta { font-size: 12px; color: rgba(255,255,255,0.45); margin-top: 4px; }
    .eco-badge { display: inline-block; background: rgba(0,200,120,0.15); color: #00C878; font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 6px; border: 1px solid rgba(0,200,120,0.3); margin-top: 7px; }
    .item-price { font-size: 16px; font-weight: 700; color: #00B4FF; white-space: nowrap; margin-left: 16px; }
    .totals { display: flex; flex-direction: column; gap: 10px; }
    .total-row { display: flex; justify-content: space-between; align-items: center; }
    .total-label { font-size: 13px; color: rgba(255,255,255,0.5); }
    .total-value { font-size: 14px; font-weight: 500; }
    .discount-value { color: #00C878; }
    .grand-label { font-size: 16px; font-weight: 700; color: #fff; }
    .grand-value { font-size: 28px; font-weight: 800; color: #00B4FF; }
    .payment-row { display: flex; align-items: center; gap: 10px; margin-top: 4px; }
    .payment-chip { display: inline-flex; align-items: center; padding: 10px 18px; background: rgba(0,180,255,0.1); border: 1px solid rgba(0,180,255,0.25); border-radius: 12px; font-size: 14px; font-weight: 600; color: #00B4FF; }
    .sdg-card { background: rgba(0,200,120,0.08); border: 1px solid rgba(0,200,120,0.2); border-radius: 14px; padding: 18px; display: flex; gap: 14px; align-items: flex-start; margin-top: 28px; }
    .sdg-icon { font-size: 28px; line-height: 1; }
    .sdg-title { font-size: 14px; font-weight: 700; color: #00C878; }
    .sdg-desc { font-size: 12px; color: rgba(255,255,255,0.45); margin-top: 5px; line-height: 1.6; }
    .footer { text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.06); }
    .verified { display: flex; justify-content: center; align-items: center; gap: 8px; }
    .verified-icon { color: #00C878; font-size: 16px; font-weight: 700; }
    .verified-text { font-size: 13px; color: #00C878; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
    .footer-note { font-size: 11px; color: rgba(255,255,255,0.25); margin-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">&#128705; FOOTWEAR</div>
      <div class="brand-sub">Smart Shoe Marketplace</div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-tag">Digital Invoice</div>
      <div class="invoice-id">${order.invoiceId}</div>
      <div class="invoice-date">${date}</div>
    </div>
  </div>

  <div class="section-label">Customer</div>
  <div class="customer-name">${user?.name ?? "Customer"}</div>
  <div class="customer-email">${user?.email ?? ""}</div>

  ${order.address ? `<div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:6px;">&#128205; ${order.address}</div>` : ""}

  <div class="divider"></div>

  <div class="section-label">Order Items</div>
  ${itemsHtml}

  <div class="divider"></div>

  <div class="totals">
    <div class="total-row">
      <span class="total-label">Subtotal</span>
      <span class="total-value">$${subtotal.toFixed(2)}</span>
    </div>
    <div class="total-row">
      <span class="total-label">Shipping</span>
      <span class="total-value">$${order.shippingFee.toFixed(2)}</span>
    </div>
    ${order.discount > 0 ? `<div class="total-row"><span class="total-label">Discount Applied</span><span class="total-value discount-value">-$${order.discount.toFixed(2)}</span></div>` : ""}
    <div class="total-row" style="margin-top:6px;">
      <span class="grand-label">TOTAL</span>
      <span class="grand-value">$${order.total.toFixed(2)}</span>
    </div>
  </div>

  <div class="divider"></div>

  <div class="section-label">Payment Method</div>
  <div class="payment-row">
    <div class="payment-chip">&#128179; ${order.paymentMethod}</div>
    <div style="font-size:13px;color:#00C878;font-weight:700;">&#10003; PAID</div>
  </div>

  ${
    hasEco
      ? `<div class="sdg-card">
    <div class="sdg-icon">&#127807;</div>
    <div>
      <div class="sdg-title">SDG 12 — Responsible Consumption &amp; Production</div>
      <div class="sdg-desc">Your order includes eco-certified products. 5% of proceeds go to sustainability and environmental programs.</div>
    </div>
  </div>`
      : ""
  }

  <div class="footer">
    <div class="verified">
      <span class="verified-icon">&#10003;</span>
      <span class="verified-text">Verified Digital Receipt</span>
    </div>
    <div class="footer-note">footwear.app &middot; Smart Shoe Marketplace &middot; ${order.invoiceId}</div>
    <div class="footer-note">Thank you for shopping sustainably!</div>
  </div>
</body>
</html>`;
}
