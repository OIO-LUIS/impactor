// ============================================================================
// IMPACT VISUALIZER - Meteor trajectory and impact effects visualization
// ============================================================================
//
// PURPOSE:
// Manages visualization of meteor entry, trajectory, and impact effects.
// Handles meteor creation, position updates, impact flash, damage rings,
// info overlays, and camera transitions.
//
// RESPONSIBILITIES:
// - Create and animate meteor object during entry
// - Update meteor position along trajectory with atmospheric effects
// - Trigger impact visual effects (flash, rings)
// - Create damage ring visualizations from Physics::Engine results
// - Generate info overlays displaying simulation results
// - Manage camera follow and transition to overview
//
// USAGE:
// const visualizer = new ImpactVisualizer(scene, camera, controls, earthRadius, latLngToVector3, calculateGeodesicPoint)
// visualizer.createMeteor(trajectory, diameter)
// visualizer.updateMeteorPosition(progress)
// visualizer.triggerImpact(lat, lng, results, damageRingsData)
//
// ============================================================================

import * as THREE from "three"

export class ImpactVisualizer {
  /**
   * Initialize the impact visualizer
   *
   * @param {THREE.Scene} scene - Three.js scene
   * @param {THREE.Camera} camera - Three.js camera
   * @param {OrbitControls} controls - Camera orbit controls
   * @param {number} earthRadius - Earth radius in meters
   * @param {Function} latLngToVector3 - Function to convert lat/lng to 3D coordinates
   * @param {Function} calculateGeodesicPoint - Function to calculate geodesic points
   * @param {Function} easeInOutCubic - Easing function for smooth animations
   */
  constructor(scene, camera, controls, earthRadius, latLngToVector3, calculateGeodesicPoint, easeInOutCubic) {
    this.scene = scene
    this.camera = camera
    this.controls = controls
    this.EARTH_R = earthRadius
    this.latLngToVector3 = latLngToVector3
    this.calculateGeodesicPoint = calculateGeodesicPoint
    this.easeInOutCubic = easeInOutCubic

    // Tracked objects for cleanup
    this.meteorObject = null
    this.meteorGlow = null
    this.trailLine = null
    this.damageRings = []
    this.infoOverlays = []
    this.trajectory = []

    // State
    this.cameraFollowing = false
    this.impactOccurred = false
  }

