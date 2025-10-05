class HomeController < ApplicationController
  def the_weather
    # Your code to fetch and display the weather goes here
  end

  def index
  end

  def simulation
    # Main simulation interface
    @recent_scenarios = Scenario.includes(:neo)
                                .order(created_at: :desc)
                                .limit(10)
    @hazardous_neos = Neo
                         .order(absolute_magnitude_h: :asc)
                         .limit(20)
  end

  def impact_cerium
    @defaults = {
      diameter_m: 500,
      density_kg_m3: 3500,
      velocity_kms: 25,
      impact_angle_deg: 45,
      lat: 10.0,
      lng: -84.0,
      mitigation_type: "none"
    }
  end

  def gaming

  end
end
