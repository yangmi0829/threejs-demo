import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import {buildingsData, pathData} from './data/data'
import bg from './assets/images/fushikang.jpg'
import Factory from "./three/Factory";
new Factory()
const animateQueue = []
const stats = new Stats();
document.body.appendChild( stats.dom );
let width = window.innerWidth;
let height = window.innerHeight;
const buildingColor = '#28375F'
//渲染器
const renderer = new THREE.WebGLRenderer();
renderer.setClearColor('skyblue', .7);
renderer.setSize( width,  height);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild( renderer.domElement );

// 相机
const camera = new THREE.PerspectiveCamera( 45, width / height );
camera.lookAt( 0, 0, 0 );
camera.up.z = 1
camera.position.set( 0, 0, 1200 )

// onresize 事件会在窗口被调整大小时发生
window.onresize = function(){
    width = window.innerWidth
    height = window.innerHeight
    // 重置渲染器输出画布canvas尺寸
    renderer.setSize(width, height);
    // 全屏情况下：设置观察范围长宽比aspect为窗口宽高比
    camera.aspect = width/height;
    // 渲染器执行render方法的时候会读取相机对象的投影矩阵属性projectionMatrix
    // 但是不会每渲染一帧，就通过相机的属性计算投影矩阵(节约计算资源)
    // 如果相机的一些属性发生了变化，需要执行updateProjectionMatrix ()方法更新相机的投影矩阵
    camera.updateProjectionMatrix ();
};
//场景
const scene = new THREE.Scene();

//灯光
const light = new THREE.AmbientLight( '#eeeeee' );
scene.add( light );
// 平行光
/*const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
scene.add( directionalLight );*/

//点光
{
    const light = new THREE.PointLight( '#ffffff', 1, 1000 );
    light.position.set( 0, 0, 200 );
    const pointLightHelper = new THREE.PointLightHelper( light, 100 );
    //scene.add( pointLightHelper );
    //scene.add( light );
}
// 聚光灯
{
    const spotLight = new THREE.SpotLight( '#ffffff' );
    spotLight.castShadow = true;
    spotLight.position.set( 0, 300, 300 );
    //spotLight.shadow.mapSize.width = width;  // default
    //spotLight.shadow.mapSize.height = height; // default

    const lightHelper = new THREE.SpotLightHelper( spotLight );
    scene.add( lightHelper );

    const shadowCameraHelper = new THREE.CameraHelper( spotLight.shadow.camera );
    scene.add( shadowCameraHelper );

    scene.add( spotLight );
}

// 背景
{
    const texture = new THREE.TextureLoader().load(bg);
    const geometry = new THREE.PlaneGeometry( width, height );
    const material = new THREE.MeshBasicMaterial(
        {
            map: texture,
            depthTest: false,
            side: THREE.DoubleSide
            }
        );
    const plane = new THREE.Mesh( geometry, material );
    //plane.receiveShadow = true
    scene.add( plane );
}


const group = new THREE.Group();

const textureArr = []
{
    // load a texture, set wrap mode to repeat
    const texture = new THREE.TextureLoader().load( "assets/images/cizhuan1.jpg" );
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 0.05, 0.05 );

    const texture2 = new THREE.TextureLoader().load( "assets/images/cizhuan2.jpg" );
    texture2.wrapS = texture2.wrapT = THREE.RepeatWrapping;
    texture2.repeat.set( 0.01, 0.01 );

    const texture3 = new THREE.TextureLoader().load( "assets/images/cizhuan3.jpg" );
    texture3.wrapS = texture3.wrapT = THREE.RepeatWrapping;
    texture3.repeat.set( 0.1, 0.1 );

    textureArr.push(texture, texture2, texture3)
}

const drawTextQueue = []
let fontCache = null
function drawText(options, group) {
    if(!options.text){
        throw new Error('no text')
    }
    options = Object.assign({}, {
        size: 10,
        height: 5,
        translateXOffset: 0,
        translateYOffset: 0,
        translateZOffset: 0
    }, options)
    const {text, point1, point2} = options
    const loader = new THREE.FontLoader();
    const angle = Math.atan((point2.y - point1.y)/(point2.x - point1.x))
    // todo 利用队列优化，不用每次都加载字体资源
    loader.load(
        // 资源URL
        'assets/font/STXinwei_Regular.json',
        // onLoad回调
        function ( font ) {
            fontCache = font
            const size = options.size
            const height = options.height
            const geometry = new THREE.TextGeometry( text, {
                font,
                size,
                height,
            } );
            //创建法向量材质
            const meshMaterial = new THREE.LineBasicMaterial({
                color: options.color
            });

            const mesh = new THREE.Mesh(geometry, meshMaterial);

            mesh.translateX(point1.x + options.translateXOffset)
            mesh.translateY(point1.y + options.translateYOffset)
            // -6是因为ExtrudeGeometry设置了bevelEnabled 为false，少了默认斜角的厚度6
            mesh.translateZ(options.translateZ + options.height + options.translateZOffset - 6)
            mesh.rotateZ(angle)

            group.add(mesh)
        },

        // onProgress回调
        function ( xhr ) {
            console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
        },

        // onError回调
        function ( err ) {
            console.log( 'An error happened', err );
        }
    );

}
let point
let index = 0
function drawPath() {
    if(!point){
        let geometry = new THREE.SphereGeometry(5, 50, 50);
        let material = new THREE.MeshBasicMaterial({
            color: 'green'
        });
        point = new THREE.Mesh(geometry, material)

        scene.add(point)
    }
    point.geometry.center()
    point.geometry.translate(pathData[index].x, pathData[index].y, 0)
    if(index === pathData.length -1){
        index = 0
    }
    index++
}
drawPath()

