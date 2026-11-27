/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AccountModal } from './components/AccountModal';
import { AndroidInstallModal, OfflineIndicator } from './components/AndroidInstallModal';
import { ArsenalModal } from './components/ArsenalModal';
import { GameMenus } from './components/GameMenus';
import { MobileControls } from './components/MobileControls';
import { TacticalHud } from './components/TacticalHud';
import { FpsEngine } from './game/FpsEngine';
import { MAPS } from './game/arena';
import { HudSnapshot, MatchConfig, PlayerAccount, WeaponId } from './game/types';
import { WEAPONS } from './game/weapons';
import { useOnlineStatus, usePWAInstall } from './hooks/usePWAInstall';

const CONFIG_STORAGE_KEY = 'vanguard_arena_config_v3';
const ACCOUNT_STORAGE_KEY = 'vanguard_arena_account_v1';

const DEFAULT_CONFIG: MatchConfig = {
  mapId: 'yard',
  matchMode: 'tdm',
  teamSize: 10,
  scoreLimit: 50,
  difficulty: 'tactical',
  startingWeapon: 'm4a1',
  startingSecondary: 'deagle50',
  startingHeavy: 'fgm148_javelin',
  sensitivity: 1.0,
  muted: false,
  username: 'Vanguard-1',
  playerTeam: 'blue',
  mode: 'solo',
  roomId: 'alpha-1',
  botFill: true,
  touchControls: 'auto',
};

function loadInitialConfig(): MatchConfig {
  try {
    const raw =
      localStorage.getItem(CONFIG_STORAGE_KEY) ||
      localStorage.getItem('vanguard_arena_config_v2');
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<MatchConfig>;
    const merged: MatchConfig = { ...DEFAULT_CONFIG, ...parsed };
    if (!WEAPONS[merged.startingWeapon]) merged.startingWeapon = 'm4a1';
    if (!WEAPONS[merged.startingSecondary]) merged.startingSecondary = 'deagle50';
    if (!WEAPONS[merged.startingHeavy]) merged.startingHeavy = 'fgm148_javelin';
    if (!MAPS[merged.mapId]) merged.mapId = 'yard';
    if (
      merged.matchMode !== 'tdm' &&
      merged.matchMode !== 'ffa' &&
      merged.matchMode !== 'gun_game' &&
      merged.matchMode !== 'zombies'
    ) {
      merged.matchMode = 'tdm';
    }
    if (
      merged.teamSize !== 4 &&
      merged.teamSize !== 5 &&
      merged.teamSize !== 6 &&
      merged.teamSize !== 10
    ) {
      merged.teamSize = 10;
    }
    if (merged.scoreLimit !== 25 && merged.scoreLimit !== 50 && merged.scoreLimit !== 75) {
      merged.scoreLimit = 50;
    }
    if (merged.playerTeam !== 'blue' && merged.playerTeam !== 'red') {
      merged.playerTeam = 'blue';
    }
    if (merged.mode !== 'solo' && merged.mode !== 'multiplayer') {
      merged.mode = 'solo';
    }
    if (!merged.roomId || typeof merged.roomId !== 'string') {
      merged.roomId = 'alpha-1';
    }
    if (!merged.username || typeof merged.username !== 'string') {
      merged.username = 'Vanguard-1';
    }
    if (merged.touchControls !== 'auto' && merged.touchControls !== 'on' && merged.touchControls !== 'off') {
      merged.touchControls = 'auto';
    }
    return merged;
  } catch {
    return DEFAULT_CONFIG;
  }
}

