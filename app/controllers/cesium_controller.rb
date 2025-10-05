class CesiumController < ApplicationController
  # Ensure you lock this down as appropriate:
  # before_action :authenticate_user!  (if you're using Devise or similar)

  def token
    render json: { token: Rails.application.credentials.dig(:cesium, :access_token) }
  end
end