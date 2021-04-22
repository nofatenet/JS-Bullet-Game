const canvasObj = document.querySelector("canvas");

const ctx = canvasObj.getContext('2d');

canvasObj.width = window.innerWidth;
canvasObj.height = window.innerHeight;

const scoreHtml = document.getElementById("scoreHtml");
const healthHtml = document.getElementById("healthHtml");
const startBtn = document.getElementById("startGameBtn");
const modalMainMenu = document.getElementById("modalMainMenu");
const bigScore = document.getElementById("bigScoreHtml");
const sound1 = document.getElementById("Audio");

console.log(ctx);

class Player {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(
            this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

class Bullet {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(
            this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
    update() {
        this.draw();
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
    }
}

class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(
            this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        //ctx.fill();
        // fill not used here, when using Bitmap Images (declared in components.js)
        ctx.drawImage(BAT_img, this.x - 16, this.y - 10);
    }
    update() {
        this.draw();
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
    }
}

const friction = 0.96; //low means gibs splatt! high means gibs will travel far!
class Gib {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(
            this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
    update() {
        this.draw();
        this.velocity.x *= friction;
        this.velocity.y *= friction;
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
        this.alpha -= 0.001
        // Alpha can be really small. BUT: It needs to have at least SOME value...
        // Or they will never be removed and the canvas will look like Jackson Pollock Art...
        // And of course, the CPU will say Good-Bye sooner or later
    }
}

const xWorld = canvasObj.width / 2;
const yWorld = canvasObj.height / 2;

let player = new Player(xWorld, yWorld, 30, "#070707");
let bullets = [];
let enemies = [];
let gibs = [];

function init() {
    player = new Player(xWorld, yWorld, 30, "#070707");
    bullets = [];
    enemies = [];
    gibs = [];
    score = 0;
    health = 100;
    healthHtml.innerHTML = health;
    scoreHtml.innerHTML = score;
    bigScore.innerHTML = score;
}

// Sounds:
function playSound1() { 
    sound1.play(); 
}

function spawnEnemies() {
    setInterval(() => {
        const x = Math.random() * canvasObj.width;
        // Math.random() < 0.5 ? 0 : canvasObj.width;
        const y = 0;
        const radius = Math.random() * (30 - 5) + 5; // Max: 30, Min: 5

        const color =  `hsl(${Math.random()*360}, 50%, 50%)`  // "#225588";

        const angle = Math.atan2(yWorld - y, xWorld - x); //Closing IN to the Center/Player.
        const velocity = { x: Math.cos(angle), y: Math.sin(angle)};

        enemies.push(new Enemy(x, y, radius, color, velocity))
    }, 2000);
}

let score = 0;
let animationId;
function animate() {
    animationId = requestAnimationFrame(animate);
    ctx.fillStyle = "rgba(30, 30, 30, 0.2)"; //Color of Television, tuned to a dead channel.
    ctx.fillRect(0, 0, canvasObj.width, canvasObj.height) // clear Screen
    player.draw();  // Draw back the Player to the Screen

    gibs.forEach((gib, gibIndex) => {
        if (gib.alpha <= 0) {
            gibs.splice(gibIndex, 1)    // Remove Gib when faded (alpha is 0)
        } else {
            gib.update();
        }
    });

    bullets.forEach((bullet, bulletLocIndex) => {
        bullet.update();

        // Remove Bullets from Game when they are outside of the Screen:
        if (bullet.x + bullet.radius < 0 ||
            bullet.x - bullet.radius > canvasObj.width ||
            bullet.y + bullet.radius < 0 ||
            bullet.y - bullet.radius > canvasObj.height) {
            setTimeout(() => {
                    bullets.splice(bulletLocIndex, 1);
                }, 0);
        }
    });

    enemies.forEach((enemy, enemiesIndex) => {
        enemy.update();

        bullets.forEach((bullet, bulletIndex) => {
            const distEnemBullet = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
            // It's a Hit-Test, but mega accurate (checking 0 and 0)
            // This is why the radius of both should check:

            if (distEnemBullet - enemy.radius - bullet.radius < 1) {
                    // Update Score:
                    score += 100;
                    scoreHtml.innerHTML = score;

                    // Gib when Gibbed:
                    for (let i = 0; i < enemy.radius * 3; i++) {
                        gibs.push(new Gib(
                            bullet.x,
                            bullet.y,
                            Math.random() * 2,
                            "#999966", //enemy.color, // Change to "#992200", / "#AA1111", for "ultra-violent"
                            {x: (Math.random() - 0.5) * (Math.random() * 4),
                            y: (Math.random() - 0.5) * (Math.random() * 4)
                            }))
                    }
                
                if (enemy.radius - 5 > 10) {
                    score += 10;
                    // Make Big ones smaller when hit:
                    // enemy.radius -= 5
                    // Using the GSAP Library here, to make it much smoother:
                    gsap.to(enemy, {
                        radius: enemy.radius - 10   //Could be called "Attack Power"
                    })
                        setTimeout(() => {
                        bullets.splice(bulletIndex, 1);
                    }, 0);

                    // Sound of Hitting:
                    zzfx(...[.4,,418,0,.02,.2,4,1.15,-8.5,,,,,.7,,.06]);
                } else {
                        setTimeout(() => {
                        console.log("We are touching!!");
                        //We give out indexes so the touching ones are removed.
                        enemies.splice(enemiesIndex, 1);
                        bullets.splice(bulletIndex, 1);

                        // Sound of exploding Enemy:
                        zzfx(...[.6,,333,.01,0,.9,4,1.9,,,,,,.5,,.8]);
                    }, 0);
                }

            }
        });

        // Enemy is hitting Home:
        const distEnemPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y);
            if (distEnemPlayer - enemy.radius - player.radius < 1) {
                console.log("We are FCKD!");
                enemies.splice(enemiesIndex, 1);
                health -= 10;
                healthHtml.innerHTML = health;
                console.log("Health is now: ", health);
                zzfx(...[0.1,0,50,.02,,.5,4,.1,,,,,,,,.06,.01])

                // GAME OVER:
                if (health < 1) {
                cancelAnimationFrame(animationId);
                    healthHtml.innerHTML = health;
                    scoreHtml.innerHTML = score;
                    modalMainMenu.style.display = "flex";
                    bigScore.innerHTML = score;
                    //Sound of GAME OVER:
                    zzfx(...[.5,,925,.04,.3,.6,1,.3,,6.27,-184,.09,.17])
                }
            }
    });
}

// let fireRate;
// document.addEventListener("mousedown", (event) => {

//     fireRate = setInterval(function(){
//         const angle = Math.atan2(event.clientY - yWorld, event.clientX - xWorld);
//         // Bullet Speed:
//         let speed = 5;
//         const velocity = {
//             x: Math.cos(angle) * speed,
//             y: Math.sin(angle) * speed
//         };
//         // Birth of a Bullet:
//         bullets.push(new Bullet(
//             xWorld, yWorld, 3, "#DDBB99", velocity
//             ));
//         // Sound of Bullet:
//         //playSound1();
//         zzfx(...[,,129,.01,,.15,,,,,,,,5]);

//      }, 150); // Rate of Fire
// });

// document.addEventListener("mouseup", () => {
//     if (fireRate) clearInterval(fireRate);
// });


//All mouse properties are visible,
//when we add event to parameter and log it.
//Things like clientX and clientY(the mouse position!)

window.addEventListener("click", (event) => {
        console.log(bullets);
        const angle = Math.atan2(event.clientY - yWorld, event.clientX - xWorld);
        // console.log(angle);

        // Bullet Speed:
        let speed = 5;
        const velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        };

        // Birth of a Bullet:
        bullets.push(new Bullet(
            xWorld, yWorld, 3, "#DDBB99", velocity
            ));

        console.log(event);
        // Sound of Bullet:
        //playSound1();
        zzfx(...[.8,,129,.01,,.15,,,,,,,,5]);
});

// Create a song
//let mySongData = zzfxM(...[[[,0,400,,,,1]],[[[,-1,10,4,5,5,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],[,1,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],[,-1,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],[,1,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,]]],[0],,{"title":"New Song","instruments":["Instrument 0"],"patterns":["Pattern 0"]}]);

startBtn.addEventListener("click", () => {
    init();
    animate();
    spawnEnemies();
    modalMainMenu.style.display = "none";

    // Play the song (returns a AudioBufferSourceNode)
    //let myAudioNode = zzfxP(...mySongData);
});
