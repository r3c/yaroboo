/*
 ** Play the Sputnik sound
 */
var pending = 0;

export function play(element) {
    // Do not start a new jingle if one is already playing
    if (pending) {
        return;
    }

    // Hide button until playback ends
    element.css('visibility', 'hidden');

    // Create the audio context
    {
        var audioContext;

        if (window.AudioContext !== undefined)
            audioContext = new window.AudioContext();
        else if (window.webkitAudioContext !== undefined)
            audioContext = new window.webkitAudioContext();
        else
            return; // Stop if Web Audio API is not supported
    }

    // Create an audio data buffer
    {
        var audioDataBuffer = {};

        audioDataBuffer.duration = 8.0;
        audioDataBuffer.sampleRate = audioContext.sampleRate;
        audioDataBuffer.buffer = audioContext.createBuffer(1, audioDataBuffer.sampleRate * audioDataBuffer.duration, audioDataBuffer.sampleRate);
        audioDataBuffer.nbSamples = audioDataBuffer.buffer.length;
        audioDataBuffer.data = audioDataBuffer.buffer.getChannelData(0);
    }

    // Generate the beeps
    {
        var sputnikBeep = {};

        sputnikBeep.frequency = 1060.0;
        sputnikBeep.attackDuration = 0.020;
        sputnikBeep.sustainDuration = 0.153;
        sputnikBeep.releaseDuration = 0.020;
        sputnikBeep.silenceDuration = 0.575;
        sputnikBeep.asDuration = sputnikBeep.attackDuration + sputnikBeep.sustainDuration;
        sputnikBeep.asrDuration = sputnikBeep.asDuration + sputnikBeep.releaseDuration;
        sputnikBeep.totalDuration = sputnikBeep.asrDuration + sputnikBeep.silenceDuration;
        sputnikBeep.onAmplitude = -2.0;
        sputnikBeep.offAmplitude = -48.0;

        for (var i = 0; i < audioDataBuffer.nbSamples; i++) {
            var amplitude = sputnikBeep.onAmplitude;
            var t = i / audioDataBuffer.sampleRate;
            var t2 = t % sputnikBeep.totalDuration;

            if (t2 >= sputnikBeep.asrDuration)
                amplitude = 0.0;
            else if (t2 >= sputnikBeep.asDuration)
                amplitude = 1.0 - ((t2 - sputnikBeep.asDuration) / sputnikBeep.releaseDuration);
            else if (t2 >= sputnikBeep.attackDuration)
                amplitude = 1.0;
            else
                amplitude = t2 / sputnikBeep.attackDuration;

            amplitude = sputnikBeep.offAmplitude + ((sputnikBeep.onAmplitude - sputnikBeep.offAmplitude) * amplitude);

            audioDataBuffer.data[i] = Math.pow(10.0, amplitude / 20.0) * Math.sin(2.0 * Math.PI * t * sputnikBeep.frequency);
        }
    }

    // Apply random fading
    {
        var randomFading = {};

        randomFading.maxAttenuation = 20.0;
        randomFading.attenuation = 0.5;
        randomFading.stepSize = 50.0;

        for (var i = 0; i < audioDataBuffer.nbSamples; i++) {
            randomFading.attenuation += (Math.random() - 0.5) * 2.0 * (randomFading.stepSize / audioDataBuffer.sampleRate);

            if (randomFading.attenuation > 1.0)
                randomFading.attenuation = 1.0;

            if (randomFading.attenuation < 0.0)
                randomFading.attenuation = 0.0;

            audioDataBuffer.data[i] *= Math.pow(10.0, -(randomFading.attenuation * randomFading.maxAttenuation) / 20.0);
        }
    }

    // Apply multipath effect
    {
        var multiPath = {};

        multiPath.attenuation = 12.0;
        multiPath.delay = 0.05;
        multiPath.nbSamples = multiPath.delay * audioDataBuffer.sampleRate;

        for (var i = 0; i < audioDataBuffer.nbSamples; i++) {
            audioDataBuffer.data[i + multiPath.nbSamples] += audioDataBuffer.data[i] * Math.pow(10.0, -multiPath.attenuation / 20.0);
        }
    }

    // Add background noise
    {
        var backgroundNoise = {};

        backgroundNoise.rawOutput = 0.0;
        backgroundNoise.filteredOutput = 0.0;
        backgroundNoise.rawAmplitude = -40.0;
        backgroundNoise.filterFrequency = 250.0;
        backgroundNoise.filteredAmplitude = -15.0;
        backgroundNoise.filterCoefficient = 1.0 - Math.exp(-2.0 * Math.PI * backgroundNoise.filterFrequency / audioDataBuffer.sampleRate);

        for (var i = 0; i < audioDataBuffer.nbSamples; i++) {
            backgroundNoise.rawOutput = (Math.random() - 0.5) * 2.0;
            backgroundNoise.filteredOutput *= 1 - backgroundNoise.filterCoefficient;
            backgroundNoise.filteredOutput += backgroundNoise.filterCoefficient * backgroundNoise.rawOutput;

            var noiseSample = 0.0;
            noiseSample += backgroundNoise.rawOutput * Math.pow(10.0, backgroundNoise.rawAmplitude / 20.0);
            noiseSample += backgroundNoise.filteredOutput * Math.pow(10.0, backgroundNoise.filteredAmplitude / 20.0);
            audioDataBuffer.data[i] += noiseSample;
        }
    }

    // Apply the initial fade-in
    {
        var fadeIn = {};

        fadeIn.duration = 1.0;
        fadeIn.nbSamples = fadeIn.duration * audioDataBuffer.sampleRate;

        for (var i = 0; i < fadeIn.nbSamples; i++) {
            audioDataBuffer.data[i] *= i / fadeIn.nbSamples;
        }
    }

    // Apply the final fade-out
    {
        var fadeOut = {};

        fadeOut.duration = 1.0;
        fadeOut.nbSamples = fadeOut.duration * audioDataBuffer.sampleRate;

        for (var i = 0; i < fadeOut.nbSamples; i++) {
            audioDataBuffer.data[(audioDataBuffer.nbSamples - 1) - i] *= i / fadeOut.nbSamples;
        }
    }

    // Play the audio data buffer
    {
        var audioSource = audioContext.createBufferSource();
        audioSource.buffer = audioDataBuffer.buffer;
        audioSource.onended = function () {
            pending = 0;

            element.css('visibility', 'visible');
        };
        audioSource.connect(audioContext.destination);
        audioSource.start();
    }

    pending = 1;
};