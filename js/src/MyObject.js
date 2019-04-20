class MyObject {
  constructor(game) {
    this.game = game;
    this.mesh = new THREE.Mesh(
      new THREE.BoxBufferGeometry(10, 10, 10),
      new THREE.MeshNormalMaterial()
    );
    this.game.scene.add(this.mesh);
  }

  update() {
    this.mesh.rotation.x = Math.sin(Date.now()/ 1000);
    this.mesh.rotation.y = Math.sin(Date.now()/ 10000);
    this.mesh.rotation.z = Math.sin(Date.now()/ 100000);
  }
}
