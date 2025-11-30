import { CreepWrapper } from "../lib/creep-wrapper";

export function buildClosestConstructionSite(c: CreepWrapper): void {
    const closestSite = c.findClosest('constructionSite');
    if (closestSite && !c.storage.isEmpty() && c.isNear(closestSite)) {
        c.build(closestSite);
        return;
    }

    const source = c.findClosest('source');
    if(source && c.moveCloseTo(source) === OK && !c.storage.isFull()) {
        c.storage.harvest(source);
        return;
    }

    if (closestSite && c.storage.isFull()) {
        c.moveCloseTo(closestSite);
        return;
    }
}
