import * as test from '../lib/test';

// Example runtime: iterate over all creeps and run the simple wrapper example.
for (const name in Game.creeps) {
	const creep = Game.creeps[name];
	if (!creep) continue;
	test.runWrapperExample(creep);
}
