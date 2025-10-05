// ============================================================================
// CESIUM IMPACT CONTROLLER - NASA Asteroid Impact Simulator
// ============================================================================
//
// PURPOSE:
// This Stimulus controller provides 3D visualization for asteroid impact
// simulations using Three.js. It handles:
// 1. Rendering a realistic Earth with geography
// 2. Visualizing meteor trajectory from space to impact
// 3. Displaying physics-based damage rings
// 4. Providing interactive timeline and camera controls
//
// ARCHITECTURE OVERVIEW:
// - Frontend (this file): Visualization only - trajectory interpolation, 3D rendering
// - Backend (Physics::Engine): All physics calculations - entry, blast, crater, etc.
//
// DATA FLOW:
// User Form → POST /simulate → Physics::Engine → JSON Response → This Controller → 3D Visualization
//
// PARAMETERS SENT TO BACKEND (see simulate()):
// - diameter_m: Impactor diameter in meters
// - density_kg_m3: Impactor density in kg/m³
// - velocity_kms: Approach velocity in km/s
// - impact_angle_deg: Impact angle from horizontal (5-90°)
// - azimuth_deg: Approach direction (0° = North, 90° = East)
// - lat, lng: Impact coordinates
// - strength_mpa: Material strength in MPa (for airburst calculation)
// - ocean_depth_m: Ocean depth if applicable
// - mitigation_type: Deflection/disruption strategy
//
// RESPONSE FROM BACKEND (see processSimulationData()):
// - results: { energy_megatons_tnt, mode (airburst/ground), crater dimensions,
//              damage radii, thermal/seismic/tsunami effects, threat assessment }
// - rings: [ { radius_km, color, label, type }, ... ] - Damage zone circles
// - entry_track: [ { lat, lng, altitude_km, velocity_kms, mass_fraction }, ... ]
// - timeline: Event sequence with timestamps
// - visualization: Additional rendering data
//
// PHYSICS MODULES USED (Backend - app/services/physics/):
// - Entry: Atmospheric entry, drag, airburst detection
// - Blast: Overpressure and blast wave calculations
// - Crater: Transient/final crater dimensions
// - Thermal: Thermal radiation effects
// - Seismic: Ground shaking (ground impacts only)
// - Atmospheric: Dust, climate effects
// - Ejecta: Impact debris distribution
// - Tsunami: Ocean impact wave modeling
// - Mitigation: Deflection strategy effectiveness
//
// ============================================================================

import { Controller } from "@hotwired/stimulus"
import { post } from "@rails/request.js"
import * as THREE from "three"
import { OrbitControls } from "OrbitControls"
import { feature } from "topojson-client"

// ============================================================================
// MODULAR ARCHITECTURE - Import specialized visualization modules
// ============================================================================
import { ThreeJSUtils } from "../services/impact_visualization/three_js_utils.js"
import { OrbitalMechanicsCalculator } from "../services/impact_visualization/orbital_mechanics_calculator.js"
import { HeliocentricViewManager } from "../services/impact_visualization/heliocentric_view_manager.js"
import { GeocentricViewManager } from "../services/impact_visualization/geocentric_view_manager.js"
import { ImpactVisualizer } from "../services/impact_visualization/impact_visualizer.js"
import { TimelineController } from "../services/impact_visualization/timeline_controller.js"
import { ViewSwitchManager } from "../services/impact_visualization/view_switch_manager.js"
import { ViewState } from "../services/impact_visualization/view_state.js"

export default class extends Controller {
  // ============================================================================
  // STIMULUS CONFIGURATION
  // ============================================================================

  static targets = [
    // Rendering
    "cesiumContainer",

    // Form controls
    "form","simulateBtn","simCount","threatLevel",

    // Input parameters (these map directly to Physics::Engine params)
    "diameterInput",     // diameter_m
    "velocityInput",     // velocity_kms
    "angleInput",        // impact_angle_deg
    "orbitalInput",      // orbital elements data (JSON)
    "azimuthInput",      // azimuth_deg
    "latInput",          // lat
    "lngInput",          // lng
    "densityInput",      // density_kg_m3
    "strengthInput",     // strength_mpa
    "orbitalInput",      // orbital_data (Keplerian elements JSON)

    // Timeline controls
    "metrics","timeline","playBtn","timelineProgress",
    "timelineHandle","timeStart","timeEnd",

    // Results display (populated from backend response)
    "energyValue",       // results.energy_megatons_tnt
    "craterValue",       // results.final_crater_d_m
    "modeValue",         // results.mode (airburst vs ground)
    "vaporizationValue", // results.vaporization_radius_km
    "thermalValue",      // results.thermal_radiation_radius_km
    "blastValue",        // results.severe_blast_radius_km
    "tsunamiValue"       // results.tsunami_100km_m
  ]

  static values = {
    particleUrl: String,
    smokeUrl: String,
    worldUrl: String
  }

  // ============================================================================
  // CONFIGURATION CONSTANTS
  // ============================================================================

  /**
   * Configuration object for visualization parameters
   * Centralized configuration for easy tuning and testing
   */
  static get CONFIG() {
    return {
      // Physical constants
      EARTH_RADIUS_M: 6_371_000,  // Earth radius in meters (geocentric view)

      // Astronomical units and scales
      AU_KM: 149_597_870.7,       // 1 AU in kilometers
      SCENE_SCALE: 1000000,        // 1 scene unit = 1 million km (for heliocentric view)
      SUN_RADIUS_KM: 696_000,      // Actual sun radius in km

      // Visual scaling (for visibility in heliocentric view)
      SUN_VISUAL_SCALE: 0.1,       // Sun visual size as fraction of AU (10%)
      EARTH_VISUAL_SCALE: 0.05,    // Earth visual size as fraction of AU (5%)

      // Animation timing
      SIMULATION_DURATION_MS: 30000,  // Total playback duration (30 seconds)
      IMPACT_TIME_MS: 25000,          // Time when impact occurs (25 seconds)

      // Trajectory parameters
      TRAJECTORY_POINTS: 100,          // Number of points in trajectory
      TRAJECTORY_START_DISTANCE: 5,    // Start distance (in Earth radii)

      // Meteor visualization
      METEOR_VISUAL_SCALE: 45,         // Visual exaggeration multiplier
      METEOR_MAX_VISUAL_SIZE_M: 20000, // Maximum visual meteor size

      // Camera settings
      CAMERA_FOV: 45,                  // Field of view (degrees)
      CAMERA_NEAR_PLANE: 1000,         // Near clipping plane (geocentric)
      CAMERA_FAR_MULTIPLIER: 100,      // Far plane multiplier

      // Rendering
      MAX_PIXEL_RATIO: 1.5,            // Maximum device pixel ratio for performance
      STARFIELD_COUNT: 10000,          // Number of stars in background

      // Timeline
      ORBITAL_TIMELINE_DAYS: 30        // Days before/after encounter for timeline
    }
  }

  // ============================================================================
  // LIFECYCLE: INITIALIZATION
  // ============================================================================

