export type MapDef = {
  name: string;
  grid: number[][];
};

// Cell codes:
//  0 = empty (hole)
//  1 = tile (floor)
//  2 = start (block spawns standing here)
//  3 = goal (block must stand here to win)
// grid[y][x] — y=0 is the top row (north), x=0 is left.

export const MAPS: MapDef[] = [
  {
    name: 'first-roll',
    grid: [
      [0, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 0],
      [0, 2, 1, 1, 3, 0],
      [0, 1, 1, 1, 1, 0],
    ],
  },
  {
    name: 'narrow-bridge',
    grid: [
      [0, 0, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 2, 1, 1, 1, 3, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0],
    ],
  },
  {
    name: 'L-turn',
    grid: [
      [0, 1, 1, 1, 0, 0],
      [0, 2, 1, 1, 0, 0],
      [0, 0, 0, 1, 0, 0],
      [0, 0, 0, 1, 1, 0],
      [0, 0, 0, 1, 3, 0],
      [0, 0, 0, 1, 1, 0],
    ],
  },
  {
    name: 'split-paths',
    grid: [
      [0, 1, 1, 1, 1, 1, 0],
      [0, 1, 0, 0, 0, 1, 0],
      [0, 2, 0, 0, 0, 3, 0],
      [0, 1, 0, 0, 0, 1, 0],
      [0, 1, 1, 1, 1, 1, 0],
    ],
  },
  {
    name: 'long-walk',
    grid: [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 2, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 3, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },
];

export function pickRandomMap(exclude?: MapDef): MapDef {
  if (MAPS.length === 1) return MAPS[0];
  let pick: MapDef;
  do {
    pick = MAPS[Math.floor(Math.random() * MAPS.length)];
  } while (pick === exclude);
  return pick;
}

export function findStart(map: MapDef): { x: number; y: number } {
  for (let y = 0; y < map.grid.length; y++) {
    for (let x = 0; x < map.grid[y].length; x++) {
      if (map.grid[y][x] === 2) return { x, y };
    }
  }
  throw new Error(`Map ${map.name} has no start (2) cell`);
}

export function findGoal(map: MapDef): { x: number; y: number } {
  for (let y = 0; y < map.grid.length; y++) {
    for (let x = 0; x < map.grid[y].length; x++) {
      if (map.grid[y][x] === 3) return { x, y };
    }
  }
  throw new Error(`Map ${map.name} has no goal (3) cell`);
}

export function isSolid(map: MapDef, x: number, y: number): boolean {
  const row = map.grid[y];
  if (!row) return false;
  const c = row[x];
  return c === 1 || c === 2 || c === 3;
}

export function isGoal(map: MapDef, x: number, y: number): boolean {
  const row = map.grid[y];
  if (!row) return false;
  return row[x] === 3;
}
