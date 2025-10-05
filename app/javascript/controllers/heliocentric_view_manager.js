// ============================================================================
// HELIOCENTRIC VIEW MANAGER
// ============================================================================
//
// Manages the Sun-centered orbital view including:
// - Starfield background
// - Sun rendering with glow effect
// - All 8 planets with NASA textures and accurate positions
// - Earth's circular orbit
// - NEO's elliptical orbit from Keplerian elements
// - Encounter markers
// - Velocity vectors
// - Welcome/instruction panel
//
// This view is used to visualize the entire solar system and NEO trajectories
// before impact analysis.
//
// ============================================================================

import * as THREE from "three"
import { PlanetManager } from "controllers/planet_manager"

export class HeliocentricViewManager {
  constructor(scene, camera, controls, AU, SCENE_SCALE, SUN_R_VISUAL, EARTH_R_VISUAL, orbitalMech = null, assetUrls = {}) {
    this.scene = scene
    this.camera = camera
    this.controls = controls
    this.AU = AU
    this.SCENE_SCALE = SCENE_SCALE
    this.SUN_R_VISUAL = SUN_R_VISUAL
    this.EARTH_R_VISUAL = EARTH_R_VISUAL
    this.orbitalMech = orbitalMech
    this.assetUrls = assetUrls

    // Initialize PlanetManager for all planets with asset URLs
    this.planetManager = new PlanetManager(scene, AU, SCENE_SCALE, assetUrls)

    // Track created objects for cleanup
    this.starfield = null
    this.sun = null
    this.sunGlow = null
    this.sunLight = null
    this.earthOrbitLine = null
    this.orbitalEarth = null
    this.neoOrbitLine = null
    this.neoMesh = null
    this.neoLabel = null
    this.neoName = "NEO"
    this.encounterMarker = null
    this.velocityVectors = []
    this.neoOrbitalElements = null
    this.encounterTime = null
    this.earthOrbitalAngle = Math.PI / 2
    this.planetsCreated = false
  }

