import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  AmmoBeltNode,
  ArenaData,
  BoxCollider,
  createTacticalArena,
  DestructibleWallNode,
  ExplosiveBarrelNode,
  groundHeightAt,
  HangarNode,
  MAPS,
  MountedMgNode,
  resolveHorizontalCollision,
  VehicleNode,
} from './arena';
import { soundEngine } from './audio';
import { buildCombatantRig, CombatantRig } from './botModel';
import {
  JoinedRoomInfo,
  MultiplayerClient,
  RemoteAirstrikeMsg,
  RemoteBarrelDamageMsg,
  RemoteBeltPickupMsg,
  RemoteDamageMsg,
  RemoteFireMsg,
  RemoteGrenadeMsg,
  RemoteMountDestroyMsg,
  RemoteMountRepairMsg,
  RemoteTrenchDigMsg,
  RemoteWallDamageMsg,
  RoomSnapshotMsg,
} from './multiplayer';
import {
  createBulletHoleTexture,
  createExplosionCraterTexture,
  createSoftGlowTexture,
  createTrenchEarthTextures,
  createWallCrackTextures,
  createWallScorchTexture,
} from './textures';
import {
  ArenaZoneInfo,
  DamageDirectionIndicator,
  Difficulty,
  GamePhase,
  GunGameHudState,
  HudSnapshot,
  KillFeedItem,
  LoadoutSlots,
  LockOnHudState,
  MapId,
  MatchConfig,
  RadarBlip,
  ScoreboardEntry,
  TeamId,
  WeaponId,
  WeaponRuntimeState,
} from './types';
import { buildWeaponViewmodel, ViewmodelHandle, WEAPON_ORDER, WEAPONS } from './weapons';

export const GUN_GAME_LADDER: WeaponId[] = [
  'glock19',
  'deagle50',
  'mp5',
  'p90',
  'vector45',
  'm870',
  'aa12',
  'famas_f1',
  'm4a1',
  'akm',
  'rpk74',
  'mg42',
  'scar_h',
  'svd_dragunov',
  'm24',
  'awm',
  'rpg7',
  'usp45',
];

const BLUE_CALLSIGNS = [
  'Vanguard-1',
  'Falcon',
  'Kestrel',
  'Titan',
  'Specter',
  'Nomad',
  'Valkyrie',
  'Paladin',
  'Hawkeye',
  'Sentinel',
];
const RED_CALLSIGNS = [
  'Viper',
  'Ravager',
  'Onyx',
  'Phantom',
  'Striker',
  'Reaper',
  'Cobra',
  'Wraith',
  'Jackal',
  'Scorpion',
];

const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();
const _vecC = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _euler = new THREE.Euler(0, 0, 0, 'YXZ');

interface BallisticBullet {
  pos: THREE.Vector3;
  visualPos: THREE.Vector3;
  vel: THREE.Vector3;
  damage: number;
  headshotMult: number;
  maxRange: number;
  traveled: number;
  gravityScale: number;
  attackerId: string;
  team: TeamId;
  weaponShort: string;
  mesh: THREE.Group;
  whizzed: boolean;
  splashRadius?: number;
}

interface RocketProjectile {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  speed: number;
  attackerId: string;
  team: TeamId;
  life: number;
  age: number;
  smokeAccum: number;
  mesh: THREE.Group;
  blastRadius: number;
  maxDamage: number;
  weaponShort: string;
  guidance: 'none' | 'lock_on' | 'laser_guided';
  gravityScale: number;
  targetVehicleId: string | null;
  targetActorId: string | null;
  targetJetId: string | null;
  isTopAttack: boolean;
}

interface FragGrenade {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rotVel: THREE.Vector3;
  attackerId: string;
  team: TeamId;
  fuse: number;
  smokeAccum: number;
  mesh: THREE.Group;
  ledMat: THREE.MeshBasicMaterial;
}

interface AirstrikeJet {
  id: string;
  team: TeamId;
  group: THREE.Group;
  hitMeshes: THREE.Mesh[];
  offsetX: number;
  offsetZ: number;
  position: THREE.Vector3;
  hp: number;
  maxHp: number;
  destroyed: boolean;
  crashing: boolean;
  crashVel: THREE.Vector3;
  crashSpin: THREE.Vector3;
  crashTimer: number;
  smokeAccum: number;
}

interface ActiveAirstrike {
  attackerId: string;
  team: TeamId;
  target: THREE.Vector3;
  dir: THREE.Vector3;
  elapsed: number;
  bombsDropped: number;
  beaconGroup: THREE.Group;
  jets: AirstrikeJet[];
  interceptedAnnounced?: boolean;
}

interface SmokePuff {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  startScale: number;
  endScale: number;
}

interface ExplosionWave {
  fireball: THREE.Mesh;
  ring: THREE.Mesh;
  life: number;
  maxLife: number;
  radius: number;
}

interface SparkEffect {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
}

interface ShellCasingEffect {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  rotVel: THREE.Vector3;
  life: number;
}

interface DebrisChunkEffect {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  rotVel: THREE.Vector3;
  life: number;
}

interface DugTrenchNode {
  id: string;
  position: THREE.Vector3;
  yaw: number;
  group: THREE.Group;
  colliders: BoxCollider[];
  rayMeshes: THREE.Mesh[];
}

interface CombatantActor {
  id: string;
  name: string;
  team: TeamId;
  isPlayer: boolean;
  isHuman: boolean;
  weaponId: WeaponId;
  position: THREE.Vector3;
  targetNetPos?: THREE.Vector3;
  targetNetYaw?: number;
  velocity: THREE.Vector3;
  yaw: number;
  pitch: number;
  health: number;
  maxHealth: number;
  alive: boolean;
  respawnTimer: number;
  spawnShieldTimer: number;
  kills: number;
  deaths: number;
  assists: number;
  gunGameTier: number;
  lastDamagedBy: Record<string, number>;
  rig?: CombatantRig;
  waypointIdx: number;
  strafeDir: number;
  strafeTimer: number;
  fireCooldown: number;
  grenadeCooldown: number;
  reactionTimer: number;
  losTimer: number;
  targetEnemyId: string | null;
  deathAnimTimer: number;
  walkCycle: number;
  vehicleId?: string | null;
  vehicleSeat?: number | null;
}

export class FpsEngine {
  private container: HTMLElement;
  private onHudUpdate: (snapshot: HudSnapshot) => void;

  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean;
  private arena!: ArenaData;
  private hemiLight: THREE.HemisphereLight;
  private sunLight: THREE.DirectionalLight;
  private muzzleLight: THREE.PointLight;
  private explosionLight: THREE.PointLight;
  private explosionLightTimer = 0;

  // Lazy Viewmodel Cache for all 50 weapons
  private weaponPivot: THREE.Group;
  private viewmodels = new Map<WeaponId, ViewmodelHandle>();
  private loadout: LoadoutSlots = ['m4a1', 'deagle50', 'fgm148_javelin'];
  private activeSlot: 0 | 1 | 2 = 0;
  private lastSlot: 0 | 1 | 2 = 1;
  private activeWeapon: WeaponId = 'm4a1';
  private weaponStates: Record<WeaponId, WeaponRuntimeState>;

  // Multiplayer Client
  private mpClient = new MultiplayerClient();
  private mpConnected = false;
  private mpHumanCount = 1;
  private netSendAccum = 0;

  // Loop & timing
  private frameId = 0;
  private disposed = false;
  private lastTime = performance.now();
  private hudEmitAccum = 0;
  private lobbyInspecting = false;
  private lobbyCameraMode: 'orbit' | 'overview' | 'zone_a' | 'zone_b' | 'zone_c' | 'arsenal' = 'orbit';
  private lobbyYaw = 0.65;
  private lobbyPitch = 0.46;
  private lobbyZoom = 1.0;
  private lobbyCurrentCamPos = new THREE.Vector3(120, 62, 120);
  private lobbyCurrentLook = new THREE.Vector3(0, 3, 0);

  // Match state
  private phase: GamePhase = 'lobby';
  private config: MatchConfig;
  private blueScore = 0;
  private redScore = 0;
  private timeRemaining = 360;
  private winner: TeamId | 'draw' | null = null;
  private winnerName: string | null = null;
  private killFeed: KillFeedItem[] = [];
  private killFeedSeq = 1;
  private damageIndicators: DamageDirectionIndicator[] = [];
  private dmgSeq = 1;
  private pickupNotice: string | null = null;
  private pickupNoticeTimer = 0;

  // Player state
  private player!: CombatantActor;
  private actors: CombatantActor[] = [];
  private stamina = 100;
  private grounded = true;
  private isAds = false;
  private isSteadyAim = false;
  private adsToggle = false;
  private scopeZoomLevel: 1 | 2 = 1;
  private isReloading = false;
  private reloadTimer = 0;
  private fireCooldown = 0;
  private semiTriggerReleased = true;
  private muzzleFlashTimer = 0;
  private recoilOffsetPitch = 0;
  private recoilOffsetYaw = 0;
  private weaponKickZ = 0;
  private weaponKickRotX = 0;
  private boltKick = 0;
  private walkBobPhase = 0;
  private footstepTimer = 0;
  private pumpAnimTimer = 0;
  private cameraShake = 0;

  // Arsenal Armory State
  private nearArsenalName: string | null = null;
  private arsenalOpen = false;

  // Kill Streaks & Air Strike
  private streakCurrent = 0;
  private streakBest = 0;
  private uavActiveTimer = 0;
  private airstrikeCharges = 1;
  private streakBanner: string | null = null;
  private streakBannerTimer = 0;
  private airstrikes: ActiveAirstrike[] = [];
  private jetSeq = 1;

  // Lock-on State
  private lockCandidateId: string | null = null;
  private lockCandidateName: string | null = null;
  private lockCandidateKind: 'vehicle' | 'actor' | 'jet' | null = null;
  private lockProgress = 0;
  private lockTickAccum = 0;
  private lockCompleteCuePlayed = false;

  // Grenade, Mounted Emplacements & Vehicle state
  private grenades = 2;
  private readonly maxGrenades = 3;
  private isCookingGrenade = false;
  private grenadeCookTimer = 0;
  private activeMountedMg: MountedMgNode | null = null;
  private nearMountedMg: MountedMgNode | null = null;
  private nearDestroyedMg: MountedMgNode | null = null;
  private repairingMg: MountedMgNode | null = null;
  private repairTimer = 0;
  private readonly repairDuration = 2.2;
  private repairSparkAccum = 0;
  private mgReloading = false;
  private mgReloadTimer = 0;
  private mgReloadDuration = 2.1;
  private carriedBelts = 1;
  private readonly maxCarriedBelts = 4;
  private isDiggingTrench = false;
  private digTrenchTimer = 0;
  private readonly digTrenchDuration = 1.15;
  private digDustAccum = 0;
  private dugTrenches: DugTrenchNode[] = [];
  private readonly maxTrenches = 16;
  private trenchSeq = 1;
  private hmgFlashTimer = 0;
  private activeVehicle: VehicleNode | null = null;
  private activeVehicleSeat = 0;
  private nearVehicle: VehicleNode | null = null;
  private vehicleFlashTimer = 0;
  private vehicleDustAccum = 0;
  private vehicleSmokeAccum = 0;
  private vehicleCamDist = 8.8;
  private vehicleCoaxCooldowns = new Map<string, number>();
  private barrelParticleAccum = 0;
  private wallRamCooldowns = new Map<string, number>();
  private nearHangar: HangarNode | null = null;
  private hangarServiceCooldown = 0;
  private sunBaseOffset = new THREE.Vector3(85, 82, 48);

  private hitmarkerType: 'none' | 'body' | 'head' | 'kill' = 'none';
  private hitmarkerTime = 0;
  private lastEliminatedName: string | null = null;
  private lastEliminatedHeadshot = false;
  private pointerLocked = false;
  private isTouchDevice = false;

  // Input state
  private keys: Record<string, boolean> = {};
  private mouseDownLeft = false;
  private mouseDownRight = false;
  private touchFireDown = false;
  private touchMoveX = 0;
  private touchMoveY = 0;
  private touchSprint = false;
  private touchBrakeDown = false;
  private touchHeliAscend = false;
  private touchHeliDescend = false;

  // Shared raycaster & FX pools
  private raycaster = new THREE.Raycaster();
  private bullets: BallisticBullet[] = [];
  private rockets: RocketProjectile[] = [];
  private activeGrenades: FragGrenade[] = [];
  private smokePuffs: SmokePuff[] = [];
  private explosions: ExplosionWave[] = [];
  private sparks: SparkEffect[] = [];
  private shells: ShellCasingEffect[] = [];
  private debrisChunks: DebrisChunkEffect[] = [];
  private bulletHoles: THREE.Mesh[] = [];
  private blastCraters: THREE.Group[] = [];
  private wallScorches: THREE.Mesh[] = [];

