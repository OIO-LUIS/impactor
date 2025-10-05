# frozen_string_literal: true

# HorizonsApiService
# Integrates with NASA JPL Horizons API to fetch accurate planetary positions
# for heliocentric visualization in the NEO impact simulator.
#
# SCIENTIFIC ACCURACY:
# - Uses NASA JPL Horizons ephemeris data (most accurate available)
# - Heliocentric ecliptic J2000 reference frame
# - Returns positions in both AU and km
# - Supports all major bodies (planets, moons, asteroids)
#
# API Documentation: https://ssd-api.jpl.nasa.gov/doc/horizons.html
#
# Usage:
#   service = HorizonsApiService.new
#   position = service.fetch_planet_position(499, Time.current) # Mars
#   all_planets = service.fetch_all_planets(Time.current)
#
class HorizonsApiService
  # Note: If HTTParty is not available, we'll use Net::HTTP as fallback
  if defined?(HTTParty)
    include HTTParty
    base_uri 'https://ssd.jpl.nasa.gov'
  end

  # Celestial body IDs in Horizons system
  PLANET_IDS = {
    mercury: '199',
    venus: '299',
    earth: '399',
    mars: '499',
    jupiter: '599',
    saturn: '699',
    uranus: '799',
    neptune: '899',
    pluto: '999' # Honorary inclusion
  }.freeze

  # Conversion constants
  AU_TO_KM = 149_597_870.7

  # Cache configuration
  CACHE_TTL = 30.minutes

  def initialize
    @cache_enabled = Rails.env.production?
  end

  # Fetch position for a single planet at a specific time
  # @param planet_id [String, Integer] Horizons ID or planet name symbol
  # @param datetime [Time, DateTime] Time for position query
  # @return [Hash] { x_au:, y_au:, z_au:, x_km:, y_km:, z_km:, vx_kms:, vy_kms:, vz_kms: }
  def fetch_planet_position(planet_id, datetime = Time.current)
    # Handle both ID and name inputs
    id = planet_id.is_a?(Symbol) ? PLANET_IDS[planet_id] : planet_id.to_s

    cache_key = "horizons:planet:#{id}:#{datetime.to_i}"

    Rails.cache.fetch(cache_key, expires_in: CACHE_TTL) do
      result = query_horizons(id, datetime)
      result || fallback_position(id, datetime)  # Use fallback if API fails
    end
  rescue StandardError => e
    Rails.logger.error "HorizonsApiService error fetching planet #{planet_id}: #{e.message}"
    fallback_position(planet_id, datetime)
  end

  # Fetch positions for all planets at once
  # @param datetime [Time, DateTime] Time for position query
  # @return [Hash] { mercury: {...}, venus: {...}, ... }
  def fetch_all_planets(datetime = Time.current)
    result = {}

    PLANET_IDS.each do |name, id|
      next if name == :pluto # Skip Pluto for main 8 planets

      result[name] = fetch_planet_position(id, datetime)
    end

    result
  rescue StandardError => e
    Rails.logger.error "HorizonsApiService error fetching all planets: #{e.message}"
    fallback_all_planets(datetime)
  end

  # Fetch positions for a date range (for timeline animation)
  # @param start_date [Time] Start of range
  # @param end_date [Time] End of range
  # @param step_hours [Integer] Hours between samples (default 24)
  # @return [Array<Hash>] Array of timestamped position sets
  def fetch_planet_trajectory(planet_id, start_date, end_date, step_hours = 24)
    id = planet_id.is_a?(Symbol) ? PLANET_IDS[planet_id] : planet_id.to_s

    cache_key = "horizons:trajectory:#{id}:#{start_date.to_i}:#{end_date.to_i}:#{step_hours}"

    Rails.cache.fetch(cache_key, expires_in: CACHE_TTL) do
      query_horizons_range(id, start_date, end_date, step_hours)
    end
  rescue StandardError => e
    Rails.logger.error "HorizonsApiService error fetching trajectory: #{e.message}"
    []
  end

  private

  # Query Horizons API for single time point
  def query_horizons(body_id, datetime)
    # Format time for Horizons (YYYY-MM-DD HH:MM)
    time_str = datetime.strftime('%Y-%m-%d %H:%M')

    params = {
      'format' => 'json',
      'COMMAND' => body_id,
      'OBJ_DATA' => 'NO',
      'MAKE_EPHEM' => 'YES',
      'EPHEM_TYPE' => 'VECTORS',
      'CENTER' => '@0', # Sun-centered (heliocentric)
      'START_TIME' => time_str,
      'STOP_TIME' => time_str,
      'STEP_SIZE' => '1d',
      'VEC_TABLE' => '2', # Position and velocity
      'VEC_LABELS' => 'NO',
      'CSV_FORMAT' => 'YES',
      'OUT_UNITS' => 'AU-D', # AU and AU/day
      'REF_PLANE' => 'ECLIPTIC',
      'REF_SYSTEM' => 'J2000'
    }

    # Use HTTParty if available, otherwise skip API call and use fallback
    if defined?(HTTParty)
      response = self.class.get('/api/horizons.api', query: params, timeout: 10)
    else
      Rails.logger.warn "HTTParty not available, using fallback positions"
      return nil
    end

    if response.success?
      parse_horizons_response(response.parsed_response)
    else
      raise "Horizons API error: #{response.code} - #{response.message}"
    end
  end

  # Query Horizons API for time range
  def query_horizons_range(body_id, start_date, end_date, step_hours)
    start_str = start_date.strftime('%Y-%m-%d')
    end_str = end_date.strftime('%Y-%m-%d')

    params = {
      'format' => 'json',
      'COMMAND' => body_id,
      'OBJ_DATA' => 'NO',
      'MAKE_EPHEM' => 'YES',
      'EPHEM_TYPE' => 'VECTORS',
      'CENTER' => '@0',
      'START_TIME' => start_str,
      'STOP_TIME' => end_str,
      'STEP_SIZE' => "#{step_hours}h",
      'VEC_TABLE' => '2',
      'VEC_LABELS' => 'NO',
      'CSV_FORMAT' => 'YES',
      'OUT_UNITS' => 'AU-D',
      'REF_PLANE' => 'ECLIPTIC',
      'REF_SYSTEM' => 'J2000'
    }

    # Use HTTParty if available, otherwise skip API call and use fallback
    if defined?(HTTParty)
      response = self.class.get('/api/horizons.api', query: params, timeout: 15)
    else
      Rails.logger.warn "HTTParty not available, using fallback positions"
      return []
    end

    if response.success?
      parse_horizons_trajectory(response.parsed_response)
    else
      raise "Horizons API error: #{response.code} - #{response.message}"
    end
  end

  # Parse Horizons API response for single position
  def parse_horizons_response(data)
    return nil unless data

    # Extract the result string which contains the ephemeris data
    result = data['result']
    return nil unless result

    # Find the data section between $$SOE and $$EOE markers
    lines = result.lines
    start_idx = lines.find_index { |l| l.include?('$$SOE') }
    end_idx = lines.find_index { |l| l.include?('$$EOE') }

    return nil unless start_idx && end_idx && start_idx < end_idx

    # Parse the CSV data line (first line after $$SOE)
    data_line = lines[start_idx + 1].strip
    values = data_line.split(',').map(&:strip)

    # Expected format: JD, Calendar Date, X, Y, Z, VX, VY, VZ
    # Positions in AU, velocities in AU/day
    x_au = values[2].to_f
    y_au = values[3].to_f
    z_au = values[4].to_f
    vx_au_day = values[5].to_f
    vy_au_day = values[6].to_f
    vz_au_day = values[7].to_f

    # Convert to km and km/s
    x_km = x_au * AU_TO_KM
    y_km = y_au * AU_TO_KM
    z_km = z_au * AU_TO_KM

    # Convert AU/day to km/s
    au_day_to_kms = AU_TO_KM / 86400.0
    vx_kms = vx_au_day * au_day_to_kms
    vy_kms = vy_au_day * au_day_to_kms
    vz_kms = vz_au_day * au_day_to_kms

    {
      x_au: x_au.round(6),
      y_au: y_au.round(6),
      z_au: z_au.round(6),
      x_km: x_km.round(2),
      y_km: y_km.round(2),
      z_km: z_km.round(2),
      vx_kms: vx_kms.round(3),
      vy_kms: vy_kms.round(3),
      vz_kms: vz_kms.round(3)
    }
  rescue StandardError => e
    Rails.logger.error "Error parsing Horizons response: #{e.message}"
    nil
  end

  # Parse Horizons API response for trajectory
  def parse_horizons_trajectory(data)
    result = data['result']
    return [] unless result

    lines = result.lines
    start_idx = lines.find_index { |l| l.include?('$$SOE') }
    end_idx = lines.find_index { |l| l.include?('$$EOE') }

    return [] unless start_idx && end_idx && start_idx < end_idx

    trajectory = []

    # Parse each data line
    (start_idx + 1...end_idx).each do |i|
      data_line = lines[i].strip
      next if data_line.empty?

      values = data_line.split(',').map(&:strip)

      # Parse Julian date and convert to Time
      jd = values[0].to_f
      time = julian_date_to_time(jd)

      # Parse position (same as single position)
      position = {
        time: time,
        x_au: values[2].to_f,
        y_au: values[3].to_f,
        z_au: values[4].to_f,
        x_km: values[2].to_f * AU_TO_KM,
        y_km: values[3].to_f * AU_TO_KM,
        z_km: values[4].to_f * AU_TO_KM
      }

      trajectory << position
    end

    trajectory
  rescue StandardError => e
    Rails.logger.error "Error parsing Horizons trajectory: #{e.message}"
    []
  end

  # Convert Julian Date to Ruby Time
  def julian_date_to_time(jd)
    # Unix epoch in JD is 2440587.5
    unix_seconds = (jd - 2440587.5) * 86400.0
    Time.at(unix_seconds).utc
  end

  # Fallback position using more accurate elliptical orbit approximation
  def fallback_position(planet_id, datetime)
    # Orbital elements for planets (epoch J2000)
    # semi_major_axis (AU), eccentricity, inclination (deg), longitude_ascending_node (deg),
    # argument_perihelion (deg), mean_longitude (deg at J2000)
    orbital_data = {
      '199' => { # Mercury
        a: 0.38709927, e: 0.20563593, i: 7.00497902, omega: 48.33076593,
        w: 77.45779628, L0: 252.25032350, period: 0.240846
      },
      '299' => { # Venus
        a: 0.72333566, e: 0.00677672, i: 3.39467605, omega: 76.67984255,
        w: 131.60246718, L0: 181.97909950, period: 0.615198
      },
      '399' => { # Earth
        a: 1.00000261, e: 0.01671123, i: 0.00001531, omega: 0.0,
        w: 102.93768193, L0: 100.46457166, period: 1.000017
      },
      '499' => { # Mars
        a: 1.52371034, e: 0.09339410, i: 1.84969142, omega: 49.55953891,
        w: -23.94362959, L0: -4.55343205, period: 1.880848
      },
      '599' => { # Jupiter
        a: 5.20288700, e: 0.04838624, i: 1.30439695, omega: 100.47390909,
        w: 14.72847983, L0: 34.39644051, period: 11.862
      },
      '699' => { # Saturn
        a: 9.53667594, e: 0.05386179, i: 2.48599187, omega: 113.66242448,
        w: 92.59887831, L0: 49.95424423, period: 29.457
      },
      '799' => { # Uranus
        a: 19.18916464, e: 0.04725744, i: 0.77263783, omega: 74.01692503,
        w: 170.95427630, L0: 313.23810451, period: 84.016
      },
      '899' => { # Neptune
        a: 30.06992276, e: 0.00859048, i: 1.77004347, omega: 131.78422574,
        w: 44.96476227, L0: -55.12002969, period: 164.79
      }
    }

    id = planet_id.is_a?(Symbol) ? PLANET_IDS[planet_id] : planet_id.to_s
    data = orbital_data[id] || orbital_data['399']  # Default to Earth

    # Calculate position using elliptical orbit
    days_since_j2000 = (datetime - Time.parse('2000-01-01 12:00:00 UTC')) / 86400.0

    # Mean longitude at current time
    mean_longitude = (data[:L0] + 360.0 * days_since_j2000 / (data[:period] * 365.25)) % 360.0

    # Mean anomaly
    mean_anomaly = (mean_longitude - data[:w]) % 360.0
    mean_anomaly_rad = mean_anomaly * Math::PI / 180.0

    # Solve Kepler's equation for eccentric anomaly (simplified)
    ecc_anomaly = mean_anomaly_rad
    5.times do
      ecc_anomaly = mean_anomaly_rad + data[:e] * Math.sin(ecc_anomaly)
    end

    # True anomaly
    true_anomaly = 2.0 * Math.atan2(
      Math.sqrt(1.0 + data[:e]) * Math.sin(ecc_anomaly / 2.0),
      Math.sqrt(1.0 - data[:e]) * Math.cos(ecc_anomaly / 2.0)
    )

    # Distance from Sun
    r = data[:a] * (1.0 - data[:e] * Math.cos(ecc_anomaly))

    # Position in orbital plane
    x_orb = r * Math.cos(true_anomaly)
    y_orb = r * Math.sin(true_anomaly)

    # Convert to ecliptic coordinates (simplified - ignoring inclination for fallback)
    angle = true_anomaly + data[:w] * Math::PI / 180.0
    x_au = r * Math.cos(angle)
    y_au = r * Math.sin(angle)

    # Apply inclination for z coordinate
    z_au = r * Math.sin(data[:i] * Math::PI / 180.0) * Math.sin(angle)

    # Approximate velocity in km/s using vis-viva equation
    v_kms = 29.78 / Math.sqrt(r)  # Earth's orbital velocity scaled by distance
    vx_kms = -v_kms * Math.sin(angle)
    vy_kms = v_kms * Math.cos(angle)
    vz_kms = 0.0

    {
      x_au: x_au.round(6),
      y_au: y_au.round(6),
      z_au: z_au.round(6),
      x_km: (x_au * AU_TO_KM).round(2),
      y_km: (y_au * AU_TO_KM).round(2),
      z_km: (z_au * AU_TO_KM).round(2),
      vx_kms: vx_kms.round(3),
      vy_kms: vy_kms.round(3),
      vz_kms: vz_kms.round(3),
      fallback: true
    }
  end

  # Fallback positions for all planets
  def fallback_all_planets(datetime)
    result = {}

    PLANET_IDS.each do |name, id|
      next if name == :pluto
      result[name] = fallback_position(id, datetime)
    end

    result
  end
end