// ============================================================================
// THREE.JS UTILITIES
// ============================================================================
//
// Pure utility functions for Three.js visualizations.
// No state, no dependencies on other modules - just reusable helpers.
//
// ============================================================================

import * as THREE from "three"

export class ThreeJSUtils {
  /**
   * Convert lat/lng coordinates to Three.js Vector3
   * Uses spherical coordinate transformation
   *
   * @param {number} lat - Latitude in degrees (-90 to 90)
   * @param {number} lng - Longitude in degrees (-180 to 180)
   * @param {number} radius - Sphere radius (e.g., Earth radius in meters)
   * @returns {THREE.Vector3} 3D position on sphere
   */
  static latLngToVector3(lat, lng, radius) {
    const phi = THREE.MathUtils.degToRad(90 - lat)  // Polar angle
    const theta = THREE.MathUtils.degToRad(lng + 180)  // Azimuthal angle

    const x =  radius * Math.sin(phi) * Math.cos(theta)
    const y =  radius * Math.cos(phi)
    const z = -radius * Math.sin(phi) * Math.sin(theta)  // Flipped for correct orientation

    return new THREE.Vector3(x, y, z)
  }

  /**
   * Calculate geodesic point at given bearing and distance from origin
   * Uses Haversine formula for great circle navigation
   *
   * @param {number} lat - Origin latitude (degrees)
   * @param {number} lng - Origin longitude (degrees)
   * @param {number} bearing - Bearing/azimuth (degrees, 0 = North, 90 = East)
   * @param {number} distance - Distance to travel (meters)
   * @param {number} earthRadius - Earth radius in meters
   * @returns {Object} {lat, lng} destination coordinates
   */
  static calculateGeodesicPoint(lat, lng, bearing, distance, earthRadius) {
    const φ1 = lat * Math.PI / 180  // Latitude in radians
    const λ1 = lng * Math.PI / 180  // Longitude in radians
    const θ = bearing * Math.PI / 180  // Bearing in radians
    const δ = distance / earthRadius  // Angular distance

    const sinφ1 = Math.sin(φ1)
    const cosφ1 = Math.cos(φ1)
    const sinδ = Math.sin(δ)
    const cosδ = Math.cos(δ)
    const sinθ = Math.sin(θ)
    const cosθ = Math.cos(θ)

    // Destination latitude
    const sinφ2 = sinφ1 * cosδ + cosφ1 * sinδ * cosθ
    const φ2 = Math.asin(sinφ2)

    // Destination longitude
    const y = sinθ * sinδ * cosφ1
    const x = cosδ - sinφ1 * sinφ2
    const λ2 = λ1 + Math.atan2(y, x)

    return {
      lat: φ2 * 180 / Math.PI,
      lng: ((λ2 * 180 / Math.PI) + 540) % 360 - 180  // Normalize to [-180, 180]
    }
  }

  /**
   * Create text sprite using canvas-based texture
   * Used for labels, overlays, and annotations
   *
   * @param {string} text - Text to display
   * @param {string} color - Text color (CSS format)
   * @returns {THREE.Sprite} Sprite with text texture
   */
  static createTextSprite(text, color = "#ffffff") {
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
   * Ease-in-out cubic function for smooth animations
   * Creates acceleration at start and deceleration at end
   *
   * @param {number} t - Progress (0 to 1)
   * @returns {number} Eased progress (0 to 1)
   */
  static easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  /**
   * Get CSS class for threat level
   * Maps Physics::Engine threat levels to UI colors
   *
   * @param {string} level - Threat level string
   * @returns {string} CSS class name
   */
  static getThreatClass(level) {
    const map = {
      'EXTINCTION': 'critical',
      'CATASTROPHIC': 'critical',
      'CONTINENTAL': 'severe',
      'REGIONAL': 'major',
      'LOCAL': 'moderate',
      'MINOR': 'minor'
    }
    return map[level] || 'safe'
  }

  /**
   * Detect which country is at given mouse position
   * Uses raycasting to intersect mouse ray with land meshes
   *
   * @param {number} x - Mouse X position (pixels)
   * @param {number} y - Mouse Y position (pixels)
   * @param {THREE.Group} landGroup - Group containing land meshes
   * @param {THREE.Camera} camera - Active camera
   * @param {THREE.WebGLRenderer} renderer - WebGL renderer
   * @returns {Object|null} Country data or null
   */
  static detectCountryAtPoint(x, y, landGroup, camera, renderer) {
    if (!landGroup) return null

    // Convert mouse position to normalized device coordinates (-1 to +1)
    const mouse = new THREE.Vector2(
      (x / renderer.domElement.clientWidth) * 2 - 1,
      -(y / renderer.domElement.clientHeight) * 2 + 1
    )

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, camera)

    const intersects = raycaster.intersectObjects(landGroup.children, false)
    if (intersects.length > 0) {
      return intersects[0].object.userData.country
    }
    return null
  }
}
