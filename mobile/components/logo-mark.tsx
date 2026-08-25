/**
 * The Rekalla mark — the R letterform with a brain growing out of its shoulder.
 * Same geometry as the web app's public/logo.svg, redrawn with react-native-svg
 * so it stays sharp at any size and follows the theme colour.
 */
import Svg, { G, Path } from "react-native-svg";
import { View } from "react-native";
import { colors } from "../lib/theme";

export function LogoMark({
  size = 64,
  color = colors.label,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <View accessibilityRole="image" accessibilityLabel="Rekalla">
      <Svg width={size} height={size} viewBox="0 0 512 512" fill="none">
        <G transform="translate(-53 -11)">
          <G stroke={color} strokeWidth={13} strokeLinejoin="round">
            <Path d="M118 136 L226 136 C288 136 324 168 324 220 C324 258 302 287 264 298 L330 416 L274 416 L212 302 L170 302 L170 416 L118 416 Z" />
            <Path d="M170 182 L170 258 L222 258 C254 258 272 244 272 220 C272 195 254 182 222 182 Z" />
          </G>
          <G stroke={color} strokeWidth={13} strokeLinecap="round">
            <Path d="M296 160 C310 122 362 112 388 136 C414 114 452 124 462 154 C494 160 506 196 488 220 C510 244 502 282 470 292 C468 326 432 342 404 328 C384 352 344 350 330 322" />
            <Path d="M404 328 C406 348 420 360 438 364" />
            <Path d="M330 322 C336 356 366 368 366 396" />
            <Path d="M388 136 C380 158 384 176 398 188" />
            <Path d="M462 154 C450 170 448 188 458 202" />
            <Path d="M488 220 C464 218 444 226 434 244" />
            <Path d="M350 208 C368 224 396 230 420 222" />
            <Path d="M356 270 C382 282 416 280 440 264" />
          </G>
        </G>
      </Svg>
    </View>
  );
}
