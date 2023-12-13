
import {RadixDappToolkit, DataRequestBuilder} from '@radixdlt/radix-dapp-toolkit'

const rdt = RadixDappToolkit({
  dAppDefinitionAddress:
    'account_rdx128ku70k3nxy9q0ekcwtwucdwm5jt80xsmxnqm5pfqj2dyjswgh3rm3',
  networkId: 1,
  applicationName: 'Gable Finance',
  applicationVersion: '1.0.0',
})

rdt.buttonApi.setTheme('black');
rdt.buttonApi.setMode('dark');

rdt.walletApi.setRequestData(DataRequestBuilder.accounts().exactly(1))

let prevScrollpos = window.scrollY;

if (window.innerWidth >= 768) { // Adjust the width as needed for your desktop breakpoint

  window.addEventListener("scroll", function() {
    
    // Determine whether to add or remove the "scrolled" class based on scroll position
    var shouldAddScrolledClass = window.scrollY > 20;

    // Change the button theme based on the "scrolled" class
    if (shouldAddScrolledClass) {
        rdt.buttonApi.setTheme('white');
        rdt.buttonApi.setMode('dark');
    } else {
        rdt.buttonApi.setTheme('black');
        rdt.buttonApi.setMode('dark');
    }
  });
} else {
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

// Export accountAddress for other scripts to use
export { rdt };


