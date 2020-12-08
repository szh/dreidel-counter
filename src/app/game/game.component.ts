import { Component, OnInit } from '@angular/core';
import { DreidelLetter } from '../game-state';
import { GameStateService } from '../game-state.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {
  selectingPlayers: boolean;
  addedPlayersCount: number = 0;
  newPlayerName: string;
  playerNames: string[];
  currentTurn: string;
  potCount: number;
  isGameOver: boolean;

  constructor(private state: GameStateService) { }

  ngOnInit(): void {
    this.loadState();
  }

  loadState(): void {
    if (this.state.getPlayerNames().length === 0) {
      this.selectingPlayers = true;
      this.playerNames = null;
    } else {
      this.selectingPlayers = false;
      this.playerNames = this.state.getPlayerNames();
      this.currentTurn = this.state.getCurrentTurn();
      this.potCount = this.state.getPotCount();
    }
  }

  getScore(playerName: string): number {
    return this.state.getScore(playerName);
  }

  addPlayer(): void {
    this.state.addPlayer(this.newPlayerName);
    this.newPlayerName = '';
    this.addedPlayersCount = this.state.getPlayerNames().length;
  }

  submitPlayers(): void {
    this.loadState();
  }

  reset(): void {
    this.state.clearGame();
    this.loadState();
  }

  playTurn(action: DreidelLetter): void {
    this.state.playTurn(action);
    this.loadState();
  }
}
