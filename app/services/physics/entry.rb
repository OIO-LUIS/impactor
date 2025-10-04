# frozen_string_literal: true

module Physics
  class Entry
    include Utils

    # Very simplified entry model:
    # - Decide airburst altitude using dynamic pressure ~ 1/2 rho_air v^2 vs. material strength
    # - Produce a short "track" with altitude, velocity, mass over path length s
    #
    # Inputs:
    #   diameter_m:, density_kg_m3:, velocity_kms:, impact_angle_deg:, strength_mpa:
    #
    def initialize(diameter_m:, density_kg_m3:, velocity_kms:, impact_angle_deg:, strength_mpa:)
      @d   = diameter_m.to_f
      @rho = density_kg_m3.to_f
      @v0  = (velocity_kms.to_f * 1000.0)  # m/s
      @ang = Utils.deg2rad(impact_angle_deg.to_f)  # from horizontal
      @Y   = (strength_mpa.to_f * 1e6)  # Pa
      @area = PI * (@d / 2.0)**2
      @mass = (4.0/3.0) * PI * (@d / 2.0)**3 * @rho
    end

    def run
      # Atmospheric density model (scale height ~ 8km), rho = rho0 * exp(-h/H)
      rho0 = 1.225        # kg/m^3 at sea level
      h_H    = 8000.0       # m
      v    = @v0
      m    = @mass
      s    = 0.0          # downtrack distance (m)
      t    = 0.0
      dt   = 0.25         # s, small step for a small track
      h    = 80000.0      # start at 80 km
      cd   = 1.0

      track = []

      airburst = nil
      impact   = nil

      0.upto(600) do |_step|
        rho_air = rho0 * Math.exp(-h / h_H)
        q       = 0.5 * rho_air * v * v  # dynamic pressure
        # crude deceleration from drag
        a_drag  = (cd * q * @area) / m   # m/s^2
        v       = [v - a_drag * dt, 0.0].max

        # descend along trajectory
        dh = -v * Math.sin(@ang) * dt
        h  = h + dh
        h  = 0.0 if h < 0.0

        s += (v * Math.cos(@ang) * dt)

        track << { h_m: h, v_ms: v, m_kg: m, s_m: s }

        # Airburst if dynamic pressure exceeds material strength (common heuristic)
        if airburst.nil? && q >= @Y && h > 0
          airburst = {
            alt_m: h,
            v_ms:  v,
            m_kg:  m,
            s_m:   s
          }
          break
        end

        # Ground impact
        if h <= 0.0
          impact = {
            v_ms: v,
            m_kg: m,
            ke_j: 0.5 * m * v*v
          }
          break
        end

        t += dt
      end

      # If neither triggered, assume it strikes ground with last state
      if airburst.nil? && impact.nil?
        impact = {
          v_ms: track.last[:v_ms],
          m_kg: track.last[:m_kg],
          ke_j: 0.5 * track.last[:m_kg] * (track.last[:v_ms]**2)
        }
      end

      OpenStruct.new(
        airburst: airburst,
        impact:   impact,
        track:    track
      )
    end
  end
end
