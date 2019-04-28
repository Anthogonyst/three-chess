const spaceSize = 10;
const boxGeom = new THREE.BoxBufferGeometry(spaceSize, spaceSize, spaceSize);
const whiteMat = new THREE.MeshToonMaterial({
  color: new THREE.Color('white')
});
const blackMat = new THREE.MeshToonMaterial({
  color: new THREE.Color('black')
});
const yellowMat = new THREE.MeshToonMaterial({
  color: new THREE.Color('yellow')
});

class BoardGame {
  constructor(game) {
    this.game = game;
    this.size = 8;
    this.board = [];
    this.createBoard();
  }

  createBoard() {
    for (let i = 0; i < this.size; i++) {
      const row = [];
      for (let j = 0; j < this.size; j++) {
        let piece = null;
        // Add to the board data structure
        if (i === 7) {
          piece = new RookChessPiece(this, [i, j], 1);
        }
        row.push({
          piece: piece,
          space: new SpaceBlock(this, [i, j])
        });
      }
      this.board.push(row);
    }
  }

  showMoves(piece) {
    // Deactivate any current active spaces
    for (const row of this.board) {
      for (const tile of row) {
        tile.space.deactivate();
      }
    }
    // Activate the spaces that are valid moves
    const moves = piece.getMoves();
    for (const move of moves) {
      this.getSpaceAtPosition(move).activate();
    }
  }

  movePiece(piece, newPosition) {
    // Make the current position null
    this.board[piece.position[0]][piece.position[1]].piece = null;
    // TODO: add a capturing event/hook
    
    // Move the piece
    this.board[newPosition[0]][newPosition[1]].piece = piece;
  }
  
  checkOnBoard(position) {
    const x = position[0];
    const y = position[1];
    return x >= 0 && x < this.size && y >= 0 && y < this.size;
  }

  isPositionEnemy(position, team) {
    const pieceAtPosition = this.getPieceAtPosition(position);
    return pieceAtPosition !== null && pieceAtPosition.team !== team;
  }

  isPositionEmpty(position) {
    return this.getPieceAtPosition(position) === null;
  }

  getPieceAtPosition(position) {
    if (!this.checkOnBoard(position)) {
      throw new Error("Invalid board position");
    }
    return this.board[position[0]][position[1]].piece;
  }

  getSpaceAtPosition(position) {
    if (!this.checkOnBoard(position)) {
      throw new Error("Invalid board position");
    }
    return this.board[position[0]][position[1]].space;
  }
}

class SpaceBlock {
  constructor(boardGame, position, isBlack) {
    this.position = position;
    const x = position[0];
    const y = position[1];
    this.material = (x % 2 === 0 && y % 2 === 1) || (x % 2 === 1 && y % 2 === 0) ? blackMat : whiteMat;
    this.mesh = new THREE.Mesh(
      boxGeom,
      this.material,
    );
    this.mesh.position.set(spaceSize * position[0], 0, spaceSize * position[1]);
    boardGame.game.scene.add(this.mesh);
  }

  activate() {
    this.mesh.material = yellowMat;
  }

  deactivate() {
    this.mesh.material = this.material;
  }
}

class BoardPiece {
  constructor(boardGame, position, team) {
    this.boardGame = boardGame;
    this.position = position;
    this.team = team;
  }

  getMoves() {}

  // Updates and initializes piece positions
  setPosition(newPosition) {
    if (!this.mesh) {
      throw new Error("A mesh is not defined for this object");
    }
    this.position = newPosition ? newPosition : this.position;
    this.mesh.position.set(spaceSize * this.position[0], 10, spaceSize * this.position[1]);
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
  constructor(boardGame, position, team) {
    super(boardGame, position, team);
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
        while (this.isValidMove(newPosition)) {
          moves.push(newPosition);
          // Break out if we hit an enemy
          if (this.boardGame.isPositionEnemy(newPosition)) {
            break;
          }
          newPosition = [newPosition[0] + delta[0], newPosition[1] + delta[1]];
        }
        break;
      case 1:
        if (this.isValidMove(newPosition)) {
          moves.push(newPosition);
        }
        break;
      case 2:
        if (this.isValidMove(newPosition, { attack: true })) {
          moves.push(newPosition);
        }
        break;
      case 3:
        if (this.isValidMove(newPosition, { empty: true })) {
          moves.push(newPosition);
        }
        break;
      }
    }
    return moves;
  }

  /* isValidMove
   * options specify what type of move it is
   * some piece like pawns can only move if they are attacking
   *   and only move when a position is empty
   */
  isValidMove(position, options={attack: true, empty: true}) {
    if (!this.boardGame.checkOnBoard(position)) {
      return false;
    }
    let canMove = false;
    if (options.attack) {
      canMove = canMove || this.boardGame.isPositionEnemy(position, this.team);
    }
    if (options.empty) {
      canMove = canMove || this.boardGame.isPositionEmpty(position);
    }
    return canMove;
  }
}

class PawnChessPiece extends ChessPiece {
  constructor(boardGame, position, team) {
    super(boardGame, position, team);
    this.type = 'pawn';
    this.deltas = [
      [0, -1, 3],
      [-1, -1, 2],
      [1, -1, 2]
    ];
  }
}

class RookChessPiece extends ChessPiece {
  constructor(boardGame, position, team) {
    super(boardGame, position, team);
    this.type = 'rook';
    this.deltas = [
      [1, 0, 0],
      [0, 1, 0],
      [-1, 0, 0],
      [0, -1, 0]
    ];
    this.mesh = new THREE.Mesh(
      new THREE.BoxBufferGeometry(8, 10, 8),
      whiteMat
    );
    this.setPosition();
    this.boardGame.game.scene.add(this.mesh);
  }
}

class BishopChessPiece extends ChessPiece {
  constructor(boardGame, position, team) {
    super(boardGame, position, team);
    this.type = 'bishop';
    this.deltas = [
      [1, 1, 0],
      [1, -1, 0],
      [-1, 1, 0],
      [-1, -1, 0]
    ];
  }
}
