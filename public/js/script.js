// Constantes e variáveis globais
const URL_ERROR = "Não foi possível tocar essa rádio.";
const PLAYING = "Tocando";
const NOT_PLAYING = "Parado";
var timeout;


// Funções

// É assíncrona, retorna promisse
function update_player() {
    return $.get( "/api/state", function( data ) {
      if( data.playing ){                 // Atualiza play-stop e status
        $( "#status" ).html( PLAYING );
        $( "#span-ps").attr('class', 'glyphicon glyphicon-stop');
        $( "#btn-ps").attr('data-action', 'stop');
      } else {
        $( "#status" ).html( NOT_PLAYING );
        $( "#span-ps").attr('class', 'glyphicon glyphicon-play');
        $( "#btn-ps").attr('data-action', 'play');
      }
        $( "#name" ).html( data.name );   // Atualiza nome
    }, "json");
};

function show_player() {
    // Esperar update_player (que é assíncrono) para mostrar player
    update_player().then(function (response) {
      $("#alert").hide();
      $("#radios").hide();
      $("#player").show();
    });
}

function show_radios() {
    $("#silence").hide();   // Estratégico para só aparecer quando pedido.
    $("#alert").hide();
    $("#player").hide();
    $("#radios").show();
}

function show_alert() {
    $("#player").hide();
    $("#radios").hide();
    $("#alert").show();
}

function vol_osd() {
    $.get( "/api/vol", function( data ) {
        $("#player-bottom").hide();
        $("#osd-text").html(data);
        $("#osd").show();
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            $("#osd").hide();
            $("#player-bottom").show();
        }, 2500);
    });
}

// Decide o que mostrar ao iniciar, baseado se
// está tocando. Inclui mensagem amigável.
function start_view() {
    $.get( "/api/state", function( data ) {
        if ( data.playing ) {
            show_player();
        } else {
            show_radios();
            $("#silence").show();
        }
    }, "json");
}

function play_url(url) {
    $("#alert-text").html("Sintonizando...");
    show_alert();

    $.get("/api/play-url", {url: url})
        .done(function() {
            setTimeout(function() {
                show_player();
            }, 2000);
        })
        .fail(function() {
            show_radios();
            alert(URL_ERROR);
        });
}


// Documento
$( document ).ready(function() {
    start_view();

    // Pausa atualização se janela não está em foco
    // e esconde player se visível
    window_focus = true;
    $( window ).focus(function() {
        window_focus = true;
        if( $( "#alert" ).is(":visible") ) show_player();
    }).blur(function() {
        window_focus = false;
        if( $( "#player" ).is(":visible") ) {
          $("#alert-text").html(document.title);
          show_alert();
        }
    });

    // Atualiza player periodicamente
    setInterval(function() {
        if( $( "#player" ).is(":visible") && window_focus ) update_player();
    }, 4000);

    // "Desclica" botões após clicados
    $( "button" ).click(function( event ){
        $(this).blur();
    });

    $( "#btn-vup" ).click(function( event ) {
        $.get( "/api/vup", function( data ) { vol_osd(); });
    });

    $( "#btn-vdown" ).click(function( event ) {
        $.get( "/api/vdown", function( data ) { vol_osd(); });
    });

    $( "#btn-ps" ).click(function( event ) {
        action = $(this).attr("data-action");
        if(action == "play")
          $.get( "/api/play", function( data ) { update_player(); });
        else if(action == "stop")
          $.get( "/api/stop", function( data ) { update_player(); });
    });

    $( "#btn-random" ).click(function( event ) {
        $( "#alert-text" ).html("Conectando ao armazenamento...");
        show_alert();
        $.get( "/api/play-random" )
            .always(function(data) {
            setTimeout(function() {
                show_player();
              }, 3000);
        });
    });

    $( "#btn-radios" ).click(function( event ) {
        show_radios();
    });

    $( "#btn-player" ).click(function( event ) {
        show_player();
    });

    $( ".radio-name" ).click(function( event ) {
        url = $(this).data("url");
        play_url(url);
    });

    $( "#insert" ).click(function( event ) {
        url = prompt("Insira a URL");
        if(url != null)
            play_url(url);
    });
});
