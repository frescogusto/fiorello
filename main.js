var world, mass, body, shape, timeStep = 1 / 60,
  camera, scene, renderer, geometry, material, mesh, orbit, mouse, raycaster, cannonDebugRenderer, camAngle, camH, clock;
var earthquake = false, earthquakeMag = 0;
var tornado = false, insanity = false;
var enableSpawn = false;

// To be synced
var objects = [];
var prefabs = [];
var bodiesToRemove = [];
var disappearingObjs = [];
var staticGroup;
var N = 0;

// SETTINGS
const modelUrls = ['3d/STANZA 2.gltf', '3d/STANZA 3.gltf']
const debugMode = false;
const camTarget = new THREE.Vector3(0, 0.8, 0);
const camDist = 4.3;
const explosionVel = 5;
const horMovement = 0.3;
const verMovement = 0.5;
const antiAliasing = true;
const nMinBodies = 15;
const nMaxBodies = 50;




initThree();
initCannon();
initControls();
animate();

const manager = new THREE.LoadingManager();
const loader = new THREE.GLTFLoader(manager);
let fileIndex = Math.floor(Math.random() * modelUrls.length)
loader.load(modelUrls[fileIndex], function(gltf) {
  console.log(gltf);
  LoadObjects(gltf.scene.children, true);
});



function initThree() {

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdfebf5);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 100);
  camera.position.z = 5.5;
  camera.position.y = 1.5;
  scene.add(camera);

  // // floor
  // geometry = new THREE.PlaneGeometry(100, 100, 1, 1);
  // //geometry.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );
  // material = new THREE.MeshLambertMaterial({
  //   color: 0x777777
  // });
  // material2 = new THREE.MeshLambertMaterial({
  //   color: 0xff0000
  // });
  // //THREE.ColorUtils.adjustHSV( material.color, 0, 0, 0.9 );
  // mesh = new THREE.Mesh(geometry, material);
  // mesh.castShadow = true;
  // mesh.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
  // mesh.receiveShadow = true;
  // scene.add(mesh);

  // LIGHTS
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.8);
  hemiLight.position.set(0, 100, 0);
  scene.add(hemiLight);

  // scene.fog = new THREE.Fog( 0xffffff, 10, 100 );

  const light = new THREE.DirectionalLight(0xffffff, 0.5, 10);
  light.position.set(1, 7, 4); //default; light shining from top
  //light.shadow.radius = 0.1;
  light.castShadow = true; // default false
  light.shadow.bias = -0.00005;
  scene.add(light);
  //Set up shadow properties for the light
  light.shadow.mapSize.width = 3048; // default
  light.shadow.mapSize.height = 3048; // default
  light.shadow.camera.near = 0.5; // default
  light.shadow.camera.far = 500; // default


  renderer = new THREE.WebGLRenderer();
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.antialias = antiAliasing;

  document.body.appendChild(renderer.domElement);
  window.addEventListener( 'resize', onWindowResize, false );

  clock = new THREE.Clock();

  staticGroup = new THREE.Group();
  scene.add(staticGroup);
}



