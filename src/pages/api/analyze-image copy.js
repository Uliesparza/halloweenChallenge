import { v2 as cloudinary } from 'cloudinary';
import { Buffer } from 'buffer';

cloudinary.config({
  cloud_name: import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: import.meta.env.PUBLIC_CLOUDINARY_API_KEY,
  api_secret: import.meta.env.CLOUDINARY_API_SECRET,
});

export const POST = async ({ request }) => {
  try {
    const body = await request.json();
    console.log('Request Body:', body);

    const { uri } = body;

    if (!uri) {
      return new Response(JSON.stringify({ error: 'Missing uri in request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Crear el encabezado de autorización utilizando Basic Auth
    const credentials = `${import.meta.env.PUBLIC_CLOUDINARY_API_KEY}:${import.meta.env.CLOUDINARY_API_SECRET}`;
    const authHeader = 'Basic ' + Buffer.from(credentials).toString('base64');

    // Realizar la solicitud a la API de AI Vision Moderation de Cloudinary
    const response = await fetch(`https://api.cloudinary.com/v2/analysis/${import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME}/analyze/ai_vision_moderation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        source: {
          uri: uri,
        },
        rejection_questions: [
          "Does the image contain at least 3 persons on Halloween costumes?",
        ],
      }),
    });

    const result = await response.json();

    console.log('AI Vision Moderation Full Response:', JSON.stringify(result, null, 2));

    // Verificar si hay errores en la respuesta
    if (result.error) {
      console.error('API Error:', result.error);
      return new Response(JSON.stringify({ error: 'AI Vision API Error', details: result.error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Procesar las respuestas de moderación
    const responses = result.data?.analysis?.responses || [];
    const phoneResponse = responses.find(response => response.prompt === "Does the image contain at least 3 persons on Halloween costumes?");

    if (phoneResponse) {
      const value = phoneResponse.value.toLowerCase();
      if (value === 'yes') {
        return new Response(JSON.stringify({ message: 'At least 3 persons dressed detected in the image', response: phoneResponse }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } else if (value === 'no') {
        return new Response(JSON.stringify({ message: 'No at least 3 persons dressed in the image', response: phoneResponse }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(JSON.stringify({ message: 'Unknown result for 3 person', response: phoneResponse }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else {
      return new Response(JSON.stringify({ message: 'No response for the phone question', responses }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error during AI Vision moderation analysis:', error);
    return new Response(JSON.stringify({ error: 'Error during AI Vision moderation analysis', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const ALL = async ({ request }) => {
  return new Response(`Method ${request.method} Not Allowed`, {
    status: 405,
    headers: { 'Allow': 'POST' },
  });
};
