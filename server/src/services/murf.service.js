const generateSpeech = async (text) => {
  const apiKey = process.env.MURF_API_KEY;

  if (!apiKey) {
    throw new Error(
      'MURF_API_KEY is not defined in your .env file.'
    );
  }

  if (!text || !text.trim()) {
    throw new Error('Text is required for speech generation.');
  }

  const response = await fetch(
    'https://api.murf.ai/v1/speech/generate',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        voiceId: 'en-US-natalie',
        style: 'Conversational',
        format: 'MP3',
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Murf API error: ${response.status} ${errorText}`
    );
  }

  const data = await response.json();

  return (
    data.audioFile ||
    data.audioFileUrl ||
    data.url ||
    null
  );
};

export { generateSpeech };