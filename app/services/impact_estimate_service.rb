# Simplified impact physics (clear units; swap in calibrated coeffs later)
class ImpactEstimateService
  def initialize(diameter_m:, density_kg_m3:, velocity_kms:, impact_angle_deg:)
    @d  = diameter_m
    @ρi = density_kg_m3
    @v  = velocity_kms * 1_000.0 # m/s
    @θ  = impact_angle_deg * Math::PI / 180.0
  end

  def call
    mass_kg   = @ρi * (Math::PI / 6.0) * @d**3
    energy_j  = 0.5 * mass_kg * @v**2
    energy_mt = energy_j / 4.184e15

    g = 9.81
    ρt = 2700.0
    d_tr = 1.161 * (g**(-0.17)) * ((@ρi/ρt)**(1.0/3.0)) * (@d**0.83) * (@v**0.44) * (Math.sin(@θ)**(1.0/3.0))
    d_final = 1.3 * d_tr

    {
      mass_kg: mass_kg,
      energy_megatons_tnt: energy_mt,
      transient_crater_d_m: d_tr,
      final_crater_d_m: d_final,
      severe_blast_radius_km: (energy_mt**(1.0/3.4)) * 8.0,
      window_damage_radius_km: (energy_mt**(1.0/3.8)) * 30.0
    }
  end
end
