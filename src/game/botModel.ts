import * as THREE from 'three';
import { TeamId, WeaponId, ZombieVariant } from './types';
import { WEAPONS } from './weapons';

export interface CombatantRig {
  root: THREE.Group;
  bodyPivot: THREE.Group;
  headMesh: THREE.Mesh;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftArm?: THREE.Group;
  rightArm: THREE.Group;
  muzzleWorldAnchor: THREE.Object3D;
  hitMeshes: THREE.Object3D[];
  nameSprite?: THREE.Sprite;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.28)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

function createNameplateTexture(label: string, team: TeamId, isHuman: boolean, isFfa = false): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 64);
  ctx.fillStyle = 'rgba(10, 14, 22, 0.82)';
  ctx.beginPath();
  ctx.roundRect(12, 12, 232, 40, 8);
  ctx.fill();

  ctx.lineWidth = 2;
  ctx.strokeStyle = isFfa ? '#f59e0b' : team === 'blue' ? '#3b82f6' : '#ef4444';
  ctx.stroke();

  ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isHuman ? '#fbbf24' : '#f8fafc';
  ctx.fillText(label.slice(0, 18), 128, 32);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

let sharedShadowTex: THREE.CanvasTexture | null = null;

export function buildCombatantRig(
  combatantId: string,
  team: TeamId,
  weaponId: WeaponId,
  displayName?: string,
  isHuman = false,
  isFfa = false
): CombatantRig {
  const root = new THREE.Group();
  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  if (!sharedShadowTex) {
    sharedShadowTex = createContactShadowTexture();
  }

  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.15, 1.15),
    new THREE.MeshBasicMaterial({
      map: sharedShadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
    })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.025;
  root.add(contactShadow);

  const isBlue = team === 'blue';
  const armorColor = isFfa ? 0x7c2d12 : isBlue ? 0x1e40af : 0x991b1b;
  const trimColor = isFfa ? 0xf59e0b : isBlue ? 0x3b82f6 : 0xef4444;
  const bduColor = isFfa ? 0x242220 : isBlue ? 0x1f2937 : 0x262124;

  const armorMat = new THREE.MeshStandardMaterial({ color: armorColor, metalness: 0.35, roughness: 0.48 });
  const suitMat = new THREE.MeshStandardMaterial({ color: bduColor, metalness: 0.08, roughness: 0.84 });
  const pouchMat = new THREE.MeshStandardMaterial({ color: 0x171c23, metalness: 0.12, roughness: 0.78 });
  const trimMat = new THREE.MeshStandardMaterial({
    color: trimColor,
    metalness: 0.55,
    roughness: 0.3,
    emissive: trimColor,
    emissiveIntensity: 0.45,
  });
  const visorMat = new THREE.MeshStandardMaterial({
    color: isFfa ? 0xfbbf24 : isBlue ? 0x38bdf8 : 0xf97316,
    metalness: 0.92,
    roughness: 0.1,
    emissive: isFfa ? 0xd97706 : isBlue ? 0x0284c7 : 0xea580c,
    emissiveIntensity: 0.75,
  });
  const gunMat = new THREE.MeshStandardMaterial({ color: 0x1b222c, metalness: 0.85, roughness: 0.28 });

  const tagHitbox = (obj: THREE.Object3D, hitbox: 'head' | 'body') => {
    obj.userData.combatantId = combatantId;
    obj.userData.team = team;
    obj.userData.hitbox = hitbox;
  };

  const legGeo = new THREE.BoxGeometry(0.18, 0.72, 0.2);
  legGeo.translate(0, -0.36, 0);

  const leftLeg = new THREE.Mesh(legGeo, suitMat);
  leftLeg.position.set(-0.13, 0.74, 0);
  leftLeg.castShadow = true;
  tagHitbox(leftLeg, 'body');

  const rightLeg = new THREE.Mesh(legGeo, suitMat);
  rightLeg.position.set(0.13, 0.74, 0);
  rightLeg.castShadow = true;
  tagHitbox(rightLeg, 'body');

  const bootGeo = new THREE.BoxGeometry(0.2, 0.18, 0.28);
  const leftBoot = new THREE.Mesh(bootGeo, pouchMat);
  leftBoot.position.set(0, -0.65, 0.04);
  leftLeg.add(leftBoot);
  tagHitbox(leftBoot, 'body');

  const rightBoot = new THREE.Mesh(bootGeo, pouchMat);
  rightBoot.position.set(0, -0.65, 0.04);
  rightLeg.add(rightBoot);
  tagHitbox(rightBoot, 'body');

  const kneeGeo = new THREE.BoxGeometry(0.19, 0.13, 0.22);
  const leftKnee = new THREE.Mesh(kneeGeo, armorMat);
  leftKnee.position.set(0, -0.34, 0.02);
  leftLeg.add(leftKnee);
  tagHitbox(leftKnee, 'body');

  const rightKnee = new THREE.Mesh(kneeGeo, armorMat);
  rightKnee.position.set(0, -0.34, 0.02);
  rightLeg.add(rightKnee);
  tagHitbox(rightKnee, 'body');

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.62, 0.26), suitMat);
  torso.position.set(0, 1.06, 0);
  torso.castShadow = true;
  tagHitbox(torso, 'body');

  const plateCarrier = new THREE.Mesh(new THREE.BoxGeometry(0.47, 0.44, 0.31), armorMat);
  plateCarrier.position.set(0, 1.12, 0);
  plateCarrier.castShadow = true;
  tagHitbox(plateCarrier, 'body');

  for (let m = -1; m <= 1; m++) {
    const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.06), pouchMat);
    pouch.position.set(m * 0.12, 1.01, 0.17);
    bodyPivot.add(pouch);
    tagHitbox(pouch, 'body');
  }

  const backPack = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.4, 0.15), pouchMat);
  backPack.position.set(0, 1.12, -0.2);
  tagHitbox(backPack, 'body');

  const chestIdPatch = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.045, 0.32), trimMat);
  chestIdPatch.position.set(0, 1.25, 0);
  tagHitbox(chestIdPatch, 'body');

  const pauldronGeo = new THREE.BoxGeometry(0.16, 0.16, 0.23);
  const leftShoulder = new THREE.Mesh(pauldronGeo, armorMat);
  leftShoulder.position.set(-0.31, 1.28, 0);
  tagHitbox(leftShoulder, 'body');

  const rightShoulder = new THREE.Mesh(pauldronGeo, armorMat);
  rightShoulder.position.set(0.31, 1.28, 0);
  tagHitbox(rightShoulder, 'body');

  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.48, 0.14), suitMat);
  leftArm.position.set(-0.3, 1.04, 0.14);
  leftArm.rotation.x = -0.65;
  leftArm.rotation.z = -0.22;
  tagHitbox(leftArm, 'body');

  const rightArm = new THREE.Group();
  rightArm.position.set(0.28, 1.24, 0.04);

  const armMesh = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.14, 0.44), suitMat);
  armMesh.position.set(0, -0.06, 0.2);
  tagHitbox(armMesh, 'body');
  rightArm.add(armMesh);

  const spec = WEAPONS[weaponId] || WEAPONS.m4a1;
  const barrelLen =
    spec.category === 'sniper'
      ? 0.92
      : spec.category === 'dmr' || spec.category === 'lmg'
      ? 0.78
      : spec.category === 'shotgun'
      ? 0.68
      : spec.category === 'pistol'
      ? 0.26
      : spec.category === 'launcher'
      ? 0.88
      : spec.category === 'smg'
      ? 0.44
      : 0.62;

  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, spec.category === 'pistol' ? 0.22 : 0.34), gunMat);
  receiver.position.set(-0.04, -0.02, 0.42);
  rightArm.add(receiver);

  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(spec.category === 'launcher' ? 0.045 : 0.018, spec.category === 'launcher' ? 0.045 : 0.018, barrelLen, 8),
    gunMat
  );
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(-0.04, 0.015, 0.42 + barrelLen * 0.45);
  rightArm.add(barrel);

  if (spec.category === 'sniper' || spec.category === 'dmr') {
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.24, 8), gunMat);
    scope.rotation.x = Math.PI / 2;
    scope.position.set(-0.04, 0.075, 0.44);
    rightArm.add(scope);
  }

  const muzzleWorldAnchor = new THREE.Object3D();
  muzzleWorldAnchor.position.set(-0.04, 0.015, 0.42 + barrelLen * 0.92);
  rightArm.add(muzzleWorldAnchor);

  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.32), armorMat);
  headMesh.position.set(0, 1.56, 0);
  headMesh.castShadow = true;
  tagHitbox(headMesh, 'head');

  const nvgMount = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.08), pouchMat);
  nvgMount.position.set(0, 1.66, 0.16);
  tagHitbox(nvgMount, 'head');

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.1, 0.06), visorMat);
  visor.position.set(0, 1.56, 0.15);
  tagHitbox(visor, 'head');

  const helmetStrip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.26), trimMat);
  helmetStrip.position.set(0, 1.72, -0.02);
  tagHitbox(helmetStrip, 'head');

  bodyPivot.add(
    leftLeg,
    rightLeg,
    torso,
    plateCarrier,
    backPack,
    chestIdPatch,
    leftShoulder,
    rightShoulder,
    leftArm,
    rightArm,
    headMesh,
    nvgMount,
    visor,
    helmetStrip
  );

  let nameSprite: THREE.Sprite | undefined;
  if (displayName && (isHuman || isFfa || team === 'blue')) {
    const tex = createNameplateTexture(displayName, team, isHuman, isFfa);
    const spMat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthTest: true,
      depthWrite: false,
    });
    nameSprite = new THREE.Sprite(spMat);
    nameSprite.position.set(0, 2.15, 0);
    nameSprite.scale.set(1.65, 0.42, 1);
    root.add(nameSprite);
  }

  const hitMeshes: THREE.Object3D[] = [
    headMesh,
    nvgMount,
    visor,
    helmetStrip,
    torso,
    plateCarrier,
    backPack,
    leftShoulder,
    rightShoulder,
    leftLeg,
    rightLeg,
    leftArm,
    armMesh,
  ];

  return {
    root,
    bodyPivot,
    headMesh,
    leftLeg,
    rightLeg,
    rightArm,
    muzzleWorldAnchor,
    hitMeshes,
    nameSprite,
  };
}

