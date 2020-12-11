import { EventEmitter, Injectable } from '@angular/core';
import { DreidelLetter, GameState, Player } from './game-state';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  public Action$: EventEmitter<string> = new EventEmitter<string>();
  private state: GameState = { players: [], nextTurn: null, potCount: 5 };
  private prevState: GameState;
  private turnMessages: string[] = [];

  constructor() {
    // Check if the state is stored in localstorage
    const storedState: string = localStorage.getItem('game-state');
    if (storedState) {
      this.state = JSON.parse(storedState);
    }
  }

  public getWinner(): string {
    return this.state.winner;
  }

  public getPlayerNames(): string[] {
    return this.state.players.map(p => p.name);
  }

  public addPlayer(name: string): void {
    // Check if the player name already exists
    if (!name || this.state.players.find(p => p.name === name)) {
      return;
    }

    // Get the current max turn number
    const maxTurnOrder: number = Math.max(0, ...this.state.players.map(p => p.turnOrder));
    this.state.players.push({ name, score: 4, turnOrder: maxTurnOrder + 1 });
    if (!this.state.nextTurn) {
      this.state.nextTurn = name;
    }
    this.endOfAction();
  }

  public getPotCount(): number {
    return this.state.potCount;
  }

  public getScore(playerName: string): number {
    return this.state.players.find(p => p.name === playerName).score;
  }

  private setScore(playerName: string, score: number): void {
    this.state.players.find(p => p.name === playerName).score = score;
  }

  /**
   * The name of the current player
   */
  public getCurrentTurn(): string {
    return this.state.nextTurn;
  }

  /**
   * Plays a turn for the current player with the specified letter.
   */
  public playTurn(action: DreidelLetter): void {
    if (this.state.winner) {
      return;
    }

    this.saveCurrentState();
    const playerName: string = this.getCurrentTurn();
    const prevScore: number = this.getScore(playerName);
    switch (action) {
      case 'nun': {
        // Do nothing
        this.turnMessages.push(`${playerName} landed on Nun. Nothing happens.`);
        break;
      }
      case 'gimmel': {
        // Player gets all from pot
        const potCount: number = this.getPotCount();
        this.setScore(playerName, prevScore + potCount);
        this.state.potCount = 0;
        this.turnMessages.push(`${playerName} landed on Gimmel and gets all ${potCount} point(s) from the pot!`);
        break;
      }
      case 'hay': {
        // Player gets half from pot
        const potCount: number = this.getPotCount();
        // Always round up
        const biggerHalf: number = Math.ceil(potCount / 2);
        this.setScore(playerName, prevScore + biggerHalf);
        this.state.potCount = potCount - biggerHalf;
        this.turnMessages.push(`${playerName} landed on Hay and gets half the pot. That's ${biggerHalf} point(s).`);
        break;
      }
      case 'shin': {
        // Player loses one point
        if (!this.didPlayerLose(playerName)) {
          this.setScore(playerName, prevScore - 1);
          this.state.potCount += 1;
          this.turnMessages.push(`${playerName} landed on Shin and loses one point.`);
        }
        break;
      }
    }
    if (!this.state.winner) {
      this.checkIfPotEmpty();
    }
    if (!this.state.winner) {
      this.nextTurn();
    }

    this.endOfAction();
  }

  /**
   * Undo the previous turn
   */
  public undoLastTurn(): void {
    const currentState: GameState = this.state;
    this.state = { ...this.prevState };
    this.prevState = { ...currentState };
    this.endOfAction();
  }

  /**
   * Resets all game data
   */
  public clearGame(): void {
    this.saveCurrentState();
    this.state = { players: [], nextTurn: null, potCount: 5 };
    localStorage.removeItem('game-state');
  }

  private checkIfPotEmpty(): void {
    if (this.getPotCount() === 0) {
      this.turnMessages.push('The pot is empty! Everyone puts in one point.');
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

      this.turnMessages.push(`${playerName} has no more points and is out of the game!`);

      // If only one player remains, they win the game
      if (this.state.players.length === 1) {
        this.state.winner = this.state.players[0].name;
        this.state.nextTurn = null;
        this.turnMessages.push(`${this.state.winner} is the winner!`);
      }

      return true;
    }

    return false;
  }

  /**
   * Saves the current `state` in the `prevState` variable.
   * This should be called before any user action so it can be undone.
   */
  private saveCurrentState(): void {
    this.prevState = { ...this.state };
  }

  /**
   * Call at the end of a user action. Saves the current state to localStorage and emits any messages.
   */
  private endOfAction(): void {
    // Save state to localstorage
    localStorage.setItem('game-state', JSON.stringify(this.state));

    if (this.turnMessages.length) {
      this.Action$.emit(this.turnMessages.join('\n'));
      this.turnMessages = [];
    }
  }
}
