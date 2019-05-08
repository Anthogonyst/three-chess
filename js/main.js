class Game {
  constructor(models) {
    // Models from the loader
    this.models = models;

    // Create the renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    // Create the scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
		this.scene.fog = new THREE.FogExp2(0x000000, 0.003);

    // Create the camera
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 15000);
    //this.camera.position.z = 35;
    this.camera.position.x = -70;
    this.camera.position.y = 60;
    this.camera.lookAt(0, 0, 0);

    //targets
    const target = new THREE.Object3D();
    target.position.set(35,0,35);
    this.scene.add(target);

    // Add lights to scene
    const directionalLight = new THREE.DirectionalLight(0xcccccc, 3);
    directionalLight.position.set(35, 70, 35);
    directionalLight.target = target;
    this.scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0x990000);
    //this.scene.add(ambientLight);

    // Create mouse and raycaster for picking
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Add listeners
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
    window.addEventListener('click', this.onDocumentMouseClick.bind(this), false);

    // Create all the objects
    this.gameObjects = [];
    this.init();
  }

  reset() {
    this.camera.position.z = 35;
    this.camera.position.x = -30;
    this.camera.position.y = 65;
    this.camera.lookAt(40, 8, 35);
  }

  onDocumentMouseClick(event) {
    event.preventDefault();

    this.mouse.x = ( event.clientX / this.renderer.domElement.clientWidth ) * 2 - 1;
    this.mouse.y = - ( event.clientY / this.renderer.domElement.clientHeight ) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.boardGame.getClickables()); 
    if ( intersects.length > 0 ) {
      intersects[0].object.onClickCallback();
    }
  }

  init() {
    this.boardGame = new BoardGame(this);
    this.setupGui();
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.render();
  }

  render() {
    for (let i = 0; i < this.gameObjects.length; i++) {
      this.gameObjects[i].update();
    }
    
    // Update TWEEN
    TWEEN.update();
    
    // Do the wave
    if (this.effectController.wave) {
      for (let i = 0; i < this.boardGame.size; i++) {
        for (let j = 0; j < this.boardGame.size; j++) {
          const deltaHeight = 0.05 * Math.sin(Date.now() * 0.001 + i + j);
          const tile = this.boardGame.board[i][j]
          if (tile.piece) {
            tile.piece.mesh.position.y += deltaHeight;
          }
          tile.space.mesh.position.y += deltaHeight;
        }
      }
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}

  setupGui() {
    this.effectController = {
      example: 1,
      wave: false,
      reset: (function () {
        this.boardGame.reset();
      }).bind(this)
    }
    const gui = new dat.GUI();
    // Create an gui folder 
    let h = gui.addFolder("Chess");
    h.add(this.effectController, "example", 0.0, 20.0, 0.2).name("Example");
    h.add(this.effectController, "wave").name("Wave");
    
    // Create example gui button
    gui.add(this.effectController, "reset").name("Reset");
  }
}

const modelDirectory = "js/src/"
const modelNames = [
  "pawn",
  "king",
  "knight",
  "bishop",
  "queen",
  "rook",
  "checker",
  "crownedchecker",
];

let game;
const loader = new THREE.GLTFLoader();
const models = {};
for (const modelName of modelNames) {
  loader.load(modelDirectory + modelName + ".glb", function(gltf) {
    models[modelName] = gltf.scene.children[2];
    // We have loaded all the models
    if (modelNames.indexOf(modelName) === modelNames.length - 1) {
      game = new Game(models);
      game.animate();
    }
  });
}