  private sparkGeo = new THREE.BoxGeometry(0.065, 0.065, 0.065);
  private debrisGeo = new THREE.DodecahedronGeometry(0.18, 0);
  private bulletCoreGeo = new THREE.ConeGeometry(0.016, 0.09, 6);
  private tracerTailGeo = new THREE.CylinderGeometry(0.008, 0.015, 1.45, 6);
  private smokeGeo = new THREE.DodecahedronGeometry(0.32, 1);
  private fireballGeo = new THREE.SphereGeometry(1, 14, 10);
  private shockRingGeo = new THREE.RingGeometry(0.65, 1.0, 24);
  private holeGeo = new THREE.PlaneGeometry(0.18, 0.18);
  private shellGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.036, 6);
  private craterDecalGeo = new THREE.PlaneGeometry(1, 1);
  private craterRimGeo = new THREE.TorusGeometry(0.42, 0.085, 6, 16);
  private craterRubbleGeo = new THREE.DodecahedronGeometry(0.11, 0);

  private bulletHoleTex: THREE.CanvasTexture;
  private craterTex: THREE.CanvasTexture;
  private wallScorchTex: THREE.CanvasTexture;
  private blastGlowTex: THREE.CanvasTexture;
  private wallStage1Tex: THREE.CanvasTexture;
  private wallStage2Tex: THREE.CanvasTexture;
  private bulletHoleMat: THREE.MeshBasicMaterial;
  private craterDecalMat: THREE.MeshBasicMaterial;
  private craterRimMat = new THREE.MeshStandardMaterial({
    color: 0x2b2723,
    roughness: 0.96,
    metalness: 0.04,
  });
  private wallScorchMat: THREE.MeshBasicMaterial;
  private concreteDebrisMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.9,
    metalness: 0.12,
  });
  private sandstoneDebrisMat = new THREE.MeshStandardMaterial({
    color: 0xb0895c,
    roughness: 0.92,
    metalness: 0.05,
  });
  private steelDebrisMat = new THREE.MeshStandardMaterial({
    color: 0x3f4754,
    roughness: 0.55,
    metalness: 0.65,
  });
  private brassMat = new THREE.MeshStandardMaterial({
    color: 0xd9a441,
    metalness: 0.92,
    roughness: 0.22,
  });
  private oliveGrenadeMat = new THREE.MeshStandardMaterial({
    color: 0x3f4f32,
    metalness: 0.28,
    roughness: 0.62,
  });
  private jetMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.78,
    roughness: 0.28,
  });
  private trenchEarthTex: { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture };
  private trenchEarthMat: THREE.MeshStandardMaterial;
  private trenchPitMat = new THREE.MeshStandardMaterial({
    color: 0x1b1510,
    roughness: 0.98,
    metalness: 0.0,
  });
  private trenchTimberMat = new THREE.MeshStandardMaterial({
    color: 0x5c4028,
    roughness: 0.88,
    metalness: 0.04,
  });
  private trenchSandbagMat = new THREE.MeshStandardMaterial({
    color: 0x8b7d62,
    roughness: 0.92,
    metalness: 0.03,
  });

  constructor(
    container: HTMLElement,
    initialConfig: MatchConfig,
    onHudUpdate: (snapshot: HudSnapshot) => void
  ) {
    this.container = container;
    this.config = { ...initialConfig };
    this.onHudUpdate = onHudUpdate;
    soundEngine.setMuted(this.config.muted);

    this.loadout = [
      this.config.startingWeapon || 'm4a1',
      this.config.startingSecondary || 'deagle50',
      this.config.startingHeavy || 'fgm148_javelin',
    ];
    this.activeWeapon = this.loadout[0];

    this.isSoftwareGl = (() => {
      try {
        const probeCanvas = document.createElement('canvas');
        const gl = probeCanvas.getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const coarsePointer =
      typeof window !== 'undefined' &&
      (window.matchMedia?.('(pointer: coarse)').matches ||
        ('ontouchstart' in window && Math.min(window.innerWidth, window.innerHeight) <= 1024));
    this.isTouchDevice = Boolean(coarsePointer);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, this.isTouchDevice ? 1.5 : 2)
    );
    this.renderer.setSize(
      container.clientWidth || window.innerWidth,
      container.clientHeight || window.innerHeight
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x242329);
    this.scene.fog = new THREE.FogExp2(0x1f242e, 0.0036);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x262930, 0.95);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffdfba, 2.35);
    this.sunLight.position.set(85, 82, 48);
    if (!this.isSoftwareGl) {
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.width = 2048;
      this.sunLight.shadow.mapSize.height = 2048;
      this.sunLight.shadow.camera.near = 5;
      this.sunLight.shadow.camera.far = 480;
      this.sunLight.shadow.camera.left = -135;
      this.sunLight.shadow.camera.right = 135;
      this.sunLight.shadow.camera.top = 135;
      this.sunLight.shadow.camera.bottom = -135;
      this.sunLight.shadow.bias = -0.0005;
      this.sunLight.shadow.normalBias = 0.02;
      this.sunLight.shadow.radius = 2.4;
    }
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 0.65);
    rimLight.position.set(-60, 38, -54);
    this.scene.add(rimLight);

    this.explosionLight = new THREE.PointLight(0xff7b24, 0, 34, 2);
    this.scene.add(this.explosionLight);

    const aspect =
      (container.clientWidth || window.innerWidth) /
      (container.clientHeight || window.innerHeight);
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.08, 6200);
    this.camera.rotation.order = 'YXZ';
    this.scene.add(this.camera);

    this.weaponPivot = new THREE.Group();
    this.camera.add(this.weaponPivot);

    this.muzzleLight = new THREE.PointLight(0xfbbf24, 0, 14, 2);
    this.muzzleLight.position.set(0.2, -0.1, -1.0);
    this.camera.add(this.muzzleLight);

    this.bulletHoleTex = createBulletHoleTexture();
    this.craterTex = createExplosionCraterTexture();
    this.wallScorchTex = createWallScorchTexture();
    const crackTex = createWallCrackTextures();
    this.wallStage1Tex = crackTex.stage1;
    this.wallStage2Tex = crackTex.stage2;
    this.blastGlowTex = createSoftGlowTexture(
      'rgba(255, 245, 210, 1)',
      'rgba(255, 110, 30, 0.65)',
      'rgba(255, 50, 10, 0)'
    );
    this.bulletHoleMat = new THREE.MeshBasicMaterial({
      map: this.bulletHoleTex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    this.craterDecalMat = new THREE.MeshBasicMaterial({
      map: this.craterTex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    });
    this.wallScorchMat = new THREE.MeshBasicMaterial({
      map: this.wallScorchTex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    this.trenchEarthTex = createTrenchEarthTextures(
      Math.min(8, this.renderer.capabilities.getMaxAnisotropy())
    );
    this.trenchEarthMat = new THREE.MeshStandardMaterial({
      map: this.trenchEarthTex.map,
      bumpMap: this.trenchEarthTex.bumpMap,
      bumpScale: 0.045,
      roughness: 0.94,
      metalness: 0.02,
    });

    this.bulletCoreGeo.rotateX(Math.PI / 2);
    this.tracerTailGeo.rotateX(Math.PI / 2);
    this.shellGeo.rotateX(Math.PI / 2);
    this.craterRimGeo.rotateX(Math.PI / 2);

    this.weaponPivot.visible = false;

    this.loadArena(this.config.mapId || 'yard');
    this.weaponStates = this.createFreshWeaponStates();
    this.setupMatchActors();
    this.setupMultiplayerHandlers();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.emitHud();
    this.scheduleNextFrame();
  }

  private getOrCreateViewmodel(id: WeaponId): ViewmodelHandle {
    let vm = this.viewmodels.get(id);
    if (!vm) {
      vm = buildWeaponViewmodel(id);
      vm.root.visible = false;
      this.weaponPivot.add(vm.root);
      this.viewmodels.set(id, vm);
    }
    return vm;
  }

  private isFfaLike(): boolean {
    return this.config.matchMode === 'ffa' || this.config.matchMode === 'gun_game';
  }

  private promoteGunGameActor(actor: CombatantActor): boolean {
    if (this.config.matchMode !== 'gun_game') return false;
    actor.gunGameTier += 1;
    if (actor.gunGameTier >= GUN_GAME_LADDER.length) {
      return true;
    }
    const nextWid = GUN_GAME_LADDER[actor.gunGameTier];
    actor.weaponId = nextWid;
    if (actor.isPlayer) {
      this.loadout = [nextWid, nextWid, nextWid];
      this.weaponStates[nextWid] = {
        id: nextWid,
        mag: WEAPONS[nextWid].magSize,
        reserve: WEAPONS[nextWid].reserveMax,
      };
      this.selectSlot(0, true);
      this.weaponKickZ = 0.08;
      this.weaponKickRotX = -0.18;
      soundEngine.playStreakCue(2);
      this.streakBanner = `TIER ${actor.gunGameTier + 1}/${GUN_GAME_LADDER.length} · ${WEAPONS[nextWid].name.toUpperCase()}`;
      this.streakBannerTimer = 3.2;
    }
    return false;
  }

  private setupMultiplayerHandlers() {
    this.mpClient.setCallbacks({
      onConnectionChange: (connected) => {
        this.mpConnected = connected;
        this.emitHud();
      },
      onJoined: (info: JoinedRoomInfo) => {
        this.mpConnected = true;
        const mapChanged = this.arena.mapId !== info.mapId;
        const rulesChanged =
          this.config.matchMode !== info.matchMode ||
          this.config.teamSize !== info.teamSize ||
          this.config.botFill !== info.botFill;
        this.config.mapId = info.mapId;
        this.config.matchMode = info.matchMode;
        this.config.teamSize = info.teamSize;
        this.config.scoreLimit = info.scoreLimit;
        this.config.botFill = info.botFill;

        if (mapChanged) {
          this.loadArena(info.mapId);
          this.resetMountedMgs();
          this.resetVehicles();
          this.resetDestructibles();
        }
        if (mapChanged || rulesChanged) {
          this.setupMatchActors();
        }
        if (info.matchMode === 'gun_game' && this.player) {
          const w0 = GUN_GAME_LADDER[0];
          this.loadout = [w0, w0, w0];
          this.player.gunGameTier = 0;
          this.player.weaponId = w0;
          this.weaponStates[w0] = {
            id: w0,
            mag: WEAPONS[w0].magSize,
            reserve: WEAPONS[w0].reserveMax,
          };
          this.selectSlot(0, true);
        }
        this.emitHud();
      },
      onSnapshot: (snap) => this.handleMultiplayerSnapshot(snap),
      onRemoteFire: (msg) => this.handleRemoteFire(msg),
      onRemoteDamage: (msg) => this.handleRemoteDamage(msg),
      onRemoteAirstrike: (msg) => this.handleRemoteAirstrike(msg),
      onRemoteGrenade: (msg) => this.handleRemoteGrenade(msg),
      onRemoteWallDamage: (msg) => this.handleRemoteWallDamage(msg),
      onRemoteBarrelDamage: (msg) => this.handleRemoteBarrelDamage(msg),
      onRemoteMountDestroy: (msg) => this.handleRemoteMountDestroy(msg),
      onRemoteMountRepair: (msg) => this.handleRemoteMountRepair(msg),
      onRemoteBeltPickup: (msg) => this.handleRemoteBeltPickup(msg),
      onRemoteTrenchDig: (msg) => this.handleRemoteTrenchDig(msg),
    });
  }

  private handleMultiplayerSnapshot(snap: RoomSnapshotMsg) {
    if (this.config.mode !== 'multiplayer' || this.phase !== 'playing') return;

    this.blueScore = snap.blueScore;
    this.redScore = snap.redScore;
    this.timeRemaining = snap.timeRemaining;
    this.mpHumanCount = snap.players.length;
    const isFfa = this.isFfaLike();

    const myId = this.mpClient.playerId;
    const activeIds = new Set<string>();

    for (const rp of snap.players) {
      if (rp.id === myId) {
        if (this.player && this.config.matchMode === 'gun_game' && (rp.gunGameTier ?? 0) > this.player.gunGameTier) {
          this.player.gunGameTier = rp.gunGameTier ?? 0;
        }
        continue;
      }
      const actorId = `hum-${rp.id}`;
      activeIds.add(actorId);

      let actor = this.actors.find((a) => a.id === actorId);
      if (!actor) {
        const rig = buildCombatantRig(actorId, rp.team, rp.weaponId, rp.username, true, isFfa);
        rig.root.position.set(rp.x, rp.y, rp.z);
        this.scene.add(rig.root);
        actor = {
          id: actorId,
          name: rp.username,
          team: rp.team,
          isPlayer: false,
          isHuman: true,
          weaponId: rp.weaponId,
          position: new THREE.Vector3(rp.x, rp.y, rp.z),
          targetNetPos: new THREE.Vector3(rp.x, rp.y, rp.z),
          targetNetYaw: rp.yaw,
          velocity: new THREE.Vector3(rp.vx, 0, rp.vz),
          yaw: rp.yaw,
          pitch: rp.pitch,
          health: rp.health,
          maxHealth: 100,
          alive: rp.alive,
          respawnTimer: 0,
          spawnShieldTimer: 0,
          kills: rp.kills,
          deaths: rp.deaths,
          assists: 0,
          gunGameTier: rp.gunGameTier ?? 0,
          lastDamagedBy: {},
          rig,
          waypointIdx: 0,
          strafeDir: 1,
          strafeTimer: 1,
          fireCooldown: 0,
          grenadeCooldown: 0,
          reactionTimer: 0,
          losTimer: 0,
          targetEnemyId: null,
          deathAnimTimer: 0,
          walkCycle: 0,
          vehicleId: rp.vehicleId,
          vehicleSeat: rp.vehicleSeat,
        };
        this.actors.push(actor);
      } else {
        actor.name = rp.username;
        actor.team = rp.team;
        actor.weaponId = rp.weaponId;
        actor.health = rp.health;
        actor.alive = rp.alive;
        actor.kills = rp.kills;
        actor.deaths = rp.deaths;
        actor.gunGameTier = rp.gunGameTier ?? actor.gunGameTier;
        actor.vehicleId = rp.vehicleId;
        actor.vehicleSeat = rp.vehicleSeat;
        actor.velocity.set(rp.vx, 0, rp.vz);
        if (!actor.targetNetPos) actor.targetNetPos = new THREE.Vector3();
        actor.targetNetPos.set(rp.x, rp.y, rp.z);
        actor.targetNetYaw = rp.yaw;
        if (actor.rig) {
          actor.rig.root.visible = rp.alive;
        }
      }
    }

    // Remove disconnected human actors
    for (let i = this.actors.length - 1; i >= 0; i--) {
      const a = this.actors[i];
      if (a.isHuman && !a.isPlayer && !activeIds.has(a.id)) {
        if (a.rig) this.scene.remove(a.rig.root);
        this.actors.splice(i, 1);
      }
    }

    // Sync multi-seat vehicles from authoritative room snapshot
    if (snap.vehicles) {
      for (const rv of snap.vehicles) {
        const v = this.arena.vehicles.find((vv) => vv.id === rv.id);
        if (!v) continue;

        for (let s = 0; s < v.maxSeats; s++) {
          const netPid = rv.seats[s] ?? null;
          if (!netPid) {
            if (v.seats[s]?.startsWith('hum-') || (v.seats[s] === this.player?.id && this.activeVehicle !== v)) {
              v.seats[s] = null;
            }
          } else if (netPid === myId) {
            v.seats[s] = this.player?.id ?? null;
          } else {
            v.seats[s] = `hum-${netPid}`;
          }
        }

        const localIsDriver = this.activeVehicle === v && this.activeVehicleSeat === 0;
        const localIsGunner = this.activeVehicle === v && this.activeVehicleSeat === 1;
        if (!localIsDriver) {
          v.position.lerp(new THREE.Vector3(rv.x, rv.y, rv.z), 0.45);
          v.yaw = rv.yaw;
          v.speed = rv.speed;
          v.root.position.copy(v.position);
          v.root.rotation.y = v.yaw;
        }
        if (!localIsGunner && !(localIsDriver && v.seats[1] === null)) {
          v.turretYaw = rv.turretYaw;
          v.turretPitch = rv.turretPitch;
          v.turretGroup.rotation.y = v.turretYaw;
          v.barrelPivot.rotation.x = v.turretPitch;
        }
      }
    }

    if (snap.winnerName) {
      this.winnerName = snap.winnerName;
      this.endMatch();
    } else if (this.config.matchMode === 'tdm' && (this.blueScore >= this.config.scoreLimit || this.redScore >= this.config.scoreLimit)) {
      this.endMatch();
    } else if (this.config.matchMode === 'ffa') {
      const ffaWin = this.actors.find((a) => a.kills >= this.config.scoreLimit);
      if (ffaWin) {
        this.winnerName = ffaWin.name;
        this.endMatch();
      }
    } else if (this.config.matchMode === 'gun_game') {
      const ggWin = this.actors.find((a) => a.gunGameTier >= GUN_GAME_LADDER.length);
      if (ggWin) {
        this.winnerName = ggWin.name;
        this.endMatch();
      }
    }
  }

  private handleRemoteFire(msg: RemoteFireMsg) {
    if (this.phase !== 'playing' || msg.playerId === this.mpClient.playerId) return;
    const sender = this.actors.find((a) => a.id === `hum-${msg.playerId}`);
    if (!sender) return;

    const origin = new THREE.Vector3(msg.ox, msg.oy, msg.oz);
    const dir = new THREE.Vector3(msg.dx, msg.dy, msg.dz).normalize();
    const spec = WEAPONS[msg.weaponId] || WEAPONS.m4a1;

    const dist = this.player ? origin.distanceTo(this.player.position) : 60;
    const vol = THREE.MathUtils.clamp(1 - dist / 85, 0.06, 0.65);
    soundEngine.playGunshot(msg.weaponId, vol);

    if (msg.kind === 'rocket' || msg.kind === 'shell') {
      this.spawnRocket(
        origin,
        dir,
        sender.id,
        sender.team,
        spec.blastRadius ?? 7.0,
        spec.damage,
        spec.shortName,
        'none',
        spec.muzzleVelocity,
        spec.gravityScale,
        null,
        null,
        false
      );
    } else {
      this.spawnBallisticBullet(
        origin,
        origin,
        dir,
        spec.muzzleVelocity,
        spec.gravityScale,
        0, // Visual tracer only (attacker applies remote_damage)
        1.0,
        spec.range,
        sender.id,
        sender.team,
        spec.shortName,
        spec.tracerColor
      );
    }
  }

  private handleRemoteDamage(msg: RemoteDamageMsg) {
    if (this.phase !== 'playing') return;
    const myId = this.mpClient.playerId;

    if (msg.targetId === myId && this.player && this.player.alive) {
      this.player.health = Math.max(0, this.player.health - msg.damage);
      soundEngine.playDamageTaken();
      this.cameraShake = Math.min(0.85, this.cameraShake + msg.damage * 0.005);

      if (msg.killed || this.player.health <= 0) {
        this.player.health = 0;
        this.player.alive = false;
        this.player.deaths += 1;
        this.player.respawnTimer = 3.2;
        this.streakCurrent = 0;
        this.uavActiveTimer = 0;
        if (this.activeMountedMg) {
          this.activeMountedMg.muzzleFlash.visible = false;
          this.activeMountedMg = null;
        }
        if (this.activeVehicle) {
          this.exitVehicle(true);
        }
        this.isCookingGrenade = false;
        this.arsenalOpen = false;
      }
    }

    if (msg.killed) {
      const targetActor =
        msg.targetId === myId
          ? this.player
          : this.actors.find((a) => a.id === `hum-${msg.targetId}`);
      this.killFeed.unshift({
        id: this.killFeedSeq++,
        killerName: msg.attackerName,
        killerTeam: msg.attackerTeam,
        victimName: targetActor?.name || 'Operator',
        victimTeam: targetActor?.team || (msg.attackerTeam === 'blue' ? 'red' : 'blue'),
        weaponShort: msg.weaponShort,
        isHeadshot: msg.isHeadshot,
        timestamp: performance.now(),
      });
      if (this.killFeed.length > 5) this.killFeed.pop();
    }
  }

  private handleRemoteAirstrike(msg: RemoteAirstrikeMsg) {
    if (this.phase !== 'playing' || msg.playerId === this.mpClient.playerId) return;
    this.launchAirstrikeAt(
      new THREE.Vector3(msg.tx, msg.ty, msg.tz),
      msg.yaw,
      `hum-${msg.playerId}`,
      msg.team
    );
  }

  private handleRemoteGrenade(msg: RemoteGrenadeMsg) {
    if (this.phase !== 'playing' || msg.playerId === this.mpClient.playerId) return;
    this.spawnFragGrenade(
      new THREE.Vector3(msg.x, msg.y, msg.z),
      new THREE.Vector3(msg.vx, msg.vy, msg.vz),
      msg.fuse,
      `hum-${msg.playerId}`,
      msg.team
    );
  }

  private handleRemoteWallDamage(msg: RemoteWallDamageMsg) {
    if (this.phase !== 'playing' || msg.playerId === this.mpClient.playerId) return;
    const wall = this.arena.destructibleWalls.find((w) => w.id === msg.wallId);
    if (!wall || wall.stage >= 3) return;
    if (msg.damage > 0) {
      this.damageDestructibleWall(wall, msg.damage, wall.position, true);
    }
  }

  private handleRemoteBarrelDamage(msg: RemoteBarrelDamageMsg) {
    if (this.phase !== 'playing' || msg.playerId === this.mpClient.playerId) return;
    const barrel = this.arena.barrels.find((b) => b.id === msg.barrelId);
    if (!barrel || barrel.destroyed) return;
    if (msg.damage > 0) {
      this.damageBarrel(barrel, msg.damage, undefined, 'Fuel Barrel', true);
    }
  }

  private handleRemoteMountDestroy(msg: RemoteMountDestroyMsg) {
    if (this.phase !== 'playing' || msg.playerId === this.mpClient.playerId) return;
    const mg = this.arena.mountedMgs.find((m) => m.id === msg.mountId);
    if (!mg || mg.destroyed) return;
    this.destroyMountedMg(mg, mg.position, undefined, 'Vehicle Ram', true);
  }

  private handleRemoteMountRepair(msg: RemoteMountRepairMsg) {
    if (this.phase !== 'playing' || msg.playerId === this.mpClient.playerId) return;
    const mg = this.arena.mountedMgs.find((m) => m.id === msg.mountId);
    if (!mg || !mg.destroyed) return;
    this.completeRepairMountedMg(mg, true);
  }

  private handleRemoteBeltPickup(msg: RemoteBeltPickupMsg) {
    if (this.phase !== 'playing' || msg.playerId === this.mpClient.playerId) return;
    const belt = this.arena.beltPickups.find((b) => b.id === msg.beltId);
    if (belt && !belt.collected) {
      belt.collected = true;
      belt.meshGroup.visible = false;
    }
  }

  private handleRemoteTrenchDig(msg: RemoteTrenchDigMsg) {
    if (this.phase !== 'playing' || msg.playerId === this.mpClient.playerId) return;
    this.spawnDugTrench(new THREE.Vector3(msg.x, msg.y, msg.z), msg.yaw, true);
  }

  private loadArena(mapId: MapId) {
    this.clearDynamicEffects();
    if (this.arena) {
      this.scene.remove(this.arena.rootGroup);
      for (const g of this.arena.disposables.geometries) g.dispose();
      for (const m of this.arena.disposables.materials) m.dispose();
      for (const t of this.arena.disposables.textures) t.dispose();
    }

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.arena = createTacticalArena(this.scene, maxAniso, mapId);

    const atm = this.arena.atmosphere;
    (this.scene.background as THREE.Color).setHex(atm.bgColor);
    this.scene.fog = new THREE.FogExp2(atm.fogColor, atm.fogDensity);
    this.sunLight.color.setHex(atm.sunColor);
    this.sunLight.intensity = atm.sunIntensity;
    this.sunBaseOffset.set(...atm.sunPos);
    this.sunLight.position.copy(this.sunBaseOffset);
    this.sunLight.target.position.set(0, 0, 0);
    this.hemiLight.color.setHex(atm.hemiSky);
    this.hemiLight.groundColor.setHex(atm.hemiGround);
    this.hemiLight.intensity = atm.hemiIntensity;
  }

  private createFreshWeaponStates(): Record<WeaponId, WeaponRuntimeState> {
    const out = {} as Record<WeaponId, WeaponRuntimeState>;
    for (const id of WEAPON_ORDER) {
      out[id] = { id, mag: WEAPONS[id].magSize, reserve: WEAPONS[id].reserveMax };
    }
    return out;
  }

  private clearActorRigs() {
    for (const actor of this.actors) {
      if (actor.rig) {
        this.scene.remove(actor.rig.root);
      }
    }
    this.actors = [];
  }

  private setupMatchActors() {
    this.clearActorRigs();

    const botPool: WeaponId[] = [
      'm4a1',
      'ak74',
      'scar_l',
      'mp5',
      'p90',
      'm249_saw',
      'm870',
      'mk14',
      'svd_dragunov',
      'm24',
    ];

    const isFfa = this.isFfaLike();
    const isGunGame = this.config.matchMode === 'gun_game';
    if (isGunGame) {
      const startW = GUN_GAME_LADDER[0];
      this.loadout = [startW, startW, startW];
    }

    const playerTeam: TeamId = this.config.playerTeam || 'blue';
    const allSpawns = [...this.arena.blueSpawns, ...this.arena.redSpawns];
    const playerSpawns = isFfa ? allSpawns : playerTeam === 'blue' ? this.arena.blueSpawns : this.arena.redSpawns;
    const playerSpawn = playerSpawns[0];
    const displayName = (this.config.username || 'Vanguard-1').trim().slice(0, 18) || 'Vanguard-1';
    const playerYaw = isFfa
      ? Math.atan2(playerSpawn.x, playerSpawn.z)
      : playerTeam === 'blue'
      ? 0
      : Math.PI;

    this.player = {
      id: 'player',
      name: displayName,
      team: playerTeam,
      isPlayer: true,
      isHuman: true,
      weaponId: this.loadout[0],
      position: playerSpawn.clone(),
      velocity: new THREE.Vector3(),
      yaw: playerYaw,
      pitch: 0,
      health: 100,
      maxHealth: 100,
      alive: true,
      respawnTimer: 0,
      spawnShieldTimer: 1.5,
      kills: 0,
      deaths: 0,
      assists: 0,
      gunGameTier: 0,
      lastDamagedBy: {},
      waypointIdx: 2,
      strafeDir: 1,
      strafeTimer: 1,
      fireCooldown: 0,
      grenadeCooldown: 0,
      reactionTimer: 0,
      losTimer: 0,
      targetEnemyId: null,
      deathAnimTimer: 0,
      walkCycle: 0,
    };
    this.actors.push(this.player);

    const shouldSpawnBots = this.config.mode === 'solo' || this.config.botFill;
    const teamSize = shouldSpawnBots
      ? this.config.mode === 'multiplayer'
        ? Math.min(6, this.config.teamSize)
        : this.config.teamSize
      : 0;

    if (shouldSpawnBots && isFfa) {
      const ffaBotCount = Math.min(15, Math.max(3, teamSize * 2 - 1));
      const ffaNames = [...BLUE_CALLSIGNS.slice(1), ...RED_CALLSIGNS];
      for (let i = 0; i < ffaBotCount; i++) {
        const wid = isGunGame ? GUN_GAME_LADDER[0] : botPool[i % botPool.length];
        const spawn = allSpawns[(i * 3 + 2) % allSpawns.length].clone();
        spawn.x += ((i % 3) - 1) * 1.4;
        const callsign = ffaNames[i % ffaNames.length];
        const botTeam: TeamId = i % 2 === 0 ? 'red' : 'blue';
        const rig = buildCombatantRig(`ffa-${i}`, botTeam, wid, callsign, false, true);
        const yaw = Math.atan2(spawn.x, spawn.z);
        rig.root.position.copy(spawn);
        rig.root.rotation.y = yaw;
        this.scene.add(rig.root);
        this.actors.push({
          id: `ffa-${i}`,
          name: callsign,
          team: botTeam,
          isPlayer: false,
          isHuman: false,
          weaponId: wid,
          position: spawn,
          velocity: new THREE.Vector3(),
          yaw,
          pitch: 0,
          health: 100,
          maxHealth: 100,
          alive: true,
          respawnTimer: 0,
          spawnShieldTimer: 1.5,
          kills: 0,
          deaths: 0,
          assists: 0,
          gunGameTier: 0,
          lastDamagedBy: {},
          rig,
          waypointIdx: Math.floor(Math.random() * this.arena.waypoints.length),
          strafeDir: Math.random() > 0.5 ? 1 : -1,
          strafeTimer: 1.2 + Math.random(),
          fireCooldown: 0.4,
          grenadeCooldown: 6 + Math.random() * 8,
          reactionTimer: 0.25,
          losTimer: Math.random() * 0.14,
          targetEnemyId: null,
          deathAnimTimer: 0,
          walkCycle: Math.random() * 6,
        });
      }
    } else if (shouldSpawnBots) {
      const blueBotCount = playerTeam === 'blue' ? teamSize - 1 : teamSize;
      const redBotCount = playerTeam === 'red' ? teamSize - 1 : teamSize;

      for (let i = 0; i < blueBotCount; i++) {
        const wid = botPool[i % botPool.length];
        const spawn = this.arena.blueSpawns[(i + 1) % this.arena.blueSpawns.length];
        const callsign = BLUE_CALLSIGNS[(i + 1) % BLUE_CALLSIGNS.length];
        const rig = buildCombatantRig(`blue-${i}`, 'blue', wid, callsign, false, false);
        rig.root.position.copy(spawn);
        this.scene.add(rig.root);
        this.actors.push({
          id: `blue-${i}`,
          name: callsign,
          team: 'blue',
          isPlayer: false,
          isHuman: false,
          weaponId: wid,
          position: spawn.clone(),
          velocity: new THREE.Vector3(),
          yaw: 0,
          pitch: 0,
          health: 100,
          maxHealth: 100,
          alive: true,
          respawnTimer: 0,
          spawnShieldTimer: 1.5,
          kills: 0,
          deaths: 0,
          assists: 0,
          gunGameTier: 0,
          lastDamagedBy: {},
          rig,
          waypointIdx: Math.floor(Math.random() * this.arena.waypoints.length),
          strafeDir: Math.random() > 0.5 ? 1 : -1,
          strafeTimer: 1.2 + Math.random(),
          fireCooldown: 0.4,
          grenadeCooldown: 6 + Math.random() * 8,
          reactionTimer: 0.25,
          losTimer: Math.random() * 0.14,
          targetEnemyId: null,
          deathAnimTimer: 0,
          walkCycle: Math.random() * 6,
        });
      }

      for (let i = 0; i < redBotCount; i++) {
        const wid = botPool[(i + 3) % botPool.length];
        const spawn = this.arena.redSpawns[(i + 1) % this.arena.redSpawns.length];
        const callsign = RED_CALLSIGNS[i % RED_CALLSIGNS.length];
        const rig = buildCombatantRig(`red-${i}`, 'red', wid, callsign, false, false);
        rig.root.position.copy(spawn);
        rig.root.rotation.y = Math.PI;
        this.scene.add(rig.root);
        this.actors.push({
          id: `red-${i}`,
          name: callsign,
          team: 'red',
          isPlayer: false,
          isHuman: false,
          weaponId: wid,
          position: spawn.clone(),
          velocity: new THREE.Vector3(),
          yaw: Math.PI,
          pitch: 0,
          health: 100,
          maxHealth: 100,
          alive: true,
          respawnTimer: 0,
          spawnShieldTimer: 1.5,
          kills: 0,
          deaths: 0,
          assists: 0,
          gunGameTier: 0,
          lastDamagedBy: {},
          rig,
          waypointIdx: Math.floor(Math.random() * this.arena.waypoints.length),
          strafeDir: Math.random() > 0.5 ? 1 : -1,
          strafeTimer: 1.2 + Math.random(),
          fireCooldown: 0.4,
          grenadeCooldown: 5 + Math.random() * 7,
          reactionTimer: 0.25,
          losTimer: Math.random() * 0.14,
          targetEnemyId: null,
          deathAnimTimer: 0,
          walkCycle: Math.random() * 6,
        });
      }
    }

    this.selectSlot(0, true);
  }

  public updateConfig(next: Partial<MatchConfig>) {
    const prevMap = this.config.mapId;
    this.config = { ...this.config, ...next };
    soundEngine.setMuted(this.config.muted);

    if (next.startingWeapon) this.loadout[0] = next.startingWeapon;
    if (next.startingSecondary) this.loadout[1] = next.startingSecondary;
    if (next.startingHeavy) this.loadout[2] = next.startingHeavy;

    if (this.player && next.username) {
      this.player.name = next.username.trim().slice(0, 18) || 'Vanguard-1';
    }

    if (next.mapId && next.mapId !== prevMap && this.phase === 'lobby') {
      this.loadArena(next.mapId);
      this.setupMatchActors();
    }
    this.emitHud();
  }

  public setLobbyInspecting(inspecting: boolean) {
    this.lobbyInspecting = inspecting;
    if (!inspecting && this.lobbyCameraMode !== 'orbit') {
      this.lobbyZoom = 1.0;
    }
  }

  public setLobbyCameraPreset(
    preset: 'orbit' | 'overview' | 'zone_a' | 'zone_b' | 'zone_c' | 'arsenal'
  ) {
    this.lobbyCameraMode = preset;
    this.lobbyZoom = 1.0;
    if (preset === 'overview') {
      this.lobbyPitch = 0.72;
    } else if (preset === 'orbit') {
      this.lobbyPitch = 0.46;
    } else {
      this.lobbyPitch = 0.42;
    }
  }

  public setLobbyCameraDrag(dx: number, dy: number) {
    if (this.phase !== 'lobby' && this.phase !== 'ended') return;
    this.lobbyYaw -= dx * 0.0055;
    this.lobbyPitch = THREE.MathUtils.clamp(this.lobbyPitch + dy * 0.0042, 0.14, 1.32);
  }

  public setLobbyCameraZoom(delta: number) {
    if (this.phase !== 'lobby' && this.phase !== 'ended') return;
    this.lobbyZoom = THREE.MathUtils.clamp(this.lobbyZoom + delta * 0.0012, 0.35, 1.85);
  }

  public startNewMatch(nextConfig?: MatchConfig) {
    if (nextConfig) {
      this.config = { ...nextConfig };
      soundEngine.setMuted(this.config.muted);
    }

    this.lobbyInspecting = false;
    const isGunGame = this.config.matchMode === 'gun_game';
    this.loadout = isGunGame
      ? [GUN_GAME_LADDER[0], GUN_GAME_LADDER[0], GUN_GAME_LADDER[0]]
      : [
          this.config.startingWeapon || 'm4a1',
          this.config.startingSecondary || 'deagle50',
          this.config.startingHeavy || 'fgm148_javelin',
        ];

    if (this.arena.mapId !== this.config.mapId) {
      this.loadArena(this.config.mapId);
    }

    this.blueScore = 0;
    this.redScore = 0;
    this.timeRemaining = 360;
    this.winner = null;
    this.winnerName = null;
    this.killFeed = [];
    this.damageIndicators = [];
    this.pickupNotice = null;
    this.stamina = 100;
    this.isReloading = false;
    this.reloadTimer = 0;
    this.isAds = false;
    this.adsToggle = false;
    this.recoilOffsetPitch = 0;
    this.recoilOffsetYaw = 0;
    this.hitmarkerType = 'none';
    this.lastEliminatedName = null;
    this.grenades = 2;
    this.isCookingGrenade = false;
    this.grenadeCookTimer = 0;
    this.activeMountedMg = null;
    this.nearMountedMg = null;
    this.nearDestroyedMg = null;
    this.repairingMg = null;
    this.repairTimer = 0;
    this.mgReloading = false;
    this.mgReloadTimer = 0;
    this.carriedBelts = 1;
    this.isDiggingTrench = false;
    this.digTrenchTimer = 0;
    this.hmgFlashTimer = 0;
    this.activeVehicle = null;
    this.nearVehicle = null;
    this.nearHangar = null;
    this.hangarServiceCooldown = 0;
    this.touchHeliAscend = false;
    this.touchHeliDescend = false;
    this.vehicleFlashTimer = 0;
    this.nearArsenalName = null;
    this.arsenalOpen = false;
    this.streakCurrent = 0;
    this.streakBest = 0;
    this.uavActiveTimer = 0;
    this.airstrikeCharges = 1;
    this.streakBanner = isGunGame ? `GUN GAME · TIER 1/${GUN_GAME_LADDER.length} (${WEAPONS[GUN_GAME_LADDER[0]].shortName})` : null;
    this.streakBannerTimer = isGunGame ? 3.2 : 0;
    this.lockCandidateId = null;
    this.lockCandidateName = null;
    this.lockProgress = 0;
    this.cameraShake = 0;
    this.explosionLight.intensity = 0;
    this.explosionLightTimer = 0;

    this.clearDynamicEffects();
    this.resetMountedMgs();
    this.resetVehicles();
    this.resetDestructibles();

    for (const p of this.arena.pickups) {
      p.active = true;
      p.respawnTimer = 0;
      p.meshGroup.visible = true;
    }
    for (const b of this.arena.beltPickups) {
      b.collected = false;
      b.meshGroup.visible = true;
    }

    this.weaponStates = this.createFreshWeaponStates();
    this.setupMatchActors();

    // Prebuild the 3 carried loadout viewmodels
    for (const w of this.loadout) {
      this.getOrCreateViewmodel(w);
    }

    if (this.config.mode === 'multiplayer') {
      this.mpClient.connectAndJoin({
        roomId: (this.config.roomId || 'alpha-1').trim(),
        username: this.player.name,
        team: this.player.team,
        mapId: this.config.mapId,
        matchMode: this.config.matchMode,
        teamSize: this.config.teamSize,
        scoreLimit: this.config.scoreLimit,
        botFill: this.config.botFill,
        weaponId: this.activeWeapon,
      });
    } else {
      this.mpClient.disconnect();
      this.mpHumanCount = 1;
    }

    this.phase = 'playing';
    this.weaponPivot.visible = true;
    this.requestPointerLock();
    this.emitHud();
  }

  private resetMountedMgs() {
    this.wallRamCooldowns.clear();
    for (const mg of this.arena.mountedMgs) {
      mg.heat = 0;
      mg.overheated = false;
      mg.fireCooldown = 0;
      mg.ammo = mg.maxAmmo;
      mg.hp = mg.maxHp;
      mg.destroyed = false;
      mg.currentYaw = mg.baseYaw;
      mg.currentPitch = 0;
      mg.yawGroup.visible = true;
      mg.yawGroup.rotation.y = 0;
      mg.pitchGroup.rotation.x = 0;
      mg.recoilGroup.position.set(0, 0, 0);
      mg.muzzleFlash.visible = false;
      mg.barrelHeatMat.emissiveIntensity = 0;
      mg.wreckGroup.visible = false;
      if (mg.sandbagMesh) {
        mg.sandbagMesh.visible = true;
        if (!this.arena.staticRayMeshes.includes(mg.sandbagMesh)) {
          this.arena.staticRayMeshes.push(mg.sandbagMesh);
        }
      }
      if (mg.sandbagCollider) {
        mg.sandbagCollider.disabled = false;
      }
    }
  }

  private resetVehicles() {
    for (const v of this.arena.vehicles) {
      this.respawnVehicle(v);
    }
  }

  private resetDestructibles() {
    for (const wall of this.arena.destructibleWalls) {
      wall.hp = wall.maxHp;
      wall.stage = 0;
      wall.collider.disabled = false;
      wall.intactMesh.visible = true;
      wall.crackMesh.visible = false;
      wall.crackMat.map = this.wallStage1Tex;
      wall.crackMat.needsUpdate = true;
      wall.rubbleGroup.visible = false;
      if (!this.arena.staticRayMeshes.includes(wall.intactMesh)) {
        this.arena.staticRayMeshes.push(wall.intactMesh);
      }
    }
    for (const barrel of this.arena.barrels) {
      barrel.hp = barrel.maxHp;
      barrel.burning = false;
      barrel.destroyed = false;
      barrel.respawnTimer = 0;
      barrel.meshGroup.visible = true;
      barrel.collider.disabled = false;
    }
  }

  private respawnVehicle(v: VehicleNode) {
    v.position.copy(v.spawnPos);
    v.yaw = v.spawnYaw;
    v.speed = 0;
    v.vy = 0;
    v.rotorRpm = 0;
    v.turretYaw = 0;
    v.turretPitch = 0;
    v.health = v.maxHealth;
    v.ammo = v.maxAmmo;
    v.secondaryAmmo = v.secondaryMaxAmmo;
    v.destroyed = false;
    v.respawnTimer = 0;
    v.fireCooldown = 0;
    this.vehicleCoaxCooldowns.delete(v.id);
    for (let s = 0; s < v.seats.length; s++) {
      v.seats[s] = null;
    }
    v.root.position.copy(v.spawnPos);
    v.root.rotation.set(0, v.spawnYaw, 0);
    v.chassisGroup.rotation.set(0, 0, 0);
    v.turretGroup.rotation.y = 0;
    v.barrelPivot.rotation.x = 0;
    v.barrelRecoilGroup.position.set(0, 0, 0);
    v.muzzleFlash.visible = false;
    const baseColor =
      v.teamHint === 'blue' ? 0x2c4a70 : v.teamHint === 'red' ? 0x6b2c2a : 0x4b533b;
    v.bodyMat.color.setHex(baseColor);
  }

  public resumeMatch() {
    if (this.phase === 'paused') {
      this.phase = 'playing';
      this.weaponPivot.visible =
        !this.activeMountedMg && (!this.activeVehicle || this.activeVehicleSeat >= 2);
      this.requestPointerLock();
      this.emitHud();
    }
  }

  public pauseMatch() {
    if (this.phase === 'playing') {
      this.phase = 'paused';
      this.arsenalOpen = false;
      this.mouseDownLeft = false;
      this.mouseDownRight = false;
      this.touchFireDown = false;
      this.touchMoveX = 0;
      this.touchMoveY = 0;
      this.touchSprint = false;
      this.touchBrakeDown = false;
      this.touchHeliAscend = false;
      this.touchHeliDescend = false;
      this.isAds = false;
      this.adsToggle = false;
      this.isCookingGrenade = false;
      soundEngine.updateVehicleEngine(false, 0, false);
      soundEngine.updateHelicopterAudio(false, 0, false);
      if (document.pointerLockElement === this.renderer.domElement) {
        document.exitPointerLock();
      }
      this.emitHud();
    }
  }

  public returnToLobby() {
    this.phase = 'lobby';
    this.arsenalOpen = false;
    this.weaponPivot.visible = false;
    this.mouseDownLeft = false;
    this.mouseDownRight = false;
    this.touchFireDown = false;
    this.touchMoveX = 0;
    this.touchMoveY = 0;
    this.touchSprint = false;
    this.touchBrakeDown = false;
    this.touchHeliAscend = false;
    this.touchHeliDescend = false;
    this.isCookingGrenade = false;
    this.activeMountedMg = null;
    this.nearMountedMg = null;
    this.nearDestroyedMg = null;
    this.repairingMg = null;
    this.repairTimer = 0;
    this.mgReloading = false;
    this.mgReloadTimer = 0;
    this.isDiggingTrench = false;
    this.digTrenchTimer = 0;
    this.activeVehicle = null;
    this.activeVehicleSeat = 0;
    this.nearVehicle = null;
    this.nearHangar = null;
    soundEngine.updateVehicleEngine(false, 0, false);
    soundEngine.updateHelicopterAudio(false, 0, false);
    this.mpClient.disconnect();
    this.clearDynamicEffects();
    this.resetMountedMgs();
    this.resetVehicles();
    this.resetDestructibles();
    for (const b of this.arena.beltPickups) {
      b.collected = false;
      b.meshGroup.visible = true;
    }
    if (document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock();
    }
    this.emitHud();
  }

  private isTouchControlsActive(): boolean {
    if (this.config.touchControls === 'on') return true;
    if (this.config.touchControls === 'off') return false;
    return this.isTouchDevice;
  }

  public requestPointerLock() {
    if (this.disposed || this.arsenalOpen || this.isTouchControlsActive()) return;
    try {
      const result = this.renderer.domElement.requestPointerLock?.() as unknown as
        | Promise<void>
        | undefined;
      if (result && typeof result.catch === 'function') {
        result.catch(() => {});
      }
    } catch {
      // Ignore pointer lock rejection
    }
  }

  public equipArsenalWeapon(slotIndex: 0 | 1 | 2, weaponId: WeaponId) {
    if (!WEAPONS[weaponId]) return;
    this.loadout[slotIndex] = weaponId;
    this.weaponStates[weaponId] = {
      id: weaponId,
      mag: WEAPONS[weaponId].magSize,
      reserve: WEAPONS[weaponId].reserveMax,
    };
    this.getOrCreateViewmodel(weaponId);
    this.selectSlot(slotIndex, true);

    if (slotIndex === 0) this.config.startingWeapon = weaponId;
    if (slotIndex === 1) this.config.startingSecondary = weaponId;
    if (slotIndex === 2) this.config.startingHeavy = weaponId;

    soundEngine.playMechanicalClick(660, 0.05);
    this.emitHud();
  }

  public closeArsenal() {
    if (!this.arsenalOpen) return;
    this.arsenalOpen = false;
    // Refill carried loadout mags, reserves, grenades, and heavy mount belts on closing Arsenal
    for (const wid of this.loadout) {
      this.weaponStates[wid] = {
        id: wid,
        mag: WEAPONS[wid].magSize,
        reserve: WEAPONS[wid].reserveMax,
      };
    }
    this.grenades = this.maxGrenades;
    this.carriedBelts = this.maxCarriedBelts;
    soundEngine.playPickup();
    this.pickupNotice = 'Arsenal Loadout & Heavy Belts Resupplied';
    this.pickupNoticeTimer = 2.2;
    this.requestPointerLock();
    this.emitHud();
  }

  public refillBeltsAtArsenal() {
    if (this.phase !== 'playing') return;
    this.carriedBelts = this.maxCarriedBelts;
    soundEngine.playBeltReload();
    this.pickupNotice = `Heavy Ammo Belts Restocked (${this.carriedBelts}/${this.maxCarriedBelts})`;
    this.pickupNoticeTimer = 2.0;
    this.emitHud();
  }

  public triggerTouchDigTrench() {
    if (this.phase !== 'playing' || this.arsenalOpen) return;
    this.startDigTrench();
  }

  public selectWeaponFromUi(weaponId: WeaponId) {
    // Outside match (lobby), updates primary starting loadout slot
    if (this.phase !== 'playing') {
      this.loadout[0] = weaponId;
      this.config.startingWeapon = weaponId;
      this.selectSlot(0, true);
    }
  }

  public selectWeaponSlot(slotIndex: 0 | 1 | 2) {
    const vehicleWeaponLocked = this.activeVehicle && this.activeVehicleSeat < 2;
    if (this.phase !== 'playing' || this.arsenalOpen || this.activeMountedMg || vehicleWeaponLocked) {
      return;
    }
    this.selectSlot(slotIndex);
  }

  public setTouchMove(x: number, y: number, sprint: boolean) {
    this.touchMoveX = THREE.MathUtils.clamp(x, -1, 1);
    this.touchMoveY = THREE.MathUtils.clamp(y, -1, 1);
    this.touchSprint = sprint;
  }

  public addTouchLook(deltaX: number, deltaY: number) {
    if (this.phase !== 'playing' || !this.player.alive || this.arsenalOpen) return;
    this.applyLookDelta(deltaX * 1.45, deltaY * 1.45);
  }

  public setTouchFire(active: boolean) {
    if (this.phase !== 'playing' || this.arsenalOpen) {
      this.touchFireDown = false;
      return;
    }
    this.touchFireDown = active;
    if (!active) {
      this.semiTriggerReleased = true;
    }
  }

  public toggleTouchAds() {
    if (this.phase !== 'playing' || this.arsenalOpen) return;
    this.adsToggle = !this.adsToggle;
    this.emitHud();
  }

  public setTouchBrake(active: boolean) {
    this.touchBrakeDown = active;
  }

  public setTouchHeliClimb(ascend: boolean, descend: boolean) {
    this.touchHeliAscend = ascend;
    this.touchHeliDescend = descend;
  }

  public triggerTouchJump() {
    if (this.phase !== 'playing' || !this.player.alive || this.arsenalOpen) return;
    if (this.activeMountedMg) {
      this.toggleMountOrArsenal();
      return;
    }
    if (!this.activeVehicle && this.grounded) {
      this.player.velocity.y = 8.4;
      this.grounded = false;
      soundEngine.playMechanicalClick(190, 0.04);
    }
  }

  public triggerTouchReload() {
    if (this.phase !== 'playing' || this.arsenalOpen) return;
    if (this.activeMountedMg) {
      this.startMountedReload();
      return;
    }
    const vehicleWeaponLocked = this.activeVehicle && this.activeVehicleSeat < 2;
    if (vehicleWeaponLocked) {
      return;
    }
    this.startReload();
  }

  public triggerTouchCycleZoom() {
    const vehicleWeaponLocked = this.activeVehicle && this.activeVehicleSeat < 2;
    if (this.phase !== 'playing' || this.arsenalOpen || this.activeMountedMg || vehicleWeaponLocked) {
      return;
    }
    const spec = WEAPONS[this.activeWeapon];
    if (spec.optic === 'sniper' || spec.optic === 'acog' || spec.optic === 'thermal_lock') {
      this.scopeZoomLevel = this.scopeZoomLevel === 1 ? 2 : 1;
      soundEngine.playMechanicalClick(680, 0.035);
      this.emitHud();
    }
  }

  public triggerTouchInteract() {
    if (this.phase !== 'playing' || this.arsenalOpen) return;
    this.toggleMountOrArsenal();
  }

  public switchVehicleSeat(targetSeat?: number) {
    const v = this.activeVehicle;
    if (this.phase !== 'playing' || !this.player.alive || !v || v.maxSeats <= 1) return;

    let nextSeat = -1;
    if (targetSeat !== undefined) {
      if (targetSeat >= 0 && targetSeat < v.maxSeats && (v.seats[targetSeat] === null || targetSeat === this.activeVehicleSeat)) {
        nextSeat = targetSeat;
      }
    } else {
      for (let offset = 1; offset < v.maxSeats; offset++) {
        const candidate = (this.activeVehicleSeat + offset) % v.maxSeats;
        if (v.seats[candidate] === null) {
          nextSeat = candidate;
          break;
        }
      }
    }

    if (nextSeat === -1 || nextSeat === this.activeVehicleSeat) {
      soundEngine.playMechanicalClick(220, 0.04);
      return;
    }

    v.seats[this.activeVehicleSeat] = null;
    v.seats[nextSeat] = this.player.id;
    this.activeVehicleSeat = nextSeat;
    this.isReloading = false;
    this.reloadTimer = 0;
    this.isAds = false;
    this.isSteadyAim = false;
    this.isCookingGrenade = false;
    this.adsToggle = false;
    this.weaponPivot.visible = nextSeat >= 2;
    if (nextSeat !== 0) {
      soundEngine.updateVehicleEngine(false, 0, false);
    }
    if (v.type !== 'attack_heli') {
      soundEngine.updateHelicopterAudio(false, 0, false);
    }
    soundEngine.playMechanicalClick(580, 0.05);
    this.emitHud();
  }

  public triggerTouchGrenadeStart() {
    const inBlockedSeat = Boolean(this.activeVehicle && this.activeVehicleSeat < 2);
    if (
      this.phase !== 'playing' ||
      this.arsenalOpen ||
      !this.player.alive ||
      this.activeMountedMg ||
      inBlockedSeat
    ) {
      return;
    }
    if (this.grenades > 0 && !this.isCookingGrenade) {
      this.isCookingGrenade = true;
      this.grenadeCookTimer = 2.8;
      this.isAds = false;
      this.adsToggle = false;
      soundEngine.playPinPull();
      this.emitHud();
    }
  }

  public triggerTouchGrenadeRelease() {
    if (this.isCookingGrenade) {
      this.throwPlayerGrenade();
    }
  }

  public triggerTouchAirstrike() {
    if (this.phase !== 'playing' || this.arsenalOpen) return;
    this.tryCallAirstrike();
  }

  public toggleMute() {
    this.updateConfig({ muted: !this.config.muted });
  }

  private selectSlot(slotIndex: 0 | 1 | 2, instant = false) {
    if (this.config.matchMode === 'gun_game' && !instant && slotIndex !== 0) {
      return;
    }
    const targetId = this.loadout[slotIndex];
    if (this.activeSlot === slotIndex && this.activeWeapon === targetId && !instant) return;
    this.lastSlot = this.activeSlot;
    this.activeSlot = slotIndex;
    this.activeWeapon = targetId;
    if (this.player) this.player.weaponId = targetId;

    this.isReloading = false;
    this.reloadTimer = 0;
    this.isAds = false;
    this.adsToggle = false;
    this.lockProgress = 0;
    this.lockCandidateId = null;
    this.lockCompleteCuePlayed = false;

    const activeVm = this.getOrCreateViewmodel(targetId);
    for (const [id, vm] of this.viewmodels.entries()) {
      vm.root.visible = id === targetId;
    }
    activeVm.muzzleFlash.visible = false;

    if (!instant) {
      this.weaponKickZ = 0.08;
      this.weaponKickRotX = -0.18;
      soundEngine.playMechanicalClick(560, 0.04);
    }
    this.emitHud();
  }

  private bindEvents() {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('orientationchange', this.handleOrientationResize);
    window.addEventListener('touchstart', this.handleFirstTouch, { passive: true });
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('wheel', this.handleWheel, { passive: true });
    window.addEventListener('contextmenu', this.handleContextMenu);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost);
  }

  private handleFirstTouch = () => {
    if (!this.isTouchDevice) {
      this.isTouchDevice = true;
      this.emitHud();
    }
  };

  private handleOrientationResize = () => {
    window.setTimeout(this.handleResize, 120);
  };

  private handleContextLost = (e: Event) => {
    e.preventDefault();
  };

  private handleContextMenu = (e: MouseEvent) => {
    if (this.phase === 'playing' && !this.arsenalOpen) {
      e.preventDefault();
    }
  };

  private handlePointerLockChange = () => {
    this.pointerLocked = document.pointerLockElement === this.renderer.domElement;
    if (!this.pointerLocked && this.phase === 'playing' && !this.arsenalOpen && !this.isTouchControlsActive()) {
      this.mouseDownLeft = false;
      this.mouseDownRight = false;
      this.phase = 'paused';
      soundEngine.updateVehicleEngine(false, 0, false);
      soundEngine.updateHelicopterAudio(false, 0, false);
    }
    this.emitHud();
  };

  private handleResize = () => {
    if (this.disposed) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Escape' && this.arsenalOpen) {
      e.preventDefault();
      this.closeArsenal();
      return;
    }

    if (this.arsenalOpen) return;

    this.keys[e.code] = true;

    if (e.code === 'KeyM') {
      this.updateConfig({ muted: !this.config.muted });
      return;
    }

    if (this.phase !== 'playing') return;

    const inPassengerSeat = Boolean(this.activeVehicle && this.activeVehicleSeat >= 2);
    const lockedOut = Boolean(this.activeMountedMg || (this.activeVehicle && !inPassengerSeat));

    if (this.activeVehicle) {
      if (e.code === 'Digit1') {
        this.switchVehicleSeat(0);
        return;
      }
      if (e.code === 'Digit2') {
        this.switchVehicleSeat(1);
        return;
      }
      if (e.code === 'Digit3') {
        this.switchVehicleSeat(2);
        return;
      }
      if (e.code === 'Digit4') {
        this.switchVehicleSeat(3);
        return;
      }
      if (e.code === 'KeyC' && !e.repeat) {
        this.switchVehicleSeat();
        return;
      }
    }

    // Strict Arsenal rule: only carried 3 slots (1, 2, 3, Q) can be switched mid-match
    if (e.code === 'Digit1' && !lockedOut) this.selectSlot(0);
    else if (e.code === 'Digit2' && !lockedOut) this.selectSlot(1);
    else if (e.code === 'Digit3' && !lockedOut) this.selectSlot(2);
    else if (e.code === 'KeyQ' && !lockedOut) this.selectSlot(this.lastSlot);
    else if (e.code === 'KeyR') {
      if (this.activeVehicle && this.nearHangar) {
        this.serviceVehicleAtHangar(this.activeVehicle, this.nearHangar);
      } else if (this.activeMountedMg) {
        this.startMountedReload();
      } else if (!lockedOut) {
        this.startReload();
      }
    } else if (e.code === 'KeyT' && !e.repeat && !lockedOut) this.startDigTrench();
    else if (e.code === 'KeyF') this.adsToggle = !this.adsToggle;
    else if (e.code === 'KeyE' && !e.repeat) this.toggleMountOrArsenal();
    else if (e.code === 'KeyH' && !e.repeat && this.nearDestroyedMg && !this.repairingMg) {
      this.startRepairDestroyedMg(this.nearDestroyedMg);
    } else if (e.code === 'KeyX' && !e.repeat) this.tryCallAirstrike();
    else if (e.code === 'KeyG' && !e.repeat) {
      const canThrowFromSeat = !this.activeVehicle || this.activeVehicleSeat >= 2;
      if (this.player.alive && !this.activeMountedMg && canThrowFromSeat && this.grenades > 0 && !this.isCookingGrenade) {
        this.isCookingGrenade = true;
        this.grenadeCookTimer = 2.8;
        this.isAds = false;
        this.isSteadyAim = false;
        this.adsToggle = false;
        soundEngine.playPinPull();
        this.emitHud();
      }
    } else if (e.code === 'KeyV' || e.code === 'KeyZ') {
      const spec = WEAPONS[this.activeWeapon];
      if (!lockedOut && (spec.optic === 'sniper' || spec.optic === 'acog' || spec.optic === 'thermal_lock')) {
        this.scopeZoomLevel = this.scopeZoomLevel === 1 ? 2 : 1;
        soundEngine.playMechanicalClick(680, 0.035);
        this.emitHud();
      }
    } else if (e.code === 'Tab') {
      e.preventDefault();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
    if (e.code === 'KeyG' && this.isCookingGrenade) {
      this.throwPlayerGrenade();
    }
  };

  private applyLookDelta(dx: number, dy: number) {
    const fovRatio = this.camera.fov / 75;
    const adsSensMult = this.isAds ? Math.max(0.14, Math.pow(fovRatio, 0.92)) : 1.0;
    const sensScale = 0.0021 * this.config.sensitivity * adsSensMult;

    if (this.activeMountedMg) {
      const mg = this.activeMountedMg;
      const nextYaw = mg.currentYaw - dx * sensScale * 0.78;
      let deltaFromBase = nextYaw - mg.baseYaw;
      while (deltaFromBase > Math.PI) deltaFromBase -= Math.PI * 2;
      while (deltaFromBase < -Math.PI) deltaFromBase += Math.PI * 2;
      const yawSpan = mg.kind === 'field_gun' ? 1.48 : 1.42;
      deltaFromBase = THREE.MathUtils.clamp(deltaFromBase, -yawSpan, yawSpan);
      mg.currentYaw = mg.baseYaw + deltaFromBase;
      mg.currentPitch = THREE.MathUtils.clamp(
        mg.currentPitch - dy * sensScale * 0.78,
        mg.kind === 'field_gun' ? -0.26 : -0.45,
        0.78
      );
      mg.yawGroup.rotation.y = mg.currentYaw - mg.baseYaw;
      mg.pitchGroup.rotation.x = mg.currentPitch;
      this.player.yaw = mg.currentYaw;
      this.player.pitch = mg.currentPitch;
      return;
    }

    if (this.activeVehicle) {
      this.player.yaw -= dx * sensScale * 0.92;
      const isHeli = this.activeVehicle.type === 'attack_heli';
      const maxPitchDown = this.activeVehicleSeat >= 2 ? -0.95 : isHeli ? -0.78 : -0.24;
      const maxPitchUp = this.activeVehicleSeat >= 2 ? 1.12 : isHeli ? 0.45 : 0.48;
      this.player.pitch = THREE.MathUtils.clamp(
        this.player.pitch - dy * sensScale * 0.82,
        maxPitchDown,
        maxPitchUp
      );
      return;
    }

    this.player.yaw -= dx * sensScale;
    this.player.pitch = THREE.MathUtils.clamp(
      this.player.pitch - dy * sensScale,
      -1.46,
      1.46
    );
  }

  private handleMouseMove = (e: MouseEvent) => {
    if (this.phase !== 'playing' || !this.player.alive || this.arsenalOpen) return;
    if (!this.pointerLocked && !this.mouseDownLeft && !this.mouseDownRight) return;
    this.applyLookDelta(e.movementX, e.movementY);
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (this.phase !== 'playing' || this.arsenalOpen || this.isTouchControlsActive()) return;
    if (!this.pointerLocked && e.target === this.renderer.domElement) {
      this.requestPointerLock();
    }
    if (e.button === 0) {
      this.mouseDownLeft = true;
    } else if (e.button === 2) {
      this.mouseDownRight = true;
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.mouseDownLeft = false;
      this.semiTriggerReleased = true;
    } else if (e.button === 2) {
      this.mouseDownRight = false;
    }
  };

  private handleWheel = (e: WheelEvent) => {
    if (this.phase !== 'playing' || this.arsenalOpen || this.activeMountedMg || this.activeVehicle) return;
    const nextSlot = ((this.activeSlot + (e.deltaY > 0 ? 1 : -1) + 3) % 3) as 0 | 1 | 2;
    this.selectSlot(nextSlot);
  };

  private startReload() {
    if (this.isReloading || !this.player.alive) return;
    const state = this.weaponStates[this.activeWeapon];
    const spec = WEAPONS[this.activeWeapon];
    if (state.mag >= spec.magSize || state.reserve <= 0) return;

    this.isReloading = true;
    this.reloadTimer = spec.reloadTime;
    this.isAds = false;
    this.adsToggle = false;
    soundEngine.playReload();
    this.emitHud();
  }

  private countNearbyGroundBelts(mg: MountedMgNode): number {
    let count = 0;
    for (const b of this.arena.beltPickups) {
      if (b.collected) continue;
      const d = Math.hypot(b.position.x - mg.position.x, b.position.z - mg.position.z);
      if (d <= 4.6 && Math.abs(b.position.y - mg.position.y) <= 2.2) {
        count += 1;
      }
    }
    return count;
  }

  private findNearbyGroundBelt(mg: MountedMgNode): AmmoBeltNode | null {
    let best: AmmoBeltNode | null = null;
    let bestDist = 4.6;
    for (const b of this.arena.beltPickups) {
      if (b.collected) continue;
      if (Math.abs(b.position.y - mg.position.y) > 2.2) continue;
      const d = Math.hypot(b.position.x - mg.position.x, b.position.z - mg.position.z);
      if (d <= bestDist) {
        bestDist = d;
        best = b;
      }
    }
    return best;
  }

  private startMountedReload() {
    const mg = this.activeMountedMg;
    if (!this.player.alive || !mg || this.mgReloading || mg.ammo >= mg.maxAmmo) return;

    const nearbyBelt = this.findNearbyGroundBelt(mg);
    if (nearbyBelt) {
      nearbyBelt.collected = true;
      nearbyBelt.meshGroup.visible = false;
      if (this.config.mode === 'multiplayer') {
        this.mpClient.sendBeltPickup(nearbyBelt.id);
      }
      this.pickupNotice = 'Loaded Mount Reserve Belt from Ground Crate';
      this.pickupNoticeTimer = 2.0;
    } else if (this.carriedBelts > 0) {
      this.carriedBelts -= 1;
      this.pickupNotice = `Loading Carried Belt (${this.carriedBelts}/${this.maxCarriedBelts} remaining)`;
      this.pickupNoticeTimer = 2.0;
    } else {
      soundEngine.playMechanicalClick(180, 0.07);
      this.pickupNotice = 'No Belts Left! Carry Heavy Belts from Arsenal';
      this.pickupNoticeTimer = 2.8;
      this.emitHud();
      return;
    }

    this.mgReloading = true;
    this.mgReloadDuration = mg.kind === 'field_gun' ? 2.6 : mg.kind === 'tow' ? 2.8 : 2.1;
    this.mgReloadTimer = this.mgReloadDuration;
    soundEngine.playBeltReload();
    this.emitHud();
  }

  private startRepairDestroyedMg(mg: MountedMgNode) {
    if (!this.player.alive || !mg.destroyed || this.repairingMg || this.activeVehicle || this.activeMountedMg) {
      return;
    }
    this.repairingMg = mg;
    this.repairTimer = this.repairDuration;
    this.repairSparkAccum = 0;
    this.isAds = false;
    this.adsToggle = false;
    this.isDiggingTrench = false;
    soundEngine.playRepairWrench();
    this.emitHud();
  }

  private completeRepairMountedMg(mg: MountedMgNode, fromRemote = false) {
    mg.destroyed = false;
    mg.hp = mg.maxHp;
    mg.heat = 0;
    mg.overheated = false;
    mg.fireCooldown = 0;
    mg.ammo = Math.max(1, Math.ceil(mg.maxAmmo * 0.5));
    mg.yawGroup.visible = true;
    mg.wreckGroup.visible = false;
    mg.muzzleFlash.visible = false;
    mg.barrelHeatMat.emissiveIntensity = 0;
    if (mg.sandbagMesh) {
      mg.sandbagMesh.visible = true;
      if (!this.arena.staticRayMeshes.includes(mg.sandbagMesh)) {
        this.arena.staticRayMeshes.push(mg.sandbagMesh);
      }
    }
    if (mg.sandbagCollider) {
      mg.sandbagCollider.disabled = false;
    }

    const pt = mg.position.clone().add(new THREE.Vector3(0, 0.9, 0));
    this.spawnSparks(pt, 0x38bdf8, 12);

    if (!fromRemote) {
      this.repairingMg = null;
      this.repairTimer = 0;
      soundEngine.playPickup();
      this.pickupNotice = `${mg.name} Repaired (${mg.ammo} rds loaded)`;
      this.pickupNoticeTimer = 2.5;
      if (this.config.mode === 'multiplayer') {
        this.mpClient.sendMountRepair(mg.id);
      }
      this.emitHud();
    }
  }

  private startDigTrench() {
    if (
      !this.player.alive ||
      this.isDiggingTrench ||
      this.activeVehicle ||
      this.activeMountedMg ||
      !this.grounded ||
      this.arsenalOpen
    ) {
      return;
    }
    if (this.player.position.y > 0.45) {
      soundEngine.playMechanicalClick(190, 0.05);
      this.pickupNotice = 'Cannot Dig Trench on Elevated Structure';
      this.pickupNoticeTimer = 1.9;
      this.emitHud();
      return;
    }
    for (const t of this.dugTrenches) {
      if (Math.hypot(t.position.x - this.player.position.x, t.position.z - this.player.position.z) < 3.6) {
        soundEngine.playMechanicalClick(200, 0.05);
        this.pickupNotice = 'Trench Already Dug Nearby';
        this.pickupNoticeTimer = 1.8;
        this.emitHud();
        return;
      }
    }

    this.isDiggingTrench = true;
    this.digTrenchTimer = this.digTrenchDuration;
    this.digDustAccum = 0;
    this.isAds = false;
    this.adsToggle = false;
    this.isReloading = false;
    soundEngine.playDigTrench();
    this.emitHud();
  }

  private removeDugTrenchAt(idx: number) {
    const tr = this.dugTrenches[idx];
    if (!tr) return;
    this.scene.remove(tr.group);
    for (const c of tr.colliders) {
      const ci = this.arena.colliders.indexOf(c);
      if (ci >= 0) this.arena.colliders.splice(ci, 1);
    }
    for (const rm of tr.rayMeshes) {
      const ri = this.arena.staticRayMeshes.indexOf(rm);
      if (ri >= 0) this.arena.staticRayMeshes.splice(ri, 1);
    }
    tr.group.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
      }
    });
    this.dugTrenches.splice(idx, 1);
  }

  private spawnDugTrench(center: THREE.Vector3, yaw: number, fromRemote = false) {
    if (this.dugTrenches.length >= this.maxTrenches) {
      this.removeDugTrenchAt(0);
    }

    const gY = groundHeightAt(center.x, center.z, center.y + 0.5, this.arena);
    const group = new THREE.Group();
    group.position.set(center.x, gY, center.z);
    group.rotation.y = yaw;

    // Dark excavated earth floor + timber duckboards
    const pitFloor = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.05, 1.38), this.trenchPitMat);
    pitFloor.position.set(0, 0.025, 0);
    pitFloor.receiveShadow = true;
    group.add(pitFloor);

    for (const dz of [-0.24, 0.24]) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(2.95, 0.045, 0.26), this.trenchTimberMat);
      plank.position.set(0, 0.055, dz);
      plank.receiveShadow = true;
      group.add(plank);
    }

    // Side timber revetment walls & stakes (open flank access at ±1.68)
    for (const sx of [-1.62, 1.62]) {
      const sideBoard = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.36, 1.3), this.trenchTimberMat);
      sideBoard.position.set(sx, 0.18, 0);
      sideBoard.castShadow = true;
      sideBoard.receiveShadow = true;
      group.add(sideBoard);
      for (const sz of [-0.52, 0.52]) {
        const stake = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.54, 0.12), this.trenchTimberMat);
        stake.position.set(sx, 0.27, sz);
        stake.castShadow = true;
        group.add(stake);
      }
    }

    // Front Earthen Berm + Sandbag Fighting Parapet (blocks bullets/rockets, allows standing fire over top)
    const frontEarth = new THREE.Mesh(new THREE.BoxGeometry(3.55, 0.56, 0.62), this.trenchEarthMat);
    frontEarth.position.set(0, 0.28, -0.82);
    frontEarth.castShadow = true;
    frontEarth.receiveShadow = true;

    const frontBags = new THREE.Mesh(new THREE.BoxGeometry(3.35, 0.48, 0.44), this.trenchSandbagMat);
    frontBags.position.set(0, 0.80, -0.80);
    frontBags.castShadow = true;
    frontBags.receiveShadow = true;

    // Rear low parados berm
    const rearEarth = new THREE.Mesh(new THREE.BoxGeometry(3.15, 0.38, 0.46), this.trenchEarthMat);
    rearEarth.position.set(0, 0.19, 0.88);
    rearEarth.castShadow = true;
    rearEarth.receiveShadow = true;

    group.add(frontEarth, frontBags, rearEarth);
    this.scene.add(group);

    const rayMeshes: THREE.Mesh[] = [frontEarth, frontBags, rearEarth];
    this.arena.staticRayMeshes.push(...rayMeshes);

    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const absCos = Math.abs(cosY);
    const absSin = Math.abs(sinY);

    const makeBermCollider = (w: number, h: number, d: number, lz: number): BoxCollider => {
      const wx = center.x + lz * sinY;
      const wz = center.z + lz * cosY;
      const hx = absCos * (w * 0.5) + absSin * (d * 0.5);
      const hz = absSin * (w * 0.5) + absCos * (d * 0.5);
      return {
        minX: wx - hx,
        maxX: wx + hx,
        minY: gY,
        maxY: gY + h,
        minZ: wz - hz,
        maxZ: wz + hz,
      };
    };

    const frontCollider = makeBermCollider(3.45, 1.04, 0.56, -0.82);
    const rearCollider = makeBermCollider(3.15, 0.38, 0.46, 0.88);
    this.arena.colliders.push(frontCollider, rearCollider);

    this.dugTrenches.push({
      id: `trench-${this.trenchSeq++}`,
      position: new THREE.Vector3(center.x, gY, center.z),
      yaw,
      group,
      colliders: [frontCollider, rearCollider],
      rayMeshes,
    });

    this.spawnDebrisChunks(new THREE.Vector3(center.x, gY + 0.3, center.z), 'sandstone', 6);

    if (!fromRemote) {
      soundEngine.playPickup();
      this.pickupNotice = `Fortified Trench Built (${this.dugTrenches.length}/${this.maxTrenches})`;
      this.pickupNoticeTimer = 2.0;
      if (this.config.mode === 'multiplayer') {
        this.mpClient.sendTrenchDig(center.x, gY, center.z, yaw);
      }
      this.emitHud();
    }
  }

  private spawnShellCasing(vm: ViewmodelHandle) {
    if (this.shells.length > 26) return;
    vm.ejectionPort.getWorldPosition(_vecB);
    const mesh = new THREE.Mesh(this.shellGeo, this.brassMat);
    mesh.position.copy(_vecB);

    const rightVec = new THREE.Vector3(1, 0.75, 0.2).applyQuaternion(this.camera.quaternion).normalize();
    const vel = rightVec.multiplyScalar(2.4 + Math.random() * 0.9);
    vel.y += 1.2;
    const rotVel = new THREE.Vector3(
      (Math.random() - 0.5) * 18,
      (Math.random() - 0.5) * 18,
      (Math.random() - 0.5) * 18
    );
    this.scene.add(mesh);
    this.shells.push({ mesh, vel, rotVel, life: 0.75 });
  }

  private getVehicleFirstFreeSeat(v: VehicleNode): number {
    return v.seats.findIndex((s) => s === null);
  }

  private getSeatWorldPos(v: VehicleNode, seatIdx: number): THREE.Vector3 {
    const off = v.seatOffsets[seatIdx] ?? [0, 1.0, 0];
    const cosY = Math.cos(v.yaw);
    const sinY = Math.sin(v.yaw);
    const wx = off[0] * cosY + off[2] * sinY;
    const wz = -off[0] * sinY + off[2] * cosY;
    return new THREE.Vector3(v.position.x + wx, v.position.y + off[1], v.position.z + wz);
  }

  private isEnemyOccupiedVehicle(v: VehicleNode, myTeam: TeamId): boolean {
    for (const sid of v.seats) {
      if (!sid) continue;
      if (this.isFfaLike()) {
        if (sid !== this.player?.id) return true;
        continue;
      }
      const actor = this.actors.find((a) => a.id === sid);
      if (actor && actor.team !== myTeam) return true;
    }
    return false;
  }

  private isFriendlyOccupiedVehicle(v: VehicleNode, myTeam: TeamId): boolean {
    for (const sid of v.seats) {
      if (!sid) continue;
      if (this.isFfaLike()) {
        if (sid === this.player?.id) return true;
        continue;
      }
      const actor = this.actors.find((a) => a.id === sid);
      if (actor && actor.team === myTeam) return true;
    }
    return false;
  }

  private toggleMountOrArsenal() {
    if (!this.player.alive) return;
    if (this.activeVehicle) {
      this.exitVehicle(false);
      return;
    }
    if (this.activeMountedMg) {
      this.activeMountedMg.muzzleFlash.visible = false;
      this.activeMountedMg = null;
      this.mgReloading = false;
      this.mgReloadTimer = 0;
      this.weaponPivot.visible = true;
      soundEngine.playMechanicalClick(380, 0.05);
      this.emitHud();
      return;
    }
    if (this.nearArsenalName) {
      if (this.config.matchMode === 'gun_game') {
        const w = WEAPONS[this.activeWeapon];
        if (w) {
          this.weaponStates[this.activeWeapon] = {
            id: this.activeWeapon,
            mag: w.magSize,
            reserve: w.reserveMax,
          };
        }
        this.grenades = this.maxGrenades;
        this.player.health = Math.min(this.player.maxHealth, this.player.health + 25);
        soundEngine.playPickup();
        this.pickupNotice = 'Gun Game: Tier Swaps Locked · Ammo & Frags Refilled';
        this.pickupNoticeTimer = 2.4;
        this.emitHud();
        return;
      }
      this.arsenalOpen = true;
      this.mouseDownLeft = false;
      this.mouseDownRight = false;
      this.isAds = false;
      this.adsToggle = false;
      this.keys = {};
      if (document.pointerLockElement === this.renderer.domElement) {
        document.exitPointerLock();
      }
      soundEngine.playMechanicalClick(620, 0.05);
      this.emitHud();
      return;
    }
    if (
      this.nearVehicle &&
      !this.nearVehicle.destroyed &&
      !this.isEnemyOccupiedVehicle(this.nearVehicle, this.player.team) &&
      this.getVehicleFirstFreeSeat(this.nearVehicle) !== -1
    ) {
      this.enterVehicle(this.nearVehicle);
      return;
    }
    if (this.nearHangar) {
      this.resupplyAtHangar(this.nearHangar);
      return;
    }
    if (this.nearMountedMg) {
      this.activeMountedMg = this.nearMountedMg;
      this.isReloading = false;
      this.reloadTimer = 0;
      this.mgReloading = false;
      this.mgReloadTimer = 0;
      this.isCookingGrenade = false;
      this.isDiggingTrench = false;
      this.repairingMg = null;
      this.isAds = false;
      this.adsToggle = false;
      this.weaponPivot.visible = false;
      this.player.yaw = this.activeMountedMg.currentYaw;
      this.player.pitch = this.activeMountedMg.currentPitch;
      soundEngine.playMechanicalClick(490, 0.06);
      this.emitHud();
      return;
    }
    if (this.nearDestroyedMg && !this.repairingMg) {
      this.startRepairDestroyedMg(this.nearDestroyedMg);
    }
  }

  private serviceVehicleAtHangar(v: VehicleNode, hangar: HangarNode) {
    if (v.destroyed) return;
    const needsArmor = v.health < v.maxHealth;
    const needsAmmo = v.ammo < v.maxAmmo || v.secondaryAmmo < v.secondaryMaxAmmo;
    if (!needsArmor && !needsAmmo) return;

    v.health = v.maxHealth;
    v.ammo = v.maxAmmo;
    v.secondaryAmmo = v.secondaryMaxAmmo;
    const baseColor =
      v.teamHint === 'blue' ? 0x2c4a70 : v.teamHint === 'red' ? 0x6b2c2a : 0x4b533b;
    v.bodyMat.color.setHex(baseColor);
    this.hangarServiceCooldown = 2.6;
    soundEngine.playHangarResupply();
    this.pickupNotice = `${hangar.name}: ${v.name} Rearmed & Repaired`;
    this.pickupNoticeTimer = 2.4;
    this.emitHud();
  }

  private resupplyAtHangar(hangar: HangarNode) {
    const heavyId = this.loadout[2];
    if (heavyId && WEAPONS[heavyId]) {
      this.weaponStates[heavyId] = {
        id: heavyId,
        mag: WEAPONS[heavyId].magSize,
        reserve: WEAPONS[heavyId].reserveMax,
      };
    }
    for (const wid of this.loadout) {
      const st = this.weaponStates[wid];
      const spec = WEAPONS[wid];
      if (st && spec) {
        st.reserve = Math.max(st.reserve, spec.reserveMax);
      }
    }
    this.grenades = this.maxGrenades;
    this.carriedBelts = this.maxCarriedBelts;
    this.player.health = Math.min(this.player.maxHealth, this.player.health + 25);

    // Also service any friendly vehicle parked inside or right beside the hangar bay
    let servicedVeh: string | null = null;
    for (const v of this.arena.vehicles) {
      if (v.destroyed) continue;
      const dist = Math.hypot(v.position.x - hangar.position.x, v.position.z - hangar.position.z);
      if (dist <= 13.5 && Math.abs(v.position.y - hangar.position.y) < 6.0) {
        v.health = v.maxHealth;
        v.ammo = v.maxAmmo;
        v.secondaryAmmo = v.secondaryMaxAmmo;
        const baseColor =
          v.teamHint === 'blue' ? 0x2c4a70 : v.teamHint === 'red' ? 0x6b2c2a : 0x4b533b;
        v.bodyMat.color.setHex(baseColor);
        servicedVeh = v.name;
      }
    }

    soundEngine.playHangarResupply();
    this.pickupNotice = servicedVeh
      ? `${hangar.name}: Heavy Ordnance & ${servicedVeh} Restocked`
      : `${hangar.name}: Heavy Launcher, Frags & Belts Restocked`;
    this.pickupNoticeTimer = 2.4;
    this.emitHud();
  }

  private enterVehicle(v: VehicleNode) {
    const freeSeat = this.getVehicleFirstFreeSeat(v);
    if (freeSeat === -1) return;

    this.activeVehicle = v;
    this.activeVehicleSeat = freeSeat;
    v.seats[freeSeat] = this.player.id;
    if (v.type === 'attack_heli') {
      v.rotorRpm = Math.max(v.rotorRpm, 0.25);
      v.vy = 0;
    }
    this.isReloading = false;
    this.reloadTimer = 0;
    this.isCookingGrenade = false;
    this.isAds = false;
    this.adsToggle = false;
    this.weaponPivot.visible = freeSeat >= 2;
    this.player.yaw = v.yaw + v.turretYaw;
    this.player.pitch = v.turretPitch;
    soundEngine.playVehicleMount(true);
    this.emitHud();
  }

  private exitVehicle(fromDeath: boolean) {
    const v = this.activeVehicle;
    if (!v) return;
    v.muzzleFlash.visible = false;
    for (let s = 0; s < v.seats.length; s++) {
      if (v.seats[s] === this.player.id) {
        v.seats[s] = null;
      }
    }
    this.activeVehicle = null;
    this.activeVehicleSeat = 0;
    soundEngine.updateVehicleEngine(false, 0, false);
    soundEngine.updateHelicopterAudio(false, 0, false);

    if (!fromDeath) {
      const isHeavyHull = v.type === 'tank' || v.type === 'heavy_tank' || v.type === 'apc';
      const sideDist = v.type === 'attack_heli' ? 2.6 : isHeavyHull ? 2.85 : 2.15;
      const sideX = -Math.cos(v.yaw) * sideDist;
      const sideZ = Math.sin(v.yaw) * sideDist;
      this.player.position.set(v.position.x + sideX, v.position.y + 0.1, v.position.z + sideZ);
      resolveHorizontalCollision(this.player.position, 0.48, 1.8, this.arena);
      const floorY = groundHeightAt(
        this.player.position.x,
        this.player.position.z,
        this.player.position.y + 0.5,
        this.arena
      );
      if (v.type === 'attack_heli' && v.position.y - floorY > 4.2) {
        this.player.position.y = Math.max(floorY + 0.5, v.position.y - 0.5);
        this.player.velocity.set(0, -3.5, 0);
        this.grounded = false;
      } else {
        this.player.position.y = floorY;
        this.player.velocity.set(0, 0, 0);
      }
      this.weaponPivot.visible = true;
      soundEngine.playVehicleMount(false);
    }
    this.emitHud();
  }

  private tryCallAirstrike() {
    if (!this.player.alive || this.airstrikeCharges <= 0 || this.arsenalOpen) return;

    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();
    this.raycaster.set(this.camera.position, dir);
    this.raycaster.far = 480;
    const hits = this.raycaster.intersectObjects(this.arena.staticRayMeshes, false);

    let target: THREE.Vector3;
    if (hits.length > 0) {
      target = hits[0].point.clone();
    } else {
      target = this.camera.position.clone().addScaledVector(dir, 95);
      target.y = groundHeightAt(target.x, target.z, 10, this.arena);
    }

    const lim = this.arena.halfSize - 6;
    target.x = THREE.MathUtils.clamp(target.x, -lim, lim);
    target.z = THREE.MathUtils.clamp(target.z, -lim, lim);

    this.airstrikeCharges -= 1;
    this.launchAirstrikeAt(target, this.player.yaw, this.player.id, this.player.team);
    this.pickupNotice = 'Precision Air Strike Inbound!';
    this.pickupNoticeTimer = 2.6;

    if (this.config.mode === 'multiplayer') {
      this.mpClient.sendAirstrike(target.x, target.y, target.z, this.player.yaw);
    }
    this.emitHud();
  }

  private launchAirstrikeAt(target: THREE.Vector3, yaw: number, attackerId: string, team: TeamId) {
    soundEngine.playJetFlyover();

    const dir = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
    const right = new THREE.Vector3(-dir.z, 0, dir.x).normalize();

    // Glowing Laser Target Beacon Ring
    const beaconGroup = new THREE.Group();
    beaconGroup.position.set(target.x, target.y + 0.14, target.z);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.78,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const outerRing = new THREE.Mesh(new THREE.RingGeometry(7.2, 8.2, 32), ringMat);
    outerRing.rotation.x = -Math.PI / 2;
    const innerRing = new THREE.Mesh(new THREE.RingGeometry(1.5, 2.2, 24), ringMat);
    innerRing.rotation.x = -Math.PI / 2;
    beaconGroup.add(outerRing, innerRing);
    this.scene.add(beaconGroup);

    // 2 Individually Shootable Swept-Wing Striker Jets
    const buildJet = (offsetX: number, offsetZ: number): AirstrikeJet => {
      const jetId = `jet-${this.jetSeq++}`;
      const jet = new THREE.Group();
      const fuselage = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.85, 6.4), this.jetMat);
      const wing = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.18, 2.1), this.jetMat);
      wing.position.set(0, -0.08, 0.45);
      const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.45, 1.35), this.jetMat);
      tailL.position.set(-0.52, 0.78, 2.35);
      tailL.rotation.z = 0.18;
      const tailR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.45, 1.35), this.jetMat);
      tailR.position.set(0.52, 0.78, 2.35);
      tailR.rotation.z = -0.18;
      const canopy = new THREE.Mesh(
        new THREE.BoxGeometry(0.68, 0.42, 1.65),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.65, roughness: 0.2 })
      );
      canopy.position.set(0, 0.5, -1.35);
      const glow = new THREE.Mesh(
        new THREE.ConeGeometry(0.46, 2.1, 8),
        new THREE.MeshBasicMaterial({ color: 0xfb923c, transparent: true, opacity: 0.92 })
      );
      glow.rotation.x = Math.PI / 2;
      glow.position.set(0, 0, 3.8);

      // Generous invisible airframe hit-proxy for reliable AA targeting & bullet raycasts
      const hitProxy = new THREE.Mesh(
        new THREE.BoxGeometry(8.2, 2.6, 7.2),
        new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })
      );

      for (const m of [fuselage, wing, tailL, tailR, canopy, hitProxy]) {
        m.userData.jetId = jetId;
      }

      jet.add(fuselage, wing, tailL, tailR, canopy, glow, hitProxy);
      const worldPos = target
        .clone()
        .addScaledVector(dir, -165 + offsetZ)
        .addScaledVector(right, offsetX);
      worldPos.y = 44;
      jet.position.copy(worldPos);
      jet.lookAt(worldPos.x + dir.x * 80, worldPos.y, worldPos.z + dir.z * 80);
      this.scene.add(jet);

      return {
        id: jetId,
        team,
        group: jet,
        hitMeshes: [fuselage, wing, tailL, tailR, canopy, hitProxy],
        offsetX,
        offsetZ,
        position: worldPos,
        hp: 180,
        maxHp: 180,
        destroyed: false,
        crashing: false,
        crashVel: new THREE.Vector3(),
        crashSpin: new THREE.Vector3(),
        crashTimer: 0,
        smokeAccum: 0,
      };
    };

    const jets = [buildJet(-7.2, 0), buildJet(7.2, -5.5)];

    this.airstrikes.push({
      attackerId,
      team,
      target: target.clone(),
      dir,
      elapsed: 0,
      bombsDropped: 0,
      beaconGroup,
      jets,
    });
  }

  private tryFireVehicle() {
    const v = this.activeVehicle;
    if (!this.player.alive || !v || v.destroyed) return;

    const isTank = v.type === 'tank' || v.type === 'heavy_tank';
    const isHeli = v.type === 'attack_heli';
    const isCoaxGunner = isTank && this.activeVehicleSeat === 1;
    const isHeliGunner = isHeli && this.activeVehicleSeat === 1;

    if (isCoaxGunner) {
      if ((this.vehicleCoaxCooldowns.get(v.id) ?? 0) > 0) return;
      if (v.secondaryAmmo <= 0) {
        if (this.semiTriggerReleased) {
          this.semiTriggerReleased = false;
          soundEngine.playMechanicalClick(200, 0.05);
          this.pickupNotice = 'Coax .50 Ammo Depleted — Rearm at Mini Hangar';
          this.pickupNoticeTimer = 2.0;
        }
        return;
      }
    } else if (isHeli) {
      if (isHeliGunner) {
        if ((this.vehicleCoaxCooldowns.get(v.id) ?? 0) > 0) return;
        if (v.secondaryAmmo <= 0) {
          if (this.semiTriggerReleased) {
            this.semiTriggerReleased = false;
            soundEngine.playMechanicalClick(200, 0.05);
            this.pickupNotice = '30mm Chain Gun Empty — Return to Mini Hangar';
            this.pickupNoticeTimer = 2.0;
          }
          return;
        }
      } else {
        if (this.activeVehicleSeat !== 0) return;
        if (v.fireCooldown > 0) return;
        if (v.ammo <= 0) {
          if (this.semiTriggerReleased) {
            this.semiTriggerReleased = false;
            soundEngine.playMechanicalClick(200, 0.05);
            this.pickupNotice = 'Hydra-70 Rockets Empty — Return to Mini Hangar';
            this.pickupNoticeTimer = 2.0;
          }
          return;
        }
      }
    } else {
      if (v.fireCooldown > 0) return;
      if (isTank) {
        if (this.activeVehicleSeat !== 0) return;
      } else {
        const canOperateTurret =
          this.activeVehicleSeat === 1 || (this.activeVehicleSeat === 0 && v.seats[1] === null);
        if (!canOperateTurret) return;
      }
      if (v.ammo <= 0) {
        if (this.semiTriggerReleased) {
          this.semiTriggerReleased = false;
          soundEngine.playMechanicalClick(200, 0.05);
          this.pickupNotice = `${v.ammoLabel || 'Vehicle'} Ammo Empty — Rearm at Mini Hangar`;
          this.pickupNoticeTimer = 2.0;
        }
        return;
      }
    }

    const muzzleWorld = new THREE.Vector3();
    v.muzzlePoint.getWorldPosition(muzzleWorld);
    if (isCoaxGunner) {
      // Cupola .50 Coax Gunner fires from commander cupola elevation above turret roof
      muzzleWorld.set(v.position.x, v.position.y + 2.85, v.position.z);
    }

    const camDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();
    const aimTargets: THREE.Object3D[] = [...this.arena.staticRayMeshes];
    for (const b of this.arena.barrels) {
      if (!b.destroyed) aimTargets.push(...b.hitMeshes);
    }
    for (const otherV of this.arena.vehicles) {
      if (!otherV.destroyed && otherV !== v) aimTargets.push(...otherV.hitMeshes);
    }
    for (const a of this.actors) {
      if (a.alive && a.id !== this.player.id && (this.isFfaLike() || a.team !== this.player.team) && a.rig) {
        aimTargets.push(...a.rig.hitMeshes);
      }
    }
    for (const strike of this.airstrikes) {
      for (const jet of strike.jets) {
        const friendlyJet = this.isFfaLike() ? strike.attackerId === this.player.id : jet.team === this.player.team;
        if (!jet.destroyed && !friendlyJet) {
          aimTargets.push(...jet.hitMeshes);
        }
      }
    }

    this.raycaster.set(this.camera.position, camDir);
    this.raycaster.far = 480;
    const camHits = this.raycaster.intersectObjects(aimTargets, false);
    const aimPoint =
      camHits.length > 0
        ? camHits[0].point.clone()
        : this.camera.position.clone().addScaledVector(camDir, 220);
    const toAim = aimPoint.sub(muzzleWorld);
    const barrelDir = toAim.lengthSq() > 16 ? toAim.normalize() : camDir.clone();

    if (isCoaxGunner) {
      v.secondaryAmmo = Math.max(0, v.secondaryAmmo - 1);
      this.vehicleCoaxCooldowns.set(v.id, 60 / 560);
      soundEngine.playGunshot('hmg', 0.94);
      this.muzzleLight.color.setHex(0xfef08a);
      this.muzzleLight.intensity = 3.8;
      this.cameraShake = Math.max(this.cameraShake, 0.05);

      const spread = 0.0075;
      const shotDir = barrelDir
        .clone()
        .add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 2 * spread,
            (Math.random() - 0.5) * 2 * spread,
            (Math.random() - 0.5) * 2 * spread
          )
        )
        .normalize();

      this.spawnBallisticBullet(
        this.camera.position.clone(),
        muzzleWorld.clone().addScaledVector(shotDir, 0.9),
        shotDir,
        320,
        0.35,
        40,
        1.7,
        245,
        this.player.id,
        this.player.team,
        'Coax .50',
        0xfef08a
      );
      if (this.config.mode === 'multiplayer') {
        this.mpClient.sendFire({
          weaponId: 'm249_saw',
          ox: muzzleWorld.x,
          oy: muzzleWorld.y,
          oz: muzzleWorld.z,
          dx: shotDir.x,
          dy: shotDir.y,
          dz: shotDir.z,
          kind: 'bullet',
        });
      }
      return;
    }

    if (isHeli) {
      if (isHeliGunner) {
        v.secondaryAmmo = Math.max(0, v.secondaryAmmo - 1);
        this.vehicleCoaxCooldowns.set(v.id, 60 / 420);
        v.muzzleFlash.visible = true;
        v.muzzleFlash.rotation.z = Math.random() * Math.PI * 2;
        this.vehicleFlashTimer = 0.05;
        v.barrelRecoilGroup.position.z = 0.14;
        soundEngine.playChainGun30mm(1.0);
        this.muzzleLight.color.setHex(0xffb703);
        this.muzzleLight.intensity = 5.4;
        this.cameraShake = Math.max(this.cameraShake, 0.08);

        const spread = 0.0065;
        const shotDir = barrelDir
          .clone()
          .add(
            new THREE.Vector3(
              (Math.random() - 0.5) * 2 * spread,
              (Math.random() - 0.5) * 2 * spread,
              (Math.random() - 0.5) * 2 * spread
            )
          )
          .normalize();

        this.spawnBallisticBullet(
          this.camera.position.clone(),
          muzzleWorld.clone().addScaledVector(shotDir, 0.8),
          shotDir,
          350,
          0.24,
          46,
          1.6,
          420,
          this.player.id,
          this.player.team,
          '30mm M230 HE',
          0xffb703,
          2.35
        );
        if (this.config.mode === 'multiplayer') {
          this.mpClient.sendFire({
            weaponId: 'm249_saw',
            ox: muzzleWorld.x,
            oy: muzzleWorld.y,
            oz: muzzleWorld.z,
            dx: shotDir.x,
            dy: shotDir.y,
            dz: shotDir.z,
            kind: 'bullet',
          });
        }
        return;
      } else {
        // Pilot fires alternating wing-pod Hydra-70 70mm Rockets
        const podSide = v.ammo % 2 === 0 ? -1.48 : 1.48;
        v.ammo = Math.max(0, v.ammo - 1);
        v.fireCooldown = 0.28;
        const podWorld = new THREE.Vector3(podSide, 0.84, -1.18);
        v.chassisGroup.localToWorld(podWorld);
        const toAimPod = aimPoint.clone().add(muzzleWorld).sub(podWorld);
        const rocketDir = toAimPod.lengthSq() > 16 ? toAimPod.normalize() : camDir.clone();

        soundEngine.playHeliRocket(1.0);
        this.muzzleLight.color.setHex(0xff922b);
        this.muzzleLight.intensity = 6.2;
        this.cameraShake = Math.max(this.cameraShake, 0.16);

        this.spawnRocket(
          podWorld,
          rocketDir,
          this.player.id,
          this.player.team,
          6.6,
          135,
          'Hydra-70',
          'none',
          135,
          0.07,
          null,
          null,
          false
        );
        this.spawnSmokePuff(
          podWorld.clone(),
          rocketDir.clone().multiplyScalar(-3.2),
          0.7,
          0.45,
          1.6
        );
        if (this.config.mode === 'multiplayer') {
          this.mpClient.sendFire({
            weaponId: 'rpg7',
            ox: podWorld.x,
            oy: podWorld.y,
            oz: podWorld.z,
            dx: rocketDir.x,
            dy: rocketDir.y,
            dz: rocketDir.z,
            kind: 'rocket',
          });
        }
        return;
      }
    }

    v.ammo = Math.max(0, v.ammo - 1);
    v.muzzleFlash.visible = true;
    v.muzzleFlash.rotation.z = Math.random() * Math.PI * 2;
    this.vehicleFlashTimer = 0.055;

    if (v.type === 'tank' || v.type === 'heavy_tank') {
      const isHeavy = v.type === 'heavy_tank';
      v.fireCooldown = isHeavy ? 2.4 : 2.0;
      v.barrelRecoilGroup.position.z = isHeavy ? 0.65 : 0.48;
      soundEngine.playCannonFire(isHeavy ? 1.15 : 1.0);
      this.muzzleLight.color.setHex(0xff922b);
      this.muzzleLight.intensity = isHeavy ? 7.8 : 6.5;
      this.cameraShake = Math.max(this.cameraShake, isHeavy ? 0.42 : 0.34);

      const shellDmg = isHeavy ? 220 : 165;
      const shellBlast = isHeavy ? 8.2 : 6.8;
      const shellLabel = isHeavy ? '120mm APHE' : '105mm HE';
      this.spawnRocket(
        muzzleWorld,
        barrelDir,
        this.player.id,
        this.player.team,
        shellBlast,
        shellDmg,
        shellLabel,
        'none',
        isHeavy ? 105 : 90,
        0.2,
        null,
        null,
        false
      );
      this.spawnSmokePuff(
        muzzleWorld.clone().addScaledVector(barrelDir, 0.5),
        barrelDir.clone().multiplyScalar(2.8),
        0.85,
        0.65,
        2.5
      );
      if (this.config.mode === 'multiplayer') {
        this.mpClient.sendFire({
          weaponId: 'rpg7',
          ox: muzzleWorld.x,
          oy: muzzleWorld.y,
          oz: muzzleWorld.z,
          dx: barrelDir.x,
          dy: barrelDir.y,
          dz: barrelDir.z,
          kind: 'shell',
        });
      }
    } else if (v.type === 'apc') {
      v.fireCooldown = 60 / 340;
      v.barrelRecoilGroup.position.z = 0.14;
      soundEngine.playAutocannonFire(0.92);
      this.muzzleLight.color.setHex(0xfbbf24);
      this.muzzleLight.intensity = 5.0;
      this.cameraShake = Math.max(this.cameraShake, 0.09);

      const spread = 0.0065;
      const shotDir = barrelDir
        .clone()
        .add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 2 * spread,
            (Math.random() - 0.5) * 2 * spread,
            (Math.random() - 0.5) * 2 * spread
          )
        )
        .normalize();

      this.spawnBallisticBullet(
        this.camera.position.clone(),
        muzzleWorld.clone(),
        shotDir,
        320,
        0.32,
        48,
        1.6,
        280,
        this.player.id,
        this.player.team,
        '20mm Bushmaster',
        0xff922b,
        2.4
      );
      if (this.config.mode === 'multiplayer') {
        this.mpClient.sendFire({
          weaponId: 'm249_saw',
          ox: muzzleWorld.x,
          oy: muzzleWorld.y,
          oz: muzzleWorld.z,
          dx: shotDir.x,
          dy: shotDir.y,
          dz: shotDir.z,
          kind: 'bullet',
        });
      }
    } else {
      v.fireCooldown = 60 / 540;
      v.barrelRecoilGroup.position.z = 0.09;
      soundEngine.playGunshot('hmg', 0.92);
      this.muzzleLight.color.setHex(0xfef08a);
      this.muzzleLight.intensity = 4.0;
      this.cameraShake = Math.max(this.cameraShake, 0.06);

      const spread = 0.0085;
      const shotDir = barrelDir
        .clone()
        .add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 2 * spread,
            (Math.random() - 0.5) * 2 * spread,
            (Math.random() - 0.5) * 2 * spread
          )
        )
        .normalize();

      this.spawnBallisticBullet(
        this.camera.position.clone(),
        muzzleWorld.clone(),
        shotDir,
        310,
        0.38,
        44,
        1.7,
        240,
        this.player.id,
        this.player.team,
        v.type === 'buggy' ? 'Buggy .50' : '4×4 .50',
        0xfef08a
      );
      if (this.config.mode === 'multiplayer') {
        this.mpClient.sendFire({
          weaponId: 'm249_saw',
          ox: muzzleWorld.x,
          oy: muzzleWorld.y,
          oz: muzzleWorld.z,
          dx: shotDir.x,
          dy: shotDir.y,
          dz: shotDir.z,
          kind: 'bullet',
        });
      }
    }
  }

  private tryFireMountedEmplacement() {
    const mg = this.activeMountedMg;
    if (!this.player.alive || !mg || mg.fireCooldown > 0 || this.mgReloading) return;

    if (mg.ammo <= 0) {
      if (this.semiTriggerReleased) {
        this.semiTriggerReleased = false;
        soundEngine.playMechanicalClick(190, 0.05);
        this.startMountedReload();
      }
      return;
    }

    if (mg.overheated) {
      if (!this.semiTriggerReleased) return;
      this.semiTriggerReleased = false;
      soundEngine.playMechanicalClick(220, 0.04);
      return;
    }

    const muzzleWorld = new THREE.Vector3();
    mg.muzzlePoint.getWorldPosition(muzzleWorld);

    // Raycast from camera crosshair so projectiles converge accurately on the player's aim point
    const camDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();
    const rayTargets: THREE.Object3D[] = [...this.arena.staticRayMeshes];
    for (const b of this.arena.barrels) {
      if (!b.destroyed) rayTargets.push(...b.hitMeshes);
    }
    for (const v of this.arena.vehicles) {
      if (!v.destroyed) rayTargets.push(...v.hitMeshes);
    }
    for (const a of this.actors) {
      if (a.alive && a.id !== this.player.id && (this.isFfaLike() || a.team !== this.player.team) && a.rig) {
        rayTargets.push(...a.rig.hitMeshes);
      }
    }
    for (const strike of this.airstrikes) {
      for (const jet of strike.jets) {
        if (!jet.destroyed) rayTargets.push(...jet.hitMeshes);
      }
    }

    this.raycaster.set(this.camera.position, camDir);
    this.raycaster.far = 280;
    const camHits = this.raycaster.intersectObjects(rayTargets, false);
    const aimPoint =
      camHits.length > 0
        ? camHits[0].point.clone()
        : this.camera.position.clone().addScaledVector(camDir, 180);
    const toAim = aimPoint.sub(muzzleWorld);
    const baseDir = toAim.lengthSq() > 20 ? toAim.normalize() : camDir.clone();

    if (mg.kind === 'field_gun') {
      mg.fireCooldown = 2.1;
      mg.heat = Math.min(1, mg.heat + 0.34);
      if (mg.heat >= 1) mg.overheated = true;
      mg.recoilGroup.position.z = 0.55;
      soundEngine.playFieldGunFire(1.1);
      mg.muzzleFlash.visible = true;
      mg.muzzleFlash.rotation.z = Math.random() * Math.PI * 2;
      this.hmgFlashTimer = 0.085;
      this.muzzleLight.color.setHex(0xff7b1c);
      this.muzzleLight.intensity = 7.5;
      this.cameraShake = Math.max(this.cameraShake, 0.32);

      this.spawnRocket(
        muzzleWorld,
        baseDir,
        this.player.id,
        this.player.team,
        8.5,
        215,
        '105mm M119',
        'none',
        148,
        0.14,
        null,
        null,
        false
      );
      this.spawnSmokePuff(
        muzzleWorld.clone().addScaledVector(baseDir, 0.6),
        baseDir.clone().multiplyScalar(3.0),
        1.1,
        0.8,
        3.2
      );
      mg.currentPitch = THREE.MathUtils.clamp(mg.currentPitch + 0.024, -0.26, 0.78);
    } else if (mg.kind === 'tow') {
      mg.fireCooldown = 2.6;
      mg.heat = Math.min(1, mg.heat + 0.38);
      if (mg.heat >= 1) mg.overheated = true;
      mg.recoilGroup.position.z = 0.22;
      soundEngine.playGunshot('tow', 1.0);
      mg.muzzleFlash.visible = true;
      this.hmgFlashTimer = 0.08;
      this.muzzleLight.color.setHex(0x38bdf8);
      this.muzzleLight.intensity = 6.2;
      this.cameraShake = Math.max(this.cameraShake, 0.25);

      this.spawnRocket(
        muzzleWorld,
        baseDir,
        this.player.id,
        this.player.team,
        7.8,
        245,
        'BGM-71 TOW',
        'laser_guided',
        68,
        0.0,
        null,
        null,
        false
      );
      this.spawnSmokePuff(
        muzzleWorld.clone().addScaledVector(baseDir, -0.4),
        new THREE.Vector3(0, 0.6, 0),
        0.7,
        0.4,
        1.8
      );
    } else if (mg.kind === 'autocannon') {
      mg.fireCooldown = 60 / 280;
      mg.heat = Math.min(1, mg.heat + 0.075);
      if (mg.heat >= 1) {
        mg.overheated = true;
        soundEngine.playMechanicalClick(190, 0.09);
      }
      mg.recoilGroup.position.z = 0.14;
      soundEngine.playAutocannonFire(1.0);
      mg.muzzleFlash.visible = true;
      mg.muzzleFlash.rotation.z = Math.random() * Math.PI * 2;
      this.hmgFlashTimer = 0.05;
      this.muzzleLight.color.setHex(0xfbbf24);
      this.muzzleLight.intensity = 5.0;
      this.cameraShake = Math.max(this.cameraShake, 0.12);

      const spread = 0.007;
      const shotDir = baseDir
        .clone()
        .add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 2 * spread,
            (Math.random() - 0.5) * 2 * spread,
            (Math.random() - 0.5) * 2 * spread
          )
        )
        .normalize();

      this.spawnBallisticBullet(
        this.camera.position.clone(),
        muzzleWorld,
        shotDir,
        305,
        0.34,
        58,
        1.6,
        260,
        this.player.id,
        this.player.team,
        '20mm Vulcan',
        0xff922b,
        2.3
      );
      mg.currentPitch = THREE.MathUtils.clamp(mg.currentPitch + 0.014, -0.45, 0.78);
    } else if (mg.kind === 'mg30') {
      // Browning M1919 .30 Cal Light/Medium MG (680 RPM, rapid sustained fire, very low heat)
      mg.fireCooldown = 60 / 680;
      mg.heat = Math.min(1, mg.heat + 0.026);
      if (mg.heat >= 1) {
        mg.overheated = true;
        soundEngine.playMechanicalClick(210, 0.09);
      }
      mg.recoilGroup.position.z = 0.055;
      soundEngine.playGunshot('mg30', 1.0);
      mg.muzzleFlash.visible = true;
      mg.muzzleFlash.rotation.z = Math.random() * Math.PI * 2;
      this.hmgFlashTimer = 0.04;
      this.muzzleLight.color.setHex(0xfde047);
      this.muzzleLight.intensity = 3.5;
      this.cameraShake = Math.max(this.cameraShake, 0.045);

      const spread = 0.0075;
      const shotDir = baseDir
        .clone()
        .add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 2 * spread,
            (Math.random() - 0.5) * 2 * spread,
            (Math.random() - 0.5) * 2 * spread
          )
        )
        .normalize();

      this.spawnBallisticBullet(
        this.camera.position.clone(),
        muzzleWorld,
        shotDir,
        310,
        0.38,
        29,
        1.75,
        215,
        this.player.id,
        this.player.team,
        'M1919 .30 Cal',
        0xfde047
      );
      mg.currentPitch = THREE.MathUtils.clamp(mg.currentPitch + 0.0065, -0.45, 0.78);
    } else {
      // M2HB .50 Cal
      mg.fireCooldown = 60 / 550;
      mg.heat = Math.min(1, mg.heat + 0.052);
      if (mg.heat >= 1) {
        mg.overheated = true;
        soundEngine.playMechanicalClick(190, 0.09);
      }
      mg.recoilGroup.position.z = 0.08;
      soundEngine.playGunshot('hmg', 1.0);
      mg.muzzleFlash.visible = true;
      mg.muzzleFlash.rotation.z = Math.random() * Math.PI * 2;
      this.hmgFlashTimer = 0.045;
      this.muzzleLight.color.setHex(0xfef08a);
      this.muzzleLight.intensity = 4.2;
      this.cameraShake = Math.max(this.cameraShake, 0.075);

      const spread = 0.009;
      const shotDir = baseDir
        .clone()
        .add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 2 * spread,
            (Math.random() - 0.5) * 2 * spread,
            (Math.random() - 0.5) * 2 * spread
          )
        )
        .normalize();

      this.spawnBallisticBullet(
        this.camera.position.clone(),
        muzzleWorld,
        shotDir,
        295,
        0.42,
        40,
        1.75,
        240,
        this.player.id,
        this.player.team,
        'M2HB .50',
        0xfef08a
      );
      mg.currentPitch = THREE.MathUtils.clamp(mg.currentPitch + 0.011, -0.45, 0.78);
    }

    mg.ammo = Math.max(0, mg.ammo - 1);
    mg.yawGroup.rotation.y = mg.currentYaw - mg.baseYaw;
    mg.pitchGroup.rotation.x = mg.currentPitch;
    this.player.yaw = mg.currentYaw;
    this.player.pitch = mg.currentPitch;

    if (mg.ammo === 0) {
      this.startMountedReload();
    }
  }

  private throwPlayerGrenade() {
    if (!this.isCookingGrenade) return;
    this.isCookingGrenade = false;
    const fuseLeft = Math.max(0.08, this.grenadeCookTimer);
    this.grenadeCookTimer = 0;
    if (!this.player.alive || this.grenades <= 0) {
      this.emitHud();
      return;
    }

    this.grenades -= 1;
    const euler = new THREE.Euler(this.player.pitch, this.player.yaw, 0, 'YXZ');
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(euler).normalize();
    const startPos = this.camera.position.clone().addScaledVector(dir, 0.65);
    startPos.y -= 0.1;

    const throwVel = dir.multiplyScalar(22.0);
    throwVel.y += 4.2;
    throwVel.addScaledVector(this.player.velocity, 0.35);

    this.spawnFragGrenade(startPos, throwVel, fuseLeft, this.player.id, this.player.team);
    if (this.config.mode === 'multiplayer') {
      this.mpClient.sendGrenade(
        startPos.x,
        startPos.y,
        startPos.z,
        throwVel.x,
        throwVel.y,
        throwVel.z,
        fuseLeft
      );
    }
    this.weaponKickZ = 0.08;
    soundEngine.playMechanicalClick(310, 0.05);
    this.emitHud();
  }

  private spawnFragGrenade(
    pos: THREE.Vector3,
    vel: THREE.Vector3,
    fuse: number,
    attackerId: string,
    team: TeamId
  ) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), this.oliveGrenadeMat);
    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.036, 0.045, 8),
      this.brassMat
    );
    collar.position.y = 0.085;
    const ledMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), ledMat);
    led.position.set(0, 0.115, 0);
    group.add(body, collar, led);
    group.position.copy(pos);
    this.scene.add(group);

    this.activeGrenades.push({
      pos: pos.clone(),
      vel: vel.clone(),
      rotVel: new THREE.Vector3(
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 14
      ),
      attackerId,
      team,
      fuse,
      smokeAccum: 0,
      mesh: group,
      ledMat,
    });
  }

  private tryPlayerFire() {
    if (this.activeVehicle && this.activeVehicleSeat < 2) {
      this.tryFireVehicle();
      return;
    }
    if (this.activeMountedMg) {
      this.tryFireMountedEmplacement();
      return;
    }
    if (!this.player.alive || this.isReloading || this.fireCooldown > 0) return;

    const spec = WEAPONS[this.activeWeapon];
    if (spec.fireMode !== 'AUTO' && !this.semiTriggerReleased) return;

    const state = this.weaponStates[this.activeWeapon];
    if (state.mag <= 0) {
      this.semiTriggerReleased = false;
      if (state.reserve > 0) {
        this.startReload();
      } else {
        soundEngine.playMechanicalClick(260, 0.04);
      }
      return;
    }

    state.mag -= 1;
    this.fireCooldown = 60 / spec.rpm;
    if (spec.fireMode !== 'AUTO') {
      this.semiTriggerReleased = false;
    }

    if (spec.fireMode === 'PUMP') {
      this.pumpAnimTimer = 0.55;
    }

    soundEngine.playGunshot(this.activeWeapon, 1.0);
    this.muzzleFlashTimer = 0.05;
    this.muzzleLight.color.setHex(spec.tracerColor);
    this.muzzleLight.intensity = spec.category === 'launcher' ? 5.6 : spec.suppressed ? 1.5 : 3.4;

    const vm = this.getOrCreateViewmodel(this.activeWeapon);
    vm.muzzleFlash.visible = !spec.suppressed;
    vm.muzzleFlash.rotation.z = Math.random() * Math.PI * 2;
    const muzzleWorld = new THREE.Vector3();
    vm.muzzlePoint.getWorldPosition(muzzleWorld);
    this.boltKick = 0.045;

    if (spec.category === 'launcher') {
      if (vm.warheadGroup) vm.warheadGroup.visible = false;
      const aimEuler = new THREE.Euler(
        this.player.pitch + this.recoilOffsetPitch,
        this.player.yaw + this.recoilOffsetYaw,
        0,
        'YXZ'
      );
      const camAimDir = new THREE.Vector3(0, 0, -1).applyEuler(aimEuler).normalize();
      this.raycaster.set(this.camera.position, camAimDir);
      this.raycaster.far = 260;
      const rHits = this.raycaster.intersectObjects(this.arena.staticRayMeshes, false);
      const aimPt =
        rHits.length > 0
          ? rHits[0].point.clone()
          : this.camera.position.clone().addScaledVector(camAimDir, 160);
      const rocketStart = this.camera.position.clone().addScaledVector(camAimDir, 0.75);
      const toPt = aimPt.sub(rocketStart);
      const rocketDir = toPt.lengthSq() > 16 ? toPt.normalize() : camAimDir;

      const hasLock = spec.guidance === 'lock_on' && this.lockProgress >= 1.0 && this.lockCandidateId;
      const targetVeh = hasLock && this.lockCandidateKind === 'vehicle' ? this.lockCandidateId : null;
      const targetAct = hasLock && this.lockCandidateKind === 'actor' ? this.lockCandidateId : null;
      const targetJet = hasLock && this.lockCandidateKind === 'jet' ? this.lockCandidateId : null;

      this.spawnRocket(
        rocketStart,
        rocketDir,
        this.player.id,
        this.player.team,
        spec.blastRadius ?? 7.0,
        spec.damage,
        spec.shortName,
        spec.guidance,
        spec.muzzleVelocity,
        spec.gravityScale,
        targetVeh,
        targetAct,
        this.activeWeapon === 'fgm148_javelin',
        targetJet
      );

      this.spawnSmokePuff(
        muzzleWorld.clone().addScaledVector(rocketDir, -0.35),
        new THREE.Vector3(0, 0.6, 0),
        0.55,
        0.35,
        1.6
      );
      this.cameraShake = Math.max(this.cameraShake, 0.24);
      this.lockProgress = 0;
      this.lockCompleteCuePlayed = false;

      if (this.config.mode === 'multiplayer') {
        this.mpClient.sendFire({
          weaponId: this.activeWeapon,
          ox: rocketStart.x,
          oy: rocketStart.y,
          oz: rocketStart.z,
          dx: rocketDir.x,
          dy: rocketDir.y,
          dz: rocketDir.z,
          kind: 'rocket',
        });
      }
    } else {
      if (spec.fireMode !== 'BOLT' && spec.fireMode !== 'PUMP') {
        this.spawnShellCasing(vm);
      } else {
        window.setTimeout(() => {
          if (!this.disposed && this.phase === 'playing') {
            this.spawnShellCasing(this.getOrCreateViewmodel(this.activeWeapon));
          }
        }, 320);
      }

      const horizSpeed = Math.hypot(this.player.velocity.x, this.player.velocity.z);
      const moveFactor = THREE.MathUtils.clamp(horizSpeed / 8.0, 0, 1);
      const baseSpread = this.isAds
        ? spec.adsSpread * (this.isSteadyAim ? 0.55 : 1.0)
        : spec.baseSpread;
      const totalSpread =
        baseSpread +
        moveFactor * spec.moveSpreadPenalty * (this.isAds ? (this.isSteadyAim ? 0.15 : 0.35) : 1);

      for (let p = 0; p < spec.pellets; p++) {
        _euler.set(
          this.player.pitch + this.recoilOffsetPitch + (Math.random() - 0.5) * 2 * totalSpread,
          this.player.yaw + this.recoilOffsetYaw + (Math.random() - 0.5) * 2 * totalSpread,
          0,
          'YXZ'
        );
        const bulletDir = new THREE.Vector3(0, 0, -1).applyEuler(_euler).normalize();
        this.spawnBallisticBullet(
          this.camera.position.clone(),
          muzzleWorld.clone(),
          bulletDir,
          spec.muzzleVelocity,
          spec.gravityScale,
          spec.damage,
          spec.headshotMult,
          spec.range,
          this.player.id,
          this.player.team,
          spec.shortName,
          spec.tracerColor
        );

        if (p === 0 && this.config.mode === 'multiplayer') {
          this.mpClient.sendFire({
            weaponId: this.activeWeapon,
            ox: muzzleWorld.x,
            oy: muzzleWorld.y,
            oz: muzzleWorld.z,
            dx: bulletDir.x,
            dy: bulletDir.y,
            dz: bulletDir.z,
            kind: 'bullet',
          });
        }
      }
    }

    const adsRecoilMult = this.isAds ? (this.isSteadyAim ? 0.45 : 0.62) : 1.0;
    this.recoilOffsetPitch = Math.min(0.28, this.recoilOffsetPitch + spec.recoilPitch * adsRecoilMult);
    this.recoilOffsetYaw += (Math.random() - 0.5) * 2 * spec.recoilYaw * adsRecoilMult;
    this.weaponKickZ = Math.min(
      0.18,
      this.weaponKickZ +
        (spec.category === 'launcher'
          ? 0.16
          : spec.category === 'shotgun' || spec.category === 'sniper'
          ? 0.12
          : 0.055)
    );
    this.weaponKickRotX = Math.min(
      0.34,
      this.weaponKickRotX +
        (spec.category === 'launcher' || spec.category === 'sniper' || spec.category === 'dmr'
          ? 0.2
          : 0.085)
    );

    if (state.mag === 0 && state.reserve > 0) {
      window.setTimeout(() => {
        if (!this.disposed && this.phase === 'playing') this.startReload();
      }, 160);
    }

    this.emitHud();
  }

  private spawnBallisticBullet(
    pos: THREE.Vector3,
    visualStart: THREE.Vector3,
    dir: THREE.Vector3,
    muzzleVelocity: number,
    gravityScale: number,
    damage: number,
    headshotMult: number,
    maxRange: number,
    attackerId: string,
    team: TeamId,
    weaponShort: string,
    tracerColor: number,
    splashRadius?: number
  ) {
    if (this.bullets.length > 96) {
      const oldest = this.bullets.shift();
      if (oldest) {
        this.scene.remove(oldest.mesh);
        oldest.mesh.traverse((o) => {
          if (o instanceof THREE.Mesh && o.material !== this.brassMat) {
            (o.material as THREE.Material).dispose();
          }
        });
      }
    }

    const group = new THREE.Group();
    const core = new THREE.Mesh(this.bulletCoreGeo, this.brassMat);
    core.position.z = -0.05;
    const tracerMat = new THREE.MeshBasicMaterial({
      color: tracerColor,
      transparent: true,
      opacity: 0.94,
      depthWrite: false,
    });
    const tail = new THREE.Mesh(this.tracerTailGeo, tracerMat);
    const speedScale = THREE.MathUtils.clamp(muzzleVelocity / 245, 0.9, 1.85);
    tail.scale.set(1, 1, speedScale);
    tail.position.z = 0.72 * speedScale;
    group.add(core, tail);
    group.position.copy(visualStart);
    group.lookAt(pos.clone().addScaledVector(dir, 10));
    this.scene.add(group);

    this.bullets.push({
      pos: pos.clone(),
      visualPos: visualStart.clone(),
      vel: dir.clone().multiplyScalar(muzzleVelocity),
      damage,
      headshotMult,
      maxRange,
      traveled: 0,
      gravityScale,
      attackerId,
      team,
      weaponShort,
      mesh: group,
      whizzed: false,
      splashRadius,
    });
  }

  private spawnRocket(
    pos: THREE.Vector3,
    dir: THREE.Vector3,
    attackerId: string,
    team: TeamId,
    blastRadius = 7.0,
    maxDamage = 175,
    weaponShort = 'RPG-7',
    guidance: 'none' | 'lock_on' | 'laser_guided' = 'none',
    speed = 58,
    gravityScale = 0.22,
    targetVehicleId: string | null = null,
    targetActorId: string | null = null,
    isTopAttack = false,
    targetJetId: string | null = null
  ) {
    const group = new THREE.Group();
    const isGuided = guidance !== 'none';
    const bodyMat = new THREE.MeshStandardMaterial({
      color: isGuided ? 0x334155 : 0x3f4e34,
      metalness: 0.45,
      roughness: 0.48,
    });
    const noseMat = new THREE.MeshStandardMaterial({
      color: isGuided ? 0x38bdf8 : 0xd97706,
      metalness: 0.7,
      roughness: 0.3,
    });
    const flameMat = new THREE.MeshBasicMaterial({
      color: isGuided ? 0x38bdf8 : 0xffa030,
      transparent: true,
      opacity: 0.95,
    });

    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.04, 0.5, 8), bodyMat);
    tube.rotation.x = Math.PI / 2;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.056, 0.24, 8), noseMat);
    cone.rotation.x = -Math.PI / 2;
    cone.position.z = -0.35;
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.052, 0.36, 7), flameMat);
    flame.rotation.x = Math.PI / 2;
    flame.position.z = 0.42;

    group.add(tube, cone, flame);
    group.position.copy(pos);
    group.lookAt(pos.clone().add(dir));
    this.scene.add(group);

    this.rockets.push({
      pos: pos.clone(),
      vel: dir.clone().multiplyScalar(speed),
      speed,
      attackerId,
      team,
      life: 5.5,
      age: 0,
      smokeAccum: 0,
      mesh: group,
      blastRadius,
      maxDamage,
      weaponShort,
      guidance,
      gravityScale,
      targetVehicleId,
      targetActorId,
      targetJetId,
      isTopAttack,
    });
  }

  private damageAirstrikeJet(
    jet: AirstrikeJet,
    strike: ActiveAirstrike,
    amount: number,
    attacker: CombatantActor | undefined,
    weaponShort: string
  ): boolean {
    if (jet.destroyed) return false;
    if (attacker && (this.isFfaLike() ? strike.attackerId === attacker.id : jet.team === attacker.team)) return false;

    jet.hp = Math.max(0, jet.hp - amount);
    if (jet.hp <= 0) {
      jet.destroyed = true;
      jet.crashing = true;
      jet.crashTimer = 2.6;
      jet.crashVel
        .copy(strike.dir)
        .multiplyScalar(54)
        .add(new THREE.Vector3((Math.random() - 0.5) * 12, -12, (Math.random() - 0.5) * 12));
      jet.crashSpin.set(
        (Math.random() - 0.5) * 1.4,
        (Math.random() - 0.5) * 0.9,
        (Math.random() > 0.5 ? 1 : -1) * 3.1
      );

      this.triggerExplosion(jet.position.clone(), 6.8, 0, undefined, weaponShort);

      if (attacker) {
        attacker.kills += 1;
        if (!this.isFfaLike()) {
          if (attacker.team === 'blue') this.blueScore += 1;
          else this.redScore += 1;
        }
        const wonGunGame = this.promoteGunGameActor(attacker);
        if (attacker.isPlayer) {
          this.registerPlayerKillStreak();
          this.lastEliminatedName = 'Strike Jet';
          this.lastEliminatedHeadshot = false;
          this.pickupNotice = 'Strike Jet Shot Down!';
          this.pickupNoticeTimer = 2.6;
        }
        if (this.config.mode === 'multiplayer' && attacker.isPlayer) {
          this.mpClient.sendBotKill(attacker.team, attacker.gunGameTier);
        }
        this.killFeed.unshift({
          id: this.killFeedSeq++,
          killerName: attacker.name,
          killerTeam: attacker.team,
          victimName: 'Strike Jet',
          victimTeam: jet.team,
          weaponShort,
          isHeadshot: false,
          timestamp: performance.now(),
        });
        if (this.killFeed.length > 5) this.killFeed.pop();

        if (wonGunGame || (this.config.matchMode === 'ffa' && attacker.kills >= this.config.scoreLimit)) {
          this.winnerName = attacker.name;
          this.endMatch();
        } else if (
          this.config.matchMode === 'tdm' &&
          (this.blueScore >= this.config.scoreLimit || this.redScore >= this.config.scoreLimit)
        ) {
          this.endMatch();
        }
      }

      if (strike.jets.every((j) => j.destroyed) && strike.bombsDropped < 6 && !strike.interceptedAnnounced) {
        strike.interceptedAnnounced = true;
        strike.beaconGroup.visible = false;
        if (!attacker?.isPlayer) {
          this.pickupNotice = 'Air Strike Intercepted!';
          this.pickupNoticeTimer = 2.6;
        }
      }
      return true;
    }

    return false;
  }

  private triggerExplosion(
    center: THREE.Vector3,
    radius: number,
    maxDamage: number,
    attacker: CombatantActor | undefined,
    weaponShort: string
  ) {
    const distToPlayer = this.player ? center.distanceTo(this.player.position) : 40;
    const vol = THREE.MathUtils.clamp(1.2 - distToPlayer / 85, 0.12, 1.0);
    soundEngine.playExplosion(vol);

    if (distToPlayer < 34) {
      this.cameraShake = Math.min(1.0, this.cameraShake + (1 - distToPlayer / 34) * 0.65);
    }

    this.explosionLight.position.copy(center).add(new THREE.Vector3(0, 0.85, 0));
    this.explosionLight.intensity = 10.5;
    this.explosionLightTimer = 0.35;

    const fireMat = new THREE.MeshBasicMaterial({
      color: 0xff7b1c,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const fireball = new THREE.Mesh(this.fireballGeo, fireMat);
    fireball.position.copy(center);
    fireball.scale.setScalar(0.35);
    this.scene.add(fireball);

    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfde047,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(this.shockRingGeo, ringMat);
    ring.position.copy(center).add(new THREE.Vector3(0, 0.14, 0));
    ring.rotation.x = -Math.PI / 2;
    this.scene.add(ring);

    this.explosions.push({ fireball, ring, life: 0.45, maxLife: 0.45, radius });
    this.spawnExplosionCrater(center, radius);

    for (let i = 0; i < 6; i++) {
      this.spawnSmokePuff(
        center.clone().add(
          new THREE.Vector3((Math.random() - 0.5) * 1.2, 0.3 + Math.random() * 0.7, (Math.random() - 0.5) * 1.2)
        ),
        new THREE.Vector3((Math.random() - 0.5) * 2.4, 2.4 + Math.random() * 2.6, (Math.random() - 0.5) * 2.4),
        1.15 + Math.random() * 0.45,
        0.55,
        2.5
      );
    }
    this.spawnSparks(center, 0xff9f2e, 14);

    const blastEye = center.clone().add(new THREE.Vector3(0, 0.35, 0));
    let bestHit: 'none' | 'body' | 'kill' = 'none';
    let killedName: string | null = null;

    // Damage Destructible Walls (crack & shatter under missiles, 105mm field guns, tank shells, grenades & barrels)
    for (const wall of this.arena.destructibleWalls) {
      if (wall.stage >= 3) continue;
      const halfX = wall.size.x * 0.5;
      const halfY = wall.size.y * 0.5;
      const halfZ = wall.size.z * 0.5;
      const clampedX = THREE.MathUtils.clamp(blastEye.x, wall.position.x - halfX, wall.position.x + halfX);
      const clampedY = THREE.MathUtils.clamp(blastEye.y, wall.position.y - halfY, wall.position.y + halfY);
      const clampedZ = THREE.MathUtils.clamp(blastEye.z, wall.position.z - halfZ, wall.position.z + halfZ);
      const wDist = Math.hypot(blastEye.x - clampedX, blastEye.y - clampedY, blastEye.z - clampedZ);
      if (wDist <= radius + 1.4) {
        const wFalloff = Math.max(0.28, 1 - wDist / (radius + 1.4));
        const wallDmg = Math.round(maxDamage * 2.15 * wFalloff);
        this.damageDestructibleWall(wall, wallDmg, new THREE.Vector3(clampedX, clampedY, clampedZ));
      }
    }

    // Chain-detonate Explosive Fuel Barrels caught in blast
    for (const barrel of this.arena.barrels) {
      if (barrel.destroyed) continue;
      const bCenter = new THREE.Vector3(barrel.position.x, barrel.position.y + 0.6, barrel.position.z);
      const bDist = blastEye.distanceTo(bCenter);
      if (bDist <= radius + 0.8) {
        const bFalloff = Math.max(0.3, 1 - bDist / (radius + 0.8));
        this.damageBarrel(barrel, Math.round(maxDamage * 1.35 * bFalloff), attacker, weaponShort);
      }
    }

    // Damage or wreck Mounted Emplacements caught in heavy blasts
    for (const mg of this.arena.mountedMgs) {
      if (mg.destroyed) continue;
      const mCenter = new THREE.Vector3(mg.position.x, mg.position.y + 0.9, mg.position.z);
      const mDist = blastEye.distanceTo(mCenter);
      if (mDist <= radius + 1.1) {
        const mFalloff = Math.max(0.25, 1 - mDist / (radius + 1.1));
        this.damageMountedMg(mg, Math.round(maxDamage * 0.95 * mFalloff), center, attacker, weaponShort);
      }
    }

    for (const v of this.arena.vehicles) {
      if (v.destroyed) continue;
      const vCenter = new THREE.Vector3(v.position.x, v.position.y + 1.0, v.position.z);
      const vDist = blastEye.distanceTo(vCenter);
      if (vDist <= radius + 1.8) {
        const vFalloff = Math.max(0.25, 1 - vDist / (radius + 1.8));
        const vDmg = Math.round(maxDamage * 1.25 * vFalloff);
        const destroyed = this.damageVehicle(v, vDmg, attacker);
        if (attacker?.isPlayer) {
          if (destroyed) bestHit = 'kill';
          else if (bestHit === 'none') bestHit = 'body';
        }
      }
    }

    if (!attacker) return;

    for (const victim of this.actors) {
      if (!victim.alive) continue;
      if (!this.isFfaLike() && victim.team === attacker.team && victim.id !== attacker.id) continue;

      const victimCenter = new THREE.Vector3(victim.position.x, victim.position.y + 1.05, victim.position.z);
      const dist = blastEye.distanceTo(victimCenter);
      if (dist > radius) continue;

      const losClear = this.hasLineOfSight(blastEye, victimCenter);
      const falloff = Math.pow(1 - dist / radius, 0.8);
      const selfMult = victim.id === attacker.id ? 0.55 : 1.0;
      const losMult = losClear ? 1.0 : 0.42;
      const dmg = Math.max(10, Math.round(maxDamage * falloff * selfMult * losMult));

      const killed = this.applyDamage(victim, attacker, dmg, false, weaponShort);
      if (attacker.isPlayer && victim.id !== attacker.id && (this.isFfaLike() || victim.team !== attacker.team)) {
        if (killed) {
          bestHit = 'kill';
          killedName = victim.name;
        } else if (bestHit === 'none') {
          bestHit = 'body';
        }
      }
    }

    if (bestHit !== 'none') {
      this.hitmarkerType = bestHit;
      this.hitmarkerTime = performance.now();
      if (bestHit === 'kill') {
        this.lastEliminatedName = killedName;
        this.lastEliminatedHeadshot = false;
      }
      soundEngine.playHitmarker(bestHit === 'kill', bestHit === 'kill');
    }
  }

  private damageDestructibleWall(
    wall: DestructibleWallNode,
    amount: number,
    impactPoint?: THREE.Vector3,
    fromRemote = false
  ) {
    if (wall.stage >= 3 || amount <= 0) return;
    wall.hp = Math.max(0, wall.hp - amount);
    const frac = wall.hp / wall.maxHp;
    const dist = this.player ? wall.position.distanceTo(this.player.position) : 40;
    const crumbleVol = THREE.MathUtils.clamp(1.15 - dist / 85, 0.08, 0.95);
    const pt = impactPoint ? impactPoint.clone() : wall.position.clone();

    if (wall.hp <= 0) {
      wall.stage = 3;
      wall.collider.disabled = true;
      wall.intactMesh.visible = false;
      wall.crackMesh.visible = false;
      wall.rubbleGroup.visible = true;
      const rayIdx = this.arena.staticRayMeshes.indexOf(wall.intactMesh);
      if (rayIdx >= 0) this.arena.staticRayMeshes.splice(rayIdx, 1);

      soundEngine.playWallCrumble(crumbleVol);
      this.spawnDebrisChunks(pt, wall.materialType, 14);
      for (let i = 0; i < 4; i++) {
        this.spawnSmokePuff(
          wall.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * wall.size.x * 0.6, 0.6, (Math.random() - 0.5) * wall.size.z * 0.6)),
          new THREE.Vector3((Math.random() - 0.5) * 1.4, 1.8, (Math.random() - 0.5) * 1.4),
          1.4,
          0.9,
          3.2
        );
      }
    } else if (frac <= 0.36 && wall.stage < 2) {
      wall.stage = 2;
      wall.crackMesh.visible = true;
      wall.crackMat.map = this.wallStage2Tex;
      wall.crackMat.needsUpdate = true;
      soundEngine.playWallCrumble(crumbleVol * 0.65);
      this.spawnDebrisChunks(pt, wall.materialType, 7);
      this.spawnSmokePuff(pt.clone(), new THREE.Vector3(0, 1.3, 0), 0.9, 0.45, 1.6);
    } else if (frac <= 0.72 && wall.stage < 1) {
      wall.stage = 1;
      wall.crackMesh.visible = true;
      soundEngine.playWallCrumble(crumbleVol * 0.38);
      this.spawnDebrisChunks(pt, wall.materialType, 4);
      this.spawnSmokePuff(pt.clone(), new THREE.Vector3(0, 0.9, 0), 0.7, 0.3, 1.1);
    }

    if (!fromRemote && this.config.mode === 'multiplayer') {
      this.mpClient.sendWallDamage(wall.id, amount);
    }
  }

  private damageBarrel(
    barrel: ExplosiveBarrelNode,
    amount: number,
    attacker: CombatantActor | undefined,
    weaponShort: string,
    fromRemote = false
  ): boolean {
    if (barrel.destroyed || amount <= 0) return false;
    barrel.hp = Math.max(0, barrel.hp - amount);

    if (barrel.hp > 0 && barrel.hp <= barrel.maxHp * 0.58 && !barrel.burning) {
      barrel.burning = true;
      const dist = this.player ? barrel.position.distanceTo(this.player.position) : 40;
      soundEngine.playBarrelHiss(THREE.MathUtils.clamp(1.1 - dist / 45, 0.08, 0.75));
      this.spawnSparks(barrel.position.clone().add(new THREE.Vector3(0, 0.85, 0)), 0xf97316, 6);
    }

    if (barrel.hp <= 0) {
      barrel.destroyed = true;
      barrel.burning = false;
      barrel.respawnTimer = 30;
      barrel.meshGroup.visible = false;
      barrel.collider.disabled = true;

      if (!fromRemote && this.config.mode === 'multiplayer') {
        this.mpClient.sendBarrelDamage(barrel.id, amount + 1);
      }

      const blastCenter = barrel.position.clone().add(new THREE.Vector3(0, 0.75, 0));
      if (!fromRemote) {
        const label = weaponShort && !weaponShort.includes('Barrel') ? `${weaponShort} · Barrel` : 'Fuel Barrel';
        this.triggerExplosion(blastCenter, 7.4, 170, attacker, label);
      } else {
        this.triggerExplosion(blastCenter, 7.4, 0, undefined, 'Fuel Barrel');
      }
      return true;
    }

    if (!fromRemote && this.config.mode === 'multiplayer' && amount >= 0.8) {
      this.mpClient.sendBarrelDamage(barrel.id, amount);
    }
    return false;
  }

  private damageMountedMg(
    mg: MountedMgNode,
    amount: number,
    impactPoint: THREE.Vector3,
    attacker?: CombatantActor,
    weaponShort = 'Blast',
    fromRemote = false
  ): boolean {
    if (mg.destroyed || amount <= 0) return false;
    mg.hp = Math.max(0, mg.hp - amount);
    if (mg.hp <= 0) {
      this.destroyMountedMg(mg, impactPoint, attacker, weaponShort, fromRemote);
      return true;
    }
    return false;
  }

  private destroyMountedMg(
    mg: MountedMgNode,
    impactPoint?: THREE.Vector3,
    attacker?: CombatantActor,
    weaponShort = 'Vehicle Ram',
    fromRemote = false
  ) {
    if (mg.destroyed) return;
    mg.destroyed = true;
    mg.hp = 0;
    mg.muzzleFlash.visible = false;
    mg.yawGroup.visible = false;
    mg.wreckGroup.visible = true;
    if (mg.sandbagMesh) {
      mg.sandbagMesh.visible = false;
      const idx = this.arena.staticRayMeshes.indexOf(mg.sandbagMesh);
      if (idx >= 0) this.arena.staticRayMeshes.splice(idx, 1);
    }
    if (mg.sandbagCollider) {
      mg.sandbagCollider.disabled = true;
    }

    if (this.repairingMg === mg) {
      this.repairingMg = null;
      this.repairTimer = 0;
    }
    if (this.activeMountedMg === mg) {
      this.activeMountedMg = null;
      this.mgReloading = false;
      this.mgReloadTimer = 0;
      this.weaponPivot.visible = true;
      if (this.player?.alive) {
        this.applyDamage(this.player, attacker ?? this.player, 68, false, weaponShort);
        this.cameraShake = Math.max(this.cameraShake, 0.55);
      }
    }

    const pt = impactPoint ? impactPoint.clone() : mg.position.clone().add(new THREE.Vector3(0, 0.8, 0));
    const dist = this.player ? mg.position.distanceTo(this.player.position) : 40;
    const vol = THREE.MathUtils.clamp(1.15 - dist / 85, 0.08, 0.95);
    soundEngine.playVehicleRam(true, vol);
    this.spawnSparks(pt.clone().add(new THREE.Vector3(0, 0.7, 0)), 0xfbbf24, 14);
    this.spawnDebrisChunks(pt, 'steel', 8);
    this.spawnSmokePuff(pt.clone().add(new THREE.Vector3(0, 0.6, 0)), new THREE.Vector3(0, 1.5, 0), 1.1, 0.65, 2.2);

    if (!fromRemote && this.config.mode === 'multiplayer') {
      this.mpClient.sendMountDestroy(mg.id);
    }
  }

  private damageVehicle(
    v: VehicleNode,
    amount: number,
    attacker: CombatantActor | undefined
  ): boolean {
    if (v.destroyed) return false;
    if (attacker && this.isFriendlyOccupiedVehicle(v, attacker.team) && !this.isEnemyOccupiedVehicle(v, attacker.team)) {
      const playerInside = v.seats.includes(attacker.id);
      if (!playerInside) return false;
    }

    v.health = Math.max(0, v.health - amount);
    if (v.health > 0) {
      const baseColor =
        v.teamHint === 'blue' ? 0x2c4a70 : v.teamHint === 'red' ? 0x6b2c2a : 0x4b533b;
      const dmgFrac = 1 - v.health / v.maxHealth;
      v.bodyMat.color.setHex(baseColor).lerp(new THREE.Color(0x23262d), dmgFrac * 0.65);
    }
    if (v.seats.includes(this.player?.id)) {
      soundEngine.playDamageTaken();
      this.cameraShake = Math.min(0.65, this.cameraShake + amount * 0.004);
    }

    if (v.health <= 0) {
      v.destroyed = true;
      v.respawnTimer = 20;
      v.speed = 0;
      v.muzzleFlash.visible = false;
      v.bodyMat.color.setHex(0x1f242b);

      const occupantActors: CombatantActor[] = [];
      for (const sid of v.seats) {
        if (!sid) continue;
        const occ = this.actors.find((a) => a.id === sid);
        if (occ) occupantActors.push(occ);
      }

      if (this.activeVehicle === v) {
        this.exitVehicle(true);
      }
      for (let s = 0; s < v.seats.length; s++) {
        v.seats[s] = null;
      }

      if (attacker) {
        for (const occActor of occupantActors) {
          occActor.vehicleId = null;
          occActor.vehicleSeat = null;
          if (occActor.alive) {
            this.applyDamage(occActor, attacker, 165, false, 'Vehicle Blast');
          }
        }
      }

      this.triggerExplosion(
        v.position.clone().add(new THREE.Vector3(0, 1.0, 0)),
        7.5,
        135,
        attacker,
        'Vehicle Blast'
      );
      return true;
    }

    return false;
  }

  private applyDamage(
    victim: CombatantActor,
    attacker: CombatantActor,
    amount: number,
    isHeadshot: boolean,
    weaponShort: string
  ): boolean {
    if (!victim.alive || victim.spawnShieldTimer > 0) return false;

    // Remote human damage is sent over network to that player
    if (victim.isHuman && !victim.isPlayer && attacker.isPlayer && this.config.mode === 'multiplayer') {
      const wouldKill = victim.health - amount <= 0;
      this.mpClient.sendHit({
        targetId: victim.id.replace('hum-', ''),
        damage: amount,
        isHeadshot,
        weaponShort,
      });
      victim.health = Math.max(0, victim.health - amount);
      if (wouldKill) {
        attacker.kills += 1;
        const wonGunGame = this.promoteGunGameActor(attacker);
        this.registerPlayerKillStreak();
        if (wonGunGame || (this.config.matchMode === 'ffa' && attacker.kills >= this.config.scoreLimit)) {
          this.winnerName = attacker.name;
          this.endMatch();
        }
      }
      return wouldKill;
    }

    const now = performance.now();
    victim.health = Math.max(0, victim.health - amount);
    victim.lastDamagedBy[attacker.id] = now;

    if (victim.isPlayer) {
      soundEngine.playDamageTaken();
      this.cameraShake = Math.min(0.85, this.cameraShake + amount * 0.005);
      const dx = attacker.position.x - victim.position.x;
      const dz = attacker.position.z - victim.position.z;
      const worldAngle = Math.atan2(-dx, -dz);
      const relAngle = worldAngle - victim.yaw;
      this.damageIndicators.push({
        id: this.dmgSeq++,
        angleRad: relAngle,
        intensity: THREE.MathUtils.clamp(amount / 45, 0.45, 1.0),
        expiresAt: now + 950,
      });
    }

    if (victim.health <= 0) {
      victim.alive = false;
      victim.deaths += 1;
      victim.respawnTimer = 3.2;
      victim.deathAnimTimer = 0;

      if (victim.isPlayer) {
        this.streakCurrent = 0;
        this.uavActiveTimer = 0;
        if (this.activeMountedMg) {
          this.activeMountedMg.muzzleFlash.visible = false;
          this.activeMountedMg = null;
        }
        if (this.activeVehicle) {
          this.exitVehicle(true);
        }
        this.isCookingGrenade = false;
        this.arsenalOpen = false;
      } else {
        for (const v of this.arena.vehicles) {
          for (let s = 0; s < v.seats.length; s++) {
            if (v.seats[s] === victim.id) v.seats[s] = null;
          }
        }
        victim.vehicleId = null;
        victim.vehicleSeat = null;
      }

      let wonGunGame = false;
      if (victim.id !== attacker.id) {
        attacker.kills += 1;
        if (attacker.isPlayer) {
          this.registerPlayerKillStreak();
        }
        if (!this.isFfaLike()) {
          if (attacker.team === 'blue') this.blueScore += 1;
          else this.redScore += 1;
        }
        wonGunGame = this.promoteGunGameActor(attacker);
        if (this.config.mode === 'multiplayer' && !victim.isHuman && attacker.isPlayer) {
          this.mpClient.sendBotKill(attacker.team, attacker.gunGameTier);
        }
      }

      if (!this.isFfaLike()) {
        for (const [otherId, ts] of Object.entries(victim.lastDamagedBy)) {
          if (otherId !== attacker.id && now - ts < 5500) {
            const assister = this.actors.find((a) => a.id === otherId);
            if (assister && assister.team === attacker.team) {
              assister.assists += 1;
            }
          }
        }
      }

      this.killFeed.unshift({
        id: this.killFeedSeq++,
        killerName: attacker.name,
        killerTeam: attacker.team,
        victimName: victim.name,
        victimTeam: victim.team,
        weaponShort,
        isHeadshot,
        timestamp: now,
      });
      if (this.killFeed.length > 5) this.killFeed.pop();

      if (wonGunGame || (this.config.matchMode === 'ffa' && attacker.kills >= this.config.scoreLimit)) {
        this.winnerName = attacker.name;
        this.endMatch();
      } else if (
        this.config.matchMode === 'tdm' &&
        (this.blueScore >= this.config.scoreLimit || this.redScore >= this.config.scoreLimit)
      ) {
        this.endMatch();
      }
      return true;
    }

    return false;
  }

  private registerPlayerKillStreak() {
    this.streakCurrent += 1;
    if (this.streakCurrent > this.streakBest) {
      this.streakBest = this.streakCurrent;
    }

    if (this.streakCurrent === 2) {
      this.uavActiveTimer = 25;
      this.streakBanner = '2 KILL STREAK · UAV RECON ACTIVE (25s)';
      this.streakBannerTimer = 3.5;
      soundEngine.playStreakCue(1);
    } else if (this.streakCurrent === 4) {
      this.airstrikeCharges += 1;
      this.streakBanner = '4 KILL STREAK · PRECISION AIR STRIKE READY [X]';
      this.streakBannerTimer = 4.0;
      soundEngine.playStreakCue(2);
    } else if (this.streakCurrent === 6 || (this.streakCurrent > 6 && this.streakCurrent % 4 === 0)) {
      this.airstrikeCharges += 2;
      this.uavActiveTimer = Math.max(this.uavActiveTimer, 25);
      this.streakBanner = `${this.streakCurrent} KILL STREAK · HEAVY BOMBER BARRAGE READY [X]`;
      this.streakBannerTimer = 4.2;
      soundEngine.playStreakCue(3);
    }
  }

  private endMatch() {
    if (this.phase === 'ended') return;
    this.phase = 'ended';
    this.arsenalOpen = false;
    this.mouseDownLeft = false;
    this.mouseDownRight = false;
    this.isAds = false;
    this.isCookingGrenade = false;
    this.activeMountedMg = null;
    soundEngine.updateVehicleEngine(false, 0, false);
    if (this.activeVehicle) {
      for (let s = 0; s < this.activeVehicle.seats.length; s++) {
        if (this.activeVehicle.seats[s] === this.player.id) this.activeVehicle.seats[s] = null;
      }
      this.activeVehicle = null;
      this.activeVehicleSeat = 0;
    }
    if (document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock();
    }

    if (this.isFfaLike()) {
      const sorted = [...this.actors].sort(
        (a, b) => b.gunGameTier - a.gunGameTier || b.kills - a.kills || a.deaths - b.deaths
      );
      const top = sorted[0];
      this.winnerName = this.winnerName || top?.name || null;
      this.winner = top ? top.team : 'draw';
      soundEngine.playMatchEnd(this.winnerName === this.player?.name);
    } else {
      this.winnerName = null;
      if (this.blueScore > this.redScore) this.winner = 'blue';
      else if (this.redScore > this.blueScore) this.winner = 'red';
      else this.winner = 'draw';
      soundEngine.playMatchEnd(this.winner === this.player?.team);
    }

    this.emitHud();
  }

  private respawnActor(actor: CombatantActor) {
    const isFfa = this.isFfaLike();
    const spawns = isFfa
      ? [...this.arena.blueSpawns, ...this.arena.redSpawns]
      : actor.team === 'blue'
      ? this.arena.blueSpawns
      : this.arena.redSpawns;
    let bestSpawn = spawns[0];
    let bestMinEnemyDist = -1;

    for (const sp of spawns) {
      let minDist = 9999;
      for (const other of this.actors) {
        if (other.alive && other.id !== actor.id && (isFfa || other.team !== actor.team)) {
          const d = sp.distanceTo(other.position);
          if (d < minDist) minDist = d;
        }
      }
      if (minDist > bestMinEnemyDist) {
        bestMinEnemyDist = minDist;
        bestSpawn = sp;
      }
    }

    actor.position.copy(bestSpawn);
    actor.position.x += (Math.random() - 0.5) * 1.4;
    actor.velocity.set(0, 0, 0);
    actor.health = actor.maxHealth;
    actor.alive = true;
    actor.spawnShieldTimer = 1.4;
    actor.lastDamagedBy = {};
    actor.yaw = isFfa
      ? Math.atan2(actor.position.x, actor.position.z)
      : actor.team === 'blue'
      ? 0
      : Math.PI;
    actor.pitch = 0;

    if (actor.isPlayer) {
      if (this.config.matchMode === 'gun_game') {
        const curWid = GUN_GAME_LADDER[Math.min(actor.gunGameTier, GUN_GAME_LADDER.length - 1)];
        this.loadout = [curWid, curWid, curWid];
        this.weaponStates[curWid] = {
          id: curWid,
          mag: WEAPONS[curWid].magSize,
          reserve: WEAPONS[curWid].reserveMax,
        };
        this.selectSlot(0, true);
      } else {
        for (const wid of this.loadout) {
          this.weaponStates[wid] = {
            id: wid,
            mag: WEAPONS[wid].magSize,
            reserve: WEAPONS[wid].reserveMax,
          };
        }
      }
      this.grenades = 2;
      this.isCookingGrenade = false;
      this.activeMountedMg = null;
      this.activeVehicle = null;
      this.isReloading = false;
      this.reloadTimer = 0;
      this.recoilOffsetPitch = 0;
      this.recoilOffsetYaw = 0;
    } else if (actor.rig) {
      actor.rig.root.visible = true;
      actor.rig.bodyPivot.rotation.set(0, 0, 0);
      actor.rig.bodyPivot.position.y = 0;
    }
  }

  private spawnSmokePuff(
    pos: THREE.Vector3,
    vel: THREE.Vector3,
    life: number,
    startScale: number,
    endScale: number
  ) {
    if (this.smokePuffs.length > 56) return;
    const mat = new THREE.MeshStandardMaterial({
      color: 0x9ca3af,
      roughness: 0.96,
      metalness: 0,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(this.smokeGeo, mat);
    mesh.position.copy(pos);
    mesh.scale.setScalar(startScale);
    this.scene.add(mesh);
    this.smokePuffs.push({ mesh, vel, life, maxLife: life, startScale, endScale });
  }

  private spawnBulletHoleDecal(hit: THREE.Intersection, scale = 1.0) {
    if (!hit.face) return;
    if (this.bulletHoles.length >= 120) {
      const oldest = this.bulletHoles.shift();
      if (oldest) this.scene.remove(oldest);
    }
    const normal = hit.face.normal.clone();
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
    normal.applyMatrix3(normalMatrix).normalize();

    const decal = new THREE.Mesh(this.holeGeo, this.bulletHoleMat);
    decal.position.copy(hit.point).addScaledVector(normal, 0.015);
    decal.lookAt(hit.point.clone().add(normal));
    decal.rotateZ(Math.random() * Math.PI * 2);
    decal.scale.setScalar(scale);
    this.scene.add(decal);
    this.bulletHoles.push(decal);
  }

  private spawnExplosionCrater(center: THREE.Vector3, radius: number) {
    const gY = groundHeightAt(center.x, center.z, center.y + 1.5, this.arena);
    const craterDiam = THREE.MathUtils.clamp(radius * 0.68, 2.3, 6.2);

    if (Math.abs(center.y - gY) <= 2.6) {
      if (this.blastCraters.length >= 48) {
        const oldest = this.blastCraters.shift();
        if (oldest) this.scene.remove(oldest);
      }
      const group = new THREE.Group();
      group.position.set(center.x, gY + 0.025, center.z);

      const decal = new THREE.Mesh(this.craterDecalGeo, this.craterDecalMat);
      decal.rotation.x = -Math.PI / 2;
      decal.rotation.z = Math.random() * Math.PI * 2;
      decal.scale.set(craterDiam, craterDiam, 1);
      decal.renderOrder = 2;
      group.add(decal);

      const rim = new THREE.Mesh(this.craterRimGeo, this.craterRimMat);
      rim.position.y = 0.03;
      rim.scale.set(craterDiam * 0.48, 0.24, craterDiam * 0.48);
      group.add(rim);

      const rubbleCount = 5;
      for (let i = 0; i < rubbleCount; i++) {
        const a = (i / rubbleCount) * Math.PI * 2 + Math.random() * 0.8;
        const dist = craterDiam * (0.24 + Math.random() * 0.16);
        const chip = new THREE.Mesh(this.craterRubbleGeo, this.craterRimMat);
        chip.position.set(Math.cos(a) * dist, 0.06, Math.sin(a) * dist);
        chip.rotation.set(Math.random() * 3, Math.random() * 3, 0);
        chip.scale.set(0.7 + Math.random() * 0.9, 0.5 + Math.random() * 0.6, 0.7 + Math.random() * 0.9);
        group.add(chip);
      }

      this.scene.add(group);
      this.blastCraters.push(group);
    }

    // Scorch nearby walls/structures caught in the blast
    const scorchRays = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, -1),
    ];
    const origin = new THREE.Vector3(center.x, Math.max(gY + 0.75, center.y), center.z);
    const maxRay = Math.min(4.8, radius * 0.62);
    for (const dir of scorchRays) {
      this.raycaster.set(origin, dir);
      this.raycaster.far = maxRay;
      const hits = this.raycaster.intersectObjects(this.arena.staticRayMeshes, false);
      const hit = hits[0];
      if (!hit || !hit.face) continue;
      const normal = hit.face.normal
        .clone()
        .applyMatrix3(new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld))
        .normalize();
      if (Math.abs(normal.y) > 0.65) continue;

      if (this.wallScorches.length >= 40) {
        const oldest = this.wallScorches.shift();
        if (oldest) this.scene.remove(oldest);
      }
      const scorch = new THREE.Mesh(this.craterDecalGeo, this.wallScorchMat);
      scorch.position.copy(hit.point).addScaledVector(normal, 0.02);
      scorch.lookAt(hit.point.clone().add(normal));
      scorch.rotateZ(Math.random() * Math.PI * 2);
      scorch.scale.setScalar(THREE.MathUtils.clamp(radius * 0.42, 1.5, 3.2));
      scorch.renderOrder = 2;
      this.scene.add(scorch);
      this.wallScorches.push(scorch);
    }
  }

  private spawnSparks(point: THREE.Vector3, colorHex: number, count: number) {
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.95,
      });
      const mesh = new THREE.Mesh(this.sparkGeo, mat);
      mesh.position.copy(point);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 7,
        Math.random() * 4.5 + 1.0,
        (Math.random() - 0.5) * 7
      );
      this.scene.add(mesh);
      this.sparks.push({ mesh, vel, life: 0.24, maxLife: 0.24 });
    }
  }

  private spawnDebrisChunks(
    point: THREE.Vector3,
    materialType: 'concrete' | 'sandstone' | 'steel',
    count: number
  ) {
    if (this.debrisChunks.length > 70) return;
    const mat =
      materialType === 'sandstone'
        ? this.sandstoneDebrisMat
        : materialType === 'steel'
        ? this.steelDebrisMat
        : this.concreteDebrisMat;

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.debrisGeo, mat);
      mesh.position.copy(point).add(
        new THREE.Vector3((Math.random() - 0.5) * 1.4, Math.random() * 0.9, (Math.random() - 0.5) * 1.4)
      );
      mesh.scale.set(0.6 + Math.random() * 1.1, 0.5 + Math.random() * 0.9, 0.6 + Math.random() * 1.1);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 11,
        3.2 + Math.random() * 7.5,
        (Math.random() - 0.5) * 11
      );
      const rotVel = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      this.scene.add(mesh);
      this.debrisChunks.push({ mesh, vel, rotVel, life: 1.6 + Math.random() * 0.7 });
    }
  }

  private clearDynamicEffects() {
    for (const b of this.bullets) {
      this.scene.remove(b.mesh);
      b.mesh.traverse((o) => {
        if (o instanceof THREE.Mesh && o.material !== this.brassMat) {
          (o.material as THREE.Material).dispose();
        }
      });
    }
    this.bullets = [];

    for (const r of this.rockets) {
      this.scene.remove(r.mesh);
      r.mesh.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
      });
    }
    this.rockets = [];

    for (const g of this.activeGrenades) {
      this.scene.remove(g.mesh);
      g.mesh.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          if (o.material !== this.oliveGrenadeMat && o.material !== this.brassMat) {
            (o.material as THREE.Material).dispose();
          }
        }
      });
    }
    this.activeGrenades = [];

    for (const as of this.airstrikes) {
      this.scene.remove(as.beaconGroup);
      as.beaconGroup.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
      });
      for (const jet of as.jets) {
        this.scene.remove(jet.group);
        jet.group.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            o.geometry.dispose();
            if (o.material !== this.jetMat) (o.material as THREE.Material).dispose();
          }
        });
      }
    }
    this.airstrikes = [];

    for (const s of this.smokePuffs) {
      this.scene.remove(s.mesh);
      (s.mesh.material as THREE.Material).dispose();
    }
    this.smokePuffs = [];

    for (const ex of this.explosions) {
      this.scene.remove(ex.fireball);
      this.scene.remove(ex.ring);
      (ex.fireball.material as THREE.Material).dispose();
      (ex.ring.material as THREE.Material).dispose();
    }
    this.explosions = [];

    for (const sp of this.sparks) {
      this.scene.remove(sp.mesh);
      (sp.mesh.material as THREE.Material).dispose();
    }
    this.sparks = [];

    for (const sh of this.shells) {
      this.scene.remove(sh.mesh);
    }
    this.shells = [];

    for (const dc of this.debrisChunks) {
      this.scene.remove(dc.mesh);
    }
    this.debrisChunks = [];

    for (const h of this.bulletHoles) {
      this.scene.remove(h);
    }
    this.bulletHoles = [];

    for (const cr of this.blastCraters) {
      this.scene.remove(cr);
    }
    this.blastCraters = [];

    for (const ws of this.wallScorches) {
      this.scene.remove(ws);
    }
    this.wallScorches = [];

    while (this.dugTrenches.length > 0) {
      this.removeDugTrenchAt(0);
    }
  }

  private hasLineOfSight(from: THREE.Vector3, to: THREE.Vector3): boolean {
    _vecC.copy(to).sub(from);
    const dist = _vecC.length();
    if (dist < 0.01) return true;
    _vecC.divideScalar(dist);
    this.raycaster.set(from, _vecC);
    this.raycaster.far = dist;
    const hits = this.raycaster.intersectObjects(this.arena.staticRayMeshes, false);
    return hits.length === 0;
  }

  private updateLockOn(dt: number) {
    const spec = WEAPONS[this.activeWeapon];
    if (
      !this.player.alive ||
      this.activeMountedMg ||
      this.activeVehicle ||
      this.arsenalOpen ||
      spec.guidance !== 'lock_on' ||
      !this.isAds
    ) {
      this.lockCandidateId = null;
      this.lockCandidateName = null;
      this.lockCandidateKind = null;
      this.lockProgress = 0;
      this.lockCompleteCuePlayed = false;
      return;
    }

    const camDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();
    let bestScore = 0.962; // ~15.8 degree cone
    let bestId: string | null = null;
    let bestName: string | null = null;
    let bestKind: 'vehicle' | 'actor' | 'jet' | null = null;

    for (const strike of this.airstrikes) {
      for (const jet of strike.jets) {
        const friendlyJet = this.isFfaLike() ? strike.attackerId === this.player.id : jet.team === this.player.team;
        if (jet.destroyed || friendlyJet) continue;
        const toJet = jet.position.clone().sub(this.camera.position);
        const dist = toJet.length();
        if (dist > 560 || dist < 8) continue;
        const dot = toJet.divideScalar(dist).dot(camDir);
        if (dot > bestScore) {
          bestScore = dot;
          bestId = jet.id;
          bestName = 'Strike Jet';
          bestKind = 'jet';
        }
      }
    }

    for (const v of this.arena.vehicles) {
      if (v.destroyed) continue;
      if (this.isFriendlyOccupiedVehicle(v, this.player.team) && !this.isEnemyOccupiedVehicle(v, this.player.team)) {
        continue;
      } else if (!this.isFfaLike() && v.seats.every((s) => s === null) && v.teamHint === this.player.team) {
        continue;
      }
      const center = new THREE.Vector3(v.position.x, v.position.y + (v.type === 'attack_heli' ? 1.8 : 1.1), v.position.z);
      const toV = center.sub(this.camera.position);
      const dist = toV.length();
      if (dist > 520 || dist < 6) continue;
      const dot = toV.divideScalar(dist).dot(camDir);
      if (dot > bestScore) {
        bestScore = dot;
        bestId = v.id;
        bestName = v.name;
        bestKind = 'vehicle';
      }
    }

    for (const a of this.actors) {
      if (!a.alive || a.id === this.player.id || (!this.isFfaLike() && a.team === this.player.team)) continue;
      const center = new THREE.Vector3(a.position.x, a.position.y + 1.1, a.position.z);
      const toA = center.sub(this.camera.position);
      const dist = toA.length();
      if (dist > 420 || dist < 6) continue;
      const dot = toA.divideScalar(dist).dot(camDir);
      if (dot > bestScore) {
        bestScore = dot;
        bestId = a.id;
        bestName = a.name;
        bestKind = 'actor';
      }
    }

    if (bestId && bestId === this.lockCandidateId) {
      this.lockProgress = Math.min(1, this.lockProgress + dt / 0.8);
      if (this.lockProgress >= 1) {
        if (!this.lockCompleteCuePlayed) {
          this.lockCompleteCuePlayed = true;
          soundEngine.playLockTone(true);
        }
      } else {
        this.lockTickAccum += dt;
        if (this.lockTickAccum >= 0.22) {
          this.lockTickAccum = 0;
          soundEngine.playLockTone(false);
        }
      }
    } else if (bestId) {
      this.lockCandidateId = bestId;
      this.lockCandidateName = bestName;
      this.lockCandidateKind = bestKind;
      this.lockProgress = 0.08;
      this.lockCompleteCuePlayed = false;
      this.lockTickAccum = 0;
    } else {
      this.lockCandidateId = null;
      this.lockCandidateName = null;
      this.lockCandidateKind = null;
      this.lockProgress = Math.max(0, this.lockProgress - dt * 2.5);
      this.lockCompleteCuePlayed = false;
    }
  }

  private updatePlayer(dt: number) {
    const p = this.player;
    if (p.spawnShieldTimer > 0) p.spawnShieldTimer = Math.max(0, p.spawnShieldTimer - dt);

    if (this.uavActiveTimer > 0) this.uavActiveTimer = Math.max(0, this.uavActiveTimer - dt);
    if (this.streakBannerTimer > 0) {
      this.streakBannerTimer = Math.max(0, this.streakBannerTimer - dt);
      if (this.streakBannerTimer <= 0) this.streakBanner = null;
    }

    if (this.explosionLightTimer > 0) {
      this.explosionLightTimer -= dt;
      this.explosionLight.intensity = Math.max(0, (this.explosionLightTimer / 0.35) * 10.5);
    }
    this.cameraShake = Math.max(0, this.cameraShake - dt * 2.2);
    const shakeX = (Math.random() - 0.5) * this.cameraShake * 0.08;
    const shakeY = (Math.random() - 0.5) * this.cameraShake * 0.08;

    if (this.hmgFlashTimer > 0) {
      this.hmgFlashTimer -= dt;
      if (this.hmgFlashTimer <= 0) {
        for (const mg of this.arena.mountedMgs) mg.muzzleFlash.visible = false;
        this.muzzleLight.intensity = 0;
      }
    }

    if (this.vehicleFlashTimer > 0) {
      this.vehicleFlashTimer -= dt;
      if (this.vehicleFlashTimer <= 0) {
        for (const v of this.arena.vehicles) v.muzzleFlash.visible = false;
        this.muzzleLight.intensity = 0;
      }
    }

    if (this.hangarServiceCooldown > 0) {
      this.hangarServiceCooldown = Math.max(0, this.hangarServiceCooldown - dt);
    }

    if (!p.alive) {
      soundEngine.updateVehicleEngine(false, 0, false);
      soundEngine.updateHelicopterAudio(false, 0, false);
      p.respawnTimer -= dt;
      if (p.respawnTimer <= 0) {
        this.respawnActor(p);
      }
      this.camera.position.set(p.position.x, p.position.y + 1.9, p.position.z);
      this.camera.rotation.set(-0.35, p.yaw, 0, 'YXZ');
      this.weaponPivot.visible = false;
      this.nearMountedMg = null;
      this.nearDestroyedMg = null;
      this.repairingMg = null;
      this.isDiggingTrench = false;
      this.nearVehicle = null;
      this.nearArsenalName = null;
      this.nearHangar = null;
      return;
    }

    // Proximity checks (Arsenal Armory, Mini Hangars, Vehicles, Mounted Turrets/Field Guns, Destroyed Mounts)
    this.nearArsenalName = null;
    this.nearHangar = null;
    this.nearVehicle = null;
    this.nearMountedMg = null;
    this.nearDestroyedMg = null;

    const refPos = this.activeVehicle ? this.activeVehicle.position : p.position;
    let bestHangarDist = this.activeVehicle ? 12.8 : 6.4;
    const maxHangarDy = this.activeVehicle ? 6.8 : 3.2;
    for (const hg of this.arena.hangars) {
      const d = Math.hypot(refPos.x - hg.position.x, refPos.z - hg.position.z);
      if (d < bestHangarDist && Math.abs(refPos.y - hg.position.y) < maxHangarDy) {
        bestHangarDist = d;
        this.nearHangar = hg;
      }
    }

    if (!this.activeMountedMg && !this.activeVehicle) {
      for (const ar of this.arena.arsenals) {
        const d = Math.hypot(p.position.x - ar.position.x, p.position.z - ar.position.z);
        if (d < 4.9 && Math.abs(p.position.y - ar.position.y) < 2.6) {
          this.nearArsenalName = ar.name;
          break;
        }
      }

      if (!this.nearArsenalName) {
        let bestVehDist = 5.4;
        for (const v of this.arena.vehicles) {
          if (v.destroyed) continue;
          if (this.isEnemyOccupiedVehicle(v, p.team)) continue;
          if (this.getVehicleFirstFreeSeat(v) === -1) continue;
          const d = Math.hypot(p.position.x - v.position.x, p.position.z - v.position.z);
          if (d < bestVehDist && Math.abs(p.position.y - v.position.y) < 2.6) {
            bestVehDist = d;
            this.nearVehicle = v;
          }
        }
      }

      if (!this.nearArsenalName && !this.nearVehicle) {
        let bestDist = 2.9;
        for (const mg of this.arena.mountedMgs) {
          if (mg.destroyed) continue;
          const d = Math.hypot(p.position.x - mg.position.x, p.position.z - mg.position.z);
          if (d < bestDist && Math.abs(p.position.y - mg.position.y) < 1.9) {
            bestDist = d;
            this.nearMountedMg = mg;
          }
        }
      }

      if (!this.nearArsenalName && !this.nearVehicle && !this.nearMountedMg) {
        let bestDeadDist = 3.4;
        for (const mg of this.arena.mountedMgs) {
          if (!mg.destroyed) continue;
          const d = Math.hypot(p.position.x - mg.position.x, p.position.z - mg.position.z);
          if (d < bestDeadDist && Math.abs(p.position.y - mg.position.y) < 2.0) {
            bestDeadDist = d;
            this.nearDestroyedMg = mg;
          }
        }
      }
    }

    if (this.fireCooldown > 0) this.fireCooldown -= dt;

    // 1. Tactical Multi-Seat Vehicle & Attack Helicopter Mode
    if (this.activeVehicle) {
      const v = this.activeVehicle;
      if (this.nearHangar && this.hangarServiceCooldown <= 0) {
        this.serviceVehicleAtHangar(v, this.nearHangar);
      }
      const seat = this.activeVehicleSeat;
      const isDriver = seat === 0;
      const isGunner = seat === 1;
      const isPassengerPort = seat >= 2;
      const wantZoom = this.mouseDownRight || this.adsToggle;
      if (v.type === 'attack_heli') {
        const wantZoom = this.mouseDownRight || this.adsToggle;
        soundEngine.updateVehicleEngine(false, 0, false);

        v.rotorRpm = Math.min(1, v.rotorRpm + dt * 0.52);

        const kbFwd =
          (this.keys['KeyW'] || this.keys['ArrowUp'] ? 1 : 0) -
          (this.keys['KeyS'] || this.keys['ArrowDown'] ? 1 : 0);
        const kbStrafe =
          (this.keys['KeyD'] || this.keys['ArrowRight'] ? 1 : 0) -
          (this.keys['KeyA'] || this.keys['ArrowLeft'] ? 1 : 0);
        const cyclicFwd = seat === 0 ? (Math.abs(kbFwd) > 0 ? kbFwd : this.touchMoveY) : 0;
        const cyclicStrafe = seat === 0 ? (Math.abs(kbStrafe) > 0 ? kbStrafe : this.touchMoveX) : 0;

        const ascendPressed = Boolean(this.keys['Space']) || this.touchHeliAscend;
        const descendPressed = Boolean(this.keys['ControlLeft'] || this.keys['ControlRight'] || this.keys['KeyQ']) || this.touchHeliDescend;
        const climbInput = seat === 0 ? (ascendPressed ? 1 : 0) - (descendPressed ? 1 : 0) : 0;

        // Smooth yaw tracking toward player aim in Pilot seat; hover-stabilize in Co-Pilot Gunner seat
        if (seat === 0 && v.rotorRpm > 0.35) {
          let yawDiff = p.yaw - v.yaw;
          while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
          while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
          v.yaw += yawDiff * Math.min(1, dt * 3.4);
        }

        const spoolLift = THREE.MathUtils.clamp((v.rotorRpm - 0.35) / 0.65, 0, 1);
        const maxAirSpeed = 38.0 * spoolLift;
        const floorY = groundHeightAt(v.position.x, v.position.z, v.position.y + 0.6, this.arena);
        const groundedOnPad = v.position.y <= floorY + 0.28;

        const targetFwdVel = cyclicFwd * maxAirSpeed;
        v.speed = THREE.MathUtils.damp(v.speed, groundedOnPad && climbInput <= 0 ? 0 : targetFwdVel, 3.2, dt);

        if (seat === 0 && v.rotorRpm > 0.42) {
          const targetVy = climbInput !== 0 ? climbInput * 14.5 * spoolLift : groundedOnPad ? 0 : 0;
          v.vy = THREE.MathUtils.damp(v.vy, targetVy, climbInput !== 0 ? 4.8 : 5.5, dt);
        } else {
          // Hover auto-hold when solo pilot switches to Seat 1 Gunner
          v.vy = THREE.MathUtils.damp(v.vy, 0, 6.0, dt);
        }

        const fwdX = -Math.sin(v.yaw);
        const fwdZ = -Math.cos(v.yaw);
        const rightX = Math.cos(v.yaw);
        const rightZ = -Math.sin(v.yaw);
        const strafeVel = groundedOnPad && climbInput <= 0 ? 0 : cyclicStrafe * 21.0 * spoolLift;

        v.position.x += (fwdX * v.speed + rightX * strafeVel) * dt;
        v.position.z += (fwdZ * v.speed + rightZ * strafeVel) * dt;
        v.position.y += v.vy * dt;

        resolveHorizontalCollision(v.position, 2.85, 2.6, this.arena);

        const maxAlt = this.arena.mapId === 'bunker' ? 50 : 115;
        const newFloor = groundHeightAt(v.position.x, v.position.z, v.position.y + 0.6, this.arena);
        if (v.position.y < newFloor + 0.04) {
          v.position.y = newFloor + 0.04;
          if (v.vy < 0) v.vy = 0;
        } else if (v.position.y > maxAlt) {
          v.position.y = maxAlt;
          if (v.vy > 0) v.vy = 0;
        }
        const flyLim = this.arena.halfSize - 8;
        v.position.x = THREE.MathUtils.clamp(v.position.x, -flyLim, flyLim);
        v.position.z = THREE.MathUtils.clamp(v.position.z, -flyLim, flyLim);

        const pitchTilt = groundedOnPad ? 0 : THREE.MathUtils.clamp(-cyclicFwd * 0.24 - (v.speed / 38) * 0.12, -0.34, 0.22);
        const rollTilt = groundedOnPad ? 0 : THREE.MathUtils.clamp(-cyclicStrafe * 0.26, -0.34, 0.34);
        v.chassisGroup.rotation.x = THREE.MathUtils.damp(v.chassisGroup.rotation.x, pitchTilt, 6.5, dt);
        v.chassisGroup.rotation.z = THREE.MathUtils.damp(v.chassisGroup.rotation.z, rollTilt, 6.5, dt);

        v.root.position.copy(v.position);
        v.root.rotation.y = v.yaw;

        if (seat === 1) {
          v.turretYaw = this.player.yaw - v.yaw;
          v.turretPitch = this.player.pitch;
          v.turretGroup.rotation.y = v.turretYaw;
          v.barrelPivot.rotation.x = v.turretPitch;
        } else {
          v.turretGroup.rotation.y = THREE.MathUtils.damp(v.turretGroup.rotation.y, 0, 8, dt);
          v.barrelPivot.rotation.x = THREE.MathUtils.damp(v.barrelPivot.rotation.x, -0.05, 8, dt);
        }

        // Rotor wash dust cloud when hovering low
        const agl = v.position.y - newFloor;
        if (agl < 10.5 && v.rotorRpm > 0.55) {
          this.vehicleDustAccum += dt;
          if (this.vehicleDustAccum >= 0.09) {
            this.vehicleDustAccum = 0;
            const ang = Math.random() * Math.PI * 2;
            const rad = 1.6 + Math.random() * 2.4;
            this.spawnSmokePuff(
              new THREE.Vector3(v.position.x + Math.cos(ang) * rad, newFloor + 0.35, v.position.z + Math.sin(ang) * rad),
              new THREE.Vector3(Math.cos(ang) * 3.4, 0.85, Math.sin(ang) * 3.4),
              0.72,
              0.42,
              1.6
            );
          }
        }

        soundEngine.updateHelicopterAudio(true, v.rotorRpm, climbInput > 0);

        const seatWorld = this.getSeatWorldPos(v, seat);
        p.position.copy(seatWorld);
        p.velocity.set(fwdX * v.speed + rightX * strafeVel, v.vy, fwdZ * v.speed + rightZ * strafeVel);

        this.weaponPivot.visible = false;
        this.isAds = wantZoom;
        this.isSteadyAim = false;
        if (this.mouseDownLeft || this.touchFireDown) {
          this.tryFireVehicle();
        }

        if (wantZoom) {
          // Nose TADS/PNVS FLIR Gunner Optic View
          const opticLocal = new THREE.Vector3(0, 1.28, -4.18);
          v.chassisGroup.localToWorld(opticLocal);
          this.camera.position.copy(opticLocal);
        } else {
          const camPivot = new THREE.Vector3(v.position.x, v.position.y + 3.15, v.position.z);
          this.vehicleCamDist = THREE.MathUtils.damp(this.vehicleCamDist, 12.6, 10, dt);
          const aimDir = new THREE.Vector3(
            -Math.sin(p.yaw) * Math.cos(p.pitch),
            Math.sin(p.pitch),
            -Math.cos(p.yaw) * Math.cos(p.pitch)
          ).normalize();
          const desiredCam = camPivot
            .clone()
            .addScaledVector(aimDir, -this.vehicleCamDist)
            .add(new THREE.Vector3(0, 1.65, 0));

          const toCam = desiredCam.clone().sub(camPivot);
          const toCamLen = toCam.length();
          if (toCamLen > 0.1) {
            this.raycaster.set(camPivot, toCam.divideScalar(toCamLen));
            this.raycaster.far = toCamLen;
            const wallHits = this.raycaster.intersectObjects(this.arena.staticRayMeshes, false);
            if (wallHits.length > 0) {
              desiredCam.copy(camPivot).addScaledVector(toCam, Math.max(1.2, wallHits[0].distance - 0.4));
            }
          }
          this.camera.position.copy(desiredCam);
        }

        this.camera.rotation.set(
          THREE.MathUtils.clamp(p.pitch + shakeY, -1.25, 1.25),
          p.yaw + shakeX,
          0,
          'YXZ'
        );

        const targetFov = wantZoom ? 36 : 80;
        if (Math.abs(this.camera.fov - targetFov) > 0.05) {
          this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 14, dt);
          this.camera.updateProjectionMatrix();
        }
        return;
      }

      soundEngine.updateHelicopterAudio(false, 0, false);

      const isArmor = v.type === 'tank' || v.type === 'heavy_tank';
      const isApc = v.type === 'apc';
      const maxFwd =
        v.type === 'heavy_tank' ? 12.4 : v.type === 'tank' ? 14.8 : isApc ? 18.5 : v.type === 'buggy' ? 28.0 : 23.0;
      const maxRev = isArmor ? -6.5 : isApc ? -8.5 : -10.0;
      const accelRate =
        v.type === 'heavy_tank' ? 12.5 : v.type === 'tank' ? 15.0 : isApc ? 18.0 : v.type === 'buggy' ? 29.0 : 24.0;
      const turnRate = isArmor ? 1.55 : isApc ? 1.75 : v.type === 'buggy' ? 2.45 : 2.1;
      const vehRadius =
        v.type === 'heavy_tank' ? 2.45 : v.type === 'tank' ? 2.15 : isApc ? 2.3 : 1.75;

      if (isDriver) {
        const kbThrottle =
          (this.keys['KeyW'] || this.keys['ArrowUp'] ? 1 : 0) -
          (this.keys['KeyS'] || this.keys['ArrowDown'] ? 1 : 0);
        const kbSteer =
          (this.keys['KeyA'] || this.keys['ArrowLeft'] ? 1 : 0) -
          (this.keys['KeyD'] || this.keys['ArrowRight'] ? 1 : 0);
        const throttle = Math.abs(kbThrottle) > 0 ? kbThrottle : this.touchMoveY;
        const steerInput = Math.abs(kbSteer) > 0 ? kbSteer : -this.touchMoveX;
        const handbrake = Boolean(this.keys['Space']) || this.touchBrakeDown;

        const prevSpeed = v.speed;
        if (handbrake) {
          v.speed = THREE.MathUtils.damp(v.speed, 0, 12, dt);
        } else if (throttle > 0) {
          v.speed = Math.min(maxFwd, v.speed + accelRate * dt);
        } else if (throttle < 0) {
          v.speed = Math.max(maxRev, v.speed - accelRate * 1.15 * dt);
        } else {
          v.speed = THREE.MathUtils.damp(v.speed, 0, 3.2, dt);
        }

        if (Math.abs(steerInput) > 0) {
          if (isArmor) {
            const dirSign = v.speed < -0.5 ? -1 : 1;
            v.yaw += steerInput * turnRate * dirSign * dt;
          } else if (Math.abs(v.speed) > 0.35) {
            const speedFactor = THREE.MathUtils.clamp(Math.abs(v.speed) / 9, 0.25, 1.0);
            const dirSign = v.speed >= 0 ? 1 : -1;
            v.yaw += steerInput * turnRate * speedFactor * dirSign * dt;
          }
        }

        const prevX = v.position.x;
        const prevZ = v.position.z;
        const moveDist = v.speed * dt;
        v.position.x += -Math.sin(v.yaw) * moveDist;
        v.position.z += -Math.cos(v.yaw) * moveDist;

        // Ramming Check (BEFORE horizontal collision): Destroy Mounted Emplacements & Crack/Break Walls
        const preRamSpeed = Math.abs(v.speed);
        const nowMs = performance.now();
        if (preRamSpeed >= 3.4) {
          // 1) Ramming Mounted Weapons (.30 Cal, .50 Cal, 20mm, TOW, 105mm Field Gun)
          for (const mg of this.arena.mountedMgs) {
            if (mg.destroyed) continue;
            if (Math.abs(v.position.y - mg.position.y) > 2.3) continue;
            const dMg = Math.hypot(v.position.x - mg.position.x, v.position.z - mg.position.z);
            if (dMg < vehRadius + 1.35) {
              this.destroyMountedMg(
                mg,
                v.position,
                p,
                isArmor || isApc ? 'Armor Ram' : 'Vehicle Ram'
              );
              v.speed *= isArmor || isApc ? 0.88 : 0.72;
              v.health = Math.max(10, v.health - (isArmor ? 2 : isApc ? 4 : 7));
              this.cameraShake = Math.max(this.cameraShake, isArmor || isApc ? 0.22 : 0.34);
              this.hitmarkerType = 'kill';
              this.hitmarkerTime = nowMs;
              soundEngine.playHitmarker(false, true);
            }
          }

          // 2) Ramming Destructible Walls (Tanks/APCs smash right through; light vehicles crack or breach at speed)
          const minWallRamSpeed = isArmor || isApc ? 3.8 : 7.5;
          if (preRamSpeed >= minWallRamSpeed) {
            const massDmgMult =
              v.type === 'heavy_tank' ? 28 : v.type === 'tank' ? 24 : isApc ? 19 : v.type === 'jeep' ? 12 : 9.5;
            for (const wall of this.arena.destructibleWalls) {
              if (wall.stage >= 3) continue;
              if (v.position.y >= wall.position.y + wall.size.y - 0.2 || v.position.y + 2.3 <= wall.position.y + 0.05) {
                continue;
              }
              const halfX = wall.size.x * 0.5;
              const halfZ = wall.size.z * 0.5;
              const cX = THREE.MathUtils.clamp(v.position.x, wall.position.x - halfX, wall.position.x + halfX);
              const cZ = THREE.MathUtils.clamp(v.position.z, wall.position.z - halfZ, wall.position.z + halfZ);
              const dxW = v.position.x - cX;
              const dzW = v.position.z - cZ;
              const checkR = vehRadius + 0.45;
              if (dxW * dxW + dzW * dzW <= checkR * checkR) {
                const cdUntil = this.wallRamCooldowns.get(wall.id) ?? 0;
                if (nowMs >= cdUntil) {
                  this.wallRamCooldowns.set(wall.id, nowMs + 260);
                  const ramDmg = Math.round(preRamSpeed * massDmgMult);
                  this.damageDestructibleWall(
                    wall,
                    ramDmg,
                    new THREE.Vector3(cX, v.position.y + 1.1, cZ)
                  );
                  soundEngine.playVehicleRam(isArmor || isApc, 0.95);
                  this.cameraShake = Math.max(this.cameraShake, isArmor || isApc ? 0.3 : 0.44);
                  v.health = Math.max(12, v.health - (isArmor ? 3 : isApc ? 6 : 12));
                  if (wall.stage >= 3) {
                    v.speed *= v.type === 'heavy_tank' ? 0.86 : isArmor || isApc ? 0.78 : 0.56;
                  } else {
                    v.speed *= 0.34;
                  }
                }
              }
            }
          }
        }

        resolveHorizontalCollision(v.position, vehRadius, 2.3, this.arena);

        for (const otherV of this.arena.vehicles) {
          if (otherV.id === v.id) continue;
          if (Math.abs(v.position.y - otherV.position.y) > 3.2) continue;
          const dx = v.position.x - otherV.position.x;
          const dz = v.position.z - otherV.position.z;
          const otherR =
            otherV.type === 'heavy_tank'
              ? 2.45
              : otherV.type === 'tank'
              ? 2.15
              : otherV.type === 'apc'
              ? 2.3
              : otherV.type === 'attack_heli'
              ? 2.85
              : 1.75;
          const minSep = vehRadius + otherR;
          const dSq = dx * dx + dz * dz;
          if (dSq > 0.0001 && dSq < minSep * minSep) {
            const d = Math.sqrt(dSq);
            const push = minSep - d;
            v.position.x += (dx / d) * push;
            v.position.z += (dz / d) * push;
            v.speed *= 0.55;
          }
        }

        const actualMoved = Math.hypot(v.position.x - prevX, v.position.z - prevZ);
        if (Math.abs(moveDist) > 0.03 && actualMoved < Math.abs(moveDist) * 0.5) {
          v.speed *= 0.45;
        }

        const targetY = groundHeightAt(v.position.x, v.position.z, v.position.y + 0.5, this.arena);
        v.position.y = THREE.MathUtils.damp(v.position.y, targetY, 14, dt);

        const longAccel = THREE.MathUtils.clamp((v.speed - prevSpeed) / Math.max(0.008, dt), -25, 25);
        const targetPitchTilt = THREE.MathUtils.clamp(-longAccel * (isArmor ? 0.0014 : 0.0028), -0.06, 0.06);
        const targetRollTilt = THREE.MathUtils.clamp(
          steerInput * (v.speed / maxFwd) * (isArmor ? 0.02 : 0.075),
          -0.08,
          0.08
        );
        v.chassisGroup.rotation.x = THREE.MathUtils.damp(v.chassisGroup.rotation.x, targetPitchTilt, 10, dt);
        v.chassisGroup.rotation.z = THREE.MathUtils.damp(v.chassisGroup.rotation.z, targetRollTilt, 10, dt);

        v.root.position.copy(v.position);
        v.root.rotation.y = v.yaw;
        const wheelRadius = isArmor ? 0.4 : 0.48;
        for (const w of v.wheels) {
          w.rotation.x -= (v.speed / wheelRadius) * dt;
        }

        if (Math.abs(v.speed) > 6.5) {
          this.vehicleDustAccum += dt;
          if (this.vehicleDustAccum >= 0.08) {
            this.vehicleDustAccum = 0;
            const backX = v.position.x + Math.sin(v.yaw) * 2.2;
            const backZ = v.position.z + Math.cos(v.yaw) * 2.2;
            this.spawnSmokePuff(
              new THREE.Vector3(backX, v.position.y + 0.35, backZ),
              new THREE.Vector3((Math.random() - 0.5) * 1.1, 0.9, (Math.random() - 0.5) * 1.1),
              0.55,
              0.35,
              1.4
            );
          }
        }

        soundEngine.updateVehicleEngine(true, Math.abs(v.speed) / maxFwd, isArmor || isApc);

        const absSpeed = Math.abs(v.speed);
        if (absSpeed > 6.5) {
          for (const actor of this.actors) {
            if (!actor.alive || actor.isPlayer) continue;
            if (v.seats.includes(actor.id)) continue;
            const dist = Math.hypot(actor.position.x - v.position.x, actor.position.z - v.position.z);
            if (dist < vehRadius + 0.65 && Math.abs(actor.position.y - v.position.y) < 2.2) {
              if (this.isFfaLike() || actor.team !== p.team) {
                const ramDmg = Math.round(absSpeed * 12);
                const killed = this.applyDamage(
                  actor,
                  p,
                  ramDmg,
                  false,
                  isArmor || isApc ? 'Armor Ram' : 'Vehicle Ram'
                );
                this.hitmarkerType = killed ? 'kill' : 'body';
                this.hitmarkerTime = performance.now();
                if (killed) {
                  this.lastEliminatedName = actor.name;
                  this.lastEliminatedHeadshot = false;
                }
                soundEngine.playHitmarker(killed, killed);
              } else {
                const nx = (actor.position.x - v.position.x) / Math.max(0.1, dist);
                const nz = (actor.position.z - v.position.z) / Math.max(0.1, dist);
                actor.position.x = v.position.x + nx * (vehRadius + 0.85);
                actor.position.z = v.position.z + nz * (vehRadius + 0.85);
              }
            }
          }
        }
      } else {
        soundEngine.updateVehicleEngine(
          Math.abs(v.speed) > 0.5,
          Math.min(1, Math.abs(v.speed) / maxFwd) * 0.65,
          isArmor || isApc
        );
      }

      if (isArmor ? isDriver : isGunner || (isDriver && v.seats[1] === null)) {
        v.turretYaw = this.player.yaw - v.yaw;
        v.turretPitch = this.player.pitch;
        v.turretGroup.rotation.y = v.turretYaw;
        v.barrelPivot.rotation.x = v.turretPitch;
      }

      const seatWorld = this.getSeatWorldPos(v, seat);
      p.position.copy(seatWorld);
      p.velocity.set(-Math.sin(v.yaw) * v.speed, 0, -Math.cos(v.yaw) * v.speed);

      if (isPassengerPort) {
        // Passenger Firing Port: player uses carried weapons, scopes, reload, steady aim, frag grenades & lock-on while riding
        if (this.isCookingGrenade) {
          this.grenadeCookTimer -= dt;
          if (this.grenadeCookTimer <= 0) {
            this.throwPlayerGrenade();
          }
        }

        this.weaponPivot.visible = true;
        this.isAds = wantZoom && !this.isReloading && !this.isCookingGrenade && !this.arsenalOpen;
        this.isSteadyAim = Boolean(
          this.isAds &&
            (this.keys['ShiftLeft'] || this.keys['ShiftRight']) &&
            this.stamina > 8
        );
        if (this.isSteadyAim) {
          this.stamina = Math.max(0, this.stamina - 12 * dt);
        } else {
          this.stamina = Math.min(100, this.stamina + 18 * dt);
        }
        this.updateLockOn(dt);

        if (this.isReloading) {
          this.reloadTimer -= dt;
          if (this.reloadTimer <= 0) {
            const spec = WEAPONS[this.activeWeapon];
            const state = this.weaponStates[this.activeWeapon];
            const needed = spec.magSize - state.mag;
            const transfer = Math.min(needed, state.reserve);
            state.mag += transfer;
            state.reserve -= transfer;
            this.isReloading = false;
            this.reloadTimer = 0;
            soundEngine.playMechanicalClick(740, 0.05);
          }
        }

        if ((this.mouseDownLeft || this.touchFireDown) && !this.arsenalOpen) {
          this.tryPlayerFire();
        }

        this.recoilOffsetPitch = THREE.MathUtils.damp(this.recoilOffsetPitch, 0, 10, dt);
        this.recoilOffsetYaw = THREE.MathUtils.damp(this.recoilOffsetYaw, 0, 10, dt);

        this.camera.position.set(seatWorld.x, seatWorld.y + 0.72, seatWorld.z);
        this.camera.rotation.set(
          THREE.MathUtils.clamp(p.pitch + this.recoilOffsetPitch + shakeY, -1.35, 1.35),
          p.yaw + this.recoilOffsetYaw + shakeX,
          0,
          'YXZ'
        );

        const spec = WEAPONS[this.activeWeapon];
        let adsTargetFov = spec.adsFov;
        if (spec.optic === 'sniper') {
          adsTargetFov = this.scopeZoomLevel === 2 ? Math.max(12, spec.adsFov * 0.55) : spec.adsFov;
        } else if (spec.optic === 'acog' || spec.optic === 'thermal_lock') {
          adsTargetFov = this.scopeZoomLevel === 2 ? Math.max(22, spec.adsFov * 0.68) : spec.adsFov;
        }
        const targetFov = this.isAds ? adsTargetFov : 75;
        if (Math.abs(this.camera.fov - targetFov) > 0.05) {
          this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 14, dt);
          this.camera.updateProjectionMatrix();
        }

        this.weaponKickZ = THREE.MathUtils.damp(this.weaponKickZ, 0, 14, dt);
        this.weaponKickRotX = THREE.MathUtils.damp(this.weaponKickRotX, 0, 14, dt);
        this.boltKick = THREE.MathUtils.damp(this.boltKick, 0, 22, dt);

        const activeVm = this.getOrCreateViewmodel(this.activeWeapon);
        const hideVmInFullScope =
          this.isAds &&
          (spec.optic === 'sniper' ||
            spec.optic === 'acog' ||
            spec.optic === 'pgo' ||
            spec.optic === 'thermal_lock');
        activeVm.root.visible = !hideVmInFullScope;
        if (activeVm.boltCarrier) activeVm.boltCarrier.position.z = -0.05 + this.boltKick;

        const vmTargetX = this.isAds ? 0 : 0.22;
        const vmTargetY = this.isAds ? (spec.category === 'pistol' ? -0.092 : -0.104) : -0.18;
        const vmTargetZ = (this.isAds ? -0.3 : -0.39) + this.weaponKickZ;
        this.weaponPivot.position.x = THREE.MathUtils.damp(this.weaponPivot.position.x, vmTargetX, 16, dt);
        this.weaponPivot.position.y = THREE.MathUtils.damp(
          this.weaponPivot.position.y,
          this.isReloading ? vmTargetY - 0.14 : vmTargetY,
          14,
          dt
        );
        this.weaponPivot.position.z = THREE.MathUtils.damp(this.weaponPivot.position.z, vmTargetZ, 16, dt);
        this.weaponPivot.rotation.x = THREE.MathUtils.damp(
          this.weaponPivot.rotation.x,
          this.isReloading ? -0.45 : this.weaponKickRotX,
          14,
          dt
        );
        this.weaponPivot.rotation.z = THREE.MathUtils.damp(
          this.weaponPivot.rotation.z,
          this.isReloading ? 0.35 : 0,
          14,
          dt
        );
        if (this.muzzleFlashTimer > 0) {
          this.muzzleFlashTimer -= dt;
          if (this.muzzleFlashTimer <= 0) {
            activeVm.muzzleFlash.visible = false;
            this.muzzleLight.intensity = 0;
          }
        }
        return;
      }

      this.weaponPivot.visible = false;
      this.isAds = wantZoom;
      this.isSteadyAim = false;
      if (this.mouseDownLeft || this.touchFireDown) {
        this.tryFireVehicle();
      }

      const camPivot = new THREE.Vector3(
        v.position.x,
        v.position.y + (isArmor ? 2.65 : isApc ? 3.1 : 2.3),
        v.position.z
      );
      const targetCamBackDist = isArmor || isApc ? (wantZoom ? 2.8 : 8.8) : wantZoom ? 2.3 : 6.4;
      this.vehicleCamDist = THREE.MathUtils.damp(this.vehicleCamDist, targetCamBackDist, 12, dt);
      const aimDir = new THREE.Vector3(
        -Math.sin(p.yaw) * Math.cos(p.pitch),
        Math.sin(p.pitch),
        -Math.cos(p.yaw) * Math.cos(p.pitch)
      ).normalize();
      const desiredCam = camPivot
        .clone()
        .addScaledVector(aimDir, -this.vehicleCamDist)
        .add(new THREE.Vector3(0, wantZoom ? 0.55 : 1.15, 0));

      const toCam = desiredCam.clone().sub(camPivot);
      const toCamLen = toCam.length();
      if (toCamLen > 0.1) {
        this.raycaster.set(camPivot, toCam.divideScalar(toCamLen));
        this.raycaster.far = toCamLen;
        const wallHits = this.raycaster.intersectObjects(this.arena.staticRayMeshes, false);
        if (wallHits.length > 0) {
          desiredCam.copy(camPivot).addScaledVector(toCam, Math.max(0.8, wallHits[0].distance - 0.35));
        }
      }

      this.camera.position.copy(desiredCam);
      this.camera.rotation.set(
        THREE.MathUtils.clamp(p.pitch + shakeY, -1.2, 1.2),
        p.yaw + shakeX,
        0,
        'YXZ'
      );

      const targetFov = wantZoom ? 40 : 78;
      if (Math.abs(this.camera.fov - targetFov) > 0.05) {
        this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 14, dt);
        this.camera.updateProjectionMatrix();
      }
      return;
    }

    soundEngine.updateVehicleEngine(false, 0, false);
    soundEngine.updateHelicopterAudio(false, 0, false);

    // 2. Mounted Turret / Field Gun / TOW Mode
    if (this.activeMountedMg) {
      const mg = this.activeMountedMg;
      this.weaponPivot.visible = false;
      const wantZoom = this.mouseDownRight || this.adsToggle;
      this.isAds = wantZoom;

      if (this.keys['Space']) {
        this.toggleMountOrArsenal();
        return;
      }

      if (this.mgReloading) {
        this.mgReloadTimer -= dt;
        if (this.mgReloadTimer <= 0) {
          mg.ammo = mg.maxAmmo;
          mg.heat = Math.max(0, mg.heat - 0.35);
          mg.overheated = false;
          this.mgReloading = false;
          this.mgReloadTimer = 0;
          soundEngine.playMechanicalClick(720, 0.06);
        }
      }

      if (this.mouseDownLeft || this.touchFireDown) {
        this.tryFireMountedEmplacement();
      }

      const fwdX = -Math.sin(mg.currentYaw);
      const fwdZ = -Math.cos(mg.currentYaw);
      const standDist = mg.kind === 'field_gun' ? 1.15 : 0.72;
      p.position.set(mg.position.x - fwdX * standDist, mg.position.y, mg.position.z - fwdZ * standDist);
      p.velocity.set(0, 0, 0);

      const camBack = mg.kind === 'field_gun' ? 0.68 : 0.34;
      this.camera.position.set(
        mg.position.x - fwdX * camBack,
        mg.position.y + (mg.kind === 'field_gun' ? 1.68 : 1.48),
        mg.position.z - fwdZ * camBack
      );
      this.camera.rotation.set(
        THREE.MathUtils.clamp(mg.currentPitch + shakeY, -1.48, 1.48),
        mg.currentYaw + shakeX,
        0,
        'YXZ'
      );

      const targetFov = wantZoom ? (mg.kind === 'tow' || mg.kind === 'field_gun' ? 36 : 50) : 70;
      if (Math.abs(this.camera.fov - targetFov) > 0.05) {
        this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 14, dt);
        this.camera.updateProjectionMatrix();
      }
      return;
    }

    this.weaponPivot.visible = true;

    if (this.isCookingGrenade) {
      this.grenadeCookTimer -= dt;
      if (this.grenadeCookTimer <= 0) {
        this.throwPlayerGrenade();
      }
    }

    const wantAds =
      (this.mouseDownRight || this.adsToggle) &&
      !this.isReloading &&
      !this.isCookingGrenade &&
      !this.arsenalOpen;
    this.isAds = wantAds;
    this.isSteadyAim = Boolean(
      wantAds &&
        (this.keys['ShiftLeft'] || this.keys['ShiftRight']) &&
        this.stamina > 8
    );

    this.updateLockOn(dt);

    if (this.isReloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        const spec = WEAPONS[this.activeWeapon];
        const state = this.weaponStates[this.activeWeapon];
        const needed = spec.magSize - state.mag;
        const transfer = Math.min(needed, state.reserve);
        state.mag += transfer;
        state.reserve -= transfer;
        this.isReloading = false;
        this.reloadTimer = 0;
        soundEngine.playMechanicalClick(740, 0.05);
      }
    }

    if (this.repairingMg) {
      const rMg = this.repairingMg;
      const distR = Math.hypot(p.position.x - rMg.position.x, p.position.z - rMg.position.z);
      if (!rMg.destroyed || distR > 4.2) {
        this.repairingMg = null;
        this.repairTimer = 0;
      } else {
        this.repairTimer -= dt;
        this.repairSparkAccum += dt;
        if (this.repairSparkAccum >= 0.25) {
          this.repairSparkAccum = 0;
          this.spawnSparks(rMg.position.clone().add(new THREE.Vector3(0, 0.55, 0)), 0xfbbf24, 5);
          soundEngine.playRepairWrench();
        }
        if (this.repairTimer <= 0) {
          this.completeRepairMountedMg(rMg, false);
        }
      }
    }

    if (this.isDiggingTrench) {
      if (!this.grounded) {
        this.isDiggingTrench = false;
        this.digTrenchTimer = 0;
      } else {
        this.digTrenchTimer -= dt;
        this.digDustAccum += dt;
        if (this.digDustAccum >= 0.2) {
          this.digDustAccum = 0;
          this.spawnSmokePuff(
            p.position.clone().add(new THREE.Vector3(0, 0.25, 0)),
            new THREE.Vector3((Math.random() - 0.5) * 1.4, 1.3, (Math.random() - 0.5) * 1.4),
            0.42,
            0.22,
            0.85
          );
          soundEngine.playDigTrench();
        }
        if (this.digTrenchTimer <= 0) {
          this.isDiggingTrench = false;
          this.digTrenchTimer = 0;
          this.spawnDugTrench(p.position.clone(), p.yaw, false);
        }
      }
    }

    if ((this.mouseDownLeft || this.touchFireDown) && !this.arsenalOpen && !this.isDiggingTrench) {
      this.tryPlayerFire();
    }

    const kbFwd = this.arsenalOpen
      ? 0
      : (this.keys['KeyW'] || this.keys['ArrowUp'] ? 1 : 0) -
        (this.keys['KeyS'] || this.keys['ArrowDown'] ? 1 : 0);
    const kbStrafe = this.arsenalOpen
      ? 0
      : (this.keys['KeyD'] || this.keys['ArrowRight'] ? 1 : 0) -
        (this.keys['KeyA'] || this.keys['ArrowLeft'] ? 1 : 0);
    const fwd = this.arsenalOpen ? 0 : Math.abs(kbFwd) > 0 ? kbFwd : this.touchMoveY;
    const strafe = this.arsenalOpen ? 0 : Math.abs(kbStrafe) > 0 ? kbStrafe : this.touchMoveX;

    const wantsSprint =
      !this.arsenalOpen &&
      (Boolean(this.keys['ShiftLeft'] || this.keys['ShiftRight']) || this.touchSprint) &&
      fwd > 0.25 &&
      !this.isAds &&
      !this.mouseDownLeft &&
      !this.touchFireDown &&
      this.stamina > 5;

    if (wantsSprint) {
      this.stamina = Math.max(0, this.stamina - 24 * dt);
    } else if (this.isSteadyAim) {
      this.stamina = Math.max(0, this.stamina - 12 * dt);
    } else {
      this.stamina = Math.min(100, this.stamina + 18 * dt);
    }

    const spec = WEAPONS[this.activeWeapon];
    const baseSpeed = this.isDiggingTrench ? 2.4 : wantsSprint ? 10.6 : this.isAds ? 5.2 : 7.4;
    const targetSpeed = baseSpeed * spec.moveSpeedMult;

    _vecA.set(-Math.sin(p.yaw), 0, -Math.cos(p.yaw));
    _vecB.set(Math.cos(p.yaw), 0, -Math.sin(p.yaw));

    _dir.set(0, 0, 0);
    if (fwd !== 0) _dir.addScaledVector(_vecA, fwd);
    if (strafe !== 0) _dir.addScaledVector(_vecB, strafe);
    if (_dir.lengthSq() > 0) _dir.normalize();

    const accel = this.grounded ? 16 : 6;
    p.velocity.x = THREE.MathUtils.damp(p.velocity.x, _dir.x * targetSpeed, accel, dt);
    p.velocity.z = THREE.MathUtils.damp(p.velocity.z, _dir.z * targetSpeed, accel, dt);

    if (!this.arsenalOpen && this.keys['Space'] && this.grounded) {
      p.velocity.y = 8.4;
      this.grounded = false;
      soundEngine.playMechanicalClick(190, 0.04);
    }

    p.velocity.y -= 24 * dt;
    p.position.x += p.velocity.x * dt;
    p.position.z += p.velocity.z * dt;
    resolveHorizontalCollision(p.position, 0.48, 1.8, this.arena);

    p.position.y += p.velocity.y * dt;
    const floorY = groundHeightAt(p.position.x, p.position.z, p.position.y, this.arena);
    if (p.position.y <= floorY) {
      p.position.y = floorY;
      p.velocity.y = 0;
      this.grounded = true;
    } else if (p.position.y > floorY + 0.08) {
      this.grounded = false;
    }

    this.recoilOffsetPitch = THREE.MathUtils.damp(this.recoilOffsetPitch, 0, 10, dt);
    this.recoilOffsetYaw = THREE.MathUtils.damp(this.recoilOffsetYaw, 0, 10, dt);

    const horizSpeed = Math.hypot(p.velocity.x, p.velocity.z);
    if (this.grounded && horizSpeed > 0.8) {
      this.walkBobPhase += dt * (wantsSprint ? 13.5 : 9.8);
      this.footstepTimer -= dt;
      if (this.footstepTimer <= 0) {
        this.footstepTimer = wantsSprint ? 0.31 : 0.44;
        soundEngine.playMechanicalClick(115 + Math.random() * 25, 0.03);
      }
    } else {
      this.walkBobPhase = 0;
    }

    const bobMult = this.isSteadyAim ? 0 : this.isAds ? 0.25 : 1;
    const bobY =
      this.grounded && horizSpeed > 0.8
        ? Math.sin(this.walkBobPhase) * 0.04 * bobMult
        : 0;
    const bobX =
      this.grounded && horizSpeed > 0.8
        ? Math.cos(this.walkBobPhase * 0.5) * 0.022 * bobMult
        : 0;

    this.camera.position.set(p.position.x, p.position.y + 1.66 + bobY, p.position.z);
    this.camera.rotation.set(
      THREE.MathUtils.clamp(p.pitch + this.recoilOffsetPitch + shakeY, -1.48, 1.48),
      p.yaw + this.recoilOffsetYaw + shakeX,
      0,
      'YXZ'
    );

    let adsTargetFov = spec.adsFov;
    if (spec.optic === 'sniper') {
      adsTargetFov = this.scopeZoomLevel === 2 ? Math.max(12, spec.adsFov * 0.55) : spec.adsFov;
    } else if (spec.optic === 'acog' || spec.optic === 'thermal_lock') {
      adsTargetFov = this.scopeZoomLevel === 2 ? Math.max(22, spec.adsFov * 0.68) : spec.adsFov;
    }

    const targetFov = this.isAds ? adsTargetFov : wantsSprint ? 81 : 75;
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 14, dt);
      this.camera.updateProjectionMatrix();
    }

    this.weaponKickZ = THREE.MathUtils.damp(this.weaponKickZ, 0, 14, dt);
    this.weaponKickRotX = THREE.MathUtils.damp(this.weaponKickRotX, 0, 14, dt);
    this.boltKick = THREE.MathUtils.damp(this.boltKick, 0, 22, dt);

    const vmTargetX = this.isAds ? 0 : 0.22 + bobX;
    const vmTargetY = this.isAds
      ? spec.category === 'pistol'
        ? -0.092
        : -0.104
      : -0.18 - Math.abs(bobY) * 0.45;
    const vmTargetZ = (this.isAds ? -0.3 : -0.39) + this.weaponKickZ;

    const activeVm = this.getOrCreateViewmodel(this.activeWeapon);
    const hideVmInFullScope =
      this.isAds &&
      (spec.optic === 'sniper' ||
        spec.optic === 'acog' ||
        spec.optic === 'pgo' ||
        spec.optic === 'thermal_lock');
    activeVm.root.visible = !hideVmInFullScope;

    if (activeVm.warheadGroup) {
      activeVm.warheadGroup.visible =
        this.weaponStates[this.activeWeapon].mag > 0 && !this.isReloading;
    }
    if (activeVm.boltCarrier) {
      activeVm.boltCarrier.position.z = -0.05 + this.boltKick;
    }

    this.weaponPivot.position.x = THREE.MathUtils.damp(this.weaponPivot.position.x, vmTargetX, 16, dt);
    this.weaponPivot.position.y = THREE.MathUtils.damp(
      this.weaponPivot.position.y,
      this.isReloading ? vmTargetY - 0.14 : vmTargetY,
      14,
      dt
    );
    this.weaponPivot.position.z = THREE.MathUtils.damp(this.weaponPivot.position.z, vmTargetZ, 16, dt);

    const targetRotX = this.isReloading ? -0.45 : this.weaponKickRotX;
    const targetRotZ = this.isReloading ? 0.35 : 0;
    this.weaponPivot.rotation.x = THREE.MathUtils.damp(this.weaponPivot.rotation.x, targetRotX, 14, dt);
    this.weaponPivot.rotation.z = THREE.MathUtils.damp(this.weaponPivot.rotation.z, targetRotZ, 14, dt);

    if (this.pumpAnimTimer > 0 && activeVm.pumpSlide) {
      this.pumpAnimTimer = Math.max(0, this.pumpAnimTimer - dt);
      const t = Math.sin((this.pumpAnimTimer / 0.55) * Math.PI);
      activeVm.pumpSlide.position.z = -0.3 + t * 0.095;
    } else if (activeVm.pumpSlide) {
      activeVm.pumpSlide.position.z = -0.3;
    }

    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= dt;
      if (this.muzzleFlashTimer <= 0) {
        activeVm.muzzleFlash.visible = false;
        this.muzzleLight.intensity = 0;
      }
    }
  }

  private getDifficultyParams(diff: Difficulty) {
    if (diff === 'recruit') {
      return { reaction: 0.45, spreadMult: 2.1, speed: 5.4, fireRateMult: 0.65 };
    }
    if (diff === 'veteran') {
      return { reaction: 0.14, spreadMult: 0.95, speed: 7.0, fireRateMult: 1.0 };
    }
    return { reaction: 0.25, spreadMult: 1.45, speed: 6.2, fireRateMult: 0.82 };
  }

  private updateRemoteHumansAndBots(dt: number) {
    const diffParams = this.getDifficultyParams(this.config.difficulty);

    for (const actor of this.actors) {
      if (actor.isPlayer || !actor.rig) continue;

      // Interpolate remote human players (including seated passengers/gunners)
      if (actor.isHuman) {
        if (actor.vehicleId && actor.vehicleSeat !== null && actor.vehicleSeat !== undefined) {
          const rv = this.arena.vehicles.find((vv) => vv.id === actor.vehicleId);
          if (rv && !rv.destroyed) {
            const seatWorld = this.getSeatWorldPos(rv, actor.vehicleSeat);
            actor.position.copy(seatWorld);
            actor.yaw = actor.targetNetYaw ?? rv.yaw;
            actor.rig.root.position.copy(seatWorld);
            actor.rig.root.rotation.y = actor.yaw;
            const openVehicle =
              rv.type === 'jeep' ||
              rv.type === 'buggy' ||
              ((rv.type === 'tank' || rv.type === 'heavy_tank') && actor.vehicleSeat >= 1);
            actor.rig.root.visible = actor.alive && openVehicle;
            continue;
          }
        }
        if (actor.targetNetPos) {
          const prevX = actor.position.x;
          const prevZ = actor.position.z;
          actor.position.lerp(actor.targetNetPos, Math.min(1, dt * 16));
          const moved = Math.hypot(actor.position.x - prevX, actor.position.z - prevZ);
          if (moved / Math.max(0.001, dt) > 0.5) {
            actor.walkCycle += dt * 9;
            const swing = Math.sin(actor.walkCycle) * 0.52;
            actor.rig.leftLeg.rotation.x = swing;
            actor.rig.rightLeg.rotation.x = -swing;
          }
        }
        if (actor.targetNetYaw !== undefined) {
          actor.yaw = actor.targetNetYaw;
        }
        actor.rig.root.position.copy(actor.position);
        actor.rig.root.rotation.y = actor.yaw;
        actor.rig.root.visible = actor.alive;
        continue;
      }

      // AI Bot Logic
      const bot = actor;
      const botRig = actor.rig;
      if (bot.spawnShieldTimer > 0) bot.spawnShieldTimer = Math.max(0, bot.spawnShieldTimer - dt);

      if (!bot.alive) {
        bot.respawnTimer -= dt;
        bot.deathAnimTimer = Math.min(1, bot.deathAnimTimer + dt * 4.5);
        botRig.bodyPivot.rotation.x = bot.deathAnimTimer * (Math.PI / 2);
        botRig.bodyPivot.position.y = -bot.deathAnimTimer * 0.35;
        if (bot.deathAnimTimer >= 1 && bot.respawnTimer < 2.2) {
          botRig.root.visible = false;
        }
        if (bot.respawnTimer <= 0) {
          this.respawnActor(bot);
        }
        continue;
      }

      if (bot.fireCooldown > 0) bot.fireCooldown -= dt;
      if (bot.grenadeCooldown > 0) bot.grenadeCooldown -= dt;
      bot.losTimer -= dt;

      // Check if bot is riding inside a friendly multi-seat vehicle
      const botVeh = bot.vehicleId
        ? this.arena.vehicles.find((vv) => vv.id === bot.vehicleId && !vv.destroyed)
        : undefined;
      if (botVeh && bot.vehicleSeat !== null && bot.vehicleSeat !== undefined) {
        const seatIdx = bot.vehicleSeat;
        const seatWorld = this.getSeatWorldPos(botVeh, seatIdx);
        bot.position.copy(seatWorld);
        botRig.root.position.copy(seatWorld);
        botRig.leftLeg.rotation.x = 0;
        botRig.rightLeg.rotation.x = 0;
        const openVehicle =
          botVeh.type === 'jeep' ||
          botVeh.type === 'buggy' ||
          ((botVeh.type === 'tank' || botVeh.type === 'heavy_tank') && seatIdx >= 1);
        botRig.root.visible = openVehicle;

        // Disembark if vehicle health is critical (<18%) or unmanned on foot long
        if (botVeh.health < botVeh.maxHealth * 0.18) {
          botVeh.seats[seatIdx] = null;
          bot.vehicleId = null;
          bot.vehicleSeat = null;
          botRig.root.visible = true;
          continue;
        }

        // Scan for visible enemies from mounted seat
        const isHeliSeat = botVeh.type === 'attack_heli';
        const seatEye = _vecA.set(seatWorld.x, seatWorld.y + 1.4, seatWorld.z);
        let mountedTarget: CombatantActor | null = null;
        let bestDist = isHeliSeat ? 160 : 96;
        for (const other of this.actors) {
          if (!other.alive || other.id === bot.id || (!this.isFfaLike() && other.team === bot.team)) continue;
          const d = seatWorld.distanceTo(other.position);
          if (d < bestDist && this.hasLineOfSight(seatEye, _vecB.set(other.position.x, other.position.y + 1.25, other.position.z))) {
            bestDist = d;
            mountedTarget = other;
          }
        }

        if (mountedTarget) {
          const dx = mountedTarget.position.x - seatWorld.x;
          const dz = mountedTarget.position.z - seatWorld.z;
          const dy = mountedTarget.position.y + 1.15 - (seatWorld.y + 1.35);
          const worldYaw = Math.atan2(-dx, -dz);
          const horiz = Math.max(0.1, Math.hypot(dx, dz));
          bot.yaw = worldYaw;
          botRig.root.rotation.y = worldYaw;

          if (seatIdx === 1) {
            const isBotTank = botVeh.type === 'tank' || botVeh.type === 'heavy_tank';
            const usesSecondary = isBotTank || isHeliSeat;
            const hasAmmo = usesSecondary ? botVeh.secondaryAmmo > 0 : botVeh.ammo > 0;
            const coaxCd = this.vehicleCoaxCooldowns.get(botVeh.id) ?? 0;
            const readyToFire = hasAmmo && (usesSecondary ? coaxCd <= 0 : botVeh.fireCooldown <= 0);
            if (readyToFire) {
              if (!isBotTank) {
                botVeh.turretYaw = worldYaw - botVeh.yaw;
                botVeh.turretPitch = THREE.MathUtils.clamp(
                  Math.atan2(dy, horiz),
                  isHeliSeat ? -0.82 : -0.22,
                  0.4
                );
                botVeh.turretGroup.rotation.y = botVeh.turretYaw;
                botVeh.barrelPivot.rotation.x = botVeh.turretPitch;
              }

              const muzzleWorld = new THREE.Vector3();
              if (isBotTank) {
                botVeh.secondaryAmmo = Math.max(0, botVeh.secondaryAmmo - 1);
                muzzleWorld.set(botVeh.position.x, botVeh.position.y + 2.85, botVeh.position.z);
                this.vehicleCoaxCooldowns.set(botVeh.id, 0.22);
              } else if (isHeliSeat) {
                botVeh.secondaryAmmo = Math.max(0, botVeh.secondaryAmmo - 1);
                botVeh.muzzlePoint.getWorldPosition(muzzleWorld);
                botVeh.muzzleFlash.visible = true;
                this.vehicleFlashTimer = 0.05;
                this.vehicleCoaxCooldowns.set(botVeh.id, 0.18);
              } else {
                botVeh.ammo = Math.max(0, botVeh.ammo - 1);
                botVeh.muzzlePoint.getWorldPosition(muzzleWorld);
                botVeh.muzzleFlash.visible = true;
                this.vehicleFlashTimer = 0.05;
                botVeh.fireCooldown = botVeh.type === 'apc' ? 0.28 : 0.22;
              }
              const shotDir = new THREE.Vector3(dx, dy, dz).normalize();
              const isApc = botVeh.type === 'apc';
              const distP = bot.position.distanceTo(this.player.position);
              const vol = THREE.MathUtils.clamp(1 - distP / 95, 0.04, 0.55);
              if (isHeliSeat) soundEngine.playChainGun30mm(vol);
              else if (isApc) soundEngine.playAutocannonFire(vol);
              else soundEngine.playGunshot('hmg', vol);

              this.spawnBallisticBullet(
                muzzleWorld.clone(),
                muzzleWorld.clone(),
                shotDir,
                isHeliSeat ? 330 : 300,
                isHeliSeat ? 0.24 : 0.36,
                isHeliSeat ? 28 : isApc ? 30 : 24,
                1.5,
                isHeliSeat ? 340 : 220,
                bot.id,
                bot.team,
                isHeliSeat ? '30mm M230 (AI)' : isApc ? '20mm RWS (AI)' : '.50 MG (AI)',
                isHeliSeat ? 0xffb703 : isApc ? 0xff922b : 0xfef08a,
                isHeliSeat || isApc ? 1.8 : undefined
              );
            }
          } else if (seatIdx >= 2 && bot.fireCooldown <= 0) {
            this.fireBotWeapon(bot, mountedTarget, diffParams.spreadMult * 1.1, diffParams.fireRateMult);
          }
        } else {
          bot.yaw = botVeh.yaw;
          botRig.root.rotation.y = botVeh.yaw;
        }
        continue;
      }

      // Friendly bots can board free gunner/passenger seats on active friendly vehicles
      if (!this.isFfaLike() && bot.team === this.player.team && Math.random() < 0.025) {
        for (const v of this.arena.vehicles) {
          if (v.destroyed) continue;
          if (!this.isFriendlyOccupiedVehicle(v, bot.team) && this.activeVehicle !== v) continue;
          if (this.isEnemyOccupiedVehicle(v, bot.team)) continue;
          const freeGunner = v.seats[1] === null ? 1 : v.seats.findIndex((s, idx) => idx >= 1 && s === null);
          if (freeGunner > 0 && bot.position.distanceTo(v.position) < 6.5) {
            v.seats[freeGunner] = bot.id;
            bot.vehicleId = v.id;
            bot.vehicleSeat = freeGunner;
            break;
          }
        }
        if (bot.vehicleId) continue;
      }

      const eyePos = _vecA.set(bot.position.x, bot.position.y + 1.55, bot.position.z);
      let visibleEnemy: CombatantActor | null = null;
      let nearestEnemyDist = 110;

      if (bot.losTimer <= 0) {
        bot.losTimer = 0.14 + Math.random() * 0.06;
        for (const other of this.actors) {
          if (!other.alive || other.id === bot.id || (!this.isFfaLike() && other.team === bot.team)) continue;
          const d = bot.position.distanceTo(other.position);
          if (d < nearestEnemyDist) {
            const targetEye = _vecB.set(other.position.x, other.position.y + 1.38, other.position.z);
            if (this.hasLineOfSight(eyePos, targetEye)) {
              nearestEnemyDist = d;
              visibleEnemy = other;
            }
          }
        }
      } else if (bot.targetEnemyId) {
        const cached = this.actors.find((a) => a.id === bot.targetEnemyId);
        if (cached && cached.alive) {
          const d = bot.position.distanceTo(cached.position);
          if (d < 115) {
            visibleEnemy = cached;
            nearestEnemyDist = d;
          }
        }
      }

      const spec = WEAPONS[bot.weaponId];
      let moveDirX = 0;
      let moveDirZ = 0;
      let moveSpeed = diffParams.speed * spec.moveSpeedMult;

      if (visibleEnemy) {
        if (bot.targetEnemyId !== visibleEnemy.id) {
          bot.targetEnemyId = visibleEnemy.id;
          bot.reactionTimer = diffParams.reaction;
        } else {
          bot.reactionTimer = Math.max(0, bot.reactionTimer - dt);
        }

        const dx = visibleEnemy.position.x - bot.position.x;
        const dz = visibleEnemy.position.z - bot.position.z;
        const desiredYaw = Math.atan2(dx, dz);
        let deltaYaw = desiredYaw - bot.yaw;
        while (deltaYaw > Math.PI) deltaYaw -= Math.PI * 2;
        while (deltaYaw < -Math.PI) deltaYaw += Math.PI * 2;
        bot.yaw += deltaYaw * Math.min(1, dt * 10);

        bot.strafeTimer -= dt;
        if (bot.strafeTimer <= 0) {
          bot.strafeDir = Math.random() > 0.5 ? 1 : -1;
          bot.strafeTimer = 0.8 + Math.random() * 1.1;
        }

        const preferredDist =
          spec.category === 'shotgun'
            ? 10
            : spec.category === 'smg'
            ? 16
            : spec.category === 'sniper'
            ? 38
            : spec.category === 'dmr'
            ? 30
            : 22;

        const normDist = Math.max(0.01, Math.hypot(dx, dz));
        const fwdX = dx / normDist;
        const fwdZ = dz / normDist;
        const rightX = -fwdZ;
        const rightZ = fwdX;

        const approach = normDist > preferredDist + 3 ? 0.75 : normDist < preferredDist - 3 ? -0.55 : 0;
        moveDirX = fwdX * approach + rightX * bot.strafeDir * 0.85;
        moveDirZ = fwdZ * approach + rightZ * bot.strafeDir * 0.85;
        moveSpeed *= 0.85;

        if (
          this.config.difficulty !== 'recruit' &&
          bot.grenadeCooldown <= 0 &&
          nearestEnemyDist > 10 &&
          nearestEnemyDist < 24 &&
          Math.random() < 0.04
        ) {
          bot.grenadeCooldown = 14 + Math.random() * 10;
          const tossDir = new THREE.Vector3(dx, 0, dz).normalize();
          const startPos = new THREE.Vector3(bot.position.x, bot.position.y + 1.5, bot.position.z).addScaledVector(
            tossDir,
            0.7
          );
          const speed = THREE.MathUtils.clamp(nearestEnemyDist * 0.95, 11, 22);
          const tossVel = tossDir.multiplyScalar(speed);
          tossVel.y = 5.4;
          this.spawnFragGrenade(startPos, tossVel, 2.3, bot.id, bot.team);
        } else if (bot.reactionTimer <= 0 && bot.fireCooldown <= 0 && nearestEnemyDist <= spec.range * 0.9) {
          this.fireBotWeapon(bot, visibleEnemy, diffParams.spreadMult, diffParams.fireRateMult);
        }
      } else {
        bot.targetEnemyId = null;

        let navTarget: THREE.Vector3 | null = null;
        if (bot.health < 50) {
          let bestMedDist = 36;
          for (const pk of this.arena.pickups) {
            if (pk.type === 'health' && pk.active) {
              const d = bot.position.distanceTo(pk.position);
              if (d < bestMedDist) {
                bestMedDist = d;
                navTarget = pk.position;
              }
            }
          }
        }

        if (!navTarget) {
          const wp = this.arena.waypoints[bot.waypointIdx];
          if (bot.position.distanceTo(wp) < 2.8) {
            bot.waypointIdx = Math.floor(Math.random() * this.arena.waypoints.length);
          }
          navTarget = this.arena.waypoints[bot.waypointIdx];
        }

        const dx = navTarget.x - bot.position.x;
        const dz = navTarget.z - bot.position.z;
        const len = Math.hypot(dx, dz);
        if (len > 0.1) {
          moveDirX = dx / len;
          moveDirZ = dz / len;
          const desiredYaw = Math.atan2(moveDirX, moveDirZ);
          let deltaYaw = desiredYaw - bot.yaw;
          while (deltaYaw > Math.PI) deltaYaw -= Math.PI * 2;
          while (deltaYaw < -Math.PI) deltaYaw += Math.PI * 2;
          bot.yaw += deltaYaw * Math.min(1, dt * 6.5);
        }
      }

      for (const other of this.actors) {
        if (other.id === bot.id || !other.alive || other.vehicleId) continue;
        const sepX = bot.position.x - other.position.x;
        const sepZ = bot.position.z - other.position.z;
        const distSq = sepX * sepX + sepZ * sepZ;
        if (distSq > 0.001 && distSq < 2.25) {
          const dist = Math.sqrt(distSq);
          moveDirX += (sepX / dist) * (1.5 - dist) * 1.2;
          moveDirZ += (sepZ / dist) * (1.5 - dist) * 1.2;
        }
      }

      const moveLen = Math.hypot(moveDirX, moveDirZ);
      if (moveLen > 0.01) {
        moveDirX /= moveLen;
        moveDirZ /= moveLen;
      }

      const prevX = bot.position.x;
      const prevZ = bot.position.z;
      bot.position.x += moveDirX * moveSpeed * dt;
      bot.position.z += moveDirZ * moveSpeed * dt;
      resolveHorizontalCollision(bot.position, 0.48, 1.8, this.arena);

      const movedDist = Math.hypot(bot.position.x - prevX, bot.position.z - prevZ);
      if (!visibleEnemy && movedDist < moveSpeed * dt * 0.25) {
        bot.waypointIdx = Math.floor(Math.random() * this.arena.waypoints.length);
      }

      const targetGround = groundHeightAt(bot.position.x, bot.position.z, bot.position.y + 0.3, this.arena);
      bot.position.y = THREE.MathUtils.damp(bot.position.y, targetGround, 14, dt);

      botRig.root.position.copy(bot.position);
      botRig.root.rotation.y = bot.yaw;

      const actualSpeed = movedDist / Math.max(0.001, dt);
      if (actualSpeed > 0.5) {
        bot.walkCycle += dt * actualSpeed * 1.5;
        const swing = Math.sin(bot.walkCycle) * 0.55;
        botRig.leftLeg.rotation.x = swing;
        botRig.rightLeg.rotation.x = -swing;
      } else {
        botRig.leftLeg.rotation.x = THREE.MathUtils.damp(botRig.leftLeg.rotation.x, 0, 10, dt);
        botRig.rightLeg.rotation.x = THREE.MathUtils.damp(botRig.rightLeg.rotation.x, 0, 10, dt);
      }
    }
  }

  private fireBotWeapon(
    bot: CombatantActor,
    target: CombatantActor,
    spreadMult: number,
    fireRateMult: number
  ) {
    const spec = WEAPONS[bot.weaponId];
    bot.fireCooldown = ((60 / spec.rpm) / fireRateMult) * (1.05 + Math.random() * 0.35);

    const muzzlePos = new THREE.Vector3();
    if (bot.rig) {
      bot.rig.muzzleWorldAnchor.getWorldPosition(muzzlePos);
    } else {
      muzzlePos.set(bot.position.x, bot.position.y + 1.35, bot.position.z);
    }

    const distToPlayer = bot.position.distanceTo(this.player.position);
    const vol = THREE.MathUtils.clamp(1 - distToPlayer / 75, 0.04, 0.52);
    soundEngine.playGunshot(bot.weaponId, vol);

    const targetCenter = new THREE.Vector3(target.position.x, target.position.y + 1.25, target.position.z);
    const flightTime = muzzlePos.distanceTo(targetCenter) / spec.muzzleVelocity;
    targetCenter.y += 0.5 * 9.81 * spec.gravityScale * flightTime * flightTime;
    const baseDir = targetCenter.sub(muzzlePos).normalize();
    const spread = Math.max(0.025, spec.baseSpread * 2.2 * spreadMult);

    for (let p = 0; p < spec.pellets; p++) {
      const shotDir = baseDir
        .clone()
        .add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 2 * spread,
            (Math.random() - 0.5) * 2 * spread,
            (Math.random() - 0.5) * 2 * spread
          )
        )
        .normalize();

      this.spawnBallisticBullet(
        muzzlePos.clone(),
        muzzlePos.clone(),
        shotDir,
        spec.muzzleVelocity,
        spec.gravityScale,
        spec.damage,
        spec.headshotMult,
        spec.range,
        bot.id,
        bot.team,
        spec.shortName,
        spec.tracerColor
      );
    }
  }

  private updatePickups(dt: number) {
    if (this.pickupNoticeTimer > 0) {
      this.pickupNoticeTimer -= dt;
      if (this.pickupNoticeTimer <= 0) this.pickupNotice = null;
    }

    const nowSec = performance.now() * 0.001;
    for (const pk of this.arena.pickups) {
      if (!pk.active) {
        pk.respawnTimer -= dt;
        if (pk.respawnTimer <= 0) {
          pk.active = true;
          pk.meshGroup.visible = true;
        }
        continue;
      }

      pk.meshGroup.rotation.y += dt * 1.8;
      pk.meshGroup.position.y = pk.position.y + 0.65 + Math.sin(nowSec * 3.0) * 0.09;

      for (const actor of this.actors) {
        if (!actor.alive) continue;
        const dx = actor.position.x - pk.position.x;
        const dz = actor.position.z - pk.position.z;
        const dy = Math.abs(actor.position.y - pk.position.y);
        if (dx * dx + dz * dz < 1.8 && dy < 1.5) {
          if (pk.type === 'health' && actor.health < actor.maxHealth) {
            actor.health = Math.min(actor.maxHealth, actor.health + 40);
            pk.active = false;
            pk.respawnTimer = 14;
            pk.meshGroup.visible = false;
            if (actor.isPlayer) {
              soundEngine.playPickup();
              this.pickupNotice = '+40 Health Restored';
              this.pickupNoticeTimer = 2.0;
            }
            break;
          } else if (pk.type === 'ammo' && actor.isPlayer) {
            let refilled = false;
            for (const wid of this.loadout) {
              const st = this.weaponStates[wid];
              const maxRes = WEAPONS[wid].reserveMax;
              if (st.reserve < maxRes) {
                st.reserve = Math.min(maxRes, st.reserve + Math.ceil(maxRes * 0.5));
                refilled = true;
              }
            }
            if (this.grenades < this.maxGrenades) {
              this.grenades = Math.min(this.maxGrenades, this.grenades + 1);
              refilled = true;
            }
            if (refilled) {
              pk.active = false;
              pk.respawnTimer = 16;
              pk.meshGroup.visible = false;
              soundEngine.playPickup();
              this.pickupNotice = 'Ammo & Grenades Resupplied';
              this.pickupNoticeTimer = 2.0;
              break;
            }
          }
        }
      }
    }

    // Collect ground heavy ammo belts for carried transport
    if (this.player?.alive && !this.activeMountedMg && !this.activeVehicle) {
      for (const b of this.arena.beltPickups) {
        if (b.collected) continue;
        if (this.carriedBelts >= this.maxCarriedBelts) break;
        const dx = this.player.position.x - b.position.x;
        const dz = this.player.position.z - b.position.z;
        const dy = Math.abs(this.player.position.y - b.position.y);
        if (dx * dx + dz * dz < 2.1 * 2.1 && dy < 1.6) {
          b.collected = true;
          b.meshGroup.visible = false;
          this.carriedBelts += 1;
          soundEngine.playPickup();
          this.pickupNotice = `Picked Up Heavy Belt (${this.carriedBelts}/${this.maxCarriedBelts})`;
          this.pickupNoticeTimer = 2.0;
          if (this.config.mode === 'multiplayer') {
            this.mpClient.sendBeltPickup(b.id);
          }
          break;
        }
      }
    }
  }

  private removeBulletAt(index: number) {
    const b = this.bullets[index];
    this.scene.remove(b.mesh);
    b.mesh.traverse((o) => {
      if (o instanceof THREE.Mesh && o.material !== this.brassMat) {
        (o.material as THREE.Material).dispose();
      }
    });
    this.bullets.splice(index, 1);
  }

  private removeRocketAt(index: number) {
    const r = this.rockets[index];
    this.scene.remove(r.mesh);
    r.mesh.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        (o.material as THREE.Material).dispose();
      }
    });
    this.rockets.splice(index, 1);
  }

  private removeGrenadeAt(index: number) {
    const g = this.activeGrenades[index];
    this.scene.remove(g.mesh);
    g.mesh.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        if (o.material !== this.oliveGrenadeMat && o.material !== this.brassMat) {
          (o.material as THREE.Material).dispose();
        }
      }
    });
    this.activeGrenades.splice(index, 1);
  }

  private updateEffects(dt: number) {
    // 1. Mounted Emplacements cooling & recoil springback + Vehicle cooldowns & barrel springback
    for (const mg of this.arena.mountedMgs) {
      if (mg.destroyed) continue;
      if (mg.fireCooldown > 0) mg.fireCooldown = Math.max(0, mg.fireCooldown - dt);
      mg.recoilGroup.position.z = THREE.MathUtils.damp(mg.recoilGroup.position.z, 0, 12, dt);
      const coolingRate = mg.overheated ? 0.36 : 0.22;
      if (
        mg.heat > 0 &&
        !(this.activeMountedMg === mg && (this.mouseDownLeft || this.touchFireDown) && !mg.overheated)
      ) {
        mg.heat = Math.max(0, mg.heat - coolingRate * dt);
        if (mg.overheated && mg.heat <= 0.12) {
          mg.overheated = false;
        }
      }
      mg.barrelHeatMat.emissiveIntensity = mg.heat > 0.25 ? (mg.heat - 0.25) * 1.9 : 0;
    }

    this.vehicleSmokeAccum += dt;
    const emitVehSmoke = this.vehicleSmokeAccum >= 0.16;
    if (emitVehSmoke) this.vehicleSmokeAccum = 0;
    for (const v of this.arena.vehicles) {
      if (v.fireCooldown > 0) v.fireCooldown = Math.max(0, v.fireCooldown - dt);
      const coaxCd = this.vehicleCoaxCooldowns.get(v.id) ?? 0;
      if (coaxCd > 0) this.vehicleCoaxCooldowns.set(v.id, Math.max(0, coaxCd - dt));
      v.barrelRecoilGroup.position.z = THREE.MathUtils.damp(v.barrelRecoilGroup.position.z, 0, 10, dt);

      if (v.type === 'attack_heli') {
        const floorY = groundHeightAt(v.position.x, v.position.z, v.position.y + 0.6, this.arena);
        if (v.destroyed) {
          if (v.position.y > floorY + 0.15) {
            v.vy = Math.max(-28, v.vy - 18 * dt);
            v.position.y = Math.max(floorY + 0.05, v.position.y + v.vy * dt);
            v.yaw += dt * 3.8;
            v.chassisGroup.rotation.x = THREE.MathUtils.damp(v.chassisGroup.rotation.x, 0.36, 6, dt);
            v.chassisGroup.rotation.z = THREE.MathUtils.damp(v.chassisGroup.rotation.z, 0.42, 6, dt);
            v.root.position.copy(v.position);
            v.root.rotation.y = v.yaw;
            if (v.position.y <= floorY + 0.25) {
              this.triggerExplosion(v.position.clone().add(new THREE.Vector3(0, 1.0, 0)), 7.5, 0, undefined, 'Heli Crash');
            }
          }
          v.rotorRpm = Math.max(0, v.rotorRpm - dt * 0.45);
        } else {
          if (!v.seats.includes(this.player?.id)) {
            // Spool down & gently auto-rotate if pilot bailed out mid-air
            v.rotorRpm = Math.max(0, v.rotorRpm - dt * 0.14);
            if (v.position.y > floorY + 0.12) {
              v.vy = THREE.MathUtils.clamp(v.vy - 4.5 * dt, -6.5, 0);
              v.position.y = Math.max(floorY + 0.04, v.position.y + v.vy * dt);
              v.chassisGroup.rotation.x = THREE.MathUtils.damp(v.chassisGroup.rotation.x, 0, 5, dt);
              v.chassisGroup.rotation.z = THREE.MathUtils.damp(v.chassisGroup.rotation.z, 0, 5, dt);
              v.root.position.copy(v.position);
            } else {
              v.vy = 0;
            }
          }
        }
        if (v.mainRotorGroup) {
          v.mainRotorGroup.rotation.y = (v.mainRotorGroup.rotation.y + dt * (28 * v.rotorRpm)) % (Math.PI * 2);
        }
        if (v.tailRotorGroup) {
          v.tailRotorGroup.rotation.x = (v.tailRotorGroup.rotation.x + dt * (44 * v.rotorRpm)) % (Math.PI * 2);
        }
      }

      if (v.destroyed) {
        v.respawnTimer -= dt;
        if (v.respawnTimer <= 0) {
          this.respawnVehicle(v);
        }
      } else {
        if (v.type !== 'attack_heli' && v.seats[0] !== this.player?.id && Math.abs(v.speed) > 0.05) {
          v.speed = THREE.MathUtils.damp(v.speed, 0, 4, dt);
        }
        if (emitVehSmoke && v.health < v.maxHealth * 0.55) {
          const backX = v.position.x + Math.sin(v.yaw) * 1.6;
          const backZ = v.position.z + Math.cos(v.yaw) * 1.6;
          const critical = v.health < v.maxHealth * 0.28;
          this.spawnSmokePuff(
            new THREE.Vector3(backX, v.position.y + 1.35, backZ),
            new THREE.Vector3((Math.random() - 0.5) * 0.8, critical ? 2.4 : 1.5, (Math.random() - 0.5) * 0.8),
            critical ? 1.15 : 0.85,
            0.35,
            critical ? 2.1 : 1.35
          );
          if (critical) {
            this.spawnSparks(new THREE.Vector3(backX, v.position.y + 1.25, backZ), 0xff7b1c, 2);
          }
        }
      }
    }

    // 1b. Explosive Fuel Barrels (burning state + timed respawn)
    this.barrelParticleAccum += dt;
    const emitBurnFx = this.barrelParticleAccum >= 0.14;
    if (emitBurnFx) this.barrelParticleAccum = 0;
    for (const barrel of this.arena.barrels) {
      if (barrel.destroyed) {
        barrel.respawnTimer -= dt;
        if (barrel.respawnTimer <= 0) {
          barrel.hp = barrel.maxHp;
          barrel.burning = false;
          barrel.destroyed = false;
          barrel.meshGroup.visible = true;
          barrel.collider.disabled = false;
        }
      } else if (barrel.burning) {
        if (emitBurnFx) {
          this.spawnSmokePuff(
            barrel.position.clone().add(new THREE.Vector3(0, 1.05, 0)),
            new THREE.Vector3((Math.random() - 0.5) * 0.9, 1.9, (Math.random() - 0.5) * 0.9),
            0.75,
            0.22,
            0.9
          );
          this.spawnSparks(barrel.position.clone().add(new THREE.Vector3(0, 0.9, 0)), 0xff7b1c, 2);
        }
        this.damageBarrel(barrel, 5.5 * dt, undefined, 'Fuel Barrel');
      }
    }

    // 2. Active Air Strikes (Shootable Striker Jets + 6 sequential JDAM drops + Crashing physics)
    for (let i = this.airstrikes.length - 1; i >= 0; i--) {
      const as = this.airstrikes[i];
      as.elapsed += dt;
      const rightVec = new THREE.Vector3(-as.dir.z, 0, as.dir.x).normalize();
      const jetProgress = as.elapsed / 4.4;
      const sweepSpan = this.arena.halfSize > 300 ? 520 : 330;
      const alongBase = -sweepSpan * 0.5 + jetProgress * sweepSpan;

      for (const jet of as.jets) {
        if (!jet.destroyed) {
          jet.position
            .copy(as.target)
            .addScaledVector(as.dir, alongBase + jet.offsetZ)
            .addScaledVector(rightVec, jet.offsetX);
          jet.position.y = 44;
          jet.group.position.copy(jet.position);
          jet.group.lookAt(
            jet.position.x + as.dir.x * 80,
            jet.position.y,
            jet.position.z + as.dir.z * 80
          );
        } else if (jet.crashing) {
          jet.crashTimer -= dt;
          jet.crashVel.y -= 18 * dt;
          jet.position.addScaledVector(jet.crashVel, dt);
          jet.group.position.copy(jet.position);
          jet.group.rotation.x += jet.crashSpin.x * dt;
          jet.group.rotation.y += jet.crashSpin.y * dt;
          jet.group.rotation.z += jet.crashSpin.z * dt;

          jet.smokeAccum += dt;
          if (jet.smokeAccum >= 0.04) {
            jet.smokeAccum = 0;
            this.spawnSmokePuff(
              jet.position.clone(),
              new THREE.Vector3((Math.random() - 0.5) * 1.6, 1.4, (Math.random() - 0.5) * 1.6),
              1.1,
              0.7,
              2.6
            );
          }

          const gY = groundHeightAt(jet.position.x, jet.position.z, 12, this.arena);
          if (jet.position.y <= gY + 1.5 || jet.crashTimer <= 0) {
            jet.crashing = false;
            jet.group.visible = false;
            const crashPt = jet.position.clone();
            crashPt.y = Math.max(gY + 0.3, crashPt.y);
            const attacker = this.actors.find((a) => a.id === as.attackerId);
            this.triggerExplosion(crashPt, 8.2, 95, attacker, 'Jet Crash');
          }
        }
      }

      const firstDropAt = 1.7;
      const dropInterval = 0.24;
      while (as.bombsDropped < 6 && as.elapsed >= firstDropAt + as.bombsDropped * dropInterval) {
        const carrier = as.jets[as.bombsDropped % as.jets.length];
        if (!carrier.destroyed) {
          const offsetAlong = (as.bombsDropped - 2.5) * 7.2;
          const sideJitter = (Math.random() - 0.5) * 5.0;
          const dropPt = as.target.clone().addScaledVector(as.dir, offsetAlong);
          dropPt.x += -as.dir.z * sideJitter;
          dropPt.z += as.dir.x * sideJitter;
          dropPt.y = groundHeightAt(dropPt.x, dropPt.z, 12, this.arena) + 0.25;

          const attacker = this.actors.find((a) => a.id === as.attackerId);
          this.triggerExplosion(dropPt, 9.8, 195, attacker, 'Air Strike');
        }
        as.bombsDropped += 1;
      }

      const anyCrashing = as.jets.some((j) => j.crashing);
      if (as.elapsed >= 4.7 && !anyCrashing) {
        this.scene.remove(as.beaconGroup);
        as.beaconGroup.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            o.geometry.dispose();
            (o.material as THREE.Material).dispose();
          }
        });
        for (const jet of as.jets) {
          this.scene.remove(jet.group);
          jet.group.traverse((o) => {
            if (o instanceof THREE.Mesh) {
              o.geometry.dispose();
              if (o.material !== this.jetMat) (o.material as THREE.Material).dispose();
            }
          });
        }
        this.airstrikes.splice(i, 1);
      }
    }

    // 3. Ballistic Bullets
    const segDir = new THREE.Vector3();
    const nextPos = new THREE.Vector3();
    const closestPt = new THREE.Vector3();
    const lineSeg = new THREE.Line3();

    const activeBarrelMeshes: THREE.Object3D[] = [];
    for (const br of this.arena.barrels) {
      if (!br.destroyed) activeBarrelMeshes.push(...br.hitMeshes);
    }
    const worldRayTargets: THREE.Object3D[] =
      activeBarrelMeshes.length > 0
        ? [...this.arena.staticRayMeshes, ...activeBarrelMeshes]
        : this.arena.staticRayMeshes;

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.vel.y -= 9.81 * b.gravityScale * dt;
      b.vel.multiplyScalar(Math.max(0, 1 - 0.14 * dt));
      nextPos.copy(b.pos).addScaledVector(b.vel, dt);

      segDir.copy(nextPos).sub(b.pos);
      const stepDist = segDir.length();
      if (stepDist < 0.0001) {
        this.removeBulletAt(i);
        continue;
      }
      segDir.divideScalar(stepDist);

      this.raycaster.set(b.pos, segDir);
      this.raycaster.far = stepDist;

      const worldHits = this.raycaster.intersectObjects(worldRayTargets, false);
      const worldDist = worldHits.length > 0 ? worldHits[0].distance : stepDist + 1;

      let hitActor: CombatantActor | null = null;
      let hitVehicle: VehicleNode | null = null;
      let hitJet: { jet: AirstrikeJet; strike: ActiveAirstrike } | null = null;
      let hitPoint = new THREE.Vector3();
      let hitHead = false;
      let hitDist = worldDist;

      const jetMeshes: THREE.Object3D[] = [];
      for (const strike of this.airstrikes) {
        for (const jet of strike.jets) {
          const friendlyJet = this.isFfaLike() ? strike.attackerId === b.attackerId : jet.team === b.team;
          if (!jet.destroyed && !friendlyJet) {
            jetMeshes.push(...jet.hitMeshes);
          }
        }
      }
      if (jetMeshes.length > 0) {
        const jHits = this.raycaster.intersectObjects(jetMeshes, false);
        if (jHits.length > 0 && jHits[0].distance < hitDist) {
          const jh = jHits[0];
          const jid = jh.object.userData.jetId as string;
          for (const strike of this.airstrikes) {
            const jFound = strike.jets.find((jj) => jj.id === jid && !jj.destroyed);
            if (jFound) {
              hitDist = jh.distance;
              hitJet = { jet: jFound, strike };
              hitPoint.copy(jh.point);
              break;
            }
          }
        }
      }

      const vehicleMeshes: THREE.Object3D[] = [];
      for (const v of this.arena.vehicles) {
        if (v.destroyed) continue;
        if (v.seats.includes(b.attackerId)) continue;
        vehicleMeshes.push(...v.hitMeshes);
      }
      if (vehicleMeshes.length > 0) {
        const vHits = this.raycaster.intersectObjects(vehicleMeshes, false);
        if (vHits.length > 0 && vHits[0].distance < hitDist) {
          const vh = vHits[0];
          const vid = vh.object.userData.vehicleId as string;
          const vFound = this.arena.vehicles.find((vv) => vv.id === vid);
          if (vFound && !vFound.destroyed) {
            hitDist = vh.distance;
            hitVehicle = vFound;
            hitJet = null;
            hitPoint.copy(vh.point);
          }
        }
      }

      const enemyMeshes: THREE.Object3D[] = [];
      for (const actor of this.actors) {
        if (!actor.alive || actor.id === b.attackerId || (!this.isFfaLike() && actor.team === b.team)) continue;
        if (actor.isPlayer && this.activeVehicle && this.activeVehicleSeat < 2) continue;
        if (actor.isPlayer) {
          const pCenter = _vecC.set(actor.position.x, actor.position.y + 1.12, actor.position.z);
          lineSeg.set(b.pos, nextPos);
          lineSeg.closestPointToPoint(pCenter, true, closestPt);
          const dSq = closestPt.distanceToSquared(pCenter);
          if (dSq < 0.34) {
            const dFromOrigin = b.pos.distanceTo(closestPt);
            if (dFromOrigin < hitDist) {
              hitDist = dFromOrigin;
              hitActor = actor;
              hitVehicle = null;
              hitJet = null;
              hitPoint.copy(closestPt);
              hitHead = closestPt.y > actor.position.y + 1.48;
            }
          } else if (!b.whizzed && dSq < 4.8) {
            b.whizzed = true;
            soundEngine.playBulletWhiz();
          }
        } else if (actor.rig) {
          enemyMeshes.push(...actor.rig.hitMeshes);
        }
      }

      if (enemyMeshes.length > 0) {
        const actorHits = this.raycaster.intersectObjects(enemyMeshes, false);
        if (actorHits.length > 0 && actorHits[0].distance < hitDist) {
          const h = actorHits[0];
          const targetId = h.object.userData.combatantId as string;
          const found = this.actors.find((a) => a.id === targetId);
          if (found && found.alive) {
            hitDist = h.distance;
            hitActor = found;
            hitVehicle = null;
            hitJet = null;
            hitPoint.copy(h.point);
            hitHead = h.object.userData.hitbox === 'head';
          }
        }
      }

      if (hitJet) {
        const attacker = this.actors.find((a) => a.id === b.attackerId);
        if (b.damage > 0) {
          const shotDown = this.damageAirstrikeJet(
            hitJet.jet,
            hitJet.strike,
            Math.round(b.damage * 1.4),
            attacker,
            b.weaponShort
          );
          if (attacker?.isPlayer) {
            this.hitmarkerType = shotDown ? 'kill' : 'body';
            this.hitmarkerTime = performance.now();
            soundEngine.playHitmarker(shotDown, shotDown);
          }
        }
        this.spawnSparks(hitPoint, 0xfbbf24, 7);
        this.removeBulletAt(i);
        continue;
      }

      if (hitVehicle) {
        const attacker = this.actors.find((a) => a.id === b.attackerId);
        if (b.damage > 0) {
          const destroyed = this.damageVehicle(hitVehicle, Math.round(b.damage * 0.85), attacker);
          if (attacker?.isPlayer) {
            this.hitmarkerType = destroyed ? 'kill' : 'body';
            this.hitmarkerTime = performance.now();
            soundEngine.playHitmarker(destroyed, destroyed);
          }
        }
        this.spawnSparks(hitPoint, 0xfbbf24, 5);
        if (b.splashRadius) {
          this.triggerExplosion(hitPoint, b.splashRadius, b.damage * 0.85, attacker, b.weaponShort);
        }
        this.removeBulletAt(i);
        continue;
      }

      if (hitActor) {
        const attacker = this.actors.find((a) => a.id === b.attackerId);
        if (b.damage > 0) {
          let dmg = b.damage;
          if (hitHead) dmg = Math.round(dmg * b.headshotMult);
          if (b.traveled > b.maxRange * 0.55) {
            const t = (b.traveled - b.maxRange * 0.55) / (b.maxRange * 0.45);
            dmg = Math.max(6, Math.round(dmg * (1 - 0.35 * t)));
          }
          if (hitActor.isPlayer && !hitHead) {
            dmg = Math.round(dmg * 0.85);
          }

          const killed = attacker
            ? this.applyDamage(hitActor, attacker, dmg, hitHead, b.weaponShort)
            : false;

          if (attacker?.isPlayer) {
            this.hitmarkerType = killed ? 'kill' : hitHead ? 'head' : 'body';
            this.hitmarkerTime = performance.now();
            if (killed) {
              this.lastEliminatedName = hitActor.name;
              this.lastEliminatedHeadshot = hitHead;
            }
            soundEngine.playHitmarker(hitHead || killed, killed);
          }
        }
        this.spawnSparks(hitPoint, 0xef4444, 5);
        this.removeBulletAt(i);
        continue;
      }

      if (worldHits.length > 0) {
        const hitObj = worldHits[0].object;
        const attacker = this.actors.find((a) => a.id === b.attackerId);
        const barrelId = hitObj.userData?.barrelId as string | undefined;
        const wallId = hitObj.userData?.wallId as string | undefined;

        const holeScale = b.splashRadius
          ? 2.1
          : b.damage >= 70
          ? 1.55
          : b.damage >= 42
          ? 1.2
          : 0.95;

        if (barrelId) {
          const barrel = this.arena.barrels.find((br) => br.id === barrelId && !br.destroyed);
          if (barrel && b.damage > 0) {
            const blown = this.damageBarrel(barrel, Math.round(b.damage * 1.15), attacker, b.weaponShort);
            if (attacker?.isPlayer) {
              this.hitmarkerType = blown ? 'kill' : 'body';
              this.hitmarkerTime = performance.now();
              soundEngine.playHitmarker(blown, blown);
            }
          }
          this.spawnSparks(worldHits[0].point, 0xff8a1f, 6);
        } else if (wallId) {
          const wall = this.arena.destructibleWalls.find((w) => w.id === wallId && w.stage < 3);
          if (wall && b.damage > 0) {
            this.damageDestructibleWall(wall, Math.round(b.damage * 0.48), worldHits[0].point);
          }
          if (b.splashRadius) {
            this.triggerExplosion(worldHits[0].point, b.splashRadius, b.damage * 0.85, attacker, b.weaponShort);
          } else {
            this.spawnSparks(worldHits[0].point, 0xfbbf24, 4);
            this.spawnBulletHoleDecal(worldHits[0], holeScale);
            if (wall && this.debrisChunks.length < 56) {
              this.spawnDebrisChunks(worldHits[0].point, wall.materialType, 2);
            }
          }
        } else if (b.splashRadius) {
          this.triggerExplosion(worldHits[0].point, b.splashRadius, b.damage * 0.85, attacker, b.weaponShort);
        } else {
          this.spawnSparks(worldHits[0].point, 0xfbbf24, 4);
          this.spawnSmokePuff(
            worldHits[0].point,
            new THREE.Vector3((Math.random() - 0.5) * 0.5, 0.7, (Math.random() - 0.5) * 0.5),
            0.42,
            0.14,
            0.45
          );
          this.spawnBulletHoleDecal(worldHits[0], holeScale);
          if (this.debrisChunks.length < 48 && Math.random() < 0.45) {
            this.spawnDebrisChunks(worldHits[0].point, 'concrete', 1);
          }
          if (worldHits[0].face && Math.random() < 0.28) {
            const distToP = worldHits[0].point.distanceTo(this.player.position);
            if (distToP < 36) {
              soundEngine.playRicochet(THREE.MathUtils.clamp(1 - distToP / 36, 0.08, 0.45));
            }
          }
        }
        this.removeBulletAt(i);
        continue;
      }

      b.pos.copy(nextPos);
      b.traveled += stepDist;
      b.visualPos.lerp(b.pos, Math.min(1, dt * 32));
      b.mesh.position.copy(b.visualPos);
      b.mesh.lookAt(b.visualPos.clone().add(b.vel));

      if (b.traveled >= b.maxRange || b.pos.y < -4) {
        this.removeBulletAt(i);
      }
    }

    // 4. Rockets, Guided Missiles (Lock-On & Laser-Guided), Field Gun & Tank Shells
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      r.life -= dt;
      r.age += dt;

      if (r.guidance === 'lock_on' && (r.targetVehicleId || r.targetActorId || r.targetJetId)) {
        let targetPt: THREE.Vector3 | null = null;
        if (r.targetJetId) {
          for (const strike of this.airstrikes) {
            const tj = strike.jets.find((j) => j.id === r.targetJetId && !j.destroyed);
            if (tj) {
              targetPt = tj.position.clone();
              break;
            }
          }
        } else if (r.targetVehicleId) {
          const tv = this.arena.vehicles.find((v) => v.id === r.targetVehicleId && !v.destroyed);
          if (tv) targetPt = new THREE.Vector3(tv.position.x, tv.position.y + 1.1, tv.position.z);
        } else if (r.targetActorId) {
          const ta = this.actors.find((a) => a.id === r.targetActorId && a.alive);
          if (ta) targetPt = new THREE.Vector3(ta.position.x, ta.position.y + 1.1, ta.position.z);
        }
        if (targetPt) {
          if (r.isTopAttack && !r.targetJetId && r.age < 0.75 && r.pos.distanceTo(targetPt) > 18) {
            targetPt.y += 16; // Lofted top-attack arc for Javelin vs ground armor
          }
          const desired = targetPt.sub(r.pos).normalize().multiplyScalar(r.speed);
          r.vel.lerp(desired, Math.min(1, dt * (r.targetJetId ? 10 : 6.5))).normalize().multiplyScalar(r.speed);
        }
      } else if (r.guidance === 'laser_guided' && r.attackerId === this.player?.id) {
        const camDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();
        const guideTargets: THREE.Object3D[] = [...this.arena.staticRayMeshes];
        for (const strike of this.airstrikes) {
          for (const jet of strike.jets) {
            const friendlyJet = this.isFfaLike() ? strike.attackerId === r.attackerId : jet.team === r.team;
            if (!jet.destroyed && !friendlyJet) guideTargets.push(...jet.hitMeshes);
          }
        }
        this.raycaster.set(this.camera.position, camDir);
        this.raycaster.far = 280;
        const laserHits = this.raycaster.intersectObjects(guideTargets, false);
        const guidePoint =
          laserHits.length > 0
            ? laserHits[0].point.clone()
            : this.camera.position.clone().addScaledVector(camDir, 150);
        const desired = guidePoint.sub(r.pos).normalize().multiplyScalar(r.speed);
        r.vel.lerp(desired, Math.min(1, dt * 8.0)).normalize().multiplyScalar(r.speed);
      } else {
        r.vel.y -= 9.81 * r.gravityScale * dt;
      }

      nextPos.copy(r.pos).addScaledVector(r.vel, dt);
      segDir.copy(nextPos).sub(r.pos);
      const stepDist = segDir.length();
      segDir.divideScalar(Math.max(0.0001, stepDist));

      this.raycaster.set(r.pos, segDir);
      this.raycaster.far = stepDist;

      let impacted = false;
      let hitJetDirect: { jet: AirstrikeJet; strike: ActiveAirstrike } | null = null;
      let impactPoint = nextPos.clone();

      // Anti-Air proximity & direct fuse against Enemy Air Strike Jets (4.2m VT proximity fuze)
      for (const strike of this.airstrikes) {
        for (const jet of strike.jets) {
          const friendlyJet = this.isFfaLike() ? strike.attackerId === r.attackerId : jet.team === r.team;
          if (jet.destroyed || friendlyJet) continue;
          lineSeg.set(r.pos, nextPos);
          lineSeg.closestPointToPoint(jet.position, true, closestPt);
          if (closestPt.distanceToSquared(jet.position) < 4.2 * 4.2) {
            impacted = true;
            hitJetDirect = { jet, strike };
            impactPoint.copy(closestPt);
            break;
          }
        }
        if (hitJetDirect) break;
      }

      if (!impacted) {
        const worldHits = this.raycaster.intersectObjects(worldRayTargets, false);
        if (worldHits.length > 0) {
          impacted = true;
          impactPoint.copy(worldHits[0].point);
        } else {
          const vehMeshes: THREE.Object3D[] = [];
          for (const v of this.arena.vehicles) {
            if (v.destroyed) continue;
            if (v.seats.includes(r.attackerId)) continue;
            vehMeshes.push(...v.hitMeshes);
          }
          if (vehMeshes.length > 0) {
            const vh = this.raycaster.intersectObjects(vehMeshes, false);
            if (vh.length > 0) {
              impacted = true;
              impactPoint.copy(vh[0].point);
            }
          }
          if (!impacted) {
            for (const actor of this.actors) {
              if (!actor.alive || actor.id === r.attackerId) continue;
              const aCenter = _vecC.set(actor.position.x, actor.position.y + 1.1, actor.position.z);
              lineSeg.set(r.pos, nextPos);
              lineSeg.closestPointToPoint(aCenter, true, closestPt);
              if (closestPt.distanceToSquared(aCenter) < 0.72) {
                impacted = true;
                impactPoint.copy(closestPt);
                break;
              }
            }
          }
        }
      }

      if (impacted || r.life <= 0) {
        const attacker = this.actors.find((a) => a.id === r.attackerId);
        if (hitJetDirect) {
          const shotDown = this.damageAirstrikeJet(
            hitJetDirect.jet,
            hitJetDirect.strike,
            Math.round(r.maxDamage * 1.25),
            attacker,
            r.weaponShort
          );
          if (attacker?.isPlayer) {
            this.hitmarkerType = shotDown ? 'kill' : 'body';
            this.hitmarkerTime = performance.now();
            soundEngine.playHitmarker(shotDown, shotDown);
          }
          this.triggerExplosion(impactPoint, r.blastRadius, 0, undefined, r.weaponShort);
        } else {
          this.triggerExplosion(impactPoint, r.blastRadius, r.maxDamage, attacker, r.weaponShort);
        }
        this.removeRocketAt(i);
        continue;
      }

      r.pos.copy(nextPos);
      r.mesh.position.copy(r.pos);
      r.mesh.lookAt(r.pos.clone().add(r.vel));

      r.smokeAccum += dt;
      if (r.smokeAccum >= 0.032) {
        r.smokeAccum = 0;
        this.spawnSmokePuff(
          r.pos.clone(),
          new THREE.Vector3((Math.random() - 0.5) * 0.6, 0.65, (Math.random() - 0.5) * 0.6),
          0.65,
          0.22,
          0.95
        );
      }
    }

    // 5. Frag Grenades
    for (let i = this.activeGrenades.length - 1; i >= 0; i--) {
      const g = this.activeGrenades[i];
      g.fuse -= dt;
      g.vel.y -= 21 * dt;
      nextPos.copy(g.pos).addScaledVector(g.vel, dt);

      segDir.copy(nextPos).sub(g.pos);
      const stepDist = segDir.length();
      if (stepDist > 0.0005) {
        segDir.divideScalar(stepDist);
        this.raycaster.set(g.pos, segDir);
        this.raycaster.far = stepDist + 0.09;
        const hits = this.raycaster.intersectObjects(this.arena.staticRayMeshes, false);
        const hit = hits[0];
        const hitFace = hit?.face;
        if (hit && hitFace) {
          const normal = hitFace.normal
            .clone()
            .applyMatrix3(new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld))
            .normalize();
          const speed = g.vel.length();
          if (speed > 1.8) {
            const distP = g.pos.distanceTo(this.player.position);
            soundEngine.playGrenadeBounce(THREE.MathUtils.clamp(1 - distP / 28, 0.1, 0.7));
          }
          g.pos.copy(hit.point).addScaledVector(normal, 0.1);
          g.vel.reflect(normal).multiplyScalar(0.45);
          if (Math.abs(g.vel.y) < 0.7 && normal.y > 0.7) {
            g.vel.y = 0;
            g.vel.x *= 0.78;
            g.vel.z *= 0.78;
          }
        } else {
          g.pos.copy(nextPos);
        }
      }

      const floorY = groundHeightAt(g.pos.x, g.pos.z, g.pos.y + 0.25, this.arena);
      if (g.pos.y < floorY + 0.09) {
        g.pos.y = floorY + 0.09;
        if (Math.abs(g.vel.y) > 1.4) {
          const distP = g.pos.distanceTo(this.player.position);
          soundEngine.playGrenadeBounce(THREE.MathUtils.clamp(1 - distP / 28, 0.1, 0.6));
          g.vel.y = -g.vel.y * 0.42;
        } else {
          g.vel.y = 0;
        }
        g.vel.x *= 0.82;
        g.vel.z *= 0.82;
      }

      g.mesh.position.copy(g.pos);
      if (g.vel.lengthSq() > 0.15) {
        g.mesh.rotation.x += g.rotVel.x * dt;
        g.mesh.rotation.y += g.rotVel.y * dt;
        g.mesh.rotation.z += g.rotVel.z * dt;
      }
      g.ledMat.color.setHex(Math.sin(g.fuse * 26) > 0 ? 0xff2222 : 0x450a0a);

      g.smokeAccum += dt;
      if (g.smokeAccum >= 0.08) {
        g.smokeAccum = 0;
        this.spawnSmokePuff(g.pos.clone(), new THREE.Vector3(0, 0.6, 0), 0.35, 0.1, 0.35);
      }

      if (g.fuse <= 0) {
        const attacker = this.actors.find((a) => a.id === g.attackerId);
        this.triggerExplosion(g.pos, 6.4, 140, attacker, 'M67 Frag');
        this.removeGrenadeAt(i);
      }
    }

    // 6. Explosion Waves
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const ex = this.explosions[i];
      ex.life -= dt;
      if (ex.life <= 0) {
        this.scene.remove(ex.fireball);
        this.scene.remove(ex.ring);
        (ex.fireball.material as THREE.Material).dispose();
        (ex.ring.material as THREE.Material).dispose();
        this.explosions.splice(i, 1);
      } else {
        const p = 1 - ex.life / ex.maxLife;
        ex.fireball.scale.setScalar(0.35 + p * ex.radius * 0.58);
        (ex.fireball.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.88;
        ex.ring.scale.setScalar(0.5 + p * ex.radius * 1.15);
        (ex.ring.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.72;
      }
    }

    // 7. Smoke Puffs
    for (let i = this.smokePuffs.length - 1; i >= 0; i--) {
      const s = this.smokePuffs[i];
      s.life -= dt;
      if (s.life <= 0) {
        this.scene.remove(s.mesh);
        (s.mesh.material as THREE.Material).dispose();
        this.smokePuffs.splice(i, 1);
      } else {
        const p = 1 - s.life / s.maxLife;
        s.mesh.position.addScaledVector(s.vel, dt);
        s.mesh.scale.setScalar(THREE.MathUtils.lerp(s.startScale, s.endScale, p));
        (s.mesh.material as THREE.MeshStandardMaterial).opacity = (1 - p) * 0.52;
      }
    }

    // 8. Sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const sp = this.sparks[i];
      sp.life -= dt;
      if (sp.life <= 0) {
        this.scene.remove(sp.mesh);
        (sp.mesh.material as THREE.Material).dispose();
        this.sparks.splice(i, 1);
      } else {
        sp.vel.y -= 15 * dt;
        sp.mesh.position.addScaledVector(sp.vel, dt);
        (sp.mesh.material as THREE.MeshBasicMaterial).opacity = sp.life / sp.maxLife;
      }
    }

    // 9. Ejected Brass Casings
    for (let i = this.shells.length - 1; i >= 0; i--) {
      const sh = this.shells[i];
      sh.life -= dt;
      if (sh.life <= 0) {
        this.scene.remove(sh.mesh);
        this.shells.splice(i, 1);
      } else {
        sh.vel.y -= 14 * dt;
        sh.mesh.position.addScaledVector(sh.vel, dt);
        sh.mesh.rotation.x += sh.rotVel.x * dt;
        sh.mesh.rotation.y += sh.rotVel.y * dt;
        sh.mesh.rotation.z += sh.rotVel.z * dt;
      }
    }

    // 10. Flying Wall Debris Chunks
    for (let i = this.debrisChunks.length - 1; i >= 0; i--) {
      const dc = this.debrisChunks[i];
      dc.life -= dt;
      if (dc.life <= 0) {
        this.scene.remove(dc.mesh);
        this.debrisChunks.splice(i, 1);
      } else {
        dc.vel.y -= 20 * dt;
        dc.mesh.position.addScaledVector(dc.vel, dt);
        const fy = groundHeightAt(dc.mesh.position.x, dc.mesh.position.z, dc.mesh.position.y + 0.3, this.arena);
        if (dc.mesh.position.y < fy + 0.1) {
          dc.mesh.position.y = fy + 0.1;
          dc.vel.y = Math.abs(dc.vel.y) * 0.25;
          dc.vel.x *= 0.65;
          dc.vel.z *= 0.65;
        }
        dc.mesh.rotation.x += dc.rotVel.x * dt;
        dc.mesh.rotation.y += dc.rotVel.y * dt;
        dc.mesh.rotation.z += dc.rotVel.z * dt;
      }
    }
  }

  private getCurrentZone(): { id: 'A' | 'B' | 'C'; name: string } | null {
    if (!this.player || !this.arena.zones.length) return null;
    let bestZone: ArenaZoneInfo | null = null;
    let bestDist = Infinity;
    for (const z of this.arena.zones) {
      const d = Math.hypot(this.player.position.x - z.centerX, this.player.position.z - z.centerZ);
      if (d < bestDist) {
        bestDist = d;
        bestZone = z;
      }
    }
    return bestZone ? { id: bestZone.id, name: bestZone.name } : null;
  }

  private tick = () => {
    if (this.disposed) return;

    const now = performance.now();
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    if (this.phase === 'lobby' || this.phase === 'ended') {
      if (this.lobbyCameraMode === 'orbit') {
        this.lobbyYaw += dt * (this.lobbyInspecting ? 0.04 : 0.09);
      }

      const baseRadius =
        this.arena.halfSize > 600
          ? 440
          : this.arena.halfSize > 250
          ? 230
          : this.arena.halfSize > 110
          ? 135
          : 78;

      const desiredTarget = new THREE.Vector3(0, 3.0, 0);
      let presetRadius = baseRadius;
      if (this.lobbyCameraMode === 'overview') {
        presetRadius = baseRadius * 1.18;
      } else if (this.lobbyCameraMode === 'zone_a' && this.arena.zones[0]) {
        const z = this.arena.zones[0];
        desiredTarget.set(z.centerX, 4, z.centerZ);
        presetRadius = Math.max(26, Math.min(56, z.radius * 1.65));
      } else if (this.lobbyCameraMode === 'zone_b' && this.arena.zones[1]) {
        const z = this.arena.zones[1];
        desiredTarget.set(z.centerX, 4, z.centerZ);
        presetRadius = Math.max(26, Math.min(56, z.radius * 1.65));
      } else if (this.lobbyCameraMode === 'zone_c' && this.arena.zones[2]) {
        const z = this.arena.zones[2];
        desiredTarget.set(z.centerX, 4, z.centerZ);
        presetRadius = Math.max(26, Math.min(56, z.radius * 1.65));
      } else if (this.lobbyCameraMode === 'arsenal' && this.arena.arsenals[0]) {
        const ar = this.arena.arsenals[0];
        desiredTarget.set(ar.position.x, ar.position.y + 2.5, ar.position.z);
        presetRadius = Math.min(34, baseRadius * 0.36);
      }

      const effRadius = presetRadius * this.lobbyZoom;
      const horiz = Math.cos(this.lobbyPitch) * effRadius;
      const desiredCam = new THREE.Vector3(
        desiredTarget.x + Math.cos(this.lobbyYaw) * horiz,
        desiredTarget.y + Math.sin(this.lobbyPitch) * effRadius,
        desiredTarget.z + Math.sin(this.lobbyYaw) * horiz
      );

      this.lobbyCurrentCamPos.lerp(desiredCam, Math.min(1, dt * 5.2));
      this.lobbyCurrentLook.lerp(desiredTarget, Math.min(1, dt * 6.0));
      this.camera.position.copy(this.lobbyCurrentCamPos);
      this.camera.lookAt(this.lobbyCurrentLook);

      if (this.camera.fov !== 62) {
        this.camera.fov = 62;
        this.camera.updateProjectionMatrix();
      }
      this.sunLight.target.position.set(0, 0, 0);
      this.sunLight.position.copy(this.sunBaseOffset);
      this.sunLight.target.updateMatrixWorld();
      this.updatePickups(dt);
      this.updateEffects(dt);
    } else if (this.phase === 'playing') {
      if (this.config.mode === 'solo') {
        this.timeRemaining = Math.max(0, this.timeRemaining - dt);
        if (this.timeRemaining <= 0) {
          this.endMatch();
        }
      }

      if (this.phase === 'playing') {
        this.updatePlayer(dt);
        this.updateRemoteHumansAndBots(dt);
        this.updatePickups(dt);
        this.updateEffects(dt);

        if (this.arena.oceanTextures) {
          this.arena.oceanTextures.map.offset.x = (this.arena.oceanTextures.map.offset.x + dt * 0.012) % 1;
          this.arena.oceanTextures.map.offset.y = (this.arena.oceanTextures.map.offset.y + dt * 0.006) % 1;
          this.arena.oceanTextures.bumpMap.offset.copy(this.arena.oceanTextures.map.offset);
        }

        // Keep shadow frustum centered around player (and tracking altitude in helicopters)
        const qx = Math.round(this.player.position.x / 4) * 4;
        const qz = Math.round(this.player.position.z / 4) * 4;
        const followY = Math.max(0, this.player.position.y * 0.55);
        this.sunLight.target.position.set(qx, 0, qz);
        this.sunLight.position.set(
          qx + this.sunBaseOffset.x,
          this.sunBaseOffset.y + followY,
          qz + this.sunBaseOffset.z
        );
        this.sunLight.target.updateMatrixWorld();

        if (this.config.mode === 'multiplayer') {
          this.netSendAccum += dt;
          if (this.netSendAccum >= 0.05) {
            this.netSendAccum = 0;
            this.mpClient.sendState({
              x: this.player.position.x,
              y: this.player.position.y,
              z: this.player.position.z,
              yaw: this.player.yaw,
              pitch: this.player.pitch,
              vx: this.player.velocity.x,
              vz: this.player.velocity.z,
              weaponId: this.activeWeapon,
              health: this.player.health,
              alive: this.player.alive,
              gunGameTier: this.player.gunGameTier,
              vehicleId: this.activeVehicle ? this.activeVehicle.id : null,
              vehicleSeat: this.activeVehicle ? this.activeVehicleSeat : null,
              turretId: this.activeMountedMg ? this.activeMountedMg.id : null,
              vehicleTransform: this.activeVehicle
                ? {
                    x: this.activeVehicle.position.x,
                    y: this.activeVehicle.position.y,
                    z: this.activeVehicle.position.z,
                    yaw: this.activeVehicle.yaw,
                    speed: this.activeVehicle.speed,
                    turretYaw: this.activeVehicle.turretYaw,
                    turretPitch: this.activeVehicle.turretPitch,
                    health: this.activeVehicle.health,
                    destroyed: this.activeVehicle.destroyed,
                  }
                : undefined,
            });
          }
        }
      }
    }

    this.damageIndicators = this.damageIndicators.filter((d) => d.expiresAt > now);
    if (this.hitmarkerType !== 'none' && now - this.hitmarkerTime > 260) {
      this.hitmarkerType = 'none';
    }

    this.renderer.render(this.scene, this.camera);

    this.hudEmitAccum += dt;
    if (this.hudEmitAccum >= 0.05) {
      this.hudEmitAccum = 0;
      this.emitHud();
    }

    this.scheduleNextFrame();
  };

  private scheduleNextFrame() {
    if (this.disposed) return;
    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (sync && state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private emitHud() {
    const spec = WEAPONS[this.activeWeapon];
    const horizSpeed = this.player ? Math.hypot(this.player.velocity.x, this.player.velocity.z) : 0;
    const spreadRad =
      (this.isAds ? spec.adsSpread : spec.baseSpread) +
      THREE.MathUtils.clamp(horizSpeed / 8, 0, 1) * spec.moveSpreadPenalty +
      this.recoilOffsetPitch * 0.45;

    const radarBlips: RadarBlip[] = [];
    const isFfa = this.isFfaLike();
    for (const actor of this.actors) {
      if (actor.isPlayer || !actor.alive) continue;
      // Enemies show within 82m OR anytime UAV Recon is active
      const d = this.player ? actor.position.distanceTo(this.player.position) : 0;
      const isEnemyBlip = isFfa || actor.team !== this.player?.team;
      if (isEnemyBlip && this.uavActiveTimer <= 0 && d > 82) {
        continue;
      }
      radarBlips.push({
        x: actor.position.x,
        z: actor.position.z,
        team: isFfa ? 'red' : actor.team,
        alive: actor.alive,
      });
    }
    for (const ar of this.arena.arsenals) {
      radarBlips.push({
        x: ar.position.x,
        z: ar.position.z,
        team: 'arsenal',
        label: ar.name,
      });
    }
    for (const pk of this.arena.pickups) {
      if (!pk.active) continue;
      radarBlips.push({
        x: pk.position.x,
        z: pk.position.z,
        team: pk.type === 'health' ? 'pickup_health' : 'pickup_ammo',
      });
    }
    for (const mg of this.arena.mountedMgs) {
      if (mg.destroyed) continue;
      radarBlips.push({
        x: mg.position.x,
        z: mg.position.z,
        team: mg.kind === 'field_gun' ? 'field_gun' : 'turret',
      });
    }
    for (const b of this.arena.beltPickups) {
      if (b.collected) continue;
      radarBlips.push({
        x: b.position.x,
        z: b.position.z,
        team: 'belt_box',
      });
    }
    for (const tr of this.dugTrenches) {
      radarBlips.push({
        x: tr.position.x,
        z: tr.position.z,
        team: 'trench',
      });
    }
    for (const hg of this.arena.hangars) {
      radarBlips.push({
        x: hg.position.x,
        z: hg.position.z,
        team: 'hangar',
        label: hg.name,
      });
    }
    for (const v of this.arena.vehicles) {
      if (v.destroyed) continue;
      radarBlips.push({
        x: v.position.x,
        z: v.position.z,
        team: v.type === 'attack_heli' ? 'heli' : 'vehicle',
      });
    }
    for (const as of this.airstrikes) {
      radarBlips.push({
        x: as.target.x,
        z: as.target.z,
        team: 'airstrike',
      });
      for (const jet of as.jets) {
        if (!jet.destroyed) {
          radarBlips.push({
            x: jet.position.x,
            z: jet.position.z,
            team: 'airstrike',
            label: 'JET',
          });
        }
      }
    }

    const scoreboard: ScoreboardEntry[] = this.actors
      .map((a) => ({
        id: a.id,
        name: a.name,
        team: a.team,
        isPlayer: a.isPlayer,
        isHuman: a.isHuman,
        weaponId: a.weaponId,
        kills: a.kills,
        deaths: a.deaths,
        assists: a.assists,
        alive: a.alive,
        gunGameTier: a.gunGameTier,
      }))
      .sort((a, b) =>
        this.config.matchMode === 'gun_game'
          ? (b.gunGameTier ?? 0) - (a.gunGameTier ?? 0) || b.kills - a.kills || a.deaths - b.deaths
          : b.kills - a.kills || a.deaths - b.deaths
      );

    const carriedStates = {} as Record<WeaponId, WeaponRuntimeState>;
    for (const wid of this.loadout) {
      carriedStates[wid] = { ...this.weaponStates[wid] };
    }
    carriedStates[this.activeWeapon] = { ...this.weaponStates[this.activeWeapon] };

    const lockOn: LockOnHudState = {
      capable: spec.guidance !== 'none',
      mode: spec.guidance,
      locking: spec.guidance === 'lock_on' && this.lockProgress > 0 && this.lockProgress < 1,
      locked: spec.guidance === 'lock_on' && this.lockProgress >= 1,
      progress: this.lockProgress,
      targetName: this.lockCandidateName,
    };

    const isArmor = this.activeVehicle?.type === 'tank' || this.activeVehicle?.type === 'heavy_tank';
    const isApc = this.activeVehicle?.type === 'apc';
    const isHeli = this.activeVehicle?.type === 'attack_heli';
    const cannonReloadSec = this.activeVehicle?.type === 'heavy_tank' ? 2.4 : 2.0;

    const crew: Array<{ seat: number; role: string; occupantName: string | null; isPlayer: boolean }> = [];
    if (this.activeVehicle) {
      for (let s = 0; s < this.activeVehicle.maxSeats; s++) {
        const sid = this.activeVehicle.seats[s];
        const occ = sid ? this.actors.find((a) => a.id === sid) : undefined;
        crew.push({
          seat: s,
          role: this.activeVehicle.seatRoles[s] || `Seat ${s + 1}`,
          occupantName: occ ? occ.name : null,
          isPlayer: sid === this.player?.id,
        });
      }
    }

    const nearFreeSeat =
      this.nearVehicle &&
      !this.activeVehicle &&
      !this.activeMountedMg &&
      !this.nearArsenalName &&
      !this.isEnemyOccupiedVehicle(this.nearVehicle, this.player?.team || 'blue')
        ? this.getVehicleFirstFreeSeat(this.nearVehicle)
        : -1;

    let mgCooldownPct = 1;
    if (this.activeMountedMg) {
      if (this.activeMountedMg.kind === 'field_gun') {
        mgCooldownPct = 1 - Math.min(1, this.activeMountedMg.fireCooldown / 2.1);
      } else if (this.activeMountedMg.kind === 'tow') {
        mgCooldownPct = 1 - Math.min(1, this.activeMountedMg.fireCooldown / 2.6);
      }
    }

    const inPassengerPort = Boolean(this.activeVehicle && this.activeVehicleSeat >= 2);
    const vehicleCrosshairSpread =
      this.activeVehicle && inPassengerPort
        ? spreadRad
        : this.activeVehicle
        ? isArmor
          ? 0.008
          : isApc || isHeli
          ? 0.009
          : 0.011
        : this.activeMountedMg
        ? 0.009
        : spreadRad;

    const heliAltitude =
      this.activeVehicle && isHeli
        ? Math.max(
            0,
            Math.round(
              this.activeVehicle.position.y -
                groundHeightAt(
                  this.activeVehicle.position.x,
                  this.activeVehicle.position.z,
                  this.activeVehicle.position.y + 0.6,
                  this.arena
                )
            )
          )
        : 0;

    const playerTier = this.player?.gunGameTier ?? 0;
    const gunGameHud: GunGameHudState | null =
      this.config.matchMode === 'gun_game'
        ? {
            tier: playerTier + 1,
            totalTiers: GUN_GAME_LADDER.length,
            currentWeaponId:
              GUN_GAME_LADDER[Math.min(GUN_GAME_LADDER.length - 1, Math.max(0, playerTier))] ??
              this.activeWeapon,
            nextWeaponId:
              playerTier + 1 < GUN_GAME_LADDER.length ? GUN_GAME_LADDER[playerTier + 1] : null,
            leaderName: scoreboard[0]?.name || this.player?.name || 'Leader',
            leaderTier: Math.min(GUN_GAME_LADDER.length, (scoreboard[0]?.gunGameTier ?? 0) + 1),
          }
        : null;

    this.onHudUpdate({
      phase: this.phase,
      playerUsername: this.player?.name || this.config.username || 'Vanguard-1',
      playerTeam: this.player?.team || this.config.playerTeam || 'blue',
      mode: this.config.mode,
      matchMode: this.config.matchMode,
      infantryOnly: MAPS[this.arena.mapId]?.infantryOnly ?? false,
      roomId: this.config.roomId,
      mpConnected: this.mpConnected,
      mpHumanCount: this.mpHumanCount,
      blueScore: this.blueScore,
      redScore: this.redScore,
      scoreLimit: this.config.scoreLimit,
      timeRemaining: this.timeRemaining,
      gunGame: gunGameHud,
      winnerName: this.winnerName,
      health: this.player?.health ?? 100,
      maxHealth: this.player?.maxHealth ?? 100,
      stamina: this.stamina,
      isAlive: this.player?.alive ?? true,
      respawnTimer: Math.max(0, this.player?.respawnTimer ?? 0),
      activeSlot: this.activeSlot,
      loadout: [...this.loadout] as LoadoutSlots,
      activeWeapon: this.activeWeapon,
      weaponStates: carriedStates,
      isReloading: this.isReloading,
      reloadProgress: this.isReloading
        ? 1 - this.reloadTimer / WEAPONS[this.activeWeapon].reloadTime
        : 0,
      isAds: this.isAds,
      isSteadyAim: this.isSteadyAim,
      scopeZoom:
        spec.optic === 'sniper'
          ? this.scopeZoomLevel === 2
            ? 8
            : 4
          : spec.optic === 'acog' || spec.optic === 'thermal_lock'
          ? this.scopeZoomLevel === 2
            ? 4
            : 2.2
          : spec.optic === 'pgo'
          ? 2.7
          : 1.4,
      crosshairSpread: Math.round(THREE.MathUtils.clamp(vehicleCrosshairSpread * 780, 4, 58)),
      hitmarkerType: this.hitmarkerType,
      hitmarkerTime: this.hitmarkerTime,
      lastEliminatedName: this.lastEliminatedName,
      lastEliminatedHeadshot: this.lastEliminatedHeadshot,
      playerPos: {
        x: this.player?.position.x ?? 0,
        z: this.player?.position.z ?? 0,
        yaw: this.player?.yaw ?? 0,
      },
      currentZone: this.getCurrentZone(),
      zones: this.arena.zones,
      radarBlips,
      killFeed: [...this.killFeed],
      scoreboard,
      damageIndicators: [...this.damageIndicators],
      winner: this.winner,
      pointerLocked: this.pointerLocked,
      isTouchDevice: this.isTouchDevice,
      touchControlsActive: this.isTouchControlsActive(),
      pickupNotice: this.pickupNotice,
      arenaHalfSize: this.arena.halfSize,
      grenades: this.grenades,
      maxGrenades: this.maxGrenades,
      isCookingGrenade: this.isCookingGrenade,
      grenadeCookProgress: this.isCookingGrenade ? 1 - Math.max(0, this.grenadeCookTimer) / 2.8 : 0,
      carriedBelts: this.carriedBelts,
      maxCarriedBelts: this.maxCarriedBelts,
      trench: {
        count: this.dugTrenches.length,
        maxCount: this.maxTrenches,
        isDigging: this.isDiggingTrench,
        progress: this.isDiggingTrench ? 1 - Math.max(0, this.digTrenchTimer) / this.digTrenchDuration : 0,
      },
      arsenal: {
        nearPrompt: this.nearArsenalName !== null && !this.activeVehicle && !this.activeMountedMg,
        isOpen: this.arsenalOpen,
        arsenalName: this.nearArsenalName,
      },
      hangar: {
        nearPrompt:
          this.nearHangar !== null &&
          !this.activeVehicle &&
          !this.activeMountedMg &&
          !this.nearArsenalName &&
          !this.nearVehicle,
        hangarName: this.nearHangar ? this.nearHangar.name : null,
        canServiceVehicle: Boolean(this.activeVehicle && this.nearHangar),
      },
      lockOn,
      killStreak: {
        current: this.streakCurrent,
        best: this.streakBest,
        uavActiveTimer: this.uavActiveTimer,
        airstrikeCharges: this.airstrikeCharges,
        recentBanner: this.streakBanner,
      },
      mountedMg: {
        active: this.activeMountedMg !== null,
        kind: this.activeMountedMg ? this.activeMountedMg.kind : null,
        name: this.activeMountedMg ? this.activeMountedMg.name : '',
        heat: this.activeMountedMg ? this.activeMountedMg.heat : 0,
        overheated: this.activeMountedMg ? this.activeMountedMg.overheated : false,
        cooldownPct: mgCooldownPct,
        ammo: this.activeMountedMg ? this.activeMountedMg.ammo : 0,
        maxAmmo: this.activeMountedMg ? this.activeMountedMg.maxAmmo : 0,
        isReloading: this.mgReloading,
        reloadProgress: this.mgReloading ? 1 - Math.max(0, this.mgReloadTimer) / this.mgReloadDuration : 0,
        nearbyBeltsCount: this.activeMountedMg ? this.countNearbyGroundBelts(this.activeMountedMg) : 0,
        nearPromptName:
          this.nearMountedMg && !this.activeMountedMg && !this.activeVehicle && !this.nearArsenalName && !this.nearHangar
            ? this.nearMountedMg.name
            : null,
        nearDestroyedName:
          this.nearDestroyedMg &&
          !this.activeMountedMg &&
          !this.activeVehicle &&
          !this.nearArsenalName &&
          !this.nearHangar &&
          !this.nearMountedMg
            ? this.nearDestroyedMg.name
            : null,
        isRepairing: this.repairingMg !== null,
        repairProgress: this.repairingMg ? 1 - Math.max(0, this.repairTimer) / this.repairDuration : 0,
      },
      vehicle: {
        active: this.activeVehicle !== null,
        type: this.activeVehicle ? this.activeVehicle.type : null,
        name: this.activeVehicle ? this.activeVehicle.name : '',
        health: this.activeVehicle ? this.activeVehicle.health : 0,
        maxHealth: this.activeVehicle ? this.activeVehicle.maxHealth : 100,
        speedKmh: this.activeVehicle
          ? Math.round(Math.hypot(this.activeVehicle.speed, this.activeVehicle.vy) * 3.6)
          : 0,
        weaponCooldownPct: this.activeVehicle
          ? isArmor && this.activeVehicleSeat === 0
            ? 1 - Math.min(1, this.activeVehicle.fireCooldown / cannonReloadSec)
            : isHeli && this.activeVehicleSeat === 0
            ? 1 - Math.min(1, this.activeVehicle.fireCooldown / 0.28)
            : 1
          : 1,
        ammo: this.activeVehicle ? this.activeVehicle.ammo : 0,
        maxAmmo: this.activeVehicle ? this.activeVehicle.maxAmmo : 0,
        ammoLabel: this.activeVehicle ? this.activeVehicle.ammoLabel : '',
        secondaryAmmo: this.activeVehicle ? this.activeVehicle.secondaryAmmo : 0,
        secondaryMaxAmmo: this.activeVehicle ? this.activeVehicle.secondaryMaxAmmo : 0,
        secondaryLabel: this.activeVehicle ? this.activeVehicle.secondaryLabel : '',
        altitude: heliAltitude,
        rotorPct: this.activeVehicle ? Math.round(this.activeVehicle.rotorRpm * 100) : 0,
        nearPromptName:
          nearFreeSeat !== -1 && this.nearVehicle ? this.nearVehicle.name : null,
        nearFreeSeatIndex: nearFreeSeat !== -1 ? nearFreeSeat : null,
        seatIndex: this.activeVehicle ? this.activeVehicleSeat : 0,
        maxSeats: this.activeVehicle ? this.activeVehicle.maxSeats : 0,
        seatRole: this.activeVehicle
          ? this.activeVehicle.seatRoles[this.activeVehicleSeat] || 'Crew'
          : '',
        crew,
      },
    });
  }

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    soundEngine.updateVehicleEngine(false, 0, false);
    soundEngine.updateHelicopterAudio(false, 0, false);
    this.mpClient.disconnect();

    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('orientationchange', this.handleOrientationResize);
    window.removeEventListener('touchstart', this.handleFirstTouch);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('wheel', this.handleWheel);
    window.removeEventListener('contextmenu', this.handleContextMenu);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);

    if (document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock();
    }

    this.clearDynamicEffects();
    for (const g of this.arena.disposables.geometries) g.dispose();
    for (const m of this.arena.disposables.materials) m.dispose();
    for (const t of this.arena.disposables.textures) t.dispose();
    this.sparkGeo.dispose();
    this.debrisGeo.dispose();
    this.bulletCoreGeo.dispose();
    this.tracerTailGeo.dispose();
    this.smokeGeo.dispose();
    this.fireballGeo.dispose();
    this.shockRingGeo.dispose();
    this.holeGeo.dispose();
    this.shellGeo.dispose();
    this.craterDecalGeo.dispose();
    this.craterRimGeo.dispose();
    this.craterRubbleGeo.dispose();
    this.bulletHoleTex.dispose();
    this.craterTex.dispose();
    this.wallScorchTex.dispose();
    this.wallStage1Tex.dispose();
    this.wallStage2Tex.dispose();
    this.blastGlowTex.dispose();
    this.bulletHoleMat.dispose();
    this.craterDecalMat.dispose();
    this.craterRimMat.dispose();
    this.wallScorchMat.dispose();
    this.brassMat.dispose();
    this.oliveGrenadeMat.dispose();
    this.jetMat.dispose();
    this.trenchEarthTex.map.dispose();
    this.trenchEarthTex.bumpMap.dispose();
    this.trenchEarthMat.dispose();
    this.trenchPitMat.dispose();
    this.trenchTimberMat.dispose();
    this.trenchSandbagMat.dispose();
    this.concreteDebrisMat.dispose();
    this.sandstoneDebrisMat.dispose();
    this.steelDebrisMat.dispose();

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
