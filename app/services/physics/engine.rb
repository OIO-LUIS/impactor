# frozen_string_literal: true

require_relative "utils"
require_relative "entry"
require_relative "blast"
require_relative "crater"
require_relative "tsunami"
require_relative "thermal"
require_relative "seismic"
require_relative "atmospheric"
require_relative "ejecta"
require_relative "mitigation"

module Physics
  class Engine
    include Utils

    attr_reader :results

    def initialize(params)
      @params = params
      @orbital_elements = params[:orbital_elements]
      @encounter_time = params[:encounter_time]

      # If orbital elements provided, calculate trajectory first
      if @orbital_elements
        calculate_from_orbital_elements
      else
        # Legacy mode: direct lat/lng input
        @lat  = params.fetch(:lat).to_f
        @lng  = params.fetch(:lng).to_f
        @v_kms = params.fetch(:velocity_kms).to_f
        @angle_deg = params.fetch(:impact_angle_deg).to_f
        @azimuth_deg  = (params[:azimuth_deg] || 0.0).to_f
      end

      @diam = params.fetch(:diameter_m).to_f
      @rho  = params.fetch(:density_kg_m3).to_f
      @strength_mpa = (params[:strength_mpa] || 1.0).to_f
      @ocean_depth_m = Utils.safe_float(params[:ocean_depth_m], nil)
      @mitigation_type   = params[:mitigation_type]
      @mitigation_params = params[:mitigation_params] || {}

      validate_parameters!
    end

    def run
      # Handle near-miss scenario
      if @is_near_miss
        return generate_near_miss_result
      end

      # Normal impact simulation
      entry = Physics::Entry.new(
        diameter_m: @diam,
        density_kg_m3: @rho,
        velocity_kms: @v_kms,
        impact_angle_deg: @angle_deg,
        strength_mpa: @strength_mpa
      ).run

      @entry_track = generate_entry_track(entry)

      out = {
        ok: true,
        impact: true,
        entry_track: @entry_track,
        results: {},
        rings: [],
        visualization: {}
      }

      if entry.airburst
        process_airburst(entry.airburst, out)
      else
        process_ground_impact(entry.impact, out)
      end

      calculate_thermal_effects(out)
      calculate_seismic_effects(out)
      calculate_atmospheric_effects(out)
      calculate_ejecta_effects(out) if out[:results][:mode] == "ground"
      calculate_tsunami_effects(out) if ocean_impact?

      apply_mitigation(out) if @mitigation_type && @mitigation_type != "none"

      calculate_damage_assessment(out)

      out[:timeline]       = generate_timeline(entry, out[:results])
      out[:visualization]  = generate_visualization_data(out[:results])
      add_metadata(out)

      out
    rescue => e
      {
        ok: false,
        error: e.message,
        backtrace: Rails.env.production? ? nil : e.backtrace&.first(3)
      }
    end

    private

    def calculate_from_orbital_elements
      Rails.logger.info "🛰️  Calculating trajectory from orbital elements..."
      Rails.logger.info "   - Elements: #{@orbital_elements.inspect}"
      Rails.logger.info "   - Encounter time: #{@encounter_time}"

      begin
        service = OrbitalMechanicsService.new(@orbital_elements, @encounter_time)
        @orbital_result = service.calculate

        Rails.logger.info "   - Result: #{@orbital_result.slice(:impact, :miss_distance_km, :velocity_kms).inspect}"

        # Store for later use
        @is_near_miss = !@orbital_result[:impact]

        if @orbital_result[:impact]
          # Impact detected - extract impact parameters
          @lat = @orbital_result[:lat]
          @lng = @orbital_result[:lng]
          @v_kms = @orbital_result[:velocity_kms]
          @angle_deg = @orbital_result[:impact_angle_deg]
          @azimuth_deg = @orbital_result[:azimuth_deg]
          Rails.logger.info "   💥 IMPACT at (#{@lat}, #{@lng})"
        else
          # Near miss - set dummy values (won't be used for physics calc)
          @lat = 0.0
          @lng = 0.0
          @v_kms = @orbital_result[:velocity_kms]
          @angle_deg = 45.0
          @azimuth_deg = 0.0
          Rails.logger.info "   🌍 NEAR MISS - Distance: #{@orbital_result[:miss_distance_km]} km"
        end
      rescue => e
        Rails.logger.error "   ❌ Error calculating orbital trajectory: #{e.message}"
        Rails.logger.error "   #{e.backtrace.first(5).join("\n   ")}"
        raise ArgumentError, "Failed to calculate orbital trajectory: #{e.message}"
      end
    end

    def validate_parameters!
      raise ArgumentError, "Invalid diameter: #{@diam}" unless @diam.between?(1, 100_000)
      raise ArgumentError, "Invalid density: #{@rho}" unless @rho.between?(100, 10_000)

      # Only validate velocity, angle, and coordinates if not using orbital elements
      unless @orbital_elements
        raise ArgumentError, "Invalid velocity: #{@v_kms}" unless @v_kms.between?(1, 100)
        raise ArgumentError, "Invalid impact angle: #{@angle_deg}" unless @angle_deg.between?(5, 90)
        raise ArgumentError, "Invalid coordinates" unless @lat.between?(-90, 90) && @lng.between?(-180, 180)
      end
    end

    def process_airburst(air, out)
      e_j = 0.5 * air[:m_kg] * air[:v_ms]**2
      theta = Utils.deg2rad(@angle_deg)

      blast = Physics::Blast.new(e_j, theta, air[:alt_m])
      radii = blast.calculate_all_radii

      out[:results].merge!(
        mode: "airburst",
        burst_alt_km: air[:alt_m] / 1000.0,
        energy_megatons_tnt: e_j / 4.184e15,
        energy_joules: e_j,
        final_velocity_kms: air[:v_ms] / 1000.0,
        surviving_mass_kg:  air[:m_kg],
        peak_overpressure_psi: blast.peak_overpressure_psi,
        vaporization_radius_km:   radii[:vaporization_km],
        severe_blast_radius_km:   radii[:severe_blast_km],
        moderate_blast_radius_km: radii[:moderate_blast_km],
        window_damage_radius_km:  radii[:window_damage_km],
        minor_damage_radius_km:   radii[:minor_damage_km],
        final_crater_d_m: 0.0,
        crater_depth_m:   0.0
      )

      out[:rings] = generate_damage_rings(radii, "airburst")
    end

    def process_ground_impact(imp, out)
      ke_j = imp[:ke_j]
      theta = Utils.deg2rad(@angle_deg)

      crater = Physics::Crater.new(
        mass_kg: imp[:m_kg],
        velocity_ms: imp[:v_ms],
        angle_rad: theta,
        target_density: ocean_impact? ? 1030.0 : 2650.0
      ).calculate_all

      blast = Physics::Blast.new(ke_j, theta, 0.0)
      radii = blast.calculate_all_radii

      out[:results].merge!(
        mode: "ground",
        energy_megatons_tnt: ke_j / 4.184e15,
        energy_joules: ke_j,
        final_velocity_kms: imp[:v_ms] / 1000.0,
        surviving_mass_kg:  imp[:m_kg],
        ground_coupled_energy_fraction: 0.5,
        transient_crater_d_m: crater[:transient_diameter_m],
        final_crater_d_m:     crater[:final_diameter_m],
        crater_depth_m:       crater[:depth_m],
        crater_rim_height_m:  crater[:rim_height_m],
        crater_rim_radius_km: crater[:final_diameter_m] / 2000.0,
        central_peak_height_m: crater[:central_peak_m],
        vaporization_radius_km:   radii[:vaporization_km],
        severe_blast_radius_km:   radii[:severe_blast_km],
        moderate_blast_radius_km: radii[:moderate_blast_km],
        window_damage_radius_km:  radii[:window_damage_km],
        minor_damage_radius_km:   radii[:minor_damage_km],
        peak_overpressure_psi: blast.peak_overpressure_psi
      )

      out[:rings] = generate_damage_rings(radii, "ground", crater)
    end

    def calculate_thermal_effects(out)
      e_mt = out[:results][:energy_megatons_tnt]
      h_km = out[:results][:burst_alt_km] || 0.0
      th = Physics::Thermal.new(e_mt, h_km).calculate_all
      out[:results].merge!(th)
      if th[:thermal_radiation_radius_km].to_f > 0
        out[:rings] << { label: "Third-degree burns", radius_km: th[:thermal_radiation_radius_km], color: "#ff5722", type: "thermal" }
      end
    end

    def calculate_seismic_effects(out)
      return unless out[:results][:mode] == "ground"
      e_j = out[:results][:energy_joules]
      frac = out[:results][:ground_coupled_energy_fraction] || 0.5
      sz = Physics::Seismic.new(e_j * frac, @lat, @lng).calculate_all
      out[:results].merge!(sz)
      if sz[:seismic_damage_radius_km].to_f > 0
        out[:rings] << { label: "Seismic damage", radius_km: sz[:seismic_damage_radius_km], color: "#9c27b0", type: "seismic" }
      end
    end

    def calculate_atmospheric_effects(out)
      e_mt = out[:results][:energy_megatons_tnt]
      h_km = out[:results][:burst_alt_km] || 0.0
      ej_km3 = out[:results][:ejecta_volume_km3] || 0.0
      at = Physics::Atmospheric.new(energy_mt: e_mt, burst_altitude_km: h_km, ejecta_volume_km3: ej_km3).calculate_all
      out[:results].merge!(at)
    end

    def calculate_ejecta_effects(out)
      return unless out[:results][:final_crater_d_m].to_f > 0.0
      ej = Physics::Ejecta.new(
        crater_diameter_m: out[:results][:final_crater_d_m],
        crater_depth_m:    out[:results][:crater_depth_m],
        energy_j:          out[:results][:energy_joules],
        impact_angle_rad:  Utils.deg2rad(@angle_deg)
      ).calculate_all

      out[:results].merge!(ej)
      if ej[:ejecta_radius_km].to_f > 0
        out[:rings] << { label: "Ejecta blanket", radius_km: ej[:ejecta_radius_km], color: "#ff9800", type: "ejecta" }
      end
      out[:visualization][:debris_paths] = generate_debris_paths(out[:results].merge(ej))
    end

    def calculate_tsunami_effects(out)
      e_j = out[:results][:energy_joules]
      th = Physics::Tsunami.new(energy_j: e_j, depth_m: @ocean_depth_m, angle_rad: Utils.deg2rad(@angle_deg)).calculate_all
      out[:results].merge!(th)
      if th[:tsunami_100km_m].to_f > 0.5
        out[:rings] << { label: "Tsunami (#{th[:tsunami_100km_m].round(1)}m @100km)", radius_km: 100, color: "#00acc1", type: "tsunami" }
      end
      if th[:tsunami_1000km_m].to_f > 0.5
        out[:rings] << { label: "Far-field tsunami", radius_km: 1000, color: "#00838f", type: "tsunami_far" }
      end
    end

    def apply_mitigation(out)
      m = Physics::Mitigation.new(
        type: @mitigation_type,
        params: @mitigation_params,
        impactor_mass: calculate_original_mass,
        impactor_velocity: @v_kms
      ).apply

      out[:results][:mitigation] = m

      return unless m[:success_probability].to_f > 0.5 && m[:energy_reduction].to_f > 0.0

      reduction = 1.0 - m[:energy_reduction].to_f
      out[:results][:energy_megatons_tnt] *= reduction
      out[:results][:energy_joules]       *= reduction

      recalculate_effects_after_mitigation(out, reduction)
    end

    def calculate_damage_assessment(out)
      minor_r = out[:results][:minor_damage_radius_km] || out[:results][:window_damage_radius_km] || 0.0
      severe_r = out[:results][:severe_blast_radius_km] || 0.0

      assessment = {
        threat_level: determine_threat_level(out[:results][:energy_megatons_tnt]),
        total_affected_area_km2: PI * (minor_r ** 2),
        severe_damage_area_km2:  PI * (severe_r ** 2),
        evacuation_radius_km:    severe_r * 1.5,
        warning_time_hours:      calculate_warning_time,
        global_effects:          assess_global_effects(out[:results])
      }
      out[:results][:damage_assessment] = assessment
    end

    # ------- geometry/timeline helpers (mostly as you wrote) --------

    def generate_entry_track(entry_result)
      return downtrack_polyline unless entry_result.track && !entry_result.track.empty?

      track_points = []
      entry_result.track.each do |point|
        altitude_km = point[:h_m] / 1000.0
        distance_back_km = point[:s_m] / 1000.0

        position = project_along_trajectory(distance_back_km, altitude_km)
        track_points << {
          lat: position[:lat],
          lng: position[:lng],
          altitude_km: altitude_km,
          velocity_kms: point[:v_ms] / 1000.0,
          mass_fraction: (point[:m_kg] / calculate_original_mass rescue 1.0)
        }
      end
      track_points
    end

    def downtrack_polyline
      bearing_deg = @azimuth_deg + 180.0  # backtrack
      total_back_m = 500_000.0
      steps = 32
      δ = total_back_m / steps
      (0..steps).map do |i|
        arc = Utils.arc_from_meters(-(i * δ))
        lat, lon = Utils.gc_destination(@lat, @lng, bearing_deg, arc)
        { lat: lat, lng: lon, altitude_km: (i * 15.0) }
      end
    end

    def project_along_trajectory(distance_km, _altitude_km)
      bearing_deg = @azimuth_deg + 180.0
      arc_rad = Utils.arc_from_meters(distance_km * 1000.0)
      lat, lng = Utils.gc_destination(@lat, @lng, bearing_deg, arc_rad)
      { lat: lat, lng: lng }
    end

    def generate_timeline(entry_result, results)
      timeline = []
      60.downto(1) do |sec|
        timeline << {
          time_to_impact_s: -sec,
          altitude_km: calculate_altitude_at_time(sec, entry_result),
          velocity_kms: calculate_velocity_at_time(sec, entry_result),
          position: calculate_position_at_time(sec),
          effects: {}
        }
      end
      timeline << {
        time_to_impact_s: 0,
        altitude_km: results[:burst_alt_km] || 0.0,
        velocity_kms: results[:final_velocity_kms],
        energy_released_mt: results[:energy_megatons_tnt],
        position: { lat: @lat, lng: @lng },
        effects: { shockwave_radius_km: 0.0, thermal_radius_km: 0.0 }
      }
      (1..300).step(5) do |sec|
        timeline << {
          time_to_impact_s: sec,
          altitude_km: 0.0,
          velocity_kms: 0.0,
          position: { lat: @lat, lng: @lng },
          effects: {
            shockwave_radius_km: calculate_shockwave_at_time(sec, results),
            thermal_radius_km: results[:thermal_radiation_radius_km] || 0.0,
            seismic_radius_km: calculate_seismic_at_time(sec, results)
          }
        }
      end
      timeline
    end

    def generate_visualization_data(results)
      {
        entry_track: @entry_track,
        debris_paths: generate_debris_paths(results),
        shockwave_progression: generate_shockwave_progression(results),
        crater_profile: (generate_crater_profile(results) if results[:final_crater_d_m].to_f > 0.0)
      }
    end

    def generate_debris_paths(results)
      return [] unless results[:ejecta_velocity_kms].to_f > 0.0
      paths = []
      num = 12
      (0...num).each do |i|
        az = (360.0 / num) * i
        range_km = (results[:ejecta_radius_km] || 50.0)
        paths << calculate_ballistic_trajectory(@lat, @lng, az, range_km, results[:ejecta_velocity_kms])
      end
      paths
    end

    def generate_shockwave_progression(results)
      return [] unless results[:minor_damage_radius_km]
      progression = []
      max_r = results[:minor_damage_radius_km] || results[:window_damage_radius_km]
      v_kms = 0.34
      (0..20).each do |i|
        t = i * 5
        r = [v_kms * t, max_r].min
        progression << { time_s: t, radius_km: r, overpressure_psi: calculate_overpressure_at_radius(r, results) }
      end
      progression
    end

    def generate_crater_profile(results)
      {
        diameter_m: results[:final_crater_d_m],
        depth_m: results[:crater_depth_m],
        rim_height_m: results[:crater_rim_height_m],
        central_peak_m: results[:central_peak_height_m]
      }
    end

    def generate_damage_rings(r, mode, crater = nil)
      rings = []
      if r[:vaporization_km].to_f > 0
        rings << { label: "Vaporization", radius_km: r[:vaporization_km], color: "#ff1744", type: "vaporization" }
      end
      if mode == "ground" && crater
        rings << { label: "Crater rim", radius_km: (crater[:final_diameter_m] / 2000.0), color: "#ff6b35", type: "crater" }
      end
      rings << { label: "Severe blast",   radius_km: r[:severe_blast_km],   color: "#ff4d4f", type: "severe" }
      rings << { label: "Moderate damage",radius_km: r[:moderate_blast_km], color: "#ff9800", type: "moderate" }
      rings << { label: "Window damage",  radius_km: r[:window_damage_km],  color: "#ffa940", type: "minor" }
      rings.sort_by { |x| x[:radius_km].to_f }
    end

    def calculate_ballistic_trajectory(lat, lng, azimuth, range_km, velocity_kms)
      points = []
      steps = 20
      (0..steps).each do |i|
        frac = i.to_f / steps
        dist = range_km * frac
        pos = Utils.gc_destination(lat, lng, azimuth, Utils.arc_from_meters(dist * 1000.0))
        max_alt_km = range_km * 0.25
        alt = max_alt_km * 4.0 * frac * (1.0 - frac)
        points << { lat: pos[0], lng: pos[1], altitude_km: alt }
      end
      points
    end

    def calculate_altitude_at_time(seconds_before_impact, _entry)
      return 0.0 if seconds_before_impact <= 0
      distance = seconds_before_impact * @v_kms
      distance / Math.sin(Utils.deg2rad(@angle_deg))
    end

    def calculate_velocity_at_time(seconds_before_impact, _entry)
      return 0.0 if seconds_before_impact > 60
      @v_kms * (1.0 - seconds_before_impact / 120.0)
    end

    def calculate_position_at_time(seconds_before_impact)
      return { lat: @lat, lng: @lng } if seconds_before_impact <= 0
      distance_km = seconds_before_impact * @v_kms
      bearing = @azimuth_deg + 180.0
      pos = Utils.gc_destination(@lat, @lng, bearing, Utils.arc_from_meters(distance_km * 1000.0))
      { lat: pos[0], lng: pos[1] }
    end

    def calculate_shockwave_at_time(seconds, results)
      v_kms = 0.34
      max_r = results[:minor_damage_radius_km] || 0.0
      [v_kms * seconds, max_r].min
    end

    def calculate_seismic_at_time(seconds, results)
      return 0.0 unless results[:seismic_damage_radius_km]
      p_wave = 6.0
      [p_wave * seconds, results[:seismic_damage_radius_km]].min
    end

    def calculate_overpressure_at_radius(radius_km, results)
      return 0.0 if radius_km.to_f <= 0.0
      peak = results[:peak_overpressure_psi] || 100.0
      r0 = results[:severe_blast_radius_km] || 1.0
      peak * (r0 / radius_km) ** 2.5
    end

    def recalculate_effects_after_mitigation(out, reduction_factor)
      scale = reduction_factor ** 0.33
      %i[
        vaporization_radius_km severe_blast_radius_km moderate_blast_radius_km
        window_damage_radius_km minor_damage_radius_km
      ].each do |key|
        out[:results][key] = out[:results][key].to_f * scale if out[:results][key]
      end
      if out[:results][:final_crater_d_m]
        out[:results][:final_crater_d_m] *= scale
        out[:results][:crater_depth_m]   *= scale
      end
      out[:rings] = out[:rings].map { |r| r.merge(radius_km: r[:radius_km].to_f * scale) }
    end

    def determine_threat_level(energy_mt)
      case energy_mt
      when 0...1      then "MINIMAL"
      when 1...10     then "MINOR"
      when 10...100   then "LOCAL"
      when 100...1000 then "REGIONAL"
      when 1000...10000 then "CONTINENTAL"
      else "EXTINCTION"
      end
    end

    def assess_global_effects(results)
      effects = []
      e = results[:energy_megatons_tnt].to_f
      effects << "Local damage only"           if e < 10
      effects << "Regional climate impact"     if e >= 100
      effects << "Global cooling possible"     if e >= 1000
      effects << "Nuclear winter risk"         if results[:nuclear_winter_risk].to_f > 0.5
      effects << "Mass extinction threat"      if e >= 10_000
      effects << "Ozone depletion"             if results[:ozone_depletion_percent].to_f > 10
      effects << "Global tsunami"              if results[:tsunami_1000km_m].to_f > 5
      effects
    end

    def calculate_warning_time
      detection_range_au = 0.05
      approach_kms = @v_kms
      detection_range_km = detection_range_au * 149_597_870.7
      (detection_range_km / approach_kms / 3600.0).round(1)
    end

    def calculate_original_mass
      volume = (4.0/3.0) * PI * (@diam/2.0)**3
      volume * @rho
    end

    def ocean_impact?
      @ocean_depth_m && @ocean_depth_m > 50.0
    end

    def add_metadata(out)
      out[:metadata] = {
        simulation_version: "2.0",
        timestamp: Time.now.iso8601,
        parameters: {
          diameter_m: @diam, density_kg_m3: @rho, velocity_kms: @v_kms,
          impact_angle_deg: @angle_deg, location: { lat: @lat, lng: @lng },
          ocean_depth_m: @ocean_depth_m, mitigation: @mitigation_type
        }
      }
    end

    def generate_near_miss_result
      {
        ok: true,
        impact: false,
        near_miss: true,
        results: {
          miss_distance_km: @orbital_result[:miss_distance_km],
          closest_approach_distance_km: @orbital_result[:miss_distance_km],
          relative_velocity_kms: @orbital_result[:velocity_kms],
          encounter_time: @orbital_result[:encounter_time],
          threat_level: determine_near_miss_threat(@orbital_result[:miss_distance_km]),
          diameter_m: @diam,
          estimated_energy_mt: calculate_potential_energy_mt
        },
        visualization: {
          flyby_trajectory: generate_flyby_trajectory,
          earth_position: @orbital_result[:earth_position_km],
          neo_position: @orbital_result[:neo_position_km],
          relative_position: @orbital_result[:relative_position_km],
          closest_approach_point: calculate_closest_approach_point
        },
        metadata: {
          simulation_version: "2.0",
          timestamp: Time.now.iso8601,
          simulation_type: "near_miss",
          parameters: {
            diameter_m: @diam,
            density_kg_m3: @rho,
            orbital_elements: @orbital_elements,
            encounter_time: @encounter_time
          }
        }
      }
    end

    def determine_near_miss_threat(miss_distance_km)
      earth_radius = 6371.0
      moon_distance = 384400.0

      case miss_distance_km
      when 0..(earth_radius * 2)
        "EXTREME - Within 2 Earth radii"
      when (earth_radius * 2)..(earth_radius * 10)
        "VERY HIGH - Within 10 Earth radii"
      when (earth_radius * 10)..(moon_distance * 0.5)
        "HIGH - Within half lunar distance"
      when (moon_distance * 0.5)..moon_distance
        "MODERATE - Within lunar distance"
      else
        "LOW - Beyond lunar distance"
      end
    end

    def calculate_potential_energy_mt
      # Calculate energy if it HAD impacted
      mass_kg = calculate_original_mass
      ke_j = 0.5 * mass_kg * (@v_kms * 1000.0)**2
      ke_j / 4.184e15 # Convert to megatons TNT
    end

    def generate_flyby_trajectory
      # Generate trajectory points for visualization
      # Show NEO path before and after closest approach
      trajectory_points = []

      # Calculate trajectory points (simplified - shows path relative to Earth)
      (-10..10).each do |i|
        time_offset_hours = i * 1.0 # 1 hour intervals
        trajectory_points << {
          time_offset_hours: time_offset_hours,
          # For now, use simplified trajectory (can be enhanced with actual orbital calculation)
          distance_km: @orbital_result[:miss_distance_km] + (i**2 * 1000.0),
          velocity_kms: @orbital_result[:velocity_kms]
        }
      end

      trajectory_points
    end

    def calculate_closest_approach_point
      # Calculate the point of closest approach in Earth-centered coordinates
      # This is a simplified version - can be enhanced with actual geometry
      {
        distance_km: @orbital_result[:miss_distance_km],
        velocity_kms: @orbital_result[:velocity_kms],
        time: @orbital_result[:encounter_time]
      }
    end
  end
end
