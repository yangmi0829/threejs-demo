import * as THREE from 'three'
interface ThreeOptions {
    el?: HTMLElement | string
}

class BaseThree {
    options:ThreeOptions;
    container: HTMLElement;
    width: number;
    height: number;
    animateQueue: Array<Function>;
    [key: string]: any;

    constructor(options:ThreeOptions = {}){
        this.options = options
        this.init()
    }

    init():void{
        this.initContainer()
        this.initRender()
        this.initCamera()
        this.initScene()
        this.initLight()
        this.initBg()
        this.initHelper()
        this.initOrbitControls()
        this.initEvent()
    }

    initContainer():void{
        const{el} = this.options
        if(typeof el === 'string'){
            this.container = document.querySelector('el')
        }else{
            this.container = el || document.body
        }
        this.width = this.container.clientWidth
        this.height = this.container.clientHeight
    }

    initRender():void{
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize( this.width,  this.height);
        // renderer.setClearColor('skyblue', .7);
        //renderer.shadowMap.enabled = true;
        //renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
        //renderer.outputEncoding = THREE.sRGBEncoding;
        this.container.appendChild( renderer.domElement );
    }

    initCamera():void{
        const camera = new THREE.PerspectiveCamera( 45, this.width / this.height );
        camera.lookAt( 0, 0, 0 );
        camera.up.z = 1
        camera.position.set( 0, 0, 1200 )
        this.camera = camera
    }

    initScene(){
        this.scene = new THREE.Scene();
    }

    initLight(){
        const light = new THREE.AmbientLight( '#eeeeee' ); // soft white light
        this.scene.add( light );
    }

    initBg(){}

    initHelper(){}

    initOrbitControls(){}

    initEvent(){

    }

    loadFont(){}

    worldPositionToScenePosition(position){
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const standardVec = position.project(this.camera);
        const screenX = Math.round(centerX * standardVec.x + centerX);
        const screenY = Math.round(-centerY * standardVec.y + centerY);
        return {x: screenX, y:screenY}
    }

    render(){
        requestAnimationFrame(this.render)
    }
}

export default BaseThree
