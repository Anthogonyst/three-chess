class Game {
  constructor(models) {
    // Models from the loader
    this.models = models;
    console.log(this.models);
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
    this.camera.position.z = 50;
    this.camera.position.x = 50;
    this.camera.position.y = 50;
    this.camera.lookAt(this.scene.position);

    // Setup Trackball controls
    this.controls = new THREE.TrackballControls(this.camera, this.renderer.domElement);
    this.controls.target.set(35, 0, 35);
    
    // Add lights to scene
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
		directionalLight.position.set(0, 1, 0).normalize();
		this.scene.add(directionalLight);

    const ambientLight = new THREE.DirectionalLight(0xff0000, 1);
		this.scene.add(ambientLight);

    // Create mouse and raycaster for picking
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // GUI
    this.setupGui();

    // Add listeners
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
    window.addEventListener('click', this.onDocumentMouseClick.bind(this), false);

    // Create all the objects
    this.gameObjects = [];
    this.init();
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

  loadModels(callback) {
    this.loader = new THREE.GLTFLoader();
    this.models = {};
    for (const modelName of modelNames) {
      this.loader.load(modelDirectory + modelName + ".glb", (function(gltf) {
        this.models[modelName] = gltf.scene.children[2];
        // We have loaded all the models
        if (modelNames.indexOf(modelName) === modelNames.length - 1) {
          console.log(this.models);

        }
      }).bind(this));
    }
  }

  init() {
    
    this.boardGame = new BoardGame(this);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.render();
  }

  render() {
    for (let i = 0; i < this.gameObjects.length; i++) {
      this.gameObjects[i].update();
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}

  setupGui() {
    this.effectController = {
      example: 1
    }
    const gui = new dat.GUI();
    // Create an gui folder 
    let h = gui.addFolder("Chess");
    h.add(this.effectController, "example", 0.0, 20.0, 0.2).name("example");

    // Create example gui button
    let b = {
      Button: function () {
        console.log("Click");
      }
    };
    gui.add(b, "Button");
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
];

const loader = new THREE.GLTFLoader();
const models = {};
for (const modelName of modelNames) {
  loader.load(modelDirectory + modelName + ".glb", function(gltf) {
    models[modelName] = gltf.scene.children[2];
    // We have loaded all the models
    if (modelNames.indexOf(modelName) === modelNames.length - 1) {
      const game = new Game(models);
      game.animate();
    }
  });
}
