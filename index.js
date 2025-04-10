import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import getStarfield from "./src/getStarfield.js";
import { drawThreeGeo } from "./src/threeGeoJSON.js";

const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.3);

const camera = new THREE.PerspectiveCamera(75, w / h, 1, 100);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const stars = getStarfield({ numStars: 1000, fog: false });
scene.add(stars);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const countryMeshes = [];

const globeRadius = 2;
const globeMesh = new THREE.Mesh(
  new THREE.SphereGeometry(globeRadius, 64, 64),
  new THREE.MeshBasicMaterial({ visible: false })
);
scene.add(globeMesh);

fetch("./geojson/countries_states.geojson")
  .then((response) => response.json())
  .then((data) => {
    const countriesGroup = drawThreeGeo({
      json: data,
      radius: globeRadius,
      materialOptions: { color: 0x80ff80 },
    });

    countriesGroup.children.forEach((mesh) => {
      mesh.userData.feature = mesh.userData.feature;
      countryMeshes.push(mesh);
    });

    scene.add(countriesGroup);
  });

function onMouseClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(globeMesh);

  if (intersects.length > 0) {
    const intersectPoint = intersects[0].point.clone().normalize();

    const theta = Math.atan2(intersectPoint.z, intersectPoint.x);
    const phi = Math.acos(intersectPoint.y);

    const azimuthAngle = THREE.MathUtils.radToDeg(theta);
    const polarAngle = THREE.MathUtils.radToDeg(phi);

    console.log(`Azimuth Angle: ${azimuthAngle.toFixed(2)} degrees`);
    console.log(`Polar Angle: ${polarAngle.toFixed(2)} degrees`);

    const isIndia =
      polarAngle >= 55 &&
      polarAngle <= 80 &&
      azimuthAngle >= -92.5 &&
      azimuthAngle <= -69.2;

    if (isIndia) {
      console.log("You clicked on India!");
      window.location.href = "./India/India.html";
    } else {
      console.log("This is not India");
    }
  }
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  controls.update();
}

function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", handleWindowResize, false);
window.addEventListener("click", onMouseClick, false);

animate();
