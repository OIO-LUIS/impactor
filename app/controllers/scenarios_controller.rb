# app/controllers/scenarios_controller.rb
class ScenariosController < ApplicationController
  protect_from_forgery with: :null_session

  def simulate
    Rails.logger.info "🎯 Starting simulation..."
    Rails.logger.info "   Parameters: #{params.inspect}"

    # Build simulation parameters
    sim_params = build_simulation_params

    Rails.logger.info "🔧 Simulation mode: #{sim_params[:orbital_elements] ? 'ORBITAL' : 'LEGACY'}"

    engine = Physics::Engine.new(sim_params)
    result = engine.run

    if result[:ok]
      if result[:impact]
        Rails.logger.info "💥 IMPACT detected at (#{result.dig(:results, :location, :lat)}, #{result.dig(:results, :location, :lng)})"
      elsif result[:near_miss]
        Rails.logger.info "🌍 NEAR MISS - Closest approach: #{result.dig(:results, :miss_distance_km)} km"
      end
    end

    # Optionally persist Scenario
    # persist_scenario(result) if result[:ok]

    render json: result
  rescue => e
    Rails.logger.error "❌ Simulation error: #{e.message}"
    Rails.logger.error e.backtrace.first(5).join("\n")
    render json: { ok: false, error: e.message, backtrace: e.backtrace.first(3) }, status: :unprocessable_entity
  end

  private

  def build_simulation_params
    sim_params = simulation_params.to_h.symbolize_keys

    # Check if orbital elements are provided (new orbital mode)
    if params[:orbital_elements].present?
      orbital_elements = params[:orbital_elements].permit(
        :eccentricity, :semi_major_axis_au, :inclination_deg,
        :longitude_ascending_node_deg, :argument_perihelion_deg,
        :mean_anomaly_deg, :mean_motion_deg_per_day, :epoch_jd,
        :perihelion_distance_au, :aphelion_distance_au, :orbital_period_days
      ).to_h.symbolize_keys

      # Convert all orbital element strings to floats
      orbital_elements.transform_values! { |v| v.to_f }

      sim_params[:orbital_elements] = orbital_elements

      # Parse encounter time if provided
      if params[:encounter_time].present?
        begin
          sim_params[:encounter_time] = Time.parse(params[:encounter_time])
          Rails.logger.info "📅 Parsed encounter time: #{params[:encounter_time]} → #{sim_params[:encounter_time]}"
        rescue => e
          Rails.logger.error "❌ Failed to parse encounter time '#{params[:encounter_time]}': #{e.message}"
          sim_params[:encounter_time] = Time.current
        end
      else
        # Default to current time if not specified
        sim_params[:encounter_time] = Time.current
        Rails.logger.info "📅 Using current time as encounter time"
      end

      Rails.logger.info "📡 Using orbital elements for trajectory calculation"
      Rails.logger.info "   - Eccentricity: #{orbital_elements[:eccentricity]}"
      Rails.logger.info "   - Semi-major axis: #{orbital_elements[:semi_major_axis_au]} AU"
      Rails.logger.info "   - Encounter time: #{sim_params[:encounter_time]}"
    else
      Rails.logger.info "📍 Using legacy mode (direct lat/lng input)"
    end

    sim_params
  end

  def simulation_params
    params.permit(
      :neo_id, :encounter_time,
      :diameter_m, :density_kg_m3, :velocity_kms, :impact_angle_deg,
      :lat, :lng, :strength_mpa, :azimuth_deg,
      :ocean_depth_m, :mitigation_type,
      mitigation_params: [:lead_time_days, :delta_v_ms, :yield_mt, :efficiency]
    )
  end

  def persist_scenario(result)
    Scenario.create!(
      neo_id: params[:neo_id].presence,
      diameter_m: params[:diameter_m],
      density_kg_m3: params[:density_kg_m3],
      results: result[:results]
    )
  rescue => e
    Rails.logger.warn "⚠️  Failed to persist scenario: #{e.message}"
  end
end
