const playButton = document.getElementById("play");
const pauseButton = document.getElementById("pause");
const nextButton = document.getElementById("next");
const previousButton = document.getElementById("previous");
const playingSong = document.getElementById("player-song-title");
const songArtist = document.getElementById("player-song-artist");

const allSongs = [
  {
    id: 0,
    title: "Empty Out Your Pockets",
    artist: "Juice WRLD",
    duration: "2:37",
    videoId: "XY7NsM1Z3vs"
  },
  {
    id: 1,
    title: "Blinding Lights",
    artist: "The Weeknd",
    duration: "3:22",
    videoId: "Vf7eTllOwx0"
  },
  {
    id: 2,
    title: "Sorry",
    artist: "Justin Bieber",
    duration: "3:20",
    videoId: "fRh_vgS2dFE"
  },
  {
    id: 3,
    title: "Perfect",
    artist: "One Direction",
    duration: "4:23",
    videoId: "2Vv-BfVoq4g"
  },
  {
    id: 4,
    title: "For A Reason",
    artist: "Karan Aujla",
    duration: "3:35",
    videoId: "rFv2Yj5d6nQ"
  }
];

const userData = {
  songs: allSongs,
  currentSong: null,
  songCurrentTime: 0
};

let ytPlayer = null;
let ytReady = false;

function setPlayerDisplay() {
  playingSong.textContent = userData.currentSong?.title || "";
  songArtist.textContent = userData.currentSong?.artist || "";
}

function markPlayingUI(isPlaying) {
  if (isPlaying) playButton.classList.add("playing");
  else playButton.classList.remove("playing");
}

function setPlayButtonAccessibleText() {
  const song = userData.currentSong;
  playButton.setAttribute("aria-label", song ? `Play ${song.title}` : "Play");
}

function getCurrentSongIndex() {
  return userData.currentSong ? userData.songs.indexOf(userData.currentSong) : -1;
}
function getNextSong() {
  const idx = getCurrentSongIndex();
  return userData.songs[idx + 1];
}
function getPreviousSong() {
  const idx = getCurrentSongIndex();
  return userData.songs[idx - 1];
}

function setStatus(msg) {
  // use the artist line as a simple status line
  songArtist.textContent = msg;
}

function ensureYTReady() {
  if (!ytReady || !ytPlayer) {
    setStatus("Loading YouTube player...");
    return false;
  }
  return true;
}

// Called automatically by the YouTube API script
window.onYouTubeIframeAPIReady = function () {
  ytPlayer = new YT.Player("yt-player", {
    host: "https://www.youtube-nocookie.com", // important
    height: "1",
    width: "1",
    videoId: userData.songs[0].videoId,
    playerVars: {
      origin: window.location.origin,          // important
      playsinline: 1,
      autoplay: 0,
      controls: 0,
      rel: 0,
      modestbranding: 1
    },
    events: {
      onReady: () => {
        ytReady = true;

        // IMPORTANT: force referrerpolicy on the generated iframe
        const iframe = ytPlayer.getIframe();
        if (iframe) {
          iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
        }
      },
      onError: (e) => {
        console.log("YT error code:", e.data);
      }
    }
  });

  userData.currentSong = userData.songs[0];
  setPlayerDisplay();
};

// Playback functions
function playSong(id, start = true) {
  const song = userData.songs.find((s) => s.id === id);
  if (!song) return;

  userData.currentSong = song;
  setPlayerDisplay();
  setPlayButtonAccessibleText();

  if (!ensureYTReady()) return;

  const startSeconds = start ? 0 : (userData.songCurrentTime || 0);

  // cue first (more reliable), then play
  ytPlayer.cueVideoById(song.videoId, startSeconds);
  ytPlayer.playVideo();
}

function pauseSong() {
  if (!ensureYTReady()) return;
  userData.songCurrentTime = ytPlayer.getCurrentTime ? ytPlayer.getCurrentTime() : 0;
  ytPlayer.pauseVideo();
}

function playNextSong() {
  if (userData.currentSong === null) {
    playSong(userData.songs[0].id);
    return;
  }

  const nextSong = getNextSong();
  if (nextSong) {
    userData.songCurrentTime = 0;
    playSong(nextSong.id);
  } else {
    // end playlist: stop
    userData.currentSong = null;
    userData.songCurrentTime = 0;
    setPlayerDisplay();
    setPlayButtonAccessibleText();
    markPlayingUI(false);
    if (ensureYTReady()) ytPlayer.stopVideo();
  }
}

function playPreviousSong() {
  if (userData.currentSong === null) return;
  const prev = getPreviousSong();
  if (prev) playSong(prev.id);
  else playSong(userData.songs[0].id);
}

// Button handlers
playButton.disabled = true; // disabled until YT is ready
playButton.addEventListener("click", () => {
  if (userData.currentSong === null) {
    playSong(userData.songs[0].id);
  } else {
    playSong(userData.currentSong.id, false);
  }
});

pauseButton.addEventListener("click", pauseSong);
nextButton.addEventListener("click", playNextSong);
previousButton.addEventListener("click", playPreviousSong);