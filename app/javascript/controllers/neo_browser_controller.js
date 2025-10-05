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
  static targets = ["modal", "startDate", "endDate", "searchButton"]

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  connect() {
    console.log("🔍 NEO Browser: Connected")
    this.isLoading = false

    // Add keyboard shortcuts
    this.handleKeydown = (e) => {
      // Ctrl/Cmd + K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        this.openAndFocusSearch()
      }

      // ESC to close modal
      if (e.key === 'Escape' && this.modalTarget.style.display !== 'none') {
        e.preventDefault()
        this.close()
      }
    }

    document.addEventListener('keydown', this.handleKeydown)
  }

  disconnect() {
    // Clean up event listener
    if (this.handleKeydown) {
      document.removeEventListener('keydown', this.handleKeydown)
    }
  }

  /**
   * Open modal and focus on search
   */
  openAndFocusSearch() {
    this.modalTarget.style.display = "flex"
    setTimeout(() => {
      if (this.hasStartDateTarget) {
        this.startDateTarget.focus()
      }
    }, 100)
  }

  // ============================================================================
  // MODAL CONTROLS
  // ============================================================================

  /**
   * Toggle modal visibility
   */
  toggle(event) {
    console.log("🔍 NEO Browser: Toggling modal")
    event.preventDefault()
    const isHidden = this.modalTarget.style.display === "none"

    if (isHidden) {
      this.modalTarget.style.display = "flex"
      console.log("🔍 NEO Browser: Modal opened")
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
  // DATA LOADING
  // ============================================================================

  /**
   * Search NEOs by date range
   * Validates date range and fetches close approaches
   */
  async searchByDate(event) {
    event.preventDefault()

    // Prevent duplicate requests
    if (this.isLoading) return

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

    this.showLoadingState()

    try {
      const response = await get(`/neos/feed?start_date=${startDate}&end_date=${endDate}`, {
        responseKind: "turbo-stream"
      })

      if (response.ok) {
        console.log("✅ NEO Browser: Feed data loaded")
      } else {
        console.error("❌ NEO Browser: Failed to load feed data")
        this.showErrorInResults("Failed to load NEO data. Please try again.")
      }
    } catch (error) {
      console.error("❌ NEO Browser error:", error)
      this.showErrorInResults("An error occurred while searching NEOs.")
    } finally {
      this.hideLoadingState()
    }
  }

  // ============================================================================
  // LOADING STATE MANAGEMENT
  // ============================================================================

  /**
   * Show loading state in the results area
   */
  showLoadingState() {
    this.isLoading = true

    // Disable buttons during loading
    const buttons = this.element.querySelectorAll('button')
    buttons.forEach(btn => btn.disabled = true)

    // Random loading messages for variety
    const loadingMessages = [
      { main: "Searching for Near-Earth Objects...", sub: "Connecting to NASA database" },
      { main: "Scanning orbital trajectories...", sub: "Analyzing close approaches" },
      { main: "Retrieving asteroid data...", sub: "Processing NASA JPL records" },
      { main: "Calculating orbital parameters...", sub: "Determining closest approaches" },
      { main: "Accessing NEO database...", sub: "Fetching latest observations" }
    ]

    const randomMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)]

    // Show loading spinner in results
    const resultsFrame = document.getElementById('neo_results')
    if (resultsFrame) {
      resultsFrame.innerHTML = `
        <div class="neo-loading-state">
          <div class="neo-spinner-container">
            <div class="neo-orbit-spinner">
              <div class="orbit orbit-1"></div>
              <div class="orbit orbit-2"></div>
              <div class="orbit orbit-3"></div>
              <div class="center-dot"></div>
            </div>
          </div>
          <p class="loading-message">${randomMessage.main}</p>
          <p class="loading-submessage">${randomMessage.sub}</p>
        </div>
      `
    }
  }

  /**
   * Hide loading state
   */
  hideLoadingState() {
    this.isLoading = false

    // Re-enable buttons
    const buttons = this.element.querySelectorAll('button')
    buttons.forEach(btn => btn.disabled = false)
  }

  /**
   * Show error message in results area
   */
  showErrorInResults(message) {
    const resultsFrame = document.getElementById('neo_results')
    if (resultsFrame) {
      resultsFrame.innerHTML = `
        <div class="neo-error-state">
          <span class="error-icon">⚠️</span>
          <p class="error-message">${message}</p>
          <button class="retry-btn" onclick="location.reload()">Retry</button>
        </div>
      `
    }
  }
}
