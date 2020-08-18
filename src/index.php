<?php

/*
** Current date, time and weather state used to select Boo variant.
*/
class State
{
    public $cloudiness;
    public $condition;
    public $day;
    public $hour;
    public $minute;
    public $month;
    public $temperature;
    public $user;
    public $weather;
};

/*
** Send HTTP GET request to given URL and decode resonse as a JSON object.
** $agent: user agent
** $url: target URL
** return: JSON response
*/
function http_get_json($agent, $url)
{
    $handle = curl_init();

    curl_setopt($handle, CURLOPT_CONNECTTIMEOUT_MS, 5000);
    curl_setopt($handle, CURLOPT_TIMEOUT_MS, 1000);
    curl_setopt($handle, CURLOPT_USERAGENT, $agent);
    curl_setopt($handle, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($handle, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($handle, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($handle, CURLOPT_TCP_NODELAY, false);
    curl_setopt($handle, CURLOPT_URL, $url);

    $output = curl_exec($handle);

    curl_close($handle);

    return $output !== false ? json_decode($output, true) : null;
}

/*
** Get name of Boo variant to display depending on user properties (weather and
** time of the day) and pre-defined matching rules.
** $agent: user agent (used for outgoing HTTP requests)
** $appid: application identifier for OpenWeatherMap
** $time: current Unix timestamp
** $user: current user id or 0 for guest users
** return: selected variant name
*/
function get_variant($agent, $appid, $time, $user)
{
    // Skip variant selection entirely for guest users. This is required to
    // save most requests to OpenWeatherMap and FreeGeoIP as they're limited.
    if ($user !== 0) {
        // Get current day and time
        list($month, $day, $hour, $minute) = explode('-', date('m-d-H-i', $time));

        // Get weather from OpenWeatherMap API
        $weather = get_weather($agent, $appid);

        // Merge datetime and weather into single state structure
        $state = new State();
        $state->cloudiness = isset($weather['clouds']['all']) ? (int)$weather['clouds']['all'] : 0; // Cloudiness %
        $state->condition = isset($weather['weather'][0]['main']) ? strtolower($weather['weather'][0]['main']) : ''; // Condition name
        $state->day = (int)$day;
        $state->hour = (int)$hour;
        $state->minute = (int)$minute;
        $state->month = (int)$month;
        $state->temperature = isset($weather['main']['temp']) ? (int)$weather['main']['temp'] : 293.15; // Temperature in Kelvins
        $state->user = $user;
        $state->weather = isset($weather['weather'][0]['id']) ? (int)$weather['weather'][0]['id'] : 0; // Weather identifier

        // Select boo variant according to current state
        $matches = array(
            'drunk' => function ($state) {
                return $state->month === 1 && $state->day === 1;
            },
            'crown' => function ($state) {
                return $state->month === 1 && $state->day === 6;
            },
            'yoshi' => function ($state) {
                return $state->month === 1 && $state->day === 24;
            },
            'pancake' => function ($state) {
                return $state->month === 2 && $state->day === 2;
            },
            'valentine' => function ($state) {
                return $state->month === 2 && $state->day === 14;
            },
            'cardboard' => function ($state) {
                return $state->month === 2 && $state->day === 17;
            },
            'bear' => function ($state) {
                return $state->month === 6 && $state->day === 25;
            },
            'redhat' => function ($state) {
                return $state->month === 7 && $state->day === 1;
            },
            'fireworks' => function ($state) {
                return $state->month === 7 && $state->day === 14;
            },
            'snake' => function ($state) {
                return $state->month === 8 && $state->day === 2;
            },
            'nukem' => function ($state) {
                return $state->month === 8 && $state->day === 25;
            },
			'china' => function ($state) {
                return $state->month === 8 && $state->day === 29;
            },
            'unicorn' => function ($state) {
                return $state->month === 9 && $state->day === 9;
            },
            'penguin' => function ($state) {
                return $state->month === 9 && $state->day === 12;
            },
            'space' => function ($state) {
                return $state->month === 9 && $state->day === 27;
            },
            'particule' => function ($state) {
                return $state->month === 10 && $state->day === 15;
            },
            'swan' => function ($state) {
                return $state->month === 10 && $state->day === 18;
            },
            'pizza' => function ($state) {
                return $state->month === 10 && $state->day === 21;
            },
            'pixel' => function ($state) {
                return $state->month === 10 && $state->day === 23;
            },
            'ghost' => function ($state) {
                return $state->month === 10 && $state->day === 31;
            },
            'totoro' => function ($state) {
                return $state->month === 11 && $state->day === 4;
            },
            'cornflower' => function ($state) {
                return $state->month === 11 && $state->day === 11;
            },
            'kirby' => function ($state) {
                return $state->month === 12 && $state->day === 19;
            },
            'christmas-dark' => function ($state) {
                return $state->month === 12 && $state->day < 24 && ($state->hour + 2) % 24 <= 7;
            },
            'christmas' => function ($state) {
                return $state->month === 12 && $state->day < 24;
            },
            'santa' => function ($state) {
                return $state->month === 12 && $state->day === 24;
            },
            'gift' => function ($state) {
                return $state->month === 12 && $state->day === 25;
            },
            'cola' => function ($state) {
                return $state->month === 12 && $state->day === 28;
            },
            'yellow' => function ($state) {
                return $state->month === 12 && $state->day < 31;
            },
            'party' => function ($state) {
                return $state->month === 12 && $state->day === 31;
            },
            'dark' => function ($state) {
                return $state->hour === 3 && $state->minute === 0;
            },
            'sleep' => function ($state) {
                return ($state->hour + 1) % 24 <= 7;
            },
            'freeze' => function ($state) {
                return $state->temperature < 269.15;
            },
            'bobblehat' => function ($state) {
                return $state->temperature < 277.15;
            },
            'hot' => function ($state) {
                return $state->temperature > 308.15;
            },
            'umbrella' => function ($state) {
                return $state->condition === 'rain' && $state->weather > 500 && $state->cloudiness >= 50;
            },
            'snow' => function ($state) {
                return $state->condition === 'snow' && $state->weather > 600 && $state->cloudiness >= 50;
            },
            'sunglass' => function ($state) {
                return $state->hour >= 10 && $state->hour <= 18 && $state->cloudiness < 10 && $state->temperature > 297.15;
            },
			'fan' => function ($state) {
                return $state->temperature > 297.15;
            }
        );

        // Search for matching predicate and return associated variant name
        foreach ($matches as $name => $predicate) {
            if ($predicate($state)) {
                return $name;
            }
        }
    }

    // No match, fallback to default variant name
    return 'default';
}

/*
** Resolve geolocation from given user IP address and retrieve weather
** information for this location.
** $agent: user agent (used for outgoing HTTP requests)
** $appid: application identifier for OpenWeatherMap
** return: weather data from OpenWeatherMap
*/
function get_weather($agent, $appid)
{
    // Get remote IP address and return if it can't be geolocalized
    $ip_address = $_SERVER['REMOTE_ADDR'];
    $is_public = filter_var($ip_address, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 | FILTER_FLAG_IPV6 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false;

    if (!$is_public) {
        return null;
    }

    // Call FreeGeoIP to resolve latitude and longitude and return on invalid response
    // See: https://freegeoip.app/
    $geo = http_get_json($agent, 'https://freegeoip.app/json/' . $ip_address);

    if ($geo === null || !isset($geo['latitude']) || !isset($geo['longitude'])) {
        return null;
    }

    // Call OpenWeatherMap API to get weather information
    // See: http://openweathermap.org/current#geo
    $weather = http_get_json($agent, 'http://api.openweathermap.org/data/2.5/weather?appid=' . rawurlencode($appid) . '&lat=' . rawurlencode($geo['latitude']) . '&lon=' . rawurlencode($geo['longitude']));

    return $weather;
}

require 'config.php';

// Call Boo variant selection method to get current variant name
$agent = $config['openweathermap.agent'];
$appid = $config['openweathermap.appid'];
$time = time();
$user = isset($_GET['user']) ? (int)$_GET['user'] : 0;

$name = get_variant($agent, $appid, $time, $user);
$path = $config['image.path'] . '/' . $name . $config['image.extension'];

// Emit HTTP redirection with caching directives
header('Cache-Control: public, max-age=' . $config['image.expire']);
header('Content-Length: ' . filesize($path));
header('Content-Type: ' . $config['image.mime']);
header('Expires: ' . gmdate('D, d M Y H:i:s', $time + $config['image.expire']) . ' GMT');

// Store name in cookie so it can be read from JavaScript
setcookie('boo', $name, $time + $config['image.expire'] + 1, $config['cookie.path'], $config['cookie.domain']);

// Read image contents
readfile($path);
