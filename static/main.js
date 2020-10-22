/*
 ** Display selected Boo variant, start associated animation if any, and handle jingles.
 */
$(async function () {
    var environment = await import('./static/script/environment.js');
    var jingle = await import('./static/script/jingle.js');
    var sputnik = await import('./static/script/sputnik.js');

    var createButton = function (fileName) {
        return $('<img class="default-helper" style="position: absolute; left: 0px; top: 0px; opacity: 0.75; width: 20px; height: 20px;">')
            .prop('src', environment.baseDirectory + '/ui/' + fileName);
    };

    var createLayer = function (fileName) {
        return $('<img class="default-mascot" style="position: absolute; left: 0; top: 0; opacity: 0;">')
            .prop('src', environment.baseDirectory + '/image/' + fileName);
    }

    // Start animation matching name read from "boo" cookie. This method is intended to be called
    // once request on dynamic image has been completed and set a cookie in return.
    var animate = function () {
        // If image is not loaded yet it means we don't have any cookie value and don't know which
        // Boo variant has been selected. Let's wait for this information to be available.
        if (!this.complete)
            return;

        // Start animation if one is defined for current Boo variant
        var name = $.cookie('boo');

        // Note: target may not be an image anymore if this function is executing for the second
        // time, e.g. if browser reused an old cached image while loading the new one
        var target = $(this);

        // Trigger Boo animation depending on name
        switch (name) {
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
                    .append(createLayer('christmas-glow.png').addClass('g'))
                    .append(createLayer('christmas-light0.png').addClass('l'))
                    .append(createLayer('christmas-light1.png').addClass('l'))
                    .append(createLayer('christmas-light2.png').addClass('l'))
                    .append(createLayer('christmas-light3.png').addClass('l'))
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
                    .append(createLayer('sleep-z0.png').addClass('z0'))
                    .append(createLayer('sleep-z1.png').addClass('z1'))
                    .append(createLayer('sleep-z2.png').addClass('z2'))
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
            case 'pizza':
            case 'redhat':
            case 'snake':
            case 'space':
            case 'swan':
            case 'totoro':
            case 'unicorn':
            case 'yoshi':
                wrap(target)
                    .append(createButton('play-button.svg').on('click', function () {
                        jingle.play($(this), environment.baseDirectory, name);
                    }));

                break;

            case 'helmet':
                wrap(target)
                    .append(createButton('play-button.svg').on('click', function () {
                        sputnik.play($(this));
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