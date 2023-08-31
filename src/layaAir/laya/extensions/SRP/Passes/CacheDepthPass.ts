import { Camera } from "../../../d3/core/Camera";
import { RenderContext3D } from "../../../d3/core/render/RenderContext3D";
import { Scene3D } from "../../../d3/core/scene/Scene3D";
import { RenderTexture } from "../../../resource/RenderTexture";
import { RenderPassBase } from "../Runtime/RenderPassBase";
import { RendererBase } from "../Runtime/RendererBase";

export class CacheDepthPass extends RenderPassBase{
    public Execute(context: RenderContext3D, scene: Scene3D, renderer: RendererBase): void {
        let camera = renderer.currentCamera;
        if (camera._cacheDepth && camera._internalRenderTexture) {
            if (camera._cacheDepthTexture)
                camera._cacheDepthTexture._inPool ? 0 : RenderTexture.recoverToPool(camera._cacheDepthTexture);
            camera._cacheDepthTexture = camera._internalRenderTexture;
        }
        Camera.depthPass.cleanUp();
    }

}