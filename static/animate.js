/*
** Display selected Boo variant, start associated animation if any, and handle jingles.
*/
$(function ()
{
	var createButton = function (basePath, name)
	{
		return $('<img style="position: absolute; right: 0px; top: 0px; opacity: 0.75; width: 20px; height: 20px;">')
			.prop ('src', basePath + '/ui/' + name + '.png');
	};

	var createImage = function (basePath, name)
	{
		return $('<img style="position: absolute; left: 0; top: 0; opacity: 0;">')
			.prop ('src', basePath + '/image/' + name + '.png');
	}

	/*
	** Load and play a jingle from a URL
	** jingleURL:		URL of jingle to play
	*/
	var jinglePlay = function (basePath, name)
	{
		// Load the data
		$.getJSON (basePath + '/jingle/' + name + '.json', function (jingleData)
		{
			// Create the audio context
			var audioContext;

			if (window.AudioContext !== undefined)
				audioContext = new window.AudioContext ();
			else if (window.webkitAudioContext !== undefined)
				audioContext = new window.webkitAudioContext ();
			else
				return; // Stop if Web Audio API is not supported

			// Set the sound synthesis parameters
			var duration = 6.0;
			var frequency = 440.0 * Math.pow (2.0, 15 / 12.0);
			var harmonics = [[1.0, -13.0, 13.5], [3.0, -40.5, 49.9], [5.5, -2.0, 47.3], [6.0, -25.5, 23.5], [8.0, -31.9, 30.4], [8.5, -11.8, 54.5]];
			var fadeInDuration = 0.0001;
			var fadeOutDuration = 1.0;

			// Create an audio buffer for the base note
			var audioBuffer = audioContext.createBuffer (1, audioContext.sampleRate * duration, audioContext.sampleRate);
			var audioData = audioBuffer.getChannelData (0);

			// Synthesize the base note
			// Generate the waveform
			for (var i = 0; i < audioBuffer.length; i++)
			{
				var t = i / audioBuffer.sampleRate;
				var omega = 2.0 * Math.PI * t;
				var sample = 0.0;

				for (var j = 0; j < harmonics.length; j++)
				{
					var amplitude = Math.pow (10, (harmonics[j][1] - (t * harmonics[j][2])) / 20);

					sample += amplitude * Math.sin (omega * frequency * harmonics[j][0]);
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

			for (var i = 0; i < jingleData.melody.length; i++)
			{
				var audioSource = audioContext.createBufferSource ();

				audioSource.buffer = audioBuffer;
				audioSource.playbackRate.value = Math.pow (2.0, jingleData.melody[i][0] / 12.0);
				audioSource.connect (audioContext.destination);
				audioSource[audioSource.start ? 'start' : 'noteOn'] (t);

				t += jingleData.melody[i][1] / 1000.0;
			}
		});
	}

	/*
	** Start animation matching name read from "boo" cookie. This method is intended to be called
	** once request on dynamic image has been completed and set a cookie in return.
	*/
	var animate = function ()
	{
		// If image is not loaded yet it means we don't have any cookie value and don't know which
		// Boo variant has been selected. Let's wait for this information to be available.
		if (!this.complete)
			return;

		// Note: target may not be an image anymore if this function is executing for the second
		// time, e.g. if browser reused an old cached image while loading the new one.
		var target = $(this);

		// Extract base path from script URL
		var match =  /^(.*)\/animate\.js([?#].*)?$/.exec ($('script[src*="/animate.js"]').prop ('src'));

		if (!match)
			return;

		var basePath = match[1];

		// Start animation if one is defined for current Boo variant
		var variant = $.cookie ('boo');

		switch (variant)
		{
			case 'christmas':
			case 'christmas-dark':
				var tick = function (target, duration, steps, index)
				{
					var delta = 0.25;
					var pause = steps[index] * (delta * (Math.random () * 2 - 1) + 1);
					var speed = duration * (delta * (Math.random () * 2 - 1) + 1);

					target.animate ({opacity: 1 - index % 2}, speed, 'swing', function ()
					{
						setTimeout (function ()
						{
							tick (target, duration, steps, (index + 1) % steps.length);
						}, pause);
					});
				};

				wrap (target)
					.append (createImage (basePath, 'christmas-glow').addClass ('g'))
					.append (createImage (basePath, 'christmas-light0').addClass ('l'))
					.append (createImage (basePath, 'christmas-light1').addClass ('l'))
					.append (createImage (basePath, 'christmas-light2').addClass ('l'))
					.append (createImage (basePath, 'christmas-light3').addClass ('l'))
					.find ('.g').each (function () { tick ($(this), 1000, [500, 500], 0); }).end ()
					.find ('.l').each (function () { tick ($(this), 250, [100, 100, 200, 200, 500, 500], 0); }).end ();

				break;

			case 'sleep':
				var tick = function (target, index)
				{
					target.find ('.z' + (index % 3)).animate ({opacity: 1 - Math.floor (index / 3)}, 250, 'linear', function ()
					{
						setTimeout (function ()
						{
							tick (target, (index + 1) % 6);
						}, 500);
					});
				};

				wrap (target)
					.append (createImage (basePath, 'sleep-z0').addClass ('z0'))
					.append (createImage (basePath, 'sleep-z1').addClass ('z1'))
					.append (createImage (basePath, 'sleep-z2').addClass ('z2'))
					.each (function () { tick ($(this), 0); });

				break;

			case 'bear':
			case 'cardboard':
			case 'china':
			case 'cola':
			case 'fireworks':
			case 'kirby':
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
				wrap (target)
					.append (createButton (basePath, 'play').on ('click', function ()
					{
						jinglePlay (basePath, variant);
					}));

				break;

			default:
				wrap (target, true);

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
	var wrap = function (target, removeOnly)
	{
		var parent = target.parent ('.animate');

		// Create parent and wrap target element when missing
		if (parent.length === 0)
		{
			if (removeOnly)
				return target;

			return target.wrap ($('<div class="animate" style="position: relative;">')).parent ();
		}

		// Otherwise remove all child elements but original target
		parent.children ().not (target).remove ();

		return parent;
	};

	// Bind animation callback to image load event + trigger manually once in case image was
	// already loaded from cache at this point. This implies "animate" may be called twice.
	$('#yn-mascot')
		.prop ('alt', 'Boo')
		.one ('load', animate)
		.each (animate);
});
