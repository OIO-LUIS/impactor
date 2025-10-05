// ============================================================================
// NEO SELECTOR CONTROLLER - Individual NEO Selection
// ============================================================================
//
// PURPOSE:
// Handles selection of individual NEOs from the browser and automatically
// populates the impact simulation form with the NEO's physical parameters.
//
// FLOW:
// 1. User clicks on NEO in browser
// 2. Fetch detailed NEO data from /neos/:id
// 3. Populate form fields with estimated impact parameters
// 4. Close NEO browser modal
//
// PARAMETER MAPPING:
// - diameter_m: Average of min/max diameter estimates
// - density_kg_m3: Estimated from albedo (composition type)
// - velocity_kms: From close approach data
// - strength_mpa: Estimated from composition
//
// ============================================================================

import { Controller } from "@hotwired/stimulus"
import { get } from "@rails/request.js"

export default class extends Controller {
  static targets = ["neoItem", "id", "name", "date", "distance", "diameter", "density", "velocity", "strength"]


  connect() {
    console.log("🔗 NEO Selector: Connected to element", this.element.dataset.neoId)
    console.log("🔗 NEO Selector: Element:", this.element)
    console.log("🔗 NEO Selector: All datasets:", this.element.dataset)
  }

  /**
   * Handle NEO selection
   * Fetches detailed data and populates form
   */
  async select(event) {
    console.log("🎯 NEO Selector: NEO selected")
    event.preventDefault()
    event.stopPropagation()

    const neoId = this.element.dataset.neoId

    if (!neoId) {
      console.error("❌ NEO Selector: No NEO ID found on element:", this.element)
      return
    }

    console.log(`🎯 NEO Selector: Selected NEO ${neoId}`)

    try {
      // Fetch detailed NEO data
      console.log(`📡 Fetching NEO data from /neos/${neoId}...`)

      const response = await get(`/neos/${neoId}`, {
        responseKind: "json"
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch NEO data`)
      }

      const neo = await response.json

      console.log("📊 NEO Selector: NEO data received:", neo)

      // Populate form fields
      this.populateForm(neo)

      // Close modal
      this.closeModal()

      console.log("✅ NEO Selector: Form populated successfully")
    } catch (error) {
      console.error("❌ NEO Selector error:", error)
      console.error("Error details:", {
        message: error.message,
        stack: error.stack
      })
      alert("Failed to load NEO data: " + error.message)
    }
  }

  /**
   * Populate form with NEO parameters
   * Maps NEO data to impact simulation inputs
   */
  populateForm(neo) {
    console.log("📝 NEO Selector: Populating form with:", neo)

    // Expand the inputs accordion section so the form is fully visible
    this.expandInputsSection()

    // Find form inputs using multiple strategies for robustness
    const diameterInput = document.getElementById("diameter_m") ||
                         document.querySelector('[name="diameter_m"]') ||
                         document.querySelector('[data-cesium-impact-target="diameterInput"]')

    const densityInput = document.getElementById("density_kg_m3") ||
                        document.querySelector('[name="density_kg_m3"]') ||
                        document.querySelector('[data-cesium-impact-target="densityInput"]')

    const velocityInput = document.getElementById("velocity_kms") ||
                         document.querySelector('[name="velocity_kms"]') ||
                         document.querySelector('[data-cesium-impact-target="velocityInput"]')

    const strengthInput = document.getElementById("strength_mpa") ||
                         document.querySelector('[name="strength_mpa"]') ||
                         document.querySelector('[data-cesium-impact-target="strengthInput"]')

    console.log("🔍 Found inputs:", {
      diameter: !!diameterInput,
      density: !!densityInput,
      velocity: !!velocityInput,
      strength: !!strengthInput
    })

    // Populate values with validation
    if (diameterInput && neo.diameter_m) {
      diameterInput.value = neo.diameter_m
      // Trigger change event for any listeners
      diameterInput.dispatchEvent(new Event('change', { bubbles: true }))
      console.log(`  ✅ Diameter: ${neo.diameter_m} m`)
    } else {
      console.warn("  ⚠️  Could not set diameter:", { input: !!diameterInput, value: neo.diameter_m })
    }

    if (densityInput && neo.density_kg_m3) {
      densityInput.value = neo.density_kg_m3
      densityInput.dispatchEvent(new Event('change', { bubbles: true }))
      console.log(`  ✅ Density: ${neo.density_kg_m3} kg/m³`)
    } else {
      console.warn("  ⚠️  Could not set density:", { input: !!densityInput, value: neo.density_kg_m3 })
    }

    if (velocityInput && neo.velocity_kms) {
      velocityInput.value = neo.velocity_kms
      velocityInput.dispatchEvent(new Event('change', { bubbles: true }))
      console.log(`  ✅ Velocity: ${neo.velocity_kms} km/s`)
    } else {
      console.warn("  ⚠️  Could not set velocity:", { input: !!velocityInput, value: neo.velocity_kms })
    }

    if (strengthInput && neo.estimated_strength_mpa) {
      strengthInput.value = neo.estimated_strength_mpa
      strengthInput.dispatchEvent(new Event('change', { bubbles: true }))
      console.log(`  ✅ Strength: ${neo.estimated_strength_mpa} MPa`)
    } else {
      console.warn("  ⚠️  Could not set strength:", { input: !!strengthInput, value: neo.estimated_strength_mpa })
    }

    // Update NEO info display
    this.updateNeoInfoDisplay(neo)

    // Show notification
    this.showNotification(neo.name)

    // IMPORTANT: Recalculate accordion height AFTER all content is added
    // Use setTimeout to ensure DOM has updated
    setTimeout(() => {
      this.recalculateAccordionHeight()
    }, 100)
  }

  /**
   * Recalculate the accordion height after content changes
   */
  recalculateAccordionHeight() {
    const accordionContent = document.querySelector('[data-key="inputs"].accordion-content')
    if (accordionContent && accordionContent.getAttribute('data-open') === 'true') {
      // Recalculate the scrollHeight now that all content is added
      accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px'
      console.log(`  📏 Recalculated accordion height: ${accordionContent.scrollHeight}px`)
    }
  }

  /**
   * Expand the inputs accordion section in the sidebar
   */
  expandInputsSection() {
    console.log("📂 Expanding inputs section...")

    // Find the inputs accordion button and content
    const accordionButton = document.querySelector('[data-key="inputs"].accordion-header')
    const accordionContent = document.querySelector('[data-key="inputs"].accordion-content')

    if (accordionButton && accordionContent) {
      // Set the data attributes to open state
      accordionContent.setAttribute('data-open', 'true')
      accordionButton.setAttribute('aria-expanded', 'true')

      // Add the open class (if your CSS uses it)
      accordionContent.classList.add('open')

      // Set max-height for smooth animation
      accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px'

      // Rotate chevron
      const chevron = accordionButton.querySelector('[data-key="inputs"].accordion-chev')
      if (chevron) {
        chevron.style.transform = 'rotate(180deg)'
      }

      console.log("  ✅ Inputs section expanded")
    } else {
      console.warn("  ⚠️ Could not find accordion elements")
    }
  }

  /**
   * Update NEO information display card
   */
  updateNeoInfoDisplay(neo) {
    const infoDisplay = document.getElementById('neo-info-display')
    const nameDisplay = document.getElementById('neo-name-display')
    const idDisplay = document.getElementById('neo-id-display')
    const dateDisplay = document.getElementById('neo-date-display')
    const distanceDisplay = document.getElementById('neo-distance-display')

    if (infoDisplay) {
      infoDisplay.style.display = 'block'
      console.log("📊 NEO Info Display: Showing")
    }

    if (nameDisplay) {
      nameDisplay.textContent = neo.name || '—'
    }

    if (idDisplay) {
      idDisplay.textContent = neo.neo_reference_id || '—'
    }

    if (dateDisplay && neo.close_approach_date) {
      const date = new Date(neo.close_approach_date)
      dateDisplay.textContent = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    if (distanceDisplay && neo.miss_distance_km) {
      // Format with thousands separator
      const distanceFormatted = new Intl.NumberFormat('en-US').format(Math.round(neo.miss_distance_km))
      distanceDisplay.textContent = `${distanceFormatted} km`
    }

    console.log("✅ NEO Info Display updated:", {
      name: neo.name,
      approach_date: neo.close_approach_date,
      miss_distance: neo.miss_distance_km
    })

    // Update orbital elements if available
    this.updateOrbitalElementsDisplay(neo)

    // Hide/disable calculated fields when using orbital mode
    if (neo.orbital_elements) {
      this.switchToOrbitalMode()
    } else {
      this.switchToManualMode()
    }
  }

  /**
   * Switch to orbital mode - show view toggle and default to orbital view
   */
  switchToOrbitalMode() {
    console.log("🛰️  Switching to ORBITAL MODE with view toggle")

    // Show the view mode toggle (it's already in the template, just hidden)
    const viewToggle = document.getElementById('view-mode-toggle')
    if (viewToggle) {
      viewToggle.style.display = 'block'
    }

    // Set up global functions for the onclick handlers
    this.setupGlobalViewFunctions()

    // Default to orbital view (hide impact fields)
    this.setOrbitalViewUI()

    // Recalculate accordion height after showing view toggle
    setTimeout(() => {
      this.recalculateAccordionHeight()
    }, 50)
  }

  /**
   * Set up global functions that the view toggle buttons can call
   */
  setupGlobalViewFunctions() {
    // Store reference to this controller instance
    const self = this

    // Create global functions for the onclick handlers
    window.switchToOrbitalView = function() {
      console.log("🛰️ Global: Switching to orbital view")
      self.setOrbitalViewUI()
      self.submitFormForOrbitalView()
    }

    window.switchToImpactView = function() {
      console.log("💥 Global: Switching to impact view")
      self.setImpactViewUI()
      self.submitFormForImpactView()
    }
  }

  /**
   * Set UI to orbital view state (hide impact fields)
   */
  setOrbitalViewUI() {
    // Hide impact fields
    const fieldsToHide = ['lat', 'lng', 'impact_angle_deg', 'azimuth_deg', 'velocity_kms']
    fieldsToHide.forEach(fieldId => {
      const input = document.getElementById(fieldId)
      if (input) {
        const formGroup = input.closest('.form-group')
        if (formGroup) formGroup.style.display = 'none'
      }
    })

    // Restore orbital data
    const orbitalInput = document.getElementById('orbital-data')
    if (orbitalInput && this.storedOrbitalData && !orbitalInput.value) {
      orbitalInput.value = this.storedOrbitalData
    }

    // Update button states
    const orbitalBtn = document.getElementById('orbital-view-btn')
    const impactBtn = document.getElementById('impact-view-btn')
    if (orbitalBtn) {
      orbitalBtn.className = 'btn btn-primary'
      orbitalBtn.style.fontSize = '0.85rem'
    }
    if (impactBtn) {
      impactBtn.className = 'btn btn-secondary'
      impactBtn.style.fontSize = '0.85rem'
    }

    const description = document.getElementById('view-mode-description')
    if (description) description.textContent = 'View NEO orbit in heliocentric solar system'

    // Recalculate height after hiding fields
    setTimeout(() => this.recalculateAccordionHeight(), 50)
  }

  /**
   * Set UI to impact view state (show impact fields)
   */
  setImpactViewUI() {
    // Show impact fields
    const fieldsToShow = ['lat', 'lng', 'impact_angle_deg', 'azimuth_deg', 'velocity_kms']
    fieldsToShow.forEach(fieldId => {
      const input = document.getElementById(fieldId)
      if (input) {
        const formGroup = input.closest('.form-group')
        if (formGroup) formGroup.style.display = ''
      }
    })

    // Store and clear orbital data
    const orbitalInput = document.getElementById('orbital-data')
    if (orbitalInput) {
      if (!this.storedOrbitalData && orbitalInput.value) {
        this.storedOrbitalData = orbitalInput.value
      }
      orbitalInput.value = ''
    }

    // Update button states
    const orbitalBtn = document.getElementById('orbital-view-btn')
    const impactBtn = document.getElementById('impact-view-btn')
    if (orbitalBtn) {
      orbitalBtn.className = 'btn btn-secondary'
      orbitalBtn.style.fontSize = '0.85rem'
    }
    if (impactBtn) {
      impactBtn.className = 'btn btn-primary'
      impactBtn.style.fontSize = '0.85rem'
    }

    const description = document.getElementById('view-mode-description')
    if (description) description.textContent = 'Simulate impact with custom coordinates and parameters'

    // Recalculate height after showing fields
    setTimeout(() => this.recalculateAccordionHeight(), 50)
  }

  /**
   * Submit form for orbital (heliocentric) simulation
   */
  submitFormForOrbitalView() {
    const form = document.querySelector('[data-cesium-impact-target="form"]')
    if (form) {
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
      form.dispatchEvent(submitEvent)
      console.log("✅ Orbital simulation triggered")
    }
  }

  /**
   * Submit form for impact (geocentric) simulation
   */
  submitFormForImpactView() {
    const form = document.querySelector('[data-cesium-impact-target="form"]')
    if (form) {
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
      form.dispatchEvent(submitEvent)
      console.log("✅ Impact simulation triggered")
    }
  }


  /**
   * Switch to manual mode - show all input fields
   */
  switchToManualMode() {
    console.log("📍 Switching to MANUAL MODE - showing all fields")

    const fieldsToShow = [
      'lat', 'lng', 'impact_angle_deg', 'azimuth_deg', 'velocity_kms'
    ]

    fieldsToShow.forEach(fieldId => {
      const input = document.getElementById(fieldId)
      if (input) {
        const formGroup = input.closest('.form-group')
        if (formGroup) {
          formGroup.style.display = ''
        }
      }
    })

    // Hide view mode toggle (only needed for orbital mode)
    const viewToggle = document.getElementById('view-mode-toggle')
    if (viewToggle) {
      viewToggle.style.display = 'none'
      console.log("  ✅ Hidden view mode toggle")
    }
  }

  /**
   * Update Keplerian orbital elements display
   */
  updateOrbitalElementsDisplay(neo) {
    const orbitalDisplay = document.getElementById('orbital-elements-display')
    const orbitalInput = document.getElementById('orbital-data')

    if (!neo.orbital_elements) {
      console.log("⚠️  No orbital elements available for this NEO")
      if (orbitalDisplay) {
        orbitalDisplay.style.display = 'none'
      }
      return
    }

    const elements = neo.orbital_elements

    if (orbitalDisplay) {
      orbitalDisplay.style.display = 'block'
      console.log("🛰️  Orbital Elements Display: Showing")
    }

    // Update display fields
    const eccentricityEl = document.getElementById('orbital-eccentricity')
    const semiMajorAxisEl = document.getElementById('orbital-semi-major-axis')
    const inclinationEl = document.getElementById('orbital-inclination')
    const ascendingNodeEl = document.getElementById('orbital-ascending-node')
    const argPerihelionEl = document.getElementById('orbital-arg-perihelion')
    const meanAnomalyEl = document.getElementById('orbital-mean-anomaly')

    if (eccentricityEl) eccentricityEl.textContent = elements.eccentricity?.toFixed(4) || '—'
    if (semiMajorAxisEl) semiMajorAxisEl.textContent = elements.semi_major_axis_au ? `${elements.semi_major_axis_au.toFixed(3)} AU` : '—'
    if (inclinationEl) inclinationEl.textContent = elements.inclination_deg ? `${elements.inclination_deg.toFixed(2)}°` : '—'
    if (ascendingNodeEl) ascendingNodeEl.textContent = elements.longitude_ascending_node_deg ? `${elements.longitude_ascending_node_deg.toFixed(2)}°` : '—'
    if (argPerihelionEl) argPerihelionEl.textContent = elements.argument_perihelion_deg ? `${elements.argument_perihelion_deg.toFixed(2)}°` : '—'
    if (meanAnomalyEl) meanAnomalyEl.textContent = elements.mean_anomaly_deg ? `${elements.mean_anomaly_deg.toFixed(2)}°` : '—'

    // Store FULL NEO data (orbital + close approach) for visualization
    // This includes both Keplerian elements AND Earth-relative approach data
    if (orbitalInput) {
      const neoData = {
        orbital_elements: elements,
        // Close approach data (Earth-relative - already geocentric!)
        miss_distance_km: neo.miss_distance_km,
        velocity_kms: neo.velocity_kms,
        close_approach_date: neo.close_approach_date,
        // NEO identification
        name: neo.name,
        neo_reference_id: neo.neo_reference_id
      }

      orbitalInput.value = JSON.stringify(neoData)
      orbitalInput.dispatchEvent(new Event('change', { bubbles: true }))

      console.log("💾 Stored NEO data for visualization:", {
        orbital_elements: true,
        miss_distance_km: neo.miss_distance_km,
        velocity_kms: neo.velocity_kms
      })
    }

    console.log("✅ Orbital Elements Display updated:", {
      eccentricity: elements.eccentricity,
      semi_major_axis: elements.semi_major_axis_au,
      inclination: elements.inclination_deg
    })
  }

  /**
   * Close NEO browser modal
   */
  closeModal() {
    const modal = document.querySelector("[data-neo-browser-target='modal']")
    if (modal) {
      console.log("🚪 NEO Selector: Closing modal")
      modal.style.display = "none"
    } else {
      console.warn("⚠️  NEO Selector: Could not find modal to close")
    }
  }

  /**
   * Show selection notification
   */
  showNotification(neoName) {
    console.log("📢 Showing notification for:", neoName)

    // Create temporary notification
    const notification = document.createElement("div")
    notification.className = "neo-selection-notification"
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, rgba(147,180,216,0.95) 0%, rgba(179,157,219,0.95) 100%);
        color: #171226;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        z-index: 1000;
        font-weight: 600;
        animation: slideInRight 0.3s ease-out;
      ">
        ✅ Loaded: ${neoName}
      </div>
    `

    document.body.appendChild(notification)

    // Remove after 3 seconds
    setTimeout(() => {
      notification.remove()
    }, 3000)
  }
}
