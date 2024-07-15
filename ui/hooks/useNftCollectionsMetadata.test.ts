import { renderHook } from '@testing-library/react-hooks';
import { Collection } from '@metamask/assets-controllers';
import { TokenStandard } from '../../shared/constants/transaction';
import { getCurrentChainId } from '../selectors';
import {
  getNFTContractInfo,
  getTokenStandardAndDetails,
} from '../store/actions';
import { useNftCollectionsMetadata } from './useNftCollectionsMetadata';

type TokenStandardResponse = {
  standard: TokenStandard;
};

jest.mock('react-redux', () => ({
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useSelector: (selector: any) => selector(),
}));

jest.mock('../selectors', () => ({
  getCurrentChainId: jest.fn(),
}));

jest.mock('../store/actions', () => ({
  getNFTContractInfo: jest.fn(),
  getTokenStandardAndDetails: jest.fn(),
}));

const CHAIN_ID_MOCK = '0x1';
const ERC_721_ADDRESS_1 = '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb';
const ERC_721_COLLECTION_1_MOCK = {
  image: 'url1',
  isSpam: false,
  name: 'Erc 721 1',
};

const ERC_721_ADDRESS_2 = '0x06012c8cf97bead5deae237070f9587f8e7a266d';
const ERC_721_COLLECTION_2_MOCK = {
  image: 'url2',
  isSpam: false,
  name: 'Erc 721 2',
};

describe('useNftCollectionsMetadata', () => {
  const mockGetCurrentChainId = jest.mocked(getCurrentChainId);
  const mockGetNFTContractInfo = jest.mocked(getNFTContractInfo);
  const mockGetTokenStandardAndDetails = jest.mocked(
    getTokenStandardAndDetails,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    mockGetCurrentChainId.mockReturnValue(CHAIN_ID_MOCK);
    mockGetNFTContractInfo.mockResolvedValue({
      collections: [ERC_721_COLLECTION_1_MOCK, ERC_721_COLLECTION_2_MOCK],
    });
    mockGetTokenStandardAndDetails
      .mockResolvedValueOnce({
        standard: TokenStandard.ERC721,
      } as TokenStandardResponse)
      .mockResolvedValueOnce({
        standard: TokenStandard.ERC721,
      } as TokenStandardResponse);
  });

  it('calls NFT tokens API and returns the correct data structure', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useNftCollectionsMetadata([
        {
          value: ERC_721_ADDRESS_1,
        },
        {
          value: ERC_721_ADDRESS_2,
        },
      ]),
    );

    await waitForNextUpdate();

    expect(mockGetNFTContractInfo).toHaveBeenCalledTimes(1);
    expect(result.current).toStrictEqual({
      [ERC_721_ADDRESS_1.toLowerCase()]: ERC_721_COLLECTION_1_MOCK,
      [ERC_721_ADDRESS_2.toLowerCase()]: ERC_721_COLLECTION_2_MOCK,
    });
  });

  describe('does not call NFT tokens API', () => {
    it('if there are no contracts to fetch', async () => {
      renderHook(() => useNftCollectionsMetadata([]));
      expect(mockGetNFTContractInfo).not.toHaveBeenCalled();
    });

    it('if there are no valid nft request', async () => {
      // getTokenStandardAndDetails returns that the standard is ERC20
      mockGetTokenStandardAndDetails.mockReset().mockResolvedValueOnce({
        standard: TokenStandard.ERC20,
      });

      renderHook(() =>
        useNftCollectionsMetadata([
          {
            value: '0xERC20Address',
          },
        ]),
      );
      expect(mockGetNFTContractInfo).not.toHaveBeenCalled();
    });

    it('if token standard request fails', async () => {
      mockGetTokenStandardAndDetails
        .mockReset()
        .mockRejectedValue(new Error('api error'));

      renderHook(() =>
        useNftCollectionsMetadata([
          {
            value: '0xERC20Address',
          },
        ]),
      );
      expect(mockGetNFTContractInfo).not.toHaveBeenCalled();
    });
  });

  it('does memoise result for same requests', async () => {
    const { waitForNextUpdate, rerender } = renderHook(() =>
      useNftCollectionsMetadata([
        {
          value: ERC_721_ADDRESS_1,
        },
        {
          value: ERC_721_ADDRESS_2,
        },
      ]),
    );

    await waitForNextUpdate();
    rerender();

    expect(mockGetNFTContractInfo).toHaveBeenCalledTimes(1);
  });
});
