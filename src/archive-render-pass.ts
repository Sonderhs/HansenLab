import * as THREE from "three";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";

/** Prime depth only for fully opaque array surfaces before their costly physical
 * shading. Transmission's separate background capture retains its own depth.
 * Selected/returning files, procedural reveals and blended labels are excluded.
 */
export class ArchiveRenderPass extends RenderPass {
  opaqueDepth = false;
  private depth = new THREE.MeshDepthMaterial({
    colorWrite: false,
    side: THREE.DoubleSide,
  });
  private clearColorBefore = new THREE.Color();
  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    private array: () => THREE.InstancedMesh[],
  ) {
    super(scene, camera);
  }
  render(
    renderer: THREE.WebGLRenderer,
    write: THREE.WebGLRenderTarget,
    read: THREE.WebGLRenderTarget,
    delta = 0,
    mask = false,
  ) {
    if (
      !this.opaqueDepth ||
      (this.scene.background !== null &&
        !(this.scene.background instanceof THREE.Color))
    ) {
      super.render(renderer, write, read, delta, mask);
      return;
    }
    const visible = new Set(
      this.array().filter((mesh) => {
        const material = mesh.material as THREE.Material;
        return (
          mesh.visible &&
          material.depthWrite &&
          material.depthTest &&
          !material.transparent &&
          material.opacity === 1 &&
          !material.alphaTest &&
          material.side === THREE.DoubleSide &&
          !material.polygonOffset
        );
      }),
    );
    if (!visible.size) {
      super.render(renderer, write, read, delta, mask);
      return;
    }
    const hidden: THREE.Object3D[] = [];
    this.scene.traverseVisible((object) => {
      if (
        object instanceof THREE.Mesh &&
        !visible.has(object as THREE.InstancedMesh)
      )
        hidden.push(object);
    });
    const background = this.scene.background;
    const override = this.scene.overrideMaterial;
    const autoClear = renderer.autoClear;
    const shadowUpdate = renderer.shadowMap.needsUpdate;
    const clear = this.clear;
    const alpha = renderer.getClearAlpha();
    let completed = false;
    renderer.getClearColor(this.clearColorBefore);
    try {
      renderer.setRenderTarget(this.renderToScreen ? null : read);
      if (background instanceof THREE.Color)
        renderer.setClearColor(background, 1);
      renderer.clear();
      renderer.autoClear = false;
      renderer.shadowMap.needsUpdate = false;
      this.scene.background = null;
      this.scene.overrideMaterial = this.depth;
      for (const object of hidden) object.visible = false;
      renderer.render(this.scene, this.camera);
      for (const object of hidden) object.visible = true;
      this.scene.overrideMaterial = override;
      renderer.shadowMap.needsUpdate = shadowUpdate;
      this.clear = false;
      super.render(renderer, write, read, delta, mask);
      completed = true;
    } finally {
      for (const object of hidden) object.visible = true;
      this.scene.overrideMaterial = override;
      this.scene.background = background;
      renderer.autoClear = autoClear;
      if (!completed) renderer.shadowMap.needsUpdate = shadowUpdate;
      renderer.setClearColor(this.clearColorBefore, alpha);
      this.clear = clear;
    }
  }
  dispose() {
    this.depth.dispose();
  }
}
