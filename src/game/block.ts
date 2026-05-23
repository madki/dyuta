import * as THREE from 'three';

export type Orientation = 'up' | 'x' | 'z';
// 'up' = standing (1x1 footprint, 2 tall)
// 'x'  = lying along X axis (footprint 2 wide in x, 1 in z)
// 'z'  = lying along Z axis (footprint 1 in x, 2 in z)

export type Dir = 'left' | 'right' | 'up' | 'down';
// In grid space: +x = right, +y = down (south). World maps: +X = right, +Z = south.

export type BlockState = {
  o: Orientation;
  // Anchor cell: for 'up' it's the single cell. For 'x' it's the WEST cell. For 'z' it's the NORTH cell.
  x: number;
  y: number;
};

export type Roll = {
  newState: BlockState;
  // Pivot world position (edge on the ground that the block rotates around).
  pivot: THREE.Vector3;
  // Axis of rotation in world space.
  axis: THREE.Vector3;
  // Final angle (always +PI/2 when going through a quarter-turn).
  angle: number;
};

// Returns the cells the block currently occupies.
export function footprint(s: BlockState): { x: number; y: number }[] {
  if (s.o === 'up') return [{ x: s.x, y: s.y }];
  if (s.o === 'x') return [{ x: s.x, y: s.y }, { x: s.x + 1, y: s.y }];
  return [{ x: s.x, y: s.y }, { x: s.x, y: s.y + 1 }];
}

// Computes the next state and pivot/axis for a roll in the given direction.
// World convention: x cell-coord -> +X world. y cell-coord -> +Z world.
// Tile top is at y=0, tile thickness extends below.
export function roll(s: BlockState, dir: Dir): Roll {
  let newState: BlockState;
  const pivot = new THREE.Vector3();
  const axis = new THREE.Vector3();

  if (s.o === 'up') {
    if (dir === 'right') {
      newState = { o: 'x', x: s.x + 1, y: s.y };
      pivot.set(s.x + 1, 0, s.y + 0.5);
      axis.set(0, 0, -1); // rotate around -Z to tip over toward +X
    } else if (dir === 'left') {
      newState = { o: 'x', x: s.x - 2, y: s.y };
      pivot.set(s.x, 0, s.y + 0.5);
      axis.set(0, 0, 1);
    } else if (dir === 'down') {
      newState = { o: 'z', x: s.x, y: s.y + 1 };
      pivot.set(s.x + 0.5, 0, s.y + 1);
      axis.set(1, 0, 0);
    } else {
      newState = { o: 'z', x: s.x, y: s.y - 2 };
      pivot.set(s.x + 0.5, 0, s.y);
      axis.set(-1, 0, 0);
    }
  } else if (s.o === 'x') {
    // Lying along X: occupies (x, y) and (x+1, y). Standing footprint is on the
    // ground in z = y..y+1 strip, x = x..x+2 strip.
    if (dir === 'right') {
      newState = { o: 'up', x: s.x + 2, y: s.y };
      pivot.set(s.x + 2, 0, s.y + 0.5);
      axis.set(0, 0, -1);
    } else if (dir === 'left') {
      newState = { o: 'up', x: s.x - 1, y: s.y };
      pivot.set(s.x, 0, s.y + 0.5);
      axis.set(0, 0, 1);
    } else if (dir === 'down') {
      // Roll forward (south) — stays lying along X, moves one cell in +y.
      newState = { o: 'x', x: s.x, y: s.y + 1 };
      pivot.set(s.x + 1, 0, s.y + 1);
      axis.set(1, 0, 0);
    } else {
      newState = { o: 'x', x: s.x, y: s.y - 1 };
      pivot.set(s.x + 1, 0, s.y);
      axis.set(-1, 0, 0);
    }
  } else {
    // Lying along Z: occupies (x, y) and (x, y+1).
    if (dir === 'down') {
      newState = { o: 'up', x: s.x, y: s.y + 2 };
      pivot.set(s.x + 0.5, 0, s.y + 2);
      axis.set(1, 0, 0);
    } else if (dir === 'up') {
      newState = { o: 'up', x: s.x, y: s.y - 1 };
      pivot.set(s.x + 0.5, 0, s.y);
      axis.set(-1, 0, 0);
    } else if (dir === 'right') {
      newState = { o: 'z', x: s.x + 1, y: s.y };
      pivot.set(s.x + 1, 0, s.y + 1);
      axis.set(0, 0, -1);
    } else {
      newState = { o: 'z', x: s.x - 1, y: s.y };
      pivot.set(s.x, 0, s.y + 1);
      axis.set(0, 0, 1);
    }
  }

  return { newState, pivot, axis, angle: Math.PI / 2 };
}

// Positions and resets the mesh's transform to match a static (non-rolling) state.
// The mesh geometry is a 1x1x2 box centered at origin. We orient & place it.
export function applyStateToMesh(mesh: THREE.Object3D, s: BlockState) {
  mesh.rotation.set(0, 0, 0);
  mesh.position.set(0, 0, 0);
  if (s.o === 'up') {
    // Standing: 2-tall axis = Y. Geometry already has long axis = Y.
    mesh.position.set(s.x + 0.5, 1.0, s.y + 0.5);
  } else if (s.o === 'x') {
    // Lying along X: rotate 90° around Z so the long axis (originally Y) points along X.
    mesh.rotation.z = Math.PI / 2;
    mesh.position.set(s.x + 1.0, 0.5, s.y + 0.5);
  } else {
    // Lying along Z: rotate 90° around X.
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(s.x + 0.5, 0.5, s.y + 1.0);
  }
}
