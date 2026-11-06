import PDFDocument from 'pdfkit';
import { WarehouseInfo } from '../models/types';

export interface AddressCardData {
  customer_code: string;
  customer_name: string;
  customer_phone: string;
  warehouse: WarehouseInfo;
}

/**
 * Generates a Supplier Address Card PDF containing English and Chinese instructions.
 */
export async function generateAddressCardPDF(data: AddressCardData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A5', margin: 30 });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Header Banner
      doc.rect(0, 0, doc.page.width, 70).fill('#1E3A8A'); // Navy Blue
      doc.fillColor('#FFFFFF').fontSize(16).text('DANTE GLOBAL LOGISTICS', 30, 20, { align: 'center' });
      doc.fontSize(11).text('Official Overseas Warehouse Shipping Label & Instructions', 30, 42, { align: 'center' });

      doc.moveDown(2.5);

      // Important Customer Box
      const boxY = 85;
      doc.rect(25, boxY, doc.page.width - 50, 75).fillAndStroke('#FEF3C7', '#D97706'); // Warm Yellow
      doc.fillColor('#92400E').fontSize(12).text('YOUR PERSONAL CUSTOMER CODE:', 35, boxY + 12);
      doc.fontSize(22).fillColor('#B45309').text(data.customer_code, 35, boxY + 30);
      doc.fontSize(10).fillColor('#4B5563').text(`Customer: ${data.customer_name} | Phone: ${data.customer_phone}`, 35, boxY + 56);

      // Supplier Instructions Box
      const instrY = 175;
      doc.rect(25, instrY, doc.page.width - 50, 95).fillAndStroke('#F3F4F6', '#9CA3AF');
      doc.fillColor('#111827').fontSize(11).text('NOTE FOR SUPPLIER / SELLER (ENGLISH):', 35, instrY + 10);
      doc.fontSize(9.5).fillColor('#374151').text(
        `Please clearly write or print the customer code "${data.customer_code}" on the outside of every shipping carton. Packages without a customer code may experience severe delivery delays.`,
        35,
        instrY + 26,
        { width: doc.page.width - 70 }
      );

      doc.fillColor('#111827').fontSize(11).text('NOTE FOR CHINESE SUPPLIER (中文备注):', 35, instrY + 62);
      doc.fontSize(9.5).fillColor('#B91C1C').text(
        `请务必在包裹外包装或面单上大字注明客户识别码: ${data.customer_code}。无此代码的包裹将无法正常录入系统并可能导致严重延误。`,
        35,
        instrY + 76,
        { width: doc.page.width - 70 }
      );

      // Warehouse Address Block
      const addrY = 285;
      doc.rect(25, addrY, doc.page.width - 50, 115).fillAndStroke('#FFFFFF', '#CBD5E1');
      doc.fillColor('#1E3A8A').fontSize(12).text('WAREHOUSE DELIVERY ADDRESS', 35, addrY + 12);

      doc.fontSize(9.5).fillColor('#1F2937');
      doc.text(`Warehouse Name: ${data.warehouse.name}`, 35, addrY + 30);
      doc.text(`Address (English): ${data.warehouse.address_en}`, 35, addrY + 45, { width: doc.page.width - 70 });
      doc.text(`Address (Chinese): ${data.warehouse.address_zh}`, 35, addrY + 75, { width: doc.page.width - 70 });
      doc.text(`Warehouse Phone: ${data.warehouse.phone}`, 35, addrY + 95);

      // Footer
      doc.fontSize(8.5).fillColor('#6B7280').text(
        'Dante Cargo Hub • Baghdad / Erbil / Basra Doorstep Delivery • Powered by Dante Logistics',
        30,
        doc.page.height - 30,
        { align: 'center', width: doc.page.width - 60 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