function loadInitialAccount(): PlayerAccount | null {
  try {
    const raw = localStorage.getItem(ACCOUNT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PlayerAccount;
  } catch {
    return null;
  }
}

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<FpsEngine | null>(null);

  const [config, setConfig] = useState<MatchConfig>(loadInitialConfig);
  const configRef = useRef<MatchConfig>(config);
  configRef.current = config;

  const [account, setAccount] = useState<PlayerAccount | null>(loadInitialAccount);
  const [showAccountModal, setShowAccountModal] = useState<boolean>(() => !loadInitialAccount());
  const [showAndroidModal, setShowAndroidModal] = useState(false);

  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const isOnline = useOnlineStatus();

  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [inspecting3D, setInspecting3D] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const statsSubmittedForMatchRef = useRef(false);

  // Mount Three.js WebGL Engine once in isolated ref container
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    let engine: FpsEngine | null = null;
    try {
      engine = new FpsEngine(container, configRef.current, (snapshot) => {
        setHud(snapshot);
      });
      engineRef.current = engine;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to initialize 3D WebGL renderer.';
      setInitError(msg);
    }

    return () => {
      engine?.dispose();
      engineRef.current = null;
    };
  }, []);

  // Track Tab key for in-match scoreboard overlay
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        setShowScoreboard(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        setShowScoreboard(false);
      }
    };
    const onBlur = () => setShowScoreboard(false);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  const handleUpdateConfig = useCallback((next: Partial<MatchConfig>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...next };
      try {
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage quota errors
      }
      engineRef.current?.updateConfig(updated);
      if (next.startingWeapon) {
        engineRef.current?.selectWeaponFromUi(next.startingWeapon);
      }
      return updated;
    });
  }, []);

  const handleAccountComplete = useCallback(
    (saved: PlayerAccount) => {
      setAccount(saved);
      try {
        localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(saved));
      } catch {
        // Ignore storage errors
      }
      setShowAccountModal(false);
      handleUpdateConfig({ username: saved.username });
    },
    [handleUpdateConfig]
  );

  // Sync career stats to server when a match concludes for registered email accounts
  useEffect(() => {
    if (!hud) return;
    if (hud.phase === 'playing') {
      statsSubmittedForMatchRef.current = false;
      return;
    }
    if (hud.phase === 'ended' && !statsSubmittedForMatchRef.current && account && !account.isGuest && account.email) {
      statsSubmittedForMatchRef.current = true;
      const selfEntry = hud.scoreboard.find((e) => e.isPlayer);
      if (!selfEntry) return;
      void fetch('/api/auth/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: account.email,
          killsDelta: selfEntry.kills,
          deathsDelta: selfEntry.deaths,
        }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.account) {
            setAccount(data.account as PlayerAccount);
            try {
              localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(data.account));
            } catch {
              // ignore
            }
          }
        })
        .catch(() => {
          // ignore offline stat sync error
        });
    }
  }, [hud, account]);

  const handleStartMatch = useCallback(() => {
    setShowScoreboard(false);
    setShowAccountModal(false);
    setShowAndroidModal(false);
    setInspecting3D(false);
    engineRef.current?.startNewMatch(configRef.current);
  }, []);

  const handleResumeMatch = useCallback(() => {
    engineRef.current?.resumeMatch();
  }, []);

  const handlePauseMatch = useCallback(() => {
    engineRef.current?.pauseMatch();
  }, []);

  const handleReturnToLobby = useCallback(() => {
    setShowScoreboard(false);
    setInspecting3D(false);
    engineRef.current?.returnToLobby();
  }, []);

  const handleRequestLock = useCallback(() => {
    engineRef.current?.requestPointerLock();
  }, []);

  const handleEquipArsenal = useCallback((slotIndex: 0 | 1 | 2, weaponId: WeaponId) => {
    engineRef.current?.equipArsenalWeapon(slotIndex, weaponId);
  }, []);

  const handleCloseArsenal = useCallback(() => {
    engineRef.current?.closeArsenal();
  }, []);

  const handleToggleScoreboard = useCallback(() => {
    setShowScoreboard((prev) => !prev);
  }, []);

  const handleToggleMute = useCallback(() => {
    handleUpdateConfig({ muted: !configRef.current.muted });
  }, [handleUpdateConfig]);

  const handleSelectSlot = useCallback((slotIndex: 0 | 1 | 2) => {
    engineRef.current?.selectWeaponSlot(slotIndex);
  }, []);

  const handleTouchMove = useCallback((x: number, y: number, sprint: boolean) => {
    engineRef.current?.setTouchMove(x, y, sprint);
  }, []);

  const handleTouchLook = useCallback((dx: number, dy: number) => {
    engineRef.current?.addTouchLook(dx, dy);
  }, []);

  const handleTouchFire = useCallback((active: boolean) => {
    engineRef.current?.setTouchFire(active);
  }, []);

  const handleTouchAds = useCallback(() => {
    engineRef.current?.toggleTouchAds();
  }, []);

  const handleTouchCycleZoom = useCallback(() => {
    engineRef.current?.triggerTouchCycleZoom();
  }, []);

  const handleTouchJump = useCallback(() => {
    engineRef.current?.triggerTouchJump();
  }, []);

  const handleTouchBrake = useCallback((active: boolean) => {
    engineRef.current?.setTouchBrake(active);
  }, []);

  const handleTouchReload = useCallback(() => {
    engineRef.current?.triggerTouchReload();
  }, []);

  const handleTouchInteract = useCallback(() => {
    engineRef.current?.triggerTouchInteract();
  }, []);

  const handleTouchGrenadeStart = useCallback(() => {
    engineRef.current?.triggerTouchGrenadeStart();
  }, []);

  const handleTouchGrenadeRelease = useCallback(() => {
    engineRef.current?.triggerTouchGrenadeRelease();
  }, []);

  const handleTouchAirstrike = useCallback(() => {
    engineRef.current?.triggerTouchAirstrike();
  }, []);

  const handleTouchSwitchSeat = useCallback(() => {
    engineRef.current?.switchVehicleSeat();
  }, []);

  const handleTouchDigTrench = useCallback(() => {
    engineRef.current?.triggerTouchDigTrench();
  }, []);

  const handleTouchHeliClimb = useCallback((ascend: boolean, descend: boolean) => {
    engineRef.current?.setTouchHeliClimb(ascend, descend);
  }, []);

  const handleRefillBelts = useCallback(() => {
    engineRef.current?.refillBeltsAtArsenal();
  }, []);

  return (
    <div className="relative w-screen h-[100dvh] overflow-hidden bg-[#0a0d12]">
      {/* Dedicated isolated WebGL canvas mount */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full" />

      {initError && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-6 bg-[#070a10]/90">
          <div className="max-w-md rounded-xl bg-[#0d121c] border border-red-500/40 p-6 text-slate-200 shadow-2xl">
            <h2 className="font-display text-lg font-bold text-white mb-2">
              3D Renderer Initialization Failed
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">{initError}</p>
          </div>
        </div>
      )}

      {hud &&
        hud.phase === 'playing' &&
        hud.isAlive &&
        !hud.arsenal.isOpen &&
        !showScoreboard &&
        hud.touchControlsActive && (
          <MobileControls
            hud={hud}
            onMove={handleTouchMove}
            onLook={handleTouchLook}
            onFire={handleTouchFire}
            onToggleAds={handleTouchAds}
            onCycleZoom={handleTouchCycleZoom}
            onJump={handleTouchJump}
            onBrake={handleTouchBrake}
            onReload={handleTouchReload}
            onInteract={handleTouchInteract}
            onGrenadeStart={handleTouchGrenadeStart}
            onGrenadeRelease={handleTouchGrenadeRelease}
            onAirstrike={handleTouchAirstrike}
            onSwitchSeat={handleTouchSwitchSeat}
            onDigTrench={handleTouchDigTrench}
            onHeliClimb={handleTouchHeliClimb}
          />
        )}

      {hud && hud.phase === 'playing' && (
        <TacticalHud
          hud={hud}
          showScoreboard={showScoreboard}
          muted={config.muted}
          onRequestLock={handleRequestLock}
          onPause={handlePauseMatch}
          onToggleScoreboard={handleToggleScoreboard}
          onToggleMute={handleToggleMute}
          onSelectSlot={handleSelectSlot}
        />
      )}

      {hud && hud.phase === 'playing' && hud.arsenal.isOpen && (
        <ArsenalModal
          arsenalName={hud.arsenal.arsenalName || 'Base Arsenal'}
          loadout={hud.loadout}
          activeSlot={hud.activeSlot}
          carriedBelts={hud.carriedBelts}
          maxCarriedBelts={hud.maxCarriedBelts}
          onEquipSlot={handleEquipArsenal}
          onRefillBelts={handleRefillBelts}
          onClose={handleCloseArsenal}
        />
      )}

      {hud && hud.phase !== 'playing' && (
        <GameMenus
          hud={hud}
          config={config}
          account={account}
          inspecting3D={inspecting3D}
          onToggleInspect3D={() => {
            setInspecting3D((prev) => {
              const next = !prev;
              engineRef.current?.setLobbyInspecting(next);
              return next;
            });
          }}
          onLobbyDrag={(dx, dy) => engineRef.current?.setLobbyCameraDrag(dx, dy)}
          onLobbyZoom={(delta) => engineRef.current?.setLobbyCameraZoom(delta)}
          onLobbyPreset={(preset) => engineRef.current?.setLobbyCameraPreset(preset)}
          onOpenAccount={() => setShowAccountModal(true)}
          onOpenAndroidApp={() => setShowAndroidModal(true)}
          isAppInstalled={isInstalled}
          onUpdateConfig={handleUpdateConfig}
          onStartMatch={handleStartMatch}
          onResumeMatch={handleResumeMatch}
          onReturnToLobby={handleReturnToLobby}
        />
      )}

      {showAccountModal && (!hud || hud.phase === 'lobby') && (
        <AccountModal
          currentAccount={account}
          currentUsername={config.username}
          onComplete={handleAccountComplete}
          onClose={() => setShowAccountModal(false)}
        />
      )}

      {showAndroidModal && (!hud || hud.phase === 'lobby') && (
        <AndroidInstallModal
          isInstallable={isInstallable}
          isInstalled={isInstalled}
          onPromptInstall={promptInstall}
          onClose={() => setShowAndroidModal(false)}
        />
      )}

      <OfflineIndicator isOnline={isOnline} />
    </div>
  );
}
