# ============================================================================
# SBDB SERVICE - NASA Small-Body Database API
# ============================================================================
#
# PURPOSE:
# Fetches Keplerian orbital elements and detailed physical parameters from
# NASA's Small-Body Database (SBDB) for accurate trajectory calculation.
#
# KEPLERIAN ORBITAL ELEMENTS:
# - e (eccentricity): Shape of orbit (0 = circle, <1 = ellipse)
# - a (semi-major axis): Size of orbit in AU
# - i (inclination): Tilt of orbit relative to ecliptic plane (degrees)
# - om (longitude of ascending node): Where orbit crosses ecliptic (degrees)
# - w (argument of perihelion): Orientation of orbit (degrees)
# - q (perihelion distance): Closest approach to Sun (AU)
# - ma (mean anomaly): Position in orbit at epoch (degrees)
# - epoch: Reference time for orbital elements (Julian Date)
#
# API DOCUMENTATION:
# https://ssd-api.jpl.nasa.gov/doc/sbdb.html
#
# ============================================================================

class SbdbService
  include HTTParty
  base_uri "https://ssd-api.jpl.nasa.gov"
  format :json

  # ============================================================================
  # LOOKUP - Get orbital elements and physical data for a specific NEO
  # ============================================================================
  #
  # @param sstr [String] NEO reference ID, designation, or name
  # @return [Hash] Orbital elements and physical parameters, or nil if not found
  #
  def lookup(sstr:)
    Rails.logger.info "📡 SBDB: Fetching orbital elements for #{sstr}"

    resp = self.class.get("/sbdb.api", query: { sstr: sstr })

    unless resp.code == 200
      Rails.logger.error "❌ SBDB API error #{resp.code}: #{resp.body}"
      return nil
    end

    data = resp.parsed_response

    if data["orbit"].nil?
      Rails.logger.warn "⚠️  No orbital data available for #{sstr}"
      return nil
    end

    orbital_elements = parse_orbital_elements(data["orbit"])

    Rails.logger.info "✅ SBDB: Retrieved orbital elements"
    Rails.logger.info "   - Eccentricity: #{orbital_elements[:eccentricity]}"
    Rails.logger.info "   - Semi-major axis: #{orbital_elements[:semi_major_axis_au]} AU"
    Rails.logger.info "   - Inclination: #{orbital_elements[:inclination_deg]}°"

    orbital_elements
  rescue => e
    Rails.logger.error "❌ SBDB lookup error: #{e.message}"
    nil
  end

  private

  # ============================================================================
  # HELPER: Parse orbital elements from SBDB response
  # ============================================================================
  #
  # Extracts Keplerian elements from SBDB API response format
  #
  def parse_orbital_elements(orbit_data)
    elements = orbit_data["elements"].each_with_object({}) do |elem, hash|
      hash[elem["name"]] = elem["value"].to_f
    end

    {
      # Keplerian Orbital Elements (for trajectory calculation)
      eccentricity: elements["e"],                      # e: 0-1 (shape)
      semi_major_axis_au: elements["a"],                # a: AU (size)
      perihelion_distance_au: elements["q"],            # q: AU (closest to Sun)
      inclination_deg: elements["i"],                   # i: degrees (tilt)
      longitude_ascending_node_deg: elements["om"],     # Ω: degrees (node)
      argument_perihelion_deg: elements["w"],           # ω: degrees (orientation)
      mean_anomaly_deg: elements["ma"],                 # M: degrees (position)

      # Additional orbital parameters
      orbital_period_days: elements["per"],             # Period in days
      aphelion_distance_au: elements["ad"],             # Farthest from Sun
      mean_motion_deg_per_day: elements["n"],           # Daily angular motion

      # Epoch (reference time for elements)
      epoch_jd: orbit_data["epoch"]&.to_f               # Julian Date
    }
  end
end
