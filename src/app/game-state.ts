export interface GameState {
  potCount: number;
  players: Player[];
  nextTurn: string;
  winner?: string;
}

export interface Player {
  name: string;
  score: number;
  turnOrder: number;
}

export type DreidelLetter = 'nun' | 'gimmel' | 'hay' | 'shin';
