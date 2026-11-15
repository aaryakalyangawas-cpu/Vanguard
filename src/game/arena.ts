import * as THREE from 'three';
import {
  createArenaFloorTextures,
  createBunkerFloorTextures,
  createConcreteWallTextures,
  createContainerTextures,
  createDesertFloorTextures,
  createSandbagTextures,
  createSandstoneTextures,
  createSoftGlowTexture,
  createSteelDeckTextures,
} from './textures';
import { MapId, MapInfo, VehicleType } from './types';

export const MAPS: Record<MapId, MapInfo> = {
  yard: {
    id: 'yard',
    name: 'Industrial Yard',
    environment: 'Dusk Cargo Terminal',
    sizeLabel: '140×140m · Armor & Infantry',
    description: 'Expanded cargo terminal with dual perimeter motorways, steel overpass, and armored vehicles.',
  },
  outpost: {
    id: 'outpost',
    name: 'Desert Outpost',
    environment: 'Arid Canyon FOB',
    sizeLabel: '160×160m · Long Range',
    description: 'Wide sandstone canyon compound, elevated watchtowers, and open armored vehicle flanks.',
  },
  bunker: {
    id: 'bunker',
    name: 'Cryo Bunker',
    environment: 'Subterranean Facility',
    sizeLabel: '120×120m · CQB + Armor',
    description: 'Large subterranean containment hall, central reactor platform, and wide armored corridors.',
  },
};

export const MAP_ORDER: MapId[] = ['yard', 'outpost', 'bunker'];

export interface BoxCollider {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export interface RampSurface {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  axis: 'x' | 'z';
  startCoord: number;
  endCoord: number;
  startY: number;
  endY: number;
}

export interface PickupNode {
  id: string;
  type: 'health' | 'ammo';
  position: THREE.Vector3;
  active: boolean;
  respawnTimer: number;
  meshGroup: THREE.Group;
}

export interface MountedMgNode {
  id: string;
  position: THREE.Vector3;
  baseYaw: number;
  currentYaw: number;
  currentPitch: number;
  heat: number;
  overheated: boolean;
  yawGroup: THREE.Group;
  pitchGroup: THREE.Group;
  muzzlePoint: THREE.Object3D;
  muzzleFlash: THREE.Group;
  barrelHeatMat: THREE.MeshStandardMaterial;
}

export interface VehicleNode {
  id: string;
  type: VehicleType;
  name: string;
  teamHint: 'blue' | 'red' | 'neutral';
  spawnPos: THREE.Vector3;
  spawnYaw: number;
  position: THREE.Vector3;
  yaw: number;
  speed: number;
  turretYaw: number;
  turretPitch: number;
  health: number;
  maxHealth: number;
  destroyed: boolean;
  respawnTimer: number;
  fireCooldown: number;
  root: THREE.Group;
  turretGroup: THREE.Group;
  barrelPivot: THREE.Group;
  muzzlePoint: THREE.Object3D;
  muzzleFlash: THREE.Group;
  wheels: THREE.Mesh[];
  hitMeshes: THREE.Object3D[];
  bodyMat: THREE.MeshStandardMaterial;
  occupantId: string | null;
}

export interface ArenaAtmosphere {
  bgColor: number;
  fogColor: number;
  fogDensity: number;
  sunColor: number;
  sunIntensity: number;
  sunPos: [number, number, number];
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
}

export interface ArenaData {
  mapId: MapId;
  rootGroup: THREE.Group;
  atmosphere: ArenaAtmosphere;
  colliders: BoxCollider[];
  ramps: RampSurface[];
  staticRayMeshes: THREE.Object3D[];
  blueSpawns: THREE.Vector3[];
  redSpawns: THREE.Vector3[];
  waypoints: THREE.Vector3[];
  pickups: PickupNode[];
  mountedMgs: MountedMgNode[];
  vehicles: VehicleNode[];
  halfSize: number;
  disposables: {
    geometries: THREE.BufferGeometry[];
    materials: THREE.Material[];
    textures: THREE.Texture[];
  };
}

function buildSkyDome(
  topHex: number,
  midHex: number,
  horizonHex: number,
  sunPos: [number, number, number],
  sunWarmth: [number, number, number],
  cloudOpacity: number,
  geometries: THREE.BufferGeometry[],
  materials: THREE.Material[]
): THREE.Mesh {
  const geo = new THREE.SphereGeometry(340, 32, 20);
  geometries.push(geo);

  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(topHex) },
      midColor: { value: new THREE.Color(midHex) },
      horizonColor: { value: new THREE.Color(horizonHex) },
      sunDir: { value: new THREE.Vector3(...sunPos).normalize() },
      sunGlow: { value: new THREE.Vector3(...sunWarmth) },
      cloudOpacity: { value: cloudOpacity },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 midColor;
      uniform vec3 horizonColor;
      uniform vec3 sunDir;
      uniform vec3 sunGlow;
      uniform float cloudOpacity;
      varying vec3 vWorldPos;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise2d(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
          v += a * noise2d(p);
          p *= 2.04;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec3 dir = normalize(vWorldPos);
        float h = clamp(dir.y, 0.0, 1.0);
        vec3 col = mix(horizonColor, midColor, smoothstep(0.0, 0.24, h));
        col = mix(col, topColor, smoothstep(0.22, 0.78, h));

        if (cloudOpacity > 0.01 && dir.y > 0.03) {
          vec2 cloudUv = dir.xz / (dir.y + 0.18) * 1.45;
          float c = fbm(cloudUv + vec2(1.7, 3.2));
          float wisp = smoothstep(0.46, 0.78, c) * smoothstep(0.03, 0.25, dir.y) * cloudOpacity;
          vec3 cloudCol = mix(horizonColor * 1.15, vec3(0.95, 0.9, 0.85), 0.35 + max(dot(dir, sunDir), 0.0) * 0.45);
          col = mix(col, cloudCol, wisp);
        }

        float sunAmt = max(dot(dir, sunDir), 0.0);
        col += sunGlow * pow(sunAmt, 20.0) * 0.45;
        col += vec3(1.0, 0.94, 0.85) * pow(sunAmt, 220.0) * 0.95;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  materials.push(mat);

  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  return mesh;
}

export function createTacticalArena(
  scene: THREE.Scene,
  maxAnisotropy: number,
  mapId: MapId = 'yard'
): ArenaData {
  const rootGroup = new THREE.Group();
  scene.add(rootGroup);

  const colliders: BoxCollider[] = [];
  const ramps: RampSurface[] = [];
  const staticRayMeshes: THREE.Object3D[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  const addBox = (
    x: number,
    yCenter: number,
    z: number,
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
    registerCollider = true,
    castShadow = true
  ) => {
    const mesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(w, h, d)), mat);
    mesh.position.set(x, yCenter, z);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    rootGroup.add(mesh);
    staticRayMeshes.push(mesh);

    if (registerCollider) {
      colliders.push({
        minX: x - w / 2,
        maxX: x + w / 2,
        minY: yCenter - h / 2,
        maxY: yCenter + h / 2,
        minZ: z - d / 2,
        maxZ: z + d / 2,
      });
    }
    return mesh;
  };

