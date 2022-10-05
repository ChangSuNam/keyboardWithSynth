
var modulationIndexVal = 100
var modulatorFreqVal = 100
var isLfo =0
var waveform = 'sine' //default is sine

document.addEventListener("DOMContentLoaded", function (event) {

    var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const globalGain = audioCtx.createGain(); //this will control the volume of all notes
    globalGain.gain.setValueAtTime(0.8, audioCtx.currentTime);
    globalGain.connect(audioCtx.destination);
    
    var isSingle = 1
    var isAdditive = 0
    var isAM = 0
    var isFM = 0
    var isRandom = 0



    //change between sine and sawtooth with button
    document.getElementById("sineButton").onclick = function () {
        setSine()
    }
    document.getElementById("sawtoothButton").onclick = function () {
        setSawtooth()
    }

    document.getElementById("additiveButton").onclick = function () {
        isAdditive = 1
        isAM = 0
        isFM = 0
        isRandom = 0
        isSingle = 0
    }
    document.getElementById("AMButton").onclick = function () {
        isAdditive = 0
        isAM = 1
        isFM = 0
        isRandom = 0
        isSingle = 0
    }
    document.getElementById("FMButton").onclick = function () {
        isAdditive = 0
        isAM = 0
        isFM = 1
        isRandom = 0
        isSingle = 0
    }

    document.getElementById("randomButton").onclick = function () {
        isAdditive = 0
        isAM = 0
        isFM = 0
        isRandom = 1
        isSingle = 0
    }
    document.getElementById("singleButton").onclick = function () {
        isAdditive = 0
        isAM = 0
        isFM = 0
        isRandom = 0
        isSingle = 1
    }

    const keyboardFrequencyMap = {
        '90': 261.625565300598634,  //Z - C
        '83': 277.182630976872096, //S - C#
        '88': 293.664767917407560,  //X - D
        '68': 311.126983722080910, //D - D#
        '67': 329.627556912869929,  //C - E
        '86': 349.228231433003884,  //V - F
        '71': 369.994422711634398, //G - F#
        '66': 391.995435981749294,  //B - G
        '72': 415.304697579945138, //H - G#
        '78': 440.000000000000000,  //N - A
        '74': 466.163761518089916, //J - A#
        '77': 493.883301256124111,  //M - B
        '81': 523.251130601197269,  //Q - C
        '50': 554.365261953744192, //2 - C#
        '87': 587.329535834815120,  //W - D
        '51': 622.253967444161821, //3 - D#
        '69': 659.255113825739859,  //E - E
        '82': 698.456462866007768,  //R - F
        '53': 739.988845423268797, //5 - F#z
        '84': 783.990871963498588,  //T - G
        '54': 830.609395159890277, //6 - G#
        '89': 880.000000000000000,  //Y - A
        '55': 932.327523036179832, //7 - A#
        '85': 987.766602512248223,  //U - B
    }

    const colors = ["white", "green", "red", "orange", "salmon", "purple", "blue", "yellow", "green"]

    window.addEventListener('keydown', keyDown, false);
    window.addEventListener('keyup', keyUp, false);

    activeOscillators = {}
    activeGainNodes = {}

    function keyDown(event) {
        console.log("key down")
        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && !activeOscillators[key]) {
            if (isAdditive == 1) {
                playAdditiveNote(key);
            }
            else if (isAM == 1) {
                playAMNote(key);
            }
            else if (isFM == 1) {
                playFMNote(key);
            } 
            else if(isSingle ==1) {
                playNote(key)
            }
            else if(isRandom ==1){
                waves = [setSine,setSawtooth]
                waves[Math.floor(Math.random() * waves.length)]()
                funcs = [playAdditiveNote, playAMNote, playFMNote, playNote]
                funcs[Math.floor(Math.random() * funcs.length)](key)
                
            }
           
            document.body.style.backgroundColor = colors[Math.floor(Math.random() * 8)]
        }
    }

    function keyUp(event) {
        console.log("key up")
        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && activeOscillators[key]) {
            //activeOscillators[key].stop();
            activeGainNodes[key].gain.cancelScheduledValues(audioCtx.currentTime)
            activeGainNodes[key].gain.setTargetAtTime(
                0,
                audioCtx.currentTime,
                0.02
            );
            activeOscillators[key].stop(audioCtx.currentTime + 0.05)
            delete activeOscillators[key];
            delete activeGainNodes[key];
        }
    }


    function playAdditiveNote(key) {

        const osc = audioCtx.createOscillator()
        osc.frequency.setValueAtTime(keyboardFrequencyMap[key], audioCtx.currentTime)
        osc.type = waveform //choose your favorite waveform from the buttons
        var gainNode = audioCtx.createGain()
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime)

        ///////// below added for additive synthesis, creates 3 osc in total
        const osc2 = audioCtx.createOscillator()
        osc2.frequency.setValueAtTime(keyboardFrequencyMap[key] * 2 + Math.random() * 15, audioCtx.currentTime)
        const osc3 = audioCtx.createOscillator()
        osc3.frequency.setValueAtTime(keyboardFrequencyMap[key] * 3 - Math.random() * 15, audioCtx.currentTime)
        osc2.type = waveform
        osc3.type = waveform
        osc2.connect(gainNode).connect(audioCtx.destination)
        osc3.connect(gainNode).connect(audioCtx.destination)
        osc.connect(gainNode).connect(audioCtx.destination) //you will need a new gain node for each node to control the adsr of that note
        osc.start()
        osc2.start()
        osc3.start()

        ///lfo
        if (isLfo == 1) {
            var lfo = audioCtx.createOscillator();
            lfo.frequency.value = 0.5;
            lfoGain = audioCtx.createGain();
            lfoGain.gain.value = 8;
            lfo.connect(lfoGain).connect(osc2.frequency);
            lfo.start();
            ///

            activeOscillators[key] = osc2, osc3, osc, lfo
            activeGainNodes[key] = gainNode, lfoGain
        }else{
            activeOscillators[key] = osc2, osc3, osc
            activeGainNodes[key] = gainNode
        }
        ////////////////////- above added for additive synthesis.
        let gainCount = Object.keys(activeGainNodes).length;
        // polyphony
        Object.keys(activeGainNodes).forEach(function (key) {
            activeGainNodes[key].gain.setTargetAtTime(
                0.5 / gainCount,
                audioCtx.currentTime,
                0.1
            ); // (target, startTime, timeConstant)
        });
        // decay and sustain
        gainNode.gain.setTargetAtTime(
            0.2 / gainCount,
            audioCtx.currentTime + 0.1,
            0.1
        );

        lfoGain.gain.setTargetAtTime(
            0.2 / gainCount,
            audioCtx.currentTime + 0.1,
            0.1
        );
    }


    function playAMNote(key) {


        /// Below added for AM

        var carrier = audioCtx.createOscillator()
        carrier.type = waveform
        var modulatorFreq = audioCtx.createOscillator()
        modulatorFreq.frequency.value = modulatorFreqVal
        carrier.frequency.setValueAtTime(keyboardFrequencyMap[key], audioCtx.currentTime)

        var modulated = audioCtx.createGain()
        var depth = audioCtx.createGain()
        depth.gain.value = 0.5
        modulated.gain.value = 1.0 - depth.gain.value


        //
        const gainNode = audioCtx.createGain()
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime)
        //
        modulatorFreq.connect(depth).connect(modulated.gain)
      
        carrier.connect(modulated) //you will need a new gain node for each node to control the adsr of that note
        modulated.connect(gainNode)
        gainNode.connect(audioCtx.destination)
        carrier.start()
        modulatorFreq.start()
        activeOscillators[key] = carrier, modulatorFreq
        activeGainNodes[key] = modulated, depth, gainNode
        ////////above added for AM


        let gainCount = Object.keys(activeGainNodes).length;
        // polyphony
        Object.keys(activeGainNodes).forEach(function (key) {
            activeGainNodes[key].gain.setTargetAtTime(
                0.5 / gainCount,
                audioCtx.currentTime,
                0.1
            ); // (target, startTime, timeConstant)
        });
        // decay and sustain
        gainNode.gain.setTargetAtTime(
            0.2 / gainCount,
            audioCtx.currentTime + 0.1,
            0.1
        );
    }


    function playFMNote(key) {
        ///// Below added for FM

        // oscillators
        var carrier = audioCtx.createOscillator()
        carrier.type = waveform
        var modulatorFreq = audioCtx.createOscillator()
        modulatorFreq.type = waveform
        modulatorFreq.frequency.value = modulatorFreqVal
        carrier.frequency.setValueAtTime(keyboardFrequencyMap[key], audioCtx.currentTime)

        //gain
        var modulationIndex = audioCtx.createGain()
        modulationIndex.gain.value = modulationIndexVal
        const gainNode = audioCtx.createGain()
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime)

        //connect osc to gain
        modulatorFreq.connect(modulationIndex)
        //connect gain to osc
        modulationIndex.connect(carrier.frequency)


        //coonect osc to gain
        carrier.connect(gainNode)
        gainNode.connect(audioCtx.destination)

        modulatorFreq.start()
        carrier.start()
        activeOscillators[key] = carrier, modulatorFreq
        activeGainNodes[key] = gainNode
        ////////above added for FM

        let gainCount = Object.keys(activeGainNodes).length;
        // polyphony
        Object.keys(activeGainNodes).forEach(function (key) {
            activeGainNodes[key].gain.setTargetAtTime(
                0.5 / gainCount,
                audioCtx.currentTime,
                0.1
            ); // (target, startTime, timeConstant)
        });
        // decay and sustain
        gainNode.gain.setTargetAtTime(
            0.2 / gainCount,
            audioCtx.currentTime + 0.1,
            0.1
        );

    }



    function playNote(key) {
        const osc = audioCtx.createOscillator()
        osc.frequency.setValueAtTime(keyboardFrequencyMap[key], audioCtx.currentTime)
        osc.type = waveform //choose your favorite waveform from the buttons
        //osc.connect(audioCtx.destination)
        var gainNode = audioCtx.createGain()
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime)
        osc.connect(gainNode).connect(audioCtx.destination) //you will need a new gain node for each node to control the adsr of that note
        osc.start();
        activeOscillators[key] = osc
        activeGainNodes[key] = gainNode


        let gainCount = Object.keys(activeGainNodes).length;
        // polyphony
        Object.keys(activeGainNodes).forEach(function (key) {
            activeGainNodes[key].gain.setTargetAtTime(
                0.5 / gainCount,
                audioCtx.currentTime,
                0.1
            ); // (target, startTime, timeConstant)
        });
        // decay and sustain
        gainNode.gain.setTargetAtTime(
            0.2 / gainCount,
            audioCtx.currentTime + 0.1,
            0.1
        );




    }


});

function updateFreq(val) {
    modulatorFreqVal = val;
}

function updateIndex(val) {
    modulationIndexVal = val;
}

function lfoOption(val) {
    isLfo = val;
}

function setSine(){
    waveform = "sine"
}

function setSawtooth(){
    waveform = "sawtooth"
}
