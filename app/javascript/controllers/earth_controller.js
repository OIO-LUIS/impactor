import { Controller } from "@hotwired/stimulus"
import * as THREE from "three"

export default class extends Controller {
  static targets = ["mount"]
  static values = {
    earthUrl: String,        // texture for Earth
    satelliteUrl: String,    // PNG sprite for satellites
  }

  connect() {
    this.clock = new THREE.Clock()
    this.meteors = []
    this.satellites = []
    this.nextMeteorAt = 0
    this._particleTex = this.makeGlowTexture(64)

    this._beforeCache = () => this.disposeScene()
    document.addEventListener("turbo:before-cache", this._beforeCache)

    this.initScene()
    this.animate()
  }

  disconnect() {
    document.removeEventListener("turbo:before-cache", this._beforeCache)
    cancelAnimationFrame(this.frameId)
    window.removeEventListener("resize", this.onResizeBound)
    this.disposeScene()
    this.mountTarget.innerHTML = ""
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Init
  initScene() {
    const width = window.innerWidth
    const height = window.innerHeight

    // Scene & camera
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000)
    this.camera.position.z = 3

    // Renderer (background)
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.setSize(width, height)
    this.renderer.setClearColor(0x000000, 0)
    const el = this.renderer.domElement
    el.style.position = "fixed"
    el.style.inset = "0"
    el.style.width = "100vw"
    el.style.height = "100vh"
    el.style.zIndex = "0"
    el.style.pointerEvents = "none"
    this.mountTarget.appendChild(el)

    // Lights
    const dir = new THREE.DirectionalLight(0xffffff, 1)
    dir.position.set(5, 3, 5).normalize()
    this.scene.add(dir)
    const ambient = new THREE.AmbientLight(0x405070, 0.45)
    this.scene.add(ambient)

    // Earth
    this.addEarth()

    // Stars
    this.addStars(2200)

    // Satellite group (easy cleanup)
    this.satellitesGroup = new THREE.Group()
    this.scene.add(this.satellitesGroup)
    this.addSatellites(4, this.satelliteUrlValue)

    // Resize
    this.onResizeBound = this.onResize.bind(this)
    window.addEventListener("resize", this.onResizeBound)
  }

  addEarth() {
    const loader = new THREE.TextureLoader()
    const url = this.earthUrlValue 
    const earthTex = loader.load(url)
    const geom = new THREE.SphereGeometry(1, 64, 64)
    const mat = new THREE.MeshPhongMaterial({ map: earthTex })
    this.earth = new THREE.Mesh(geom, mat)
    this.earth.rotation.x = 0.1
    this.earth.rotation.y = -0.6
    this.scene.add(this.earth)
  }

