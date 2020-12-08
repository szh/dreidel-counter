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

  constructor(public state: GameStateService) { }

  ngOnInit(): void {
    this.loadState();
  }

  loadState(): void {
    if (!this.state.getPlayerNames().length) {
      this.selectingPlayers = true;
    } else {
      this.selectingPlayers = false;
    }
  }

  addPlayer(): void {
    this.state.addPlayer(this.newPlayerName);
    this.newPlayerName = '';
    this.addedPlayersCount = this.state.getPlayerNames().length;
  }

  submitPlayers(): void {
    this.selectingPlayers = false;
  }

  playTurn(action: DreidelLetter): void {
    this.state.playTurn(action);
    this.loadState();
  }
}
