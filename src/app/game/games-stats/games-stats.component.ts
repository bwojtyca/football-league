import { PlayerService } from './../../player/player.service';
import { Component, Input, OnInit } from '@angular/core';
import { GameService } from '../game.service';
import { Game } from '../game';

@Component({
  selector: 'fl-games-stats',
  templateUrl: './games-stats.component.html',
  styleUrls: ['./games-stats.component.scss']
})
export class GamesStatsComponent implements OnInit {
  @Input() public playerId?: string;

  public goals;
  public time;
  public games;
  public positions;
  public colors;
  public allies;
  public enemies;
  private playerdGames: Game[];

  constructor(
    private gameService: GameService,
    private playerService: PlayerService
  ) { }

  ngOnInit() {
    this.gameService.getPlayerGames(this.playerId).subscribe((games) => {
      this.playerdGames = games;
      this.goals = {
        total: 0,
        own: 0
      };
      this.time = {
        total: 0,
        wins: 0,
        loses: 0
      };
      this.games = {
        total: 0,
        wins: 0,
        loses: 0
      };
      this.positions = {
        defender: {
          games: 0,
          wins: 0,
          loses: 0,
          goals: 0,
          own: 0,
        },
        attacker: {
          games: 0,
          wins: 0,
          loses: 0,
          goals: 0,
          own: 0,
        }
      };
      this.colors = {
        red: {
          games: 0,
          wins: 0,
          loses: 0,
          goals: 0,
          own: 0,
        },
        blue: {
          games: 0,
          wins: 0,
          loses: 0,
          goals: 0,
          own: 0,
        }
      };
      this.allies = [];
      this.enemies = [];
      this.calculateStats();
    });
  }

  private calculateStats() {
    this.playerdGames.forEach((game: Game) => {
      if (game.end && game.win) {
        const playerTeam = (game.teams.red.defence.player === this.playerId) ||
          (game.teams.red.offence.player === this.playerId) ? 'red' : 'blue';
        const isDefender = game.teams[playerTeam].defence.player === this.playerId;
        const isAttacker = game.teams[playerTeam].offence.player === this.playerId;
        const time = (new Date(game.end).getTime() - new Date(game.start).getTime()) / 1000;

        this.time.total += time;

        // calculate games
        ++this.games.total;
        ++this.colors[playerTeam].games;

        if (playerTeam === game.win) {
          ++this.games.wins;
          ++this.colors[playerTeam].wins;
          this.time.wins += time;
        } else {
          ++this.games.loses;
          ++this.colors[playerTeam].loses;
          this.time.loses += time;
        }

        // calculate goals
        if (isDefender) {
          this.goals.total += game.teams[playerTeam].defence.goals;
          this.goals.own += game.teams[playerTeam].defence.ownGoals;

          ++this.positions.defender.games;
          this.positions.defender.goals += game.teams[playerTeam].defence.goals;
          this.positions.defender.own += game.teams[playerTeam].defence.ownGoals;

          this.colors[playerTeam].goals += game.teams[playerTeam].defence.goals;
          this.colors[playerTeam].own += game.teams[playerTeam].defence.ownGoals;

          if (playerTeam === game.win) {
            ++this.positions.defender.wins;
          } else {
            ++this.positions.defender.loses;
          }
        }
        if (isAttacker) {
          this.goals.total += game.teams[playerTeam].offence.goals;
          this.goals.own += game.teams[playerTeam].offence.ownGoals;

          ++this.positions.attacker.games;
          this.positions.attacker.goals += game.teams[playerTeam].offence.goals;
          this.positions.attacker.own += game.teams[playerTeam].offence.ownGoals;

          this.colors[playerTeam].goals += game.teams[playerTeam].offence.goals;
          this.colors[playerTeam].own += game.teams[playerTeam].offence.ownGoals;

          if (playerTeam === game.win) {
            ++this.positions.attacker.wins;
          } else {
            ++this.positions.attacker.loses;
          }
        }

        if (isDefender && !isAttacker || !isDefender && isAttacker) {
          const allie = this.playerService.getPlayerName(
            isDefender ? game.teams[playerTeam].offence.player : game.teams[playerTeam].defence.player
          );
          let allieStats = this.allies.find((all) => all.name === allie);

          if (!allieStats) {
            allieStats = {
              name: allie,
              games: 0,
              wins: 0,
              loses: 0,
              timePlayed: 0
            };
            this.allies.push(allieStats);
          }

          ++allieStats.games;
          allieStats.timePlayed += time;
          if (playerTeam === game.win) {
            ++allieStats.wins;
          } else {
            ++allieStats.loses;
          }
        }

        const enemies = [];
        enemies.push(game.teams[(playerTeam === 'red' ? 'blue' : 'red')].defence.player);
        if (game.teams[(playerTeam === 'red' ? 'blue' : 'red')].defence.player
          !== game.teams[(playerTeam === 'red' ? 'blue' : 'red')].offence.player) {
          enemies.push(game.teams[(playerTeam === 'red' ? 'blue' : 'red')].offence.player);
        }

        enemies.forEach((enemy) => {
          const enemyName = this.playerService.getPlayerName(enemy);
          let enemyStats = this.enemies.find((ene) => ene.name === enemyName);

          if (!enemyStats) {
            enemyStats = {
              name: enemyName,
              games: 0,
              wins: 0,
              loses: 0,
              timePlayed: 0
            };
            this.enemies.push(enemyStats);
          }

          ++enemyStats.games;
          enemyStats.timePlayed += time;
          if (playerTeam === game.win) {
            ++enemyStats.wins;
          } else {
            ++enemyStats.loses;
          }
        });
      }
    });

    this.allies.sort((a, b) => {
      return a.wins / a.games > b.wins / b.games ? -1 : 1;
    });
    this.enemies.sort((a, b) => {
      return a.wins / a.games > b.wins / b.games ? -1 : 1;
    });
  }

}
