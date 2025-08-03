import { ComponentProps } from "react";

export const ColorScore = ({
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