  /**
   * Show welcome panel with instructions
   */
  showWelcomePanel() {
    try {
      // Check if welcome panel already exists
      if (document.getElementById('welcome-panel')) return

      const panel = document.createElement('div')
      panel.id = 'welcome-panel'
      panel.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, rgba(23, 18, 38, 0.95), rgba(43, 38, 58, 0.95));
        color: #93B4D8;
        padding: 1.5rem;
        border-radius: 12px;
        border: 1px solid rgba(147, 180, 216, 0.3);
        max-width: 350px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        backdrop-filter: blur(10px);
        z-index: 1000;
      `

      panel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
          <h3 style="margin: 0; color: #B39DDB;">🌟 Solar System View</h3>
          <button id="close-welcome" style="
            background: none;
            border: none;
            color: #93B4D8;
            cursor: pointer;
            font-size: 1.2rem;
            padding: 0;
            margin: 0;
          ">×</button>
        </div>
        <div style="font-size: 0.9rem; line-height: 1.5;">
          <p style="margin: 0.5rem 0;">Welcome to the NEO Impact Simulator!</p>
          <p style="margin: 0.5rem 0;">You're viewing our Solar System from above:</p>
          <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
            <li>☀️ <strong>Sun</strong> at the center</li>
            <li>🌍 <strong>Earth</strong> orbiting at 1 AU</li>
            <li>✨ <strong>Drag</strong> to rotate view</li>
            <li>🔍 <strong>Scroll</strong> to zoom</li>
          </ul>
          <p style="margin: 0.5rem 0; font-weight: 600; color: #FF6B35;">
            👈 Browse NEOs to simulate their orbits and potential impacts
          </p>
        </div>
      `

      document.body.appendChild(panel)

      // Add close button handler
      const closeBtn = document.getElementById('close-welcome')
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          panel.style.transition = 'opacity 0.3s'
          panel.style.opacity = '0'
          setTimeout(() => panel.remove(), 300)
        })
      }

      // Auto-hide after 10 seconds
      setTimeout(() => {
        if (document.getElementById('welcome-panel')) {
          panel.style.transition = 'opacity 0.3s'
          panel.style.opacity = '0'
          setTimeout(() => panel.remove(), 300)
        }
      }, 10000)
    } catch (error) {
      console.error("❌ Error showing welcome panel:", error)
    }
  }

  /**
   * Create Milky Way background using spherical skybox
   */
  createStarfield() {
    console.log("🌌 Creating Milky Way background...")

    // Create enormous skybox that can never be escaped
    // Using a very large fixed radius regardless of zoom level
    const skyRadius = 8000  // Extremely large - far beyond any zoom capability
    const skyGeometry = new THREE.SphereGeometry(skyRadius, 64, 64)

    console.log(`  📏 Skybox radius: ${skyRadius} scene units (infinite background)`)

    // Load the Milky Way texture
    const textureLoader = new THREE.TextureLoader()
    const textureUrl = this.assetUrls.stars || '/assets/stars.jpg'
    const milkyWayTexture = textureLoader.load(textureUrl,
      (texture) => {
        console.log("  ✅ Milky Way texture loaded")
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.repeat.set(1, 1)
      },
      undefined,
      (error) => {
        console.warn("  ⚠️ Could not load Milky Way texture, using fallback color")
      }
    )

    // Create material with the texture on the inside of the sphere
    const skyMaterial = new THREE.MeshBasicMaterial({
      map: milkyWayTexture,
      side: THREE.BackSide,  // Render on inside of sphere
      fog: false  // Don't apply fog to the skybox
    })

    // Create the skybox mesh
    this.starfield = new THREE.Mesh(skyGeometry, skyMaterial)
    this.starfield.name = 'MilkyWaySkybox'
    this.scene.add(this.starfield)

    console.log("  ✅ Milky Way skybox created")
  }

  /**
   * Create Sun at origin with texture and glow effect
   */
  createSun() {
    console.log("☀️ Creating Sun...")

    // Sun geometry (scaled for visibility)
    const sunRadius = this.SUN_R_VISUAL / this.SCENE_SCALE
    const sunGeometry = new THREE.SphereGeometry(sunRadius, 64, 64)

    console.log(`  - Sun radius: ${sunRadius} scene units`)
    console.log(`  - Sun visual size: ${this.SUN_R_VISUAL} km`)

    // Load Sun texture
    const textureLoader = new THREE.TextureLoader()
    const sunTexture = textureLoader.load(this.assetUrls.sun || '/assets/sun.jpg',
      (texture) => {
        console.log("  ✅ Sun texture loaded")
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
      },
      undefined,
      (error) => {
        console.warn("  ⚠️ Could not load Sun texture, using fallback color")
      }
    )

    // Sun material with texture and emissive glow
    const sunMaterial = new THREE.MeshBasicMaterial({
      map: sunTexture,
      color: 0xFFFFFF,  // White to show texture colors
      emissive: 0xFFD700,
      emissiveIntensity: 0.5
    })

    // Create sun mesh
    this.sun = new THREE.Mesh(sunGeometry, sunMaterial)
    this.sun.position.set(0, 0, 0)
    this.scene.add(this.sun)

    console.log("  - Sun added to scene at origin")

    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(sunRadius * 1.5, 32, 32)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 0.01
    })

    this.sunGlow = new THREE.Mesh(glowGeometry, glowMaterial)
    this.sunGlow.name = 'SunGlow'
    this.scene.add(this.sunGlow)

    // Add strong point light at sun position
    this.sunLight = new THREE.PointLight(0xFFFFFF, 2, this.AU / this.SCENE_SCALE * 3)
    this.sunLight.position.set(0, 0, 0)
    this.sunLight.name = 'SunLight'
    this.scene.add(this.sunLight)

    console.log("  ✅ Sun created at origin with light")
  }

  /**
   * DEPRECATED: Create Earth's circular orbit path at 1 AU
   * No longer showing orbit rings - only asteroid trajectories will be shown
   */
  createEarthOrbit() {
    console.log("🌍 Skipping Earth orbit ring (showing labels only)")
    // Don't create orbit rings anymore
    this.earthOrbitLine = null
  }

  /**
   * Create Earth sphere at its orbital position
   */
  createOrbitalEarth() {
    console.log("🌍 Creating orbital Earth...")

    const earthRadius = this.EARTH_R_VISUAL / this.SCENE_SCALE
    const orbitRadius = this.AU / this.SCENE_SCALE

    // Create Earth sphere
    const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64)

    // Load Earth texture
    const textureLoader = new THREE.TextureLoader()
    const earthTexture = textureLoader.load(this.assetUrls.earth || '/assets/earth.jpg',
      (texture) => {
        console.log("  ✅ Earth texture loaded")
        texture.minFilter = THREE.LinearMipMapLinearFilter
        texture.magFilter = THREE.LinearFilter
      },
      undefined,
      (error) => {
        console.warn("  ⚠️ Could not load Earth texture, using fallback color")
      }
    )

    // Earth material with texture
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: earthTexture,
      shininess: 10,
      specular: 0x222222
    })

    this.orbitalEarth = new THREE.Mesh(earthGeometry, earthMaterial)
    this.orbitalEarth.name = 'Earth'

    // Add atmosphere glow
    const atmosphereGeometry = new THREE.SphereGeometry(earthRadius * 1.02, 64, 64)
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    })
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
    this.orbitalEarth.add(atmosphere)

    // Add Earth label - LARGE VERSION
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.width = 1024
    canvas.height = 256
    context.font = 'Bold 180px Arial'
    context.fillStyle = 'rgba(255, 255, 255, 1.0)'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText('Earth', 512, 128)

    const labelTexture = new THREE.CanvasTexture(canvas)
    const labelMaterial = new THREE.SpriteMaterial({
      map: labelTexture,
      transparent: true,
      opacity: 1.0,
      depthTest: false,
      sizeAttenuation: true
    })

    const earthLabel = new THREE.Sprite(labelMaterial)
    // MASSIVE scale matching other planets
    const baseScale = 100
    const orbitScale = Math.sqrt(1.0)  // Earth at 1 AU
    earthLabel.scale.set(baseScale * orbitScale, baseScale * orbitScale * 0.25, 1)
    earthLabel.position.set(0, earthRadius * 2, 0)  // Directly above
    this.orbitalEarth.add(earthLabel)

    // Position Earth on its orbit (will be updated with Horizons data)
    this.earthOrbitalAngle = Math.PI / 2
    this.orbitalEarth.position.set(
      Math.cos(this.earthOrbitalAngle) * orbitRadius,
      0,
      Math.sin(this.earthOrbitalAngle) * orbitRadius
    )

    this.scene.add(this.orbitalEarth)

    console.log(`  ✅ Earth positioned on orbit at (${this.orbitalEarth.position.x.toFixed(2)}, ${this.orbitalEarth.position.y.toFixed(2)}, ${this.orbitalEarth.position.z.toFixed(2)})`)
  }

  /**
   * Create all planets in the solar system
   * @param {boolean} useTextures - Whether to load NASA textures
   * @returns {Promise} Resolves when all planets are created
   */
  async createAllPlanets(useTextures = true) {
    if (this.planetsCreated) {
      console.log("⚠️ Planets already created, skipping...")
      return
    }

    console.log("🪐 Creating all planets in the solar system...")

    try {
      // Create planets using PlanetManager
      await this.planetManager.createAllPlanets(useTextures)
      this.planetsCreated = true

      // Earth is special - we manage it separately for the NEO encounter
      // So we store a reference to the planet manager's Earth if it exists
      const earthFromManager = this.planetManager.getPlanet('earth')
      if (earthFromManager && !this.orbitalEarth) {
        this.orbitalEarth = earthFromManager
      }

      console.log("✅ All planets created successfully")
    } catch (error) {
      console.error("❌ Error creating planets:", error)
      // Continue without planets - simulation can still work
    }
  }

  /**
   * Update planet positions from backend Horizons data
   * @param {Object} planetsData - Planet position data from backend
   */
  updatePlanetPositions(planetsData) {
    if (!this.planetManager || !planetsData) return

    console.log("🔄 Updating planet positions from backend data...")
    this.planetManager.updatePlanetPositions(planetsData)

    // Special handling for Earth if it's managed separately
    if (planetsData.earth && this.orbitalEarth) {
      const earthData = planetsData.earth
      const x = earthData.position[0] / this.SCENE_SCALE
      const y = earthData.position[1] / this.SCENE_SCALE
      const z = earthData.position[2] / this.SCENE_SCALE
      this.orbitalEarth.position.set(x, y, z)
    }
  }

  /**
   * Position all planets at a specific time
   * @param {Date} time - Time for planet positions
   * @param {Function} fetchCallback - Optional callback to fetch from Horizons
   */
  async positionPlanetsAtTime(time, fetchCallback = null) {
    if (!this.planetManager) return

    console.log(`🕐 Positioning all planets at ${time}...`)
    await this.planetManager.positionPlanetsAtTime(time, fetchCallback)

    // Also update Earth if managed separately
    if (this.orbitalEarth) {
      this.positionEarthAtTime(time)
    }
  }

  /**
   * Setup camera for orbital view
   */
  setupOrbitalCamera() {
    console.log("📷 Setting up orbital camera...")

    const orbitRadius = this.AU / this.SCENE_SCALE

    // Position camera at a nice angle to see the solar system
    const cameraX = orbitRadius * 1.2
    const cameraY = orbitRadius * 0.6
    const cameraZ = orbitRadius * 1.2

    console.log(`  - Positioning camera at (${cameraX}, ${cameraY}, ${cameraZ})`)
    console.log(`  - Orbit radius: ${orbitRadius} scene units`)

    this.camera.position.set(cameraX, cameraY, cameraZ)
    this.camera.lookAt(0, 0, 0)

    console.log(`  - Actual camera position:`, this.camera.position)

    // Update controls
    if (this.controls) {
      this.controls.target.set(0, 0, 0)
      this.controls.minDistance = orbitRadius * 0.2
      this.controls.maxDistance = orbitRadius * 5
      this.controls.enablePan = false  // Keep focus on Sun
      this.controls.autoRotate = true
      this.controls.autoRotateSpeed = 0.5
      this.controls.update()
    }

    console.log("  ✅ Camera positioned for orbital view")
  }

  /**
   * Create NEO's elliptical orbit from Keplerian elements
   *
   * @param {Object} orbitalElements - Keplerian orbital elements
   * @param {Date} encounterTime - Time of encounter (optional)
   * @param {Function} positionNeoAtTime - Callback to position NEO at time
   * @param {string} neoName - Name of the NEO for labeling (optional)
   */
  createNeoOrbit(orbitalElements, encounterTime = null, positionNeoAtTime = null, neoName = "NEO") {
    console.log("☄️ Creating NEO orbit from Keplerian elements...")

    if (!orbitalElements) {
      console.warn("  ⚠️ No orbital elements provided")
      return
    }

    // Store orbital elements for later use
    this.neoOrbitalElements = orbitalElements
    this.encounterTime = encounterTime
    this.neoName = neoName

    // Clear previous NEO orbit if exists
    if (this.neoOrbitLine) {
      this.scene.remove(this.neoOrbitLine)
      this.neoOrbitLine = null
    }
    if (this.neoMesh) {
      this.scene.remove(this.neoMesh)
      this.neoMesh = null
    }
    if (this.neoLabel) {
      // Label is a child of neoMesh, so it's already removed
      this.neoLabel = null
    }

    console.log("  📊 Orbital parameters:")
    console.log(`    - Semi-major axis: ${orbitalElements.semi_major_axis_au} AU`)
    console.log(`    - Eccentricity: ${orbitalElements.eccentricity}`)
    console.log(`    - Inclination: ${orbitalElements.inclination_deg}°`)
    console.log(`    - NEO Name: ${neoName}`)

    // Generate orbit points using OrbitalMechanicsCalculator for accuracy
    const segments = 256
    const orbitPoints = []

    if (!this.orbitalMech) {
      console.warn("  ⚠️ OrbitalMechanicsCalculator not available, using simplified orbit")
      // Fallback to simple ellipse if calculator not available
      const a = orbitalElements.semi_major_axis_au * this.AU / this.SCENE_SCALE
      const e = orbitalElements.eccentricity
      const i = THREE.MathUtils.degToRad(orbitalElements.inclination_deg || 0)
      const omega = THREE.MathUtils.degToRad(orbitalElements.argument_perihelion_deg || 0)
      const Omega = THREE.MathUtils.degToRad(orbitalElements.longitude_ascending_node_deg || 0)

      for (let j = 0; j <= segments; j++) {
        const theta = (j / segments) * Math.PI * 2
        const r = a * (1 - e * e) / (1 + e * Math.cos(theta))
        const x_orb = r * Math.cos(theta)
        const z_orb = r * Math.sin(theta)
        const x1 = x_orb * Math.cos(omega) - z_orb * Math.sin(omega)
        const z1 = x_orb * Math.sin(omega) + z_orb * Math.cos(omega)
        const x2 = x1 * Math.cos(Omega) - z1 * Math.cos(i) * Math.sin(Omega)
        const y2 = z1 * Math.sin(i)
        const z2 = x1 * Math.sin(Omega) + z1 * Math.cos(i) * Math.cos(Omega)
        orbitPoints.push(new THREE.Vector3(x2, y2, z2))
      }
    } else {
      // Use OrbitalMechanicsCalculator for scientifically accurate orbit
      console.log("  🔬 Using OrbitalMechanicsCalculator for accurate orbit generation")

      const epochJD = orbitalElements.epoch_jd || this.orbitalMech.timeToJulianDate(encounterTime || new Date())
      const meanMotion = orbitalElements.mean_motion_deg_per_day || this.orbitalMech.calculateMeanMotion(orbitalElements.semi_major_axis_au)

      // Calculate orbital period in days
      const orbitalPeriodDays = 360.0 / meanMotion

      // Generate points over one complete orbit
      for (let j = 0; j <= segments; j++) {
        const t = (j / segments) * orbitalPeriodDays  // Days from epoch
        const timeJD = epochJD + t
        const position = this.orbitalMech.calculateOrbitalPosition(orbitalElements, timeJD)
        orbitPoints.push(position)
      }

      console.log(`  ✅ Generated ${orbitPoints.length} points using orbital mechanics calculator`)
    }

    // Create orbit line
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints)
    const orbitMaterial = new THREE.LineBasicMaterial({
      color: 0xFF6B35,  // Orange for NEO orbit
      opacity: 0.7,
      transparent: true
    })

    this.neoOrbitLine = new THREE.Line(orbitGeometry, orbitMaterial)
    this.neoOrbitLine.name = 'NEOOrbit'
    this.scene.add(this.neoOrbitLine)

    // Create NEO mesh (small sphere)
    const neoRadius = this.EARTH_R_VISUAL / this.SCENE_SCALE * 0.2
    const neoGeometry = new THREE.SphereGeometry(neoRadius, 16, 16)
    const neoMaterial = new THREE.MeshPhongMaterial({
      color: 0xFF4444,
      emissive: 0xFF0000,
      emissiveIntensity: 0.5,
      shininess: 30
    })

    this.neoMesh = new THREE.Mesh(neoGeometry, neoMaterial)
    this.neoMesh.name = neoName

    // Add NEO label (matching planet label style)
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.width = 1024
    canvas.height = 256
    context.font = 'Bold 180px Arial'
    context.fillStyle = 'rgba(255, 107, 53, 1.0)'  // Orange color matching NEO orbit
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(neoName, 512, 128)

    const labelTexture = new THREE.CanvasTexture(canvas)
    const labelMaterial = new THREE.SpriteMaterial({
      map: labelTexture,
      transparent: true,
      opacity: 1.0,
      depthTest: false,
      sizeAttenuation: true
    })

    this.neoLabel = new THREE.Sprite(labelMaterial)
    // Large scale matching planet labels
    const baseScale = 40
    const orbitScale = Math.sqrt(orbitalElements.semi_major_axis_au)  // Scale based on orbital distance
    this.neoLabel.scale.set(baseScale * orbitScale, baseScale * orbitScale * 0.25, 1)
    this.neoLabel.position.set(0, neoRadius * 2, 0)  // Directly above NEO
    this.neoMesh.add(this.neoLabel)

    // Position NEO at encounter time if provided
    if (encounterTime && positionNeoAtTime) {
      positionNeoAtTime(encounterTime)
    } else if (this.orbitalMech) {
      const epochJD = orbitalElements.epoch_jd || this.orbitalMech.timeToJulianDate(encounterTime || new Date())
      const position = this.orbitalMech.calculateOrbitalPosition(orbitalElements, epochJD)
      this.neoMesh.position.copy(position)
    } else {
      // Fallback: position at perihelion
      const a = orbitalElements.semi_major_axis_au * this.AU / this.SCENE_SCALE
      const e = orbitalElements.eccentricity
      const perihelionDistance = a * (1 - e)
      this.neoMesh.position.set(perihelionDistance, 0, 0)
    }

    this.scene.add(this.neoMesh)

    console.log(`  ✅ NEO orbit created with label "${neoName}"`)
  }

  /**
   * Show encounter point marker (impact or near-miss)
   *
   * @param {Object} simulationData - Simulation results
   */
  showEncounterPoint(simulationData) {
    console.log("⚡ Showing encounter point...")

    if (!simulationData) return

    const isImpact = simulationData.impact
    const isNearMiss = simulationData.near_miss

    // Create encounter marker
    const markerGeometry = new THREE.SphereGeometry(
      this.EARTH_R_VISUAL / this.SCENE_SCALE * 0.3,
      16,
      16
    )

    const markerMaterial = new THREE.MeshBasicMaterial({
      color: isImpact ? 0xFF0000 : 0x00FF00,
      transparent: true,
      opacity: 0.8
    })

    if (this.encounterMarker) {
      this.scene.remove(this.encounterMarker)
    }

    this.encounterMarker = new THREE.Mesh(markerGeometry, markerMaterial)

    // Place at Earth's current position
    if (this.orbitalEarth) {
      this.encounterMarker.position.copy(this.orbitalEarth.position)
    }

    this.scene.add(this.encounterMarker)

    // Add pulsing animation flag
    this.encounterMarker.userData.pulse = true

    console.log(`  ✅ Encounter marked: ${isImpact ? '💥 IMPACT' : '✅ NEAR MISS'}`)
  }

  /**
   * Add velocity vectors for Earth and NEO
   *
   * @param {Object} simulationData - Simulation results
   * @param {Function} calculateEarthVelocity - Callback to calculate Earth velocity
   * @param {Function} calculateNeoVelocity - Callback to calculate NEO velocity
   */
  addVelocityVectors(simulationData, calculateEarthVelocity, calculateNeoVelocity) {
    console.log("➡️ Adding velocity vectors...")

    // Clear existing vectors
    if (this.velocityVectors) {
      this.velocityVectors.forEach(arrow => this.scene.remove(arrow))
      this.velocityVectors = []
    } else {
      this.velocityVectors = []
    }

    // Earth velocity vector
    if (this.orbitalEarth && calculateEarthVelocity) {
      const earthVelocity = calculateEarthVelocity()
      const earthArrow = this.createVelocityArrow(
        this.orbitalEarth.position,
        earthVelocity,
        0x4A90E2,
        "Earth: 29.8 km/s"
      )
      if (earthArrow) {
        this.scene.add(earthArrow)
        this.velocityVectors.push(earthArrow)
      }
    }

    // NEO velocity vector
    if (this.neoMesh && this.neoOrbitalElements && calculateNeoVelocity) {
      const neoVelocity = calculateNeoVelocity()
      const neoArrow = this.createVelocityArrow(
        this.neoMesh.position,
        neoVelocity,
        0xFF6B35,
        `NEO: ${(simulationData?.results?.relative_velocity_kms || 20).toFixed(1)} km/s`
      )
      if (neoArrow) {
        this.scene.add(neoArrow)
        this.velocityVectors.push(neoArrow)
      }
    }

    console.log("  ✅ Velocity vectors added")
  }

  /**
   * Create arrow helper for velocity visualization
   *
   * @param {THREE.Vector3} origin - Arrow origin
   * @param {THREE.Vector3} direction - Arrow direction
   * @param {number} color - Arrow color
   * @param {string} label - Arrow label
   * @returns {THREE.ArrowHelper|null}
   */
  createVelocityArrow(origin, direction, color, label) {
    if (!origin || !direction) return null

    const arrowLength = this.AU / this.SCENE_SCALE * 0.2  // 20% of AU
    const arrowHelper = new THREE.ArrowHelper(
      direction.normalize(),
      origin,
      arrowLength,
      color,
      arrowLength * 0.3,  // Head length
      arrowLength * 0.15   // Head radius
    )

    arrowHelper.userData.label = label
    return arrowHelper
  }

  /**
   * Clear all heliocentric objects from scene
   */
  clearHeliocentricObjects() {
    // Clean up all planets first
    if (this.planetManager) {
      this.planetManager.dispose()
      this.planetsCreated = false
    }

    // Remove Sun
    if (this.sun) {
      this.scene.remove(this.sun)
      this.sun = null
    }
    if (this.sunGlow) {
      this.scene.remove(this.sunGlow)
      this.sunGlow = null
    }
    if (this.sunLight) {
      this.scene.remove(this.sunLight)
      this.sunLight = null
    }

    // Remove Earth orbit
    if (this.earthOrbitLine) {
      this.scene.remove(this.earthOrbitLine)
      this.earthOrbitLine = null
    }
    if (this.orbitalEarth) {
      this.scene.remove(this.orbitalEarth)
      this.orbitalEarth = null
    }

    // Remove NEO orbit
    if (this.neoOrbitLine) {
      this.scene.remove(this.neoOrbitLine)
      this.neoOrbitLine = null
    }
    if (this.neoMesh) {
      this.scene.remove(this.neoMesh)
      this.neoMesh = null
    }
    if (this.neoLabel) {
      // Label is child of neoMesh, so it's already removed
      this.neoLabel = null
    }

    // Remove encounter marker
    if (this.encounterMarker) {
      this.scene.remove(this.encounterMarker)
      this.encounterMarker = null
    }

    // Remove starfield
    if (this.starfield) {
      this.scene.remove(this.starfield)
      this.starfield = null
    }

    // Remove velocity vectors
    if (this.velocityVectors) {
      this.velocityVectors.forEach(arrow => this.scene.remove(arrow))
      this.velocityVectors = []
    }
  }

  /**
   * Get references to created objects
   * Used by main controller for positioning
   */
  getObjects() {
    return {
      orbitalEarth: this.orbitalEarth,
      neoMesh: this.neoMesh,
      neoOrbitalElements: this.neoOrbitalElements,
      encounterTime: this.encounterTime
    }
  }

  /**
   * Position NEO at specific time
   */
  positionNeoAtTime(time) {
    if (!this.neoOrbitalElements || !this.neoMesh || !this.orbitalMech) return

    // Convert time to Julian Date
    const timeJD = this.orbitalMech.timeToJulianDate(time)

    // Calculate position
    const position = this.orbitalMech.calculateOrbitalPosition(this.neoOrbitalElements, timeJD)
    this.neoMesh.position.copy(position)

    console.log(`  📍 NEO positioned at JD ${timeJD.toFixed(2)}`)
  }

  /**
   * Position Earth at specific time on its orbit
   * NOTE: This is a SIMPLIFIED approximation. For scientific accuracy,
   * use positionObjectsFromBackendData() which uses proper ephemeris calculations.
   */
  positionEarthAtTime(time) {
    if (!this.orbitalEarth || !this.orbitalMech) {
      console.warn("  ⚠️ orbitalEarth not found, skipping positioning")
      return
    }

    try {
      // Simplified Earth position (circular orbit)
      const timeJD = this.orbitalMech.timeToJulianDate(time)
      const j2000 = 2451545.0
      const daysSinceJ2000 = timeJD - j2000

      // Earth's mean longitude (degrees)
      const meanLongitude = (100.46435 + 0.985609101 * daysSinceJ2000) % 360
      const angleRad = THREE.MathUtils.degToRad(meanLongitude)

      // Position on circular orbit
      const orbitRadius = this.AU / this.SCENE_SCALE
      this.orbitalEarth.position.set(
        Math.cos(angleRad) * orbitRadius,
        0,
        -Math.sin(angleRad) * orbitRadius  // Negative for correct direction
      )

      this.earthOrbitalAngle = angleRad
      console.log(`  🌍 Earth positioned at longitude ${meanLongitude.toFixed(1)}°`)
    } catch (error) {
      console.error("❌ Error positioning Earth:", error)
    }
  }

  /**
   * Position Earth and NEO using scientifically accurate backend calculations
   * This uses the actual heliocentric positions calculated by OrbitalMechanicsService
   */
  positionObjectsFromBackendData(visualization) {
    console.log("🔬 Positioning objects from backend orbital calculations...")

    try {
      // Backend provides positions in km, we need to convert to scene units
      const earthPos = visualization.earth_position  // [x, y, z] in km
      const neoPos = visualization.neo_position      // [x, y, z] in km

      console.log("  - Backend Earth position (km):", earthPos)
      console.log("  - Backend NEO position (km):", neoPos)

      // Convert from km to scene units
      if (this.orbitalEarth && earthPos && earthPos.length === 3) {
        this.orbitalEarth.position.set(
          earthPos[0] / this.SCENE_SCALE,
          earthPos[1] / this.SCENE_SCALE,
          earthPos[2] / this.SCENE_SCALE
        )
        console.log(`  ✅ Earth positioned at (${this.orbitalEarth.position.x.toFixed(2)}, ${this.orbitalEarth.position.y.toFixed(2)}, ${this.orbitalEarth.position.z.toFixed(2)}) scene units`)
      }

      if (this.neoMesh && neoPos && neoPos.length === 3) {
        this.neoMesh.position.set(
          neoPos[0] / this.SCENE_SCALE,
          neoPos[1] / this.SCENE_SCALE,
          neoPos[2] / this.SCENE_SCALE
        )
        console.log(`  ✅ NEO positioned at (${this.neoMesh.position.x.toFixed(2)}, ${this.neoMesh.position.y.toFixed(2)}, ${this.neoMesh.position.z.toFixed(2)}) scene units`)
      }

      // Calculate and display distance between them
      if (this.orbitalEarth && this.neoMesh) {
        const distance = this.orbitalEarth.position.distanceTo(this.neoMesh.position)
        const distanceKm = distance * this.SCENE_SCALE
        console.log(`  📏 Distance between Earth and NEO: ${distanceKm.toLocaleString()} km`)
      }

      console.log("  🎯 Objects positioned using scientifically accurate backend calculations")
    } catch (error) {
      console.error("❌ Error positioning objects from backend data:", error)
    }
  }
}
