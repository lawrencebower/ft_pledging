const confetti = require("canvas-confetti");
const Fireworks = require('fireworks-js')

export class JSEffects {
    public schoolPride() {
        var end = Date.now() + (5 * 1000);

        // go Buckeyes!
        var colors = ['#bb0000', '#ffffff'];

        (function frame() {
            confetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: {x: 0},
                colors: colors
            });
            confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: {x: 1},
                colors: colors
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }

    public doRealistic() {
        var count = 200;
        var defaults = {
            origin: { y: 0.7 }
        };

        function fire(particleRatio, opts) {
            confetti(Object.assign({}, defaults, opts, {
                particleCount: Math.floor(count * particleRatio)
            }));
        }

        fire(0.25, {
            spread: 26,
            startVelocity: 55,
        });
        fire(0.2, {
            spread: 60,
        });
        fire(0.35, {
            spread: 100,
            decay: 0.91,
            scalar: 0.8
        });
        fire(0.1, {
            spread: 120,
            startVelocity: 25,
            decay: 0.92,
            scalar: 1.2
        });
        fire(0.1, {
            spread: 120,
            startVelocity: 45,
        });
    }

    public doFireworks() {
        var duration = 5 * 1000;
        var animationEnd = Date.now() + duration;
        var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        var interval = setInterval(function() {
            var timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            var particleCount = 50 * (timeLeft / duration);
            // since particles fall down, start a bit higher than random
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    }

    public doRealFireworks(){

        let targetDiv = document.getElementById("outerDiv") as HTMLDivElement;

        const fireworks = new Fireworks({
            target: targetDiv,
            hue: 120,
            startDelay: 1,
            minDelay: 20,
            maxDelay: 30,
            speed: 5,
            acceleration: 1.15,
            friction: 0.88,
            gravity: 1,
            particles: 65,
            trace: 3,
            explosion: 6,
            boundaries: {
                top: 70,
                bottom: targetDiv.clientHeight,
                left: 70,
                right: targetDiv.clientWidth
            },
            sound: {
                enable: true,
                list: [
                    'explosion0.mp3',
                    'explosion1.mp3',
                    'explosion2.mp3'
                ],
                min: 4,
                max: 8
            }
        })

        fireworks.start();
    }
}