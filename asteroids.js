/**
 * HTML5 Asteroids
 * ===============
 * 
 * - retro bg
 * - points+ asset & animation
 * - check collision when ship advances
 *
 * - review asteroids movement pattern
 * - animate ship movement
 * - possibly change name
 * - ship figure modern
 * 
 * - repo
 * - jq & assets local, deploy to heroku
 * - 16 positions movement
 * - consider FPS
 * - dificulty levels
 * - movement fuel (if u ran out you cant move)
 * - other cool asteroids links
 * 
 * - sound
 * - no img background
 * - remove jquery
 * - top score on localstorage
 */

/**
 * Returns rotation in degrees when obtaining transform-styles using javascript
 * http://stackoverflow.com/questions/8270612/get-element-moz-transformrotate-value-in-jquery
 * 
 * @{link | https://gist.github.com/adamcbrewer/4202226}
 */
function getRotationDegrees(obj) {
    var matrix = obj.css("-webkit-transform") ||
        obj.css("-moz-transform") ||
        obj.css("-ms-transform") ||
        obj.css("-o-transform") ||
        obj.css("transform");
    if (matrix !== 'none') {
        var values = matrix.split('(')[1].split(')')[0].split(',');
        var a = values[0];
        var b = values[1];
        var angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
    } else { var angle = 0; }
    return angle;
}

function angleToDirection(deg) {
	let direction;
	switch (deg) {
		case 0:
			direction = { h:0, v: -1};
			break;
		case 45:
			direction = { h: 1, v: -1};
			break;
		case 90:
			direction = { h:1, v: 0};
			break;
		case 135:
			direction = { h:1, v: 1};
			break;
		case 180:
		case -180:
			direction = { h:0, v: 1};
			break;
		case -135:
			direction = { h:-1, v: 1};
			break;
		case -90:
			direction = { h:-1, v: 0};
			break;
		case -45:
			direction = { h:-1, v: -1};
			break;				
		default:
			throw new Error(`Invalid degree ${deg}`);
	}
	
	return direction;
}

