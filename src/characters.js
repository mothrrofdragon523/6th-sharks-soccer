// Loads the Mixamo player model and soccer animations, and paints team kits onto it.
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const DIR = 'assets/mixamo/';
const PACK = DIR + 'Soccer Game Pack/';

// Which file from the soccer pack plays for each move
export const CLIPS = {
  idle: 'offensive idle (fixed)', // ready stance during play
  stand: 'Idle',                  // relaxed, for kick-offs and after goals
  jog: 'jog forward',
  run: 'Fast Run',
  sprint: 'Sprint',
  pass: 'kick soccerball (2)',
  shoot: 'strike foward jog',
  tackle: 'soccer tackle (3)',
  // Shuffling while marking someone and watching the ball
  strafeL: 'jog strafe left',
  strafeR: 'jog strafe right',
  backpedal: 'jog backward',
  // Trick button: a sharp cut past an opponent, or flicking the ball up over him
  cutL: 'jog forward diagonal (2)',
  cutR: 'jog forward diagonal',
  flick: 'kick up soccerball',
  // Goalkeeper. L and R are the keeper's own left and right.
  gkIdle: 'goalkeeper idle',
  gkHold: 'goalkeeper idle (2)',        // standing with the ball in his hands
  gkStepL: 'goalkeeper sidestep',
  gkStepR: 'goalkeeper sidestep (2)',
  gkDirect: 'goalkeeper directing',     // waving his defenders into place
  gkCatch: 'goalkeeper catch',          // waist-high
  gkCatchChest: 'goalkeeper catch (2)',
  gkCatchLeap: 'goalkeeper catch (3)',  // running jump for a high ball
  gkCatchHigh: 'goalkeeper catch (4)',  // standing jump for a high ball
  gkScoop: 'goalkeeper scoop',          // bending to gather a rolling ball
  gkDiveL: 'goalkeeper diving save',
  gkDiveR: 'goalkeeper diving save (2)',
  gkBlockL: 'goalkeeper body block',
  gkBlockL2: 'goalkeeper body block (3)',
  gkBlockR: 'goalkeeper body block (2)',
  gkMiss: 'goalkeeper miss',            // jumps and can't reach it
  gkThrow: 'goalkeeper overhand throw',
  gkDropKick: 'goalkeeper drop kick',
  gkRoll: 'goalkeeper pass',            // bowls the ball out along the ground
  gkPlace: 'goalkeeper placing ball',   // puts the ball down for a goal kick
};
// Where to start each one-off move (seconds), so the foot meets the ball about when the game kicks it
export const START = {
  pass: 0.3, shoot: 0.35, tackle: 0.2, flick: 0.4,
  gkCatch: 0.4, gkCatchChest: 0.1, gkCatchLeap: 1.0, gkCatchHigh: 0.35, gkScoop: 0.45,
  gkDiveL: 0.55, gkDiveR: 0.55, gkBlockL: 0.45, gkBlockL2: 0.6, gkBlockR: 0.4, gkMiss: 0.3,
  gkThrow: 0.3, gkDropKick: 1.0, gkRoll: 0.5,
};
// Playback speed for one-off moves that are slower than the game needs
export const PLAY_SPEED = { gkDiveL: 1.3, gkDiveR: 1.3, gkBlockL: 1.3, gkBlockL2: 1.3, gkBlockR: 1.3, gkThrow: 1.2, gkDropKick: 1.3, gkRoll: 1.2, gkPlace: 1.3 };
// Metres per second each running animation was recorded at (measured on the model)
export const ANIM_SPEED = { jog: 2.42, run: 5.29, sprint: 5.77, strafeL: 2.8, strafeR: 2.26, backpedal: 2.24, cutL: 2.56, cutR: 2.7, gkStepL: 2.2, gkStepR: 2.9 };

// The pack's moves carry the character forward; the game decides where players go, so pin the hips.
function stripRootMotion(clip) {
  for (const track of clip.tracks) {
    if (!track.name.endsWith('Hips.position')) continue;
    const v = track.values, x0 = v[0], z0 = v[2];
    for (let i = 0; i < v.length; i += 3) { v[i] = x0; v[i + 2] = z0; }
  }
}

