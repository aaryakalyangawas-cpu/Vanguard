import { MapId, MultiplayerRoomSummary, TeamId, WeaponId } from './types';

export interface RemoteHumanState {
  id: string;
  username: string;
  team: TeamId;
  weaponId: WeaponId;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  vx: number;
  vz: number;
  health: number;
  alive: boolean;
  kills: number;
  deaths: number;
  vehicleId: string | null;
  vehicleSeat: number | null;
  turretId: string | null;
}

export interface RemoteVehicleState {
  id: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  speed: number;
  turretYaw: number;
  turretPitch: number;
  health: number;
  destroyed: boolean;
  seats: Record<number, string>;
}

export interface RoomSnapshotMsg {
  type: 'room_snapshot';
  roomId: string;
  mapId: MapId;
  scoreLimit: number;
  botFill: boolean;
  blueScore: number;
  redScore: number;
  timeRemaining: number;
  players: RemoteHumanState[];
  vehicles?: RemoteVehicleState[];
}

export interface RemoteFireMsg {
  type: 'remote_fire';
  playerId: string;
  weaponId: WeaponId;
  ox: number;
  oy: number;
  oz: number;
  dx: number;
  dy: number;
  dz: number;
  kind: 'bullet' | 'rocket' | 'shell';
}

export interface RemoteDamageMsg {
  type: 'remote_damage';
  attackerId: string;
  attackerName: string;
  attackerTeam: TeamId;
  targetId: string;
  damage: number;
  killed: boolean;
  isHeadshot: boolean;
  weaponShort: string;
}

export interface RemoteAirstrikeMsg {
  type: 'remote_airstrike';
  playerId: string;
  team: TeamId;
  tx: number;
  ty: number;
  tz: number;
  yaw: number;
}

export interface RemoteGrenadeMsg {
  type: 'remote_grenade';
  playerId: string;
  team: TeamId;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  fuse: number;
}

export interface RemoteWallDamageMsg {
  type: 'remote_wall_damage';
  playerId: string;
  wallId: string;
  damage: number;
}

export interface RemoteBarrelDamageMsg {
  type: 'remote_barrel_damage';
  playerId: string;
  barrelId: string;
  damage: number;
}

export interface RemoteMountDestroyMsg {
  type: 'remote_mount_destroy';
  playerId: string;
  mountId: string;
}

export interface RemoteMountRepairMsg {
  type: 'remote_mount_repair';
  playerId: string;
  mountId: string;
}

export interface RemoteBeltPickupMsg {
  type: 'remote_belt_pickup';
  playerId: string;
  beltId: string;
}

export interface RemoteTrenchDigMsg {
  type: 'remote_trench_dig';
  playerId: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
}

export interface MultiplayerCallbacks {
  onJoined?: (playerId: string, roomId: string) => void;
  onSnapshot?: (snapshot: RoomSnapshotMsg) => void;
  onRemoteFire?: (msg: RemoteFireMsg) => void;
  onRemoteDamage?: (msg: RemoteDamageMsg) => void;
  onRemoteAirstrike?: (msg: RemoteAirstrikeMsg) => void;
  onRemoteGrenade?: (msg: RemoteGrenadeMsg) => void;
  onRemoteWallDamage?: (msg: RemoteWallDamageMsg) => void;
  onRemoteBarrelDamage?: (msg: RemoteBarrelDamageMsg) => void;
  onRemoteMountDestroy?: (msg: RemoteMountDestroyMsg) => void;
  onRemoteMountRepair?: (msg: RemoteMountRepairMsg) => void;
  onRemoteBeltPickup?: (msg: RemoteBeltPickupMsg) => void;
  onRemoteTrenchDig?: (msg: RemoteTrenchDigMsg) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  public playerId: string | null = null;
  public connected = false;
  private callbacks: MultiplayerCallbacks = {};
  private pendingJoin: Record<string, unknown> | null = null;

  public setCallbacks(cb: MultiplayerCallbacks) {
    this.callbacks = cb;
  }

