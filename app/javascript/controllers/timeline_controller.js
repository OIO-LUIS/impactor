// ============================================================================
// TIMELINE CONTROLLER - Impact simulation timeline management
// ============================================================================
//
// PURPOSE:
// Manages timeline controls for both orbital view (NEO approach) and
// impact view (entry sequence). Handles playback controls, speed adjustment,
// and timeline UI updates.
//
// RESPONSIBILITIES:
// - Create and manage orbital timeline UI (±30 days from encounter)
// - Handle playback controls (play/pause, speed adjustment)
// - Update timeline display with current time and progress
// - Coordinate with orbital positioning functions
// - Update impact timeline progress bar
//
// USAGE:
// const controller = new TimelineController(timelineTarget, hasTimelineTarget)
// controller.setupOrbitalTimeline(encounterTime, positionEarthAtTime, positionNeoAtTime)
// controller.toggleOrbitalPlayback()
// controller.updateTimeline(progress)
//
// ============================================================================

export class TimelineController {
  /**
   * Initialize the timeline controller
   *
   * @param {HTMLElement} timelineTarget - DOM element to append timeline UI
   * @param {boolean} hasTimelineTarget - Whether timeline target exists
   */
  constructor(timelineTarget, hasTimelineTarget) {
    this.timelineTarget = timelineTarget
    this.hasTimelineTarget = hasTimelineTarget

    // Timeline state
    this.orbitalTimeline = null

    // Orbital positioning callbacks (set in setupOrbitalTimeline)
    this.positionEarthAtTime = null
    this.positionNeoAtTime = null

    // DOM element references
    this.timelineProgressTarget = null
    this.timelineHandleTarget = null
    this.timeStartTarget = null
    this.timeEndTarget = null
  }

  /**
   * Set up orbital timeline for NEO encounter visualization
   * Creates timeline spanning ±30 days from encounter date
   *
   * @param {Date} encounterTime - Date/time of close approach
   * @param {Function} positionEarthAtTime - Callback to position Earth at given time
   * @param {Function} positionNeoAtTime - Callback to position NEO at given time
   */
  setupOrbitalTimeline(encounterTime, positionEarthAtTime, positionNeoAtTime) {
    console.log("⏱️ Setting up orbital timeline...")

    // Store positioning callbacks
    this.positionEarthAtTime = positionEarthAtTime
    this.positionNeoAtTime = positionNeoAtTime

    // Store timeline data
    this.orbitalTimeline = {
      encounterTime: encounterTime || new Date(),
      currentTime: encounterTime || new Date(),
      startTime: null,  // Will be set to encounterTime - 30 days
      endTime: null,     // Will be set to encounterTime + 30 days
      playing: false,
      speed: 1  // Days per second of animation
    }

    // Set timeline bounds (±30 days from encounter)
    const msPerDay = 24 * 60 * 60 * 1000
    this.orbitalTimeline.startTime = new Date(this.orbitalTimeline.encounterTime.getTime() - 30 * msPerDay)
    this.orbitalTimeline.endTime = new Date(this.orbitalTimeline.encounterTime.getTime() + 30 * msPerDay)

    // Create timeline UI controls
    this.createTimelineControls()

    console.log("  ✅ Timeline ready")
    console.log(`    - Start: ${this.orbitalTimeline.startTime.toDateString()}`)
    console.log(`    - Encounter: ${this.orbitalTimeline.encounterTime.toDateString()}`)
    console.log(`    - End: ${this.orbitalTimeline.endTime.toDateString()}`)
  }

