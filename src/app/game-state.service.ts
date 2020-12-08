import { EventEmitter, Injectable } from '@angular/core';
import { DreidelLetter, GameState, Player } from './game-state';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  public GameOver$: EventEmitter<string> = new EventEmitter<string>();
  public PlayerEliminated$: EventEmitter<string> = new EventEmitter<string>();
  private state: GameState = { players: [], nextTurn: null, potCount: 5 };

  constructor() {
    this.restoreState();
  }

  public getPlayerNames(): string[] {
    return this.state.players.map(p => p.name);
  }

  public addPlayer(name: string): void {
    // Check if the player name already exists
    if (this.state.players.find(p => p.name === name)) {
      return;
    }

    // Get the current max turn number
    const maxTurnOrder: number = Math.max(0, ...this.state.players.map(p => p.turnOrder));
    this.state.players.push({ name, score: 4, turnOrder: maxTurnOrder + 1 });
    if (!this.state.nextTurn) {
      this.state.nextTurn = name;
    }
  }

  public getPotCount(): number {
    return this.state.potCount;
  }

  public getScore(playerName: string): number {
    return this.state.players.find(p => p.name === playerName).score;
  }

  public setScore(playerName: string, score: number): void {
    this.state.players.find(p => p.name === playerName).score = score;
  }

  public getCurrentTurn(): string {
    return this.state.nextTurn;
  }

  public playTurn(action: DreidelLetter): void {
    if (this.state.winner) {
      return;
    }

    const playerName: string = this.getCurrentTurn();
    const prevScore: number = this.getScore(playerName);
    switch (action) {
      case 'nun':
        // Do nothing
        break;
      case 'gimmel':
        // Player gets all from pot
        this.setScore(playerName, prevScore + this.getPotCount());
        this.state.potCount = 0;
        break;
      case 'hay':
        // Player gets half from pot
        const potCount: number = this.getPotCount();
        // Always round up
        const biggerHalf: number = Math.ceil(potCount / 2);
        this.setScore(playerName, prevScore + biggerHalf);
        this.state.potCount = potCount - biggerHalf;
        break;
      case 'shin':
        // Player loses one point
        if (!this.didPlayerLose(playerName)) {
          this.setScore(playerName, prevScore - 1);
          this.state.potCount += 1;
        }
        break;
    }
    if (!this.state.winner) {
      this.checkIfPotEmpty();
    }
    if (!this.state.winner) {
      this.nextTurn();
    }
    this.saveState();
  }

  private checkIfPotEmpty(): void {
    if (this.getPotCount() === 0) {
      this.state.players.forEach(p => {
        if (!this.didPlayerLose(p.name)) {
          p.score -= 1;
          this.state.potCount += 1;
        }
      });
    }
  }

  private nextTurn(): void {
    const currentPlayer: Player = this.state.players.find(p => p.name === this.state.nextTurn);
    const currentTurnNum: number = currentPlayer ? currentPlayer.turnOrder : 0;
    // Find next player up.
    // Step 1: sort players by turn number, excluding the current player
    const playersSorted: Player[] =
      this.state.players
        .filter(p => p.turnOrder !== currentTurnNum)
        .sort((a, b) => a.turnOrder - b.turnOrder);
    // Step 2: Get the first player with a turn number greater than the current one.
    // If that doesn't exist, go back to the beginning and take the first player
    const nextUp: Player = playersSorted.find(p => p.turnOrder > currentTurnNum) || playersSorted[0];
    this.state.nextTurn = nextUp.name;
  }

  private didPlayerLose(playerName: string): boolean {
    if (this.getScore(playerName) === 0) {
      // Player has no more points to lose. Delete from list
      const playerIndex: number = this.state.players.findIndex(p => p.name === playerName);
      this.state.players.splice(playerIndex, 1);

      this.PlayerEliminated$.emit(playerName);

      // If only one player remains, they win the game
      if (this.state.players.length === 1) {
        this.state.winner = this.state.players[0].name;
        this.state.nextTurn = null;
        this.GameOver$.emit(this.state.winner);
      }

      return true;
    }

    return false;
  }

  public clearGame(): void {
    this.state = { players: [], nextTurn: null, potCount: 5 };
  }

  private saveState(): void {
    localStorage.setItem('game-state', JSON.stringify(this.state));
  }

  private restoreState(): void {
    // Check if the state is stored
    const storedState: string = localStorage.getItem('game-state');
    if (storedState) {
      this.state = JSON.parse(storedState);
    }
  }
}
