import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ArenaData,
  createTacticalArena,
  groundHeightAt,
  resolveHorizontalCollision,
} from './arena';
import { soundEngine } from './audio';
import { buildCombatantRig, CombatantRig } from './botModel';
import {
  DamageDirectionIndicator,
  Difficulty,
  GamePhase,
  HudSnapshot,
  KillFeedItem,
  MapId,
  MatchConfig,
  RadarBlip,
  ScoreboardEntry,
  TeamId,
  WeaponId,
  WeaponRuntimeState,
} from './types';
import { buildWeaponViewmodel, ViewmodelHandle, WEAPON_ORDER, WEAPONS } from './weapons';

const BLUE_CALLSIGNS = ['Vanguard-1', 'Falcon', 'Kestrel', 'Titan', 'Specter'];
const RED_CALLSIGNS = ['Viper', 'Ravager', 'Onyx', 'Phantom', 'Striker'];

const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();
const _vecC = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _euler = new THREE.Euler(0, 0, 0, 'YXZ');

interface TracerEffect {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
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

interface CombatantActor {
  id: string;
  name: string;
  team: TeamId;
  isPlayer: boolean;
  weaponId: WeaponId;
  position: THREE.Vector3;
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
  lastDamagedBy: Record<string, number>;
  rig?: CombatantRig;
  waypointIdx: number;
  strafeDir: number;
  strafeTimer: number;
  fireCooldown: number;
  reactionTimer: number;
  targetEnemyId: string | null;
  deathAnimTimer: number;
  walkCycle: number;
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

  // Viewmodels
  private weaponPivot: THREE.Group;
  private viewmodels: Record<WeaponId, ViewmodelHandle>;
  private activeWeapon: WeaponId = 'm4a1';
  private lastWeapon: WeaponId = 'mp5';
  private weaponStates: Record<WeaponId, WeaponRuntimeState>;

  // Loop & timing
  private frameId = 0;
  private disposed = false;
  private lastTime = performance.now();
  private hudEmitAccum = 0;
  private lobbyOrbitAngle = 0;

  // Match state
  private phase: GamePhase = 'lobby';
  private config: MatchConfig;
  private blueScore = 0;
  private redScore = 0;
  private timeRemaining = 300;
  private winner: TeamId | 'draw' | null = null;
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
  private hitmarkerType: 'none' | 'body' | 'head' | 'kill' = 'none';
  private hitmarkerTime = 0;
  private lastEliminatedName: string | null = null;
  private lastEliminatedHeadshot = false;
  private pointerLocked = false;

  // Input state
  private keys: Record<string, boolean> = {};
  private mouseDownLeft = false;
  private mouseDownRight = false;

