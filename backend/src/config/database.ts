import mongoose from 'mongoose';
import neo4j, { Driver, Session } from 'neo4j-driver';
import { env } from './env';
import { logger } from '../utils/logger';

// MongoDB Connection
export const connectMongoDB = async (): Promise<void> => {
    try {
        await mongoose.connect(env.MONGODB_URI);
        logger.info('MongoDB connected successfully');
    } catch (error) {
        logger.error('MongoDB connection failed:', error);
        process.exit(1);
    }
};

// Neo4j Connection
let neo4jDriver: Driver | null = null;

export const connectNeo4j = async (): Promise<Driver> => {
    try {
        neo4jDriver = neo4j.driver(
            env.NEO4J_URI,
            neo4j.auth.basic(env.NEO4J_USER, env.NEO4J_PASSWORD)
        );

        // Verify connectivity
        await neo4jDriver.verifyConnectivity();
        logger.info('Neo4j connected successfully');

        return neo4jDriver;
    } catch (error) {
        logger.error('Neo4j connection failed:', error);
        // Don't exit - Neo4j might not be running in dev, allow MongoDB-only mode
        logger.warn('Running without Neo4j - graph features will be disabled');
        return null as any;
    }
};

export const getNeo4jDriver = (): Driver | null => {
    return neo4jDriver;
};

export const getNeo4jSession = (): Session | null => {
    if (!neo4jDriver) {
        logger.warn('Neo4j driver not initialized');
        return null;
    }
    return neo4jDriver.session();
};

export const closeConnections = async (): Promise<void> => {
    try {
        await mongoose.disconnect();
        logger.info('MongoDB disconnected');

        if (neo4jDriver) {
            await neo4jDriver.close();
            logger.info('Neo4j disconnected');
        }
    } catch (error) {
        logger.error('Error closing connections:', error);
    }
};

// Mongoose event handlers
mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
});
