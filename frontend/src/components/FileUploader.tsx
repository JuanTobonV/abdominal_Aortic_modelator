import { useState } from 'react'

interface FileUploaderProps {
  onFileUpload: (url: string, type: 'stl' | 'vtp') => void
}

export default function FileUploader({ onFileUpload }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleFile = async (file: File) => {
    const validExtensions = ['.stl', '.vtp']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!validExtensions.includes(fileExtension)) {
      alert('Por favor sube un archivo .stl o .vtp')
      return
    }

    setIsLoading(true)
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer
        const blob = new Blob([arrayBuffer], { 
          type: fileExtension === '.stl' ? 'application/octet-stream' : 'application/octet-stream'
        })
        const url = URL.createObjectURL(blob)
        onFileUpload(url, fileExtension === '.stl' ? 'stl' : 'vtp')
      }
      reader.readAsArrayBuffer(file)
    } finally {
      setIsLoading(false)
      setIsDragging(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  return (
    <div>
      <label htmlFor="file-input" className="block">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-all duration-200
            ${isDragging 
              ? 'border-blue-500 bg-blue-500/10' 
              : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
            }
            ${isLoading ? 'opacity-60 pointer-events-none' : ''}
          `}
        >
          <input
            id="file-input"
            type="file"
            accept=".stl,.vtp"
            onChange={handleInputChange}
            className="hidden"
            disabled={isLoading}
          />
          
          {isLoading ? (
            <div>
              <div className="mb-3">
                <div className="w-8 h-8 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
              </div>
              <p className="text-slate-300">Cargando archivo...</p>
            </div>
          ) : (
            <div>
              <div className="text-3xl mb-3">📁</div>
              <p className="text-slate-200 font-medium">
                Arrastra tu archivo aquí
              </p>
              <p className="text-slate-400 text-sm mt-2">
                o haz clic para seleccionar
              </p>
              <p className="text-slate-500 text-xs mt-3">
                Formatos: .stl, .vtp
              </p>
            </div>
          )}
        </div>
      </label>
    </div>
  )
}
