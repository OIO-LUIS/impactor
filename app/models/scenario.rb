class Scenario < ApplicationRecord
  belongs_to :neo, optional: true

  validates :diameter_m, :density_kg_m3, :velocity_kms,
            :impact_angle_deg, :lat, :lng,
            presence: true

  validates :diameter_m, :density_kg_m3, :velocity_kms,
            numericality: { greater_than: 0 }
  validates :impact_angle_deg, numericality: { greater_than: 0, less_than_or_equal_to: 90 }
  validates :lat, numericality: { greater_than_or_equal_to: -90, less_than_or_equal_to: 90 }
  validates :lng, numericality: { greater_than_or_equal_to: -180, less_than_or_equal_to: 180 }
  validates :delta_v_ms, numericality: { greater_than_or_equal_to: 0 }
  validates :lead_time_days, numericality: { greater_than_or_equal_to: 0 }
end
