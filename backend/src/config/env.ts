import { config } from 'dotenv';
config();

export const env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '5000', 10),

    // MongoDB
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/warranty_vault',

    // PostgreSQL (Neon)
    DATABASE_URL: process.env.DATABASE_URL || '',

    // Neo4j
    NEO4J_URI: process.env.NEO4J_URI || 'bolt://localhost:7687',
    NEO4J_USER: process.env.NEO4J_USER || 'neo4j',
    NEO4J_PASSWORD: process.env.NEO4J_PASSWORD || 'password',

    // JWT
    JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

    // MySQL (Audit Log)
    MYSQL_HOST: process.env.MYSQL_HOST || 'localhost',
    MYSQL_PORT: parseInt(process.env.MYSQL_PORT || '3306', 10),
    MYSQL_USER: process.env.MYSQL_USER || 'root',
    MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || '',
    MYSQL_DATABASE: process.env.MYSQL_DATABASE || 'warranty_vault_audit',

    // Encryption
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'a'.repeat(64), // 32-byte hex key
};
