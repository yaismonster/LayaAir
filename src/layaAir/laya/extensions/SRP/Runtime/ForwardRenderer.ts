import { RendererBase } from "./RendererBase";
import { DrawObjectPass } from "../Passes/DrawObjectPass";
import { DrawSkyBoxPass } from "../Passes/DrawSkyBoxPass";
import { CameraData, CameraEventFlags } from "../../../d3/core/Camera";
import { RenderContext3D } from "../../../d3/core/render/RenderContext3D";
import { PostProcessPass } from "../Passes/PostProcess/PostProcessPass";
import { Stat } from "../../../utils/Stat";
import { Scene3D } from "../../../d3/core/scene/Scene3D";
import { PreRenderPass } from "../Passes/PreRenderPass";
import { DrawShadowCasterPass } from "../Passes/DrawShadowCasterPass";
import { CopyColorPass } from "../Passes/CopyColorPass";
import { CacheDepthPass } from "../Passes/CacheDepthPass";
import { DrawDepthPass } from "../Passes/DrawDepthPass";

export class ForwardRenderer extends RendererBase {

    shadowCasterPass: DrawShadowCasterPass;
    preRenderPass: PreRenderPass;
    drawDepthPass: DrawDepthPass;
    forwarOpaquePass: DrawObjectPass;
    copyColorPass: CopyColorPass;
    skyBosPass: DrawSkyBoxPass;
    transparentPass: DrawObjectPass;

    postProcessPass: PostProcessPass;
    cacheDepthPass: CacheDepthPass;

    constructor() {
        super();
        this.shadowCasterPass = new DrawShadowCasterPass(CameraEventFlags.BeforeRenderingShadows);
        //pre
        this.preRenderPass = new PreRenderPass(CameraEventFlags.BeforePrePasses);
        this.drawDepthPass = new DrawDepthPass(CameraEventFlags.BeforeDepthTexture);
        this.forwarOpaquePass = new DrawObjectPass(CameraEventFlags.BeforeForwardOpaque, true, this.opaqueCullingMask);
        this.copyColorPass = new CopyColorPass(CameraEventFlags.BeforeSkyBox - 1);
        this.skyBosPass = new DrawSkyBoxPass(CameraEventFlags.BeforeSkyBox);
        this.transparentPass = new DrawObjectPass(CameraEventFlags.BeforeTransparent, false, this.transparentCullingMask);
        this.postProcessPass = new PostProcessPass(CameraEventFlags.BeforeImageEffect);

        this.cacheDepthPass = new CacheDepthPass(CameraEventFlags.AfterEveryThing);
    }

    public Setup(context: RenderContext3D, scene: Scene3D, cameraData: CameraData): void {
        this.cameraData = cameraData;
        this.activeRenderTarget = cameraData.renderTex;
        let needShadowCaster = this.cameraData.needShadowCasterPass || this.cameraData.spotneedShadowCasterPass;
        if (needShadowCaster) {
            this.EnqueuePass(this.shadowCasterPass);
        }
        //_pre render
        this.EnqueuePass(this.preRenderPass);
        this.EnqueuePass(this.drawDepthPass);
        //_main render
        this.EnqueuePass(this.forwarOpaquePass);
        if (this.currentCamera.opaquePass) {
            this.EnqueuePass(this.copyColorPass);
        }
        this.EnqueuePass(this.skyBosPass);
        this.EnqueuePass(this.transparentPass);
        if (Stat.enablePostprocess && this.currentCamera._needInternalRenderTexture()) {
            this.EnqueuePass(this.postProcessPass);
        }

        //_after render
        if (needShadowCaster) {
            this.EnqueuePass(this.cacheDepthPass);
        }

        this.AddRenderFeaturePasses();
    }

}