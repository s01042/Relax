/**
 * this is a very simple but effective example of showing 
 * some CSS animation effects. keep in mind, how little code 
 * is necessary
 */

const container = document.querySelector('.container')
const pointer_container = document.querySelector('#pointer-container')
const text = document.querySelector('#text')
const unmute = document.querySelector('#unmute')

const about = document.querySelector('#about')
const overlay = document.querySelector('#overlay')
const about_text = document.querySelector('#about_text')

/**
 * a kind of about
 */
about.addEventListener('click', (e) => {
    overlay.className = 'overlay fadeIn'
    overlay.style.display = "block"
    about_text.className = 'about_text slidein'
})

overlay.addEventListener('click', (e) => {
    about_text.className = 'about_text slideout'
    overlay.className = 'overlay fadeOut'
    setTimeout(() => {overlay.style.display = "none"}, 2000)
})

/**
 * unmute/mute sound via mouse click
 */
unmute.addEventListener('click', (e) => {
    toggleMute(e.srcElement)
})

/**
 * unmut/mute sound via hotkey
 */
window.addEventListener('keydown', function (e) {
    if (event.key === 'm') {
        //here we simple reuse toggleMute but we have to 
        //give the image as param, e.srcElement is the document 
        //itself. so let's travers the child elements
        toggleMute(e.srcElement.children[0].children[0])
    } 
}, true)

/**
 * simply toggle mute and change the image
 * @param {*} image 
 */
function toggleMute(image) {
    if(audio.muted) {
        image.src = './img/mute-xxl.png'
        image.title = 'mute sound [m]'
        audio.muted = false
        bell.muted = false
        mantra.muted = false
    } else {
        image.src = './img/volume-up-2-256.png'
        image.title = 'unmute sound [m]'
        audio.muted = true
        bell.muted = true
        mantra.muted = true
    }
}

const totalTime = 7500                  // 7.500 ms
const breathTime = (totalTime / 5) * 2  // this will be 3.000 ms
const holdTime = totalTime / 5          // this will be 1.500 ms
let numberOfIterations = 0

/**
 * lets add some audio
 */
const audio = new Audio('./audio/klangschale.mp3')
const bell =  new Audio('./audio/small_bell.mp3')
/**
 * todo: try to sync the audio
 * one cycle is 7.500 ms, so it will iterate 8 times per min
 * every mantra (or music) with a bpm that is mod 8 == 0 should match
 * here is a bpm examples: 136 bpm is fitting best 
 */

const mantra = new Audio('./audio/akira_mantra.mp3')
mantra.volume = 0.5

mantra.addEventListener('ended', () => {
    //console.log(`mantra ended`)
    numberOfIterations = 0
})

/**
 * there is this audio policy where auto play is prohibited
 * and it is more then fair to let the user decide if audio should be played
 * to play muted audio is of course always allowed, so we will start this way
 */
audio.muted = true
bell.muted = true
mantra.muted = true
/**
 * we will make this a PWA. so the user can visit the site, that is
 * hosting the relax app and there he can add this website as a PWA to his 
 * computer. he can then use it locally even if he is offline.
 * this example is very simplified, because there is no data fetching
 * in this simple application and therefor there is no need to cache and synchronize
 * this kind of data. but with a networkFirst caching strategy of our ServiceWorker
 * (see there) we can update the PWA on the fly!   
 * 
 * the ServiceWorker location is important because it defines its scope
 * another important point: a ServiceWorker location has to be https hosted
 * localhost of course will also work
 */
window.addEventListener('load', () =>{
    registerServiceWorker()
    askForPermission()
})

let notificationAllowed = false

async function askForPermission() {
    notificationAllowed = await Notification.requestPermission()
}

async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('./service-worker.js')
        }
        catch (e) {
            console.log(`ServiceWorker registration failed: ${e}`)
        }
    } else {
        alert(`your browser does not support ServiceWorker.`)
    }
}

//first start of animation cycle, it will last 7500ms
breathAnimation()

/**
 * this is a simple function, which manipulates the innerText of text
 * and the className of the container
 * later i added some audio control
 */
function breathAnimation () {

    numberOfIterations++
    //console.log(`number of iter: ${numberOfIterations}`)
    if (numberOfIterations == 11) {
        mantra.play()
        if (!mantra.muted) {
            navigator.serviceWorker.controller.postMessage({type: 'SHOW_NOTIFICATION'})
        }
    }
    if(!audio.muted) audio.play()

    //first set text to ...
    text.innerText = 'Breath In'
    
    //then start the css grow animation on the container
    //by appliying the corresponding css class
    container.className = 'container grow'

    //and start the pointer container animation 
    //by setting the css class (see styles.css)
    pointer_container.className = 'pointer-container'

    //then defer the next instructions for breathTime milliseconds
    setTimeout( () => {
        if(!audio.muted) bell.play()
        text.innerText = 'Hold'
        //and defer again for holdTime milliseconds
        setTimeout( () => {
            //if(!audio.muted) bell.play()
            text.innerText = 'Breath Out'
            container.className = 'container shrink'
        }, holdTime)
    }, breathTime)

}
//periodically start the animation again
//because interval is equal total animation time it will 
//run smoothly one after another
setInterval(breathAnimation, totalTime)