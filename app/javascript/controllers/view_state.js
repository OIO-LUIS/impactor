// ============================================================================
// VIEW STATE - State management for view modes and transitions
// ============================================================================
//
// PURPOSE:
// Manages the application view state and enforces valid state transitions.
// Prevents invalid operations during transitions and provides clear state query methods.
//
// STATES:
// - View Modes: HELIOCENTRIC (orbital view) | GEOCENTRIC (Earth-centered view)
// - Animation States: IDLE | ANIMATING | TRANSITIONING
// - Simulation States: NO_DATA | READY | SIMULATING
//
// STATE TRANSITIONS:
// IDLE -> SIMULATING -> IDLE
// HELIOCENTRIC <-> GEOCENTRIC (only when IDLE)
//
// USAGE:
// const state = new ViewState()
// state.switchToGeocentric()
// if (state.canSimulate()) { ... }
//
// ============================================================================

export class ViewState {
  /**
   * View mode constants
   */
  static VIEW_MODES = {
    HELIOCENTRIC: 'heliocentric',  // Sun-centered orbital view
    GEOCENTRIC: 'geocentric'        // Earth-centered impact view
  }

  /**
   * Animation state constants
   */
  static ANIMATION_STATES = {
    IDLE: 'idle',                  // Not animating
    ANIMATING: 'animating',        // Playing simulation
    TRANSITIONING: 'transitioning' // Switching views
  }

  /**
   * Simulation data state constants
   */
  static DATA_STATES = {
    NO_DATA: 'no_data',           // No simulation run yet
    READY: 'ready',                // Data loaded, ready to visualize
    SIMULATING: 'simulating'       // Backend processing
  }

  /**
   * Initialize view state
   * @param {string} initialViewMode - Starting view mode (default: HELIOCENTRIC)
   */
  constructor(initialViewMode = ViewState.VIEW_MODES.HELIOCENTRIC) {
    this.viewMode = initialViewMode
    this.animationState = ViewState.ANIMATION_STATES.IDLE
    this.dataState = ViewState.DATA_STATES.NO_DATA

    // Track what type of data we have
    this.hasOrbitalData = false
    this.hasImpactData = false
    this.isNearMiss = false

    console.log(`🎬 ViewState initialized: ${this.viewMode}`)
  }

  // ==========================================================================
  // VIEW MODE MANAGEMENT
  // ==========================================================================

  /**
   * Switch to heliocentric view
   * @throws {Error} If transition is not allowed
   */
  switchToHeliocentric() {
    if (!this.canSwitchView()) {
      throw new Error('Cannot switch view while animating or transitioning')
    }

    console.log(`🔄 ViewState: Switching to HELIOCENTRIC`)
    this.animationState = ViewState.ANIMATION_STATES.TRANSITIONING
    this.viewMode = ViewState.VIEW_MODES.HELIOCENTRIC
  }

  /**
   * Switch to geocentric view
   * @throws {Error} If transition is not allowed
   */
  switchToGeocentric() {
    if (!this.canSwitchView()) {
      throw new Error('Cannot switch view while animating or transitioning')
    }

    console.log(`🔄 ViewState: Switching to GEOCENTRIC`)
    this.animationState = ViewState.ANIMATION_STATES.TRANSITIONING
    this.viewMode = ViewState.VIEW_MODES.GEOCENTRIC
  }

  /**
   * Complete view transition
   * Call this after view switch animation is complete
   */
  completeTransition() {
    if (this.animationState !== ViewState.ANIMATION_STATES.TRANSITIONING) {
      console.warn('⚠️ completeTransition() called but not transitioning')
      return
    }

    console.log(`✅ ViewState: Transition to ${this.viewMode} complete`)
    this.animationState = ViewState.ANIMATION_STATES.IDLE
  }

  // ==========================================================================
  // ANIMATION STATE MANAGEMENT
  // ==========================================================================

  /**
   * Start animation playback
   * @throws {Error} If animation cannot start
   */
  startAnimation() {
    if (!this.canStartAnimation()) {
      throw new Error('Cannot start animation - invalid state')
    }

    console.log(`▶️ ViewState: Animation started`)
    this.animationState = ViewState.ANIMATION_STATES.ANIMATING
  }

