const path = require('path');

module.exports = {
  entry: {
    index: './java/index.mjs'
  },
  output: {
    filename: 'bundle.js',
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
