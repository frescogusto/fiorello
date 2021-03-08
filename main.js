var world, mass, body, shape, timeStep = 1 / 60,
  camera, scene, renderer, geometry, material, mesh;

// To be synced
objects = [];
var N = 0;

const loader = new THREE.GLTFLoader();

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

  for (let index = 0; index < 10; index++) {
    addObject(index * 1.5 - 5, 5, Math.random() * 3, 'models/frigo.gltf' )
  }


}

function initThree() {

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 100);
  camera.position.z = 10;
  camera.position.y = 5;
  camera.lookAt(0,0,0)
  scene.add(camera);

  // floor
  geometry = new THREE.PlaneGeometry(100, 100, 1, 1);
  //geometry.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );
  material = new THREE.MeshLambertMaterial({
    color: 0x777777
  });
  markerMaterial = new THREE.MeshLambertMaterial({
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

  // var light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 1 );
  // scene.add( light );

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);

  document.body.appendChild(renderer.domElement);

}

function animate() {

  requestAnimationFrame(animate);
  updatePhysics();
  render();

}

function updatePhysics() {

  // Step the physics world
  world.step(timeStep);

  for (var i = 0; i !== objects.length; i++) {
    objects[i].position.copy(objects[i].body.position);
    objects[i].quaternion.copy(objects[i].body.quaternion);
    // objects[i].bounds.position.copy(objects[i].body.position);
    // objects[i].bounds.quaternion.copy(objects[i].body.quaternion);
  }

  // Copy coordinates from Cannon.js to Three.js
  // mesh.position.copy(body.position);
  // mesh.quaternion.copy(body.quaternion);

}

function render() {

  renderer.render(scene, camera);

}

function addObject(x, y, z, url) {

  loader.load(
    // resource URL
    url,
    // called when the resource is loaded
    function ( gltf ) {

      gltf.scene.traverse(function (child) {
        if(child.type == "Mesh") {
          console.log(child.name)
          if(child.name == "*") {
            console.log(child);
          }
        }
      });
  
      var obj = gltf.scene.children[0]
      console.log(obj);
      
      obj.position.set(x,y,z)
      obj.scale.set(0.4,0.4,0.4)
      scene.add( obj );

      var mass = 5,
        radius = 1;
      boxShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
      boxBody = new CANNON.Body({
        mass: mass
      });

    
      boxBody.addShape(boxShape);
      boxBody.position.set(x, y, z);
      boxBody.quaternion.set(Math.random(), Math.random(), Math.random(), 1 );
      world.add(boxBody);
      obj.body = boxBody;
      objects.push(obj);

  
    },
    // called while loading is progressing
    function ( xhr ) {
  
      console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
  
    },
    // called when loading has errors
    function ( error ) {
  
      console.log( 'An error happened' );
  
    }
  );


  // var cubeGeo = new THREE.BoxGeometry(1, 1, 1, 10, 10);
  // var cubeMaterial = new THREE.MeshPhongMaterial({
  //   color: 0x888888
  // });
  // cubeMesh = new THREE.Mesh(cubeGeo, cubeMaterial);
  // scene.add(cubeMesh);

  // var mass = 5,
  //   radius = 1;
  // boxShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
  // boxBody = new CANNON.Body({
  //   mass: mass
  // });

  // boxBody.addShape(boxShape);
  // boxBody.position.set(x, y, z);
  // world.add(boxBody);
  // cubeMesh.body = boxBody;

  // objects.push(cubeMesh);
}
