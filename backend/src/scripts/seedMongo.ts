import mongoose from 'mongoose';
import { MongoProduct } from '../models/MongoProduct';
import { MongoWarranty } from '../models/MongoWarranty';
import { logger } from '../utils/logger';

// ── Sample data pools ──────────────────────────────────────────────────────────
const brands = [
    'Apple', 'Samsung', 'Sony', 'LG', 'Dell', 'HP', 'Lenovo', 'Bose',
    'Dyson', 'Bosch', 'Philips', 'Canon', 'Nikon', 'Microsoft', 'Google',
    'OnePlus', 'Whirlpool', 'Panasonic', 'JBL', 'Asus',
];

const categories = [
    'Electronics', 'Appliances', 'Audio', 'Computing', 'Photography',
    'Smart Home', 'Wearables', 'Gaming', 'Kitchen', 'Personal Care',
];

const productTemplates: { name: string; category: string; brand: string; priceRange: [number, number] }[] = [
    { name: 'MacBook Pro 16"', category: 'Computing', brand: 'Apple', priceRange: [2499, 3499] },
    { name: 'iPhone 15 Pro Max', category: 'Electronics', brand: 'Apple', priceRange: [1199, 1599] },
    { name: 'AirPods Pro 2', category: 'Audio', brand: 'Apple', priceRange: [249, 249] },
    { name: 'Galaxy S24 Ultra', category: 'Electronics', brand: 'Samsung', priceRange: [1199, 1419] },
    { name: 'Galaxy Tab S9', category: 'Electronics', brand: 'Samsung', priceRange: [799, 1099] },
    { name: 'OLED TV 65"', category: 'Electronics', brand: 'LG', priceRange: [1799, 2499] },
    { name: 'WH-1000XM5', category: 'Audio', brand: 'Sony', priceRange: [348, 398] },
    { name: 'PlayStation 5 Pro', category: 'Gaming', brand: 'Sony', priceRange: [499, 699] },
    { name: 'Alpha A7 IV', category: 'Photography', brand: 'Sony', priceRange: [2498, 2498] },
    { name: 'XPS 15 Laptop', category: 'Computing', brand: 'Dell', priceRange: [1299, 1899] },
    { name: 'Spectre x360', category: 'Computing', brand: 'HP', priceRange: [1249, 1649] },
    { name: 'ThinkPad X1 Carbon', category: 'Computing', brand: 'Lenovo', priceRange: [1429, 2149] },
    { name: 'QuietComfort Ultra', category: 'Audio', brand: 'Bose', priceRange: [429, 429] },
    { name: 'SoundLink Max', category: 'Audio', brand: 'Bose', priceRange: [399, 399] },
    { name: 'V15 Detect Vacuum', category: 'Appliances', brand: 'Dyson', priceRange: [749, 749] },
    { name: 'Airwrap Complete', category: 'Personal Care', brand: 'Dyson', priceRange: [599, 599] },
    { name: 'Pure Cool Tower', category: 'Smart Home', brand: 'Dyson', priceRange: [549, 549] },
    { name: 'Series 800 Dishwasher', category: 'Kitchen', brand: 'Bosch', priceRange: [1149, 1149] },
    { name: 'EOS R6 Mark II', category: 'Photography', brand: 'Canon', priceRange: [2499, 2499] },
    { name: 'Z8 Camera Body', category: 'Photography', brand: 'Nikon', priceRange: [3996, 3996] },
    { name: 'Surface Pro 10', category: 'Computing', brand: 'Microsoft', priceRange: [1199, 1599] },
    { name: 'Xbox Series X', category: 'Gaming', brand: 'Microsoft', priceRange: [499, 499] },
    { name: 'Pixel Watch 3', category: 'Wearables', brand: 'Google', priceRange: [349, 449] },
    { name: 'Nest Hub Max', category: 'Smart Home', brand: 'Google', priceRange: [229, 229] },
    { name: 'OnePlus 12', category: 'Electronics', brand: 'OnePlus', priceRange: [799, 899] },
    { name: 'Smart Microwave', category: 'Kitchen', brand: 'Whirlpool', priceRange: [249, 349] },
    { name: 'Refrigerator French Door', category: 'Kitchen', brand: 'Whirlpool', priceRange: [1899, 2499] },
    { name: 'Lumix GH6', category: 'Photography', brand: 'Panasonic', priceRange: [2197, 2197] },
    { name: 'JBL Charge 5', category: 'Audio', brand: 'JBL', priceRange: [179, 179] },
    { name: 'Flip 6 Speaker', category: 'Audio', brand: 'JBL', priceRange: [129, 129] },
    { name: 'ROG Strix G16', category: 'Gaming', brand: 'Asus', priceRange: [1599, 2199] },
    { name: 'ZenBook 14 OLED', category: 'Computing', brand: 'Asus', priceRange: [849, 1099] },
    { name: 'Apple Watch Ultra 2', category: 'Wearables', brand: 'Apple', priceRange: [799, 799] },
    { name: 'Galaxy Watch 6', category: 'Wearables', brand: 'Samsung', priceRange: [299, 449] },
    { name: 'Smart Washer', category: 'Appliances', brand: 'LG', priceRange: [849, 1199] },
    { name: 'Air Purifier', category: 'Smart Home', brand: 'Philips', priceRange: [299, 449] },
    { name: 'Electric Shaver 9000', category: 'Personal Care', brand: 'Philips', priceRange: [179, 249] },
    { name: 'Espresso Machine', category: 'Kitchen', brand: 'Philips', priceRange: [699, 899] },
    { name: 'OLED Monitor 27"', category: 'Computing', brand: 'LG', priceRange: [899, 1299] },
    { name: 'Smart Doorbell', category: 'Smart Home', brand: 'Google', priceRange: [179, 249] },
    { name: 'HomePod Mini', category: 'Smart Home', brand: 'Apple', priceRange: [99, 99] },
    { name: 'Galaxy Buds3 Pro', category: 'Audio', brand: 'Samsung', priceRange: [249, 249] },
    { name: 'Insta360 X4', category: 'Photography', brand: 'Canon', priceRange: [499, 499] },
    { name: 'iPad Air M2', category: 'Electronics', brand: 'Apple', priceRange: [599, 799] },
    { name: 'Monitor Ultrawide 34"', category: 'Computing', brand: 'Dell', priceRange: [599, 899] },
    { name: 'Smart Oven', category: 'Kitchen', brand: 'Bosch', priceRange: [399, 549] },
    { name: 'Robot Vacuum S8+', category: 'Appliances', brand: 'Samsung', priceRange: [699, 999] },
    { name: 'Portable SSD 2TB', category: 'Computing', brand: 'Samsung', priceRange: [159, 229] },
    { name: 'Soundbar HW-Q990D', category: 'Audio', brand: 'Samsung', priceRange: [1299, 1299] },
    { name: 'Nintendo Switch 2', category: 'Gaming', brand: 'Panasonic', priceRange: [349, 449] },
];

