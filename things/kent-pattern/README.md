I was shown the [original][orig] and when I zoomed out of the masterfully
constructed spreadsheet, my computer was unhappy. I asked if I could
reimplement it in Javascript (for speed and fun) and the result of the yes
is below. Enjoy!

[orig]: https://docs.google.com/spreadsheets/d/1ZizN2ixtwMnGtSsSq-rKRs-51RaqBj8p5iKRxB8yQtE/edit?usp=sharing

You can **zoom** with the **scroll wheel**. Zooming out when fullscreen can really slow things down,
so maybe be careful with that.

You can **pan** by **clicking and dragging** the mouse. You can't go left of the starting position
because of the way the pattern is drawn. Eventually you'll be able to go above where you start, but
you cannot yet do that.

There are button controls below the pattern if for some reason your mouse isn't working. This is
useful for mobile devices because *touch isn't implemented yet*. Yet.

[PUT-THE-CANVAS-BLOCK-HERE]: canvas

Here are some things that I'd like to eventually implement:
- Bases other than 2 with support for changing the colors of the numbers
- Proper touch support.
- Custom sequences for the starting, top row.
- Panning above the top of the starting position.

If you'd like to check out the source code, which I am decently proud of, you can see it
[here][src].

[src]: https://github.com/genuinebyte/gensite/tree/main/things/kent-pattern