export async function loadCharacters() {
  const loader = new FBXLoader();
  const names = Object.values(CLIPS);
  const [base, ...anims] = await Promise.all([
    loader.loadAsync(encodeURI(DIR + 'character.fbx')),
    ...names.map(n => loader.loadAsync(encodeURI(PACK + n + '.fbx'))),
  ]);
  const clips = {};
  Object.keys(CLIPS).forEach((key, i) => {
    const clip = anims[i].animations[0];
    stripRootMotion(clip);
    clip.name = key;
    clips[key] = clip;
  });

  const parts = {};
  base.traverse(o => { if (o.isMesh) parts[o.name] = o; });
  base.updateMatrixWorld(true);
  const height = new THREE.Box3().setFromObject(base).getSize(new THREE.Vector3()).y;

  // Spots for the shirt number (back) and badge (left chest), pinned to the upper spine
  // so they move with the body. Sizes are fractions of the character's height.
  const spine = base.getObjectByName('mixamorigSpine2');
  const shirt = new THREE.Box3().setFromObject(parts.Tops);
  const chestY = spine.getWorldPosition(new THREE.Vector3()).y;
  const attach = (name, size, x, y, z, rotY) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshStandardMaterial({ transparent: true, alphaTest: 0.3, roughness: 0.8 }),
    );
    mesh.name = name;
    const world = new THREE.Matrix4().compose(
      new THREE.Vector3(x, y, z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotY, 0)),
      new THREE.Vector3(1, 1, 1),
    );
    new THREE.Matrix4().copy(spine.matrixWorld).invert().multiply(world)
      .decompose(mesh.position, mesh.quaternion, mesh.scale);
    spine.add(mesh);
  };
  attach('number', height * 0.14, 0, chestY + height * 0.01, shirt.min.z - height * 0.004, Math.PI);
  attach('badge', height * 0.05, height * 0.05, chestY + height * 0.05, shirt.max.z + height * 0.004, 0);

  return {
    base, clips,
    scale: 1.8 / height,
    shirtImage: await imageOf(parts.Tops.material.map),
    shortsImage: await imageOf(parts.Bottoms.material.map),
  };
}

// The model's textures finish decoding a moment after the model itself loads
function imageOf(texture) {
  return new Promise((resolve, reject) => {
    const started = performance.now();
    const check = () => {
      if (texture.image && texture.image.width > 0) resolve(texture.image);
      else if (performance.now() - started > 20000) reject(new Error('texture never loaded'));
      else setTimeout(check, 50);
    };
    check();
  });
}

