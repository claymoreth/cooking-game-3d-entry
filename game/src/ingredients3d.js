// Copper Ladle Kitchen 3D — 3D meshes for every ingredient, built only
// from Three.js primitives (no external models). Each builder returns a
// THREE.Group. `chopped` gives a smaller, cut-into-pieces version.
import * as THREE from '../vendor/three.min.js';
import { INGREDIENT_BY_ID } from './config.js';

function mat(color, roughness = 0.7) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.05 });
}

function sphere(color, r, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat(color));
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  return m;
}

function cone(color, r, h) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 10), mat(color));
  m.castShadow = true;
  return m;
}

function cylinder(color, rTop, rBottom, h, segments = 20) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segments), mat(color));
  m.castShadow = true;
  return m;
}

function box(color, w, h, d) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.castShadow = true;
  return m;
}

function buildTomato(chopped) {
  const g = new THREE.Group();
  if (!chopped) {
    const body = sphere('#e0483e', 0.32);
    body.scale.set(1, 0.85, 1);
    g.add(body);
    // Little green star on top: 4 flat cones.
    for (let i = 0; i < 4; i++) {
      const leaf = cone('#2e9e4f', 0.09, 0.22);
      leaf.rotation.z = Math.PI / 2.4;
      leaf.rotation.y = (i * Math.PI) / 2;
      leaf.position.set(0, 0.3, 0);
      g.add(leaf);
    }
    return g;
  }
  // Chopped: two red half-discs + a wedge, lying flat.
  for (let i = 0; i < 3; i++) {
    const piece = cylinder('#e0483e', 0.16, 0.16, 0.09, 16);
    piece.position.set((i - 1) * 0.22, 0.05, i % 2 === 0 ? 0.06 : -0.08);
    g.add(piece);
    const skin = cylinder('#c22f24', 0.17, 0.17, 0.03, 16);
    skin.position.copy(piece.position);
    skin.position.y = 0.1;
    g.add(skin);
  }
  return g;
}

function buildLettuce(chopped) {
  const g = new THREE.Group();
  if (!chopped) {
    const outer = sphere('#5cb85c', 0.34);
    outer.scale.set(1, 0.55, 1);
    g.add(outer);
    const inner = sphere('#8ed081', 0.22);
    inner.scale.set(1, 0.5, 1);
    inner.position.y = 0.08;
    g.add(inner);
    return g;
  }
  for (let i = 0; i < 3; i++) {
    const leaf = sphere(i % 2 ? '#8ed081' : '#5cb85c', 0.16);
    leaf.scale.set(1.4, 0.25, 1);
    leaf.position.set((i - 1) * 0.24, 0.04, (i - 1) * 0.05);
    leaf.rotation.y = i * 0.7;
    g.add(leaf);
  }
  return g;
}

function buildCheese(chopped) {
  const g = new THREE.Group();
  // A wedge: a partial cylinder (thetaLength < 2*PI).
  const wedgeGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.16, 20, 1, false, 0, Math.PI * 1.25);
  const wedge = new THREE.Mesh(wedgeGeo, mat('#f2c230'));
  wedge.castShadow = true;
  g.add(wedge);
  // 2-3 dark holes on top.
  const holePositions = chopped
    ? [[0.1, 0.09, 0.05]]
    : [[0.12, 0.09, 0.08], [-0.1, 0.09, -0.06], [0.02, 0.09, -0.16]];
  for (const [x, y, z] of holePositions) {
    const hole = sphere('#b98a12', 0.045);
    hole.scale.set(1, 0.4, 1);
    hole.position.set(x, y, z);
    g.add(hole);
  }
  if (chopped) {
    const second = wedge.clone();
    second.position.set(0.28, 0, 0.18);
    second.rotation.y = 1.2;
    second.scale.setScalar(0.7);
    g.add(second);
  }
  return g;
}

