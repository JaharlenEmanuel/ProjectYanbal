import { cloudinaryConfig, isCloudinaryConfigured } from '../config/cloudinary'

export const uploadImageToCloudinary = async (file) => {
    // Si Cloudinary no está configurado, usar placeholder
    if (!isCloudinaryConfigured()) {
        console.warn('Cloudinary no configurado. Usando imagen de placeholder.')

        // Crear URL local para la imagen
        const objectUrl = URL.createObjectURL(file)

        return {
            success: true,
            url: objectUrl,
            publicId: 'local-image',
            format: file.type.split('/')[1],
            bytes: file.size,
            width: 800,
            height: 600,
            isLocal: true // Marcar como imagen local
        }
    }

    const formData = new FormData()

    formData.append('file', file)
    formData.append('upload_preset', cloudinaryConfig.uploadPreset)
    formData.append('cloud_name', cloudinaryConfig.cloudName)
    formData.append('api_key', cloudinaryConfig.apiKey)

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
            {
                method: 'POST',
                body: formData
            }
        )

        const data = await response.json()

        if (data.secure_url) {
            return {
                success: true,
                url: data.secure_url,
                publicId: data.public_id,
                format: data.format,
                bytes: data.bytes,
                width: data.width,
                height: data.height,
                isLocal: false
            }
        } else {
            throw new Error(data.error?.message || 'Error al subir la imagen')
        }
    } catch (error) {
        console.error('Error subiendo a Cloudinary:', error)

        // Fallback: crear URL local
        const objectUrl = URL.createObjectURL(file)

        return {
            success: true,
            url: objectUrl,
            publicId: 'fallback-image',
            format: file.type.split('/')[1],
            bytes: file.size,
            width: 800,
            height: 600,
            isLocal: true,
            warning: 'Imagen guardada localmente debido a error en Cloudinary'
        }
    }
}