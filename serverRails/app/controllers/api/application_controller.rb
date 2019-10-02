module Api
    class ApplicationController< ActionController::Api
        include Knock::Authenticable
        undef_method :current_user
    end
end