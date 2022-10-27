import { defineConfig } from "vite";
import rakkas from "rakkasjs/vite-plugin";
import tsconfigPaths from "vite-tsconfig-paths";
import Unocss from 'unocss/vite'
import { presetWind, presetIcons, presetWebFonts, presetTypography } from 'unocss'

export default defineConfig({
  plugins: [Unocss({
          presets: [presetWind(), presetIcons(), presetWebFonts(), presetTypography()]
          }), tsconfigPaths(), rakkas()],
});
