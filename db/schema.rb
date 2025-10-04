# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.1].define(version: 2025_10_04_192017) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "neos", force: :cascade do |t|
    t.string "neo_reference_id", null: false
    t.string "name", null: false
    t.float "est_diameter_m_min"
    t.float "est_diameter_m_max"
    t.float "albedo"
    t.float "absolute_magnitude_h"
    t.boolean "potentially_hazardous", default: false, null: false
    t.jsonb "close_approaches", default: [], null: false
    t.jsonb "orbital_elements", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "nasa_jpl_url"
    t.boolean "sentry_object", default: false, null: false
    t.index ["close_approaches"], name: "index_neos_on_close_approaches", using: :gin
    t.index ["name"], name: "index_neos_on_name"
    t.index ["nasa_jpl_url"], name: "index_neos_on_nasa_jpl_url"
    t.index ["neo_reference_id"], name: "index_neos_on_neo_reference_id", unique: true
    t.index ["orbital_elements"], name: "index_neos_on_orbital_elements", using: :gin
    t.index ["potentially_hazardous"], name: "index_neos_on_potentially_hazardous"
    t.index ["sentry_object"], name: "index_neos_on_sentry_object"
  end

end
