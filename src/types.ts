export type Coordinate = {
  x: number;
  y: number;
};

export enum BottleID {
  WATER_BOTTLE = "water_bottle",
  SODA_CAN = "soda_can",
  JUICE_CARTON = "juice_carton",
  GLASS_BOTTLE = "glass_bottle",
  THERMOS = "thermos",
  SHAMPOO_BOTTLE = "shampoo_bottle",
}

export interface BottleConfig {
  id: BottleID;
  name: string;
  emoji: string;
  width: number;
  height: number;
  mass: number;
  bounciness: number; // coefficient of restitution (e)
  friction: number;   // sliding friction
  liquidRatio: number; // 0 to 1, lowers the center of mass
  stabilityBonus: number; // helps keep it standing if it lands very close to vertical
  difficultyMultiplier: number;
  color: string;
  liquidColor: string;
  capColor: string;
  description: string;
}

export interface PhysicsSettings {
  gravity: number;         // gravity force (px/s^2)
  torqueFactor: number;     // multiplier for spin generation
  drag: number;             // air resistance for velocity (damping)
  angularDrag: number;      // air resistance for rotation (damping)
  restitution: number;      // overall friction/bounciness multiplier
  launchMultiplier: number; // velocity multiplier on drag launch
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  condition: string;
}

export interface GameStats {
  totalThrows: number;
  successfulFlips: number;
  highestStreak: number;
  currentStreak: number;
  maxHeightReached: number; // in pixels or converted unit
  maxSpinsInOneThrow: number;
  unlockedBottles: BottleID[];
}

export interface PlatformConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  name: string;
}
