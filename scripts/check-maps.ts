import { MAPS, findStart, findGoal, isSolid, type MapDef } from '../src/game/maps';
import { roll, footprint, type BlockState } from '../src/game/block';

function solve(map: MapDef): { ok: boolean; moves: number } {
  const start = findStart(map);
  const goal = findGoal(map);
  const startState: BlockState = { o: 'up', x: start.x, y: start.y };
  const key = (s: BlockState) => `${s.o},${s.x},${s.y}`;
  const dist = new Map<string, number>();
  dist.set(key(startState), 0);
  const queue: BlockState[] = [startState];
  while (queue.length) {
    const s = queue.shift()!;
    if (s.o === 'up' && s.x === goal.x && s.y === goal.y) {
      return { ok: true, moves: dist.get(key(s))! };
    }
    for (const dir of ['up', 'down', 'left', 'right'] as const) {
      const r = roll(s, dir);
      const cells = footprint(r.newState);
      if (!cells.every((c) => isSolid(map, c.x, c.y))) continue;
      const k = key(r.newState);
      if (!dist.has(k)) {
        dist.set(k, dist.get(key(s))! + 1);
        queue.push(r.newState);
      }
    }
  }
  return { ok: false, moves: -1 };
}

let allOk = true;
for (const m of MAPS) {
  const { ok, moves } = solve(m);
  if (ok) {
    console.log(`✓ ${m.name.padEnd(20)} solvable in ${moves} moves`);
  } else {
    console.log(`✗ ${m.name.padEnd(20)} UNSOLVABLE`);
    allOk = false;
  }
}
process.exit(allOk ? 0 : 1);
