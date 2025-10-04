# lib/tasks/neos.rake
namespace :neo do
  desc "Import NEOs between START_DATE=YYYY-MM-DD and END_DATE=YYYY-MM-DD (END_DATE defaults to START_DATE)"
  task import: :environment do
    start_date = ENV["START_DATE"] or raise "START_DATE is required (YYYY-MM-DD)"
    end_date   = ENV["END_DATE"] || start_date

    puts "[neo:import] Importing NEOs from #{start_date} to #{end_date}…"

    result = ImportNeosService.new(start_date: start_date, end_date: end_date).call

    puts "[neo:import] created/updated: #{result[:created_or_updated]}"
    if result[:errors].any?
      puts "[neo:import] errors (#{result[:errors].size}):"
      result[:errors].each { |e| puts "- #{e[:neo_id]}: #{e[:error]}" }
      abort "[neo:import] completed with errors"
    else
      puts "[neo:import] done"
    end
  end
end

# rake neo:import START_DATE=2025-10-01 END_DATE=2025-10-07