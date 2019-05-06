const spaceSize = 10;
const boxGeom = new THREE.BoxBufferGeometry(spaceSize, spaceSize, spaceSize);
const whiteMat = new THREE.MeshToonMaterial({
  color: new THREE.Color(0x444444)
});
const blackMat = new THREE.MeshToonMaterial({
  color: new THREE.Color('black')
});
const activeSpaceMat = new THREE.MeshToonMaterial({
  color: new THREE.Color('red')
});
const redMat = new THREE.MeshToonMaterial({
  color: new THREE.Color('red')
});

class BoardGame {
  constructor(game) {
    this.game = game;
    this.size = 8;
    this.selectedPiece = null;
    this.turn = 2;
    this.endText = null;
    this.capturedCheckers = 0;

    this.createBoard();
  }

  reset() {
    for (const row of this.board) {
      for (const tile of row) {
        if (tile.piece) {
          this.game.scene.remove(tile.piece.mesh);
        }
        this.game.scene.remove(tile.space.mesh);
      }
    }
    if (this.endText) {
      this.game.scene.remove(this.endText);
      this.endText = null;
    }
    this.createBoard();
    this.turn = 2;
    this.capturedCheckers = 0;
    this.game.reset();
  }

  createBoard() {
    this.board = [];
    for (let i = 0; i < this.size; i++) {
      const row = [];
      this.board.push(row);
      for (let j = 0; j < this.size; j++) {
        row.push({
          space: new SpaceBlock(this, [i, j])
        });
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
        } else if ( i === 0 || i == 2) {
          if (j % 2 == 0) {
            piece = new CheckerPiece(this, [i, j], 2);
          }
        } else if (i === 1) {
          if (j % 2 == 1) {
            piece = new CheckerPiece(this, [i, j], 2);
          }
        }
        row[j].piece = piece;
      }
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
        if (tile.piece && tile.piece.team === this.turn) {
          clickables.push(tile.piece.mesh);
        }
      }
    }
    return clickables;
  }

  selectPiece(piece) {
    this.selectedPiece = piece;
    this.showMoves(this.selectedPiece.getMoves());
  }

  showMoves(moves) {
    this.deactivateSpaces();
    // Activate the spaces that are valid moves
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
    // this.board[this.selectedPiece.position[0]][this.selectedPiece.position[1]].piece = null;
    this.clearPosition(this.selectedPiece.position);

    // Capturing piece logic for chess and checkers
    // For checkers, the attack space will either be null if the checker only moved 1 corner away
    // Or it will be the piece that the checker hopped over
    const pieceIsChecker = this.selectedPiece.type === "checker" || this.selectedPiece.type === "crownedchecker"
    const attackPosition = pieceIsChecker ? [
      newPosition[0] - Math.sign(newPosition[0] - this.selectedPiece.position[0]),
      newPosition[1] - Math.sign(newPosition[1] - this.selectedPiece.position[1])
    ] : newPosition;
    const capturedPiece = this.getPieceAtPosition(attackPosition);
    // Remove the captured piece if we got one
    if (capturedPiece) {
      this.game.scene.remove(capturedPiece.mesh);
      this.clearPosition(attackPosition);
      if(capturedPiece.type === "checker" || capturedPiece.type === "crownedChecker") {
        this.capturedCheckers += 1;
      }
    }

    // handle case if pawn gets to back row
    if(this.selectedPiece.type === "pawn" && newPosition[0] == 0) {
      this.game.scene.remove(this.selectedPiece.mesh);
      this.clearPosition(this.selectedPiece.position);
      this.selectedPiece = new QueenChessPiece(this, newPosition, 1);
    } else if(pieceIsChecker && newPosition[0] == 7) {
      this.game.scene.remove(this.selectedPiece.mesh);
      this.clearPosition(this.selectedPiece.position);
      this.selectedPiece = new CrownedCheckerPiece(this, newPosition, 2);
    } 
    
    // Move the piece
    this.setPieceAtPosition(newPosition, this.selectedPiece);
    this.selectedPiece.setPosition(newPosition);
    this.selectedPiece.hasMoved = true;
    this.deactivateSpaces();
    
    if (capturedPiece && this.turn === 2 && capturedPiece.type == "king") {
      //endgame logic for checkers
      this.endGame("Checkers Wins!", 2);
    } else if (capturedPiece && pieceIsChecker && this.selectedPiece.getMoves({attackOnly: true}).length > 0) {
      // Allow for multiple moves if checkers captures a piece
      this.showMoves(this.selectedPiece.getMoves({attackOnly: true}));
      this.turn = 4;
    } else {
      this.turn = (this.turn % 2) + 1
      if(this.turn - 1) {
        this.game.camera.position.x -= 120;
        this.game.camera.lookAt(40, 8, 35);
        if(this.capturedCheckers === 12) {
          this.endGame("Chess Wins.", 1)
        }
      } else {
        this.game.camera.position.x += 120;
        this.game.camera.lookAt(40, 8, 35);
      }
    }
    
  }

  endGame(text, winner) {
    this.turn = 10;
    this.game.camera.position.x = 40;
    this.game.camera.position.y = 85;
    this.game.camera.lookAt(40, 8, 35);

    var fontloader = new THREE.FontLoader();
    fontloader.load( 'js/lib/helvetiker_regular.typeface.json', (function( font ) {
      var endTextGeom = new THREE.TextGeometry(text, {
        font: font,
        size: 5,
        height: 2,
        curveSegments: 12
      });

      var endTextMat = new THREE.MeshNormalMaterial();

      this.endText = new THREE.Mesh(endTextGeom, endTextMat);
      this.endText.position.set(12, 40, 35);
      if(winner === 1) {
        this.endText.position.x += 6;
      } 
      this.endText.rotation.x = Math.PI / 2;
      this.endText.rotation.y = Math.PI;
      this.endText.rotation.z = Math.PI;

      this.game.scene.add(this.endText);
    }).bind(this));
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
      throw new Error("GetPieceAtPosition: Invalid board position");
    }
    return this.board[position[0]][position[1]].piece;
  }
  
  getSpaceAtPosition(position) {
    if (!this.checkOnBoard(position)) {
      throw new Error("GetSpaceAtPosition: Invalid board position");
    }
    return this.board[position[0]][position[1]].space;
  }

  clearPosition(position) {
    this.setPieceAtPosition(position, null)
  }
  
  setPieceAtPosition(position, piece) {
    if (!this.checkOnBoard(position)) {
      throw new Error("SetPieceAtPosition: Invalid board position");
    }
    this.board[position[0]][position[1]].piece = piece;
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
    this.mesh.material = activeSpaceMat;
    this.active = true;
  }

  deactivate() {
    this.mesh.material = this.material;
    this.active = false;
  }
}

