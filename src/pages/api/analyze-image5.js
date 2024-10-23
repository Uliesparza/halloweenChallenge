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
    console.log('Request Body Level 5:', body);

    const { uri } = body;

    if (!uri) {
      return new Response(JSON.stringify({ error: 'Missing uri in request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const credentials = `${import.meta.env.PUBLIC_CLOUDINARY_API_KEY}:${import.meta.env.CLOUDINARY_API_SECRET}`;
    const authHeader = 'Basic ' + Buffer.from(credentials).toString('base64');

    const question = "Does the image contain at least one person dressed as a vampire or ghost?";

    const response = await fetch(
      `https://api.cloudinary.com/v2/analysis/${import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME}/analyze/ai_vision_moderation`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          source: {
            uri: uri,
          },
          rejection_questions: [question],
        }),
      }
    );

    const result = await response.json();

    console.log('AI Vision Moderation Level 5 Response:', JSON.stringify(result, null, 2));

    const responses = result.data?.analysis?.responses || [];
    const questionResponse = responses.find((response) => response.prompt === question);

    if (questionResponse) {
      const value = questionResponse.value.toLowerCase();
      if (value === 'yes') {
        return new Response(
          JSON.stringify({ message: 'Requirement met for level 5', success: true }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      } else {
        return new Response(
          JSON.stringify({ message: 'The image does not meet the requirement for level 5', success: false }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ message: 'No response for the question in level 5', success: false }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Error during AI Vision moderation analysis in level 5:', error);
    return new Response(
      JSON.stringify({
        error: 'Error during AI Vision moderation analysis in level 5',
        details: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const ALL = async ({ request }) => {
  return new Response(`Method ${request.method} Not Allowed`, {
    status: 405,
    headers: { Allow: 'POST' },
  });
};
