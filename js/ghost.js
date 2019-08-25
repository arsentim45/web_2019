function Ghost(name, gridPosX, gridPosY, image, gridBaseX, gridBaseY) {
    this.name = name;
    this.posX = gridPosX * 30;
    this.posY = gridPosY * 30;
    this.startPosX = gridPosX * 30;
    this.startPosY = gridPosY * 30;
    this.gridBaseX = gridBaseX;
    this.gridBaseY = gridBaseY;
    this.image = new Image();
    this.image.src = image;
    this.ghostHouse = true;
    this.dazzled = false;
    this.dead = false;

    this.dazzle = function() {
        this.changeSpeed(game.ghostSpeedDazzled);
        // ensure ghost doesnt leave grid
        if (this.posX > 0) this.posX = this.posX - this.posX % this.speed;
        if (this.posY > 0) this.posY = this.posY - this.posY % this.speed;
        this.dazzled = true;
    };

    this.undazzle = function() {
        // only change speed if ghost is not "dead"
        if (!this.dead) this.changeSpeed(game.ghostSpeedNormal);
        // ensure ghost doesnt leave grid
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
            //this.reset();
            this.dead = true;
            this.changeSpeed(game.ghostSpeedNormal);
        }
    }
}