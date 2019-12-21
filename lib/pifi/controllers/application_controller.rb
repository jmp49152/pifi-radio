require "pifi/lib/config_getter"
require "pifi/lib/streams_getter"
require "sinatra/base"

module PiFi
  class ApplicationController < Sinatra::Base
    set ConfigGetter.new.config
    set :streams, StreamsGetter.new(settings.streams_file, settings.streamsp_file).streams

    set :root, File.expand_path("../../", __FILE__)

    configure :production do
      set :static, settings.serve_static
    end
  end
end
