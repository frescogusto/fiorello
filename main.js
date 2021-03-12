var world, mass, body, shape, timeStep = 1 / 60,
  camera, scene, renderer, geometry, material, mesh, orbit, mouse, raycaster, cannonDebugRenderer;

// To be synced
var objects = [];
var prefabs = [];
var N = 0;

// Modello 3D
var modelUrl = '3d/TestScene.gltf'




initThree();
initCannon();
initControls();
animate();

const manager = new THREE.LoadingManager();
const loader = new THREE.GLTFLoader(manager);
loader.load(modelUrl, function(gltf) {
  console.log(gltf);
  LoadObjects(gltf.scene.children, true);
});



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
}



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

  cannonDebugRenderer = new THREE.CannonDebugRenderer(scene, world);
}



function initControls() {
  mouse = new THREE.Vector2();
  raycaster = new THREE.Raycaster();

  // Click event
  document.addEventListener(
    "click",
    event => {
      mouse.x = event.clientX / window.innerWidth * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      Click();
    },
    false
  );

  // Orbit controls
  orbit = new THREE.OrbitControls(camera, renderer.domElement);
}



function animate() {

  requestAnimationFrame(animate);
  orbit.update();
  updatePhysics();
  render();

  cannonDebugRenderer.update();
}



function updatePhysics() {

  // Step the physics world
  world.step(timeStep);

  for (let i = 0; i !== objects.length; i++) {
    objects[i].position.copy(objects[i].body.position);
    objects[i].quaternion.copy(objects[i].body.quaternion);
  }
}



function render() {

  renderer.render(scene, camera);
}



function LoadObjects(_allObjects, _addToScene) {

  // Create prefabs and populate scene (optional)
  for (let i = 0; i < _allObjects.length; i++) {
    let newObj = _allObjects[i].clone();
    if (GetCollider(newObj) != null || newObj.name.includes("Empty")) prefabs.push(newObj.clone());
    if (_addToScene) Instantiate(newObj);
  }

  console.log(prefabs);
}



function CreatePhysicalObj(_obj) {

  let mesh = _obj;

  // Create cannon body
  let mass;
  if (mesh.userData.PhsxBehavior == 0 || mesh.userData.PhsxBehavior == null) mass = 0;
  else if (mesh.userData.PhsxBehavior == 1) mass = 5;
  body = new CANNON.Body({ mass: mass });
  body.position.set(mesh.position.x, mesh.position.y, mesh.position.z);
  body.quaternion.set(mesh.quaternion.x, mesh.quaternion.y, mesh.quaternion.z, mesh.quaternion.w);

  // Create cannon shape
  shape = GetCollider(mesh);
  if (shape == null) return;
  body.addShape(shape);

  // Create mesh
  let col = "#" + _obj.material.color.getHexString();
  let mat = new THREE.MeshPhongMaterial({
    color: col
  });
  mesh.material = mat;
  scene.add(mesh);

  // Add to scene & world
  world.add(body);
  mesh.body = body;
  scene.add(mesh);
  objects.push(mesh);
}



function CreatePhysicalGroup(_obj) {
  let col, mat, childShape;
  let allMeshes = [];
  let nChildren = _obj.children.length;

  // Create Body// Create body
  let mass;
  if (_obj.userData.PhsxBehavior == 0 || _obj.userData.PhsxBehavior == null) mass = 0;
  else if (_obj.userData.PhsxBehavior == 1) mass = 5 * nChildren;
  body = new CANNON.Body({ mass: mass });

  // Create cannon shapes
  for (let i = 0; i < nChildren; i++) {
    childShape = GetCollider(_obj.children[i]);
    if (childShape == null) return;
    body.addShape(childShape,
      new CANNON.Vec3(_obj.children[i].position.x, _obj.children[i].position.y, _obj.children[i].position.z),
      new CANNON.Quaternion(_obj.children[i].quaternion.x, _obj.children[i].quaternion.y, _obj.children[i].quaternion.z, _obj.children[i].quaternion.w)
    );
  }

  // Create group
  let group = new THREE.Group();
  group.position.set(_obj.position.x, _obj.position.y, _obj.position.z);
  group.quaternion.set(_obj.quaternion.x, _obj.quaternion.y, _obj.quaternion.z, _obj.quaternion.w);

  // Create meshes
  for (let i = 0; i < nChildren; i++) {
    col = "#" + _obj.children[i].material.color.getHexString();
    mat = new THREE.MeshPhongMaterial({
      color: col
    });
    _obj.children[i].material = mat;
    group.add(_obj.children[i].clone());
  }

  // Adjust body position
  body.position.set(group.position.x, group.position.y, group.position.z);
  body.quaternion.set(group.quaternion.x, group.quaternion.y, group.quaternion.z, group.quaternion.w);

  // Add to world
  world.add(body);
  group.body = body;
  scene.add(group);
  objects.push(group);
}



function GetCollider(_mesh) {
  let _shape;
  if (!_mesh.isMesh) return null;

  let bb = _mesh.geometry.boundingBox.max;

  if (_mesh.name.includes("Cube")) {
    _shape = new CANNON.Box(new CANNON.Vec3(bb.x, bb.y, bb.z));
  } else if (_mesh.name.includes("Sphere")) {
    _shape = new CANNON.Sphere((bb.x + bb.y + bb.z) / 3);
  } else if (_mesh.name.includes("Cylinder")) {
    _shape = new CANNON.Cylinder(bb.x, bb.x, bb.y * 2, 12);
    let qt = new CANNON.Quaternion();
    qt.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    let translation = new CANNON.Vec3(0, 0, 0);
    _shape.transformAllPoints(translation, qt);
  } else if (_mesh.name.includes("Cone")) {
    _shape = new CANNON.Cylinder(0, bb.x / 2, bb.y, 12);
    let qt = new CANNON.Quaternion();
    qt.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    let translation = new CANNON.Vec3(0, 0, 0);
    _shape.transformAllPoints(translation, qt);
  } else {
    console.log("Cannot add physics to " + _mesh.name);
    return null;
  }

  return _shape;
}



function Instantiate(newObj) {

  if (newObj.isMesh) {
    CreatePhysicalObj(newObj);
  } else if (newObj.name.includes("Empty") && newObj.children.length > 0) {
    CreatePhysicalGroup(newObj);
  }
}



function SpawnObj() {

  let index = Math.floor(Math.random() * prefabs.length);
  Instantiate(prefabs[index].clone());
}


function Click() {

  raycaster.setFromCamera(mouse, camera);
  console.log(mouse);
  SpawnObj();
}



// function addObject(i) {
//   var cubeGeo = new THREE.BoxGeometry(1, 1, 1, 10, 10);
//   var cubeMaterial = new THREE.MeshPhongMaterial({
//     color: 0x888888
//   });
//   cubeMesh = new THREE.Mesh(cubeGeo, cubeMaterial);
//   scene.add(cubeMesh);
//
//   var mass = 5,
//     radius = 1;
//   boxShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
//   boxBody = new CANNON.Body({
//     mass: mass
//   });
//
//   boxBody.addShape(boxShape);
//   boxBody.position.set(i * 2, 5, 0);
//   world.add(boxBody);
//   cubeMesh.body = boxBody;
//
//   objects.push(cubeMesh);
// }
