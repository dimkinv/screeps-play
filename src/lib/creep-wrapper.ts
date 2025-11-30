/**
 * CreepWrapper - a higher-level wrapper around the Screeps `Creep` object.
 *
 * This module provides a small wrapper abstraction with convenience helper methods
 * for common tasks. It is intentionally minimal at first and will be expanded as
 * the project grows.
 */

export type FindTargetType = 'source' | 'enemy' | 'controller' | 'spawn';

type FindTargetMap = {
  source: Source;
  enemy: Creep;
  controller: StructureController;
  spawn: StructureSpawn;
};

/**
 * Helper API for inspecting a creep's energy storage.
 */
type NativeTransferTarget = Parameters<Creep['transfer']>[0];
type EnergyTransferTarget = NativeTransferTarget | StructureSpawn;

export interface CreepEnergyStorage {
  /**
   * Determine whether the creep's energy store has no remaining free capacity.
   *
   * @returns `true` when the creep cannot carry additional energy, otherwise `false`.
   */
  isFull(): boolean;

  /**
   * Determine whether the creep's energy store is completely empty.
   *
   * @returns `true` when the energy store is empty, otherwise `false`.
   */
  isEmpty(): boolean;

  /**
   * Retrieve the current amount of energy held by the creep.
   *
   * @returns The amount of energy currently stored on the creep.
   */
  getEnergy(): number;

  /**
   * Retrieve the remaining free capacity for energy on the creep.
   *
   * @returns The free capacity (in energy units) that the creep can still carry.
   */
  getFreeCapacity(): number;

  /**
   * Retrieve the total energy capacity of the creep.
   *
   * @returns The maximum amount of energy the creep can store.
   */
  getCapacity(): number;

  /**
   * Compute how full the creep's energy store is as a normalized ratio.
   *
   * @returns A value between `0` (empty) and `1` (full) representing the fill level.
   */
  getFillRatio(): number;

  /**
   * Attempt to harvest energy from the supplied source.
   *
   * @param source - The energy source the creep should harvest from.
   * @returns The Screeps return code from the underlying `harvest` call.
   */
  harvest(source: Source): ScreepsReturnCode;

  /**
   * Attempt to pick up a dropped energy resource.
   *
   * @param resource - The dropped energy resource to collect.
   * @returns The Screeps return code from the underlying `pickup` call.
   */
  pickup(resource: Resource<RESOURCE_ENERGY>): ScreepsReturnCode;

  /**
   * Attempt to transfer energy from the creep to another target.
   *
   * @param target - The creep or structure that should receive the energy.
   * @param amount - Optional energy amount to transfer; defaults to as much as possible.
   * @returns The Screeps return code from the underlying `transfer` call.
   */
  transfer(target: EnergyTransferTarget, amount?: number): ScreepsReturnCode;
}

const DEFAULT_PATH_STYLE: PolyStyle = {
  stroke: '#ffaa00',
  lineStyle: 'solid',
  opacity: 0.4,
};


/**
 * Lightweight wrapper around a Screeps creep instance.
 *
 * @param creep - The Screeps `Creep` instance to wrap

*/
export class CreepWrapper {
  private readonly creep: Creep;
  /**
   * Exposes helpers for inspecting the creep's energy storage state.
   */
  public readonly storage: CreepEnergyStorage;

