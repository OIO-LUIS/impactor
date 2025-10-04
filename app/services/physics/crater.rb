# frozen_string_literal: true

module Physics
  class Crater
    include Utils

    # Very simplified pi-scaling inspired relations.
    def initialize(mass_kg:, velocity_ms:, angle_rad:, target_density:)
      @m   = mass_kg.to_f
      @v   = velocity_ms.to_f
      @ang = angle_rad.to_f
      @rho_t = target_density.to_f # 2650 rock, ~1030 water
    end

    def calculate_all
      ke = 0.5 * @m * @v * @v # J

      # "Effective" normal component
      v_n = @v * Math.sin(@ang)
      ke_n = 0.5 * @m * v_n * v_n

      # Transient diameter (m) ~ c * (KE_n)^(1/4)   (very rough)
      dt = 1.8 * (ke_n ** 0.25)

      # Final crater larger for rock, smaller for water; apply density correction
      density_factor = Utils.clamp(@rho_t / 2650.0, 0.35, 1.0)
      df = dt * (1.25 * density_factor)

      depth = df * 0.2
      rim_h = df * 0.04
      central_peak = df * 0.05

      {
        transient_diameter_m: dt,
        final_diameter_m:     df,
        depth_m:              depth,
        rim_height_m:         rim_h,
        central_peak_m:       central_peak
      }
    end
  end
end
