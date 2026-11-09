/**
 * Core Game Rules & Pure Calculation Logic for ADIL-SNAKER-PANEL
 */

import { FoodItem, LevelConfig, Obstacle, Position2D, WorldId } from './types';

/**
 * Calculates current score based on food items eaten and active combo multiplier
 */
export function calculateScore(
  applesEaten: number,
  comboMultiplier: number = 1,
  basePoints: number = 10
): number {
  const mult = Math.max(1, Math.min(comboMultiplier, 10));
  return Math.max(0, applesEaten * basePoints * mult);
}

/**
 * Calculates coins awarded to player
 */
export function calculateCoinsEarned(
  apples: number,
  diamonds: number,
  worldMultiplier: number = 1,
  hasCoinBonusSkin: boolean = false
): number {
  const baseCoins = apples * 2 + diamonds * 20;
  const skinBonus = hasCoinBonusSkin ? 1.25 : 1.0;
  return Math.floor(baseCoins * worldMultiplier * skinBonus);
}

/**
 * Checks if snake head collided with arena walls or static obstacles
 */
export function checkCollision(
  headPos: Position2D,
  headRadius: number,
  obstacles: Obstacle[],
  arenaSize: number
): { collided: boolean; reason: 'wall' | 'obstacle' | 'none' } {
  const half = arenaSize / 2 - 0.4; // Arena boundary margin

  // Wall bounds check
  if (
    headPos.x < -half ||
    headPos.x > half ||
    headPos.z < -half ||
    headPos.z > half
  ) {
    return { collided: true, reason: 'wall' };
  }

  // Obstacle circle collision check
  for (const obs of obstacles) {
    const dx = headPos.x - obs.x;
    const dz = headPos.z - obs.z;
    const distSq = dx * dx + dz * dz;
    const minDist = headRadius + obs.radius;
    if (distSq < minDist * minDist) {
      return { collided: true, reason: 'obstacle' };
    }
  }

  return { collided: false, reason: 'none' };
}

/**
 * Checks if snake head bit into its own body segments
 */
export function checkTailCollision(
  headPos: Position2D,
  bodySegments: Position2D[],
  minSafeIndex: number = 6,
  hitDistance: number = 0.65
): boolean {
  if (bodySegments.length <= minSafeIndex) {
    return false;
  }

  const hitDistSq = hitDistance * hitDistance;
  for (let i = minSafeIndex; i < bodySegments.length; i++) {
    const seg = bodySegments[i];
    const dx = headPos.x - seg.x;
    const dz = headPos.z - seg.z;
    if (dx * dx + dz * dz < hitDistSq) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if snake head collected a food item
 */
export function checkFoodPickup(
  headPos: Position2D,
  food: FoodItem,
  pickupRadius: number = 1.1
): boolean {
  const dx = headPos.x - food.x;
  const dz = headPos.z - food.z;
  return dx * dx + dz * dz <= pickupRadius * pickupRadius;
}

/**
 * Generates 7-day daily rewards
 */
export function getDailyRewardForDay(dayIndex: number): {
  day: number;
  coins: number;
  diamonds: number;
  badge: string;
} {
  const day = ((dayIndex - 1) % 7) + 1;
  const rewards = [
    { day: 1, coins: 100, diamonds: 2, badge: 'Welcome Gift' },
    { day: 2, coins: 200, diamonds: 5, badge: 'Double Coin' },
    { day: 3, coins: 350, diamonds: 8, badge: 'Silver Chest' },
    { day: 4, coins: 500, diamonds: 12, badge: 'Gold Cache' },
    { day: 5, coins: 750, diamonds: 18, badge: 'Ruby Vault' },
    { day: 6, coins: 1000, diamonds: 25, badge: 'Diamond Trove' },
    { day: 7, coins: 2000, diamonds: 50, badge: 'LEGENDARY JACKPOT' },
  ];
  return rewards[day - 1];
}

/**
 * Level progression generator for Level Mode (1 to 20 levels)
 */
export function getLevelConfig(level: number): LevelConfig {
  const lvl = Math.max(1, Math.min(level, 20));
  const worldSequence: WorldId[] = ['jungle', 'desert', 'ice', 'lava', 'neon'];
  const world = worldSequence[Math.floor((lvl - 1) / 4) % worldSequence.length];

  return {
    levelNumber: lvl,
    targetApples: 5 + lvl * 2,
    targetScore: (5 + lvl * 2) * 15,
    timeLimitSeconds: Math.max(45, 90 - lvl * 2),
    obstacleCount: Math.min(12, 4 + Math.floor(lvl / 2)),
    world,
    rewardCoins: 150 + lvl * 50,
    rewardDiamonds: 2 + Math.floor(lvl / 3),
  };
}

/**
 * Checks if current level objectives are fulfilled
 */
export function checkLevelComplete(
  applesEaten: number,
  currentScore: number,
  config: LevelConfig
): boolean {
  return (
    applesEaten >= config.targetApples && currentScore >= config.targetScore
  );
}
