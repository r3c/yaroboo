var pending = 0;

/*
 ** Load and play a jingle from a URL
 ** jingleURL: URL of jingle to play
 */
export function play(element, baseDirectory, name) {
    // Do not start a new jingle if one is already playing
    if (pending) {
        return;
    }

    // Hide button until playback ends
    element.css('visibility', 'hidden');

    // Load the data
    $.getJSON(baseDirectory + '/jingle/' + name + '.json', function (jingleData) {
        // Create the audio context
        var audioContext;

        if (window.AudioContext !== undefined)
            audioContext = new window.AudioContext();
        else if (window.webkitAudioContext !== undefined)
            audioContext = new window.webkitAudioContext();
        else
            return; // Stop if Web Audio API is not supported

        // Set the sound synthesis parameters
        var duration = 6.0;
        var frequency = 440.0 * Math.pow(2.0, 15 / 12.0);
        var harmonics = [
            [1.0, -13.0, 13.5],
            [3.0, -40.5, 49.9],
            [5.5, -2.0, 47.3],
            [6.0, -25.5, 23.5],
            [8.0, -31.9, 30.4],
            [8.5, -11.8, 54.5]
        ];
        var fadeInDuration = 0.0001;
        var fadeOutDuration = 1.0;

        // Create an audio buffer for the base note
        var audioBuffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
        var audioData = audioBuffer.getChannelData(0);

        // Synthesize the base note
        // Generate the waveform
        for (var i = 0; i < audioBuffer.length; i++) {
            var t = i / audioBuffer.sampleRate;
            var omega = 2.0 * Math.PI * t;
            var sample = 0.0;

            for (var j = 0; j < harmonics.length; j++) {
                var amplitude = Math.pow(10, (harmonics[j][1] - (t * harmonics[j][2])) / 20);

                sample += amplitude * Math.sin(omega * frequency * harmonics[j][0]);
            }

            audioData[i] = sample;
        }

        // Apply the initial fade-in
        var n = fadeInDuration * audioBuffer.sampleRate;

        for (var i = 0; i < n; i++)
            audioData[i] *= i / n;

        // Apply the final fade-out
        var n = fadeOutDuration * audioBuffer.sampleRate;

        for (var i = 0; i < n; i++)
            audioData[(audioBuffer.Length - 1) - i] *= i / n;

        // Generate the melody using the base note
        var t = audioContext.currentTime + 0.1;

        for (var i = 0; i < jingleData.melody.length; i++) {
            var audioSource = audioContext.createBufferSource();

            audioSource.buffer = audioBuffer;
            audioSource.playbackRate.value = Math.pow(2.0, jingleData.melody[i][0] / 12.0);
            audioSource.onended = function () {
                if (--pending === 0) {
                    element.css('visibility', 'visible');
                }
            };
            audioSource.connect(audioContext.destination);
            audioSource[audioSource.start ? 'start' : 'noteOn'](t);

            t += jingleData.melody[i][1] / 1000.0;
        }

        pending = jingleData.melody.length;
    });
};