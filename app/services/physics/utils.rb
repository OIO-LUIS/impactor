# frozen_string_literal: true

module Physics
  module Utils
    EARTH_RADIUS_KM = 6371.0
    EARTH_RADIUS_M  = EARTH_RADIUS_KM * 1000.0
    PI = Math::PI

    module_function

    def deg2rad(deg) = deg * PI / 180.0
    def rad2deg(rad) = rad * 180.0 / PI

    # Great-circle destination given start lat/lon (deg), bearing (deg), and arc distance (radians on a sphere)
    def gc_destination(lat_deg, lon_deg, bearing_deg, arc_rad)
      lat1 = deg2rad(lat_deg)
      lon1 = deg2rad(lon_deg)
      brg  = deg2rad(bearing_deg)

      lat2 = Math.asin(Math.sin(lat1) * Math.cos(arc_rad) + Math.cos(lat1) * Math.sin(arc_rad) * Math.cos(brg))
      lon2 = lon1 + Math.atan2(
        Math.sin(brg) * Math.sin(arc_rad) * Math.cos(lat1),
        Math.cos(arc_rad) - Math.sin(lat1) * Math.sin(lat2)
      )

      [rad2deg(lat2), normalize_lon(rad2deg(lon2))]
    end

    # Convert meters along Earth surface to central angle (radians) on a sphere
    def arc_from_meters(meters)
      meters / EARTH_RADIUS_M
    end

    def clamp(v, lo, hi)
      return lo if v < lo
      return hi if v > hi
      v
    end

    def normalize_lon(lon)
      # Normalize to [-180, 180)
      ((lon + 180) % 360) - 180
    end

    def safe_float(x, fallback = 0.0)
      f = Float(x) rescue nil
      f.nil? ? fallback : f
    end

    # Simple power-law scaler with guardrails
    def scale_with_exponent(value, factor, exponent)
      return 0.0 if value.nil?
      value * (factor ** exponent)
    end
  end
end
