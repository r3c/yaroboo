/*
** Display selected Boo variant, start associated animation if any, and handle jingles.
*/
$(function () {
	var createButton = function (basePath, name) {
		return $('<img style="position: absolute; left: 0px; top: 0px; opacity: 0.75; width: 20px; height: 20px;">')
			.prop('src', basePath + '/ui/' + name + '.png');
	};

	var createLayer = function (basePath, name) {
		return $('<img class="default-mascot" style="position: absolute; left: 0; top: 0; opacity: 0;">')
			.prop('src', basePath + '/image/' + name + '.png');
	}

	/*
	** Load and play a jingle from a URL
	** jingleURL:		URL of jingle to play
	*/
	var jinglePlay = function (basePath, name) {
		// Load the data
		$.getJSON(basePath + '/jingle/' + name + '.json', function (jingleData) {
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
			var harmonics = [[1.0, -13.0, 13.5], [3.0, -40.5, 49.9], [5.5, -2.0, 47.3], [6.0, -25.5, 23.5], [8.0, -31.9, 30.4], [8.5, -11.8, 54.5]];
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
				audioSource.connect(audioContext.destination);
				audioSource[audioSource.start ? 'start' : 'noteOn'](t);

				t += jingleData.melody[i][1] / 1000.0;
			}
		});
	}
	
	/*
	** Play the Sputnik sound
	*/
	var sputnikPlay = function ()
	{
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
			audioDataBuffer.buffer = audioContext.createBuffer (1, audioDataBuffer.sampleRate * audioDataBuffer.duration, audioDataBuffer.sampleRate);
			audioDataBuffer.nbSamples = audioDataBuffer.buffer.length;
			audioDataBuffer.data = audioDataBuffer.buffer.getChannelData (0);
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

				audioDataBuffer.data[i] = Math.pow (10.0, amplitude / 20.0) * Math.sin (2.0 * Math.PI * t * sputnikBeep.frequency);
			}
		}
		
		// Apply random fading
		{
			var randomFading = {};
			
			randomFading.maxAttenuation = 20.0;
			randomFading.attenuation = 0.5;
			randomFading.stepSize = 50.0;

			for (var i = 0; i < audioDataBuffer.nbSamples; i++) {
				randomFading.attenuation += (Math.random () - 0.5) * 2.0 * (randomFading.stepSize / audioDataBuffer.sampleRate);
			
				if (randomFading.attenuation > 1.0) 
					randomFading.attenuation = 1.0;
					
				if (randomFading.attenuation < 0.0) 
					randomFading.attenuation = 0.0;

				audioDataBuffer.data[i] *= Math.pow (10.0, -(randomFading.attenuation * randomFading.maxAttenuation) / 20.0); 
			}
		}
		
		// Apply multipath effect
		{
			var multiPath = {};
			
			multiPath.attenuation = 12.0;
			multiPath.delay = 0.05;
			multiPath.nbSamples = multiPath.delay * audioDataBuffer.sampleRate;
							
			for (var i = 0; i < audioDataBuffer.nbSamples; i++) {
				audioDataBuffer.data[i + multiPath.nbSamples] += audioDataBuffer.data[i] * Math.pow (10.0, -multiPath.attenuation / 20.0);		
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
			backgroundNoise.filterCoefficient = 1.0 - Math.exp (-2.0 * Math.PI * backgroundNoise.filterFrequency / audioDataBuffer.sampleRate);
		
			for (var i = 0; i < audioDataBuffer.nbSamples; i++) {
				backgroundNoise.rawOutput = (Math.random () - 0.5) * 2.0;
				backgroundNoise.filteredOutput *= 1 - backgroundNoise.filterCoefficient;
				backgroundNoise.filteredOutput += backgroundNoise.filterCoefficient * backgroundNoise.rawOutput;

				var noiseSample = 0.0;
				noiseSample += backgroundNoise.rawOutput *  Math.pow (10.0, backgroundNoise.rawAmplitude / 20.0);			
				noiseSample += backgroundNoise.filteredOutput * Math.pow (10.0, backgroundNoise.filteredAmplitude / 20.0);
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
			
			for (var i = 0; i < fadeOut.nbSamples; i++)
			{
				audioDataBuffer.data[(audioDataBuffer.nbSamples - 1) - i] *= i / fadeOut.nbSamples;
			}
		}
		
		// Play the audio data buffer
		{
			var audioSource = audioContext.createBufferSource ();
			audioSource.buffer = audioDataBuffer.buffer;
			audioSource.connect (audioContext.destination);
			audioSource.start ();
		}	
	}
	
	/*
	** Start animation matching name read from "boo" cookie. This method is intended to be called
	** once request on dynamic image has been completed and set a cookie in return.
	*/
	var animate = function () {
		// If image is not loaded yet it means we don't have any cookie value and don't know which
		// Boo variant has been selected. Let's wait for this information to be available.
		if (!this.complete)
			return;

		// Note: target may not be an image anymore if this function is executing for the second
		// time, e.g. if browser reused an old cached image while loading the new one.
		var target = $(this);

		// Extract base path from script URL
		var match = /^(.*)\/animate\.js([?#].*)?$/.exec($('script[src*="/animate.js"]').prop('src'));

		if (!match)
			return;

		var basePath = match[1];

		// Start animation if one is defined for current Boo variant
		var variant = $.cookie('boo');

		switch (variant) {
			case 'christmas':
			case 'christmas-dark':
				var tick = function (target, duration, steps, index) {
					var delta = 0.25;
					var pause = steps[index] * (delta * (Math.random() * 2 - 1) + 1);
					var speed = duration * (delta * (Math.random() * 2 - 1) + 1);

					target.animate({ opacity: 1 - index % 2 }, speed, 'swing', function () {
						setTimeout(function () {
							tick(target, duration, steps, (index + 1) % steps.length);
						}, pause);
					});
				};

				wrap(target)
					.append(createLayer(basePath, 'christmas-glow').addClass('g'))
					.append(createLayer(basePath, 'christmas-light0').addClass('l'))
					.append(createLayer(basePath, 'christmas-light1').addClass('l'))
					.append(createLayer(basePath, 'christmas-light2').addClass('l'))
					.append(createLayer(basePath, 'christmas-light3').addClass('l'))
					.find('.g').each(function () { tick($(this), 1000, [500, 500], 0); }).end()
					.find('.l').each(function () { tick($(this), 250, [100, 100, 200, 200, 500, 500], 0); }).end();

				break;

			case 'sleep':
				var tick = function (target, index) {
					target.find('.z' + (index % 3)).animate({ opacity: 1 - Math.floor(index / 3) }, 250, 'linear', function () {
						setTimeout(function () {
							tick(target, (index + 1) % 6);
						}, 500);
					});
				};

				wrap(target)
					.append(createLayer(basePath, 'sleep-z0').addClass('z0'))
					.append(createLayer(basePath, 'sleep-z1').addClass('z1'))
					.append(createLayer(basePath, 'sleep-z2').addClass('z2'))
					.each(function () { tick($(this), 0); });

				break;

			case 'bear':
			case 'cardboard':
			case 'china':
			case 'cola':
			case 'fireworks':
			case 'kirby':
			case 'nukem':			
			case 'particule':
			case 'penguin':
			case 'pixel':
			case 'redhat':
			case 'snake':
			case 'space':
			case 'swan':
			case 'totoro':
			case 'unicorn':
			case 'yoshi':
				wrap(target)
					.append(createButton(basePath, 'play').on('click', function () {
						jinglePlay(basePath, variant);
					}));

				break;
				
			case 'helmet':
				wrap(target)
					.append(createButton(basePath, 'play').on('click', function () {
						sputnikPlay ();
					}));

				break;
				
			default:
				wrap(target, true);

				break;
		}
	};

	/*
	** Ensure given element is wrapped within div with relative positioning and
	** no other elements, creating parent or removing siblings if needed.
	** target:		element to be wrapped
	** removeOnly:	true to only remove sibling elements if needed but do not
	**				wrap otherwise
	** return:		wrapper element
	*/
	var wrap = function (target, removeOnly) {
		var parent = target.parent('.animate');

		// Create parent and wrap target element when missing
		if (parent.length === 0) {
			if (removeOnly)
				return target;

			return target.wrap($('<div class="animate" style="position: relative;">')).parent();
		}

		// Otherwise remove all child elements but original target
		parent.children().not(target).remove();

		return parent;
	};

	// Bind animation callback to image load event + trigger manually once in case image was
	// already loaded from cache at this point. This implies "animate" may be called twice.
	$('#yn-mascot')
		.prop('alt', 'Boo')
		.one('load', animate)
		.each(animate);
});
