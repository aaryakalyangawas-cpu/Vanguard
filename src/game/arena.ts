import * as THREE from 'three';
import {
  createArenaFloorTextures,
  createBunkerFloorTextures,
  createConcreteWallTextures,
  createContactShadowTexture,
  createContainerTextures,
  createDesertFloorTextures,
  createHangarSignTexture,
  createHelipadTexture,
  createIslandFloorTextures,
  createOceanTextures,
  createRoadAsphaltTextures,
  createSandbagTextures,
  createSandstoneTextures,
  createSoftGlowTexture,
  createSteelDeckTextures,
  createVehicleArmorTextures,
  createWallCrackTextures,
} from './textures';
import { ArenaZoneInfo, MapId, MapInfo, TeamId, TurretKind, VehicleType } from './types';

export const MAPS: Record<MapId, MapInfo> = {
  yard: {
    id: 'yard',
    name: 'Industrial Yard',
    environment: 'Dusk Freight Terminal',
    sizeLabel: '720×720m · 4× Air & Armor',
    description: '4× expanded 3-zone freight terminal featuring attack helicopters, helipads, heavy ordnance mini hangars, and APCs.',
    zones: ['North Freight Terminal', 'Central Overpass Plaza', 'South Harbor Depot'],
  },
  outpost: {
    id: 'outpost',
    name: 'Desert Outpost',
    environment: 'Arid Canyon Theater',
    sizeLabel: '760×760m · 4× Air & Armor',
    description: 'Vast 3-zone canyon theater 4× larger with gunship helipads, mini hangars, breachable fortresses, and armor lanes.',
    zones: ['North Canyon Fortress', 'Oasis Overlook Towers', 'South Airfield FOB'],
  },
  bunker: {
    id: 'bunker',
    name: 'Cryo Bunker',
    environment: 'Subterranean Super-Cavern',
    sizeLabel: '680×680m · 4× Mega Hangar',
    description: 'Colossal 4× underground super-complex with high cavern airspace for attack choppers, reactor decks, and ordnance hangars.',
    zones: ['North Cryo Storage Bay', 'Central Fusion Reactor', 'South Armored Hangar'],
  },
  island: {
    id: 'island',
    name: 'Pacific Atoll',
    environment: 'Tropical Archipelago · 4× Mega Theater',
    sizeLabel: '2160×2160m · Gunships & Armor',
    description: 'Enormous 2160m tropical warzone built for Apache attack helicopters, heavy tank columns, coastal bunkers, and mini hangars.',
    zones: ['North Naval Airfield', 'Central Volcano Ridge', 'South Harbor Beachhead'],
  },
  killhouse: {
    id: 'killhouse',
    name: 'Cargo Killhouse',
    environment: 'Night-Ops CQB Shoot-House',
    sizeLabel: '136×136m · 5v5 Infantry Only',
    description: 'Tight symmetrical CQB training compound with stacked containers, elevated catwalk, breachable walls, and zero vehicles or mounts.',
    zones: ['North Breach Yard', 'Central Container Gauntlet', 'South Staging Lane'],
    infantryOnly: true,
  },
  metro: {
    id: 'metro',
    name: 'Subway Concourse',
    environment: 'Underground Transit Terminal',
    sizeLabel: '148×148m · 5v5 Infantry Only',
    description: 'Close-quarters underground rail terminal with walk-through subway cars, elevated ticket mezzanine, and fast flank corridors.',
    zones: ['North Ticket Hall', 'Central Track Platforms', 'South Escalator Lobby'],
    infantryOnly: true,
  },
  rooftop: {
    id: 'rooftop',
    name: 'Skyline Helideck',
    environment: 'High-Altitude Dusk Rooftop',
    sizeLabel: '132×132m · 5v5 Infantry Only',
    description: 'Elevated skyscraper roof deck above city towers with skylight atrium, HVAC cover lanes, and fast pure gunplay.',
    zones: ['North Chiller Deck', 'Central Helideck Plaza', 'South Penthouse Terrace'],
    infantryOnly: true,
  },
};

export const MAP_ORDER: MapId[] = [
  'killhouse',
  'metro',
  'rooftop',
  'yard',
  'outpost',
  'bunker',
  'island',
];

export interface BoxCollider {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
  disabled?: boolean;
}

export interface DestructibleWallNode {
  id: string;
  position: THREE.Vector3;
  size: THREE.Vector3;
  hp: number;
  maxHp: number;
  stage: 0 | 1 | 2 | 3;
  group: THREE.Group;
  intactMesh: THREE.Mesh;
  crackMesh: THREE.Mesh;
  crackMat: THREE.MeshBasicMaterial;
  rubbleGroup: THREE.Group;
  collider: BoxCollider;
  materialType: 'concrete' | 'sandstone' | 'steel';
}

