require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/warranty_vault');
    const db = mongoose.connection.useDb('warranty_vault');
    const result = await db.collection('users').updateOne(
        { email: 'admin@vault.com' },
        { $set: { role: 'admin' } }
    );
    console.log(result);
    process.exit(0);
}
run();
