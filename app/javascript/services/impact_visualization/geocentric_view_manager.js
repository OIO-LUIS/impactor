// ============================================================================
// GEOCENTRIC VIEW MANAGER - Earth-centered impact visualization
// ============================================================================
//
// PURPOSE:
// Manages the creation and rendering of Earth in the geocentric view mode.
// Handles Earth geometry, ocean surface, atmosphere, land masses, and coastlines.
//
// RESPONSIBILITIES:
// - Create Earth sphere with ocean and atmosphere layers
// - Load and render geography data (countries, coastlines)
// - Convert GeoJSON features to 3D meshes
// - Clean up geocentric objects when switching views
//
// USAGE:
// const manager = new GeocentricViewManager(scene, earthRadius)
// await manager.setupEarth()
// await manager.loadGeography(worldDataUrl)
// manager.clearGeocentricObjects()
//
// ============================================================================

import * as THREE from "three"
import { feature } from "topojson-client"

export class GeocentricViewManager {
  /**
   * Initialize the geocentric view manager
   *
   * @param {THREE.Scene} scene - Three.js scene to add objects to
   * @param {number} earthRadius - Earth radius in meters
   * @param {Function} latLngToVector3 - Function to convert lat/lng to 3D coordinates
   */
  constructor(scene, earthRadius, latLngToVector3) {
    this.scene = scene
    this.EARTH_R = earthRadius
    this.latLngToVector3 = latLngToVector3

    // Tracked objects for cleanup
    this.earthGroup = null
    this.oceanMesh = null
    this.atmosphere = null
    this.landGroup = null
    this.countryData = null
  }

