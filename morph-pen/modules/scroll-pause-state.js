import * as THREE from "/morph-pen/vendor/three/build/three.webgpu.js";

export function createScrollPauseState({
  heroStopProgress,
  pauseWrapperEntryRatio,
  heroCanvasTrackSelector = ".hero-canvas-track",
  pauseWrapperSelector = ".page-entry-content-inner",
  splitWrapperSelector = ".page-entry-split-trigger",
  wrapperSplitDistanceVh = 100,
}) {
  let heroCanvasTrack = null;
  let pauseWrapper = null;
  let splitWrapper = null;
  let cachedScrollProgress = 0;
  let cachedPauseWrapperEntered = false;
  let cachedShouldPause = false;

  const updateSceneScrollProgress = () => {
    heroCanvasTrack ??= document.querySelector(heroCanvasTrackSelector);
    if (!heroCanvasTrack) return 0;
    const rect = heroCanvasTrack.getBoundingClientRect();
    const total = Math.max(heroCanvasTrack.offsetHeight - window.innerHeight, 1);
    cachedScrollProgress = THREE.MathUtils.clamp(-rect.top / total, 0, 1);
    return cachedScrollProgress;
  };

  const getSceneScrollProgress = () => {
    if (!heroCanvasTrack) {
      return updateSceneScrollProgress();
    }

    return cachedScrollProgress;
  };

  const updatePauseWrapperState = () => {
    pauseWrapper ??= document.querySelector(pauseWrapperSelector);
    if (!pauseWrapper) return false;
    const rect = pauseWrapper.getBoundingClientRect();
    cachedPauseWrapperEntered = rect.top <= window.innerHeight * pauseWrapperEntryRatio;
    return cachedPauseWrapperEntered;
  };

  const getWrapperSplitProgress = () => {
    splitWrapper ??= document.querySelector(splitWrapperSelector);
    if (!splitWrapper) return 0;
    const rect = splitWrapper.getBoundingClientRect();
    const splitDistance = Math.max(window.innerHeight * (wrapperSplitDistanceVh / 100), 1);
    return THREE.MathUtils.clamp((window.innerHeight - rect.top) / splitDistance, 0, 1);
  };

  const isInsidePauseWrapper = () => {
    if (!pauseWrapper) {
      return updatePauseWrapperState();
    }

    return cachedPauseWrapperEntered;
  };

  const updatePauseState = () => {
    const scrollProgress = getSceneScrollProgress();
    const pauseWrapperEntered = isInsidePauseWrapper();
    cachedShouldPause = scrollProgress >= heroStopProgress && pauseWrapperEntered;
    return cachedShouldPause;
  };

  const refresh = () => {
    updateSceneScrollProgress();
    updatePauseWrapperState();
    updatePauseState();
  };

  return {
    getSceneScrollProgress,
    getWrapperSplitProgress,
    isInsidePauseWrapper,
    refresh,
    updatePauseState,
    updatePauseWrapperState,
    updateSceneScrollProgress,
    shouldPause: () => cachedShouldPause,
  };
}