function render() {
    buildingsData.forEach(building => {
        // 随机贴图
        const map = textureArr[~~(textureArr.length * Math.random())]
        const {properties, geometry} = building
        const {depth, depthScale, floor, name, textDirectCoordinates} = properties
        for (let i = 0; i < floor; i++){
            if(geometry.coordinates.length){
                const shape = new THREE.Shape();
                geometry.coordinates.forEach((coord, index) => {
                    if(index === 0){
                        shape.moveTo( coord.x,coord.y );
                    }else{
                        shape.lineTo( coord.x,coord.y );
                    }
                })
                shape.lineTo( geometry.coordinates[0].x, geometry.coordinates[0].y );
                const extrudeGeometry = new THREE.ExtrudeGeometry( shape, {
                    //挤出的形状的深度, 这里用作楼层高度
                    bevelEnabled: false,
                    //bevelSegments: i === floor - 1 ? 3 : 0,
                    depth,
                } );
                extrudeGeometry.translate(0, 0, depth * depthScale * i)
                const material = new THREE.MeshLambertMaterial( {
                    //map,
                    color: buildingColor,
                    //depthWrite: false,
                    opacity: .9,
                    transparent: false,
                } );
                const mesh = new THREE.Mesh( extrudeGeometry, material ) ;
                const edges = new THREE.EdgesGeometry(extrudeGeometry );
                const line = new THREE.LineSegments( edges, new THREE.LineBasicMaterial( { color: 0x333333 } ) );
                if(i === (floor - 1) && name && textDirectCoordinates && textDirectCoordinates.length === 2){
                    drawText({
                        text: name,
                        color: properties.textColor,
                        size: properties.textSize,
                        height: properties.textHeight,
                        translateXOffset: properties.textTranslateXOffset,
                        translateYOffset: properties.textTranslateYOffset,
                        translateZOffset: properties.textTranslateZOffset,
                        point1: textDirectCoordinates[0],
                        point2: textDirectCoordinates[1],
                        translateZ: floor * depth * depthScale
                    }, group)
                }
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                group.add(mesh)
                group.add(line);
            }
        }
    })
}

render()

scene.add(group)
// 辅助线
scene.add(new THREE.AxesHelper(500));
//相机控制器  悬浮事件监听
{
    const controls = new OrbitControls(camera, renderer.domElement);
    //水平旋转的角度上限
    //controls.maxAzimuthAngle = Math.PI/4
    //controls.minAzimuthAngle = -Math.PI/4
    //向外移动多少
    //controls.maxDistance = 3000
    //controls.minDistance = 1000
    controls.addEventListener('change', function (e) {
        // console.log(controls.getAzimuthalAngle(), controls.getPolarAngle())
        removeElement()
    });
}
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
function onMouseMove( event ) {
  // 将鼠标位置归一化为设备坐标。x 和 y 方向的取值范围是 (-1 to +1)
  mouse.x = ( event.clientX / width ) * 2 - 1;
  mouse.y = - ( event.clientY / height ) * 2 + 1;
}
let element;

function removeElement() {
  if(element){
    document.body.removeChild(element);
    element = null
    removeElement()
  }
}
function onClick(e){
  removeElement()
  if(geometryId){
   const mesh =  group.getObjectById(geometryId);
    const {width, height, depth} = mesh.geometry.parameters;
    const {floor} = mesh.geometry.userData;
    element = document.createElement('div');
    element.innerText = `floor:${floor}, width:${width}; height:${height}; depth: ${depth}`;
    element.style.position = 'absolute';
    element.style.left = e.clientX + 'px';
    element.style.top = e.clientY + 'px';
    document.body.appendChild(element)
  }
  onDocumentMouseDown(e)
}
window.addEventListener( 'mousemove', onMouseMove, false );
window.addEventListener( 'click', onClick, false );
let geometryId;
function animate(){
  requestAnimationFrame(animate);
  stats.update();
  drawPath()
  animateQueue.forEach(_ => _())
  // 通过摄像机和鼠标位置更新射线
  raycaster.setFromCamera( mouse, camera );
  // 计算物体和射线的焦点
  const intersects = raycaster.intersectObjects( group.children );
  if(geometryId){
    group.getObjectById(geometryId).material.color.set(buildingColor)
  }
  if(intersects.length){
    for(let i = 0 ; i < intersects.length; i++){
        if( intersects[0].object.geometry.type === 'ExtrudeGeometry'){
            geometryId = intersects[0].object.id;
            intersects[0].object.material.color.set('red');
            break
        }
    }
  }else{
    geometryId = ''
  }
  renderer.render(scene, camera)
}
// 标点工具
const clickPoints = []

