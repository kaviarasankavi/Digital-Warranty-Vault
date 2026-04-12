import PDFDocument from 'pdfkit';
import { IWarrantyCertificate } from '../models/WarrantyCertificate';

// Vendor display name map
const VENDOR_DISPLAY: Record<string, string> = {
    'vendor@samsung.vault':  'Samsung Electronics',
    'vendor@dell.vault':     'Dell Technologies',
    'vendor@jbl.vault':      'JBL (Harman International)',
    'vendor@firebolt.vault': 'FireBolt Technologies',
    'vendor@sony.vault':     'Sony Corporation',
    'vendor@lg.vault':       'LG Electronics',
    'vendor@apple.vault':    'Apple Inc.',
    'vendor@warrantyvault.com': 'WarrantyVault',
};

function hex(h: string): [number, number, number] {
    const c = h.replace('#', '');
    return [
        parseInt(c.substring(0, 2), 16),
        parseInt(c.substring(2, 4), 16),
        parseInt(c.substring(4, 6), 16),
    ];
}

const DARK  = '#0f172a';
const TEAL  = '#0d9488';
const LIGHT = '#f8fafc';
const GOLD  = '#d97706';
const GRAY  = '#64748b';

function fmt(d: Date | string): string {
    return new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric',
    });
}

