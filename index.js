const express = require("express");
const app = express();
const path = require("path");
const { createCanvas, Image, loadImage } = require("canvas");
const fileUpload = require("express-fileupload");

app.use(express.static(path.join(__dirname, "public")));
app.use(fileUpload());
app.use(express.json());

app.use("/3dView/:productId", function (req, res) {
  const { productId } = req.params;
  const htmlFile = `
    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="utf-8" />
            <title>My first three.js app</title>
            <style>
            body {
                margin: 0;
            }
            </style>
        </head>
        <body>
            <script src="https://threejs.org/build/three.js"></script>
            <script src="http://localhost:4000/mtlLoader.js"></script>
            <script src="http://localhost:4000/objLoader.js"></script>
            <script>
                const texture = new THREE.TextureLoader().load('/images/${productId}');
                const scene = new THREE.Scene();
                const camera = new THREE.PerspectiveCamera(
                    35,
                    window.innerWidth / window.innerHeight,
                    0.1,
                    1000
                );
            
                const renderer = new THREE.WebGLRenderer();
                renderer.setClearColor('#e5e5e5')
                renderer.setSize(window.innerWidth, window.innerHeight);
                document.body.appendChild(renderer.domElement);
            
                const geometry = new THREE.BoxGeometry(40, 25, 0.5);
                const material = new THREE.MeshBasicMaterial( { map: texture } );
                const whiteMaterial = new THREE.MeshBasicMaterial();

                const cube = new THREE.Mesh(geometry, [whiteMaterial, whiteMaterial, whiteMaterial, whiteMaterial, material, whiteMaterial] );
                scene.add(cube);






                const mtlLoader = new THREE.MTLLoader();
                mtlLoader.load('http://localhost:4000/objects/blue_mug/blue_mug.mtl', (materials) => {
                    materials.preload();
                    const objLoader = new THREE.OBJLoader();
                    objLoader.setMaterials(materials);
                    objLoader.load('http://localhost:4000/objects/blue_mug/blue_mug.obj', (obj) => {
                        scene.add(obj);
                    },
                    function ( xhr ) {
                
                        console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
                
                    },
                    function ( error ) {
                
                        console.log( 'An error happened', error );
                
                    });
                });





                const light = new THREE.PointLight(0xFFFFFF, 1.4, 1000);
                light.position.set(200, 100, 100);
                scene.add(light);

            



                camera.position.z = 500;

                let mouseDown = false,
                    mouseX = 0,
                    mouseY = 0;

                function onMouseMove(evt) {
                    if (!mouseDown) {
                        return;
                    }

                    evt.preventDefault();

                    let deltaX = evt.clientX - mouseX,
                        deltaY = evt.clientY - mouseY;
                    mouseX = evt.clientX;
                    mouseY = evt.clientY;
                    rotateScene(deltaX, deltaY);
                }

                function onMouseDown(evt) {
                    evt.preventDefault();

                    mouseDown = true;
                    mouseX = evt.clientX;
                    mouseY = evt.clientY;
                }

                function onMouseUp(evt) {
                    evt.preventDefault();

                    mouseDown = false;
                }

                function addMouseHandler(canvas) {
                    canvas.addEventListener('mousemove', function (e) {
                        onMouseMove(e);
                    }, false);
                    canvas.addEventListener('mousedown', function (e) {
                        onMouseDown(e);
                    }, false);
                    canvas.addEventListener('mouseup', function (e) {
                        onMouseUp(e);
                    }, false);
                }

                function rotateScene(deltaX, deltaY) {
                    scene.rotation.y += deltaX / 100;
                    scene.rotation.x += deltaY / 100;
                }

                addMouseHandler(document.getElementsByTagName("canvas")[0]);

                const points = [];
                points.push( new THREE.Vector3( - 1, 0, 0 ) );
                points.push( new THREE.Vector3( 0, 2, 0 ) );
                points.push( new THREE.Vector3( 1, 0, 0 ) );

                const lineGeometry = new THREE.BufferGeometry().setFromPoints( points );

                const lineMaterial = new THREE.LineBasicMaterial( { color: 0xff0000 } );

                const line = new THREE.Line( lineGeometry, lineMaterial );
                scene.add( line );

                function animate() {
                    requestAnimationFrame(animate);
                    renderer.render(scene, camera);
                }

                animate();
            </script>
        </body>
    </html>`;
  res.setHeader("Content-Type", "text/html");

  res.end(htmlFile);
});

app.use("/picture", async function (req, res) {
  const canvas = createCanvas(600, 400);
  const ctx = canvas.getContext("2d");

  const background = await loadImage(
    "http://localhost:4000/images/background.png"
  );
  ctx.drawImage(background, 0, 0, 600, 400);

  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 240, 150, 120, 80);
    const imageData = ctx.getImageData(100, 200, 300, 200);
    console.time("getting image data");
    const colorsList = [];
    for (let i = 0; i < imageData.data.length; i += 4) {
      colorsList.push(imageData.data.slice(i, i + 4));
    }
    console.timeEnd("getting image data");
  };
  img.onerror = (err) => {
    throw err;
  };
  img.src = req.files.image.data;

  canvas.createPNGStream().pipe(res);
});

app.listen(4000, () => console.log("listening on 4000"));
