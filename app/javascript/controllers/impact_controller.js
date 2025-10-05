import { Controller } from "@hotwired/stimulus"
import * as d3 from "d3"
import { feature, mesh } from "topojson-client"
import { post } from "@rails/request.js"

export default class extends Controller {
  static targets = ["globe", "form", "metrics", "tooltip", "timeline", "threatLevel", "simCount"]
  static values = { countriesUrl: String }

  connect() {
    this.ready = false
    this.EARTH_KM = 6371
    this.simulations = 0
    this.animationFrame = null
    this.isPlaying = false
    this.currentTime = 0
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    // Initialize visualization
    this.initializeVisualization()
    
    // Load geographic data
    this.loadGeographicData()
    
    // Setup real-time updates
    this.setupRealtimeUpdates()
  }

  initializeVisualization() {
    this.width = window.innerWidth
    this.height = window.innerHeight

    // Create main SVG with proper layering
    this.svg = d3.select(this.globeTarget)
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .attr("role", "img")
      .attr("aria-label", "Interactive 3D globe showing asteroid impact simulation")

    // Enhanced gradient definitions
    const defs = this.svg.append("defs")
    
    // Ocean gradient
    const oceanGrad = defs.append("radialGradient")
      .attr("id", "oceanGrad")
      .attr("cx", "50%").attr("cy", "50%").attr("r", "50%")
    oceanGrad.append("stop").attr("offset", "0%").attr("stop-color", "#0a1929")
    oceanGrad.append("stop").attr("offset", "70%").attr("stop-color", "#0d47a1")
    oceanGrad.append("stop").attr("offset", "100%").attr("stop-color", "#01579b")
    
    // Trajectory gradient
    const trajectoryGrad = defs.append("linearGradient")
      .attr("id", "trajectoryGrad")
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "100%").attr("y2", "0%")
    trajectoryGrad.append("stop").attr("offset", "0%").attr("stop-color", "#ff6b35").attr("stop-opacity", 0.2)
    trajectoryGrad.append("stop").attr("offset", "50%").attr("stop-color", "#ff4d4f").attr("stop-opacity", 0.8)
    trajectoryGrad.append("stop").attr("offset", "100%").attr("stop-color", "#ff1744").attr("stop-opacity", 1)
    
    // Shockwave filter
    const filter = defs.append("filter")
      .attr("id", "shockwave")
      .attr("x", "-200%").attr("y", "-200%")
      .attr("width", "400%").attr("height", "400%")
    filter.append("feGaussianBlur").attr("stdDeviation", "3")
    
    // Layer groups for proper z-ordering
    this.root = this.svg.append("g")
    this.gSphere = this.root.append("g").attr("class", "sphere-layer")
    this.gGraticule = this.root.append("g").attr("class", "graticule-layer")
    this.gLand = this.root.append("g").attr("class", "land-layer")
    this.gBorders = this.root.append("g").attr("class", "borders-layer")
    this.gOceanEffects = this.root.append("g").attr("class", "ocean-effects")
    this.gTrajectory = this.root.append("g").attr("class", "trajectory-layer")
    this.gDebris = this.root.append("g").attr("class", "debris-layer")
    this.gRings = this.root.append("g").attr("class", "rings-layer")
    this.gShockwaves = this.root.append("g").attr("class", "shockwave-layer")
    this.gImpactPoint = this.root.append("g").attr("class", "impact-layer")
    this.gAnnotations = this.root.append("g").attr("class", "annotations-layer")

    // Setup projection with better parameters
    this.baseScale = Math.min(this.width, this.height) * 0.45
    this.projection = d3.geoOrthographic()
      .translate([this.width/2, this.height/2])
      .scale(this.baseScale)
      .clipAngle(90)
      .precision(0.1)
      .rotate([-84, -10, 0]) // Default view centered on impact zone
    
    this.path = d3.geoPath(this.projection).pointRadius(4)
    