  /**
   * Stimulus lifecycle: connect()
   * Called automatically when controller is attached to DOM
   *
   * INITIALIZATION SEQUENCE:
   * 1. Load configuration constants
   * 2. Initialize view state management
   * 3. Setup Three.js renderer
   * 4. Create 3D scene with starfield
   * 5. Configure camera and controls
   * 6. Setup lighting
   * 7. Initialize visualization modules
   * 8. Setup default view (heliocentric)
   * 9. Start animation loop
   * 10. Attach event listeners
   *
   * @public
   * @returns {void}
   */
  connect() {
    console.log("🚀 Cesium Impact Controller: Initializing...")

    // Get configuration
    const cfg = this.constructor.CONFIG

    // Initialize scales from config
    this.EARTH_R = cfg.EARTH_RADIUS_M

    // View modes
    this.VIEW_MODES = {
      HELIOCENTRIC: 'heliocentric',  // Sun-centered orbital view (default)
      GEOCENTRIC: 'geocentric'        // Earth-centered impact view
    }

    // Heliocentric view scales (from config)
    this.AU = cfg.AU_KM
    this.SCENE_SCALE = cfg.SCENE_SCALE
    this.SUN_R_ACTUAL = cfg.SUN_RADIUS_KM
    this.SUN_R_VISUAL = cfg.SUN_VISUAL_SCALE * this.AU
    this.EARTH_R_VISUAL = cfg.EARTH_VISUAL_SCALE * this.AU

    // Initialize view state management
    this.viewState = new ViewState(this.VIEW_MODES.HELIOCENTRIC)
    this.currentView = this.viewState.getViewMode()  // Sync with ViewState

    this.resetState()
    this.setupRenderer()
    this.setupScene()
    this.setupCamera()
    this.setupLighting()

    // ============================================================================
    // Initialize modular visualization components
    // ============================================================================
    this.initializeModules()

    // Setup appropriate view
    if (this.currentView === this.VIEW_MODES.HELIOCENTRIC) {
      this.setupHeliocentricView()
    } else {
      this.geocentricView.setupEarth()
      this.geocentricView.loadGeography(this.worldUrlValue)
    }

    this.animate = this.animate.bind(this)
    this.renderer.setAnimationLoop(this.animate)
    this.setupEventListeners()

    console.log("✅ Cesium Impact Controller: Ready")
  }

  /**
   * Reset all simulation state variables
   * Called on initialization and when starting a new simulation
   */
  resetState() {
    const cfg = this.constructor.CONFIG

    this.simCount = 0
    this.playing = false
    this.simulationTime = 0
    this.simulationDuration = cfg.SIMULATION_DURATION_MS
    this.impactTime = cfg.IMPACT_TIME_MS

    // Trajectory data (calculated in processSimulationData)
    this.trajectory = []

    // Three.js objects
    this.meteorObject = null
    this.trailLine = null
    this.impactOccurred = false
    this.damageRings = []
    this.infoOverlays = []

    // Animation state
    this.clock = new THREE.Clock()
    this.cameraFollowing = false

    // Geography data
    this.countryData = null
    this.hoveredCountry = null
  }

  // ============================================================================
  // THREE.JS SETUP: RENDERING
  // ============================================================================