function buildMushroom(chopped) {
  const g = new THREE.Group();
  if (!chopped) {
    const cap = sphere('#cbb49a', 0.3, 1, 0.55, 1);
    cap.position.y = 0.14;
    g.add(cap);
    const stem = cylinder('#f5efe2', 0.11, 0.14, 0.26, 14);
    stem.position.y = -0.05;
    g.add(stem);
    return g;
  }
  for (let i = 0; i < 3; i++) {
    const slice = cylinder('#cbb49a', 0.15, 0.15, 0.07, 14);
    slice.position.set((i - 1) * 0.22, 0.04, i % 2 === 0 ? 0.05 : -0.06);
    g.add(slice);
    const stemBit = cylinder('#f5efe2', 0.06, 0.06, 0.06, 10);
    stemBit.position.set((i - 1) * 0.22, 0.09, i % 2 === 0 ? 0.05 : -0.06);
    g.add(stemBit);
  }
  return g;
}

function buildPasta(chopped) {
  const g = new THREE.Group();
  const count = chopped ? 4 : 3;
  for (let i = 0; i < count; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.055, 10, 18), mat('#f0d48a'));
    ring.rotation.x = Math.PI / 2;
    ring.rotation.z = i * 0.9;
    ring.position.set((i - 1) * 0.2, 0.06, (i % 2 === 0 ? 0.07 : -0.07) * (chopped ? 1 : 0.4));
    ring.castShadow = true;
    g.add(ring);
  }
  return g;
}

function buildOnion(chopped) {
  const g = new THREE.Group();
  if (!chopped) {
    const body = sphere('#d9c2e8', 0.3);
    body.scale.set(1, 0.95, 1);
    g.add(body);
    const sprout = cone('#5cb85c', 0.07, 0.28);
    sprout.position.y = 0.38;
    g.add(sprout);
    return g;
  }
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.13 - i * 0.02, 0.035, 8, 16), mat('#e8d8f5'));
    ring.rotation.x = Math.PI / 2;
    ring.position.set((i - 1) * 0.2, 0.04, 0);
    ring.castShadow = true;
    g.add(ring);
    const core = sphere('#d9c2e8', 0.05);
    core.position.set((i - 1) * 0.2, 0.05, 0);
    g.add(core);
  }
  return g;
}

const BUILDERS = {
  tomato: buildTomato,
  lettuce: buildLettuce,
  cheese: buildCheese,
  mushroom: buildMushroom,
  pasta: buildPasta,
  onion: buildOnion,
};

/** Build a 3D mesh for an ingredient. `chopped` = the cut version. */
export function buildIngredientMesh(ingredientId, chopped = false) {
  const builder = BUILDERS[ingredientId];
  if (!builder) throw new Error(`Unknown ingredient: ${ingredientId}`);
  const group = builder(chopped);
  group.userData.ingredientId = ingredientId;
  group.userData.chopped = chopped;
  return group;
}

/** A tall, colourful stack of the ingredient poking well above the bin rim. */
export function buildBinStack(ingredientId) {
  const g = new THREE.Group();
  // Bin-local y: the rim sits at ~0.62, so pieces at 0.68-0.95 (world
  // ~1.68-1.95) heap clearly above it instead of hiding behind the front wall.
  const spots = [
    [0, 0.68, 0, 0.3],
    [-0.38, 0.74, 0.1, 1.4],
    [0.36, 0.76, -0.12, 2.2],
    [-0.12, 0.9, -0.18, 0.9],
    [0.18, 0.92, 0.14, 2.8],
  ];
  for (const [x, y, z, rot] of spots) {
    const piece = buildIngredientMesh(ingredientId, false);
    piece.scale.setScalar(1.0);
    piece.position.set(x, y, z);
    piece.rotation.y = rot;
    g.add(piece);
  }
  return g;
}

/** The coloured dot colour for an ingredient (used by HUD ticket icons). */
export function ingredientColor(ingredientId) {
  return INGREDIENT_BY_ID[ingredientId]?.color ?? '#888888';
}
