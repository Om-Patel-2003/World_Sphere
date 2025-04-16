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

// 🌐 Blue marker for clicked location
const markerGeometry = new THREE.SphereGeometry(0.05, 16, 16);
const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x00aaff });
const markerMesh = new THREE.Mesh(markerGeometry, markerMaterial);
markerMesh.visible = false;
scene.add(markerMesh);

// Ensure the progress bar container is appended to the DOM and visible when toggled
const progressBarContainer = document.createElement("div");
progressBarContainer.id = "progress-bar-container";
progressBarContainer.style.position = "fixed";
progressBarContainer.style.right = "0";
progressBarContainer.style.bottom = "0";
progressBarContainer.style.width = "20px";
progressBarContainer.style.height = "100%";
progressBarContainer.style.borderRadius = "0";
progressBarContainer.style.overflow = "hidden";
progressBarContainer.style.border = "none";
progressBarContainer.style.display = "none"; // Initially hidden
progressBarContainer.innerHTML = `
  <div id="progress-bar-fill" style="
    width: 100%;
    height: 0;
    background-color: #4caf50;
    border-radius: 0;
    clip-path: none;
  "></div>
`;
document.body.appendChild(progressBarContainer);

// Ensure the toggle button is functional
const toggleButton = document.createElement("div");
toggleButton.id = "progress-bar-toggle";
toggleButton.style.position = "fixed";
toggleButton.style.left = "30px";
toggleButton.style.right = "unset";
toggleButton.style.bottom = "30px";
toggleButton.style.width = "30px";
toggleButton.style.height = "30px";
toggleButton.style.backgroundColor = "#333";
toggleButton.style.color = "#fff";
toggleButton.style.display = "flex";
toggleButton.style.alignItems = "center";
toggleButton.style.justifyContent = "center";
toggleButton.style.cursor = "pointer";
toggleButton.style.borderRadius = "50%";
toggleButton.textContent = "▲";
document.body.appendChild(toggleButton);

let isProgressBarVisible = false;
toggleButton.addEventListener("click", () => {
  isProgressBarVisible = !isProgressBarVisible;
  progressBarContainer.style.display = isProgressBarVisible ? "flex" : "none";
  toggleButton.textContent = isProgressBarVisible ? "▼" : "▲";
});

// Load visited countries from sessionStorage
const visitedCountries = new Set(
  JSON.parse(sessionStorage.getItem("visitedCountries")) || []
);
const totalCountries = 4; // India, USA, Japan, Australia

// Update progress bar to use rectangular filling
function updateProgressBar() {
  const progress = (visitedCountries.size / totalCountries) * 100;
  const progressBarFill = document.getElementById("progress-bar-fill");
  progressBarFill.style.height = `${progress}%`;

  // Update progress bar to use single circular white dots during progress filling
  progressBarFill.style.backgroundImage = `radial-gradient(circle, white 50%, transparent 50%)`;
  progressBarFill.style.backgroundSize = "20px 20px";
  progressBarFill.style.backgroundColor = "transparent";
}

// Save visited countries to sessionStorage
function saveVisitedCountry(country) {
  visitedCountries.add(country);
  sessionStorage.setItem(
    "visitedCountries",
    JSON.stringify([...visitedCountries])
  );
}

// Initialize progress bar on page load
window.addEventListener("DOMContentLoaded", () => {
  updateProgressBar();
});

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

    const isAustralia =
      polarAngle >= 100 &&
      polarAngle <= 134 &&
      azimuthAngle >= -153 &&
      azimuthAngle <= -113;

    const isJapanRegion1 =
      azimuthAngle >= -144.8 &&
      azimuthAngle <= -141.0 &&
      polarAngle >= 35.34 &&
      polarAngle <= 44.02;

    const isJapanRegion2 =
      azimuthAngle >= -145.3 &&
      azimuthAngle <= -129.3 &&
      polarAngle >= 44.4 &&
      polarAngle <= 59.0;

    const clickedJapan = isJapanRegion1 || isJapanRegion2;
    var isUSARegion1 =
      polarAngle >= 41.0 &&
      polarAngle <= 64.0 &&
      azimuthAngle >= 69.0 &&
      azimuthAngle <= 125.0;

    var isUSARegion2 =
      polarAngle >= 59 &&
      polarAngle <= 60 &&
      azimuthAngle >= 100 &&
      azimuthAngle <= 102;

    var isUSARegion3 =
      polarAngle >= 59.5 &&
      polarAngle <= 60 &&
      azimuthAngle >= 104.2 &&
      azimuthAngle <= 104.8;

    const isMexico =
      polarAngle >= 59.3 &&
      polarAngle <= 64 &&
      azimuthAngle >= 99.5 &&
      azimuthAngle <= 117.1;

    if (isMexico) {
      console.log("You clicked on Mexico!");
      isUSARegion1 = false; // Disable USA region click
      isUSARegion2 = false; // Disable USA region click
      isUSARegion3 = false; // Disable USA region click
    } else {
      console.log("This is not Mexico");
    }

    if (isUSARegion1 || isUSARegion2 || isUSARegion3) {
      saveVisitedCountry("USA");
      updateProgressBar();
      console.log("You clicked on the USA!");
    } else {
      console.log("This is not the USA");
    }

    if (clickedJapan) {
      saveVisitedCountry("Japan");
      updateProgressBar();
      console.log("You clicked near Japan");
    }

    if (isUSARegion1 || isUSARegion2 || isUSARegion3) {
      saveVisitedCountry("USA");
      updateProgressBar();
      console.log("You clicked on the USA!");
    } else {
      console.log("This is not the USA");
    }

    if (clickedJapan) {
      saveVisitedCountry("Japan");
      updateProgressBar();
      console.log("You clicked near Japan");

      // 📍 Show marker just above globe surface
      // const markerPosition = intersectPoint.multiplyScalar(globeRadius + 0.05);
      // markerMesh.position.copy(markerPosition);
      // markerMesh.visible = true;
    } else {
      console.log("This is not Japan");
      markerMesh.visible = false;
    }

    if (isIndia) {
      saveVisitedCountry("India");
      updateProgressBar();
      console.log("You clicked on India!");
      window.location.href = "./India/India.html";
    } else {
      console.log("This is not India");
    }

    if (isAustralia) {
      saveVisitedCountry("Australia");
      updateProgressBar();
      console.log("You clicked near Australia!");
    } else {
      console.log("This is not near Australia");
    }
  }
}

// Ensure the globe rendering logic is not affected
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

// Restore original event listeners
window.addEventListener("resize", handleWindowResize, false);
window.addEventListener("click", onMouseClick, false);

animate();