function initCannon() {

  world = new CANNON.World();
  world.gravity.set(0, -10, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  // world.solver.iterations = 10;

  // Create a plane
  // var groundShape = new CANNON.Plane();
  // var groundBody = new CANNON.Body({
  //   mass: 0
  // });
  // groundBody.addShape(groundShape);
  // groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  // world.add(groundBody);

  // for (let index = 0; index < 10; index++) {
  //   addObject(index)
  // }

  let staticGroupBody = new CANNON.Body({
    mass: 0
  });
  staticGroupBody.position.set(0, 0, 0);
  world.add(staticGroupBody);
  staticGroup.body = staticGroupBody;

  if (debugMode) cannonDebugRenderer = new THREE.CannonDebugRenderer(scene, world);
}



function initControls() {
  mouse = new THREE.Vector2();
  raycaster = new THREE.Raycaster();
  camAngle = 0;
  camH = 0;

  // Move event
  document.addEventListener(
    "mousemove",
    event => {
      mouse.x = event.clientX / window.innerWidth * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    },
    false
  );

  // Click event
  document.addEventListener(
    "click",
    event => {
      Click();
    },
    false
  );

  // Orbit controls
  // orbit = new THREE.OrbitControls(camera, renderer.domElement);
  // orbit.target = new THREE.Vector3(0, 0.8, 0);
  // orbit.enablePan = false;
  // orbit.enableZoom = false;
  // orbit.enableDamping = true;
  // orbit.dampingFactor = 0.05;
  // orbit.maxPolarAngle = 1.57;
}



function animate() {
  requestAnimationFrame(animate);
  // orbit.update();
  updatePhysics();
  updateCam();
  render();

  if (debugMode) cannonDebugRenderer.update();
}



function updatePhysics() {

  applyEffects();

  // Step the physics world
  world.step(timeStep);

  // Update positions
  for (let i = 0; i < objects.length; i++) {
    objects[i].position.copy(objects[i].body.position);
    objects[i].quaternion.copy(objects[i].body.quaternion);

    // Delete falling bodies
    if (objects[i].body.position.y < -8) Delete(objects[i]);
  }

  clearExcessObjects();
}



function clearExcessObjects() {

  // If maximum bodies number is exceeded, delete some
  let diff = objects.length - nMaxBodies - disappearingObjs.length;
  for (let i = 0; i < diff; i++) {
    disappearingObjs.push(objects[0]);
  }

  // Scale down and delete excess objects
  for (let i = 0; i < disappearingObjs.length; i++) {
    disappearingObjs[i].scale.subScalar(0.01);
    if (disappearingObjs[i].scale.x < 0.05) Delete(disappearingObjs[i]);
  }

  // If necessary, spawn some objects
  if (objects.length > nMinBodies) enableSpawn = true;
  if (enableSpawn && objects.length < nMinBodies) SpawnObj();

  // Remove unused bodies (here so it doesnt happen within worldStep)
  for (let i = 0; i < bodiesToRemove.length; i++) {
    world.remove(bodiesToRemove[i]);
  }
  bodiesToRemove = [];

  console.log(objects.length);
}



function applyEffects() {
  // Earthquake
  if (earthquakeMag > 0.05 || earthquake) {
    let targetMag;
    if (earthquake) targetMag = 1;
    else targetMag = 0;
    earthquakeMag = THREE.MathUtils.lerp(earthquakeMag, targetMag, 0.02);

    if (renderer.info.render.frame % 5 == 0) {
      let x = (Math.random() * 0.03 - 0.015) * earthquakeMag;
      let y = (Math.random() * 0.03 - 0.015) * earthquakeMag;
      let z = (Math.random() * 0.03 - 0.015) * earthquakeMag;
      staticGroup.body.quaternion.set(x, y, z, 1);
    }
  } else {
    staticGroup.body.position.setZero();
  }

  // Tornado

  // Insanity
  if (insanity) {
    for (let i = 0; i < objects.length; i++) {
      let chanceToFreeze = Math.random();
      if (chanceToFreeze < 0.005) {
        objects[i].body.velocity.setZero();
        objects[i].body.angularVelocity.setZero();
      } else {
        objects[i].body.velocity = new CANNON.Vec3(objects[i].body.velocity.x * -2.3 * Math.random(), objects[i].body.velocity.y * -2.3 * Math.random(), objects[i].body.velocity.z * -2.3 * Math.random());
      }
    }
  }

  // Apply physics to three.js
  staticGroup.position.copy(staticGroup.body.position);
  staticGroup.quaternion.copy(staticGroup.body.quaternion);
}



function updateCam() {
  let delta = clock.getDelta();
  camAngle = THREE.MathUtils.damp(camAngle, -mouse.x * horMovement, 0.9, delta);
  camH = THREE.MathUtils.damp(camH, mouse.y * verMovement, 0.995, delta)
  let targetPos = new THREE.Vector3();

  targetPos.x = camTarget.x + camDist * Math.cos(camAngle);
  targetPos.y = camTarget.y + camH;
  targetPos.z = camTarget.z + camDist * Math.sin(camAngle);

  camera.position.set(targetPos.x, targetPos.y, targetPos.z);
  camera.lookAt(camTarget);
}



function render() {

  renderer.render(scene, camera);
}



function onWindowResize(){

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}



function LoadObjects(_allObjects, _addToScene) {

  // Create prefabs and populate scene (optional)
  for (let i = 0; i < _allObjects.length; i++) {
    let newObj = _allObjects[i].clone();

    // Se l'oggetto è una forma primitiva o un empty ed è dinamico aggiungi ai prefab
    if (GetCollider(newObj) != null || newObj.name.includes("Empty")) {
      if (newObj.userData.PhsxBehavior == 1) prefabs.push(newObj.clone());
    }
    if (_addToScene) Instantiate(newObj);
  }
}



function CreatePhysicalObj(_obj) {
  let mesh = _obj.clone();

  // Create cannon body
  let mass;
  if (mesh.userData.PhsxBehavior == 0 || mesh.userData.PhsxBehavior == null) mass = 0;
  else if (mesh.userData.PhsxBehavior == 1) mass = 5;
  body = new CANNON.Body({
    mass: mass
  });
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
  if (mesh.material.map != null) mat.map = mesh.material.map;
  // mat.shininess = _obj.material.metalness * 1000;
  mesh.material = mat;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  scene.add(mesh);

  // Output mesh with body
  mesh.body = body;
  mesh.userData.PhsxBehavior = _obj.userData.PhsxBehavior;
  return mesh;
}



function CreatePhysicalGroup(_obj, canBreak = true) {
  let col, mat, childShape;
  let allMeshes = [];
  let nChildren = _obj.children.length;

  // Create Body// Create body
  let mass;
  if (_obj.userData.PhsxBehavior == 0 || _obj.userData.PhsxBehavior == null) mass = 0;
  else if (_obj.userData.PhsxBehavior == 1) mass = 5 * nChildren;
  body = new CANNON.Body({
    mass: mass
  });

  // Create cannon shapes
  for (let i = 0; i < nChildren; i++) {
    let child = _obj.children[i];

    if (child.children.length == 0) {
      childShape = GetCollider(child);
      if (childShape == null) return;
      body.addShape(childShape,
        new CANNON.Vec3(child.position.x, child.position.y, child.position.z),
        new CANNON.Quaternion(child.quaternion.x, child.quaternion.y, child.quaternion.z, child.quaternion.w)
      );
    } else {
      for (let j = 0; j < child.children.length; j++) {
        let grandchild = child.children[j];

        childShape = GetCollider(grandchild);
        if (childShape == null) return;
        body.addShape(childShape,
          new CANNON.Vec3(grandchild.position.x + child.position.x, grandchild.position.y + child.position.y, grandchild.position.z + child.position.z),
          new CANNON.Quaternion(grandchild.quaternion.x + child.quaternion.x, grandchild.quaternion.y + child.quaternion.y, grandchild.quaternion.z + child.quaternion.z, grandchild.quaternion.w)
        );
      }
    }
  }

  // Create group
  let group = new THREE.Group();
  group.position.set(_obj.position.x, _obj.position.y, _obj.position.z);
  group.quaternion.set(_obj.quaternion.x, _obj.quaternion.y, _obj.quaternion.z, _obj.quaternion.w);

  // Create meshes
  for (let i = 0; i < nChildren; i++) {
    let child = _obj.children[i];

    if (child.children.length == 0) {
      // If child is a single mesh
      col = "#" + child.material.color.getHexString();
      mat = new THREE.MeshPhongMaterial({
        color: col
      });
      if (child.material.map != null) mat.map = child.material.map;
      child.material = mat;
      child.castShadow = true;
      child.receiveShadow = true;
      child.frustumCulled = false;
      group.add(child.clone());
    } else {
      // if child is a group
      let subGroup = new THREE.Group();
      subGroup.name = "SubEmpty";
      subGroup.position.set(child.position.x, child.position.y, child.position.z);
      subGroup.quaternion.set(child.quaternion.x, child.quaternion.y, child.quaternion.z, child.quaternion.w);
      for (let j = 0; j < child.children.length; j++) {
        let grandchild = _obj.children[i].children[j];

        col = "#" + grandchild.material.color.getHexString();
        mat = new THREE.MeshPhongMaterial({
          color: col
        });
        if (grandchild.material.map != null) mat.map = grandchild.material.map;
        grandchild.material = mat;
        grandchild.castShadow = true;
        grandchild.receiveShadow = true;
        grandchild.frustumCulled = false;
        subGroup.add(grandchild.clone());
      }
      group.add(subGroup);
    }
  }

  // Adjust body position
  body.position.set(group.position.x, group.position.y, group.position.z);
  body.quaternion.set(group.quaternion.x, group.quaternion.y, group.quaternion.z, group.quaternion.w);

  // Account for collisions
  // if (canBreak) {
  //   body.addEventListener("collide", function(e) {
  //     var relativeVelocity = e.contact.getImpactVelocityAlongNormal();
  //     if (Math.abs(relativeVelocity) > explosionVel) {
  //       Explode(group);
  //     }
  //   });
  // }
  body.breakable = canBreak;

  // Add to world
  group.body = body;
  group.name = "Empty";
  group.userData.PhsxBehavior = _obj.userData.PhsxBehavior;
  return group;
}



function GetCollider(_mesh) {
  let _shape;
  if (!_mesh.isMesh) return null;

  // returns a cannon shape depending on the type of solid and its bounding box

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



function Instantiate(newObj, canBreak) {
  let phsxObj = null;

  // Chooses whether to return a new mesh or group depepending on the architecture
  if (newObj.isMesh) {
    phsxObj = CreatePhysicalObj(newObj);
  } else if (newObj.name.includes("Empty") && newObj.children.length > 0) {
    phsxObj = CreatePhysicalGroup(newObj, canBreak);
  } else {
    console.log("No Phisics");
  }

  if (phsxObj == null) return null;

  // Add to the world and scene
  if (phsxObj.userData.PhsxBehavior == 0) {
    // If static
    for (let i = 0; i < phsxObj.body.shapes.length; i++) {
      staticGroup.body.addShape(phsxObj.body.shapes[i],
        new CANNON.Vec3(phsxObj.position.x, phsxObj.position.y, phsxObj.position.z),
        new CANNON.Quaternion(phsxObj.quaternion.x, phsxObj.quaternion.y, phsxObj.quaternion.z, phsxObj.quaternion.w)
      );
    }
    staticGroup.add(phsxObj);
  }
  if (phsxObj.userData.PhsxBehavior == 1) {
    // If dynamic
    objects.push(phsxObj);
    world.add(phsxObj.body);
    scene.add(phsxObj);
  }

  return phsxObj;
}



function SpawnObj() {

  let index = Math.floor(Math.random() * prefabs.length);

  for (let i = 0; i < objects.length; i++) {
    if (prefabs[index].children.length == objects[i].children.length) {
      console.log("Non spawnare");
      return;
    }
  }

  let spawned = Instantiate(prefabs[index].clone());

  if (spawned == null) return;
}


function Click() {

  raycaster.setFromCamera(mouse, camera);
  const intersect = raycaster.intersectObjects(objects, true)[0];
  if (intersect == null) return;

  let direction = new CANNON.Vec3(intersect.point.x - camera.position.x, intersect.point.y - camera.position.y, intersect.point.z - camera.position.z);

  if (intersect.object.parent == scene) {
    Explode(intersect.object, direction);
  } else if (intersect.object.parent.parent == scene) {
    Explode(intersect.object.parent, direction);
  } else if (intersect.object.parent.parent.parent == scene) {
    Explode(intersect.object.parent.parent, direction);
  }
}



function Explode(_group, _raycastVel = new CANNON.Vec3(0, 0, 0)) {
  if (!_group.body.breakable) {
    _raycastVel.mult(3);
    _raycastVel.y = 4;
    _group.body.velocity = _raycastVel;
    return;
  }

  let velocity = _group.body.velocity;
  let pos = _group.body.position;

  let nSubItems = _group.children.length;
  for (let i = 0; i < nSubItems; i++) {
    let child = _group.children[0];
    scene.attach(child);
    child.userData.PhsxBehavior = 1;

    let newObj = Instantiate(child, false);

    // if (insanity) {
    //   newObj.body.velocity = velocity;  //PER FARLO IMPAZZIRE
    // } else {
      let newPos = new CANNON.Vec3(newObj.position.x, newObj.position.y, newObj.position.z);
      let centerVel = pos.vsub(newPos).mult(15);
      console.log(_raycastVel);
      newObj.body.velocity = centerVel.vadd(_raycastVel);
    // }

    scene.remove(child);
  }

  Delete(_group);
}



function Delete(item) {
  // Deletes object both from scene and cannon world

  if (item.body != null) bodiesToRemove.push(item.body);
  scene.remove(item);
  objects = objects.filter(function(e) {
    return e !== item;
  })
  disappearingObjs = disappearingObjs.filter(function(e) {
    return e !== item;
  })
}


function ToggleEarthquake(ele) {
  earthquake = !earthquake;

  if (earthquake) {
    ele.style.color = "lime";
  } else {
    ele.style.color = "black";
  }
}



function ToggleTornado(ele) {
  tornado = !tornado;

  if (tornado) {
    ele.style.color = "lime";
  } else {
    ele.style.color = "black";
  }
}


function ToggleInsanity(ele) {
  insanity = !insanity;

  if (insanity) {
    ele.style.color = "lime";
  } else {
    ele.style.color = "black";
  }
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
