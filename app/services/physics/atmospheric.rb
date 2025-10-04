# frozen_string_literal: true

module Physics
  class Atmospheric
    include Utils

    def initialize(energy_mt:, burst_altitude_km:, ejecta_volume_km3:)
      @E_mt = energy_mt.to_f
      @h_km = burst_altitude_km.to_f
      @ejecta_km3 = ejecta_volume_km3.to_f
    end

    def calculate_all
      return base if @E_mt <= 0.0

      # Very rough proxies
      ozone_depletion = Utils.clamp(2.0 * Math.log10(@E_mt + 1.0), 0.0, 35.0) # %
      aerosol_optical_depth = Utils.clamp(0.01 * @E_mt ** 0.6 + 0.02 * @ejecta_km3 ** 0.5, 0.0, 3.0)
      nuclear_winter_risk = Utils.clamp(aerosol_optical_depth / 3.0, 0.0, 1.0)

      {
        ozone_depletion_percent: ozone_depletion,
        aerosol_optical_depth:   aerosol_optical_depth,
        nuclear_winter_risk:     nuclear_winter_risk
      }
    end

    private

    def base
      {
        ozone_depletion_percent: 0.0,
        aerosol_optical_depth:   0.0,
        nuclear_winter_risk:     0.0
      }
    end
  end
end
