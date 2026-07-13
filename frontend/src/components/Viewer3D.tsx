import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface Viewer3DProps {
  url: string
  modelType: 'stl' | 'vtp'
}

export default function Viewer3D({ url, modelType }: Viewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1e293b)
    sceneRef.current = scene

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.z = 150
    cameraRef.current = camera

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 20, 10)
    scene.add(directionalLight)

    const pointLight = new THREE.PointLight(0xffffff, 0.4)
    pointLight.position.set(-10, -20, -10)
    scene.add(pointLight)

    // Mouse controls
    let isDragging = false
    let startX = 0
    let startY = 0
    let rotationX = 0
    let rotationY = 0

    renderer.domElement.addEventListener('mousedown', (e) => {
      isDragging = true
      startX = e.clientX
      startY = e.clientY
    })

    renderer.domElement.addEventListener('mousemove', (e) => {
      if (!isDragging) return
      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY
      rotationY += deltaX * 0.01
      rotationX += deltaY * 0.01
    })

    renderer.domElement.addEventListener('mouseup', () => {
      isDragging = false
    })

    renderer.domElement.addEventListener('wheel', (e) => {
      e.preventDefault()
      const zoomSpeed = 10
      if (e.deltaY > 0) {
        camera.position.z += zoomSpeed
      } else {
        camera.position.z -= zoomSpeed
      }
    })

    // Load and parse STL file
    const loadSTL = async () => {
      try {
        const response = await fetch(url)
        const arrayBuffer = await response.arrayBuffer()
        const geometry = parseSTL(arrayBuffer)

        geometry.computeVertexNormals()
        geometry.center()

        // Create material and mesh
        const material = new THREE.MeshPhongMaterial({
          color: 0x3b82f6,
          shininess: 100,
          side: THREE.DoubleSide,
        })

        const mesh = new THREE.Mesh(geometry, material)
        scene.add(mesh)

        // Auto-scale camera to fit model
        const box = new THREE.Box3().setFromObject(mesh)
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const fov = camera.fov * (Math.PI / 180)
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2))
        cameraZ *= 1.5 // Add padding
        camera.position.z = cameraZ
        camera.lookAt(mesh.position)
      } catch (error) {
        console.error('Error loading STL:', error)
      }
    }

    if (modelType === 'stl') {
      loadSTL()
    }

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)

      // Apply rotation
      // Aplica la rotación solo si es un Mesh
      scene.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          child.rotation.x = rotationX
          child.rotation.y = rotationY
        }
      })

      renderer.render(scene, camera)
    }
    animate()

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return
      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.domElement.removeEventListener('mousedown', () => {})
      renderer.domElement.removeEventListener('mousemove', () => {})
      renderer.domElement.removeEventListener('mouseup', () => {})
      renderer.domElement.removeEventListener('wheel', () => {})
      containerRef.current?.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [url, modelType])

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
      style={{ overflow: 'hidden' }}
    >
      <div className="absolute top-4 left-4 bg-slate-700/80 backdrop-blur text-white p-4 rounded-lg text-sm z-10">
        <p className="font-semibold mb-2">Controles:</p>
        <p>🖱️ Arrastra para rotar</p>
        <p>🔄 Rueda para zoom</p>
      </div>
    </div>
  )
}

function parseSTL(arrayBuffer: ArrayBuffer): THREE.BufferGeometry {
  const view = new DataView(arrayBuffer)
  const isASCII = isASCIISTL(arrayBuffer)

  if (isASCII) {
    return parseASCIISTL(new TextDecoder().decode(arrayBuffer))
  } else {
    return parseBinarySTL(arrayBuffer)
  }
}

function isASCIISTL(arrayBuffer: ArrayBuffer): boolean {
  const view = new Uint8Array(arrayBuffer)
  const header = new TextDecoder().decode(view.slice(0, 5))
  return header.toLowerCase() === 'solid'
}

function parseBinarySTL(arrayBuffer: ArrayBuffer): THREE.BufferGeometry {
  const view = new DataView(arrayBuffer)
  
  // Skip header (80 bytes)
  const triangles = view.getUint32(80, true)
  
  const vertices: number[] = []
  const normals: number[] = []

  let offset = 84
  for (let i = 0; i < triangles; i++) {
    const nx = view.getFloat32(offset, true)
    const ny = view.getFloat32(offset + 4, true)
    const nz = view.getFloat32(offset + 8, true)
    offset += 12

    for (let j = 0; j < 3; j++) {
      vertices.push(
        view.getFloat32(offset, true),
        view.getFloat32(offset + 4, true),
        view.getFloat32(offset + 8, true)
      )
      normals.push(nx, ny, nz)
      offset += 12
    }

    // Skip attribute byte count
    offset += 2
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3))
  geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3))

  return geometry
}

function parseASCIISTL(stlString: string): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry()
  const vertices: number[] = []
  const normals: number[] = []

  const vertexPattern = /vertex\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)/g
  const normalPattern = /facet\s+normal\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)/g

  let normalMatch
  while ((normalMatch = normalPattern.exec(stlString)) !== null) {
    const nx = parseFloat(normalMatch[1])
    const ny = parseFloat(normalMatch[3])
    const nz = parseFloat(normalMatch[5])

    const facetStart = stlString.lastIndexOf('facet', normalMatch.index)
    const facetEnd = stlString.indexOf('endfacet', facetStart)
    const facetString = stlString.substring(facetStart, facetEnd)

    let vertexMatch
    while ((vertexMatch = vertexPattern.exec(facetString)) !== null) {
      vertices.push(parseFloat(vertexMatch[1]), parseFloat(vertexMatch[3]), parseFloat(vertexMatch[5]))
      normals.push(nx, ny, nz)
    }
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3))
  geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3))

  return geometry
}
