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
  const len = chopped ? 0.2 : 0.34;
  for (let i = 0; i < count; i++) {
    const penne = new THREE.Group();
    // Badan penne: tabung pendek kuning keemasan
    const tube = cylinder('#f2c230', 0.1, 0.1, len);
    tube.rotation.z = Math.PI / 2;
    penne.add(tube);
    // Ujung potong miring + kesan berongga di kedua ujung
    for (const side of [-1, 1]) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.015, 8, 20), mat('#d9a91f'));
      rim.rotation.y = Math.PI / 2;
      rim.rotation.x = 0.5; // potongan diagonal ~30 derajat
      rim.position.x = side * (len / 2);
      rim.castShadow = true;
      penne.add(rim);
      const hollow = cylinder('#c9930a', 0.07, 0.07, 0.02);
      hollow.rotation.z = Math.PI / 2;
      hollow.position.x = side * (len / 2 - 0.005);
      penne.add(hollow);
    }
    // Tumpukan alami: variasi miring + sebar posisi
    penne.rotation.y = i * 0.7;
    penne.rotation.z = (i % 2 === 0 ? 0.12 : -0.1);
    penne.position.set((i - 1) * 0.22, 0.1, (i % 2 === 0 ? 0.08 : -0.08));
    g.add(penne);
  }
  return g;
}

function buildOnion(chopped) {
  const g = new THREE.Group();
  if (!chopped) {
    // Umbi bawang merah, agak pipih
    const body = sphere('#b06a9e', 0.3, 1, 0.88, 1);
    g.add(body);
    // Leher kering meruncing di atas (bukan tunas hijau)
    const neck = cone('#d9b380', 0.07, 0.22);
    neck.position.y = 0.32;
    neck.rotation.z = 0.15;
    g.add(neck);
    // Ujung akar kecil di bawah
    const root = cylinder('#c9a06a', 0.05, 0.05, 0.06);
    root.position.y = -0.28;
    g.add(root);
    // Garis vertikal halus mengikuti permukaan umbi
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const line = box('#96548a', 0.012, 0.45, 0.012);
      line.position.set(Math.sin(a) * 0.285, 0, Math.cos(a) * 0.285);
      line.rotation.y = a;
      g.add(line);
    }
    return g;
  }
  // Irisan: penampang bawang dengan cincin konsentris
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * 0.22;
    const slice = cylinder('#efe4f7', 0.14, 0.14, 0.05);
    slice.position.set(x, 0.03, 0);
    g.add(slice);
    const outer = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.012, 8, 24), mat('#d9c2e8'));
    outer.rotation.x = Math.PI / 2;
    outer.position.set(x, 0.06, 0);
    outer.castShadow = true;
    g.add(outer);
    const inner = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 20), mat('#b06a9e'));
    inner.rotation.x = Math.PI / 2;
    inner.position.set(x, 0.06, 0);
    inner.castShadow = true;
    g.add(inner);
    const core = sphere('#d9c2e8', 0.04);
    core.position.set(x, 0.06, 0);
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
