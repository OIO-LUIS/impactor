# frozen_string_literal: true

module Physics
  class Ejecta
    include Utils

    def initialize(crater_diameter_m:, crater_depth_m:, energy_j:, impact_angle_rad:)
      @dc = crater_diameter_m.to_f
      @depth = crater_depth_m.to_f
      @E = energy_j.to_f
      @ang = impact_angle_rad.to_f
    end

    def calculate_all
      return base if @dc <= 0.0

      # Blanket typically extends a few crater radii; scale with energy & angle
      radius_km = (@dc / 1000.0) * (2.5 + 1.0 * Math.sin(@ang))
      volume_km3 = ((PI * (@dc/2.0)**2) * @depth) / 1e9

      # Characteristic ejecta velocity (km/s) proxy
      v_kms = Utils.clamp(0.15 * (@E ** 0.05), 0.1, 2.5)

      {
        ejecta_radius_km:     radius_km,
        ejecta_volume_km3:    volume_km3,
        ejecta_velocity_kms:  v_kms
      }
    end

    private

    def base
      { ejecta_radius_km: 0.0, ejecta_volume_km3: 0.0, ejecta_velocity_kms: 0.0 }
    end
  end
end
