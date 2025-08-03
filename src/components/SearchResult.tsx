import { ComponentProps } from "react";

import clsx from "clsx";
import { ColorScore } from "./ColorScore";
import styles from "./SearchResult.module.scss";
import { TrackResult, TrackResultWithSimilarity } from "../utils/types";

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
