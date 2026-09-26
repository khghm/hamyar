// Utility برای خروجی Excel با پشتیبانی کامل فارسی
export function exportToExcel(filename: string, headers: string[], rows: string[][], title?: string) {
  // ساخت HTML با پشتیبانی کامل UTF-8 و فارسی
  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:x="urn:schemas-microsoft-com:office:excel" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>گزارش</x:Name>
              <x:WorksheetOptions>
                <x:DisplayRightToLeft/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        @page {
          size: A4;
          margin: 1cm;
        }
        body {
          font-family: 'B Nazanin', 'Tahoma', 'Arial', sans-serif;
          direction: rtl;
          text-align: right;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          direction: rtl;
        }
        th {
          background-color: #2563eb;
          color: white;
          font-weight: bold;
          padding: 10px;
          border: 1px solid #1e40af;
          text-align: center;
        }
        td {
          padding: 8px;
          border: 1px solid #d1d5db;
          text-align: right;
        }
        tr:nth-child(even) {
          background-color: #f3f4f6;
        }
        .title {
          font-size: 18px;
          font-weight: bold;
          color: #1e40af;
          text-align: center;
          padding: 15px;
          background-color: #dbeafe;
        }
        .date {
          text-align: left;
          font-size: 11px;
          color: #6b7280;
          padding: 5px;
        }
        .total-row {
          background-color: #fef3c7 !important;
          font-weight: bold;
        }
        .number {
          text-align: center;
          font-family: 'Tahoma', monospace;
        }
      </style>
    </head>
    <body>
  `;

  if (title) {
    html += `<div class="title">${title}</div>`;
  }
  
  html += `<div class="date">تاریخ گزارش: ${new Date().toLocaleDateString('fa-IR')}</div>`;
  
  html += '<table>';
  
  // Headers
  html += '<thead><tr>';
  headers.forEach(header => {
    html += `<th>${header}</th>`;
  });
  html += '</tr></thead>';
  
  // Rows
  html += '<tbody>';
  rows.forEach(row => {
    html += '<tr>';
    row.forEach((cell, idx) => {
      const isNumber = !isNaN(Number(cell.replace(/,/g, ''))) && cell.trim() !== '';
      html += `<td class="${isNumber ? 'number' : ''}">${cell}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  
  html += '</body></html>';

  // ایجاد Blob و دانلود
  const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toLocaleDateString('fa-IR')}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Utility برای چاپ فاکتور
