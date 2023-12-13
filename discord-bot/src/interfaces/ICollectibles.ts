import ECollectibleCategories from '../enums/ECollectibleCategories';

export interface ICollectibleCategoryData {
  id: string;
  name: ECollectibleCategories;
  subtitle: string;
  priority: number;
}

export interface ICollectiableResponse {
  id: string;
  name: string;
  description: string;
  cost: number;
  promoImageUrl: string;
  prizeType: string;
  purchaseUrl?: string;
  categories?: ECollectibleCategories[];
  categoryData: ICollectibleCategoryData[];
  categoryIds: string[];
  active: boolean;
  available: number;
  assetHash: string;
  redeems: number;
  shipping: string;
  disclaimer?: string;
  availableInQuest: boolean;
  questId?: string;
  claims: number;
  maxClaims: number;
  isPhysical: boolean;
  isAsset: boolean;
}

export interface ICollectibleData {
  id: string;
  name: string;
  description: string;
  cost: number;
  promoImageUrl: string;
  available: number;
  redeems: number;
}

// Convert ICollectibleResponse to ICollectibleData where categories contain Collectibles
export const convertCollectiblesResponseToCollectiblesData = (
  collectiblesResponse: ICollectiableResponse[]
): ICollectibleData[] =>
  collectiblesResponse
    .filter(
      (collectible) =>
        collectible.categories &&
        (collectible.categories.includes(ECollectibleCategories.Collectibles) ||
          collectible.categories.includes(
            ECollectibleCategories.CommunityCollectibles
          ))
    )
    .map((collectible) => ({
      id: collectible.id,
      name: collectible.name,
      description: collectible.description,
      cost: collectible.cost,
      promoImageUrl: collectible.promoImageUrl,
      available: collectible.available,
      redeems: collectible.redeems,
    }));