  /**
   * Create a new wrapper for the provided creep.
   *
   * @param creep - The Screeps creep to wrap.
   */
  constructor(creep: Creep) {
    this.creep = creep;
    this.storage = this.createStorageHelpers();
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
  public findClosest<TType extends FindTargetType>(type: TType): FindTargetMap[TType] | null {
    switch (type) {
      case 'source':
        // Surround in try/catch to avoid runtime errors during unit tests (if constants not loaded)
        try {
          return (this.creep.pos.findClosestByPath(FIND_SOURCES) ?? null) as FindTargetMap[TType] | null;
        } catch (e) {
          return null;
        }
      case 'enemy':
        try {
          return (this.creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS) ?? null) as FindTargetMap[TType] | null;
        } catch (e) {
          return null;
        }
      case 'controller':
        // Each room can have at most one controller; return it when present
        return (this.creep.room.controller ?? null) as FindTargetMap[TType] | null;
      case 'spawn':
        try {
          const spawn = this.creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (s: Structure) => s.structureType === STRUCTURE_SPAWN,
          });
          return ((spawn as StructureSpawn | null) ?? null) as FindTargetMap[TType] | null;
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

  /**
   * Move the creep so it stays within the specified range of the target position.
   *
   * @param target - The position or positional object to approach.
   * @param range - The desired distance from the target (default: 1 tile).
   * @param opts - Optional movement options forwarded to Screeps `moveTo`.
   * @returns The result code from the underlying `moveTo` call, or `OK` if already close enough.
   */
  public moveCloseTo(
    target: RoomPosition | { pos: RoomPosition },
    range: number = 1,
    opts?: MoveToOpts,
  ): CreepMoveReturnCode {
    const position = this.resolvePosition(target);
    const effectiveRange = Math.max(0, Math.floor(range));

    if (this.creep.pos.inRangeTo(position, effectiveRange)) {
      return OK;
    }

    const moveOpts: MoveToOpts = opts ? { ...opts } : {};
    if (moveOpts.range === undefined) {
      moveOpts.range = effectiveRange;
    }
    if (!moveOpts.visualizePathStyle) {
      moveOpts.visualizePathStyle = DEFAULT_PATH_STYLE;
    }

    return this.creep.moveTo(position, moveOpts);
  }

  /**
   * Move the creep toward the provided target position or coordinates.
   *
   * @param target - A RoomPosition, positional object, or explicit coordinates with room.
   * @param opts - Optional movement options forwarded to Screeps `moveTo`.
   * @returns The result code from the underlying `moveTo` call.
   */
  public moveTo(
    target: RoomPosition | { pos: RoomPosition } | { x: number; y: number; roomName: string },
    opts?: MoveToOpts,
  ): CreepMoveReturnCode {
    const position = this.resolvePosition(target);
    const moveOpts: MoveToOpts = opts ? { ...opts } : {};
    if (!moveOpts.visualizePathStyle) {
      moveOpts.visualizePathStyle = DEFAULT_PATH_STYLE;
    }

    return this.creep.moveTo(position, moveOpts);
  }

  /**
   * Attempt to upgrade the provided room controller using the creep's stored energy.
   *
   * @param controller - The room controller the creep should upgrade.
   * @returns The Screeps return code from the underlying `upgradeController` call.
   */
  public upgradeController(controller: StructureController): ScreepsReturnCode {
    return this.creep.upgradeController(controller);
  }

  /**
   * Determine whether the creep is within the specified range of the target.
   *
   * @param target - The position or positional object to compare against.
   * @param range - The maximum allowable distance from the target (default: 1 tile).
   * @returns `true` when the creep is within range, otherwise `false`.
   */
  public isNear(
    target: RoomPosition | { pos: RoomPosition } | { x: number; y: number; roomName: string },
    range: number = 1,
  ): boolean {
    const position = this.resolvePosition(target);
    const effectiveRange = Math.max(0, Math.floor(range));
    return this.creep.pos.inRangeTo(position, effectiveRange);
  }

  private resolvePosition(
    target: RoomPosition | { pos: RoomPosition } | { x: number; y: number; roomName: string },
  ): RoomPosition {
    if (target instanceof RoomPosition) {
      return target;
    }

    if ('pos' in target && target.pos instanceof RoomPosition) {
      return target.pos;
    }

    const coords = target as { x: number; y: number; roomName: string };
    return new RoomPosition(coords.x, coords.y, coords.roomName);
  }

  private createStorageHelpers(): CreepEnergyStorage {
    const getCapacity = (): number => this.creep.store.getCapacity(RESOURCE_ENERGY) ?? 0;
    const getEnergy = (): number => this.creep.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0;
    const getFree = (): number => this.creep.store.getFreeCapacity(RESOURCE_ENERGY) ?? 0;

    return {
      isFull: (): boolean => getFree() === 0 && getCapacity() > 0,
      isEmpty: (): boolean => getEnergy() === 0,
      getEnergy,
      getFreeCapacity: getFree,
      getCapacity,
      getFillRatio: (): number => {
        const capacity = getCapacity();
        if (capacity <= 0) {
          return 0;
        }
        return getEnergy() / capacity;
      },
      harvest: (source: Source): ScreepsReturnCode => this.creep.harvest(source),
      pickup: (resource: Resource<RESOURCE_ENERGY>): ScreepsReturnCode => this.creep.pickup(resource),
      transfer: (target: EnergyTransferTarget, amount?: number): ScreepsReturnCode =>
        this.creep.transfer(target as NativeTransferTarget, RESOURCE_ENERGY, amount),
    };
  }
}

