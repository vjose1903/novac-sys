# frozen_string_literal: true

class User < ApplicationRecord
  extend Devise::Models

  
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable,
    :recoverable, :rememberable, :trackable, :validatable

  # has_attached_file :fotoPerfil, styles: { medium: "300x300", thumb: "100x100" }
  # validates_attachment_content_type :fotoPerfil, content_type: /\Aimage\/.*\Z/
  include DeviseTokenAuth::Concerns::User
end