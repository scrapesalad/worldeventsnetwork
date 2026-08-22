import { DEFAULT_MUSIC_REACTIVE_STATE, MUSIC_REACTIVE_EVENT } from "/music-reactive-bridge.js";

export function createMusicReactiveInput() {
  let state = { ...DEFAULT_MUSIC_REACTIVE_STATE };

  const handleReactiveUpdate = (event) => {
    state = {
      ...DEFAULT_MUSIC_REACTIVE_STATE,
      ...event.detail,
    };
  };

  window.addEventListener(MUSIC_REACTIVE_EVENT, handleReactiveUpdate);

  return {
    dispose() {
      window.removeEventListener(MUSIC_REACTIVE_EVENT, handleReactiveUpdate);
    },
    getState() {
      return state;
    },
  };
}
