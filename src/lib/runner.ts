import { CreepWrapper } from './creep-wrapper';

/**
 * Enumerates known creep roles available to the runner.
 */
export enum CreepType {
  Harvester = 'Harvester',
  Upgrader = 'Upgrader',
}

interface TrackedCreepMemory extends CreepMemory {
  role?: CreepType;
  level?: number;
}

/**
 * Orchestrates creep lifecycle and iteration for a single room.
 */
export class Runner {
  private readonly roomName: string;

  private readonly creepWrappers = new Map<string, CreepWrapper>();

  private readonly bodyDefinitions = new Map<string, BodyPartConstant[]>();

  /**
   * Create a new runner that manages creeps for a specific room.
   *
   * @param roomName - The name of the room the runner should operate in.
   */
  constructor(roomName: string) {
    this.roomName = roomName;
    this.registerDefaultBodies();
  }

  /**
   * Ensure a desired population of a creep type and level exists for the runner's room.
   *
   * @param creepType - The target creep type to maintain.
   * @param creepLevel - The level of the creep build to maintain.
   * @param targetNumber - The desired number of creeps of the type and level.
   */
  public maintainCreepPopulation(creepType: CreepType, creepLevel: number, targetNumber: number): void {
    const body = this.resolveBody(creepType, creepLevel);
    const creeps = this.collectCreeps(creepType, creepLevel);

    if (creeps.length < targetNumber) {
      const spawn = this.findAvailableSpawn();
      if (spawn) {
        const memory: TrackedCreepMemory = { role: creepType, level: creepLevel, room: this.roomName };
        const creepName = `${creepType}-${creepLevel}-${Game.time}`;
        spawn.spawnCreep(body, creepName, { memory });
      }
    }

    this.refreshWrapperCache(creeps, creepType, creepLevel);
  }

  /**
   * Iterate over all cached creeps of a given type and optional level, invoking a handler for each.
   *
   * @param creepType - The type of creep to iterate over.
   * @param creepLevel - Optional specific level of the creep build to target. If omitted, all levels are included.
   * @param handler - Callback invoked with the creep wrapper for each matching creep.
   */
  public forEachCreepOfType(
    creepType: CreepType,
    creepLevel: number | undefined,
    handler: (creep: CreepWrapper) => void,
  ): void {
    for (const wrapper of this.creepWrappers.values()) {
      const memory = wrapper.getMemory() as TrackedCreepMemory;
      if (memory.role !== creepType) {
        continue;
      }

      if (creepLevel !== undefined && memory.level !== creepLevel) {
        continue;
      }

      handler(wrapper);
    }
  }

  private collectCreeps(creepType: CreepType, creepLevel: number): Creep[] {
    return Object.values(Game.creeps).filter((creep) => {
      const memory = creep.memory as TrackedCreepMemory;
      return creep.room?.name === this.roomName && memory.role === creepType && memory.level === creepLevel;
    });
  }

  private refreshWrapperCache(creeps: Creep[], creepType: CreepType, creepLevel: number): void {
    const existingNames = new Set(creeps.map((creep) => creep.name));

    for (const [name, wrapper] of this.creepWrappers) {
      const memory = wrapper.getMemory() as TrackedCreepMemory;
      if (memory.role === creepType && memory.level === creepLevel && !existingNames.has(name)) {
        this.creepWrappers.delete(name);
      }
    }

    for (const creep of creeps) {
      if (!this.creepWrappers.has(creep.name)) {
        this.creepWrappers.set(creep.name, new CreepWrapper(creep));
      }
    }
  }

  private findAvailableSpawn(): StructureSpawn | undefined {
    return Object.values(Game.spawns).find((spawn) => spawn.room?.name === this.roomName && !spawn.spawning);
  }

  private resolveBody(creepType: CreepType, creepLevel: number): BodyPartConstant[] {
    const key = this.createBodyKey(creepType, creepLevel);
    const body = this.bodyDefinitions.get(key);
    if (!body) {
      throw new Error(`No body definition found for type ${creepType} at level ${creepLevel}`);
    }

    return body;
  }

  private createBodyKey(creepType: CreepType, creepLevel: number): string {
    return `${creepType}-${creepLevel}`;
  }

  private registerDefaultBodies(): void {
    this.bodyDefinitions.set(this.createBodyKey(CreepType.Harvester, 1), ['work', 'carry', 'move']);
    this.bodyDefinitions.set(this.createBodyKey(CreepType.Harvester, 2), ['work', 'work', 'carry', 'move', 'move']);
    this.bodyDefinitions.set(this.createBodyKey(CreepType.Harvester, 3), ['work', 'work', 'work', 'carry', 'carry', 'move', 'move']);
    this.bodyDefinitions.set(this.createBodyKey(CreepType.Upgrader, 1), ['work', 'carry', 'move']);
  }
}
