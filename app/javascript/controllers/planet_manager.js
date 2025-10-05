// ============================================================================
// PLANET MANAGER
// ============================================================================
//
// Manages all planetary bodies in the heliocentric solar system view.
// Creates, positions, and updates all 8 planets with NASA-sourced textures.
//
// FEATURES:
// - Creates planet spheres with proper visual scaling
// - Loads NASA/public domain texture maps
// - Positions planets using Horizons API data or fallback calculations
// - Handles Saturn's rings as separate geometry
// - Provides hover labels and distance information
// - Optimized LOD (Level of Detail) for performance
//
// ============================================================================

import * as THREE from "three"

export class PlanetManager {
  constructor(scene, AU, SCENE_SCALE) {
    this.scene = scene
    this.AU = AU                    // 1 AU in km
    this.SCENE_SCALE = SCENE_SCALE  // Scene units per million km
    this.planets = {}               // Store planet meshes by name
    this.orbits = {}                // Store orbit lines by name
    this.labels = {}                // Store planet labels
    this.textureLoader = new THREE.TextureLoader()

    // Planet configuration with actual sizes and visual scales
    this.PLANET_CONFIG = {
      mercury: {
        name: 'Mercury',
        radius_km: 2439.7,
        visual_scale: 0.01,  // Visible but small
        orbit_radius_au: 0.387,
        color: 0x8C8C8C,
        texture: '/assets/mercury.jpg',
        segments: 32
      },
      venus: {
        name: 'Venus',
        radius_km: 6051.8,
        visual_scale: 0.02,  // Similar to Earth
        orbit_radius_au: 0.723,
        color: 0xFFC649,
        texture: '/assets/venus.jpg',
        segments: 32,
        atmosphere: true
      },
      earth: {
        name: 'Earth',
        radius_km: 6371,
        visual_scale: 0.02,  // Reference size - more visible
        orbit_radius_au: 1.000,
        color: 0x2E7FFF,
        texture: '/assets/earth.jpg',
        segments: 64,
        atmosphere: true,
        clouds: true
      },
      mars: {
        name: 'Mars',
        radius_km: 3389.5,
        visual_scale: 0.015,  // Smaller than Earth but visible
        orbit_radius_au: 1.524,
        color: 0xCD5C5C,
        texture: '/assets/mars.jpg',
        segments: 32
      },
      jupiter: {
        name: 'Jupiter',
        radius_km: 69911,
        visual_scale: 0.08,  // Clearly the largest
        orbit_radius_au: 5.203,
        color: 0xC88B3A,
        texture: '/assets/jupiter.jpg',
        segments: 64
      },
      saturn: {
        name: 'Saturn',
        radius_km: 58232,
        visual_scale: 0.07,  // Large with rings
        orbit_radius_au: 9.537,
        color: 0xFAD5A5,
        texture: '/assets/saturn.jpg',
        segments: 64,
        rings: {
          inner_radius: 1.2,
          outer_radius: 2.3,
          texture: '/assets/saturn_ring.png'
        }
      },
      uranus: {
        name: 'Uranus',
        radius_km: 25362,
        visual_scale: 0.04,  // Ice giant - medium size
        orbit_radius_au: 19.191,
        color: 0x4FD0E0,
        texture: '/assets/uranus.jpg',
        segments: 48,
        axial_tilt: 98
      },
      neptune: {
        name: 'Neptune',
        radius_km: 24622,
        visual_scale: 0.04,  // Similar to Uranus
        orbit_radius_au: 30.069,
        color: 0x4B70DD,
        texture: '/assets/neptune.jpg',
        segments: 48
      }
    }

    // Track loading status
    this.texturesLoaded = false
    this.loadingErrors = []
  }

  /**
   * Create all planets and add them to the scene
   * @param {boolean} useTextures - Whether to load texture files
   * @returns {Promise} Resolves when all planets are created
   */
  async createAllPlanets(useTextures = true) {
    console.log("🪐 Creating all planets...")

    const promises = []

    for (const [key, config] of Object.entries(this.PLANET_CONFIG)) {
      if (key === 'earth') {
        // Skip Earth as it's created by HeliocentricViewManager
        continue
      }

      promises.push(this.createPlanet(key, config, useTextures))
    }

    await Promise.all(promises)

    // Don't create orbit paths - we'll use labels instead
    // this.createOrbitPaths()

    // Create planet labels for identification
    this.createPlanetLabels()

    console.log(`✅ Created ${Object.keys(this.planets).length} planets with labels`)
    return this.planets
  }

