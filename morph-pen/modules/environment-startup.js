export function createStatusController(status) {
  return {
    show(message) {
      status.hidden = false;
      status.textContent = message;
    },
    hide() {
      status.hidden = true;
      status.textContent = "";
    },
  };
}

export async function initializeEnvironmentStartup({
  loadEnvironment,
  setEnvironmentTexture,
  setFallbackEnvironment,
  startupEnvironmentUrl,
  startupEnvironmentHint,
  statusController,
}) {
  setFallbackEnvironment();

  try {
    statusController.show("Loading Studio HDR...");
    const startupTexture = await loadEnvironment(
      startupEnvironmentUrl,
      startupEnvironmentHint,
    );
    setEnvironmentTexture(startupTexture);
    statusController.hide();
  } catch (error) {
    statusController.show("Environment fallback active.");
    window.setTimeout(() => statusController.hide(), 1200);
  }
}
