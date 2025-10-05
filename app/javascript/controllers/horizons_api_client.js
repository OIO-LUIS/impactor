// ============================================================================
// HORIZONS API CLIENT (Frontend)
// ============================================================================
//
// Client-side interface to NASA JPL Horizons API for fetching planetary positions.
// Falls back to backend proxy if CORS is blocked.
//
// FEATURES:
// - Direct API calls to Horizons (if CORS permits)
// - Fallback to backend proxy endpoint
// - LocalStorage caching with TTL
// - Batch planet queries
// - Error handling with fallback positions
//
// API Documentation: https://ssd-api.jpl.nasa.gov/doc/horizons.html
//
// ============================================================================

export class HorizonsApiClient {
  constructor() {
    // Horizons API endpoint
    this.baseUrl = 'https://ssd.jpl.nasa.gov/api/horizons.api'

    // Backend proxy endpoint (fallback for CORS)
    this.proxyUrl = '/api/horizons/proxy'

    // Cache configuration
    this.cacheEnabled = true
    this.cacheTTL = 30 * 60 * 1000  // 30 minutes in milliseconds

    // Planet IDs in Horizons system
    this.PLANET_IDS = {
      mercury: '199',
      venus: '299',
      earth: '399',
      mars: '499',
      jupiter: '599',
      saturn: '699',
      uranus: '799',
      neptune: '899'
    }

    // Conversion constant
    this.AU_TO_KM = 149597870.7

    // Track if direct API works (CORS check)
    this.directApiWorks = null
  }

  /**
   * Fetch positions for all planets at a specific time
   * @param {Date} datetime - Time for planet positions
   * @returns {Promise<Object>} Planet positions keyed by name
   */
  async fetchAllPlanets(datetime) {
    const cacheKey = this.getCacheKey('all', datetime)

    // Check cache first
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      console.log('📦 Using cached planet positions')
      return cached
    }