    // Setup advanced interactions
    this.setupInteractions()
  }

  setupInteractions() {
    // Enhanced zoom behavior
    this.zoom = d3.zoom()
      .scaleExtent([0.5, 8])
      .on("zoom", (event) => {
        if (!this.ready) return
        const transform = event.transform
        this.projection.scale(this.baseScale * transform.k)
        this.render()
      })
    
    this.svg.call(this.zoom).on("dblclick.zoom", null)
    
    // Double-click to reset
    this.svg.on("dblclick", () => {
      if (!this.ready) return
      this.resetView()
    })
    
    // Drag rotation with inertia
    const sensitivity = 0.25
    let rotationVelocity = [0, 0]
    let lastDragTime = 0
    let r0, m0
    
    this.svg.call(
      d3.drag()
        .on("start", (event) => {
          if (!this.ready) return
          rotationVelocity = [0, 0]
          r0 = this.projection.rotate()
          m0 = [event.x, event.y]
          lastDragTime = Date.now()
        })
        .on("drag", (event) => {
          if (!this.ready) return
          const now = Date.now()
          const dt = now - lastDragTime
          const dx = event.x - m0[0]
          const dy = event.y - m0[1]
          
          let λ = r0[0] + dx * sensitivity
          let φ = r0[1] - dy * sensitivity
          
          λ = ((λ + 180) % 360 + 360) % 360 - 180
          φ = Math.max(-90, Math.min(90, φ))
          
          if (dt > 0) {
            rotationVelocity = [(λ - this.projection.rotate()[0]) / dt * 1000, (φ - this.projection.rotate()[1]) / dt * 1000]
          }
          
          this.projection.rotate([λ, φ, r0[2] || 0])
          lastDragTime = now
          this.render()
        })
        .on("end", () => {
          if (!this.ready || this.reduced) return
          // Add inertia
          this.applyInertia(rotationVelocity)
        })
    )
    
    // Window resize handling
    this._onResize = this.debounce(() => {
      this.width = window.innerWidth
      this.height = window.innerHeight
      this.svg.attr("width", this.width).attr("height", this.height)
      this.baseScale = Math.min(this.width, this.height) * 0.45
      this.projection.translate([this.width/2, this.height/2]).scale(this.baseScale)
      this.svg.call(this.zoom.transform, d3.zoomIdentity)
      if (this.ready) this.render()
    }, 250)
    
    window.addEventListener("resize", this._onResize, { passive: true })
  }

  applyInertia(velocity) {
    const decay = 0.95
    const threshold = 0.5
    
    const animate = () => {
      if (Math.abs(velocity[0]) < threshold && Math.abs(velocity[1]) < threshold) return
      
      const r = this.projection.rotate()
      const λ = ((r[0] + velocity[0] * 0.01 + 180) % 360 + 360) % 360 - 180
      const φ = Math.max(-90, Math.min(90, r[1] + velocity[1] * 0.01))
      
      this.projection.rotate([λ, φ, r[2]])
      velocity[0] *= decay
      velocity[1] *= decay
      
      this.render()
      requestAnimationFrame(animate)
    }
    
    animate()
  }

  async loadGeographicData() {
    try {
      const world = await d3.json(this.countriesUrlValue)
      this.countriesFC = feature(world, world.objects.countries)
      this.borders = mesh(world, world.objects.countries, (a, b) => a !== b)
      
      // Create sphere
      this.gSphere.selectAll("path.sphere")
        .data([{ type: "Sphere" }])
        .join("path")
        .attr("class", "sphere")
        .attr("d", this.path)
      
      // Create graticule
      this.graticule = d3.geoGraticule10()
      this.gGraticule.selectAll("path.graticule")
        .data([this.graticule])
        .join("path")
        .attr("class", "graticule")
        .attr("d", this.path)
      
      // Create land masses with interaction
      this.gLand.selectAll("path.land")
        .data(this.countriesFC.features)
        .join("path")
        .attr("class", "land")
        .attr("d", this.path)
        .on("mousemove", (event, d) => this.showLocationTooltip(event, d))
        .on("mouseout", () => this.hideTooltip())
        .on("click", (event, d) => this.selectCountry(event, d))
      
      // Create borders
      this.gBorders.selectAll("path.boundary")
        .data([this.borders])
        .join("path")
        .attr("class", "boundary")
        .attr("d", this.path)
      
      this.ready = true
      this.render()
      
      // Load NEO data
      this.loadNEOData()
      
    } catch (error) {
      console.error("Failed to load geographic data:", error)
      this.metricsTarget.innerHTML = `<div class="metric-item"><span class="metric-label">Error</span><span class="metric-value critical">Failed to load map data</span></div>`
    }
  }

  async loadNEOData() {
    try {

      const response = await post("/neos", { 
        body: formData,
        responseKind: "json"
      })

      console.log(response)
      const neos = await response.json()
      
      // Populate NEO selector
      const selector = this.formTarget.querySelector("#neo_select")
      neos.forEach(neo => {
        const option = document.createElement("option")
        option.value = neo.id
        option.textContent = `${neo.name} (${neo.est_diameter_m_max}m)`
        option.dataset.diameter = neo.est_diameter_m_max
        option.dataset.velocity = neo.close_approaches[0]?.relative_velocity_kms || 20
        selector.appendChild(option)
      })
    } catch (error) {
      console.error("Failed to load NEO data:", error)
    }
  }

  loadNEO(event) {
    const option = event.target.selectedOptions[0]
    if (option.dataset.diameter) {
      this.formTarget.querySelector("#diameter_m").value = option.dataset.diameter
      this.formTarget.querySelector("#velocity_kms").value = option.dataset.velocity
    }
  }

  async simulate(event) {
    event.preventDefault()
    if (!this.ready) {
      this.showNotification("System still initializing...", "warning")
      return
    }
    
    const formData = new FormData(this.formTarget)
    const lat = parseFloat(formData.get("lat"))
    const lng = parseFloat(formData.get("lng"))
    
    try {
      // Show loading state
      this.showLoadingState()
      
      // Send simulation request
      const response = await post("/simulate", { 
        body: formData,
        responseKind: "json"
      })
      
      if (!response.ok) {
        throw new Error(response.statusText)
      }
      
      const data = await response.json
      
      if (!data.ok) {
        throw new Error(data.error || "Simulation failed")
      }
      
      // Update simulation counter
      this.simulations++
      this.simCountTarget.textContent = `${this.simulations} Simulations`
      
      // Process and visualize results
      this.processSimulationResults(data, lat, lng)
      
      // Center view on impact
      this.centerOnImpact(lng, lat, data.results?.burst_alt_km)
      
      // Start timeline if available
      if (data.timeline) {
        this.initializeTimeline(data.timeline)
      }
      
    } catch (error) {
      console.error("Simulation error:", error)
      this.showNotification(`Simulation failed: ${error.message}`, "error")
      this.hideLoadingState()
    }
  }

  processSimulationResults(data, lat, lng) {
    const results = data.results || {}
    
    // Determine threat level
    const threatLevel = this.calculateThreatLevel(results)
    this.updateThreatLevel(threatLevel)
    
    // Update metrics display
    this.updateMetricsDisplay(results)
    
    // Visualize impact effects
    this.visualizeImpact({
      lat,
      lng,
      results,
      rings: this.generateDamageRings(results, lat, lng),
      trajectory: data.entry_track,
      debris: data.debris_paths,
      shockwaves: data.shockwave_progression
    })
    
    // Hide loading state
    this.hideLoadingState()
  }

  calculateThreatLevel(results) {
    const energy = results.energy_megatons_tnt || 0
    
    if (energy > 10000) return { level: "EXTINCTION", class: "critical" }
    if (energy > 1000) return { level: "CONTINENTAL", class: "severe" }
    if (energy > 100) return { level: "REGIONAL", class: "major" }
    if (energy > 10) return { level: "LOCAL", class: "moderate" }
    if (energy > 1) return { level: "MINOR", class: "minor" }
    return { level: "MINIMAL", class: "safe" }
  }

  updateThreatLevel(threat) {
    this.threatLevelTarget.textContent = threat.level
    this.threatLevelTarget.className = `panel-badge ${threat.class}`
  }

  updateMetricsDisplay(results) {
    const formatValue = (val, unit = "", decimals = 2) => {
      if (val === null || val === undefined) return "—"
      if (typeof val === "number") {
        if (val > 1000000) return `${(val/1000000).toFixed(decimals)}M${unit}`
        if (val > 1000) return `${(val/1000).toFixed(decimals)}k${unit}`
        return `${val.toFixed(decimals)}${unit}`
      }
      return val
    }
    
    const impactMode = results.mode === "airburst" ? "Airburst" : "Ground Impact"
    const burstAlt = results.burst_alt_km ? `@ ${formatValue(results.burst_alt_km, " km")} altitude` : ""
    
    this.metricsTarget.innerHTML = `
      <div class="metric-group">
        <div class="metric-group-title">Primary Effects</div>
        <div class="metric-item">
          <span class="metric-label">Impact Mode</span>
          <span class="metric-value ${results.mode === 'airburst' ? 'moderate' : 'severe'}">${impactMode} ${burstAlt}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Energy Released</span>
          <span class="metric-value ${this.getEnergyClass(results.energy_megatons_tnt)}">${formatValue(results.energy_megatons_tnt, " Mt TNT")}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Crater Diameter</span>
          <span class="metric-value">${formatValue(results.final_crater_d_m, " m", 0)}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Crater Depth</span>
          <span class="metric-value">${formatValue(results.crater_depth_m, " m", 0)}</span>
        </div>
      </div>
      
      <div class="metric-group">
        <div class="metric-group-title">Damage Zones</div>
        <div class="damage-grid">
          <div class="damage-card">
            <div class="damage-icon">💥</div>
            <div class="damage-label">Vaporization</div>
            <div class="damage-value critical">${formatValue(results.vaporization_radius_km, " km")}</div>
          </div>
          <div class="damage-card">
            <div class="damage-icon">🔥</div>
            <div class="damage-label">Thermal</div>
            <div class="damage-value severe">${formatValue(results.thermal_radiation_radius_km, " km")}</div>
          </div>
          <div class="damage-card">
            <div class="damage-icon">💨</div>
            <div class="damage-label">Blast</div>
            <div class="damage-value major">${formatValue(results.severe_blast_radius_km, " km")}</div>
          </div>
          <div class="damage-card">
            <div class="damage-icon">🌊</div>
            <div class="damage-label">Tsunami</div>
            <div class="damage-value moderate">${formatValue(results.tsunami_100km_m, " m")}</div>
          </div>
        </div>
      </div>
      
      <div class="metric-group">
        <div class="metric-group-title">Secondary Effects</div>
        <div class="metric-item">
          <span class="metric-label">Seismic Magnitude</span>
          <span class="metric-value">${formatValue(results.seismic_magnitude, "", 1)}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Ejecta Volume</span>
          <span class="metric-value">${formatValue(results.ejecta_volume_km3, " km³")}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Atmospheric Disruption</span>
          <span class="metric-value">${formatValue(results.atmospheric_disruption_km, " km")}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Nuclear Winter Risk</span>
          <span class="metric-value ${results.nuclear_winter_risk > 0.5 ? 'critical' : 'safe'}">${(results.nuclear_winter_risk * 100).toFixed(0)}%</span>
        </div>
      </div>
      
      ${results.population_affected ? `
      <div class="metric-group">
        <div class="metric-group-title">Population Impact</div>
        <div class="metric-item">
          <span class="metric-label">Immediate Risk</span>
          <span class="metric-value critical">${formatValue(results.population_affected, "", 0)}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Evacuation Needed</span>
          <span class="metric-value severe">${formatValue(results.evacuation_radius_km, " km")}</span>
        </div>
      </div>
      ` : ''}
    `
  }

  getEnergyClass(energy) {
    if (energy > 10000) return "critical"
    if (energy > 1000) return "severe"
    if (energy > 100) return "major"
    if (energy > 10) return "moderate"
    return "minor"
  }

  generateDamageRings(results, lat, lng) {
    const rings = []
    
    // Critical zones
    if (results.vaporization_radius_km > 0) {
      rings.push({
        radius_km: results.vaporization_radius_km,
        class: "ring-critical",
        label: "Total Vaporization"
      })
    }
    
    // Severe damage
    if (results.severe_blast_radius_km > 0) {
      rings.push({
        radius_km: results.severe_blast_radius_km,
        class: "ring-severe",
        label: "Severe Blast Damage"
      })
    }
    
    // Thermal radiation
    if (results.thermal_radiation_radius_km > 0) {
      rings.push({
        radius_km: results.thermal_radiation_radius_km,
        class: "ring-thermal",
        label: "Third-degree Burns"
      })
    }
    
    // Moderate damage
    if (results.window_damage_radius_km > 0) {
      rings.push({
        radius_km: results.window_damage_radius_km,
        class: "ring-moderate",
        label: "Window Shattering"
      })
    }
    
    // Minor effects
    if (results.minor_damage_radius_km > 0) {
      rings.push({
        radius_km: results.minor_damage_radius_km,
        class: "ring-minor",
        label: "Minor Damage"
      })
    }
    
    // Seismic effects
    if (results.seismic_radius_km > 0) {
      rings.push({
        radius_km: results.seismic_radius_km,
        class: "ring-seismic",
        label: "Seismic Effects"
      })
    }
    
    // Ejecta fallout
    if (results.ejecta_radius_km > 0) {
      rings.push({
        radius_km: results.ejecta_radius_km,
        class: "ring-ejecta",
        label: "Ejecta Fallout"
      })
    }
    
    // Tsunami (for ocean impacts)
    if (results.tsunami_radius_km > 0) {
      rings.push({
        radius_km: results.tsunami_radius_km,
        class: "ring-tsunami",
        label: "Tsunami Wave"
      })
    }
    
    return rings
  }

  visualizeImpact(impactData) {
    // Clear previous visualization
    this.clearVisualization()
    
    // Store current impact data
    this.currentImpact = impactData
    
    // Draw trajectory
    if (impactData.trajectory) {
      this.drawTrajectory(impactData.trajectory)
    }
    
    // Draw damage rings
    this.drawDamageRings(impactData.rings, impactData.lat, impactData.lng)
    
    // Draw impact point
    this.drawImpactPoint(impactData.lat, impactData.lng)
    
    // Animate shockwaves
    if (!this.reduced) {
      this.animateShockwaves(impactData.lat, impactData.lng)
    }
    
    // Draw debris paths
    if (impactData.debris) {
      this.drawDebrisPaths(impactData.debris)
    }
    
    // Render all elements
    this.render()
  }

  drawTrajectory(points) {
    if (!points || points.length < 2) return
    
    const lineString = {
      type: "LineString",
      coordinates: points.map(p => [p.lng, p.lat])
    }
    
    const path = this.gTrajectory.append("path")
      .attr("class", "entry-trajectory")
      .attr("d", this.path(lineString))
    
    if (!this.reduced) {
      const length = path.node().getTotalLength()
      path
        .attr("stroke-dasharray", `${length} ${length}`)
        .attr("stroke-dashoffset", length)
        .transition()
        .duration(1500)
        .ease(d3.easeCubicOut)
        .attr("stroke-dashoffset", 0)
    }
  }

  drawDamageRings(rings, lat, lng) {
    rings.forEach((ring, index) => {
      const radiusDeg = (ring.radius_km / this.EARTH_KM) * (180 / Math.PI)
      const circle = d3.geoCircle()
        .center([lng, lat])
        .radius(radiusDeg)
        .precision(0.5)
      
      const ringPath = this.gRings.append("path")
        .attr("class", ring.class)
        .attr("d", this.path(circle()))
        .attr("data-label", ring.label)
      
      if (!this.reduced) {
        const length = ringPath.node().getTotalLength()
        ringPath
          .attr("opacity", 0)
          .attr("stroke-dasharray", `${length} ${length}`)
          .attr("stroke-dashoffset", length)
          .transition()
          .delay(index * 100)
          .duration(1000)
          .ease(d3.easeCubicOut)
          .attr("stroke-dashoffset", 0)
          .attr("opacity", 1)
      }
    })
  }

  drawImpactPoint(lat, lng) {
    const point = this.projection([lng, lat])
    if (!point) return
    
    const impact = this.gImpactPoint.append("circle")
      .attr("class", "impact-point")
      .attr("cx", point[0])
      .attr("cy", point[1])
    
    if (!this.reduced) {
      impact
        .attr("r", 0)
        .transition()
        .duration(500)
        .ease(d3.easeBackOut)
        .attr("r", 6)
    } else {
      impact.attr("r", 6)
    }
  }

  animateShockwaves(lat, lng) {
    const point = this.projection([lng, lat])
    if (!point) return
    
    const createShockwave = () => {
      this.gShockwaves.append("circle")
        .attr("class", "shockwave")
        .attr("cx", point[0])
        .attr("cy", point[1])
        .attr("r", 0)
        .attr("opacity", 1)
        .transition()
        .duration(2000)
        .ease(d3.easeQuadOut)
        .attr("r", 150)
        .attr("opacity", 0)
        .remove()
    }
    
    createShockwave()
    this.shockwaveInterval = setInterval(createShockwave, 2000)
  }

  drawDebrisPaths(debrisPaths) {
    if (!debrisPaths || debrisPaths.length === 0) return
    
    debrisPaths.forEach((path, index) => {
      const lineString = {
        type: "LineString",
        coordinates: path.map(p => [p.lng, p.lat])
      }
      
      this.gDebris.append("path")
        .attr("class", "debris-path")
        .attr("d", this.path(lineString))
        .style("animation-delay", `${index * 0.1}s`)
    })
  }

  centerOnImpact(lng, lat, altitude) {
    const targetRotation = [-lng, -lat, 0]
    const currentRotation = this.projection.rotate()
    
    // Calculate optimal zoom based on impact energy
    const optimalScale = altitude ? this.baseScale * 2 : this.baseScale * 1.5
    
    // Smooth transition
    const interpolateRotation = d3.interpolateArray(currentRotation, targetRotation)
    const interpolateScale = d3.interpolateNumber(this.projection.scale(), optimalScale)
    
    this.svg.transition()
      .duration(this.reduced ? 0 : 1500)
      .tween("center", () => {
        return (t) => {
          this.projection.rotate(interpolateRotation(t))
          this.projection.scale(interpolateScale(t))
          this.render()
        }
      })
  }

  initializeTimeline(timeline) {
    if (!timeline || timeline.length === 0) return
    
    this.timeline = timeline
    this.timelineTarget.style.display = "block"
    
    // Setup timeline controls
    const slider = this.timelineTarget.querySelector(".timeline-slider")
    const handle = this.timelineTarget.querySelector(".timeline-handle")
    const progress = this.timelineTarget.querySelector(".timeline-progress")
    
    // Timeline interaction
    let isDragging = false
    
    handle.addEventListener("mousedown", () => isDragging = true)
    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return
      const rect = slider.getBoundingClientRect()
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      this.seekTimeline(percent)
    })
    document.addEventListener("mouseup", () => isDragging = false)
    
    slider.addEventListener("click", (e) => {
      if (e.target === handle) return
      const rect = slider.getBoundingClientRect()
      const percent = (e.clientX - rect.left) / rect.width
      this.seekTimeline(percent)
    })
  }

  seekTimeline(percent) {
    const frameIndex = Math.floor(percent * (this.timeline.length - 1))
    const frame = this.timeline[frameIndex]
    
    // Update timeline UI
    const handle = this.timelineTarget.querySelector(".timeline-handle")
    const progress = this.timelineTarget.querySelector(".timeline-progress")
    handle.style.left = `${percent * 100}%`
    progress.style.width = `${percent * 100}%`
    
    // Update time display
    const timeDisplay = this.timelineTarget.querySelectorAll(".timeline-time")[0]
    const secondsToImpact = frame.time_to_impact_s
    const minutes = Math.floor(Math.abs(secondsToImpact) / 60)
    const seconds = Math.abs(secondsToImpact) % 60
    timeDisplay.textContent = secondsToImpact < 0 ? `T-${minutes}:${seconds.toString().padStart(2, '0')}` : `T+${minutes}:${seconds.toString().padStart(2, '0')}`
    
    // Visualize frame
    this.visualizeTimelineFrame(frame)
  }

  visualizeTimelineFrame(frame) {
    // Update asteroid position
    if (frame.position) {
      const point = this.projection([frame.position.lng, frame.position.lat])
      if (point) {
        let asteroid = this.gImpactPoint.select(".timeline-asteroid")
        if (asteroid.empty()) {
          asteroid = this.gImpactPoint.append("circle").attr("class", "timeline-asteroid")
        }
        asteroid
          .attr("cx", point[0])
          .attr("cy", point[1])
          .attr("r", 3)
          .attr("fill", "#ff6b35")
      }
    }
    
    // Update effects based on frame data
    if (frame.effects) {
      // Update shockwave radius, thermal effects, etc.
      this.updateFrameEffects(frame.effects)
    }
  }

  updateFrameEffects(effects) {
    // Update damage rings dynamically
    if (effects.shockwave_radius_km) {
      const radiusDeg = (effects.shockwave_radius_km / this.EARTH_KM) * (180 / Math.PI)
      const circle = d3.geoCircle()
        .center([this.currentImpact.lng, this.currentImpact.lat])
        .radius(radiusDeg)
        .precision(0.5)
      
      let shockwave = this.gShockwaves.select(".timeline-shockwave")
      if (shockwave.empty()) {
        shockwave = this.gShockwaves.append("path").attr("class", "timeline-shockwave")
      }
      shockwave.attr("d", this.path(circle()))
    }
  }

  togglePlayback() {
    this.isPlaying = !this.isPlaying
    const playBtn = this.timelineTarget.querySelector(".play-btn")
    playBtn.textContent = this.isPlaying ? "⏸" : "▶"
    
    if (this.isPlaying) {
      this.playTimeline()
    }
  }

  playTimeline() {
    if (!this.isPlaying || !this.timeline) return
    
    const fps = 30
    const step = () => {
      if (!this.isPlaying) return
      
      this.currentTime += 1 / fps
      const progress = this.currentTime / (this.timeline.length / fps)
      
      if (progress >= 1) {
        this.currentTime = 0
        this.isPlaying = false
        this.timelineTarget.querySelector(".play-btn").textContent = "▶"
        return
      }
      
      this.seekTimeline(progress)
      requestAnimationFrame(step)
    }
    
    requestAnimationFrame(step)
  }

  showLocationTooltip(event, feature) {
    const name = feature.properties?.name || feature.properties?.NAME || "Unknown"
    const population = feature.properties?.POP_EST
    
    this.tooltipTarget.querySelector(".tooltip-title").textContent = name
    this.tooltipTarget.querySelector(".tooltip-content").innerHTML = population ? 
      `Population: ${(population/1000000).toFixed(1)}M` : ""
    
    this.tooltipTarget.style.left = (event.clientX + 15) + "px"
    this.tooltipTarget.style.top = (event.clientY + 15) + "px"
    this.tooltipTarget.style.opacity = "1"
  }

  hideTooltip() {
    this.tooltipTarget.style.opacity = "0"
  }

  selectCountry(event, feature) {
    const centroid = d3.geoCentroid(feature)
    this.formTarget.querySelector("#lat").value = centroid[1].toFixed(4)
    this.formTarget.querySelector("#lng").value = centroid[0].toFixed(4)
    
    // Highlight selected country
    this.gLand.selectAll("path.land")
      .classed("selected", false)
    d3.select(event.target).classed("selected", true)
  }

  resetView() {
    // Reset zoom
    this.svg.transition()
      .duration(this.reduced ? 0 : 750)
      .call(this.zoom.transform, d3.zoomIdentity)
    
    // Reset rotation
    this.projection.transition()
      .duration(this.reduced ? 0 : 750)
      .rotate([-84, -10, 0])
    
    // Clear visualization
    this.clearVisualization()
    
    // Reset form
    this.formTarget.reset()
    
    // Update display
    this.render()
  }

  clearVisualization() {
    // Stop animations
    if (this.shockwaveInterval) {
      clearInterval(this.shockwaveInterval)
      this.shockwaveInterval = null
    }
    
    // Clear layers
    this.gTrajectory.selectAll("*").remove()
    this.gDebris.selectAll("*").remove()
    this.gRings.selectAll("*").remove()
    this.gShockwaves.selectAll("*").remove()
    this.gImpactPoint.selectAll("*").remove()
    this.gAnnotations.selectAll("*").remove()
    
    // Hide timeline
    if (this.timelineTarget) {
      this.timelineTarget.style.display = "none"
    }
    
    this.currentImpact = null
    this.isPlaying = false
    this.currentTime = 0
  }

  render() {
    // Update all geographic elements
    this.gSphere.selectAll("path.sphere").attr("d", this.path)
    this.gGraticule.selectAll("path.graticule").attr("d", this.path)
    this.gLand.selectAll("path.land").attr("d", this.path)
    this.gBorders.selectAll("path.boundary").attr("d", this.path)
    
    // Update impact visualization if present
    if (this.currentImpact) {
      // Re-render trajectory
      this.gTrajectory.selectAll("path").attr("d", (d) => this.path(d))
      
      // Re-render rings
      this.gRings.selectAll("path").each((d, i, nodes) => {
        const ring = d3.select(nodes[i])
        const radiusDeg = parseFloat(ring.attr("data-radius-deg"))
        if (radiusDeg) {
          const circle = d3.geoCircle()
            .center([this.currentImpact.lng, this.currentImpact.lat])
            .radius(radiusDeg)
            .precision(0.5)
          ring.attr("d", this.path(circle()))
        }
      })
      
      // Re-render impact point
      const point = this.projection([this.currentImpact.lng, this.currentImpact.lat])
      if (point) {
        this.gImpactPoint.select(".impact-point")
          .attr("cx", point[0])
          .attr("cy", point[1])
      }
      
      // Re-render debris paths
      this.gDebris.selectAll("path").attr("d", (d) => this.path(d))
    }
  }

  setupRealtimeUpdates() {
    // Setup WebSocket for real-time NEO updates
    if (typeof ActionCable !== 'undefined') {
      this.subscription = ActionCable.createConsumer().subscriptions.create(
        { channel: "NeoUpdatesChannel" },
        {
          received: (data) => {
            this.handleRealtimeUpdate(data)
          }
        }
      )
    }
  }

  handleRealtimeUpdate(data) {
    if (data.type === "neo_update") {
      this.showNotification(`New NEO detected: ${data.neo.name}`, "info")
      this.loadNEOData() // Refresh NEO list
    } else if (data.type === "impact_alert") {
      this.showNotification(`Impact Alert: ${data.message}`, "warning")
    }
  }

  showLoadingState() {
    this.metricsTarget.style.opacity = "0.5"
    this.metricsTarget.style.pointerEvents = "none"
    
    // Add loading spinner to globe
    const centerX = this.width / 2
    const centerY = this.height / 2
    
    this.loadingGroup = this.svg.append("g")
      .attr("class", "loading-indicator")
      .attr("transform", `translate(${centerX}, ${centerY})`)
    
    this.loadingGroup.append("circle")
      .attr("r", 30)
      .attr("fill", "none")
      .attr("stroke", "var(--lav)")
      .attr("stroke-width", 3)
      .attr("stroke-dasharray", "10 5")
      .style("animation", "rotate 2s linear infinite")
    
    this.loadingGroup.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 5)
      .style("fill", "var(--lav)")
      .style("font-size", "14px")
      .text("Calculating...")
  }

  hideLoadingState() {
    this.metricsTarget.style.opacity = "1"
    this.metricsTarget.style.pointerEvents = "auto"
    
    if (this.loadingGroup) {
      this.loadingGroup.remove()
      this.loadingGroup = null
    }
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div")
    notification.className = `notification notification-${type}`
    notification.textContent = message
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: ${type === 'error' ? 'var(--critical)' : type === 'warning' ? 'var(--moderate)' : 'var(--lav)'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 1000;
      animation: slideInRight 0.3s ease-out;
      max-width: 300px;
    `
    
    document.body.appendChild(notification)
    
    setTimeout(() => {
      notification.style.animation = "slideOutRight 0.3s ease-out"
      setTimeout(() => notification.remove(), 300)
    }, 5000)
  }

  debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  disconnect() {
    // Clean up
    if (this._onResize) {
      window.removeEventListener("resize", this._onResize)
    }
    
    if (this.shockwaveInterval) {
      clearInterval(this.shockwaveInterval)
    }
    
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
    }
    
    this.svg?.remove()
  }
}

// Add required animations to document
if (!document.querySelector("#impact-animations")) {
  const style = document.createElement("style")
  style.id = "impact-animations"
  style.textContent = `
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    
    .land.selected {
      fill: #4a7dc0 !important;
      stroke: var(--lav);
      stroke-width: 2;
    }
  `
  document.head.appendChild(style)
}