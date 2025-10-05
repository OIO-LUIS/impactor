class NeowsService
  include HTTParty
  base_uri "https://api.nasa.gov/neo/rest/v1"
  format :json

  def initialize(api_key: Rails.application.credentials.dig(:nasa, :api_key))
    @api_key = api_key || raise("Missing nasa.api_key in credentials")
  end

  def feed(start_date:, end_date: start_date)
    get_json("/feed", start_date: start_date, end_date: end_date)
  end

  def lookup(neo_id)
    get_json("/neo/#{neo_id}")
  end

  def browse(page: 0, size: 20)
    get_json("/neo/browse", page: page, size: size)
  end

  private

  def get_json(path, **params)
    resp = self.class.get(path, query: params.merge(api_key: @api_key))
    raise "NeoWs #{resp.code}: #{resp.body}" unless resp.code == 200
    resp.parsed_response
  end
end