  /**
   * Create timeline UI controls for orbital view
   * Generates HTML elements for playback controls and date display
   */
  createTimelineControls() {
    // Check if timeline panel exists
    let timelinePanel = document.getElementById('orbital-timeline-panel')

    if (!timelinePanel && this.hasTimelineTarget) {
      // Create timeline panel
      timelinePanel = document.createElement('div')
      timelinePanel.id = 'orbital-timeline-panel'
      timelinePanel.className = 'orbital-timeline'
      timelinePanel.style.cssText = `
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(23, 18, 38, 0.95);
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid rgba(147, 180, 216, 0.3);
        min-width: 400px;
        z-index: 100;
      `

      timelinePanel.innerHTML = `
        <div class="timeline-header" style="text-align: center; margin-bottom: 0.5rem; color: #93B4D8;">
          <span id="timeline-date">Encounter Date</span>
        </div>
        <div class="timeline-controls" style="display: flex; gap: 1rem; align-items: center;">
          <button id="timeline-play" class="btn btn-sm">▶</button>
          <input type="range" id="timeline-slider"
                 min="0" max="60" value="30"
                 style="flex: 1;">
          <span id="timeline-speed" style="color: #B39DDB;">1x</span>
        </div>
      `

      this.timelineTarget.appendChild(timelinePanel)

      // Add event listeners
      const playBtn = document.getElementById('timeline-play')
      const slider = document.getElementById('timeline-slider')
      const speedBtn = document.getElementById('timeline-speed')

      if (playBtn) {
        playBtn.addEventListener('click', () => this.toggleOrbitalPlayback())
      }

      if (slider) {
        slider.addEventListener('input', (e) => this.updateOrbitalTime(e.target.value))
      }

      if (speedBtn) {
        speedBtn.addEventListener('click', () => this.cyclePlaybackSpeed())
      }
    }

    // Update display
    this.updateTimelineDisplay()
  }

  /**
   * Toggle orbital animation playback
   * Switches between playing and paused states
   */
  toggleOrbitalPlayback() {
    this.orbitalTimeline.playing = !this.orbitalTimeline.playing
    const playBtn = document.getElementById('timeline-play')
    if (playBtn) {
      playBtn.textContent = this.orbitalTimeline.playing ? '⏸' : '▶'
    }
    console.log(this.orbitalTimeline.playing ? "▶️ Playing orbital animation" : "⏸ Paused")
  }

  /**
   * Update orbital positions based on timeline slider
   *
   * @param {number} sliderValue - Slider value (0-60, representing days)
   */
  updateOrbitalTime(sliderValue) {
    const progress = sliderValue / 60  // 0 to 1
    const totalMs = this.orbitalTimeline.endTime - this.orbitalTimeline.startTime
    const currentMs = this.orbitalTimeline.startTime.getTime() + (progress * totalMs)

    this.orbitalTimeline.currentTime = new Date(currentMs)

    // Update positions using callbacks
    if (this.positionEarthAtTime) {
      this.positionEarthAtTime(this.orbitalTimeline.currentTime)
    }
    if (this.positionNeoAtTime) {
      this.positionNeoAtTime(this.orbitalTimeline.currentTime)
    }

    // Update display
    this.updateTimelineDisplay()
  }

  /**
   * Cycle through playback speeds
   * Rotates through: 0.5x, 1x, 2x, 5x, 10x
   */
  cyclePlaybackSpeed() {
    const speeds = [0.5, 1, 2, 5, 10]
    const currentIndex = speeds.indexOf(this.orbitalTimeline.speed)
    const nextIndex = (currentIndex + 1) % speeds.length
    this.orbitalTimeline.speed = speeds[nextIndex]

    const speedBtn = document.getElementById('timeline-speed')
    if (speedBtn) {
      speedBtn.textContent = `${this.orbitalTimeline.speed}x`
    }
  }

  /**
   * Update timeline display with current date and countdown
   * Shows days until/after encounter
   */
  updateTimelineDisplay() {
    const dateDisplay = document.getElementById('timeline-date')
    if (dateDisplay) {
      const daysBefore = Math.round((this.orbitalTimeline.encounterTime - this.orbitalTimeline.currentTime) / (24 * 60 * 60 * 1000))
      const dateStr = this.orbitalTimeline.currentTime.toLocaleDateString()

      if (Math.abs(daysBefore) < 1) {
        dateDisplay.innerHTML = `<strong style="color: #FF6B35;">ENCOUNTER DAY</strong> - ${dateStr}`
      } else if (daysBefore > 0) {
        dateDisplay.textContent = `T-${daysBefore} days - ${dateStr}`
      } else {
        dateDisplay.textContent = `T+${Math.abs(daysBefore)} days - ${dateStr}`
      }
    }
  }

