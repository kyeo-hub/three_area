// 工具函数

import * as THREE from 'three';
import { camera, renderer, scene } from './world';
import { cursorHoverObjects, loadedAppFont } from '../app'; // Import loadedAppFont
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js'; // Import TextGeometry

export const pickPosition = { x: 0, y: 0 };

// 相机经过贴图位置调整
export function rotateCamera(ballPosition) {
  var camPos = new THREE.Vector3(
    camera.position.x,
    camera.position.y,
    camera.position.z
  );

  var targetPos;

  //1
  if (
    (ballPosition.position.x < 77 &&
      ballPosition.position.x > 42 &&
      ballPosition.position.z > -20 &&
      ballPosition.position.z < 40) ||
    (ballPosition.position.x < -2 && ballPosition.position.z < -28) ||
    (ballPosition.position.x < -25 &&
      ballPosition.position.x > -70 &&
      ballPosition.position.z > -10 &&
      ballPosition.position.z < 40)
  ) {
    targetPos = new THREE.Vector3(
      ballPosition.position.x,
      ballPosition.position.y + 50,
      ballPosition.position.z + 40
    );
  }

  //2
  else if (
    ballPosition.position.x > -3 &&
    ballPosition.position.x < 22 &&
    ballPosition.position.z > 31 &&
    ballPosition.position.z < 58
  ) {
    targetPos = new THREE.Vector3(
      ballPosition.position.x,
      ballPosition.position.y + 50,
      ballPosition.position.z + 40
    );
  }

  //3
  else if (ballPosition.position.z > 50) {
    targetPos = new THREE.Vector3(
      ballPosition.position.x,
      ballPosition.position.y + 10,
      ballPosition.position.z + 40
    );
  }

  else {
    targetPos = new THREE.Vector3(
      ballPosition.position.x,
      ballPosition.position.y + 30,
      ballPosition.position.z + 60
    );
  }

  camPos.lerp(targetPos, 0.033);
  camera.position.copy(camPos);
  camera.lookAt(ballPosition.position);
}

export function getCanvasRelativePosition(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) * renderer.domElement.width) / rect.width,
    y: ((event.clientY - rect.top) * renderer.domElement.height) / rect.height,
  };
}

// Function to show a temporary copy text notification
function showCopyTextNotification(position, message) {
  if (!loadedAppFont) { // Use the globally loaded font
    console.error('Font not loaded for copy notification.');
    return;
  }

  // Use TextGeometry directly
  const textGeometry = new TextGeometry(message, {
    font: loadedAppFont, // Use the imported font
    depth: 1,
    size: 1.5, // Size of the text (increased slightly)
    height: 0.2, // Thickness of the text (increased slightly)
    curveSegments: 12,
  });

  textGeometry.computeBoundingBox();
  textGeometry.computeVertexNormals();

  // Center the text geometry
  const textMid = -0.5 * (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x);
  textGeometry.translate(textMid, 0, 0);

  const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 }); // White text with transparency
  const textMesh = new THREE.Mesh(textGeometry, textMaterial);

  // Position the text slightly above the clicked object
  const notificationPosition = position.clone();
  notificationPosition.y += 3; // Adjust height as needed
  textMesh.position.copy(notificationPosition);
  // textMesh.lookAt(camera.position); // Don't make it look at camera for bouncing effect

  scene.add(textMesh); // Add to the scene

  // Animation variables
  const startTime = performance.now();
  const duration = 2000; // 2 seconds for animation and display

  function animateNotification() {
    const elapsed = performance.now() - startTime;
    const progress = elapsed / duration;

    if (progress < 1) {
      // Bounce up and fade out
      textMesh.position.y = notificationPosition.y + progress * 3; // Move upwards over time
      textMesh.material.opacity = 1 - progress; // Fade out

      requestAnimationFrame(animateNotification);
    } else {
      scene.remove(textMesh); // Remove after animation
      // Optional: Dispose geometry and material to free memory
      textMesh.geometry.dispose();
      textMesh.material.dispose();
    }
  }

  animateNotification(); // Start animation
}


export async function launchClickPosition(event) { // Keep original name, make async
  const pos = getCanvasRelativePosition(event);
  pickPosition.x = (pos.x / renderer.domElement.width) * 2 - 1;
  pickPosition.y = (pos.y / renderer.domElement.height) * -2 + 1; // note we flip Y

  const myRaycaster = new THREE.Raycaster();
  myRaycaster.setFromCamera(pickPosition, camera);
  // 探测射线相交
  const intersectedObjects = myRaycaster.intersectObjects(scene.children);
  if (intersectedObjects.length) {
    const pickedObject = intersectedObjects[0].object;
    // Check if the object has a URL or a click action defined
    if (pickedObject.userData && pickedObject.userData.URL) {
      const clickAction = pickedObject.userData.clickAction || 'jump'; // Default to jump if action is not specified

      if (clickAction === 'copy') {
        try {
          await navigator.clipboard.writeText(pickedObject.userData.URL);
          console.log('URL copied to clipboard:', pickedObject.userData.URL);

          // Show the text notification
          showCopyTextNotification(pickedObject.position, 'Copied!');

        } catch (err) {
          console.error('Failed to copy URL: ', err);
          // TODO: Optionally add visual error notification (e.g., temporary red box)
          // For now, just log the error
        }
      } else if (clickAction === 'jump') {
        window.open(pickedObject.userData.URL, '_blank'); // Open in new tab
      }
    } else {
      // Object has no URL or userData, do nothing
      return;
    }
  }
}

export function launchHover(event) {
  event.preventDefault();
  var mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  var raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  var intersects = raycaster.intersectObjects(cursorHoverObjects);

  if (intersects.length > 0) {
    document.getElementById('document-body').style.cursor = 'pointer';
  } else {
    document.getElementById('document-body').style.cursor = 'default';
  }
}
