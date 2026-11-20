/** First name, letters only and short: free text from a form must never carry a link or odd characters into a message sent from the company's number. */
export const nomeSeguro = (nome: string) => (nome.trim().split(/\s+/)[0] ?? '').replace(/[^\p{L}'-]/gu, '').slice(0, 20);
