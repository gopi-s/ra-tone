//=================================================== Stay signed in ====================================================
$.support.cors = true;
var song; var disableBack;

$( document ).bind( "mobileinit", function() {
    $.mobile.allowCrossDomainPages = true;
    $.mobile.defaultPageTransition = 'slide';
    $.mobile.phonegapNavigationEnabled = true;
    $.mobile.changePage.defaults.allowSamePageTransition = true;
});

$(document).ready(function() {

  $('.scrollable').height($(window).height() * 0.58);

  $('.home_link').click(function () {
    if ($.mobile.activePage.attr('id') == "media_player") {stopAudio();}
    $.mobile.changePage("#home", {transition: "slide",reverse: true});
  });

  $('.movie_link').click(function () {
    if ($.mobile.activePage.attr('id') == "media_player") {stopAudio();}
    $.mobile.changePage("#movies", {transition: "slide",reverse: true});
  });

  document.addEventListener("deviceready", onDeviceReady, false);
});

function year_list() {

    $.ajax({
      url:'https://groscreen.com/ra_tone/dashboard/year_list',
      type:'POST',
      data: {markers: 1},
      beforeSend:function(){
        disableBack = true;
        cordova.plugins.pDialog.init({
            theme : 'HOLO_DARK',
            progressStyle : 'SPINNER',
            cancelable : false,
            title : 'Please Wait...',
            message : 'Contacting server ...'
        });
        $('#ra_year_list').html('');
      }
  }).done(function(res){
    $('#ra_year_list').html(res);

    cordova.plugins.pDialog.dismiss();

    $.mobile.changePage('#home'); disableBack = false;

    update_device_info();

  }).fail(function(){

    cordova.plugins.pDialog.dismiss();

    var fail_result = confirm("No/bad internet connection?");

    if (fail_result == true) {navigator.app.exitApp();}

  });

}

function update_device_info () {
  
  $.ajax({
    url:'https://groscreen.com/ra_tone/dashboard/update_device_info',
    type:'POST',
    data: {ra_data:JSON.stringify(localStorage.getItem("dinfo"))}
  }).done(function(res_dev){
     //
  });

}


$(document).on('click','.ra_select_yr',function () {
    var sl_yr = $(this).attr('year');
    $.ajax({
        url:'https://groscreen.com/ra_tone/dashboard/movie_lists',
        type:'POST',
        data:{year:sl_yr},
        beforeSend:function(){
          disableBack = true;
          cordova.plugins.pDialog.init({
              theme : 'HOLO_DARK',
              progressStyle : 'SPINNER',
              cancelable : false,
              title : 'Please Wait...',
              message : 'Contacting server ...'
          });

          $('#ra_movie_list').html('');
        },
        success:function(res){
          disableBack = false;
          cordova.plugins.pDialog.dismiss();
          $('#ra_movie_list').html(res);
          $.mobile.changePage('#movies');
        }
    }).fail(function(){
      cordova.plugins.pDialog.dismiss();
      var result = confirm("No/bad internet connection?");
          if (result == true) {navigator.app.exitApp();}
    });
});



$(document).on('click','.ra_select_movie',function () {
    var sl_mv = $(this).attr('movie');

    $.ajax({
        url:'https://groscreen.com/ra_tone/dashboard/song_lists',
        type:'POST',
        data:{movie:sl_mv},
        beforeSend:function(){
          disableBack = true;
          cordova.plugins.pDialog.init({
              theme : 'HOLO_DARK',
              progressStyle : 'SPINNER',
              cancelable : false,
              title : 'Please Wait...',
              message : 'Contacting server ...'
          });
          $('.scrollable').html('');
        },
        success:function(res){
          disableBack = false;
          cordova.plugins.pDialog.dismiss();
          $('.scrollable').html(res);
          $.mobile.changePage('#media_player');
          // initialization - first element in playlist
          initAudio($('.scrollable .ui-grid-solo:first-child'));
        }
    }).fail(function(){
      cordova.plugins.pDialog.dismiss();
      var result = confirm("No/bad internet connection?");
          if (result == true) {navigator.app.exitApp();}
    });
});


// media player scripts
function initAudio(elem) {
    var url = elem.attr('audiourl');
    song = new Audio(url);
    $('.scrollable .ui-grid-solo').removeClass('active');
    elem.addClass('active');
  }

 function playAudio() {
    song.play();

    cordova.plugins.pDialog.init({
              theme : 'HOLO_DARK',
              progressStyle : 'SPINNER',
              cancelable : false,
              title : 'Please Wait...',
              message : 'Buffering ...'
          });
    //cordova.plugins.pDialog.setProgress(0);

    disableBack = true;

    song.addEventListener('progress', function() {
      if(song.buffered.length > 0){
        var bufferedEnd = song.buffered.end(song.buffered.length - 1);
        var duration =  song.duration;

        if (duration > 0) {
          var b_amt = Math.round((bufferedEnd / duration)*100);
          cordova.plugins.pDialog.setProgress(b_amt);
          if(b_amt == 100){
            disableBack = false;
            cordova.plugins.pDialog.dismiss();        
          }
        }
      }
    });

    $('.mp_play img').attr('src','images/pause.png');
    $('.mp_play').addClass('mp_pause');
    $('.mp_play').removeClass('mp_play');

    var play_sts;
    song.addEventListener('timeupdate', function() {
      var dur =  song.duration;
      if (dur > 0) {
        play_sts = Number((song.currentTime / dur)*100);
        if(play_sts==100){
          $('.mp_pause img').attr('src','images/play.png');
          $('.mp_pause').addClass('mp_play');
          $('.mp_pause').removeClass('mp_pause');
          return false;
        }
        
      }
    });
  }


