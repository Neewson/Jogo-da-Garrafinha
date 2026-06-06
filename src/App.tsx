import { useState, useEffect } from "react";
import { BottleID, GameStats, PhysicsSettings, Achievement } from "./types";
import { 
  DEFAULT_PHYSICS_SETTINGS, 
  DEFAULT_ACHIEVEMENTS, 
  BOTTLE_PRESETS,
  SCENERY_PRESETS
} from "./constants";
import GameCanvas from "./components/GameCanvas";
import { toggleGlobalMute, playFanfareSound } from "./utils/audio";
import { Sparkles, Trophy, Flame, Volume2, VolumeX, Sliders, RefreshCw, Trash2, HelpCircle, Settings, X, Lock, CheckCircle2 } from "lucide-react";

export default function App() {
  // States
  const [currentBottleId, setCurrentBottleId] = useState<BottleID>(BottleID.WATER_BOTTLE);
  const [currentSceneryId, setCurrentSceneryId] = useState<string>("kitchen");
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showAdvancedPhysics, setShowAdvancedPhysics] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);
  const [selectedSpinSetting, setSelectedSpinSetting] = useState<number>(6.5);
  const [manualForceMult, setManualForceMult] = useState<number>(1.0);

  const [physicsSettings, setPhysicsSettings] = useState<PhysicsSettings>(DEFAULT_PHYSICS_SETTINGS);

  const [stats, setStats] = useState<GameStats>({
    totalThrows: 0,
    successfulFlips: 0,
    highestStreak: 0,
    currentStreak: 0,
    maxHeightReached: 0,
    maxSpinsInOneThrow: 0,
    unlockedBottles: [BottleID.WATER_BOTTLE],
  });

  const [achievements, setAchievements] = useState<Achievement[]>(DEFAULT_ACHIEVEMENTS);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedStats = localStorage.getItem("bottle_flip_stats");
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }

      const savedAchievements = localStorage.getItem("bottle_flip_achievements");
      if (savedAchievements) {
        setAchievements(JSON.parse(savedAchievements));
      }

      const savedMute = localStorage.getItem("bottle_flip_muted");
      if (savedMute) {
        const parsedMute = JSON.parse(savedMute);
        setIsMuted(parsedMute);
        toggleGlobalMute(parsedMute);
      }

      const savedBottle = localStorage.getItem("bottle_flip_active_bottle");
      if (savedBottle && Object.values(BottleID).includes(savedBottle as BottleID)) {
        setCurrentBottleId(savedBottle as BottleID);
      }

      const savedScenery = localStorage.getItem("bottle_flip_active_scenery");
      if (savedScenery) {
        setCurrentSceneryId(savedScenery);
      }
    } catch (e) {
      console.warn("Could not load game state from localStorage", e);
    }
  }, []);

  // Sync to local storage
  const handleUpdateStats = (newStats: Partial<GameStats>) => {
    setStats((prev) => {
      const updated = { ...prev, ...newStats };
      localStorage.setItem("bottle_flip_stats", JSON.stringify(updated));
      return updated;
    });
  };

  const handleUnlockAchievement = (id: string) => {
    setAchievements((prev) => {
      const updated = prev.map((ach) => {
        if (ach.id === id && !ach.unlocked) {
          playFanfareSound();
          return {
            ...ach,
            unlocked: true,
            unlockedAt: new Date().toISOString(),
          };
        }
        return ach;
      });
      localStorage.setItem("bottle_flip_achievements", JSON.stringify(updated));
      return updated;
    });
  };

  const handleResetStats = () => {
    if (window.confirm("Deseja realmente resetar todas as suas estatísticas salvas? Isso não pode ser desfeito.")) {
      const defaultStats: GameStats = {
        totalThrows: 0,
        successfulFlips: 0,
        highestStreak: 0,
        currentStreak: 0,
        maxHeightReached: 0,
        maxSpinsInOneThrow: 0,
        unlockedBottles: [BottleID.WATER_BOTTLE],
      };
      const defaultAch = DEFAULT_ACHIEVEMENTS.map(a => ({ ...a, unlocked: false, unlockedAt: undefined }));

      setStats(defaultStats);
      setAchievements(defaultAch);

      localStorage.setItem("bottle_flip_stats", JSON.stringify(defaultStats));
      localStorage.setItem("bottle_flip_achievements", JSON.stringify(defaultAch));
    }
  };

  const handleBottleChange = (id: BottleID) => {
    setCurrentBottleId(id);
    localStorage.setItem("bottle_flip_active_bottle", id);
  };

  const handleSceneryChange = (id: string) => {
    setCurrentSceneryId(id);
    localStorage.setItem("bottle_flip_active_scenery", id);
  };

  const handleToggleMute = () => {
    setIsMuted((prev) => {
      const updated = !prev;
      toggleGlobalMute(updated);
      localStorage.setItem("bottle_flip_muted", JSON.stringify(updated));
      return updated;
    });
  };

  const handleResetPhysics = () => {
    setPhysicsSettings(DEFAULT_PHYSICS_SETTINGS);
  };

  const currentBottleConfig = BOTTLE_PRESETS[currentBottleId];

  return (
    <div className="h-[100dvh] w-full bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col overflow-hidden" id="main-bottle-game-app">
      
      {/* HEADER BAR - Ultra Slim, super responsive */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur w-full py-2 px-3 sm:py-3 sm:px-6 sticky top-0 z-40 shadow-sm" id="game-headline-header">
        <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-1.5 sm:gap-3">
          
          {/* Logo Brand */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            <span className="text-2xl sm:text-3xl filter drop-shadow animate-pulse select-none animate-bounce">🍾</span>
            <div>
              <h1 className="text-sm sm:text-xl font-extrabold tracking-tight text-white font-sans whitespace-nowrap">
                Jogo da Garrafinha
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Segure com o clique em qualquer parte da tela e arremesse com velocidade!
              </p>
            </div>
          </div>

          {/* Clean HUD and Mute Controls - Tighter on mobile */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Direct Score HUD */}
            <div className="flex items-center space-x-1.5 sm:space-x-3 bg-slate-900/80 border border-slate-800/80 px-2 sm:px-4 py-1 sm:py-1.5 rounded-2xl text-[10px] sm:text-sm">
              <div className="text-center pr-1.5 sm:pr-3 border-r border-slate-800">
                <span className="block text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Arremessos</span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-300 font-mono">{stats.totalThrows}</span>
              </div>
              <div className="text-center pr-1.5 sm:pr-3 border-r border-slate-800">
                <span className="block text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Acertos</span>
                <span className="text-xs sm:text-sm font-extrabold text-indigo-300 font-mono">{stats.successfulFlips}</span>
              </div>
              <div className="text-center pr-1.5 sm:pr-3 border-r border-slate-800">
                <span className="block text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Seq.</span>
                <span className="text-xs sm:text-sm font-extrabold text-amber-400 font-mono flex items-center justify-center gap-0.5">
                  {stats.currentStreak} <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                </span>
              </div>
              <div className="text-center">
                <span className="block text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Rec.</span>
                <span className="text-xs sm:text-sm font-extrabold text-yellow-500 font-mono flex items-center justify-center gap-0.5">
                  {stats.highestStreak} <Trophy className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                </span>
              </div>
            </div>

            {/* Quick Actions (Audio / Help / Settings) */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => setShowSettingsDrawer(true)}
                className={`p-1.5 sm:p-2 rounded-xl border cursor-pointer transition-all flex items-center gap-1 ${
                  showSettingsDrawer
                    ? "bg-indigo-500/20 border-indigo-400 text-indigo-400"
                    : "bg-slate-900/60 border-slate-850 hover:bg-slate-800 text-indigo-450 hover:text-indigo-400"
                }`}
                title="Ajustar física, escolher garrafa e cenário"
                id="header-settings-btn"
              >
                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-xs font-bold leading-none hidden md:inline">Ajustes</span>
              </button>

              <button
                onClick={handleToggleMute}
                className={`p-1.5 sm:p-2 rounded-xl border cursor-pointer transition-all ${
                  isMuted
                    ? "bg-rose-500/15 border-rose-500/25 text-rose-400 hover:bg-rose-500/25"
                    : "bg-slate-900/60 border-slate-800 hover:bg-slate-850 text-emerald-400"
                }`}
                title={isMuted ? "Sons desligados" : "Sons ligados"}
                id="header-sound-btn"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </button>

              <button
                onClick={() => setShowHelp(!showHelp)}
                className={`p-1.5 sm:p-2 rounded-xl border cursor-pointer transition-all ${
                  showHelp
                    ? "bg-sky-500/20 border-sky-400 text-sky-400"
                    : "bg-slate-900/60 border-slate-800 hover:bg-slate-850 text-slate-400"
                }`}
                title="Como jogar"
                id="header-help-btn"
              >
                <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
          
        </div>
      </header>

      {/* DETAILED GAME DASHBOARD GRID */}
      <main className="max-w-7xl mx-auto w-full p-1.5 sm:p-4 flex-1 flex flex-col gap-1.5 sm:gap-3 overflow-hidden" id="game-dashboard-main-content">
        
        {/* Help Panel floating absolute modal dialog so it doesn't take vertical space from the canvas! */}
        {showHelp && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" id="help-drawer" onClick={() => setShowHelp(false)}>
            <div className="bg-slate-900 border border-indigo-500/35 rounded-2xl p-5 max-w-md w-full text-xs text-slate-300 shadow-2xl relative animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-extrabold text-white mb-3 flex items-center gap-2 text-base">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <span>Como Jogar & Lançar 🎮</span>
              </h3>
              <ul className="list-disc list-inside space-y-2 text-slate-300 leading-relaxed">
                <li><strong>Clique/Toque e segure</strong> o dedo ou cursor em qualquer área do simulador para posicionar a garrafinha (ela vai para essa posição automaticamente).</li>
                <li><strong>Arraste rápido</strong> e solte com velocidade para realizar o lançamento.</li>
                <li>A velocidade e o rastro físico ditam a força do salto.</li>
                <li>Experimente o slider de <strong>Efeito de Rotação Auxiliar</strong> e <strong>Sensibilidade de Força</strong> no painel de precisão para manobras perfeitas!</li>
                <li>Consiga fazer a garrafa cair em pé sobre a base, ou consiga o <span className="text-yellow-400 font-bold font-mono">👑 EQUILÍBRIO LENDÁRIO</span> pousando de ponta-cabeça na tampa!</li>
              </ul>
              <button
                onClick={() => setShowHelp(false)}
                className="mt-5 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-xs cursor-pointer transition-all"
              >
                Entendido, vamos jogar!
              </button>
            </div>
          </div>
        )}

        {/* MAXIMUM CENTRALIZED GAME PLAYING SPACE */}
        <div className="w-full flex-1 flex flex-col min-h-0" id="center-broad-canvas-space">
          <GameCanvas
            currentBottleId={currentBottleId}
            physicsSettings={physicsSettings}
            currentSceneryId={currentSceneryId}
            stats={stats}
            onUpdateStats={handleUpdateStats}
            onUnlockAchievement={handleUnlockAchievement}
            selectedSpinSetting={selectedSpinSetting}
            setSelectedSpinSetting={setSelectedSpinSetting}
            manualForceMult={manualForceMult}
            setManualForceMult={setManualForceMult}
          />
        </div>

      </main>

      {/* SETTINGS COLLAPSIBLE DRAWER PANEL OVERLAY */}
      {showSettingsDrawer && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-200" 
          id="settings-drawer-backdrop" 
          onClick={() => setShowSettingsDrawer(false)}
        >
          <div 
            className="bg-slate-900 border-l border-slate-800 w-full sm:max-w-md h-full flex flex-col shadow-2xl relative animate-in slide-in-from-right duration-300 overflow-hidden" 
            onClick={(e) => e.stopPropagation()}
            id="settings-drawer-container"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900 sticky top-0 z-10">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-extrabold text-white">Menu de Personalização</h2>
              </div>
              <button 
                onClick={() => setShowSettingsDrawer(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-450 hover:text-slate-200 transition-all cursor-pointer"
                id="btn-close-settings"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">

              {/* Section 1: Bottle Selection */}
              <div>
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-[11px] uppercase tracking-widest font-extrabold text-indigo-450 font-mono">🍾 Escolher Garrafa</span>
                  <span className="text-[10px] text-slate-400 font-medium font-sans">Totalmente livres para testar</span>
                </div>
                <div className="grid grid-cols-2 gap-2" id="drawer-bottle-grid">
                  {(Object.keys(BOTTLE_PRESETS) as BottleID[]).map((id) => {
                    const config = BOTTLE_PRESETS[id];
                    const isSelected = currentBottleId === id;
                    const hasFlipped = stats.unlockedBottles.includes(id);

                    return (
                      <button
                        key={id}
                        onClick={() => handleBottleChange(id)}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all select-none relative h-28 cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg"
                            : "bg-slate-950/60 border-slate-850 hover:border-slate-700 hover:bg-slate-900/60 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-2xl">{config.emoji}</span>
                          <div className="flex items-center gap-1">
                            {hasFlipped ? (
                              <span className="text-[9px] font-black uppercase text-emerald-400 font-mono" title="Já pousou esta garrafa em pé!">✓</span>
                            ) : (
                              <span className="text-[9px] font-bold text-slate-500 font-mono" title="Caiu em pé ainda não!">🔒</span>
                            )}
                            {isSelected && (
                              <span className="bg-indigo-500 text-[8px] font-black uppercase text-white px-1.5 py-0.5 rounded-md">Uso</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="block text-xs font-bold leading-tight truncate">{config.name}</span>
                          <span className="block text-[9px] text-slate-400 font-mono mt-0.5 whitespace-nowrap">Peso: {config.mass}kg</span>
                          <span className="block text-[8px] text-slate-500 mt-0.5 leading-none">Dificuldade: {config.difficultyMultiplier}x</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Scenery Selection */}
              <div>
                <span className="block text-[11px] uppercase tracking-widest font-extrabold text-sky-400 font-mono mb-2.5">🌆 Cenário de Fundo</span>
                <div className="grid grid-cols-2 gap-2">
                  {SCENERY_PRESETS.map((scenery) => {
                    const isSelected = currentSceneryId === scenery.id;
                    return (
                      <button
                        key={scenery.id}
                        onClick={() => handleSceneryChange(scenery.id)}
                        className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs select-none ${
                          isSelected
                            ? "bg-sky-600/20 border-sky-500 text-white shadow-lg"
                            : "bg-slate-950/60 border-slate-850 hover:border-slate-700 text-slate-400"
                        }`}
                      >
                        {scenery.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: Fine Control Spin Boost */}
              <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-800 space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] uppercase tracking-widest font-extrabold text-amber-500 font-mono">🔄 Rotação Automática</span>
                    <span className="text-xs font-mono font-bold text-amber-500">
                      {selectedSpinSetting > 0 ? `+${selectedSpinSetting.toFixed(1)} rad/s` : selectedSpinSetting < 0 ? `${selectedSpinSetting.toFixed(1)} rad/s` : "Normal"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-15"
                    max="15"
                    step="0.5"
                    value={selectedSpinSetting}
                    onChange={(e) => setSelectedSpinSetting(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />

                  <div className="flex flex-wrap gap-1 mt-2">
                    {[-11.5, 0, 6.8, 12.5].map((val) => {
                      const lbl = val === -11.5 ? "Duplo Anti" : val === 0 ? "Sem Giro" : val === 6.8 ? "Giro Normal" : "Duplo Giro";
                      return (
                        <button
                          key={val}
                          onClick={() => setSelectedSpinSetting(val)}
                          className={`text-[9.5px] px-2 py-1 rounded cursor-pointer border select-none transition-all ${
                            selectedSpinSetting === val 
                              ? "border-amber-500 bg-amber-500/10 text-amber-300 font-bold" 
                              : "bg-slate-950/60 border-slate-850 text-slate-400 hover:bg-slate-850"
                          }`}
                        >
                          {lbl}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 4: Power modifier */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] uppercase tracking-widest font-extrabold text-rose-400 font-mono font-bold">🚀 Sensibilidade da Força</span>
                    <span className="text-xs font-mono font-bold text-rose-400">{(manualForceMult * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.05"
                    value={manualForceMult}
                    onChange={(e) => setManualForceMult(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                  <div className="flex justify-between text-[8px] text-slate-500 mt-1 font-mono">
                    <span>SUAVE (0.5x)</span>
                    <span>NORMAL (1.0x)</span>
                    <span>FORTE (2.0x)</span>
                  </div>
                </div>
              </div>

              {/* Section 5: Advanced Rigid-Body Physics */}
              <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-800 space-y-3">
                <div 
                  className="flex justify-between items-center select-none cursor-pointer" 
                  onClick={() => setShowAdvancedPhysics(!showAdvancedPhysics)}
                >
                  <span className="text-[11px] uppercase tracking-widest font-extrabold text-indigo-400 font-mono">🧬 Constantes de Física</span>
                  <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md font-bold">
                    {showAdvancedPhysics ? "Ocultar ✕" : "Ajustar ⚙️"}
                  </span>
                </div>
                
                {showAdvancedPhysics && (
                  <div className="space-y-3.5 pt-2 border-t border-slate-850">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-450">
                        <span>Aceleração da Gravidade</span>
                        <span className="text-indigo-300 font-mono">{physicsSettings.gravity} px/s²</span>
                      </div>
                      <input
                        type="range"
                        min="500"
                        max="2500"
                        step="50"
                        value={physicsSettings.gravity}
                        onChange={(e) => setPhysicsSettings(prev => ({ ...prev, gravity: Number(e.target.value) }))}
                        className="w-full accent-indigo-500 h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-450">
                        <span>Elasticidade (Quique)</span>
                        <span className="text-emerald-300 font-mono">{physicsSettings.restitution}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="2.0"
                        step="0.1"
                        value={physicsSettings.restitution}
                        onChange={(e) => setPhysicsSettings(prev => ({ ...prev, restitution: Number(e.target.value) }))}
                        className="w-full accent-emerald-500 h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="flex gap-2 pt-1.5">
                      <button
                        onClick={handleResetPhysics}
                        className="flex-1 py-1 px-2.5 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition-all text-[11px] font-bold bg-slate-950 border border-slate-800 text-slate-300 cursor-pointer flex items-center justify-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Física Padrão</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 6: Achievements Challenge Progression Tracker */}
              <div>
                <span className="block text-[11px] uppercase tracking-widest font-extrabold text-yellow-500 font-mono mb-2.5">🏆 Conquistas Desafiadoras</span>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
                  {achievements.map((ach) => (
                    <div 
                      key={ach.id} 
                      className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-all text-left ${
                        ach.unlocked 
                          ? "bg-yellow-500/10 border-yellow-500/20 text-slate-200 animate-none" 
                          : "bg-slate-950/40 border-slate-900 text-slate-500"
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {ach.unlocked ? (
                          <CheckCircle2 className="w-4 h-4 text-yellow-500 fill-yellow-500/20" />
                        ) : (
                          <Lock className="w-4 h-4 text-slate-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center gap-1">
                          <h4 className={`text-xs font-bold leading-none truncate ${ach.unlocked ? "text-yellow-400" : "text-slate-400"}`}>
                            {ach.title}
                          </h4>
                          <span className="text-[8px] font-bold font-mono tracking-wider bg-slate-950 px-1.5 py-0.5 rounded uppercase shrink-0">
                            {ach.condition}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 leading-tight">{ach.description}</p>
                        {ach.unlocked && ach.unlockedAt && (
                          <span className="block text-[8px] text-slate-500 font-mono mt-1">
                            Desbloqueada em: {new Date(ach.unlockedAt).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 7: Factory Settings Reset */}
              <div className="pt-2">
                <button
                  onClick={handleResetStats}
                  className="w-full py-2.5 px-3 rounded-xl hover:bg-rose-950/40 hover:text-rose-200 hover:border-rose-800 transition-all text-xs font-bold bg-slate-100/5 hover:bg-slate-950 border border-slate-850 text-slate-400 cursor-pointer flex items-center justify-center gap-1.5"
                  id="btn-clear-stats-drawer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Zerar Conquistas e Recordes</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ULTRA SLIM FOOTER - Hidden on very small screens to save valuable height */}
      <footer className="py-2 border-t border-slate-900 bg-slate-950 text-center text-[10px] text-slate-600 hidden sm:block">
        <p>© 2026 Jogo da Garrafinha. Física de Corpo Rígido 2D de alta sensibilidade.</p>
      </footer>

    </div>
  );
}
