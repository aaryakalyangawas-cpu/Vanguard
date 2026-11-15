import * as THREE from 'three';
import {
  createArenaFloorTextures,
  createBunkerFloorTextures,
  createConcreteWallTextures,
  createContainerTextures,
  createDesertFloorTextures,
  createSandstoneTextures,
  createSteelDeckTextures,
} from './textures';
import { MapId, MapInfo } from './types';

export const MAPS: Record<MapId, MapInfo> = {
  yard: {
    id: 'yard',
    name: 'Industrial Yard',
    environment: 'Dusk Cargo Terminal',
    sizeLabel: '80×80m · Balanced',
    description: 'Elevated steel overpass, shipping containers, and 3-lane courtyard cover.',
  },
  outpost: {
    id: 'outpost',
    name: 'Desert Outpost',
    environment: 'Arid Canyon FOB',
    sizeLabel: '92×92m · Long Range',
    description: 'Sandstone compound walls, elevated sniper towers, and wide canyon sightlines.',
  },
  bunker: {
    id: 'bunker',
    name: 'Cryo Bunker',
    environment: 'Subterranean Facility',
    sizeLabel: '68×68m · Close Quarters',
    description: 'Tight containment corridors, central reactor catwalk, and rapid flanking routes.',
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
  geometries: THREE.BufferGeometry[],
  materials: THREE.Material[]
): THREE.Mesh {
  const geo = new THREE.SphereGeometry(230, 32, 20);
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
      varying vec3 vWorldPos;
      void main() {
        vec3 dir = normalize(vWorldPos);
        float h = clamp(dir.y, 0.0, 1.0);
        vec3 col = mix(horizonColor, midColor, smoothstep(0.0, 0.24, h));
        col = mix(col, topColor, smoothstep(0.22, 0.78, h));
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

  // =========================================================================
  // MAP 1: INDUSTRIAL YARD (Dusk Cargo Terminal, 80x80m)
  // =========================================================================
  if (mapId === 'yard') {
    const halfSize = 40;
    const atmosphere: ArenaAtmosphere = {
      bgColor: 0x28262b,
      fogColor: 0x22252e,
      fogDensity: 0.0085,
      sunColor: 0xffdfba,
      sunIntensity: 2.35,
      sunPos: [38, 42, 22],
      hemiSky: 0x93c5fd,
      hemiGround: 0x262930,
      hemiIntensity: 0.92,
    };

    rootGroup.add(
      buildSkyDome(0x0b1322, 0x1b283b, 0x473832, atmosphere.sunPos, [1.0, 0.72, 0.42], geometries, materials)
    );

    const floorTexSet = createArenaFloorTextures(maxAnisotropy);
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

    const outerGround = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(460, 460)), outerGroundMat);
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

    const wallH = 6.5;
    const wallT = 2.0;
    addBox(0, wallH / 2, -halfSize - wallT / 2, halfSize * 2 + wallT * 2, wallH, wallT, concreteMat);
    addBox(0, wallH / 2, halfSize + wallT / 2, halfSize * 2 + wallT * 2, wallH, wallT, concreteMat);
    addBox(-halfSize - wallT / 2, wallH / 2, 0, wallT, wallH, halfSize * 2, concreteMat);
    addBox(halfSize + wallT / 2, wallH / 2, 0, wallT, wallH, halfSize * 2, concreteMat);

    for (const [tx, tz] of [
      [-38, -38],
      [38, -38],
      [-38, 38],
      [38, 38],
    ]) {
      const pole = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.28, 0.38, 15, 10)), darkMetalMat);
      pole.position.set(tx, 7.5, tz);
      rootGroup.add(pole);
      const head = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.6, 0.9, 0.8)), darkMetalMat);
      head.position.set(tx, 15.1, tz);
      head.lookAt(0, 0, 0);
      rootGroup.add(head);
      const panel = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(2.2, 0.65)), floodLampMat);
      panel.position.set(0, 0, 0.42);
      head.add(panel);
    }

    const distantMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x1a212d, roughness: 0.88, metalness: 0.25 })
    );
    for (const [sx, sz, sw, sh, sd] of [
      [-68, -58, 18, 24, 18],
      [0, -78, 38, 18, 14],
      [66, -62, 20, 30, 20],
      [-74, 48, 22, 26, 20],
      [70, 56, 24, 21, 22],
      [-84, 0, 14, 19, 44],
      [86, -8, 16, 25, 38],
      [12, 84, 34, 16, 16],
    ]) {
      const bldg = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(sw, sh, sd)), distantMat);
      bldg.position.set(sx, sh / 2 - 0.04, sz);
      rootGroup.add(bldg);
    }

    const bridgeY = 2.8;
    addBox(0, bridgeY - 0.25, 0, 18, 0.5, 8, deckMat, true);
    for (const px of [-7.5, 7.5]) {
      for (const pz of [-2.8, 2.8]) {
        addBox(px, (bridgeY - 0.5) / 2, pz, 0.9, bridgeY - 0.5, 0.9, darkMetalMat, true);
      }
    }
    addBox(0, bridgeY + 0.55, -3.85, 16, 1.1, 0.28, darkMetalMat, true);
    addBox(0, bridgeY + 0.55, 3.85, 16, 1.1, 0.28, darkMetalMat, true);
    addBox(0, bridgeY + 1.12, -3.85, 16, 0.08, 0.3, amberMat, false, false);
    addBox(0, bridgeY + 1.12, 3.85, 16, 0.08, 0.3, amberMat, false, false);

    buildRamp(-18, -9, 0, 5.2, 0, bridgeY, deckMat);
    buildRamp(18, 9, 0, 5.2, 0, bridgeY, deckMat);

    addShippingContainer(-12, 29, 8, 3.1, 3.2, blueContainerMat);
    addShippingContainer(12, 29, 8, 3.1, 3.2, blueContainerMat);
    addBox(0, 1.1, 31, 6.5, 2.2, 1.4, concreteMat);
    addBox(0, 2.25, 31, 6.6, 0.14, 1.46, accentBlueMat, false, false);

    addShippingContainer(-12, -29, 8, 3.1, 3.2, redContainerMat);
    addShippingContainer(12, -29, 8, 3.1, 3.2, redContainerMat);
    addBox(0, 1.1, -31, 6.5, 2.2, 1.4, concreteMat);
    addBox(0, 2.25, -31, 6.6, 0.14, 1.46, accentRedMat, false, false);

    addShippingContainer(-24, -12, 3.2, 3.2, 8.5, slateContainerMat);
    addShippingContainer(-24, 12, 3.2, 3.2, 8.5, slateContainerMat);
    addBox(-31, 1.35, 0, 4.2, 2.7, 5.4, concreteMat);

    addShippingContainer(24, -12, 3.2, 3.2, 8.5, slateContainerMat);
    addShippingContainer(24, 12, 3.2, 3.2, 8.5, slateContainerMat);
    addBox(31, 1.35, 0, 4.2, 2.7, 5.4, concreteMat);

    addJerseyBarrier(-11, -16, 5.0);
    addJerseyBarrier(11, -16, 5.0);
    addJerseyBarrier(-11, 16, 5.0);
    addJerseyBarrier(11, 16, 5.0);

    for (const [cx, cz] of [
      [-19, 22],
      [19, 22],
      [-19, -22],
      [19, -22],
      [-5, -10],
      [5, 10],
    ]) {
      addBox(cx, 0.75, cz, 1.6, 1.5, 1.6, darkMetalMat);
      addBox(cx + 1.4, 0.55, cz + 0.3, 1.1, 1.1, 1.1, slateContainerMat);
    }

    const pickups = spawnPickups([
      { id: 'med-west', type: 'health', x: -27, y: 0, z: 0 },
      { id: 'med-east', type: 'health', x: 27, y: 0, z: 0 },
      { id: 'ammo-mid', type: 'ammo', x: 0, y: bridgeY, z: 0 },
      { id: 'ammo-south', type: 'ammo', x: 0, y: 0, z: 22 },
      { id: 'ammo-north', type: 'ammo', x: 0, y: 0, z: -22 },
    ]);

    return {
      mapId,
      rootGroup,
      atmosphere,
      colliders,
      ramps,
      staticRayMeshes,
      blueSpawns: [
        new THREE.Vector3(-8, 0, 35),
        new THREE.Vector3(0, 0, 35.5),
        new THREE.Vector3(8, 0, 35),
        new THREE.Vector3(-18, 0, 34),
        new THREE.Vector3(18, 0, 34),
      ],
      redSpawns: [
        new THREE.Vector3(-8, 0, -35),
        new THREE.Vector3(0, 0, -35.5),
        new THREE.Vector3(8, 0, -35),
        new THREE.Vector3(-18, 0, -34),
        new THREE.Vector3(18, 0, -34),
      ],
      waypoints: [
        new THREE.Vector3(-29, 0, 24),
        new THREE.Vector3(-17, 0, 24),
        new THREE.Vector3(0, 0, 24),
        new THREE.Vector3(17, 0, 24),
        new THREE.Vector3(29, 0, 24),
        new THREE.Vector3(-30, 0, 9),
        new THREE.Vector3(-18, 0, 8),
        new THREE.Vector3(0, 0, 11),
        new THREE.Vector3(18, 0, 8),
        new THREE.Vector3(30, 0, 9),
        new THREE.Vector3(-25, 0, 0),
        new THREE.Vector3(0, bridgeY, 0),
        new THREE.Vector3(25, 0, 0),
        new THREE.Vector3(-30, 0, -9),
        new THREE.Vector3(-18, 0, -8),
        new THREE.Vector3(0, 0, -11),
        new THREE.Vector3(18, 0, -8),
        new THREE.Vector3(30, 0, -9),
        new THREE.Vector3(-29, 0, -24),
        new THREE.Vector3(-17, 0, -24),
        new THREE.Vector3(0, 0, -24),
        new THREE.Vector3(17, 0, -24),
        new THREE.Vector3(29, 0, -24),
      ],
      pickups,
      halfSize,
      disposables: { geometries, materials, textures },
    };
  }

  // =========================================================================
  // MAP 2: DESERT OUTPOST (Arid Canyon FOB, 92x92m, Long-Range Sightlines)
  // =========================================================================
  if (mapId === 'outpost') {
    const halfSize = 46;
    const atmosphere: ArenaAtmosphere = {
      bgColor: 0xc9a984,
      fogColor: 0xd1b38f,
      fogDensity: 0.0068,
      sunColor: 0xfff3d6,
      sunIntensity: 2.6,
      sunPos: [45, 52, -26],
      hemiSky: 0x93c5fd,
      hemiGround: 0x9c764e,
      hemiIntensity: 1.05,
    };

    rootGroup.add(
      buildSkyDome(0x2563eb, 0x7dd3fc, 0xe8cfa8, atmosphere.sunPos, [1.0, 0.85, 0.58], geometries, materials)
    );

    const desertFloor = createDesertFloorTextures(maxAnisotropy);
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

    const outerGround = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(520, 520)), outerSandMat);
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
    const wallH = 5.5;
    const wallT = 2.4;
    addBox(0, wallH / 2, -halfSize - wallT / 2, halfSize * 2 + wallT * 2, wallH, wallT, adobeMat);
    addBox(0, wallH / 2, halfSize + wallT / 2, halfSize * 2 + wallT * 2, wallH, wallT, adobeMat);
    addBox(-halfSize - wallT / 2, wallH / 2, 0, wallT, wallH, halfSize * 2, adobeMat);
    addBox(halfSize + wallT / 2, wallH / 2, 0, wallT, wallH, halfSize * 2, adobeMat);

    // Distant Canyon Mesas beyond perimeter
    for (const [mx, mz, mw, mh, md] of [
      [-85, -75, 42, 26, 32],
      [75, -80, 48, 32, 34],
      [-92, 55, 36, 22, 44],
      [88, 65, 44, 28, 38],
      [0, -108, 68, 22, 24],
      [-10, 108, 64, 20, 24],
    ]) {
      const mesa = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(mw, mh, md)), mesaMat);
      mesa.position.set(mx, mh / 2 - 0.1, mz);
      rootGroup.add(mesa);
    }

    // Two Elevated Watchtower Sniper Decks (East & West flanks, y = 3.2m)
    const towerY = 3.2;
    for (const side of [-1, 1]) {
      const tx = side * 30;
      addBox(tx, towerY - 0.25, 0, 8, 0.5, 10, adobeMat, true);
      addBox(tx, (towerY - 0.5) / 2, -4.2, 1.2, towerY - 0.5, 1.2, darkMetalMat, true);
      addBox(tx, (towerY - 0.5) / 2, 4.2, 1.2, towerY - 0.5, 1.2, darkMetalMat, true);
      // Chest-high sniper parapets
      addBox(tx - side * 3.8, towerY + 0.55, 0, 0.4, 1.1, 10, hescoMat, true);
      addBox(tx, towerY + 0.55, -4.8, 7.6, 1.1, 0.4, hescoMat, true);
      addBox(tx, towerY + 0.55, 4.8, 7.6, 1.1, 0.4, hescoMat, true);
      // Walkable ramp up from South/North
      buildRamp(tx - side * 12, tx - side * 4, 0, 4.4, 0, towerY, hescoMat);
    }

    // Central Ruined Adobe Courtyard + Low Cover Walls
    addBox(0, 1.6, 0, 4.5, 3.2, 4.5, adobeMat);
    addBox(0, 3.3, 0, 4.7, 0.2, 4.7, darkMetalMat, false, false);
    addBox(-9, 0.9, -9, 6, 1.8, 1.4, hescoMat);
    addBox(9, 0.9, -9, 6, 1.8, 1.4, hescoMat);
    addBox(-9, 0.9, 9, 6, 1.8, 1.4, hescoMat);
    addBox(9, 0.9, 9, 6, 1.8, 1.4, hescoMat);

    // Base Spawn Bunkers (Blue South, Red North)
    addBox(-12, 1.6, 33, 9, 3.2, 3.5, crateMat);
    addBox(12, 1.6, 33, 9, 3.2, 3.5, crateMat);
    addBox(0, 1.1, 35, 7, 2.2, 1.6, hescoMat);
    addBox(0, 2.28, 35, 7.1, 0.14, 1.65, accentBlueMat, false, false);

    addBox(-12, 1.6, -33, 9, 3.2, 3.5, crateMat);
    addBox(12, 1.6, -33, 9, 3.2, 3.5, crateMat);
    addBox(0, 1.1, -35, 7, 2.2, 1.6, hescoMat);
    addBox(0, 2.28, -35, 7.1, 0.14, 1.65, accentRedMat, false, false);

    // Mid-Field Supply Containers & HESCO Sandbags
    addBox(-18, 1.5, -20, 7, 3.0, 3.0, crateMat);
    addBox(18, 1.5, -20, 7, 3.0, 3.0, crateMat);
    addBox(-18, 1.5, 20, 7, 3.0, 3.0, crateMat);
    addBox(18, 1.5, 20, 7, 3.0, 3.0, crateMat);

    const pickups = spawnPickups([
      { id: 'med-west-tower', type: 'health', x: -30, y: towerY, z: 0 },
      { id: 'med-east-tower', type: 'health', x: 30, y: towerY, z: 0 },
      { id: 'ammo-center-n', type: 'ammo', x: 0, y: 0, z: -7 },
      { id: 'ammo-center-s', type: 'ammo', x: 0, y: 0, z: 7 },
    ]);

    return {
      mapId,
      rootGroup,
      atmosphere,
      colliders,
      ramps,
      staticRayMeshes,
      blueSpawns: [
        new THREE.Vector3(-9, 0, 40),
        new THREE.Vector3(0, 0, 40.5),
        new THREE.Vector3(9, 0, 40),
        new THREE.Vector3(-21, 0, 39),
        new THREE.Vector3(21, 0, 39),
      ],
      redSpawns: [
        new THREE.Vector3(-9, 0, -40),
        new THREE.Vector3(0, 0, -40.5),
        new THREE.Vector3(9, 0, -40),
        new THREE.Vector3(-21, 0, -39),
        new THREE.Vector3(21, 0, -39),
      ],
      waypoints: [
        new THREE.Vector3(-34, 0, 28),
        new THREE.Vector3(-12, 0, 26),
        new THREE.Vector3(12, 0, 26),
        new THREE.Vector3(34, 0, 28),
        new THREE.Vector3(-30, towerY, 0),
        new THREE.Vector3(-14, 0, 0),
        new THREE.Vector3(14, 0, 0),
        new THREE.Vector3(30, towerY, 0),
        new THREE.Vector3(0, 0, 14),
        new THREE.Vector3(0, 0, -14),
        new THREE.Vector3(-34, 0, -28),
        new THREE.Vector3(-12, 0, -26),
        new THREE.Vector3(12, 0, -26),
        new THREE.Vector3(34, 0, -28),
      ],
      pickups,
      halfSize,
      disposables: { geometries, materials, textures },
    };
  }

  // =========================================================================
  // MAP 3: CRYO BUNKER (Subterranean CQB Facility, 68x68m)
  // =========================================================================
  const halfSize = 34;
  const atmosphere: ArenaAtmosphere = {
    bgColor: 0x0b121e,
    fogColor: 0x0d1624,
    fogDensity: 0.013,
    sunColor: 0xdbeafe,
    sunIntensity: 1.9,
    sunPos: [18, 48, 16],
    hemiSky: 0x38bdf8,
    hemiGround: 0x111827,
    hemiIntensity: 1.1,
  };

  rootGroup.add(
    buildSkyDome(0x060b14, 0x0e1a2b, 0x172940, atmosphere.sunPos, [0.45, 0.72, 1.0], geometries, materials)
  );

  const bunkerFloor = createBunkerFloorTextures(maxAnisotropy);
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

  const outerGround = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(400, 400)), outerGroundMat);
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
  const wallH = 8.0;
  const wallT = 2.0;
  addBox(0, wallH / 2, -halfSize - wallT / 2, halfSize * 2 + wallT * 2, wallH, wallT, wallMat);
  addBox(0, wallH / 2, halfSize + wallT / 2, halfSize * 2 + wallT * 2, wallH, wallT, wallMat);
  addBox(-halfSize - wallT / 2, wallH / 2, 0, wallT, wallH, halfSize * 2, wallMat);
  addBox(halfSize + wallT / 2, wallH / 2, 0, wallT, wallH, halfSize * 2, wallMat);

  // Overhead Industrial Ceiling Girders & Light Strips (non-colliding high architecture)
  for (const gz of [-20, 0, 20]) {
    addBox(0, 8.2, gz, halfSize * 2, 0.8, 1.2, darkMetalMat, false, false);
    addBox(0, 7.75, gz, 46, 0.14, 0.45, cyanNeonMat, false, false);
  }

  // Central Elevated Reactor Ring Platform (y = 2.4m) with 4 Ramps (N/S/E/W)
  const platY = 2.4;
  addBox(0, platY - 0.25, 0, 14, 0.5, 14, deckMat, true);
  // Central Glowing Cryo Core Pillar
  const core = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(1.6, 1.8, 7.6, 16)), darkMetalMat);
  core.position.set(0, 3.8, 0);
  core.castShadow = true;
  rootGroup.add(core);
  staticRayMeshes.push(core);
  colliders.push({ minX: -1.8, maxX: 1.8, minY: 0, maxY: 7.6, minZ: -1.8, maxZ: 1.8 });

  const coreRing = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(1.88, 1.88, 0.35, 16)), cyanNeonMat);
  coreRing.position.set(0, platY + 1.6, 0);
  rootGroup.add(coreRing);

  buildRamp(-14, -7, 0, 4.4, 0, platY, deckMat);
  buildRamp(14, 7, 0, 4.4, 0, platY, deckMat);
  buildZRamp(0, 4.4, -14, -7, 0, platY, deckMat);
  buildZRamp(0, 4.4, 14, 7, 0, platY, deckMat);

  // CQB Containment Server Racks & Corridor Partitions
  for (const [rx, rz, rw, rd] of [
    [-19, -15, 3.2, 8.5],
    [19, -15, 3.2, 8.5],
    [-19, 15, 3.2, 8.5],
    [19, 15, 3.2, 8.5],
    [-26, 0, 5.5, 2.8],
    [26, 0, 5.5, 2.8],
    [-10, 22, 6.5, 2.2],
    [10, 22, 6.5, 2.2],
    [-10, -22, 6.5, 2.2],
    [10, -22, 6.5, 2.2],
  ]) {
    addBox(rx, 1.65, rz, rw, 3.3, rd, rackMat);
  }

  // Team Spawn Base Shields
  addBox(0, 1.1, 26, 5.5, 2.2, 1.4, darkMetalMat);
  addBox(0, 2.25, 26, 5.6, 0.14, 1.45, accentBlueMat, false, false);

  addBox(0, 1.1, -26, 5.5, 2.2, 1.4, darkMetalMat);
  addBox(0, 2.25, -26, 5.6, 0.14, 1.45, accentRedMat, false, false);

  const pickups = spawnPickups([
    { id: 'med-west', type: 'health', x: -24, y: 0, z: 0 },
    { id: 'med-east', type: 'health', x: 24, y: 0, z: 0 },
    { id: 'ammo-north', type: 'ammo', x: 0, y: platY, z: -4.5 },
    { id: 'ammo-south', type: 'ammo', x: 0, y: platY, z: 4.5 },
  ]);

  return {
    mapId,
    rootGroup,
    atmosphere,
    colliders,
    ramps,
    staticRayMeshes,
    blueSpawns: [
      new THREE.Vector3(-7, 0, 30),
      new THREE.Vector3(0, 0, 30.5),
      new THREE.Vector3(7, 0, 30),
      new THREE.Vector3(-16, 0, 29),
      new THREE.Vector3(16, 0, 29),
    ],
    redSpawns: [
      new THREE.Vector3(-7, 0, -30),
      new THREE.Vector3(0, 0, -30.5),
      new THREE.Vector3(7, 0, -30),
      new THREE.Vector3(-16, 0, -29),
      new THREE.Vector3(16, 0, -29),
    ],
    waypoints: [
      new THREE.Vector3(-26, 0, 22),
      new THREE.Vector3(0, 0, 20),
      new THREE.Vector3(26, 0, 22),
      new THREE.Vector3(-25, 0, 9),
      new THREE.Vector3(-14, 0, 10),
      new THREE.Vector3(14, 0, 10),
      new THREE.Vector3(25, 0, 9),
      new THREE.Vector3(-16, 0, 0),
      new THREE.Vector3(-4.5, platY, 0),
      new THREE.Vector3(4.5, platY, 0),
      new THREE.Vector3(16, 0, 0),
      new THREE.Vector3(-25, 0, -9),
      new THREE.Vector3(-14, 0, -10),
      new THREE.Vector3(14, 0, -10),
      new THREE.Vector3(25, 0, -9),
      new THREE.Vector3(-26, 0, -22),
      new THREE.Vector3(0, 0, -20),
      new THREE.Vector3(26, 0, -22),
    ],
    pickups,
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
