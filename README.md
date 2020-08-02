yAroBoo README
==============

Overview
--------

This project exposes a simple web service that provides dynamic (and optionally
animated) "Boo" mascot to every [yAronet](http://www.yaronet.com) page.

Execution workflow is not straightforward due to flickering-avoiding hacks (if
you know a better option let me know!) and consists in two code snippets:

- A PHP script selects a Boo variant, store the name of this selected variant
  in a HTTP cookie and reads image contents from a static file.
- A JavaScript waits for the image to be loaded, read its name from the
  aforementioned HTTP cookie and triggers animation if one is defined.

Boo variants are selected based on current date, time and weather: date and
time are provided by execution server while weather is retrieved from
[OpenWeatherMap](http://openweathermap.org/) using user geographic coordinates
deduced from his IP address using [FreeGeoIP](http://freegeoip.net/).

Selection is performed only for users identified on yAronet due to the limited
amount of allowed requests on provider APIs. Guest users are always being
displayed default variant instead. The "is identified" criteria used for this
decision is only declarative (user identifier is passed through a GET parameter)
and cannot be considered as an authentication mechanism in any way.


Structure
---------

Directory `src/` contains a PHP file with code used for variant selection and
executed by the server, as well as a sample configuration file. Code is rather
small, documented and has no dependency so it should be pretty straightforward
if you're familiar with PHP language.

Directory `res/` contains raw PNG images used by the PHP script to serve valid
images. Only the base images are processed this way instead of being served as
regular static files, to avoid flickering effect on the main website.

Directory `static/` contains JavaScript code as well as additional resources
used for dynamic Boo variants (e.g. images for animations, extra data, etc.).

- JavaScript code is allowed to have dependencies on
  [jQuery](https://jquery.com/) and
  [jquery-cookie](https://github.com/carhartl/jquery-cookie).
- Image files here must be PNG images with an height of exactly 75px.

Directory `artwork/` contains source images of all available variants in their
original format. As they won't be served directly by server no restriction
on format apply, but you should aim for highest possible quality (SVG format
is strongly preferred here).


Development
===========

File `index.html` at directory root allows testing of front-end code without
requiring a PHP server to run. As long as you're modifying contents in `res/`
or `static/` directories you should be fine by just opening this file in any
modern browser.

For testing yAroboo or previewing your changes to PHP code, clone file
`src/config.php.dist` to `src/config.php`, modify it to replace the
`openweathermap.appid` parameter by your own API key from openweathermap.org,
then start a PHP server and browse to `src/` directory: a Boo should be
displayed after the variant being selected exactly as it will be after
deployment.

When submitting your changes please try to stay compliant with previous coding
and design choices even though no strict guideline is available. In particular
please note that:

- Names of Boo variants describe their content, not the event they'll be used
  for (e.g. "pumpkin.png" instead of "halloween.png").
- All code files are indented with tabs, not spaces, and every opening
  parenthesis has a space before it.
- All branches in Git repository have no merge commit, only rebased ones.


Deployment
----------

Contact me so I can add you as contributor to this GitHub project, as well as
add your IP address to yAronet test version whitelist.

Any commit you push to branch named "test" will be automatically deployed to
[test version of yAronet](http://www-test.yaronet.com) within an hour. This
version is restricted and you'll need to ask for your IP address to be
whitelisted before you can browse it. Branch "test" can be rewritten just like
the "topic/" ones, so don't be afraid to push experimental code to it.

Any commit you push to branch named "master" will be automatically deployed to
[production version of yAronet](http://www.yaronet.com) within an hour. This
branch cannot be rewritten, make sure you tested your code properly before
submitting there!

The JavaScript template will be minified when deployed (as well as the images
optimized) so there is no excuse for not commenting your code thoroughly :)
