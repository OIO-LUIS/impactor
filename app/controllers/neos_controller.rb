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
  # NOTE: Browse functionality has been removed - using date-based search only

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
      @data_source = "api"

      Rails.logger.info "✅ Found #{@neos.length} NEOs in date range from API"

      respond_to do |format|
        format.turbo_stream { render turbo_stream: turbo_stream.update("neo_results", partial: "neos/feed_results") }
        format.html { render partial: "neos/feed_results" }
      end
    rescue => e
      Rails.logger.error "❌ NEO feed API error: #{e.message}"
      Rails.logger.info "🔄 Attempting to fetch NEOs from database as fallback..."

      # Fallback to database
      begin
        @neos = fetch_neos_from_database(start_date, end_date)
        @start_date = start_date
        @end_date = end_date
        @element_count = @neos.length
        @data_source = "database"
        @api_error = "NASA API is temporarily unavailable. Showing cached data from database."

        Rails.logger.info "✅ Found #{@neos.length} NEOs in database for date range"

        respond_to do |format|
          format.turbo_stream { render turbo_stream: turbo_stream.update("neo_results", partial: "neos/feed_results") }
          format.html { render partial: "neos/feed_results" }
        end
      rescue => db_error
        Rails.logger.error "❌ Database fallback also failed: #{db_error.message}"
        @error = "Unable to fetch NEO data. Please try again later."
        respond_to do |format|
          format.turbo_stream { render turbo_stream: turbo_stream.update("neo_results", partial: "neos/error") }
          format.html { render partial: "neos/error" }
        end
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
      # Try multiple identifiers: neo_id, neo_reference_id, and name
      sbdb = SbdbService.new
      orbital_elements = nil

      # Try neo_id first
      orbital_elements = sbdb.lookup(sstr: neo_id)

      # If that fails, try neo_reference_id
      if orbital_elements.nil? && neo_data["neo_reference_id"].present?
        Rails.logger.info "🔄 Retrying SBDB with neo_reference_id: #{neo_data['neo_reference_id']}"
        orbital_elements = sbdb.lookup(sstr: neo_data["neo_reference_id"])
      end

      # If that fails, try name (without parentheses)
      if orbital_elements.nil? && neo_data["name"].present?
        clean_name = neo_data["name"].gsub(/[()]/, '').strip
        Rails.logger.info "🔄 Retrying SBDB with name: #{clean_name}"
        orbital_elements = sbdb.lookup(sstr: clean_name)
      end

      if orbital_elements
        puts "Orbital elements found for NEO #{neo_id}: #{orbital_elements.inspect}"
        neo_info[:orbital_elements] = orbital_elements
        Rails.logger.info "✅ Orbital elements retrieved from SBDB"
        Rails.logger.info "   - Eccentricity: #{orbital_elements[:eccentricity]}"
        Rails.logger.info "   - Semi-major axis: #{orbital_elements[:semi_major_axis_au]} AU"
        Rails.logger.info "   - Inclination: #{orbital_elements[:inclination_deg]}°"
      else
        Rails.logger.warn "⚠️  No orbital elements available for #{neo_id} - trajectory will use simplified model"
        Rails.logger.warn "    Tried: neo_id (#{neo_id}), neo_reference_id (#{neo_data['neo_reference_id']}), name (#{neo_data['name']})"
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
  # HELPER: Fetch NEOs from database by date range
  # ============================================================================
  #
  # Fetches NEOs from the local database when the API is unavailable.
  # Searches through the JSONB close_approaches column for dates within range.
  #
  # Parameters:
  # - start_date: Start date string (YYYY-MM-DD)
  # - end_date: End date string (YYYY-MM-DD)
  #
  # Returns: Array of mapped NEO data hashes
  #
  def fetch_neos_from_database(start_date, end_date)
    # Parse dates
    start_dt = Date.parse(start_date)
    end_dt = Date.parse(end_date)

    # Fetch NEOs that have close approaches within the date range
    # Using PostgreSQL JSONB operators to search in the close_approaches array
    neos = Neo.where(
      "close_approaches @> ?",
      %([{"close_approach_date": "#{start_date}"}])
    ).or(
      Neo.where("EXISTS (
        SELECT 1 FROM jsonb_array_elements(close_approaches) AS ca
        WHERE (ca->>'close_approach_date')::date BETWEEN ? AND ?
      )", start_dt, end_dt)
    ).limit(100)  # Limit results for performance

    # If no NEOs found with close approaches, get some recent ones
    if neos.empty?
      Rails.logger.warn "⚠️ No NEOs found with close approaches in date range, fetching recent NEOs"
      neos = Neo.where(potentially_hazardous: true).limit(20)
      if neos.empty?
        neos = Neo.limit(20)  # Just get any NEOs if nothing else
      end
    end

    # Map database NEOs to the expected format
    neos.map do |neo|
      # Extract close approach data for the date range if available
      close_approaches = neo.close_approaches || []
      relevant_approach = close_approaches.find do |ca|
        ca_date = Date.parse(ca["close_approach_date"]) rescue nil
        ca_date && ca_date >= start_dt && ca_date <= end_dt
      end || close_approaches.first  # Use first approach if none in range

      # Extract velocity and miss distance from close approach data
      velocity = 20.0  # Default
      miss_distance = nil
      approach_date = nil

      if relevant_approach
        velocity = relevant_approach.dig("relative_velocity", "kilometers_per_second")&.to_f || 20.0
        miss_distance = relevant_approach.dig("miss_distance", "kilometers")&.to_f
        approach_date = relevant_approach["close_approach_date"]
      end

      # Calculate average diameter
      diameter_avg = if neo.est_diameter_m_min && neo.est_diameter_m_max
                       (neo.est_diameter_m_min + neo.est_diameter_m_max) / 2.0
                     else
                       500.0  # Default estimate
                     end

      {
        # Identification
        id: neo.id.to_s,
        neo_reference_id: neo.neo_reference_id,
        name: neo.name,
        nasa_jpl_url: neo.nasa_jpl_url,

        # Physical Properties
        absolute_magnitude: neo.absolute_magnitude_h,
        diameter_m: diameter_avg.round(1),
        diameter_min_m: neo.est_diameter_m_min&.round(1) || 100.0,
        diameter_max_m: neo.est_diameter_m_max&.round(1) || 1000.0,

        # Estimated Impact Parameters
        density_kg_m3: estimate_density({ "albedo" => neo.albedo }),
        estimated_strength_mpa: estimate_strength({ "albedo" => neo.albedo }),

        # Close Approach Data
        velocity_kms: velocity.round(2),
        close_approach_date: approach_date || start_date,
        miss_distance_km: miss_distance&.round(1),

        # Hazard Assessment
        potentially_hazardous: neo.potentially_hazardous,
        is_sentry_object: neo.sentry_object
      }
    end
  end

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
