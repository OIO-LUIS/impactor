class ModalsController < ApplicationController
  ALLOWED = {
    "info"     => { partial: "home/info_modal_body",    title_i18n: "info.title"     },
    "tutorial" => { partial: "home/tutorial_modal_body",title_i18n: "tutorial.title" },
    "game"     => { partial: "home/game_modal_body",    title_i18n: "game.title"     }
  }.freeze

  def open
    key = params[:key].to_s
    cfg = ALLOWED[key]
    return head :bad_request unless cfg

    @title_key    = cfg[:title_i18n]
    @body_partial = cfg[:partial]
    @body_locals  = (params[:locals] || {}).symbolize_keys

    respond_to do |format|
      format.turbo_stream { render :open }
      format.html { redirect_back fallback_location: root_path }
    end
  end

  def close
    respond_to do |format|
      format.turbo_stream { render :close }
      format.html { redirect_back fallback_location: root_path }
    end
  end
end
