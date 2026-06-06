import { BottleConfig, BottleID, PhysicsSettings, Achievement, PlatformConfig } from "./types";

export const BOTTLE_PRESETS: Record<BottleID, BottleConfig> = {
  [BottleID.WATER_BOTTLE]: {
    id: BottleID.WATER_BOTTLE,
    name: "Garrafa de Água",
    emoji: "💧",
    width: 50,
    height: 120,
    mass: 1.0,
    bounciness: 0.18,
    friction: 0.8,
    liquidRatio: 0.35, // Low center of mass (liquid pool at bottom)
    stabilityBonus: 0.12, // Tolerates up to ~0.12 rad (~7 degrees) tilt on landing
    difficultyMultiplier: 1.0,
    color: "rgba(147, 197, 253, 0.4)", // Translucent blue
    liquidColor: "rgba(59, 130, 246, 0.75)", // Solid blue bottom
    capColor: "rgba(30, 64, 175, 1)", // Dark blue
    description: "Equilibrada e clássica. O líquido na base ajuda a auto-estabilizar após o giro.",
  },
  [BottleID.SODA_CAN]: {
    id: BottleID.SODA_CAN,
    name: "Lata de Refrigerante",
    emoji: "🥤",
    width: 55,
    height: 95,
    mass: 0.8,
    bounciness: 0.28, // Quite bouncy!
    friction: 0.65,
    liquidRatio: 0.0, // Solid empty/full can behavior, high center of mass
    stabilityBonus: 0.15, // Wide base makes it slightly easier to balance if slow
    difficultyMultiplier: 1.2,
    color: "rgba(239, 68, 68, 0.95)", // Solid red can
    liquidColor: "rgba(239, 68, 68, 1)",
    capColor: "rgba(209, 213, 219, 1)", // Silver tab
    description: "Leve e mais saltitante. A base larga facilita a aterrissagem, mas ela salta com facilidade.",
  },
  [BottleID.JUICE_CARTON]: {
    id: BottleID.JUICE_CARTON,
    name: "Caixa de Suco",
    emoji: "🧃",
    width: 60,
    height: 110,
    mass: 1.5,
    bounciness: 0.08, // Low bounce!
    friction: 0.9,    // High grip!
    liquidRatio: 0.25,
    stabilityBonus: 0.2, // Very stable base!
    difficultyMultiplier: 0.8,
    color: "rgba(245, 158, 11, 0.9)", // Orange carton
    liquidColor: "rgba(245, 158, 11, 1)",
    capColor: "rgba(255, 255, 255, 1)", // White cap
    description: "Pesada e com base quadrada estável. Amortece os impactos e não rola facilmente.",
  },
  [BottleID.GLASS_BOTTLE]: {
    id: BottleID.GLASS_BOTTLE,
    name: "Garrafa de Vidro",
    emoji: "🍾",
    width: 44,
    height: 130,
    mass: 1.8,
    bounciness: 0.12,
    friction: 0.7,
    liquidRatio: 0.45, // Medium center of mass
    stabilityBonus: 0.05, // Hard to balance due to narrow neck/base!
    difficultyMultiplier: 1.8,
    color: "rgba(5, 150, 105, 0.6)", // Green glass
    liquidColor: "rgba(5, 150, 105, 0.85)",
    capColor: "rgba(180, 83, 9, 1)", // Cork
    description: "Pesada, fina e desafiadora. O centro de gravidade elevado exige lançamentos de alta precisão.",
  },
  [BottleID.THERMOS]: {
    id: BottleID.THERMOS,
    name: "Garrafa Térmica",
    emoji: "☕",
    width: 65,
    height: 140,
    mass: 2.2,
    bounciness: 0.05,
    friction: 0.85,
    liquidRatio: 0.2,
    stabilityBonus: 0.16,
    difficultyMultiplier: 1.3,
    color: "rgba(75, 85, 99, 1)", // Metallic gray
    liquidColor: "rgba(107, 114, 128, 1)",
    capColor: "rgba(31, 41, 55, 1)",
    description: "Extremamente pesada e com baixa elasticidade. Requer mais força, mas gruda no chão.",
  },
  [BottleID.SHAMPOO_BOTTLE]: {
    id: BottleID.SHAMPOO_BOTTLE,
    name: "Frasco de Shampoo",
    emoji: "🧴",
    width: 40,
    height: 125,
    mass: 0.7,
    bounciness: 0.22,
    friction: 0.6,
    liquidRatio: 0.5, // High center of mass due to thick formula at top
    stabilityBonus: 0.03, // Tiny, unstable base!
    difficultyMultiplier: 2.2,
    color: "rgba(236, 72, 153, 0.8)", // Pink plastic
    liquidColor: "rgba(244, 114, 182, 0.9)",
    capColor: "rgba(131, 24, 115, 1)",
    description: "O maior desafio! Extremamente leve com uma base estreita e topo pesado. Quase impossível!",
  },
};

