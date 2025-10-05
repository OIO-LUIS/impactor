// ============================================================================
// ORBITAL MECHANICS CALCULATOR
// ============================================================================
//
// Handles all Keplerian orbital mechanics calculations including:
// - Solving Kepler's equation for eccentric anomaly
// - Converting orbital elements to Cartesian coordinates
// - Calculating orbital trajectories
// - Detecting Earth intersections
// - Time conversions (JavaScript Date ↔ Julian Date)
//
// SCIENTIFIC ACCURACY:
// - Uses Newton-Raphson method for Kepler's equation
// - Proper 3D coordinate transformations (ω, i, Ω rotations)
// - Heliocentric ecliptic J2000 reference frame
//
// ============================================================================

import * as THREE from "three"

export class OrbitalMechanicsCalculator {
  constructor(AU, SCENE_SCALE, EARTH_R) {
    this.AU = AU  // 1 AU in km
    this.SCENE_SCALE = SCENE_SCALE  // Scene scaling factor
    this.EARTH_R = EARTH_R  // Earth radius in meters
  }

  /**
   * Calculate 3D position from Keplerian orbital elements at given time
   *
   * @param {Object} orbitalElements - Keplerian elements
   *   - semi_major_axis_au: Semi-major axis (AU)
   *   - eccentricity: Orbital eccentricity (0-1)
   *   - inclination_deg: Orbital inclination (degrees)
   *   - argument_perihelion_deg: Argument of perihelion ω (degrees)
   *   - longitude_ascending_node_deg: Longitude of ascending node Ω (degrees)
   *   - mean_anomaly_deg: Mean anomaly at epoch (degrees)
   *   - epoch_jd: Epoch Julian date
   *   - mean_motion_deg_per_day: Mean motion (deg/day, optional)
   * @param {number} timeJD - Julian date for position calculation
   * @returns {THREE.Vector3} Position in scene coordinates
   */
  calculateOrbitalPosition(orbitalElements, timeJD) {
    // Extract elements
    const a = orbitalElements.semi_major_axis_au  // AU
    const e = orbitalElements.eccentricity
    const i = THREE.MathUtils.degToRad(orbitalElements.inclination_deg || 0)
    const omega = THREE.MathUtils.degToRad(orbitalElements.argument_perihelion_deg || 0)
    const Omega = THREE.MathUtils.degToRad(orbitalElements.longitude_ascending_node_deg || 0)
    const epochJD = orbitalElements.epoch_jd
    const meanMotion = orbitalElements.mean_motion_deg_per_day || this.calculateMeanMotion(a)
    const M0 = THREE.MathUtils.degToRad(orbitalElements.mean_anomaly_deg || 0)

    // Calculate mean anomaly at time t
    const dt = timeJD - epochJD  // Days since epoch
    const M = M0 + THREE.MathUtils.degToRad(meanMotion * dt)  // Mean anomaly at time t

    // Solve Kepler's equation M = E - e*sin(E) for eccentric anomaly E
    const E = this.solveKeplersEquation(M, e)

    // Calculate true anomaly from eccentric anomaly
    const trueAnomaly = 2 * Math.atan2(
      Math.sqrt(1 + e) * Math.sin(E / 2),
      Math.sqrt(1 - e) * Math.cos(E / 2)
    )

    // Calculate distance from focus (Sun)
    const r = a * (1 - e * Math.cos(E))  // AU

    // Position in orbital plane
    const x_orb = r * Math.cos(trueAnomaly)
    const y_orb = r * Math.sin(trueAnomaly)

    // Apply orbital orientation transformations
    // First rotate by argument of perihelion
    const x1 = x_orb * Math.cos(omega) - y_orb * Math.sin(omega)
    const z1 = x_orb * Math.sin(omega) + y_orb * Math.cos(omega)

    // Then apply inclination and longitude of ascending node
    const x2 = x1 * Math.cos(Omega) - z1 * Math.cos(i) * Math.sin(Omega)
    const y2 = z1 * Math.sin(i)
    const z2 = x1 * Math.sin(Omega) + z1 * Math.cos(i) * Math.cos(Omega)

    // Convert to scene units
    const sceneScale = this.AU / this.SCENE_SCALE
    return new THREE.Vector3(
      x2 * sceneScale,
      y2 * sceneScale,
      z2 * sceneScale
    )
  }

