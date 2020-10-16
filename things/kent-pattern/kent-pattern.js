/**
 * @file A small script to create Kent Patterns on a canvas with optional control over various
 * elements of the generated pattern.
 * @license CC0-1.0
 * @author genbyte
 */

/**
 * Frontend for the Kent Pattern
 */
class KentPatternUI {
	/**
	 * Constructs a KentPatternUI object. Will print an error if the cancasId can not be found in
	 * the DOM. All controls have an ID of "kentPattern-" followed by it's function. If an control
	 * is not found for the function, it is ignored. The supported functions are listed below:
	 * - fullscreen
	 * - moveDown
	 * - moveLeft
	 * - moveRigt
	 * - moveUp
	 * - zoomIn
	 * - zoomOut
	 * @param {string} canvasId - The ID of the canvas to draw the pattern to.
	 * @param {boolean} [searchControls] - If true, we'll attempt to find controls in the DOM by
	 * their ID and add event listeners. If false or undefined, no search will be done.
	 * @param {boolean} [allowKeyboardMouse] - If true, enables mouse and keyboard input.
	 * @param {boolean} [allowTouch] - If true, enables touch input
	 */
	constructor(canvasId, searchControls, allowKeyboardMouse, allowTouch) {
		// Grab the elements we need
		this.canvas = document.getElementById(canvasId);

		// Be sure the canvas was located
		if (!this.canvas) {
			console.error("[KentPatternUI::constructor] Could not locate canvas! Be sure the ID is correct!");
			return;
		}
		this.ctx = this.canvas.getContext('2d');

		// Make sure the canvas width is set
		this.canvas.width = this.canvas.clientWidth;
		this.canvas.style.width = this.canvas.width;

		if (searchControls) {
			this.initDOMControls();
		}

		if (allowKeyboardMouse) {
			this.initKBMControls();
		}

		this.pattern = new KentPattern();

		// Settings
		this.offsetX = 0;
		this.offsetY = 0;
		this.setCellSize(4);
		this.numberColors = ['#FFF', '#000'];
	}

	initDOMControls() {
		let register = function(controlId, fn) {
			let fullId = `kentPattern-${controlId}`;
			let control = document.getElementById(fullId);

			if (control) {
				control.addEventListener('click', fn);
				console.log(`Found and activated ${controlId}`);
			} else {
				console.log(`Could not find ${fullId}`);
			}
		}

		register("fullscreen", function() {
			this.fullscreen();
		}.bind(this));

		register("zoomIn", function() {
			this.increaseCellSize();
		}.bind(this));

		register("zoomOut", function() {
			this.decreaseCellSize();
		}.bind(this));

		register("moveUp", function() {
			this.addOffset(0, -this.cellHalfHeight);
		}.bind(this));

		register("moveLeft", function() {
			this.addOffset(-this.cellHalfWidth, 0);
		}.bind(this));

		register("moveRight", function() {
			this.addOffset(this.cellHalfWidth, 0);
		}.bind(this));

		register("moveDown", function() {
			this.addOffset(0, this.cellHalfHeight);
		}.bind(this));
	}

	initKBMControls() {
		this.canvas.addEventListener('mousedown', this.mouseDown.bind(this));
		this.canvas.addEventListener('mousemove', this.mouseMove.bind(this));
		this.canvas.addEventListener('mouseup', this.mouseUp.bind(this));
		this.canvas.addEventListener('mouseleave', this.mouseUp.bind(this));
		this.canvas.addEventListener('mouseenter', this.mouseEnter.bind(this));

		// I love that this event is "onwheel" because it just sounds so silly
		this.canvas.addEventListener('wheel', this.wheel.bind(this));
	}

	mouseDown(event) {
		this.mouseIsDown = true;
		this.mouseX = event.offsetX;
		this.mouseY = event.offsetY;
	}

	mouseMove(event) {
		if (this.mouseIsDown) {
			let x = event.offsetX;
			let y = event.offsetY;

			this.addOffset((x - this.mouseX) * -1, (y - this.mouseY) * -1);
			this.mouseX = x;
			this.mouseY = y;
		}
	}

	mouseUp(event) {
		this.mouseIsDown = false;
	}

	mouseEnter(event) {
		// If the left button is pressed, simulate a mouseDown. If you're interested to know why
		// this is a mod2, see the docs linked below.
		// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
		if (event.buttons%2 == 1) {
			this.mouseDown(event);
		}
	}

	wheel(event) {
		if (event.deltaY > 0) {
			// If there was any +vertical scroll, increase cell size
			this.increaseCellSize();
		} else if (event.deltaY < 0) {
			// If there was any -vertical scroll, decrease cell size
			this.decreaseCellSize();
		}
		event.preventDefault();
	}

