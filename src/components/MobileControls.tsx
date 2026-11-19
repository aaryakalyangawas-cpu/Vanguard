import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  Crosshair,
  Flame,
  LogOut,
  Package,
  Plane,
  RotateCw,
  ZoomIn,
} from 'lucide-react';
import { HudSnapshot } from '../game/types';
import { WEAPONS } from '../game/weapons';

interface MobileControlsProps {
  hud: HudSnapshot;
  onMove: (x: number, y: number, sprint: boolean) => void;
  onLook: (dx: number, dy: number) => void;
  onFire: (active: boolean) => void;
  onToggleAds: () => void;
  onCycleZoom: () => void;
  onJump: () => void;
  onBrake: (active: boolean) => void;
  onReload: () => void;
  onInteract: () => void;
  onGrenadeStart: () => void;
  onGrenadeRelease: () => void;
  onAirstrike: () => void;
  onSwitchSeat: () => void;
  onDigTrench: () => void;
  onHeliClimb: (ascend: boolean, descend: boolean) => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  hud,
  onMove,
  onLook,
  onFire,
  onToggleAds,
  onCycleZoom,
  onJump,
  onBrake,
  onReload,
  onInteract,
  onGrenadeStart,
  onGrenadeRelease,
  onAirstrike,
  onSwitchSeat,
  onDigTrench,
  onHeliClimb,
}) => {
  const joyBaseRef = useRef<HTMLDivElement | null>(null);
  const joyTouchIdRef = useRef<number | null>(null);
  const lookTouchIdRef = useRef<number | null>(null);
  const lookLastRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const fireTouchIdRef = useRef<number | null>(null);
  const fireLastRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [joySprinting, setJoySprinting] = useState(false);
  const [firingActive, setFiringActive] = useState(false);

  const maxRadius = 42;

  useEffect(() => {
    return () => {
      onMove(0, 0, false);
      onFire(false);
      onBrake(false);
      onHeliClimb(false, false);
    };
  }, [onMove, onFire, onBrake, onHeliClimb]);

  const findTouch = (touches: React.TouchList, id: number | null): React.Touch | null => {
    if (id === null) return null;
    for (let i = 0; i < touches.length; i++) {
      if (touches[i].identifier === id) return touches[i];
    }
    return null;
  };

  // Virtual Joystick handlers
  const updateJoystickFromTouch = (touch: React.Touch) => {
    const el = joyBaseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = touch.clientX - cx;
    let dy = touch.clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxRadius) {
      const scale = maxRadius / dist;
      dx *= scale;
      dy *= scale;
    }
    setKnobOffset({ x: dx, y: dy });

    if (dist < 6) {
      setJoySprinting(false);
      onMove(0, 0, false);
      return;
    }

    const nx = dx / maxRadius;
    const ny = -dy / maxRadius; // up on screen = +1 forward
    const sprinting = dist >= maxRadius * 0.8 && ny > 0.38;
    setJoySprinting(sprinting);
    onMove(nx, ny, sprinting);
  };

  const handleJoyStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (joyTouchIdRef.current !== null) return;
    const t = e.changedTouches[0];
    if (!t) return;
    joyTouchIdRef.current = t.identifier;
    updateJoystickFromTouch(t);
  };

  const handleJoyMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    const t = findTouch(e.touches, joyTouchIdRef.current);
    if (t) updateJoystickFromTouch(t);
  };

  const handleJoyEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    const ended = findTouch(e.changedTouches, joyTouchIdRef.current);
    if (ended) {
      joyTouchIdRef.current = null;
      setKnobOffset({ x: 0, y: 0 });
      setJoySprinting(false);
      onMove(0, 0, false);
    }
  };

  // Full-screen Look Surface (behind buttons & joystick)
  const handleLookStart = (e: React.TouchEvent) => {
    if (lookTouchIdRef.current !== null) return;
    const t = e.changedTouches[0];
    if (!t) return;
    lookTouchIdRef.current = t.identifier;
    lookLastRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleLookMove = (e: React.TouchEvent) => {
    const t = findTouch(e.touches, lookTouchIdRef.current);
    if (!t) return;
    const dx = t.clientX - lookLastRef.current.x;
    const dy = t.clientY - lookLastRef.current.y;
    lookLastRef.current = { x: t.clientX, y: t.clientY };
    onLook(dx, dy);
  };

  const handleLookEnd = (e: React.TouchEvent) => {
    const ended = findTouch(e.changedTouches, lookTouchIdRef.current);
    if (ended) {
      lookTouchIdRef.current = null;
    }
  };

  // Primary Fire Button (also allows drag-to-aim while firing)
  const handleFireStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (fireTouchIdRef.current !== null) return;
    const t = e.changedTouches[0];
    if (!t) return;
    fireTouchIdRef.current = t.identifier;
    fireLastRef.current = { x: t.clientX, y: t.clientY };
    setFiringActive(true);
    onFire(true);
  };

  const handleFireMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    const t = findTouch(e.touches, fireTouchIdRef.current);
    if (!t) return;
    const dx = t.clientX - fireLastRef.current.x;
    const dy = t.clientY - fireLastRef.current.y;
    fireLastRef.current = { x: t.clientX, y: t.clientY };
    onLook(dx, dy);
  };

  const handleFireEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    const ended = findTouch(e.changedTouches, fireTouchIdRef.current);
    if (ended) {
      fireTouchIdRef.current = null;
      setFiringActive(false);
      onFire(false);
    }
  };

  const inVehicle = hud.vehicle.active;
  const inPassengerPort = inVehicle && hud.vehicle.seatIndex >= 2;
  const isMounted = hud.mountedMg.active;
  const activeSpec = WEAPONS[hud.activeWeapon] || WEAPONS.m4a1;
  const canCycleZoom =
    (!inVehicle || inPassengerPort) &&
    !isMounted &&
    hud.isAds &&
    (activeSpec.optic === 'sniper' ||
      activeSpec.optic === 'acog' ||
      activeSpec.optic === 'thermal_lock');

  const interactLabel = hud.arsenal.nearPrompt
    ? `Open ${hud.arsenal.arsenalName || 'Arsenal'}`
    : inVehicle
    ? `Exit ${hud.vehicle.name}`
    : isMounted
    ? `Leave ${hud.mountedMg.name}`
    : hud.vehicle.nearPromptName
    ? `Enter ${hud.vehicle.nearPromptName} (Seat ${(hud.vehicle.nearFreeSeatIndex ?? 0) + 1})`
    : hud.hangar.nearPrompt
    ? `Resupply at ${hud.hangar.hangarName || 'Mini Hangar'}`
    : hud.mountedMg.nearPromptName
    ? `Operate ${hud.mountedMg.nearPromptName}`
    : hud.mountedMg.nearDestroyedName
    ? `Repair ${hud.mountedMg.nearDestroyedName}`
    : null;

  const isHeliPilot = inVehicle && hud.vehicle.type === 'attack_heli' && hud.vehicle.seatIndex === 0;

  return (
    <div className="fixed inset-0 z-[15] pointer-events-none select-none touch-none">
      {/* Transparent Multi-Touch Aim / Camera Look Layer */}
      <div
        className="absolute inset-0 pointer-events-auto touch-none"
        onTouchStart={handleLookStart}
        onTouchMove={handleLookMove}
        onTouchEnd={handleLookEnd}
        onTouchCancel={handleLookEnd}
      />

      {/* Left Thumb Virtual Analog Joystick */}
      <div
        ref={joyBaseRef}
        onTouchStart={handleJoyStart}
        onTouchMove={handleJoyMove}
        onTouchEnd={handleJoyEnd}
        onTouchCancel={handleJoyEnd}
        className={`absolute bottom-4 left-4 w-28 h-28 sm:w-32 sm:h-32 rounded-full pointer-events-auto touch-none flex items-center justify-center border-2 transition-colors ${
          joySprinting
            ? 'bg-amber-500/15 border-amber-400/80'
            : 'bg-[#0b0f17]/55 border-slate-500/55'
        }`}
      >
        <div className="w-16 h-16 rounded-full border border-slate-600/40 pointer-events-none" />
        <div
          className={`absolute w-11 h-11 rounded-full border-2 shadow-lg pointer-events-none ${
            joySprinting
              ? 'bg-amber-400/85 border-white'
              : 'bg-slate-200/75 border-white/80'
          }`}
          style={{
            transform: `translate3d(${knobOffset.x}px, ${knobOffset.y}px, 0)`,
          }}
        />
        <span className="absolute -top-5 text-[10px] font-mono font-semibold text-slate-300/85 pointer-events-none">
          {inVehicle
            ? isHeliPilot
              ? 'CYCLIC'
              : hud.vehicle.seatIndex === 0
              ? 'DRIVE'
              : hud.vehicle.seatRole.toUpperCase()
            : joySprinting
            ? 'SPRINT'
            : 'MOVE'}
        </span>
      </div>

      {/* Contextual Interact / Arsenal / Vehicle / Turret CTA */}
      {interactLabel && (
        <button
          type="button"
          onTouchStart={(e) => {
            e.stopPropagation();
            onInteract();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onInteract();
          }}
          className={`absolute bottom-[82px] sm:bottom-[92px] left-1/2 -translate-x-1/2 pointer-events-auto touch-none min-h-[44px] px-4 py-2 rounded-lg border text-xs font-bold shadow-xl flex items-center gap-2 active:scale-95 transition-transform ${
            hud.arsenal.nearPrompt
              ? 'bg-cyan-600/90 border-cyan-300 text-white'
              : inVehicle || isMounted
              ? 'bg-slate-800/95 border-slate-400 text-white'
              : 'bg-amber-500/95 border-amber-300 text-slate-950'
          }`}
        >
          {hud.arsenal.nearPrompt ? (
            <Package className="w-4 h-4 shrink-0" />
          ) : inVehicle || isMounted ? (
            <LogOut className="w-4 h-4 shrink-0" />
          ) : (
            <Crosshair className="w-4 h-4 shrink-0" />
          )}
          <span className="whitespace-nowrap">{interactLabel}</span>
        </button>
      )}

      {/* Right Thumb Tactical Action Cluster */}
      <div className="absolute bottom-4 right-4 pointer-events-auto touch-none flex flex-col items-end gap-2">
        {/* Top Utility Row: Zoom, Air Strike, Frag, Reload */}
        <div className="flex items-center gap-2">
          {canCycleZoom && (
            <button
              type="button"
              onTouchStart={(e) => {
                e.stopPropagation();
                onCycleZoom();
              }}
              className="min-w-[44px] min-h-[44px] px-2.5 rounded-full bg-[#0b0f17]/85 border border-cyan-400/75 text-cyan-300 text-[11px] font-mono font-bold flex items-center justify-center gap-1 active:scale-95"
              aria-label="Toggle Scope Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              {hud.scopeZoom.toFixed(0)}×
            </button>
          )}

          {hud.killStreak.airstrikeCharges > 0 && (
            <button
              type="button"
              onTouchStart={(e) => {
                e.stopPropagation();
                onAirstrike();
              }}
              className="min-w-[44px] min-h-[44px] px-2.5 rounded-full bg-red-600/85 border border-red-300 text-white text-[11px] font-mono font-bold flex items-center justify-center gap-1 shadow-lg active:scale-95"
              aria-label="Call Air Strike"
            >
              <Plane className="w-4 h-4" />
              ×{hud.killStreak.airstrikeCharges}
            </button>
          )}

          {inVehicle && hud.vehicle.maxSeats > 1 && (
            <button
              type="button"
              onTouchStart={(e) => {
                e.stopPropagation();
                onSwitchSeat();
              }}
              className="min-w-[52px] min-h-[44px] px-2.5 rounded-full bg-sky-600/85 border border-sky-300 text-white text-[10px] font-mono font-bold flex items-center justify-center active:scale-95"
              aria-label="Switch Vehicle Seat"
            >
              SEAT {hud.vehicle.seatIndex + 1}/{hud.vehicle.maxSeats}
            </button>
          )}

          {!inVehicle && !isMounted && (
            <button
              type="button"
              onTouchStart={(e) => {
                e.stopPropagation();
                onDigTrench();
              }}
              className={`min-w-[54px] min-h-[44px] px-2.5 rounded-full border text-[10px] font-mono font-bold flex items-center justify-center active:scale-95 ${
                hud.trench.isDigging
                  ? 'bg-amber-500 border-white text-slate-950'
                  : 'bg-[#0b0f17]/85 border-amber-500/65 text-amber-300'
              }`}
              aria-label="Dig Fighting Trench"
            >
              TRENCH
            </button>
          )}

          {isMounted && (
            <button
              type="button"
              onTouchStart={(e) => {
                e.stopPropagation();
                onReload();
              }}
              className="min-w-[46px] min-h-[46px] rounded-full bg-[#0b0f17]/85 border border-amber-400/75 text-amber-300 flex items-center justify-center active:scale-95"
              aria-label="Reload Belt"
            >
              <RotateCw className={`w-4 h-4 ${hud.mountedMg.isReloading ? 'animate-spin text-white' : ''}`} />
            </button>
          )}

          {(!inVehicle || inPassengerPort) && !isMounted && (
            <>
              <button
                type="button"
                onTouchStart={(e) => {
                  e.stopPropagation();
                  onGrenadeStart();
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  onGrenadeRelease();
                }}
                onTouchCancel={(e) => {
                  e.stopPropagation();
                  onGrenadeRelease();
                }}
                disabled={hud.grenades <= 0}
                className={`min-w-[46px] min-h-[46px] rounded-full border text-[11px] font-mono font-bold flex flex-col items-center justify-center active:scale-95 ${
                  hud.isCookingGrenade
                    ? 'bg-red-600 border-white text-white'
                    : hud.grenades > 0
                    ? 'bg-[#0b0f17]/80 border-slate-500/75 text-amber-300'
                    : 'bg-[#0b0f17]/50 border-slate-800 text-slate-600'
                }`}
                aria-label="Frag Grenade"
              >
                <Flame className="w-3.5 h-3.5" />
                <span className="text-[10px] leading-none">×{hud.grenades}</span>
              </button>

              <button
                type="button"
                onTouchStart={(e) => {
                  e.stopPropagation();
                  onReload();
                }}
                className="min-w-[46px] min-h-[46px] rounded-full bg-[#0b0f17]/80 border border-slate-500/75 text-slate-100 flex items-center justify-center active:scale-95"
                aria-label="Reload Weapon"
              >
                <RotateCw className={`w-4 h-4 ${hud.isReloading ? 'animate-spin text-amber-400' : ''}`} />
              </button>
            </>
          )}
        </div>

        {/* Bottom Primary Row: Jump/Brake + ADS + Fire */}
        <div className="flex items-end gap-2.5">
          <div className="flex flex-col gap-2">
            {isHeliPilot ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    onHeliClimb(true, false);
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    onHeliClimb(false, false);
                  }}
                  onTouchCancel={(e) => {
                    e.stopPropagation();
                    onHeliClimb(false, false);
                  }}
                  className="min-w-[46px] min-h-[46px] px-2 rounded-full bg-[#0b0f17]/85 border border-emerald-400/75 text-emerald-300 text-[10px] font-mono font-bold flex items-center justify-center active:scale-95"
                  aria-label="Helicopter Climb"
                >
                  CLIMB
                </button>
                <button
                  type="button"
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    onHeliClimb(false, true);
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    onHeliClimb(false, false);
                  }}
                  onTouchCancel={(e) => {
                    e.stopPropagation();
                    onHeliClimb(false, false);
                  }}
                  className="min-w-[46px] min-h-[46px] px-2 rounded-full bg-[#0b0f17]/85 border border-amber-400/75 text-amber-300 text-[10px] font-mono font-bold flex items-center justify-center active:scale-95"
                  aria-label="Helicopter Descend"
                >
                  DESC
                </button>
              </div>
            ) : inVehicle ? (
              <button
                type="button"
                onTouchStart={(e) => {
                  e.stopPropagation();
                  onBrake(true);
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  onBrake(false);
                }}
                onTouchCancel={(e) => {
                  e.stopPropagation();
                  onBrake(false);
                }}
                className="min-w-[48px] min-h-[48px] px-2 rounded-full bg-[#0b0f17]/80 border border-amber-400/70 text-amber-300 text-[10px] font-mono font-bold flex items-center justify-center active:scale-95"
                aria-label="Handbrake"
              >
                BRAKE
              </button>
            ) : (
              <button
                type="button"
                onTouchStart={(e) => {
                  e.stopPropagation();
                  onJump();
                }}
                className="min-w-[48px] min-h-[48px] rounded-full bg-[#0b0f17]/80 border border-slate-500/75 text-slate-100 flex items-center justify-center active:scale-95"
                aria-label={isMounted ? 'Dismount' : 'Jump'}
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            )}

            <button
              type="button"
              onTouchStart={(e) => {
                e.stopPropagation();
                onToggleAds();
              }}
              className={`min-w-[50px] min-h-[50px] rounded-full border-2 flex items-center justify-center active:scale-95 transition-colors ${
                hud.isAds
                  ? 'bg-cyan-500/85 border-white text-slate-950'
                  : 'bg-[#0b0f17]/80 border-slate-500/75 text-cyan-300'
              }`}
              aria-label="Aim Down Sights"
            >
              <Crosshair className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Fire Button (Touch & Drag to Aim while Shooting) */}
          <button
            type="button"
            onTouchStart={handleFireStart}
            onTouchMove={handleFireMove}
            onTouchEnd={handleFireEnd}
            onTouchCancel={handleFireEnd}
            className={`w-[74px] h-[74px] rounded-full border-2 font-display text-xs font-bold tracking-wider flex flex-col items-center justify-center shadow-xl transition-transform ${
              firingActive
                ? 'bg-red-500/90 border-white text-white scale-95'
                : 'bg-amber-500/80 border-amber-200 text-slate-950'
            }`}
            aria-label="Fire Weapon"
          >
            <Crosshair className="w-6 h-6 mb-0.5" />
            <span>FIRE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