class BoardPiece {
  constructor(boardGame, position, team, modelName, meshOffset) {
    this.boardGame = boardGame;
    this.position = position;
    this.team = team;
    this.hasMoved = false;
    this.meshOffset = meshOffset;
    
    // Load the mesh
    this.mesh = this.boardGame.game.models[modelName].clone();

    // Setup the mesh and handlers
    this.setPosition();
    this.setClickHandler();
    this.boardGame.game.scene.add(this.mesh);
  }

  getMoves() {
    throw new Error("Override this method");
  }

  // Updates and initializes piece positions
  setPosition(newPosition) {
    if (!this.mesh) {
      throw new Error("A mesh is not defined for this object");
    }
    this.position = newPosition ? newPosition : this.position;
    this.mesh.position.set(
      spaceSize * this.position[0],
      this.boardGame.getSpaceAtPosition(this.position).mesh.position.y + this.meshOffset,
      spaceSize * this.position[1]
    );
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
  constructor(boardGame, position, team, modelName, meshOffset) {
    super(boardGame, position, team, modelName, meshOffset);
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
        if (this.isValidMove(newPosition, { attackOnly: true })) {
          moves.push(newPosition);
        }
        break;
      case 3:
        if (this.isValidMove(newPosition, { emptyOnly: true })) {
          moves.push(newPosition);
          if (this.type === 'pawn' && !this.hasMoved) {
            newPosition = [newPosition[0] + delta[0], newPosition[1] + delta[1]];
            if (this.isValidMove(newPosition, {emptyOnly: true})) {
              moves.push(newPosition);
            }
          }
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
  isValidMove(position, options={attackOnly: true, emptyOnly: true}) {
    if (!this.boardGame.checkOnBoard(position)) {
      return false;
    }
    let canMove = false;
    if (options.attackOnly) {
      canMove = canMove || this.boardGame.isPositionEnemy(position, this.team);
    }
    if (options.emptyOnly) {
      canMove = canMove || this.boardGame.isPositionEmpty(position);
    }
    return canMove;
  }
}

class PawnChessPiece extends ChessPiece {
  constructor(boardGame, position, team) {
    super(boardGame, position, team, 'pawn', 10);
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
    super(boardGame, position, team, 'rook', 11);
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
    super(boardGame, position, team, 'bishop', 12);
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
    super(boardGame, position, team, 'queen', 14);
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
    super(boardGame, position, team, 'king', 14);
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
    super(boardGame, position, team, 'knight', 8.4);
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

class CheckerPiece extends BoardPiece {
  constructor(boardGame, position, team, modelName = "checker") {
    super(boardGame, position, team, modelName, 6);
    this.type = 'checker';
    this.deltas = [
      [1, 1, 1],
      [1, -1, 1],
    ];
  }

  getMoves(options = {attackOnly: false}) {
    const moves = [];
    for (const delta of this.deltas) {
      let newPosition = [this.position[0] + delta[0], this.position[1] + delta[1]];
      // Regular movement
      if (!options.attackOnly &&
          this.boardGame.checkOnBoard(newPosition) &&
          this.boardGame.isPositionEmpty(newPosition)) {
        moves.push(newPosition);
      }
      // Attacking movement
      if (this.boardGame.checkOnBoard(newPosition) && this.boardGame.isPositionEnemy(newPosition, this.team)) {
        newPosition = [newPosition[0] + delta[0], newPosition[1] + delta[1]];
        if (this.boardGame.checkOnBoard(newPosition) && this.boardGame.isPositionEmpty(newPosition)) {
          moves.push(newPosition);
        }
      }
    }
    return moves;
  }
}

class CrownedCheckerPiece extends CheckerPiece {
  constructor(boardGame, position, team) {
    super(boardGame, position, team, "crownedchecker");
    this.type = 'crownedchecker';
    this.deltas = [
      [1, 1, 1],
      [1, -1, 1],
      [-1, 1, 1],
      [-1, -1, 1]
    ]
  }
}