  public connectAndJoin(params: {
    roomId: string;
    username: string;
    team: TeamId;
    mapId: MapId;
    scoreLimit: number;
    botFill: boolean;
    weaponId: WeaponId;
  }) {
    this.pendingJoin = { type: 'join', ...params };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(this.pendingJoin));
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      return;
    }

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    this.ws = ws;

    ws.onopen = () => {
      this.connected = true;
      this.callbacks.onConnectionChange?.(true);
      if (this.pendingJoin) {
        ws.send(JSON.stringify(this.pendingJoin));
      }
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'welcome') {
          this.playerId = msg.playerId;
        } else if (msg.type === 'joined') {
          this.playerId = msg.playerId;
          this.callbacks.onJoined?.(msg.playerId, msg.roomId);
        } else if (msg.type === 'room_snapshot') {
          this.callbacks.onSnapshot?.(msg as RoomSnapshotMsg);
        } else if (msg.type === 'remote_fire') {
          this.callbacks.onRemoteFire?.(msg as RemoteFireMsg);
        } else if (msg.type === 'remote_damage') {
          this.callbacks.onRemoteDamage?.(msg as RemoteDamageMsg);
        } else if (msg.type === 'remote_airstrike') {
          this.callbacks.onRemoteAirstrike?.(msg as RemoteAirstrikeMsg);
        } else if (msg.type === 'remote_grenade') {
          this.callbacks.onRemoteGrenade?.(msg as RemoteGrenadeMsg);
        } else if (msg.type === 'remote_wall_damage') {
          this.callbacks.onRemoteWallDamage?.(msg as RemoteWallDamageMsg);
        } else if (msg.type === 'remote_barrel_damage') {
          this.callbacks.onRemoteBarrelDamage?.(msg as RemoteBarrelDamageMsg);
        } else if (msg.type === 'remote_mount_destroy') {
          this.callbacks.onRemoteMountDestroy?.(msg as RemoteMountDestroyMsg);
        } else if (msg.type === 'remote_mount_repair') {
          this.callbacks.onRemoteMountRepair?.(msg as RemoteMountRepairMsg);
        } else if (msg.type === 'remote_belt_pickup') {
          this.callbacks.onRemoteBeltPickup?.(msg as RemoteBeltPickupMsg);
        } else if (msg.type === 'remote_trench_dig') {
          this.callbacks.onRemoteTrenchDig?.(msg as RemoteTrenchDigMsg);
        }
      } catch {
        // Ignore malformed packets
      }
    };

    ws.onclose = () => {
      this.connected = false;
      this.callbacks.onConnectionChange?.(false);
    };

    ws.onerror = () => {
      this.connected = false;
      this.callbacks.onConnectionChange?.(false);
    };
  }

  public sendState(payload: {
    x: number;
    y: number;
    z: number;
    yaw: number;
    pitch: number;
    vx: number;
    vz: number;
    weaponId: WeaponId;
    health: number;
    alive: boolean;
    vehicleId: string | null;
    vehicleSeat: number | null;
    turretId: string | null;
    vehicleTransform?: {
      x: number;
      y: number;
      z: number;
      yaw: number;
      speed: number;
      turretYaw: number;
      turretPitch: number;
      health: number;
      destroyed: boolean;
    };
  }) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'state', ...payload }));
    }
  }

  public sendFire(payload: Omit<RemoteFireMsg, 'type' | 'playerId'>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'fire', ...payload }));
    }
  }

  public sendHit(payload: {
    targetId: string;
    damage: number;
    isHeadshot: boolean;
    weaponShort: string;
  }) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'hit', ...payload }));
    }
  }

  public sendBotKill(team: TeamId) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'bot_kill', team }));
    }
  }

  public sendAirstrike(tx: number, ty: number, tz: number, yaw: number) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'airstrike', tx, ty, tz, yaw }));
    }
  }

  public sendGrenade(
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    fuse: number
  ) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'grenade', x, y, z, vx, vy, vz, fuse }));
    }
  }

  public sendWallDamage(wallId: string, damage: number) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'wall_hit', wallId, damage }));
    }
  }

  public sendBarrelDamage(barrelId: string, damage: number) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'barrel_hit', barrelId, damage }));
    }
  }

  public sendMountDestroy(mountId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'mount_destroy', mountId }));
    }
  }

  public sendMountRepair(mountId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'mount_repair', mountId }));
    }
  }

  public sendBeltPickup(beltId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'belt_pickup', beltId }));
    }
  }

  public sendTrenchDig(x: number, y: number, z: number, yaw: number) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'trench_dig', x, y, z, yaw }));
    }
  }

  public disconnect() {
    this.pendingJoin = null;
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // Ignore
      }
      this.ws = null;
    }
    this.connected = false;
    this.callbacks.onConnectionChange?.(false);
  }
}

export async function fetchActiveRooms(): Promise<MultiplayerRoomSummary[]> {
  try {
    const res = await fetch('/api/rooms');
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.rooms) ? data.rooms : [];
  } catch {
    return [];
  }
}
