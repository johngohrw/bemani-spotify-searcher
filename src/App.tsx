import { ComponentProps, useEffect, useRef, useState } from "react";
import { allSongs } from "./assets/songs";
import { request } from "./utils/request";

import clsx from "clsx";
import stringSimilarity from "string-similarity-js";
import styles from "./App.module.scss";

const allSongsFlatWithGameSeries = Object.entries(allSongs)
  .map(([key, songs]) => {
    return songs.map((song) => ({ ...song, series: key }));
  })
  .flat()
  .map((song, i) => ({ ...song, id: i }));

type SongType = (typeof allSongsFlatWithGameSeries)[number];
type Results = Record<
  number,
  { loading: boolean; results?: TrackResultWithSimilarity[] }
>;
type TrackResult = {
  name: string;
  artists: {
    name: string;
    uri: string;
  }[];
  album: {
    name: string;
    images: {
      url: string;
    }[];
  };
  preview_url: string;
  uri: string;
};
type TrackResultWithSimilarity = {
  trackNameSimilarity: number;
  artistSimilarity: number;
} & TrackResult;

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

  const ResultList = ({
    queryString,
    results,
  }: {
    results: Results;
    queryString: string;
  }) => {
    const selectedSongResultsIsLoading =
      selectedSong?.id &&
      selectedSong.id in results &&
      results[selectedSong.id].loading;

    const searchResults =
      (selectedSong?.id &&
        selectedSong.id in results &&
        results[selectedSong.id]?.results) ||
      [];
    return (
      <div style={{ width: "320px" }}>
        {selectedSong && (
          <div style={{ paddingBottom: "6px" }}>
            <div style={{ fontSize: "11px", fontFamily: "sans-serif" }}>
              searching for:{" "}
            </div>
            <div
              style={{
                fontFamily: "monospace",
                padding: "3px",
                background: "#f2f2f2",
                borderRadius: "4px",
              }}
            >
              {queryString}
            </div>
          </div>
        )}
        <div>{!!selectedSongResultsIsLoading && "loading..."}</div>
        <div>
          {!selectedSongResultsIsLoading &&
            searchResults.length <= 0 &&
            "no results"}
        </div>
        <div style={{ display: "flex", flexFlow: "column nowrap", gap: "2px" }}>
          {searchResults.map((result) => (
            <SearchResult
              result={result}
              isPlaying={
                audioRef.current.src === result.preview_url &&
                !audioRef.current.paused
              }
              onResultClick={(result) => {
                setSelectedResult(result);

                if (!result) return;
                handlePlayPause(result.preview_url);
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.layoutContainer}>
      <div className={styles.header}>
        <div className={styles.brand}>IIDX spotify song searcher</div>

        <a
          style={{}}
          href="https://github.com/johngohrw/bemani-spotify-searcher/"
        >
          github
        </a>
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
              results={results}
              queryString={selectedSong ? getQueryString(selectedSong) : ""}
            />
          </div>

          <div>
            <div className={styles.sectionTitle}>Track title</div>

            <ResultList
              results={trackResults}
              queryString={
                selectedSong ? getOnlySongQueryString(selectedSong) : ""
              }
            />
          </div>
          <div>
            <div className={styles.sectionTitle}>Artist</div>
            <ResultList
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
      {/* <div className={styles.footer}>
        <div
          style={{
            display: "flex",
            flexFlow: "row nowrap",
            alignItems: "center",
          }}
        >
          <img
            style={{
              width: "48px",
              height: "48px",
              background: "#98aea2",
              marginRight: "0.5rem",
            }}
            src={selectedResult?.album.images[0].url ?? ""}
          ></img>
          <div>
            <div style={{ fontSize: "13px", marginBottom: "4px" }}>
              <a href={selectedResult?.uri}>{selectedResult?.name}</a>
            </div>
            <div style={{ fontSize: "13px" }}>
              <a href={selectedResult?.artists[0].uri}>
                {selectedResult?.artists[0].name}
              </a>
            </div>
          </div>
        </div>
        <div>
          <button>play</button>
        </div>
        <div>hi</div>
      </div> */}
    </div>
  );
}

export default App;

export const SearchResult = ({
  result,
  isPlaying,
  onResultClick,
  className,
  ...rest
}: {
  onResultClick: (track: TrackResult) => void;
  isPlaying: boolean;
} & ComponentProps<"div"> & {
    result: TrackResultWithSimilarity;
  }) => {
  return (
    <div
      className={clsx(styles.song, className)}
      onClick={() => onResultClick(result)}
      {...rest}
    >
      <div
        style={{
          display: "flex",
          flexFlow: "column nowrap",
          border: "1px solid black",
          borderRadius: "4px",
          overflow: "hidden",
          flexShrink: "0",
          marginRight: "4px",
        }}
      >
        <ColorScore
          score={result.trackNameSimilarity}
          style={{ borderBottom: "1px solid black" }}
        />
        <ColorScore score={result.artistSimilarity} />
      </div>
      <div className={styles.left}>
        <div className={styles.title}>{result.name}</div>
        <div className={styles.artist}>{result.artists[0].name}</div>
      </div>
      {isPlaying && (
        <div
          style={{
            position: "absolute",
            right: "4px",
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          <div className={styles.arrowRight}></div>
        </div>
      )}
    </div>
  );
};

const ColorScore = ({
  score,
  style,
  ...rest
}: { score: number } & ComponentProps<"div">) => {
  const n = (1 - score) * 100;
  const R = (255 * n) / 100;
  const G = (255 * (100 - n)) / 100;
  const B = 0;
  return (
    <div
      style={{ width: "50px", background: "#ccc", height: "100%", ...style }}
      {...rest}
    >
      <div
        style={{
          backgroundColor: `rgb(${R},${G},${B})`,
          width: `${100 - n}%`,
          height: "100%",
        }}
      ></div>
    </div>
  );
};

export const Song = ({
  artist,
  title,
  series,
  active,
  className,
  ...rest
}: ComponentProps<"div"> & {
  artist: string;
  title: string;
  series: string;
  active?: boolean;
}) => {
  return (
    <div
      className={clsx(styles.song, className, active && styles.active)}
      {...rest}
    >
      <div className={styles.left}>
        <div className={styles.title}>{title}</div>
        <div className={styles.artist}>{artist}</div>
      </div>
      <div className={styles.right}>
        <div className={styles.series}>{series}</div>
      </div>
    </div>
  );
};