  const buildRamp = (
    x1: number,
    x2: number,
    zCenter: number,
    widthZ: number,
    y1: number,
    y2: number,
    mat: THREE.Material
  ) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const mesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(length, 0.35, widthZ)), mat);
    mesh.position.set((x1 + x2) / 2, (y1 + y2) / 2 - 0.16, zCenter);
    mesh.rotation.z = angle;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    rootGroup.add(mesh);
    staticRayMeshes.push(mesh);

    ramps.push({
      minX: Math.min(x1, x2),
      maxX: Math.max(x1, x2),
      minZ: zCenter - widthZ / 2,
      maxZ: zCenter + widthZ / 2,
      axis: 'x',
      startCoord: x1,
      endCoord: x2,
      startY: y1,
      endY: y2,
    });
  };

  const buildZRamp = (
    xCenter: number,
    widthX: number,
    z1: number,
    z2: number,
    y1: number,
    y2: number,
    mat: THREE.Material
  ) => {
    const dz = z2 - z1;
    const dy = y2 - y1;
    const length = Math.hypot(dz, dy);
    const angle = Math.atan2(dy, dz);
    const mesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(widthX, 0.35, length)), mat);
    mesh.position.set(xCenter, (y1 + y2) / 2 - 0.16, (z1 + z2) / 2);
    mesh.rotation.x = -angle;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    rootGroup.add(mesh);
    staticRayMeshes.push(mesh);

    ramps.push({
      minX: xCenter - widthX / 2,
      maxX: xCenter + widthX / 2,
      minZ: Math.min(z1, z2),
      maxZ: Math.max(z1, z2),
      axis: 'z',
      startCoord: z1,
      endCoord: z2,
      startY: y1,
      endY: y2,
    });
  };

  // Shared Pickup Materials
  const darkMetalMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x1e2530, roughness: 0.34, metalness: 0.86 })
  );
  const accentBlueMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      emissive: 0x2563eb,
      emissiveIntensity: 0.75,
      roughness: 0.25,
    })
  );
  const accentRedMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 0.75,
      roughness: 0.25,
    })
  );
  const amberMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.65,
      roughness: 0.25,
    })
  );
  const medMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.85,
      roughness: 0.25,
      metalness: 0.3,
    })
  );
  const ammoMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.75,
      roughness: 0.3,
      metalness: 0.55,
    })
  );
  const whiteMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.38 })
  );

  const spawnPickups = (
    defs: Array<{ id: string; type: 'health' | 'ammo'; x: number; y: number; z: number }>
  ): PickupNode[] => {
    const list: PickupNode[] = [];
    for (const def of defs) {
      const pad = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.65, 0.75, 0.1, 16)),
        darkMetalMat
      );
      pad.position.set(def.x, def.y + 0.05, def.z);
      rootGroup.add(pad);

      const meshGroup = new THREE.Group();
      meshGroup.position.set(def.x, def.y + 0.65, def.z);

      if (def.type === 'health') {
        const box = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.55, 0.4, 0.55)), whiteMat);
        const cross1 = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.36, 0.12, 0.58)), medMat);
        const cross2 = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.12, 0.36, 0.58)), medMat);
        meshGroup.add(box, cross1, cross2);
      } else {
        const crate = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.6, 0.42, 0.44)), ammoMat);
        const band = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.62, 0.09, 0.46)), darkMetalMat);
        meshGroup.add(crate, band);
      }

      rootGroup.add(meshGroup);
      list.push({
        id: def.id,
        type: def.type,
        position: new THREE.Vector3(def.x, def.y, def.z),
        active: true,
        respawnTimer: 0,
        meshGroup,
      });
    }
    return list;
  };

  const sandbagTexSet = createSandbagTextures(maxAnisotropy);
  const warmGlowTex = createSoftGlowTexture(
    'rgba(255, 244, 214, 0.95)',
    'rgba(255, 190, 110, 0.35)',
    'rgba(255, 140, 40, 0)'
  );
  const cyanGlowTex = createSoftGlowTexture(
    'rgba(186, 230, 253, 0.95)',
    'rgba(34, 211, 238, 0.38)',
    'rgba(6, 182, 212, 0)'
  );
  textures.push(sandbagTexSet.map, sandbagTexSet.bumpMap, warmGlowTex, cyanGlowTex);

  const sandbagMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: sandbagTexSet.map,
      bumpMap: sandbagTexSet.bumpMap,
      bumpScale: 0.06,
      roughness: 0.92,
      metalness: 0.04,
    })
  );
  const drumRedMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x8b2620, roughness: 0.52, metalness: 0.55 })
  );
  const drumOliveMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x3b4d36, roughness: 0.56, metalness: 0.48 })
  );
  const brassBeltMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness: 0.25, metalness: 0.88 })
  );
  const gunSteelMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x1e242c, roughness: 0.28, metalness: 0.88 })
  );
  const oliveBoxMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x38452e, roughness: 0.65, metalness: 0.25 })
  );

  const addOilDrum = (x: number, yBase: number, z: number, olive = false) => {
    const mat = olive ? drumOliveMat : drumRedMat;
    const drum = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.42, 0.42, 1.18, 14)), mat);
    drum.position.set(x, yBase + 0.59, z);
    drum.castShadow = true;
    drum.receiveShadow = true;
    rootGroup.add(drum);
    staticRayMeshes.push(drum);

    // Steel stiffening ribs
    for (const ry of [-0.26, 0.26]) {
      const rib = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.44, 0.44, 0.05, 14)), darkMetalMat);
      rib.position.y = ry;
      drum.add(rib);
    }

    colliders.push({
      minX: x - 0.44,
      maxX: x + 0.44,
      minY: yBase,
      maxY: yBase + 1.18,
      minZ: z - 0.44,
      maxZ: z + 0.44,
    });
  };

  const addMountedMg = (
    id: string,
    x: number,
    yBase: number,
    z: number,
    baseYaw: number,
    withSandbags = true
  ): MountedMgNode => {
    const nest = new THREE.Group();
    nest.position.set(x, yBase, z);
    nest.rotation.y = baseYaw;
    rootGroup.add(nest);

    // Protective low sandbag arc in front of turret (-Z local direction)
    if (withSandbags) {
      const frontBag = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.1, 0.92, 0.58)), sandbagMat);
      frontBag.position.set(0, 0.46, -1.05);
      frontBag.castShadow = true;
      frontBag.receiveShadow = true;
      nest.add(frontBag);
      staticRayMeshes.push(frontBag);

      // Register world-aligned sandbag collider in front of turret
      const fwX = -Math.sin(baseYaw);
      const fwZ = -Math.cos(baseYaw);
      const bagWx = x + fwX * 1.05;
      const bagWz = z + fwZ * 1.05;
      const absCos = Math.abs(Math.cos(baseYaw));
      const absSin = Math.abs(Math.sin(baseYaw));
      const hx = absCos * 1.05 + absSin * 0.3;
      const hz = absSin * 1.05 + absCos * 0.3;
      colliders.push({
        minX: bagWx - hx,
        maxX: bagWx + hx,
        minY: yBase,
        maxY: yBase + 0.92,
        minZ: bagWz - hz,
        maxZ: bagWz + hz,
      });
    }

    // Heavy steel M3 tripod (3 splayed legs + center pintle column)
    const pintle = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.065, 0.08, 1.18, 10)),
      darkMetalMat
    );
    pintle.position.set(0, 0.59, 0);
    pintle.castShadow = true;
    nest.add(pintle);

    const legGeo = trackGeo(new THREE.CylinderGeometry(0.032, 0.038, 0.95, 8));
    for (const [lx, lz, rx, rz] of [
      [0, -0.35, -0.58, 0],
      [-0.32, 0.25, 0.45, -0.45],
      [0.32, 0.25, 0.45, 0.45],
    ]) {
      const leg = new THREE.Mesh(legGeo, darkMetalMat);
      leg.position.set(lx, 0.38, lz);
      leg.rotation.set(rx, 0, rz);
      nest.add(leg);
    }

    // Traversing Yaw Group
    const yawGroup = new THREE.Group();
    yawGroup.position.set(0, 1.24, 0);
    nest.add(yawGroup);

    // Pitch Group (gun body + barrel + gun shield + spade grips)
    const pitchGroup = new THREE.Group();
    yawGroup.add(pitchGroup);

    const barrelHeatMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x262c36,
        metalness: 0.9,
        roughness: 0.28,
        emissive: 0xff3b00,
        emissiveIntensity: 0,
      })
    );

    // M2HB .50 Cal Receiver
    const receiver = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.16, 0.18, 0.56)), gunSteelMat);
    receiver.position.set(0, 0.02, -0.04);
    receiver.castShadow = true;
    pitchGroup.add(receiver);

    // Perforated cooling barrel jacket + heavy .50 barrel
    const jacket = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.052, 0.052, 0.36, 12)),
      darkMetalMat
    );
    jacket.rotation.x = Math.PI / 2;
    jacket.position.set(0, 0.02, -0.48);
    pitchGroup.add(jacket);

    const barrel = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.024, 0.028, 0.92, 12)),
      barrelHeatMat
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, -0.78);
    pitchGroup.add(barrel);

    // Slotted flash suppressor cone
    const hider = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.036, 0.026, 0.11, 10)),
      gunSteelMat
    );
    hider.rotation.x = Math.PI / 2;
    hider.position.set(0, 0.02, -1.26);
    pitchGroup.add(hider);

    // Armored gun shield with optic slit
    const shieldLeft = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.32, 0.44, 0.04)), darkMetalMat);
    shieldLeft.position.set(-0.24, 0.12, -0.34);
    const shieldRight = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.32, 0.44, 0.04)), darkMetalMat);
    shieldRight.position.set(0.24, 0.12, -0.34);
    const shieldBot = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.24, 0.24, 0.04)), darkMetalMat);
    shieldBot.position.set(0, 0.02, -0.34);
    pitchGroup.add(shieldLeft, shieldRight, shieldBot);

    // Side ammo box + brass cartridge belt
    const ammoCan = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.16, 0.24, 0.28)), oliveBoxMat);
    ammoCan.position.set(-0.22, -0.02, -0.04);
    const belt = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.14, 0.035, 0.14)), brassBeltMat);
    belt.position.set(-0.11, 0.06, -0.04);
    belt.rotation.z = 0.28;
    pitchGroup.add(ammoCan, belt);

    // Rear twin spade grips
    for (const gx of [-0.09, 0.09]) {
      const grip = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.015, 0.015, 0.15, 8)), gunSteelMat);
      grip.position.set(gx, 0.0, 0.28);
      pitchGroup.add(grip);
    }

    const muzzlePoint = new THREE.Object3D();
    muzzlePoint.position.set(0, 0.02, -1.34);
    pitchGroup.add(muzzlePoint);

    const muzzleFlash = new THREE.Group();
    muzzleFlash.position.set(0, 0.02, -1.36);
    const flashMat = trackMat(
      new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.92, depthWrite: false })
    );
    const f1 = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.42, 0.1)), flashMat);
    const f2 = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.1, 0.42)), flashMat);
    muzzleFlash.add(f1, f2);
    muzzleFlash.visible = false;
    pitchGroup.add(muzzleFlash);

    return {
      id,
      position: new THREE.Vector3(x, yBase, z),
      baseYaw,
      currentYaw: baseYaw,
      currentPitch: 0,
      heat: 0,
      overheated: false,
      yawGroup,
      pitchGroup,
      muzzlePoint,
      muzzleFlash,
      barrelHeatMat,
    };
  };

  const tireMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x15181e, roughness: 0.9, metalness: 0.08 })
  );
  const rimMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.35, metalness: 0.85 })
  );
  const headlightMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xfef9c3,
      emissive: 0xfef08a,
      emissiveIntensity: 1.4,
      roughness: 0.15,
    })
  );
  const glassMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.12,
      metalness: 0.9,
      transparent: true,
      opacity: 0.72,
    })
  );

  const addTacticalVehicle = (
    id: string,
    type: VehicleType,
    x: number,
    yBase: number,
    z: number,
    yaw: number,
    teamHint: 'blue' | 'red' | 'neutral'
  ): VehicleNode => {
    const root = new THREE.Group();
    root.position.set(x, yBase, z);
    root.rotation.y = yaw;
    rootGroup.add(root);

    const baseColor =
      teamHint === 'blue' ? 0x2c4a70 : teamHint === 'red' ? 0x6b2c2a : 0x4b533b;
    const bodyMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: 0.56,
        metalness: 0.44,
      })
    );
    const hitMeshes: THREE.Object3D[] = [];
    const wheels: THREE.Mesh[] = [];

    const regHit = (m: THREE.Object3D) => {
      m.userData.vehicleId = id;
      hitMeshes.push(m);
    };

    const turretGroup = new THREE.Group();
    const barrelPivot = new THREE.Group();
    const muzzlePoint = new THREE.Object3D();
    const muzzleFlash = new THREE.Group();
    const flashMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: type === 'tank' ? 0xff922b : 0xfef08a,
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
      })
    );

    if (type === 'jeep') {
      // Tactical 4x4 Recon Utility Vehicle
      const chassis = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.05, 0.58, 4.15)), bodyMat);
      chassis.position.set(0, 0.72, 0);
      chassis.castShadow = true;
      chassis.receiveShadow = true;
      root.add(chassis);
      regHit(chassis);

      // Sloped armored hood + bull-bar bumper
      const hood = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.94, 0.36, 1.35)), bodyMat);
      hood.position.set(0, 1.05, -1.25);
      hood.rotation.x = 0.08;
      hood.castShadow = true;
      root.add(hood);
      regHit(hood);

      const bumper = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.15, 0.24, 0.22)), darkMetalMat);
      bumper.position.set(0, 0.62, -2.14);
      root.add(bumper);

      for (const hx of [-0.68, 0.68]) {
        const hl = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.26, 0.14, 0.08)), headlightMat);
        hl.position.set(hx, 0.92, -2.08);
        const tl = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.24, 0.14, 0.08)), accentRedMat);
        tl.position.set(hx, 0.85, 2.08);
        root.add(hl, tl);
      }

      // Windshield frame & cab roll cage
      const windshield = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.82, 0.58, 0.08)), glassMat);
      windshield.position.set(0, 1.38, -0.52);
      windshield.rotation.x = -0.32;
      root.add(windshield);

      const roof = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.88, 0.1, 1.95)), bodyMat);
      roof.position.set(0, 1.72, 0.42);
      roof.castShadow = true;
      root.add(roof);
      regHit(roof);

      for (const [px, pz] of [
        [-0.88, -0.45],
        [0.88, -0.45],
        [-0.88, 1.35],
        [0.88, 1.35],
      ]) {
        const pillar = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.1, 0.72, 0.1)), darkMetalMat);
        pillar.position.set(px, 1.36, pz);
        root.add(pillar);
      }

      // Rear spare tire
      const spare = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.42, 0.42, 0.24, 14)), tireMat);
      spare.rotation.x = Math.PI / 2;
      spare.position.set(0, 0.95, 2.18);
      root.add(spare);

      // 4 Off-road Wheels
      const wheelGeo = trackGeo(new THREE.CylinderGeometry(0.48, 0.48, 0.34, 14));
      wheelGeo.rotateZ(Math.PI / 2);
      const hubGeo = trackGeo(new THREE.CylinderGeometry(0.22, 0.22, 0.36, 10));
      hubGeo.rotateZ(Math.PI / 2);
      for (const [wx, wz] of [
        [-1.08, -1.32],
        [1.08, -1.32],
        [-1.08, 1.32],
        [1.08, 1.32],
      ]) {
        const wMesh = new THREE.Mesh(wheelGeo, tireMat);
        wMesh.position.set(wx, 0.48, wz);
        wMesh.castShadow = true;
        const hub = new THREE.Mesh(hubGeo, rimMat);
        wMesh.add(hub);
        root.add(wMesh);
        wheels.push(wMesh);
      }

      // Roof-mounted .50 Cal MG Pintle Turret
      turretGroup.position.set(0, 1.82, 0.35);
      root.add(turretGroup);
      const ringMount = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.32, 0.36, 0.14, 12)), darkMetalMat);
      turretGroup.add(ringMount);
      turretGroup.add(barrelPivot);
      barrelPivot.position.set(0, 0.22, 0);

      const mgBody = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.14, 0.16, 0.56)), gunSteelMat);
      mgBody.position.set(0, 0, -0.1);
      const mgBarrel = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.025, 0.03, 0.95, 10)),
        gunSteelMat
      );
      mgBarrel.rotation.x = Math.PI / 2;
      mgBarrel.position.set(0, 0.02, -0.78);
      barrelPivot.add(mgBody, mgBarrel);

      muzzlePoint.position.set(0, 0.02, -1.32);
      barrelPivot.add(muzzlePoint);

      muzzleFlash.position.set(0, 0.02, -1.36);
      const f1 = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.46, 0.12)), flashMat);
      const f2 = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.12, 0.46)), flashMat);
      muzzleFlash.add(f1, f2);
      muzzleFlash.visible = false;
      barrelPivot.add(muzzleFlash);

      return {
        id,
        type,
        name: 'Tactical 4×4 Recon',
        teamHint,
        spawnPos: new THREE.Vector3(x, yBase, z),
        spawnYaw: yaw,
        position: new THREE.Vector3(x, yBase, z),
        yaw,
        speed: 0,
        turretYaw: 0,
        turretPitch: 0,
        health: 280,
        maxHealth: 280,
        destroyed: false,
        respawnTimer: 0,
        fireCooldown: 0,
        root,
        turretGroup,
        barrelPivot,
        muzzlePoint,
        muzzleFlash,
        wheels,
        hitMeshes,
        bodyMat,
        occupantId: null,
      };
    }

    // Armored IFV / Light Tank
    const hull = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.75, 0.92, 4.95)), bodyMat);
    hull.position.set(0, 0.96, 0);
    hull.castShadow = true;
    hull.receiveShadow = true;
    root.add(hull);
    regHit(hull);

    // Front sloped glacis armor
    const glacis = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.68, 0.56, 1.25)), bodyMat);
    glacis.position.set(0, 1.05, -2.25);
    glacis.rotation.x = 0.46;
    glacis.castShadow = true;
    root.add(glacis);
    regHit(glacis);

    // Side armored track skirts + 5 road wheels per side
    for (const sx of [-1.42, 1.42]) {
      const skirt = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.38, 0.54, 4.85)), darkMetalMat);
      skirt.position.set(sx, 0.68, 0);
      skirt.castShadow = true;
      root.add(skirt);
      regHit(skirt);

      for (let wi = -2; wi <= 2; wi++) {
        const roadWheel = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.38, 0.38, 0.42, 12)),
          tireMat
        );
        roadWheel.rotation.z = Math.PI / 2;
        roadWheel.position.set(sx * 0.96, 0.38, wi * 1.02);
        root.add(roadWheel);
        wheels.push(roadWheel);
      }
    }

    // Headlights + rear engine deck
    for (const hx of [-0.95, 0.95]) {
      const hl = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.28, 0.15, 0.08)), headlightMat);
      hl.position.set(hx, 1.1, -2.65);
      root.add(hl);
    }

    // Rotating 360° Armored Turret + 105mm Cannon
    turretGroup.position.set(0, 1.48, 0.15);
    root.add(turretGroup);

    const turretHull = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.92, 0.68, 2.35)), bodyMat);
    turretHull.position.set(0, 0.34, 0.1);
    turretHull.castShadow = true;
    turretGroup.add(turretHull);
    regHit(turretHull);

    const cupola = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.36, 0.4, 0.26, 12)), darkMetalMat);
    cupola.position.set(0.45, 0.78, 0.35);
    turretGroup.add(cupola);
    regHit(cupola);

    turretGroup.add(barrelPivot);
    barrelPivot.position.set(0, 0.36, -1.05);

    const mantlet = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.62, 0.36, 0.48)), darkMetalMat);
    mantlet.position.set(0, 0, -0.1);
    const mainGun = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.085, 0.11, 2.9, 12)),
      gunSteelMat
    );
    mainGun.rotation.x = Math.PI / 2;
    mainGun.position.set(0, 0, -1.52);
    mainGun.castShadow = true;
    const muzzleBrake = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.24, 0.2, 0.34)),
      darkMetalMat
    );
    muzzleBrake.position.set(0, 0, -2.98);
    barrelPivot.add(mantlet, mainGun, muzzleBrake);

    muzzlePoint.position.set(0, 0, -3.18);
    barrelPivot.add(muzzlePoint);

    muzzleFlash.position.set(0, 0, -3.25);
    const tf1 = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(1.15, 0.32)), flashMat);
    const tf2 = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.32, 1.15)), flashMat);
    muzzleFlash.add(tf1, tf2);
    muzzleFlash.visible = false;
    barrelPivot.add(muzzleFlash);

    return {
      id,
      type,
      name: 'Striker Armored IFV',
      teamHint,
      spawnPos: new THREE.Vector3(x, yBase, z),
      spawnYaw: yaw,
      position: new THREE.Vector3(x, yBase, z),
      yaw,
      speed: 0,
      turretYaw: 0,
      turretPitch: 0,
      health: 580,
      maxHealth: 580,
      destroyed: false,
      respawnTimer: 0,
      fireCooldown: 0,
      root,
      turretGroup,
      barrelPivot,
      muzzlePoint,
      muzzleFlash,
      wheels,
      hitMeshes,
      bodyMat,
      occupantId: null,
    };
  };

  // =========================================================================
  // MAP 1: INDUSTRIAL YARD (Expanded 140x140m Cargo Terminal + Vehicle Lanes)
  // =========================================================================
  if (mapId === 'yard') {
    const halfSize = 70;
    const atmosphere: ArenaAtmosphere = {
      bgColor: 0x28262b,
      fogColor: 0x22252e,
      fogDensity: 0.0054,
      sunColor: 0xffdfba,
      sunIntensity: 2.35,
      sunPos: [55, 58, 32],
      hemiSky: 0x93c5fd,
      hemiGround: 0x262930,
      hemiIntensity: 0.92,
    };

    rootGroup.add(
      buildSkyDome(0x0b1322, 0x1b283b, 0x473832, atmosphere.sunPos, [1.0, 0.72, 0.42], 0.48, geometries, materials)
    );

    const floorTexSet = createArenaFloorTextures(maxAnisotropy);
    floorTexSet.map.repeat.set(28, 28);
    floorTexSet.bumpMap.repeat.set(28, 28);
    floorTexSet.roughnessMap.repeat.set(28, 28);
    const concreteTexSet = createConcreteWallTextures(maxAnisotropy);
    const blueContainerTex = createContainerTextures('#1e3a5f', '#3b82f6', maxAnisotropy);
    const redContainerTex = createContainerTextures('#5c1f24', '#ef4444', maxAnisotropy);
    const slateContainerTex = createContainerTextures('#334155', '#f59e0b', maxAnisotropy);
    const deckTexSet = createSteelDeckTextures(maxAnisotropy);

    textures.push(
      floorTexSet.map,
      floorTexSet.bumpMap,
      floorTexSet.roughnessMap,
      concreteTexSet.map,
      concreteTexSet.bumpMap,
      blueContainerTex.map,
      blueContainerTex.bumpMap,
      redContainerTex.map,
      redContainerTex.bumpMap,
      slateContainerTex.map,
      slateContainerTex.bumpMap,
      deckTexSet.map,
      deckTexSet.bumpMap
    );

    const floorMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: floorTexSet.map,
        bumpMap: floorTexSet.bumpMap,
        bumpScale: 0.04,
        roughnessMap: floorTexSet.roughnessMap,
        roughness: 0.9,
        metalness: 0.14,
      })
    );
    const outerGroundMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x151922, roughness: 0.95, metalness: 0.05 })
    );
    const concreteMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: concreteTexSet.map,
        bumpMap: concreteTexSet.bumpMap,
        bumpScale: 0.05,
        roughness: 0.82,
        metalness: 0.08,
      })
    );
    const barrierMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x4b5563,
        bumpMap: concreteTexSet.bumpMap,
        bumpScale: 0.03,
        roughness: 0.85,
        metalness: 0.06,
      })
    );
    const deckMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: deckTexSet.map,
        bumpMap: deckTexSet.bumpMap,
        bumpScale: 0.04,
        roughness: 0.38,
        metalness: 0.76,
      })
    );
    const blueContainerMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: blueContainerTex.map,
        bumpMap: blueContainerTex.bumpMap,
        bumpScale: 0.06,
        roughness: 0.5,
        metalness: 0.62,
      })
    );
    const redContainerMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: redContainerTex.map,
        bumpMap: redContainerTex.bumpMap,
        bumpScale: 0.06,
        roughness: 0.5,
        metalness: 0.62,
      })
    );
    const slateContainerMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: slateContainerTex.map,
        bumpMap: slateContainerTex.bumpMap,
        bumpScale: 0.06,
        roughness: 0.48,
        metalness: 0.64,
      })
    );
    const floodLampMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xfff7ed,
        emissive: 0xffedd5,
        emissiveIntensity: 2.2,
        roughness: 0.1,
      })
    );

    const outerGround = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(580, 580)), outerGroundMat);
    outerGround.rotation.x = -Math.PI / 2;
    outerGround.position.y = -0.04;
    outerGround.receiveShadow = true;
    rootGroup.add(outerGround);

    const mainFloor = new THREE.Mesh(
      trackGeo(new THREE.PlaneGeometry(halfSize * 2, halfSize * 2)),
      floorMat
    );
    mainFloor.rotation.x = -Math.PI / 2;
    mainFloor.receiveShadow = true;
    rootGroup.add(mainFloor);
    staticRayMeshes.push(mainFloor);

    const addShippingContainer = (
      x: number,
      z: number,
      w: number,
      h: number,
      d: number,
      mat: THREE.Material
    ) => {
      addBox(x, h / 2, z, w, h, d, mat, true, true);
      const postW = 0.24;
      const corners: Array<[number, number]> = [
        [x - w / 2 + postW / 2, z - d / 2 + postW / 2],
        [x + w / 2 - postW / 2, z - d / 2 + postW / 2],
        [x - w / 2 + postW / 2, z + d / 2 - postW / 2],
        [x + w / 2 - postW / 2, z + d / 2 - postW / 2],
      ];
      for (const [cx, cz] of corners) {
        addBox(cx, h / 2, cz, postW + 0.04, h + 0.06, postW + 0.04, darkMetalMat, false, true);
      }
    };

    const jerseyShape = new THREE.Shape();
    jerseyShape.moveTo(-0.75, 0);
    jerseyShape.lineTo(0.75, 0);
    jerseyShape.lineTo(0.65, 0.35);
    jerseyShape.lineTo(0.32, 1.35);
    jerseyShape.lineTo(-0.32, 1.35);
    jerseyShape.lineTo(-0.65, 0.35);
    jerseyShape.closePath();

    const addJerseyBarrier = (x: number, z: number, length: number) => {
      const geo = trackGeo(
        new THREE.ExtrudeGeometry(jerseyShape, {
          depth: length,
          bevelEnabled: true,
          bevelThickness: 0.05,
          bevelSize: 0.04,
          bevelSegments: 2,
        })
      );
      geo.translate(0, 0, -length / 2);
      const mesh = new THREE.Mesh(geo, barrierMat);
      mesh.position.set(x, 0, z);
      mesh.rotation.y = Math.PI / 2;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      rootGroup.add(mesh);
      staticRayMeshes.push(mesh);
      colliders.push({
        minX: x - length / 2,
        maxX: x + length / 2,
        minY: 0,
        maxY: 1.4,
        minZ: z - 0.75,
        maxZ: z + 0.75,
      });
    };

    const wallH = 7.0;
    const wallT = 2.4;
    addBox(0, wallH / 2, -halfSize - wallT / 2, halfSize * 2 + wallT * 2, wallH, wallT, concreteMat);
    addBox(0, wallH / 2, halfSize + wallT / 2, halfSize * 2 + wallT * 2, wallH, wallT, concreteMat);
    addBox(-halfSize - wallT / 2, wallH / 2, 0, wallT, wallH, halfSize * 2, concreteMat);
    addBox(halfSize + wallT / 2, wallH / 2, 0, wallT, wallH, halfSize * 2, concreteMat);

    for (const [tx, tz] of [
      [-67, -67],
      [67, -67],
      [-67, 67],
      [67, 67],
    ]) {
      const pole = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.32, 0.44, 18, 10)), darkMetalMat);
      pole.position.set(tx, 9, tz);
      rootGroup.add(pole);
      const head = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(3.2, 1.0, 0.9)), darkMetalMat);
      head.position.set(tx, 18.1, tz);
      head.lookAt(0, 0, 0);
      rootGroup.add(head);
      const panel = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(2.7, 0.75)), floodLampMat);
      panel.position.set(0, 0, 0.48);
      head.add(panel);

      const haloMat = trackMat(
        new THREE.SpriteMaterial({
          map: warmGlowTex,
          transparent: true,
          opacity: 0.78,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      const halo = new THREE.Sprite(haloMat);
      halo.scale.set(12, 12, 1);
      halo.position.set(0, 0, 0.7);
      head.add(halo);
    }

    const distantMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x1a212d, roughness: 0.88, metalness: 0.25 })
    );
    for (const [sx, sz, sw, sh, sd] of [
      [-98, -88, 22, 30, 22],
      [0, -108, 48, 24, 18],
      [96, -92, 24, 34, 24],
      [-104, 78, 26, 28, 24],
      [100, 86, 28, 24, 26],
      [-114, 0, 18, 24, 52],
      [116, -8, 20, 30, 44],
      [14, 114, 42, 20, 18],
    ]) {
      const bldg = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(sw, sh, sd)), distantMat);
      bldg.position.set(sx, sh / 2 - 0.04, sz);
      rootGroup.add(bldg);
    }

    // Central Elevated Steel Overpass (wide enough for infantry & flank battles)
    const bridgeY = 2.8;
    addBox(0, bridgeY - 0.25, 0, 22, 0.5, 10, deckMat, true);
    for (const px of [-9.5, 9.5]) {
      for (const pz of [-3.8, 3.8]) {
        addBox(px, (bridgeY - 0.5) / 2, pz, 1.0, bridgeY - 0.5, 1.0, darkMetalMat, true);
      }
    }
    addBox(0, bridgeY + 0.55, -4.85, 20, 1.1, 0.28, darkMetalMat, true);
    addBox(0, bridgeY + 0.55, 4.85, 20, 1.1, 0.28, darkMetalMat, true);
    addBox(0, bridgeY + 1.12, -4.85, 20, 0.08, 0.3, amberMat, false, false);
    addBox(0, bridgeY + 1.12, 4.85, 20, 0.08, 0.3, amberMat, false, false);

    buildRamp(-21, -11, 0, 5.6, 0, bridgeY, deckMat);
    buildRamp(21, 11, 0, 5.6, 0, bridgeY, deckMat);

    // Team Base Compounds (South Blue, North Red)
    addShippingContainer(-16, 48, 9, 3.2, 3.4, blueContainerMat);
    addShippingContainer(16, 48, 9, 3.2, 3.4, blueContainerMat);
    addBox(0, 1.1, 52, 8.5, 2.2, 1.6, concreteMat);
    addBox(0, 2.25, 52, 8.6, 0.14, 1.66, accentBlueMat, false, false);

    addShippingContainer(-16, -48, 9, 3.2, 3.4, redContainerMat);
    addShippingContainer(16, -48, 9, 3.2, 3.4, redContainerMat);
    addBox(0, 1.1, -52, 8.5, 2.2, 1.6, concreteMat);
    addBox(0, 2.25, -52, 8.6, 0.14, 1.66, accentRedMat, false, false);

    // Mid-Arena & Outer Motorway Shipping Container Clusters (leaving wide vehicle lanes at x=±34..±64)
    addShippingContainer(-28, -18, 3.4, 3.2, 9.5, slateContainerMat);
    addShippingContainer(-28, 18, 3.4, 3.2, 9.5, slateContainerMat);
    addShippingContainer(28, -18, 3.4, 3.2, 9.5, slateContainerMat);
    addShippingContainer(28, 18, 3.4, 3.2, 9.5, slateContainerMat);

    addShippingContainer(-52, -32, 3.4, 3.2, 9.0, slateContainerMat);
    addShippingContainer(-52, 32, 3.4, 3.2, 9.0, slateContainerMat);
    addShippingContainer(52, -32, 3.4, 3.2, 9.0, slateContainerMat);
    addShippingContainer(52, 32, 3.4, 3.2, 9.0, slateContainerMat);
    addBox(-54, 1.4, 0, 4.6, 2.8, 6.2, concreteMat);
    addBox(54, 1.4, 0, 4.6, 2.8, 6.2, concreteMat);

    addJerseyBarrier(-12, -24, 6.0);
    addJerseyBarrier(12, -24, 6.0);
    addJerseyBarrier(-12, 24, 6.0);
    addJerseyBarrier(12, 24, 6.0);
    addJerseyBarrier(-38, 0, 5.5);
    addJerseyBarrier(38, 0, 5.5);

    for (const [cx, cz] of [
      [-22, 36],
      [22, 36],
      [-22, -36],
      [22, -36],
      [-8, -14],
      [8, 14],
      [-40, -18],
      [40, 18],
    ]) {
      addBox(cx, 0.75, cz, 1.7, 1.5, 1.7, darkMetalMat);
      addBox(cx + 1.5, 0.55, cz + 0.3, 1.15, 1.1, 1.15, slateContainerMat);
    }

    for (const [dx, dz, olive] of [
      [-16, 12, true],
      [16, -12, false],
      [-32, -5, true],
      [32, 5, false],
      [-46, 14, false],
      [46, -14, true],
    ] as Array<[number, number, boolean]>) {
      addOilDrum(dx, 0, dz, olive);
    }

    const mountedMgs = [
      addMountedMg('yard-hmg-south', -16, 0, 29, 0, true),
      addMountedMg('yard-hmg-north', 16, 0, -29, Math.PI, true),
    ];

    const vehicles = [
      addTacticalVehicle('yard-blue-jeep', 'jeep', -38, 0, 54, 0, 'blue'),
      addTacticalVehicle('yard-blue-tank', 'tank', 38, 0, 54, 0, 'blue'),
      addTacticalVehicle('yard-red-jeep', 'jeep', 38, 0, -54, Math.PI, 'red'),
      addTacticalVehicle('yard-red-tank', 'tank', -38, 0, -54, Math.PI, 'red'),
    ];

    const pickups = spawnPickups([
      { id: 'med-west', type: 'health', x: -34, y: 0, z: 0 },
      { id: 'med-east', type: 'health', x: 34, y: 0, z: 0 },
      { id: 'med-outer-w', type: 'health', x: -60, y: 0, z: 0 },
      { id: 'med-outer-e', type: 'health', x: 60, y: 0, z: 0 },
      { id: 'ammo-mid', type: 'ammo', x: 0, y: bridgeY, z: 0 },
      { id: 'ammo-south', type: 'ammo', x: 0, y: 0, z: 36 },
      { id: 'ammo-north', type: 'ammo', x: 0, y: 0, z: -36 },
    ]);

    return {
      mapId,
      rootGroup,
      atmosphere,
      colliders,
      ramps,
      staticRayMeshes,
      blueSpawns: [
        new THREE.Vector3(-12, 0, 60),
        new THREE.Vector3(-4, 0, 61),
        new THREE.Vector3(4, 0, 61),
        new THREE.Vector3(12, 0, 60),
        new THREE.Vector3(-24, 0, 58),
        new THREE.Vector3(24, 0, 58),
        new THREE.Vector3(-44, 0, 59),
        new THREE.Vector3(44, 0, 59),
        new THREE.Vector3(-18, 0, 55),
        new THREE.Vector3(18, 0, 55),
      ],
      redSpawns: [
        new THREE.Vector3(-12, 0, -60),
        new THREE.Vector3(-4, 0, -61),
        new THREE.Vector3(4, 0, -61),
        new THREE.Vector3(12, 0, -60),
        new THREE.Vector3(-24, 0, -58),
        new THREE.Vector3(24, 0, -58),
        new THREE.Vector3(-44, 0, -59),
        new THREE.Vector3(44, 0, -59),
        new THREE.Vector3(-18, 0, -55),
        new THREE.Vector3(18, 0, -55),
      ],
      waypoints: [
        new THREE.Vector3(-44, 0, 42),
        new THREE.Vector3(-20, 0, 40),
        new THREE.Vector3(0, 0, 40),
        new THREE.Vector3(20, 0, 40),
        new THREE.Vector3(44, 0, 42),
        new THREE.Vector3(-44, 0, 14),
        new THREE.Vector3(-22, 0, 14),
        new THREE.Vector3(0, 0, 16),
        new THREE.Vector3(22, 0, 14),
        new THREE.Vector3(44, 0, 14),
        new THREE.Vector3(-42, 0, 0),
        new THREE.Vector3(0, bridgeY, 0),
        new THREE.Vector3(42, 0, 0),
        new THREE.Vector3(-44, 0, -14),
        new THREE.Vector3(-22, 0, -14),
        new THREE.Vector3(0, 0, -16),
        new THREE.Vector3(22, 0, -14),
        new THREE.Vector3(44, 0, -14),
        new THREE.Vector3(-44, 0, -42),
        new THREE.Vector3(-20, 0, -40),
        new THREE.Vector3(0, 0, -40),
        new THREE.Vector3(20, 0, -40),
        new THREE.Vector3(44, 0, -42),
      ],
      pickups,
      mountedMgs,
      vehicles,
      halfSize,
      disposables: { geometries, materials, textures },
    };
  }

  // =========================================================================
  // MAP 2: DESERT OUTPOST (Expanded 160x160m Arid Canyon FOB)
  // =========================================================================
  if (mapId === 'outpost') {
    const halfSize = 80;
    const atmosphere: ArenaAtmosphere = {
      bgColor: 0xc9a984,
      fogColor: 0xd1b38f,
      fogDensity: 0.0044,
      sunColor: 0xfff3d6,
      sunIntensity: 2.6,
      sunPos: [68, 72, -38],
      hemiSky: 0x93c5fd,
      hemiGround: 0x9c764e,
      hemiIntensity: 1.05,
    };

    rootGroup.add(
      buildSkyDome(0x2563eb, 0x7dd3fc, 0xe8cfa8, atmosphere.sunPos, [1.0, 0.85, 0.58], 0.36, geometries, materials)
    );

    const desertFloor = createDesertFloorTextures(maxAnisotropy);
    desertFloor.map.repeat.set(30, 30);
    desertFloor.bumpMap.repeat.set(30, 30);
    desertFloor.roughnessMap.repeat.set(30, 30);
    const sandstone = createSandstoneTextures(maxAnisotropy);
    const tanContainer = createContainerTextures('#9a8462', '#d97706', maxAnisotropy);
    textures.push(
      desertFloor.map,
      desertFloor.bumpMap,
      desertFloor.roughnessMap,
      sandstone.map,
      sandstone.bumpMap,
      tanContainer.map,
      tanContainer.bumpMap
    );

    const floorMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: desertFloor.map,
        bumpMap: desertFloor.bumpMap,
        bumpScale: 0.06,
        roughnessMap: desertFloor.roughnessMap,
        roughness: 0.94,
        metalness: 0.04,
      })
    );
    const outerSandMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x98744f, roughness: 0.96, metalness: 0.02 })
    );
    const adobeMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: sandstone.map,
        bumpMap: sandstone.bumpMap,
        bumpScale: 0.06,
        roughness: 0.88,
        metalness: 0.04,
      })
    );
    const hescoMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x8f7a5b, roughness: 0.9, metalness: 0.08 })
    );
    const crateMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: tanContainer.map,
        bumpMap: tanContainer.bumpMap,
        bumpScale: 0.05,
        roughness: 0.56,
        metalness: 0.45,
      })
    );
    const mesaMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x8c6343, roughness: 0.92, metalness: 0.04 })
    );

    const outerGround = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(660, 660)), outerSandMat);
    outerGround.rotation.x = -Math.PI / 2;
    outerGround.position.y = -0.04;
    outerGround.receiveShadow = true;
    rootGroup.add(outerGround);

    const mainFloor = new THREE.Mesh(
      trackGeo(new THREE.PlaneGeometry(halfSize * 2, halfSize * 2)),
      floorMat
    );
    mainFloor.rotation.x = -Math.PI / 2;
    mainFloor.receiveShadow = true;
    rootGroup.add(mainFloor);
    staticRayMeshes.push(mainFloor);

    // Perimeter Sandstone Compound Walls
    const wallH = 6.0;
    const wallT = 2.6;
    addBox(0, wallH / 2, -halfSize - wallT / 2, halfSize * 2 + wallT * 2, wallH, wallT, adobeMat);
    addBox(0, wallH / 2, halfSize + wallT / 2, halfSize * 2 + wallT * 2, wallH, wallT, adobeMat);
    addBox(-halfSize - wallT / 2, wallH / 2, 0, wallT, wallH, halfSize * 2, adobeMat);
    addBox(halfSize + wallT / 2, wallH / 2, 0, wallT, wallH, halfSize * 2, adobeMat);

    // Distant Canyon Mesas beyond perimeter
    for (const [mx, mz, mw, mh, md] of [
      [-125, -110, 52, 34, 38],
      [115, -115, 58, 38, 42],
      [-132, 95, 44, 28, 52],
      [128, 105, 52, 34, 46],
      [0, -148, 86, 26, 28],
      [-14, 148, 82, 24, 28],
    ]) {
      const mesa = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(mw, mh, md)), mesaMat);
      mesa.position.set(mx, mh / 2 - 0.1, mz);
      rootGroup.add(mesa);
    }

    // Two Elevated Watchtower Sniper Decks (East & West flanks, y = 3.2m)
    const towerY = 3.2;
    for (const side of [-1, 1]) {
      const tx = side * 46;
      addBox(tx, towerY - 0.25, 0, 9, 0.5, 11, adobeMat, true);
      addBox(tx, (towerY - 0.5) / 2, -4.6, 1.3, towerY - 0.5, 1.3, darkMetalMat, true);
      addBox(tx, (towerY - 0.5) / 2, 4.6, 1.3, towerY - 0.5, 1.3, darkMetalMat, true);
      addBox(tx - side * 4.3, towerY + 0.55, 0, 0.4, 1.1, 11, hescoMat, true);
      addBox(tx, towerY + 0.55, -5.3, 8.6, 1.1, 0.4, hescoMat, true);
      addBox(tx, towerY + 0.55, 5.3, 8.6, 1.1, 0.4, hescoMat, true);
      buildRamp(tx - side * 13, tx - side * 4.5, 0, 4.6, 0, towerY, hescoMat);
    }

    // Central Ruined Adobe Courtyard + Outer Tactical Bunkers
    addBox(0, 1.8, 0, 5.5, 3.6, 5.5, adobeMat);
    addBox(0, 3.7, 0, 5.7, 0.22, 5.7, darkMetalMat, false, false);
    addBox(-13, 0.9, -13, 7, 1.8, 1.5, hescoMat);
    addBox(13, 0.9, -13, 7, 1.8, 1.5, hescoMat);
    addBox(-13, 0.9, 13, 7, 1.8, 1.5, hescoMat);
    addBox(13, 0.9, 13, 7, 1.8, 1.5, hescoMat);

    // Base Spawn Bunkers (Blue South, Red North)
    addBox(-16, 1.6, 56, 10, 3.2, 3.6, crateMat);
    addBox(16, 1.6, 56, 10, 3.2, 3.6, crateMat);
    addBox(0, 1.1, 59, 8.5, 2.2, 1.8, hescoMat);
    addBox(0, 2.28, 59, 8.6, 0.14, 1.85, accentBlueMat, false, false);

    addBox(-16, 1.6, -56, 10, 3.2, 3.6, crateMat);
    addBox(16, 1.6, -56, 10, 3.2, 3.6, crateMat);
    addBox(0, 1.1, -59, 8.5, 2.2, 1.8, hescoMat);
    addBox(0, 2.28, -59, 8.6, 0.14, 1.85, accentRedMat, false, false);

    // Mid-Field & Outer Canyon Supply Containers
    addBox(-24, 1.5, -34, 8, 3.0, 3.2, crateMat);
    addBox(24, 1.5, -34, 8, 3.0, 3.2, crateMat);
    addBox(-24, 1.5, 34, 8, 3.0, 3.2, crateMat);
    addBox(24, 1.5, 34, 8, 3.0, 3.2, crateMat);
    addBox(-62, 1.6, -24, 3.6, 3.2, 8.5, adobeMat);
    addBox(-62, 1.6, 24, 3.6, 3.2, 8.5, adobeMat);
    addBox(62, 1.6, -24, 3.6, 3.2, 8.5, adobeMat);
    addBox(62, 1.6, 24, 3.6, 3.2, 8.5, adobeMat);

    for (const [dx, dz, olive] of [
      [-18, 22, true],
      [18, -22, false],
      [-7, 8, true],
      [7, -8, true],
      [-52, 14, false],
      [52, -14, true],
    ] as Array<[number, number, boolean]>) {
      addOilDrum(dx, 0, dz, olive);
    }

    const mountedMgs = [
      addMountedMg('outpost-hmg-west', -42.6, towerY, 0, -Math.PI / 2, false),
      addMountedMg('outpost-hmg-east', 42.6, towerY, 0, Math.PI / 2, false),
    ];

    const vehicles = [
      addTacticalVehicle('outpost-blue-jeep', 'jeep', -44, 0, 62, 0, 'blue'),
      addTacticalVehicle('outpost-blue-tank', 'tank', 44, 0, 62, 0, 'blue'),
      addTacticalVehicle('outpost-red-jeep', 'jeep', 44, 0, -62, Math.PI, 'red'),
      addTacticalVehicle('outpost-red-tank', 'tank', -44, 0, -62, Math.PI, 'red'),
    ];

    const pickups = spawnPickups([
      { id: 'med-west-tower', type: 'health', x: -46, y: towerY, z: 3.0 },
      { id: 'med-east-tower', type: 'health', x: 46, y: towerY, z: -3.0 },
      { id: 'med-west-flank', type: 'health', x: -68, y: 0, z: 0 },
      { id: 'med-east-flank', type: 'health', x: 68, y: 0, z: 0 },
      { id: 'ammo-center-n', type: 'ammo', x: 0, y: 0, z: -10 },
      { id: 'ammo-center-s', type: 'ammo', x: 0, y: 0, z: 10 },
    ]);

    return {
      mapId,
      rootGroup,
      atmosphere,
      colliders,
      ramps,
      staticRayMeshes,
      blueSpawns: [
        new THREE.Vector3(-12, 0, 68),
        new THREE.Vector3(-4, 0, 69),
        new THREE.Vector3(4, 0, 69),
        new THREE.Vector3(12, 0, 68),
        new THREE.Vector3(-26, 0, 66),
        new THREE.Vector3(26, 0, 66),
        new THREE.Vector3(-52, 0, 68),
        new THREE.Vector3(52, 0, 68),
        new THREE.Vector3(-20, 0, 62),
        new THREE.Vector3(20, 0, 62),
      ],
      redSpawns: [
        new THREE.Vector3(-12, 0, -68),
        new THREE.Vector3(-4, 0, -69),
        new THREE.Vector3(4, 0, -69),
        new THREE.Vector3(12, 0, -68),
        new THREE.Vector3(-26, 0, -66),
        new THREE.Vector3(26, 0, -66),
        new THREE.Vector3(-52, 0, -68),
        new THREE.Vector3(52, 0, -68),
        new THREE.Vector3(-20, 0, -62),
        new THREE.Vector3(20, 0, -62),
      ],
      waypoints: [
        new THREE.Vector3(-54, 0, 46),
        new THREE.Vector3(-18, 0, 44),
        new THREE.Vector3(18, 0, 44),
        new THREE.Vector3(54, 0, 46),
        new THREE.Vector3(-46, towerY, 0),
        new THREE.Vector3(-24, 0, 0),
        new THREE.Vector3(24, 0, 0),
        new THREE.Vector3(46, towerY, 0),
        new THREE.Vector3(0, 0, 22),
        new THREE.Vector3(0, 0, -22),
        new THREE.Vector3(-54, 0, -46),
        new THREE.Vector3(-18, 0, -44),
        new THREE.Vector3(18, 0, -44),
        new THREE.Vector3(54, 0, -46),
      ],
      pickups,
      mountedMgs,
      vehicles,
      halfSize,
      disposables: { geometries, materials, textures },
    };
  }

  // =========================================================================
  // MAP 3: CRYO BUNKER (Expanded 120x120m Subterranean Facility + Armor Lanes)
  // =========================================================================
  const halfSize = 60;
  const atmosphere: ArenaAtmosphere = {
    bgColor: 0x0b121e,
    fogColor: 0x0d1624,
    fogDensity: 0.0075,
    sunColor: 0xdbeafe,
    sunIntensity: 1.9,
    sunPos: [28, 60, 24],
    hemiSky: 0x38bdf8,
    hemiGround: 0x111827,
    hemiIntensity: 1.1,
  };

  rootGroup.add(
    buildSkyDome(0x060b14, 0x0e1a2b, 0x172940, atmosphere.sunPos, [0.45, 0.72, 1.0], 0.0, geometries, materials)
  );

  const bunkerFloor = createBunkerFloorTextures(maxAnisotropy);
  bunkerFloor.map.repeat.set(26, 26);
  bunkerFloor.bumpMap.repeat.set(26, 26);
  bunkerFloor.roughnessMap.repeat.set(26, 26);
  const wallTex = createConcreteWallTextures(maxAnisotropy);
  const cryoRackTex = createContainerTextures('#1b2638', '#06b6d4', maxAnisotropy);
  const deckTex = createSteelDeckTextures(maxAnisotropy);

  textures.push(
    bunkerFloor.map,
    bunkerFloor.bumpMap,
    bunkerFloor.roughnessMap,
    wallTex.map,
    wallTex.bumpMap,
    cryoRackTex.map,
    cryoRackTex.bumpMap,
    deckTex.map,
    deckTex.bumpMap
  );

  const floorMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: bunkerFloor.map,
      bumpMap: bunkerFloor.bumpMap,
      bumpScale: 0.03,
      roughnessMap: bunkerFloor.roughnessMap,
      roughness: 0.55,
      metalness: 0.35,
    })
  );
  const outerGroundMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x090d14, roughness: 0.9, metalness: 0.2 })
  );
  const wallMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: wallTex.map,
      bumpMap: wallTex.bumpMap,
      bumpScale: 0.05,
      roughness: 0.65,
      metalness: 0.3,
    })
  );
  const rackMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: cryoRackTex.map,
      bumpMap: cryoRackTex.bumpMap,
      bumpScale: 0.05,
      roughness: 0.38,
      metalness: 0.75,
    })
  );
  const deckMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: deckTex.map,
      bumpMap: deckTex.bumpMap,
      bumpScale: 0.04,
      roughness: 0.35,
      metalness: 0.82,
    })
  );
  const cyanNeonMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.4,
      roughness: 0.2,
    })
  );

  const outerGround = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(520, 520)), outerGroundMat);
  outerGround.rotation.x = -Math.PI / 2;
  outerGround.position.y = -0.04;
  rootGroup.add(outerGround);

  const mainFloor = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(halfSize * 2, halfSize * 2)),
    floorMat
  );
  mainFloor.rotation.x = -Math.PI / 2;
  mainFloor.receiveShadow = true;
  rootGroup.add(mainFloor);
  staticRayMeshes.push(mainFloor);

  // Bunker Concrete Perimeter Walls + Overhead Skylight Steel Trusses
  const wallH = 9.0;
  const wallT = 2.4;
  addBox(0, wallH / 2, -halfSize - wallT / 2, halfSize * 2 + wallT * 2, wallH, wallT, wallMat);
  addBox(0, wallH / 2, halfSize + wallT / 2, halfSize * 2 + wallT * 2, wallH, wallT, wallMat);
  addBox(-halfSize - wallT / 2, wallH / 2, 0, wallT, wallH, halfSize * 2, wallMat);
  addBox(halfSize + wallT / 2, wallH / 2, 0, wallT, wallH, halfSize * 2, wallMat);

  for (const gz of [-40, -20, 0, 20, 40]) {
    addBox(0, 9.2, gz, halfSize * 2, 0.9, 1.3, darkMetalMat, false, false);
    addBox(0, 8.7, gz, 88, 0.16, 0.5, cyanNeonMat, false, false);
  }

  // Central Elevated Reactor Ring Platform (y = 2.4m) with 4 Ramps
  const platY = 2.4;
  addBox(0, platY - 0.25, 0, 18, 0.5, 18, deckMat, true);
  const core = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(1.9, 2.1, 8.6, 16)), darkMetalMat);
  core.position.set(0, 4.3, 0);
  core.castShadow = true;
  rootGroup.add(core);
  staticRayMeshes.push(core);
  colliders.push({ minX: -2.1, maxX: 2.1, minY: 0, maxY: 8.6, minZ: -2.1, maxZ: 2.1 });

  const coreRing = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(2.2, 2.2, 0.4, 16)), cyanNeonMat);
  coreRing.position.set(0, platY + 1.8, 0);
  rootGroup.add(coreRing);

  const coreHaloMat = trackMat(
    new THREE.SpriteMaterial({
      map: cyanGlowTex,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  const coreHalo = new THREE.Sprite(coreHaloMat);
  coreHalo.scale.set(14, 14, 1);
  coreHalo.position.set(0, platY + 1.8, 0);
  rootGroup.add(coreHalo);

  buildRamp(-17, -9, 0, 5.0, 0, platY, deckMat);
  buildRamp(17, 9, 0, 5.0, 0, platY, deckMat);
  buildZRamp(0, 5.0, -17, -9, 0, platY, deckMat);
  buildZRamp(0, 5.0, 17, 9, 0, platY, deckMat);

  // Expanded Containment Server Racks & Corridor Partitions (wide outer vehicle corridors at ±36..±55)
  for (const [rx, rz, rw, rd] of [
    [-25, -22, 3.4, 9.5],
    [25, -22, 3.4, 9.5],
    [-25, 22, 3.4, 9.5],
    [25, 22, 3.4, 9.5],
    [-46, -16, 3.4, 9.5],
    [46, -16, 3.4, 9.5],
    [-46, 16, 3.4, 9.5],
    [46, 16, 3.4, 9.5],
    [-33, 0, 6.0, 3.2],
    [33, 0, 6.0, 3.2],
    [-14, 34, 7.5, 2.4],
    [14, 34, 7.5, 2.4],
    [-14, -34, 7.5, 2.4],
    [14, -34, 7.5, 2.4],
  ]) {
    addBox(rx, 1.7, rz, rw, 3.4, rd, rackMat);
  }

  // Team Spawn Base Shields
  addBox(0, 1.1, 44, 7.5, 2.2, 1.6, darkMetalMat);
  addBox(0, 2.25, 44, 7.6, 0.14, 1.65, accentBlueMat, false, false);

  addBox(0, 1.1, -44, 7.5, 2.2, 1.6, darkMetalMat);
  addBox(0, 2.25, -44, 7.6, 0.14, 1.65, accentRedMat, false, false);

  const mountedMgs = [
    addMountedMg('bunker-hmg-south', -6.0, platY, 5.8, Math.PI, true),
    addMountedMg('bunker-hmg-north', 6.0, platY, -5.8, 0, true),
  ];

  const vehicles = [
    addTacticalVehicle('bunker-blue-jeep', 'jeep', -36, 0, 48, 0, 'blue'),
    addTacticalVehicle('bunker-blue-tank', 'tank', 36, 0, 48, 0, 'blue'),
    addTacticalVehicle('bunker-red-jeep', 'jeep', 36, 0, -48, Math.PI, 'red'),
    addTacticalVehicle('bunker-red-tank', 'tank', -36, 0, -48, Math.PI, 'red'),
  ];

  const pickups = spawnPickups([
    { id: 'med-west', type: 'health', x: -40, y: 0, z: 0 },
    { id: 'med-east', type: 'health', x: 40, y: 0, z: 0 },
    { id: 'med-w-outer', type: 'health', x: -54, y: 0, z: 0 },
    { id: 'med-e-outer', type: 'health', x: 54, y: 0, z: 0 },
    { id: 'ammo-north', type: 'ammo', x: 0, y: platY, z: -6.2 },
    { id: 'ammo-south', type: 'ammo', x: 0, y: platY, z: 6.2 },
  ]);

  return {
    mapId,
    rootGroup,
    atmosphere,
    colliders,
    ramps,
    staticRayMeshes,
    blueSpawns: [
      new THREE.Vector3(-10, 0, 52),
      new THREE.Vector3(-3, 0, 53),
      new THREE.Vector3(3, 0, 53),
      new THREE.Vector3(10, 0, 52),
      new THREE.Vector3(-22, 0, 50),
      new THREE.Vector3(22, 0, 50),
      new THREE.Vector3(-46, 0, 52),
      new THREE.Vector3(46, 0, 52),
      new THREE.Vector3(-16, 0, 47),
      new THREE.Vector3(16, 0, 47),
    ],
    redSpawns: [
      new THREE.Vector3(-10, 0, -52),
      new THREE.Vector3(-3, 0, -53),
      new THREE.Vector3(3, 0, -53),
      new THREE.Vector3(10, 0, -52),
      new THREE.Vector3(-22, 0, -50),
      new THREE.Vector3(22, 0, -50),
      new THREE.Vector3(-46, 0, -52),
      new THREE.Vector3(46, 0, -52),
      new THREE.Vector3(-16, 0, -47),
      new THREE.Vector3(16, 0, -47),
    ],
    waypoints: [
      new THREE.Vector3(-40, 0, 36),
      new THREE.Vector3(-16, 0, 34),
      new THREE.Vector3(16, 0, 34),
      new THREE.Vector3(40, 0, 36),
      new THREE.Vector3(-36, 0, 14),
      new THREE.Vector3(-18, 0, 14),
      new THREE.Vector3(18, 0, 14),
      new THREE.Vector3(36, 0, 14),
      new THREE.Vector3(-22, 0, 0),
      new THREE.Vector3(-6.0, platY, 0),
      new THREE.Vector3(6.0, platY, 0),
      new THREE.Vector3(22, 0, 0),
      new THREE.Vector3(-36, 0, -14),
      new THREE.Vector3(-18, 0, -14),
      new THREE.Vector3(18, 0, -14),
      new THREE.Vector3(36, 0, -14),
      new THREE.Vector3(-40, 0, -36),
      new THREE.Vector3(-16, 0, -34),
      new THREE.Vector3(16, 0, -34),
      new THREE.Vector3(40, 0, -36),
    ],
    pickups,
    mountedMgs,
    vehicles,
    halfSize,
    disposables: { geometries, materials, textures },
  };
}

export function groundHeightAt(x: number, z: number, currentY: number, arena: ArenaData): number {
  let ground = 0;

  for (const r of arena.ramps) {
    if (x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ) {
      const coord = r.axis === 'x' ? x : z;
      const t = THREE.MathUtils.clamp((coord - r.startCoord) / (r.endCoord - r.startCoord), 0, 1);
      const rampY = THREE.MathUtils.lerp(r.startY, r.endY, t);
      if (rampY > ground && currentY >= rampY - 0.9) {
        ground = rampY;
      }
    }
  }

  for (const c of arena.colliders) {
    if (
      x >= c.minX - 0.25 &&
      x <= c.maxX + 0.25 &&
      z >= c.minZ - 0.25 &&
      z <= c.maxZ + 0.25
    ) {
      if (currentY >= c.maxY - 0.65 && c.maxY > ground) {
        ground = c.maxY;
      }
    }
  }

  return ground;
}

export function resolveHorizontalCollision(
  pos: THREE.Vector3,
  radius: number,
  bodyHeight: number,
  arena: ArenaData
) {
  const limit = arena.halfSize - radius;
  pos.x = THREE.MathUtils.clamp(pos.x, -limit, limit);
  pos.z = THREE.MathUtils.clamp(pos.z, -limit, limit);

  for (const c of arena.colliders) {
    if (pos.y >= c.maxY - 0.35 || pos.y + bodyHeight <= c.minY + 0.05) {
      continue;
    }

    const closestX = THREE.MathUtils.clamp(pos.x, c.minX, c.maxX);
    const closestZ = THREE.MathUtils.clamp(pos.z, c.minZ, c.maxZ);
    const dx = pos.x - closestX;
    const dz = pos.z - closestZ;
    const distSq = dx * dx + dz * dz;

    if (distSq < radius * radius) {
      const dist = Math.sqrt(distSq);
      if (dist > 0.0001) {
        const push = radius - dist;
        pos.x += (dx / dist) * push;
        pos.z += (dz / dist) * push;
      } else {
        const penLeft = Math.abs(pos.x - c.minX);
        const penRight = Math.abs(c.maxX - pos.x);
        const penTop = Math.abs(pos.z - c.minZ);
        const penBottom = Math.abs(c.maxZ - pos.z);
        const minPen = Math.min(penLeft, penRight, penTop, penBottom);
        if (minPen === penLeft) pos.x = c.minX - radius;
        else if (minPen === penRight) pos.x = c.maxX + radius;
        else if (minPen === penTop) pos.z = c.minZ - radius;
        else pos.z = c.maxZ + radius;
      }
    }
  }
}
