# frozen_string_literal: true

# ============================================================================
# NEOS CONTROLLER - Near-Earth Object Browser
# ============================================================================
#
# PURPOSE:
# Provides endpoints for browsing and searching NASA NEO data using the
# NeoWs (Near Earth Object Web Service) API.
#
# ENDPOINTS:
# - GET /neos/browse - Browse paginated list of all NEOs
# - GET /neos/feed - Get NEOs by date range (close approach dates)
# - GET /neos/:id - Get detailed information about a specific NEO
#
# TURBO FRAME INTEGRATION:
# All endpoints return HTML partials wrapped in turbo_frame_tag for
# seamless in-page updates without full page reloads.
#
# ============================================================================

class NeosController < ApplicationController
  # ============================================================================
  # NEO BROWSE - Paginated list of all NEOs
  # ============================================================================
  #
  # GET /neos/browse?page=0
  #
  # Parameters:
  # - page: Page number (default: 0)
  # - size: Results per page (default: 20)
  #
  # Returns: HTML partial with NEO list in Turbo Frame
  #
  def browse
    page = params[:page]&.to_i || 0
    size = params[:size]&.to_i || 20

    Rails.logger.info "📡 Fetching NEO browse data (page: #{page}, size: #{size})"

    begin
      neows = NeowsService.new
      data = neows.browse(page: page, size: size)

      @neos = data["near_earth_objects"].map do |neo_data|
        map_neo_data(neo_data)
        puts "Mapped NEO: #{neo_data['name']}"
        puts neo_data.inspect
      end

      @page = data.dig("page", "number") || page
      @total_pages = data.dig("page", "total_pages") || 1
      @total_elements = data.dig("page", "total_elements") || 0

      Rails.logger.info "✅ Found #{@neos.length} NEOs (total: #{@total_elements})"

      respond_to do |format|
        format.turbo_stream { render turbo_stream: turbo_stream.update("neo_results", partial: "neos/browse_results") }
        format.html { render partial: "neos/browse_results" }
      end
    rescue => e
      Rails.logger.error "❌ NEO browse error: #{e.message}"
      @error = e.message
      respond_to do |format|
        format.turbo_stream { render turbo_stream: turbo_stream.update("neo_results", partial: "neos/error") }
        format.html { render partial: "neos/error" }
      end
    end
  end

  # ============================================================================
  # NEO FEED - Get NEOs by close approach date range
  # ============================================================================
  #
  # GET /neos/feed?start_date=2024-01-01&end_date=2024-01-07
  #
  # Parameters:
  # - start_date: Start date (YYYY-MM-DD format)
  # - end_date: End date (YYYY-MM-DD format, max 7 days from start)
  #
  # Returns: HTML partial with NEO list in Turbo Frame
  #
  def feed
    start_date = params[:start_date] || Date.today.to_s
    end_date = params[:end_date] || (Date.parse(start_date) + 6.days).to_s

    Rails.logger.info "📡 Fetching NEO feed (#{start_date} to #{end_date})"

    begin
      neows = NeowsService.new
      data = neows.feed(start_date: start_date, end_date: end_date)

      # Flatten all NEOs from all dates
      @neos = []
      data["near_earth_objects"]&.each do |date, neos_on_date|
        neos_on_date.each do |neo_data|
          @neos << map_neo_data(neo_data)
          puts "Mapped NEO: #{neo_data['name']}"
          puts neo_data.inspect
        end
      end

      @start_date = start_date
      @end_date = end_date
      @element_count = data["element_count"] || @neos.length

      Rails.logger.info "✅ Found #{@neos.length} NEOs in date range"

      respond_to do |format|
        format.turbo_stream { render turbo_stream: turbo_stream.update("neo_results", partial: "neos/feed_results") } 
        format.html { render partial: "neos/feed_results" }
      end
    rescue => e
      Rails.logger.error "❌ NEO feed error: #{e.message}"
      @error = e.message
      respond_to do |format|
        format.turbo_stream { render turbo_stream: turbo_stream.update("neo_results", partial: "neos/error") }
        format.html { render partial: "neos/error" }
      end
    end
  end

  # ============================================================================
  # NEO SHOW - Get detailed information about a specific NEO
  # ============================================================================
  #
  # GET /neos/:id
  #
  # Parameters:
  # - id: NEO reference ID (e.g., "3542519")
  #
  # Returns: JSON with detailed NEO data for form population
  #
  def show
    neo_id = params[:id]

    Rails.logger.info "📡 Fetching NEO details: #{neo_id}"

    begin
      neows = NeowsService.new
      neo_data = neows.lookup(neo_id)

      # Map NEO data with all scientific parameters
      neo_info = map_neo_data(neo_data)

      # Fetch Keplerian orbital elements from SBDB for accurate trajectory calculation
      sbdb = SbdbService.new
      orbital_elements = sbdb.lookup(sstr: neo_id)

      if orbital_elements
        puts "Orbital elements found for NEO #{neo_id}: #{orbital_elements.inspect}"
        neo_info[:orbital_elements] = orbital_elements
        Rails.logger.info "✅ Orbital elements retrieved from SBDB"
        Rails.logger.info "   - Eccentricity: #{orbital_elements[:eccentricity]}"
        Rails.logger.info "   - Semi-major axis: #{orbital_elements[:semi_major_axis_au]} AU"
        Rails.logger.info "   - Inclination: #{orbital_elements[:inclination_deg]}°"
      else
        Rails.logger.warn "⚠️  No orbital elements available - trajectory will use simplified model"
      end

      # Add raw NASA data for scientific reference
      neo_info[:raw_data] = {
        links: neo_data["links"],
        estimated_diameter_range: neo_data["estimated_diameter"],
        close_approach_full: neo_data["close_approach_data"]&.first
      }

      Rails.logger.info "✅ NEO details retrieved: #{neo_info[:name]}"
      Rails.logger.info "   - Velocity: #{neo_info[:velocity_kms]} km/s (from NASA close approach data)"
      Rails.logger.info "   - Diameter: #{neo_info[:diameter_m]} m (avg of #{neo_info[:diameter_min_m]}-#{neo_info[:diameter_max_m]})"
      Rails.logger.info "   - Miss Distance: #{neo_info[:miss_distance_km]} km"
      Rails.logger.info "   - Approach Date: #{neo_info[:close_approach_date]}"

      render json: neo_info
    rescue => e
      Rails.logger.error "❌ NEO show error: #{e.message}"
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  private

  # ============================================================================
  # HELPER: Map NASA API NEO data to our format
  # ============================================================================
  #
  # Converts NASA NeoWs API response to a standardized format with
  # estimated impact parameters.
  #
  # Estimation logic:
  # - Diameter: Average of min/max estimates
  # - Density: Based on asteroid composition (C-type: 1300, S-type: 2700, M-type: 5300)
  # - Velocity: From close approach data or typical ~20 km/s
  # - Impact angle: Typical angle ~45°
  #
  def map_neo_data(neo_data)
    puts "Data received for mapping: #{neo_data.inspect}"
    # Calculate average diameter from NASA estimates
    diameter_min = neo_data.dig("estimated_diameter", "meters", "estimated_diameter_min")&.to_f || 100
    diameter_max = neo_data.dig("estimated_diameter", "meters", "estimated_diameter_max")&.to_f || 1000
    diameter_avg = (diameter_min + diameter_max) / 2.0

    # Estimate density based on absolute magnitude (composition proxy)
    density = estimate_density(neo_data)

    # Extract ACTUAL velocity from close approach data (most accurate!)
    velocity = 20.0 # Default typical impact velocity
    close_approach = nil
    miss_distance_km = nil
    approach_date = nil

    if neo_data["close_approach_data"]&.any?
      close_approach = neo_data["close_approach_data"].first
      # Use ACTUAL measured velocity, not estimate!
      velocity = close_approach.dig("relative_velocity", "kilometers_per_second")&.to_f || 20.0
      miss_distance_km = close_approach.dig("miss_distance", "kilometers")&.to_f
      approach_date = close_approach["close_approach_date"]
    end

    # Estimate material strength based on absolute magnitude and composition
    strength = estimate_strength(neo_data)

    {
      # Identification
      id: neo_data["id"],
      neo_reference_id: neo_data["neo_reference_id"] || neo_data["id"],
      name: neo_data["name"],
      nasa_jpl_url: neo_data["nasa_jpl_url"],

      # Physical Properties (measured/estimated)
      absolute_magnitude: neo_data["absolute_magnitude_h"],
      diameter_m: diameter_avg.round(1),
      diameter_min_m: diameter_min.round(1),
      diameter_max_m: diameter_max.round(1),

      # Estimated Impact Parameters
      density_kg_m3: density,
      estimated_strength_mpa: strength,

      # Close Approach Data (ACTUAL measurements!)
      velocity_kms: velocity.round(2),
      close_approach_date: approach_date,
      miss_distance_km: miss_distance_km&.round(1),

      # Hazard Assessment
      potentially_hazardous: neo_data["is_potentially_hazardous_asteroid"] || false,
      is_sentry_object: neo_data["is_sentry_object"] || false
    }
  end

  # ============================================================================
  # HELPER: Estimate asteroid density
  # ============================================================================
  #
  # Estimates density based on asteroid properties:
  # - Albedo < 0.1: C-type (carbonaceous) ~1300 kg/m³
  # - Albedo 0.1-0.2: S-type (stony) ~2700 kg/m³
  # - Albedo > 0.2: M-type (metallic) ~5300 kg/m³
  # - Unknown: Default to stony (most common) ~3500 kg/m³
  #
  def estimate_density(neo_data)
    albedo = neo_data["albedo"]&.to_f

    if albedo
      if albedo < 0.1
        1300 # C-type (carbonaceous)
      elsif albedo < 0.2
        2700 # S-type (stony)
      else
        5300 # M-type (metallic)
      end
    else
      3500 # Default: average stony asteroid
    end
  end

  # ============================================================================
  # HELPER: Estimate material strength
  # ============================================================================
  #
  # Estimates material strength based on density/composition:
  # - Low density (< 2000): Weak, porous ~1 MPa
  # - Medium density (2000-4000): Typical stony ~10 MPa
  # - High density (> 4000): Strong metallic ~100 MPa
  #
  def estimate_strength(neo_data)
    albedo = neo_data["albedo"]&.to_f

    if albedo
      if albedo < 0.1
        1.0 # C-type: weak, porous
      elsif albedo < 0.2
        10.0 # S-type: typical strength
      else
        50.0 # M-type: stronger
      end
    else
      10.0 # Default: typical stony asteroid
    end
  end
end
