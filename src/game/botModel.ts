import * as THREE from 'three';
import { TeamId, WeaponId } from './types';

export interface CombatantRig {
  root: THREE.Group;
  bodyPivot: THREE.Group;
  headMesh: THREE.Mesh;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  rightArm: THREE.Group;
  muzzleWorldAnchor: THREE.Object3D;
  hitMeshes: THREE.Object3D[];
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

let sharedShadowTex: THREE.CanvasTexture | null = null;

export function buildCombatantRig(
  combatantId: string,
  team: TeamId,
  weaponId: WeaponId
): CombatantRig {
  const root = new THREE.Group();
  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  if (!sharedShadowTex) {
    sharedShadowTex = createContactShadowTexture();
  }

  // Grounded contact shadow disc beneath feet
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
  const armorColor = isBlue ? 0x1e40af : 0x991b1b;
  const trimColor = isBlue ? 0x3b82f6 : 0xef4444;
  const bduColor = isBlue ? 0x1f2937 : 0x262124;

  const armorMat = new THREE.MeshStandardMaterial({
    color: armorColor,
    metalness: 0.35,
    roughness: 0.48,
  });
  const suitMat = new THREE.MeshStandardMaterial({
    color: bduColor,
    metalness: 0.08,
    roughness: 0.84,
  });
  const pouchMat = new THREE.MeshStandardMaterial({
    color: 0x171c23,
    metalness: 0.12,
    roughness: 0.78,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: trimColor,
    metalness: 0.55,
    roughness: 0.3,
    emissive: trimColor,
    emissiveIntensity: 0.45,
  });
  const visorMat = new THREE.MeshStandardMaterial({
    color: isBlue ? 0x38bdf8 : 0xf97316,
    metalness: 0.92,
    roughness: 0.1,
    emissive: isBlue ? 0x0284c7 : 0xea580c,
    emissiveIntensity: 0.75,
  });
  const gunMat = new THREE.MeshStandardMaterial({
    color: 0x1b222c,
    metalness: 0.85,
    roughness: 0.28,
  });

  const tagHitbox = (obj: THREE.Object3D, hitbox: 'head' | 'body') => {
    obj.userData.combatantId = combatantId;
    obj.userData.team = team;
    obj.userData.hitbox = hitbox;
  };

  // Articulated legs + combat boots + knee pads
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

  // Torso BDU + Tactical Plate Carrier + Mag Pouches + Hydration Pack
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.62, 0.26), suitMat);
  torso.position.set(0, 1.06, 0);
  torso.castShadow = true;
  tagHitbox(torso, 'body');

  const plateCarrier = new THREE.Mesh(new THREE.BoxGeometry(0.47, 0.44, 0.31), armorMat);
  plateCarrier.position.set(0, 1.12, 0);
  plateCarrier.castShadow = true;
  tagHitbox(plateCarrier, 'body');

  // Front magazine pouches on plate carrier
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

  // Shoulder pauldrons & arms
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

  // Right weapon arm + realistic firearm silhouette
  const rightArm = new THREE.Group();
  rightArm.position.set(0.28, 1.24, 0.04);

  const armMesh = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.14, 0.44), suitMat);
  armMesh.position.set(0, -0.06, 0.2);
  tagHitbox(armMesh, 'body');
  rightArm.add(armMesh);

  const barrelLen =
    weaponId === 'm24'
      ? 0.9
      : weaponId === 'mk14'
      ? 0.78
      : weaponId === 'm870'
      ? 0.68
      : weaponId === 'mp5'
      ? 0.45
      : 0.62;

  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.34), gunMat);
  receiver.position.set(-0.04, -0.02, 0.42);
  rightArm.add(receiver);

  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, barrelLen, 8),
    gunMat
  );
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(-0.04, 0.015, 0.42 + barrelLen * 0.45);
  rightArm.add(barrel);

  if (weaponId === 'm24' || weaponId === 'mk14') {
    const scope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.24, 8),
      gunMat
    );
    scope.rotation.x = Math.PI / 2;
    scope.position.set(-0.04, 0.075, 0.44);
    rightArm.add(scope);
  }

  const muzzleWorldAnchor = new THREE.Object3D();
  muzzleWorldAnchor.position.set(-0.04, 0.015, 0.42 + barrelLen * 0.92);
  rightArm.add(muzzleWorldAnchor);

  // Ops-Core style tactical helmet + NVG mount + goggles + comms visor
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
  };
}