export interface ExplosiveBarrelNode {
  id: string;
  position: THREE.Vector3;
  hp: number;
  maxHp: number;
  burning: boolean;
  destroyed: boolean;
  respawnTimer: number;
  meshGroup: THREE.Group;
  hitMeshes: THREE.Object3D[];
  collider: BoxCollider;
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

export interface AmmoBeltNode {
  id: string;
  mountId: string;
  position: THREE.Vector3;
  collected: boolean;
  meshGroup: THREE.Group;
}

export interface ArsenalNode {
  id: string;
  name: string;
  team: TeamId;
  position: THREE.Vector3;
  meshGroup: THREE.Group;
}

export interface MountedMgNode {
  id: string;
  kind: TurretKind;
  name: string;
  position: THREE.Vector3;
  baseYaw: number;
  currentYaw: number;
  currentPitch: number;
  heat: number;
  overheated: boolean;
  fireCooldown: number;
  ammo: number;
  maxAmmo: number;
  hp: number;
  maxHp: number;
  destroyed: boolean;
  nestGroup: THREE.Group;
  wreckGroup: THREE.Group;
  sandbagMesh: THREE.Mesh | null;
  sandbagCollider: BoxCollider | null;
  yawGroup: THREE.Group;
  pitchGroup: THREE.Group;
  recoilGroup: THREE.Group;
  muzzlePoint: THREE.Object3D;
  muzzleFlash: THREE.Group;
  barrelHeatMat: THREE.MeshStandardMaterial;
}

export interface HangarNode {
  id: string;
  name: string;
  team: TeamId;
  position: THREE.Vector3;
  yaw: number;
  meshGroup: THREE.Group;
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
  vy: number;
  rotorRpm: number;
  turretYaw: number;
  turretPitch: number;
  health: number;
  maxHealth: number;
  ammo: number;
  maxAmmo: number;
  ammoLabel: string;
  secondaryAmmo: number;
  secondaryMaxAmmo: number;
  secondaryLabel: string;
  destroyed: boolean;
  respawnTimer: number;
  fireCooldown: number;
  root: THREE.Group;
  chassisGroup: THREE.Group;
  turretGroup: THREE.Group;
  barrelPivot: THREE.Group;
  barrelRecoilGroup: THREE.Group;
  muzzlePoint: THREE.Object3D;
  muzzleFlash: THREE.Group;
  mainRotorGroup?: THREE.Group;
  tailRotorGroup?: THREE.Group;
  wheels: THREE.Mesh[];
  hitMeshes: THREE.Object3D[];
  bodyMat: THREE.MeshStandardMaterial;
  maxSeats: number;
  seats: Array<string | null>;
  seatRoles: string[];
  seatOffsets: Array<[number, number, number]>;
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
  destructibleWalls: DestructibleWallNode[];
  barrels: ExplosiveBarrelNode[];
  blueSpawns: THREE.Vector3[];
  redSpawns: THREE.Vector3[];
  waypoints: THREE.Vector3[];
  zones: ArenaZoneInfo[];
  arsenals: ArsenalNode[];
  hangars: HangarNode[];
  pickups: PickupNode[];
  beltPickups: AmmoBeltNode[];
  mountedMgs: MountedMgNode[];
  vehicles: VehicleNode[];
  halfSize: number;
  infantryOnly?: boolean;
  oceanTextures?: { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture };
  disposables: {
    geometries: THREE.BufferGeometry[];
    materials: THREE.Material[];
    textures: THREE.Texture[];
  };
}

function createArsenalSignTexture(team: TeamId): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0c111b';
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = team === 'blue' ? '#38bdf8' : '#f87171';
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, 500, 116);
  ctx.fillStyle = team === 'blue' ? '#38bdf8' : '#f87171';
  ctx.font = 'bold 54px "Chakra Petch", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ARSENAL ARMORY', 256, 52);
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('50 WEAPONS · RESUPPLY [E]', 256, 98);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
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
  const geo = new THREE.SphereGeometry(4800, 32, 20);
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
  const destructibleWalls: DestructibleWallNode[] = [];
  const barrels: ExplosiveBarrelNode[] = [];
  const beltPickups: AmmoBeltNode[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];

  const crackTexSet = createWallCrackTextures();
  textures.push(crackTexSet.stage1, crackTexSet.stage2, crackTexSet.hazardStripe);

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
  const cyanMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.85,
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
    new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.45, metalness: 0.48 })
  );
  const drumHazardBandMat = trackMat(
    new THREE.MeshStandardMaterial({ map: crackTexSet.hazardStripe, roughness: 0.45, metalness: 0.25 })
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
  const vehicleArmorTex = createVehicleArmorTextures(maxAnisotropy);
  const contactShadowTex = createContactShadowTexture();
  textures.push(vehicleArmorTex.bumpMap, vehicleArmorTex.roughnessMap, contactShadowTex);
  const contactShadowMat = trackMat(
    new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    })
  );
  const barrierMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x646e7d, roughness: 0.88, metalness: 0.06 })
  );
  const barrierGeo = trackGeo(new THREE.BoxGeometry(3.8, 0.95, 0.65));
  const barrierTopGeo = trackGeo(new THREE.BoxGeometry(3.75, 0.35, 0.36));

  const addJerseyBarrier = (x: number, z: number, rotY = 0) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    const base = new THREE.Mesh(barrierGeo, barrierMat);
    base.position.y = 0.475;
    base.castShadow = true;
    base.receiveShadow = true;
    const top = new THREE.Mesh(barrierTopGeo, barrierMat);
    top.position.y = 0.96;
    top.castShadow = true;
    g.add(base, top);
    rootGroup.add(g);
    staticRayMeshes.push(base, top);
    const cos = Math.abs(Math.cos(rotY));
    const sin = Math.abs(Math.sin(rotY));
    const hx = cos * 1.9 + sin * 0.35;
    const hz = sin * 1.9 + cos * 0.35;
    colliders.push({ minX: x - hx, maxX: x + hx, minY: 0, maxY: 1.14, minZ: z - hz, maxZ: z + hz });
  };

  const addSupplyPallet = (x: number, yBase: number, z: number, rotY = 0) => {
    const g = new THREE.Group();
    g.position.set(x, yBase, z);
    g.rotation.y = rotY;
    const base = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.7, 0.14, 1.5)), darkMetalMat);
    base.position.y = 0.07;
    const crate1 = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.95, 0.72, 1.2)), oliveBoxMat);
    crate1.position.set(-0.28, 0.5, 0);
    crate1.castShadow = true;
    const crate2 = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.6, 0.48, 0.9)), ammoMat);
    crate2.position.set(0.42, 0.38, 0.12);
    crate2.castShadow = true;
    g.add(base, crate1, crate2);
    rootGroup.add(g);
    staticRayMeshes.push(crate1, crate2);
    colliders.push({ minX: x - 0.85, maxX: x + 0.85, minY: yBase, maxY: yBase + 0.9, minZ: z - 0.8, maxZ: z + 0.8 });
  };

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

  // Dedicated 3D Arsenal Armory Building near spawns
  const addArsenalStructure = (
    id: string,
    team: TeamId,
    x: number,
    yBase: number,
    z: number,
    facingYaw: number
  ): ArsenalNode => {
    const g = new THREE.Group();
    g.position.set(x, yBase, z);
    g.rotation.y = facingYaw;
    rootGroup.add(g);

    const floor = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(7.6, 0.25, 6.2)), darkMetalMat);
    floor.position.set(0, 0.12, 0);
    floor.receiveShadow = true;
    g.add(floor);
    staticRayMeshes.push(floor);

    const roof = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(8.0, 0.35, 6.6)), darkMetalMat);
    roof.position.set(0, 3.85, 0);
    roof.castShadow = true;
    g.add(roof);
    staticRayMeshes.push(roof);

    // Back & Side Walls (leave front open for walking inside)
    const wallBack = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(7.6, 3.6, 0.45)), darkMetalMat);
    wallBack.position.set(0, 1.9, 2.9);
    const wallLeft = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.45, 3.6, 5.8)), darkMetalMat);
    wallLeft.position.set(-3.6, 1.9, 0);
    const wallRight = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.45, 3.6, 5.8)), darkMetalMat);
    wallRight.position.set(3.6, 1.9, 0);
    g.add(wallBack, wallLeft, wallRight);
    staticRayMeshes.push(wallBack, wallLeft, wallRight);

    // Weapon Rack Cabinets inside Arsenal
    for (const rx of [-2.1, 0, 2.1]) {
      const rack = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.55, 2.2, 0.7)), oliveBoxMat);
      rack.position.set(rx, 1.25, 2.2);
      const trim = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.4, 0.12, 0.74)), team === 'blue' ? accentBlueMat : accentRedMat);
      trim.position.set(rx, 2.38, 2.2);
      g.add(rack, trim);
    }

    // Center Armory Console Table
    const table = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.8, 1.0, 1.2)), darkMetalMat);
    table.position.set(0, 0.65, 0.2);
    const holoTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.4, 0.08, 0.9)), cyanMat);
    holoTop.position.set(0, 1.18, 0.2);
    g.add(table, holoTop);

    // Glowing Header Signboard on Front Lintels (front faces -Z local)
    const signTex = createArsenalSignTexture(team);
    textures.push(signTex);
    const signMat = trackMat(new THREE.MeshBasicMaterial({ map: signTex }));
    const signFront = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(5.6, 1.3)), signMat);
    signFront.position.set(0, 4.45, -3.32);
    signFront.rotation.y = Math.PI;
    const signBack = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(5.6, 1.3)), signMat);
    signBack.position.set(0, 4.45, 3.32);
    g.add(signFront, signBack);

    const beam = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(7.8, 0.16, 0.24)),
      team === 'blue' ? accentBlueMat : accentRedMat
    );
    beam.position.set(0, 3.68, -3.15);
    g.add(beam);

    // Register colliders only on rear/side walls so player walks straight into the open bay
    const cos = Math.cos(facingYaw);
    const sin = Math.sin(facingYaw);
    const addLocalWallCollider = (lx: number, lz: number, lw: number, ld: number) => {
      const wx = x + lx * cos + lz * sin;
      const wz = z - lx * sin + lz * cos;
      const hx = Math.abs(cos) * (lw / 2) + Math.abs(sin) * (ld / 2);
      const hz = Math.abs(sin) * (lw / 2) + Math.abs(cos) * (ld / 2);
      colliders.push({ minX: wx - hx, maxX: wx + hx, minY: yBase, maxY: yBase + 3.9, minZ: wz - hz, maxZ: wz + hz });
    };
    addLocalWallCollider(0, 2.9, 7.6, 0.5);
    addLocalWallCollider(-3.6, 0, 0.5, 5.8);
    addLocalWallCollider(3.6, 0, 0.5, 5.8);

    return {
      id,
      name: team === 'blue' ? 'Vanguard Arsenal' : 'Syndicate Arsenal',
      team,
      position: new THREE.Vector3(x, yBase, z),
      meshGroup: g,
    };
  };

  const helipadTex = createHelipadTexture(maxAnisotropy);
  textures.push(helipadTex);
  const helipadMat = trackMat(
    new THREE.MeshStandardMaterial({ map: helipadTex, roughness: 0.78, metalness: 0.14 })
  );

  // Marked tactical Helipad apron for Attack Helicopters
  const addHelipad = (_id: string, team: TeamId, x: number, yBase: number, z: number) => {
    const pad = new THREE.Group();
    pad.position.set(x, yBase, z);
    rootGroup.add(pad);

    const apron = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(9.5, 9.9, 0.22, 20)), helipadMat);
    apron.position.y = 0.11;
    apron.receiveShadow = true;
    pad.add(apron);
    staticRayMeshes.push(apron);

    const trimMat = team === 'blue' ? accentBlueMat : accentRedMat;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const light = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.22, 0.26, 0.28, 8)), trimMat);
      light.position.set(Math.cos(a) * 9.1, 0.24, Math.sin(a) * 9.1);
      pad.add(light);
    }
  };

  // Dedicated Drive-In / Hover-Pad Heavy Ordnance Mini Hangar for Vehicles & Launchers
  const addMiniHangar = (
    id: string,
    team: TeamId,
    x: number,
    yBase: number,
    z: number,
    facingYaw: number
  ): HangarNode => {
    const g = new THREE.Group();
    g.position.set(x, yBase, z);
    g.rotation.y = facingYaw;
    rootGroup.add(g);

    const apronMat = trackMat(
      new THREE.MeshStandardMaterial({ map: crackTexSet.hazardStripe, roughness: 0.7, metalness: 0.15 })
    );
    const steelRoofMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.72 })
    );

    const floor = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(15.2, 0.22, 15.2)), darkMetalMat);
    floor.position.set(0, 0.11, 0);
    floor.receiveShadow = true;
    g.add(floor);
    staticRayMeshes.push(floor);

    const frontStripe = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(14.4, 0.04, 1.3)), apronMat);
    frontStripe.position.set(0, 0.23, -7.0);
    frontStripe.receiveShadow = true;
    g.add(frontStripe);

    // Side & Rear Armored Corrugated Blast Walls (open front -Z entrance so vehicles/choppers enter freely)
    const wallLeft = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.55, 6.2, 14.6)), steelRoofMat);
    wallLeft.position.set(-7.3, 3.2, 0);
    wallLeft.castShadow = true;
    wallLeft.receiveShadow = true;
    const wallRight = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.55, 6.2, 14.6)), steelRoofMat);
    wallRight.position.set(7.3, 3.2, 0);
    wallRight.castShadow = true;
    wallRight.receiveShadow = true;
    const wallBack = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(14.6, 6.2, 0.55)), steelRoofMat);
    wallBack.position.set(0, 3.2, 7.3);
    wallBack.castShadow = true;
    wallBack.receiveShadow = true;
    g.add(wallLeft, wallRight, wallBack);
    staticRayMeshes.push(wallLeft, wallRight, wallBack);

    // Arched Steel Truss Roof + Gable Panels
    for (const rz of [-6.4, -2.1, 2.1, 6.4]) {
      const girder = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(15.0, 0.42, 0.45)), darkMetalMat);
      girder.position.set(0, 6.45, rz);
      g.add(girder);
    }
    const roofLeft = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(8.2, 0.26, 15.4)), steelRoofMat);
    roofLeft.position.set(-3.8, 7.05, 0);
    roofLeft.rotation.z = 0.16;
    roofLeft.castShadow = true;
    const roofRight = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(8.2, 0.26, 15.4)), steelRoofMat);
    roofRight.position.set(3.8, 7.05, 0);
    roofRight.rotation.z = -0.16;
    roofRight.castShadow = true;
    g.add(roofLeft, roofRight);
    staticRayMeshes.push(roofLeft, roofRight);

    // Interior Heavy Missile/Shell Ordnance Racks & Pneumatic Tool Bench
    for (const rx of [-5.2, 5.2]) {
      for (const rz of [-2.4, 2.4]) {
        const crate = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.8, 1.35, 2.2)), oliveBoxMat);
        crate.position.set(rx, 0.88, rz);
        crate.castShadow = true;
        const warheadA = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.14, 0.14, 1.85, 8)), brassBeltMat);
        warheadA.rotation.x = Math.PI / 2;
        warheadA.position.set(rx, 1.7, rz);
        g.add(crate, warheadA);
      }
    }
    const bench = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(8.4, 1.05, 1.4)), darkMetalMat);
    bench.position.set(0, 0.72, 6.0);
    const benchAccent = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(7.8, 0.12, 0.22)), amberMat);
    benchAccent.position.set(0, 1.28, 5.4);
    g.add(bench, benchAccent);

    // Overhead Glowing Gantry Signboard + Entry Beacons
    const signTex = createHangarSignTexture(team);
    textures.push(signTex);
    const signMat = trackMat(new THREE.MeshBasicMaterial({ map: signTex }));
    const signFront = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(8.6, 2.0)), signMat);
    signFront.position.set(0, 6.35, -7.52);
    signFront.rotation.y = Math.PI;
    const signBack = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(8.6, 2.0)), signMat);
    signBack.position.set(0, 6.35, 7.62);
    g.add(signFront, signBack);

    const trimMat = team === 'blue' ? accentBlueMat : accentRedMat;
    for (const bx of [-7.1, 7.1]) {
      const strip = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.24, 5.8, 0.28)), trimMat);
      strip.position.set(bx, 3.1, -7.25);
      g.add(strip);
    }

    const cos = Math.cos(facingYaw);
    const sin = Math.sin(facingYaw);
    const addHangarCollider = (lx: number, lz: number, lw: number, ld: number, minH: number, maxH: number) => {
      const wx = x + lx * cos + lz * sin;
      const wz = z - lx * sin + lz * cos;
      const hx = Math.abs(cos) * (lw / 2) + Math.abs(sin) * (ld / 2);
      const hz = Math.abs(sin) * (lw / 2) + Math.abs(cos) * (ld / 2);
      colliders.push({ minX: wx - hx, maxX: wx + hx, minY: yBase + minH, maxY: yBase + maxH, minZ: wz - hz, maxZ: wz + hz });
    };
    addHangarCollider(-7.3, 0, 0.65, 14.6, 0, 6.5);
    addHangarCollider(7.3, 0, 0.65, 14.6, 0, 6.5);
    addHangarCollider(0, 7.3, 14.6, 0.65, 0, 6.5);
    addHangarCollider(0, 0, 15.2, 15.2, 6.35, 7.55);

    return {
      id,
      name: team === 'blue' ? 'Vanguard Ordnance Hangar' : 'Syndicate Ordnance Hangar',
      team,
      position: new THREE.Vector3(x, yBase, z),
      yaw: facingYaw,
      meshGroup: g,
    };
  };

  const addExplosiveBarrel = (id: string, x: number, yBase: number, z: number) => {
    const meshGroup = new THREE.Group();
    meshGroup.position.set(x, yBase + 0.59, z);
    rootGroup.add(meshGroup);

    const drum = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.42, 0.42, 1.18, 14)), drumRedMat);
    drum.castShadow = true;
    drum.receiveShadow = true;
    drum.userData.barrelId = id;
    meshGroup.add(drum);

    const hazBand = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.426, 0.426, 0.26, 14, 1, true)),
      drumHazardBandMat
    );
    hazBand.userData.barrelId = id;
    meshGroup.add(hazBand);

    for (const ry of [-0.28, 0.28]) {
      const rib = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.445, 0.445, 0.05, 14)), darkMetalMat);
      rib.position.y = ry;
      rib.userData.barrelId = id;
      meshGroup.add(rib);
    }

    const cap = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 10)), ammoMat);
    cap.position.set(0.18, 0.61, 0);
    meshGroup.add(cap);

    const collider: BoxCollider = {
      minX: x - 0.44,
      maxX: x + 0.44,
      minY: yBase,
      maxY: yBase + 1.18,
      minZ: z - 0.44,
      maxZ: z + 0.44,
    };
    colliders.push(collider);

    barrels.push({
      id,
      position: new THREE.Vector3(x, yBase, z),
      hp: 45,
      maxHp: 45,
      burning: false,
      destroyed: false,
      respawnTimer: 0,
      meshGroup,
      hitMeshes: [drum, hazBand],
      collider,
    });
  };

  const addDestructibleWall = (
    id: string,
    x: number,
    yBase: number,
    z: number,
    w: number,
    h: number,
    d: number,
    maxHp: number,
    mat: THREE.Material,
    materialType: 'concrete' | 'sandstone' | 'steel' = 'concrete'
  ) => {
    const group = new THREE.Group();
    group.position.set(x, yBase, z);
    rootGroup.add(group);

    const intactMesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(w, h, d)), mat);
    intactMesh.position.set(0, h / 2, 0);
    intactMesh.castShadow = true;
    intactMesh.receiveShadow = true;
    intactMesh.userData.wallId = id;
    group.add(intactMesh);
    staticRayMeshes.push(intactMesh);

    const crackMat = trackMat(
      new THREE.MeshBasicMaterial({
        map: crackTexSet.stage1,
        transparent: true,
        opacity: 0.94,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      })
    );
    const crackMesh = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(w + 0.04, h + 0.04, d + 0.04)),
      crackMat
    );
    crackMesh.position.set(0, h / 2, 0);
    crackMesh.visible = false;
    group.add(crackMesh);

    // Jagged debris rubble pile revealed when wall breaches
    const rubbleGroup = new THREE.Group();
    rubbleGroup.visible = false;
    const chunkCount = Math.max(5, Math.round(Math.max(w, d) * 0.9));
    for (let i = 0; i < chunkCount; i++) {
      const cw = 0.75 + Math.random() * 1.1;
      const ch = 0.24 + Math.random() * 0.36;
      const cd = 0.65 + Math.random() * 0.95;
      const chunk = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(cw, ch, cd)), mat);
      const t = chunkCount === 1 ? 0.5 : i / (chunkCount - 1) - 0.5;
      chunk.position.set(
        w >= d ? t * w * 0.85 : (Math.random() - 0.5) * (w + 1.2),
        ch * 0.45,
        d > w ? t * d * 0.85 : (Math.random() - 0.5) * (d + 1.2)
      );
      chunk.rotation.set(
        (Math.random() - 0.5) * 0.45,
        Math.random() * Math.PI,
        (Math.random() - 0.5) * 0.45
      );
      chunk.castShadow = true;
      chunk.receiveShadow = true;
      rubbleGroup.add(chunk);
    }
    group.add(rubbleGroup);

    const collider: BoxCollider = {
      minX: x - w / 2,
      maxX: x + w / 2,
      minY: yBase,
      maxY: yBase + h,
      minZ: z - d / 2,
      maxZ: z + d / 2,
    };
    colliders.push(collider);

    destructibleWalls.push({
      id,
      position: new THREE.Vector3(x, yBase, z),
      size: new THREE.Vector3(w, h, d),
      hp: maxHp,
      maxHp,
      stage: 0,
      group,
      intactMesh,
      crackMesh,
      crackMat,
      rubbleGroup,
      collider,
      materialType,
    });
  };

  const addMountedEmplacement = (
    id: string,
    kind: TurretKind,
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

    let sandbagMesh: THREE.Mesh | null = null;
    let sandbagCollider: BoxCollider | null = null;
    if (withSandbags) {
      const bagWidth = kind === 'field_gun' ? 3.2 : 2.1;
      const frontBag = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(bagWidth, 0.92, 0.58)), sandbagMat);
      frontBag.position.set(0, 0.46, kind === 'field_gun' ? -1.45 : -1.05);
      frontBag.castShadow = true;
      frontBag.receiveShadow = true;
      nest.add(frontBag);
      staticRayMeshes.push(frontBag);
      sandbagMesh = frontBag;

      const distFront = kind === 'field_gun' ? 1.45 : 1.05;
      const fwX = -Math.sin(baseYaw);
      const fwZ = -Math.cos(baseYaw);
      const bagWx = x + fwX * distFront;
      const bagWz = z + fwZ * distFront;
      const absCos = Math.abs(Math.cos(baseYaw));
      const absSin = Math.abs(Math.sin(baseYaw));
      const hx = absCos * (bagWidth / 2) + absSin * 0.3;
      const hz = absSin * (bagWidth / 2) + absCos * 0.3;
      sandbagCollider = {
        minX: bagWx - hx,
        maxX: bagWx + hx,
        minY: yBase,
        maxY: yBase + 0.92,
        minZ: bagWz - hz,
        maxZ: bagWz + hz,
      };
      colliders.push(sandbagCollider);
    }

    const yawGroup = new THREE.Group();
    yawGroup.position.set(0, kind === 'field_gun' ? 1.05 : 1.24, 0);
    nest.add(yawGroup);

    const pitchGroup = new THREE.Group();
    yawGroup.add(pitchGroup);

    const recoilGroup = new THREE.Group();
    pitchGroup.add(recoilGroup);

    const barrelHeatMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x262c36,
        metalness: 0.9,
        roughness: 0.28,
        emissive: 0xff3b00,
        emissiveIntensity: 0,
      })
    );

    const muzzlePoint = new THREE.Object3D();
    const muzzleFlash = new THREE.Group();
    const flashMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: kind === 'field_gun' ? 0xff7b1c : kind === 'tow' ? 0x38bdf8 : 0xfbbf24,
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
      })
    );

    let name = '.50 Cal M2HB Turret';

    if (kind === 'field_gun') {
      name = '105mm M119 Field Gun';
      // Towed Artillery Axle, Twin Pneumatic Wheels & Split Trails with Spades
      const axle = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.08, 0.08, 2.25, 10)), oliveBoxMat);
      axle.rotation.z = Math.PI / 2;
      axle.position.set(0, 0.56, 0.08);
      nest.add(axle);

      const artWheelGeo = trackGeo(new THREE.CylinderGeometry(0.55, 0.55, 0.28, 14));
      artWheelGeo.rotateZ(Math.PI / 2);
      for (const wx of [-1.05, 1.05]) {
        const wheel = new THREE.Mesh(artWheelGeo, tireMat);
        wheel.position.set(wx, 0.56, 0.08);
        wheel.castShadow = true;
        const hub = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.24, 0.24, 0.3, 10)), oliveBoxMat);
        hub.rotation.z = Math.PI / 2;
        wheel.add(hub);
        nest.add(wheel);
      }

      // Splayed split trails behind carriage
      for (const side of [-1, 1]) {
        const trail = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.16, 0.16, 2.35)), oliveBoxMat);
        trail.position.set(side * 0.65, 0.28, 1.15);
        trail.rotation.set(0.14, side * 0.42, 0);
        trail.castShadow = true;
        nest.add(trail);
      }

      // Notched Split Armored Gun Shield (open center sightline above breech)
      const leftShield = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.6, 0.96, 0.08)), oliveBoxMat);
      leftShield.position.set(-0.56, 0.14, -0.35);
      leftShield.rotation.x = 0.16;
      leftShield.castShadow = true;

      const rightShield = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.6, 0.96, 0.08)), oliveBoxMat);
      rightShield.position.set(0.56, 0.14, -0.35);
      rightShield.rotation.x = 0.16;
      rightShield.castShadow = true;

      const centerApron = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.54, 0.34, 0.08)), oliveBoxMat);
      centerApron.position.set(0, -0.18, -0.35);
      centerApron.rotation.x = 0.16;
      centerApron.castShadow = true;

      yawGroup.add(leftShield, rightShield, centerApron);

      // Panoramic Direct-Fire Optical Sight beside breech
      const opticMount = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.11, 0.14, 0.24)), darkMetalMat);
      opticMount.position.set(-0.24, 0.26, -0.14);
      const opticLens = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.036, 0.036, 0.05, 10)), cyanMat);
      opticLens.rotation.x = Math.PI / 2;
      opticLens.position.set(-0.24, 0.26, -0.27);
      pitchGroup.add(opticMount, opticLens);

      // Hydro-pneumatic recoil cradle + 105mm Breech + Long Barrel + Slotted Muzzle Brake
      const cradle = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.38, 0.28, 1.35)), oliveBoxMat);
      cradle.position.set(0, 0.05, -0.15);
      pitchGroup.add(cradle);

      const breech = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.32, 0.34, 0.68)), gunSteelMat);
      breech.position.set(0, 0.14, 0.22);
      const barrel = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.085, 0.115, 3.15, 14)), barrelHeatMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.14, -1.68);
      barrel.castShadow = true;
      const muzzleBrake = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.24, 0.2, 0.34)), darkMetalMat);
      muzzleBrake.position.set(0, 0.14, -3.28);
      recoilGroup.add(breech, barrel, muzzleBrake);

      muzzlePoint.position.set(0, 0.14, -3.52);
      recoilGroup.add(muzzlePoint);
      muzzleFlash.position.set(0, 0.14, -3.56);
      muzzleFlash.add(
        new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(1.4, 0.38)), flashMat),
        new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.38, 1.4)), flashMat)
      );
      muzzleFlash.visible = false;
      recoilGroup.add(muzzleFlash);
    } else {
      // M3 Heavy Tripod
      const pintle = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.065, 0.08, 1.18, 10)), darkMetalMat);
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

      if (kind === 'tow') {
        name = 'BGM-71 TOW Guided Missile';
        const tube = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.095, 0.095, 1.35, 14)), oliveBoxMat);
        tube.rotation.x = Math.PI / 2;
        tube.position.set(0, 0.12, -0.25);
        tube.castShadow = true;
        const flare = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.12, 0.095, 0.18, 14)), darkMetalMat);
        flare.rotation.x = Math.PI / 2;
        flare.position.set(0, 0.12, -0.96);
        const sightBox = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.16, 0.18, 0.34)), oliveBoxMat);
        sightBox.position.set(-0.22, 0.08, -0.15);
        const lens = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 12)), cyanMat);
        lens.rotation.x = Math.PI / 2;
        lens.position.set(-0.22, 0.08, -0.33);
        recoilGroup.add(tube, flare, sightBox, lens);

        muzzlePoint.position.set(0, 0.12, -1.08);
        recoilGroup.add(muzzlePoint);
        muzzleFlash.position.set(0, 0.12, -1.12);
        muzzleFlash.add(
          new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.65, 0.18)), flashMat),
          new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.18, 0.65)), flashMat)
        );
        muzzleFlash.visible = false;
        recoilGroup.add(muzzleFlash);
      } else if (kind === 'autocannon') {
        name = '20mm Twin Autocannon';
        const drum = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.24, 0.26, 0.34, 14)), darkMetalMat);
        drum.position.set(0, 0.02, -0.04);
        recoilGroup.add(drum);
        for (const bx of [-0.09, 0.09]) {
          const rec = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.12, 0.14, 0.56)), gunSteelMat);
          rec.position.set(bx, 0.04, -0.1);
          const brl = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.032, 0.038, 1.35, 12)), barrelHeatMat);
          brl.rotation.x = Math.PI / 2;
          brl.position.set(bx, 0.04, -0.98);
          recoilGroup.add(rec, brl);
        }
        const apron = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.75, 0.22, 0.05)), darkMetalMat);
        apron.position.set(0, -0.05, -0.34);
        const wingL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.22, 0.34, 0.05)), darkMetalMat);
        wingL.position.set(-0.28, 0.14, -0.34);
        const wingR = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.22, 0.34, 0.05)), darkMetalMat);
        wingR.position.set(0.28, 0.14, -0.34);
        recoilGroup.add(apron, wingL, wingR);

        muzzlePoint.position.set(0, 0.04, -1.68);
        recoilGroup.add(muzzlePoint);
        muzzleFlash.position.set(0, 0.04, -1.72);
        muzzleFlash.add(
          new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.72, 0.2)), flashMat),
          new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.2, 0.72)), flashMat)
        );
        muzzleFlash.visible = false;
        recoilGroup.add(muzzleFlash);
      } else if (kind === 'mg30') {
        // Browning M1919 .30 Cal Light/Medium Air-Cooled Machine Gun
        name = '.30 Cal M1919 MG';
        const receiver = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.11, 0.13, 0.48)), gunSteelMat);
        receiver.position.set(0, 0.02, -0.02);
        // Perforated ventilated cooling jacket
        const jacket = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.044, 0.046, 0.46, 12)), darkMetalMat);
        jacket.rotation.x = Math.PI / 2;
        jacket.position.set(0, 0.03, -0.49);
        for (const ringZ of [-0.34, -0.44, -0.54, -0.64]) {
          const ventRing = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.049, 0.049, 0.025, 12)), gunSteelMat);
          ventRing.rotation.x = Math.PI / 2;
          ventRing.position.set(0, 0.03, ringZ);
          recoilGroup.add(ventRing);
        }
        const barrel = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.017, 0.02, 0.84, 10)), barrelHeatMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.03, -0.72);
        const carryHandle = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.028, 0.075, 0.16)), darkMetalMat);
        carryHandle.position.set(0, 0.12, -0.18);
        const pistolGrip = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.04, 0.14, 0.06)), darkMetalMat);
        pistolGrip.position.set(0, -0.07, 0.24);
        pistolGrip.rotation.x = 0.28;
        const ammoCan = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.12, 0.18, 0.22)), oliveBoxMat);
        ammoCan.position.set(-0.17, -0.01, -0.03);
        const belt = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.11, 0.025, 0.11)), brassBeltMat);
        belt.position.set(-0.085, 0.05, -0.03);
        belt.rotation.z = 0.25;
        recoilGroup.add(receiver, jacket, barrel, carryHandle, pistolGrip, ammoCan, belt);

        muzzlePoint.position.set(0, 0.03, -1.16);
        recoilGroup.add(muzzlePoint);
        muzzleFlash.position.set(0, 0.03, -1.18);
        muzzleFlash.add(
          new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.32, 0.085)), flashMat),
          new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.085, 0.32)), flashMat)
        );
        muzzleFlash.visible = false;
        recoilGroup.add(muzzleFlash);
      } else {
        // Classic .50 Cal M2HB
        const receiver = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.16, 0.18, 0.56)), gunSteelMat);
        receiver.position.set(0, 0.02, -0.04);
        const jacket = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.052, 0.052, 0.36, 12)), darkMetalMat);
        jacket.rotation.x = Math.PI / 2;
        jacket.position.set(0, 0.02, -0.48);
        const barrel = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.024, 0.028, 0.92, 12)), barrelHeatMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.02, -0.78);
        const ammoCan = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.16, 0.24, 0.28)), oliveBoxMat);
        ammoCan.position.set(-0.22, -0.02, -0.04);
        const belt = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.14, 0.035, 0.14)), brassBeltMat);
        belt.position.set(-0.11, 0.06, -0.04);
        belt.rotation.z = 0.28;
        recoilGroup.add(receiver, jacket, barrel, ammoCan, belt);

        muzzlePoint.position.set(0, 0.02, -1.34);
        recoilGroup.add(muzzlePoint);
        muzzleFlash.position.set(0, 0.02, -1.36);
        muzzleFlash.add(
          new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.42, 0.1)), flashMat),
          new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.1, 0.42)), flashMat)
        );
        muzzleFlash.visible = false;
        recoilGroup.add(muzzleFlash);
      }
    }

    // Twisted wreckage shown when crushed by a ramming vehicle or blast
    const wreckGroup = new THREE.Group();
    wreckGroup.visible = false;
    const scrapBeam = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.16, 0.12, 1.35)), darkMetalMat);
    scrapBeam.position.set(0.12, 0.11, -0.15);
    scrapBeam.rotation.set(0.08, 0.65, 0.24);
    const bentTube = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.04, 0.06, 1.15, 8)), gunSteelMat);
    bentTube.position.set(-0.22, 0.08, -0.35);
    bentTube.rotation.set(Math.PI / 2 - 0.12, 0, -0.48);
    wreckGroup.add(scrapBeam, bentTube);
    if (withSandbags) {
      for (let i = 0; i < 4; i++) {
        const sBag = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.55, 0.22, 0.36)), sandbagMat);
        sBag.position.set((i - 1.5) * 0.52, 0.11, -0.95 + (i % 2) * 0.28);
        sBag.rotation.set((Math.random() - 0.5) * 0.35, Math.random() * 1.4, (Math.random() - 0.5) * 0.35);
        wreckGroup.add(sBag);
      }
    }
    nest.add(wreckGroup);

    const maxHp = kind === 'field_gun' ? 140 : kind === 'autocannon' || kind === 'tow' ? 120 : 90;
    const maxAmmo =
      kind === 'mg30' ? 100 : kind === 'hmg' ? 80 : kind === 'autocannon' ? 40 : kind === 'tow' ? 2 : 4;

    // Spawn 2 physical reserve ammo belt / ordnance crates flanking the emplacement
    const cosY = Math.cos(baseYaw);
    const sinY = Math.sin(baseYaw);
    const beltOffsets: Array<[number, number]> = kind === 'field_gun' ? [[-1.6, 0.72], [1.6, 0.72]] : [[-1.28, 0.36], [1.28, 0.36]];
    beltOffsets.forEach(([lx, lz], bIdx) => {
      const wx = x + lx * cosY + lz * sinY;
      const wz = z - lx * sinY + lz * cosY;
      const crateGroup = new THREE.Group();
      crateGroup.position.set(wx, yBase, wz);
      crateGroup.rotation.y = baseYaw + (bIdx === 0 ? 0.18 : -0.22);

      const canBody = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.42, 0.28, 0.24)), oliveBoxMat);
      canBody.position.set(0, 0.14, 0);
      canBody.castShadow = true;
      canBody.receiveShadow = true;
      const canLid = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.45, 0.05, 0.27)), darkMetalMat);
      canLid.position.set(0, 0.29, 0);
      const clasp = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.08, 0.12, 0.04)), brassBeltMat);
      clasp.position.set(0, 0.21, 0.13);
      const beltStrip = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.28, 0.04, 0.11)), brassBeltMat);
      beltStrip.position.set(0.06, 0.33, 0);
      beltStrip.rotation.y = 0.24;
      crateGroup.add(canBody, canLid, clasp, beltStrip);
      rootGroup.add(crateGroup);

      beltPickups.push({
        id: `${id}-belt-${bIdx}`,
        mountId: id,
        position: new THREE.Vector3(wx, yBase, wz),
        collected: false,
        meshGroup: crateGroup,
      });
    });

    return {
      id,
      kind,
      name,
      position: new THREE.Vector3(x, yBase, z),
      baseYaw,
      currentYaw: baseYaw,
      currentPitch: 0,
      heat: 0,
      overheated: false,
      fireCooldown: 0,
      ammo: maxAmmo,
      maxAmmo,
      hp: maxHp,
      maxHp,
      destroyed: false,
      nestGroup: nest,
      wreckGroup,
      sandbagMesh,
      sandbagCollider,
      yawGroup,
      pitchGroup,
      recoilGroup,
      muzzlePoint,
      muzzleFlash,
      barrelHeatMat,
    };
  };

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

    const chassisGroup = new THREE.Group();
    root.add(chassisGroup);

    const baseColor =
      teamHint === 'blue' ? 0x2c4a70 : teamHint === 'red' ? 0x6b2c2a : 0x4b533b;
    const bodyMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: baseColor,
        bumpMap: vehicleArmorTex.bumpMap,
        bumpScale: 0.032,
        roughnessMap: vehicleArmorTex.roughnessMap,
        roughness: 0.62,
        metalness: 0.46,
      })
    );
    const hitMeshes: THREE.Object3D[] = [];
    const wheels: THREE.Mesh[] = [];

    const regHit = (m: THREE.Object3D) => {
      m.userData.vehicleId = id;
      hitMeshes.push(m);
    };

    const isCannon = type === 'tank' || type === 'heavy_tank';
    const isApc = type === 'apc';
    const isHeli = type === 'attack_heli';
    const contactW = isHeli ? 4.4 : type === 'heavy_tank' ? 4.4 : type === 'tank' ? 3.8 : isApc ? 3.6 : 2.9;
    const contactL = isHeli ? 8.2 : type === 'heavy_tank' ? 7.2 : type === 'tank' ? 6.2 : isApc ? 7.0 : 4.8;
    const contactShadow = new THREE.Mesh(
      trackGeo(new THREE.PlaneGeometry(contactW, contactL)),
      contactShadowMat
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.032;
    contactShadow.renderOrder = 1;
    root.add(contactShadow);

    const turretGroup = new THREE.Group();
    const barrelPivot = new THREE.Group();
    const barrelRecoilGroup = new THREE.Group();
    const muzzlePoint = new THREE.Object3D();
    const muzzleFlash = new THREE.Group();
    const flashMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: isCannon ? 0xff922b : isApc || isHeli ? 0xf59e0b : 0xfef08a,
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
      })
    );

    if (isHeli) {
      // AH-64D Apache-Style Twin-Turbine Attack Helicopter (2 Crew: Pilot Hydra-70 Rockets, Co-Pilot 30mm Chain Gun)
      const heliSkidMat = darkMetalMat;
      const canopyGlassMat = glassMat;
      const bladeMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x161a22, roughness: 0.42, metalness: 0.55 }));

      // Main armored fuselage hull + side avionics sponsons
      const fuselage = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.48, 1.24, 5.4)), bodyMat);
      fuselage.position.set(0, 1.38, 0.25);
      fuselage.castShadow = true;
      fuselage.receiveShadow = true;
      chassisGroup.add(fuselage);
      regHit(fuselage);

      const lowerSponson = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.05, 0.52, 3.85)), bodyMat);
      lowerSponson.position.set(0, 1.06, 0.18);
      lowerSponson.castShadow = true;
      chassisGroup.add(lowerSponson);
      regHit(lowerSponson);

      // Tapered armored nose cone + TADS/PNVS FLIR targeting ball
      const noseCone = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.12, 0.88, 1.65)), bodyMat);
      noseCone.position.set(0, 1.24, -2.92);
      noseCone.rotation.x = 0.16;
      noseCone.castShadow = true;
      const tadsTurret = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.32, 12, 10)), darkMetalMat);
      tadsTurret.position.set(0, 1.18, -3.76);
      const tadsLens = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.11, 0.11, 0.14, 10)), cyanMat);
      tadsLens.rotation.x = Math.PI / 2;
      tadsLens.position.set(0, 1.18, -4.04);
      chassisGroup.add(noseCone, tadsTurret, tadsLens);
      regHit(noseCone);

      // Stepped tandem armored cockpit canopy + roll frame
      const cockpitCanopy = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.06, 0.68, 2.75)), canopyGlassMat);
      cockpitCanopy.position.set(0, 2.18, -1.25);
      cockpitCanopy.rotation.x = 0.12;
      const canopyFrame = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.1, 0.1, 2.8)), darkMetalMat);
      canopyFrame.position.set(0, 2.48, -1.22);
      canopyFrame.rotation.x = 0.12;
      chassisGroup.add(cockpitCanopy, canopyFrame);
      regHit(cockpitCanopy);

      // Twin side turboshaft engine nacelles + IR exhaust shrouds
      for (const ex of [-0.95, 0.95]) {
        const nacelle = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.34, 0.36, 2.45, 10)), bodyMat);
        nacelle.rotation.x = Math.PI / 2;
        nacelle.position.set(ex, 2.02, 0.55);
        nacelle.castShadow = true;
        const exhaust = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.24, 0.28, 0.65, 10)), darkMetalMat);
        exhaust.rotation.x = Math.PI / 2 + 0.15;
        exhaust.position.set(ex, 2.04, 1.88);
        chassisGroup.add(nacelle, exhaust);
        regHit(nacelle);
      }

      // Stub wings + endplates + Hydra-70 19-tube rocket pods + AGM missile rails
      const stubWing = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(5.1, 0.18, 1.15)), bodyMat);
      stubWing.position.set(0, 1.32, -0.05);
      stubWing.castShadow = true;
      chassisGroup.add(stubWing);
      regHit(stubWing);

      for (const sx of [-1, 1]) {
        const winglet = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.14, 0.62, 1.05)), bodyMat);
        winglet.position.set(sx * 2.55, 1.48, -0.05);
        const pylonIn = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.16, 0.34, 0.72)), darkMetalMat);
        pylonIn.position.set(sx * 1.48, 1.08, -0.08);
        const pod = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.26, 0.26, 1.55, 12)), oliveBoxMat);
        pod.rotation.x = Math.PI / 2;
        pod.position.set(sx * 1.48, 0.84, -0.22);
        const podFace = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.23, 0.23, 0.06, 12)), amberMat);
        podFace.rotation.x = Math.PI / 2;
        podFace.position.set(sx * 1.48, 0.84, -1.0);
        const pylonOut = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.14, 0.32, 0.7)), darkMetalMat);
        pylonOut.position.set(sx * 2.18, 1.08, -0.08);
        const agmTube = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.1, 0.1, 1.65, 8)), gunSteelMat);
        agmTube.rotation.x = Math.PI / 2;
        agmTube.position.set(sx * 2.18, 0.84, -0.18);
        chassisGroup.add(winglet, pylonIn, pod, podFace, pylonOut, agmTube);
      }

      // Tail boom + swept vertical stabilizer fin + horizontal stabilator
      const tailBoom = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.56, 0.62, 4.65)), bodyMat);
      tailBoom.position.set(0, 1.56, 4.75);
      tailBoom.castShadow = true;
      const tailFin = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.18, 1.85, 1.05)), bodyMat);
      tailFin.position.set(0, 2.38, 6.72);
      tailFin.rotation.x = -0.35;
      tailFin.castShadow = true;
      const stabilator = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.35, 0.12, 0.65)), bodyMat);
      stabilator.position.set(0, 1.38, 6.72);
      chassisGroup.add(tailBoom, tailFin, stabilator);
      regHit(tailBoom);

      // Twin armored landing skids + angled cross struts
      for (const sx of [-1.05, 1.05]) {
        const skid = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.065, 0.065, 4.2, 8)), heliSkidMat);
        skid.rotation.x = Math.PI / 2;
        skid.position.set(sx, 0.08, -0.15);
        chassisGroup.add(skid);
        for (const sz of [-1.05, 1.05]) {
          const strut = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.055, 0.055, 0.92, 8)), heliSkidMat);
          strut.position.set(sx * 0.82, 0.48, sz);
          strut.rotation.z = sx > 0 ? -0.42 : 0.42;
          chassisGroup.add(strut);
        }
      }

      // Main 4-Blade Rotor Mast & Hub (spins smoothly with v.rotorRpm)
      const mainRotorGroup = new THREE.Group();
      mainRotorGroup.position.set(0, 2.86, 0.08);
      const mastShaft = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.12, 0.15, 0.56, 10)), darkMetalMat);
      mastShaft.position.y = -0.22;
      const hubCap = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.32, 0.38, 0.24, 12)), darkMetalMat);
      mainRotorGroup.add(mastShaft, hubCap);
      for (let bi = 0; bi < 4; bi++) {
        const bladePivot = new THREE.Group();
        bladePivot.rotation.y = (bi * Math.PI) / 2;
        const blade = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.32, 0.045, 4.4)), bladeMat);
        blade.position.set(0, 0.05, -2.35);
        const tipCap = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.34, 0.05, 0.24)), amberMat);
        tipCap.position.set(0, 0.05, -4.45);
        bladePivot.add(blade, tipCap);
        mainRotorGroup.add(bladePivot);
      }
      chassisGroup.add(mainRotorGroup);

      // Tail 4-Blade Anti-Torque Rotor (mounted on port vertical fin)
      const tailRotorGroup = new THREE.Group();
      tailRotorGroup.position.set(-0.24, 2.85, 6.92);
      const tailHub = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.11, 0.11, 0.2, 10)), darkMetalMat);
      tailHub.rotation.z = Math.PI / 2;
      tailRotorGroup.add(tailHub);
      for (let ti = 0; ti < 4; ti++) {
        const tbPivot = new THREE.Group();
        tbPivot.rotation.x = (ti * Math.PI) / 2;
        const tBlade = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.035, 0.14, 0.92)), bladeMat);
        tBlade.position.set(-0.04, 0, -0.52);
        tbPivot.add(tBlade);
        tailRotorGroup.add(tbPivot);
      }
      chassisGroup.add(tailRotorGroup);

      // Chin-Mounted Gimbaled M230 30mm Chain Gun
      turretGroup.position.set(0, 0.72, -2.25);
      chassisGroup.add(turretGroup);
      const turretMount = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.24, 0.28, 0.22, 10)), darkMetalMat);
      turretGroup.add(turretMount);
      turretGroup.add(barrelPivot);
      barrelPivot.position.set(0, -0.1, 0);
      barrelPivot.add(barrelRecoilGroup);

      const gunRec = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.22, 0.2, 0.56)), gunSteelMat);
      gunRec.position.set(0, 0, -0.05);
      const barrel30 = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.038, 0.046, 1.35, 10)), gunSteelMat);
      barrel30.rotation.x = Math.PI / 2;
      barrel30.position.set(0, -0.02, -0.92);
      barrelRecoilGroup.add(gunRec, barrel30);

      muzzlePoint.position.set(0, -0.02, -1.65);
      barrelRecoilGroup.add(muzzlePoint);
      muzzleFlash.position.set(0, -0.02, -1.7);
      muzzleFlash.add(
        new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.68, 0.18)), flashMat),
        new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.18, 0.68)), flashMat)
      );
      muzzleFlash.visible = false;
      barrelRecoilGroup.add(muzzleFlash);

      return {
        id,
        type,
        name: 'AH-64 Apache Gunship',
        teamHint,
        spawnPos: new THREE.Vector3(x, yBase, z),
        spawnYaw: yaw,
        position: new THREE.Vector3(x, yBase, z),
        yaw,
        speed: 0,
        vy: 0,
        rotorRpm: 0,
        turretYaw: 0,
        turretPitch: 0,
        health: 460,
        maxHealth: 460,
        ammo: 14,
        maxAmmo: 14,
        ammoLabel: 'Hydra-70 Rockets',
        secondaryAmmo: 180,
        secondaryMaxAmmo: 180,
        secondaryLabel: '30mm M230 HE',
        destroyed: false,
        respawnTimer: 0,
        fireCooldown: 0,
        root,
        chassisGroup,
        turretGroup,
        barrelPivot,
        barrelRecoilGroup,
        muzzlePoint,
        muzzleFlash,
        mainRotorGroup,
        tailRotorGroup,
        wheels,
        hitMeshes,
        bodyMat,
        maxSeats: 2,
        seats: [null, null],
        seatRoles: ['Pilot (Hydra-70)', 'Co-Pilot (30mm Gunner)'],
        seatOffsets: [
          [0, 1.75, -0.92],
          [0, 1.56, -1.85],
        ],
      };
    }

    if (isApc) {
      // Stryker 8x8 Armored Personnel Carrier (4 seats: Driver, 20mm RWS Gunner, Left Port, Right Port)
      const hullLower = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.68, 0.84, 5.95)), bodyMat);
      hullLower.position.set(0, 1.0, 0);
      hullLower.castShadow = true;
      hullLower.receiveShadow = true;
      chassisGroup.add(hullLower);
      regHit(hullLower);

      const hullUpper = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.42, 0.62, 5.1)), bodyMat);
      hullUpper.position.set(0, 1.7, 0.25);
      hullUpper.castShadow = true;
      chassisGroup.add(hullUpper);
      regHit(hullUpper);

      const slopedNose = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.48, 0.56, 1.45)), bodyMat);
      slopedNose.position.set(0, 1.38, -2.55);
      slopedNose.rotation.x = 0.44;
      slopedNose.castShadow = true;
      chassisGroup.add(slopedNose);
      regHit(slopedNose);

      const driverVisor = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.95, 0.22, 0.28)), glassMat);
      driverVisor.position.set(-0.55, 1.72, -1.92);
      const rearRamp = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.75, 1.15, 0.16)), darkMetalMat);
      rearRamp.position.set(0, 1.25, 2.96);
      rearRamp.rotation.x = -0.14;
      chassisGroup.add(driverVisor, rearRamp);
      regHit(rearRamp);

      // Tow shackles, exhaust stack, spare tire & whip radio antenna
      for (const tx of [-0.72, 0.72]) {
        const shackle = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.16, 0.14, 0.26)), darkMetalMat);
        shackle.position.set(tx, 0.88, -3.02);
        chassisGroup.add(shackle);
      }
      const exhaust = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.08, 0.09, 1.15, 8)), darkMetalMat);
      exhaust.position.set(1.22, 1.55, 1.85);
      const roofSpare = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.46, 0.46, 0.28, 12)), tireMat);
      roofSpare.position.set(-0.68, 2.08, 1.75);
      const whip = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.015, 0.025, 1.55, 6)), gunSteelMat);
      whip.position.set(1.02, 2.75, 2.35);
      chassisGroup.add(exhaust, roofSpare, whip);

      // Side armor skirts, ERA stowage panels & troop firing hatch rails
      for (const sx of [-1.24, 1.24]) {
        const portFrame = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.08, 0.24, 2.6)), darkMetalMat);
        portFrame.position.set(sx, 1.66, 0.55);
        const eraSkirt = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.14, 0.42, 4.4)), bodyMat);
        eraSkirt.position.set(sx * 1.1, 1.04, 0.15);
        const hatchRail = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.1, 0.12, 1.3)), darkMetalMat);
        hatchRail.position.set(sx * 0.88, 2.06, 0.82);
        chassisGroup.add(portFrame, eraSkirt, hatchRail);
      }

      for (const hx of [-0.9, 0.9]) {
        const hl = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.26, 0.15, 0.08)), headlightMat);
        hl.position.set(hx, 1.18, -3.02);
        const tl = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.24, 0.14, 0.08)), accentRedMat);
        tl.position.set(hx, 1.18, 2.98);
        chassisGroup.add(hl, tl);
      }

      // 8 heavy combat tires + axle struts
      const apcWheelGeo = trackGeo(new THREE.CylinderGeometry(0.56, 0.56, 0.42, 14));
      apcWheelGeo.rotateZ(Math.PI / 2);
      const apcHubGeo = trackGeo(new THREE.CylinderGeometry(0.26, 0.26, 0.44, 10));
      apcHubGeo.rotateZ(Math.PI / 2);
      const apcAxleGeo = trackGeo(new THREE.CylinderGeometry(0.09, 0.09, 2.6, 8));
      apcAxleGeo.rotateZ(Math.PI / 2);
      for (const wz of [-2.12, -0.72, 0.72, 2.12]) {
        const axle = new THREE.Mesh(apcAxleGeo, darkMetalMat);
        axle.position.set(0, 0.56, wz);
        root.add(axle);
        for (const wx of [-1.36, 1.36]) {
          const wMesh = new THREE.Mesh(apcWheelGeo, tireMat);
          wMesh.position.set(wx, 0.56, wz);
          wMesh.castShadow = true;
          wMesh.add(new THREE.Mesh(apcHubGeo, rimMat));
          root.add(wMesh);
          wheels.push(wMesh);
        }
      }

      // 20mm Remote Weapon Station (RWS) roof turret
      turretGroup.position.set(0, 2.02, 0.15);
      chassisGroup.add(turretGroup);
      const rwsBase = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.52, 0.58, 0.24, 12)), darkMetalMat);
      rwsBase.position.set(0, 0.12, 0);
      turretGroup.add(rwsBase);
      regHit(rwsBase);

      turretGroup.add(barrelPivot);
      barrelPivot.position.set(0, 0.34, 0);
      barrelPivot.add(barrelRecoilGroup);

      const pod = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.46, 0.32, 0.78)), gunSteelMat);
      pod.position.set(0, 0, -0.05);
      const autoBarrel = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.042, 0.052, 1.65, 12)), gunSteelMat);
      autoBarrel.rotation.x = Math.PI / 2;
      autoBarrel.position.set(0, 0.02, -1.15);
      autoBarrel.castShadow = true;
      const sensorPod = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.18, 0.18, 0.28)), darkMetalMat);
      sensorPod.position.set(-0.32, 0.08, -0.15);
      const opticGlass = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.055, 0.055, 0.06, 10)), cyanMat);
      opticGlass.rotation.x = Math.PI / 2;
      opticGlass.position.set(-0.32, 0.08, -0.3);
      barrelRecoilGroup.add(pod, autoBarrel, sensorPod, opticGlass);

      muzzlePoint.position.set(0, 0.02, -2.02);
      barrelRecoilGroup.add(muzzlePoint);
      muzzleFlash.position.set(0, 0.02, -2.08);
      muzzleFlash.add(
        new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.76, 0.2)), flashMat),
        new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.2, 0.76)), flashMat)
      );
      muzzleFlash.visible = false;
      barrelRecoilGroup.add(muzzleFlash);

      return {
        id,
        type,
        name: 'Stryker 8×8 APC',
        teamHint,
        spawnPos: new THREE.Vector3(x, yBase, z),
        spawnYaw: yaw,
        position: new THREE.Vector3(x, yBase, z),
        yaw,
        speed: 0,
        vy: 0,
        rotorRpm: 0,
        turretYaw: 0,
        turretPitch: 0,
        health: 520,
        maxHealth: 520,
        ammo: 120,
        maxAmmo: 120,
        ammoLabel: '20mm Bushmaster',
        secondaryAmmo: 0,
        secondaryMaxAmmo: 0,
        secondaryLabel: '',
        destroyed: false,
        respawnTimer: 0,
        fireCooldown: 0,
        root,
        chassisGroup,
        turretGroup,
        barrelPivot,
        barrelRecoilGroup,
        muzzlePoint,
        muzzleFlash,
        wheels,
        hitMeshes,
        bodyMat,
        maxSeats: 4,
        seats: [null, null, null, null],
        seatRoles: ['Driver', '20mm RWS Gunner', 'Left Firing Port', 'Right Firing Port'],
        seatOffsets: [
          [-0.45, 1.85, -1.65],
          [0, 2.52, 0.25],
          [-1.08, 1.92, 0.85],
          [1.08, 1.92, 0.85],
        ],
      };
    }

    if (type === 'jeep' || type === 'buggy') {
      const isBuggy = type === 'buggy';
      const chassis = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(isBuggy ? 1.85 : 2.05, isBuggy ? 0.42 : 0.58, isBuggy ? 3.65 : 4.15)),
        bodyMat
      );
      chassis.position.set(0, isBuggy ? 0.62 : 0.72, 0);
      chassis.castShadow = true;
      chassis.receiveShadow = true;
      chassisGroup.add(chassis);
      regHit(chassis);

      const hood = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(isBuggy ? 1.55 : 1.94, 0.34, 1.3)), bodyMat);
      hood.position.set(0, 0.98, -1.2);
      hood.rotation.x = 0.1;
      chassisGroup.add(hood);
      regHit(hood);

      const grille = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.18, 0.26, 0.1)), darkMetalMat);
      grille.position.set(0, 0.88, -1.88);
      const bumper = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.05, 0.22, 0.22)), darkMetalMat);
      bumper.position.set(0, 0.6, -2.02);
      const spareWheel = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.4, 0.4, 0.26, 12)), tireMat);
      spareWheel.rotation.x = Math.PI / 2;
      spareWheel.position.set(0, 1.0, isBuggy ? 1.88 : 2.12);
      const whip = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.012, 0.02, 1.35, 6)), gunSteelMat);
      whip.position.set(-0.82, 1.85, 1.45);
      chassisGroup.add(grille, bumper, spareWheel, whip);

      for (const hx of [-0.65, 0.65]) {
        const hl = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.24, 0.14, 0.08)), headlightMat);
        hl.position.set(hx, 0.88, -1.98);
        const tl = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.22, 0.14, 0.08)), accentRedMat);
        tl.position.set(hx, 0.82, 1.92);
        chassisGroup.add(hl, tl);
      }

      if (!isBuggy) {
        const windshield = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.82, 0.58, 0.08)), glassMat);
        windshield.position.set(0, 1.38, -0.52);
        windshield.rotation.x = -0.32;
        chassisGroup.add(windshield);
      }

      const roof = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.75, 0.1, 1.85)), bodyMat);
      roof.position.set(0, 1.66, 0.38);
      roof.castShadow = true;
      chassisGroup.add(roof);
      regHit(roof);

      for (const [px, pz] of [
        [-0.82, -0.45],
        [0.82, -0.45],
        [-0.82, 1.25],
        [0.82, 1.25],
      ]) {
        const pillar = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.1, 0.72, 0.1)), darkMetalMat);
        pillar.position.set(px, 1.32, pz);
        chassisGroup.add(pillar);
      }

      // Axles & heavy off-road tires
      const axleGeo = trackGeo(new THREE.CylinderGeometry(0.075, 0.075, 2.05, 8));
      axleGeo.rotateZ(Math.PI / 2);
      for (const az of [-1.26, 1.26]) {
        const axle = new THREE.Mesh(axleGeo, darkMetalMat);
        axle.position.set(0, 0.48, az);
        root.add(axle);
      }

      const wheelGeo = trackGeo(new THREE.CylinderGeometry(0.48, 0.48, 0.34, 14));
      wheelGeo.rotateZ(Math.PI / 2);
      const hubGeo = trackGeo(new THREE.CylinderGeometry(0.22, 0.22, 0.36, 10));
      hubGeo.rotateZ(Math.PI / 2);
      for (const [wx, wz] of [
        [-1.06, -1.26],
        [1.06, -1.26],
        [-1.06, 1.26],
        [1.06, 1.26],
      ]) {
        const wMesh = new THREE.Mesh(wheelGeo, tireMat);
        wMesh.position.set(wx, 0.48, wz);
        wMesh.castShadow = true;
        wMesh.add(new THREE.Mesh(hubGeo, rimMat));
        root.add(wMesh);
        wheels.push(wMesh);
      }

      turretGroup.position.set(0, 1.78, 0.32);
      chassisGroup.add(turretGroup);
      turretGroup.add(new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.3, 0.34, 0.14, 12)), darkMetalMat));
      turretGroup.add(barrelPivot);
      barrelPivot.position.set(0, 0.22, 0);
      barrelPivot.add(barrelRecoilGroup);

      const mgBody = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.14, 0.16, 0.56)), gunSteelMat);
      mgBody.position.set(0, 0, -0.1);
      const mgBarrel = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.025, 0.03, 0.95, 10)), gunSteelMat);
      mgBarrel.rotation.x = Math.PI / 2;
      mgBarrel.position.set(0, 0.02, -0.78);
      const ammoBox = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.18, 0.22, 0.24)), oliveBoxMat);
      ammoBox.position.set(0.16, -0.02, -0.1);
      barrelRecoilGroup.add(mgBody, mgBarrel, ammoBox);

      muzzlePoint.position.set(0, 0.02, -1.32);
      barrelRecoilGroup.add(muzzlePoint);
      muzzleFlash.position.set(0, 0.02, -1.36);
      muzzleFlash.add(
        new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.46, 0.12)), flashMat),
        new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.12, 0.46)), flashMat)
      );
      muzzleFlash.visible = false;
      barrelRecoilGroup.add(muzzleFlash);

      return {
        id,
        type,
        name: isBuggy ? 'Phantom Strike Buggy' : 'Tactical 4×4 Recon',
        teamHint,
        spawnPos: new THREE.Vector3(x, yBase, z),
        spawnYaw: yaw,
        position: new THREE.Vector3(x, yBase, z),
        yaw,
        speed: 0,
        vy: 0,
        rotorRpm: 0,
        turretYaw: 0,
        turretPitch: 0,
        health: isBuggy ? 220 : 300,
        maxHealth: isBuggy ? 220 : 300,
        ammo: 200,
        maxAmmo: 200,
        ammoLabel: '.50 Cal MG',
        secondaryAmmo: 0,
        secondaryMaxAmmo: 0,
        secondaryLabel: '',
        destroyed: false,
        respawnTimer: 0,
        fireCooldown: 0,
        root,
        chassisGroup,
        turretGroup,
        barrelPivot,
        barrelRecoilGroup,
        muzzlePoint,
        muzzleFlash,
        wheels,
        hitMeshes,
        bodyMat,
        maxSeats: 3,
        seats: [null, null, null],
        seatRoles: isBuggy
          ? ['Driver', '.50 Turret Gunner', 'Rear Rollcage Gunner']
          : ['Driver', '.50 Turret Gunner', 'Rear Passenger'],
        seatOffsets: isBuggy
          ? [[-0.4, 1.28, -0.1], [0, 1.82, 0.32], [0.44, 1.44, 0.92]]
          : [[-0.45, 1.38, -0.15], [0, 1.86, 0.32], [0.55, 1.46, 0.28]],
      };
    }

    // Striker Armored IFV (105mm) OR M1A2 Abrams Heavy MBT (120mm) — 3 Seats (Commander/Main, Cupola .50 Coax, Rear Deck Gunner)
    const isHeavy = type === 'heavy_tank';
    const hullW = isHeavy ? 3.2 : 2.75;
    const hullL = isHeavy ? 5.8 : 4.95;
    const hull = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(hullW, 0.96, hullL)), bodyMat);
    hull.position.set(0, 0.96, 0);
    hull.castShadow = true;
    hull.receiveShadow = true;
    chassisGroup.add(hull);
    regHit(hull);

    const glacis = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(hullW - 0.1, 0.56, 1.35)), bodyMat);
    glacis.position.set(0, 1.05, -hullL * 0.45);
    glacis.rotation.x = 0.48;
    glacis.castShadow = true;
    chassisGroup.add(glacis);
    regHit(glacis);

    // Front ERA reactive armor bricks + engine deck radiator louvers + rear exhausts
    for (const ex of [-0.95, 0, 0.95]) {
      const era = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.65, 0.14, 0.42)), darkMetalMat);
      era.position.set(ex, 1.26, -hullL * 0.43);
      era.rotation.x = 0.48;
      chassisGroup.add(era);
    }
    const engineDeck = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(hullW * 0.72, 0.08, 1.35)), darkMetalMat);
    engineDeck.position.set(0, 1.47, hullL * 0.32);
    chassisGroup.add(engineDeck);

    for (const sx of [-(hullW / 2 + 0.12), hullW / 2 + 0.12]) {
      const skirt = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.42, 0.58, hullL - 0.1)), darkMetalMat);
      skirt.position.set(sx, 0.68, 0);
      skirt.castShadow = true;
      chassisGroup.add(skirt);
      regHit(skirt);

      for (let wi = -2; wi <= 2; wi++) {
        const roadWheel = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.4, 0.4, 0.44, 12)),
          tireMat
        );
        roadWheel.rotation.z = Math.PI / 2;
        roadWheel.position.set(sx * 0.96, 0.4, wi * (isHeavy ? 1.16 : 1.02));
        root.add(roadWheel);
        wheels.push(roadWheel);
      }
    }

    for (const hx of [-1.0, 1.0]) {
      const hl = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.28, 0.15, 0.08)), headlightMat);
      hl.position.set(hx, 1.1, -hullL * 0.53);
      chassisGroup.add(hl);
    }

    turretGroup.position.set(0, 1.5, 0.15);
    chassisGroup.add(turretGroup);

    const turretHull = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(isHeavy ? 2.35 : 1.92, 0.72, isHeavy ? 2.9 : 2.35)),
      bodyMat
    );
    turretHull.position.set(0, 0.34, 0.1);
    turretHull.castShadow = true;
    turretGroup.add(turretHull);
    regHit(turretHull);

    // Turret cheek ERA plates, bustle stowage rack, smoke launchers & radio whip
    const bustle = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(isHeavy ? 2.1 : 1.7, 0.48, 0.72)), darkMetalMat);
    bustle.position.set(0, 0.42, isHeavy ? 1.65 : 1.38);
    turretGroup.add(bustle);
    regHit(bustle);

    for (const side of [-1, 1]) {
      const smokeBank = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.1, 0.12, 0.38, 8)), gunSteelMat);
      smokeBank.position.set(side * (isHeavy ? 1.24 : 1.02), 0.44, -0.45);
      smokeBank.rotation.x = Math.PI / 3;
      smokeBank.rotation.z = -side * 0.3;
      turretGroup.add(smokeBank);
    }
    const tankWhip = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.015, 0.025, 1.65, 6)), gunSteelMat);
    tankWhip.position.set(-0.82, 1.48, 1.4);
    turretGroup.add(tankWhip);

    const cupola = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.36, 0.4, 0.26, 12)), darkMetalMat);
    cupola.position.set(0.5, 0.8, 0.35);
    const coaxGun = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.022, 0.026, 0.82, 8)), gunSteelMat);
    coaxGun.rotation.x = Math.PI / 2;
    coaxGun.position.set(0.5, 0.96, -0.1);
    turretGroup.add(cupola, coaxGun);
    regHit(cupola);

    turretGroup.add(barrelPivot);
    barrelPivot.position.set(0, 0.36, isHeavy ? -1.3 : -1.05);
    barrelPivot.add(barrelRecoilGroup);

    const mantlet = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.68, 0.38, 0.48)), darkMetalMat);
    mantlet.position.set(0, 0, -0.1);
    const barrelLen = isHeavy ? 3.7 : 2.9;
    const mainGun = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(isHeavy ? 0.1 : 0.085, isHeavy ? 0.125 : 0.11, barrelLen, 12)),
      gunSteelMat
    );
    mainGun.rotation.x = Math.PI / 2;
    mainGun.position.set(0, 0, -barrelLen / 2 - 0.1);
    mainGun.castShadow = true;
    const fumeExtractor = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(isHeavy ? 0.17 : 0.15, isHeavy ? 0.17 : 0.15, 0.58, 12)),
      darkMetalMat
    );
    fumeExtractor.rotation.x = Math.PI / 2;
    fumeExtractor.position.set(0, 0, -barrelLen * 0.48);
    const muzzleBrake = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.28, 0.22, 0.36)), darkMetalMat);
    muzzleBrake.position.set(0, 0, -barrelLen - 0.14);
    barrelRecoilGroup.add(mantlet, mainGun, fumeExtractor, muzzleBrake);

    muzzlePoint.position.set(0, 0, -barrelLen - 0.36);
    barrelRecoilGroup.add(muzzlePoint);
    muzzleFlash.position.set(0, 0, -barrelLen - 0.44);
    muzzleFlash.add(
      new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(1.3, 0.35)), flashMat),
      new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.35, 1.3)), flashMat)
    );
    muzzleFlash.visible = false;
    barrelRecoilGroup.add(muzzleFlash);

    return {
      id,
      type,
      name: isHeavy ? 'M1A2 Heavy MBT' : 'Striker Armored IFV',
      teamHint,
      spawnPos: new THREE.Vector3(x, yBase, z),
      spawnYaw: yaw,
      position: new THREE.Vector3(x, yBase, z),
      yaw,
      speed: 0,
      vy: 0,
      rotorRpm: 0,
      turretYaw: 0,
      turretPitch: 0,
      health: isHeavy ? 850 : 580,
      maxHealth: isHeavy ? 850 : 580,
      ammo: isHeavy ? 16 : 20,
      maxAmmo: isHeavy ? 16 : 20,
      ammoLabel: isHeavy ? '120mm APHE' : '105mm HE',
      secondaryAmmo: 240,
      secondaryMaxAmmo: 240,
      secondaryLabel: 'Coax .50',
      destroyed: false,
      respawnTimer: 0,
      fireCooldown: 0,
      root,
      chassisGroup,
      turretGroup,
      barrelPivot,
      barrelRecoilGroup,
      muzzlePoint,
      muzzleFlash,
      wheels,
      hitMeshes,
      bodyMat,
      maxSeats: 3,
      seats: [null, null, null],
      seatRoles: ['Commander / Main Cannon', 'Cupola .50 Coax Gunner', 'Rear Deck Passenger'],
      seatOffsets: [[0, 2.25, 0.15], [0.55, 2.45, 0.45], [0, 1.72, isHeavy ? 2.15 : 1.85]],
    };
  };

  // =========================================================================
  // MAP 1: INDUSTRIAL YARD (Expanded 720x720m · 4x Area · 3 Big Tactical Zones)
  // =========================================================================
  if (mapId === 'yard') {
    const halfSize = 360;
    const zones: ArenaZoneInfo[] = [
      { id: 'A', name: 'North Freight Terminal', centerX: 0, centerZ: -236, radius: 132, accentHex: '#EF4444' },
      { id: 'B', name: 'Central Overpass Plaza', centerX: 0, centerZ: 0, radius: 132, accentHex: '#F59E0B' },
      { id: 'C', name: 'South Harbor Depot', centerX: 0, centerZ: 236, radius: 132, accentHex: '#3B82F6' },
    ];
    const atmosphere: ArenaAtmosphere = {
      bgColor: 0x242329,
      fogColor: 0x1f242e,
      fogDensity: 0.00135,
      sunColor: 0xffdfba,
      sunIntensity: 2.4,
      sunPos: [165, 160, 95],
      hemiSky: 0x93c5fd,
      hemiGround: 0x262930,
      hemiIntensity: 0.98,
    };

    rootGroup.add(
      buildSkyDome(0x0b1322, 0x1b283b, 0x473832, atmosphere.sunPos, [1.0, 0.72, 0.42], 0.48, geometries, materials)
    );

    const floorTexSet = createArenaFloorTextures(maxAnisotropy);
    floorTexSet.map.repeat.set(128, 128);
    floorTexSet.bumpMap.repeat.set(128, 128);
    floorTexSet.roughnessMap.repeat.set(128, 128);
    const concreteTexSet = createConcreteWallTextures(maxAnisotropy);
    const blueContainerTex = createContainerTextures('#1e3a5f', '#3b82f6', maxAnisotropy);
    const redContainerTex = createContainerTextures('#5c1f24', '#ef4444', maxAnisotropy);
    const slateContainerTex = createContainerTextures('#334155', '#f59e0b', maxAnisotropy);
    const deckTexSet = createSteelDeckTextures(maxAnisotropy);

    textures.push(
      floorTexSet.map, floorTexSet.bumpMap, floorTexSet.roughnessMap,
      concreteTexSet.map, concreteTexSet.bumpMap,
      blueContainerTex.map, blueContainerTex.bumpMap,
      redContainerTex.map, redContainerTex.bumpMap,
      slateContainerTex.map, slateContainerTex.bumpMap,
      deckTexSet.map, deckTexSet.bumpMap
    );

    const floorMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: floorTexSet.map, bumpMap: floorTexSet.bumpMap, bumpScale: 0.04,
        roughnessMap: floorTexSet.roughnessMap, roughness: 0.9, metalness: 0.14,
      })
    );
    const outerGroundMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x151922, roughness: 0.95, metalness: 0.05 }));
    const concreteMat = trackMat(
      new THREE.MeshStandardMaterial({ map: concreteTexSet.map, bumpMap: concreteTexSet.bumpMap, bumpScale: 0.05, roughness: 0.82, metalness: 0.08 })
    );
    const deckMat = trackMat(
      new THREE.MeshStandardMaterial({ map: deckTexSet.map, bumpMap: deckTexSet.bumpMap, bumpScale: 0.04, roughness: 0.38, metalness: 0.76 })
    );
    const blueContainerMat = trackMat(
      new THREE.MeshStandardMaterial({ map: blueContainerTex.map, bumpMap: blueContainerTex.bumpMap, bumpScale: 0.06, roughness: 0.5, metalness: 0.62 })
    );
    const redContainerMat = trackMat(
      new THREE.MeshStandardMaterial({ map: redContainerTex.map, bumpMap: redContainerTex.bumpMap, bumpScale: 0.06, roughness: 0.5, metalness: 0.62 })
    );
    const slateContainerMat = trackMat(
      new THREE.MeshStandardMaterial({ map: slateContainerTex.map, bumpMap: slateContainerTex.bumpMap, bumpScale: 0.06, roughness: 0.48, metalness: 0.64 })
    );
    const floodLampMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0xfff7ed, emissive: 0xffedd5, emissiveIntensity: 2.2, roughness: 0.1 })
    );

    const outerGround = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(2400, 2400)), outerGroundMat);
    outerGround.rotation.x = -Math.PI / 2;
    outerGround.position.y = -0.04;
    outerGround.receiveShadow = true;
    rootGroup.add(outerGround);

    const mainFloor = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(halfSize * 2, halfSize * 2)), floorMat);
    mainFloor.rotation.x = -Math.PI / 2;
    mainFloor.receiveShadow = true;
    rootGroup.add(mainFloor);
    staticRayMeshes.push(mainFloor);

    const wallH = 10.0;
    const wallT = 3.6;
    addBox(0, wallH / 2, -halfSize - wallT / 2, halfSize * 2 + wallT * 2, wallH, wallT, concreteMat);
    addBox(0, wallH / 2, halfSize + wallT / 2, halfSize * 2 + wallT * 2, wallH, wallT, concreteMat);
    addBox(-halfSize - wallT / 2, wallH / 2, 0, wallT, wallH, halfSize * 2, concreteMat);
    addBox(halfSize + wallT / 2, wallH / 2, 0, wallT, wallH, halfSize * 2, concreteMat);

    // Zone dividing concrete arches (Zones A, B, C)
    for (const divZ of [-120, 120]) {
      const stripMat = divZ < 0 ? accentRedMat : accentBlueMat;
      addBox(-190, 2.2, divZ, 26, 4.4, 3.4, concreteMat);
      addBox(190, 2.2, divZ, 26, 4.4, 3.4, concreteMat);
      addBox(-190, 4.5, divZ, 26.2, 0.18, 3.5, stripMat, false, false);
      addBox(190, 4.5, divZ, 26.2, 0.18, 3.5, stripMat, false, false);
      addBox(-92, 2.0, divZ, 18, 4.0, 3.0, concreteMat);
      addBox(92, 2.0, divZ, 18, 4.0, 3.0, concreteMat);
    }

    // 14 Destructible Compound Masonry Walls (breachable with missiles, field guns, cannons, grenades, barrels, ramming)
    addDestructibleWall('yard-dw-1', -46, 0, -120, 16, 3.6, 1.4, 150, concreteMat, 'concrete');
    addDestructibleWall('yard-dw-2', 46, 0, -120, 16, 3.6, 1.4, 150, concreteMat, 'concrete');
    addDestructibleWall('yard-dw-3', -46, 0, 120, 16, 3.6, 1.4, 150, concreteMat, 'concrete');
    addDestructibleWall('yard-dw-4', 46, 0, 120, 16, 3.6, 1.4, 150, concreteMat, 'concrete');
    addDestructibleWall('yard-dw-5', 0, 0, -56, 14, 3.2, 1.2, 130, concreteMat, 'concrete');
    addDestructibleWall('yard-dw-6', 0, 0, 56, 14, 3.2, 1.2, 130, concreteMat, 'concrete');
    addDestructibleWall('yard-dw-7', -156, 0, -34, 1.4, 3.4, 14, 140, concreteMat, 'concrete');
    addDestructibleWall('yard-dw-8', 156, 0, 34, 1.4, 3.4, 14, 140, concreteMat, 'concrete');
    addDestructibleWall('yard-dw-9', -42, 0, -206, 14, 3.4, 1.2, 135, concreteMat, 'concrete');
    addDestructibleWall('yard-dw-10', 42, 0, 206, 14, 3.4, 1.2, 135, concreteMat, 'concrete');
    addDestructibleWall('yard-dw-11', -250, 0, -120, 16, 3.5, 1.4, 145, concreteMat, 'concrete');
    addDestructibleWall('yard-dw-12', 250, 0, -120, 16, 3.5, 1.4, 145, concreteMat, 'concrete');
    addDestructibleWall('yard-dw-13', -250, 0, 120, 16, 3.5, 1.4, 145, concreteMat, 'concrete');
    addDestructibleWall('yard-dw-14', 250, 0, 120, 16, 3.5, 1.4, 145, concreteMat, 'concrete');

    // Floodlight towers
    for (const [tx, tz] of [
      [-335, -335], [335, -335], [-335, 335], [335, 335], [-335, 0], [335, 0],
    ]) {
      const pole = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.45, 0.65, 28, 10)), darkMetalMat);
      pole.position.set(tx, 14, tz);
      rootGroup.add(pole);
      const head = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.2, 1.25, 1.1)), darkMetalMat);
      head.position.set(tx, 28.4, tz);
      head.lookAt(0, 0, 0);
      rootGroup.add(head);
      const panel = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(3.6, 0.95)), floodLampMat);
      panel.position.set(0, 0, 0.58);
      head.add(panel);
      const halo = new THREE.Sprite(
        trackMat(new THREE.SpriteMaterial({ map: warmGlowTex, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }))
      );
      halo.scale.set(18, 18, 1);
      halo.position.set(0, 0, 0.8);
      head.add(halo);
    }

    // Distant Skyline Silhouette
    const distantMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x181f2a, roughness: 0.88, metalness: 0.25 }));
    for (const [sx, sz, sw, sh, sd] of [
      [-460, -450, 68, 86, 62], [0, -490, 150, 66, 48], [460, -450, 72, 92, 66],
      [-460, 450, 68, 76, 62], [460, 450, 74, 72, 66], [-495, 0, 48, 70, 160], [495, 0, 48, 74, 160],
    ]) {
      const b = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(sw, sh, sd)), distantMat);
      b.position.set(sx, sh / 2 - 0.04, sz);
      rootGroup.add(b);
    }

    // ZONE B (Central Overpass & Refinery Plaza)
    const bridgeY = 3.4;
    addBox(0, bridgeY - 0.25, 0, 52, 0.5, 18, deckMat, true);
    for (const px of [-22, 22]) {
      for (const pz of [-7.5, 7.5]) {
        addBox(px, (bridgeY - 0.5) / 2, pz, 1.5, bridgeY - 0.5, 1.5, darkMetalMat, true);
      }
    }
    addBox(0, bridgeY + 0.55, -8.6, 50, 1.1, 0.35, darkMetalMat, true);
    addBox(0, bridgeY + 0.55, 8.6, 50, 1.1, 0.35, darkMetalMat, true);
    addBox(0, bridgeY + 1.14, -8.6, 50, 0.1, 0.38, amberMat, false, false);
    addBox(0, bridgeY + 1.14, 8.6, 50, 0.1, 0.38, amberMat, false, false);
    buildRamp(-42, -26, 0, 8.2, 0, bridgeY, deckMat);
    buildRamp(42, 26, 0, 8.2, 0, bridgeY, deckMat);

    // Zone B & Flank Cargo Clusters + Industrial Silos
    for (const [cx, cz] of [
      [-126, -46], [-126, 46], [126, -46], [126, 46],
      [-252, -46], [252, 46], [-210, 0], [210, 0],
      [-74, -88], [74, 88], [-74, 88], [74, -88],
    ]) {
      addBox(cx, 1.8, cz, 4.4, 3.6, 13, slateContainerMat);
    }
    for (const [sx, sz] of [[-228, 52], [228, -52], [-170, -165], [170, 165]]) {
      const silo = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(4.8, 4.8, 9.2, 16)), concreteMat);
      silo.position.set(sx, 4.6, sz);
      silo.castShadow = true;
      rootGroup.add(silo);
      staticRayMeshes.push(silo);
      colliders.push({ minX: sx - 4.8, maxX: sx + 4.8, minY: 0, maxY: 9.2, minZ: sz - 4.8, maxZ: sz + 4.8 });
    }

    // ZONE A (North Rail Freight Terminal, Red Base)
    for (const [cx, cz] of [
      [-54, -222], [54, -222], [-172, -196], [172, -196], [-268, -242], [268, -242],
      [-115, -165], [115, -165], [0, -172],
    ]) {
      addBox(cx, 1.8, cz, 12, 3.6, 4.2, redContainerMat);
    }
    addBox(0, 1.4, -268, 18, 2.8, 2.4, concreteMat);
    addBox(0, 2.88, -268, 18.2, 0.16, 2.45, accentRedMat, false, false);

    // ZONE C (South Harbor Logistics Depot, Blue Base)
    for (const [cx, cz] of [
      [-54, 222], [54, 222], [-172, 196], [172, 196], [-268, 242], [268, 242],
      [-115, 165], [115, 165], [0, 172],
    ]) {
      addBox(cx, 1.8, cz, 12, 3.6, 4.2, blueContainerMat);
    }
    addBox(0, 1.4, 268, 18, 2.8, 2.4, concreteMat);
    addBox(0, 2.88, 268, 18.2, 0.16, 2.45, accentBlueMat, false, false);

    // Concrete Jersey Road Barriers & Tactical Supply Pallets
    for (const [jx, jz, jr] of [
      [-26, 84, 0.25], [26, 84, -0.25], [-26, -84, -0.25], [26, -84, 0.25],
      [-98, 0, Math.PI / 2], [98, 0, Math.PI / 2],
      [-185, 92, 0.3], [185, -92, 0.3],
    ]) {
      addJerseyBarrier(jx, jz, jr);
    }
    for (const [px, pz, pr] of [
      [-42, 236, 0.4], [42, -236, -0.4], [-186, -32, 0.2], [186, 32, -0.2],
    ]) {
      addSupplyPallet(px, 0, pz, pr);
    }

    // Explosive Hazmat Fuel Drums
    const barrelCoords: Array<[number, number]> = [
      [-40, -116], [-38.6, -116], [40, -116],
      [-40, 116], [40, 116], [38.6, 116],
      [-26, 32], [26, -32], [-112, -24], [112, 24],
      [-148, -34], [148, 34], [-218, 62], [218, -62],
      [-56, -196], [56, 196], [0, -52], [0, 52],
      [-242, -116], [242, 116],
    ];
    barrelCoords.forEach(([bx, bz], idx) => addExplosiveBarrel(`yard-barrel-${idx}`, bx, 0, bz));

    // Arsenals & Heavy Ordnance Mini Hangars Near Spawns
    const arsenals: ArsenalNode[] = [
      addArsenalStructure('yard-arsenal-blue', 'blue', -68, 0, 296, 0),
      addArsenalStructure('yard-arsenal-red', 'red', 68, 0, -296, Math.PI),
    ];

    const hangars: HangarNode[] = [
      addMiniHangar('yard-hangar-blue', 'blue', 104, 0, 294, 0),
      addMiniHangar('yard-hangar-red', 'red', -104, 0, -294, Math.PI),
    ];

    // Helipads
    addHelipad('yard-helipad-blue', 'blue', -144, 0, 312);
    addHelipad('yard-helipad-red', 'red', 144, 0, -312);

    // 11 Turrets, .30 Cal MGs & Realistic Field Guns across Zones A, B, C
    const mountedMgs: MountedMgNode[] = [
      addMountedEmplacement('yard-fg-south', 'field_gun', -104, 0, 172, 0.12, true),
      addMountedEmplacement('yard-fg-north', 'field_gun', 104, 0, -172, Math.PI + 0.12, true),
      addMountedEmplacement('yard-tow-west', 'tow', -192, 0, 26, -0.35, true),
      addMountedEmplacement('yard-tow-east', 'tow', 192, 0, -26, Math.PI - 0.35, true),
      addMountedEmplacement('yard-auto-mid-w', 'autocannon', -19, bridgeY, 6.4, 0, false),
      addMountedEmplacement('yard-auto-mid-e', 'autocannon', 19, bridgeY, -6.4, Math.PI, false),
      addMountedEmplacement('yard-hmg-a', 'hmg', -62, 0, -142, Math.PI, true),
      addMountedEmplacement('yard-hmg-c', 'hmg', 62, 0, 142, 0, true),
      addMountedEmplacement('yard-mg30-w', 'mg30', -276, 0, 0, -Math.PI / 2, true),
      addMountedEmplacement('yard-mg30-e', 'mg30', 276, 0, 0, Math.PI / 2, true),
      addMountedEmplacement('yard-mg30-s', 'mg30', -14, 0, 110, 0, true),
    ];

    // 10 Tactical Vehicles (including 2 AH-64 Apache Attack Helicopters)
    const vehicles: VehicleNode[] = [
      addTacticalVehicle('yard-blue-apc', 'apc', -34, 0, 294, 0, 'blue'),
      addTacticalVehicle('yard-blue-jeep', 'jeep', -104, 0, 286, 0, 'blue'),
      addTacticalVehicle('yard-blue-buggy', 'buggy', 142, 0, 286, 0, 'blue'),
      addTacticalVehicle('yard-blue-mbt', 'heavy_tank', 34, 0, 302, 0, 'blue'),
      addTacticalVehicle('yard-blue-heli', 'attack_heli', -144, 0.25, 312, 0, 'blue'),
      addTacticalVehicle('yard-red-apc', 'apc', 34, 0, -294, Math.PI, 'red'),
      addTacticalVehicle('yard-red-jeep', 'jeep', 104, 0, -286, Math.PI, 'red'),
      addTacticalVehicle('yard-red-buggy', 'buggy', -142, 0, -286, Math.PI, 'red'),
      addTacticalVehicle('yard-red-mbt', 'heavy_tank', -34, 0, -302, Math.PI, 'red'),
      addTacticalVehicle('yard-red-heli', 'attack_heli', 144, 0.25, -312, Math.PI, 'red'),
    ];

    const pickups = spawnPickups([
      { id: 'med-b-w', type: 'health', x: -168, y: 0, z: 0 },
      { id: 'med-b-e', type: 'health', x: 168, y: 0, z: 0 },
      { id: 'med-a', type: 'health', x: -96, y: 0, z: -214 },
      { id: 'med-c', type: 'health', x: 96, y: 0, z: 214 },
      { id: 'ammo-bridge', type: 'ammo', x: 0, y: bridgeY, z: 0 },
      { id: 'ammo-south', type: 'ammo', x: 0, y: 0, z: 184 },
      { id: 'ammo-north', type: 'ammo', x: 0, y: 0, z: -184 },
    ]);

    return {
      mapId,
      rootGroup,
      atmosphere,
      colliders,
      ramps,
      staticRayMeshes,
      destructibleWalls,
      barrels,
      zones,
      arsenals,
      hangars,
      blueSpawns: [
        new THREE.Vector3(-34, 0, 322), new THREE.Vector3(-12, 0, 326), new THREE.Vector3(12, 0, 326),
        new THREE.Vector3(34, 0, 322), new THREE.Vector3(-92, 0, 318), new THREE.Vector3(92, 0, 318),
        new THREE.Vector3(-208, 0, 312), new THREE.Vector3(208, 0, 312), new THREE.Vector3(-56, 0, 282),
        new THREE.Vector3(56, 0, 282),
      ],
      redSpawns: [
        new THREE.Vector3(-34, 0, -322), new THREE.Vector3(-12, 0, -326), new THREE.Vector3(12, 0, -326),
        new THREE.Vector3(34, 0, -322), new THREE.Vector3(-92, 0, -318), new THREE.Vector3(92, 0, -318),
        new THREE.Vector3(-208, 0, -312), new THREE.Vector3(208, 0, -312), new THREE.Vector3(-56, 0, -282),
        new THREE.Vector3(56, 0, -282),
      ],
      waypoints: [
        new THREE.Vector3(-216, 0, 216), new THREE.Vector3(0, 0, 216), new THREE.Vector3(216, 0, 216),
        new THREE.Vector3(-152, 0, 96), new THREE.Vector3(0, 0, 88), new THREE.Vector3(152, 0, 96),
        new THREE.Vector3(-188, 0, 0), new THREE.Vector3(0, bridgeY, 0), new THREE.Vector3(188, 0, 0),
        new THREE.Vector3(-152, 0, -96), new THREE.Vector3(0, 0, -88), new THREE.Vector3(152, 0, -96),
        new THREE.Vector3(-216, 0, -216), new THREE.Vector3(0, 0, -216), new THREE.Vector3(216, 0, -216),
      ],
      pickups,
      beltPickups,
      mountedMgs,
      vehicles,
      halfSize,
      disposables: { geometries, materials, textures },
    };
  }

  // =========================================================================
  // MAP 2: DESERT OUTPOST (Expanded 760x760m · 4x Area · 3 Big Canyon Zones)
  // =========================================================================
  if (mapId === 'outpost') {
    const halfSize = 380;
    const zones: ArenaZoneInfo[] = [
      { id: 'A', name: 'North Canyon Fortress', centerX: 0, centerZ: -248, radius: 136, accentHex: '#EF4444' },
      { id: 'B', name: 'Oasis Overlook Towers', centerX: 0, centerZ: 0, radius: 136, accentHex: '#F59E0B' },
      { id: 'C', name: 'South Airfield FOB', centerX: 0, centerZ: 248, radius: 136, accentHex: '#3B82F6' },
    ];
    const atmosphere: ArenaAtmosphere = {
      bgColor: 0xc9a984,
      fogColor: 0xd1b38f,
      fogDensity: 0.0011,
      sunColor: 0xfff3d6,
      sunIntensity: 2.6,
      sunPos: [175, 175, -95],
      hemiSky: 0x93c5fd,
      hemiGround: 0x9c764e,
      hemiIntensity: 1.05,
    };

    rootGroup.add(
      buildSkyDome(0x2563eb, 0x7dd3fc, 0xe8cfa8, atmosphere.sunPos, [1.0, 0.85, 0.58], 0.36, geometries, materials)
    );

    const desertFloor = createDesertFloorTextures(maxAnisotropy);
    desertFloor.map.repeat.set(136, 136);
    desertFloor.bumpMap.repeat.set(136, 136);
    desertFloor.roughnessMap.repeat.set(136, 136);
    const sandstone = createSandstoneTextures(maxAnisotropy);
    const tanContainer = createContainerTextures('#9a8462', '#d97706', maxAnisotropy);
    textures.push(
      desertFloor.map, desertFloor.bumpMap, desertFloor.roughnessMap,
      sandstone.map, sandstone.bumpMap, tanContainer.map, tanContainer.bumpMap
    );

    const floorMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: desertFloor.map, bumpMap: desertFloor.bumpMap, bumpScale: 0.06,
        roughnessMap: desertFloor.roughnessMap, roughness: 0.94, metalness: 0.04,
      })
    );
    const outerSandMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x98744f, roughness: 0.96, metalness: 0.02 }));
    const adobeMat = trackMat(
      new THREE.MeshStandardMaterial({ map: sandstone.map, bumpMap: sandstone.bumpMap, bumpScale: 0.06, roughness: 0.88, metalness: 0.04 })
    );
    const hescoMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x8f7a5b, roughness: 0.9, metalness: 0.08 }));
    const crateMat = trackMat(
      new THREE.MeshStandardMaterial({ map: tanContainer.map, bumpMap: tanContainer.bumpMap, bumpScale: 0.05, roughness: 0.56, metalness: 0.45 })
    );
    const mesaMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x8c6343, roughness: 0.92, metalness: 0.04 }));

    const outerGround = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(2600, 2600)), outerSandMat);
    outerGround.rotation.x = -Math.PI / 2;
    outerGround.position.y = -0.04;
    outerGround.receiveShadow = true;
    rootGroup.add(outerGround);

    const mainFloor = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(halfSize * 2, halfSize * 2)), floorMat);
    mainFloor.rotation.x = -Math.PI / 2;
    mainFloor.receiveShadow = true;
    rootGroup.add(mainFloor);
    staticRayMeshes.push(mainFloor);

    const wallH = 8.5;
    const wallT = 3.6;
    addBox(0, wallH / 2, -halfSize - wallT / 2, halfSize * 2 + wallT * 2, wallH, wallT, adobeMat);
    addBox(0, wallH / 2, halfSize + wallT / 2, halfSize * 2 + wallT * 2, wallH, wallT, adobeMat);
    addBox(-halfSize - wallT / 2, wallH / 2, 0, wallT, wallH, halfSize * 2, adobeMat);
    addBox(halfSize + wallT / 2, wallH / 2, 0, wallT, wallH, halfSize * 2, adobeMat);

    for (const [mx, mz, mw, mh, md] of [
      [-510, -490, 150, 92, 110], [500, -495, 160, 98, 110],
      [-510, 480, 140, 76, 120], [510, 480, 150, 84, 120],
      [0, -560, 260, 68, 70], [0, 560, 260, 64, 70],
    ]) {
      const mesa = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(mw, mh, md)), mesaMat);
      mesa.position.set(mx, mh / 2 - 0.1, mz);
      rootGroup.add(mesa);
    }

    // ZONE B: Twin Overlook Fortress Towers (y = 3.8m) + Central Citadel + Mid-lane Hesco Bunkers
    const towerY = 3.8;
    for (const side of [-1, 1]) {
      const tx = side * 168;
      addBox(tx, towerY - 0.25, 0, 18, 0.5, 20, adobeMat, true);
      addBox(tx, (towerY - 0.5) / 2, -8.2, 1.5, towerY - 0.5, 1.5, darkMetalMat, true);
      addBox(tx, (towerY - 0.5) / 2, 8.2, 1.5, towerY - 0.5, 1.5, darkMetalMat, true);
      addBox(tx - side * 8.6, towerY + 0.55, 0, 0.45, 1.1, 20, hescoMat, true);
      buildRamp(tx - side * 24, tx - side * 9, 0, 7.0, 0, towerY, hescoMat);
    }
    addBox(0, 2.2, 0, 11.5, 4.4, 11.5, adobeMat);
    for (const [cx, cz] of [
      [-64, -60], [64, -60], [-64, 60], [64, 60],
      [-115, -145], [115, -145], [-115, 145], [115, 145],
    ]) {
      addBox(cx, 1.1, cz, 12, 2.2, 2.2, hescoMat);
    }

    // 14 Destructible Sandstone Fortress Walls
    addDestructibleWall('outpost-dw-1', -96, 0, -128, 16, 3.6, 1.5, 145, adobeMat, 'sandstone');
    addDestructibleWall('outpost-dw-2', 96, 0, -128, 16, 3.6, 1.5, 145, adobeMat, 'sandstone');
    addDestructibleWall('outpost-dw-3', -96, 0, 128, 16, 3.6, 1.5, 145, adobeMat, 'sandstone');
    addDestructibleWall('outpost-dw-4', 96, 0, 128, 16, 3.6, 1.5, 145, adobeMat, 'sandstone');
    addDestructibleWall('outpost-dw-5', 0, 0, -68, 15, 3.2, 1.3, 130, adobeMat, 'sandstone');
    addDestructibleWall('outpost-dw-6', 0, 0, 68, 15, 3.2, 1.3, 130, adobeMat, 'sandstone');
    addDestructibleWall('outpost-dw-7', -224, 0, -48, 1.5, 3.4, 16, 140, adobeMat, 'sandstone');
    addDestructibleWall('outpost-dw-8', 224, 0, 48, 1.5, 3.4, 16, 140, adobeMat, 'sandstone');
    addDestructibleWall('outpost-dw-9', 0, 0, -214, 16, 3.5, 1.5, 150, adobeMat, 'sandstone');
    addDestructibleWall('outpost-dw-10', 0, 0, 214, 16, 3.5, 1.5, 150, adobeMat, 'sandstone');
    addDestructibleWall('outpost-dw-11', -240, 0, -172, 16, 3.5, 1.5, 145, adobeMat, 'sandstone');
    addDestructibleWall('outpost-dw-12', 240, 0, -172, 16, 3.5, 1.5, 145, adobeMat, 'sandstone');
    addDestructibleWall('outpost-dw-13', -240, 0, 172, 16, 3.5, 1.5, 145, adobeMat, 'sandstone');
    addDestructibleWall('outpost-dw-14', 240, 0, 172, 16, 3.5, 1.5, 145, adobeMat, 'sandstone');

    // ZONE A (North Fortress) & ZONE C (South Airfield FOB)
    for (const [cx, cz] of [
      [-72, -228], [72, -228], [-216, -188], [216, -188],
      [-72, 228], [72, 228], [-216, 188], [216, 188],
      [-150, 0], [150, 0], [0, -138], [0, 138],
    ]) {
      addBox(cx, 1.8, cz, 14, 3.6, 4.4, crateMat);
    }
    addBox(0, 1.4, -276, 18, 2.8, 2.4, hescoMat);
    addBox(0, 2.88, -276, 18.2, 0.16, 2.45, accentRedMat, false, false);
    addBox(0, 1.4, 276, 18, 2.8, 2.4, hescoMat);
    addBox(0, 2.88, 276, 18.2, 0.16, 2.45, accentBlueMat, false, false);

    for (const [jx, jz, jr] of [
      [-36, 96, 0.15], [36, 96, -0.15], [-36, -96, -0.15], [36, -96, 0.15],
      [-190, 82, 0.2], [190, -82, -0.2],
    ]) {
      addJerseyBarrier(jx, jz, jr);
    }
    for (const [px, pz] of [[-92, 236], [92, -236], [-116, 0], [116, 0]]) {
      addSupplyPallet(px, 0, pz);
    }

    const outpostBarrels: Array<[number, number]> = [
      [-84, -122], [84, -122], [-84, 122], [84, 122],
      [-56, -52], [56, -52], [-56, 52], [56, 52],
      [-152, -28], [152, 28], [-216, -36], [216, 36],
      [-8, -206], [8, 206], [-128, -184], [128, 184],
    ];
    outpostBarrels.forEach(([bx, bz], idx) => addExplosiveBarrel(`outpost-barrel-${idx}`, bx, 0, bz));

    const arsenals: ArsenalNode[] = [
      addArsenalStructure('outpost-arsenal-blue', 'blue', -74, 0, 312, 0),
      addArsenalStructure('outpost-arsenal-red', 'red', 74, 0, -312, Math.PI),
    ];

    const hangars: HangarNode[] = [
      addMiniHangar('outpost-hangar-blue', 'blue', 108, 0, 308, 0),
      addMiniHangar('outpost-hangar-red', 'red', -108, 0, -308, Math.PI),
    ];

    addHelipad('outpost-helipad-blue', 'blue', -152, 0, 326);
    addHelipad('outpost-helipad-red', 'red', 152, 0, -326);

    const mountedMgs: MountedMgNode[] = [
      addMountedEmplacement('outpost-fg-south', 'field_gun', -104, 0, 184, 0.1, true),
      addMountedEmplacement('outpost-fg-north', 'field_gun', 104, 0, -184, Math.PI + 0.1, true),
      addMountedEmplacement('outpost-tow-west', 'tow', -160, towerY, 0, -Math.PI / 2, false),
      addMountedEmplacement('outpost-tow-east', 'tow', 160, towerY, 0, Math.PI / 2, false),
      addMountedEmplacement('outpost-auto-w', 'autocannon', -276, 0, 0, -Math.PI / 2, true),
      addMountedEmplacement('outpost-auto-e', 'autocannon', 276, 0, 0, Math.PI / 2, true),
      addMountedEmplacement('outpost-hmg-a', 'hmg', 0, 0, -152, Math.PI, true),
      addMountedEmplacement('outpost-hmg-c', 'hmg', 0, 0, 152, 0, true),
      addMountedEmplacement('outpost-mg30-w', 'mg30', -80, 0, -96, Math.PI, true),
      addMountedEmplacement('outpost-mg30-e', 'mg30', 80, 0, 96, 0, true),
    ];

    const vehicles: VehicleNode[] = [
      addTacticalVehicle('outpost-blue-apc', 'apc', -34, 0, 312, 0, 'blue'),
      addTacticalVehicle('outpost-blue-buggy', 'buggy', -112, 0, 304, 0, 'blue'),
      addTacticalVehicle('outpost-blue-jeep', 'jeep', 152, 0, 304, 0, 'blue'),
      addTacticalVehicle('outpost-blue-tank', 'tank', 34, 0, 318, 0, 'blue'),
      addTacticalVehicle('outpost-blue-heli', 'attack_heli', -152, 0.25, 326, 0, 'blue'),
      addTacticalVehicle('outpost-red-apc', 'apc', 34, 0, -312, Math.PI, 'red'),
      addTacticalVehicle('outpost-red-buggy', 'buggy', 112, 0, -304, Math.PI, 'red'),
      addTacticalVehicle('outpost-red-jeep', 'jeep', -152, 0, -304, Math.PI, 'red'),
      addTacticalVehicle('outpost-red-mbt', 'heavy_tank', -34, 0, -318, Math.PI, 'red'),
      addTacticalVehicle('outpost-red-heli', 'attack_heli', 152, 0.25, -326, Math.PI, 'red'),
    ];

    const pickups = spawnPickups([
      { id: 'med-west-tower', type: 'health', x: -168, y: towerY, z: 5.5 },
      { id: 'med-east-tower', type: 'health', x: 168, y: towerY, z: -5.5 },
      { id: 'med-a', type: 'health', x: -116, y: 0, z: -224 },
      { id: 'med-c', type: 'health', x: 116, y: 0, z: 224 },
      { id: 'ammo-center-n', type: 'ammo', x: 0, y: 0, z: -34 },
      { id: 'ammo-center-s', type: 'ammo', x: 0, y: 0, z: 34 },
    ]);

    return {
      mapId,
      rootGroup,
      atmosphere,
      colliders,
      ramps,
      staticRayMeshes,
      destructibleWalls,
      barrels,
      zones,
      arsenals,
      hangars,
      blueSpawns: [
        new THREE.Vector3(-36, 0, 336), new THREE.Vector3(-12, 0, 340), new THREE.Vector3(12, 0, 340),
        new THREE.Vector3(36, 0, 336), new THREE.Vector3(-96, 0, 332), new THREE.Vector3(96, 0, 332),
        new THREE.Vector3(-224, 0, 326), new THREE.Vector3(224, 0, 326), new THREE.Vector3(-60, 0, 296),
        new THREE.Vector3(60, 0, 296),
      ],
      redSpawns: [
        new THREE.Vector3(-36, 0, -336), new THREE.Vector3(-12, 0, -340), new THREE.Vector3(12, 0, -340),
        new THREE.Vector3(36, 0, -336), new THREE.Vector3(-96, 0, -332), new THREE.Vector3(96, 0, -332),
        new THREE.Vector3(-224, 0, -326), new THREE.Vector3(224, 0, -326), new THREE.Vector3(-60, 0, -296),
        new THREE.Vector3(60, 0, -296),
      ],
      waypoints: [
        new THREE.Vector3(-232, 0, 228), new THREE.Vector3(0, 0, 224), new THREE.Vector3(232, 0, 228),
        new THREE.Vector3(-168, towerY, 0), new THREE.Vector3(-84, 0, 0), new THREE.Vector3(84, 0, 0),
        new THREE.Vector3(168, towerY, 0), new THREE.Vector3(0, 0, 96), new THREE.Vector3(0, 0, -96),
        new THREE.Vector3(-232, 0, -228), new THREE.Vector3(0, 0, -224), new THREE.Vector3(232, 0, -228),
      ],
      pickups,
      beltPickups,
      mountedMgs,
      vehicles,
      halfSize,
      disposables: { geometries, materials, textures },
    };
  }

  // =========================================================================
  // MAP 4: PACIFIC ATOLL ISLAND (Colossal 2160x2160m · 4x Area · Combined Arms Theater)
  // =========================================================================
  if (mapId === 'island') {
    const halfSize = 1080;
    const zones: ArenaZoneInfo[] = [
      { id: 'A', name: 'North Naval Airfield', centerX: 0, centerZ: -650, radius: 270, accentHex: '#EF4444' },
      { id: 'B', name: 'Central Volcano Ridge', centerX: 0, centerZ: 0, radius: 290, accentHex: '#F59E0B' },
      { id: 'C', name: 'South Harbor Beachhead', centerX: 0, centerZ: 650, radius: 270, accentHex: '#3B82F6' },
    ];
    const atmosphere: ArenaAtmosphere = {
      bgColor: 0x6ba7d6,
      fogColor: 0x8cc2e8,
      fogDensity: 0.00042,
      sunColor: 0xfff5de,
      sunIntensity: 2.7,
      sunPos: [260, 240, -140],
      hemiSky: 0xbae6fd,
      hemiGround: 0x3f5e36,
      hemiIntensity: 1.15,
    };

    rootGroup.add(
      buildSkyDome(0x0284c7, 0x38bdf8, 0xbae6fd, atmosphere.sunPos, [1.0, 0.9, 0.65], 0.44, geometries, materials)
    );

    const islandTurf = createIslandFloorTextures(maxAnisotropy);
    islandTurf.map.repeat.set(180, 180);
    islandTurf.bumpMap.repeat.set(180, 180);
    islandTurf.roughnessMap.repeat.set(180, 180);
    const oceanTex = createOceanTextures(maxAnisotropy);
    const concrete = createConcreteWallTextures(maxAnisotropy);
    const oliveContainer = createContainerTextures('#47573e', '#f59e0b', maxAnisotropy);
    const rustContainer = createContainerTextures('#7c3d32', '#e2e8f0', maxAnisotropy);
    textures.push(
      islandTurf.map, islandTurf.bumpMap, islandTurf.roughnessMap,
      oceanTex.map, oceanTex.bumpMap,
      concrete.map, concrete.bumpMap,
      oliveContainer.map, oliveContainer.bumpMap,
      rustContainer.map, rustContainer.bumpMap
    );

    const oceanMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: oceanTex.map, bumpMap: oceanTex.bumpMap, bumpScale: 0.08,
        roughness: 0.22, metalness: 0.35,
      })
    );
    const shallowSurfMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x2dd4bf, roughness: 0.28, metalness: 0.15, transparent: true, opacity: 0.85 })
    );
    const beachSandMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0xdcc38e, roughness: 0.94, metalness: 0.02 })
    );
    const turfMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: islandTurf.map, bumpMap: islandTurf.bumpMap, bumpScale: 0.07,
        roughnessMap: islandTurf.roughnessMap, roughness: 0.92, metalness: 0.03,
      })
    );
    const roadTex = createRoadAsphaltTextures(maxAnisotropy);
    textures.push(roadTex.map, roadTex.bumpMap);
    const roadMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: roadTex.map,
        bumpMap: roadTex.bumpMap,
        bumpScale: 0.035,
        roughness: 0.84,
        metalness: 0.08,
      })
    );
    const bunkerConcreteMat = trackMat(
      new THREE.MeshStandardMaterial({ map: concrete.map, bumpMap: concrete.bumpMap, bumpScale: 0.04, roughness: 0.8, metalness: 0.1 })
    );
    const volcanicRockMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x4b4e54, roughness: 0.92, metalness: 0.06 })
    );
    const cargoMatA = trackMat(
      new THREE.MeshStandardMaterial({ map: oliveContainer.map, bumpMap: oliveContainer.bumpMap, bumpScale: 0.05, roughness: 0.56, metalness: 0.45 })
    );
    const cargoMatB = trackMat(
      new THREE.MeshStandardMaterial({ map: rustContainer.map, bumpMap: rustContainer.bumpMap, bumpScale: 0.05, roughness: 0.58, metalness: 0.45 })
    );
    const palmTrunkMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x6e4f34, roughness: 0.92, metalness: 0.02 })
    );
    const palmLeafMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x2f6b2f, roughness: 0.72, metalness: 0.04, side: THREE.DoubleSide })
    );

    // Endless surrounding Pacific Ocean
    const oceanMesh = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(6400, 6400)), oceanMat);
    oceanMesh.rotation.x = -Math.PI / 2;
    oceanMesh.position.y = -1.35;
    oceanMesh.receiveShadow = true;
    rootGroup.add(oceanMesh);

    // Turquoise shallow coastal shelf around the atoll
    const surfMesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2120, 0.25, 2120)), shallowSurfMat);
    surfMesh.position.set(0, -0.78, 0);
    surfMesh.receiveShadow = true;
    rootGroup.add(surfMesh);

    // Golden Sand Beach Base (2040x2040m playable shore apron)
    const beachFloor = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(2040, 2040)), beachSandMat);
    beachFloor.rotation.x = -Math.PI / 2;
    beachFloor.position.y = -0.14;
    beachFloor.receiveShadow = true;
    rootGroup.add(beachFloor);
    staticRayMeshes.push(beachFloor);

    // Main Lush Tropical Island Landmass (1840x1840m)
    const mainIsland = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(1840, 1840)), turfMat);
    mainIsland.rotation.x = -Math.PI / 2;
    mainIsland.position.y = 0;
    mainIsland.receiveShadow = true;
    rootGroup.add(mainIsland);
    staticRayMeshes.push(mainIsland);

    // Central North-South Asphalt Highway & East-West Coastal Causeway
    const nsHighway = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(32, 1920)), roadMat);
    nsHighway.rotation.x = -Math.PI / 2;
    nsHighway.position.y = 0.02;
    nsHighway.receiveShadow = true;
    rootGroup.add(nsHighway);

    const ewRoad = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(28, 1800)), roadMat);
    ewRoad.rotation.x = -Math.PI / 2;
    ewRoad.rotation.z = Math.PI / 2;
    ewRoad.position.y = 0.02;
    ewRoad.receiveShadow = true;
    rootGroup.add(ewRoad);

    // Airfield Runway in Zone A
    const runway = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(48, 460)), roadMat);
    runway.rotation.x = -Math.PI / 2;
    runway.rotation.z = Math.PI / 2;
    runway.position.set(0, 0.025, -620);
    runway.receiveShadow = true;
    rootGroup.add(runway);

    // Helipads for Blue & Red Gunships
    addHelipad('island-helipad-blue', 'blue', -188, 0, 816);
    addHelipad('island-helipad-red', 'red', 188, 0, -816);

    // Coastal Volcanic Boulder Clusters
    const boulderGeo = trackGeo(new THREE.DodecahedronGeometry(2.8, 0));
    for (const [rx, rz, rs] of [
      [-860, -830, 1.8], [860, -830, 2.0], [-860, 830, 1.9], [860, 830, 1.7],
      [-570, -910, 2.1], [570, -910, 1.8], [-570, 910, 2.0], [570, 910, 1.9],
      [-910, -360, 2.2], [910, -360, 1.9], [-910, 360, 2.0], [910, 360, 2.1],
      [-184, -176, 1.3], [184, 176, 1.4], [-192, 168, 1.2], [192, -168, 1.3],
    ]) {
      const rock = new THREE.Mesh(boulderGeo, volcanicRockMat);
      rock.position.set(rx, rs * 1.15, rz);
      rock.scale.set(rs * 1.35, rs * 0.85, rs * 1.15);
      rock.rotation.set(rx * 0.1, rz * 0.2, 0.2);
      rock.castShadow = true;
      rock.receiveShadow = true;
      rootGroup.add(rock);
      staticRayMeshes.push(rock);
      colliders.push({
        minX: rx - rs * 2.5, maxX: rx + rs * 2.5,
        minY: 0, maxY: rs * 2.4,
        minZ: rz - rs * 2.2, maxZ: rz + rs * 2.2,
      });
    }

    // Seawall perimeter reefs around combat boundary (±1080m)
    const reefH = 3.8;
    const reefT = 4.2;
    addBox(0, reefH / 2 - 0.3, -halfSize - reefT / 2, halfSize * 2 + reefT * 2, reefH, reefT, volcanicRockMat);
    addBox(0, reefH / 2 - 0.3, halfSize + reefT / 2, halfSize * 2 + reefT * 2, reefH, reefT, volcanicRockMat);
    addBox(-halfSize - reefT / 2, reefH / 2 - 0.3, 0, reefT, reefH, halfSize * 2, volcanicRockMat);
    addBox(halfSize + reefT / 2, reefH / 2 - 0.3, 0, reefT, reefH, halfSize * 2, volcanicRockMat);

    // Distant volcanic islets beyond shoreline
    for (const [ix, iz, iw, ih] of [
      [-1480, -1240, 240, 110], [1440, -1180, 280, 130],
      [-1420, 1280, 230, 92], [1500, 1240, 260, 118],
    ]) {
      const islet = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(iw * 0.32, iw * 0.65, ih, 8)), volcanicRockMat);
      islet.position.set(ix, ih * 0.42 - 2, iz);
      rootGroup.add(islet);
    }

    // ZONE B: Central Volcano Fortress Plateau (y = 4.2m) with 4 vehicle-drivable ramps
    const ridgeY = 4.2;
    addBox(0, ridgeY / 2, 0, 116, ridgeY, 116, bunkerConcreteMat, true);
    buildRamp(-86, -58, 0, 14, 0, ridgeY, roadMat);
    buildRamp(86, 58, 0, 14, 0, ridgeY, roadMat);
    buildZRamp(0, 14, -86, -58, 0, ridgeY, roadMat);
    buildZRamp(0, 14, 86, 58, 0, ridgeY, roadMat);

    // Radar Tower + Bunker Pillars atop Central Volcano Plateau
    addBox(0, ridgeY + 2.4, 0, 12, 4.8, 12, bunkerConcreteMat, true);
    addBox(0, ridgeY + 5.1, 0, 12.4, 0.25, 12.4, amberMat, false, false);
    const mast = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.45, 0.75, 18, 10)), darkMetalMat);
    mast.position.set(0, ridgeY + 13.5, 0);
    rootGroup.add(mast);
    for (const [bx, bz] of [[-38, -38], [38, -38], [-38, 38], [38, 38]]) {
      addBox(bx, ridgeY + 1.4, bz, 9, 2.8, 3.4, volcanicRockMat);
    }

    // Coastal Concrete Bunkers, Airfield Hangars & Dock Warehouses across Zones A, B, C
    for (const [cx, cz, cw, ch, cd, m] of [
      [-250, -620, 22, 4.4, 9, cargoMatA], [250, -620, 22, 4.4, 9, cargoMatB],
      [-480, -380, 18, 4.2, 14, bunkerConcreteMat], [480, -380, 18, 4.2, 14, bunkerConcreteMat],
      [-480, 380, 18, 4.2, 14, bunkerConcreteMat], [480, 380, 18, 4.2, 14, bunkerConcreteMat],
      [-250, 620, 22, 4.4, 9, cargoMatB], [250, 620, 22, 4.4, 9, cargoMatA],
      [-370, 0, 14, 4.0, 26, volcanicRockMat], [370, 0, 14, 4.0, 26, volcanicRockMat],
      [-620, 0, 18, 4.6, 22, cargoMatA], [620, 0, 18, 4.6, 22, cargoMatB],
      [-155, -420, 16, 3.8, 8, bunkerConcreteMat], [155, -420, 16, 3.8, 8, bunkerConcreteMat],
      [-155, 420, 16, 3.8, 8, bunkerConcreteMat], [155, 420, 16, 3.8, 8, bunkerConcreteMat],
    ] as Array<[number, number, number, number, number, THREE.Material]>) {
      addBox(cx, ch / 2, cz, cw, ch, cd, m);
    }

    // Harbor Piers extending onto North & South beachheads
    addBox(0, 1.5, 780, 26, 3.0, 3.4, bunkerConcreteMat);
    addBox(0, 3.08, 780, 26.2, 0.16, 3.45, accentBlueMat, false, false);
    addBox(0, 1.5, -780, 26, 3.0, 3.4, bunkerConcreteMat);
    addBox(0, 3.08, -780, 26.2, 0.16, 3.45, accentRedMat, false, false);

    // Tropical Palm Trees across beaches and jungle flanks
    const palmCoords: Array<[number, number]> = [
      [-290, -290], [-420, -180], [-580, -280], [-720, -480], [-780, -160], [-790, 190],
      [290, -290], [420, -180], [580, -280], [720, -480], [780, -160], [790, 190],
      [-290, 290], [-420, 180], [-580, 280], [-720, 480], [-520, 680], [-320, 820],
      [290, 290], [420, 180], [580, 280], [720, 480], [520, 680], [320, 820],
      [-520, -680], [-320, -820], [520, -680], [320, -820],
      [-184, -390], [184, -390], [-184, 390], [184, 390],
      [-310, -52], [310, -52], [-310, 52], [310, 52],
      [-860, -640], [860, -640], [-860, 640], [860, 640],
    ];
    const trunkGeo = trackGeo(new THREE.CylinderGeometry(0.28, 0.52, 8.4, 7));
    const frondBladeGeo = trackGeo(new THREE.BoxGeometry(0.85, 0.08, 4.4));
    for (const [px, pz] of palmCoords) {
      const trunk = new THREE.Mesh(trunkGeo, palmTrunkMat);
      trunk.position.set(px, 4.1, pz);
      trunk.rotation.z = ((px % 7) - 3) * 0.015;
      trunk.castShadow = true;
      rootGroup.add(trunk);
      staticRayMeshes.push(trunk);

      const crown = new THREE.Group();
      crown.position.set(px, 8.25, pz);
      for (let f = 0; f < 6; f++) {
        const frondPivot = new THREE.Group();
        frondPivot.rotation.y = (f / 6) * Math.PI * 2 + (px * 0.07);
        const blade = new THREE.Mesh(frondBladeGeo, palmLeafMat);
        blade.position.set(0, 0.15, -2.05);
        blade.rotation.x = -0.34;
        blade.castShadow = true;
        frondPivot.add(blade);
        crown.add(frondPivot);
      }
      rootGroup.add(crown);

      colliders.push({
        minX: px - 0.5,
        maxX: px + 0.5,
        minY: 0,
        maxY: 8.2,
        minZ: pz - 0.5,
        maxZ: pz + 0.5,
      });
    }

    for (const [jx, jz, jr] of [
      [-32, 350, 0.15], [32, 350, -0.15], [-32, -350, -0.15], [32, -350, 0.15],
      [-152, 620, Math.PI / 2], [152, -620, Math.PI / 2],
    ]) {
      addJerseyBarrier(jx, jz, jr);
    }
    for (const [px, pz] of [[-92, 660], [92, -660], [-148, 0], [148, 0]]) {
      addSupplyPallet(px, 0, pz);
    }

    // 16 Destructible Compound & Roadblock Walls
    addDestructibleWall('island-dw-1', 0, 0, -290, 24, 3.6, 1.5, 145, bunkerConcreteMat, 'concrete');
    addDestructibleWall('island-dw-2', 0, 0, 290, 24, 3.6, 1.5, 145, bunkerConcreteMat, 'concrete');
    addDestructibleWall('island-dw-3', -230, 0, -290, 20, 3.6, 1.5, 140, bunkerConcreteMat, 'concrete');
    addDestructibleWall('island-dw-4', 230, 0, -290, 20, 3.6, 1.5, 140, bunkerConcreteMat, 'concrete');
    addDestructibleWall('island-dw-5', -230, 0, 290, 20, 3.6, 1.5, 140, bunkerConcreteMat, 'concrete');
    addDestructibleWall('island-dw-6', 230, 0, 290, 20, 3.6, 1.5, 140, bunkerConcreteMat, 'concrete');
    addDestructibleWall('island-dw-7', -240, 0, 0, 1.6, 3.8, 22, 150, bunkerConcreteMat, 'concrete');
    addDestructibleWall('island-dw-8', 240, 0, 0, 1.6, 3.8, 22, 150, bunkerConcreteMat, 'concrete');
    addDestructibleWall('island-dw-9', -110, 0, -510, 20, 3.6, 1.4, 145, bunkerConcreteMat, 'concrete');
    addDestructibleWall('island-dw-10', 110, 0, -510, 20, 3.6, 1.4, 145, bunkerConcreteMat, 'concrete');
    addDestructibleWall('island-dw-11', -110, 0, 510, 20, 3.6, 1.4, 145, bunkerConcreteMat, 'concrete');
    addDestructibleWall('island-dw-12', 110, 0, 510, 20, 3.6, 1.4, 145, bunkerConcreteMat, 'concrete');
    addDestructibleWall('island-dw-13', -470, 0, -180, 20, 3.5, 1.5, 135, bunkerConcreteMat, 'concrete');
    addDestructibleWall('island-dw-14', 470, 0, -180, 20, 3.5, 1.5, 135, bunkerConcreteMat, 'concrete');
    addDestructibleWall('island-dw-15', -470, 0, 180, 20, 3.5, 1.5, 135, bunkerConcreteMat, 'concrete');
    addDestructibleWall('island-dw-16', 470, 0, 180, 20, 3.5, 1.5, 135, bunkerConcreteMat, 'concrete');

    const islandBarrels: Array<[number, number]> = [
      [-18, -284], [18, -284], [-18, 284], [18, 284],
      [-218, -284], [218, -284], [-218, 284], [218, 284],
      [-232, -14], [232, 14], [-96, -504], [96, -504],
      [-96, 504], [96, 504], [-234, -612], [234, -612],
      [-234, 612], [234, 612], [-456, -172], [456, -172],
      [-456, 172], [456, 172], [-358, 18], [358, -18],
    ];
    islandBarrels.forEach(([bx, bz], idx) => addExplosiveBarrel(`island-barrel-${idx}`, bx, 0, bz));

    const arsenals: ArsenalNode[] = [
      addArsenalStructure('island-arsenal-blue', 'blue', -84, 0, 836, 0),
      addArsenalStructure('island-arsenal-red', 'red', 84, 0, -836, Math.PI),
    ];

    const hangars: HangarNode[] = [
      addMiniHangar('island-hangar-blue', 'blue', 124, 0, 828, 0),
      addMiniHangar('island-hangar-red', 'red', -124, 0, -828, Math.PI),
    ];

    // 14 Mounted Emplacements across the 2160m island
    const mountedMgs: MountedMgNode[] = [
      addMountedEmplacement('island-mg30-ridge-s', 'mg30', -24, ridgeY, 48, 0, true),
      addMountedEmplacement('island-mg30-ridge-n', 'mg30', 24, ridgeY, -48, Math.PI, true),
      addMountedEmplacement('island-mg30-beach-w', 'mg30', -176, 0, 430, 0, true),
      addMountedEmplacement('island-mg30-beach-e', 'mg30', 176, 0, -430, Math.PI, true),
      addMountedEmplacement('island-mg30-flank-w', 'mg30', -416, 0, 0, -Math.PI / 2, true),
      addMountedEmplacement('island-mg30-flank-e', 'mg30', 416, 0, 0, Math.PI / 2, true),
      addMountedEmplacement('island-auto-ridge-w', 'autocannon', -48, ridgeY, 0, -Math.PI / 2, false),
      addMountedEmplacement('island-auto-ridge-e', 'autocannon', 48, ridgeY, 0, Math.PI / 2, false),
      addMountedEmplacement('island-fg-south', 'field_gun', -136, 0, 570, 0.1, true),
      addMountedEmplacement('island-fg-north', 'field_gun', 136, 0, -570, Math.PI + 0.1, true),
      addMountedEmplacement('island-tow-w', 'tow', -284, 0, -136, -Math.PI / 3, true),
      addMountedEmplacement('island-tow-e', 'tow', 284, 0, 136, Math.PI * 0.66, true),
      addMountedEmplacement('island-hmg-south', 'hmg', 0, 0, 390, 0, true),
      addMountedEmplacement('island-hmg-north', 'hmg', 0, 0, -390, Math.PI, true),
    ];

    // 14 Tactical Vehicles (6 ground + 1 Apache Gunship per faction)
    const vehicles: VehicleNode[] = [
      addTacticalVehicle('island-blue-apc-1', 'apc', -36, 0, 824, 0, 'blue'),
      addTacticalVehicle('island-blue-apc-2', 'apc', 176, 0, 810, 0, 'blue'),
      addTacticalVehicle('island-blue-buggy', 'buggy', -136, 0, 810, 0, 'blue'),
      addTacticalVehicle('island-blue-jeep', 'jeep', 36, 0, 824, 0, 'blue'),
      addTacticalVehicle('island-blue-tank', 'tank', -296, 0, 800, 0, 'blue'),
      addTacticalVehicle('island-blue-mbt', 'heavy_tank', 296, 0, 800, 0, 'blue'),
      addTacticalVehicle('island-blue-heli', 'attack_heli', -188, 0.25, 816, 0, 'blue'),
      addTacticalVehicle('island-red-apc-1', 'apc', 36, 0, -824, Math.PI, 'red'),
      addTacticalVehicle('island-red-apc-2', 'apc', -176, 0, -810, Math.PI, 'red'),
      addTacticalVehicle('island-red-buggy', 'buggy', 136, 0, -810, Math.PI, 'red'),
      addTacticalVehicle('island-red-jeep', 'jeep', -36, 0, -824, Math.PI, 'red'),
      addTacticalVehicle('island-red-tank', 'tank', 296, 0, -800, Math.PI, 'red'),
      addTacticalVehicle('island-red-mbt', 'heavy_tank', -296, 0, -800, Math.PI, 'red'),
      addTacticalVehicle('island-red-heli', 'attack_heli', 188, 0.25, -816, Math.PI, 'red'),
    ];

    const pickups = spawnPickups([
      { id: 'med-ridge-w', type: 'health', x: -32, y: ridgeY, z: 0 },
      { id: 'med-ridge-e', type: 'health', x: 32, y: ridgeY, z: 0 },
      { id: 'med-a', type: 'health', x: -172, y: 0, z: -620 },
      { id: 'med-c', type: 'health', x: 172, y: 0, z: 620 },
      { id: 'med-flank-w', type: 'health', x: -480, y: 0, z: 0 },
      { id: 'med-flank-e', type: 'health', x: 480, y: 0, z: 0 },
      { id: 'ammo-ridge-n', type: 'ammo', x: 0, y: ridgeY, z: -28 },
      { id: 'ammo-ridge-s', type: 'ammo', x: 0, y: ridgeY, z: 28 },
      { id: 'ammo-a', type: 'ammo', x: 172, y: 0, z: -620 },
      { id: 'ammo-c', type: 'ammo', x: -172, y: 0, z: 620 },
    ]);

    return {
      mapId,
      rootGroup,
      atmosphere,
      colliders,
      ramps,
      staticRayMeshes,
      destructibleWalls,
      barrels,
      zones,
      arsenals,
      hangars,
      blueSpawns: [
        new THREE.Vector3(-42, 0, 896), new THREE.Vector3(-16, 0, 904), new THREE.Vector3(16, 0, 904),
        new THREE.Vector3(42, 0, 896), new THREE.Vector3(-168, 0, 880), new THREE.Vector3(168, 0, 880),
        new THREE.Vector3(-330, 0, 856), new THREE.Vector3(330, 0, 856), new THREE.Vector3(-84, 0, 792),
        new THREE.Vector3(84, 0, 792),
      ],
      redSpawns: [
        new THREE.Vector3(-42, 0, -896), new THREE.Vector3(-16, 0, -904), new THREE.Vector3(16, 0, -904),
        new THREE.Vector3(42, 0, -896), new THREE.Vector3(-168, 0, -880), new THREE.Vector3(168, 0, -880),
        new THREE.Vector3(-330, 0, -856), new THREE.Vector3(330, 0, -856), new THREE.Vector3(-84, 0, -792),
        new THREE.Vector3(84, 0, -792),
      ],
      waypoints: [
        new THREE.Vector3(-390, 0, 620), new THREE.Vector3(0, 0, 620), new THREE.Vector3(390, 0, 620),
        new THREE.Vector3(-270, 0, 350), new THREE.Vector3(0, 0, 350), new THREE.Vector3(270, 0, 350),
        new THREE.Vector3(-480, 0, 0), new THREE.Vector3(-176, 0, 0), new THREE.Vector3(0, ridgeY, 26),
        new THREE.Vector3(0, ridgeY, -26), new THREE.Vector3(176, 0, 0), new THREE.Vector3(480, 0, 0),
        new THREE.Vector3(-270, 0, -350), new THREE.Vector3(0, 0, -350), new THREE.Vector3(270, 0, -350),
        new THREE.Vector3(-390, 0, -620), new THREE.Vector3(0, 0, -620), new THREE.Vector3(390, 0, -620),
      ],
      pickups,
      beltPickups,
      mountedMgs,
      vehicles,
      halfSize,
      oceanTextures: oceanTex,
      disposables: { geometries, materials, textures },
    };
  }

  // =========================================================================
  // MAP 5: CARGO KILLHOUSE (136x136m · Compact 5v5 Infantry Only · Zero Vehicles/Mounts)
  // =========================================================================
  if (mapId === 'killhouse') {
    const halfSize = 68;
    const zones: ArenaZoneInfo[] = [
      { id: 'A', name: 'North Breach Yard', centerX: 0, centerZ: -40, radius: 28, accentHex: '#EF4444' },
      { id: 'B', name: 'Central Container Gauntlet', centerX: 0, centerZ: 0, radius: 26, accentHex: '#F59E0B' },
      { id: 'C', name: 'South Staging Lane', centerX: 0, centerZ: 40, radius: 28, accentHex: '#3B82F6' },
    ];
    const atmosphere: ArenaAtmosphere = {
      bgColor: 0x161d29,
      fogColor: 0x141b26,
      fogDensity: 0.0022,
      sunColor: 0xe2e8f0,
      sunIntensity: 2.25,
      sunPos: [72, 92, 54],
      hemiSky: 0x7dd3fc,
      hemiGround: 0x1e293b,
      hemiIntensity: 1.05,
    };

    rootGroup.add(
      buildSkyDome(0x090f1a, 0x162235, 0x28364a, atmosphere.sunPos, [0.9, 0.94, 1.0], 0.35, geometries, materials)
    );

    const floorTexSet = createArenaFloorTextures(maxAnisotropy);
    floorTexSet.map.repeat.set(32, 32);
    floorTexSet.bumpMap.repeat.set(32, 32);
    floorTexSet.roughnessMap.repeat.set(32, 32);
    const concreteTexSet = createConcreteWallTextures(maxAnisotropy);
    const blueContainerTex = createContainerTextures('#1e3a5f', '#3b82f6', maxAnisotropy);
    const redContainerTex = createContainerTextures('#5c1f24', '#ef4444', maxAnisotropy);
    const slateContainerTex = createContainerTextures('#334155', '#f59e0b', maxAnisotropy);
    const deckTexSet = createSteelDeckTextures(maxAnisotropy);

    textures.push(
      floorTexSet.map, floorTexSet.bumpMap, floorTexSet.roughnessMap,
      concreteTexSet.map, concreteTexSet.bumpMap,
      blueContainerTex.map, blueContainerTex.bumpMap,
      redContainerTex.map, redContainerTex.bumpMap,
      slateContainerTex.map, slateContainerTex.bumpMap,
      deckTexSet.map, deckTexSet.bumpMap
    );

    const floorMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: floorTexSet.map, bumpMap: floorTexSet.bumpMap, bumpScale: 0.04,
        roughnessMap: floorTexSet.roughnessMap, roughness: 0.88, metalness: 0.14,
      })
    );
    const concreteMat = trackMat(
      new THREE.MeshStandardMaterial({ map: concreteTexSet.map, bumpMap: concreteTexSet.bumpMap, bumpScale: 0.05, roughness: 0.82, metalness: 0.08 })
    );
    const deckMat = trackMat(
      new THREE.MeshStandardMaterial({ map: deckTexSet.map, bumpMap: deckTexSet.bumpMap, bumpScale: 0.04, roughness: 0.38, metalness: 0.74 })
    );
    const blueContainerMat = trackMat(
      new THREE.MeshStandardMaterial({ map: blueContainerTex.map, bumpMap: blueContainerTex.bumpMap, bumpScale: 0.06, roughness: 0.48, metalness: 0.6 })
    );
    const redContainerMat = trackMat(
      new THREE.MeshStandardMaterial({ map: redContainerTex.map, bumpMap: redContainerTex.bumpMap, bumpScale: 0.06, roughness: 0.48, metalness: 0.6 })
    );
    const slateContainerMat = trackMat(
      new THREE.MeshStandardMaterial({ map: slateContainerTex.map, bumpMap: slateContainerTex.bumpMap, bumpScale: 0.06, roughness: 0.48, metalness: 0.6 })
    );
    const timberWallMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x7a5c3c, roughness: 0.86, metalness: 0.06 })
    );

    const floor = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(halfSize * 2, halfSize * 2)), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    rootGroup.add(floor);
    staticRayMeshes.push(floor);

    // Outer Killhouse Perimeter Walls
    const wallH = 7.5;
    const wallT = 2.6;
    addBox(0, wallH / 2, -halfSize - wallT / 2, halfSize * 2 + wallT * 2, wallH, wallT, concreteMat);
    addBox(0, wallH / 2, halfSize + wallT / 2, halfSize * 2 + wallT * 2, wallH, wallT, concreteMat);
    addBox(-halfSize - wallT / 2, wallH / 2, 0, wallT, wallH, halfSize * 2, concreteMat);
    addBox(halfSize + wallT / 2, wallH / 2, 0, wallT, wallH, halfSize * 2, concreteMat);

    // Stadium Floodlight Towers on 4 Corners
    for (const [fx, fz] of [[-58, -58], [58, -58], [-58, 58], [58, 58]]) {
      addBox(fx, 7.0, fz, 1.1, 14.0, 1.1, darkMetalMat);
      const lamp = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.8, 0.9, 1.4)), amberMat);
      lamp.position.set(fx, 14.2, fz);
      rootGroup.add(lamp);
    }

    // Center Elevated Container Catwalk Bridge (Zone B, y = 2.6m) with West & East Ramps
    const catY = 2.6;
    addBox(0, catY / 2, 0, 18, catY, 12, deckMat, true);
    buildRamp(-18, -9, 0, 5.2, 0, catY, deckMat);
    buildRamp(18, 9, 0, 5.2, 0, catY, deckMat);
    addBox(-4.5, catY + 0.55, -5.6, 7.2, 1.1, 0.5, darkMetalMat);
    addBox(4.5, catY + 0.55, 5.6, 7.2, 1.1, 0.5, darkMetalMat);

    // Symmetrical CQB Container Lanes & Shoot-House Partitions
    for (const [cx, cz, cw, ch, cd, m] of [
      [-16, -24, 3.0, 3.2, 11.0, redContainerMat],
      [16, -24, 3.0, 3.2, 11.0, slateContainerMat],
      [-16, 24, 3.0, 3.2, 11.0, slateContainerMat],
      [16, 24, 3.0, 3.2, 11.0, blueContainerMat],
      [-34, -10, 10.5, 3.2, 3.0, redContainerMat],
      [34, -10, 10.5, 3.2, 3.0, slateContainerMat],
      [-34, 10, 10.5, 3.2, 3.0, slateContainerMat],
      [34, 10, 10.5, 3.2, 3.0, blueContainerMat],
      [0, -40, 14.0, 3.0, 2.2, concreteMat],
      [0, 40, 14.0, 3.0, 2.2, concreteMat],
    ] as Array<[number, number, number, number, number, THREE.Material]>) {
      addBox(cx, ch / 2, cz, cw, ch, cd, m);
    }

    // Wing CQB Shoothouse Rooms
    for (const side of [-1, 1]) {
      const wx = side * 46;
      addBox(wx, 1.7, -28, 12, 3.4, 1.1, timberWallMat);
      addBox(wx, 1.7, 28, 12, 3.4, 1.1, timberWallMat);
      addBox(wx - side * 7, 1.7, 0, 1.1, 3.4, 24, timberWallMat);
    }

    // 8 Breachable Shoothouse Walls
    addDestructibleWall('kh-dw-1', -26, 0, 0, 1.0, 2.8, 10.0, 95, timberWallMat, 'concrete');
    addDestructibleWall('kh-dw-2', 26, 0, 0, 1.0, 2.8, 10.0, 95, timberWallMat, 'concrete');
    addDestructibleWall('kh-dw-3', -12, 0, -14, 9.0, 2.7, 1.0, 90, concreteMat, 'concrete');
    addDestructibleWall('kh-dw-4', 12, 0, -14, 9.0, 2.7, 1.0, 90, concreteMat, 'concrete');
    addDestructibleWall('kh-dw-5', -12, 0, 14, 9.0, 2.7, 1.0, 90, concreteMat, 'concrete');
    addDestructibleWall('kh-dw-6', 12, 0, 14, 9.0, 2.7, 1.0, 90, concreteMat, 'concrete');
    addDestructibleWall('kh-dw-7', -38, 0, -34, 1.0, 2.8, 9.0, 90, timberWallMat, 'concrete');
    addDestructibleWall('kh-dw-8', 38, 0, 34, 1.0, 2.8, 9.0, 90, timberWallMat, 'concrete');

    for (const [jx, jz, jr] of [
      [-8, 30, 0.2], [8, 30, -0.2], [-8, -30, -0.2], [8, -30, 0.2],
      [-28, -22, 0.6], [28, 22, 0.6],
    ]) {
      addJerseyBarrier(jx, jz, jr);
    }

    for (const [px, pz] of [[-24, 38], [24, 38], [-24, -38], [24, -38], [0, -24], [0, 24]]) {
      addSupplyPallet(px, 0, pz);
    }

    const barrelsList: Array<[number, number]> = [
      [-10, -20], [10, -20], [-10, 20], [10, 20],
      [-30, -6], [30, 6], [-42, 0], [42, 0],
    ];
    barrelsList.forEach(([bx, bz], idx) => addExplosiveBarrel(`kh-barrel-${idx}`, bx, 0, bz));

    const arsenals: ArsenalNode[] = [
      addArsenalStructure('kh-arsenal-blue', 'blue', -18, 0, 52, 0),
      addArsenalStructure('kh-arsenal-red', 'red', 18, 0, -52, Math.PI),
    ];

    const pickups = spawnPickups([
      { id: 'kh-med-w', type: 'health', x: -30, y: 0, z: 0 },
      { id: 'kh-med-e', type: 'health', x: 30, y: 0, z: 0 },
      { id: 'kh-ammo-mid', type: 'ammo', x: 0, y: catY, z: 0 },
      { id: 'kh-ammo-a', type: 'ammo', x: 0, y: 0, z: -32 },
      { id: 'kh-ammo-c', type: 'ammo', x: 0, y: 0, z: 32 },
    ]);

    return {
      mapId,
      rootGroup,
      atmosphere,
      colliders,
      ramps,
      staticRayMeshes,
      destructibleWalls,
      barrels,
      zones,
      arsenals,
      hangars: [],
      blueSpawns: [
        new THREE.Vector3(-12, 0, 58), new THREE.Vector3(-4, 0, 58), new THREE.Vector3(4, 0, 58),
        new THREE.Vector3(12, 0, 58), new THREE.Vector3(24, 0, 56), new THREE.Vector3(-32, 0, 54),
        new THREE.Vector3(36, 0, 54), new THREE.Vector3(-48, 0, 50), new THREE.Vector3(48, 0, 50),
        new THREE.Vector3(0, 0, 52),
      ],
      redSpawns: [
        new THREE.Vector3(-12, 0, -58), new THREE.Vector3(-4, 0, -58), new THREE.Vector3(4, 0, -58),
        new THREE.Vector3(12, 0, -58), new THREE.Vector3(-24, 0, -56), new THREE.Vector3(32, 0, -54),
        new THREE.Vector3(-36, 0, -54), new THREE.Vector3(48, 0, -50), new THREE.Vector3(-48, 0, -50),
        new THREE.Vector3(0, 0, -52),
      ],
      waypoints: [
        new THREE.Vector3(-36, 0, 34), new THREE.Vector3(0, 0, 32), new THREE.Vector3(36, 0, 34),
        new THREE.Vector3(-48, 0, 12), new THREE.Vector3(-22, 0, 8), new THREE.Vector3(22, 0, 8),
        new THREE.Vector3(48, 0, 12), new THREE.Vector3(0, catY, 0), new THREE.Vector3(-30, 0, 0),
        new THREE.Vector3(30, 0, 0), new THREE.Vector3(-48, 0, -12), new THREE.Vector3(-22, 0, -8),
        new THREE.Vector3(22, 0, -8), new THREE.Vector3(48, 0, -12), new THREE.Vector3(0, 0, -32),
      ],
      pickups,
      beltPickups: [],
      mountedMgs: [],
      vehicles: [],
      halfSize,
      infantryOnly: true,
      disposables: { geometries, materials, textures },
    };
  }

  // =========================================================================
  // MAP 6: SUBWAY CONCOURSE (148x148m · Compact 5v5 Infantry Only · Zero Vehicles/Mounts)
  // =========================================================================
  if (mapId === 'metro') {
    const halfSize = 74;
    const zones: ArenaZoneInfo[] = [
      { id: 'A', name: 'North Ticket Hall', centerX: 0, centerZ: -44, radius: 30, accentHex: '#EF4444' },
      { id: 'B', name: 'Central Track Platforms', centerX: 0, centerZ: 0, radius: 30, accentHex: '#F59E0B' },
      { id: 'C', name: 'South Escalator Lobby', centerX: 0, centerZ: 44, radius: 30, accentHex: '#3B82F6' },
    ];
    const atmosphere: ArenaAtmosphere = {
      bgColor: 0x0b1018,
      fogColor: 0x0d1420,
      fogDensity: 0.0026,
      sunColor: 0xcbd5e1,
      sunIntensity: 1.9,
      sunPos: [30, 84, 24],
      hemiSky: 0x60a5fa,
      hemiGround: 0x111827,
      hemiIntensity: 1.1,
    };

    const floorTexSet = createBunkerFloorTextures(maxAnisotropy);
    floorTexSet.map.repeat.set(34, 34);
    floorTexSet.bumpMap.repeat.set(34, 34);
    const concreteTexSet = createConcreteWallTextures(maxAnisotropy);
    const deckTexSet = createSteelDeckTextures(maxAnisotropy);
    textures.push(
      floorTexSet.map, floorTexSet.bumpMap,
      concreteTexSet.map, concreteTexSet.bumpMap,
      deckTexSet.map, deckTexSet.bumpMap
    );

    const floorMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: floorTexSet.map, bumpMap: floorTexSet.bumpMap, bumpScale: 0.04, roughness: 0.55, metalness: 0.25,
      })
    );
    const wallMat = trackMat(
      new THREE.MeshStandardMaterial({ map: concreteTexSet.map, bumpMap: concreteTexSet.bumpMap, bumpScale: 0.05, roughness: 0.78, metalness: 0.14 })
    );
    const pillarMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x263244, roughness: 0.52, metalness: 0.55 })
    );
    const trainBlueMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.36, metalness: 0.68 })
    );
    const trainRedMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.36, metalness: 0.68 })
    );
    const trainSilverMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.32, metalness: 0.78 })
    );
    const ceilingMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x0f1623, roughness: 0.9, metalness: 0.2 })
    );
    const lightStripMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0xe0f2fe, emissive: 0x7dd3fc, emissiveIntensity: 1.9, roughness: 0.1 })
    );

    const floor = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(halfSize * 2, halfSize * 2)), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    rootGroup.add(floor);
    staticRayMeshes.push(floor);

    // High Subterranean Terminal Ceiling (kept high at y=18m with illuminated light bars)
    const ceiling = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(halfSize * 2, halfSize * 2)), ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 18;
    rootGroup.add(ceiling);
    for (const lz of [-44, -18, 0, 18, 44]) {
      const strip = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(88, 0.25, 1.4)), lightStripMat);
      strip.position.set(0, 17.6, lz);
      rootGroup.add(strip);
    }

    // Perimeter Station Bulkheads
    const wallH = 18;
    const wallT = 2.8;
    addBox(0, wallH / 2, -halfSize - wallT / 2, halfSize * 2 + wallT * 2, wallH, wallT, wallMat);
    addBox(0, wallH / 2, halfSize + wallT / 2, halfSize * 2 + wallT * 2, wallH, wallT, wallMat);
    addBox(-halfSize - wallT / 2, wallH / 2, 0, wallT, wallH, halfSize * 2, wallMat);
    addBox(halfSize + wallT / 2, wallH / 2, 0, wallT, wallH, halfSize * 2, wallMat);

    // Structural Subway Station Columns
    for (const px of [-46, -15, 15, 46]) {
      for (const pz of [-42, -18, 18, 42]) {
        addBox(px, 9.0, pz, 2.4, 18.0, 2.4, pillarMat);
        addBox(px, 2.4, pz, 2.6, 0.2, 2.6, amberMat, false, false);
      }
    }

    // Central Elevated Ticket Mezzanine Platform (y = 2.7m) + North/South Wide Ramps
    const mezY = 2.7;
    addBox(0, mezY / 2, 0, 20, mezY, 16, pillarMat, true);
    buildZRamp(0, 8, -17, -8, 0, mezY, floorMat);
    buildZRamp(0, 8, 17, 8, 0, mezY, floorMat);
    addBox(-8.5, mezY + 0.55, 0, 0.8, 1.1, 13.5, darkMetalMat);
    addBox(8.5, mezY + 0.55, 0, 0.8, 1.1, 13.5, darkMetalMat);

    // Parked Walk-Through Subway Train Cars on West (x = -29) & East (x = +29) Tracks
    const buildTrainCar = (tx: number, tz: number, bodyMat: THREE.Material) => {
      addBox(tx, 0.22, tz, 4.4, 0.44, 24.0, darkMetalMat);
      addBox(tx, 3.65, tz, 4.5, 0.32, 24.2, trainSilverMat, false);
      addBox(tx, 1.95, tz - 11.7, 4.3, 3.1, 0.6, bodyMat);
      addBox(tx, 1.95, tz + 11.7, 4.3, 3.1, 0.6, bodyMat);
      for (const segZ of [-8.8, -2.9, 2.9, 8.8]) {
        addBox(tx - 2.05, 1.95, tz + segZ, 0.28, 3.1, 2.6, bodyMat);
        addBox(tx + 2.05, 1.95, tz + segZ, 0.28, 3.1, 2.6, bodyMat);
      }
      addBox(tx - 1.2, 0.05, tz, 0.18, 0.1, 108, darkMetalMat, false, false);
      addBox(tx + 1.2, 0.05, tz, 0.18, 0.1, 108, darkMetalMat, false, false);
    };
    buildTrainCar(-29, -15, trainRedMat);
    buildTrainCar(-29, 15, trainBlueMat);
    buildTrainCar(29, -15, trainRedMat);
    buildTrainCar(29, 15, trainBlueMat);

    // Ticket Turnstile Kiosks in North (A) & South (C) Halls
    for (const tz of [-46, 46]) {
      for (const kx of [-24, -8, 8, 24]) {
        addBox(kx, 0.75, tz, 4.2, 1.5, 1.4, pillarMat);
        addBox(kx, 1.56, tz, 4.3, 0.12, 1.45, cyanMat, false, false);
      }
    }

    // 8 Destructible Station Service Barriers
    addDestructibleWall('metro-dw-1', -20, 0, 0, 1.1, 2.8, 10.0, 100, wallMat, 'concrete');
    addDestructibleWall('metro-dw-2', 20, 0, 0, 1.1, 2.8, 10.0, 100, wallMat, 'concrete');
    addDestructibleWall('metro-dw-3', -52, 0, -14, 12.0, 2.9, 1.1, 100, wallMat, 'concrete');
    addDestructibleWall('metro-dw-4', 52, 0, -14, 12.0, 2.9, 1.1, 100, wallMat, 'concrete');
    addDestructibleWall('metro-dw-5', -52, 0, 14, 12.0, 2.9, 1.1, 100, wallMat, 'concrete');
    addDestructibleWall('metro-dw-6', 52, 0, 14, 12.0, 2.9, 1.1, 100, wallMat, 'concrete');
    addDestructibleWall('metro-dw-7', 0, 0, -32, 12.0, 2.6, 1.1, 95, wallMat, 'concrete');
    addDestructibleWall('metro-dw-8', 0, 0, 32, 12.0, 2.6, 1.1, 95, wallMat, 'concrete');

    const metroBarrels: Array<[number, number]> = [
      [-12, -26], [12, -26], [-12, 26], [12, 26],
      [-40, -28], [40, 28], [-40, 28], [40, -28],
    ];
    metroBarrels.forEach(([bx, bz], idx) => addExplosiveBarrel(`metro-barrel-${idx}`, bx, 0, bz));

    const arsenals: ArsenalNode[] = [
      addArsenalStructure('metro-arsenal-blue', 'blue', -26, 0, 62, 0),
      addArsenalStructure('metro-arsenal-red', 'red', 26, 0, -62, Math.PI),
    ];

    const pickups = spawnPickups([
      { id: 'metro-med-w', type: 'health', x: -29, y: 0.45, z: 0 },
      { id: 'metro-med-e', type: 'health', x: 29, y: 0.45, z: 0 },
      { id: 'metro-ammo-mid', type: 'ammo', x: 0, y: mezY, z: 0 },
      { id: 'metro-ammo-a', type: 'ammo', x: -38, y: 0, z: -42 },
      { id: 'metro-ammo-c', type: 'ammo', x: 38, y: 0, z: 42 },
    ]);

    return {
      mapId,
      rootGroup,
      atmosphere,
      colliders,
      ramps,
      staticRayMeshes,
      destructibleWalls,
      barrels,
      zones,
      arsenals,
      hangars: [],
      blueSpawns: [
        new THREE.Vector3(-12, 0, 64), new THREE.Vector3(-4, 0, 64), new THREE.Vector3(4, 0, 64),
        new THREE.Vector3(12, 0, 64), new THREE.Vector3(24, 0, 62), new THREE.Vector3(-44, 0, 60),
        new THREE.Vector3(44, 0, 60), new THREE.Vector3(-58, 0, 56), new THREE.Vector3(58, 0, 56),
        new THREE.Vector3(0, 0, 58),
      ],
      redSpawns: [
        new THREE.Vector3(-12, 0, -64), new THREE.Vector3(-4, 0, -64), new THREE.Vector3(4, 0, -64),
        new THREE.Vector3(12, 0, -64), new THREE.Vector3(-24, 0, -62), new THREE.Vector3(44, 0, -60),
        new THREE.Vector3(-44, 0, -60), new THREE.Vector3(58, 0, -56), new THREE.Vector3(-58, 0, -56),
        new THREE.Vector3(0, 0, -58),
      ],
      waypoints: [
        new THREE.Vector3(-40, 0, 36), new THREE.Vector3(0, 0, 38), new THREE.Vector3(40, 0, 36),
        new THREE.Vector3(-56, 0, 0), new THREE.Vector3(-29, 0.45, 14), new THREE.Vector3(29, 0.45, 14),
        new THREE.Vector3(56, 0, 0), new THREE.Vector3(0, mezY, 0), new THREE.Vector3(-29, 0.45, -14),
        new THREE.Vector3(29, 0.45, -14), new THREE.Vector3(-40, 0, -36), new THREE.Vector3(0, 0, -38),
        new THREE.Vector3(40, 0, -36), new THREE.Vector3(-16, 0, 0), new THREE.Vector3(16, 0, 0),
      ],
      pickups,
      beltPickups: [],
      mountedMgs: [],
      vehicles: [],
      halfSize,
      infantryOnly: true,
      disposables: { geometries, materials, textures },
    };
  }

  // =========================================================================
  // MAP 7: SKYLINE HELIDECK (132x132m · Compact 5v5 Infantry Only · Zero Vehicles/Mounts)
  // =========================================================================
  if (mapId === 'rooftop') {
    const halfSize = 66;
    const zones: ArenaZoneInfo[] = [
      { id: 'A', name: 'North Chiller Deck', centerX: 0, centerZ: -38, radius: 28, accentHex: '#EF4444' },
      { id: 'B', name: 'Central Helideck Plaza', centerX: 0, centerZ: 0, radius: 26, accentHex: '#F59E0B' },
      { id: 'C', name: 'South Penthouse Terrace', centerX: 0, centerZ: 38, radius: 28, accentHex: '#3B82F6' },
    ];
    const atmosphere: ArenaAtmosphere = {
      bgColor: 0x1c2538,
      fogColor: 0x243047,
      fogDensity: 0.0014,
      sunColor: 0xffcfa0,
      sunIntensity: 2.55,
      sunPos: [110, 76, -85],
      hemiSky: 0x93c5fd,
      hemiGround: 0x283244,
      hemiIntensity: 1.0,
    };

    rootGroup.add(
      buildSkyDome(0x0d1b32, 0x263f63, 0x9a644c, atmosphere.sunPos, [1.0, 0.72, 0.44], 0.52, geometries, materials)
    );

    const floorTexSet = createConcreteWallTextures(maxAnisotropy);
    floorTexSet.map.repeat.set(22, 22);
    floorTexSet.bumpMap.repeat.set(22, 22);
    const deckTexSet = createSteelDeckTextures(maxAnisotropy);
    textures.push(floorTexSet.map, floorTexSet.bumpMap, deckTexSet.map, deckTexSet.bumpMap);

    const roofConcreteMat = trackMat(
      new THREE.MeshStandardMaterial({ map: floorTexSet.map, bumpMap: floorTexSet.bumpMap, bumpScale: 0.04, roughness: 0.76, metalness: 0.12 })
    );
    const steelMat = trackMat(
      new THREE.MeshStandardMaterial({ map: deckTexSet.map, bumpMap: deckTexSet.bumpMap, bumpScale: 0.04, roughness: 0.36, metalness: 0.78 })
    );
    const glassMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.12, metalness: 0.86, transparent: true, opacity: 0.72 })
    );
    const towerMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x162032, roughness: 0.42, metalness: 0.65 })
    );
    const windowGlowMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0xfde68a, emissive: 0xf59e0b, emissiveIntensity: 0.85 })
    );

    const mainRoof = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(halfSize * 2, halfSize * 2)), roofConcreteMat);
    mainRoof.rotation.x = -Math.PI / 2;
    mainRoof.receiveShadow = true;
    rootGroup.add(mainRoof);
    staticRayMeshes.push(mainRoof);

    // Decorative Helipad Circle at Zone B (No helicopters spawned — pure 5v5 infantry deck)
    addHelipad('rooftop-decor-pad', 'blue', 0, 0, 0);

    // Surrounding Skyline Skyscraper Towers below the Roof Horizon
    for (const [tx, tz, tw, th, td] of [
      [-125, -110, 36, 95, 36], [125, -105, 42, 110, 38],
      [-130, 105, 38, 102, 34], [128, 115, 40, 88, 36],
      [-115, 0, 30, 82, 48], [118, 6, 32, 90, 44],
      [0, -124, 52, 92, 32], [0, 126, 48, 86, 32],
    ]) {
      const bldg = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(tw, th, td)), towerMat);
      bldg.position.set(tx, -th / 2 - 4, tz);
      const crownTrim = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(tw + 0.6, 1.2, td + 0.6)), windowGlowMat);
      crownTrim.position.set(tx, -3.4, tz);
      rootGroup.add(bldg, crownTrim);
    }

    // Perimeter Rooftop Concrete Safety Parapet Walls
    const parH = 3.2;
    const parT = 2.0;
    addBox(0, parH / 2, -halfSize - parT / 2, halfSize * 2 + parT * 2, parH, parT, roofConcreteMat);
    addBox(0, parH / 2, halfSize + parT / 2, halfSize * 2 + parT * 2, parH, parT, roofConcreteMat);
    addBox(-halfSize - parT / 2, parH / 2, 0, parT, parH, halfSize * 2, roofConcreteMat);
    addBox(halfSize + parT / 2, parH / 2, 0, parT, parH, halfSize * 2, roofConcreteMat);

    // Dual Elevated Penthouse Overlook Decks (West & East x = ±36, y = 2.8m)
    const deckY = 2.8;
    for (const side of [-1, 1]) {
      addBox(side * 36, deckY / 2, 0, 16, deckY, 26, roofConcreteMat, true);
      buildZRamp(side * 36, 7.5, -21, -13, 0, deckY, steelMat);
      buildZRamp(side * 36, 7.5, 21, 13, 0, deckY, steelMat);
      addBox(side * 36, deckY + 1.6, 0, 10, 0.25, 14, glassMat, false, false);
      for (const cz of [-6.5, 6.5]) {
        addBox(side * 31.2, deckY + 0.85, cz, 0.45, 1.7, 0.45, darkMetalMat);
        addBox(side * 40.8, deckY + 0.85, cz, 0.45, 1.7, 0.45, darkMetalMat);
      }
    }

    // Industrial HVAC Chiller Units & Duct Cover across North & South Decks
    for (const [hx, hz, hw, hh, hd] of [
      [-18, -32, 9.5, 2.8, 5.2], [18, -32, 9.5, 2.8, 5.2],
      [-18, 32, 9.5, 2.8, 5.2], [18, 32, 9.5, 2.8, 5.2],
      [-48, -38, 7.5, 2.6, 8.0], [48, -38, 7.5, 2.6, 8.0],
      [-48, 38, 7.5, 2.6, 8.0], [48, 38, 7.5, 2.6, 8.0],
      [0, -20, 12.0, 1.5, 2.2], [0, 20, 12.0, 1.5, 2.2],
    ]) {
      addBox(hx, hh / 2, hz, hw, hh, hd, steelMat);
      addBox(hx, hh + 0.14, hz, hw * 0.7, 0.24, hd * 0.7, darkMetalMat, false, false);
    }

    // 8 Breachable Rooftop Maintenance Screens
    addDestructibleWall('roof-dw-1', -18, 0, 0, 1.0, 2.6, 10.0, 95, roofConcreteMat, 'concrete');
    addDestructibleWall('roof-dw-2', 18, 0, 0, 1.0, 2.6, 10.0, 95, roofConcreteMat, 'concrete');
    addDestructibleWall('roof-dw-3', 0, 0, -48, 12.0, 2.8, 1.1, 100, roofConcreteMat, 'concrete');
    addDestructibleWall('roof-dw-4', 0, 0, 48, 12.0, 2.8, 1.1, 100, roofConcreteMat, 'concrete');
    addDestructibleWall('roof-dw-5', -36, 0, -28, 10.0, 2.6, 1.0, 95, steelMat, 'steel');
    addDestructibleWall('roof-dw-6', 36, 0, -28, 10.0, 2.6, 1.0, 95, steelMat, 'steel');
    addDestructibleWall('roof-dw-7', -36, 0, 28, 10.0, 2.6, 1.0, 95, steelMat, 'steel');
    addDestructibleWall('roof-dw-8', 36, 0, 28, 10.0, 2.6, 1.0, 95, steelMat, 'steel');

    for (const [jx, jz, jr] of [
      [-10, 14, 0.25], [10, 14, -0.25], [-10, -14, -0.25], [10, -14, 0.25],
    ]) {
      addJerseyBarrier(jx, jz, jr);
    }

    const roofBarrels: Array<[number, number]> = [
      [-12, -26], [12, -26], [-12, 26], [12, 26],
      [-24, 0], [24, 0], [-52, 0], [52, 0],
    ];
    roofBarrels.forEach(([bx, bz], idx) => addExplosiveBarrel(`roof-barrel-${idx}`, bx, 0, bz));

    const arsenals: ArsenalNode[] = [
      addArsenalStructure('roof-arsenal-blue', 'blue', -22, 0, 52, 0),
      addArsenalStructure('roof-arsenal-red', 'red', 22, 0, -52, Math.PI),
    ];

    const pickups = spawnPickups([
      { id: 'roof-med-w', type: 'health', x: -36, y: deckY, z: 0 },
      { id: 'roof-med-e', type: 'health', x: 36, y: deckY, z: 0 },
      { id: 'roof-ammo-mid', type: 'ammo', x: 0, y: 0.25, z: 0 },
      { id: 'roof-ammo-a', type: 'ammo', x: 0, y: 0, z: -38 },
      { id: 'roof-ammo-c', type: 'ammo', x: 0, y: 0, z: 38 },
    ]);

    return {
      mapId,
      rootGroup,
      atmosphere,
      colliders,
      ramps,
      staticRayMeshes,
      destructibleWalls,
      barrels,
      zones,
      arsenals,
      hangars: [],
      blueSpawns: [
        new THREE.Vector3(-10, 0, 56), new THREE.Vector3(-3, 0, 56), new THREE.Vector3(3, 0, 56),
        new THREE.Vector3(10, 0, 56), new THREE.Vector3(24, 0, 54), new THREE.Vector3(-36, 0, 54),
        new THREE.Vector3(36, 0, 54), new THREE.Vector3(-52, 0, 50), new THREE.Vector3(52, 0, 50),
        new THREE.Vector3(0, 0, 52),
      ],
      redSpawns: [
        new THREE.Vector3(-10, 0, -56), new THREE.Vector3(-3, 0, -56), new THREE.Vector3(3, 0, -56),
        new THREE.Vector3(10, 0, -56), new THREE.Vector3(-24, 0, -54), new THREE.Vector3(36, 0, -54),
        new THREE.Vector3(-36, 0, -54), new THREE.Vector3(52, 0, -50), new THREE.Vector3(-52, 0, -50),
        new THREE.Vector3(0, 0, -52),
      ],
      waypoints: [
        new THREE.Vector3(-36, 0, 32), new THREE.Vector3(0, 0, 34), new THREE.Vector3(36, 0, 32),
        new THREE.Vector3(-52, 0, 0), new THREE.Vector3(-36, deckY, 0), new THREE.Vector3(36, deckY, 0),
        new THREE.Vector3(52, 0, 0), new THREE.Vector3(0, 0.25, 0), new THREE.Vector3(-22, 0, -10),
        new THREE.Vector3(22, 0, -10), new THREE.Vector3(-36, 0, -32), new THREE.Vector3(0, 0, -34),
        new THREE.Vector3(36, 0, -32), new THREE.Vector3(-22, 0, 10), new THREE.Vector3(22, 0, 10),
      ],
      pickups,
      beltPickups: [],
      mountedMgs: [],
      vehicles: [],
      halfSize,
      infantryOnly: true,
      disposables: { geometries, materials, textures },
    };
  }

  // =========================================================================
  // MAP 3: CRYO BUNKER (Expanded 680x680m · 4x Area · High-Bay Airspace for Helis)
  // =========================================================================
  const halfSize = 340;
  const zones: ArenaZoneInfo[] = [
    { id: 'A', name: 'North Cryo Storage Bay', centerX: 0, centerZ: -224, radius: 126, accentHex: '#EF4444' },
    { id: 'B', name: 'Central Fusion Reactor', centerX: 0, centerZ: 0, radius: 126, accentHex: '#06B6D4' },
    { id: 'C', name: 'South Armored Hangar', centerX: 0, centerZ: 224, radius: 126, accentHex: '#3B82F6' },
  ];
  const atmosphere: ArenaAtmosphere = {
    bgColor: 0x0b121e,
    fogColor: 0x0d1624,
    fogDensity: 0.00155,
    sunColor: 0xdbeafe,
    sunIntensity: 2.0,
    sunPos: [140, 170, 95],
    hemiSky: 0x38bdf8,
    hemiGround: 0x111827,
    hemiIntensity: 1.15,
  };

  rootGroup.add(
    buildSkyDome(0x060b14, 0x0e1a2b, 0x172940, atmosphere.sunPos, [0.45, 0.72, 1.0], 0.0, geometries, materials)
  );

  const bunkerFloor = createBunkerFloorTextures(maxAnisotropy);
  bunkerFloor.map.repeat.set(120, 120);
  bunkerFloor.bumpMap.repeat.set(120, 120);
  bunkerFloor.roughnessMap.repeat.set(120, 120);
  const wallTex = createConcreteWallTextures(maxAnisotropy);
  const cryoRackTex = createContainerTextures('#1b2638', '#06b6d4', maxAnisotropy);
  const deckTex = createSteelDeckTextures(maxAnisotropy);

  textures.push(
    bunkerFloor.map, bunkerFloor.bumpMap, bunkerFloor.roughnessMap,
    wallTex.map, wallTex.bumpMap, cryoRackTex.map, cryoRackTex.bumpMap, deckTex.map, deckTex.bumpMap
  );

  const floorMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: bunkerFloor.map, bumpMap: bunkerFloor.bumpMap, bumpScale: 0.03,
      roughnessMap: bunkerFloor.roughnessMap, roughness: 0.55, metalness: 0.35,
    })
  );
  const outerGroundMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x090d14, roughness: 0.9, metalness: 0.2 }));
  const wallMat = trackMat(
    new THREE.MeshStandardMaterial({ map: wallTex.map, bumpMap: wallTex.bumpMap, bumpScale: 0.05, roughness: 0.65, metalness: 0.3 })
  );
  const rackMat = trackMat(
    new THREE.MeshStandardMaterial({ map: cryoRackTex.map, bumpMap: cryoRackTex.bumpMap, bumpScale: 0.05, roughness: 0.38, metalness: 0.75 })
  );
  const deckMat = trackMat(
    new THREE.MeshStandardMaterial({ map: deckTex.map, bumpMap: deckTex.bumpMap, bumpScale: 0.04, roughness: 0.35, metalness: 0.82 })
  );
  const cyanNeonMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x06b6d4, emissiveIntensity: 1.4, roughness: 0.2 })
  );

  const outerGround = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(2400, 2400)), outerGroundMat);
  outerGround.rotation.x = -Math.PI / 2;
  outerGround.position.y = -0.04;
  rootGroup.add(outerGround);

  const mainFloor = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(halfSize * 2, halfSize * 2)), floorMat);
  mainFloor.rotation.x = -Math.PI / 2;
  mainFloor.receiveShadow = true;
  rootGroup.add(mainFloor);
  staticRayMeshes.push(mainFloor);

  // High-bay megabunker walls & 58m ceiling gantry girders (clear airspace for helicopters)
  const wallH = 26.0;
  const wallT = 3.8;
  addBox(0, wallH / 2, -halfSize - wallT / 2, halfSize * 2 + wallT * 2, wallH, wallT, wallMat);
  addBox(0, wallH / 2, halfSize + wallT / 2, halfSize * 2 + wallT * 2, wallH, wallT, wallMat);
  addBox(-halfSize - wallT / 2, wallH / 2, 0, wallT, wallH, halfSize * 2, wallMat);
  addBox(halfSize + wallT / 2, wallH / 2, 0, wallT, wallH, halfSize * 2, wallMat);

  for (const gz of [-230, -115, 0, 115, 230]) {
    addBox(0, 58.0, gz, halfSize * 2, 1.5, 2.4, darkMetalMat, false, false);
    addBox(0, 57.1, gz, 460, 0.28, 0.85, cyanNeonMat, false, false);
  }

  // ZONE B: Central Reactor Ring Platform (y = 3.0m)
  const platY = 3.0;
  addBox(0, platY - 0.25, 0, 40, 0.5, 40, deckMat, true);
  const core = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(3.0, 3.6, 15.0, 16)), darkMetalMat);
  core.position.set(0, 7.5, 0);
  core.castShadow = true;
  rootGroup.add(core);
  staticRayMeshes.push(core);
  colliders.push({ minX: -3.4, maxX: 3.4, minY: 0, maxY: 15.0, minZ: -3.4, maxZ: 3.4 });

  const coreRing = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(3.8, 3.8, 0.6, 16)), cyanNeonMat);
  coreRing.position.set(0, platY + 2.6, 0);
  rootGroup.add(coreRing);

  const coreHalo = new THREE.Sprite(
    trackMat(new THREE.SpriteMaterial({ map: cyanGlowTex, transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending, depthWrite: false }))
  );
  coreHalo.scale.set(22, 22, 1);
  coreHalo.position.set(0, platY + 2.6, 0);
  rootGroup.add(coreHalo);

  buildRamp(-34, -20, 0, 7.5, 0, platY, deckMat);
  buildRamp(34, 20, 0, 7.5, 0, platY, deckMat);
  buildZRamp(0, 7.5, -34, -20, 0, platY, deckMat);
  buildZRamp(0, 7.5, 34, 20, 0, platY, deckMat);

  // Cryo Storage Monoliths across Zones A, B, C
  for (const [rx, rz, rw, rd] of [
    [-108, -72, 4.6, 15], [108, -72, 4.6, 15], [-108, 72, 4.6, 15], [108, 72, 4.6, 15],
    [-216, -68, 4.6, 15], [216, -68, 4.6, 15], [-216, 68, 4.6, 15], [216, 68, 4.6, 15],
    [-76, -204, 12.0, 4.0], [76, -204, 12.0, 4.0], [-76, 204, 12.0, 4.0], [76, 204, 12.0, 4.0],
    [-212, -208, 4.8, 14], [212, -208, 4.8, 14], [-212, 208, 4.8, 14], [212, 208, 4.8, 14],
    [-68, -125, 11.0, 4.0], [68, 125, 11.0, 4.0],
  ]) {
    addBox(rx, 2.1, rz, rw, 4.2, rd, rackMat);
  }

  // 14 Destructible Blast Partition Walls
  addDestructibleWall('bunker-dw-1', -92, 0, -116, 16, 3.6, 1.4, 155, wallMat, 'concrete');
  addDestructibleWall('bunker-dw-2', 92, 0, -116, 16, 3.6, 1.4, 155, wallMat, 'concrete');
  addDestructibleWall('bunker-dw-3', -92, 0, 116, 16, 3.6, 1.4, 155, wallMat, 'concrete');
  addDestructibleWall('bunker-dw-4', 92, 0, 116, 16, 3.6, 1.4, 155, wallMat, 'concrete');
  addDestructibleWall('bunker-dw-5', 0, 0, -80, 14, 3.2, 1.2, 135, wallMat, 'concrete');
  addDestructibleWall('bunker-dw-6', 0, 0, 80, 14, 3.2, 1.2, 135, wallMat, 'concrete');
  addDestructibleWall('bunker-dw-7', -164, 0, 0, 1.4, 3.6, 16, 145, wallMat, 'concrete');
  addDestructibleWall('bunker-dw-8', 164, 0, 0, 1.4, 3.6, 16, 145, wallMat, 'concrete');
  addDestructibleWall('bunker-dw-9', 0, 0, -192, 16, 3.4, 1.3, 145, wallMat, 'concrete');
  addDestructibleWall('bunker-dw-10', 0, 0, 192, 16, 3.4, 1.3, 145, wallMat, 'concrete');
  addDestructibleWall('bunker-dw-11', -240, 0, -116, 16, 3.5, 1.4, 150, wallMat, 'concrete');
  addDestructibleWall('bunker-dw-12', 240, 0, -116, 16, 3.5, 1.4, 150, wallMat, 'concrete');
  addDestructibleWall('bunker-dw-13', -240, 0, 116, 16, 3.5, 1.4, 150, wallMat, 'concrete');
  addDestructibleWall('bunker-dw-14', 240, 0, 116, 16, 3.5, 1.4, 150, wallMat, 'concrete');

  addBox(0, 1.4, 248, 18, 2.8, 2.4, darkMetalMat);
  addBox(0, 2.88, 248, 18.2, 0.16, 2.45, accentBlueMat, false, false);
  addBox(0, 1.4, -248, 18, 2.8, 2.4, darkMetalMat);
  addBox(0, 2.88, -248, 18.2, 0.16, 2.45, accentRedMat, false, false);

  for (const [jx, jz, jr] of [
    [-32, 76, 0.2], [32, 76, -0.2], [-32, -76, -0.2], [32, -76, 0.2],
  ]) {
    addJerseyBarrier(jx, jz, jr);
  }
  for (const [px, pz] of [[-92, 216], [92, -216]]) {
    addSupplyPallet(px, 0, pz);
  }

  const bunkerBarrels: Array<[number, number]> = [
    [-80, -110], [80, -110], [-80, 110], [80, 110],
    [-44, -36], [44, -36], [-44, 36], [44, 36],
    [-156, -12], [156, 12], [-192, -68], [192, 68],
    [-32, -186], [32, 186], [-104, -176], [104, 176],
  ];
  bunkerBarrels.forEach(([bx, bz], idx) => addExplosiveBarrel(`bunker-barrel-${idx}`, bx, 0, bz));

  const arsenals: ArsenalNode[] = [
    addArsenalStructure('bunker-arsenal-blue', 'blue', -68, 0, 276, 0),
    addArsenalStructure('bunker-arsenal-red', 'red', 68, 0, -276, Math.PI),
  ];

  const hangars: HangarNode[] = [
    addMiniHangar('bunker-hangar-blue', 'blue', 104, 0, 274, 0),
    addMiniHangar('bunker-hangar-red', 'red', -104, 0, -274, Math.PI),
  ];

  addHelipad('bunker-helipad-blue', 'blue', -144, 0, 294);
  addHelipad('bunker-helipad-red', 'red', 144, 0, -294);

  const mountedMgs: MountedMgNode[] = [
    addMountedEmplacement('bunker-auto-south', 'autocannon', -15, platY, 15, 0, false),
    addMountedEmplacement('bunker-auto-north', 'autocannon', 15, platY, -15, Math.PI, false),
    addMountedEmplacement('bunker-fg-south', 'field_gun', -152, 0, 156, 0.15, true),
    addMountedEmplacement('bunker-fg-north', 'field_gun', 152, 0, -156, Math.PI + 0.15, true),
    addMountedEmplacement('bunker-tow-w', 'tow', -264, 0, 0, -Math.PI / 2, true),
    addMountedEmplacement('bunker-tow-e', 'tow', 264, 0, 0, Math.PI / 2, true),
    addMountedEmplacement('bunker-hmg-a', 'hmg', 0, 0, -148, Math.PI, true),
    addMountedEmplacement('bunker-hmg-c', 'hmg', 0, 0, 148, 0, true),
    addMountedEmplacement('bunker-mg30-w', 'mg30', -88, 0, 0, -Math.PI / 2, true),
    addMountedEmplacement('bunker-mg30-e', 'mg30', 88, 0, 0, Math.PI / 2, true),
  ];

  const vehicles: VehicleNode[] = [
    addTacticalVehicle('bunker-blue-apc', 'apc', -32, 0, 278, 0, 'blue'),
    addTacticalVehicle('bunker-blue-jeep', 'jeep', -102, 0, 272, 0, 'blue'),
    addTacticalVehicle('bunker-blue-tank', 'tank', 148, 0, 272, 0, 'blue'),
    addTacticalVehicle('bunker-blue-mbt', 'heavy_tank', 32, 0, 284, 0, 'blue'),
    addTacticalVehicle('bunker-blue-heli', 'attack_heli', -144, 0.25, 294, 0, 'blue'),
    addTacticalVehicle('bunker-red-apc', 'apc', 32, 0, -278, Math.PI, 'red'),
    addTacticalVehicle('bunker-red-jeep', 'jeep', 102, 0, -272, Math.PI, 'red'),
    addTacticalVehicle('bunker-red-tank', 'tank', -148, 0, -272, Math.PI, 'red'),
    addTacticalVehicle('bunker-red-mbt', 'heavy_tank', -32, 0, -284, Math.PI, 'red'),
    addTacticalVehicle('bunker-red-heli', 'attack_heli', 144, 0.25, -294, Math.PI, 'red'),
  ];

  const pickups = spawnPickups([
    { id: 'med-west', type: 'health', x: -148, y: 0, z: 0 },
    { id: 'med-east', type: 'health', x: 148, y: 0, z: 0 },
    { id: 'med-a', type: 'health', x: -108, y: 0, z: -208 },
    { id: 'med-c', type: 'health', x: 108, y: 0, z: 208 },
    { id: 'ammo-north', type: 'ammo', x: 0, y: platY, z: -14 },
    { id: 'ammo-south', type: 'ammo', x: 0, y: platY, z: 14 },
  ]);

  return {
    mapId,
    rootGroup,
    atmosphere,
    colliders,
    ramps,
    staticRayMeshes,
    destructibleWalls,
    barrels,
    zones,
    arsenals,
    hangars,
    blueSpawns: [
      new THREE.Vector3(-36, 0, 300), new THREE.Vector3(-12, 0, 304), new THREE.Vector3(12, 0, 304),
      new THREE.Vector3(36, 0, 300), new THREE.Vector3(-96, 0, 296), new THREE.Vector3(96, 0, 296),
      new THREE.Vector3(-208, 0, 292), new THREE.Vector3(208, 0, 292), new THREE.Vector3(-56, 0, 266),
      new THREE.Vector3(56, 0, 266),
    ],
    redSpawns: [
      new THREE.Vector3(-36, 0, -300), new THREE.Vector3(-12, 0, -304), new THREE.Vector3(12, 0, -304),
      new THREE.Vector3(36, 0, -300), new THREE.Vector3(-96, 0, -296), new THREE.Vector3(96, 0, -296),
      new THREE.Vector3(-208, 0, -292), new THREE.Vector3(208, 0, -292), new THREE.Vector3(-56, 0, -266),
      new THREE.Vector3(56, 0, -266),
    ],
    waypoints: [
      new THREE.Vector3(-200, 0, 200), new THREE.Vector3(0, 0, 192), new THREE.Vector3(200, 0, 200),
      new THREE.Vector3(-152, 0, 76), new THREE.Vector3(0, 0, 84), new THREE.Vector3(152, 0, 76),
      new THREE.Vector3(-148, 0, 0), new THREE.Vector3(0, platY, 0), new THREE.Vector3(148, 0, 0),
      new THREE.Vector3(-152, 0, -76), new THREE.Vector3(0, 0, -84), new THREE.Vector3(152, 0, -76),
      new THREE.Vector3(-200, 0, -200), new THREE.Vector3(0, 0, -192), new THREE.Vector3(200, 0, -200),
    ],
    pickups,
    beltPickups,
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
    if (c.disabled) continue;
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
    if (c.disabled) continue;
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
