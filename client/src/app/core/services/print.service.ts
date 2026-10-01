import { Injectable } from '@angular/core';
import { InvoiceDetailDto } from '../models/invoice.model';

@Injectable({ providedIn: 'root' })
export class PrintService {

  /**
   * Print a thermal receipt (80mm) for a sale invoice.
   * Opens a hidden iframe, injects receipt HTML, and triggers print dialog.
   */
  printReceipt(invoice: InvoiceDetailDto, amountPaid: number, customerName = 'عميل نقدي'): void {
    const receiptHtml = this.buildReceiptHtml(invoice, amountPaid, customerName);
    this.printHtml(receiptHtml);
  }

  private buildReceiptHtml(invoice: InvoiceDetailDto, amountPaid: number, customerName: string): string {
    const change = Math.max(0, amountPaid - invoice.totalAmount);
    const dateStr = new Date(invoice.createdAt).toLocaleString('ar-EG', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });

    const itemsRows = invoice.items.map(item => `
      <tr>
        <td style="text-align:right;padding:2px 0">${item.productNameAr}</td>
        <td style="text-align:center;padding:2px 4px">${item.quantity}</td>
        <td style="text-align:left;padding:2px 0">${item.lineTotal.toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Cairo', 'Tahoma', sans-serif;
            font-size: 12px;
            width: 80mm;
            padding: 4mm;
            color: #000;
          }
          .center { text-align: center; }
          .divider {
            border-top: 1px dashed #000;
            margin: 6px 0;
          }
          .store-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 2px;
          }
          .store-sub {
            font-size: 10px;
            color: #555;
            margin-bottom: 6px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            margin: 1px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }
          th {
            border-bottom: 1px solid #000;
            padding: 3px 0;
            font-size: 10px;
          }
          .total-section {
            font-size: 12px;
            margin-top: 4px;
          }
          .total-section .row {
            display: flex;
            justify-content: space-between;
            padding: 1px 0;
          }
          .grand-total {
            font-size: 16px;
            font-weight: bold;
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
            padding: 4px 0;
            margin: 4px 0;
          }
          .footer {
            font-size: 10px;
            color: #555;
            margin-top: 8px;
          }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="store-name">RetailHub</div>
          <div class="store-sub">نظام نقاط البيع والمخزون</div>
        </div>

        <div class="divider"></div>

        <div class="info-row">
          <span>فاتورة رقم:</span>
          <span>${invoice.invoiceNumber}</span>
        </div>
        <div class="info-row">
          <span>التاريخ:</span>
          <span>${dateStr}</span>
        </div>
        <div class="info-row">
          <span>العميل:</span>
          <span>${customerName}</span>
        </div>

        <div class="divider"></div>

        <table>
          <thead>
            <tr>
              <th style="text-align:right">الصنف</th>
              <th style="text-align:center">الكمية</th>
              <th style="text-align:left">المبلغ</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div class="divider"></div>

        <div class="total-section">
          <div class="row">
            <span>المجموع:</span>
            <span>${invoice.totalAmount.toFixed(2)} ج.م</span>
          </div>
          <div class="row grand-total">
            <span>الإجمالي:</span>
            <span>${invoice.totalAmount.toFixed(2)} ج.م</span>
          </div>
          <div class="row">
            <span>المدفوع:</span>
            <span>${amountPaid.toFixed(2)} ج.م</span>
          </div>
          ${change > 0 ? `
          <div class="row" style="font-weight:bold;color:#059669">
            <span>الباقي:</span>
            <span>${change.toFixed(2)} ج.م</span>
          </div>
          ` : ''}
        </div>

        <div class="divider"></div>

        <div class="center footer">
          <p>شكراً لتسوقكم معنا ❤️</p>
          <p>www.retailhub.com</p>
        </div>
      </body>
      </html>
    `;
  }

  private printHtml(html: string): void {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    iframe.style.width = '80mm';
    iframe.style.height = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => document.body.removeChild(iframe), 1000);
        }, 250);
      };
    }
  }
}
