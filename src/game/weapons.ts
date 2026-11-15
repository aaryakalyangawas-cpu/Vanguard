import * as THREE from 'three';
import { createWeaponDetailTextures } from './textures';
import { WeaponId, WeaponSpec } from './types';

export const WEAPON_ORDER: WeaponId[] = ['m4a1', 'ak74', 'mp5', 'm870', 'mk14', 'm24', 'rpg7'];

export const WEAPONS: Record<WeaponId, WeaponSpec> = {
  m4a1: {
    id: 'm4a1',
    slot: 1,
    name: 'M4A1 SOPMOD',
    shortName: 'M4A1',
    caliber: '5.56×45mm NATO',
    role: 'Assault Carbine',
    fireMode: 'AUTO',
    damage: 24,
    headshotMult: 1.75,
    pellets: 1,
    rpm: 700,
    magSize: 30,
    reserveMax: 150,
    reloadTime: 1.65,
    baseSpread: 0.01,
    adsSpread: 0.0022,
    moveSpreadPenalty: 0.015,
    recoilPitch: 0.02,
    recoilYaw: 0.008,
    adsFov: 54,
    moveSpeedMult: 1.0,
    range: 145,
    muzzleVelocity: 215,
    gravityScale: 0.65,
    tracerColor: 0xfbbf24,
    accentHex: '#F59E0B',
  },
  ak74: {
    id: 'ak74',
    slot: 2,
    name: 'AK-74M',
    shortName: 'AK-74M',
    caliber: '5.45×39mm',
    role: 'Heavy Assault',
    fireMode: 'AUTO',
    damage: 29,
    headshotMult: 1.8,
    pellets: 1,
    rpm: 600,
    magSize: 30,
    reserveMax: 150,
    reloadTime: 1.85,
    baseSpread: 0.013,
    adsSpread: 0.003,
    moveSpreadPenalty: 0.018,
    recoilPitch: 0.028,
    recoilYaw: 0.013,
    adsFov: 55,
    moveSpeedMult: 0.98,
    range: 150,
    muzzleVelocity: 205,
    gravityScale: 0.72,
    tracerColor: 0xf97316,
    accentHex: '#F97316',
  },
  mp5: {
    id: 'mp5',
    slot: 3,
    name: 'MP5A3 Tactical',
    shortName: 'MP5A3',
    caliber: '9×19mm Parabellum',
    role: 'Submachine Gun',
    fireMode: 'AUTO',
    damage: 18,
    headshotMult: 1.65,
    pellets: 1,
    rpm: 880,
    magSize: 30,
    reserveMax: 150,
    reloadTime: 1.35,
    baseSpread: 0.015,
    adsSpread: 0.0045,
    moveSpreadPenalty: 0.009,
    recoilPitch: 0.012,
    recoilYaw: 0.009,
    adsFov: 58,
    moveSpeedMult: 1.1,
    range: 95,
    muzzleVelocity: 155,
    gravityScale: 0.95,
    tracerColor: 0x38bdf8,
    accentHex: '#38BDF8',
  },
  m870: {
    id: 'm870',
    slot: 4,
    name: 'M870 MCS Breacher',
    shortName: 'M870',
    caliber: '12-Gauge 00 Buck',
    role: 'Pump Shotgun',
    fireMode: 'PUMP',
    damage: 19,
    headshotMult: 1.5,
    pellets: 8,
    rpm: 78,
    magSize: 6,
    reserveMax: 30,
    reloadTime: 2.05,
    baseSpread: 0.065,
    adsSpread: 0.042,
    moveSpreadPenalty: 0.014,
    recoilPitch: 0.072,
    recoilYaw: 0.022,
    adsFov: 60,
    moveSpeedMult: 1.02,
    range: 48,
    muzzleVelocity: 135,
    gravityScale: 1.1,
    tracerColor: 0xfb923c,
    accentHex: '#FB923C',
  },
  mk14: {
    id: 'mk14',
    slot: 5,
    name: 'MK14 EBR',
    shortName: 'MK14 EBR',
    caliber: '7.62×51mm NATO',
    role: 'Marksman Rifle',
    fireMode: 'SEMI',
    damage: 52,
    headshotMult: 1.85,
    pellets: 1,
    rpm: 230,
    magSize: 10,
    reserveMax: 50,
    reloadTime: 2.1,
    baseSpread: 0.018,
    adsSpread: 0.001,
    moveSpreadPenalty: 0.024,
    recoilPitch: 0.052,
    recoilYaw: 0.014,
    adsFov: 42,
    moveSpeedMult: 0.94,
    range: 175,
    muzzleVelocity: 245,
    gravityScale: 0.55,
    tracerColor: 0xfacc15,
    accentHex: '#FACC15',
  },
  m24: {
    id: 'm24',
    slot: 6,
    name: 'M24 SWS',
    shortName: 'M24 SWS',
    caliber: '7.62×51mm Match',
    role: 'Bolt-Action Sniper',
    fireMode: 'BOLT',
    damage: 80,
    headshotMult: 1.9,
    pellets: 1,
    rpm: 50,
    magSize: 5,
    reserveMax: 25,
    reloadTime: 2.35,
    baseSpread: 0.036,
    adsSpread: 0.0004,
    moveSpreadPenalty: 0.038,
    recoilPitch: 0.09,
    recoilYaw: 0.014,
    adsFov: 26,
    moveSpeedMult: 0.91,
    range: 210,
    muzzleVelocity: 275,
    gravityScale: 0.48,
    tracerColor: 0x93c5fd,
    accentHex: '#60A5FA',
  },
  rpg7: {
    id: 'rpg7',
    slot: 7,
    name: 'RPG-7V2 Launcher',
    shortName: 'RPG-7',
    caliber: '85mm PG-7V HEAT',
    role: 'Rocket Launcher',
    fireMode: 'ROCKET',
    damage: 160,
    headshotMult: 1.0,
    pellets: 1,
    rpm: 30,
    magSize: 1,
    reserveMax: 3,
    reloadTime: 2.45,
    baseSpread: 0.012,
    adsSpread: 0.003,
    moveSpreadPenalty: 0.02,
    recoilPitch: 0.11,
    recoilYaw: 0.02,
    adsFov: 44,
    moveSpeedMult: 0.88,
    range: 180,
    muzzleVelocity: 46,
    gravityScale: 0.25,
    tracerColor: 0xff6b2b,
    accentHex: '#EF4444',
  },
};

