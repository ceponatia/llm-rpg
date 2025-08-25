import { Driver } from 'neo4j-driver';
/**
 * Database manager interface for dependency injection
 * Ensures all memory layers can access required database connections
 */
export interface IDatabaseManager {
    /**
     * Get Neo4j driver for graph operations
     */
    getDriver(): Driver;
    /**
     * Get FAISS index for vector operations
     */
    getFaissIndex(): unknown;
    /**
     * Save FAISS index to disk
     */
    saveFaissIndex(): Promise<void>;
}
