import styled from "styled-components";
import { React, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from "react-redux";
import Modal from '@mui/material/Modal';
import Game4Modal from "./Game4Modal";
import Game4Rank from './../Ranking/Game4Rank';
import store, { GameState, changeGame, completeGame, getPreservedGameDataHandler, updateGameData } from "../../store";

function Game4() {
  const [open, setOpen] = useState(true);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const [open2, setOpen2] = useState(true);
  const handleOpen2 = () => setOpen2(true);
  const handleClose2 = () => setOpen2(false);

  const [isLoading, setIsLoading] = useState(false);
  const [intervalId, setIntervalId] = useState(null);

  const location = useLocation();
  const Playercnt = location.state.cnt;
  const img1 = ['img/game4/sound1.gif', 'img/game4/sound2.gif', 'img/game4/sound3.gif']

  const bgcolor = [' #B3CEE5   ', '#f1f5d2', ' #bfc7d6', '#c3ddd6  ']
  // const shuffle = (array) => {
  //   for(let index = array.length -1 ; index > 0; index--){
  //     // 무작위 index 값을 만든다. (0 이상의 배열 길이 값)
  //     const randomPosition = Math.floor(Math.random() * (index +1));

  //     // 임시로 원본 값을 저장하고, randomPosition을 사용해 배열 요소를 섞는다.
  //     const temporary = array[index];
  //     array[index] = array[randomPosition];
  //     array[randomPosition] =temporary;
  //   }
  //   return array
  // }
  // shuffle(bgcolor)

  const game = useSelector((state)=>state.game);
  const dispatch = useDispatch();
  const game4 = game.gameData.playerData;
  const players = game.playerViewPos;
  const timePerTurn = game.gameData.timePerTurn;
  const [timeLeft, setTimeLeft] = useState(timePerTurn);

  const clearUseState = () => {
    handleOpen();
    handleOpen2();
    setIsLoading(false);
    if(intervalId !== null){
      clearInterval(intervalId);
    }
    setIntervalId(null);
    setTimeLeft(timePerTurn);
  }

  useEffect(() => {
    if(game.gameState === GameState.PLAY && isLoading){
      
      dispatch(changeGame({data:{playerId: game.gameData.turn}}));
      setIntervalId(
        setInterval(() => {
          setTimeLeft((prevTime) => {
          if (prevTime === 0) {
            const game = store.getState().game;
            if(game.gameState !== GameState.PLAY){
              return 0;
            }
            const gameData = getPreservedGameDataHandler().onTurnChange(game);
            dispatch(updateGameData(gameData));
            dispatch(changeGame({data:{playerId: gameData.turn}}));
            return timePerTurn;
          } else {
            return prevTime - 1;
          }});}, 1000)
      );
      setIsLoading(false);
    }
  }, [isLoading]);

    if (game.gameState !== GameState.PLAY) {
      if( game.gameState === GameState.IDLE && game.gameResult){
        return <Modal open={open2}>
          <Game4Rank 
            handleClose = {handleClose2}
            result = {game.gameResult}
            beforeRestart = {clearUseState}
          ></Game4Rank>
        </Modal>
      } else {
        return (<>게임 생성 중입니다. 기다려주세요...</>)
      }
    } else {

  return (
  <>
  <Full>
  <Modal
    open={open}
    // onClose={handleClose}
  >
    <Game4Modal handleClose = {()=>{setIsLoading(true);handleClose()}} />
  </Modal>    
  <Side>
  <TimeLeft>{timeLeft}</TimeLeft>
  <Progress value={timeLeft} max={timePerTurn} />
  <Quit onClick={() => {if(intervalId!==null)clearInterval(intervalId);setIntervalId(null);dispatch(completeGame({}))} /* 비동기 통신이므로 여기에 navigate 를 달면 큰일난다. 방법1. complete callback을 달기 방법2. hook으로 game.gameState == 0 감지하기, 방법 3. hook으로 game.gameResult가 변경됨을 감지하기,  */     }>QUIT</Quit>
  </Side>
  <Display>
    {players.map(function (e, i) {
      return (
    <PlayerDisplay index={i} style={{backgroundColor : `${bgcolor[i]}`}}>
    <Player>PLAYER {game4[i].playerId}</Player>
    <STATE>
    {/* <IMG 
    src={img1[i]}></IMG> */}
    { game4[i].db < 80 && <IMG 
    src={img1[0]}></IMG>}
    { game4[i].db >= 80 && game4[i].db < 100 && <IMG 
    src={img1[1]}></IMG>}
    { game4[i].db >= 100 && <IMG 
    src={img1[2]}></IMG>}
    <CNT>{game4[i].db}</CNT>
    </STATE>
    {(i === game.gameData.turnIndex)?<Turn>TURN</Turn>:<></>}
    </PlayerDisplay>
    )
    })}
  </Display>
  </Full>
    </>
    )
  }
}

const Progress = styled.progress`
  /* appearance: none;  */
 &:-webkit-progress-bar {
  background:#f0f0f0;
  border-radius:10px;
  box-shadow: inset 3px 3px 10px #ccc;
 }
 &:-webkit-progress-value {
    border-radius:10px;
    background: #1D976C;
    background: -webkit-linear-gradient(to right, #93F9B9, #1D976C);
    background: linear-gradient(to right, #93F9B9, #1D976C);
}
`
const TimeLeft = styled.div`
  padding : 0 5vh;
  font-weight: bold;
  font-family: 'Jua', sans-serif;
  filter: drop-shadow(0.2vh 0.2vh 0.1vh rgb(0 0 0 / 0.5));
`
const CNT = styled.div`
  /* font-family: 'Silkscreen', cursive; */
  font-family: 'Changa', sans-serif;
  /* font-family: 'Hanalei Fill', cursive; */
  /* font-family: 'Nabla', cursive; */
  /* font-family: 'Orbitron', sans-serif; */
  /* font-family: 'Shojumaru', cursive; */
  /* font-family: 'Silkscreen', cursive; */
  font-size: 13vh;
`
const Turn = styled.div`
  display : flex;
  font-size: 5vh;
  font-family: 'Jua', sans-serif;
  font-weight: bold;
  color : #da341f;
`
const STATE = styled.div`
  display : flex;
  justify-content: center;
  align-items: center ;
`
const Player = styled.div`
  display : flex;
  font-size: 5vh;
  font-family: 'Jua', sans-serif;
  font-weight: bold;
`
const IMG = styled.img`
  display : flex;
  height : 15vh;
  padding : 2vh 5vh;
`

const Full = styled.div`
  display : flex;
  flex-wrap: wrap;
  width : 100vw;
  background : #d1e1f0;
`
const Display = styled.div`
  display : flex;
  flex-wrap: wrap;
  width : 100%;
  height : 85%;
`
const Side = styled.div`
  display : flex;
  width : 100%;
  height : 15%;
  justify-content: center;
  align-items: center ;
  font-size: 8vh;
`
const Quit = styled.div`
  padding : 0 8vh;
  color : #004680;
  font-size: 5vh;
  font-family: 'Jua', sans-serif;
  font-weight : bold;
  letter-spacing: 0.3vh;
  &:hover {
    color: #da341f;
  }
` 
const PlayerDisplay = styled.div`
  display : flex;
  justify-content: center;
  align-items: center ;
  flex: 1 1 50%;
  display: flex;
  flex-direction: column;
  /* box-shadow: 0 1px 2px #063C69, 0 1px 2px #063C69 inset; */
  /* background-image: url(${'img/game4/whale.gif'}); */
`
export default Game4