export function buildZombieRig(zombieId: string, variant: ZombieVariant): CombatantRig {
  const root = new THREE.Group();
  const bodyPivot = new THREE.Group();
  const isBrute = variant === 'brute';
  const isRunner = variant === 'runner';
  const scale = isBrute ? 1.38 : isRunner ? 0.94 : 1.02;
  bodyPivot.scale.set(scale, scale, scale);
  root.add(bodyPivot);

  if (!sharedShadowTex) {
    sharedShadowTex = createContactShadowTexture();
  }

  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.25 * scale, 1.25 * scale),
    new THREE.MeshBasicMaterial({
      map: sharedShadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
    })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.025;
  root.add(contactShadow);

  const skinColor = isBrute ? 0x3b4d3e : isRunner ? 0x5c3a3a : 0x556b52;
  const ragColor = isBrute ? 0x1c2126 : isRunner ? 0x2c1618 : 0x283127;
  const armorColor = isBrute ? 0x2a343d : 0x23292f;
  const glowColor = isBrute ? 0x22c55e : isRunner ? 0xef4444 : 0xa3e635;

  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, metalness: 0.04, roughness: 0.86 });
  const ragMat = new THREE.MeshStandardMaterial({ color: ragColor, metalness: 0.06, roughness: 0.92 });
  const plateMat = new THREE.MeshStandardMaterial({ color: armorColor, metalness: 0.58, roughness: 0.42 });
  const bloodMat = new THREE.MeshStandardMaterial({ color: 0x6b1414, metalness: 0.14, roughness: 0.38 });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: glowColor,
    emissive: glowColor,
    emissiveIntensity: 1.65,
    metalness: 0.2,
    roughness: 0.2,
  });

  const tagHitbox = (obj: THREE.Object3D, hitbox: 'head' | 'body') => {
    obj.userData.combatantId = zombieId;
    obj.userData.team = 'red';
    obj.userData.hitbox = hitbox;
  };

  const legGeo = new THREE.BoxGeometry(0.18, 0.72, 0.2);
  legGeo.translate(0, -0.36, 0);

  const leftLeg = new THREE.Mesh(legGeo, ragMat);
  leftLeg.position.set(-0.14, 0.74, 0);
  leftLeg.castShadow = true;
  tagHitbox(leftLeg, 'body');

  const rightLeg = new THREE.Mesh(legGeo, ragMat);
  rightLeg.position.set(0.14, 0.74, 0);
  rightLeg.castShadow = true;
  tagHitbox(rightLeg, 'body');

  const bootGeo = new THREE.BoxGeometry(0.2, 0.17, 0.26);
  const leftBoot = new THREE.Mesh(bootGeo, plateMat);
  leftBoot.position.set(0, -0.65, 0.03);
  leftLeg.add(leftBoot);
  tagHitbox(leftBoot, 'body');

  const rightBoot = new THREE.Mesh(bootGeo, plateMat);
  rightBoot.position.set(0, -0.65, 0.03);
  rightLeg.add(rightBoot);
  tagHitbox(rightBoot, 'body');

  // Hunched torso
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(isBrute ? 0.56 : 0.44, 0.64, isBrute ? 0.34 : 0.25),
    ragMat
  );
  torso.position.set(0, 1.04, 0.04);
  torso.rotation.x = isRunner ? 0.26 : 0.15;
  torso.castShadow = true;
  tagHitbox(torso, 'body');

  // Bio-infected core or cracked chest ribs
  const chestDetail = new THREE.Mesh(
    new THREE.BoxGeometry(isBrute ? 0.26 : 0.28, isBrute ? 0.24 : 0.34, isBrute ? 0.36 : 0.27),
    isBrute ? eyeMat : bloodMat
  );
  chestDetail.position.set(0, 1.09, 0.06);
  chestDetail.rotation.x = torso.rotation.x;
  tagHitbox(chestDetail, 'body');

  if (isBrute) {
    const chestArmor = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.38, 0.38), plateMat);
    chestArmor.position.set(0, 1.18, 0.04);
    chestArmor.castShadow = true;
    tagHitbox(chestArmor, 'body');
    bodyPivot.add(chestArmor);

    const pauldronGeo = new THREE.BoxGeometry(0.22, 0.22, 0.28);
    const lPauldron = new THREE.Mesh(pauldronGeo, plateMat);
    lPauldron.position.set(-0.36, 1.32, 0.04);
    tagHitbox(lPauldron, 'body');
    const rPauldron = new THREE.Mesh(pauldronGeo, plateMat);
    rPauldron.position.set(0.36, 1.32, 0.04);
    tagHitbox(rPauldron, 'body');
    bodyPivot.add(lPauldron, rPauldron);
  }

  // Outstretched zombie arms with clawed hands
  const armW = isBrute ? 0.17 : 0.12;
  const armLen = isBrute ? 0.54 : 0.48;
  const armGeo = new THREE.BoxGeometry(armW, armW, armLen);
  armGeo.translate(0, 0, armLen * 0.46);
  const clawGeo = new THREE.BoxGeometry(armW * 0.85, 0.08, 0.16);

  const leftArm = new THREE.Group();
  leftArm.position.set(isBrute ? -0.35 : -0.28, 1.24, 0.08);
  const lArmMesh = new THREE.Mesh(armGeo, skinMat);
  tagHitbox(lArmMesh, 'body');
  const lClaw = new THREE.Mesh(clawGeo, bloodMat);
  lClaw.position.set(0, -0.02, armLen * 0.94);
  tagHitbox(lClaw, 'body');
  leftArm.add(lArmMesh, lClaw);
  leftArm.rotation.x = isRunner ? -0.25 : -0.1;

  const rightArm = new THREE.Group();
  rightArm.position.set(isBrute ? 0.35 : 0.28, 1.24, 0.08);
  const rArmMesh = new THREE.Mesh(armGeo, skinMat);
  tagHitbox(rArmMesh, 'body');
  const rClaw = new THREE.Mesh(clawGeo, bloodMat);
  rClaw.position.set(0, -0.02, armLen * 0.94);
  tagHitbox(rClaw, 'body');
  rightArm.add(rArmMesh, rClaw);
  rightArm.rotation.x = isRunner ? -0.25 : -0.1;

  // Head + Jaw + Glowing Necrotic Eyes
  const headMesh = new THREE.Mesh(
    new THREE.BoxGeometry(isBrute ? 0.34 : 0.29, isBrute ? 0.34 : 0.3, isBrute ? 0.34 : 0.31),
    isBrute ? plateMat : skinMat
  );
  headMesh.position.set(0, 1.5, isRunner ? 0.14 : 0.1);
  headMesh.rotation.z = isBrute ? 0 : 0.09;
  headMesh.castShadow = true;
  tagHitbox(headMesh, 'head');

  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.09, 0.24), bloodMat);
  jaw.position.set(0, 1.38, (isRunner ? 0.14 : 0.1) + 0.05);
  tagHitbox(jaw, 'head');

  const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.045, 0.05), eyeMat);
  leftEye.position.set(-0.075, 1.53, (isRunner ? 0.14 : 0.1) + 0.15);
  tagHitbox(leftEye, 'head');

  const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.045, 0.05), eyeMat);
  rightEye.position.set(0.075, 1.53, (isRunner ? 0.14 : 0.1) + 0.15);
  tagHitbox(rightEye, 'head');

  const muzzleWorldAnchor = new THREE.Object3D();
  muzzleWorldAnchor.position.set(0, 0, armLen);
  rightArm.add(muzzleWorldAnchor);

  bodyPivot.add(
    leftLeg,
    rightLeg,
    torso,
    chestDetail,
    leftArm,
    rightArm,
    headMesh,
    jaw,
    leftEye,
    rightEye
  );

  const hitMeshes: THREE.Object3D[] = [
    headMesh,
    jaw,
    leftEye,
    rightEye,
    torso,
    chestDetail,
    leftLeg,
    rightLeg,
    lArmMesh,
    rArmMesh,
    lClaw,
    rClaw,
  ];

  return {
    root,
    bodyPivot,
    headMesh,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    muzzleWorldAnchor,
    hitMeshes,
  };
}
