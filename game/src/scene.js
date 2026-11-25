// Copper Ladle Kitchen 3D — Three.js scene: renderer, camera, lights,
// the kitchen itself, and syncing meshes with the pure game state.
// No DOM here (HUD labels are positioned by main.js via project()).
import * as THREE from '../vendor/three.min.js';
import { INGREDIENTS, LOGICAL_HEIGHT, LOGICAL_WIDTH, POS } from './config.js';
import { buildBinStack, buildIngredientMesh } from './ingredients3d.js';

function std(color, roughness = 0.8, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function mesh(geo, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function createKitchenScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(LOGICAL_WIDTH, LOGICAL_HEIGHT, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#f7e8c9');

  const camera = new THREE.PerspectiveCamera(40, LOGICAL_WIDTH / LOGICAL_HEIGHT, 0.1, 100);
  camera.position.set(...POS.camera);
  camera.lookAt(new THREE.Vector3(...POS.cameraLookAt));

  // --- lights ---------------------------------------------------------------
  scene.add(new THREE.AmbientLight('#fff1d6', 1.05));
  const sun = new THREE.DirectionalLight('#fff2d0', 1.9);
  sun.position.set(5, 10, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -9;
  sun.shadow.camera.right = 9;
  sun.shadow.camera.top = 9;
  sun.shadow.camera.bottom = -9;
  sun.shadow.camera.far = 30;
  sun.shadow.bias = -0.0005;
  scene.add(sun);
  const fill = new THREE.DirectionalLight('#ffe9c4', 0.6);
  fill.position.set(-6, 5, 4);
  scene.add(fill);

  // --- room -----------------------------------------------------------------
  const floor = mesh(new THREE.PlaneGeometry(34, 22), std('#a9743f', 0.9), 0, 0, 0);
  floor.rotation.x = -Math.PI / 2;
  floor.castShadow = false;
  scene.add(floor);
  // Wood planks: thin darker strips across the floor.
  for (let i = -8; i <= 8; i++) {
    const plank = mesh(new THREE.BoxGeometry(34, 0.01, 0.08), std('#96622f', 0.9), 0, 0.005, i * 1.3);
    plank.castShadow = false;
    scene.add(plank);
  }
  const wall = mesh(new THREE.PlaneGeometry(34, 9), std('#f3e2bd', 0.95), 0, 4.5, -5.2);
  wall.castShadow = false;
  scene.add(wall);
  // Backsplash strip.
  const splash = mesh(new THREE.BoxGeometry(20, 1.1, 0.12), std('#c98a4b', 0.7), 0, 1.5, -5.1);
  splash.castShadow = false;
  scene.add(splash);
  // Simple shelf with 3 hanging copper pots.
  const shelf = mesh(new THREE.BoxGeometry(6, 0.12, 0.9), std('#6f4520', 0.8), -4.5, 3.6, -4.9);
  scene.add(shelf);
  for (let i = 0; i < 3; i++) {
    const pot = mesh(new THREE.CylinderGeometry(0.42, 0.36, 0.5, 18), std('#b87333', 0.35, 0.85), -6.2 + i * 1.7, 3.0, -4.9);
    scene.add(pot);
    const handle = mesh(new THREE.TorusGeometry(0.3, 0.045, 8, 14, Math.PI), std('#8a5a2b', 0.5, 0.4), -6.2 + i * 1.7, 3.35, -4.9);
    handle.rotation.z = 0;
    scene.add(handle);
  }

  // --- work table -----------------------------------------------------------
  const tableTop = mesh(new THREE.BoxGeometry(10.5, 0.25, 3.4), std('#8a5a2b', 0.7), 0, 0.88, 0);
  scene.add(tableTop);
  for (const [lx, lz] of [[-5, -1.4], [5, -1.4], [-5, 1.4], [5, 1.4]]) {
    scene.add(mesh(new THREE.BoxGeometry(0.3, 0.8, 0.3), std('#6f4520', 0.8), lx, 0.4, lz));
  }

  // --- chopping board (left) ------------------------------------------------
  const boardGroup = new THREE.Group();
  boardGroup.position.set(...POS.board);
  boardGroup.userData.action = 'board';
  const boardSlab = mesh(new THREE.BoxGeometry(1.9, 0.09, 1.3), std('#d9a860', 0.6), 0, 0.05, 0);
  boardGroup.add(boardSlab);
  // Knife: handle + flat blade, pivots at the handle end.
  const knife = new THREE.Group();
  knife.position.set(0.55, 0.14, -0.35);
  const handle = mesh(new THREE.BoxGeometry(0.55, 0.09, 0.16), std('#3a2a18', 0.6), 0.28, 0, 0);
  const blade = mesh(new THREE.BoxGeometry(0.85, 0.03, 0.3), std('#d8d8de', 0.25, 0.9), -0.45, 0, 0);
  knife.add(handle, blade);
  knife.rotation.y = -0.5;
  boardGroup.add(knife);
  // 3 chop-progress dots above the board.
  const chopDots = [];
  for (let i = 0; i < 3; i++) {
    const dot = mesh(new THREE.SphereGeometry(0.09, 12, 10), std('#cccccc', 0.5), -0.5 + i * 0.5, 0.55, -0.5);
    dot.castShadow = false;
    boardGroup.add(dot);
    chopDots.push(dot);
  }
  const boardItemGroup = new THREE.Group();
  boardItemGroup.position.y = 0.14;
  boardGroup.add(boardItemGroup);
  scene.add(boardGroup);

  // --- plate (centre) -------------------------------------------------------
  const plateGroup = new THREE.Group();
  plateGroup.position.set(...POS.plate);
  plateGroup.userData.action = 'plate';
  const plateBase = mesh(new THREE.CylinderGeometry(0.85, 0.6, 0.1, 28), std('#ffffff', 0.35), 0, 0.05, 0);
  const plateInner = mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.04, 28), std('#f2ead8', 0.4), 0, 0.11, 0);
  plateGroup.add(plateBase, plateInner);
  const readyRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.05, 0.07, 10, 32),
    new THREE.MeshStandardMaterial({ color: '#2e9e4f', emissive: '#2e9e4f', emissiveIntensity: 0.7, roughness: 0.4 }),
  );
  readyRing.rotation.x = Math.PI / 2;
  readyRing.position.y = 0.06;
  readyRing.visible = false;
  plateGroup.add(readyRing);
  const plateItemsGroup = new THREE.Group();
  plateItemsGroup.position.y = 0.14;
  plateGroup.add(plateItemsGroup);
  scene.add(plateGroup);

  // --- stove (right, decorative) --------------------------------------------
  const stoveGroup = new THREE.Group();
  stoveGroup.position.set(...POS.stove);
  const stoveBody = mesh(new THREE.BoxGeometry(2.2, 0.85, 1.7), std('#3c3c44', 0.6, 0.3), 0, 0.42, 0);
  stoveGroup.add(stoveBody);
  for (const [bx, bz] of [[-0.5, -0.4], [0.5, -0.4], [-0.5, 0.4], [0.5, 0.4]]) {
    stoveGroup.add(mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.05, 18), std('#1c1c20', 0.4, 0.6), bx, 0.88, bz));
  }
  const pot = mesh(new THREE.CylinderGeometry(0.5, 0.42, 0.55, 20), std('#b87333', 0.35, 0.85), -0.5, 1.15, -0.4);
  stoveGroup.add(pot);
  scene.add(stoveGroup);
  // Rising steam: small white spheres that loop upward and fade.
  const steam = [];
  const steamMat = new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.55, roughness: 1 });
  for (let i = 0; i < 6; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), steamMat.clone());
    puff.position.set(POS.stove[0] - 0.5 + (Math.random() - 0.5) * 0.3, 1.6 + i * 0.25, POS.stove[2] - 0.4);
    puff.userData.phase = i / 6;
    scene.add(puff);
    steam.push(puff);
  }

  // --- trash (beside the plate) ---------------------------------------------
  const trashGroup = new THREE.Group();
  trashGroup.position.set(...POS.trash);
  trashGroup.userData.action = 'trash';
  const trashBin = mesh(new THREE.CylinderGeometry(0.42, 0.34, 0.7, 18, 1, true), std('#8a8f96', 0.5, 0.5), 0, 0.35, 0);
  trashBin.material.side = THREE.DoubleSide;
  const trashBottom = mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.05, 18), std('#6d7178', 0.6), 0, 0.03, 0);
  trashGroup.add(trashBin, trashBottom);
  scene.add(trashGroup);

  // --- front counter + ingredient bins --------------------------------------
  const counter = mesh(new THREE.BoxGeometry(13, 0.9, 1.4), std('#7a4a22', 0.75), 0, 0.45, 2.7);
  scene.add(counter);
  const binGroups = {};
  const pickables = [boardGroup, plateGroup, trashGroup];
  for (const ing of INGREDIENTS) {
    const [x, y, z] = POS.bins[ing.id];
    const bin = new THREE.Group();
    bin.position.set(x, y + 0.45, z);
    bin.userData.action = `bin-${ing.id}`;
    const boxMesh = mesh(new THREE.BoxGeometry(1.6, 0.55, 1.1), std('#a06a35', 0.7), 0, 0.28, 0);
    const rim = mesh(new THREE.BoxGeometry(1.7, 0.08, 1.2), std('#6f4520', 0.7), 0, 0.58, 0);
    bin.add(boxMesh, rim);
    bin.add(buildBinStack(ing.id));
    scene.add(bin);
    binGroups[ing.id] = bin;
    pickables.push(bin);
  }

  // --- held ingredient (follows the cursor) ---------------------------------
  const heldGroup = new THREE.Group();
  heldGroup.visible = false;
  scene.add(heldGroup);

  // --- flying coins -----------------------------------------------------------
  const coinsGroup = new THREE.Group();
  scene.add(coinsGroup);
  const flyingCoins = [];

  const raycaster = new THREE.Raycaster();
  const pointerV = new THREE.Vector2();
  const tablePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.4); // y = 1.4
  const hitPoint = new THREE.Vector3();

  let knifeAnim = 0; // seconds left of the knife swing
  let lastPlateSig = null;
  let lastBoardSig = null;
  let elapsed = 0;

  function clearGroup(group) {
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
    }
  }

  function plateSignature(state) {
    return state.plate.map((i) => `${i.ingredient}:${i.chopped ? 'c' : 'w'}`).join(',');
  }

  function boardSignature(state) {
    const t = state.chopTarget;
    return t ? `${t.ingredient}:${t.progress}:${t.chopped ? 'c' : 'w'}` : '';
  }

  function sync(state, isReady) {
    // Plate contents.
    const pSig = plateSignature(state);
    if (pSig !== lastPlateSig) {
      lastPlateSig = pSig;
      clearGroup(plateItemsGroup);
      state.plate.forEach((item, i) => {
        const m = buildIngredientMesh(item.ingredient, item.chopped);
        m.scale.setScalar(0.7);
        const angle = (i / Math.max(1, state.plate.length)) * Math.PI * 2;
        const r = state.plate.length > 1 ? 0.32 : 0;
        m.position.set(Math.cos(angle) * r, 0.06, Math.sin(angle) * r);
        plateItemsGroup.add(m);
      });
    }
    readyRing.visible = !!isReady;
    // Board contents + chop dots.
    const bSig = boardSignature(state);
    if (bSig !== lastBoardSig) {
      lastBoardSig = bSig;
      clearGroup(boardItemGroup);
      if (state.chopTarget) {
        const m = buildIngredientMesh(state.chopTarget.ingredient, state.chopTarget.chopped);
        m.scale.setScalar(state.chopTarget.chopped ? 0.75 : 0.9);
        m.position.y = 0.05;
        boardItemGroup.add(m);
      }
    }
    if (state.chopTarget) {
      chopDots.forEach((dot, i) => {
        dot.visible = true;
        dot.material.color.set(i < state.chopTarget.progress ? '#2e9e4f' : '#cccccc');
      });
    } else {
      // No chopping in progress: hide the dots instead of leaving
      // three grey dots floating above the board.
      chopDots.forEach((dot) => {
        dot.visible = false;
      });
    }
  }

  function setHeld(ingredientId) {
    clearGroup(heldGroup);
    if (!ingredientId) {
      heldGroup.visible = false;
      return;
    }
    heldGroup.add(buildIngredientMesh(ingredientId, false));
    heldGroup.visible = true;
  }

  function updateHeldFromPointer(ndcX, ndcY) {
    if (!heldGroup.visible) return;
    pointerV.set(ndcX, ndcY);
    raycaster.setFromCamera(pointerV, camera);
    if (raycaster.ray.intersectPlane(tablePlane, hitPoint)) {
      heldGroup.position.set(
        THREE.MathUtils.clamp(hitPoint.x, -6, 6),
        1.55 + Math.sin(elapsed * 3) * 0.05,
        THREE.MathUtils.clamp(hitPoint.z, -2, 3.2),
      );
    }
  }

  function pick(ndcX, ndcY) {
    pointerV.set(ndcX, ndcY);
    raycaster.setFromCamera(pointerV, camera);
    const hits = raycaster.intersectObjects(pickables, true);
    for (const hit of hits) {
      let obj = hit.object;
      while (obj) {
        if (obj.userData && obj.userData.action) return obj.userData.action;
        obj = obj.parent;
      }
    }
    return null;
  }

  function project(world) {
    // Refresh the camera matrices first: before the first render the
    // matrixWorldInverse is still stale, which used to project the bin
    // labels far below the viewport.
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();
    const v = new THREE.Vector3(world[0], world[1], world[2]).project(camera);
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((v.x + 1) / 2) * rect.width,
      y: ((1 - v.y) / 2) * rect.height,
      visible: v.z < 1,
    };
  }

  function spawnCoins() {
    for (let i = 0; i < 8; i++) {
      const coin = mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.05, 16),
        new THREE.MeshStandardMaterial({ color: '#e8a91c', metalness: 0.8, roughness: 0.25, emissive: '#7a5200', emissiveIntensity: 0.3 }),
        POS.plate[0] + (Math.random() - 0.5) * 0.5,
        1.4,
        POS.plate[2] + (Math.random() - 0.5) * 0.5,
      );
      coin.rotation.x = Math.PI / 2;
      coinsGroup.add(coin);
      flyingCoins.push({
        mesh: coin,
        vx: (Math.random() - 0.5) * 3,
        vy: 3 + Math.random() * 2.5,
        vz: (Math.random() - 0.5) * 3,
        life: 1.4,
      });
    }
  }

  function update(dt, state) {
    elapsed += dt;
    // Steam rises and fades, looping.
    for (const puff of steam) {
      puff.userData.phase = (puff.userData.phase + dt * 0.25) % 1;
      const p = puff.userData.phase;
      puff.position.y = 1.6 + p * 1.6;
      puff.position.x = POS.stove[0] - 0.5 + Math.sin(p * 6) * 0.15;
      puff.scale.setScalar(0.6 + p * 1.1);
      puff.material.opacity = 0.55 * (1 - p);
    }
    // Knife swing: 0.22s, quick down-up.
    if (knifeAnim > 0) {
      knifeAnim -= dt;
      const t = 1 - Math.max(0, knifeAnim) / 0.22;
      knife.rotation.x = -Math.sin(t * Math.PI) * 0.9;
    } else {
      knife.rotation.x = 0;
    }
    // Ready plate pulses green.
    if (readyRing.visible) {
      const s = 1 + Math.sin(elapsed * 5) * 0.06;
      readyRing.scale.set(s, s, 1);
    }
    // Flying coins: gravity, spin, fade out.
    for (let i = flyingCoins.length - 1; i >= 0; i--) {
      const c = flyingCoins[i];
      c.life -= dt;
      c.vy -= 9.8 * dt;
      c.mesh.position.x += c.vx * dt;
      c.mesh.position.y += c.vy * dt;
      c.mesh.position.z += c.vz * dt;
      c.mesh.rotation.y += dt * 8;
      if (c.life <= 0 || c.mesh.position.y < 0.05) {
        coinsGroup.remove(c.mesh);
        flyingCoins.splice(i, 1);
      }
    }
    // Held ingredient bobs gently.
    if (heldGroup.visible) {
      heldGroup.position.y = 1.55 + Math.sin(elapsed * 3) * 0.05;
      heldGroup.rotation.y += dt * 1.2;
    }
  }

  function swingKnife() {
    knifeAnim = 0.22;
  }

  return {
    renderer,
    scene,
    camera,
    sync,
    update,
    setHeld,
    updateHeldFromPointer,
    pick,
    project,
    spawnCoins,
    swingKnife,
    binPositions: POS.bins,
    render() {
      renderer.render(scene, camera);
    },
  };
}