export const DEFAULT_PHYSICS_SETTINGS: PhysicsSettings = {
  gravity: 1200,          // standard downward gravity (px/s^2)
  torqueFactor: 1.5,      // sensitivity of swipe to spin
  drag: 0.35,             // velocity air damping factor (per second)
  angularDrag: 0.2,       // angular velocity air damping factor (per second)
  restitution: 1.0,       // generic multiplier for bounciness
  launchMultiplier: 1.3,  // translation force multiplier on swipe
};

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_flip",
    title: "Primeiro Sucesso 💧",
    description: "Faça sua primeira garrafa cair em pé com sucesso.",
    unlocked: false,
    condition: "1 sucesso",
  },
  {
    id: "streak_3",
    title: "Estabilidade Tripla 📈",
    description: "Consiga uma sequência de 3 acertos seguidos.",
    unlocked: false,
    condition: "Sequência de 3",
  },
  {
    id: "streak_5",
    title: "Mestre das Garrafas 🔥",
    description: "Melhore sua mira e acerte 5 vezes seguidas.",
    unlocked: false,
    condition: "Sequência de 5",
  },
  {
    id: "all_bottles",
    title: "Colecionador de Recipientes 🏆",
    description: "Consiga pontuações com pelo menos 4 modelos de garrafas diferentes.",
    unlocked: false,
    condition: "4 tipos usados",
  },
  {
    id: "sky_high",
    title: "Lançamento Orbital 🚀",
    description: "Lance a garrafa a mais de 500 pixels de altura antes de acertar.",
    unlocked: false,
    condition: "Altura > 500px",
  },
  {
    id: "spin_master",
    title: "Giro 360 Duplo 🌀",
    description: "Faça a garrafa dar pelo menos 2 giros completos (720°) no ar e cair de pé.",
    unlocked: false,
    condition: "2+ flips",
  },
  {
    id: "legendary_cap_landing",
    title: "EQUILÍBRIO LENDÁRIO 👑",
    description: "Consiga a façanha incrível de fazer a garrafa pousar de ponta-cabeça na TAMPA!",
    unlocked: false,
    condition: "Pouso na Tampa",
  },
];

export const SCENERY_PRESETS = [
  {
    id: "kitchen",
    name: "Cozinha de Casa 🍳",
    backgroundColor: "linear-gradient(to bottom, #dbeafe, #eff6ff)", // Light pastel blue
    floorColor: "#854d0e", // Wooden floor
    platforms: [],
  },
  {
    id: "backyard",
    name: "Quintal de Tarde 🌤️",
    backgroundColor: "linear-gradient(to bottom, #fef3c7, #fef08a)", // Warm yellow sun
    floorColor: "#15803d", // Green grass
    platforms: [],
  },
  {
    id: "gym",
    name: "Quadra Poliesportiva 🏀",
    backgroundColor: "linear-gradient(to bottom, #f3f4f6, #e5e7eb)", // Gym gray
    floorColor: "#c2410c", // Polishing clay orange
    platforms: [],
  },
  {
    id: "futuristic",
    name: "Espaço Cideral 🪐",
    backgroundColor: "linear-gradient(to bottom, #0f172a, #020617)", // Stars dark blue
    floorColor: "#1e1b4b", // Deep tech platform
    platforms: [],
  },
];
