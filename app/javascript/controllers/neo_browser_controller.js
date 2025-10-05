// ============================================================================
// NEO BROWSER CONTROLLER - NASA Near-Earth Object Browser
// ============================================================================
//
// PURPOSE:
// Manages the NEO browser modal interface, allowing users to search and
// browse NASA's Near-Earth Object database using Turbo Frames.
//
// FEATURES:
// - Toggle modal visibility
// - Switch between "Browse All" and "By Date" modes
// - Fetch NEOs from NASA NeoWs API via Turbo Frames
// - Seamless updates without page reloads
//
// TURBO FRAME INTEGRATION:
// - Uses Turbo Frames for dynamic content loading
// - Targets "neo_results" frame for all NEO list updates
// - Automatic handling of browse/feed endpoint responses
//
// ============================================================================

import { Controller } from "@hotwired/stimulus"
import { get } from "@rails/request.js"

export default class extends Controller {
  static targets = ["modal", "browseControls", "feedControls", "startDate", "endDate"]

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  connect() {
    console.log("🔍 NEO Browser: Connected")
    this.currentMode = "browse"
  }

  // ============================================================================
  // MODAL CONTROLS
  // ============================================================================

  /**
   * Toggle modal visibility
   * Opens modal and automatically loads browse data on first open
   */
  toggle(event) {
    console.log("🔍 NEO Browser: Toggling modal")
    event.preventDefault()
    const isHidden = this.modalTarget.style.display === "none"

    if (isHidden) {
      this.modalTarget.style.display = "flex"
      console.log("🔍 NEO Browser: Modal opened")

      // Auto-load browse data on first open
      if (this.currentMode === "browse") {
        this.loadBrowse()
      }
    } else {
      this.close()
    }
  }

  /**
   * Close modal
   */
  close(event) {
    if (event) event.preventDefault()
    this.modalTarget.style.display = "none"
    console.log("🔍 NEO Browser: Modal closed")
  }

  // ============================================================================
  // TAB SWITCHING
  // ============================================================================

  /**
   * Switch to "Browse All" mode
   * Shows browse controls and loads all NEOs
   */
  switchToBrowse(event) {
    event.preventDefault()
    this.currentMode = "browse"

    // Update tab button states
    event.currentTarget.classList.add("active")
    event.currentTarget.nextElementSibling?.classList.remove("active")

    // Show/hide controls
    this.browseControlsTarget.style.display = "block"
    this.feedControlsTarget.style.display = "none"

    console.log("🔍 NEO Browser: Switched to Browse mode")

    // Load browse data
    this.loadBrowse()
  }

  /**
   * Switch to "By Date" mode
   * Shows date range controls
   */
  switchToFeed(event) {
    event.preventDefault()
    this.currentMode = "feed"

    // Update tab button states
    event.currentTarget.classList.add("active")
    event.currentTarget.previousElementSibling?.classList.remove("active")

    // Show/hide controls
    this.browseControlsTarget.style.display = "none"
    this.feedControlsTarget.style.display = "block"

    console.log("🔍 NEO Browser: Switched to Feed mode")
  }

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  /**
   * Load browse data (all NEOs, paginated)
   * Uses Turbo Frames to update results without page reload
   */
  async loadBrowse(page = 0) {
    console.log(`🔍 NEO Browser: Loading browse data (page ${page})...`)

    try {
      const response = await get(`/neos/browse?page=${page}`, {
        responseKind: "turbo-stream"
      })

      if (response.ok) {
        console.log("✅ NEO Browser: Browse data loaded")
      } else {
        console.error("❌ NEO Browser: Failed to load browse data")
      }
    } catch (error) {
      console.error("❌ NEO Browser error:", error)
    }
  }

  /**
   * Search NEOs by date range
   * Validates date range and fetches close approaches
   */
  async searchByDate(event) {
    event.preventDefault()

    const startDate = this.startDateTarget.value
    const endDate = this.endDateTarget.value

    console.log(`🔍 NEO Browser: Searching by date (${startDate} to ${endDate})...`)

    // Validate date range (max 7 days)
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24))

    if (diffDays > 7) {
      alert("Date range cannot exceed 7 days")
      return
    }

    if (end < start) {
      alert("End date must be after start date")
      return
    }

    try {
      const response = await get(`/neos/feed?start_date=${startDate}&end_date=${endDate}`, {
        responseKind: "turbo-stream"
      })

      if (response.ok) {
        console.log("✅ NEO Browser: Feed data loaded")
      } else {
        console.error("❌ NEO Browser: Failed to load feed data")
      }
    } catch (error) {
      console.error("❌ NEO Browser error:", error)
    }
  }
}
