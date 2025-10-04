# frozen_string_literal: true

module Physics
  class Seismic
    include Utils

    # Convert a fraction of impact energy into seismic magnitude & damage radius.
    def initialize(ground_energy_joules, lat, lng)
      @E = ground_energy_joules.to_f
      @lat = lat
      @lng = lng
    end

    def calculate_all
      return base if @E <= 0.0

      # Gutenberg–Richter-like proxy: M ~ (2/3) log10(E) - 3.2, E in Joules
      m = (2.0 / 3.0) * Math.log10(@E) - 3.2
      m = Utils.clamp(m, 0.0, 9.5)

      # Damage radius for strong shaking (felt/structural): scale with M exponentially
      r_km = 10.0 * (10.0 ** (0.25 * (m - 5.0))) # ~10km @M5, ~56km @M7

      {
        seismic_magnitude: m,
        seismic_damage_radius_km: r_km
      }
    end

    private

    def base
      { seismic_magnitude: 0.0, seismic_damage_radius_km: 0.0 }
    end
  end
end