function stopAudio() {
    song.pause();
    $('.mp_pause img').attr('src','images/play.png');
    $('.mp_pause').addClass('mp_play');
    $('.mp_pause').removeClass('mp_pause');
  }

$('.coverArt, .media_controls,#login').on('touchmove', function(e) {e.preventDefault();});

// play click
$(document).on('click','.mp_play', function(e){e.preventDefault();playAudio();});
   
// pause click
$(document).on('click','.mp_pause', function(e){e.preventDefault();stopAudio();});

// playlist elements - click
$(document).on('click','.scrollable .ui-grid-solo', function(){stopAudio(); initAudio($(this));playAudio();});

function fail() {console.log("failed to get filesystem");}

function gotFS(fileSystem) {
    console.log("got filesystem: "+fileSystem.name); // displays "persistent"
    window.rootFS = fileSystem.root;
}

function dirReady(entry) {window.appRootDir = entry;}


$(document).on('click','.mp_dwd, .mp_ring',function () {
    
  var url = $('.active').attr('audiourl');
  var titles = $('.active').attr('artist');
  var m_ring = $(this).attr('ring-val');

  cordova.plugins.pDialog.init({
          theme : 'HOLO_DARK',
          progressStyle : 'SPINNER',
          cancelable : false,
          title : 'Please Wait...',
          message : 'Downloading ...'
      });
  //cordova.plugins.pDialog.setProgress(0);

  disableBack = true;

  cordova.exec(
    function(freeSpace) {
      if((freeSpace/1024) > 10){

        var fileTransfer = new FileTransfer();
        var urls = url;
        var filePath = window.rootFS.toURL() + slug(titles) + ".mp3";

        fileTransfer.onprogress = function(result){
          var percent =  result.loaded / result.total * 100;
          percent = Math.round(percent);
          cordova.plugins.pDialog.setProgress(percent);
        };

        fileTransfer.download(urls,filePath,
          function(entry) {
            if(m_ring == 2){

              window.ringtone.setRingtone(filePath,titles, null, "ringtone", 
                function(success) {
                  navigator.notification.alert("Ringtone set successfully", null, 'Success', 'OK');
                },
                function(err) {
                  navigator.notification.alert(err, null, 'Error', 'OK');
              });

            }else{
              navigator.notification.alert('File saved into internal storage', null, 'Success', 'OK');
            }
            cordova.plugins.pDialog.dismiss();  
            disableBack = false;
          },
          function(error) {
            disableBack = false;
            cordova.plugins.pDialog.dismiss();  
           navigator.notification.alert("Cannot download rintone.  No/bad internet connection?", null, 'Ringtone', 'OK');
          });

      }else{
        disableBack = false;
        cordova.plugins.pDialog.dismiss();  
        navigator.notification.alert("Free up space in memory card and try again!", null, 'Alert', 'OK');
      }
    },
    function() {
      disableBack = false;
      cordova.plugins.pDialog.dismiss();  
      navigator.notification.alert("Error checking filesystem", null, 'Error', 'OK');
    },
    "File", "getFreeDiskSpace", []
  );
});


var slug = function(str) {
  str = str.replace(/^\s+|\s+$/g, ''); // trim
  str = str.toLowerCase();

  // remove accents, swap ñ for n, etc
  var from = "ãàáäâẽèéëêìíïîõòóöôùúüûñç·/_,:;";
  var to   = "aaaaaeeeeeiiiiooooouuuunc------";
  for (var i=0, l=from.length ; i<l ; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }

  str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
  .replace(/\s+/g, '-') // collapse whitespace and replace by -
  .replace(/-+/g, '-'); // collapse dashes
  return str;
};


function onDeviceReady() {

    var deviceInfo = cordova.require("cordova/plugin/DeviceInformation");

    deviceInfo.get(function(result) {
       localStorage.setItem('dinfo', result);
    });

   year_list();
    window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, function(){
      console.log("error requesting LocalFileSystem");
    });

   

    document.addEventListener("backbutton", function() {

      if ($.mobile.activePage.attr('id') == "login") {navigator.app.exitApp();}

      if ($.mobile.activePage.attr('id') == "media_player") {
        if (disableBack == false) {stopAudio();}
      }

      if (disableBack == false) {
        var prevPage = $.mobile.activePage.attr('data-prev');
        if (prevPage) {
          if (prevPage == "login") {
            var result = confirm("Do you wan't to exit from ra-tone ?");
            if (result == true) {navigator.app.exitApp();}
          }else {
            $.mobile.changePage("#" + prevPage, {
              transition: "slide",
              reverse: true
            });
          }
        } else {
          var result = confirm("Do you wan't to exit from ra-tone?");
          if (result == true) {navigator.app.exitApp();}
        }
      }
    }, false);
  }