function getRandom() {
  return Math.random();
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

const ELEMENT_SELECTORS = {
	MAIN: 'main',
	GAME_AREA: 'main .container',
	ASSETS: '.assets',
	ASTEROID: '.assets .asteroid',
	LASER: '.assets .laser',
	SHIP: '.ship',
	SUN: 'main .container .sun',
	SCORE_BOX: 'footer .score .score-points',
	GAME_OVER_MODAL: '.popup-text.popup-text--gameover',
	GAME_LOADING_MODAL: '.popup-text.popup-text--loading',
	GAME_WIN_MODAL: '.popup-text.popup-text--win',
	GAME_INTRO_MODAL: '.popup-text.popup-text--intro',
	DEBUGGEABLE: [
		'.ship-coll',
		'.base',
		'.point',
		'.asteroid'
	].join(',')
}

class GameObject {
	
	constructor($element, width, height) {
		this._$element = $element;
		this._width = width;
		this._height = height;
	}
	
	moveToXY(x, y) {
        this._$element.css({
            left: x,
            top: y
        });
		return this;
    }

    onGameTick() {
        this._step();
    }

    getX() {
        return +this._$element.css('left').replace('px', '');
    }

    getY() {
        return +this._$element.css('top').replace('px', '');
    }
	
	_destroy() {
		this._isDetroyed = true;
	}
	
	destroy() {
		this._destroy();
		this._removeElement();
		return this;
	}
	
	_removeElement() {
		this._$element.remove();
	}
	
	isActive() {
		return !this._isDetroyed;
	}
	
	isWithinBoundaries(x1, y1, x2, y2) {
		return (
			this.getX() > x1 &&
			this.getX() < x2 &&
			this.getY() > y1 &&
			this.getY() < y2
		);
	}
	
	getWidth() {
		return this._width;
	}
	
	getHeight() {
		return this._height;
	}
	
	getCollisionArea() {
		const x1 = this.getX();
		const y1 = this.getY();
		const x2 = x1 + this.getWidth();
		const y2 = y1 + this.getHeight();
		return {
			x1,
			y1,
			x2,
			y2
		}
	}
	
	hide() {
		this._$element.addClass('hidden');
		return this;
	}
	
	show() {
		this._$element.removeClass('hidden');
		return this;
	}
	
}

class Ship extends GameObject {
	
    constructor($element, game) {
		const $collisionBox = $element.parent();
		const width = $collisionBox.innerWidth();
		const height = $collisionBox.innerHeight();
		super($element, width, height);                
        this._$collisionBox = $collisionBox;
        this._width = width;
        this._height = height;
		this._animations = {
			rotating: null,
			advancing: null
		}
		this._game = game;
    }

    moveToXY(x, y) {
        this._$collisionBox.css({
            top: y,
            left: x
        });
    }

    moveCenteredToXY(x, y) {
        this.moveToXY(x - (this.getWidth() * 0.5), y - (this.getHeight() * 0.5));
    }

    rotateClockwise(deg = 45) {
        const r = this.getRotation();
        this.rotateTo(r + deg);
    }

    rotateCounterClockwise(deg = 45) {
        const r = this.getRotation();
        this.rotateTo(r - deg);
    }

    getRotation() {
        return getRotationDegrees(this._$collisionBox);
    }

    rotateTo(deg) {
		if (!this._animations.rotating) {
			this._$element.addClass('rotating');
			this._animations.rotating = setTimeout(() => {
				this._$element.removeClass('rotating');
				this._animations.rotating = null;
			}, 200);
		}
        this._$collisionBox.css({
            transform: `rotate(${deg}deg)`
        });
    }

    getX() {
        return +this._$collisionBox.css('left').replace('px', '');
    }

    getY() {
        return +this._$collisionBox.css('top').replace('px', '');
    }

    getLaserPoint() {
        const p = document.getElementsByClassName('point')[0].getBoundingClientRect();
        return {
            x: p.x,
            y: p.y
        }
    }
	
	_checkBoundariesAndGetDestination(x, y) {
		const boundaries = this._game.getGameBoundaries();
		let destX = x;
		let destY = y;
		
		if (x < boundaries.x1) {
			destX = boundaries.x2;
		} else if (x > boundaries.x2) {
			destX = boundaries.x1;
		}
		
		if (y < boundaries.y1) {
			destY = boundaries.y2;
		} else if (y > boundaries.y2) {
			destY = boundaries.y1;
		}
		
		return { x: destX, y: destY };
	}
	
	advance() {
		const dir = angleToDirection(this.getRotation());
		const x = this.getX() + dir.h * Ship.speedFactor;
		const y = this.getY() + dir.v * Ship.speedFactor;		
				
		if (!this._animations.advancing) {
			this._$element.addClass('advancing');
			this._animations.advancing = setTimeout(() => {
				this._$element.removeClass('advancing');
				this._animations.advancing = null;
			}, 100);
		}	

		const d = this._checkBoundariesAndGetDestination(x, y);
		
		this.moveToXY(d.x, d.y);
	}
	
}

Ship.speedFactor = 20;

class Laser extends GameObject {
    constructor($element, x, y, deg, horizontal, vertical) {
		super($element, Laser.width, Laser.height);
        this._initial = {
            x,
            y,
            deg,
            direction: {
                horizontal,
                vertical
            }
        }
    }

    _step() {
        const d = this._initial.direction;
        const nextX = this.getX() + (d.horizontal * Laser.speedFactor);
        const nextY = this.getY() + (d.vertical * Laser.speedFactor);
        this.moveToXY(nextX, nextY);
    }

}

Laser.speedFactor = 20;
Laser.width = 1;
Laser.height = 4;

Laser.createOnXY = (x, y, deg, horizontal, vertical) => {
    const $laser = $(ELEMENT_SELECTORS.LASER)
        .clone()
        .css({
            top: y,
            left: x,
            transform: `rotate(${deg}deg)`
        })
        .removeClass('hidden');
    return new Laser($laser, x, y, deg, horizontal, vertical);
}

class Game {
	
    constructor({innerWidth, innerHeight}) {
        this._$element = $(ELEMENT_SELECTORS.GAME_AREA);
        this.laserObjects = [];
		this.asteroidsObjects = [];
        this.ship = new Ship($(ELEMENT_SELECTORS.SHIP), this);
        this.dimensions = {
            w: innerWidth,
            h: innerHeight,
            center: {
                x: innerWidth * 0.5,
                y: innerHeight * 0.5
            }
        }
        this._score = 0;
        this._mainLoopInterval = null;
		this._asteroidGenerator = new AsteroidGenerator(this);
		this._isRunning = false;
		this._firstRun = true;
		this._debugMode = false;
    }

    addLaser(laser) {
		this.laserObjects.push(laser);
        laser._$element.appendTo(this._$element);
    }
	
	canAddAsteroid() {
		return this.asteroidsObjects.length < Game.maxAsteroids;
	}
	
	addAsteroid(asteroid) {
		this.asteroidsObjects.push(asteroid);
		asteroid._$element.appendTo(this._$element);
		if (this._debugMode) {
			asteroid._$element.addClass('debug');
		}
	}
	
	_appendToSelf($elem) {
		$elem.appendTo(this._$element);
	}
	
	_increaseScore(n = 100) {
		this._score += n;
		this._updateScoreView();
	}
	
	_updateScoreView() {
		const formattedScore = String(`00000000${this._score}`).slice(-8);
		$(ELEMENT_SELECTORS.SCORE_BOX).text(formattedScore);
	}
	
	onTick() {
		// laser on tick and leaving viewport:
		this.laserObjects.forEach((l) => {
			if (!l.isWithinBoundaries(0, 0, this.dimensions.w, this.dimensions.h)) {
				l.destroy();
			} else {
				l.onGameTick();
			}
		});
	
		// asteroid collsions with ship or lasers
		this.asteroidsObjects.forEach((a) => {
			if (!this._isAsteroidInGameViewport(a)) {
				a.destroy();
			} else if (this._checkShipCollisionWithAsteroid(a)) {
				// asteroid collided with player ship
				a.destroy(true);
				this._gameOver();
			} else {
				const laserInCollision = this._getLaserInArea(a.getCollisionArea())
				if (laserInCollision) {
					this._increaseScore(a.getPoints());
					a.destroy(true);
					laserInCollision.destroy();
					this.laserObjects = this.laserObjects.filter(l => l.isActive());
				} else {
					a.onGameTick();
					if (this._checkShipCollisionWithAsteroid(a)) {
						// asteroid collided with player ship after moving
						a.destroy(true);
						this._gameOver();
					}
				}
			}
		});

		this._cleanUpInactiveObjects();
		this._checkScore();
	}

	_cleanUpInactiveObjects() {
		this.asteroidsObjects = this.asteroidsObjects.filter(a => a.isActive());
		this.laserObjects = this.laserObjects.filter(l => l.isActive());
	}
	
	_checkShipCollisionWithAsteroid(asteroid) {
		const shipColisionArea = this.ship.getCollisionArea();
		const offset = (this._debugMode) ? -4 : 4;
		return asteroid
			.isWithinBoundaries(
				shipColisionArea.x1 + offset,
				shipColisionArea.y1 + offset,
				shipColisionArea.x2 - offset,
				shipColisionArea.y2 - offset
			);
	}

	_getLaserInArea(boundingBox) {
		return this.laserObjects
		.filter(l => l.isActive())
		.find(l => l.isWithinBoundaries(boundingBox.x1, boundingBox.y1, boundingBox.x2, boundingBox.y2));
	}
	
	_isAsteroidInGameViewport(asteroid) {
		return asteroid.isWithinBoundaries(-10, -10, this.dimensions.w+10, this.dimensions.h+10);
	}

    registerEvents() {
        $(document).on('keydown', this.onKeyDown.bind(this));
		$(document).on('keyup', this.onKeyUp.bind(this));
    }
	
	start() {
		this._removeLoadingModal();
        this.registerEvents();
	}
	
	_startNewGame() {
		this.ship._$element.removeClass('hidden');
		this._removeIntroModal();
		this._firstRun = false;
		this._run();
	}

    _run() {
        this.ship.moveCenteredToXY(this.dimensions.center.x, this.dimensions.center.y);
		this._isRunning = true;
		this._updateScoreView();
		this._asteroidGenerator.run();
		
        this._mainLoopInterval = setInterval(() => {
			if (!this._isRunning) {
				return;
			}
            if (this.onNextTick) {
                this.onNextTick();
                this.onNextTick = null;
            }
            this.onTick();
        }, Game.FPS);
    }
	
	_stopGame() {
		this._isRunning = false;
		this._asteroidGenerator.destroy();
		clearInterval(this._mainLoopInterval);
	}
	
	_resetGame() {
		this.asteroidsObjects.forEach( a => a.destroy());
		this.laserObjects.forEach( l => l.destroy());
		this.laserObjects = [];
		this.asteroidsObjects = [];
		this._removeGameOverModal();
		this._score = 0;
		this.ship.show();
		this._run();
	}
	
	_gameOver() {
		this._stopGame();
		this.ship._$element.addClass('exploding');
		setTimeout( () => {			
			this.ship._$element.removeClass('exploding');
			this.ship.hide();
			$(ELEMENT_SELECTORS.ASSETS).find(ELEMENT_SELECTORS.GAME_OVER_MODAL).clone().removeClass('hidden').appendTo(this._$element);
		}, 500);
	}
	
	_checkScore() {
		if (this._score >= Game.maxScore) {
			this._stopGame();
			$(ELEMENT_SELECTORS.ASSETS).find(ELEMENT_SELECTORS.GAME_WIN_MODAL).clone().removeClass('hidden').appendTo(this._$element);
		}
	}
	
	_removeLoadingModal() {
		this._$element.find(ELEMENT_SELECTORS.GAME_LOADING_MODAL).remove();
	}
	
	_removeGameOverModal() {
		this._$element.find(ELEMENT_SELECTORS.GAME_OVER_MODAL).remove();
	}
	
	_removeIntroModal() {
		$(ELEMENT_SELECTORS.MAIN).find(ELEMENT_SELECTORS.GAME_INTRO_MODAL).remove();
	}

	/**
	 * returns an object to create the next laser shoot
	 *  - horizontal and vertical directions
	 */
    _getShotDirection(deg) {
        let direction;
        switch (deg) {
            case 0:
                direction = { h:0, v: -1};
                break;
            case 45:
                direction = { h: 1, v: -1};
                break;
            case 90:
                direction = { h:1, v: 0};
                break;
            case 135:
                direction = { h:1, v: 1};
                break;
            case 180:
            case -180:
                direction = { h:0, v: 1};
                break;
            case -135:
                direction = { h:-1, v: 1};
                break;
            case -90:
                direction = { h:-1, v: 0};
                break;
            case -45:
                direction = { h:-1, v: -1};
                break;				
            default:
                throw new Error(`Invalid degree ${deg}`);
        }
        
        return direction;
    }

    onShoot() {
		this._isLaserBusy = true;
        const p = this.ship.getLaserPoint();
        const deg = this.ship.getRotation();
        
        // get laser shoot angle:
        const sx = this.ship.getX();
        const sy = this.ship.getX();        
        const dir = this._getShotDirection(deg);
        
        const laser = Laser.createOnXY(p.x, p.y, deg, dir.h, dir.v);
		this.addLaser(laser);
    }

    onKeyDown({type, which}) {
        if (this._debugMode) {
			console.log(`${type}: ${which}`);
		}
		
		if (!this._isRunning) {
			if (this._firstRun && which === Game.keycodes.n) {
				this._startNewGame();
			} else if (which === Game.keycodes.r) {
				this._resetGame();
			}
			return;
		}
		
        switch (which) {
            case Game.keycodes.left:
                this.ship.rotateCounterClockwise();
                break;
            case Game.keycodes.right:
                this.ship.rotateClockwise();
                break;
			case Game.keycodes.up:
				this.ship.advance();
				break;
            case Game.keycodes.ctrl:
			case Game.keycodes.shift:
			case Game.keycodes.space:
				if (!this._isLaserBusy) {
					this.onNextTick = this.onShoot();
				}
                break;
			case Game.keycodes.d:
				this._toggleDebugMode();
				break;
			case Game.keycodes.o:
				this._toggleOldschoolStyle();
				break;
            default:
                break;
        }
    }
	
	onKeyUp({type, which}) {
		if (this._debugMode) {
			console.log(`${type}: ${which}`);
		}
        switch (which) {
			case Game.keycodes.ctrl:
			case Game.keycodes.shift:
			case Game.keycodes.space:
				this._isLaserBusy = false;
				break;
		}
	}
	
	/**
	 * game playable area used for destroying stuff that leaves viewport
	 */
	getGameBoundaries() {
		return {
			x1: 0,
			y1: 0,
			x2:	this.dimensions.w,
			y2: this.dimensions.h
		}
	}
	
	_toggleDebugMode() {
		this._debugMode = !this._debugMode;
		if (this._debugMode) {
			this._$element.find(ELEMENT_SELECTORS.DEBUGGEABLE).addClass('debug');
		} else {
			this._$element.find(ELEMENT_SELECTORS.DEBUGGEABLE).removeClass('debug');
		}
	}
	
	_toggleOldschoolStyle() {
		this.asteroidsObjects.forEach( a => a._$element.toggleClass('asteroid--retro'));
		this.ship._$element.toggleClass('ship--retro');
		$(ELEMENT_SELECTORS.ASTEROID).toggleClass('asteroid--retro');
		this.laserObjects.forEach( l => l._$element.toggleClass('laser--retro'));
		$(ELEMENT_SELECTORS.LASER).toggleClass('laser--retro');
		$(ELEMENT_SELECTORS.SUN).toggleClass('sun--retro');
	}
	
}

Game.keycodes = {
    left: 37,
    right: 39,
	up: 38,
	down: 40,
	shift: 16,
	ctrl: 17,
    space: 32,
	d: 68,
	n: 78,
	o: 79,
	r: 82
}

Game.FPS = 1000 / 60;
Game.maxAsteroids = 8;
Game.maxScore = 99999999;

class Asteroid extends GameObject {
	
	constructor(
		$element,
		x,
		y,
		direction,
		velocity = 2,
		width = 48,
		height = 48
	) {
		super($element, width, height);
		this._initial = {
			x,
			y,
			direction
		}
		this.moveToXY(x,y);
		this._velocity = velocity;
	}
	
    _step() {
        const d = this._initial.direction;
        const nextX = this.getX() + (d.horizontal * this._velocity);
        const nextY = this.getY() + (d.vertical * this._velocity);
        this.moveToXY(nextX, nextY);
    }
	
	getPoints() {
		return 100 * this._velocity * ((Asteroid.maxSize - this._width) || 1);
	}
	
	/**
	 * @overrides
	 */
	destroy(animate) {
		if (animate) {
			this._destroy();
			this._$element.addClass('exploding');
			setTimeout( () => this._removeElement(), 500);
		} else {
			super.destroy();
		}
	}

}

Asteroid.minSize = 40;
Asteroid.maxSize = 80;

class AsteroidGenerator {
	
	constructor(
		game,
		intervalTime = 500		
	) {
		this._intervalTime = intervalTime;
		this._intervalRef = null;
		this._game = game;
		this._$asteroidAsset = $(ELEMENT_SELECTORS.ASTEROID);
	}
	
	/**
	 * @unused
	 */
	_generateFixedSizeAsteroid() {
		const size = 48;		
		const elem = this._$asteroidAsset.clone().removeClass('hidden');
		const params = this.getNextAsteroidPositionAndDirection();
		const velocity = getRandomInt(1,10);
		return new Asteroid(elem, params.x, params.y, params.direction, velocity, size, size);
	}
	
	_generateAsteroid() {
		const size = getRandomInt(Asteroid.minSize, Asteroid.maxSize);
		const $elem = this._$asteroidAsset.clone().removeClass('hidden').css({
			width: `${size}px`,
			height: `${size}px`			
		});
		const params = this.getNextAsteroidPositionAndDirection();
		const velocity = getRandomInt(1,10);
		return new Asteroid($elem, params.x, params.y, params.direction, velocity, size, size);
	}
	
	getNextAsteroidPositionAndDirection() {
		const p = getRandom() > 0.5;
		const q = getRandom() > 0.5;
		let x, y, v, h;
		if( p ) {
			x = getRandomInt(0, this._game.dimensions.w);
			h = (x > (this._game.dimensions.w * 0.5)) ? -1 : 1;
			if (q) {
				y = 0;
				// from top, moving down				
				v = 1;				
			} else {
				y = this._game.dimensions.h;
				// moving up
				v = -1;
			}		
		} else {
			y = getRandomInt(0, this._game.dimensions.h);
			v = (y > (this._game.dimensions.h * 0.5)) ? -1 : 1;
			if (q) {
				// moving right
				x = 0;
				h = 1;
			} else {
				// moving left
				x = this._game.dimensions.w;
				h = -1;
			}			
		}
		return {
			x,
			y,
			direction: {
				vertical: v,
				horizontal: h
			}
		}
	}
	
	run() {		
		this._intervalRef = setInterval(() => {
			if (this._game.canAddAsteroid()) {
				this.addAsteroid();
			}
		}, this._intervalTime);
	}
	
	addAsteroid() {
		const asteroid = this._generateAsteroid();
		this._game.addAsteroid(asteroid);
	}
	
	destroy() {
		clearInterval(this._intervalRef);
		this._intervalRef = null;
	}
}

function onLoad() {
    const game = new Game(window);
	game.start();
}

window.addEventListener('load', onLoad);
