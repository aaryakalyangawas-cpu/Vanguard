import React from 'react';
import {
  BarChart2,
  Crosshair,
  Flame,
  MapPin,
  Pause,
  Plane,
  Radio,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { HudSnapshot } from '../game/types';
import { WEAPONS } from '../game/weapons';
import { ScoreboardModal } from './ScoreboardModal';
import { TacticalRadar } from './TacticalRadar';

interface TacticalHudProps {
  hud: HudSnapshot;
  showScoreboard: boolean;
  muted: boolean;
  onRequestLock: () => void;
  onPause: () => void;
  onToggleScoreboard: () => void;
  onToggleMute: () => void;
  onSelectSlot: (slotIndex: 0 | 1 | 2) => void;
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
  onPause,
  onToggleScoreboard,
  onToggleMute,
  onSelectSlot,
}) => {
  const activeSpec = WEAPONS[hud.activeWeapon] || WEAPONS.m4a1;
  const activeState = hud.weaponStates[hud.activeWeapon] || {
    id: hud.activeWeapon,
    mag: activeSpec.magSize,
    reserve: activeSpec.reserveMax,
  };
  const isMounted = hud.mountedMg.active;
  const inVehicle = hud.vehicle.active;
  const inPassengerPort = inVehicle && hud.vehicle.seatIndex >= 2;
  const isTouch = hud.touchControlsActive;

  const isFullScope =
    !isMounted &&
    (!inVehicle || inPassengerPort) &&
    hud.isAds &&
    (activeSpec.optic === 'sniper' ||
      activeSpec.optic === 'acog' ||
      activeSpec.optic === 'pgo' ||
      activeSpec.optic === 'thermal_lock');

  const isOpticSight =
    (!isMounted &&
      (!inVehicle || inPassengerPort) &&
      hud.isAds &&
      (activeSpec.optic === 'holo' ||
        activeSpec.optic === 'reflex' ||
        activeSpec.optic === 'iron')) ||
    (isMounted && hud.mountedMg.kind !== 'field_gun' && hud.isAds);

  const isFieldGunOptic =
    isMounted && hud.mountedMg.kind === 'field_gun' && hud.isAds;

  const isHeliOptic =
    inVehicle && hud.vehicle.type === 'attack_heli' && hud.isAds;

  const lowAmmo = activeState.mag <= Math.ceil(activeSpec.magSize * 0.25);
  const lowHealth = hud.health <= 30;
  const showHitmarker = hud.hitmarkerType !== 'none' && performance.now() - hud.hitmarkerTime < 220;

  return (
    <div className="fixed inset-0 z-20 pointer-events-none select-none">
      {/* Low Health Vignette */}
      {hud.isAlive && lowHealth && (
        <div
          className="absolute inset-0 transition-opacity duration-200"
          style={{
            boxShadow: 'inset 0 0 110px rgba(220, 38, 38, 0.45)',
          }}
        />
      )}

      {/* Precision Optical & Thermal Scopes with High-Contrast Crossbars + Red Dot */}
      {hud.isAlive && isFullScope && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background:
                activeSpec.optic === 'sniper'
                  ? 'radial-gradient(circle at center, transparent 28%, rgba(6, 9, 15, 0.96) 29.8%)'
                  : activeSpec.optic === 'thermal_lock'
                  ? 'radial-gradient(circle at center, rgba(6, 78, 59, 0.1) 27%, rgba(4, 10, 14, 0.94) 29%)'
                  : activeSpec.optic === 'pgo'
                  ? 'radial-gradient(circle at center, transparent 26%, rgba(7, 10, 14, 0.94) 28%)'
                  : 'radial-gradient(circle at center, transparent 25%, rgba(8, 12, 18, 0.9) 27.2%)',
            }}
          >
            {activeSpec.optic === 'sniper' ? (
              <div className="relative w-[56vmin] h-[56vmin] rounded-full border-2 border-slate-500/80">
                <svg className="w-full h-full" viewBox="0 0 200 200">
                  {/* Dark outer contrast halo so crossbar stays visible on bright sky & sand */}
                  <g stroke="rgba(2, 6, 23, 0.85)" strokeWidth="2.4" strokeLinecap="round">
                    <line x1="6" y1="100" x2="90" y2="100" />
                    <line x1="110" y1="100" x2="194" y2="100" />
                    <line x1="100" y1="6" x2="100" y2="90" />
                    <line x1="100" y1="110" x2="100" y2="194" />
                  </g>
                  {/* Etched crisp white/silver primary crossbars */}
                  <g stroke="#f8fafc" strokeWidth="1.05" strokeLinecap="round">
                    <line x1="6" y1="100" x2="91" y2="100" />
                    <line x1="109" y1="100" x2="194" y2="100" />
                    <line x1="100" y1="6" x2="100" y2="91" />
                    <line x1="100" y1="109" x2="100" y2="194" />
                    {/* Mil-Dot Horizontal Stadia */}
                    <line x1="40" y1="96" x2="40" y2="104" />
                    <line x1="56" y1="97" x2="56" y2="103" />
                    <line x1="72" y1="97" x2="72" y2="103" />
                    <line x1="128" y1="97" x2="128" y2="103" />
                    <line x1="144" y1="97" x2="144" y2="103" />
                    <line x1="160" y1="96" x2="160" y2="104" />
                    {/* Mil-Dot Vertical Holdover Ticks */}
                    <line x1="97" y1="56" x2="103" y2="56" />
                    <line x1="97" y1="74" x2="103" y2="74" />
                    <line x1="96" y1="124" x2="104" y2="124" />
                    <line x1="96" y1="142" x2="104" y2="142" />
                    <line x1="95" y1="160" x2="105" y2="160" />
                  </g>
                  {/* Illuminated Red Center Aiming Dot */}
                  <circle cx="100" cy="100" r="2.2" fill="#ef4444" stroke="#020617" strokeWidth="0.7" />
                </svg>
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 font-mono text-xs bg-[#0b0f17]/88 px-2.5 py-0.5 rounded border border-slate-600 tabular-nums whitespace-nowrap flex items-center gap-2">
                  <span className="text-slate-200">{hud.scopeZoom.toFixed(1)}×{!isTouch && ' · V Zoom'}</span>
                  {!isTouch && (
                    <span className={hud.isSteadyAim ? 'text-cyan-300 font-bold' : 'text-slate-400'}>
                      {hud.isSteadyAim ? '· STEADY LOCK' : '· Shift Steady'}
                    </span>
                  )}
                </div>
              </div>
            ) : activeSpec.optic === 'thermal_lock' ? (
              <div className="relative w-[54vmin] h-[54vmin] rounded-full border-2 border-cyan-500/70">
                <svg className="w-full h-full" viewBox="0 0 200 200">
                  <g stroke="rgba(34, 211, 238, 0.72)" strokeWidth="1.2">
                    <line x1="12" y1="100" x2="66" y2="100" />
                    <line x1="134" y1="100" x2="188" y2="100" />
                    <line x1="100" y1="12" x2="100" y2="66" />
                    <line x1="100" y1="134" x2="100" y2="188" />
                  </g>
                </svg>
                <div
                  className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 sm:w-28 sm:h-28 border-2 transition-colors ${
                    hud.lockOn.locked
                      ? 'border-red-500'
                      : hud.lockOn.locking
                      ? 'border-amber-400'
                      : 'border-cyan-400/80'
                  }`}
                >
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-red-500 border border-slate-950" />
                </div>
                <div className="absolute top-5 left-1/2 -translate-x-1/2 font-mono text-[10px] sm:text-[11px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#0b0f17]/90 border border-cyan-500/40 text-cyan-300 whitespace-nowrap">
                  {hud.lockOn.mode === 'laser_guided' ? 'SACLOS LASER' : 'CLU IR SEEKER'}
                </div>
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 font-mono text-[11px] sm:text-xs bg-[#0b0f17]/90 px-2.5 py-1 rounded border border-slate-700 text-center max-w-[90%]">
                  {hud.lockOn.mode === 'laser_guided' ? (
                    <span className="text-cyan-300">Steer missile with red dot</span>
                  ) : hud.lockOn.locked ? (
                    <span className="text-red-400 font-bold">
                      LOCKED: {hud.lockOn.targetName} — FIRE!
                    </span>
                  ) : hud.lockOn.locking ? (
                    <span className="text-amber-300">
                      LOCKING {hud.lockOn.targetName}... {Math.round(hud.lockOn.progress * 100)}%
                    </span>
                  ) : (
                    <span className="text-slate-300">Track vehicle/jet to lock</span>
                  )}
                </div>
              </div>
            ) : activeSpec.optic === 'pgo' ? (
              <div className="relative w-[52vmin] h-[52vmin] rounded-full border-2 border-slate-600/90">
                <svg className="w-full h-full" viewBox="0 0 200 200">
                  <g stroke="rgba(2, 6, 23, 0.85)" strokeWidth="2.4" strokeLinecap="round">
                    <line x1="20" y1="100" x2="88" y2="100" />
                    <line x1="112" y1="100" x2="180" y2="100" />
                    <line x1="100" y1="30" x2="100" y2="88" />
                    <line x1="100" y1="112" x2="100" y2="174" />
                  </g>
                  <g stroke="#f8fafc" strokeWidth="1.15" strokeLinecap="round">
                    <line x1="20" y1="100" x2="88" y2="100" />
                    <line x1="112" y1="100" x2="180" y2="100" />
                    <line x1="100" y1="30" x2="100" y2="88" />
                    <line x1="100" y1="112" x2="100" y2="174" />
                    <line x1="88" y1="120" x2="112" y2="120" />
                    <line x1="91" y1="136" x2="109" y2="136" />
                    <line x1="93" y1="152" x2="107" y2="152" />
                  </g>
                  <polyline points="92,107 100,98 108,107" fill="none" stroke="#ef4444" strokeWidth="2.2" />
                  <circle cx="100" cy="100" r="1.8" fill="#ef4444" />
                </svg>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-xs text-red-300 bg-[#0b0f17]/85 px-2.5 py-0.5 rounded border border-slate-700 tabular-nums whitespace-nowrap">
                  2.7× PGO-7 Optic
                </div>
              </div>
            ) : (
              /* ACOG 2.2x–4x Etched Crossbar + Illuminated Red Dot */
              <div className="relative w-[50vmin] h-[50vmin] rounded-full border-2 border-slate-500/80">
                <svg className="w-full h-full" viewBox="0 0 200 200">
                  <g stroke="rgba(2, 6, 23, 0.85)" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="16" y1="100" x2="88" y2="100" />
                    <line x1="112" y1="100" x2="184" y2="100" />
                    <line x1="100" y1="18" x2="100" y2="88" />
                    <line x1="100" y1="112" x2="100" y2="180" />
                  </g>
                  <g stroke="#f8fafc" strokeWidth="1.15" strokeLinecap="round">
                    <line x1="16" y1="100" x2="88" y2="100" />
                    <line x1="112" y1="100" x2="184" y2="100" />
                    <line x1="100" y1="18" x2="100" y2="88" />
                    <line x1="100" y1="112" x2="100" y2="180" />
                    <line x1="92" y1="122" x2="108" y2="122" />
                    <line x1="94" y1="140" x2="106" y2="140" />
                    <line x1="95" y1="158" x2="105" y2="158" />
                  </g>
                  <polyline
                    points="92,107 100,99 108,107"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.1"
                    strokeLinecap="round"
                  />
                  <circle cx="100" cy="100" r="2.2" fill="#ef4444" stroke="#020617" strokeWidth="0.7" />
                </svg>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-xs bg-[#0b0f17]/85 px-2.5 py-0.5 rounded border border-slate-700 tabular-nums whitespace-nowrap flex items-center gap-2">
                  <span className="text-amber-300">{hud.scopeZoom.toFixed(1)}× ACOG{!isTouch && ' · V Zoom'}</span>
                  {!isTouch && (
                    <span className={hud.isSteadyAim ? 'text-cyan-300 font-bold' : 'text-slate-400'}>
                      {hud.isSteadyAim ? '· STEADY' : '· Shift Steady'}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Close-Range Red Dot & Crossbar Optics (Holo / Reflex / Iron / Zoomed Turrets) */}
      {hud.isAlive && isOpticSight && (
        <div className="absolute inset-0 flex items-center justify-center">
          {!isMounted && activeSpec.optic === 'holo' ? (
            /* Holographic 65-MOA Red Ring + Open Crossbar Ticks + Center Red Dot */
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle
                cx="36"
                cy="36"
                r="20"
                fill="none"
                stroke="rgba(2, 6, 23, 0.65)"
                strokeWidth="2.8"
                strokeDasharray="11 4.7"
              />
              <circle
                cx="36"
                cy="36"
                r="20"
                fill="none"
                stroke="#ef4444"
                strokeWidth="1.6"
                strokeDasharray="11 4.7"
              />
              <g stroke="rgba(2, 6, 23, 0.75)" strokeWidth="2.6" strokeLinecap="round">
                <line x1="8" y1="36" x2="21" y2="36" />
                <line x1="51" y1="36" x2="64" y2="36" />
                <line x1="36" y1="8" x2="36" y2="21" />
                <line x1="36" y1="51" x2="36" y2="64" />
              </g>
              <g stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round">
                <line x1="8" y1="36" x2="21" y2="36" />
                <line x1="51" y1="36" x2="64" y2="36" />
                <line x1="36" y1="8" x2="36" y2="21" />
                <line x1="36" y1="51" x2="36" y2="64" />
              </g>
              <circle cx="36" cy="36" r="2.4" fill="#ef4444" stroke="#020617" strokeWidth="0.8" />
            </svg>
          ) : (
            /* Precision Red Dot + Crisp Crossbar Sight (Reflex, Iron ADS, HMG/Autocannon Zoom) */
            <svg width="68" height="68" viewBox="0 0 68 68">
              <circle
                cx="34"
                cy="34"
                r="19"
                fill="none"
                stroke="rgba(248, 250, 252, 0.24)"
                strokeWidth="1.2"
              />
              <g stroke="rgba(2, 6, 23, 0.8)" strokeWidth="2.6" strokeLinecap="round">
                <line x1="10" y1="34" x2="26" y2="34" />
                <line x1="42" y1="34" x2="58" y2="34" />
                <line x1="34" y1="10" x2="34" y2="26" />
                <line x1="34" y1="42" x2="34" y2="58" />
              </g>
              <g stroke="#f8fafc" strokeWidth="1.25" strokeLinecap="round" opacity="0.92">
                <line x1="10" y1="34" x2="26" y2="34" />
                <line x1="42" y1="34" x2="58" y2="34" />
                <line x1="34" y1="10" x2="34" y2="26" />
                <line x1="34" y1="42" x2="34" y2="58" />
              </g>
              <circle cx="34" cy="34" r="2.6" fill="#ef4444" stroke="#020617" strokeWidth="0.8" />
            </svg>
          )}
        </div>
      )}

      {/* 105mm M119 Field Gun Direct-Fire Optical Sight */}
      {hud.isAlive && isFieldGunOptic && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-[52vmin] h-[52vmin] rounded-full border-2 border-amber-400/65">
            <svg className="w-full h-full" viewBox="0 0 200 200">
              <g stroke="rgba(2, 6, 23, 0.8)" strokeWidth="2.4" strokeLinecap="round">
                <line x1="18" y1="100" x2="86" y2="100" />
                <line x1="114" y1="100" x2="182" y2="100" />
                <line x1="100" y1="22" x2="100" y2="86" />
                <line x1="100" y1="114" x2="100" y2="178" />
              </g>
              <line x1="18" y1="100" x2="86" y2="100" stroke="#fbbf24" strokeWidth="1.4" />
              <line x1="114" y1="100" x2="182" y2="100" stroke="#fbbf24" strokeWidth="1.4" />
              <line x1="100" y1="22" x2="100" y2="86" stroke="#fbbf24" strokeWidth="1.2" />
              <line x1="100" y1="114" x2="100" y2="178" stroke="#fbbf24" strokeWidth="1.4" />
              <circle cx="100" cy="100" r="3.4" fill="none" stroke="#ef4444" strokeWidth="1.6" />
              <circle cx="100" cy="100" r="1.4" fill="#ef4444" />
              <line x1="90" y1="120" x2="110" y2="120" stroke="#fbbf24" strokeWidth="1.3" />
              <line x1="92" y1="138" x2="108" y2="138" stroke="#fbbf24" strokeWidth="1.3" />
              <line x1="94" y1="156" x2="106" y2="156" stroke="#fbbf24" strokeWidth="1.3" />
            </svg>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 font-mono text-[11px] text-amber-300 bg-[#0b0f17]/88 px-2.5 py-0.5 rounded border border-amber-500/40 tabular-nums whitespace-nowrap">
              2.5× M119 Direct Fire
            </div>
          </div>
        </div>
      )}

      {/* AH-64 Apache TADS/PNVS FLIR Gunship Optic */}
      {hud.isAlive && isHeliOptic && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-[62vmin] h-[44vmin] border-2 border-emerald-400/70 bg-emerald-950/15">
            <svg className="w-full h-full" viewBox="0 0 240 170">
              <g stroke="#34d399" strokeWidth="1.3" strokeLinecap="round" opacity="0.9">
                <line x1="28" y1="85" x2="104" y2="85" />
                <line x1="136" y1="85" x2="212" y2="85" />
                <line x1="120" y1="18" x2="120" y2="70" />
                <line x1="120" y1="100" x2="120" y2="152" />
                <polyline points="104,70 104,64 110,64" fill="none" />
                <polyline points="136,70 136,64 130,64" fill="none" />
                <polyline points="104,100 104,106 110,106" fill="none" />
                <polyline points="136,100 136,106 130,106" fill="none" />
              </g>
              <circle cx="120" cy="85" r="2.6" fill="#ef4444" stroke="#020617" strokeWidth="0.8" />
            </svg>
            <div className="absolute top-2 left-3 font-mono text-[11px] font-bold text-emerald-300 tabular-nums">
              ALT {hud.vehicle.altitude}m · SPD {hud.vehicle.speedKmh}km/h
            </div>
            <div className="absolute top-2 right-3 font-mono text-[11px] font-bold text-amber-300 tabular-nums">
              {hud.vehicle.seatIndex === 1
                ? `30mm: ${hud.vehicle.secondaryAmmo}/${hud.vehicle.secondaryMaxAmmo}`
                : `HYDRA: ${hud.vehicle.ammo}/${hud.vehicle.maxAmmo}`}
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[10px] px-2 py-0.5 rounded bg-[#0b0f17]/85 border border-emerald-500/40 text-emerald-300 whitespace-nowrap">
              TADS/PNVS FLIR · {hud.vehicle.seatRole}
            </div>
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
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 sm:w-48 sm:h-48"
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
      {hud.isAlive && !isFullScope && !isOpticSight && !isFieldGunOptic && !isHeliOptic && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative w-1 h-1">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white/90 shadow" />
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
          <div className="px-3 py-1 rounded bg-[#0c111a]/90 border border-amber-500/45 text-xs font-medium text-amber-300 whitespace-nowrap">
            Eliminated <span className="text-white font-semibold">{hud.lastEliminatedName}</span>
            {hud.lastEliminatedHeadshot ? ' · Headshot' : ''}
          </div>
        </div>
      )}

      {/* Killstreak Unlock Banner */}
      {hud.killStreak.recentBanner && (
        <div className="absolute top-24 sm:top-28 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-md bg-amber-500/20 border border-amber-400 text-[11px] sm:text-xs font-display font-bold text-amber-300 tracking-wide shadow-lg whitespace-nowrap">
          {hud.killStreak.recentBanner}
        </div>
      )}

      {/* Top Row: Radar + Zone | Score + Streak | Actions + Kill Feed */}
      <div className="absolute top-2.5 left-2.5 right-2.5 sm:top-4 sm:left-4 sm:right-4 flex items-start justify-between gap-2 sm:gap-4">
        <div className="flex flex-col gap-1">
          <TacticalRadar
            playerPos={hud.playerPos}
            blips={hud.radarBlips}
            halfSize={hud.arenaHalfSize}
            uavActive={hud.killStreak.uavActiveTimer > 0}
            compact={isTouch}
          />
          {hud.currentZone && (
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-cyan-200 bg-[#0b0f17]/88 border border-cyan-500/40 rounded px-2 py-0.5 sm:py-1">
              <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="font-mono font-bold text-cyan-400">Z{hud.currentZone.id}</span>
              <span className="truncate max-w-[74px] sm:max-w-[140px] text-slate-300">
                {hud.currentZone.name}
              </span>
            </div>
          )}
          {!isTouch && (
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-300 bg-[#0b0f17]/85 border border-slate-800 rounded px-2.5 py-1">
              {muted ? <VolumeX className="w-3.5 h-3.5 text-slate-400" /> : <Volume2 className="w-3.5 h-3.5 text-slate-300" />}
              <span>M Audio</span>
              <span aria-hidden="true">·</span>
              <span>Tab Standings</span>
            </div>
          )}
        </div>

        {/* Center TDM Score Bar + Operator Identity */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 sm:gap-3 bg-[#0b0f17]/92 border border-slate-700/80 rounded-lg px-2.5 py-1 sm:px-4 sm:py-2 shadow-lg">
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <span className="hidden sm:inline text-xs font-medium text-blue-400">Vanguard</span>
              <span className="font-mono text-lg sm:text-2xl font-bold text-blue-400 sm:text-white tabular-nums">
                {hud.blueScore}
              </span>
            </div>

            <div className="px-2 sm:px-3 border-x border-slate-700/80 text-center">
              <div className="font-mono text-xs sm:text-base font-semibold text-slate-100 tabular-nums">
                {formatClock(hud.timeRemaining)}
              </div>
              <div className="hidden sm:block text-[10px] text-slate-400 font-mono tabular-nums">
                Target {hud.scoreLimit}
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <span className="font-mono text-lg sm:text-2xl font-bold text-red-400 sm:text-white tabular-nums">
                {hud.redScore}
              </span>
              <span className="hidden sm:inline text-xs font-medium text-red-400">Syndicate</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-1.5 text-[10px] sm:text-[11px]">
            <span className="hidden sm:inline px-2 py-0.5 rounded bg-[#0b0f17]/88 border border-slate-700 text-slate-200 font-medium">
              Callsign: <span className="text-amber-400 font-semibold">{hud.playerUsername}</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-[#0b0f17]/88 border border-slate-700 text-slate-200 font-mono tabular-nums flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" />
              {hud.killStreak.current}
            </span>
            {hud.killStreak.uavActiveTimer > 0 && (
              <span className="px-1.5 sm:px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/60 text-cyan-300 font-mono flex items-center gap-1">
                <Radio className="w-3 h-3" />
                {Math.ceil(hud.killStreak.uavActiveTimer)}s
              </span>
            )}
            {hud.mode === 'multiplayer' && (
              <span className="px-1.5 sm:px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/45 text-emerald-300 font-mono flex items-center gap-1">
                <Users className="w-3 h-3" />
                {hud.mpHumanCount}
              </span>
            )}
          </div>
        </div>

        {/* Top-Right Controls (Scoreboard / Mute / Pause) + Kill Feed */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={onToggleScoreboard}
              className={`min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                showScoreboard
                  ? 'bg-amber-500 border-amber-300 text-slate-950'
                  : 'bg-[#0b0f17]/88 border-slate-700/80 text-slate-200 hover:bg-slate-800'
              }`}
              aria-label="Toggle Scoreboard"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onToggleMute}
              className="min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] rounded-lg bg-[#0b0f17]/88 border border-slate-700/80 text-slate-200 hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {muted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onPause}
              className="min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] rounded-lg bg-[#0b0f17]/88 border border-slate-700/80 text-slate-200 hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Pause Match"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>

          <div className="w-40 sm:w-68 flex flex-col items-end gap-1">
            {hud.killFeed.slice(0, isTouch ? 3 : 5).map((item) => (
              <div
                key={item.id}
                className="max-w-full px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-[#0b0f17]/88 border border-slate-800/90 text-[10px] sm:text-xs flex items-center gap-1 truncate"
              >
                <span className={`truncate max-w-[60px] sm:max-w-none ${item.killerTeam === 'blue' ? 'text-blue-400 font-semibold' : 'text-red-400 font-semibold'}`}>
                  {item.killerName}
                </span>
                <span className="text-slate-400 font-mono text-[9px] sm:text-[11px] shrink-0">
                  [{item.weaponShort}{item.isHeadshot ? ' HS' : ''}]
                </span>
                <span className={`truncate max-w-[60px] sm:max-w-none ${item.victimTeam === 'blue' ? 'text-blue-400 font-semibold' : 'text-red-400 font-semibold'}`}>
                  {item.victimName}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Keyboard Interact Prompts (Touch uses interactive CTA in MobileControls) */}
      {!isTouch && hud.isAlive && hud.arsenal.nearPrompt && !hud.arsenal.isOpen && (
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 px-4 py-2 rounded-md bg-[#0b0f17]/95 border border-cyan-400/75 text-xs font-medium text-cyan-200 shadow-lg">
          Press <span className="font-mono font-bold text-cyan-400">[E]</span> to Open {hud.arsenal.arsenalName} (Change Weapons &amp; Resupply)
        </div>
      )}

      {!isTouch && hud.isAlive && hud.vehicle.nearPromptName && !inVehicle && !isMounted && !hud.arsenal.nearPrompt && (
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-md bg-[#0b0f17]/92 border border-sky-400/60 text-xs font-medium text-sky-200 shadow-lg whitespace-nowrap">
          Press <span className="font-mono font-bold text-sky-400">[E]</span> to Enter {hud.vehicle.nearPromptName}
          {hud.vehicle.nearFreeSeatIndex !== null && (
            <span className="text-slate-400 ml-1.5">
              (Seat {hud.vehicle.nearFreeSeatIndex + 1})
            </span>
          )}
        </div>
      )}

      {!isTouch && hud.isAlive && hud.mountedMg.nearPromptName && !isMounted && !inVehicle && !hud.arsenal.nearPrompt && (
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-md bg-[#0b0f17]/92 border border-amber-500/60 text-xs font-medium text-amber-200 shadow-lg">
          Press <span className="font-mono font-bold text-amber-400">[E]</span> to Operate {hud.mountedMg.nearPromptName}
        </div>
      )}

      {!isTouch && hud.isAlive && hud.hangar.nearPrompt && !inVehicle && !isMounted && !hud.arsenal.nearPrompt && !hud.vehicle.nearPromptName && (
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-md bg-[#0b0f17]/94 border border-emerald-400/75 text-xs font-medium text-emerald-200 shadow-lg whitespace-nowrap">
          Press <span className="font-mono font-bold text-emerald-400">[E]</span> at {hud.hangar.hangarName} to Resupply Heavy Ordnance &amp; Vehicles
        </div>
      )}

      {!isTouch && hud.isAlive && inVehicle && hud.hangar.canServiceVehicle && (
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-md bg-emerald-950/92 border border-emerald-400/80 text-xs font-medium text-emerald-200 shadow-lg whitespace-nowrap">
          {hud.hangar.hangarName} Bay · Auto-Servicing Armor &amp; Ordnance (<span className="font-mono font-bold text-emerald-300">[R]</span> Force Rearm)
        </div>
      )}

      {!isTouch &&
        hud.isAlive &&
        hud.mountedMg.nearDestroyedName &&
        !hud.mountedMg.isRepairing &&
        !isMounted &&
        !inVehicle &&
        !hud.arsenal.nearPrompt &&
        !hud.hangar.nearPrompt &&
        !hud.mountedMg.nearPromptName && (
          <div className="absolute bottom-36 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-md bg-[#0b0f17]/92 border border-cyan-500/60 text-xs font-medium text-cyan-200 shadow-lg whitespace-nowrap">
            Press <span className="font-mono font-bold text-cyan-400">[E]</span> to Repair Destroyed {hud.mountedMg.nearDestroyedName}
          </div>
        )}

      {hud.isAlive && hud.mountedMg.isRepairing && (
        <div className="absolute top-[56%] left-1/2 -translate-x-1/2 w-56 bg-[#0b0f17]/92 border border-cyan-400/70 rounded-md px-3 py-2 shadow-lg">
          <div className="flex justify-between text-[11px] font-medium text-cyan-300 mb-1">
            <span>Repairing Mount...</span>
            <span className="font-mono tabular-nums">{Math.round(hud.mountedMg.repairProgress * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-sm overflow-hidden">
            <div
              className="h-full bg-cyan-400"
              style={{ width: `${Math.min(100, hud.mountedMg.repairProgress * 100)}%` }}
            />
          </div>
        </div>
      )}

      {hud.isAlive && hud.trench.isDigging && (
        <div className="absolute top-[56%] left-1/2 -translate-x-1/2 w-56 bg-[#0b0f17]/92 border border-amber-500/70 rounded-md px-3 py-2 shadow-lg">
          <div className="flex justify-between text-[11px] font-medium text-amber-300 mb-1">
            <span>Digging Fighting Trench...</span>
            <span className="font-mono tabular-nums">{Math.round(hud.trench.progress * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-sm overflow-hidden">
            <div
              className="h-full bg-amber-400"
              style={{ width: `${Math.min(100, hud.trench.progress * 100)}%` }}
            />
          </div>
        </div>
      )}

      {hud.isAlive && hud.isCookingGrenade && (
        <div className="absolute top-[60%] left-1/2 -translate-x-1/2 w-48 sm:w-52 bg-[#0b0f17]/92 border border-red-500/60 rounded-md px-3 py-2 shadow-lg">
          <div className="flex justify-between text-[11px] font-medium text-red-300 mb-1">
            <span>M67 Frag Fuse ({isTouch ? 'Release' : 'Release G'})</span>
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

      {/* Pickup / Action Notice */}
      {hud.pickupNotice && (
        <div className="absolute bottom-28 sm:bottom-28 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded bg-[#0c121c]/90 border border-emerald-500/45 text-xs font-medium text-emerald-300 whitespace-nowrap">
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

      {/* Click-to-Lock Hint (Desktop only) */}
      {!isTouch && !hud.pointerLocked && hud.phase === 'playing' && !hud.arsenal.isOpen && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 pointer-events-auto">
          <button
            type="button"
            onClick={onRequestLock}
            className="px-4 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold shadow-md transition-colors cursor-pointer"
          >
            Click viewport to lock mouse aim
          </button>
        </div>
      )}

      {/* Bottom Status Layout: Compact Center Bar on Touch Devices vs Split Corners on Desktop */}
      {isTouch ? (
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 max-w-[52vw] sm:max-w-md pointer-events-auto">
          {hud.isReloading && !isMounted && (!inVehicle || inPassengerPort) && (
            <div className="w-40 bg-[#0b0f17]/92 border border-amber-500/45 rounded px-2.5 py-1">
              <div className="flex justify-between text-[10px] text-amber-300 mb-0.5">
                <span>Reloading</span>
                <span className="font-mono tabular-nums">{Math.round(hud.reloadProgress * 100)}%</span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-sm overflow-hidden">
                <div
                  className="h-full bg-amber-400"
                  style={{ width: `${Math.min(100, hud.reloadProgress * 100)}%` }}
                />
              </div>
            </div>
          )}

          {!isMounted && (!inVehicle || inPassengerPort) && (
            <div className="flex items-center gap-1">
              {hud.loadout.map((wid, idx) => {
                const spec = WEAPONS[wid] || WEAPONS.m4a1;
                const st = hud.weaponStates[wid] || { id: wid, mag: spec.magSize, reserve: spec.reserveMax };
                const selected = idx === hud.activeSlot;
                return (
                  <button
                    key={`${idx}-${wid}`}
                    type="button"
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      onSelectSlot(idx as 0 | 1 | 2);
                    }}
                    onClick={() => onSelectSlot(idx as 0 | 1 | 2)}
                    className={`min-h-[34px] px-2 py-1 rounded border text-[10px] transition-colors whitespace-nowrap ${
                      selected
                        ? 'bg-amber-500/25 border-amber-400 text-white'
                        : 'bg-[#0b0f17]/88 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span className="font-mono font-bold text-amber-400 mr-1">{idx + 1}</span>
                    <span className="font-medium">{spec.shortName}</span>
                    <span className="font-mono text-[9px] ml-1 opacity-80 tabular-nums">{st.mag}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Compact Health + Active Status Strip */}
          <div className="flex items-center gap-2.5 bg-[#0b0f17]/90 border border-slate-700/80 rounded-lg px-3 py-1.5 shadow-lg">
            <div className="flex items-center gap-1.5">
              <span className={`font-mono text-sm font-bold tabular-nums ${lowHealth ? 'text-red-400' : 'text-emerald-400'}`}>
                {Math.ceil(hud.health)}
              </span>
              <div className="w-14 h-2 rounded-sm bg-slate-800 overflow-hidden">
                <div
                  className={`h-full ${lowHealth ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.max(0, Math.min(100, (hud.health / hud.maxHealth) * 100))}%` }}
                />
              </div>
            </div>

            <div className="h-4 w-px bg-slate-700" />

            {inVehicle ? (
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="text-sky-300 font-semibold truncate max-w-[82px]">{hud.vehicle.name}</span>
                {hud.vehicle.type === 'attack_heli' && (
                  <span className="text-emerald-300 text-[10px] tabular-nums">
                    {hud.vehicle.altitude}m
                  </span>
                )}
                <span
                  className={`font-bold tabular-nums ${
                    (hud.vehicle.seatIndex === 1 && hud.vehicle.secondaryMaxAmmo > 0
                      ? hud.vehicle.secondaryAmmo
                      : hud.vehicle.ammo) <= 0
                      ? 'text-red-400'
                      : 'text-amber-300'
                  }`}
                >
                  {hud.vehicle.seatIndex === 1 && hud.vehicle.secondaryMaxAmmo > 0
                    ? `${hud.vehicle.secondaryAmmo}/${hud.vehicle.secondaryMaxAmmo}`
                    : `${hud.vehicle.ammo}/${hud.vehicle.maxAmmo}`}
                </span>
                <span className="text-white font-bold tabular-nums">{hud.vehicle.speedKmh}km/h</span>
              </div>
            ) : isMounted ? (
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="text-amber-300 font-semibold truncate max-w-[85px]">{hud.mountedMg.name}</span>
                <span className={`font-bold tabular-nums ${hud.mountedMg.ammo <= 0 ? 'text-red-400' : 'text-white'}`}>
                  {hud.mountedMg.ammo}/{hud.mountedMg.maxAmmo}
                </span>
                <span className="text-slate-400 text-[10px]">B:{hud.carriedBelts + hud.mountedMg.nearbyBeltsCount}</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1 font-mono tabular-nums">
                <span className={`text-sm font-bold ${lowAmmo ? 'text-amber-400' : 'text-white'}`}>
                  {activeState.mag}
                </span>
                <span className="text-[10px] text-slate-400">/{activeState.reserve}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Bottom Left: Health & Stamina */}
          <div className="absolute bottom-5 left-5 w-60 bg-[#0b0f17]/90 border border-slate-700/75 rounded-lg p-3.5 shadow-lg">
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-400">Armor &amp; Health</span>
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

          {/* Desktop Bottom Right: Air Strike, Grenades, Active Weapon / Vehicle / Turret & 1-3 Slots */}
          <div className="absolute bottom-5 right-5 flex flex-col items-end gap-2">
            {hud.isReloading && !isMounted && (!inVehicle || inPassengerPort) && (
              <div className="w-64 bg-[#0b0f17]/92 border border-amber-500/45 rounded px-3 py-2">
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

            {/* Air Strike, Trench, Heavy Belts & Frag Utility Strip */}
            <div className="flex items-center gap-2">
              {!isMounted && !inVehicle && (
                <div className="px-3 py-1 rounded bg-[#0b0f17]/88 border border-slate-700/75 text-xs flex items-center gap-1.5">
                  <span className="font-mono font-semibold text-amber-400">[T]</span>
                  <span className="text-slate-300">Trench</span>
                  <span className="font-mono text-slate-400 tabular-nums">
                    {hud.trench.count}/{hud.trench.maxCount}
                  </span>
                </div>
              )}

              <div className="px-3 py-1 rounded bg-[#0b0f17]/88 border border-slate-700/75 text-xs flex items-center gap-1.5">
                <span className="text-slate-300">Belts</span>
                <span className={`font-mono font-bold tabular-nums ${hud.carriedBelts === 0 ? 'text-red-400' : 'text-amber-300'}`}>
                  {hud.carriedBelts}/{hud.maxCarriedBelts}
                </span>
              </div>

              <div
                className={`px-3 py-1 rounded border text-xs flex items-center gap-2 ${
                  hud.killStreak.airstrikeCharges > 0
                    ? 'bg-red-500/20 border-red-400/70 text-red-200'
                    : 'bg-[#0b0f17]/88 border-slate-800 text-slate-500'
                }`}
              >
                <Plane className="w-3.5 h-3.5" />
                <span className="font-mono font-semibold text-amber-400">[X]</span>
                <span>Air Strike</span>
                <span className="font-mono font-bold tabular-nums">
                  ×{hud.killStreak.airstrikeCharges}
                </span>
              </div>

              {!isMounted && (!inVehicle || inPassengerPort) && (
                <div className="px-3 py-1 rounded bg-[#0b0f17]/88 border border-slate-700/75 text-xs flex items-center gap-2">
                  <span className="font-mono font-semibold text-amber-400">[G]</span>
                  <span className="text-slate-300">M67 Frag</span>
                  <span className="font-mono font-bold text-white tabular-nums">
                    ×{hud.grenades}
                  </span>
                </div>
              )}
            </div>

            {inVehicle ? (
              <div className="w-88 bg-[#0b0f17]/92 border border-sky-400/60 rounded-lg p-3.5 shadow-lg">
                <div className="flex items-baseline justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="font-display text-base font-bold text-sky-300 leading-tight flex items-center gap-2">
                      <span>{hud.vehicle.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 border border-sky-400/40 text-sky-200">
                        {hud.vehicle.seatRole}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {hud.vehicle.type === 'attack_heli'
                        ? 'WASD Cyclic · Space Climb · Ctrl/Q Descend · [C] Seat · [E] Exit'
                        : hud.vehicle.type === 'heavy_tank'
                        ? '120mm Cannon + Coax .50 · [C / 1-3] Seat · [E] Exit'
                        : hud.vehicle.type === 'tank'
                        ? '105mm Cannon + Coax .50 · [C / 1-3] Seat · [E] Exit'
                        : hud.vehicle.type === 'apc'
                        ? '20mm Bushmaster RWS · [C / 1-4] Seat · [E] Exit'
                        : '.50 Cal Pintle MG · [C / 1-3] Seat · [E] Exit'}
                    </div>
                  </div>
                  <div className="text-right font-mono tabular-nums shrink-0">
                    <span className="text-xl font-bold text-white">{hud.vehicle.speedKmh}</span>
                    <span className="text-[10px] text-slate-400 ml-1">km/h</span>
                  </div>
                </div>

                {hud.vehicle.type === 'attack_heli' && (
                  <div className="grid grid-cols-2 gap-1.5 mb-2 text-[11px] font-mono">
                    <div className="px-2 py-1 rounded bg-[#080b12]/80 border border-emerald-500/35 flex items-center justify-between">
                      <span className="text-slate-400">ALTITUDE</span>
                      <span className="text-emerald-300 font-bold tabular-nums">{hud.vehicle.altitude}m</span>
                    </div>
                    <div className="px-2 py-1 rounded bg-[#080b12]/80 border border-sky-500/35 flex items-center justify-between">
                      <span className="text-slate-400">ROTOR RPM</span>
                      <span className="text-sky-300 font-bold tabular-nums">{hud.vehicle.rotorPct}%</span>
                    </div>
                  </div>
                )}

                {/* Crew Seats Manifest */}
                {hud.vehicle.crew.length > 1 && (
                  <div className="grid grid-cols-2 gap-1 mb-2.5">
                    {hud.vehicle.crew.map((slot) => (
                      <div
                        key={slot.seat}
                        className={`px-2 py-1 rounded border text-[10px] flex items-center justify-between gap-1 ${
                          slot.isPlayer
                            ? 'bg-sky-500/20 border-sky-400 text-white font-semibold'
                            : slot.occupantName
                            ? 'bg-slate-800/80 border-slate-600 text-slate-200'
                            : 'bg-[#080b12]/80 border-slate-800 text-slate-500'
                        }`}
                      >
                        <span className="font-mono">
                          [{slot.seat + 1}] {slot.role}
                        </span>
                        <span className="truncate max-w-[74px]">
                          {slot.occupantName || 'Open'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Hull Armor</span>
                  <span className="font-mono text-slate-200 tabular-nums">
                    {Math.ceil(hud.vehicle.health)} / {hud.vehicle.maxHealth}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-sm overflow-hidden mb-2">
                  <div
                    className={`h-full transition-all duration-75 ${
                      hud.vehicle.health / hud.vehicle.maxHealth < 0.3
                        ? 'bg-red-500'
                        : 'bg-sky-400'
                    }`}
                    style={{
                      width: `${Math.max(0, Math.min(100, (hud.vehicle.health / hud.vehicle.maxHealth) * 100))}%`,
                    }}
                  />
                </div>

                {/* Finite Vehicle & Gunship Ordnance Reserves */}
                <div className="grid grid-cols-1 gap-1 mb-2 text-[11px]">
                  <div className="flex items-center justify-between px-2 py-1 rounded bg-[#080b12]/85 border border-slate-800">
                    <span className="text-slate-300 truncate">{hud.vehicle.ammoLabel || 'Primary Weapon'}</span>
                    <span className={`font-mono font-bold tabular-nums ${hud.vehicle.ammo <= 0 ? 'text-red-400' : 'text-amber-300'}`}>
                      {hud.vehicle.ammo} / {hud.vehicle.maxAmmo}
                    </span>
                  </div>
                  {hud.vehicle.secondaryMaxAmmo > 0 && (
                    <div className="flex items-center justify-between px-2 py-1 rounded bg-[#080b12]/85 border border-slate-800">
                      <span className="text-slate-300 truncate">{hud.vehicle.secondaryLabel}</span>
                      <span className={`font-mono font-bold tabular-nums ${hud.vehicle.secondaryAmmo <= 0 ? 'text-red-400' : 'text-cyan-300'}`}>
                        {hud.vehicle.secondaryAmmo} / {hud.vehicle.secondaryMaxAmmo}
                      </span>
                    </div>
                  )}
                </div>

                {inPassengerPort ? (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                    <span className="text-cyan-300 font-medium truncate">
                      Firing Port · {activeSpec.shortName}
                    </span>
                    <span className="font-mono font-bold text-white tabular-nums">
                      {activeState.mag} / {activeState.reserve}
                    </span>
                  </div>
                ) : hud.vehicle.type === 'tank' || hud.vehicle.type === 'heavy_tank' ? (
                  <>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className={hud.vehicle.weaponCooldownPct >= 1 ? 'text-emerald-400 font-semibold' : 'text-amber-300'}>
                        {hud.vehicle.seatIndex === 1
                          ? hud.vehicle.secondaryAmmo <= 0
                            ? 'Coax Empty — Mini Hangar'
                            : 'Cupola .50 Coax Ready'
                          : hud.vehicle.ammo <= 0
                          ? 'Shells Empty — Mini Hangar'
                          : hud.vehicle.weaponCooldownPct >= 1
                          ? 'Main Cannon Ready'
                          : 'Autoloader Cycling'}
                      </span>
                      <span className="font-mono text-slate-300 tabular-nums">
                        {hud.vehicle.seatIndex === 1 ? 'READY' : `${Math.round(hud.vehicle.weaponCooldownPct * 100)}%`}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-sm overflow-hidden">
                      <div
                        className={`h-full ${hud.vehicle.seatIndex === 1 || hud.vehicle.weaponCooldownPct >= 1 ? 'bg-emerald-400' : 'bg-amber-400'}`}
                        style={{ width: `${hud.vehicle.seatIndex === 1 ? 100 : Math.round(hud.vehicle.weaponCooldownPct * 100)}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-[11px] text-slate-400 font-mono">
                    {hud.vehicle.type === 'attack_heli'
                      ? 'LMB Fire · RMB TADS Zoom · Mini Hangar Rearm'
                      : 'LMB Fire · RMB Zoom · Ram Walls/Mounts · Mini Hangar Rearm'}
                  </div>
                )}
              </div>
            ) : isMounted ? (
              <div className="w-84 bg-[#0b0f17]/92 border border-amber-500/60 rounded-lg p-3.5 shadow-lg">
                <div className="flex items-baseline justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="font-display text-base font-bold text-amber-300 leading-tight">
                      {hud.mountedMg.name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {hud.mountedMg.kind === 'field_gun'
                        ? '105mm High-Explosive · [R] Reload · [E] Exit'
                        : hud.mountedMg.kind === 'tow'
                        ? 'SACLOS Laser Guided · [R] Reload · [E] Exit'
                        : hud.mountedMg.kind === 'autocannon'
                        ? 'Twin 20mm HE-Frag · [R] Reload · [E] Exit'
                        : hud.mountedMg.kind === 'mg30'
                        ? 'Belt-Fed .30-06 Springfield · [R] Reload · [E] Exit'
                        : 'Belt-Fed .50 BMG · [R] Reload · [E] Exit'}
                    </div>
                  </div>
                  <div className="text-right font-mono tabular-nums shrink-0">
                    <span className={`text-2xl font-bold ${hud.mountedMg.ammo <= Math.ceil(hud.mountedMg.maxAmmo * 0.2) ? 'text-red-400' : 'text-white'}`}>
                      {hud.mountedMg.ammo}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">/ {hud.mountedMg.maxAmmo}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] mb-2 px-2 py-1 rounded bg-[#080b12]/80 border border-slate-800">
                  <span className="text-slate-300">
                    Ground Belts: <span className="font-mono font-bold text-amber-300">{hud.mountedMg.nearbyBeltsCount}</span>
                  </span>
                  <span className="text-slate-300">
                    Carried: <span className={`font-mono font-bold ${hud.carriedBelts === 0 ? 'text-red-400' : 'text-cyan-300'}`}>{hud.carriedBelts}/{hud.maxCarriedBelts}</span>
                  </span>
                </div>
                {hud.mountedMg.isReloading && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-amber-300 font-semibold">Feeding New Belt / Rack...</span>
                      <span className="font-mono text-slate-300 tabular-nums">
                        {Math.round(hud.mountedMg.reloadProgress * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-sm overflow-hidden">
                      <div
                        className="h-full bg-amber-400"
                        style={{ width: `${Math.min(100, Math.round(hud.mountedMg.reloadProgress * 100))}%` }}
                      />
                    </div>
                  </div>
                )}
                {(hud.mountedMg.kind === 'field_gun' || hud.mountedMg.kind === 'tow') && !hud.mountedMg.isReloading && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className={hud.mountedMg.cooldownPct >= 1 ? 'text-emerald-400 font-semibold' : 'text-amber-300'}>
                        {hud.mountedMg.cooldownPct >= 1 ? 'Breech / Tube Ready' : 'Cycling Breech...'}
                      </span>
                      <span className="font-mono text-slate-300 tabular-nums">
                        {Math.round(hud.mountedMg.cooldownPct * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-sm overflow-hidden">
                      <div
                        className={`h-full ${hud.mountedMg.cooldownPct >= 1 ? 'bg-emerald-400' : 'bg-amber-400'}`}
                        style={{ width: `${Math.round(hud.mountedMg.cooldownPct * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className={hud.mountedMg.overheated ? 'text-red-400 font-semibold' : 'text-slate-400'}>
                    {hud.mountedMg.overheated ? 'THERMAL OVERHEAT — COOLING' : 'Barrel Thermal Load'}
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
              <div className="w-76 bg-[#0b0f17]/90 border border-slate-700/75 rounded-lg p-3.5 shadow-lg">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-display text-base font-bold text-white leading-tight truncate">
                      {activeSpec.name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate flex items-center gap-1.5">
                      <Crosshair className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>
                        {activeSpec.fireMode} · {activeSpec.caliber}
                      </span>
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

            {/* Carried 3-Slot Strip */}
            {!isMounted && (!inVehicle || inPassengerPort) && (
              <div className="flex items-center gap-1.5 justify-end pointer-events-auto">
                {hud.loadout.map((wid, idx) => {
                  const spec = WEAPONS[wid] || WEAPONS.m4a1;
                  const st = hud.weaponStates[wid] || { id: wid, mag: spec.magSize, reserve: spec.reserveMax };
                  const selected = idx === hud.activeSlot;
                  return (
                    <button
                      key={`${idx}-${wid}`}
                      type="button"
                      onClick={() => onSelectSlot(idx as 0 | 1 | 2)}
                      className={`px-2.5 py-1 rounded border text-[11px] transition-colors whitespace-nowrap cursor-pointer ${
                        selected
                          ? 'bg-amber-500/20 border-amber-400 text-white'
                          : 'bg-[#0b0f17]/88 border-slate-800 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <span className="font-mono font-semibold text-amber-400 mr-1.5">{idx + 1}</span>
                      <span className="font-medium">{spec.shortName}</span>
                      <span className="font-mono text-[10px] ml-1.5 opacity-75 tabular-nums">
                        {st.mag}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Tab / Button Scoreboard Overlay */}
      {showScoreboard && (
        <div
          className="absolute inset-0 z-30 bg-[#070a10]/72 flex items-center justify-center p-3 sm:p-6 pointer-events-auto"
          onClick={onToggleScoreboard}
        >
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <ScoreboardModal
              entries={hud.scoreboard}
              blueScore={hud.blueScore}
              redScore={hud.redScore}
              scoreLimit={hud.scoreLimit}
              onClose={isTouch ? onToggleScoreboard : undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
};
