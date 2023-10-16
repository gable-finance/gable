import { getPoolAmount, getState} from './dashboardGeneric.mjs'
// https://gist.github.com/gre/1650294

const EasingFunctions = {
    // no easing, no acceleration
    linear: t => t,
    // accelerating from zero velocity
    easeInQuad: t => t*t,
    // decelerating to zero velocity
    easeOutQuad: t => t*(2-t),
    // acceleration until halfway, then deceleration
    easeInOutQuad: t => t<.5 ? 2*t*t : -1+(4-2*t)*t,
    // accelerating from zero velocity 
    easeInCubic: t => t*t*t,
    // decelerating to zero velocity 
    easeOutCubic: t => (--t)*t*t+1,
    // acceleration until halfway, then deceleration 
    easeInOutCubic: t => t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1,
    // accelerating from zero velocity 
    easeInQuart: t => t*t*t*t,
    // decelerating to zero velocity 
    easeOutQuart: t => 1-(--t)*t*t*t,
    // acceleration until halfway, then deceleration
    easeInOutQuart: t => t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t,
    // accelerating from zero velocity
    easeInQuint: t => t*t*t*t*t,
    // decelerating to zero velocity
    easeOutQuint: t => 1+(--t)*t*t*t*t,
    // acceleration until halfway, then deceleration 
    easeInOutQuint: t => t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t
  }
  
  // The modified animation function, which takes a target value and an Element
  function animateCountUp(
    targetValue, 
    el, 
    easing, 
    startingValue, 
    decimalPoints, 
    animationDuration
    ) {
  
    // How long you want the animation to take, in ms
    // const animationDuration = 4000;
    // Calculate how long each ‘frame’ should last if we want to update the animation 60 times per second
    const frameDuration = 1000 / 60;
    // Use that to calculate how many frames we need to complete the animation
    const totalFrames = Math.round(animationDuration / frameDuration);
    // An ease-out function that slows the count as it progresses
    // const easeOutQuad = EasingFunctions.easeOutQuart;
  
    let frame = 0;
    // const startingValue = 0;
  
    console.log('counting frame:', frame);
    el.innerHTML = "0";
    // Start the animation running 60 times per second
    const counter = setInterval(() => {
      frame++;
      // Calculate our progress as a value between 0 and 1
      // Pass that value to our easing function to get our
      // progress on a curve
      const progress = easing(frame / totalFrames);
      // Use the progress value to calculate the current count
      const currentCount = (startingValue + (targetValue - startingValue) * progress).toFixed(decimalPoints);
      const formattedCount = currentCount.toLocaleString('en-US');
      // If the current count has changed, update the element
      if (el.innerHTML !== formattedCount) {
        el.innerHTML = formattedCount;
      }
      // If we’ve reached our last frame, stop the animation
      if (frame === totalFrames) {
        clearInterval(counter);
      }
    }, frameDuration);
  };
  
  export async function countPoolAmount() {
  
    let pool_amount = await getPoolAmount();
    const poolAmountElement = document.getElementById('pool-amount-count');
    const easing = EasingFunctions.easeOutQuart;
    const startingValue = 0;
    const decimalPoints = 0;
    const animationDuration = 4000;
  
    animateCountUp(pool_amount, poolAmountElement, easing, startingValue, decimalPoints, animationDuration)
  }
  
  
  // get values from state
  async function countInterestRate() {
  
    let state = await getState();
  
    // let last_epoch = state.fields[7].value;
    let interest_rate = state.fields[14].value;
    let interest_rate_percentage = interest_rate * 100;
    const irAmountElement = document.getElementById('interest-rate-count');
    const easing = EasingFunctions.easeOutQuart;
    const startingValue = 100;
    const decimalPoints = 2;
    const animationDuration = 2500;
  
    animateCountUp(interest_rate_percentage, irAmountElement, easing, startingValue, decimalPoints, animationDuration)
  
  }
  
  export async function countApy() {
  
    const apyTotalElement = document.getElementById('apy-total-count');
  
    try {
  
      let apy_data = await fetchApyData();
  
      let total_earnings_apy = apy_data[0].total_earnings_apy;
  
      // apyTotalElement.innerText = parseFloat(total_earnings_apy).toFixed(2) + ' %';
  
      const easing = EasingFunctions.easeOutQuart;
      const startingValue = 0;
      const decimalPoints = 2;
    
      animateCountUp(total_earnings_apy, apyTotalElement, easing, startingValue, decimalPoints)
    
    } catch(error) {
  
      apyTotalElement.innerText = '-';
  
    }
  
  }
  
  // call functions
  document.addEventListener('DOMContentLoaded', async () => {
      countPoolAmount();
      countInterestRate();
      countApy();
  });