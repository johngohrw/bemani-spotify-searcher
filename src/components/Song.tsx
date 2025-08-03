import clsx from "clsx";
import { ComponentProps } from "react";
import styles from "./Song.module.scss";

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
