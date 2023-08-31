import { render } from "../../../../Laya";
import { FilterMode } from "../../../RenderEngine/RenderEnum/FilterMode";
import { RenderTargetFormat } from "../../../RenderEngine/RenderEnum/RenderTargetFormat";
import { Camera, CameraClearFlags } from "../../../d3/core/Camera";
import { RenderContext3D } from "../../../d3/core/render/RenderContext3D";
import { BlitScreenQuadCMD } from "../../../d3/core/render/command/BlitScreenQuadCMD";
import { Scene3D } from "../../../d3/core/scene/Scene3D";
import { RenderTexture } from "../../../resource/RenderTexture";
import { RenderPassBase } from "../Runtime/RenderPassBase";
import { RendererBase } from "../Runtime/RendererBase";

export class PreRenderPass extends RenderPassBase{
    public Execute(context: RenderContext3D, scene: Scene3D, renderer: RendererBase): void {
        let camera = renderer.currentCamera;
        context.camera = camera;
        context.cameraShaderValue = camera._shaderValues;
        Camera._updateMark++;

        let needInternalRT = camera._needInternalRenderTexture();
        if (needInternalRT && !camera._offScreenRenderTexture && (camera.clearFlag == CameraClearFlags.DepthOnly || camera.clearFlag == CameraClearFlags.Nothing)) {
            if (RenderTexture.bindCanvasRender) {//解决iOS中使用CopyTexSubImage2D特别慢的bug
                if (RenderTexture.bindCanvasRender != camera._internalRenderTexture) {
                    var blit: BlitScreenQuadCMD = BlitScreenQuadCMD.create(RenderTexture.bindCanvasRender, camera._internalRenderTexture);
                    blit.setContext(context);
                    blit.run();
                    blit.recover();
                }
            } else {
                if (camera.enableHDR) {//internal RT is HDR can't directly copy
                    let viewport = camera.viewport;
                    var grabTexture: RenderTexture = RenderTexture.createFromPool(viewport.width, viewport.height, RenderTargetFormat.R8G8B8, RenderTargetFormat.DEPTH_16, false, 1);
                    grabTexture.filterMode = FilterMode.Bilinear;
                    camera.copySubFrameBuffertoTex(grabTexture, 0, 0, 0, viewport.x, RenderContext3D.clientHeight - (viewport.y + viewport.height), viewport.width, viewport.height);
                    // this._renderEngine.bindTexture(gl.TEXTURE_2D, grabTexture._getSource());
                    // gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, 0, 0, viewport.x, RenderContext3D.clientHeight - (viewport.y + viewport.height), viewport.width, viewport.height);
                    var blit: BlitScreenQuadCMD = BlitScreenQuadCMD.create(grabTexture, camera._internalRenderTexture);
                    blit.setContext(context);
                    blit.run();
                    blit.recover();
                    RenderTexture.recoverToPool(grabTexture);
                }
            }
        }
        
    }

}