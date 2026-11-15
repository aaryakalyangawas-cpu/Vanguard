import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { HudSnapshot } from '../game/types';
import { WEAPON_ORDER, WEAPONS } from '../game/weapons';
import { ScoreboardModal } from './ScoreboardModal';
import { TacticalRadar } from './TacticalRadar';

interface TacticalHudProps {
  hud: HudSnapshot;
  showScoreboard: boolean;
  muted: boolean;
  onRequestLock: () => void;
}

function formatClock(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return `${mins}:${rem.toString().padStart(2, '0')}`;
}

export const TacticalHud: React.FC<TacticalHudProps> = ({
  hud,
  showScoreboard,
  muted,
  onRequestLock,
}) => {
  const activeSpec = WEAPONS[hud.activeWeapon];
  const activeState = hud.weapons[hud.activeWeapon];
  const isMounted = hud.mountedMg.active;
  const isFullScope =
    !isMounted &&
    (hud.activeWeapon === 'm24' || hud.activeWeapon === 'mk14' || hud.activeWeapon === 'rpg7') &&
    hud.isAds;
  const isOpticSight =
    !isMounted &&
    hud.isAds &&
    (hud.activeWeapon === 'm4a1' ||
      hud.activeWeapon === 'ak74' ||
      hud.activeWeapon === 'mp5' ||
      hud.activeWeapon === 'm870');
  const lowAmmo = activeState.mag <= Math.ceil(activeSpec.magSize * 0.25);
  const lowHealth = hud.health <= 30;
  const showHitmarker = hud.hitmarkerType !== 'none' && performance.now() - hud.hitmarkerTime < 220;

  return (
    <div className="fixed inset-0 z-10 pointer-events-none select-none">
      {/* Low Health Vignette */}
      {hud.isAlive && lowHealth && (
        <div
          className="absolute inset-0 transition-opacity duration-200"
          style={{
            boxShadow: 'inset 0 0 110px rgba(220, 38, 38, 0.45)',
          }}
        />
      )}

      {/* Precision Optical Scopes (M24 Mil-Dot / MK14 ACOG / RPG-7 PGO-7) */}
      {hud.isAlive && isFullScope && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background:
                hud.activeWeapon === 'm24'
                  ? 'radial-gradient(circle at center, transparent 27%, rgba(6, 9, 15, 0.98) 28.5%)'
                  : hud.activeWeapon === 'rpg7'
                  ? 'radial-gradient(circle at center, transparent 25%, rgba(7, 10, 14, 0.95) 26.8%)'
                  : 'radial-gradient(circle at center, transparent 24%, rgba(8, 12, 18, 0.92) 26%)',
            }}
          >
            {hud.activeWeapon === 'm24' ? (
              <div className="relative w-[54vmin] h-[54vmin] rounded-full border-2 border-slate-700/90">
                <div className="absolute inset-x-0 top-1/2 h-px bg-slate-950/90" />
                <div className="absolute inset-y-0 left-1/2 w-px bg-slate-950/90" />
                <div className="absolute inset-x-[20%] top-1/2 h-[2px] -translate-y-1/2 flex justify-between items-center">
                  <span className="w-px h-3 bg-slate-950" />
                  <span className="w-px h-2 bg-slate-950" />
                  <span className="w-px h-2 bg-slate-950" />
                  <span className="w-px h-2 bg-slate-950" />
                  <span className="w-px h-3 bg-slate-950" />
                </div>
                <div className="absolute inset-y-[20%] left-1/2 w-[2px] -translate-x-1/2 flex flex-col justify-between items-center">
                  <span className="h-px w-3 bg-slate-950" />
                  <span className="h-px w-2 bg-slate-950" />
                  <span className="h-px w-2 bg-slate-950" />
                  <span className="h-px w-2 bg-slate-950" />
                  <span className="h-px w-3 bg-slate-950" />
                </div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-red-500" />
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 font-mono text-xs text-slate-300 bg-[#0b0f17]/80 px-2.5 py-0.5 rounded border border-slate-700 tabular-nums">
                  {hud.scopeZoom.toFixed(1)}× · V Zoom
                </div>
              </div>
            ) : hud.activeWeapon === 'rpg7' ? (
              <div className="relative w-[50vmin] h-[50vmin] rounded-full border-2 border-slate-700/90">
                {/* PGO-7 Ballistic Drop Stadia Grid */}
                <svg className="w-full h-full" viewBox="0 0 200 200">
                  <line x1="28" y1="100" x2="172" y2="100" stroke="#0f172a" strokeWidth="1.4" />
                  <line x1="100" y1="78" x2="100" y2="165" stroke="#0f172a" strokeWidth="1.4" />
                  <polyline points="92,106 100,98 108,106" fill="none" stroke="#ef4444" strokeWidth="2.2" />
                  <line x1="88" y1="118" x2="112" y2="118" stroke="#0f172a" strokeWidth="1.5" />
                  <line x1="91" y1="132" x2="109" y2="132" stroke="#0f172a" strokeWidth="1.5" />
                  <line x1="93" y1="146" x2="107" y2="146" stroke="#0f172a" strokeWidth="1.5" />
                  <text x="115" y="121" fill="#0f172a" fontSize="8" fontFamily="monospace">2</text>
                  <text x="113" y="135" fill="#0f172a" fontSize="8" fontFamily="monospace">3</text>
                  <text x="111" y="149" fill="#0f172a" fontSize="8" fontFamily="monospace">4</text>
                </svg>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-xs text-red-300 bg-[#0b0f17]/80 px-2.5 py-0.5 rounded border border-slate-700 tabular-nums">
                  2.7× PGO-7 Optic
                </div>
              </div>
            ) : (
              <div className="relative w-[48vmin] h-[48vmin] rounded-full border-2 border-slate-600/80">
                <div className="absolute inset-x-[12%] top-1/2 h-px bg-slate-950/85" />
                <div className="absolute top-[50%] bottom-[14%] left-1/2 w-px bg-slate-950/85" />
                {/* Amber ACOG chevron + BDC drop ticks */}
                <svg
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  width="36"
                  height="64"
                  viewBox="0 0 36 64"
                >
                  <polyline
                    points="11,36 18,28 25,36"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <line x1="13" y1="44" x2="23" y2="44" stroke="#0f172a" strokeWidth="1.5" />
                  <line x1="14" y1="52" x2="22" y2="52" stroke="#0f172a" strokeWidth="1.5" />
                </svg>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-xs text-amber-300 bg-[#0b0f17]/80 px-2.5 py-0.5 rounded border border-slate-700 tabular-nums">
                  {hud.scopeZoom.toFixed(1)}× ACOG · V Zoom
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Close-Range Illuminated Optics (EOTech Holo / AK Reflex / MP5 Red-Dot / Ghost Ring) */}
      {hud.isAlive && isOpticSight && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative flex items-center justify-center">
            {hud.activeWeapon === 'm4a1' && (
              <svg width="56" height="56" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="16" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.9" />
                <circle cx="28" cy="28" r="1.8" fill="#ef4444" />
              </svg>
            )}
            {hud.activeWeapon === 'ak74' && (
              <svg width="48" height="48" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="17" fill="none" stroke="rgba(148,163,184,0.4)" strokeWidth="1.5" />
                <polyline points="19,27 24,21 29,27" fill="none" stroke="#f59e0b" strokeWidth="2" />
              </svg>
            )}
            {hud.activeWeapon === 'mp5' && (
              <svg width="44" height="44" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="16" fill="none" stroke="rgba(56,189,248,0.45)" strokeWidth="1.5" />
                <circle cx="22" cy="22" r="2" fill="#38bdf8" />
              </svg>
            )}
            {hud.activeWeapon === 'm870' && (
              <svg width="52" height="52" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="18" fill="none" stroke="rgba(248,250,252,0.55)" strokeWidth="1.5" />
                <circle cx="26" cy="26" r="2.2" fill="#34d399" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Directional Damage Indicators */}
      {hud.isAlive &&
        hud.damageIndicators.map((ind) => {
          const deg = (ind.angleRad * 180) / Math.PI;
          return (
            <div
              key={ind.id}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48"
              style={{ transform: `translate(-50%, -50%) rotate(${-deg}deg)` }}
            >
              <div
                className="mx-auto w-14 h-2.5 rounded-t-full bg-red-500"
                style={{ opacity: ind.intensity * 0.85 }}
              />
            </div>
          );
        })}

      {/* Dynamic Hipfire Crosshair */}
      {hud.isAlive && !isFullScope && !isOpticSight && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative w-1 h-1">
            {/* Center dot */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white/90 shadow" />
            {/* 4 Dynamic spread ticks */}
            <div
              className="absolute left-1/2 -translate-x-1/2 w-[2px] h-2.5 bg-white/90 shadow"
              style={{ bottom: `${hud.crosshairSpread}px` }}
            />
            <div
              className="absolute left-1/2 -translate-x-1/2 w-[2px] h-2.5 bg-white/90 shadow"
              style={{ top: `${hud.crosshairSpread}px` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 h-[2px] w-2.5 bg-white/90 shadow"
              style={{ right: `${hud.crosshairSpread}px` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 h-[2px] w-2.5 bg-white/90 shadow"
              style={{ left: `${hud.crosshairSpread}px` }}
            />
          </div>
        </div>
      )}

      {/* Hitmarker X */}
      {showHitmarker && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <svg width="34" height="34" viewBox="0 0 34 34">
            <g
              stroke={
                hud.hitmarkerType === 'kill'
                  ? '#f59e0b'
                  : hud.hitmarkerType === 'head'
                  ? '#ef4444'
                  : '#f8fafc'
              }
              strokeWidth={hud.hitmarkerType === 'kill' ? '2.8' : '2.2'}
              strokeLinecap="round"
            >
              <line x1="6" y1="6" x2="12" y2="12" />
              <line x1="28" y1="6" x2="22" y2="12" />
              <line x1="6" y1="28" x2="12" y2="22" />
              <line x1="28" y1="28" x2="22" y2="22" />
            </g>
          </svg>
        </div>
      )}

      {/* Elimination Confirmation Banner */}
      {hud.lastEliminatedName && performance.now() - hud.hitmarkerTime < 1400 && (
        <div className="absolute left-1/2 top-[58%] -translate-x-1/2 text-center">
          <div className="px-3 py-1 rounded bg-[#0c111a]/88 border border-amber-500/40 text-xs font-medium text-amber-300">
            Eliminated <span className="text-white font-semibold">{hud.lastEliminatedName}</span>
            {hud.lastEliminatedHeadshot ? ' · Headshot' : ''}
          </div>
        </div>
      )}

      {/* Top Row: Radar (Left) | TDM Scoreboard (Center) | Kill Feed (Right) */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <TacticalRadar playerPos={hud.playerPos} blips={hud.radarBlips} halfSize={hud.arenaHalfSize} />
          <div className="flex items-center gap-2 text-[11px] text-slate-300 bg-[#0b0f17]/82 border border-slate-800 rounded px-2.5 py-1">
            {muted ? <VolumeX className="w-3.5 h-3.5 text-slate-400" /> : <Volume2 className="w-3.5 h-3.5 text-slate-300" />}
            <span>M Audio</span>
            <span aria-hidden="true">·</span>
            <span>Tab Standings</span>
          </div>
        </div>

        {/* Center TDM Score Bar */}
        <div className="flex items-center gap-3 bg-[#0b0f17]/90 border border-slate-700/75 rounded-lg px-4 py-2 shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-medium text-blue-400">Vanguard</span>
            <span className="font-mono text-2xl font-bold text-white tabular-nums">
              {hud.blueScore}
            </span>
          </div>

          <div className="px-3 border-x border-slate-700/80 text-center">
            <div className="font-mono text-base font-semibold text-slate-100 tabular-nums">
              {formatClock(hud.timeRemaining)}
            </div>
            <div className="text-[10px] text-slate-400 font-mono tabular-nums">
              Target {hud.scoreLimit}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="font-mono text-2xl font-bold text-white tabular-nums">
              {hud.redScore}
            </span>
            <span className="text-xs font-medium text-red-400">Syndicate</span>
          </div>
        </div>

        {/* Top-Right Kill Feed */}
        <div className="w-64 flex flex-col items-end gap-1.5">
          {hud.killFeed.map((item) => (
            <div
              key={item.id}
              className="px-2.5 py-1 rounded bg-[#0b0f17]/86 border border-slate-800/90 text-xs flex items-center gap-1.5 whitespace-nowrap"
            >
              <span className={item.killerTeam === 'blue' ? 'text-blue-400 font-semibold' : 'text-red-400 font-semibold'}>
                {item.killerName}
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                [{item.weaponShort}{item.isHeadshot ? ' HS' : ''}]
              </span>
              <span className={item.victimTeam === 'blue' ? 'text-blue-400 font-semibold' : 'text-red-400 font-semibold'}>
                {item.victimName}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mounted HMG Interact Prompt & Cooking Grenade Meter */}
      {hud.isAlive && hud.mountedMg.nearPrompt && !isMounted && (
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-md bg-[#0b0f17]/92 border border-amber-500/60 text-xs font-medium text-amber-200 shadow-lg">
          Press <span className="font-mono font-bold text-amber-400">[E]</span> to Mount .50 Cal M2HB Turret
        </div>
      )}

      {hud.isAlive && hud.isCookingGrenade && (
        <div className="absolute top-[60%] left-1/2 -translate-x-1/2 w-52 bg-[#0b0f17]/92 border border-red-500/60 rounded-md px-3 py-2 shadow-lg">
          <div className="flex justify-between text-[11px] font-medium text-red-300 mb-1">
            <span>M67 Frag Fuse (Release G)</span>
            <span className="font-mono tabular-nums">{Math.round(hud.grenadeCookProgress * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-sm overflow-hidden">
            <div
              className="h-full bg-red-500"
              style={{ width: `${Math.min(100, hud.grenadeCookProgress * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Pickup Notice */}
      {hud.pickupNotice && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded bg-[#0c121c]/90 border border-emerald-500/40 text-xs font-medium text-emerald-300">
          {hud.pickupNotice}
        </div>
      )}

      {/* Respawn Banner */}
      {!hud.isAlive && (
        <div className="absolute inset-x-0 top-1/3 flex justify-center">
          <div className="px-6 py-4 rounded-lg bg-[#0b0f17]/92 border border-red-500/40 text-center shadow-xl">
            <div className="font-display text-lg font-bold text-white">Eliminated</div>
            <div className="font-mono text-sm text-slate-300 mt-1 tabular-nums">
              Redeploying in {hud.respawnTimer.toFixed(1)}s
            </div>
          </div>
        </div>
      )}

      {/* Click-to-Lock Hint if playing without pointer lock */}
      {!hud.pointerLocked && hud.phase === 'playing' && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 pointer-events-auto">
          <button
            type="button"
            onClick={onRequestLock}
            className="px-4 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold shadow-md transition-colors"
          >
            Click viewport to lock mouse aim
          </button>
        </div>
      )}

      {/* Bottom Left: Health & Stamina */}
      <div className="absolute bottom-5 left-5 w-60 bg-[#0b0f17]/88 border border-slate-700/75 rounded-lg p-3.5 shadow-lg">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-xs font-medium text-slate-400">Armor & Health</span>
          <span
            className={`font-mono text-2xl font-bold tabular-nums ${
              lowHealth ? 'text-red-400' : 'text-white'
            }`}
          >
            {Math.ceil(hud.health)}
          </span>
        </div>
        <div className="w-full h-2 rounded-sm bg-slate-800 overflow-hidden mb-2.5">
          <div
            className={`h-full transition-all duration-100 ${
              lowHealth ? 'bg-red-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.max(0, Math.min(100, (hud.health / hud.maxHealth) * 100))}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
          <span>Sprint Stamina</span>
          <span className="font-mono tabular-nums">{Math.round(hud.stamina)}%</span>
        </div>
        <div className="w-full h-1 rounded-sm bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-sky-400 transition-all duration-75"
            style={{ width: `${Math.max(0, Math.min(100, hud.stamina))}%` }}
          />
        </div>
      </div>

      {/* Bottom Right: Grenades, Active Weapon / Mounted HMG, Reload & 1-7 Slots */}
      <div className="absolute bottom-5 right-5 flex flex-col items-end gap-2">
        {/* Reloading bar */}
        {hud.isReloading && !isMounted && (
          <div className="w-64 bg-[#0b0f17]/90 border border-amber-500/40 rounded px-3 py-2">
            <div className="flex justify-between text-xs text-amber-300 mb-1">
              <span>Reloading</span>
              <span className="font-mono tabular-nums">{Math.round(hud.reloadProgress * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-sm overflow-hidden">
              <div
                className="h-full bg-amber-400"
                style={{ width: `${Math.min(100, hud.reloadProgress * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Frag Grenade Strip */}
        {!isMounted && (
          <div className="px-3 py-1 rounded bg-[#0b0f17]/88 border border-slate-700/75 text-xs flex items-center gap-2">
            <span className="font-mono font-semibold text-amber-400">[G]</span>
            <span className="text-slate-300">M67 Frag</span>
            <span className="font-mono font-bold text-white tabular-nums">
              ×{hud.grenades}
            </span>
          </div>
        )}

        {/* Active Ammo Card OR Mounted .50 Cal HMG Card */}
        {isMounted ? (
          <div className="w-80 bg-[#0b0f17]/92 border border-amber-500/60 rounded-lg p-3.5 shadow-lg">
            <div className="flex items-baseline justify-between gap-2 mb-2">
              <div className="min-w-0">
                <div className="font-display text-base font-bold text-amber-300 leading-tight">
                  .50 Cal M2HB Turret
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  BELT-FED · .50 BMG · [E / Space] Dismount
                </div>
              </div>
              <div className="text-right font-mono text-lg font-bold text-white shrink-0">
                ∞
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className={hud.mountedMg.overheated ? 'text-red-400 font-semibold' : 'text-slate-400'}>
                {hud.mountedMg.overheated ? 'BARREL OVERHEATED — COOLING' : 'Barrel Thermal Load'}
              </span>
              <span className="font-mono text-slate-300 tabular-nums">
                {Math.round(hud.mountedMg.heat * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-sm overflow-hidden">
              <div
                className={`h-full transition-all duration-75 ${
                  hud.mountedMg.overheated
                    ? 'bg-red-500'
                    : hud.mountedMg.heat > 0.7
                    ? 'bg-orange-400'
                    : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min(100, Math.round(hud.mountedMg.heat * 100))}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="w-72 bg-[#0b0f17]/88 border border-slate-700/75 rounded-lg p-3.5 shadow-lg">
            <div className="flex items-baseline justify-between gap-2">
              <div className="min-w-0">
                <div className="font-display text-base font-bold text-white leading-tight truncate">
                  {activeSpec.name}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                  {activeSpec.fireMode} · {activeSpec.caliber}
                </div>
              </div>
              <div className="text-right font-mono tabular-nums shrink-0">
                <span className={`text-3xl font-bold ${lowAmmo ? 'text-amber-400' : 'text-white'}`}>
                  {activeState.mag}
                </span>
                <span className="text-sm text-slate-400 ml-1">/ {activeState.reserve}</span>
              </div>
            </div>
          </div>
        )}

        {/* 1-7 Weapon Quick Slots */}
        {!isMounted && (
          <div className="flex items-center gap-1 flex-wrap justify-end">
            {WEAPON_ORDER.map((wid) => {
              const spec = WEAPONS[wid];
              const st = hud.weapons[wid];
              const selected = wid === hud.activeWeapon;
              return (
                <div
                  key={wid}
                  className={`px-2 py-1 rounded border text-[11px] transition-colors whitespace-nowrap ${
                    selected
                      ? 'bg-amber-500/20 border-amber-400 text-white'
                      : 'bg-[#0b0f17]/85 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="font-mono font-semibold text-amber-400 mr-1">{spec.slot}</span>
                  <span className="font-medium">{spec.shortName}</span>
                  <span className="font-mono text-[10px] ml-1 opacity-75 tabular-nums">
                    {st.mag}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tab Scoreboard Overlay */}
      {showScoreboard && (
        <div className="absolute inset-0 bg-[#070a10]/65 flex items-center justify-center p-6">
          <ScoreboardModal
            entries={hud.scoreboard}
            blueScore={hud.blueScore}
            redScore={hud.redScore}
            scoreLimit={hud.scoreLimit}
          />
        </div>
      )}
    </div>
  );
};
