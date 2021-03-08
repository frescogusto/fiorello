var world, mass, body, shape, timeStep = 1 / 60,
  camera, scene, renderer, geometry, material, mesh, controls;

// To be synced
var objects = [];
var N = 0;

var modelUrl = '3d/Scena.gltf'

initThree();
initCannon();
animate();

function initCannon() {

  world = new CANNON.World();
  world.gravity.set(0, -10, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  // world.solver.iterations = 10;

  // Create a plane
  var groundShape = new CANNON.Plane();
  var groundBody = new CANNON.Body({
    mass: 0
  });
  groundBody.addShape(groundShape);
  groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  world.add(groundBody);

  // for (let index = 0; index < 10; index++) {
  //   addObject(index)
  // }

}

function initThree() {

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 100);
  camera.position.z = 8;
  camera.position.y = 3;
  scene.add(camera);

  // floor
  geometry = new THREE.PlaneGeometry(100, 100, 1, 1);
  //geometry.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );
  material = new THREE.MeshLambertMaterial({
    color: 0x777777
  });
  material2 = new THREE.MeshLambertMaterial({
    color: 0xff0000
  });
  //THREE.ColorUtils.adjustHSV( material.color, 0, 0, 0.9 );
  mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
  mesh.receiveShadow = true;
  scene.add(mesh);

  // lights
  var light, materials;
  scene.add(new THREE.AmbientLight(0x666666));

  light = new THREE.DirectionalLight(0xffffff, 1.75);
  var d = 20;
  light.position.set(d, d, d);
  scene.add(light);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);

  document.body.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls( camera, renderer.domElement );
}

function animate() {

  requestAnimationFrame(animate);
  controls.update();
  updatePhysics();
  render();

}

function updatePhysics() {

  // Step the physics world
  world.step(timeStep);

  for (let i = 0; i !== objects.length; i++) {
    objects[i].position.copy(objects[i].body.position);
    objects[i].quaternion.copy(objects[i].body.quaternion);
  }

  // Copy coordinates from Cannon.js to Three.js
  // mesh.position.copy(body.position);
  // mesh.quaternion.copy(body.quaternion);

}


function addObject(i) {
  var cubeGeo = new THREE.BoxGeometry(1, 1, 1, 10, 10);
  var cubeMaterial = new THREE.MeshPhongMaterial({
    color: 0x888888
  });
  cubeMesh = new THREE.Mesh(cubeGeo, cubeMaterial);
  scene.add(cubeMesh);

  var mass = 5,
    radius = 1;
  boxShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
  boxBody = new CANNON.Body({
    mass: mass
  });

  boxBody.addShape(boxShape);
  boxBody.position.set(i * 2, 5, 0);
  world.add(boxBody);
  cubeMesh.body = boxBody;

  objects.push(cubeMesh);
}


function render() {

  renderer.render(scene, camera);

}


const manager = new THREE.LoadingManager();
var loadedScene;
manager.onStart = function(url, itemsLoaded, itemsTotal) {
  console.log('Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
};

manager.onLoad = function() {
  console.log('Loading complete!');
};


manager.onProgress = function(url, itemsLoaded, itemsTotal) {
  //console.log('Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
};

manager.onError = function(url) {
  console.log('There was an error loading ' + url);
};

const loader = new THREE.GLTFLoader(manager);
loader.load(modelUrl, function(gltf) {
  //console.log(gltf);
  addScene(gltf.scene)
});



function addScene(_scene) {
  _scene.traverse(function (child) {
    if (child.isMesh) {
      scene.add(child.clone());
      console.log(_scene);
      console.log("Added " + child.name);
    }
  });
}