function addButton(innerText, left, top, onclick) {
    const button = document.createElement('button')
    button.innerText = innerText
    button.style.position = 'absolute'
    button.style.left = left + 'px'
    button.style.top = top + 'px'
    button.onclick = onclick
    document.body.appendChild(button)
}
const printPointFn = function (e) {
    e.stopPropagation()
    cacheObjs.forEach(obj => {
        if(obj.type === "Points"){
            scene.remove(obj)
        }else{
            obj.dispose()
        }
    })
    console.log(JSON.stringify(clickPoints) + ',')
    clickPoints.length = 0
    cacheObjs.length = 0
}

const animateGoup = new THREE.Group()
scene.add(animateGoup)
const animateFn = function(e){
    e.stopPropagation()
    if(!clickPoints.length){
        alert('请点击屏幕选择一个点')
        return
    }
    const group = new THREE.Group()
    animateGoup.add(group)
    const translateX = clickPoints[0].x
    const translateY = clickPoints[0].y
    clickPoints.length = 0

    {
        const map = new THREE.TextureLoader().load('assets/images/jianbian.png')
        const geometry = new THREE.CircleGeometry(30, 100);
        const material = new THREE.MeshBasicMaterial({map, transparent: true});
        const mesh = new THREE.Mesh(geometry, material)
        mesh.translateX(translateX)
        mesh.translateY(translateY)
        mesh.name = "c1";
        group.add(mesh)
    }
    const c1ScaleTc = new THREE.KeyframeTrack('c1.scale', [0, 20], [0,0,0,1,1,1]);
    const c1OpacityTc = new THREE.KeyframeTrack('c1.material.opacity', [0, 20], [.6, .6, .6, 1, 1, 1]);
// 多个帧动画作为元素创建一个剪辑clip对象，命名"default"，持续时间20
    const clip = new THREE.AnimationClip("default", -1, [c1ScaleTc, c1OpacityTc]);
// group作为混合器的参数，可以播放group中所有子对象的帧动画
    const mixer = new THREE.AnimationMixer(group);
// 剪辑clip作为参数，通过混合器clipAction方法返回一个操作对象AnimationAction
    const AnimationAction = mixer.clipAction(clip);
//通过操作Action设置播放方式
    AnimationAction.timeScale = 3;//默认1，可以调节播放速度
// AnimationAction.loop = THREE.LoopOnce; //不循环播放

    const clock = new THREE.Clock();
    AnimationAction.play();//开始播放
    animateQueue.push(function () {
        mixer.update(clock.getDelta());
    });
}
const genImgFn = function(e){
    e.stopPropagation()
    var image = new Image();
    renderer.render(scene, camera)
    let imgData = renderer.domElement.toDataURL("image/jpeg");//这里可以选择png格式jpeg格式
    image.src = imgData;
    const newWin = window.open("", "_blank");
    newWin.document.write(image.outerHTML);
    newWin.document.close();
}

addButton('打印坐标并清空坐标数组', 0, 0, printPointFn)
addButton('动画', 170, 0, animateFn)
addButton('生成图片', 220, 0, genImgFn)


// 绘制点击过的点

function onDocumentMouseDown( event ) {
    event.preventDefault();
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2()
    mouse.x = ( event.clientX / width ) * 2 - 1;
    mouse.y = - ( event.clientY / height ) * 2 + 1;
    // 通过摄像机和鼠标位置更新射线
    raycaster.setFromCamera( mouse, camera );

    // 计算物体和射线的焦点
    const intersects = raycaster.intersectObjects( scene.children );
    if (intersects.length > 0) {
        const selected = intersects[0];//取第一个物体
        console.log("x:" + selected.point.x, "y:" + selected.point.y, "z:" + selected.point.z);
        clickPoints.push({
            x: selected.point.x,
            y: selected.point.y
        })
        // console.log(clickPoints)
        signPoint(selected.point)
    }

}

const cacheObjs = []
function signPoint(point){
    let geometry = new THREE.BufferGeometry();
    const material = new THREE.PointsMaterial({
        color: 0x000000,
        size: 5
    })
    const bufferAttribute = new THREE.BufferAttribute( new Float32Array([
        point.x, point.y, 0
    ]), 3 )
    geometry.setAttribute( 'position', bufferAttribute);
    const p = new THREE.Points(geometry, material)
    cacheObjs.push(geometry)
    cacheObjs.push(material)
    cacheObjs.push(p)
    scene.add(p)
}

animate()

// 世界坐标转屏幕坐标
function worldPositionToScenePosition(position) {
    const centerX = width / 2;
    const centerY = height / 2;
    const standardVec = position.project(camera);
    const screenX = Math.round(centerX * standardVec.x + centerX);
    const screenY = Math.round(-centerY * standardVec.y + centerY);
    return {screenX, screenY}
}
//const position = {x:-376.9536110892619, y:438.416621865647, z:0}
//const client = worldPositionToScenePosition(new THREE.Vector3(position.x, position.y, position.z))
//console.log(client)
//addButton('test', client.screenX, client.screenY, null)
