import { useState, useRef } from 'react';
import { uploadImageToCloudinary } from '../../services/imageUploadService';

export default function ImageUpload({ onImageUpload, currentImage = '' }) {
    const [preview, setPreview] = useState(currentImage);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        setError(null);

        // Validaciones
        if (!file.type.startsWith('image/')) {
            setError('Por favor, selecciona un archivo de imagen (JPG, PNG, GIF)');
            setUploading(false);
            return;
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB máximo
            setError('La imagen no debe superar los 2MB');
            setUploading(false);
            return;
        }

        try {
            // Crear preview temporal
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);

            // Subir a Cloudinary
            const result = await uploadImageToCloudinary(file);

            if (result.success) {
                // Llamar a la función padre con la URL de Cloudinary
                onImageUpload(result.url);

                // También puedes guardar el publicId si lo necesitas
                console.log('Imagen subida exitosamente:', result);

                // Limpiar preview temporal después de 2 segundos
                setTimeout(() => {
                    URL.revokeObjectURL(objectUrl);
                }, 2000);
            } else {
                setError(result.error || 'Error al subir la imagen');
                setPreview(currentImage); // Restaurar imagen anterior
            }
        } catch (err) {
            setError('Error inesperado al procesar la imagen');
            setPreview(currentImage);
            console.error('Error en upload:', err);
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (event) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            fileInputRef.current.files = event.dataTransfer.files;
            handleFileSelect(event);
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();
    };

    const removeImage = () => {
        setPreview('');
        onImageUpload('');
        setError(null);
    };

    return (
        <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagen del Producto
            </label>

            {/* Área de upload */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${preview
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300 hover:border-purple-400 bg-gray-50'
                    } ${!uploading ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                onClick={() => !uploading && fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                />

                {uploading ? (
                    <div className="space-y-3">
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                        </div>
                        <p className="text-sm text-gray-600">Subiendo imagen a Cloudinary...</p>
                        <p className="text-xs text-gray-500">Por favor, espera</p>
                    </div>
                ) : preview ? (
                    <div className="space-y-3">
                        <div className="relative mx-auto max-w-xs">
                            <img
                                src={preview}
                                alt="Preview"
                                className="h-40 w-full object-contain rounded-lg"
                            />
                            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                ✓ Subida
                            </div>
                        </div>
                        <p className="text-sm text-gray-600">
                            Haz clic para cambiar la imagen
                        </p>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeImage();
                            }}
                            className="text-red-600 hover:text-red-800 text-sm inline-flex items-center space-x-1"
                        >
                            <span>🗑️</span>
                            <span>Remover imagen</span>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="mx-auto h-16 w-16 text-gray-400">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">
                                <span className="text-purple-600 font-medium">Haz clic para subir</span> o arrastra y suelta
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                PNG, JPG, GIF hasta 2MB
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Mensajes de estado */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center space-x-2 text-red-700">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm">{error}</span>
                    </div>
                </div>
            )}

            {currentImage && !error && !uploading && (
                <div className="text-xs text-gray-500">
                    <span className="font-medium">Nota:</span> La imagen se almacena en Cloudinary y se guarda automáticamente en Supabase cuando guardes el producto.
                </div>
            )}
        </div>
    );
}