import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateScore,
  calculateCoinsEarned,
  checkCollision,
  checkTailCollision,
  checkFoodPickup,
  getDailyRewardForDay,
  getLevelConfig,
  checkLevelComplete,
} from './rules';
import { Obstacle, FoodItem } from './types';

test('calculateScore scales properly with combo multiplier', () => {
  assert.equal(calculateScore(5, 1, 10), 50);
  assert.equal(calculateScore(5, 3, 10), 150);
  // Clamps combo multiplier between 1 and 10
  assert.equal(calculateScore(10, 0, 10), 100);
  assert.equal(calculateScore(10, 20, 10), 1000);
});

test('calculateCoinsEarned accounts for diamonds and skin bonus', () => {
  // 10 apples * 2 + 1 diamond * 20 = 40
  assert.equal(calculateCoinsEarned(10, 1, 1, false), 40);
  // With 25% bonus skin
  assert.equal(calculateCoinsEarned(10, 1, 1, true), 50);
});

test('checkCollision detects arena boundaries and obstacle proximity', () => {
  const obstacles: Obstacle[] = [
    { id: 'obs-1', x: 5, z: 5, radius: 1.0, height: 2, type: 'rock' }
  ];
  const arenaSize = 20;

  // Safe middle position
  const safe = checkCollision({ x: 0, z: 0 }, 0.5, obstacles, arenaSize);
  assert.equal(safe.collided, false);

  // Wall collision (half arena is 10, margin 0.4 => limit 9.6)
  const hitWall = checkCollision({ x: 9.8, z: 0 }, 0.5, obstacles, arenaSize);
  assert.equal(hitWall.collided, true);
  assert.equal(hitWall.reason, 'wall');

  // Obstacle collision (within 0.5 + 1.0 = 1.5 units)
  const hitObs = checkCollision({ x: 5.2, z: 5.2 }, 0.5, obstacles, arenaSize);
  assert.equal(hitObs.collided, true);
  assert.equal(hitObs.reason, 'obstacle');
});

test('checkTailCollision ignores head and early neck segments and catches tail bites', () => {
  const segments = [
    { x: 0, z: 0 },
    { x: 0, z: 1 },
    { x: 0, z: 2 },
    { x: 0, z: 3 },
    { x: 0, z: 4 },
    { x: 0, z: 5 },
    { x: 1, z: 5 },
    { x: 1, z: 0 }, // Segment 7 is near x:1, z:0
  ];

  // Head at x: 1, z: 0 hits segment 7
  assert.equal(checkTailCollision({ x: 1, z: 0.1 }, segments, 6, 0.65), true);
  // Head at x: 5, z: 5 is far away
  assert.equal(checkTailCollision({ x: 5, z: 5 }, segments, 6, 0.65), false);
});

test('checkFoodPickup detects proximity to apple', () => {
  const food: FoodItem = {
    id: 'f1',
    x: 3,
    z: 3,
    type: 'apple',
    points: 10,
    coins: 2,
    diamonds: 0,
    spawnTime: 1000,
  };

  assert.equal(checkFoodPickup({ x: 3.2, z: 3.1 }, food, 1.0), true);
  assert.equal(checkFoodPickup({ x: 10, z: 10 }, food, 1.0), false);
});

test('daily reward calendar generates 7 tiers up to jackpot', () => {
  const day1 = getDailyRewardForDay(1);
  assert.equal(day1.coins, 100);
  assert.equal(day1.diamonds, 2);

  const day7 = getDailyRewardForDay(7);
  assert.equal(day7.coins, 2000);
  assert.equal(day7.diamonds, 50);
  assert.equal(day7.badge, 'LEGENDARY JACKPOT');
});

test('level progression sets goals and validates completion', () => {
  const lvl1 = getLevelConfig(1);
  assert.equal(lvl1.targetApples, 7);
  assert.equal(checkLevelComplete(7, lvl1.targetScore, lvl1), true);
  assert.equal(checkLevelComplete(6, lvl1.targetScore, lvl1), false);
});