// Repaint a texture pixel by pixel from its brightness, keeping the fabric's folds and shading.
function repaint(image, paint, size = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.drawImage(image, 0, 0, size, size);
  const data = g.getImageData(0, 0, size, size);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const [r, gr, b] = paint(0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]);
    d[i] = r; d[i + 1] = gr; d[i + 2] = b;
  }
  g.putImageData(data, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const rgb = hex => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
const shade = (hex, f) => rgb(hex).map(v => Math.min(255, v * f));

// The shirt texture is a mid-grey tee with near-black trim (collar, cuffs, hem).
export function kitTextures(assets, kit) {
  return {
    shirt: repaint(assets.shirtImage, L => (L < 45
      ? shade(kit.trim, 0.75 + L / 45 * 0.4)
      : shade(kit.shirt, THREE.MathUtils.clamp(L / 80, 0.78, 1.18)))),
    shorts: repaint(assets.shortsImage, L => shade(kit.shorts, THREE.MathUtils.clamp(L / 110, 0.6, 1.2))),
  };
}

// Fans: thousands of 3D people would be too slow on a phone, so we photograph the character once
// per outfit (shirt colour, skin, hair, pose) into one image, and each seat shows one photo.
// Photos are waist-up (hips to just above the head), like a seated crowd.
export const FAN_CELL = { w: 128, h: 136 }; // pixels per photo in the image
export const FAN_SIZE = { w: 0.9, h: 0.96 }; // metres the photo covers
const FAN_WAIST = 0.9;                       // height on the body where the photo starts

export function renderFanAtlas(renderer, assets, variants) {
  const cols = 8, rows = Math.ceil(variants.length / cols);
  const W = cols * FAN_CELL.w, H = rows * FAN_CELL.h;
  const target = new THREE.WebGLRenderTarget(W, H);
  target.texture.colorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x445544, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 1.1);
  sun.position.set(1, 3, 4);
  scene.add(sun);
  // Framed from the waist up; they face +z, toward the camera
  const camera = new THREE.OrthographicCamera(-FAN_SIZE.w / 2, FAN_SIZE.w / 2, FAN_WAIST + FAN_SIZE.h, FAN_WAIST, 0.1, 20);
  camera.position.set(0, 0, 5);

  const kits = new Map();
  const oldClear = renderer.getClearColor(new THREE.Color()), oldAlpha = renderer.getClearAlpha();
  renderer.setRenderTarget(target);
  renderer.setClearColor(0x000000, 0);
  renderer.clear();
  target.scissorTest = true;

  variants.forEach((v, i) => {
    const fanKit = { shirt: v.shirt, trim: v.shirt === 0xffffff ? 0xbbbbbb : 0x222222, shorts: 0x2c3a58, boots: 0x333333 };
    if (!kits.has(v.shirt)) kits.set(v.shirt, kitTextures(assets, fanKit));
    const model = makeModel(assets, fanKit, kits.get(v.shirt), v.look);
    model.getObjectByName('number').visible = false;
    model.getObjectByName('badge').visible = false;
    const mixer = new THREE.AnimationMixer(model);
    mixer.clipAction(assets.clips[v.pose]).play();
    mixer.setTime(v.poseTime);
    // Some poses stand side-on; turn the whole body so the chest faces the camera (the pitch)
    model.updateMatrixWorld(true);
    const chest = new THREE.Vector3(0, 0, 1).applyQuaternion(model.getObjectByName('mixamorigSpine2').getWorldQuaternion(new THREE.Quaternion()));
    model.rotation.y = -Math.atan2(chest.x, chest.z);
    scene.add(model);

    // A render target uses its own viewport (in real pixels), not the renderer's screen viewport
    const x = (i % cols) * FAN_CELL.w, y = H - (Math.floor(i / cols) + 1) * FAN_CELL.h;
    target.viewport.set(x, y, FAN_CELL.w, FAN_CELL.h);
    target.scissor.set(x, y, FAN_CELL.w, FAN_CELL.h);
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    scene.remove(model);
    mixer.stopAllAction();
  });

  renderer.setRenderTarget(null);
  renderer.setClearColor(oldClear, oldAlpha);
  // (The fan shirt textures are deliberately not disposed: on some phones that also blanked the
  // players' shirts of the same colours, turning them black.)

  // Copy the photos into an ordinary texture that each outfit can take a window onto
  const pixels = new Uint8Array(W * H * 4);
  renderer.readRenderTargetPixels(target, 0, 0, W, H, pixels);
  target.dispose();
  const texture = new THREE.DataTexture(pixels, W, H);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return { texture, cols, rows };
}

// Adding ?lambert to the address draws the players with simpler lighting (for testing on phones).
const SIMPLE_LIGHTING = new URLSearchParams(location.search).has('lambert');

export function makeModel(assets, kit, textures, look) {
  const model = SkeletonUtils.clone(assets.base);
  model.scale.setScalar(assets.scale);
  model.traverse(o => {
    if (!o.isMesh) return;
    o.frustumCulled = false;
    o.material = SIMPLE_LIGHTING && o.material.isMeshPhongMaterial
      ? new THREE.MeshLambertMaterial({ map: o.material.map, color: o.material.color.clone(), transparent: o.material.transparent, alphaTest: o.material.alphaTest })
      : o.material.clone();
    if (o.name === 'Tops') o.material.map = textures.shirt;
    if (o.name === 'Bottoms') o.material.map = textures.shorts;
    if (o.name === 'Body') o.material.color.setHex(look.skinTint);
    if (o.name === 'Hair') o.material.color.setHex(look.hairTint);
    if (o.name === 'Shoes' && kit.boots < 0x444444) o.material.color.setHex(0x3a3a3a);
  });
  return model;
}
