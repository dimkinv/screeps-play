/**
 * Lightweight wrapper around a Screeps creep instance.
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
