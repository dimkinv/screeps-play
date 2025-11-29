/**
 * CreepWrapper - a higher-level wrapper around the Screeps `Creep` object.
 *
 * This module provides a small wrapper abstraction with convenience helper methods
 * for common tasks. It is intentionally minimal at first and will be expanded as
 * the project grows.
 */

export type FindTargetType = 'source' | 'enemy' | 'controller' | 'spawn';


/**
 * Lightweight wrapper around a Screeps creep instance.
 *
 * @param creep - The Screeps `Creep` instance to wrap

*/
export class CreepWrapper {
  private readonly creep: Creep;

  /**
   * Create a new wrapper for the provided creep.
   *
   * @param creep - The Screeps creep to wrap.
   */
  constructor(creep: Creep) {
    this.creep = creep;
  }

  /**
   * Find the closest object of the provided type to the creep.
   *
   * Supported types: `source`, `enemy`, `controller`, `spawn`.
   *
   * For `controller`, the wrapper returns the room controller (if one exists);
   * for the other types it uses `findClosestByPath` and standard Screeps FIND_* constants.
   *
   * @param type - The type of object to search for
   * @returns The closest matching game object, or `null` if none found.
   */
  public findClosest(type: FindTargetType): Source | Creep | StructureController | AnyStructure | null {
    switch (type) {
      case 'source':
        // Surround in try/catch to avoid runtime errors during unit tests (if constants not loaded)
        try {
          return this.creep.pos.findClosestByPath(FIND_SOURCES) ?? null;
        } catch (e) {
          return null;
        }
      case 'enemy':
        try {
          return this.creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS) ?? null;
        } catch (e) {
          return null;
        }
      case 'controller':
        // Each room can have at most one controller; return it when present
        return this.creep.room.controller ?? null;
      case 'spawn':
        try {
          return (
            this.creep.pos.findClosestByPath(FIND_STRUCTURES, {
              filter: (s: Structure) => s.structureType === STRUCTURE_SPAWN,
            }) ?? null
          );
        } catch (e) {
          return null;
        }
      default:
        // If an unsupported type is passed, return null.
        return null;
    }
  }

  /**  
   * Get the wrapped creep instance.
   *
   * @returns The underlying Screeps creep.
   */
  public getCreep(): Creep {
    return this.creep;
  }

  /**
   * Retrieve the creep's memory object.
   *
   * @returns The memory associated with the creep.
   */
  public getMemory(): CreepMemory {
    return this.creep.memory;
  }

  /**
   * Accessor for the creep's unique name.
   *
   * @returns The name of the creep.
   */
  public getName(): string {
    return this.creep.name;
  }
}

