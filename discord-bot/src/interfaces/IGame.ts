export interface IGameData {
  id: string;
  name: string;
  description: string;
  promoImageUrl?: string;
  posterImageUrl?: string;
  pointMultiplier?: number;
}
interface IGameResponse {
  title: string;
  type: string;
  payload: {
    games: IGameData[];
  };
}

export const convertGameResponseToGameData = (
  game: IGameResponse
): IGameData[] =>
  game.payload.games.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    promoImageUrl: item.promoImageUrl || item.posterImageUrl,
  }));