  /**
   * Stop animation playback
   */
  stopAnimation() {
    if (this.animationState === ViewState.ANIMATION_STATES.ANIMATING) {
      console.log(`⏸️ ViewState: Animation stopped`)
      this.animationState = ViewState.ANIMATION_STATES.IDLE
    }
  }

  // ==========================================================================
  // SIMULATION DATA MANAGEMENT
  // ==========================================================================

  /**
   * Mark simulation as started
   */
  startSimulation() {
    console.log(`🚀 ViewState: Simulation started`)
    this.dataState = ViewState.DATA_STATES.SIMULATING
  }

  /**
   * Update state with simulation data
   * @param {Object} data - Simulation data
   * @param {boolean} data.impact - Whether NEO impacts
   * @param {boolean} data.near_miss - Whether NEO near-misses
   * @param {Object} data.visualization - Orbital visualization data
   */
  setSimulationData(data) {
    console.log(`📊 ViewState: Simulation data received`)

    this.dataState = ViewState.DATA_STATES.READY
    this.hasImpactData = !!data.impact
    this.isNearMiss = !!data.near_miss
    this.hasOrbitalData = !!(data.visualization?.earth_position || data.visualization?.neo_position)
  }

  /**
   * Clear simulation data
   */
  clearSimulationData() {
    console.log(`🧹 ViewState: Simulation data cleared`)

    this.dataState = ViewState.DATA_STATES.NO_DATA
    this.hasOrbitalData = false
    this.hasImpactData = false
    this.isNearMiss = false
  }

  // ==========================================================================
  // STATE QUERIES
  // ==========================================================================

  /**
   * Check if view can be switched
   * @returns {boolean} True if view switch is allowed
   */
  canSwitchView() {
    return this.animationState === ViewState.ANIMATION_STATES.IDLE
  }

  /**
   * Check if animation can start
   * @returns {boolean} True if animation can start
   */
  canStartAnimation() {
    return this.animationState === ViewState.ANIMATION_STATES.IDLE &&
           this.dataState === ViewState.DATA_STATES.READY
  }

  /**
   * Check if simulation can run
   * @returns {boolean} True if simulation can run
   */
  canSimulate() {
    return this.animationState === ViewState.ANIMATION_STATES.IDLE &&
           this.dataState !== ViewState.DATA_STATES.SIMULATING
  }

  /**
   * Check if currently in heliocentric view
   * @returns {boolean} True if in heliocentric mode
   */
  isHeliocentric() {
    return this.viewMode === ViewState.VIEW_MODES.HELIOCENTRIC
  }

  /**
   * Check if currently in geocentric view
   * @returns {boolean} True if in geocentric mode
   */
  isGeocentric() {
    return this.viewMode === ViewState.VIEW_MODES.GEOCENTRIC
  }

  /**
   * Check if currently animating
   * @returns {boolean} True if animating
   */
  isAnimating() {
    return this.animationState === ViewState.ANIMATION_STATES.ANIMATING
  }

  /**
   * Check if currently transitioning
   * @returns {boolean} True if transitioning
   */
  isTransitioning() {
    return this.animationState === ViewState.ANIMATION_STATES.TRANSITIONING
  }

  /**
   * Check if idle (not animating or transitioning)
   * @returns {boolean} True if idle
   */
  isIdle() {
    return this.animationState === ViewState.ANIMATION_STATES.IDLE
  }

  /**
   * Get current view mode
   * @returns {string} Current view mode
   */
  getViewMode() {
    return this.viewMode
  }

  /**
   * Get current animation state
   * @returns {string} Current animation state
   */
  getAnimationState() {
    return this.animationState
  }

  /**
   * Get current data state
   * @returns {string} Current data state
   */
  getDataState() {
    return this.dataState
  }

  /**
   * Get complete state snapshot for debugging
   * @returns {Object} State snapshot
   */
  getSnapshot() {
    return {
      viewMode: this.viewMode,
      animationState: this.animationState,
      dataState: this.dataState,
      hasOrbitalData: this.hasOrbitalData,
      hasImpactData: this.hasImpactData,
      isNearMiss: this.isNearMiss,
      canSimulate: this.canSimulate(),
      canSwitchView: this.canSwitchView(),
      canStartAnimation: this.canStartAnimation()
    }
  }

  /**
   * Log current state to console
   */
  logState() {
    const snapshot = this.getSnapshot()
    console.log('🎬 ViewState Snapshot:')
    console.table(snapshot)
  }
}
