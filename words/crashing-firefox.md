A few months ago I was playing with the [Geolocation API][geoapi], and I
accidentally found a denial-of-service in Firefox.

I was trying to get close-to-live updates so I could rotate an arrow to point
at a specific location. While I never got this code working, it required
coordinates that updated really, *really* fast. So, like anyone who hates their
poor phone's battery, I set the timeout for `Geolocation.watchPosition` to 100.

[geoapi]: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API

I didn't see an issue with this. `watchPosition` is used to get GPS
coordinates repeatedly, waiting `timeout` milliseconds before yelling
"Where am I?!" again. In this case, it annoys my tiny GPS ten times a second.
Since this wasn't a serious project and it was in early
development, the error "correction" code was essentially "Oh? A bad thing
happened? Scream it at the user!".

All modern browsers have measures to stop a webpage from flooding the client
with alerts and creating a sort of denial-of-service. Usually, this is done
by only allowing one alert at a time, and after the third time there is a
checkbox to "Prevent this page from crating additional dialogues". It seems
that, for whatever reason, there is no limit to the number of concurrent popups
one can create by harnessing the great power of the Geolocation API. That is, if
you're on Firefox; Chrome seems fine.

If you're on Firefox and you click the button bellow, making sure to allow
location access, you'll be flooded with alerts faster than you can close them.
I recommend being sure that "Don't ask me again" is *unchecked*, unless you want
to spend a non-small amount of time fighting the cache to get your browser back.
If you're on Android, Firefox will crash if you don't manage to close it first.
The desktop client seems to handle it better, collecting the alert windows until
you close the tab.

I of course reported the bug, the ticket of which you can find [here][bugzilla],
but it was marked WONTFIX. I found it pretty interesting, so I thought it share
it with you, dear interneter. I hope you found this at least semi-interesting,
until next time!

[bugzilla]: https://bugzilla.mozilla.org/show_bug.cgi?id=1627597
