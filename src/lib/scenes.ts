export interface Scene {
  id: string;
  label: string;
  title: [string, string];
  body: string;
  photo: string;
  /** width / height of the source photo, used so the door's clipped image covers correctly. */
  aspect: number;
}

export const SCENES: Scene[] = [
  {
    id: "manha",
    label: "A manhã",
    title: ["O dia começa", "devagar."],
    body: "Café da manhã servido no terraço, depois um mergulho na piscina antes do sol esquentar.",
    photo: "/images/piscina-graded.jpg",
    aspect: 1200 / 900,
  },
  {
    id: "tarde",
    label: "A tarde",
    title: ["Uma pausa", "no verde."],
    body: "De volta ao quarto, a varanda e o jardim pedem uma soneca — ou só ficar vendo o verde lá fora.",
    photo: "/images/quarto-verde-graded.jpg",
    aspect: 1980 / 1320,
  },
  {
    id: "entardecer",
    label: "O entardecer",
    title: ["Paraty espera", "lá fora."],
    body: "A cerca de 5 minutos do Centro Histórico de Paraty, e pertinho da Praia do Jabaquara.",
    photo: "/images/hero-fachada-graded.jpg",
    aspect: 2000 / 1333,
  },
  {
    id: "estadia",
    label: "Sua estadia",
    title: ["Reserve o", "seu quarto."],
    body: "Nota 4,7 no Google, com 163 avaliações. Hotel 3 estrelas no Caborê, Paraty.",
    photo: "/images/quarto-amarelo-graded.jpg",
    aspect: 2000 / 1333,
  },
];
