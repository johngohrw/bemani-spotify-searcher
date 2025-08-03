import { SongType, Results, TrackResult } from "../utils/types";
import { SearchResult } from "./SearchResult";

export const ResultList = ({
  queryString,
  results,
  selectedSong,
  audioRef,
  setSelectedResult,
  handlePlayPause,
}: {
  selectedSong: SongType | undefined;
  results: Results;
  queryString: string;
  audioRef: React.MutableRefObject<HTMLAudioElement>;
  setSelectedResult: React.Dispatch<
    React.SetStateAction<TrackResult | undefined>
  >;
  handlePlayPause: (url: string) => void;
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
            key={result.uri}
            result={result}
            isPlaying={
              audioRef.current.src === result.preview_url &&
              !audioRef.current.paused
            }
            onResultClick={(result) => {
              setSelectedResult(result);
              if (!result || !result.preview_url) return;
              handlePlayPause(result.preview_url);
            }}
          />
        ))}
      </div>
    </div>
  );
};
