
import { RadixDappToolkit, createLogger, DataRequestBuilder } from '@radixdlt/radix-dapp-toolkit';
// import { setAccountAddress, accountAddress } from './accountAddress.js';

const dAppId = 'account_tdx_d_129t0musex92czk0ulx39xy9dvyvgxew85nj2ugy6hyz20der8r8zuy'; // temp

const rdt = RadixDappToolkit(
  {
    dAppDefinitionAddress: dAppId,
    dAppName: 'Sundae Liquidity Protocol',
    networkId: 13,
    logger: createLogger(0),
  }
)

rdt.walletApi.setRequestData(DataRequestBuilder.accounts().exactly(1))

rdt.buttonApi.setTheme('black')

// let accountAddress = rdt.walletApi.getWalletData().account

// const subscription = rdt.walletApi.walletData$.subscribe((walletData) => {
//   console.log('Wallet data accounts: ', walletData.accounts)
//   accountAddress = walletData.accounts
// })

// // console.log('Wallet data: ', walletData)
// // console.log('Account: ', walletData.accountAddress)
// console.log('Account address: ', accountAddress)

// Export accountAddress for other scripts to use
export { rdt };


