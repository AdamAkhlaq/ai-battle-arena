import type { ComponentType } from 'react';

/** Status of a game in progress */
export type GameStatus =
  | { result: 'ongoing' }
  | { result: 'win'; winner: string }
  | { result: 'draw' };

/**
 * Every game implements GameEngine, keeping the platform
 * decoupled from game-specific logic.
 */
export interface GameEngine<TState = unknown, TMove = unknown> {
  /** Unique game identifier, e.g. "chess" */
  id: string;
  /** Display name, e.g. "Chess" */
  name: string;
  /** Returns the initial state for a new game */
  getInitialState(): TState;
  /** Is this move legal given the current state? */
  validateMove(state: TState, move: TMove): boolean;
  /** Apply move and return new state */
  applyMove(state: TState, move: TMove): TState;
  /** Get the current game status */
  getStatus(state: TState): GameStatus;
  /** Serialize state to a string for AI prompts */
  serializeState(state: TState): string;
  /** Game-specific board UI component */
  renderBoard: ComponentType;
  /** Build the AI prompt for the current game state */
  buildPrompt(state: TState, history: TMove[]): string;
}
