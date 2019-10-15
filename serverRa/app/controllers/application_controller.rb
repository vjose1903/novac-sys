class ApplicationController < ActionController::API
        include DeviseTokenAuth::Concerns::SetUserByToken

        # protect_from_forgery with: :exception

        before_action :configure_permitted_parameters, if: :devise_controller?
        protected
        def configure_permitted_parameters
                devise_parameter_sanitizer.permit(:sign_up, keys: [
                        :nombre,
                        :usuario,
                        :cedula,
                        :apellido,
                        :sexo,
                        :fotoPerfil,
                        :fotoPerfil_cache,
                        :telefono,
                        :email,
                        :fechaN,
                        :role,
                        :password,
                        :password_confirmation])
        end
end
