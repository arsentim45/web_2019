function buildWall(context,gridX,gridY,width,height) {
    width = width*2-1;
    height = height*2-1;
    context.fillRect(pacman.radius/2+gridX*2*pacman.radius,pacman.radius/2+gridY*2*pacman.radius, width*pacman.radius, height*pacman.radius);
}