export function printInvoice(invoiceData: any) {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    alert('لطفاً پاپ‌آپ را برای این سایت فعال کنید');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="fa">
    <head>
      <meta charset="UTF-8">
      <title>فاکتور ${invoiceData.invoiceNumber}</title>
      <style>
        @import url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Vazirmatn', 'Tahoma', sans-serif;
          direction: rtl;
          padding: 20px;
          color: #1f2937;
          background: white;
        }
        
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          border: 2px solid #2563eb;
          padding: 30px;
          background: white;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
        
        .logo-section h1 {
          color: #2563eb;
          font-size: 28px;
          margin-bottom: 5px;
        }
        
        .logo-section p {
          color: #6b7280;
          font-size: 12px;
          line-height: 1.6;
        }
        
        .invoice-info {
          text-align: left;
        }
        
        .invoice-info h2 {
          color: #2563eb;
          font-size: 24px;
          margin-bottom: 10px;
        }
        
        .invoice-info p {
          font-size: 13px;
          margin: 3px 0;
        }
        
        .invoice-info strong {
          color: #1f2937;
        }
        
        .bill-to {
          background: #f3f4f6;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .bill-to h3 {
          color: #2563eb;
          font-size: 14px;
          margin-bottom: 8px;
        }
        
        .bill-to p {
          font-size: 13px;
          margin: 3px 0;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        
        thead {
          background: #2563eb;
          color: white;
        }
        
        th {
          padding: 12px 8px;
          text-align: center;
          font-size: 13px;
          font-weight: bold;
        }
        
        td {
          padding: 10px 8px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 13px;
          text-align: center;
        }
        
        tbody tr:nth-child(even) {
          background: #f9fafb;
        }
        
        .text-right {
          text-align: right !important;
        }
        
        .text-left {
          text-align: left !important;
        }
        
        .totals {
          margin-right: auto;
          width: 300px;
          margin-top: 20px;
        }
        
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 15px;
          font-size: 14px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .totals-row.final {
          background: #2563eb;
          color: white;
          font-weight: bold;
          font-size: 16px;
          border-radius: 6px;
          margin-top: 10px;
          padding: 12px 15px;
        }
        
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
        }
        
        .footer p {
          margin: 3px 0;
        }
        
        .signature {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
          padding-top: 20px;
        }
        
        .signature-box {
          text-align: center;
          width: 200px;
        }
        
        .signature-line {
          border-top: 1px solid #1f2937;
          margin-top: 50px;
          padding-top: 5px;
          font-size: 12px;
        }
        
        .note {
          background: #fef3c7;
          border-right: 4px solid #f59e0b;
          padding: 10px 15px;
          margin: 20px 0;
          font-size: 12px;
        }
        
        @media print {
          body {
            padding: 0;
          }
          .invoice-container {
            border: none;
            page-break-inside: avoid;
          }
          @page {
            size: A4;
            margin: 1cm;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <div class="logo-section">
            <h1>کافی نت همیار</h1>
            <p>
              مرکز خدمات و فروش دیجیتال<br>
              تلفن: 021-36432665 | موبایل: 09913911880<br>
              آدرس: تهران
            </p>
          </div>
          <div class="invoice-info">
            <h2>فاکتور فروش</h2>
            <p><strong>شماره فاکتور:</strong> ${invoiceData.invoiceNumber}</p>
            <p><strong>تاریخ صدور:</strong> ${invoiceData.date}</p>
            <p><strong>نوع فاکتور:</strong> ${invoiceData.type}</p>
            ${invoiceData.dueDate ? `<p><strong>مهلت پرداخت:</strong> ${invoiceData.dueDate}</p>` : ''}
          </div>
        </div>

        <div class="bill-to">
          <h3>مشتری / گیرنده:</h3>
          <p><strong>نام:</strong> ${invoiceData.customerName || '-'}</p>
          ${invoiceData.customerPhone ? `<p><strong>تلفن:</strong> ${invoiceData.customerPhone}</p>` : ''}
          ${invoiceData.customerAddress ? `<p><strong>آدرس:</strong> ${invoiceData.customerAddress}</p>` : ''}
          ${invoiceData.customerNationalId ? `<p><strong>کد ملی/شناسه ملی:</strong> ${invoiceData.customerNationalId}</p>` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 50px;">ردیف</th>
              <th>شرح کالا / خدمات</th>
              <th style="width: 80px;">تعداد</th>
              <th style="width: 100px;">واحد</th>
              <th style="width: 130px;">قیمت واحد (تومان)</th>
              <th style="width: 130px;">قیمت کل (تومان)</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceData.items.map((item: any, idx: number) => `
              <tr>
                <td>${idx + 1}</td>
                <td class="text-right">${item.name}</td>
                <td>${item.quantity}</td>
                <td>${item.unit || 'عدد'}</td>
                <td>${Number(item.price).toLocaleString('fa-IR')}</td>
                <td>${Number(item.price * item.quantity).toLocaleString('fa-IR')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">
            <span>جمع کل:</span>
            <span>${Number(invoiceData.subtotal).toLocaleString('fa-IR')} تومان</span>
          </div>
          ${invoiceData.discount > 0 ? `
            <div class="totals-row">
              <span>تخفیف (${invoiceData.discountType === 'percent' ? invoiceData.discount + '%' : ''}):</span>
              <span>-${Number(invoiceData.discountAmount).toLocaleString('fa-IR')} تومان</span>
            </div>
          ` : ''}
          ${invoiceData.tax > 0 ? `
            <div class="totals-row">
              <span>مالیات و عوارض (${invoiceData.tax}%):</span>
              <span>${Number(invoiceData.taxAmount).toLocaleString('fa-IR')} تومان</span>
            </div>
          ` : ''}
          <div class="totals-row final">
            <span>مبلغ نهایی قابل پرداخت:</span>
            <span>${Number(invoiceData.total).toLocaleString('fa-IR')} تومان</span>
          </div>
        </div>

        ${invoiceData.note ? `
          <div class="note">
            <strong>یادداشت:</strong> ${invoiceData.note}
          </div>
        ` : ''}

        <div class="signature">
          <div class="signature-box">
            <div class="signature-line">مهر و امضای فروشنده</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">امضای مشتری</div>
          </div>
        </div>

        <div class="footer">
          <p>از اعتماد شما سپاسگزاریم | کافی نت همیار</p>
          <p>شماره تماس پشتیبانی: 09913911880 | 09204767001</p>
          <p>آیدی شبکه‌های اجتماعی: @hamyar_service1</p>
        </div>
      </div>
      
      <script>
        window.onload = function() {
          // کاربر می‌تواند با Ctrl+P چاپ کند
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  
  // منتظر لود شدن فونت و سپس چاپ
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 500);
}
