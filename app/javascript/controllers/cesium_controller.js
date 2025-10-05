import { Controller } from "@hotwired/stimulus"
import { get } from "@rails/request.js"

const LAT = 9.991731983417829
const LON = -84.14353608828094

export default class extends Controller {
  static targets = ["container"]

  async connect() {
    const resp = await get("/cesium/token", { responseKind: "json" })
    if (!resp.ok) throw new Error("token fetch failed")
    const { token } = await resp.json
    Cesium.Ion.defaultAccessToken = token

    const viewer = new Cesium.Viewer(this.containerTarget, {
      terrain: Cesium.Terrain.fromWorldTerrain({
        requestVertexNormals: false,
        requestWaterMask: false
      }),
      baseLayerPicker: false,
      geocoder: false,
      timeline: false,
      animation: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      selectionIndicator: false,
      infoBox: false,
      shadows: false,
      // perf
      useBrowserRecommendedResolution: true,
      scene3DOnly: true,
      msaaSamples: 0
    })

    // PERF: render only on demand (we’ll trigger renders from our loop)
    viewer.scene.requestRenderMode = true
    viewer.scene.maximumRenderTimeChange = Infinity
    viewer.scene.fxaa = false
    viewer.resolutionScale = 1.0
    viewer.scene.globe.maximumScreenSpaceError = 16
    viewer.scene.globe.depthTestAgainstTerrain = false

    // NIGHT FEEL (force local night, dim the sky)
    viewer.scene.globe.enableLighting = true
    viewer.clock.shouldAnimate = false
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date("2024-01-01T08:00:00Z")) // ~2am local
    viewer.scene.skyAtmosphere.brightnessShift = -0.9
    viewer.scene.fog.enabled = false // keep visibility of particles

    // CAMERA ~2.5km up, pitched to horizon for context
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(LON, LAT, 2500),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-12),
        roll: 0
      }
    })

    // --- HEAVY RAIN PARTICLES (camera-relative, very visible) ---
    const UP = new Cesium.Cartesian3()
    const DOWN = new Cesium.Cartesian3()

    const rainTexture =
      "https://cesium.com/downloads/cesiumjs/releases/1.132/Build/Cesium/Assets/Images/particle.png"

    // gravity update (per particle)
    function applyGravity(p, dt) {
      Cesium.Cartesian3.normalize(p.position, UP)               // world up from emitter
      Cesium.Cartesian3.negate(UP, DOWN)                        // down vector
      // accelerate downward (scaled for strong streaks)
      const g = 60.0
      Cesium.Cartesian3.multiplyByScalar(DOWN, g * dt, DOWN)
      p.velocity = Cesium.Cartesian3.add(p.velocity, DOWN, p.velocity)
    }

    // emitter matrix: a little above camera, facing down
    function emitterModelMatrix() {
      const trs = new Cesium.TranslationRotationScale()
      trs.translation = new Cesium.Cartesian3(0.0, 0.0, 30.0) // ~40m above camera
      // tip slightly forward so streaks cross the view
      const qx = Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.UNIT_X, Math.PI * 0.98)
      trs.rotation = qx
      return Cesium.Matrix4.fromTranslationRotationScale(trs)
    }

    // particle system: thin tall billboards -> visible rain streaks
    const rain = viewer.scene.primitives.add(
      new Cesium.ParticleSystem({
        image: rainTexture,
        imageSize: new Cesium.Cartesian2(2.0, 28.0), // thin, tall streaks
        startColor: Cesium.Color.WHITE.withAlpha(0.75),
        endColor: Cesium.Color.WHITE.withAlpha(0.0),
        startScale: 1.0,
        endScale: 1.0,
        minimumSpeed: 85.0,
        maximumSpeed: 140.0,
        minimumParticleLife: 0.35,
        maximumParticleLife: 0.6,
        emissionRate: 9000, // heavy rain
        emitter: new Cesium.ConeEmitter(Cesium.Math.toRadians(10.0)),
        sizeInMeters: true,
        updateCallback: applyGravity
      })
    )

    // keep the emitter centered on camera, in ENU frame
    const enu = new Cesium.Matrix4()
    viewer.scene.preRender.addEventListener(() => {
      Cesium.Transforms.eastNorthUpToFixedFrame(viewer.camera.positionWC, Cesium.Ellipsoid.WGS84, enu)
      rain.modelMatrix = enu
      rain.emitterModelMatrix = emitterModelMatrix()

      // since requestRenderMode=true, ensure a frame is drawn while particles move
      viewer.scene.requestRender()
    })

    // slight tilt animation to keep horizon in view and show streaks against it
    let t = 0
    const post = viewer.scene.postUpdate.addEventListener(() => {
      t += 0.005
      const pitch = Cesium.Math.toRadians(-10 - Math.sin(t) * 2.5)
      viewer.camera.setView({
        destination: viewer.camera.positionWC,
        orientation: { heading: viewer.camera.heading, pitch, roll: 0 }
      })
      viewer.scene.requestRender()
    })
  }
}
