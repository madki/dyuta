import * as THREE from 'three';
import { createEngine } from './engine';
import { buildBoard } from './board';
import {
  applyStateToMesh,
  footprint,
  roll,
  type BlockState,
  type Dir,
} from './block';
import { attachInput } from './input';
import { MAPS, type MapDef, findStart, isGoal, isSolid, pickRandomMap } from './maps';
import { makeBlockTexture } from './textures';

const ROLL_MS = 170;
const RESET_DELAY_MS = 600;
const WIN_DELAY_MS = 700;

export async function mount(container: HTMLElement): Promise<() => void> {
  const engine = createEngine(container);

  // Block mesh: 1×1×2 box, long axis along Y.
  const blockGeo = new THREE.BoxGeometry(1, 2, 1);
  const blockMat = new THREE.MeshStandardMaterial({
    map: makeBlockTexture(),
    roughness: 0.6,
    metalness: 0.05,
  });
  const blockMesh = new THREE.Mesh(blockGeo, blockMat);
  blockMesh.castShadow = true;
  blockMesh.receiveShadow = false;

  // Pivot is the parent that we rotate to animate rolling.
  const pivot = new THREE.Object3D();
  pivot.add(blockMesh);
  engine.scene.add(pivot);

  let currentMap: MapDef = pickRandomMap();
  let board = buildBoard(currentMap);
  engine.scene.add(board.group);

  let state: BlockState = { o: 'up', ...findStart(currentMap) };
  applyStateToMesh(blockMesh, state);
  pivot.position.set(0, 0, 0);
  pivot.rotation.set(0, 0, 0);

  const frameToBoard = () => {
    const { cx, cz, maxX, minX, maxZ, minZ } = board.bounds;
    const span = Math.max(maxX - minX, maxZ - minZ);
    engine.frameBoard(cx, cz, span);
  };

  const resize = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    engine.setSize(w, h);
    frameToBoard();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  type Anim =
    | { kind: 'idle' }
    | { kind: 'roll'; t: number; dur: number; axis: THREE.Vector3; pivotPos: THREE.Vector3; angle: number; newState: BlockState }
    | { kind: 'fall'; t: number; dur: number; axis: THREE.Vector3; pivotPos: THREE.Vector3; angle: number }
    | { kind: 'win'; t: number; dur: number }
    | { kind: 'wait'; t: number; dur: number; next: () => void };

  let anim: Anim = { kind: 'idle' };
  let loadingNext = false;

  const loadMap = (m: MapDef) => {
    // Tear down old board
    engine.scene.remove(board.group);
    board.dispose();
    board = buildBoard(m);
    engine.scene.add(board.group);
    currentMap = m;
    state = { o: 'up', ...findStart(m) };
    // Reset transforms
    pivot.position.set(0, 0, 0);
    pivot.rotation.set(0, 0, 0);
    blockMesh.position.set(0, 0, 0);
    blockMesh.rotation.set(0, 0, 0);
    applyStateToMesh(blockMesh, state);
    frameToBoard();
    anim = { kind: 'idle' };
  };

  const reparentForPivot = (newPivot: THREE.Vector3) => {
    // Capture the mesh's current world position BEFORE we move the pivot.
    const worldBefore = new THREE.Vector3();
    blockMesh.getWorldPosition(worldBefore);
    pivot.position.copy(newPivot);
    pivot.rotation.set(0, 0, 0);
    // Mesh local position so its world position is unchanged.
    blockMesh.position.copy(worldBefore).sub(pivot.position);
  };

  const startRoll = (dir: Dir) => {
    if (anim.kind !== 'idle') return;
    const r = roll(state, dir);
    reparentForPivot(r.pivot);
    anim = {
      kind: 'roll',
      t: 0,
      dur: ROLL_MS / 1000,
      axis: r.axis.clone().normalize(),
      pivotPos: r.pivot.clone(),
      angle: r.angle,
      newState: r.newState,
    };
  };

  const startFall = (dir: Dir) => {
    const r = roll(state, dir);
    reparentForPivot(r.pivot);
    anim = {
      kind: 'fall',
      t: 0,
      dur: 0.45,
      axis: r.axis.clone().normalize(),
      pivotPos: r.pivot.clone(),
      angle: Math.PI / 2 + 0.6,
    };
  };

  const checkFallDirection = (s: BlockState): Dir | null => {
    // Determine which way the block falls if any footprint cell is unsupported.
    const cells = footprint(s);
    const supported = cells.every((c) => isSolid(currentMap, c.x, c.y));
    if (supported) return null;
    if (s.o === 'up') {
      // Single cell, fall in some arbitrary direction
      return 'down';
    }
    if (s.o === 'x') {
      // Cells: (x, y) west, (x+1, y) east. Whichever is unsupported, fall that way.
      const wEast = isSolid(currentMap, s.x + 1, s.y);
      const wWest = isSolid(currentMap, s.x, s.y);
      if (!wEast && wWest) return 'right';
      if (!wWest && wEast) return 'left';
      return 'down';
    }
    // 'z': (x, y) north, (x, y+1) south.
    const wSouth = isSolid(currentMap, s.x, s.y + 1);
    const wNorth = isSolid(currentMap, s.x, s.y);
    if (!wSouth && wNorth) return 'down';
    if (!wNorth && wSouth) return 'up';
    return 'down';
  };

  const onMove = (dir: Dir) => {
    startRoll(dir);
  };
  const detachInput = attachInput(container, onMove);

  engine.start((dt) => {
    if (anim.kind === 'roll') {
      anim.t += dt;
      const u = Math.min(1, anim.t / anim.dur);
      // Ease-out for a satisfying thunk
      const eased = 1 - Math.pow(1 - u, 2);
      pivot.rotation.set(0, 0, 0);
      pivot.rotateOnWorldAxis(anim.axis, anim.angle * eased);
      if (u >= 1) {
        // Commit state and reset pivot
        state = anim.newState;
        pivot.position.set(0, 0, 0);
        pivot.rotation.set(0, 0, 0);
        blockMesh.position.set(0, 0, 0);
        blockMesh.rotation.set(0, 0, 0);
        applyStateToMesh(blockMesh, state);

        // Check win or fall
        if (state.o === 'up' && isGoal(currentMap, state.x, state.y)) {
          anim = { kind: 'win', t: 0, dur: WIN_DELAY_MS / 1000 };
        } else {
          const fallDir = checkFallDirection(state);
          if (fallDir) {
            startFall(fallDir);
          } else {
            anim = { kind: 'idle' };
          }
        }
      }
    } else if (anim.kind === 'fall') {
      anim.t += dt;
      const u = Math.min(1, anim.t / anim.dur);
      const eased = u * u; // accelerate
      pivot.rotation.set(0, 0, 0);
      pivot.rotateOnWorldAxis(anim.axis, anim.angle * eased);
      // Drop the pivot itself for a sense of falling off-screen
      const drop = -6 * Math.pow(u, 3);
      pivot.position.y = drop;
      if (u >= 1) {
        anim = {
          kind: 'wait',
          t: 0,
          dur: RESET_DELAY_MS / 1000,
          next: () => loadMap(currentMap),
        };
      }
    } else if (anim.kind === 'win') {
      anim.t += dt;
      const u = Math.min(1, anim.t / anim.dur);
      // Sink the block into the goal hole
      blockMesh.position.y = -2 * u * u;
      if (u >= 1 && !loadingNext) {
        loadingNext = true;
        const next = pickRandomMap(currentMap);
        loadMap(next);
        loadingNext = false;
      }
    } else if (anim.kind === 'wait') {
      anim.t += dt;
      if (anim.t >= anim.dur) {
        const next = anim.next;
        anim = { kind: 'idle' };
        next();
      }
    }
  });

  // Initial fall check (in case start cell is somehow malformed)
  if (checkFallDirection(state)) {
    console.warn('Start cell of map', currentMap.name, 'is unsupported.');
  }

  // Touch maps for the cache (Vite may not be aware otherwise)
  void MAPS;

  return () => {
    detachInput();
    ro.disconnect();
    engine.scene.remove(pivot);
    engine.scene.remove(board.group);
    board.dispose();
    blockGeo.dispose();
    blockMat.map?.dispose();
    blockMat.dispose();
    engine.dispose();
  };
}
