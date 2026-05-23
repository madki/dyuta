import * as THREE from 'three';

export type Engine = {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;
  setSize: (w: number, h: number) => void;
  frameBoard: (cx: number, cz: number, span: number) => void;
  start: (onFrame: (dt: number) => void) => void;
  dispose: () => void;
};

export function createEngine(container: HTMLElement): Engine {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 200);
  // Isometric-ish angle
  camera.position.set(20, 25, 25);
  camera.lookAt(0, 0, 0);

  const ambient = new THREE.AmbientLight(0xfff3e0, 0.55);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xfff0d6, 1.1);
  sun.position.set(8, 18, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 60;
  sun.shadow.camera.left = -15;
  sun.shadow.camera.right = 15;
  sun.shadow.camera.top = 15;
  sun.shadow.camera.bottom = -15;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  // Soft fill from below to keep the underside of the block readable
  const fill = new THREE.HemisphereLight(0x404868, 0x101018, 0.35);
  scene.add(fill);

  let width = 1, height = 1;
  let frameTarget = { cx: 0, cz: 0, span: 8 };

  const setSize = (w: number, h: number) => {
    width = w;
    height = h;
    renderer.setSize(w, h, false);
    updateCamera();
  };

  const updateCamera = () => {
    const aspect = width / height;
    // Show a square covering "span" world units, fit the smaller dimension.
    const halfH = frameTarget.span / 2;
    const halfW = halfH * aspect;
    camera.left = -halfW;
    camera.right = halfW;
    camera.top = halfH;
    camera.bottom = -halfH;
    camera.updateProjectionMatrix();
    // Re-aim at center
    const offset = new THREE.Vector3(20, 25, 25);
    camera.position.copy(offset).add(new THREE.Vector3(frameTarget.cx, 0, frameTarget.cz));
    camera.lookAt(frameTarget.cx, 0, frameTarget.cz);
  };

  const frameBoard = (cx: number, cz: number, span: number) => {
    frameTarget = { cx, cz, span: span + 2 };
    updateCamera();
  };

  let rafId = 0;
  let lastT = 0;
  let cb: ((dt: number) => void) | null = null;
  const loop = (t: number) => {
    rafId = requestAnimationFrame(loop);
    const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0;
    lastT = t;
    if (cb) cb(dt);
    renderer.render(scene, camera);
  };

  const start = (onFrame: (dt: number) => void) => {
    cb = onFrame;
    rafId = requestAnimationFrame(loop);
  };

  return {
    scene,
    camera,
    renderer,
    setSize,
    frameBoard,
    start,
    dispose: () => {
      cancelAnimationFrame(rafId);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
