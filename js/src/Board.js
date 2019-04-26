class BoardGame {
  constructor() {
    this.size = 8;
    this.board = [];
  }

  
}

class BoardPiece {
  constructor(boardGame, position) {
    this.boardGame = boardGame;
    this.position = position;
  }

  getMoves() {}

  checkOnBoard(position) {
    const x = position[0];
    const y = position[1];
    return x > 0 && x < this.boardGame.size && y > 0 && y < this.boardGame.size;
  }

  getPieceAtPosition(position) {
    return this.boardGame.board[position[0]][position[1]];
  }
}

/* ChessPiece
 * basic model of a chess piece
 * children chess pieces should only have to define deltas
 * deltas are an array of 3 values, the first 2 are x and y and 
 *   the 3rd value is the type of delta
 *   0 = move as far in that direction as possible
 *   1 = move only as far as the delta shows
 *   2 = move only if the new position is taking a piece
 *   3 = move only if the new psoition is empty
 */
class ChessPiece extends BoardPiece {
  constructor(boardGame) {
    super(boardGame);
    this.type = 'undefined';
    this.deltas = [];
  }

  getMoves() {
    // The array of possible moves a piece can take
    const moves = [];
    for (const delta of this.deltas) {
      let newPosition = [this.position[0] + delta[0], this.position[1] + delta[1]];
      // Check what type of delta it is
      switch (delta[2]) {
      case 0:
        while (this.validMove(newPosition)) {
          moves.push(newPosition);
          newPosition = [this.newPosition[0] + delta[0], this.newPosition[1] + delta[1]];
        }
        break;
      case 1:
        if (this.validMove(newPosition)) {
          moves.push(newPosition);
        }
        break;
      case 2:
        if (this.validMove(newPosition, { attack: true })) {
          moves.push(newPosition);
        }
        break;
      case 3:
        if (this.validMove(newPosition, { empty: true })) {
          moves.push(newPosition);
        }
        break;
      }
    }
    return moves;
  }

  validMove(position, options={attack: true, empty: true}) {
    const pieceAtPosition = this.getPieceAtPosition(position);
    return (
      this.checkOnBoard(position) &&
        (
          (options.empty && pieceAtPosition === null) ||
            (options.attack && pieceAtPosition.type === 'checker');
        )
  }
}

class PawnChessPiece extends ChessPiece {
  constructor(boardGame) {
    super(boardGame);
    this.type = 'pawn';
    this.deltas = [
      [0, -1, 3],
      [-1, -1, 2],
      [1, -1, 2]
    ]
  }
}
