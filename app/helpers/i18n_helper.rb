module I18nHelper
  # Sanitiza las traducciones *_html permitiendo solo las etiquetas necesarias
  def t_html(key, **opts)
    html = I18n.t(key, **opts)
    sanitize(html, tags: %w[b kbd strong em code br], attributes: [])
  end
end
