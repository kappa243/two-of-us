const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 6046;
canvas.height = 3500;

const backgroundImage = new Image();
backgroundImage.onload = function() {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
};
backgroundImage.src = 'background.png';

let start = null;
let end = null;
let walls = [];
let redoStack = [];

canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(event.clientX - rect.left);
    const y = Math.round(event.clientY - rect.top);

    if (start === null) {
        start = { x, y };
        canvas.addEventListener('mousemove', drawPreview);
    } else {
        end = { x, y };
        canvas.removeEventListener('mousemove', drawPreview);
        walls.push([start, end]);
        start = null;
        end = null;
        redoStack = [];
        drawWalls();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
        if (walls.length > 0) {
            redoStack.push(walls.pop());
            drawWalls();
        }
    } else if (event.ctrlKey && event.key === 'Z' && event.shiftKey) {
        if (redoStack.length > 0) {
            walls.push(redoStack.pop());
            drawWalls();
        }
    } else if (event.ctrlKey && event.key === 'i') {
        saveCoordinatesToFile();
    }
});

function drawPreview(event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(event.clientX - rect.left);
    const y = Math.round(event.clientY - rect.top);

    end = { x, y };
    drawWalls();
}

function drawWalls() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    walls.forEach(wall => {
        ctx.beginPath();
        ctx.moveTo(wall[0].x, wall[0].y);
        ctx.lineTo(wall[1].x, wall[1].y);
        ctx.strokeStyle = 'red';
        ctx.stroke();
    });

    if (start !== null && end !== null) {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = 'red';
        ctx.stroke();
    }
}

function saveCoordinatesToFile() {
    let coordinatesText = "";

    walls.forEach((wall) => {
        // coordinatesText += `new Wall(new Point(${wall[0].x - canvas.width / 2}, ${wall[0].y - canvas.height / 2}), new Point(${wall[1].x - canvas.width / 2}, ${wall[1].y - canvas.height / 2})),\n`;
        coordinatesText += `[${wall[0].x - canvas.width / 2}, ${wall[0].y - canvas.height / 2}, ${wall[1].x - canvas.width / 2}, ${wall[1].y - canvas.height / 2}],\n`;
    });

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(coordinatesText));
    element.setAttribute('download', 'wall_coordinates.txt');

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}
