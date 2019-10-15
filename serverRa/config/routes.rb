Rails.application.routes.draw do
  
  resources :contenido_articulos
  resources :articulos
  resources :tipo_articulos

  get 'articulosF' => 'articulos#getArticulosFormateados'    

  mount_devise_token_auth_for 'User', at: 'auth', controllers: {
        sessions:  'devise_token_auth/sessions',
        registrations:  'devise_token_auth/registrations',
        token_validations:  'devise_token_auth/token_validations'
      }

  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
end
