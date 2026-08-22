import * as THREE from "/morph-pen/vendor/three/build/three.webgpu.js";

export function createRenderLoop({ onFrame, onShouldPause, onScrollStateChange }) {
  let frameId = 0;
  let isRunning = false;
  let disposed = false;
  let accumulatedElapsed = 0;
  const clock = new THREE.Clock();

  const stop = () => {
    if (!isRunning) return;
    isRunning = false;
    window.cancelAnimationFrame(frameId);
    frameId = 0;
    clock.stop();
  };

  const renderFinalFrame = () => {
    onFrame(0, accumulatedElapsed);
  };

  const animate = () => {
    if (disposed || !isRunning) return;

    if (onShouldPause()) {
      renderFinalFrame();
      stop();
      return;
    }

    const dt = clock.getDelta();
    accumulatedElapsed += dt;
    onFrame(dt, accumulatedElapsed);
    frameId = window.requestAnimationFrame(animate);
  };

  const start = () => {
    if (isRunning || onShouldPause()) return;
    isRunning = true;
    clock.start();
    clock.getDelta();
    frameId = window.requestAnimationFrame(animate);
  };

  const handleScroll = () => {
    onScrollStateChange?.();

    if (onShouldPause()) {
      renderFinalFrame();
      stop();
      return;
    }

    start();
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      stop();
      return;
    }

    handleScroll();
  };

  const dispose = () => {
    disposed = true;
    stop();
  };

  return {
    dispose,
    handleScroll,
    handleVisibilityChange,
    start,
    stop,
  };
}
