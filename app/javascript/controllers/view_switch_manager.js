// ============================================================================
// VIEW SWITCH MANAGER - Handles transitions between heliocentric and geocentric views
// ============================================================================
//
// PURPOSE:
// Manages view mode switching and UI updates for different simulation scenarios:
// - Near-miss flybys (stay in heliocentric view)
// - Impact events (switch to geocentric view)
// - View transition animations
// - Scenario-specific UI updates
//
// RESPONSIBILITIES:
// - Process near-miss vs impact data
// - Update UI panels for different scenarios
// - Create view switch buttons
// - Coordinate scene cleanup during transitions
//
// ============================================================================

import * as THREE from "three"

export class ViewSwitchManager {
  /**
   * Initialize the view switch manager
   *
   * @param {Object} controller - Reference to parent controller for targets/values
   * @param {THREE.Scene} scene - Three.js scene
   * @param {Object} heliocentricView - HeliocentricViewManager instance
   * @param {Object} geocentricView - GeocentricViewManager instance
   * @param {number} earthRadius - Earth radius in meters
   */
  constructor(controller, scene, heliocentricView, geocentricView, earthRadius) {
    this.controller = controller
    this.scene = scene
    this.heliocentricView = heliocentricView
    this.geocentricView = geocentricView
    this.EARTH_R = earthRadius
  }

  /**
   * Process near-miss data and generate flyby trajectory
   */
  processNearMissData(data) {
    console.log("🌍 ═══════════════════════════════════════════════════════")
    console.log("🌍 NEAR-MISS FLYBY VISUALIZATION")
    console.log("🌍 ═══════════════════════════════════════════════════════")

    const results = data.results || {}

    console.log("📊 Near-Miss Parameters:")
    console.log("  - Miss Distance:", results.miss_distance_km, "km")
    console.log("  - Closest Approach:", results.closest_approach_distance_km, "km")
    console.log("  - Relative Velocity:", results.relative_velocity_kms, "km/s")
    console.log("  - Threat Level:", results.threat_level)
    console.log("  - Potential Energy (if impact):", results.estimated_energy_mt, "MT")

    // Generate flyby trajectory (simple arc past Earth)
    const missDistanceM = results.miss_distance_km * 1000 // Convert to meters
    const closestApproachRadius = this.EARTH_R + missDistanceM

    const trajectory = []
    const numPoints = 100

    for (let i = 0; i <= numPoints; i++) {
      const t = (i / numPoints) * Math.PI // 0 to PI (half circle)
      const angle = t - Math.PI / 2 // Center at closest approach

      const x = closestApproachRadius * Math.cos(angle)
      const y = 0
      const z = closestApproachRadius * Math.sin(angle)

      trajectory.push(new THREE.Vector3(x, y, z))
    }

    console.log("  ✅ Flyby trajectory generated:", trajectory.length, "points")

    // Update UI with near-miss information
    this.updateNearMissUI(data)

    console.log("🌍 ═══════════════════════════════════════════════════════")

    return {
      trajectory,
      damageRingsData: [], // No damage rings for near-miss
      results
    }
  }

  /**
   * Update UI to display near-miss information
   */
  updateNearMissUI(data) {
    const results = data.results || {}
    const ctrl = this.controller

    // Update threat level badge
    if (ctrl.hasThreatLevelTarget) {
      ctrl.threatLevelTarget.textContent = results.threat_level || "NEAR MISS"
      ctrl.threatLevelTarget.className = "panel-badge safe"
    }

    // Update metrics display
    if (ctrl.hasModeValueTarget) {
      ctrl.modeValueTarget.textContent = "Near Miss (Flyby)"
    }

    if (ctrl.hasEnergyValueTarget) {
      const energy = results.estimated_energy_mt || 0
      ctrl.energyValueTarget.textContent = `${energy.toFixed(2)} MT (potential)`
    }

    if (ctrl.hasCraterValueTarget) {
      ctrl.craterValueTarget.textContent = "N/A (No Impact)"
    }

    // Show miss distance in vaporization slot
    if (ctrl.hasVaporizationValueTarget) {
      const missDistance = results.miss_distance_km || 0
      ctrl.vaporizationValueTarget.textContent = `${missDistance.toLocaleString()} km`
      const parentCard = ctrl.vaporizationValueTarget.closest('.damage-card')
      if (parentCard) {
        const label = parentCard.querySelector('.damage-label')
        if (label) label.textContent = "Miss Distance"
        const icon = parentCard.querySelector('.damage-icon')
        if (icon) icon.textContent = "🌍"
      }
    }

    // Show velocity in thermal slot
    if (ctrl.hasThermalValueTarget) {
      const velocity = results.relative_velocity_kms || 0
      ctrl.thermalValueTarget.textContent = `${velocity.toFixed(2)} km/s`
      const parentCard = ctrl.thermalValueTarget.closest('.damage-card')
      if (parentCard) {
        const label = parentCard.querySelector('.damage-label')
        if (label) label.textContent = "Rel. Velocity"
        const icon = parentCard.querySelector('.damage-icon')
        if (icon) icon.textContent = "🚀"
      }
    }

    // Clear blast and tsunami (not applicable)
    if (ctrl.hasBlastValueTarget) {
      ctrl.blastValueTarget.textContent = "—"
      const parentCard = ctrl.blastValueTarget.closest('.damage-card')
      if (parentCard) {
        const label = parentCard.querySelector('.damage-label')
        if (label) label.textContent = "No Impact"
      }
    }

    if (ctrl.hasTsunamiValueTarget) {
      ctrl.tsunamiValueTarget.textContent = "—"
      const parentCard = ctrl.tsunamiValueTarget.closest('.damage-card')
      if (parentCard) {
        const label = parentCard.querySelector('.damage-label')
        if (label) label.textContent = "Safe Flyby"
      }
    }

    console.log("✅ Near-miss UI updated")
  }

