import type { IUser } from './IUser';

interface ICurrentBid {
  id?: string;
  amount: number;
  createdAt: string;
  user: IUser;
}
// TODO: Maybe make this its own interface?
interface IPrize {
  id: string;
  name: string;
  description: string;
  promoImageUrl: string;
  prizeType: string; // TODO: Make this an enum
  shipping: string;
  disclaimer?: string;
  isAsset: boolean;
}

export interface IAuctionsResponse {
  status: number;
  hours: number;
  id: string;
  startDate: string;
  endDate: string;
  bidderCount: number;
  currentBid: ICurrentBid;
  prize: IPrize;
}

export interface IAuctionData {
  status: number;
  startDate: string;
  endDate: string;
  bidderCount: number;
  prizeName: string;
  prizeImageUrl: string;
  prizeDescription: string;
  currentBidder: string;
  currentBidAmount: number;
  auctionId: string;
}

// Convert IAuctionsResponse to IAuctionData
export const convertAuctionsResponseToAuctionData = (
  auctionsResponse: IAuctionsResponse[]
): IAuctionData[] =>
  auctionsResponse.map((auction) => ({
    status: auction.status,
    startDate: auction.startDate,
    endDate: auction.endDate,
    bidderCount: auction.bidderCount,
    prizeName: auction.prize.name,
    prizeImageUrl: auction.prize.promoImageUrl,
    prizeDescription: auction.prize.description,
    currentBidder: auction.currentBid?.user?.displayName || 'No bids yet',
    currentBidAmount: auction.currentBid?.amount,
    auctionId: auction.prize.id,
  }));
