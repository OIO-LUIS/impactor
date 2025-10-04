# frozen_string_literal: true

module Physics
  class Mitigation
    include Utils

    # type: "deflection" | "ablation" | "nuclear"
    # params: { lead_time_days:, delta_v_ms:, yield_mt:, efficiency: }
    def initialize(type:, params:, impactor_mass:, impactor_velocity:)
      @type    = (type || "none").to_s
      @params  = params || {}
      @m_kg    = impactor_mass.to_f
      @v_kms   = impactor_velocity.to_f
    end

    def apply
      return { success_probability: 0.0, energy_reduction: 0.0 } if @type == "none"

      lead_days = Utils.safe_float(@params[:lead_time_days], 0.0)
      dv_ms     = Utils.safe_float(@params[:delta_v_ms], 0.0)
      yield_mt  = Utils.safe_float(@params[:yield_mt], 0.0)
      eff       = Utils.clamp(Utils.safe_float(@params[:efficiency], 0.3), 0.05, 0.9)

      case @type
      when "deflection"
        # Success rises with (lead_time * delta_v)
        score = (lead_days / 30.0) * (dv_ms / 1.0)
        p = Utils.clamp(0.1 + 0.08 * score, 0.0, 0.95)
        reduction = Utils.clamp(0.02 * score * eff, 0.0, 0.6)
        { type: @type, success_probability: p, energy_reduction: reduction }

      when "ablation"
        # Laser ablation: slow push; needs long lead.
        score = (lead_days / 60.0) * eff
        p = Utils.clamp(0.05 + 0.07 * score, 0.0, 0.8)
        reduction = Utils.clamp(0.3 * score, 0.0, 0.5)
        { type: @type, success_probability: p, energy_reduction: reduction }

      when "nuclear"
        # Stand-off nuclear device; depends on yield and coupling/efficiency.
        p = Utils.clamp(0.5 + 0.05 * Math.log10(yield_mt + 1.0), 0.2, 0.98)
        reduction = Utils.clamp(0.15 * Math.log10((yield_mt * eff) + 1.0), 0.0, 0.75)
        { type: @type, success_probability: p, energy_reduction: reduction, notes: "Stand-off detonation assumed" }

      else
        { type: @type, success_probability: 0.0, energy_reduction: 0.0, warning: "Unknown mitigation type" }
      end
    end
  end
end
