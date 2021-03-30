import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
let width = window.innerWidth;
let height = window.innerHeight;
//渲染器
const renderer = new THREE.WebGLRenderer();
renderer.setClearColor('skyblue', .7);
renderer.setSize( width,  height);
document.body.appendChild( renderer.domElement );
// 相机
const camera = new THREE.PerspectiveCamera( 45, width / height );
camera.lookAt( 0, 0, 0 );
camera.position.set( 50, 50, 50 )
//场景
const scene = new THREE.Scene();
//相机控制器
const controls = new OrbitControls(camera, renderer.domElement);
controls.addEventListener('change', function (e) {
});
//灯光
const light = new THREE.AmbientLight( 0xffffff ); // soft white light
scene.add( light );

// 辅助线
scene.add(new THREE.AxesHelper(500));

// 6面贴图
{
    const geometry = new THREE.BoxGeometry( 10, 10, 10 );
    const materials = [];
    for (let i = 0; i < 6; ++i) {
        const material = new THREE.MeshLambertMaterial({
            map: new THREE.TextureLoader().load('assets/images/cizhuan'+ (i % 3 + 1)+'.jpg'),
        })
        materials.push(material)
    }
    const cube = new THREE.Mesh( geometry, materials );
    cube.translateY(10)
    //scene.add( cube );
    //告诉渲染器，我们需要阴影映射
//对每个物体进行阴影设置，接受阴影还是投射阴影
//平面是接受阴影
    cube.receiveShadow = true;
//方块投射阴影
    cube.castShadow = true;
}
function scatterCircle(r, init, ring, color, speed, type = 'circle') {
    var uniform = {
        u_color: { value: color },
        u_r: { value: init },
        u_ring: {
            value: ring,
        },
    };

    var vs = `
		varying vec3 vPosition;
		void main(){
			vPosition=position;
			gl_Position	= projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`;
    var fs = `
		varying vec3 vPosition;
		uniform vec3 u_color;
		uniform float u_r;
		uniform float u_ring;

		void main(){
			float pct=distance(vec2(vPosition.x,vPosition.y),vec2(0.0));
			if(pct>u_r || pct<(u_r-u_ring)){
				gl_FragColor = vec4(1.0,0.0,0.0,0);
			}else{
				float dis=(pct-(u_r-u_ring))/(u_r-u_ring);
				gl_FragColor = vec4(u_color,dis);
			}
		}
	`;
    const geometry = new THREE.CircleGeometry(r, 120);
    var material = new THREE.ShaderMaterial({
        vertexShader: vs,
        fragmentShader: fs,
        side: THREE.DoubleSide,
        uniforms: uniform,
        transparent: true,
        //depthWrite: false,
    });
    const circle = new THREE.Mesh(geometry, material);

    function render() {
        uniform.u_r.value += speed || 0.1;
        if (uniform.u_r.value >= r) {
            uniform.u_r.value = init;
        }
        requestAnimationFrame(render);
    }
    render();

    return circle;
}
let circle = scatterCircle(8, 1, 3, new THREE.Vector3(1, 0, 0), 0.06);
let circle2 = scatterCircle(12, 5, 3, new THREE.Vector3(1, 0, 0), 0.06);

//scene.add(circle);
//scene.add(circle2);

const canvas = document.createElement('canvas')
//canvas贴图
{

    canvas.width = 300
    canvas.height = 300
    const ctx = canvas.getContext('2d')
    // 创建径向渐变
    var grd = ctx.createRadialGradient(150,150,5,150,150,20);
    grd.addColorStop(0,"white");
    grd.addColorStop(1,"red");
    // 填充渐变
    ctx.fillStyle = grd;
    ctx.beginPath()
    ctx.arc(150, 150, 20, 0, Math.PI*2)
    ctx.fill()
    debugger
    document.body.appendChild(canvas)
}

{
    const group = new THREE.Group()
    scene.add( group );
    const tc = []
    {
        const map = new THREE.TextureLoader().load('assets/images/jianbian.png')
        const geometry = new THREE.CircleGeometry( 1,  32 );
        const material = new THREE.MeshBasicMaterial( {
            //color: 0xffffff,
            //opacity: 1,
            transparent: true,
            map,
            side: THREE.DoubleSide
        } );
        const mesh = new THREE.Mesh( geometry, material );
        mesh.rotateX(Math.PI/2)
        mesh.name = 'c1'
        const scaleTc1 = new THREE.KeyframeTrack('c1.scale', [0, 20], [0,0,0,1,1,1]);
        // const colorTc1 = new THREE.KeyframeTrack('c1.material.color', [0, 20], [1, .8, .8, 1,0,0]);
        tc.push(scaleTc1)
        //tc.push(colorTc1)
        group.add( mesh );

    }

    {
        const geometry = new THREE.RingGeometry( 1, 2, 32 );
        const material = new THREE.MeshBasicMaterial( { color: 0xff0000, side: THREE.DoubleSide } );
        const mesh = new THREE.Mesh( geometry, material );
        mesh.rotateX(Math.PI/2)
        mesh.name = 'c2'
        const scaleTc2 = new THREE.KeyframeTrack('c2.scale', [0, 20], [0,0,0,1,1,1]);
        const colorTc2 = new THREE.KeyframeTrack('c2.material.color', [0, 20], [0, 0, 0, 1,0,0]);
        //tc.push(rTc2)
        //tc.push(scaleTc2)
        //tc.push(colorTc2)
        //group.add( mesh );
    }



    /**
     * 编辑group子对象网格模型mesh1和mesh2的帧动画数据
     */
// 多个帧动画作为元素创建一个剪辑clip对象，命名"default"，持续时间20
    const clip = new THREE.AnimationClip("default", -1, tc);

    /**
     * 播放编辑好的关键帧数据
     */
// group作为混合器的参数，可以播放group中所有子对象的帧动画
    var mixer = new THREE.AnimationMixer(group);
// 剪辑clip作为参数，通过混合器clipAction方法返回一个操作对象AnimationAction
    var AnimationAction = mixer.clipAction(clip);
//通过操作Action设置播放方式
    AnimationAction.timeScale = 5;//默认1，可以调节播放速度
// AnimationAction.loop = THREE.LoopOnce; //不循环播放
    AnimationAction.play();//开始播放
}
var clock = new THREE.Clock();

function animate(){
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
    mixer.update(clock.getDelta());
}

animate()
