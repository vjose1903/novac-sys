class User < ApplicationRecord
    has_secure_password

    validates_length of :password, maximum 72, minimum: 6, allow_nil false, allow_blank: false

    validates_presence_of :usuario
    validates_presence_of :cedula
    validates_uniqueness_of :cedula
    validates_uniqueness_of :usuario

    
end