  /**
   * Update UI to display impact information in heliocentric view
   */
  updateImpactUI(data) {
    const results = data.results || {}
    const ctrl = this.controller

    // Update threat level badge
    if (ctrl.hasThreatLevelTarget) {
      ctrl.threatLevelTarget.textContent = "IMPACT DETECTED"
      ctrl.threatLevelTarget.className = "panel-badge critical"
    }

    // Update metrics display with impact preview
    if (ctrl.hasModeValueTarget) {
      ctrl.modeValueTarget.textContent = results.mode || "Impact"
    }

    if (ctrl.hasEnergyValueTarget) {
      const energy = results.energy_megatons_tnt || 0
      ctrl.energyValueTarget.textContent = `${energy.toFixed(2)} MT TNT`
    }

    // Show coordinates in vaporization slot
    if (ctrl.hasVaporizationValueTarget && results.location) {
      const lat = results.location.lat || 0
      const lng = results.location.lng || 0
      ctrl.vaporizationValueTarget.textContent = `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`
      const parentCard = ctrl.vaporizationValueTarget.closest('.damage-card')
      if (parentCard) {
        const label = parentCard.querySelector('.damage-label')
        if (label) label.textContent = "Impact Location"
        const icon = parentCard.querySelector('.damage-icon')
        if (icon) icon.textContent = "📍"
      }
    }

    console.log("✅ Impact UI updated (heliocentric preview)")
  }

  /**
   * Add button to switch from heliocentric to geocentric view
   */
  addViewSwitchButton(data) {
    // Remove existing button if present
    const existing = document.getElementById('view-switch-button')
    if (existing) existing.remove()

    // Create button
    const button = document.createElement('button')
    button.id = 'view-switch-button'
    button.className = 'btn btn-primary'
    button.innerHTML = '🌍 Switch to Impact View'
    button.style.cssText = `
      position: absolute;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: bold;
      animation: pulse 2s infinite;
    `

    // Add click handler
    button.addEventListener('click', () => {
      this.switchToGeocentricView(data)
    })

    document.body.appendChild(button)
    console.log("✅ View switch button added")
  }

  /**
   * Switch from heliocentric to geocentric view
   */
  switchToGeocentricView(data) {
    console.log("🔄 Switching to geocentric view...")

    // Remove switch button
    const button = document.getElementById('view-switch-button')
    if (button) button.remove()

    // Clear heliocentric objects
    this.clearHeliocentricObjects()

    // Setup geocentric view
    this.geocentricView.setupEarth()
    this.geocentricView.loadGeography(this.controller.worldUrlValue)

    // Setup geocentric camera
    this.controller.setupGeocentricCamera()

    // Process impact in geocentric view
    this.controller.processGeocentricImpact(data)

    console.log("✅ Switched to geocentric view")
  }

  /**
   * Clear heliocentric objects when switching to geocentric view
   */
  clearHeliocentricObjects() {
    console.log("🧹 Clearing heliocentric objects...")

    // Use the heliocentric view manager's cleanup method
    this.heliocentricView.clearHeliocentricObjects()

    console.log("  ✅ Heliocentric scene cleared")
  }
}
