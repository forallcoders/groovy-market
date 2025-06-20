import { walletFactoryContract } from "@/contracts/data/wallet-factory";
import { ethers } from 'ethers';

/**
 * Service for interacting with the wallet factory contract
 */
export class WalletFactoryService {
  private provider: ethers.JsonRpcProvider;
  private factoryContract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL!);

    // Initialize the wallet factory contract
    this.factoryContract = new ethers.Contract(
      walletFactoryContract.address,
      walletFactoryContract.abi,
      this.provider
    );
  }

  /**
   * Check if a wallet exists for a user
   */
  async walletExists(userAddress: string): Promise<boolean> {
    try {
      const walletAddress =
        await this.factoryContract.getWalletAddress(userAddress);
      return (
        walletAddress !== ethers.ZeroAddress &&
        (await this.factoryContract.validateWallet(walletAddress))
      );
    } catch (error) {
      console.error('Error checking wallet existence:', error);
      return false;
    }
  }

  /**
   * Get the wallet address for a user (returns zero address if not created)
   */
  async getWalletAddress(userAddress: string): Promise<string> {
    try {
      return await this.factoryContract.getWalletAddress(userAddress);
    } catch (error) {
      console.error('Error getting wallet address:', error);
      return ethers.ZeroAddress;
    }
  }

  /**
   * Validate if a wallet address is created by this factory
   */
  async validateWallet(walletAddress: string): Promise<boolean> {
    try {
      return await this.factoryContract.validateWallet(walletAddress);
    } catch (error) {
      console.error('Error validating wallet:', error);
      return false;
    }
  }
}