  /**
   * Create Earth sphere with ocean and atmosphere layers
   * Earth is composed of:
   * 1. Ocean sphere (base layer) - Phong material with specular highlights
   * 2. Land masses (added in loadGeography)
   * 3. Atmosphere glow (slightly larger sphere, transparent)
   */
  setupEarth() {
    this.earthGroup = new THREE.Group()

    // Ocean sphere (base layer)
    const oceanGeometry = new THREE.SphereGeometry(this.EARTH_R, 64, 64)
    const oceanMaterial = new THREE.MeshPhongMaterial({
      color: 0x003366,
      specular: 0x004488,
      shininess: 40,
      emissive: 0x001122,
      emissiveIntensity: 0.3
    })
    this.oceanMesh = new THREE.Mesh(oceanGeometry, oceanMaterial)
    this.earthGroup.add(this.oceanMesh)

    // Atmosphere glow (2% larger than Earth)
    const atmosphereGeometry = new THREE.SphereGeometry(this.EARTH_R * 1.02, 32, 32)
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x88aaff,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide  // Only visible from inside
    })
    this.atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
    this.earthGroup.add(this.atmosphere)

    this.scene.add(this.earthGroup)

    console.log("🌍 Earth sphere created (radius:", this.EARTH_R, "meters)")
  }

  /**
   * Load TopoJSON world geography data and render countries
   * Creates clickable land masses and coastlines
   * Data source: world-110m.json (from Natural Earth)
   *
   * @param {string} worldDataUrl - URL to TopoJSON world data file
   */
  async loadGeography(worldDataUrl) {
    if (!worldDataUrl) return

    console.log("🗺️  Loading geography from:", worldDataUrl)

    try {
      const response = await fetch(worldDataUrl)
      const topology = await response.json()
      const geojson = feature(topology, topology.objects.countries)

      console.log("✅ Geography loaded:", geojson.features.length, "countries")

      // Store country data for hover detection
      this.countryData = geojson.features

      // Create land masses
      const landGroup = new THREE.Group()

      geojson.features.forEach(feature => {
        if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
          const landMesh = this.createLandMesh(feature)
          if (landMesh) {
            landMesh.userData.country = feature.properties.name || "Unknown"
            landGroup.add(landMesh)
          }
        }
      })

      this.earthGroup.add(landGroup)
      this.landGroup = landGroup

      // Create coastlines
      this.createCoastlines(geojson)

    } catch (e) {
      console.warn("⚠️  Geography failed to load:", e)
    }
  }

  /**
   * Convert GeoJSON feature to Three.js mesh
   * Projects lat/lng coordinates onto sphere surface
   *
   * NOTE: This is a simplified 2D projection. For more accurate rendering,
   * consider using a proper sphere mapping algorithm.
   *
   * @param {Object} feature - GeoJSON feature
   * @returns {THREE.Mesh|null} Land mesh or null if invalid
   */
  createLandMesh(feature) {
    const vertices = []
    const processCoordinates = (coords) => {
      coords.forEach(coord => {
        const [lng, lat] = coord
        const vec = this.latLngToVector3(lat, lng, this.EARTH_R + 500)
        vertices.push(vec)
      })
    }

    if (feature.geometry.type === "Polygon") {
      processCoordinates(feature.geometry.coordinates[0])
    } else if (feature.geometry.type === "MultiPolygon") {
      feature.geometry.coordinates.forEach(polygon => {
        processCoordinates(polygon[0])
      })
    }

    if (vertices.length < 3) return null

    // Create shape from vertices
    const shape = new THREE.Shape()
    vertices.forEach((v, i) => {
      if (i === 0) shape.moveTo(v.x, v.y)
      else shape.lineTo(v.x, v.y)
    })

    // Create mesh with land coloring
    const geometry = new THREE.ShapeGeometry(shape)
    const material = new THREE.MeshPhongMaterial({
      color: 0x2a4a2a,
      emissive: 0x1a2a1a,
      emissiveIntensity: 0.2,
      side: THREE.DoubleSide
    })

    return new THREE.Mesh(geometry, material)
  }

  /**
   * Create coastline overlays as line segments
   * Slightly elevated above land for visibility
   *
   * @param {Object} geojson - GeoJSON data with country features
   */
  createCoastlines(geojson) {
    const coastlineVertices = []

    geojson.features.forEach(feature => {
      const processRing = (ring) => {
        for (let i = 0; i < ring.length - 1; i++) {
          const [lng1, lat1] = ring[i]
          const [lng2, lat2] = ring[i + 1]
          const v1 = this.latLngToVector3(lat1, lng1, this.EARTH_R + 1000)
          const v2 = this.latLngToVector3(lat2, lng2, this.EARTH_R + 1000)
          coastlineVertices.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z)
        }
      }

      if (feature.geometry.type === "Polygon") {
        feature.geometry.coordinates.forEach(processRing)
      } else if (feature.geometry.type === "MultiPolygon") {
        feature.geometry.coordinates.forEach(polygon => {
          polygon.forEach(processRing)
        })
      }
    })

    const lineGeometry = new THREE.BufferGeometry()
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(coastlineVertices, 3))

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x88aacc,
      opacity: 0.4,
      transparent: true
    })

    const coastlines = new THREE.LineSegments(lineGeometry, lineMaterial)
    this.earthGroup.add(coastlines)

    console.log("🏖️  Coastlines rendered")
  }

  /**
   * Clear geocentric objects when switching to heliocentric view
   * Removes Earth mesh, atmosphere, and country borders from scene
   */
  clearGeocentricObjects() {
    if (!this.scene) return  // Safety check

    // Remove Earth group (contains all geocentric objects)
    if (this.earthGroup) {
      this.scene.remove(this.earthGroup)
      this.earthGroup.traverse(child => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) child.material.dispose()
      })
      this.earthGroup = null
    }

    // Reset references
    this.oceanMesh = null
    this.atmosphere = null
    this.landGroup = null
    this.countryData = null
  }

  /**
   * Get ocean mesh for raycasting (used for click-to-set-location)
   * @returns {THREE.Mesh|null} Ocean mesh
   */
  getOceanMesh() {
    return this.oceanMesh
  }

  /**
   * Get land group for raycasting (used for country hover detection)
   * @returns {THREE.Group|null} Land group
   */
  getLandGroup() {
    return this.landGroup
  }

  /**
   * Get country data for hover detection
   * @returns {Array|null} Array of country features
   */
  getCountryData() {
    return this.countryData
  }
}