  /**
   * Solve Kepler's equation M = E - e*sin(E) for eccentric anomaly E
   * Uses Newton-Raphson iterative method
   *
   * @param {number} M - Mean anomaly (radians)
   * @param {number} e - Eccentricity
   * @param {number} tolerance - Convergence tolerance
   * @returns {number} Eccentric anomaly E (radians)
   */
  solveKeplersEquation(M, e, tolerance = 1e-8) {
    let E = M  // Initial guess
    const maxIterations = 30

    for (let i = 0; i < maxIterations; i++) {
      const f = E - e * Math.sin(E) - M
      const fPrime = 1 - e * Math.cos(E)
      const delta = f / fPrime
      E -= delta

      if (Math.abs(delta) < tolerance) break
    }

    return E
  }

  /**
   * Calculate mean motion from semi-major axis using Kepler's 3rd law
   * n = 360° / orbital_period
   * Period (years) = sqrt(a^3) for a in AU
   *
   * @param {number} semiMajorAxisAU - Semi-major axis in AU
   * @returns {number} Mean motion in degrees per day
   */
  calculateMeanMotion(semiMajorAxisAU) {
    const periodYears = Math.sqrt(Math.pow(semiMajorAxisAU, 3))
    const periodDays = periodYears * 365.25
    return 360.0 / periodDays  // degrees per day
  }

  /**
   * Calculate full orbital trajectory by propagating over one complete orbit
   *
   * @param {Object} orbitalElements - Keplerian elements
   * @param {number} numPoints - Number of points to generate (default 100)
   * @returns {Array<THREE.Vector3>} Array of positions along orbit
   */
  calculateOrbitalTrajectory(orbitalElements, numPoints = 100) {
    if (!orbitalElements) return null

    console.log("🛰️  ═══════════════════════════════════════════════════════")
    console.log("🛰️  ORBITAL PROPAGATOR - Keplerian Elements")
    console.log("🛰️  ═══════════════════════════════════════════════════════")
    console.log("📊 Input Elements:")
    console.log("  - Eccentricity (e):", orbitalElements.eccentricity)
    console.log("  - Semi-major axis (a):", orbitalElements.semi_major_axis_au, "AU")
    console.log("  - Inclination (i):", orbitalElements.inclination_deg, "°")
    console.log("  - Longitude Asc. Node (Ω):", orbitalElements.longitude_ascending_node_deg, "°")
    console.log("  - Argument Perihelion (ω):", orbitalElements.argument_perihelion_deg, "°")
    console.log("  - Mean Anomaly (M):", orbitalElements.mean_anomaly_deg, "°")

    const e = orbitalElements.eccentricity
    const a = orbitalElements.semi_major_axis_au * 149597870.7  // Convert AU to km
    const i = THREE.MathUtils.degToRad(orbitalElements.inclination_deg)
    const om = THREE.MathUtils.degToRad(orbitalElements.longitude_ascending_node_deg)
    const w = THREE.MathUtils.degToRad(orbitalElements.argument_perihelion_deg)
    const M0 = THREE.MathUtils.degToRad(orbitalElements.mean_anomaly_deg)

    const trajectory = []

    // Generate points along the orbit
    for (let step = 0; step <= numPoints; step++) {
      const meanAnomaly = M0 + (step / numPoints) * 2 * Math.PI

      // Solve Kepler's equation: E - e*sin(E) = M (using Newton-Raphson)
      let E = meanAnomaly
      for (let iter = 0; iter < 10; iter++) {
        E = E - (E - e * Math.sin(E) - meanAnomaly) / (1 - e * Math.cos(E))
      }

      // Calculate position in orbital plane
      const r = a * (1 - e * Math.cos(E))
      const x_orbital = r * Math.cos(E) - a * e
      const y_orbital = r * Math.sin(E) * Math.sqrt(1 - e * e)

      // Transform to 3D space (rotation by i, om, w)
      const x = (Math.cos(om) * Math.cos(w) - Math.sin(om) * Math.sin(w) * Math.cos(i)) * x_orbital +
                (-Math.cos(om) * Math.sin(w) - Math.sin(om) * Math.cos(w) * Math.cos(i)) * y_orbital

      const y = (Math.sin(om) * Math.cos(w) + Math.cos(om) * Math.sin(w) * Math.cos(i)) * x_orbital +
                (-Math.sin(om) * Math.sin(w) + Math.cos(om) * Math.cos(w) * Math.cos(i)) * y_orbital

      const z = (Math.sin(w) * Math.sin(i)) * x_orbital +
                (Math.cos(w) * Math.sin(i)) * y_orbital

      // Convert from km to Three.js units (scaled to Earth radius)
      const scale = 1 / 6371  // Earth radius in km
      trajectory.push(new THREE.Vector3(x * scale, z * scale, -y * scale))
    }

    console.log("✅ Orbital trajectory calculated:", trajectory.length, "points")
    console.log("  - Perihelion distance:", (a * (1 - e) / 6371).toFixed(2), "Earth radii")
    console.log("  - Aphelion distance:", (a * (1 + e) / 6371).toFixed(2), "Earth radii")

    return trajectory
  }

