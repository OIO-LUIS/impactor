class Neo < ApplicationRecord
  has_many :scenarios, dependent: :nullify

  validates :neo_reference_id, presence: true, uniqueness: true
  validates :name, presence: true

  # Convenience helpers (optional)
  def median_diameter_m
    [est_diameter_m_min, est_diameter_m_max].compact.then { |a| return nil if a.empty?; a.sum / a.size }
  end
end
