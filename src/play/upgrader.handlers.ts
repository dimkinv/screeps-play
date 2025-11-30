import { CreepWrapper } from "../lib/creep-wrapper";

export function upgradeControllerFromSource(c: CreepWrapper) {
    const controller = c.findClosest('controller');
    const source = c.findClosest('source');

    if (controller && c.isNear(controller) && !c.storage.isEmpty()) {
        c.upgradeController(controller);
        return;
    }

    if (controller && c.storage.isFull()) {
        c.moveCloseTo(controller);
        return;
    }

    if (source && c.moveCloseTo(source) === OK && !c.storage.isFull()) {
        c.storage.harvest(source);
        return;
    }
}