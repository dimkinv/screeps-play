// import { CreepType, Runner } from "../lib/runner";
// import { buildClosestConstructionSite } from "./builder.handlers";
// import { upgradeControllerFromSource } from "./upgrader.handlers";

// const runner = new Runner('W23S22');
// runner.maintainCreepPopulation(CreepType.Harvester, 1, 2);
// runner.maintainCreepPopulation(CreepType.Upgrader, 1, 3);
// runner.maintainCreepPopulation(CreepType.Builder, 1, 2);

// runner.forEachCreepOfType(CreepType.Harvester, 1, c => {
//     const source = c.findClosest('source');
//     if (!source) {
//         return;
//     }

//     if (c.moveCloseTo(source) === OK && !c.storage.isFull()) {
//         c.storage.harvest(source);
//         return;
//     }

//     if (c.storage.isFull() || source.energy === 0) {
//         const spawn = c.findClosest('spawn');
//         if (!spawn) {
//             return;
//         }

//         if (c.moveCloseTo(spawn) === OK) {
//             c.storage.transfer(spawn, c.storage.getEnergy());
//         }
//     }
// });

// runner.forEachCreepOfType(CreepType.Upgrader, 1, upgradeControllerFromSource);
// runner.forEachCreepOfType(CreepType.Builder, 1, buildClosestConstructionSite);