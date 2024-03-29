function main() {
    var canvas;
    var context;
    var game;
    var canvas_walls, context_walls;
    var inky, blinky, clyde, pinky;
    var mapConfig = "data/map.json";


    function buildWall(context,gridX,gridY,width,height) {
        console.log("BuildWall");
        width = width*2-1;
        height = height*2-1;
        context.fillRect(pacman.radius/2+gridX*2*pacman.radius,pacman.radius/2+gridY*2*pacman.radius, width*pacman.radius, height*pacman.radius);
    }

    function between(x, min, max) {
        return x >= min && x <= max;
    }

    function Timer() {
        this.time_diff = 0;
        this.time_start = 0;
        this.time_stop = 0;
        this.start = function() {
            this.time_start = new Date().getTime();
        };
        this.stop = function() {
            this.time_stop = new Date().getTime();
            this.time_diff += this.time_stop - this.time_start;
            this.time_stop = 0;
            this.time_start = 0;
        };
        this.reset = function() {
            this.time_diff = 0;
            this.time_start = 0;
            this.time_stop = 0;
        };
        this.get_time_diff = function() {
            return this.time_diff;
        }
    }

    function Game() {
        this.timer = new Timer();
        this.refreshRate = 33;
        this.running = false;
        this.pause = true;
        this.score = new Score();
        this.map;
        this.pillCount;
        this.monsters;
        this.level = 1;
        this.refreshLevel = function(h) {
            $(h).html("Lvl: "+this.level);
        };
        this.gameOver = false;
        this.canvas = $("#myCanvas").get(0);
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.pillSize = 3;
        this.powerpillSizeMax = 6;


        this.ghostFrightened = false;
        this.ghostFrightenedTimer = 240;
        this.ghostMode = 0;
        this.ghostModeTimer = 200;
        this.ghostSpeedNormal = (this.level > 4 ? 3 : 2);
        this.ghostSpeedDazzled = 2;

        this.startGhostFrightened = function() {
            console.log("ghost frigthened");
            this.ghostFrightened = true;
            this.ghostFrightenedTimer = 240;
            inky.dazzle();
            pinky.dazzle();
            blinky.dazzle();
            clyde.dazzle();
        };

        this.endGhostFrightened = function() {
            console.log("ghost frigthened end");
            this.ghostFrightened = false;
            inky.undazzle();
            pinky.undazzle();
            blinky.undazzle();
            clyde.undazzle();
        };


        this.checkGhostMode = function() {
            if (this.ghostFrightened) {

                this.ghostFrightenedTimer--;
                if (this.ghostFrightenedTimer === 0) {
                    this.endGhostFrightened();
                    this.ghostFrigthenedTimer = 240;
                }
            }
            this.ghostModeTimer--;
            if (this.ghostModeTimer === 0 && game.level > 1) {
                this.ghostMode ^= 1;
                this.ghostModeTimer = 200 + this.ghostMode * 450;
                console.log("ghostMode=" + this.ghostMode);

                game.buildWalls();

                inky.reverseDirection();
                pinky.reverseDirection();
                clyde.reverseDirection();
                blinky.reverseDirection();
            }
        };

        this.getMapContent = function (x, y) {
            var maxX = game.width / 30 -1;
            var maxY = game.height / 30 -1;
            if (x < 0) x = maxX + x;
            if (x > maxX) x = x-maxX;
            if (y < 0) y = maxY + y;
            if (y > maxY) y = y-maxY;
            return this.map.posY[y].posX[x].type;
        };

        this.setMapContent = function (x,y,val) {
            this.map.posY[y].posX[x].type = val;
        };



        this.reset = function() {
        };

        this.newGame = function() {
            var r = confirm("Are you sure you want to restart?");
            if (r) {
                console.log("new Game");
                this.init(0);
                this.pauseResume();
            }
        };

        this.nextLevel = function() {
            this.level++;
            console.log("Level "+game.level);
            game.showMessage("Level "+game.level, this.getLevelTitle() + "<br/>(Click to continue!)");
            game.refreshLevel(".level");
            this.init(1);
        };

        this.drawHearts = function (count) {
            var html = "";
            for (var i = 0; i<count; i++) {
                html += " <img src='img/heart.png'>";
            }
            $(".lives").html("Lives: "+html);

        };

        this.showContent = function (id) {
            $('.content').hide();
            $('#'+id).show();
        };

        this.getLevelTitle = function() {
            switch(this.level) {
                case 2:
                    return '"The chase begins"';
                case 3:
                    return '"Inky awakening"';
                case 4:
                    return '"Clyde awakening"';
                case 5:
                    return '"need for speed"';
                case 6:
                    return '"hunting season 1"';
                case 7:
                    return '"the big calm"';
                case 8:
                    return '"hunting season 2"';
                case 9:
                    return '"ghosts on speed"';
                default:
                    return '"nothing new"';
            }
        };

        this.showMessage = function(title, text) {
            this.timer.stop();
            this.pause = true;
            $('#canvas-overlay-container').fadeIn(200);
            if ($('.controls').css('display') != "none") $('.controls').slideToggle(200);
            $('#canvas-overlay-content #title').text(title);
            $('#canvas-overlay-content #text').html(text);
        };

        this.closeMessage = function() {
            $('#canvas-overlay-container').fadeOut(200);
            $('.controls').slideToggle(200);
        };

        this.pauseResume = function () {
            if (!this.running) {
                this.timer.start();
                this.pause = false;
                this.running = true;
                this.closeMessage();
                animationLoop();
            }
            else if (this.pause) {
                this.timer.stop();
                this.pause = false;
                this.closeMessage();
            }
            else {
                this.showMessage("Pause","Click to Resume");
            }
        };

        this.init = function (state) {

            console.log("init game "+state);

            if( state === 0 ) {
                this.timer.reset();
            }
            $.ajax({
                url: mapConfig,
                async: false,
                beforeSend: function(xhr){
                    if (xhr.overrideMimeType) xhr.overrideMimeType("application/json");
                },
                dataType: "json",
                success: function (data) {
                    game.map =  data;
                }
            });

            var temp = 0;
            $.each(this.map.posY, function(i, item) {
                $.each(this.posX, function() {
                    if (this.type == "pill") {
                        temp++;
                    }
                });
            });

            this.pillCount = temp;

            if (state === 0) {
                this.score.set(0);
                this.score.refresh(".score");
                pacman.lives = 3;
                game.level = 1;
                this.refreshLevel(".level");
                game.gameOver = false;
            }
            pacman.reset();

            game.drawHearts(pacman.lives);

            this.ghostFrightened = false;
            this.ghostFrightenedTimer = 240;
            this.ghostMode = 0;
            this.ghostModeTimer = 200;
            if (pinky === null || pinky === undefined) {
                pinky = new Ghost("pinky",7,5,'img/pinky.svg',2,2);
                inky = new Ghost("inky",8,5,'img/inky.svg',13,11);
                blinky = new Ghost("blinky",9,5,'img/blinky.svg',13,0);
                clyde = new Ghost("clyde",10,5,'img/clyde.svg',2,11);
            }
            else {
                pinky.reset();
                inky.reset();
                blinky.reset();
                clyde.reset();
            }
            blinky.start();
            inky.start();
            pinky.start();
            clyde.start();
        };

        this.check = function() {
            if ((this.pillCount === 0) && game.running) {
                this.nextLevel();
            }
        };

        this.win = function () {};
        this.gameover = function () {};

        this.toPixelPos = function (gridPos) {
            return gridPos*30;
        };

        this.toGridPos = function (pixelPos) {
            return ((pixelPos % 30)/30);
        };

        this.buildWalls = function() {
            if (this.ghostMode === 0) game.wallColor = "Blue";
            else game.wallColor = "Red";
            canvas_walls = document.createElement('canvas');
            canvas_walls.width = game.canvas.width;
            canvas_walls.height = game.canvas.height;
            context_walls = canvas_walls.getContext("2d");

            context_walls.fillStyle = game.wallColor;
            context_walls.strokeStyle = game.wallColor;
            buildWall(context_walls,0,0,18,1);
            buildWall(context_walls,0,12,18,1);
            buildWall(context_walls,0,0,1,6);
            buildWall(context_walls,0,7,1,6);
            buildWall(context_walls,17,0,1,6);
            buildWall(context_walls,17,7,1,6);
            buildWall(context_walls,7,4,1,1);
            buildWall(context_walls,6,5,1,2);
            buildWall(context_walls,10,4,1,1);
            buildWall(context_walls,11,5,1,2);
            buildWall(context_walls,6,6,6,1);
            context_walls.fillRect(8*2*pacman.radius,pacman.radius/2+4*2*pacman.radius+5, 4*pacman.radius, 1);
            buildWall(context_walls,4,0,1,2);
            buildWall(context_walls,13,0,1,2);

            buildWall(context_walls,2,2,1,2);
            buildWall(context_walls,6,2,2,1);
            buildWall(context_walls,15,2,1,2);
            buildWall(context_walls,10,2,2,1);

            buildWall(context_walls,2,3,2,1);
            buildWall(context_walls,14,3,2,1);
            buildWall(context_walls,5,3,1,1);
            buildWall(context_walls,12,3,1,1);
            buildWall(context_walls,3,3,1,3);
            buildWall(context_walls,14,3,1,3);

            buildWall(context_walls,3,4,1,1);
            buildWall(context_walls,14,4,1,1);

            buildWall(context_walls,0,5,2,1);
            buildWall(context_walls,3,5,2,1);
            buildWall(context_walls,16,5,2,1);
            buildWall(context_walls,13,5,2,1);

            buildWall(context_walls,0,7,2,2);
            buildWall(context_walls,16,7,2,2);
            buildWall(context_walls,3,7,2,2);
            buildWall(context_walls,13,7,2,2);

            buildWall(context_walls,4,8,2,2);
            buildWall(context_walls,12,8,2,2);
            buildWall(context_walls,5,8,3,1);
            buildWall(context_walls,10,8,3,1);

            buildWall(context_walls,2,10,1,1);
            buildWall(context_walls,15,10,1,1);
            buildWall(context_walls,7,10,4,1);
            buildWall(context_walls,4,11,2,2);
            buildWall(context_walls,12,11,2,2);
        };

    }

    game = new Game();


    function Score() {
        this.score = 0;
        this.set = function(i) {
            this.score = i;
        };
        this.add = function(i) {
            this.score += i;
        };
        this.refresh = function(h) {
            $(h).html("Score: "+this.score);
        };

    }

    function Direction(name,angle1,angle2,dirX,dirY) {
        this.name = name;
        this.angle1 = angle1;
        this.angle2 = angle2;
        this.dirX = dirX;
        this.dirY = dirY;
        this.equals = function(dir) {
            return  JSON.stringify(this) ==  JSON.stringify(dir);
        };
    }

    var up = new Direction("up",1.75,1.25,0,-1);
    var left = new Direction("left",1.25,0.75,-1,0);
    var down = new Direction("down",0.75,0.25,0,1);
    var right = new Direction("right",0.25,1.75,1,0);
    function directionWatcher() {
        this.dir = null;
        this.set = function(dir) {
            this.dir = dir;
        };
        this.get = function() {
            return this.dir;
        };
    }
    function Ghost(name, gridPosX, gridPosY, image, gridBaseX, gridBaseY) {
        this.name = name;
        this.posX = gridPosX * 30;
        this.posY = gridPosY * 30;
        this.startPosX = gridPosX * 30;
        this.startPosY = gridPosY * 30;
        this.gridBaseX = gridBaseX;
        this.gridBaseY = gridBaseY;
        this.speed = game.ghostSpeedNormal;
        this.images = JSON.parse(
            '{"normal" : {'
            + '"inky" : "0",'
            + '"pinky" : "1",'
            + '"blinky" : "2",'
            + '"clyde" : "3"'
            + '},'
            +
            '"frightened1" : {'
            +
            '"left" : "", "up": "", "right" : "", "down": ""},'
            +
            '"frightened2" : {'
            +
            '"left" : "", "up": "", "right" : "", "down": ""},'
            +
            '"dead" : {'
            +
            '"left" : "", "up": "", "right" : "", "down": ""}}'
        );
        this.image = new Image();
        this.image.src = image;
        this.ghostHouse = true;
        this.dazzled = false;
        this.dead = false;
        this.dazzle = function() {
            this.changeSpeed(game.ghostSpeedDazzled);
            if (this.posX > 0) this.posX = this.posX - this.posX % this.speed;
            if (this.posY > 0) this.posY = this.posY - this.posY % this.speed;
            this.dazzled = true;
        };
        this.undazzle = function() {
            if (!this.dead) this.changeSpeed(game.ghostSpeedNormal);
            if (this.posX > 0) this.posX = this.posX - this.posX % this.speed;
            if (this.posY > 0) this.posY = this.posY - this.posY % this.speed;
            this.dazzled = false;
        };
        this.dazzleImg = new Image();
        this.dazzleImg.src = 'img/dazzled.svg';
        this.dazzleImg2 = new Image();
        this.dazzleImg2.src = 'img/dazzled2.svg';
        this.deadImg = new Image();
        this.deadImg.src = 'img/dead.svg';
        this.direction = right;
        this.radius = pacman.radius;
        this.draw = function (context) {
            if (this.dead) {
                context.drawImage(this.deadImg, this.posX, this.posY, 2*this.radius, 2*this.radius);
            }
            else if (this.dazzled) {
                if (pacman.beastModeTimer < 50 && pacman.beastModeTimer % 8 > 1) {
                    context.drawImage(this.dazzleImg2, this.posX, this.posY, 2*this.radius, 2*this.radius);
                } else {
                    context.drawImage(this.dazzleImg, this.posX, this.posY, 2*this.radius, 2*this.radius);
                }
            }
            else context.drawImage(this.image, this.posX, this.posY, 2*this.radius, 2*this.radius);
        };
        this.getCenterX = function () {
            return this.posX+this.radius;
        };
        this.getCenterY = function () {
            return this.posY+this.radius;
        };

        this.reset = function() {
            this.dead = false;
            this.posX = this.startPosX;
            this.posY = this.startPosY;
            this.ghostHouse = true;
            this.undazzle();
        };

        this.die = function() {
            if (!this.dead) {
                game.score.add(100);
                this.dead = true;
                this.changeSpeed(game.ghostSpeedNormal);
            }
        };
        this.changeSpeed = function(s) {
            this.posX = Math.round(this.posX / s) * s;
            this.posY = Math.round(this.posY / s) * s;
            this.speed = s;
        };

        this.move = function() {

            this.checkDirectionChange();
            this.checkCollision();

            if (this.ghostHouse == true) {

                if (this.name == "clyde") {
                    if ((game.level < 4) || ((game.pillCount > 104/3))) this.stop = true;
                    else this.stop = false;
                }
                if (this.name == "inky") {
                    if ((game.level < 3) || ((game.pillCount > 104-30))) this.stop = true;
                    else this.stop = false;
                }

                if ((this.getGridPosY() == 5) && this.inGrid()) {
                    if ((this.getGridPosX() == 7)) this.setDirection(right);
                    if ((this.getGridPosX() == 8) || this.getGridPosX() == 9) this.setDirection(up);
                    if ((this.getGridPosX() == 10)) this.setDirection(left);
                }
                if ((this.getGridPosY() == 4) && ((this.getGridPosX() == 8) || (this.getGridPosX() == 9)) && this.inGrid()) {
                    console.log("ghosthouse -> false");
                    this.ghostHouse = false;
                }
            }

            if (!this.stop) {
                // Move
                this.posX += this.speed * this.dirX;
                this.posY += this.speed * this.dirY;

                // Check if out of canvas
                if (this.posX >= game.width-this.radius) this.posX = this.speed-this.radius;
                if (this.posX <= 0-this.radius) this.posX = game.width-this.speed-this.radius;
                if (this.posY >= game.height-this.radius) this.posY = this.speed-this.radius;
                if (this.posY <= 0-this.radius) this.posY = game.height-this.speed-this.radius;
            }
        };

        this.checkCollision = function() {
            if (this.dead && (this.getGridPosX() == this.startPosX /30) && (this.getGridPosY() == this.startPosY / 30)) this.reset();
            else {
                if ((between(pacman.getCenterX(), this.getCenterX()-10, this.getCenterX()+10))
                    && (between(pacman.getCenterY(), this.getCenterY()-10, this.getCenterY()+10)))
                {
                    if ((!this.dazzled) && (!this.dead)) {
                        pacman.die();
                    }
                    else {
                        this.die();
                    }
                }
            }
        };

        this.getNextDirection = function() {
            var pX = this.getGridPosX();
            var pY= this.getGridPosY();
            game.getMapContent(pX,pY);
            var u, d, r, l;
            if (this.dead) {
                var tX = this.startPosX / 30;
                var tY = this.startPosY / 30;
            }
            else if (game.ghostMode == 0) {
                var tX = this.gridBaseX;
                var tY = this.gridBaseY;
            } else if (game.ghostMode == 1) {

                switch (this.name) {
                    case "pinky":
                        var pdir = pacman.direction;
                        var pdirX = pdir.dirX == 0 ? - pdir.dirY : pdir.dirX;
                        var pdirY = pdir.dirY == 0 ? - pdir.dirX : pdir.dirY;

                        var tX = (pacman.getGridPosX() + pdirX*4) % (game.width / pacman.radius +1);
                        var tY = (pacman.getGridPosY() + pdirY*4) % (game.height / pacman.radius +1);
                        break;

                    case "blinky":
                        var tX = pacman.getGridPosX();
                        var tY = pacman.getGridPosY();
                        break;


                    case "inky":
                        var tX = pacman.getGridPosX() + 2*pacman.direction.dirX;
                        var tY = pacman.getGridPosY() + 2*pacman.direction.dirY;
                        var vX = tX - blinky.getGridPosX();
                        var vY = tY - blinky.getGridPosY();
                        tX = Math.abs(blinky.getGridPosX() + vX*2);
                        tY = Math.abs(blinky.getGridPosY() + vY*2);
                        break;

                    case "clyde":
                        var tX = pacman.getGridPosX();
                        var tY = pacman.getGridPosY();
                        var dist = Math.sqrt(Math.pow((pX-tX),2) + Math.pow((pY - tY),2));

                        if (dist < 5) {
                            tX = this.gridBaseX;
                            tY = this.gridBaseY;
                        }
                        break;

                }
            }


            var oppDir = this.getOppositeDirection();

            var dirs = [{},{},{},{}];
            dirs[0].field = game.getMapContent(pX,pY-1);
            dirs[0].dir = up;
            dirs[0].distance = Math.sqrt(Math.pow((pX-tX),2) + Math.pow((pY -1 - tY),2));

            dirs[1].field = game.getMapContent(pX,pY+1);
            dirs[1].dir = down;
            dirs[1].distance = Math.sqrt(Math.pow((pX-tX),2) + Math.pow((pY+1 - tY),2));

            dirs[2].field = game.getMapContent(pX+1,pY);
            dirs[2].dir = right;
            dirs[2].distance = Math.sqrt(Math.pow((pX+1-tX),2) + Math.pow((pY - tY),2));

            dirs[3].field = game.getMapContent(pX-1,pY);
            dirs[3].dir = left;
            dirs[3].distance = Math.sqrt(Math.pow((pX-1-tX),2) + Math.pow((pY - tY),2));
            function compare(a,b) {
                if (a.distance < b.distance)
                    return -1;
                if (a.distance > b.distance)
                    return 1;
                return 0;
            }
            var dirs2 = dirs.sort(compare);

            var r = this.dir;
            var j;

            if (this.dead) {
                for (var i = dirs2.length-1; i >= 0; i--) {
                    if ((dirs2[i].field != "wall") && !(dirs2[i].dir.equals(this.getOppositeDirection()))) {
                        r = dirs2[i].dir;
                    }
                }
            }
            else {
                for (var i = dirs2.length-1; i >= 0; i--) {
                    if ((dirs2[i].field != "wall") && (dirs2[i].field != "door") && !(dirs2[i].dir.equals(this.getOppositeDirection()))) {
                        r = dirs2[i].dir;
                    }
                }
            }
            this.directionWatcher.set(r);
            return r;
        };
        this.setRandomDirection = function() {
            var dir = Math.floor((Math.random()*10)+1)%5;

            switch(dir) {
                case 1:
                    if (this.getOppositeDirection().equals(up)) this.setDirection(down);
                    else this.setDirection(up);
                    break;
                case 2:
                    if (this.getOppositeDirection().equals(down)) this.setDirection(up);
                    else this.setDirection(down);
                    break;
                case 3:
                    if (this.getOppositeDirection().equals(right)) this.setDirection(left);
                    else this.setDirection(right);
                    break;
                case 4:
                    if (this.getOppositeDirection().equals(left)) this.setDirection(right);
                    else this.setDirection(left);
                    break;
            }
        };
        this.reverseDirection = function() {
            console.log("reverseDirection: "+this.direction.name+" to "+this.getOppositeDirection().name);
            this.directionWatcher.set(this.getOppositeDirection());
        }

    }

    Ghost.prototype = new Figure();
    function Figure() {
        this.posX;
        this.posY;
        this.speed;
        this.dirX = right.dirX;
        this.dirY = right.dirY;
        this.direction;
        this.stop = true;
        this.directionWatcher = new directionWatcher();
        this.getNextDirection = function() { console.log("Figure getNextDirection");};
        this.checkDirectionChange = function() {
            if (this.inGrid() && (this.directionWatcher.get() == null)) this.getNextDirection();
            if ((this.directionWatcher.get() != null) && this.inGrid()) {
                this.setDirection(this.directionWatcher.get());
                this.directionWatcher.set(null);
            }

        };


        this.inGrid = function() {
            if((this.posX % (2*this.radius) === 0) && (this.posY % (2*this.radius) === 0)) return true;
            return false;
        };
        this.getOppositeDirection = function() {
            if (this.direction.equals(up)) return down;
            else if (this.direction.equals(down)) return up;
            else if (this.direction.equals(right)) return left;
            else if (this.direction.equals(left)) return right;
        };
        this.move = function() {

            if (!this.stop) {
                this.posX += this.speed * this.dirX;
                this.posY += this.speed * this.dirY;
                if (this.posX >= game.width-this.radius) this.posX = this.speed-this.radius;
                if (this.posX <= 0-this.radius) this.posX = game.width-this.speed-this.radius;
                if (this.posY >= game.height-this.radius) this.posY = this.speed-this.radius;
                if (this.posY <= 0-this.radius) this.posY = game.height-this.speed-this.radius;
            }
        };
        this.stop = function() { this.stop = true;};
        this.start = function() { this.stop = false;};

        this.getGridPosX = function() {
            return (this.posX - (this.posX % 30))/30;
        };
        this.getGridPosY = function() {
            return (this.posY - (this.posY % 30))/30;
        };
        this.setDirection = function(dir) {
            this.dirX = dir.dirX;
            this.dirY = dir.dirY;
            this.angle1 = dir.angle1;
            this.angle2 = dir.angle2;
            this.direction = dir;
        };
        this.setPosition = function(x, y) {
            this.posX = x;
            this.posY = y;
        }
    }

    function pacman() {
        this.radius = 15;
        this.posX = 0;
        this.posY = 6*2*this.radius;
        this.speed = 5;
        this.angle1 = 0.25;
        this.angle2 = 1.75;
        this.mouth = 1;
        this.dirX = right.dirX;
        this.dirY = right.dirY;
        this.lives = 3;
        this.stuckX = 0;
        this.stuckY = 0;
        this.frozen = false;
        this.freeze = function () {
            this.frozen = true;
        };
        this.unfreeze = function() {
            this.frozen = false;
        };
        this.getCenterX = function () {
            return this.posX+this.radius;
        };
        this.getCenterY = function () {
            return this.posY+this.radius;
        };
        this.directionWatcher = new directionWatcher();

        this.direction = right;

        this.beastMode = false;
        this.beastModeTimer = 0;

        this.checkCollisions = function () {

            if ((this.stuckX == 0) && (this.stuckY == 0) && this.frozen == false) {

                var gridX = this.getGridPosX();
                var gridY = this.getGridPosY();
                var gridAheadX = gridX;
                var gridAheadY = gridY;

                var field = game.getMapContent(gridX, gridY);

                if ((this.dirX == 1) && (gridAheadX < 17)) gridAheadX += 1;
                if ((this.dirY == 1) && (gridAheadY < 12)) gridAheadY += 1;
                var fieldAhead = game.getMapContent(gridAheadX, gridAheadY);

                if ((field === "pill") || (field === "powerpill")) {
                    if (
                        ((this.dirX == 1) && (between(this.posX, game.toPixelPos(gridX)+this.radius-5, game.toPixelPos(gridX+1))))
                        || ((this.dirX == -1) && (between(this.posX, game.toPixelPos(gridX), game.toPixelPos(gridX)+5)))
                        || ((this.dirY == 1) && (between(this.posY, game.toPixelPos(gridY)+this.radius-5, game.toPixelPos(gridY+1))))
                        || ((this.dirY == -1) && (between(this.posY, game.toPixelPos(gridY), game.toPixelPos(gridY)+5)))
                        || (fieldAhead === "wall")
                    )
                    {	var s;
                        if (field === "powerpill") {
                            s = 50;
                            this.enableBeastMode();
                            game.startGhostFrightened();
                        }
                        else {
                            s = 10;
                            game.pillCount--;
                        }
                        game.map.posY[gridY].posX[gridX].type = "null";
                        game.score.add(s);
                    }
                }

                if ((fieldAhead === "wall") || (fieldAhead === "door")) {
                    this.stuckX = this.dirX;
                    this.stuckY = this.dirY;
                    pacman.stop();
                    if ((this.stuckX == 1) && ((this.posX % 2*this.radius) != 0)) this.posX -= 5;
                    if ((this.stuckY == 1) && ((this.posY % 2*this.radius) != 0)) this.posY -= 5;
                    if (this.stuckX == -1) this.posX += 5;
                    if (this.stuckY == -1) this.posY += 5;
                }

            }
        };
        this.checkDirectionChange = function() {
            if (this.directionWatcher.get() != null) {

                if ((this.stuckX == 1) && this.directionWatcher.get() == right) this.directionWatcher.set(null);
                else {
                    this.stuckX = 0;
                    this.stuckY = 0;

                    if ((this.inGrid())) {
                        console.log("x: "+this.getGridPosX()+" + "+this.directionWatcher.get().dirX);
                        console.log("y: "+this.getGridPosY()+" + "+this.directionWatcher.get().dirY);
                        var x = this.getGridPosX()+this.directionWatcher.get().dirX;
                        var y = this.getGridPosY()+this.directionWatcher.get().dirY;
                        if (x <= -1) x = game.width/(this.radius*2)-1;
                        if (x >= game.width/(this.radius*2)) x = 0;
                        if (y <= -1) x = game.height/(this.radius*2)-1;
                        if (y >= game.heigth/(this.radius*2)) y = 0;

                        console.log("x: "+x);
                        console.log("y: "+y);
                        var nextTile = game.map.posY[y].posX[x].type;
                        console.log("checkNextTile: "+nextTile);

                        if (nextTile != "wall") {
                            this.setDirection(this.directionWatcher.get());
                            this.directionWatcher.set(null);
                        }
                    }
                }
            }
        };
        this.setDirection = function(dir) {
            if (!this.frozen) {
                this.dirX = dir.dirX;
                this.dirY = dir.dirY;
                this.angle1 = dir.angle1;
                this.angle2 = dir.angle2;
                this.direction = dir;
            }
        };
        this.enableBeastMode = function() {
            this.beastMode = true;
            this.beastModeTimer = 240;
            inky.dazzle();
            pinky.dazzle();
            blinky.dazzle();
            clyde.dazzle();
        };
        this.disableBeastMode = function() {
            this.beastMode = false;
            inky.undazzle();
            pinky.undazzle();
            blinky.undazzle();
            clyde.undazzle();
        };
        this.move = function() {

            if (!this.frozen) {
                if (this.beastModeTimer > 0) {
                    this.beastModeTimer--;
                }
                if ((this.beastModeTimer == 0) && (this.beastMode == true)) this.disableBeastMode();

                this.posX += this.speed * this.dirX;
                this.posY += this.speed * this.dirY;
                if (this.posX >= game.width-this.radius) this.posX = 5-this.radius;
                if (this.posX <= 0-this.radius) this.posX = game.width-5-this.radius;
                if (this.posY >= game.height-this.radius) this.posY = 5-this.radius;
                if (this.posY <= 0-this.radius) this.posY = game.height-5-this.radius;
            }
            else this.dieAnimation();
        };

        this.eat = function () {

            if (!this.frozen) {
                if (this.dirX == this.dirY == 0) {

                    this.angle1 -= this.mouth*0.07;
                    this.angle2 += this.mouth*0.07;

                    var limitMax1 = this.direction.angle1;
                    var limitMax2 = this.direction.angle2;
                    var limitMin1 = this.direction.angle1 - 0.21;
                    var limitMin2 = this.direction.angle2 + 0.21;

                    if (this.angle1 < limitMin1 || this.angle2 > limitMin2)
                    {
                        this.mouth = -1;
                    }
                    if (this.angle1 >= limitMax1 || this.angle2 <= limitMax2)
                    {
                        this.mouth = 1;
                    }
                }
            }
        };
        this.stop = function() {
            this.dirX = 0;
            this.dirY = 0;
        };
        this.reset = function() {
            this.unfreeze();
            this.posX = 0;
            this.posY = 6*2*this.radius;
            this.setDirection(right);
            this.stop();
            this.stuckX = 0;
            this.stuckY = 0;
        };
        this.dieAnimation = function() {
            this.angle1 += 0.05;
            this.angle2 -= 0.05;
            if (this.angle1 >= this.direction.angle1+0.7 || this.angle2 <= this.direction.angle2-0.7) {
                this.dieFinal();
            }
        };
        this.die = function() {
            this.freeze();
            this.dieAnimation();
        };
        this.dieFinal = function() {
            this.reset();
            pinky.reset();
            inky.reset();
            blinky.reset();
            clyde.reset();
            this.lives--;
            console.log("pacman died, "+this.lives+" lives left");
            if (this.lives <= 0) {
                game.showMessage("Game over","Total Score: "+game.score.score+input);
                game.gameOver = true;
            }
            game.drawHearts(this.lives);
        };
        this.getGridPosX = function() {
            return (this.posX - (this.posX % 30))/30;
        };
        this.getGridPosY = function() {
            return (this.posY - (this.posY % 30))/30;
        }
    }
    pacman.prototype = new Figure();
    var pacman = new pacman();
    game.buildWalls();


    $(document).ready(function() {


        window.addEventListener('keydown',doKeyDown,true);

        $('#canvas-container').click(function() {
            if (!(game.gameOver == true))	game.pauseResume();
        });



        $(document).on('click','.button#newGame',function(event) {
            game.newGame();
        });
        $(document).on('click','.button#instructions',function(event) {
            game.showContent('instructions-content');
        });
        $(document).on('click','.button#info',function(event) {
            game.showContent('info-content');
        });
        $(document).on('click','.button#back',function(event) {
            game.showContent('game-content');
        });

        canvas = $("#myCanvas").get(0);
        context = canvas.getContext("2d");

        game.init(0);
        logger.disableLogger();

        renderContent();
    });

    function renderContent()
    {
        game.score.refresh(".score");
        context.beginPath();
        context.fillStyle = "White";
        context.strokeStyle = "White";

        var dotPosY;
        $.each(game.map.posY, function(i, item) {
            dotPosY = this.row;
            $.each(this.posX, function() {
                if (this.type == "pill") {
                    context.arc(game.toPixelPos(this.col-1)+pacman.radius,game.toPixelPos(dotPosY-1)+pacman.radius,game.pillSize,0*Math.PI,2*Math.PI);
                    context.moveTo(game.toPixelPos(this.col-1), game.toPixelPos(dotPosY-1));
                }
                else if (this.type == "powerpill") {
                    context.arc(game.toPixelPos(this.col-1)+pacman.radius,game.toPixelPos(dotPosY-1)+pacman.radius,game.powerpillSizeMax,0*Math.PI,2*Math.PI);
                    context.moveTo(game.toPixelPos(this.col-1), game.toPixelPos(dotPosY-1));
                }
            });
        });
        console.log("pps: " + game.powerpillSizeMax);
        context.fill();
        context.drawImage(canvas_walls, 0, 0);


        if (game.running == true) {
            pinky.draw(context);
            blinky.draw(context);
            inky.draw(context);
            clyde.draw(context);
            context.beginPath();
            context.fillStyle = "Yellow";
            context.strokeStyle = "Yellow";
            context.arc(pacman.posX+pacman.radius,pacman.posY+pacman.radius,pacman.radius,pacman.angle1*Math.PI,pacman.angle2*Math.PI);
            context.lineTo(pacman.posX+pacman.radius, pacman.posY+pacman.radius);
            context.stroke();
            context.fill();
        }

    }

    function renderGrid(gridPixelSize, color)
    {
        context.save();
        context.lineWidth = 0.5;
        context.strokeStyle = color;
        for(var i = 0; i <= canvas.height; i = i + gridPixelSize)
        {
            context.beginPath();
            context.moveTo(0, i);
            context.lineTo(canvas.width, i);
            context.closePath();
            context.stroke();
        }

        for(var i = 0; i <= canvas.width; i = i + gridPixelSize)
        {
            context.beginPath();
            context.moveTo(i, 0);
            context.lineTo(i, canvas.height);
            context.closePath();
            context.stroke();
        }

        context.restore();
    }

    function animationLoop()
    {
        canvas.width = canvas.width;
        renderContent();

        if (game.dieAnimation == 1) pacman.dieAnimation();
        if (game.pause != true){
            pacman.move();
            pacman.eat();
            pacman.checkDirectionChange();
            pacman.checkCollisions();
            blinky.move();
            inky.move();
            pinky.move();
            clyde.move();

            game.checkGhostMode();
        }
        game.check();

        setTimeout(animationLoop, game.refreshRate);

    }


    function doKeyDown(evt){

        switch (evt.keyCode)
        {
            case 38:
                evt.preventDefault();
            case 87:
                pacman.directionWatcher.set(up);
                break;
            case 40:
                evt.preventDefault();
            case 83:
                pacman.directionWatcher.set(down);
                break;
            case 37:
                evt.preventDefault();
            case 65:
                pacman.directionWatcher.set(left);
                break;
            case 39:
                evt.preventDefault();
            case 68:
                pacman.directionWatcher.set(right);
                break;
            case 78:
                if (!$('#playerName').is(':focus')) {
                    game.pause = 1;
                    game.newGame();
                }
                break;
            case 32:
                evt.preventDefault();
                if (!(game.gameOver == true)
                    && $('#game-content').is(':visible')
                )	game.pauseResume();
                break;
        }
    }
}

main();