	/**
	 * Set's the height using an aspect ratio.
	 * @param {number} ratio - Aspect ratio
	 */
	setAspectRatio(ratio) {
		this.setSize(this.canvas.width, Math.ceil(this.canvas.width / ratio));
	}

	/**
	 * Sets the size of the canvas
	 * @param {number} w - Width of the canvas
	 * @param {number} h - Heght of the canvas
	 */
	setSize(w, h) {
		this.canvas.width = w;
		this.canvas.style.height = this.canvas.width;
		this.canvas.height = h;
		this.canvas.style.height = this.canvas.height;

		this.calculateCellValues();
		this.drawVisibleArea();
	}

	/**
	 * Sets the canvas size from the size of it's DOM element
	 */
	setSizeFromDOM() {
		this.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
	}

	/**
	 * Makes the canvas fullscreen. When the user exits fullscreen, the canvas is returned to
	 * its previous size.
	 */
	fullscreen() {
		if (!document.fullscreenElement) {
			// Save the size of the canvas and then make it as large as the window can be
			this.originalWidth = this.canvas.width;
			this.originalHeight = this.canvas.height;
			this.setSize(window.innerWidth, window.innerHeight);

			// Need to save the reference so we can remove it later
			this.fullscreenChangeListenerFn = this.fullscreenChange.bind(this);
			document.addEventListener('fullscreenchange', this.fullscreenChangeListenerFn);

			this.canvas.requestFullscreen();
		}
	}

	fullscreenChange() {
		if (document.fullscreenElement) {
			// Need to save the reference so we can remove it later
			this.windowResizeListenerFn = this.windowResize.bind(this);
			window.addEventListener('resize', this.windowResizeListenerFn);
		} else {
			// Reset the canvas size to what it was before fullscreen
			this.setSize(this.originalWidth, this.originalHeight);

			window.removeEventListener('resize', this.windowResizeListenerFn);
			document.removeEventListener('fullscreenchange', this.fullscreenChangeListenerFn);
		}
	}

	windowResize() {
		this.setSize(window.innerWidth, window.innerHeight);
	}

	/**
	 * Multiply the cell size by two and call {@link KentPatternUI#addOffset} with a fourth of the 
	 * canvas width and a fourth of the height so the zoom is centered. There is no upper limit to
	 * cell size.
	 */
	increaseCellSize() {
		this.setCellSize(this.cellSize*2);

		this.addOffset(this.canvas.width / 4, this.canvas.height / 4);

		this.drawVisibleArea();
	}

	/**
	 * If the current cellSize is *2 or greater*, the cellSize will be cut in half and
	 * the offset decreased by a fourth of the width/height by calling
	 * {@link KentPatternUI#addOffset} with negative values.
	 * If the current cellSize is *less than 2*, nothing is done.
	 */
	decreaseCellSize() {
		if (this.cellSize >= 2) { 
			this.setCellSize(this.cellSize/2);

			this.addOffset(-1 * this.canvas.width / 4, -1 * this.canvas.height / 4);

			this.drawVisibleArea();
		}
	}

	/**
	 * Set the size, in pixels, used to render each cell
	 * @param {number} cellSize - Number of pixels to use for the side of the square cell
	 */
	setCellSize(cellSize) {
		this.cellSize = cellSize;

		this.calculateCellValues();
	}

	/**
	 * Add x and y to their respective offsets.
	 * @param {number} x - Number to add to the X offset
	 * @param {number} y - Nmber to add to the Y offset
	 */
	addOffset(x, y) {
		this.setOffset(this.offsetX + x, this.offsetY + y);
	}

	setOffset(x, y) {
		this.offsetX = Math.round(x);
		this.offsetY = Math.round(y);

		// There's a hard limit on the left due to how the pattern is formed.
		//TODO: Flash a red line along the left edge to inform the user they can't do that
		if (this.offsetX < 0) {
			this.offsetX = 0;
		}

		//TODO: Implement negative Y values so this doesn't have to exist
		if (this.offsetY < 0) {
			this.offsetY = 0;
		}

		this.calculateCellValues();
		this.drawVisibleArea();
	}

	calculateCellValues() {
		this.cellWidth = Math.ceil(this.canvas.width / this.cellSize);
		this.cellHeight = Math.ceil(this.canvas.height / this.cellSize);

		this.cellHalfWidth = Math.floor(this.cellWidth/2);
		this.cellHalfHeight = Math.floor(this.cellHeight/2);

		this.cellOffsetX = Math.floor(this.offsetX / this.cellSize);
		this.cellOffsetY = Math.floor(this.offsetY / this.cellSize);
	}

