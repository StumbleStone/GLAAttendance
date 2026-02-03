import * as path from "path";
import webpack from "webpack";
import { merge } from "webpack-merge";
import common from "./webpack.common";
// in case you run into any typescript error when configuring `devServer`
import "webpack-dev-server";

const config: webpack.Configuration = merge(common, {
  mode: "development",
  devtool: "inline-source-map",
  devServer: {
    hot: false,
    static: {
      directory: path.join(__dirname, "public"),
    },
    compress: true,
    port: 8180,
  },
});

export default config;
