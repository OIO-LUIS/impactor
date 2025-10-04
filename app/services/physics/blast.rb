# frozen_string_literal: true

module Physics
  class Blast
    include Utils

    # Scales from yield (J), angle, and burst height to several overpressure bands.
    # We convert Joules to TNT equivalent and use a simple cube-root scaling for standoff distance.
    def initialize(energy_joules, angle_rad, burst_alt_m)
      @E_j  = energy_joules.to_f
      @E_mt = @E_j / 4.184e15 # 1 Mt TNT = 4.184e15 J
      @h_km = burst_alt_m.to_f / 1000.0
    end

    def calculate_all_radii
      # Reference radii at sea-level surface burst (rough ballpark):
      # severe: ~20 psi, moderate: ~5 psi, windows: ~1 psi; vaporization ~ extremely near.
      # Use R ~ k * (Mt)^(1/3). Coefficients are tuned for visual plausibility, not engineering accuracy.
      k_vap   = 0.9   # km
      k_sev   = 4.5   # km
      k_mod   = 8.5   # km
      k_win   = 15.0  # km
      k_minor = 25.0  # km

      f = (@E_mt > 0 ? @E_mt ** (1.0/3.0) : 0.0)

      # Very crude correction for airburst height: reduce near-field, extend moderate slightly.
      h_corr = Utils.clamp(1.0 - 0.02 * @h_km, 0.5, 1.0)

      {
        vaporization_km:   (k_vap   * f * h_corr),
        severe_blast_km:   (k_sev   * f * h_corr),
        moderate_blast_km: (k_mod   * f),
        window_damage_km:  (k_win   * f),
        minor_damage_km:   (k_minor * f)
      }
    end

    def peak_overpressure_psi
      # Simplified estimate at severe radius (~20 psi)
      20.0
    end
  end
end
