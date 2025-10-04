class CreateNeos < ActiveRecord::Migration[7.0]
  def change
    create_table :neos do |t|
      t.string  :neo_reference_id, null: false
      t.string  :name,             null: false
      t.float   :est_diameter_m_min
      t.float   :est_diameter_m_max
      t.float   :albedo
      t.float   :absolute_magnitude_h
      t.boolean :potentially_hazardous, null: false, default: false

      # JSONB payloads for raw API data (close approaches, orbital elements)
      t.jsonb   :close_approaches,  null: false, default: []
      t.jsonb   :orbital_elements,  null: false, default: {}

      t.timestamps
    end

    # Useful indexes
    add_index :neos, :neo_reference_id, unique: true
    add_index :neos, :name
    add_index :neos, :potentially_hazardous
    add_index :neos, :close_approaches, using: :gin
    add_index :neos, :orbital_elements, using: :gin

    add_column :neos, :nasa_jpl_url, :string
    add_column :neos, :sentry_object, :boolean, null: false, default: false

    add_index :neos, :nasa_jpl_url
    add_index :neos, :sentry_object
  end
end
