class UsgsEarthquakesService
  include HTTParty
  base_uri "https://earthquake.usgs.gov/fdsnws/event/1"
  format :json

  # bbox: [minlon, minlat, maxlon, maxlat]
  def search(starttime:, endtime:, minmagnitude: 4.5, bbox: nil, limit: 200)
    q = { format: "geojson", starttime: starttime, endtime: endtime, minmagnitude: minmagnitude, limit: limit }
    if bbox
      q[:minlongitude], q[:minlatitude], q[:maxlongitude], q[:maxlatitude] = bbox
    end
    resp = self.class.get("/query", query: q)
    raise "USGS EQ #{resp.code}: #{resp.body}" unless resp.code == 200
    resp.parsed_response
  end
end