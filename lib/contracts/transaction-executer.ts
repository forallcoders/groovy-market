import { forwarderContract } from "@/contracts/data/forwarder";
import { ethers } from 'ethers';
import { RELAYER_PRIVATE_KEY } from "../config";

// Forward request data structure as used by ERC2771Forwarder
export interface ForwardRequestData {
  from: string;
  to: string;
  value: string;
  gas: string;
  nonce: string;
  deadline: string;
  data: string;
  signature: string;
}

/**
 * Server-side service for executing pre-signed transactions via ERC2771Forwarder
 */
export class ServerTransactionExecutor {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private forwarderContract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL!);
    this.wallet = new ethers.Wallet(RELAYER_PRIVATE_KEY, this.provider);

    // Initialize the forwarder contract with execution functionality
    this.forwarderContract = new ethers.Contract(
      forwarderContract.address,
      forwarderContract.abi,
      this.wallet
    );
  }

  /**
   * Execute a pre-signed forward request
   */
  async executeTransaction(signedRequest: ForwardRequestData) {
    try {
      // Convert string values to BigInt for the execution
      const forwardRequestData = {
        from: signedRequest.from,
        to: signedRequest.to,
        value: BigInt(signedRequest.value),
        gas: BigInt(signedRequest.gas),
        deadline: BigInt(signedRequest.deadline),
        data: signedRequest.data,
        signature: signedRequest.signature,
      };

      // The execute method of ERC2771Forwarder takes a single ForwardRequestData parameter
      const tx = await this.forwarderContract.execute(forwardRequestData);
      const receipt = await tx.wait();

      return { tx, receipt };
    } catch (error) {
      console.error('Error executing transaction:', error);
      throw error;
    }
  }

  /**
   * Verify a signed request without executing it
   */
  async verifyRequest(signedRequest: ForwardRequestData): Promise<boolean> {
    try {
      // Convert string values to BigInt for the verification
      const forwardRequestData = {
        from: signedRequest.from,
        to: signedRequest.to,
        value: BigInt(signedRequest.value),
        gas: BigInt(signedRequest.gas),
        deadline: BigInt(signedRequest.deadline),
        data: signedRequest.data,
        signature: signedRequest.signature,
      };

      return await this.forwarderContract.verify(forwardRequestData);
    } catch (error) {
      console.error('Error verifying request:', error);
      return false;
    }
  }
}