	/**
	 * Draws a single cell of the appropriate color
	 * @param {number} value - The value to draw
	 * @param {*} x - The X coordinate of the **cell** to draw
	 * @param {*} y - The Y coordinate of the **cell** to draw
	 */
	drawCell(value, x, y) {
		this.ctx.fillStyle = this.numberColors[value];
		
		this.ctx.fillRect(
			this.offsetX%this.cellSize*-1 + (x * this.cellSize), this.offsetY%this.cellSize*-1 + (y * this.cellSize),
			this.cellSize, this.cellSize
		);
	}

	/**
	 * Draws the pattern across the entire canvas.
	 */
	drawVisibleArea() {
		let x = this.cellOffsetX;
		let y = this.cellOffsetY;
		let w = this.cellWidth+1; // Add one because the offset will cause weirdness if not
		let h = this.cellHeight+1;

		let data = this.pattern.getArea(x, y, w, h);

		for (let i = 0; i < h; ++i) {
			for (let j = 0; j < w; ++j) {
				this.drawCell(data[i][j], j, i);
			}
		}
	}
}

/**
 * The logic behind the pattern
 */
class KentPattern {
	/**
	 * Constructs a new KentPattern object.
	 */
	constructor() {
		this.base = 2;
		this.data = [];
		this.data.negative = [];
		this.fnStartingSequence = KentPattern.randomStartingSequence;
	}

	/**
	 * Sets the funciton used to fill out the first row of the pattern
	 * @param {randomStartingSequence} fnStartingSequence - The function that will be used.
	 * Have a look at {@link KentPattern.randomStartingSequence}
	 */
	setStartingSequence(fnStartingSequence) {
		if (!this.isFunction(fnStartingSequence)) {
			console.error("[KentPattern::setStartingRow] expects a function as input but did not get one!");
			return;
		}
		this.fnStartingSequence = fnStartingSequence;
	}

	/**
	 * Get the pattern data for the described rectangle. This will generate the data as neccesary.
	 * @param {number} x - X coordinate of the top-left
	 * @param {number} y - Y coordinate of the top-left
	 * @param {number} w - Width
	 * @param {number} h - Height
	 * @returns {number[]} The pattern data
	 */
	getArea(x, y, w, h) {
		let startTime = new Date();
		let calcuations = this.generatePattern(x+w, y+h);
		let endTime = new Date();

		let timeTakenMs = endTime - startTime;
		console.log(`Took ${timeTakenMs} to generate ${calcuations} numbers`);

		let area = [];
		for (let i = y; i < y+h; ++i) {
			area[i-y] = this.data[i].slice(x, x+w);
		}

		return area;
	}

	/**
	 * Generate the data that has not already been generated from 0,0 to endX,endY
	 * @param {number} endX - X position to stop generation
	 * @param {number} endY - Y position to stop generation
	 * @returns {number} The amount of data it had to generate
	 */
	generatePattern(endX, endY) {
		let count = 0;

		// Make sure there's a row for the initial data
		if (this.data[0] == undefined) {
			this.data[0] = [];
		}

		// Use fnStartingSequence for the first row
		for (let i = this.data[0].length; i < endX; ++i) {
			this.data[0][i] = this.fnStartingSequence(i);
			++count;
		}

		// Generate values [1,endY)
		for (let i = 1; i < endY; ++i) {
			// Make sure there's an array for the row
			if (this.data[i] == undefined) {
				this.data[i] = [];
			}

			for (let j = this.data[i].length; j < endX; ++j) {
				if (j == 0) {
					// Special case: If this is the first number in the row, there is no left
					// number so copy the value from the row above.
					this.data[i][j] = this.data[i-1][j];
				} else {
					this.data[i][j] = (this.data[i][j-1] + this.data[i-1][j]) % this.base;
				}
				count++;
			}
		}

		return count;
	}

	/**
	 * Generate a random starting sequence
	 * @param {number} n - The index on the first row
	 * @returns {number} Value the index should be given
	 */
	static randomStartingSequence(n) {
		//TODO: Make this function generate numbers in range of [0,this.base]
		return Math.round(Math.random());
	}

	/**
	 * Poached from [Stack Overflow]{@link https://stackoverflow.com/a/7356528/10354782},
	 * Checks if functionToCheck is a function.
	 * @param {Object} functionToCheck 
	 * @returns {boolean} True if functionToCheck is a function, false otherwise
	 */
	static isFunction(functionToCheck) {
		return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
	}
}