  addStars(count = 1500) {
    const positions = new Float32Array(count * 3)
    const radiusMin = 30
    const radiusMax = 80
    for (let i = 0; i < count; i++) {
      const r = radiusMin + Math.random() * (radiusMax - radiusMin)
      const theta = Math.acos(THREE.MathUtils.randFloatSpread(2))
      const phi = THREE.MathUtils.randFloat(0, Math.PI * 2)
      positions[i * 3 + 0] = r * Math.sin(theta) * Math.cos(phi)
      positions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi)
      positions[i * 3 + 2] = r * Math.cos(theta)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))

    this.starsMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      sizeAttenuation: true,
      transparent: true,
      depthWrite: false
    })
    this.stars = new THREE.Points(geo, this.starsMat)
    this.scene.add(this.stars)
  }

  clearSatellites() {
    if (!this.satellitesGroup) return
    for (const obj of [...this.satellitesGroup.children]) {
      this.satellitesGroup.remove(obj)
      obj.material?.map?.dispose?.()
      obj.material?.dispose?.()
      obj.geometry?.dispose?.()
    }
    this.satellites = []
  }

  addSatellites(n = 4, pngPath = null) {
    this.maxSatellites = Math.max(0, Math.min(4, Math.floor(n)))
    this.clearSatellites()
    if (this.maxSatellites === 0) return

    const loader = new THREE.TextureLoader()
    const onLoad = (tex) => { for (let i = 0; i < this.maxSatellites; i++) this._spawnSatellite(tex) }
    const onError = () => { for (let i = 0; i < this.maxSatellites; i++) this._spawnSatellite(this._particleTex) }

    if (pngPath) loader.load(pngPath, onLoad, undefined, onError)
    else onError()
  }

  _spawnSatellite(texture) {
    if (this.satellitesGroup.children.length >= this.maxSatellites) return

    const mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      toneMapped: false
    })
    const sprite = new THREE.Sprite(mat)
    sprite.scale.set(0.12, 0.12, 1)

    const alt = THREE.MathUtils.randFloat(0.25, 0.6)
    const radius = 1 + alt
    const omega = THREE.MathUtils.randFloat(0.05, 0.12)
    const inc = THREE.MathUtils.degToRad(THREE.MathUtils.randFloat(-75, 75))
    const phase = Math.random() * Math.PI * 2
    const raan = THREE.MathUtils.degToRad(THREE.MathUtils.randFloat(0, 360))

    this.satellites.push({ mesh: sprite, radius, omega, inc, phase, raan })
    this.satellitesGroup.add(sprite)
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Meteors: sphere head + glow trail
  spawnMeteor() {
    const headRadius = THREE.MathUtils.randFloat(0.015, 0.028)
    const headGeom = new THREE.SphereGeometry(headRadius, 16, 16)
    const headMat = new THREE.MeshBasicMaterial({
      color: 0xfff1cc,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    })
    const head = new THREE.Mesh(headGeom, headMat)

    // Lower band across the screen
    const z = THREE.MathUtils.randFloat(-0.25, 0.25)
    const startY = THREE.MathUtils.randFloat(-0.2, 0.6)
    const endY = startY - THREE.MathUtils.randFloat(0.9, 1.7)

    const start = new THREE.Vector3(-5, startY, z)
    const end   = new THREE.Vector3( 5, endY,   z)

    const lifetime = THREE.MathUtils.randFloat(1.8, 2.8)
    const t0 = this.clock.getElapsedTime()

    head.position.copy(start)
    this.scene.add(head)

    const trailParticles = []
    const spawnEvery = 0.02
    let lastSpawn = t0

    this.meteors.push({ head, start, end, t0, lifetime, trailParticles, spawnEvery, lastSpawn })
  }

  _emitTrailParticle(meteor, now) {
    const mat = new THREE.SpriteMaterial({
      map: this._particleTex,
      color: 0xffd6a0,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    })
    const p = new THREE.Sprite(mat)
    p.scale.set(0.06, 0.06, 1)
    p.position.copy(meteor.head.position)
    const life = THREE.MathUtils.randFloat(0.6, 1.0)
    const birth = now
    this.scene.add(p)
    meteor.trailParticles.push({ sprite: p, birth, life })
  }

  _updateTrail(meteor, now) {
    if (now - meteor.lastSpawn >= meteor.spawnEvery) {
      this._emitTrailParticle(meteor, now)
      meteor.lastSpawn = now
    }
    for (let i = meteor.trailParticles.length - 1; i >= 0; i--) {
      const tp = meteor.trailParticles[i]
      const u = (now - tp.birth) / tp.life
      if (u >= 1) {
        this.scene.remove(tp.sprite)
        tp.sprite.material.map?.dispose?.()
        tp.sprite.material?.dispose?.()
        meteor.trailParticles.splice(i, 1)
        continue
      }
      tp.sprite.material.opacity = (1 - u) * 0.8
      const s = 0.06 + u * 0.04
      tp.sprite.scale.set(s, s, 1)
      const dir = new THREE.Vector3().subVectors(meteor.end, meteor.start).normalize().multiplyScalar(-0.015)
      tp.sprite.position.addScaledVector(dir, 1)
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Animate
  animate() {
    this.frameId = requestAnimationFrame(this.animate.bind(this))
    const t = this.clock.getElapsedTime()

    if (this.earth) this.earth.rotation.y += 0.0015

    if (this.stars) {
      this.stars.rotation.y += 0.0002
      if (this.starsMat) this.starsMat.opacity = 0.7 + 0.2 * Math.sin(t * 0.5)
    }

    // Meteor frequency (adjust as needed)
    if (t > this.nextMeteorAt) {
      this.spawnMeteor()
      this.nextMeteorAt = t + THREE.MathUtils.randFloat(2.0, 4.0)
    }

    // Update meteors
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i]
      const u = (t - m.t0) / m.lifetime
      if (u >= 1) {
        this.scene.remove(m.head)
        m.head.geometry.dispose()
        m.head.material.dispose()
        for (const tp of m.trailParticles) {
          this.scene.remove(tp.sprite)
          tp.sprite.material.map?.dispose?.()
          tp.sprite.material?.dispose?.()
        }
        this.meteors.splice(i, 1)
        continue
      }
      const pos = new THREE.Vector3().lerpVectors(m.start, m.end, u)
      m.head.position.copy(pos)
      this._updateTrail(m, t)
    }

    // Satellite orbits
    for (const s of this.satellites) {
      const angle = s.phase + t * s.omega
      let x = s.radius * Math.cos(angle)
      let y = s.radius * Math.sin(angle)
      let z = 0
      const cosI = Math.cos(s.inc), sinI = Math.sin(s.inc)
      const cosO = Math.cos(s.raan), sinO = Math.sin(s.raan)
      const xi = x * cosO - y * sinO
      const yi = x * sinO + y * cosO
      const zi = z
      const xfinal = xi
      const yfinal = yi * cosI - zi * sinI
      const zfinal = yi * sinI + zi * cosI
      s.mesh.position.set(xfinal, yfinal, zfinal)
    }

    this.renderer.render(this.scene, this.camera)
  }

  onResize() {
    const width = window.innerWidth
    const height = window.innerHeight
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  // Radial texture for glow sprites
  makeGlowTexture(size = 64) {
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = size
    const ctx = canvas.getContext("2d")
    const g = ctx.createRadialGradient(size/2, size/2, 1, size/2, size/2, size/2)
    g.addColorStop(0, "rgba(255,255,255,1.0)")
    g.addColorStop(0.4, "rgba(255,255,255,0.6)")
    g.addColorStop(1, "rgba(255,255,255,0.0)")
    ctx.fillStyle = g
    ctx.fillRect(0,0,size,size)
    const tex = new THREE.CanvasTexture(canvas)
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.generateMipmaps = false
    return tex
  }

  disposeScene() {
    if (this.stars) {
      this.scene.remove(this.stars)
      this.stars.geometry?.dispose()
      this.stars.material?.dispose()
    }
    for (const m of this.meteors) {
      this.scene.remove(m.head)
      m.head.geometry?.dispose?.()
      m.head.material?.dispose?.()
      for (const tp of m.trailParticles) {
        this.scene.remove(tp.sprite)
        tp.sprite.material.map?.dispose?.()
        tp.sprite.material?.dispose?.()
      }
    }
    if (this.satellitesGroup) {
      this.clearSatellites()
      this.scene.remove(this.satellitesGroup)
    }
    if (this.earth) {
      this.scene.remove(this.earth)
      this.earth.geometry?.dispose?.()
      this.earth.material?.map?.dispose?.()
      this.earth.material?.dispose?.()
    }
    this.renderer?.dispose?.()
  }
}
