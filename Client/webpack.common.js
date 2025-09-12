const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: "./src/Main.tsx",
  watchOptions: {
    ignored: ["**/node_modules", "**/Legacy", "./src/Legacy/*"],
    poll: 1000,
    aggregateTimeout: 600,
  },
  module: {
    rules: [
      {
        test: /\.worker.+\.js$/,
        loader: "worker-loader",
      },
      {
        test: /\.(tsx|ts)$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [{ from: "src/static", to: "./", force: true }],
    }),
  ],
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "bundle.js",
    path: (() => {
      const outputDir = path.resolve(__dirname, "dist");
      console.log("Outputting to ", outputDir);
      return outputDir;
    })(),
  },
};