export interface ViewmodelHandle {
  root: THREE.Group;
  muzzleFlash: THREE.Group;
  muzzlePoint: THREE.Object3D;
  ejectionPort: THREE.Object3D;
  boltCarrier?: THREE.Mesh;
  pumpSlide?: THREE.Mesh;
  warheadGroup?: THREE.Group;
}

let sharedWeaponTex: ReturnType<typeof createWeaponDetailTextures> | null = null;

function addPicatinnyRail(
  parent: THREE.Group,
  x: number,
  y: number,
  zStart: number,
  length: number,
  mat: THREE.Material
) {
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.008, length), mat);
  base.position.set(x, y, zStart);
  parent.add(base);

  const teethCount = Math.floor(length / 0.02);
  const toothGeo = new THREE.BoxGeometry(0.028, 0.005, 0.009);
  for (let i = 0; i < teethCount; i++) {
    const t = new THREE.Mesh(toothGeo, mat);
    t.position.set(x, y + 0.005, zStart - length / 2 + 0.01 + i * 0.02);
    parent.add(t);
  }
}

function addFirstPersonHands(
  parent: THREE.Group,
  supportZ: number,
  supportY: number,
  gripZ: number
) {
  const sleeveMat = new THREE.MeshStandardMaterial({
    color: 0x2a313b,
    metalness: 0.06,
    roughness: 0.88,
  });
  const gloveMat = new THREE.MeshStandardMaterial({
    color: 0x15181e,
    metalness: 0.14,
    roughness: 0.72,
  });
  const knuckleMat = new THREE.MeshStandardMaterial({
    color: 0x262b34,
    metalness: 0.35,
    roughness: 0.45,
  });

  // Right trigger hand & sleeve
  const rightHand = new THREE.Group();
  rightHand.position.set(0.01, -0.085, gripZ);
  const rPalm = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.068, 0.072), gloveMat);
  const rKnuckle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.055), knuckleMat);
  rKnuckle.position.set(0, 0.02, -0.015);
  const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.068, 0.28), sleeveMat);
  rArm.position.set(0.045, -0.05, 0.17);
  rArm.rotation.set(0.28, -0.18, 0);
  rightHand.add(rPalm, rKnuckle, rArm);
  parent.add(rightHand);

  // Left support hand & angled forearm
  const leftHand = new THREE.Group();
  leftHand.position.set(-0.018, supportY, supportZ);
  const lPalm = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.052, 0.085), gloveMat);
  const lThumb = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.026, 0.055), gloveMat);
  lThumb.position.set(-0.026, 0.028, -0.01);
  const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.066, 0.066, 0.32), sleeveMat);
  lArm.position.set(-0.095, -0.075, 0.16);
  lArm.rotation.set(0.32, 0.42, 0.15);
  leftHand.add(lPalm, lThumb, lArm);
  parent.add(leftHand);
}

