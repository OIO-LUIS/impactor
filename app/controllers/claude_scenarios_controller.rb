# app/controllers/scenarios_controller.rb
class ScenariosController < ApplicationController
  before_action :set_impact_params, only: [:simulate]
  
  def index
    # Main simulation interface
    @recent_scenarios = Scenario.includes(:neo)
                                .order(created_at: :desc)
                                .limit(10)
    @hazardous_neos = Neo
                         .order(absolute_magnitude_h: :asc)
                         .limit(20)
  end

  def simulate
    # Initialize physics engine with comprehensive parameters
    engine = Physics::Engine.new(
      diameter_m: @impact_params[:diameter_m],
      density_kg_m3: @impact_params[:density_kg_m3],
      velocity_kms: @impact_params[:velocity_kms],
      impact_angle_deg: @impact_params[:impact_angle_deg],
      lat: @impact_params[:lat],
      lng: @impact_params[:lng],
      strength_mpa: @impact_params[:strength_mpa] || 10.0,
      azimuth_deg: @impact_params[:azimuth_deg] || 0.0,
      ocean_depth_m: ocean_depth_at(@impact_params[:lat], @impact_params[:lng]),
      atmospheric_density_profile: atmospheric_profile,
      mitigation_type: @impact_params[:mitigation_type],
      mitigation_params: mitigation_parameters
    )
    
    # Run simulation
    results = engine.run
    
    # Enhance results with additional analysis
    enhanced_results = enhance_simulation_results(results, engine)
    
    # Save scenario to database
    scenario = save_scenario(enhanced_results)
    
    # Broadcast real-time updates if significant
    broadcast_if_significant(scenario, enhanced_results)
    
    render json: enhanced_results
  rescue => e
    Rails.logger.error "Simulation error: #{e.message}"
    render json: { ok: false, error: e.message }, status: :unprocessable_entity
  end

  def neo_data
    # API endpoint for NEO selection
    neos = Neo.includes(:close_approaches)
    
    case params[:filter]
    when 'recent'
      neos = neos.with_recent_approaches(30.days.from_now)
    when 'hazardous'
      neos = neos.potentially_hazardous
    when 'sentry'
      neos = neos.where(sentry_object: true)
    end
    
    render json: neos.limit(100).map { |neo| neo_summary(neo) }
  end

  def export_scenario
    scenario = Scenario.find(params[:id])
    
    respond_to do |format|
      format.json { render json: scenario_export(scenario) }
      format.pdf { send_data generate_pdf_report(scenario), filename: "impact_#{scenario.id}.pdf" }
      format.csv { send_data generate_csv_data(scenario), filename: "impact_#{scenario.id}.csv" }
    end
  end

  private

  def set_impact_params
    @impact_params = params.permit(
      :diameter_m, :density_kg_m3, :velocity_kms, :impact_angle_deg,
      :lat, :lng, :strength_mpa, :azimuth_deg, :neo_id,
      :mitigation_type, :delta_v_ms, :lead_time_days
    ).transform_values { |v| v.to_f rescue v }
    
    # Load NEO data if selected
    if @impact_params[:neo_id].present?
      neo = Neo.find(@impact_params[:neo_id])
      @impact_params.merge!(neo_parameters(neo))
    end
  end

  def neo_parameters(neo)
    {
      diameter_m: neo.est_diameter_m_max,
      density_kg_m3: neo.estimated_density || 3000,
      velocity_kms: neo.typical_approach_velocity || 20
    }
  end

  def ocean_depth_at(lat, lng)
    # Query bathymetry service or database
    BathymetryService.depth_at(lat, lng)
  rescue
    0 # Default to land impact if service unavailable
  end

  def atmospheric_profile
    # Standard atmosphere model
    {
      scale_height_km: 8.5,
      surface_density_kg_m3: 1.225,
      layers: [
        { altitude_km: 0, density: 1.225, temperature: 288 },
        { altitude_km: 11, density: 0.364, temperature: 217 },
        { altitude_km: 20, density: 0.088, temperature: 217 },
        { altitude_km: 32, density: 0.013, temperature: 229 },
        { altitude_km: 47, density: 0.002, temperature: 271 },
        { altitude_km: 85, density: 0.0000066, temperature: 187 }
      ]
    }
  end

  def mitigation_parameters
    return {} unless @impact_params[:mitigation_type].present?
    
    case @impact_params[:mitigation_type]
    when 'deflection'
      {
        delta_v_ms: @impact_params[:delta_v_ms] || 1.0,
        lead_time_days: @impact_params[:lead_time_days] || 365
      }
    when 'ablation'
      {
        laser_power_gw: 1.0,
        duration_days: 30
      }
    when 'nuclear'
      {
        yield_mt: 1.0,
        standoff_distance_m: 100
      }
    else
      {}
    end
  end

  def enhance_simulation_results(results, engine)
    enhanced = results.deep_dup
    
    # Add comprehensive damage assessment
    enhanced[:damage_assessment] = calculate_damage_assessment(results)
    
    # Add population impact analysis
    enhanced[:population_impact] = analyze_population_impact(results, @impact_params[:lat], @impact_params[:lng])
    
    # Add infrastructure analysis
    enhanced[:infrastructure] = analyze_infrastructure_impact(results, @impact_params[:lat], @impact_params[:lng])
    
    # Add evacuation planning
    enhanced[:evacuation] = calculate_evacuation_requirements(results)
    
    # Add timeline data for animation
    enhanced[:timeline] = generate_impact_timeline(engine, results)
    
    # Add visualization data
    enhanced[:visualization] = {
      entry_track: generate_entry_trajectory(engine),
      debris_paths: calculate_debris_trajectories(results),
      shockwave_progression: calculate_shockwave_progression(results),
      rings: generate_damage_rings(results)
    }
    
    enhanced
  end

  def calculate_damage_assessment(results)
    energy_mt = results[:energy_megatons_tnt] || 0
    
    {
      threat_level: determine_threat_level(energy_mt),
      immediate_casualties: estimate_casualties(results, 'immediate'),
      total_casualties: estimate_casualties(results, 'total'),
      economic_impact_usd: estimate_economic_impact(results),
      recovery_time_years: estimate_recovery_time(results),
      global_effects: assess_global_effects(results)
    }
  end

  def determine_threat_level(energy_mt)
    case energy_mt
    when 0...1 then 'MINIMAL'
    when 1...10 then 'MINOR'
    when 10...100 then 'MODERATE'
    when 100...1000 then 'MAJOR'
    when 1000...10000 then 'SEVERE'
    else 'EXTINCTION'
    end
  end

  def analyze_population_impact(results, lat, lng)
    radius_km = results[:severe_blast_radius_km] || 0
    
    # Query population database
    cities = City.within_radius(lat, lng, radius_km * 2)
    
    affected_population = cities.sum do |city|
      distance_km = haversine_distance(lat, lng, city.latitude, city.longitude)
      impact_factor = calculate_impact_factor(distance_km, results)
      (city.population * impact_factor).to_i
    end
    
    {
      total_affected: affected_population,
      cities_impacted: cities.map { |c| { name: c.name, population: c.population } },
      evacuation_required: results[:evacuation_radius_km] || 0,
      shelter_capacity_needed: (affected_population * 0.3).to_i
    }
  end

  def analyze_infrastructure_impact(results, lat, lng)
    radius_km = results[:severe_blast_radius_km] || 0
    
    {
      power_plants_affected: count_infrastructure('power_plant', lat, lng, radius_km),
      hospitals_affected: count_infrastructure('hospital', lat, lng, radius_km),
      airports_affected: count_infrastructure('airport', lat, lng, radius_km),
      ports_affected: count_infrastructure('port', lat, lng, radius_km),
      road_network_disrupted_km: estimate_road_disruption(lat, lng, radius_km),
      communication_outage_radius_km: results[:emp_radius_km] || radius_km * 1.5
    }
  end

  def calculate_evacuation_requirements(results)
    {
      immediate_evacuation_radius_km: results[:severe_blast_radius_km] || 0,
      extended_evacuation_radius_km: results[:radiation_radius_km] || results[:window_damage_radius_km] || 0,
      time_available_hours: calculate_warning_time(results),
      transport_required: estimate_transport_needs(results),
      shelter_locations: identify_shelter_locations(results)
    }
  end

  def generate_impact_timeline(engine, results)
    timeline = []
    
    # Pre-impact phase (-60 seconds to impact)
    60.downto(1) do |seconds|
      timeline << {
        time_to_impact_s: -seconds,
        altitude_km: engine.altitude_at_time(-seconds),
        velocity_kms: engine.velocity_at_time(-seconds),
        energy_released_mt: 0,
        position: engine.position_at_time(-seconds),
        effects: {}
      }
    end
    
    # Impact moment
    timeline << {
      time_to_impact_s: 0,
      altitude_km: results[:burst_alt_km] || 0,
      velocity_kms: results[:final_velocity_kms] || @impact_params[:velocity_kms],
      energy_released_mt: results[:energy_megatons_tnt],
      position: { lat: @impact_params[:lat], lng: @impact_params[:lng] },
      effects: {
        shockwave_radius_km: 0,
        thermal_radius_km: 0,
        seismic_magnitude: results[:seismic_magnitude]
      }
    }
    
    # Post-impact phase (0 to 300 seconds)
    1.upto(300) do |seconds|
      timeline << {
        time_to_impact_s: seconds,
        altitude_km: 0,
        velocity_kms: 0,
        energy_released_mt: results[:energy_megatons_tnt],
        position: { lat: @impact_params[:lat], lng: @impact_params[:lng] },
        effects: {
          shockwave_radius_km: calculate_shockwave_radius_at_time(seconds, results),
          thermal_radius_km: calculate_thermal_radius_at_time(seconds, results),
          debris_cloud_radius_km: calculate_debris_radius_at_time(seconds, results)
        }
      }
    end
    
    timeline
  end

  def generate_entry_trajectory(engine)
    points = []
    
    # Calculate entry trajectory from 1000km altitude
    distance_km = 1000
    steps = 50
    
    (0..steps).each do |i|
      altitude = distance_km * (1 - i.to_f / steps)
      position = engine.trajectory_position_at_altitude(altitude)
      points << {
        lat: position[:lat],
        lng: position[:lng],
        altitude_km: altitude
      }
    end
    
    points
  end

  def calculate_debris_trajectories(results)
    return [] unless results[:ejecta_volume_km3] && results[:ejecta_volume_km3] > 0
    
    # Generate ballistic trajectories for major debris
    trajectories = []
    num_paths = [results[:ejecta_volume_km3] * 10, 20].min.to_i
    
    num_paths.times do |i|
      angle = (360.0 / num_paths) * i
      range_km = results[:ejecta_range_km] || results[:crater_diameter_m].to_f / 2000
      
      trajectory = calculate_ballistic_path(
        @impact_params[:lat],
        @impact_params[:lng],
        angle,
        range_km,
        results[:ejecta_velocity_kms] || 1.0
      )
      
      trajectories << trajectory
    end
    
    trajectories
  end

  def calculate_shockwave_progression(results)
    progression = []
    blast_radius = results[:severe_blast_radius_km] || 0
    
    return [] if blast_radius == 0
    
    # Generate concentric shockwave rings
    10.times do |i|
      progression << {
        time_s: i * 2,
        radius_km: blast_radius * (i + 1) / 10.0,
        overpressure_psi: results[:peak_overpressure_psi] * (10 - i) / 10.0
      }
    end
    
    progression
  end

  def generate_damage_rings(results)
    rings = []
    
    # Add rings from innermost to outermost
    damage_zones = [
      { key: :vaporization_radius_km, color: '#ff1744', label: 'Complete Vaporization' },
      { key: :crater_rim_radius_km, color: '#ff4d4f', label: 'Crater Rim' },
      { key: :severe_blast_radius_km, color: '#ff6b35', label: 'Severe Blast Damage' },
      { key: :thermal_radiation_radius_km, color: '#ff5722', label: 'Third-degree Burns' },
      { key: :moderate_blast_radius_km, color: '#ff9800', label: 'Moderate Blast Damage' },
      { key: :window_damage_radius_km, color: '#ffa940', label: 'Window Shattering' },
      { key: :seismic_damage_radius_km, color: '#9c27b0', label: 'Seismic Damage' },
      { key: :minor_damage_radius_km, color: '#ffd666', label: 'Minor Damage' }
    ]
    
    damage_zones.each do |zone|
      if results[zone[:key]] && results[zone[:key]] > 0
        rings << {
          radius_km: results[zone[:key]],
          color: zone[:color],
          label: zone[:label]
        }
      end
    end
    
    # Add tsunami ring for ocean impacts
    if results[:tsunami_100km_m] && results[:tsunami_100km_m] > 1
      rings << {
        radius_km: 100,
        color: '#00acc1',
        label: "Tsunami Wave (#{results[:tsunami_100km_m].round(1)}m @ 100km)"
      }
    end
    
    rings
  end

  def save_scenario(results)
    scenario = Scenario.create!(
      neo_id: @impact_params[:neo_id],
      diameter_m: @impact_params[:diameter_m],
      density_kg_m3: @impact_params[:density_kg_m3],
      velocity_kms: @impact_params[:velocity_kms],
      impact_angle_deg: @impact_params[:impact_angle_deg],
      lat: @impact_params[:lat],
      lng: @impact_params[:lng],
      delta_v_ms: @impact_params[:delta_v_ms] || 0,
      lead_time_days: @impact_params[:lead_time_days] || 0,
      results: results
    )
    
    # Queue background job for detailed analysis
    ImpactAnalysisJob.perform_later(scenario.id)
    
    scenario
  end

  def broadcast_if_significant(scenario, results)
    threat_level = results[:damage_assessment][:threat_level]
    
    if %w[MAJOR SEVERE EXTINCTION].include?(threat_level)
      ActionCable.server.broadcast(
        'neo_updates',
        {
          type: 'impact_alert',
          message: "#{threat_level} threat level impact simulated",
          scenario_id: scenario.id,
          location: { lat: scenario.lat, lng: scenario.lng },
          energy_mt: results[:energy_megatons_tnt]
        }
      )
    end
  end

  # Helper methods
  def haversine_distance(lat1, lng1, lat2, lng2)
    rad_per_deg = Math::PI / 180
    earth_radius_km = 6371
    
    dlat = (lat2 - lat1) * rad_per_deg
    dlng = (lng2 - lng1) * rad_per_deg
    
    a = Math.sin(dlat / 2)**2 + 
        Math.cos(lat1 * rad_per_deg) * Math.cos(lat2 * rad_per_deg) * 
        Math.sin(dlng / 2)**2
    
    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    
    earth_radius_km * c
  end

  def calculate_ballistic_path(lat, lng, azimuth_deg, range_km, velocity_kms)
    points = []
    steps = 20
    
    (0..steps).each do |i|
      fraction = i.to_f / steps
      distance = range_km * fraction
      
      # Calculate new position along great circle
      bearing_rad = azimuth_deg * Math::PI / 180
      lat_rad = lat * Math::PI / 180
      lng_rad = lng * Math::PI / 180
      angular_distance = distance / 6371.0
      
      new_lat = Math.asin(
        Math.sin(lat_rad) * Math.cos(angular_distance) +
        Math.cos(lat_rad) * Math.sin(angular_distance) * Math.cos(bearing_rad)
      )
      
      new_lng = lng_rad + Math.atan2(
        Math.sin(bearing_rad) * Math.sin(angular_distance) * Math.cos(lat_rad),
        Math.cos(angular_distance) - Math.sin(lat_rad) * Math.sin(new_lat)
      )
      
      # Calculate altitude (parabolic trajectory)
      max_altitude = range_km * 0.25
      altitude = max_altitude * 4 * fraction * (1 - fraction)
      
      points << {
        lat: new_lat * 180 / Math::PI,
        lng: new_lng * 180 / Math::PI,
        altitude_km: altitude
      }
    end
    
    points
  end

  def calculate_impact_factor(distance_km, results)
    return 1.0 if distance_km == 0
    
    severe_radius = results[:severe_blast_radius_km] || 10
    moderate_radius = results[:window_damage_radius_km] || 50
    
    if distance_km <= severe_radius
      1.0 - (distance_km / severe_radius) * 0.1
    elsif distance_km <= moderate_radius
      0.9 * (1.0 - (distance_km - severe_radius) / (moderate_radius - severe_radius))
    else
      0
    end
  end

  def estimate_casualties(results, type)
    base_casualties = (results[:energy_megatons_tnt] || 0) * 1000
    
    case type
    when 'immediate'
      (base_casualties * 0.3).to_i
    when 'total'
      base_casualties.to_i
    else
      0
    end
  end

  def estimate_economic_impact(results)
    energy_mt = results[:energy_megatons_tnt] || 0
    radius_km = results[:severe_blast_radius_km] || 0
    
    # Base economic impact calculation
    infrastructure_damage = radius_km ** 2 * 1_000_000_000  # $1B per km²
    cleanup_costs = energy_mt * 10_000_000_000  # $10B per megaton
    economic_disruption = infrastructure_damage * 5  # 5x multiplier for economic disruption
    
    (infrastructure_damage + cleanup_costs + economic_disruption).to_i
  end

  def estimate_recovery_time(results)
    energy_mt = results[:energy_megatons_tnt] || 0
    
    case energy_mt
    when 0...10 then 0.5
    when 10...100 then 2
    when 100...1000 then 10
    when 1000...10000 then 50
    else 100
    end
  end

  def assess_global_effects(results)
    effects = []
    energy_mt = results[:energy_megatons_tnt] || 0
    
    effects << 'Local damage only' if energy_mt < 10
    effects << 'Regional climate effects' if energy_mt >= 100
    effects << 'Global cooling (nuclear winter)' if energy_mt >= 1000
    effects << 'Mass extinction event' if energy_mt >= 10000
    effects << 'Ozone layer depletion' if results[:altitude_of_burst_km].to_f > 20
    effects << 'Global tsunami' if results[:tsunami_100km_m].to_f > 10
    effects << 'Agricultural collapse' if energy_mt >= 5000
    
    effects
  end

  def count_infrastructure(type, lat, lng, radius_km)
    # This would query an infrastructure database
    # Placeholder implementation
    case type
    when 'power_plant'
      (radius_km / 50).to_i
    when 'hospital'
      (radius_km / 10).to_i
    when 'airport'
      (radius_km / 100).to_i
    when 'port'
      (radius_km / 150).to_i
    else
      0
    end
  end

  def estimate_road_disruption(lat, lng, radius_km)
    # Estimate based on typical road density
    Math::PI * radius_km ** 2 * 10  # 10 km of road per km²
  end

  def calculate_warning_time(results)
    # Based on detection capabilities and orbital mechanics
    detection_range_au = 0.1  # Typical NEO detection range
    approach_velocity_kms = @impact_params[:velocity_kms] || 20
    
    warning_time_days = (detection_range_au * 149_597_870.7) / (approach_velocity_kms * 86400)
    warning_time_days * 24  # Convert to hours
  end

  def estimate_transport_needs(results)
    population = results[:population_impact][:total_affected] rescue 0
    
    {
      buses_required: (population / 50.0).ceil,
      trains_required: (population / 1000.0).ceil,
      evacuation_routes: (population / 10000.0).ceil,
      total_vehicles: (population / 4.0).ceil
    }
  end

  def identify_shelter_locations(results)
    # This would query a shelter database
    # Placeholder implementation
    radius_km = results[:evacuation_radius_km] || 100
    
    [
      { name: 'Emergency Shelter Alpha', capacity: 10000, distance_km: radius_km + 10 },
      { name: 'Emergency Shelter Beta', capacity: 5000, distance_km: radius_km + 20 },
      { name: 'Emergency Shelter Gamma', capacity: 15000, distance_km: radius_km + 15 }
    ]
  end

  def calculate_shockwave_radius_at_time(seconds, results)
    blast_velocity_kms = 0.34  # Speed of sound
    max_radius = results[:severe_blast_radius_km] || 0
    current_radius = [blast_velocity_kms * seconds, max_radius].min
    current_radius
  end

  def calculate_thermal_radius_at_time(seconds, results)
    # Thermal radiation travels at speed of light, essentially instantaneous
    return results[:thermal_radiation_radius_km] || 0 if seconds > 0
    0
  end

  def calculate_debris_radius_at_time(seconds, results)
    return 0 unless results[:ejecta_velocity_kms]
    
    ejecta_velocity = results[:ejecta_velocity_kms] || 1.0
    max_radius = results[:ejecta_range_km] || 100
    
    # Ballistic trajectory timing
    time_to_max_range = max_radius / ejecta_velocity
    current_radius = if seconds < time_to_max_range
      ejecta_velocity * seconds
    else
      max_radius
    end
    
    current_radius
  end

  def neo_summary(neo)
    {
      id: neo.id,
      name: neo.name,
      diameter_min_m: neo.est_diameter_m_min,
      diameter_max_m: neo.est_diameter_m_max,
      potentially_hazardous: neo.potentially_hazardous,
      absolute_magnitude: neo.absolute_magnitude_h,
      next_approach: neo.next_close_approach,
      velocity_kms: neo.typical_approach_velocity
    }
  end

  def scenario_export(scenario)
    {
      id: scenario.id,
      created_at: scenario.created_at,
      parameters: {
        diameter_m: scenario.diameter_m,
        density_kg_m3: scenario.density_kg_m3,
        velocity_kms: scenario.velocity_kms,
        impact_angle_deg: scenario.impact_angle_deg,
        location: { lat: scenario.lat, lng: scenario.lng }
      },
      results: scenario.results,
      neo: scenario.neo ? neo_summary(scenario.neo) : nil
    }
  end

  def generate_pdf_report(scenario)
    # This would use a PDF generation library like Prawn
    # Placeholder implementation
    "PDF Report for Scenario #{scenario.id}"
  end

  def generate_csv_data(scenario)
    CSV.generate do |csv|
      csv << ['Parameter', 'Value']
      csv << ['Diameter (m)', scenario.diameter_m]
      csv << ['Velocity (km/s)', scenario.velocity_kms]
      csv << ['Energy (Mt)', scenario.results['energy_megatons_tnt']]
      csv << ['Blast Radius (km)', scenario.results['severe_blast_radius_km']]
      # Add more rows as needed
    end
  end
end