  /**
   * Create a single planet
   * @private
   */
  async createPlanet(key, config, useTextures) {
    const visualRadius = config.visual_scale * this.AU / this.SCENE_SCALE

    // Create planet geometry
    const geometry = new THREE.SphereGeometry(
      visualRadius,
      config.segments,
      config.segments / 2
    )

    // Create material (with or without texture)
    let material
    if (useTextures) {
      material = await this.createPlanetMaterial(key, config)
    } else {
      // Fallback to colored material
      material = new THREE.MeshPhongMaterial({
        color: config.color,
        shininess: 20,
        emissive: config.color,
        emissiveIntensity: 0.1
      })
    }

    // Create planet mesh
    const planet = new THREE.Mesh(geometry, material)
    planet.name = config.name
    planet.userData = {
      key,
      config,
      orbitRadius: config.orbit_radius_au
    }

    // Position at default location on their actual orbital radius
    const orbitRadius = config.orbit_radius_au * this.AU / this.SCENE_SCALE
    // Spread planets evenly around the Sun for initial view
    const planetIndex = Object.keys(this.planets).length
    const defaultAngle = (planetIndex * 60) * Math.PI / 180  // 60 degrees apart

    planet.position.set(
      Math.cos(defaultAngle) * orbitRadius,
      0,
      Math.sin(defaultAngle) * orbitRadius
    )

    console.log(`  📍 ${config.name} positioned at ${orbitRadius.toFixed(2)} scene units (${config.orbit_radius_au} AU)`)

    // Add atmosphere for Venus
    if (config.atmosphere && key === 'venus') {
      this.addVenusAtmosphere(planet, visualRadius)
    }

    // Add rings for Saturn
    if (config.rings && key === 'saturn') {
      this.addSaturnRings(planet, visualRadius, config.rings, useTextures)
    }

    // Add axial tilt for Uranus
    if (config.axial_tilt) {
      planet.rotation.z = config.axial_tilt * Math.PI / 180
    }

    // Add to scene and store reference
    this.scene.add(planet)
    this.planets[key] = planet

    console.log(`  ✅ Created ${config.name} at ${config.orbit_radius_au} AU`)
  }

  /**
   * Create planet material with texture
   * @private
   */
  async createPlanetMaterial(key, config) {
    return new Promise((resolve) => {
      // Texture path is already complete in config
      const texturePath = config.texture

      // First check if texture file exists by trying to load it
      this.textureLoader.load(
        texturePath,
        (texture) => {
          // Success - create textured material
          texture.minFilter = THREE.LinearMipMapLinearFilter
          texture.magFilter = THREE.LinearFilter
          texture.anisotropy = 4

          const material = new THREE.MeshPhongMaterial({
            map: texture,
            shininess: key === 'earth' ? 10 : 5,
            bumpScale: 0.05
          })

          console.log(`  ✅ Loaded texture for ${config.name}`)
          resolve(material)
        },
        undefined,
        (error) => {
          // Error - fallback to colored material
          console.warn(`  ⚠️ Texture not found for ${config.name}, using color fallback`)
          this.loadingErrors.push(`${config.name}: ${error.message}`)

          const material = new THREE.MeshPhongMaterial({
            color: config.color,
            shininess: 20,
            emissive: config.color,
            emissiveIntensity: 0.1
          })
          resolve(material)
        }
      )
    })
  }

