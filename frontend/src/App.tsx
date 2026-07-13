import { useState } from 'react'
import FileUploader from './components/FileUploader'
import Viewer3D from './components/Viewer3D'
import './App.css'

function App() {
  const [modelUrl, setModelUrl] = useState<string | null>(null)
  const [modelType, setModelType] = useState<'stl' | 'vtp' | null>(null)

  const handleFileUpload = (url: string, type: 'stl' | 'vtp') => {
    setModelUrl(url)
    setModelType(type)
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-80 bg-slate-800 border-r border-slate-700 p-6 overflow-y-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              🫀 Aorta 3D
            </h1>
            <p className="text-slate-400 text-sm">
              Visualizador de modelos médicos 3D
            </p>
          </div>
          
          <FileUploader onFileUpload={handleFileUpload} />
          
          {modelUrl && (
            <div className="mt-8 p-4 bg-slate-700 rounded-lg">
              <h3 className="text-white font-semibold mb-2">Archivo cargado</h3>
              <p className="text-slate-300 text-sm break-all">
                {modelUrl.split('/').pop()}
              </p>
              <p className="text-slate-400 text-xs mt-2">
                Formato: {modelType?.toUpperCase()}
              </p>
            </div>
          )}
        </div>

        {/* Viewer Area */}
        <div className="flex-1">
          {modelUrl && modelType ? (
            <Viewer3D url={modelUrl} modelType={modelType} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-slate-400 text-lg mb-4">
                  Sube un archivo STL o VTP para comenzar
                </p>
                <p className="text-slate-500 text-sm">
                  Formatos soportados: .stl, .vtp
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
