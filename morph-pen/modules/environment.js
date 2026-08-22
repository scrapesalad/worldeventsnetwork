import * as THREE from "/morph-pen/vendor/three/build/three.webgpu.js";
import { EXRLoader } from "/morph-pen/vendor/three/examples/jsm/loaders/EXRLoader.js";
import { HDRLoader } from "/morph-pen/vendor/three/examples/jsm/loaders/HDRLoader.js";

export function createEnvironmentController({ renderer, scene, generatedEnvironment }) {
  let activeEnvironment = null;
  const exrLoader = new EXRLoader();
  const hdrLoader = new HDRLoader();

  const setEnvironmentTexture = (texture) => {
    const pmrem = new THREE.PMREMGenerator(renderer);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    const envMap = pmrem.fromEquirectangular(texture).texture;
    pmrem.dispose();
    texture.dispose?.();
    if (activeEnvironment && activeEnvironment !== generatedEnvironment) {
      activeEnvironment.dispose?.();
    }
    activeEnvironment = envMap;
    scene.environment = envMap;
  };

  const detectEnvironmentFormat = (url, hint = "") => {
    const target = `${hint} ${url}`.toLowerCase();
    if (target.includes(".exr") || target.includes("image/x-exr")) {
      return "exr";
    }
    return "hdr";
  };

  const buildParsedEnvironmentTexture = (texData, isHdr) => {
    const texture = new THREE.DataTexture(
      texData.data,
      texData.width,
      texData.height,
      texData.format ?? THREE.RGBAFormat,
      texData.type,
    );
    texture.colorSpace = texData.colorSpace ?? THREE.LinearSRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.flipY = isHdr;
    texture.needsUpdate = true;
    return texture;
  };

  const loadEnvironment = async (url, hint = "") => {
    const format = detectEnvironmentFormat(url, hint);
    const isHdr = format === "hdr";
    const loader = isHdr ? hdrLoader : exrLoader;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Environment request failed: ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    const texData = loader.parse(buffer);
    return buildParsedEnvironmentTexture(texData, isHdr);
  };

  const setFallbackEnvironment = () => {
    if (activeEnvironment && activeEnvironment !== generatedEnvironment) {
      activeEnvironment.dispose?.();
    }
    activeEnvironment = generatedEnvironment;
    scene.environment = generatedEnvironment;
  };

  const dispose = () => {
    if (activeEnvironment && activeEnvironment !== generatedEnvironment) {
      activeEnvironment.dispose?.();
    }
  };

  return {
    dispose,
    loadEnvironment,
    setEnvironmentTexture,
    setFallbackEnvironment,
  };
}
