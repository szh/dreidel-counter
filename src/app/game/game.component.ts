import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DreidelLetter } from '../game-state';
import { GameStateService } from '../game-state.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {
  selectingPlayers: boolean;
  newPlayerName: string;
  playerNames: string[];
  currentTurn: string;
  potCount: number;
  isGameOver: boolean;

  constructor(private state: GameStateService, private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    this.loadState();
    this.state.Action$.subscribe((msg: string) => {
      this.snackBar.open(msg, 'Undo')
        .onAction().subscribe(() => {
          this.state.undoLastTurn();
          this.loadState();
        });
    });
  }

  loadState(): void {
    this.playerNames = this.state.getPlayerNames();
    if (this.playerNames.length < 2) {
      this.selectingPlayers = true;
    } else {
      this.selectingPlayers = false;
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
    this.playerNames = this.state.getPlayerNames();
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

  spin(): void {
    const rand: number = Math.floor(Math.random() * 4);
    let letter: DreidelLetter;
    switch (rand) {
      case 0:
        letter = 'nun';
        break;
      case 1:
        letter = 'gimmel';
        break;
      case 2:
        letter = 'hay';
        break;
      case 3:
        letter = 'shin';
        break;
    }
    this.playTurn(letter);
  }
}
