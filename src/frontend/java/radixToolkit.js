import { RadixDappToolkit } from '@radixdlt/radix-dapp-toolkit';
import { setAccountAddress, accountAddress } from './accountAddress.js';

const dAppId = 'account_tdx_c_1pyu3svm9a63wlv6qyjuns98qjsnus0pzan68mjq2hatqejq9fr'; // temp

const rdt = RadixDappToolkit(
  {
    dAppDefinitionAddress: dAppId,
    dAppName: 'Sundae Liquidity Protocol',
  },
  (requestData) => {
    requestData({
      accounts: { quantifier: 'atLeast', quantity: 1 },
    }).map(({ data: { accounts } }) => {
      // set your application state
      console.log('account data: ', accounts);
      const address = accounts[0].address;
      setAccountAddress(address);
    });
  },
  {
    networkId: 12,
    onDisconnect: () => {
      // clear your application state
    },
    onInit: ({ accounts }) => {
      // set your initial application state
      console.log('onInit accounts: ', accounts);
      if (accounts.length > 0) {
        const address = accounts[0].address;
        setAccountAddress(address);
      }
    },
  }
);

console.log('dApp Toolkit: ', rdt);

// Export accountAddress for other scripts to use
export { accountAddress, rdt };