  /**
   * Initialize WebGL renderer with optimized settings
   * Creates the canvas element and appends to DOM
   */
  setupRenderer() {
    const cfg = this.constructor.CONFIG
    const container = this.cesiumContainerTarget

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      alpha: false
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, cfg.MAX_PIXEL_RATIO))
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setClearColor(0x000000)
    container.appendChild(this.renderer.domElement)

    // Create tooltip for country hover
    this.tooltip = document.createElement('div')
    this.tooltip.style.cssText = `
      position: absolute;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 12px;
      pointer-events: none;
      display: none;
      z-index: 1000;
    `
    container.appendChild(this.tooltip)

    console.log("🎨 Renderer initialized:", container.clientWidth, "x", container.clientHeight)
  }

  /**
   * Create Three.js scene with starfield background
   * Stars are distributed in a sphere using spherical coordinates
   */
  setupScene() {
    this.scene = new THREE.Scene()

    // Only add fog for geocentric view
    if (this.currentView === this.VIEW_MODES.GEOCENTRIC) {
      this.scene.fog = new THREE.Fog(0x000011, this.EARTH_R * 2, this.EARTH_R * 20)

      // Enhanced starfield with varying brightness and colors (for geocentric)
      const cfg = this.constructor.CONFIG
      const starsGeometry = new THREE.BufferGeometry()
      const starPositions = []
      const starColors = []
      const starCount = cfg.STARFIELD_COUNT

      for (let i = 0; i < starCount; i++) {
        // Spherical distribution (uniform on sphere surface)
        const theta = Math.random() * Math.PI * 2  // Azimuthal angle
        const phi = Math.acos(2 * Math.random() - 1)  // Polar angle (uniform distribution)
        const r = this.EARTH_R * (30 + Math.random() * 70)

      // Convert spherical to Cartesian coordinates
      starPositions.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      )

      // Vary star colors (yellowish, white, bluish) based on stellar temperatures
      const intensity = 0.5 + Math.random() * 0.5
      const temp = Math.random()
      if (temp < 0.3) {
        starColors.push(intensity, intensity * 0.95, intensity * 0.9) // Yellowish (cooler stars)
      } else if (temp < 0.7) {
        starColors.push(intensity, intensity, intensity) // White
      } else {
        starColors.push(intensity * 0.9, intensity * 0.95, intensity) // Bluish (hotter stars)
      }
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3))
    starsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3))

    const starsMaterial = new THREE.PointsMaterial({
      size: 150,
      vertexColors: true,
      sizeAttenuation: false
    })
      this.stars = new THREE.Points(starsGeometry, starsMaterial)
      this.scene.add(this.stars)

      console.log("🌌 Scene created with", starCount, "stars")
    } else {
      // For heliocentric view, we'll add stars in setupHeliocentricView
      console.log("🎬 Scene created for heliocentric view")
    }

    // Set background color
    this.scene.background = new THREE.Color(0x000011)  // Very dark space
  }

  /**
   * Setup camera and orbit controls
   * PerspectiveCamera mimics human eye perspective
   * OrbitControls allow user to rotate/zoom around Earth
   */
  setupCamera() {
    const cfg = this.constructor.CONFIG
    const container = this.cesiumContainerTarget

    // Different camera settings for different views
    if (this.currentView === this.VIEW_MODES.HELIOCENTRIC) {
      // Heliocentric view needs different near/far planes
      const sceneSize = this.AU / this.SCENE_SCALE * 3  // 3 AU viewing distance
      this.camera = new THREE.PerspectiveCamera(
        cfg.CAMERA_FOV,
        container.clientWidth / container.clientHeight,
        0.1,  // Near clipping plane (closer for space view)
        sceneSize * cfg.CAMERA_FAR_MULTIPLIER
      )

      // Position will be set by setupOrbitalCamera
      console.log("📷 Camera setup for heliocentric view")
    } else {
      // Geocentric view camera
      this.camera = new THREE.PerspectiveCamera(
        cfg.CAMERA_FOV,
        container.clientWidth / container.clientHeight,
        cfg.CAMERA_NEAR_PLANE,
        this.EARTH_R * cfg.CAMERA_FAR_MULTIPLIER
      )
      this.camera.position.set(0, this.EARTH_R * 2, this.EARTH_R * 3)
      console.log("📷 Camera setup for geocentric view")
    }

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05

    // Controls will be further configured by view-specific setup methods

    console.log("📷 Camera initialized")
  }

  /**
   * Add lighting to scene
   * - Directional light simulates the Sun
   * - Ambient light ensures visibility on dark side
   * - Hemisphere light creates atmospheric effect
   */
  setupLighting() {
    // Sun light with shadows for depth
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5)
    sunLight.position.set(this.EARTH_R * 5, this.EARTH_R * 3, this.EARTH_R * 2)
    this.scene.add(sunLight)

    // Ambient light for visibility
    const ambientLight = new THREE.AmbientLight(0x404060, 0.4)
    this.scene.add(ambientLight)

    // Hemisphere light for Earth atmosphere effect
    const hemiLight = new THREE.HemisphereLight(0x4488ff, 0x224488, 0.3)
    this.scene.add(hemiLight)

    console.log("💡 Lighting configured")
  }

  /**
   * Initialize all modular visualization components
   * Creates instances of specialized managers for different aspects of visualization
   *
   * MODULES INITIALIZED:
   * - OrbitalMechanicsCalculator: Keplerian orbit calculations
   * - HeliocentricViewManager: Sun-centered orbital view
   * - GeocentricViewManager: Earth-centered impact view
   * - ImpactVisualizer: Meteor trajectory and impact effects
   * - TimelineController: Timeline controls and playback
   * - ViewSwitchManager: View mode transitions
   *
   * Must be called after scene, camera, and renderer are set up
   *
   * @private
   * @returns {void}
   */
  initializeModules() {
    console.log("🔧 Initializing visualization modules...")

    // Orbital mechanics calculator
    this.orbitalMech = new OrbitalMechanicsCalculator(
      this.AU,
      this.SCENE_SCALE,
      this.EARTH_R
    )

    // Heliocentric view manager
    this.heliocentricView = new HeliocentricViewManager(
      this.scene,
      this.camera,
      this.controls,
      this.AU,
      this.SCENE_SCALE,
      this.SUN_R_VISUAL,
      this.EARTH_R_VISUAL,
      this.orbitalMech
    )

    // Geocentric view manager
    this.geocentricView = new GeocentricViewManager(
      this.scene,
      this.EARTH_R,
      (lat, lng, radius) => ThreeJSUtils.latLngToVector3(lat, lng, radius)
    )

    // Impact visualizer
    this.impactViz = new ImpactVisualizer(
      this.scene,
      this.camera,
      this.controls,
      this.EARTH_R,
      (lat, lng, radius) => ThreeJSUtils.latLngToVector3(lat, lng, radius),
      (lat, lng, bearing, distance) => ThreeJSUtils.calculateGeodesicPoint(lat, lng, bearing, distance, this.EARTH_R),
      (t) => ThreeJSUtils.easeInOutCubic(t)
    )

    // Timeline controller
    this.timelineCtrl = new TimelineController(
      this.cesiumContainerTarget,
      this.hasTimelineTarget
    )

    // View switch manager
    this.viewSwitcher = new ViewSwitchManager(
      this,
      this.scene,
      this.heliocentricView,
      this.geocentricView,
      this.EARTH_R
    )

    console.log("✅ All modules initialized")
  }

  // ============================================================================
  // HELIOCENTRIC VIEW (Sun-centered orbital visualization)
  // ============================================================================

  /**
   * Setup heliocentric (Sun-centered) view for orbital visualization
   */
  setupHeliocentricView() {
    console.log("🌟 Setting up heliocentric view...")

    try {
      // Clear any existing geocentric objects
      this.geocentricView.clearGeocentricObjects()

      // Add starfield for visual appeal
      this.heliocentricView.createStarfield()

      // Create the Sun
      this.heliocentricView.createSun()

      // Create Earth's orbit path
      this.heliocentricView.createEarthOrbit()

      // Create Earth at its orbital position
      this.heliocentricView.createOrbitalEarth()

      // Position Earth at current time for initial view
      this.positionEarthAtTime(new Date())

      // Setup camera for orbital view
      this.heliocentricView.setupOrbitalCamera()

      // Add initial ambient lighting
      const ambientLight = new THREE.AmbientLight(0x222244, 0.3)
      this.scene.add(ambientLight)

      // Start with slow Earth orbit animation
      this.defaultOrbitalAnimation = true

      // Add welcome info panel
      this.heliocentricView.showWelcomePanel()

      console.log("✅ Heliocentric view initialized")

      // Debug: List all objects in the scene
      this.debugScene()
    } catch (error) {
      console.error("❌ Error setting up heliocentric view:", error)
      console.error("Stack:", error.stack)
      throw error
    }
  }

  /**
   * Debug method to list all objects in the scene
   */
  debugScene() {
    try {
      console.log("🔍 DEBUG: Scene contents:")
      if (!this.scene) {
        console.log("  ❌ Scene is undefined!")
        return
      }

      console.log(`  - Total children: ${this.scene.children.length}`)

      this.scene.children.forEach((child, index) => {
        console.log(`  ${index}: ${child.type} - ${child.name || 'unnamed'}`)
        if (child.position) {
          console.log(`      Position: (${child.position.x.toFixed(2)}, ${child.position.y.toFixed(2)}, ${child.position.z.toFixed(2)})`)
        }
        if (child.geometry && child.geometry.parameters) {
          if (child.geometry.type === 'SphereGeometry') {
            const params = child.geometry.parameters
            console.log(`      Radius: ${params.radius}`)
          }
        }
      })

      if (this.camera && this.camera.position) {
        console.log(`  - Camera position: (${this.camera.position.x.toFixed(2)}, ${this.camera.position.y.toFixed(2)}, ${this.camera.position.z.toFixed(2)})`)
        console.log(`  - Camera looking at: (0, 0, 0)`)
      }

      if (this.renderer && this.renderer.domElement) {
        console.log(`  - Renderer size: ${this.renderer.domElement.width}x${this.renderer.domElement.height}`)
      }
    } catch (error) {
      console.error("❌ Error in debugScene:", error)
    }
  }


  /**
   * Position NEO at specific time - delegates to HeliocentricViewManager
   */
  positionNeoAtTime(time) {
    this.heliocentricView.positionNeoAtTime(time)
  }

  /**
   * Position Earth and NEO using backend calculations - delegates to HeliocentricViewManager
   */
  positionObjectsFromBackendData(visualization) {
    this.heliocentricView.positionObjectsFromBackendData(visualization)
  }

  /**
   * Position Earth at specific time - delegates to HeliocentricViewManager
   */
  positionEarthAtTime(time) {
    this.heliocentricView.positionEarthAtTime(time)
  }




  // ============================================================================
  // GEOCENTRIC VIEW (Earth-centered impact visualization)
  // ============================================================================

  // ============================================================================
  // INPUT VALIDATION
  // ============================================================================

  /**
   * Validate simulation input parameters
   * @private
   * @returns {Object} { valid: boolean, errors: Array<string> }
   */
  _validateInputs() {
    const errors = []
    const cfg = this.constructor.CONFIG

    // Validate diameter
    const diameter = parseFloat(this.diameterInputTarget.value)
    if (isNaN(diameter) || diameter <= 0) {
      errors.push("Diameter must be a positive number")
    } else if (diameter > 100000) {
      errors.push("Diameter cannot exceed 100,000 meters")
    }

    // Validate density
    const density = parseFloat(this.densityInputTarget.value)
    if (isNaN(density) || density <= 0) {
      errors.push("Density must be a positive number")
    } else if (density < 500 || density > 10000) {
      errors.push("Density should be between 500-10,000 kg/m³")
    }

    // Validate velocity
    const velocity = parseFloat(this.velocityInputTarget.value)
    if (isNaN(velocity) || velocity <= 0) {
      errors.push("Velocity must be a positive number")
    } else if (velocity < 1 || velocity > 100) {
      errors.push("Velocity should be between 1-100 km/s")
    }

    // Validate angle
    const angle = parseFloat(this.angleInputTarget.value)
    if (isNaN(angle) || angle < 5 || angle > 90) {
      errors.push("Impact angle must be between 5-90 degrees")
    }

    // Validate coordinates
    const lat = parseFloat(this.latInputTarget.value)
    const lng = parseFloat(this.lngInputTarget.value)
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push("Latitude must be between -90 and 90 degrees")
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.push("Longitude must be between -180 and 180 degrees")
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Display validation errors to user
   * @private
   * @param {Array<string>} errors - List of error messages
   */
  _showValidationErrors(errors) {
    const message = "Please fix the following errors:\n\n" + errors.join("\n")
    alert(message)
    console.error("❌ Validation errors:", errors)
  }

  // ============================================================================
  // SIMULATION: BACKEND COMMUNICATION
  // ============================================================================

  /**
   * MAIN SIMULATION TRIGGER
   *
   * Called when user clicks "Run Simulation"
   *
   * FLOW:
   * 1. Collect form parameters (diameter, velocity, angle, location, etc.)
   * 2. POST to /simulate endpoint
   * 3. Backend Physics::Engine calculates all effects
   * 4. Receive JSON response with results, rings, timeline
   * 5. Process data and start 3D visualization
   *
   * PARAMETERS SENT (FormData):
   * - diameter_m: Impactor diameter (meters)
   * - density_kg_m3: Impactor density (kg/m³)
   * - velocity_kms: Impact velocity (km/s)
   * - impact_angle_deg: Angle from horizontal (5-90°)
   * - azimuth_deg: Approach direction (0° = N, 90° = E, 180° = S, 270° = W)
   * - lat, lng: Impact coordinates
   * - strength_mpa: Material strength (MPa) - determines airburst altitude
   * - ocean_depth_m: Ocean depth if applicable (triggers tsunami calculations)
   * - mitigation_type: "none", "kinetic", "nuclear", etc.
   *
   * RESPONSE STRUCTURE (from Physics::Engine):
   * {
   *   ok: true,
   *   results: {
   *     mode: "airburst" | "ground",
   *     energy_megatons_tnt: float,
   *     burst_alt_km: float (if airburst),
   *     final_crater_d_m: float (if ground),
   *     crater_depth_m: float,
   *     vaporization_radius_km: float,
   *     severe_blast_radius_km: float,
   *     moderate_blast_radius_km: float,
   *     window_damage_radius_km: float,
   *     thermal_radiation_radius_km: float,
   *     seismic_damage_radius_km: float (ground only),
   *     tsunami_100km_m: float (ocean only),
   *     damage_assessment: {
   *       threat_level: "MINIMAL"|"MINOR"|"LOCAL"|"REGIONAL"|"CONTINENTAL"|"EXTINCTION",
   *       evacuation_radius_km: float,
   *       ...
   *     }
   *   },
   *   rings: [ { radius_km, color, label, type }, ... ],
   *   entry_track: [ { lat, lng, altitude_km, velocity_kms, mass_fraction }, ... ],
   *   timeline: [ ... ],
   *   visualization: { ... }
   * }
   */
  async simulate(event) {
    event.preventDefault()

    // Validate state before simulation
    if (!this.viewState.canSimulate()) {
      console.warn("⚠️ Cannot simulate - invalid state")
      alert("Please wait for current operation to complete")
      return
    }

    // Validate inputs
    const validation = this._validateInputs()
    if (!validation.valid) {
      this._showValidationErrors(validation.errors)
      return
    }

    this.viewState.startSimulation()
    this.clearSimulation()

    console.log("🎯 ═══════════════════════════════════════════════════════")
    console.log("🎯 SIMULATION STARTED")
    console.log("🎯 ═══════════════════════════════════════════════════════")

    // Check if we have orbital elements data
    const orbitalDataInput = this.hasOrbitalInputTarget ? this.orbitalInputTarget : null
    const hasOrbitalData = orbitalDataInput && orbitalDataInput.value && orbitalDataInput.value.trim() !== ''

    if (hasOrbitalData) {
      console.log("🛰️  ORBITAL MODE: Using Keplerian elements for trajectory calculation")
    } else {
      console.log("📍 LEGACY MODE: Using direct lat/lng input")
    }

    // Build form data - but exclude calculated fields in orbital mode
    const formData = new FormData()

    // Always include these physical parameters
    formData.append('diameter_m', this.diameterInputTarget.value)
    formData.append('density_kg_m3', this.densityInputTarget.value)
    formData.append('strength_mpa', this.strengthInputTarget.value)

    // If orbital data is available, add it
    if (hasOrbitalData) {
      try {
        const neoData = JSON.parse(orbitalDataInput.value)
        console.log("📡 NEO Data:", neoData)

        // Add each orbital element as a form field
        if (neoData.orbital_elements) {
          const elements = neoData.orbital_elements
          Object.keys(elements).forEach(key => {
            formData.append(`orbital_elements[${key}]`, elements[key])
          })
          console.log("✅ Orbital elements added to request")
        }

        // Add encounter time if available (close approach date)
        if (neoData.close_approach_date) {
          formData.append('encounter_time', neoData.close_approach_date)
          console.log(`📅 Encounter time: ${neoData.close_approach_date}`)
        }

        // In orbital mode, DO NOT send lat/lng/velocity/angle - they will be calculated
        console.log("⚠️  Skipping lat/lng/velocity/angle - will be calculated from orbit")
      } catch (error) {
        console.error("❌ Error parsing orbital data:", error)
        alert("Error parsing orbital data. Falling back to manual input.")
        hasOrbitalData = false
      }
    }

    // If NOT using orbital data, include manual trajectory parameters
    if (!hasOrbitalData) {
      formData.append('velocity_kms', this.velocityInputTarget.value)
      formData.append('impact_angle_deg', this.angleInputTarget.value)
      formData.append('azimuth_deg', this.azimuthInputTarget.value)
      formData.append('lat', this.latInputTarget.value)
      formData.append('lng', this.lngInputTarget.value)
    }

    // Include mitigation if present
    const mitigationSelect = this.formTarget.querySelector('[name="mitigation_type"]')
    if (mitigationSelect) {
      formData.append('mitigation_type', mitigationSelect.value)
    }

    // Log parameters being sent
    console.log("📊 PARAMETERS SENT TO BACKEND:")
    if (hasOrbitalData) {
      console.log("  Physical:")
      console.log("    - Diameter:", parseFloat(this.diameterInputTarget.value), "m")
      console.log("    - Density:", parseFloat(this.densityInputTarget.value), "kg/m³")
      console.log("    - Strength:", parseFloat(this.strengthInputTarget.value), "MPa")
      console.log("  Orbital (velocity/angle/lat/lng will be calculated by backend):")
      console.log("    - Using Keplerian elements")
    } else {
      console.table({
        diameter_m: parseFloat(this.diameterInputTarget.value),
        density_kg_m3: parseFloat(this.densityInputTarget.value),
        velocity_kms: parseFloat(this.velocityInputTarget.value),
        impact_angle_deg: parseFloat(this.angleInputTarget.value),
        azimuth_deg: parseFloat(this.azimuthInputTarget.value),
        lat: parseFloat(this.latInputTarget.value),
        lng: parseFloat(this.lngInputTarget.value),
        strength_mpa: parseFloat(this.strengthInputTarget.value)
      })
    }

    if (this.simulateBtnTarget) {
      this.simulateBtnTarget.disabled = true
      this.simulateBtnTarget.textContent = hasOrbitalData ? "Calculating Trajectory..." : "Calculating..."
    }

    try {
      console.log("📤 Sending POST request to /simulate...")
      const startTime = performance.now()

      const response = await post("/simulate", {
        body: formData,
        responseKind: "json"
      })

      const elapsedTime = (performance.now() - startTime).toFixed(2)
      console.log(`✅ Response received in ${elapsedTime}ms`)

      if (!response.ok) {
        // Try to get error details from response
        const errorData = await response.json
        const errorMsg = errorData.error || `HTTP ${response.status}: Simulation failed`
        console.error("❌ Backend error:", errorData)
        throw new Error(errorMsg)
      }

      const data = await response.json
      if (!data.ok) {
        console.error("❌ Simulation failed:", data)
        throw new Error(data.error || "Unknown error")
      }

      console.log("📥 BACKEND RESPONSE:")
      console.log("  - Impact:", data.impact)
      console.log("  - Near Miss:", data.near_miss)
      if (data.impact) {
        console.log("  - Mode:", data.results?.mode)
        console.log("  - Energy:", data.results?.energy_megatons_tnt, "MT TNT")
        console.log("  - Threat Level:", data.results?.damage_assessment?.threat_level)
        console.log("  - Damage Rings:", data.rings?.length)
      } else if (data.near_miss) {
        console.log("  - Miss Distance:", data.results?.miss_distance_km, "km")
        console.log("  - Threat Level:", data.results?.threat_level)
      }
      console.log("  - Entry Track Points:", data.entry_track?.length)
      console.log("Full response:", data)

      this.processSimulationData(data)

      // Only start meteor visualization in geocentric view
      if (this.currentView === this.VIEW_MODES.GEOCENTRIC) {
        this.startVisualization()
      }

      console.log("🎯 ═══════════════════════════════════════════════════════")

    } catch (error) {
      console.error("❌ SIMULATION ERROR:", error)
      alert("Simulation failed: " + error.message)
    } finally {
      if (this.simulateBtnTarget) {
        this.simulateBtnTarget.disabled = false
        this.simulateBtnTarget.textContent = "Run Simulation"
      }
    }
  }


  // ============================================================================
  // DATA PROCESSING: CONVERTING BACKEND RESULTS TO VISUALIZATION DATA
  // ============================================================================

  /**
   * Process backend simulation data and prepare for visualization
   *
   * KEY CALCULATION: METEOR TRAJECTORY
   *
   * IMPORTANT: The trajectory visualization is SIMPLIFIED for visual appeal.
   * The actual physics happens in Physics::Entry module on backend.
   *
   * BACKEND (Physics::Entry):
   * - Uses atmospheric density model: ρ = ρ₀ * exp(-h/H), H ≈ 8km
   * - Calculates drag deceleration: a = (Cd * q * A) / m
   * - Dynamic pressure: q = 0.5 * ρ_air * v²
   * - Airburst when q >= material_strength
   * - Returns actual entry_track with altitude, velocity, mass at each step
   *
   * FRONTEND (this method):
   * - Creates smooth trajectory for VISUALIZATION ONLY
   * - Linear interpolation between start point and impact point
   * - Applies smoothstep curve for realistic appearance
   * - Does NOT attempt to replicate physics calculations
   *
   * TRAJECTORY CALCULATION DETAILS:
   * 1. Start Point: 5 Earth radii away from impact point
   * 2. Approach Direction: Calculated from azimuth and impact angle
   *    - azimuth_deg: 0° = from North, 90° = from East, etc.
   *    - impact_angle_deg: angle from horizontal (grazing = 5°, vertical = 90°)
   * 3. Path: Smoothstep interpolation (not ballistic arc)
   *    - Formula: t² * (3 - 2t) creates smooth acceleration
   * 4. 100 points generated for smooth rendering
   *
   * SCIENTIFIC ACCURACY NOTE:
   * For scientifically accurate trajectory, use backend's entry_track data.
   * Current implementation prioritizes visual clarity over physical accuracy.
   *
   * TO IMPROVE ACCURACY:
   * - Use data.entry_track from backend instead of linear interpolation
   * - Map entry_track lat/lng/altitude to 3D positions
   * - This would show actual atmospheric effects, deceleration, airburst
   */

  /**
   * Setup camera for geocentric view
   */
  setupGeocentricCamera() {
    this.camera.position.set(0, this.EARTH_R * 2, this.EARTH_R * 3)
    this.camera.lookAt(0, 0, 0)

    if (this.controls) {
      this.controls.target.set(0, 0, 0)
      this.controls.minDistance = this.EARTH_R * 0.05
      this.controls.maxDistance = this.EARTH_R * 10
      this.controls.enablePan = true  // Allow panning in geocentric view
      this.controls.autoRotate = false  // No auto-rotation in geocentric
      this.controls.update()
    }
  }

  /**
   * Process impact data for geocentric visualization
   */
  processGeocentricImpact(data) {
    // This will process the impact visualization in geocentric mode
    // Using the existing damage rings and trajectory visualization

    // The rest of processSimulationData handles this
    // We'll just set a flag to ensure we're in the right mode
    this.currentView = this.VIEW_MODES.GEOCENTRIC

    // Reprocess the data in geocentric mode
    // This is a simplified approach - in production you'd optimize this
    this.processSimulationData(data)
  }

  /**
   * Main simulation data processor - orchestrates view-specific processing
   * Delegates to specialized managers based on view mode and data type
   */
  processSimulationData(data) {
    console.log("🔄 ═══════════════════════════════════════════════════════")
    console.log("🔄 PROCESSING SIMULATION DATA")
    console.log("🔄 ═══════════════════════════════════════════════════════")

    this.simulationData = data

    // Update ViewState with simulation data
    this.viewState.setSimulationData(data)

    // Parse orbital data if available
    const orbitalInfo = this._parseOrbitalData()

    // Route to appropriate view mode processor
    if (orbitalInfo.hasOrbitalData && this.viewState.isHeliocentric()) {
      this._processHeliocentricView(data, orbitalInfo)
    } else {
      this._processGeocentricView(data)
    }
  }

  /**
   * Parse orbital elements and encounter time from input
   * @private
   * @returns {Object} { hasOrbitalData, orbitalElements, encounterTime }
   */
  _parseOrbitalData() {
    if (!this.hasOrbitalInputTarget || !this.orbitalInputTarget.value) {
      return { hasOrbitalData: false, orbitalElements: null, encounterTime: null }
    }

    try {
      const neoData = JSON.parse(this.orbitalInputTarget.value)
      if (!neoData.orbital_elements) {
        return { hasOrbitalData: false, orbitalElements: null, encounterTime: null }
      }

      const encounterTime = neoData.close_approach_date ? new Date(neoData.close_approach_date) : null

      console.log("🛰️ Orbital elements detected - using heliocentric view")
      if (encounterTime) {
        console.log(`  📅 Encounter time: ${encounterTime}`)
      }

      return {
        hasOrbitalData: true,
        orbitalElements: neoData.orbital_elements,
        encounterTime
      }
    } catch (e) {
      console.warn("⚠️ Failed to parse orbital data:", e)
      return { hasOrbitalData: false, orbitalElements: null, encounterTime: null }
    }
  }

  /**
   * Process simulation data for heliocentric view
   * @private
   */
  _processHeliocentricView(data, orbitalInfo) {
    console.log("🌟 Processing in HELIOCENTRIC mode")

    const { orbitalElements, encounterTime } = orbitalInfo

    // Create NEO orbit and position at encounter time
    this.heliocentricView.createNeoOrbit(
      orbitalElements,
      encounterTime,
      (time) => this.positionNeoAtTime(time)
    )

    // Position objects using backend data (preferred) or frontend approximations
    if (data.visualization?.earth_position && data.visualization?.neo_position) {
      console.log("🔬 Using scientifically accurate positions from backend")
      this.positionObjectsFromBackendData(data.visualization)
    } else if (encounterTime) {
      console.log("⚠️ Backend positions not available, using frontend approximations")
      this.positionEarthAtTime(encounterTime)
    }

    // Add visual elements
    this.heliocentricView.showEncounterPoint(data)
    this.heliocentricView.addVelocityVectors(
      data,
      () => this.orbitalMech.calculateEarthVelocity(this.heliocentricView.getObjects().orbitalEarth?.position),
      () => this.orbitalMech.calculateNeoVelocity(this.heliocentricView.getObjects().neoMesh?.position)
    )

    // Setup timeline controls
    this.timelineCtrl.setupOrbitalTimeline(
      encounterTime,
      (time) => this.positionEarthAtTime(time),
      (time) => this.positionNeoAtTime(time)
    )

    // Update UI based on scenario type
    if (data.near_miss) {
      this.viewSwitcher.updateNearMissUI(data)
    } else if (data.impact) {
      this.viewSwitcher.updateImpactUI(data)
    }

    // Store data for potential view switch
    this.heliocentricData = {
      orbitalElements,
      simulationData: data,
      encounterTime
    }
  }

  /**
   * Process simulation data for geocentric view
   * @private
   */
  _processGeocentricView(data) {
    console.log("🌍 Processing in GEOCENTRIC mode")

    // Handle near-miss flyby
    if (data.near_miss && !data.impact) {
      console.log("🌍 NEAR MISS DETECTED - Processing flyby visualization")
      const nearMissData = this.viewSwitcher.processNearMissData(data)
      this.trajectory = nearMissData.trajectory
      this.damageRingsData = nearMissData.damageRingsData
      this.results = nearMissData.results
      return
    }

    // Handle impact
    console.log("💥 IMPACT DETECTED - Processing impact visualization")

    // Calculate trajectory from form inputs
    this.trajectory = this._calculateImpactTrajectory()

    // Process damage rings
    this.damageRingsData = this._processDamageRings(data.rings || [])

    // Store and display results
    this.results = data.results || {}
    this._displaySimulationResults()

    // Update UI
    this.updateMetrics()
    this._incrementSimulationCounter()

    console.log("🔄 ═══════════════════════════════════════════════════════")
    console.log("")
  }

  /**
   * Calculate impact trajectory from form inputs
   * @private
   * @returns {Array<THREE.Vector3>} Trajectory points
   */
  _calculateImpactTrajectory() {
    const cfg = this.constructor.CONFIG

    console.log("🚀 Trajectory: SIMPLIFIED MODEL (Manual Parameters)")

    const impactLat = parseFloat(this.latInputTarget.value) || 0
    const impactLng = parseFloat(this.lngInputTarget.value) || 0
    const velocity = parseFloat(this.velocityInputTarget.value) || 20
    const angle = parseFloat(this.angleInputTarget.value) || 45
    const azimuth = parseFloat(this.azimuthInputTarget.value) || 0

    console.log("  📍 Impact Location:", impactLat, "°,", impactLng, "°")
    console.log("  - Velocity:", velocity, "km/s")
    console.log("  - Impact Angle:", angle, "°")
    console.log("  - Azimuth:", azimuth, "°")

    const impactPoint = ThreeJSUtils.latLngToVector3(impactLat, impactLng, this.EARTH_R)

    // Calculate approach direction vector
    const angleRad = THREE.MathUtils.degToRad(angle)
    const azimuthRad = THREE.MathUtils.degToRad(azimuth)
    const approachDir = new THREE.Vector3(
      Math.sin(azimuthRad) * Math.sin(angleRad),
      Math.cos(angleRad),
      Math.cos(azimuthRad) * Math.sin(angleRad)
    ).normalize()

    // Generate trajectory from start point to impact
    const startDistance = this.EARTH_R * cfg.TRAJECTORY_START_DISTANCE
    const startPoint = impactPoint.clone().add(approachDir.clone().multiplyScalar(startDistance))
    const trajectory = []
    const numPoints = cfg.TRAJECTORY_POINTS

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints
      const curveT = t * t * (3 - 2 * t)  // Smoothstep easing
      const point = new THREE.Vector3().lerpVectors(startPoint, impactPoint, curveT)
      trajectory.push(point)
    }

    console.log("  ✅ Trajectory generated:", trajectory.length, "points")
    return trajectory
  }

  /**
   * Process damage rings data from Physics::Engine
   * @private
   * @param {Array} rings - Raw ring data from backend
   * @returns {Array} Processed ring data with meters, colors, labels
   */
  _processDamageRings(rings) {
    console.log("💥 Processing Damage Rings:")

    const processedRings = rings.map(ring => {
      console.log(`  - ${ring.label}: ${ring.radius_km} km (${ring.type})`)
      return {
        radius: ring.radius_km * 1000,  // Convert km to meters
        color: ring.color || "#ff0000",
        label: ring.label || "Damage",
        type: ring.type || "unknown"
      }
    })

    console.log("  ✅ Total rings:", processedRings.length)
    return processedRings
  }

  /**
   * Display simulation results to console
   * @private
   */
  _displaySimulationResults() {
    console.log("📊 Simulation Results Summary:")
    console.log("  - Mode:", this.results.mode)
    console.log("  - Energy:", this.results.energy_megatons_tnt, "MT TNT")

    if (this.results.mode === "airburst") {
      console.log("  - Airburst Altitude:", this.results.burst_alt_km, "km")
    } else {
      console.log("  - Crater Diameter:", this.results.final_crater_d_m, "m")
      console.log("  - Crater Depth:", this.results.crater_depth_m, "m")
    }

    console.log("  - Vaporization Radius:", this.results.vaporization_radius_km, "km")
    console.log("  - Severe Blast Radius:", this.results.severe_blast_radius_km, "km")
    console.log("  - Thermal Radius:", this.results.thermal_radiation_radius_km, "km")

    if (this.results.tsunami_100km_m) {
      console.log("  - Tsunami @ 100km:", this.results.tsunami_100km_m, "meters")
    }
  }

  /**
   * Increment and update simulation counter
   * @private
   */
  _incrementSimulationCounter() {
    this.simCount++
    if (this.simCountTarget) {
      this.simCountTarget.textContent = `${this.simCount} Simulations`
    }
  }

  // ============================================================================
  // VISUALIZATION: 3D RENDERING
  // ============================================================================

  /**
   * Start the visualization playback
   * Creates meteor object and initiates camera tracking
   */
  startVisualization() {
    console.log("🎬 Starting visualization playback...")

    // Validate state
    if (!this.viewState.canStartAnimation()) {
      console.warn("⚠️ Cannot start visualization - invalid state")
      return
    }

    // Create meteor
    this.meteorObject = this.impactViz.createMeteor()

    // Position camera behind meteor looking at Earth
    this.cameraFollowing = true
    this.controls.enabled = false

    console.log("  - Camera following meteor: enabled")

    // Start playback
    this.viewState.startAnimation()
    this.playing = true
    this.simulationStartTime = Date.now()
    this.impactOccurred = false

    if (this.timelineTarget) {
      this.timelineTarget.style.display = "block"
    }

    if (this.playBtnTarget) {
      this.playBtnTarget.textContent = "⏸"
    }

    console.log("  ✅ Visualization started (duration:", this.simulationDuration / 1000, "seconds)")
  }

  /**
   * Create meteor 3D object with glow effect
   *
   * VISUAL SCALE CALCULATION:
   * - Actual impactor: diameter_m (e.g., 500m)
   * - Visual scale: diameter_m * 45 (capped at 20km)
   * - Reason: Small impactors would be invisible at Earth scale
   * - This is VISUALIZATION ONLY, does not affect physics
   */

  /**
   * Update metrics display in UI
   * Maps Physics::Engine results to DOM elements
   */
  updateMetrics() {
    const r = this.results

    console.log("📊 Updating UI metrics...")

    // Threat level (with color coding)
    if (this.threatLevelTarget) {
      const level = r.damage_assessment?.threat_level || "UNKNOWN"
      this.threatLevelTarget.textContent = level
      this.threatLevelTarget.className = `panel-badge ${ThreeJSUtils.getThreatClass(level)}`
      console.log("  - Threat Level:", level)
    }

    // Helper to update value targets
    const updateValue = (target, value, suffix = "") => {
      if (target) target.textContent = value ? `${value}${suffix}` : "—"
    }

    updateValue(this.energyValueTarget, r.energy_megatons_tnt?.toFixed(1), " MT")
    updateValue(this.craterValueTarget, r.final_crater_d_m?.toFixed(0), " m")
    updateValue(this.modeValueTarget, r.mode)
    updateValue(this.vaporizationValueTarget, r.vaporization_radius_km?.toFixed(1), " km")
    updateValue(this.thermalValueTarget, r.thermal_radiation_radius_km?.toFixed(1), " km")
    updateValue(this.blastValueTarget, r.severe_blast_radius_km?.toFixed(1), " km")
    updateValue(this.tsunamiValueTarget, r.tsunami_100km_m?.toFixed(1), " m @ 100km")
  }

  // ============================================================================
  // ANIMATION LOOP
  // ============================================================================

  /**
   * Main animation loop (called every frame)
   *
   * RESPONSIBILITIES:
   * 1. Update meteor position along trajectory
   * 2. Update timeline UI
   * 3. Trigger impact when progress reaches 100%
   * 4. Update orbit controls (when not following)
   * 5. Render scene
   *
   * TIMING:
   * - Total duration: 30 seconds (simulationDuration)
   * - Impact occurs at: 25 seconds (impactTime)
   * - Post-impact: 5 seconds for effects
   * - Frame rate: ~60 FPS (browser's requestAnimationFrame)
   */
  animate() {
    const delta = this.clock.getDelta()
    const time = this.clock.elapsedTime

    // =========================================================================
    // HELIOCENTRIC VIEW ANIMATIONS
    // =========================================================================
    if (this.currentView === this.VIEW_MODES.HELIOCENTRIC) {
      // Default orbital animation (slow Earth movement)
      if (this.defaultOrbitalAnimation && !this.orbitalTimeline?.playing) {
        if (this.orbitalEarth) {
          const orbitRadius = this.AU / this.SCENE_SCALE
          this.earthOrbitalAngle = (this.earthOrbitalAngle || 0) + delta * 0.02  // Very slow
          this.orbitalEarth.position.set(
            Math.cos(this.earthOrbitalAngle) * orbitRadius,
            0,
            -Math.sin(this.earthOrbitalAngle) * orbitRadius
          )

          // Earth also rotates on its axis
          this.orbitalEarth.rotation.y += delta * 2
        }
      }

      // Handle timeline playback
      if (this.orbitalTimeline && this.orbitalTimeline.playing) {
        // Advance time based on speed
        const msPerDay = 24 * 60 * 60 * 1000
        const deltaMs = delta * 1000 * this.orbitalTimeline.speed * msPerDay  // Convert animation delta to days
        const newTime = new Date(this.orbitalTimeline.currentTime.getTime() + deltaMs)

        // Check bounds
        if (newTime <= this.orbitalTimeline.endTime && newTime >= this.orbitalTimeline.startTime) {
          this.orbitalTimeline.currentTime = newTime

          // Update orbital positions
          this.positionEarthAtTime(newTime)
          this.positionNeoAtTime(newTime)

          // Update velocity vectors
          if (this.velocityVectors && this.velocityVectors.length > 0) {
            // Update Earth velocity vector position
            if (this.velocityVectors[0] && this.orbitalEarth) {
              this.velocityVectors[0].position.copy(this.orbitalEarth.position)
              const earthVel = this.orbitalMech.calculateEarthVelocity(this.orbitalEarth.position)
              this.velocityVectors[0].setDirection(earthVel)
            }

            // Update NEO velocity vector position
            if (this.velocityVectors[1] && this.neoMesh) {
              this.velocityVectors[1].position.copy(this.neoMesh.position)
              const neoVel = this.orbitalMech.calculateNeoVelocity(this.neoMesh.position)
              this.velocityVectors[1].setDirection(neoVel)
            }
          }

          // Update slider position
          const totalMs = this.orbitalTimeline.endTime - this.orbitalTimeline.startTime
          const currentMs = newTime - this.orbitalTimeline.startTime
          const progress = currentMs / totalMs
          const slider = document.getElementById('timeline-slider')
          if (slider) {
            slider.value = progress * 60
          }

          // Update display
          this.timelineCtrl.updateTimelineDisplay()
        } else {
          // Stop at bounds
          this.timelineCtrl.toggleOrbitalPlayback()
        }
      }

      // Pulse encounter marker
      if (this.encounterMarker && this.encounterMarker.userData.pulse) {
        const scale = 1 + Math.sin(time * 3) * 0.2
        this.encounterMarker.scale.set(scale, scale, scale)
      }

      // Rotate Sun for visual effect
      if (this.sun) {
        this.sun.rotation.y += delta * 0.1
      }

      // Rotate Sun glow
      if (this.sunGlow) {
        this.sunGlow.rotation.y -= delta * 0.05
      }
    }

    // =========================================================================
    // GEOCENTRIC VIEW ANIMATIONS (existing meteor animation)
    // =========================================================================
    if (this.currentView === this.VIEW_MODES.GEOCENTRIC && this.playing) {
      const elapsed = Date.now() - this.simulationStartTime
      const progress = Math.min(elapsed / this.impactTime, 1)

      // Update meteor position
      this.impactViz.updateMeteorPosition(progress, this.trajectory, this.meteorObject)

      // Update timeline UI
      this.timelineCtrl.updateTimeline(progress)

      // Trigger impact at 100% progress
      if (progress >= 1 && !this.impactOccurred) {
        this.impactViz.triggerImpact(this.results, parseFloat(this.latInputTarget.value), parseFloat(this.lngInputTarget.value))
        this.impactOccurred = true
      }

      // Stop after full duration
      if (elapsed >= this.simulationDuration) {
        this.viewState.stopAnimation()
        this.playing = false
        if (this.playBtnTarget) {
          this.playBtnTarget.textContent = "▶"
        }
        console.log("⏹️  Playback complete")
      }
    }

    // Update controls
    if (this.controls) {
      // Enable auto-rotation in heliocentric view
      if (this.currentView === this.VIEW_MODES.HELIOCENTRIC && !this.orbitalTimeline?.playing) {
        this.controls.autoRotate = true
      }

      // Disable in geocentric view or when following meteor
      if (this.currentView === this.VIEW_MODES.GEOCENTRIC || this.cameraFollowing) {
        this.controls.autoRotate = false
      }

      if (!this.cameraFollowing && this.controls.enabled) {
        this.controls.update()
      }
    }

    // Rotate Earth slowly for realism in geocentric view
    if (this.earthGroup && this.currentView === this.VIEW_MODES.GEOCENTRIC) {
      this.earthGroup.rotation.y += 0.0000  // Set to small value (e.g., 0.0001) to enable
    }

    // Render scene
    this.renderer.render(this.scene, this.camera)
  }


  /**
   * Clear all simulation objects from scene
   * Removes previous simulation data to prepare for new simulation
   *
   * OBJECTS CLEARED:
   * - Meteor object and glow
   * - Trajectory trail line
   * - Damage rings
   * - Info overlays
   * - Timeline display
   *
   * Also resets camera controls and animation state
   *
   * Called automatically before starting new simulation
   *
   * @private
   * @returns {void}
   */
  clearSimulation() {
    console.log("🧹 Clearing previous simulation...")

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
      if (overlay.material) overlay.material.dispose()
    })
    this.infoOverlays = []

    // Reset camera
    this.cameraFollowing = false
    this.controls.enabled = true

    // Reset timeline
    if (this.timelineTarget) {
      this.timelineTarget.style.display = "none"
    }

    console.log("  ✅ Scene cleared")
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================





  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Setup all DOM event listeners
   * - Window resize
   * - Play/pause button
   * - Mouse hover for country detection
   * - Click to set impact location
   */
  setupEventListeners() {
    // Window resize - update camera and renderer
    window.addEventListener('resize', () => {
      const container = this.cesiumContainerTarget
      this.camera.aspect = container.clientWidth / container.clientHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(container.clientWidth, container.clientHeight)
    })

    // Play/pause button
    if (this.playBtnTarget) {
      this.playBtnTarget.addEventListener('click', () => {
        if (this.trajectory.length > 0) {
          // Toggle animation
          if (this.playing) {
            this.viewState.stopAnimation()
          } else if (this.viewState.canStartAnimation()) {
            this.viewState.startAnimation()
          }

          this.playing = !this.playing
          this.playBtnTarget.textContent = this.playing ? "⏸" : "▶"
          if (this.playing && !this.simulationStartTime) {
            this.simulationStartTime = Date.now()
          }
        }
      })
    }

    // Mouse move for country detection
    this.renderer.domElement.addEventListener('mousemove', (event) => {
      const rect = this.renderer.domElement.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      const landGroup = this.geocentricView.getLandGroup()
      const country = landGroup
        ? ThreeJSUtils.detectCountryAtPoint(x, y, landGroup, this.camera, this.renderer)
        : null

      if (country && country !== this.hoveredCountry) {
        this.hoveredCountry = country
        this.tooltip.textContent = country
        this.tooltip.style.display = 'block'
        this.tooltip.style.left = `${event.clientX - rect.left + 10}px`
        this.tooltip.style.top = `${event.clientY - rect.top - 30}px`
        console.log("🗺️  Hovering over:", country)
      } else if (!country && this.hoveredCountry) {
        this.hoveredCountry = null
        this.tooltip.style.display = 'none'
      }
    })

    // Hide tooltip when mouse leaves
    this.renderer.domElement.addEventListener('mouseleave', () => {
      this.hoveredCountry = null
      this.tooltip.style.display = 'none'
    })

    // Click to set impact location
    this.renderer.domElement.addEventListener('click', (event) => {
      if (!this.playing) {
        const rect = this.renderer.domElement.getBoundingClientRect()
        const x = (event.clientX - rect.left) / rect.width * 2 - 1
        const y = -(event.clientY - rect.top) / rect.height * 2 + 1

        const raycaster = new THREE.Raycaster()
        raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera)

        const oceanMesh = this.geocentricView.getOceanMesh()
        if (oceanMesh) {
          const intersects = raycaster.intersectObject(oceanMesh)
          if (intersects.length > 0) {
            const point = intersects[0].point

            // Convert 3D point back to lat/lng
            const lat = Math.asin(point.y / this.EARTH_R) * 180 / Math.PI
            const lng = Math.atan2(-point.z, point.x) * 180 / Math.PI

            if (this.latInputTarget) this.latInputTarget.value = lat.toFixed(4)
            if (this.lngInputTarget) this.lngInputTarget.value = lng.toFixed(4)

            console.log("📍 Impact location set:", lat.toFixed(4), "°,", lng.toFixed(4), "°")
          }
        }
      }
    })

    console.log("🎮 Event listeners configured")
  }

  // ============================================================================
  // LIFECYCLE: CLEANUP
  // ============================================================================

  /**
   * Stimulus lifecycle: disconnect()
   * Called automatically when controller is removed from DOM
   *
   * CLEANUP SEQUENCE:
   * 1. Stop animation loop
   * 2. Dispose WebGL renderer
   * 3. Clear all simulation objects
   * 4. Remove tooltip elements
   *
   * This prevents memory leaks from Three.js resources
   *
   * @public
   * @returns {void}
   */
  disconnect() {
    console.log("👋 Cesium Impact Controller: Disconnecting...")

    this.renderer.setAnimationLoop(null)
    this.renderer.dispose()
    this.clearSimulation()

    if (this.tooltip) {
      this.tooltip.remove()
    }

    console.log("✅ Cleanup complete")
  }
}
