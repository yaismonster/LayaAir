import { CameraEventFlags } from "../../../../d3/core/Camera";
import { RenderContext3D } from "../../../../d3/core/render/RenderContext3D";
import { Scene3D } from "../../../../d3/core/scene/Scene3D";
import { RenderPassBase } from "../../Runtime/RenderPassBase";
import { RendererBase } from "../../Runtime/RendererBase";

export class PostProcessPass extends RenderPassBase {

    constructor(evt: CameraEventFlags) {
        super(evt);
        this.passName = "post-process"
    }

    public Execute(context: RenderContext3D, scene: Scene3D, renderer: RendererBase): void {
        //TODO.
        let camera = renderer.currentCamera;
        let postProcess = camera.postProcess;
        if (postProcess && postProcess.enable) {
            postProcess.commandContext = context;
            postProcess._render(camera);
            postProcess._applyPostProcessCommandBuffers();
        } 
        else {
            var canvasWidth: number = camera._getCanvasWidth(), canvasHeight: number = camera._getCanvasHeight();
            if (camera._offScreenRenderTexture) {
                let viewport = camera.viewport;
                camera._screenOffsetScale.setValue(viewport.x / canvasWidth, (canvasHeight - viewport.y - viewport.height) / canvasHeight, viewport.width / canvasWidth, viewport.height / canvasHeight);
                camera._internalCommandBuffer._camera = camera;
                camera._internalCommandBuffer._context = context;
                camera._internalCommandBuffer.blitScreenQuad(camera._internalRenderTexture, camera._offScreenRenderTexture, camera._screenOffsetScale, null, null, 0);
                camera._internalCommandBuffer._apply();
                camera._internalCommandBuffer.clear();
            }
        }
    }

}