# app/services/import_neos_service.rb
class ImportNeosService
  def initialize(start_date:, end_date: start_date, neows: NeowsService.new, logger: Rails.logger)
    @start_date = start_date
    @end_date   = end_date
    @neows      = neows
    @logger     = logger
  end

  def call
    payload = @neows.feed(start_date: @start_date, end_date: @end_date)
    neos_by_date = payload.fetch("near_earth_objects", {})

    count = 0
    errors = []

    neos_by_date.each do |_date, items|
      items.each do |neo|
        begin
          upsert_neo!(neo)
          count += 1
        rescue => e
          errors << { neo_id: neo["id"], error: e.message }
          @logger.error("[ImportNeosService] #{neo["id"]}: #{e.class} - #{e.message}")
        end
      end
    end

    { created_or_updated: count, errors: errors }
  end

  private

  def upsert_neo!(neo)
    rec = Neo.find_or_initialize_by(neo_reference_id: neo["neo_reference_id"])

    rec.assign_attributes(
      name:                     neo["name"],
      absolute_magnitude_h:     neo["absolute_magnitude_h"],
      nasa_jpl_url:             neo["nasa_jpl_url"],                         # string
      sentry_object:            !!neo["is_sentry_object"],                   # boolean
      potentially_hazardous:    !!neo["is_potentially_hazardous_asteroid"],  # boolean
      est_diameter_m_min:       dig_float(neo, "estimated_diameter", "meters", "estimated_diameter_min"),
      est_diameter_m_max:       dig_float(neo, "estimated_diameter", "meters", "estimated_diameter_max"),
      close_approaches:         neo["close_approach_data"]                   # jsonb (array)
      # raw: neo  # si tienes una columna jsonb para guardar todo
    )

    rec.save!
  end

  def dig_float(hash, *keys)
    v = keys.reduce(hash) { |acc, k| acc.respond_to?(:[]) ? acc[k] : nil }
    v.is_a?(String) ? v.to_f : v
  end
end