const path = require("path");

module.exports = {
  entry: "./src/Main.tsx",
  devtool: "inline-source-map",
  mode: "development",
  watchOptions: {
    ignored: ["**/node_modules", "**/Legacy", "./src/Legacy/*"],
    poll: 1000,
    aggregateTimeout: 600,
  },
  module: {
    rules: [
      {
        test: /\.(tsx|ts)$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
};
