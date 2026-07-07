import type { IconName } from "../components/Icon";

export const students = [
  { pos: 1, name: "Rafael", trainings: 32 },
  { pos: 2, name: "Ana", trainings: 28 },
  { pos: 3, name: "Lucas", trainings: 24 },
  { pos: 4, name: "Julia", trainings: 22 },
  { pos: 5, name: "Pedro", trainings: 20 },
  { pos: 6, name: "Beatriz", trainings: 18 },
  { pos: 7, name: "Matheus", trainings: 16 },
  { pos: 8, name: "Carol", trainings: 14 },
  { pos: 9, name: "Felipe", trainings: 12 },
  { pos: 10, name: "Bianca", trainings: 10 },
];

export const trainers = [
  { id: "rafael", name: "Rafael", focus: "Hipertrofia e força", years: "5 anos", time: "Manhã", rating: "4,9", badge: "Mais procurado" },
  { id: "camila", name: "Camila", focus: "Emagrecimento", years: "4 anos", time: "Manhã", rating: "4,8" },
  { id: "lucas", name: "Lucas", focus: "Funcional e condicionamento", years: "3 anos", time: "Noite", rating: "4,7" },
  { id: "juliana", name: "Juliana", focus: "Natação e condicionamento", years: "6 anos", time: "Manhã", rating: "4,9" },
];

export const shopItems = [
  { name: "Whey Protein", category: "Whey", icon: "weight" as IconName },
  { name: "Creatina", category: "Creatina", icon: "spark" as IconName },
  { name: "Pré-treino / Energético", category: "Energéticos", icon: "bolt" as IconName },
  { name: "Camiseta Accqua Sports", category: "Roupas", icon: "shirt" as IconName },
  { name: "Regata Fitness", category: "Roupas", icon: "shirt" as IconName },
  { name: "Garrafa Shaker", category: "Acessórios", icon: "water" as IconName },
];

export const classes = [
  { name: "Hidroginástica", place: "Piscina 1", time: "09:00", status: "Acontecendo agora", icon: "swim" as IconName, gympass: true },
  { name: "Natação adulto", place: "Piscina 2", time: "10:00", status: "Acontecendo agora", icon: "swim" as IconName, gympass: true },
  { name: "Natação infantil", place: "Piscina 1", time: "17:30", status: "Próxima", icon: "swim" as IconName, gympass: true },
  { name: "Funcional", place: "Sala 2", time: "18:30", status: "Próxima", icon: "dumbbell" as IconName, gympass: true },
  { name: "Ritmos", place: "Sala 1", time: "20:00", status: "Próxima", icon: "music" as IconName, gympass: true },
  { name: "Natação adulto", place: "Piscina 2", time: "20:00", status: "Próxima", icon: "swim" as IconName, gympass: true },
];

export const foods = [
  { name: "Frango grelhado", kcal: "120 kcal", portion: "100 g", tag: "Proteína", tone: "blue", emoji: "🍗" },
  { name: "Batata doce", kcal: "86 kcal", portion: "100 g", tag: "Carboidrato", tone: "green", emoji: "🍠" },
  { name: "Brócolis", kcal: "34 kcal", portion: "100 g", tag: "Fibras", tone: "green", emoji: "🥦" },
  { name: "Abacate", kcal: "160 kcal", portion: "100 g", tag: "Gordura boa", tone: "orange", emoji: "🥑" },
  { name: "Aveia", kcal: "66 kcal", portion: "30 g", tag: "Carboidrato", tone: "green", emoji: "🥣" },
  { name: "Ovos", kcal: "143 kcal", portion: "2 unid.", tag: "Proteína", tone: "blue", emoji: "🥚" },
  { name: "Banana", kcal: "105 kcal", portion: "1 unid.", tag: "Carboidrato", tone: "green", emoji: "🍌" },
  { name: "Arroz integral", kcal: "112 kcal", portion: "100 g", tag: "Carboidrato", tone: "green", emoji: "🍚" },
  { name: "Salmão", kcal: "206 kcal", portion: "100 g", tag: "Proteína", tone: "blue", emoji: "🐟" },
  { name: "Iogurte natural", kcal: "61 kcal", portion: "100 g", tag: "Versátil", tone: "purple", emoji: "🥛" },
];

export const recipes = [
  { slug: "panqueca", name: "Panqueca de banana", kcal: "320 kcal", emoji: "🥞", desc: "Leve, nutritiva e perfeita para começar o dia com energia." },
  { slug: "bowl-frango", name: "Bowl de frango com quinoa", kcal: "450 kcal", emoji: "🥗", desc: "Leve, nutritivo e cheio de sabor para o seu dia a dia." },
  { slug: "smoothie", name: "Smoothie de frutas", kcal: "280 kcal", emoji: "🥤", desc: "Rápido, refrescante e nutritivo. Perfeito para qualquer hora do dia." },
];
