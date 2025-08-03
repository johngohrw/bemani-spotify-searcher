import { useEffect, useRef, useState } from "react";
import { allSongsFlatWithGameSeries } from "./assets/songs";
import { request } from "./utils/request";

import stringSimilarity from "string-similarity-js";
import styles from "./App.module.scss";

import { ResultList } from "./components/ResultList";
import { Song } from "./components/Song";
import { Results, SongType, TrackResult } from "./utils/types";

const fetchSong = async (query: string) => {
  return await request("/v1/search", {
    method: "GET",
    params: {
      q: query,
      type: "track",
      limit: 20,
      include_external: "audio",
    },
  });
};

const getQueryString = (song: SongType) => {
  return `${song.song} ${song.artist}`;
};

const getOnlySongQueryString = (song: SongType) => {
  return `${song.song}`;
};

const getOnlyArtistQueryString = (song: SongType) => {
  return `${song.artist}`;
};

function App() {
  const [selectedSong, setSelectedSong] = useState<SongType>();
  const [results, setResults] = useState<Results>({});
  const [artistResults, setArtistResults] = useState<Results>({});
  const [trackResults, setTrackResults] = useState<Results>({});
  const [selectedResult, setSelectedResult] = useState<TrackResult>();

  const [, setRerender] = useState(0);

  const audioRef = useRef(new Audio());

  useEffect(() => {
    audioRef.current.volume = 0.3;
  }, []);

  useEffect(() => {
    const fetch = async () => {
      const _song = selectedSong as SongType;
      setResults((prev) => ({ ...prev, [_song.id]: { loading: true } }));
      setArtistResults((prev) => ({ ...prev, [_song.id]: { loading: true } }));
      setTrackResults((prev) => ({ ...prev, [_song.id]: { loading: true } }));

      const _searchTracks = async (queryString: string) => {
        const results = await fetchSong(queryString);

        const songs = (results.data.tracks.items ?? []) as TrackResult[];
        const withSimilarity = songs.map((song) => ({
          ...song,
          trackNameSimilarity: stringSimilarity(song.name, _song.song),
          artistSimilarity: stringSimilarity(
            song.artists[0].name,
            _song.artist
          ),
        }));
        return withSimilarity;
      };

      _searchTracks(getQueryString(_song)).then((results) => {
        setResults((prev) => ({
          ...prev,
          [_song.id]: { loading: false, results },
        }));
      });

      _searchTracks(getOnlySongQueryString(_song)).then((results) => {
        setTrackResults((prev) => ({
          ...prev,
          [_song.id]: { loading: false, results },
        }));
      });

      _searchTracks(getOnlyArtistQueryString(_song)).then((results) => {
        setArtistResults((prev) => ({
          ...prev,
          [_song.id]: { loading: false, results },
        }));
      });
    };

    if (selectedSong && !(selectedSong.id in results)) fetch();
  }, [selectedSong]);

  const handlePlayPause = (url: string) => {
    if (audioRef.current.src === url) {
      if (audioRef.current.paused) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    } else {
      audioRef.current.src = url;
      audioRef.current.play();
    }
    setRerender((prev) => prev + 1);
  };

  return (
    <div className={styles.layoutContainer}>
      <div className={styles.header}>
        <div className={styles.brand}>IIDX spotify song searcher</div>
        <div style={{ display: "flex", flexFlow: "row nowrap", gap: "12px" }}>
          <a href="https://open.spotify.com/playlist/2eiaPdh3sFELbCehBqbxY9?si=3bf682d727f34921">
            playlist
          </a>
          <a href="https://github.com/johngohrw/bemani-spotify-searcher/">
            github
          </a>
        </div>
      </div>
      <div className={styles.splitter}>
        <div className={styles.songList} style={{ width: "320px" }}>
          {allSongsFlatWithGameSeries.map((song) => (
            <Song
              artist={song.artist}
              title={song.song}
              series={song.series}
              key={song.id}
              active={selectedSong?.id === song.id}
              onClick={() => {
                setSelectedSong(song);
              }}
            />
          ))}
        </div>
        <div className={styles.panel}>
          <div>
            <div className={styles.sectionTitle}>Track title + Artist</div>
            <ResultList
              setSelectedResult={setSelectedResult}
              audioRef={audioRef}
              handlePlayPause={handlePlayPause}
              selectedSong={selectedSong}
              results={results}
              queryString={selectedSong ? getQueryString(selectedSong) : ""}
            />
          </div>
          <div>
            <div className={styles.sectionTitle}>Track title</div>

            <ResultList
              setSelectedResult={setSelectedResult}
              audioRef={audioRef}
              handlePlayPause={handlePlayPause}
              selectedSong={selectedSong}
              results={trackResults}
              queryString={
                selectedSong ? getOnlySongQueryString(selectedSong) : ""
              }
            />
          </div>
          <div>
            <div className={styles.sectionTitle}>Artist</div>
            <ResultList
              setSelectedResult={setSelectedResult}
              audioRef={audioRef}
              handlePlayPause={handlePlayPause}
              selectedSong={selectedSong}
              results={artistResults}
              queryString={
                selectedSong ? getOnlyArtistQueryString(selectedSong) : ""
              }
            />
          </div>

          {selectedResult && (
            <div
              style={{
                width: "320px",
                display: "flex",
                flexFlow: "column nowrap",
                alignItems: "center",
              }}
            >
              <img
                style={{ width: "320px", height: "320px" }}
                src={selectedResult?.album.images[0].url}
              ></img>
              <div>{selectedResult?.name}</div>
              <a href={selectedResult?.artists[0].uri}>
                {selectedResult?.artists[0].name}
              </a>

              <div>{selectedResult?.album.name}</div>
              <a href={selectedResult.uri}>URI</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
