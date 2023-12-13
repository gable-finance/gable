const path = require('path');

module.exports = {
  entry: {
    index: './java/index.mjs',
    supply: './java/supply.mjs',
    dashboard: './java/dashboard.mjs',
    counting: './java/counting.mjs',
    dashboardGeneric: './java/dashboardGeneric.mjs',
    dashboardDashboard: './java/dashboardDashboard.mjs',
    radixToolkit: './java/radixToolkit.mjs',
    borrow: './java/borrow.mjs',
    airdrop: './java/airdrop.mjs'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'), // Replace 'dist' with your desired output directory
  },
  resolve: {
    alias: {
      // Alias for the @radixdlt/radix-dapp-toolkit module
      '@radixdlt/radix-dapp-toolkit': path.resolve(__dirname, './node_modules/@radixdlt/radix-dapp-toolkit'),
    },
    alias: {
      // Alias for the @radixdlt/radix-dapp-toolkit module
      '@radixdlt/babylon-gateway-api-sdk': path.resolve(__dirname, './node_modules/@radixdlt/babylon-gateway-api-sdk'),
    },
    fullySpecified: false,
  },
  performance: {
    maxAssetSize: 1000000,
    hints: false,
    maxEntrypointSize: 512000,
  },
  mode: 'production'
  // experiments: {
  //   topLevelAwait: true,
  // },
  // module: {
  //   rules: [
  //     {
  //       test: /\.(?:js|mjs|cjs)$/,
  //       exclude: /node_modules/,
  //       use: {
  //         loader: 'babel-loader',
  //         options: {
  //           presets: [
  //             ['@babel/preset-env', { targets: "defaults" }]
  //           ]          }
  //       },
  //     },
  //     {
  //       test: /\.mjs$/,
  //       type: 'javascript/auto',
  //     },
  //   ]
  // }
};