  /**
   * Detect if orbital trajectory intersects with Earth
   *
   * @param {Array<THREE.Vector3>} trajectory - Array of positions
   * @returns {Object|null} {impactPoint, approachDir, impactIndex} or null if miss
   */
  detectEarthIntersection(trajectory) {
    if (!trajectory) return null

    const earthRadius = this.EARTH_R

    console.log("🎯 Checking Earth intersection...")

    for (let i = 1; i < trajectory.length; i++) {
      const prevPoint = trajectory[i - 1]
      const currPoint = trajectory[i]

      const prevDist = prevPoint.length()
      const currDist = currPoint.length()

      // Check if trajectory crosses Earth's surface
      if (prevDist > earthRadius && currDist <= earthRadius) {
        console.log("💥 IMPACT DETECTED!")
        console.log("  - Impact at trajectory point:", i, "/", trajectory.length)

        // Calculate impact point (interpolate to surface)
        const t = (earthRadius - prevDist) / (currDist - prevDist)
        const impactPoint = new THREE.Vector3().lerpVectors(prevPoint, currPoint, t)

        // Calculate approach direction
        const approachDir = new THREE.Vector3().subVectors(currPoint, prevPoint).normalize()

        console.log("  - Impact point:", impactPoint)
        console.log("  - Approach direction:", approachDir)

        return { impactPoint, approachDir, impactIndex: i }
      }
    }

    console.log("✅ No Earth intersection - this is a MISS")
    return null
  }

  /**
   * Position Earth on its orbit at specific time
   * NOTE: Simplified circular orbit approximation
   * For scientific accuracy, use backend OrbitalMechanicsService
   *
   * @param {Date} time - Time for Earth position
   * @returns {THREE.Vector3} Earth position in scene coordinates
   */
  positionEarthAtTime(time) {
    try {
      // Simplified Earth position (circular orbit)
      const timeJD = this.timeToJulianDate(time)
      const j2000 = 2451545.0
      const daysSinceJ2000 = timeJD - j2000

      // Earth's mean longitude (degrees)
      const meanLongitude = (100.46435 + 0.985609101 * daysSinceJ2000) % 360
      const angleRad = THREE.MathUtils.degToRad(meanLongitude)

      // Position on circular orbit
      const orbitRadius = this.AU / this.SCENE_SCALE

      console.log(`  🌍 Earth positioned at longitude ${meanLongitude.toFixed(1)}°`)

      return new THREE.Vector3(
        Math.cos(angleRad) * orbitRadius,
        0,
        -Math.sin(angleRad) * orbitRadius  // Negative for correct direction
      )
    } catch (error) {
      console.error("❌ Error positioning Earth:", error)
      return new THREE.Vector3(0, 0, 0)
    }
  }

  /**
   * Calculate Earth's velocity vector (tangent to circular orbit)
   *
   * @param {THREE.Vector3} earthPosition - Current Earth position
   * @returns {THREE.Vector3} Normalized velocity direction
   */
  calculateEarthVelocity(earthPosition) {
    if (!earthPosition) return new THREE.Vector3(1, 0, 0)

    const pos = earthPosition.clone().normalize()
    // Velocity is perpendicular to radial vector (in orbital plane)
    return new THREE.Vector3(-pos.z, 0, pos.x).normalize()
  }

  /**
   * Calculate NEO's velocity vector at current position
   * Simplified: tangent to ellipse
   *
   * @param {THREE.Vector3} neoPosition - Current NEO position
   * @returns {THREE.Vector3} Normalized velocity direction
   */
  calculateNeoVelocity(neoPosition) {
    if (!neoPosition) return new THREE.Vector3(1, 0, 0)

    const pos = neoPosition.clone()
    // For now, approximate as perpendicular to position
    // In production, would calculate from vis-viva equation
    return new THREE.Vector3(-pos.z, 0, pos.x).normalize()
  }

  /**
   * Convert JavaScript Date/Time to Julian Date
   * JD = 2440587.5 + (Unix timestamp / 86400)
   *
   * @param {Date|string|number} time - Time to convert
   * @returns {number} Julian date
   */
  timeToJulianDate(time) {
    // Handle various input types
    let date
    if (time instanceof Date) {
      date = time
    } else if (typeof time === 'string') {
      date = new Date(time)
    } else if (typeof time === 'object' && time.toDate) {
      date = time.toDate()  // Rails Time object
    } else {
      date = new Date(time)
    }

    const unixTime = date.getTime() / 1000  // Convert to seconds
    return 2440587.5 + (unixTime / 86400.0)
  }
}
