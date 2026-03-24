interface AIResponse {
  candidates?: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
  error?: {
    message: string;
  };
}

export async function processTextWithAI(text: string): Promise<string> {
  if (!text || text.trim() === '') return text;

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("No s'ha configurat la clau d'API (.env.local)");
  }

  const prompt = `Ets un assistent expert en redacció administrativa. El teu objectiu és corregir els errors ortogràfics i gramaticals de text, retornant un text coherent i correcte amb un to administratiu i formal, sense canviar-ne el sentit original. Si el text està en un idioma diferent del català, tradueix-lo al català.
  
Retorna RESULTAT EXACTE i NOMÉS el text corregit/traduït, sense cap comentari addicional ni text abans o després extres.

Text a corregir:
${text}`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  });

  if (!response.ok) {
    let errorMsg = "L'API d'IA ha retornat un error desconegut.";
    try {
      const errorData = await response.json();
      if (errorData.error && errorData.error.message) {
        errorMsg = `Error de l'API: ${errorData.error.message}`;
      }
    } catch (e) {}
    throw new Error(errorMsg);
  }

  const data: AIResponse = await response.json();
  
  if (data.candidates && data.candidates.length > 0 && data.candidates[0].content.parts.length > 0) {
    return data.candidates[0].content.parts[0].text.trim();
  }
  
  throw new Error("Resposta no vàlida de l'assistent d'IA");
}
