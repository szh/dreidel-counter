import { Injectable } from '@angular/core';
import { DreidelLetter, GameState, Player } from './game-state';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  private state: GameState = { players: [], nextTurn: null, potCount: 0 };

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
    this.state.players.push({ name, score: 0, turnOrder: maxTurnOrder + 1 });
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
    this.checkIfPotEmpty();
    this.endTurn();
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

  private endTurn(): void {
    const currentPlayer: Player = this.state.players.find(p => p.name === this.state.nextTurn);
    const currentTurnNum: number = currentPlayer ? currentPlayer.turnOrder : 0;
    //TODO: Find next number up, otherwise start from 0
    this.state.nextTurn = this.state.players.find(p => p.turnOrder === currentTurnNum + 1).name;

    this.saveState();
  }

  private didPlayerLose(playerName: string): boolean {
    if (this.getScore(playerName) === 0) {
      // Player has no more points to lose. Delete from list
      const playerIndex: number = this.state.players.findIndex(p => p.name === playerName);
      this.state.players.splice(playerIndex, 1);
      return true;
    }

    return false;
  }

  public clearGame(): void {
    this.state.players = [];
    this.state.potCount = 0;
    this.state.nextTurn = null;
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
