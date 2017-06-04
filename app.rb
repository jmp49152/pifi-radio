require 'sinatra'
require 'ruby-mpd'
require 'json'
require 'fileutils'					# para workaround de touch no AirPort
require_relative 'methods'
require_relative 'player'


Thread::abort_on_exception = true


# Constants
CACHE_MAX_AGE = 86400
NAS_TIME = 10		# in seconds

# For cache use
start_time = Time.now

# User Configuration
config = load_json("config.json")
streams, streams_private = load_streams(config["streams_dir"])

# Sinatra configuration
configure do
 	set :bind, '0.0.0.0'
 	set :static_cache_control, [:public, :max_age => CACHE_MAX_AGE]
end

# Create player and NAS thread
player = Player.new(streams.merge(streams_private))
nas_ping(config["ping_path"], player)

# Cache
before /\/s?/ do 		# for / and /s
	cache_control :public, :max_age => CACHE_MAX_AGE
	last_modified start_time
end
before '/api/*' do
	cache_control :no_cache
end


# Routes
get '/api' do
  content_type :json
	{ :playing => player.playing,
		:song => player.song,
		:local => player.local,
		:elapsed => player.elapsed,
		:length => player.length }.to_json
end

post '/api' do
	cmd = params[:cmd]
	case cmd
	when "play"
		player.play
	when "stop"
		player.stop
	when "vdown"
		player.vch(-5).to_s + "%"
	when "vup"
		player.vch(+5).to_s + "%"
	when "play-url"
		url = params[:url].strip
		player.play_url(url)
	when "play-random"
		player.play_random
	end
end

get '/' do
	hostname = `uname -n`.chop.capitalize
	erb :main, locals: { hostname: hostname, streams: streams }
end

get '/s' do
	hostname = `uname -n`.chop.capitalize
	erb :main, locals: { hostname: hostname, streams:
		streams_private.merge({"Rio de Janeiro":""}).merge(streams) }
end


get '/updatedb' do
	player.update_db
	"<a href=\"/\">DB e playlist DB atualizados.</a>"
end

error do
	'<h3>Desculpe, ocorreu um erro.</h3><p>Mensagem: ' + \
		env['sinatra.error'].message + '</p><a href="/"><h2>Voltar</h2></a>'
end