  /**
   * Add atmosphere effect to Venus
   * @private
   */
  addVenusAtmosphere(planet, radius) {
    const atmosphereGeometry = new THREE.SphereGeometry(radius * 1.05, 32, 32)
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
      color: 0xFFE4B5,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    })

    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
    planet.add(atmosphere)
  }

  /**
   * Add rings to Saturn
   * @private
   */
  addSaturnRings(planet, planetRadius, ringConfig, useTextures) {
    const innerRadius = planetRadius * ringConfig.inner_radius
    const outerRadius = planetRadius * ringConfig.outer_radius

    // Create ring geometry
    const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64)

    // Create ring material
    let ringMaterial
    if (useTextures) {
      // Try to load ring texture (path is already complete in ringConfig)
      const texturePath = ringConfig.texture
      this.textureLoader.load(
        texturePath,
        (texture) => {
          texture.rotation = Math.PI / 2  // Rotate texture to align properly
          ringMaterial = new THREE.MeshPhongMaterial({
            map: texture,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
          })
          const rings = new THREE.Mesh(ringGeometry, ringMaterial)
          rings.rotation.x = Math.PI / 2  // Rotate to horizontal
          planet.add(rings)
          console.log("  ✅ Added Saturn's rings with texture")
        },
        undefined,
        () => {
          // Fallback to simple colored rings
          this.createFallbackRings(planet, ringGeometry)
        }
      )
    } else {
      this.createFallbackRings(planet, ringGeometry)
    }
  }

  /**
   * Create fallback colored rings for Saturn
   * @private
   */
  createFallbackRings(planet, ringGeometry) {
    const ringMaterial = new THREE.MeshPhongMaterial({
      color: 0xE6D2B5,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    })

    const rings = new THREE.Mesh(ringGeometry, ringMaterial)
    rings.rotation.x = Math.PI / 2  // Rotate to horizontal
    planet.add(rings)
    console.log("  ✅ Added Saturn's rings (color fallback)")
  }

  /**
   * Create planet labels using Sprites - FIXED VERSION
   */
  createPlanetLabels() {
    console.log("🏷️ Creating planet labels...")

    // Add Earth label too since it's special
    const allPlanets = { ...this.planets }

    // Check if Earth exists in the scene
    const earthMesh = this.scene.getObjectByName('Earth')
    if (earthMesh) {
      allPlanets.earth = earthMesh
    }

    for (const [key, planet] of Object.entries(allPlanets)) {
      const config = this.PLANET_CONFIG[key]
      if (!config) continue

      // Create much larger canvas for the label
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.width = 1024
      canvas.height = 256

      // Draw text with HUGE font
      context.font = 'Bold 180px Arial'
      context.fillStyle = 'rgba(255, 255, 255, 1.0)'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText(config.name, 512, 128)

      // Create texture from canvas
      const texture = new THREE.CanvasTexture(canvas)
      texture.needsUpdate = true

      // Create sprite material
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 1.0,
        depthTest: false,
        sizeAttenuation: true  // Scale with distance
      })

      // Create sprite
      const label = new THREE.Sprite(spriteMaterial)

      // MASSIVE scale - this is the key fix
      const baseScale = 50  // Much larger base scale
      const orbitScale = Math.sqrt(config.orbit_radius_au)  // Scale with distance
      label.scale.set(baseScale * orbitScale, baseScale * orbitScale * 0.25, 1)

      // Position label directly above the planet (local coordinates)
      const planetRadius = config.visual_scale * this.AU / this.SCENE_SCALE
      label.position.set(0, planetRadius * 2, 0)  // Directly above

      // Add to planet as child so it moves with it
      planet.add(label)

      // Store reference
      this.labels[key] = label

      console.log(`  ✅ Added LARGE label for ${config.name} (scale: ${baseScale * orbitScale})`)
    }
  }

  /**
   * DEPRECATED: Create orbital path lines for all planets
   * Keeping for reference but not using - real orbits are elliptical
   * and vary in eccentricity, making simple circles inaccurate
   */
  createOrbitPaths() {
    console.log("🌌 Creating orbital paths...")

    // Store orbital inclinations (approximate values in degrees)
    const orbitalInclinations = {
      mercury: 7.0,
      venus: 3.4,
      earth: 0.0,  // Reference plane
      mars: 1.85,
      jupiter: 1.3,
      saturn: 2.5,
      uranus: 0.77,
      neptune: 1.77
    }

    for (const [key, config] of Object.entries(this.PLANET_CONFIG)) {
      const orbitRadius = config.orbit_radius_au * this.AU / this.SCENE_SCALE
      const segments = 256
      const inclination = (orbitalInclinations[key] || 0) * Math.PI / 180  // Convert to radians

      // Create elliptical orbit with inclination
      const orbitPoints = []
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2

        // Position in orbital plane
        const x = Math.cos(angle) * orbitRadius
        const z = Math.sin(angle) * orbitRadius

        // Apply inclination (tilt the orbit)
        const y = z * Math.sin(inclination)
        const z_tilted = z * Math.cos(inclination)

        orbitPoints.push(new THREE.Vector3(x, y, z_tilted))
      }

      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints)

      // Color based on planet type
      let orbitColor, opacity
      if (key === 'mercury' || key === 'venus' || key === 'earth' || key === 'mars') {
        // Inner planets - brighter, thinner lines
        orbitColor = config.color
        opacity = 0.4
      } else {
        // Outer planets - dimmer, dotted appearance
        orbitColor = config.color
        opacity = 0.25
      }

      const orbitMaterial = new THREE.LineBasicMaterial({
        color: orbitColor,
        opacity,
        transparent: true,
        linewidth: 1  // Note: linewidth may not work in all renderers
      })

      const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial)
      orbitLine.name = `${config.name}_orbit`

      this.scene.add(orbitLine)
      this.orbits[key] = orbitLine
    }

    console.log("  ✅ Created inclined orbit paths for all planets")
  }

  /**
   * Update planet positions from backend Horizons data
   * @param {Object} planetsData - Planet positions from backend
   */
  updatePlanetPositions(planetsData) {
    if (!planetsData) return

    console.log("📍 Updating planet positions from Horizons data...")

    for (const [key, data] of Object.entries(planetsData)) {
      const planet = this.planets[key]
      if (!planet) continue

      // Convert from km to scene units
      const x = data.position[0] / this.SCENE_SCALE
      const y = data.position[1] / this.SCENE_SCALE
      const z = data.position[2] / this.SCENE_SCALE

      planet.position.set(x, y, z)

      // Store velocity for visualization if needed
      planet.userData.velocity = data.velocity

      if (data.fallback) {
        console.log(`  ⚠️ ${key}: Using fallback position`)
      } else {
        console.log(`  ✅ ${key}: Positioned at (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)})`)
      }
    }
  }

  /**
   * Position planets at specific time using Horizons API or orbital calculations
   * @param {Date} time - Time for planet positions
   * @param {Function} fetchCallback - Optional callback to fetch from Horizons
   */
  async positionPlanetsAtTime(time, fetchCallback = null) {
    console.log(`🕐 Positioning planets at ${time}...`)

    if (fetchCallback) {
      // Use provided callback to fetch positions
      try {
        const positions = await fetchCallback(time)
        this.updatePlanetPositions(positions)
      } catch (error) {
        console.error("❌ Failed to fetch planet positions:", error)
        this.positionPlanetsDefault(time)
      }
    } else {
      // Use simple circular orbit approximation
      this.positionPlanetsDefault(time)
    }
  }

  /**
   * Position planets using simple circular orbit approximation
   * @private
   */
  positionPlanetsDefault(time) {
    const j2000 = new Date('2000-01-01T12:00:00Z')
    const daysSinceJ2000 = (time - j2000) / (1000 * 60 * 60 * 24)

    // Orbital periods in Earth years
    const periods = {
      mercury: 0.241,
      venus: 0.615,
      mars: 1.881,
      jupiter: 11.86,
      saturn: 29.46,
      uranus: 84.01,
      neptune: 164.8
    }

    for (const [key, planet] of Object.entries(this.planets)) {
      const config = this.PLANET_CONFIG[key]
      const period = periods[key] || 1.0

      // Calculate mean anomaly
      const meanAnomaly = (360.0 * daysSinceJ2000 / (period * 365.25)) % 360.0
      const angleRad = meanAnomaly * Math.PI / 180.0

      // Position on circular orbit
      const orbitRadius = config.orbit_radius_au * this.AU / this.SCENE_SCALE
      planet.position.set(
        Math.cos(angleRad) * orbitRadius,
        0,
        Math.sin(angleRad) * orbitRadius
      )
    }

    console.log("  ✅ Positioned planets using orbital approximations")
  }

  /**
   * Animate planets (rotation on axis)
   * @param {number} delta - Time delta for animation
   */
  animatePlanets(delta) {
    // Rotation speeds (relative to Earth = 1)
    const rotationSpeeds = {
      mercury: 0.017,
      venus: -0.004,  // Retrograde rotation
      mars: 0.97,
      jupiter: 2.4,
      saturn: 2.2,
      uranus: -1.4,   // Retrograde
      neptune: 1.5
    }

    for (const [key, planet] of Object.entries(this.planets)) {
      const speed = rotationSpeeds[key] || 1.0
      planet.rotation.y += delta * speed * 0.1
    }
  }

  /**
   * Get planet by name
   * @param {string} name - Planet name
   * @returns {THREE.Mesh|null}
   */
  getPlanet(name) {
    return this.planets[name] || null
  }

  /**
   * Show/hide orbit paths
   * @param {boolean} visible - Whether to show orbits
   */
  setOrbitsVisible(visible) {
    for (const orbit of Object.values(this.orbits)) {
      orbit.visible = visible
    }
  }

  /**
   * Clean up all planets and orbits
   */
  dispose() {
    console.log("🧹 Disposing planet manager resources...")

    // Remove planets
    for (const planet of Object.values(this.planets)) {
      this.scene.remove(planet)
      planet.geometry.dispose()
      if (planet.material.map) planet.material.map.dispose()
      planet.material.dispose()
    }

    // Remove orbits
    for (const orbit of Object.values(this.orbits)) {
      this.scene.remove(orbit)
      orbit.geometry.dispose()
      orbit.material.dispose()
    }

    this.planets = {}
    this.orbits = {}
    this.labels = {}

    console.log("  ✅ Planet manager disposed")
  }
}