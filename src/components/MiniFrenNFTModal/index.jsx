import React, { useEffect, useState, useContext } from 'react'
import {Modal} from '@material-ui/core'
import Button from '../Button';
import { BigNumber } from 'ethers'
import { useWallet } from 'use-wallet'
import breedImage from '../../assets/breed.png'
import baseLevelUpImage from '../../assets/fren_level_up.png'
import jobLevelUpImage from '../../assets/job_level_up.png'
import fruitHeistsImage from '../../assets/fruit_heists.png'
import NftInfo from '../NftInfo'
import { Context as ContractAPIContext } from '../../contexts/ContractAPIProvider/ContractAPIProvider';
import InfoModal from '../InfoModal'

import './style.css'

const fruits = [
  'Blueberry',
  'Grape',
  'Apple',
  'Watermelon'
];
const baseLevelsForHeist = [
  [25, 12],
  [50, 25],
  [75, 37],
  [100, 50]
];

const MiniFrenNFTModal = ({open, handleClose, item}) => {
  const { contractAPI } = useContext(ContractAPIContext);
  const { account } = useWallet();
  const [generation, setGeneration] = useState();
  const [baseLevel, setBaseLevel] = useState();
  const [jobLevel, setJobLevel] = useState();
  const [pendingMvGLD, setPendingMvGLD] = useState();
  const [heistLevel, setHeistLevel] = useState();
  const [fusionClaimed, setFusionClaimed] = useState();
  const [blacklisted, setBlacklisted] = useState();
  const [, setBreedLimited] = useState(false);
  const [selectingBurning, setSelectingBuring] = useState(false);
  const [miniFrenNFTItems, setMiniFrenNFTItems] = useState([]);
  const [image, setImage] = useState();
  const [infoOpen, setOpen] = useState(false);
  const [infoData, setInfoData] = useState({});

  useEffect(() => {
    if (item){
      (async () => {
        setImage(null);
        setSelectingBuring(false);
        setBaseLevel((await contractAPI.getBaseLevel(item.tokenId)).toNumber());
        setJobLevel((await contractAPI.getJobLevel(item.tokenId)).toNumber());
        setHeistLevel((await contractAPI.getHeistLevel(item.tokenId)).toNumber());
        setGeneration((await contractAPI.getGeneration(item.tokenId)).toNumber());
        setBlacklisted(await contractAPI.checkBlacklist(item.tokenId, item.tokenType));
        setBreedLimited(await contractAPI.isBreedLimited(item.tokenId, item.tokenType));
        setPendingMvGLD((await contractAPI.getClaimable(item.tokenId)).div(BigNumber.from('100000000000000')).toNumber() / 10000);
        const url = item.tokenURI.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
        const data = await (await fetch(url)).json();
        setImage(data.image.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/'));
      })();
    }
  }, [item, contractAPI]);

  useEffect(() => {
    if (item && heistLevel !== undefined) {
      (async () => {
        setFusionClaimed(await contractAPI.fusionClaimed(item.tokenId, heistLevel));
      })();
    }
  }, [heistLevel, item, contractAPI]);

  const baseLevelUp = async () => {
    await contractAPI.baseLevelUp(item.tokenId);
  }

  const jobLevelUp = async () => {
    await contractAPI.jobLevelUp(item.tokenId);
  }

  const startFusionLevelUp = async () => {
    setSelectingBuring(true);
    const _items = await contractAPI.getMiniFrenNFTItems(account);

    // Get base level and attach them for each nfts
    setMiniFrenNFTItems(_items.filter(
      _item => (
        item.tokenId !== _item.tokenId 
        && (_item.tokenGen.toNumber() >= generation || _item.tokenGen.toNumber() >= generation + 1)
        && _item.tokenBaseLevel.toNumber() >= baseLevelsForHeist[getFruitId(heistLevel + 1)][1]
        && _item.tokenBaseLevel <= baseLevel
      )
    ));
  }

  const fusionLevelUp = async (burning) => {
    await contractAPI.fusionLevelUp(burning, item.tokenId);
    setSelectingBuring(false);
    setTimeout(async () => {
      setHeistLevel((await contractAPI.getHeistLevel(item.tokenId)).toNumber());
    }, 2000);
  }

  const claim = async () => {
    await contractAPI.claimMVGLD([item.tokenId]);
  }

  const getFruitId = (level) => {
    if (level > 0 && level < 3) {
      return 0;
    } else if (level < 5) { 
      return 1;
    } else if (level < 9) {
      return 2;
    } else if (level < 12) {
      return 3;
    }
  }

  const claimFruit = async () => {
    await contractAPI.mintFusionLevelUp(item.tokenId);
    setTimeout(async () => {
      setFusionClaimed(await contractAPI.fusionClaimed(item.tokenId, heistLevel));
    }, 2000);
  }

  const breed = async () => {
    try {
      await contractAPI.mintFren(item.tokenId, item.tokenType);
    } catch(err) {
      console.log(err);
    }
  }

  const clearBlacklist = async () => {
    await contractAPI.clearBlacklist(item.tokenId, item.tokenType);
  }
  
  const openInfoModal = (infoImage, infoUrl) => {
    setInfoData({
      infoImage, infoUrl
    });
    setOpen(true);

  }

  const handleInfoClose = () => {
    setOpen(false);
  }

  return (
    <Modal
      aria-labelledby="connect a wallet"
      aria-describedby="connect your crypto wallet"
      open={open}
      style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}
      onClose={handleClose}
    >
      <div className="minifren-nft">
        <h1>MiniFren #{ item.tokenId }</h1>

        <div className="container">
          <section>
            <div className="nft-image">
              {
                image
                ? <img src={image} alt="nft" width="100%" height="100%"/>
                : <p> Loading... </p>
              }
            </div>
            <div className="nft-info">
              <p>Base Level: { baseLevel }</p>
              <p>Job Level: { jobLevel }</p>
              <p>Heist Level: { heistLevel }</p>
              <p>Pending MVGLD: { pendingMvGLD }</p>
            </div>
          </section>
          {
            !selectingBurning
            ? (
                <section>
                  <Button onClick={baseLevelUp}>
                    <NftInfo 
                      title="Level Up" 
                      subTitle="Base Level" 
                      hasQuestion
                      infoUrl="https://miniversefinance.gitbook.io/docs/nft-gamefi-utility/nft-nodes-breeding-game-coming-soon/minifren-leveling"
                    />
                  </Button>
                  <Button onClick={jobLevelUp}>
                    <NftInfo 
                      title="Level Up" 
                      subTitle="Job Level" 
                      hasQuestion
                      infoUrl="https://miniversefinance.gitbook.io/docs/nft-gamefi-utility/nft-nodes-breeding-game-coming-soon/mvgld-job-leveling" 
                    />
                  </Button>
                  {
                    getFruitId(heistLevel + 1) !== undefined 
                    && baseLevel >= baseLevelsForHeist[getFruitId(heistLevel + 1)][0] 
                    && !(heistLevel > 0 && fusionClaimed === false) &&
                    <Button onClick={startFusionLevelUp}>
                      <NftInfo
                        title="Fruit" 
                        subTitle="Heist" 
                        hasQuestion
                        infoUrl="https://miniversefinance.gitbook.io/docs/nft-gamefi-utility/nft-nodes-breeding-game-coming-soon/fruit-heists" 
                      />
                    </Button>
                  }
                  {
                    blacklisted === false
                    ? <Button onClick={breed}>
                      <NftInfo
                          title="Breed"
                          miniTitle="(Needs 1 Other MiniVerse NFT in Wallet)"
                          hasQuestion
                          infoUrl="https://miniversefinance.gitbook.io/docs/nft-gamefi-utility/nft-nodes-breeding-game-coming-soon"
                        />
                      </Button>
                    : <>
                        <NftInfo title="Needs" subTitle="Coffee" hasQuestion/>
                        <Button onClick={clearBlacklist}>
                          <NftInfo title="Feed MiniCoffee" subTitle="(Unblacklist)" />
                        </Button>
                      </>
                  }
                  <Button onClick={claim}>
                    <NftInfo title="Claim" subTitle="MvGLD" />
                  </Button>
                  {
                    heistLevel > 0 && fusionClaimed === false &&
                    <Button onClick={claimFruit}>
                      <NftInfo title="Claim" subTitle={fruits[getFruitId(heistLevel)]} />
                    </Button>
                  }
                </section>
              )
            : (
                <section>
                  <h2>Choose Which MiniFren To Burn</h2>
                  <div className="miniFrens">
                    {
                      miniFrenNFTItems.map((_item) => (
                        <button className="miniFren-item" onClick={() => {
                          fusionLevelUp(_item.tokenId);
                        }}>
                          <p className="name">MiniFren #{ _item.tokenId }</p>
                          <p className="level">Base Level: { _item.tokenBaseLevel.toNumber() }</p>
                        </button>
                      ))
                    }
                  </div>
                </section>
              )
          }
        </div>
      </div>
    </Modal>
  )
}

export default MiniFrenNFTModal
