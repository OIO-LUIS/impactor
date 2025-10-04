# frozen_string_literal: true

module Physics
  class Tsunami
    include Utils

    def initialize(energy_j:, depth_m:, angle_rad:)
      @E = energy_j.to_f
      @depth_m = depth_m.to_f
      @ang = angle_rad.to_f
    end

    def calculate_all
      return base if @E <= 0.0 || @depth_m <= 50.0

      # Wave height proxies at 100 km and 1000 km, rising with sqrt(E) and shallow depth effects
      # (This is intentionally conservative and purely for visualization.)
      scale = Math.sqrt(@E) / Math.sqrt(1e15) # normalized
      depth_factor = Utils.clamp(@depth_m / 4000.0, 0.2, 1.2)
      direction_factor = Utils.clamp(0.6 + 0.4 * Math.cos(@ang), 0.2, 1.0)

      h100 = 2.0 * scale * depth_factor * direction_factor
      h1000 = 0.35 * scale * Math.sqrt(depth_factor) * direction_factor

      {
        tsunami_100km_m:  h100,
        tsunami_1000km_m: h1000,
        tsunami_radius_km: 500.0 # visualize near-field extent
      }
    end

    private

    def base
      { tsunami_100km_m: 0.0, tsunami_1000km_m: 0.0, tsunami_radius_km: 0.0 }
    end
  end
end
