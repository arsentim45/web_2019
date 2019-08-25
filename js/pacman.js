function pacman() {
    this.radius = 15;
    this.posX = 0;
    this.posY = 6 * 2 * this.radius;
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

    this.setDirection = function(dir) {
        if (!this.frozen) {
            this.dirX = dir.dirX;
            this.dirY = dir.dirY;
            this.angle1 = dir.angle1;
            this.angle2 = dir.angle2;
            this.direction = dir;
        }
    };

    this.move = function() {

        if (!this.frozen) {

            this.posX += this.speed * this.dirX;
            this.posY += this.speed * this.dirY;

            // Check if out of canvas
            if (this.posX >= game.width-this.radius) this.posX = 5-this.radius;
            if (this.posX <= 0-this.radius) this.posX = game.width-5-this.radius;
            if (this.posY >= game.height-this.radius) this.posY = 5-this.radius;
            if (this.posY <= 0-this.radius) this.posY = game.height-5-this.radius;
        }
        else this.dieAnimation();
    };

    this.dieAnimation = function() {
        this.angle1 += 0.05;
        this.angle2 -= 0.05;
        if (this.angle1 >= this.direction.angle1+0.7 || this.angle2 <= this.direction.angle2-0.7) {
            this.reset();
        }
    };


}