export function buildWeaponViewmodel(weaponId: WeaponId): ViewmodelHandle {
  const root = new THREE.Group();

  if (!sharedWeaponTex) {
    sharedWeaponTex = createWeaponDetailTextures();
  }

  const parkerizedSteel = new THREE.MeshStandardMaterial({
    color: 0x1e242d,
    metalness: 0.86,
    roughness: 0.28,
    bumpMap: sharedWeaponTex.brushedBump,
    bumpScale: 0.004,
  });
  const brushedSteel = new THREE.MeshStandardMaterial({
    color: 0x454f5e,
    metalness: 0.9,
    roughness: 0.22,
    bumpMap: sharedWeaponTex.brushedBump,
    bumpScale: 0.005,
  });
  const polymerMat = new THREE.MeshStandardMaterial({
    color: 0x14171c,
    metalness: 0.1,
    roughness: 0.8,
  });
  const fdeTanMat = new THREE.MeshStandardMaterial({
    color: 0x7c6a52,
    metalness: 0.18,
    roughness: 0.65,
  });
  const oliveDrabMat = new THREE.MeshStandardMaterial({
    color: 0x3b4833,
    metalness: 0.35,
    roughness: 0.56,
  });
  const bakeliteMat = new THREE.MeshStandardMaterial({
    color: 0x8b3a1e,
    metalness: 0.14,
    roughness: 0.52,
  });
  const walnutMat = new THREE.MeshStandardMaterial({
    map: sharedWeaponTex.woodMap,
    color: 0x8a583a,
    metalness: 0.06,
    roughness: 0.66,
  });
  const chromeBoltMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.95,
    roughness: 0.16,
  });
  const opticGlass = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    metalness: 0.95,
    roughness: 0.06,
    transparent: true,
    opacity: 0.48,
  });
  const tritiumMat = new THREE.MeshStandardMaterial({
    color: 0x34d399,
    emissive: 0x10b981,
    emissiveIntensity: 1.1,
    roughness: 0.2,
  });

  const addPart = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    rx = 0,
    ry = 0,
    rz = 0
  ) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    root.add(mesh);
    return mesh;
  };

  let muzzleZ = -0.7;
  let ejPos = new THREE.Vector3(0.036, 0.02, -0.05);
  let boltCarrier: THREE.Mesh | undefined;
  let pumpSlide: THREE.Mesh | undefined;
  let warheadGroup: THREE.Group | undefined;

  if (weaponId === 'm4a1') {
    // Upper & lower forged receiver
    addPart(new THREE.BoxGeometry(0.056, 0.064, 0.28), parkerizedSteel, 0, 0.012, -0.04);
    addPart(new THREE.BoxGeometry(0.052, 0.045, 0.22), parkerizedSteel, 0, -0.025, -0.04);
    boltCarrier = addPart(new THREE.BoxGeometry(0.014, 0.022, 0.075), chromeBoltMat, 0.025, 0.018, -0.05);
    addPart(new THREE.BoxGeometry(0.058, 0.06, 0.26), polymerMat, 0, 0.015, -0.32);
    addPicatinnyRail(root, 0, 0.048, -0.18, 0.48, parkerizedSteel);
    addPart(new THREE.CylinderGeometry(0.012, 0.013, 0.34, 12), brushedSteel, 0, 0.016, -0.52, Math.PI / 2);
    addPart(new THREE.CylinderGeometry(0.017, 0.016, 0.065, 10), parkerizedSteel, 0, 0.016, -0.7, Math.PI / 2);
    addPart(new THREE.BoxGeometry(0.014, 0.055, 0.03), parkerizedSteel, 0, 0.05, -0.52);
    addPart(new THREE.BoxGeometry(0.036, 0.13, 0.068), brushedSteel, 0, -0.1, -0.11, 0.16);
    addPart(new THREE.CylinderGeometry(0.018, 0.016, 0.095, 10), fdeTanMat, 0, -0.06, -0.31);
    addPart(new THREE.BoxGeometry(0.04, 0.11, 0.048), polymerMat, 0, -0.08, 0.07, -0.32);
    addPart(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 10), parkerizedSteel, 0, 0.008, 0.19, Math.PI / 2);
    addPart(new THREE.BoxGeometry(0.052, 0.09, 0.16), fdeTanMat, 0, -0.01, 0.23);
    addPart(new THREE.BoxGeometry(0.054, 0.046, 0.088), parkerizedSteel, 0, 0.08, -0.04);
    addPart(new THREE.BoxGeometry(0.04, 0.03, 0.008), opticGlass, 0, 0.082, -0.04);
    addPart(new THREE.BoxGeometry(0.005, 0.005, 0.005), tritiumMat, 0, 0.082, -0.04);
    addFirstPersonHands(root, -0.31, -0.05, 0.065);
    muzzleZ = -0.74;
  } else if (weaponId === 'ak74') {
    addPart(new THREE.BoxGeometry(0.054, 0.07, 0.32), parkerizedSteel, 0, 0.005, -0.05);
    addPart(new THREE.CylinderGeometry(0.025, 0.025, 0.29, 10, 1, false, -Math.PI / 2, Math.PI), brushedSteel, 0, 0.038, -0.04, Math.PI / 2);
    boltCarrier = addPart(new THREE.BoxGeometry(0.018, 0.018, 0.085), chromeBoltMat, 0.026, 0.02, -0.06);
    addPart(new THREE.BoxGeometry(0.052, 0.058, 0.24), walnutMat, 0, 0.006, -0.33);
    addPart(new THREE.CylinderGeometry(0.014, 0.014, 0.23, 10), walnutMat, 0, 0.038, -0.33, Math.PI / 2);
    addPart(new THREE.CylinderGeometry(0.012, 0.013, 0.34, 12), parkerizedSteel, 0, 0.012, -0.54, Math.PI / 2);
    addPart(new THREE.CylinderGeometry(0.018, 0.016, 0.085, 10), brushedSteel, 0, 0.012, -0.73, Math.PI / 2);
    addPart(new THREE.BoxGeometry(0.012, 0.045, 0.02), parkerizedSteel, 0, 0.042, -0.66);
    addPart(new THREE.BoxGeometry(0.036, 0.145, 0.07), bakeliteMat, 0, -0.105, -0.15, 0.28);
    addPart(new THREE.BoxGeometry(0.04, 0.11, 0.046), bakeliteMat, 0, -0.08, 0.06, -0.3);
    addPart(new THREE.BoxGeometry(0.046, 0.086, 0.22), polymerMat, 0, -0.018, 0.22, 0.06);
    addPart(new THREE.BoxGeometry(0.044, 0.038, 0.095), parkerizedSteel, 0, 0.078, -0.05);
    addPart(new THREE.BoxGeometry(0.032, 0.026, 0.008), opticGlass, 0, 0.08, -0.05);
    addFirstPersonHands(root, -0.32, -0.04, 0.055);
    muzzleZ = -0.78;
  } else if (weaponId === 'mp5') {
    addPart(new THREE.CylinderGeometry(0.024, 0.024, 0.36, 12), parkerizedSteel, 0, 0.026, -0.1, Math.PI / 2);
    addPart(new THREE.BoxGeometry(0.048, 0.052, 0.24), polymerMat, 0, -0.012, -0.06);
    boltCarrier = addPart(new THREE.BoxGeometry(0.012, 0.016, 0.065), brushedSteel, 0.022, 0.024, -0.06);
    addPart(new THREE.CylinderGeometry(0.026, 0.024, 0.2, 12), polymerMat, 0, 0.004, -0.33, Math.PI / 2);
    addPart(new THREE.CylinderGeometry(0.021, 0.021, 0.22, 14), parkerizedSteel, 0, 0.026, -0.49, Math.PI / 2);
    addPart(new THREE.CylinderGeometry(0.015, 0.015, 0.024, 12, 1, true), parkerizedSteel, 0, 0.06, -0.36, Math.PI / 2);
    addPart(new THREE.CylinderGeometry(0.013, 0.013, 0.026, 10), parkerizedSteel, 0, 0.058, 0.02);
    addPart(new THREE.BoxGeometry(0.03, 0.16, 0.044), brushedSteel, 0, -0.1, -0.16, 0.18);
    addPart(new THREE.BoxGeometry(0.04, 0.105, 0.046), polymerMat, 0, -0.075, 0.04, -0.28);
    addPart(new THREE.BoxGeometry(0.044, 0.068, 0.14), polymerMat, 0, 0.0, 0.16);
    addPart(new THREE.BoxGeometry(0.038, 0.028, 0.06), parkerizedSteel, 0, 0.065, -0.08);
    addPart(new THREE.BoxGeometry(0.026, 0.02, 0.008), opticGlass, 0, 0.068, -0.08);
    addFirstPersonHands(root, -0.32, -0.04, 0.04);
    muzzleZ = -0.61;
  } else if (weaponId === 'm870') {
    addPart(new THREE.BoxGeometry(0.058, 0.072, 0.28), parkerizedSteel, 0, 0.004, -0.02);
    boltCarrier = addPart(new THREE.BoxGeometry(0.014, 0.028, 0.075), chromeBoltMat, 0.026, 0.01, -0.04);
    addPart(new THREE.CylinderGeometry(0.016, 0.017, 0.56, 12), brushedSteel, 0, 0.032, -0.42, Math.PI / 2);
    addPart(new THREE.CylinderGeometry(0.015, 0.015, 0.48, 12), parkerizedSteel, 0, -0.004, -0.38, Math.PI / 2);
    pumpSlide = addPart(new THREE.CylinderGeometry(0.028, 0.028, 0.18, 10), polymerMat, 0, -0.008, -0.34, Math.PI / 2);
    addPart(new THREE.BoxGeometry(0.034, 0.022, 0.032), parkerizedSteel, 0, 0.048, 0.04);
    addPart(new THREE.BoxGeometry(0.01, 0.018, 0.012), tritiumMat, 0, 0.054, -0.66);
    const shellMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.4 });
    for (let s = 0; s < 4; s++) {
      addPart(new THREE.CylinderGeometry(0.009, 0.009, 0.055, 8), shellMat, -0.034, 0.006, -0.08 + s * 0.025);
    }
    addPart(new THREE.BoxGeometry(0.044, 0.11, 0.05), polymerMat, 0, -0.075, 0.1, -0.34);
    addPart(new THREE.BoxGeometry(0.05, 0.088, 0.22), polymerMat, 0, -0.022, 0.23, 0.08);
    addFirstPersonHands(root, -0.34, -0.045, 0.09);
    muzzleZ = -0.71;
  } else if (weaponId === 'mk14') {
    addPart(new THREE.BoxGeometry(0.06, 0.072, 0.38), fdeTanMat, 0, 0.0, -0.08);
    addPart(new THREE.BoxGeometry(0.054, 0.044, 0.26), parkerizedSteel, 0, 0.038, -0.1);
    boltCarrier = addPart(new THREE.BoxGeometry(0.016, 0.024, 0.09), brushedSteel, 0.028, 0.032, -0.07);
    addPicatinnyRail(root, 0, 0.064, -0.16, 0.36, parkerizedSteel);
    addPart(new THREE.CylinderGeometry(0.014, 0.015, 0.44, 12), brushedSteel, 0, 0.024, -0.5, Math.PI / 2);
    addPart(new THREE.CylinderGeometry(0.019, 0.017, 0.07, 10), parkerizedSteel, 0, 0.024, -0.74, Math.PI / 2);
    addPart(new THREE.CylinderGeometry(0.009, 0.009, 0.16, 8), parkerizedSteel, -0.024, -0.036, -0.4, Math.PI / 2);
    addPart(new THREE.CylinderGeometry(0.009, 0.009, 0.16, 8), parkerizedSteel, 0.024, -0.036, -0.4, Math.PI / 2);
    addPart(new THREE.BoxGeometry(0.04, 0.105, 0.082), parkerizedSteel, 0, -0.082, -0.13, 0.06);
    addPart(new THREE.BoxGeometry(0.042, 0.11, 0.048), polymerMat, 0, -0.08, 0.07, -0.3);
    addPart(new THREE.BoxGeometry(0.048, 0.082, 0.2), fdeTanMat, 0, 0.002, 0.21);
    addPart(new THREE.CylinderGeometry(0.02, 0.02, 0.18, 12), parkerizedSteel, 0, 0.095, -0.08, Math.PI / 2);
    addPart(new THREE.CylinderGeometry(0.026, 0.021, 0.055, 12), parkerizedSteel, 0, 0.095, -0.18, Math.PI / 2);
    addPart(new THREE.CylinderGeometry(0.022, 0.022, 0.01, 12), opticGlass, 0, 0.095, 0.01, Math.PI / 2);
    addFirstPersonHands(root, -0.3, -0.045, 0.065);
    muzzleZ = -0.78;
  } else if (weaponId === 'm24') {
    addPart(new THREE.BoxGeometry(0.056, 0.068, 0.52), polymerMat, 0, -0.006, -0.06);
    addPart(new THREE.BoxGeometry(0.052, 0.082, 0.26), polymerMat, 0, -0.018, 0.24);
    addPart(new THREE.BoxGeometry(0.048, 0.034, 0.13), fdeTanMat, 0, 0.032, 0.2);
    addPart(new THREE.CylinderGeometry(0.025, 0.025, 0.24, 14), parkerizedSteel, 0, 0.028, -0.05, Math.PI / 2);
    boltCarrier = addPart(new THREE.CylinderGeometry(0.01, 0.01, 0.07, 8), brushedSteel, 0.028, 0.028, -0.02, 0, 0, Math.PI / 2);
    addPicatinnyRail(root, 0, 0.058, -0.06, 0.2, parkerizedSteel);
    addPart(new THREE.CylinderGeometry(0.016, 0.02, 0.66, 14), brushedSteel, 0, 0.028, -0.5, Math.PI / 2);
    addPart(new THREE.BoxGeometry(0.042, 0.032, 0.075), parkerizedSteel, 0, 0.028, -0.85);
    addPart(new THREE.CylinderGeometry(0.009, 0.009, 0.18, 8), parkerizedSteel, -0.022, -0.04, -0.45, Math.PI / 2);
    addPart(new THREE.CylinderGeometry(0.009, 0.009, 0.18, 8), parkerizedSteel, 0.022, -0.04, -0.45, Math.PI / 2);
    addPart(new THREE.CylinderGeometry(0.02, 0.02, 0.28, 14), parkerizedSteel, 0, 0.095, -0.08, Math.PI / 2);
    addPart(new THREE.CylinderGeometry(0.032, 0.023, 0.085, 14), parkerizedSteel, 0, 0.095, -0.25, Math.PI / 2);
    addPart(new THREE.CylinderGeometry(0.026, 0.026, 0.012, 14), opticGlass, 0, 0.095, 0.06, Math.PI / 2);
    addFirstPersonHands(root, -0.29, -0.045, 0.08);
    muzzleZ = -0.9;
    ejPos = new THREE.Vector3(0.036, 0.03, -0.03);
  } else {
    // RPG-7V2 Shoulder-Fired Rocket Launcher
    // Main steel launch tube + flared muzzle collar
    addPart(new THREE.CylinderGeometry(0.032, 0.032, 0.88, 14), oliveDrabMat, 0, 0.022, -0.08, Math.PI / 2);
    addPart(new THREE.CylinderGeometry(0.038, 0.033, 0.06, 14), brushedSteel, 0, 0.022, -0.53, Math.PI / 2);
    // Wooden heatshield wrap around shoulder section
    addPart(new THREE.CylinderGeometry(0.039, 0.039, 0.34, 14), walnutMat, 0, 0.022, 0.08, Math.PI / 2);
    // Flared rear venturi exhaust cone
    addPart(new THREE.CylinderGeometry(0.033, 0.056, 0.16, 14), parkerizedSteel, 0, 0.022, 0.41, Math.PI / 2);
    // Dual grips (front trigger + rear stabilizing)
    addPart(new THREE.BoxGeometry(0.038, 0.105, 0.048), polymerMat, 0, -0.065, -0.22, -0.25);
    addPart(new THREE.BoxGeometry(0.036, 0.095, 0.044), polymerMat, 0, -0.062, -0.02, -0.18);
    // Iron sight post + PGO-7 side optical scope
    addPart(new THREE.BoxGeometry(0.012, 0.048, 0.022), parkerizedSteel, 0, 0.068, -0.46);
    addPart(new THREE.CylinderGeometry(0.018, 0.018, 0.16, 12), parkerizedSteel, -0.048, 0.065, -0.14, Math.PI / 2);
    addPart(new THREE.CylinderGeometry(0.024, 0.019, 0.045, 12), parkerizedSteel, -0.048, 0.065, -0.22, Math.PI / 2);
    addPart(new THREE.CylinderGeometry(0.02, 0.02, 0.01, 12), opticGlass, -0.048, 0.065, -0.06, Math.PI / 2);

    // Removable PG-7V Rocket Warhead seated in muzzle
    warheadGroup = new THREE.Group();
    warheadGroup.position.set(0, 0.022, -0.56);
    const boosterShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.16, 12),
      oliveDrabMat
    );
    boosterShaft.rotation.x = Math.PI / 2;
    boosterShaft.position.z = -0.04;
    const coneFront = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.052, 0.13, 14),
      oliveDrabMat
    );
    coneFront.rotation.x = Math.PI / 2;
    coneFront.position.z = -0.15;
    const coneTip = new THREE.Mesh(
      new THREE.ConeGeometry(0.052, 0.14, 14),
      oliveDrabMat
    );
    coneTip.rotation.x = -Math.PI / 2;
    coneTip.position.z = -0.285;
    const fuseProbe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.012, 0.06, 10),
      brushedSteel
    );
    fuseProbe.rotation.x = Math.PI / 2;
    fuseProbe.position.z = -0.36;
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(0.053, 0.053, 0.025, 14),
      fdeTanMat
    );
    band.rotation.x = Math.PI / 2;
    band.position.z = -0.21;
    warheadGroup.add(boosterShaft, coneFront, coneTip, fuseProbe, band);
    root.add(warheadGroup);

    addFirstPersonHands(root, -0.02, -0.045, -0.21);
    muzzleZ = -0.92;
  }

  // Muzzle flash star group
  const muzzleFlash = new THREE.Group();
  muzzleFlash.position.set(0, 0.022, muzzleZ);
  const flashMat = new THREE.MeshBasicMaterial({
    color: WEAPONS[weaponId].tracerColor,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
  });
  const flashCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.058, 0), flashMat);
  const flashCross1 = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.06), flashMat);
  const flashCross2 = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.26), flashMat);
  muzzleFlash.add(flashCore, flashCross1, flashCross2);
  muzzleFlash.visible = false;
  root.add(muzzleFlash);

  const muzzlePoint = new THREE.Object3D();
  muzzlePoint.position.set(0, 0.022, muzzleZ);
  root.add(muzzlePoint);

  const ejectionPort = new THREE.Object3D();
  ejectionPort.position.copy(ejPos);
  root.add(ejectionPort);

  return { root, muzzleFlash, muzzlePoint, ejectionPort, boltCarrier, pumpSlide, warheadGroup };
}

