class Game {
  constructor() {
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
    
    // Add lights to scene
    const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
		directionalLight.position.set( 1, 1, 1 ).normalize();
		this.scene.add(directionalLight);
   
    // Add listeners
    window.addEventListener( 'resize', this.onWindowResize.bind(this), false );

    // GUI
    this.setupGui();

    // Create all the objects
    this.gameObjects = [];
    this.init();
  }

  init() {
    this.gameObjects.push(new MyObject(this));
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.render();
  }

  render() {
    for (let i = 0; i < this.gameObjects.length; i++) {
      this.gameObjects[i].update();
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

const game = new Game();
game.animate();
