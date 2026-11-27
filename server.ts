import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const HOST = '0.0.0.0';
const DATA_DIR = path.resolve(process.cwd(), '.data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');

interface StoredAccount {
  id: string;
  email: string;
  username: string;
  kills: number;
  deaths: number;
  matches: number;
  createdAt: number;
}

type MatchMode = 'tdm' | 'ffa' | 'gun_game' | 'zombies';

interface RoomPlayer {
  id: string;
  ws: WebSocket;
  username: string;
  team: 'blue' | 'red';
  weaponId: string;
  gunGameTier: number;
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

interface RoomVehicleState {
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

interface MultiplayerRoom {
  roomId: string;
  mapId: string;
  matchMode: MatchMode;
  teamSize: number;
  scoreLimit: number;
  botFill: boolean;
  blueScore: number;
  redScore: number;
  winnerName: string | null;
  zombieWave: number;
  timeRemaining: number;
  players: Map<string, RoomPlayer>;
  vehicles: Map<string, RoomVehicleState>;
  createdAt: number;
}

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
    // Ignore filesystem errors in read-only sandboxes
  }
}

function loadAccounts(): StoredAccount[] {
  ensureDataDir();
  try {
    if (!fs.existsSync(ACCOUNTS_FILE)) return [];
    const raw = fs.readFileSync(ACCOUNTS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts: StoredAccount[]) {
  ensureDataDir();
  try {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf-8');
  } catch {
    // Ignore write failure
  }
}

function sanitizeUsername(raw: unknown): string {
  const s = String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_\-. ]/g, '')
    .slice(0, 18);
  return s.length >= 2 ? s : `Operator-${Math.floor(100 + Math.random() * 899)}`;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  let accounts = loadAccounts();
  const rooms = new Map<string, MultiplayerRoom>();

  // API: Health Check
  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      rooms: rooms.size,
      accounts: accounts.length,
    });
  });

  // API: Optional Email + Username Account Creation / Sign-In
  app.post('/api/auth/account', (req, res) => {
    const emailRaw = String(req.body?.email || '').trim().toLowerCase();
    const username = sanitizeUsername(req.body?.username);

    if (!emailRaw) {
      return res.json({
        account: {
          id: `guest-${Date.now().toString(36)}`,
          username,
          isGuest: true,
          kills: 0,
          deaths: 0,
          matches: 0,
        },
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
      return res.status(400).json({ error: 'Please enter a valid email address or leave email blank for Guest.' });
    }

    let existing = accounts.find((a) => a.email === emailRaw);
    if (existing) {
      if (req.body?.username && String(req.body.username).trim().length >= 2) {
        existing.username = username;
        saveAccounts(accounts);
      }
      return res.json({
        account: {
          id: existing.id,
          username: existing.username,
          email: existing.email,
          isGuest: false,
          kills: existing.kills,
          deaths: existing.deaths,
          matches: existing.matches,
        },
      });
    }

    const created: StoredAccount = {
      id: `acc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      email: emailRaw,
      username,
      kills: 0,
      deaths: 0,
      matches: 0,
      createdAt: Date.now(),
    };
    accounts.push(created);
    saveAccounts(accounts);

    return res.json({
      account: {
        id: created.id,
        username: created.username,
        email: created.email,
        isGuest: false,
        kills: created.kills,
        deaths: created.deaths,
        matches: created.matches,
      },
    });
  });

  // API: Update Career Stats
  app.post('/api/auth/stats', (req, res) => {
    const { email, killsDelta, deathsDelta, kills, deaths } = req.body || {};
    if (!email) return res.json({ ok: true });
    const acc = accounts.find((a) => a.email === String(email).trim().toLowerCase());
    if (!acc) return res.json({ ok: false });
    const kAdd = killsDelta !== undefined ? Number(killsDelta) : Number(kills);
    const dAdd = deathsDelta !== undefined ? Number(deathsDelta) : Number(deaths);
    acc.kills += Math.max(0, Number.isFinite(kAdd) ? kAdd : 0);
    acc.deaths += Math.max(0, Number.isFinite(dAdd) ? dAdd : 0);
    acc.matches += 1;
    saveAccounts(accounts);
    return res.json({
      ok: true,
      account: {
        id: acc.id,
        username: acc.username,
        email: acc.email,
        isGuest: false,
        kills: acc.kills,
        deaths: acc.deaths,
        matches: acc.matches,
      },
    });
  });

  // API: Active Multiplayer Rooms
  app.get('/api/rooms', (_req, res) => {
    const list = Array.from(rooms.values()).map((r) => ({
      roomId: r.roomId,
      mapId: r.mapId,
      matchMode: r.matchMode,
      teamSize: r.teamSize,
      scoreLimit: r.scoreLimit,
      botFill: r.botFill,
      humanCount: r.players.size,
      maxHumans: 20,
      blueScore: r.blueScore,
      redScore: r.redScore,
      zombieWave: r.zombieWave,
    }));
    res.json({ rooms: list });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  const broadcastRoom = (room: MultiplayerRoom, payload: unknown, excludeId?: string) => {
    const raw = JSON.stringify(payload);
    for (const [pid, pl] of room.players) {
      if (excludeId && pid === excludeId) continue;
      if (pl.ws.readyState === WebSocket.OPEN) {
        pl.ws.send(raw);
      }
    }
  };

  const removePlayerFromVehicleSeats = (room: MultiplayerRoom, playerId: string) => {
    for (const veh of room.vehicles.values()) {
      for (const [seatKey, occupant] of Object.entries(veh.seats)) {
        if (occupant === playerId) {
          delete veh.seats[Number(seatKey)];
        }
      }
    }
  };

  const broadcastSnapshot = (room: MultiplayerRoom) => {
    const players = Array.from(room.players.values()).map((p) => ({
      id: p.id,
      username: p.username,
      team: p.team,
      weaponId: p.weaponId,
      gunGameTier: p.gunGameTier,
      x: p.x,
      y: p.y,
      z: p.z,
      yaw: p.yaw,
      pitch: p.pitch,
      vx: p.vx,
      vz: p.vz,
      health: p.health,
      alive: p.alive,
      kills: p.kills,
      deaths: p.deaths,
      vehicleId: p.vehicleId,
      vehicleSeat: p.vehicleSeat,
      turretId: p.turretId,
    }));
    const vehicles = Array.from(room.vehicles.values());
    broadcastRoom(room, {
      type: 'room_snapshot',
      roomId: room.roomId,
      mapId: room.mapId,
      matchMode: room.matchMode,
      teamSize: room.teamSize,
      scoreLimit: room.scoreLimit,
      botFill: room.botFill,
      blueScore: room.blueScore,
      redScore: room.redScore,
      winnerName: room.winnerName,
      zombieWave: room.zombieWave,
      timeRemaining: room.timeRemaining,
      players,
      vehicles,
    });
  };

  // Periodic room timer & state sync (20 Hz)
  setInterval(() => {
    for (const [roomId, room] of rooms) {
      if (room.players.size === 0) {
        rooms.delete(roomId);
        continue;
      }
      room.timeRemaining = Math.max(0, room.timeRemaining - 0.05);
      broadcastSnapshot(room);
    }
  }, 50);

  wss.on('connection', (ws) => {
    const clientId = `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    let currentRoom: MultiplayerRoom | null = null;

    ws.send(JSON.stringify({ type: 'welcome', playerId: clientId }));

    ws.on('message', (data) => {
      let msg: Record<string, any>;
      try {
        msg = JSON.parse(data.toString());
      } catch {
        return;
      }

      if (msg.type === 'join') {
        if (currentRoom) {
          removePlayerFromVehicleSeats(currentRoom, clientId);
          currentRoom.players.delete(clientId);
          broadcastSnapshot(currentRoom);
        }
        const roomId = String(msg.roomId || 'ALPHA-1')
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9\-_]/g, '')
          .slice(0, 16) || 'ALPHA-1';

        let room = rooms.get(roomId);
        if (!room) {
          const rawMode = String(msg.matchMode || 'tdm');
          const matchMode: MatchMode =
            rawMode === 'ffa' || rawMode === 'gun_game' || rawMode === 'zombies' ? rawMode : 'tdm';
          const rawTeamSize = Number(msg.teamSize);
          const teamSize =
            rawTeamSize === 4 || rawTeamSize === 5 || rawTeamSize === 6 || rawTeamSize === 10
              ? rawTeamSize
              : 5;
          const rawLimit = Number(msg.scoreLimit);
          const scoreLimit = rawLimit === 25 || rawLimit === 50 || rawLimit === 75 ? rawLimit : 50;

          room = {
            roomId,
            mapId: String(msg.mapId || 'yard'),
            matchMode,
            teamSize,
            scoreLimit,
            botFill: msg.botFill !== false,
            blueScore: 0,
            redScore: 0,
            winnerName: null,
            zombieWave: 1,
            timeRemaining: 360,
            players: new Map(),
            vehicles: new Map(),
            createdAt: Date.now(),
          };
          rooms.set(roomId, room);
        }

        const team: 'blue' | 'red' =
          room.matchMode === 'zombies' ? 'blue' : msg.team === 'red' ? 'red' : 'blue';
        const isSmallInfantryMap =
          room.mapId === 'killhouse' || room.mapId === 'metro' || room.mapId === 'rooftop';
        const spawnZ =
          room.mapId === 'island' ? 420 : isSmallInfantryMap ? 48 : 140;
        const player: RoomPlayer = {
          id: clientId,
          ws,
          username: sanitizeUsername(msg.username),
          team,
          weaponId: String(msg.weaponId || 'm4a1'),
          gunGameTier: 0,
          x: 0,
          y: 0,
          z: team === 'blue' ? spawnZ : -spawnZ,
          yaw: team === 'blue' ? 0 : Math.PI,
          pitch: 0,
          vx: 0,
          vz: 0,
          health: 100,
          alive: true,
          kills: 0,
          deaths: 0,
          vehicleId: null,
          vehicleSeat: null,
          turretId: null,
        };

        room.players.set(clientId, player);
        currentRoom = room;

        ws.send(
          JSON.stringify({
            type: 'joined',
            playerId: clientId,
            roomId: room.roomId,
            mapId: room.mapId,
            matchMode: room.matchMode,
            teamSize: room.teamSize,
            scoreLimit: room.scoreLimit,
            botFill: room.botFill,
          })
        );
        broadcastSnapshot(room);
        return;
      }

      if (!currentRoom) return;
      const self = currentRoom.players.get(clientId);
      if (!self) return;

      if (msg.type === 'state') {
        self.x = Number(msg.x) || 0;
        self.y = Number(msg.y) || 0;
        self.z = Number(msg.z) || 0;
        self.yaw = Number(msg.yaw) || 0;
        self.pitch = Number(msg.pitch) || 0;
        self.vx = Number(msg.vx) || 0;
        self.vz = Number(msg.vz) || 0;
        self.weaponId = String(msg.weaponId || self.weaponId);
        if (msg.gunGameTier !== undefined) {
          self.gunGameTier = Math.max(0, Number(msg.gunGameTier) || 0);
        }
        if (currentRoom.matchMode === 'zombies' && msg.zombieWave !== undefined) {
          currentRoom.zombieWave = Math.max(currentRoom.zombieWave, Number(msg.zombieWave) || 1);
        }
        self.health = Number(msg.health ?? self.health);
        self.alive = msg.alive !== false;
        const nextVehId = msg.vehicleId && self.alive ? String(msg.vehicleId) : null;
        const nextSeat =
          nextVehId && msg.vehicleSeat !== null && msg.vehicleSeat !== undefined
            ? Math.max(0, Math.min(3, Number(msg.vehicleSeat) || 0))
            : null;

        if (nextVehId !== self.vehicleId || nextSeat !== self.vehicleSeat) {
          removePlayerFromVehicleSeats(currentRoom, clientId);
        }

        if (nextVehId && nextSeat !== null) {
          let veh = currentRoom.vehicles.get(nextVehId);
          if (!veh) {
            veh = {
              id: nextVehId,
              x: self.x,
              y: self.y,
              z: self.z,
              yaw: self.yaw,
              speed: 0,
              turretYaw: 0,
              turretPitch: 0,
              health: 400,
              destroyed: false,
              seats: {},
            };
            currentRoom.vehicles.set(nextVehId, veh);
          }
          const holder = veh.seats[nextSeat];
          if (!holder || holder === clientId || !currentRoom.players.has(holder)) {
            veh.seats[nextSeat] = clientId;
            self.vehicleId = nextVehId;
            self.vehicleSeat = nextSeat;
          } else {
            // Seat already taken by another player; keep player in next open seat or clear
            self.vehicleId = nextVehId;
            let assigned: number | null = null;
            for (let s = 0; s < 4; s++) {
              const h = veh.seats[s];
              if (!h || !currentRoom.players.has(h)) {
                veh.seats[s] = clientId;
                assigned = s;
                break;
              }
            }
            if (assigned === null) {
              self.vehicleId = null;
              self.vehicleSeat = null;
            } else {
              self.vehicleSeat = assigned;
            }
          }
        } else {
          self.vehicleId = null;
          self.vehicleSeat = null;
        }

        if (self.vehicleId && msg.vehicleTransform && typeof msg.vehicleTransform === 'object') {
          const veh = currentRoom.vehicles.get(self.vehicleId);
          const vt = msg.vehicleTransform as Record<string, unknown>;
          if (veh) {
            if (self.vehicleSeat === 0) {
              veh.x = Number(vt.x) || 0;
              veh.y = Number(vt.y) || 0;
              veh.z = Number(vt.z) || 0;
              veh.yaw = Number(vt.yaw) || 0;
              veh.speed = Number(vt.speed) || 0;
              veh.health = Number(vt.health ?? veh.health);
              veh.destroyed = Boolean(vt.destroyed);
            }
            if (self.vehicleSeat === 1 || (self.vehicleSeat === 0 && Number(vt.turretYaw) !== undefined)) {
              veh.turretYaw = Number(vt.turretYaw) || 0;
              veh.turretPitch = Number(vt.turretPitch) || 0;
            }
          }
        }

        self.turretId = msg.turretId ? String(msg.turretId) : null;
        return;
      }

      if (msg.type === 'fire') {
        broadcastRoom(
          currentRoom,
          {
            type: 'remote_fire',
            playerId: clientId,
            weaponId: String(msg.weaponId || self.weaponId),
            ox: Number(msg.ox) || 0,
            oy: Number(msg.oy) || 0,
            oz: Number(msg.oz) || 0,
            dx: Number(msg.dx) || 0,
            dy: Number(msg.dy) || 0,
            dz: Number(msg.dz) || -1,
            kind: String(msg.kind || 'bullet'),
          },
          clientId
        );
        return;
      }

      if (msg.type === 'hit') {
        if (currentRoom.matchMode === 'zombies') return;
        const targetId = String(msg.targetId || '');
        const dmg = Math.max(1, Math.min(300, Number(msg.damage) || 20));
        const target = currentRoom.players.get(targetId);
        if (target && target.alive) {
          target.health = Math.max(0, target.health - dmg);
          const killed = target.health <= 0;
          if (killed) {
            target.alive = false;
            target.deaths += 1;
            self.kills += 1;
            if (currentRoom.matchMode === 'tdm') {
              if (self.team === 'blue') currentRoom.blueScore += 1;
              else currentRoom.redScore += 1;
            } else if (currentRoom.matchMode === 'ffa') {
              if (self.kills >= currentRoom.scoreLimit && !currentRoom.winnerName) {
                currentRoom.winnerName = self.username;
              }
            } else if (currentRoom.matchMode === 'gun_game') {
              self.gunGameTier += 1;
            }
          }
          broadcastRoom(currentRoom, {
            type: 'remote_damage',
            attackerId: clientId,
            attackerName: self.username,
            attackerTeam: self.team,
            targetId,
            damage: dmg,
            killed,
            isHeadshot: Boolean(msg.isHeadshot),
            weaponShort: String(msg.weaponShort || 'Rifle'),
          });
        }
        return;
      }

      if (msg.type === 'bot_kill') {
        if (currentRoom.matchMode === 'tdm') {
          if (msg.team === 'blue') currentRoom.blueScore += 1;
          else if (msg.team === 'red') currentRoom.redScore += 1;
        } else if (currentRoom.matchMode === 'zombies') {
          self.kills += 1;
          currentRoom.blueScore += 1;
          if (msg.zombieWave !== undefined) {
            currentRoom.zombieWave = Math.max(currentRoom.zombieWave, Number(msg.zombieWave) || 1);
          }
        } else {
          self.kills += 1;
          if (msg.gunGameTier !== undefined) {
            self.gunGameTier = Math.max(self.gunGameTier, Number(msg.gunGameTier) || 0);
          }
          if (currentRoom.matchMode === 'ffa' && self.kills >= currentRoom.scoreLimit && !currentRoom.winnerName) {
            currentRoom.winnerName = self.username;
          }
        }
        return;
      }

      if (msg.type === 'airstrike') {
        broadcastRoom(
          currentRoom,
          {
            type: 'remote_airstrike',
            playerId: clientId,
            team: self.team,
            tx: Number(msg.tx) || 0,
            ty: Number(msg.ty) || 0,
            tz: Number(msg.tz) || 0,
            yaw: Number(msg.yaw) || 0,
          },
          clientId
        );
        return;
      }

      if (msg.type === 'grenade') {
        broadcastRoom(
          currentRoom,
          {
            type: 'remote_grenade',
            playerId: clientId,
            team: self.team,
            x: Number(msg.x) || 0,
            y: Number(msg.y) || 0,
            z: Number(msg.z) || 0,
            vx: Number(msg.vx) || 0,
            vy: Number(msg.vy) || 0,
            vz: Number(msg.vz) || 0,
            fuse: Number(msg.fuse) || 2.0,
          },
          clientId
        );
        return;
      }

      if (msg.type === 'wall_hit') {
        broadcastRoom(
          currentRoom,
          {
            type: 'remote_wall_damage',
            playerId: clientId,
            wallId: String(msg.wallId || ''),
            damage: Math.max(0, Math.min(800, Number(msg.damage) || 0)),
          },
          clientId
        );
        return;
      }

      if (msg.type === 'barrel_hit') {
        broadcastRoom(
          currentRoom,
          {
            type: 'remote_barrel_damage',
            playerId: clientId,
            barrelId: String(msg.barrelId || ''),
            damage: Math.max(0, Math.min(500, Number(msg.damage) || 0)),
          },
          clientId
        );
        return;
      }

      if (msg.type === 'mount_destroy') {
        broadcastRoom(
          currentRoom,
          {
            type: 'remote_mount_destroy',
            playerId: clientId,
            mountId: String(msg.mountId || ''),
          },
          clientId
        );
        return;
      }

      if (msg.type === 'mount_repair') {
        broadcastRoom(
          currentRoom,
          {
            type: 'remote_mount_repair',
            playerId: clientId,
            mountId: String(msg.mountId || ''),
          },
          clientId
        );
        return;
      }

      if (msg.type === 'belt_pickup') {
        broadcastRoom(
          currentRoom,
          {
            type: 'remote_belt_pickup',
            playerId: clientId,
            beltId: String(msg.beltId || ''),
          },
          clientId
        );
        return;
      }

      if (msg.type === 'trench_dig') {
        broadcastRoom(
          currentRoom,
          {
            type: 'remote_trench_dig',
            playerId: clientId,
            x: Number(msg.x) || 0,
            y: Number(msg.y) || 0,
            z: Number(msg.z) || 0,
            yaw: Number(msg.yaw) || 0,
          },
          clientId
        );
        return;
      }
    });

    ws.on('close', () => {
      if (currentRoom) {
        removePlayerFromVehicleSeats(currentRoom, clientId);
        currentRoom.players.delete(clientId);
        broadcastSnapshot(currentRoom);
        if (currentRoom.players.size === 0) {
          rooms.delete(currentRoom.roomId);
        }
      }
    });
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, HOST, () => {
    console.log(`Vanguard Arena server running on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Vanguard Arena server:', err);
  process.exit(1);
});
