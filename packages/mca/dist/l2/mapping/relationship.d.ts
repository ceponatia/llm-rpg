import { RelationshipEdge } from '@rpg/types';
interface Neo4jRecordLike {
    get(key: string): unknown;
}
export declare function mapRecordToRelationship(record: Neo4jRecordLike): RelationshipEdge;
export {};
