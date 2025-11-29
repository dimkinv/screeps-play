// Minimal Screeps type definitions for local development without the official @types/screeps package.
type BodyPartConstant = string;
type ScreepsReturnCode = number;

interface CreepMemory {
  [name: string]: unknown;
  role?: string;
  level?: number;
  room?: string;
}

interface CreepRoom {
  name: string;
  controller: StructureController | null;
}

interface Creep {
  name: string;
  memory: CreepMemory;
  room: CreepRoom;
}

interface SpawnOptions {
  memory?: CreepMemory;
  dryRun?: boolean;
}

interface StructureSpawn {
  room: CreepRoom;
  spawning: unknown;
  spawnCreep(body: BodyPartConstant[], name: string, options?: SpawnOptions): ScreepsReturnCode;
}

declare const Game: {
  creeps: Record<string, Creep>;
  spawns: Record<string, StructureSpawn>;
  time: number;
};

declare const OK: ScreepsReturnCode;
