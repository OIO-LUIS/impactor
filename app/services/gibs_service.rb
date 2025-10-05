class GibsService
  # IMERG Precipitation Rate (NRT) – Web Mercator
  TEMPLATE = "https://gibs.earthdata.nasa.gov/wmts/epsg3857/nrt/IMERG_Precipitation_Rate/default/%{date}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png"

  def tile_url(date: Date.today)
    format(TEMPLATE, date: date.iso8601)
  end
end