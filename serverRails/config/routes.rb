Rails.application.routes.draw do
  post "user_token" => "user_token#create"

  root "home#index"
  get "/api/empleados/authenticate" => "home#auth"

  post "user_token" => "user_token#create"

  get "/api/users" => "user#index"
  post "/api/users/register" => "user#create"
  # For details on the DSL available within this file, see https://guides.rubyonrails.org/routing.html
end
