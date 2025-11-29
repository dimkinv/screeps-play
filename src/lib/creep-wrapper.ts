/**
 * CreepWrapper - a higher-level wrapper around the Screeps `Creep` object.
 *
 * This module provides a small wrapper abstraction with convenience helper methods
 * for common tasks. It is intentionally minimal at first and will be expanded as
 * the project grows.
 */

export type FindTargetType = 'source' | 'enemy' | 'controller' | 'spawn';

/**
 * A minimal, higher-level wrapper that offers utility functions for a `Creep`.
 */
export class CreepWrapper {
  /** The underlying Screeps `Creep` instance */
  readonly creep: Creep;

  /**
   * Create a new wrapper for a creep.
   *
   * @param creep - The Screeps `Creep` instance to wrap
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
  public findClosest(type: FindTargetType): RoomObject | null {
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
}

// Convenience default export for easy consumption in `play` code
export default CreepWrapper;