    try {
      const positions = {}

      // Fetch all planets (could be optimized with parallel requests)
      for (const [name, id] of Object.entries(this.PLANET_IDS)) {
        positions[name] = await this.fetchPlanetPosition(id, datetime)
      }

      // Cache the result
      this.saveToCache(cacheKey, positions)

      return positions
    } catch (error) {
      console.error('❌ Error fetching all planets:', error)
      return this.getFallbackPositions(datetime)
    }
  }

  /**
   * Fetch position for a single planet
   * @param {string} planetId - Horizons body ID
   * @param {Date} datetime - Time for position
   * @returns {Promise<Object>} Position data
   */
  async fetchPlanetPosition(planetId, datetime) {
    const cacheKey = this.getCacheKey(planetId, datetime)

    // Check cache
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return cached
    }

    try {
      // Build query parameters
      const params = this.buildQueryParams(planetId, datetime)

      // Try direct API first (if not known to fail)
      if (this.directApiWorks !== false) {
        try {
          const directResult = await this.fetchDirect(params)
          this.directApiWorks = true

          const position = this.parseHorizonsResponse(directResult)
          this.saveToCache(cacheKey, position)
          return position
        } catch (corsError) {
          console.warn('⚠️ Direct API failed (likely CORS), trying proxy...')
          this.directApiWorks = false
        }
      }

      // Fallback to backend proxy
      const proxyResult = await this.fetchViaProxy(planetId, datetime)
      this.saveToCache(cacheKey, proxyResult)
      return proxyResult

    } catch (error) {
      console.error(`❌ Error fetching planet ${planetId}:`, error)
      return this.getFallbackPosition(planetId, datetime)
    }
  }

  /**
   * Build query parameters for Horizons API
   * @private
   */
  buildQueryParams(bodyId, datetime) {
    const timeStr = this.formatDateTime(datetime)

    return new URLSearchParams({
      format: 'json',
      COMMAND: bodyId,
      OBJ_DATA: 'NO',
      MAKE_EPHEM: 'YES',
      EPHEM_TYPE: 'VECTORS',
      CENTER: '@0',  // Sun-centered
      START_TIME: timeStr,
      STOP_TIME: timeStr,
      STEP_SIZE: '1d',
      VEC_TABLE: '2',
      VEC_LABELS: 'NO',
      CSV_FORMAT: 'YES',
      OUT_UNITS: 'AU-D',
      REF_PLANE: 'ECLIPTIC',
      REF_SYSTEM: 'J2000'
    })
  }

  /**
   * Direct API fetch (may fail due to CORS)
   * @private
   */
  async fetchDirect(params) {
    const url = `${this.baseUrl}?${params}`

    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Horizons API error: ${response.status}`)
    }

    return await response.json()
  }

  /**
   * Fetch via backend proxy
   * @private
   */
  async fetchViaProxy(planetId, datetime) {
    const response = await fetch(this.proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        planet_id: planetId,
        datetime: datetime.toISOString()
      })
    })

    if (!response.ok) {
      throw new Error(`Proxy error: ${response.status}`)
    }

    const data = await response.json()
    return data
  }

  /**
   * Parse Horizons API JSON response
   * @private
   */
  parseHorizonsResponse(data) {
    try {
      const result = data.result
      if (!result) return null

      // Find data between $$SOE and $$EOE markers
      const lines = result.split('\n')
      const startIdx = lines.findIndex(l => l.includes('$$SOE'))
      const endIdx = lines.findIndex(l => l.includes('$$EOE'))

      if (startIdx === -1 || endIdx === -1) return null

      // Parse CSV data line
      const dataLine = lines[startIdx + 1].trim()
      const values = dataLine.split(',').map(v => v.trim())

      // Extract position and velocity
      const x_au = parseFloat(values[2])
      const y_au = parseFloat(values[3])
      const z_au = parseFloat(values[4])
      const vx_au_day = parseFloat(values[5])
      const vy_au_day = parseFloat(values[6])
      const vz_au_day = parseFloat(values[7])

      // Convert to km and km/s
      const au_day_to_kms = this.AU_TO_KM / 86400.0

      return {
        position: [
          x_au * this.AU_TO_KM,
          y_au * this.AU_TO_KM,
          z_au * this.AU_TO_KM
        ],
        position_au: [x_au, y_au, z_au],
        velocity: [
          vx_au_day * au_day_to_kms,
          vy_au_day * au_day_to_kms,
          vz_au_day * au_day_to_kms
        ],
        fallback: false
      }
    } catch (error) {
      console.error('Error parsing Horizons response:', error)
      return null
    }
  }

  /**
   * Format datetime for Horizons API
   * @private
   */
  formatDateTime(date) {
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    const hour = String(date.getUTCHours()).padStart(2, '0')
    const minute = String(date.getUTCMinutes()).padStart(2, '0')

    return `${year}-${month}-${day} ${hour}:${minute}`
  }

  /**
   * Get cache key for planet and time
   * @private
   */
  getCacheKey(planetId, datetime) {
    // Round time to nearest hour for better cache hits
    const roundedTime = new Date(datetime)
    roundedTime.setMinutes(0, 0, 0)

    return `horizons:${planetId}:${roundedTime.getTime()}`
  }

  /**
   * Get data from localStorage cache
   * @private
   */
  getFromCache(key) {
    if (!this.cacheEnabled) return null

    try {
      const item = localStorage.getItem(key)
      if (!item) return null

      const data = JSON.parse(item)
      const now = Date.now()

      // Check if cache is expired
      if (now - data.timestamp > this.cacheTTL) {
        localStorage.removeItem(key)
        return null
      }

      return data.value
    } catch (error) {
      console.warn('Cache read error:', error)
      return null
    }
  }

  /**
   * Save data to localStorage cache
   * @private
   */
  saveToCache(key, value) {
    if (!this.cacheEnabled) return

    try {
      const data = {
        timestamp: Date.now(),
        value
      }
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.warn('Cache write error:', error)
      // Clear old cache items if storage is full
      this.clearOldCache()
    }
  }

  /**
   * Clear expired cache entries
   * @private
   */
  clearOldCache() {
    const now = Date.now()
    const keysToRemove = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('horizons:')) {
        try {
          const item = JSON.parse(localStorage.getItem(key))
          if (now - item.timestamp > this.cacheTTL) {
            keysToRemove.push(key)
          }
        } catch {
          keysToRemove.push(key)
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key))
  }

  /**
   * Get fallback position for a planet using Keplerian approximation
   * @private
   */
  getFallbackPosition(planetId, datetime) {
    // Orbital data for circular approximation
    const orbitalData = {
      '199': { distance: 0.39, period: 0.241 },   // Mercury
      '299': { distance: 0.72, period: 0.615 },   // Venus
      '399': { distance: 1.00, period: 1.000 },   // Earth
      '499': { distance: 1.52, period: 1.881 },   // Mars
      '599': { distance: 5.20, period: 11.86 },   // Jupiter
      '699': { distance: 9.54, period: 29.46 },   // Saturn
      '799': { distance: 19.19, period: 84.01 },  // Uranus
      '899': { distance: 30.07, period: 164.8 }   // Neptune
    }

    const data = orbitalData[planetId] || { distance: 1.0, period: 1.0 }

    // Simple circular orbit
    const j2000 = new Date('2000-01-01T12:00:00Z')
    const daysSinceJ2000 = (datetime - j2000) / (1000 * 60 * 60 * 24)
    const meanAnomaly = (360.0 * daysSinceJ2000 / (data.period * 365.25)) % 360.0
    const angleRad = meanAnomaly * Math.PI / 180.0

    const x_au = data.distance * Math.cos(angleRad)
    const y_au = data.distance * Math.sin(angleRad)
    const z_au = 0

    // Approximate velocity
    const v_kms = 29.78 / Math.sqrt(data.distance)
    const vx = -v_kms * Math.sin(angleRad)
    const vy = v_kms * Math.cos(angleRad)

    return {
      position: [
        x_au * this.AU_TO_KM,
        y_au * this.AU_TO_KM,
        z_au * this.AU_TO_KM
      ],
      position_au: [x_au, y_au, z_au],
      velocity: [vx, vy, 0],
      fallback: true
    }
  }

  /**
   * Get fallback positions for all planets
   * @private
   */
  getFallbackPositions(datetime) {
    const positions = {}

    for (const [name, id] of Object.entries(this.PLANET_IDS)) {
      positions[name] = this.getFallbackPosition(id, datetime)
    }

    return positions
  }
}