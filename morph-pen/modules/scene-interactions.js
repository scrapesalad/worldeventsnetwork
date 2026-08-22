export function getResponsiveSceneScale(width) {
  if (width <= 600) return 0.72;
  if (width <= 800) return 0.8;
  if (width <= 1000) return 0.88;
  return 1;
}

export function createResizeController({
  mount,
  camera,
  renderer,
  pointerInput,
  scrollPauseState,
  onScaleChange,
}) {
  const onResize = () => {
    const width = Math.max(mount.clientWidth, 1);
    const height = Math.max(mount.clientHeight, 1);

    onScaleChange(getResponsiveSceneScale(width));
    pointerInput.updateBounds();
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    scrollPauseState.refresh();
  };

  return {
    onResize,
  };
}

export function attachSceneEventBindings({
  canvas,
  pointerInput,
  renderLoop,
  onResize,
}) {
  canvas.addEventListener("pointerdown", pointerInput.onPointerDown);
  window.addEventListener("pointermove", pointerInput.onPointerMove);
  window.addEventListener("pointerup", pointerInput.endDrag);
  window.addEventListener("pointercancel", pointerInput.endDrag);
  window.addEventListener("pointerleave", pointerInput.resetPointer);
  window.addEventListener("scroll", renderLoop.handleScroll, { passive: true });
  window.addEventListener("resize", onResize);
  document.addEventListener("visibilitychange", renderLoop.handleVisibilityChange);

  return () => {
    canvas.removeEventListener("pointerdown", pointerInput.onPointerDown);
    window.removeEventListener("pointermove", pointerInput.onPointerMove);
    window.removeEventListener("pointerup", pointerInput.endDrag);
    window.removeEventListener("pointercancel", pointerInput.endDrag);
    window.removeEventListener("pointerleave", pointerInput.resetPointer);
    window.removeEventListener("scroll", renderLoop.handleScroll);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", renderLoop.handleVisibilityChange);
  };
}
