
import { RadixDappToolkit, createLogger, DataRequestBuilder } from '@radixdlt/radix-dapp-toolkit';

const dAppId = 'account_tdx_d_129t0musex92czk0ulx39xy9dvyvgxew85nj2ugy6hyz20der8r8zuy'; // temp

const rdt = RadixDappToolkit(
  {
    dAppDefinitionAddress: dAppId,
    dAppName: 'Sundae Liquidity Protocol',
    networkId: 13,
    logger: createLogger(0),
  }
)

rdt.buttonApi.setTheme('black');
rdt.buttonApi.setMode('dark');

rdt.walletApi.setRequestData(DataRequestBuilder.accounts().exactly(1))

if (window.innerWidth >= 768) { // Adjust the width as needed for your desktop breakpoint

  window.addEventListener("scroll", function() {
    var nav = document.querySelector("nav");
    
    // Determine whether to add or remove the "scrolled" class based on scroll position
    var shouldAddScrolledClass = window.scrollY > 20;

    // Add or remove the "scrolled" class based on scroll position
    nav.classList.toggle("scrolled", shouldAddScrolledClass);

    // Change the button theme based on the "scrolled" class
    if (shouldAddScrolledClass) {
        rdt.buttonApi.setTheme('white');
        rdt.buttonApi.setMode('dark');
    } else {
        rdt.buttonApi.setTheme('black');
        rdt.buttonApi.setMode('dark');
    }
  });
}

else {
  window.addEventListener('scroll', function() {

    const currentScrollPos = window.scrollY;
    
    if (prevScrollpos > currentScrollPos && window.scrollY > 200) {
      rdt.buttonApi.setTheme('white');
      rdt.buttonApi.setMode('dark');
    } else {
      rdt.buttonApi.setTheme('black');
      rdt.buttonApi.setMode('dark');
    }
    prevScrollpos = currentScrollPos;
  });
}

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


