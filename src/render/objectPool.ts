/**
 * Object Pool - Réduction de la pression GC
 * Réutilise les objets pour éviter les allocations
 */

// =============================================================================
// POOLS
// =============================================================================

const SET_POOL: Set<string>[] = [];
const ARRAY_POOL: any[][] = [];
const OBJECT_POOL: Array<{ node: any; hops: number; distance: number }> = [];

const MAX_POOL_SIZE = 10;

// =============================================================================
// SET POOL
// =============================================================================

export function acquireSet(): Set<string> {
  if (SET_POOL.length > 0) {
    const set = SET_POOL.pop()!;
    set.clear();
    return set;
  }
  return new Set<string>();
}

export function releaseSet(set: Set<string>): void {
  if (SET_POOL.length < MAX_POOL_SIZE) {
    set.clear();
    SET_POOL.push(set);
  }
}

// =============================================================================
// ARRAY POOL
// =============================================================================

export function acquireArray<T>(): T[] {
  if (ARRAY_POOL.length > 0) {
    const arr = ARRAY_POOL.pop()!;
    arr.length = 0;
    return arr as T[];
  }
  return [];
}

export function releaseArray<T>(arr: T[]): void {
  if (ARRAY_POOL.length < MAX_POOL_SIZE) {
    arr.length = 0;
    ARRAY_POOL.push(arr);
  }
}

// =============================================================================
// OBJECT POOL (pour BFS queue)
// =============================================================================

export interface BFSNode {
  node: any;
  hops: number;
  distance: number;
}

export function acquireBFSNode(node: any, hops: number, distance: number): BFSNode {
  if (OBJECT_POOL.length > 0) {
    const obj = OBJECT_POOL.pop()!;
    obj.node = node;
    obj.hops = hops;
    obj.distance = distance;
    return obj;
  }
  return { node, hops, distance };
}

export function releaseBFSNode(obj: BFSNode): void {
  if (OBJECT_POOL.length < MAX_POOL_SIZE) {
    obj.node = null;
    OBJECT_POOL.push(obj);
  }
}
