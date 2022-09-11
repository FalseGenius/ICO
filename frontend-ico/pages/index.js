import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import {BigNumber, Contract, providers, utils} from 'ethers';
import {useRef, useEffect, useState} from 'react';
import Web3Modal from 'web3modal';
import {
  NFT_CONTRACT_ABI,
  NFT_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";

export default function Home() {
  const zero = BigNumber.from(0);
  const [walletConnected, setWalletConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
  const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] = useState(zero);
  const [tokenAmount, setTokenAmount] = useState(zero);
  const [tokensMinted, setTokensMinted] = useState(zero);
  const [isOwner, setIsOwner] = useState(false);

  const web3ModalRef = useRef();


  const getProviderOrSigner = async (needSigner=false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
    const {chainId} = await web3Provider.getNetwork();
    if (chainId != 5) {
      window.alert("Change network to Goerli");
      throw new Error("Change network to Goerli");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  }

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.log(err);
    }
  }
 
  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: 'goerli', 
        providerOptions: {},
        disableInjectedProvider: false
      });

      connectWallet();
      getTotalTokensMinted();
      getBalanceOfCryptoDevTokens();
      getTokensToBeClaimed();
      withdrawCoins();
    }
  }, [walletConnected]);

  const getTokensToBeClaimed = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract (
        NFT_CONTRACT_ADDRESS, 
        NFT_CONTRACT_ABI,
        provider
      );

      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );

      const signer = await getProviderOrSigner(true);
      const address = signer.getAddress();
      const balance = await nftContract.balanceOf(address);
      if (balance === zero) setTokensToBeClaimed(zero);
      else {
        let amount = 0;
        for(let i = 0; i < balance; i++) {
          const tokenId = await nftContract.tokenOfOwnerByIndex(i);
          const claimed = await tokenContract.tokenIdsClaimed(tokenId);
          if (!claimed) amount++;
        }
        setTokensToBeClaimed(BigNumber.from(amount));
      }

    } catch (err) {
      console.log(err);
      setTokensToBeClaimed(zero);
    }
  }

  const getBalanceOfCryptoDevTokens = async () => {
    try {
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );

      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      const balance = await tokenContract.balanceOf(address);
      setBalanceOfCryptoDevTokens(balance);
    } catch (err) {
      console.log(err);
      setBalanceOfCryptoDevTokens(zero);
    }
  }

  const mintCryptoDevToken = async (amount) => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI, 
        signer
      );

      const value = 0.001 * amount;
      const tx = await tokenContract.mint(amount, {
        value: utils.parseEther(value.toString())
      });
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("Successfully minted CD Tokens");
      await getBalanceOfCryptoDevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (err) {
      console.log(err);
    }
  }

  const claimCryptoDevTokens = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS, 
        TOKEN_CONTRACT_ABI,
        signer
      );
      
      const tx = await tokenContract.claim();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert('Successfully claimed CD tokens');
      await getBalanceOfCryptoDevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();

    } catch (err) {
      console.log(err);
    }
  }

  const getTotalTokensMinted = async () => {
    try {
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS, 
        TOKEN_CONTRACT_ABI,
        provider
      );

      
      const _tokensMinted = await tokenContract.totalSupply();
      setTokensMinted(_tokensMinted);

    } catch (err) {
      console.log(err);
    }
  }

  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS, 
        TOKEN_CONTRACT_ABI,
        provider
      )

      const _owner = await tokenContract.owner();
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      if(address.toLowerCase() === _owner.toLowerCase()) setIsOwner(true); 

    } catch (err) {
      console.log(err.message);
    }
  }

  const withdrawCoins = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS, 
        TOKEN_CONTRACT_ABI,
        signer
      );

      const tx = await tokenContract.withdraw();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      await getOwner();

    } catch (err) {
      console.log(err);
    }
  }


  const renderButton = () => {
    if (loading) {
      return (
        <div>
          <button className={styles.button}>Loading...</button>
        </div>
      );
    }

    if (walletConnected && isOwner) {
      return (
        <div>
          <button className={styles.button1} onClick={withdrawCoins}>
            Withdraw Coins
          </button>
        </div>
      );
    }

    if (tokensToBeClaimed > 0) {
      return (
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed * 10} Tokens can be claimed!
          </div>
          <button className={styles.button} onClick={claimCryptoDevTokens}>
            Claim Tokens
          </button>
        </div>
      );
    }

    return (
      <div style={{ display: "flex-col" }}>
        <div>
          <input
            type="number"
            placeholder="Amount of Tokens"

            onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
            className={styles.input}
          />
        </div>

        <button
          className={styles.button}
          disabled={!(tokenAmount > 0)}
          onClick={() => mintCryptoDevToken(tokenAmount)}
        >
          Mint Tokens
        </button>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="ICO-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs ICO!</h1>
          <div className={styles.description}>
            You can claim or mint Crypto Dev tokens here
          </div>
          {walletConnected ? (
            <div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                You have minted {utils.formatEther(balanceOfCryptoDevTokens)} Crypto
                Dev Tokens
              </div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                Overall {utils.formatEther(tokensMinted)}/10000 have been minted!!!
              </div>
              {renderButton()}
            </div>
          ) : (
            <button onClick={connectWallet} className={styles.button}>
              Connect your wallet
            </button>
          )}
        </div>
        <div>
          <img className={styles.image} src="./0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  )
}