export function generateCertificatePDF(cert: IWarrantyCertificate): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size:    'A4',
                margins: { top: 0, right: 0, bottom: 0, left: 0 },
                info: {
                    Title:    `Warranty Certificate — ${cert.productName}`,
                    Author:   'WarrantyVault',
                    Subject:  'Product Authenticity Certificate',
                    Keywords: 'warranty, certificate, authenticity',
                },
            });

            const chunks: Buffer[] = [];
            doc.on('data',  d => chunks.push(d));
            doc.on('end',   () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const W = doc.page.width;   // 595.28
            const H = doc.page.height;  // 841.89

            // ──────────────────────────────────────────────
            // 1. Deep navy background
            // ──────────────────────────────────────────────
            doc.rect(0, 0, W, H).fill(DARK);

            // ──────────────────────────────────────────────
            // 2. Teal top accent bar
            // ──────────────────────────────────────────────
            doc.rect(0, 0, W, 8).fill(TEAL);

            // ──────────────────────────────────────────────
            // 3. White certificate card (inset)
            // ──────────────────────────────────────────────
            const cx = 40, cy = 50, cw = W - 80, ch = H - 100;
            doc
                .roundedRect(cx, cy, cw, ch, 16)
                .fill(LIGHT);

            // ──────────────────────────────────────────────
            // 4. Teal header strip inside card
            // ──────────────────────────────────────────────
            doc
                .roundedRect(cx, cy, cw, 100, 16)
                .fill(TEAL);
            // cover bottom-rounding of header
            doc.rect(cx, cy + 84, cw, 16).fill(TEAL);

            // ──────────────────────────────────────────────
            // 5. Header text
            // ──────────────────────────────────────────────
            doc
                .font('Helvetica-Bold')
                .fontSize(11)
                .fillColor('#ffffff')
                .text('WARRANTYVAULT', cx + 28, cy + 22, { characterSpacing: 3 });

            doc
                .font('Helvetica-Bold')
                .fontSize(22)
                .fillColor('#ffffff')
                .text('Certificate of Authenticity', cx + 28, cy + 45);

            // Certificate ID (top-right)
            doc
                .font('Helvetica')
                .fontSize(8)
                .fillColor('rgba(255,255,255,0.75)')
                .text(cert.certificateId, cx + cw - 190, cy + 22, { width: 160, align: 'right', characterSpacing: 1 });

            doc
                .font('Helvetica')
                .fontSize(8)
                .fillColor('rgba(255,255,255,0.6)')
                .text(`Issued: ${fmt(cert.issuedAt)}`, cx + cw - 190, cy + 36, { width: 160, align: 'right' });

            // ──────────────────────────────────────────────
            // 6. Verified badge (shield-like circle)
            // ──────────────────────────────────────────────
            const badgeX = cx + cw - 80, badgeY = cy + 65;
            doc.circle(badgeX, badgeY, 28).fill('#fff');
            doc.circle(badgeX, badgeY, 24).fill(TEAL);
            // Checkmark (simple text approach)
            doc
                .font('Helvetica-Bold')
                .fontSize(22)
                .fillColor('#fff')
                .text('✓', badgeX - 9, badgeY - 13);

            // ──────────────────────────────────────────────
            // 7. "This certifies that..." intro
            // ──────────────────────────────────────────────
            doc
                .font('Helvetica')
                .fontSize(11)
                .fillColor(GRAY)
                .text(
                    'This certificate confirms that the product described below has been verified as genuine and authentic by the authorized brand vendor.',
                    cx + 28, cy + 120, { width: cw - 56, align: 'center' }
                );

            // Divider line
            doc
                .moveTo(cx + 28, cy + 160)
                .lineTo(cx + cw - 28, cy + 160)
                .strokeColor('#e2e8f0')
                .lineWidth(1)
                .stroke();

            // ──────────────────────────────────────────────
            // 8. Product section
            // ──────────────────────────────────────────────
            const sectionY = cy + 175;
            doc
                .font('Helvetica-Bold')
                .fontSize(9)
                .fillColor(TEAL)
                .text('PRODUCT DETAILS', cx + 28, sectionY, { characterSpacing: 2 });

            const detailRows: [string, string][] = [
                ['Product Name',  cert.productName],
                ['Brand',         cert.brand.toUpperCase()],
                ['Model',         cert.model || '—'],
                ['Serial Number', cert.serialNumber || '—'],
            ];

            let rowY = sectionY + 18;
            const col1 = cx + 28, col2 = cx + 200;

            for (const [label, value] of detailRows) {
                // Row background alternating
                if (detailRows.indexOf([label, value]) % 2 === 0) {
                    doc.rect(cx + 20, rowY - 4, cw - 40, 22).fill('#f1f5f9');
                }
                doc.font('Helvetica').fontSize(9).fillColor(GRAY)
                    .text(label, col1, rowY, { width: 165 });
                doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK)
                    .text(value, col2, rowY, { width: cw - col2 + cx - 28 });
                rowY += 22;
            }

            // ──────────────────────────────────────────────
            // 9. Verification section
            // ──────────────────────────────────────────────
            const vSectionY = rowY + 20;
            doc.moveTo(cx + 28, vSectionY).lineTo(cx + cw - 28, vSectionY).strokeColor('#e2e8f0').lineWidth(1).stroke();

            doc
                .font('Helvetica-Bold').fontSize(9).fillColor(TEAL)
                .text('VERIFICATION DETAILS', cx + 28, vSectionY + 14, { characterSpacing: 2 });

            const vendorDisplay = VENDOR_DISPLAY[cert.vendorEmail] ?? cert.brand;
            const vRows: [string, string][] = [
                ['Verification Date',  fmt(cert.verifiedAt)],
                ['Verified By',        vendorDisplay],
                ['Certificate Issued', fmt(cert.issuedAt)],
                ['Certificate ID',     cert.certificateId],
                ['Owner',              `${cert.userName} (${cert.userEmail})`],
            ];

            let vRowY = vSectionY + 32;
            for (const [label, value] of vRows) {
                doc.font('Helvetica').fontSize(9).fillColor(GRAY).text(label, col1, vRowY, { width: 165 });
                doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK).text(value, col2, vRowY, { width: cw - col2 + cx - 28 });
                vRowY += 20;
            }

            // Vendor note (if any)
            if (cert.vendorNote) {
                doc.rect(cx + 20, vRowY + 4, cw - 40, 34).fill('#f0fdf4').stroke('#bbf7d0');
                doc.font('Helvetica').fontSize(9).fillColor('#166534')
                    .text(`Vendor Note: "${cert.vendorNote}"`, cx + 28, vRowY + 12, { width: cw - 56 });
                vRowY += 46;
            }

            // ──────────────────────────────────────────────
            // 10. Status seal
            // ──────────────────────────────────────────────
            const sealY = vRowY + 24;
            doc.rect(cx + 28, sealY, cw - 56, 48)
                .fill('#f0fdf4')
                .roundedRect(cx + 28, sealY, cw - 56, 48, 8).fill('#f0fdf4');

            doc.font('Helvetica-Bold').fontSize(14).fillColor('#15803d')
                .text('✓  VERIFIED & AUTHENTIC', cx + 28, sealY + 10, { width: cw - 56, align: 'center' });
            doc.font('Helvetica').fontSize(9).fillColor('#166534')
                .text('This product has passed authenticity verification by the authorized brand vendor.', cx + 28, sealY + 28, { width: cw - 56, align: 'center' });

            // ──────────────────────────────────────────────
            // 11. Vendor stamp (bottom right)
            // ──────────────────────────────────────────────
            const stampY = sealY + 70;
            const stampX = cx + cw - 200;

            doc.rect(stampX, stampY, 168, 68).fill('#fff').roundedRect(stampX, stampY, 168, 68, 10).stroke(TEAL);
            doc.moveTo(stampX, stampY + 28).lineTo(stampX + 168, stampY + 28).strokeColor('#e2e8f0').lineWidth(1).stroke();

            doc.font('Helvetica-Bold').fontSize(8).fillColor(TEAL)
                .text('AUTHORIZED VENDOR STAMP', stampX, stampY + 8, { width: 168, align: 'center', characterSpacing: 1 });

            doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK)
                .text(vendorDisplay, stampX, stampY + 34, { width: 168, align: 'center' });
            doc.font('Helvetica').fontSize(8).fillColor(GRAY)
                .text(cert.vendorEmail, stampX, stampY + 48, { width: 168, align: 'center' });

            // User signature line (bottom left)
            const sigX = cx + 28;
            const sigY = stampY + 48;
            doc.moveTo(sigX, sigY).lineTo(sigX + 120, sigY).strokeColor('#94a3b8').lineWidth(1).stroke();
            doc.font('Helvetica').fontSize(8).fillColor(GRAY).text('Authorized Signature', sigX, sigY + 4);

            // ──────────────────────────────────────────────
            // 12. Footer bar
            // ──────────────────────────────────────────────
            const footerY = cy + ch - 32;
            doc.rect(cx, footerY, cw, 32).fill(TEAL).roundedRect(cx, footerY, cw, 32, { lowerRight: 16, lowerLeft: 16 }).fill(TEAL);
            doc.rect(cx, footerY, cw, 8).fill(TEAL);  // cover top rounding of bottom rect

            doc.font('Helvetica').fontSize(8).fillColor('rgba(255,255,255,0.7)')
                .text('This is a digitally generated certificate. Verify authenticity at warrantyvault.com', cx, footerY + 11, { width: cw, align: 'center' });

            // Outer card border (gold)
            doc.roundedRect(cx, cy, cw, ch, 16).stroke(GOLD);

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}
