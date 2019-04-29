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
const purpleMat = new THREE.MeshToonMaterial({
  color: new THREE.Color('purple')
});
const greenMat = new THREE.MeshToonMaterial({
  color: new THREE.Color('green')
});
const blueMat = new THREE.MeshToonMaterial({
  color: new THREE.Color('blue')
});
const orangeMat = new THREE.MeshToonMaterial({
  color: new THREE.Color('orange')
});
const redMat = new THREE.MeshToonMaterial({
  color: new THREE.Color('red')
});

var meshes = [];
var meshIndex = 0;

class BoardGame {
  constructor(game) {
    this.game = game;
    this.size = 8;
    this.board = [];
    this.createBoard();
    this.selectedPiece = null;
  }

  createBoard() {
    for (let i = 0; i < this.size; i++) {
      const row = [];
      for (let j = 0; j < this.size; j++) {
        let piece = null;
        // Add to the board data structure
        if (i === 7) {
          if (j === 7 || j === 0) {
            piece = new RookChessPiece(this, [i, j], 1);
          } else if (j === 6 || j === 1) {
            piece = new KnightChessPiece(this, [i, j], 1);
          } else if (j === 5 || j === 2) {
            piece = new BishopChessPiece(this, [i, j], 1);
          } else if (j === 4) {
            piece = new QueenChessPiece(this, [i, j], 1);
          } else {
            piece = new KingChessPiece(this, [i, j], 1);
          }
        } else if ( i === 6) {
          piece = new PawnChessPiece(this, [i, j], 1);
        }
        row.push({
          piece: piece,
          space: new SpaceBlock(this, [i, j])
        });
      }
      this.board.push(row);
    }
  }

  // Returns an array of objects that can be clicked
  // Used for raycasting
  getClickables() {
    const clickables = [];
    for (const row of this.board) {
      for (const tile of row) {
        if (tile.space.active) {
          clickables.push(tile.space.mesh);
        }
        // TODO: Add logic for team clicking only
        if (tile.piece) {
          clickables.push(tile.piece.mesh);
        }
      }
    }
    return clickables;
  }

  selectPiece(piece) {
    this.selectedPiece = piece;
    this.showMoves(this.selectedPiece);
  }

  showMoves(piece) {
    this.deactivateSpaces();
    // Activate the spaces that are valid moves
    const moves = piece.getMoves();
    for (const move of moves) {
      this.getSpaceAtPosition(move).activate();
    }
  }

  deactivateSpaces() {
    // Deactivate any current active spaces
    for (const row of this.board) {
      for (const tile of row) {
        tile.space.deactivate();
      }
    }
  }

  movePiece(newPosition) {
    if (this.selectedPiece === null) {
      throw new Error("A piece is not selected");
    }
    // Make the current position null
    this.board[this.selectedPiece.position[0]][this.selectedPiece.position[1]].piece = null;
    // TODO: add a capturing event/hook
    
    // Move the piece
    this.board[newPosition[0]][newPosition[1]].piece = this.selectedPiece;
    this.selectedPiece.setPosition(newPosition);

    this.deactivateSpaces();
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
    this.boardGame = boardGame;
    this.position = position;
    this.active = false;
    const x = position[0];
    const y = position[1];
    this.material = (x % 2 === 0 && y % 2 === 1) || (x % 2 === 1 && y % 2 === 0) ? blackMat : whiteMat;
    this.mesh = new THREE.Mesh(
      boxGeom,
      this.material,
    );
    this.mesh.position.set(spaceSize * position[0], 0, spaceSize * position[1]);
    this.mesh.onClickCallback = (function() {
      this.boardGame.movePiece(position);
    }).bind(this);
    this.boardGame.game.scene.add(this.mesh);
  }

  activate() {
    this.mesh.material = yellowMat;
    this.active = true;
  }

  deactivate() {
    this.mesh.material = this.material;
    this.active = false;
  }
}

class BoardPiece {
  constructor(boardGame, position, team, modelName) {
    this.boardGame = boardGame;
    this.position = position;
    this.team = team;
    // Load the mesh
    this.mesh = this.boardGame.game.models[modelName].clone();

    // Setup the mesh and handlers
    this.setPosition();
    this.setClickHandler();
    this.boardGame.game.scene.add(this.mesh);
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

  setClickHandler() {
    if (!this.mesh) {
      throw new Error("A mesh is not defined for this object");
    }
    this.mesh.onClickCallback = (function() {
      this.boardGame.selectPiece(this);
    }).bind(this);
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
  constructor(boardGame, position, team, modelName) {
    super(boardGame, position, team, modelName);
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
    super(boardGame, position, team, 'pawn');
    this.type = 'pawn';
    this.deltas = [
      [-1, 0, 3],
      [-1, -1, 2],
      [-1, 1, 2]
    ];
  }
}

class RookChessPiece extends ChessPiece {
  constructor(boardGame, position, team) {
    super(boardGame, position, team, 'rook');
    this.type = 'rook';
    this.deltas = [
      [1, 0, 0],
      [0, 1, 0],
      [-1, 0, 0],
      [0, -1, 0]
    ];
  }
}

class BishopChessPiece extends ChessPiece {
  constructor(boardGame, position, team) {
    super(boardGame, position, team, 'bishop');
    this.type = 'bishop';
    this.deltas = [
      [1, 1, 0],
      [1, -1, 0],
      [-1, 1, 0],
      [-1, -1, 0],
    ];
  }
}


class QueenChessPiece extends ChessPiece {
  constructor(boardGame, position, team) {
    super(boardGame, position, team, 'queen');
    this.type = 'queen';
    this.deltas = [
      [1, 1, 0],
      [1, -1, 0],
      [-1, 1, 0],
      [-1, -1, 0],
      [1, 0, 0],
      [0, 1, 0],
      [-1, 0, 0],
      [0, -1, 0]
    ];
  }
}

class KingChessPiece extends ChessPiece {
  constructor(boardGame, position, team) {
    super(boardGame, position, team, 'king');
    this.type = 'king';
    this.deltas = [
      [1, 1, 1],
      [1, -1, 1],
      [-1, 1, 1],
      [-1, -1, 1],
      [1, 0, 1],
      [0, 1, 1],
      [-1, 0, 1],
      [0, -1, 1]
    ];
  }
}

class KnightChessPiece extends ChessPiece {
  constructor(boardGame, position, team) {
    super(boardGame, position, team, 'knight');
    this.type = 'knight';
    this.deltas = [
      [2, 1, 1],
      [2, -1, 1],
      [-2, 1, 1],
      [-2, -1, 1],
      [1, 2, 1],
      [1, -2, 1],
      [-1, 2, 1],
      [-1, -2, 1]
    ];
  }
}
