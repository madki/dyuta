import * as THREE from 'three';
import { type MapDef, findGoal } from './maps';
import { makeTileTexture, makeGoalTexture } from './textures';

const TILE_THICKNESS = 0.2;

export type Board = {
  group: THREE.Group;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number; cx: number; cz: number };
  dispose: () => void;
};

export function buildBoard(map: MapDef): Board {
  const group = new THREE.Group();

  const tileGeo = new THREE.BoxGeometry(1, TILE_THICKNESS, 1);
  // Offset so the top face sits at y = 0.
  tileGeo.translate(0, -TILE_THICKNESS / 2, 0);

  const tileMat = new THREE.MeshStandardMaterial({
    map: makeTileTexture(),
    roughness: 0.85,
    metalness: 0.0,
  });
  const goalMat = new THREE.MeshStandardMaterial({
    map: makeGoalTexture(),
    roughness: 0.7,
    metalness: 0.0,
  });

  let count = 0;
  for (const row of map.grid) {
    for (const c of row) {
      if (c === 1 || c === 2 || c === 3) count++;
    }
  }

  const inst = new THREE.InstancedMesh(tileGeo, tileMat, count - 1); // -1 because goal gets its own mesh
  inst.receiveShadow = true;

  const goal = findGoal(map);
  const goalMesh = new THREE.Mesh(tileGeo, goalMat);
  goalMesh.receiveShadow = true;
  goalMesh.position.set(goal.x + 0.5, 0, goal.y + 0.5);

  const dummy = new THREE.Object3D();
  let i = 0;
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let y = 0; y < map.grid.length; y++) {
    for (let x = 0; x < map.grid[y].length; x++) {
      const c = map.grid[y][x];
      if (c !== 1 && c !== 2 && c !== 3) continue;
      const wx = x + 0.5, wz = y + 0.5;
      if (wx - 0.5 < minX) minX = wx - 0.5;
      if (wx + 0.5 > maxX) maxX = wx + 0.5;
      if (wz - 0.5 < minZ) minZ = wz - 0.5;
      if (wz + 0.5 > maxZ) maxZ = wz + 0.5;
      if (c === 3) continue;
      dummy.position.set(wx, 0, wz);
      dummy.updateMatrix();
      inst.setMatrixAt(i++, dummy.matrix);
    }
  }
  inst.instanceMatrix.needsUpdate = true;

  group.add(inst);
  group.add(goalMesh);

  const bounds = {
    minX, maxX, minZ, maxZ,
    cx: (minX + maxX) / 2,
    cz: (minZ + maxZ) / 2,
  };

  return {
    group,
    bounds,
    dispose: () => {
      tileGeo.dispose();
      tileMat.map?.dispose();
      tileMat.dispose();
      goalMat.map?.dispose();
      goalMat.dispose();
    },
  };
}
