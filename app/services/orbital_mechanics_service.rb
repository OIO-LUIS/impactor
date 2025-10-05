# frozen_string_literal: true

# OrbitalMechanicsService
# Calculates NEO trajectories using Keplerian orbital elements and determines
# if/where the NEO will impact Earth.
#
# SCIENTIFIC ACCURACY:
# This service uses proper celestial mechanics calculations:
# - Solves Kepler's equation for eccentric anomaly
# - Calculates true anomaly and heliocentric position
# - Uses Earth's actual position (circular orbit approximation: e=0.0167 ≈ 0)
# - All calculations in heliocentric ecliptic J2000 coordinates
# - Returns both Earth and NEO positions for accurate visualization
#
# Usage:
#   service = OrbitalMechanicsService.new(orbital_elements, encounter_time)
#   result = service.calculate
#   # => {
#   #   impact: true/false,
#   #   lat: ..., lng: ...,
#   #   miss_distance_km: ...,
#   #   velocity_kms: ...,
#   #   earth_position_km: [x, y, z],  # For accurate frontend visualization
#   #   neo_position_km: [x, y, z],    # For accurate frontend visualization
#   #   ...
#   # }

class OrbitalMechanicsService
  include Math

  # Astronomical constants
  AU_TO_KM = 149_597_870.7          # 1 AU in kilometers
  EARTH_RADIUS_KM = 6371.0          # Earth mean radius
  EARTH_MU = 398_600.4418           # Earth gravitational parameter (km^3/s^2)
  SUN_MU = 1.32712440018e11         # Sun gravitational parameter (km^3/s^2)
  EARTH_ORBITAL_PERIOD_DAYS = 365.256363004 # Earth sidereal year

  attr_reader :result

  # @param orbital_elements [Hash] Keplerian orbital elements
  #   - :eccentricity (e)
  #   - :semi_major_axis_au (a)
  #   - :inclination_deg (i)
  #   - :longitude_ascending_node_deg (Ω)
  #   - :argument_perihelion_deg (ω)
  #   - :mean_anomaly_deg (M)
  #   - :epoch_jd (Julian date of elements)
  # @param encounter_time [Time, nil] Time of closest approach (defaults to now)
  def initialize(orbital_elements, encounter_time = nil)
    @elements = orbital_elements.symbolize_keys
    @encounter_time = encounter_time || Time.current
    @encounter_jd = time_to_julian_date(@encounter_time)
  end

  # Calculate trajectory and determine impact
  # @return [Hash] Result with impact status, coordinates, and orbital data
  def calculate
    # 1. Calculate NEO position at encounter time
    neo_position, neo_velocity = calculate_neo_state_vectors(@encounter_jd)

    # 2. Calculate Earth position at encounter time
    earth_position, earth_velocity = calculate_earth_state_vectors(@encounter_jd)

    # 3. Calculate relative position and velocity (NEO relative to Earth)
    rel_position = vector_subtract(neo_position, earth_position)
    rel_velocity = vector_subtract(neo_velocity, earth_velocity)

    # 4. Calculate closest approach
    miss_distance_km = vector_magnitude(rel_position)
    velocity_kms = vector_magnitude(rel_velocity)

    # 5. Determine impact
    is_impact = miss_distance_km <= EARTH_RADIUS_KM

    result = {
      impact: is_impact,
      miss_distance_km: miss_distance_km.round(2),
      velocity_kms: velocity_kms.round(2),
      encounter_time: @encounter_time,
      neo_position_km: neo_position,
      earth_position_km: earth_position,
      neo_velocity_kms: neo_velocity,          # For velocity vector visualization
      earth_velocity_kms: earth_velocity,       # For velocity vector visualization
      relative_position_km: rel_position,
      relative_velocity_kms: rel_velocity
    }

    if is_impact
      # 6. Calculate impact point (lat/lon) and impact geometry
      impact_data = calculate_impact_geometry(rel_position, rel_velocity)
      result.merge!(impact_data)
    end

    @result = result
  end

  private

  # Convert Keplerian elements to Cartesian state vectors (position and velocity)
  # in heliocentric ecliptic coordinates
  def calculate_neo_state_vectors(jd)
    # Time since epoch
    dt_days = jd - @elements[:epoch_jd]

    # Mean motion (deg/day)
    n = @elements[:mean_motion_deg_per_day] || calculate_mean_motion(@elements[:semi_major_axis_au])

    # Mean anomaly at time t
    m_deg = (@elements[:mean_anomaly_deg] + n * dt_days) % 360.0
    m_rad = deg2rad(m_deg)

    # Solve Kepler's equation for eccentric anomaly
    e = @elements[:eccentricity]
    ecc_anomaly = solve_kepler(m_rad, e)

    # True anomaly
    true_anomaly = 2.0 * atan2(
      sqrt(1.0 + e) * sin(ecc_anomaly / 2.0),
      sqrt(1.0 - e) * cos(ecc_anomaly / 2.0)
    )

    # Distance from Sun (AU)
    a_au = @elements[:semi_major_axis_au]
    r_au = a_au * (1.0 - e * cos(ecc_anomaly))
    r_km = r_au * AU_TO_KM

    # Position in orbital plane
    x_orb = r_km * cos(true_anomaly)
    y_orb = r_km * sin(true_anomaly)

    # Velocity in orbital plane
    h = sqrt(SUN_MU * a_au * AU_TO_KM * (1.0 - e**2)) # Specific angular momentum
    vx_orb = -h * sin(true_anomaly) / r_km
    vy_orb = h * (e + cos(true_anomaly)) / r_km

    # Rotation angles
    i_rad = deg2rad(@elements[:inclination_deg])
    omega_rad = deg2rad(@elements[:argument_perihelion_deg])
    omega_asc_rad = deg2rad(@elements[:longitude_ascending_node_deg])

    # Rotation matrices to transform from orbital plane to ecliptic coordinates
    position = rotate_to_ecliptic([x_orb, y_orb, 0.0], omega_rad, i_rad, omega_asc_rad)
    velocity = rotate_to_ecliptic([vx_orb, vy_orb, 0.0], omega_rad, i_rad, omega_asc_rad)

    [position, velocity]
  end

  # Calculate Earth's position and velocity at given Julian date
  # Using simplified circular orbit approximation
  def calculate_earth_state_vectors(jd)
    # Earth's mean longitude (simplified)
    # J2000 epoch: JD 2451545.0
    j2000 = 2451545.0
    days_since_j2000 = jd - j2000

    # Earth's mean longitude increases by ~360°/365.25 days
    mean_longitude_deg = (100.46435 + 0.985609101 * days_since_j2000) % 360.0
    mean_longitude_rad = deg2rad(mean_longitude_deg)

    # Earth's orbital radius (approximately 1 AU)
    r_earth_km = 1.0 * AU_TO_KM

    # Earth position in ecliptic plane (circular orbit approximation)
    x = r_earth_km * cos(mean_longitude_rad)
    y = r_earth_km * sin(mean_longitude_rad)
    z = 0.0

    # Earth orbital velocity (approximately 29.78 km/s)
    v_earth = 29.78 # km/s
    vx = -v_earth * sin(mean_longitude_rad)
    vy = v_earth * cos(mean_longitude_rad)
    vz = 0.0

    [[x, y, z], [vx, vy, vz]]
  end

  # Calculate impact geometry: lat, lon, impact angle, azimuth
  def calculate_impact_geometry(rel_position, rel_velocity)
    # Normalize impact vector (points from Earth center to impact point)
    impact_vector = vector_normalize(rel_position)

    # Convert ECEF (Earth-Centered Earth-Fixed) to geographic coordinates
    # Note: This assumes rel_position is in Earth-centered coordinates
    # We need to account for Earth's rotation at encounter time
    lat, lng = ecef_to_latlon(impact_vector)

    # Impact angle: angle between velocity vector and local horizontal
    # Angle relative to surface normal
    velocity_norm = vector_normalize(rel_velocity)
    dot_product = vector_dot(velocity_norm, impact_vector)
    angle_from_vertical_rad = acos([[-1, dot_product].max, 1].min) # Clamp to [-1, 1]
    impact_angle_deg = 90.0 - rad2deg(angle_from_vertical_rad) # Convert to angle from horizontal

    # Ensure impact angle is between 5° and 90°
    impact_angle_deg = [[impact_angle_deg, 5.0].max, 90.0].min

    # Azimuth: direction of approach in local coordinate system
    azimuth_deg = calculate_azimuth(rel_velocity, impact_vector, lat, lng)

    {
      lat: lat.round(4),
      lng: lng.round(4),
      impact_angle_deg: impact_angle_deg.round(2),
      azimuth_deg: azimuth_deg.round(2)
    }
  end

  # Convert ECEF unit vector to latitude/longitude
  def ecef_to_latlon(unit_vector)
    x, y, z = unit_vector

    # Account for Earth's rotation at encounter time
    # Calculate Greenwich Mean Sidereal Time (GMST)
    gmst_rad = calculate_gmst(@encounter_jd)

    # Rotate from inertial frame to Earth-fixed frame
    x_fixed = x * cos(gmst_rad) + y * sin(gmst_rad)
    y_fixed = -x * sin(gmst_rad) + y * cos(gmst_rad)
    z_fixed = z

    # Convert to lat/lon
    longitude_rad = atan2(y_fixed, x_fixed)
    latitude_rad = asin(z_fixed) # Since input is unit vector

    lat = rad2deg(latitude_rad)
    lng = rad2deg(longitude_rad)

    # Normalize longitude to [-180, 180]
    lng = ((lng + 180.0) % 360.0) - 180.0

    [lat, lng]
  end

  # Calculate azimuth (direction of approach) in local horizontal coordinate system
  def calculate_azimuth(velocity_vector, impact_normal, lat, lng)
    # Project velocity onto local horizontal plane
    # Remove vertical component (along impact normal)
    v_norm = vector_normalize(velocity_vector)
    vertical_component = vector_dot(v_norm, impact_normal)
    horizontal_velocity = vector_subtract(v_norm, vector_scale(impact_normal, vertical_component))

    # If velocity is purely vertical, azimuth is undefined - default to 0
    return 0.0 if vector_magnitude(horizontal_velocity) < 0.01

    # Calculate azimuth relative to local North
    # This is simplified - a full implementation would use proper geodetic transforms
    lat_rad = deg2rad(lat)
    lng_rad = deg2rad(lng)

    # Local East-North-Up basis vectors
    east = [-sin(lng_rad), cos(lng_rad), 0.0]
    north = [-sin(lat_rad) * cos(lng_rad), -sin(lat_rad) * sin(lng_rad), cos(lat_rad)]

    # Project horizontal velocity onto east and north
    v_east = vector_dot(horizontal_velocity, east)
    v_north = vector_dot(horizontal_velocity, north)

    # Azimuth: angle from North, clockwise
    azimuth_rad = atan2(v_east, v_north)
    azimuth_deg = rad2deg(azimuth_rad)

    # Normalize to [0, 360)
    (azimuth_deg + 360.0) % 360.0
  end

  # Calculate Greenwich Mean Sidereal Time
  def calculate_gmst(jd)
    # Julian centuries from J2000.0
    t = (jd - 2451545.0) / 36525.0

    # GMST in degrees
    gmst_deg = 280.46061837 + 360.98564736629 * (jd - 2451545.0) +
               0.000387933 * t**2 - (t**3 / 38710000.0)

    # Convert to radians and normalize
    deg2rad(gmst_deg % 360.0)
  end

  # Solve Kepler's equation M = E - e*sin(E) for eccentric anomaly E
  # Using Newton-Raphson iteration
  def solve_kepler(mean_anomaly, eccentricity, tolerance = 1e-8, max_iterations = 50)
    e_anom = mean_anomaly # Initial guess

    max_iterations.times do
      f = e_anom - eccentricity * sin(e_anom) - mean_anomaly
      f_prime = 1.0 - eccentricity * cos(e_anom)
      delta = f / f_prime
      e_anom -= delta

      return e_anom if delta.abs < tolerance
    end

    e_anom # Return best estimate if not converged
  end

  # Calculate mean motion from semi-major axis (Kepler's 3rd law)
  def calculate_mean_motion(semi_major_axis_au)
    # n = sqrt(μ / a^3), returns deg/day
    a_km = semi_major_axis_au * AU_TO_KM
    n_rad_per_sec = sqrt(SUN_MU / a_km**3)
    n_deg_per_day = rad2deg(n_rad_per_sec) * 86400.0
    n_deg_per_day
  end

  # Rotate vector from orbital plane to ecliptic coordinates
  def rotate_to_ecliptic(vec, omega, inclination, omega_asc)
    x, y, z = vec

    # Rotation by argument of perihelion (ω)
    x1 = x * cos(omega) - y * sin(omega)
    y1 = x * sin(omega) + y * cos(omega)
    z1 = z

    # Rotation by inclination (i)
    x2 = x1
    y2 = y1 * cos(inclination) - z1 * sin(inclination)
    z2 = y1 * sin(inclination) + z1 * cos(inclination)

    # Rotation by longitude of ascending node (Ω)
    x3 = x2 * cos(omega_asc) - y2 * sin(omega_asc)
    y3 = x2 * sin(omega_asc) + y2 * cos(omega_asc)
    z3 = z2

    [x3, y3, z3]
  end

  # Vector operations
  def vector_subtract(v1, v2)
    [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]]
  end

  def vector_magnitude(v)
    sqrt(v[0]**2 + v[1]**2 + v[2]**2)
  end

  def vector_normalize(v)
    mag = vector_magnitude(v)
    return [0, 0, 0] if mag.zero?
    [v[0] / mag, v[1] / mag, v[2] / mag]
  end

  def vector_dot(v1, v2)
    v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]
  end

  def vector_scale(v, scalar)
    [v[0] * scalar, v[1] * scalar, v[2] * scalar]
  end

  # Angle conversions
  def deg2rad(degrees)
    degrees * PI / 180.0
  end

  def rad2deg(radians)
    radians * 180.0 / PI
  end

  # Time conversion
  def time_to_julian_date(time)
    # Convert Ruby Time to Julian Date
    # JD = 2440587.5 + (Unix timestamp / 86400)
    2440587.5 + (time.to_f / 86400.0)
  end
end
