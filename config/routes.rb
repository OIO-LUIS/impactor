Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  scope "(:locale)", locale: /en|es|pt|fr/ do
    root "home#index"

  end
  resource :modal, only: [] do
    post :open
    post :close
  end

    # NEO Browser API routes (date search only)
  get  "/neos/feed", to: "neos#feed"
  get  "/neos/:id", to: "neos#show"

  post "/simulate", to: "scenarios#simulate"
  get "simulation", to: "home#impact_cerium", as: "start_simulation"

  
end
