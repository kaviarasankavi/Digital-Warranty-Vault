import PDFDocument from 'pdfkit';
import { IWarrantyCertificate } from '../models/WarrantyCertificate';

const VENDOR_DISPLAY: Record<string, string> = {
    'vendor@samsung.vault':     'Samsung Electronics',
    'vendor@dell.vault':        'Dell Technologies',
    'vendor@jbl.vault':         'JBL (Harman International)',
    'vendor@firebolt.vault':    'FireBolt Technologies',
    'vendor@sony.vault':        'Sony Corporation',
    'vendor@lg.vault':          'LG Electronics',
    'vendor@apple.vault':       'Apple Inc.',
    'vendor@warrantyvault.com': 'WarrantyVault',
};

function fmt(d: Date | string): string {
    return new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric',
    });
}

// Safe rounded rect helper (PDFKit only takes a single number radius)
function rRect(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, r: number) {
    doc.roundedRect(x, y, w, h, r);
}

export function generateCertificatePDF(cert: IWarrantyCertificate): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size:   'A4',
                margin: 0,
                info: {
                    Title:   `Warranty Certificate — ${cert.productName}`,
                    Author:  'WarrantyVault',
                    Subject: 'Certificate of Authenticity',
                },
            });

            const chunks: Buffer[] = [];
            doc.on('data',  c => chunks.push(c));
            doc.on('end',   () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const W = doc.page.width;   // 595.28
            const H = doc.page.height;  // 841.89

            /* ── 1. Navy background ─────────────────────────────────── */
            doc.rect(0, 0, W, H).fill('#0f172a');

            /* ── 2. Teal top stripe ─────────────────────────────────── */
            doc.rect(0, 0, W, 6).fill('#0d9488');

            /* ── 3. White card ──────────────────────────────────────── */
            const CX = 36, CY = 44, CW = W - 72, CH = H - 88;
            rRect(doc, CX, CY, CW, CH, 14);
            doc.fill('#f8fafc');

            // Gold card border
            rRect(doc, CX, CY, CW, CH, 14);
            doc.stroke('#d97706');

            /* ── 4. Teal header inside card ─────────────────────────── */
            // Draw header as a plain rect + rounded rect stacked
            doc.rect(CX + 1, CY + 1, CW - 2, 90).fill('#0d9488');
            rRect(doc, CX + 1, CY + 1, CW - 2, 90, 13);
            doc.fill('#0d9488');

            /* ── 5. Header text ─────────────────────────────────────── */
            doc.font('Helvetica-Bold').fontSize(9).fillColor('#a7f3d0')
               .text('WARRANTYVAULT', CX + 24, CY + 16, { characterSpacing: 3, width: 200 });

            doc.font('Helvetica-Bold').fontSize(20).fillColor('#ffffff')
               .text('Certificate of Authenticity', CX + 24, CY + 34, { width: CW - 48 });

            /* ── 6. Certificate ID badge (top-right) ─────────────────── */
            doc.font('Helvetica').fontSize(7).fillColor('rgba(255,255,255,0.65)')
               .text(cert.certificateId, CX + CW - 195, CY + 16, { width: 170, align: 'right', characterSpacing: 1 });
            doc.font('Helvetica').fontSize(7).fillColor('rgba(255,255,255,0.5)')
               .text(`Issued: ${fmt(cert.issuedAt)}`, CX + CW - 195, CY + 28, { width: 170, align: 'right' });

            /* ── 7. Green checkmark badge ───────────────────────────── */
            const bx = CX + CW - 55, by = CY + 55;
            doc.circle(bx, by, 25).fill('#ffffff');
            doc.circle(bx, by, 21).fill('#059669');
            doc.font('Helvetica-Bold').fontSize(18).fillColor('#ffffff')
               .text('✓', bx - 9, by - 12, { width: 20 });

            /* ── 8. Intro line ──────────────────────────────────────── */
            const bodyTop = CY + 105;
            doc.font('Helvetica').fontSize(9.5).fillColor('#475569')
               .text(
                   'This certificate confirms that the product below has been verified as genuine and authentic by the authorized brand vendor.',
                   CX + 24, bodyTop,
                   { width: CW - 48, align: 'center' }
               );

            // Divider
            let y = bodyTop + 36;
            doc.moveTo(CX + 24, y).lineTo(CX + CW - 24, y).strokeColor('#e2e8f0').lineWidth(1).stroke();
            y += 12;

            /* ── 9. Product details ─────────────────────────────────── */
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#0d9488')
               .text('PRODUCT DETAILS', CX + 24, y, { characterSpacing: 2 });
            y += 16;

            const rows: [string, string][] = [
                ['Product Name',  cert.productName],
                ['Brand',         cert.brand.toUpperCase()],
                ['Model',         cert.model  || '—'],
                ['Serial Number', cert.serialNumber || '—'],
            ];

            for (let i = 0; i < rows.length; i++) {
                const [lbl, val] = rows[i];
                if (i % 2 === 0) {
                    doc.rect(CX + 16, y - 3, CW - 32, 18).fill('#f1f5f9');
                }
                doc.font('Helvetica').fontSize(8.5).fillColor('#64748b')
                   .text(lbl, CX + 24, y, { width: 140 });
                doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#1e293b')
                   .text(val, CX + 170, y, { width: CW - 194 });
                y += 18;
            }

            y += 12;

            // Divider
            doc.moveTo(CX + 24, y).lineTo(CX + CW - 24, y).strokeColor('#e2e8f0').lineWidth(1).stroke();
            y += 12;

            /* ── 10. Verification details ───────────────────────────── */
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#0d9488')
               .text('VERIFICATION DETAILS', CX + 24, y, { characterSpacing: 2 });
            y += 16;

            const vendorDisplay = VENDOR_DISPLAY[cert.vendorEmail] ?? cert.brand;
            const vRows: [string, string][] = [
                ['Verification Date',  fmt(cert.verifiedAt)],
                ['Verified By',        vendorDisplay],
                ['Certificate Issued', fmt(cert.issuedAt)],
                ['Certificate ID',     cert.certificateId],
                ['Owner',              `${cert.userName} (${cert.userEmail})`],
            ];

            for (let i = 0; i < vRows.length; i++) {
                const [lbl, val] = vRows[i];
                if (i % 2 === 0) {
                    doc.rect(CX + 16, y - 3, CW - 32, 18).fill('#f1f5f9');
                }
                doc.font('Helvetica').fontSize(8.5).fillColor('#64748b')
                   .text(lbl, CX + 24, y, { width: 140 });
                doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#1e293b')
                   .text(val, CX + 170, y, { width: CW - 194 });
                y += 18;
            }

            // Vendor note
            if (cert.vendorNote) {
                y += 6;
                rRect(doc, CX + 16, y, CW - 32, 30, 6);
                doc.fill('#f0fdf4');
                doc.font('Helvetica').fontSize(8.5).fillColor('#166534')
                   .text(`Vendor Note: "${cert.vendorNote}"`, CX + 24, y + 8, { width: CW - 48 });
                y += 38;
            } else {
                y += 10;
            }

            /* ── 11. VERIFIED AUTHENTIC seal ───────────────────────── */
            rRect(doc, CX + 16, y, CW - 32, 44, 8);
            doc.fill('#f0fdf4');
            doc.font('Helvetica-Bold').fontSize(15).fillColor('#15803d')
               .text('✓   VERIFIED & AUTHENTIC', CX + 16, y + 8, { width: CW - 32, align: 'center' });
            doc.font('Helvetica').fontSize(8).fillColor('#166534')
               .text('This product has passed authenticity verification by the authorized brand vendor.', CX + 16, y + 28, { width: CW - 32, align: 'center' });
            y += 56;

            /* ── 12. Vendor stamp (right) ────────────────────────────── */
            const stampW = 170, stampH = 64;
            const stampX = CX + CW - stampW - 16;
            const stampY = y + 10;
            rRect(doc, stampX, stampY, stampW, stampH, 8);
            doc.stroke('#0d9488');
            doc.moveTo(stampX, stampY + 26).lineTo(stampX + stampW, stampY + 26)
               .strokeColor('#e2e8f0').lineWidth(1).stroke();
            doc.font('Helvetica-Bold').fontSize(7).fillColor('#0d9488')
               .text('AUTHORIZED VENDOR STAMP', stampX, stampY + 8, { width: stampW, align: 'center', characterSpacing: 1 });
            doc.font('Helvetica-Bold').fontSize(10).fillColor('#1e293b')
               .text(vendorDisplay, stampX, stampY + 32, { width: stampW, align: 'center' });
            doc.font('Helvetica').fontSize(7.5).fillColor('#64748b')
               .text(cert.vendorEmail, stampX, stampY + 46, { width: stampW, align: 'center' });

            // Signature line (left)
            const sigY = stampY + 50;
            doc.moveTo(CX + 24, sigY).lineTo(CX + 150, sigY)
               .strokeColor('#94a3b8').lineWidth(1).stroke();
            doc.font('Helvetica').fontSize(7.5).fillColor('#94a3b8')
               .text('Authorized Signature', CX + 24, sigY + 4);

            /* ── 13. Footer bar ─────────────────────────────────────── */
            const footerY = CY + CH - 28;
            doc.rect(CX + 1, footerY, CW - 2, 27).fill('#0d9488');
            doc.font('Helvetica').fontSize(7.5).fillColor('rgba(255,255,255,0.65)')
               .text(
                   'Digitally generated by WarrantyVault  ·  Verify authenticity at warrantyvault.com',
                   CX + 24, footerY + 9,
                   { width: CW - 48, align: 'center' }
               );

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}
