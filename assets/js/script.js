var currentPlaylist = []
var shufflePlaylist = []
var tempPlaylist = []
var audioElement = null
var mouseDown = false
var currentIndex = 0
var repeat = false
var mute = false
var shuffle = false
var userLoggedIn
var timer

$(document).click(function(click) {
  var target = $(click.target)

  if (!target.hasClass("item") && !target.hasClass("optionsButton")) {
    hideOptionsMenu()
  }
})

$(window).scroll(function() {
  hideOptionsMenu()
})

$(window).on('popstate', function (event) {
  // location.reload()
});

$(document).on("change", "select.playlist", function() {
  var playlistId = $(this).val()
  var songId = $(this).prev(".songId").val()
  
  $.post('includes/handlers/ajax/addToPlaylist.php', { playlist_id: playlistId, song_id: songId })
   .done(function(data) {
     var json = JSON.parse(data)

     if (json.type == 'error') {
       alert(json.message)
     }

     hideOptionsMenu();
   })
  $(this).val("")
})

function openPage(url) {

  if (timer != null) {
    clearTimeout(timer)
  }

  if (url.indexOf("?") == -1) {
    url = url + "?";
  }

  var encodedURL = encodeURI(url + "&userLoggedIn=" + userLoggedIn)
  $("#mainContent").load(encodedURL)
  $("body").scrollTop(0)
  history.pushState(null, null, url)
}

function logout() {
  $.post("includes/handlers/ajax/logout.php", function() {
    location.reload()
  })
}

function updateEmail(emailClass) {
  var email = $("." + emailClass).val()

  $.post("includes/handlers/ajax/updateEmail.php", { email: email, username: userLoggedIn })
  .done(function(response) {
    $("." + emailClass).nextAll(".message").text(response)
  })
}

function updatePassword(oldPasswordClass, confirmPasswordClass, newPasswordClass) {
  var oldPassword = $("." + oldPasswordClass).val()
  var confirmPassword = $("." + confirmPasswordClass).val()
  var newPassword = $("." + newPasswordClass).val()

  $.post("includes/handlers/ajax/updatePassword.php", { 
    oldPassword: oldPassword, 
    confirmPassword: confirmPassword, 
    newPassword: newPassword, 
    username: userLoggedIn 
  })
  .done(function (response) {
    $("." + oldPasswordClass).nextAll(".message").text(response)
  })
}

function playFirstSong() {
  setTrack(tempPlaylist[0], tempPlaylist, true)
}

function createPlaylist() {
  var playlistName = prompt("Please enter the name of the playlist")

  if (playlistName != null) {
    $.post("includes/handlers/ajax/createPlaylist.php", { playlist_name: playlistName, username: userLoggedIn })
      .done(function (data) {
       var json = JSON.parse(data)
       if (json.type === "error") {
         alert(json.message)
         return
       }
       
      openPage("user_music.php")
    })
  } 
}

function deletePlaylist(playlistId) {
  var prompt = confirm("Are you sure?")

  if (prompt) {
    $.post("includes/handlers/ajax/deletePlaylist.php", { playlist_id: playlistId })
      .done(function (data) {
        var json = JSON.parse(data)
        if (json.type === "error") {
          alert(json.message)
          return
        }

        openPage("user_music.php")
      })
  }
}

function removeFromPlaylist(button, playlistId) {
  var songId = $(button).prevAll(".songId").val()
  
  $.post("includes/handlers/ajax/removeFromPlaylist.php", { song_id: songId, playlist_id: playlistId })
    .done(function (data) {
      var json = JSON.parse(data)
      if (json.type === "error") {
        alert(json.message)
        return
      }

      openPage(`playlist.php?id=${playlistId}`)
    })
}

function showOptionsMenu(button) {
  var songId = $(button).prevAll('.songId').val()
  var menu = $(".optionsMenu")
  var menuWidth = menu.width()
  
  var scrollTop = $(window).scrollTop()
  var elementOffset = $(button).offset().top

  var top = elementOffset - scrollTop
  var left = $(button).position().left

  menu.find(".songId").val(songId)

  menu.css({
    "top": top + "px",
    "left": (left - menuWidth) + "px",
    "display": "inline",
  })
}

function hideOptionsMenu() {
  var menu = $(".optionsMenu")
  if (menu.css("display") != "none") {
    menu.css("display", "none")
  }
}

function formatTime(duration) {
  var time = Math.round(duration)
  
  var minutes = Math.floor(time / 60);
  var seconds = time - (minutes * 60);

  if (seconds < 10) {
    seconds = "0" + String(seconds);
  }

  return minutes + ":" + seconds;
}

function updateTimeProgressBar(audio) {
  $(".progressTime.current").text(formatTime(audio.currentTime))
  $(".progressTime.remaining").text(formatTime(audio.duration - audio.currentTime))

  var progress = audio.currentTime / audio.duration * 100
  $(".playbackBar .progress").css("width", progress + "%") 
}

function updateVolumeProgressBar(audio) {
  var progress = audio.volume * 100
  $(".volumeBar .progress").css("width", progress + "%") 
}

function Audio() {

  this.currentlyPlaying = null
  this.audio = document.createElement('audio')

  this.audio.addEventListener("canplay", function() {
    $(".progressTime.remaining").text(formatTime(this.duration))
  })

  this.audio.addEventListener("timeupdate", function () {
    if (this.duration) {
      updateTimeProgressBar(this)
    }
  })

  this.audio.addEventListener("ended", function() {
    nextSong()
  })

  this.audio.addEventListener("volumechange", function () {
    updateVolumeProgressBar(this)
  })

  this.setTrack = function(track) {
    this.currentlyPlaying = track
    this.audio.src = track.path
  }

  this.play = function() {
    this.audio.play()
  }

  this.pause = function () {
    this.audio.pause()
  }
  
  this.setTime = function(seconds) {
    this.audio.currentTime = seconds
  }

  this.setMute = function(mute) {
    this.audio.muted = mute
  }

  this.setVolume = function(volume) {
    this.audio.volume = volume
  }

  this.getCurrentTime = function () {
    return this.audio.currentTime
  }

  this.getVolume = function() {
    return this.audio.volume
  }

}