  /**
   * Update impact timeline progress bar
   * Used during meteor entry visualization
   *
   * @param {number} progress - Animation progress (0.0 to 1.0)
   */
  updateTimeline(progress) {
    if (this.timelineProgressTarget) {
      this.timelineProgressTarget.style.width = `${progress * 100}%`
    }
    if (this.timelineHandleTarget) {
      this.timelineHandleTarget.style.left = `${progress * 100}%`
    }
    if (this.timeStartTarget) {
      const remaining = (1 - progress) * 25
      this.timeStartTarget.textContent = `T-${remaining.toFixed(1)}s`
    }
    if (this.timeEndTarget) {
      this.timeEndTarget.textContent = progress >= 1 ? "IMPACT!" : "Impact"
    }
  }

  /**
   * Set timeline DOM element references for impact timeline
   *
   * @param {Object} targets - Object containing timeline target references
   */
  setTimelineTargets(targets) {
    this.timelineProgressTarget = targets.timelineProgressTarget
    this.timelineHandleTarget = targets.timelineHandleTarget
    this.timeStartTarget = targets.timeStartTarget
    this.timeEndTarget = targets.timeEndTarget
  }

  /**
   * Get orbital timeline state
   * @returns {Object|null} Orbital timeline data
   */
  getOrbitalTimeline() {
    return this.orbitalTimeline
  }

  /**
   * Check if orbital timeline is playing
   * @returns {boolean} True if playing
   */
  isPlaying() {
    return this.orbitalTimeline?.playing || false
  }

  /**
   * Get current playback speed
   * @returns {number} Speed multiplier
   */
  getSpeed() {
    return this.orbitalTimeline?.speed || 1
  }

  /**
   * Advance orbital time (called in animation loop)
   * Updates current time based on playback speed
   *
   * @param {number} deltaTime - Time elapsed since last frame (ms)
   */
  advanceOrbitalTime(deltaTime) {
    if (!this.orbitalTimeline || !this.orbitalTimeline.playing) return

    const msPerDay = 24 * 60 * 60 * 1000
    const msToAdd = (deltaTime / 1000) * this.orbitalTimeline.speed * msPerDay

    const newTime = new Date(this.orbitalTimeline.currentTime.getTime() + msToAdd)

    // Clamp to timeline bounds
    if (newTime > this.orbitalTimeline.endTime) {
      this.orbitalTimeline.currentTime = this.orbitalTimeline.endTime
      this.orbitalTimeline.playing = false
      const playBtn = document.getElementById('timeline-play')
      if (playBtn) playBtn.textContent = '▶'
    } else if (newTime < this.orbitalTimeline.startTime) {
      this.orbitalTimeline.currentTime = this.orbitalTimeline.startTime
      this.orbitalTimeline.playing = false
      const playBtn = document.getElementById('timeline-play')
      if (playBtn) playBtn.textContent = '▶'
    } else {
      this.orbitalTimeline.currentTime = newTime
    }

    // Update slider
    const slider = document.getElementById('timeline-slider')
    if (slider) {
      const totalMs = this.orbitalTimeline.endTime - this.orbitalTimeline.startTime
      const currentMs = this.orbitalTimeline.currentTime - this.orbitalTimeline.startTime
      const progress = currentMs / totalMs
      slider.value = progress * 60
    }

    // Update positions
    if (this.positionEarthAtTime) {
      this.positionEarthAtTime(this.orbitalTimeline.currentTime)
    }
    if (this.positionNeoAtTime) {
      this.positionNeoAtTime(this.orbitalTimeline.currentTime)
    }

    // Update display
    this.updateTimelineDisplay()
  }

  /**
   * Clear timeline UI (remove from DOM)
   */
  clearTimeline() {
    const timelinePanel = document.getElementById('orbital-timeline-panel')
    if (timelinePanel) {
      timelinePanel.remove()
    }
    this.orbitalTimeline = null
  }
}
