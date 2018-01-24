/*
** Display selected Boo variant, start associated animation if any, and handle jingles.
*/
$(function ()
{
	/*
	** Handles all jingle-related features.
	*/
	var jingleInit = function (target, booVariant, basePath)
	{
		var jingleData = [];

		/*
		** Play the jingle.
		*/
		var jinglePlay = function ()
		{
			var audioContext = new (window.AudioContext || window.webkitAudioContext)();

			var duration = 6.0;
			var frequency = 440.0 * Math.pow(2.0, 15 / 12.0);
			var harmonics = [[1.0, -13.0, 13.5], [3.0, -40.5, 49.9], [5.5, -2.0, 47.3], [6.0, -25.5, 23.5], [8.0, -31.9, 30.4], [8.5, -11.8, 54.5]];
			var fadeInDuration = 0.0001;
			var fadeOutDuration = 1.0;

			var audioBuffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
			var audioData = audioBuffer.getChannelData(0);

			for (var i = 0; i < audioBuffer.length; i++)
			{
				var t = i / audioBuffer.sampleRate;
				var omega = 2.0 * Math.PI * t;
				var sample = 0.0;
				
				for (var j = 0; j < harmonics.length; j++)
				{
					var amplitude = Math.pow(10, (harmonics[j][1] - (t * harmonics[j][2])) / 20);
					
					sample += amplitude * Math.sin(omega * frequency * harmonics[j][0]);
				}
				
				audioData[i] = sample;
			}

			{
				var n = fadeInDuration * audioBuffer.sampleRate;
				for (var i = 0; i < n; i++)
				{
					audioData[i] *= i / n;
				}
			}

			{
				var n = fadeOutDuration * audioBuffer.sampleRate;
				for (var i = 0; i < n; i++)
				{
					audioData[(audioBuffer.Length - 1) - i] *= i / n;
				}
			}
			 
			var t = audioContext.currentTime + 0.1;
			for (var i = 0; i < jingleData.melody.length; i++)
			{
				var audioSource = audioContext.createBufferSource();
				audioSource.buffer = audioBuffer;
				audioSource.playbackRate.value = Math.pow(2.0, jingleData.melody[i][0] / 12.0);
				audioSource.connect(audioContext.destination);
				audioSource[audioSource.start ? 'start' : 'noteOn'](t);
				
				t += jingleData.melody[i][1] / 1000.0;
			}			
		};
	
		// Try to load the jingle for the current Boo variant, and create the play button if successful.
		$.getJSON(basePath + '/jingle/' + booVariant + '.json', function(data) {
			jingleData = data;
			
			var button = document.createElement('img');

			button.src = basePath + '/image/jingle-play.png';
			button.style = 'position: absolute; right: 0px; top: 0px; opacity: 0.75; width: 20px; height: 20px;';
			button.addEventListener('click', jinglePlay, false);

			document.getElementById("yn-mascot").appendChild(button);
		});		
	};

	
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
		var match =  /^(.*)\/animate\.js$/.exec ($('script[src$="/animate.js"]').prop ('src'));

		if (!match)
			return;

		var basePath = match[1];
		var imagePath = basePath + '/image/';

		// Start animation if one is defined for current Boo variant
		var layer = '<img style="position: absolute; left: 0; top: 0; opacity: 0;">';
		var tick;
		
		var booVariant = $.cookie ('boo');
		if (!booVariant || $.trim(booVariant) === '')
			booVariant = 'default';

		switch (booVariant)
		{
			case 'christmas':
				tick = function (target, duration, steps, index)
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

				replace (target)
					.append ($('<img>').prop ('src', imagePath + 'christmas.png'))
					.append ($(layer).addClass ('g').prop ('src', imagePath + 'christmas-glow.png'))
					.append ($(layer).addClass ('l').prop ('src', imagePath + 'christmas-light0.png'))
					.append ($(layer).addClass ('l').prop ('src', imagePath + 'christmas-light1.png'))
					.append ($(layer).addClass ('l').prop ('src', imagePath + 'christmas-light2.png'))
					.append ($(layer).addClass ('l').prop ('src', imagePath + 'christmas-light3.png'))
					.find ('.g').each (function () { tick ($(this), 1000, [500, 500], 0); }).end ()
					.find ('.l').each (function () { tick ($(this), 250, [100, 100, 200, 200, 500, 500], 0); }).end ();

				break;

			case 'sleep':
				tick = function (target, index)
				{
					target.find ('.z' + (index % 3)).animate ({opacity: 1 - Math.floor (index / 3)}, 250, 'linear', function ()
					{
						setTimeout (function ()
						{
							tick (target, (index + 1) % 6);
						}, 500);
					});
				};

				replace (target)
					.append ($('<img>').prop ('src', imagePath + 'sleep.png'))
					.append ($(layer).addClass ('z0').prop ('src', imagePath + 'sleep-z0.png'))
					.append ($(layer).addClass ('z1').prop ('src', imagePath + 'sleep-z1.png'))
					.append ($(layer).addClass ('z2').prop ('src', imagePath + 'sleep-z2.png'))
					.each (function () { tick ($(this), 0); });

				break;
			
			default:
				// jingleInit() expects target to be a <div>, so we need to create one 
				// even if there's no animation for the current Boo variant
				replace (target)
					.append ($('<img>').prop ('src', imagePath + booVariant + '.png'));
				break;
		}

		jingleInit(target, booVariant, basePath);
	};

	/*
	** Replace given element with new empty div and preserve its "id" property. This method is used
	** to define a new animation from scratch without knowledge about what was previously running.
	** previous:	element to be replaced
	** return:		replaced element
	*/
	var replace = function (previous)
	{
		return $('<div style="position: relative;">')
			.prop ('id', previous.prop ('id'))
			.replaceAll (previous);
	};

	// Bind animation callback to image load event + trigger manually once in case image was
	// already loaded from cache at this point. This implies "animate" may be called twice.
	$('#yn-mascot')
		.prop ('alt', 'Boo')
		.one ('load', animate)
		.each (animate);
});
