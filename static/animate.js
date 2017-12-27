/*
** Display selected Boo variant and start associated animation if any.
*/
$(function ()
{
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

		var path = match[1] + '/image/';

		// Start animation if one is defined for current Boo variant
		var layer = '<img style="position: absolute; left: 0; top: 0; opacity: 0;">';
		var tick;

		switch ($.cookie ('boo'))
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
					.append ($('<img>').prop ('src', path + 'christmas.png'))
					.append ($(layer).addClass ('g').prop ('src', path + 'christmas-glow.png'))
					.append ($(layer).addClass ('l').prop ('src', path + 'christmas-light0.png'))
					.append ($(layer).addClass ('l').prop ('src', path + 'christmas-light1.png'))
					.append ($(layer).addClass ('l').prop ('src', path + 'christmas-light2.png'))
					.append ($(layer).addClass ('l').prop ('src', path + 'christmas-light3.png'))
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
					.append ($('<img>').prop ('src', path + 'sleep.png'))
					.append ($(layer).addClass ('z0').prop ('src', path + 'sleep-z0.png'))
					.append ($(layer).addClass ('z1').prop ('src', path + 'sleep-z1.png'))
					.append ($(layer).addClass ('z2').prop ('src', path + 'sleep-z2.png'))
					.each (function () { tick ($(this), 0); });

				break;
		}
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
