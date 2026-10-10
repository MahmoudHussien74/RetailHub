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
        <td style="text-align:right;padding:2px 0">
          <div>${item.productNameAr}</div>
          ${item.unitName ? `<span style="font-size:9px;color:#555">(${item.unitName})</span>` : ''}
        </td>
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
            <span>المجموع الفرعي:</span>
            <span>${(invoice.subtotal ?? invoice.totalAmount).toFixed(2)} ج.م</span>
          </div>
          ${(invoice.discountAmount && invoice.discountAmount > 0) ? `
          <div class="row" style="color:#dc2626;font-weight:bold">
            <span>الخصم (${invoice.discountPercent || 0}%):</span>
            <span>-${invoice.discountAmount.toFixed(2)} ج.م</span>
          </div>
          ` : ''}
          <div class="row grand-total">
            <span>الصافي النهائي:</span>
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

  /**
   * Print a thermal receipt (80mm) for End of Shift / Cash Drawer Closing (Z-Report).
   */
  printShiftClosingReport(data: {
    cashierName: string;
    shiftDate: string;
    openingBalance: number;
    totalInflows: number;
    totalOutflows: number;
    expectedBalance: number;
    actualBalance: number;
    difference: number;
    totalDiscounts?: number;
    transactionCount: number;
    notes?: string;
  }): void {
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          @page { size: 80mm auto; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Cairo', 'Tahoma', sans-serif;
            font-size: 12px;
            width: 80mm;
            padding: 4mm;
            color: #000;
          }
          .center { text-align: center; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .double-divider { border-top: 2px solid #000; margin: 6px 0; }
          .title { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
          .sub { font-size: 11px; color: #555; }
          .row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 12px; }
          .bold-row { font-weight: bold; font-size: 13px; }
          .status { font-weight: bold; padding: 4px; text-align: center; margin: 6px 0; border: 1px solid #000; }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="title">RetailHub Store</div>
          <div class="sub">نظام إدارة المبيعات ونقاط البيع</div>
          <div class="divider"></div>
          <h3 style="font-size:14px;font-weight:bold">تقرير إغلاق الوردية (Z-Report)</h3>
        </div>

        <div class="divider"></div>

        <div class="row">
          <span>الكاشير:</span>
          <span><b>${data.cashierName}</b></span>
        </div>
        <div class="row">
          <span>تاريخ الوردية:</span>
          <span>${data.shiftDate}</span>
        </div>
        <div class="row">
          <span>وقت الإغلاق:</span>
          <span>${new Date().toLocaleTimeString('ar-EG')}</span>
        </div>
        <div class="row">
          <span>عدد الحركات:</span>
          <span>${data.transactionCount} حركة</span>
        </div>

        <div class="divider"></div>

        <div class="row">
          <span>الرصيد الافتتاحي:</span>
          <span>${data.openingBalance.toFixed(2)} ج.م</span>
        </div>
        <div class="row" style="color:#059669">
          <span>المقبوضات (مبيعات صافية داخل):</span>
          <span>+${data.totalInflows.toFixed(2)} ج.م</span>
        </div>
        <div class="row" style="color:#dc2626">
          <span>المدفوعات (مصروفات/شراء خارج):</span>
          <span>-${Math.abs(data.totalOutflows).toFixed(2)} ج.م</span>
        </div>
        <div class="row" style="color:#d97706">
          <span>إجمالي الخصومات الممنوحة:</span>
          <span>${(data.totalDiscounts || 0).toFixed(2)} ج.م</span>
        </div>

        <div class="divider"></div>

        <div class="row bold-row">
          <span>الرصيد المتوقع بالدرج:</span>
          <span>${data.expectedBalance.toFixed(2)} ج.م</span>
        </div>
        <div class="row bold-row" style="font-size:14px">
          <span>النقدية الفعلية المحصية:</span>
          <span>${data.actualBalance.toFixed(2)} ج.م</span>
        </div>

        <div class="double-divider"></div>

        <div class="row bold-row" style="color:${data.difference === 0 ? '#059669' : (data.difference < 0 ? '#dc2626' : '#d97706')}">
          <span>الفارق (عجز / زيادة):</span>
          <span>${data.difference < 0 ? '−' : (data.difference > 0 ? '+' : '')}${Math.abs(data.difference).toFixed(2)} ج.م ${data.difference < 0 ? 'عجز' : (data.difference > 0 ? 'زيادة' : 'مطابق')}</span>
        </div>

        <div class="status" style="background:${data.difference === 0 ? '#d1fae5' : (data.difference < 0 ? '#fee2e2' : '#fef3c7')}; color:${data.difference === 0 ? '#065f46' : (data.difference < 0 ? '#991b1b' : '#92400e')}">
          ${data.difference === 0 ? '✅ مطابقة تامة — لا يوجد عجز أو زيادة' : (data.difference < 0 ? `⚠️ عجز في العهدة: −${Math.abs(data.difference).toFixed(2)} ج.م عجز` : `ℹ️ زيادة بالدرج: +${data.difference.toFixed(2)} ج.م زيادة`)}
        </div>

        ${data.notes ? `
        <div class="row" style="font-size:10px;color:#555">
          <span>ملاحظات:</span>
          <span>${data.notes}</span>
        </div>
        ` : ''}

        <div class="divider"></div>
        <div class="center sub" style="margin-top:8px">
          <p>توقيع الصيدلي / الكاشير: ........................</p>
          <p style="margin-top:4px">توقيع المستلم / الإدارة: ........................</p>
        </div>
      </body>
      </html>
    `;
    this.printHtml(html);
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