const warrantyTypes: ('standard' | 'extended' | 'premium')[] = ['standard', 'extended', 'premium'];

// ── Helpers ─────────────────────────────────────────────────────────────────────
function randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(startMonthsAgo: number, endMonthsAgo: number): Date {
    const now = new Date();
    const start = new Date(now);
    start.setMonth(start.getMonth() - startMonthsAgo);
    const end = new Date(now);
    end.setMonth(end.getMonth() - endMonthsAgo);
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function computeWarrantyStatus(endDate: Date): 'active' | 'expired' | 'expiring' {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    if (endDate < now) return 'expired';
    if (endDate <= thirtyDaysFromNow) return 'expiring';
    return 'active';
}

// ── Main seed function ──────────────────────────────────────────────────────────
export async function seedMongoData(userId: string): Promise<void> {
    try {
        // Check if data already exists for this user
        const existingCount = await MongoProduct.countDocuments({ userId });
        if (existingCount > 0) {
            logger.info(`MongoDB seed: ${existingCount} products already exist for user — skipping seed`);
            return;
        }

        logger.info('MongoDB seed: Seeding sample product and warranty data...');

        const products: any[] = [];
        const warranties: any[] = [];

        // Create 50 products with diverse data
        for (let i = 0; i < productTemplates.length; i++) {
            const template = productTemplates[i];
            const purchaseDate = randomDate(18, 1); // 1–18 months ago
            const price = randomBetween(template.priceRange[0], template.priceRange[1]);

            // Warranty end: some expired, some active, some expiring soon
            const warrantyMonths = randomBetween(6, 36);
            const warrantyEnd = new Date(purchaseDate);
            warrantyEnd.setMonth(warrantyEnd.getMonth() + warrantyMonths);

            const product = await MongoProduct.create({
                userId,
                name: template.name,
                brand: template.brand,
                modelName: `${template.brand.substring(0, 3).toUpperCase()}-${randomBetween(1000, 9999)}`,
                serialNumber: `SN-${Date.now()}-${randomBetween(10000, 99999)}`,
                category: template.category,
                purchaseDate,
                purchasePrice: price,
                warrantyExpiry: warrantyEnd,
                status: computeWarrantyStatus(warrantyEnd) === 'expired' ? 'expired' : 'active',
                notes: '',
            });

            products.push(product);

            // Create corresponding warranty
            const warrantyStatus = computeWarrantyStatus(warrantyEnd);
            const warrantyType = warrantyTypes[randomBetween(0, 2)];

            const warranty = await MongoWarranty.create({
                productId: product._id,
                userId,
                warrantyType,
                status: warrantyStatus,
                startDate: purchaseDate,
                endDate: warrantyEnd,
                claimCount: warrantyStatus === 'expired' ? randomBetween(0, 3) : randomBetween(0, 1),
                coverageDetails: {
                    parts: true,
                    labor: warrantyType !== 'standard',
                    accidentalDamage: warrantyType === 'premium',
                },
            });

            warranties.push(warranty);
        }

        logger.info(`MongoDB seed: Created ${products.length} products and ${warranties.length} warranties`);
    } catch (error) {
        logger.error('MongoDB seed failed:', error);
        // Non-fatal — don't crash the server
    }
}
