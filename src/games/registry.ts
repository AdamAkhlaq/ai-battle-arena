import type { GameEngine } from './types';

const gameRegistry = new Map<string, GameEngine>();

export function registerGame(engine: GameEngine): void {
  gameRegistry.set(engine.id, engine);
}

export function getGame(id: string): GameEngine | undefined {
  return gameRegistry.get(id);
}

export function getAllGames(): GameEngine[] {
  return Array.from(gameRegistry.values());
}
