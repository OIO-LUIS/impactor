class ApplicationController < ActionController::Base
  before_action :set_locale
  before_action :ensure_locale_in_url

  private

  def set_locale
    I18n.locale =
      if params[:locale].present? && I18n.available_locales.include?(params[:locale].to_sym)
        session[:locale] = params[:locale].to_sym
      elsif session[:locale].present?
        session[:locale].to_sym
      else
        :en  # fallback definitivo
      end
  end

  def ensure_locale_in_url
    return if params[:locale].present?
    return unless request.get? && !request.xhr? # solo navegación normal
    redirect_to url_for(locale: (session[:locale] || I18n.default_locale))
  end

  def default_url_options
    { locale: I18n.locale }
  end
end
