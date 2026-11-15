/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { GameMenus } from './components/GameMenus';
import { TacticalHud } from './components/TacticalHud';
import { FpsEngine } from './game/FpsEngine';
import { HudSnapshot, MatchConfig } from './game/types';

import { MAPS } from './game/arena';
import { WEAPONS } from './game/weapons';

const CONFIG_STORAGE_KEY = 'vanguard_arena_config_v2';

const DEFAULT_CONFIG: MatchConfig = {
  mapId: 'yard',
  teamSize: 10,
  scoreLimit: 50,
  difficulty: 'tactical',
  startingWeapon: 'm4a1',
  sensitivity: 1.0,
  muted: false,
};

function loadInitialConfig(): MatchConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<MatchConfig>;
    const merged = { ...DEFAULT_CONFIG, ...parsed };
    if (!WEAPONS[merged.startingWeapon]) {
      merged.startingWeapon = 'm4a1';
    }
    if (!MAPS[merged.mapId]) {
      merged.mapId = 'yard';
    }
    if (merged.teamSize !== 4 && merged.teamSize !== 6 && merged.teamSize !== 10) {
      merged.teamSize = 10;
    }
    if (merged.scoreLimit !== 25 && merged.scoreLimit !== 50 && merged.scoreLimit !== 75) {
      merged.scoreLimit = 50;
    }
    return merged;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<FpsEngine | null>(null);

  const [config, setConfig] = useState<MatchConfig>(loadInitialConfig);
  const configRef = useRef<MatchConfig>(config);
  configRef.current = config;

  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

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

  const handleStartMatch = useCallback(() => {
    setShowScoreboard(false);
    engineRef.current?.startNewMatch(configRef.current);
  }, []);

  const handleResumeMatch = useCallback(() => {
    engineRef.current?.resumeMatch();
  }, []);

  const handleReturnToLobby = useCallback(() => {
    setShowScoreboard(false);
    engineRef.current?.returnToLobby();
  }, []);

  const handleRequestLock = useCallback(() => {
    engineRef.current?.requestPointerLock();
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0d12]">
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

      {hud && hud.phase === 'playing' && (
        <TacticalHud
          hud={hud}
          showScoreboard={showScoreboard}
          muted={config.muted}
          onRequestLock={handleRequestLock}
        />
      )}

      {hud && hud.phase !== 'playing' && (
        <GameMenus
          hud={hud}
          config={config}
          onUpdateConfig={handleUpdateConfig}
          onStartMatch={handleStartMatch}
          onResumeMatch={handleResumeMatch}
          onReturnToLobby={handleReturnToLobby}
        />
      )}
    </div>
  );
}
