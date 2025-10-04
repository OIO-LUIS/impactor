# frozen_string_literal: true

module Physics
  class Thermal
    include Utils

    def initialize(energy_mt, burst_height_km)
      @E_mt = energy_mt.to_f
      @h_km = burst_height_km.to_f
    end

    def calculate_all
      return base unless @E_mt.positive?

      # Thermal radius scales sublinearly; airburst height reduces near-field burns
      r_th_km = 10.0 * (@E_mt ** 0.4) * Utils.clamp(1.2 - 0.05 * @h_km, 0.6, 1.2)

      base.merge(
        thermal_radiation_radius_km: r_th_km
      )
    end

    private

    def base
      {
        thermal_radiation_radius_km: 0.0
      }
    end
  end
end
