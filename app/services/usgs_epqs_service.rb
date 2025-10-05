class UsgsEpqsService
  include HTTParty
  base_uri "https://epqs.nationalmap.gov/v1/json"
  format :json

  # returns Float meters above sea level
  def elevation(lat:, lon:, units: "Meters")
    resp = self.class.get("/getElevation", query: { x: lon, y: lat, units: units, includeDate: "false" })
    raise "EPQS #{resp.code}: #{resp.body}" unless resp.code == 200
    body = resp.parsed_response
    (body["value"] || body["elevation"]).to_f
  end
end