  /**
   * Create meteor object with glow and trail
   *
   * @param {Array<THREE.Vector3>} trajectory - Array of trajectory points
   * @param {number} diameter - Meteor diameter in meters
   */
  createMeteor(trajectory, diameter) {
    this.trajectory = trajectory
    const visualScale = Math.min(diameter * 45, 20000)  // Visual exaggeration for visibility

    console.log("☄️  Creating meteor:")
    console.log("  - Actual diameter:", diameter, "m")
    console.log("  - Visual scale:", visualScale, "m (exaggerated for visibility)")

    // Core meteor (rough surface)
    const meteorGeometry = new THREE.IcosahedronGeometry(visualScale, 1)
    const meteorMaterial = new THREE.MeshPhongMaterial({
      color: 0x886644,
      emissive: 0xff6600,
      emissiveIntensity: 0.5,
      shininess: 10
    })

    this.meteorObject = new THREE.Mesh(meteorGeometry, meteorMaterial)
    this.meteorObject.position.copy(this.trajectory[0])
    this.scene.add(this.meteorObject)

    // Add glow sphere around meteor (atmospheric heating)
    const glowGeometry = new THREE.SphereGeometry(visualScale * 1.5, 16, 16)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.3
    })
    this.meteorGlow = new THREE.Mesh(glowGeometry, glowMaterial)
    this.meteorObject.add(this.meteorGlow)

    // Create trail line (plasma trail)
    const trailGeometry = new THREE.BufferGeometry().setFromPoints([this.trajectory[0]])
    const trailMaterial = new THREE.LineBasicMaterial({
      color: 0xffaa00,
      opacity: 0.6,
      transparent: true,
      linewidth: 2
    })
    this.trailLine = new THREE.Line(trailGeometry, trailMaterial)
    this.scene.add(this.trailLine)

    console.log("  ✅ Meteor created at start position")
  }

  /**
   * Update meteor position along trajectory
   *
   * @param {number} progress - Animation progress (0.0 to 1.0)
   *
   * ATMOSPHERIC EFFECTS (last 20% of journey):
   * - Increased emissive intensity (brighter glow)
   * - Color shift from orange to white-hot
   * - Increased opacity
   *
   * These effects are VISUAL ONLY. Actual atmospheric entry physics
   * calculated by Physics::Entry module (drag, heating, fragmentation).
   */
  updateMeteorPosition(progress) {
    if (!this.meteorObject || this.trajectory.length < 2) return

    const index = Math.floor(progress * (this.trajectory.length - 1))
    const nextIndex = Math.min(index + 1, this.trajectory.length - 1)
    const localProgress = (progress * (this.trajectory.length - 1)) % 1

    // Interpolate position between trajectory points
    const currentPos = this.trajectory[index]
    const nextPos = this.trajectory[nextIndex]
    this.meteorObject.position.lerpVectors(currentPos, nextPos, localProgress)

    // Log position every 10% of progress
    if (index % 10 === 0) {
      const altitude = this.meteorObject.position.length() - this.EARTH_R
      console.log(`  📍 Progress: ${(progress * 100).toFixed(1)}% | Altitude: ${(altitude / 1000).toFixed(1)} km`)
    }

    // Update trail (show path traveled so far)
    const trailPoints = this.trajectory.slice(0, Math.max(1, index + 1))
    this.trailLine.geometry.setFromPoints(trailPoints)

    // Intensify glow when entering atmosphere (last 20% of journey)
    // Simulates atmospheric compression heating
    if (progress > 0.8) {
      const atmosphereProgress = (progress - 0.8) * 5  // 0 to 1 over last 20%

      // Increase brightness
      this.meteorObject.material.emissiveIntensity = 0.5 + atmosphereProgress * 2

      if (this.meteorGlow) {
        // Increase glow opacity
        this.meteorGlow.material.opacity = 0.3 + atmosphereProgress * 0.5

        // Color shift: orange → yellow → white-hot
        // HSL: Hue 0.08 (orange) → 0.0 (red-white)
        this.meteorGlow.material.color.setHSL(
          0.08 - atmosphereProgress * 0.08,  // Hue
          1,  // Saturation
          0.5 + atmosphereProgress * 0.3  // Lightness (brighter)
        )
      }

      if (atmosphereProgress > 0) {
        console.log(`  🔥 Atmospheric heating: ${(atmosphereProgress * 100).toFixed(0)}%`)
      }
    }

    // Update camera to follow meteor
    if (this.cameraFollowing) {
      this.updateFollowCamera(progress)
    }
  }

  /**
   * Update camera to follow meteor during approach
   *
   * CAMERA POSITIONING:
   * - Position: Behind and slightly above meteor
   * - Target: Slightly ahead of meteor (anticipatory tracking)
   * - Smooth lerp: Gradual movement for cinematic feel
   *
   * This creates a dramatic "chase cam" perspective
   *
   * @param {number} progress - Animation progress (0.0 to 1.0)
   */
  updateFollowCamera(progress) {
    const meteorPos = this.meteorObject.position
    const earthCenter = new THREE.Vector3(0, 0, 0)

    // Calculate direction from meteor to Earth
    const meteorToEarth = earthCenter.clone().sub(meteorPos).normalize()

    // Camera offset: behind the meteor
    const cameraOffset = meteorToEarth.clone().multiplyScalar(-this.EARTH_R * 0.5)
    const cameraUp = new THREE.Vector3(0, 1, 0)
    const cameraSide = meteorToEarth.clone().cross(cameraUp).normalize()

    // Add offsets to see both meteor and Earth
    const targetCameraPos = meteorPos.clone()
      .add(cameraOffset)
      .add(cameraUp.clone().multiplyScalar(this.EARTH_R * 0.2))  // Slightly above
      .add(cameraSide.clone().multiplyScalar(this.EARTH_R * 0.1))  // Slightly to side

    // Smooth camera movement (lerp factor 0.05 = gradual)
    this.camera.position.lerp(targetCameraPos, 0.05)

    // Look ahead of the meteor slightly (anticipatory tracking)
    const lookAheadIndex = Math.min(
      Math.floor((progress + 0.05) * (this.trajectory.length - 1)),
      this.trajectory.length - 1
    )
    const lookTarget = this.trajectory[lookAheadIndex]
    this.camera.lookAt(lookTarget)
  }

  /**
   * Trigger impact visual effects
   *
   * IMPACT SEQUENCE:
   * 1. Create bright flash (expanding sphere)
   * 2. Remove meteor object
   * 3. Create damage rings (from Physics::Engine results)
   * 4. Add info overlays
   * 5. Transition camera to overview
   *
   * Flash duration: 2 seconds
   * Ring animation: Staggered by 300ms each
   *
   * @param {number} lat - Impact latitude
   * @param {number} lng - Impact longitude
   * @param {Object} results - Physics::Engine simulation results
   * @param {Array} damageRingsData - Damage rings data
   */
  triggerImpact(lat, lng, results, damageRingsData) {
    if (this.impactOccurred) return
    this.impactOccurred = true

    console.log("💥 ═══════════════════════════════════════════════════════")
    console.log("💥 IMPACT!")
    console.log("💥 ═══════════════════════════════════════════════════════")

    const impactPoint = this.latLngToVector3(lat, lng, this.EARTH_R)

    console.log("  - Location:", lat, "°,", lng, "°")
    console.log("  - Mode:", results.mode)
    console.log("  - Energy:", results.energy_megatons_tnt, "MT TNT")

    // Impact flash (brief white sphere)
    const flashGeometry = new THREE.SphereGeometry(50000, 16, 16)
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1
    })
    const flash = new THREE.Mesh(flashGeometry, flashMaterial)
    flash.position.copy(impactPoint)
    this.scene.add(flash)

    console.log("  💡 Impact flash created")

    // Animate flash (expand and fade)
    const flashDuration = 2000
    const flashStart = Date.now()
    const animateFlash = () => {
      const elapsed = Date.now() - flashStart
      if (elapsed < flashDuration) {
        const progress = elapsed / flashDuration
        flash.scale.setScalar(1 + progress * 5)  // Expand
        flash.material.opacity = 1 - progress  // Fade
        requestAnimationFrame(animateFlash)
      } else {
        this.scene.remove(flash)
        flash.geometry.dispose()
        flash.material.dispose()
      }
    }
    animateFlash()

    // Remove meteor
    if (this.meteorObject) {
      this.scene.remove(this.meteorObject)
      this.meteorObject = null
    }

    // Add damage rings (from Physics::Engine calculations)
    this.createDamageVisualization(lat, lng, damageRingsData)

    // Add information overlays
    this.createInfoOverlays(lat, lng, results, damageRingsData)

    // Transition camera to overview
    this.cameraFollowing = false
    this.transitionCameraToOverview(impactPoint, damageRingsData)

    console.log("💥 ═══════════════════════════════════════════════════════")
    console.log("")
  }

  /**
   * Create damage ring visualizations
   * Staggered animation for dramatic effect
   *
   * @param {number} lat - Impact latitude
   * @param {number} lng - Impact longitude
   * @param {Array} damageRingsData - Array of ring data objects
   */
  createDamageVisualization(lat, lng, damageRingsData) {
    console.log("🎨 Creating damage rings visualization...")

    damageRingsData.forEach((ringData, index) => {
      setTimeout(() => {
        const ring = this.createDamageRing(lat, lng, ringData)
        this.scene.add(ring)
        this.damageRings.push(ring)

        console.log(`  ✅ Ring ${index + 1}: ${ringData.label} (${(ringData.radius / 1000).toFixed(1)} km)`)
      }, index * 300)  // Stagger by 300ms
    })
  }

  /**
   * Create a single damage ring on Earth's surface
   *
   * GEODESIC CALCULATION:
   * - Uses calculateGeodesicPoint() to find points at fixed distance from impact
   * - Creates circle using great-circle distance (accounts for Earth curvature)
   * - 128 segments for smooth appearance
   *
   * PHYSICS CONNECTION:
   * Ring radii calculated by backend modules:
   * - Vaporization: Physics::Blast (extreme temperatures)
   * - Severe blast: Physics::Blast (overpressure > 20 psi)
   * - Thermal: Physics::Thermal (3rd degree burns)
   * - Seismic: Physics::Seismic (ground damage)
   * - Ejecta: Physics::Ejecta (debris fallout)
   * - Tsunami: Physics::Tsunami (wave height zones)
   *
   * @param {number} lat - Impact latitude
   * @param {number} lng - Impact longitude
   * @param {Object} ringData - Ring data { radius, color, label }
   * @returns {THREE.Line} Ring object
   */
  createDamageRing(lat, lng, ringData) {
    const { radius, color, label } = ringData
    const segments = 128
    const points = []

    console.log(`  🎨 Rendering ring: ${label}`)
    console.log(`     - Radius: ${(radius / 1000).toFixed(1)} km`)
    console.log(`     - Color: ${color}`)

    // Create ring on Earth surface using geodesic calculation
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      const bearing = angle * 180 / Math.PI

      // Calculate point on Earth surface at given distance and bearing
      const point = this.calculateGeodesicPoint(lat, lng, bearing, radius)
      const vec = this.latLngToVector3(point.lat, point.lng, this.EARTH_R + 100)
      points.push(vec)
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      opacity: 0.8,
      transparent: true,
      linewidth: 2
    })

    const ring = new THREE.Line(geometry, material)

    // Add label sprite
    if (label) {
      const labelSprite = this.createTextSprite(label, color)
      const labelPoint = this.calculateGeodesicPoint(lat, lng, 0, radius)
      const labelPos = this.latLngToVector3(labelPoint.lat, labelPoint.lng, this.EARTH_R + 5000)
      labelSprite.position.copy(labelPos)
      ring.add(labelSprite)
    }

    // Animate ring appearance (expand from center)
    ring.scale.setScalar(0)
    const animateRing = () => {
      if (ring.scale.x < 1) {
        ring.scale.addScalar(0.05)
        requestAnimationFrame(animateRing)
      }
    }
    animateRing()

    return ring
  }

  /**
   * Create text sprite (canvas-based texture)
   * Used for ring labels and info overlays
   *
   * @param {string} text - Text to display
   * @param {string} color - Text color (hex string)
   * @returns {THREE.Sprite} Text sprite
   */
  createTextSprite(text, color = "#ffffff") {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 64

    const ctx = canvas.getContext('2d')
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(0, 0, 256, 64)

    ctx.fillStyle = color
    ctx.font = 'bold 20px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 128, 32)

    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true })
    const sprite = new THREE.Sprite(material)
    sprite.scale.set(40000, 10000, 1)

    return sprite
  }

  /**
   * Create floating info cards around impact site
   * Displays key results from Physics::Engine
   *
   * @param {number} lat - Impact latitude
   * @param {number} lng - Impact longitude
   * @param {Object} results - Physics::Engine simulation results
   * @param {Array} damageRingsData - Damage rings data
   */
  createInfoOverlays(lat, lng, results, damageRingsData) {
    console.log("📊 Creating info overlays...")

    const infoData = [
      { label: "Energy", value: `${results.energy_megatons_tnt?.toFixed(1) || 0} MT`, angle: 0 },
      { label: "Mode", value: results.mode || 'Unknown', angle: 90 },
      { label: "Crater", value: `${results.final_crater_d_m?.toFixed(0) || 0} m`, angle: 180 },
      { label: "Threat", value: results.damage_assessment?.threat_level || 'Unknown', angle: 270 }
    ]

    // Position overlays outside largest damage ring
    const infoDistance = Math.max(100000, (damageRingsData[0]?.radius || 100000) * 1.5)

    infoData.forEach(info => {
      const sprite = this.createTextSprite(`${info.label}: ${info.value}`)
      const infoPoint = this.calculateGeodesicPoint(lat, lng, info.angle, infoDistance)
      const position = this.latLngToVector3(infoPoint.lat, infoPoint.lng, this.EARTH_R + 50000)
      sprite.position.copy(position)
      sprite.scale.set(60000, 15000, 1)
      this.scene.add(sprite)
      this.infoOverlays.push(sprite)

      console.log(`  - ${info.label}: ${info.value}`)
    })
  }

  /**
   * Smoothly transition camera to overhead view of impact site
   *
   * CAMERA POSITIONING:
   * - Distance: Based on largest damage ring (to fit all in view)
   * - Position: Along radial from Earth center through impact point
   * - Transition: 3 second ease-in-out cubic
   * - After transition: Re-enable orbit controls for user exploration
   *
   * @param {THREE.Vector3} impactPoint - Impact point in 3D space
   * @param {Array} damageRingsData - Damage rings data
   */
  transitionCameraToOverview(impactPoint, damageRingsData) {
    console.log("📷 Transitioning camera to overview...")

    // Calculate ideal overview position based on largest damage ring
    const maxRadius = Math.max(...damageRingsData.map(r => r.radius), 100000)
    const overviewDistance = this.EARTH_R + maxRadius * 3
    const overviewPosition = impactPoint.clone().normalize().multiplyScalar(overviewDistance)

    console.log("  - Target distance:", (overviewDistance / 1000).toFixed(0), "km")
    console.log("  - Fitting rings up to:", (maxRadius / 1000).toFixed(1), "km radius")

    // Smooth transition
    const transitionDuration = 3000
    const startPosition = this.camera.position.clone()
    const startTime = Date.now()

    const animateCamera = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / transitionDuration, 1)
      const easedProgress = this.easeInOutCubic(progress)

      this.camera.position.lerpVectors(startPosition, overviewPosition, easedProgress)
      this.camera.lookAt(impactPoint)

      if (progress < 1) {
        requestAnimationFrame(animateCamera)
      } else {
        // Re-enable controls after transition
        this.controls.enabled = true
        this.controls.target.copy(impactPoint)
        console.log("  ✅ Camera transition complete")
      }
    }
    animateCamera()
  }

  /**
   * Enable camera following
   */
  enableCameraFollow() {
    this.cameraFollowing = true
  }

  /**
   * Disable camera following
   */
  disableCameraFollow() {
    this.cameraFollowing = false
  }

  /**
   * Clear all impact visualization objects
   */
  clearObjects() {
    // Remove meteor
    if (this.meteorObject) {
      this.scene.remove(this.meteorObject)
      this.meteorObject.traverse(child => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) child.material.dispose()
      })
      this.meteorObject = null
    }

    // Remove trail
    if (this.trailLine) {
      this.scene.remove(this.trailLine)
      this.trailLine.geometry.dispose()
      this.trailLine.material.dispose()
      this.trailLine = null
    }

    // Remove damage rings
    this.damageRings.forEach(ring => {
      this.scene.remove(ring)
      ring.traverse(child => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) child.material.dispose()
      })
    })
    this.damageRings = []

    // Remove info overlays
    this.infoOverlays.forEach(overlay => {
      this.scene.remove(overlay)
      if (overlay.material && overlay.material.map) {
        overlay.material.map.dispose()
      }
      if (overlay.material) overlay.material.dispose()
    })
    this.infoOverlays = []

    // Reset state
    this.meteorGlow = null
    this.trajectory = []
    this.impactOccurred = false
  }
}