  // Shared raycaster & FX pools
  private raycaster = new THREE.Raycaster();
  private tracers: TracerEffect[] = [];
  private sparks: SparkEffect[] = [];
  private shells: ShellCasingEffect[] = [];
  private sparkGeo = new THREE.BoxGeometry(0.065, 0.065, 0.065);
  private tracerGeo = new THREE.CylinderGeometry(0.016, 0.016, 1, 6);
  private shellGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.036, 6);
  private brassMat = new THREE.MeshStandardMaterial({
    color: 0xd9a441,
    metalness: 0.92,
    roughness: 0.22,
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

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
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

    // Scene & Lighting Rig (reconfigured per map)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x28262b);
    this.scene.fog = new THREE.FogExp2(0x22252e, 0.0085);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x262930, 0.92);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffdfba, 2.35);
    this.sunLight.position.set(38, 42, 22);
    if (!this.isSoftwareGl) {
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.width = 2048;
      this.sunLight.shadow.mapSize.height = 2048;
      this.sunLight.shadow.camera.near = 5;
      this.sunLight.shadow.camera.far = 140;
      this.sunLight.shadow.camera.left = -48;
      this.sunLight.shadow.camera.right = 48;
      this.sunLight.shadow.camera.top = 48;
      this.sunLight.shadow.camera.bottom = -48;
      this.sunLight.shadow.bias = -0.0005;
      this.sunLight.shadow.normalBias = 0.02;
    }
    this.scene.add(this.sunLight);

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 0.55);
    rimLight.position.set(-36, 22, -32);
    this.scene.add(rimLight);

    const aspect =
      (container.clientWidth || window.innerWidth) /
      (container.clientHeight || window.innerHeight);
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.08, 280);
    this.camera.rotation.order = 'YXZ';
    this.scene.add(this.camera);

    this.weaponPivot = new THREE.Group();
    this.camera.add(this.weaponPivot);

    this.muzzleLight = new THREE.PointLight(0xfbbf24, 0, 14, 2);
    this.muzzleLight.position.set(0.2, -0.1, -1.0);
    this.camera.add(this.muzzleLight);

    // Build 6 Realistic Composite Viewmodels
    this.viewmodels = {
      m4a1: buildWeaponViewmodel('m4a1'),
      ak74: buildWeaponViewmodel('ak74'),
      mp5: buildWeaponViewmodel('mp5'),
      m870: buildWeaponViewmodel('m870'),
      mk14: buildWeaponViewmodel('mk14'),
      m24: buildWeaponViewmodel('m24'),
    };
    for (const id of WEAPON_ORDER) {
      this.viewmodels[id].root.visible = false;
      this.weaponPivot.add(this.viewmodels[id].root);
    }
    this.weaponPivot.visible = false;

    this.loadArena(this.config.mapId || 'yard');

    this.tracerGeo.rotateX(Math.PI / 2);
    this.shellGeo.rotateX(Math.PI / 2);

    this.weaponStates = this.createFreshWeaponStates();
    this.setupMatchActors();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.emitHud();
    this.scheduleNextFrame();
  }

  private loadArena(mapId: MapId) {
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
    this.sunLight.position.set(...atm.sunPos);
    this.hemiLight.color.setHex(atm.hemiSky);
    this.hemiLight.groundColor.setHex(atm.hemiGround);
    this.hemiLight.intensity = atm.hemiIntensity;
  }

  private createFreshWeaponStates(): Record<WeaponId, WeaponRuntimeState> {
    return {
      m4a1: { id: 'm4a1', mag: WEAPONS.m4a1.magSize, reserve: WEAPONS.m4a1.reserveMax },
      ak74: { id: 'ak74', mag: WEAPONS.ak74.magSize, reserve: WEAPONS.ak74.reserveMax },
      mp5: { id: 'mp5', mag: WEAPONS.mp5.magSize, reserve: WEAPONS.mp5.reserveMax },
      m870: { id: 'm870', mag: WEAPONS.m870.magSize, reserve: WEAPONS.m870.reserveMax },
      mk14: { id: 'mk14', mag: WEAPONS.mk14.magSize, reserve: WEAPONS.mk14.reserveMax },
      m24: { id: 'm24', mag: WEAPONS.m24.magSize, reserve: WEAPONS.m24.reserveMax },
    };
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

    const teamSize = this.config.teamSize;
    const weaponPool: WeaponId[] = ['m4a1', 'ak74', 'mp5', 'm870', 'mk14', 'm24'];

    const playerSpawn = this.arena.blueSpawns[0];
    this.player = {
      id: 'player',
      name: 'You',
      team: 'blue',
      isPlayer: true,
      weaponId: this.config.startingWeapon,
      position: playerSpawn.clone(),
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
      lastDamagedBy: {},
      waypointIdx: 2,
      strafeDir: 1,
      strafeTimer: 1,
      fireCooldown: 0,
      reactionTimer: 0,
      targetEnemyId: null,
      deathAnimTimer: 0,
      walkCycle: 0,
    };
    this.actors.push(this.player);

    for (let i = 1; i < teamSize; i++) {
      const wid = weaponPool[i % weaponPool.length];
      const spawn = this.arena.blueSpawns[i % this.arena.blueSpawns.length];
      const rig = buildCombatantRig(`blue-${i}`, 'blue', wid);
      rig.root.position.copy(spawn);
      this.scene.add(rig.root);
      this.actors.push({
        id: `blue-${i}`,
        name: BLUE_CALLSIGNS[i] || `Ally-${i}`,
        team: 'blue',
        isPlayer: false,
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
        lastDamagedBy: {},
        rig,
        waypointIdx: Math.floor(Math.random() * this.arena.waypoints.length),
        strafeDir: Math.random() > 0.5 ? 1 : -1,
        strafeTimer: 1.2 + Math.random(),
        fireCooldown: 0.4,
        reactionTimer: 0.25,
        targetEnemyId: null,
        deathAnimTimer: 0,
        walkCycle: Math.random() * 6,
      });
    }

    for (let i = 0; i < teamSize; i++) {
      const wid = weaponPool[(i + 1) % weaponPool.length];
      const spawn = this.arena.redSpawns[i % this.arena.redSpawns.length];
      const rig = buildCombatantRig(`red-${i}`, 'red', wid);
      rig.root.position.copy(spawn);
      rig.root.rotation.y = Math.PI;
      this.scene.add(rig.root);
      this.actors.push({
        id: `red-${i}`,
        name: RED_CALLSIGNS[i] || `Hostile-${i}`,
        team: 'red',
        isPlayer: false,
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
        lastDamagedBy: {},
        rig,
        waypointIdx: Math.floor(Math.random() * this.arena.waypoints.length),
        strafeDir: Math.random() > 0.5 ? 1 : -1,
        strafeTimer: 1.2 + Math.random(),
        fireCooldown: 0.4,
        reactionTimer: 0.25,
        targetEnemyId: null,
        deathAnimTimer: 0,
        walkCycle: Math.random() * 6,
      });
    }

    this.selectWeapon(this.config.startingWeapon, true);
  }

  public updateConfig(next: Partial<MatchConfig>) {
    const prevMap = this.config.mapId;
    this.config = { ...this.config, ...next };
    soundEngine.setMuted(this.config.muted);
    if (next.mapId && next.mapId !== prevMap && this.phase === 'lobby') {
      this.loadArena(next.mapId);
      this.setupMatchActors();
    }
    this.emitHud();
  }

  public startNewMatch(nextConfig?: MatchConfig) {
    if (nextConfig) {
      this.config = { ...nextConfig };
      soundEngine.setMuted(this.config.muted);
    }

    if (this.arena.mapId !== this.config.mapId) {
      this.loadArena(this.config.mapId);
    }

    this.blueScore = 0;
    this.redScore = 0;
    this.timeRemaining = 300;
    this.winner = null;
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

    for (const p of this.arena.pickups) {
      p.active = true;
      p.respawnTimer = 0;
      p.meshGroup.visible = true;
    }

    this.weaponStates = this.createFreshWeaponStates();
    this.setupMatchActors();

    this.phase = 'playing';
    this.weaponPivot.visible = true;
    this.requestPointerLock();
    this.emitHud();
  }

  public resumeMatch() {
    if (this.phase === 'paused') {
      this.phase = 'playing';
      this.weaponPivot.visible = true;
      this.requestPointerLock();
      this.emitHud();
    }
  }

  public pauseMatch() {
    if (this.phase === 'playing') {
      this.phase = 'paused';
      this.mouseDownLeft = false;
      this.mouseDownRight = false;
      this.isAds = false;
      this.adsToggle = false;
      if (document.pointerLockElement === this.renderer.domElement) {
        document.exitPointerLock();
      }
      this.emitHud();
    }
  }

  public returnToLobby() {
    this.phase = 'lobby';
    this.weaponPivot.visible = false;
    this.mouseDownLeft = false;
    this.mouseDownRight = false;
    if (document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock();
    }
    this.emitHud();
  }

  public requestPointerLock() {
    if (this.disposed) return;
    try {
      this.renderer.domElement.requestPointerLock?.();
    } catch {
      // Ignore pointer lock rejection in headless/sandboxed environments
    }
  }

  public selectWeaponFromUi(weaponId: WeaponId) {
    if (this.phase === 'playing') {
      this.selectWeapon(weaponId);
    } else {
      this.config.startingWeapon = weaponId;
      this.selectWeapon(weaponId, true);
    }
  }

  private selectWeapon(weaponId: WeaponId, instant = false) {
    if (this.activeWeapon === weaponId && !instant) return;
    this.lastWeapon = this.activeWeapon;
    this.activeWeapon = weaponId;
    if (this.player) this.player.weaponId = weaponId;
    this.isReloading = false;
    this.reloadTimer = 0;
    this.isAds = false;
    this.adsToggle = false;

    for (const id of WEAPON_ORDER) {
      this.viewmodels[id].root.visible = id === weaponId;
    }
    if (!instant) {
      this.weaponKickZ = 0.08;
      this.weaponKickRotX = -0.18;
      soundEngine.playMechanicalClick(560, 0.04);
    }
    this.emitHud();
  }

  private bindEvents() {
    window.addEventListener('resize', this.handleResize);
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

  private handleContextLost = (e: Event) => {
    e.preventDefault();
  };

  private handleContextMenu = (e: MouseEvent) => {
    if (this.phase === 'playing') {
      e.preventDefault();
    }
  };

  private handlePointerLockChange = () => {
    this.pointerLocked = document.pointerLockElement === this.renderer.domElement;
    if (!this.pointerLocked && this.phase === 'playing') {
      this.mouseDownLeft = false;
      this.mouseDownRight = false;
      this.phase = 'paused';
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
    this.keys[e.code] = true;

    if (e.code === 'KeyM') {
      this.updateConfig({ muted: !this.config.muted });
      return;
    }

    if (this.phase !== 'playing') return;

    if (e.code === 'Digit1') this.selectWeapon('m4a1');
    else if (e.code === 'Digit2') this.selectWeapon('ak74');
    else if (e.code === 'Digit3') this.selectWeapon('mp5');
    else if (e.code === 'Digit4') this.selectWeapon('m870');
    else if (e.code === 'Digit5') this.selectWeapon('mk14');
    else if (e.code === 'Digit6') this.selectWeapon('m24');
    else if (e.code === 'KeyQ') this.selectWeapon(this.lastWeapon);
    else if (e.code === 'KeyR') this.startReload();
    else if (e.code === 'KeyF') this.adsToggle = !this.adsToggle;
    else if (e.code === 'KeyV' || e.code === 'KeyZ') {
      if (this.activeWeapon === 'm24' || this.activeWeapon === 'mk14') {
        this.scopeZoomLevel = this.scopeZoomLevel === 1 ? 2 : 1;
        soundEngine.playMechanicalClick(680, 0.035);
        this.emitHud();
      }
    }
    else if (e.code === 'Tab') e.preventDefault();
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (this.phase !== 'playing' || !this.player.alive) return;
    if (!this.pointerLocked && !this.mouseDownLeft) return;

    const fovRatio = this.camera.fov / 75;
    const sensScale = 0.0021 * this.config.sensitivity * (this.isAds ? Math.max(0.18, fovRatio * 0.85) : 1.0);
    this.player.yaw -= e.movementX * sensScale;
    this.player.pitch = THREE.MathUtils.clamp(
      this.player.pitch - e.movementY * sensScale,
      -1.46,
      1.46
    );
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (this.phase !== 'playing') return;
    if (!this.pointerLocked) {
      if (e.target === this.renderer.domElement) {
        this.requestPointerLock();
      }
      return;
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
    if (this.phase !== 'playing') return;
    const idx = WEAPON_ORDER.indexOf(this.activeWeapon);
    const nextIdx = (idx + (e.deltaY > 0 ? 1 : -1) + WEAPON_ORDER.length) % WEAPON_ORDER.length;
    this.selectWeapon(WEAPON_ORDER[nextIdx]);
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

  private spawnShellCasing(vm: ViewmodelHandle) {
    if (this.shells.length > 24) return;
    vm.ejectionPort.getWorldPosition(_vecB);
    const mesh = new THREE.Mesh(this.shellGeo, this.brassMat);
    mesh.position.copy(_vecB);

    // Eject to the right and slightly upward relative to camera look
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

  private tryPlayerFire() {
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

    if (this.activeWeapon === 'm870') {
      this.pumpAnimTimer = 0.55;
    }

    soundEngine.playGunshot(this.activeWeapon, 1.0);
    this.muzzleFlashTimer = 0.05;
    this.muzzleLight.color.setHex(spec.tracerColor);
    this.muzzleLight.intensity = 3.4;

    const vm = this.viewmodels[this.activeWeapon];
    vm.muzzleFlash.visible = true;
    vm.muzzleFlash.rotation.z = Math.random() * Math.PI * 2;
    vm.muzzlePoint.getWorldPosition(_vecA);
    this.boltKick = 0.045;

    if (this.activeWeapon !== 'm24' && this.activeWeapon !== 'm870') {
      this.spawnShellCasing(vm);
    } else {
      window.setTimeout(() => {
        if (!this.disposed && this.phase === 'playing') {
          this.spawnShellCasing(this.viewmodels[this.activeWeapon]);
        }
      }, 320);
    }

    const horizSpeed = Math.hypot(this.player.velocity.x, this.player.velocity.z);
    const moveFactor = THREE.MathUtils.clamp(horizSpeed / 8.0, 0, 1);
    const baseSpread = this.isAds ? spec.adsSpread : spec.baseSpread;
    const totalSpread = baseSpread + moveFactor * spec.moveSpreadPenalty * (this.isAds ? 0.35 : 1);

    const enemyTargets: THREE.Object3D[] = [];
    for (const actor of this.actors) {
      if (actor.team !== this.player.team && actor.alive && actor.rig) {
        enemyTargets.push(...actor.rig.hitMeshes);
      }
    }

    let bestHitResult: 'none' | 'body' | 'head' | 'kill' = 'none';
    let killedName: string | null = null;
    let killedHeadshot = false;

    for (let p = 0; p < spec.pellets; p++) {
      _euler.set(
        this.player.pitch + this.recoilOffsetPitch + (Math.random() - 0.5) * 2 * totalSpread,
        this.player.yaw + this.recoilOffsetYaw + (Math.random() - 0.5) * 2 * totalSpread,
        0,
        'YXZ'
      );
      _dir.set(0, 0, -1).applyEuler(_euler).normalize();
      this.raycaster.set(this.camera.position, _dir);
      this.raycaster.far = spec.range;

      const worldHits = this.raycaster.intersectObjects(this.arena.staticRayMeshes, false);
      const worldDist = worldHits.length > 0 ? worldHits[0].distance : spec.range;

      const enemyHits = this.raycaster.intersectObjects(enemyTargets, false);
      if (enemyHits.length > 0 && enemyHits[0].distance < worldDist) {
        const hit = enemyHits[0];
        const targetId = hit.object.userData.combatantId as string;
        const hitbox = (hit.object.userData.hitbox as 'head' | 'body') || 'body';
        const victim = this.actors.find((a) => a.id === targetId);

        if (victim && victim.alive) {
          let dmg = spec.damage;
          if (hitbox === 'head') dmg = Math.round(dmg * spec.headshotMult);
          if (hit.distance > spec.range * 0.55) {
            const t = (hit.distance - spec.range * 0.55) / (spec.range * 0.45);
            dmg = Math.max(4, Math.round(dmg * (1 - 0.4 * t)));
          }

          const killed = this.applyDamage(victim, this.player, dmg, hitbox === 'head', spec.shortName);
          this.spawnSparks(hit.point, 0xef4444, 5);
          this.spawnTracer(_vecA, hit.point, spec.tracerColor);

          if (killed) {
            bestHitResult = 'kill';
            killedName = victim.name;
            killedHeadshot = hitbox === 'head';
          } else if (hitbox === 'head' && bestHitResult !== 'kill') {
            bestHitResult = 'head';
          } else if (bestHitResult === 'none') {
            bestHitResult = 'body';
          }
        }
      } else {
        const endPoint =
          worldHits.length > 0
            ? worldHits[0].point
            : _vecB.copy(this.camera.position).addScaledVector(_dir, spec.range);
        if (worldHits.length > 0) {
          this.spawnSparks(worldHits[0].point, 0xfbbf24, 3);
        }
        this.spawnTracer(_vecA, endPoint, spec.tracerColor);
      }
    }

    if (bestHitResult !== 'none') {
      this.hitmarkerType = bestHitResult;
      this.hitmarkerTime = performance.now();
      if (bestHitResult === 'kill') {
        this.lastEliminatedName = killedName;
        this.lastEliminatedHeadshot = killedHeadshot;
      }
      soundEngine.playHitmarker(
        bestHitResult === 'head' || bestHitResult === 'kill',
        bestHitResult === 'kill'
      );
    }

    const adsRecoilMult = this.isAds ? 0.62 : 1.0;
    this.recoilOffsetPitch = Math.min(0.28, this.recoilOffsetPitch + spec.recoilPitch * adsRecoilMult);
    this.recoilOffsetYaw += (Math.random() - 0.5) * 2 * spec.recoilYaw * adsRecoilMult;
    this.weaponKickZ = Math.min(
      0.16,
      this.weaponKickZ + (this.activeWeapon === 'm870' || this.activeWeapon === 'm24' ? 0.12 : 0.055)
    );
    this.weaponKickRotX = Math.min(
      0.32,
      this.weaponKickRotX + (this.activeWeapon === 'm24' || this.activeWeapon === 'mk14' ? 0.2 : 0.085)
    );

    if (state.mag === 0 && state.reserve > 0) {
      window.setTimeout(() => {
        if (!this.disposed && this.phase === 'playing') this.startReload();
      }, 160);
    }

    this.emitHud();
  }

  private applyDamage(
    victim: CombatantActor,
    attacker: CombatantActor,
    amount: number,
    isHeadshot: boolean,
    weaponShort: string
  ): boolean {
    if (!victim.alive || victim.spawnShieldTimer > 0) return false;

    const now = performance.now();
    victim.health = Math.max(0, victim.health - amount);
    victim.lastDamagedBy[attacker.id] = now;

    if (victim.isPlayer) {
      soundEngine.playDamageTaken();
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

      attacker.kills += 1;
      if (attacker.team === 'blue') this.blueScore += 1;
      else this.redScore += 1;

      for (const [otherId, ts] of Object.entries(victim.lastDamagedBy)) {
        if (otherId !== attacker.id && now - ts < 5500) {
          const assister = this.actors.find((a) => a.id === otherId);
          if (assister && assister.team === attacker.team) {
            assister.assists += 1;
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

      if (this.blueScore >= this.config.scoreLimit || this.redScore >= this.config.scoreLimit) {
        this.endMatch();
      }
      return true;
    }

    return false;
  }

  private endMatch() {
    if (this.phase === 'ended') return;
    this.phase = 'ended';
    this.mouseDownLeft = false;
    this.mouseDownRight = false;
    this.isAds = false;
    if (document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock();
    }

    if (this.blueScore > this.redScore) this.winner = 'blue';
    else if (this.redScore > this.blueScore) this.winner = 'red';
    else this.winner = 'draw';

    soundEngine.playMatchEnd(this.winner === 'blue');
    this.emitHud();
  }

  private respawnActor(actor: CombatantActor) {
    const spawns = actor.team === 'blue' ? this.arena.blueSpawns : this.arena.redSpawns;
    let bestSpawn = spawns[0];
    let bestMinEnemyDist = -1;

    for (const sp of spawns) {
      let minDist = 9999;
      for (const other of this.actors) {
        if (other.team !== actor.team && other.alive) {
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
    actor.yaw = actor.team === 'blue' ? 0 : Math.PI;
    actor.pitch = 0;

    if (actor.isPlayer) {
      this.weaponStates = this.createFreshWeaponStates();
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

  private spawnTracer(start: THREE.Vector3, end: THREE.Vector3, colorHex: number) {
    const dist = start.distanceTo(end);
    if (dist < 0.4) return;
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(this.tracerGeo, mat);
    mesh.position.copy(start).lerp(end, 0.5);
    mesh.lookAt(end);
    mesh.scale.set(1, 1, dist);
    this.scene.add(mesh);
    this.tracers.push({ mesh, life: 0.085, maxLife: 0.085 });
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

  private updatePlayer(dt: number) {
    const p = this.player;
    if (p.spawnShieldTimer > 0) p.spawnShieldTimer = Math.max(0, p.spawnShieldTimer - dt);

    if (!p.alive) {
      p.respawnTimer -= dt;
      if (p.respawnTimer <= 0) {
        this.respawnActor(p);
      }
      this.camera.position.set(p.position.x, p.position.y + 1.9, p.position.z);
      this.camera.rotation.set(-0.35, p.yaw, 0, 'YXZ');
      this.weaponPivot.visible = false;
      return;
    }

    this.weaponPivot.visible = true;

    const wantAds = (this.mouseDownRight || this.adsToggle) && !this.isReloading;
    this.isAds = wantAds;

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

    if (this.fireCooldown > 0) this.fireCooldown -= dt;
    if (this.mouseDownLeft) {
      this.tryPlayerFire();
    }

    const fwd =
      (this.keys['KeyW'] || this.keys['ArrowUp'] ? 1 : 0) -
      (this.keys['KeyS'] || this.keys['ArrowDown'] ? 1 : 0);
    const strafe =
      (this.keys['KeyD'] || this.keys['ArrowRight'] ? 1 : 0) -
      (this.keys['KeyA'] || this.keys['ArrowLeft'] ? 1 : 0);

    const wantsSprint =
      (this.keys['ShiftLeft'] || this.keys['ShiftRight']) &&
      fwd > 0 &&
      !this.isAds &&
      !this.mouseDownLeft &&
      this.stamina > 5;

    if (wantsSprint) {
      this.stamina = Math.max(0, this.stamina - 26 * dt);
    } else {
      this.stamina = Math.min(100, this.stamina + 18 * dt);
    }

    const spec = WEAPONS[this.activeWeapon];
    const baseSpeed = wantsSprint ? 10.4 : this.isAds ? 5.2 : 7.3;
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

    if (this.keys['Space'] && this.grounded) {
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

    const bobY =
      this.grounded && horizSpeed > 0.8
        ? Math.sin(this.walkBobPhase) * 0.04 * (this.isAds ? 0.3 : 1)
        : 0;
    const bobX =
      this.grounded && horizSpeed > 0.8
        ? Math.cos(this.walkBobPhase * 0.5) * 0.022 * (this.isAds ? 0.25 : 1)
        : 0;

    this.camera.position.set(p.position.x, p.position.y + 1.66 + bobY, p.position.z);
    this.camera.rotation.set(
      THREE.MathUtils.clamp(p.pitch + this.recoilOffsetPitch, -1.48, 1.48),
      p.yaw + this.recoilOffsetYaw,
      0,
      'YXZ'
    );

    let adsTargetFov = spec.adsFov;
    if (this.activeWeapon === 'm24') {
      adsTargetFov = this.scopeZoomLevel === 2 ? 14 : 26;
    } else if (this.activeWeapon === 'mk14') {
      adsTargetFov = this.scopeZoomLevel === 2 ? 28 : 42;
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
    const vmTargetY = this.isAds ? -0.088 : -0.18 - Math.abs(bobY) * 0.45;
    const vmTargetZ = (this.isAds ? -0.28 : -0.39) + this.weaponKickZ;

    this.viewmodels.m24.root.visible =
      this.activeWeapon === 'm24' && !(this.isAds && this.camera.fov < 38);
    this.viewmodels.mk14.root.visible =
      this.activeWeapon === 'mk14' && !(this.isAds && this.camera.fov < 48);

    const activeVm = this.viewmodels[this.activeWeapon];
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

    const shotgunVm = this.viewmodels.m870;
    if (this.pumpAnimTimer > 0 && shotgunVm.pumpSlide) {
      this.pumpAnimTimer = Math.max(0, this.pumpAnimTimer - dt);
      const t = Math.sin((this.pumpAnimTimer / 0.55) * Math.PI);
      shotgunVm.pumpSlide.position.z = -0.34 + t * 0.095;
    } else if (shotgunVm.pumpSlide) {
      shotgunVm.pumpSlide.position.z = -0.34;
    }

    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= dt;
      if (this.muzzleFlashTimer <= 0) {
        this.viewmodels[this.activeWeapon].muzzleFlash.visible = false;
        this.muzzleLight.intensity = 0;
      }
    }
  }

  private getDifficultyParams(diff: Difficulty) {
    if (diff === 'recruit') {
      return { reaction: 0.45, spreadMult: 2.1, speed: 5.2, fireRateMult: 0.65 };
    }
    if (diff === 'veteran') {
      return { reaction: 0.14, spreadMult: 0.95, speed: 6.8, fireRateMult: 1.0 };
    }
    return { reaction: 0.25, spreadMult: 1.45, speed: 6.0, fireRateMult: 0.82 };
  }

  private updateBots(dt: number) {
    const diffParams = this.getDifficultyParams(this.config.difficulty);

    for (const bot of this.actors) {
      if (bot.isPlayer || !bot.rig) continue;

      if (bot.spawnShieldTimer > 0) bot.spawnShieldTimer = Math.max(0, bot.spawnShieldTimer - dt);

      if (!bot.alive) {
        bot.respawnTimer -= dt;
        bot.deathAnimTimer = Math.min(1, bot.deathAnimTimer + dt * 4.5);
        bot.rig.bodyPivot.rotation.x = bot.deathAnimTimer * (Math.PI / 2);
        bot.rig.bodyPivot.position.y = -bot.deathAnimTimer * 0.35;
        if (bot.deathAnimTimer >= 1 && bot.respawnTimer < 2.2) {
          bot.rig.root.visible = false;
        }
        if (bot.respawnTimer <= 0) {
          this.respawnActor(bot);
        }
        continue;
      }

      if (bot.fireCooldown > 0) bot.fireCooldown -= dt;

      const eyePos = _vecA.set(bot.position.x, bot.position.y + 1.55, bot.position.z);
      let visibleEnemy: CombatantActor | null = null;
      let nearestEnemyDist = 65;

      for (const other of this.actors) {
        if (other.team === bot.team || !other.alive) continue;
        const d = bot.position.distanceTo(other.position);
        if (d < nearestEnemyDist) {
          const targetEye = _vecB.set(other.position.x, other.position.y + 1.38, other.position.z);
          if (this.hasLineOfSight(eyePos, targetEye)) {
            nearestEnemyDist = d;
            visibleEnemy = other;
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
          bot.weaponId === 'm870'
            ? 8
            : bot.weaponId === 'mp5'
            ? 13
            : bot.weaponId === 'm24'
            ? 29
            : bot.weaponId === 'mk14'
            ? 24
            : 19;

        const normDist = Math.max(0.01, Math.hypot(dx, dz));
        const fwdX = dx / normDist;
        const fwdZ = dz / normDist;
        const rightX = -fwdZ;
        const rightZ = fwdX;

        const approach = normDist > preferredDist + 3 ? 0.75 : normDist < preferredDist - 3 ? -0.55 : 0;
        moveDirX = fwdX * approach + rightX * bot.strafeDir * 0.85;
        moveDirZ = fwdZ * approach + rightZ * bot.strafeDir * 0.85;
        moveSpeed *= 0.82;

        if (bot.reactionTimer <= 0 && bot.fireCooldown <= 0 && nearestEnemyDist <= spec.range * 0.9) {
          this.fireBotWeapon(bot, visibleEnemy, diffParams.spreadMult, diffParams.fireRateMult);
        }
      } else {
        bot.targetEnemyId = null;

        let navTarget: THREE.Vector3 | null = null;
        if (bot.health < 50) {
          let bestMedDist = 28;
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
          if (bot.position.distanceTo(wp) < 2.4) {
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
        if (other.id === bot.id || !other.alive) continue;
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

      bot.rig.root.position.copy(bot.position);
      bot.rig.root.rotation.y = bot.yaw;

      const actualSpeed = movedDist / Math.max(0.001, dt);
      if (actualSpeed > 0.5) {
        bot.walkCycle += dt * actualSpeed * 1.5;
        const swing = Math.sin(bot.walkCycle) * 0.55;
        bot.rig.leftLeg.rotation.x = swing;
        bot.rig.rightLeg.rotation.x = -swing;
      } else {
        bot.rig.leftLeg.rotation.x = THREE.MathUtils.damp(bot.rig.leftLeg.rotation.x, 0, 10, dt);
        bot.rig.rightLeg.rotation.x = THREE.MathUtils.damp(bot.rig.rightLeg.rotation.x, 0, 10, dt);
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
    bot.fireCooldown = (60 / spec.rpm) / fireRateMult * (1.05 + Math.random() * 0.35);

    const muzzlePos = _vecA;
    if (bot.rig) {
      bot.rig.muzzleWorldAnchor.getWorldPosition(muzzlePos);
    } else {
      muzzlePos.set(bot.position.x, bot.position.y + 1.35, bot.position.z);
    }

    const distToPlayer = bot.position.distanceTo(this.player.position);
    const vol = THREE.MathUtils.clamp(1 - distToPlayer / 65, 0.05, 0.55);
    soundEngine.playGunshot(bot.weaponId, vol);

    const targetCenter = _vecB.set(target.position.x, target.position.y + 1.25, target.position.z);
    const baseDir = targetCenter.clone().sub(muzzlePos).normalize();
    const spread = Math.max(0.025, spec.baseSpread * 2.2 * spreadMult);

    for (let p = 0; p < spec.pellets; p++) {
      _dir
        .copy(baseDir)
        .add(
          _vecC.set(
            (Math.random() - 0.5) * 2 * spread,
            (Math.random() - 0.5) * 2 * spread,
            (Math.random() - 0.5) * 2 * spread
          )
        )
        .normalize();

      this.raycaster.set(muzzlePos, _dir);
      this.raycaster.far = spec.range;
      const worldHits = this.raycaster.intersectObjects(this.arena.staticRayMeshes, false);
      const worldDist = worldHits.length > 0 ? worldHits[0].distance : spec.range;

      let hitTarget = false;
      let hitPoint =
        worldHits.length > 0
          ? worldHits[0].point
          : muzzlePos.clone().addScaledVector(_dir, spec.range);

      if (target.isPlayer) {
        const playerCenter = _vecC.set(target.position.x, target.position.y + 1.15, target.position.z);
        const distToRay = this.raycaster.ray.distanceSqToPoint(playerCenter);
        const distToPlayerOrigin = muzzlePos.distanceTo(playerCenter);
        if (distToRay < 0.34 && distToPlayerOrigin < worldDist) {
          hitTarget = true;
          hitPoint = muzzlePos.clone().addScaledVector(_dir, distToPlayerOrigin);
          const isHead = Math.random() < 0.14;
          const dmg = Math.round(spec.damage * (isHead ? 1.35 : 0.85));
          this.applyDamage(target, bot, dmg, isHead, spec.shortName);
        }
      } else if (target.rig) {
        const enemyHits = this.raycaster.intersectObjects(target.rig.hitMeshes, false);
        if (enemyHits.length > 0 && enemyHits[0].distance < worldDist) {
          hitTarget = true;
          hitPoint = enemyHits[0].point;
          const isHead = enemyHits[0].object.userData.hitbox === 'head';
          const dmg = Math.round(spec.damage * (isHead ? spec.headshotMult : 1));
          this.applyDamage(target, bot, dmg, isHead, spec.shortName);
          this.spawnSparks(hitPoint, 0xef4444, 3);
        }
      }

      if (!hitTarget && worldHits.length > 0) {
        this.spawnSparks(worldHits[0].point, 0xfbbf24, 2);
      }
      this.spawnTracer(muzzlePos, hitPoint, spec.tracerColor);
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
            for (const wid of WEAPON_ORDER) {
              const st = this.weaponStates[wid];
              const maxRes = WEAPONS[wid].reserveMax;
              if (st.reserve < maxRes) {
                st.reserve = Math.min(maxRes, st.reserve + Math.ceil(maxRes * 0.5));
                refilled = true;
              }
            }
            if (refilled) {
              pk.active = false;
              pk.respawnTimer = 16;
              pk.meshGroup.visible = false;
              soundEngine.playPickup();
              this.pickupNotice = 'Ammo Reserves Resupplied';
              this.pickupNoticeTimer = 2.0;
              break;
            }
          }
        }
      }
    }
  }

  private updateEffects(dt: number) {
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const tr = this.tracers[i];
      tr.life -= dt;
      if (tr.life <= 0) {
        this.scene.remove(tr.mesh);
        (tr.mesh.material as THREE.Material).dispose();
        this.tracers.splice(i, 1);
      } else {
        (tr.mesh.material as THREE.MeshBasicMaterial).opacity = (tr.life / tr.maxLife) * 0.85;
      }
    }

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
  }

  private tick = () => {
    if (this.disposed) return;

    const now = performance.now();
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    if (this.phase === 'lobby' || this.phase === 'ended') {
      this.lobbyOrbitAngle += dt * 0.14;
      const radius = 34;
      this.camera.position.set(
        Math.cos(this.lobbyOrbitAngle) * radius,
        15,
        Math.sin(this.lobbyOrbitAngle) * radius
      );
      this.camera.lookAt(0, 1.5, 0);
      if (this.camera.fov !== 62) {
        this.camera.fov = 62;
        this.camera.updateProjectionMatrix();
      }
      this.updatePickups(dt);
      this.updateEffects(dt);
    } else if (this.phase === 'playing') {
      this.timeRemaining = Math.max(0, this.timeRemaining - dt);
      if (this.timeRemaining <= 0) {
        this.endMatch();
      } else {
        this.updatePlayer(dt);
        this.updateBots(dt);
        this.updatePickups(dt);
        this.updateEffects(dt);
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
    for (const actor of this.actors) {
      if (actor.isPlayer || !actor.alive) continue;
      radarBlips.push({
        x: actor.position.x,
        z: actor.position.z,
        team: actor.team,
        alive: actor.alive,
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

    const scoreboard: ScoreboardEntry[] = this.actors
      .map((a) => ({
        id: a.id,
        name: a.name,
        team: a.team,
        isPlayer: a.isPlayer,
        weaponId: a.weaponId,
        kills: a.kills,
        deaths: a.deaths,
        assists: a.assists,
        alive: a.alive,
      }))
      .sort((a, b) => b.kills - a.kills || a.deaths - b.deaths);

    this.onHudUpdate({
      phase: this.phase,
      blueScore: this.blueScore,
      redScore: this.redScore,
      scoreLimit: this.config.scoreLimit,
      timeRemaining: this.timeRemaining,
      health: this.player?.health ?? 100,
      maxHealth: this.player?.maxHealth ?? 100,
      stamina: this.stamina,
      isAlive: this.player?.alive ?? true,
      respawnTimer: Math.max(0, this.player?.respawnTimer ?? 0),
      activeWeapon: this.activeWeapon,
      weapons: {
        m4a1: { ...this.weaponStates.m4a1 },
        ak74: { ...this.weaponStates.ak74 },
        mp5: { ...this.weaponStates.mp5 },
        m870: { ...this.weaponStates.m870 },
        mk14: { ...this.weaponStates.mk14 },
        m24: { ...this.weaponStates.m24 },
      },
      isReloading: this.isReloading,
      reloadProgress: this.isReloading
        ? 1 - this.reloadTimer / WEAPONS[this.activeWeapon].reloadTime
        : 0,
      isAds: this.isAds,
      scopeZoom:
        this.activeWeapon === 'm24'
          ? this.scopeZoomLevel === 2
            ? 8
            : 4
          : this.activeWeapon === 'mk14'
          ? this.scopeZoomLevel === 2
            ? 3.5
            : 2
          : 1.4,
      crosshairSpread: Math.round(THREE.MathUtils.clamp(spreadRad * 780, 4, 58)),
      hitmarkerType: this.hitmarkerType,
      hitmarkerTime: this.hitmarkerTime,
      lastEliminatedName: this.lastEliminatedName,
      lastEliminatedHeadshot: this.lastEliminatedHeadshot,
      playerPos: {
        x: this.player?.position.x ?? 0,
        z: this.player?.position.z ?? 0,
        yaw: this.player?.yaw ?? 0,
      },
      radarBlips,
      killFeed: [...this.killFeed],
      scoreboard,
      damageIndicators: [...this.damageIndicators],
      winner: this.winner,
      pointerLocked: this.pointerLocked,
      pickupNotice: this.pickupNotice,
      arenaHalfSize: this.arena.halfSize,
    });
  }

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('resize', this.handleResize);
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

    for (const g of this.arena.disposables.geometries) g.dispose();
    for (const m of this.arena.disposables.materials) m.dispose();
    for (const t of this.arena.disposables.textures) t.dispose();
    this.sparkGeo.dispose();
    this.tracerGeo.dispose();
    this.shellGeo.dispose();
    this.brassMat.dispose();

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
