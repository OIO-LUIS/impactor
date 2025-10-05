# lib/tasks/neo.rake

namespace :neo do
  desc "Import NEOs from NASA API into database for caching/fallback"
  task import: :environment do
    puts "🚀 Starting NEO import from NASA API..."

    begin
      # Import recent NEOs
      service = ImportNeosService.new

      # Import NEOs from the last 30 days
      end_date = Date.today
      start_date = end_date - 30.days

      puts "📅 Importing NEOs from #{start_date} to #{end_date}..."

      # Import in weekly batches to avoid API limits
      current_date = start_date
      total_imported = 0

      while current_date < end_date
        batch_end = [current_date + 6.days, end_date].min

        begin
          puts "  📦 Fetching batch: #{current_date} to #{batch_end}..."
          count = service.import_date_range(start_date: current_date, end_date: batch_end)
          total_imported += count
          puts "  ✅ Imported #{count} NEOs"

          # Small delay to be nice to the API
          sleep 1
        rescue => e
          puts "  ⚠️ Failed to import batch: #{e.message}"
        end

        current_date = batch_end + 1.day
      end

      puts "✨ Import complete! Total NEOs imported: #{total_imported}"
      puts "📊 Database now contains #{Neo.count} NEOs total"

      # Show some statistics
      hazardous_count = Neo.where(potentially_hazardous: true).count
      puts "⚠️  Potentially hazardous NEOs: #{hazardous_count}"

    rescue => e
      puts "❌ Import failed: #{e.message}"
      puts e.backtrace.first(5)
    end
  end

  desc "Show NEO database statistics"
  task stats: :environment do
    puts "\n📊 NEO Database Statistics"
    puts "=" * 50
    puts "Total NEOs: #{Neo.count}"
    puts "Potentially Hazardous: #{Neo.where(potentially_hazardous: true).count}"
    puts "Sentry Objects: #{Neo.where(sentry_object: true).count}"

    if Neo.any?
      puts "\nSize Distribution:"
      small = Neo.where("est_diameter_m_max < ?", 100).count
      medium = Neo.where("est_diameter_m_max >= ? AND est_diameter_m_max < ?", 100, 1000).count
      large = Neo.where("est_diameter_m_max >= ?", 1000).count

      puts "  Small (<100m): #{small}"
      puts "  Medium (100-1000m): #{medium}"
      puts "  Large (>1000m): #{large}"

      # Show recent close approaches
      neos_with_approaches = Neo.where("jsonb_array_length(close_approaches) > 0")
      puts "\nNEOs with close approach data: #{neos_with_approaches.count}"

      # Sample a few NEOs
      puts "\nSample NEOs:"
      Neo.limit(5).each do |neo|
        diameter = neo.median_diameter_m&.round || "unknown"
        puts "  - #{neo.name}: #{diameter}m diameter"
      end
    end
    puts "=" * 50
  end

  desc "Clear all NEOs from database"
  task clear: :environment do
    puts "⚠️  This will delete all NEOs from the database!"
    print "Are you sure? (yes/no): "

    if STDIN.gets.strip.downcase == 'yes'
      count = Neo.count
      Neo.destroy_all
      puts "✅ Deleted #{count} NEOs from database"
    else
      puts "❌ Cancelled"
    end
  end
end